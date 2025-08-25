// src/app/applications/services/ai-analysis.service.ts
import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';
import { FundingOpportunity } from '../../shared/models/funder.models';

export interface AIAnalysisRequest {
  opportunity: FundingOpportunity;
  applicationData: {
    requestedAmount: string;
    purposeStatement: string;
    useOfFunds: string;
    timeline: string;
    opportunityAlignment: string;
  };
  businessProfile?: any; // Optional business profile data
}

export interface AIAnalysisResult {
  matchScore: number; // 0-100
  strengths: string[];
  improvementAreas: string[];
  successProbability: number; // 0-100
  competitivePositioning: 'strong' | 'moderate' | 'weak';
  keyInsights: string[];
  recommendations: string[];
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    impact: string;
  }>;
  generatedAt: Date;
  analysisId: string;
}

@Injectable({
  providedIn: 'root'
})
export class AIAnalysisService {
  // Loading states
  isAnalyzing = signal<boolean>(false);
  error = signal<string | null>(null);

  // Analysis cache to avoid re-running identical analyses
  private analysisCache = new Map<string, AIAnalysisResult>();

  constructor() {}

  /**
   * Perform comprehensive AI analysis of funding application
   */
  analyzeApplication(request: AIAnalysisRequest): Observable<AIAnalysisResult> {
    this.isAnalyzing.set(true);
    this.error.set(null);

    // Generate cache key from request data
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    if (this.analysisCache.has(cacheKey)) {
      this.isAnalyzing.set(false);
      return of(this.analysisCache.get(cacheKey)!);
    }

    // Simulate AI analysis with progressive steps
    return this.performAnalysis(request).pipe(
      delay(3000), // Simulate API call time
      map(result => {
        // Cache the result
        this.analysisCache.set(cacheKey, result);
        this.isAnalyzing.set(false);
        return result;
      })
    );
  }

  /**
   * Perform quick match score analysis
   */
  quickMatchAnalysis(request: AIAnalysisRequest): Observable<{ matchScore: number; quickInsights: string[] }> {
    return this.calculateMatchScore(request).pipe(
      delay(1000),
      map(score => ({
        matchScore: score,
        quickInsights: this.generateQuickInsights(request, score)
      }))
    );
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
  }

  /**
   * Get cached analysis result
   */
  getCachedAnalysis(request: AIAnalysisRequest): AIAnalysisResult | null {
    const cacheKey = this.generateCacheKey(request);
    return this.analysisCache.get(cacheKey) || null;
  }

  // ===============================
  // PRIVATE ANALYSIS METHODS
  // ===============================

  private performAnalysis(request: AIAnalysisRequest): Observable<AIAnalysisResult> {
    const { opportunity, applicationData } = request;
    
    // Calculate match score based on various factors
    const matchScore = this.calculateDetailedMatchScore(request);
    const successProbability = this.calculateSuccessProbability(request, matchScore);
    const competitivePositioning = this.determineCompetitivePositioning(matchScore);
    
    const result: AIAnalysisResult = {
      matchScore,
      successProbability,
      competitivePositioning,
      strengths: this.identifyStrengths(request, matchScore),
      improvementAreas: this.identifyImprovementAreas(request, matchScore),
      keyInsights: this.generateKeyInsights(request, matchScore),
      recommendations: this.generateRecommendations(request, matchScore),
      riskFactors: this.assessRiskFactors(request, matchScore),
      generatedAt: new Date(),
      analysisId: this.generateAnalysisId()
    };

    return of(result);
  }

  private calculateDetailedMatchScore(request: AIAnalysisRequest): number {
    const { opportunity, applicationData } = request;
    let score = 50; // Base score

    // Amount appropriateness (15 points)
    const requestedAmount = parseFloat(applicationData.requestedAmount);
    if (requestedAmount >= opportunity.minInvestment && requestedAmount <= opportunity.maxInvestment) {
      score += 15;
      
      // Bonus for optimal amount (within 25-75% of range)
      const range = opportunity.maxInvestment - opportunity.minInvestment;
      const position = (requestedAmount - opportunity.minInvestment) / range;
      if (position >= 0.25 && position <= 0.75) {
        score += 5;
      }
    } else {
      score -= 10; // Penalty for out-of-range amount
    }

    // Purpose statement quality (15 points)
    const purposeLength = applicationData.purposeStatement.length;
    if (purposeLength > 200) score += 15;
    else if (purposeLength > 100) score += 10;
    else if (purposeLength > 50) score += 5;

    // Use of funds specificity (15 points)
    const useOfFundsLength = applicationData.useOfFunds.length;
    const hasSpecificKeywords = /equipment|inventory|marketing|expansion|hiring|technology/i.test(applicationData.useOfFunds);
    if (useOfFundsLength > 200 && hasSpecificKeywords) score += 15;
    else if (useOfFundsLength > 100) score += 10;
    else if (useOfFundsLength > 50) score += 5;

    // Timeline specificity (5 points)
    if (applicationData.timeline && applicationData.timeline.length > 10) score += 5;

    // Opportunity alignment (10 points)
    if (applicationData.opportunityAlignment && applicationData.opportunityAlignment.length > 50) score += 10;

    // Add some controlled randomness for realism (±5 points)
    score += (Math.random() - 0.5) * 10;

    return Math.round(Math.max(10, Math.min(95, score)));
  }

  private calculateMatchScore(request: AIAnalysisRequest): Observable<number> {
    // Simplified version for quick analysis
    const score = this.calculateDetailedMatchScore(request);
    return of(score);
  }

  private calculateSuccessProbability(request: AIAnalysisRequest, matchScore: number): number {
    // Success probability based on match score with some additional factors
    let probability = matchScore * 0.8; // Base probability from match score

    // Funding type adjustments
    if (request.opportunity.fundingType === 'equity') {
      probability *= 0.7; // Equity funding is more competitive
    } else if (request.opportunity.fundingType === 'debt') {
      probability *= 1.1; // Debt might be more accessible
    } else if (request.opportunity.fundingType === 'convertible') {
      probability *= 0.8; // Convertible notes are moderately competitive
    }

    // Amount vs. available funding adjustment
    const requestedAmount = parseFloat(request.applicationData.requestedAmount);
    if (requestedAmount < request.opportunity.minInvestment * 1.5) {
      probability *= 1.05; // Smaller amounts have higher success rate
    }

    return Math.round(Math.max(5, Math.min(95, probability)));
  }

  private determineCompetitivePositioning(matchScore: number): 'strong' | 'moderate' | 'weak' {
    if (matchScore >= 80) return 'strong';
    if (matchScore >= 60) return 'moderate';
    return 'weak';
  }

  private identifyStrengths(request: AIAnalysisRequest, matchScore: number): string[] {
    const strengths: string[] = [];
    const { opportunity, applicationData } = request;

    // Amount-based strengths
    const requestedAmount = parseFloat(applicationData.requestedAmount);
    if (requestedAmount >= opportunity.minInvestment && requestedAmount <= opportunity.maxInvestment) {
      strengths.push('Funding amount is well within opportunity parameters');
    }

    // Content quality strengths
    if (applicationData.purposeStatement.length > 150) {
      strengths.push('Clear and comprehensive purpose statement');
    }

    if (applicationData.useOfFunds.length > 150) {
      strengths.push('Detailed breakdown of fund utilization');
    }

    // Opportunity alignment
    if (applicationData.opportunityAlignment && applicationData.opportunityAlignment.length > 100) {
      strengths.push('Strong alignment with opportunity objectives');
    }

    // Timeline specificity
    if (applicationData.timeline && applicationData.timeline.includes('month')) {
      strengths.push('Realistic and specific timeline provided');
    }

    // Score-based strengths
    if (matchScore >= 85) {
      strengths.push('Exceptional match for this opportunity');
    } else if (matchScore >= 75) {
      strengths.push('Strong overall application quality');
    }

    return strengths.slice(0, 4); // Limit to top 4 strengths
  }

  private identifyImprovementAreas(request: AIAnalysisRequest, matchScore: number): string[] {
    const areas: string[] = [];
    const { applicationData } = request;

    // Content improvements
    if (applicationData.purposeStatement.length < 100) {
      areas.push('Expand purpose statement with more business details');
    }

    if (applicationData.useOfFunds.length < 100) {
      areas.push('Provide more specific breakdown of fund allocation');
    }

    if (!applicationData.timeline || applicationData.timeline.length < 20) {
      areas.push('Include detailed implementation timeline');
    }

    // Always relevant improvements
    areas.push('Add financial projections and ROI estimates');
    areas.push('Include market analysis and competitive positioning');

    if (matchScore < 70) {
      areas.push('Consider revising funding amount based on business needs');
      areas.push('Strengthen business case with supporting evidence');
    }

    return areas.slice(0, 4); // Limit to top 4 areas
  }

  private generateKeyInsights(request: AIAnalysisRequest, matchScore: number): string[] {
    const insights: string[] = [];
    const { opportunity, applicationData } = request;

    if (matchScore >= 80) {
      insights.push('Your application demonstrates strong potential for approval');
    } else if (matchScore >= 60) {
      insights.push('Application shows good alignment but has room for improvement');
    } else {
      insights.push('Application needs significant enhancement to be competitive');
    }

    // Funding type insights
    if (opportunity.fundingType === 'equity') {
      insights.push('Equity funding typically requires strong growth potential and scalability');
    } else if (opportunity.fundingType === 'debt') {
      insights.push('Debt funding approval will depend heavily on financial creditworthiness and cash flow');
    } else if (opportunity.fundingType === 'convertible') {
      insights.push('Convertible funding offers flexibility but requires clear conversion terms');
    } else if (opportunity.fundingType === 'mezzanine') {
      insights.push('Mezzanine financing typically requires established revenue and growth trajectory');
    }

    // Amount insights
    const requestedAmount = parseFloat(applicationData.requestedAmount);
    const midpoint = (opportunity.minInvestment + opportunity.maxInvestment) / 2;
    if (requestedAmount > midpoint) {
      insights.push('Requesting above-average amount may require stronger justification');
    } else {
      insights.push('Conservative funding request may improve approval odds');
    }

    return insights;
  }

  private generateRecommendations(request: AIAnalysisRequest, matchScore: number): string[] {
    const recommendations: string[] = [];

    // Score-based recommendations
    if (matchScore < 60) {
      recommendations.push('Consider significantly enhancing your application before submission');
      recommendations.push('Seek feedback from business advisors or consultants');
    } else if (matchScore < 80) {
      recommendations.push('Address improvement areas to strengthen your position');
      recommendations.push('Consider adding supporting documentation');
    } else {
      recommendations.push('Your application is strong - proceed with confidence');
      recommendations.push('Review for any final polish before submission');
    }

    // General recommendations
    recommendations.push('Prepare for potential follow-up questions from funders');
    recommendations.push('Have financial documents ready for due diligence');

    return recommendations;
  }

  private assessRiskFactors(request: AIAnalysisRequest, matchScore: number): Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    impact: string;
  }> {
    const risks = [];

    if (matchScore < 50) {
      risks.push({
        factor: 'Low application quality',
        severity: 'high' as const,
        impact: 'May result in immediate rejection without review'
      });
    } else if (matchScore < 70) {
      risks.push({
        factor: 'Competitive disadvantage',
        severity: 'medium' as const,
        impact: 'May be outcompeted by stronger applications'
      });
    }

    // Amount-based risks
    const requestedAmount = parseFloat(request.applicationData.requestedAmount);
    if (requestedAmount > request.opportunity.maxInvestment) {
      risks.push({
        factor: 'Amount exceeds opportunity limit',
        severity: 'high' as const,
        impact: 'Application may be automatically disqualified'
      });
    }

    return risks;
  }

  private generateQuickInsights(request: AIAnalysisRequest, matchScore: number): string[] {
    const insights = [];
    
    if (matchScore >= 80) {
      insights.push('Strong match - proceed with confidence');
    } else if (matchScore >= 60) {
      insights.push('Good potential - consider improvements');
    } else {
      insights.push('Needs enhancement before submission');
    }

    return insights;
  }

  private generateCacheKey(request: AIAnalysisRequest): string {
    const key = JSON.stringify({
      opportunityId: request.opportunity.id,
      requestedAmount: request.applicationData.requestedAmount,
      purposeStatement: request.applicationData.purposeStatement?.substring(0, 50),
      useOfFunds: request.applicationData.useOfFunds?.substring(0, 50)
    });
    return btoa(key); // Base64 encode for cleaner cache keys
  }

  private generateAnalysisId(): string {
    return 'analysis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}