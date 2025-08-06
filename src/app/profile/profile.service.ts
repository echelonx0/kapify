// src/app/profile/profile.service.ts
import { Injectable, signal, computed } from '@angular/core';

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
}

export interface ProfileStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private profileData = signal<Partial<ProfileData>>({});
  private currentStep = signal<string>('personal');
  
  // Public readonly signals
  data = this.profileData.asReadonly();
  currentStepId = this.currentStep.asReadonly();
  
  steps: ProfileStep[] = [
    { id: 'personal', title: 'Personal Information', description: 'Tell us about yourself', completed: false, required: true },
    { id: 'business', title: 'Business Details', description: 'Company information and structure', completed: false, required: true },
    { id: 'financial', title: 'Financial Overview', description: 'Revenue, expenses, and banking', completed: false, required: true },
    { id: 'funding', title: 'Funding Requirements', description: 'What you need and why', completed: false, required: true },
    { id: 'documents', title: 'Supporting Documents', description: 'Upload required documents', completed: false, required: true }
  ];
  
  completionPercentage = computed(() => {
    const completedSteps = this.steps.filter(step => step.completed).length;
    return Math.round((completedSteps / this.steps.length) * 100);
  });
  
  currentStepIndex = computed(() => {
    return this.steps.findIndex(step => step.id === this.currentStep());
  });
  
  updatePersonalInfo(data: ProfileData['personalInfo']) {
    this.profileData.update(current => ({
      ...current,
      personalInfo: data
    }));
    this.markStepCompleted('personal');
  }
  
  updateBusinessInfo(data: ProfileData['businessInfo']) {
    this.profileData.update(current => ({
      ...current,
      businessInfo: data
    }));
    this.markStepCompleted('business');
  }
  
  updateFinancialInfo(data: ProfileData['financialInfo']) {
    this.profileData.update(current => ({
      ...current,
      financialInfo: data
    }));
    this.markStepCompleted('financial');
  }
  
  updateFundingInfo(data: ProfileData['fundingInfo']) {
    this.profileData.update(current => ({
      ...current,
      fundingInfo: data
    }));
    this.markStepCompleted('funding');
  }
  
  updateDocuments(data: ProfileData['documents']) {
    this.profileData.update(current => ({
      ...current,
      documents: data
    }));
    this.markStepCompleted('documents');
  }
  
  setCurrentStep(stepId: string) {
    this.currentStep.set(stepId);
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
  
  private markStepCompleted(stepId: string) {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.completed = true;
    }
  }
  
  async submitProfile(): Promise<{ success: boolean; error?: string }> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to submit profile' };
    }
  }
}
