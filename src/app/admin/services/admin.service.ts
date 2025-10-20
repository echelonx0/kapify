// // src/app/shared/services/admin.service.ts
// import { Injectable, inject } from '@angular/core';
// import { Observable, from, throwError, of } from 'rxjs';
// import { map, catchError, switchMap } from 'rxjs/operators'; 
// import { AuthService } from '../../auth/production.auth.service';
// import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';

// // Admin interfaces
// export interface AdminStats {
//   totalUsers: number;
//   totalOrganizations: number;
//   totalOpportunities: number;
//   activeApplications: number;
//   newUsersThisMonth: number;
//   newOrganizationsThisMonth: number;
//   newOpportunitiesThisMonth: number;
//   verificationRequestsPending: number;
// }

// export interface AdminUser {
//   id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone?: string;
//   userType: string;
//   status: string;
//   emailVerified: boolean;
//   phoneVerified: boolean;
//   accountTier: string;
//   profilePicture?: string;
//   createdAt: Date;
//   updatedAt: Date;
//   lastLoginAt?: Date;
//   organizationId?: string;
//   organizationName?: string;
//   profileCompletionPercentage?: number;
// }

// export interface AdminOrganization {
//   id: string;
//   name: string;
//   description?: string;
//   organizationType: string;
//   status: string;
//   website?: string;
//   logoUrl?: string;
//   legalName?: string;
//   registrationNumber?: string;
//   taxNumber?: string;
//   foundedYear?: number;
//   employeeCount?: number;
//   assetsUnderManagement?: number;
//   isVerified: boolean;
//   verificationDate?: Date;
//   email?: string;
//   phone?: string;
//   addressLine1?: string;
//   addressLine2?: string;
//   city?: string;
//   province?: string;
//   postalCode?: string;
//   country: string;
//   createdAt: Date;
//   updatedAt: Date;
//   ownerName?: string;
//   ownerEmail?: string;
//   userCount?: number;
//   opportunitiesCount?: number;
// }

// export interface AdminOpportunity {
//   id: string;
//   title: string;
//   description: string;
//   fundingType: string;
//   status: string;
//   minAmount: number;
//   maxAmount: number;
//   interestRate?: number;
//   termMonths?: number;
//   deadline?: Date;
//   createdAt: Date;
//   updatedAt: Date;
//   organizationId: string;
//   organizationName: string;
//   applicationsCount: number;
//   approvedApplicationsCount: number;
//   totalAmountRequested: number;
//   isActive: boolean;
//   eligibilityCriteria?: any;
//   requiredDocuments?: string[];
// }

// export interface AdminActivity {
//   id: string;
//   type: 'user' | 'organization' | 'opportunity' | 'application' | 'system';
//   action: string;
//   message: string;
//   userId?: string;
//   organizationId?: string;
//   opportunityId?: string;
//   metadata?: any;
//   createdAt: Date;
//   userEmail?: string;
//   organizationName?: string;
// }

// export interface PasswordResetResponse {
//   success: boolean;
//   temporaryPassword: string;
//   message: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class AdminService {
//   private supabaseService = inject(SharedSupabaseService);
//   private authService = inject(AuthService);
//  private readonly ADMIN_EMAILS: string[] = [
//     'charles@bokamosoas.co.za',
//     'admin@kapify.com',
//     'support@kapify.com',
//     'operations@kapify.com',
//     'zivaigwe@gmail.com'
//   ];
//   constructor() {
//     console.log('AdminService initialized');
//   }

//   // ===============================
//   // ACCESS CONTROL
//   // ===============================

//  private verifyAdminAccess(): boolean {
//     const currentUser = this.authService.user();
//     if (!currentUser?.email) return false;

//     return this.ADMIN_EMAILS.includes(currentUser.email.toLowerCase());
//   }

//   private throwIfNotAdmin(): void {
//     if (!this.verifyAdminAccess()) {
//       throw new Error('Unauthorized: Admin access required');
//     }
//   }

//   // ===============================
//   // DASHBOARD STATS
//   // ===============================

//   getStats(): Observable<AdminStats> {
//     this.throwIfNotAdmin();

//     return from(this.fetchStats()).pipe(
//       catchError(error => {
//         console.error('Failed to fetch admin stats:', error);
//         return throwError(() => new Error('Failed to load admin statistics'));
//       })
//     );
//   }

//   private async fetchStats(): Promise<AdminStats> {
//     const now = new Date();
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

//     // Run all queries in parallel
//     const [
//       usersResult,
//       organizationsResult,
//       opportunitiesResult,
//       applicationsResult,
//       newUsersResult,
//       newOrganizationsResult,
//       newOpportunitiesResult,
//       pendingVerificationsResult
//     ] = await Promise.all([
//       // Total users
//       this.supabaseService
//         .from('users')
//         .select('id', { count: 'exact', head: true }),
      
//       // Total organizations
//       this.supabaseService
//         .from('organizations')
//         .select('id', { count: 'exact', head: true }),
      
//       // Total opportunities
//       this.supabaseService
//         .from('funding_opportunities')
//         .select('id', { count: 'exact', head: true }),
      
//       // Active applications
//       this.supabaseService
//         .from('applications')
//         .select('id', { count: 'exact', head: true })
//         .in('status', ['submitted', 'under_review', 'approved']),
      
//       // New users this month
//       this.supabaseService
//         .from('users')
//         .select('id', { count: 'exact', head: true })
//         .gte('created_at', startOfMonth.toISOString()),
      
//       // New organizations this month
//       this.supabaseService
//         .from('organizations')
//         .select('id', { count: 'exact', head: true })
//         .gte('created_at', startOfMonth.toISOString()),
      
//       // New opportunities this month
//       this.supabaseService
//         .from('funding_opportunities')
//         .select('id', { count: 'exact', head: true })
//         .gte('created_at', startOfMonth.toISOString()),
      
//       // Pending verifications
//       this.supabaseService
//         .from('organizations')
//         .select('id', { count: 'exact', head: true })
//         .eq('status', 'pending_verification')
//     ]);

//     return {
//       totalUsers: usersResult.count || 0,
//       totalOrganizations: organizationsResult.count || 0,
//       totalOpportunities: opportunitiesResult.count || 0,
//       activeApplications: applicationsResult.count || 0,
//       newUsersThisMonth: newUsersResult.count || 0,
//       newOrganizationsThisMonth: newOrganizationsResult.count || 0,
//       newOpportunitiesThisMonth: newOpportunitiesResult.count || 0,
//       verificationRequestsPending: pendingVerificationsResult.count || 0
//     };
//   }

//   // ===============================
//   // USER MANAGEMENT
//   // ===============================

 

//   updateUserStatus(userId: string, status: string): Observable<AdminUser> {
//     this.throwIfNotAdmin();

//     return from(
//       this.supabaseService
//         .from('users')
//         .update({ 
//           status, 
//           updated_at: new Date().toISOString() 
//         })
//         .eq('id', userId)
//         .select()
//         .single()
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         return this.mapDatabaseUserToAdmin(data);
//       }),
//       switchMap(() => this.getUserById(userId)),
//       catchError(error => {
//         console.error('Failed to update user status:', error);
//         return throwError(() => new Error('Failed to update user status'));
//       })
//     );
//   }

//   resetUserPassword(userId: string): Observable<PasswordResetResponse> {
//     this.throwIfNotAdmin();

//     // Generate temporary password
//     const temporaryPassword = this.generateTemporaryPassword();

//     return from(
//       this.supabaseService.auth.admin.updateUserById(userId, {
//         password: temporaryPassword
//       })
//     ).pipe(
//       map(({ error }) => {
//         if (error) throw error;
//         return {
//           success: true,
//           temporaryPassword,
//           message: 'Password reset successfully'
//         };
//       }),
//       catchError(error => {
//         console.error('Failed to reset password:', error);
//         return throwError(() => new Error('Failed to reset user password'));
//       })
//     );
//   }

//   private generateTemporaryPassword(): string {
//     const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
//     let result = '';
//     for (let i = 0; i < 12; i++) {
//       result += chars.charAt(Math.floor(Math.random() * chars.length));
//     }
//     return result;
//   }

//   // ===============================
//   // ORGANIZATION MANAGEMENT
//   // ===============================

 

//   updateOrganizationStatus(organizationId: string, status: string): Observable<AdminOrganization> {
//     this.throwIfNotAdmin();

//     return from(
//       this.supabaseService
//         .from('organizations')
//         .update({ 
//           status, 
//           updated_at: new Date().toISOString() 
//         })
//         .eq('id', organizationId)
//         .select()
//         .single()
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         return this.mapDatabaseOrganizationToAdmin(data);
//       }),
//       switchMap(() => this.getOrganizationById(organizationId)),
//       catchError(error => {
//         console.error('Failed to update organization status:', error);
//         return throwError(() => new Error('Failed to update organization status'));
//       })
//     );
//   }

//   verifyOrganization(organizationId: string): Observable<AdminOrganization> {
//     this.throwIfNotAdmin();

//     return from(
//       this.supabaseService
//         .from('organizations')
//         .update({ 
//           status: 'verified',
//           is_verified: true,
//           verification_date: new Date().toISOString(),
//           updated_at: new Date().toISOString() 
//         })
//         .eq('id', organizationId)
//         .select()
//         .single()
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         return this.mapDatabaseOrganizationToAdmin(data);
//       }),
//       switchMap(() => this.getOrganizationById(organizationId)),
//       catchError(error => {
//         console.error('Failed to verify organization:', error);
//         return throwError(() => new Error('Failed to verify organization'));
//       })
//     );
//   }

//   // ===============================
//   // OPPORTUNITY MANAGEMENT
//   // ===============================

 

 

 

  

//   updateOpportunityStatus(opportunityId: string, status: string): Observable<AdminOpportunity> {
//     this.throwIfNotAdmin();

//     return from(
//       this.supabaseService
//         .from('funding_opportunities')
//         .update({ 
//           status,
//           is_active: status === 'active',
//           updated_at: new Date().toISOString() 
//         })
//         .eq('id', opportunityId)
//         .select()
//         .single()
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         return this.mapDatabaseOpportunityToAdmin(data);
//       }),
//       switchMap(() => this.getOpportunityById(opportunityId)),
//       catchError(error => {
//         console.error('Failed to update opportunity status:', error);
//         return throwError(() => new Error('Failed to update opportunity status'));
//       })
//     );
//   }

//   deleteOpportunity(opportunityId: string): Observable<void> {
//     this.throwIfNotAdmin();

//     return from(
//       this.supabaseService
//         .from('funding_opportunities')
//         .delete()
//         .eq('id', opportunityId)
//     ).pipe(
//       map(({ error }) => {
//         if (error) throw error;
//         return undefined;
//       }),
//       catchError(error => {
//         console.error('Failed to delete opportunity:', error);
//         return throwError(() => new Error('Failed to delete opportunity'));
//       })
//     );
//   }

//   // ===============================
//   // ACTIVITY & AUDIT LOG
//   // ===============================

//   getRecentActivity(): Observable<AdminActivity[]> {
//     this.throwIfNotAdmin();

//     return from(
//       this.supabaseService
//         .from('activities')
//         .select(`
//           *,
//           users (
//             email
//           ),
//           organizations (
//             name
//           )
//         `)
//         .order('created_at', { ascending: false })
//         .limit(50)
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         return (data || []).map(this.mapDatabaseActivityToAdmin);
//       }),
//       catchError(error => {
//         console.error('Failed to fetch recent activity:', error);
//         return throwError(() => new Error('Failed to load recent activity'));
//       })
//     );
//   }

//   logAdminAction(action: string, targetType: string, targetId: string, details?: any): Observable<void> {
//     const currentUser = this.authService.user();
//     if (!currentUser) {
//       return throwError(() => new Error('Not authenticated'));
//     }

//     return from(
//       this.supabaseService
//         .from('activities')
//         .insert({
//           type: 'admin',
//           action,
//           message: `Admin ${action} on ${targetType}`,
//           user_id: currentUser.id,
//           metadata: {
//             targetType,
//             targetId,
//             adminAction: true,
//             ...details
//           }
//         })
//     ).pipe(
//       map(({ error }) => {
//         if (error) throw error;
//         return undefined;
//       }),
//       catchError(error => {
//         console.error('Failed to log admin action:', error);
//         // Don't fail the main operation if logging fails
//         return of(undefined);
//       })
//     );
//   }

//   // ===============================
//   // BULK OPERATIONS
//   // ===============================

//   bulkUpdateUserStatus(userIds: string[], status: string): Observable<AdminUser[]> {
//     this.throwIfNotAdmin();

//     return from(
//       this.supabaseService
//         .from('users')
//         .update({ 
//           status, 
//           updated_at: new Date().toISOString() 
//         })
//         .in('id', userIds)
//         .select()
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         return (data || []).map(this.mapDatabaseUserToAdmin);
//       }),
//       catchError(error => {
//         console.error('Failed to bulk update users:', error);
//         return throwError(() => new Error('Failed to bulk update user status'));
//       })
//     );
//   }

//   bulkUpdateOrganizationStatus(organizationIds: string[], status: string): Observable<AdminOrganization[]> {
//     this.throwIfNotAdmin();

//     return from(
//       this.supabaseService
//         .from('organizations')
//         .update({ 
//           status, 
//           updated_at: new Date().toISOString() 
//         })
//         .in('id', organizationIds)
//         .select()
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         return (data || []).map(this.mapDatabaseOrganizationToAdmin);
//       }),
//       catchError(error => {
//         console.error('Failed to bulk update organizations:', error);
//         return throwError(() => new Error('Failed to bulk update organization status'));
//       })
//     );
//   }

//   // ===============================
//   // REPORTS & ANALYTICS
//   // ===============================

//   generateUserReport(startDate: Date, endDate: Date): Observable<any> {
//     this.throwIfNotAdmin();

//     return from(
//       this.supabaseService
//         .from('users')
//         .select('*')
//         .gte('created_at', startDate.toISOString())
//         .lte('created_at', endDate.toISOString())
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
        
//         const users = data || [];
//         const report = {
//           totalUsers: users.length,
//           usersByType: this.groupBy(users, 'user_type'),
//           usersByStatus: this.groupBy(users, 'status'),
//           verifiedUsers: users.filter(u => u.email_verified).length,
//           averageProfileCompletion: 0, // Would need to join with profiles
//           registrationTrend: this.generateDateTrend(users, startDate, endDate)
//         };
        
//         return report;
//       }),
//       catchError(error => {
//         console.error('Failed to generate user report:', error);
//         return throwError(() => new Error('Failed to generate user report'));
//       })
//     );
//   }

//   // ===============================
//   // SYSTEM UTILITIES
//   // ===============================

//   performSystemMaintenance(): Observable<{ success: boolean; message: string }> {
//     this.throwIfNotAdmin();

//     // This would include cleanup operations, cache clearing, etc.
//     return of({
//       success: true,
//       message: 'System maintenance completed successfully'
//     });
//   }

//   // ===============================
//   // MAPPING FUNCTIONS
//   // ===============================

//   private mapDatabaseUserToAdmin(dbUser: any): AdminUser {
//     const orgUser = dbUser.organization_users?.[0];
//     const profile = dbUser.user_profiles?.[0];
    
//     return {
//       id: dbUser.id,
//       firstName: dbUser.first_name,
//       lastName: dbUser.last_name,
//       email: dbUser.email,
//       phone: dbUser.phone,
//       userType: dbUser.user_type,
//       status: dbUser.status,
//       emailVerified: dbUser.email_verified,
//       phoneVerified: dbUser.phone_verified || false,
//       accountTier: dbUser.account_tier || 'basic',
//       profilePicture: dbUser.profile_picture,
//       createdAt: new Date(dbUser.created_at),
//       updatedAt: new Date(dbUser.updated_at),
//       lastLoginAt: dbUser.last_login_at ? new Date(dbUser.last_login_at) : undefined,
//       organizationId: orgUser?.organization_id,
//       organizationName: orgUser?.organizations?.name,
//       profileCompletionPercentage: profile?.completion_percentage || 0
//     };
//   }

//   private mapDatabaseOrganizationToAdmin(dbOrg: any): AdminOrganization {
//     const owner = dbOrg.organization_users?.find((ou: any) => ou.role === 'owner' || ou.role === 'admin');
    
//     return {
//       id: dbOrg.id,
//       name: dbOrg.name,
//       description: dbOrg.description,
//       organizationType: dbOrg.organization_type,
//       status: dbOrg.status,
//       website: dbOrg.website,
//       logoUrl: dbOrg.logo_url,
//       legalName: dbOrg.legal_name,
//       registrationNumber: dbOrg.registration_number,
//       taxNumber: dbOrg.tax_number,
//       foundedYear: dbOrg.founded_year,
//       employeeCount: dbOrg.employee_count,
//       assetsUnderManagement: dbOrg.assets_under_management,
//       isVerified: dbOrg.is_verified,
//       verificationDate: dbOrg.verification_date ? new Date(dbOrg.verification_date) : undefined,
//       email: dbOrg.email,
//       phone: dbOrg.phone,
//       addressLine1: dbOrg.address_line1,
//       addressLine2: dbOrg.address_line2,
//       city: dbOrg.city,
//       province: dbOrg.province,
//       postalCode: dbOrg.postal_code,
//       country: dbOrg.country || 'South Africa',
//       createdAt: new Date(dbOrg.created_at),
//       updatedAt: new Date(dbOrg.updated_at),
//       ownerName: owner?.users ? `${owner.users.first_name} ${owner.users.last_name}` : undefined,
//       ownerEmail: owner?.users?.email,
//       userCount: dbOrg.organization_users?.length || 0,
//       opportunitiesCount: 0 // Would need separate query
//     };
//   }

//   private mapDatabaseOpportunityToAdmin(dbOpp: any): AdminOpportunity {
//     return {
//       id: dbOpp.id,
//       title: dbOpp.title,
//       description: dbOpp.description,
//       fundingType: dbOpp.funding_type,
//       status: dbOpp.status,
//       minAmount: dbOpp.min_amount,
//       maxAmount: dbOpp.max_amount,
//       interestRate: dbOpp.interest_rate,
//       termMonths: dbOpp.term_months,
//       deadline: dbOpp.deadline ? new Date(dbOpp.deadline) : undefined,
//       createdAt: new Date(dbOpp.created_at),
//       updatedAt: new Date(dbOpp.updated_at),
//       organizationId: dbOpp.organization_id,
//       organizationName: dbOpp.organizations?.name || 'Unknown',
//       applicationsCount: 0, // Would need separate query
//       approvedApplicationsCount: 0, // Would need separate query
//       totalAmountRequested: 0, // Would need separate query
//       isActive: dbOpp.is_active,
//       eligibilityCriteria: dbOpp.eligibility_criteria,
//       requiredDocuments: dbOpp.required_documents
//     };
//   }

//   private mapDatabaseActivityToAdmin(dbActivity: any): AdminActivity {
//     return {
//       id: dbActivity.id,
//       type: dbActivity.type,
//       action: dbActivity.action,
//       message: dbActivity.message,
//       userId: dbActivity.user_id,
//       organizationId: dbActivity.organization_id,
//       opportunityId: dbActivity.opportunity_id,
//       metadata: dbActivity.metadata,
//       createdAt: new Date(dbActivity.created_at),
//       userEmail: dbActivity.users?.email,
//       organizationName: dbActivity.organizations?.name
//     };
//   }

//   // ===============================
//   // UTILITY FUNCTIONS
//   // ===============================

//   private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
//     return array.reduce((groups: Record<string, number>, item) => {
//       const value = String(item[key]);
//       groups[value] = (groups[value] || 0) + 1;
//       return groups;
//     }, {});
//   }

//   private generateDateTrend(items: any[], startDate: Date, endDate: Date): Array<{ date: string; count: number }> {
//     const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
//     const trend: Array<{ date: string; count: number }> = [];
    
//     for (let i = 0; i < days; i++) {
//       const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
//       const dateStr = date.toISOString().split('T')[0];
//       const count = items.filter(item => 
//         new Date(item.created_at).toISOString().split('T')[0] === dateStr
//       ).length;
      
//       trend.push({ date: dateStr, count });
//     }
    
//     return trend;
//   }

//   // Fixed methods for AdminService

// // Replace the existing getAllUsers() method
// getAllUsers(): Observable<AdminUser[]> {
//   this.throwIfNotAdmin();

//   return from(
//     this.supabaseService
//       .from('users')
//       .select(`
//         *,
//         user_profiles (
//           completion_percentage
//         )
//       `)
//       .order('created_at', { ascending: false })
//       .limit(1000)
//   ).pipe(
//     switchMap(({ data: users, error }) => {
//       if (error) throw error;
      
//       // Get organization data separately for each user
//       return from(Promise.all(
//         (users || []).map(async (user) => {
//           const { data: orgUser } = await this.supabaseService
//             .from('organization_users')
//             .select(`
//               organization_id,
//               organizations!inner (name)
//             `)
//             .eq('user_id', user.id)
//             .maybeSingle();

//           return this.mapDatabaseUserToAdmin({
//             ...user,
//             organization_users: orgUser ? [orgUser] : []
//           });
//         })
//       ));
//     }),
//     catchError(error => {
//       console.error('Failed to fetch users:', error);
//       return throwError(() => new Error('Failed to load users'));
//     })
//   );
// }

// // Replace the existing getAllOrganizations() method
// getAllOrganizations(): Observable<AdminOrganization[]> {
//   this.throwIfNotAdmin();

//   return from(
//     this.supabaseService
//       .from('organizations')
//       .select('*')
//       .order('created_at', { ascending: false })
//       .limit(1000)
//   ).pipe(
//     switchMap(({ data: orgs, error }) => {
//       if (error) throw error;
      
//       // Get users for each organization separately
//       return from(Promise.all(
//         (orgs || []).map(async (org) => {
//           const { data: orgUsers } = await this.supabaseService
//             .from('organization_users')
//             .select(`
//               role,
//               users!inner (
//                 first_name,
//                 last_name,
//                 email
//               )
//             `)
//             .eq('organization_id', org.id);

//           return this.mapDatabaseOrganizationToAdmin({
//             ...org,
//             organization_users: orgUsers || []
//           });
//         })
//       ));
//     }),
//     catchError(error => {
//       console.error('Failed to fetch organizations:', error);
//       return throwError(() => new Error('Failed to load organizations'));
//     })
//   );
// }

// // Replace the existing getAllOpportunities() method
// getAllOpportunities(): Observable<AdminOpportunity[]> {
//   this.throwIfNotAdmin();

//   return from(
//     this.supabaseService
//       .from('funding_opportunities')
//       .select('*')
//       .order('created_at', { ascending: false })
//       .limit(1000)
//   ).pipe(
//     switchMap(({ data: opportunities, error }) => {
//       if (error) throw error;
      
//       // Get organization data separately for each opportunity
//       return from(Promise.all(
//         (opportunities || []).map(async (opp) => {
//           const { data: org } = await this.supabaseService
//             .from('organizations')
//             .select('name')
//             .eq('id', opp.organization_id)
//             .maybeSingle();

//           return this.mapDatabaseOpportunityToAdmin({
//             ...opp,
//             organizations: org || { name: 'Unknown Organization' }
//           });
//         })
//       ));
//     }),
//     catchError(error => {
//       console.error('Failed to fetch opportunities:', error);
//       return throwError(() => new Error('Failed to load opportunities'));
//     })
//   );
// }

// // Fix the getOpportunityById method
// getOpportunityById(opportunityId: string): Observable<AdminOpportunity> {
//   this.throwIfNotAdmin();

//   return from(
//     this.supabaseService
//       .from('funding_opportunities')
//       .select('*')
//       .eq('id', opportunityId)
//       .single()
//   ).pipe(
//     switchMap(({ data: opportunity, error }) => {
//       if (error) throw error;
      
//       // Get organization data separately
//       return from(
//         this.supabaseService
//           .from('organizations')
//           .select('name')
//           .eq('id', opportunity.organization_id)
//           .maybeSingle()
//       ).pipe(
//         map(({ data: org }) => this.mapDatabaseOpportunityToAdmin({
//           ...opportunity,
//           organizations: org || { name: 'Unknown Organization' }
//         }))
//       );
//     }),
//     catchError(error => {
//       console.error('Failed to fetch opportunity:', error);
//       return throwError(() => new Error('Failed to load opportunity details'));
//     })
//   );
// }

// // Fix the getUserById method  
// getUserById(userId: string): Observable<AdminUser> {
//   this.throwIfNotAdmin();

//   return from(
//     this.supabaseService
//       .from('users')
//       .select(`
//         *,
//         user_profiles (
//           completion_percentage
//         )
//       `)
//       .eq('id', userId)
//       .single()
//   ).pipe(
//     switchMap(({ data: user, error }) => {
//       if (error) throw error;
      
//       // Get organization data separately
//       return from(
//         this.supabaseService
//           .from('organization_users')
//           .select(`
//             organization_id,
//             organizations!inner (name)
//           `)
//           .eq('user_id', user.id)
//           .maybeSingle()
//       ).pipe(
//         map(({ data: orgUser }) => this.mapDatabaseUserToAdmin({
//           ...user,
//           organization_users: orgUser ? [orgUser] : []
//         }))
//       );
//     }),
//     catchError(error => {
//       console.error('Failed to fetch user:', error);
//       return throwError(() => new Error('Failed to load user details'));
//     })
//   );
// }

// // Fix the getOrganizationById method
// getOrganizationById(organizationId: string): Observable<AdminOrganization> {
//   this.throwIfNotAdmin();

//   return from(
//     this.supabaseService
//       .from('organizations')
//       .select('*')
//       .eq('id', organizationId)
//       .single()
//   ).pipe(
//     switchMap(({ data: org, error }) => {
//       if (error) throw error;
      
//       // Get users for this organization separately
//       return from(
//         this.supabaseService
//           .from('organization_users')
//           .select(`
//             role,
//             users!inner (
//               first_name,
//               last_name,
//               email
//             )
//           `)
//           .eq('organization_id', org.id)
//       ).pipe(
//         map(({ data: orgUsers }) => this.mapDatabaseOrganizationToAdmin({
//           ...org,
//           organization_users: orgUsers || []
//         }))
//       );
//     }),
//     catchError(error => {
//       console.error('Failed to fetch organization:', error);
//       return throwError(() => new Error('Failed to load organization details'));
//     })
//   );
// }
// }

import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable, from, throwError, of, Subject } from 'rxjs';
import { map, catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
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
 * - Removes AuthService injection (no tight coupling)
 * - Uses SharedSupabaseService for auth verification via database
 * - Eliminates N+1 queries with proper .select() joins
 * - Adds pagination support
 * - Consistent error handling
 * - Proper cleanup on destroy
 */
@Injectable({
  providedIn: 'root'
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
   * Verify admin access via database (single source of truth)
   * CRITICAL: Use RPC or database query, not hardcoded emails
   */
  private async verifyAdminAccess(): Promise<boolean> {
    try {
      const userId = this.supabase.getCurrentUserId();
      if (!userId) return false;

      // Check cache first
      if (this.adminCheckCache.has(userId)) {
        return this.adminCheckCache.get(userId) || false;
      }

      // Query admin_users table (maintainable, scalable)
      const { data, error } = await this.supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const isAdmin = !error && !!data;
      this.adminCheckCache.set(userId, isAdmin);

      // Auto-clear cache after TTL
      setTimeout(() => this.adminCheckCache.delete(userId), this.ADMIN_CACHE_TTL);

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
      catchError(error => {
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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // All queries in parallel
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
      this.supabase.from('users').select('id', { count: 'exact', head: true }),
      this.supabase.from('organizations').select('id', { count: 'exact', head: true }),
      this.supabase.from('funding_opportunities').select('id', { count: 'exact', head: true }),
      this.supabase.from('applications')
        .select('id', { count: 'exact', head: true })
        .in('status', ['submitted', 'under_review', 'approved']),
      this.supabase.from('users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth),
      this.supabase.from('organizations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth),
      this.supabase.from('funding_opportunities')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth),
      this.supabase.from('organizations')
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
  // USER MANAGEMENT (PAGINATED)
  // ===============================

  /**
   * Get all users with pagination
   * FIXED: Uses .select() joins to eliminate N+1 queries
   */
  getAllUsers(options: PaginationOptions = { page: 1, pageSize: 50 }): Observable<AdminUser[]> {
    return from(this.fetchAllUsers(options)).pipe(
      catchError(error => {
        console.error('❌ Failed to fetch users:', error);
        return throwError(() => new Error('Failed to load users'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch users with proper joins (no N+1)
   */
  private async fetchAllUsers(options: PaginationOptions): Promise<AdminUser[]> {
    await this.throwIfNotAdmin();

    const start = (options.page - 1) * options.pageSize;
    const end = start + options.pageSize - 1;

    const { data: users, error } = await this.supabase
      .from('users')
      .select(`
        *,
        user_profiles (completion_percentage),
        organization_users!inner (organization_id, organizations!inner (name))
      `)
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;

    return (users || []).map(user => this.mapDatabaseUserToAdmin(user));
  }

  /**
   * Get user by ID (with all related data)
   */
  getUserById(userId: string): Observable<AdminUser> {
    return from(this.fetchUserById(userId)).pipe(
      catchError(error => {
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
      .select(`
        *,
        user_profiles (completion_percentage),
        organization_users (organization_id, organizations (name))
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return this.mapDatabaseUserToAdmin(user);
  }

  /**
   * Update user status
   */
  updateUserStatus(userId: string, status: string): Observable<AdminUser> {
    return from(this.performUserStatusUpdate(userId, status)).pipe(
      tap(() => console.log(`✅ User ${userId} status updated to ${status}`)),
      switchMap(() => this.getUserById(userId)),
      catchError(error => {
        console.error('❌ Failed to update user status:', error);
        return throwError(() => new Error('Failed to update user status'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform user status update
   */
  private async performUserStatusUpdate(userId: string, status: string): Promise<void> {
    await this.throwIfNotAdmin();

    const { error } = await this.supabase
      .from('users')
      .update({
        status,
        updated_at: new Date().toISOString()
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
      catchError(error => {
        console.error('❌ Failed to reset password:', error);
        return throwError(() => new Error('Failed to reset user password'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform password reset
   */
  private async performPasswordReset(userId: string): Promise<PasswordResetResponse> {
    await this.throwIfNotAdmin();

    const temporaryPassword = this.generateTemporaryPassword();

    const { error } = await this.supabase.auth.admin.updateUserById(userId, {
      password: temporaryPassword
    });

    if (error) throw error;

    return {
      success: true,
      temporaryPassword,
      message: 'Password reset successfully. Share temporary password with user.'
    };
  }

  /**
   * Bulk update user status
   */
  bulkUpdateUserStatus(userIds: string[], status: string): Observable<AdminUser[]> {
    return from(this.performBulkUserUpdate(userIds, status)).pipe(
      tap(() => console.log(`✅ Updated ${userIds.length} users to ${status}`)),
      catchError(error => {
        console.error('❌ Failed to bulk update users:', error);
        return throwError(() => new Error('Failed to bulk update user status'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform bulk user update
   */
  private async performBulkUserUpdate(userIds: string[], status: string): Promise<AdminUser[]> {
    await this.throwIfNotAdmin();

    const { data: users, error } = await this.supabase
      .from('users')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .in('id', userIds)
      .select(`
        *,
        user_profiles (completion_percentage),
        organization_users (organization_id, organizations (name))
      `);

    if (error) throw error;
    return (users || []).map(user => this.mapDatabaseUserToAdmin(user));
  }

  // ===============================
  // ORGANIZATION MANAGEMENT (PAGINATED)
  // ===============================

  /**
   * Get all organizations with pagination (no N+1)
   */
  getAllOrganizations(options: PaginationOptions = { page: 1, pageSize: 50 }): Observable<AdminOrganization[]> {
    return from(this.fetchAllOrganizations(options)).pipe(
      catchError(error => {
        console.error('❌ Failed to fetch organizations:', error);
        return throwError(() => new Error('Failed to load organizations'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch organizations with joins
   */
  private async fetchAllOrganizations(options: PaginationOptions): Promise<AdminOrganization[]> {
    await this.throwIfNotAdmin();

    const start = (options.page - 1) * options.pageSize;
    const end = start + options.pageSize - 1;

    const { data: orgs, error } = await this.supabase
      .from('organizations')
      .select(`
        *,
        organization_users!inner (
          role,
          users (first_name, last_name, email)
        )
      `)
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;
    return (orgs || []).map(org => this.mapDatabaseOrganizationToAdmin(org));
  }

  /**
   * Get organization by ID
   */
  getOrganizationById(organizationId: string): Observable<AdminOrganization> {
    return from(this.fetchOrganizationById(organizationId)).pipe(
      catchError(error => {
        console.error('❌ Failed to fetch organization:', error);
        return throwError(() => new Error('Failed to load organization details'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch single organization with joins
   */
  private async fetchOrganizationById(organizationId: string): Promise<AdminOrganization> {
    await this.throwIfNotAdmin();

    const { data: org, error } = await this.supabase
      .from('organizations')
      .select(`
        *,
        organization_users (
          role,
          users (first_name, last_name, email)
        )
      `)
      .eq('id', organizationId)
      .single();

    if (error) throw error;
    return this.mapDatabaseOrganizationToAdmin(org);
  }

  /**
   * Update organization status
   */
  updateOrganizationStatus(organizationId: string, status: string): Observable<AdminOrganization> {
    return from(this.performOrgStatusUpdate(organizationId, status)).pipe(
      tap(() => console.log(`✅ Organization ${organizationId} status updated to ${status}`)),
      switchMap(() => this.getOrganizationById(organizationId)),
      catchError(error => {
        console.error('❌ Failed to update organization status:', error);
        return throwError(() => new Error('Failed to update organization status'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform organization status update
   */
  private async performOrgStatusUpdate(organizationId: string, status: string): Promise<void> {
    await this.throwIfNotAdmin();

    const { error } = await this.supabase
      .from('organizations')
      .update({
        status,
        updated_at: new Date().toISOString()
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
      catchError(error => {
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
        updated_at: new Date().toISOString()
      })
      .eq('id', organizationId);

    if (error) throw error;
  }

  /**
   * Bulk update organization status
   */
  bulkUpdateOrganizationStatus(organizationIds: string[], status: string): Observable<AdminOrganization[]> {
    return from(this.performBulkOrgUpdate(organizationIds, status)).pipe(
      tap(() => console.log(`✅ Updated ${organizationIds.length} organizations to ${status}`)),
      catchError(error => {
        console.error('❌ Failed to bulk update organizations:', error);
        return throwError(() => new Error('Failed to bulk update organization status'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform bulk organization update
   */
  private async performBulkOrgUpdate(organizationIds: string[], status: string): Promise<AdminOrganization[]> {
    await this.throwIfNotAdmin();

    const { data: orgs, error } = await this.supabase
      .from('organizations')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .in('id', organizationIds)
      .select(`
        *,
        organization_users (
          role,
          users (first_name, last_name, email)
        )
      `);

    if (error) throw error;
    return (orgs || []).map(org => this.mapDatabaseOrganizationToAdmin(org));
  }

  // ===============================
  // OPPORTUNITY MANAGEMENT (PAGINATED)
  // ===============================

  /**
   * Get all opportunities with pagination (no N+1)
   */
  getAllOpportunities(options: PaginationOptions = { page: 1, pageSize: 50 }): Observable<AdminOpportunity[]> {
    return from(this.fetchAllOpportunities(options)).pipe(
      catchError(error => {
        console.error('❌ Failed to fetch opportunities:', error);
        return throwError(() => new Error('Failed to load opportunities'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch opportunities with joins
   */
  private async fetchAllOpportunities(options: PaginationOptions): Promise<AdminOpportunity[]> {
    await this.throwIfNotAdmin();

    const start = (options.page - 1) * options.pageSize;
    const end = start + options.pageSize - 1;

    const { data: opportunities, error } = await this.supabase
      .from('funding_opportunities')
      .select(`
        *,
        organizations (name)
      `)
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) throw error;
    return (opportunities || []).map(opp => this.mapDatabaseOpportunityToAdmin(opp));
  }

  /**
   * Get opportunity by ID
   */
  getOpportunityById(opportunityId: string): Observable<AdminOpportunity> {
    return from(this.fetchOpportunityById(opportunityId)).pipe(
      catchError(error => {
        console.error('❌ Failed to fetch opportunity:', error);
        return throwError(() => new Error('Failed to load opportunity details'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch single opportunity with joins
   */
  private async fetchOpportunityById(opportunityId: string): Promise<AdminOpportunity> {
    await this.throwIfNotAdmin();

    const { data: opportunity, error } = await this.supabase
      .from('funding_opportunities')
      .select(`
        *,
        organizations (name)
      `)
      .eq('id', opportunityId)
      .single();

    if (error) throw error;
    return this.mapDatabaseOpportunityToAdmin(opportunity);
  }

  /**
   * Update opportunity status
   */
  updateOpportunityStatus(opportunityId: string, status: string): Observable<AdminOpportunity> {
    return from(this.performOppStatusUpdate(opportunityId, status)).pipe(
      tap(() => console.log(`✅ Opportunity ${opportunityId} status updated to ${status}`)),
      switchMap(() => this.getOpportunityById(opportunityId)),
      catchError(error => {
        console.error('❌ Failed to update opportunity status:', error);
        return throwError(() => new Error('Failed to update opportunity status'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform opportunity status update
   */
  private async performOppStatusUpdate(opportunityId: string, status: string): Promise<void> {
    await this.throwIfNotAdmin();

    const { error } = await this.supabase
      .from('funding_opportunities')
      .update({
        status,
        is_active: status === 'active',
        updated_at: new Date().toISOString()
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
      catchError(error => {
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
      catchError(error => {
        console.error('❌ Failed to fetch activity:', error);
        return throwError(() => new Error('Failed to load recent activity'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch recent activity
   */
  private async fetchRecentActivity(limit: number): Promise<AdminActivity[]> {
    await this.throwIfNotAdmin();

    const { data: activities, error } = await this.supabase
      .from('activities')
      .select(`
        *,
        users (email),
        organizations (name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (activities || []).map(activity => this.mapDatabaseActivityToAdmin(activity));
  }

  /**
   * Log admin action (non-critical, don't fail main operation)
   */
  logAdminAction(action: string, targetType: string, targetId: string, details?: any): Observable<void> {
    return from(this.performAdminLogging(action, targetType, targetId, details)).pipe(
      catchError(error => {
        console.warn('⚠️ Failed to log admin action (non-critical):', error);
        // Return success anyway - don't fail main operation
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
        ...details
      }
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
      catchError(error => {
        console.error('❌ Failed to generate user report:', error);
        return throwError(() => new Error('Failed to generate user report'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform user report generation
   */
  private async performUserReport(startDate: Date, endDate: Date): Promise<any> {
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
      verifiedUsers: (users || []).filter(u => u.email_verified).length,
      registrationTrend: this.generateDateTrend(users || [], startDate, endDate)
    };
  }

  // ===============================
  // SYSTEM UTILITIES
  // ===============================

  /**
   * Perform system maintenance
   */
  performSystemMaintenance(): Observable<{ success: boolean; message: string }> {
    return from(this.performMaintenance()).pipe(
      tap(() => console.log('✅ System maintenance completed')),
      catchError(error => {
        console.error('❌ Maintenance failed:', error);
        return throwError(() => new Error('System maintenance failed'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform actual maintenance
   */
  private async performMaintenance(): Promise<{ success: boolean; message: string }> {
    await this.throwIfNotAdmin();
    // Placeholder for maintenance tasks
    return { success: true, message: 'System maintenance completed successfully' };
  }

  // ===============================
  // MAPPING FUNCTIONS
  // ===============================

  private mapDatabaseUserToAdmin(dbUser: any): AdminUser {
    const orgUser = dbUser.organization_users?.[0];

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
      profileCompletionPercentage: dbUser.user_profiles?.[0]?.completion_percentage || 0
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
      opportunitiesCount: 0 // Would require separate aggregation query
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
      applicationsCount: 0, // Requires separate aggregation
      approvedApplicationsCount: 0, // Requires separate aggregation
      totalAmountRequested: 0, // Requires separate aggregation
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
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const trend: Array<{ date: string; count: number }> = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const count = items.filter(
        item => new Date(item.created_at).toISOString().split('T')[0] === dateStr
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