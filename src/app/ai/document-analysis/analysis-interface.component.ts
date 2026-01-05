/**
 * AI Analysis Request Interface
 * Maps to ai_analysis_requests table
 */
export interface AIAnalysisRequest {
  id: string;
  orgId: string;
  userId: string;
  requestType: 'analysis' | 'matching' | 'scoring' | 'document_review';
  status:
    | 'pending'
    | 'executed_free'
    | 'executed_paid'
    | 'cancelled'
    | 'failed';
  costCredits: number;
  wasFree: boolean;
  applicationData?: any;
  opportunityData?: any;
  profileData?: any;
  analysisResults?: any;
  investmentScore?: any;
  createdAt: Date;
  executedAt?: Date;
  errorMessage?: string;
  applicationId?: string;
  opportunityId?: string;
}

/**
 * AI Analysis Summary Metrics
 * For dashboard cards
 */
export interface AIAnalysisSummary {
  totalAnalyses: number;
  freeAnalyses: number;
  paidAnalyses: number;
  totalCreditsSpent: number;
  averageCostPerAnalysis: number;
  lastAnalysisDate?: Date;
  pendingAnalyses: number;
  failedAnalyses: number;
}

/**
 * Analysis History Filter
 */
export interface AnalysisHistoryFilter {
  searchQuery?: string;
  requestType?: string[];
  status?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  showFreeOnly?: boolean;
  showPaidOnly?: boolean;
}

/**
 * Analysis History Display Item
 * Enriched with application/opportunity names
 */
export interface AnalysisHistoryItem extends AIAnalysisRequest {
  applicationTitle?: string;
  opportunityTitle?: string;
  userName?: string;
  hasResults: boolean;
  canDownload: boolean;
}

/**
 * Analysis Export Options
 */
export interface AnalysisExportOptions {
  format: 'pdf' | 'excel';
  includeFullResults: boolean;
  analysis: AIAnalysisRequest;
}
