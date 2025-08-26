// src/app/funder/components/create-opportunity/shared/form-interfaces.ts
export interface OpportunityFormData {
  // Basic details
  title: string;
  description: string;
  shortDescription: string;
  
  // NEW: Media & Branding fields
  fundingOpportunityImageUrl: string;
  fundingOpportunityVideoUrl: string;
  funderOrganizationName: string;
  funderOrganizationLogoUrl: string;
  
  // Investment terms
  offerAmount: string;
  minInvestment: string;
  maxInvestment: string;
  currency: string;
  fundingType: 'debt' | 'equity' | 'convertible' | 'mezzanine' | 'grant' | '';
  
  // Specific terms
  interestRate: string;
  equityOffered: string;
  repaymentTerms: string;
  securityRequired: string;
  
  // Deal specifics
  useOfFunds: string;
  investmentStructure: string;
  expectedReturns: string;
  investmentHorizon: string;
  exitStrategy: string;
  
  // Process
  applicationDeadline: string;
  decisionTimeframe: string;
  
  // Eligibility
  targetIndustries: string[];
  businessStages: string[];
  minRevenue: string;
  maxRevenue: string;
  minYearsOperation: string;
  geographicRestrictions: string[];
  requiresCollateral: boolean;
  
  // Availability
  totalAvailable: string;
  maxApplications: string;
  
  // Settings
  autoMatch: boolean;
  isPublic: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export interface FormStepProps {
  formData: OpportunityFormData;
  validationErrors: ValidationError[];
  onFormChange: (updates: Partial<OpportunityFormData>) => void;
  onValidationChange?: (errors: ValidationError[]) => void;
}

export interface StepInfo {
  id: 'basic' | 'terms' | 'eligibility' | 'settings' | 'review';
  icon: any;
  title: string;
  description: string;
}

// Form field utility types
export type NumberFieldKey = 'offerAmount' | 'minInvestment' | 'maxInvestment' | 'totalAvailable' | 
  'maxApplications' | 'interestRate' | 'equityOffered' | 'expectedReturns' | 'investmentHorizon' | 
  'minRevenue' | 'maxRevenue' | 'minYearsOperation';

export type StringFieldKey = Exclude<keyof OpportunityFormData, NumberFieldKey | 'targetIndustries' | 
  'businessStages' | 'geographicRestrictions' | 'requiresCollateral' | 'autoMatch' | 'isPublic'>;

export type ArrayFieldKey = 'targetIndustries' | 'businessStages' | 'geographicRestrictions';

export type BooleanFieldKey = 'requiresCollateral' | 'autoMatch' | 'isPublic';