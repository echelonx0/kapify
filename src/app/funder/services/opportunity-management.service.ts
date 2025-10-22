// src/app/funder/services/opportunity-management.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';  // ADD THIS IMPORT at top
import { AuthService } from '../../auth/production.auth.service'; 
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';

// Management-specific interfaces
interface OpportunityListItem {
  id: string;
  title: string;
  status: string;
  fundingType: string;
  totalAvailable: number;
  amountDeployed: number;
  currentApplications: number;
  maxApplications?: number;
  viewCount: number;
  applicationCount: number;
  conversionRate: number;
  publishedAt?: Date;
  updatedAt: Date;
}

interface OpportunityAnalytics {
  totalViews: number;
  totalApplications: number;
  averageConversionRate: number;
  topPerformingOpportunities: OpportunityListItem[];
  recentActivity: ActivityItem[];
  monthlyStats: MonthlyStats[];
}

interface ActivityItem {
  id: string;
  type: 'view' | 'application' | 'status_change';
  opportunityId: string;
  opportunityTitle: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface MonthlyStats {
  month: string;
  views: number;
  applications: number;
  conversions: number;
  revenue: number;
}

interface StatusUpdateRequest {
  opportunityId: string;
  newStatus: 'active' | 'paused' | 'closed';
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OpportunityManagementService {
   private supabaseService = inject(SharedSupabaseService); // Use shared service
  private authService = inject(AuthService);

  // State management
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  // Reactive data streams
  private opportunitiesSubject = new BehaviorSubject<OpportunityListItem[]>([]);
  opportunities$ = this.opportunitiesSubject.asObservable();
  
  private analyticsSubject = new BehaviorSubject<OpportunityAnalytics | null>(null);
  analytics$ = this.analyticsSubject.asObservable();

  constructor() {
  
  }

  // ===============================
  // OPPORTUNITY LIST MANAGEMENT
  // ===============================

  loadUserOpportunities(): Observable<OpportunityListItem[]> {
    this.isLoading.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.fetchUserOpportunities(currentAuth.id)).pipe(
      tap(opportunities => {
        this.opportunitiesSubject.next(opportunities);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to load opportunities');
        this.isLoading.set(false);
        console.error('Load opportunities error:', error);
        return throwError(() => error);
      })
    );
  }

  private async fetchUserOpportunities(userId: string): Promise<OpportunityListItem[]> {
    try {
      const { data, error } = await this.supabaseService
        .from('funding_opportunities')
        .select(`
          id, title, status, funding_type, total_available, amount_deployed,
          current_applications, max_applications, view_count, application_count,
          conversion_rate, published_at, updated_at
        `)
        .eq('created_by', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch opportunities: ${error.message}`);
      }

      return (data || []).map(item => ({
        id: item.id,
        title: item.title,
        status: item.status,
        fundingType: item.funding_type,
        totalAvailable: item.total_available,
        amountDeployed: item.amount_deployed,
        currentApplications: item.current_applications,
        maxApplications: item.max_applications,
        viewCount: item.view_count,
        applicationCount: item.application_count,
        conversionRate: item.conversion_rate || 0,
        publishedAt: item.published_at ? new Date(item.published_at) : undefined,
        updatedAt: new Date(item.updated_at)
      }));
    } catch (error) {
      console.error('Error fetching user opportunities:', error);
      throw error;
    }
  }

  // ===============================
  // STATUS MANAGEMENT
  // ===============================
 

deleteOpportunity(opportunityId: string): Observable<{success: boolean, message: string}> {
  const currentAuth = this.authService.user();
  if (!currentAuth) {
    return throwError(() => new Error('User not authenticated'));
  }

  return from(this.performDeletion(opportunityId, currentAuth.id)).pipe(
    tap(result => {
      if (result.success) {
        this.loadUserOpportunities().subscribe();
      }
    }),
    catchError(error => {
      this.error.set('Failed to delete opportunity');
      console.error('Deletion error:', error);
      return throwError(() => error);
    })
  );
}

private async performDeletion(
  opportunityId: string, 
  userId: string
): Promise<{success: boolean, message: string}> {
  try {
    // Soft delete - maintains audit trail
    const { error } = await this.supabaseService
      .from('funding_opportunities')
      .delete({ 
       
      })
      .eq('id', opportunityId)
      .eq('created_by', userId);

    if (error) {
      throw new Error(`Failed to delete opportunity: ${error.message}`);
    }

    await this.logActivity({
      id: `activity_${opportunityId}_delete`,
      type: 'status_change',
      opportunityId,
      opportunityTitle: opportunityId,
      description: 'Opportunity was deleted',
      timestamp: new Date()
    });

    return {
      success: true,
      message: 'Opportunity deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    throw error;
  }
}

// REPLACE the existing duplicateOpportunity method with this:

duplicateOpportunity(opportunityId: string): Observable<{success: boolean, newOpportunityId: string}> {
  const currentAuth = this.authService.user();
  if (!currentAuth) {
    return throwError(() => new Error('User not authenticated'));
  }

  return from(this.performDuplication(opportunityId, currentAuth.id)).pipe(
    tap(result => {
      if (result.success) {
        this.loadUserOpportunities().subscribe();
      }
    }),
    catchError(error => {
      this.error.set('Failed to duplicate opportunity');
      console.error('Duplication error:', error);
      return throwError(() => error);
    })
  );
}

private async performDuplication(
  opportunityId: string, 
  userId: string
): Promise<{success: boolean, newOpportunityId: string}> {
  try {
    // Fetch original opportunity
    const { data: original, error: fetchError } = await this.supabaseService
      .from('funding_opportunities')
      .select('*')
      .eq('id', opportunityId)
      .eq('created_by', userId)
      .single();

    if (fetchError || !original) {
      throw new Error('Opportunity not found or access denied');
    }

    // Create duplicate with proper UUID
    const newId = uuidv4();  // Use proper UUID generation
    const duplicateData = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      status: 'draft',
      published_at: null,
      closed_at: null,
      current_applications: 0,
      view_count: 0,
      application_count: 0,
      conversion_rate: 0,
      amount_committed: 0,
      amount_deployed: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await this.supabaseService
      .from('funding_opportunities')
      .insert(duplicateData);

    if (insertError) {
      throw new Error(`Failed to create duplicate: ${insertError.message}`);
    }

    return {
      success: true,
      newOpportunityId: newId
    };
  } catch (error) {
    console.error('Error duplicating opportunity:', error);
    throw error;
  }
}

  updateOpportunityStatus(request: StatusUpdateRequest): Observable<{success: boolean, message: string}> {
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.performStatusUpdate(request, currentAuth.id)).pipe(
      tap(response => {
        if (response.success) {
          // Refresh opportunities list
          this.loadUserOpportunities().subscribe();
        }
      }),
      catchError(error => {
        this.error.set('Failed to update opportunity status');
        console.error('Status update error:', error);
        return throwError(() => error);
      })
    );
  }

  private async performStatusUpdate(
    request: StatusUpdateRequest, 
    userId: string
  ): Promise<{success: boolean, message: string}> {
    try {
      const updateData: any = {
        status: request.newStatus,
        updated_at: new Date().toISOString()
      };

      // Set appropriate timestamps based on status
      if (request.newStatus === 'active' && !await this.isAlreadyPublished(request.opportunityId)) {
        updateData.published_at = new Date().toISOString();
      } else if (request.newStatus === 'closed') {
        updateData.closed_at = new Date().toISOString();
      }

      const { data, error } = await this.supabaseService
        .from('funding_opportunities')
        .update(updateData)
        .eq('id', request.opportunityId)
        .eq('created_by', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update status: ${error.message}`);
      }

      // Log activity
      await this.logActivity({
        type: 'status_change',
        opportunityId: request.opportunityId,
        opportunityTitle: data.title,
        description: `Status changed to ${request.newStatus}`,
        timestamp: new Date(),
        metadata: { oldStatus: data.status, newStatus: request.newStatus, reason: request.reason },
        id: ''
      });

      const statusMessages = {
        active: 'Opportunity is now active and visible to SMEs',
        paused: 'Opportunity has been paused and is no longer accepting applications',
        closed: 'Opportunity has been closed permanently'
      };

      return {
        success: true,
        message: statusMessages[request.newStatus]
      };
    } catch (error) {
      console.error('Error updating opportunity status:', error);
      throw error;
    }
  }

  private async isAlreadyPublished(opportunityId: string): Promise<boolean> {
    const { data } = await this.supabaseService
      .from('funding_opportunities')
      .select('published_at')
      .eq('id', opportunityId)
      .single();
    
    return !!data?.published_at;
  }

  // ===============================
  // ANALYTICS & REPORTING
  // ===============================

  loadAnalytics(timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'): Observable<OpportunityAnalytics> {
    this.isLoading.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.fetchAnalytics(currentAuth.id, timeframe)).pipe(
      tap(analytics => {
        this.analyticsSubject.next(analytics);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to load analytics');
        this.isLoading.set(false);
        console.error('Analytics load error:', error);
        return throwError(() => error);
      })
    );
  }

  private async fetchAnalytics(userId: string, timeframe: string): Promise<OpportunityAnalytics> {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch opportunity summary data
      const { data: opportunities, error: oppsError } = await this.supabaseService
        .from('funding_opportunities')
        .select('*')
        .eq('created_by', userId)
        .gte('created_at', startDate.toISOString());

      if (oppsError) {
        throw new Error(`Failed to fetch analytics: ${oppsError.message}`);
      }

      const totalViews = opportunities?.reduce((sum, opp) => sum + (opp.view_count || 0), 0) || 0;
      const totalApplications = opportunities?.reduce((sum, opp) => sum + (opp.application_count || 0), 0) || 0;
      const averageConversionRate = opportunities?.length > 0 
        ? opportunities.reduce((sum, opp) => sum + (opp.conversion_rate || 0), 0) / opportunities.length 
        : 0;

      // Get top performing opportunities
      const topPerforming = opportunities
        ?.sort((a, b) => (b.conversion_rate || 0) - (a.conversion_rate || 0))
        .slice(0, 5)
        .map(opp => ({
          id: opp.id,
          title: opp.title,
          status: opp.status,
          fundingType: opp.funding_type,
          totalAvailable: opp.total_available,
          amountDeployed: opp.amount_deployed,
          currentApplications: opp.current_applications,
          maxApplications: opp.max_applications,
          viewCount: opp.view_count,
          applicationCount: opp.application_count,
          conversionRate: opp.conversion_rate || 0,
          publishedAt: opp.published_at ? new Date(opp.published_at) : undefined,
          updatedAt: new Date(opp.updated_at)
        })) || [];

      // Generate monthly stats (simplified for now)
      const monthlyStats = await this.generateMonthlyStats(userId, startDate, endDate);

      // Fetch recent activity
      const recentActivity = await this.fetchRecentActivity(userId);

      return {
        totalViews,
        totalApplications,
        averageConversionRate,
        topPerformingOpportunities: topPerforming,
        recentActivity,
        monthlyStats
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  private async generateMonthlyStats(userId: string, startDate: Date, endDate: Date): Promise<MonthlyStats[]> {
    // This is a simplified implementation
    // In a real application, you might want to use a separate analytics table
    const months = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
      
      const { data } = await this.supabaseService
        .from('funding_opportunities')
        .select('view_count, application_count, amount_deployed')
        .eq('created_by', userId)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      const monthData = data || [];
      const views = monthData.reduce((sum, item) => sum + (item.view_count || 0), 0);
      const applications = monthData.reduce((sum, item) => sum + (item.application_count || 0), 0);
      const revenue = monthData.reduce((sum, item) => sum + (item.amount_deployed || 0), 0);

      months.push({
        month: current.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        views,
        applications,
        conversions: Math.floor(applications * 0.15), // Simplified conversion calculation
        revenue
      });

      current.setMonth(current.getMonth() + 1);
    }

    return months;
  }

  private async fetchRecentActivity(userId: string): Promise<ActivityItem[]> {
    // This would ideally come from a dedicated activity log table
    // For now, we'll generate from opportunity updates
    const { data } = await this.supabaseService
      .from('funding_opportunities')
      .select('id, title, status, updated_at, published_at')
      .eq('created_by', userId)
      .order('updated_at', { ascending: false })
      .limit(10);

    return (data || []).map(opp => ({
      id: `activity_${opp.id}`,
      type: 'status_change' as const,
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      description: `Opportunity "${opp.title}" was updated`,
      timestamp: new Date(opp.updated_at),
      metadata: { status: opp.status }
    }));
  }

  // ===============================
  // BULK OPERATIONS
  // ===============================

  bulkUpdateStatus(
    opportunityIds: string[], 
    newStatus: 'active' | 'paused' | 'closed'
  ): Observable<{success: boolean, updated: number, failed: number}> {
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.performBulkStatusUpdate(opportunityIds, newStatus, currentAuth.id)).pipe(
      tap(result => {
        if (result.success) {
          // Refresh opportunities list
          this.loadUserOpportunities().subscribe();
        }
      }),
      catchError(error => {
        this.error.set('Failed to update opportunities');
        console.error('Bulk update error:', error);
        return throwError(() => error);
      })
    );
  }

  private async performBulkStatusUpdate(
    opportunityIds: string[], 
    newStatus: string, 
    userId: string
  ): Promise<{success: boolean, updated: number, failed: number}> {
    try {
      const { data, error } = await this.supabaseService
        .from('funding_opportunities')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .in('id', opportunityIds)
        .eq('created_by', userId)
        .select('id');

      if (error) {
        throw new Error(`Bulk update failed: ${error.message}`);
      }

      const updated = data?.length || 0;
      const failed = opportunityIds.length - updated;

      return {
        success: true,
        updated,
        failed
      };
    } catch (error) {
      console.error('Error in bulk status update:', error);
      throw error;
    }
  }

  // ===============================
  // DUPLICATE OPPORTUNITY
  // ===============================

 

  // ===============================
  // UTILITY METHODS
  // ===============================

  private async logActivity(activity: ActivityItem): Promise<void> {
    // In a real application, you'd log to an activity table
    console.log('Activity logged:', activity);
  }

  incrementViewCount(opportunityId: string): Observable<void> {
    return from(this.supabaseService.rpc('increment_opportunity_views', { 
      opportunity_id: opportunityId 
    })).pipe(
      map(() => void 0),
      catchError(error => {
        console.error('Failed to increment view count:', error);
        return throwError(() => error);
      })
    );
  }

  // Get current opportunities (cached)
  getCurrentOpportunities(): OpportunityListItem[] {
    return this.opportunitiesSubject.value;
  }

  // Get current analytics (cached)
  getCurrentAnalytics(): OpportunityAnalytics | null {
    return this.analyticsSubject.value;
  }
}