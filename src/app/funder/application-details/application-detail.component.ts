 
// src/app/applications/components/application-detail.component.ts
import { Component, signal, input, OnInit, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ArrowLeft, MessageSquare, Upload, Clock, AlertCircle, Edit3, Trash2, Eye, DollarSign, Calendar, FileText, CheckCircle, XCircle, User, Building } from 'lucide-angular';
import { UiButtonComponent, UiProgressComponent, UiStatusBadgeComponent } from '../../shared/components';
import { Application, ApplicationStatus } from '../../shared/models/application.models';
 
import { SWOTAnalysis } from '../../shared/models/swot.models';
import { ApplicationService } from 'src/app/SMEs/services/applications.service';
 
 
 

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
   
    UiStatusBadgeComponent
  ],
  templateUrl: 'application-detail.component.html'
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
        // if (application?.swotAnalysisId) {
        //   this.swotService.getSWOTAnalysisById(application.swotAnalysisId).subscribe({
        //     next: (swot) => this.swotAnalysis.set(swot || null)
        //   });
        // }
        
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