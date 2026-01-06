import {
  Component,
  signal,
  computed,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import {
  LucideAngularModule,
  Search,
  Download,
  FileText,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Building,
  Calendar,
  User,
  LogOut,
  CircleCheckBig,
  CircleX,
  Funnel,
  CircleAlert,
} from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { ApplicationManagementService } from 'src/app/SMEs/services/application-management.service';
import {
  FundingApplication,
  ApplicationStats,
} from 'src/app/SMEs/models/application.models';
import { SMEOpportunitiesService } from 'src/app/funding/services/opportunities.service';
import { ActionModalService } from 'src/app/shared/components/modal/modal.service';

type ApplicationTab = 'new' | 'under_review' | 'approved' | 'rejected';

interface TabConfig {
  id: ApplicationTab;
  label: string;
  icon: any;
  statuses: FundingApplication['status'][];
  color: string;
}

interface FilterOptions {
  searchQuery: string;
  sortBy: 'date' | 'amount' | 'applicant';
  sortOrder: 'asc' | 'desc';
  opportunityId: string;
}

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './applications-list.component.html',
  styles: [
    `
      .tab-indicator {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .accordion-content {
        transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .rotate-180 {
        transform: rotate(180deg);
      }
    `,
  ],
})
export class FunderApplicationsListComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private applicationService = inject(ApplicationManagementService);
  private opportunitiesService = inject(SMEOpportunitiesService);
  private modalService = inject(ActionModalService);
  private destroy$ = new Subject<void>();

  // Icons
  SearchIcon = Search;
  FilterIcon = Funnel;
  DownloadIcon = Download;
  FileTextIcon = FileText;
  ClockIcon = Clock;
  CheckCircleIcon = CircleCheckBig;
  XCircleIcon = CircleX;
  AlertCircleIcon = CircleAlert;
  TrendingUpIcon = TrendingUp;
  UsersIcon = Users;
  DollarSignIcon = DollarSign;
  EyeIcon = Eye;
  ArrowRightIcon = ArrowRight;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;
  BuildingIcon = Building;
  CalendarIcon = Calendar;
  UserIcon = User;
  LogOutIcon = LogOut;

  // Tab Configuration
  tabs: TabConfig[] = [
    {
      id: 'new',
      label: 'New Applications',
      icon: FileText,
      statuses: ['submitted'],
      color: 'teal',
    },
    {
      id: 'under_review',
      label: 'Under Review',
      icon: Clock,
      statuses: ['under_review'],
      color: 'amber',
    },
    {
      id: 'approved',
      label: 'Approved',
      icon: CircleCheckBig,
      statuses: ['approved'],
      color: 'green',
    },
    {
      id: 'rejected',
      label: 'Rejected',
      icon: CircleX,
      statuses: ['rejected'],
      color: 'red',
    },
  ];

  // State
  activeTab = signal<ApplicationTab>('new');
  allApplications = signal<FundingApplication[]>([]);
  opportunities = signal<any[]>([]);
  applicationStats = signal<ApplicationStats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  expandedRowId = signal<string | null>(null);

  // Filters
  filters = signal<FilterOptions>({
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc',
    opportunityId: '',
  });

  // Computed properties
  filteredApplications = computed(() => {
    let apps = [...this.allApplications()];
    const filter = this.filters();
    const currentTab = this.activeTab();

    // Filter by current tab status
    const tabConfig = this.tabs.find((t) => t.id === currentTab);
    if (tabConfig) {
      apps = apps.filter((app) => tabConfig.statuses.includes(app.status));
    }

    // Filter by opportunity
    if (filter.opportunityId) {
      apps = apps.filter((app) => app.opportunityId === filter.opportunityId);
    }

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      apps = apps.filter((app) => {
        const applicantName = `${app.applicant?.firstName || ''} ${
          app.applicant?.lastName || ''
        }`.toLowerCase();
        const companyName = app.applicant?.companyName?.toLowerCase() || '';
        const opportunityTitle = app.opportunity?.title?.toLowerCase() || '';
        const email = app.applicant?.email?.toLowerCase() || '';

        return (
          applicantName.includes(query) ||
          companyName.includes(query) ||
          opportunityTitle.includes(query) ||
          email.includes(query) ||
          app.id.toLowerCase().includes(query)
        );
      });
    }

    // Sort
    apps.sort((a, b) => {
      let compareA: any;
      let compareB: any;

      switch (filter.sortBy) {
        case 'date':
          compareA = new Date(a.submittedAt || a.createdAt).getTime();
          compareB = new Date(b.submittedAt || b.createdAt).getTime();
          break;
        case 'amount':
          compareA = this.extractRequestedAmount(a.formData);
          compareB = this.extractRequestedAmount(b.formData);
          break;
        case 'applicant':
          compareA = this.getApplicantName(a).toLowerCase();
          compareB = this.getApplicantName(b).toLowerCase();
          break;
      }

      return filter.sortOrder === 'asc'
        ? compareA - compareB
        : compareB - compareA;
    });

    return apps;
  });

  // Tab counts
  tabCounts = computed(() => {
    const apps = this.allApplications();
    return {
      new: apps.filter((a) => a.status === 'submitted').length,
      under_review: apps.filter((a) => a.status === 'under_review').length,
      approved: apps.filter((a) => a.status === 'approved').length,
      rejected: apps.filter((a) => a.status === 'rejected').length,
    };
  });

  // Overall analytics
  analytics = computed(() => {
    const apps = this.allApplications();
    const stats = this.applicationStats();

    return {
      total: apps.length,
      new: apps.filter((a) => a.status === 'submitted').length,
      underReview: apps.filter((a) => a.status === 'under_review').length,
      approved: apps.filter((a) => a.status === 'approved').length,
      rejected: apps.filter((a) => a.status === 'rejected').length,
      totalRequested: apps.reduce(
        (sum, app) => sum + this.extractRequestedAmount(app.formData),
        0
      ),
      averageProcessingTime: stats?.averageProcessingTime || 0,
    };
  });

  ngOnInit() {
    this.loadAllData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadAllData() {
    await Promise.all([
      this.loadApplicationsData(),
      this.loadOpportunitiesData(),
    ]);
  }

  private async loadApplicationsData() {
    try {
      this.loading.set(true);
      this.error.set(null);

      const applications = await this.applicationService
        .getAllManageableApplications()
        .toPromise();

      this.allApplications.set(applications || []);
      await this.loadApplicationStats();
    } catch (err) {
      console.error('Failed to load applications:', err);
      this.error.set('Failed to load applications');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadOpportunitiesData() {
    try {
      const opps = await this.opportunitiesService
        .loadActiveOpportunities()
        .toPromise();

      this.opportunities.set(opps || []);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      this.opportunities.set([]);
    }
  }

  private async loadApplicationStats() {
    try {
      const stats = await this.applicationService
        .getApplicationStats()
        .toPromise();
      this.applicationStats.set(stats || null);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  // Tab Management
  switchTab(tabId: ApplicationTab) {
    this.activeTab.set(tabId);
    this.expandedRowId.set(null); // Collapse any expanded rows
  }

  getTabColor(tabId: ApplicationTab): string {
    const tab = this.tabs.find((t) => t.id === tabId);
    return tab?.color || 'slate';
  }

  // Row Expansion
  toggleRow(applicationId: string) {
    if (this.expandedRowId() === applicationId) {
      this.expandedRowId.set(null);
    } else {
      this.expandedRowId.set(applicationId);
    }
  }

  isRowExpanded(applicationId: string): boolean {
    return this.expandedRowId() === applicationId;
  }

  // Filter methods
  updateSearch(query: string) {
    this.filters.update((f) => ({ ...f, searchQuery: query }));
  }

  updateSort(sortBy: FilterOptions['sortBy']) {
    this.filters.update((f) => ({
      ...f,
      sortBy,
      sortOrder: f.sortBy === sortBy && f.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  }

  updateOpportunityFilter(opportunityId: string) {
    this.filters.update((f) => ({ ...f, opportunityId }));
  }

  clearFilters() {
    this.filters.set({
      searchQuery: '',
      sortBy: 'date',
      sortOrder: 'desc',
      opportunityId: '',
    });
  }

  // Navigation methods
  viewApplication(application: FundingApplication) {
    this.router.navigate(['/funder/applications', application.id]);
  }

  // Status update methods
  async updateApplicationStatus(
    applicationId: string,
    newStatus: FundingApplication['status']
  ) {
    try {
      await this.applicationService
        .updateApplicationStatus(applicationId, newStatus)
        .toPromise();

      // Refresh data
      await this.loadApplicationsData();
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Failed to update application status. Please try again.');
    }
  }

  async approveApplication(applicationId: string) {
    if (
      confirm(
        'Are you sure you want to approve this application? This action cannot be undone.'
      )
    ) {
      await this.updateApplicationStatus(applicationId, 'approved');
    }
  }

  async rejectApplication(applicationId: string) {
    if (
      confirm(
        'Are you sure you want to reject this application? This action cannot be undone.'
      )
    ) {
      await this.updateApplicationStatus(applicationId, 'rejected');
    }
  }

  async moveToReview(applicationId: string) {
    await this.updateApplicationStatus(applicationId, 'under_review');
  }

  // Withdrawal (for SMEs, but included for completeness)
  withdrawApplication(application: FundingApplication) {
    this.modalService.showWithdrawConfirm(
      application.title,
      `APP-${application.id.slice(-6).toUpperCase()}`
    );

    const subscription = this.modalService.confirmed$.subscribe(() => {
      this.performWithdrawal(application.id);
      subscription.unsubscribe();
    });
  }

  private performWithdrawal(applicationId: string) {
    this.applicationService
      .updateApplicationStatus(applicationId, 'withdrawn')
      .subscribe({
        next: async () => {
          this.modalService.showWithdrawSuccess('Application');
          await this.loadApplicationsData();
        },
        error: (error) => {
          this.modalService.showWithdrawError(
            'Application',
            error.message || 'Failed to withdraw application. Please try again.'
          );
        },
      });
  }

  exportApplications() {
    console.log('Export applications for tab:', this.activeTab());
    // TODO: Implement export functionality
    alert('Export functionality coming soon!');
  }

  refreshApplicationsData() {
    this.loadApplicationsData();
  }

  // Utility methods
  extractRequestedAmount(formData: Record<string, any>): number {
    return (
      formData?.['coverInformation']?.requestedAmount ??
      formData?.['requestedAmount'] ??
      formData?.['fundingInformation']?.requestedAmount ??
      0
    );
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'slate',
      submitted: 'teal',
      under_review: 'amber',
      approved: 'green',
      rejected: 'red',
      withdrawn: 'slate',
    };
    return colors[status] || 'slate';
  }

  getStatusIcon(status: string) {
    const icons: Record<string, any> = {
      draft: this.FileTextIcon,
      submitted: this.FileTextIcon,
      under_review: this.ClockIcon,
      approved: this.CheckCircleIcon,
      rejected: this.XCircleIcon,
      withdrawn: this.AlertCircleIcon,
    };
    return icons[status] || this.FileTextIcon;
  }

  formatStatus(status: string): string {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatStage(stage: string): string {
    return stage
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-ZA').format(num);
  }

  getApplicantName(application: FundingApplication): string {
    return (
      `${application.applicant?.firstName || ''} ${
        application.applicant?.lastName || ''
      }`.trim() || 'Unknown'
    );
  }

  getApplicantEmail(application: FundingApplication): string {
    return application.applicant?.email || '-';
  }

  getApplicantCompany(application: FundingApplication): string {
    return application.applicant?.companyName || '-';
  }

  getOpportunityTitle(application: FundingApplication): string {
    return application.opportunity?.title || 'Unknown Opportunity';
  }

  getApplicationNumber(application: FundingApplication): string {
    return `APP-${application.id.slice(-6).toUpperCase()}`;
  }

  getFundingTypes(application: FundingApplication): string[] {
    return application.opportunity?.fundingType || [];
  }

  getFundingTypeColor(type: string): string {
    const colorMap: Record<string, string> = {
      debt: 'teal',
      equity: 'purple',
      convertible: 'indigo',
      mezzanine: 'amber',
      grant: 'green',
      purchase_order: 'cyan',
      invoice_financing: 'teal',
    };
    return colorMap[type.toLowerCase()] || 'slate';
  }

  canApprove(application: FundingApplication): boolean {
    return (
      application.status === 'under_review' ||
      application.status === 'submitted'
    );
  }

  canReject(application: FundingApplication): boolean {
    return (
      application.status === 'under_review' ||
      application.status === 'submitted'
    );
  }

  canMoveToReview(application: FundingApplication): boolean {
    return application.status === 'submitted';
  }
}
