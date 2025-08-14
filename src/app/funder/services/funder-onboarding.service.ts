 

// Hybrid Funder Onboarding Service - Simple core with component compatibility
import { Injectable, signal, inject } from '@angular/core';
import { Observable, from, throwError, of, BehaviorSubject, timer } from 'rxjs';
import { tap, catchError, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { SharedSupabaseService } from '../../shared/services/supabase.service';

export interface FunderOrganization {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  organizationType: 'investment_fund' | 'bank' | 'government' | 'ngo' | 'private_equity' | 'venture_capital';
  legalName?: string;
  registrationNumber?: string;
  taxNumber?: string;
  website?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country: string;
  foundedYear?: number;
  employeeCount?: any;
  assetsUnderManagement?: number;
  status: 'active' | 'inactive' | 'pending_verification';
  isVerified: boolean;
  version?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

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
  organization?: FunderOrganization;
  isComplete: boolean;
  canCreateOpportunities: boolean;
  steps: OnboardingStep[];
}

@Injectable({
  providedIn: 'root'
})
export class FunderOnboardingService {
  private supabaseService = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  private localStorageKey = 'funder-onboarding-data';
  
  // Simple state
  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);
  lastSavedLocally = signal<Date | null>(null);
  lastSavedToDatabase = signal<Date | null>(null);
  currentStep = signal<string>('organization-info');
  
  organizationData = signal<Partial<FunderOrganization>>({
    country: 'South Africa'
  });

  // Steps
  private steps: OnboardingStep[] = [
    {
      id: 'organization-info',
      title: 'Basic Information',
      shortTitle: 'Basic Info',
      description: 'Organization name, type, description, and contact details',
      completed: false,
      required: true,
      estimatedTime: '5 min'
    },
    {
      id: 'legal-compliance',
      title: 'Legal & Registration',
      shortTitle: 'Legal Info',
      description: 'Legal name, registration numbers, and compliance details',
      completed: false,
      required: true,
      estimatedTime: '3 min'
    },
    {
      id: 'verification',
      title: 'Verification',
      shortTitle: 'Get Verified',
      description: 'Submit for verification to start funding',
      completed: false,
      required: false,
      estimatedTime: '2 min'
    }
  ];

  // Observable state for components that need it
  private onboardingStateSubject = new BehaviorSubject<OnboardingState>({
    currentStep: 0,
    totalSteps: 3,
    completionPercentage: 0,
    isComplete: false,
    canCreateOpportunities: false,
    steps: this.steps
  });
  
  onboardingState$ = this.onboardingStateSubject.asObservable();

  constructor() {
    console.log('🚀 Hybrid FunderOnboardingService initialized');
    this.loadFromLocalStorage();
    this.updateStateFromData();
  }

  // ===============================
  // CORE DATA OPERATIONS
  // ===============================

  // Update data locally only
  updateOrganizationData(updates: Partial<FunderOrganization>) {
    this.organizationData.update(current => ({
      ...current,
      ...updates
    }));
    this.saveToLocalStorage();
    this.updateStateFromData();
  }

  // Save to database - simple and clean
  saveToDatabase(): Observable<{ success: boolean; organizationId?: string }> {
    const user = this.authService.user();
    if (!user) {
      this.error.set('Please log in to save');
      return throwError(() => new Error('Not authenticated'));
    }

    const data = this.organizationData();
    if (!data.name?.trim()) {
      this.error.set('Organization name is required');
      return throwError(() => new Error('Name required'));
    }

    this.isSaving.set(true);
    this.error.set(null);

    // Simple data mapping
  const orgData = {
  user_id: user.id,
  name: data.name,
  description: data.description || null,
  organization_type: data.organizationType || 'investment_fund',
  legal_name: data.legalName || null,
  registration_number: data.registrationNumber || null,
  tax_number: data.taxNumber || null,
  website: data.website || null,
  email: data.email || null,
  phone: data.phone || null,
  address_line1: data.addressLine1 || null,
  address_line2: data.addressLine2 || null,
  city: data.city || null,
  province: data.province || null,
  postal_code: data.postalCode || null,
  country: data.country || 'South Africa',
  founded_year: data.foundedYear || null,
  employee_count: this.parseEmployeeCount(data.employeeCount) || null, // Convert dropdown to number
  assets_under_management: data.assetsUnderManagement || null,
  status: data.status || 'active',
  is_verified: data.isVerified || false,
  updated_at: new Date().toISOString()
};

    return from(
      this.supabaseService.from('funder_organizations')
        .upsert(orgData, { onConflict: 'user_id' })
        .select()
        .single()
    ).pipe(
      tap(({ data: result, error }) => {
        if (error) {
          throw error;
        }
        
        // Update local data with ID
        this.organizationData.update(current => ({
          ...current,
          id: result.id
        }));
        this.saveToLocalStorage();
        this.lastSavedToDatabase.set(new Date());
        this.updateStateFromData();
      }),
      switchMap(({ data: result }) => of({ success: true, organizationId: result.id })),
      catchError(error => {
        console.error('Save failed:', error);
        this.error.set(error.message || 'Failed to save');
        this.isSaving.set(false);
        return throwError(() => error);
      }),
      tap(() => {
        this.isSaving.set(false);
        console.log('✅ Saved successfully');
      })
    );
  }

  // Load from database - called by components that need fresh data
  checkOnboardingStatus(): Observable<OnboardingState> {
    const user = this.authService.user();
    if (!user) {
      return of(this.getOnboardingState());
    }

    this.isLoading.set(true);
    this.error.set(null);

    return from(
      this.supabaseService.from('funder_organizations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
    ).pipe(
      tap(({ data: org, error }) => {
        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (org) {
          const mapped = this.mapDatabaseToModel(org);
          this.organizationData.set(mapped);
          this.saveToLocalStorage();
        }
      }),
      switchMap(() => {
        const state = this.getOnboardingState();
        this.onboardingStateSubject.next(state);
        return of(state);
      }),
      catchError(error => {
        console.error('Load failed:', error);
        this.error.set('Failed to load data');
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

  // Request verification
  requestVerification(): Observable<{ success: boolean; message: string }> {
    if (!this.isReadyForVerification()) {
      return throwError(() => new Error('Complete all required information first'));
    }

    const user = this.authService.user();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabaseService.from('funder_organizations')
        .update({ 
          status: 'pending_verification',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
    ).pipe(
      tap(({ error }) => {
        if (error) {
          throw new Error(`Verification request failed: ${error.message}`);
        }

        this.organizationData.update(current => ({
          ...current,
          status: 'pending_verification' as const
        }));
        this.saveToLocalStorage();
        this.updateStateFromData();
      }),
      switchMap(() => of({
        success: true,
        message: 'Verification request submitted successfully'
      })),
      catchError(error => {
        console.error('Verification request failed:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // COMPONENT COMPATIBILITY METHODS
  // ===============================

  // Get current state - used by many components
  getOnboardingState(): OnboardingState {
    const data = this.organizationData();
    const basicComplete = this.isBasicInfoValid();
    const legalComplete = this.isLegalInfoValid();
    
    let currentStepIndex = 0;
    if (basicComplete && !legalComplete) {
      currentStepIndex = 1;
    } else if (basicComplete && legalComplete) {
      currentStepIndex = 2;
    }
    
    let completionPercentage = 0;
    if (basicComplete && legalComplete) completionPercentage = 100;
    else if (basicComplete) completionPercentage = 50;
    else if (data.name?.trim()) completionPercentage = 25;

    return {
      currentStep: currentStepIndex,
      totalSteps: 3,
      completionPercentage,
      organization: data as FunderOrganization,
      isComplete: basicComplete && legalComplete,
      canCreateOpportunities: basicComplete && legalComplete,
      steps: this.steps.map(step => ({
        ...step,
        completed: step.id === 'organization-info' 
          ? basicComplete
          : step.id === 'legal-compliance'
          ? legalComplete
          : false
      }))
    };
  }

  // Update internal state and broadcast to subscribers
  private updateStateFromData() {
    const state = this.getOnboardingState();
    this.onboardingStateSubject.next(state);
  }

  // Step management methods used by layout component
  setCurrentStep(stepId: string) {
    if (this.steps.some(step => step.id === stepId)) {
      this.currentStep.set(stepId);
      this.saveToLocalStorage();
    }
  }

  getOnboardingSteps(): OnboardingStep[] {
    return this.steps.map(step => ({
      ...step,
      completed: step.id === 'organization-info' 
        ? this.isBasicInfoValid()
        : step.id === 'legal-compliance'
        ? this.isLegalInfoValid()
        : false
    }));
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

  getStepProgress(): { completed: number; total: number; percentage: number } {
    const steps = this.getOnboardingSteps();
    const completedSteps = steps.filter(step => step.completed).length;
    const totalSteps = steps.length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);
    
    return {
      completed: completedSteps,
      total: totalSteps,
      percentage
    };
  }

  getNextIncompleteStep(): string {
    if (!this.isBasicInfoValid()) {
      return 'organization-info';
    } else if (!this.isLegalInfoValid()) {
      return 'legal-compliance';
    } else {
      return 'verification';
    }
  }

  // ===============================
  // VALIDATION METHODS
  // ===============================

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
  
  // Legal section requirements
  const legalComplete = !!(
    data.legalName?.trim() &&
    data.registrationNumber?.trim()
  );
  
  // Address section requirements  
  const addressComplete = !!(
    data.addressLine1?.trim() &&
    data.city?.trim() &&
    data.province &&
    data.country
  );
  
  // Both sections must be complete
  return legalComplete && addressComplete;
}

  isReadyForVerification(): boolean {
    return this.isBasicInfoValid() && this.isLegalInfoValid();
  }

  isFullyComplete(): boolean {
    const data = this.organizationData();
    return this.isReadyForVerification() && !!data.id;
  }

  canCreateOpportunities(): boolean {
    return this.isReadyForVerification();
  }

  // ===============================
  // DATABASE MAPPING
  // ===============================

  private mapDatabaseToModel(dbOrg: any): FunderOrganization {
    return {
      id: dbOrg.id,
      userId: dbOrg.user_id,
      name: dbOrg.name,
      description: dbOrg.description,
      organizationType: dbOrg.organization_type,
      legalName: dbOrg.legal_name,
      registrationNumber: dbOrg.registration_number,
      taxNumber: dbOrg.tax_number,
      website: dbOrg.website,
      email: dbOrg.email,
      phone: dbOrg.phone,
      addressLine1: dbOrg.address_line1,
      addressLine2: dbOrg.address_line2,
      city: dbOrg.city,
      province: dbOrg.province,
      postalCode: dbOrg.postal_code,
      country: dbOrg.country,
      foundedYear: dbOrg.founded_year,
      employeeCount: dbOrg.employee_count,
      assetsUnderManagement: dbOrg.assets_under_management,
      status: dbOrg.status,
      isVerified: dbOrg.is_verified,
      version: dbOrg.version || 1,
      createdAt: new Date(dbOrg.created_at),
      updatedAt: new Date(dbOrg.updated_at)
    };
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
        userId: user.id
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
            country: parsedData.organizationData.country || 'South Africa'
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

  // ===============================
  // UTILITY METHODS
  // ===============================

  getCurrentOrganization(): Partial<FunderOrganization> {
    return this.organizationData();
  }

  clearAllData(): void {
    this.organizationData.set({ country: 'South Africa' });
    this.currentStep.set('organization-info');
    this.lastSavedLocally.set(null);
    this.lastSavedToDatabase.set(null);
    this.error.set(null);
    
    const user = this.authService.user();
    if (user) {
      localStorage.removeItem(this.localStorageKey);
    }
    
    this.updateStateFromData();
    console.log('🧹 All onboarding data cleared');
  }

  // For error handling with auto-clear
  private handleError(error: any, customMessage?: string) {
    const errorMessage = customMessage || error.message || 'An error occurred';
    this.error.set(errorMessage);
    
    // Auto-clear error after 8 seconds
    timer(8000).pipe(take(1)).subscribe(() => {
      if (this.error() === errorMessage) {
        this.error.set(null);
      }
    });
  }

  private parseEmployeeCount(employeeCount: string | number | undefined): number | null {
  if (!employeeCount) return null;
  
  // If it's already a number, return it
  if (typeof employeeCount === 'number') return employeeCount;
  
  // Convert dropdown string to number (use the lower bound)
  const countStr = employeeCount.toString();
  if (countStr.includes('1-10')) return 10;
  if (countStr.includes('11-50')) return 50;
  if (countStr.includes('51-200')) return 200;
  if (countStr.includes('201-500')) return 500;
  if (countStr.includes('500+')) return 500;
  
  // Try to parse as direct number
  const parsed = parseInt(countStr);
  return isNaN(parsed) ? null : parsed;
}
}