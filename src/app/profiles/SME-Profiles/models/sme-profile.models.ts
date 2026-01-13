import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
import { ProfileData } from './funding.models';
import { FundingApplicationCoverInformation } from 'src/app/shared/models/funding-application-cover.model';

// Application interfaces
export interface OpportunityApplication {
  id: string;
  applicantId: string;
  opportunityId: string;
  title: string;
  description?: string;
  status:
    | 'draft'
    | 'submitted'
    | 'under_review'
    | 'approved'
    | 'rejected'
    | 'withdrawn';
  stage:
    | 'initial_review'
    | 'due_diligence'
    | 'investment_committee'
    | 'documentation'
    | 'completed';

  // Application data
  profileData: Partial<ProfileData>;
  coverInformation: CoverInformation;
  fundingRequest?: FundingApplicationCoverInformation;

  // Metadata
  submittedAt?: Date;
  reviewStartedAt?: Date;
  reviewedAt?: Date;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Related data
  opportunity?: FundingOpportunity;
  aiAssessment?: AIAssessment;
  reviewNotes: ReviewNote[];
}

export interface CoverInformation {
  // Original fields
  requestedAmount: number;
  purposeStatement: string;
  useOfFunds: string;
  timeline: string;
  opportunityAlignment: string;

  // ✅ NEW: Add funding_request fields so they're accessible
  fundingMotivation?: string;
  fundingTypes?: string[];
  industries?: string[];
  fundingAmount?: number;
  businessStages?: string[];
  location?: string;
  repaymentStrategy?: string;
  equityOffered?: number | null;
  exclusionCriteria?: string[];
  investmentCriteria?: string[];

  // Any other fields from funding_request
  [key: string]: any;
}

// export interface CoverInformation {
//   requestedAmount: number;
//   purposeStatement: string;
//   useOfFunds: string;
//   timeline?: string;
//   opportunityAlignment?: string;
// }

export interface AIAssessment {
  overallScore: number; // 0-100
  matchScore: number;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  successProbability: 'high' | 'medium' | 'low';
  competitivePosition: 'strong' | 'moderate' | 'weak';
  assessedAt: Date;
}

export interface ReviewNote {
  id: string;
  reviewerId: string;
  reviewerName: string;
  note: string;
  type: 'internal' | 'external' | 'request_info';
  createdAt: Date;
  isRead: boolean;
}

export interface ApplicationDraft {
  opportunityId: string;
  coverInformation: Partial<CoverInformation>;
  lastSaved: Date;
}
