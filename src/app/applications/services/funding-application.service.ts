// src/app/profile/services/funding-application.service.ts - Updated with Local Storage
import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { FundingApplicationProfile, FundingApplicationStep } from '../models/funding-application.models';
import { FundingApplicationBackendService } from './funding-application-backend.service';
import { AuthService } from '../../auth/auth.service';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FundingApplicationService implements OnDestroy {
  private readonly backendService = inject(FundingApplicationBackendService);
  private readonly authService = inject(AuthService);
  
  // Core application data
  private applicationData = signal<Partial<FundingApplicationProfile>>({});
  private currentStep = signal<string>('company-info');
  private completionPercentage = signal<number>(0);
  private isLoading = signal<boolean>(false);
  private lastSaved = signal<Date | null>(null);
  private lastSavedLocally = signal<Date | null>(null);
  
  // Auto-save management
  private autoSaveSubscription?: Subscription;
  private dataChangeSubject = new Subject<void>();
  private destroy$ = new Subject<void>();
  private localStorageKey = 'funding_application_draft';
  
  // Public readonly signals
  readonly data = this.applicationData.asReadonly();
  readonly currentStepId = this.currentStep.asReadonly();
  readonly completion = this.completionPercentage.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly lastSavedAt = this.lastSaved.asReadonly();
  readonly lastSavedLocallyAt = this.lastSavedLocally.asReadonly();
  
  // Application steps for SME funding
  readonly steps: FundingApplicationStep[] = [
    { 
      id: 'company-info', 
      title: 'Company Information', 
      description: 'Registration & operational details', 
      completed: false, 
      required: true,
      estimatedTime: '10 minutes'
    },
    { 
      id: 'documents', 
      title: 'Supporting Documents', 
      description: 'Required business documentation', 
      completed: false, 
      required: true,
      estimatedTime: '15 minutes',
      dependencies: ['company-info']
    },
    { 
      id: 'business-assessment', 
      title: 'Business Assessment', 
      description: 'Operations & market position', 
      completed: false, 
      required: true,
      estimatedTime: '20 minutes'
    },
    { 
      id: 'swot-analysis', 
      title: 'Strategic Analysis', 
      description: 'Strengths, opportunities & risks', 
      completed: false, 
      required: true,
      estimatedTime: '15 minutes'
    },
    { 
      id: 'management', 
      title: 'Leadership & Governance', 
      description: 'Management team & structure', 
      completed: false, 
      required: true,
      estimatedTime: '12 minutes'
    },
    { 
      id: 'business-strategy', 
      title: 'Business Strategy', 
      description: 'Strategic plan & projections', 
      completed: false, 
      required: true,
      estimatedTime: '25 minutes'
    },
    { 
      id: 'financial-profile', 
      title: 'Financial Profile', 
      description: 'Performance & funding requirements', 
      completed: false, 
      required: true,
      estimatedTime: '18 minutes'
    }
  ];
  
  // Computed values
  readonly currentStepIndex = computed(() => {
    return this.steps.findIndex(step => step.id === this.currentStep());
  });
  
  readonly completedSteps = computed(() => {
    return this.steps.filter(step => step.completed).length;
  });
  
  readonly isApplicationComplete = computed(() => {
    return this.steps.every(step => !step.required || step.completed);
  });
  
  readonly nextRequiredStep = computed(() => {
    return this.steps.find(step => step.required && !step.completed);
  });

  constructor() {
    this.initializeAutoSave();
    this.loadFromLocalStorage();
    this.loadSavedApplication();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.autoSaveSubscription?.unsubscribe();
  }

  // ===============================
  // LOCAL STORAGE MANAGEMENT
  // ===============================

  private getLocalStorageKey(): string {
    const user = this.authService.user();
    return user ? `${this.localStorageKey}_${user.id}` : this.localStorageKey;
  }

  private saveToLocalStorage() {
    try {
      const dataToSave = {
        applicationData: this.applicationData(),
        currentStep: this.currentStep(),
        completionPercentage: this.completionPercentage(),
        stepCompletionStatus: this.steps.map(step => ({
          id: step.id,
          completed: step.completed
        })),
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(dataToSave));
      this.lastSavedLocally.set(new Date());
      console.log('✅ Data saved to local storage');
    } catch (error) {
      console.error('❌ Failed to save to local storage:', error);
    }
  }

  private loadFromLocalStorage() {
    try {
      const savedData = localStorage.getItem(this.getLocalStorageKey());
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        // Restore application data
        this.applicationData.set(parsed.applicationData || {});
        this.currentStep.set(parsed.currentStep || 'company-info');
        this.completionPercentage.set(parsed.completionPercentage || 0);
        
        // Restore step completion status
        if (parsed.stepCompletionStatus) {
          parsed.stepCompletionStatus.forEach((stepStatus: any) => {
            const step = this.steps.find(s => s.id === stepStatus.id);
            if (step) {
              step.completed = stepStatus.completed;
            }
          });
        }
        
        this.lastSavedLocally.set(new Date(parsed.lastSaved));
        console.log('✅ Data loaded from local storage');
      }
    } catch (error) {
      console.error('❌ Failed to load from local storage:', error);
    }
  }

  clearLocalStorage() {
    try {
      localStorage.removeItem(this.getLocalStorageKey());
      this.lastSavedLocally.set(null);
      console.log('✅ Local storage cleared');
    } catch (error) {
      console.error('❌ Failed to clear local storage:', error);
    }
  }

  // ===============================
  // DATA UPDATE METHODS (Now with local save)
  // ===============================

  updateCompanyInfo(data: any) {
    this.applicationData.update(current => ({
      ...current,
      companyInfo: data
    }));
    this.markStepCompleted('company-info');
    this.triggerDataChange();
    this.saveToLocalStorage(); // ✅ Save locally immediately
  }

  updateSupportingDocuments(data: any) {
    this.applicationData.update(current => ({
      ...current,
      supportingDocuments: data
    }));
    this.markStepCompleted('documents');
    this.triggerDataChange();
    this.saveToLocalStorage(); // ✅ Save locally immediately
  }

  updateBusinessAssessment(data: any) {
    this.applicationData.update(current => ({
      ...current,
      businessAssessment: data
    }));
    this.markStepCompleted('business-assessment');
    this.triggerDataChange();
    this.saveToLocalStorage(); // ✅ Save locally immediately
  }

  updateSwotAnalysis(data: any) {
    this.applicationData.update(current => ({
      ...current,
      swotAnalysis: data
    }));
    this.markStepCompleted('swot-analysis');
    this.triggerDataChange();
    this.saveToLocalStorage(); // ✅ Save locally immediately
  }

  updateManagementStructure(data: any) {
    this.applicationData.update(current => ({
      ...current,
      managementStructure: data
    }));
    this.markStepCompleted('management');
    this.triggerDataChange();
    this.saveToLocalStorage(); // ✅ Save locally immediately
  }

  updateBusinessStrategy(data: any) {
    this.applicationData.update(current => ({
      ...current,
      businessStrategy: data
    }));
    this.markStepCompleted('business-strategy');
    this.triggerDataChange();
    this.saveToLocalStorage(); // ✅ Save locally immediately
  }

  updateFinancialProfile(data: any) {
    this.applicationData.update(current => ({
      ...current,
      financialProfile: data
    }));
    this.markStepCompleted('financial-profile');
    this.triggerDataChange();
    this.saveToLocalStorage(); // ✅ Save locally immediately
  }

  // ===============================
  // BACKEND SYNC METHODS
  // ===============================

  async loadSavedApplication(): Promise<void> {
    try {
      this.isLoading.set(true);
      const savedData = await this.backendService.loadSavedProfile().toPromise();
      
      if (savedData) {
        // Merge with local data (local takes precedence for newer changes)
        const localData = this.applicationData();
        const mergedData = this.mergeApplicationData(localData, savedData);
        
        this.applicationData.set(mergedData);
        this.updateCompletionFromData();
        this.updateStepCompletionStatus();
        this.lastSaved.set(new Date());
        console.log('✅ Data loaded from backend and merged with local');
      }
    } catch (error) {
      console.error('❌ Failed to load from backend:', error);
      // Local data is still available, so not critical
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveToBackend(force: boolean = false): Promise<boolean> {
    try {
      const currentData = this.applicationData();
      
      if (!force && this.isDataEmpty(currentData)) {
        return true; // No need to save empty data
      }

      const response = await this.backendService.saveCompleteProfile(currentData).toPromise();
      
      if (response?.success) {
        this.lastSaved.set(new Date());
        console.log('✅ Data saved to backend');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to save to backend:', error);
      return false;
    }
  }

  // ===============================
  // AUTO-SAVE FUNCTIONALITY
  // ===============================

  private initializeAutoSave() {
    // Auto-save to backend every 2 minutes when data changes
    this.dataChangeSubject.pipe(
      debounceTime(120000), // 2 minutes
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.performBackendAutoSave();
    });
  }

  private async performBackendAutoSave() {
    const user = this.authService.user();
    if (!user) return;

    const currentData = this.applicationData();
    if (this.isDataEmpty(currentData)) return;

    try {
      await this.backendService.autoSaveProfile(currentData).toPromise();
      this.lastSaved.set(new Date());
      console.log('✅ Auto-save to backend completed');
    } catch (error) {
      console.error('❌ Auto-save to backend failed:', error);
    }
  }

  private triggerDataChange() {
    this.updateCompletionFromData();
    this.dataChangeSubject.next(); // Triggers backend auto-save
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private mergeApplicationData(localData: any, backendData: any): any {
    // Simple merge strategy: local data takes precedence
    // In production, you might want more sophisticated merging
    return {
      ...backendData,
      ...localData
    };
  }

  private markStepCompleted(stepId: string) {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.completed = true;
    }
  }

  private updateCompletionFromData() {
    const totalSteps = this.steps.length;
    const completedSteps = this.steps.filter(step => step.completed).length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);
    this.completionPercentage.set(percentage);
  }

  private updateStepCompletionStatus() {
    const currentData = this.applicationData();
    
    // Update completion status based on data presence
    this.steps.forEach(step => {
      const hasData = this.hasDataForStep(step.id, currentData);
      step.completed = hasData;
    });
    
    this.updateCompletionFromData();
  }

  private hasDataForStep(stepId: string, data: Partial<FundingApplicationProfile>): boolean {
    switch (stepId) {
      case 'company-info':
        return !!data.companyInfo && this.isObjectNotEmpty(data.companyInfo);
      case 'documents':
        return !!data.supportingDocuments && this.isObjectNotEmpty(data.supportingDocuments);
      case 'business-assessment':
        return !!data.businessAssessment && this.isObjectNotEmpty(data.businessAssessment);
      case 'swot-analysis':
        return !!data.swotAnalysis && this.hasMinimumSwotData(data.swotAnalysis);
      case 'management':
        return !!data.managementStructure && this.isObjectNotEmpty(data.managementStructure);
      case 'business-strategy':
        return !!data.businessStrategy && this.isObjectNotEmpty(data.businessStrategy);
      case 'financial-profile':
        return !!data.financialProfile && this.isObjectNotEmpty(data.financialProfile);
      default:
        return false;
    }
  }

  private hasMinimumSwotData(swot: any): boolean {
    return swot.strengths?.length >= 2 && 
           swot.weaknesses?.length >= 2 && 
           swot.opportunities?.length >= 2 && 
           swot.threats?.length >= 2;
  }

  private isDataEmpty(data: any): boolean {
    if (!data || typeof data !== 'object') return true;
    return Object.values(data).every(value => 
      value === null || 
      value === undefined || 
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && this.isObjectNotEmpty(value) === false)
    );
  }

  private isObjectNotEmpty(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    return Object.values(obj).some(value => 
      value !== null && 
      value !== undefined && 
      value !== '' &&
      (Array.isArray(value) ? value.length > 0 : true)
    );
  }

  // ===============================
  // NAVIGATION METHODS
  // ===============================

  setCurrentStep(stepId: string) {
    if (this.isValidStep(stepId)) {
      this.currentStep.set(stepId);
      this.saveToLocalStorage(); // Save navigation state
    }
  }

  nextStep() {
    const currentIndex = this.currentStepIndex();
    if (currentIndex < this.steps.length - 1) {
      this.currentStep.set(this.steps[currentIndex + 1].id);
      this.saveToLocalStorage(); // Save navigation state
    }
  }

  previousStep() {
    const currentIndex = this.currentStepIndex();
    if (currentIndex > 0) {
      this.currentStep.set(this.steps[currentIndex - 1].id);
      this.saveToLocalStorage(); // Save navigation state
    }
  }

  private isValidStep(stepId: string): boolean {
    return this.steps.some(step => step.id === stepId);
  }

  // ===============================
  // MANUAL SAVE METHODS
  // ===============================

  async saveCurrentProgress(): Promise<boolean> {
    const success = await this.saveToBackend(true);
    if (success) {
      console.log('✅ Manual save to backend completed');
    }
    return success;
  }

  async saveAndExit(): Promise<boolean> {
    const success = await this.saveToBackend(true);
    if (success) {
      console.log('✅ Application saved successfully');
      // Could clear local storage after successful backend save
      // this.clearLocalStorage();
    }
    return success;
  }

  // ===============================
  // SUBMISSION
  // ===============================

  async submitForReview(): Promise<{ success: boolean; applicationId?: string; error?: string }> {
    try {
      if (!this.isApplicationComplete()) {
        return { success: false, error: 'Application is not complete' };
      }

      const response = await this.backendService.submitProfileForReview(this.applicationData()).toPromise();
      
      if (response?.success) {
        // Clear local storage after successful submission
        this.clearLocalStorage();
        return { success: true, applicationId: response.applicationId };
      }
      
      return { success: false, error: 'Failed to submit application' };
    } catch (error) {
      console.error('❌ Failed to submit application:', error);
      return { success: false, error: 'Failed to submit application' };
    }
  }
}