// src/app/ai/services/market-intelligence.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface MarketIntelligence {
  industry: string;
  sector?: string;
  trends: string[];
  competitorActivity: string[];
  regulatoryChanges: string[];
  timingInsights: string[];
  fundingTrends: {
    averageRoundSize: number;
    totalFunding: number;
    dealCount: number;
    valuationTrend: 'up' | 'down' | 'stable';
  };
  // ADD THESE MISSING FIELDS
  riskFactors?: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    impact: string;
    timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  }>;
  opportunities?: Array<{
    opportunity: string;
    rationale: string;
    timeframe: string;
  }>;
  sources: Array<{
    type: 'search_query' | 'web_source' | 'news' | 'report';
    title: string;
    url?: string;
    query?: string;
    relevance: 'high' | 'medium' | 'low';
    timestamp: string;
  }>;
  confidence: number;
  lastUpdated: Date;
  cacheKey: string;
}

export interface CompetitorIntelligence {
  companyName: string;
  industry: string;
  recentNews: string[];
  fundingHistory: Array<{
    round: string;
    amount: number;
    date: string;
    investors: string[];
  }>;
  marketPosition: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  sources: Array<{
    type: string;
    title: string;
    url?: string;
    relevance: 'high' | 'medium' | 'low';
  }>;
  confidence: number;
  lastUpdated: Date;
}

export interface IntelligenceRequest {
  type: 'market_analysis' | 'competitor_research' | 'industry_trends';
  parameters: {
    industry?: string;
    companyName?: string;
    sector?: string;
    timeframe?: '1M' | '3M' | '6M' | '1Y';
    focusAreas?: string[];
  };
  urgency: 'low' | 'medium' | 'high';
  cacheMaxAge?: number; // hours
}

@Injectable({
  providedIn: 'root',
})
export class MarketIntelligenceService {
  private supabase = inject(SharedSupabaseService);

  // State management
  isLoading = signal(false);
  error = signal<string | null>(null);

  constructor() {}

  // ===============================
  // MARKET INTELLIGENCE
  // ===============================

  /**
   * Get comprehensive market intelligence for an industry
   */
  getMarketIntelligence(
    industry: string,
    options: {
      maxAge?: number;
      sector?: string;
      forceRefresh?: boolean;
    } = {}
  ): Observable<MarketIntelligence | null> {
    const { maxAge = 24, sector, forceRefresh = false } = options;
    const cacheKey = this.buildMarketCacheKey(industry, sector);

    this.isLoading.set(true);
    this.error.set(null);

    return from(
      this.fetchMarketIntelligence(
        industry,
        sector,
        cacheKey,
        maxAge,
        forceRefresh
      )
    ).pipe(
      tap(() => this.isLoading.set(false)),
      catchError((error) => {
        this.error.set(`Market intelligence failed: ${error.message}`);
        this.isLoading.set(false);
        console.error('Market intelligence error:', error);
        return of(null);
      })
    );
  }

  /**
   * Get competitor analysis for a specific company
   */
  getCompetitorIntelligence(
    companyName: string,
    industry: string,
    options: { maxAge?: number; forceRefresh?: boolean } = {}
  ): Observable<CompetitorIntelligence | null> {
    const { maxAge = 48, forceRefresh = false } = options;

    this.isLoading.set(true);
    this.error.set(null);

    return from(
      this.fetchCompetitorIntelligence(
        companyName,
        industry,
        maxAge,
        forceRefresh
      )
    ).pipe(
      tap(() => this.isLoading.set(false)),
      catchError((error) => {
        this.error.set(`Competitor analysis failed: ${error.message}`);
        this.isLoading.set(false);
        console.error('Competitor intelligence error:', error);
        return of(null);
      })
    );
  }

  /**
   * Get real-time funding trends for industry
   */
  getFundingTrends(
    industry: string,
    timeframe: '1M' | '3M' | '6M' | '1Y' = '3M'
  ): Observable<any> {
    this.isLoading.set(true);

    return from(this.fetchFundingTrends(industry, timeframe)).pipe(
      tap(() => this.isLoading.set(false)),
      catchError((error) => {
        this.error.set(`Funding trends failed: ${error.message}`);
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Batch intelligence request for multiple queries
   */
  batchIntelligenceRequest(requests: IntelligenceRequest[]): Observable<any[]> {
    this.isLoading.set(true);

    return from(this.processBatchRequest(requests)).pipe(
      tap(() => this.isLoading.set(false)),
      catchError((error) => {
        this.error.set(`Batch intelligence failed: ${error.message}`);
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // CACHE MANAGEMENT
  // ===============================

  /**
   * Clear intelligence cache for specific industry
   */
  clearIndustryCache(industry: string): Observable<{ success: boolean }> {
    return from(this.clearCache(industry));
  }

  /**
   * Get cache status and statistics
   */
  getCacheStats(): Observable<{
    totalEntries: number;
    expiredEntries: number;
    hitRate: number;
    lastCleanup: Date;
  }> {
    return from(this.fetchCacheStats());
  }

  // ===============================
  // PRIVATE IMPLEMENTATION
  // ===============================

  private async fetchMarketIntelligence(
    industry: string,
    sector: string | undefined,
    cacheKey: string,
    maxAgeHours: number,
    forceRefresh: boolean
  ): Promise<MarketIntelligence | null> {
    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = await this.getCachedIntelligence(cacheKey, maxAgeHours);
        if (cached) {
          console.log(`Market intelligence cache hit for: ${industry}`);
          return this.transformCachedMarketData(cached);
        }
      }

      console.log(`Fetching fresh market intelligence for: ${industry}`);

      // Generate new intelligence via Edge Function
      const { data, error } = await this.supabase.functions.invoke(
        'market-intelligence',
        {
          body: {
            type: 'market_analysis',
            industry,
            sector,
            cacheKey,
            maxAgeHours,
          },
        }
      );

      if (error) {
        throw new Error(`Market intelligence API error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data received from market intelligence API');
      }

      return data as MarketIntelligence;
    } catch (error) {
      console.error('Failed to fetch market intelligence:', error);

      // Try to return stale cached data as fallback
      const staleCache = await this.getCachedIntelligence(
        cacheKey,
        maxAgeHours * 4
      );
      if (staleCache) {
        console.warn('Using stale market intelligence data due to API failure');
        return this.transformCachedMarketData(staleCache);
      }

      throw error;
    }
  }

  private async fetchCompetitorIntelligence(
    companyName: string,
    industry: string,
    maxAgeHours: number,
    forceRefresh: boolean
  ): Promise<CompetitorIntelligence | null> {
    try {
      // Check cache first
      if (!forceRefresh) {
        const { data: cached } = await this.supabase
          .from('competitor_intelligence')
          .select('*')
          .ilike('company_name', `%${companyName}%`)
          .eq('industry', industry)
          .gte(
            'last_updated',
            new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString()
          )
          .single();

        if (cached) {
          console.log(`Competitor intelligence cache hit for: ${companyName}`);
          return this.transformCachedCompetitorData(cached);
        }
      }

      console.log(`Fetching fresh competitor intelligence for: ${companyName}`);

      // Generate new competitor intelligence
      const { data, error } = await this.supabase.functions.invoke(
        'competitor-analysis',
        {
          body: {
            companyName,
            industry,
            maxAgeHours,
          },
        }
      );

      if (error) {
        throw new Error(`Competitor analysis API error: ${error.message}`);
      }

      return data as CompetitorIntelligence;
    } catch (error) {
      console.error('Failed to fetch competitor intelligence:', error);
      throw error;
    }
  }

  private async fetchFundingTrends(
    industry: string,
    timeframe: string
  ): Promise<any> {
    try {
      const { data, error } = await this.supabase.functions.invoke(
        'funding-trends',
        {
          body: {
            industry,
            timeframe,
          },
        }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch funding trends:', error);
      throw error;
    }
  }

  private async processBatchRequest(
    requests: IntelligenceRequest[]
  ): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.functions.invoke(
        'batch-intelligence',
        {
          body: {
            requests,
          },
        }
      );

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to process batch intelligence request:', error);
      throw error;
    }
  }

  // ===============================
  // CACHE UTILITIES
  // ===============================

  private async getCachedIntelligence(
    cacheKey: string,
    maxAgeHours: number
  ): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('market_intelligence_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .gte(
          'created_at',
          new Date(Date.now() - maxAgeHours * 60 * 60 * 1000).toISOString()
        )
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      console.warn('Cache lookup failed:', error);
      return null;
    }
  }

  private async clearCache(industry: string): Promise<{ success: boolean }> {
    try {
      const { error } = await this.supabase
        .from('market_intelligence_cache')
        .delete()
        .eq('industry', industry);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return { success: false };
    }
  }

  private async fetchCacheStats(): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('market_intelligence_cache')
        .select('id, expires_at, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      const total = data?.length || 0;
      const expired =
        data?.filter((item) => new Date(item.expires_at) < now).length || 0;

      return {
        totalEntries: total,
        expiredEntries: expired,
        hitRate: total > 0 ? ((total - expired) / total) * 100 : 0,
        lastCleanup: data?.[0]?.created_at
          ? new Date(data[0].created_at)
          : new Date(),
      };
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
      return {
        totalEntries: 0,
        expiredEntries: 0,
        hitRate: 0,
        lastCleanup: new Date(),
      };
    }
  }

  // ===============================
  // DATA TRANSFORMATION
  // ===============================

  private transformCachedMarketData(cached: any): MarketIntelligence {
    return {
      industry: cached.industry,
      sector: cached.sector,
      trends: cached.data?.trends || [],
      competitorActivity: cached.data?.competitorActivity || [],
      regulatoryChanges: cached.data?.regulatoryChanges || [],
      timingInsights: cached.data?.timingInsights || [],
      fundingTrends: cached.data?.fundingTrends || {
        averageRoundSize: 0,
        totalFunding: 0,
        dealCount: 0,
        valuationTrend: 'stable' as const,
      },
      riskFactors: cached.data?.riskFactors || [],
      opportunities: cached.data?.opportunities || [],
      sources: cached.sources || [],
      confidence: cached.confidence_score || 75,
      lastUpdated: new Date(cached.updated_at),
      cacheKey: cached.cache_key,
    };
  }

  private transformCachedCompetitorData(cached: any): CompetitorIntelligence {
    return {
      companyName: cached.company_name,
      industry: cached.industry,
      recentNews: cached.competitor_data?.recentNews || [],
      fundingHistory: cached.funding_rounds || [],
      marketPosition: cached.market_position || {
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: [],
      },
      riskFactors: cached.risk_factors || [],
      sources: cached.sources || [],
      confidence: cached.confidence_score || 75,
      lastUpdated: new Date(cached.last_updated),
    };
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private buildMarketCacheKey(industry: string, sector?: string): string {
    const base = `market_${industry.toLowerCase().replace(/\s+/g, '_')}`;
    return sector
      ? `${base}_${sector.toLowerCase().replace(/\s+/g, '_')}`
      : base;
  }

  /**
   * Check if intelligence data is stale and needs refresh
   */
  isStale(lastUpdated: Date, maxAgeHours: number = 24): boolean {
    const ageInHours = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
    return ageInHours > maxAgeHours;
  }

  /**
   * Get industry-specific intelligence priorities
   */
  getIntelligencePriorities(industry: string): string[] {
    const priorities: Record<string, string[]> = {
      technology: [
        'funding_trends',
        'regulatory_changes',
        'competitive_landscape',
      ],
      healthcare: ['regulatory_changes', 'clinical_trials', 'market_access'],
      finance: ['regulatory_changes', 'market_conditions', 'competitive_rates'],
      manufacturing: [
        'supply_chain',
        'commodity_prices',
        'regulatory_compliance',
      ],
      retail: ['consumer_trends', 'seasonal_patterns', 'competitive_pricing'],
    };

    return (
      priorities[industry.toLowerCase()] || [
        'market_trends',
        'competitive_activity',
        'regulatory_changes',
      ]
    );
  }

  /**
   * Format intelligence data for UI display
   */
  formatForDisplay(intelligence: MarketIntelligence): {
    summary: string;
    keyInsights: string[];
    actionItems: string[];
    riskAlerts: string[];
  } {
    return {
      summary: `Market analysis for ${intelligence.industry} sector showing ${intelligence.trends.length} key trends.`,
      keyInsights: [
        ...intelligence.trends.slice(0, 3),
        ...intelligence.timingInsights.slice(0, 2),
      ],
      actionItems: intelligence.timingInsights.map(
        (insight) => `Consider: ${insight}`
      ),
      riskAlerts: intelligence.regulatoryChanges.map(
        (change) => `Monitor: ${change}`
      ),
    };
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Get loading state
   */
  isLoading$(): boolean {
    return this.isLoading();
  }
}
