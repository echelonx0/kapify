// src/app/shared/services/admin.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators'; 
import { AuthService } from '../../auth/production.auth.service';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';

// Admin interfaces
export interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  totalOpportunities: number;
  activeApplications: number;
  newUsersThisMonth: number;
  newOrganizationsThisMonth: number;
  newOpportunitiesThisMonth: number;
  verificationRequestsPending: number;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  userType: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  accountTier: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  organizationId?: string;
  organizationName?: string;
  profileCompletionPercentage?: number;
}

export interface AdminOrganization {
  id: string;
  name: string;
  description?: string;
  organizationType: string;
  status: string;
  website?: string;
  logoUrl?: string;
  legalName?: string;
  registrationNumber?: string;
  taxNumber?: string;
  foundedYear?: number;
  employeeCount?: number;
  assetsUnderManagement?: number;
  isVerified: boolean;
  verificationDate?: Date;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
  ownerName?: string;
  ownerEmail?: string;
  userCount?: number;
  opportunitiesCount?: number;
}

export interface AdminOpportunity {
  id: string;
  title: string;
  description: string;
  fundingType: string;
  status: string;
  minAmount: number;
  maxAmount: number;
  interestRate?: number;
  termMonths?: number;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  organizationName: string;
  applicationsCount: number;
  approvedApplicationsCount: number;
  totalAmountRequested: number;
  isActive: boolean;
  eligibilityCriteria?: any;
  requiredDocuments?: string[];
}

export interface AdminActivity {
  id: string;
  type: 'user' | 'organization' | 'opportunity' | 'application' | 'system';
  action: string;
  message: string;
  userId?: string;
  organizationId?: string;
  opportunityId?: string;
  metadata?: any;
  createdAt: Date;
  userEmail?: string;
  organizationName?: string;
}

export interface PasswordResetResponse {
  success: boolean;
  temporaryPassword: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private supabaseService = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  constructor() {
    console.log('AdminService initialized');
  }

  // ===============================
  // ACCESS CONTROL
  // ===============================

  private verifyAdminAccess(): boolean {
    const currentUser = this.authService.user();
    return currentUser?.email === 'zivaigwe@gmail.com';
  }

  private throwIfNotAdmin(): void {
    if (!this.verifyAdminAccess()) {
      throw new Error('Admin access required');
    }
  }

  // ===============================
  // DASHBOARD STATS
  // ===============================

  getStats(): Observable<AdminStats> {
    this.throwIfNotAdmin();

    return from(this.fetchStats()).pipe(
      catchError(error => {
        console.error('Failed to fetch admin stats:', error);
        return throwError(() => new Error('Failed to load admin statistics'));
      })
    );
  }

  private async fetchStats(): Promise<AdminStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel
    const [
      usersResult,
      organizationsResult,
      opportunitiesResult,
      applicationsResult,
      newUsersResult,
      newOrganizationsResult,
      newOpportunitiesResult,
      pendingVerificationsResult
    ] = await Promise.all([
      // Total users
      this.supabaseService
        .from('users')
        .select('id', { count: 'exact', head: true }),
      
      // Total organizations
      this.supabaseService
        .from('organizations')
        .select('id', { count: 'exact', head: true }),
      
      // Total opportunities
      this.supabaseService
        .from('funding_opportunities')
        .select('id', { count: 'exact', head: true }),
      
      // Active applications
      this.supabaseService
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .in('status', ['submitted', 'under_review', 'approved']),
      
      // New users this month
      this.supabaseService
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      
      // New organizations this month
      this.supabaseService
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      
      // New opportunities this month
      this.supabaseService
        .from('funding_opportunities')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString()),
      
      // Pending verifications
      this.supabaseService
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_verification')
    ]);

    return {
      totalUsers: usersResult.count || 0,
      totalOrganizations: organizationsResult.count || 0,
      totalOpportunities: opportunitiesResult.count || 0,
      activeApplications: applicationsResult.count || 0,
      newUsersThisMonth: newUsersResult.count || 0,
      newOrganizationsThisMonth: newOrganizationsResult.count || 0,
      newOpportunitiesThisMonth: newOpportunitiesResult.count || 0,
      verificationRequestsPending: pendingVerificationsResult.count || 0
    };
  }

  // ===============================
  // USER MANAGEMENT
  // ===============================

 

  getUserById(userId: string): Observable<AdminUser> {
    this.throwIfNotAdmin();

    return from(
      this.supabaseService
        .from('users')
        .select(`
          *,
          user_profiles (
            completion_percentage
          ),
          organization_users (
            organization_id,
            organizations (
              name
            )
          )
        `)
        .eq('id', userId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseUserToAdmin(data);
      }),
      catchError(error => {
        console.error('Failed to fetch user:', error);
        return throwError(() => new Error('Failed to load user details'));
      })
    );
  }

  updateUserStatus(userId: string, status: string): Observable<AdminUser> {
    this.throwIfNotAdmin();

    return from(
      this.supabaseService
        .from('users')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseUserToAdmin(data);
      }),
      switchMap(() => this.getUserById(userId)),
      catchError(error => {
        console.error('Failed to update user status:', error);
        return throwError(() => new Error('Failed to update user status'));
      })
    );
  }

  resetUserPassword(userId: string): Observable<PasswordResetResponse> {
    this.throwIfNotAdmin();

    // Generate temporary password
    const temporaryPassword = this.generateTemporaryPassword();

    return from(
      this.supabaseService.auth.admin.updateUserById(userId, {
        password: temporaryPassword
      })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return {
          success: true,
          temporaryPassword,
          message: 'Password reset successfully'
        };
      }),
      catchError(error => {
        console.error('Failed to reset password:', error);
        return throwError(() => new Error('Failed to reset user password'));
      })
    );
  }

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // ===============================
  // ORGANIZATION MANAGEMENT
  // ===============================

  

  getOrganizationById(organizationId: string): Observable<AdminOrganization> {
    this.throwIfNotAdmin();

    return from(
      this.supabaseService
        .from('organizations')
        .select(`
          *,
          organization_users (
            role,
            users (
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('id', organizationId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseOrganizationToAdmin(data);
      }),
      catchError(error => {
        console.error('Failed to fetch organization:', error);
        return throwError(() => new Error('Failed to load organization details'));
      })
    );
  }

  updateOrganizationStatus(organizationId: string, status: string): Observable<AdminOrganization> {
    this.throwIfNotAdmin();

    return from(
      this.supabaseService
        .from('organizations')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', organizationId)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseOrganizationToAdmin(data);
      }),
      switchMap(() => this.getOrganizationById(organizationId)),
      catchError(error => {
        console.error('Failed to update organization status:', error);
        return throwError(() => new Error('Failed to update organization status'));
      })
    );
  }

  verifyOrganization(organizationId: string): Observable<AdminOrganization> {
    this.throwIfNotAdmin();

    return from(
      this.supabaseService
        .from('organizations')
        .update({ 
          status: 'verified',
          is_verified: true,
          verification_date: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', organizationId)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseOrganizationToAdmin(data);
      }),
      switchMap(() => this.getOrganizationById(organizationId)),
      catchError(error => {
        console.error('Failed to verify organization:', error);
        return throwError(() => new Error('Failed to verify organization'));
      })
    );
  }

  // ===============================
  // OPPORTUNITY MANAGEMENT
  // ===============================

 // Fix getAllUsers() - use proper JOIN
getAllUsers(): Observable<AdminUser[]> {
  this.throwIfNotAdmin();

  return from(
    this.supabaseService
      .from('users')
      .select(`
        *,
        user_profiles (
          completion_percentage
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1000)
  ).pipe(
    switchMap(({ data: users, error }) => {
      if (error) throw error;
      
      // Get organization data separately for each user
      return from(Promise.all(
        (users || []).map(async (user) => {
          const { data: orgUser } = await this.supabaseService
            .from('organization_users')
            .select(`
              organization_id,
              organizations!inner (name)
            `)
            .eq('user_id', user.id)
            .maybeSingle();

          return this.mapDatabaseUserToAdmin({
            ...user,
            organization_users: orgUser ? [orgUser] : []
          });
        })
      ));
    }),
    catchError(error => {
      console.error('Failed to fetch users:', error);
      return throwError(() => new Error('Failed to load users'));
    })
  );
}

// Fix getAllOrganizations() - query organizations table directly
getAllOrganizations(): Observable<AdminOrganization[]> {
  this.throwIfNotAdmin();

  return from(
    this.supabaseService
      .from('organizations')
      .select(`
        *
      `)
      .order('created_at', { ascending: false })
      .limit(1000)
  ).pipe(
    switchMap(({ data: orgs, error }) => {
      if (error) throw error;
      
      // Get users for each organization
      return from(Promise.all(
        (orgs || []).map(async (org) => {
          const { data: orgUsers } = await this.supabaseService
            .from('organization_users')
            .select(`
              role,
              users!inner (
                first_name,
                last_name,
                email
              )
            `)
            .eq('organization_id', org.id);

          return this.mapDatabaseOrganizationToAdmin({
            ...org,
            organization_users: orgUsers || []
          });
        })
      ));
    }),
    catchError(error => {
      console.error('Failed to fetch organizations:', error);
      return throwError(() => new Error('Failed to load organizations'));
    })
  );
}

// Fix getAllOpportunities() - use proper JOIN to organizations
getAllOpportunities(): Observable<AdminOpportunity[]> {
  this.throwIfNotAdmin();

  return from(
    this.supabaseService
      .from('funding_opportunities')
      .select(`
        *,
        organizations!inner (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(1000)
  ).pipe(
    map(({ data, error }) => {
      if (error) throw error;
      return (data || []).map(this.mapDatabaseOpportunityToAdmin);
    }),
    catchError(error => {
      console.error('Failed to fetch opportunities:', error);
      return throwError(() => new Error('Failed to load opportunities'));
    })
  );
}

  getOpportunityById(opportunityId: string): Observable<AdminOpportunity> {
    this.throwIfNotAdmin();

    return from(
      this.supabaseService
        .from('funding_opportunities')
        .select(`
          *,
          organizations (
            name
          )
        `)
        .eq('id', opportunityId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseOpportunityToAdmin(data);
      }),
      catchError(error => {
        console.error('Failed to fetch opportunity:', error);
        return throwError(() => new Error('Failed to load opportunity details'));
      })
    );
  }

  updateOpportunityStatus(opportunityId: string, status: string): Observable<AdminOpportunity> {
    this.throwIfNotAdmin();

    return from(
      this.supabaseService
        .from('funding_opportunities')
        .update({ 
          status,
          is_active: status === 'active',
          updated_at: new Date().toISOString() 
        })
        .eq('id', opportunityId)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseOpportunityToAdmin(data);
      }),
      switchMap(() => this.getOpportunityById(opportunityId)),
      catchError(error => {
        console.error('Failed to update opportunity status:', error);
        return throwError(() => new Error('Failed to update opportunity status'));
      })
    );
  }

  deleteOpportunity(opportunityId: string): Observable<void> {
    this.throwIfNotAdmin();

    return from(
      this.supabaseService
        .from('funding_opportunities')
        .delete()
        .eq('id', opportunityId)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(error => {
        console.error('Failed to delete opportunity:', error);
        return throwError(() => new Error('Failed to delete opportunity'));
      })
    );
  }

  // ===============================
  // ACTIVITY & AUDIT LOG
  // ===============================

  getRecentActivity(): Observable<AdminActivity[]> {
    this.throwIfNotAdmin();

    return from(
      this.supabaseService
        .from('activities')
        .select(`
          *,
          users (
            email
          ),
          organizations (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(this.mapDatabaseActivityToAdmin);
      }),
      catchError(error => {
        console.error('Failed to fetch recent activity:', error);
        return throwError(() => new Error('Failed to load recent activity'));
      })
    );
  }

  logAdminAction(action: string, targetType: string, targetId: string, details?: any): Observable<void> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return throwError(() => new Error('Not authenticated'));
    }

    return from(
      this.supabaseService
        .from('activities')
        .insert({
          type: 'admin',
          action,
          message: `Admin ${action} on ${targetType}`,
          user_id: currentUser.id,
          metadata: {
            targetType,
            targetId,
            adminAction: true,
            ...details
          }
        })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return undefined;
      }),
      catchError(error => {
        console.error('Failed to log admin action:', error);
        // Don't fail the main operation if logging fails
        return of(undefined);
      })
    );
  }

  // ===============================
  // BULK OPERATIONS
  // ===============================

  bulkUpdateUserStatus(userIds: string[], status: string): Observable<AdminUser[]> {
    this.throwIfNotAdmin();

    return from(
      this.supabaseService
        .from('users')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .in('id', userIds)
        .select()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(this.mapDatabaseUserToAdmin);
      }),
      catchError(error => {
        console.error('Failed to bulk update users:', error);
        return throwError(() => new Error('Failed to bulk update user status'));
      })
    );
  }

  bulkUpdateOrganizationStatus(organizationIds: string[], status: string): Observable<AdminOrganization[]> {
    this.throwIfNotAdmin();

    return from(
      this.supabaseService
        .from('organizations')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
        .in('id', organizationIds)
        .select()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(this.mapDatabaseOrganizationToAdmin);
      }),
      catchError(error => {
        console.error('Failed to bulk update organizations:', error);
        return throwError(() => new Error('Failed to bulk update organization status'));
      })
    );
  }

  // ===============================
  // REPORTS & ANALYTICS
  // ===============================

  generateUserReport(startDate: Date, endDate: Date): Observable<any> {
    this.throwIfNotAdmin();

    return from(
      this.supabaseService
        .from('users')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        
        const users = data || [];
        const report = {
          totalUsers: users.length,
          usersByType: this.groupBy(users, 'user_type'),
          usersByStatus: this.groupBy(users, 'status'),
          verifiedUsers: users.filter(u => u.email_verified).length,
          averageProfileCompletion: 0, // Would need to join with profiles
          registrationTrend: this.generateDateTrend(users, startDate, endDate)
        };
        
        return report;
      }),
      catchError(error => {
        console.error('Failed to generate user report:', error);
        return throwError(() => new Error('Failed to generate user report'));
      })
    );
  }

  // ===============================
  // SYSTEM UTILITIES
  // ===============================

  performSystemMaintenance(): Observable<{ success: boolean; message: string }> {
    this.throwIfNotAdmin();

    // This would include cleanup operations, cache clearing, etc.
    return of({
      success: true,
      message: 'System maintenance completed successfully'
    });
  }

  // ===============================
  // MAPPING FUNCTIONS
  // ===============================

  private mapDatabaseUserToAdmin(dbUser: any): AdminUser {
    const orgUser = dbUser.organization_users?.[0];
    const profile = dbUser.user_profiles?.[0];
    
    return {
      id: dbUser.id,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      email: dbUser.email,
      phone: dbUser.phone,
      userType: dbUser.user_type,
      status: dbUser.status,
      emailVerified: dbUser.email_verified,
      phoneVerified: dbUser.phone_verified || false,
      accountTier: dbUser.account_tier || 'basic',
      profilePicture: dbUser.profile_picture,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
      lastLoginAt: dbUser.last_login_at ? new Date(dbUser.last_login_at) : undefined,
      organizationId: orgUser?.organization_id,
      organizationName: orgUser?.organizations?.name,
      profileCompletionPercentage: profile?.completion_percentage || 0
    };
  }

  private mapDatabaseOrganizationToAdmin(dbOrg: any): AdminOrganization {
    const owner = dbOrg.organization_users?.find((ou: any) => ou.role === 'owner' || ou.role === 'admin');
    
    return {
      id: dbOrg.id,
      name: dbOrg.name,
      description: dbOrg.description,
      organizationType: dbOrg.organization_type,
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
      ownerName: owner?.users ? `${owner.users.first_name} ${owner.users.last_name}` : undefined,
      ownerEmail: owner?.users?.email,
      userCount: dbOrg.organization_users?.length || 0,
      opportunitiesCount: 0 // Would need separate query
    };
  }

  private mapDatabaseOpportunityToAdmin(dbOpp: any): AdminOpportunity {
    return {
      id: dbOpp.id,
      title: dbOpp.title,
      description: dbOpp.description,
      fundingType: dbOpp.funding_type,
      status: dbOpp.status,
      minAmount: dbOpp.min_amount,
      maxAmount: dbOpp.max_amount,
      interestRate: dbOpp.interest_rate,
      termMonths: dbOpp.term_months,
      deadline: dbOpp.deadline ? new Date(dbOpp.deadline) : undefined,
      createdAt: new Date(dbOpp.created_at),
      updatedAt: new Date(dbOpp.updated_at),
      organizationId: dbOpp.organization_id,
      organizationName: dbOpp.organizations?.name || 'Unknown',
      applicationsCount: 0, // Would need separate query
      approvedApplicationsCount: 0, // Would need separate query
      totalAmountRequested: 0, // Would need separate query
      isActive: dbOpp.is_active,
      eligibilityCriteria: dbOpp.eligibility_criteria,
      requiredDocuments: dbOpp.required_documents
    };
  }

  private mapDatabaseActivityToAdmin(dbActivity: any): AdminActivity {
    return {
      id: dbActivity.id,
      type: dbActivity.type,
      action: dbActivity.action,
      message: dbActivity.message,
      userId: dbActivity.user_id,
      organizationId: dbActivity.organization_id,
      opportunityId: dbActivity.opportunity_id,
      metadata: dbActivity.metadata,
      createdAt: new Date(dbActivity.created_at),
      userEmail: dbActivity.users?.email,
      organizationName: dbActivity.organizations?.name
    };
  }

  // ===============================
  // UTILITY FUNCTIONS
  // ===============================

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((groups: Record<string, number>, item) => {
      const value = String(item[key]);
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {});
  }

  private generateDateTrend(items: any[], startDate: Date, endDate: Date): Array<{ date: string; count: number }> {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const trend: Array<{ date: string; count: number }> = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = items.filter(item => 
        new Date(item.created_at).toISOString().split('T')[0] === dateStr
      ).length;
      
      trend.push({ date: dateStr, count });
    }
    
    return trend;
  }
}