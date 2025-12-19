import { Injectable } from '@angular/core';
import { FundingApplicationProfile } from '../applications/models/funding-application.models';
import {
  SECTION_DATA_KEYS,
  STEP_FIELD_LABELS,
} from './funding-steps.constants';

@Injectable({ providedIn: 'root' })
export class FundingApplicationUtilityService {
  // ===== DATA OPERATIONS =====

  mergeApplicationData(localData: any, backendData: any): any {
    const merged = { ...backendData, ...localData };

    // Deep merge companyInfo to preserve ownership
    if (backendData.companyInfo || localData.companyInfo) {
      merged.companyInfo = {
        ...(backendData.companyInfo || {}),
        ...(localData.companyInfo || {}),
      };
    }

    return merged;
  }

  getSectionData(
    sectionId: string,
    applicationData: Partial<FundingApplicationProfile>
  ): any {
    const key = SECTION_DATA_KEYS[sectionId as keyof typeof SECTION_DATA_KEYS];
    if (!key) return {};
    return (applicationData as any)[key] || {};
  }

  // ===== VALIDATION & EMPTY CHECKS =====

  isDataEmpty(data: any): boolean {
    if (!data || typeof data !== 'object') return true;
    return Object.values(data).every(
      (value) =>
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === 'object' && !this.isObjectNotEmpty(value))
    );
  }

  isObjectNotEmpty(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    return Object.values(obj).some(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== '' &&
        (Array.isArray(value) ? value.length > 0 : true)
    );
  }

  // ===== STEP COMPLETION CHECK =====

  hasDataForStep(
    stepId: string,
    data: Partial<FundingApplicationProfile>
  ): boolean {
    const sectionData = this.getSectionData(stepId, data);

    if (!sectionData || this.isObjectNotEmpty(sectionData) === false) {
      return false;
    }

    // Special case: SWOT requires minimum entries
    if (stepId === 'swot-analysis') {
      return this.hasMinimumSwotData(sectionData);
    }

    return true;
  }

  private hasMinimumSwotData(swot: any): boolean {
    return (
      swot.strengths?.length >= 2 &&
      swot.weaknesses?.length >= 2 &&
      swot.opportunities?.length >= 2 &&
      swot.threats?.length >= 2
    );
  }

  // ===== COMPLETION CALCULATIONS =====

  calculateCompletionPercentage(
    completedSteps: number,
    totalSteps: number
  ): number {
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  }

  getMissingFieldsForStep(
    stepId: string,
    data: Partial<FundingApplicationProfile>
  ): string[] {
    const fieldLabels =
      STEP_FIELD_LABELS[stepId as keyof typeof STEP_FIELD_LABELS] || {};
    const sectionData = this.getSectionData(stepId, data);

    return Object.entries(fieldLabels)
      .filter(
        ([key]) =>
          !sectionData ||
          !sectionData[key] ||
          sectionData[key] === '' ||
          sectionData[key] === null
      )
      .map(([_, label]) => label);
  }

  // ===== TIME CALCULATIONS =====

  extractMinutesFromTime(timeString: string): number {
    const match = timeString?.match(/(\d+)\s*m(?:in)?(?:utes?)?/i);
    return match ? parseInt(match[1]) : 10;
  }

  calculateTotalTimeFromSteps(
    steps: any[],
    filterFn?: (step: any) => boolean
  ): string {
    const filtered = filterFn ? steps.filter(filterFn) : steps;
    const totalMinutes = filtered.reduce((total, step) => {
      return total + this.extractMinutesFromTime(step.estimatedTime);
    }, 0);

    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}
