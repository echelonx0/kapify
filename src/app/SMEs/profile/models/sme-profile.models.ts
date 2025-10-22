 
import { FundingOpportunity } from "src/app/funder/create-opportunity/shared/funding.interfaces";
import { ProfileData } from "./funding.models";

// Application interfaces
export interface OpportunityApplication {
  id: string;
  applicantId: string;
  opportunityId: string;
  title: string;
  description?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  stage: 'initial_review' | 'due_diligence' | 'investment_committee' | 'documentation' | 'completed';
  
  // Application data
  profileData: Partial<ProfileData>;
  coverInformation: CoverInformation;
  
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
  requestedAmount: number;
  purposeStatement: string;
  useOfFunds: string;
  timeline?: string;
  opportunityAlignment?: string;
}

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