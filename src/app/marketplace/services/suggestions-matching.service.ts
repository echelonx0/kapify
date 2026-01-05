// src/app/marketplace/services/suggestions-matching.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from, map, catchError, of } from 'rxjs';
import { SMEOpportunitiesService } from '../../funding/services/opportunities.service';
import { FundingProfileSetupService } from '../../SMEs/services/funding-profile-setup.service';
import { AuthService } from '../../auth/services/production.auth.service';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

export interface MatchScore {
  opportunity: FundingOpportunity;
  score: number;
  matchReasons: string[];
}

@Injectable({
  providedIn: 'root',
})
export class SuggestionsMatchingService {
  private opportunitiesService = inject(SMEOpportunitiesService);
  private profileService = inject(FundingProfileSetupService);
  private authService = inject(AuthService);
  private supabase = inject(SharedSupabaseService);

  /**
   * Get suggested opportunities for current user
   * @param maxSuggestions - Maximum number of suggestions to return (default: 3)
   * @param excludeApplied - Whether to exclude opportunities user has applied to (default: true)
   */
  getSuggestedOpportunities(
    maxSuggestions: number = 3,
    excludeApplied: boolean = true
  ): Observable<MatchScore[]> {
    return this.opportunitiesService.opportunities$.pipe(
      map((opportunities) => {
        if (!opportunities || opportunities.length === 0) {
          return [];
        }

        // Get user profile data
        const profileData = this.profileService.data();
        const currentUser = this.authService.user();

        if (!currentUser) {
          // No user logged in - return most recent opportunities
          return this.getMostRecentOpportunities(opportunities, maxSuggestions);
        }

        // Score all opportunities
        const scoredOpportunities = opportunities.map((opp) =>
          this.scoreOpportunity(opp, profileData)
        );

        // Sort by score descending
        scoredOpportunities.sort((a, b) => b.score - a.score);

        // Return top N
        return scoredOpportunities.slice(0, maxSuggestions);
      }),
      catchError((error) => {
        console.error('Error getting suggestions:', error);
        return of([]);
      })
    );
  }

  /**
   * Check if user has already applied to opportunities
   * Returns array of opportunity IDs user has applied to
   */
  getAppliedOpportunityIds(): Observable<string[]> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return of([]);
    }

    return from(
      this.supabase
        .from('applications')
        .select('opportunity_id')
        .eq('applicant_id', currentUser.id)
        .not('status', 'in', '("rejected","withdrawn")')
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching applied opportunities:', error);
            return [];
          }
          return (data || []).map((app) => app.opportunity_id).filter(Boolean);
        })
    );
  }

  /**
   * Score an opportunity against user profile
   * Returns score 0-100 and reasons for match
   */
  private scoreOpportunity(
    opportunity: FundingOpportunity,
    profileData: any
  ): MatchScore {
    let score = 0;
    const matchReasons: string[] = [];

    // Extract profile data with fallbacks
    const companyInfo = profileData?.companyInfo || {};
    const businessAssessment = profileData?.businessAssessment || {};
    const financialProfile = profileData?.financialProfile || {};
    const businessStrategy = profileData?.businessStrategy || {};

    // 1. INDUSTRY MATCH (40 points)
    const userIndustry = companyInfo.industryType?.toLowerCase();
    const eligibleIndustries =
      opportunity.eligibilityCriteria?.industries || [];

    if (userIndustry && eligibleIndustries.length > 0) {
      const industryMatch = eligibleIndustries.some(
        (ind) => ind.toLowerCase() === userIndustry
      );

      if (industryMatch) {
        score += 40;
        matchReasons.push(
          `Matches your industry: ${this.formatIndustry(userIndustry)}`
        );
      }
    }

    // 2. FUNDING AMOUNT MATCH (30 points)
    const requestedAmount =
      businessStrategy?.fundingRequirements?.totalAmountRequired ||
      financialProfile?.monthlyRevenue * 12 || // Annual revenue estimate
      0;

    if (requestedAmount > 0) {
      const minInvestment = opportunity.minInvestment || 0;
      const maxInvestment =
        opportunity.maxInvestment || Number.MAX_SAFE_INTEGER;

      if (
        requestedAmount >= minInvestment &&
        requestedAmount <= maxInvestment
      ) {
        score += 30;
        matchReasons.push('Funding amount matches your needs');
      } else if (requestedAmount < minInvestment) {
        // Partial match if close
        const proximity = requestedAmount / minInvestment;
        if (proximity > 0.5) {
          score += 15;
          matchReasons.push('Close to your funding requirements');
        }
      }
    }

    // 3. BUSINESS STAGE MATCH (20 points)
    const userYearsOperation = parseInt(companyInfo.operationalYears) || 0;
    const eligibleStages =
      opportunity.eligibilityCriteria?.businessStages || [];

    if (eligibleStages.length > 0) {
      let userStage = 'mature';
      if (userYearsOperation <= 2) userStage = 'startup';
      else if (userYearsOperation <= 5) userStage = 'early-stage';

      if (eligibleStages.includes(userStage)) {
        score += 20;
        matchReasons.push(`Suitable for ${userStage} businesses`);
      }
    }

    // 4. LOCATION MATCH (10 points)
    const userProvince = companyInfo.registeredAddress?.province?.toLowerCase();
    const geoRestrictions =
      opportunity.eligibilityCriteria?.geographicRestrictions || [];

    if (geoRestrictions.length === 0) {
      // No restrictions = automatic match
      score += 10;
    } else if (userProvince) {
      const locationMatch = geoRestrictions.some((loc) =>
        loc.toLowerCase().includes(userProvince)
      );

      if (locationMatch) {
        score += 10;
        matchReasons.push('Available in your location');
      }
    }

    // BONUS: New opportunity (recent)
    const createdAt = new Date(opportunity.createdAt);
    const daysSinceCreated =
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceCreated <= 7) {
      score += 5;
      matchReasons.push('Recently published');
    }

    // BONUS: Low competition
    if (opportunity.currentApplications < 5) {
      score += 5;
      matchReasons.push('Low competition');
    }

    // Ensure at least one reason if score > 0
    if (score > 0 && matchReasons.length === 0) {
      matchReasons.push('Recommended for you');
    }

    return {
      opportunity,
      score: Math.min(score, 100),
      matchReasons,
    };
  }

  /**
   * Fallback when no profile data available
   * Returns most recently published opportunities
   */
  private getMostRecentOpportunities(
    opportunities: FundingOpportunity[],
    count: number
  ): MatchScore[] {
    return opportunities
      .sort(
        (a, b) =>
          new Date(b.publishedAt || b.createdAt).getTime() -
          new Date(a.publishedAt || a.createdAt).getTime()
      )
      .slice(0, count)
      .map((opp) => ({
        opportunity: opp,
        score: 50, // Neutral score
        matchReasons: ['Recently published'],
      }));
  }

  /**
   * Format industry name for display
   */
  private formatIndustry(industry: string): string {
    return industry.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
