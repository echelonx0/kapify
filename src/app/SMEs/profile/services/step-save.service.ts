// src/app/profile/services/step-save.service.ts
import { Injectable, signal, inject, computed, effect } from '@angular/core';
import { ToastService } from 'src/app/shared/services/toast.service';
import { FundingProfileSetupService } from '../../services/funding-profile-setup.service';
import { FundingApplicationUtilityService } from '../../services/utility.service';

@Injectable({ providedIn: 'root' })
export class StepSaveService {
  private fundingService = inject(FundingProfileSetupService);
  private utilityService = inject(FundingApplicationUtilityService);
  private toastService = inject(ToastService);

  private isSavingState = signal(false);
  private lastSavedState = signal<Date | null>(null);
  private previousData = signal<any>(null);
  private isInitialized = signal(false);

  readonly isSaving = this.isSavingState.asReadonly();
  readonly lastSaved = this.lastSavedState.asReadonly();

  /**
   * Computed: Does current step have unsaved changes?
   */
  readonly hasUnsavedChanges = computed(() => {
    // Only detect changes AFTER initialization
    if (!this.isInitialized()) return false;

    const currentData = this.fundingService.data();
    const previous = this.previousData();

    // No previous data = no changes yet
    if (!previous) return false;

    // Compare serialized versions
    return JSON.stringify(currentData) !== JSON.stringify(previous);
  });

  constructor() {
    // Track data changes using effect (not subscribe)
    effect(() => {
      // Access the signal to track changes
      const stepId = this.fundingService.currentStepId();

      // Reset change detection when step changes
      if (stepId && this.isInitialized()) {
        this.initializePreviousData();
      }
    });

    // Track when data is loaded and initialized
    effect(() => {
      const isLoading = this.fundingService.loading();

      // Once loading completes, initialize previous data snapshot
      if (!isLoading && !this.isInitialized()) {
        this.initializePreviousData();
        this.isInitialized.set(true);
        console.log('✅ StepSaveService initialized');
      }
    });
  }

  /**
   * Initialize previous data snapshot for change detection
   */
  private initializePreviousData(): void {
    const currentData = this.fundingService.data();
    this.previousData.set(JSON.parse(JSON.stringify(currentData)));
  }

  /**
   * Save the current step's data
   * Returns success status and optionally navigates on success
   */
  async saveCurrentStep(): Promise<{ success: boolean; error?: string }> {
    if (this.isSavingState()) {
      return { success: false, error: 'Save already in progress' };
    }

    try {
      this.isSavingState.set(true);

      // Validate org context exists
      const orgId = this.fundingService['currentOrganization']?.();
      if (!orgId) {
        const error = 'Organization context not available';
        this.toastService.error(error);
        console.warn('⚠️ ' + error);
        return { success: false, error };
      }

      // Validate data exists before saving
      const data = this.fundingService.data();
      if (this.utilityService.isDataEmpty(data)) {
        const error = 'No data to save';
        this.toastService.warning(error);
        console.info('ℹ️ ' + error);
        return { success: false, error };
      }

      // Delegate to service's existing save method
      await this.fundingService.saveCurrentProgress();

      // Update state on success
      this.lastSavedState.set(new Date());
      this.initializePreviousData(); // Reset change detection

      this.toastService.success('Step saved successfully');
      console.log('✅ Step saved successfully');

      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save step';

      this.toastService.error(message);
      console.error('❌ Save failed:', error);

      return { success: false, error: message };
    } finally {
      this.isSavingState.set(false);
    }
  }

  /**
   * Get formatted last saved time
   */
  getLastSavedText(): string {
    const saved = this.lastSaved();
    if (!saved) return '';

    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return saved.toLocaleDateString();
  }

  /**
   * Check if user can navigate away safely
   * Returns true if no unsaved changes, false if there are
   */
  canNavigateAway(): boolean {
    return !this.hasUnsavedChanges();
  }

  /**
   * Get warning message for unsaved changes
   */
  getUnsavedWarningMessage(): string {
    return 'You have unsaved changes. Are you sure you want to leave without saving?';
  }

  /**
   * Reset service state (called when returning to a step)
   */
  resetChangeDetection(): void {
    this.initializePreviousData();
  }

  /**
   * Debug: Log current state
   */
  debug() {
    console.log('StepSaveService Debug:', {
      isInitialized: this.isInitialized(),
      hasUnsavedChanges: this.hasUnsavedChanges(),
      previousData: this.previousData(),
      currentData: this.fundingService.data(),
      isSaving: this.isSavingState(),
      lastSaved: this.lastSavedState(),
    });
  }
}
