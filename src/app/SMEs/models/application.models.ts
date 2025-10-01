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
  metadata?: ApplicationMetadata;
}

/**
 * Extended metadata for internal workflow tracking
 */
export interface ApplicationMetadata {
  // Internal status tracking
  internalStatus?: 'committee_review' | 'pending_documents' | 'pending_amendments' 
                  | 'flagged_review' | 'peer_review';
  internalStatusUpdatedAt?: string;
  internalStatusUpdatedBy?: string;
  
  // Priority management
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  priorityUpdatedAt?: string;
  priorityUpdatedBy?: string;
  
  // Internal notes (visible only to review team)
  internalNotes?: InternalNote[];
  
  // Committee review tracking
  committeeReview?: {
    referredAt?: string;
    referredBy?: string;
    reviewScheduledFor?: string;
    reviewedAt?: string;
    reviewDecision?: string;
    reviewComments?: string;
  };
  
  // Peer review tracking
  peerReview?: {
    requestedAt?: string;
    requestedBy?: string;
    assignedTo?: string;
    completedAt?: string;
    recommendation?: string;
    comments?: string;
  };
  
  // Document request tracking
  documentRequests?: DocumentRequest[];
  
  // Amendment requests
  amendmentRequests?: AmendmentRequest[];
  
  // Additional flags
  flags?: {
    requiresLegalReview?: boolean;
    requiresComplianceCheck?: boolean;
    requiresTechnicalReview?: boolean;
    customFlags?: string[];
  };
  
  // Any other custom metadata
  [key: string]: any;
}

/**
 * Internal note (not visible to applicant)
 */
export interface InternalNote {
  id?: string;
  note: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  category?: 'general' | 'risk' | 'financial' | 'compliance' | 'other';
  isResolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

/**
 * Document request tracking
 */
export interface DocumentRequest {
  id?: string;
  requestedAt: string;
  requestedBy: string;
  requestedByName?: string;
  documentType: string;
  description: string;
  dueDate?: string;
  status: 'pending' | 'submitted' | 'received' | 'verified';
  submittedAt?: string;
  documentId?: string;
  notes?: string;
}

/**
 * Amendment request tracking
 */
export interface AmendmentRequest {
  id?: string;
  requestedAt: string;
  requestedBy: string;
  requestedByName?: string;
  section: string;
  currentValue?: string;
  requestedChange: string;
  reason: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
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
  byInternalStatus?: Record<string, number>;
  byPriority?: Record<string, number>;
  recentActivity: number;
  averageProcessingTime: number;
  pendingDocumentRequests?: number;
  pendingAmendments?: number;
  inCommitteeReview?: number;
}

export interface ApplicationFilter {
  status?: string[];
  stage?: string[];
  internalStatus?: string[];
  priority?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
  hasFlags?: boolean;
  assignedReviewer?: string;
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

/**
 * Type guards for internal status checking
 */
export const isInternalStatus = (status?: string): status is NonNullable<ApplicationMetadata['internalStatus']> => {
  if (!status) return false;
  return ['committee_review', 'pending_documents', 'pending_amendments', 'flagged_review', 'peer_review']
    .includes(status);
};

export const isPriorityLevel = (priority?: string): priority is NonNullable<ApplicationMetadata['priority']> => {
  if (!priority) return false;
  return ['low', 'medium', 'high', 'urgent'].includes(priority);
};

/**
 * Helper to get display names for internal statuses
 */
export const getInternalStatusLabel = (status?: string): string => {
  const labels: Record<string, string> = {
    'committee_review': 'Committee Review',
    'pending_documents': 'Pending Documents',
    'pending_amendments': 'Pending Amendments',
    'flagged_review': 'Flagged for Review',
    'peer_review': 'Peer Review'
  };
  return status ? labels[status] || status : '';
};

/**
 * Helper to get priority display info
 */
export const getPriorityInfo = (priority?: string): { label: string; colorClass: string } => {
  const info: Record<string, { label: string; colorClass: string }> = {
    'urgent': { label: 'Urgent', colorClass: 'bg-red-100 text-red-700' },
    'high': { label: 'High Priority', colorClass: 'bg-orange-100 text-orange-700' },
    'medium': { label: 'Medium Priority', colorClass: 'bg-yellow-100 text-yellow-700' },
    'low': { label: 'Low Priority', colorClass: 'bg-blue-100 text-blue-700' }
  };
  return priority ? info[priority] || { label: priority, colorClass: 'bg-gray-100 text-gray-700' } 
                  : { label: '', colorClass: '' };
};