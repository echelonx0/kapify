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
  isDeleting = signal(false);

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

      const { data: analyses } = await this.supabase
        .from('ai_analysis_requests')
        .select('*')
        .in('user_id', orgUserIds);

      const { data: docAnalyses } = await this.supabase
        .from('document_analysis_results')
        .select('*')
        .in('user_id', orgUserIds);

      const aiCount = analyses?.length || 0;
      const docCount = docAnalyses?.length || 0;
      const totalAnalyses = aiCount + docCount;

      const freeAnalyses =
        (analyses?.filter((a) => a.was_free).length || 0) + docCount;

      const paidAnalyses = totalAnalyses - freeAnalyses;

      const totalCreditsSpent =
        analyses?.reduce((sum, a) => sum + (a.cost_credits || 0), 0) || 0;

      const averageCostPerAnalysis =
        paidAnalyses > 0 ? Math.round(totalCreditsSpent / paidAnalyses) : 0;

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

      const orgUserIds = await this.getOrganizationUserIds(userId);

      console.log('📜 [ANALYSIS] Fetching history for:', {
        userId,
        orgUserIds,
        filters,
      });

      let query = this.supabase
        .from('ai_analysis_requests')
        .select('*')
        .in('user_id', orgUserIds);

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

      const analyses = analysesRaw.map((a) =>
        this.transformDatabaseToAnalysis(a)
      );

      const enriched = await this.enrichAnalysisHistory(analyses);

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
      const { data: orgUsers, error: orgError } = await this.supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (orgError) {
        console.warn('⚠️ [ANALYSIS] Error fetching org membership:', orgError);
        return [userId];
      }

      if (!orgUsers || orgUsers.length === 0) {
        return [userId];
      }

      const orgIds = orgUsers.map((ou) => ou.organization_id);

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

      if (!userIds.includes(userId)) {
        userIds.push(userId);
      }

      console.log('👥 [ANALYSIS] Organization user IDs:', userIds.length);

      return userIds;
    } catch (error) {
      console.error('❌ [ANALYSIS] Error getting org user IDs:', error);
      return [userId];
    }
  }

  /**
   * Enrich analysis history with names
   */
  private async enrichAnalysisHistory(
    analyses: AIAnalysisRequest[]
  ): Promise<AnalysisHistoryItem[]> {
    try {
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

    const aiAnalyses = await this.fetchAnalysisHistory(filters);

    const { data: docAnalysesRaw } = await this.supabase
      .from('document_analysis_results')
      .select('*')
      .in('user_id', orgUserIds)
      .order('created_at', { ascending: false });

    const docAnalyses: AnalysisHistoryItem[] = (docAnalysesRaw || []).map(
      (doc) => ({
        id: doc.id,
        orgId: '',
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
        applicationTitle: doc.file_name,
      })
    );

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

  // new
  deleteAnalysis(item: AnalysisHistoryItem): Observable<boolean> {
    this.isDeleting.set(true);
    this.error.set(null);

    return from(this.performDelete(item)).pipe(
      map(() => true), // ✅ FIX: convert void → boolean
      tap(() => {
        this.isDeleting.set(false);

        const current = this.analysisHistorySubject.value;
        this.analysisHistorySubject.next(
          current.filter((a) => a.id !== item.id)
        );

        console.log('✅ [ANALYSIS] Deleted:', item.id);
      }),
      catchError((error) => {
        this.isDeleting.set(false);
        const message = error?.message || 'Failed to delete analysis';
        this.error.set(message);
        console.error('❌ [ANALYSIS] Delete failed:', error);
        return throwError(() => error);
      })
    );
  }

  private async performDelete(item: AnalysisHistoryItem): Promise<void> {
    if (item.requestType === 'document_review') {
      await this.deleteDocumentAnalysis(item.id);
    } else {
      await this.deleteAiAnalysis(item.id);
    }
  }

  private async deleteAiAnalysis(analysisId: string): Promise<void> {
    const { error } = await this.supabase.rpc('delete_ai_analysis_request', {
      analysis_id_param: analysisId,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  private async deleteDocumentAnalysis(documentId: string): Promise<void> {
    const { error } = await this.supabase.rpc(
      'delete_document_analysis_result',
      { doc_id_param: documentId }
    );

    if (error) {
      throw new Error(error.message);
    }
  }
}
