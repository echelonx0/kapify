import { Injectable, signal, inject } from '@angular/core';
import { Observable, from, throwError, of, BehaviorSubject } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import {
  Organization,
  OrganizationType,
} from '../../shared/models/user.models';

export interface OnboardingStep {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  completed: boolean;
  required: boolean;
  estimatedTime: string;
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  organization?: Organization;
  isComplete: boolean;
  canCreateOpportunities: boolean;
  steps: OnboardingStep[];
}

@Injectable({ providedIn: 'root' })
export class FunderOnboardingService {
  private supabaseService = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  private localStorageKey = 'funder-onboarding-data';

  // STATE SIGNALS
  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);
  lastSavedLocally = signal<Date | null>(null);
  lastSavedToDatabase = signal<Date | null>(null);
  currentStep = signal<string>('organization-info');

  organizationData = signal<Partial<Organization>>({
    organizationType: 'investment_fund',
    country: 'South Africa',
    status: 'active',
    isVerified: false,
  });

  private steps: OnboardingStep[] = [
    {
      id: 'organization-info',
      title: 'Basic Information',
      shortTitle: 'Basic Info',
      description: 'Organization name, type, description, and contact details',
      completed: false,
      required: true,
      estimatedTime: '5 min',
    },
    {
      id: 'legal-compliance',
      title: 'Legal & Registration',
      shortTitle: 'Legal Info',
      description: 'Legal name, registration numbers, and compliance details',
      completed: false,
      required: true,
      estimatedTime: '3 min',
    },
    {
      id: 'verification',
      title: 'Verification',
      shortTitle: 'Get Verified',
      description: 'Submit for verification to start funding',
      completed: false,
      required: false,
      estimatedTime: '2 min',
    },
  ];

  private onboardingStateSubject = new BehaviorSubject<OnboardingState>({
    currentStep: 0,
    totalSteps: 3,
    completionPercentage: 0,
    isComplete: false,
    canCreateOpportunities: false,
    steps: this.steps,
  });

  onboardingState$ = this.onboardingStateSubject.asObservable();

  constructor() {
    this.loadFromLocalStorage();
    this.loadExistingOrganizationData().subscribe({
      next: () => this.updateStateFromData(),
      error: (error) => {
        console.warn('Failed to load organization:', error);
        this.updateStateFromData();
      },
    });
  }

  // ===============================
  // CORE DATA OPERATIONS
  // ===============================

  /**
   * Update organization data and persist locally
   */
  updateOrganizationData(updates: Partial<Organization>) {
    this.organizationData.update((current) => ({
      ...current,
      ...updates,
    }));
    this.saveToLocalStorage();
    this.updateStateFromData();
  }

  /**
   * Get current organization data with user association
   */
  getCurrentOrganization(): Organization {
    return this.organizationData() as Organization;
  }

  /**
   * Save to database via funder_organization_id FK
   */
  saveToDatabase(): Observable<{ success: boolean; organizationId?: string }> {
    const user = this.authService.user();
    if (!user) {
      this.error.set('Please log in to save');
      return throwError(() => new Error('Not authenticated'));
    }

    const data = this.organizationData();
    const validation = this.validateDataForDatabase(data);

    if (!validation.isValid) {
      this.error.set(`Validation failed: ${validation.errors[0]}`);
      return throwError(() => new Error('Validation failed'));
    }

    this.isSaving.set(true);
    this.error.set(null);

    // Get organization ID from auth service
    const orgId = this.authService.getCurrentUserOrganizationId();

    if (!orgId) {
      this.error.set('No organization found - please contact support');
      this.isSaving.set(false);
      return throwError(() => new Error('Organization missing'));
    }

    return this.updateExistingOrganization(orgId, data);
  }

  // ===============================
  // DATABASE OPERATIONS
  // ===============================

  /**
   * Load existing organization data from database
   */
  private loadExistingOrganizationData(): Observable<void> {
    const orgId = this.authService.getCurrentUserOrganizationId();

    if (!orgId) {
      console.log('No organization ID found for user');
      return of(undefined);
    }

    return from(
      this.supabaseService
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .maybeSingle()
    ).pipe(
      tap(({ data, error }) => {
        if (error) {
          console.warn('Failed to load organization:', error);
          return;
        }

        if (data) {
          const mapped = this.mapDatabaseToModel(data);
          this.organizationData.set(mapped);
          this.saveToLocalStorage();
          this.updateStateFromData();
        }
      }),
      map(() => undefined),
      catchError((error) => {
        console.error('Error loading organization:', error);
        return of(undefined);
      })
    );
  }

  /**
   * Update existing organization in database
   */
  private updateExistingOrganization(
    orgId: string,
    data: Partial<Organization>
  ): Observable<{ success: boolean; organizationId?: string }> {
    const validation = this.validateDataForDatabase(data);

    if (!validation.isValid) {
      this.error.set(`Validation failed: ${validation.errors.join(', ')}`);
      this.isSaving.set(false);
      return throwError(() => new Error(validation.errors.join(', ')));
    }

    return from(
      this.supabaseService
        .from('organizations')
        .update(validation.sanitizedData)
        .eq('id', orgId)
        .select('*')
        .single()
    ).pipe(
      tap(({ data: orgResult, error: orgError }) => {
        if (orgError) {
          const userMessage = this.getUserFriendlyError(orgError);
          this.error.set(userMessage);
          this.isSaving.set(false);
          throw new Error(userMessage);
        }

        if (!orgResult) {
          throw new Error('Update succeeded but no data returned');
        }

        // Update local state with result
        const updatedData = this.mapDatabaseToModel(orgResult);
        this.organizationData.update((current) => ({
          ...current,
          ...updatedData,
        }));

        this.saveToLocalStorage();
        this.lastSavedToDatabase.set(new Date());
        this.updateStateFromData();
      }),
      switchMap(() => of({ success: true, organizationId: orgId })),
      catchError((error) => {
        this.isSaving.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Request verification for organization
   */
  requestVerification(): Observable<{ success: boolean; message: string }> {
    if (!this.isReadyForVerification()) {
      return throwError(
        () => new Error('Complete all required information first')
      );
    }

    const user = this.authService.user();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const orgId = this.organizationData().id;
    if (!orgId) {
      return throwError(() => new Error('Organization not found'));
    }

    return from(
      this.supabaseService
        .from('organizations')
        .update({
          status: 'pending_verification',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orgId)
    ).pipe(
      tap(({ error }) => {
        if (error)
          throw new Error(`Verification request failed: ${error.message}`);

        this.organizationData.update((current) => ({
          ...current,
          status: 'pending_verification',
        }));
        this.saveToLocalStorage();
        this.updateStateFromData();
      }),
      switchMap(() =>
        of({
          success: true,
          message: 'Verification request submitted successfully',
        })
      ),
      catchError((error) => {
        console.error('Verification failed:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // VALIDATION & STATE
  // ===============================

  getOnboardingState(): OnboardingState {
    const data = this.organizationData();
    const basicComplete = this.isBasicInfoValid();
    const legalComplete = this.isLegalInfoValid();

    let currentStepIndex = 0;
    if (basicComplete && !legalComplete) currentStepIndex = 1;
    else if (basicComplete && legalComplete) currentStepIndex = 2;

    let completionPercentage = 0;
    if (basicComplete && legalComplete) completionPercentage = 100;
    else if (basicComplete) completionPercentage = 50;
    else if (data.name?.trim()) completionPercentage = 25;

    return {
      currentStep: currentStepIndex,
      totalSteps: 3,
      completionPercentage,
      organization: data as Organization,
      isComplete: basicComplete && legalComplete,
      canCreateOpportunities: basicComplete && legalComplete,
      steps: this.steps.map((step) => ({
        ...step,
        completed:
          step.id === 'organization-info'
            ? basicComplete
            : step.id === 'legal-compliance'
            ? legalComplete
            : false,
      })),
    };
  }

  isBasicInfoValid(): boolean {
    const data = this.organizationData();
    return !!(
      data.name?.trim() &&
      data.description?.trim() &&
      data.organizationType &&
      data.email?.trim() &&
      data.phone?.trim()
    );
  }

  isLegalInfoValid(): boolean {
    const data = this.organizationData();
    const legalComplete = !!(
      data.legalName?.trim() && data.registrationNumber?.trim()
    );
    const addressComplete = !!(
      data.addressLine1?.trim() &&
      data.city?.trim() &&
      data.province &&
      data.country
    );
    return legalComplete && addressComplete;
  }

  isReadyForVerification(): boolean {
    return this.isBasicInfoValid() && this.isLegalInfoValid();
  }

  canCreateOpportunities(): boolean {
    return this.isReadyForVerification();
  }

  // ===============================
  // STEP MANAGEMENT
  // ===============================

  setCurrentStep(stepId: string) {
    if (this.steps.some((step) => step.id === stepId)) {
      this.currentStep.set(stepId);
      this.saveToLocalStorage();
    }
  }

  getOnboardingSteps(): OnboardingStep[] {
    return this.steps.map((step) => ({
      ...step,
      completed:
        step.id === 'organization-info'
          ? this.isBasicInfoValid()
          : step.id === 'legal-compliance'
          ? this.isLegalInfoValid()
          : false,
    }));
  }

  // Add these two methods to your funder-onboarding.service.fixed.ts

  checkOnboardingStatus(): Observable<OnboardingState> {
    const user = this.authService.user();
    if (!user) {
      return of(this.getOnboardingState());
    }

    this.isLoading.set(true);
    this.error.set(null);

    const currentOrgData = this.organizationData();
    if (currentOrgData.id) {
      console.log('Using existing organization data');
      const state = this.getOnboardingState();
      this.onboardingStateSubject.next(state);
      this.isLoading.set(false);
      return of(state);
    }

    return this.loadExistingOrganizationData().pipe(
      switchMap(() => {
        const state = this.getOnboardingState();
        this.onboardingStateSubject.next(state);
        return of(state);
      }),
      catchError((error) => {
        console.error('Load failed:', error);
        this.error.set('Failed to load organization data');
        this.isLoading.set(false);
        const state = this.getOnboardingState();
        this.onboardingStateSubject.next(state);
        return of(state);
      }),
      tap(() => {
        this.isLoading.set(false);
      })
    );
  }

  getStepProgress(): { completed: number; total: number; percentage: number } {
    const steps = this.getOnboardingSteps();
    const completedSteps = steps.filter((step) => step.completed).length;
    const totalSteps = steps.length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    return {
      completed: completedSteps,
      total: totalSteps,
      percentage,
    };
  }
  canAccessStep(stepId: string): boolean {
    switch (stepId) {
      case 'organization-info':
        return true;
      case 'legal-compliance':
        return this.isBasicInfoValid();
      case 'verification':
        return this.isReadyForVerification();
      default:
        return false;
    }
  }

  // ===============================
  // LOCAL STORAGE
  // ===============================

  private saveToLocalStorage() {
    try {
      const user = this.authService.user();
      if (!user) return;

      const dataToSave = {
        organizationData: this.organizationData(),
        currentStep: this.currentStep(),
        lastSaved: new Date().toISOString(),
        userId: user.id,
      };

      localStorage.setItem(this.localStorageKey, JSON.stringify(dataToSave));
      this.lastSavedLocally.set(new Date());
    } catch (error) {
      console.error('localStorage save failed:', error);
    }
  }

  private loadFromLocalStorage() {
    try {
      const user = this.authService.user();
      if (!user) return;

      const saved = localStorage.getItem(this.localStorageKey);
      if (saved) {
        const parsedData = JSON.parse(saved);
        if (parsedData.userId === user.id) {
          this.organizationData.set({
            ...parsedData.organizationData,
            country: parsedData.organizationData.country || 'South Africa',
          });
          this.currentStep.set(parsedData.currentStep || 'organization-info');
          if (parsedData.lastSaved) {
            this.lastSavedLocally.set(new Date(parsedData.lastSaved));
          }
        }
      }
    } catch (error) {
      console.error('localStorage load failed:', error);
    }
  }

  clearAllData(): void {
    this.organizationData.set({
      organizationType: 'investment_fund',
      country: 'South Africa',
      status: 'active',
      isVerified: false,
    });
    this.currentStep.set('organization-info');
    this.lastSavedLocally.set(null);
    this.lastSavedToDatabase.set(null);
    this.error.set(null);

    const user = this.authService.user();
    if (user) {
      localStorage.removeItem(this.localStorageKey);
    }

    this.updateStateFromData();
  }

  // ===============================
  // PRIVATE HELPERS
  // ===============================

  private mapDatabaseToModel(dbOrg: any): Partial<Organization> {
    return {
      id: dbOrg.id,
      name: dbOrg.name,
      description: dbOrg.description,
      organizationType: dbOrg.organization_type as OrganizationType,
      status: dbOrg.status,
      website: dbOrg.website,
      logoUrl: dbOrg.logo_url,
      legalName: dbOrg.legal_name,
      registrationNumber: dbOrg.registration_number,
      fspLicenseNumber: dbOrg.fsp_license_number,
      ncrNumber: dbOrg.ncr_number,
      employeeCount: dbOrg.employee_count,
      assetsUnderManagement: dbOrg.assets_under_management,
      isVerified: dbOrg.is_verified,
      verificationDate: dbOrg.verification_date
        ? new Date(dbOrg.verification_date)
        : undefined,
      email: dbOrg.email,
      phone: dbOrg.phone,
      addressLine1: dbOrg.address_line1,
      addressLine2: dbOrg.address_line2,
      city: dbOrg.city,
      province: dbOrg.province,
      postalCode: dbOrg.postal_code,
      country: dbOrg.country || 'South Africa',
    };
  }

  private validateDataForDatabase(data: Partial<Organization>): {
    isValid: boolean;
    errors: string[];
    sanitizedData: any;
  } {
    const errors: string[] = [];
    const sanitizedData: any = {};

    // Name validation (required)
    if (!data.name?.trim()) {
      errors.push('Organization name is required');
    } else if (data.name.length > 255) {
      errors.push('Organization name must be less than 255 characters');
    } else {
      sanitizedData.name = data.name.trim();
    }

    // Organization type validation
    const validTypes = [
      'investment_fund',
      'bank',
      'government',
      'ngo',
      'private_equity',
      'venture_capital',
      'sme',
      'consultant',
      'general',
      'funder',
    ];
    if (data.organizationType && !validTypes.includes(data.organizationType)) {
      errors.push(`Invalid organization type: ${data.organizationType}`);
    } else {
      sanitizedData.organization_type =
        data.organizationType || 'investment_fund';
    }

    // Status validation
    const validStatuses = [
      'active',
      'inactive',
      'pending_verification',
      'suspended',
    ];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push(`Invalid status: ${data.status}`);
    } else {
      sanitizedData.status = data.status || 'active';
    }

    // String field validation
    const stringFields = [
      { key: 'description' as const, dbKey: 'description', maxLength: null },
      { key: 'website' as const, dbKey: 'website', maxLength: 255 },
      { key: 'phone' as const, dbKey: 'phone', maxLength: 20 },
      { key: 'email' as const, dbKey: 'email', maxLength: 255 },
      { key: 'logoUrl' as const, dbKey: 'logo_url', maxLength: null },
      { key: 'legalName' as const, dbKey: 'legal_name', maxLength: 255 },
      {
        key: 'registrationNumber' as const,
        dbKey: 'registration_number',
        maxLength: 100,
      },
      {
        key: 'fspLicenseNumber' as const,
        dbKey: 'fsp_license_number',
        maxLength: 100,
      },
      { key: 'addressLine1' as const, dbKey: 'address_line1', maxLength: 255 },
      { key: 'addressLine2' as const, dbKey: 'address_line2', maxLength: 255 },
      { key: 'city' as const, dbKey: 'city', maxLength: 100 },
      { key: 'province' as const, dbKey: 'province', maxLength: 100 },
      { key: 'postalCode' as const, dbKey: 'postal_code', maxLength: 20 },
      { key: 'country' as const, dbKey: 'country', maxLength: 100 },
    ];

    stringFields.forEach((field) => {
      const value = data[field.key];
      if (value) {
        const trimmed = value.toString().trim();
        if (field.maxLength && trimmed.length > field.maxLength) {
          errors.push(
            `${field.key} must be less than ${field.maxLength} characters`
          );
        } else if (trimmed) {
          sanitizedData[field.dbKey] = trimmed;
        }
      }
    });

    // NCR number
    if (data.ncrNumber) {
      const ncrStr = data.ncrNumber.toString().trim();
      if (ncrStr.length > 50) {
        errors.push('NCR number must be less than 50 characters');
      } else if (ncrStr) {
        sanitizedData.ncr_number = ncrStr;
      }
    }

    // Employee count
    if (data.employeeCount !== undefined) {
      const empCount = this.parseEmployeeCount(data.employeeCount);
      if (empCount !== null) {
        sanitizedData.employee_count = empCount;
      }
    }

    // Assets under management
    if (data.assetsUnderManagement !== undefined) {
      const aum =
        typeof data.assetsUnderManagement === 'string'
          ? parseFloat(data.assetsUnderManagement)
          : data.assetsUnderManagement;

      if (!isNaN(aum) && aum >= 0) {
        sanitizedData.assets_under_management = Math.floor(aum);
      }
    }

    // Boolean and date fields
    if (data.isVerified !== undefined) {
      sanitizedData.is_verified = Boolean(data.isVerified);
    }

    if (data.verificationDate) {
      sanitizedData.verification_date =
        data.verificationDate instanceof Date
          ? data.verificationDate.toISOString()
          : data.verificationDate;
    }

    sanitizedData.updated_at = new Date().toISOString();

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData,
    };
  }

  private parseEmployeeCount(
    employeeCount: string | number | undefined
  ): number | null {
    if (!employeeCount) return null;

    if (typeof employeeCount === 'number') return employeeCount;

    const countStr = employeeCount.toString();
    if (countStr.includes('1-10')) return 10;
    if (countStr.includes('11-50')) return 50;
    if (countStr.includes('51-200')) return 200;
    if (countStr.includes('201-500')) return 500;
    if (countStr.includes('500+')) return 500;

    const parsed = parseInt(countStr);
    return isNaN(parsed) ? null : parsed;
  }

  private updateStateFromData() {
    const state = this.getOnboardingState();
    this.onboardingStateSubject.next(state);
  }

  private getUserFriendlyError(error: any): string {
    if (error.code === '23514')
      return 'Invalid data: Check constraint violation';
    if (error.code === '23505')
      return 'Data conflict: Duplicate value detected';
    if (error.code === 'PGRST116')
      return 'Organization not found or access denied';
    return `Database error: ${error.message}`;
  }
}
