// src/app/applications/components/new-application/models/application-form.models.ts

export interface ApplicationFormData {
  requestedAmount: string;
  purposeStatement: string;
  useOfFunds: string;
  coverStatement?: File;
  fundingType: string;
}

export interface ApplicationFormValidation {
  isValid: boolean;
  errors: ApplicationFormErrors;
}

export interface ApplicationFormErrors {
  requestedAmount?: string;
  purposeStatement?: string;
  useOfFunds?: string;
  coverStatement?: string;
  fundingType?: string;
}

// RENAMED: ApplicationStep → ApplicationFormStep to avoid conflict
export interface ApplicationFormStep {
  id: ApplicationStepId;
  number: number;
  title: string;
  description: string;
}

export type ApplicationStepId =
  | 'select-opportunity'
  | 'application-details'
  | 'ai-analysis'
  | 'review-submit';
