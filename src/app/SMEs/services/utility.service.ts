import { Injectable, inject } from '@angular/core';
import { FundingApplicationProfile } from '../applications/models/funding-application.models';
import { ProfileData } from '../profile/models/funding.models';
import { SECTION_DATA_KEYS, STEP_FIELD_LABELS } from './funding-steps.constants';
import { ProfileValidationService } from './profile-validation.service';

@Injectable({ providedIn: 'root' })
export class FundingApplicationUtilityService {
  private validationService = inject(ProfileValidationService);
  
  // ===== DATA OPERATIONS =====
  
  mergeApplicationData(localData: any, backendData: any): any {
    return { ...backendData, ...localData };
  }
  
  getSectionData(sectionId: string, applicationData: Partial<FundingApplicationProfile>): any {
    const key = SECTION_DATA_KEYS[sectionId as keyof typeof SECTION_DATA_KEYS];
    if (!key) return {};
    return (applicationData as any)[key] || {};
  }
  
  // ===== VALIDATION & EMPTY CHECKS =====
  
  /**
   * Check if data is empty
   * Delegates to ProfileValidationService for consistent validation
   */
  isDataEmpty(data: any): boolean {
    return this.validationService.isDataEmpty(data);
  }

  /**
   * Check if object has meaningful data
   * Delegates to ProfileValidationService for consistent validation
   */
  isObjectNotEmpty(obj: any): boolean {
    return this.validationService.isObjectNotEmpty(obj);
  }
  
  // ===== STEP COMPLETION CHECK =====

  /**
   * Check if step has minimum required data
   * Delegates to ProfileValidationService for consistent validation
   */
  hasDataForStep(stepId: string, data: Partial<FundingApplicationProfile> | Partial<ProfileData>): boolean {
    return this.validationService.hasDataForStep(stepId, data as Partial<ProfileData>);
  }
  
  // ===== COMPLETION CALCULATIONS =====
  
  calculateCompletionPercentage(completedSteps: number, totalSteps: number): number {
    return totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  }
  
  /**
   * Get missing fields for a step
   * Delegates to ProfileValidationService for consistent validation
   */
  getMissingFieldsForStep(stepId: string, data: Partial<FundingApplicationProfile> | Partial<ProfileData>): string[] {
    return this.validationService.getMissingFields(stepId, data as Partial<ProfileData>);
  }
  
  // ===== TIME CALCULATIONS =====
  
  extractMinutesFromTime(timeString: string): number {
    const match = timeString?.match(/(\d+)\s*m(?:in)?(?:utes?)?/i);
    return match ? parseInt(match[1]) : 10;
  }
  
  calculateTotalTimeFromSteps(steps: any[], filterFn?: (step: any) => boolean): string {
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