import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject, Subject } from 'rxjs';
import { map, tap, catchError, startWith } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface Activity {
  id: string;
  user_id: string;
  organization_id?: string;
  type:
    | 'application'
    | 'funding'
    | 'profile'
    | 'document'
    | 'system'
    | 'partnership'
    | 'milestone';
  action: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  amount?: number;
  status: 'completed' | 'pending' | 'failed';
  method?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ActivityFilters {
  dateRange?: { start: Date; end: Date };
  types?: Activity['type'][];
  status?: Activity['status'][];
  search?: string;
}

export interface PaginatedResponse {
  data: Activity[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

@Injectable({ providedIn: 'root' })
export class ActivityRepositoryService {
  private supabase = inject(SharedSupabaseService);
  private destroy$ = new Subject<void>();

  private activitiesSubject = new BehaviorSubject<Activity[]>([]);
  activities$ = this.activitiesSubject.asObservable();

  private readonly PAGE_SIZE = 50;

  /**
   * Fetch paginated activities for current user with filters
   */
  getActivitiesPaginated(
    page: number = 1,
    filters?: ActivityFilters
  ): Observable<PaginatedResponse> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.performFetchPaginated(userId, page, filters)).pipe(
      tap((response) => {
        // Update local cache if on first page
        if (page === 1) {
          this.activitiesSubject.next(response.data);
        }
      }),
      catchError((error) => {
        console.error('Failed to fetch activities:', error);
        return throwError(
          () => new Error(`Failed to load activities: ${error?.message}`)
        );
      })
    );
  }

  /**
   * Get all activities for current user (for exports, etc)
   */
  getAllActivities(filters?: ActivityFilters): Observable<Activity[]> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.performFetchAll(userId, filters)).pipe(
      tap((activities) => this.activitiesSubject.next(activities)),
      catchError((error) => {
        console.error('Failed to fetch all activities:', error);
        return throwError(
          () => new Error(`Failed to load activities: ${error?.message}`)
        );
      })
    );
  }

  /**
   * Real-time subscription to activities
   */
  subscribeToActivities(): Observable<Activity[]> {
    return this.activitiesSubject.asObservable().pipe(startWith([]));
  }

  /**
   * Create new activity
   */
  createActivity(
    activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>
  ): Observable<Activity> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    const newActivity = {
      ...activity,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return from(this.performCreate(newActivity)).pipe(
      tap((created) => {
        // Prepend to activity stream
        const current = this.activitiesSubject.value;
        this.activitiesSubject.next([created, ...current]);
      }),
      catchError((error) => {
        console.error('Failed to create activity:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Perform paginated fetch with proper indexing
   */
  private async performFetchPaginated(
    userId: string,
    page: number,
    filters?: ActivityFilters | undefined
  ): Promise<PaginatedResponse> {
    const offset = (page - 1) * this.PAGE_SIZE;

    // Build base query using optimized index: idx_activities_user_created
    let countQuery = this.supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    let dataQuery = this.supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + this.PAGE_SIZE - 1);

    // Apply filters only if provided
    if (filters) {
      if (filters.types && filters.types.length > 0) {
        countQuery = countQuery.in('type', filters.types);
        dataQuery = dataQuery.in('type', filters.types);
      }

      if (filters.status && filters.status.length > 0) {
        countQuery = countQuery.in('status', filters.status);
        dataQuery = dataQuery.in('status', filters.status);
      }

      if (filters.dateRange) {
        const startDate = filters.dateRange.start.toISOString();
        const endDate = filters.dateRange.end.toISOString();
        countQuery = countQuery
          .gte('created_at', startDate)
          .lte('created_at', endDate);
        dataQuery = dataQuery
          .gte('created_at', startDate)
          .lte('created_at', endDate);
      }

      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        countQuery = countQuery.ilike('message', searchTerm);
        dataQuery = dataQuery.ilike('message', searchTerm);
      }
    }

    // Execute queries
    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (countResult.error) throw countResult.error;
    if (dataResult.error) throw dataResult.error;

    const total = countResult.count || 0;
    const data = (dataResult.data || []) as Activity[];

    return {
      data,
      total,
      page,
      pageSize: this.PAGE_SIZE,
      hasMore: offset + this.PAGE_SIZE < total,
    };
  }

  /**
   * Fetch all activities (for exports)
   */
  private async performFetchAll(
    userId: string,
    filters?: ActivityFilters | undefined
  ): Promise<Activity[]> {
    let query = this.supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters only if provided
    if (filters) {
      if (filters.types && filters.types.length > 0) {
        query = query.in('type', filters.types);
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters.dateRange) {
        const startDate = filters.dateRange.start.toISOString();
        const endDate = filters.dateRange.end.toISOString();
        query = query.gte('created_at', startDate).lte('created_at', endDate);
      }

      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.ilike('message', searchTerm);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []) as Activity[];
  }

  /**
   * Create activity in database
   */
  private async performCreate(
    activity: Omit<Activity, 'id'>
  ): Promise<Activity> {
    const { data, error } = await this.supabase
      .from('activities')
      .insert([activity])
      .select()
      .single();

    if (error) throw error;
    return data as Activity;
  }

  /**
   * Clear local cache
   */
  clearCache(): void {
    this.activitiesSubject.next([]);
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.activitiesSubject.complete();
  }
}
