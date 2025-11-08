// src/app/shared/services/organization-setup.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';
import { SharedSupabaseService } from './shared-supabase.service';
import { Organization, OrganizationType } from '../models/user.models';

export interface OrganizationCreationRequest {
  userId: string;
  userType: 'sme' | 'funder' | 'consultant';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName?: string;
}

export interface OrganizationSetupResult {
  organization: Organization;
  organizationUserId: string;
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationSetupService {
  private supabaseService = inject(SharedSupabaseService);

  constructor() {
    console.log('OrganizationSetupService initialized');
  }

  createOrganizationForUser(
    request: OrganizationCreationRequest
  ): Observable<OrganizationSetupResult> {
    console.log(
      'Creating organization for user:',
      request.userId,
      request.userType
    );

    return from(
      this.supabaseService.rpc('create_organization_for_registration', {
        p_user: request.userId,
        p_type: request.userType || 'sme',
        p_first_name: request.firstName,
        p_last_name: request.lastName,
        p_email: request.email,
        p_phone: request.phone,
        p_company_name: request.companyName,
      })
    ).pipe(
      map((result) => {
        console.log('RPC response:', {
          data: result?.data,
          isArray: Array.isArray(result?.data),
          firstItem: result?.data?.[0],
        });

        // RETURNS TABLE always gives array; take first element
        const orgData = Array.isArray(result?.data)
          ? result.data[0]
          : result?.data;

        if (!orgData?.id) {
          console.error('❌ No organization ID in response:', {
            orgData,
            fullResult: result,
          });
          throw new Error(
            'Organization creation failed: No org ID returned from server'
          );
        }

        console.log('✅ Organization created:', orgData.id);

        return {
          success: true,
          organization: this.mapDatabaseToOrganization(orgData),
          organizationUserId: request.userId,
          message: 'Organization created successfully',
        } as OrganizationSetupResult;
      }),
      catchError((error) => {
        console.error('❌ Organization creation error:', error?.message);
        return throwError(
          () => new Error(`Organization setup failed: ${error?.message}`)
        );
      })
    );
  }

  checkUserHasOrganization(userId: string): Observable<boolean> {
    return from(this.checkExistingOrganization(userId)).pipe(
      map((org) => !!org),
      catchError(() => of(false))
    );
  }

  getUserOrganization(userId: string): Observable<Organization | null> {
    return from(this.checkExistingOrganization(userId)).pipe(
      catchError((error) => {
        console.error('Error getting user organization:', error);
        return of(null);
      })
    );
  }

  ensureUserHasOrganization(
    request: OrganizationCreationRequest
  ): Observable<OrganizationSetupResult> {
    return this.checkUserHasOrganization(request.userId).pipe(
      switchMap((hasOrg) => {
        if (hasOrg) {
          return this.getUserOrganization(request.userId).pipe(
            map((org) => ({
              organization: org!,
              organizationUserId: org!.id,
              success: true,
              message: 'Organization already exists',
            }))
          );
        } else {
          return this.createOrganizationForUser(request);
        }
      })
    );
  }

  private async checkExistingOrganization(
    userId: string
  ): Promise<Organization | null> {
    try {
      const { data, error } = await this.supabaseService
        .from('organization_users')
        .select('organizations(*)')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data?.organizations) {
        return null;
      }

      return this.mapDatabaseToOrganization(data.organizations);
    } catch (error) {
      console.error('Error checking existing organization:', error);
      return null;
    }
  }

  private mapDatabaseToOrganization(dbOrg: any): Organization {
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
      createdAt: new Date(dbOrg.created_at),
      updatedAt: new Date(dbOrg.updated_at),
      version: dbOrg.version,
    };
  }
}
