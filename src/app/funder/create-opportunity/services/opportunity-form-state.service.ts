// src/app/funder/services/opportunity-form-state.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';

export interface CreateOpportunityFormData {
  title: string;
  description: string;
  shortDescription: string;
  fundingOpportunityImageUrl: string;
  fundingOpportunityVideoUrl: string;
  funderOrganizationName: string;
  funderOrganizationLogoUrl: string;
  offerAmount: string;
  minInvestment: string;
  maxInvestment: string;
  currency: string;
  fundingType: (
    | 'debt'
    | 'equity'
    | 'convertible'
    | 'mezzanine'
    | 'grant'
    | 'purchase_order'
    | 'invoice_financing'
  )[];
  interestRate: string;
  equityOffered: string;
  repaymentTerms: string;
  securityRequired: string;
  useOfFunds: string;
  investmentStructure: string;
  expectedReturns: string;
  investmentHorizon: string;
  exitStrategy: string;
  applicationDeadline: string;
  decisionTimeframe: string;
  targetIndustries: string[];
  businessStages: string[];
  minRevenue: string;
  maxRevenue: string;
  minYearsOperation: string;
  geographicRestrictions: string[];
  requiresCollateral: boolean;
  typicalInvestment: string;
  maxApplications: string;
  autoMatch: boolean;
  isPublic: boolean;
  investmentCriteria: string[];
  exclusionCriteria: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

@Injectable({ providedIn: 'root' })
export class OpportunityFormStateService {
  private destroy$ = new Subject<void>();
  private localAutoSaveSubject = new Subject<void>(); // emits void, captures formData fresh at save time

  formData = signal<CreateOpportunityFormData>(this.getInitialState());
  validationErrors = signal<ValidationError[]>([]);
  hasUnsavedChanges = signal(false);
  lastLocalSave = signal<string | null>(null);

  // Add this signal near the top with other signals:
  isValidating = signal(true);
  hasMediaContent = computed(() => {
    const data = this.formData();
    return !!(
      data.fundingOpportunityImageUrl ||
      data.fundingOpportunityVideoUrl ||
      data.funderOrganizationName ||
      data.funderOrganizationLogoUrl
    );
  });

  constructor() {
    this.setupLocalAutoSave();
  }

  // ===== FIELD UPDATES =====
  updateField(
    field: keyof CreateOpportunityFormData,
    value: string | boolean
  ): void {
    this.formData.update((data) => ({ ...data, [field]: value }));
    this.hasUnsavedChanges.set(true);
    this.localAutoSaveSubject.next(); //  just trigger debounce, no data
  }

  updateMultiSelectField(
    field: keyof CreateOpportunityFormData,
    value: string,
    checked: boolean
  ): void {
    this.formData.update((data) => {
      const currentArray = data[field] as string[];
      const newArray = checked
        ? [...currentArray, value]
        : currentArray.filter((item) => item !== value);
      return { ...data, [field]: newArray };
    });
    this.hasUnsavedChanges.set(true);
    this.localAutoSaveSubject.next(); //   just trigger debounce
  }

  onNumberInput(field: keyof CreateOpportunityFormData, value: string): void {
    const cleanValue = value.replace(/[^\d]/g, '');
    this.formData.update((data) => ({ ...data, [field]: cleanValue }));
    this.hasUnsavedChanges.set(true);
    this.localAutoSaveSubject.next(); //   just trigger debounce
  }

  // ===== LIST MANAGEMENT (Investment & Exclusion Criteria) =====
  addToList(
    field: 'investmentCriteria' | 'exclusionCriteria',
    item: string
  ): boolean {
    const trimmed = item.trim();
    if (!trimmed || trimmed.length > 200) return false;

    this.formData.update((data) => ({
      ...data,
      [field]: [...(data[field] as string[]), trimmed],
    }));
    this.hasUnsavedChanges.set(true);
    this.localAutoSaveSubject.next(); //   trigger debounce
    return true;
  }

  removeFromList(
    field: 'investmentCriteria' | 'exclusionCriteria',
    index: number
  ): void {
    this.formData.update((data) => ({
      ...data,
      [field]: (data[field] as string[]).filter((_, i) => i !== index),
    }));
    this.hasUnsavedChanges.set(true);
    this.localAutoSaveSubject.next(); //   trigger debounce
  }

  // ===== NUMBER FORMATTING =====
  parseNumberValue(value: string): number {
    if (!value) return 0;
    const cleaned = value.replace(/[,\s]/g, '');
    return Number(cleaned) || 0;
  }

  formatNumberWithCommas(value: string | number): string {
    if (!value) return '';
    const numValue =
      typeof value === 'string' ? this.parseNumberValue(value) : value;
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  }

  getFormattedAmount(field: keyof CreateOpportunityFormData): string {
    const value = this.formData()[field] as string;
    return this.formatNumberWithCommas(value);
  }

  disableValidation(): void {
    this.isValidating.set(false);
  }

  // ===== VALIDATION =====
  validateForm(organizationId: string | null): void {
    const errors: ValidationError[] = [];
    const data = this.formData();

    if (!organizationId) {
      errors.push({
        field: 'organization',
        message: 'Organization setup is required',
        type: 'error',
      });
    }

    if (!data.title.trim()) {
      errors.push({
        field: 'title',
        message: 'Title is required',
        type: 'error',
      });
    } else if (data.title.length < 5) {
      errors.push({
        field: 'title',
        message: 'Title must be at least 5 characters',
        type: 'warning',
      });
    }

    if (!data.description.trim()) {
      errors.push({
        field: 'description',
        message: 'Description is required',
        type: 'error',
      });
    }

    this.validateUrls(data, errors);
    this.validateInvestmentAmounts(data, errors);
    this.validateRevenueRange(data, errors);

    this.validationErrors.set(errors);
  }

  private validateUrls(
    data: CreateOpportunityFormData,
    errors: ValidationError[]
  ): void {
    const urlFields = [
      'fundingOpportunityImageUrl',
      'fundingOpportunityVideoUrl',
      'funderOrganizationLogoUrl',
    ] as const;

    urlFields.forEach((field) => {
      if (data[field] && !this.isValidUrl(data[field])) {
        errors.push({
          field,
          message: `Please enter a valid ${field.replace(/Url/, '')} URL`,
          type: 'error',
        });
      }
    });
  }

  private validateInvestmentAmounts(
    data: CreateOpportunityFormData,
    errors: ValidationError[]
  ): void {
    const minInv = this.parseNumberValue(data.minInvestment);
    const maxInv = this.parseNumberValue(data.maxInvestment);
    const typicalInv = this.parseNumberValue(data.typicalInvestment);

    if (!data.fundingType?.length) {
      errors.push({
        field: 'fundingType',
        message: 'At least one funding type required',
        type: 'error',
      });
    }

    if (minInv > 0 && maxInv > 0 && maxInv < minInv) {
      errors.push({
        field: 'maxInvestment',
        message: 'Maximum must be ≥ minimum',
        type: 'error',
      });
    }

    if (typicalInv > 0 && minInv > 0 && typicalInv < minInv) {
      errors.push({
        field: 'typicalInvestment',
        message: 'Typical must be ≥ minimum',
        type: 'error',
      });
    }

    if (typicalInv > 0 && maxInv > 0 && typicalInv > maxInv) {
      errors.push({
        field: 'typicalInvestment',
        message: 'Typical must be ≤ maximum',
        type: 'error',
      });
    }
  }

  private validateRevenueRange(
    data: CreateOpportunityFormData,
    errors: ValidationError[]
  ): void {
    if (data.minRevenue && data.maxRevenue) {
      const minRev = this.parseNumberValue(data.minRevenue);
      const maxRev = this.parseNumberValue(data.maxRevenue);
      if (minRev > 0 && maxRev > 0 && maxRev < minRev) {
        errors.push({
          field: 'maxRevenue',
          message: 'Max revenue must be > min revenue',
          type: 'error',
        });
      }
    }
  }

  private isValidUrl(url: string): boolean {
    if (!url) return true;
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  getFieldError(fieldName: string): ValidationError | null {
    return (
      this.validationErrors().find((error) => error.field === fieldName) || null
    );
  }

  hasFieldError(fieldName: string): boolean {
    return this.validationErrors().some(
      (error) => error.field === fieldName && error.type === 'error'
    );
  }

  hasFieldWarning(fieldName: string): boolean {
    return this.validationErrors().some(
      (error) => error.field === fieldName && error.type === 'warning'
    );
  }

  onImageError(field: keyof CreateOpportunityFormData): void {
    const errors = this.validationErrors().filter(
      (error) => error.field !== field
    );
    errors.push({
      field: field as string,
      message: 'Invalid image URL or failed to load',
      type: 'warning',
    });
    this.validationErrors.set(errors);
  }

  // ===== DRAFT MANAGEMENT =====
  loadFromDraft(draftData: any): void {
    const typicalInv =
      draftData.typicalInvestment?.toString() ||
      draftData.totalAvailable?.toString() ||
      draftData.maxInvestment?.toString() ||
      '';

    const parseArrayField = (field: any): string[] => {
      if (Array.isArray(field)) {
        return field;
      }
      if (typeof field === 'string' && field.trim()) {
        try {
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : [field];
        } catch {
          return [field];
        }
      }
      return [];
    };

    this.formData.set({
      title: draftData.title || '',
      description: draftData.description || '',
      shortDescription: draftData.shortDescription || '',
      fundingOpportunityImageUrl: draftData.fundingOpportunityImageUrl || '',
      fundingOpportunityVideoUrl: draftData.fundingOpportunityVideoUrl || '',
      funderOrganizationName: draftData.funderOrganizationName || '',
      funderOrganizationLogoUrl: draftData.funderOrganizationLogoUrl || '',
      offerAmount: draftData.offerAmount?.toString() || '',
      minInvestment: draftData.minInvestment?.toString() || '',
      maxInvestment: draftData.maxInvestment?.toString() || '',
      currency: draftData.currency || 'ZAR',
      fundingType: Array.isArray(draftData.fundingType)
        ? draftData.fundingType
        : [],
      interestRate: draftData.interestRate?.toString() || '',
      equityOffered: draftData.equityOffered?.toString() || '',
      repaymentTerms: draftData.repaymentTerms || '',
      securityRequired: draftData.securityRequired || '',
      useOfFunds: draftData.useOfFunds || '',
      investmentStructure: draftData.investmentStructure || '',
      expectedReturns: draftData.expectedReturns?.toString() || '',
      investmentHorizon: draftData.investmentHorizon?.toString() || '',
      exitStrategy: draftData.exitStrategy || '',
      applicationDeadline: draftData.applicationDeadline?.toISOString
        ? draftData.applicationDeadline.toISOString().split('T')[0]
        : draftData.applicationDeadline?.split('T')[0] || '',
      decisionTimeframe: draftData.decisionTimeframe?.toString() || '30',
      investmentCriteria: draftData.investmentCriteria
        ? parseArrayField(draftData.investmentCriteria)
        : draftData.funderDefinedCriteria
        ? parseArrayField(draftData.funderDefinedCriteria)
        : [],
      exclusionCriteria: parseArrayField(draftData.exclusionCriteria),
      targetIndustries: draftData.eligibilityCriteria?.industries || [],
      businessStages: draftData.eligibilityCriteria?.businessStages || [],
      minRevenue: draftData.eligibilityCriteria?.minRevenue?.toString() || '',
      maxRevenue: draftData.eligibilityCriteria?.maxRevenue?.toString() || '',
      minYearsOperation:
        draftData.eligibilityCriteria?.minYearsOperation?.toString() || '',
      geographicRestrictions:
        draftData.eligibilityCriteria?.geographicRestrictions || [],
      requiresCollateral:
        draftData.eligibilityCriteria?.requiresCollateral || false,
      typicalInvestment: typicalInv,
      maxApplications: draftData.maxApplications?.toString() || '',
      autoMatch: draftData.autoMatch ?? true,
      isPublic: true,
    });

    console.log('This is Opportunity Form State draft Data', this.formData);
  }

  clearDraft(): void {
    this.clearLocalStorage();
    this.resetForm();
  }

  private resetForm(): void {
    this.formData.set(this.getInitialState());
    this.hasUnsavedChanges.set(false);
    this.validationErrors.set([]);
    this.isValidating.set(true); // ✅ Re-enable validation
  }

  private getInitialState(): CreateOpportunityFormData {
    return {
      title: '',
      description: '',
      shortDescription: '',
      fundingOpportunityImageUrl: '',
      fundingOpportunityVideoUrl: '',
      funderOrganizationName: '',
      funderOrganizationLogoUrl: '',
      offerAmount: '',
      minInvestment: '',
      maxInvestment: '',
      currency: 'ZAR',
      fundingType: ['debt', 'equity', 'convertible', 'mezzanine', 'grant'],
      interestRate: '',
      equityOffered: '',
      repaymentTerms: '',
      securityRequired: '',
      useOfFunds: '',
      investmentStructure: '',
      expectedReturns: '',
      investmentHorizon: '',
      exitStrategy: '',
      applicationDeadline: '',
      decisionTimeframe: '30',
      investmentCriteria: [],
      exclusionCriteria: [],
      targetIndustries: [],
      businessStages: [],
      minRevenue: '',
      maxRevenue: '',
      minYearsOperation: '',
      geographicRestrictions: [],
      requiresCollateral: false,
      typicalInvestment: '',
      maxApplications: '',
      autoMatch: true,
      isPublic: true,
    };
  }

  // ===== LOCAL STORAGE =====

  private setupLocalAutoSave(): void {
    this.localAutoSaveSubject
      .pipe(debounceTime(10000), takeUntil(this.destroy$))
      .subscribe(() => {
        this.saveToLocalStorage(this.formData());
      });
  }
  private saveToLocalStorage(formData: CreateOpportunityFormData): void {
    try {
      const saveData = { formData, lastSaved: new Date().toISOString() };
      localStorage.setItem('opportunity_draft', JSON.stringify(saveData));
      this.lastLocalSave.set(saveData.lastSaved);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  clearLocalStorage(): void {
    try {
      localStorage.removeItem('opportunity_draft');
      this.lastLocalSave.set(null);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  destroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
