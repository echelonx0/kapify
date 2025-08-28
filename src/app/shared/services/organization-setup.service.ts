// src/app/shared/services/organization-setup.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { switchMap,  catchError, map } from 'rxjs/operators';
import { SharedSupabaseService } from './shared-supabase.service';
import { Organization, OrganizationType, DEFAULT_PERMISSIONS } from '../models/user.models';
 
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
  providedIn: 'root'
})
export class OrganizationSetupService {
  private supabaseService = inject(SharedSupabaseService);

  constructor() {
    console.log('OrganizationSetupService initialized');
  }

  // ===============================
  // MAIN ORGANIZATION CREATION
  // ===============================

  createOrganizationForUser(request: OrganizationCreationRequest): Observable<OrganizationSetupResult> {
    console.log('Creating organization for user:', request.userId, request.userType);

    return from(this.performOrganizationCreation(request)).pipe(
      catchError(error => {
        console.error('Organization creation failed:', error);
        return throwError(() => new Error(`Organization setup failed: ${error.message}`));
      })
    );
  }

  private async performOrganizationCreation(request: OrganizationCreationRequest): Promise<OrganizationSetupResult> {
    // Check if user already has an organization
    const existingOrg = await this.checkExistingOrganization(request.userId);
    if (existingOrg) {
      console.log('User already has organization:', existingOrg.id);
      return {
        organization: existingOrg,
        organizationUserId: existingOrg.id, // This would need to be fetched properly
        success: true,
        message: 'Organization already exists'
      };
    }

    // Create organization based on user type
    const organizationData = this.buildOrganizationData(request);
    const organization = await this.createOrganization(organizationData);
    
    // Create organization-user relationship
    const orgUserId = await this.createOrganizationUserRelationship(
      request.userId,
      organization.id,
      request.userType
    );

    console.log('Organization setup completed successfully');
    
    return {
      organization,
      organizationUserId: orgUserId,
      success: true,
      message: 'Organization created successfully'
    };
  }

  // ===============================
  // ORGANIZATION DATA BUILDERS
  // ===============================

  private buildOrganizationData(request: OrganizationCreationRequest): Partial<Organization> {
    const baseData = {
      name: this.generateOrganizationName(request),
      description: this.generateOrganizationDescription(request),
      email: request.email,
      phone: request.phone,
      country: 'South Africa',
      status: 'active' as const,
      isVerified: false
    };

    switch (request.userType) {
      case 'sme':
        return {
          ...baseData,
          organizationType: 'sme' as OrganizationType,
          description: `SME business operated by ${request.firstName} ${request.lastName}`
        };

      case 'funder':
        return {
          ...baseData,
          organizationType: 'investment_fund' as OrganizationType,
          description: `Investment organization managed by ${request.firstName} ${request.lastName}`,
          status: 'pending_verification' as const // Funders need verification
        };

      case 'consultant':
        return {
          ...baseData,
          organizationType: 'consultant' as OrganizationType,
          description: `Consulting services provided by ${request.firstName} ${request.lastName}`
        };

      default:
        return {
          ...baseData,
          organizationType: 'general' as OrganizationType
        };
    }
  }

  private generateOrganizationName(request: OrganizationCreationRequest): string {
    // Use company name if provided
    if (request.companyName?.trim()) {
      return request.companyName.trim();
    }

    // Generate based on user type
    const fullName = `${request.firstName} ${request.lastName}`;
    
    switch (request.userType) {
      case 'sme':
        return `${fullName} Business`;
      case 'funder':
        return `${fullName} Fund`;
      case 'consultant':
        return `${fullName} Consulting`;
      default:
        return `${fullName} Organization`;
    }
  }

  private generateOrganizationDescription(request: OrganizationCreationRequest): string {
    const fullName = `${request.firstName} ${request.lastName}`;
    
    switch (request.userType) {
      case 'sme':
        return `Small to medium enterprise operated by ${fullName}`;
      case 'funder':
        return `Investment and funding organization managed by ${fullName}`;
      case 'consultant':
        return `Professional consulting services provided by ${fullName}`;
      default:
        return `Organization managed by ${fullName}`;
    }
  }

  // ===============================
  // DATABASE OPERATIONS
  // ===============================

  private async checkExistingOrganization(userId: string): Promise<Organization | null> {
    try {
      const { data, error } = await this.supabaseService
        .from('organization_users')
        .select(`
          organizations (*)
        `)
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

  private async createOrganization(orgData: Partial<Organization>): Promise<Organization> {
    try {
      const dbPayload = {
        name: orgData.name,
        description: orgData.description,
        organization_type: orgData.organizationType,
        status: orgData.status,
        website: orgData.website || null,
        email: orgData.email || null,
        phone: orgData.phone || null,
        country: orgData.country || 'South Africa',
        is_verified: orgData.isVerified || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabaseService
        .from('organizations')
        .insert(dbPayload)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create organization: ${error.message}`);
      }

      console.log('Organization created in database:', data.id);
      return this.mapDatabaseToOrganization(data);

    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  }

  private async createOrganizationUserRelationship(
    userId: string, 
    organizationId: string, 
    userType: string
  ): Promise<string> {
    try {
      // Determine role and permissions based on user type
      const role = this.getUserRole(userType);
      const permissions = this.getUserPermissions(userType, role);

      const orgUserPayload = {
        user_id: userId,
        organization_id: organizationId,
        role: role,
        permissions: permissions,
        status: 'active',
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabaseService
        .from('organization_users')
        .insert(orgUserPayload)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create organization user relationship: ${error.message}`);
      }

      console.log('Organization-user relationship created:', data.id);
      return data.id;

    } catch (error) {
      console.error('Error creating organization user relationship:', error);
      throw error;
    }
  }

  // ===============================
  // ROLE AND PERMISSION LOGIC
  // ===============================

  private getUserRole(userType: string): 'owner' | 'admin' | 'member' {
    switch (userType) {
      case 'sme':
      case 'funder':
        return 'owner'; // They own their organization
      case 'consultant':
        return 'admin'; // Admins of their consulting org
      default:
        return 'member';
    }
  }

  private getUserPermissions(userType: string, role: string) {
    // Start with default permissions for role
    let permissions = { ...DEFAULT_PERMISSIONS[role] };

    // Customize based on user type
    switch (userType) {
      case 'sme':
        permissions = {
          ...permissions,
          canCreateOpportunities: false, // SMEs apply, don't create
          canManageApplications: true,
          canViewReports: true
        };
        break;

      case 'funder':
        permissions = {
          ...permissions,
          canCreateOpportunities: true,
          canManageApplications: true,
          canManageFinances: true,
          canViewReports: true
        };
        break;

      case 'consultant':
        permissions = {
          ...permissions,
          canCreateOpportunities: false,
          canManageApplications: false,
          canViewReports: true
        };
        break;
    }

    return permissions;
  }

  // ===============================
  // DATA MAPPING
  // ===============================

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
      taxNumber: dbOrg.tax_number,
      foundedYear: dbOrg.founded_year,
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

  // ===============================
  // UTILITY METHODS
  // ===============================

  // Check if user has organization (used by other services)
  checkUserHasOrganization(userId: string): Observable<boolean> {
    return from(this.checkExistingOrganization(userId)).pipe(
      map(org => !!org),
      catchError(() => of(false))
    );
  }

  // Get user's organization (used by other services)
  getUserOrganization(userId: string): Observable<Organization | null> {
    return from(this.checkExistingOrganization(userId)).pipe(
      catchError(error => {
        console.error('Error getting user organization:', error);
        return of(null);
      })
    );
  }

  // Migrate existing user to have organization (utility method)
  ensureUserHasOrganization(request: OrganizationCreationRequest): Observable<OrganizationSetupResult> {
    return this.checkUserHasOrganization(request.userId).pipe(
      switchMap(hasOrg => {
        if (hasOrg) {
          return this.getUserOrganization(request.userId).pipe(
            map(org => ({
              organization: org!,
              organizationUserId: org!.id,
              success: true,
              message: 'Organization already exists'
            }))
          );
        } else {
          return this.createOrganizationForUser(request);
        }
      })
    );
  }

  
}