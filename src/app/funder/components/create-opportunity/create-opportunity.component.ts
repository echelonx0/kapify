 

 

// src/app/funder/components/opportunity-form.component.ts
import { Component, inject, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { LucideAngularModule, ArrowLeft, Target, DollarSign, Users, Settings, FileText, Check, Eye, HelpCircle, Lightbulb, TrendingUp, Copy, Calculator, Sparkles, Save, ArrowRight, PieChart, RefreshCw, DollarSignIcon, FileTextIcon, SettingsIcon, TargetIcon, UsersIcon } from 'lucide-angular';

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

  // Form state
  currentStep = signal<'basic' | 'terms' | 'eligibility' | 'settings' | 'review'>('basic');
  isLoading = signal(false);
  lastSavedAt = signal<string | null>(null);
  overallCompletion = signal(0);
  hasUnsavedChanges = signal(false);
  lastLocalSave = signal<string | null>(null);

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

  // Form data
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

  // Steps configuration
  steps = signal<Step[]>([
    { id: 'basic', icon: this.TargetIcon, title: 'Basic Info', description: 'Opportunity details' },
    { id: 'terms', icon: this.DollarSignIcon, title: 'Investment Terms', description: 'Financial structure' },
    { id: 'eligibility', icon: this.UsersIcon, title: 'Target Criteria', description: 'Who can apply' },
    { id: 'settings', icon: this.SettingsIcon, title: 'Settings', description: 'Visibility & process' },
    { id: 'review', icon: this.FileTextIcon, title: 'Review', description: 'Publish opportunity' }
  ]);

  // Timeframe options
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

  constructor(private router: Router) {}

  ngOnInit() {
    // Load existing draft on component init
    this.loadDraft();
    
    // Setup local auto-save functionality (localStorage only)
    this.setupLocalAutoSave();
    
    // Subscribe to service state
    this.subscribeToServiceState();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDraft() {
    this.isLoading.set(true);
    
    // First try to load from localStorage
    this.loadFromLocalStorage();
    
    // Then load from database if available
    this.opportunityService.loadDraft()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.draftData) {
            // Only populate if no local data exists or database is newer
            const localLastSave = this.lastLocalSave();
            const dbLastSave = response.lastSaved;
            
            if (!localLastSave || (dbLastSave && new Date(dbLastSave) > new Date(localLastSave))) {
              this.populateFormFromDraft(response.draftData);
              this.lastSavedAt.set(response.lastSaved || null);
            }
            
            this.overallCompletion.set(response.completionPercentage);
            this.updateSectionCompletionsFromService();
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load draft from database:', error);
          this.isLoading.set(false);
        }
      });
  }

  private setupLocalAutoSave() {
    // Auto-save to localStorage every 10 seconds when form data changes
    this.localAutoSaveSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(10000), // 10 seconds
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(formData => {
      this.saveToLocalStorage(formData);
    });
  }

private subscribeToServiceState() {
  // Subscribe to service state updates - these are signals, not observables
  // So we use effect() or computed() instead of pipe()
  
  // Watch for changes in service signals and update local signals
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
  private updateSectionCompletionsFromService() {
    const serviceCompletions = this.opportunityService.sectionCompletions();
    this.sectionCompletions.set({
      basic: serviceCompletions['basic-info'] || 0,
      terms: serviceCompletions['investment-terms'] || 0,
      eligibility: serviceCompletions['eligibility-criteria'] || 0,
      settings: serviceCompletions['settings'] || 0
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

  // Local Storage Methods
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

  private loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('opportunity_draft');
      if (saved) {
        const saveData = JSON.parse(saved);
        this.formData.set(saveData.formData);
        this.lastLocalSave.set(saveData.lastSaved);
        if (saveData.step) {
          this.currentStep.set(saveData.step);
        }
        console.log('Loaded from local storage');
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
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

  goBack() {
    this.router.navigate(['/funding/opportunities']);
  }

  updateField(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    this.formData.update(data => ({
      ...data,
      [field]: target.value
    }));
    
    this.hasUnsavedChanges.set(true);
    // Trigger local auto-save
    this.localAutoSaveSubject.next(this.formData());
  }

  updateCheckboxField(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLInputElement;
    this.formData.update(data => ({
      ...data,
      [field]: target.checked
    }));
    
    this.hasUnsavedChanges.set(true);
    // Trigger local auto-save
    this.localAutoSaveSubject.next(this.formData());
  }

  updateMultiSelectField(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(target.selectedOptions).map(option => option.value);
    this.formData.update(data => ({
      ...data,
      [field]: selectedOptions
    }));
    
    this.hasUnsavedChanges.set(true);
    // Trigger local auto-save
    this.localAutoSaveSubject.next(this.formData());
  }

  // Step navigation
  nextStep() {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
    const currentIndex = steps.indexOf(current);
    if (currentIndex < steps.length - 1) {
      this.currentStep.set(steps[currentIndex + 1]);
      // Save step to localStorage
      this.localAutoSaveSubject.next(this.formData());
    }
  }

  previousStep() {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
    const currentIndex = steps.indexOf(current);
    if (currentIndex > 0) {
      this.currentStep.set(steps[currentIndex - 1]);
      // Save step to localStorage
      this.localAutoSaveSubject.next(this.formData());
    }
  }

  goToStep(stepId: 'basic' | 'terms' | 'eligibility' | 'settings' | 'review') {
    // Only allow navigation to completed steps or the next step
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
    const currentIndex = steps.indexOf(this.currentStep());
    const targetIndex = steps.indexOf(stepId);
    
    if (targetIndex <= currentIndex + 1) {
      this.currentStep.set(stepId);
      // Save step to localStorage
      this.localAutoSaveSubject.next(this.formData());
    }
  }

  // Validation
  canContinue(): boolean {
    const data = this.formData();
    const current = this.currentStep();
    
    switch (current) {
      case 'basic':
        return !!(data.title && data.shortDescription && data.description);
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
    return this.canContinue();
  }

  // Step status helpers
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

  getSectionCompletion(section: 'basic' | 'terms' | 'eligibility' | 'settings'): number {
    return this.sectionCompletions()[section] || 0;
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

  // UI helper methods
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

  // Actions - Database saves (user initiated)
  saveDraft() {
    const opportunityData = this.buildOpportunityData();
    
    this.opportunityService.saveDraft(opportunityData, false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Draft saved to database successfully');
          this.hasUnsavedChanges.set(false);
          // Clear local storage since we saved to database
          this.clearLocalStorage();
        },
        error: (error) => {
          console.error('Failed to save draft to database:', error);
        }
      });
  }

  publishOpportunity() {
    const opportunityData = this.buildOpportunityData();
    
    this.opportunityService.publishOpportunity(opportunityData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Opportunity published successfully');
          // Clear local storage on successful publish
          this.clearLocalStorage();
          this.router.navigate(['/funder/dashboard']);
        },
        error: (error) => {
          console.error('Failed to publish opportunity:', error);
        }
      });
  }

  deleteDraft() {
    this.opportunityService.deleteDraft()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Draft deleted successfully');
          // Clear local storage
          this.clearLocalStorage();
          // Reset form
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
        },
        error: (error) => {
          console.error('Failed to delete draft:', error);
        }
      });
  }

  private buildOpportunityData(): Partial<FundingOpportunity> {
    const data = this.formData();
    
    return {
      title: data.title,
      description: data.description,
      shortDescription: data.shortDescription,
      offerAmount: Number(data.offerAmount) || 0,
      minInvestment: Number(data.minInvestment) || 0,
      maxInvestment: Number(data.maxInvestment) || 0,
      currency: data.currency,
      fundingType: data.fundingType as any,
      interestRate: data.interestRate ? Number(data.interestRate) : undefined,
      equityOffered: data.equityOffered ? Number(data.equityOffered) : undefined,
      repaymentTerms: data.repaymentTerms || undefined,
      securityRequired: data.securityRequired || undefined,
      useOfFunds: data.useOfFunds,
      investmentStructure: data.investmentStructure,
      expectedReturns: data.expectedReturns ? Number(data.expectedReturns) : undefined,
      investmentHorizon: data.investmentHorizon ? Number(data.investmentHorizon) : undefined,
      exitStrategy: data.exitStrategy || undefined,
      applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
      decisionTimeframe: Number(data.decisionTimeframe) || 30,
      totalAvailable: Number(data.totalAvailable) || 0,
      maxApplications: data.maxApplications ? Number(data.maxApplications) : undefined,
      autoMatch: data.autoMatch,
      eligibilityCriteria: {
        industries: data.targetIndustries,
        businessStages: data.businessStages,
        minRevenue: data.minRevenue ? Number(data.minRevenue) : undefined,
        maxRevenue: data.maxRevenue ? Number(data.maxRevenue) : undefined,
        minYearsOperation: data.minYearsOperation ? Number(data.minYearsOperation) : undefined,
        geographicRestrictions: data.geographicRestrictions.length > 0 ? data.geographicRestrictions : undefined,
        requiresCollateral: data.requiresCollateral,
        excludeCriteria: []
      },
      status: 'draft',
      currentApplications: 0,
      viewCount: 0,
      applicationCount: 0
    };
  }

  // Helper methods for template
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

  getFormattedAmount(field: keyof OpportunityFormData): string {
    const amount = Number(this.formData()[field]) || 0;
    return this.formatNumber(amount);
  }

  formatNumber(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}