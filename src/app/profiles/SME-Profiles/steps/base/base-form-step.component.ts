// src/app/SMEs/profile/steps/base/base-form-step.component.ts
import { OnInit, OnDestroy, inject, signal, Directive } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { interval, Subscription, Subject } from 'rxjs';
import {  takeUntil, debounceTime } from 'rxjs/operators'; 
import { FundingProfileSetupService } from 'src/app/SMEs/services/funding-profile-setup.service';

export interface StepValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
}

export interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  debounceMs: number;
  saveOnFormChange: boolean;
}

@Directive()
export abstract class BaseFormStepComponent implements OnInit, OnDestroy {
  protected profileService = inject(FundingProfileSetupService);
  protected router = inject(Router);

  // Common state signals
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);
  hasUnsavedChanges = signal(false);
  validationErrors = signal<string[]>([]);

  // Auto-save configuration (can be overridden)
  protected autoSaveConfig: AutoSaveConfig = {
    enabled: true,
    intervalMs: 30000, // 30 seconds
    debounceMs: 2000,  // 2 seconds
    saveOnFormChange: true
  };

  // Private subscriptions management
  private autoSaveSubscription?: Subscription;
  private debounceTimer?: ReturnType<typeof setTimeout>;
  private destroy$ = new Subject<void>();
  private formChangeSubject = new Subject<void>();

  // Field display name mapping for error messages
  protected fieldDisplayNames: { [key: string]: string } = {};

  ngOnInit() {
    this.initializeComponent();
  }

  ngOnDestroy() {
    this.cleanup();
  }

  // ===============================
  // ABSTRACT METHODS (Must implement in derived classes)
  // ===============================

  /**
   * Load existing data from the profile service
   */
  abstract loadExistingData(): void;

  /**
   * Build the data object to save to the service
   */
  abstract buildSaveData(): any;

  /**
   * Check if the component has any data to save
   */
  abstract hasFormData(): boolean;

  /**
   * Get the main form group for this step
   */
  abstract getFormGroup(): FormGroup;

  /**
   * Get the unique step identifier
   */
  abstract getStepId(): string;

  // ===============================
  // OPTIONAL METHODS (Can override in derived classes)
  // ===============================

  /**
   * Custom validation logic beyond form validation
   */
  protected customValidation(): StepValidationResult {
    return {
      isValid: this.getFormGroup()?.valid ?? true,
      errors: [],
      warnings: [],
      missingFields: []
    };
  }

  /**
   * Called before saving data - for preprocessing
   */
  protected beforeSave(data: any): any {
    return data;
  }

  /**
   * Called after successful save
   */
  protected afterSave(data: any): void {
    // Override in derived classes if needed
  }

  /**
   * Save data to the appropriate profile service method based on step ID
   */
  private saveToProfileService(stepId: string, data: any): void {
    switch (stepId) {
      case 'company-info':
        this.profileService.updateCompanyInfo(data);
        break;
      case 'supporting-documents':
        this.profileService.updateSupportingDocuments(data);
        break;
      case 'business-assessment':
        this.profileService.updateBusinessAssessment(data);
        break;
      case 'swot-analysis':
        this.profileService.updateSwotAnalysis(data);
        break;
      case 'management-structure':
        this.profileService.updateManagementStructure(data);
        break;
      case 'business-strategy':
        this.profileService.updateBusinessStrategy(data);
        break;
      case 'financial-profile':
        this.profileService.updateFinancialProfile(data);
        break;
      default:
        console.warn(`No update method found for step: ${stepId}`);
    }
  }

  /**
   * Called when save fails
   */
  protected onSaveError(error: any): void {
    console.error(`Failed to save ${this.getStepId()}:`, error);
  }

  /**
   * Custom initialization logic
   */
  protected customInit(): void {
    // Override in derived classes if needed
  }

  // ===============================
  // INITIALIZATION
  // ===============================

  private initializeComponent() {
    try {
      this.loadExistingData();
      this.setupAutoSave();
      this.customInit();
    } catch (error) {
      console.error(`Failed to initialize ${this.getStepId()}:`, error);
    }
  }

  private setupAutoSave() {
    if (!this.autoSaveConfig.enabled) return;

    // Periodic auto-save
    this.autoSaveSubscription = interval(this.autoSaveConfig.intervalMs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.shouldAutoSave()) {
          this.saveData(false);
        }
      });

    // Form change based save
    if (this.autoSaveConfig.saveOnFormChange) {
      this.setupFormChangeListener();
    }
  }

  private setupFormChangeListener() {
    const formGroup = this.getFormGroup();
    if (!formGroup) return;

    formGroup.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.hasUnsavedChanges.set(true);
        this.triggerDebouncedSave();
      });

    // Debounced save on form changes
    this.formChangeSubject
      .pipe(
        debounceTime(this.autoSaveConfig.debounceMs),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.shouldAutoSave()) {
          this.saveData(false);
        }
      });
  }

  private shouldAutoSave(): boolean {
    return this.hasFormData() && 
           !this.isSaving() && 
           this.hasUnsavedChanges();
  }

  private triggerDebouncedSave() {
    this.formChangeSubject.next();
  }

  // ===============================
  // SAVE OPERATIONS
  // ===============================

  /**
   * Manual save - called by UI save buttons
   */
  async saveManually(): Promise<void> {
    await this.saveData(true);
  }

  /**
   * Core save method
   */
  protected async saveData(isManual: boolean = false): Promise<void> {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    this.validationErrors.set([]);
    
    try {
      // Validate before saving
      const validation = this.customValidation();
      if (!validation.isValid && isManual) {
        this.validationErrors.set(validation.errors);
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Build and preprocess data
      let data = this.buildSaveData();
      data = this.beforeSave(data);

      // Save to service
      this.saveToProfileService(this.getStepId(), data);
      
      // Force save to backend for manual saves
      if (isManual) {
        await this.profileService.saveCurrentProgress();
      }
      
      // Update state
      this.lastSaved.set(new Date());
      this.hasUnsavedChanges.set(false);
      
      // Post-save hook
      this.afterSave(data);
      
    } catch (error) {
      this.onSaveError(error);
      if (isManual) {
        // Re-throw for UI error handling
        throw error;
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  // ===============================
  // FORM HELPERS
  // ===============================

  /**
   * Get field validation error with user-friendly message
   */
  getFieldError(fieldName: string): string | undefined {
    const formGroup = this.getFormGroup();
    if (!formGroup) return undefined;

    const field = formGroup.get(fieldName);
    if (!field?.errors || !field?.touched) return undefined;

    const displayName = this.getFieldDisplayName(fieldName);

    if (field.errors['required']) return `${displayName} is required`;
    if (field.errors['email']) return 'Please enter a valid email address';
    if (field.errors['min']) return `${displayName} must be greater than ${field.errors['min'].min}`;
    if (field.errors['max']) return `${displayName} must be less than ${field.errors['max'].max}`;
    if (field.errors['minlength']) return `${displayName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    if (field.errors['maxlength']) return `${displayName} must be no more than ${field.errors['maxlength'].requiredLength} characters`;
    if (field.errors['pattern']) return `${displayName} format is invalid`;

    // Return first error key if no specific handler
    return `${displayName} is invalid`;
  }

  /**
   * Get user-friendly field name for error messages
   */
  protected getFieldDisplayName(fieldName: string): string {
    return this.fieldDisplayNames[fieldName] || this.formatFieldName(fieldName);
  }

  /**
   * Convert camelCase field names to readable text
   */
  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  /**
   * Check if a specific field has errors
   */
  hasFieldError(fieldName: string): boolean {
    return !!this.getFieldError(fieldName);
  }

  /**
   * Mark all form fields as touched to show validation errors
   */
  markAllFieldsTouched(): void {
    const formGroup = this.getFormGroup();
    if (formGroup) {
      formGroup.markAllAsTouched();
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Get formatted last saved text for UI display
   */
  getLastSavedText(): string {
    const saved = this.lastSaved();
    if (!saved) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    return saved.toLocaleDateString();
  }

  /**
   * Calculate completion percentage for the step
   */
  getCompletionPercentage(): number {
    const formGroup = this.getFormGroup();
    if (!formGroup) return 0;

    const controls = Object.keys(formGroup.controls);
    if (controls.length === 0) return 0;

    let completedFields = 0;
    controls.forEach(controlName => {
      const control = formGroup.get(controlName);
      if (control?.value && control.value !== '' && control.valid) {
        completedFields++;
      }
    });

    return Math.round((completedFields / controls.length) * 100);
  }

  /**
   * Check if the step is considered complete
   */
  isStepComplete(): boolean {
    const formGroup = this.getFormGroup();
    const validation = this.customValidation();
    return formGroup?.valid === true && validation.isValid && this.hasFormData();
  }

  // ===============================
  // NAVIGATION HELPERS
  // ===============================

  /**
   * Navigate to previous step
   */
  goBack(): void {
    this.profileService.previousStep();
  }

  /**
   * Save and continue to next step
   */
  async saveAndContinue(): Promise<void> {
    try {
      await this.saveData(true);
      this.profileService.nextStep();
    } catch (error) {
      // Error is already handled in saveData
      console.error('Save and continue failed');
    }
  }

  /**
   * Navigate to specific step
   */
  goToStep(stepId: string): void {
    this.profileService.setCurrentStep(stepId);
    this.router.navigate(['/profile/steps', stepId]);
  }

  // ===============================
  // LIFECYCLE & CLEANUP
  // ===============================

  private cleanup(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    this.autoSaveSubscription?.unsubscribe();
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  /**
   * Check if there are unsaved changes before navigation
   */
  canDeactivate(): boolean {
    return !this.hasUnsavedChanges() || confirm('You have unsaved changes. Are you sure you want to leave?');
  }

  // ===============================
  // CONFIGURATION HELPERS
  // ===============================

  /**
   * Disable auto-save for this component
   */
  protected disableAutoSave(): void {
    this.autoSaveConfig.enabled = false;
  }

  /**
   * Configure auto-save intervals
   */
  protected configureAutoSave(config: Partial<AutoSaveConfig>): void {
    this.autoSaveConfig = { ...this.autoSaveConfig, ...config };
  }

  /**
   * Set field display names for better error messages
   */
  protected setFieldDisplayNames(names: { [key: string]: string }): void {
    this.fieldDisplayNames = { ...this.fieldDisplayNames, ...names };
  }
}