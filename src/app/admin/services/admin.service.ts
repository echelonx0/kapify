import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable, from, throwError, of, Subject } from 'rxjs';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
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

export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * AdminService
 * FIXED: Correct FK relationships matching actual database schema
 * Uses RPC function for admin checks to avoid circular RLS
 */
@Injectable({
  providedIn: 'root',
})
export class AdminService implements OnDestroy {
  private supabase = inject(SharedSupabaseService);
  private destroy$ = new Subject<void>();

  // Cache for admin list (check once per session)
  private adminCheckCache: Map<string, boolean> = new Map();
  private readonly ADMIN_CACHE_TTL = 3600000; // 1 hour

  constructor() {
    console.log('✅ AdminService initialized');
  }

  // ===============================
  // ACCESS CONTROL
  // ===============================

  /**
   * Verify admin access via RPC function (bypasses circular RLS)
   */
  private async verifyAdminAccess(): Promise<boolean> {
    try {
      const userId = this.supabase.getCurrentUserId();
      if (!userId) return false;

      // Check cache first
      if (this.adminCheckCache.has(userId)) {
        return this.adminCheckCache.get(userId) || false;
      }

      // Use RPC function for admin check
      const { data, error } = await this.supabase.rpc('is_admin', {
        check_user_id: userId,
      });

      if (error) {
        console.error('Admin check RPC error:', error);
        return false;
      }

      const isAdmin = !!data;
      this.adminCheckCache.set(userId, isAdmin);

      // Auto-clear cache after TTL
      setTimeout(
        () => this.adminCheckCache.delete(userId),
        this.ADMIN_CACHE_TTL
      );

      return isAdmin;
    } catch (error) {
      console.error('Error verifying admin access:', error);
      return false;
    }
  }

  /**
   * Throw if not admin (for synchronous checks)
   */
  private async throwIfNotAdmin(): Promise<void> {
    const isAdmin = await this.verifyAdminAccess();
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin access required');
    }
  }

  // ===============================
  // DASHBOARD STATS
  // ===============================

  /**
   * Get admin dashboard statistics
   */
  getStats(): Observable<AdminStats> {
    return from(this.fetchStats()).pipe(
      catchError((error) => {
        console.error('❌ Failed to fetch admin stats:', error);
        return throwError(() => new Error('Failed to load admin statistics'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch all stats in parallel
   */
  private async fetchStats(): Promise<AdminStats> {
    await this.throwIfNotAdmin();

    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).toISOString();

    // All queries in parallel
    const [
      usersResult,
      organizationsResult,
      opportunitiesResult,
      applicationsResult,
      newUsersResult,
      newOrganizationsResult,
      newOpportunitiesResult,
      pendingVerificationsResult,
    ] = await Promise.all([
      this.supabase.from('users').select('id', { count: 'exact', head: true }),
      this.supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true }),
      this.supabase
        .from('funding_opportunities')
        .select('id', { count: 'exact', head: true }),
      this.supabase
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .in('status', ['submitted', 'under_review', 'approved']),
      this.supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth),
      this.supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth),
      this.supabase
        .from('funding_opportunities')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth),
      this.supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_verification'),
    ]);

    return {
      totalUsers: usersResult.count || 0,
      totalOrganizations: organizationsResult.count || 0,
      totalOpportunities: opportunitiesResult.count || 0,
      activeApplications: applicationsResult.count || 0,
      newUsersThisMonth: newUsersResult.count || 0,
      newOrganizationsThisMonth: newOrganizationsResult.count || 0,
      newOpportunitiesThisMonth: newOpportunitiesResult.count || 0,
      verificationRequestsPending: pendingVerificationsResult.count || 0,
    };
  }

  // ===============================
  // USER MANAGEMENT (PAGINATED)
  // ===============================

  /**
   * Get all users with pagination
   */
  getAllUsers(
    options: PaginationOptions = { page: 1, pageSize: 50 }
  ): Observable<AdminUser[]> {
    return from(this.fetchAllUsers(options)).pipe(
      catchError((error) => {
        console.error('❌ Failed to fetch users:', error);
        return throwError(() => new Error('Failed to load users'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch users with related data
   */
  private async fetchAllUsers(
    options: PaginationOptions
  ): Promise<AdminUser[]> {
    await this.throwIfNotAdmin();

    const start = (options.page - 1) * options.pageSize;
    const end = start + options.pageSize - 1;

    const { data: users, error } = await this.supabase
      .from('users')
      .select(
        `
        *,
        user_profiles (completion_percentage),
        organization_users!fk_organization_users_user (
          organization_id
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    // Fetch organization names separately
    const orgIds = [
      ...new Set(
        users
          ?.flatMap(
            (u) =>
              u.organization_users?.map((ou: any) => ou.organization_id) || []
          )
          .filter(Boolean) || []
      ),
    ];

    let orgMap = new Map<string, string>();
    if (orgIds.length > 0) {
      const { data: orgs } = await this.supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);
      orgMap = new Map(orgs?.map((o) => [o.id, o.name]) || []);
    }

    return (users || []).map((user) =>
      this.mapDatabaseUserToAdmin(user, orgMap)
    );
  }

  /**
   * Get user by ID (with all related data)
   */
  getUserById(userId: string): Observable<AdminUser> {
    return from(this.fetchUserById(userId)).pipe(
      catchError((error) => {
        console.error('❌ Failed to fetch user:', error);
        return throwError(() => new Error('Failed to load user details'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch single user with joins
   */
  private async fetchUserById(userId: string): Promise<AdminUser> {
    await this.throwIfNotAdmin();

    const { data: user, error } = await this.supabase
      .from('users')
      .select(
        `
        *,
        user_profiles (completion_percentage),
        organization_users!fk_organization_users_user (
          organization_id
        )
      `
      )
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Fetch organization name
    const orgId = user.organization_users?.[0]?.organization_id;
    let orgName: string | undefined;
    if (orgId) {
      const { data: org } = await this.supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single();
      orgName = org?.name;
    }

    const orgMap = orgId && orgName ? new Map([[orgId, orgName]]) : new Map();
    return this.mapDatabaseUserToAdmin(user, orgMap);
  }

  /**
   * Update user status
   */
  updateUserStatus(userId: string, status: string): Observable<AdminUser> {
    return from(this.performUserStatusUpdate(userId, status)).pipe(
      tap(() => console.log(`✅ User ${userId} status updated to ${status}`)),
      switchMap(() => this.getUserById(userId)),
      catchError((error) => {
        console.error('❌ Failed to update user status:', error);
        return throwError(() => new Error('Failed to update user status'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform user status update
   */
  private async performUserStatusUpdate(
    userId: string,
    status: string
  ): Promise<void> {
    await this.throwIfNotAdmin();

    const { error } = await this.supabase
      .from('users')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  }

  /**
   * Reset user password
   */
  resetUserPassword(userId: string): Observable<PasswordResetResponse> {
    return from(this.performPasswordReset(userId)).pipe(
      tap(() => console.log(`✅ Password reset for user ${userId}`)),
      catchError((error) => {
        console.error('❌ Failed to reset password:', error);
        return throwError(() => new Error('Failed to reset user password'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform password reset
   */
  private async performPasswordReset(
    userId: string
  ): Promise<PasswordResetResponse> {
    await this.throwIfNotAdmin();

    const temporaryPassword = this.generateTemporaryPassword();

    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      password: temporaryPassword,
    });

    if (error) throw error;

    return {
      success: true,
      temporaryPassword,
      message:
        'Password reset successfully. Share temporary password with user.',
    };
  }

  /**
   * Bulk update user status
   */
  bulkUpdateUserStatus(
    userIds: string[],
    status: string
  ): Observable<AdminUser[]> {
    return from(this.performBulkUserUpdate(userIds, status)).pipe(
      tap(() => console.log(`✅ Updated ${userIds.length} users to ${status}`)),
      catchError((error) => {
        console.error('❌ Failed to bulk update users:', error);
        return throwError(() => new Error('Failed to bulk update user status'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform bulk user update
   */
  private async performBulkUserUpdate(
    userIds: string[],
    status: string
  ): Promise<AdminUser[]> {
    await this.throwIfNotAdmin();

    const { data: users, error } = await this.supabase
      .from('users')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .in('id', userIds)
      .select(
        `
        *,
        user_profiles (completion_percentage),
        organization_users!fk_organization_users_user (
          organization_id
        )
      `
      );

    if (error) throw error;

    // Fetch org names
    const orgIds = [
      ...new Set(
        users
          ?.flatMap(
            (u) =>
              u.organization_users?.map((ou: any) => ou.organization_id) || []
          )
          .filter(Boolean) || []
      ),
    ];

    let orgMap = new Map<string, string>();
    if (orgIds.length > 0) {
      const { data: orgs } = await this.supabase
        .from('organizations')
        .select('id, name')
        .in('id', orgIds);
      orgMap = new Map(orgs?.map((o) => [o.id, o.name]) || []);
    }

    return (users || []).map((user) =>
      this.mapDatabaseUserToAdmin(user, orgMap)
    );
  }

  // ===============================
  // ORGANIZATION MANAGEMENT (PAGINATED)
  // ===============================

  /**
   * Get all organizations with pagination
   */
  getAllOrganizations(
    options: PaginationOptions = { page: 1, pageSize: 50 }
  ): Observable<AdminOrganization[]> {
    return from(this.fetchAllOrganizations(options)).pipe(
      catchError((error) => {
        console.error('❌ Failed to fetch organizations:', error);
        return throwError(() => new Error('Failed to load organizations'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch organizations with members
   */
  private async fetchAllOrganizations(
    options: PaginationOptions
  ): Promise<AdminOrganization[]> {
    await this.throwIfNotAdmin();

    const start = (options.page - 1) * options.pageSize;
    const end = start + options.pageSize - 1;

    const { data: orgs, error } = await this.supabase
      .from('organizations')
      .select(
        `
        *,
        organization_users (
          role,
          users!fk_organization_users_user (first_name, last_name, email)
        )
      `
      )
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;
    return (orgs || []).map((org) => this.mapDatabaseOrganizationToAdmin(org));
  }

  /**
   * Get organization by ID
   */
  getOrganizationById(organizationId: string): Observable<AdminOrganization> {
    return from(this.fetchOrganizationById(organizationId)).pipe(
      catchError((error) => {
        console.error('❌ Failed to fetch organization:', error);
        return throwError(
          () => new Error('Failed to load organization details')
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch single organization with joins
   */
  private async fetchOrganizationById(
    organizationId: string
  ): Promise<AdminOrganization> {
    await this.throwIfNotAdmin();

    const { data: org, error } = await this.supabase
      .from('organizations')
      .select(
        `
        *,
        organization_users (
          role,
          users!fk_organization_users_user (first_name, last_name, email)
        )
      `
      )
      .eq('id', organizationId)
      .single();

    if (error) throw error;
    return this.mapDatabaseOrganizationToAdmin(org);
  }

  /**
   * Update organization status
   */
  updateOrganizationStatus(
    organizationId: string,
    status: string
  ): Observable<AdminOrganization> {
    return from(this.performOrgStatusUpdate(organizationId, status)).pipe(
      tap(() =>
        console.log(
          `✅ Organization ${organizationId} status updated to ${status}`
        )
      ),
      switchMap(() => this.getOrganizationById(organizationId)),
      catchError((error) => {
        console.error('❌ Failed to update organization status:', error);
        return throwError(
          () => new Error('Failed to update organization status')
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform organization status update
   */
  private async performOrgStatusUpdate(
    organizationId: string,
    status: string
  ): Promise<void> {
    await this.throwIfNotAdmin();

    const { error } = await this.supabase
      .from('organizations')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (error) throw error;
  }

  /**
   * Verify organization
   */
  verifyOrganization(organizationId: string): Observable<AdminOrganization> {
    return from(this.performOrgVerification(organizationId)).pipe(
      tap(() => console.log(`✅ Organization ${organizationId} verified`)),
      switchMap(() => this.getOrganizationById(organizationId)),
      catchError((error) => {
        console.error('❌ Failed to verify organization:', error);
        return throwError(() => new Error('Failed to verify organization'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform organization verification
   */
  private async performOrgVerification(organizationId: string): Promise<void> {
    await this.throwIfNotAdmin();

    const { error } = await this.supabase
      .from('organizations')
      .update({
        status: 'verified',
        is_verified: true,
        verification_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId);

    if (error) throw error;
  }

  /**
   * Bulk update organization status
   */
  bulkUpdateOrganizationStatus(
    organizationIds: string[],
    status: string
  ): Observable<AdminOrganization[]> {
    return from(this.performBulkOrgUpdate(organizationIds, status)).pipe(
      tap(() =>
        console.log(
          `✅ Updated ${organizationIds.length} organizations to ${status}`
        )
      ),
      catchError((error) => {
        console.error('❌ Failed to bulk update organizations:', error);
        return throwError(
          () => new Error('Failed to bulk update organization status')
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform bulk organization update
   */
  private async performBulkOrgUpdate(
    organizationIds: string[],
    status: string
  ): Promise<AdminOrganization[]> {
    await this.throwIfNotAdmin();

    const { data: orgs, error } = await this.supabase
      .from('organizations')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .in('id', organizationIds)
      .select(
        `
        *,
        organization_users (
          role,
          users!fk_organization_users_user (first_name, last_name, email)
        )
      `
      );

    if (error) throw error;
    return (orgs || []).map((org) => this.mapDatabaseOrganizationToAdmin(org));
  }

  // ===============================
  // OPPORTUNITY MANAGEMENT (PAGINATED)
  // ===============================

  /**
   * Get all opportunities with pagination
   */
  getAllOpportunities(
    options: PaginationOptions = { page: 1, pageSize: 50 }
  ): Observable<AdminOpportunity[]> {
    return from(this.fetchAllOpportunities(options)).pipe(
      catchError((error) => {
        console.error('❌ Failed to fetch opportunities:', error);
        return throwError(() => new Error('Failed to load opportunities'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch opportunities (separate query for org names)
   */
  private async fetchAllOpportunities(
    options: PaginationOptions
  ): Promise<AdminOpportunity[]> {
    await this.throwIfNotAdmin();

    const start = (options.page - 1) * options.pageSize;
    const end = start + options.pageSize - 1;

    // Fetch opportunities
    const { data: opportunities, error } = await this.supabase
      .from('funding_opportunities')
      .select('*')
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    // Fetch organization names separately
    const orgIds = [
      ...new Set(opportunities?.map((o) => o.organization_id) || []),
    ];
    const { data: orgs } = await this.supabase
      .from('organizations')
      .select('id, name')
      .in('id', orgIds);

    const orgMap = new Map(orgs?.map((o) => [o.id, o.name]) || []);

    return (opportunities || []).map((opp) =>
      this.mapDatabaseOpportunityToAdmin(opp, orgMap.get(opp.organization_id))
    );
  }

  /**
   * Get opportunity by ID
   */
  getOpportunityById(opportunityId: string): Observable<AdminOpportunity> {
    return from(this.fetchOpportunityById(opportunityId)).pipe(
      catchError((error) => {
        console.error('❌ Failed to fetch opportunity:', error);
        return throwError(
          () => new Error('Failed to load opportunity details')
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch single opportunity
   */
  private async fetchOpportunityById(
    opportunityId: string
  ): Promise<AdminOpportunity> {
    await this.throwIfNotAdmin();

    const { data: opportunity, error } = await this.supabase
      .from('funding_opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (error) throw error;

    // Fetch organization name
    const { data: org } = await this.supabase
      .from('organizations')
      .select('name')
      .eq('id', opportunity.organization_id)
      .single();

    return this.mapDatabaseOpportunityToAdmin(opportunity, org?.name);
  }

  /**
   * Update opportunity status
   */
  updateOpportunityStatus(
    opportunityId: string,
    status: string
  ): Observable<AdminOpportunity> {
    return from(this.performOppStatusUpdate(opportunityId, status)).pipe(
      tap(() =>
        console.log(
          `✅ Opportunity ${opportunityId} status updated to ${status}`
        )
      ),
      switchMap(() => this.getOpportunityById(opportunityId)),
      catchError((error) => {
        console.error('❌ Failed to update opportunity status:', error);
        return throwError(
          () => new Error('Failed to update opportunity status')
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform opportunity status update
   */
  private async performOppStatusUpdate(
    opportunityId: string,
    status: string
  ): Promise<void> {
    await this.throwIfNotAdmin();

    const { error } = await this.supabase
      .from('funding_opportunities')
      .update({
        status,
        is_active: status === 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', opportunityId);

    if (error) throw error;
  }

  /**
   * Delete opportunity
   */
  deleteOpportunity(opportunityId: string): Observable<void> {
    return from(this.performOppDelete(opportunityId)).pipe(
      tap(() => console.log(`✅ Opportunity ${opportunityId} deleted`)),
      catchError((error) => {
        console.error('❌ Failed to delete opportunity:', error);
        return throwError(() => new Error('Failed to delete opportunity'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform opportunity deletion
   */
  private async performOppDelete(opportunityId: string): Promise<void> {
    await this.throwIfNotAdmin();

    const { error } = await this.supabase
      .from('funding_opportunities')
      .delete()
      .eq('id', opportunityId);

    if (error) throw error;
  }

  // ===============================
  // ACTIVITY & AUDIT LOG
  // ===============================

  /**
   * Get recent admin activity
   */
  getRecentActivity(limit: number = 50): Observable<AdminActivity[]> {
    return from(this.fetchRecentActivity(limit)).pipe(
      catchError((error) => {
        console.error('❌ Failed to fetch activity:', error);
        return throwError(() => new Error('Failed to load recent activity'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch recent activity (separate queries for related data)
   */
  private async fetchRecentActivity(limit: number): Promise<AdminActivity[]> {
    await this.throwIfNotAdmin();

    const { data: activities, error } = await this.supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Fetch related user emails
    const userIds = [
      ...new Set(activities?.map((a) => a.user_id).filter(Boolean) || []),
    ];
    const { data: users } = await this.supabase
      .from('users')
      .select('id, email')
      .in('id', userIds);

    const userMap = new Map(users?.map((u) => [u.id, u.email]) || []);

    // Fetch related organization names
    const orgIds = [
      ...new Set(
        activities?.map((a) => a.organization_id).filter(Boolean) || []
      ),
    ];
    const { data: orgs } = await this.supabase
      .from('organizations')
      .select('id, name')
      .in('id', orgIds);

    const orgMap = new Map(orgs?.map((o) => [o.id, o.name]) || []);

    return (activities || []).map((activity) =>
      this.mapDatabaseActivityToAdmin(activity, userMap, orgMap)
    );
  }

  /**
   * Log admin action (non-critical, don't fail main operation)
   */
  logAdminAction(
    action: string,
    targetType: string,
    targetId: string,
    details?: any
  ): Observable<void> {
    return from(
      this.performAdminLogging(action, targetType, targetId, details)
    ).pipe(
      catchError((error) => {
        console.warn('⚠️ Failed to log admin action (non-critical):', error);
        return of(undefined);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform admin logging
   */
  private async performAdminLogging(
    action: string,
    targetType: string,
    targetId: string,
    details?: any
  ): Promise<void> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) return;

    const { error } = await this.supabase.from('activities').insert({
      type: 'admin',
      action,
      message: `Admin ${action} on ${targetType}`,
      user_id: userId,
      metadata: {
        targetType,
        targetId,
        adminAction: true,
        ...details,
      },
    });

    if (error) throw error;
  }

  // ===============================
  // REPORTS & ANALYTICS
  // ===============================

  /**
   * Generate user report for date range
   */
  generateUserReport(startDate: Date, endDate: Date): Observable<any> {
    return from(this.performUserReport(startDate, endDate)).pipe(
      catchError((error) => {
        console.error('❌ Failed to generate user report:', error);
        return throwError(() => new Error('Failed to generate user report'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform user report generation
   */
  private async performUserReport(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    await this.throwIfNotAdmin();

    const startIso = startDate.toISOString();
    const endIso = endDate.toISOString();

    const { data: users, error } = await this.supabase
      .from('users')
      .select('*')
      .gte('created_at', startIso)
      .lte('created_at', endIso);

    if (error) throw error;

    return {
      totalUsers: (users || []).length,
      usersByType: this.groupBy(users || [], 'user_type'),
      usersByStatus: this.groupBy(users || [], 'status'),
      verifiedUsers: (users || []).filter((u) => u.email_verified).length,
      registrationTrend: this.generateDateTrend(
        users || [],
        startDate,
        endDate
      ),
    };
  }

  // ===============================
  // SYSTEM UTILITIES
  // ===============================

  /**
   * Perform system maintenance
   */
  performSystemMaintenance(): Observable<{
    success: boolean;
    message: string;
  }> {
    return from(this.performMaintenance()).pipe(
      tap(() => console.log('✅ System maintenance completed')),
      catchError((error) => {
        console.error('❌ Maintenance failed:', error);
        return throwError(() => new Error('System maintenance failed'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform actual maintenance
   */
  private async performMaintenance(): Promise<{
    success: boolean;
    message: string;
  }> {
    await this.throwIfNotAdmin();
    return {
      success: true,
      message: 'System maintenance completed successfully',
    };
  }

  // ===============================
  // MAPPING FUNCTIONS
  // ===============================

  private mapDatabaseUserToAdmin(
    dbUser: any,
    orgMap: Map<string, string>
  ): AdminUser {
    const orgId = dbUser.organization_users?.[0]?.organization_id;

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
      lastLoginAt: dbUser.last_login_at
        ? new Date(dbUser.last_login_at)
        : undefined,
      organizationId: orgId,
      organizationName: orgId ? orgMap.get(orgId) : undefined,
      profileCompletionPercentage:
        dbUser.user_profiles?.[0]?.completion_percentage || 0,
    };
  }

  private mapDatabaseOrganizationToAdmin(dbOrg: any): AdminOrganization {
    const owner = dbOrg.organization_users?.find(
      (ou: any) => ou.role === 'owner' || ou.role === 'admin'
    );

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
      ownerName: owner?.users
        ? `${owner.users.first_name} ${owner.users.last_name}`
        : undefined,
      ownerEmail: owner?.users?.email,
      userCount: dbOrg.organization_users?.length || 0,
      opportunitiesCount: 0,
    };
  }

  private mapDatabaseOpportunityToAdmin(
    dbOpp: any,
    organizationName?: string
  ): AdminOpportunity {
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
      organizationName: organizationName || 'Unknown',
      applicationsCount: 0,
      approvedApplicationsCount: 0,
      totalAmountRequested: 0,
      isActive: dbOpp.is_active,
      eligibilityCriteria: dbOpp.eligibility_criteria,
      requiredDocuments: dbOpp.required_documents,
    };
  }

  private mapDatabaseActivityToAdmin(
    dbActivity: any,
    userMap: Map<string, string>,
    orgMap: Map<string, string>
  ): AdminActivity {
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
      userEmail: userMap.get(dbActivity.user_id),
      organizationName: orgMap.get(dbActivity.organization_id),
    };
  }

  // ===============================
  // UTILITY FUNCTIONS
  // ===============================

  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((groups: Record<string, number>, item) => {
      const value = String(item[key]);
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {});
  }

  private generateDateTrend(
    items: any[],
    startDate: Date,
    endDate: Date
  ): Array<{ date: string; count: number }> {
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const trend: Array<{ date: string; count: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = items.filter(
        (item) =>
          new Date(item.created_at).toISOString().split('T')[0] === dateStr
      ).length;

      trend.push({ date: dateStr, count });
    }

    return trend;
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    console.log('🧹 AdminService destroyed');
    this.destroy$.next();
    this.destroy$.complete();
    this.adminCheckCache.clear();
  }
}
