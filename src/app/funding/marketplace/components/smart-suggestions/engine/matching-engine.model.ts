import { FundingApplicationCoverInformation } from 'src/app/shared/models/funding-application-cover.model';
import { MatchScore } from './suggestions-matching.service';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

export interface MatchingWeights {
  fundingType: number;
  fundingAmount: number;
  businessStage: number;
  industry: number;
  geography: number;
  intent: number;
  recencyBonus: number;
  competitionBonus: number;
}

export const DEFAULT_MATCHING_WEIGHTS: MatchingWeights = {
  fundingType: 20,
  fundingAmount: 20,
  businessStage: 15,
  industry: 20,
  geography: 10,
  intent: 10,
  recencyBonus: 3,
  competitionBonus: 2,
};
export class MatchingEngine {
  static score(
    opportunity: FundingOpportunity,
    cover: FundingApplicationCoverInformation,
    weights: MatchingWeights
  ): MatchScore {
    let score = 0;
    const reasons: string[] = [];
    const breakdown: MatchScore['breakdown'] = [];

    // FUNDING TYPE
    const fundingTypeMatch =
      cover.fundingTypes?.some((t) => opportunity.fundingType?.includes(t)) ??
      false;
    if (fundingTypeMatch) {
      score += weights.fundingType;
      reasons.push('Matches your funding type');
    }
    breakdown.push({
      key: 'fundingType',
      matched: fundingTypeMatch,
      weight: weights.fundingType,
      contribution: fundingTypeMatch ? weights.fundingType : 0,
    });

    // FUNDING AMOUNT
    const amountMatch =
      cover.fundingAmount >= (opportunity.minInvestment ?? 0) &&
      cover.fundingAmount <= (opportunity.maxInvestment ?? Infinity);
    if (amountMatch) {
      score += weights.fundingAmount;
      reasons.push('Funding amount fits your request');
    }
    breakdown.push({
      key: 'fundingAmount',
      matched: amountMatch,
      weight: weights.fundingAmount,
      contribution: amountMatch ? weights.fundingAmount : 0,
    });

    // BUSINESS STAGE
    const stageMatch =
      cover.businessStages?.some((s) =>
        opportunity.eligibilityCriteria?.businessStages?.includes(s)
      ) ?? false;
    if (stageMatch) {
      score += weights.businessStage;
      reasons.push('Suitable for your business stage');
    }
    breakdown.push({
      key: 'businessStage',
      matched: stageMatch,
      weight: weights.businessStage,
      contribution: stageMatch ? weights.businessStage : 0,
    });

    // INDUSTRY
    const industryMatch =
      cover.industries?.some((i) =>
        opportunity.eligibilityCriteria?.industries?.includes(i)
      ) ?? false;
    if (industryMatch) {
      score += weights.industry;
      reasons.push('Relevant to your industry');
    }
    breakdown.push({
      key: 'industry',
      matched: industryMatch,
      weight: weights.industry,
      contribution: industryMatch ? weights.industry : 0,
    });

    // GEOGRAPHY
    const geo = opportunity.eligibilityCriteria?.geographicRestrictions ?? [];
    const geoMatch = !geo.length || geo.some((g) => g.includes(cover.location));
    if (geoMatch) {
      score += weights.geography;
      reasons.push('Available in your location');
    }
    breakdown.push({
      key: 'geography',
      matched: geoMatch,
      weight: weights.geography,
      contribution: geoMatch ? weights.geography : 0,
    });

    // RECENCY BONUS
    const daysOld =
      (Date.now() - new Date(opportunity.createdAt).getTime()) /
      (1000 * 60 * 60 * 24);
    const recentMatch = daysOld <= 7;
    if (recentMatch) {
      score += weights.recencyBonus;
      reasons.push('Recently published');
    }
    breakdown.push({
      key: 'recencyBonus',
      matched: recentMatch,
      weight: weights.recencyBonus,
      contribution: recentMatch ? weights.recencyBonus : 0,
    });

    // LOW COMPETITION
    const lowCompetitionMatch = opportunity.currentApplications < 5;
    if (lowCompetitionMatch) {
      score += weights.competitionBonus;
      reasons.push('Low competition');
    }
    breakdown.push({
      key: 'competitionBonus',
      matched: lowCompetitionMatch,
      weight: weights.competitionBonus,
      contribution: lowCompetitionMatch ? weights.competitionBonus : 0,
    });

    return {
      opportunity,
      score: Math.min(score, 100),
      matchReasons: reasons,
      breakdown,
    };
  }
}
