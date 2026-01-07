import {
  Component,
  signal,
  computed,
  OnInit,
  OnDestroy,
  inject,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { ApplicationManagementService } from 'src/app/fund-seeking-orgs/services/application-management.service';
import {
  FundingApplication,
  ApplicationStats,
} from 'src/app/fund-seeking-orgs/models/application.models';
import { FormsModule } from '@angular/forms';
import { SMEOpportunitiesService } from 'src/app/funding/services/opportunities.service';
import {
  UiSelectComponent,
  SelectOption,
} from 'src/app/shared/components/ui-select/ui-select.component';
import {
  ApplicationListCardComponent,
  BaseApplicationCard,
} from './application-list-card/application-list-card.component';
import { ApplicationsStatsComponent } from 'src/app/features/reports/analysis-history/applications-stats.component';
import { KapifyReportsExportService } from 'src/app/features/reports/services/kapify-reports-export.service';
import { ApplicationDetailModalComponent } from '../components/application-detail-modal/application-detail-modal.component';
import { ApplicationsReviewHeaderComponent } from './components/applications-review-header.component';
import {
  ReportBuilderComponent,
  ApplicationReportRecord,
  ReportExportEvent,
} from 'src/app/features/reports/analysis-history/report-builder-modal-premium.component';

@Component({
  selector: 'app-funder-applications',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ApplicationListCardComponent,
    FormsModule,
    UiSelectComponent,
    ApplicationDetailModalComponent,
    ApplicationsReviewHeaderComponent,
    ApplicationsStatsComponent,
    ReportBuilderComponent,
  ],
  template: `
    <div class="space-y-8 pb-20 m-8">
      <!-- Header with Export & Refresh -->
      <app-applications-review-header
        (refresh)="refreshApplicationsData()"
        (export)="onExport($event)"
        (openReportBuilder)="openReportBuilder()"
      ></app-applications-review-header>

      <!-- Applications Stats -->
      <app-applications-stats
        [summary]="activitySummary()"
      ></app-applications-stats>

      <!-- Filter Section -->
      <div class="bg-white rounded-2xl border border-slate-200 p-6">
        <div class="flex items-end gap-6">
          <div class="flex-1 min-w-0">
            <ui-select
              [options]="getOpportunityOptions()"
              [(ngModel)]="selectedOpportunityFilter"
              label="Filter by Opportunity"
              placeholder="All Opportunities"
            />
          </div>
          <div class="text-sm text-slate-600 whitespace-nowrap">
            <strong>{{ filteredApplications().length }}</strong> of
            <strong>{{ allApplications().length }}</strong> applications
          </div>
        </div>
      </div>

      <!-- Tabs Section -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <!-- Tab Navigation -->
        <div class="border-b border-slate-200">
          <nav class="flex -mb-px" aria-label="Tabs">
            @for (tab of tabs; track tab.id) {
            <button
              (click)="setActiveTab(tab.id)"
              [class]="
                activeTab() === tab.id
                  ? 'border-teal-500 text-teal-600 bg-teal-50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              "
              class="flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span>{{ tab.label }}</span>
              <span
                [class]="
                  activeTab() === tab.id
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-slate-100 text-slate-600'
                "
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
              >
                {{ getTabCount(tab.id) }}
              </span>
            </button>
            }
          </nav>
        </div>

        <!-- Loading State -->
        @if (applicationsLoading()) {
        <div class="p-12 text-center">
          <div
            class="animate-spin rounded-full h-10 w-10 border-2 border-slate-300 border-t-teal-500 mx-auto mb-4"
          ></div>
          <p class="text-slate-600">Loading applications...</p>
        </div>
        }

        <!-- Error State -->
        @if (applicationsError() && !applicationsLoading()) {
        <div class="p-12 text-center">
          <div
            class="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">
            Error Loading Applications
          </h3>
          <p class="text-slate-600 mb-6">{{ applicationsError() }}</p>
          <button
            (click)="refreshApplicationsData()"
            class="px-6 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
        }

        <!-- Empty State -->
        @if (!applicationsLoading() && !applicationsError() &&
        filteredApplicationsByTab().length === 0) {
        <div class="p-12 text-center">
          <div
            class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg
              class="w-8 h-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-900 mb-2">
            No applications found
          </h3>
          <p class="text-slate-600 mb-6">
            {{ getEmptyStateMessage() }}
          </p>
          @if (selectedOpportunityFilter()) {
          <button
            (click)="clearFilter()"
            class="px-4 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 active:bg-slate-300 transition-colors duration-200"
          >
            Show All Applications
          </button>
          }
        </div>
        }

        <!-- Applications List -->
        @if (!applicationsLoading() && !applicationsError() &&
        filteredApplicationsByTab().length > 0) {
        <div>
          <!-- Tab Header -->
          <div class="px-6 py-5 border-b border-slate-200 bg-slate-50">
            <h2 class="text-lg font-bold text-slate-900">
              {{ getActiveTabLabel() }}
            </h2>
            <p class="text-sm text-slate-600 mt-1">
              {{ filteredApplicationsByTab().length }}
              {{
                filteredApplicationsByTab().length === 1
                  ? 'application'
                  : 'applications'
              }}
              @if (selectedOpportunityFilter()) {
              <span>for selected opportunity</span>
              }
            </p>
          </div>

          <!-- Application Cards -->
          <div class="divide-y divide-slate-200">
            @for (application of filteredApplicationsByTab(); track
            application.id) {
            <div
              class="p-6 hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
              (click)="viewApplicationDetails(application)"
            >
              <app-application-list-card
                [application]="transformToApplicationCard(application)"
                [applicant]="application"
                [userType]="'funder'"
                [showProgress]="true"
              >
                <div slot="actions" class="flex items-center gap-2">
                  <button
                    (click)="
                      viewApplication(application.id); $event.stopPropagation()
                    "
                    class="px-3 py-1.5 bg-teal-500 text-white text-xs font-medium rounded-lg hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200"
                  >
                    Start Application Review
                  </button>

                  @if ( application.status === 'submitted' && activeTab() ===
                  'new' ) {
                  <button
                    (click)="
                      updateApplicationStatus(application.id, 'under_review');
                      $event.stopPropagation()
                    "
                    class="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-lg hover:bg-amber-100 active:bg-amber-200 transition-colors duration-200 border border-amber-200/50"
                  >
                    Mark as under review
                  </button>
                  } @if ( application.status === 'under_review' && activeTab()
                  === 'review' ) {
                  <button
                    (click)="
                      updateApplicationStatus(application.id, 'approved');
                      $event.stopPropagation()
                    "
                    class="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors duration-200 border border-green-200/50"
                  >
                    Approve
                  </button>
                  <button
                    (click)="
                      updateApplicationStatus(application.id, 'rejected');
                      $event.stopPropagation()
                    "
                    class="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors duration-200 border border-red-200/50"
                  >
                    Reject
                  </button>
                  }
                </div>
              </app-application-list-card>
            </div>
            }
          </div>
        </div>
        }
      </div>
    </div>

    <!-- Application Detail Modal -->
    <app-application-detail-modal
      [application]="selectedApplicationForModal()"
      (onClose)="selectedApplicationForModal.set(null)"
      (onDownload)="downloadApplicationDocuments($event)"
    />

    <!-- Report Builder Modal -->
    <app-report-builder
      [data]="{ allRecords: transformToReportData(allApplications()) }"
      (onExport)="onReportExport($event)"
      (onClose)="onReportBuilderClose()"
    ></app-report-builder>
  `,
})
export class FunderApplicationsComponent implements OnInit, OnDestroy {
  @ViewChild(ReportBuilderComponent) reportBuilder!: ReportBuilderComponent;

  private router = inject(Router);
  private applicationService = inject(ApplicationManagementService);
  private opportunitiesService = inject(SMEOpportunitiesService);
  private exportService = inject(KapifyReportsExportService);
  private destroy$ = new Subject<void>();

  // Modal state
  selectedApplicationForModal = signal<any>(null);

  // Tab configuration
  tabs = [
    { id: 'new', label: 'New Applications', statuses: ['submitted'] },
    { id: 'review', label: 'Under Review', statuses: ['under_review'] },
    { id: 'approved', label: 'Approved', statuses: ['approved'] },
    { id: 'rejected', label: 'Rejected', statuses: ['rejected'] },
  ];

  // State
  allApplications = signal<FundingApplication[]>([]);
  opportunities = signal<any[]>([]);
  applicationStats = signal<ApplicationStats | null | undefined>(null);
  applicationsLoading = signal(false);
  opportunitiesLoading = signal(false);
  applicationsError = signal<string | null>(null);
  selectedOpportunityFilter = signal<string>('');
  activeTab = signal<string>('new');

  // Computed properties
  filteredApplications = computed(() => {
    const apps = this.allApplications();
    const opportunityFilter = this.selectedOpportunityFilter();
    return !opportunityFilter
      ? apps
      : apps.filter((app) => app.opportunityId === opportunityFilter);
  });

  filteredApplicationsByTab = computed(() => {
    const apps = this.filteredApplications();
    const tab = this.activeTab();
    const currentTab = this.tabs.find((t) => t.id === tab);
    if (!currentTab) return apps;

    return apps.filter((app) => currentTab.statuses.includes(app.status));
  });

  tabCounts = computed(() => {
    const apps = this.filteredApplications();
    return {
      new: apps.filter((app) => app.status === 'submitted').length,
      review: apps.filter((app) => app.status === 'under_review').length,
      approved: apps.filter((app) => app.status === 'approved').length,
      rejected: apps.filter((app) => app.status === 'rejected').length,
    };
  });

  activitySummary = computed(() => {
    const apps = this.allApplications();
    return {
      totalApplications: apps.length,
      approved: apps.filter((a) => a.status === 'approved').length,
      pending: apps.filter(
        (a) => a.status === 'submitted' || a.status === 'under_review'
      ).length,
      avgMatchScore: apps.length
        ? Math.round(
            apps.reduce((sum, a) => sum + (a.aiMatchScore || 0), 0) /
              apps.length
          )
        : 0,
    };
  });

  getTabCount(tabId: string): number {
    const counts = this.tabCounts();
    return counts[tabId as keyof typeof counts] || 0;
  }

  getActiveTabLabel(): string {
    const tab = this.tabs.find((t) => t.id === this.activeTab());
    return tab?.label || '';
  }

  async ngOnInit() {
    await Promise.all([
      this.loadApplicationsData(),
      this.loadOpportunitiesData(),
    ]);

    this.setSmartDefaultTab();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadApplicationsData() {
    try {
      this.applicationsLoading.set(true);
      this.applicationsError.set(null);

      const applications = await this.applicationService
        .getAllManageableApplications()
        .toPromise();

      this.allApplications.set(applications || []);
      this.loadApplicationStats();
    } catch (error) {
      console.error('Failed to load applications:', error);
      this.applicationsError.set('Failed to load applications');
    } finally {
      this.applicationsLoading.set(false);
    }
  }

  private async loadOpportunitiesData() {
    try {
      this.opportunitiesLoading.set(true);

      const opps = await this.opportunitiesService
        .loadActiveOpportunities()
        .toPromise();
      this.opportunities.set(opps || []);
    } catch (error) {
      console.error('Failed to load opportunities:', error);
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
      this.applicationStats.set(stats ?? null);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  private setSmartDefaultTab() {
    const counts = this.tabCounts();
    if (counts.new > 0) {
      this.activeTab.set('new');
    } else if (counts.review > 0) {
      this.activeTab.set('review');
    } else {
      this.activeTab.set('new');
    }
  }

  getOpportunityOptions(): SelectOption[] {
    return this.opportunities().map((opp) => ({
      label: opp.title,
      value: opp.id,
    }));
  }

  setActiveTab(tabId: string) {
    this.activeTab.set(tabId);
  }

  clearFilter() {
    this.selectedOpportunityFilter.set('');
  }

  refreshApplicationsData() {
    this.loadApplicationsData();
  }

  onExport(event: {
    format: 'excel' | 'pdf' | 'csv';
    includeFilters: boolean;
  }) {
    const dataToExport = event.includeFilters
      ? this.filteredApplications()
      : this.allApplications();

    // Map to export format
    const exportData = dataToExport.map((app) => ({
      ID: app.id,
      Title: app.title,
      Applicant: `${app.applicant?.firstName} ${app.applicant?.lastName}`,
      Status: app.status,
      RequestedAmount: app.formData?.['coverInformation']?.requestedAmount || 0,
      MatchScore: app.aiMatchScore || 'N/A',
      Opportunity: app.opportunity?.title || 'N/A',
      CreatedAt: app.createdAt,
    }));

    // Call appropriate export method
    if (event.format === 'excel') {
      this.exportService.exportToExcel(exportData as any);
    } else if (event.format === 'pdf') {
      this.exportService.exportToPDF(exportData as any);
    }
  }

  getEmptyStateMessage(): string {
    const tab = this.activeTab();
    const messages: Record<string, string> = {
      new: 'No new applications yet',
      review: 'No applications under review',
      approved: 'No approved applications yet',
      rejected: 'No rejected applications yet',
    };
    return messages[tab] || 'No applications found.';
  }

  transformToApplicationCard(app: FundingApplication): BaseApplicationCard {
    return {
      id: app.id,
      title: app.title,
      applicationNumber: `APP-${app.id.slice(-6).toUpperCase()}`,
      status: app.status,
      fundingType: app.opportunity?.fundingType,
      requestedAmount: this.extractRequestedAmount(app.formData),
      currency: app.opportunity?.currency || 'ZAR',
      currentStage: this.formatStage(app.stage),
      description: app.description,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      submittedAt: app.submittedAt,
      applicantName: `${app.applicant?.firstName || ''} ${
        app.applicant?.lastName || ''
      }`.trim(),
      applicantCompany: app.applicant?.companyName,
      opportunityTitle: app.opportunity?.title,
      opportunityId: app.opportunityId,
    };
  }

  private extractRequestedAmount(formData: Record<string, any>): number {
    return (
      formData?.['coverInformation']?.requestedAmount ??
      formData?.['requestedAmount'] ??
      formData?.['fundingInformation']?.requestedAmount ??
      0
    );
  }

  private formatStage(stage: string): string {
    return stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  viewApplication(applicationId: string) {
    this.router.navigate(['/funder/applications', applicationId]);
  }

  async updateApplicationStatus(applicationId: string, status: string) {
    try {
      await this.applicationService
        .updateApplicationStatus(applicationId, status as any)
        .toPromise();
      this.refreshApplicationsData();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  }

  viewApplicationDetails(application: FundingApplication): void {
    const modalData = {
      id: application.id,
      title: application.title,
      applicantOrganizationName: application.applicantOrganizationName,
      applicantName: `${application.applicant?.firstName || ''} ${
        application.applicant?.lastName || ''
      }`.trim(),
      status: application.status,
      stage: application.stage,
      requestedAmount: this.extractRequestedAmount(application.formData),
      currency: application.opportunity?.currency || 'ZAR',
      description: application.description,
      formData: application.formData,
      submittedAt: application.submittedAt,
      createdAt: application.createdAt,
      matchScore: application.aiMatchScore,
      completionScore: 80,
      applicant: {
        firstName: application.applicant?.firstName,
        lastName: application.applicant?.lastName,
        email: application.applicant?.email,
        companyName: application.applicant?.companyName,
      },
      opportunity: {
        title: application.opportunity?.title,
        fundingType: application.opportunity?.fundingType,
        currency: application.opportunity?.currency,
      },
    };

    this.selectedApplicationForModal.set(modalData);
  }

  downloadApplicationDocuments(application: any): void {
    console.log('Downloading documents for application:', application.id);
  }

  /**
   * Transform FundingApplication to ApplicationReportRecord for report builder
   * Safely handles all optional and union-typed fields
   */
  transformToReportData(apps: FundingApplication[]): ApplicationReportRecord[] {
    return apps.map((app, idx) => ({
      id: app.id,
      no: idx + 1,
      nameOfBusiness: app.applicant?.companyName || '',
      industry: (app.formData?.['businessDetails']?.industry as string) || '',
      businessStage:
        (app.formData?.['businessDetails']?.stage as string) || 'Startup',
      yearsInOperation:
        (app.formData?.['businessDetails']?.yearsInOperation as number) || 0,
      numberOfEmployees:
        (app.formData?.['businessDetails']?.numberOfEmployees as number) || 0,
      province: (app.formData?.['businessDetails']?.province as string) || '',
      priorYearAnnualRevenue:
        (app.formData?.['financialInfo']?.priorYearRevenue as number) || 0,
      firstName: app.applicant?.firstName || '',
      surname: app.applicant?.lastName || '',
      email: app.applicant?.email || '',
      phoneNumber: '',
      amountRequested: this.extractRequestedAmount(app.formData),
      fundingType: this.normalizeFundingType(app.opportunity?.fundingType),
      applicationStatus: app.status,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));
  }

  /**
   * Normalize fundingType to always be a string
   * Handles both string and string[] values
   */
  private normalizeFundingType(
    fundingType: string | string[] | undefined
  ): string {
    if (!fundingType) return '';
    if (Array.isArray(fundingType)) {
      return fundingType[0] || '';
    }
    return fundingType;
  }

  /**
   * Open the report builder modal
   */
  openReportBuilder(): void {
    this.reportBuilder.open();
  }

  /**
   * Handle report export from modal
   */
  async onReportExport(event: ReportExportEvent): Promise<void> {
    try {
      console.log(
        'Report exported:',
        event.title,
        event.format,
        `(${event.data.length} records)`
      );
    } catch (error) {
      console.error('Error handling export:', error);
    }
  }

  /**
   * Handle report builder close
   */
  onReportBuilderClose(): void {
    // Optional cleanup
  }
}
