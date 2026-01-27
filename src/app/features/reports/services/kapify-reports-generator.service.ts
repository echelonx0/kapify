import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import {
  KapifyReports,
  KapifyReportsFilter,
  KapifyReportsBulkUpload,
} from '../models/kapify-reports.interface';
import { KapifyReportsRepositoryService } from './kapify-reports-repository.service';
import { KapifyReportsTransformerService } from './kapify-reports-transformer.service';
import { OrganizationService } from './fetch-organization.service';

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
  private orgService = inject(OrganizationService);

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

  /**
   * Generate reports with hybrid caching
   * Returns cached version if fresh, otherwise generates new
   * @param funderId - REQUIRED: Organization/funder ID
   * @param filters - Optional filters
   */
  generateReports(
    funderId: string,
    filters?: KapifyReportsFilter
  ): Observable<KapifyReports[]> {
    this.isGenerating.set(true);
    this.error.set(null);

    return from(this.performGeneration(funderId, filters)).pipe(
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
   * @param funderId - REQUIRED: Organization/funder ID
   * @param opportunityId - The opportunity to generate reports for
   */
  generateByOpportunity(
    funderId: string,
    opportunityId: string
  ): Observable<KapifyReports[]> {
    if (!funderId) {
      const error = new Error('funderId is required');
      this.error.set(error.message);
      return throwError(() => error);
    }

    console.log(
      `🎯 [GENERATOR] Generating reports for funder: ${funderId}, opportunity: ${opportunityId}`
    );

    // Check cache first (cache key includes both funder and opportunity for isolation)
    const cacheKey = `${funderId}::${opportunityId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📦 [GENERATOR] Using cached reports for ${cacheKey}`);
      return from(Promise.resolve(cached));
    }

    this.isGenerating.set(true);
    this.error.set(null);

    return from(
      this.performGenerationByOpportunity(funderId, opportunityId)
    ).pipe(
      tap((reports) => {
        this.isGenerating.set(false);
        this.lastGeneratedAt.set(new Date());

        // Cache the results
        this.setCache(cacheKey, reports);

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
   * @param funderId - REQUIRED: Organization/funder ID
   * @param opportunityId - The opportunity to refresh
   */
  refreshReports(
    funderId: string,
    opportunityId: string
  ): Observable<KapifyReports[]> {
    if (!funderId) {
      const error = new Error('funderId is required');
      this.error.set(error.message);
      return throwError(() => error);
    }

    console.log(
      `🔄 [GENERATOR] Refreshing reports for funder: ${funderId}, opportunity: ${opportunityId}`
    );

    // Clear cache
    const cacheKey = `${funderId}::${opportunityId}`;
    this.clearCache(cacheKey);

    // Generate fresh
    return this.generateByOpportunity(funderId, opportunityId);
  }

  /**
   * Generate report for single application
   * @param funderId - REQUIRED: Organization/funder ID
   * @param applicationId - The application to generate report for
   */
  generateSingleReport(
    funderId: string,
    applicationId: string
  ): Observable<KapifyReports> {
    this.isGenerating.set(true);
    this.error.set(null);

    return from(this.performSingleGeneration(funderId, applicationId)).pipe(
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
   * @param funderId - REQUIRED: Organization/funder ID
   * @param filters - Optional filters
   */
  async generateBulkReports(
    funderId: string,
    filters?: KapifyReportsFilter
  ): Promise<KapifyReportsBulkUpload> {
    if (!funderId) {
      throw new Error('funderId is required to generate bulk reports');
    }

    console.log('📦 [GENERATOR] Generating bulk reports for funder:', funderId);

    try {
      const reports = await this.performGeneration(funderId, filters);

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
   * @param funderId - REQUIRED: Organization/funder ID
   * @param opportunityId - The opportunity whose cache should be invalidated
   */
  invalidateCache(funderId: string, opportunityId: string): void {
    if (!funderId) {
      console.warn('⚠️ [GENERATOR] funderId is required to invalidate cache');
      return;
    }

    const cacheKey = `${funderId}::${opportunityId}`;
    console.log(`🗑️  [GENERATOR] Invalidating cache for: ${cacheKey}`);
    this.clearCache(cacheKey);
  }

  /**
   * Get cache stats for debugging
   */
  getCacheStats(): {
    size: number;
    cacheKeys: string[];
    oldestEntry: Date | null;
  } {
    const timestamps = Array.from(this.cacheTimestamps.values());
    const oldestTimestamp =
      timestamps.length > 0 ? Math.min(...timestamps) : null;

    return {
      size: this.reportCache.size,
      cacheKeys: Array.from(this.reportCache.keys()),
      oldestEntry: oldestTimestamp ? new Date(oldestTimestamp) : null,
    };
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.reportCache.clear();
    this.cacheTimestamps.clear();
    console.log('🗑️  [CACHE] Cleared all cache');
  }

  // ===============================
  // PRIVATE HELPER METHODS
  // ===============================

  /**
   * Fetch funder name from Supabase
   */
  private async getFunderName(funderId: string): Promise<string> {
    try {
      const name = await this.orgService.getFunderName(funderId);
      console.log(`✅ [GENERATOR] Fetched funder name: ${name}`);
      return name;
    } catch (error) {
      console.error('❌ [GENERATOR] Error fetching funder name:', error);
      return '';
    }
  }

  /**
   * Perform actual report generation
   * @param funderId - REQUIRED: Organization/funder ID
   */
  private async performGeneration(
    funderId: string,
    filters?: KapifyReportsFilter
  ): Promise<KapifyReports[]> {
    try {
      if (!funderId) {
        throw new Error('funderId is required for report generation');
      }

      // Fetch funder name
      const funderName = await this.getFunderName(funderId);

      const enrichedApps = await this.repository.getApplicationsWithData(
        funderId,
        filters
      );

      if (enrichedApps.length === 0) {
        console.log(
          '📭 [GENERATOR] No applications found for report generation'
        );
        return [];
      }

      const reports = this.transformer.transformBatch(enrichedApps, funderName);
      return reports;
    } catch (error) {
      console.error('❌ [GENERATOR] Error in performGeneration:', error);
      throw error;
    }
  }

  /**
   * Perform generation for specific opportunity
   * @param funderId - REQUIRED: Organization/funder ID
   */
  private async performGenerationByOpportunity(
    funderId: string,
    opportunityId: string
  ): Promise<KapifyReports[]> {
    try {
      if (!funderId) {
        throw new Error('funderId is required for report generation');
      }

      // Fetch funder name
      const funderName = await this.getFunderName(funderId);

      const enrichedApps = await this.repository.getApplicationsByOpportunity(
        opportunityId,
        funderId
      );

      if (enrichedApps.length === 0) {
        console.log(
          `📭 [GENERATOR] No applications found for opportunity ${opportunityId}`
        );
        return [];
      }

      const reports = this.transformer.transformBatch(enrichedApps, funderName);
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
   * @param funderId - REQUIRED: Organization/funder ID
   */
  private async performSingleGeneration(
    funderId: string,
    applicationId: string
  ): Promise<KapifyReports> {
    try {
      if (!funderId) {
        throw new Error('funderId is required for report generation');
      }

      // Fetch funder name
      const funderName = await this.getFunderName(funderId);

      const enriched = await this.repository.getSingleApplicationWithData(
        applicationId,
        funderId
      );
      const report = this.transformer.transformToReport(
        enriched,
        1,
        funderName
      );
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
