// // src/app/fund-seeking-orgs/applications/components/submitted/application-submitted.component.ts

// import {
//   Component,
//   inject,
//   signal,
//   computed,
//   OnInit,
//   OnDestroy,
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import {
//   LucideAngularModule,
//   Clock,
//   FileText,
//   Mail,
//   ArrowLeft,
//   ExternalLink,
//   Download,
//   Calendar,
//   User,
//   Building2,
//   TriangleAlert,
//   CircleCheck,
// } from 'lucide-angular';
// import { UiButtonComponent, UiCardComponent } from 'src/app/shared/components';
// import { takeUntil } from 'rxjs';
// import { Subject } from 'rxjs';
// import { SMEOpportunitiesService } from 'src/app/funding/services/opportunities.service';
// import { DatabaseApplicationService } from 'src/app/fund-seeking-orgs/services/database-application.service';
// import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
// import { Application } from '../../new-application/models/funding-application.model';
// import { MessagingService } from 'src/app/features/messaging/services/messaging.service';

// interface SubmissionResult {
//   success: boolean;
//   application?: Application;
//   opportunity?: FundingOpportunity;
//   error?: string;
//   submittedAt?: Date;
// }

// @Component({
//   selector: 'app-application-submitted',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     LucideAngularModule,
//     UiButtonComponent,
//     UiCardComponent,
//   ],
//   templateUrl: './application-submitted.component.html',
// })
// export class ApplicationSubmittedComponent implements OnInit, OnDestroy {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private databaseApplicationService = inject(DatabaseApplicationService);
//   private smeOpportunitiesService = inject(SMEOpportunitiesService);
//   private destroy$ = new Subject<void>();

//   private messagingService = inject(MessagingService);
//   // Icons
//   CheckCircle2Icon = CircleCheck;
//   AlertTriangleIcon = TriangleAlert;
//   ClockIcon = Clock;
//   FileTextIcon = FileText;
//   MailIcon = Mail;
//   ArrowLeftIcon = ArrowLeft;
//   ExternalLinkIcon = ExternalLink;
//   DownloadIcon = Download;
//   CalendarIcon = Calendar;
//   UserIcon = User;
//   Building2Icon = Building2;

//   // State
//   isLoading = signal(true);
//   submissionResult = signal<SubmissionResult | null>(null);

//   // Computed properties
//   canDownload = computed(() => {
//     const result = this.submissionResult();
//     return result?.success && result.application;
//   });

//   ngOnInit() {
//     this.loadSubmissionDetails();
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   private handleError(message: string) {
//     this.submissionResult.set({
//       success: false,
//       error: message,
//     });
//   }

//   // Helper methods
//   getApplicationId(): string {
//     const application = this.submissionResult()?.application;
//     if (!application?.id) return 'N/A';

//     // Handle different ID formats
//     const id = application.id.toString();
//     return id.length > 8 ? id.substring(0, 8).toUpperCase() : id.toUpperCase();
//   }

//   getApplicationTitle(): string {
//     const result = this.submissionResult();
//     return (
//       result?.application?.title ||
//       result?.opportunity?.title ||
//       'Funding Application'
//     );
//   }

//   getOpportunityFunder(): string {
//     const result = this.submissionResult();
//     // Fixed: Use the correct property names from FundingOpportunity model
//     return (
//       result?.opportunity?.funderOrganizationName || 'Funding Organization'
//     );
//   }

//   getApplicationStatus(): string {
//     const application = this.submissionResult()?.application;
//     if (!application?.status) return 'Under Review';

//     const statusMap: Record<string, string> = {
//       draft: 'Draft',
//       submitted: 'Under Review',
//       under_review: 'Under Review',
//       approved: 'Approved',
//       rejected: 'Rejected',
//       withdrawn: 'Withdrawn',
//     };

//     return statusMap[application.status] || 'Under Review';
//   }

//   getFormattedAmount(): string {
//     const application = this.submissionResult()?.application;
//     if (!application?.requestedAmount) return 'N/A';

//     const currency = application.currency || 'ZAR';

//     return new Intl.NumberFormat('en-ZA', {
//       style: 'currency',
//       currency: currency,
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(application.requestedAmount);
//   }

//   getExpectedTimeframe(): string {
//     const opportunity = this.submissionResult()?.opportunity;

//     // Fixed: Use decisionTimeframe instead of reviewTimeframe, with fallback
//     if (opportunity?.decisionTimeframe) {
//       const days = opportunity.decisionTimeframe;
//       if (days <= 7) {
//         return `${days} days`;
//       } else if (days <= 30) {
//         const weeks = Math.ceil(days / 7);
//         return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
//       } else {
//         const months = Math.ceil(days / 30);
//         return `${months} ${months === 1 ? 'month' : 'months'}`;
//       }
//     }

//     return '4-6 weeks';
//   }

//   formatDate(date?: Date): string {
//     if (!date) return 'N/A';

//     return new Intl.DateTimeFormat('en-ZA', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     }).format(new Date(date));
//   }

//   // Actions
//   async downloadConfirmation() {
//     if (!this.canDownload()) return;

//     try {
//       const result = this.submissionResult();
//       if (result?.application) {
//         // Create a simple confirmation document
//         const confirmationData = this.generateConfirmationData(result);
//         this.downloadAsText(
//           confirmationData,
//           `application-confirmation-${this.getApplicationId()}.txt`
//         );
//       }
//     } catch (error) {
//       console.error('Failed to download confirmation:', error);
//     }
//   }

//   private generateConfirmationData(result: SubmissionResult): string {
//     const app = result.application!;
//     const opp = result.opportunity;

//     return `
// APPLICATION SUBMISSION CONFIRMATION

// Application ID: #${this.getApplicationId()}
// Application Title: ${this.getApplicationTitle()}
// Submitted: ${this.formatDate(result.submittedAt)}
// Status: ${this.getApplicationStatus()}
// Amount Requested: ${this.getFormattedAmount()}

// ${opp ? `Opportunity: ${opp.title}` : ''}
// ${
//   opp?.funderOrganizationName
//     ? `Organization: ${opp.funderOrganizationName}`
//     : ''
// }

// Your application has been successfully submitted and is now under review.
// You will be notified of any updates by the Funder.

// Thank you for your application.
//     `.trim();
//   }

//   private downloadAsText(content: string, filename: string) {
//     const blob = new Blob([content], { type: 'text/plain' });
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement('a');

//     link.href = url;
//     link.download = filename;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     window.URL.revokeObjectURL(url);
//   }

//   retrySubmission() {
//     const params = this.route.snapshot.queryParams;
//     const opportunityId = params['opportunityId'];

//     if (opportunityId) {
//       this.router.navigate(['/applications/new', opportunityId]);
//     } else {
//       this.router.navigate(['/applications/new']);
//     }
//   }

//   goBack() {
//     const params = this.route.snapshot.queryParams;
//     const opportunityId = params['opportunityId'];

//     if (opportunityId) {
//       this.router.navigate(['/applications/new', opportunityId]);
//     } else {
//       this.router.navigate(['/applications/home']);
//     }
//   }

//   // ============================================
//   // STEP 3: Update loadSubmissionDetails() method
//   // ============================================

//   /**
//    * REPLACE the existing loadSubmissionDetails() with this version
//    * It adds notification sending after successful submission load
//    */
//   private async loadSubmissionDetails() {
//     try {
//       const params = this.route.snapshot.queryParams;
//       const applicationId = params['applicationId'];
//       const opportunityId = params['opportunityId'];

//       if (!applicationId) {
//         this.handleError('Application ID is required');
//         return;
//       }

//       // Load application details
//       this.databaseApplicationService
//         .getApplicationById(applicationId)
//         .pipe(takeUntil(this.destroy$))
//         .subscribe({
//           next: async (application) => {
//             if (application) {
//               let opportunity: FundingOpportunity | null = null;

//               // Try to load opportunity if opportunityId is available
//               if (opportunityId) {
//                 try {
//                   const opportunityResult = await this.smeOpportunitiesService
//                     .getOpportunityById(opportunityId)
//                     .toPromise();
//                   opportunity = opportunityResult || null;
//                 } catch (error) {
//                   console.warn('Failed to load opportunity details:', error);
//                   opportunity = null;
//                 }
//               }

//               this.submissionResult.set({
//                 success: true,
//                 application,
//                 opportunity: opportunity || undefined,
//                 submittedAt: application.submittedAt || new Date(),
//               });

//               // *** NEW: Send submission notification to SME ***
//               this.sendSubmissionNotification(application, opportunity);
//             } else {
//               this.handleError('Application not found');
//             }
//             this.isLoading.set(false);
//           },
//           error: (error) => {
//             console.error('Failed to load application details:', error);
//             this.handleError('Failed to load application details');
//             this.isLoading.set(false);
//           },
//         });
//     } catch (error) {
//       console.error('Error in loadSubmissionDetails:', error);
//       this.handleError('Failed to process submission details');
//       this.isLoading.set(false);
//     }
//   }

//   // ============================================
//   // STEP 4: Add new method for sending notification
//   // ============================================

//   /**
//    * Send submission confirmation notification to SME
//    * Runs automatically when submission page loads
//    */
//   private async sendSubmissionNotification(
//     application: Application,
//     opportunity: FundingOpportunity | null | undefined
//   ): Promise<void> {
//     try {
//       // Don't wait for notification (fire and forget)
//       this.messagingService
//         .sendApplicationSubmissionNotification(
//           application.id,
//           application.title,
//           application.requestedAmount || 0,
//           opportunity?.funderOrganizationName || 'Funding Organization',
//           opportunity?.title
//         )
//         .catch((error) => {
//           // Silent fail - notification error shouldn't break user experience
//           console.warn('Failed to send submission notification:', error);
//         });
//     } catch (error) {
//       console.warn('Error triggering submission notification:', error);
//     }
//   }
// }

import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  Clock,
  FileText,
  Mail,
  ArrowLeft,
  ExternalLink,
  Download,
  Calendar,
  User,
  Building2,
  TriangleAlert,
  CircleCheck,
} from 'lucide-angular';
import { UiButtonComponent, UiCardComponent } from 'src/app/shared/components';
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { SMEOpportunitiesService } from 'src/app/funding/services/opportunities.service';
import { DatabaseApplicationService } from 'src/app/fund-seeking-orgs/services/database-application.service';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
import { Application } from '../../new-application/models/funding-application.model';
import { MessagingService } from 'src/app/features/messaging/services/messaging.service';
import { PDFConfirmationService } from '../../new-application/services/pdf-confirmation.service';

interface SubmissionResult {
  success: boolean;
  application?: Application;
  opportunity?: FundingOpportunity;
  error?: string;
  submittedAt?: Date;
}

@Component({
  selector: 'app-application-submitted',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
  ],
  templateUrl: './application-submitted.component.html',
})
export class ApplicationSubmittedComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private databaseApplicationService = inject(DatabaseApplicationService);
  private smeOpportunitiesService = inject(SMEOpportunitiesService);
  private messagingService = inject(MessagingService);
  private pdfConfirmationService = inject(PDFConfirmationService);
  private destroy$ = new Subject<void>();

  // Icons
  CheckCircle2Icon = CircleCheck;
  AlertTriangleIcon = TriangleAlert;
  ClockIcon = Clock;
  FileTextIcon = FileText;
  MailIcon = Mail;
  ArrowLeftIcon = ArrowLeft;
  ExternalLinkIcon = ExternalLink;
  DownloadIcon = Download;
  CalendarIcon = Calendar;
  UserIcon = User;
  Building2Icon = Building2;

  // State
  isLoading = signal(true);
  isGeneratingPDF = signal(false);
  submissionResult = signal<SubmissionResult | null>(null);

  // Computed properties
  canDownload = computed(() => {
    const result = this.submissionResult();
    return result?.success && result.application && !this.isGeneratingPDF();
  });

  ngOnInit() {
    this.loadSubmissionDetails();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleError(message: string) {
    this.submissionResult.set({
      success: false,
      error: message,
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  getApplicationId(): string {
    const application = this.submissionResult()?.application;
    if (!application?.id) return 'N/A';

    const id = application.id.toString();
    return id.length > 8 ? id.substring(0, 8).toUpperCase() : id.toUpperCase();
  }

  getApplicationTitle(): string {
    const result = this.submissionResult();
    return (
      result?.application?.title ||
      result?.opportunity?.title ||
      'Funding Application'
    );
  }

  getOpportunityFunder(): string {
    const result = this.submissionResult();
    return (
      result?.opportunity?.funderOrganizationName || 'Funding Organization'
    );
  }

  getApplicationStatus(): string {
    const application = this.submissionResult()?.application;
    if (!application?.status) return 'Under Review';

    const statusMap: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Under Review',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
    };

    return statusMap[application.status] || 'Under Review';
  }

  getFormattedAmount(): string {
    const application = this.submissionResult()?.application;
    if (!application?.requestedAmount) return 'N/A';

    const currency = application.currency || 'ZAR';

    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(application.requestedAmount);
  }

  formatDate(date?: Date): string {
    if (!date) return 'N/A';

    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  // ============================================
  // PDF DOWNLOAD
  // ============================================

  async downloadConfirmation(): Promise<void> {
    if (!this.canDownload()) return;

    this.isGeneratingPDF.set(true);

    try {
      const result = this.submissionResult();
      if (!result?.application) {
        throw new Error('Application data not available');
      }

      const confirmationData = {
        applicationId: this.getApplicationId(),
        applicationTitle: this.getApplicationTitle(),
        submittedDate: result.submittedAt || new Date(),
        status: this.getApplicationStatus(),
        requestedAmount: result.application.requestedAmount || 0,
        currency: result.application.currency || 'ZAR',
        opportunityName: result.opportunity?.title,
        funderName: result.opportunity?.funderOrganizationName,
        funderEmail: result.opportunity?.contactEmail,
      };

      // Generate PDF
      const pdfBlob = await this.pdfConfirmationService.generateConfirmationPDF(
        confirmationData
      );

      // Download
      this.pdfConfirmationService.downloadPDF(
        pdfBlob,
        `kapify-confirmation-${confirmationData.applicationId}.pdf`
      );
    } catch (error) {
      console.error('Failed to generate PDF confirmation:', error);
      alert(
        'Failed to generate PDF. Please try again or contact support@kapify.africa'
      );
    } finally {
      this.isGeneratingPDF.set(false);
    }
  }

  // ============================================
  // NAVIGATION
  // ============================================

  retrySubmission() {
    const params = this.route.snapshot.queryParams;
    const opportunityId = params['opportunityId'];

    if (opportunityId) {
      this.router.navigate(['/applications/new', opportunityId]);
    } else {
      this.router.navigate(['/applications/new']);
    }
  }

  goBack() {
    const params = this.route.snapshot.queryParams;
    const opportunityId = params['opportunityId'];

    if (opportunityId) {
      this.router.navigate(['/applications/new', opportunityId]);
    } else {
      this.router.navigate(['/applications/home']);
    }
  }

  // ============================================
  // LOAD SUBMISSION DETAILS
  // ============================================

  private async loadSubmissionDetails() {
    try {
      const params = this.route.snapshot.queryParams;
      const applicationId = params['applicationId'];
      const opportunityId = params['opportunityId'];

      if (!applicationId) {
        this.handleError('Application ID is required');
        return;
      }

      // Load application details
      this.databaseApplicationService
        .getApplicationById(applicationId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (application) => {
            if (application) {
              let opportunity: FundingOpportunity | null = null;

              // Try to load opportunity if opportunityId is available
              if (opportunityId) {
                try {
                  const opportunityResult = await this.smeOpportunitiesService
                    .getOpportunityById(opportunityId)
                    .toPromise();
                  opportunity = opportunityResult || null;
                } catch (error) {
                  console.warn('Failed to load opportunity details:', error);
                  opportunity = null;
                }
              }

              this.submissionResult.set({
                success: true,
                application,
                opportunity: opportunity || undefined,
                submittedAt: application.submittedAt || new Date(),
              });

              // Send submission notification to SME
              this.sendSubmissionNotification(application, opportunity);
            } else {
              this.handleError('Application not found');
            }
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Failed to load application details:', error);
            this.handleError('Failed to load application details');
            this.isLoading.set(false);
          },
        });
    } catch (error) {
      console.error('Error in loadSubmissionDetails:', error);
      this.handleError('Failed to process submission details');
      this.isLoading.set(false);
    }
  }

  private async sendSubmissionNotification(
    application: Application,
    opportunity: FundingOpportunity | null | undefined
  ): Promise<void> {
    try {
      // Fire and forget - don't wait for notification
      this.messagingService
        .sendApplicationSubmissionNotification(
          application.id,
          application.title,
          application.requestedAmount || 0,
          opportunity?.funderOrganizationName || 'Funding Organization',
          opportunity?.title
        )
        .catch((error) => {
          console.warn('Failed to send submission notification:', error);
        });
    } catch (error) {
      console.warn('Error triggering submission notification:', error);
    }
  }
}
