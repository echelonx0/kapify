import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError, tap } from 'rxjs/operators';
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
import { AuthService } from 'src/app/auth/production.auth.service';
import { UiButtonComponent } from 'src/app/shared/components';
import { ActivityInboxComponent } from 'src/app/messaging/messaging/messaging.component'; 
import { OpportunityApplicationService } from 'src/app/SMEs/services/opportunity-application.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { ApplicationListCardComponent, BaseApplicationCard } from 'src/app/shared/components/application-list-card/application-list-card.component';
import { UserType } from 'src/app/shared/models/user.models';
import { FundingApplication } from 'src/app/SMEs/models/application.models';
import { ApplicationManagementService } from 'src/app/SMEs/services/application-management.service';
import { OpportunityApplication } from 'src/app/SMEs/profile/models/sme-profile.models';

interface ApplicationData {
  id: string;
  title: string;
  applicationNumber?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  fundingType?: string[];
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

interface UserOrganization {
  id: string;
  name: string;
  organizationType: string;
}

@Component({
  selector: 'app-applications-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
 
    ActivityInboxComponent,
    ApplicationListCardComponent
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
  private supabaseService = inject(SharedSupabaseService);
  private destroy$ = new Subject<void>();

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
  userOrganization = signal<UserOrganization | null>(null);

  // Filters
  searchQuery = signal('');
  statusFilter = signal('');
  fundingTypeFilter = signal('');

  // User context
  currentUser = computed(() => this.authService.user());
  userType = computed(() => this.currentUser()?.userType);
  isFunder = computed(() => this.userType() === 'funder');
  isSME = computed(() => this.userType() === 'sme');
  // Add this computed property to your ApplicationsHomeComponent class
safeUserType = computed((): UserType => {
  const type = this.userType();
  return type === 'funder' ? 'funder' : 'sme';
});

  ngOnInit() {
    this.loadApplications();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // DIRECT DATABASE LOADING (BYPASSES ProfileManagementService)
  // ===============================

    loadApplications() {
    const user = this.currentUser();
    if (!user) {
      this.error.set('User not authenticated');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    console.log('🚀 Loading applications for user type:', this.userType());

    if (this.isFunder()) {
      this.loadFunderApplicationsDirectly(user.id);
    } else {
      this.loadSMEApplications();
    }
  }

  private async loadFunderApplicationsDirectly(userId: string) {
    console.log('📊 Loading funder applications directly from database...');
    
    try {
      // Step 1: Get user's organization directly from database
      const { data: orgUserData, error: orgError } = await this.supabaseService
        .from('organization_users')
        .select(`
          organization_id,
          organizations!organization_users_organization_id_fkey (
            id,
            name,
            organization_type
          )
        `)
        .eq('user_id', userId)
        .single();
      
      if (orgError || !orgUserData?.organizations) {
        console.error('❌ Failed to load organization:', orgError);
        this.error.set('Organization setup required. Please complete your funder profile setup.');
        this.isLoading.set(false);
        return;
      }
 // Access first element of the array
    const org = orgUserData.organizations[0];
      const organization: UserOrganization = {
        id: org.id,
        name: org.name,
        organizationType: org.organization_type
      };
      
      this.userOrganization.set(organization);
      console.log('✅ Organization loaded:', organization.name);

      // Step 2: Load applications for this organization
      this.funderApplicationService.getApplicationsByOrganization(organization.id)
        .pipe(
          takeUntil(this.destroy$),
          tap((applications) => console.log('✅ Applications loaded:', applications.length)),
          catchError(error => {
            console.error('❌ Failed to load applications:', error);
            this.error.set('Failed to load applications');
            return of([]);
          })
        )
        .subscribe({
          next: (funderApplications: FundingApplication[]) => {
            const applicationData = funderApplications.map(app => this.transformFunderApplication(app));
            this.applications.set(this.mergeDrafts(applicationData));
            this.isLoading.set(false);
            console.log('🎉 Funder applications successfully loaded:', applicationData.length);
          },
          error: () => {
            this.applications.set([]);
            this.isLoading.set(false);
          }
        });

    } catch (error) {
      console.error('💥 Database error:', error);
      this.error.set('Database connection error. Please try again.');
      this.isLoading.set(false);
    }
  }

  private loadSMEApplications() {
    console.log('📊 Loading SME applications...');
    
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
          console.log('🎉 SME applications successfully loaded:', applicationData.length);
        },
        error: () => {
          this.applications.set([]);
          this.isLoading.set(false);
        }
      });
  }

  // Add this method to transform your existing data
 transformToBaseCard(app: ApplicationData): BaseApplicationCard {
  return {
    id: app.id,
    title: app.title,
    applicationNumber: app.applicationNumber,
    status: app.status,
    fundingType: app.fundingType,
    requestedAmount: app.requestedAmount,
    currency: app.currency,
    currentStage: app.currentStage,
    description: app.description,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    submittedAt: app.submittedAt,
    applicantName: app.applicantName,
    applicantCompany: app.applicantCompany,
    opportunityTitle: app.opportunityTitle,
    opportunityId: app.opportunityId
  };
}
  // ===============================
  // DATA TRANSFORMATION (UNCHANGED)
  // ===============================

private transformSMEApplication(app: OpportunityApplication): ApplicationData {
  const rawFundingType = app.opportunity?.fundingType;
  return { 
    id: app.id,
    title: app.title,
    applicationNumber: `APP-${app.id.slice(-6).toUpperCase()}`,
    status: app.status,
    fundingType: Array.isArray(rawFundingType)
      ? rawFundingType
      : rawFundingType
        ? [rawFundingType]
        : [],
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
  const rawFundingType = app.opportunity?.fundingType;
  return {
    id: app.id,
    title: app.title,
    status: app.status,
    fundingType: Array.isArray(rawFundingType)
      ? rawFundingType
      : rawFundingType
        ? [rawFundingType]
        : [],
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
  // COMPUTED PROPERTIES (UNCHANGED)
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
  filtered = filtered.filter(app =>
    app.fundingType?.includes(this.fundingTypeFilter())
  );
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
        finalList.push(app);
      }
    }

    draftMap.forEach(draft => finalList.push(draft));
    return finalList.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
  }

  // ===============================
  // USER ACTIONS (UNCHANGED)
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

  createNewApplication() {
    this.router.navigate(['/funding/opportunities']);
  }

  viewApplication(id: string) {
  // Navigate to detailed application view instead of generic applications route
  this.router.navigate(['/funder/applications', id]);
}

  continueApplication(applicationId: string) {
    const app = this.applications().find(a => a.id === applicationId);

    if (!app) {
      console.warn('Application not found; redirecting to new application page.');
      this.router.navigate(['/applications/new']);
      return;
    }

    if (app.status === 'draft') {
      if (app.opportunityId) {
        this.router.navigate(['/applications/new', app.opportunityId], {
          queryParams: { edit: 'true', applicationId: app.id }
        });
      } else {
        this.router.navigate(['/applications/new'], {
          queryParams: { edit: 'true', applicationId: app.id }
        });
      }
      return;
    }

    this.viewApplication(applicationId);
  }

  reviewApplication(id: string) {
     this.router.navigate(['/funder/applications', id]);
  }

  manageOpportunities() {
    this.router.navigate(['/funding/opportunities']);
  }

  createOpportunity() {
    this.router.navigate(['/funding/create-opportunity']);
  }

  // ===============================
  // UTILITY METHODS (UNCHANGED)
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