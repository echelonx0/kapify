// src/app/shared/models/funder.models.ts

export type FundType = 'debt_fund' | 'equity_fund' | 'mezzanine_fund' | 'grant_fund' | 'hybrid_fund';
export type FundStatus = 'draft' | 'active' | 'paused' | 'closed' | 'fully_deployed';
export type InvestmentStage = 'seed' | 'series_a' | 'series_b' | 'series_c' | 'growth' | 'mature';
export type DealStatus = 'sourced' | 'screening' | 'due_diligence' | 'investment_committee' | 'term_sheet' | 'closed' | 'rejected';

// Fund (multiple funds per funder organization)
export interface Fund {
  id: string;
  organizationId: string; // links to FunderOrganization
  
  // Fund basics
  name: string;
  description: string;
  fundType: FundType;
  vintage: number; // year established
  
  // Fund size & deployment
  totalFundSize: number;
  currency: string;
  deployedAmount: number;
  availableAmount: number;
  reservedAmount: number;
  
  // Investment parameters
  investmentCriteria: FundInvestmentCriteria;
  investmentRange: {
    min: number;
    max: number;
    typical: number;
  };
  
  // Fund lifecycle
  status: FundStatus;
  fundingPeriodEnd?: Date;
  expectedFundLife: number; // years
  extensionOptions?: number; // years
  
  // Returns & performance
  targetReturn?: number; // percentage
  targetIRR?: number; // percentage
  currentNAV?: number;
  currentIRR?: number;
  moic?: number; // Multiple of Invested Capital
  
  // Fund management
  managementFee: number; // percentage
  carriedInterest: number; // percentage
  hurdleRate?: number; // percentage
  
  // Team & governance
  fundManager: string; // user id
  investmentCommittee: InvestmentCommitteeMember[];
  investmentProcess: InvestmentProcess;
  
  // Reporting
  reportingFrequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  lastReportDate?: Date;
  nextReportDue?: Date;
  
  // Settings
  isPublic: boolean; // visible to SMEs for applications
  acceptingApplications: boolean;
  autoMatch: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface FundInvestmentCriteria {
  // Industry focus
  targetIndustries: string[];
  excludedIndustries: string[];
  
  // Stage & size
  investmentStages: InvestmentStage[];
  companyAgeRange: {
    min?: number; // years
    max?: number; // years
  };
  revenueRange: {
    min?: number;
    max?: number;
  };
  
  // Geography
  geographicFocus: string[]; // provinces/regions
  internationalInvestments: boolean;
  
  // Investment terms
  equityRange?: {
    min: number; // percentage
    max: number; // percentage
  };
  liquidityPreference?: number;
  boardSeats: boolean;
  observerRights: boolean;
  antiDilution: boolean;
  
  // Risk profile
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  minInvestorReadinessScore: number;
  requiresAuditedFinancials: boolean;
  requiresCollateral: boolean;
  
  // Due diligence requirements
  requiredDocuments: string[];
  dueDiligenceTimeframe: number; // days
  
  // ESG criteria
  esgFocus: boolean;
  esgCriteria?: ESGCriteria;
}

export interface ESGCriteria {
  environmentalFocus: boolean;
  socialImpact: boolean;
  governanceStandards: boolean;
  impactMeasurement: boolean;
  excludeSectors: string[]; // tobacco, gambling, etc.
}

export interface InvestmentCommitteeMember {
  userId: string;
  name: string;
  role: string;
  votingPower: number; // percentage
  isRequired: boolean; // required for quorum
}

export interface InvestmentProcess {
  stages: InvestmentStage[];
  approvalLimits: ApprovalLimit[];
  dueDiligenceSteps: DueDiligenceStep[];
  decisionTimeframe: number; // days
  requiresUnanimous: boolean;
}

export interface ApprovalLimit {
  role: string;
  maxAmount: number;
  requiresCommittee: boolean;
}

export interface DueDiligenceStep {
  step: string;
  description: string;
  owner: string; // role
  timeframe: number; // days
  isRequired: boolean;
  dependencies?: string[]; // other steps that must complete first
}

// Fund opportunities (specific deals within funds)
export interface FundingOpportunity {
  id: string;
  fundId: string;
  organizationId: string;
  
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
  fundingType: 'debt' | 'equity' | 'convertible' | 'mezzanine' | 'grant';
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
  applicationProcess: ApplicationStep[];
  
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
}

export interface OpportunityEligibility {
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

export interface ApplicationStep {
  step: number;
  name: string;
  description: string;
  requiredDocuments: string[];
  timeframe: number; // days
  isOptional: boolean;
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

// Deal/Investment tracking
export interface Deal {
  id: string;
  fundId: string;
  organizationId: string;
  smeId: string;
  applicationId?: string;
  
  // Deal basics
  dealName: string;
  companyName: string;
  sector: string;
  
  // Investment details
  investmentAmount: number;
  currency: string;
  investmentDate?: Date;
  fundingType: string;
  
  // Deal terms
  dealTerms: DealTerms;
  
  // Deal process
  status: DealStatus;
  currentStage: string;
  dealLead: string; // user id
  dealTeam: string[]; // user ids
  
  // Timeline
  sourceDate: Date;
  firstMeetingDate?: Date;
  dueDiligenceStartDate?: Date;
  investmentCommitteeDate?: Date;
  termSheetDate?: Date;
  closingDate?: Date;
  
  // Due diligence
  dueDiligenceChecklist: DueDiligenceItem[];
  dueDiligenceNotes: string;
  riskAssessment: RiskAssessment;
  
  // Performance tracking (post-investment)
  currentValuation?: number;
  lastValuationDate?: Date;
  performanceMetrics?: PerformanceMetrics;
  
  // Exit
  exitDate?: Date;
  exitType?: 'ipo' | 'acquisition' | 'buyback' | 'write_off';
  exitValuation?: number;
  exitMultiple?: number;
  realizedReturns?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DealTerms {
  // Financial terms
  preMoneyValuation?: number;
  postMoneyValuation?: number;
  equityPercentage?: number;
  sharePrice?: number;
  numberOfShares?: number;
  
  // Debt terms
  interestRate?: number;
  maturityDate?: Date;
  repaymentSchedule?: string;
  securityDescription?: string;
  
  // Governance
  boardSeats?: number;
  observerRights?: boolean;
  votingRights?: string;
  liquidationPreference?: number;
  antiDilution?: string;
  
  // Other terms
  useOfFunds: string;
  milestones?: Milestone[];
  covenants?: string[];
  warranties?: string[];
  
  // Exit provisions
  tagAlongRights?: boolean;
  dragAlongRights?: boolean;
  preemptiveRights?: boolean;
}

export interface Milestone {
  id: string;
  description: string;
  targetDate: Date;
  completionDate?: Date;
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  linkedFunding?: number; // amount released on completion
}

export interface DueDiligenceItem {
  category: string;
  item: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'red_flag' | 'not_applicable';
  owner: string; // user id
  dueDate?: Date;
  completedDate?: Date;
  notes?: string;
  documents?: string[]; // document ids
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'very_high';
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  investmentRecommendation: 'proceed' | 'proceed_with_caution' | 'reject';
  investmentCommitteeNotes?: string;
}

export interface RiskFactor {
  category: 'market' | 'competitive' | 'operational' | 'financial' | 'regulatory' | 'management' | 'technology';
  risk: string;
  impact: 'low' | 'medium' | 'high';
  probability: 'low' | 'medium' | 'high';
  mitigationPlan?: string;
}

export interface PerformanceMetrics {
  // Financial performance
  currentRevenue?: number;
  revenueGrowth?: number;
  currentProfitability?: number;
  ebitda?: number;
  
  // Operational metrics
  employeeCount?: number;
  customerCount?: number;
  marketShare?: number;
  
  // Valuation metrics
  currentValuation?: number;
  valuationMultiple?: number;
  
  // Custom metrics
  customMetrics?: Array<{
    name: string;
    value: number;
    unit: string;
    reportingDate: Date;
  }>;
  
  lastUpdated: Date;
}

// Fund reporting & analytics
export interface FundReport {
  id: string;
  fundId: string;
  
  reportType: 'monthly' | 'quarterly' | 'annual' | 'investor_update';
  reportPeriod: {
    start: Date;
    end: Date;
  };
  
  // Fund performance
  fundPerformance: FundPerformance;
  
  // Portfolio overview
  portfolioSummary: PortfolioSummary;
  
  // Investment activity
  investmentActivity: InvestmentActivity;
  
  // Generated report
  reportUrl?: string;
  generatedAt?: Date;
  sentToInvestors?: Date;
  
  createdAt: Date;
}

export interface FundPerformance {
  nav: number;
  irr: number;
  moic: number;
  distributionsPaid: number;
  contributionsCalled: number;
  unrealizedValue: number;
  realizedValue: number;
}

export interface PortfolioSummary {
  totalCompanies: number;
  newInvestments: number;
  exitedCompanies: number;
  portfolioValuation: number;
  topPerformers: string[]; // deal ids
  underPerformers: string[]; // deal ids
}

export interface InvestmentActivity {
  newInvestments: Array<{
    dealId: string;
    companyName: string;
    investmentAmount: number;
    investmentDate: Date;
  }>;
  followOnInvestments: Array<{
    dealId: string;
    companyName: string;
    amount: number;
    investmentDate: Date;
  }>;
  exits: Array<{
    dealId: string;
    companyName: string;
    exitAmount: number;
    exitDate: Date;
    exitType: string;
  }>;
}