import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface AnalysisReport {
  id: string;
  userId: string;
  analysisType: 'profile' | 'opportunity';
  opportunityId?: string;
  applicationId?: string;
  contentHash: string;
  insights: Array<{
    title: string;
    description: string;
    type: string;
    severity: string;
    recommendation: string;
  }>;
  investmentScore?: {
    overall: number;
    recommendation: string;
    confidence: number;
    breakdown: {
      financial: number;
      market: number;
      team: number;
      traction: number;
    };
  };
  processingTimeMs?: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AIReportsService {
  private supabase = inject(SharedSupabaseService);

  /**
   * Fetch all AI analysis reports for the current user
   * Returns sorted by creation date (newest first)
   */
  getUserAnalysisReports(): Observable<AnalysisReport[]> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      return throwError(
        () => new Error('User not authenticated. Please log in.')
      );
    }

    return from(this.fetchUserReports(userId)).pipe(
      catchError((error) => {
        console.error('❌ Failed to fetch analysis reports:', error);
        return throwError(
          () =>
            new Error(
              `Failed to load reports: ${error?.message || 'Unknown error'}`
            )
        );
      })
    );
  }

  /**
   * Fetch reports from database
   */
  private async fetchUserReports(userId: string): Promise<AnalysisReport[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_analysis_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((record) => this.transformDatabaseToLocal(record));
    } catch (error) {
      console.error('Database fetch error:', error);
      throw error;
    }
  }

  /**
   * Transform database format to local model
   */
  private transformDatabaseToLocal(dbRecord: any): AnalysisReport {
    const analysisResult = dbRecord.analysis_result || {};

    return {
      id: dbRecord.id,
      userId: dbRecord.user_id,
      analysisType: dbRecord.analysis_type,
      opportunityId: dbRecord.opportunity_id,
      applicationId: dbRecord.application_id,
      contentHash: dbRecord.content_hash,
      insights: analysisResult.insights || [],
      investmentScore: analysisResult.investmentScore,
      processingTimeMs: dbRecord.processing_time_ms,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }
}
