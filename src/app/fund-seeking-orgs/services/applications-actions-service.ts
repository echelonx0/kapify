// import { Injectable, inject } from '@angular/core';
// import { Observable, throwError } from 'rxjs';
// import { tap, catchError } from 'rxjs/operators';
// import { ApplicationManagementService } from 'src/app/fund-seeking-orgs/services/application-management.service';
// import { DatabaseActivityService } from 'src/app/shared/services/database-activity.service';
// import { FundingApplication } from 'src/app/fund-seeking-orgs/models/application.models';
// import { ToastService } from 'src/app/shared/services/toast.service';
// import { MessagingService } from 'src/app/features/messaging/services/messaging.service';

// export type ApplicationStatus =
//   | 'submitted'
//   | 'under_review'
//   | 'approved'
//   | 'rejected';

// /**
//  * ApplicationManagementListService
//  * Handles application status updates with side effects:
//  * - Activity tracking (audit trail)
//  * - Applicant notifications (in-app messaging)
//  * - Toast feedback (UI confirmation)
//  */
// @Injectable({
//   providedIn: 'root',
// })
// export class ApplicationManagementListService {
//   private applicationService = inject(ApplicationManagementService);
//   private activityService = inject(DatabaseActivityService);
//   private messagingService = inject(MessagingService);
//   private toastService = inject(ToastService);

//   /**
//    * Update application status with full side effects
//    * - Tracks activity for audit trail
//    * - Notifies applicant via in-app message (broadcast)
//    * - Shows toast feedback
//    */
//   updateApplicationStatus(
//     application: FundingApplication,
//     newStatus: ApplicationStatus
//   ): Observable<FundingApplication> {
//     const appId = application.id;
//     const appTitle = application.title;
//     const applicantId = application.applicant?.id;

//     return this.applicationService
//       .updateApplicationStatus(appId, newStatus)
//       .pipe(
//         tap(async (updatedApp) => {
//           // 1. Track activity
//           this.trackStatusChange(appId, appTitle, newStatus, application);

//           // 2. Notify applicant (if applicable)
//           if (applicantId) {
//             await this.notifyApplicant(appId, appTitle, applicantId, newStatus);
//           }

//           // 3. Show success toast
//           this.showSuccessToast(newStatus);
//         }),
//         catchError((error) => {
//           const errorMsg =
//             error?.message || 'Failed to update application status';
//           this.toastService.error(errorMsg);
//           console.error('Error updating application status:', error);
//           return throwError(() => error);
//         })
//       );
//   }

//   /**
//    * Track status change in activity log
//    * Captures: what changed, when, and context (amount, opportunity)
//    */
//   private trackStatusChange(
//     applicationId: string,
//     applicationTitle: string,
//     status: ApplicationStatus,
//     application: FundingApplication
//   ): void {
//     const statusMessages: Record<ApplicationStatus, string> = {
//       submitted: 'Application submitted',
//       under_review: 'Application moved to under review',
//       approved: 'Application approved',
//       rejected: 'Application rejected',
//     };

//     const message = statusMessages[status];
//     const requestedAmount = this.extractRequestedAmount(application.formData);

//     // Use 'updated' for all status changes (valid action type)
//     this.activityService.trackApplicationActivity(
//       'updated',
//       applicationId,
//       `${message}: ${applicationTitle}`,
//       requestedAmount
//     );
//   }

//   /**
//    * Notify applicant of status change via in-app message (broadcast)
//    * Creates thread and sends system message with status update
//    */
//   private async notifyApplicant(
//     applicationId: string,
//     applicationTitle: string,
//     applicantId: string,
//     status: ApplicationStatus
//   ): Promise<void> {
//     try {
//       // Get or create thread for this application
//       const threads = await this.messagingService.getApplicationThreads(
//         applicationId
//       );
//       let threadId = threads.length > 0 ? threads[0].id : null;

//       if (!threadId) {
//         threadId = await this.messagingService.createApplicationThread(
//           applicationId,
//           `Application Status Update: ${applicationTitle}`
//         );
//       }

//       if (!threadId) {
//         console.warn(
//           'Could not create/find message thread for applicant notification'
//         );
//         return;
//       }

//       // Build status notification message
//       const statusMessages: Record<ApplicationStatus, string> = {
//         submitted: 'Your application has been submitted successfully.',
//         under_review: 'Your application is now under review by our team.',
//         approved:
//           'Congratulations! Your application has been approved. We will be in touch shortly with next steps.',
//         rejected:
//           'Thank you for your application. Unfortunately, it does not match our current requirements. Please feel free to apply again in the future.',
//       };

//       const message = statusMessages[status];

//       // Send broadcast message (system notification to applicant)
//       await this.messagingService.sendMessage(threadId, message, 'system', []);

//       console.log(`✅ Applicant notified of status change: ${status}`);
//     } catch (error) {
//       console.warn('Failed to notify applicant (non-blocking):', error);
//       // Don't throw - notification failure shouldn't block status update
//     }
//   }

//   /**
//    * Show success toast with status-specific messaging
//    */
//   private showSuccessToast(status: ApplicationStatus): void {
//     const messages: Record<ApplicationStatus, string> = {
//       submitted: 'Application submitted',
//       under_review: 'Application moved to review',
//       approved: 'Application approved',
//       rejected: 'Application rejected',
//     };

//     this.toastService.success(messages[status], 3000);
//   }

//   /**
//    * Extract requested amount from application form data
//    * Handles multiple possible paths in form structure
//    */
//   private extractRequestedAmount(formData: Record<string, any>): number {
//     return (
//       formData?.['coverInformation']?.requestedAmount ??
//       formData?.['requestedAmount'] ??
//       formData?.['fundingInformation']?.requestedAmount ??
//       0
//     );
//   }
// }
import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApplicationManagementService } from 'src/app/fund-seeking-orgs/services/application-management.service';
import { DatabaseActivityService } from 'src/app/shared/services/database-activity.service';
import { FundingApplication } from 'src/app/fund-seeking-orgs/models/application.models';
import { ToastService } from 'src/app/shared/services/toast.service';
import { MessagingService } from 'src/app/features/messaging/services/messaging.service';

export type ApplicationStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected';

/**
 * ApplicationActionsService
 * Centralized orchestration for all application status update side effects:
 * - Activity tracking (audit trail)
 * - Applicant notifications (in-app messaging)
 * - Toast feedback (UI confirmation)
 *
 * Used by both FunderApplicationsComponent and ApplicationManagementComponent
 * to ensure consistent behavior across the platform.
 */
@Injectable({
  providedIn: 'root',
})
export class ApplicationActionsService {
  private applicationService = inject(ApplicationManagementService);
  private activityService = inject(DatabaseActivityService);
  private messagingService = inject(MessagingService);
  private toastService = inject(ToastService);

  /**
   * Update application status with full side effects
   * - Tracks activity for audit trail
   * - Notifies applicant via in-app message (broadcast)
   * - Shows toast feedback
   */
  updateApplicationStatus(
    application: FundingApplication,
    newStatus: ApplicationStatus
  ): Observable<FundingApplication> {
    const appId = application.id;
    const appTitle = application.title;
    const applicantId = application.applicant?.id;

    return this.applicationService
      .updateApplicationStatus(appId, newStatus)
      .pipe(
        tap(async (updatedApp) => {
          // 1. Track activity
          this.trackStatusChange(appId, appTitle, newStatus, application);

          // 2. Notify applicant (if applicable)
          if (applicantId) {
            await this.notifyApplicant(appId, appTitle, applicantId, newStatus);
          }

          // 3. Show success toast
          this.showSuccessToast(newStatus);
        }),
        catchError((error) => {
          const errorMsg =
            error?.message || 'Failed to update application status';
          this.toastService.error(errorMsg);
          console.error('Error updating application status:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Track status change in activity log
   * Captures: what changed, when, and context (amount, opportunity)
   */
  private trackStatusChange(
    applicationId: string,
    applicationTitle: string,
    status: ApplicationStatus,
    application: FundingApplication
  ): void {
    const statusMessages: Record<ApplicationStatus, string> = {
      submitted: 'Application submitted',
      under_review: 'Application moved to under review',
      approved: 'Application approved',
      rejected: 'Application rejected',
    };

    const message = statusMessages[status];
    const requestedAmount = this.extractRequestedAmount(application.formData);

    // Use 'updated' for all status changes (valid action type)
    this.activityService.trackApplicationActivity(
      'updated',
      applicationId,
      `${message}: ${applicationTitle}`,
      requestedAmount
    );
  }

  /**
   * Notify applicant of status change via in-app message (broadcast)
   * Creates thread and sends system message with status update
   */
  private async notifyApplicant(
    applicationId: string,
    applicationTitle: string,
    applicantId: string,
    status: ApplicationStatus
  ): Promise<void> {
    try {
      // Get or create thread for this application
      const threads = await this.messagingService.getApplicationThreads(
        applicationId
      );
      let threadId = threads.length > 0 ? threads[0].id : null;

      if (!threadId) {
        threadId = await this.messagingService.createApplicationThread(
          applicationId,
          `Application Status Update: ${applicationTitle}`
        );
      }

      if (!threadId) {
        console.warn(
          'Could not create/find message thread for applicant notification'
        );
        return;
      }

      // Build status notification message
      const statusMessages: Record<ApplicationStatus, string> = {
        submitted: 'Your application has been submitted successfully.',
        under_review: 'Your application is now under review by our team.',
        approved:
          'Congratulations! Your application has been approved. We will be in touch shortly with next steps.',
        rejected:
          'Thank you for your application. Unfortunately, it does not match our current requirements. Please feel free to apply again in the future.',
      };

      const message = statusMessages[status];

      // Send broadcast message (system notification to applicant)
      await this.messagingService.sendMessage(threadId, message, 'system', []);

      console.log(`✅ Applicant notified of status change: ${status}`);
    } catch (error) {
      console.warn('Failed to notify applicant (non-blocking):', error);
      // Don't throw - notification failure shouldn't block status update
    }
  }

  /**
   * Show success toast with status-specific messaging
   */
  private showSuccessToast(status: ApplicationStatus): void {
    const messages: Record<ApplicationStatus, string> = {
      submitted: 'Application submitted',
      under_review: 'Application moved to review',
      approved: 'Application approved',
      rejected: 'Application rejected',
    };

    this.toastService.success(messages[status], 3000);
  }

  /**
   * Extract requested amount from application form data
   * Handles multiple possible paths in form structure
   */
  private extractRequestedAmount(formData: Record<string, any>): number {
    return (
      formData?.['coverInformation']?.requestedAmount ??
      formData?.['requestedAmount'] ??
      formData?.['fundingInformation']?.requestedAmount ??
      0
    );
  }
}
