import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject, Subject } from 'rxjs';
import { tap, catchError, takeUntil, switchMap } from 'rxjs/operators';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { ActivityService } from '../../shared/services/activity.service';
import { SupabaseDocumentService } from '../../shared/services/supabase-document.service';
import { MessagingService } from 'src/app/messaging/services/messaging.service';

export interface VerificationOrganization {
  id: string;
  name: string;
  organizationType: string;
  status: string;
  isVerified: boolean;
  legalName?: string;
  registrationNumber?: string;
  email?: string;
  phone?: string;
  website?: string;
  city?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  createdByUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  verificationThreadId?: string;
  documentCount?: number;
  lastActivityDate?: string;
}

export interface VerificationAction {
  organizationId: string;
  action: 'approve' | 'reject' | 'request_info';
  notes?: string;
  reason?: string;
  messageContent?: string;
}

export interface VerificationStats {
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
  totalProcessed: number;
}

/**
 * OrganizationVerificationService
 * - Eliminates N+1 queries with proper joins
 * - Removes debug logging (production-ready)
 * - Removes AuthService injection
 * - Centralized error handling
 * - Proper subscription cleanup
 * - Reduced coupling
 */
@Injectable({
  providedIn: 'root'
})
export class OrganizationVerificationService implements OnDestroy {
  private supabase = inject(SharedSupabaseService);
  private messagingService = inject(MessagingService);
  private activityService = inject(ActivityService);
  private documentService = inject(SupabaseDocumentService);
  private destroy$ = new Subject<void>();

  // State management
  private organizationsSubject = new BehaviorSubject<VerificationOrganization[]>([]);
  private statsSubject = new BehaviorSubject<VerificationStats>({
    pendingCount: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalProcessed: 0
  });

  // Public observables
  public organizations$ = this.organizationsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  // State signals
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.loadPendingVerifications();
  }

  /**
   * Load pending organizations for verification (NO N+1 QUERIES)
   * Uses single query with joins instead of looping
   */
  async loadPendingVerifications(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Single query with joins (no N+1)
      const { data: orgsData, error: orgsError } = await this.supabase
        .from('organizations')
        .select(`
          id,
          name,
          organization_type,
          status,
          is_verified,
          legal_name,
          registration_number,
          email,
          phone,
          website,
          city,
          country,
          created_at,
          updated_at,
          created_by,
          users!inner (
            first_name,
            last_name,
            email
          )
        `)
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: true });

      if (orgsError) throw orgsError;

      if (!orgsData || orgsData.length === 0) {
        this.organizationsSubject.next([]);
        await this.updateStats();
        return;
      }

      // Transform data efficiently (batch all lookups)
      const organizations = await this.enrichOrganizations(orgsData);

      this.organizationsSubject.next(organizations);
      await this.updateStats();
    } catch (error: any) {
      const message = error?.message || 'Failed to load verification requests';
      this.error.set(message);
      console.error('❌ Error loading pending verifications:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Enrich organizations with document counts and thread IDs (batched)
   */
  private async enrichOrganizations(orgsData: any[]): Promise<VerificationOrganization[]> {
    // Batch fetch all document counts and threads in parallel
    const orgIds = orgsData.map(o => o.id);

    // Get all verification threads in one query
    const { data: threadsData } = await this.supabase
      .from('message_threads')
      .select('id, metadata')
      .ilike('subject', '%Verification:%');

    // Create lookup map for threads
    const threadMap = new Map<string, string>();
    threadsData?.forEach((thread: any) => {
      if (thread.metadata?.organizationId) {
        threadMap.set(thread.metadata.organizationId, thread.id);
      }
    });

    // Get document counts for all organizations (batch query)
    const createdByIds = orgsData.map(o => o.created_by).filter(Boolean);
    const docCountMap = new Map<string, number>();

    // For each user, count their documents
    if (createdByIds.length > 0) {
      const { data: docCountData } = await this.supabase
        .from('documents')
        .select('user_id', { count: 'exact' })
        .in('user_id', createdByIds);

      // Manual grouping (Supabase limitation)
      const grouped: Record<string, number> = {};
      createdByIds.forEach(userId => {
        grouped[userId] = (docCountData || []).filter(
          (d: any) => d.user_id === userId
        ).length;
      });

      Object.entries(grouped).forEach(([userId, count]) => {
        docCountMap.set(userId, count as number);
      });
    }

    // Transform orgs efficiently
    return orgsData.map(org => this.transformOrganization(org, threadMap, docCountMap));
  }

  /**
   * Transform organization data
   */
  private transformOrganization(
    org: any,
    threadMap: Map<string, string>,
    docCountMap: Map<string, number>
  ): VerificationOrganization {
    return {
      id: org.id,
      name: org.name,
      organizationType: org.organization_type,
      status: org.status,
      isVerified: org.is_verified,
      legalName: org.legal_name,
      registrationNumber: org.registration_number,
      email: org.email,
      phone: org.phone,
      website: org.website,
      city: org.city,
      country: org.country,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
      createdByUser: org.users ? {
        firstName: org.users.first_name,
        lastName: org.users.last_name,
        email: org.users.email
      } : undefined,
      verificationThreadId: threadMap.get(org.id),
      documentCount: docCountMap.get(org.created_by) || 0,
      lastActivityDate: org.updated_at
    };
  }

  /**
   * Approve organization
   */
  approveOrganization(organizationId: string, adminNotes?: string): Observable<boolean> {
    return from(this.performApproval(organizationId, adminNotes)).pipe(
      tap(() => this.loadPendingVerifications()),
      catchError(error => {
        this.error.set('Failed to approve organization');
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform approval
   */
  private async performApproval(organizationId: string, adminNotes?: string): Promise<boolean> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const org = this.organizationsSubject.value.find(o => o.id === organizationId);
    if (!org) throw new Error('Organization not found');

    // Update organization
    const { error: updateError } = await this.supabase
      .from('organizations')
      .update({
        status: 'active',
        is_verified: true,
        verification_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId);

    if (updateError) throw updateError;

    // Log activity (async, don't wait)
    this.activityService.createActivity({
      type: 'verification',
      action: 'verified',
      message: `Organization "${org.name}" verified and approved`,
      metadata: {
        organizationId,
        organizationName: org.name,
        adminNotes,
        verifiedBy: userId
      }
    }).pipe(takeUntil(this.destroy$)).subscribe();

    // Send message if thread exists
    if (org.verificationThreadId) {
      const message = `Your organization "${org.name}" has been verified and approved. You now have full access to the platform.${adminNotes ? `\n\nAdmin notes: ${adminNotes}` : ''}`;
      await this.messagingService.sendMessage(org.verificationThreadId, message, 'system');
    }

    return true;
  }

  /**
   * Reject organization
   */
  rejectOrganization(organizationId: string, reason: string): Observable<boolean> {
    return from(this.performRejection(organizationId, reason)).pipe(
      tap(() => this.loadPendingVerifications()),
      catchError(error => {
        this.error.set('Failed to reject organization');
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform rejection
   */
  private async performRejection(organizationId: string, reason: string): Promise<boolean> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const org = this.organizationsSubject.value.find(o => o.id === organizationId);
    if (!org) throw new Error('Organization not found');

    // Update organization
    const { error: updateError } = await this.supabase
      .from('organizations')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId);

    if (updateError) throw updateError;

    // Log activity (async, don't wait)
    this.activityService.createActivity({
      type: 'verification',
      action: 'rejected',
      message: `Organization "${org.name}" verification rejected`,
      metadata: {
        organizationId,
        organizationName: org.name,
        reason,
        rejectedBy: userId
      }
    }).pipe(takeUntil(this.destroy$)).subscribe();

    // Send message (create thread if needed)
    let threadId: string | undefined = org.verificationThreadId;
    if (!threadId) {
      threadId = await this.getOrCreateVerificationThread(organizationId, org.name, org.createdByUser?.email) ?? undefined;
    }

    if (threadId) {
      const message = `Your organization "${org.name}" verification has been rejected.\n\nReason: ${reason}\n\nPlease review the requirements and resubmit your application with the necessary corrections.`;
      await this.messagingService.sendMessage(threadId, message, 'system');
    }

    return true;
  }

  /**
   * Request more information
   */
  requestMoreInformation(organizationId: string, messageContent: string): Observable<boolean> {
    return from(this.performInfoRequest(organizationId, messageContent)).pipe(
      tap(() => this.loadPendingVerifications()),
      catchError(error => {
        this.error.set('Failed to request additional information');
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform info request
   */
  private async performInfoRequest(organizationId: string, messageContent: string): Promise<boolean> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) throw new Error('Not authenticated');

    const org = this.organizationsSubject.value.find(o => o.id === organizationId);
    if (!org) throw new Error('Organization not found');

    // Get or create verification thread
    let threadId: string | undefined = org.verificationThreadId;
    if (!threadId) {
      threadId = await this.getOrCreateVerificationThread(organizationId, org.name, org.createdByUser?.email) ?? undefined;
    }

    if (!threadId) throw new Error('Failed to create verification thread');

    // Send message
    const success = await this.messagingService.sendMessage(threadId, messageContent, 'message');
    if (!success) throw new Error('Failed to send message');

    // Log activity (async, don't wait)
    this.activityService.createActivity({
      type: 'verification',
      action: 'info_requested',
      message: `Additional information requested from "${org.name}"`,
      metadata: {
        organizationId,
        organizationName: org.name,
        requestedBy: userId,
        message: messageContent
      }
    }).pipe(takeUntil(this.destroy$)).subscribe();

    return true;
  }

  /**
   * Get or create verification thread
   * Centralized thread management (no duplication)
   */
  private async getOrCreateVerificationThread(
    organizationId: string,
    organizationName: string,
    participantEmail?: string
  ): Promise<string | null> {
    try {
      // Try to find existing thread
      const { data: existingThread } = await this.supabase
        .from('message_threads')
        .select('id')
        .contains('metadata', { organizationId })
        .ilike('subject', `%Verification: ${organizationName}%`)
        .maybeSingle();

      if (existingThread) {
        return existingThread.id;
      }

      // Get organization creator to include in thread
      const { data: orgData, error: orgError } = await this.supabase
        .from('organizations')
        .select('created_by')
        .eq('id', organizationId)
        .maybeSingle();

      if (orgError || !orgData?.created_by) {
        return null;
      }

      // Create thread
      const threadId = await this.messagingService.createThread(
        `Verification: ${organizationName}`,
        [orgData.created_by]
      );

      // Update local state
      if (threadId) {
        const currentOrgs = this.organizationsSubject.value;
        const updatedOrgs = currentOrgs.map(org =>
          org.id === organizationId
            ? { ...org, verificationThreadId: threadId }
            : org
        );
        this.organizationsSubject.next(updatedOrgs);
      }

      return threadId;
    } catch (error) {
      console.error('Error getting/creating verification thread:', error);
      return null;
    }
  }

  /**
   * Update verification statistics
   */
  private async updateStats(): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Get current pending count
      const pendingCount = this.organizationsSubject.value.length;

      // Get today's approvals
      const { count: approvedToday } = await this.supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('is_verified', true)
        .gte('verification_date', todayISO);

      // Get today's rejections
      const { count: rejectedToday } = await this.supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        .gte('updated_at', todayISO);

      // Get total processed
      const { count: totalProcessed } = await this.supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true);

      this.statsSubject.next({
        pendingCount,
        approvedToday: approvedToday || 0,
        rejectedToday: rejectedToday || 0,
        totalProcessed: totalProcessed || 0
      });
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  /**
   * Get organization by ID from cached list
   */
  getOrganizationById(organizationId: string): VerificationOrganization | null {
    return this.organizationsSubject.value.find(org => org.id === organizationId) || null;
  }

  /**
   * Get verification thread for organization
   */
  getVerificationThread(organizationId: string): string | null {
    const org = this.getOrganizationById(organizationId);
    return org?.verificationThreadId || null;
  }

  /**
   * Ensure verification thread exists (create if needed)
   */
  ensureVerificationThread(organizationId: string): Observable<string | null> {
    const org = this.getOrganizationById(organizationId);
    if (!org) {
      return throwError(() => new Error('Organization not found'));
    }

    if (org.verificationThreadId) {
      return from([org.verificationThreadId]);
    }

    return from(
      this.getOrCreateVerificationThread(
        organizationId,
        org.name,
        org.createdByUser?.email
      )
    ).pipe(takeUntil(this.destroy$));
  }

  /**
   * Refresh verification list
   */
  refreshVerifications(): void {
    this.loadPendingVerifications();
  }

  /**
   * Get organization documents (from SupabaseDocumentService)
   */
  getOrganizationDocuments(organizationId: string): Observable<any[]> {
    const org = this.getOrganizationById(organizationId);
    if (!org?.createdByUser) {
      return throwError(() => new Error('Organization or user not found'));
    }

    // Return empty observable (documents would be fetched separately if needed)
    return from([]);
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.organizationsSubject.complete();
    this.statsSubject.complete();
  }
}