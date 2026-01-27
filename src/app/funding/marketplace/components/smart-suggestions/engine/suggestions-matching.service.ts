// src/app/marketplace/services/suggestions-matching.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from, map, catchError, of, switchMap } from 'rxjs';
import { AuthService } from 'src/app/auth/services/production.auth.service';

import { FundingProfileSetupService } from 'src/app/fund-seeking-orgs/services/funding-profile-setup.service';
import { SMEOpportunitiesService } from '../../../../services/opportunities.service';
import { FundingApplicationCoverInformation } from 'src/app/shared/models/funding-application-cover.model';
import { MatchingWeightsService } from './matchingweights.service';
import { MatchingEngine } from './matching-engine.model';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

export interface MatchScore {
  opportunity: FundingOpportunity;
  score: number;
  matchReasons: string[];
  breakdown: {
    key: string;
    matched: boolean;
    weight: number;
    contribution: number;
  }[];
}

@Injectable({
  providedIn: 'root',
})
export class SuggestionsMatchingService {
  private opportunitiesService = inject(SMEOpportunitiesService);
  private profileService = inject(FundingProfileSetupService);
  private authService = inject(AuthService);
  private weightsService = inject(MatchingWeightsService);

  getSuggestedOpportunities(options?: {
    maxSuggestions?: number;
    excludeApplied?: boolean;
    coverInfo?: FundingApplicationCoverInformation | null;
  }): Observable<MatchScore[]> {
    const {
      maxSuggestions = 3,
      excludeApplied = true,
      coverInfo = null,
    } = options || {};

    return this.opportunitiesService.opportunities$.pipe(
      switchMap((opportunities) => {
        if (!opportunities?.length) {
          return of([]);
        }

        const user = this.authService.user();

        // No user → recent opportunities only
        if (!user) {
          return of(
            this.getMostRecentOpportunities(opportunities, maxSuggestions)
          );
        }

        return from(this.weightsService.getWeights()).pipe(
          map((weights) => {
            const scored = opportunities.map((opp) => {
              // PRIMARY PATH: COVER-BASED MATCHING
              if (coverInfo) {
                return MatchingEngine.score(opp, coverInfo, weights);
              }

              // FALLBACK: PROFILE-BASED MATCHING
              return this.scoreUsingProfile(opp, this.profileService.data());
            });

            scored.sort((a, b) => b.score - a.score);

            return scored.slice(0, maxSuggestions);
          })
        );
      }),
      catchError((err) => {
        console.error('Suggestion matching failed', err);
        return of([]);
      })
    );
  }

  /**
   * Existing logic preserved as fallback
   */
  private scoreUsingProfile(
    opportunity: FundingOpportunity,
    profileData: any
  ): MatchScore {
    let score = 0;
    const reasons: string[] = [];
    const breakdown: MatchScore['breakdown'] = [];

    const industry = profileData?.companyInfo?.industryType;
    const eligibleIndustries =
      opportunity.eligibilityCriteria?.industries || [];

    if (industry && eligibleIndustries.includes(industry)) {
      score += 40;
      reasons.push('Matches your industry');
      breakdown.push({
        key: 'industry',
        matched: true,
        weight: 40,
        contribution: 40,
      });
    } else {
      breakdown.push({
        key: 'industry',
        matched: false,
        weight: 40,
        contribution: 0,
      });
    }

    if (opportunity.currentApplications < 5) {
      score += 10;
      reasons.push('Low competition');
      breakdown.push({
        key: 'competition',
        matched: true,
        weight: 10,
        contribution: 10,
      });
    } else {
      breakdown.push({
        key: 'competition',
        matched: false,
        weight: 10,
        contribution: 0,
      });
    }

    // Fallback if no reasons matched
    if (!reasons.length) reasons.push('Recommended for you');

    return {
      opportunity,
      score,
      matchReasons: reasons,
      breakdown,
    };
  }

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
        score: 50,
        matchReasons: ['Recently published'],
        breakdown: [
          { key: 'recent', matched: true, weight: 0, contribution: 50 },
        ],
      }));
  }
}
