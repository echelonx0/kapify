// src/app/SMEs/services/profile-validation.service.ts
import { Injectable } from '@angular/core';
import { ProfileData } from '../profile/models/funding.models';
import { FundingApplicationProfile } from '../applications/models/funding-application.models';

/**
 * Step validation rule type
 */
interface StepValidationRule {
  requiredFields: readonly string[];
  displayName: string;
  customValidation?: string;
}

/**
 * Step validation configuration
 * Defines required fields and minimum data requirements for each step
 */
export const STEP_VALIDATION_RULES: Record<string, StepValidationRule> = {
  'company-info': {
    requiredFields: [
      'businessInfo.companyName',
      'businessInfo.registrationNumber',
      'businessInfo.industry',
      'businessInfo.yearsInOperation',
      'personalInfo.firstName',
      'personalInfo.lastName',
      'personalInfo.email',
    ],
    displayName: 'Company Information',
  },
  documents: {
    requiredFields: ['supportingDocuments'],
    displayName: 'Supporting Documents',
    customValidation: 'hasMinimumDocuments',
  },
  'business-assessment': {
    requiredFields: [
      'businessReview.businessModel',
      'businessReview.valueProposition',
      'businessReview.targetMarkets',
    ],
    displayName: 'Business Assessment',
  },
  'swot-analysis': {
    requiredFields: [],
    displayName: 'SWOT Analysis',
    customValidation: 'hasMinimumSwotData',
  },
  management: {
    requiredFields: [],
    displayName: 'Management & Governance',
    customValidation: 'hasManagementTeam',
  },
  'business-strategy': {
    requiredFields: [
      'businessPlan.executiveSummary',
      'businessPlan.missionStatement',
    ],
    displayName: 'Business Strategy',
  },
  'financial-profile': {
    requiredFields: ['financialInfo.monthlyRevenue'],
    displayName: 'Financial Profile',
  },
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  completionPercentage: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileValidationService {
  /**
   * Validate a specific step
   */
  validateStep(stepId: string, data: Partial<ProfileData>): ValidationResult {
    const rules = STEP_VALIDATION_RULES[stepId as keyof typeof STEP_VALIDATION_RULES];
    
    if (!rules) {
      console.warn(`No validation rules found for step: ${stepId}`);
      return {
        isValid: true,
        errors: [],
        warnings: [],
        missingFields: [],
        completionPercentage: 100,
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];

    // Check required fields
    for (const fieldPath of rules.requiredFields) {
      if (!this.hasNestedValue(data, fieldPath)) {
        missingFields.push(this.getFieldLabel(stepId, fieldPath));
      }
    }

    // Run custom validation if specified
    if (rules.customValidation) {
      const customResult = this.runCustomValidation(
        rules.customValidation,
        stepId,
        data
      );
      if (customResult.errors) {
        errors.push(...customResult.errors);
      }
      if (customResult.warnings) {
        warnings.push(...customResult.warnings);
      }
      if (!customResult.isValid && customResult.missingFields) {
        missingFields.push(...customResult.missingFields);
      }
    }

    const completionPercentage = this.calculateStepCompletion(
      stepId,
      data,
      missingFields
    );

    return {
      isValid: errors.length === 0 && missingFields.length === 0,
      errors,
      warnings,
      missingFields,
      completionPercentage,
    };
  }

  /**
   * Check if step has minimum required data
   */
  hasDataForStep(
    stepId: string,
    data: Partial<ProfileData> | Partial<FundingApplicationProfile>
  ): boolean {
    const validation = this.validateStep(stepId, data as Partial<ProfileData>);
    return validation.completionPercentage >= 50; // At least 50% complete
  }

  /**
   * Get missing fields for a step
   */
  getMissingFields(stepId: string, data: Partial<ProfileData>): string[] {
    const validation = this.validateStep(stepId, data);
    return validation.missingFields;
  }

  /**
   * Calculate step completion percentage
   */
  calculateStepCompletion(
    stepId: string,
    data: Partial<ProfileData>,
    missingFields?: string[]
  ): number {
    const rules = STEP_VALIDATION_RULES[stepId as keyof typeof STEP_VALIDATION_RULES];
    if (!rules) return 0;

    // Use provided missing fields or calculate them
    const missing =
      missingFields || this.validateStep(stepId, data).missingFields;
    const totalFields = rules.requiredFields.length || 1;
    const filledFields = totalFields - missing.length;

    // Custom completion for special steps
    if (rules.customValidation) {
      const customResult = this.runCustomValidation(
        rules.customValidation,
        stepId,
        data
      );
      if (customResult.completionPercentage !== undefined) {
        return customResult.completionPercentage;
      }
    }

    return Math.round((filledFields / totalFields) * 100);
  }

  /**
   * Validate entire profile
   */
  validateProfile(data: Partial<ProfileData>): {
    isComplete: boolean;
    requiredStepsCompleted: string[];
    requiredStepsIncomplete: string[];
    overallCompletion: number;
  } {
    const stepIds = Object.keys(STEP_VALIDATION_RULES);
    const requiredSteps = stepIds.filter((id) => id !== 'business-strategy' && id !== 'review');
    
    const completed: string[] = [];
    const incomplete: string[] = [];

    for (const stepId of requiredSteps) {
      const validation = this.validateStep(stepId, data);
      if (validation.isValid) {
        completed.push(stepId);
      } else {
        incomplete.push(stepId);
      }
    }

    const overallCompletion = Math.round(
      (completed.length / requiredSteps.length) * 100
    );

    return {
      isComplete: incomplete.length === 0,
      requiredStepsCompleted: completed,
      requiredStepsIncomplete: incomplete,
      overallCompletion,
    };
  }

  // ===============================
  // CUSTOM VALIDATION METHODS
  // ===============================

  private runCustomValidation(
    validationType: string,
    stepId: string,
    data: Partial<ProfileData>
  ): Partial<ValidationResult> & { completionPercentage?: number } {
    switch (validationType) {
      case 'hasMinimumDocuments':
        return this.validateDocuments(data);
      case 'hasMinimumSwotData':
        return this.validateSwotAnalysis(data);
      case 'hasManagementTeam':
        return this.validateManagement(data);
      default:
        return { isValid: true, errors: [], warnings: [], missingFields: [] };
    }
  }

  private validateDocuments(data: Partial<ProfileData>): Partial<ValidationResult> {
    const docs = data.supportingDocuments || data.documents || {};
    const docCount = Object.keys(docs).filter(
      (key) => (docs as any)[key] !== null && (docs as any)[key] !== undefined
    ).length;

    if (docCount === 0) {
      return {
        isValid: false,
        errors: [],
        warnings: ['At least one supporting document is required'],
        missingFields: ['At least one document'],
        completionPercentage: 0,
      };
    }

    return {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      completionPercentage: Math.min(docCount * 20, 100),
    };
  }

  private validateSwotAnalysis(data: Partial<ProfileData>): Partial<ValidationResult> {
    const swot = data.swotAnalysis;
    if (!swot) {
      return {
        isValid: false,
        errors: [],
        warnings: [],
        missingFields: ['SWOT Analysis data'],
        completionPercentage: 0,
      };
    }

    const minItems = 2;
    const missing: string[] = [];

    if (!swot.strengths || swot.strengths.length < minItems) {
      missing.push(`At least ${minItems} Strengths`);
    }
    if (!swot.weaknesses || swot.weaknesses.length < minItems) {
      missing.push(`At least ${minItems} Weaknesses`);
    }
    if (!swot.opportunities || swot.opportunities.length < minItems) {
      missing.push(`At least ${minItems} Opportunities`);
    }
    if (!swot.threats || swot.threats.length < minItems) {
      missing.push(`At least ${minItems} Threats`);
    }

    const totalCategories = 4;
    const completedCategories = totalCategories - missing.length;
    const completionPercentage = Math.round(
      (completedCategories / totalCategories) * 100
    );

    return {
      isValid: missing.length === 0,
      errors: [],
      warnings: missing,
      missingFields: missing,
      completionPercentage,
    };
  }

  private validateManagement(data: Partial<ProfileData>): Partial<ValidationResult> {
    const mgmt = data.managementGovernance;
    if (!mgmt) {
      return {
        isValid: false,
        errors: [],
        warnings: [],
        missingFields: ['Management team information'],
        completionPercentage: 0,
      };
    }

    const hasTeam = mgmt.managementTeam && mgmt.managementTeam.length > 0;
    const hasBoard = mgmt.boardOfDirectors && mgmt.boardOfDirectors.length > 0;

    if (!hasTeam && !hasBoard) {
      return {
        isValid: false,
        errors: [],
        warnings: ['At least one management team member or board member is required'],
        missingFields: ['Management team or board members'],
        completionPercentage: 0,
      };
    }

    const completionPercentage = (hasTeam ? 50 : 0) + (hasBoard ? 50 : 0);

    return {
      isValid: true,
      errors: [],
      warnings: [],
      missingFields: [],
      completionPercentage,
    };
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Check if nested value exists in object
   */
  private hasNestedValue(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) return false;
      current = current[key];
    }

    return (
      current !== null &&
      current !== undefined &&
      current !== '' &&
      (Array.isArray(current) ? current.length > 0 : true)
    );
  }

  /**
   * Get user-friendly label for field path
   */
  private getFieldLabel(stepId: string, fieldPath: string): string {
    // Extract the last part of the path for display
    const parts = fieldPath.split('.');
    const fieldName = parts[parts.length - 1];

    // Convert camelCase to Title Case
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Check if data is empty
   */
  isDataEmpty(data: any): boolean {
    if (!data || typeof data !== 'object') return true;

    return Object.values(data).every(
      (value) =>
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && this.isDataEmpty(value))
    );
  }

  /**
   * Check if object has meaningful data
   */
  isObjectNotEmpty(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    return !this.isDataEmpty(obj);
  }
}
