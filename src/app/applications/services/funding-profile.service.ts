// src/app/profile/profile.service.ts - UPDATED WITH MISSING METHODS
import { Injectable, signal, computed } from '@angular/core';

export interface ApplicationProfileData {
  adminInformation?: Record<string, any>;
  supportingDocuments?: Record<string, any>; // Updated to match component usage
  businessReview?: Record<string, any>;
  swotAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  managementGovernance?: {
    managementTeam: any[];
    boardOfDirectors: any[];
    managementCommittee: any[];
  };
  businessPlan?: Record<string, any>;
  financialAnalysis?: Record<string, any>;
}

export interface ProfileData {
  // Personal Info
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idNumber: string;
    position: string;
  };
  
  // Business Info
  businessInfo: {
    companyName: string;
    registrationNumber: string;
    vatNumber?: string;
    industry: string;
    yearsInOperation: number;
    numberOfEmployees: string;
    physicalAddress: {
      street: string;
      city: string;
      province: string;
      postalCode: string;
    };
  };
  
  // Financial Info
  financialInfo: {
    monthlyRevenue: string;
    annualRevenue: string;
    profitMargin: string;
    existingDebt: string;
    creditRating: string;
    bankingDetails: {
      bankName: string;
      accountType: string;
      yearsWithBank: number;
    };
  };
  
  // Funding Requirements
  fundingInfo: {
    amountRequired: string;
    purposeOfFunding: string;
    timelineRequired: string;
    repaymentPeriod: string;
    collateralAvailable: boolean;
    collateralDescription?: string;
  };
  
  // Documents
  documents: {
    cipDocument?: File;
    financialStatements?: File;
    bankStatements?: File;
    managementAccounts?: File;
    businessPlan?: File;
    taxClearance?: File;
  };

  // New sections
  managementGovernance?: {
    managementTeam: ManagementMember[];
    boardOfDirectors: BoardMember[];
    managementCommittee: CommitteeMember[];
  };
  
  businessReview?: {
    // Business review fields
  };
  
  swotAnalysis?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  
  businessPlan?: {
    // Business plan fields
  };

  // Add this new property
  financialAnalysis?: {
    template?: File;
    notes?: string;
    incomeStatement?: any[];
    financialRatios?: any[];
    lastUpdated?: string;
  };

  // Add supporting documents for new component
  supportingDocuments?: Record<string, any>;
}

export interface ManagementMember {
  id: string;
  fullName: string;
  role: string;
  qualification: string;
  yearsOfExperience: number;
}

export interface BoardMember {
  id: string;
  fullName: string;
  role: string;
  independent: boolean;
  appointmentDate: string;
}

export interface CommitteeMember {
  id: string;
  fullName: string;
  committee: string;
  role: string;
}

export interface ProfileStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  estimatedTime?: string;
  priority?: 'high' | 'medium' | 'low';
}

@Injectable({
  providedIn: 'root'
})
export class FundingApplicationProfileService {
  private profileData = signal<Partial<ProfileData>>({});
  private currentStep = signal<string>('company-info');  
  private lastSaved = signal<Date | null>(null);
  private isSaving = signal<boolean>(false);
  
  // Public readonly signals
  data = this.profileData.asReadonly();
  currentStepId = this.currentStep.asReadonly();
  
  constructor() {
    // Load any existing data from localStorage on init
    this.loadFromStorage();
  }

  // Updated steps to match new naming convention
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
    }
  ];
  
  completionPercentage = computed(() => {
    const completedSteps = this.steps.filter(step => step.completed).length;
    return Math.round((completedSteps / this.steps.length) * 100);
  });
  
  currentStepIndex = computed(() => {
    return this.steps.findIndex(step => step.id === this.currentStep());
  });

  // ===============================
  // DATA UPDATE METHODS
  // ===============================
  
  updatePersonalInfo(data: ProfileData['personalInfo']) {
    this.profileData.update(current => ({
      ...current,
      personalInfo: data
    }));
    this.markStepCompleted('personal');
    this.autoSave();
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
    this.markStepCompleted('funding');
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

  //  Supporting Documents for enhanced upload Component
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
  // NAVIGATION METHODS
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

  // ===============================
  // SAVE & PERSISTENCE METHODS
  // ===============================

  async saveCurrentProgress(): Promise<void> {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    
    try {
      // Simulate API save - replace with actual backend call
      await this.performSave();
      
      this.lastSaved.set(new Date());
      this.saveToStorage();
      
      console.log('✅ Progress saved successfully');
    } catch (error) {
      console.error('❌ Failed to save progress:', error);
      throw error;
    } finally {
      this.isSaving.set(false);
    }
  }

  private async performSave(): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Here you would make the actual API call
    // const response = await this.http.post('/api/funding-application/save', {
    //   data: this.profileData(),
    //   currentStep: this.currentStep(),
    //   lastUpdated: new Date().toISOString()
    // }).toPromise();
    
    // For now, just save to localStorage as backup
    this.saveToStorage();
  }

  private autoSave() {
    // Debounced auto-save functionality
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    this.autoSaveTimeout = setTimeout(() => {
      this.saveCurrentProgress().catch(error => {
        console.warn('Auto-save failed:', error);
      });
    }, 2000);
  }

  private autoSaveTimeout?: ReturnType<typeof setTimeout>;

  // ===============================
  // STORAGE METHODS
  // ===============================

  private saveToStorage() {
    try {
      const dataToSave = {
        profileData: this.profileData(),
        currentStep: this.currentStep(),
        steps: this.steps,
        lastSaved: this.lastSaved()
      };
      
      localStorage.setItem('funding-application-progress', JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  private loadFromStorage() {
    try {
      const savedData = localStorage.getItem('funding-application-progress');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        
        if (parsed.profileData) {
          this.profileData.set(parsed.profileData);
        }
        
        if (parsed.currentStep) {
          this.currentStep.set(parsed.currentStep);
        }
        
        if (parsed.steps) {
          // Merge saved step completion status with current step definitions
          this.steps.forEach(step => {
            const savedStep = parsed.steps.find((s: ProfileStep) => s.id === step.id);
            if (savedStep) {
              step.completed = savedStep.completed;
            }
          });
        }
        
        if (parsed.lastSaved) {
          this.lastSaved.set(new Date(parsed.lastSaved));
        }
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }

  clearProgress() {
    this.profileData.set({});
    this.currentStep.set('company-info');
    this.lastSaved.set(null);
    this.steps.forEach(step => step.completed = false);
    
    try {
      localStorage.removeItem('funding-application-progress');
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================
  
  private markStepCompleted(stepId: string) {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.completed = true;
    }
  }

  getStepCompletionStatus(): { [stepId: string]: boolean } {
    const status: { [stepId: string]: boolean } = {};
    this.steps.forEach(step => {
      status[step.id] = step.completed;
    });
    return status;
  }

  isStepAccessible(stepId: string): boolean {
    const step = this.steps.find(s => s.id === stepId);
    if (!step) return false;
    
    // Always allow access to completed steps
    if (step.completed) return true;
    
    // Always allow access to current step
    if (stepId === this.currentStep()) return true;
    
    // Define step dependencies - more flexible approach
    const dependencies: { [key: string]: string[] } = {
      'company-info': [], // No dependencies - always accessible
      'documents': [], // Can upload docs anytime
      'business-assessment': [], // Can do business review independently  
      'swot-analysis': [], // Can do SWOT independently
      'management': [], // Can add management info anytime
      'business-strategy': ['business-assessment'], // Needs business review first
      'financial-profile': [] // Can add financials independently
    };
    
    const stepDependencies = dependencies[stepId] || [];
    
    // If no dependencies, always allow access
    if (stepDependencies.length === 0) return true;
    
    // Check if all dependencies are completed
    return stepDependencies.every(depId => {
      const depStep = this.steps.find(s => s.id === depId);
      return depStep?.completed || false;
    });
  }

  getRemainingRequiredSteps(): ProfileStep[] {
    return this.steps.filter(step => step.required && !step.completed);
  }

  // ===============================
  // SUBMISSION
  // ===============================
  
  async submitProfile(): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate all required steps are complete
      const incompleteRequired = this.getRemainingRequiredSteps();
      if (incompleteRequired.length > 0) {
        return { 
          success: false, 
          error: `Please complete the following required sections: ${incompleteRequired.map(s => s.title).join(', ')}` 
        };
      }

      // Save current progress before submission
      await this.saveCurrentProgress();
      
      // Simulate submission API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mark as submitted
      this.markSubmitted();
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to submit profile' };
    }
  }

  private markSubmitted() {
    // Mark the application as submitted
    const submissionData = {
      ...this.profileData(),
      submittedAt: new Date().toISOString(),
      status: 'submitted'
    };
    
    try {
      localStorage.setItem('funding-application-submitted', JSON.stringify(submissionData));
    } catch (error) {
      console.warn('Failed to save submission status:', error);
    }
  }

  // ===============================
  // GETTERS
  // ===============================

  getLastSaved(): Date | null {
    return this.lastSaved();
  }

  isSavingProgress(): boolean {
    return this.isSaving();
  }
}