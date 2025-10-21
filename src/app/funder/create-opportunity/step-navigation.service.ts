// src/app/funder/create-opportunity/step-navigation.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { OpportunityFormStateService } from '../services/opportunity-form-state.service';
import { 
  Target, 
  DollarSign, 
  Users, 
  Settings, 
  FileText 
} from 'lucide-angular';

export type StepId = 'basic' | 'terms' | 'eligibility' | 'settings' | 'review';

export interface Step {
  id: StepId;
  icon: any;
  title: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class StepNavigationService {
  private formStateService = inject(OpportunityFormStateService);

  // Current step state
  currentStep = signal<StepId>('basic');

  // Steps configuration
  steps: Step[] = [
    { id: 'basic', icon: Target, title: 'Basic Info', description: 'Opportunity details' },
    { id: 'terms', icon: DollarSign, title: 'Investment Terms', description: 'Financial structure' },
    { id: 'eligibility', icon: Users, title: 'Criteria', description: 'Kapify sets limits on industries that can be funded through this platform. Learn more' },// TODO get description from list
    { id: 'settings', icon: Settings, title: 'Settings', description: 'Visibility & process' },
    { id: 'review', icon: FileText, title: 'Review', description: 'Publish opportunity' }
  ];

  // Computed properties
  currentStepIndex = computed(() => {
    return this.steps.findIndex(step => step.id === this.currentStep());
  });

  currentStepData = computed(() => {
    return this.steps.find(step => step.id === this.currentStep()) || this.steps[0];
  });

  currentStepErrors = computed(() => {
    const current = this.currentStep();
    return this.formStateService.validationErrors().filter(error => 
      this.getFieldStep(error.field) === current
    );
  });

  hasCurrentStepErrors = computed(() => this.currentStepErrors().length > 0);

  progressPercentage = computed(() => {
    const totalSteps = this.steps.length;
    const currentIndex = this.currentStepIndex();
    return Math.round(((currentIndex + 1) / totalSteps) * 100);
  });

  // Step navigation methods
  nextStep() {
    const currentIndex = this.currentStepIndex();
    if (currentIndex < this.steps.length - 1) {
      this.currentStep.set(this.steps[currentIndex + 1].id);
    }
  }

  previousStep() {
    const currentIndex = this.currentStepIndex();
    if (currentIndex > 0) {
      this.currentStep.set(this.steps[currentIndex - 1].id);
    }
  }

  goToStep(stepId: StepId) {
    const currentIndex = this.currentStepIndex();
    const targetIndex = this.steps.findIndex(step => step.id === stepId);
    
    // Allow going to any previous step or the next step
    if (targetIndex <= currentIndex + 1) {
      this.currentStep.set(stepId);
    }
  }

  // Step validation - can user proceed from current step?
  canContinue(): boolean {
    const current = this.currentStep();
    const stepErrors = this.formStateService.validationErrors().filter(error => 
      this.getFieldStep(error.field) === current && error.type === 'error'
    );
    
    if (stepErrors.length > 0) return false;

    const data = this.formStateService.formData();
    
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

  // Check if a step has been completed (show green checkmark)
  isStepCompleted(stepId: string): boolean {
    const data = this.formStateService.formData();
    
    switch (stepId) {
      case 'basic':
        // Required: title, shortDescription, description
        return !!(
          data.title.trim() && 
          data.shortDescription.trim() && 
          data.description.trim()
        );
        
      case 'terms':
        // Required: fundingType, totalAvailable, offerAmount, decisionTimeframe
        return !!(
          data.fundingType && 
          data.totalAvailable && 
          data.offerAmount && 
          data.decisionTimeframe
        );
        
      case 'eligibility':
        // Optional step - consider complete if user has set any criteria
        // OR if they've moved past this step
        return (
          data.targetIndustries.length > 0 ||
          data.businessStages.length > 0 ||
          !!data.minRevenue ||
          !!data.maxRevenue ||
          !!data.minYearsOperation
        );
        
      case 'settings':
        // Optional step - consider complete if any setting is configured
        // OR defaults are acceptable (isPublic default behavior)
        return true; // Always consider complete since settings have defaults
        
      case 'review':
        // Review step is complete when all required previous steps are done
        return (
          this.isStepCompleted('basic') && 
          this.isStepCompleted('terms')
        );
        
      default:
        return false;
    }
  }

  // Field to step mapping
  private getFieldStep(fieldName: string): string {
    const fieldStepMap: Record<string, string> = {
      'title': 'basic',
      'shortDescription': 'basic',
      'description': 'basic',
      'fundingOpportunityImageUrl': 'basic',
      'fundingOpportunityVideoUrl': 'basic', 
      'funderOrganizationName': 'basic',
      'funderOrganizationLogoUrl': 'basic',
      'fundingType': 'terms',
      'offerAmount': 'terms',
      'minInvestment': 'terms',
      'maxInvestment': 'terms',
      'totalAvailable': 'terms',
      'interestRate': 'terms',
      'equityOffered': 'terms',
      'repaymentTerms': 'terms',
      'securityRequired': 'terms',
      'useOfFunds': 'terms',
      'investmentStructure': 'terms',
      'expectedReturns': 'terms',
      'investmentHorizon': 'terms',
      'exitStrategy': 'terms',
      'decisionTimeframe': 'terms',
      'targetIndustries': 'eligibility',
      'businessStages': 'eligibility',
      'minRevenue': 'eligibility',
      'maxRevenue': 'eligibility',
      'minYearsOperation': 'eligibility',
      'geographicRestrictions': 'eligibility',
      'requiresCollateral': 'eligibility',
      'isPublic': 'settings',
      'autoMatch': 'settings',
      'maxApplications': 'settings',
      'applicationDeadline': 'settings'
    };
    return fieldStepMap[fieldName] || 'basic';
  }

  // Step subtitles
  getCurrentStepSubtitle(organizationLoading: boolean, organizationError: string | null): string {
    if (organizationLoading) {
      return 'Loading organization data...';
    }
    
    if (organizationError) {
      return 'Organization setup required before creating opportunities';
    }

    const subtitles = {
      basic: 'Define the core details and add media to enhance your funding opportunity',
      terms: 'Define the financial structure and investment parameters',
      eligibility: 'Kapify sets limits on industries that can be funded through this platform. Learn more',
      settings: 'Configure visibility and application process',
      review: 'Review your opportunity before publishing'
    };
    return subtitles[this.currentStep()] || '';
  }
}