// src/app/funders/application-detail/application-detail.component.ts - FIXED VERSION
import {
  Component,
  signal,
  computed,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bot, AlertCircle, Loader2 } from 'lucide-angular';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { ApplicationManagementService } from 'src/app/SMEs/services/application-management.service';
import { SMEOpportunitiesService } from 'src/app/funding/services/opportunities.service';
import { AiAssistantComponent } from 'src/app/ai/ai-assistant/ai-assistant.component';
import { ApplicationTabsComponent } from './components/application-tabs/application-tabs.component';
import { FundingProfileBackendService } from 'src/app/SMEs/services/funding-profile-backend.service';
import { ProfileDataTransformerService } from 'src/app/SMEs/services/profile-data-transformer.service';
import { ProfileData } from 'src/app/SMEs/profile/models/funding.models';
import { FundingApplication } from 'src/app/SMEs/models/application.models';
import { AuthService } from 'src/app/auth/production.auth.service';

import { ApplicationMetricsComponent } from './components/application-metrics/application-metrics.component';
import { ApplicationHeaderComponent } from '../components/application-header/application-header.component';
import { StatusManagementModalComponent } from '../components/status-management-modal/status-management-modal.component';
import { FundingOpportunity } from '../create-opportunity/shared/funding.interfaces';

interface ApplicationFormData {
  fundingType: string;
  offerAmount: string;
  requestedAmount?: number | string;
  purposeStatement?: string;
  useOfFunds?: string;
  timeline?: string;
  opportunityAlignment?: string;
  industry?: string;
  targetStage?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    ApplicationTabsComponent,
    AiAssistantComponent,
    StatusManagementModalComponent,
    ApplicationHeaderComponent,
    ApplicationMetricsComponent,
  ],
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.css'],
})
export class ApplicationDetailComponent implements OnInit, OnDestroy {
  // Services
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private applicationService = inject(ApplicationManagementService);
  private opportunitiesService = inject(SMEOpportunitiesService);
  private destroy$ = new Subject<void>();
  private backendService = inject(FundingProfileBackendService);
  private transformer = inject(ProfileDataTransformerService);
  private authService = inject(AuthService);

  // Icons
  BotIcon = Bot;
  AlertCircleIcon = AlertCircle;
  Loader2Icon = Loader2;

  // State
  applicationId = signal<string>('');
  application = signal<FundingApplication | null>(null);
  opportunity = signal<FundingOpportunity | null>(null);
  profileData = signal<Partial<ProfileData> | null>(null);
  organizationId = signal<string | undefined>(undefined);

  // Loading & Error States
  isLoading = signal(true);
  profileLoading = signal(false);
  error = signal<string | null>(null);
  profileError = signal<string | null>(null);

  // UI State
  showStatusModal = signal(false);

  // Computed
  hasCompleteDataForAnalysis = computed(
    () => !!(this.application() && this.opportunity() && this.profileData())
  );

  applicationForAI = computed(() => {
    const app = this.application();
    const opp = this.opportunity();
    const profile = this.profileData();
    const formData = this.formData();

    if (!app || !opp) return null;

    return {
      application: app,
      opportunity: opp,
      profileData: profile,
      formData: {
        requestedAmount: this.getRequestedAmount()?.toString() || '0',
        purposeStatement: formData.purposeStatement || app.description || '',
        useOfFunds: formData.useOfFunds || '',
        timeline: formData.timeline || '',
        opportunityAlignment: formData.opportunityAlignment || '',
      },
    };
  });

  formData = computed((): ApplicationFormData => {
    const app = this.application();
    const opp = this.opportunity();
    const rawFormData = (app?.formData as any) || {};

    return {
      fundingType: opp?.fundingType || 'equity',
      offerAmount: rawFormData.requestedAmount?.toString() || '0',
      ...rawFormData,
      industry: rawFormData.industry || opp?.['industry'],
      targetStage: rawFormData.targetStage || opp?.['targetStage'],
    };
  });

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('applicationId');
    if (id) {
      this.applicationId.set(id);
      await this.loadOrganizationId();
      await this.loadAllData();
    } else {
      this.router.navigate(['/funder/dashboard']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load current funder's organization ID
   */
  private async loadOrganizationId() {
    const user = this.authService.user();
    if (!user) return;

    try {
      // Get organization ID from user's organization membership

      const orgId = user.organizationId || user.id; // Fallback to user ID if no org
      this.organizationId.set(orgId);
    } catch (error) {
      console.error('❌ [APP-DETAIL] Failed to load organization ID:', error);
    }
  }

  /**
   * Load all application data in parallel
   */
  private async loadAllData() {
    this.isLoading.set(true);
    this.error.set(null);
    this.profileError.set(null);

    try {
      const application = await this.applicationService
        .getApplicationById(this.applicationId())
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      if (!application) {
        this.error.set('Application not found');
        return;
      }

      this.application.set(application);

      if (!application.applicantId) {
        this.error.set('Application is missing applicant information');
        return;
      }

      const parallelLoads = forkJoin({
        opportunity: this.opportunitiesService
          .getOpportunityById(application.opportunityId)
          .pipe(takeUntil(this.destroy$)),
        profile: this.loadApplicantProfile(application.applicantId),
      });

      const results = await parallelLoads.toPromise();

      if (results?.opportunity) {
        this.opportunity.set(results.opportunity);
      }
    } catch (error) {
      console.error('Error loading application data:', error);
      this.error.set('Failed to load application details');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Load applicant profile data
   */
  private async loadApplicantProfile(applicantId: string): Promise<void> {
    this.profileLoading.set(true);
    this.profileError.set(null);

    try {
      const fundingProfile = await this.backendService
        .loadSavedProfileForUser(applicantId)
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      if (fundingProfile) {
        const profileData =
          this.transformer.transformFromFundingProfile(fundingProfile);

        this.profileData.set(profileData);
      } else {
        throw new Error('No profile data returned');
      }
    } catch (error) {
      console.error('❌ [APP-DETAIL] Failed to load applicant profile:', error);

      let errorMessage = 'Unable to load applicant profile data.';
      if (error instanceof Error) {
        if (error.message.includes('No profile data found')) {
          errorMessage = 'Applicant has not completed their business profile.';
        } else if (error.message.includes('User ID is required')) {
          errorMessage = 'Invalid applicant information.';
        }
      }

      this.profileError.set(errorMessage);
    } finally {
      this.profileLoading.set(false);
    }
  }

  /**
   * Retry loading profile
   */
  async retryProfileLoading() {
    const application = this.application();
    if (application?.applicantId) {
      await this.loadApplicantProfile(application.applicantId);
    }
  }

  /**
   * Get requested amount from form data
   */
  getRequestedAmount(): number | null {
    const formData = this.formData();
    const amount = formData.requestedAmount;

    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  /**
   * Navigate back to applications list
   */
  goBack() {
    const application = this.application();
    if (application?.opportunityId) {
      this.router.navigate([
        '/funder/opportunities',
        application.opportunityId,
        'applications',
      ]);
    } else {
      this.router.navigate(['/funder/dashboard']);
    }
  }

  /**
   * Open status management modal
   */
  openStatusModal() {
    this.showStatusModal.set(true);
  }

  /**
   * Close status management modal
   */
  closeStatusModal() {
    this.showStatusModal.set(false);
  }

  /**
   * Handle status action completion
   */
  async onStatusActionCompleted() {
    await this.loadAllData();
  }

  /**
   * Handle market research request from tabs
   */
  onMarketResearchRequested() {
    console.log('Market research requested');
  }
}
