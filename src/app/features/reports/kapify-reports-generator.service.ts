import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import {
  KapifyReports,
  KapifyReportsFilter,
  KapifyReportsBulkUpload,
} from './kapify-reports.interface';
import { KapifyReportsRepositoryService } from './kapify-reports-repository.service';
import { KapifyReportsTransformerService } from './kapify-reports-transformer.service';

/**
 * Cached report data with metadata
 */
interface CachedReports {
  data: KapifyReports[];
  timestamp: number;
  eTag: string;
}

/**
 * KapifyReports Generator Service
 * Handles report generation with hybrid caching strategy
 */
@Injectable({
  providedIn: 'root',
})
export class KapifyReportsGeneratorService {
  private repository = inject(KapifyReportsRepositoryService);
  private transformer = inject(KapifyReportsTransformerService);

  // Cache configuration
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100; // Max opportunities to cache

  // Reporting state
  isGenerating = signal(false);
  error = signal<string | null>(null);
  lastGeneratedAt = signal<Date | null>(null);

  // Cache management
  private reportCache = new Map<string, CachedReports>();
  private cacheTimestamps = new Map<string, number>();

  constructor() {
    console.log('🚀 [GENERATOR] KapifyReports Generator Service initialized');
  }

  /**
   * Generate reports with hybrid caching
   * Returns cached version if fresh, otherwise generates new
   */
  generateReports(filters?: KapifyReportsFilter): Observable<KapifyReports[]> {
    this.isGenerating.set(true);
    this.error.set(null);

    return from(this.performGeneration(filters)).pipe(
      tap((reports) => {
        this.isGenerating.set(false);
        this.lastGeneratedAt.set(new Date());
        console.log(`✅ [GENERATOR] Generated ${reports.length} reports`);
      }),
      catchError((error) => {
        this.isGenerating.set(false);
        const message = error?.message || 'Failed to generate reports';
        this.error.set(message);
        console.error(`❌ [GENERATOR] Error generating reports:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Generate reports for specific opportunity with caching
   */
  generateByOpportunity(opportunityId: string): Observable<KapifyReports[]> {
    console.log(
      `🎯 [GENERATOR] Generating reports for opportunity: ${opportunityId}`
    );

    // Check cache first
    const cached = this.getFromCache(opportunityId);
    if (cached) {
      console.log(`📦 [GENERATOR] Using cached reports for ${opportunityId}`);
      return from(Promise.resolve(cached));
    }

    this.isGenerating.set(true);
    this.error.set(null);

    return from(this.performGenerationByOpportunity(opportunityId)).pipe(
      tap((reports) => {
        this.isGenerating.set(false);
        this.lastGeneratedAt.set(new Date());

        // Cache the results
        this.setCache(opportunityId, reports);

        console.log(
          `✅ [GENERATOR] Generated ${reports.length} reports for opportunity ${opportunityId}`
        );
      }),
      catchError((error) => {
        this.isGenerating.set(false);
        const message =
          error?.message || `Failed to generate reports for opportunity`;
        this.error.set(message);
        console.error(`❌ [GENERATOR] Error:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh reports (bypass cache, generate fresh)
   */
  refreshReports(opportunityId: string): Observable<KapifyReports[]> {
    console.log(
      `🔄 [GENERATOR] Refreshing reports for opportunity: ${opportunityId}`
    );

    // Clear cache
    this.clearCache(opportunityId);

    // Generate fresh
    return this.generateByOpportunity(opportunityId);
  }

  /**
   * Generate report for single application
   */
  generateSingleReport(applicationId: string): Observable<KapifyReports> {
    this.isGenerating.set(true);
    this.error.set(null);

    return from(this.performSingleGeneration(applicationId)).pipe(
      tap((report) => {
        this.isGenerating.set(false);
        console.log(
          `✅ [GENERATOR] Generated single report for ${applicationId}`
        );
      }),
      catchError((error) => {
        this.isGenerating.set(false);
        const message = error?.message || 'Failed to generate report';
        this.error.set(message);
        console.error(`❌ [GENERATOR] Error:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Generate bulk reports for export
   */
  async generateBulkReports(
    filters?: KapifyReportsFilter
  ): Promise<KapifyReportsBulkUpload> {
    console.log('📦 [GENERATOR] Generating bulk reports');

    try {
      const reports = await this.performGeneration(filters);

      const bulkUpload: KapifyReportsBulkUpload = {
        fileName: `KapifyReports_${
          new Date().toISOString().split('T')[0]
        }.xlsx`,
        totalRecords: reports.length,
        successCount: reports.length,
        failureCount: 0,
        records: reports,
        uploadedAt: new Date(),
        uploadedBy: 'system',
      };

      console.log(
        `✅ [GENERATOR] Bulk reports generated: ${reports.length} records`
      );
      return bulkUpload;
    } catch (error) {
      console.error('❌ [GENERATOR] Error generating bulk reports:', error);
      throw error;
    }
  }

  /**
   * Invalidate cache for an opportunity
   * Called when application status changes
   */
  invalidateCache(opportunityId: string): void {
    console.log(
      `🗑️  [GENERATOR] Invalidating cache for opportunity: ${opportunityId}`
    );
    this.clearCache(opportunityId);
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats(): {
    size: number;
    opportunities: string[];
    oldestEntry: Date | null;
  } {
    const timestamps = Array.from(this.cacheTimestamps.values());
    const oldestTimestamp =
      timestamps.length > 0 ? Math.min(...timestamps) : null;

    return {
      size: this.reportCache.size,
      opportunities: Array.from(this.reportCache.keys()),
      oldestEntry: oldestTimestamp ? new Date(oldestTimestamp) : null,
    };
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    console.log('🗑️  [GENERATOR] Clearing all cache');
    this.reportCache.clear();
    this.cacheTimestamps.clear();
  }

  // ===============================
  // PRIVATE HELPER METHODS
  // ===============================

  /**
   * Perform actual report generation
   */
  private async performGeneration(
    filters?: KapifyReportsFilter
  ): Promise<KapifyReports[]> {
    try {
      const enrichedApps = await this.repository.getApplicationsWithData(
        filters
      );

      if (enrichedApps.length === 0) {
        return [];
      }

      const reports = this.transformer.transformBatch(enrichedApps);
      return reports;
    } catch (error) {
      console.error('❌ [GENERATOR] Error in performGeneration:', error);
      throw error;
    }
  }

  /**
   * Perform generation for specific opportunity
   */
  private async performGenerationByOpportunity(
    opportunityId: string
  ): Promise<KapifyReports[]> {
    try {
      const enrichedApps = await this.repository.getApplicationsByOpportunity(
        opportunityId
      );

      if (enrichedApps.length === 0) {
        return [];
      }

      const reports = this.transformer.transformBatch(enrichedApps);
      return reports;
    } catch (error) {
      console.error(
        '❌ [GENERATOR] Error in performGenerationByOpportunity:',
        error
      );
      throw error;
    }
  }

  /**
   * Generate single report
   */
  private async performSingleGeneration(
    applicationId: string
  ): Promise<KapifyReports> {
    try {
      const enriched = await this.repository.getSingleApplicationWithData(
        applicationId
      );
      const report = this.transformer.transformToReport(enriched, 1);
      return report;
    } catch (error) {
      console.error('❌ [GENERATOR] Error in performSingleGeneration:', error);
      throw error;
    }
  }

  /**
   * Get from cache if fresh
   */
  private getFromCache(cacheKey: string): KapifyReports[] | null {
    const cached = this.reportCache.get(cacheKey);
    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_DURATION) {
      console.log(`⏰ [CACHE] Cache expired for ${cacheKey} (${age}ms old)`);
      this.reportCache.delete(cacheKey);
      this.cacheTimestamps.delete(cacheKey);
      return null;
    }

    const ageMinutes = Math.round(age / 1000 / 60);
    console.log(`📦 [CACHE] Using cached data (${ageMinutes} min old)`);
    return cached.data;
  }

  /**
   * Store in cache
   */
  private setCache(cacheKey: string, reports: KapifyReports[]): void {
    // Enforce cache size limit
    if (
      this.reportCache.size >= this.MAX_CACHE_SIZE &&
      !this.reportCache.has(cacheKey)
    ) {
      // Remove oldest entry
      const oldestKey = Array.from(this.cacheTimestamps.entries()).sort(
        (a, b) => a[1] - b[1]
      )[0]?.[0];

      if (oldestKey) {
        this.reportCache.delete(oldestKey);
        this.cacheTimestamps.delete(oldestKey);
        console.log(`🗑️  [CACHE] Evicted oldest cache entry: ${oldestKey}`);
      }
    }

    const cached: CachedReports = {
      data: reports,
      timestamp: Date.now(),
      eTag: this.generateETag(reports),
    };

    this.reportCache.set(cacheKey, cached);
    this.cacheTimestamps.set(cacheKey, cached.timestamp);

    console.log(`💾 [CACHE] Cached ${reports.length} reports for ${cacheKey}`);
  }

  /**
   * Clear cache for specific key
   */
  private clearCache(cacheKey: string): void {
    this.reportCache.delete(cacheKey);
    this.cacheTimestamps.delete(cacheKey);
    console.log(`🗑️  [CACHE] Cleared cache for ${cacheKey}`);
  }

  /**
   * Generate simple ETag for cache validation
   */
  private generateETag(reports: KapifyReports[]): string {
    const hash =
      reports.length.toString() +
      reports
        .map((r) => `${r.no || r.nameOfBusiness}`)
        .join('|')
        .substring(0, 50);

    return `"${Buffer.from(hash).toString('base64')}"`;
  }
}
