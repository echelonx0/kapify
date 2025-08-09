// src/app/applications/components/application-detail-layout.component.ts
import { Component, signal, input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowLeft, MessageSquare, Upload, Clock, AlertCircle } from 'lucide-angular';
import { UiButtonComponent, UiProgressComponent, UiCardComponent, UiStatusBadgeComponent } from '../../shared/components';
import { Application } from '../../shared/models/application.models';
import { ApplicationService } from '../services/application.service';

@Component({
  selector: 'app-application-detail-layout',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent, UiProgressComponent, UiCardComponent, UiStatusBadgeComponent],
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
                <div>
                  <span class="text-neutral-500">Application ID:</span>
                  <div class="font-medium">{{ applicationData()?.applicationNumber }}</div>
                </div>
                <div>
                  <span class="text-neutral-500">Requested Amount:</span>
                  <div class="font-medium">
                    {{ applicationData()?.currency }} {{ formatNumber(applicationData()?.requestedAmount || 0) }}
                  </div>
                </div>
                <div>
                  <span class="text-neutral-500">Funding Type:</span>
                  <div class="font-medium capitalize">{{ applicationData()?.fundingType }}</div>
                </div>
                <div>
                  <span class="text-neutral-500">Submitted:</span>
                  <div class="font-medium">
                    {{ formatDate(applicationData()?.submittedAt) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center space-x-3 ml-6">
              @if (userRole() === 'funder') {
                <ui-button 
                  variant="outline" 
                  size="sm"
                  (clicked)="toggleCommentsPanel()"
                >
                  <lucide-icon [img]="MessageSquareIcon" [size]="16" class="mr-2" />
                  Comments
                </ui-button>
              }
              
              @if (userRole() === 'sme' && canEditApplication()) {
                <ui-button 
                  variant="primary" 
                  size="sm"
                  (clicked)="enterEditMode()"
                >
                  <lucide-icon [img]="UploadIcon" [size]="16" class="mr-2" />
                  Update Documents
                </ui-button>
              }
            </div>
          </div>

          <!-- Progress Bar -->
          @if (applicationData()?.currentStage) {
            <div class="mt-6">
              <ui-progress 
                [value]="getProgressPercentage()"
                [label]="getProgressLabel()"
                color="primary"
              />
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
                      @if (section.hasComments) {
                        <span class="ml-2 w-2 h-2 bg-primary-500 rounded-full"></span>
                      }
                    </button>
                  }
                </nav>
              </div>
            </div>

            <!-- Dynamic Section Content -->
            <ng-content />
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
              
              <!-- Comments will be loaded here -->
              <div class="p-4">
                <div class="text-sm text-neutral-500 text-center py-8">
                  Comments component will be loaded here
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
  applicationId = input.required<string>();
  
  // Signals
  applicationData = signal<Application | null>(null);
  isLoading = signal(true);
  activeSection = signal('administration');
  showCommentsPanel = signal(false);
  userRole = signal<'sme' | 'funder'>('sme'); // Will be determined from auth
  
  // Icons
  ArrowLeftIcon = ArrowLeft;
  MessageSquareIcon = MessageSquare;
  UploadIcon = Upload;
  ClockIcon = Clock;
  AlertCircleIcon = AlertCircle;

  // Application sections - matches your current structure
  applicationSections = signal([
    { id: 'administration', title: 'Administration Information', hasComments: false },
    { id: 'documents', title: 'Document Upload', hasComments: true },
    { id: 'business-review', title: 'Business Review', hasComments: false },
    { id: 'swot', title: 'SWOT Analysis', hasComments: false },
    { id: 'management', title: 'Management Governance', hasComments: false },
    { id: 'business-plan', title: 'Business Plan', hasComments: true },
    { id: 'financial-analysis', title: 'Financial Analysis', hasComments: false }
  ]);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private applicationService: ApplicationService
  ) {}

  ngOnInit() {
    this.loadApplicationData();
    this.determineUserRole();
  }

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

  canEditApplication(): boolean {
    const status = this.applicationData()?.status;
    return status === 'draft' || status === 'under_review';
  }

  enterEditMode() {
    // Navigate to edit mode or show edit UI
    this.router.navigate(['edit'], { relativeTo: this.route });
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
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

  getStatusColor(status: string): 'primary' | 'success' | 'warning' | 'error' {
    const colorMap: Record<string, 'primary' | 'success' | 'warning' | 'error'> = {
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

  getProgressPercentage(): number {
    const status = this.applicationData()?.status;
    const progressMap: Record<string, number> = {
      'draft': 10,
      'submitted': 25,
      'under_review': 50,
      'due_diligence': 75,
      'investment_committee': 85,
      'approved': 100,
      'rejected': 100,
      'funded': 100,
      'withdrawn': 100
    };
    return progressMap[status || 'draft'] || 10;
  }

  getProgressLabel(): string {
    const stage = this.applicationData()?.currentStage;
    if (!stage) return 'Application Processing';
    
    // Convert stage enum to readable text
    const stageNames: Record<string, string> = {
      'submission': 'Submission',
      'initial_review': 'Initial Review',
      'detailed_review': 'Detailed Review',
      'due_diligence': 'Due Diligence',
      'investment_committee': 'Investment Committee',
      'term_sheet': 'Term Sheet',
      'legal_docs': 'Legal Documentation',
      'funding': 'Funding'
    };
    
    return `Stage: ${stageNames[stage.stage] || stage.stage}`;
  }

  // Formatting helpers
  formatNumber(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date?: Date): string {
    if (!date) return 'Not specified';
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  private loadApplicationData() {
    this.applicationService.getApplication(this.applicationId()).subscribe({
      next: (application) => {
        this.applicationData.set(application);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load application:', error);
        this.isLoading.set(false);
      }
    });
  }

  private determineUserRole() {
    // This would come from your authentication service
    // For now, defaulting to 'sme'
    this.userRole.set('sme');
  }
}