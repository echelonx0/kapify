import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { DocumentAnalysisResult } from './funder-document-analysis.service';

/**
 * Analysis result item from database
 * Contains only completed analysis results
 */
export interface AnalysisResultItem {
  id: string;
  orgId: string;
  userId: string;
  result: DocumentAnalysisResult;
  createdAt: Date;
  generatedAt: string;
}

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
  private analysisHistorySubject = new BehaviorSubject<AnalysisResultItem[]>(
    []
  );
  analysisHistory$ = this.analysisHistorySubject.asObservable();

  /**
   * Get all analysis results for current user's organization
   * Fetches ONLY from ai_analysis_results (completed results only)
   */
  getAnalysisHistory(): Observable<AnalysisResultItem[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchAnalysisResults()).pipe(
      tap((results) => {
        this.analysisHistorySubject.next(results);
        this.isLoading.set(false);
        console.log('✅ [ANALYSIS] Loaded', results.length, 'results');
      }),
      catchError((error) => {
        this.isLoading.set(false);
        const message = error?.message || 'Failed to load analysis results';
        this.error.set(message);
        console.error('❌ [ANALYSIS] Error fetching results:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single analysis result by ID
   */
  getAnalysisById(analysisId: string): Observable<AnalysisResultItem> {
    return from(this.fetchAnalysisResultById(analysisId)).pipe(
      catchError((error) => {
        console.error('❌ [ANALYSIS] Error fetching analysis:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete analysis result
   */
  deleteAnalysis(analysisId: string): Observable<boolean> {
    this.isDeleting.set(true);
    this.error.set(null);

    return from(this.performDelete(analysisId)).pipe(
      tap(() => {
        this.isDeleting.set(false);

        // Remove from local cache
        const current = this.analysisHistorySubject.value;
        this.analysisHistorySubject.next(
          current.filter((a) => a.id !== analysisId)
        );

        console.log('✅ [ANALYSIS] Deleted:', analysisId);
      }),
      map(() => true),
      catchError((error) => {
        this.isDeleting.set(false);
        const message = error?.message || 'Failed to delete analysis';
        this.error.set(message);
        console.error('❌ [ANALYSIS] Delete failed:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // PRIVATE HELPER METHODS
  // ===============================

  /**
   * Fetch all analysis results for current org
   */
  private async fetchAnalysisResults(): Promise<AnalysisResultItem[]> {
    try {
      const userId = this.supabase.getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const orgId = await this.getCurrentUserOrgId(userId);
      if (!orgId) {
        console.warn('⚠️ [ANALYSIS] User not in any organization');
        return [];
      }

      // Fetch only from ai_analysis_results
      const { data: results, error } = await this.supabase
        .from('ai_analysis_results')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      if (!results || results.length === 0) {
        return [];
      }

      return results.map((r) => this.transformDatabaseResult(r));
    } catch (error) {
      console.error('❌ [ANALYSIS] Error in fetchAnalysisResults:', error);
      throw error;
    }
  }

  /**
   * Fetch single analysis result by ID
   */
  private async fetchAnalysisResultById(
    analysisId: string
  ): Promise<AnalysisResultItem> {
    const { data, error } = await this.supabase
      .from('ai_analysis_results')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (error || !data) {
      throw new Error('Analysis not found');
    }

    return this.transformDatabaseResult(data);
  }

  /**
   * Perform deletion from database
   */
  private async performDelete(analysisId: string): Promise<void> {
    const { error } = await this.supabase
      .from('ai_analysis_results')
      .delete()
      .eq('id', analysisId);

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get current user's organization ID
   */
  private async getCurrentUserOrgId(userId: string): Promise<string | null> {
    try {
      const { data: orgUsers, error } = await this.supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (error || !orgUsers) {
        return null;
      }

      return orgUsers.organization_id;
    } catch (error) {
      console.warn('⚠️ [ANALYSIS] Error getting org ID:', error);
      return null;
    }
  }

  /**
   * Transform database row to AnalysisResultItem
   */
  private transformDatabaseResult(row: any): AnalysisResultItem {
    return {
      id: row.id,
      orgId: row.org_id,
      userId: row.user_id,
      result: row.analysis_result as DocumentAnalysisResult,
      createdAt: new Date(row.created_at),
      generatedAt: row.created_at,
    };
  }
}
