import { Injectable, signal, inject } from '@angular/core';
import { Observable, from, throwError, of, BehaviorSubject, timer } from 'rxjs';
import { tap, catchError, switchMap, take, map } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { FunderOrganization, Organization, OrganizationType } from '../../shared/models/user.models';
// Simplified interface for onboarding (extends Organization)
export interface FunderOnboardingData extends Omit<Organization, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
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
  organization?: Organization;
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
  
  // State
  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);
  lastSavedLocally = signal<Date | null>(null);
  lastSavedToDatabase = signal<Date | null>(null);
  currentStep = signal<string>('organization-info');
  
  organizationData = signal<Partial<FunderOnboardingData>>({
    organizationType: 'investment_fund',
    country: 'South Africa',
    status: 'active',
    isVerified: false
  });

  // Steps configuration
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
  console.log('FunderOnboardingService initialized with unified organizations');
  this.loadFromLocalStorage();
  
  // NEW: Load existing organization data if user has one
  this.loadExistingOrganizationData().subscribe({
    next: () => {
      this.updateStateFromData();
      console.log('Organization data loaded from database');
    },
    error: (error) => {
      console.warn('Failed to load organization data:', error);
      this.updateStateFromData();
    }
  });
}

  // ===============================
  // CORE DATA OPERATIONS
  // ===============================

  updateOrganizationData(updates: Partial<FunderOnboardingData>) {
    this.organizationData.update(current => ({
      ...current,
      ...updates
    }));
    this.saveToLocalStorage();
    this.updateStateFromData();
  }

   // Add backward compatibility method
  getCurrentOrganization(): Partial<FunderOrganization> {
    const orgData = this.organizationData();
    return {
      ...orgData,
      userId: this.authService.user()?.id
    } as FunderOrganization;
  }

  // Add missing getStepProgress method
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

 

// ===============================
// NEW: Method to check if user has existing organization
// ===============================

hasExistingOrganization(): boolean {
  const orgId = this.authService.getCurrentUserOrganizationId();
  return !!orgId;
}

// ===============================
// NEW: Method to get organization display status
// ===============================

getOrganizationStatus(): 'loading' | 'existing' | 'new' | 'error' {
  if (this.isLoading()) return 'loading';
  if (this.error()) return 'error';
  
  const orgId = this.authService.getCurrentUserOrganizationId();
  const hasData = !!this.organizationData().id;
  
  if (orgId && hasData) return 'existing';
  if (orgId && !hasData) return 'loading'; // Still loading data
  
  return 'new';
}
 
 
// 1. Enhanced saveToDatabase method with detailed logging
 saveToDatabase(): Observable<{ success: boolean; organizationId?: string }> {
    console.log('🔍 DEBUG: saveToDatabase() called');
    
    const user = this.authService.user();
    console.log('🔍 DEBUG: User check:', !!user, user?.id);
    
    if (!user) {
      console.log('❌ DEBUG: No user found');
      this.error.set('Please log in to save');
      return throwError(() => new Error('Not authenticated'));
    }

    const data = this.organizationData();
    console.log('🔍 DEBUG: Organization data:', {
      hasName: !!data.name?.trim(),
      hasId: !!data.id,
      name: data.name,
      id: data.id
    });
    
    // Pre-validate before attempting save
    const validation = this.validateDataForDatabase(data);
    if (!validation.isValid) {
      console.log('❌ DEBUG: Pre-validation failed:', validation.errors);
      this.error.set(`Validation failed: ${validation.errors[0]}`);
      return throwError(() => new Error('Validation failed'));
    }

    this.isSaving.set(true);
    this.error.set(null);
    console.log('🔍 DEBUG: Set isSaving to true');

    // Check if user has existing organization
    const existingOrgId = this.authService.getCurrentUserOrganizationId();
    console.log('🔍 DEBUG: Existing org ID from auth service:', existingOrgId);
    
    if (existingOrgId) {
      console.log('🔍 DEBUG: Calling updateExistingOrganization with ID:', existingOrgId);
      return this.updateExistingOrganization(existingOrgId, data);
    } else {
      console.log('❌ DEBUG: No existing organization ID found');
      this.error.set('No organization found - please contact support');
      this.isSaving.set(false);
      return throwError(() => new Error('Organization missing'));
    }
  }

  // ===============================
  // ADDITIONAL HELPER METHODS
  // ===============================

  // Method to test database connection and permissions
  testDatabaseConnection(): Observable<boolean> {
    const orgId = this.authService.getCurrentUserOrganizationId();
    if (!orgId) {
      return of(false);
    }

    return from(
      this.supabaseService.from('organizations')
        .select('id, name')
        .eq('id', orgId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Database connection test failed:', error);
          return false;
        }
        console.log('Database connection test passed:', data?.name);
        return true;
      }),
      catchError(() => of(false))
    );
  }

  // Method to validate specific fields before saving
  validateField(fieldName: keyof FunderOnboardingData, value: any): { isValid: boolean; error?: string } {
    const tempData = { [fieldName]: value };
    const validation = this.validateDataForDatabase(tempData);
    
    return {
      isValid: validation.errors.length === 0,
      error: validation.errors[0]
    };
  }


 
// 3. Add debugging method to check auth service
debugAuthState(): void {
  console.log('🔍 DEBUG: Auth Service State Check');
  console.log('User:', this.authService.user());
  console.log('Organization ID:', this.authService.getCurrentUserOrganizationId());
  console.log('Current org data:', this.organizationData());
}

checkOnboardingStatus(): Observable<OnboardingState> {
  const user = this.authService.user();
  if (!user) {
    return of(this.getOnboardingState());
  }

  this.isLoading.set(true);
  this.error.set(null);

  // Check if we already have organization data
  const currentOrgData = this.organizationData();
  if (currentOrgData.id) {
    console.log('Using existing organization data');
    const state = this.getOnboardingState();
    this.onboardingStateSubject.next(state);
    this.isLoading.set(false);
    return of(state);
  }

  // If no existing data, try to load from database
  return this.loadExistingOrganizationData().pipe(
    switchMap(() => {
      const state = this.getOnboardingState();
      this.onboardingStateSubject.next(state);
      return of(state);
    }),
    catchError(error => {
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

  // Request verification
  requestVerification(): Observable<{ success: boolean; message: string }> {
    if (!this.isReadyForVerification()) {
      return throwError(() => new Error('Complete all required information first'));
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
      this.supabaseService.from('organizations')
        .update({ 
          status: 'pending_verification',
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId)
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
  // DATABASE MAPPING
  // ===============================

private mapDatabaseToModel(dbOrg: any): FunderOnboardingData {
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
    // FIXED: Now correctly mapping to the renamed columns
    fspLicenseNumber: dbOrg.fsp_license_number,
    ncrNumber: dbOrg.ncr_number,
    employeeCount: dbOrg.employee_count,
    assetsUnderManagement: dbOrg.assets_under_management,
    isVerified: dbOrg.is_verified,
    verificationDate: dbOrg.verification_date ? new Date(dbOrg.verification_date) : undefined,
    email: dbOrg.email,
    phone: dbOrg.phone,
    addressLine1: dbOrg.address_line1,
    addressLine2: dbOrg.address_line2,
    city: dbOrg.city,
    province: dbOrg.province,
    postalCode: dbOrg.postal_code,
    country: dbOrg.country || 'South Africa'
  };
}

// Also fix the updateExistingOrganization method
// private updateExistingOrganization(orgId: string, data: Partial<FunderOnboardingData>): Observable<{ success: boolean; organizationId?: string }> {
//   console.log('🔍 DEBUG: updateExistingOrganization called with:', {
//     orgId,
//     dataKeys: Object.keys(data),
//     hasName: !!data.name
//   });

//   const orgUpdates = {
//     name: data.name,
//     description: data.description || null,
//     organization_type: data.organizationType || 'investment_fund',
//     status: data.status || 'active',
//     website: data.website || null,
//     logo_url: data.logoUrl || null,
//     legal_name: data.legalName || null,
//     registration_number: data.registrationNumber || null,
//     // FIXED: Now using correct column names
//     fsp_license_number: data.fspLicenseNumber || null,
//     ncr_number: data.ncrNumber?.toString() || null,
//     employee_count: this.parseEmployeeCount(data.employeeCount) || null,
//     assets_under_management: data.assetsUnderManagement || null,
//     email: data.email || null,
//     phone: data.phone || null,
//     address_line1: data.addressLine1 || null,
//     address_line2: data.addressLine2 || null,
//     city: data.city || null,
//     province: data.province || null,
//     postal_code: data.postalCode || null,
//     country: data.country || 'South Africa',
//     updated_at: new Date().toISOString()
//   };

//   console.log('🔍 DEBUG: Prepared org updates:', orgUpdates);
//   console.log('🔍 DEBUG: About to call Supabase update...');

//   return from(
//     this.supabaseService.from('organizations')
//       .update(orgUpdates)
//       .eq('id', orgId)
//       .select()
//       .maybeSingle()
//   ).pipe(
//     tap(({ data: orgResult, error: orgError }) => {
//       console.log('🔍 DEBUG: Supabase response received:', {
//         hasData: !!orgResult,
//         hasError: !!orgError,
//         errorMessage: orgError?.message
//       });
      
//       if (orgError) {
//         console.error('❌ DEBUG: Supabase error:', orgError);
//         throw orgError;
//       }
      
//       console.log('✅ DEBUG: Supabase update successful:', orgResult);
      
//       // Update local data with result
//       this.organizationData.update(current => ({
//         ...current,
//         id: orgResult.id
//       }));
//       this.saveToLocalStorage();
//       this.lastSavedToDatabase.set(new Date());
//       this.updateStateFromData();
//     }),
//     switchMap(() => {
//       console.log('🔍 DEBUG: Switching to success response');
//       return of({ success: true, organizationId: orgId });
//     }),
//     catchError(error => {
//       console.error('❌ DEBUG: Catch block triggered:', error);
//       this.error.set(error.message || 'Failed to save organization');
//       this.isSaving.set(false);
//       return throwError(() => error);
//     }),
//     tap(() => {
//       console.log('✅ DEBUG: Final tap - setting isSaving to false');
//       this.isSaving.set(false);
//       console.log('Organization updated successfully');
//     })
//   );
// }

private updateExistingOrganization(
    orgId: string, 
    data: Partial<FunderOnboardingData>
  ): Observable<{ success: boolean; organizationId?: string }> {
    console.log('🔍 DEBUG: updateExistingOrganization called with:', {
      orgId,
      dataKeys: Object.keys(data),
      hasName: !!data.name
    });

    // STEP 1: Validate and sanitize data
    const validation = this.validateDataForDatabase(data);
    
    if (!validation.isValid) {
      console.error('❌ DEBUG: Data validation failed:', validation.errors);
      this.error.set(`Validation failed: ${validation.errors.join(', ')}`);
      this.isSaving.set(false);
      return throwError(() => new Error(validation.errors.join(', ')));
    }

    console.log('✅ DEBUG: Data validation passed');
    console.log('🔍 DEBUG: Sanitized data:', validation.sanitizedData);

    // STEP 2: Perform Supabase update with correct syntax
    return from(
      this.supabaseService.from('organizations')
        .update(validation.sanitizedData)
        .eq('id', orgId)
        .select('*')
        .single() // Use single() instead of maybeSingle() to ensure we get data back
    ).pipe(
      tap(({ data: orgResult, error: orgError }) => {
        console.log('🔍 DEBUG: Supabase response received:', {
          hasData: !!orgResult,
          hasError: !!orgError,
          errorMessage: orgError?.message,
          errorCode: orgError?.code
        });
        
        if (orgError) {
          console.error('❌ DEBUG: Supabase error details:', {
            message: orgError.message,
            code: orgError.code,
            details: orgError.details,
            hint: orgError.hint
          });
          
          // Handle specific error types
          if (orgError.code === '23514') {
            throw new Error('Invalid data: Check constraint violation');
          } else if (orgError.code === '23505') {
            throw new Error('Data conflict: Duplicate value detected');
          } else if (orgError.code === 'PGRST116') {
            throw new Error('Organization not found or access denied');
          } else {
            throw new Error(`Database error: ${orgError.message}`);
          }
        }
        
        if (!orgResult) {
          console.error('❌ DEBUG: No data returned from update');
          throw new Error('Update succeeded but no data returned');
        }
        
        console.log('✅ DEBUG: Supabase update successful:', {
          id: orgResult.id,
          name: orgResult.name,
          updatedAt: orgResult.updated_at
        });
        
        // STEP 3: Update local data with result
        const updatedLocalData = this.mapDatabaseToModel(orgResult);
        this.organizationData.update(current => ({
          ...current,
          ...updatedLocalData
        }));
        
        this.saveToLocalStorage();
        this.lastSavedToDatabase.set(new Date());
        this.updateStateFromData();
      }),
      switchMap((result) => {
        console.log('🔍 DEBUG: Switching to success response');
        return of({ success: true, organizationId: orgId });
      }),
      catchError(error => {
        console.error('❌ DEBUG: Catch block triggered:', error);
        
        // Provide user-friendly error messages
        let userMessage = 'Failed to save organization data';
        
        if (error.message.includes('Check constraint violation')) {
          userMessage = 'Invalid organization type or status value';
        } else if (error.message.includes('Duplicate value')) {
          userMessage = 'Registration number already exists';
        } else if (error.message.includes('not found or access denied')) {
          userMessage = 'Organization not found or you don\'t have permission to update it';
        } else if (error.message.includes('Validation failed')) {
          userMessage = error.message;
        }
        
        this.error.set(userMessage);
        this.isSaving.set(false);
        return throwError(() => error);
      }),
      tap(() => {
        console.log('✅ DEBUG: Final tap - setting isSaving to false');
        this.isSaving.set(false);
        console.log('Organization updated successfully');
      })
    );
  }

  // ===============================
  // VALIDATION & STATE METHODS
  // ===============================

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
      organization: data as Organization,
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

  private updateStateFromData() {
    const state = this.getOnboardingState();
    this.onboardingStateSubject.next(state);
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
      data.legalName?.trim() &&
      data.registrationNumber?.trim()
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

  isFullyComplete(): boolean {
    const data = this.organizationData();
    return this.isReadyForVerification() && !!data.id;
  }

  canCreateOpportunities(): boolean {
    return this.isReadyForVerification();
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private parseEmployeeCount(employeeCount: string | number | undefined): number | null {
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

  // Step management methods
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

  // Local storage methods
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

  clearAllData(): void {
    this.organizationData.set({
      organizationType: 'investment_fund',
      country: 'South Africa',
      status: 'active',
      isVerified: false
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
    console.log('All onboarding data cleared');
  }


  // ===============================
// NEW: Load existing organization data from AuthService
// ===============================

private loadExistingOrganizationData(): Observable<void> {
  const orgId = this.authService.getCurrentUserOrganizationId();
  
  if (!orgId) {
    console.log('No existing organization found');
    return of(undefined);
  }

  console.log('Loading existing organization data for ID:', orgId);
  
  return from(
    this.supabaseService.from('organizations')
      .select('*')
      .eq('id', orgId)
      .maybeSingle()
  ).pipe(
    tap(({ data, error }) => {
      if (error) {
        console.warn('Failed to load existing organization:', error);
        return;
      }

      if (data) {
        console.log('Loaded existing organization:', data.name);
        const mapped = this.mapDatabaseToModel(data);
        this.organizationData.set(mapped);
        this.saveToLocalStorage();
        this.updateStateFromData();
      }
    }),
    map(() => undefined),
    catchError(error => {
      console.error('Error loading existing organization:', error);
      return of(undefined);
    })
  );
}



  // ===============================
  // NEW: DATA VALIDATION METHODS
  // ===============================

  private validateDataForDatabase(data: Partial<FunderOnboardingData>): { 
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
      'investment_fund', 'bank', 'government', 'ngo', 'private_equity',
      'venture_capital', 'sme', 'consultant', 'general', 'funder'
    ];
    if (data.organizationType && !validTypes.includes(data.organizationType)) {
      errors.push(`Invalid organization type: ${data.organizationType}`);
    } else {
      sanitizedData.organization_type = data.organizationType || 'investment_fund';
    }

    // Status validation
    const validStatuses = ['active', 'inactive', 'pending_verification', 'suspended'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push(`Invalid status: ${data.status}`);
    } else {
      sanitizedData.status = data.status || 'active';
    }

    // String field validation with length limits
    const stringFields = [
      { key: 'description', dbKey: 'description', maxLength: null },
      { key: 'website', dbKey: 'website', maxLength: 255 },
      { key: 'phone', dbKey: 'phone', maxLength: 20 },
      { key: 'email', dbKey: 'email', maxLength: 255 },
      { key: 'logoUrl', dbKey: 'logo_url', maxLength: null },
      { key: 'legalName', dbKey: 'legal_name', maxLength: 255 },
      { key: 'registrationNumber', dbKey: 'registration_number', maxLength: 100 },
      { key: 'fspLicenseNumber', dbKey: 'fsp_license_number', maxLength: 100 },
      { key: 'addressLine1', dbKey: 'address_line1', maxLength: 255 },
      { key: 'addressLine2', dbKey: 'address_line2', maxLength: 255 },
      { key: 'city', dbKey: 'city', maxLength: 100 },
      { key: 'province', dbKey: 'province', maxLength: 100 },
      { key: 'postalCode', dbKey: 'postal_code', maxLength: 20 },
      { key: 'country', dbKey: 'country', maxLength: 100 }
    ];

    stringFields.forEach(field => {
      const value = data[field.key as keyof FunderOnboardingData];
      if (value) {
        const trimmed = value.toString().trim();
        if (field.maxLength && trimmed.length > field.maxLength) {
          errors.push(`${field.key} must be less than ${field.maxLength} characters`);
        } else if (trimmed) {
          sanitizedData[field.dbKey] = trimmed;
        }
      }
    });

    // NCR Number validation (VARCHAR(50))
    if (data.ncrNumber) {
      const ncrStr = data.ncrNumber.toString().trim();
      if (ncrStr.length > 50) {
        errors.push('NCR number must be less than 50 characters');
      } else if (ncrStr) {
        sanitizedData.ncr_number = ncrStr;
      }
    }

    // Employee count validation (integer)
    if (data.employeeCount !== undefined) {
      const empCount = this.parseEmployeeCount(data.employeeCount);
      if (empCount !== null) {
        sanitizedData.employee_count = empCount;
      }
    }

    // Assets under management validation (bigint)
    if (data.assetsUnderManagement !== undefined) {
      const aum = typeof data.assetsUnderManagement === 'string' 
        ? parseFloat(data.assetsUnderManagement)
        : data.assetsUnderManagement;
      
      if (!isNaN(aum) && aum >= 0) {
        sanitizedData.assets_under_management = Math.floor(aum);
      }
    }

    // Boolean fields
    if (data.isVerified !== undefined) {
      sanitizedData.is_verified = Boolean(data.isVerified);
    }

    // Date fields
    if (data.verificationDate) {
      sanitizedData.verification_date = data.verificationDate instanceof Date 
        ? data.verificationDate.toISOString()
        : data.verificationDate;
    }

    // Always set updated_at
    sanitizedData.updated_at = new Date().toISOString();

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }

  private validateEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validatePhoneFormat(phone: string): boolean {
    // Basic phone validation - adjust for your requirements
    const phoneRegex = /^[\+\-\s\(\)\d]{7,20}$/;
    return phoneRegex.test(phone);
  }
}