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
//   FundingApplication,
//   ApplicationStats,
// } from 'src/app/SMEs/models/application.models';
// import { FormsModule } from '@angular/forms';
// import { SMEOpportunitiesService } from 'src/app/funding/services/opportunities.service';
// import {
//   UiSelectComponent,
//   SelectOption,
// } from 'src/app/shared/components/ui-select/ui-select.component';
// import {
//   ApplicationListCardComponent,
//   BaseApplicationCard,
// } from '../components/application-list-card/application-list-card.component';

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
import { Subject } from 'rxjs';
import {
  LucideAngularModule,
  FileText,
  Eye,
  ArrowRight,
  CircleAlert,
} from 'lucide-angular';
import { ApplicationManagementService } from 'src/app/SMEs/services/application-management.service';

import {
  FundingApplication,
  ApplicationStats,
} from 'src/app/SMEs/models/application.models';
import { FormsModule } from '@angular/forms';
import { SMEOpportunitiesService } from 'src/app/funding/services/opportunities.service';
import {
  UiSelectComponent,
  SelectOption,
} from 'src/app/shared/components/ui-select/ui-select.component';
import {
  ApplicationListCardComponent,
  BaseApplicationCard,
} from '../components/application-list-card/application-list-card.component';

@Component({
  selector: 'app-funder-applications',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ApplicationListCardComponent,
    FormsModule,
    UiSelectComponent,
  ],
  templateUrl: './funder-applications.component.html',
})
export class FunderApplicationsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private applicationService = inject(ApplicationManagementService);
  private opportunitiesService = inject(SMEOpportunitiesService);
  private destroy$ = new Subject<void>();

  // Icons
  AlertCircleIcon = CircleAlert;
  FileTextIcon = FileText;
  EyeIcon = Eye;
  ArrowRightIcon = ArrowRight;

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
  organizationId = signal<string | null>(null);
  activeTab = signal<string>('new'); // Default tab

  // Computed properties
  filteredApplications = computed(() => {
    const apps = this.allApplications();
    const opportunityFilter = this.selectedOpportunityFilter();
    return !opportunityFilter
      ? apps
      : apps.filter((app) => app.opportunityId === opportunityFilter);
  });

  // Applications filtered by active tab + opportunity
  filteredApplicationsByTab = computed(() => {
    const apps = this.filteredApplications();
    const tab = this.activeTab();
    const currentTab = this.tabs.find((t) => t.id === tab);
    if (!currentTab) return apps;

    return apps.filter((app) => currentTab.statuses.includes(app.status));
  });

  // Tab counts (for badges)
  tabCounts = computed(() => {
    const apps = this.filteredApplications();
    return {
      new: apps.filter((app) => app.status === 'submitted').length,
      review: apps.filter((app) => app.status === 'under_review').length,
      approved: apps.filter((app) => app.status === 'approved').length,
      rejected: apps.filter((app) => app.status === 'rejected').length,
    };
  });

  // Helper methods for template
  getTabCount(tabId: string): number {
    const counts = this.tabCounts();
    return counts[tabId as keyof typeof counts] || 0;
  }

  getActiveTabLabel(): string {
    const tab = this.tabs.find((t) => t.id === this.activeTab());
    return tab?.label || '';
  }

  recentApplicationsComputed = computed(() =>
    this.allApplications()
      .slice()
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10)
  );

  uniqueOpportunities = computed(() => this.opportunities());

  applicationsInReview = computed(() =>
    this.allApplications().filter(
      (app) => app.status === 'submitted' || app.status === 'under_review'
    )
  );

  async ngOnInit() {
    await Promise.all([
      this.loadApplicationsData(),
      this.loadOpportunitiesData(),
    ]);

    // Set smart default tab after data loads
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

      // Load opportunities from SMEOpportunitiesService
      const opps = await this.opportunitiesService
        .loadActiveOpportunities()
        .toPromise();
      this.opportunities.set(opps || []);

      console.log('✅ Opportunities loaded:', opps?.length);
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

  // Smart default tab - show tab with most actionable items
  private setSmartDefaultTab() {
    const counts = this.tabCounts();
    if (counts.new > 0) {
      this.activeTab.set('new');
    } else if (counts.review > 0) {
      this.activeTab.set('review');
    } else {
      this.activeTab.set('new'); // Default to new if nothing actionable
    }
  }

  /**
   * Convert opportunities to SelectOption format for ui-select component
   */
  getOpportunityOptions(): SelectOption[] {
    return this.opportunities().map((opp) => ({
      label: opp.title,
      value: opp.id,
    }));
  }

  // Tab navigation
  setActiveTab(tabId: string) {
    this.activeTab.set(tabId);
  }

  // Event handlers
  clearFilter() {
    this.selectedOpportunityFilter.set('');
  }

  refreshApplicationsData() {
    this.loadApplicationsData();
  }

  // Get empty state message based on active tab
  getEmptyStateMessage(): string {
    const tab = this.activeTab();
    const messages: Record<string, string> = {
      new: this.selectedOpportunityFilter()
        ? 'No new applications for the selected opportunity.'
        : 'No new applications yet. Applications appear here when SMEs submit them.',
      review: this.selectedOpportunityFilter()
        ? 'No applications under review for the selected opportunity.'
        : 'No applications under review. Move applications here to start the review process.',
      approved: this.selectedOpportunityFilter()
        ? 'No approved applications for the selected opportunity.'
        : 'No approved applications yet. Approved applications will appear here.',
      rejected: this.selectedOpportunityFilter()
        ? 'No rejected applications for the selected opportunity.'
        : 'No rejected applications yet.',
    };
    return messages[tab] || 'No applications found.';
  }

  // Transform & display
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
}
