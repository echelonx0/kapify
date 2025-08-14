// src/app/funder/components/opportunity-form.component.ts
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import { LucideAngularModule, ArrowLeft, Target, DollarSign, Users, Settings, FileText, DollarSignIcon, FileTextIcon, SettingsIcon, TargetIcon, UsersIcon } from 'lucide-angular'; 
import { UiButtonComponent, UiCardComponent } from '../shared/components';
import { FundingOpportunity } from '../shared/models/funder.models';
import { trigger, transition, style, animate } from '@angular/animations';
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

@Component({
  selector: 'app-opportunity-form',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    UiButtonComponent,
    UiCardComponent,
    LucideAngularModule
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
export class OpportunityFormComponent {
  // Icons
  ArrowLeftIcon = ArrowLeft;
  TargetIcon = Target;
  DollarSignIcon = DollarSign;
  UsersIcon = Users;
  SettingsIcon = Settings;
  FileTextIcon = FileText;

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
  steps = signal([
    { id: 'basic', icon: TargetIcon, title: 'Basic Info', description: 'Opportunity details' },
    { id: 'terms', icon: DollarSignIcon, title: 'Investment Terms', description: 'Financial structure' },
    { id: 'eligibility', icon: UsersIcon, title: 'Target Criteria', description: 'Who can apply' },
    { id: 'settings', icon: SettingsIcon, title: 'Settings', description: 'Visibility & process' },
    { id: 'review', icon: FileTextIcon, title: 'Review', description: 'Publish opportunity' }
  ]);
  
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

  // Validation
  canContinue(): boolean {
    const data = this.formData();
    const current = this.currentStep();
    
    switch (current) {
      case 'basic':
         return !!(data.title); // Only require title for now
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

  // UI helpers
  getStepClasses(stepId: string): string {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium';
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(stepId);
    
    if (stepIndex < currentIndex) {
      return `${baseClasses} bg-green-500 text-white`;
    } else if (stepIndex === currentIndex) {
      return `${baseClasses} bg-primary-500 text-white`;
    } else {
      return `${baseClasses} bg-neutral-200 text-neutral-500`;
    }
  }

  getStepTextClasses(stepId: string): string {
    const current = this.currentStep();
    const steps = ['basic', 'terms', 'eligibility', 'settings', 'review'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(stepId);
    
    if (stepIndex <= currentIndex) {
      return 'text-sm font-medium text-neutral-900';
    } else {
      return 'text-sm font-medium text-neutral-500';
    }
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