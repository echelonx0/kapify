// src/app/funder/services/organization-state.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FunderOnboardingService, OnboardingState } from './funder-onboarding.service';

@Injectable({
  providedIn: 'root'
})
export class OrganizationStateService {
  private onboardingService = inject(FunderOnboardingService);
  private destroy$ = new Subject<void>();

  // State signals
  organizationLoading = signal(true);
  organizationError = signal<string | null>(null);
  onboardingState = signal<OnboardingState | null>(null);

  // Observable streams (for component subscriptions)
  onboardingState$ = this.onboardingService.onboardingState$;

  // Computed properties
  organizationId = computed(() => this.onboardingState()?.organization?.id || null);
  
  canProceed = computed(() => {
    return !this.organizationLoading() && !!this.organizationId();
  });

  hasOrganizationSetup = computed(() => {
    const state = this.onboardingState();
    return !!state?.organization?.id;
  });

  canCreateOpportunities = computed(() => {
    const state = this.onboardingState();
    return state?.canCreateOpportunities || false;
  });

  constructor() {
    this.setupSubscriptions();
  }

  // Load organization data
  loadOrganizationData() {
    console.log('Loading organization data...');
    this.organizationLoading.set(true);
    this.organizationError.set(null);
    
    // Load onboarding status (same pattern as dashboard)
    this.onboardingService.checkOnboardingStatus().subscribe({
      next: () => {
        console.log('Onboarding status check initiated');
      },
      error: (error) => {
        console.error('Failed to load onboarding status:', error);
        this.organizationError.set('Failed to load organization data');
        this.organizationLoading.set(false);
      }
    });
  }

  // Set up subscriptions to onboarding state
  private setupSubscriptions() {
    this.onboardingService.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        console.log('Onboarding state received:', state);
        this.onboardingState.set(state);
        
        if (state?.organization?.id) {
          console.log('Organization found:', state.organization.id);
          this.organizationLoading.set(false);
          this.organizationError.set(null);
        } else {
          console.warn('No organization found in state');
          this.organizationLoading.set(false);
          this.organizationError.set(
            'Organization setup required to create funding opportunities.'
          );
        }
      });
  }

  // Retry loading
  retryLoadOrganization() {
    this.loadOrganizationData();
  }

  // Clear specific errors
  clearOrganizationError() {
    this.organizationError.set(null);
  }

  // Validation helpers
  validateOrganizationForPublishing(): string | null {
    if (this.organizationLoading()) {
      return 'Organization data is still loading. Please wait.';
    }

    const orgId = this.organizationId();
    if (!orgId) {
      return 'No organization found. Please complete your organization setup before creating opportunities.';
    }

    if (!this.canCreateOpportunities()) {
      return 'Your organization does not have permission to create opportunities. Please complete the setup process.';
    }

    return null;
  }

  // Organization status helpers
  getOrganizationStatus(): 'loading' | 'missing' | 'incomplete' | 'ready' | 'error' {
    if (this.organizationLoading()) {
      return 'loading';
    }

    if (this.organizationError()) {
      return 'error';
    }

    if (!this.hasOrganizationSetup()) {
      return 'missing';
    }

    if (!this.canCreateOpportunities()) {
      return 'incomplete';
    }

    return 'ready';
  }

  getOrganizationStatusMessage(): string {
    const status = this.getOrganizationStatus();
    
    switch (status) {
      case 'loading':
        return 'Loading organization data...';
      case 'missing':
        return 'Organization setup required to create opportunities';
      case 'incomplete':
        return 'Complete organization setup to enable opportunity creation';
      case 'error':
        return this.organizationError() || 'Failed to load organization data';
      case 'ready':
        return 'Organization ready for opportunity creation';
      default:
        return '';
    }
  }

  // Get organization info for display
  getOrganizationDisplayName(): string {
    const state = this.onboardingState();
    return state?.organization?.name || 'Your Organization';
  }

  getOrganizationType(): string {
    const state = this.onboardingState();
    return state?.organization?.organizationType || '';
  }

  // Check if user can perform certain actions
  canPublishOpportunity(): boolean {
    return this.getOrganizationStatus() === 'ready';
  }

  canSaveDraft(): boolean {
    return this.hasOrganizationSetup();
  }

  // Cleanup
  destroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}