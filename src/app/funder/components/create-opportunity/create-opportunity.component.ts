 

// src/app/funder/components/opportunity-form.component.ts
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { LucideAngularModule, ArrowLeft, Target, DollarSign, Users, Settings, FileText, Check, Eye, HelpCircle, Lightbulb, TrendingUp, Copy, Calculator, Sparkles, Save, ArrowRight, PieChart, RefreshCw, DollarSignIcon, FileTextIcon, SettingsIcon, TargetIcon, UsersIcon } from 'lucide-angular'; 
import { UiButtonComponent, UiCardComponent } from '../../../shared/components';
import { FundingOpportunity } from '../../../shared/models/funder.models';
import { trigger, transition, style, animate } from '@angular/animations';
import { AiAssistantComponent } from '../ai-assistant/ai-assistant.component';

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
export class CreateOpportunityComponent {
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
  isSaving = signal(false);
  isPublishing = signal(false);

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
    { id: 'basic', icon: TargetIcon, title: 'Basic Info', description: 'Opportunity details' },
    { id: 'terms', icon: DollarSignIcon, title: 'Investment Terms', description: 'Financial structure' },
    { id: 'eligibility', icon: UsersIcon, title: 'Target Criteria', description: 'Who can apply' },
    { id: 'settings', icon: SettingsIcon, title: 'Settings', description: 'Visibility & process' },
    { id: 'review', icon: FileTextIcon, title: 'Review', description: 'Publish opportunity' }
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

  goBack() {
    this.router.navigate(['/funding/opportunities']);
  }

  updateField(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    this.formData.update(data => ({
      ...data,
      [field]: target.value
    }));
  }

  updateCheckboxField(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLInputElement;
    this.formData.update(data => ({
      ...data,
      [field]: target.checked
    }));
  }

  updateMultiSelectField(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(target.selectedOptions).map(option => option.value);
    this.formData.update(data => ({
      ...data,
      [field]: selectedOptions
    }));
  }

  // Step navigation
  nextStep() {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
    const currentIndex = steps.indexOf(current);
    if (currentIndex < steps.length - 1) {
      this.currentStep.set(steps[currentIndex + 1]);
    }
  }

  previousStep() {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
    const currentIndex = steps.indexOf(current);
    if (currentIndex > 0) {
      this.currentStep.set(steps[currentIndex - 1]);
    }
  }

  goToStep(stepId: 'basic' | 'terms' | 'eligibility' | 'settings' | 'review') {
    // Only allow navigation to completed steps or the next step
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'] as const;
    const currentIndex = steps.indexOf(this.currentStep());
    const targetIndex = steps.indexOf(stepId);
    
    if (targetIndex <= currentIndex + 1) {
      this.currentStep.set(stepId);
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
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    const currentIndex = steps.indexOf(this.currentStep());
    const stepIndex = steps.indexOf(stepId);
    return stepIndex < currentIndex;
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
    const data = this.formData();
    let completedFields = 0;
    let totalFields = 0;

    // Basic fields
    totalFields += 3;
    if (data.title) completedFields++;
    if (data.shortDescription) completedFields++;
    if (data.description) completedFields++;

    // Terms fields
    totalFields += 4;
    if (data.fundingType) completedFields++;
    if (data.totalAvailable) completedFields++;
    if (data.offerAmount) completedFields++;
    if (data.decisionTimeframe) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
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

  // Actions
  saveDraft() {
    this.isSaving.set(true);
    // TODO: Implement save draft functionality
    setTimeout(() => {
      this.isSaving.set(false);
      console.log('Draft saved');
    }, 1000);
  }

  publishOpportunity() {
    this.isPublishing.set(true);
    // TODO: Implement publish functionality
    const opportunityData = this.buildOpportunityData();
    console.log('Publishing opportunity:', opportunityData);
    
    setTimeout(() => {
      this.isPublishing.set(false);
      console.log('Opportunity published');
      this.router.navigate(['/funder/dashboard']);
    }, 2000);
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