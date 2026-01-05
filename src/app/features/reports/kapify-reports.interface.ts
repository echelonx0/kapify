/**
 * KapifyReports Interface
 * Represents the complete reporting data structure for Kapify platform
 * Aligns with the Excel export template structure
 */

export interface KapifyReports {
  // Company Details Section
  no: number;
  nameOfBusiness: string;
  industry: string;
  physicalAddress: string;
  businessDetails: string;
  businessStage: 'Pre-Launch' | 'Startup' | 'Early Growth' | 'Growth' | 'Mature' | 'Expansion';
  yearsInOperation: number;
  numberOfEmployees: number;
  bbbeeLeve: 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4' | 'Level 5' | 'Level 6' | 'Level 7' | 'Level 8' | 'Non-Compliant';
  province: string;
  priorYearAnnualRevenue: number;

  // Contact Person Details Section
  firstName: string;
  surname: string;
  email: string;
  phoneNumber: string;
  role: string;

  // Funding Details Section
  amountRequested: number;
  fundingType: 'Equity' | 'Debt' | 'Grant' | 'Hybrid';
  fundingOpportunity: string;
  useOfFunds: string;
  applicationStatus: 'Draft' | 'Submitted' | 'Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Withdrawn';
}

/**
 * Extended KapifyReports with metadata
 * Includes timing and tracking information
 */
export interface KapifyReportsExtended extends KapifyReports {
  // System fields
  id: string;
  userId: string;
  organizationId?: string;
  applicationId?: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  reviewedAt?: Date;
  decidedAt?: Date;

  // AI Analysis (optional)
  aiMatchScore?: number;
  aiAnalysisStatus?: 'pending' | 'processing' | 'completed' | 'failed';
}

/**
 * KapifyReports Form Model
 * Used for form submissions and validation
 */
export interface KapifyReportsForm extends Omit<KapifyReports, 'no'> {
  // Allows for optional fields during form entry
  id?: string;
  [key: string]: any;
}

/**
 * Bulk KapifyReports Upload
 * For importing multiple reports at once
 */
export interface KapifyReportsBulkUpload {
  fileName: string;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  records: KapifyReports[];
  errors?: Array<{
    rowNumber: number;
    error: string;
  }>;
  uploadedAt: Date;
  uploadedBy: string;
}

/**
 * KapifyReports Filter/Search Options
 */
export interface KapifyReportsFilter {
  searchQuery?: string;
  industry?: string[];
  businessStage?: string[];
  province?: string[];
  fundingType?: string[];
  applicationStatus?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  minAmount?: number;
  maxAmount?: number;
  minEmployees?: number;
  maxEmployees?: number;
}

/**
 * KapifyReports Export Options
 */
export interface KapifyReportsExportOptions {
  format: 'excel' | 'pdf' | 'csv';
  columns?: Array<keyof KapifyReports>;
  filters?: KapifyReportsFilter;
  includeMetadata?: boolean;
  fileName?: string;
}
