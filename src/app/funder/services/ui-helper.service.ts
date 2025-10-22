// src/app/funder/services/opportunity-ui-helper.service.ts
import { Injectable, inject } from '@angular/core';
import { OpportunityFormStateService } from './opportunity-form-state.service';
import { StepNavigationService, StepId } from '../create-opportunity/step-navigation.service';
import { FundingOpportunityService } from 'src/app/funding/services/funding-opportunity.service';
 
@Injectable({
  providedIn: 'root'
})
export class OpportunityUIHelperService {
  private formStateService = inject(OpportunityFormStateService);
  private stepNavigationService = inject(StepNavigationService);
  private opportunityService = inject(FundingOpportunityService);

  // Field CSS classes based on validation state
  getFieldClasses(fieldName: string): string {
    const baseClasses = 'block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-primary-500 text-sm transition-all';
    
    if (this.formStateService.hasFieldError(fieldName)) {
      return `${baseClasses} border-red-300 focus:ring-red-500 focus:border-red-500`;
    } else if (this.formStateService.hasFieldWarning(fieldName)) {
      return `${baseClasses} border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500`;
    }
    
    return `${baseClasses} border-gray-300 focus:ring-primary-500`;
  }

  // Step card styling
  getStepCardClasses(stepId: string): string {
    const current = this.stepNavigationService.currentStep();
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
    const current = this.stepNavigationService.currentStep();
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
    const current = this.stepNavigationService.currentStep();
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
    const current = this.stepNavigationService.currentStep();
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

  // Save status methods
  showDatabaseSaveStatus(): boolean {
    return !!this.opportunityService.lastSavedAt();
  }

  showLocalSaveStatus(): boolean {
    return !!this.formStateService.lastLocalSave() && !this.opportunityService.lastSavedAt();
  }

  showUnsavedIndicator(): boolean {
    return this.formStateService.hasUnsavedChanges();
  }

  getLastSavedText(): string {
    const lastSaved = this.opportunityService.lastSavedAt();
    if (!lastSaved) return '';
    
    const date = new Date(lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Saved just now';
    if (diffMins < 60) return `Saved ${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Saved ${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Saved yesterday';
    if (diffDays < 7) return `Saved ${diffDays} days ago`;
    
    return `Saved ${date.toLocaleDateString()}`;
  }

  getLocalSaveText(): string {
    const lastSaved = this.formStateService.lastLocalSave();
    if (!lastSaved) return '';
    
    const date = new Date(lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Auto-saved just now';
    if (diffMins < 60) return `Auto-saved ${diffMins} minutes ago`;
    
    return 'Auto-saved locally';
  }

  // Page title and subtitle methods
  getPageTitle(isEditMode: boolean): string {
    return isEditMode ? 'Edit Funding Opportunity' : 'Create Funding Opportunity';
  }

  getPageSubtitle(isEditMode: boolean): string {
    if (isEditMode) {
      return 'Update your opportunity details and save changes';
    }
    return 'Set up a new investment opportunity for SMEs with AI-powered optimization';
  }

  getPublishButtonText(isEditMode: boolean): string {
    return isEditMode ? 'Save Changes' : 'Publish Opportunity';
  }

  getSaveButtonText(isEditMode: boolean): string {
    return isEditMode ? 'Save Changes' : 'Save Draft';
  }

  // Step-specific UI helpers
  getCurrentStepIcon(): any {
    const stepData = this.stepNavigationService.currentStepData();
    return stepData.icon;
  }

  getCurrentStepTitle(): string {
    const stepData = this.stepNavigationService.currentStepData();
    return stepData.title;
  }

  // Format helpers that delegate to form state service
  formatNumberWithCommas(value: string | number): string {
    return this.formStateService.formatNumberWithCommas(value);
  }

  getFormattedAmount(field: keyof import('./opportunity-form-state.service').OpportunityFormData): string {
    return this.formStateService.getFormattedAmount(field);
  }

  // Utility methods for template
  getCompletionPercentage(): number {
    return this.opportunityService.overallCompletion();
  }

  // Form interaction helpers
  onNumberInputChange(field: keyof import('./opportunity-form-state.service').OpportunityFormData, event: Event): void {
    const target = event.target as HTMLInputElement;
    let value = target.value;
    
    // Remove non-numeric characters
    value = value.replace(/[^\d]/g, '');
    
    // Parse to number and format with commas for display
    const numValue = Number(value) || 0;
    const formattedValue = numValue === 0 ? '' : this.formatNumberWithCommas(numValue);
    
    // Update the input field display
    target.value = formattedValue;
    
    // Update form data with clean numeric string
    this.formStateService.onNumberInput(field, value);
  }

  // onFieldChange(field: keyof import('./opportunity-form-state.service').OpportunityFormData, event: Event): void {
  //   const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  //   this.formStateService.updateField(field, target.value);
  // }
// Key changes from original:
// 1. onFieldChange now properly extracts value from textarea events
// 2. Added proper type checking for textarea elements

onFieldChange(field: keyof import('./opportunity-form-state.service').OpportunityFormData, event: Event): void {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  let value: string;
  
  if (target instanceof HTMLTextAreaElement) {
    value = target.value;
  } else if (target instanceof HTMLInputElement) {
    value = target.value;
  } else if (target instanceof HTMLSelectElement) {
    value = target.value;
  } else {
    console.warn('Unexpected target type in onFieldChange');
    return;
  }
  
  this.formStateService.updateField(field, value);
}
  onCheckboxChange(field: keyof import('./opportunity-form-state.service').OpportunityFormData, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.formStateService.updateField(field, target.checked);
  }

  onMultiSelectChange(field: keyof import('./opportunity-form-state.service').OpportunityFormData, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    const checked = target.checked;
    this.formStateService.updateMultiSelectField(field, value, checked);
  }

  // Image error handling
  onImageError(field: keyof import('./opportunity-form-state.service').OpportunityFormData): void {
    this.formStateService.onImageError(field);
  }

  // Options data - could be moved to a separate config service later
  readonly timeframes = [
    { value: '7', label: '7 days', description: 'Fast track' },
    { value: '30', label: '30 days', description: 'Standard' },
    { value: '60', label: '60 days', description: 'Extended' },
    { value: '90', label: '90 days', description: 'Comprehensive' }
  ];

  readonly targetIndustries = [
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail' },
    { value: 'agriculture', label: 'Agriculture' }
  ];

  readonly businessStages = [
    { value: 'startup', label: 'Startup' },
    { value: 'early-stage', label: 'Early Stage' },
    { value: 'growth', label: 'Growth' },
    { value: 'expansion', label: 'Expansion' },
    { value: 'mature', label: 'Mature' }
  ];

    // ===============================
  // 🔹 NEW STATIC CONFIGURATIONS
  // ===============================

  readonly industrySectors = [
    'Agriculture - Primary',
    'Agriculture - Secondary',
    'Automotive',
    'Professional & Technical Services',
    'Education',
    'Energy',
    'Engineering & Construction',
    'Financial Services',
    'Franchise',
    'Healthcare & Biotechnology',
    'Hospitality',
    'Information & Communication Technology',
    'Manufacturing',
    'Mining',
    'Real Estate',
    'Retail & Wholesale',
    'Tourism',
    'Transportation and Logistics',
    'Waste Management'
  ];

  readonly fundingOptions = [
    'Equity Investment',
    'Debt Financing',
    'Convertible Notes',
    'Venture Capital',
    'Angel Investment',
    'Crowdfunding',
    'Purchase Order Funding',
    'Invoice Financing',
    'Grant Funding'
  ];

  readonly investmentCriteria = [
    'Business must be operational for at least 2 years',
    'Strong management team with relevant experience',
    'Clear path to profitability or scalability',
    'Registered legal entity with compliant records',
    'Ability to provide performance updates',
    'Located within approved regions or sectors'
  ];
// Geographic regions (South African provinces + international)
geographicRegions = [
  { label: 'Western Cape', value: 'western-cape' },
  { label: 'Eastern Cape', value: 'eastern-cape' },
  { label: 'Northern Cape', value: 'northern-cape' },
  { label: 'Free State', value: 'free-state' },
  { label: 'KwaZulu-Natal', value: 'kwazulu-natal' },
  { label: 'Gauteng', value: 'gauteng' },
  { label: 'Limpopo', value: 'limpopo' },
  { label: 'Mpumalanga', value: 'mpumalanga' },
  { label: 'North West', value: 'north-west' },
  { label: 'Southern Africa', value: 'southern-africa' },
  { label: 'Sub-Saharan Africa', value: 'sub-saharan-africa' },
  { label: 'International', value: 'international' }
];
  readonly excludedSectors = [
    'Arms and Ammunition Manufacturing',
    'Tobacco Production',
    'Adult Entertainment',
    'Gambling and Betting',
    'Unregulated Crypto Assets',
    'Political or Religious Organizations'
  ];

  readonly investmentRanges = [
    { typicalInvestment: '$250,000', minInvestment: '$100,000', maxInvestment: '$1,000,000' },
    { typicalInvestment: '$500,000', minInvestment: '$200,000', maxInvestment: '$2,000,000' }
  ];

  // ✅ Startup stage definitions with tooltips
  readonly startupTerms = [
    { value: 'idea', label: 'Idea Stage', tooltip: 'Concept or prototype, pre-revenue, testing market feasibility.' },
    { value: 'startup', label: 'Startup', tooltip: 'Launched with initial customers or MVP, seeking product-market fit.' },
    { value: 'early-stage', label: 'Early Stage', tooltip: 'Established product-market fit, generating revenue, building team and systems.' },
    { value: 'growth', label: 'Growth Stage', tooltip: 'Strong market presence, revenue expansion, scaling operations or regions.' },
    { value: 'expansion', label: 'Expansion', tooltip: 'Expanding to new markets, products, or geographies with proven model.' },
    { value: 'mature', label: 'Mature', tooltip: 'Stable business with predictable cash flow and potential for acquisition or IPO.' }
  ];

}