// import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core'; 
// import { FundingProfileBackendService } from './funding-profile-backend.service';
// import { AuthService } from '../../auth/production.auth.service';
// import { Subscription, Subject } from 'rxjs';
// import { debounceTime, takeUntil } from 'rxjs/operators';
// import { FundingApplicationProfile, FundingApplicationStep } from '../applications/models/funding-application.models';
// import { firstValueFrom } from 'rxjs';
// import { timeout } from 'rxjs/operators';


// @Injectable({
//   providedIn: 'root'
// })
// export class FundingProfileSetupService implements OnDestroy {
//   private readonly backendService = inject(FundingProfileBackendService);
//   private readonly authService = inject(AuthService);
  
//   // Core application data
//   private applicationData = signal<Partial<FundingApplicationProfile>>({});
//   private currentStep = signal<string>('company-info');
//   private completionPercentage = signal<number>(0);
//   private isLoading = signal<boolean>(false);
//   private lastSaved = signal<Date | null>(null);
//   private lastSavedLocally = signal<Date | null>(null);
  
//   // Auto-save management
//   private autoSaveSubscription?: Subscription;
//   private dataChangeSubject = new Subject<void>();
//   private destroy$ = new Subject<void>();
//   private localStorageKey = 'funding_application_draft';
  
//   // Public readonly signals
//   readonly data = this.applicationData.asReadonly();
//   readonly currentStepId = this.currentStep.asReadonly();
//   readonly completion = this.completionPercentage.asReadonly();
//   readonly loading = this.isLoading.asReadonly();
//   readonly lastSavedAt = this.lastSaved.asReadonly();
//   readonly lastSavedLocallyAt = this.lastSavedLocally.asReadonly();
  

//   private isSaving = signal<boolean>(false);
// readonly saving = this.isSaving.asReadonly();

//   // Application steps for SME funding
//   readonly steps: FundingApplicationStep[] = [
//     { 
//       id: 'company-info', 
//       title: 'Company Information', 
//       description: 'Registration & operational details', 
//       completed: false, 
//       required: true,
//       estimatedTime: '10 minutes'
//     },
//     { 
//       id: 'documents', 
//       title: 'Supporting Documents', 
//       description: 'Required business documentation', 
//       completed: false, 
//       required: true,
//       estimatedTime: '15 minutes',
//       dependencies: ['company-info']
//     },
//     { 
//       id: 'business-assessment', 
//       title: 'Business Assessment', 
//       description: 'Operations & market position', 
//       completed: false, 
//       required: true,
//       estimatedTime: '20 minutes'
//     },
//     { 
//       id: 'swot-analysis', 
//       title: 'Strategic Analysis', 
//       description: 'Strengths, opportunities & risks', 
//       completed: false, 
//       required: true,
//       estimatedTime: '15 minutes'
//     },
//     { 
//       id: 'management', 
//       title: 'Leadership & Governance', 
//       description: 'Management team & structure', 
//       completed: false, 
//       required: true,
//       estimatedTime: '12 minutes'
//     },
//     { 
//       id: 'business-strategy', 
//       title: 'Business Strategy', 
//       description: 'Strategic plan & projections', 
//       completed: false, 
//       required: true,
//       estimatedTime: '25 minutes'
//     },
//     { 
//       id: 'financial-profile', 
//       title: 'Financial Profile', 
//       description: 'Performance & funding requirements', 
//       completed: false, 
//       required: true,
//       estimatedTime: '18 minutes'
//     }
//   ];
  
//   // Computed values
//   readonly currentStepIndex = computed(() => {
//     return this.steps.findIndex(step => step.id === this.currentStep());
//   });
  
//   readonly completedSteps = computed(() => {
//     return this.steps.filter(step => step.completed).length;
//   });
  
//   readonly isApplicationComplete = computed(() => {
//     return this.steps.every(step => !step.required || step.completed);
//   });
  
//   readonly nextRequiredStep = computed(() => {
//     return this.steps.find(step => step.required && !step.completed);
//   });

//   constructor() {
//     this.initializeAutoSave();
//     // this.loadSavedApplication();
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//     this.autoSaveSubscription?.unsubscribe();
//   }

//   // ===============================
//   // DATA UPDATE METHODS 
//   // ===============================

//   updateCompanyInfo(data: any) {
//     this.applicationData.update(current => ({
//       ...current,
//       companyInfo: data
//     }));
//     this.markStepCompleted('company-info');
//     this.saveToLocalStorage(); // Save locally immediately
//     this.triggerDataChange(); // Trigger database save
//   }

//   updateSupportingDocuments(data: any) {
//     this.applicationData.update(current => ({
//       ...current,
//       supportingDocuments: data
//     }));
//     this.markStepCompleted('documents');
//     this.saveToLocalStorage();
//     this.triggerDataChange();
//   }

//   updateBusinessAssessment(data: any) {
//     this.applicationData.update(current => ({
//       ...current,
//       businessAssessment: data
//     }));
//     this.markStepCompleted('business-assessment');
//     this.saveToLocalStorage();
//     this.triggerDataChange();
//   }

//   updateSwotAnalysis(data: any) {
//     this.applicationData.update(current => ({
//       ...current,
//       swotAnalysis: data
//     }));
//     this.markStepCompleted('swot-analysis');
//     this.saveToLocalStorage();
//     this.triggerDataChange();
//   }

//   updateManagementStructure(data: any) {
//     this.applicationData.update(current => ({
//       ...current,
//       managementStructure: data
//     }));
//     this.markStepCompleted('management');
//     this.saveToLocalStorage();
//     this.triggerDataChange();
//   }

//   updateBusinessStrategy(data: any) {
//     this.applicationData.update(current => ({
//       ...current,
//       businessStrategy: data
//     }));
//     this.markStepCompleted('business-strategy');
//     this.saveToLocalStorage();
//     this.triggerDataChange();
//   }

//   updateFinancialProfile(data: any) {
//     this.applicationData.update(current => ({
//       ...current,
//       financialProfile: data
//     }));
//     this.markStepCompleted('financial-profile');
//     this.saveToLocalStorage();
//     this.triggerDataChange();
//   }

//   // ===============================
//   // NAVIGATION METHODS
//   // ===============================

//   setCurrentStep(stepId: string) {
//     if (this.isValidStep(stepId)) {
//       this.currentStep.set(stepId);
//     }
//   }

//   nextStep() {
//     const currentIndex = this.currentStepIndex();
//     if (currentIndex < this.steps.length - 1) {
//       this.currentStep.set(this.steps[currentIndex + 1].id);
//     }
//   }

//   previousStep() {
//     const currentIndex = this.currentStepIndex();
//     if (currentIndex > 0) {
//       this.currentStep.set(this.steps[currentIndex - 1].id);
//     }
//   }

//   goToFirstIncompleteStep() {
//     const incompleteStep = this.steps.find(step => step.required && !step.completed);
//     if (incompleteStep) {
//       this.currentStep.set(incompleteStep.id);
//     }
//   }

//   // ===============================
//   // BACKEND INTEGRATION - FIXED
//   // ===============================

//   async loadSavedApplication(): Promise<void> {
//     try {
//       this.isLoading.set(true);
      
//       // Load from localStorage first (fast)
//       this.loadFromLocalStorage();
      
//       // Then try to load from backend (slower, but authoritative)
      
//       const savedData = await firstValueFrom(this.backendService.loadSavedProfile());
      
//       if (savedData) {
//         // Merge backend data with local data (local takes precedence for newer changes)
//         const localData = this.applicationData();
//         const mergedData = this.mergeApplicationData(localData, savedData);
        
//         this.applicationData.set(mergedData);
//         this.updateCompletionFromData();
//         this.updateStepCompletionStatus();
//         this.lastSaved.set(new Date());
//         console.log('✅ Data loaded from backend and merged with local');
//       }
//     } catch (error) {
//       console.error('❌ Failed to load from backend, using local data:', error);
//       // Local data is still available, so not critical
//     } finally {
//       this.isLoading.set(false);
//     }
//   }

//   async saveToBackend(force: boolean = false): Promise<boolean> {
//     try {
//       const currentData = this.applicationData();
      
//       if (!force && this.isDataEmpty(currentData)) {
//         return true;  
//       }

//       console.log('🔄 Saving to backend...', currentData);
//       const response = await firstValueFrom(this.backendService.saveCompleteProfile(currentData).pipe(
//         timeout(30000)  
//       ));
      
//       if (response?.success) {
//         this.lastSaved.set(new Date());
//         console.log('✅ Data saved to backend successfully');
//         return true;
//       }
      
//       console.error('❌ Backend save failed:', response);
//       return false;
//     } catch (error) {
//       console.error('❌ Failed to save to backend:', error);
//       return false;
//     }
//   }

// async saveCurrentProgress(): Promise<boolean> {
//   if (this.isSaving()) return false; // Prevent concurrent saves
  
//   this.isSaving.set(true);
//   try {
//     const result = await this.saveToBackend(true);
//     return result;
//   } finally {
//     this.isSaving.set(false);
//   }
// }

//   async saveSectionToBackend(sectionId: string): Promise<boolean> {
//     try {
//       const sectionData = this.getSectionData(sectionId);
//       const isCompleted = this.isStepCompleted(sectionId);
      
//       console.log(`🔄 Saving section ${sectionId} to backend...`, sectionData);
//       const response =  await firstValueFrom( this.backendService.saveDraftSection(
//         sectionId, 
//         sectionData, 
//         isCompleted
//       ));
      
//       if (response?.section) {
//         this.lastSaved.set(new Date());
//         console.log(`✅ Section ${sectionId} saved to backend`);
//         return true;
//       }
      
//       return false;
//     } catch (error) {
//       console.error(`❌ Failed to save section ${sectionId}:`, error);
//       return false;
//     }
//   }

//   async submitForReview(): Promise<{ success: boolean; applicationId?: string; error?: string }> {
//     try {
//       if (!this.isApplicationComplete()) {
//         return { success: false, error: 'Application is not complete' };
//       }

//       const response = await firstValueFrom(this.backendService.submitProfileForReview(this.applicationData()));
      
//       if (response?.success) {
//         return { success: true, applicationId: response.applicationId };
//       }
      
//       return { success: false, error: 'Failed to submit application' };
//     } catch (error) {
//       console.error('Failed to submit application:', error);
//       return { success: false, error: 'Failed to submit application' };
//     }
//   }

//   // ===============================
//   // AUTO-SAVE FUNCTIONALITY - FIXED
//   // ===============================

//   private initializeAutoSave() {
//     // FIX: Auto-save to backend every 30 seconds when data changes (not 2 minutes)
//     this.dataChangeSubject.pipe(
//       debounceTime(30000), // 30 seconds (was 2 minutes)
//       takeUntil(this.destroy$)
//     ).subscribe(() => {
//       this.performAutoSave();
//     });
//   }

// private async performAutoSave() {
//   if (this.isSaving()) return; // Don't auto-save during manual save
  
//   const user = this.authService.user();
//   if (!user) return;

//   const currentData = this.applicationData();
//   if (this.isDataEmpty(currentData)) return;

//   try {
//     console.log('Auto-saving to backend...');
//     await firstValueFrom(this.backendService.autoSaveProfile(currentData));
//     this.lastSaved.set(new Date());
//     console.log('Auto-save completed successfully');
//   } catch (error) {
//     console.error('Auto-save failed:', error);
//   }
// }

//   private triggerDataChange() {
//     this.updateCompletionFromData();
//     this.dataChangeSubject.next(); // This will trigger backend auto-save after 30 seconds
//   }

//   // ===============================
//   // LOCAL STORAGE METHODS
//   // ===============================

//   private saveToLocalStorage() {
//     try {
//       const user = this.authService.user();
//       if (!user) return;

//       const dataToSave = {
//         data: this.applicationData(),
//         lastSaved: new Date().toISOString(),
//         userId: user.id
//       };

//       localStorage.setItem(this.localStorageKey, JSON.stringify(dataToSave));
//       this.lastSavedLocally.set(new Date());
//       console.log('✅ Data saved to localStorage');
//     } catch (error) {
//       console.error('Failed to save to localStorage:', error);
//     }
//   }

//   private loadFromLocalStorage() {
//     try {
//       const user = this.authService.user();
//       if (!user) return;

//       const saved = localStorage.getItem(this.localStorageKey);
//       if (saved) {
//         const parsedData = JSON.parse(saved);
        
//         // Only load if it's for the current user
//         if (parsedData.userId === user.id) {
//           this.applicationData.set(parsedData.data || {});
//           this.updateCompletionFromData();
//           this.updateStepCompletionStatus();
//           this.lastSavedLocally.set(new Date(parsedData.lastSaved));
//           console.log('✅ Data loaded from localStorage');
//         }
//       }
//     } catch (error) {
//       console.error('Failed to load from localStorage:', error);
//     }
//   }

//   private clearLocalStorage() {
//     try {
//       localStorage.removeItem(this.localStorageKey);
//       this.lastSavedLocally.set(null);
//       console.log('🗑️ Local storage cleared');
//     } catch (error) {
//       console.error('Failed to clear local storage:', error);
//     }
//   }

//   // ===============================
//   // UTILITY METHODS
//   // ===============================

//   private mergeApplicationData(localData: any, backendData: any): any {
//     // Simple merge strategy: local data takes precedence for newer changes
//     // In production, you might want more sophisticated merging based on timestamps
//     return {
//       ...backendData,
//       ...localData
//     };
//   }

//   private markStepCompleted(stepId: string) {
//     const step = this.steps.find(s => s.id === stepId);
//     if (step) {
//       step.completed = true;
//     }
//   }

//   private updateCompletionFromData() {
//     const totalSteps = this.steps.length;
//     const completedSteps = this.steps.filter(step => step.completed).length;
//     const percentage = Math.round((completedSteps / totalSteps) * 100);
//     this.completionPercentage.set(percentage);
//   }

//   private updateStepCompletionStatus() {
//     const currentData = this.applicationData();
    
//     // Update completion status based on data presence
//     this.steps.forEach(step => {
//       const hasData = this.hasDataForStep(step.id, currentData);
//       step.completed = hasData;
//     });
    
//     this.updateCompletionFromData();
//   }

//   private hasDataForStep(stepId: string, data: Partial<FundingApplicationProfile>): boolean {
//     switch (stepId) {
//       case 'company-info':
//         return !!data.companyInfo && this.isObjectNotEmpty(data.companyInfo);
//       case 'documents':
//         return !!data.supportingDocuments && this.isObjectNotEmpty(data.supportingDocuments);
//       case 'business-assessment':
//         return !!data.businessAssessment && this.isObjectNotEmpty(data.businessAssessment);
//       case 'swot-analysis':
//         return !!data.swotAnalysis && this.hasMinimumSwotData(data.swotAnalysis);
//       case 'management':
//         return !!data.managementStructure && this.isObjectNotEmpty(data.managementStructure);
//       case 'business-strategy':
//         return !!data.businessStrategy && this.isObjectNotEmpty(data.businessStrategy);
//       case 'financial-profile':
//         return !!data.financialProfile && this.isObjectNotEmpty(data.financialProfile);
//       default:
//         return false;
//     }
//   }

//   private hasMinimumSwotData(swot: any): boolean {
//     return swot.strengths?.length >= 2 && 
//            swot.weaknesses?.length >= 2 && 
//            swot.opportunities?.length >= 2 && 
//            swot.threats?.length >= 2;
//   }

//   private getSectionData(sectionId: string): any {
//     const data = this.applicationData();
//     switch (sectionId) {
//       case 'company-info': return data.companyInfo || {};
//       case 'documents': return data.supportingDocuments || {};
//       case 'business-assessment': return data.businessAssessment || {};
//       case 'swot-analysis': return data.swotAnalysis || {};
//       case 'management': return data.managementStructure || {};
//       case 'business-strategy': return data.businessStrategy || {};
//       case 'financial-profile': return data.financialProfile || {};
//       default: return {};
//     }
//   }

//   private isStepCompleted(stepId: string): boolean {
//     return this.steps.find(step => step.id === stepId)?.completed || false;
//   }

//   private isValidStep(stepId: string): boolean {
//     return this.steps.some(step => step.id === stepId);
//   }

//   private isDataEmpty(data: any): boolean {
//     if (!data || typeof data !== 'object') return true;
//     return Object.values(data).every(value => 
//       value === null || 
//       value === undefined || 
//       value === '' ||
//       (Array.isArray(value) && value.length === 0) ||
//       (typeof value === 'object' && this.isObjectNotEmpty(value) === false)
//     );
//   }

//   private isObjectNotEmpty(obj: any): boolean {
//     if (!obj || typeof obj !== 'object') return false;
//     return Object.values(obj).some(value => 
//       value !== null && 
//       value !== undefined && 
//       value !== '' &&
//       (Array.isArray(value) ? value.length > 0 : true)
//     );
//   }

//   // ===============================
//   // MANUAL SAVE METHODS
//   // ===============================

//   async saveAndExit(): Promise<boolean> {
//     const success = await this.saveToBackend(true);
//     if (success) {
//       console.log('✅ Application saved successfully');
//       return true;  
//     }
//     return success;
//   }

//   // ===============================
//   // HELPER METHODS FOR COMPONENTS
//   // ===============================

//   getStepProgress(stepId: string): number {
//     const step = this.steps.find(s => s.id === stepId);
//     return step?.completed ? 100 : 0;
//   }

//   canNavigateToStep(stepId: string): boolean {
//     const step = this.steps.find(s => s.id === stepId);
//     if (!step) return false;
    
//     // Check if dependencies are met
//     if (step.dependencies) {
//       return step.dependencies.every(depId => 
//         this.steps.find(s => s.id === depId)?.completed
//       );
//     }
    
//     return true;
//   }

//   getEstimatedTimeRemaining(): string {
//     const incompleteSteps = this.steps.filter(step => step.required && !step.completed);
//     const totalMinutes = incompleteSteps.reduce((total, step) => {
//       const time = step.estimatedTime?.match(/(\d+) minutes?/);
//       return total + (time ? parseInt(time[1]) : 10);
//     }, 0);
    
//     if (totalMinutes < 60) {
//       return `${totalMinutes} minutes`;
//     } else {
//       const hours = Math.floor(totalMinutes / 60);
//       const minutes = totalMinutes % 60;
//       return `${hours}h ${minutes}m`;
//     }
//   }
// }

import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { FundingProfileBackendService } from './funding-profile-backend.service'; 
import { AuthService } from '../../auth/production.auth.service';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { FundingApplicationProfile, FundingApplicationStep } from '../applications/models/funding-application.models';
import { firstValueFrom } from 'rxjs';
import { FUNDING_STEPS, AUTO_SAVE_CONFIG, SECTION_DATA_KEYS } from './funding-steps.constants';
import { FundingApplicationUtilityService } from './utility.service';

@Injectable({ providedIn: 'root' })
export class FundingProfileSetupService implements OnDestroy {
  private readonly backendService = inject(FundingProfileBackendService);
  private readonly authService = inject(AuthService);
  private readonly utilityService = inject(FundingApplicationUtilityService);
  
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
  readonly steps: FundingApplicationStep[] = FUNDING_STEPS.map(step => ({ ...step }));
  
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
    
    this.applicationData.update(current => ({
      ...current,
      [key]: data
    }));
    
    this.markStepCompleted(stepId);
    this.saveToLocalStorage();
    this.triggerDataChange();
  }
  
  // Legacy individual methods for backward compatibility (thin wrappers)
  updateCompanyInfo(data: any) { this.updateSectionData('company-info', data); }
  updateSupportingDocuments(data: any) { this.updateSectionData('documents', data); }
  updateBusinessAssessment(data: any) { this.updateSectionData('business-assessment', data); }
  updateSwotAnalysis(data: any) { this.updateSectionData('swot-analysis', data); }
  updateManagementStructure(data: any) { this.updateSectionData('management', data); }
  updateBusinessStrategy(data: any) { this.updateSectionData('business-strategy', data); }
  updateFinancialProfile(data: any) { this.updateSectionData('financial-profile', data); }

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
    const incompleteStep = this.steps.find(step => step.required && !step.completed);
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
      const savedData = await firstValueFrom(this.backendService.loadSavedProfile());
      
      if (savedData) {
        const mergedData = this.utilityService.mergeApplicationData(
          this.applicationData(),
          savedData
        );
        this.applicationData.set(mergedData);
        this.updateStepCompletionStatus();
        this.lastSaved.set(new Date());
      }
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
    this.dataChangeSubject.pipe(
      debounceTime(AUTO_SAVE_CONFIG.debounceMs),
      takeUntil(this.destroy$)
    ).subscribe(() => {
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
        userId: user.id
      };

      localStorage.setItem(AUTO_SAVE_CONFIG.localStorageKey, JSON.stringify(dataToSave));
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

  private clearLocalStorage() {
    try {
      localStorage.removeItem(AUTO_SAVE_CONFIG.localStorageKey);
      this.lastSavedLocally.set(null);
      console.log('🗑️ Local storage cleared');
    } catch (error) {
      console.error('Failed to clear local storage:', error);
    }
  }

  // ===============================
  // STEP COMPLETION & VALIDATION
  // ===============================

  private markStepCompleted(stepId: string) {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.completed = true;
    }
  }

  private updateStepCompletionStatus() {
    const currentData = this.applicationData();
    
    this.steps.forEach(step => {
      step.completed = this.utilityService.hasDataForStep(step.id, currentData);
    });
    
    this.updateCompletionPercentage();
  }

  private updateCompletionPercentage() {
    const totalSteps = this.steps.length;
    const completed = this.completedSteps();
    const percentage = this.utilityService.calculateCompletionPercentage(completed, totalSteps);
    this.completionPercentage.set(percentage);
  }

  private isValidStep(stepId: string): boolean {
    return this.steps.some(step => step.id === stepId);
  }

  // ===============================
  // QUERY HELPERS FOR COMPONENTS
  // ===============================

  getStepProgress(stepId: string): number {
    const step = this.steps.find(s => s.id === stepId);
    return step?.completed ? 100 : 0;
  }

  canNavigateToStep(stepId: string): boolean {
    const step = this.steps.find(s => s.id === stepId);
    if (!step) return false;
    
    if (step.dependencies) {
      return step.dependencies.every(depId => 
        this.steps.find(s => s.id === depId)?.completed
      );
    }
    
    return true;
  }

  getEstimatedTimeRemaining(): string {
    const incompleteSteps = this.steps.filter(step => step.required && !step.completed);
    return this.utilityService.calculateTotalTimeFromSteps(incompleteSteps);
  }

  getSectionData(stepId: string): any {
    return this.utilityService.getSectionData(stepId, this.applicationData());
  }

  getMissingFieldsForStep(stepId: string): string[] {
    return this.utilityService.getMissingFieldsForStep(stepId, this.applicationData());
  }
}