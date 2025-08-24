// src/app/shared/services/database-activity.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
 
import { AuthService } from '../../auth/production.auth.service';
import { SharedSupabaseService } from './supabase.service';

// Updated Activity interface to match database schema
export interface Activity {
  id: string;
  userId: string;
  organizationId?: string;
  type: 'funding' | 'partnership' | 'milestone' | 'system' | 'application' | 'profile' | 'document';
  action: string; // More specific action like 'created', 'updated', 'submitted'
  message: string;
  entityType?: string; // What was acted upon: 'application', 'opportunity', 'profile'
  entityId?: string; // ID of the entity acted upon
  amount?: number; // stored in cents
  status: 'completed' | 'pending' | 'failed';
  method?: string;
  metadata?: Record<string, any>; // Additional context data
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

// Database interface matching Supabase schema
interface DatabaseActivity {
  id: string;
  user_id: string;
  organization_id?: string;
  type: string;
  action: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  amount?: number;
  status: string;
  method?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class DatabaseActivityService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  // State management
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  // Reactive data streams
  private activitiesSubject = new BehaviorSubject<Activity[]>([]);
  activities$ = this.activitiesSubject.asObservable();

  constructor() {
     
  }

  // ===============================
  // GET ACTIVITIES
  // ===============================

  /**
   * Fetch the latest activities for the current user and their organization
   */
  getActivities(limit: number = 20): Observable<Activity[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchActivitiesFromDatabase(limit)).pipe(
      tap(activities => {
        this.activitiesSubject.next(activities);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to load activities');
        this.isLoading.set(false);
        console.error('Load activities error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get activities with pagination
   */
  getActivitiesPaged(page: number, pageSize: number): Observable<{
    activities: Activity[];
    total: number;
    hasMore: boolean;
  }> {
    return from(this.fetchActivitiesPaged(page, pageSize)).pipe(
      catchError(error => {
        this.error.set('Failed to load paginated activities');
        console.error('Load paginated activities error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get activity by ID
   */
  getActivityById(id: string): Observable<Activity | null> {
    return from(this.fetchActivityById(id)).pipe(
      catchError(error => {
        this.error.set('Failed to load activity details');
        console.error('Fetch activity error:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // CREATE ACTIVITIES
  // ===============================

  /**
   * Create a new activity entry
   */
  createActivity(activityData: {
    type: Activity['type'];
    action: string;
    message: string;
    entityType?: string;
    entityId?: string;
    amount?: number;
    status?: Activity['status'];
    method?: string;
    metadata?: Record<string, any>;
  }): Observable<Activity> {
    return from(this.insertActivity(activityData)).pipe(
      tap(newActivity => {
        // Update local cache
        const currentActivities = this.activitiesSubject.value;
        this.activitiesSubject.next([newActivity, ...currentActivities]);
      }),
      catchError(error => {
        this.error.set('Failed to create activity');
        console.error('Create activity error:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // CONVENIENCE METHODS FOR TRACKING SPECIFIC ACTIONS
  // ===============================

  /**
   * Track application-related activities
   */
  trackApplicationActivity(
    action: 'created' | 'updated' | 'submitted' | 'approved' | 'rejected' | 'withdrawn',
    applicationId: string,
    message: string,
    amount?: number
  ): void {
    this.createActivity({
      type: 'application',
      action,
      message,
      entityType: 'application',
      entityId: applicationId,
      amount,
      status: 'completed'
    }).subscribe({
      next: () => console.log(`Application activity tracked: ${action}`),
      error: (error) => console.error('Failed to track application activity:', error)
    });
  }

  /**
   * Track funding-related activities
   */
  trackFundingActivity(
    action: 'approved' | 'disbursed' | 'repaid' | 'defaulted',
    message: string,
    amount: number,
    entityId?: string,
    method?: string
  ): void {
    this.createActivity({
      type: 'funding',
      action,
      message,
      entityType: 'funding',
      entityId,
      amount,
      method,
      status: 'completed'
    }).subscribe({
      next: () => console.log(`Funding activity tracked: ${action}`),
      error: (error) => console.error('Failed to track funding activity:', error)
    });
  }

  /**
   * Track profile-related activities
   */
  trackProfileActivity(
    action: 'created' | 'updated' | 'completed' | 'verified',
    message: string,
    profileSection?: string
  ): void {
    this.createActivity({
      type: 'profile',
      action,
      message,
      entityType: 'profile',
      metadata: profileSection ? { section: profileSection } : undefined,
      status: 'completed'
    }).subscribe({
      next: () => console.log(`Profile activity tracked: ${action}`),
      error: (error) => console.error('Failed to track profile activity:', error)
    });
  }

  /**
   * Track document-related activities
   */
  trackDocumentActivity(
    action: 'uploaded' | 'updated' | 'verified' | 'rejected',
    message: string,
    documentId?: string,
    documentType?: string
  ): void {
    this.createActivity({
      type: 'document',
      action,
      message,
      entityType: 'document',
      entityId: documentId,
      metadata: documentType ? { documentType } : undefined,
      status: 'completed'
    }).subscribe({
      next: () => console.log(`Document activity tracked: ${action}`),
      error: (error) => console.error('Failed to track document activity:', error)
    });
  }

  /**
   * Track system activities
   */
  trackSystemActivity(
    action: string,
    message: string,
    metadata?: Record<string, any>
  ): void {
    this.createActivity({
      type: 'system',
      action,
      message,
      metadata,
      status: 'completed'
    }).subscribe({
      next: () => console.log(`System activity tracked: ${action}`),
      error: (error) => console.error('Failed to track system activity:', error)
    });
  }

  // ===============================
  // DATABASE OPERATIONS
  // ===============================

  private async fetchActivitiesFromDatabase(limit: number): Promise<Activity[]> {
    try {
      const currentUser = this.authService.user();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Get user's organization ID (if any)
      const organizationId = await this.getUserOrganizationId(currentUser.id);

      // Query for activities - simplified without complex joins
      let query = this.supabase
        .from('activities')
        .select('*') // Just select from activities table, no joins for now
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by user ID and optionally organization ID
      if (organizationId) {
        query = query.or(`user_id.eq.${currentUser.id},organization_id.eq.${organizationId}`);
      } else {
        query = query.eq('user_id', currentUser.id);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch activities: ${error.message}`);
      }

      console.log(`Fetched ${data?.length || 0} activities`);
      return data?.map(item => this.transformDatabaseToLocal(item)) || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }

  private async fetchActivitiesPaged(page: number, pageSize: number): Promise<{
    activities: Activity[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const currentUser = this.authService.user();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const organizationId = await this.getUserOrganizationId(currentUser.id);
      const offset = (page - 1) * pageSize;

      // Get total count - simplified
      let countQuery = this.supabase
        .from('activities')
        .select('*', { count: 'exact', head: true });

      if (organizationId) {
        countQuery = countQuery.or(`user_id.eq.${currentUser.id},organization_id.eq.${organizationId}`);
      } else {
        countQuery = countQuery.eq('user_id', currentUser.id);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        throw new Error(`Failed to count activities: ${countError.message}`);
      }

      // Get paginated data - simplified
      let dataQuery = this.supabase
        .from('activities')
        .select('*') // No joins
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (organizationId) {
        dataQuery = dataQuery.or(`user_id.eq.${currentUser.id},organization_id.eq.${organizationId}`);
      } else {
        dataQuery = dataQuery.eq('user_id', currentUser.id);
      }

      const { data, error } = await dataQuery;

      if (error) {
        throw new Error(`Failed to fetch paginated activities: ${error.message}`);
      }

      const activities = data?.map(item => this.transformDatabaseToLocal(item)) || [];
      const total = count || 0;
      const hasMore = offset + pageSize < total;

      return { activities, total, hasMore };
    } catch (error) {
      console.error('Error fetching paginated activities:', error);
      throw error;
    }
  }

  private async fetchActivityById(id: string): Promise<Activity | null> {
    try {
      const currentUser = this.authService.user();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('activities')
        .select('*') // No joins
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        throw new Error(`Failed to fetch activity: ${error.message}`);
      }

      return this.transformDatabaseToLocal(data);
    } catch (error) {
      console.error('Error fetching activity by ID:', error);
      throw error;
    }
  }

  private async insertActivity(activityData: {
    type: Activity['type'];
    action: string;
    message: string;
    entityType?: string;
    entityId?: string;
    amount?: number;
    status?: Activity['status'];
    method?: string;
    metadata?: Record<string, any>;
  }): Promise<Activity> {
    try {
      const currentUser = this.authService.user();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const organizationId = await this.getUserOrganizationId(currentUser.id);

      const dbActivity: Partial<DatabaseActivity> = {
        user_id: currentUser.id,
        organization_id: organizationId || undefined,
        type: activityData.type,
        action: activityData.action,
        message: activityData.message,
        entity_type: activityData.entityType,
        entity_id: activityData.entityId,
        amount: activityData.amount,
        status: activityData.status || 'completed',
        method: activityData.method,
        metadata: activityData.metadata
      };

      const { data, error } = await this.supabase
        .from('activities')
        .insert(dbActivity)
        .select('*') // No joins
        .single();

      if (error) {
        throw new Error(`Failed to create activity: ${error.message}`);
      }

      return this.transformDatabaseToLocal(data);
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  private async getUserOrganizationId(userId: string): Promise<string | null> {
    try {
      // Check both SME and Funder organizations
      const [smeResult, funderResult] = await Promise.all([
        this.supabase
          .from('sme_organizations')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single(),
        
        this.supabase
          .from('funder_organizations')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'active')
          .single()
      ]);

      // Return whichever organization exists (SME takes precedence)
      if (!smeResult.error) {
        return smeResult.data?.id || null;
      } else if (!funderResult.error) {
        return funderResult.data?.id || null;
      }

      return null;
    } catch (error) {
      console.warn('Could not fetch user organization:', error);
      return null;
    }
  }

  // ===============================
  // DATA TRANSFORMATION
  // ===============================

  private transformDatabaseToLocal(dbActivity: any): Activity {
    const userData = dbActivity.users?.raw_user_meta_data || {};
    
    return {
      id: dbActivity.id,
      userId: dbActivity.user_id,
      organizationId: dbActivity.organization_id,
      type: dbActivity.type,
      action: dbActivity.action,
      message: dbActivity.message,
      entityType: dbActivity.entity_type,
      entityId: dbActivity.entity_id,
      amount: dbActivity.amount,
      status: dbActivity.status,
      method: dbActivity.method,
      metadata: dbActivity.metadata,
      createdAt: new Date(dbActivity.created_at),
      updatedAt: new Date(dbActivity.updated_at),
      user: {
        id: dbActivity.users?.id || dbActivity.user_id,
        name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown User',
        email: userData.email || dbActivity.users?.email || '',
        avatarUrl: userData.avatarUrl
      }
    };
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Format amount for display in Rand
   */
  formatAmount(amount: number): string {
    return `R${(Math.abs(amount) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }

  /**
   * Format relative time
   */
  formatRelativeTime(timestamp: Date | string): string {
    const now = new Date();
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  }

  /**
   * Get activity type display name
   */
  getActivityTypeDisplayName(type: Activity['type']): string {
    const typeMap: Record<Activity['type'], string> = {
      'funding': 'Funding',
      'partnership': 'Partnership',
      'milestone': 'Milestone',
      'system': 'System',
      'application': 'Application',
      'profile': 'Profile',
      'document': 'Document'
    };
    
    return typeMap[type] || 'Activity';
  }

  /**
   * Get activity type color for UI
   */
  getActivityTypeColor(type: Activity['type']): string {
    const colorMap: Record<Activity['type'], string> = {
      'funding': 'green',
      'partnership': 'blue',
      'milestone': 'purple',
      'system': 'gray',
      'application': 'orange',
      'profile': 'cyan',
      'document': 'yellow'
    };
    
    return colorMap[type] || 'gray';
  }

  /**
   * Clear local cache
   */
  clearCache(): void {
    this.activitiesSubject.next([]);
    this.error.set(null);
  }

  /**
   * Get current activities from cache
   */
  getCurrentActivities(): Activity[] {
    return this.activitiesSubject.value;
  }
}