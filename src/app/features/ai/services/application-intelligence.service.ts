// src/app/ai/services/application-intelligence.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface ApplicationInsight {
  type: 'strength' | 'risk' | 'opportunity' | 'concern';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendation: string;
  score: number;
}

export interface InvestmentScore {
  overall: number;
  breakdown: {
    financial: number;
    market: number;
    team: number;
    traction: number;
  };
  recommendation: 'strong_buy' | 'consider' | 'pass' | 'need_more_info';
  confidence: number;
}

export interface ComprehensiveAnalysis {
  investmentScore: InvestmentScore;
  insights: ApplicationInsight[];
  aiAnalysis?: any;
  riskProfile?: any;
  marketPosition?: any;
}

type Severity = 'low' | 'medium' | 'high';

@Injectable({
  providedIn: 'root',
})
export class ApplicationIntelligenceService {
  private supabase = inject(SharedSupabaseService);

  /**
   * Get comprehensive analysis using all Edge Functions
   */
  getComprehensiveAnalysis(
    application: any,
    opportunity: any,
    profileData: any
  ): Observable<ComprehensiveAnalysis> {
    // Run all analyses in parallel
    const analyses = forkJoin({
      aiAnalysis: this.getAIApplicationAnalysis(
        application,
        opportunity,
        profileData
      ),
      riskProfile: this.getRiskProfileAnalysis(profileData),
      marketPosition: this.getMarketPositionAnalysis(
        profileData,
        opportunity?.industry
      ),
      localAnalysis: of(
        this.analyzeApplicationLocally(application, opportunity, profileData)
      ),
    }).pipe(
      map((results) => this.synthesizeAnalyses(results)),
      catchError((error) => {
        console.error('Comprehensive analysis failed:', error);
        const fallback = this.analyzeApplicationLocally(
          application,
          opportunity,
          profileData
        );
        return of({
          investmentScore: fallback.score,
          insights: fallback.insights,
        });
      })
    );

    return analyses;
  }

  /**
   * Call analyze-application Edge Function
   */
  private getAIApplicationAnalysis(
    application: any,
    opportunity: any,
    profileData: any
  ): Observable<any> {
    return from(
      this.supabase.functions.invoke('analyze-application', {
        body: {
          analysisMode: 'opportunity',
          applicationData: {
            requestedAmount: this.extractRequestedAmount(application),
            purposeStatement:
              application.description || application.formData?.purposeStatement,
            useOfFunds: application.formData?.useOfFunds,
            timeline: application.formData?.timeline,
          },
          opportunityData: {
            title: opportunity.title,
            fundingType: opportunity.fundingType,
            minInvestment: opportunity.minAmount,
            maxInvestment: opportunity.maxAmount,
            totalAvailable: opportunity.totalAmount,
            currency: opportunity.currency || 'ZAR',
          },
          businessProfile: profileData,
          backgroundMode: false,
        },
      })
    ).pipe(
      map((response) => response.data),
      catchError((error) => {
        console.warn('AI analysis failed:', error);
        return of(null);
      })
    );
  }

  /**
   * Call analyze-risk-profile Edge Function
   */
  private getRiskProfileAnalysis(profileData: any): Observable<any> {
    return from(
      this.supabase.functions.invoke('analyze-risk-profile', {
        body: {
          analysisType: 'comprehensive_risk',
          profileData: profileData,
          industry: profileData?.companyInfo?.industryType || 'General',
          analysisMode: 'investor',
        },
      })
    ).pipe(
      map((response) => response.data?.analysis),
      catchError((error) => {
        console.warn('Risk analysis failed:', error);
        return of(null);
      })
    );
  }

  /**
   * Call analyze-market-position Edge Function
   */
  private getMarketPositionAnalysis(
    profileData: any,
    industry?: string
  ): Observable<any> {
    return from(
      this.supabase.functions.invoke('analyze-market-position', {
        body: {
          analysisType: 'market_position',
          businessData: {
            businessModel: profileData?.businessAssessment?.businessModel,
            valueProposition: profileData?.businessAssessment?.valueProposition,
            targetMarkets: profileData?.marketData?.targetMarkets || [],
            competitivePosition:
              profileData?.businessAssessment?.competitivePosition,
            marketSize: profileData?.businessAssessment?.marketSize,
            keyPerformanceIndicators:
              profileData?.keyPerformanceIndicators || [],
          },
          marketIntelligence: {},
          industry:
            industry || profileData?.companyInfo?.industryType || 'General',
          analysisMode: 'investor',
        },
      })
    ).pipe(
      map((response) => response.data?.analysis),
      catchError((error) => {
        console.warn('Market position analysis failed:', error);
        return of(null);
      })
    );
  }

  /**
   * Local analysis (instant, no API calls)
   */
  analyzeApplicationLocally(
    application: any,
    opportunity: any,
    profileData: any
  ): { score: InvestmentScore; insights: ApplicationInsight[] } {
    const insights: ApplicationInsight[] = [];
    let financialScore = 0;
    let marketScore = 0;
    let teamScore = 0;
    let tractionScore = 0;

    // FINANCIAL ANALYSIS
    const requestedAmount = this.extractRequestedAmount(application);
    const revenue = profileData?.financialProfile?.monthlyRevenue
      ? profileData.financialProfile.monthlyRevenue * 12
      : 0;

    if (revenue > 0 && requestedAmount > 0) {
      const fundingToRevenueRatio = requestedAmount / revenue;

      if (fundingToRevenueRatio > 5) {
        insights.push({
          type: 'risk',
          severity: 'high',
          title: 'High Funding-to-Revenue Ratio',
          description: `Requesting R${this.formatAmount(
            requestedAmount
          )} with R${this.formatAmount(
            revenue
          )} annual revenue (${fundingToRevenueRatio.toFixed(1)}x ratio)`,
          recommendation:
            'Request detailed financial projections and use of funds breakdown',
          score: 30,
        });
        financialScore = 30;
      } else if (fundingToRevenueRatio > 2) {
        insights.push({
          type: 'concern',
          severity: 'medium',
          title: 'Moderate Funding Request',
          description: `Funding request is ${fundingToRevenueRatio.toFixed(
            1
          )}x annual revenue`,
          recommendation: 'Verify growth projections and capital efficiency',
          score: 60,
        });
        financialScore = 60;
      } else {
        insights.push({
          type: 'strength',
          severity: 'low',
          title: 'Conservative Funding Request',
          description: `Requesting ${fundingToRevenueRatio.toFixed(
            1
          )}x annual revenue - indicates realistic expectations`,
          recommendation: 'Good signal of capital discipline',
          score: 85,
        });
        financialScore = 85;
      }
    } else if (revenue === 0) {
      insights.push({
        type: 'risk',
        severity: 'high',
        title: 'No Revenue Data',
        description:
          'Unable to assess funding request against current performance',
        recommendation:
          'Request complete financial statements before proceeding',
        score: 20,
      });
      financialScore = 20;
    } else {
      financialScore = 50;
    }

    // Debt-to-Equity Analysis
    const debtToEquity = profileData?.financialProfile?.debtToEquity || 0;
    if (debtToEquity > 2) {
      insights.push({
        type: 'risk',
        severity: 'high',
        title: 'High Debt Levels',
        description: `Debt-to-equity ratio of ${debtToEquity.toFixed(
          2
        )} indicates high leverage`,
        recommendation: 'Review debt service coverage and cash flow adequacy',
        score: 30,
      });
      financialScore = Math.min(financialScore, 40);
    }

    // PROFILE COMPLETENESS
    const completionPercentage = profileData?.completionPercentage || 0;

    if (completionPercentage >= 90) {
      insights.push({
        type: 'strength',
        severity: 'low',
        title: 'Complete Business Profile',
        description: `${completionPercentage}% profile completion shows commitment and preparation`,
        recommendation: 'Profile quality indicates funding readiness',
        score: 90,
      });
      teamScore = 90;
    } else if (completionPercentage < 60) {
      insights.push({
        type: 'concern',
        severity: 'medium',
        title: 'Incomplete Business Profile',
        description: `Only ${completionPercentage}% complete - missing critical information`,
        recommendation: 'Request profile completion before detailed evaluation',
        score: 40,
      });
      teamScore = 40;
    } else {
      teamScore = completionPercentage;
    }

    // MARKET ALIGNMENT
    if (opportunity?.industry && profileData?.companyInfo?.industryType) {
      const industryMatch =
        opportunity.industry.toLowerCase() ===
        profileData.companyInfo.industryType.toLowerCase();

      if (industryMatch) {
        insights.push({
          type: 'strength',
          severity: 'low',
          title: 'Strong Industry Alignment',
          description:
            'Business operates in target industry for this opportunity',
          recommendation: 'Industry fit reduces investment risk',
          score: 85,
        });
        marketScore = 85;
      } else {
        insights.push({
          type: 'concern',
          severity: 'medium',
          title: 'Industry Mismatch',
          description: `Applicant industry (${profileData.companyInfo.industryType}) differs from opportunity focus (${opportunity.industry})`,
          recommendation:
            'Verify strategic fit and rationale for cross-industry application',
          score: 50,
        });
        marketScore = 50;
      }
    } else {
      marketScore = 50;
    }

    // TRACTION ANALYSIS
    const customers = profileData?.marketData?.customerBase || 0;
    if (customers > 100) {
      insights.push({
        type: 'strength',
        severity: 'low',
        title: 'Established Customer Base',
        description: `${customers} customers demonstrates market validation`,
        recommendation: 'Strong traction indicator',
        score: 90,
      });
      tractionScore = 90;
    } else if (customers > 10) {
      tractionScore = 70;
    } else if (customers > 0) {
      insights.push({
        type: 'concern',
        severity: 'medium',
        title: 'Limited Customer Traction',
        description: 'Early-stage with minimal customer base',
        recommendation:
          'Assess customer acquisition strategy and unit economics',
        score: 40,
      });
      tractionScore = 40;
    } else {
      tractionScore = 30;
    }

    // CALCULATE OVERALL SCORE
    const overall = Math.round(
      financialScore * 0.35 +
        marketScore * 0.25 +
        teamScore * 0.2 +
        tractionScore * 0.2
    );

    let recommendation: 'strong_buy' | 'consider' | 'pass' | 'need_more_info';
    if (overall >= 75) recommendation = 'strong_buy';
    else if (overall >= 60) recommendation = 'consider';
    else if (overall >= 40) recommendation = 'need_more_info';
    else recommendation = 'pass';

    return {
      score: {
        overall,
        breakdown: {
          financial: financialScore,
          market: marketScore,
          team: teamScore,
          traction: tractionScore,
        },
        recommendation,
        confidence: this.calculateConfidence(insights),
      },
      insights,
    };
  }

  /**
   * Synthesize all analyses into comprehensive result
   */
  private synthesizeAnalyses(results: any): ComprehensiveAnalysis {
    const localAnalysis = results.localAnalysis;
    const insights: ApplicationInsight[] = [...localAnalysis.insights];

    // Add AI-powered insights
    if (results.aiAnalysis) {
      if (Array.isArray(results.aiAnalysis.hiddenGemIndicators)) {
        results.aiAnalysis.hiddenGemIndicators.forEach((indicator: string) => {
          insights.push({
            type: 'opportunity',
            severity: 'low',
            title: 'Hidden Gem Indicator',
            description: indicator,
            recommendation: 'Investigate further for competitive advantage',
            score: 85,
          });
        });
      }

      if (Array.isArray(results.aiAnalysis.contrarianSignals)) {
        results.aiAnalysis.contrarianSignals.forEach((signal: string) => {
          insights.push({
            type: 'opportunity',
            severity: 'medium',
            title: 'Contrarian Signal',
            description: signal,
            recommendation: 'Consider non-obvious investment angle',
            score: 75,
          });
        });
      }
    }

    // Add risk profile insights
    if (
      results.riskProfile?.criticalRisks &&
      Array.isArray(results.riskProfile.criticalRisks)
    ) {
      results.riskProfile.criticalRisks.forEach((risk: any) => {
        const severity = this.normalizeSeverity(risk.impact);
        const score = this.getSeverityScore(severity);

        insights.push({
          type: 'risk',
          severity: severity,
          title: `${risk.category || 'General'} Risk`,
          description: risk.risk || 'Risk identified',
          recommendation: risk.mitigation || 'Mitigation strategy required',
          score: score,
        });
      });
    }

    // Add market position insights
    if (results.marketPosition) {
      const mp = results.marketPosition;

      if (mp.competitiveStrength === 'strong') {
        insights.push({
          type: 'strength',
          severity: 'low',
          title: 'Strong Competitive Position',
          description: `Market differentiation score: ${
            mp.differentiationScore || 'High'
          }`,
          recommendation: 'Leverage competitive advantages in pitch',
          score: 90,
        });
      }
    }

    // Enhance investment score with AI data
    const enhancedScore = { ...localAnalysis.score };
    if (
      results.aiAnalysis?.matchScore &&
      typeof results.aiAnalysis.matchScore === 'number'
    ) {
      enhancedScore.overall = Math.round(
        enhancedScore.overall * 0.6 + results.aiAnalysis.matchScore * 0.4
      );
      enhancedScore.confidence = Math.min(95, enhancedScore.confidence + 10);
    }

    // Sort insights by severity
    const sortedInsights = this.sortInsightsBySeverity(insights);

    return {
      investmentScore: enhancedScore,
      insights: sortedInsights,
      aiAnalysis: results.aiAnalysis,
      riskProfile: results.riskProfile,
      marketPosition: results.marketPosition,
    };
  }

  /**
   * Helper: Normalize severity to valid type
   */
  private normalizeSeverity(value: any): Severity {
    if (value === 'low' || value === 'medium' || value === 'high') {
      return value;
    }
    return 'medium'; // default
  }

  /**
   * Helper: Get score for severity level
   */
  private getSeverityScore(severity: Severity): number {
    const scoreMap: Record<Severity, number> = {
      high: 30,
      medium: 50,
      low: 70,
    };
    return scoreMap[severity];
  }

  /**
   * Helper: Sort insights by severity (high -> medium -> low)
   */
  private sortInsightsBySeverity(
    insights: ApplicationInsight[]
  ): ApplicationInsight[] {
    const urgencyWeight: Record<Severity, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    return insights.sort((a, b) => {
      const aSeverity = this.normalizeSeverity(a.severity);
      const bSeverity = this.normalizeSeverity(b.severity);
      return urgencyWeight[bSeverity] - urgencyWeight[aSeverity];
    });
  }

  /**
   * Helper: Extract requested amount from application
   */
  private extractRequestedAmount(application: any): number {
    const formData = application?.formData || {};
    const amount = formData.requestedAmount || formData.offerAmount || 0;
    return typeof amount === 'string' ? parseFloat(amount) : amount;
  }

  /**
   * Helper: Format amount for display
   */
  private formatAmount(amount: number): string {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toLocaleString();
  }

  /**
   * Helper: Calculate confidence based on data points
   */
  private calculateConfidence(insights: ApplicationInsight[]): number {
    const dataPoints = insights.length;
    return Math.min(95, 50 + dataPoints * 5);
  }
}
