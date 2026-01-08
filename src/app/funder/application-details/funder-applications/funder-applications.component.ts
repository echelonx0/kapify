// import {
//   Component,
//   signal,
//   computed,
//   OnInit,
//   OnDestroy,
//   inject,
//   ViewChild,
// } from '@angular/core';
// import { Router } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { Subject } from 'rxjs';
// import { LucideAngularModule } from 'lucide-angular';
// import { ApplicationManagementService } from 'src/app/fund-seeking-orgs/services/application-management.service';
// import {
//   FundingApplication,
//   ApplicationStats,
// } from 'src/app/fund-seeking-orgs/models/application.models';
// import { FormsModule } from '@angular/forms';
// import {
//   UiSelectComponent,
//   SelectOption,
// } from 'src/app/shared/components/ui-select/ui-select.component';

// import { ApplicationsStatsComponent } from 'src/app/features/reports/analysis-history/applications-stats.component';
// import { KapifyReportsExportService } from 'src/app/features/reports/services/kapify-reports-export.service';
// import { ApplicationDetailModalComponent } from '../components/application-detail-modal/application-detail-modal.component';
// import { ApplicationsReviewHeaderComponent } from './components/applications-review-header.component';
// import {
//   ReportBuilderComponent,
//   ApplicationReportRecord,
//   ReportExportEvent,
// } from 'src/app/features/reports/analysis-history/report-builder-modal-premium.component';
// import {
//   ApplicationListCardComponent,
//   BaseApplicationCard,
// } from './components/application-list-card/application-list-card.component';

// @Component({
//   selector: 'app-funder-applications',
//   standalone: true,
//   imports: [
//     CommonModule,
//     LucideAngularModule,
//     ApplicationListCardComponent,
//     FormsModule,
//     UiSelectComponent,
//     ApplicationDetailModalComponent,
//     ApplicationsReviewHeaderComponent,
//     ApplicationsStatsComponent,
//     ReportBuilderComponent,
//   ],
//   templateUrl: './funder-applications.component.html',
// })
// export class FunderApplicationsComponent implements OnInit, OnDestroy {
//   @ViewChild(ReportBuilderComponent) reportBuilder!: ReportBuilderComponent;

//   private router = inject(Router);
//   private applicationService = inject(ApplicationManagementService);
//   private exportService = inject(KapifyReportsExportService);
//   private destroy$ = new Subject<void>();

//   // Modal state
//   selectedApplicationForModal = signal<any>(null);

//   // Tab configuration
//   tabs = [
//     { id: 'new', label: 'New Applications', statuses: ['submitted'] },
//     { id: 'review', label: 'Under Review', statuses: ['under_review'] },
//     { id: 'approved', label: 'Approved', statuses: ['approved'] },
//     { id: 'rejected', label: 'Rejected', statuses: ['rejected'] },
//   ];

//   // State
//   allApplications = signal<FundingApplication[]>([]);
//   opportunities = signal<any[]>([]);
//   applicationStats = signal<ApplicationStats | null | undefined>(null);
//   applicationsLoading = signal(false);
//   opportunitiesLoading = signal(false);
//   applicationsError = signal<string | null>(null);
//   selectedOpportunityFilter = signal<string>('');
//   activeTab = signal<string>('new');

//   // Computed properties
//   filteredApplications = computed(() => {
//     const apps = this.allApplications();
//     const opportunityFilter = this.selectedOpportunityFilter();
//     return !opportunityFilter
//       ? apps
//       : apps.filter((app) => app.opportunityId === opportunityFilter);
//   });

//   filteredApplicationsByTab = computed(() => {
//     const apps = this.filteredApplications();
//     const tab = this.activeTab();
//     const currentTab = this.tabs.find((t) => t.id === tab);
//     if (!currentTab) return apps;

//     return apps.filter((app) => currentTab.statuses.includes(app.status));
//   });

//   tabCounts = computed(() => {
//     const apps = this.filteredApplications();
//     return {
//       new: apps.filter((app) => app.status === 'submitted').length,
//       review: apps.filter((app) => app.status === 'under_review').length,
//       approved: apps.filter((app) => app.status === 'approved').length,
//       rejected: apps.filter((app) => app.status === 'rejected').length,
//     };
//   });

//   activitySummary = computed(() => {
//     const apps = this.allApplications();
//     return {
//       totalApplications: apps.length,
//       approved: apps.filter((a) => a.status === 'approved').length,
//       pending: apps.filter(
//         (a) => a.status === 'submitted' || a.status === 'under_review'
//       ).length,
//       avgMatchScore: apps.length
//         ? Math.round(
//             apps.reduce((sum, a) => sum + (a.aiMatchScore || 0), 0) /
//               apps.length
//           )
//         : 0,
//     };
//   });

//   getTabCount(tabId: string): number {
//     const counts = this.tabCounts();
//     return counts[tabId as keyof typeof counts] || 0;
//   }

//   getActiveTabLabel(): string {
//     const tab = this.tabs.find((t) => t.id === this.activeTab());
//     return tab?.label || '';
//   }

//   async ngOnInit() {
//     await Promise.all([
//       this.loadApplicationsData(),
//       //  this.loadOpportunitiesData(),
//     ]);

//     this.setSmartDefaultTab();
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

//   private setSmartDefaultTab() {
//     const counts = this.tabCounts();
//     if (counts.new > 0) {
//       this.activeTab.set('new');
//     } else if (counts.review > 0) {
//       this.activeTab.set('review');
//     } else {
//       this.activeTab.set('new');
//     }
//   }

//   getOpportunityOptions(): SelectOption[] {
//     return this.opportunities().map((opp) => ({
//       label: opp.title,
//       value: opp.id,
//     }));
//   }

//   setActiveTab(tabId: string) {
//     this.activeTab.set(tabId);
//   }

//   clearFilter() {
//     this.selectedOpportunityFilter.set('');
//   }

//   refreshApplicationsData() {
//     this.loadApplicationsData();
//   }

//   onExport(event: {
//     format: 'excel' | 'pdf' | 'csv';
//     includeFilters: boolean;
//   }) {
//     const dataToExport = event.includeFilters
//       ? this.filteredApplications()
//       : this.allApplications();

//     // Map to export format
//     const exportData = dataToExport.map((app) => ({
//       ID: app.id,
//       Title: app.title,
//       Applicant: `${app.applicant?.firstName} ${app.applicant?.lastName}`,
//       Status: app.status,
//       RequestedAmount: app.formData?.['coverInformation']?.requestedAmount || 0,
//       MatchScore: app.aiMatchScore || 'N/A',
//       Opportunity: app.opportunity?.title || 'N/A',
//       CreatedAt: app.createdAt,
//     }));

//     // Call appropriate export method
//     if (event.format === 'excel') {
//       this.exportService.exportToExcel(exportData as any);
//     } else if (event.format === 'pdf') {
//       this.exportService.exportToPDF(exportData as any);
//     }
//   }

//   getEmptyStateMessage(): string {
//     const tab = this.activeTab();
//     const messages: Record<string, string> = {
//       new: 'No new applications yet',
//       review: 'No applications under review',
//       approved: 'No approved applications yet',
//       rejected: 'No rejected applications yet',
//     };
//     return messages[tab] || 'No applications found.';
//   }

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

//   viewApplicationDetails(application: FundingApplication): void {
//     const modalData = {
//       id: application.id,
//       title: application.title,
//       applicantOrganizationName: application.applicantOrganizationName,
//       applicantName: `${application.applicant?.firstName || ''} ${
//         application.applicant?.lastName || ''
//       }`.trim(),
//       status: application.status,
//       stage: application.stage,
//       requestedAmount: this.extractRequestedAmount(application.formData),
//       currency: application.opportunity?.currency || 'ZAR',
//       description: application.description,
//       formData: application.formData,
//       submittedAt: application.submittedAt,
//       createdAt: application.createdAt,
//       matchScore: application.aiMatchScore,
//       completionScore: 80,
//       applicant: {
//         firstName: application.applicant?.firstName,
//         lastName: application.applicant?.lastName,
//         email: application.applicant?.email,
//         companyName: application.applicant?.companyName,
//       },
//       opportunity: {
//         title: application.opportunity?.title,
//         fundingType: application.opportunity?.fundingType,
//         currency: application.opportunity?.currency,
//       },
//     };

//     this.selectedApplicationForModal.set(modalData);
//   }

//   downloadApplicationDocuments(application: any): void {
//     console.log('Downloading documents for application:', application.id);
//   }

//   /**
//    * Transform FundingApplication to ApplicationReportRecord for report builder
//    * Safely handles all optional and union-typed fields
//    */
//   transformToReportData(apps: FundingApplication[]): ApplicationReportRecord[] {
//     return apps.map((app, idx) => ({
//       id: app.id,
//       no: idx + 1,
//       nameOfBusiness: app.applicant?.companyName || '',
//       industry: (app.formData?.['businessDetails']?.industry as string) || '',
//       businessStage:
//         (app.formData?.['businessDetails']?.stage as string) || 'Startup',
//       yearsInOperation:
//         (app.formData?.['businessDetails']?.yearsInOperation as number) || 0,
//       numberOfEmployees:
//         (app.formData?.['businessDetails']?.numberOfEmployees as number) || 0,
//       province: (app.formData?.['businessDetails']?.province as string) || '',
//       priorYearAnnualRevenue:
//         (app.formData?.['financialInfo']?.priorYearRevenue as number) || 0,
//       firstName: app.applicant?.firstName || '',
//       surname: app.applicant?.lastName || '',
//       email: app.applicant?.email || '',
//       phoneNumber: '',
//       amountRequested: this.extractRequestedAmount(app.formData),
//       fundingType: this.normalizeFundingType(app.opportunity?.fundingType),
//       applicationStatus: app.status,
//       createdAt: app.createdAt,
//       updatedAt: app.updatedAt,
//     }));
//   }

//   /**
//    * Normalize fundingType to always be a string
//    * Handles both string and string[] values
//    */
//   private normalizeFundingType(
//     fundingType: string | string[] | undefined
//   ): string {
//     if (!fundingType) return '';
//     if (Array.isArray(fundingType)) {
//       return fundingType[0] || '';
//     }
//     return fundingType;
//   }

//   /**
//    * Open the report builder modal
//    */
//   openReportBuilder(): void {
//     this.reportBuilder.open();
//   }

//   /**
//    * Handle report export from modal
//    */
//   async onReportExport(event: ReportExportEvent): Promise<void> {
//     try {
//       console.log(
//         'Report exported:',
//         event.title,
//         event.format,
//         `(${event.data.length} records)`
//       );
//     } catch (error) {
//       console.error('Error handling export:', error);
//     }
//   }

//   /**
//    * Handle report builder close
//    */
//   onReportBuilderClose(): void {
//     // Optional cleanup
//   }
// }
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
import { Subject, takeUntil } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { ApplicationManagementService } from 'src/app/fund-seeking-orgs/services/application-management.service';
import {
  FundingApplication,
  ApplicationStats,
} from 'src/app/fund-seeking-orgs/models/application.models';
import { FormsModule } from '@angular/forms';
import {
  UiSelectComponent,
  SelectOption,
} from 'src/app/shared/components/ui-select/ui-select.component';

import { ApplicationsStatsComponent } from 'src/app/features/reports/analysis-history/applications-stats.component';
import { KapifyReportsExportService } from 'src/app/features/reports/services/kapify-reports-export.service';
import { ApplicationDetailModalComponent } from '../components/application-detail-modal/application-detail-modal.component';
import { ApplicationsReviewHeaderComponent } from './components/applications-review-header.component';
import {
  ReportBuilderComponent,
  ApplicationReportRecord,
  ReportExportEvent,
} from 'src/app/features/reports/analysis-history/report-builder-modal-premium.component';
import {
  ApplicationListCardComponent,
  BaseApplicationCard,
} from './components/application-list-card/application-list-card.component';
import { ApplicationManagementListService } from 'src/app/fund-seeking-orgs/services/applications-management-list.service';

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
  templateUrl: './funder-applications.component.html',
})
export class FunderApplicationsComponent implements OnInit, OnDestroy {
  @ViewChild(ReportBuilderComponent) reportBuilder!: ReportBuilderComponent;

  private router = inject(Router);
  private applicationService = inject(ApplicationManagementService);
  private listService = inject(ApplicationManagementListService);
  private exportService = inject(KapifyReportsExportService);
  private destroy$ = new Subject<void>();

  // Modal state
  selectedApplicationForModal = signal<any>(null);

  // Loading state for status updates
  updatingApplicationId = signal<string | null>(null);

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
      //  this.loadOpportunitiesData(),
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

  /**
   * Update application status with full side effects
   * - Activity tracking
   * - Applicant notifications
   * - Toast feedback
   * - UI refresh
   */
  updateApplicationStatus(
    application: FundingApplication,
    status: 'submitted' | 'under_review' | 'approved' | 'rejected'
  ): void {
    // Prevent duplicate updates
    if (this.updatingApplicationId() === application.id) {
      return;
    }

    this.updatingApplicationId.set(application.id);

    this.listService
      .updateApplicationStatus(application, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedApp) => {
          // Update local state
          this.allApplications.update((apps) =>
            apps.map((app) =>
              app.id === application.id ? { ...app, status } : app
            )
          );
          this.updatingApplicationId.set(null);
        },
        error: () => {
          this.updatingApplicationId.set(null);
        },
      });
  }

  /**
   * Check if application can have actions
   * Final states (approved/rejected) are read-only
   */
  canPerformActions(status: string): boolean {
    return !['approved', 'rejected'].includes(status);
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
