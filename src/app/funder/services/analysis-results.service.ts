import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface AnalysisResult {
  id: string;
  userId: string;
  analysisType: string;
  applicationId: string;
  contentHash: string;
  analysisResult: {
    insights: Array<{
      title: string;
      description: string;
      type: string;
      severity: string;
      recommendation: string;
    }>;
    investmentScore: {
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
    request_id: string;
  };
  processingTimeMs: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class AnalysisResultsService {
  private supabase = inject(SharedSupabaseService);

  /**
   * Fetch analysis results for an application
   * Returns the most recent analysis if multiple exist
   */
  getAnalysisForApplication(
    applicationId: string
  ): Observable<AnalysisResult | null> {
    return from(this.fetchAnalysisFromDb(applicationId)).pipe(
      map((result) => result || null),
      catchError((error) => {
        console.error('❌ [ANALYSIS-RESULTS] Failed to fetch analysis:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Check if analysis exists for application
   */
  hasAnalysis(applicationId: string): Observable<boolean> {
    return from(this.checkAnalysisExists(applicationId)).pipe(
      catchError(() => from([false]))
    );
  }

  /**
   * Fetch from database
   */
  private async fetchAnalysisFromDb(
    applicationId: string
  ): Promise<AnalysisResult | null> {
    try {
      const { data, error } = await this.supabase
        .from('ai_analysis_results')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found
          return null;
        }
        throw error;
      }

      if (!data) return null;

      return this.transformDatabaseToLocal(data);
    } catch (error) {
      console.error('Database fetch error:', error);
      throw error;
    }
  }

  /**
   * Check if analysis exists
   */
  private async checkAnalysisExists(applicationId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('ai_analysis_results')
        .select('id')
        .eq('application_id', applicationId)
        .limit(1)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  /**
   * Transform database format to local model
   */
  private transformDatabaseToLocal(dbRecord: any): AnalysisResult {
    return {
      id: dbRecord.id,
      userId: dbRecord.user_id,
      analysisType: dbRecord.analysis_type,
      applicationId: dbRecord.application_id,
      contentHash: dbRecord.content_hash,
      analysisResult: dbRecord.analysis_result || {},
      processingTimeMs: dbRecord.processing_time_ms,
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };
  }
}
