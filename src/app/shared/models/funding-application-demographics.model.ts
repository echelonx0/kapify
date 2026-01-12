/**
 * Demographics Models
 * Types for demographic data collection
 */

// ===== FIELD TYPES =====

export type DemographicFieldType =
  | 'text'
  | 'percentage'
  | 'number'
  | 'dropdown';

export interface DemographicField {
  name: string; // fieldName (camelCase)
  label: string; // Display label
  type: DemographicFieldType; // text, percentage, number, dropdown
  required: boolean;
  placeholder?: string;
  options?: string[]; // For dropdown type only
  min?: number; // For number/percentage
  max?: number; // For number/percentage
  helpText?: string;
}

// ===== CATEGORY =====

export interface DemographicCategory {
  id: string; // category ID (camelCase)
  label: string; // Display label
  description?: string;
  fields: DemographicField[];
  order?: number; // For sorting
}

// ===== DATA =====

export interface DemographicValue {
  [fieldName: string]: string | number | null;
}

export interface DemographicsData {
  [categoryId: string]: DemographicValue;
}

// ===== FORM STATE =====

export interface DemographicsFormState {
  data: DemographicsData;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastSavedAt: Date | null;
}

// ===== VALIDATION =====

export interface FieldValidationError {
  fieldName: string;
  error: string;
}

export interface DemographicsValidationResult {
  isValid: boolean;
  errors: FieldValidationError[];
}

export interface DemographicsCompletionStatus {
  totalFields: number;
  filledFields: number;
  completionPercentage: number;
  categoryCompletion: {
    [categoryId: string]: {
      total: number;
      filled: number;
      percentage: number;
    };
  };
}
