// src/app/funding/services/sme-opportunities.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/production.auth.service';
import { FundingOpportunity } from '../../shared/models/funder.models';

// SME-specific interfaces
interface OpportunityFilters {
  fundingTypes?: string[];
  industries?: string[];
  minAmount?: number;
  maxAmount?: number;
  currencies?: string[];
  searchQuery?: string;
}

interface SMEProfile {
  industry: string;
  businessStage: string;
  revenue: number;
  yearsOperation: number;
  location: string;
}

@Injectable({
  providedIn: 'root'
})
export class SMEOpportunitiesService {
  private supabase: SupabaseClient;
  private authService = inject(AuthService);

  // State management
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  // Reactive data streams
  private opportunitiesSubject = new BehaviorSubject<FundingOpportunity[]>([]);
  opportunities$ = this.opportunitiesSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  // ===============================
  // LOAD ALL ACTIVE OPPORTUNITIES
  // ===============================

  loadActiveOpportunities(): Observable<FundingOpportunity[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchActiveOpportunities()).pipe(
      tap(opportunities => {
        this.opportunitiesSubject.next(opportunities);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to load funding opportunities');
        this.isLoading.set(false);
        console.error('Load opportunities error:', error);
        return throwError(() => error);
      })
    );
  }

  // Once you disable RLS, update your fetchActiveOpportunities method to this:
  // private async fetchActiveOpportunities(): Promise<FundingOpportunity[]> {
  //   try {
  //     console.log('Fetching active opportunities from Supabase...');
  //     const { data, error } = await this.supabase
  //       .from('funding_opportunities')
  //       .select(`
  //         *,
  //         funder_organizations!funding_opportunities_organization_id_fkey (
  //           name,
  //           organization_type,
  //           website,
  //           description,
  //           is_verified
  //         )
  //       `)
  //       .eq('status', 'active')
  //       .not('published_at', 'is', null)
  //       .order('published_at', { ascending: false });

  //     if (error) {
  //       throw new Error(`Failed to fetch opportunities: ${error.message}`);
  //     }
  //     console.log(`Fetched ${data?.length || 0} opportunities`);
      
  //     return (data || []).map(item => this.transformDatabaseToLocal(item));
  //   } catch (error) {
  //     console.error('Error fetching active opportunities:', error);
  //     throw error;
  //   }
  // }

  private async fetchActiveOpportunities(): Promise<FundingOpportunity[]> {
  try {
    console.log('Fetching active opportunities from Supabase...');
    
    // ✅ FIXED: No join - all data already in funding_opportunities table
    const { data, error } = await this.supabase
      .from('funding_opportunities')
      .select('*')
      .eq('status', 'active')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch opportunities: ${error.message}`);
    }
    
    console.log(`Fetched ${data?.length || 0} opportunities`);
    return (data || []).map(item => this.transformDatabaseToLocal(item));
    
  } catch (error) {
    console.error('Error fetching active opportunities:', error);
    throw error;
  }
}

  // TODO: Remove this once RLS policies are properly configured
  private async enrichWithOrganizationData(opportunities: any[]): Promise<any[]> {
    if (!opportunities.length) return opportunities;

    try {
      // Get unique organization IDs
      const orgIds = [...new Set(opportunities.map(opp => opp.organization_id).filter(Boolean))];
      
      if (orgIds.length === 0) {
        return opportunities.map(opp => ({ ...opp, funder_organizations: null }));
      }

      const { data: organizations, error: orgError } = await this.supabase
        .from('funder_organizations')
        .select('id, name, organization_type, website, description, is_verified')
        .in('id', orgIds);

      if (orgError) {
        console.warn('Could not fetch organization details:', orgError);
        // Return opportunities without organization data rather than failing completely
        return opportunities.map(opp => ({ ...opp, funder_organizations: null }));
      }

      // Match organizations to opportunities
      return opportunities.map(opp => {
        const org = organizations?.find(o => o.id === opp.organization_id);
        return {
          ...opp,
          funder_organizations: org || null
        };
      });

    } catch (error) {
      console.warn('Error enriching with organization data:', error);
      // Return opportunities without organization data rather than failing
      return opportunities.map(opp => ({ ...opp, funder_organizations: null }));
    }
  }

  // ===============================
  // SEARCH AND FILTER OPPORTUNITIES
  // ===============================

  searchOpportunities(filters: OpportunityFilters): Observable<FundingOpportunity[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.performSearch(filters)).pipe(
      tap(opportunities => {
        this.opportunitiesSubject.next(opportunities);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to search opportunities');
        this.isLoading.set(false);
        console.error('Search error:', error);
        return throwError(() => error);
      })
    );
  }

  private async performSearch(filters: OpportunityFilters): Promise<FundingOpportunity[]> {
    try {
      // MINIMAL VERSION: Search opportunities without organization join
      // TODO: Restore organization join once RLS is fixed
      let query = this.supabase
        .from('funding_opportunities')
        .select('*') // No join for now
        .eq('status', 'active')
        .not('published_at', 'is', null);

      // Apply funding type filter
      if (filters.fundingTypes?.length) {
        query = query.in('funding_type', filters.fundingTypes);
      }

      // Apply currency filter
      if (filters.currencies?.length) {
        query = query.in('currency', filters.currencies);
      }

      // Apply amount filters
      if (filters.minAmount !== undefined) {
        query = query.gte('max_investment', filters.minAmount);
      }

      if (filters.maxAmount !== undefined) {
        query = query.lte('min_investment', filters.maxAmount);
      }

      // Apply text search filter
      if (filters.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%,short_description.ilike.%${filters.searchQuery}%`);
      }

      // Apply industry filter (requires JSONB query)
      if (filters.industries?.length) {
        const industryConditions = filters.industries.map(industry => 
          `eligibility_criteria->>'industries' LIKE '%${industry}%'`
        ).join(' OR ');
        query = query.or(industryConditions);
      }

      const { data, error } = await query.order('published_at', { ascending: false });

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      // Add organization data separately
      const enrichedData = await this.enrichWithOrganizationData(data || []);

      return enrichedData.map(item => this.transformDatabaseToLocal(item));
    } catch (error) {
      console.error('Error performing search:', error);
      throw error;
    }
  }

  // ===============================
  // GET SINGLE OPPORTUNITY
  // ===============================

  getOpportunityById(id: string): Observable<FundingOpportunity | null> {
    this.error.set(null);

    return from(this.fetchOpportunityById(id)).pipe(
      tap(() => {
        // Increment view count
        this.incrementViewCount(id);
      }),
      catchError(error => {
        this.error.set('Failed to load opportunity details');
        console.error('Fetch opportunity error:', error);
        return throwError(() => error);
      })
    );
  }

  private async fetchOpportunityById(id: string): Promise<FundingOpportunity | null> {
    try {
      // MINIMAL VERSION: Fetch opportunity without organization join
      // TODO: Restore organization join once RLS is fixed
      const { data, error } = await this.supabase
        .from('funding_opportunities')
        .select('*') // No join for now
        .eq('id', id)
        .eq('status', 'active')
        .not('published_at', 'is', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        throw new Error(`Failed to fetch opportunity: ${error.message}`);
      }

      // Add organization data separately
      const enrichedData = await this.enrichWithOrganizationData([data]);
      
      return this.transformDatabaseToLocal(enrichedData[0]);
    } catch (error) {
      console.error('Error fetching opportunity by ID:', error);
      throw error;
    }
  }

  // ===============================
  // PERSONALIZED MATCHING
  // ===============================

  getMatchingOpportunities(smeProfile: SMEProfile): Observable<FundingOpportunity[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchMatchingOpportunities(smeProfile)).pipe(
      tap(opportunities => {
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to find matching opportunities');
        this.isLoading.set(false);
        console.error('Matching error:', error);
        return throwError(() => error);
      })
    );
  }

  private async fetchMatchingOpportunities(smeProfile: SMEProfile): Promise<FundingOpportunity[]> {
    try {
      // Use the PostgreSQL function for matching
      const { data, error } = await this.supabase
        .rpc('get_matching_opportunities', {
          sme_industry: smeProfile.industry,
          sme_stage: smeProfile.businessStage,
          sme_revenue: smeProfile.revenue,
          sme_years_operation: smeProfile.yearsOperation,
          sme_location: smeProfile.location
        });

      if (error) {
        throw new Error(`Matching failed: ${error.message}`);
      }

      // Fetch full opportunity details for matched IDs
      if (!data || data.length === 0) {
        return [];
      }

      const opportunityIds = data.map((item: any) => item.opportunity_id);
      
      // MINIMAL VERSION: Fetch opportunities without organization join
      // TODO: Restore organization join once RLS is fixed
      const { data: opportunities, error: fetchError } = await this.supabase
        .from('funding_opportunities')
        .select('*') // No join for now
        .in('id', opportunityIds)
        .eq('status', 'active');

      if (fetchError) {
        throw new Error(`Failed to fetch matched opportunities: ${fetchError.message}`);
      }

      // Add organization data separately
      const enrichedOpportunities = await this.enrichWithOrganizationData(opportunities || []);

      // Sort by match score (maintain order from matching function)
      const sortedOpportunities = opportunityIds.map((id: any) => 
        enrichedOpportunities?.find(opp => opp.id === id)
      ).filter(Boolean);

      return sortedOpportunities.map((item: any) => this.transformDatabaseToLocal(item));
    } catch (error) {
      console.error('Error fetching matching opportunities:', error);
      throw error;
    }
  }

  // ===============================
  // ANALYTICS & INTERACTIONS
  // ===============================

  incrementViewCount(opportunityId: string): void {
    // Fire and forget - don't block the UI
    this.supabase.rpc('increment_opportunity_views', { 
      opportunity_id: opportunityId 
    }).then(({ error }) => {
      if (error) {
        console.error('Failed to increment view count:', error);
      }
    });
  }

  // Track user interest (for future recommendations)
  trackUserInteraction(opportunityId: string, action: 'view' | 'apply' | 'save'): void {
    const currentUser = this.authService.user();
    if (!currentUser) return;

    // This could be expanded to track user behavior for ML recommendations
    console.log(`User ${currentUser.id} performed ${action} on opportunity ${opportunityId}`);
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  // Get all unique industries from active opportunities
  getAvailableIndustries(): Observable<string[]> {
    return from(this.fetchAvailableIndustries());
  }

  private async fetchAvailableIndustries(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('funding_opportunities')
        .select('eligibility_criteria')
        .eq('status', 'active')
        .not('published_at', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch industries: ${error.message}`);
      }

      const industries = new Set<string>();
      data?.forEach(item => {
        const criteria = item.eligibility_criteria;
        if (criteria?.industries && Array.isArray(criteria.industries)) {
          criteria.industries.forEach((industry: string) => industries.add(industry));
        }
      });

      return Array.from(industries).sort();
    } catch (error) {
      console.error('Error fetching available industries:', error);
      return [];
    }
  }

  // Get summary statistics
  getOpportunitiesStats(): Observable<{
    totalOpportunities: number;
    totalFunding: number;
    averageTicketSize: number;
    byFundingType: Record<string, number>;
  }> {
    return from(this.fetchOpportunitiesStats());
  }

  private async fetchOpportunitiesStats(): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('funding_opportunities')
        .select('funding_type, total_available, offer_amount')
        .eq('status', 'active')
        .not('published_at', 'is', null);

      if (error) {
        throw new Error(`Failed to fetch stats: ${error.message}`);
      }

      const totalOpportunities = data?.length || 0;
      const totalFunding = data?.reduce((sum, item) => sum + (item.total_available || 0), 0) || 0;
      const averageTicketSize = data?.reduce((sum, item) => sum + (item.offer_amount || 0), 0) / totalOpportunities || 0;
      
      const byFundingType: Record<string, number> = {};
      data?.forEach(item => {
        byFundingType[item.funding_type] = (byFundingType[item.funding_type] || 0) + 1;
      });

      return {
        totalOpportunities,
        totalFunding,
        averageTicketSize,
        byFundingType
      };
    } catch (error) {
      console.error('Error fetching opportunities stats:', error);
      throw error;
    }
  }

  // ===============================
  // DATA TRANSFORMATION - UPDATED WITH NEW FIELDS
  // ===============================

  private transformDatabaseToLocal(dbOpportunity: any): FundingOpportunity {
    const org = dbOpportunity.funder_organizations;
    
    return {
      id: dbOpportunity.id,
      fundId: dbOpportunity.fund_id,
      organizationId: dbOpportunity.organization_id,
      title: dbOpportunity.title,
      description: dbOpportunity.description,
      shortDescription: dbOpportunity.short_description,
      targetCompanyProfile: dbOpportunity.target_company_profile,
      offerAmount: dbOpportunity.offer_amount,
      minInvestment: dbOpportunity.min_investment,
      maxInvestment: dbOpportunity.max_investment,
      currency: dbOpportunity.currency,
      fundingType: dbOpportunity.funding_type,
      interestRate: dbOpportunity.interest_rate,
      equityOffered: dbOpportunity.equity_offered,
      repaymentTerms: dbOpportunity.repayment_terms,
      securityRequired: dbOpportunity.security_required,
      useOfFunds: dbOpportunity.use_of_funds,
      investmentStructure: dbOpportunity.investment_structure,
      expectedReturns: dbOpportunity.expected_returns,
      investmentHorizon: dbOpportunity.investment_horizon,
      exitStrategy: dbOpportunity.exit_strategy,
      applicationDeadline: dbOpportunity.application_deadline ? new Date(dbOpportunity.application_deadline) : undefined,
      decisionTimeframe: dbOpportunity.decision_timeframe,
      applicationProcess: dbOpportunity.application_process || [],
      eligibilityCriteria: dbOpportunity.eligibility_criteria || {},
      status: dbOpportunity.status,
      totalAvailable: dbOpportunity.total_available,
      amountCommitted: dbOpportunity.amount_committed,
      amountDeployed: dbOpportunity.amount_deployed,
      maxApplications: dbOpportunity.max_applications,
      currentApplications: dbOpportunity.current_applications,
      viewCount: dbOpportunity.view_count,
      applicationCount: dbOpportunity.application_count,
      conversionRate: dbOpportunity.conversion_rate,
      dealLead: dbOpportunity.deal_lead,
      dealTeam: dbOpportunity.deal_team || [],
      autoMatch: dbOpportunity.auto_match,
      matchCriteria: dbOpportunity.match_criteria,
      
      // NEW FIELDS - Transform from snake_case to camelCase
      fundingOpportunityImageUrl: dbOpportunity.funding_opportunity_image_url,
      fundingOpportunityVideoUrl: dbOpportunity.funding_opportunity_video_url,
      funderOrganizationName: dbOpportunity.funder_organization_name,
      funderOrganizationLogoUrl: dbOpportunity.funder_organization_logo_url,
      
      createdAt: new Date(dbOpportunity.created_at),
      updatedAt: new Date(dbOpportunity.updated_at),
      publishedAt: dbOpportunity.published_at ? new Date(dbOpportunity.published_at) : undefined,
      
      // Add organization info for display (may be null if organization fetch failed)
      organizationName: org?.name || dbOpportunity.funder_organization_name || 'Unknown Organization',
      organizationType: org?.organization_type || 'Unknown',
      organizationVerified: org?.is_verified || false
    } as FundingOpportunity;
  }

  // ===============================
  // CACHED DATA ACCESS
  // ===============================

  getCurrentOpportunities(): FundingOpportunity[] {
    return this.opportunitiesSubject.value;
  }

  // Clear cache (useful for refresh)
  clearCache(): void {
    this.opportunitiesSubject.next([]);
    this.error.set(null);
  }
}