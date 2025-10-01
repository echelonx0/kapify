// src/app/SMEs/models/application.models.ts
// Application interfaces
export interface FundingApplication {
  id: string;
  applicantId: string;
  opportunityId: string;
  title: string;
  description?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  stage: 'initial_review' | 'due_diligence' | 'investment_committee' | 'documentation' | 'completed';
  formData: Record<string, any>;
  documents: Record<string, any>;
  reviewNotes: ReviewNote[];
  terms?: Record<string, any>;
  submittedAt?: Date;
  reviewStartedAt?: Date;
  reviewedAt?: Date;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  aiAnalysisStatus?: string;
  aiMatchScore?: number;
  
  applicant?: ApplicantInfo;
  opportunity?: OpportunityInfo;
}

export interface ReviewNote {
  id: string;
  reviewerId: string;
  reviewerName: string;
  note: string;
  type: 'internal' | 'external' | 'request_info';
  createdAt: Date;
  isRead?: boolean;
}

export interface ApplicantInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  industry?: string;
  registrationNumber?: string;
}

export interface OpportunityInfo {
  id: string;
  title: string;
  fundingType: string;
  offerAmount: number;
  currency: string;
  organizationId: string;
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<string, number>;
  byStage: Record<string, number>;
  recentActivity: number;
  averageProcessingTime: number;
}

export interface ApplicationFilter {
  status?: string[];
  stage?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

// Document interfaces for type safety
export interface ApplicantDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: Date;
  documentType: string;
  status: 'pending' | 'verified' | 'rejected';
  downloadUrl?: string;
  metadata?: Record<string, any>;
}

export interface DocumentSection {
  companyRegistration?: ApplicantDocument;
  taxClearanceCertificate?: ApplicantDocument;
  auditedFinancials?: ApplicantDocument;
  businessPlan?: ApplicantDocument;
  bankStatements?: ApplicantDocument;
  [key: string]: ApplicantDocument | undefined;
}
