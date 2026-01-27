// src/app/fund-seeking-orgs/applications/components/applications-home/applications-home.component.ts

import {
  Component,
  signal,
  computed,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
  Eye,
  Search,
  X,
  Settings,
  RefreshCw,
  Archive,
  CircleX,
  CircleCheckBig,
  CircleAlert,
  Funnel,
} from 'lucide-angular';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { KapifyMessagingComponent } from 'src/app/features/messaging/messaging/messaging.component';

import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

import { UserType } from 'src/app/shared/models/user.models';

import { ActionModalComponent } from 'src/app/shared/components/modal/action-modal.component';
import { ApplicationTransformService } from '../../services/application-transform.service';
import { OpportunityApplication } from 'src/app/profiles/SME-Profiles/models/sme-profile.models';

import { OpportunityApplicationService } from 'src/app/fund-seeking-orgs/services/opportunity-application.service';
import { ApplicationDetailModalComponent } from 'src/app/funder/application-details/components/application-detail-modal/application-detail-modal.component';
import {
  ApplicationListCardComponent,
  BaseApplicationCard,
} from 'src/app/funder/application-details/funder-applications/components/application-list-card/application-list-card.component';
import { FundingApplicationCoverInformation } from 'src/app/shared/models/funding-application-cover.model';

interface ApplicationData {
  id: string;
  title: string;
  applicationNumber?: string;
  status:
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'withdrawn';
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
  fundingRequest?: FundingApplicationCoverInformation;

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
    ActionModalComponent,
    KapifyMessagingComponent,
    ApplicationListCardComponent,
    ApplicationDetailModalComponent,
  ],
  templateUrl: 'applications-home.component.html',
  styles: [
    `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class ApplicationsHomeComponent implements OnInit, OnDestroy {
  @ViewChild('applicationsGrid') applicationsGridRef?: ElementRef;

  // Services
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private smeApplicationService = inject(OpportunityApplicationService);
  private supabaseService = inject(SharedSupabaseService);
  private transformService = inject(ApplicationTransformService);
  private destroy$ = new Subject<void>();
  // Expose Math to template
  Math = Math;
  // Icons
  FileTextIcon = FileText;
  ClockIcon = Clock;
  TrendingUpIcon = TrendingUp;
  DollarSignIcon = DollarSign;
  PlusIcon = Plus;
  FilterIcon = Funnel;
  EyeIcon = Eye;
  SearchIcon = Search;
  XIcon = X;
  SettingsIcon = Settings;
  CheckCircleIcon = CircleCheckBig;
  XCircleIcon = CircleX;
  RefreshCwIcon = RefreshCw;
  AlertCircleIcon = CircleAlert;
  ArchiveIcon = Archive;

  // State
  isLoading = signal(false);
  showFilters = signal(false);
  showArchivedModal = signal(false);
  applications = signal<ApplicationData[]>([]);
  error = signal<string | null>(null);
  userOrganization = signal<UserOrganization | null>(null);

  // Filters
  searchQuery = signal('');
  statusFilter = signal('');
  fundingTypeFilter = signal('');

  // Pagination state
  currentPage = signal(1);
  pageSize = signal(3);
  isMobile = signal(window.innerWidth < 1024);

  // Archive pagination
  archivedPage = signal(1);
  archivedPageSize = signal(5);

  // Modal state
  selectedApplication = signal<ApplicationData | null>(null);

  selectedApplicationForModal = computed(() => {
    const app = this.selectedApplication();
    if (!app) return null;

    return {
      id: app.id,
      title: app.title,
      applicantOrganizationName: app.applicantCompany,
      applicantName: app.applicantName,
      status: app.status,
      stage: app.currentStage || 'Unknown',
      requestedAmount: app.requestedAmount,
      currency: app.currency,
      description: app.fundingRequest?.useOfFunds,
      formData: {},
      submittedAt: app.submittedAt,
      createdAt: app.createdAt,
      matchScore: app.matchScore,

      completionScore: 0,
      applicant: {
        firstName: app.applicantName?.split(' ')[0] || '',
        lastName: app.applicantName?.split(' ')[1] || '',
        email: '',
        companyName: app.applicantCompany || '',
      },
      opportunity: {
        title: app.opportunityTitle || '',
        fundingType: app.fundingType || [],
        currency: app.currency,
      },
      fundingRequest: app.fundingRequest,
    };
  });

  // User context
  currentUser = computed(() => this.authService.user());
  userType = computed(() => this.currentUser()?.userType);
  isFunder = computed(() => this.userType() === 'funder');
  isSME = computed(() => this.userType() === 'sme');

  safeUserType = computed((): UserType => {
    const type = this.userType();
    return type === 'funder' ? 'funder' : 'sme';
  });

  //  Method to handle withdrawn application
  onApplicationWithdrawn(applicationId: string): void {
    // Option A: Remove from list immediately (optimistic)
    this.removeApplicationFromList(applicationId);

    // Option B: Reload entire list from database (safest)
    this.reloadApplications();
  }

  //  Method to remove application from local list
  private removeApplicationFromList(applicationId: string): void {
    const currentApps = this.applications();
    const filtered = currentApps.filter((app) => app.id !== applicationId);
    this.applications.set(filtered);

    // Update pagination
    this.currentPage.set(1);
  }

  // ✅ ADD: Method to reload applications (if you prefer full reload)
  private reloadApplications(): void {
    console.log('🔄 Reloading applications...');
    this.loadApplications();
  }
  activeApplications = computed(() => {
    // ✅ FIXED: Only truly active statuses (no withdrawn, no draft)
    const activeStatuses = ['submitted', 'under_review']; // Changed: removed 'draft'
    return this.applications().filter((app) =>
      activeStatuses.includes(app.status)
    );
  });

  archivedApplications = computed(() => {
    const archivedStatuses = ['approved', 'rejected', 'withdrawn'];
    return this.applications().filter((app) =>
      archivedStatuses.includes(app.status)
    );
  });

  // Pagination computed for active applications
  totalPages = computed(() =>
    Math.ceil(this.filteredApplications().length / this.pageSize())
  );

  paginatedApplications = computed(() => {
    const startIdx = (this.currentPage() - 1) * this.pageSize();
    const endIdx = startIdx + this.pageSize();
    return this.filteredApplications().slice(startIdx, endIdx);
  });

  pageRange = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const range = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 5; i++) range.push(i);
      } else if (current >= total - 2) {
        for (let i = total - 4; i <= total; i++) range.push(i);
      } else {
        for (let i = current - 2; i <= current + 2; i++) range.push(i);
      }
    }
    return range;
  });

  getPaginationText = computed(() => {
    const total = this.filteredApplications().length;
    const pageSize = this.pageSize();
    const current = this.currentPage();
    const startIdx = (current - 1) * pageSize + 1;
    const endIdx = Math.min(current * pageSize, total);

    if (total === 0) return 'No applications';
    return `Showing ${startIdx}–${endIdx} of ${total} applications`;
  });

  // Pagination for archived applications
  archivedTotalPages = computed(() =>
    Math.ceil(this.archivedApplications().length / this.archivedPageSize())
  );

  paginatedArchivedApplications = computed(() => {
    const startIdx = (this.archivedPage() - 1) * this.archivedPageSize();
    const endIdx = startIdx + this.archivedPageSize();
    return this.archivedApplications().slice(startIdx, endIdx);
  });

  archivedPageRange = computed(() => {
    const total = this.archivedTotalPages();
    const current = this.archivedPage();
    const range = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 5; i++) range.push(i);
      } else if (current >= total - 2) {
        for (let i = total - 4; i <= total; i++) range.push(i);
      } else {
        for (let i = current - 2; i <= current + 2; i++) range.push(i);
      }
    }
    return range;
  });

  ngOnInit() {
    this.loadApplications();

    // Check for query params and open modal if opportunityId exists
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const opportunityId = params['opportunityId'];
        if (opportunityId) {
          // Wait a bit for applications to load, then open modal
          setTimeout(() => {
            const application = this.applications().find(
              (app) => app.opportunityId === opportunityId
            );
            if (application) {
              this.openApplicationModal(application);
              console.log('📂 Modal opened for opportunityId:', opportunityId);
            } else {
              console.warn(
                'Application not found for opportunityId:',
                opportunityId
              );
            }
          }, 500);
        }
      });

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event) {
    const newIsMobile = window.innerWidth < 1024;
    const wasDesktop = !this.isMobile();
    const isNowDesktop = !newIsMobile;

    if (wasDesktop !== isNowDesktop) {
      this.isMobile.set(newIsMobile);
      this.pageSize.set(newIsMobile ? 2 : 3);
      this.currentPage.set(1);
    }
  }

  // ===============================
  // DIRECT DATABASE LOADING
  // ===============================

  loadApplications() {
    const user = this.currentUser();
    if (!user) {
      this.error.set('User not authenticated');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    if (this.isFunder()) {
      this.loadFunderApplicationsDirectly(user.id);
    } else {
      this.loadSMEApplications();
    }
  }

  private async loadFunderApplicationsDirectly(userId: string) {
    try {
      // Step 1: Get user's organization directly from database
      const { data: orgUserData, error: orgError } = await this.supabaseService
        .from('organization_users')
        .select(
          `
        organization_id,
        organizations!organization_users_organization_id_fkey (
          id,
          name,
          organization_type
        )
      `
        )
        .eq('user_id', userId)
        .single();

      if (orgError || !orgUserData?.organizations) {
        console.error('❌ Failed to load organization:', orgError);
        this.error.set(
          'Organization setup required. Please complete your funder profile setup.'
        );
        this.isLoading.set(false);
        return;
      }

      // Access first element of the array
      const org = orgUserData.organizations[0];
      const organization: UserOrganization = {
        id: org.id,
        name: org.name,
        organizationType: org.organization_type,
      };

      this.userOrganization.set(organization);
      // console.log('✅ Organization loaded:', organization.name);

      // Step 2: Load applications with funding_request (CRITICAL FIX)
      //  Explicitly select funding_request and all necessary fields
      const { data: applicationsData, error: appsError } =
        await this.supabaseService
          .from('applications')
          .select(
            `
        id,
        title,
        status,
        stage,
        form_data,
        description,
        requested_amount,
        funding_type,
        opportunity_id,
        created_at,
        updated_at,
        submitted_at,
        funding_request,
        applicant_id,
        applicant_organization_name,
        funder_id,
        opportunity_id
      `
          )
          .eq('funder_id', organization.id)
          .order('updated_at', { ascending: false });

      if (appsError) {
        console.error('❌ Failed to load applications:', appsError);
        this.error.set('Failed to load applications');
        this.isLoading.set(false);
        return;
      }

      if (!applicationsData || applicationsData.length === 0) {
        console.log('📭 No applications found for organization');
        this.applications.set([]);
        this.isLoading.set(false);
        return;
      }

      // Step 3: Transform database applications to ApplicationData format
      const transformedApps: ApplicationData[] = applicationsData.map(
        (dbApp: any) => {
          const fundingRequest =
            dbApp.funding_request as FundingApplicationCoverInformation | null;
          console.log(fundingRequest);

          return {
            id: dbApp.id,
            title: dbApp.title,
            applicationNumber: `APP-${dbApp.created_at.split('T')[0]}-${
              dbApp.id.split('-')[0]
            }`,
            status: dbApp.status || 'draft',
            fundingType: dbApp.funding_type ? [dbApp.funding_type] : [],
            requestedAmount:
              dbApp.form_data?.requestedAmount || dbApp.requested_amount || 0,
            currency: 'ZAR', // From opportunity context if available
            currentStage: dbApp.stage || 'draft',
            description: dbApp.description || '',
            createdAt: new Date(dbApp.created_at),
            updatedAt: new Date(dbApp.updated_at),
            submittedAt: dbApp.submitted_at
              ? new Date(dbApp.submitted_at)
              : undefined,
            applicantName: dbApp.applicant_organization_name || 'Unknown',
            applicantCompany: dbApp.applicant_organization_name || 'Unknown',
            opportunityTitle: dbApp.opportunity_id
              ? `Opportunity ${dbApp.opportunity_id.slice(0, 8)}`
              : 'Unknown',
            opportunityId: dbApp.opportunity_id,
            // ✅ CRITICAL: Include fundingRequest (the cover data)
            fundingRequest: fundingRequest,
          } as ApplicationData;
        }
      );

      console.log('✅ Transformed', transformedApps.length, 'applications');
      console.log(
        '🔍 Sample app funding_request:',
        transformedApps[0]?.fundingRequest ? '✓ Present' : '✗ Missing'
      );

      this.applications.set(this.mergeDrafts(transformedApps));
      this.currentPage.set(1);
      this.isLoading.set(false);

      console.log(
        '🎉 Funder applications successfully loaded:',
        transformedApps.length
      );
    } catch (error) {
      console.error('💥 Database error:', error);
      this.error.set('Database connection error. Please try again.');
      this.isLoading.set(false);
    }
  }

  // REPLACE: loadSMEApplications method in applications-home.component.ts

  private loadSMEApplications() {
    this.smeApplicationService
      .loadUserApplications()
      .pipe(
        takeUntil(this.destroy$),
        tap((smeApplications: OpportunityApplication[]) => {
          smeApplications.forEach((app, index) => {
            // console.log(`\n[${index + 1}] Application:`, {
            //   id: app.id,
            //   title: app.title,
            //   status: app.status,
            //   opportunityId: app.opportunityId,
            //   hasFundingRequest: !!app.fundingRequest,
            //   fundingRequest: app.coverInformation,
            // });
          });
          console.groupEnd();
        }),
        catchError((error) => {
          console.error('❌ SME applications load error:', error);
          this.error.set('Failed to load your applications');
          this.isLoading.set(false);
          throw error;
        })
      )
      .subscribe({
        next: (smeApplications: OpportunityApplication[]) => {
          const applicationData = smeApplications.map((app, index) => {
            const transformed =
              this.transformService.transformSMEApplication(app);
            // console.log(`[${index + 1}] Transformed:`, {
            //   id: transformed.id,
            //   title: transformed.title,
            //   status: transformed.status,
            //   hasFundingRequest: !!transformed.fundingRequest,
            // });
            return transformed;
          });

          console.groupEnd();

          // console.group(' Setting Applications State');
          const merged = this.mergeDrafts(applicationData);
          // console.log('Merged applications count:', merged.length);
          // console.log('Sample app:', {
          //   id: merged[0]?.id,
          //   title: merged[0]?.title,
          //   hasFundingRequest: !!merged[0]?.fundingRequest,
          // });
          console.groupEnd();

          this.applications.set(merged);
          this.currentPage.set(1);
          this.isLoading.set(false);
        },
        error: () => {
          console.error('💥 Error in SME applications subscription');
          this.applications.set([]);
          this.isLoading.set(false);
        },
      });
  }

  // private loadSMEApplications() {
  //   this.smeApplicationService
  //     .loadUserApplications()
  //     .pipe(
  //       takeUntil(this.destroy$),
  //       catchError((error) => {
  //         this.error.set('Failed to load your applications');
  //         this.isLoading.set(false);
  //         console.error('SME applications load error:', error);
  //         throw error;
  //       })
  //     )
  //     .subscribe({
  //       next: (smeApplications: OpportunityApplication[]) => {
  //         const applicationData = smeApplications.map((app) =>
  //           this.transformService.transformSMEApplication(app)
  //         );
  //         this.applications.set(this.mergeDrafts(applicationData));
  //         this.currentPage.set(1);
  //         this.isLoading.set(false);
  //       },
  //       error: () => {
  //         this.applications.set([]);
  //         this.isLoading.set(false);
  //       },
  //     });
  // }

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
      opportunityId: app.opportunityId,
    };
  }

  // ===============================
  // COMPUTED PROPERTIES
  // ===============================

  filteredApplications = computed(() => {
    let filtered = this.activeApplications();

    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.title.toLowerCase().includes(query) ||
          app.applicationNumber?.toLowerCase().includes(query) ||
          app.description?.toLowerCase().includes(query) ||
          app.applicantName?.toLowerCase().includes(query) ||
          app.applicantCompany?.toLowerCase().includes(query) ||
          app.opportunityTitle?.toLowerCase().includes(query)
      );
    }

    if (this.statusFilter()) {
      filtered = filtered.filter((app) => app.status === this.statusFilter());
    }

    if (this.fundingTypeFilter()) {
      filtered = filtered.filter((app) =>
        app.fundingType?.includes(this.fundingTypeFilter())
      );
    }

    return filtered;
  });

  stats = computed(() => {
    const apps = this.applications();
    return {
      total: apps.length,
      active: this.activeApplications().length,
      archived: this.archivedApplications().length,
      draft: apps.filter((app) => app.status === 'draft').length,
      submitted: apps.filter((app) => app.status === 'submitted').length,
      underReview: apps.filter((app) => app.status === 'under_review').length,
      approved: apps.filter((app) => app.status === 'approved').length,
      rejected: apps.filter((app) => app.status === 'rejected').length,
    };
  });

  hasActiveFilters = computed(() => {
    return !!(
      this.searchQuery() ||
      this.statusFilter() ||
      this.fundingTypeFilter()
    );
  });

  private mergeDrafts(applications: ApplicationData[]): ApplicationData[] {
    const draftMap = new Map<string, ApplicationData>();
    const finalList: ApplicationData[] = [];

    for (const app of applications) {
      if (app.status === 'draft' && app.opportunityId) {
        const existing = draftMap.get(app.opportunityId);
        if (
          !existing ||
          new Date(app.updatedAt) > new Date(existing.updatedAt)
        ) {
          draftMap.set(app.opportunityId, app);
        }
      } else {
        finalList.push(app);
      }
    }

    draftMap.forEach((draft) => finalList.push(draft));
    return finalList.sort(
      (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)
    );
  }

  // ===============================
  // PAGINATION METHODS
  // ===============================

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.applicationsGridRef?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  goToArchivedPage(page: number) {
    if (page >= 1 && page <= this.archivedTotalPages()) {
      this.archivedPage.set(page);
    }
  }

  previousArchivedPage() {
    if (this.archivedPage() > 1) {
      this.goToArchivedPage(this.archivedPage() - 1);
    }
  }

  nextArchivedPage() {
    if (this.archivedPage() < this.archivedTotalPages()) {
      this.goToArchivedPage(this.archivedPage() + 1);
    }
  }

  // ===============================
  // MODAL METHODS
  // ===============================

  openApplicationModal(application: ApplicationData) {
    this.selectedApplication.set(application);
  }

  closeApplicationModal() {
    this.selectedApplication.set(null);
  }

  openArchivedModal() {
    this.archivedPage.set(1);
    this.showArchivedModal.set(true);
  }

  closeArchivedModal() {
    this.showArchivedModal.set(false);
    this.archivedPage.set(1);
  }

  // ===============================
  // USER ACTIONS
  // ===============================

  toggleFilters() {
    this.showFilters.update((current) => !current);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.fundingTypeFilter.set('');
    this.currentPage.set(1);
  }

  refreshData() {
    this.loadApplications();
  }

  createNewApplication() {
    this.router.navigate(['/funding/opportunities']);
  }

  viewApplication(id: string) {
    this.router.navigate(['/funder/applications', id]);
  }

  continueApplication(applicationId: string) {
    const app = this.applications().find((a) => a.id === applicationId);

    if (!app) {
      console.warn(
        'Application not found; redirecting to new application page.'
      );
      this.router.navigate(['/applications/new']);
      return;
    }

    if (app.status === 'draft') {
      if (app.opportunityId) {
        this.router.navigate(['/applications/new', app.opportunityId], {
          queryParams: { edit: 'true', applicationId: app.id },
        });
      } else {
        this.router.navigate(['/applications/new'], {
          queryParams: { edit: 'true', applicationId: app.id },
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
  // UTILITY METHODS
  // ===============================

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
    };
    return statusMap[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-800',
      submitted: 'bg-blue-50 text-blue-700 border border-blue-200/50',
      under_review: 'bg-amber-50 text-amber-700 border border-amber-200/50',
      approved: 'bg-green-50 text-green-700 border border-green-200/50',
      rejected: 'bg-red-50 text-red-700 border border-red-200/50',
      withdrawn: 'bg-slate-100 text-slate-600',
    };
    return classMap[status] || 'bg-slate-100 text-slate-800';
  }

  getApplicationProgress(application: ApplicationData): number {
    const progressMap: Record<string, number> = {
      draft: 10,
      submitted: 25,
      under_review: 60,
      approved: 100,
      rejected: 100,
      withdrawn: 0,
    };
    return progressMap[application.status] || 0;
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  formatTotalRequested(): string {
    const total = this.activeApplications().reduce(
      (sum, app) => sum + app.requestedAmount,
      0
    );
    return this.formatCurrency(total, 'ZAR');
  }

  getActionButtonText(): string {
    return this.isFunder() ? 'Create Opportunity' : 'Find Opportunities';
  }

  getEmptyStateMessage(): string {
    if (this.isFunder()) {
      return 'No active applications. Create opportunities to start receiving applications.';
    }
    return 'No active applications. Browse funding opportunities to get started.';
  }
}
