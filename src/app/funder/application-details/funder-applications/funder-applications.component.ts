// src/app/funder/components/funder-applications/funder-applications.component.ts
import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { 
  LucideAngularModule, 
  AlertCircle,
  FileText,
  Eye,
  ArrowRight
} from 'lucide-angular';
import { ApplicationManagementService  } from 'src/app/SMEs/services/application-management.service';
import { ApplicationListCardComponent, BaseApplicationCard } from 'src/app/shared/components/application-list-card/application-list-card.component';
import { UiButtonComponent } from 'src/app/shared/components';
import { FunderOnboardingService } from '../../services/funder-onboarding.service';
import { FundingApplication, ApplicationStats } from 'src/app/SMEs/models/application.models';

@Component({
  selector: 'app-funder-applications',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ApplicationListCardComponent,
    UiButtonComponent
  ],
  templateUrl: './funder-applications.component.html',
  styles: [`
    .section-card {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .section-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .section-description {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .empty-state {
      padding: 3rem;
      text-align: center;
    }

    .empty-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f3f4f6;
      border-radius: 50%;
    }

    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .empty-description {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }
  `]
})
export class FunderApplicationsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private applicationService = inject(ApplicationManagementService);
  private onboardingService = inject(FunderOnboardingService);
  private destroy$ = new Subject<void>();

  // Icons
  AlertCircleIcon = AlertCircle;
  FileTextIcon = FileText;
  EyeIcon = Eye;
  ArrowRightIcon = ArrowRight;

  // State
  allApplications = signal<FundingApplication[]>([]);
  applicationStats = signal<ApplicationStats | null | undefined>(null);
  applicationsLoading = signal(false);
  applicationsError = signal<string | null>(null);
  selectedOpportunityFilter = signal<string>('');
  organizationId = signal<string | null>(null);

  // Computed properties
  filteredApplications = computed(() => {
    const apps = this.allApplications();
    const opportunityFilter = this.selectedOpportunityFilter();
    return !opportunityFilter ? apps : apps.filter(app => app.opportunityId === opportunityFilter);
  });

  recentApplicationsComputed = computed(() =>
    this.allApplications()
      .slice()
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10)
  );

  uniqueOpportunities = computed(() => {
    const opportunityMap = new Map();
    this.allApplications().forEach(app => {
      if (app.opportunity && !opportunityMap.has(app.opportunityId)) {
        opportunityMap.set(app.opportunityId, app.opportunity);
      }
    });
    return Array.from(opportunityMap.values());
  });

  applicationsInReview = computed(() =>
    this.allApplications().filter(app => 
      app.status === 'submitted' || app.status === 'under_review'
    )
  );

  async ngOnInit() {
     await this.loadApplicationsData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

 
private async loadApplicationsData() {
  try {
    this.applicationsLoading.set(true);
    this.applicationsError.set(null);

    // Load ALL active opportunities that funder can manage
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
    // Get stats for all applications
    const stats = await this.applicationService
      .getApplicationStats()
      .toPromise();
    this.applicationStats.set(stats ?? null);
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

  // Event handlers
  onOpportunityFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedOpportunityFilter.set(target.value);
  }

  clearFilter() {
    this.selectedOpportunityFilter.set('');
  }

  refreshApplicationsData() {
    this.loadApplicationsData();
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
      applicantName: `${app.applicant?.firstName || ''} ${app.applicant?.lastName || ''}`.trim(),
      applicantCompany: app.applicant?.companyName,
      opportunityTitle: app.opportunity?.title,
      opportunityId: app.opportunityId
    };
  }

  private extractRequestedAmount(formData: Record<string, any>): number {
    return formData?.['coverInformation']?.requestedAmount ??
           formData?.['requestedAmount'] ??
           formData?.['fundingInformation']?.requestedAmount ??
           0;
  }

  private formatStage(stage: string): string {
    return stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  viewApplication(applicationId: string) {
    this.router.navigate(['/funder/applications', applicationId]);
  }

  async updateApplicationStatus(applicationId: string, status: string) {
    try {
      await this.applicationService.updateApplicationStatus(applicationId, status as any).toPromise();
      this.refreshApplicationsData();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  }
}