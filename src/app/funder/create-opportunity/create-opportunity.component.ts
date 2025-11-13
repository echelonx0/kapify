// src/app/funder/create-opportunity/create-opportunity.component.ts
import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Subject, takeUntil, Observable } from 'rxjs';
import {
  AlertCircleIcon,
  ArrowLeft,
  ArrowRight,
  Calculator,
  Check,
  ChevronDown,
  ClockIcon,
  Copy,
  DollarSign,
  Eye,
  FileText,
  HelpCircle,
  Lightbulb,
  LucideAngularModule,
  PieChart,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';
import { FundingOpportunityService } from '../../funding/services/funding-opportunity.service';
import { ModalService } from '../../shared/services/modal.service';
import { OpportunityFormStateService } from '../services/opportunity-form-state.service';
import {
  FundingOpportunity,
  OpportunityFormData,
} from './shared/funding.interfaces';
import { OrganizationStateService } from '../services/organization-state.service';
import { StepNavigationService } from './step-navigation.service';
import { OpportunityUIHelperService } from '../services/ui-helper.service';
import { OpportunityBasicsComponent } from './steps/basic.component';
import { EligibilityFiltersComponent } from './steps/eligibility-terms/eligibility.component';
import { MediaBrandingComponent } from './steps/media.component';
import { ApplicationSettingsComponent } from './steps/fund-terms/fund-terms.component';
import { FundingStructureComponent } from './steps/fund-structure/fund-structure.component';
import { SectorValidationModalComponent } from './components/sector-validation-modal.component';
import { OpportunityStepsNavigationComponent } from './components/steps-navigation-component';

import { ActionModalService } from 'src/app/shared/components/modal/modal.service';
import { OpportunityFormActionsComponent } from './shared/opportunity-form-actions.component';

@Component({
  selector: 'app-opportunity-form',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    LucideAngularModule,
    OpportunityBasicsComponent,
    MediaBrandingComponent,
    FundingStructureComponent,
    EligibilityFiltersComponent,
    ApplicationSettingsComponent,
    OpportunityStepsNavigationComponent,
    SectorValidationModalComponent,
    OpportunityFormActionsComponent,
  ],
  animations: [
    trigger('stepTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate(
          '250ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({ opacity: 0, transform: 'translateX(-20px)' })
        ),
      ]),
    ]),
  ],
  templateUrl: 'create-opportunity.component.html',
})
export class CreateOpportunityComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private opportunityService = inject(FundingOpportunityService);
  private modalService = inject(ModalService);
  private actionModalService = inject(ActionModalService);
  public formState = inject(OpportunityFormStateService);
  public stepNavigation = inject(StepNavigationService);
  public ui = inject(OpportunityUIHelperService);
  public organizationState = inject(OrganizationStateService);

  // Component state
  mode = signal<'create' | 'edit'>('create');
  opportunityId = signal<string | null>(null);
  isLoading = signal(false);
  publishError = signal<string | null>(null);

  showSectorModal = this.modalService.showSectorValidationModal;

  get isSaving() {
    return this.opportunityService.isSaving;
  }
  get isPublishing() {
    return this.opportunityService.isPublishing;
  }
  get lastSavedAt() {
    return this.opportunityService.lastSavedAt;
  }
  get overallCompletion() {
    return this.opportunityService.overallCompletion;
  }

  // Icons
  ArrowLeftIcon = ArrowLeft;
  TargetIcon = Target;
  DollarSignIcon = DollarSign;
  UsersIcon = Users;
  SettingsIcon = Settings;
  FileTextIcon = FileText;
  CheckIcon = Check;
  EyeIcon = Eye;
  HelpCircleIcon = HelpCircle;
  LightbulbIcon = Lightbulb;
  TrendingUpIcon = TrendingUp;
  CopyIcon = Copy;
  CalculatorIcon = Calculator;
  SparklesIcon = Sparkles;
  SaveIcon = Save;
  ArrowRightIcon = ArrowRight;
  PieChartIcon = PieChart;
  RefreshCwIcon = RefreshCw;
  ClockIcon = ClockIcon;
  AlertCircleIcon = AlertCircleIcon;
  ShieldIcon = Shield;
  ChevronDownIcon = ChevronDown;
  XCircleIcon = XCircle;

  constructor() {
    this.initializeEffects();
  }

  ngOnInit() {
    console.log('=== CREATE OPPORTUNITY COMPONENT INIT ===');

    this.detectMode();
    console.log(
      'Form Data Current formState.formData:',
      this.formState.formData()
    );
    console.log('Form Data Individual fields:', {
      ...this.formState.formData(),
    });

    if (this.mode() === 'create' && !this.modalService.hasSectorValidation()) {
      this.modalService.openSectorValidation();
      return;
    }

    this.organizationState.loadOrganizationData();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.formState.destroy();
    this.organizationState.destroy();
  }

  private initializeEffects() {
    effect(() => {
      const data = this.formState.formData();
      const orgId = this.organizationState.organizationId();
      this.formState.validateForm(orgId);
    });
  }

  private setupSubscriptions() {
    this.organizationState.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        if (state?.organization?.id) {
          this.loadFormDataAfterOrgLoad();
        }
      });
  }

  onSectorValidationComplete() {
    this.modalService.closeSectorValidation();
    this.organizationState.loadOrganizationData();
    this.setupSubscriptions();
  }

  private loadFormDataAfterOrgLoad() {
    if (this.mode() === 'edit') {
      this.loadOpportunityForEdit();
    } else {
      this.loadDraftWithMerge();
    }
  }

  private detectMode() {
    const url = this.router.url;
    const routeParams = this.route.snapshot.params;

    if (url.includes('/edit') && routeParams['id']) {
      this.mode.set('edit');
      this.opportunityId.set(routeParams['id']);
    } else {
      this.mode.set('create');
      this.opportunityId.set(null);
    }
  }

  private loadDraftWithMerge() {
    this.isLoading.set(true);

    this.opportunityService
      .loadDraftWithMerge()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.draftData) {
            console.log('Loaded response Draft Data:', response.draftData);
            console.log(
              'Draft Data Description in response?',
              !!response.draftData?.description
            );
            this.formState.loadFromDraft(response.draftData);
            console.log('Draft Data', response.draftData);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load draft:', error);
          this.isLoading.set(false);
        },
      });
  }

  private loadOpportunityForEdit() {
    const oppId = this.opportunityId();
    if (!oppId) {
      this.router.navigate(['/funding/create-opportunity']);
      return;
    }
    this.isLoading.set(true);

    this.opportunityService
      .loadOpportunityForEdit(oppId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.draftData) {
            this.formState.loadFromDraft(response.draftData);
            console.log('Draft Data', response.draftData);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load opportunity for editing:', error);
          this.isLoading.set(false);
          this.router.navigate(['/funding/opportunities']);
        },
      });
  }

  publishOpportunity() {
    console.log('=== PUBLISHING OPPORTUNITY ===');
    this.publishError.set(null);
    if (this.mode() === 'edit') {
      this.updateOpportunity();
    } else {
      this.publish();
    }
  }

  private buildOpportunityData(): Observable<Partial<FundingOpportunity>> {
    return new Observable((observer) => {
      try {
        const orgId = this.organizationState.organizationId();
        const data = this.formState.formData();

        if (!orgId) {
          observer.error(new Error('Organization ID is required'));
          return;
        }

        const validationError = this.validateRequiredFields(data);
        if (validationError) {
          observer.error(new Error(validationError));
          return;
        }

        // ===== INVESTMENT BOUNDS VALIDATION =====
        const typicalInv =
          this.formState.parseNumberValue(data.typicalInvestment) || 1;
        const minInv = this.formState.parseNumberValue(data.minInvestment) || 1;
        const maxInv =
          this.formState.parseNumberValue(data.maxInvestment) || typicalInv;

        // Ensure: min ≤ typical ≤ max, all > 0
        const validatedMinInv = Math.max(1, minInv);
        const validatedMaxInv = Math.max(validatedMinInv, maxInv);
        const validatedTypicalInv = Math.max(
          validatedMinInv,
          Math.min(typicalInv, validatedMaxInv)
        );

        const opportunityData: Partial<FundingOpportunity> = {
          title: data.title.trim(),
          description: data.description.trim(),
          shortDescription: data.shortDescription.trim(),

          fundingOpportunityImageUrl:
            data.fundingOpportunityImageUrl?.trim() || undefined,
          fundingOpportunityVideoUrl:
            data.fundingOpportunityVideoUrl?.trim() || undefined,
          funderOrganizationName:
            data.funderOrganizationName?.trim() || undefined,
          funderOrganizationLogoUrl:
            data.funderOrganizationLogoUrl?.trim() || undefined,

          fundId: orgId,
          organizationId: orgId,

          // Investment amounts with validated bounds
          offerAmount: validatedMaxInv,
          minInvestment: validatedMinInv,
          maxInvestment: validatedMaxInv,
          totalAvailable: validatedTypicalInv,

          investmentCriteria:
            data.investmentCriteria?.length > 0
              ? data.investmentCriteria
              : undefined,
          exclusionCriteria:
            data.exclusionCriteria?.length > 0
              ? data.exclusionCriteria
              : undefined,
          currency: data.currency,
          fundingType: data.fundingType as any,
          interestRate: data.interestRate
            ? Number(data.interestRate)
            : undefined,
          equityOffered: data.equityOffered
            ? Number(data.equityOffered)
            : undefined,
          repaymentTerms: data.repaymentTerms?.trim() || undefined,
          securityRequired: data.securityRequired?.trim() || undefined,
          useOfFunds: data.useOfFunds?.trim(),
          investmentStructure: data.investmentStructure?.trim(),
          expectedReturns: data.expectedReturns
            ? Number(data.expectedReturns)
            : undefined,
          investmentHorizon: data.investmentHorizon
            ? Number(data.investmentHorizon)
            : undefined,
          exitStrategy: data.exitStrategy?.trim() || undefined,
          applicationDeadline: data.applicationDeadline
            ? new Date(data.applicationDeadline)
            : undefined,
          decisionTimeframe: Math.max(1, Number(data.decisionTimeframe) || 30),

          maxApplications: data.maxApplications
            ? Math.max(1, this.formState.parseNumberValue(data.maxApplications))
            : undefined,

          eligibilityCriteria: {
            industries: data.targetIndustries || [],
            businessStages: data.businessStages || [],
            minRevenue: data.minRevenue
              ? Math.max(0, this.formState.parseNumberValue(data.minRevenue))
              : undefined,
            maxRevenue: data.maxRevenue
              ? Math.max(0, this.formState.parseNumberValue(data.maxRevenue))
              : undefined,
            minYearsOperation: data.minYearsOperation
              ? Math.max(0, Number(data.minYearsOperation))
              : undefined,
            geographicRestrictions:
              data.geographicRestrictions?.length > 0
                ? data.geographicRestrictions
                : undefined,
            requiresCollateral: data.requiresCollateral,
            // excludeCriteria: [],
            // funderDefinedCriteria: [data.investmentCriteria || undefined],
          },

          autoMatch: data.autoMatch,
          status: 'draft',

          currentApplications: 0,
          viewCount: 0,
          applicationCount: 0,
        };

        observer.next(opportunityData);
        observer.complete();
      } catch (error: any) {
        observer.error(
          new Error(
            `Failed to prepare opportunity data: ${
              error.message || 'Unknown error'
            }`
          )
        );
      }
    });
  }
  private validateRequiredFields(data: OpportunityFormData): string | null {
    if (!data.title.trim()) return 'Opportunity title is required.';

    if (!data.description.trim()) return 'Full description is required.';
    if (!data.fundingType) return 'Funding type must be selected.';
    if (
      !data.typicalInvestment ||
      this.formState.parseNumberValue(data.typicalInvestment) <= 0
    ) {
      return 'Typical investment must be specified and greater than zero.';
    }
    if (!data.decisionTimeframe) return 'Decision timeframe must be specified.';
    return null;
  }

  canPublish(): boolean {
    if (this.mode() === 'edit') return true;
    if (!this.organizationState.canPublishOpportunity()) return false;

    const criticalErrors = this.formState
      .validationErrors()
      .filter((error) => error.type === 'error');
    if (criticalErrors.length > 0) return false;

    const data = this.formState.formData();
    return !!(
      data.title.trim() &&
      data.description.trim() &&
      data.fundingType &&
      data.typicalInvestment &&
      data.maxInvestment &&
      data.decisionTimeframe
    );
  }

  publish(): void {
    console.log('=== PUBLISH FLOW START ===');

    if (!this.canPublish()) {
      console.warn(
        '⚠️ Cannot publish: Validation failed or missing organization'
      );
      return;
    }

    const data = this.formState.formData();
    const title = data.title;
    const orgId = this.organizationState.organizationId();

    if (!orgId) {
      this.publishError.set(
        'Organization ID is missing. Please complete your organization setup.'
      );
      return;
    }

    console.log('✅ Pre-publish validation passed');
    this.buildOpportunityData().subscribe({
      next: (opportunityData) => {
        console.log('✅ Opportunity data built successfully');

        this.opportunityService.publishOpportunity(opportunityData).subscribe({
          next: (response) => {
            console.log('✅ PUBLISH SUCCESSFUL:', response);
            this.clearDraft();

            this.opportunityId.set(response.opportunityId);

            // Show success modal via service
            this.actionModalService.showPublishSuccess(title);

            // Set callbacks
            this.actionModalService.open(
              {
                actionType: 'publish-success',
                opportunityTitle: title,
              },
              {
                onSuccess: () => {
                  console.log(
                    'Success callback: navigating to published opportunity'
                  );
                  this.router.navigate([
                    '/funder/opportunities',
                    response.opportunityId,
                  ]);
                },
              }
            );
          },
          error: (error) => {
            console.error('❌ PUBLISH FAILED:', error);

            const errorMessage = this.extractErrorMessage(error);
            console.error('Error message for user:', errorMessage);

            // Show error modal via service
            this.actionModalService.showPublishError(title, errorMessage);
            this.publishError.set(errorMessage);
          },
        });
      },
      error: (error) => {
        console.error('❌ Failed to build opportunity data:', error);

        const errorMessage = this.extractErrorMessage(error);
        this.publishError.set(errorMessage);

        // Show error modal via service
        this.actionModalService.showPublishError(
          'Cannot publish',
          `Failed to prepare opportunity: ${errorMessage}`
        );
      },
    });
  }

  private extractErrorMessage(error: any): string {
    console.log('Extracting error message from:', error);
    if (error?.error?.message) {
      console.log('Found error.error.message:', error.error.message);
      return error.error.message;
    }
    if (error?.message) {
      console.log('Found error.message:', error.message);
      return error.message;
    }
    if (error?.details) {
      console.log('Found error.details:', error.details);
      return error.details;
    }
    if (error?.hint) {
      console.log('Found error.hint:', error.hint);
      return `${error.hint} Please check your data and try again.`;
    }
    if (error?.code) {
      console.log('Found error.code:', error.code);

      const errorCodeMap: { [key: string]: string } = {
        PGRST: 'Database connection error. Please try again.',
        '23505':
          'This opportunity already exists. Please use a different title.',
        '23503': 'Referenced organization or fund not found.',
        '42601': 'Invalid data format. Please review your inputs.',
        '42883': 'Database configuration error. Please contact support.',
      };

      for (const [code, message] of Object.entries(errorCodeMap)) {
        if (error.code.includes(code)) {
          return message;
        }
      }

      return `Error code ${error.code}: Unable to publish. Please try again.`;
    }
    return 'An unexpected error occurred while publishing your opportunity. Please try again or contact support.';
  }

  saveDraft(): void {
    const data = this.formState.formData();
    this.buildOpportunityData().subscribe({
      next: (opportunityData) => {
        this.opportunityService.saveDraft(opportunityData).subscribe({
          next: (response) => {
            console.log('✅ Draft saved:', response);
            this.publishError.set(null);
          },
          error: (error) => {
            console.error('❌ Failed to save draft:', error);
            this.publishError.set(error.message || 'Failed to save draft');
          },
        });
      },
      error: (error) => {
        console.error('❌ Failed to build opportunity data:', error);
        this.publishError.set(error.message || 'Failed to prepare data');
      },
    });
  }

  updateOpportunity(): void {
    if (!this.opportunityId()) {
      console.error('No opportunity ID found for update');
      return;
    }
    const data = this.formState.formData();
    const title = data.title;
    const opportunityId = this.opportunityId()!;

    this.buildOpportunityData().subscribe({
      next: (opportunityData) => {
        this.opportunityService
          .updateOpportunity(opportunityId, opportunityData)
          .subscribe({
            next: (response) => {
              console.log('✅ Opportunity updated:', response);

              // Show success modal via service
              this.actionModalService.showPublishSuccess(title);

              this.actionModalService.open(
                {
                  actionType: 'publish-success',
                  opportunityTitle: title,
                },
                {
                  onSuccess: () => {
                    this.router.navigate([
                      '/funder/opportunities',
                      opportunityId,
                    ]);
                  },
                }
              );
            },
            error: (error) => {
              console.error('❌ Failed to update opportunity:', error);

              const errorMessage = this.extractErrorMessage(error);

              // Show error modal via service
              this.actionModalService.showPublishError(title, errorMessage);
              this.publishError.set(errorMessage);
            },
          });
      },
    });
  }

  clearErrors(): void {
    this.publishError.set(null);
    this.organizationState.clearOrganizationError();
    this.formState.validationErrors.set([]);
  }

  retryPublish(): void {
    console.log('Retrying publish...');
    this.clearErrors();
    this.publish();
  }

  goBack() {
    this.location.back();
  }
  goToOrganizationSetup() {
    this.router.navigate(['/funder/onboarding']);
  }
  retryLoadOrganization() {
    this.organizationState.retryLoadOrganization();
  }
  isEditMode(): boolean {
    return this.mode() === 'edit';
  }
  isCreateMode(): boolean {
    return this.mode() === 'create';
  }
  nextStep() {
    this.stepNavigation.nextStep();
  }
  previousStep() {
    this.stepNavigation.previousStep();
  }
  goToStep(stepId: 'basic' | 'terms' | 'eligibility' | 'settings' | 'review') {
    this.stepNavigation.goToStep(stepId);
  }
  updateField(field: keyof OpportunityFormData, event: Event) {
    this.ui.onFieldChange(field, event);
  }
  updateCheckboxField(field: keyof OpportunityFormData, event: Event) {
    this.ui.onCheckboxChange(field, event);
  }
  updateMultiSelectField(field: keyof OpportunityFormData, event: Event) {
    this.ui.onMultiSelectChange(field, event);
  }
  onNumberInput(field: keyof OpportunityFormData, event: Event) {
    this.ui.onNumberInputChange(field, event);
  }
  get formData() {
    return this.formState.formData;
  }
  get validationErrors() {
    return this.formState.validationErrors;
  }
  get currentStep() {
    return this.stepNavigation.currentStep;
  }
  get currentStepErrors() {
    return this.stepNavigation.currentStepErrors;
  }
  get hasCurrentStepErrors() {
    return this.stepNavigation.hasCurrentStepErrors;
  }
  get steps() {
    return this.stepNavigation.steps;
  }
  get progressPercentage() {
    return this.stepNavigation.progressPercentage;
  }
  get canContinue() {
    return this.stepNavigation.canContinue;
  }
  get organizationLoading() {
    return this.organizationState.organizationLoading;
  }
  get organizationError() {
    return this.organizationState.organizationError;
  }
  get organizationId() {
    return this.organizationState.organizationId;
  }
  get canProceed() {
    return this.organizationState.canProceed;
  }
  getFieldClasses(fieldName: string) {
    return this.ui.getFieldClasses(fieldName);
  }
  showDatabaseSaveStatus() {
    return this.ui.showDatabaseSaveStatus();
  }
  showLocalSaveStatus() {
    return this.ui.showLocalSaveStatus();
  }
  showUnsavedIndicator() {
    return this.ui.showUnsavedIndicator();
  }
  getLastSavedText() {
    return this.ui.getLastSavedText();
  }
  getLocalSaveText() {
    return this.ui.getLocalSaveText();
  }
  getPageTitle() {
    return this.ui.getPageTitle(this.isEditMode());
  }
  getPageSubtitle() {
    return this.ui.getPageSubtitle(this.isEditMode());
  }
  getPublishButtonText() {
    return this.ui.getPublishButtonText(this.isEditMode());
  }
  getSaveButtonText() {
    return this.ui.getSaveButtonText(this.isEditMode());
  }
  getCurrentStepIcon() {
    return this.ui.getCurrentStepIcon();
  }
  getCurrentStepTitle() {
    return this.ui.getCurrentStepTitle();
  }
  getCurrentStepSubtitle() {
    return this.stepNavigation.getCurrentStepSubtitle(
      this.organizationLoading(),
      this.organizationError()
    );
  }
  formatNumberWithCommas(value: string | number) {
    return this.ui.formatNumberWithCommas(value);
  }
  getFormattedAmount(field: keyof OpportunityFormData) {
    return this.ui.getFormattedAmount(field);
  }
  getCompletionPercentage() {
    return this.ui.getCompletionPercentage();
  }
  getCurrentStepIndex() {
    return this.stepNavigation.currentStepIndex();
  }
  isStepCompleted(stepId: string) {
    return this.stepNavigation.isStepCompleted(stepId);
  }
  hasMediaContent() {
    return this.formState.hasMediaContent();
  }
  onImageError(field: keyof OpportunityFormData) {
    this.ui.onImageError(field);
  }
  clearDraft() {
    this.formState.clearDraft();
  }
  getFieldError(fieldName: string) {
    return this.formState.getFieldError(fieldName);
  }
  hasFieldError(fieldName: string) {
    return this.formState.hasFieldError(fieldName);
  }
  hasFieldWarning(fieldName: string) {
    return this.formState.hasFieldWarning(fieldName);
  }
  get timeframes() {
    return this.ui.timeframes;
  }
  get targetIndustries() {
    return this.ui.targetIndustries;
  }
  get businessStages() {
    return this.ui.businessStages;
  }
  isFirstStep(): boolean {
    return this.currentStep() === 'basic';
  }

  isReviewStep(): boolean {
    return this.currentStep() === 'review';
  }
}
