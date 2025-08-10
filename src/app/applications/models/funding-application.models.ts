// src/app/profile/models/funding-application.models.ts
export interface FundingApplicationProfile {
  // Company Information (formerly admin)
  companyInfo?: CompanyInformation;
  
  // Supporting Documents (unchanged)
  supportingDocuments?: SupportingDocuments;
  
  // Business Assessment (formerly business-review)
  businessAssessment?: BusinessAssessment;
  
  // Strategic Analysis (formerly swot)
  swotAnalysis?: SWOTAnalysis;
  
  // Leadership & Governance (formerly management)
  managementStructure?: ManagementStructure;
  
  // Business Strategy (formerly business-plan)
  businessStrategy?: BusinessStrategy;
  
  // Financial Profile (formerly financial)
  financialProfile?: FinancialProfile;
}

export interface CompanyInformation {
  // Basic Company Details
  companyName: string;
  registrationNumber: string;
  vatNumber?: string;
  industryType: string;
  businessActivity: string;
  foundingYear: number;
  operationalYears: number;
  
  // Company Structure
  companyType: 'pty_ltd' | 'close_corporation' | 'sole_proprietor' | 'partnership' | 'npo';
  ownership: OwnershipStructure[];
  employeeCount: string;
  
  // Contact & Location
  registeredAddress: Address;
  operationalAddress: Address;
  contactPerson: ContactPerson;
  
  // Compliance Status
  taxComplianceStatus: 'compliant' | 'outstanding' | 'under_review';
  bbbeeLevel?: string;
  regulatoryLicenses: string[];
}

export interface SupportingDocuments {
  // Company Registration Documents
  companyRegistration?: FileUpload;
  taxClearanceCertificate?: FileUpload;
  vatRegistration?: FileUpload;
  
  // Financial Documents
  auditedFinancials?: FileUpload[];
  managementAccounts?: FileUpload[];
  bankStatements?: FileUpload[];
  assetRegister?: FileUpload;
  
  // Business Documents
  businessPlan?: FileUpload;
  financialProjections?: FileUpload;
  salesPipeline?: FileUpload;
  
  // Additional Supporting Documents
  lettersOfIntent?: FileUpload[];
  supplierQuotations?: FileUpload[];
  customerContracts?: FileUpload[];
  other?: FileUpload[];
}

export interface BusinessAssessment {
  // Business Model
  businessModel: string;
  valueProposition: string;
  targetMarkets: string[];
  customerSegments: string;
  
  // Market Position
  marketSize: string;
  competitivePosition: string;
  marketShare?: number;
  growthRate?: number;
  
  // Operations
  operationalCapacity: string;
  supplyChain: string;
  technologyUse: string;
  qualityStandards: string;
  
  // Performance Metrics
  keyPerformanceIndicators: KPI[];
  salesChannels: string[];
  customerRetention?: number;
}

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  
  // Strategic Insights
  strategicPriorities: string[];
  riskMitigation: string[];
  competitiveAdvantages: string[];
}

export interface ManagementStructure {
  // Leadership Team
  executiveTeam: ExecutiveMember[];
  managementTeam: ManagementMember[];
  boardOfDirectors: BoardMember[];
  
  // Governance
  governanceStructure: string;
  decisionMakingProcess: string;
  reportingStructure: string;
  
  // Advisory Support
  advisors?: AdvisoryMember[];
  consultants?: ConsultantInfo[];
}

export interface BusinessStrategy {
  // Strategic Planning
  executiveSummary: string;
  missionStatement: string;
  visionStatement: string;
  strategicObjectives: string[];
  
  // Market Strategy
  marketAnalysis: string;
  competitiveStrategy: string;
  pricingStrategy: string;
  marketingStrategy: string;
  
  // Growth Plans
  expansionPlans: string;
  productDevelopment: string;
  marketEntry: string;
  scalingStrategy: string;
  
  // Financial Projections
  revenueProjections: FinancialProjection[];
  profitabilityTimeline: string;
  breakEvenAnalysis: string;
  returnOnInvestment: string;
  
  // Funding Strategy
  fundingRequirements: FundingRequirements;
  useOfFunds: string;
  repaymentStrategy?: string;
  exitStrategy?: string;
}

export interface FinancialProfile {
  // Historical Performance
  historicalFinancials: HistoricalFinancial[];
  
  // Current Financial Position
  currentAssets: number;
  currentLiabilities: number;
  netWorth: number;
  monthlyRevenue: number;
  monthlyCosts: number;
  cashFlow: number;
  
  // Financial Projections
  projectedRevenue: ProjectedFinancial[];
  projectedProfitability: ProjectedFinancial[];
  cashFlowProjections: CashFlowProjection[];
  
  // Financial Ratios
  profitMargin: number;
  debtToEquity: number;
  currentRatio: number;
  returnOnAssets: number;
  
  // Banking Relationships
  primaryBank: string;
  bankingHistory: number; // years
  creditFacilities: CreditFacility[];
  creditRating?: string;
}

// Supporting Interfaces
export interface OwnershipStructure {
  ownerName: string;
  ownershipPercentage: number;
  role: string;
  idNumber?: string;
}

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface ContactPerson {
  fullName: string;
  position: string;
  email: string;
  phone: string;
  idNumber?: string;
}

export interface FileUpload {
  id: string;
  fileName: string;
  fileSize: number;
  uploadDate: Date;
  fileType: string;
  storageUrl?: string;
}

export interface KPI {
  metric: string;
  value: number;
  unit: string;
  period: string;
}

export interface ExecutiveMember {
  id: string;
  fullName: string;
  position: string;
  qualifications: string;
  experience: number;
  previousRoles: string;
  equity?: number;
}

export interface ManagementMember {
  id: string;
  fullName: string;
  role: string;
  department: string;
  qualification: string;
  yearsOfExperience: number;
  reportsTo?: string;
}

export interface BoardMember {
  id: string;
  fullName: string;
  role: string;
  independent: boolean;
  appointmentDate: string;
  expertise: string;
  otherBoards?: string[];
}

export interface AdvisoryMember {
  id: string;
  fullName: string;
  expertise: string;
  contribution: string;
  compensation?: string;
}

export interface ConsultantInfo {
  company: string;
  service: string;
  duration: string;
  cost: number;
}

export interface FinancialProjection {
  year: number;
  amount: number;
  assumptions: string;
}

export interface FundingRequirements {
  totalAmountRequired: number;
  currency: string;
  fundingType: 'loan' | 'grant' | 'equity' | 'convertible' | 'revenue_share';
  fundingPurpose: string;
  timeline: string;
  repaymentTerms?: string;
  collateral?: string;
}

export interface HistoricalFinancial {
  year: number;
  revenue: number;
  grossProfit: number;
  netProfit: number;
  assets: number;
  liabilities: number;
  cashFlow: number;
}

export interface ProjectedFinancial {
  year: number;
  optimistic: number;
  realistic: number;
  pessimistic: number;
  assumptions: string;
}

export interface CashFlowProjection {
  month: number;
  year: number;
  inflow: number;
  outflow: number;
  netCashFlow: number;
  cumulativeCashFlow: number;
}

export interface CreditFacility {
  facilityType: string;
  amount: number;
  interestRate: number;
  term: string;
  status: 'active' | 'paid_off' | 'defaulted';
}

export interface FundingApplicationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  estimatedTime?: string; // e.g., "15 minutes"
  dependencies?: string[]; // other step IDs that must be completed first
}