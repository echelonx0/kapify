// src/app/shared/models/swot.models.ts

export type SWOTCategory = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';
export type SWOTImpact = 'low' | 'medium' | 'high' | 'critical';

// SWOT Analysis (required for each application)
export interface SWOTAnalysis {
  id: string;
  smeId: string;
  applicationId?: string; // links to specific application if done per application
  profileId: string; // links to SME profile
  
  // SWOT Components
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  
  // Strategic analysis
  strategicMatrix: StrategyMatrix;
  keyInsights: string[];
  actionPlan: ActionPlan[];
  
  // Scoring and prioritization
  swotScores: SWOTScores;
  priorityMatrix: PriorityMatrix;
  
  // Context
  analysisContext: {
    industryContext: string;
    competitiveContext: string;
    economicContext: string;
    marketConditions: string;
    timeframe: string; // analysis validity period
  };
  
  // Metadata
  completedBy: string; // user id
  reviewedBy?: string; // admin/consultant id
  version: number;
  isTemplate: boolean; // can be reused for multiple applications
  
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
}

export interface SWOTItem {
  id: string;
  category: SWOTCategory;
  
  // Item details
  title: string;
  description: string;
  evidence?: string; // supporting evidence/data
  
  // Impact assessment
  impact: SWOTImpact;
  probability?: 'low' | 'medium' | 'high'; // for opportunities/threats
  controllability: 'high' | 'medium' | 'low'; // how much control company has
  
  // Prioritization
  priority: number; // 1-5 ranking within category
  urgency: 'low' | 'medium' | 'high';
  
  // Strategic relevance
  strategicRelevance: 'high' | 'medium' | 'low';
  investmentRelevance: 'high' | 'medium' | 'low'; // relevance to funding decision
  
  // Action items
  actionRequired: boolean;
  suggestedActions?: string[];
  mitigationStrategy?: string; // for weaknesses/threats
  leverageStrategy?: string; // for strengths/opportunities
  
  // Links to other areas
  relatedFinancialMetrics?: string[];
  relatedBusinessPlanAreas?: string[];
  
  createdBy: string;
  createdAt: Date;
}

export interface StrategyMatrix {
  // SO Strategies (Strength-Opportunity)
  soStrategies: Strategy[];
  
  // WO Strategies (Weakness-Opportunity) 
  woStrategies: Strategy[];
  
  // ST Strategies (Strength-Threat)
  stStrategies: Strategy[];
  
  // WT Strategies (Weakness-Threat)
  wtStrategies: Strategy[];
}

export interface Strategy {
  id: string;
  type: 'SO' | 'WO' | 'ST' | 'WT';
  title: string;
  description: string;
  
  // Links to SWOT items
  relatedStrengths?: string[]; // SWOT item ids
  relatedWeaknesses?: string[]; // SWOT item ids
  relatedOpportunities?: string[]; // SWOT item ids
  relatedThreats?: string[]; // SWOT item ids
  
  // Strategy details
  implementationPlan: string;
  requiredResources: string;
  timeline: string;
  expectedOutcome: string;
  successMetrics: string[];
  
  // Prioritization
  priority: 'high' | 'medium' | 'low';
  feasibility: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  
  // Investment relevance
  fundingRequired: boolean;
  estimatedCost?: number;
  expectedROI?: number;
}

export interface ActionPlan {
  id: string;
  title: string;
  description: string;
  
  // Source SWOT items
  sourceCategory: SWOTCategory;
  sourceSWOTItems: string[]; // SWOT item ids
  
  // Action details
  actionType: 'leverage' | 'improve' | 'capitalize' | 'mitigate' | 'monitor';
  priority: 'high' | 'medium' | 'low';
  
  // Implementation
  implementationSteps: ImplementationStep[];
  requiredResources: Resource[];
  timeline: ActionTimeline;
  
  // Success criteria
  successMetrics: SuccessMetric[];
  milestones: Milestone[];
  
  // Ownership
  owner: string; // responsible person
  stakeholders: string[]; // involved parties
  
  // Status tracking
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  completionPercentage: number;
  
  // Investment implications
  requiresFunding: boolean;
  estimatedCost?: number;
  fundingPriority?: 'high' | 'medium' | 'low';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ImplementationStep {
  step: number;
  description: string;
  dueDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  owner: string;
  dependencies?: number[]; // other step numbers
  deliverables: string[];
}

export interface Resource {
  type: 'human' | 'financial' | 'technology' | 'infrastructure' | 'expertise';
  description: string;
  estimatedCost?: number;
  availability: 'available' | 'needs_acquisition' | 'needs_funding';
  priority: 'critical' | 'important' | 'nice_to_have';
}

export interface ActionTimeline {
  startDate: Date;
  endDate: Date;
  phases: Array<{
    name: string;
    startDate: Date;
    endDate: Date;
    deliverables: string[];
  }>;
}

export interface SuccessMetric {
  name: string;
  description: string;
  targetValue: number;
  unit: string;
  measurementFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dataSource: string;
  currentValue?: number;
}

export interface Milestone {
  name: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: 'pending' | 'completed' | 'overdue';
  successCriteria: string[];
}

export interface SWOTScores {
  // Category scores (0-100)
  strengthsScore: number;
  weaknessesScore: number;
  opportunitiesScore: number;
  threatsScore: number;
  
  // Overall scores
  overallScore: number;
  investorReadinessImpact: number; // how SWOT affects investment attractiveness
  
  // Comparative analysis
  industryComparison?: {
    industry: string;
    benchmarkSource: string;
    relativePosition: 'above_average' | 'average' | 'below_average';
    keyDifferentiators: string[];
  };
}

export interface PriorityMatrix {
  // High impact, high control (leverage immediately)
  quickWins: SWOTItemReference[];
  
  // High impact, low control (strategic focus)
  strategicInitiatives: SWOTItemReference[];
  
  // Low impact, high control (fill-in projects)
  fillInProjects: SWOTItemReference[];
  
  // Low impact, low control (monitor/ignore)
  monitorItems: SWOTItemReference[];
}

export interface SWOTItemReference {
  swotItemId: string;
  title: string;
  category: SWOTCategory;
  impact: SWOTImpact;
  controllability: 'high' | 'medium' | 'low';
  investmentRelevance: 'high' | 'medium' | 'low';
}

// SWOT Analysis Templates (for reuse across applications)
export interface SWOTTemplate {
  id: string;
  name: string;
  description: string;
  
  // Template applicability
  industry?: string;
  businessStage?: string;
  companySize?: string;
  
  // Template SWOT items
  templateStrengths: SWOTTemplateItem[];
  templateWeaknesses: SWOTTemplateItem[];
  templateOpportunities: SWOTTemplateItem[];
  templateThreats: SWOTTemplateItem[];
  
  // Template strategies
  templateStrategies: StrategyTemplate[];
  
  // Usage tracking
  usageCount: number;
  lastUsed?: Date;
  
  // Template metadata
  isPublic: boolean;
  createdBy: string;
  approvedBy?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SWOTTemplateItem {
  category: SWOTCategory;
  title: string;
  description: string;
  
  // Default values
  defaultImpact: SWOTImpact;
  defaultPriority: number;
  
  // Guidance
  evidenceGuidance: string;
  evaluationQuestions: string[];
  
  // Applicability
  applicableIndustries?: string[];
  applicableStages?: string[];
}

export interface StrategyTemplate {
  type: 'SO' | 'WO' | 'ST' | 'WT';
  title: string;
  description: string;
  
  // Template guidance
  implementationGuidance: string;
  successMetricSuggestions: string[];
  
  // Typical requirements
  typicalResources: string[];
  typicalTimeline: string;
  
  // Applicability
  applicableIndustries?: string[];
  applicableStages?: string[];
}

// SWOT Analysis Reports and Export
export interface SWOTReport {
  id: string;
  swotAnalysisId: string;
  
  // Report configuration
  reportType: 'summary' | 'detailed' | 'strategic' | 'action_focused';
  includeStrategies: boolean;
  includeActionPlans: boolean;
  includePriorityMatrix: boolean;
  
  // Generated content
  executiveSummary: string;
  keyFindings: string[];
  strategicRecommendations: string[];
  actionPriorities: string[];
  
  // Visual elements
  chartData: SWOTChartData;
  matrixData: PriorityMatrixData;
  
  // Export formats
  pdfGenerated: boolean;
  wordGenerated: boolean;
  powerpointGenerated: boolean;
  
  // Report metadata
  generatedAt: Date;
  generatedBy: string;
  version: number;
}

export interface SWOTChartData {
  strengthsChart: ChartDataPoint[];
  weaknessesChart: ChartDataPoint[];
  opportunitiesChart: ChartDataPoint[];
  threatsChart: ChartDataPoint[];
  
  overviewChart: {
    categories: string[];
    scores: number[];
    industryBenchmarks?: number[];
  };
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color: string;
  priority: number;
}

export interface PriorityMatrixData {
  quadrants: {
    quickWins: MatrixItem[];
    strategicInitiatives: MatrixItem[];
    fillInProjects: MatrixItem[];
    monitorItems: MatrixItem[];
  };
}

export interface MatrixItem {
  id: string;
  title: string;
  impact: number;
  controllability: number;
  category: SWOTCategory;
  color: string;
}