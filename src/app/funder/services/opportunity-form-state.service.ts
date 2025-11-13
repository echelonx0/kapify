// // src/app/funder/services/opportunity-form-state.service.ts
// import { Injectable, signal, computed, inject } from '@angular/core';
// import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

// export interface CreateOpportunityFormData {
//   title: string;
//   description: string;
//   shortDescription: string;
//   fundingOpportunityImageUrl: string;
//   fundingOpportunityVideoUrl: string;
//   funderOrganizationName: string;
//   funderOrganizationLogoUrl: string;
//   offerAmount: string;
//   minInvestment: string;
//   maxInvestment: string;
//   currency: string;
//   fundingType: (
//     | 'debt'
//     | 'equity'
//     | 'convertible'
//     | 'mezzanine'
//     | 'grant'
//     | 'purchase_order'
//     | 'invoice_financing'
//   )[];
//   interestRate: string;
//   equityOffered: string;
//   repaymentTerms: string;
//   securityRequired: string;
//   useOfFunds: string;
//   investmentStructure: string;
//   expectedReturns: string;
//   investmentHorizon: string;
//   exitStrategy: string;
//   applicationDeadline: string;
//   decisionTimeframe: string;

//   targetIndustries: string[];
//   businessStages: string[];
//   minRevenue: string;
//   maxRevenue: string;
//   minYearsOperation: string;
//   geographicRestrictions: string[];
//   requiresCollateral: boolean;
//   typicalInvestment: string;
//   maxApplications: string;
//   autoMatch: boolean;
//   isPublic: boolean;

//   investmentCriteria: string[]; // was string
//   exclusionCriteria: string[]; // was string
// }

// export interface ValidationError {
//   field: string;
//   message: string;
//   type: 'error' | 'warning';
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class OpportunityFormStateService {
//   private destroy$ = new Subject<void>();
//   private localAutoSaveSubject = new Subject<CreateOpportunityFormData>();

//   // Form data state
//   formData = signal<CreateOpportunityFormData>({
//     title: '',
//     description: '',
//     shortDescription: '',
//     fundingOpportunityImageUrl: '',
//     fundingOpportunityVideoUrl: '',
//     funderOrganizationName: '',
//     funderOrganizationLogoUrl: '',
//     offerAmount: '',
//     minInvestment: '',
//     maxInvestment: '',
//     currency: 'ZAR',
//     fundingType: ['debt', 'equity', 'convertible', 'mezzanine', 'grant'],
//     interestRate: '',
//     equityOffered: '',
//     repaymentTerms: '',
//     securityRequired: '',
//     useOfFunds: '',
//     investmentStructure: '',
//     expectedReturns: '',
//     investmentHorizon: '',
//     exitStrategy: '',
//     applicationDeadline: '',
//     decisionTimeframe: '30',
//     targetIndustries: [],
//     investmentCriteria: [],
//     businessStages: [],
//     minRevenue: '',
//     maxRevenue: '',
//     minYearsOperation: '',
//     geographicRestrictions: [],
//     requiresCollateral: false,
//     typicalInvestment: '',
//     maxApplications: '',
//     autoMatch: true,
//     isPublic: true,
//     exclusionCriteria: [],
//   });

//   // State signals
//   validationErrors = signal<ValidationError[]>([]);
//   hasUnsavedChanges = signal(false);
//   lastLocalSave = signal<string | null>(null);

//   // Computed properties
//   hasMediaContent = computed(() => {
//     const data = this.formData();
//     return !!(
//       data.fundingOpportunityImageUrl ||
//       data.fundingOpportunityVideoUrl ||
//       data.funderOrganizationName ||
//       data.funderOrganizationLogoUrl
//     );
//   });

//   constructor() {
//     this.setupLocalAutoSave();
//   }

//   // Form data updates
//   updateField(field: keyof CreateOpportunityFormData, value: string | boolean) {
//     this.formData.update((data) => ({
//       ...data,
//       [field]: value,
//     }));
//     this.hasUnsavedChanges.set(true);
//     this.localAutoSaveSubject.next(this.formData());
//   }

//   updateMultiSelectField(
//     field: keyof CreateOpportunityFormData,
//     value: string,
//     checked: boolean
//   ) {
//     this.formData.update((data) => {
//       const currentArray = data[field] as string[];
//       let newArray: string[];

//       if (checked) {
//         newArray = [...currentArray, value];
//       } else {
//         newArray = currentArray.filter((item) => item !== value);
//       }

//       return {
//         ...data,
//         [field]: newArray,
//       };
//     });

//     this.hasUnsavedChanges.set(true);
//     this.localAutoSaveSubject.next(this.formData());
//   }

//   onNumberInput(field: keyof CreateOpportunityFormData, value: string): void {
//     const cleanValue = value.replace(/[^\d]/g, '');
//     this.formData.update((data) => ({
//       ...data,
//       [field]: cleanValue,
//     }));

//     this.hasUnsavedChanges.set(true);
//     this.localAutoSaveSubject.next(this.formData());
//   }

//   // Number formatting
//   parseNumberValue(value: string): number {
//     if (!value) return 0;
//     const cleaned = value.replace(/[,\s]/g, '');
//     return Number(cleaned) || 0;
//   }

//   formatNumberWithCommas(value: string | number): string {
//     if (!value) return '';
//     const numValue =
//       typeof value === 'string' ? this.parseNumberValue(value) : value;
//     return new Intl.NumberFormat('en-ZA', {
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(numValue);
//   }

//   getFormattedAmount(field: keyof CreateOpportunityFormData): string {
//     const value = this.formData()[field] as string;
//     return this.formatNumberWithCommas(value);
//   }

//   // Validation
//   validateForm(organizationId: string | null): void {
//     const errors: ValidationError[] = [];
//     const data = this.formData();

//     if (!organizationId) {
//       errors.push({
//         field: 'organization',
//         message: 'Organization setup is required to create opportunities',
//         type: 'error',
//       });
//     }

//     // Exclusion criteria validation
//     if (data.exclusionCriteria && data.exclusionCriteria.length > 2000) {
//       errors.push({
//         field: 'exclusionCriteria',
//         message: 'Exclusion criteria must be 2000 characters or less',
//         type: 'warning',
//       });
//     }

//     // Basic validation
//     if (!data.title.trim()) {
//       errors.push({
//         field: 'title',
//         message: 'Title is required',
//         type: 'error',
//       });
//     } else if (data.title.length < 5) {
//       errors.push({
//         field: 'title',
//         message: 'Title must be at least 5 characters',
//         type: 'warning',
//       });
//     }

//     if (!data.description.trim()) {
//       errors.push({
//         field: 'description',
//         message: 'Description is required',
//         type: 'error',
//       });
//     }

//     // URL validations
//     if (
//       data.fundingOpportunityImageUrl &&
//       !this.validateUrl(data.fundingOpportunityImageUrl)
//     ) {
//       errors.push({
//         field: 'fundingOpportunityImageUrl',
//         message: 'Please enter a valid image URL',
//         type: 'error',
//       });
//     }

//     if (
//       data.fundingOpportunityVideoUrl &&
//       !this.validateUrl(data.fundingOpportunityVideoUrl)
//     ) {
//       errors.push({
//         field: 'fundingOpportunityVideoUrl',
//         message: 'Please enter a valid video URL',
//         type: 'error',
//       });
//     }

//     if (
//       data.funderOrganizationLogoUrl &&
//       !this.validateUrl(data.funderOrganizationLogoUrl)
//     ) {
//       errors.push({
//         field: 'funderOrganizationLogoUrl',
//         message: 'Please enter a valid logo URL',
//         type: 'error',
//       });
//     }

//     if (
//       data.funderOrganizationName &&
//       data.funderOrganizationName.length > 100
//     ) {
//       errors.push({
//         field: 'funderOrganizationName',
//         message: 'Organization name should be 100 characters or less',
//         type: 'warning',
//       });
//     }

//     // Investment terms validation
//     if (data.fundingType) {
//       errors.push(...this.validateInvestmentAmounts(data));
//     }

//     // Eligibility validation
//     if (data.minRevenue && data.maxRevenue) {
//       const minRev = this.parseNumberValue(data.minRevenue);
//       const maxRev = this.parseNumberValue(data.maxRevenue);
//       if (minRev > 0 && maxRev > 0 && maxRev < minRev) {
//         errors.push({
//           field: 'maxRevenue',
//           message: 'Maximum revenue must be greater than minimum revenue',
//           type: 'error',
//         });
//       }
//     }

//     this.validationErrors.set(errors);
//   }

//   private validateInvestmentAmounts(
//     data: CreateOpportunityFormData
//   ): ValidationError[] {
//     const errors: ValidationError[] = [];

//     const minInvestment = this.parseNumberValue(data.minInvestment);
//     const maxInvestment = this.parseNumberValue(data.maxInvestment);
//     const typicalInvestment = this.parseNumberValue(data.typicalInvestment);

//     if (!data.fundingType || data.fundingType.length === 0) {
//       errors.push({
//         field: 'fundingType',
//         message: 'At least one funding type must be selected',
//         type: 'error',
//       });
//     }

//     // Validate min/max relationship
//     if (
//       minInvestment > 0 &&
//       maxInvestment > 0 &&
//       maxInvestment < minInvestment
//     ) {
//       errors.push({
//         field: 'maxInvestment',
//         message:
//           'Maximum investment must be greater than or equal to minimum investment',
//         type: 'error',
//       });
//     }

//     // Validate typical investment falls within bounds
//     if (
//       typicalInvestment > 0 &&
//       minInvestment > 0 &&
//       typicalInvestment < minInvestment
//     ) {
//       errors.push({
//         field: 'typicalInvestment',
//         message: 'Typical investment must be at least the minimum',
//         type: 'error',
//       });
//     }

//     if (
//       typicalInvestment > 0 &&
//       maxInvestment > 0 &&
//       typicalInvestment > maxInvestment
//     ) {
//       errors.push({
//         field: 'typicalInvestment',
//         message: 'Typical investment cannot exceed maximum',
//         type: 'error',
//       });
//     }

//     if (
//       minInvestment > 0 &&
//       maxInvestment > 0 &&
//       minInvestment > maxInvestment
//     ) {
//       errors.push({
//         field: 'minInvestment',
//         message: 'Minimum investment cannot exceed the maximum investment',
//         type: 'warning',
//       });
//     }

//     return errors;
//   }

//   private validateUrl(url: string): boolean {
//     if (!url) return true;
//     try {
//       const urlObj = new URL(url);
//       return ['http:', 'https:'].includes(urlObj.protocol);
//     } catch {
//       return false;
//     }
//   }

//   getFieldError(fieldName: string): ValidationError | null {
//     return (
//       this.validationErrors().find((error) => error.field === fieldName) || null
//     );
//   }

//   hasFieldError(fieldName: string): boolean {
//     return this.validationErrors().some(
//       (error) => error.field === fieldName && error.type === 'error'
//     );
//   }

//   hasFieldWarning(fieldName: string): boolean {
//     return this.validationErrors().some(
//       (error) => error.field === fieldName && error.type === 'warning'
//     );
//   }

//   // Image error handling
//   onImageError(field: keyof CreateOpportunityFormData) {
//     const errors = this.validationErrors().filter(
//       (error) => error.field !== field
//     );
//     errors.push({
//       field: field as string,
//       message: 'Invalid image URL or image failed to load',
//       type: 'warning',
//     });
//     this.validationErrors.set(errors);
//   }

//   // Local storage management
//   private setupLocalAutoSave() {
//     this.localAutoSaveSubject
//       .pipe(
//         debounceTime(10000),
//         distinctUntilChanged(
//           (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
//         ),
//         takeUntil(this.destroy$)
//       )
//       .subscribe((formData) => {
//         this.saveToLocalStorage(formData);
//       });
//   }

//   private saveToLocalStorage(formData: CreateOpportunityFormData) {
//     try {
//       const saveData = {
//         formData,
//         lastSaved: new Date().toISOString(),
//       };
//       localStorage.setItem('opportunity_draft', JSON.stringify(saveData));
//       this.lastLocalSave.set(saveData.lastSaved);
//     } catch (error) {
//       console.error('Failed to save to localStorage:', error);
//     }
//   }

//   clearLocalStorage() {
//     try {
//       localStorage.removeItem('opportunity_draft');
//       this.lastLocalSave.set(null);
//     } catch (error) {
//       console.error('Failed to clear localStorage:', error);
//     }
//   }

//   clearDraft() {
//     this.clearLocalStorage();
//     this.resetForm();
//   }

//   private resetForm() {
//     this.formData.set({
//       title: '',
//       description: '',
//       shortDescription: '',
//       fundingOpportunityImageUrl: '',
//       fundingOpportunityVideoUrl: '',
//       funderOrganizationName: '',
//       funderOrganizationLogoUrl: '',
//       offerAmount: '',
//       minInvestment: '',
//       maxInvestment: '',
//       currency: 'ZAR',
//       fundingType: ['debt'],
//       interestRate: '',
//       equityOffered: '',
//       repaymentTerms: '',
//       securityRequired: '',
//       useOfFunds: '',
//       investmentStructure: '',
//       expectedReturns: '',
//       investmentHorizon: '',
//       exitStrategy: '',
//       applicationDeadline: '',
//       decisionTimeframe: '30',
//       investmentCriteria: [],
//       targetIndustries: [],
//       businessStages: [],
//       minRevenue: '',
//       maxRevenue: '',
//       minYearsOperation: '',
//       geographicRestrictions: [],
//       requiresCollateral: false,
//       typicalInvestment: '',
//       maxApplications: '',
//       autoMatch: true,
//       isPublic: true,
//       exclusionCriteria: [],
//     });
//     this.hasUnsavedChanges.set(false);
//     this.validationErrors.set([]);
//   }

//   addToList(field: 'investmentCriteria' | 'exclusionCriteria', item: string) {
//     if (!item.trim() || item.length > 200) return;
//     this.formData.update((data) => ({
//       ...data,
//       [field]: [...data[field], item.trim()],
//     }));
//     this.hasUnsavedChanges.set(true);
//   }

//   removeFromList(
//     field: 'investmentCriteria' | 'exclusionCriteria',
//     index: number
//   ) {
//     this.formData.update((data) => ({
//       ...data,
//       [field]: data[field].filter((_, i) => i !== index),
//     }));
//     this.hasUnsavedChanges.set(true);
//   }
//   loadFromDraft(draftData: any) {
//     // Handle typical investment with fallback priority:
//     // 1. draftData.typicalInvestment (form field)
//     // 2. draftData.totalAvailable (database field)
//     // 3. If both zero/empty, use maxInvestment as fallback for edit mode
//     let typicalInv =
//       draftData.typicalInvestment?.toString() ||
//       draftData.totalAvailable?.toString() ||
//       '';

//     // If still empty or zero, try to use maxInvestment as sensible default
//     if (!typicalInv || this.parseNumberValue(typicalInv) === 0) {
//       typicalInv = draftData.maxInvestment?.toString() || '';
//     }

//     this.formData.set({
//       title: draftData.title || '',
//       description: draftData.description || '',
//       shortDescription: draftData.shortDescription || '',
//       fundingOpportunityImageUrl: draftData.fundingOpportunityImageUrl || '',
//       fundingOpportunityVideoUrl: draftData.fundingOpportunityVideoUrl || '',
//       funderOrganizationName: draftData.funderOrganizationName || '',
//       funderOrganizationLogoUrl: draftData.funderOrganizationLogoUrl || '',
//       offerAmount: draftData.offerAmount?.toString() || '',
//       minInvestment: draftData.minInvestment?.toString() || '',
//       maxInvestment: draftData.maxInvestment?.toString() || '',
//       currency: draftData.currency || 'ZAR',
//       fundingType: Array.isArray(draftData.fundingType)
//         ? draftData.fundingType
//         : [],
//       interestRate: draftData.interestRate?.toString() || '',
//       equityOffered: draftData.equityOffered?.toString() || '',
//       repaymentTerms: draftData.repaymentTerms || '',
//       securityRequired: draftData.securityRequired || '',
//       useOfFunds: draftData.useOfFunds || '',
//       investmentStructure: draftData.investmentStructure || '',
//       expectedReturns: draftData.expectedReturns?.toString() || '',
//       investmentHorizon: draftData.investmentHorizon?.toString() || '',
//       exitStrategy: draftData.exitStrategy || '',
//       applicationDeadline:
//         draftData.applicationDeadline?.toISOString().split('T')[0] || '',
//       decisionTimeframe: draftData.decisionTimeframe?.toString() || '30',
//       investmentCriteria:
//         draftData.investmentCriteria || draftData.funderDefinedCriteria || '',
//       targetIndustries: draftData.eligibilityCriteria?.industries || [],
//       businessStages: draftData.eligibilityCriteria?.businessStages || [],
//       minRevenue: draftData.eligibilityCriteria?.minRevenue?.toString() || '',
//       maxRevenue: draftData.eligibilityCriteria?.maxRevenue?.toString() || '',
//       minYearsOperation:
//         draftData.eligibilityCriteria?.minYearsOperation?.toString() || '',
//       geographicRestrictions:
//         draftData.eligibilityCriteria?.geographicRestrictions || [],
//       requiresCollateral:
//         draftData.eligibilityCriteria?.requiresCollateral || false,
//       typicalInvestment: typicalInv,
//       maxApplications: draftData.maxApplications?.toString() || '',
//       autoMatch: draftData.autoMatch ?? true,
//       isPublic: true,
//       exclusionCriteria:
//         draftData.exclusionCriteria || draftData.exclusionCriteria || '',
//     });
//   }
//   destroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }

// src/app/funder/services/opportunity-form-state.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

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
  private localAutoSaveSubject = new Subject<CreateOpportunityFormData>();

  formData = signal<CreateOpportunityFormData>(this.getInitialState());
  validationErrors = signal<ValidationError[]>([]);
  hasUnsavedChanges = signal(false);
  lastLocalSave = signal<string | null>(null);

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
    this.localAutoSaveSubject.next(this.formData());
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
    this.localAutoSaveSubject.next(this.formData());
  }

  onNumberInput(field: keyof CreateOpportunityFormData, value: string): void {
    const cleanValue = value.replace(/[^\d]/g, '');
    this.formData.update((data) => ({ ...data, [field]: cleanValue }));
    this.hasUnsavedChanges.set(true);
    this.localAutoSaveSubject.next(this.formData());
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
    this.localAutoSaveSubject.next(this.formData());
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
    this.localAutoSaveSubject.next(this.formData());
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

    // Helper function to parse array fields that might be JSON strings
    const parseArrayField = (field: any): string[] => {
      if (Array.isArray(field)) {
        return field;
      }
      if (typeof field === 'string' && field.trim()) {
        try {
          // Try to parse as JSON if it's a JSON string
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : [field];
        } catch {
          // If parsing fails, treat as single item
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
      applicationDeadline:
        draftData.applicationDeadline?.toISOString
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
  }

  clearDraft(): void {
    this.clearLocalStorage();
    this.resetForm();
  }

  private resetForm(): void {
    this.formData.set(this.getInitialState());
    this.hasUnsavedChanges.set(false);
    this.validationErrors.set([]);
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
      .pipe(
        debounceTime(10000),
        distinctUntilChanged(
          (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((formData) => {
        this.saveToLocalStorage(formData);
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
