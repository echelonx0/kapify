// src/app/shared/models/sme.models.ts

export type AssessmentStatus = 'not_started' | 'in_progress' | 'completed' | 'reviewed' | 'approved' | 'requires_update';
export type ComplianceStatus = 'compliant' | 'outstanding' | 'in_progress' | 'not_applicable';
export type InvestorReadinessLevel = 'not_ready' | 'developing' | 'ready' | 'highly_ready' | 'investment_grade';

// Main SME Profile (comprehensive investor readiness assessment)
export interface SMEProfile {
  id: string;
  organizationId: string; // links to SMEOrganization
  userId: string; // primary contact/owner
  
  // Assessment metadata
  assessmentVersion: string;
  completionStatus: AssessmentStatus;
  completionPercentage: number;
  
  // Core assessment sections
  adminInfo: AdminInfo;
  financialAnalysis: FinancialAnalysis;
  managementGovernance: ManagementGovernance;
  businessPlan: BusinessPlanAssessment;
  swotAnalysis: SWOTAnalysis;
  
  // Document management
  documents: DocumentCollection;
  
  // Assessment scores & results
  assessmentScores: AssessmentScores;
  investorReadinessReport?: InvestorReadinessReport;
  
  // Audit trail
  lastReviewed?: Date;
  reviewedBy?: string; // admin/consultant user id
  reviewNotes?: string;
  
  // Visibility & sharing
  isPublic: boolean;
  sharedWithFunders: string[]; // funder organization ids
  
  createdAt: Date;
  updatedAt: Date;
}

// Admin Information Section
export interface AdminInfo {
  // Contact Person & Details
  contactPerson: ContactPersonDetails;
  
  // Business Details
  businessDetails: BusinessDetails;
  
  // Legal and Compliance
  legalCompliance: LegalCompliance;
  
  // Directors/Members
  directors: DirectorDetails[];
  
  // Shareholders
  shareholders: ShareholderDetails[];
  ultimateBeneficiaries?: BeneficiaryDetails[];
  
  // Current Investment Details
  currentInvestmentNeeds?: InvestmentNeeds;
  
  // Completion tracking
  sectionComplete: boolean;
  completionPercentage: number;
  lastUpdated: Date;
}

export interface ContactPersonDetails {
  name: string;
  surname: string;
  capacity: string; // role/position
  contactEmail: string;
  cellNumber: string;
  alternativeContact?: {
    name: string;
    email: string;
    phone: string;
    relationship: string;
  };
  preferredContactMethod: 'email' | 'phone' | 'whatsapp';
}

export interface BusinessDetails {
  nameOfBusiness: string;
  tradingName?: string;
  telephone: string;
  companyRegNumber: string;
  vatNumber?: string;
  yearsInOperation: number;
  
  physicalAddress: {
    addressLine1: string;
    addressLine2?: string;
    suburb: string;
    province: string;
    city: string;
    postalCode: string;
    sameAsRegistered: boolean;
  };
  
  registeredAddress?: {
    addressLine1: string;
    addressLine2?: string;
    suburb: string;
    province: string;
    city: string;
    postalCode: string;
  };
  
  industry: string;
  subSector?: string;
  businessStage: 'startup' | 'early_stage' | 'growth' | 'established' | 'mature' | 'turnaround';
  businessModel: string;
  
  bbbeeLevel?: string;
  bbbeeExpiryDate?: Date;
  
  staffCompliment: number;
  businessDescription: string;
  
  // Additional business info
  website?: string;
  socialMedia?: {
    linkedin?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
  
  // Revenue classification
  revenueCategory: 'micro' | 'very_small' | 'small' | 'medium' | 'large';
  isExporter: boolean;
  exportPercentage?: number;
}

export interface LegalCompliance {
  cipcReturns: ComplianceStatus;
  cipcReturnsDate?: Date;
  
  vatRegistered: boolean;
  vatNumber?: string;
  vatComplianceStatus?: ComplianceStatus;
  
  taxComplianceStatus: ComplianceStatus;
  taxComplianceDate?: Date;
  incomeTaxNumber: string;
  
  workmansCompensation: ComplianceStatus;
  wcompPolicyNumber?: string;
  wcompExpiryDate?: Date;
  
  uifRegistered: boolean;
  uifNumber?: string;
  
  sarsCompliant: boolean;
  taxClearanceCertificate: boolean;
  taxClearanceExpiryDate?: Date;
  
  // Industry-specific compliance
  industryLicenses: IndustryLicense[];
  
  // Environmental compliance
  environmentalClearance: boolean;
  environmentalCertificates?: string[];
  
  // Other regulatory compliance
  otherCompliances: Array<{
    type: string;
    status: ComplianceStatus;
    expiryDate?: Date;
    certificateNumber?: string;
  }>;
}

export interface IndustryLicense {
  licenseType: string;
  licenseNumber: string;
  issuingAuthority: string;
  issueDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'pending_renewal' | 'suspended';
}

export interface DirectorDetails {
  id: string;
  fullName: string;
  idNumber: string;
  nationality: string;
  residentialAddress: string;
  contactDetails: {
    email: string;
    phone: string;
    alternativePhone?: string;
  };
  
  // Professional details
  qualifications: string;
  professionalRegistrations?: string;
  experience: string;
  role: string;
  appointmentDate: Date;
  
  // Financial info
  hasPersonalBalanceSheet: boolean;
  netWorth?: number;
  creditRecord: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  
  // Other business interests
  otherBusinessInterests: OtherBusinessInterest[];
  
  // Compliance
  isDebarred: boolean;
  hasConvictions: boolean;
  convictionDetails?: string;
}

export interface OtherBusinessInterest {
  companyName: string;
  registrationNumber: string;
  role: string;
  ownershipPercentage: number;
  industry: string;
  isActive: boolean;
}

export interface ShareholderDetails {
  id: string;
  fullName: string;
  idNumber: string;
  shareholderType: 'individual' | 'juristic_person';
  
  // Shareholding details
  currentShareholding: number; // percentage
  numberOfShares: number;
  shareClass: string;
  postInvestmentShareholding?: number; // percentage for dilution scenarios
  
  // Contact details (for individuals)
  contactDetails?: {
    email: string;
    phone: string;
    address: string;
  };
  
  // Juristic person details
  entityDetails?: {
    registrationNumber: string;
    entityType: string;
    country: string;
    authorizedRepresentative: string;
  };
  
  // Beneficial ownership (for juristic persons)
  ultimateBeneficialOwners?: BeneficiaryDetails[];
  
  // Rights and restrictions
  votingRights: number; // percentage
  hasVetoRights: boolean;
  transferRestrictions?: string;
  
  // Investment history
  initialInvestmentDate: Date;
  initialInvestmentAmount: number;
  totalInvested: number;
}

export interface BeneficiaryDetails {
  id: string;
  fullName: string;
  idNumber: string;
  nationality: string;
  dateOfBirth: Date;
  
  // Ownership details
  ownershipPercentage: number;
  controlPercentage: number;
  votingRights: number;
  
  // PEP (Politically Exposed Person) screening
  isPEP: boolean;
  pepDetails?: string;
  
  // Sanctions screening
  sanctionsCheck: boolean;
  sanctionsDetails?: string;
}

export interface InvestmentNeeds {
  amountRequired: number;
  currency: string;
  
  purposeOfFunding: string;
  detailedUseOfFunds: UseOfFunds[];
  
  timelineRequired: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  
  preferredInvestmentType: 'debt' | 'equity' | 'mezzanine' | 'convertible' | 'grant' | 'flexible';
  acceptableEquityDilution?: number;
  
  repaymentPeriod: string;
  preferredRepaymentStructure?: string;
  
  collateralAvailable: boolean;
  collateralDescription?: string;
  collateralValue?: number;
  
  // Previous funding attempts
  previousFundingAttempts: PreviousFundingAttempt[];
  
  // Exit strategy consideration
  hasExitStrategy: boolean;
  expectedExitTimeframe?: number; // years
  expectedExitMethod?: string;
}

export interface UseOfFunds {
  category: 'working_capital' | 'equipment' | 'expansion' | 'acquisition' | 'research_development' | 'marketing' | 'debt_refinancing' | 'other';
  description: string;
  amount: number;
  percentage: number;
  timeline: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PreviousFundingAttempt {
  fundingSource: string;
  amountRequested: number;
  dateApplied: Date;
  outcome: 'approved' | 'rejected' | 'withdrawn' | 'pending';
  reasonForOutcome?: string;
  lessonsLearned?: string;
}

// Financial Analysis Section (comprehensive 3-year analysis)
export interface FinancialAnalysis {
  // Historical financial data (3 years)
  historicalData: {
    incomeStatements: IncomeStatement[];
    balanceSheets: BalanceSheet[];
    cashFlowStatements: CashFlowStatement[];
  };
  
  // Financial projections (3-5 years)
  projections: {
    incomeStatements: IncomeStatement[];
    balanceSheets: BalanceSheet[];
    cashFlowStatements: CashFlowStatement[];
    assumptions: ProjectionAssumptions;
  };
  
  // Financial ratios (calculated and analyzed)
  ratiosAnalysis: RatiosAnalysis;
  
  // Banking and credit information
  bankingInformation: BankingInformation;
  
  // Financial controls and systems
  financialControls: FinancialControls;
  
  // Auditor and accounting information
  accountingInformation: AccountingInformation;
  
  // Completion tracking
  sectionComplete: boolean;
  completionPercentage: number;
  lastUpdated: Date;
}

export interface IncomeStatement {
  year: number;
  period: 'annual' | 'quarterly' | 'monthly';
  audited: boolean;
  
  // Revenue
  revenue: number;
  otherIncome: number;
  totalIncome: number;
  
  // Cost of sales
  costOfSales: number;
  grossProfit: number;
  grossProfitMargin: number;
  
  // Operating expenses
  operatingExpenses: {
    salariesAndWages: number;
    rentAndUtilities: number;
    marketingAndAdvertising: number;
    professionalFees: number;
    insurance: number;
    depreciationAndAmortization: number;
    other: number;
    total: number;
  };
  
  // Operating profit
  operatingProfit: number;
  operatingProfitMargin: number;
  
  // Non-operating items
  interestIncome: number;
  interestExpense: number;
  otherNonOperatingIncome: number;
  otherNonOperatingExpenses: number;
  
  // Profit before tax
  profitBeforeTax: number;
  
  // Tax
  taxExpense: number;
  effectiveTaxRate: number;
  
  // Net profit
  netProfit: number;
  netProfitMargin: number;
  
  // Additional metrics
  ebitda: number;
  ebit: number;
}

export interface BalanceSheet {
  year: number;
  asOfDate: Date;
  audited: boolean;
  
  // Assets
  currentAssets: {
    cash: number;
    accountsReceivable: number;
    inventory: number;
    prepaidExpenses: number;
    otherCurrentAssets: number;
    totalCurrentAssets: number;
  };
  
  nonCurrentAssets: {
    propertyPlantEquipment: number;
    intangibleAssets: number;
    goodwill: number;
    investments: number;
    otherNonCurrentAssets: number;
    totalNonCurrentAssets: number;
  };
  
  totalAssets: number;
  
  // Liabilities
  currentLiabilities: {
    accountsPayable: number;
    shortTermDebt: number;
    accruedExpenses: number;
    taxesPayable: number;
    otherCurrentLiabilities: number;
    totalCurrentLiabilities: number;
  };
  
  nonCurrentLiabilities: {
    longTermDebt: number;
    deferredTaxLiabilities: number;
    otherNonCurrentLiabilities: number;
    totalNonCurrentLiabilities: number;
  };
  
  totalLiabilities: number;
  
  // Equity
  equity: {
    shareCapital: number;
    retainedEarnings: number;
    otherEquity: number;
    totalEquity: number;
  };
  
  totalLiabilitiesAndEquity: number;
}

export interface CashFlowStatement {
  year: number;
  period: 'annual' | 'quarterly' | 'monthly';
  audited: boolean;
  
  // Operating activities
  operatingActivities: {
    netIncome: number;
    depreciationAndAmortization: number;
    changeInAccountsReceivable: number;
    changeInInventory: number;
    changeInAccountsPayable: number;
    otherOperatingActivities: number;
    netCashFromOperations: number;
  };
  
  // Investing activities
  investingActivities: {
    capitalExpenditures: number;
    acquisitions: number;
    investmentPurchases: number;
    investmentSales: number;
    otherInvestingActivities: number;
    netCashFromInvesting: number;
  };
  
  // Financing activities
  financingActivities: {
    debtBorrowing: number;
    debtRepayment: number;
    equityIssuance: number;
    dividendsPaid: number;
    otherFinancingActivities: number;
    netCashFromFinancing: number;
  };
  
  // Net change in cash
  netChangeInCash: number;
  beginningCashBalance: number;
  endingCashBalance: number;
}

export interface ProjectionAssumptions {
  revenueGrowthRates: number[]; // by year
  grossMarginAssumptions: string;
  expenseGrowthAssumptions: string;
  capitalExpenditureAssumptions: string;
  workingCapitalAssumptions: string;
  financingAssumptions: string;
  keyDrivers: string[];
  riskFactors: string[];
  sensitivityAnalysis?: SensitivityAnalysis;
}

export interface SensitivityAnalysis {
  scenarios: Array<{
    name: 'base_case' | 'optimistic' | 'pessimistic' | 'worst_case';
    revenueVariance: number; // percentage
    marginVariance: number; // percentage
    projectedRevenue: number[];
    projectedProfit: number[];
  }>;
}

export interface RatiosAnalysis {
  // Profitability ratios
  profitabilityRatios: Array<{
    year: number;
    grossProfitMargin: number;
    operatingProfitMargin: number;
    netProfitMargin: number;
    returnOnAssets: number;
    returnOnEquity: number;
    returnOnInvestment: number;
  }>;
  
  // Liquidity ratios
  liquidityRatios: Array<{
    year: number;
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
    workingCapitalRatio: number;
  }>;
  
  // Leverage ratios
  leverageRatios: Array<{
    year: number;
    debtToEquity: number;
    debtToAssets: number;
    equityRatio: number;
    timesInterestEarned: number;
    debtServiceCoverageRatio: number;
  }>;
  
  // Efficiency ratios
  efficiencyRatios: Array<{
    year: number;
    assetTurnover: number;
    receivablesTurnover: number;
    inventoryTurnover: number;
    payablesTurnover: number;
    workingCapitalTurnover: number;
  }>;
  
  // Industry comparisons
  industryBenchmarks?: IndustryBenchmarks;
  
  // Trend analysis
  trendAnalysis: TrendAnalysis;
}

export interface IndustryBenchmarks {
  industry: string;
  dataSource: string;
  benchmarkDate: Date;
  
  medianRatios: {
    grossProfitMargin: number;
    operatingProfitMargin: number;
    netProfitMargin: number;
    currentRatio: number;
    debtToEquity: number;
    returnOnAssets: number;
    returnOnEquity: number;
  };
  
  percentileRatios: {
    percentile25: any;
    percentile75: any;
  };
}

export interface TrendAnalysis {
  trendDirection: {
    revenue: 'improving' | 'stable' | 'declining';
    profitability: 'improving' | 'stable' | 'declining';
    liquidity: 'improving' | 'stable' | 'declining';
    leverage: 'improving' | 'stable' | 'declining';
  };
  
  keyInsights: string[];
  concernAreas: string[];
  positiveIndicators: string[];
}

export interface BankingInformation {
  primaryBankingRelationship: {
    bankName: string;
    branchCode: string;
    accountNumber: string;
    accountType: string;
    yearsWithBank: number;
    relationshipManager?: string;
    contactDetails?: string;
  };
  
  bankingFacilities: BankingFacility[];
  
  creditHistory: {
    creditRating?: string;
    creditRatingAgency?: string;
    lastCreditReview?: Date;
    creditScore?: number;
    paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
    defaultHistory: boolean;
    defaultDetails?: string;
  };
  
  bankingReferences: BankingReference[];
}

export interface BankingFacility {
  facilityType: 'overdraft' | 'term_loan' | 'revolving_credit' | 'trade_finance' | 'guarantee' | 'other';
  facilityProvider: string;
  facilityAmount: number;
  utilisedAmount: number;
  interestRate: number;
  securityOffered: string;
  securityValue?: number;
  maturityDate?: Date;
  covenants?: string[];
  currentStatus: 'performing' | 'watch_list' | 'default' | 'closed';
}

export interface BankingReference {
  contactPerson: string;
  position: string;
  bankName: string;
  contactDetails: string;
  relationshipDuration: number; // years
  referenceProvided: boolean;
}

export interface FinancialControls {
  accountingSystem: string;
  accountingPackage: string;
  
  internalControls: {
    segregationOfDuties: boolean;
    authorizationLimits: boolean;
    bankReconciliations: boolean;
    inventoryControls: boolean;
    fixedAssetRegister: boolean;
    budgetingProcess: boolean;
    varianceAnalysis: boolean;
  };
  
  financialReporting: {
    monthlyReports: boolean;
    quarterlyReports: boolean;
    annualReports: boolean;
    managementAccounts: boolean;
    boardReports: boolean;
    cashFlowForecasting: boolean;
  };
  
  auditHistory: {
    hasExternalAudit: boolean;
    lastAuditDate?: Date;
    auditorName?: string;
    auditOpinion?: 'unqualified' | 'qualified' | 'adverse' | 'disclaimer';
    managementLetterIssues?: string[];
  };
  
  complianceHistory: {
    vatCompliance: boolean;
    payeCompliance: boolean;
    uifCompliance: boolean;
    statutoryDeductions: boolean;
    penaltiesOrFines: boolean;
    penaltyDetails?: string;
  };
}

export interface AccountingInformation {
  qualifiedAccountant: {
    hasQualifiedAccountant: boolean;
    accountantName?: string;
    qualification?: string;
    isExternal: boolean;
    contactDetails?: string;
  };
  
  auditFirm: {
    firmName?: string;
    partnerName?: string;
    yearsAsAuditor?: number;
    contactDetails?: string;
    feeStructure?: string;
  };
  
  accountingStandards: 'IFRS' | 'IFRS_for_SMEs' | 'GAAP' | 'other';
  
  taxAdviser: {
    hasTaxAdviser: boolean;
    adviserName?: string;
    qualification?: string;
    contactDetails?: string;
  };
}