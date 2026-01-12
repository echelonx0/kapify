/**
 * Funding Application Cover Models
 * Templates/snapshots for funding applications
 * NOT locked to opportunities - can be reused/copied to any opportunity
 */

// ===== MAIN MODELS =====

export interface FundingApplicationCoverInformation {
  // Identity
  id: string;
  organizationId: string;
  isDefault: boolean;
  languageCode: string;

  // The 6 critical matching fields for recommendation engine
  industries: string[];
  fundingAmount: number;
  fundingTypes: string[]; // 'equity', 'debt', 'grant', 'convertible', 'mezzanine'
  businessStages: string[]; // 'early_stage', 'growth', 'mature'
  investmentCriteria: string[];
  exclusionCriteria: string[];
  location: string;

  // Customizable narrative content
  useOfFunds: string;
  executiveSummary: string;
  repaymentStrategy?: string;
  equityOffered?: number; // percentage, 0-100

  // Document storage
  coverDocumentId?: string;
  coverDocumentUrl?: string;
  coverDocumentName?: string;

  // Demographics data (NEW)
  demographics?: {
    [categoryId: string]: {
      [fieldName: string]: string | number | null;
    };
  };
  demographicsUpdatedAt?: Date;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ===== REQUEST/UPDATE TYPES =====

export interface UpdateCoverRequest {
  // Optional - user can update any/all fields
  industries?: string[];
  fundingAmount?: number;
  fundingTypes?: string[];
  businessStages?: string[];
  investmentCriteria?: string[];
  exclusionCriteria?: string[];
  location?: string;
  useOfFunds?: string;
  executiveSummary?: string;
  repaymentStrategy?: string;
  equityOffered?: number;
  isDefault?: boolean;
  coverDocumentUrl?: string;
  coverDocumentName?: string;
  coverDocumentId?: string;
}

export interface CreateCoverRequest {
  // Can be minimal - user fills in later
  industries?: string[];
  fundingAmount?: number;
  fundingTypes?: string[];
  businessStages?: string[];
  investmentCriteria?: string[];
  exclusionCriteria?: string[];
  location?: string;
  useOfFunds?: string;
  executiveSummary?: string;
  repaymentStrategy?: string;
  equityOffered?: number;
  isDefault?: boolean;
}

// ===== OPERATION RESULTS =====

export interface CoverOperationResult {
  success: boolean;
  cover?: FundingApplicationCoverInformation;
  message?: string;
  error?: string;
}

export interface CoverListResult {
  success: boolean;
  covers: FundingApplicationCoverInformation[];
  total: number;
  message?: string;
  error?: string;
}

export interface CoverQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'created' | 'updated' | 'name';
  sortOrder?: 'asc' | 'desc';
  onlyDefaults?: boolean;
}

// ===== VALIDATION =====

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CompletionStatus {
  completionPercentage: number;
  filledFields: string[];
  missingRequiredFields: string[];
  isReadyForSubmission: boolean;
}
