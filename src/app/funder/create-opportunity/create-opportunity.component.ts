// src/app/funder/create-opportunity/create-opportunity.component.ts
import { Component, inject, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Subject, takeUntil, switchMap, Observable } from 'rxjs';
import { 
  AlertCircleIcon, ArrowLeft, ArrowRight, Calculator, Check, ChevronDown, 
  ClockIcon, Copy, DollarSign, Eye, FileText, HelpCircle, Lightbulb, 
  LucideAngularModule, PieChart, RefreshCw, Save, Settings, Shield, 
  Sparkles, Target, TrendingUp, Users, XCircle 
} from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';

// Services 
import { FundingOpportunityService } from '../../funding/services/funding-opportunity.service';
import { FundingOpportunity } from '../../shared/models/funder.models';
import { ModalService } from '../../shared/services/modal.service';
// Components 
import { OpportunityFormStateService } from '../services/opportunity-form-state.service';
import { OpportunityFormData } from './shared/form-interfaces';
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
    SectorValidationModalComponent
  ],
  animations: [
    trigger('stepTransition', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' }))
      ])
    ])
  ],
  templateUrl: 'create-opportunity.component.html'
})
export class CreateOpportunityComponent implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private opportunityService = inject(FundingOpportunityService);
  private modalService = inject(ModalService);

  // Injected services
  public formState = inject(OpportunityFormStateService);
  public stepNavigation = inject(StepNavigationService);
  public ui = inject(OpportunityUIHelperService);
  public organizationState = inject(OrganizationStateService);

  // Component-specific state
  mode = signal<'create' | 'edit'>('create');
  opportunityId = signal<string | null>(null);
  isLoading = signal(false);
  publishError = signal<string | null>(null);

  // Modal state
  showSectorModal = this.modalService.showSectorValidationModal;

  // Service state getters
  get isSaving() { return this.opportunityService.isSaving; }
  get isPublishing() { return this.opportunityService.isPublishing; }
  get lastSavedAt() { return this.opportunityService.lastSavedAt; }
  get overallCompletion() { return this.opportunityService.overallCompletion; }

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
    
    // Check sector validation first (only in create mode)
    this.detectMode();
    
    if (this.mode() === 'create' && !this.modalService.hasSectorValidation()) {
      this.modalService.openSectorValidation();
      // Don't proceed with loading until validation is complete
      return;
    }
   
    // Load organization data
    this.organizationState.loadOrganizationData();
    
    // Setup subscriptions to wait for organization data
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.formState.destroy();
    this.organizationState.destroy();
  }

  // Initialize reactive effects
  private initializeEffects() {
    effect(() => {
      const data = this.formState.formData();
      const orgId = this.organizationState.organizationId();
      this.formState.validateForm(orgId);
    });
  }

  // Setup subscriptions for organization state changes
  private setupSubscriptions() {
    this.organizationState.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state?.organization?.id) {
          this.loadFormDataAfterOrgLoad();
        }
      });
  }

  // Handle sector validation completion
  onSectorValidationComplete() {
    this.modalService.closeSectorValidation();
    this.organizationState.loadOrganizationData();
    this.setupSubscriptions();
  }

  // Load form data after organization is available
  private loadFormDataAfterOrgLoad() {
    if (this.mode() === 'edit') {
      this.loadOpportunityForEdit();
    } else {
      this.loadDraftWithMerge();
    }
  }

  // Mode detection
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

  // Form data loading
  private loadDraftWithMerge() {
    this.isLoading.set(true);
    
    this.opportunityService.loadDraftWithMerge()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.draftData) {
            this.formState.loadFromDraft(response.draftData);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load draft:', error);
          this.isLoading.set(false);
        }
      });
  }

  private loadOpportunityForEdit() {
    const oppId = this.opportunityId();
    if (!oppId) {
      this.router.navigate(['/funding/create-opportunity']);
      return;
    }

    this.isLoading.set(true);
    
    this.opportunityService.loadOpportunityForEdit(oppId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.draftData) {
            this.formState.loadFromDraft(response.draftData);
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load opportunity for editing:', error);
          this.isLoading.set(false);
          this.router.navigate(['/funding/opportunities']);
        }
      });
  }

  // Publishing and saving
  publishOpportunity() {
    console.log('=== PUBLISHING OPPORTUNITY ===');
    this.publishError.set(null);

    if (this.mode() === 'edit') {
      this.saveDraft();
      return;
    }

    this.buildOpportunityData()
      .pipe(
        switchMap(opportunityData => {
          return this.opportunityService.publishOpportunity(opportunityData);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          console.log('Opportunity published successfully:', response);
          this.publishError.set(null);
          this.formState.clearLocalStorage();
          this.router.navigate(['/funder/dashboard']);
        },
        error: (error) => {
          console.error('Failed to publish opportunity:', error);
          
          let errorMessage = 'Failed to publish opportunity. Please try again.';
          if (error.message && error.message.includes('organization')) {
            errorMessage = error.message;
          }
          
          this.publishError.set(errorMessage);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
  }

  saveDraft() {
    this.publishError.set(null);
    
    const orgId = this.organizationState.organizationId();
    if (!orgId) {
      this.publishError.set('No organization found. Please complete your organization setup first.');
      return;
    }

    this.buildOpportunityData()
      .pipe(
        switchMap(opportunityData => {
          if (this.mode() === 'edit') {
            const oppId = this.opportunityId();
            if (!oppId) {
              throw new Error('No opportunity ID found for editing.');
            }
            return this.opportunityService.updateOpportunity(oppId, opportunityData);
          } else {
            return this.opportunityService.saveDraft(opportunityData, false);
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          console.log('Draft saved successfully');
          this.formState.hasUnsavedChanges.set(false);
          this.formState.clearLocalStorage();
          this.publishError.set(null);
        },
        error: (error) => {
          console.error('Failed to save draft:', error);
          this.publishError.set('Failed to save draft. Please try again.');
        }
      });
  }

  // Build opportunity data for API
// In create-opportunity.component.ts - buildOpportunityData() method

private buildOpportunityData(): Observable<Partial<FundingOpportunity>> {
  return new Observable(observer => {
    try {
      const data = this.formState.formData();
      const orgId = this.organizationState.organizationId();
      
      if (!orgId) {
        observer.error(new Error('No organization found. Please complete your organization setup before creating opportunities.'));
        return;
      }

      const validationError = this.validateRequiredFields(data);
      if (validationError) {
        observer.error(new Error(validationError));
        return;
      }

      // Build opportunity data—maps flat form fields to nested DB structure
      const opportunityData: Partial<FundingOpportunity> = {
        // Basic Info
        title: data.title.trim(),
        description: data.description.trim(),
        shortDescription: data.shortDescription.trim(),
        
        // Media & Branding
        fundingOpportunityImageUrl: data.fundingOpportunityImageUrl?.trim() || undefined,
        fundingOpportunityVideoUrl: data.fundingOpportunityVideoUrl?.trim() || undefined,
        funderOrganizationName: data.funderOrganizationName?.trim() || undefined,
        funderOrganizationLogoUrl: data.funderOrganizationLogoUrl?.trim() || undefined,
        
        // Organization & Fund
        fundId: orgId,
        organizationId: orgId,
        
        // Funding Terms
        offerAmount: Math.max(0, this.formState.parseNumberValue(data.offerAmount)),
        minInvestment: this.formState.parseNumberValue(data.minInvestment) || undefined,
        maxInvestment: this.formState.parseNumberValue(data.maxInvestment) || undefined,
        currency: data.currency,
        fundingType: data.fundingType as any,
        interestRate: data.interestRate ? Number(data.interestRate) : undefined,
        equityOffered: data.equityOffered ? Number(data.equityOffered) : undefined,
        repaymentTerms: data.repaymentTerms?.trim() || undefined,
        securityRequired: data.securityRequired?.trim() || undefined,
        useOfFunds: data.useOfFunds?.trim(),
        investmentStructure: data.investmentStructure?.trim(),
        expectedReturns: data.expectedReturns ? Number(data.expectedReturns) : undefined,
        investmentHorizon: data.investmentHorizon ? Number(data.investmentHorizon) : undefined,
        exitStrategy: data.exitStrategy?.trim() || undefined,
        applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
        decisionTimeframe: Math.max(1, Number(data.decisionTimeframe) || 30),
        
        // Availability
        totalAvailable: Math.max(0, this.formState.parseNumberValue(data.totalAvailable)),
        maxApplications: data.maxApplications ? Math.max(1, this.formState.parseNumberValue(data.maxApplications)) : undefined,
        
        // Eligibility Criteria (maps to DB eligibility_criteria JSONB)
        eligibilityCriteria: {
          industries: data.targetIndustries || [],
          businessStages: data.businessStages || [],
          minRevenue: data.minRevenue ? Math.max(0, this.formState.parseNumberValue(data.minRevenue)) : undefined,
          maxRevenue: data.maxRevenue ? Math.max(0, this.formState.parseNumberValue(data.maxRevenue)) : undefined,
          minYearsOperation: data.minYearsOperation ? Math.max(0, Number(data.minYearsOperation)) : undefined,
          geographicRestrictions: data.geographicRestrictions?.length > 0 ? data.geographicRestrictions : undefined,
          requiresCollateral: data.requiresCollateral,
          excludeCriteria: [],
          funderDefinedCriteria: data.investmentCriteria?.trim() || undefined
        },
        
        // Settings
        autoMatch: data.autoMatch,
        status: 'draft',
        
        // Computed fields (will be set by backend)
        currentApplications: 0,
        viewCount: 0,
        applicationCount: 0
      };

      observer.next(opportunityData);
      observer.complete();
    } catch (error: any) {
      observer.error(new Error(`Failed to prepare opportunity data: ${error.message || 'Unknown error'}`));
    }
  });
}

  private validateRequiredFields(data: OpportunityFormData): string | null {
    if (!data.title.trim()) return 'Opportunity title is required.';
    if (!data.shortDescription.trim()) return 'Short description is required.';
    if (!data.description.trim()) return 'Full description is required.';
    if (!data.fundingType) return 'Funding type must be selected.';
    if (!data.totalAvailable || this.formState.parseNumberValue(data.totalAvailable) <= 0) {
      return 'Total available funding must be specified and greater than zero.';
    }
    if (!data.offerAmount || this.formState.parseNumberValue(data.offerAmount) <= 0) {
      return 'Typical investment amount must be specified and greater than zero.';
    }
    if (!data.decisionTimeframe) return 'Decision timeframe must be specified.';
    return null;
  }

  // Publishing validation
  canPublish(): boolean {
    if (this.mode() === 'edit') return true;
    if (!this.organizationState.canPublishOpportunity()) return false;
    
    const criticalErrors = this.formState.validationErrors().filter(error => error.type === 'error');
    if (criticalErrors.length > 0) return false;
    
    const data = this.formState.formData();
    return !!(
      data.title.trim() && 
      data.shortDescription.trim() && 
      data.description.trim() &&
      data.fundingType &&
      data.totalAvailable &&
      data.offerAmount &&
      data.decisionTimeframe
    );
  }

  // Navigation
  goBack() { this.location.back(); }
  goToOrganizationSetup() { this.router.navigate(['/funder/onboarding']); }
  isEditMode(): boolean { return this.mode() === 'edit'; }
  isCreateMode(): boolean { return this.mode() === 'create'; }

  // Error management
  clearErrors(): void {
    this.publishError.set(null);
    this.organizationState.clearOrganizationError();
    this.formState.validationErrors.set([]);
  }

  // Step navigation
  nextStep() { this.stepNavigation.nextStep(); }
  previousStep() { this.stepNavigation.previousStep(); }
  goToStep(stepId: 'basic' | 'terms' | 'eligibility' | 'settings' | 'review') {
    this.stepNavigation.goToStep(stepId);
  }

  // Form interactions
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

  // Getters for template
  get formData() { return this.formState.formData; }
  get validationErrors() { return this.formState.validationErrors; }
  get currentStep() { return this.stepNavigation.currentStep; }
  get currentStepErrors() { return this.stepNavigation.currentStepErrors; }
  get hasCurrentStepErrors() { return this.stepNavigation.hasCurrentStepErrors; }
  get steps() { return this.stepNavigation.steps; }
  get progressPercentage() { return this.stepNavigation.progressPercentage; }
  get canContinue() { return this.stepNavigation.canContinue; }
  get organizationLoading() { return this.organizationState.organizationLoading; }
  get organizationError() { return this.organizationState.organizationError; }
  get organizationId() { return this.organizationState.organizationId; }
  get canProceed() { return this.organizationState.canProceed; }

  // UI helpers
  getFieldClasses(fieldName: string) { return this.ui.getFieldClasses(fieldName); }
  showDatabaseSaveStatus() { return this.ui.showDatabaseSaveStatus(); }
  showLocalSaveStatus() { return this.ui.showLocalSaveStatus(); }
  showUnsavedIndicator() { return this.ui.showUnsavedIndicator(); }
  getLastSavedText() { return this.ui.getLastSavedText(); }
  getLocalSaveText() { return this.ui.getLocalSaveText(); }
  getPageTitle() { return this.ui.getPageTitle(this.isEditMode()); }
  getPageSubtitle() { return this.ui.getPageSubtitle(this.isEditMode()); }
  getPublishButtonText() { return this.ui.getPublishButtonText(this.isEditMode()); }
  getSaveButtonText() { return this.ui.getSaveButtonText(this.isEditMode()); }
  getCurrentStepIcon() { return this.ui.getCurrentStepIcon(); }
  getCurrentStepTitle() { return this.ui.getCurrentStepTitle(); }
  getCurrentStepSubtitle() { 
    return this.stepNavigation.getCurrentStepSubtitle(
      this.organizationLoading(), 
      this.organizationError()
    ); 
  }
  formatNumberWithCommas(value: string | number) { return this.ui.formatNumberWithCommas(value); }
  getFormattedAmount(field: keyof OpportunityFormData) { return this.ui.getFormattedAmount(field); }
  getCompletionPercentage() { return this.ui.getCompletionPercentage(); }
  getCurrentStepIndex() { return this.stepNavigation.currentStepIndex(); }
  isStepCompleted(stepId: string) { return this.stepNavigation.isStepCompleted(stepId); }
  hasMediaContent() { return this.formState.hasMediaContent(); }
  onImageError(field: keyof OpportunityFormData) { this.ui.onImageError(field); }
  clearDraft() { this.formState.clearDraft(); }
  getFieldError(fieldName: string) { return this.formState.getFieldError(fieldName); }
  hasFieldError(fieldName: string) { return this.formState.hasFieldError(fieldName); }
  hasFieldWarning(fieldName: string) { return this.formState.hasFieldWarning(fieldName); }
  get timeframes() { return this.ui.timeframes; }
  get targetIndustries() { return this.ui.targetIndustries; }
  get businessStages() { return this.ui.businessStages; }
  retryLoadOrganization() { this.organizationState.retryLoadOrganization(); }
}