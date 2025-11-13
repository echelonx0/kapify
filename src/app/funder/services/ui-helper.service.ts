// src/app/funder/services/ui-helper.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { OpportunityFormStateService } from './opportunity-form-state.service';
import { StepNavigationService } from '../create-opportunity/step-navigation.service';

@Injectable({ providedIn: 'root' })
export class OpportunityUIHelperService {
  private formState = inject(OpportunityFormStateService);
  private stepNav = inject(StepNavigationService);

  // Dropdowns - use signals for type safety
  readonly targetIndustriesOpen = signal(false);
  readonly businessStagesOpen = signal(false);
  readonly geoOpen = signal(false);

  targetIndustries = [
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'fintech', label: 'Fintech' },
    { value: 'health', label: 'Health' },
    { value: 'education', label: 'Education' },
    { value: 'ecommerce', label: 'E-commerce' },
  ];

  businessStages = [
    { value: 'ideation', label: 'Ideation' },
    { value: 'pre_revenue', label: 'Pre-revenue' },
    { value: 'early_revenue', label: 'Early Revenue' },
    { value: 'growth', label: 'Growth' },
    { value: 'mature', label: 'Mature' },
  ];

  geographicRegions = [
    { value: 'southern_africa', label: 'Southern Africa' },
    { value: 'east_africa', label: 'East Africa' },
    { value: 'west_africa', label: 'West Africa' },
    { value: 'north_africa', label: 'North Africa' },
  ];

  timeframes = [
    { value: '7', label: '7 days' },
    { value: '14', label: '14 days' },
    { value: '30', label: '30 days' },
    { value: '60', label: '60 days' },
    { value: '90', label: '90 days' },
  ];

  // ===== DROPDOWN MANAGEMENT =====
  toggleDropdown(
    dropdown: 'targetIndustriesOpen' | 'businessStagesOpen' | 'geoOpen'
  ): void {
    const signal = this[dropdown];
    signal.set(!signal());
  }

  closeDropdown(
    dropdown: 'targetIndustriesOpen' | 'businessStagesOpen' | 'geoOpen'
  ): void {
    this[dropdown].set(false);
  }

  // ===== FIELD UPDATES (DELEGATE TO FORM STATE) =====
  onFieldChange(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.formState.updateField(field as any, value);
  }

  onCheckboxChange(field: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.formState.updateField(field as any, checked);
  }

  onMultiSelectChange(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const checked = (event.target as HTMLInputElement).checked;
    this.formState.updateMultiSelectField(field as any, value, checked);
  }

  onNumberInputChange(field: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.formState.onNumberInput(field as any, value);
  }

  // ===== NUMBER FORMATTING (DELEGATE) =====
  formatNumberWithCommas(value: string | number): string {
    return this.formState.formatNumberWithCommas(value);
  }

  getFormattedAmount(field: string): string {
    return this.formState.getFormattedAmount(field as any);
  }

  // ===== FIELD STYLING =====
  getFieldClasses(fieldName: string): string {
    const hasError = this.formState.hasFieldError(fieldName);
    const hasWarning = this.formState.hasFieldWarning(fieldName);

    return `w-full px-4 py-2.5 border rounded-xl transition-all duration-200 ${
      hasError
        ? 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500'
        : hasWarning
        ? 'border-yellow-300 bg-yellow-50 text-yellow-900 focus:ring-yellow-500'
        : 'border-slate-200 bg-white text-slate-900 focus:ring-orange-500'
    } focus:outline-none focus:ring-2`;
  }

  // ===== STATUS & COMPLETION =====
  showDatabaseSaveStatus(): boolean {
    return !!this.formState.lastLocalSave();
  }

  showLocalSaveStatus(): boolean {
    return this.formState.hasUnsavedChanges();
  }

  showUnsavedIndicator(): boolean {
    return this.formState.hasUnsavedChanges();
  }

  getLastSavedText(): string {
    const lastSaved = this.formState.lastLocalSave();
    if (!lastSaved) return '';
    const date = new Date(lastSaved);
    return `Last saved: ${date.toLocaleTimeString()}`;
  }

  getLocalSaveText(): string {
    return this.formState.hasUnsavedChanges() ? 'Unsaved changes' : 'All saved';
  }

  getCompletionPercentage(): number {
    return this.stepNav.progressPercentage();
  }

  // ===== PAGE TEXT =====
  getPageTitle(isEditMode: boolean): string {
    return isEditMode
      ? 'Edit Funding Opportunity'
      : 'Create Funding Opportunity';
  }

  getPageSubtitle(isEditMode: boolean): string {
    return isEditMode
      ? 'Update your opportunity details'
      : 'Set up a new funding opportunity for SMEs';
  }

  getPublishButtonText(isEditMode: boolean): string {
    return isEditMode ? 'Update Opportunity' : 'Publish Opportunity';
  }

  getSaveButtonText(isEditMode: boolean): string {
    return isEditMode ? 'Save Changes' : 'Save Draft';
  }

  getCurrentStepIcon(): any {
    return this.stepNav.getCurrentStepIcon();
  }

  getCurrentStepTitle(): string {
    return this.stepNav.getCurrentStepTitle();
  }

  // ===== IMAGE ERROR HANDLING (DELEGATE) =====
  onImageError(field: string): void {
    this.formState.onImageError(field as any);
  }
}
