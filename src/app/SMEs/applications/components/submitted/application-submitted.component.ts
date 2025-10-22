// src/app/applications/components/submitted/application-submitted.component.ts

import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, CheckCircle2, AlertTriangle, Clock, FileText, Mail, ArrowLeft, ExternalLink, Download, Calendar, User, Building2 } from 'lucide-angular';
import { UiButtonComponent, UiCardComponent } from 'src/app/shared/components'; 
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { Application } from 'src/app/shared/models/application.models'; 
import { SMEOpportunitiesService } from 'src/app/funding/services/opportunities.service';
import { DatabaseApplicationService } from 'src/app/SMEs/services/database-application.service';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

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
    UiCardComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-4xl mx-auto px-4 py-8">
        
        @if (isLoading()) {
          <!-- Loading State -->
          <div class="text-center py-16">
            <div class="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <lucide-icon [img]="ClockIcon" [size]="24" class="text-blue-600 animate-pulse" />
            </div>
            <h2 class="text-2xl font-semibold text-gray-900 mb-2">Processing Submission</h2>
            <p class="text-gray-600">Please wait while we verify your application details...</p>
          </div>
        } @else if (submissionResult()?.success) {
          <!-- Success State -->
          <div class="space-y-8">
            
            <!-- Success Header -->
            <div class="text-center">
              <div class="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <lucide-icon [img]="CheckCircle2Icon" [size]="32" class="text-green-600" />
              </div>
              <h1 class="text-3xl font-bold text-gray-900 mb-4">Application Successfully Submitted</h1>
              <p class="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Your funding application has been submitted and is now under review. 
                We'll keep you updated on its progress.
              </p>
            </div>

            <!-- Application Summary Card -->
            <ui-card class="overflow-hidden">
              <div class="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-white">
                <div class="flex items-start justify-between">
                  <div>
                    <h2 class="text-2xl font-semibold mb-2">{{ getApplicationTitle() }}</h2>
                    <p class="text-blue-100 text-lg">{{ getOpportunityFunder() }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-blue-200 mb-1">Application ID</p>
                    <p class="font-mono text-lg font-semibold">#{{ getApplicationId() }}</p>
                  </div>
                </div>
              </div>
              
              <div class="px-8 py-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <lucide-icon [img]="CalendarIcon" [size]="18" class="text-gray-600" />
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">Submitted</p>
                      <p class="text-sm text-gray-600">{{ formatDate(submissionResult()?.submittedAt) }}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <lucide-icon [img]="Building2Icon" [size]="18" class="text-gray-600" />
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">Amount Requested</p>
                      <p class="text-sm text-gray-600">{{ getFormattedAmount() }}</p>
                    </div>
                  </div>
                  
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <lucide-icon [img]="FileTextIcon" [size]="18" class="text-gray-600" />
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">Status</p>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {{ getApplicationStatus() }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ui-card>

            <!-- Next Steps -->
            <ui-card>
              <div class="px-8 py-6">
                <h3 class="text-xl font-semibold text-gray-900 mb-6">What Happens Next?</h3>
                
                <div class="space-y-6">
                  <div class="flex items-start space-x-4">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span class="text-sm font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-900 mb-1">Initial Review</h4>
                      <p class="text-gray-600">Your application will undergo an initial eligibility and completeness check within 2-3 business days.</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start space-x-4">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span class="text-sm font-bold text-blue-600">2</span>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-900 mb-1">Detailed Assessment</h4>
                      <p class="text-gray-600">Our review committee will evaluate your application against the funding criteria and business case.</p>
                    </div>
                  </div>
                  
                  <div class="flex items-start space-x-4">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span class="text-sm font-bold text-blue-600">3</span>
                    </div>
                    <div>
                      <h4 class="font-semibold text-gray-900 mb-1">Decision & Notification</h4>
                      <p class="text-gray-600">You'll receive a decision notification via email within {{ getExpectedTimeframe() }}.</p>
                    </div>
                  </div>
                </div>
              </div>
            </ui-card>

            <!-- Important Information -->
            <ui-card class="bg-amber-50 border-amber-200">
              <div class="px-8 py-6">
                <div class="flex items-start space-x-3">
                  <lucide-icon [img]="AlertTriangleIcon" [size]="20" class="text-amber-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 class="font-semibold text-amber-900 mb-2">Important Reminders</h3>
                    <ul class="space-y-2 text-sm text-amber-800">
                      <li class="flex items-start space-x-2">
                        <div class="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Keep your contact information up to date in case we need additional documents</span>
                      </li>
                      <li class="flex items-start space-x-2">
                        <div class="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Monitor your email regularly for updates and requests from our review team</span>
                      </li>
                      <li class="flex items-start space-x-2">
                        <div class="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span>You can track your application status in your dashboard at any time</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </ui-card>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <ui-button variant="primary" routerLink="/applications/home">
                <lucide-icon [img]="FileTextIcon" [size]="16" class="mr-2" />
                View All Applications
              </ui-button>
              <ui-button variant="outline" (click)="downloadConfirmation()" [disabled]="!canDownload()">
                <lucide-icon [img]="DownloadIcon" [size]="16" class="mr-2" />
                Download Confirmation
              </ui-button>
              <ui-button variant="outline" routerLink="/opportunities">
                <lucide-icon [img]="ExternalLinkIcon" [size]="16" class="mr-2" />
                Browse More Opportunities
              </ui-button>
            </div>
          </div>
          
        } @else {
          <!-- Error State -->
          <div class="text-center py-16">
            <div class="w-20 h-20 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <lucide-icon [img]="AlertTriangleIcon" [size]="32" class="text-red-600" />
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mb-4">Submission Failed</h1>
            <div class="max-w-lg mx-auto">
              <ui-card class="bg-red-50 border-red-200">
                <div class="px-6 py-4">
                  <p class="text-red-800 mb-4">{{ submissionResult()?.error || 'An unexpected error occurred while submitting your application.' }}</p>
                  <div class="flex flex-col sm:flex-row gap-3 justify-center">
                    <ui-button variant="primary" (click)="retrySubmission()">
                      Try Again
                    </ui-button>
                    <ui-button variant="outline" (click)="goBack()">
                      <lucide-icon [img]="ArrowLeftIcon" [size]="16" class="mr-2" />
                      Go Back
                    </ui-button>
                  </div>
                </div>
              </ui-card>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class ApplicationSubmittedComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private databaseApplicationService = inject(DatabaseApplicationService);
  private smeOpportunitiesService = inject(SMEOpportunitiesService);
  private destroy$ = new Subject<void>();

  // Icons
  CheckCircle2Icon = CheckCircle2;
  AlertTriangleIcon = AlertTriangle;
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
  submissionResult = signal<SubmissionResult | null>(null);

  // Computed properties
  canDownload = computed(() => {
    const result = this.submissionResult();
    return result?.success && result.application;
  });

  ngOnInit() {
    this.loadSubmissionDetails();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
      this.databaseApplicationService.getApplicationById(applicationId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (application) => {
            if (application) {
              let opportunity: FundingOpportunity | null = null;
              
              // Try to load opportunity if opportunityId is available
              if (opportunityId) {
                try {
                  const opportunityResult = await this.smeOpportunitiesService.getOpportunityById(opportunityId).toPromise();
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
                submittedAt: application.submittedAt || new Date()
              });
            } else {
              this.handleError('Application not found');
            }
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Failed to load application details:', error);
            this.handleError('Failed to load application details');
            this.isLoading.set(false);
          }
        });

    } catch (error) {
      console.error('Error in loadSubmissionDetails:', error);
      this.handleError('Failed to process submission details');
      this.isLoading.set(false);
    }
  }

  private handleError(message: string) {
    this.submissionResult.set({
      success: false,
      error: message
    });
  }

  // Helper methods
  getApplicationId(): string {
    const application = this.submissionResult()?.application;
    if (!application?.id) return 'N/A';
    
    // Handle different ID formats
    const id = application.id.toString();
    return id.length > 8 ? id.substring(0, 8).toUpperCase() : id.toUpperCase();
  }

  getApplicationTitle(): string {
    const result = this.submissionResult();
    return result?.application?.title || 
           result?.opportunity?.title || 
           'Funding Application';
  }

  getOpportunityFunder(): string {
    const result = this.submissionResult();
    // Fixed: Use the correct property names from FundingOpportunity model
    return result?.opportunity?.funderOrganizationName || 
           'Funding Organization';
  }

  getApplicationStatus(): string {
    const application = this.submissionResult()?.application;
    if (!application?.status) return 'Under Review';
    
    const statusMap: Record<string, string> = {
      'draft': 'Draft',
      'submitted': 'Under Review',
      'under_review': 'Under Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'withdrawn': 'Withdrawn'
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
      maximumFractionDigits: 0
    }).format(application.requestedAmount);
  }

  getExpectedTimeframe(): string {
    const opportunity = this.submissionResult()?.opportunity;
    
    // Fixed: Use decisionTimeframe instead of reviewTimeframe, with fallback
    if (opportunity?.decisionTimeframe) {
      const days = opportunity.decisionTimeframe;
      if (days <= 7) {
        return `${days} days`;
      } else if (days <= 30) {
        const weeks = Math.ceil(days / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
      } else {
        const months = Math.ceil(days / 30);
        return `${months} ${months === 1 ? 'month' : 'months'}`;
      }
    }
    
    return '4-6 weeks';
  }

  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  // Actions
  async downloadConfirmation() {
    if (!this.canDownload()) return;

    try {
      const result = this.submissionResult();
      if (result?.application) {
        // Create a simple confirmation document
        const confirmationData = this.generateConfirmationData(result);
        this.downloadAsText(confirmationData, `application-confirmation-${this.getApplicationId()}.txt`);
      }
    } catch (error) {
      console.error('Failed to download confirmation:', error);
    }
  }

  private generateConfirmationData(result: SubmissionResult): string {
    const app = result.application!;
    const opp = result.opportunity;
    
    return `
APPLICATION SUBMISSION CONFIRMATION

Application ID: #${this.getApplicationId()}
Application Title: ${this.getApplicationTitle()}
Submitted: ${this.formatDate(result.submittedAt)}
Status: ${this.getApplicationStatus()}
Amount Requested: ${this.getFormattedAmount()}

${opp ? `Opportunity: ${opp.title}` : ''}
${opp?.funderOrganizationName ? `Organization: ${opp.funderOrganizationName}` : ''}

Your application has been successfully submitted and is now under review.
You will be notified of any updates via email.

Thank you for your application.
    `.trim();
  }

  private downloadAsText(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

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
}