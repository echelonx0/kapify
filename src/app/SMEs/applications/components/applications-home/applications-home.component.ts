// applications-home.component.ts
import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { 
  LucideAngularModule, 
  FileText, 
  Clock, 
  TrendingUp, 
  DollarSign,
  Plus,
  Filter,
  Eye,
  Search,
  X,
  Settings,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle
} from 'lucide-angular';

import { UiButtonComponent } from '../../../shared/components';
import { ActivityInboxComponent } from '../../../shared/components/messaging/messaging.component';
import { AuthService } from '../../../auth/production.auth.service';

// Import services based on user type
import { OpportunityApplicationService, OpportunityApplication } from '../../services/opportunity-application.service';
import { ApplicationManagementService, FundingApplication } from '../../services/application-management.service';
import { ProfileManagementService } from '../../../shared/services/profile-management.service';
 
interface ApplicationData {
  id: string;
  title: string;
  applicationNumber?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  fundingType?: string;
  requestedAmount: number;
  currency: string;
  currentStage?: string;
  description?: string;
  matchScore?: number;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  
  // For funder view
  applicantName?: string;
  applicantCompany?: string;
  opportunityTitle?: string;
  
  // For SME view
  opportunityId?: string;
}

@Component({
  selector: 'app-applications-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    UiButtonComponent,
    ActivityInboxComponent
  ],
  templateUrl: 'applications-home.component.html',
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class ApplicationsHomeComponent implements OnInit, OnDestroy {
  // Services
  private router = inject(Router);
  private authService = inject(AuthService);
  private smeApplicationService = inject(OpportunityApplicationService);
  private funderApplicationService = inject(ApplicationManagementService);
  private destroy$ = new Subject<void>();
   private profileService = inject(ProfileManagementService);
  currentOrganization = this.profileService.currentOrganization;
  // Icons
  FileTextIcon = FileText;
  ClockIcon = Clock;
  TrendingUpIcon = TrendingUp;
  DollarSignIcon = DollarSign;
  PlusIcon = Plus;
  FilterIcon = Filter;
  EyeIcon = Eye;
  SearchIcon = Search;
  XIcon = X;
  SettingsIcon = Settings;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  RefreshCwIcon = RefreshCw;
  AlertCircleIcon = AlertCircle;

  // State
  isLoading = signal(false);
  showFilters = signal(false);
  applications = signal<ApplicationData[]>([]);
  error = signal<string | null>(null);

  // Filters
  searchQuery = signal('');
  statusFilter = signal('');
  fundingTypeFilter = signal('');

  // User context
  currentUser = computed(() => this.authService.user());
  userType = computed(() => this.currentUser()?.userType);
  isFunder = computed(() => this.userType() === 'funder');
  isSME = computed(() => this.userType() === 'sme');

  ngOnInit() {
    this.loadApplications();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // DATA LOADING
  // ===============================

 

  private loadSMEApplications() {
    this.smeApplicationService.loadUserApplications()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          this.error.set('Failed to load your applications');
          this.isLoading.set(false);
          console.error('SME applications load error:', error);
          throw error;
        })
      )
      .subscribe({
   next: (smeApplications: OpportunityApplication[]) => {
  const applicationData = smeApplications.map(app => this.transformSMEApplication(app));
  this.applications.set(this.mergeDrafts(applicationData));
  this.isLoading.set(false);
},
        error: () => {
          this.applications.set([]);
          this.isLoading.set(false);
        }
      });
  }

// Fix for the loadFunderApplications method in your applications-home.component.ts

// Replace the existing loadFunderApplications method with this:
private loadFunderApplications(userId: string) {
  // Get the organization ID from ProfileService
  const organizationId = this.currentOrganization()?.id; // Call the signal to get the value
  
  if (!organizationId) {
    console.error('No organization ID found for funder');
    this.error.set('Please complete your organization setup to view applications.');
    this.isLoading.set(false);
    return;
  }

  console.log('Loading applications for organization:', organizationId);

  this.funderApplicationService.getApplicationsByOrganization(organizationId)
    .pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.error.set('Failed to load organization applications');
        this.isLoading.set(false);
        console.error('Funder applications load error:', error);
        throw error;
      })
    )
    .subscribe({
next: (funderApplications: FundingApplication[]) => {
  const applicationData = funderApplications.map(app => this.transformFunderApplication(app));
  this.applications.set(this.mergeDrafts(applicationData));
  this.isLoading.set(false);
},
      error: () => {
        this.applications.set([]);
        this.isLoading.set(false);
      }
    });
}

// Also update the loadApplications method to ensure profile data is loaded:
loadApplications() {
  const user = this.currentUser();
  if (!user) {
    this.error.set('User not authenticated');
    return;
  }

  this.isLoading.set(true);
  this.error.set(null);
  console.log('The user is a:', this.userType());

  if (this.isFunder()) {
    // For funders, ensure we have organization data first
    const orgId = this.currentOrganization()?.id;
    
    if (!orgId) {
      // Try to load profile data first
      this.profileService.loadProfileData()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            // After profile loads, try again
            this.loadFunderApplications(user.id);
          },
          error: (error) => {
            console.error('Failed to load profile data:', error);
            this.error.set('Please complete your organization setup.');
            this.isLoading.set(false);
          }
        });
    } else {
      this.loadFunderApplications(user.id);
    }
  } else {
    this.loadSMEApplications();
  }
}

  // ===============================
  // DATA TRANSFORMATION
  // ===============================

  private transformSMEApplication(app: OpportunityApplication): ApplicationData {
    return { 
      id: app.id,
      title: app.title,
      applicationNumber: `APP-${app.id.slice(-6).toUpperCase()}`,
      status: app.status,
      fundingType: app.opportunity?.fundingType || 'unknown',
      requestedAmount: app.coverInformation.requestedAmount || 0,
      currency: app.opportunity?.currency || 'ZAR',
      currentStage: this.getStageDisplayName(app.stage),
      description: app.description || app.coverInformation.purposeStatement,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      submittedAt: app.submittedAt,
      opportunityId: app.opportunityId,
      opportunityTitle: app.opportunity?.title
    };
  }

  private transformFunderApplication(app: FundingApplication): ApplicationData {
    return {
      id: app.id,
      title: app.title,
      status: app.status,
      fundingType: app.opportunity?.fundingType || 'unknown',
      requestedAmount: this.extractRequestedAmount(app.formData),
      currency: app.opportunity?.currency || 'ZAR',
      currentStage: this.getStageDisplayName(app.stage),
      description: app.description,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      submittedAt: app.submittedAt,
      applicantName: `${app.applicant?.firstName || ''} ${app.applicant?.lastName || ''}`.trim(),
      applicantCompany: app.applicant?.companyName,
      opportunityTitle: app.opportunity?.title
    };
  }

  private extractRequestedAmount(formData: Record<string, any>): number {
    return formData?.['coverInformation']?.requestedAmount || 
           formData?.['requestedAmount'] || 
           0;
  }

  private getStageDisplayName(stage: string): string {
    const stageMap: Record<string, string> = {
      'initial_review': 'Initial Review',
      'due_diligence': 'Due Diligence',
      'investment_committee': 'Investment Committee',
      'documentation': 'Documentation',
      'completed': 'Completed'
    };
    return stageMap[stage] || stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // ===============================
  // COMPUTED PROPERTIES
  // ===============================

  filteredApplications = computed(() => {
    let filtered = this.applications();

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(app => 
        app.title.toLowerCase().includes(query) ||
        app.applicationNumber?.toLowerCase().includes(query) ||
        app.description?.toLowerCase().includes(query) ||
        app.applicantName?.toLowerCase().includes(query) ||
        app.applicantCompany?.toLowerCase().includes(query) ||
        app.opportunityTitle?.toLowerCase().includes(query)
      );
    }

    if (this.statusFilter()) {
      filtered = filtered.filter(app => app.status === this.statusFilter());
    }

    if (this.fundingTypeFilter()) {
      filtered = filtered.filter(app => app.fundingType === this.fundingTypeFilter());
    }

    return filtered;
  });

  stats = computed(() => {
    const apps = this.applications();
    return {
      total: apps.length,
      draft: apps.filter(app => app.status === 'draft').length,
      submitted: apps.filter(app => app.status === 'submitted').length,
      underReview: apps.filter(app => app.status === 'under_review').length,
      approved: apps.filter(app => app.status === 'approved').length,
      rejected: apps.filter(app => app.status === 'rejected').length
    };
  });

  hasActiveFilters = computed(() => {
    return !!(this.searchQuery() || this.statusFilter() || this.fundingTypeFilter());
  });

  /**
 * Merge draft applications for the same opportunity.
 * Keeps only the most recent draft (by updatedAt).
 */
private mergeDrafts(applications: ApplicationData[]): ApplicationData[] {
  const draftMap = new Map<string, ApplicationData>();
  const finalList: ApplicationData[] = [];

  for (const app of applications) {
    if (app.status === 'draft' && app.opportunityId) {
      const existing = draftMap.get(app.opportunityId);
      if (!existing || new Date(app.updatedAt) > new Date(existing.updatedAt)) {
        draftMap.set(app.opportunityId, app);
      }
    } else {
      // Non-draft applications are added directly
      finalList.push(app);
    }
  }

  // Add the latest drafts
  draftMap.forEach(draft => finalList.push(draft));

  // Optional: sort by updatedAt desc so newest apps are first
  return finalList.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

  // ===============================
  // USER ACTIONS
  // ===============================

  toggleFilters() {
    this.showFilters.update(current => !current);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.fundingTypeFilter.set('');
  }

  refreshData() {
    this.loadApplications();
  }

  // SME Actions
  createNewApplication() {
    this.router.navigate(['/funding/opportunities']);
  }

  viewApplication(id: string) {
    this.router.navigate(['/applications', id]);
  }

  continueApplication(applicationId: string) {
  const app = this.applications().find(a => a.id === applicationId);

  if (!app) {
    console.warn('Application not found; redirecting to new application page.');
    this.router.navigate(['/applications/new']);
    return;
  }

  // If it's a draft, open the new-application form for that opportunity
  if (app.status === 'draft') {
    if (app.opportunityId) {
      // navigate to route that already exists: /applications/new/:opportunityId
      this.router.navigate(['/applications/new', app.opportunityId], {
        queryParams: { edit: 'true', applicationId: app.id }
      });
    } else {
      // fallback: no opportunityId — open generic new with query params
      this.router.navigate(['/applications/new'], {
        queryParams: { edit: 'true', applicationId: app.id }
      });
    }
    return;
  }

  // If not a draft, take user to the normal view page
  this.viewApplication(applicationId);
}


  // Funder Actions
  reviewApplication(id: string) {
    this.router.navigate(['/funder/applications', id, 'review']);
  }

  manageOpportunities() {
    this.router.navigate(['/funding/opportunities']);
  }

  createOpportunity() {
    this.router.navigate(['/funding/create-opportunity']);
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    };
    return statusMap[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  getApplicationProgress(application: ApplicationData): number {
    const progressMap: Record<string, number> = {
      draft: 10,
      submitted: 25,
      under_review: 60,
      approved: 100,
      rejected: 100,
      withdrawn: 0
    };
    return progressMap[application.status] || 0;
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  formatTotalRequested(): string {
    const total = this.applications().reduce((sum, app) => sum + app.requestedAmount, 0);
    return this.formatCurrency(total, 'ZAR');
  }

  getActionButtonText(): string {
    return this.isFunder() ? 'Create Opportunity' : 'Find Opportunities';
  }

  getEmptyStateMessage(): string {
    if (this.isFunder()) {
      return 'No applications received yet. Create opportunities to start receiving applications.';
    }
    return 'No applications yet. Browse funding opportunities to get started.';
  }
}