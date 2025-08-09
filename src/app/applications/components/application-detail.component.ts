// // src/app/applications/components/application-detail-layout.component.ts
// import { Component, signal, input, OnInit } from '@angular/core';
// import { Router, ActivatedRoute } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { LucideAngularModule, ArrowLeft, MessageSquare, Upload, Clock, AlertCircle } from 'lucide-angular';
// import { UiButtonComponent, UiProgressComponent, UiCardComponent, UiStatusBadgeComponent } from '../../shared/components';
// import { Application } from '../../shared/models/application.models';
// import { ApplicationService } from '../services/applications.service';
 

// @Component({
//   selector: 'app-application-detail-layout',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule, UiButtonComponent, UiProgressComponent, UiCardComponent, UiStatusBadgeComponent],
//   template: `
//     <div class="min-h-screen bg-neutral-50">
//       <!-- Header -->
//       <div class="bg-white border-b border-neutral-200">
//         <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
//           <!-- Breadcrumb -->
//           <div class="flex items-center space-x-2 text-sm text-neutral-600 mb-4">
//             <button (click)="goBack()" class="hover:text-neutral-900 flex items-center space-x-1">
//               <lucide-icon [img]="ArrowLeftIcon" [size]="16" />
//               <span>Applications</span>
//             </button>
//             <span>></span>
//             <span>{{ applicationData()?.applicationNumber || 'Loading...' }}</span>
//           </div>

//           <!-- Application Header -->
//           <div class="flex items-start justify-between">
//             <div class="flex-1">
//               <div class="flex items-center space-x-3 mb-2">
//                 <h1 class="text-2xl font-bold text-neutral-900">
//                   {{ applicationData()?.title || 'Application Details' }}
//                 </h1>
//                 @if (applicationData()?.status) {
//                   <ui-status-badge 
//                     [text]="getStatusText(applicationData()!.status)"
//                     [color]="getStatusColor(applicationData()!.status)"
//                   />
//                 }
//               </div>
              
//               <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
//                 <div>
//                   <span class="text-neutral-500">Application ID:</span>
//                   <div class="font-medium">{{ applicationData()?.applicationNumber }}</div>
//                 </div>
//                 <div>
//                   <span class="text-neutral-500">Requested Amount:</span>
//                   <div class="font-medium">
//                     {{ applicationData()?.currency }} {{ formatNumber(applicationData()?.requestedAmount || 0) }}
//                   </div>
//                 </div>
//                 <div>
//                   <span class="text-neutral-500">Funding Type:</span>
//                   <div class="font-medium capitalize">{{ applicationData()?.fundingType }}</div>
//                 </div>
//                 <div>
//                   <span class="text-neutral-500">Submitted:</span>
//                   <div class="font-medium">
//                     {{ formatDate(applicationData()?.submittedAt) }}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <!-- Actions -->
//             <div class="flex items-center space-x-3 ml-6">
//               @if (userRole() === 'funder') {
//                 <ui-button 
//                   variant="outline" 
//                   size="sm"
//                   (clicked)="toggleCommentsPanel()"
//                 >
//                   <lucide-icon [img]="MessageSquareIcon" [size]="16" class="mr-2" />
//                   Comments
//                 </ui-button>
//               }
              
//               @if (userRole() === 'sme' && canEditApplication()) {
//                 <ui-button 
//                   variant="primary" 
//                   size="sm"
//                   (clicked)="enterEditMode()"
//                 >
//                   <lucide-icon [img]="UploadIcon" [size]="16" class="mr-2" />
//                   Update Documents
//                 </ui-button>
//               }
//             </div>
//           </div>

//           <!-- Progress Bar -->
//           @if (applicationData()?.currentStage) {
//             <div class="mt-6">
//               <ui-progress 
//                 [value]="getProgressPercentage()"
//                 [label]="getProgressLabel()"
//                 color="primary"
//               />
//             </div>
//           }
//         </div>
//       </div>

//       <!-- Main Content -->
//       <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//         <div class="flex gap-8">
//           <!-- Main Content Area -->
//           <div class="flex-1">
//             <!-- Application Sections Navigation -->
//             <div class="bg-white rounded-lg border border-neutral-200 mb-6">
//               <div class="border-b border-neutral-200">
//                 <nav class="flex space-x-8 px-6" aria-label="Sections">
//                   @for (section of applicationSections(); track section.id) {
//                     <button
//                       (click)="setActiveSection(section.id)"
//                       [class]="getSectionTabClass(section.id)"
//                     >
//                       {{ section.title }}
//                       @if (section.hasComments) {
//                         <span class="ml-2 w-2 h-2 bg-primary-500 rounded-full"></span>
//                       }
//                     </button>
//                   }
//                 </nav>
//               </div>
//             </div>

//             <!-- Dynamic Section Content -->
//             <ng-content />
//           </div>

//           <!-- Comments Sidebar -->
//           @if (showCommentsPanel()) {
//             <div class="w-80 bg-white rounded-lg border border-neutral-200 h-fit sticky top-6">
//               <div class="p-4 border-b border-neutral-200">
//                 <h3 class="text-lg font-semibold text-neutral-900">Section Comments</h3>
//                 <p class="text-sm text-neutral-600 mt-1">
//                   Internal review notes for {{ getActiveSectionTitle() }}
//                 </p>
//               </div>
              
//               <!-- Comments will be loaded here -->
//               <div class="p-4">
//                 <div class="text-sm text-neutral-500 text-center py-8">
//                   Comments component will be loaded here
//                 </div>
//               </div>
//             </div>
//           }
//         </div>
//       </div>
//     </div>
//   `
// })
// export class ApplicationDetailLayoutComponent implements OnInit {
//   applicationId = input.required<string>();
  
//   // Signals
//   applicationData = signal<Application | null>(null);
//   isLoading = signal(true);
//   activeSection = signal('administration');
//   showCommentsPanel = signal(false);
//   userRole = signal<'sme' | 'funder'>('sme'); // Will be determined from auth
  
//   // Icons
//   ArrowLeftIcon = ArrowLeft;
//   MessageSquareIcon = MessageSquare;
//   UploadIcon = Upload;
//   ClockIcon = Clock;
//   AlertCircleIcon = AlertCircle;

//   // Application sections - matches your current structure
//   applicationSections = signal([
//     { id: 'administration', title: 'Administration Information', hasComments: false },
//     { id: 'documents', title: 'Document Upload', hasComments: true },
//     { id: 'business-review', title: 'Business Review', hasComments: false },
//     { id: 'swot', title: 'SWOT Analysis', hasComments: false },
//     { id: 'management', title: 'Management Governance', hasComments: false },
//     { id: 'business-plan', title: 'Business Plan', hasComments: true },
//     { id: 'financial-analysis', title: 'Financial Analysis', hasComments: false }
//   ]);

//   constructor(
//     private router: Router,
//     private route: ActivatedRoute,
//     private applicationService: ApplicationService
//   ) {}

//   ngOnInit() {
//     this.loadApplicationData();
//     this.determineUserRole();
//   }

//   goBack() {
//     this.router.navigate(['/applications']);
//   }

//   toggleCommentsPanel() {
//     this.showCommentsPanel.update(show => !show);
//   }

//   setActiveSection(sectionId: string) {
//     this.activeSection.set(sectionId);
//   }

//   getSectionTabClass(sectionId: string): string {
//     const baseClasses = 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center';
//     const isActive = this.activeSection() === sectionId;
    
//     if (isActive) {
//       return `${baseClasses} border-primary-500 text-primary-600`;
//     }
//     return `${baseClasses} border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300`;
//   }

//   getActiveSectionTitle(): string {
//     const activeSection = this.applicationSections().find(s => s.id === this.activeSection());
//     return activeSection?.title || 'Section';
//   }

//   canEditApplication(): boolean {
//     const status = this.applicationData()?.status;
//     return status === 'draft' || status === 'under_review';
//   }

//   enterEditMode() {
//     // Navigate to edit mode or show edit UI
//     this.router.navigate(['edit'], { relativeTo: this.route });
//   }

//   getStatusText(status: string): string {
//     const statusMap: Record<string, string> = {
//       'draft': 'Draft',
//       'submitted': 'Submitted',
//       'under_review': 'Under Review',
//       'due_diligence': 'Due Diligence',
//       'investment_committee': 'Investment Committee',
//       'approved': 'Approved',
//       'rejected': 'Rejected',
//       'funded': 'Funded',
//       'withdrawn': 'Withdrawn'
//     };
//     return statusMap[status] || status;
//   }

//   getStatusColor(status: string): 'primary' | 'success' | 'warning' | 'error' {
//     const colorMap: Record<string, 'primary' | 'success' | 'warning' | 'error'> = {
//       'draft': 'warning',
//       'submitted': 'primary',
//       'under_review': 'primary',
//       'due_diligence': 'primary',
//       'investment_committee': 'warning',
//       'approved': 'success',
//       'rejected': 'error',
//       'funded': 'success',
//       'withdrawn': 'error'
//     };
//     return colorMap[status] || 'primary';
//   }

//   getProgressPercentage(): number {
//     const status = this.applicationData()?.status;
//     const progressMap: Record<string, number> = {
//       'draft': 10,
//       'submitted': 25,
//       'under_review': 50,
//       'due_diligence': 75,
//       'investment_committee': 85,
//       'approved': 100,
//       'rejected': 100,
//       'funded': 100,
//       'withdrawn': 100
//     };
//     return progressMap[status || 'draft'] || 10;
//   }

//   getProgressLabel(): string {
//     const stage = this.applicationData()?.currentStage;
//     if (!stage) return 'Application Processing';
    
//     // Convert stage enum to readable text
//     const stageNames: Record<string, string> = {
//       'submission': 'Submission',
//       'initial_review': 'Initial Review',
//       'detailed_review': 'Detailed Review',
//       'due_diligence': 'Due Diligence',
//       'investment_committee': 'Investment Committee',
//       'term_sheet': 'Term Sheet',
//       'legal_docs': 'Legal Documentation',
//       'funding': 'Funding'
//     };
    
//     return `Stage: ${stageNames[stage.stage] || stage.stage}`;
//   }

//   // Formatting helpers
//   formatNumber(amount: number): string {
//     return new Intl.NumberFormat('en-ZA', {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount);
//   }

//   formatDate(date?: Date): string {
//     if (!date) return 'Not specified';
//     return new Intl.DateTimeFormat('en-ZA', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     }).format(new Date(date));
//   }

//   private loadApplicationData() {
//     this.applicationService.getApplication(this.applicationId()).subscribe({
//       next: (application) => {
//         this.applicationData.set(application);
//         this.isLoading.set(false);
//       },
//       error: (error) => {
//         console.error('Failed to load application:', error);
//         this.isLoading.set(false);
//       }
//     });
//   }

//   private determineUserRole() {
//     // This would come from your authentication service
//     // For now, defaulting to 'sme'
//     this.userRole.set('sme');
//   }
// }


// src/app/applications/components/application-detail.component.ts
import { Component, signal, input, OnInit, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowLeft, MessageSquare, Upload, Clock, AlertCircle, Edit3, Trash2, Eye, DollarSign, Calendar, FileText, CheckCircle, XCircle, User, Building } from 'lucide-angular';
import { UiButtonComponent, UiProgressComponent, UiCardComponent, UiStatusBadgeComponent } from '../../shared/components';
import { Application, ApplicationStage, ApplicationStatus, ReviewNote } from '../../shared/models/application.models';
 
import { SWOTAnalysis } from '../../shared/models/swot.models';
import { ApplicationService } from '../services/applications.service';
import { SWOTAnalysisService } from '../services/swot-dummy.service';

interface ApplicationSection {
  id: string;
  title: string;
  hasComments: boolean;
  commentsCount?: number;
  isCompleted?: boolean;
}

@Component({
  selector: 'app-application-detail-layout',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    LucideAngularModule, 
    UiButtonComponent, 
    UiProgressComponent, 
    UiCardComponent, 
    UiStatusBadgeComponent
  ],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <!-- Header -->
      <div class="bg-white border-b border-neutral-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <!-- Breadcrumb -->
          <div class="flex items-center space-x-2 text-sm text-neutral-600 mb-4">
            <button (click)="goBack()" class="hover:text-neutral-900 flex items-center space-x-1">
              <lucide-icon [img]="ArrowLeftIcon" [size]="16" />
              <span>Applications</span>
            </button>
            <span>></span>
            <span>{{ applicationData()?.applicationNumber || 'Loading...' }}</span>
          </div>

          <!-- Application Header -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h1 class="text-2xl font-bold text-neutral-900">
                  {{ applicationData()?.title || 'Application Details' }}
                </h1>
                @if (applicationData()?.status) {
                  <ui-status-badge 
                    [text]="getStatusText(applicationData()!.status)"
                    [color]="getStatusColor(applicationData()!.status)"
                  />
                }
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div class="flex items-center space-x-2">
                  <lucide-icon [img]="DollarSignIcon" [size]="16" class="text-neutral-500" />
                  <span class="text-neutral-600">Requested:</span>
                  <span class="font-medium">{{ formatCurrency(applicationData()?.requestedAmount, applicationData()?.currency) }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <lucide-icon [img]="CalendarIcon" [size]="16" class="text-neutral-500" />
                  <span class="text-neutral-600">Submitted:</span>
                  <span class="font-medium">{{ formatDate(applicationData()?.submittedAt) }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <lucide-icon [img]="BuildingIcon" [size]="16" class="text-neutral-500" />
                  <span class="text-neutral-600">Funding Type:</span>
                  <span class="font-medium capitalize">{{ applicationData()?.fundingType }}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <lucide-icon [img]="UserIcon" [size]="16" class="text-neutral-500" />
                  <span class="text-neutral-600">Reviewer:</span>
                  <span class="font-medium">{{ getReviewerName() }}</span>
                </div>
              </div>
              
              @if (applicationData()?.description) {
                <p class="text-neutral-700 mt-3 max-w-3xl">{{ applicationData()!.description }}</p>
              }
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center space-x-3 ml-6">
              @if (canEditApplication()) {
                <ui-button variant="outline" (clicked)="enterEditMode()">
                  <lucide-icon [img]="Edit3Icon" [size]="16" class="mr-2" />
                  Edit
                </ui-button>
              }
              
              @if (canWithdrawApplication()) {
                <ui-button variant="outline" color="danger" (clicked)="withdrawApplication()">
                  <lucide-icon [img]="XCircleIcon" [size]="16" class="mr-2" />
                  Withdraw
                </ui-button>
              }
              
              @if (canManageApplication()) {
                <ui-button variant="outline" (clicked)="toggleCommentsPanel()">
                  <lucide-icon [img]="MessageSquareIcon" [size]="16" class="mr-2" />
                  Comments
                  @if (totalCommentsCount() > 0) {
                    <span class="ml-1 bg-primary-100 text-primary-700 px-1.5 py-0.5 text-xs rounded-full">
                      {{ totalCommentsCount() }}
                    </span>
                  }
                </ui-button>
              }
            </div>
          </div>

          <!-- Progress Bar -->
          @if (applicationProgress() > 0) {
            <div class="mt-6">
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="text-neutral-600">Application Progress</span>
                <span class="text-neutral-900 font-medium">{{ applicationProgress() }}% Complete</span>
              </div>
              <ui-progress [value]="applicationProgress()" />
            </div>
          }
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex gap-8">
          <!-- Main Content Area -->
          <div class="flex-1">
            <!-- Application Sections Navigation -->
            <div class="bg-white rounded-lg border border-neutral-200 mb-6">
              <div class="border-b border-neutral-200">
                <nav class="flex space-x-8 px-6" aria-label="Sections">
                  @for (section of applicationSections(); track section.id) {
                    <button
                      (click)="setActiveSection(section.id)"
                      [class]="getSectionTabClass(section.id)"
                    >
                      {{ section.title }}
                      @if (section.hasComments && section.commentsCount) {
                        <span class="ml-2 w-2 h-2 bg-primary-500 rounded-full"></span>
                      }
                      @if (section.isCompleted) {
                        <lucide-icon [img]="CheckCircleIcon" [size]="14" class="ml-2 text-green-500" />
                      }
                    </button>
                  }
                </nav>
              </div>
            </div>

            <!-- Dynamic Section Content -->
            <div class="bg-white rounded-lg border border-neutral-200 p-6">
              @switch (activeSection()) {
                @case ('administration') {
                  <div>
                    <h3 class="text-lg font-semibold text-neutral-900 mb-4">Administration Information</h3>
                    @if (applicationData()) {
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label class="block text-sm font-medium text-neutral-700 mb-1">Application Number</label>
                          <p class="text-neutral-900">{{ applicationData()!.applicationNumber }}</p>
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-neutral-700 mb-1">Funding Type</label>
                          <p class="text-neutral-900 capitalize">{{ applicationData()!.fundingType }}</p>
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-neutral-700 mb-1">Requested Amount</label>
                          <p class="text-neutral-900">{{ formatCurrency(applicationData()!.requestedAmount, applicationData()!.currency) }}</p>
                        </div>
                        <div>
                          <label class="block text-sm font-medium text-neutral-700 mb-1">Current Stage</label>
                          <p class="text-neutral-900">{{ applicationData()!.currentStage }}</p>
                        </div>
                      </div>
                      
                      @if (applicationData()!.purposeStatement) {
                        <div class="mt-6">
                          <label class="block text-sm font-medium text-neutral-700 mb-2">Purpose Statement</label>
                          <div class="bg-neutral-50 rounded-lg p-4">
                            <p class="text-neutral-900">{{ applicationData()!.purposeStatement }}</p>
                          </div>
                        </div>
                      }
                    }
                  </div>
                }
                
                @case ('use-of-funds') {
                  <div>
                    <h3 class="text-lg font-semibold text-neutral-900 mb-4">Use of Funds</h3>
                    @if (applicationData()?.useOfFunds?.length) {
                      <div class="space-y-4">
                        @for (fund of applicationData()!.useOfFunds; track fund.category) {
                          <div class="border border-neutral-200 rounded-lg p-4">
                            <div class="flex items-start justify-between mb-2">
                              <h4 class="font-medium text-neutral-900 capitalize">{{ fund.category.replace('_', ' ') }}</h4>
                              <div class="text-right">
                                <div class="text-lg font-semibold text-neutral-900">{{ formatCurrency(fund.amount, applicationData()!.currency) }}</div>
                                <div class="text-sm text-neutral-600">{{ fund.percentage }}%</div>
                              </div>
                            </div>
                            <p class="text-neutral-700 mb-2">{{ fund.description }}</p>
                            <div class="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span class="text-neutral-600">Timeline:</span>
                                <span class="ml-1 text-neutral-900">{{ fund.timeline }}</span>
                              </div>
                              <div>
                                <span class="text-neutral-600">Priority:</span>
                                <span class="ml-1 text-neutral-900 capitalize">{{ fund.priority }}</span>
                              </div>
                            </div>
                            @if (fund.expectedImpact) {
                              <div class="mt-2 text-sm">
                                <span class="text-neutral-600">Expected Impact:</span>
                                <span class="ml-1 text-neutral-900">{{ fund.expectedImpact }}</span>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="text-neutral-600">No use of funds data available.</p>
                    }
                  </div>
                }
                
                @case ('proposed-terms') {
                  <div>
                    <h3 class="text-lg font-semibold text-neutral-900 mb-4">Proposed Terms</h3>
                    @if (applicationData()?.proposedTerms) {
                      <div class="space-y-6">
                        @if (applicationData()!.fundingType === 'equity') {
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label class="block text-sm font-medium text-neutral-700 mb-1">Equity Offered</label>
                              <p class="text-neutral-900">{{ applicationData()!.proposedTerms!.equityOffered }}%</p>
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-neutral-700 mb-1">Expected Valuation</label>
                              <p class="text-neutral-900">{{ formatCurrency(applicationData()!.proposedTerms!.valuationExpected, applicationData()!.currency) }}</p>
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-neutral-700 mb-1">Board Seats</label>
                              <p class="text-neutral-900">{{ applicationData()!.proposedTerms!.boardSeats }}</p>
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-neutral-700 mb-1">Liquidation Preference</label>
                              <p class="text-neutral-900">{{ applicationData()!.proposedTerms!.liquidationPreference }}x</p>
                            </div>
                          </div>
                        }
                        
                        @if (applicationData()!.fundingType === 'debt') {
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label class="block text-sm font-medium text-neutral-700 mb-1">Interest Rate</label>
                              <p class="text-neutral-900">{{ applicationData()!.proposedTerms!.interestRate }}%</p>
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-neutral-700 mb-1">Repayment Period</label>
                              <p class="text-neutral-900">{{ applicationData()!.proposedTerms!.repaymentPeriod }} months</p>
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-neutral-700 mb-1">Security Offered</label>
                              <p class="text-neutral-900">{{ applicationData()!.proposedTerms!.securityOffered }}</p>
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-neutral-700 mb-1">Personal Guarantees</label>
                              <p class="text-neutral-900">{{ applicationData()!.proposedTerms!.personalGuarantees ? 'Yes' : 'No' }}</p>
                            </div>
                          </div>
                        }
                        
                        @if (applicationData()!.proposedTerms!.milestones?.length) {
                          <div>
                            <h4 class="font-medium text-neutral-900 mb-3">Proposed Milestones</h4>
                            <div class="space-y-3">
                              @for (milestone of applicationData()!.proposedTerms!.milestones; track milestone.name) {
                                <div class="border border-neutral-200 rounded-lg p-4">
                                  <div class="flex items-start justify-between">
                                    <div class="flex-1">
                                      <h5 class="font-medium text-neutral-900">{{ milestone.name }}</h5>
                                      <p class="text-neutral-700 mt-1">{{ milestone.description }}</p>
                                      @if (milestone.successCriteria?.length) {
                                        <div class="mt-2">
                                          <span class="text-sm text-neutral-600">Success Criteria:</span>
                                          <ul class="list-disc list-inside text-sm text-neutral-900 mt-1">
                                            @for (criteria of milestone.successCriteria; track criteria) {
                                              <li>{{ criteria }}</li>
                                            }
                                          </ul>
                                        </div>
                                      }
                                    </div>
                                    <div class="text-right ml-4">
                                      <div class="text-sm text-neutral-600">Target Date</div>
                                      <div class="text-sm font-medium text-neutral-900">{{ formatDate(milestone.targetDate) }}</div>
                                    </div>
                                  </div>
                                </div>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="text-neutral-600">No proposed terms available.</p>
                    }
                  </div>
                }
                
                @case ('swot-analysis') {
                  <div>
                    <h3 class="text-lg font-semibold text-neutral-900 mb-4">SWOT Analysis</h3>
                    @if (swotAnalysis()) {
                      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Strengths -->
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 class="font-medium text-green-900 mb-3 flex items-center">
                            <div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            Strengths ({{ swotAnalysis()!.strengths.length }})
                          </h4>
                          <div class="space-y-2">
                            @for (item of swotAnalysis()!.strengths.slice(0, 3); track item.id) {
                              <div class="text-sm">
                                <div class="font-medium text-green-900">{{ item.title }}</div>
                                <div class="text-green-700">{{ item.description }}</div>
                              </div>
                            }
                            @if (swotAnalysis()!.strengths.length > 3) {
                              <div class="text-sm text-green-600">
                                +{{ swotAnalysis()!.strengths.length - 3 }} more
                              </div>
                            }
                          </div>
                        </div>
                        
                        <!-- Weaknesses -->
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 class="font-medium text-red-900 mb-3 flex items-center">
                            <div class="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            Weaknesses ({{ swotAnalysis()!.weaknesses.length }})
                          </h4>
                          <div class="space-y-2">
                            @for (item of swotAnalysis()!.weaknesses.slice(0, 3); track item.id) {
                              <div class="text-sm">
                                <div class="font-medium text-red-900">{{ item.title }}</div>
                                <div class="text-red-700">{{ item.description }}</div>
                              </div>
                            }
                            @if (swotAnalysis()!.weaknesses.length > 3) {
                              <div class="text-sm text-red-600">
                                +{{ swotAnalysis()!.weaknesses.length - 3 }} more
                              </div>
                            }
                          </div>
                        </div>
                        
                        <!-- Opportunities -->
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 class="font-medium text-blue-900 mb-3 flex items-center">
                            <div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            Opportunities ({{ swotAnalysis()!.opportunities.length }})
                          </h4>
                          <div class="space-y-2">
                            @for (item of swotAnalysis()!.opportunities.slice(0, 3); track item.id) {
                              <div class="text-sm">
                                <div class="font-medium text-blue-900">{{ item.title }}</div>
                                <div class="text-blue-700">{{ item.description }}</div>
                              </div>
                            }
                            @if (swotAnalysis()!.opportunities.length > 3) {
                              <div class="text-sm text-blue-600">
                                +{{ swotAnalysis()!.opportunities.length - 3 }} more
                              </div>
                            }
                          </div>
                        </div>
                        
                        <!-- Threats -->
                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 class="font-medium text-yellow-900 mb-3 flex items-center">
                            <div class="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                            Threats ({{ swotAnalysis()!.threats.length }})
                          </h4>
                          <div class="space-y-2">
                            @for (item of swotAnalysis()!.threats.slice(0, 3); track item.id) {
                              <div class="text-sm">
                                <div class="font-medium text-yellow-900">{{ item.title }}</div>
                                <div class="text-yellow-700">{{ item.description }}</div>
                              </div>
                            }
                            @if (swotAnalysis()!.threats.length > 3) {
                              <div class="text-sm text-yellow-600">
                                +{{ swotAnalysis()!.threats.length - 3 }} more
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                      
                      <!-- Overall Score -->
                      @if (swotAnalysis()!.swotScores) {
                        <div class="mt-6 bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                          <h4 class="font-medium text-neutral-900 mb-3">Overall Assessment</h4>
                          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                              <div class="text-2xl font-bold text-neutral-900">{{ swotAnalysis()!.swotScores.overallScore }}</div>
                              <div class="text-sm text-neutral-600">Overall Score</div>
                            </div>
                            <div>
                              <div class="text-2xl font-bold text-neutral-900">{{ swotAnalysis()!.swotScores.investorReadinessImpact }}</div>
                              <div class="text-sm text-neutral-600">Investor Readiness</div>
                            </div>
                            <div>
                              <div class="text-2xl font-bold text-green-600">{{ swotAnalysis()!.swotScores.strengthsScore }}</div>
                              <div class="text-sm text-neutral-600">Strengths</div>
                            </div>
                            <div>
                              <div class="text-2xl font-bold text-blue-600">{{ swotAnalysis()!.swotScores.opportunitiesScore }}</div>
                              <div class="text-sm text-neutral-600">Opportunities</div>
                            </div>
                          </div>
                        </div>
                      }
                    } @else {
                      <div class="text-center py-8">
                        <lucide-icon [img]="AlertCircleIcon" [size]="48" class="mx-auto text-neutral-400 mb-4" />
                        <h4 class="text-lg font-medium text-neutral-900 mb-2">No SWOT Analysis Available</h4>
                        <p class="text-neutral-600 mb-4">SWOT analysis has not been completed for this application.</p>
                        @if (canEditApplication()) {
                          <ui-button variant="primary" (clicked)="createSWOTAnalysis()">
                            Create SWOT Analysis
                          </ui-button>
                        }
                      </div>
                    }
                  </div>
                }
                
                @case ('review-notes') {
                  <div>
                    <h3 class="text-lg font-semibold text-neutral-900 mb-4">Review Notes</h3>
                    @if (applicationData()?.reviewNotes?.length) {
                      <div class="space-y-4">
                        @for (note of applicationData()!.reviewNotes; track note.id) {
                          <div class="border border-neutral-200 rounded-lg p-4">
                            <div class="flex items-start justify-between mb-2">
                              <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                  <span class="text-xs font-medium text-primary-700">{{ getInitials(note.reviewerName) }}</span>
                                </div>
                                <div>
                                  <div class="font-medium text-neutral-900">{{ note.reviewerName }}</div>
                                  <div class="text-sm text-neutral-600">{{ formatDate(note.createdAt) }}</div>
                                </div>
                              </div>
                              <div class="flex items-center space-x-2">
                                @if (note.rating) {
                                  <div class="text-sm text-neutral-600">
                                    Rating: <span class="font-medium">{{ note.rating }}/10</span>
                                  </div>
                                }
                                <span [class]="getSentimentClass(note.sentiment)" class="px-2 py-1 text-xs rounded-full">
                                  {{ note.sentiment }}
                                </span>
                              </div>
                            </div>
                            <p class="text-neutral-900 mb-2">{{ note.content }}</p>
                            @if (note.tags?.length) {
                              <div class="flex flex-wrap gap-1">
                                @for (tag of note.tags; track tag) {
                                  <span class="bg-neutral-100 text-neutral-700 px-2 py-1 text-xs rounded">{{ tag }}</span>
                                }
                              </div>
                            }
                          </div>
                        }
                      </div>
                    } @else {
                      <div class="text-center py-8">
                        <lucide-icon [img]="MessageSquareIcon" [size]="48" class="mx-auto text-neutral-400 mb-4" />
                        <h4 class="text-lg font-medium text-neutral-900 mb-2">No Review Notes</h4>
                        <p class="text-neutral-600">No review notes have been added to this application yet.</p>
                      </div>
                    }
                    
                    @if (canManageApplication()) {
                      <div class="mt-6 border-t border-neutral-200 pt-6">
                        <h4 class="font-medium text-neutral-900 mb-4">Add Review Note</h4>
                        <div class="space-y-4">
                          <div>
                            <label class="block text-sm font-medium text-neutral-700 mb-2">Category</label>
                            <select [(ngModel)]="newNoteCategory" class="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                              <option value="general">General</option>
                              <option value="financial">Financial</option>
                              <option value="swot">SWOT</option>
                              <option value="business_model">Business Model</option>
                              <option value="team">Team</option>
                              <option value="market">Market</option>
                              <option value="risk">Risk</option>
                            </select>
                          </div>
                          <div>
                            <label class="block text-sm font-medium text-neutral-700 mb-2">Comment</label>
                            <textarea 
                              [(ngModel)]="newNoteContent"
                              rows="3"
                              class="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                              placeholder="Enter your review comments...">
                            </textarea>
                          </div>
                          <div class="grid grid-cols-2 gap-4">
                            <div>
                              <label class="block text-sm font-medium text-neutral-700 mb-2">Rating (optional)</label>
                              <select [(ngModel)]="newNoteRating" class="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                                <option value="">No rating</option>
                                <option value="1">1 - Poor</option>
                                <option value="2">2 - Below Average</option>
                                <option value="3">3 - Average</option>
                                <option value="4">4 - Good</option>
                                <option value="5">5 - Excellent</option>
                              </select>
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-neutral-700 mb-2">Sentiment</label>
                              <select [(ngModel)]="newNoteSentiment" class="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                                <option value="positive">Positive</option>
                                <option value="neutral">Neutral</option>
                                <option value="negative">Negative</option>
                                <option value="concern">Concern</option>
                              </select>
                            </div>
                          </div>
                          <div class="flex items-center space-x-3">
                            <ui-button 
                              variant="primary" 
                              (clicked)="addReviewNote()"
                              [disabled]="!newNoteContent || isAddingNote()"
                            >
                              @if (isAddingNote()) {
                                Adding...
                              } @else {
                                Add Note
                              }
                            </ui-button>
                            <label class="flex items-center space-x-2">
                              <input type="checkbox" [(ngModel)]="newNoteIsPrivate" class="rounded border-neutral-300">
                              <span class="text-sm text-neutral-700">Private note (internal only)</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
                
                @case ('status-management') {
                  <div>
                    <h3 class="text-lg font-semibold text-neutral-900 mb-4">Status Management</h3>
                    @if (canManageApplication()) {
                      <div class="space-y-6">
                        <!-- Current Status -->
                        <div class="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                          <h4 class="font-medium text-neutral-900 mb-2">Current Status</h4>
                          <div class="flex items-center space-x-3">
                            <ui-status-badge 
                              [text]="getStatusText(applicationData()!.status)"
                              [color]="getStatusColor(applicationData()!.status)"
                            />
                            <span class="text-neutral-600">{{ applicationData()?.currentStage?.stage }}</span>
                          </div>
                        </div>
                        
                        <!-- Status Update -->
                        <div class="border border-neutral-200 rounded-lg p-4">
                          <h4 class="font-medium text-neutral-900 mb-4">Update Status</h4>
                          <div class="space-y-4">
                            <div>
                              <label class="block text-sm font-medium text-neutral-700 mb-2">New Status</label>
                              <select [(ngModel)]="newStatus" class="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                                <option value="">Select new status</option>
                                <option value="submitted">Submitted</option>
                                <option value="under_review">Under Review</option>
                                <option value="due_diligence">Due Diligence</option>
                                <option value="investment_committee">Investment Committee</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                            <div>
                              <label class="block text-sm font-medium text-neutral-700 mb-2">Reason/Comments</label>
                              <textarea 
                                [(ngModel)]="statusUpdateReason"
                                rows="3"
                                class="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                placeholder="Provide reason for status change...">
                              </textarea>
                            </div>
                            <ui-button 
                              variant="primary" 
                              (clicked)="updateStatus()"
                              [disabled]="!newStatus || isUpdatingStatus()"
                            >
                              @if (isUpdatingStatus()) {
                                Updating...
                              } @else {
                                Update Status
                              }
                            </ui-button>
                          </div>
                        </div>
                      </div>
                    } @else {
                      <p class="text-neutral-600">You do not have permission to manage application status.</p>
                    }
                  </div>
                }
                
                @default {
                  <div class="text-center py-8">
                    <p class="text-neutral-600">Section content not implemented yet.</p>
                  </div>
                }
              }
            </div>
          </div>

          <!-- Comments Sidebar -->
          @if (showCommentsPanel()) {
            <div class="w-80 bg-white rounded-lg border border-neutral-200 h-fit sticky top-6">
              <div class="p-4 border-b border-neutral-200">
                <h3 class="text-lg font-semibold text-neutral-900">Section Comments</h3>
                <p class="text-sm text-neutral-600 mt-1">
                  Internal review notes for {{ getActiveSectionTitle() }}
                </p>
              </div>
              
              <div class="p-4">
                <div class="text-sm text-neutral-500 text-center py-8">
                  Comments component will be loaded here based on active section
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ApplicationDetailLayoutComponent implements OnInit {
  // Inputs
  applicationId = input.required<string>();
  
  // Icons
  ArrowLeftIcon = ArrowLeft;
  MessageSquareIcon = MessageSquare;
  UploadIcon = Upload;
  ClockIcon = Clock;
  AlertCircleIcon = AlertCircle;
  Edit3Icon = Edit3;
  Trash2Icon = Trash2;
  EyeIcon = Eye;
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  FileTextIcon = FileText;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  UserIcon = User;
  BuildingIcon = Building;
  
  // Signals
  applicationData = signal<Application | null>(null);
  swotAnalysis = signal<SWOTAnalysis | null>(null);
  isLoading = signal(true);
  activeSection = signal('administration');
  showCommentsPanel = signal(false);
  userRole = signal<'sme' | 'funder'>('sme'); // Will be determined from auth
  
  // Form states
  newNoteCategory = signal('general');
  newNoteContent = signal('');
  newNoteRating = signal<number | null>(null);
  newNoteSentiment = signal<'positive' | 'neutral' | 'negative' | 'concern'>('neutral');
  newNoteIsPrivate = signal(false);
  isAddingNote = signal(false);
  
  newStatus = signal<ApplicationStatus | ''>('');
  statusUpdateReason = signal('');
  isUpdatingStatus = signal(false);

  // Application sections - matches your current structure
  applicationSections = signal<ApplicationSection[]>([
    { id: 'administration', title: 'Administration', hasComments: false, isCompleted: true },
    { id: 'use-of-funds', title: 'Use of Funds', hasComments: false, isCompleted: true },
    { id: 'proposed-terms', title: 'Proposed Terms', hasComments: false, isCompleted: true },
    { id: 'swot-analysis', title: 'SWOT Analysis', hasComments: false, isCompleted: false },
    { id: 'review-notes', title: 'Review Notes', hasComments: true, commentsCount: 0 },
    { id: 'status-management', title: 'Status Management', hasComments: false }
  ]);

  // Computed properties
  applicationProgress = computed(() => {
    const app = this.applicationData();
    if (!app) return 0;
    
    const completedSteps = app.applicationSteps.filter(step => step.status === 'completed').length;
    const totalSteps = app.applicationSteps.length;
    
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  });

  totalCommentsCount = computed(() => {
    return this.applicationData()?.reviewNotes?.length || 0;
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private applicationService: ApplicationService,
    private swotService: SWOTAnalysisService
  ) {}

  ngOnInit() {
    this.loadApplicationData();
    this.determineUserRole();
  }

  private loadApplicationData() {
    this.isLoading.set(true);
    
    this.applicationService.getApplicationById(this.applicationId()).subscribe({
      next: (application) => {
        this.applicationData.set(application || null);
        this.updateSectionComments();
        
        // Load SWOT analysis if available
        if (application?.swotAnalysisId) {
          this.swotService.getSWOTAnalysisById(application.swotAnalysisId).subscribe({
            next: (swot) => this.swotAnalysis.set(swot || null)
          });
        }
        
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading application:', error);
        this.isLoading.set(false);
      }
    });
  }

  private updateSectionComments() {
    const app = this.applicationData();
    if (!app) return;

    this.applicationSections.update(sections => 
      sections.map(section => ({
        ...section,
        commentsCount: section.id === 'review-notes' ? app.reviewNotes.length : 0
      }))
    );
  }

  private determineUserRole() {
    // TODO: Get from auth service
    // For now, determine based on whether user can manage the application
    const app = this.applicationData();
    if (app && app.reviewTeam.includes('current-user-id')) {
      this.userRole.set('funder');
    } else {
      this.userRole.set('sme');
    }
  }

  // Navigation methods
  goBack() {
    this.router.navigate(['/applications']);
  }

  toggleCommentsPanel() {
    this.showCommentsPanel.update(show => !show);
  }

  setActiveSection(sectionId: string) {
    this.activeSection.set(sectionId);
  }

  getSectionTabClass(sectionId: string): string {
    const baseClasses = 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center';
    const isActive = this.activeSection() === sectionId;
    
    if (isActive) {
      return `${baseClasses} border-primary-500 text-primary-600`;
    }
    return `${baseClasses} border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300`;
  }

  getActiveSectionTitle(): string {
    const activeSection = this.applicationSections().find(s => s.id === this.activeSection());
    return activeSection?.title || 'Section';
  }

  // Permission methods
  canEditApplication(): boolean {
    const app = this.applicationData();
    const role = this.userRole();
    
    if (role === 'sme') {
      return app?.status === 'draft' || app?.status === 'under_review';
    }
    return false;
  }

  canWithdrawApplication(): boolean {
    const app = this.applicationData();
    const role = this.userRole();
    
    if (role === 'sme') {
      return app?.status !== 'approved' && app?.status !== 'funded' && app?.status !== 'withdrawn';
    }
    return false;
  }

  canManageApplication(): boolean {
    const app = this.applicationData();
    const role = this.userRole();
    
    if (role === 'funder') {
      return app?.reviewTeam.includes('current-user-id') || app?.assignedReviewer === 'current-user-id';
    }
    return false;
  }

  // Action methods
  enterEditMode() {
    this.router.navigate(['edit'], { relativeTo: this.route });
  }

  withdrawApplication() {
    const reason = prompt('Please provide a reason for withdrawing this application:');
    if (reason) {
      this.applicationService.withdrawApplication(this.applicationId(), reason).subscribe({
        next: (updatedApp) => {
          this.applicationData.set(updatedApp);
          alert('Application withdrawn successfully');
        },
        error: (error) => {
          console.error('Error withdrawing application:', error);
          alert('Error withdrawing application');
        }
      });
    }
  }

  createSWOTAnalysis() {
    const app = this.applicationData();
    if (!app) return;

    this.swotService.createSWOTAnalysis({
      applicationId: app.id,
      smeId: app.smeId,
      profileId: app.smeProfileId
    }).subscribe({
      next: (swot) => {
        this.swotAnalysis.set(swot);
        // Update application with SWOT ID
        this.applicationService.updateApplication(app.id, { swotAnalysisId: swot.id }).subscribe();
      },
      error: (error) => {
        console.error('Error creating SWOT analysis:', error);
        alert('Error creating SWOT analysis');
      }
    });
  }

addReviewNote() {
    if (!this.newNoteContent().trim()) return;

    this.isAddingNote.set(true);
    
    const noteData = {
      reviewerId: 'current-user-id', // TODO: Get from auth
      reviewerName: 'Current Reviewer', // TODO: Get from auth
      category: this.newNoteCategory() as any,
      content: this.newNoteContent(),
      rating: this.newNoteRating() || undefined, // Convert null to undefined
      sentiment: this.newNoteSentiment(),
      isPrivate: this.newNoteIsPrivate(),
      tags: []
    };

    this.applicationService.addReviewNote(this.applicationId(), noteData).subscribe({
      next: (note) => {
        // Refresh application data
        this.loadApplicationData();
        
        // Reset form
        this.newNoteContent.set('');
        this.newNoteRating.set(null);
        this.newNoteSentiment.set('neutral');
        this.newNoteIsPrivate.set(false);
        this.isAddingNote.set(false);
      },
      error: (error) => {
        console.error('Error adding review note:', error);
        alert('Error adding review note');
        this.isAddingNote.set(false);
      }
    });
  }

  updateStatus() {
    if (!this.newStatus()) return;

    this.isUpdatingStatus.set(true);
    
    this.applicationService.updateApplicationStatus(
      this.applicationId(), 
      this.newStatus() as ApplicationStatus, 
      this.statusUpdateReason()
    ).subscribe({
      next: (updatedApp) => {
        this.applicationData.set(updatedApp);
        this.newStatus.set('');
        this.statusUpdateReason.set('');
        this.isUpdatingStatus.set(false);
        alert('Status updated successfully');
      },
      error: (error) => {
        console.error('Error updating status:', error);
        alert('Error updating status');
        this.isUpdatingStatus.set(false);
      }
    });
  }

  // Utility methods
  getStatusText(status: ApplicationStatus): string {
    const statusMap: Record<ApplicationStatus, string> = {
      'draft': 'Draft',
      'submitted': 'Submitted',
      'under_review': 'Under Review',
      'due_diligence': 'Due Diligence',
      'investment_committee': 'Investment Committee',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'funded': 'Funded',
      'withdrawn': 'Withdrawn'
    };
    return statusMap[status] || status;
  }




getStatusColor(status: ApplicationStatus): 'primary' | 'success' | 'warning' | 'error' {
  const colorMap: Record<ApplicationStatus, 'primary' | 'success' | 'warning' | 'error'> = {
    'draft': 'warning',
    'submitted': 'primary',
    'under_review': 'primary',
    'due_diligence': 'primary',
    'investment_committee': 'warning',
    'approved': 'success',
    'rejected': 'error',
    'funded': 'success',
    'withdrawn': 'error'
  };
  return colorMap[status] || 'primary';
}

  getReviewerName(): string {
    const app = this.applicationData();
    if (!app?.assignedReviewer) return 'Not assigned';
    
    // TODO: Get actual reviewer name from user service
    const reviewerMap: Record<string, string> = {
      'funder-user-001': 'Sarah Johnson',
      'funder-user-002': 'David Chen',
      'funder-user-003': 'Michael Roberts',
      'funder-user-004': 'Lisa Wang'
    };
    
    return reviewerMap[app.assignedReviewer] || 'Unknown';
  }

  formatCurrency(amount?: number, currency?: string): string {
    if (!amount) return 'N/A';
    
    const formatter = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency || 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return formatter.format(amount);
  }

  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getSentimentClass(sentiment: string): string {
    const classMap: Record<string, string> = {
      'positive': 'bg-green-100 text-green-800',
      'neutral': 'bg-gray-100 text-gray-800',
      'negative': 'bg-red-100 text-red-800',
      'concern': 'bg-yellow-100 text-yellow-800'
    };
    return classMap[sentiment] || 'bg-gray-100 text-gray-800';
  }
}