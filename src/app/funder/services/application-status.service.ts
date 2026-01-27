import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { MessagingService } from 'src/app/features/messaging/services/messaging.service';
import { ActivityService } from 'src/app/shared/services/activity.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import {
  FundingApplication,
  ReviewNote,
} from 'src/app/fund-seeking-orgs/models/application.models';

export interface StatusAction {
  id: string;
  label: string;
  description: string;
  category: 'internal' | 'external';
  status?: FundingApplication['status'];
  internalStatus?:
    | 'committee_review'
    | 'pending_documents'
    | 'pending_amendments'
    | 'flagged_review'
    | 'peer_review';
  requiresComment: boolean;
  createsThread?: boolean;
  sendsEmail?: boolean;
}

export interface ActionSubmission {
  action: StatusAction;
  applicationId: string;
  comment: string;
  priorityLevel?: 'low' | 'medium' | 'high' | 'urgent';
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationStatusService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  private messagingService = inject(MessagingService);
  private activityService = inject(ActivityService);
  private toastService = inject(ToastService);

  // State
  isProcessing = signal(false);
  error = signal<string | null>(null);

  /**
   * Submit an action for an application
   * Handles review notes, status updates, notifications, and activity tracking
   */
  submitAction(submission: ActionSubmission): Observable<FundingApplication> {
    this.isProcessing.set(true);
    this.error.set(null);

    return from(this.executeAction(submission)).pipe(
      tap(() => {
        this.isProcessing.set(false);
        this.toastService.success(`✓ ${submission.action.label}`);
        console.log('✅ [STATUS] Action completed successfully');
      }),
      catchError((error) => {
        console.error('❌ [STATUS] Error executing action:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to complete action';
        this.error.set(errorMessage);
        this.toastService.error(errorMessage);
        this.isProcessing.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Execute the action with proper sequencing
   * 1. Add review note (audit trail)
   * 2. Update application status if needed
   * 3. Create message thread if external action
   * 4. Trigger email if action warrants it
   * 5. Track activity
   */
  private async executeAction(
    submission: ActionSubmission
  ): Promise<FundingApplication> {
    const { action, applicationId, comment } = submission;
    const reviewNoteMessage = comment.trim();

    console.log('🚀 [STATUS] Starting action submission:', action.id);

    // Fetch application for context
    let application = await this.getApplicationById(applicationId);
    let updatedApplication = application;

    // Step 1: Add review note (audit trail for all actions)
    if (reviewNoteMessage) {
      console.log('📝 [STATUS] Step 1: Adding review note');
      updatedApplication = await this.addReviewNote(
        applicationId,
        reviewNoteMessage,
        action.id as any
      );
    }

    // Step 2: Update application status if action changes it
    if (action.status) {
      console.log(
        '📊 [STATUS] Step 2: Updating application status to:',
        action.status
      );
      updatedApplication = await this.updateApplicationStatus(
        applicationId,
        action.status
      );
    }

    // Step 3: Create message thread for external actions (notify applicant)
    if (action.category === 'external') {
      console.log('💬 [STATUS] Step 3: Creating message thread for applicant');

      // Get applicant details for messaging
      const applicantUser = await this.getApplicantUser(
        application.applicantId
      );

      if (applicantUser) {
        try {
          const threadId = await this.messagingService.createApplicationThread(
            applicationId,
            `Update: ${action.label}`,
            []
          );

          if (threadId && reviewNoteMessage) {
            await this.messagingService.sendMessage(
              threadId,
              reviewNoteMessage,
              'message'
            );
            console.log('✅ [MESSAGE] Thread created and message sent');

            // Log message activity
            this.activityService.trackApplicationActivity(
              'updated',
              applicationId,
              `Message sent to applicant: ${action.label}`,
              application.formData?.['requestedAmount']
            );
          }
        } catch (error) {
          console.warn('⚠️ [MESSAGE] Error creating thread:', error);
          // Continue - non-critical
        }
      }
    }

    // Step 4: Trigger email for specific actions
    if (action.sendsEmail && action.category === 'external') {
      console.log('📧 [EMAIL] Step 4: Triggering notification email');

      const applicantUser = await this.getApplicantUser(
        application.applicantId
      );
      if (applicantUser) {
        try {
          const emailSent = await this.sendNotificationEmail(
            applicantUser,
            application,
            action,
            reviewNoteMessage
          );

          if (emailSent) {
            console.log('✅ [EMAIL] Notification email sent successfully');
            // Log email activity
            this.activityService.trackApplicationActivity(
              'updated',
              applicationId,
              `Email sent to applicant: ${action.label}`,
              application.formData?.['requestedAmount']
            );
          }
        } catch (error) {
          console.warn('⚠️ [EMAIL] Error sending email (non-critical):', error);
          // Continue - non-critical, message was already sent
        }
      }
    }

    // Step 5: Log comprehensive activity
    console.log('📊 [ACTIVITY] Step 5: Logging activity');
    try {
      const activityMessage = this.buildActivityMessage(
        action,
        application,
        reviewNoteMessage
      );

      this.activityService.trackApplicationActivity(
        'updated',
        applicationId,
        activityMessage,
        application.formData?.['requestedAmount']
      );
    } catch (error) {
      console.warn('⚠️ [ACTIVITY] Error logging activity:', error);
      // Continue - non-critical
    }

    // Fetch and return final application state
    const finalApplication = await this.getApplicationById(applicationId);
    return finalApplication;
  }

  /**
   * Send notification email via Edge Function
   * Uses Supabase functions.invoke() pattern (fire-and-forget, non-blocking)
   */
  private async sendNotificationEmail(
    applicantUser: any,
    application: FundingApplication,
    action: StatusAction,
    message: string
  ): Promise<boolean> {
    try {
      const currentUser = this.authService.user();
      const funderName = currentUser?.email || 'Kapify Team';

      console.log('📧 [EMAIL] Invoking send_notification_email function');

      // Use Supabase functions.invoke() - handles auth automatically
      const { data, error } = await this.supabase.functions.invoke(
        'send_notification_email',
        {
          body: {
            recipientEmail: applicantUser.email,
            recipientName: applicantUser.first_name || 'Applicant',
            applicantCompanyName: applicantUser.company_name,
            applicationTitle: application.title,
            actionType: action.id,
            message,
            applicationAmount: application.formData?.['requestedAmount'],
            funderName,
            opportunityTitle: application.title,
          },
        }
      );

      if (error) {
        console.error('❌ [EMAIL] Edge Function returned error:', error);
        return false;
      }

      if (data?.success === true) {
        console.log('✅ [EMAIL] Notification email queued successfully');
        return true;
      }

      console.warn('⚠️ [EMAIL] Function returned success: false');
      return false;
    } catch (error) {
      // Must never break the action - email is non-critical
      console.error(
        '❌ [EMAIL] Failed to invoke edge function (non-critical):',
        error
      );
      return false;
    }
  }

  /**
   * Get applicant user details for messaging/email
   */
  private async getApplicantUser(applicantId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id, email, first_name, last_name, company_name, user_type')
        .eq('id', applicantId)
        .single();

      if (error) {
        console.warn('Failed to fetch applicant user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching applicant user:', error);
      return null;
    }
  }

  /**
   * Build activity message based on action
   */
  private buildActivityMessage(
    action: StatusAction,
    application: FundingApplication,
    comment?: string
  ): string {
    const messages: Record<string, string> = {
      approve: `Application approved: ${application.title}`,
      reject: `Application rejected: ${application.title}`,
      request_documents: `Document request sent: ${application.title}`,
      request_info: `Information request sent: ${application.title}`,
      request_amendments: `Amendment request sent: ${application.title}`,
      refer_committee: `Application referred to committee: ${application.title}`,
      add_note: `Internal note added: ${application.title}`,
      flag_review: `Application flagged for review: ${application.title}`,
      set_priority: `Priority level updated: ${application.title}`,
      request_peer_review: `Peer review requested: ${application.title}`,
    };

    return messages[action.id] || `Action taken: ${action.label}`;
  }

  /**
   * Add a review note to an application
   */
  private async addReviewNote(
    applicationId: string,
    noteText: string,
    noteType: ReviewNote['type']
  ): Promise<FundingApplication> {
    try {
      console.log('🔍 [REVIEW NOTE] Adding review note:', {
        applicationId,
        noteType,
      });

      // Get current user
      const currentUser = this.authService.user();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Fetch current application with review_notes
      const { data: currentApp, error: fetchError } = await this.supabase
        .from('applications')
        .select('review_notes')
        .eq('id', applicationId)
        .single();

      if (fetchError) {
        console.error('❌ [REVIEW NOTE] Fetch error:', fetchError);
        throw new Error(`Failed to fetch application: ${fetchError.message}`);
      }

      // Create new review note
      const newNote: ReviewNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reviewerId: currentUser.id,
        reviewerName: currentUser.email || 'Unknown Reviewer',
        note: noteText,
        type: noteType,
        createdAt: new Date(),
        isRead: false,
      };

      // Ensure review_notes is an array
      let existingNotes = currentApp?.review_notes;
      if (!Array.isArray(existingNotes)) {
        console.warn(
          '⚠️ [REVIEW NOTE] review_notes was not an array, converting'
        );
        existingNotes = [];
      }

      const updatedNotes = [...existingNotes, newNote];

      // Update application with new review note
      const { data, error: updateError } = await this.supabase
        .from('applications')
        .update({
          review_notes: updatedNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ [REVIEW NOTE] Update error:', updateError);
        throw new Error(`Failed to save review note: ${updateError.message}`);
      }

      console.log('✅ [REVIEW NOTE] Review note saved successfully');
      return this.transformApplicationData(data);
    } catch (error) {
      console.error('💥 [REVIEW NOTE] Error:', error);
      throw error;
    }
  }

  /**
   * Update application status
   */
  private async updateApplicationStatus(
    applicationId: string,
    status: FundingApplication['status']
  ): Promise<FundingApplication> {
    try {
      console.log('🔍 [STATUS UPDATE] Updating application status:', {
        applicationId,
        status,
      });

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Set relevant timestamps based on status
      if (status === 'under_review') {
        updateData.review_started_at = new Date().toISOString();
      }

      if (status === 'approved' || status === 'rejected') {
        updateData.decided_at = new Date().toISOString();
        updateData.reviewed_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('applications')
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        console.error('❌ [STATUS UPDATE] Error:', error);
        throw new Error(`Failed to update status: ${error.message}`);
      }

      console.log('✅ [STATUS UPDATE] Status updated successfully to:', status);
      return this.transformApplicationData(data);
    } catch (error) {
      console.error('💥 [STATUS UPDATE] Error:', error);
      throw error;
    }
  }

  /**
   * Get application by ID
   */
  private async getApplicationById(
    applicationId: string
  ): Promise<FundingApplication> {
    const { data, error } = await this.supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch application: ${error.message}`);
    }

    if (!data) {
      throw new Error('Application not found');
    }

    return this.transformApplicationData(data);
  }

  /**
   * Transform raw application data
   */
  private transformApplicationData(rawData: any): FundingApplication {
    return {
      id: rawData.id,
      applicantId: rawData.applicant_id,
      opportunityId: rawData.opportunity_id,
      title: rawData.title,
      description: rawData.description,
      status: rawData.status,
      stage: rawData.stage,
      formData: rawData.form_data || {},
      documents: rawData.documents || {},
      reviewNotes: rawData.review_notes || [],
      terms: rawData.terms || {},
      submittedAt: rawData.submitted_at
        ? new Date(rawData.submitted_at)
        : undefined,
      reviewStartedAt: rawData.review_started_at
        ? new Date(rawData.review_started_at)
        : undefined,
      reviewedAt: rawData.reviewed_at
        ? new Date(rawData.reviewed_at)
        : undefined,
      decidedAt: rawData.decided_at ? new Date(rawData.decided_at) : undefined,
      createdAt: new Date(rawData.created_at),
      updatedAt: new Date(rawData.updated_at),
      aiAnalysisStatus: rawData.ai_analysis_status,
      aiMatchScore: rawData.ai_match_score,
      applicant: {
        id: rawData.applicant_id,
        firstName: 'Loading...',
        lastName: '',
        email: '',
      },
    };
  }

  /**
   * Get predefined status actions with email configuration
   */
  getAvailableActions(): StatusAction[] {
    return [
      // EXTERNAL ACTIONS (notify applicant)
      {
        id: 'approve',
        label: 'Approve Application',
        description: 'Approve this application for funding',
        category: 'external',
        status: 'approved',
        requiresComment: false,
        createsThread: true,
        sendsEmail: true,
      },
      {
        id: 'reject',
        label: 'Reject Application',
        description: 'Reject this application with reason',
        category: 'external',
        status: 'rejected',
        requiresComment: true,
        createsThread: true,
        sendsEmail: true,
      },
      {
        id: 'request_documents',
        label: 'Request Additional Documents',
        description: 'Request specific documents from applicant',
        category: 'external',
        status: 'under_review',
        requiresComment: true,
        createsThread: true,
        sendsEmail: true,
      },
      {
        id: 'request_info',
        label: 'Request Clarification',
        description: 'Ask applicant for more information',
        category: 'external',
        status: 'under_review',
        requiresComment: true,
        createsThread: true,
        sendsEmail: true,
      },
      {
        id: 'request_amendments',
        label: 'Request Amendments',
        description: 'Request changes to the application',
        category: 'external',
        status: 'under_review',
        requiresComment: true,
        createsThread: true,
        sendsEmail: true,
      },

      // INTERNAL ACTIONS (no email, messaging only)
      {
        id: 'refer_committee',
        label: 'Refer to Investment Committee',
        description: 'Send to committee for review',
        category: 'internal',
        status: 'under_review',
        requiresComment: false,
        sendsEmail: false,
      },
      {
        id: 'add_note',
        label: 'Add Internal Note',
        description: 'Add private note visible only to team',
        category: 'internal',
        requiresComment: true,
        sendsEmail: false,
      },
      {
        id: 'flag_review',
        label: 'Flag for Additional Review',
        description: 'Mark for deeper analysis',
        category: 'internal',
        requiresComment: true,
        sendsEmail: false,
      },
      {
        id: 'set_priority',
        label: 'Set Priority Level',
        description: 'Change application priority',
        category: 'internal',
        requiresComment: false,
        sendsEmail: false,
      },
      {
        id: 'request_peer_review',
        label: 'Request Peer Review',
        description: 'Ask colleague to review',
        category: 'internal',
        requiresComment: true,
        sendsEmail: false,
      },
    ];
  }

  /**
   * Get comment template for action
   */
  getCommentTemplate(actionId: string): string {
    const templates: Record<string, string> = {
      request_documents:
        'Please provide the following documents:\n\n1. \n2. \n3. ',
      request_info: 'We need clarification on the following:\n\n',
      reject:
        'After careful review, we have decided not to proceed with your application because:\n\n',
      approve: 'Congratulations! Your application has been approved.',
    };

    return templates[actionId] || '';
  }
}
