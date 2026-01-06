import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import {
  AnalysisHistoryItem,
  AIAnalysisSummary,
  AnalysisHistoryFilter,
  AIAnalysisRequest,
} from '../document-analysis/analysis-interface.component';

@Injectable({
  providedIn: 'root',
})
export class AIAnalysisHistoryService {
  private supabase = inject(SharedSupabaseService);

  // State
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Cache
  private analysisHistorySubject = new BehaviorSubject<AnalysisHistoryItem[]>(
    []
  );
  analysisHistory$ = this.analysisHistorySubject.asObservable();

  /**
   * Get AI analysis summary metrics for current user + organization
   */
  getAnalysisSummary(): Observable<AIAnalysisSummary> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchAnalysisSummary()).pipe(
      tap(() => this.isLoading.set(false)),
      catchError((error) => {
        this.isLoading.set(false);
        const message = error?.message || 'Failed to load analysis summary';
        this.error.set(message);
        console.error('❌ [ANALYSIS] Error fetching summary:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single analysis by ID
   */
  getAnalysisById(analysisId: string): Observable<AIAnalysisRequest> {
    return from(this.fetchAnalysisById(analysisId)).pipe(
      catchError((error) => {
        console.error('❌ [ANALYSIS] Error fetching analysis:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // PRIVATE METHODS
  // ===============================

  /**
   * Fetch analysis summary from database
   */
  private async fetchAnalysisSummary(): Promise<AIAnalysisSummary> {
    try {
      const userId = this.supabase.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const orgUserIds = await this.getOrganizationUserIds(userId);

      // Fetch ai_analysis_requests
      const { data: analyses } = await this.supabase
        .from('ai_analysis_requests')
        .select('*')
        .in('user_id', orgUserIds);

      // Fetch document_analysis_results
      const { data: docAnalyses } = await this.supabase
        .from('document_analysis_results')
        .select('*')
        .in('user_id', orgUserIds);

      // Combine counts
      const aiCount = analyses?.length || 0;
      const docCount = docAnalyses?.length || 0;
      const totalAnalyses = aiCount + docCount;

      const freeAnalyses =
        (analyses?.filter((a) => a.was_free).length || 0) + docCount; // All doc analyses are free

      const paidAnalyses = totalAnalyses - freeAnalyses;

      const totalCreditsSpent =
        analyses?.reduce((sum, a) => sum + (a.cost_credits || 0), 0) || 0;

      const averageCostPerAnalysis =
        paidAnalyses > 0 ? Math.round(totalCreditsSpent / paidAnalyses) : 0;

      // Get most recent date from both tables
      const allDates = [
        ...(analyses?.map((a) => new Date(a.created_at)) || []),
        ...(docAnalyses?.map((d) => new Date(d.created_at)) || []),
      ].sort((a, b) => b.getTime() - a.getTime());

      const lastAnalysisDate = allDates[0];

      const pendingAnalyses =
        analyses?.filter((a) => a.status === 'pending').length || 0;
      const failedAnalyses =
        analyses?.filter((a) => a.status === 'failed').length || 0;

      return {
        totalAnalyses,
        freeAnalyses,
        paidAnalyses,
        totalCreditsSpent,
        averageCostPerAnalysis,
        lastAnalysisDate,
        pendingAnalyses,
        failedAnalyses,
      };
    } catch (error) {
      console.error('❌ [ANALYSIS] Error in fetchAnalysisSummary:', error);
      throw error;
    }
  }

  /**
   * Fetch analysis history with enrichment
   */
  private async fetchAnalysisHistory(
    filters?: AnalysisHistoryFilter
  ): Promise<AnalysisHistoryItem[]> {
    try {
      const userId = this.supabase.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get organization user IDs
      const orgUserIds = await this.getOrganizationUserIds(userId);

      console.log('📜 [ANALYSIS] Fetching history for:', {
        userId,
        orgUserIds,
        filters,
      });

      // Build query
      let query = this.supabase
        .from('ai_analysis_requests')
        .select('*')
        .in('user_id', orgUserIds);

      // Apply filters
      if (filters?.requestType && filters.requestType.length > 0) {
        query = query.in('request_type', filters.requestType);
      }

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }

      if (filters?.showFreeOnly) {
        query = query.eq('was_free', true);
      }

      if (filters?.showPaidOnly) {
        query = query.eq('was_free', false);
      }

      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString());
      }

      const { data: analysesRaw, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Failed to fetch history: ${error.message}`);
      }

      if (!analysesRaw || analysesRaw.length === 0) {
        return [];
      }

      // Transform to camelCase
      const analyses = analysesRaw.map((a) =>
        this.transformDatabaseToAnalysis(a)
      );

      // Enrich with application/opportunity names
      const enriched = await this.enrichAnalysisHistory(analyses);

      // Apply search filter (client-side)
      let results = enriched;
      if (filters?.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        results = results.filter(
          (a) =>
            a.applicationTitle?.toLowerCase().includes(searchLower) ||
            a.opportunityTitle?.toLowerCase().includes(searchLower) ||
            a.userName?.toLowerCase().includes(searchLower)
        );
      }

      console.log('✅ [ANALYSIS] History fetched:', results.length);

      return results;
    } catch (error) {
      console.error('❌ [ANALYSIS] Error in fetchAnalysisHistory:', error);
      throw error;
    }
  }

  /**
   * Fetch single analysis by ID
   */
  private async fetchAnalysisById(
    analysisId: string
  ): Promise<AIAnalysisRequest> {
    try {
      const { data, error } = await this.supabase
        .from('ai_analysis_requests')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error || !data) {
        throw new Error('Analysis not found');
      }

      return this.transformDatabaseToAnalysis(data);
    } catch (error) {
      console.error('❌ [ANALYSIS] Error fetching analysis by ID:', error);
      throw error;
    }
  }

  /**
   * Get organization user IDs (including current user)
   */
  private async getOrganizationUserIds(userId: string): Promise<string[]> {
    try {
      // Get user's organizations
      const { data: orgUsers, error: orgError } = await this.supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (orgError) {
        console.warn('⚠️ [ANALYSIS] Error fetching org membership:', orgError);
        return [userId]; // Fallback to just current user
      }

      if (!orgUsers || orgUsers.length === 0) {
        return [userId]; // User not in any org
      }

      const orgIds = orgUsers.map((ou) => ou.organization_id);

      // Get all users in these organizations
      const { data: allOrgUsers, error: allUsersError } = await this.supabase
        .from('organization_users')
        .select('user_id')
        .in('organization_id', orgIds)
        .eq('status', 'active');

      if (allUsersError) {
        console.warn('⚠️ [ANALYSIS] Error fetching org users:', allUsersError);
        return [userId];
      }

      const userIds = [
        ...new Set(allOrgUsers?.map((ou) => ou.user_id).filter(Boolean) || []),
      ];

      // Always include current user
      if (!userIds.includes(userId)) {
        userIds.push(userId);
      }

      console.log('👥 [ANALYSIS] Organization user IDs:', userIds.length);

      return userIds;
    } catch (error) {
      console.error('❌ [ANALYSIS] Error getting org user IDs:', error);
      return [userId]; // Fallback to current user only
    }
  }

  /**
   * Enrich analysis history with names
   */
  private async enrichAnalysisHistory(
    analyses: AIAnalysisRequest[]
  ): Promise<AnalysisHistoryItem[]> {
    try {
      // Extract unique IDs
      const applicationIds = [
        ...new Set(
          analyses
            .map((a) => a.applicationId)
            .filter((id): id is string => !!id)
        ),
      ];
      const opportunityIds = [
        ...new Set(
          analyses
            .map((a) => a.opportunityId)
            .filter((id): id is string => !!id)
        ),
      ];
      const userIds = [
        ...new Set(analyses.map((a) => a.userId).filter(Boolean)),
      ];

      // Batch fetch names
      const [applications, opportunities, users] = await Promise.all([
        applicationIds.length > 0
          ? this.fetchApplicationTitles(applicationIds)
          : Promise.resolve(new Map()),
        opportunityIds.length > 0
          ? this.fetchOpportunityTitles(opportunityIds)
          : Promise.resolve(new Map()),
        userIds.length > 0
          ? this.fetchUserNames(userIds)
          : Promise.resolve(new Map()),
      ]);

      // Enrich analyses
      return analyses.map((analysis) => ({
        ...analysis,
        applicationTitle: analysis.applicationId
          ? applications.get(analysis.applicationId)
          : undefined,
        opportunityTitle: analysis.opportunityId
          ? opportunities.get(analysis.opportunityId)
          : undefined,
        userName: users.get(analysis.userId),
        hasResults: !!(analysis.analysisResults || analysis.investmentScore),
        canDownload:
          analysis.status === 'executed_free' ||
          analysis.status === 'executed_paid',
      }));
    } catch (error) {
      console.warn('⚠️ [ANALYSIS] Error enriching history:', error);
      // Return un-enriched if enrichment fails
      return analyses.map((analysis) => ({
        ...analysis,
        hasResults: !!(analysis.analysisResults || analysis.investmentScore),
        canDownload:
          analysis.status === 'executed_free' ||
          analysis.status === 'executed_paid',
      }));
    }
  }

  /**
   * Fetch application titles
   */
  private async fetchApplicationTitles(
    ids: string[]
  ): Promise<Map<string, string>> {
    const { data } = await this.supabase
      .from('applications')
      .select('id, title')
      .in('id', ids);

    const map = new Map<string, string>();
    data?.forEach((app) => map.set(app.id, app.title));
    return map;
  }

  /**
   * Fetch opportunity titles
   */
  private async fetchOpportunityTitles(
    ids: string[]
  ): Promise<Map<string, string>> {
    const { data } = await this.supabase
      .from('funding_opportunities')
      .select('id, title')
      .in('id', ids);

    const map = new Map<string, string>();
    data?.forEach((opp) => map.set(opp.id, opp.title));
    return map;
  }

  /**
   * Fetch user names
   */
  private async fetchUserNames(ids: string[]): Promise<Map<string, string>> {
    const { data } = await this.supabase
      .from('users')
      .select('id, first_name, last_name')
      .in('id', ids);

    const map = new Map<string, string>();
    data?.forEach((user) =>
      map.set(user.id, `${user.first_name} ${user.last_name}`)
    );
    return map;
  }

  /**
   * Transform database response to camelCase
   */
  private transformDatabaseToAnalysis(dbRow: any): AIAnalysisRequest {
    return {
      id: dbRow.id,
      orgId: dbRow.org_id,
      userId: dbRow.user_id,
      requestType: dbRow.request_type,
      status: dbRow.status,
      costCredits: dbRow.cost_credits || 0,
      wasFree: dbRow.was_free,
      applicationData: dbRow.application_data,
      opportunityData: dbRow.opportunity_data,
      profileData: dbRow.profile_data,
      analysisResults: dbRow.analysis_results,
      investmentScore: dbRow.investment_score,
      createdAt: new Date(dbRow.created_at),
      executedAt: dbRow.executed_at ? new Date(dbRow.executed_at) : undefined,
      errorMessage: dbRow.error_message,
      applicationId: dbRow.application_id,
      opportunityId: dbRow.opportunity_id,
    };
  }

  /**
   * Get empty summary (no analyses found)
   */
  private getEmptySummary(): AIAnalysisSummary {
    return {
      totalAnalyses: 0,
      freeAnalyses: 0,
      paidAnalyses: 0,
      totalCreditsSpent: 0,
      averageCostPerAnalysis: 0,
      pendingAnalyses: 0,
      failedAnalyses: 0,
    };
  }

  /**
   * Fetch from both ai_analysis_requests AND document_analysis_results
   */
  private async fetchAnalysisHistoryCombined(
    filters?: AnalysisHistoryFilter
  ): Promise<AnalysisHistoryItem[]> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const orgUserIds = await this.getOrganizationUserIds(userId);

    // Fetch from ai_analysis_requests (existing)
    const aiAnalyses = await this.fetchAnalysisHistory(filters);

    // Fetch from document_analysis_results
    const { data: docAnalysesRaw } = await this.supabase
      .from('document_analysis_results')
      .select('*')
      .in('user_id', orgUserIds)
      .order('created_at', { ascending: false });

    // Transform document analyses to match interface
    const docAnalyses: AnalysisHistoryItem[] = (docAnalysesRaw || []).map(
      (doc) => ({
        id: doc.id,
        orgId: '', // We'll need to fetch this
        userId: doc.user_id,
        requestType: 'document_review',
        status: 'executed_free',
        costCredits: 0,
        wasFree: true,
        analysisResults: doc.result_data,
        createdAt: new Date(doc.created_at),
        executedAt: new Date(doc.created_at),
        hasResults: !!doc.result_data,
        canDownload: true,
        applicationTitle: doc.file_name, // Use file_name as title
      })
    );

    // Combine and sort by date
    const combined = [...aiAnalyses, ...docAnalyses].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    return combined;
  }
  /**
   * Get analysis history for user + organization
   */

  getAnalysisHistory(
    filters?: AnalysisHistoryFilter
  ): Observable<AnalysisHistoryItem[]> {
    this.isLoading.set(true);
    this.error.set(null);

    // Change this line:
    return from(this.fetchAnalysisHistoryCombined(filters)).pipe(
      tap((history) => {
        this.analysisHistorySubject.next(history);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        this.isLoading.set(false);
        const message = error?.message || 'Failed to load analysis history';
        this.error.set(message);
        console.error('❌ [ANALYSIS] Error fetching history:', error);
        return throwError(() => error);
      })
    );
  }
}
