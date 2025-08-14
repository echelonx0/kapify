// src/app/funder/services/funder-onboarding.service.ts - HANGING FIXES
import { Injectable, signal, inject } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject, Subject, of } from 'rxjs';
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
  
  // FIX 1: Single save operation tracker to prevent concurrent saves
  private activeSaveOperation$ = new Subject<boolean>();

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

  // FIX 2: Properly separated steps - basic info only in step 1
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
    this.loadFromLocalStorage();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // LOCAL STORAGE - UNCHANGED
  // ===============================

  private saveToLocalStorage() {
    try {
      const user = this.authService.user();
      if (!user) return;

      const dataToSave: LocalStorageData = {
        organizationData: this.organizationData(),
        currentStep: this.currentStep(),
        lastSaved: new Date().toISOString(),
        userId: user.id
      };

      localStorage.setItem(this.localStorageKey, JSON.stringify(dataToSave));
      this.lastSavedLocally.set(new Date());
      console.log('✅ Saved to localStorage');
    } catch (error) {
      console.error('❌ localStorage save failed:', error);
    }
  }

  private loadFromLocalStorage() {
    try {
      const user = this.authService.user();
      if (!user) return;

      const saved = localStorage.getItem(this.localStorageKey);
      if (saved) {
        const parsedData: LocalStorageData = JSON.parse(saved);
        
        if (parsedData.userId === user.id) {
          this.organizationData.set(parsedData.organizationData || { country: 'South Africa' });
          this.currentStep.set(parsedData.currentStep || 'organization-info');
          this.lastSavedLocally.set(new Date(parsedData.lastSaved));
          this.updateStepCompletionFromData();
          console.log('✅ Loaded from localStorage');
        }
      }
    } catch (error) {
      console.error('❌ localStorage load failed:', error);
    }
  }

  // ===============================
  // DATA UPDATE - UNCHANGED
  // ===============================

  updateOrganizationData(updates: Partial<FunderOrganization>) {
    console.log('📝 Updating organization data');
    
    this.organizationData.update(current => ({
      ...current,
      ...updates
    }));
    
    this.saveToLocalStorage();
    this.updateStepCompletionFromData();
  }

 

  // ===============================
  // FIX 4: COMPLETELY REWRITTEN SAVE - NO MORE HANGING
  // ===============================

  saveToDatabase(): Observable<{ success: boolean; organizationId?: string }> {
    console.log('💾 Starting database save...');
    
    // FIX: Prevent concurrent saves
    if (this.isSaving()) {
      console.warn('⚠️ Save already in progress');
      return of({ success: false });
    }
    
    this.isSaving.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isSaving.set(false);
      this.error.set('Please log in to save');
      return throwError(() => new Error('User not authenticated'));
    }

    const data = this.organizationData();
    if (!data.name?.trim()) {
      this.isSaving.set(false);
      this.error.set('Organization name is required');
      return throwError(() => new Error('Organization name is required'));
    }
    
    console.log('💾 Using simplified upsert...');
    
    // FIX: Simple upsert with short timeout
    return from(this.simpleUpsert(data, currentAuth.id)).pipe(
      timeout(5000), // Reduced from 15s to 5s
      tap(result => {
        console.log('✅ Save completed:', result);
        // FIX: NO automatic status refresh - prevents loops
      }),
      catchError(error => {
        console.error('❌ Save failed:', error);
        
        let errorMessage = 'Failed to save organization';
        if (error.name === 'TimeoutError') {
          errorMessage = 'Save timed out. Please try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.error.set(errorMessage);
        return throwError(() => error);
      }),
      finalize(() => {
        this.isSaving.set(false);
      })
    );
  }

  // FIX 5: ULTRA-SIMPLE UPSERT - NO COMPLEX LOGIC
  private async simpleUpsert(
    orgData: Partial<FunderOrganization>, 
    userId: string
  ): Promise<{ success: boolean; organizationId?: string }> {
    
    console.log('💾 Performing upsert...');
    
    // FIX: Simple, clean payload - no complex null handling
    const payload = {
      user_id: userId,
      name: orgData.name || '',
      description: orgData.description || null,
      organization_type: orgData.organizationType || 'investment_fund',
      legal_name: orgData.legalName || null,
      registration_number: orgData.registrationNumber || null,
      tax_number: orgData.taxNumber || null,
      website: orgData.website || null,
      email: orgData.email || null,
      phone: orgData.phone || null,
      address_line1: orgData.addressLine1 || null,
      address_line2: orgData.addressLine2 || null,
      city: orgData.city || null,
      province: orgData.province || null,
      postal_code: orgData.postalCode || null,
      country: orgData.country || 'South Africa',
      founded_year: orgData.foundedYear || null,
      employee_count: orgData.employeeCount || null,
      assets_under_management: orgData.assetsUnderManagement || null,
      status: 'active',
      is_verified: false,
      updated_at: new Date().toISOString()
    };

    try {
      // FIX: Single upsert call - handles both insert and update
      const { data, error } = await this.supabase
        .from('funder_organizations')
        .upsert(payload, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Upsert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('✅ Upsert successful');
      return { success: true, organizationId: data.id };
      
    } catch (error) {
      console.error('❌ Upsert failed:', error);
      throw error;
    }
  }

  // ===============================
  // FIX 6: SIMPLIFIED STATUS CHECK - NO LOOPS
  // ===============================

  checkOnboardingStatus(): Observable<OnboardingState> {
    console.log('🔍 Checking status...');
    
    this.isLoading.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isLoading.set(false);
      return of(this.onboardingStateSubject.value);
    }

    return from(this.fetchStatus(currentAuth.id)).pipe(
      timeout(3000), // Very short timeout
      tap(state => {
        this.onboardingStateSubject.next(state);
      }),
      catchError(error => {
        console.error('❌ Status check failed:', error);
        // FIX: Return current local state instead of failing
        return of(this.onboardingStateSubject.value);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  private async fetchStatus(userId: string): Promise<OnboardingState> {
    try {
      const { data: organization, error } = await this.supabase
        .from('funder_organizations')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      if (!organization) {
        return this.onboardingStateSubject.value;
      }

      // Update local data with database data
      this.organizationData.set(this.mapDatabaseToModel(organization));
      
      // Calculate completion
      const basicComplete = this.isBasicInfoValid();
      const legalComplete = this.isLegalInfoValid();
      
      return {
        currentStep: basicComplete ? (legalComplete ? 2 : 1) : 0,
        totalSteps: 3,
        completionPercentage: basicComplete ? (legalComplete ? 66 : 33) : 0,
        organization: this.mapDatabaseToModel(organization),
        isComplete: organization.is_verified,
        canCreateOpportunities: basicComplete && legalComplete,
        steps: this.steps
      };
      
    } catch (error) {
      console.error('❌ Error fetching status:', error);
      throw error;
    }
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
  // FIX 7: SIMPLIFIED VERIFICATION
  // ===============================

  requestVerification(): Observable<{ success: boolean; message: string }> {
    console.log('🛡️ Requesting verification...');
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.updateVerificationStatus(currentAuth.id)).pipe(
      timeout(5000),
      catchError(error => {
        console.error('❌ Verification request failed:', error);
        this.error.set('Failed to request verification');
        return throwError(() => error);
      })
    );
  }

  private async updateVerificationStatus(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabase
        .from('funder_organizations')
        .update({ 
          status: 'pending_verification',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Verification request failed: ${error.message}`);
      }

      return {
        success: true,
        message: 'Verification request submitted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  // ===============================
  // UTILITY METHODS - UNCHANGED
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





  //// 

  // src/app/funder/services/funder-onboarding.service.ts - VALIDATION UPDATE
// Only showing the updated validation section - rest remains the same

  // ===============================
  // UPDATED VALIDATION - PROPER STEP SEPARATION
  // ===============================

  // STEP 1: Basic Information Only
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

  // STEP 2: Legal Information Only  
  isLegalInfoValid(): boolean {
    const data = this.organizationData();
    return !!(
      data.legalName?.trim() &&
      data.registrationNumber?.trim() &&
      data.addressLine1?.trim() &&
      data.city?.trim() &&
      data.province &&
      data.country
    );
  }

  // STEP 3: Ready for verification (both previous steps complete)
  isReadyForVerification(): boolean {
    return this.isBasicInfoValid() && this.isLegalInfoValid();
  }

  // Overall completion check
  isFullyComplete(): boolean {
    const data = this.organizationData();
    return this.isReadyForVerification() && !!data.id; // Has been saved to database
  }

  private updateStepCompletionFromData() {
    const basicInfoComplete = this.isBasicInfoValid();
    const legalInfoComplete = this.isLegalInfoValid();
    const readyForVerification = this.isReadyForVerification();
    
    // Update step completion status
    this.steps[0].completed = basicInfoComplete;
    this.steps[1].completed = legalInfoComplete;
    this.steps[2].completed = false; // Verification is a one-time action, not a "completed" state
    
    const completedRequiredSteps = this.steps.filter(step => step.required && step.completed).length;
    const totalRequiredSteps = this.steps.filter(step => step.required).length;
    
    // Calculate current step index
    let currentStepIndex = 0;
    if (basicInfoComplete && !legalInfoComplete) {
      currentStepIndex = 1; // Move to legal info
    } else if (basicInfoComplete && legalInfoComplete) {
      currentStepIndex = 2; // Move to verification
    }
    
    // Calculate completion percentage based on required steps
    const completionPercentage = Math.round((completedRequiredSteps / totalRequiredSteps) * 100);

    const state: OnboardingState = {
      currentStep: currentStepIndex,
      totalSteps: this.steps.length,
      completionPercentage,
      organization: this.organizationData() as FunderOrganization,
      isComplete: completionPercentage === 100,
      canCreateOpportunities: readyForVerification, // Can create opportunities when ready for verification
      steps: [...this.steps]
    };

    this.onboardingStateSubject.next(state);
    console.log('📊 Step completion updated:', {
      basicComplete: basicInfoComplete,
      legalComplete: legalInfoComplete,
      currentStep: currentStepIndex,
      completionPercentage,
      canCreateOpportunities: readyForVerification
    });
  }

  // ===============================
  // STEP NAVIGATION HELPERS
  // ===============================

  getNextIncompleteStep(): string {
    if (!this.isBasicInfoValid()) {
      return 'organization-info';
    } else if (!this.isLegalInfoValid()) {
      return 'legal-compliance';
    } else {
      return 'verification';
    }
  }

  canAccessStep(stepId: string): boolean {
    switch (stepId) {
      case 'organization-info':
        return true; // Always accessible
      case 'legal-compliance':
        return this.isBasicInfoValid(); // Requires step 1 complete
      case 'verification':
        return this.isReadyForVerification(); // Requires steps 1 & 2 complete
      default:
        return false;
    }
  }

  getStepProgress(): { completed: number; total: number; percentage: number } {
    const completedSteps = this.steps.filter(step => step.completed).length;
    const totalSteps = this.steps.length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);
    
    return {
      completed: completedSteps,
      total: totalSteps,
      percentage
    };
  }
}