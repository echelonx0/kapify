// src/app/admin/services/organization-verification.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { AuthService } from '../../auth/production.auth.service'; 
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
  // User info for created_by
  createdByUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  // Verification specific
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

@Injectable({
  providedIn: 'root'
})
export class OrganizationVerificationService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  private messagingService = inject(MessagingService);
  private activityService = inject(ActivityService);
  private documentService = inject(SupabaseDocumentService);

  // State management
  private organizationsSubject = new BehaviorSubject<VerificationOrganization[]>([]);
  private statsSubject = new BehaviorSubject<VerificationStats>({
    pendingCount: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalProcessed: 0
  });

  // Public observables
  organizations$ = this.organizationsSubject.asObservable();
  stats$ = this.statsSubject.asObservable();

  // State signals
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.loadPendingVerifications();
  }

  // ===============================
  // CORE VERIFICATION METHODS
  // ===============================

  async loadPendingVerifications(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Get organizations pending verification with user details
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
          users!organizations_created_by_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .eq('status', 'pending_verification')
        .order('created_at', { ascending: true });

      if (orgsError) throw orgsError;

      // Transform data and get additional info
      const organizations: VerificationOrganization[] = await Promise.all(
        (orgsData || []).map(async (org) => {
          // Get document count for this organization
          const documentCount = await this.getOrganizationDocumentCount(org.id);
          
          // Check if verification thread exists
          const verificationThread = await this.findVerificationThread(org.id);

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
            verificationThreadId: verificationThread?.id,
            documentCount,
            lastActivityDate: org.updated_at
          };
        })
      );

      this.organizationsSubject.next(organizations);
      await this.updateStats();

    } catch (error) {
      console.error('Error loading pending verifications:', error);
      this.error.set('Failed to load verification requests');
    } finally {
      this.isLoading.set(false);
    }
  }

  approveOrganization(organizationId: string, adminNotes?: string): Observable<boolean> {
    return from(this.performApproval(organizationId, adminNotes)).pipe(
      tap(() => {
        this.loadPendingVerifications(); // Refresh list
      }),
      catchError(error => {
        console.error('Approval failed:', error);
        this.error.set('Failed to approve organization');
        return throwError(() => error);
      })
    );
  }

  rejectOrganization(organizationId: string, reason: string): Observable<boolean> {
    return from(this.performRejection(organizationId, reason)).pipe(
      tap(() => {
        this.loadPendingVerifications(); // Refresh list
      }),
      catchError(error => {
        console.error('Rejection failed:', error);
        this.error.set('Failed to reject organization');
        return throwError(() => error);
      })
    );
  }

  requestMoreInformation(organizationId: string, messageContent: string): Observable<boolean> {
    return from(this.performInfoRequest(organizationId, messageContent)).pipe(
      tap(() => {
        this.loadPendingVerifications(); // Refresh list
      }),
      catchError(error => {
        console.error('Info request failed:', error);
        this.error.set('Failed to request additional information');
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // IMPLEMENTATION METHODS
  // ===============================

  private async performApproval(organizationId: string, adminNotes?: string): Promise<boolean> {
    const currentUser = this.authService.user();
    if (!currentUser) throw new Error('Admin not authenticated');

    // Get organization details
    const org = this.organizationsSubject.value.find(o => o.id === organizationId);
    if (!org) throw new Error('Organization not found');

    try {
      // Update organization status
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

      // Create activity record
      this.activityService.createActivity({
        type: 'verification',
        action: 'verified',
        message: `Organization "${org.name}" has been verified and approved`,
        metadata: {
          organizationId,
          organizationName: org.name,
          adminNotes,
          verifiedBy: currentUser.id
        }
      }).subscribe();

      // Send approval message if thread exists
      if (org.verificationThreadId) {
        const approvalMessage = `Your organization "${org.name}" has been verified and approved. You now have full access to the platform.${adminNotes ? `\n\nAdmin notes: ${adminNotes}` : ''}`;
        
        await this.messagingService.sendMessage(
          org.verificationThreadId,
          approvalMessage,
          'system'
        );
      }

      console.log(`✅ Organization ${org.name} approved successfully`);
      return true;

    } catch (error) {
      console.error('Error during approval:', error);
      throw error;
    }
  }

  private async performRejection(organizationId: string, reason: string): Promise<boolean> {
    const currentUser = this.authService.user();
    if (!currentUser) throw new Error('Admin not authenticated');

    // Get organization details
    const org = this.organizationsSubject.value.find(o => o.id === organizationId);
    if (!org) throw new Error('Organization not found');

    try {
      // Update organization status
      const { error: updateError } = await this.supabase
        .from('organizations')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', organizationId);

      if (updateError) throw updateError;

      // Create activity record
      this.activityService.createActivity({
        type: 'verification',
        action: 'rejected',
        message: `Organization "${org.name}" verification has been rejected`,
        metadata: {
          organizationId,
          organizationName: org.name,
          reason,
          rejectedBy: currentUser.id
        }
      }).subscribe();

      // Send rejection message if thread exists, or create one
      let threadId: string | null = org.verificationThreadId ?? null;

      if (!threadId) {
        threadId = await this.createVerificationThread(organizationId, org.name);
      }

      if (threadId) {
        const rejectionMessage = `Your organization "${org.name}" verification has been rejected.\n\nReason: ${reason}\n\nPlease review the requirements and resubmit your application with the necessary corrections.`;
        
        await this.messagingService.sendMessage(
          threadId,
          rejectionMessage,
          'system'
        );
      }

      console.log(`❌ Organization ${org.name} rejected`);
      return true;

    } catch (error) {
      console.error('Error during rejection:', error);
      throw error;
    }
  }

  private async performInfoRequest(organizationId: string, messageContent: string): Promise<boolean> {
    const currentUser = this.authService.user();
    if (!currentUser) throw new Error('Admin not authenticated');

    // Get organization details
    const org = this.organizationsSubject.value.find(o => o.id === organizationId);
    if (!org) throw new Error('Organization not found');

    try {
      // Create or find verification thread
     let threadId: string | null = org.verificationThreadId ?? null;

      if (!threadId) {
        threadId = await this.createVerificationThread(organizationId, org.name);
      }

      if (!threadId) {
        throw new Error('Failed to create verification thread');
      }

      // Send message requesting additional information
      const success = await this.messagingService.sendMessage(
        threadId,
        messageContent,
        'message'
      );

      if (!success) {
        throw new Error('Failed to send message');
      }

      // Create activity record
      this.activityService.createActivity({
        type: 'verification',
        action: 'info_requested',
        message: `Additional information requested from "${org.name}"`,
        metadata: {
          organizationId,
          organizationName: org.name,
          requestedBy: currentUser.id,
          message: messageContent
        }
      }).subscribe();

      console.log(`📝 Information requested from ${org.name}`);
      return true;

    } catch (error) {
      console.error('Error requesting information:', error);
      throw error;
    }
  }

  // ===============================
  // HELPER METHODS
  // ===============================

 private async createVerificationThread(organizationId: string, organizationName: string): Promise<string | null> {
    try {
      // Get organization creator to include in thread
      const { data: orgData } = await this.supabase
        .from('organizations')
        .select('created_by')
        .eq('id', organizationId)
        .single();

      if (!orgData?.created_by) {
        console.warn('No organization creator found for thread creation');
        return null;
      }

      const threadId = await this.messagingService.createThread(
        `Verification: ${organizationName}`,
        [orgData.created_by] // Include organization creator
      );

      // Update our local state with the thread ID
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
      console.error('Error creating verification thread:', error);
      return null;
    }
  }

  private async findVerificationThread(organizationId: string): Promise<{ id: string } | null> {
    try {
      const { data: threadsData } = await this.supabase
        .from('message_threads')
        .select('id')
        .ilike('subject', `%Verification:%`)
        .contains('metadata', { organizationId })
        .single();

      return threadsData || null;
    } catch (error) {
      // No existing thread found, which is fine
      return null;
    }
  }

  private async getOrganizationDocumentCount(organizationId: string): Promise<number> {
    try {
      // Get user ID from organization
      const { data: orgData } = await this.supabase
        .from('organizations')
        .select('created_by')
        .eq('id', organizationId)
        .single();

      if (!orgData?.created_by) return 0;

      // Count documents for this user
      const { count } = await this.supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', orgData.created_by);

      return count || 0;
    } catch (error) {
      console.error('Error getting document count:', error);
      return 0;
    }
  }

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

      // Get today's rejections (approximation based on updated_at)
      const { count: rejectedToday } = await this.supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')
        .gte('updated_at', todayISO);

      // Get total processed (verified organizations)
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

  // ===============================
  // PUBLIC UTILITY METHODS
  // ===============================

  getOrganizationById(organizationId: string): VerificationOrganization | null {
    return this.organizationsSubject.value.find(org => org.id === organizationId) || null;
  }

  getOrganizationDocuments(organizationId: string): Observable<any[]> {
    const org = this.getOrganizationById(organizationId);
    if (!org?.createdByUser) {
      return throwError(() => new Error('Organization or user not found'));
    }

    // This would need to be adapted based on your document service
    // For now, return empty array as placeholder
    return from([]);
  }

  refreshVerifications(): void {
    this.loadPendingVerifications();
  }

  // Get verification thread for messaging
  getVerificationThread(organizationId: string): string | null {
    const org = this.getOrganizationById(organizationId);
    return org?.verificationThreadId || null;
  }

  // Create verification thread if it doesn't exist
  ensureVerificationThread(organizationId: string): Observable<string | null> {
    const org = this.getOrganizationById(organizationId);
    if (!org) {
      return throwError(() => new Error('Organization not found'));
    }

    if (org.verificationThreadId) {
      return from([org.verificationThreadId]);
    }

    return from(this.createVerificationThread(organizationId, org.name));
  }
}