import {
  BoardMember,
  ManagementMember,
} from '../../applications/models/funding-application.models';
import { CommitteeMember } from '../../applications/models/profile.models';

/**
 * CONSOLIDATED PROFILE DATA MODEL
 * Single source of truth for SME profile/funding application data
 * All fields are optional to support progressive data entry
 */
export interface ProfileData {
  // ========================================
  // PERSONAL INFORMATION
  // ========================================
  personalInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    idNumber?: string;
    position?: string;
    role?: string;
  };

  // ========================================
  // BUSINESS INFORMATION
  // ========================================
  businessInfo?: {
    // Core Details
    companyName?: string;
    registrationNumber?: string;
    vatNumber?: string;
    industry?: string;
    yearsInOperation?: number;
    numberOfEmployees?: string;
    businessPhone?: string;

    // Additional Business Details
    businessStage?: string;
    bbbeeLevel?: string;
    cipcReturns?: string;
    incomeTaxNumber?: string;
    workmansCompensation?: string;
    vatRegistered?: string;
    taxCompliance?: string;
    businessDescription?: string;
    staffCount?: number;

    // Address
    physicalAddress?: {
      street?: string;
      addressLine1?: string;
      addressLine2?: string;
      suburb?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      country?: string;
    };
  };

  // ========================================
  // FINANCIAL INFORMATION
  // ========================================
  financialInfo?: {
    monthlyRevenue?: string;
    annualRevenue?: string;
    profitMargin?: string;
    existingDebt?: string;
    creditRating?: string;
    bankingDetails?: {
      bankName?: string;
      accountType?: string;
      yearsWithBank?: number;
    };
  };

  // ========================================
  // FUNDING REQUIREMENTS
  // ========================================
  fundingInfo?: {
    amountRequired?: string;
    purposeOfFunding?: string;
    timelineRequired?: string;
    repaymentPeriod?: string;
    collateralAvailable?: boolean;
    collateralDescription?: string;
  };

  // ========================================
  // DOCUMENTS
  // ========================================
  documents?: {
    cipDocument?: File;
    financialStatements?: File;
    bankStatements?: File;
    managementAccounts?: File;
    businessPlan?: File;
    taxClearance?: File;
  };

  // Supporting documents (flexible structure)
  supportingDocuments?: Record<string, any>;

  // ========================================
  // BUSINESS ASSESSMENT
  // ========================================
  businessReview?: {
    businessModel?: string;
    valueProposition?: string;
    targetMarkets?: string[];
    customerSegments?: string;
    marketSize?: string;
    competitivePosition?: string;
    marketShare?: number;
    growthRate?: number;
    operationalCapacity?: string;
    supplyChain?: string;
    technologyUse?: string;
    qualityStandards?: string;
    keyPerformanceIndicators?: Array<{
      metric: string;
      value: number;
      unit: string;
      period: string;
    }>;
    salesChannels?: string[];
    customerRetention?: number;
  };

  // ========================================
  // SWOT ANALYSIS
  // ========================================
  swotAnalysis?: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
    strategicPriorities?: string[];
    riskMitigation?: string[];
    competitiveAdvantages?: string[];
  };

  // ========================================
  // MANAGEMENT & GOVERNANCE
  // ========================================
  managementGovernance?: {
    managementTeam?: ManagementMember[];
    boardOfDirectors?: BoardMember[];
    managementCommittee?: CommitteeMember[];
    governanceStructure?: string;
    decisionMakingProcess?: string;
    reportingStructure?: string;
    advisors?: any[];
    consultants?: any[];
  };

  // ========================================
  // BUSINESS STRATEGY / PLAN
  // ========================================
  businessPlan?: {
    executiveSummary?: string;
    missionStatement?: string;
    visionStatement?: string;
    strategicObjectives?: string[];
    marketAnalysis?: string;
    competitiveStrategy?: string;
    pricingStrategy?: string;
    marketingStrategy?: string;
    expansionPlans?: string;
    productDevelopment?: string;
    marketEntry?: string;
    scalingStrategy?: string;
    revenueProjections?: Array<{
      year: number;
      amount: number;
      assumptions: string;
    }>;
    profitabilityTimeline?: string;
    breakEvenAnalysis?: string;
    returnOnInvestment?: string;
    fundingRequirements?: {
      totalAmountRequired?: number;
      currency?: string;
      fundingType?: 'loan' | 'grant' | 'equity' | 'convertible' | 'revenue_share';
      fundingPurpose?: string;
      timeline?: string;
      repaymentTerms?: string;
      collateral?: string;
    };
    useOfFunds?: string;
    repaymentStrategy?: string;
    exitStrategy?: string;
  };

  // ========================================
  // FINANCIAL ANALYSIS
  // ========================================
  financialAnalysis?: {
    template?: File;
    notes?: string;
    incomeStatement?: any[];
    financialRatios?: any[];
    lastUpdated?: string;
  };
}

/**
 * @deprecated Use ProfileData instead
 * Kept for backward compatibility - will be removed in next version
 */
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
