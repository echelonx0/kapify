import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { FundingProfileBackendService } from './funding-profile-backend.service';
import { AuthService } from '../../auth/production.auth.service';
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
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

@Injectable({ providedIn: 'root' })
export class FundingProfileSetupService implements OnDestroy {
  private readonly backendService = inject(FundingProfileBackendService);
  private readonly authService = inject(AuthService);
  private readonly utilityService = inject(FundingApplicationUtilityService);
  private supabase = inject(SharedSupabaseService);

  currentSlug = signal<string | null>(null);
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
  // DATA UPDATE (MERGED - NO DUPLICATION)
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

  // Legacy individual methods for backward compatibility (thin wrappers)
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

      // Load from localStorage first (fast)
      this.loadFromLocalStorage();

      // Then load from backend (authoritative)
      const savedData = await firstValueFrom(
        this.backendService.loadSavedProfile()
      );

      if (savedData) {
        const mergedData = this.utilityService.mergeApplicationData(
          this.applicationData(),
          savedData
        );
        this.applicationData.set(mergedData);

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

      // Use actual backend service method: saveCompleteProfile()
      await firstValueFrom(this.backendService.saveCompleteProfile(data));
      this.lastSaved.set(new Date());
      console.log('✅ Application saved to backend');
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

      // Use actual backend service method: submitProfileForReview()
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
  // LOCAL STORAGE
  // ===============================

  private saveToLocalStorage() {
    try {
      const user = this.authService.user();
      if (!user) return;

      const dataToSave = {
        data: this.applicationData(),
        lastSaved: new Date().toISOString(),
        userId: user.id,
      };

      localStorage.setItem(
        AUTO_SAVE_CONFIG.localStorageKey,
        JSON.stringify(dataToSave)
      );
      this.lastSavedLocally.set(new Date());
      console.log('✅ Saved to localStorage');
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private loadFromLocalStorage() {
    try {
      const user = this.authService.user();
      if (!user) return;

      const saved = localStorage.getItem(AUTO_SAVE_CONFIG.localStorageKey);
      if (saved) {
        const parsedData = JSON.parse(saved);

        if (parsedData.userId === user.id) {
          this.applicationData.set(parsedData.data || {});
          this.updateStepCompletionStatus();
          this.lastSavedLocally.set(new Date(parsedData.lastSaved));
          console.log('✅ Loaded from localStorage');
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
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

  getCurrentSlug(): string | null {
    return this.currentSlug();
  }

  async refreshSlug(): Promise<string | null> {
    try {
      const user = this.authService.user();
      if (!user) {
        console.warn('No authenticated user');
        return null;
      }

      console.log('🔍 Fetching profile slug...');

      const { data, error } = await this.supabase
        .from('business_plan_sections')
        .select('slug')
        .eq('user_id', user.id)
        .not('slug', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // No slug yet is normal - profile hasn't been saved
        console.info('No slug found (profile not yet saved)');
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
}
