// src/app/shared/services/global-profile-validation.service.ts
import { Injectable, inject, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FundingProfileSetupService } from '../../applications/services/funding-profile-setup.service';
 
// Configurable completion requirements
export const COMPLETION_REQUIREMENTS = {
  APPLY_FOR_FUNDING: 90,
  VIEW_OPPORTUNITIES: 70,
  ACCESS_PORTFOLIO: 50,
  BASIC_ACCESS: 30
} as const;

export type CompletionRequirement = typeof COMPLETION_REQUIREMENTS[keyof typeof COMPLETION_REQUIREMENTS];

export interface ProfileValidationResult {
  canProceed: boolean;
  currentCompletion: number;
  requiredCompletion: number;
  message: string;
  actionText: string;
}

@Injectable({ 
  providedIn: 'root' 
})
export class GlobalProfileValidationService {
  private fundingApplicationService = inject(FundingProfileSetupService);
  private router = inject(Router);

  // Centralized completion data
  completion = computed(() => this.fundingApplicationService.completion());
  completedSteps = computed(() => this.fundingApplicationService.completedSteps());
  totalSteps = computed(() => this.fundingApplicationService.steps.length);
  isLoading = computed(() => this.fundingApplicationService.loading());

  // Computed validation states
  isReadyForApplications = computed(() => this.completion() >= COMPLETION_REQUIREMENTS.APPLY_FOR_FUNDING);
  isReadyForOpportunities = computed(() => this.completion() >= COMPLETION_REQUIREMENTS.VIEW_OPPORTUNITIES);
  isReadyForPortfolio = computed(() => this.completion() >= COMPLETION_REQUIREMENTS.ACCESS_PORTFOLIO);

  // ===============================
  // VALIDATION METHODS
  // ===============================

  canApplyForFunding(): ProfileValidationResult {
    const current = this.completion();
    const required = COMPLETION_REQUIREMENTS.APPLY_FOR_FUNDING;
    
    return {
      canProceed: current >= required,
      currentCompletion: current,
      requiredCompletion: required,
      message: current >= required 
        ? 'Profile ready for funding applications' 
        : `Profile needs to be ${required}% complete to apply for funding`,
      actionText: current >= required 
        ? 'Continue to Application' 
        : `Complete Profile (${required - current}% remaining)`
    };
  }

  canViewOpportunities(): ProfileValidationResult {
    const current = this.completion();
    const required = COMPLETION_REQUIREMENTS.VIEW_OPPORTUNITIES;
    
    return {
      canProceed: current >= required,
      currentCompletion: current,
      requiredCompletion: required,
      message: current >= required 
        ? 'Profile ready to explore opportunities' 
        : `Profile needs to be ${required}% complete to view opportunities`,
      actionText: current >= required 
        ? 'Explore Opportunities' 
        : `Complete Profile (${required - current}% remaining)`
    };
  }

  canAccessPortfolio(): ProfileValidationResult {
    const current = this.completion();
    const required = COMPLETION_REQUIREMENTS.ACCESS_PORTFOLIO;
    
    return {
      canProceed: current >= required,
      currentCompletion: current,
      requiredCompletion: required,
      message: current >= required 
        ? 'Profile ready for portfolio access' 
        : `Profile needs to be ${required}% complete to access portfolio`,
      actionText: current >= required 
        ? 'View Portfolio' 
        : `Complete Profile (${required - current}% remaining)`
    };
  }

  validateForRequirement(requirement: CompletionRequirement): ProfileValidationResult {
    const current = this.completion();
    
    return {
      canProceed: current >= requirement,
      currentCompletion: current,
      requiredCompletion: requirement,
      message: current >= requirement 
        ? 'Profile meets requirements' 
        : `Profile needs to be ${requirement}% complete`,
      actionText: current >= requirement 
        ? 'Continue' 
        : `Complete Profile (${requirement - current}% remaining)`
    };
  }

  // ===============================
  // NAVIGATION HELPERS
  // ===============================

  /**
   * Redirects to profile completion if requirements not met
   * @param requiredCompletion - Minimum completion percentage needed
   * @param redirectRoute - Where to redirect if requirements not met (default: /profile/steps)
   * @returns true if redirected, false if can proceed
   */
  redirectToProfileIfNeeded(
    requiredCompletion: CompletionRequirement, 
    redirectRoute: string = '/profile/steps'
  ): boolean {
    const current = this.completion();
    
    if (current < requiredCompletion) {
      this.router.navigate([redirectRoute], {
        queryParams: { 
          required: requiredCompletion,
          current: current,
          message: `Complete your profile to continue (${requiredCompletion}% required)`
        }
      });
      return true;
    }
    return false;
  }

  /**
   * Navigate to funding applications with validation
   */
  navigateToFundingApplications(): void {
    const validation = this.canApplyForFunding();
    
    if (validation.canProceed) {
      this.router.navigate(['/applications/new']);
    } else {
      this.redirectToProfileIfNeeded(COMPLETION_REQUIREMENTS.APPLY_FOR_FUNDING);
    }
  }

  /**
   * Navigate to opportunities with validation
   */
  navigateToOpportunities(): void {
    const validation = this.canViewOpportunities();
    
    if (validation.canProceed) {
      this.router.navigate(['/opportunities']);
    } else {
      this.redirectToProfileIfNeeded(COMPLETION_REQUIREMENTS.VIEW_OPPORTUNITIES);
    }
  }

  /**
   * Navigate to specific opportunity application
   */
  navigateToOpportunityApplication(opportunityId: string): void {
    const validation = this.canApplyForFunding();
    
    if (validation.canProceed) {
      this.router.navigate(['/applications/new'], { 
        queryParams: { opportunityId } 
      });
    } else {
      this.redirectToProfileIfNeeded(COMPLETION_REQUIREMENTS.APPLY_FOR_FUNDING);
    }
  }

  // ===============================
  // PROFILE INSIGHTS
  // ===============================

  getProfileInsights(): {
    message: string;
    actionText: string;
    urgency: 'success' | 'warning' | 'info' | 'primary';
    nextSteps: string[];
  } {
    const completion = this.completion();
    const nextStep = this.fundingApplicationService.nextRequiredStep();
    const remainingSteps = this.fundingApplicationService.steps.filter(step => 
      step.required && !step.completed
    );

    if (completion === 0) {
      return {
        message: 'Start building your funding profile',
        actionText: 'Begin Setup',
        urgency: 'info',
        nextSteps: ['Complete company information', 'Upload required documents']
      };
    } else if (completion < COMPLETION_REQUIREMENTS.VIEW_OPPORTUNITIES) {
      return {
        message: 'Great start! Keep building your profile',
        actionText: `Complete ${nextStep?.title || 'next section'}`,
        urgency: 'warning',
        nextSteps: remainingSteps.slice(0, 2).map(step => step.title)
      };
    } else if (completion < COMPLETION_REQUIREMENTS.APPLY_FOR_FUNDING) {
      return {
        message: 'Profile ready for opportunities! Almost ready for applications',
        actionText: `Complete final ${remainingSteps.length} sections`,
        urgency: 'info',
        nextSteps: remainingSteps.map(step => step.title)
      };
    } else {
      return {
        message: 'Profile complete - ready for funding applications!',
        actionText: 'Apply for Funding',
        urgency: 'success',
        nextSteps: ['Explore funding opportunities', 'Submit applications']
      };
    }
  }

  // ===============================
  // COMPLETION STATUS HELPERS
  // ===============================

  getCompletionBadgeColor(): string {
    const completion = this.completion();
    
    if (completion >= COMPLETION_REQUIREMENTS.APPLY_FOR_FUNDING) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (completion >= COMPLETION_REQUIREMENTS.VIEW_OPPORTUNITIES) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (completion >= COMPLETION_REQUIREMENTS.BASIC_ACCESS) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getCompletionStatusText(): string {
    const completion = this.completion();
    
    if (completion >= COMPLETION_REQUIREMENTS.APPLY_FOR_FUNDING) {
      return 'Ready for Applications';
    } else if (completion >= COMPLETION_REQUIREMENTS.VIEW_OPPORTUNITIES) {
      return 'Ready for Opportunities';
    } else if (completion >= COMPLETION_REQUIREMENTS.BASIC_ACCESS) {
      return 'Profile In Progress';
    } else {
      return 'Getting Started';
    }
  }

  getProgressBarColor(): string {
    const completion = this.completion();
    
    if (completion >= COMPLETION_REQUIREMENTS.APPLY_FOR_FUNDING) {
      return 'bg-green-500';
    } else if (completion >= COMPLETION_REQUIREMENTS.VIEW_OPPORTUNITIES) {
      return 'bg-blue-500';
    } else {
      return 'bg-yellow-500';
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Force refresh of completion data
   */
  async refreshProfileData(): Promise<void> {
    try {
      await this.fundingApplicationService.loadSavedApplication();
    } catch (error) {
      console.error('Failed to refresh profile data:', error);
    }
  }

  /**
   * Get estimated time to reach requirement
   */
  getEstimatedTimeToRequirement(requirement: CompletionRequirement): string {
    const current = this.completion();
    const remaining = requirement - current;
    
    if (remaining <= 0) return '0 minutes';
    
    // Rough estimate: 15 minutes per 10% completion
    const estimatedMinutes = Math.ceil((remaining / 10) * 15);
    
    if (estimatedMinutes < 60) {
      return `${estimatedMinutes} minutes`;
    } else {
      const hours = Math.ceil(estimatedMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  }
}