 
// src/app/profile/services/sme-profile-steps.service.ts - UPDATED WITH REAL BACKEND INTEGRATION
import { Injectable, signal, computed, inject } from '@angular/core';
 
import { FundingProfileBackendService } from './funding-profile-backend.service';
 
import { AuthService } from '../../auth/production.auth.service'; 
import { ProfileDataTransformerService } from './profile-data-transformer.service';
import { ProfileData, ProfileStep } from '../applications/models/profile.models';

@Injectable({
  providedIn: 'root'
})
export class SMEProfileStepsService {
  private readonly backendService = inject(FundingProfileBackendService);
  private readonly transformer = inject(ProfileDataTransformerService);
  private readonly authService = inject(AuthService);

  private profileData = signal<Partial<ProfileData>>({});
  private currentStep = signal<string>('company-info');  
  private lastSaved = signal<Date | null>(null);
  private lastSavedLocally = signal<Date | null>(null);
  private isSaving = signal<boolean>(false);
  private isLoading = signal<boolean>(false);
  
  // Public readonly signals
  data = this.profileData.asReadonly();
  currentStepId = this.currentStep.asReadonly();
  lastSavedAt = this.lastSaved.asReadonly();
  lastSavedLocallyAt = this.lastSavedLocally.asReadonly();
  loading = this.isLoading.asReadonly();
  
  private localStorageKey = 'sme_profile_draft';
  private autoSaveTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    this.loadFromStorage();
    this.loadSavedProfile(); // Load from backend on init
  }

  // Steps definition (same as before)
  steps: ProfileStep[] = [
    { 
      id: 'company-info', 
      title: 'Company Information', 
      description: 'Key administrative details', 
      completed: false, 
      required: true,
      estimatedTime: '10 min',
      priority: 'high'
    },
    { 
      id: 'documents', 
      title: 'Supporting Documents', 
      description: 'Upload required documents', 
      completed: false, 
      required: true,
      estimatedTime: '15 min',
      priority: 'high'
    },
    { 
      id: 'business-assessment', 
      title: 'Business Assessment', 
      description: 'Business operations review', 
      completed: false, 
      required: true,
      estimatedTime: '20 min',
      priority: 'high'
    },
    { 
      id: 'swot-analysis', 
      title: 'Strategic Analysis', 
      description: 'Strengths, weaknesses, opportunities, threats', 
      completed: false, 
      required: true,
      estimatedTime: '15 min',
      priority: 'medium'
    },
    { 
      id: 'management', 
      title: 'Leadership & Governance', 
      description: 'Leadership and oversight structure', 
      completed: false, 
      required: true,
      estimatedTime: '12 min',
      priority: 'high'
    },
    { 
      id: 'business-strategy', 
      title: 'Business Strategy', 
      description: 'Strategic business planning', 
      completed: false, 
      required: true,
      estimatedTime: '25 min',
      priority: 'medium'
    },
    { 
      id: 'financial-profile', 
      title: 'Financial Profile', 
      description: 'Financial performance and projections', 
      completed: false, 
      required: true,
      estimatedTime: '18 min',
      priority: 'high'
    },
    {
      id: 'review',
      title: 'Review & Analysis',
      description: 'Review your complete profile',
      completed: false,
      required: false,
      estimatedTime: '5 min',
      priority: 'low'
    }
  ];
  
  completionPercentage = computed(() => {
    const requiredSteps = this.steps.filter(step => step.required);
    const completedRequired = requiredSteps.filter(step => step.completed);
    return requiredSteps.length > 0 ? Math.round((completedRequired.length / requiredSteps.length) * 100) : 0;
  });
  
  currentStepIndex = computed(() => {
    return this.steps.findIndex(step => step.id === this.currentStep());
  });

  // ===============================
  // BACKEND INTEGRATION - FIXED
  // ===============================

  async loadSavedProfile(): Promise<void> {
    const user = this.authService.user();
    if (!user) return;

    this.isLoading.set(true);
    
    try {
      console.log('🔄 Loading saved profile from backend...');
      const fundingProfile = await this.backendService.loadSavedProfile().toPromise();
      
      if (fundingProfile) {
        // Transform backend data to UI format
        const profileData = this.transformer.transformFromFundingProfile(fundingProfile);
        
        // Merge with local data (local takes precedence for newer changes)
        const currentLocal = this.profileData();
        const mergedData = this.mergeProfileData(currentLocal, profileData);
        
        this.profileData.set(mergedData);
        this.updateStepCompletionFromData();
        this.lastSaved.set(new Date());
        console.log('✅ Profile loaded from backend and merged with local data');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load from backend, using local data only:', error);
      // Continue with local data - not critical
    } finally {
      this.isLoading.set(false);
    }
  }

  // REAL AUTO-SAVE IMPLEMENTATION - NO MORE DUMMY CODE
  private autoSave() {
    // Clear existing timeout
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    // Save to localStorage immediately
    this.saveToStorage();
    
    // Debounced backend save
    this.autoSaveTimeout = setTimeout(async () => {
      await this.saveToBackend(false); // Auto-save to backend
    }, 30000); // 30 seconds
  }

  async saveCurrentProgress(): Promise<void> {
    await this.saveToBackend(true); // Manual save
  }

  private async saveToBackend(isManual: boolean = false): Promise<void> {
    const user = this.authService.user();
    if (!user || this.isSaving()) return;

    const currentData = this.profileData();
    if (this.isDataEmpty(currentData)) {
      if (isManual) {
        console.log('ℹ️ No data to save');
      }
      return;
    }

    this.isSaving.set(true);

    try {
      // Transform UI data to backend format
      const fundingProfile = this.transformer.transformToFundingProfile(currentData);
      
      console.log(`🔄 ${isManual ? 'Manual' : 'Auto'} saving profile to backend...`);
      
      // Save to backend using real service
      const response = await this.backendService.saveCompleteProfile(fundingProfile).toPromise();
      
      if (response?.success) {
        this.lastSaved.set(new Date());
        console.log(`✅ Profile ${isManual ? 'manually' : 'auto'} saved to backend successfully`);
      } else {
        throw new Error(response?.message || 'Save failed');
      }
      
    } catch (error) {
      console.error(`❌ ${isManual ? 'Manual' : 'Auto'} save to backend failed:`, error);
      if (isManual) {
        throw error; // Re-throw for manual saves so UI can show error
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  // ===============================
  // DATA UPDATE METHODS - WITH REAL BACKEND INTEGRATION
  // ===============================
  
  updatePersonalInfo(data: ProfileData['personalInfo']) {
    this.profileData.update(current => ({
      ...current,
      personalInfo: data
    }));
    this.markStepCompleted('company-info'); // Personal info is part of company info
    this.autoSave(); // Real auto-save
  }
  
  updateBusinessInfo(data: ProfileData['businessInfo']) {
    this.profileData.update(current => ({
      ...current,
      businessInfo: data
    }));
    this.markStepCompleted('company-info');
    this.autoSave();
  }
  
  updateFinancialInfo(data: ProfileData['financialInfo']) {
    this.profileData.update(current => ({
      ...current,
      financialInfo: data
    }));
    this.markStepCompleted('financial-profile');
    this.autoSave();
  }
  
  updateFundingInfo(data: ProfileData['fundingInfo']) {
    this.profileData.update(current => ({
      ...current,
      fundingInfo: data
    }));
    this.autoSave();
  }
  
  updateDocuments(data: ProfileData['documents']) {
    this.profileData.update(current => ({
      ...current,
      documents: data
    }));
    this.markStepCompleted('documents');
    this.autoSave();
  }

  updateSupportingDocuments(data: Record<string, any>) {
    this.profileData.update(current => ({
      ...current,
      supportingDocuments: data
    }));
    this.markStepCompleted('documents');
    this.autoSave();
  }

  updateFinancialAnalysis(data: any) {
    this.profileData.update(current => ({
      ...current,
      financialAnalysis: data
    }));
    this.markStepCompleted('financial-profile');
    this.autoSave();
  }
 
  updateManagementGovernance(data: any) {
    this.profileData.update(current => ({
      ...current,
      managementGovernance: data
    }));
    this.markStepCompleted('management');
    this.autoSave();
  }

  updateBusinessReview(data: any) {
    this.profileData.update(current => ({
      ...current,
      businessReview: data
    }));
    this.markStepCompleted('business-assessment');
    this.autoSave();
  }

  updateSwotAnalysis(data: any) {
    this.profileData.update(current => ({
      ...current,
      swotAnalysis: data
    }));
    this.markStepCompleted('swot-analysis');
    this.autoSave();
  }

  updateBusinessPlan(data: any) {
    this.profileData.update(current => ({
      ...current,
      businessPlan: data
    }));
    this.markStepCompleted('business-strategy');
    this.autoSave();
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private mergeProfileData(localData: Partial<ProfileData>, backendData: Partial<ProfileData>): Partial<ProfileData> {
    // Simple merge strategy - local takes precedence for newer changes
    return {
      ...backendData,
      ...localData
    };
  }

  private updateStepCompletionFromData() {
    const currentData = this.profileData();
    
    // Update step completion based on data presence
    this.steps.forEach(step => {
      const hasData = this.hasDataForStep(step.id, currentData);
      step.completed = hasData;
    });
  }

  private hasDataForStep(stepId: string, data: Partial<ProfileData>): boolean {
    switch (stepId) {
      case 'company-info':
        return !!(data.businessInfo?.companyName || data.personalInfo?.firstName);
      case 'documents':
        return !!(data.supportingDocuments && Object.keys(data.supportingDocuments).length > 0) ||
               !!(data.documents && Object.keys(data.documents).length > 0);
      case 'business-assessment':
        return !!(data.businessReview && Object.keys(data.businessReview).length > 0);
      case 'swot-analysis':
        return !!(data.swotAnalysis?.strengths?.length || data.swotAnalysis?.weaknesses?.length);
      case 'management':
        return !!(data.managementGovernance && Object.keys(data.managementGovernance).length > 0);
      case 'business-strategy':
        return !!(data.businessPlan && Object.keys(data.businessPlan).length > 0);
      case 'financial-profile':
        return !!(data.financialInfo?.monthlyRevenue || data.financialAnalysis?.template);
      case 'review':
        return this.steps.filter(s => s.required).every(s => s.completed);
      default:
        return false;
    }
  }

  private isDataEmpty(data: Partial<ProfileData>): boolean {
    if (!data || typeof data !== 'object') return true;
    
    return Object.values(data).every(value => {
      if (value === null || value === undefined || value === '') return true;
      if (Array.isArray(value) && value.length === 0) return true;
      if (typeof value === 'object' && Object.keys(value).length === 0) return true;
      return false;
    });
  }

  private markStepCompleted(stepId: string) {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.completed = true;
    }
  }

  // ===============================
  // LOCAL STORAGE (UNCHANGED)
  // ===============================

  private saveToStorage() {
    try {
      const user = this.authService.user();
      if (!user) return;

      const dataToSave = {
        profileData: this.profileData(),
        currentStep: this.currentStep(),
        steps: this.steps,
        lastSaved: this.lastSaved(),
        userId: user.id
      };
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(dataToSave));
      this.lastSavedLocally.set(new Date());
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private loadFromStorage() {
    try {
      const user = this.authService.user();
      if (!user) return;

      const savedData = localStorage.getItem(this.localStorageKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        // Only load if it's for the current user
        if (parsed.userId === user.id) {
          if (parsed.profileData) {
            this.profileData.set(parsed.profileData);
          }
          
          if (parsed.currentStep) {
            this.currentStep.set(parsed.currentStep);
          }
          
          if (parsed.steps) {
            this.steps.forEach(step => {
              const savedStep = parsed.steps.find((s: ProfileStep) => s.id === step.id);
              if (savedStep) {
                step.completed = savedStep.completed;
              }
            });
          }
          
          if (parsed.lastSaved) {
            this.lastSavedLocally.set(new Date(parsed.lastSaved));
          }
          
          console.log('✅ Profile data loaded from localStorage');
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }

  // ===============================
  // NAVIGATION & OTHER METHODS (UNCHANGED)
  // ===============================

  setCurrentStep(stepId: string) {
    this.currentStep.set(stepId);
    this.saveToStorage();
  }
  
  nextStep() {
    const currentIndex = this.currentStepIndex();
    if (currentIndex < this.steps.length - 1) {
      this.currentStep.set(this.steps[currentIndex + 1].id);
      this.saveToStorage();
    }
  }
  
  previousStep() {
    const currentIndex = this.currentStepIndex();
    if (currentIndex > 0) {
      this.currentStep.set(this.steps[currentIndex - 1].id);
      this.saveToStorage();
    }
  }

  clearProgress() {
    this.profileData.set({});
    this.currentStep.set('company-info');
    this.lastSaved.set(null);
    this.lastSavedLocally.set(null);
    this.steps.forEach(step => step.completed = false);
    
    try {
      localStorage.removeItem(this.localStorageKey);
      console.log('🗑️ Profile progress cleared');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  // ===============================
  // GETTERS & STATUS METHODS
  // ===============================

  getLastSaved(): Date | null {
    return this.lastSaved();
  }

  getLastSavedLocally(): Date | null {
    return this.lastSavedLocally();
  }

  isSavingProgress(): boolean {
    return this.isSaving();
  }

  isStepAccessible(stepId: string): boolean {
    const step = this.steps.find(s => s.id === stepId);
    if (!step) return false;
    
    // Always allow access to completed steps
    if (step.completed) return true;
    
    // Always allow access to current step
    if (stepId === this.currentStep()) return true;
    
    // Define step dependencies
    const dependencies: { [key: string]: string[] } = {
      'company-info': [],
      'documents': [], 
      'business-assessment': [], 
      'swot-analysis': [], 
      'management': [], 
      'business-strategy': ['business-assessment'], 
      'financial-profile': [],
      'review': [] // Review can be accessed anytime
    };
    
    const stepDependencies = dependencies[stepId] || [];
    
    if (stepDependencies.length === 0) return true;
    
    return stepDependencies.every(depId => {
      const depStep = this.steps.find(s => s.id === depId);
      return depStep?.completed || false;
    });
  }

  getRemainingRequiredSteps(): ProfileStep[] {
    return this.steps.filter(step => step.required && !step.completed);
  }

  async submitProfile(): Promise<{ success: boolean; error?: string }> {
    try {
      const incompleteRequired = this.getRemainingRequiredSteps();
      if (incompleteRequired.length > 0) {
        return { 
          success: false, 
          error: `Please complete the following required sections: ${incompleteRequired.map(s => s.title).join(', ')}` 
        };
      }

      // Save current progress before submission
      await this.saveCurrentProgress();
      
      // For now, just mark as completed - no actual submission workflow
      console.log('✅ Profile completed successfully');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Profile completion failed:', error);
      return { success: false, error: 'Failed to complete profile' };
    }
  }

  // Method to get formatted time difference
  getLastSavedText(): string {
    const saved = this.lastSaved();
    if (!saved) return 'Never saved';
    
    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  // Check if profile is ready for applications
  isProfileReady(): boolean {
    const requiredSteps = this.steps.filter(step => step.required);
    return requiredSteps.every(step => step.completed);
  }

  // Get profile completion summary
  getCompletionSummary(): {
    totalSteps: number;
    completedSteps: number;
    requiredSteps: number;
    completedRequired: number;
    percentage: number;
    isComplete: boolean;
  } {
    const totalSteps = this.steps.length;
    const completedSteps = this.steps.filter(s => s.completed).length;
    const requiredSteps = this.steps.filter(s => s.required);
    const completedRequired = requiredSteps.filter(s => s.completed).length;
    const percentage = this.completionPercentage();
    
    return {
      totalSteps,
      completedSteps, 
      requiredSteps: requiredSteps.length,
      completedRequired,
      percentage,
      isComplete: completedRequired === requiredSteps.length
    };
  }
}