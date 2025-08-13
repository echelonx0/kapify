 
// src/app/funder/services/funder-onboarding.service.ts - COMPLETELY FIXED
import { Injectable, signal, inject } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject, Subject, timer, of } from 'rxjs';
import { tap, catchError, finalize, timeout, switchMap } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/production.auth.service';

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
  employeeCount?: number;
  assetsUnderManagement?: number;
  status: 'active' | 'inactive' | 'pending_verification';
  isVerified: boolean;
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

interface LocalStorageData {
  organizationData: Partial<FunderOrganization>;
  currentStep: string;
  lastSaved: string;
  userId: string;
}

@Injectable({
  providedIn: 'root'
})
export class FunderOnboardingService {
  private supabase: SupabaseClient;
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();
  private localStorageKey = 'funder-onboarding-data';
  private saveTimeout = 15000; // 15 second timeout

  // Simplified state management
  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);
  lastSavedLocally = signal<Date | null>(null);
  currentStep = signal<string>('organization-info');

  // Local organization data
  organizationData = signal<Partial<FunderOrganization>>({
    country: 'South Africa'
  });

  private steps: OnboardingStep[] = [
    {
      id: 'organization-info',
      title: 'Organization Information',
      shortTitle: 'Organization Info',
      description: 'Basic organization details and contact information',
      completed: false,
      required: true,
      estimatedTime: '8 min'
    },
    {
      id: 'legal-compliance',
      title: 'Legal & Compliance',
      shortTitle: 'Legal Details',
      description: 'Legal registration and compliance information',
      completed: false,
      required: true,
      estimatedTime: '5 min'
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
    console.log('🚀 FunderOnboardingService constructor called');
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    console.log('📊 Supabase client created');
    this.loadFromLocalStorage();
  }

  ngOnDestroy() {
    console.log('🔄 FunderOnboardingService destroying');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // LOCAL STORAGE METHODS
  // ===============================

  private saveToLocalStorage() {
    try {
      const user = this.authService.user();
      if (!user) {
        console.warn('⚠️ No user found, cannot save to localStorage');
        return;
      }

      const dataToSave: LocalStorageData = {
        organizationData: this.organizationData(),
        currentStep: this.currentStep(),
        lastSaved: new Date().toISOString(),
        userId: user.id
      };

      localStorage.setItem(this.localStorageKey, JSON.stringify(dataToSave));
      this.lastSavedLocally.set(new Date());
      console.log('✅ Organization data saved to localStorage successfully');
    } catch (error) {
      console.error('❌ Failed to save to localStorage:', error);
    }
  }

  private loadFromLocalStorage() {
    try {
      const user = this.authService.user();
      if (!user) {
        console.warn('⚠️ No user found, cannot load from localStorage');
        return;
      }

      const saved = localStorage.getItem(this.localStorageKey);
      if (saved) {
        const parsedData: LocalStorageData = JSON.parse(saved);
        
        if (parsedData.userId === user.id) {
          this.organizationData.set(parsedData.organizationData || { country: 'South Africa' });
          this.currentStep.set(parsedData.currentStep || 'organization-info');
          this.lastSavedLocally.set(new Date(parsedData.lastSaved));
          
          this.updateStepCompletionFromData();
          console.log('✅ Organization data loaded from localStorage successfully');
        } else {
          console.warn('⚠️ Saved data is for different user, ignoring');
        }
      } else {
        console.log('📂 No saved data found in localStorage');
      }
    } catch (error) {
      console.error('❌ Failed to load from localStorage:', error);
    }
  }

  // ===============================
  // DATA UPDATE METHODS
  // ===============================

  updateOrganizationData(updates: Partial<FunderOrganization>) {
    console.log('📝 Updating organization data with:', Object.keys(updates));
    
    this.organizationData.update(current => ({
      ...current,
      ...updates
    }));
    
    this.saveToLocalStorage();
    this.updateStepCompletionFromData();
    console.log('📝 Organization data updated locally');
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
      data.phone?.trim() &&
      data.addressLine1?.trim() &&
      data.city?.trim() &&
      data.province &&
      data.country
    );
  }

  isLegalInfoValid(): boolean {
    const data = this.organizationData();
    return !!(
      data.legalName?.trim() &&
      data.registrationNumber?.trim()
    );
  }

  private updateStepCompletionFromData() {
    const basicInfoComplete = this.isBasicInfoValid();
    const legalInfoComplete = this.isLegalInfoValid();
    
    this.steps[0].completed = basicInfoComplete;
    this.steps[1].completed = legalInfoComplete;
    
    const completedSteps = this.steps.filter(step => step.completed).length;
    const currentStepIndex = this.steps.findIndex(step => step.id === this.currentStep());
    const completionPercentage = Math.round((completedSteps / this.steps.length) * 100);

    const state: OnboardingState = {
      currentStep: Math.max(currentStepIndex, 0),
      totalSteps: this.steps.length,
      completionPercentage,
      organization: this.organizationData() as FunderOrganization,
      isComplete: completedSteps === this.steps.length,
      canCreateOpportunities: basicInfoComplete,
      steps: [...this.steps]
    };

    this.onboardingStateSubject.next(state);
  }

  // ===============================
  // DATABASE SAVE - COMPLETELY FIXED WITH TIMEOUT
  // ===============================

 // Apply this fix to your FunderOnboardingService - use the WORKING pattern

// Replace your saveToDatabase method with this:
saveToDatabase(): Observable<{ success: boolean; organizationId?: string }> {
  console.log('💾 Starting save to database...');
  
  if (this.isSaving()) {
    console.warn('⚠️ Save already in progress');
    return throwError(() => new Error('Save already in progress'));
  }
  
  this.isSaving.set(true);
  this.error.set(null);
  
  const currentAuth = this.authService.user();
  if (!currentAuth) {
    console.error('❌ User not authenticated');
    this.isSaving.set(false);
    return throwError(() => new Error('User not authenticated'));
  }

  const data = this.organizationData();
  
  if (!data.name?.trim()) {
    console.error('❌ Organization name is required');
    this.isSaving.set(false);
    this.error.set('Organization name is required');
    return throwError(() => new Error('Organization name is required'));
  }
  
  console.log('💾 Saving with upsert pattern...');
  
  // ✅ USE THE WORKING PATTERN - UPSERT instead of complex check/create
  return from(this.upsertOrganization(data, currentAuth.id)).pipe(
    timeout(10000),
    tap(result => {
      console.log('✅ Database save completed:', result);
      // ✅ NO STATUS REFRESH - this was causing timeout loops
    }),
    catchError(error => {
      console.error('❌ Database save failed:', error);
      let errorMessage = 'Failed to save organization';
      
      if (error.name === 'TimeoutError') {
        errorMessage = 'Connection timeout. Please check your internet connection.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.error.set(errorMessage);
      return throwError(() => error);
    }),
    finalize(() => {
      this.isSaving.set(false);
      console.log('💾 Save operation completed');
    })
  );
}

// ✅ NEW METHOD - Use the working upsert pattern
private async upsertOrganization(
  orgData: Partial<FunderOrganization>, 
  userId: string
): Promise<{ success: boolean; organizationId?: string }> {
  try {
    console.log('💾 Using upsert for organization...');
    
    // ✅ EXACTLY like the working service
    const organizationPayload = {
      user_id: userId,
      name: orgData.name?.trim() || '',
      description: orgData.description?.trim() || null,
      organization_type: orgData.organizationType || null,
      legal_name: orgData.legalName?.trim() || null,
      registration_number: orgData.registrationNumber?.trim() || null,
      tax_number: orgData.taxNumber?.trim() || null,
      website: orgData.website?.trim() || null,
      email: orgData.email?.trim() || null,
      phone: orgData.phone?.trim() || null,
      address_line1: orgData.addressLine1?.trim() || null,
      address_line2: orgData.addressLine2?.trim() || null,
      city: orgData.city?.trim() || null,
      province: orgData.province || null,
      postal_code: orgData.postalCode?.trim() || null,
      country: orgData.country || 'South Africa',
      founded_year: orgData.foundedYear || null,
      employee_count: orgData.employeeCount || null,
      assets_under_management: orgData.assetsUnderManagement || null,
      status: 'active',
      is_verified: false,
      updated_at: new Date().toISOString()
    };

    // ✅ USE UPSERT - handles both insert and update automatically
    const { data, error } = await this.supabase
      .from('funder_organizations')
      .upsert(organizationPayload, {
        onConflict: 'user_id',  // Assuming user_id is unique
        ignoreDuplicates: false
      })
      .select()
      .single();

    // ✅ SIMPLE ERROR HANDLING like working service
    if (error) {
      console.error('❌ Upsert error:', error);
      throw new Error(`Supabase error: ${error.message}`);
    }

    console.log('✅ Organization upserted successfully');
    return { success: true, organizationId: data.id };
    
  } catch (error) {
    console.error('❌ Upsert operation failed:', error);
    throw error;
  }
}

// ✅ SIMPLIFIED STATUS CHECK - no automatic calls
checkOnboardingStatus(): Observable<OnboardingState> {
  console.log('🔍 Checking onboarding status...');
  
  this.isLoading.set(true);
  this.error.set(null);
  
  const currentAuth = this.authService.user();
  if (!currentAuth) {
    this.isLoading.set(false);
    return throwError(() => new Error('User not authenticated'));
  }

  return from(this.fetchOnboardingStatus(currentAuth.id)).pipe(
    timeout(8000),
    tap(state => {
      this.onboardingStateSubject.next(state);
    }),
    catchError(error => {
      console.error('❌ Status check failed:', error);
      // ✅ RETURN LOCAL STATE instead of failing completely
      return of(this.onboardingStateSubject.value);
    }),
    finalize(() => {
      this.isLoading.set(false);
    })
  );
}

private async fetchOnboardingStatus(userId: string): Promise<OnboardingState> {
  try {
    // ✅ SIMPLE QUERY like working service
    const { data: organization, error } = await this.supabase
      .from('funder_organizations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    // ✅ RETURN LOCAL STATE if no org found (first time user)
    if (!organization) {
      console.log('📂 No organization found, using local state');
      return this.onboardingStateSubject.value;
    }

    // Map database to local state
    const basicInfoComplete = this.isBasicInfoCompleteFromDb(organization);
    const legalInfoComplete = this.isLegalInfoCompleteFromDb(organization);
    
    let currentStep = 0;
    let completionPercentage = 0;

    if (basicInfoComplete) {
      currentStep = 1;
      completionPercentage = 33;
    }

    if (legalInfoComplete) {
      currentStep = 2;
      completionPercentage = 66;
    }

    if (organization.is_verified) {
      currentStep = 3;
      completionPercentage = 100;
    }

    return {
      currentStep,
      totalSteps: 3,
      completionPercentage,
      organization: this.mapDatabaseToModel(organization),
      isComplete: completionPercentage === 100,
      canCreateOpportunities: basicInfoComplete,
      steps: this.steps
    };
    
  } catch (error) {
    console.error('❌ Error fetching status:', error);
    throw error;
  }
}

  private async performSaveToDatabase(
    orgData: Partial<FunderOrganization>, 
    userId: string
  ): Promise<{ success: boolean; organizationId?: string }> {
    const startTime = Date.now();
    console.log('💾 Performing database save...');
    
    try {
      // FIXED: Simplified payload with better error handling
      const organizationPayload = this.buildDatabasePayload(orgData, userId);
      
      console.log('📋 Payload prepared, checking for existing organization...');
      
      // FIXED: Better error handling for database check
      let existingOrg;
      try {
        const { data, error: checkError } = await this.supabase
          .from('funder_organizations')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (checkError) {
          console.error('❌ Error checking existing organization:', checkError);
          throw new Error(`Database check failed: ${checkError.message}`);
        }
        
        existingOrg = data;
        console.log('🔍 Existing org check completed:', existingOrg ? 'Found' : 'Not found');
        
      } catch (error) {
        console.error('❌ Database check failed:', error);
        throw error;
      }

      let result;
      
      if (existingOrg) {
        console.log('🔄 Updating existing organization...');
        result = await this.updateExistingOrganization(organizationPayload, userId);
      } else {
        console.log('🆕 Creating new organization...');
        result = await this.createNewOrganization(organizationPayload);
      }

      const endTime = Date.now();
      console.log(`✅ Database operation successful in ${endTime - startTime}ms`);
      return result;
      
    } catch (error) {
      const endTime = Date.now();
      console.error(`❌ Database operation failed after ${endTime - startTime}ms:`, error);
      throw error;
    }
  }

  private buildDatabasePayload(orgData: Partial<FunderOrganization>, userId: string) {
    return {
      user_id: userId,
      name: orgData.name?.trim() || '',
      description: orgData.description?.trim() || null,
      organization_type: orgData.organizationType || null,
      legal_name: orgData.legalName?.trim() || null,
      registration_number: orgData.registrationNumber?.trim() || null,
      tax_number: orgData.taxNumber?.trim() || null,
      website: orgData.website?.trim() || null,
      email: orgData.email?.trim() || null,
      phone: orgData.phone?.trim() || null,
      address_line1: orgData.addressLine1?.trim() || null,
      address_line2: orgData.addressLine2?.trim() || null,
      city: orgData.city?.trim() || null,
      province: orgData.province || null,
      postal_code: orgData.postalCode?.trim() || null,
      country: orgData.country || 'South Africa',
      founded_year: orgData.foundedYear || null,
      employee_count: orgData.employeeCount || null,
      assets_under_management: orgData.assetsUnderManagement || null,
      status: 'active',
      is_verified: false,
      updated_at: new Date().toISOString()
    };
  }

  private async updateExistingOrganization(payload: any, userId: string) {
    const { data, error } = await this.supabase
      .from('funder_organizations')
      .update(payload)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Update error:', error);
      throw new Error(`Update failed: ${error.message}`);
    }

    return { success: true, organizationId: data.id };
  }

  private async createNewOrganization(payload: any) {
    const createPayload = {
      ...payload,
      created_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('funder_organizations')
      .insert(createPayload)
      .select()
      .single();

    if (error) {
      console.error('❌ Create error:', error);
      throw new Error(`Create failed: ${error.message}`);
    }

    return { success: true, organizationId: data.id };
  }

  

  private isBasicInfoCompleteFromDb(org: any): boolean {
    return !!(
      org.name &&
      org.description &&
      org.organization_type &&
      org.email &&
      org.phone &&
      org.city &&
      org.province &&
      org.country
    );
  }

  private isLegalInfoCompleteFromDb(org: any): boolean {
    return !!(
      org.legal_name &&
      org.registration_number
    );
  }

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
      createdAt: new Date(dbOrg.created_at),
      updatedAt: new Date(dbOrg.updated_at)
    };
  }

  // ===============================
  // VERIFICATION METHODS
  // ===============================

  requestVerification(): Observable<{ success: boolean; message: string }> {
    console.log('🛡️ Requesting verification...');
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      console.error('❌ User not authenticated for verification request');
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.performVerificationRequest(currentAuth.id)).pipe(
      timeout(10000), // 10 second timeout
      tap(result => {
        console.log('🛡️ Verification request result:', result);
        if (result.success) {
          this.checkOnboardingStatus().subscribe({
            next: () => console.log('✅ Status refreshed after verification request'),
            error: (err) => console.warn('⚠️ Status refresh failed:', err)
          });
        }
      }),
      catchError(error => {
        console.error('❌ Verification request failed:', error);
        this.error.set('Failed to request verification');
        return throwError(() => error);
      })
    );
  }

  private async performVerificationRequest(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🛡️ Updating organization status to pending verification...');
      
      const { error } = await this.supabase
        .from('funder_organizations')
        .update({ 
          status: 'pending_verification',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Verification request database error:', error);
        throw new Error(`Failed to request verification: ${error.message}`);
      }

      console.log('✅ Verification request submitted successfully');
      return {
        success: true,
        message: 'Verification request submitted successfully. We will review your organization details and contact you within 2-3 business days.'
      };
    } catch (error) {
      console.error('❌ Error in performVerificationRequest:', error);
      throw error;
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  getCurrentOrganization(): Partial<FunderOrganization> {
    return this.organizationData();
  }

  getOnboardingSteps(): OnboardingStep[] {
    return [...this.steps];
  }

  canCreateOpportunities(): boolean {
    return this.onboardingStateSubject.value.canCreateOpportunities;
  }

  setCurrentStep(stepId: string) {
    if (this.steps.some(step => step.id === stepId)) {
      this.currentStep.set(stepId);
      this.saveToLocalStorage();
    }
  }
}

