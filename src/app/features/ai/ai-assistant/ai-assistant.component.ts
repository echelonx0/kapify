// src/app/features/ai/ai-assistant/ai-assistant.component.ts
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
  Play,
} from 'lucide-angular';

import { Subject, takeUntil } from 'rxjs';
import {
  MarketIntelligenceService,
  MarketIntelligence,
  CompetitorIntelligence,
} from '../services/market-intelligence.service';
import {
  ApplicationInsight,
  InvestmentScore,
} from '../services/application-intelligence.service';

import {
  AiAssistantUiService,
  IntelligenceInsight,
} from '../services/ai-assistant-ui.service';

import { AiAnalysisController } from '../controllers/analysis.controller';
import { CreditGatingModalComponent } from '../../credit-system/credit-gating-modal.component';
import { CreditGatingService } from '../../credit-system/services/credit-gating.service';

interface FormData {
  fundingType: string;
  offerAmount: string;
  industry?: string;
  targetStage?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CreditGatingModalComponent],
  templateUrl: 'ai-assistant.component.html',
})
export class AiAssistantComponent implements OnInit, OnDestroy {
  // ✅ INPUTS
  @Input() currentStep: string = 'basic';
  @Input() formData: FormData = {} as FormData;
  @Input() completionPercentage: number = 0;
  @Input() currentOpportunity?: any;
  @Input() applicationData?: any;
  @Input() profileData?: any;
  @Input() organizationId?: string;

  // ✅ SERVICES
  private marketIntelligence = inject(MarketIntelligenceService);
  // private appIntelligence = inject(ApplicationIntelligenceService);

  private creditGating = inject(CreditGatingService);
  analysisController = inject(AiAnalysisController);
  uiService = inject(AiAssistantUiService);

  private destroy$ = new Subject<void>();
  walletBalance = computed(() => this.creditGating.wallet()?.balance || 0);

  // ✅ ICONS
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
  PlayIcon = Play;

  // ✅ STATE FROM CONTROLLER (read-only in component)
  isAnalysisAvailable = computed(() =>
    this.analysisController.isAnalysisAvailable()
  );
  isGeneratingAnalysis = computed(() =>
    this.analysisController.isGeneratingAnalysis()
  );
  analysisError = computed(() => this.analysisController.analysisError());
  showCreditGatingModal = signal(false);
  isProcessingCredits = computed(() =>
    this.analysisController.isProcessingCredits()
  );
  currentAnalysisRequestId = computed(() =>
    this.analysisController.currentAnalysisRequestId()
  );
  creditGatingCost = computed(() => this.analysisController.analysisCost());
  hasFreeAnalysisAvailable = computed(() =>
    this.analysisController.hasFreeAnalysisAvailable()
  );

  // ✅ INTELLIGENCE STATE
  marketData = signal<MarketIntelligence | null>(null);
  competitorData = signal<CompetitorIntelligence | null>(null);
  isLoadingIntelligence = signal(false);
  intelligenceError = signal<string | null>(null);

  // ✅ ANALYSIS RESULTS
  applicationAnalysis = signal<ApplicationInsight[]>([]);
  investmentScore = signal<InvestmentScore | null>(null);

  // ✅ COMPUTED - Extract industry from multiple sources
  private industry = computed(() => {
    if (this.profileData?.businessInfo?.industry) {
      return this.profileData.businessInfo.industry;
    }
    if (this.profileData?.companyInfo?.industryType) {
      return this.profileData.companyInfo.industryType;
    }
    if (this.formData.industry) {
      return this.formData.industry;
    }
    if (this.currentOpportunity?.industry) {
      return this.currentOpportunity.industry;
    }
    if (this.applicationData?.industry) {
      return this.applicationData.industry;
    }
    return null;
  });

  // ✅ COMPUTED INSIGHTS (uses UI service)
  allInsights = computed(() => {
    const insights: IntelligenceInsight[] = [];
    const market = this.marketData();
    const competitor = this.competitorData();

    if (market?.timingInsights) {
      insights.push(
        ...market.timingInsights.slice(0, 2).map((insight) => ({
          type: 'market_timing' as const,
          urgency: this.uiService.assessTimingUrgency(insight),
          title: 'Market Timing Opportunity',
          description: insight,
          actionItem: 'Review timing strategy',
          confidence: market.confidence,
          source: 'Market Intelligence (Live Data)',
        }))
      );
    }

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

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  async ngOnInit() {
    console.log('🔍 [AI-ASSISTANT] Component initialized', {
      hasOrganization: !!this.organizationId,
      hasApplicationData: !!this.applicationData,
    });

    // Load wallet if org provided
    if (this.organizationId) {
      await this.creditGating.loadWallet(this.organizationId);
      await this.analysisController.checkFreeAnalysisAvailability(
        this.organizationId
      );
    }

    // Load market intelligence (always free, no auto-analysis)
    //  this.loadMarketIntelligence();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // ANALYSIS WORKFLOW - DELEGATED TO CONTROLLER
  // ============================================================================

  /**
   * Generate Analysis - Entry point
   * 1. Validates inputs
   * 2. Creates request via controller
   * 3. Shows credit modal if needed or executes immediately
   */
  async generateAnalysis(): Promise<void> {
    // ✅ Validate required data
    if (!this.applicationData || !this.currentOpportunity) {
      console.error(
        '❌ [AI-ASSISTANT] Missing applicationData or currentOpportunity'
      );
      this.analysisController.analysisError.set(
        'Missing application or opportunity data'
      );
      return;
    }

    if (!this.organizationId) {
      console.error('❌ [AI-ASSISTANT] Missing organizationId');
      this.analysisController.analysisError.set('Organization ID is missing');
      return;
    }

    console.log(
      '✅ [AI-ASSISTANT] Validation passed, proceeding with analysis'
    );

    const isFree = this.hasFreeAnalysisAvailable();

    try {
      // Let controller handle initialization
      await this.analysisController.initializeAnalysis(
        this.organizationId,
        this.applicationData,
        this.currentOpportunity,
        this.profileData,
        isFree,
        this.applicationData?.id,
        this.currentOpportunity?.id
      );
      // If paid, show modal; if free, execute immediately
      if (!isFree) {
        this.showCreditGatingModal.set(true);
        return;
      }

      await this.executeAnalysis();
    } catch (error) {
      console.error('❌ [AI-ASSISTANT] Error in generateAnalysis():', error);
      // Controller already set error message
    }
  }

  /**
   * Execute Analysis - runs the actual intelligence analysis
   * Controller handles all persistence and state management
   */
  private async executeAnalysis(): Promise<void> {
    console.log('🚀 [AI-ASSISTANT] executeAnalysis() started');

    const startTime = performance.now();
    const requestId = this.currentAnalysisRequestId();

    if (!requestId) {
      console.error('❌ [AI-ASSISTANT] No request ID available');
      this.analysisController.analysisError.set(
        'Analysis request not initialized'
      );
      return;
    }

    try {
      // Get analysis observable from controller
      const analysisObservable = this.analysisController.executeAnalysis(
        this.applicationData,
        this.currentOpportunity,
        this.profileData
      );

      // Subscribe and handle results
      analysisObservable.pipe(takeUntil(this.destroy$)).subscribe({
        next: async (analysis) => {
          const processingTime = Math.round(performance.now() - startTime);

          console.log('✅ [AI-ASSISTANT] Analysis results received', {
            processingTimeMs: processingTime,
            insightCount: analysis.insights?.length || 0,
            scoreOverall: analysis.investmentScore?.overall || 'N/A',
          });

          // Store in local signals for template
          this.applicationAnalysis.set(analysis.insights || []);
          this.investmentScore.set(analysis.investmentScore || null);

          try {
            // Let controller persist to database
            console.log('💾 [AI-ASSISTANT] Persisting results to database');
            await this.analysisController.persistAnalysisSuccess(
              analysis.insights,
              analysis.investmentScore,
              processingTime
            );

            console.log(
              '🎉 [AI-ASSISTANT] Analysis complete and data persisted!'
            );
          } catch (persistError) {
            console.error(
              '❌ [AI-ASSISTANT] Error persisting results:',
              persistError
            );
            // Controller already set error message

            // Try to mark as error
            await this.analysisController
              .persistAnalysisError(
                `Persistence failed: ${persistError}`,
                processingTime
              )
              .catch((markErr) =>
                console.error(
                  '⚠️ [AI-ASSISTANT] Failed to mark error state:',
                  markErr
                )
              );
          }
        },

        error: async (error) => {
          const processingTime = Math.round(performance.now() - startTime);

          console.error('❌ [AI-ASSISTANT] Analysis execution failed:', {
            error,
            message: error?.message,
            processingTimeMs: processingTime,
          });

          // Let controller persist error
          await this.analysisController
            .persistAnalysisError(
              error?.message || 'Analysis execution failed',
              processingTime
            )
            .catch((markErr) =>
              console.error(
                '⚠️ [AI-ASSISTANT] Failed to persist error:',
                markErr
              )
            );
        },
      });
    } catch (error) {
      console.error(
        '❌ [AI-ASSISTANT] Error setting up analysis execution:',
        error
      );
      this.analysisController.analysisError.set('Failed to execute analysis');
    }
  }

  // ============================================================================
  // CREDIT GATING HANDLERS
  // ============================================================================

  async onGatingConfirm(): Promise<void> {
    console.log('💳 [AI-ASSISTANT] User confirmed credit payment');

    if (!this.organizationId) {
      console.error('❌ [AI-ASSISTANT] Missing organizationId');
      return;
    }

    try {
      // Let controller handle credit deduction
      await this.analysisController.processCredits(this.organizationId);

      this.showCreditGatingModal.set(false);
      await this.executeAnalysis();
    } catch (error) {
      console.error('❌ [AI-ASSISTANT] Credit gating error:', error);
      // Controller already set error message
    }
  }

  onGatingCancel(): void {
    console.log('❌ [AI-ASSISTANT] User cancelled credit modal');

    // Let controller handle cancellation
    this.analysisController
      .cancelAnalysis()
      .then(() => {
        this.showCreditGatingModal.set(false);
        console.log('✅ [AI-ASSISTANT] Cancellation handled');
      })
      .catch((error) => {
        console.error('⚠️ [AI-ASSISTANT] Error handling cancellation:', error);
        this.showCreditGatingModal.set(false);
      });
  }

  // ============================================================================
  // MARKET INTELLIGENCE
  // ============================================================================

  private loadMarketIntelligence() {
    const industry = this.industry();

    if (!industry) {
      console.log('ℹ️ [AI-ASSISTANT] No industry data available yet');
      return;
    }

    console.log('🔍 [AI-ASSISTANT] Loading market intelligence for:', industry);

    this.isLoadingIntelligence.set(true);
    this.intelligenceError.set(null);

    this.marketIntelligence
      .getMarketIntelligence(industry, { maxAge: 24 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (intelligence) => {
          console.log('✅ [AI-ASSISTANT] Market intelligence loaded');
          this.marketData.set(intelligence);
          this.isLoadingIntelligence.set(false);
        },
        error: (error) => {
          console.error(
            '❌ [AI-ASSISTANT] Failed to load market intelligence:',
            error
          );
          this.intelligenceError.set(error.message);
          this.isLoadingIntelligence.set(false);
        },
      });
  }

  // ============================================================================
  // UI METHODS - DELEGATED TO UI SERVICE
  // ============================================================================

  // Score Styling
  getScoreColor(score: number): string {
    return this.uiService.getScoreColor(score);
  }

  getScoreBgColor(score: number): string {
    return this.uiService.getScoreBgColor(score);
  }

  // Recommendation Styling
  getRecommendationColor(recommendation: string): string {
    return this.uiService.getRecommendationColor(recommendation);
  }

  getRecommendationText(recommendation: string): string {
    return this.uiService.getRecommendationText(recommendation);
  }

  // Insight Styling
  getInsightCardClass(urgency: string): string {
    return this.uiService.getInsightCardClass(urgency);
  }

  getInsightIconBg(urgency: string): string {
    return this.uiService.getInsightIconBg(urgency);
  }

  getInsightIconColor(urgency: string): string {
    return this.uiService.getInsightIconColor(urgency);
  }

  getInsightTitleColor(urgency: string): string {
    return this.uiService.getInsightTitleColor(urgency);
  }

  getInsightTextColor(urgency: string): string {
    return this.uiService.getInsightTextColor(urgency);
  }

  getInsightActionColor(urgency: string): string {
    return this.uiService.getInsightActionColor(urgency);
  }

  getUrgencyDot(urgency: string): string {
    return this.uiService.getUrgencyDot(urgency);
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

  // Formatting
  formatAmount(amount: number): string {
    return this.uiService.formatAmount(amount);
  }

  // Market Data
  getEnhancedMarketInsight(): string {
    const market = this.marketData();
    if (!market) {
      return this.uiService.buildFallbackMarketInsight(
        Number(this.formData.offerAmount)
      );
    }
    if (market.trends?.length > 0) {
      return market.trends[0];
    }
    if (market.fundingTrends) {
      return this.uiService.buildMarketStats(
        market.fundingTrends.dealCount,
        market.fundingTrends.totalFunding,
        market.fundingTrends.valuationTrend
      );
    }
    return 'Market analysis in progress...';
  }

  hasMarketData(): boolean {
    return !!this.marketData()?.fundingTrends;
  }

  getMarketStats(): string {
    const market = this.marketData();
    if (!market?.fundingTrends) return '';
    return this.uiService.buildMarketStats(
      market.fundingTrends.dealCount,
      market.fundingTrends.totalFunding,
      market.fundingTrends.valuationTrend
    );
  }

  getIntelligentSuggestion(): string {
    return this.uiService.generateIntelligentSuggestion(
      this.investmentScore(),
      this.allInsights(),
      this.marketData()?.timingInsights
    );
  }

  // Event Handlers
  handleInsightAction(insight: IntelligenceInsight): void {
    console.log('📌 [AI-ASSISTANT] Insight action:', insight.title);
  }

  showAllInsights(): void {
    console.log(
      '📊 [AI-ASSISTANT] Showing all insights:',
      this.allInsights().length
    );
  }
}
