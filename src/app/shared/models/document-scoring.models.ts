// src/app/shared/models/document-scoring.models.ts

import { RiskFactor } from "./funder.models";
import { InvestorReadinessLevel, AssessmentStatus } from "./sme.models";
import { Strategy } from "./swot.models";

export type DocumentCategory = 'company' | 'financial' | 'legal' | 'management' | 'additional' | 'swot' | 'business_plan';
export type DocumentStatus = 'uploaded' | 'processing' | 'verified' | 'rejected' | 'expired' | 'pending_update';
export type VerificationLevel = 'none' | 'basic' | 'enhanced' | 'professional';

// Document Management System
export interface DocumentCollection {
  // Company documents
  companyDocuments: Document[];
  
  // Financial documents
  financialDocuments: Document[];
  
  // Legal and compliance documents
  legalDocuments: Document[];
  
  // Management documents
  managementDocuments: Document[];
  
  // SWOT analysis documents
  swotDocuments: Document[];
  
  // Business plan documents
  businessPlanDocuments: Document[];
  
  // Additional investor documents
  additionalDocuments: Document[];
  
  // Document completion tracking
  completionSummary: DocumentCompletionSummary;
  
  lastUpdated: Date;
}

export interface Document {
  id: string;
  entityId: string; // smeId, applicationId, etc.
  entityType: 'sme_profile' | 'application' | 'swot_analysis' | 'business_plan';
  
  // Document identification
  category: DocumentCategory;
  type: DocumentType;
  subType?: string;
  
  // File details
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  fileHash?: string; // for integrity checking
  
  // Storage
  storageUrl: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  
  // Document metadata
  title: string;
  description?: string;
  version: number;
  language: string;
  
  // Requirements
  isRequired: boolean;
  requirementSource: 'profile' | 'application' | 'funder' | 'regulation' | 'optional';
  
  // Status and verification
  status: DocumentStatus;
  verificationLevel: VerificationLevel;
  verificationDetails?: VerificationDetails;
  
  // Expiry and validity
  hasExpiry: boolean;
  expiryDate?: Date;
  validityPeriod?: number; // months
  
  // Processing
  isProcessing: boolean;
  processingProgress?: number; // percentage
  extractedData?: ExtractedDocumentData;
  
  // Access control
  visibility: 'private' | 'shared' | 'public';
  sharedWith?: string[]; // user/organization ids
  accessLog?: DocumentAccess[];
  
  // Audit trail
  uploadedBy: string; // user id
  uploadedAt: Date;
  lastModifiedBy?: string;
  lastModifiedAt?: Date;
  
  // Tags and categorization
  tags: string[];
  keywords?: string[];
}

export interface DocumentType {
  // Company registration documents
  COMPANY_REGISTRATION: 'cipc_certificate' | 'incorporation_certificate' | 'company_profile';
  
  // Financial documents
  FINANCIAL_STATEMENTS: 'audited_financials' | 'management_accounts' | 'unaudited_financials' | 'cash_flow_statement';
  BANK_STATEMENTS: 'bank_statements' | 'bank_letters' | 'facility_agreements';
  TAX_DOCUMENTS: 'tax_clearance' | 'vat_returns' | 'income_tax_returns' | 'sars_letters';
  
  // Legal documents
  LEGAL_COMPLIANCE: 'bbbee_certificate' | 'municipal_licenses' | 'industry_licenses' | 'environmental_clearance';
  CONTRACTS: 'supplier_contracts' | 'customer_contracts' | 'employment_contracts' | 'lease_agreements';
  
  // Management documents
  MANAGEMENT_INFO: 'organizational_chart' | 'cv_documents' | 'director_certificates' | 'board_resolutions';
  INSURANCE: 'insurance_policies' | 'workman_comp' | 'professional_indemnity' | 'business_insurance';
  
  // Business planning
  BUSINESS_PLAN: 'full_business_plan' | 'executive_summary' | 'market_analysis' | 'financial_projections';
  SWOT_ANALYSIS: 'swot_document' | 'strategic_analysis' | 'competitive_analysis' | 'risk_assessment';
  
  // Additional documents
  ADDITIONAL: 'pitch_deck' | 'product_brochures' | 'customer_testimonials' | 'awards_certifications' | 'other';
}

export interface VerificationDetails {
  verifiedBy: string; // user id
  verificationDate: Date;
  verificationMethod: 'manual' | 'automated' | 'third_party' | 'api_integration';
  
  verificationResults: {
    isAuthentic: boolean;
    isComplete: boolean;
    isCurrentVersion: boolean;
    documentIntegrity: 'verified' | 'tampered' | 'uncertain';
  };
  
  verificationNotes?: string;
  verificationScore?: number; // 0-100
  
  // Third-party verification
  thirdPartyVerifier?: string;
  verificationReference?: string;
  
  // Re-verification schedule
  nextVerificationDue?: Date;
  verificationFrequency?: 'annual' | 'biannual' | 'quarterly' | 'monthly';
}

export interface ExtractedDocumentData {
  // Financial data extraction
  financialData?: {
    revenue?: number;
    profit?: number;
    assets?: number;
    liabilities?: number;
    cashFlow?: number;
    ratios?: Record<string, number>;
  };
  
  // Company data extraction
  companyData?: {
    registrationNumber?: string;
    vatNumber?: string;
    directors?: string[];
    shareholders?: Array<{name: string; percentage: number}>;
  };
  
  // Text extraction
  textContent?: string;
  keyPhrases?: string[];
  
  // Structured data
  structuredData?: Record<string, any>;
  
  // Confidence scores
  extractionConfidence?: number; // 0-100
  
  extractedAt: Date;
  extractionMethod: 'ocr' | 'pdf_text' | 'ai_processing' | 'manual_entry';
}

export interface DocumentAccess {
  accessedBy: string; // user id
  accessedAt: Date;
  accessType: 'view' | 'download' | 'share' | 'edit';
  ipAddress?: string;
  duration?: number; // seconds
}

export interface DocumentCompletionSummary {
  // Overall completion
  totalRequired: number;
  totalUploaded: number;
  totalVerified: number;
  completionPercentage: number;
  
  // By category
  categoryCompletion: Array<{
    category: DocumentCategory;
    required: number;
    uploaded: number;
    verified: number;
    percentage: number;
  }>;
  
  // Missing critical documents
  missingCritical: Array<{
    type: string;
    description: string;
    importance: 'critical' | 'high' | 'medium';
    deadline?: Date;
  }>;
  
  // Expiring documents
  expiringDocuments: Array<{
    documentId: string;
    type: string;
    expiryDate: Date;
    daysUntilExpiry: number;
  }>;
  
  // Quality assessment
  qualityScore: number; // 0-100
  qualityIssues: string[];
  
  lastAssessment: Date;
}

// Assessment Scoring System
export interface AssessmentScores {
  // Section scores
  adminScore: SectionScore;
  financialScore: SectionScore;
  managementScore: SectionScore;
  businessPlanScore: SectionScore;
  swotScore: SectionScore;
  documentScore: SectionScore;
  
  // Overall scores
  overallScore: number; // weighted average 0-100
  investorReadinessLevel: InvestorReadinessLevel;
  investmentGrade: InvestmentGrade;
  
  // Risk scoring
  riskProfile: RiskProfile;
  
  // Benchmarking
  industryComparison?: IndustryComparison;
  peerComparison?: PeerComparison;
  
  // Score history
  scoreHistory: ScoreHistory[];
  
  // Calculation metadata
  scoringMethodology: string;
  calculatedAt: Date;
  calculatedBy?: string; // user id or 'system'
  
  // Score validation
  isValidated: boolean;
  validatedBy?: string; // admin/consultant id
  validationNotes?: string;
}

export interface SectionScore {
  score: number; // 0-100
  maxPossibleScore: number;
  weightage: number; // percentage of total score
  
  // Subsection breakdown
  subScores?: Array<{
    name: string;
    score: number;
    maxScore: number;
    weight: number;
  }>;
  
  // Strengths and weaknesses
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  
  // Critical issues
  criticalIssues: CriticalIssue[];
  
  // Improvement potential
  improvementPotential: number; // 0-100
  quickWins: string[];
  
  completionStatus: AssessmentStatus;
  lastUpdated: Date;
}

export interface CriticalIssue {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  issue: string;
  impact: string;
  recommendation: string;
  timeframe: string;
  requiredAction: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}

export interface InvestmentGrade {
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  gradeDescription: string;
  investmentRecommendation: 'strong_buy' | 'buy' | 'hold' | 'caution' | 'avoid';
  
  gradeFactors: {
    financial: 'excellent' | 'good' | 'fair' | 'poor';
    management: 'excellent' | 'good' | 'fair' | 'poor';
    market: 'excellent' | 'good' | 'fair' | 'poor';
    operations: 'excellent' | 'good' | 'fair' | 'poor';
  };
  
  confidenceLevel: number; // 0-100
}

export interface RiskProfile {
  overallRisk: 'low' | 'medium' | 'high' | 'very_high';
  riskScore: number; // 0-100 (higher is riskier)
  
  riskCategories: {
    creditRisk: RiskCategory;
    operationalRisk: RiskCategory;
    marketRisk: RiskCategory;
    liquidityRisk: RiskCategory;
    regulatoryRisk: RiskCategory;
    reputationalRisk: RiskCategory;
  };
  
  keyRiskFactors: string[];
  mitigationStrategies: string[];
  
  riskAppetiteMatch: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface RiskCategory {
  level: 'low' | 'medium' | 'high' | 'very_high';
  score: number; // 0-100
  factors: string[];
  mitigations: string[];
  monitoring: string[];
}

export interface IndustryComparison {
  industry: string;
  benchmark: 'top_quartile' | 'above_average' | 'average' | 'below_average' | 'bottom_quartile';
  percentileRank: number; // 0-100
  
  comparisonMetrics: {
    revenue: ComparisonMetric;
    profitability: ComparisonMetric;
    growth: ComparisonMetric;
    efficiency: ComparisonMetric;
    leverage: ComparisonMetric;
    liquidity: ComparisonMetric;
  };
  
  industryTrends: IndustryTrend[];
  competitivePosition: 'market_leader' | 'strong_competitor' | 'average_player' | 'niche_player' | 'struggling';
  
  dataSource: string;
  comparisonDate: Date;
}

export interface ComparisonMetric {
  companyValue: number;
  industryMedian: number;
  industryAverage: number;
  percentile: number;
  interpretation: 'significantly_above' | 'above' | 'in_line' | 'below' | 'significantly_below';
}

export interface IndustryTrend {
  metric: string;
  trend: 'growing' | 'stable' | 'declining';
  growthRate?: number;
  outlook: 'positive' | 'neutral' | 'negative';
  timeframe: string;
}

export interface PeerComparison {
  peerGroup: string;
  peerCompanies: PeerCompany[];
  ranking: number;
  
  comparisonSummary: {
    overallRanking: number;
    totalPeers: number;
    percentilePosition: number;
    
    strongerThan: string[];
    weakerThan: string[];
    similarTo: string[];
  };
  
  keyDifferentiators: Differentiator[];
}

export interface PeerCompany {
  name: string;
  size: 'similar' | 'larger' | 'smaller';
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
}

export interface Differentiator {
  area: string;
  advantage: 'significant' | 'moderate' | 'slight' | 'disadvantage';
  description: string;
  sustainabilityRating: 'high' | 'medium' | 'low';
}

export interface ScoreHistory {
  date: Date;
  overallScore: number;
  sectionScores: Record<string, number>;
  investorReadinessLevel: InvestorReadinessLevel;
  
  changeFromPrevious?: {
    overallChange: number;
    sectionChanges: Record<string, number>;
    significantChanges: string[];
    improvementAreas: string[];
    deteriorationAreas: string[];
  };
  
  triggerEvent?: 'periodic_review' | 'document_update' | 'financial_update' | 'manual_recalculation' | 'application_submission';
  calculatedBy: string;
}

// Investor Readiness Report
export interface InvestorReadinessReport {
  id: string;
  smeId: string;
  profileId: string;
  
  // Report metadata
  reportVersion: string;
  reportType: 'full' | 'summary' | 'update' | 'custom';
  generatedFor: 'sme' | 'funder' | 'consultant' | 'admin';
  
  // Executive summary
  executiveSummary: ExecutiveSummary;
  
  // Detailed analysis
  detailedAnalysis: DetailedAnalysis;
  
  // Investment case
 // investmentCase: InvestmentCase;
  
  // Risk assessment
  riskAssessment: ComprehensiveRiskAssessment;
  
  // Recommendations
  recommendations: RecommendationSection;
  
  // Appendices
  appendices: ReportAppendix[];
  
  // Report generation details
  generatedAt: Date;
  generatedBy: string; // user id
  reviewedBy?: string; // admin/consultant id
  approvedBy?: string; // senior consultant/admin id
  
  // Distribution
  distributionList: string[]; // user/organization ids
  confidentialityLevel: 'public' | 'restricted' | 'confidential' | 'highly_confidential';
  
  // Validity and updates
  validUntil: Date;
  nextReviewDate: Date;
  updateTriggers: string[];
  
  // Report customization
  sections: string[]; // which sections to include
  customizations: ReportCustomizations;
  
  // Export details
  reportUrl?: string;
  pdfGenerated: boolean;
  wordDocGenerated: boolean;
  presentationGenerated: boolean;
}

export interface ExecutiveSummary {
  // Company overview
  companyOverview: string;
  businessModel: string;
  marketPosition: string;
  
  // Key highlights
  investmentHighlights: string[];
  competitiveAdvantages: string[];
  keySuccessFactors: string[];
  
  // Financial summary
  financialHighlights: {
    revenue: number;
    growth: number;
    profitability: number;
    cashFlow: number;
  };
  
  // Investment readiness summary
  readinessLevel: InvestorReadinessLevel;
  overallScore: number;
  investmentGrade: string;
  
  // Key risks
  primaryRisks: string[];
  riskMitigations: string[];
  
  // Investment recommendation
  recommendation: InvestmentRecommendation;
  
  // Next steps
  nextSteps: string[];
  timelineToInvestment: string;
}

export interface InvestmentRecommendation {
  recommendation: 'highly_recommend' | 'recommend' | 'conditional_recommend' | 'not_recommend';
  confidence: 'high' | 'medium' | 'low';
  
  reasoning: string[];
  conditions?: string[];
  alternatives?: string[];
  
  suggestedInvestmentRange: {
    min: number;
    max: number;
    optimal: number;
  };
  
  suggestedInvestmentStructure: string[];
  suggestedTerms: string[];
}

export interface DetailedAnalysis {
  // Management analysis
  managementAnalysis: ManagementAnalysisSection;
  
  // Financial analysis
  financialAnalysis: FinancialAnalysisSection;
  
  // Market analysis
  marketAnalysis: MarketAnalysisSection;
  
  // Operational analysis
  operationalAnalysis: OperationalAnalysisSection;
  
  // Strategic analysis (SWOT-based)
  strategicAnalysis: StrategicAnalysisSection;
  
  // Governance analysis
  governanceAnalysis: GovernanceAnalysisSection;
}

export interface ManagementAnalysisSection {
  teamStrength: number; // 0-100
  leadershipQuality: number; // 0-100
  experienceDepth: number; // 0-100
  
  keyPersonnel: KeyPersonAssessment[];
  teamGaps: string[];
  successionRisks: string[];
  
  governanceStructure: string;
  decisionMaking: string;
  
  recommendations: string[];
}

export interface KeyPersonAssessment {
  name: string;
  role: string;
  assessment: 'exceptional' | 'strong' | 'adequate' | 'weak';
  keyStrengths: string[];
  developmentAreas: string[];
  criticalityToSuccess: 'critical' | 'important' | 'supportive';
}

export interface FinancialAnalysisSection {
  financialHealth: 'excellent' | 'good' | 'fair' | 'poor';
  
  profitabilityAnalysis: string;
  liquidityAnalysis: string;
  leverageAnalysis: string;
  efficiencyAnalysis: string;
  
  historicalPerformance: string;
  projectionAssessment: string;
  cashFlowAssessment: string;
  
  keyRatios: Record<string, number>;
  benchmarking: string;
  
  financialRisks: string[];
  recommendations: string[];
}

export interface MarketAnalysisSection {
  marketSize: string;
  marketGrowth: string;
  competitivePosition: string;
  
  industryAnalysis: string;
  competitiveAdvantage: string[];
  marketOpportunities: string[];
  marketThreats: string[];
  
  customerAnalysis: string;
  revenueModel: string;
  
  marketingStrategy: string;
  salesCapabilities: string;
  
  recommendations: string[];
}

export interface OperationalAnalysisSection {
  operationalEfficiency: number; // 0-100
  scalabilityPotential: number; // 0-100
  
  businessModel: string;
  operationalCapabilities: string[];
  processMaturity: string;
  
  technologyAssessment: string;
  innovationCapability: string;
  
  supplierRelationships: string;
  customerSatisfaction: string;
  
  operationalRisks: string[];
  recommendations: string[];
}

export interface StrategicAnalysisSection {
  strategicPosition: string;
  
  // SWOT summary
  swotSummary: {
    keyStrengths: string[];
    criticalWeaknesses: string[];
    majorOpportunities: string[];
    significantThreats: string[];
  };
  
  strategicOptions: Strategy[];
  recommendedStrategies: string[];
  
  investmentAlignment: string;
  growthPotential: string;
  
  strategicRisks: string[];
  recommendations: string[];
}

export interface GovernanceAnalysisSection {
  governanceRating: number; // 0-100
  
  boardEffectiveness: string;
  managementCapability: string;
  controlEnvironment: string;
  
  complianceAssessment: string;
  riskManagement: string;
  
  governanceGaps: string[];
  recommendations: string[];
}

export interface ComprehensiveRiskAssessment {
  overallRiskRating: 'low' | 'medium' | 'high' | 'very_high';
  
  riskCategories: {
    businessRisk: RiskCategoryAssessment;
    financialRisk: RiskCategoryAssessment;
    operationalRisk: RiskCategoryAssessment;
    marketRisk: RiskCategoryAssessment;
    managementRisk: RiskCategoryAssessment;
    regulatoryRisk: RiskCategoryAssessment;
  };
  
  keyRiskFactors: RiskFactor[];
  riskMitigationPlan: RiskMitigation[];
  
  riskMonitoring: RiskMonitoring[];
  contingencyPlans: string[];
}

export interface RiskCategoryAssessment {
  rating: 'low' | 'medium' | 'high' | 'very_high';
  score: number; // 0-100
  
  keyRisks: string[];
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  
  currentMitigations: string[];
  additionalMitigations: string[];
  
  monitoringRequired: boolean;
  escalationTriggers: string[];
}

export interface RiskMitigation {
  riskCategory: string;
  specificRisk: string;
  mitigationStrategy: string;
  
  implementationPlan: string;
  timeline: string;
  responsibility: string;
  cost: number;
  
  effectiveness: 'high' | 'medium' | 'low';
  priority: 'high' | 'medium' | 'low';
}

export interface RiskMonitoring {
  riskArea: string;
  monitoringMethod: string;
  frequency: string;
  
  keyIndicators: string[];
  thresholds: Record<string, number>;
  escalationProcedure: string;
  
  responsible: string;
  reportingFrequency: string;
}

export interface RecommendationSection {
  // Priority recommendations
  priorityRecommendations: PriorityRecommendation[];
  
  // By category
  managementRecommendations: string[];
  financialRecommendations: string[];
  operationalRecommendations: string[];
  strategicRecommendations: string[];
  governanceRecommendations: string[];
  
  // Investment preparation
  investorReadinessImprovements: InvestorReadinessImprovement[];
  
  // Timeline and roadmap
  implementationRoadmap: ImplementationPhase[];
  
  // Success metrics
  successMetrics: string[];
  monitoringPlan: string;
}

export interface PriorityRecommendation {
  title: string;
  description: string;
  rationale: string;
  
  category: 'critical' | 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  
  expectedImpact: 'high' | 'medium' | 'low';
  implementationDifficulty: 'high' | 'medium' | 'low';
  
  estimatedCost: number;
  estimatedTimeframe: string;
  
  successMetrics: string[];
  dependencies: string[];
}

export interface InvestorReadinessImprovement {
  area: string;
  currentLevel: string;
  targetLevel: string;
  
  improvements: string[];
  timeline: string;
  estimatedCost: number;
  
  expectedScoreIncrease: number;
  priority: 'high' | 'medium' | 'low';
}

export interface ImplementationPhase {
  phase: string;
  duration: string;
  objectives: string[];
  
  activities: PhaseActivity[];
  deliverables: string[];
  
  resources: string[];
  budget: number;
  
  successCriteria: string[];
  riskFactors: string[];
}

export interface PhaseActivity {
  activity: string;
  description: string;
  startWeek: number;
  duration: number;
  
  resources: string[];
  dependencies: string[];
  
  deliverables: string[];
  successCriteria: string[];
}

export interface ReportAppendix {
  title: string;
  type: 'financial_data' | 'swot_analysis' | 'management_cvs' | 'market_research' | 'legal_documents' | 'other';
  
  content?: string;
  documentReferences?: string[]; // document ids
  dataVisualization?: any; // chart/graph data
  
  confidentialityLevel: 'public' | 'restricted' | 'confidential';
  includedInDistribution: boolean;
}

export interface ReportCustomizations {
  brandingSettings: {
    includeLogo: boolean;
    logoUrl?: string;
    colorScheme: string;
    headerFooter: string;
  };
  
  contentSettings: {
    executiveSummaryLength: 'brief' | 'standard' | 'detailed';
    includeFinancialDetails: boolean;
    includeSWOTDetails: boolean;
    includeManagementDetails: boolean;
    includeRiskDetails: boolean;
  };
  
  formatSettings: {
    pageLayout: 'portrait' | 'landscape';
    fontSize: 'small' | 'medium' | 'large';
    includeCharts: boolean;
    includeAppendices: boolean;
  };
  
  audienceSettings: {
    technicalLevel: 'basic' | 'intermediate' | 'advanced';
    industryFocus: boolean;
    includeDefinitions: boolean;
  };
}

// API Response Types for the entire system
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  timestamp: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface BulkOperationResponse {
  success: boolean;
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
  results: any[];
  timestamp: Date;
}