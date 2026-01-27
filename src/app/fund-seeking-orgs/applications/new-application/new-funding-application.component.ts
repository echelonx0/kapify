import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { LucideAngularModule, ArrowLeft, Clock } from 'lucide-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SMEOpportunitiesService } from 'src/app/funding/services/opportunities.service';
import { GlobalProfileValidationService } from 'src/app/shared/services/global-profile-validation.service';
import { ApplicationFormService } from './services/application-form.service';
import { ApplicationValidationService } from './services/application-validation.service';
import { OpportunitySelectorComponent } from './components/opportunity-selector/opportunity-selector.component';
import { ApplicationFormComponent } from './components/application-form/application-form.component';
import { ReviewSummaryComponent } from './components/review-summary/review-summary.component';
import { OpportunitySidebarComponent } from './components/opportunity-sidebar/opportunity-sidebar.component';
import {
  ApplicationFormStep,
  ApplicationStepId,
} from './models/application-form.model';
import { FundingApplicationProfile } from '../models/funding-application.models';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
import { Application } from './models/funding-application.model';
import { KapifyAIAnalysisComponent } from 'src/app/fund-seeking-orgs/applications/new-application/components/evaluation-component/kapify-ai-analysis.component';
import { DatabaseApplicationService } from '../../services/database-application.service';
import { FundingProfileBackendService } from '../../services/funding-profile-backend.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';
import { FundingApplicationCoverInformation } from 'src/app/shared/models/funding-application-cover.model';
import { ApplicationNotificationService } from '../../services/application-notification.service';
import { AuthService } from 'src/app/auth/services/production.auth.service';

@Component({
  selector: 'app-opportunity-application-form',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    KapifyAIAnalysisComponent,
    OpportunitySelectorComponent,
    ApplicationFormComponent,
    ReviewSummaryComponent,
    OpportunitySidebarComponent,
  ],
  templateUrl: './new-funding-application.component.html',
  providers: [ApplicationFormService, ApplicationValidationService],
  styles: [
    `
      @keyframes fade-in {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-fade-in {
        animation: fade-in 0.5s ease-out;
      }

      * {
        transition-property: transform, box-shadow, background-color,
          border-color;
        transition-duration: 200ms;
        transition-timing-function: ease-out;
      }
    `,
  ],
})
export class OpportunityApplicationFormComponent implements OnInit, OnDestroy {
  // ===============================
  // SERVICES
  // ===============================

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private opportunitiesService = inject(SMEOpportunitiesService);
  private applicationService = inject(DatabaseApplicationService);
  private profileValidationService = inject(GlobalProfileValidationService);
  private fundingProfileService = inject(FundingProfileBackendService);
  private formService = inject(ApplicationFormService);
  private validationService = inject(ApplicationValidationService);
  private coverService = inject(FundingApplicationCoverService);
  private destroy$ = new Subject<void>();

  // ===============================
  // ICONS
  // ===============================

  ArrowLeftIcon = ArrowLeft;
  ClockIcon = Clock;

  // ===============================
  // STATE SIGNALS
  // ===============================

  currentStep = signal<ApplicationStepId>('select-opportunity');
  isLoading = signal(false);
  isSaving = signal(false);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  availableOpportunities = signal<FundingOpportunity[]>([]);
  selectedOpportunity = signal<FundingOpportunity | null>(null);
  draftApplication = signal<Application | null>(null);
  fullFundingProfile = signal<FundingApplicationProfile | undefined>(undefined);
  aiAnalysisResult = signal<any | null>(null);
  toastservice = inject(ToastService);
  private isCoverSelectionFlow = signal(false);
  opportunityIdFromRoute = signal<string | null>(null);
  defaultCover = signal<FundingApplicationCoverInformation | null>(null);

  // Track if defaultCover is loaded (async gate)
  private isCoverLoaded = signal(false);
  private notificationService = inject(ApplicationNotificationService);
  authService = inject(AuthService);
  // Auto-save
  private autoSaveTimeout: any = null;

  // ===============================
  // STEPS DEFINITION
  // ===============================

  steps = signal<ApplicationFormStep[]>([
    {
      id: 'select-opportunity',
      number: 1,
      title: 'Choose Opportunity',
      description: 'Select the funding opportunity',
    },
    {
      id: 'application-details',
      number: 2,
      title: 'Application Details',
      description: 'Provide application information',
    },
    {
      id: 'ai-analysis',
      number: 3,
      title: 'Analysis',
      description: 'Pre-Qualification insights',
    },
    {
      id: 'review-submit',
      number: 4,
      title: 'Review',
      description: 'Review and submission',
    },
  ]);

  // ===============================
  // COMPUTED SIGNALS
  // ===============================

  shouldSkipSelector = computed(() => {
    return !!this.opportunityIdFromRoute();
  });

  formData = this.formService.formData;

  profileCompletion = computed(() =>
    this.profileValidationService.completion()
  );

  canContinue = computed(() => {
    switch (this.currentStep()) {
      case 'select-opportunity':
        return !!this.selectedOpportunity();
      case 'application-details':
        if (this.isCoverSelectionFlow()) {
          return true;
        }
        return this.isFormValid();
      case 'ai-analysis':
        return true;
      case 'review-submit':
        return true;
      default:
        return false;
    }
  });

  applicationId = computed(() => {
    const draft = this.draftApplication();
    if (draft?.id) {
      return draft.id;
    }
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  });

  businessProfile = computed(() => {
    return this.fullFundingProfile();
  });

  // ===============================
  // LIFECYCLE
  // ===============================

  ngOnInit(): void {
    this.loadFullFundingProfile();

    // FIXED: Load cover first, then subscribe to route params
    this.loadDefaultCoverAndProceed().then(() => {
      // Now that cover is loaded, safe to load opportunity
      this.initializeFromRouteParams();
    });
  }

  /**
   * Extract route params and handle initialization
   */
  private initializeFromRouteParams(): void {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const opportunityId = params.get('opportunityId');
        const requestedAmount = params.get('requestedAmount');

        this.opportunityIdFromRoute.set(opportunityId);

        if (requestedAmount) {
          this.formService.prefillForm({ requestedAmount });
        }

        if (opportunityId) {
          // Cover is guaranteed loaded here
          this.loadSpecificOpportunity(opportunityId);
        } else {
          // console.log('📍 No opportunity ID in route, showing selector');
          this.loadAvailableOpportunities();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // DATA LOADING
  // ===============================

  /**
   * FIXED: Load cover and return Promise so ngOnInit can wait
   * Prevents duplicate loading and race conditions
   */
  private loadDefaultCoverAndProceed(): Promise<void> {
    return new Promise((resolve) => {
      this.coverService.loadDefaultCover().then((cover) => {
        if (!cover) {
          this.error.set('A funding request cover is required');
          this.isCoverLoaded.set(false);
          resolve();
          return;
        }

        this.defaultCover.set(cover);
        this.isCoverLoaded.set(true);

        resolve();
      });
    });
  }

  private loadFullFundingProfile(): void {
    this.fundingProfileService.loadSavedProfile().subscribe({
      next: (profile) => {
        this.fullFundingProfile.set(profile);
      },
      error: (error) => {
        console.warn('Funding profile not available:', error);
      },
    });
  }

  private loadAvailableOpportunities(): void {
    this.isLoading.set(true);
    this.opportunitiesService
      .loadActiveOpportunities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (opportunities) => {
          this.availableOpportunities.set(opportunities);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.error.set('Failed to load opportunities');
          this.isLoading.set(false);
        },
      });
  }

  /**
   * FIXED: Only proceeds AFTER cover is loaded (called from ngOnInit after promise resolves)
   */
  private loadSpecificOpportunity(opportunityId: string): void {
    this.isLoading.set(true);
    this.opportunitiesService
      .getOpportunityById(opportunityId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (opportunity) => {
          if (opportunity) {
            this.selectedOpportunity.set(opportunity);
            this.currentStep.set('application-details');
            this.createDraftApplication(opportunity);
            this.checkForDraftApplication();
          } else {
            this.error.set('Opportunity not found');
            this.opportunityIdFromRoute.set(null);
            this.loadAvailableOpportunities();
            this.currentStep.set('select-opportunity');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.error.set('Failed to load opportunity');
          this.isLoading.set(false);
          this.opportunityIdFromRoute.set(null);
          this.loadAvailableOpportunities();
          this.currentStep.set('select-opportunity');
          console.error('Load opportunity error:', error);
        },
      });
  }

  private checkForDraftApplication(): void {
    const opportunityId = this.opportunityIdFromRoute();
    if (!opportunityId) return;

    this.applicationService
      .getApplicationsByOpportunity(opportunityId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (applications) => {
          const draftApp = applications.find((app) => app.status === 'draft');
          if (draftApp) {
            this.draftApplication.set(draftApp);
            this.loadFromDraftApplication(draftApp);
          }
        },
        error: (error) => {
          console.error('Error checking for draft application:', error);
        },
      });
  }

  // ===============================
  // VALIDATION
  // ===============================

  private isFormValid(): boolean {
    const validation = this.validationService.validateForm(
      this.formData(),
      this.selectedOpportunity()
    );
    return validation.isValid;
  }

  // ===============================
  // EVENT HANDLERS
  // ===============================

  onOpportunitySelected(opportunity: FundingOpportunity): void {
    this.selectedOpportunity.set(opportunity);
    this.currentStep.set('application-details');
    this.createDraftApplication(opportunity);
  }

  onFormChanged(): void {
    this.isCoverSelectionFlow.set(true);

    this.saveDraft().then(() => {
      if (this.currentStep() === 'application-details') {
        this.currentStep.set('ai-analysis');
      }
    });
  }

  onAnalysisCompleted(result: any): void {
    console.log('✓ AI Analysis completed:', result);
    this.aiAnalysisResult.set(result);

    if (result.matchScore >= 85) {
      setTimeout(() => {
        if (this.currentStep() === 'ai-analysis') {
          this.nextStep();
        }
      }, 4000);
    }
  }

  onImprovementRequested(): void {
    console.log('User requested improvements');
    this.currentStep.set('application-details');
  }

  onProceedRequested(): void {
    console.log('User proceeding with application');
    this.nextStep();
  }

  // ===============================
  // NAVIGATION
  // ===============================

  nextStep(): void {
    const current = this.currentStep();

    if (current === 'application-details' && this.isFormValid()) {
      this.currentStep.set('ai-analysis');
      this.saveDraft();
    } else if (current === 'ai-analysis') {
      this.currentStep.set('review-submit');
      this.saveDraft();
    }
  }

  previousStep(): void {
    const current = this.currentStep();

    if (current === 'review-submit') {
      this.currentStep.set('ai-analysis');
    } else if (current === 'ai-analysis') {
      this.currentStep.set('application-details');
    } else if (current === 'application-details') {
      if (!this.shouldSkipSelector()) {
        this.currentStep.set('select-opportunity');
      }
    }
  }

  goToStep(stepId: ApplicationStepId): void {
    if (
      stepId === 'select-opportunity' ||
      (stepId === 'application-details' && this.selectedOpportunity()) ||
      (stepId === 'ai-analysis' &&
        this.selectedOpportunity() &&
        this.isFormValid()) ||
      (stepId === 'review-submit' &&
        this.selectedOpportunity() &&
        this.isFormValid())
    ) {
      this.currentStep.set(stepId);
    }
  }

  goBack(): void {
    this.location.back();
  }

  // ===============================
  // SAVE & SUBMIT
  // ===============================

  private logSubmitGuards(): void {
    const selectedOpportunity = this.selectedOpportunity();
    const isFormValid = this.isFormValid();
    const draftApplication = this.draftApplication();

    console.group('🚦 Submit guard diagnostics');
    console.log('selectedOpportunity():', selectedOpportunity);
    console.log('isFormValid():', isFormValid);
    console.log('draftApplication():', draftApplication);
    console.log('isCoverLoaded():', this.isCoverLoaded());
    console.groupEnd();
  }

  async submitApplication(): Promise<void> {
    this.logSubmitGuards();

    const draft = this.draftApplication();
    const opportunity = this.selectedOpportunity();

    if (
      !opportunity ||
      !draft ||
      !draft.fundingRequest ||
      !draft.requestedAmount
    ) {
      this.error.set('Application data is incomplete');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    try {
      // Step 1: Save draft
      await this.saveDraft();

      const currentDraft = this.draftApplication();
      if (!currentDraft) {
        throw new Error('Application could not be saved');
      }

      // Step 2: Submit application to database
      const submittedApplication = await this.applicationService
        .submitApplication(currentDraft.id)
        .toPromise();

      if (!submittedApplication) {
        throw new Error('Failed to submit application');
      }

      // Step 3: Get current user for email
      const currentUser = this.authService.user();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Step 4: Trigger notification service
      // This sends system message + SME email + funder notification
      try {
        const notificationResult =
          await this.notificationService.notifyApplicationSubmission({
            applicationId: submittedApplication.id,
            applicationTitle: submittedApplication.title,
            requestedAmount: submittedApplication.requestedAmount || 0,
            fundingType: opportunity.fundingType,
            opportunityId: opportunity.id,
            opportunityTitle: opportunity.title,
            smeUserId: currentUser.id,
            smeEmail: currentUser.email,
            smeCompanyName: currentUser.firstName || 'Your Company',
            funderId: opportunity.organizationId, // For funder email lookup
          });

        // Log notification results
        if (notificationResult.errors.length > 0) {
          console.warn(
            '⚠️ Some notifications failed:',
            notificationResult.errors
          );
          this.toastservice.warning(
            'Application submitted, but some notifications failed'
          );
        } else {
          this.toastservice.success('Application submitted successfully!');
        }
      } catch (notificationError) {
        // Non-critical: notifications failed but application was submitted
        console.error(
          '❌ Notification error (non-critical):',
          notificationError
        );
        this.toastservice.warning(
          'Application submitted, but notifications could not be sent'
        );
      }

      // Step 5: Navigate to success page
      this.router.navigate(['/applications/submitted'], {
        queryParams: {
          opportunityId: opportunity.id,
          applicationId: submittedApplication.id,
        },
      });
    } catch (error) {
      this.error.set(
        error instanceof Error ? error.message : 'Failed to submit application'
      );
      console.error('Submit application error:', error);
      this.toastservice.error('Failed to submit application');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // ===============================
  // UI HELPERS
  // ===============================

  getStepClasses(stepId: ApplicationStepId): string {
    const isActive = this.currentStep() === stepId;
    const stepIndex = this.steps().findIndex((s) => s.id === stepId);
    const currentIndex = this.steps().findIndex(
      (s) => s.id === this.currentStep()
    );
    const isCompleted = stepIndex < currentIndex;

    const baseClasses =
      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300';

    if (isCompleted) {
      return `${baseClasses} bg-green-600 text-white`;
    } else if (isActive) {
      return `${baseClasses} bg-teal-500 text-white`;
    } else {
      return `${baseClasses} bg-slate-100 text-slate-600`;
    }
  }

  getStepTextClasses(stepId: ApplicationStepId): string {
    const isActive = this.currentStep() === stepId;
    return isActive ? 'font-medium text-teal-600' : 'text-slate-600';
  }

  private loadFromDraftApplication(application: Application): void {
    if (!application.fundingRequest) {
      console.error('Draft application is missing fundingRequest');
      return;
    }

    this.defaultCover.set(application.fundingRequest);

    this.formService.prefillForm({
      requestedAmount: application.requestedAmount?.toString() || '',
      purposeStatement: application.purposeStatement || '',
      useOfFunds:
        typeof application.useOfFunds === 'string'
          ? application.useOfFunds
          : application.useOfFunds?.[0]?.description || '',
      fundingType: application.fundingType || '',
    });
  }

  /**
   * FIXED: Now safe because cover is guaranteed to be loaded
   */
  private createDraftApplication(opportunity: FundingOpportunity): void {
    const funderId = opportunity.organizationId;
    if (!funderId) {
      console.error(
        '❌ Cannot create application: opportunity.organizationId is missing'
      );
      this.error.set(
        'Opportunity is missing funder information. Please try again.'
      );
      return;
    }

    const cover = this.defaultCover();

    // ✅ Now cover WILL be available because we wait for isCoverLoaded
    if (!cover) {
      this.error.set(
        'A funding request cover is required to start an application'
      );
      return;
    }

    const applicationData = {
      title: `Application for ${opportunity.title}`,
      description: `Funding application for ${opportunity.fundingType} opportunity`,
      opportunityId: opportunity.id,
      funderId,
      formData: this.formService.getFormDataForSave(),
      fundingRequest: this.buildFundingRequestFromCover(cover),
    };

    this.applicationService
      .createApplication(applicationData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newApplication) => {
          this.draftApplication.set(newApplication);
          console.log('✓ Draft application created with funder_id:', funderId);
        },
        error: (error) => {
          console.error('Error creating draft application:', error);
          this.error.set(error?.message || 'Failed to create application');
        },
      });
  }

  private buildFundingRequestFromCover(
    cover: FundingApplicationCoverInformation
  ): FundingApplicationCoverInformation {
    return {
      ...cover,
      createdAt: cover.createdAt,
      updatedAt: cover.updatedAt,
    };
  }

  async saveDraft(): Promise<void> {
    if (!this.selectedOpportunity() || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);

    try {
      const draft = this.draftApplication();
      if (!draft) {
        throw new Error('No draft application available to save');
      }

      const cover = this.defaultCover();
      if (!cover) {
        throw new Error('Funding request is required');
      }

      const fundingRequest = this.buildFundingRequestFromCover(cover);
      const formData = this.formService.getFormDataForSave();

      const savePayload = {
        formData: {
          requestedAmount: Number(formData.requestedAmount) || 0,
          purposeStatement: formData.purposeStatement?.trim() || '',
          useOfFunds: formData.useOfFunds || [],
        },
        fundingRequest,
      };

      const updatedApplication = await this.applicationService
        .updateApplication(draft.id, savePayload)
        .toPromise();

      if (!updatedApplication) {
        throw new Error('Failed to update application draft');
      }

      this.draftApplication.set(updatedApplication);
    } catch (error: any) {
      console.error('saveDraft failed:', error);
      this.error.set(error.message || 'Failed to save draft');
      throw error;
    } finally {
      this.isSaving.set(false);
    }
  }
}
