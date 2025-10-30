import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable, from, throwError, Subject, of } from 'rxjs';
import {
  map,
  switchMap,
  catchError,
  shareReplay,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import {
  DataRoomShare,
  DataRoomAccessRequest,
  CreateShareRequest,
  UpdateShareRequest,
  CreateAccessRequestRequest,
  ApproveAccessRequestRequest,
  RejectAccessRequestRequest,
  AccessStatus,
  transformShareFromDB,
  transformAccessRequestFromDB,
} from '../models/data-room.models';

// Constants
const SHARE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedShares {
  observable: Observable<DataRoomShare[]>;
  timestamp: number;
}

/**
 * DataRoomSharingService
 * - Removes AuthService injection (use supabase.getCurrentUserId())
 * - Simplifies validation flow (combined queries)
 * - Adds caching for share lists
 * - Standardized error handling
 * - Proper cleanup on destroy
 */
@Injectable({
  providedIn: 'root',
})
export class DataRoomSharingService implements OnDestroy {
  private supabase = inject(SharedSupabaseService);
  private destroy$ = new Subject<void>();

  // Cache shares to avoid redundant queries
  private shareCache = new Map<string, CachedShares>();

  constructor() {
    console.log('✅ DataRoomSharingService initialized');
  }
  private checkExistingRequest(
    dataRoomId: string,
    requesterId: string
  ): Observable<DataRoomAccessRequest | null> {
    return from(
      this.supabase
        .from('data_room_access_requests')
        .select('*')
        .eq('data_room_id', dataRoomId)
        .eq('requester_id', requesterId)
        .eq('status', 'pending')
        .maybeSingle()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ? transformAccessRequestFromDB(data) : null;
      })
    );
  }

  /**
   * Get incoming access requests for SME's data room
   * Uses RPC function to get requester details from auth.users
   */
  // getIncomingRequests(
  //   organizationId?: string
  // ): Observable<DataRoomAccessRequest[]> {
  //   const userId = organizationId || this.supabase.getCurrentUserId();

  //   if (!userId) {
  //     return throwError(() => new Error('User not authenticated'));
  //   }

  //   return from(
  //     this.supabase.rpc('get_access_requests_with_requester', {
  //       org_id: userId,
  //     })
  //   ).pipe(
  //     map(({ data, error }) => {
  //       if (error) throw error;

  //       return (data || []).map(
  //         (req: {
  //           requester_id: any;
  //           requester_email: any;
  //           contact_email: any;
  //           requester_name: any;
  //           organization_name: any;
  //           data_room_id: any;
  //           data_room_title: any;
  //         }) => {
  //           const transformed = transformAccessRequestFromDB(req);

  //           // Use data from RPC function
  //           transformed.requester = {
  //             id: req.requester_id,
  //             email: req.requester_email || req.contact_email,
  //             name: req.requester_name || req.organization_name,
  //           };

  //           transformed.dataRoom = {
  //             id: req.data_room_id,
  //             title: req.data_room_title,
  //           };

  //           return transformed;
  //         }
  //       );
  //     }),
  //     catchError((error) => {
  //       console.error('❌ Failed to load incoming requests:', error);
  //       return of([]);
  //     })
  //   );
  // }

  // Update createAccessRequest to use correct column:
  createAccessRequest(
    request: CreateAccessRequestRequest
  ): Observable<DataRoomAccessRequest> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    const accessRequestData = {
      data_room_id: request.dataRoomId,
      requester_id: userId, // Changed from requested_by_user_id
      requested_sections: request.requestedSections || null,
      request_reason: request.requestReason || null, // Changed from message
      organization_name: request.organizationName || null,
      contact_email: request.contactEmail || null,
      status: 'pending' as const,
      metadata: {},
    };

    return from(
      this.supabase
        .from('data_room_access_requests')
        .insert(accessRequestData)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return transformAccessRequestFromDB(data);
      }),
      tap(() => this.invalidateAllShareCaches()),
      catchError((error) => {
        console.error('❌ Error creating access request:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  // Update approveAccessRequest method:
  private async createShareFromApproval(
    userId: string,
    accessRequest: any,
    approvalRequest: ApproveAccessRequestRequest
  ): Promise<DataRoomShare> {
    const shareData = {
      data_room_id: accessRequest.data_room_id,
      shared_with_user_id: accessRequest.requester_id, // Changed from requested_by_user_id
      shared_by_user_id: userId,
      permission_level: approvalRequest.permissionLevel,
      allowed_sections:
        approvalRequest.allowedSections || accessRequest.requested_sections,
      internal_notes: null,
      status: 'active',
      expires_at: approvalRequest.expiresAt
        ? approvalRequest.expiresAt.toISOString()
        : null,
    };

    const { data: shareData_, error: shareError } = await this.supabase
      .from('data_room_shares')
      .insert(shareData)
      .select()
      .single();

    if (shareError) throw shareError;

    // Update access request
    await this.supabase
      .from('data_room_access_requests')
      .update({
        status: 'approved' as const,
        reviewed_by_user_id: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', accessRequest.id);

    return transformShareFromDB(shareData_);
  }

  // Update getPendingRequestForUser method:
  private async getPendingRequestForUser(
    dataRoomId: string,
    userId: string
  ): Promise<DataRoomAccessRequest | null> {
    const { data } = await this.supabase
      .from('data_room_access_requests')
      .select('*')
      .eq('data_room_id', dataRoomId)
      .eq('requester_id', userId) // Changed from requested_by_user_id
      .eq('status', 'pending')
      .maybeSingle();

    return data ? transformAccessRequestFromDB(data) : null;
  }
  // ============================================
  // SME: REQUEST MANAGEMENT METHODS
  // ============================================

  /**
   * Get incoming access requests for SME's data room
   */

  /**
   * Request access to a data room
   */
  requestAccess(
    request: CreateAccessRequestRequest
  ): Observable<DataRoomAccessRequest> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Check if request already exists
    return this.checkExistingRequest(request.dataRoomId, userId).pipe(
      switchMap((existingRequest) => {
        if (existingRequest) {
          return throwError(
            () =>
              new Error('You already have a pending request for this data room')
          );
        }

        const requestData = {
          data_room_id: request.dataRoomId,
          requester_id: userId,
          request_reason: request.requestReason,
          requested_sections: request.requestedSections || null,
          organization_name: request.organizationName,
          contact_email: request.contactEmail,
          status: 'pending',
        };

        return from(
          this.supabase
            .from('data_room_access_requests')
            .insert(requestData)
            .select()
            .single()
        );
      }),
      map(({ data, error }) => {
        if (error) throw error;
        return transformAccessRequestFromDB(data);
      }),
      tap(() => {
        // Trigger email notification to data room owner
        this.triggerAccessRequestNotification(request.dataRoomId, userId);
      })
    );
  }

  // ===============================
  // SHARE MANAGEMENT
  // ===============================

  /**
   * Share data room with a funder
   * FIXED: Validation + creation in single flow
   */
  shareDataRoom(request: CreateShareRequest): Observable<DataRoomShare> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Validate ownership + check existing share in parallel
    return from(
      this.validateAndCheckShare(
        request.dataRoomId,
        request.sharedWithUserId,
        userId
      )
    ).pipe(
      switchMap(() => this.createShareRecord(userId, request)),
      switchMap((shareRecord) =>
        // If specific documents are shared, create junction records
        request.documentIds && request.documentIds.length > 0
          ? this.addSharedDocuments(shareRecord.id, request.documentIds).pipe(
              map(() => shareRecord)
            )
          : from([shareRecord])
      ),
      map((shareRecord) => transformShareFromDB(shareRecord)),
      tap(() => {
        this.invalidateShareCache(request.dataRoomId);
        // Trigger email notification via edge function
        this.triggerShareNotification(
          request.dataRoomId,
          request.sharedWithUserId
        );
      }),
      catchError((error) => {
        console.error('❌ Error sharing data room:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Update share permissions
   */
  updateSharePermissions(
    request: UpdateShareRequest
  ): Observable<DataRoomShare> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Validate ownership
    return from(this.validateShareOwnership(request.shareId, userId)).pipe(
      switchMap(() => this.updateShare(request)),
      tap(() => this.invalidateAllShareCaches()),
      catchError((error) => {
        console.error('❌ Error updating share permissions:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Revoke share
   */
  revokeShare(shareId: string): Observable<void> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Validate ownership
    return from(this.validateShareOwnership(shareId, userId)).pipe(
      switchMap(() =>
        from(
          this.supabase
            .from('data_room_shares')
            .update({ status: 'revoked' })
            .eq('id', shareId)
        )
      ),
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => this.invalidateAllShareCaches()),
      catchError((error) => {
        console.error('❌ Error revoking share:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get all shares for a data room (cached)
   */
  getDataRoomShares(dataRoomId: string): Observable<DataRoomShare[]> {
    const cached = this.getValidCache(dataRoomId);
    if (cached) {
      return cached;
    }

    const observable = from(
      this.supabase
        .from('data_room_shares')
        .select('*')
        .eq('data_room_id', dataRoomId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(transformShareFromDB);
      }),
      catchError((error) => {
        console.error('❌ Error fetching shares:', error);
        return throwError(() => error);
      }),
      shareReplay(1),
      takeUntil(this.destroy$)
    );

    this.shareCache.set(dataRoomId, { observable, timestamp: Date.now() });
    return observable;
  }

  /**
   * Check access status for a user to a data room
   */
  checkAccess(dataRoomId: string, userId?: string): Observable<AccessStatus> {
    const checkUserId = userId || this.supabase.getCurrentUserId();

    if (!checkUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      Promise.all([
        this.getActiveShareForUser(dataRoomId, checkUserId),
        this.getPendingRequestForUser(dataRoomId, checkUserId),
      ])
    ).pipe(
      map(([share, request]) => {
        if (share) {
          return {
            hasAccess: true,
            shareId: share.id,
            permissionLevel: share.permissionLevel,
            expiresAt: share.expiresAt,
            pendingRequestId: undefined,
          };
        }

        if (request) {
          return {
            hasAccess: false,
            pendingRequestId: request.id,
          };
        }

        return {
          hasAccess: false,
        };
      }),
      catchError((error) => {
        console.error('❌ Error checking access:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }
  private triggerAccessRequestNotification(
    dataRoomId: string,
    requesterId: string
  ): void {
    console.log('Triggering access request notification', {
      dataRoomId,
      requesterId,
    });
  }
  /**
   * Get active shares for a data room
   */
  getActiveShares(dataRoomId: string): Observable<DataRoomShare[]> {
    return from(
      this.supabase
        .from('data_room_shares')
        .select('*')
        .eq('data_room_id', dataRoomId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(transformShareFromDB);
      }),
      catchError((error) => {
        console.error('❌ Error fetching active shares:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get shares received by a user
   */
  getReceivedShares(userId?: string): Observable<DataRoomShare[]> {
    const targetUserId = userId || this.supabase.getCurrentUserId();

    if (!targetUserId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabase
        .from('data_room_shares')
        .select('*')
        .eq('shared_with_user_id', targetUserId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(transformShareFromDB);
      }),
      catchError((error) => {
        console.error('❌ Error fetching received shares:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  // ===============================
  // ACCESS REQUESTS
  // ===============================

  /**
   * Create access request (for funders to request access)
   */

  /**
   * Get access requests for a data room
   */
  getAccessRequests(dataRoomId: string): Observable<DataRoomAccessRequest[]> {
    return from(
      this.supabase
        .from('data_room_access_requests')
        .select('*')
        .eq('data_room_id', dataRoomId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(transformAccessRequestFromDB);
      }),
      catchError((error) => {
        console.error('❌ Error fetching access requests:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get pending access requests for a data room
   */
  getPendingAccessRequests(
    dataRoomId: string
  ): Observable<DataRoomAccessRequest[]> {
    return from(
      this.supabase
        .from('data_room_access_requests')
        .select('*')
        .eq('data_room_id', dataRoomId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(transformAccessRequestFromDB);
      }),
      catchError((error) => {
        console.error('❌ Error fetching pending requests:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Approve access request
   */
  approveAccessRequest(
    request: ApproveAccessRequestRequest
  ): Observable<DataRoomShare> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Get access request details
    return from(this.getAccessRequestRecord(request.requestId)).pipe(
      switchMap((accessRequest) => {
        // Validate ownership of data room
        return from(
          this.validateDataRoomOwnership(accessRequest.data_room_id, userId)
        ).pipe(map(() => accessRequest));
      }),
      switchMap((accessRequest) =>
        // Create share from approved request
        from(this.createShareFromApproval(userId, accessRequest, request))
      ),
      tap(() => this.invalidateAllShareCaches()),
      catchError((error) => {
        console.error('❌ Error approving access request:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Reject access request
   */
  rejectAccessRequest(request: RejectAccessRequestRequest): Observable<void> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Get access request
    return from(this.getAccessRequestRecord(request.requestId)).pipe(
      switchMap((accessRequest) => {
        // Validate ownership
        return from(
          this.validateDataRoomOwnership(accessRequest.data_room_id, userId)
        ).pipe(map(() => accessRequest.id));
      }),
      switchMap((accessRequestId) =>
        from(
          this.supabase
            .from('data_room_access_requests')
            .update({
              status: 'rejected' as const,
              rejection_reason: request.reviewNotes || null,
            })
            .eq('id', accessRequestId)
        )
      ),
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => this.invalidateAllShareCaches()),
      catchError((error) => {
        console.error('❌ Error rejecting access request:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  // ===============================
  // PRIVATE HELPERS
  // ===============================

  /**
   * Validate and check share (combined)
   */
  private async validateAndCheckShare(
    dataRoomId: string,
    sharedWithUserId: string,
    userId: string
  ): Promise<void> {
    // Validate ownership
    await this.validateDataRoomOwnership(dataRoomId, userId);

    // Check existing share
    const existing = await this.checkExistingShare(
      dataRoomId,
      sharedWithUserId
    );
    if (existing) {
      throw new Error('Active share already exists for this user');
    }
  }

  /**
   * Validate data room ownership
   */
  private async validateDataRoomOwnership(
    dataRoomId: string,
    userId: string
  ): Promise<void> {
    const { data, error } = await this.supabase
      .from('data_rooms')
      .select('id')
      .eq('id', dataRoomId)
      .eq('organization_id', userId)
      .single();

    if (error || !data) {
      throw new Error('You do not own this data room');
    }
  }

  /**
   * Validate share ownership
   */
  private async validateShareOwnership(
    shareId: string,
    userId: string
  ): Promise<void> {
    const { data, error } = await this.supabase
      .from('data_room_shares')
      .select('id')
      .eq('id', shareId)
      .eq('shared_by_user_id', userId)
      .single();

    if (error || !data) {
      throw new Error('You do not own this share');
    }
  }

  /**
   * Check if share already exists
   */
  private async checkExistingShare(
    dataRoomId: string,
    sharedWithUserId: string
  ): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('data_room_shares')
      .select('id')
      .eq('data_room_id', dataRoomId)
      .eq('shared_with_user_id', sharedWithUserId)
      .eq('status', 'active')
      .maybeSingle();

    return !error && !!data;
  }

  /**
   * Create share record
   */
  private async createShareRecord(
    userId: string,
    request: CreateShareRequest
  ): Promise<any> {
    const shareData = {
      data_room_id: request.dataRoomId,
      shared_with_user_id: request.sharedWithUserId,
      shared_by_user_id: userId,
      permission_level: request.permissionLevel,
      allowed_sections: request.allowedSections || null,
      internal_notes: request.internalNotes || null,
      status: 'active',
      expires_at: request.expiresAt ? request.expiresAt.toISOString() : null,
    };

    const { data, error } = await this.supabase
      .from('data_room_shares')
      .insert(shareData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update share record
   */
  private async updateShare(
    request: UpdateShareRequest
  ): Promise<DataRoomShare> {
    const updates: any = {};

    if (request.permissionLevel !== undefined) {
      updates.permission_level = request.permissionLevel;
    }
    if (request.allowedSections !== undefined) {
      updates.allowed_sections = request.allowedSections;
    }
    if (request.expiresAt !== undefined) {
      updates.expires_at = request.expiresAt
        ? request.expiresAt.toISOString()
        : null;
    }

    const { data, error } = await this.supabase
      .from('data_room_shares')
      .update(updates)
      .eq('id', request.shareId)
      .select()
      .single();

    if (error) throw error;
    return transformShareFromDB(data);
  }

  /**
   * Add shared documents (junction table)
   */
  private addSharedDocuments(
    shareId: string,
    documentIds: string[]
  ): Observable<void> {
    const junctionRecords = documentIds.map((docId) => ({
      data_room_share_id: shareId,
      document_id: docId,
    }));

    return from(
      this.supabase.from('data_room_share_documents').insert(junctionRecords)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((error) => {
        console.error('❌ Error adding shared documents:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get access request record
   */
  private async getAccessRequestRecord(accessRequestId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('data_room_access_requests')
      .select('*')
      .eq('id', accessRequestId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create share from approved request
   */

  /**
   * Get active share for a user
   */
  private async getActiveShareForUser(
    dataRoomId: string,
    userId: string
  ): Promise<DataRoomShare | null> {
    const { data } = await this.supabase
      .from('data_room_shares')
      .select('*')
      .eq('data_room_id', dataRoomId)
      .eq('shared_with_user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    return data ? transformShareFromDB(data) : null;
  }

  /**
   * Get pending request for a user
   */

  /**
   * Trigger share notification
   */
  private triggerShareNotification(
    dataRoomId: string,
    sharedWithUserId: string
  ): void {
    // Trigger edge function or webhook
    console.log(`📧 Share notification triggered for ${sharedWithUserId}`);
  }

  /**
   * Get valid cache
   */
  private getValidCache(
    dataRoomId: string
  ): Observable<DataRoomShare[]> | null {
    const cached = this.shareCache.get(dataRoomId);

    if (!cached) {
      return null;
    }

    if (Date.now() - cached.timestamp > SHARE_CACHE_TTL) {
      this.shareCache.delete(dataRoomId);
      return null;
    }

    return cached.observable;
  }

  /**
   * Invalidate cache for specific data room
   */
  private invalidateShareCache(dataRoomId: string): void {
    this.shareCache.delete(dataRoomId);
  }

  /**
   * Invalidate all caches
   */
  private invalidateAllShareCaches(): void {
    this.shareCache.clear();
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    console.log('🧹 DataRoomSharingService destroyed');
    this.destroy$.next();
    this.destroy$.complete();
    this.shareCache.clear();
  }
}
