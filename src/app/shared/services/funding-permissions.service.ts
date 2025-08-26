 
// src/app/shared/services/funding-permissions.service.ts
import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject, combineLatest, of, EMPTY } from 'rxjs';
import { tap, catchError, map, switchMap, shareReplay, distinctUntilChanged } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { SharedSupabaseService } from './shared-supabase.service';
import { FundingOpportunity } from '../models/funder.models';

// Core interfaces
export interface UserContext {
  id: string;
  userType: 'sme' | 'funder';
  organizationId?: string; // Only for funders
  email: string;
  firstName: string;
  lastName: string;
}

export interface UserApplicationStatus {
  opportunityId: string;
  applicationId: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  appliedAt: Date;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiresLogin?: boolean;
}

export interface OpportunityPermissions {
  canView: boolean;
  canApply: boolean;
  canManage: boolean;
  canEdit: boolean;
  hasExistingApplication: boolean;
  applicationStatus?: string;
  actionButtonType: 'apply' | 'view-application' | 'manage' | 'edit' | 'login' | 'none';
  actionButtonText: string;
  disabledReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FundingPermissionsService {
  private authService = inject(AuthService);
  private supabaseService = inject(SharedSupabaseService);

  // Core state
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  // User context - reactive to auth changes
  private userContextSubject = new BehaviorSubject<UserContext | null>(null);
  userContext$ = this.userContextSubject.asObservable().pipe(
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    shareReplay(1)
  );

  // User applications cache
  private userApplicationsSubject = new BehaviorSubject<UserApplicationStatus[]>([]);
  userApplications$ = this.userApplicationsSubject.asObservable().pipe(shareReplay(1));

  // Derived state
  currentUserContext = signal<UserContext | null>(null);
  userApplications = signal<UserApplicationStatus[]>([]);
  isAuthenticated = computed(() => !!this.currentUserContext());
  userType = computed(() => this.currentUserContext()?.userType || null);
  userOrganizationId = computed(() => this.currentUserContext()?.organizationId || null);

  constructor() {
    console.log('🚀 FundingPermissionsService initialized');
    
    // Initialize effects only if in browser environment
    if (typeof window !== 'undefined') {
      this.initializeService();
    }
  }

  // ===============================
  // SERVICE INITIALIZATION
  // ===============================

  private initializeService() {
    console.log('🔧 Initializing permissions service...');
    
    try {
      // React to auth state changes with error handling
      effect(() => {
        const user = this.authService.user();
        console.log('👤 Auth state changed:', user ? user.email : 'No user');
        
        if (user) {
          this.loadUserContext(user).catch(error => {
            console.error('Failed to load user context in effect:', error);
          });
        } else {
          this.clearUserContext();
        }
      });

      // Update signals when observables change
      this.userContext$.subscribe({
        next: (context) => {
          console.log('📋 User context updated:', context);
          this.currentUserContext.set(context);
        },
        error: (error) => {
          console.error('User context subscription error:', error);
        }
      });

      this.userApplications$.subscribe({
        next: (applications) => {
          console.log('📝 User applications updated:', applications.length);
          this.userApplications.set(applications);
        },
        error: (error) => {
          console.error('User applications subscription error:', error);
        }
      });

      console.log('✅ Permissions service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize permissions service:', error);
      this.error.set('Failed to initialize permissions service');
    }
  }

  private async loadUserContext(user: any) {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const userContext: UserContext = {
        id: user.id,
        userType: user.userType,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      };

      // If user is a funder, get their organization
      if (user.userType === 'funder') {
        try {
          const organizationId = await this.getUserOrganizationId(user.id);
          if (organizationId) {
            userContext.organizationId = organizationId;
          }
        } catch (orgError) {
          console.warn('Could not load organization for funder:', orgError);
          // Continue without organization - user can still view opportunities
        }
      }

      this.userContextSubject.next(userContext);

      // Load user applications if SME
      if (user.userType === 'sme') {
        try {
          await this.refreshUserApplications().toPromise();
        } catch (appError) {
          console.warn('Could not load applications:', appError);
          // Continue without applications - user can still view opportunities
        }
      }

    } catch (error) {
      console.error('Failed to load user context:', error);
      this.error.set('Failed to load user permissions');
      
      // Set a basic user context even if there are errors
      const basicContext: UserContext = {
        id: user.id,
        userType: user.userType || 'sme',
        email: user.email,
        firstName: user.firstName || 'User',
        lastName: user.lastName || ''
      };
      this.userContextSubject.next(basicContext);
      
    } finally {
      this.isLoading.set(false);
    }
  }

  private clearUserContext() {
    this.userContextSubject.next(null);
    this.userApplicationsSubject.next([]);
    this.error.set(null);
  }

  // ===============================
  // CORE PERMISSION METHODS
  // ===============================

  /**
   * Get comprehensive permissions for a specific opportunity
   */
  getOpportunityPermissions(opportunity: FundingOpportunity): Observable<OpportunityPermissions> {
    return this.userContext$.pipe(
      switchMap(context => {
        if (!context) {
          return of(this.getUnauthenticatedPermissions());
        }

        return this.calculatePermissions(opportunity, context);
      }),
      catchError(error => {
        console.error('Error calculating permissions:', error);
        return of(this.getErrorPermissions());
      })
    );
  }

  /**
   * Check if user can apply to a specific opportunity
   */
  canApplyToOpportunity(opportunity: FundingOpportunity): Observable<PermissionResult> {
    return this.userContext$.pipe(
      switchMap(context => {
        if (!context) {
          return of({ allowed: false, reason: 'Please log in to apply', requiresLogin: true });
        }

        return this.checkApplicationPermission(opportunity, context);
      })
    );
  }

  /**
   * Check if user can manage/edit a specific opportunity
   */
  canManageOpportunity(opportunity: FundingOpportunity): Observable<PermissionResult> {
    return this.userContext$.pipe(
      map(context => {
        if (!context) {
          return { allowed: false, reason: 'Authentication required', requiresLogin: true };
        }

        return this.checkManagementPermission(opportunity, context);
      })
    );
  }

  /**
   * Check if user has existing application for opportunity
   */
  hasExistingApplication(opportunityId: string): Observable<boolean> {
    return this.userApplications$.pipe(
      map(applications => applications.some(app => app.opportunityId === opportunityId))
    );
  }

  /**
   * Get user's application status for opportunity
   */
  getApplicationStatus(opportunityId: string): Observable<UserApplicationStatus | null> {
    return this.userApplications$.pipe(
      map(applications => applications.find(app => app.opportunityId === opportunityId) || null)
    );
  }

  // ===============================
  // PERMISSION CALCULATION LOGIC
  // ===============================

  private calculatePermissions(
    opportunity: FundingOpportunity,
    context: UserContext
  ): Observable<OpportunityPermissions> {
    // Check if user can manage this opportunity
    const canManage = this.checkManagementPermission(opportunity, context).allowed;

    if (canManage) {
      return of({
        canView: true,
        canApply: false,
        canManage: true,
        canEdit: true,
        hasExistingApplication: false,
        actionButtonType: 'manage',
        actionButtonText: 'Manage Applications'
      });
    }

    // For non-managers, check application permissions
    return this.checkApplicationPermission(opportunity, context).pipe(
      switchMap(applicationResult => {
        return this.hasExistingApplication(opportunity.id).pipe(
          map(hasApplication => {
            if (context.userType !== 'sme') {
              return {
                canView: true,
                canApply: false,
                canManage: false,
                canEdit: false,
                hasExistingApplication: false,
                actionButtonType: 'none' as const,
                actionButtonText: 'View Details',
                disabledReason: 'Only SME users can apply for funding'
              };
            }

            if (hasApplication) {
              return {
                canView: true,
                canApply: false,
                canManage: false,
                canEdit: false,
                hasExistingApplication: true,
                actionButtonType: 'view-application' as const,
                actionButtonText: 'View Application'
              };
            }

            if (applicationResult.allowed) {
              return {
                canView: true,
                canApply: true,
                canManage: false,
                canEdit: false,
                hasExistingApplication: false,
                actionButtonType: 'apply' as const,
                actionButtonText: 'Apply Now'
              };
            }

            return {
              canView: true,
              canApply: false,
              canManage: false,
              canEdit: false,
              hasExistingApplication: false,
              actionButtonType: 'none' as const,
              actionButtonText: 'Not Eligible',
              disabledReason: applicationResult.reason
            };
          })
        );
      })
    );
  }

  private checkManagementPermission(
    opportunity: FundingOpportunity,
    context: UserContext
  ): PermissionResult {
    // Only funders can manage opportunities
    if (context.userType !== 'funder') {
      return { allowed: false, reason: 'Only funders can manage opportunities' };
    }

    // Check if user created the opportunity
    if (opportunity.dealLead === context.id) {
      return { allowed: true };
    }

    // Check if user belongs to the same organization
    if (context.organizationId && opportunity.organizationId === context.organizationId) {
      return { allowed: true };
    }

    // Check if user is in deal team
    if (opportunity.dealTeam && Array.isArray(opportunity.dealTeam)) {
      if (opportunity.dealTeam.includes(context.id)) {
        return { allowed: true };
      }
    }

    return { allowed: false, reason: 'You do not have permission to manage this opportunity' };
  }

  private checkApplicationPermission(
    opportunity: FundingOpportunity,
    context: UserContext
  ): Observable<PermissionResult> {
    // Only SMEs can apply
    if (context.userType !== 'sme') {
      return of({ allowed: false, reason: 'Only SME users can apply for funding' });
    }

    // Users cannot apply to their own organization's opportunities
    if (context.organizationId && opportunity.organizationId === context.organizationId) {
      return of({ allowed: false, reason: 'You cannot apply to your own organization\'s opportunities' });
    }

    // Check if opportunity is still active and accepting applications
    if (opportunity.status !== 'active') {
      return of({ allowed: false, reason: 'This opportunity is no longer active' });
    }

    // Check application limits
    if (opportunity.maxApplications && 
        opportunity.currentApplications >= opportunity.maxApplications) {
      return of({ allowed: false, reason: 'This opportunity has reached its application limit' });
    }

    // Check application deadline
    if (opportunity.applicationDeadline && new Date() > opportunity.applicationDeadline) {
      return of({ allowed: false, reason: 'Application deadline has passed' });
    }

    return of({ allowed: true });
  }

  private getUnauthenticatedPermissions(): OpportunityPermissions {
    return {
      canView: true,
      canApply: false,
      canManage: false,
      canEdit: false,
      hasExistingApplication: false,
      actionButtonType: 'login',
      actionButtonText: 'Login to Apply'
    };
  }

  private getErrorPermissions(): OpportunityPermissions {
    return {
      canView: true,
      canApply: false,
      canManage: false,
      canEdit: false,
      hasExistingApplication: false,
      actionButtonType: 'none',
      actionButtonText: 'Error',
      disabledReason: 'Unable to determine permissions'
    };
  }

  // ===============================
  // APPLICATION MANAGEMENT
  // ===============================

  /**
   * Refresh user's application list from database
   */
  refreshUserApplications(): Observable<UserApplicationStatus[]> {
    const context = this.userContextSubject.value;
    if (!context || context.userType !== 'sme') {
      this.userApplicationsSubject.next([]);
      return of([]);
    }

    return from(this.loadUserApplicationsFromDatabase(context.id)).pipe(
      tap(applications => {
        this.userApplicationsSubject.next(applications);
      }),
      catchError(error => {
        console.error('Failed to refresh user applications:', error);
        return of([]);
      })
    );
  }

  /**
   * Add new application to user's list (call after successful application creation)
   */
  addUserApplication(application: UserApplicationStatus) {
    const current = this.userApplicationsSubject.value;
    const updated = [...current.filter(app => app.opportunityId !== application.opportunityId), application];
    this.userApplicationsSubject.next(updated);
  }

  /**
   * Update application status (call after status changes)
   */
  updateApplicationStatus(opportunityId: string, status: string) {
    const current = this.userApplicationsSubject.value;
    const updated = current.map(app => 
      app.opportunityId === opportunityId 
        ? { ...app, status: status as any }
        : app
    );
    this.userApplicationsSubject.next(updated);
  }

  // ===============================
  // DATABASE OPERATIONS
  // ===============================

  private async getUserOrganizationId(userId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabaseService
        .from('funder_organizations')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return null;
        }
        throw error;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error fetching user organization:', error);
      return null;
    }
  }

  private async loadUserApplicationsFromDatabase(userId: string): Promise<UserApplicationStatus[]> {
    try {
      // Check if applications table exists and user can access it
      console.log('Loading applications for user:', userId);
      
      const { data, error } = await this.supabaseService
        .from('applications')
        .select(`
          id,
          opportunity_id,
          status,
          created_at
        `)
        .eq('applicant_id', userId)
        .limit(10); // Add limit to prevent large queries

      if (error) {
        console.warn('Could not load applications:', error);
        // Return empty array instead of throwing - applications table might not exist yet
        return [];
      }

      return (data || []).map(app => ({
        opportunityId: app.opportunity_id,
        applicationId: app.id,
        status: app.status,
        appliedAt: new Date(app.created_at)
      }));

    } catch (error) {
      console.warn('Error loading user applications (table might not exist):', error);
      // Return empty array for graceful degradation
      return [];
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Check if current user is of specific type
   */
  isUserType(type: 'sme' | 'funder'): boolean {
    return this.userType() === type;
  }

  /**
   * Get current user context synchronously
   */
  getCurrentUserContext(): UserContext | null {
    return this.currentUserContext();
  }

  /**
   * Get all user applications synchronously
   */
  getUserApplications(): UserApplicationStatus[] {
    return this.userApplications();
  }

  /**
   * Check if user has permission for a specific action
   */
  hasPermission(action: 'apply' | 'manage' | 'view', opportunity: FundingOpportunity): Observable<boolean> {
    return this.getOpportunityPermissions(opportunity).pipe(
      map(permissions => {
        switch (action) {
          case 'apply': return permissions.canApply;
          case 'manage': return permissions.canManage;
          case 'view': return permissions.canView;
          default: return false;
        }
      })
    );
  }

  /**
   * Force reload of all user context and permissions
   */
  refreshUserContext(): Observable<void> {
    const user = this.authService.user();
    if (user) {
      this.loadUserContext(user);
    }
    return of(void 0);
  }

  /**
   * Clear all cached data (useful for logout)
   */
  clearCache() {
    this.userApplicationsSubject.next([]);
    this.error.set(null);
  }

  // ===============================
  // CONVENIENCE GETTERS
  // ===============================

  /**
   * Get quick access to common permission checks
   */
  get permissions() {
    return {
      isAuthenticated: this.isAuthenticated(),
      isSME: this.isUserType('sme'),
      isFunder: this.isUserType('funder'),
      userOrganizationId: this.userOrganizationId(),
      applicationCount: this.userApplications().length
    };
  }
}