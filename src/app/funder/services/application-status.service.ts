// src/app/funder/services/application-status.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { MessagingService } from 'src/app/features/messaging/services/messaging.service';
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

  // State
  isProcessing = signal(false);
  error = signal<string | null>(null);

  /**
   * Submit an action for an application
   * Handles review notes, status updates, and message threads
   */
  submitAction(submission: ActionSubmission): Observable<FundingApplication> {
    this.isProcessing.set(true);
    this.error.set(null);

    return from(this.executeAction(submission)).pipe(
      tap(() => {
        this.isProcessing.set(false);
        console.log('✅ [STATUS] Action completed successfully');
      }),
      catchError((error) => {
        console.error('❌ [STATUS] Error executing action:', error);
        this.error.set('Failed to complete action. Please try again.');
        this.isProcessing.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Execute the action with proper sequencing
   */
  private async executeAction(
    submission: ActionSubmission
  ): Promise<FundingApplication> {
    const { action, applicationId, comment } = submission;
    const reviewNoteMessage = comment.trim();

    console.log('🚀 [STATUS] Starting action submission:', action.id);

    // Step 1: Add review note (audit trail for all actions)
    let updatedApplication: FundingApplication | undefined;

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

    // Step 3: Create message thread for external actions
    if (action.createsThread && reviewNoteMessage) {
      console.log('💬 [STATUS] Step 3: Creating message thread');
      await this.createMessageThread(applicationId, action, reviewNoteMessage);
    }

    // Fetch and return the final application state
    if (!updatedApplication) {
      updatedApplication = await this.getApplicationById(applicationId);
    }

    return updatedApplication;
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

      console.log('👤 [REVIEW NOTE] Current user:', currentUser.email);

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

      console.log('📝 [REVIEW NOTE] New note:', newNote);

      // Ensure review_notes is an array
      let existingNotes = currentApp?.review_notes;
      if (!Array.isArray(existingNotes)) {
        console.warn(
          '⚠️ [REVIEW NOTE] review_notes was not an array, converting'
        );
        existingNotes = [];
      }

      const updatedNotes = [...existingNotes, newNote];
      console.log(
        '📊 [REVIEW NOTE] Total notes after update:',
        updatedNotes.length
      );

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
   * Create a message thread for external actions
   */
  private async createMessageThread(
    applicationId: string,
    action: StatusAction,
    message: string
  ): Promise<void> {
    try {
      console.log('🔍 [MESSAGE THREAD] Creating thread for action:', action.id);

      const subject = this.getThreadSubject(action, applicationId);

      const threadId = await this.messagingService.createApplicationThread(
        applicationId,
        subject
      );

      if (threadId) {
        await this.messagingService.sendMessage(threadId, message, 'message');
        console.log('✅ [MESSAGE THREAD] Thread created and message sent');
      }
    } catch (error) {
      console.error('⚠️ [MESSAGE THREAD] Error (non-critical):', error);
      // Non-critical - don't fail the action if messaging fails
    }
  }

  /**
   * Get thread subject based on action
   */
  private getThreadSubject(
    action: StatusAction,
    applicationId: string
  ): string {
    const subjects: Record<string, string> = {
      approve: 'Application Approved',
      reject: 'Application Status Update',
      request_documents: 'Additional Documents Requested',
      request_info: 'Information Request',
      request_amendments: 'Amendments Requested',
    };

    return subjects[action.id] || 'Application Update';
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
   * Get predefined status actions
   */
  getAvailableActions(): StatusAction[] {
    return [
      // EXTERNAL ACTIONS
      {
        id: 'approve',
        label: 'Approve Application',
        description: 'Approve this application for funding',
        category: 'external',
        status: 'approved',
        requiresComment: false,
        createsThread: true,
      },
      {
        id: 'reject',
        label: 'Reject Application',
        description: 'Reject this application with reason',
        category: 'external',
        status: 'rejected',
        requiresComment: true,
        createsThread: true,
      },
      {
        id: 'request_documents',
        label: 'Request Additional Documents',
        description: 'Request specific documents from applicant',
        category: 'external',
        status: 'under_review',
        requiresComment: true,
        createsThread: true,
      },
      {
        id: 'request_info',
        label: 'Request Clarification',
        description: 'Ask applicant for more information',
        category: 'external',
        status: 'under_review',
        requiresComment: true,
        createsThread: true,
      },
      {
        id: 'request_amendments',
        label: 'Request Amendments',
        description: 'Request changes to the application',
        category: 'external',
        status: 'under_review',
        requiresComment: true,
        createsThread: true,
      },

      // INTERNAL ACTIONS
      {
        id: 'refer_committee',
        label: 'Refer to Investment Committee',
        description: 'Send to committee for review',
        category: 'internal',
        status: 'under_review',
        requiresComment: false,
      },
      {
        id: 'add_note',
        label: 'Add Internal Note',
        description: 'Add private note visible only to team',
        category: 'internal',
        requiresComment: true,
      },
      {
        id: 'flag_review',
        label: 'Flag for Additional Review',
        description: 'Mark for deeper analysis',
        category: 'internal',
        requiresComment: true,
      },
      {
        id: 'set_priority',
        label: 'Set Priority Level',
        description: 'Change application priority',
        category: 'internal',
        requiresComment: false,
      },
      {
        id: 'request_peer_review',
        label: 'Request Peer Review',
        description: 'Ask colleague to review',
        category: 'internal',
        requiresComment: true,
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
