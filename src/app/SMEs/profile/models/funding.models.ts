import {
  BoardMember,
  ManagementMember,
} from '../../applications/models/funding-application.models';
import { CommitteeMember } from '../../applications/models/profile.models';

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
    businessPhone?: string;
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

  supportingDocuments?: Record<string, any>;
}

// import {
//   BoardMember,
//   ManagementMember,
// } from '../../applications/models/funding-application.models';
// import { CommitteeMember } from '../../applications/models/profile.models';

// export interface ApplicationProfileData {
//   adminInformation?: Record<string, any>;
//   documents?: Record<string, any>;
//   businessReview?: Record<string, any>;
//   swotAnalysis?: {
//     strengths: string[];
//     weaknesses: string[];
//     opportunities: string[];
//     threats: string[];
//   };
//   managementGovernance?: {
//     managementTeam: any[];
//     boardOfDirectors: any[];
//     managementCommittee: any[];
//   };
//   businessPlan?: Record<string, any>;
//   financialAnalysis?: Record<string, any>;
// }

// export interface ProfileData {
//   // Personal Info
//   personalInfo?: {
//     firstName: string;
//     lastName: string;
//     email: string;
//     phone: string;
//     idNumber: string;
//     position: string;
//   };

//   // Business Info - EXPANDED with missing fields
//   businessInfo?: {
//     companyName: string;
//     registrationNumber: string;
//     vatNumber?: string;
//     industry: string;
//     yearsInOperation: number;
//     numberOfEmployees: string;
//     businessPhone?: string;
//     businessStage?: string;
//     bbbeeLevel?: string;
//     cipcReturns?: string;
//     incomeTaxNumber?: string;
//     workmansCompensation?: string;
//     physicalAddress: {
//       street: string;
//       city: string;
//       province: string;
//       postalCode: string;
//     };
//   };

//   // Financial Info
//   financialInfo?: {
//     monthlyRevenue: string;
//     annualRevenue: string;
//     profitMargin: string;
//     existingDebt: string;
//     creditRating: string;
//     bankingDetails: {
//       bankName: string;
//       accountType: string;
//       yearsWithBank: number;
//     };
//   };

//   // Funding Requirements
//   fundingInfo?: {
//     amountRequired: string;
//     purposeOfFunding: string;
//     timelineRequired: string;
//     repaymentPeriod: string;
//     collateralAvailable: boolean;
//     collateralDescription?: string;
//   };

//   // Documents - UNIFIED
//   documents?: {
//     cipDocument?: File;
//     financialStatements?: File;
//     bankStatements?: File;
//     managementAccounts?: File;
//     businessPlan?: File;
//     taxClearance?: File;
//   };

//   // Supporting Documents (same as documents, for compatibility)
//   supportingDocuments?: Record<string, any>;

//   // Management & Governance
//   managementGovernance?: {
//     managementTeam: ManagementMember[];
//     boardOfDirectors: BoardMember[];
//     managementCommittee: CommitteeMember[];
//   };

//   // Business Review - EXPANDED with actual fields
//   businessReview?: {
//     businessModel: string;
//     valueProposition: string;
//     targetMarkets: string[];
//     customerSegments: string;
//     marketSize: string;
//     competitivePosition: string;
//     marketShare?: number;
//     growthRate?: number;
//     operationalCapacity: string;
//     supplyChain: string;
//     technologyUse: string;
//     qualityStandards: string;
//     keyPerformanceIndicators: Array<{
//       metric: string;
//       value: number;
//       unit: string;
//       period: string;
//     }>;
//     salesChannels: string[];
//     customerRetention?: number;
//   };

//   // SWOT Analysis
//   swotAnalysis?: {
//     strengths: string[];
//     weaknesses: string[];
//     opportunities: string[];
//     threats: string[];
//     strategicPriorities?: string[];
//     riskMitigation?: string[];
//     competitiveAdvantages?: string[];
//   };

//   // Business Plan - EXPANDED with actual fields
//   businessPlan?: {
//     executiveSummary: string;
//     missionStatement: string;
//     visionStatement: string;
//     strategicObjectives: string[];
//     marketAnalysis: string;
//     competitiveStrategy: string;
//     pricingStrategy: string;
//     marketingStrategy: string;
//     expansionPlans: string;
//     productDevelopment: string;
//     marketEntry: string;
//     scalingStrategy: string;
//     revenueProjections: Array<{
//       year: number;
//       amount: number;
//       assumptions: string;
//     }>;
//     profitabilityTimeline: string;
//     breakEvenAnalysis: string;
//     returnOnInvestment: string;
//     fundingRequirements?: {
//       totalAmountRequired: number;
//       currency: string;
//       fundingType:
//         | 'loan'
//         | 'grant'
//         | 'equity'
//         | 'convertible'
//         | 'revenue_share';
//       fundingPurpose: string;
//       timeline: string;
//       repaymentTerms?: string;
//       collateral?: string;
//     };
//     useOfFunds: string;
//     repaymentStrategy?: string;
//     exitStrategy?: string;
//   };

//   // Financial Analysis
//   financialAnalysis?: {
//     template?: File;
//     notes?: string;
//     incomeStatement?: any[];
//     financialRatios?: any[];
//     lastUpdated?: string;
//   };
// }
