// // src/app/profile/services/step-save.service.ts
// import { Injectable, signal, inject, computed, effect } from '@angular/core';
// import { FormGroup } from '@angular/forms';
// import { ToastService } from 'src/app/shared/services/toast.service';
// import { FundingProfileSetupService } from '../../services/funding-profile-setup.service';
// import { FundingApplicationUtilityService } from '../../services/utility.service';
// import { Subscription } from 'rxjs';

// @Injectable({ providedIn: 'root' })
// export class StepSaveService {
//   private fundingService = inject(FundingProfileSetupService);
//   private utilityService = inject(FundingApplicationUtilityService);
//   private toastService = inject(ToastService);

//   private isSavingState = signal(false);
//   private lastSavedState = signal<Date | null>(null);
//   private currentForm = signal<FormGroup | null>(null);

//   // 🔥 CRITICAL: Signal to track form dirty state (form.dirty is NOT reactive)
//   private formDirtySignal = signal(false);
//   private formStatusSubscription: Subscription | null = null;

//   readonly isSaving = this.isSavingState.asReadonly();
//   readonly lastSaved = this.lastSavedState.asReadonly();

//   /**
//    * Computed: Does current step have unsaved changes?
//    * 🔥 Now properly reactive - depends on formDirtySignal which updates on form changes
//    */
//   readonly hasUnsavedChanges = computed(() => {
//     const form = this.currentForm();
//     if (!form) return false;

//     // Return the signal value, not form.dirty
//     // This ensures the computed re-evaluates when the signal changes
//     return this.formDirtySignal();
//   });

//   /**
//    * Register the form for this step
//    * Call this in ngOnInit of the step component
//    * 🔥 CRITICAL: Sets up subscriptions to bridge form.dirty to signal system
//    */
//   registerForm(form: FormGroup): void {
//     // Clear any previous subscriptions
//     if (this.formStatusSubscription) {
//       this.formStatusSubscription.unsubscribe();
//     }

//     this.currentForm.set(form);
//     this.formDirtySignal.set(form.dirty); // Set initial state

//     // Subscribe to both valueChanges and statusChanges
//     // This captures all form mutations
//     this.formStatusSubscription = form.statusChanges.subscribe(() => {
//       this.formDirtySignal.set(form.dirty);
//       console.log('📝 Form dirty state updated:', form.dirty);
//     });

//     // Also subscribe to value changes for real-time updates
//     const valueChangesSub = form.valueChanges.subscribe(() => {
//       this.formDirtySignal.set(form.dirty);
//     });

//     console.log('✅ Form registered for change detection with subscriptions');

//     // Store subscription reference for cleanup
//     // We'll clean it up in clearForm()
//   }

//   /**
//    * Clear the form reference (call when leaving step)
//    * Also unsubscribes from form changes
//    */
//   clearForm(): void {
//     if (this.formStatusSubscription) {
//       this.formStatusSubscription.unsubscribe();
//       this.formStatusSubscription = null;
//     }
//     this.currentForm.set(null);
//     this.formDirtySignal.set(false);
//     console.log('🧹 Form cleared and subscriptions unsubscribed');
//   }

//   /**
//    * Save the current step's data
//    * Returns success status
//    */
//   async saveCurrentStep(): Promise<{ success: boolean; error?: string }> {
//     if (this.isSavingState()) {
//       return { success: false, error: 'Save already in progress' };
//     }

//     try {
//       this.isSavingState.set(true);

//       const form = this.currentForm();
//       if (!form) {
//         const error = 'No form registered';
//         this.toastService.error(error);
//         console.warn('⚠️ ' + error);
//         return { success: false, error };
//       }

//       // Validate form before saving
//       if (form.invalid) {
//         const error = 'Please fix validation errors before saving';
//         this.toastService.error(error);
//         console.warn('⚠️ ' + error);
//         return { success: false, error };
//       }

//       // Validate org context exists
//       const orgId = this.fundingService['currentOrganization']?.();
//       if (!orgId) {
//         const error = 'Organization context not available';
//         this.toastService.error(error);
//         console.warn('⚠️ ' + error);
//         return { success: false, error };
//       }

//       // Validate data exists before saving
//       const data = this.fundingService.data();
//       if (this.utilityService.isDataEmpty(data)) {
//         const error = 'No data to save';
//         this.toastService.warning(error);
//         console.info('ℹ️ ' + error);
//         return { success: false, error };
//       }

//       // Delegate to service's existing save method
//       await this.fundingService.saveCurrentProgress();

//       // Mark form as pristine after successful save
//       form.markAsPristine();

//       // Update signal to reflect pristine state
//       this.formDirtySignal.set(false);

//       // Update state on success
//       this.lastSavedState.set(new Date());

//       this.toastService.success('Step saved successfully');
//       console.log('✅ Step saved successfully');

//       return { success: true };
//     } catch (error) {
//       const message =
//         error instanceof Error ? error.message : 'Failed to save step';

//       this.toastService.error(message);
//       console.error('❌ Save failed:', error);

//       return { success: false, error: message };
//     } finally {
//       this.isSavingState.set(false);
//     }
//   }

//   /**
//    * Get formatted last saved time
//    */
//   getLastSavedText(): string {
//     const saved = this.lastSaved();
//     if (!saved) return '';

//     const now = new Date();
//     const diffMs = now.getTime() - saved.getTime();
//     const diffMins = Math.floor(diffMs / 60000);

//     if (diffMins < 1) return 'just now';
//     if (diffMins < 60) return `${diffMins}m ago`;
//     const diffHours = Math.floor(diffMins / 60);
//     if (diffHours < 24) return `${diffHours}h ago`;
//     return saved.toLocaleDateString();
//   }

//   /**
//    * Check if user can navigate away safely
//    * Returns true if no unsaved changes, false if there are
//    */
//   canNavigateAway(): boolean {
//     return !this.hasUnsavedChanges();
//   }

//   /**
//    * Get warning message for unsaved changes
//    */
//   getUnsavedWarningMessage(): string {
//     return 'You have unsaved changes. Are you sure you want to leave without saving?';
//   }

//   /**
//    * Reset change detection when navigating away from step
//    * Clears the form reference and subscriptions
//    */
//   resetChangeDetection(): void {
//     this.clearForm();
//   }

//   /**
//    * Debug: Log current state
//    */
//   debug() {
//     const form = this.currentForm();
//     console.log('StepSaveService Debug:', {
//       hasForm: !!form,
//       formDirty: form?.dirty,
//       formDirtySignal: this.formDirtySignal(),
//       hasUnsavedChanges: this.hasUnsavedChanges(),
//       isSaving: this.isSavingState(),
//       lastSaved: this.lastSavedState(),
//     });
//   }
// }

// src/app/profile/services/step-save.service.ts
import {
  Injectable,
  signal,
  inject,
  computed,
  effect,
  Signal,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ToastService } from 'src/app/shared/services/toast.service';
import { FundingProfileSetupService } from '../../../fund-seeking-orgs/services/funding-profile-setup.service';
import { FundingApplicationUtilityService } from '../../../fund-seeking-orgs/services/utility.service';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StepSaveService {
  private fundingService = inject(FundingProfileSetupService);
  private utilityService = inject(FundingApplicationUtilityService);
  private toastService = inject(ToastService);

  private isSavingState = signal(false);
  private lastSavedState = signal<Date | null>(null);
  private currentForm = signal<FormGroup | null>(null);
  private dirtySignal = signal<boolean>(false);

  // 🔥 CRITICAL: Signal to track form dirty state (form.dirty is NOT reactive)
  private formDirtySignal = signal(false);
  private formStatusSubscription: Subscription | null = null;

  readonly isSaving = this.isSavingState.asReadonly();
  readonly lastSaved = this.lastSavedState.asReadonly();

  /**
   * Computed: Does current step have unsaved changes?
   * 🔥 Works with BOTH form-based AND signal-based components
   */
  readonly hasUnsavedChanges = computed(() => {
    const form = this.currentForm();

    // If a form is registered, use form.dirty via signal
    if (form) {
      return this.formDirtySignal();
    }

    // Otherwise, use the registered dirty signal
    return this.dirtySignal();
  });

  /**
   * Register a form for this step (form-based components)
   * Call this in ngOnInit of the step component
   * 🔥 CRITICAL: Sets up subscriptions to bridge form.dirty to signal system
   */
  registerForm(form: FormGroup): void {
    // Clear any previous subscriptions
    if (this.formStatusSubscription) {
      this.formStatusSubscription.unsubscribe();
    }

    this.currentForm.set(form);
    this.formDirtySignal.set(form.dirty); // Set initial state

    // Subscribe to both valueChanges and statusChanges
    // This captures all form mutations
    this.formStatusSubscription = form.statusChanges.subscribe(() => {
      this.formDirtySignal.set(form.dirty);
      console.log('📝 Form dirty state updated:', form.dirty);
    });

    // Also subscribe to value changes for real-time updates
    const valueChangesSub = form.valueChanges.subscribe(() => {
      this.formDirtySignal.set(form.dirty);
    });

    console.log('✅ Form registered for change detection with subscriptions');

    // Store subscription reference for cleanup
    // We'll clean it up in clearForm()
  }

  /**
   * Register a signal-based dirty flag (for signal-native components)
   * Call this in ngOnInit instead of registerForm()
   * Pass a computed signal that tracks if data has changed
   */
  registerSignalDirty(dirtySignal: Signal<boolean>): void {
    // Clear any form subscriptions
    if (this.formStatusSubscription) {
      this.formStatusSubscription.unsubscribe();
      this.formStatusSubscription = null;
    }

    // Clear form reference
    this.currentForm.set(null);
    this.formDirtySignal.set(false);

    // Create an effect that updates our internal signal whenever the provided signal changes
    // This bridges the component's dirty signal to our service
    const effectFn = effect(() => {
      this.dirtySignal.set(dirtySignal());
      console.log('📝 Component dirty state updated:', dirtySignal());
    });

    console.log('✅ Signal-based dirty tracking registered');

    // Note: The effect will automatically clean up when the component is destroyed
    // because Angular handles effect cleanup on component destroy
  }

  /**
   * Clear the form/signal reference (call when leaving step)
   * Also unsubscribes from form changes
   */
  clearForm(): void {
    if (this.formStatusSubscription) {
      this.formStatusSubscription.unsubscribe();
      this.formStatusSubscription = null;
    }
    this.currentForm.set(null);
    this.formDirtySignal.set(false);
    this.dirtySignal.set(false);
    console.log('🧹 Form/signal cleared and subscriptions unsubscribed');
  }

  /**
   * Clear dirty signal only (for signal-based components)
   */
  clearDirtySignal(): void {
    this.dirtySignal.set(false);
  }

  /**
   * Save the current step's data
   * Returns success status
   */
  async saveCurrentStep(): Promise<{ success: boolean; error?: string }> {
    if (this.isSavingState()) {
      return { success: false, error: 'Save already in progress' };
    }

    try {
      this.isSavingState.set(true);

      const form = this.currentForm();

      // If form-based: validate form before saving
      if (form && form.invalid) {
        const error = 'Please fix validation errors before saving';
        this.toastService.error(error);
        console.warn('⚠️ ' + error);
        return { success: false, error };
      }

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

      // Mark form as pristine after successful save (if form exists)
      if (form) {
        form.markAsPristine();
      }

      // Update signal to reflect pristine state
      this.formDirtySignal.set(false);
      this.dirtySignal.set(false);

      // Update state on success
      this.lastSavedState.set(new Date());

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
   * Reset change detection when navigating away from step
   * Clears the form reference and subscriptions
   */
  resetChangeDetection(): void {
    this.clearForm();
  }

  /**
   * Debug: Log current state
   */
  debug() {
    const form = this.currentForm();
    console.log('StepSaveService Debug:', {
      hasForm: !!form,
      formDirty: form?.dirty,
      formDirtySignal: this.formDirtySignal(),
      dirtySignal: this.dirtySignal(),
      hasUnsavedChanges: this.hasUnsavedChanges(),
      isSaving: this.isSavingState(),
      lastSaved: this.lastSavedState(),
    });
  }
}
