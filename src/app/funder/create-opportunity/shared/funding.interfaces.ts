// src/app/funder/create-opportunity/shared/funding.interfaces.ts

export interface FunderApplicationStep {
  step: number;
  name: string;
  description: string;
  requiredDocuments: string[];
  timeframe: number; // days
  isOptional: boolean;
}

export interface OpportunityEligibility {
  [x: string]: any;
  industries: string[];
  businessStages: string[];
  minRevenue?: number;
  maxRevenue?: number;
  minYearsOperation?: number;
  geographicRestrictions?: string[];
  creditRatingMin?: string;
  investorReadinessMin?: number;
  requiresCollateral: boolean;
  excludeCriteria?: string[];
}

export interface MatchingCriteria {
  industryWeight: number;
  sizeWeight: number;
  stageWeight: number;
  locationWeight: number;
  readinessWeight: number;
  riskWeight: number;
  minMatchScore: number;
}

export interface FundingOpportunity {
  [x: string]: any;
  id: string;
  fundId: string;
  organizationId: string;

  // New
  fundingOpportunityImageUrl: string;
  fundingOpportunityVideoUrl: string;
  funderOrganizationName: string;
  funderOrganizationLogoUrl: string;
  // Opportunity details
  title: string;
  description: string;
  shortDescription: string;

  // Investment terms
  offerAmount: number;
  minInvestment: number;
  maxInvestment: number;
  currency: string;

  // Specific terms for this opportunity
  fundingType: string[];
  contactEmail?: string;

  interestRate?: number;
  equityOffered?: number;
  repaymentTerms?: string;
  securityRequired?: string;

  // Deal specifics
  useOfFunds: string;
  investmentStructure: string;
  expectedReturns?: number;
  investmentHorizon?: number; // years
  exitStrategy?: string;

  // Application process
  applicationDeadline?: Date;
  decisionTimeframe: number; // days
  applicationProcess: FunderApplicationStep[];

  // Eligibility & targeting
  eligibilityCriteria: OpportunityEligibility;
  targetCompanyProfile: string;

  // Status & availability
  status: 'draft' | 'active' | 'paused' | 'closed' | 'fully_subscribed';
  totalAvailable: number;
  amountCommitted: number;
  amountDeployed: number;

  // Applications
  maxApplications?: number;
  currentApplications: number;

  // Performance tracking
  viewCount: number;
  applicationCount: number;
  conversionRate?: number;

  // Team
  dealLead: string; // user id
  dealTeam: string[]; // user ids

  // Matching
  autoMatch: boolean;
  matchCriteria?: MatchingCriteria;

  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  closedAt?: Date;
  typicalInvestment?: number;
  investmentCriteria?: string[];
  exclusionCriteria?: string[];
}

export interface OpportunityFormData {
  // Basic details
  title: string;
  description: string;
  shortDescription: string;

  // NEW: Media & Branding fields
  fundingOpportunityImageUrl: string;
  fundingOpportunityVideoUrl: string;
  funderOrganizationName: string;
  funderOrganizationLogoUrl: string;

  // Investment terms
  offerAmount: string;
  minInvestment: string;
  maxInvestment: string;
  currency: string;
  fundingType: (
    | 'debt'
    | 'equity'
    | 'convertible'
    | 'mezzanine'
    | 'grant'
    | 'purchase_order'
    | 'invoice_financing'
  )[];

  // Specific terms
  interestRate: string;
  equityOffered: string;
  repaymentTerms: string;
  securityRequired: string;

  // Deal specifics
  useOfFunds: string;
  investmentStructure: string;
  expectedReturns: string;
  investmentHorizon: string;
  exitStrategy: string;

  // Process
  applicationDeadline: string;
  decisionTimeframe: string;

  // Eligibility
  targetIndustries: string[];
  businessStages: string[];
  minRevenue: string;
  maxRevenue: string;
  minYearsOperation: string;
  geographicRestrictions: string[];
  requiresCollateral: boolean;

  // Availability
  typicalInvestment: string;
  maxApplications: string;

  // Settings
  autoMatch: boolean;
  isPublic: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export interface FormStepProps {
  formData: OpportunityFormData;
  validationErrors: ValidationError[];
  onFormChange: (updates: Partial<OpportunityFormData>) => void;
  onValidationChange?: (errors: ValidationError[]) => void;
}

export interface StepInfo {
  id: 'basic' | 'terms' | 'eligibility' | 'settings' | 'review';
  icon: any;
  title: string;
  description: string;
}

// Form field utility types
export type NumberFieldKey =
  | 'offerAmount'
  | 'minInvestment'
  | 'maxInvestment'
  | 'totalAvailable'
  | 'maxApplications'
  | 'interestRate'
  | 'equityOffered'
  | 'expectedReturns'
  | 'investmentHorizon'
  | 'minRevenue'
  | 'maxRevenue'
  | 'minYearsOperation';

export type StringFieldKey = Exclude<
  keyof OpportunityFormData,
  | NumberFieldKey
  | 'targetIndustries'
  | 'businessStages'
  | 'geographicRestrictions'
  | 'requiresCollateral'
  | 'autoMatch'
  | 'isPublic'
>;

export type ArrayFieldKey =
  | 'targetIndustries'
  | 'businessStages'
  | 'geographicRestrictions';

export type BooleanFieldKey = 'requiresCollateral' | 'autoMatch' | 'isPublic';
