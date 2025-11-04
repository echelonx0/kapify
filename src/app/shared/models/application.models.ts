// src/app/shared/models/application.models.ts

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'due_diligence'
  | 'investment_committee'
  | 'approved'
  | 'rejected'
  | 'funded'
  | 'withdrawn';
export type StatusColor =
  | 'neutral'
  | 'blue'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'green'
  | 'red'
  | 'gray';

export interface UseOfFundsBreakdown {
  category:
    | 'working_capital'
    | 'equipment'
    | 'expansion'
    | 'acquisition'
    | 'debt_refinancing'
    | 'marketing'
    | 'r_and_d'
    | 'other';
  description: string;
  amount: number;
  percentage: number;
  timeline: string;
  priority: 'high' | 'medium' | 'low';
  justification: string;
  expectedImpact: string;
}

export interface ProposedTerms {
  // Debt terms
  interestRate?: number;
  repaymentPeriod?: number; // months
  repaymentStructure?: string;
  securityOffered?: string;
  personalGuarantees?: boolean;

  // Equity terms
  equityOffered?: number; // percentage
  valuationExpected?: number;
  boardSeats?: number;
  votingRights?: string;
  liquidationPreference?: number;

  // General terms
  milestones?: ProposedMilestone[];
  covenants?: string[];
  useRestrictions?: string[];
  reportingRequirements?: string;

  // Exit provisions
  exitTimeline?: number; // years
  exitMechanism?: string;
}

export interface ProposedMilestone {
  name: string; // Add this property
  description: string;
  targetDate: Date;
  measurementCriteria: string[];
  successCriteria?: string[]; // Add this property
  consequenceIfMissed: string;
}

export interface ApplicationStage {
  stage:
    | 'submission'
    | 'initial_review'
    | 'detailed_review'
    | 'due_diligence'
    | 'investment_committee'
    | 'term_sheet'
    | 'legal_docs'
    | 'funding';
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'rejected';
  startDate?: Date;
  endDate?: Date;
  owner: string; // responsible person
  notes?: string;
  documents?: string[]; // required documents for this stage
}

export interface ApplicationStep {
  id: string; // permanent unique ID
  stepNumber: number; // order in the process
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dueDate?: Date;
  completedDate?: Date;
  owner: string; // responsible user id
  requiredDocuments: string[];
  deliverables: string[];
  notes?: string;
}

// AI Insights and Analysis
export interface AIInsights {
  // SWOT-based insights
  swotSummary: {
    keyStrengths: string[];
    majorWeaknesses: string[];
    topOpportunities: string[];
    significantThreats: string[];
    overallSWOTScore: number;
  };

  // Investment attractiveness
  investmentScore: number; // 0-100
  riskScore: number; // 0-100
  growthPotential: number; // 0-100

  // AI recommendations
  investmentRecommendation:
    | 'strongly_recommend'
    | 'recommend'
    | 'neutral'
    | 'not_recommend'
    | 'strongly_not_recommend';
  recommendationReasoning: string[];

  // Risk flags
  riskFlags: RiskFlag[];

  // Due diligence priorities
  dueDiligencePriorities: string[];

  // Comparable companies
  comparableCompanies?: ComparableCompany[];

  generatedAt: Date;
  aiModelVersion: string;
}

export interface RiskFlag {
  category:
    | 'financial'
    | 'operational'
    | 'market'
    | 'regulatory'
    | 'management'
    | 'competitive'
    | 'technology';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  recommendedAction: string;
  mitigationSuggestions: string[];
}

export interface ComparableCompany {
  name: string;
  industry: string;
  stage: string;
  revenue: number;
  valuation?: number;
  lastFundingRound?: {
    amount: number;
    date: Date;
    type: string;
  };
  similarityScore: number;
}

// Review and Notes System
export interface ReviewNote {
  id: string;
  reviewerId: string;
  reviewerName: string;
  category:
    | 'general'
    | 'financial'
    | 'swot'
    | 'business_model'
    | 'team'
    | 'market'
    | 'risk';

  content: string;
  rating?: number; // 1-5 or 1-10 scale
  sentiment: 'positive' | 'neutral' | 'negative' | 'concern';

  isPrivate: boolean; // internal note vs shared with applicant
  tags: string[];

  relatedDocuments?: string[]; // document ids
  relatedSWOTItems?: string[]; // SWOT item ids

  createdAt: Date;
  updatedAt?: Date;
}

// Due Diligence System
export interface DueDiligenceChecklist {
  // Financial due diligence
  financial: DueDiligenceCategory;

  // Legal due diligence
  legal: DueDiligenceCategory;

  // Commercial due diligence
  commercial: DueDiligenceCategory;

  // Management due diligence
  management: DueDiligenceCategory;

  // Operational due diligence
  operational: DueDiligenceCategory;

  // Technology due diligence (if applicable)
  technology?: DueDiligenceCategory;

  // ESG due diligence
  esg?: DueDiligenceCategory;

  // Overall completion
  overallCompletion: number; // percentage
  startDate: Date;
  targetCompletionDate: Date;
  actualCompletionDate?: Date;
}

export interface DueDiligenceCategory {
  name: string;
  items: DueDiligenceItem[];
  completion: number; // percentage
  owner: string; // responsible reviewer
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  summary?: string;
  keyFindings: string[];
  redFlags: string[];
}

export interface DueDiligenceItem {
  id: string;
  name: string;
  description: string;
  importance: 'critical' | 'high' | 'medium' | 'low';

  status:
    | 'not_started'
    | 'in_progress'
    | 'completed'
    | 'not_applicable'
    | 'red_flag';

  assignedTo: string; // user id
  dueDate?: Date;
  completedDate?: Date;

  findings: string;
  evidence: string[];
  documents: string[]; // document ids

  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  mitigationRequired: boolean;
  mitigationPlan?: string;

  createdAt: Date;
  updatedAt: Date;
}

// Investment Decision System
export interface InvestmentDecision {
  decision:
    | 'approved'
    | 'rejected'
    | 'conditional_approval'
    | 'request_more_info'
    | 'counter_offer';

  // Approved terms (if approved)
  approvedAmount?: number;
  approvedTerms?: ApprovedTerms;
  conditions?: Condition[];

  // Decision rationale
  decisionRationale: string;
  keyFactors: string[];
  concerns?: string[];

  // Committee details
  committeeMembers: CommitteeMember[];
  votingResults: VotingResult[];
  isUnanimous: boolean;

  // Next steps
  nextSteps: string[];
  deadlines: Deadline[];

  // Communication
  decisionCommunicated: boolean;
  communicationDate?: Date;
  communicationMethod: 'email' | 'phone' | 'meeting' | 'letter';

  decisionDate: Date;
  approvedBy: string; // user id
}

export interface ApprovedTerms {
  // Financial terms
  amount: number;
  currency: string;
  fundingType: string;

  // Debt terms
  interestRate?: number;
  repaymentTerm?: number;
  securityRequired?: string;

  // Equity terms
  equityPercentage?: number;
  preMoneyValuation?: number;
  liquidationPreference?: number;

  // Governance
  boardSeats?: number;
  observerRights?: boolean;
  votingRights?: string;

  // Commercial terms
  milestones: ApprovedMilestone[];
  covenants: string[];
  reportingRequirements: string[];

  // Legal terms
  warranties: string[];
  indemnities: string[];
  terminationRights: string[];

  validityPeriod: number; // days
  expiryDate: Date;
}

export interface ApprovedMilestone {
  description: string;
  targetDate: Date;
  measurementCriteria: string[];
  fundingTranche?: number; // amount released on completion
  consequences: string; // if missed
}

export interface Condition {
  type: 'precedent' | 'subsequent' | 'ongoing';
  description: string;
  dueDate?: Date;
  owner: 'applicant' | 'funder' | 'third_party';
  status: 'pending' | 'satisfied' | 'waived' | 'overdue';
  evidence?: string[];
}

export interface CommitteeMember {
  userId: string;
  name: string;
  role: string;
  votingPower: number;
  attendance: boolean;
}

export interface VotingResult {
  memberId: string;
  vote: 'approve' | 'reject' | 'abstain' | 'conditional';
  rationale?: string;
  conditions?: string[];
}

export interface Deadline {
  description: string;
  dueDate: Date;
  owner: 'applicant' | 'funder' | 'both';
  priority: 'high' | 'medium' | 'low';
  consequences: string;
}

// Compliance and Audit
export interface ComplianceCheck {
  checkType:
    | 'aml'
    | 'kyc'
    | 'sanctions'
    | 'pep'
    | 'regulatory'
    | 'tax'
    | 'environmental';
  status: 'pending' | 'passed' | 'failed' | 'requires_attention';
  checkedDate: Date;
  checkedBy: string;
  findings?: string;
  remedialActions?: string[];
  nextReviewDate?: Date;
}

export interface AuditEntry {
  id: string;
  action: string;
  entity: string; // what was changed
  entityId: string;
  changes: Record<string, any>;
  performedBy: string; // user id
  performedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

// Application Templates and Wizards
export interface ApplicationTemplate {
  id: string;
  name: string;
  description: string;

  // Template configuration
  fundingType: string;
  industryFocus?: string;
  amountRange: {
    min: number;
    max: number;
  };

  // Template sections
  sections: ApplicationTemplateSection[];

  // Required documents
  requiredDocuments: string[];

  // SWOT template integration
  swotTemplateId?: string;

  // Usage tracking
  usageCount: number;
  successRate: number; // percentage of applications using this template that get approved

  // Template metadata
  isActive: boolean;
  createdBy: string;
  approvedBy?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationTemplateSection {
  sectionId: string;
  title: string;
  description: string;
  order: number;

  // Section configuration
  isRequired: boolean;
  guidance: string;
  examples: string[];

  // Form fields
  fields: TemplateField[];

  // Validation rules
  validationRules: ValidationRule[];
}

export interface TemplateField {
  fieldId: string;
  fieldType:
    | 'text'
    | 'textarea'
    | 'number'
    | 'select'
    | 'multiselect'
    | 'date'
    | 'file'
    | 'checkbox';
  label: string;
  placeholder?: string;
  helpText?: string;

  // Field configuration
  isRequired: boolean;
  defaultValue?: any;
  options?: string[]; // for select/multiselect

  // Validation
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;

  // UI configuration
  displayOrder: number;
  width: 'full' | 'half' | 'third' | 'quarter';
  conditional?: {
    dependsOn: string; // field id
    showWhen: any; // value that triggers show
  };
}

export interface ValidationRule {
  ruleType: 'required' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  field: string;
  value?: any;
  message: string;
  customValidator?: string; // function name for custom validation
}

// Application Workflow and Status Management
export interface ApplicationWorkflow {
  id: string;
  name: string;
  description: string;

  // Workflow configuration
  fundingTypes: string[];
  amountThresholds: AmountThreshold[];

  // Workflow stages
  stages: WorkflowStage[];

  // Automation rules
  automationRules: AutomationRule[];

  // SLA configuration
  slaSettings: SLASettings;

  // Workflow metadata
  isActive: boolean;
  defaultWorkflow: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface AmountThreshold {
  minAmount: number;
  maxAmount?: number;
  workflowOverrides?: Partial<WorkflowStage>[];
}

export interface WorkflowStage {
  stageId: string;
  name: string;
  description: string;
  order: number;

  // Stage configuration
  isRequired: boolean;
  canSkip: boolean;
  autoAdvance: boolean;

  // Timing
  expectedDuration: number; // days
  maxDuration?: number; // days

  // Assignee configuration
  defaultAssignee?: string; // role or user id
  requiresSpecialist: boolean;

  // Required actions
  requiredActions: string[];
  requiredDocuments: string[];
  requiredApprovals: string[];

  // Exit criteria
  exitCriteria: ExitCriterion[];

  // Notifications
  notifications: StageNotification[];
}

export interface ExitCriterion {
  criterion: string;
  type: 'automatic' | 'manual' | 'conditional';
  condition?: string;
  nextStage: string;
}

export interface StageNotification {
  trigger: 'stage_start' | 'stage_overdue' | 'stage_complete' | 'custom';
  recipients: string[]; // roles or user ids
  template: string;
  delay?: number; // hours
}

export interface AutomationRule {
  ruleId: string;
  name: string;
  description: string;

  // Trigger conditions
  triggers: RuleTrigger[];

  // Actions to perform
  actions: RuleAction[];

  // Rule configuration
  isActive: boolean;
  priority: number;
}

export interface RuleTrigger {
  triggerType:
    | 'status_change'
    | 'time_elapsed'
    | 'score_threshold'
    | 'document_upload'
    | 'field_update'
    | 'external_event';
  conditions: Record<string, any>;
  operator: 'and' | 'or';
}

export interface RuleAction {
  actionType:
    | 'send_notification'
    | 'update_field'
    | 'assign_reviewer'
    | 'advance_stage'
    | 'create_task'
    | 'schedule_meeting';
  parameters: Record<string, any>;
  delay?: number; // minutes
}

export interface SLASettings {
  // Overall application SLA
  overallSLA: number; // days from submission to decision

  // Stage-specific SLAs
  stageSLAs: Array<{
    stageId: string;
    sla: number; // days
    escalationThreshold: number; // percentage of SLA before escalation
  }>;

  // SLA monitoring
  escalationRules: EscalationRule[];
  reportingFrequency: 'daily' | 'weekly' | 'monthly';
}

export interface EscalationRule {
  trigger:
    | 'sla_breach'
    | 'sla_warning'
    | 'stuck_application'
    | 'high_value_delay';
  threshold: number;
  escalateTo: string[]; // roles or user ids
  actions: string[];
}

// Application Analytics and Reporting
export interface ApplicationMetrics {
  // Volume metrics
  totalApplications: number;
  submittedApplications: number;
  reviewedApplications: number;
  approvedApplications: number;
  rejectedApplications: number;

  // Performance metrics
  averageProcessingTime: number; // days
  medianProcessingTime: number; // days
  slaComplianceRate: number; // percentage
  approvalRate: number; // percentage

  // Value metrics
  totalAmountRequested: number;
  totalAmountApproved: number;
  averageRequestAmount: number;
  averageApprovedAmount: number;

  // Quality metrics
  averageMatchScore: number;
  averageInvestorReadinessScore: number;
  dueDiligenceCompletionRate: number;
  documentComplianceRate: number;

  // Funnel analysis
  conversionRates: {
    submissionToReview: number;
    reviewToDueDiligence: number;
    dueDiligenceToCommittee: number;
    committeeToApproval: number;
    approvalToFunding: number;
  };

  // Time analysis
  stageTimings: Array<{
    stage: string;
    averageTime: number;
    medianTime: number;
    p95Time: number;
  }>;

  // Report metadata
  reportingPeriod: {
    start: Date;
    end: Date;
  };
  generatedAt: Date;
}

export interface ApplicationReport {
  id: string;
  applicationId: string;

  // Report configuration
  reportType:
    | 'summary'
    | 'detailed'
    | 'investment_committee'
    | 'board_report'
    | 'compliance';
  audience: 'internal' | 'committee' | 'board' | 'external';

  // Report sections
  executiveSummary: string;
  investmentHighlights: string[];
  keyRisks: string[];
  financialSummary: FinancialSummaryData;
  swotSummary: SWOTSummaryData;
  managementAssessment: string;
  marketAssessment: string;

  // Investment recommendation
  recommendation: 'approve' | 'reject' | 'conditional' | 'request_more_info';
  recommendationRationale: string;
  proposedTerms?: string;
  conditions?: string[];

  // Due diligence findings
  dueDiligenceFindings: DueDiligenceSummary;

  // Risk assessment
  riskAssessment: RiskAssessmentSummary;

  // Appendices
  appendices: ReportAppendix[];

  // Report metadata
  generatedBy: string;
  reviewedBy?: string[];
  approvedBy?: string;
  version: number;

  // Distribution
  confidentialityLevel:
    | 'public'
    | 'internal'
    | 'confidential'
    | 'highly_confidential';
  distributionList: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialSummaryData {
  currentRevenue: number;
  revenueGrowth: number;
  profitability: number;
  cashPosition: number;
  debtLevels: number;
  keyRatios: Record<string, number>;
  projectedPerformance: Array<{
    year: number;
    revenue: number;
    profit: number;
  }>;
}

export interface SWOTSummaryData {
  strengthsCount: number;
  weaknessesCount: number;
  opportunitiesCount: number;
  threatsCount: number;
  overallScore: number;
  keyStrengths: string[];
  criticalWeaknesses: string[];
  majorOpportunities: string[];
  significantThreats: string[];
}

export interface DueDiligenceSummary {
  overallCompletion: number;
  categoriesCompleted: number;
  totalItems: number;
  completedItems: number;
  redFlags: number;

  categoryBreakdown: Array<{
    category: string;
    completion: number;
    redFlags: string[];
    keyFindings: string[];
  }>;
}

export interface RiskAssessmentSummary {
  overallRisk: 'low' | 'medium' | 'high' | 'very_high';
  riskScore: number;

  riskCategories: Array<{
    category: string;
    level: string;
    score: number;
    keyRisks: string[];
  }>;

  mitigationRecommendations: string[];
  monitoringRequirements: string[];
}

export interface ReportAppendix {
  title: string;
  type:
    | 'financial_data'
    | 'swot_analysis'
    | 'due_diligence_details'
    | 'supporting_documents'
    | 'other';
  content?: string;
  documentReferences?: string[];
  dataVisualization?: any;
  includedInDistribution: boolean;
}

// Communication and Messaging
export interface MessageThread {
  id: string;
  applicationId: string;

  // Participants
  participants: ThreadParticipant[];

  // Thread settings
  subject: string;
  isPrivate: boolean;
  allowExternalParticipants: boolean;

  // Messages
  messages: Message[];

  // Thread metadata
  lastActivity: Date;
  messageCount: number;
  unreadCount: Record<string, number>; // unread count per user

  // Thread status
  isActive: boolean;
  isArchived: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface ThreadParticipant {
  userId: string;
  role: 'applicant' | 'reviewer' | 'committee_member' | 'observer' | 'admin';
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canInvite: boolean;
    canArchive: boolean;
  };
  joinedAt: Date;
  lastReadAt?: Date;
}

export interface Message {
  id: string;
  threadId: string;

  // Message content
  senderId: string;
  senderName: string;
  content: string;
  messageType: 'text' | 'file' | 'system' | 'status_update';

  // Attachments
  attachments: MessageAttachment[];

  // Message metadata
  isSystemMessage: boolean;
  isPrivate: boolean; // visible only to internal team
  replyToMessageId?: string;

  // Status tracking
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;

  // Reactions and responses
  reactions: MessageReaction[];

  createdAt: Date;
  editedAt?: Date;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  thumbnailUrl?: string;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: Date;
}

// Application Notifications
export interface ApplicationNotification {
  id: string;
  applicationId: string;

  // Notification details
  type:
    | 'status_change'
    | 'document_request'
    | 'meeting_scheduled'
    | 'decision_made'
    | 'deadline_approaching'
    | 'sla_breach';
  title: string;
  message: string;

  // Recipients
  recipients: NotificationRecipient[];

  // Delivery
  channels: ('email' | 'sms' | 'in_app' | 'push')[];
  priority: 'low' | 'medium' | 'high' | 'urgent';

  // Scheduling
  scheduledFor?: Date;
  deliveredAt?: Date;

  // Actions
  actionButtons?: NotificationAction[];

  // Metadata
  batchId?: string; // for grouped notifications
  templateId?: string;

  // Status tracking
  deliveryStatus: Record<string, 'pending' | 'sent' | 'delivered' | 'failed'>;

  createdAt: Date;
}

export interface NotificationRecipient {
  userId: string;
  email?: string;
  phoneNumber?: string;
  preferredChannels: string[];
  timezone: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  style: 'primary' | 'secondary' | 'danger';
  url?: string;
}

// Application Integration Models
export interface ApplicationIntegration {
  id: string;
  applicationId: string;

  // Integration type
  integrationType:
    | 'crm'
    | 'accounting'
    | 'banking'
    | 'document_management'
    | 'calendar'
    | 'video_conferencing'
    | 'e_signature';
  provider: string;

  // Configuration
  configuration: Record<string, any>;
  credentials: Record<string, any>; // encrypted

  // Sync settings
  syncEnabled: boolean;
  syncFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
  lastSyncAt?: Date;
  nextSyncAt?: Date;

  // Data mapping
  fieldMapping: IntegrationFieldMapping[];

  // Status
  status: 'active' | 'paused' | 'error' | 'disconnected';
  errorMessage?: string;

  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationFieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string; // function name or expression
  isRequired: boolean;
  defaultValue?: any;
}

// Note: Import SWOT types separately when needed:
// import { SWOTAnalysis, SWOTItem } from './swot.models';
