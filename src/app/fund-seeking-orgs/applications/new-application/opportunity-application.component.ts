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
import { KapifyAIAnalysisComponent } from 'src/app/features/ai/ai-analysis/kapify-ai-analysis.component';
import { DatabaseApplicationService } from '../../services/database-application.service';
import { FundingProfileBackendService } from '../../services/funding-profile-backend.service';
import { ToastService } from 'src/app/shared/services/toast.service';

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
  templateUrl: './opportunity-application.component.html',
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

  // Track if opportunityId came from route params
  opportunityIdFromRoute = signal<string | null>(null);

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

  /**
   * Check if opportunityId is in route params (true value means skip selector)
   */
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

    // FIXED (correct - looks for query param)
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const opportunityId = params.get('opportunityId');
        // console.log('🚀 opportunityId from query:', opportunityId);

        // Store the route param value
        this.opportunityIdFromRoute.set(opportunityId);

        const requestedAmount =
          this.route.snapshot.queryParamMap.get('requestedAmount');

        // Pre-fill requested amount if passed
        if (requestedAmount) {
          this.formService.prefillForm({ requestedAmount });
        }

        if (opportunityId) {
          // Load specific opportunity and skip selector

          this.loadSpecificOpportunity(opportunityId);
        } else {
          // No opportunityId: show selector and load available opportunities
          console.log('📍 No opportunity ID in route, showing selector');
          this.loadAvailableOpportunities();
          this.checkForDraftApplication();
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

  private loadFullFundingProfile(): void {
    this.fundingProfileService.loadSavedProfile().subscribe({
      next: (profile) => {
        this.fullFundingProfile.set(profile);
        // console.log('✓ Funding profile loaded for AI analysis');
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
          // console.error('Load opportunities error:', error);
        },
      });
  }

  /**
   * Load specific opportunity when opportunityId is in route
   * Automatically skips selector and goes to application-details
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
            // Skip selector, go straight to application-details
            this.currentStep.set('application-details');
            this.createDraftApplication(opportunity);
            // Check for existing draft to load
            this.checkForDraftApplication();
          } else {
            this.error.set('Opportunity not found');
            // Fall back to selector
            this.opportunityIdFromRoute.set(null);
            this.loadAvailableOpportunities();
            this.currentStep.set('select-opportunity');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          this.error.set('Failed to load opportunity');
          this.isLoading.set(false);
          // Fall back to selector
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

  private createDraftApplication(opportunity: FundingOpportunity): void {
    const applicationData = {
      title: `Application for ${opportunity.title}`,
      description: `Funding application for ${opportunity.fundingType} opportunity`,
      opportunityId: opportunity.id,
      formData: this.formService.getFormDataForSave(),
    };

    this.applicationService
      .createApplication(applicationData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newApplication) => {
          this.draftApplication.set(newApplication);
          console.log('✓ Draft application created:', newApplication.id);
        },
        error: (error) => {
          console.error('Error creating draft application:', error);
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
    this.autoSaveDraft();
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
      // Don't go back to selector if opportunity came from route param
      if (!this.shouldSkipSelector()) {
        this.currentStep.set('select-opportunity');
      }
      // If opportunityId from route, stay on application details
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

  private autoSaveDraft(): void {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      this.saveDraft();
    }, 2000);
  }

  async saveDraft(): Promise<void> {
    if (!this.selectedOpportunity() || this.isSaving()) return;

    this.isSaving.set(true);
    this.error.set(null);

    try {
      const formData = this.formService.getFormDataForSave();
      const savePayload = {
        formData: {
          requestedAmount: parseFloat(formData.requestedAmount) || 0,
          purposeStatement: formData.purposeStatement,
          useOfFunds: formData.useOfFunds,
        },
      };

      if (this.draftApplication()) {
        const updatedApplication = await this.applicationService
          .updateApplication(this.draftApplication()!.id, savePayload)
          .toPromise();

        if (updatedApplication) {
          this.draftApplication.set(updatedApplication);
        }
      } else {
        const newApplication = await this.applicationService
          .createApplication({
            title: `Application for ${this.selectedOpportunity()!.title}`,
            description: `Funding application for ${
              this.selectedOpportunity()!.fundingType
            } opportunity`,
            opportunityId: this.selectedOpportunity()!.id,
            formData: savePayload.formData,
          })
          .toPromise();

        if (newApplication) {
          this.draftApplication.set(newApplication);
        }
      }

      // console.log('✓ Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
      this.error.set('Failed to save draft');
    } finally {
      this.isSaving.set(false);
    }
  }

  async submitApplication(): Promise<void> {
    if (
      !this.selectedOpportunity() ||
      !this.isFormValid() ||
      !this.draftApplication()
    ) {
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    try {
      await this.saveDraft();

      if (this.draftApplication()) {
        const submittedApplication = await this.applicationService
          .submitApplication(this.draftApplication()!.id)
          .toPromise();

        if (submittedApplication) {
          this.router.navigate(['/applications/submitted'], {
            queryParams: {
              opportunityId: this.selectedOpportunity()!.id,
              applicationId: submittedApplication.id,
            },
          });
        }
      }
    } catch (error) {
      this.error.set('Failed to submit application');
      console.error('Submit application error:', error);
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
}
