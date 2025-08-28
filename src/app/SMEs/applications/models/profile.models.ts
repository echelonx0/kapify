export interface ApplicationProfileData {
  adminInformation?: Record<string, any>;
  supportingDocuments?: Record<string, any>;  
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