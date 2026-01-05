import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';

import { KapifyReportsFilter } from './kapify-reports.interface';
import { FundingApplication } from 'src/app/SMEs/models/application.models';

/**
 * Internal enriched application type with all related data
 */
export interface EnrichedApplication {
  application: FundingApplication;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  opportunity: {
    id: string;
    title: string;
    funding_type: string[];
    min_investment: number;
    max_investment: number;
  } | null;
  companyInfo: CompanyInfoData | null;
  financialProfile: FinancialProfileData | null;
}

/**
 * Company info from business_plan_sections
 */
export interface CompanyInfoData {
  companyName: string;
  industryType: string;
  businessActivity: string;
  companyType: string;
  operationalYears: number;
  employeeCount: string;
  bbbeeLevel?: string;
  registeredAddress: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  contactPerson: {
    fullName: string;
    position: string;
    email: string;
    phone: string;
  };
  [key: string]: any;
}

/**
 * Financial profile from business_plan_sections
 */
export interface FinancialProfileData {
  monthlyRevenue?: number;
  monthlyCosts?: number;
  currentAssets?: number;
  currentLiabilities?: number;
  netWorth?: number;
  profitMargin?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class KapifyReportsRepositoryService {
  private supabase = inject(SharedSupabaseService);

  /**
   * Fetch applications with all related data
   * Optimized with batch operations
   */
  async getApplicationsWithData(
    filters?: KapifyReportsFilter,
    excludeStatuses: string[] = ['draft', 'withdrawn']
  ): Promise<EnrichedApplication[]> {
    try {
      console.log('🔍 [REPO] Starting data fetch with filters:', filters);

      // Step 1: Fetch applications
      const applications = await this.fetchApplications(
        filters,
        excludeStatuses
      );

      if (!applications || applications.length === 0) {
        console.log('📭 [REPO] No applications found');
        return [];
      }

      console.log('✅ [REPO] Applications fetched:', applications.length);

      // Step 2: Extract unique IDs for batch queries
      const applicantIds = [
        ...new Set(applications.map((app) => app.applicantId)),
      ];
      const opportunityIds = [
        ...new Set(
          applications
            .map((app) => app.opportunityId)
            .filter((id) => id !== null)
        ),
      ];

      console.log('👥 [REPO] Unique applicants:', applicantIds.length);
      console.log('🎯 [REPO] Unique opportunities:', opportunityIds.length);

      // Step 3: Batch fetch related data
      const [users, opportunities, companyInfos, financialProfiles] =
        await Promise.all([
          this.fetchUsersByIds(applicantIds),
          opportunityIds.length > 0
            ? this.fetchOpportunitiesByIds(opportunityIds)
            : Promise.resolve([]),
          this.fetchBusinessPlanSectionsByUserIds(applicantIds, 'company-info'),
          this.fetchBusinessPlanSectionsByUserIds(
            applicantIds,
            'financial-profile'
          ),
        ]);

      console.log('✅ [REPO] Related data fetched');
      console.log('  - Users:', users?.length || 0);
      console.log('  - Opportunities:', opportunities?.length || 0);
      console.log('  - Company Infos:', companyInfos?.length || 0);
      console.log('  - Financial Profiles:', financialProfiles?.length || 0);

      // Step 4: Create lookup maps for O(1) joining
      const userMap = this.createUserMap(users);
      const opportunityMap = this.createOpportunityMap(opportunities);
      const companyInfoMap = this.createBusinessPlanSectionMap(
        companyInfos,
        'company-info'
      );
      const financialProfileMap = this.createBusinessPlanSectionMap(
        financialProfiles,
        'financial-profile'
      );

      console.log('🔗 [REPO] Lookup maps created');

      // Step 5: Enrich applications with related data
      const enrichedApplications = applications.map((app) => ({
        application: app,
        user: userMap.get(app.opportunityId) || null,
        opportunity: opportunityMap.get(app.opportunityId) || null,
        companyInfo: companyInfoMap.get(app.applicantId) || null,
        financialProfile: financialProfileMap.get(app.applicantId) || null,
      }));

      console.log(
        '✅ [REPO] Applications enriched:',
        enrichedApplications.length
      );

      return enrichedApplications;
    } catch (error) {
      console.error('❌ [REPO] Error fetching applications with data:', error);
      throw error;
    }
  }

  /**
   * Fetch applications with optional filtering
   */
  private async fetchApplications(
    filters?: KapifyReportsFilter,
    excludeStatuses: string[] = ['draft', 'withdrawn']
  ): Promise<FundingApplication[]> {
    try {
      let query = this.supabase.from('applications').select('*');

      // Filter by opportunity
      if (filters?.searchQuery) {
        // Full-text search on title/description (client-side for now)
        // Can be optimized to use Supabase full-text later
      }

      // Exclude draft and withdrawn
      if (excludeStatuses.length > 0) {
        query = query.not('status', 'in', `(${excludeStatuses.join(',')})`);
      }

      // Filter by status if specified
      if (filters?.applicationStatus && filters.applicationStatus.length > 0) {
        query = query.in('status', filters.applicationStatus);
      }

      // Filter by date range
      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start.toISOString())
          .lte('created_at', filters.dateRange.end.toISOString());
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      // Client-side full-text search if needed
      let results = data || [];
      if (filters?.searchQuery) {
        const searchLower = filters.searchQuery.toLowerCase();
        results = results.filter(
          (app) =>
            app.title?.toLowerCase().includes(searchLower) ||
            app.description?.toLowerCase().includes(searchLower)
        );
      }

      return results;
    } catch (error) {
      console.error('❌ [REPO] Error fetching applications:', error);
      throw error;
    }
  }

  /**
   * Batch fetch users by IDs
   */
  private async fetchUsersByIds(userIds: string[]): Promise<any[]> {
    if (userIds.length === 0) return [];

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .in('id', userIds);

      if (error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.warn('⚠️ [REPO] Error fetching users:', error);
      return [];
    }
  }

  /**
   * Batch fetch opportunities by IDs
   */
  private async fetchOpportunitiesByIds(
    opportunityIds: string[]
  ): Promise<any[]> {
    if (opportunityIds.length === 0) return [];

    try {
      const { data, error } = await this.supabase
        .from('funding_opportunities')
        .select('id, title, funding_type, min_investment, max_investment')
        .in('id', opportunityIds);

      if (error) {
        throw new Error(`Failed to fetch opportunities: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.warn('⚠️ [REPO] Error fetching opportunities:', error);
      return [];
    }
  }

  /**
   * Batch fetch business plan sections by user IDs
   */
  private async fetchBusinessPlanSectionsByUserIds(
    userIds: string[],
    sectionType: string
  ): Promise<any[]> {
    if (userIds.length === 0) return [];

    try {
      const { data, error } = await this.supabase
        .from('business_plan_sections')
        .select('user_id, data')
        .in('user_id', userIds)
        .eq('section_type', sectionType);

      if (error) {
        throw new Error(
          `Failed to fetch ${sectionType} sections: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      console.warn(`⚠️ [REPO] Error fetching ${sectionType} sections:`, error);
      return [];
    }
  }

  /**
   * Create user lookup map for O(1) joining
   */
  private createUserMap(users: any[]): Map<string, any> {
    const map = new Map();
    users?.forEach((user) => {
      map.set(user.id, user);
    });
    return map;
  }

  /**
   * Create opportunity lookup map
   */
  private createOpportunityMap(opportunities: any[]): Map<string, any> {
    const map = new Map();
    opportunities?.forEach((opp) => {
      map.set(opp.id, opp);
    });
    return map;
  }

  /**
   * Create business plan section lookup map
   */
  private createBusinessPlanSectionMap(
    sections: any[],
    sectionType: string
  ): Map<string, any> {
    const map = new Map();
    sections?.forEach((section) => {
      if (section.data) {
        map.set(section.user_id, section.data);
      }
    });
    return map;
  }

  /**
   * Fetch single application with all data
   */
  async getSingleApplicationWithData(
    applicationId: string
  ): Promise<EnrichedApplication> {
    try {
      console.log('🔍 [REPO] Fetching single application:', applicationId);

      // Fetch the application
      const { data: appData, error: appError } = await this.supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (appError || !appData) {
        throw new Error('Application not found');
      }

      console.log('✅ [REPO] Application found:', appData.id);

      // Fetch related data
      const [user, opportunity, companyInfo, financialProfile] =
        await Promise.all([
          this.fetchUsersByIds([appData.applicant_id]).then(
            (users) => users[0] || null
          ),
          appData.opportunity_id
            ? this.fetchOpportunitiesByIds([appData.opportunity_id]).then(
                (opps) => opps[0] || null
              )
            : Promise.resolve(null),
          this.fetchBusinessPlanSectionsByUserIds(
            [appData.applicant_id],
            'company-info'
          ).then((sections) => sections[0]?.data || null),
          this.fetchBusinessPlanSectionsByUserIds(
            [appData.applicant_id],
            'financial-profile'
          ).then((sections) => sections[0]?.data || null),
        ]);

      return {
        application: appData as FundingApplication,
        user,
        opportunity,
        companyInfo,
        financialProfile,
      };
    } catch (error) {
      console.error('❌ [REPO] Error fetching single application:', error);
      throw error;
    }
  }

  /**
   * Get applications by opportunity
   */
  async getApplicationsByOpportunity(
    opportunityId: string
  ): Promise<EnrichedApplication[]> {
    try {
      // Fetch applications for this opportunity
      const { data: applications, error } = await this.supabase
        .from('applications')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .not('status', 'in', '(draft,withdrawn)')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch applications: ${error.message}`);
      }

      if (!applications || applications.length === 0) {
        return [];
      }

      // Extract applicant IDs
      const applicantIds = [
        ...new Set(applications.map((app) => app.applicant_id)),
      ];

      // Batch fetch related data
      const [users, companyInfos, financialProfiles, opportunity] =
        await Promise.all([
          this.fetchUsersByIds(applicantIds),
          this.fetchBusinessPlanSectionsByUserIds(applicantIds, 'company-info'),
          this.fetchBusinessPlanSectionsByUserIds(
            applicantIds,
            'financial-profile'
          ),
          this.fetchOpportunitiesByIds([opportunityId]).then(
            (opps) => opps[0] || null
          ),
        ]);

      // Create lookup maps
      const userMap = this.createUserMap(users);
      const companyInfoMap = this.createBusinessPlanSectionMap(
        companyInfos,
        'company-info'
      );
      const financialProfileMap = this.createBusinessPlanSectionMap(
        financialProfiles,
        'financial-profile'
      );

      // Enrich applications
      return applications.map((app) => ({
        application: app as FundingApplication,
        user: userMap.get(app.applicant_id) || null,
        opportunity,
        companyInfo: companyInfoMap.get(app.applicant_id) || null,
        financialProfile: financialProfileMap.get(app.applicant_id) || null,
      }));
    } catch (error) {
      console.error(
        '❌ [REPO] Error fetching applications by opportunity:',
        error
      );
      throw error;
    }
  }
}
