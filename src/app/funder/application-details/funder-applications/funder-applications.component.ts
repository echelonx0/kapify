// import {
//   Component,
//   signal,
//   computed,
//   OnInit,
//   OnDestroy,
//   inject,
// } from '@angular/core';
// import { Router } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { Subject } from 'rxjs';
// import {
//   LucideAngularModule,
//   FileText,
//   Eye,
//   ArrowRight,
//   CircleAlert,
// } from 'lucide-angular';
// import { ApplicationManagementService } from 'src/app/SMEs/services/application-management.service';
// import {
//   ApplicationListCardComponent,
//   BaseApplicationCard,
// } from 'src/app/shared/components/application-list-card/application-list-card.component';
// import {
//   FundingApplication,
//   ApplicationStats,
// } from 'src/app/SMEs/models/application.models';
// import { FormsModule } from '@angular/forms';
// import { SMEOpportunitiesService } from 'src/app/funding/services/opportunities.service';
// import {
//   UiSelectComponent,
//   SelectOption,
// } from 'src/app/shared/components/ui-select/ui-select.component';

// @Component({
//   selector: 'app-funder-applications',
//   standalone: true,
//   imports: [
//     CommonModule,
//     LucideAngularModule,
//     ApplicationListCardComponent,
//     FormsModule,
//     UiSelectComponent,
//   ],
//   templateUrl: './funder-applications.component.html',
// })
// export class FunderApplicationsComponent implements OnInit, OnDestroy {
//   private router = inject(Router);
//   private applicationService = inject(ApplicationManagementService);
//   private opportunitiesService = inject(SMEOpportunitiesService);
//   private destroy$ = new Subject<void>();

//   // Icons
//   AlertCircleIcon = CircleAlert;
//   FileTextIcon = FileText;
//   EyeIcon = Eye;
//   ArrowRightIcon = ArrowRight;

//   // State
//   allApplications = signal<FundingApplication[]>([]);
//   opportunities = signal<any[]>([]);
//   applicationStats = signal<ApplicationStats | null | undefined>(null);
//   applicationsLoading = signal(false);
//   opportunitiesLoading = signal(false);
//   applicationsError = signal<string | null>(null);
//   selectedOpportunityFilter = signal<string>('');
//   organizationId = signal<string | null>(null);

//   // Computed properties
//   filteredApplications = computed(() => {
//     const apps = this.allApplications();
//     const opportunityFilter = this.selectedOpportunityFilter();
//     return !opportunityFilter
//       ? apps
//       : apps.filter((app) => app.opportunityId === opportunityFilter);
//   });

//   recentApplicationsComputed = computed(() =>
//     this.allApplications()
//       .slice()
//       .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
//       .slice(0, 10)
//   );

//   uniqueOpportunities = computed(() => this.opportunities());

//   applicationsInReview = computed(() =>
//     this.allApplications().filter(
//       (app) => app.status === 'submitted' || app.status === 'under_review'
//     )
//   );

//   async ngOnInit() {
//     await Promise.all([
//       this.loadApplicationsData(),
//       this.loadOpportunitiesData(),
//     ]);
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   private async loadApplicationsData() {
//     try {
//       this.applicationsLoading.set(true);
//       this.applicationsError.set(null);

//       const applications = await this.applicationService
//         .getAllManageableApplications()
//         .toPromise();

//       this.allApplications.set(applications || []);
//       this.loadApplicationStats();
//     } catch (error) {
//       console.error('Failed to load applications:', error);
//       this.applicationsError.set('Failed to load applications');
//     } finally {
//       this.applicationsLoading.set(false);
//     }
//   }

//   private async loadOpportunitiesData() {
//     try {
//       this.opportunitiesLoading.set(true);

//       // Load opportunities from SMEOpportunitiesService
//       const opps = await this.opportunitiesService
//         .loadActiveOpportunities()
//         .toPromise();
//       this.opportunities.set(opps || []);

//       console.log('✅ Opportunities loaded:', opps?.length);
//     } catch (error) {
//       console.error('Failed to load opportunities:', error);
//       this.opportunities.set([]);
//     } finally {
//       this.opportunitiesLoading.set(false);
//     }
//   }

//   private async loadApplicationStats() {
//     try {
//       const stats = await this.applicationService
//         .getApplicationStats()
//         .toPromise();
//       this.applicationStats.set(stats ?? null);
//     } catch (error) {
//       console.error('Failed to load stats:', error);
//     }
//   }

//   /**
//    * Convert opportunities to SelectOption format for ui-select component
//    */
//   getOpportunityOptions(): SelectOption[] {
//     return this.opportunities().map((opp) => ({
//       label: opp.title,
//       value: opp.id,
//     }));
//   }

//   // Event handlers
//   clearFilter() {
//     this.selectedOpportunityFilter.set('');
//   }

//   refreshApplicationsData() {
//     this.loadApplicationsData();
//   }

//   // Transform & display
//   transformToApplicationCard(app: FundingApplication): BaseApplicationCard {
//     return {
//       id: app.id,
//       title: app.title,
//       applicationNumber: `APP-${app.id.slice(-6).toUpperCase()}`,
//       status: app.status,
//       fundingType: app.opportunity?.fundingType,
//       requestedAmount: this.extractRequestedAmount(app.formData),
//       currency: app.opportunity?.currency || 'ZAR',
//       currentStage: this.formatStage(app.stage),
//       description: app.description,
//       createdAt: app.createdAt,
//       updatedAt: app.updatedAt,
//       submittedAt: app.submittedAt,
//       applicantName: `${app.applicant?.firstName || ''} ${
//         app.applicant?.lastName || ''
//       }`.trim(),
//       applicantCompany: app.applicant?.companyName,
//       opportunityTitle: app.opportunity?.title,
//       opportunityId: app.opportunityId,
//     };
//   }

//   private extractRequestedAmount(formData: Record<string, any>): number {
//     return (
//       formData?.['coverInformation']?.requestedAmount ??
//       formData?.['requestedAmount'] ??
//       formData?.['fundingInformation']?.requestedAmount ??
//       0
//     );
//   }

//   private formatStage(stage: string): string {
//     return stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
//   }

//   viewApplication(applicationId: string) {
//     this.router.navigate(['/funder/applications', applicationId]);
//   }

//   async updateApplicationStatus(applicationId: string, status: string) {
//     try {
//       await this.applicationService
//         .updateApplicationStatus(applicationId, status as any)
//         .toPromise();
//       this.refreshApplicationsData();
//     } catch (error) {
//       console.error('Error updating application status:', error);
//     }
//   }
// }
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
import { Subject, takeUntil } from 'rxjs';
import {
  LucideAngularModule,
  Search,
  Filter,
  Download,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  ArrowRight,
} from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { ApplicationManagementService } from 'src/app/SMEs/services/application-management.service';
import {
  FundingApplication,
  ApplicationStats,
} from 'src/app/SMEs/models/application.models';
import { SMEOpportunitiesService } from 'src/app/funding/services/opportunities.service';
import {
  UiSelectComponent,
  SelectOption,
} from 'src/app/shared/components/ui-select/ui-select.component';

interface FilterOptions {
  status:
    | 'all'
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected';
  searchQuery: string;
  sortBy: 'date' | 'amount' | 'score';
  sortOrder: 'asc' | 'desc';
  opportunityId: string;
}

@Component({
  selector: 'app-funder-applications',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FormsModule],
  templateUrl: './funder-applications.component.html',
})
export class FunderApplicationsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private applicationService = inject(ApplicationManagementService);
  private opportunitiesService = inject(SMEOpportunitiesService);
  private destroy$ = new Subject<void>();

  // Icons
  SearchIcon = Search;
  FilterIcon = Filter;
  DownloadIcon = Download;
  FileTextIcon = FileText;
  ClockIcon = Clock;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  AlertCircleIcon = AlertCircle;
  TrendingUpIcon = TrendingUp;
  UsersIcon = Users;
  DollarSignIcon = DollarSign;
  EyeIcon = Eye;
  ArrowRightIcon = ArrowRight;

  // State
  allApplications = signal<FundingApplication[]>([]);
  opportunities = signal<any[]>([]);
  applicationStats = signal<ApplicationStats | null>(null);
  loading = signal(true);
  opportunitiesLoading = signal(false);
  error = signal<string | null>(null);

  // Filters
  filters = signal<FilterOptions>({
    status: 'all',
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc',
    opportunityId: '',
  });

  // Computed properties
  filteredApplications = computed(() => {
    let apps = [...this.allApplications()];
    const filter = this.filters();

    // Filter by opportunity
    if (filter.opportunityId) {
      apps = apps.filter((app) => app.opportunityId === filter.opportunityId);
    }

    // Filter by status
    if (filter.status !== 'all') {
      apps = apps.filter((app) => app.status === filter.status);
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
          email.includes(query)
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
        case 'score':
          compareA = this.calculateScore(a);
          compareB = this.calculateScore(b);
          break;
      }

      return filter.sortOrder === 'asc'
        ? compareA - compareB
        : compareB - compareA;
    });

    return apps;
  });

  // Analytics computed from real data
  analytics = computed(() => {
    const apps = this.allApplications();
    const stats = this.applicationStats();

    return {
      total: apps.length,
      pending: apps.filter((a) => a.status === 'submitted').length,
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
      this.opportunitiesLoading.set(true);

      const opps = await this.opportunitiesService
        .loadActiveOpportunities()
        .toPromise();

      this.opportunities.set(opps || []);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
      this.opportunities.set([]);
    } finally {
      this.opportunitiesLoading.set(false);
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

  // Filter methods
  updateStatus(status: FilterOptions['status']) {
    this.filters.update((f) => ({ ...f, status }));
  }

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
      status: 'all',
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

  async updateApplicationStatus(applicationId: string, status: string) {
    try {
      await this.applicationService
        .updateApplicationStatus(applicationId, status as any)
        .toPromise();

      // Refresh data
      await this.loadApplicationsData();
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Failed to update application status. Please try again.');
    }
  }

  exportApplications() {
    console.log('Export applications');
    // TODO: Implement export functionality
    alert('Export functionality coming soon!');
  }

  refreshApplicationsData() {
    this.loadApplicationsData();
  }

  // Opportunity options for filter
  getOpportunityOptions(): SelectOption[] {
    return this.opportunities().map((opp) => ({
      label: opp.title,
      value: opp.id,
    }));
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

  calculateScore(application: FundingApplication): number {
    // TODO: Implement actual scoring logic
    // For now, return a placeholder based on status
    switch (application.status) {
      case 'approved':
        return 90;
      case 'under_review':
        return 75;
      case 'submitted':
        return 60;
      case 'rejected':
        return 30;
      default:
        return 0;
    }
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'slate',
      submitted: 'amber',
      under_review: 'blue',
      approved: 'green',
      rejected: 'red',
    };
    return colors[status] || 'slate';
  }

  getStatusIcon(status: string) {
    const icons: Record<string, any> = {
      draft: this.FileTextIcon,
      submitted: this.ClockIcon,
      under_review: this.AlertCircleIcon,
      approved: this.CheckCircleIcon,
      rejected: this.XCircleIcon,
    };
    return icons[status] || this.FileTextIcon;
  }

  getScoreColor(score?: number): string {
    if (!score) return 'slate';
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'amber';
    return 'red';
  }

  formatStatus(status: string): string {
    return status
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

  getOpportunityTitle(application: FundingApplication): string {
    return application.opportunity?.title || 'Unknown Opportunity';
  }
}
