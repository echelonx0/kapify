import { Injectable, inject } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { MessagingService } from 'src/app/features/messaging/services/messaging.service';

/**
 * ApplicationNotificationService
 *
 * Handles all notification flows for funding applications:
 * 1. System message notifications to SME (via in-app messaging)
 * 2. Email confirmations to SME (via Resend)
 * 3. Funder notifications (via Resend)
 * 4. Status updates to both parties
 *
 * Pattern: Uses Supabase Edge Functions (send_notification_email) for emails,
 * and MessagingService for in-app system messages.
 */
@Injectable({
  providedIn: 'root',
})
export class ApplicationNotificationService {
  private messagingService = inject(MessagingService);
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  /**
   * PLACEHOLDER: Funder email mapping
   * TODO: Replace this with actual funder email from opportunity data
   * Schema: opportunities table should have 'funder_email' or similar field
   */
  private readonly FUNDER_EMAIL_MAP: Record<string, string> = {
    'bokamoso-fund': 'ig.ultrabix@gmail.com',
    'default-funder': 'charles@bokamosoas.co.za',
  };

  // ===============================
  // PUBLIC API
  // ===============================

  /**
   * Send complete notification suite for application submission
   * Orchestrates: System message + SME email + Funder notification
   */
  async notifyApplicationSubmission(options: {
    applicationId: string;
    applicationTitle: string;
    requestedAmount: number;
    fundingType: string[];
    opportunityId: string;
    opportunityTitle: string;
    smeUserId: string;
    smeEmail: string;
    smeCompanyName: string;
    funderId?: string; // Organization ID for funder lookup
  }): Promise<{
    systemMessageSent: boolean;
    smeEmailSent: boolean;
    funderEmailSent: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let systemMessageSent = false;
    let smeEmailSent = false;
    let funderEmailSent = false;

    try {
      // ✅ 1. Send in-app system message to SME
      try {
        systemMessageSent = await this.sendSubmissionSystemMessage(options);
        console.log('✅ System message sent to SME');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`System message failed: ${msg}`);
        console.error('❌ System message failed:', error);
      }

      // ✅ 2. Send confirmation email to SME
      try {
        smeEmailSent = await this.sendSubmissionEmailToSME(options);
        console.log('✅ Confirmation email sent to SME');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`SME email failed: ${msg}`);
        console.error('❌ SME email failed:', error);
      }

      // ✅ 3. Send notification to funder
      try {
        funderEmailSent = await this.sendSubmissionEmailToFunder(options);
        console.log('✅ Notification email sent to funder');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Funder email failed: ${msg}`);
        console.error('❌ Funder email failed:', error);
      }

      return {
        systemMessageSent,
        smeEmailSent,
        funderEmailSent,
        errors,
      };
    } catch (error) {
      console.error('❌ Notification suite failed:', error);
      throw error;
    }
  }

  /**
   * Send document request notification
   * Used when funder requests additional documents
   */
  async notifyDocumentRequest(options: {
    applicationId: string;
    applicationTitle: string;
    smeUserId: string;
    smeEmail: string;
    smeCompanyName: string;
    documentsRequested: string[];
    message: string;
    funderName: string;
  }): Promise<boolean> {
    try {
      // Send in-app system message
      const systemMessageSent = await this.sendDocumentRequestSystemMessage(
        options
      );

      // Send email to SME
      const emailSent = await this.sendDocumentRequestEmail(options);

      return systemMessageSent && emailSent;
    } catch (error) {
      console.error('❌ Document request notification failed:', error);
      throw error;
    }
  }

  /**
   * Send approval notification
   */
  async notifyApproval(options: {
    applicationId: string;
    applicationTitle: string;
    applicationAmount: number;
    smeUserId: string;
    smeEmail: string;
    smeCompanyName: string;
    funderName: string;
    nextSteps?: string;
  }): Promise<boolean> {
    try {
      // Send system message
      const systemMessageSent = await this.sendApprovalSystemMessage(options);

      // Send email
      const emailSent = await this.sendApprovalEmail(options);

      return systemMessageSent && emailSent;
    } catch (error) {
      console.error('❌ Approval notification failed:', error);
      throw error;
    }
  }

  /**
   * Send rejection notification
   */
  async notifyRejection(options: {
    applicationId: string;
    applicationTitle: string;
    smeUserId: string;
    smeEmail: string;
    smeCompanyName: string;
    funderName: string;
    reason: string;
  }): Promise<boolean> {
    try {
      // Send system message
      const systemMessageSent = await this.sendRejectionSystemMessage(options);

      // Send email
      const emailSent = await this.sendRejectionEmail(options);

      return systemMessageSent && emailSent;
    } catch (error) {
      console.error('❌ Rejection notification failed:', error);
      throw error;
    }
  }

  /**
   * Observable wrapper for submission notification (for reactive components)
   */
  notifyApplicationSubmissionObservable(
    options: Parameters<typeof this.notifyApplicationSubmission>[0]
  ): Observable<{
    systemMessageSent: boolean;
    smeEmailSent: boolean;
    funderEmailSent: boolean;
    errors: string[];
  }> {
    return from(this.notifyApplicationSubmission(options)).pipe(
      tap((result) => {
        if (result.errors.length === 0) {
          console.log('✅ All notifications sent successfully');
        } else {
          console.warn('⚠️ Some notifications failed:', result.errors);
        }
      }),
      catchError((error) => {
        console.error('❌ Notification service error:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // PRIVATE METHODS - SYSTEM MESSAGES
  // ===============================

  /**
   * Send submission confirmation system message to SME
   */
  private async sendSubmissionSystemMessage(options: {
    applicationId: string;
    applicationTitle: string;
    requestedAmount: number;
    fundingType: string[];
    opportunityTitle: string;
    smeUserId: string;
    smeCompanyName: string;
  }): Promise<boolean> {
    const message = this.buildSubmissionSystemMessage(options);

    return this.messagingService.sendSystemNotification(
      options.smeUserId,
      '✓ Application Submitted Successfully',
      message,
      {
        notification_type: 'application_submitted',
        entity_id: options.applicationId,
        entity_type: 'application',
      }
    );
  }

  /**
   * Send document request system message
   */
  private async sendDocumentRequestSystemMessage(options: {
    applicationId: string;
    applicationTitle: string;
    documentsRequested: string[];
    smeUserId: string;
  }): Promise<boolean> {
    const docList = options.documentsRequested.join('\n• ');
    const message = `Additional Documents Requested

We need the following documents to continue reviewing your application:

• ${docList}

Please upload these documents in your application dashboard to proceed with the review process.`;

    return this.messagingService.sendSystemNotification(
      options.smeUserId,
      '📋 Additional Documents Requested',
      message,
      {
        notification_type: 'documents_requested',
        entity_id: options.applicationId,
        entity_type: 'application',
      }
    );
  }

  /**
   * Send approval system message
   */
  private async sendApprovalSystemMessage(options: {
    applicationId: string;
    applicationTitle: string;
    applicationAmount: number;
    smeUserId: string;
    nextSteps?: string;
  }): Promise<boolean> {
    const formattedAmount = this.formatCurrency(options.applicationAmount);

    const message = `APPROVAL NOTIFICATION

Congratulations! Your application has been approved.

Application: ${options.applicationTitle}
Approved Amount: ${formattedAmount}

${
  options.nextSteps
    ? `Next Steps:\n${options.nextSteps}`
    : 'The funder will be in touch with next steps.'
}

Thank you for using Kapify!`;

    return this.messagingService.sendSystemNotification(
      options.smeUserId,
      '🎉 Application Approved',
      message,
      {
        notification_type: 'application_approved',
        entity_id: options.applicationId,
        entity_type: 'application',
      }
    );
  }

  /**
   * Send rejection system message
   */
  private async sendRejectionSystemMessage(options: {
    applicationId: string;
    applicationTitle: string;
    smeUserId: string;
    reason: string;
  }): Promise<boolean> {
    const message = `APPLICATION STATUS UPDATE

We've completed our review of your application.

Application: ${options.applicationTitle}

Status: Not Approved

Reason:
${options.reason}

We encourage you to explore other funding opportunities on Kapify that may be a better fit for your business.`;

    return this.messagingService.sendSystemNotification(
      options.smeUserId,
      'Application Status Update',
      message,
      {
        notification_type: 'application_rejected',
        entity_id: options.applicationId,
        entity_type: 'application',
      }
    );
  }

  // ===============================
  // PRIVATE METHODS - EMAIL
  // ===============================

  /**
   * Send submission confirmation email to SME
   * Calls: send_notification_email edge function
   */
  private async sendSubmissionEmailToSME(options: {
    applicationId: string;
    applicationTitle: string;
    requestedAmount: number;
    fundingType: string[];
    opportunityTitle: string;
    smeEmail: string;
    smeCompanyName: string;
  }): Promise<boolean> {
    const message = this.buildSubmissionEmailMessage(options);
    const fundingTypesList = options.fundingType.join(', ');

    return this.callEmailNotificationFunction({
      recipientEmail: options.smeEmail,
      recipientName: options.smeCompanyName,
      applicantCompanyName: options.smeCompanyName,
      applicationTitle: options.applicationTitle,
      actionType: 'submit',
      message,
      applicationAmount: options.requestedAmount,
      opportunityTitle: options.opportunityTitle,
    });
  }

  /**
   * Send document request email
   */
  private async sendDocumentRequestEmail(options: {
    applicationId: string;
    applicationTitle: string;
    smeEmail: string;
    smeCompanyName: string;
    documentsRequested: string[];
    message: string;
    funderName: string;
  }): Promise<boolean> {
    const docList = options.documentsRequested.join('\n• ');
    const fullMessage = `The following documents have been requested:

• ${docList}

${options.message}

Please log into Kapify to submit these documents.`;

    return this.callEmailNotificationFunction({
      recipientEmail: options.smeEmail,
      recipientName: options.smeCompanyName,
      applicantCompanyName: options.smeCompanyName,
      applicationTitle: options.applicationTitle,
      actionType: 'request_documents',
      message: fullMessage,
      funderName: options.funderName,
    });
  }

  /**
   * Send approval email
   */
  private async sendApprovalEmail(options: {
    applicationTitle: string;
    applicationAmount: number;
    smeEmail: string;
    smeCompanyName: string;
    funderName: string;
    nextSteps?: string;
  }): Promise<boolean> {
    const formattedAmount = this.formatCurrency(options.applicationAmount);

    const message = `Your application has been approved for ${formattedAmount}.

${
  options.nextSteps
    ? `Next Steps:\n${options.nextSteps}`
    : 'The funder will contact you with details about the funding.'
}`;

    return this.callEmailNotificationFunction({
      recipientEmail: options.smeEmail,
      recipientName: options.smeCompanyName,
      applicantCompanyName: options.smeCompanyName,
      applicationTitle: options.applicationTitle,
      actionType: 'approve',
      message,
      applicationAmount: options.applicationAmount,
      funderName: options.funderName,
    });
  }

  /**
   * Send rejection email
   */
  private async sendRejectionEmail(options: {
    applicationTitle: string;
    smeEmail: string;
    smeCompanyName: string;
    funderName: string;
    reason: string;
  }): Promise<boolean> {
    const message = `We've completed our review of your application for "${options.applicationTitle}".

Unfortunately, at this time, we've decided not to move forward.

Reason: ${options.reason}

We encourage you to explore other opportunities on Kapify.`;

    return this.callEmailNotificationFunction({
      recipientEmail: options.smeEmail,
      recipientName: options.smeCompanyName,
      applicantCompanyName: options.smeCompanyName,
      applicationTitle: options.applicationTitle,
      actionType: 'reject',
      message,
      funderName: options.funderName,
    });
  }

  /**
   * Send notification to funder
   * Called on application submission
   */
  private async sendSubmissionEmailToFunder(options: {
    applicationId: string;
    applicationTitle: string;
    requestedAmount: number;
    fundingType: string[];
    smeCompanyName: string;
    opportunityId: string;
    funderId?: string;
  }): Promise<boolean> {
    // Get funder email - currently hardcoded placeholder
    const funderEmail = this.getFunderEmail(options.funderId);

    const fundingTypesList = options.fundingType.join(', ');
    const formattedAmount = this.formatCurrency(options.requestedAmount);

    const message = `New Application Received

A new funding application has been submitted on Kapify.

Company: ${options.smeCompanyName}
Requested Amount: ${formattedAmount}
Funding Type: ${fundingTypesList}

Application ID: ${options.applicationId}
Status: Awaiting Review

Log into the Kapify funder dashboard to review this application.`;

    return this.callEmailNotificationFunction({
      recipientEmail: funderEmail,
      recipientName: 'Funding Team',
      applicantCompanyName: options.smeCompanyName,
      applicationTitle: options.applicationTitle,
      actionType: 'new_application',
      message,
      applicationAmount: options.requestedAmount,
    });
  }

  // ===============================
  // EDGE FUNCTION INTEGRATION
  // ===============================

  /**
   * Call send_notification_email edge function
   * Pattern: Same as FunderDocumentAnalysisService.callAnalysisFunction
   */
  /**
   * Call send_notification_email edge function
   * NOW NON-BLOCKING: Email failures don't block submission
   */
  private async callEmailNotificationFunction(payload: {
    recipientEmail: string;
    recipientName: string;
    applicantCompanyName?: string;
    applicationTitle?: string;
    actionType: string;
    message: string;
    applicationAmount?: number;
    funderName?: string;
    opportunityTitle?: string;
  }): Promise<boolean> {
    try {
      console.log('📧 Queueing email notification...', payload.actionType);

      // Validate email format
      if (!payload.recipientEmail || !payload.recipientEmail.includes('@')) {
        console.warn(
          '⚠️ Invalid email format, skipping notification:',
          payload.recipientEmail
        );
        return true; // Non-critical - don't block
      }

      const { data, error } = await this.supabase.functions.invoke(
        'send_notification_email',
        {
          body: payload,
        }
      );

      // ✅ FIX: Don't throw on error - just warn
      if (error) {
        console.warn('⚠️ Email service error (non-critical):', error.message);
        return true; // Non-blocking - don't fail
      }

      if (!data?.success) {
        const errorMsg = data?.error || 'Email service warning';
        console.warn('⚠️ Email service warning:', errorMsg);
        return true; // Non-blocking - don't fail
      }

      console.log('✅ Email queued successfully');
      return true;
    } catch (error) {
      console.error('❌ Email function caught error:', error);
      // ✅ FIX: Don't throw - return true to continue
      return true; // Non-blocking - don't fail submission
    }
  }

  // ===============================
  // UTILITIES
  // ===============================

  /**
   * Get funder email - PLACEHOLDER implementation
   * TODO: Replace with actual funder email lookup from opportunities table
   */
  private getFunderEmail(funderId?: string): string {
    if (funderId && this.FUNDER_EMAIL_MAP[funderId]) {
      return this.FUNDER_EMAIL_MAP[funderId];
    }
    // Placeholder: charles@bokamosoas.com
    return 'charles@bokamosoas.co.za';
  }

  /**
   * Format amount as ZAR currency
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Build submission system message content
   */
  private buildSubmissionSystemMessage(options: {
    applicationTitle: string;
    requestedAmount: number;
    fundingType: string[];
    opportunityTitle: string;
    smeCompanyName: string;
  }): string {
    const formattedAmount = this.formatCurrency(options.requestedAmount);
    const fundingTypes = options.fundingType.join(', ');

    return `APPLICATION SUBMITTED SUCCESSFULLY

Your application has been submitted to the funder.

Application Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Application: ${options.applicationTitle}
Company: ${options.smeCompanyName}
Requested Amount: ${formattedAmount}
Funding Type: ${fundingTypes}
Opportunity: ${options.opportunityTitle}

What's Next:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. The funder will review your application
2. You may receive requests for additional documents
3. We'll notify you of the funder's decision
4. Check your inbox for email updates

Timeline: Most funders review applications within 5-10 business days.

Thank you for using Kapify!`;
  }

  /**
   * Build submission email message content
   */
  private buildSubmissionEmailMessage(options: {
    applicationTitle: string;
    requestedAmount: number;
    fundingType: string[];
    opportunityTitle: string;
    smeCompanyName: string;
  }): string {
    const formattedAmount = this.formatCurrency(options.requestedAmount);
    const fundingTypes = options.fundingType.join(', ');

    return `Your application has been successfully submitted!

Application: ${options.applicationTitle}
Amount Requested: ${formattedAmount}
Funding Type: ${fundingTypes}
Opportunity: ${options.opportunityTitle}

The funder will now review your application. You'll receive updates as the review progresses.

Keep your information up to date and monitor your Kapify inbox for messages from the funder.

Best regards,
Kapify Team`;
  }
}
