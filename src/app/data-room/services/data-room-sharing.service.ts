// // src/app/SMEs/data-room/services/data-room-sharing.service.ts
// import { Injectable, inject } from '@angular/core';
// import { Observable, from, throwError, forkJoin, of } from 'rxjs';
// import { map, switchMap, catchError, tap } from 'rxjs/operators';
// import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
// import { AuthService } from 'src/app/auth/production.auth.service';
// import {
//   DataRoomShare,
//   DataRoomAccessRequest,
//   CreateShareRequest,
//   UpdateShareRequest,
//   CreateAccessRequestRequest,
//   ApproveAccessRequestRequest,
//   RejectAccessRequestRequest,
//   AccessStatus,
//   transformShareFromDB,
//   transformAccessRequestFromDB
// } from '../models/data-room.models';

// @Injectable({
//   providedIn: 'root'
// })
// export class DataRoomSharingService {
//   private supabase = inject(SharedSupabaseService);
//   private authService = inject(AuthService);

//   // ============================================
//   // SME: SHARING METHODS
//   // ============================================

//   /**
//    * Share data room with a funder
//    * Supports bulk document sharing
//    */
//   shareDataRoom(request: CreateShareRequest): Observable<DataRoomShare> {
//     const userId = this.authService.user()?.id;
    
//     if (!userId) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     // Validate that user owns the data room
//     return this.validateDataRoomOwnership(request.dataRoomId, userId).pipe(
//       switchMap(() => {
//         // Check if share already exists
//         return this.checkExistingShare(request.dataRoomId, request.sharedWithUserId);
//       }),
//       switchMap(existingShare => {
//         if (existingShare) {
//           return throwError(() => new Error('Active share already exists for this user'));
//         }

//         // Create share record
//         const shareData = {
//           data_room_id: request.dataRoomId,
//           shared_with_user_id: request.sharedWithUserId,
//           shared_by_user_id: userId,
//           permission_level: request.permissionLevel,
//           allowed_sections: request.allowedSections || null,
//           internal_notes: request.internalNotes || null,
//           status: 'active',
//           expires_at: request.expiresAt ? request.expiresAt.toISOString() : null
//         };

//         return from(
//           this.supabase
//             .from('data_room_shares')
//             .insert(shareData)
//             .select()
//             .single()
//         ).pipe(
//           map(({ data, error }) => {
//             if (error) throw error;
//             return data;
//           })
//         );
//       }),
//       switchMap(shareRecord => {
//         // If specific documents are shared, create junction records
//         if (request.documentIds && request.documentIds.length > 0) {
//           return this.addSharedDocuments(shareRecord.id, request.documentIds).pipe(
//             map(() => shareRecord)
//           );
//         }
//         return of(shareRecord);
//       }),
//       map(shareRecord => transformShareFromDB(shareRecord)),
//       tap(() => {
//         // Trigger email notification via edge function
//         this.triggerShareNotification(request.dataRoomId, request.sharedWithUserId);
//       })
//     );
//   }

//   /**
//    * Update share permissions
//    */
//   updateSharePermissions(request: UpdateShareRequest): Observable<DataRoomShare> {
//     const userId = this.authService.user()?.id;
    
//     if (!userId) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     // Validate ownership
//     return this.getShare(request.shareId).pipe(
//       switchMap(share => {
//         if (share.sharedByUserId !== userId) {
//           return throwError(() => new Error('Unauthorized: You did not create this share'));
//         }

//         // Build updates
//         const updates: any = {};
//         if (request.permissionLevel) updates.permission_level = request.permissionLevel;
//         if (request.allowedSections !== undefined) updates.allowed_sections = request.allowedSections;
//         if (request.expiresAt !== undefined) {
//           updates.expires_at = request.expiresAt ? request.expiresAt.toISOString() : null;
//         }
//         if (request.internalNotes !== undefined) updates.internal_notes = request.internalNotes;

//         return from(
//           this.supabase
//             .from('data_room_shares')
//             .update(updates)
//             .eq('id', request.shareId)
//             .select()
//             .single()
//         );
//       }),
//       switchMap(({ data, error }) => {
//         if (error) throw error;

//         // Update shared documents if provided
//         if (request.documentIds !== undefined) {
//           return this.updateSharedDocuments(request.shareId, request.documentIds).pipe(
//             map(() => data)
//           );
//         }
        
//         return of(data);
//       }),
//       map(shareRecord => transformShareFromDB(shareRecord))
//     );
//   }

//   /**
//    * Revoke access to data room
//    */
//   revokeAccess(shareId: string): Observable<void> {
//     const userId = this.authService.user()?.id;
    
//     if (!userId) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     return this.getShare(shareId).pipe(
//       switchMap(share => {
//         if (share.sharedByUserId !== userId) {
//           return throwError(() => new Error('Unauthorized: You did not create this share'));
//         }

//         return from(
//           this.supabase
//             .from('data_room_shares')
//             .update({ 
//               status: 'revoked',
//               revoked_at: new Date().toISOString()
//             })
//             .eq('id', shareId)
//         );
//       }),
//       map(({ error }) => {
//         if (error) throw error;
//       })
//     );
//   }

//   /**
//    * Get all active shares for a data room
//    */
//   getActiveShares(dataRoomId: string): Observable<DataRoomShare[]> {
//     return from(
//       this.supabase
//         .from('data_room_shares')
//         .select(`
//           *,
//           shared_with_user:shared_with_user_id (
//             id,
//             email,
//             raw_user_meta_data
//           ),
//           data_room_share_documents (
//             document_id
//           )
//         `)
//         .eq('data_room_id', dataRoomId)
//         .eq('status', 'active')
//         .order('shared_at', { ascending: false })
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
        
//         return data.map(share => {
//           const transformed = transformShareFromDB(share);
          
//           // Add user info
//           if (share.shared_with_user) {
//             transformed.sharedWithUser = {
//               id: share.shared_with_user.id,
//               email: share.shared_with_user.email,
//               name: share.shared_with_user.raw_user_meta_data?.full_name,
//               companyName: share.shared_with_user.raw_user_meta_data?.company_name
//             };
//           }
          
//           // Add shared document IDs
//           transformed.sharedDocumentIds = share.data_room_share_documents?.map(
//             (doc: any) => doc.document_id
//           ) || [];
          
//           return transformed;
//         });
//       })
//     );
//   }


//   /**
//    * Withdraw access request
//    */
//   withdrawRequest(requestId: string): Observable<void> {
//     const userId = this.authService.user()?.id;
    
//     if (!userId) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     return this.getAccessRequest(requestId).pipe(
//       switchMap(request => {
//         if (request.requesterId !== userId) {
//           return throwError(() => new Error('Unauthorized: This is not your request'));
//         }

//         if (request.status !== 'pending') {
//           return throwError(() => new Error('Cannot withdraw non-pending request'));
//         }

//         return from(
//           this.supabase
//             .from('data_room_access_requests')
//             .update({ status: 'withdrawn' })
//             .eq('id', requestId)
//         );
//       }),
//       map(({ error }) => {
//         if (error) throw error;
//       })
//     );
//   }

//   /**
//    * Check access status for a user to a data room
//    */
//   checkAccess(dataRoomId: string, userId?: string): Observable<AccessStatus> {
//     const checkUserId = userId || this.authService.user()?.id;
    
//     if (!checkUserId) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     return forkJoin({
//       share: this.getActiveShareForUser(dataRoomId, checkUserId),
//       request: this.getPendingRequestForUser(dataRoomId, checkUserId)
//     }).pipe(
//       map(({ share, request }) => {
//         if (share) {
//           return {
//             hasAccess: true,
//             shareId: share.id,
//             permissionLevel: share.permissionLevel,
//             expiresAt: share.expiresAt,
//             pendingRequestId: undefined
//           };
//         }

//         if (request) {
//           return {
//             hasAccess: false,
//             pendingRequestId: request.id
//           };
//         }

//         return {
//           hasAccess: false
//         };
//       })
//     );
//   }

//   // ============================================
//   // SME: REQUEST MANAGEMENT METHODS
//   // ============================================

//   /**
//    * Get incoming access requests for SME's data room
//    */
//   getIncomingRequests(organizationId?: string): Observable<DataRoomAccessRequest[]> {
//     const userId = organizationId || this.authService.user()?.id;
    
//     if (!userId) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     return from(
//       this.supabase
//         .from('data_room_access_requests')
//         .select(`
//           *,
//           requester:requester_id (
//             id,
//             email,
//             raw_user_meta_data
//           ),
//           data_rooms!inner (
//             id,
//             title,
//             organization_id
//           )
//         `)
//         .eq('data_rooms.organization_id', userId)
//         .in('status', ['pending'])
//         .order('created_at', { ascending: false })
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
        
//         return data.map(req => {
//           const transformed = transformAccessRequestFromDB(req);
          
//           if (req.requester) {
//             transformed.requester = {
//               id: req.requester.id,
//               email: req.requester.email,
//               name: req.requester.raw_user_meta_data?.full_name
//             };
//           }
          
//           if (req.data_rooms) {
//             transformed.dataRoom = {
//               id: req.data_rooms.id,
//               title: req.data_rooms.title
//             };
//           }
          
//           return transformed;
//         });
//       })
//     );
//   }

//   /**
//    * Approve access request and create share
//    */
//   approveAccessRequest(request: ApproveAccessRequestRequest): Observable<DataRoomShare> {
//     const userId = this.authService.user()?.id;
    
//     if (!userId) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     return this.getAccessRequest(request.requestId).pipe(
//       switchMap(accessRequest => {
//         if (accessRequest.status !== 'pending') {
//           return throwError(() => new Error('Request is no longer pending'));
//         }

//         // Create share
//         const shareRequest: CreateShareRequest = {
//           dataRoomId: accessRequest.dataRoomId,
//           sharedWithUserId: accessRequest.requesterId,
//           permissionLevel: request.permissionLevel,
//           allowedSections: request.allowedSections,
//           documentIds: request.documentIds,
//           expiresAt: request.expiresAt
//         };

//         return this.shareDataRoom(shareRequest).pipe(
//           switchMap(share => {
//             // Update request status
//             return from(
//               this.supabase
//                 .from('data_room_access_requests')
//                 .update({
//                   status: 'approved',
//                   reviewed_by_user_id: userId,
//                   reviewed_at: new Date().toISOString(),
//                   share_id: share.id
//                 })
//                 .eq('id', request.requestId)
//             ).pipe(
//               map(() => share)
//             );
//           })
//         );
//       }),
//       tap(() => {
//         // Trigger approval email notification
//         this.triggerAccessApprovedNotification(request.requestId);
//       })
//     );
//   }

//   /**
//    * Reject access request
//    */
//   rejectAccessRequest(request: RejectAccessRequestRequest): Observable<void> {
//     const userId = this.authService.user()?.id;
    
//     if (!userId) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     return this.getAccessRequest(request.requestId).pipe(
//       switchMap(accessRequest => {
//         if (accessRequest.status !== 'pending') {
//           return throwError(() => new Error('Request is no longer pending'));
//         }

//         return from(
//           this.supabase
//             .from('data_room_access_requests')
//             .update({
//               status: 'rejected',
//               reviewed_by_user_id: userId,
//               review_notes: request.reviewNotes,
//               reviewed_at: new Date().toISOString()
//             })
//             .eq('id', request.requestId)
//         );
//       }),
//       map(({ error }) => {
//         if (error) throw error;
//       }),
//       tap(() => {
//         // Trigger rejection email notification
//         this.triggerAccessRejectedNotification(request.requestId, request.reviewNotes);
//       })
//     );
//   }

//   // ============================================
//   // PRIVATE HELPER METHODS
//   // ============================================

//   private validateDataRoomOwnership(dataRoomId: string, userId: string): Observable<void> {
//     return from(
//       this.supabase
//         .from('data_rooms')
//         .select('organization_id')
//         .eq('id', dataRoomId)
//         .single()
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
        
//         if (data.organization_id !== userId) {
//           throw new Error('Unauthorized: You do not own this data room');
//         }
//       })
//     );
//   }

//   private getShare(shareId: string): Observable<DataRoomShare> {
//     return from(
//       this.supabase
//         .from('data_room_shares')
//         .select('*')
//         .eq('id', shareId)
//         .single()
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         return transformShareFromDB(data);
//       })
//     );
//   }

//   private getAccessRequest(requestId: string): Observable<DataRoomAccessRequest> {
//     return from(
//       this.supabase
//         .from('data_room_access_requests')
//         .select('*')
//         .eq('id', requestId)
//         .single()
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         return transformAccessRequestFromDB(data);
//       })
//     );
//   }

//   private checkExistingShare(dataRoomId: string, sharedWithUserId: string): Observable<DataRoomShare | null> {
//     return from(
//       this.supabase
//         .from('data_room_shares')
//         .select('*')
//         .eq('data_room_id', dataRoomId)
//         .eq('shared_with_user_id', sharedWithUserId)
//         .eq('status', 'active')
//         .maybeSingle()
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         return data ? transformShareFromDB(data) : null;
//       })
//     );
//   }

//   private checkExistingRequest(dataRoomId: string, requesterId: string): Observable<DataRoomAccessRequest | null> {
//     return from(
//       this.supabase
//         .from('data_room_access_requests')
//         .select('*')
//         .eq('data_room_id', dataRoomId)
//         .eq('requester_id', requesterId)
//         .eq('status', 'pending')
//         .maybeSingle()
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         return data ? transformAccessRequestFromDB(data) : null;
//       })
//     );
//   }

//   private getActiveShareForUser(dataRoomId: string, userId: string): Observable<DataRoomShare | null> {
//     return this.checkExistingShare(dataRoomId, userId);
//   }

//   private getPendingRequestForUser(dataRoomId: string, userId: string): Observable<DataRoomAccessRequest | null> {
//     return this.checkExistingRequest(dataRoomId, userId);
//   }

//   private addSharedDocuments(shareId: string, documentIds: string[]): Observable<void> {
//     const records = documentIds.map(docId => ({
//       share_id: shareId,
//       document_id: docId
//     }));

//     return from(
//       this.supabase
//         .from('data_room_share_documents')
//         .insert(records)
//     ).pipe(
//       map(({ error }) => {
//         if (error) throw error;
//       })
//     );
//   }

//   private updateSharedDocuments(shareId: string, documentIds: string[]): Observable<void> {
//     // Delete existing
//     return from(
//       this.supabase
//         .from('data_room_share_documents')
//         .delete()
//         .eq('share_id', shareId)
//     ).pipe(
//       switchMap(() => {
//         // Insert new
//         if (documentIds.length > 0) {
//           return this.addSharedDocuments(shareId, documentIds);
//         }
//         return of(undefined);
//       })
//     );
//   }

//   // Notification triggers (will be handled by edge functions)
//   private triggerShareNotification(dataRoomId: string, sharedWithUserId: string): void {
//     // Edge function will handle email notification
//     console.log('Triggering share notification', { dataRoomId, sharedWithUserId });
//   }

//   private triggerAccessRequestNotification(dataRoomId: string, requesterId: string): void {
//     console.log('Triggering access request notification', { dataRoomId, requesterId });
//   }

//   private triggerAccessApprovedNotification(requestId: string): void {
//     console.log('Triggering access approved notification', { requestId });
//   }

//   private triggerAccessRejectedNotification(requestId: string, reason: string): void {
//     console.log('Triggering access rejected notification', { requestId, reason });
//   }
// }



import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable, from, throwError, Subject } from 'rxjs';
import { map, switchMap, catchError, shareReplay, takeUntil, tap } from 'rxjs/operators';
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
  transformAccessRequestFromDB
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
  providedIn: 'root'
})
export class DataRoomSharingService implements OnDestroy {
  private supabase = inject(SharedSupabaseService);
  private destroy$ = new Subject<void>();

  // Cache shares to avoid redundant queries
  private shareCache = new Map<string, CachedShares>();

  constructor() {
    console.log('✅ DataRoomSharingService initialized');
  }
  private checkExistingRequest(dataRoomId: string, requesterId: string): Observable<DataRoomAccessRequest | null> {
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
    // ============================================
  // FUNDER: ACCESS REQUEST METHODS
  // ============================================
 // ============================================
  // SME: REQUEST MANAGEMENT METHODS
  // ============================================

  /**
   * Get incoming access requests for SME's data room
   */
  getIncomingRequests(organizationId?: string): Observable<DataRoomAccessRequest[]> {
    const userId = organizationId || this.supabase.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabase
        .from('data_room_access_requests')
        .select(`
          *,
          requester:requester_id (
            id,
            email,
            raw_user_meta_data
          ),
          data_rooms!inner (
            id,
            title,
            organization_id
          )
        `)
        .eq('data_rooms.organization_id', userId)
        .in('status', ['pending'])
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        
        return data.map(req => {
          const transformed = transformAccessRequestFromDB(req);
          
          if (req.requester) {
            transformed.requester = {
              id: req.requester.id,
              email: req.requester.email,
              name: req.requester.raw_user_meta_data?.full_name
            };
          }
          
          if (req.data_rooms) {
            transformed.dataRoom = {
              id: req.data_rooms.id,
              title: req.data_rooms.title
            };
          }
          
          return transformed;
        });
      })
    );
  }

  /**
   * Request access to a data room
   */
  requestAccess(request: CreateAccessRequestRequest): Observable<DataRoomAccessRequest> {
        const userId = this.supabase.getCurrentUserId();
    
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Check if request already exists
    return this.checkExistingRequest(request.dataRoomId, userId).pipe(
      switchMap(existingRequest => {
        if (existingRequest) {
          return throwError(() => new Error('You already have a pending request for this data room'));
        }

        const requestData = {
          data_room_id: request.dataRoomId,
          requester_id: userId,
          request_reason: request.requestReason,
          requested_sections: request.requestedSections || null,
          organization_name: request.organizationName,
          contact_email: request.contactEmail,
          status: 'pending'
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
    return from(this.validateAndCheckShare(request.dataRoomId, request.sharedWithUserId, userId)).pipe(
      switchMap(() => this.createShareRecord(userId, request)),
      switchMap(shareRecord =>
        // If specific documents are shared, create junction records
        request.documentIds && request.documentIds.length > 0
          ? this.addSharedDocuments(shareRecord.id, request.documentIds).pipe(map(() => shareRecord))
          : from([shareRecord])
      ),
      map(shareRecord => transformShareFromDB(shareRecord)),
      tap(() => {
        this.invalidateShareCache(request.dataRoomId);
        // Trigger email notification via edge function
        this.triggerShareNotification(request.dataRoomId, request.sharedWithUserId);
      }),
      catchError(error => {
        console.error('❌ Error sharing data room:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Update share permissions
   */
  updateSharePermissions(request: UpdateShareRequest): Observable<DataRoomShare> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Validate ownership
    return from(this.validateShareOwnership(request.shareId, userId)).pipe(
      switchMap(() => this.updateShare(request)),
      tap(() => this.invalidateAllShareCaches()),
      catchError(error => {
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
      catchError(error => {
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
      catchError(error => {
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
        this.getPendingRequestForUser(dataRoomId, checkUserId)
      ])
    ).pipe(
      map(([share, request]) => {
        if (share) {
          return {
            hasAccess: true,
            shareId: share.id,
            permissionLevel: share.permissionLevel,
            expiresAt: share.expiresAt,
            pendingRequestId: undefined
          };
        }

        if (request) {
          return {
            hasAccess: false,
            pendingRequestId: request.id
          };
        }

        return {
          hasAccess: false
        };
      }),
      catchError(error => {
        console.error('❌ Error checking access:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }
  private triggerAccessRequestNotification(dataRoomId: string, requesterId: string): void {
    console.log('Triggering access request notification', { dataRoomId, requesterId });
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
      catchError(error => {
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
      catchError(error => {
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
  createAccessRequest(request: CreateAccessRequestRequest): Observable<DataRoomAccessRequest> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    const accessRequestData = {
      data_room_id: request.dataRoomId,
      requested_by_user_id: userId,
      requested_sections: request.requestedSections || null,
      message: request.requestReason || null,
      status: 'pending' as const,
      metadata: {}
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
      catchError(error => {
        console.error('❌ Error creating access request:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

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
      catchError(error => {
        console.error('❌ Error fetching access requests:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get pending access requests for a data room
   */
  getPendingAccessRequests(dataRoomId: string): Observable<DataRoomAccessRequest[]> {
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
      catchError(error => {
        console.error('❌ Error fetching pending requests:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Approve access request
   */
  approveAccessRequest(request: ApproveAccessRequestRequest): Observable<DataRoomShare> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Get access request details
    return from(this.getAccessRequestRecord(request.requestId)).pipe(
      switchMap(accessRequest => {
        // Validate ownership of data room
        return from(
          this.validateDataRoomOwnership(accessRequest.data_room_id, userId)
        ).pipe(
          map(() => accessRequest)
        );
      }),
      switchMap(accessRequest =>
        // Create share from approved request
        from(this.createShareFromApproval(userId, accessRequest, request))
      ),
      tap(() => this.invalidateAllShareCaches()),
      catchError(error => {
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
      switchMap(accessRequest => {
        // Validate ownership
        return from(
          this.validateDataRoomOwnership(accessRequest.data_room_id, userId)
        ).pipe(
          map(() => accessRequest.id)
        );
      }),
      switchMap(accessRequestId =>
        from(
          this.supabase
            .from('data_room_access_requests')
            .update({
              status: 'rejected' as const,
              rejection_reason: request.reviewNotes || null
            })
            .eq('id', accessRequestId)
        )
      ),
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => this.invalidateAllShareCaches()),
      catchError(error => {
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
    const existing = await this.checkExistingShare(dataRoomId, sharedWithUserId);
    if (existing) {
      throw new Error('Active share already exists for this user');
    }
  }

  /**
   * Validate data room ownership
   */
  private async validateDataRoomOwnership(dataRoomId: string, userId: string): Promise<void> {
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
  private async validateShareOwnership(shareId: string, userId: string): Promise<void> {
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
      expires_at: request.expiresAt ? request.expiresAt.toISOString() : null
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
  private async updateShare(request: UpdateShareRequest): Promise<DataRoomShare> {
    const updates: any = {};

    if (request.permissionLevel !== undefined) {
      updates.permission_level = request.permissionLevel;
    }
    if (request.allowedSections !== undefined) {
      updates.allowed_sections = request.allowedSections;
    }
    if (request.expiresAt !== undefined) {
      updates.expires_at = request.expiresAt ? request.expiresAt.toISOString() : null;
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
  private addSharedDocuments(shareId: string, documentIds: string[]): Observable<void> {
    const junctionRecords = documentIds.map(docId => ({
      data_room_share_id: shareId,
      document_id: docId
    }));

    return from(
      this.supabase
        .from('data_room_share_documents')
        .insert(junctionRecords)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError(error => {
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
  private async createShareFromApproval(
    userId: string,
    accessRequest: any,
    approvalRequest: ApproveAccessRequestRequest
  ): Promise<DataRoomShare> {
    // Create share
    const shareData = {
      data_room_id: accessRequest.data_room_id,
      shared_with_user_id: accessRequest.requested_by_user_id,
      shared_by_user_id: userId,
      permission_level: approvalRequest.permissionLevel,
      allowed_sections: approvalRequest.allowedSections || accessRequest.requested_sections,
      internal_notes: null,
      status: 'active',
      expires_at: approvalRequest.expiresAt ? approvalRequest.expiresAt.toISOString() : null
    };

    const { data: shareData_, error: shareError } = await this.supabase
      .from('data_room_shares')
      .insert(shareData)
      .select()
      .single();

    if (shareError) throw shareError;

    // Update access request status
    await this.supabase
      .from('data_room_access_requests')
      .update({ status: 'approved' as const })
      .eq('id', accessRequest.id);

    return transformShareFromDB(shareData_);
  }

  /**
   * Get active share for a user
   */
  private async getActiveShareForUser(dataRoomId: string, userId: string): Promise<DataRoomShare | null> {
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
  private async getPendingRequestForUser(
    dataRoomId: string,
    userId: string
  ): Promise<DataRoomAccessRequest | null> {
    const { data } = await this.supabase
      .from('data_room_access_requests')
      .select('*')
      .eq('data_room_id', dataRoomId)
      .eq('requested_by_user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    return data ? transformAccessRequestFromDB(data) : null;
  }

  /**
   * Trigger share notification
   */
  private triggerShareNotification(dataRoomId: string, sharedWithUserId: string): void {
    // Trigger edge function or webhook
    console.log(`📧 Share notification triggered for ${sharedWithUserId}`);
  }

  /**
   * Get valid cache
   */
  private getValidCache(dataRoomId: string): Observable<DataRoomShare[]> | null {
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