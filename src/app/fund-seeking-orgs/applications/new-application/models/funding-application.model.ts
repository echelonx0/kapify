import { ReviewNote } from 'src/app/fund-seeking-orgs/models/application.models';
import {
  UseOfFundsBreakdown,
  ProposedTerms,
  ApplicationStatus,
  ApplicationStage,
  ApplicationStep,
  AIInsights,
  DueDiligenceChecklist,
  InvestmentDecision,
  ComplianceCheck,
  AuditEntry,
} from 'src/app/shared/models/application.models';

// Enhanced Application Model with SWOT integration
export interface Application {
  id: string;
  smeId: string;
  smeOrganizationId: string;
  funderId: string;
  funderOrganizationId: string;
  fundId?: string;
  opportunityId?: string;

  // Application basics
  applicationNumber: string; // system generated
  title: string;
  description: string;

  // Investment request
  requestedAmount: number;
  currency: string;
  fundingType: 'debt' | 'equity' | 'mezzanine' | 'convertible' | 'grant';

  // Use of funds
  useOfFunds: UseOfFundsBreakdown[];
  purposeStatement: string;

  // Proposed terms
  proposedTerms?: ProposedTerms;

  // Required assessments
  smeProfileId: string;
  swotAnalysisId: string; // mandatory SWOT for each application
  businessPlanId?: string;
  pitchDeckId?: string;

  // Application process
  status: ApplicationStatus;
  currentStage: ApplicationStage;
  applicationSteps: ApplicationStep[];

  // Matching & scoring
  matchScore?: number; // algorithmic match score (0-100)
  aiInsights?: AIInsights;

  // Review process
  assignedReviewer?: string; // funder user id
  reviewTeam: string[]; // funder user ids
  reviewNotes: ReviewNote[];

  // Due diligence
  dueDiligenceChecklist?: DueDiligenceChecklist;
  dueDiligenceDocuments: string[]; // document ids

  // Decision tracking
  investmentCommitteeDate?: Date;
  decisionDate?: Date;
  decisionReason?: string;
  decisionDetails?: InvestmentDecision;

  // Communication
  messagesThread: string; // message thread id
  lastCommunication?: Date;

  // Timeline tracking
  submittedAt?: Date;
  reviewStartedAt?: Date;
  dueDiligenceStartedAt?: Date;
  termSheetIssuedAt?: Date;
  fundedAt?: Date;

  // Compliance & audit
  complianceChecks: ComplianceCheck[];
  auditTrail: AuditEntry[];

  createdAt: Date;
  updatedAt: Date;
}
