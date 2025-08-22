// src/app/funder/components/opportunity-form.component.ts
import { Component, inject, signal, OnInit, OnDestroy, effect, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LucideAngularModule, ArrowLeft, Target, DollarSign, Users, Settings, FileText, Check, Eye, HelpCircle, Lightbulb, TrendingUp, Copy, Calculator, Sparkles, Save, ArrowRight, PieChart, RefreshCw, DollarSignIcon, FileTextIcon, SettingsIcon, TargetIcon, UsersIcon, ClockIcon, AlertCircleIcon } from 'lucide-angular';

import { FundingOpportunity } from '../../../shared/models/funder.models';
import { trigger, transition, style, animate } from '@angular/animations';
import { AiAssistantComponent } from '../ai-assistant/ai-assistant.component'; 
import { FundingOpportunityService } from '../../../funding/services/funding-opportunity.service';

interface OpportunityFormData {
  // Basic details
  title: string;
  description: string;
  shortDescription: string;
  
  // Investment terms
  offerAmount: string;
  minInvestment: string;
  maxInvestment: string;
  currency: string;
  fundingType: 'debt' | 'equity' | 'convertible' | 'mezzanine' | 'grant' | '';
  
  // Specific terms
  interestRate: string;
  equityOffered: string;
  repaymentTerms: string;
  securityRequired: string;
  
  // Deal specifics
  useOfFunds: string;
  investmentStructure: string;
  expectedReturns: string;
  investmentHorizon: string;
  exitStrategy: string;
  
  // Process
  applicationDeadline: string;
  decisionTimeframe: string;
  
  // Eligibility
  targetIndustries: string[];
  businessStages: string[];
  minRevenue: string;
  maxRevenue: string;
  minYearsOperation: string;
  geographicRestrictions: string[];
  requiresCollateral: boolean;
  
  // Availability
  totalAvailable: string;
  maxApplications: string;
  
  // Settings
  autoMatch: boolean;
  isPublic: boolean;
}

interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

interface Step {
  id: 'basic' | 'terms' | 'eligibility' | 'settings' | 'review';
  icon: any;
  title: string;
  description: string;
}

@Component({
  selector: 'app-opportunity-form',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    LucideAngularModule,
    AiAssistantComponent
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
  private localAutoSaveSubject = new Subject<OpportunityFormData>();
  private opportunityService = inject(FundingOpportunityService);
  private route = inject(ActivatedRoute);

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

  // Form state
  currentStep = signal<'basic' | 'terms' | 'eligibility' | 'settings' | 'review'>('basic');
  isLoading = signal(false);
  lastSavedAt = signal<string | null>(null);
  overallCompletion = signal(0);
  hasUnsavedChanges = signal(false);
  lastLocalSave = signal<string | null>(null);
  mode = signal<'create' | 'edit'>('create');
  opportunityId = signal<string | null>(null);

  // Validation state
  validationErrors = signal<ValidationError[]>([]);

  // Use service state for database operations
  get isSaving() { return this.opportunityService.isSaving; }
  get isPublishing() { return this.opportunityService.isPublishing; }

  // Section completion tracking
  sectionCompletions = signal<Record<string, number>>({
    basic: 0,
    terms: 0,
    eligibility: 0,
    settings: 0
  });

  // Form data with proper initial values
  formData = signal<OpportunityFormData>({
    title: '',
    description: '',
    shortDescription: '',
    offerAmount: '',
    minInvestment: '',
    maxInvestment: '',
    currency: 'ZAR',
    fundingType: '',
    interestRate: '',
    equityOffered: '',
    repaymentTerms: '',
    securityRequired: '',
    useOfFunds: '',
    investmentStructure: '',
    expectedReturns: '',
    investmentHorizon: '',
    exitStrategy: '',
    applicationDeadline: '',
    decisionTimeframe: '30',
    targetIndustries: [],
    businessStages: [],
    minRevenue: '',
    maxRevenue: '',
    minYearsOperation: '',
    geographicRestrictions: [],
    requiresCollateral: false,
    totalAvailable: '',
    maxApplications: '',
    autoMatch: true,
    isPublic: true
  });

  // Computed validation state
  currentStepErrors = computed(() => {
    const current = this.currentStep();
    return this.validationErrors().filter(error => this.getFieldStep(error.field) === current);
  });

  hasCurrentStepErrors = computed(() => this.currentStepErrors().length > 0);

  // Steps configuration
  steps = signal<Step[]>([
    { id: 'basic', icon: this.TargetIcon, title: 'Basic Info', description: 'Opportunity details' },
    { id: 'terms', icon: this.DollarSignIcon, title: 'Investment Terms', description: 'Financial structure' },
    { id: 'eligibility', icon: this.UsersIcon, title: 'Target Criteria', description: 'Who can apply' },
    { id: 'settings', icon: this.SettingsIcon, title: 'Settings', description: 'Visibility & process' },
    { id: 'review', icon: this.FileTextIcon, title: 'Review', description: 'Publish opportunity' }
  ]);

  // Options data
  timeframes = [
    { value: '7', label: '7 days', description: 'Fast track' },
    { value: '30', label: '30 days', description: 'Standard' },
    { value: '60', label: '60 days', description: 'Extended' },
    { value: '90', label: '90 days', description: 'Comprehensive' }
  ];

  targetIndustries = [
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail' },
    { value: 'agriculture', label: 'Agriculture' }
  ];

  businessStages = [
    { value: 'startup', label: 'Startup' },
    { value: 'early-stage', label: 'Early Stage' },
    { value: 'growth', label: 'Growth' },
    { value: 'expansion', label: 'Expansion' },
    { value: 'mature', label: 'Mature' }
  ];

  constructor(private router: Router) {
    // Initialize effects in constructor where injection context is available
    this.initializeEffects();
  }

  ngOnInit() {
    this.detectMode();
    this.setupLocalAutoSave();
  
    if (this.mode() === 'edit') {
      this.loadOpportunityForEdit();
    } else {
      this.loadDraftWithMerge();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // VALIDATION METHODS
  // ===============================

  private validateForm(data: OpportunityFormData): void {
    const errors: ValidationError[] = [];

    // Basic validation
    if (!data.title.trim()) {
      errors.push({ field: 'title', message: 'Title is required', type: 'error' });
    } else if (data.title.length < 5) {
      errors.push({ field: 'title', message: 'Title must be at least 5 characters', type: 'warning' });
    }

    if (!data.shortDescription.trim()) {
      errors.push({ field: 'shortDescription', message: 'Short description is required', type: 'error' });
    }

    if (!data.description.trim()) {
      errors.push({ field: 'description', message: 'Description is required', type: 'error' });
    }

    // Investment terms validation
    if (data.fundingType && this.isTermsStepActive()) {
      errors.push(...this.validateInvestmentAmounts(data));
    }

    // Eligibility validation
    if (data.minRevenue && data.maxRevenue) {
      const minRev = this.parseNumberValue(data.minRevenue);
      const maxRev = this.parseNumberValue(data.maxRevenue);
      if (minRev > 0 && maxRev > 0 && maxRev < minRev) {
        errors.push({ 
          field: 'maxRevenue', 
          message: 'Maximum revenue must be greater than minimum revenue', 
          type: 'error' 
        });
      }
    }

    this.validationErrors.set(errors);
  }

  private validateInvestmentAmounts(data: OpportunityFormData): ValidationError[] {
    const errors: ValidationError[] = [];
    
    const offerAmount = this.parseNumberValue(data.offerAmount);
    const minInvestment = this.parseNumberValue(data.minInvestment);
    const maxInvestment = this.parseNumberValue(data.maxInvestment);
    const totalAvailable = this.parseNumberValue(data.totalAvailable);

    // Required field validations
    if (!data.fundingType) {
      errors.push({ field: 'fundingType', message: 'Funding type is required', type: 'error' });
    }

    if (offerAmount <= 0) {
      errors.push({ field: 'offerAmount', message: 'Offer amount must be greater than 0', type: 'error' });
    }

    if (totalAvailable <= 0) {
      errors.push({ field: 'totalAvailable', message: 'Total available must be greater than 0', type: 'error' });
    }

    // Investment range validation
    if (minInvestment > 0 && maxInvestment > 0) {
      if (maxInvestment < minInvestment) {
        errors.push({ 
          field: 'maxInvestment', 
          message: 'Maximum investment must be greater than or equal to minimum investment', 
          type: 'error' 
        });
      }
    }

    // Logical amount validations
    if (offerAmount > 0 && totalAvailable > 0) {
      if (offerAmount > totalAvailable) {
        errors.push({ 
          field: 'offerAmount', 
          message: 'Offer amount cannot exceed total available funding', 
          type: 'error' 
        });
      }
    }

    if (minInvestment > 0 && offerAmount > 0) {
      if (minInvestment > offerAmount) {
        errors.push({ 
          field: 'minInvestment', 
          message: 'Minimum investment cannot exceed the offer amount', 
          type: 'warning' 
        });
      }
    }

    if (maxInvestment > 0 && totalAvailable > 0) {
      if (maxInvestment > totalAvailable) {
        errors.push({ 
          field: 'maxInvestment', 
          message: 'Maximum investment cannot exceed total available funding', 
          type: 'warning' 
        });
      }
    }

    return errors;
  }

  private getFieldStep(fieldName: string): string {
    const fieldStepMap: Record<string, string> = {
      'title': 'basic',
      'shortDescription': 'basic',
      'description': 'basic',
      'fundingType': 'terms',
      'offerAmount': 'terms',
      'minInvestment': 'terms',
      'maxInvestment': 'terms',
      'totalAvailable': 'terms',
      'interestRate': 'terms',
      'equityOffered': 'terms',
      'decisionTimeframe': 'terms',
      'minRevenue': 'eligibility',
      'maxRevenue': 'eligibility',
      'minYearsOperation': 'eligibility',
      'maxApplications': 'settings',
      'applicationDeadline': 'settings'
    };
    return fieldStepMap[fieldName] || 'basic';
  }

  getFieldError(fieldName: string): ValidationError | null {
    return this.validationErrors().find(error => error.field === fieldName) || null;
  }

  hasFieldError(fieldName: string): boolean {
    return this.validationErrors().some(error => error.field === fieldName && error.type === 'error');
  }

  hasFieldWarning(fieldName: string): boolean {
    return this.validationErrors().some(error => error.field === fieldName && error.type === 'warning');
  }

  getFieldClasses(fieldName: string): string {
    const baseClasses = 'block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-primary-500 text-sm transition-all';
    
    if (this.hasFieldError(fieldName)) {
      return `${baseClasses} border-red-300 focus:ring-red-500 focus:border-red-500`;
    } else if (this.hasFieldWarning(fieldName)) {
      return `${baseClasses} border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500`;
    }
    
    return `${baseClasses} border-gray-300 focus:ring-primary-500`;
  }

  // ===============================
  // NUMBER FORMATTING METHODS
  // ===============================

  private parseNumberValue(value: string): number {
    if (!value) return 0;
    // Remove commas and spaces, then parse
    const cleaned = value.replace(/[,\s]/g, '');
    return Number(cleaned) || 0;
  }

  formatNumberWithCommas(value: string | number): string {
    if (!value) return '';
    const numValue = typeof value === 'string' ? this.parseNumberValue(value) : value;
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  }

  onNumberInput(field: keyof OpportunityFormData, event: Event): void {
    const target = event.target as HTMLInputElement;
    let value = target.value;
    
    // Remove non-numeric characters except for the decimal point
    value = value.replace(/[^\d]/g, '');
    
    // Parse to number and format with commas
    const numValue = Number(value) || 0;
    const formattedValue = numValue === 0 ? '' : this.formatNumberWithCommas(numValue);
    
    // Update the input field display
    target.value = formattedValue;
    
    // Update form data with the clean numeric string
    this.formData.update(data => ({
      ...data,
      [field]: value // Store the clean numeric value
    }));
    
    this.hasUnsavedChanges.set(true);
    this.localAutoSaveSubject.next(this.formData());
  }

  private initializeEffects() {
    // Auto-validate when form data changes
    effect(() => {
      const data = this.formData();
      this.validateForm(data);
    });

    // Subscribe to service state changes
    effect(() => {
      const lastSaved = this.opportunityService.lastSavedAt();
      if (lastSaved) {
        this.lastSavedAt.set(lastSaved);
        this.hasUnsavedChanges.set(false);
      }
    });

    effect(() => {
      const completion = this.opportunityService.overallCompletion();
      this.overallCompletion.set(completion);
    });

    effect(() => {
      const completions = this.opportunityService.sectionCompletions();
      this.sectionCompletions.set({
        basic: completions['basic-info'] || 0,
        terms: completions['investment-terms'] || 0,
        eligibility: completions['eligibility-criteria'] || 0,
        settings: completions['settings'] || 0
      });
    });
  }


  // ===============================
  // FORM VALIDATION HELPERS
  // ===============================

  private isTermsStepActive(): boolean {
    return this.currentStep() === 'terms' || this.getCurrentStepIndex() > 1;
  }

  canContinue(): boolean {
    const current = this.currentStep();
    const stepErrors = this.validationErrors().filter(error => 
      this.getFieldStep(error.field) === current && error.type === 'error'
    );
    
    if (stepErrors.length > 0) return false;

    const data = this.formData();
    
    switch (current) {
      case 'basic':
        return !!(data.title.trim() && data.shortDescription.trim() && data.description.trim());
      case 'terms':
        return !!(data.fundingType && data.totalAvailable && data.offerAmount && data.decisionTimeframe);
      case 'eligibility':
        return true; // Optional step
      case 'settings':
        return true; // Optional step
      default:
        return true;
    }
  }

  canPublish(): boolean {
    if (this.isEditMode()) {
      return true; // In edit mode, we can always save changes
    }
    
    // Check for any critical errors
    const criticalErrors = this.validationErrors().filter(error => error.type === 'error');
    if (criticalErrors.length > 0) return false;
    
    return this.canContinue();
  }

  // ===============================
  // EXISTING METHODS (Updated)
  // ===============================

  updateField(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    this.formData.update(data => ({
      ...data,
      [field]: target.value
    }));
    
    this.hasUnsavedChanges.set(true);
    this.localAutoSaveSubject.next(this.formData());
  }

  updateCheckboxField(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLInputElement;
    this.formData.update(data => ({
      ...data,
      [field]: target.checked
    }));
    
    this.hasUnsavedChanges.set(true);
    this.localAutoSaveSubject.next(this.formData());
  }

  updateMultiSelectField(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    const checked = target.checked;
    
    this.formData.update(data => {
      const currentArray = data[field] as string[];
      let newArray: string[];
      
      if (checked) {
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter(item => item !== value);
      }
      
      return {
        ...data,
        [field]: newArray
      };
    });
    
    this.hasUnsavedChanges.set(true);
    this.localAutoSaveSubject.next(this.formData());
  }

  private buildOpportunityData(): Partial<FundingOpportunity> {

    
    const data = this.formData();
    console.log('Raw form data:', data);
  console.log('Offer amount raw:', data.offerAmount);
  console.log('Min investment raw:', data.minInvestment);
  console.log('Max investment raw:', data.maxInvestment);

   
  
 
    // Convert and validate amounts - ensure proper number conversion
    const offerAmount = Math.max(0, this.parseNumberValue(data.offerAmount));
    const minInvestment = this.parseNumberValue(data.minInvestment);
    const maxInvestment = this.parseNumberValue(data.maxInvestment);
    const totalAvailable = Math.max(0, this.parseNumberValue(data.totalAvailable));
    

     console.log('Parsed amounts:', { offerAmount, minInvestment, maxInvestment });
  
  if (minInvestment > 0 && maxInvestment > 0 && maxInvestment < minInvestment) {
    console.error('VALIDATION ERROR: Max investment < Min investment');
  }
    // Ensure max >= min if both are specified and valid
    const finalMinInvestment = minInvestment;
    const finalMaxInvestment = maxInvestment > 0 && minInvestment > 0 ? 
      Math.max(maxInvestment, minInvestment) : maxInvestment;
    
    return {
      title: data.title.trim(),
      description: data.description.trim(),
      shortDescription: data.shortDescription.trim(),
      offerAmount,
      minInvestment: finalMinInvestment,
      maxInvestment: finalMaxInvestment,
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
      totalAvailable,
      maxApplications: data.maxApplications ? Math.max(1, this.parseNumberValue(data.maxApplications)) : undefined,
      autoMatch: data.autoMatch,
      eligibilityCriteria: {
        industries: data.targetIndustries || [],
        businessStages: data.businessStages || [],
        minRevenue: data.minRevenue ? Math.max(0, this.parseNumberValue(data.minRevenue)) : undefined,
        maxRevenue: data.maxRevenue ? Math.max(0, this.parseNumberValue(data.maxRevenue)) : undefined,
        minYearsOperation: data.minYearsOperation ? Math.max(0, Number(data.minYearsOperation)) : undefined,
        geographicRestrictions: data.geographicRestrictions?.length > 0 ? data.geographicRestrictions : undefined,
        requiresCollateral: data.requiresCollateral,
        excludeCriteria: []
      },
      status: 'draft',
      currentApplications: 0,
      viewCount: 0,
      applicationCount: 0
    };
  }

  // Format displayed amounts for readonly elements
  getFormattedAmount(field: keyof OpportunityFormData): string {
    const value = this.formData()[field] as string;
    return this.formatNumberWithCommas(value);
  }

  // Include all other existing methods...
  // (I'll include key ones, but this would include all your navigation, loading, saving methods)

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

  private setupLocalAutoSave() {
    this.localAutoSaveSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(10000),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(formData => {
      this.saveToLocalStorage(formData);
    });
  }

 

  private loadDraftWithMerge() {
    this.isLoading.set(true);
    
    this.opportunityService.loadDraftWithMerge()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.draftData) {
            this.populateFormFromDraft(response.draftData);
            this.overallCompletion.set(response.completionPercentage);
            if (response.lastSaved) {
              this.lastSavedAt.set(response.lastSaved);
            }
            this.updateSectionCompletionsFromService();
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
            this.populateFormFromDraft(response.draftData);
            this.overallCompletion.set(response.completionPercentage);
            if (response.lastSaved) {
              this.lastSavedAt.set(response.lastSaved);
            }
            this.updateSectionCompletionsFromService();
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

  private populateFormFromDraft(draftData: Partial<FundingOpportunity>) {
    this.formData.update(current => ({
      ...current,
      title: draftData.title || '',
      description: draftData.description || '',
      shortDescription: draftData.shortDescription || '',
      offerAmount: draftData.offerAmount?.toString() || '',
      minInvestment: draftData.minInvestment?.toString() || '',
      maxInvestment: draftData.maxInvestment?.toString() || '',
      currency: draftData.currency || 'ZAR',
      fundingType: draftData.fundingType || '',
      interestRate: draftData.interestRate?.toString() || '',
      equityOffered: draftData.equityOffered?.toString() || '',
      repaymentTerms: draftData.repaymentTerms || '',
      securityRequired: draftData.securityRequired || '',
      useOfFunds: draftData.useOfFunds || '',
      investmentStructure: draftData.investmentStructure || '',
      expectedReturns: draftData.expectedReturns?.toString() || '',
      investmentHorizon: draftData.investmentHorizon?.toString() || '',
      exitStrategy: draftData.exitStrategy || '',
      applicationDeadline: draftData.applicationDeadline?.toISOString().split('T')[0] || '',
      decisionTimeframe: draftData.decisionTimeframe?.toString() || '30',
      targetIndustries: draftData.eligibilityCriteria?.industries || [],
      businessStages: draftData.eligibilityCriteria?.businessStages || [],
      minRevenue: draftData.eligibilityCriteria?.minRevenue?.toString() || '',
      maxRevenue: draftData.eligibilityCriteria?.maxRevenue?.toString() || '',
      minYearsOperation: draftData.eligibilityCriteria?.minYearsOperation?.toString() || '',
      geographicRestrictions: draftData.eligibilityCriteria?.geographicRestrictions || [],
      requiresCollateral: draftData.eligibilityCriteria?.requiresCollateral || false,
      totalAvailable: draftData.totalAvailable?.toString() || '',
      maxApplications: draftData.maxApplications?.toString() || '',
      autoMatch: draftData.autoMatch ?? true,
      isPublic: true
    }));
  }

  private updateSectionCompletionsFromService() {
    const serviceCompletions = this.opportunityService.sectionCompletions();
    this.sectionCompletions.set({
      basic: serviceCompletions['basic-info'] || 0,
      terms: serviceCompletions['investment-terms'] || 0,
      eligibility: serviceCompletions['eligibility-criteria'] || 0,
      settings: serviceCompletions['settings'] || 0
    });
  }

  private saveToLocalStorage(formData: OpportunityFormData) {
    try {
      const saveData = {
        formData,
        lastSaved: new Date().toISOString(),
        step: this.currentStep()
      };
      localStorage.setItem('opportunity_draft', JSON.stringify(saveData));
      this.lastLocalSave.set(saveData.lastSaved);
      console.log('Auto-saved to local storage');
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }



  private clearLocalStorage() {
    try {
      localStorage.removeItem('opportunity_draft');
      this.lastLocalSave.set(null);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  // Step navigation
  nextStep() {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
    const currentIndex = steps.indexOf(current);
    if (currentIndex < steps.length - 1) {
      this.currentStep.set(steps[currentIndex + 1]);
      this.localAutoSaveSubject.next(this.formData());
    }
  }

  previousStep() {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
    const currentIndex = steps.indexOf(current);
    if (currentIndex > 0) {
      this.currentStep.set(steps[currentIndex - 1]);
      this.localAutoSaveSubject.next(this.formData());
    }
  }

  goToStep(stepId: 'basic' | 'terms' | 'eligibility' | 'settings' | 'review') {
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
    const currentIndex = steps.indexOf(this.currentStep());
    const targetIndex = steps.indexOf(stepId);
    
    if (targetIndex <= currentIndex + 1) {
      this.currentStep.set(stepId);
      this.localAutoSaveSubject.next(this.formData());
    }
  }

  // Actions
  saveDraft() {
    const opportunityData = this.buildOpportunityData();
    
    if (this.mode() === 'edit') {
      const oppId = this.opportunityId();
      if (!oppId) return;
      
      this.opportunityService.updateOpportunity(oppId, opportunityData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Opportunity updated successfully');
            this.hasUnsavedChanges.set(false);
            this.clearLocalStorage();
          },
          error: (error) => {
            console.error('Failed to update opportunity:', error);
          }
        });
    } else {
      this.opportunityService.saveDraft(opportunityData, false)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Draft saved to database successfully');
            this.hasUnsavedChanges.set(false);
            this.clearLocalStorage();
          },
          error: (error) => {
            console.error('Failed to save draft to database:', error);
          }
        });
    }
  }

  publishOpportunity() {
    
    console.log('=== PUBLISH DEBUG START ===');
  console.log('Form data:', this.formData());
  console.log('Is publishing:', this.isPublishing());
  console.log('Current mode:', this.mode());
  
  const opportunityData = this.buildOpportunityData();
  console.log('Built data:', opportunityData);
    if (this.mode() === 'edit') {
      this.saveDraft();
    } else {
      this.opportunityService.publishOpportunity(opportunityData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            console.log('Opportunity published successfully');
            this.clearLocalStorage();
            this.router.navigate(['/funder/dashboard']);
          },
          error: (error) => {
            console.error('Failed to publish opportunity:', error);
          }
        });
    }
  }

  deleteDraft() {
    if (this.mode() === 'edit') {
      this.router.navigate(['/funding/opportunities', this.opportunityId()]);
      return;
    }

    this.opportunityService.deleteDraft()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Draft deleted successfully');
          this.clearLocalStorage();
          this.resetForm();
        },
        error: (error) => {
          console.error('Failed to delete draft:', error);
        }
      });
  }

  clearDraft() {
    this.clearLocalStorage();
    this.resetForm();
  }

  private resetForm() {
    this.formData.set({
      title: '',
      description: '',
      shortDescription: '',
      offerAmount: '',
      minInvestment: '',
      maxInvestment: '',
      currency: 'ZAR',
      fundingType: '',
      interestRate: '',
      equityOffered: '',
      repaymentTerms: '',
      securityRequired: '',
      useOfFunds: '',
      investmentStructure: '',
      expectedReturns: '',
      investmentHorizon: '',
      exitStrategy: '',
      applicationDeadline: '',
      decisionTimeframe: '30',
      targetIndustries: [],
      businessStages: [],
      minRevenue: '',
      maxRevenue: '',
      minYearsOperation: '',
      geographicRestrictions: [],
      requiresCollateral: false,
      totalAvailable: '',
      maxApplications: '',
      autoMatch: true,
      isPublic: true
    });
    this.overallCompletion.set(0);
    this.lastSavedAt.set(null);
    this.hasUnsavedChanges.set(false);
    this.validationErrors.set([]);
  }

  // Helper methods
  isEditMode(): boolean {
    return this.mode() === 'edit';
  }

  isCreateMode(): boolean {
    return this.mode() === 'create';
  }

  getPageTitle(): string {
    return this.isEditMode() ? 'Edit Funding Opportunity' : 'Create Funding Opportunity';
  }

  getPageSubtitle(): string {
    if (this.isEditMode()) {
      return 'Update your opportunity details and save changes';
    }
    return 'Set up a new investment opportunity for SMEs with AI-powered optimization';
  }

  getPublishButtonText(): string {
    return this.isEditMode() ? 'Save Changes' : 'Publish Opportunity';
  }

  getSaveButtonText(): string {
    return this.isEditMode() ? 'Save Changes' : 'Save Draft';
  }

  goBack() {
    if (this.isEditMode()) {
      this.router.navigate(['/funding/opportunities', this.opportunityId()]);
    } else {
      this.router.navigate(['/funding/opportunities']);
    }
  }

  getCurrentStepIndex(): number {
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    return steps.indexOf(this.currentStep());
  }

  getProgressPercentage(): number {
    const totalSteps = this.steps().length;
    const currentIndex = this.getCurrentStepIndex();
    return Math.round(((currentIndex + 1) / totalSteps) * 100);
  }

  getCompletionPercentage(): number {
    return this.overallCompletion();
  }

  getCurrentStepIcon() {
    const step = this.steps().find(s => s.id === this.currentStep());
    return step?.icon || this.TargetIcon;
  }

  getCurrentStepTitle(): string {
    const step = this.steps().find(s => s.id === this.currentStep());
    return step?.title || '';
  }

  getCurrentStepSubtitle(): string {
    const subtitles = {
      basic: 'Define the core details about your funding opportunity',
      terms: 'Define the financial structure and investment parameters',
      eligibility: 'Set criteria for who can apply',
      settings: 'Configure visibility and application process',
      review: 'Review your opportunity before publishing'
    };
    return subtitles[this.currentStep()] || '';
  }

  isStepCompleted(stepId: string): boolean {
    const completions = this.sectionCompletions();
    switch (stepId) {
      case 'basic': return completions['basic'] >= 100;
      case 'terms': return completions['terms'] >= 100;
      case 'eligibility': return completions['eligibility'] >= 100;
      case 'settings': return completions['settings'] >= 100;
      default: return false;
    }
  }

  getStepCardClasses(stepId: string): string {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(stepId);

    if (stepIndex < currentIndex) {
      return 'bg-green-50 border border-green-200';
    } else if (stepIndex === currentIndex) {
      return 'bg-blue-50 border border-blue-200';
    } else {
      return 'hover:bg-gray-50';
    }
  }

  getStepIconClasses(stepId: string): string {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center';
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(stepId);

    if (stepIndex < currentIndex) {
      return `${baseClasses} bg-green-500 text-white`;
    } else if (stepIndex === currentIndex) {
      return `${baseClasses} bg-blue-500 text-white`;
    } else {
      return `${baseClasses} bg-gray-200 text-gray-500`;
    }
  }

  getStepTitleClasses(stepId: string): string {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(stepId);

    if (stepIndex < currentIndex) {
      return 'text-sm font-medium text-green-900';
    } else if (stepIndex === currentIndex) {
      return 'text-sm font-medium text-blue-900';
    } else {
      return 'text-sm font-medium text-gray-500';
    }
  }

  getStepDescriptionClasses(stepId: string): string {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(stepId);

    if (stepIndex < currentIndex) {
      return 'text-xs text-green-600';
    } else if (stepIndex === currentIndex) {
      return 'text-xs text-blue-600';
    } else {
      return 'text-xs text-gray-400';
    }
  }

  getLastSavedText(): string {
    const lastSaved = this.lastSavedAt();
    if (!lastSaved) return '';
    
    const date = new Date(lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Saved just now';
    if (diffMins < 60) return `Saved ${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Saved ${diffHours} hours ago`;
    
    return `Saved ${date.toLocaleDateString()}`;
  }

  getLocalSaveText(): string {
    const lastSaved = this.lastLocalSave();
    if (!lastSaved) return '';
    
    const date = new Date(lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Auto-saved just now';
    if (diffMins < 60) return `Auto-saved ${diffMins} minutes ago`;
    
    return 'Auto-saved locally';
  }

  showDatabaseSaveStatus(): boolean {
    return !!this.lastSavedAt();
  }

  showLocalSaveStatus(): boolean {
    return !!this.lastLocalSave() && !this.lastSavedAt();
  }

  showUnsavedIndicator(): boolean {
    return this.hasUnsavedChanges();
  }
}