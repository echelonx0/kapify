import { Injectable, inject } from '@angular/core';
import { Observable, from, of, BehaviorSubject, combineLatest } from 'rxjs';
import { map, catchError, shareReplay, tap } from 'rxjs/operators';
import { SharedSupabaseService } from '../shared/services/shared-supabase.service';

export interface DocumentAnalysis {
  id: string;
  fileName: string;
  analysisType: 'investment_analysis' | 'risk_assessment' | 'market_fit';
  confidenceScore: number;
  processingTimeMs: number;
  createdAt: Date;
  sources: string[];
  searchQueries: string[];
  type: 'document';
}

export interface ApplicationAnalysis {
  id: string;
  applicationId: string;
  contentHash: string;
  analysisResult: Record<string, any>;
  modelVersion: string;
  processingTimeMs: number;
  createdAt: Date;
  expiresAt: Date;
  confidenceScore: number;
  sources: string[];
  type: 'application';
}

export interface ActivityRecord {
  id: string;
  userId: string;
  action: string;
  message: string;
  createdAt: Date;
  type: 'activity';
}

export type Report = DocumentAnalysis | ApplicationAnalysis | ActivityRecord;

export interface ReportFilter {
  dateFrom: Date;
  dateTo: Date;
  types?: Report['type'][];
  confidenceMin?: number;
  searchQuery?: string;
}

export interface ReportStats {
  totalAnalyses: number;
  averageConfidence: number;
  latestTimestamp: Date | null;
  analysesThisMonth: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private supabase = inject(SharedSupabaseService);
  private reportsCache$ = new BehaviorSubject<Report[]>([]);
  private statsCache$ = new BehaviorSubject<ReportStats | null>(null);

  /**
   * Get all reports with optional filtering
   */
  getReports(filter?: ReportFilter): Observable<Report[]> {
    return combineLatest([
      this.getDocumentAnalyses(filter),
      this.getApplicationAnalyses(filter),
      this.getActivityRecords(filter),
    ]).pipe(
      map(([docs, apps, activities]) => {
        const all = [...docs, ...apps, ...activities];
        return all.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
      }),
      tap((reports) => this.reportsCache$.next(reports)),
      shareReplay(1),
      catchError((error) => {
        console.error('Failed to fetch reports:', error);
        return combineLatest([
          of(this.generateDummyDocumentAnalyses(filter)),
          of(this.generateDummyApplicationAnalyses(filter)),
          of(this.generateDummyActivityRecords(filter)),
        ]).pipe(
          map(([docs, apps, activities]) => {
            const all = [...docs, ...apps, ...activities];
            return all.sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
            );
          })
        );
      })
    );
  }

  /**
   * Get report statistics
   */
  getReportStats(filter?: ReportFilter): Observable<ReportStats> {
    return this.getReports(filter).pipe(
      map((reports) => this.calculateStats(reports)),
      tap((stats) => this.statsCache$.next(stats)),
      shareReplay(1)
    );
  }

  /**
   * Get document analyses from database or dummy data
   */
  private getDocumentAnalyses(
    filter?: ReportFilter
  ): Observable<DocumentAnalysis[]> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return of(this.generateDummyDocumentAnalyses(filter));
    }

    return from(
      this.supabase
        .from('document_analysis_results')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', filter?.dateFrom?.toISOString() || '')
        .lte('created_at', filter?.dateTo?.toISOString() || '')
        .order('created_at', { ascending: false })
        .limit(50)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((doc) => ({
          id: doc.id,
          fileName: doc.file_name,
          analysisType: doc.analysis_type,
          confidenceScore: doc.confidence_score || 0,
          processingTimeMs: doc.processing_time_ms || 0,
          createdAt: new Date(doc.created_at),
          sources: doc.sources || [],
          searchQueries: doc.search_queries || [],
          type: 'document' as const,
        }));
      }),
      catchError((error) => {
        console.warn(
          'Document analysis query failed, using dummy data:',
          error
        );
        return of(this.generateDummyDocumentAnalyses(filter));
      })
    );
  }

  /**
   * Get application analyses from database or dummy data
   */
  private getApplicationAnalyses(
    filter?: ReportFilter
  ): Observable<ApplicationAnalysis[]> {
    // First check if user has access to any applications
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return of(this.generateDummyApplicationAnalyses(filter));
    }

    return from(
      this.supabase
        .from('application_analyses')
        .select('*')
        .gte('created_at', filter?.dateFrom?.toISOString() || '')
        .lte('created_at', filter?.dateTo?.toISOString() || '')
        .order('created_at', { ascending: false })
        .limit(50)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((app) => ({
          id: app.id,
          applicationId: app.application_id,
          contentHash: app.content_hash,
          analysisResult: app.analysis_result,
          modelVersion: app.model_version,
          processingTimeMs: app.processing_time_ms || 0,
          createdAt: new Date(app.created_at),
          expiresAt: new Date(app.expires_at),
          confidenceScore: app.confidence_score || 75,
          sources: app.sources || [],
          type: 'application' as const,
        }));
      }),
      catchError((error) => {
        console.warn(
          'Application analysis query failed, using dummy data:',
          error
        );
        return of(this.generateDummyApplicationAnalyses(filter));
      })
    );
  }

  /**
   * Get activity records from database or dummy data
   */
  private getActivityRecords(
    filter?: ReportFilter
  ): Observable<ActivityRecord[]> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return of(this.generateDummyActivityRecords(filter));
    }

    return from(
      this.supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', filter?.dateFrom?.toISOString() || '')
        .lte('created_at', filter?.dateTo?.toISOString() || '')
        .order('created_at', { ascending: false })
        .limit(50)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((activity) => ({
          id: activity.id,
          userId: activity.user_id,
          action: activity.action,
          message: activity.message,
          createdAt: new Date(activity.created_at),
          type: 'activity' as const,
        }));
      }),
      catchError((error) => {
        console.warn('Activity query failed, using dummy data:', error);
        return of(this.generateDummyActivityRecords(filter));
      })
    );
  }

  /**
   * Generate dummy document analyses for development/testing
   */
  private generateDummyDocumentAnalyses(
    filter?: ReportFilter
  ): DocumentAnalysis[] {
    const now = new Date();
    const baseDate =
      filter?.dateFrom || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'doc-1',
        fileName: 'business_plan_techstartup.pdf',
        analysisType: 'investment_analysis',
        confidenceScore: 92,
        processingTimeMs: 2345,
        createdAt: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
        sources: ['Market Analysis Report', 'Industry Benchmarks'],
        searchQueries: ['AI startup funding', 'Series A trends'],
        type: 'document',
      },
      {
        id: 'doc-2',
        fileName: 'financial_projections_2024.xlsx',
        analysisType: 'risk_assessment',
        confidenceScore: 85,
        processingTimeMs: 1832,
        createdAt: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000),
        sources: ['Financial Models', 'Market Data'],
        searchQueries: ['revenue projections', 'cash flow analysis'],
        type: 'document',
      },
      {
        id: 'doc-3',
        fileName: 'market_research_report.pdf',
        analysisType: 'market_fit',
        confidenceScore: 78,
        processingTimeMs: 3102,
        createdAt: new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000),
        sources: ['Industry Reports', 'Competitive Analysis'],
        searchQueries: ['TAM estimation', 'market segment'],
        type: 'document',
      },
    ];
  }

  /**
   * Generate dummy application analyses for development/testing
   */
  private generateDummyApplicationAnalyses(
    filter?: ReportFilter
  ): ApplicationAnalysis[] {
    const now = new Date();
    const baseDate =
      filter?.dateFrom || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'app-1',
        applicationId: 'app-001',
        contentHash: 'hash-abc123',
        analysisResult: {
          fundingGap: '$2.5M',
          riskLevel: 'medium',
          keyStrengths: ['Strong team', 'Clear market fit'],
          recommendations: ['Diversify revenue streams'],
        },
        modelVersion: 'gemini-2.5-flash',
        processingTimeMs: 4521,
        createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000),
        confidenceScore: 88,
        sources: ['Application Form', 'Financial Statements'],
        type: 'application',
      },
      {
        id: 'app-2',
        applicationId: 'app-002',
        contentHash: 'hash-def456',
        analysisResult: {
          fundingGap: '$1.2M',
          riskLevel: 'low',
          keyStrengths: ['Proven market traction', 'Experienced founders'],
          recommendations: ['Scale operations'],
        },
        modelVersion: 'gemini-2.5-flash',
        processingTimeMs: 3890,
        createdAt: new Date(baseDate.getTime() + 12 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(baseDate.getTime() + 19 * 24 * 60 * 60 * 1000),
        confidenceScore: 94,
        sources: ['Application Form', 'Financial Statements', 'Market Data'],
        type: 'application',
      },
      {
        id: 'app-3',
        applicationId: 'app-003',
        contentHash: 'hash-ghi789',
        analysisResult: {
          fundingGap: '$5.0M',
          riskLevel: 'high',
          keyStrengths: ['Innovative product'],
          recommendations: [
            'Strengthen business model',
            'Build advisory board',
          ],
        },
        modelVersion: 'gemini-2.5-flash',
        processingTimeMs: 5234,
        createdAt: new Date(baseDate.getTime() + 22 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(baseDate.getTime() + 29 * 24 * 60 * 60 * 1000),
        confidenceScore: 72,
        sources: ['Application Form'],
        type: 'application',
      },
    ];
  }

  /**
   * Generate dummy activity records for development/testing
   */
  private generateDummyActivityRecords(
    filter?: ReportFilter
  ): ActivityRecord[] {
    const now = new Date();
    const baseDate =
      filter?.dateFrom || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const userId = this.supabase.getCurrentUserId() || 'user-001';

    return [
      {
        id: 'act-1',
        userId,
        action: 'analysis_completed',
        message:
          'Document analysis completed for business_plan_techstartup.pdf',
        createdAt: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000),
        type: 'activity',
      },
      {
        id: 'act-2',
        userId,
        action: 'report_accessed',
        message: 'Report accessed: Application Analysis for app-001',
        createdAt: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000),
        type: 'activity',
      },
      {
        id: 'act-3',
        userId,
        action: 'analysis_completed',
        message: 'Application analysis completed for app-002',
        createdAt: new Date(baseDate.getTime() + 12 * 24 * 60 * 60 * 1000),
        type: 'activity',
      },
    ];
  }

  /**
   * Calculate statistics from reports
   */
  private calculateStats(reports: Report[]): ReportStats {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const analysisReports = reports.filter(
      (r): r is DocumentAnalysis | ApplicationAnalysis => r.type !== 'activity'
    );

    const thisMonth = analysisReports.filter((r) => r.createdAt >= monthStart);
    const confidenceScores = analysisReports.map((r) => r.confidenceScore);

    return {
      totalAnalyses: analysisReports.length,
      averageConfidence:
        confidenceScores.length > 0
          ? Math.round(
              confidenceScores.reduce((a, b) => a + b, 0) /
                confidenceScores.length
            )
          : 0,
      latestTimestamp: reports.length > 0 ? reports[0].createdAt : null,
      analysesThisMonth: thisMonth.length,
    };
  }

  /**
   * Clear cache (useful for manual refresh)
   */
  clearCache(): void {
    this.reportsCache$.next([]);
    this.statsCache$.next(null);
  }
}
