// src/app/profile/profile.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { ProfileManagementService } from '../../shared/services/profile-management.service';
import { FundingApplicationBackendService } from './application-management.service';

export interface ApplicationProfileData {
  adminInformation?: Record<string, any>;
  documents?: Record<string, any>;
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
}

@Injectable({
  providedIn: 'root'
})
export class FundingApplicationProfileService {
  private profileData = signal<Partial<ProfileData>>({});
  private currentStep = signal<string>('personal');
  
  // Public readonly signals
  data = this.profileData.asReadonly();
  currentStepId = this.currentStep.asReadonly();
  constructor(private applicationsProfileeManagementService: FundingApplicationBackendService) {
 
}


  
steps: ProfileStep[] = [
  { id: 'admin', title: 'Administration Information', description: 'Key administrative details', completed: false, required: true },
  { id: 'documents', title: 'Document upload', description: 'Upload required documents', completed: false, required: true },
  { id: 'business-review', title: 'Business review', description: 'Business operations review', completed: false, required: true },
  { id: 'swot', title: 'SWOT analysis', description: 'Strengths, weaknesses, opportunities, threats', completed: false, required: true },
  { id: 'management', title: 'Management Governance', description: 'Leadership and oversight structure', completed: false, required: true },
  { id: 'business-plan', title: 'Business plan', description: 'Strategic business planning', completed: false, required: true },
  { id: 'financial', title: 'Financial Analysis', description: 'Financial performance and projections', completed: false, required: true }
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
  // Add this method to the ProfileService class
updateFinancialAnalysis(data: any) {
  this.profileData.update(current => ({
    ...current,
    financialAnalysis: data
  }));
  this.markStepCompleted('financial');
}
 
  // Add new update methods
updateManagementGovernance(data: any) {
  this.profileData.update(current => ({
    ...current,
    managementGovernance: data
  }));
  this.markStepCompleted('management');
}

updateBusinessReview(data: any) {
  this.profileData.update(current => ({
    ...current,
    businessReview: data
  }));
  this.markStepCompleted('business-review');
}

updateSwotAnalysis(data: any) {
  this.profileData.update(current => ({
    ...current,
    swotAnalysis: data
  }));
  this.markStepCompleted('swot');
}

updateBusinessPlan(data: any) {
  this.profileData.update(current => ({
    ...current,
    businessPlan: data
  }));
  this.markStepCompleted('business-plan');
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
