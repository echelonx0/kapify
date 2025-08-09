 
// src/app/applications/components/applications-home.component.ts
import { Component, signal, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, Filter, Plus, Eye, Calendar, DollarSign, FileText, TrendingUp, Clock, Users, AlertCircle } from 'lucide-angular';
import { UiCardComponent, UiButtonComponent, UiStatusBadgeComponent } from '../../shared/components';
import { Application, ApplicationStage, ApplicationStatus, StatusColor } from '../../shared/models/application.models';
import { ApplicationService } from '../services/applications.service';
import { ActivityStreamComponent } from './activity-stream.component';
 

interface ApplicationsStats {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
}

@Component({
  selector: 'app-applications-home',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    LucideAngularModule,
    UiCardComponent,
    UiButtonComponent,
    UiStatusBadgeComponent,
        ActivityStreamComponent 
  ],
  templateUrl: 'applications-home.component.html'
})
export class ApplicationsHomeComponent implements OnInit {
  // Icons
  SearchIcon = Search;
  FilterIcon = Filter;
  PlusIcon = Plus;
  EyeIcon = Eye;
  CalendarIcon = Calendar;
  DollarSignIcon = DollarSign;
  FileTextIcon = FileText;
  TrendingUpIcon = TrendingUp;
  ClockIcon = Clock;
  UsersIcon = Users;
  AlertCircleIcon = AlertCircle;
 
  // State
  applications = signal<Application[]>([]);
  filteredApplications = signal<Application[]>([]);
  stats = signal<ApplicationsStats | null>(null);
  isLoading = signal(true);
  userID = 'uche'
  
  // Filter state
  showFilters = signal(false);
  searchQuery = signal('');
  filterStatus = signal<ApplicationStatus | ''>('');
  filterFundingType = signal<string>('');

  // Computed properties
  hasActiveFilters = computed(() => {
    return this.searchQuery() !== '' || 
           this.filterStatus() !== '' || 
           this.filterFundingType() !== '';
  });

  constructor(
    private router: Router,
    private applicationService: ApplicationService
  ) {}

  ngOnInit() {
    this.loadApplications();
    this.loadStats();
  }

  private loadApplications() {
    this.isLoading.set(true);
    
    this.applicationService.getApplications().subscribe({
      next: (applications) => {
        this.applications.set(applications);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.isLoading.set(false);
      }
    });
  }

  

  private loadStats() {
    this.applicationService.getApplicationsStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }
trackByApp(index: number, app: Application): string {
  return app.id; // or whatever unique ID field your Application model has
}

  // Filter methods
  toggleFilters() {
    this.showFilters.update(show => !show);
  }

  applyFilters() {
    let filtered = [...this.applications()];
    
    // Search filter
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(app => 
        app.title.toLowerCase().includes(query) ||
        app.applicationNumber.toLowerCase().includes(query) ||
        app.description?.toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (this.filterStatus()) {
      filtered = filtered.filter(app => app.status === this.filterStatus());
    }
    
    // Funding type filter
    if (this.filterFundingType()) {
      filtered = filtered.filter(app => app.fundingType === this.filterFundingType());
    }
    
    this.filteredApplications.set(filtered);
  }


getStageDisplayName(stage?: ApplicationStage): string {
  if (!stage) return 'Not started';

  const stageNames: Record<ApplicationStage['stage'], string> = {
    submission: 'Submission',
    initial_review: 'Initial Review',
    detailed_review: 'Detailed Review',
    due_diligence: 'Due Diligence',
    investment_committee: 'Investment Committee',
    term_sheet: 'Term Sheet',
    legal_docs: 'Legal Documentation',
    funding: 'Funding'
  };

  return stageNames[stage.stage] || stage.stage;
}



  clearFilters() {
    this.searchQuery.set('');
    this.filterStatus.set('');
    this.filterFundingType.set('');
    this.applyFilters();
  }

  // Navigation methods
  createNewApplication() {
    this.router.navigate(['/applications/new']);
  }

  viewApplication(applicationId: string) {
    this.router.navigate(['/applications', applicationId]);
  }

  loadMoreApplications() {
    // TODO: Implement pagination
    console.log('Load more applications');
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



getStatusColor(status: ApplicationStatus): StatusColor {
  const colorMap: Record<ApplicationStatus, StatusColor> = {
    draft: 'neutral',
    submitted: 'blue',
    under_review: 'yellow',
    due_diligence: 'purple',
    investment_committee: 'orange',
    approved: 'green',
    rejected: 'red',
    funded: 'green',
    withdrawn: 'gray'
  };
  return colorMap[status] || 'neutral';
}

  getApplicationProgress(application: Application): number {
    const completedSteps = application.applicationSteps.filter(step => step.status === 'completed').length;
    const totalSteps = application.applicationSteps.length;
    
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  }

  getApplicationActions(application: Application): string[] {
    const actions: string[] = [];
    
    if (application.status === 'draft') {
      actions.push('Complete and submit application');
    } else if (application.status === 'under_review' && application.reviewNotes.length === 0) {
      actions.push('Awaiting initial review');
    } else if (application.currentStage?.status === 'in_progress') {
      actions.push(application.currentStage.stage);
    }
    
    return actions;
  }

  formatCurrency(amount: number, currency: string): string {
    const formatter = new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency || 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return formatter.format(amount);
  }

  formatTotalRequested(): string {
    const total = this.applications().reduce((sum, app) => sum + app.requestedAmount, 0);
    return this.formatCurrency(total, 'ZAR');
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }
}