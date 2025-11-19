import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { FundingProfileBackendService } from './funding-profile-backend.service';
import { AuthService } from '../../auth/production.auth.service';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import {
  FundingApplicationProfile,
  FundingApplicationStep,
} from '../applications/models/funding-application.models';
import { firstValueFrom } from 'rxjs';
import {
  FUNDING_STEPS,
  AUTO_SAVE_CONFIG,
  SECTION_DATA_KEYS,
} from './funding-steps.constants';
import { FundingApplicationUtilityService } from './utility.service';

@Injectable({ providedIn: 'root' })
export class FundingProfileSetupService implements OnDestroy {
  private readonly backendService = inject(FundingProfileBackendService);
  private readonly authService = inject(AuthService);
  private readonly utilityService = inject(FundingApplicationUtilityService);
  private readonly supabase = inject(SharedSupabaseService);

  // ===== ORGANIZATION CONTEXT =====
  currentOrganization = signal<string | null>(null);
  currentSlug = signal<string | null>(null);
  organizationError = signal<string | null>(null);

  // Core application data
  private applicationData = signal<Partial<FundingApplicationProfile>>({});
  private currentStep = signal<string>('company-info');
  private completionPercentage = signal<number>(0);
  private isLoading = signal<boolean>(false);
  private isSaving = signal<boolean>(false);
  private lastSaved = signal<Date | null>(null);
  private lastSavedLocally = signal<Date | null>(null);

  // Auto-save management
  private autoSaveSubscription?: Subscription;
  private dataChangeSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  // Readonly public signals
  readonly data = this.applicationData.asReadonly();
  readonly currentStepId = this.currentStep.asReadonly();
  readonly completion = this.completionPercentage.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly saving = this.isSaving.asReadonly();
  readonly lastSavedAt = this.lastSaved.asReadonly();
  readonly lastSavedLocallyAt = this.lastSavedLocally.asReadonly();

  // Immutable steps
  readonly steps: FundingApplicationStep[] = FUNDING_STEPS.map((step) => ({
    ...step,
  }));

  // Computed values
  readonly currentStepIndex = computed(() => {
    return this.steps.findIndex((step) => step.id === this.currentStep());
  });

  readonly completedSteps = computed(() => {
    return this.steps.filter((step) => step.completed).length;
  });

  readonly isApplicationComplete = computed(() => {
    return this.steps.every((step) => !step.required || step.completed);
  });

  readonly nextRequiredStep = computed(() => {
    return this.steps.find((step) => step.required && !step.completed);
  });

  constructor() {
    this.initializeAutoSave();
    this.loadSavedApplication();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.autoSaveSubscription?.unsubscribe();
  }

  // ===============================
  // ORGANIZATION HELPERS
  // ===============================

  /**
   * Get user's active organization (cached)
   * Throws error if organization not found - fail fast approach
   */
  private async getUserOrganization(userId: string): Promise<string> {
    // Return cached organization if available
    const cached = this.currentOrganization();
    if (cached) {
      return cached;
    }

    try {
      const { data, error } = await this.supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !data?.organization_id) {
        const errorMsg = 'No active organization found for user';
        this.organizationError.set(errorMsg);
        throw new Error(errorMsg);
      }

      // Cache the organization ID
      this.setOrganizationContext(data.organization_id);
      return data.organization_id;
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to get user organization';
      this.organizationError.set(errorMsg);
      console.error('Failed to get user organization:', error);
      throw new Error(errorMsg);
    }
  }

  /**
   * Set current organization context
   */
  private setOrganizationContext(organizationId: string): void {
    this.currentOrganization.set(organizationId);
    this.organizationError.set(null); // Clear any previous errors
    console.log('📦 Organization context set:', organizationId);
  }

  /**
   * Clear organization context (useful for logout/switch scenarios)
   */
  clearOrganizationContext(): void {
    this.currentOrganization.set(null);
    this.organizationError.set(null);
    console.log('📦 Organization context cleared');
  }

  /**
   * Get organization ID or throw if not available
   */
  getOrganizationId(): string {
    const orgId = this.currentOrganization();
    if (!orgId) {
      throw new Error('Organization context not initialized');
    }
    return orgId;
  }

  // ===============================
  // DATA UPDATE
  // ===============================

  updateSectionData(stepId: string, data: any): void {
    const key = SECTION_DATA_KEYS[stepId as keyof typeof SECTION_DATA_KEYS];
    if (!key) return;

    this.applicationData.update((current) => ({
      ...current,
      [key]: data,
    }));

    this.markStepCompleted(stepId);
    this.saveToLocalStorage();
    this.triggerDataChange();
  }

  // Legacy methods for backward compatibility
  updateCompanyInfo(data: any) {
    this.updateSectionData('company-info', data);
  }
  updateSupportingDocuments(data: any) {
    this.updateSectionData('documents', data);
  }
  updateBusinessAssessment(data: any) {
    this.updateSectionData('business-assessment', data);
  }
  updateSwotAnalysis(data: any) {
    this.updateSectionData('swot-analysis', data);
  }
  updateManagementStructure(data: any) {
    this.updateSectionData('management', data);
  }
  updateBusinessStrategy(data: any) {
    this.updateSectionData('business-strategy', data);
  }
  updateFinancialProfile(data: any) {
    this.updateSectionData('financial-profile', data);
  }

  // ===============================
  // NAVIGATION
  // ===============================

  setCurrentStep(stepId: string) {
    if (this.isValidStep(stepId)) {
      this.currentStep.set(stepId);
    }
  }

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

  goToFirstIncompleteStep() {
    const incompleteStep = this.steps.find(
      (step) => step.required && !step.completed
    );
    if (incompleteStep) {
      this.currentStep.set(incompleteStep.id);
    }
  }

  // ===============================
  // BACKEND INTEGRATION
  // ===============================

  async loadSavedApplication(): Promise<void> {
    try {
      this.isLoading.set(true);
      const user = this.authService.user();
      if (!user) return;

      // Set org context FIRST
      const orgId = await this.getUserOrganization(user.id);
      if (orgId) this.setOrganizationContext(orgId);

      // Then load localStorage (now has org context)
      this.loadFromLocalStorage();

      // Then sync from backend
      const savedData = await firstValueFrom(
        this.backendService.loadSavedProfile()
      );
      if (savedData) {
        const mergedData = this.utilityService.mergeApplicationData(
          this.applicationData(),
          savedData
        );
        this.applicationData.set(mergedData);
        this.updateStepCompletionStatus();
        this.lastSaved.set(new Date());
      }

      await this.refreshSlug();
    } catch (error) {
      console.error('Failed to load saved application:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async saveToBackend(exitApp: boolean = false): Promise<boolean> {
    if (this.isSaving()) return false;

    try {
      this.isSaving.set(true);
      const data = this.applicationData();

      if (this.utilityService.isDataEmpty(data)) {
        console.warn('No data to save');
        return false;
      }

      await firstValueFrom(this.backendService.saveCompleteProfile(data));
      this.lastSaved.set(new Date());
      console.log('✅ Application saved to backend');

      // Refresh slug after save
      await this.refreshSlug();

      return true;
    } catch (error) {
      console.error('Failed to save to backend:', error);
      return false;
    } finally {
      this.isSaving.set(false);
    }
  }

  async saveCurrentProgress(): Promise<boolean> {
    return this.saveToBackend(false);
  }

  async saveAndExit(): Promise<boolean> {
    return this.saveToBackend(true);
  }

  async submitForReview(): Promise<{ success: boolean; error?: string }> {
    try {
      this.isSaving.set(true);

      const result = await firstValueFrom(
        this.backendService.submitProfileForReview(this.applicationData())
      );
      return { success: result.success };
    } catch (error) {
      console.error('Failed to submit application:', error);
      return { success: false, error: 'Failed to submit application' };
    } finally {
      this.isSaving.set(false);
    }
  }

  // ===============================
  // SLUG MANAGEMENT
  // ===============================

  /**
   * Fetch and set the current profile slug
   * The slug is auto-generated by Supabase trigger when profile is saved
   */
  async refreshSlug(): Promise<string | null> {
    try {
      const orgId = this.currentOrganization();
      if (!orgId) {
        console.warn('No organization context for slug');
        return null;
      }

      console.log('🔍 Fetching profile slug for org:', orgId);

      const { data, error } = await this.supabase
        .from('business_plan_sections')
        .select('slug')
        .eq('organization_id', orgId)
        .not('slug', 'is', null)
        .limit(1)
        .single();

      if (error) {
        console.info('No slug found yet (profile may not be saved)');
        return null;
      }

      if (data?.slug) {
        this.currentSlug.set(data.slug);
        console.log('✅ Slug loaded:', data.slug);
        return data.slug;
      }

      return null;
    } catch (error) {
      console.error('❌ Error refreshing slug:', error);
      return null;
    }
  }

  /**
   * Get the public share URL for this profile
   */
  getPublicShareUrl(): string | null {
    const slug = this.currentSlug();
    if (!slug) return null;
    return `${window.location.origin}/invest/${slug}`;
  }

  getCurrentSlug(): string | null {
    return this.currentSlug();
  }

  // ===============================
  // AUTO-SAVE
  // ===============================

  private initializeAutoSave() {
    this.dataChangeSubject
      .pipe(debounceTime(AUTO_SAVE_CONFIG.debounceMs), takeUntil(this.destroy$))
      .subscribe(() => {
        this.performAutoSave();
      });
  }

  private async performAutoSave() {
    if (this.isSaving()) return;

    const user = this.authService.user();
    if (!user) return;

    const currentData = this.applicationData();
    if (this.utilityService.isDataEmpty(currentData)) return;

    try {
      console.log('Auto-saving to backend...');
      await firstValueFrom(this.backendService.autoSaveProfile(currentData));
      this.lastSaved.set(new Date());
      console.log('Auto-save completed');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  private triggerDataChange() {
    this.updateCompletionPercentage();
    this.dataChangeSubject.next();
  }

  // ===============================
  // LOCAL STORAGE WITH VERSIONING
  // ===============================

  private readonly STORAGE_VERSION = 2; // Increment when schema changes
  private readonly STORAGE_KEY = AUTO_SAVE_CONFIG.localStorageKey;

  private saveToLocalStorage() {
    try {
      const user = this.authService.user();
      if (!user) return;

      const dataToSave = {
        version: this.STORAGE_VERSION,
        data: this.applicationData(),
        lastSaved: new Date().toISOString(),
        userId: user.id,
        organizationId: this.currentOrganization(),
        timestamp: Date.now(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
      this.lastSavedLocally.set(new Date());
      console.log(`✅ Saved to localStorage (v${this.STORAGE_VERSION})`);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      // Clear corrupted data if quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearLocalStorage();
        console.warn('Cleared localStorage due to quota exceeded');
      }
    }
  }

  private loadFromLocalStorage() {
    try {
      const user = this.authService.user();
      if (!user) return;

      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return;

      const parsedData = JSON.parse(saved);

      // Validate schema version
      if (!parsedData.version || parsedData.version !== this.STORAGE_VERSION) {
        console.warn(
          `localStorage schema version mismatch (found: ${parsedData.version}, expected: ${this.STORAGE_VERSION})`
        );
        this.clearLocalStorage();
        return;
      }

      // Validate user
      if (parsedData.userId !== user.id) {
        console.warn('localStorage data belongs to different user');
        return;
      }

      // Validate data structure
      if (!this.validateLocalStorageData(parsedData.data)) {
        console.warn('Invalid localStorage data structure');
        this.clearLocalStorage();
        return;
      }

      // Load validated data
      this.applicationData.set(parsedData.data || {});
      if (parsedData.organizationId) {
        this.currentOrganization.set(parsedData.organizationId);
      }
      this.updateStepCompletionStatus();
      this.lastSavedLocally.set(new Date(parsedData.lastSaved));
      console.log(`✅ Loaded from localStorage (v${this.STORAGE_VERSION})`);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      // Clear corrupted data
      this.clearLocalStorage();
    }
  }

  /**
   * Validate localStorage data structure
   */
  private validateLocalStorageData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;

    // Basic structure validation - data should be an object
    // Can be empty for new profiles
    return true;
  }

  /**
   * Clear localStorage data
   */
  private clearLocalStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ Cleared localStorage');
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  // ===============================
  // STEP COMPLETION & VALIDATION
  // ===============================

  private markStepCompleted(stepId: string) {
    const step = this.steps.find((s) => s.id === stepId);
    if (step) {
      step.completed = true;
    }
  }

  private updateStepCompletionStatus() {
    const currentData = this.applicationData();

    this.steps.forEach((step) => {
      step.completed = this.utilityService.hasDataForStep(step.id, currentData);
    });

    this.updateCompletionPercentage();
  }

  private updateCompletionPercentage() {
    const totalSteps = this.steps.length;
    const completed = this.completedSteps();
    const percentage = this.utilityService.calculateCompletionPercentage(
      completed,
      totalSteps
    );
    this.completionPercentage.set(percentage);
  }

  private isValidStep(stepId: string): boolean {
    return this.steps.some((step) => step.id === stepId);
  }

  // ===============================
  // QUERY HELPERS FOR COMPONENTS
  // ===============================

  getStepProgress(stepId: string): number {
    const step = this.steps.find((s) => s.id === stepId);
    return step?.completed ? 100 : 0;
  }

  canNavigateToStep(stepId: string): boolean {
    const step = this.steps.find((s) => s.id === stepId);
    if (!step) return false;

    if (step.dependencies) {
      return step.dependencies.every(
        (depId) => this.steps.find((s) => s.id === depId)?.completed
      );
    }

    return true;
  }

  getEstimatedTimeRemaining(): string {
    const incompleteSteps = this.steps.filter(
      (step) => step.required && !step.completed
    );
    return this.utilityService.calculateTotalTimeFromSteps(incompleteSteps);
  }

  getSectionData(stepId: string): any {
    return this.utilityService.getSectionData(stepId, this.applicationData());
  }

  getMissingFieldsForStep(stepId: string): string[] {
    return this.utilityService.getMissingFieldsForStep(
      stepId,
      this.applicationData()
    );
  }
}
