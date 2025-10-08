// src/app/dashboard/services/organization-settings.service.ts
import { Injectable, signal, inject, effect } from '@angular/core';
import { Observable, from, throwError, of, BehaviorSubject } from 'rxjs';
import { tap, catchError, switchMap, map } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { Organization, OrganizationType } from '../../shared/models/user.models';

export interface OrganizationSettings extends Organization {
  // Additional settings-specific fields can go here
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  organizationType?: OrganizationType;
  website?: string;
  email?: string;
  phone?: string;
  logoUrl?: string;
  legalName?: string;
  registrationNumber?: string;
  fspLicenseNumber?: string;
  ncrNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  employeeCount?: number;
  assetsUnderManagement?: number;
  status?: 'active' | 'inactive' | 'pending_verification' | 'suspended' | 'verification_rejected';
}

@Injectable({
  providedIn: 'root'
})
export class OrganizationSettingsService {
  private supabaseService = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  // State signals
  isLoading = signal(false);
  isSaving = signal(false);
  error = signal<string | null>(null);
  lastSaved = signal<Date | null>(null);

  // Organization data
  private organizationSubject = new BehaviorSubject<OrganizationSettings | null>(null);
  organization$ = this.organizationSubject.asObservable();
  organization = signal<OrganizationSettings | null>(null);

  constructor() {
    // Auto-load organization on service init
    this.loadOrganization().subscribe();
    
    // Update components when lastSaved changes using effect
    effect(() => {
      const date = this.lastSaved();
      const current = this.organization();
      if (current && date) {
        this.organizationSubject.next(current);
      }
    });
  }

  /**
   * Load the current user's organization from database
   */
  loadOrganization(): Observable<OrganizationSettings | null> {
    const orgId = this.authService.getCurrentUserOrganizationId();
    
    if (!orgId) {
      console.warn('No organization ID found for current user');
      this.organization.set(null);
      this.organizationSubject.next(null);
      return of(null);
    }

    this.isLoading.set(true);
    this.error.set(null);

    return from(
      this.supabaseService.from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(`Failed to load organization: ${error.message}`);
        }
        return this.mapDatabaseToModel(data);
      }),
      tap(organization => {
        this.organization.set(organization);
        this.organizationSubject.next(organization);
        this.isLoading.set(false);
        console.log('Organization loaded:', organization?.name);
      }),
      catchError(error => {
        console.error('Load organization error:', error);
        this.error.set(error.message || 'Failed to load organization');
        this.isLoading.set(false);
        return of(null);
      })
    );
  }

  /**
   * Update organization with partial data
   */
  updateOrganization(updates: UpdateOrganizationRequest): Observable<OrganizationSettings> {
    const orgId = this.authService.getCurrentUserOrganizationId();
    
    if (!orgId) {
      return throwError(() => new Error('No organization found'));
    }

    if (this.isSaving()) {
      return throwError(() => new Error('Save already in progress'));
    }

    this.isSaving.set(true);
    this.error.set(null);

    // Validate and sanitize the updates
    const sanitizedUpdates = this.sanitizeUpdateData(updates);
    
    return from(
      this.supabaseService.from('organizations')
        .update({
          ...sanitizedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw new Error(`Update failed: ${error.message}`);
        }
        return this.mapDatabaseToModel(data);
      }),
      tap(updatedOrg => {
        this.organization.set(updatedOrg);
        this.organizationSubject.next(updatedOrg);
        this.lastSaved.set(new Date());
        this.isSaving.set(false);
        console.log('Organization updated:', updatedOrg.name);
      }),
      catchError(error => {
        console.error('Update organization error:', error);
        this.error.set(error.message || 'Failed to update organization');
        this.isSaving.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Upload organization logo
   */
  uploadLogo(file: File): Observable<string> {
    const orgId = this.authService.getCurrentUserOrganizationId();
    
    if (!orgId) {
      return throwError(() => new Error('No organization found'));
    }

    // Validate file
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return throwError(() => new Error('File size must be less than 5MB'));
    }

    if (!file.type.startsWith('image/')) {
      return throwError(() => new Error('File must be an image'));
    }

    this.isSaving.set(true);
    this.error.set(null);

    const fileName = `${orgId}/logo-${Date.now()}.${file.name.split('.').pop()}`;

    return from(
      this.supabaseService.storage
        .from('organization-logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }

        // Get public URL
        const { data: urlData } = this.supabaseService.storage
          .from('organization-logos')
          .getPublicUrl(fileName);

        const logoUrl = urlData.publicUrl;

        // Update organization with new logo URL
        return this.updateOrganization({ logoUrl });
      }),
      map(updatedOrg => updatedOrg.logoUrl || ''),
      tap(() => {
        this.isSaving.set(false);
        console.log('Logo uploaded successfully');
      }),
      catchError(error => {
        console.error('Upload logo error:', error);
        this.error.set(error.message || 'Failed to upload logo');
        this.isSaving.set(false);
        return throwError(() => error);
      })
    );
  }
  

  /**
   * Get organization statistics for dashboard
   */
  getOrganizationStats(): Observable<{
    totalOpportunities: number;
    activeApplications: number;
    totalFunded: number;
    verificationStatus: string;
  }> {
    const orgId = this.authService.getCurrentUserOrganizationId();
    
    if (!orgId) {
      return of({
        totalOpportunities: 0,
        activeApplications: 0,
        totalFunded: 0,
        verificationStatus: 'unverified'
      });
    }

    // TODO: Implement when opportunities and applications tables are ready
    // For now return mock data
    return of({
      totalOpportunities: 12,
      activeApplications: 34,
      totalFunded: 2500000,
      verificationStatus: this.organization()?.isVerified ? 'verified' : 'pending'
    });
  }

  /**
   * Request verification
   */
  requestVerification(): Observable<void> {
    const current = this.organization();
    if (!current) {
      return throwError(() => new Error('No organization loaded'));
    }

    return this.updateOrganization({
      // Set status to pending verification if not already verified
      ...(current.status !== 'verification_rejected' && { status: 'pending_verification' as any })
    }).pipe(
      map(() => void 0)
    );
  }

  // Private helper methods
  private mapDatabaseToModel(dbOrg: any): OrganizationSettings {
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
      verificationDate: dbOrg.verification_date ? new Date(dbOrg.verification_date) : undefined,
      email: dbOrg.email,
      phone: dbOrg.phone,
      addressLine1: dbOrg.address_line1,
      addressLine2: dbOrg.address_line2,
      city: dbOrg.city,
      province: dbOrg.province,
      postalCode: dbOrg.postal_code,
      country: dbOrg.country || 'South Africa',
      createdAt: new Date(dbOrg.created_at),
      updatedAt: new Date(dbOrg.updated_at),
      version: dbOrg.version
    };
  }

  private sanitizeUpdateData(updates: UpdateOrganizationRequest): any {
    const sanitized: any = {};

    // String fields with length limits
    const stringFields = [
      { key: 'name', dbKey: 'name', maxLength: 255 },
      { key: 'description', dbKey: 'description', maxLength: null },
      { key: 'website', dbKey: 'website', maxLength: 255 },
      { key: 'email', dbKey: 'email', maxLength: 255 },
      { key: 'phone', dbKey: 'phone', maxLength: 20 },
      { key: 'logoUrl', dbKey: 'logo_url', maxLength: null },
      { key: 'legalName', dbKey: 'legal_name', maxLength: 255 },
      { key: 'registrationNumber', dbKey: 'registration_number', maxLength: 100 },
      { key: 'fspLicenseNumber', dbKey: 'fsp_license_number', maxLength: 100 },
      { key: 'ncrNumber', dbKey: 'ncr_number', maxLength: 50 },
      { key: 'addressLine1', dbKey: 'address_line1', maxLength: 255 },
      { key: 'addressLine2', dbKey: 'address_line2', maxLength: 255 },
      { key: 'city', dbKey: 'city', maxLength: 100 },
      { key: 'province', dbKey: 'province', maxLength: 100 },
      { key: 'postalCode', dbKey: 'postal_code', maxLength: 20 },
      { key: 'country', dbKey: 'country', maxLength: 100 }
    ];

    stringFields.forEach(field => {
      const value = updates[field.key as keyof UpdateOrganizationRequest];
      if (value !== undefined) {
        const trimmed = value.toString().trim();
        if (trimmed && (!field.maxLength || trimmed.length <= field.maxLength)) {
          sanitized[field.dbKey] = trimmed;
        }
      }
    });

    // Organization type
    if (updates.organizationType) {
      sanitized.organization_type = updates.organizationType;
    }

    // Numeric fields
    if (updates.employeeCount !== undefined) {
      sanitized.employee_count = Number(updates.employeeCount);
    }

    if (updates.assetsUnderManagement !== undefined) {
      sanitized.assets_under_management = Number(updates.assetsUnderManagement);
    }

    return sanitized;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.organization.set(null);
    this.organizationSubject.next(null);
    this.error.set(null);
    this.lastSaved.set(null);
  }
}