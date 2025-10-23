// src/app/funder/services/opportunity-form-state.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
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
  fundingType: ('debt' | 'equity' | 'convertible' | 'mezzanine' | 'grant' | 'purchase_order' | 'invoice_financing')[];
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
  investmentCriteria: string;
  targetIndustries: string[];
  businessStages: string[];
  minRevenue: string;
  maxRevenue: string;
  minYearsOperation: string;
  geographicRestrictions: string[];
  requiresCollateral: boolean;
  typicalInvestment: string;  // ← Replaces totalAmount
  maxApplications: string;
  autoMatch: boolean;
  isPublic: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

@Injectable({
  providedIn: 'root'
})
export class OpportunityFormStateService { 
  private destroy$ = new Subject<void>();
  private localAutoSaveSubject = new Subject<CreateOpportunityFormData>();

  // Form data state
  formData = signal<CreateOpportunityFormData>({
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
    targetIndustries: [],
    investmentCriteria: '',
    businessStages: [],
    minRevenue: '',
    maxRevenue: '',
    minYearsOperation: '',
    geographicRestrictions: [],
    requiresCollateral: false,
    typicalInvestment: '',
    maxApplications: '',
    autoMatch: true,
    isPublic: true
  });

  // State signals
  validationErrors = signal<ValidationError[]>([]);
  hasUnsavedChanges = signal(false);
  lastLocalSave = signal<string | null>(null);

  // Computed properties
  hasMediaContent = computed(() => {
    const data = this.formData();
    return !!(data.fundingOpportunityImageUrl || 
              data.fundingOpportunityVideoUrl || 
              data.funderOrganizationName || 
              data.funderOrganizationLogoUrl);
  });

  constructor() {
    this.setupLocalAutoSave();
  }

  // Form data updates
  updateField(field: keyof CreateOpportunityFormData, value: string | boolean) {
    this.formData.update(data => ({
      ...data,
      [field]: value
    }));
    this.hasUnsavedChanges.set(true);
    this.localAutoSaveSubject.next(this.formData());
  }

  updateMultiSelectField(field: keyof CreateOpportunityFormData, value: string, checked: boolean) {
    this.formData.update(data => {
      const currentArray = data[field] as string[];
      let newArray: string[];
      
      if (checked) {
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter(item => item !== value);
      }
      
      return {
        ...data,
        [field]: newArray
      };
    });
    
    this.hasUnsavedChanges.set(true);
    this.localAutoSaveSubject.next(this.formData());
  }

  onNumberInput(field: keyof CreateOpportunityFormData, value: string): void {
    const cleanValue = value.replace(/[^\d]/g, '');
    this.formData.update(data => ({
      ...data,
      [field]: cleanValue
    }));
    
    this.hasUnsavedChanges.set(true);
    this.localAutoSaveSubject.next(this.formData());
  }

  // Number formatting
  parseNumberValue(value: string): number {
    if (!value) return 0;
    const cleaned = value.replace(/[,\s]/g, '');
    return Number(cleaned) || 0;
  }

  formatNumberWithCommas(value: string | number): string {
    if (!value) return '';
    const numValue = typeof value === 'string' ? this.parseNumberValue(value) : value;
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  }

  getFormattedAmount(field: keyof CreateOpportunityFormData): string {
    const value = this.formData()[field] as string;
    return this.formatNumberWithCommas(value);
  }

  // Validation
  validateForm(organizationId: string | null): void {
    const errors: ValidationError[] = [];
    const data = this.formData();

    if (!organizationId) {
      errors.push({ 
        field: 'organization', 
        message: 'Organization setup is required to create opportunities', 
        type: 'error' 
      });
    }

    // Basic validation
    if (!data.title.trim()) {
      errors.push({ field: 'title', message: 'Title is required', type: 'error' });
    } else if (data.title.length < 5) {
      errors.push({ field: 'title', message: 'Title must be at least 5 characters', type: 'warning' });
    }

    if (!data.shortDescription.trim()) {
      errors.push({ field: 'shortDescription', message: 'Short description is required', type: 'error' });
    }

    if (!data.description.trim()) {
      errors.push({ field: 'description', message: 'Description is required', type: 'error' });
    }

    // URL validations
    if (data.fundingOpportunityImageUrl && !this.validateUrl(data.fundingOpportunityImageUrl)) {
      errors.push({ field: 'fundingOpportunityImageUrl', message: 'Please enter a valid image URL', type: 'error' });
    }

    if (data.fundingOpportunityVideoUrl && !this.validateUrl(data.fundingOpportunityVideoUrl)) {
      errors.push({ field: 'fundingOpportunityVideoUrl', message: 'Please enter a valid video URL', type: 'error' });
    }

    if (data.funderOrganizationLogoUrl && !this.validateUrl(data.funderOrganizationLogoUrl)) {
      errors.push({ field: 'funderOrganizationLogoUrl', message: 'Please enter a valid logo URL', type: 'error' });
    }

    if (data.funderOrganizationName && data.funderOrganizationName.length > 100) {
      errors.push({ field: 'funderOrganizationName', message: 'Organization name should be 100 characters or less', type: 'warning' });
    }

    // Investment terms validation
    if (data.fundingType) {
      errors.push(...this.validateInvestmentAmounts(data));
    }

    // Eligibility validation
    if (data.minRevenue && data.maxRevenue) {
      const minRev = this.parseNumberValue(data.minRevenue);
      const maxRev = this.parseNumberValue(data.maxRevenue);
      if (minRev > 0 && maxRev > 0 && maxRev < minRev) {
        errors.push({ 
          field: 'maxRevenue', 
          message: 'Maximum revenue must be greater than minimum revenue', 
          type: 'error' 
        });
      }
    }

    this.validationErrors.set(errors);
  }

  private validateInvestmentAmounts(data: CreateOpportunityFormData): ValidationError[] {
    const errors: ValidationError[] = [];
     
    const minInvestment = this.parseNumberValue(data.minInvestment);
    const maxInvestment = this.parseNumberValue(data.maxInvestment);
    const typicalInvestment = this.parseNumberValue(data.typicalInvestment);
    console.log('Validating investment amounts:', { minInvestment, maxInvestment, typicalInvestment, fundingType: data.fundingType });

    if (!data.fundingType || data.fundingType.length === 0) {
    errors.push({ field: 'fundingType', message: 'At least one funding type must be selected', type: 'error' });
  }


    // Validate min/max relationship
    if (minInvestment > 0 && maxInvestment > 0 && maxInvestment < minInvestment) {
      errors.push({ 
        field: 'maxInvestment', 
        message: 'Maximum investment must be greater than or equal to minimum investment', 
        type: 'error' 
      });
    }

    // Validate typical investment falls within bounds
    if (typicalInvestment > 0 && minInvestment > 0 && typicalInvestment < minInvestment) {
      errors.push({ 
        field: 'typicalInvestment', 
        message: 'Typical investment must be at least the minimum', 
        type: 'error' 
      });
    }

    if (typicalInvestment > 0 && maxInvestment > 0 && typicalInvestment > maxInvestment) {
      errors.push({ 
        field: 'typicalInvestment', 
        message: 'Typical investment cannot exceed maximum', 
        type: 'error' 
      });
    }

    // REMOVED: Old check that referenced totalAmount (no longer applicable)
    // if (maxInvestment > 0 && typicalInvestment > 0 && maxInvestment > typicalInvestment) { ... }

    if (minInvestment > 0 && maxInvestment > 0 && minInvestment > maxInvestment) {
      errors.push({ 
        field: 'minInvestment', 
        message: 'Minimum investment cannot exceed the maximum investment', 
        type: 'warning' 
      });
    }

    return errors;
  }

  private validateUrl(url: string): boolean {
    if (!url) return true;
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  getFieldError(fieldName: string): ValidationError | null {
    return this.validationErrors().find(error => error.field === fieldName) || null;
  }

  hasFieldError(fieldName: string): boolean {
    return this.validationErrors().some(error => error.field === fieldName && error.type === 'error');
  }

  hasFieldWarning(fieldName: string): boolean {
    return this.validationErrors().some(error => error.field === fieldName && error.type === 'warning');
  }

  // Image error handling
  onImageError(field: keyof CreateOpportunityFormData) {
    const errors = this.validationErrors().filter(error => error.field !== field);
    errors.push({
      field: field as string,
      message: 'Invalid image URL or image failed to load',
      type: 'warning'
    });
    this.validationErrors.set(errors);
  }

  // Local storage management
  private setupLocalAutoSave() {
    this.localAutoSaveSubject.pipe(
      debounceTime(10000),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(formData => {
      this.saveToLocalStorage(formData);
    });
  }

  private saveToLocalStorage(formData: CreateOpportunityFormData) {
    try {
      const saveData = {
        formData,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('opportunity_draft', JSON.stringify(saveData));
      this.lastLocalSave.set(saveData.lastSaved);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  clearLocalStorage() {
    try {
      localStorage.removeItem('opportunity_draft');
      this.lastLocalSave.set(null);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  clearDraft() {
    this.clearLocalStorage();
    this.resetForm();
  }

  private resetForm() {
    this.formData.set({
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
      fundingType: ['debt'],
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
      investmentCriteria: '',
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
      isPublic: true
    });
    this.hasUnsavedChanges.set(false);
    this.validationErrors.set([]);
  }

  // Load from draft data
  loadFromDraft(draftData: any) {
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
      fundingType: Array.isArray(draftData.fundingType) ? draftData.fundingType : [],
      interestRate: draftData.interestRate?.toString() || '',
      equityOffered: draftData.equityOffered?.toString() || '',
      repaymentTerms: draftData.repaymentTerms || '',
      securityRequired: draftData.securityRequired || '',
      useOfFunds: draftData.useOfFunds || '',
      investmentStructure: draftData.investmentStructure || '',
      expectedReturns: draftData.expectedReturns?.toString() || '',
      investmentHorizon: draftData.investmentHorizon?.toString() || '',
      exitStrategy: draftData.exitStrategy || '',
      applicationDeadline: draftData.applicationDeadline?.toISOString().split('T')[0] || '',
      decisionTimeframe: draftData.decisionTimeframe?.toString() || '30',
      targetIndustries: draftData.eligibilityCriteria?.industries || [],
      businessStages: draftData.eligibilityCriteria?.businessStages || [],
      minRevenue: draftData.eligibilityCriteria?.minRevenue?.toString() || '',
      maxRevenue: draftData.eligibilityCriteria?.maxRevenue?.toString() || '',
      minYearsOperation: draftData.eligibilityCriteria?.minYearsOperation?.toString() || '',
      geographicRestrictions: draftData.eligibilityCriteria?.geographicRestrictions || [],
      requiresCollateral: draftData.eligibilityCriteria?.requiresCollateral || false,
      typicalInvestment: draftData.typicalInvestment?.toString() || draftData.totalAvailable?.toString() || '',
      maxApplications: draftData.maxApplications?.toString() || '',
      autoMatch: draftData.autoMatch ?? true,
      isPublic: true,
      investmentCriteria: draftData.investmentCriteria || '',
    });
  }

  destroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}