// src/app/funder/services/funder-onboarding.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
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
  description: string;
  completed: boolean;
  required: boolean;
}

export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  organization?: FunderOrganization;
  isComplete: boolean;
  canCreateOpportunities: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FunderOnboardingService {
  private supabase: SupabaseClient;
  private authService = inject(AuthService);

  // State management
  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);

  // Onboarding state
  private onboardingStateSubject = new BehaviorSubject<OnboardingState>({
    currentStep: 0,
    totalSteps: 3,
    completionPercentage: 0,
    isComplete: false,
    canCreateOpportunities: false
  });
  
  onboardingState$ = this.onboardingStateSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  // ===============================
  // ONBOARDING STATE MANAGEMENT
  // ===============================

  checkOnboardingStatus(): Observable<OnboardingState> {
    this.isLoading.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.fetchOnboardingStatus(currentAuth.id)).pipe(
      tap(state => {
        this.onboardingStateSubject.next(state);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to check onboarding status');
        this.isLoading.set(false);
        console.error('Onboarding status error:', error);
        return throwError(() => error);
      })
    );
  }

  private async fetchOnboardingStatus(userId: string): Promise<OnboardingState> {
    try {
      // Check if user has an organization
      const { data: organization, error } = await this.supabase
        .from('funder_organizations')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw new Error(`Failed to fetch organization: ${error.message}`);
      }

      const hasOrganization = !!organization;
      const isVerified = organization?.is_verified || false;

      // Calculate completion based on organization data
      let completionPercentage = 0;
      let currentStep = 0;

      if (hasOrganization) {
        currentStep = 1;
        completionPercentage = 33;

        // Check if basic info is complete
        if (this.isBasicInfoComplete(organization)) {
          currentStep = 2;
          completionPercentage = 66;
        }

        // Check if verification is complete
        if (isVerified) {
          currentStep = 3;
          completionPercentage = 100;
        }
      }

      const isComplete = completionPercentage === 100;
      const canCreateOpportunities = hasOrganization && this.isBasicInfoComplete(organization);

      return {
        currentStep,
        totalSteps: 3,
        completionPercentage,
        organization: organization ? this.mapDatabaseToModel(organization) : undefined,
        isComplete,
        canCreateOpportunities
      };
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
      throw error;
    }
  }

  private isBasicInfoComplete(org: any): boolean {
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

  // ===============================
  // ORGANIZATION CREATION
  // ===============================

  createOrganization(organizationData: Partial<FunderOrganization>): Observable<{ success: boolean; organizationId: string }> {
    this.isSaving.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isSaving.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.performCreateOrganization(organizationData, currentAuth.id)).pipe(
      tap(result => {
        this.isSaving.set(false);
        if (result.success) {
          // Refresh onboarding status
          this.checkOnboardingStatus().subscribe();
        }
      }),
      catchError(error => {
        this.isSaving.set(false);
        this.error.set('Failed to create organization');
        console.error('Create organization error:', error);
        return throwError(() => error);
      })
    );
  }

  private async performCreateOrganization(
    orgData: Partial<FunderOrganization>, 
    userId: string
  ): Promise<{ success: boolean; organizationId: string }> {
    try {
      const organizationPayload = {
        id: `org_${Date.now()}`,
        user_id: userId,
        name: orgData.name,
        description: orgData.description,
        organization_type: orgData.organizationType,
        legal_name: orgData.legalName,
        registration_number: orgData.registrationNumber,
        tax_number: orgData.taxNumber,
        website: orgData.website,
        email: orgData.email,
        phone: orgData.phone,
        address_line1: orgData.addressLine1,
        address_line2: orgData.addressLine2,
        city: orgData.city,
        province: orgData.province,
        postal_code: orgData.postalCode,
        country: orgData.country || 'South Africa',
        founded_year: orgData.foundedYear,
        employee_count: orgData.employeeCount,
        assets_under_management: orgData.assetsUnderManagement,
        status: 'active',
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('funder_organizations')
        .insert(organizationPayload)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create organization: ${error.message}`);
      }

      return {
        success: true,
        organizationId: data.id
      };
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  // ===============================
  // ORGANIZATION UPDATE
  // ===============================

  updateOrganization(updates: Partial<FunderOrganization>): Observable<{ success: boolean }> {
    this.isSaving.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isSaving.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.performUpdateOrganization(updates, currentAuth.id)).pipe(
      tap(result => {
        this.isSaving.set(false);
        if (result.success) {
          this.checkOnboardingStatus().subscribe();
        }
      }),
      catchError(error => {
        this.isSaving.set(false);
        this.error.set('Failed to update organization');
        console.error('Update organization error:', error);
        return throwError(() => error);
      })
    );
  }

  private async performUpdateOrganization(
    updates: Partial<FunderOrganization>, 
    userId: string
  ): Promise<{ success: boolean }> {
    try {
      const updatePayload = {
        name: updates.name,
        description: updates.description,
        organization_type: updates.organizationType,
        legal_name: updates.legalName,
        registration_number: updates.registrationNumber,
        tax_number: updates.taxNumber,
        website: updates.website,
        email: updates.email,
        phone: updates.phone,
        address_line1: updates.addressLine1,
        address_line2: updates.addressLine2,
        city: updates.city,
        province: updates.province,
        postal_code: updates.postalCode,
        country: updates.country,
        founded_year: updates.foundedYear,
        employee_count: updates.employeeCount,
        assets_under_management: updates.assetsUnderManagement,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key as keyof typeof updatePayload] === undefined) {
          delete updatePayload[key as keyof typeof updatePayload];
        }
      });

      const { error } = await this.supabase
        .from('funder_organizations')
        .update(updatePayload)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update organization: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  }

  // ===============================
  // VERIFICATION REQUEST
  // ===============================

  requestVerification(): Observable<{ success: boolean; message: string }> {
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.performVerificationRequest(currentAuth.id)).pipe(
      tap(result => {
        if (result.success) {
          this.checkOnboardingStatus().subscribe();
        }
      }),
      catchError(error => {
        this.error.set('Failed to request verification');
        console.error('Verification request error:', error);
        return throwError(() => error);
      })
    );
  }

  private async performVerificationRequest(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      // In a real application, this would trigger a verification workflow
      // For now, we'll just update the status to indicate verification is pending
      
      const { error } = await this.supabase
        .from('funder_organizations')
        .update({ 
          status: 'pending_verification',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to request verification: ${error.message}`);
      }

      return {
        success: true,
        message: 'Verification request submitted successfully. We will review your organization details and contact you within 2-3 business days.'
      };
    } catch (error) {
      console.error('Error requesting verification:', error);
      throw error;
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  canCreateOpportunities(): boolean {
    const currentState = this.onboardingStateSubject.value;
    return currentState.canCreateOpportunities;
  }

  getCurrentOrganization(): FunderOrganization | undefined {
    return this.onboardingStateSubject.value.organization;
  }

  getOnboardingSteps(): OnboardingStep[] {
    const state = this.onboardingStateSubject.value;
    
    return [
      {
        id: 'create-organization',
        title: 'Create Organization',
        description: 'Set up your funding organization profile',
        completed: state.currentStep > 0,
        required: true
      },
      {
        id: 'complete-details',
        title: 'Complete Details',
        description: 'Add comprehensive organization information',
        completed: state.currentStep > 1,
        required: true
      },
      {
        id: 'verification',
        title: 'Get Verified',
        description: 'Submit for verification to start funding',
        completed: state.currentStep > 2,
        required: false
      }
    ];
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
}
