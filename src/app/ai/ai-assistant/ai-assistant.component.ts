// src/app/ai/ai-assistant/ai-assistant.component.ts
import {
  Component,
  inject,
  Input,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Sparkles,
  Lightbulb,
  TrendingUp,
  Copy,
  Calculator,
  FileText,
  HelpCircle,
  AlertTriangle,
  Target,
  DollarSign,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle as AlertCircleIcon,
} from 'lucide-angular';

import { Subject, takeUntil } from 'rxjs';
import {
  MarketIntelligenceService,
  MarketIntelligence,
  CompetitorIntelligence,
} from '../services/market-intelligence.service';
import {
  ApplicationIntelligenceService,
  ApplicationInsight,
  InvestmentScore,
} from '../services/application-intelligence.service';

interface FormData {
  fundingType: string;
  offerAmount: string;
  industry?: string;
  targetStage?: string;
  [key: string]: any;
}

interface IntelligenceInsight {
  type:
    | 'market_timing'
    | 'competitor_activity'
    | 'risk_alert'
    | 'opportunity'
    | 'regulatory'
    | 'funding_trend';
  urgency: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionItem?: string;
  source?: string;
  confidence: number;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: 'ai-assistant.component.html',
})
export class AiAssistantComponent implements OnInit, OnDestroy {
  @Input() currentStep: string = 'basic';
  @Input() formData: FormData = {} as FormData;
  @Input() completionPercentage: number = 0;
  @Input() currentOpportunity?: any;
  @Input() applicationData?: any;

  private lastAnalysisHash = signal<string | null>(null);

  private marketIntelligence = inject(MarketIntelligenceService);
  private appIntelligence = inject(ApplicationIntelligenceService);
  private destroy$ = new Subject<void>();

  // Icons
  SparklesIcon = Sparkles;
  LightbulbIcon = Lightbulb;
  TrendingUpIcon = TrendingUp;
  CopyIcon = Copy;
  CalculatorIcon = Calculator;
  FileTextIcon = FileText;
  HelpCircleIcon = HelpCircle;
  AlertTriangleIcon = AlertTriangle;
  TargetIcon = Target;
  DollarSignIcon = DollarSign;
  ClockIcon = Clock;
  ZapIcon = Zap;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  AlertCircleIcon = AlertCircleIcon;

  // Intelligence State
  marketData = signal<MarketIntelligence | null>(null);
  competitorData = signal<CompetitorIntelligence | null>(null);
  isLoadingIntelligence = signal(false);
  intelligenceError = signal<string | null>(null);

  // Application Intelligence State
  applicationAnalysis = signal<ApplicationInsight[]>([]);
  investmentScore = signal<InvestmentScore | null>(null);
  isAnalyzingApplication = signal(false);

  // Market research state
  isGeneratingResearch = signal(false);
  marketResearchGenerated = signal(false);
  researchError = signal<string | null>(null);

  // Computed Intelligence Insights
  allInsights = computed(() => {
    const insights: IntelligenceInsight[] = [];
    const market = this.marketData();
    const competitor = this.competitorData();

    // Market timing insights
    if (market?.timingInsights) {
      insights.push(
        ...market.timingInsights.slice(0, 2).map((insight) => ({
          type: 'market_timing' as const,
          urgency: this.assessTimingUrgency(insight),
          title: 'Market Timing Opportunity',
          description: insight,
          actionItem: 'Review timing strategy',
          confidence: market.confidence,
          source: 'Market Intelligence (Live Data)',
        }))
      );
    }

    // Risk Factors from Market Intelligence
    if (market?.riskFactors?.length) {
      market.riskFactors.forEach((risk: any) => {
        insights.push({
          type: 'risk_alert',
          urgency:
            risk.severity === 'high'
              ? 'high'
              : risk.severity === 'medium'
              ? 'medium'
              : 'low',
          title: risk.factor,
          description: risk.impact,
          actionItem: `Review ${risk.timeframe} risk mitigation`,
          confidence: market.confidence,
          source: 'Market Intelligence (Live Data)',
        });
      });
    }

    // Opportunities from Market Intelligence
    if (market?.opportunities?.length) {
      market.opportunities.forEach((opp: any) => {
        insights.push({
          type: 'opportunity',
          urgency: 'medium',
          title: opp.opportunity,
          description: `${opp.rationale}. Window: ${opp.timeframe}`,
          actionItem: 'Assess opportunity fit',
          confidence: market.confidence,
          source: 'Market Intelligence (Live Data)',
        });
      });
    }

    // Funding trend insights
    if (market?.fundingTrends) {
      const trend = market.fundingTrends;
      if (trend.valuationTrend === 'down' && trend.dealCount > 10) {
        insights.push({
          type: 'opportunity',
          urgency: 'high',
          title: 'Valuation Correction Opportunity',
          description: `Valuations trending down with ${trend.dealCount} deals last quarter. Better pricing available.`,
          actionItem: 'Consider aggressive positioning',
          confidence: market.confidence,
          source: 'Funding Data',
        });
      }
    }

    // Regulatory insights
    if (market?.regulatoryChanges?.length) {
      market.regulatoryChanges.forEach((change) => {
        insights.push({
          type: 'regulatory',
          urgency: 'medium',
          title: 'Regulatory Change Alert',
          description: change,
          actionItem: 'Review compliance impact',
          confidence: market.confidence,
          source: 'Regulatory Monitor',
        });
      });
    }

    // Competitor activity insights
    if (competitor?.recentNews?.length) {
      competitor.recentNews.slice(0, 1).forEach((news) => {
        insights.push({
          type: 'competitor_activity',
          urgency: 'medium',
          title: 'Competitive Intelligence',
          description: news,
          actionItem: 'Assess competitive impact',
          confidence: competitor.confidence,
          source: 'Competitor Research',
        });
      });
    }

    // Risk alerts from market data
    if (
      market?.fundingTrends?.dealCount &&
      market.fundingTrends.dealCount < 5
    ) {
      insights.push({
        type: 'risk_alert',
        urgency: 'high',
        title: 'Low Deal Activity Warning',
        description: `Only ${market.fundingTrends.dealCount} deals last quarter in this sector. Market may be cooling.`,
        actionItem: 'Consider sector diversification',
        confidence: market.confidence,
        source: 'Deal Flow Analysis',
      });
    }

    // Application-specific insights
    const appInsights = this.applicationAnalysis() || [];
    appInsights.forEach((insight: ApplicationInsight) => {
      insights.push({
        type: insight.type === 'strength' ? 'opportunity' : 'risk_alert',
        urgency: insight.severity,
        title: insight.title,
        description: insight.description,
        actionItem: insight.recommendation,
        confidence: this.investmentScore()?.confidence || 75,
        source: 'Application Analysis',
      });
    });

    return insights.sort((a, b) => {
      const urgencyWeight = { high: 3, medium: 2, low: 1 };
      return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    });
  });

  topInsight = computed(() => this.allInsights()[0] || null);

  contextualHelp = computed(() => {
    if (this.currentStep === 'terms' && this.formData.fundingType === 'debt') {
      return {
        title: 'Current Market Rates',
        message: this.getContextualRateAdvice(),
      };
    }
    if (this.currentStep === 'basic' && this.marketData()?.trends.length) {
      return {
        title: 'Market Trend Alert',
        message: `${
          this.marketData()!.trends[0]
        }. Consider how this affects your positioning.`,
      };
    }
    return null;
  });

  ngOnInit() {
    this.loadMarketIntelligence();
    this.analyzeApplication();
    this.setupIntelligenceRefresh();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // INTELLIGENCE LOADING
  // ===============================

  private loadMarketIntelligence() {
    const industry =
      this.formData.industry ||
      this.currentOpportunity?.industry ||
      this.applicationData?.industry;

    if (!industry) {
      console.log('No industry specified for market intelligence');
      return;
    }

    this.isLoadingIntelligence.set(true);
    this.intelligenceError.set(null);

    // Load market intelligence
    this.marketIntelligence
      .getMarketIntelligence(industry, { maxAge: 24 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (intelligence) => {
          this.marketData.set(intelligence);
          this.isLoadingIntelligence.set(false);
          console.log('Market intelligence loaded:', intelligence);
        },
        error: (error) => {
          this.intelligenceError.set(error.message);
          this.isLoadingIntelligence.set(false);
          console.error('Failed to load market intelligence:', error);
        },
      });

    // Load competitor intelligence if we have a company name
    const companyName =
      this.applicationData?.companyName || this.currentOpportunity?.title;
    if (companyName && companyName !== 'Unknown') {
      this.marketIntelligence
        .getCompetitorIntelligence(companyName, industry)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (competitor) => {
            this.competitorData.set(competitor);
            console.log('Competitor intelligence loaded:', competitor);
          },
          error: (error) => {
            console.warn('Competitor intelligence failed:', error);
          },
        });
    }
  }

  // private analyzeApplication() {
  //   if (!this.applicationData || !this.currentOpportunity) {
  //     console.log('No application data for analysis');
  //     return;
  //   }

  //   this.isAnalyzingApplication.set(true);

  //   // Use comprehensive analysis that calls all Edge Functions
  //   this.appIntelligence
  //     .getComprehensiveAnalysis(
  //       this.applicationData,
  //       this.currentOpportunity,
  //       this.applicationData.profileData
  //     )
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (analysis) => {
  //         this.applicationAnalysis.set(analysis.insights);
  //         this.investmentScore.set(analysis.investmentScore);
  //         this.isAnalyzingApplication.set(false);

  //         console.log('Comprehensive analysis complete:', analysis);
  //       },
  //       error: (error) => {
  //         console.error('Comprehensive analysis failed:', error);
  //         this.isAnalyzingApplication.set(false);
  //       },
  //     });
  // }

  private analyzeApplication() {
    if (!this.applicationData || !this.currentOpportunity) {
      return;
    }

    const hash = btoa(
      JSON.stringify({
        application: this.applicationData,
        opportunity: this.currentOpportunity,
        profile: this.applicationData.profileData,
      })
    );

    if (this.lastAnalysisHash() === hash) {
      console.log('Skipping analysis: no input changes');
      return;
    }

    this.lastAnalysisHash.set(hash);
    this.isAnalyzingApplication.set(true);

    this.appIntelligence
      .getComprehensiveAnalysis(
        this.applicationData,
        this.currentOpportunity,
        this.applicationData.profileData
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (analysis) => {
          this.applicationAnalysis.set(analysis.insights);
          this.investmentScore.set(analysis.investmentScore);
          this.isAnalyzingApplication.set(false);

          console.log('Comprehensive analysis complete:', analysis);
        },
        error: (error) => {
          console.error('Comprehensive analysis failed:', error);
          this.isAnalyzingApplication.set(false);
        },
      });
  }

  private setupIntelligenceRefresh() {
    // Refresh intelligence every 30 minutes
    const refreshInterval = setInterval(() => {
      if (!this.isLoadingIntelligence()) {
        this.loadMarketIntelligence();
      }
    }, 30 * 60 * 1000);

    // Cleanup on destroy
    this.destroy$.subscribe(() => {
      clearInterval(refreshInterval);
    });
  }

  // ===============================
  // MARKET RESEARCH FUNCTIONALITY
  // ===============================

  async generateMarketResearch() {
    const application = this.applicationData;
    const opportunity = this.currentOpportunity;

    if (!application || !opportunity) {
      console.error(
        'Missing application or opportunity data for market research'
      );
      return;
    }

    this.isGeneratingResearch.set(true);
    this.researchError.set(null);

    try {
      console.log('Generating market research...');

      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate random success/failure for demo
          if (Math.random() > 0.7) {
            reject(new Error('Market research generation failed'));
          } else {
            resolve(true);
          }
        }, 2000);
      });

      this.marketResearchGenerated.set(true);
      console.log('Market research generated successfully');
    } catch (error) {
      console.error('Error generating market research:', error);
      this.researchError.set(
        'Failed to generate market research. Please try again.'
      );
    } finally {
      this.isGeneratingResearch.set(false);
    }
  }

  retryMarketResearch() {
    this.researchError.set(null);
    this.generateMarketResearch();
  }

  getIntelligentSuggestion(): string {
    const market = this.marketData();
    const insights = this.allInsights();
    const score = this.investmentScore();

    // Priority: Investment score recommendation
    if (score) {
      if (score.recommendation === 'strong_buy') {
        return `Strong investment opportunity (${score.overall}/100). Key strengths align with market opportunity.`;
      }
      if (score.recommendation === 'pass') {
        return `Significant concerns identified (${score.overall}/100). Review risk factors before proceeding.`;
      }
    }

    // High urgency insights
    const highUrgencyInsight = insights.find((i) => i.urgency === 'high');
    if (highUrgencyInsight) {
      return `URGENT: ${highUrgencyInsight.description}`;
    }

    // Market timing insights
    if (market?.timingInsights?.length) {
      return market.timingInsights[0];
    }

    // Funding trends insight
    if (market?.fundingTrends) {
      const trend = market.fundingTrends;
      return `Market shows ${
        trend.dealCount
      } deals averaging ${this.formatAmount(
        trend.averageRoundSize
      )}. Valuations are ${trend.valuationTrend}.`;
    }

    return 'Analyzing application and market data...';
  }

  getEnhancedMarketInsight(): string {
    const market = this.marketData();

    if (!market) {
      return this.getFallbackMarketInsight();
    }

    // Prioritize most impactful trends
    if (market.trends?.length > 0) {
      return `${market.trends[0]}. ${
        market.competitorActivity?.[0] ||
        'Monitor competitive landscape closely.'
      }`;
    }

    if (market.fundingTrends) {
      const trend = market.fundingTrends;
      return `${
        trend.dealCount
      } deals completed last quarter with average size ${this.formatAmount(
        trend.averageRoundSize
      )}. Market sentiment: ${trend.valuationTrend}.`;
    }

    return 'Real-time market analysis in progress...';
  }

  private getFallbackMarketInsight(): string {
    if (this.formData.offerAmount) {
      const amount = Number(this.formData.offerAmount);
      const lowerRange = Math.round((amount * 0.5) / 1000);
      const upperRange = Math.round((amount * 1.5) / 1000);
      return `SMEs typically seek R${lowerRange}K-R${upperRange}K investments. Your structure aligns well with market norms.`;
    }
    return 'Market insights will appear here based on real-time analysis.';
  }

  hasMarketData(): boolean {
    return !!this.marketData()?.fundingTrends;
  }

  getMarketStats(): string {
    const market = this.marketData();
    if (!market?.fundingTrends) return '';

    const trend = market.fundingTrends;
    return `${trend.dealCount} deals • ${this.formatAmount(
      trend.totalFunding
    )} total • ${trend.valuationTrend} trend`;
  }

  // ===============================
  // ACTION HANDLERS
  // ===============================

  handleInsightAction(insight: IntelligenceInsight) {
    console.log('Handling insight action:', insight);

    switch (insight.type) {
      case 'market_timing':
        this.analyzeMarketTiming();
        break;
      case 'competitor_activity':
        this.researchCompetitors();
        break;
      case 'opportunity':
        this.exploreOpportunity(insight);
        break;
      case 'risk_alert':
        this.addressRisk(insight);
        break;
      default:
        console.log('No specific action for insight type:', insight.type);
    }
  }

  analyzeMarketTiming() {
    const industry =
      this.formData.industry || this.currentOpportunity?.industry;
    if (industry) {
      console.log('Refreshing market timing analysis for:', industry);
      this.marketIntelligence
        .getMarketIntelligence(industry, { forceRefresh: true })
        .pipe(takeUntil(this.destroy$))
        .subscribe((intelligence) => {
          this.marketData.set(intelligence);
        });
    }
  }

  researchCompetitors() {
    const companyName =
      this.applicationData?.companyName || this.formData['companyName'];
    const industry =
      this.formData.industry || this.currentOpportunity?.industry;

    if (companyName && industry) {
      console.log('Refreshing competitor research for:', companyName);
      this.marketIntelligence
        .getCompetitorIntelligence(companyName, industry, {
          forceRefresh: true,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe((competitor) => {
          this.competitorData.set(competitor);
        });
    }
  }

  private exploreOpportunity(insight: IntelligenceInsight) {
    console.log('Exploring opportunity:', insight.title);
  }

  private addressRisk(insight: IntelligenceInsight) {
    console.log('Addressing risk:', insight.title);
  }

  applySuggestion(): void {
    console.log('Applying AI suggestion...');
  }

  calculateReturns(): void {
    console.log('Calculating returns...');
  }

  generateDescription(): void {
    console.log('Generating description...');
  }

  showAllInsights(): void {
    console.log('Showing all insights:', this.allInsights());
  }

  refreshAnalysis(): void {
    this.loadMarketIntelligence();
    this.analyzeApplication();
  }

  // ===============================
  // UI HELPER METHODS
  // ===============================

  getScoreColor(score: number): string {
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-blue-600';
    return 'text-red-600';
  }

  getScoreBgColor(score: number): string {
    if (score >= 75) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-amber-50 border-amber-200';
    if (score >= 40) return 'bg-blue-50 border-blue-200';
    return 'bg-red-50 border-red-200';
  }

  getRecommendationColor(recommendation: string): string {
    if (recommendation === 'strong_buy') return 'text-green-700';
    if (recommendation === 'consider') return 'text-amber-700';
    if (recommendation === 'need_more_info') return 'text-blue-700';
    return 'text-red-700';
  }

  getRecommendationText(recommendation: string): string {
    return recommendation.replace(/_/g, ' ').toUpperCase();
  }

  private assessTimingUrgency(insight: string): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['urgent', 'immediate', 'crisis', 'crash', 'boom'];
    const mediumKeywords = ['trend', 'shift', 'change', 'opportunity'];

    const lowerInsight = insight.toLowerCase();

    if (urgentKeywords.some((keyword) => lowerInsight.includes(keyword))) {
      return 'high';
    }
    if (mediumKeywords.some((keyword) => lowerInsight.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  getInsightIcon(type: string): any {
    const icons: Record<string, any> = {
      market_timing: this.ClockIcon,
      competitor_activity: this.TargetIcon,
      risk_alert: this.AlertTriangleIcon,
      opportunity: this.ZapIcon,
      regulatory: this.FileTextIcon,
      funding_trend: this.DollarSignIcon,
    };
    return icons[type] || this.LightbulbIcon;
  }

  getInsightCardClass(urgency: string): string {
    const classes = {
      high: 'bg-red-50 border-red-200',
      medium: 'bg-amber-50 border-amber-200',
      low: 'bg-blue-50 border-blue-200',
    };
    return `border ${classes[urgency as keyof typeof classes]}`;
  }

  getInsightIconBg(urgency: string): string {
    const classes = {
      high: 'bg-red-100',
      medium: 'bg-amber-100',
      low: 'bg-blue-100',
    };
    return classes[urgency as keyof typeof classes];
  }

  getInsightIconColor(urgency: string): string {
    const classes = {
      high: 'text-red-600',
      medium: 'text-amber-600',
      low: 'text-blue-600',
    };
    return classes[urgency as keyof typeof classes];
  }

  getInsightTitleColor(urgency: string): string {
    const classes = {
      high: 'text-red-900',
      medium: 'text-amber-900',
      low: 'text-blue-900',
    };
    return classes[urgency as keyof typeof classes];
  }

  getInsightTextColor(urgency: string): string {
    const classes = {
      high: 'text-red-700',
      medium: 'text-amber-700',
      low: 'text-blue-700',
    };
    return classes[urgency as keyof typeof classes];
  }

  getInsightActionColor(urgency: string): string {
    const classes = {
      high: 'text-red-600 hover:text-red-800',
      medium: 'text-amber-600 hover:text-amber-800',
      low: 'text-blue-600 hover:text-blue-800',
    };
    return classes[urgency as keyof typeof classes];
  }

  getUrgencyDot(urgency: string): string {
    const classes = {
      high: 'bg-red-500',
      medium: 'bg-amber-500',
      low: 'bg-blue-500',
    };
    return classes[urgency as keyof typeof classes];
  }

  private getContextualRateAdvice(): string {
    const market = this.marketData();
    if (market?.fundingTrends?.averageRoundSize) {
      const avgRate = this.estimateMarketRate(market.fundingTrends);
      return `Current market rates averaging ${avgRate}% based on recent deal activity. Consider positioning within this range.`;
    }
    return 'Debt financing typically ranges 10-18% interest rates in SA. Equity investments expect 20-35% IRR.';
  }

  private estimateMarketRate(fundingTrends: any): string {
    if (fundingTrends.valuationTrend === 'down') return '12-15';
    if (fundingTrends.valuationTrend === 'up') return '15-18';
    return '13-16';
  }

  private formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return `${amount.toLocaleString()}`;
  }
}
