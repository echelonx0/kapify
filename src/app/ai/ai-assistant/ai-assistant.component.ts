// // src/app/ai/ai-assistant/ai-assistant.component.ts - REFACTORED
// import {
//   Component,
//   inject,
//   Input,
//   OnInit,
//   OnDestroy,
//   signal,
//   computed,
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   LucideAngularModule,
//   Sparkles,
//   Lightbulb,
//   TrendingUp,
//   Copy,
//   Calculator,
//   FileText,
//   HelpCircle,
//   AlertTriangle,
//   Target,
//   DollarSign,
//   Clock,
//   Zap,
//   CheckCircle,
//   XCircle,
//   AlertCircle as AlertCircleIcon,
//   Play,
// } from 'lucide-angular';

// import { Subject, takeUntil } from 'rxjs';
// import {
//   MarketIntelligenceService,
//   MarketIntelligence,
//   CompetitorIntelligence,
// } from '../services/market-intelligence.service';
// import {
//   ApplicationIntelligenceService,
//   ApplicationInsight,
//   InvestmentScore,
// } from '../services/application-intelligence.service';
// import { CreditGatingService } from 'src/app/credit-system/services/credit-gating.service';
// import { AiAnalysisRequestService } from '../services/ai_analysis_request.service';
// import { CreditGatingModalComponent } from 'src/app/credit-system/credit-gating-modal.component';

// interface FormData {
//   fundingType: string;
//   offerAmount: string;
//   industry?: string;
//   targetStage?: string;
//   [key: string]: any;
// }

// interface IntelligenceInsight {
//   type:
//     | 'market_timing'
//     | 'competitor_activity'
//     | 'risk_alert'
//     | 'opportunity'
//     | 'regulatory'
//     | 'funding_trend';
//   urgency: 'low' | 'medium' | 'high';
//   title: string;
//   description: string;
//   actionItem?: string;
//   source?: string;
//   confidence: number;
// }

// @Component({
//   selector: 'app-ai-assistant',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule, CreditGatingModalComponent],
//   templateUrl: 'ai-assistant.component.html',
// })
// export class AiAssistantComponent implements OnInit, OnDestroy {
//   // ✅ INPUTS
//   @Input() currentStep: string = 'basic';
//   @Input() formData: FormData = {} as FormData;
//   @Input() completionPercentage: number = 0;
//   @Input() currentOpportunity?: any;
//   @Input() applicationData?: any;
//   @Input() profileData?: any;
//   @Input() organizationId?: string;

//   private marketIntelligence = inject(MarketIntelligenceService);
//   private appIntelligence = inject(ApplicationIntelligenceService);
//   creditGating = inject(CreditGatingService);
//   private analysisRequestService = inject(AiAnalysisRequestService);
//   private destroy$ = new Subject<void>();

//   // Icons
//   SparklesIcon = Sparkles;
//   LightbulbIcon = Lightbulb;
//   TrendingUpIcon = TrendingUp;
//   CopyIcon = Copy;
//   CalculatorIcon = Calculator;
//   FileTextIcon = FileText;
//   HelpCircleIcon = HelpCircle;
//   AlertTriangleIcon = AlertTriangle;
//   TargetIcon = Target;
//   DollarSignIcon = DollarSign;
//   ClockIcon = Clock;
//   ZapIcon = Zap;
//   CheckCircleIcon = CheckCircle;
//   XCircleIcon = XCircle;
//   AlertCircleIcon = AlertCircleIcon;
//   PlayIcon = Play;

//   // ✅ ANALYSIS STATE -  EXPLICIT, NOT AUTO-RUN
//   isAnalysisAvailable = signal(false); // Has analysis been run?
//   isGeneratingAnalysis = signal(false); // Currently running analysis?
//   analysisError = signal<string | null>(null);

//   // ✅ CREDIT GATING STATE
//   showCreditGatingModal = signal(false);
//   creditGatingCost = signal(0);
//   isProcessingCredits = signal(false);
//   currentAnalysisRequestId = signal<string | null>(null);
//   hasFreeAnalysisAvailable = signal(true);

//   // Intelligence state
//   marketData = signal<MarketIntelligence | null>(null);
//   competitorData = signal<CompetitorIntelligence | null>(null);
//   isLoadingIntelligence = signal(false);
//   intelligenceError = signal<string | null>(null);

//   // Application Intelligence State
//   applicationAnalysis = signal<ApplicationInsight[]>([]);
//   investmentScore = signal<InvestmentScore | null>(null);

//   // ✅ COMPUTED - Extract industry from multiple sources
//   private industry = computed(() => {
//     if (this.profileData?.businessInfo?.industry) {
//       return this.profileData.businessInfo.industry;
//     }
//     if (this.profileData?.companyInfo?.industryType) {
//       return this.profileData.companyInfo.industryType;
//     }
//     if (this.formData.industry) {
//       return this.formData.industry;
//     }
//     if (this.currentOpportunity?.industry) {
//       return this.currentOpportunity.industry;
//     }
//     if (this.applicationData?.industry) {
//       return this.applicationData.industry;
//     }
//     return null;
//   });

//   // Computed Intelligence Insights
//   allInsights = computed(() => {
//     const insights: IntelligenceInsight[] = [];
//     const market = this.marketData();
//     const competitor = this.competitorData();

//     if (market?.timingInsights) {
//       insights.push(
//         ...market.timingInsights.slice(0, 2).map((insight) => ({
//           type: 'market_timing' as const,
//           urgency: this.assessTimingUrgency(insight),
//           title: 'Market Timing Opportunity',
//           description: insight,
//           actionItem: 'Review timing strategy',
//           confidence: market.confidence,
//           source: 'Market Intelligence (Live Data)',
//         }))
//       );
//     }

//     if (market?.riskFactors?.length) {
//       market.riskFactors.forEach((risk: any) => {
//         insights.push({
//           type: 'risk_alert',
//           urgency:
//             risk.severity === 'high'
//               ? 'high'
//               : risk.severity === 'medium'
//               ? 'medium'
//               : 'low',
//           title: risk.factor,
//           description: risk.impact,
//           actionItem: `Review ${risk.timeframe} risk mitigation`,
//           confidence: market.confidence,
//           source: 'Market Intelligence (Live Data)',
//         });
//       });
//     }

//     if (market?.opportunities?.length) {
//       market.opportunities.forEach((opp: any) => {
//         insights.push({
//           type: 'opportunity',
//           urgency: 'medium',
//           title: opp.opportunity,
//           description: `${opp.rationale}. Window: ${opp.timeframe}`,
//           actionItem: 'Assess opportunity fit',
//           confidence: market.confidence,
//           source: 'Market Intelligence (Live Data)',
//         });
//       });
//     }

//     if (market?.fundingTrends) {
//       const trend = market.fundingTrends;
//       if (trend.valuationTrend === 'down' && trend.dealCount > 10) {
//         insights.push({
//           type: 'opportunity',
//           urgency: 'high',
//           title: 'Valuation Correction Opportunity',
//           description: `Valuations trending down with ${trend.dealCount} deals last quarter. Better pricing available.`,
//           actionItem: 'Consider aggressive positioning',
//           confidence: market.confidence,
//           source: 'Funding Data',
//         });
//       }
//     }

//     if (market?.regulatoryChanges?.length) {
//       market.regulatoryChanges.forEach((change) => {
//         insights.push({
//           type: 'regulatory',
//           urgency: 'medium',
//           title: 'Regulatory Change Alert',
//           description: change,
//           actionItem: 'Review compliance impact',
//           confidence: market.confidence,
//           source: 'Regulatory Monitor',
//         });
//       });
//     }

//     if (competitor?.recentNews?.length) {
//       competitor.recentNews.slice(0, 1).forEach((news) => {
//         insights.push({
//           type: 'competitor_activity',
//           urgency: 'medium',
//           title: 'Competitive Intelligence',
//           description: news,
//           actionItem: 'Assess competitive impact',
//           confidence: competitor.confidence,
//           source: 'Competitor Research',
//         });
//       });
//     }

//     if (
//       market?.fundingTrends?.dealCount &&
//       market.fundingTrends.dealCount < 5
//     ) {
//       insights.push({
//         type: 'risk_alert',
//         urgency: 'high',
//         title: 'Low Deal Activity Warning',
//         description: `Only ${market.fundingTrends.dealCount} deals last quarter in this sector. Market may be cooling.`,
//         actionItem: 'Consider sector diversification',
//         confidence: market.confidence,
//         source: 'Deal Flow Analysis',
//       });
//     }

//     const appInsights = this.applicationAnalysis() || [];
//     appInsights.forEach((insight: ApplicationInsight) => {
//       insights.push({
//         type: insight.type === 'strength' ? 'opportunity' : 'risk_alert',
//         urgency: insight.severity,
//         title: insight.title,
//         description: insight.description,
//         actionItem: insight.recommendation,
//         confidence: this.investmentScore()?.confidence || 75,
//         source: 'Application Analysis',
//       });
//     });

//     return insights.sort((a, b) => {
//       const urgencyWeight = { high: 3, medium: 2, low: 1 };
//       return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
//     });
//   });

//   topInsight = computed(() => this.allInsights()[0] || null);

//   async ngOnInit() {
//     // Load wallet if org provided
//     if (this.organizationId) {
//      // console.log('Loading wallet for org:', this.organizationId);
//       await this.creditGating.loadWallet(this.organizationId);
//       this.checkFreeAnalysisAvailability();
//     }

//     // Load market intelligence (always free, no auto-analysis)
//     this.loadMarketIntelligence();
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   // ===============================
//   // FREE ANALYSIS CHECK
//   // ===============================

//   private async checkFreeAnalysisAvailability() {
//     if (!this.organizationId) return;

//     try {
//       const hasUsed = await this.analysisRequestService.hasUsedFreeAnalysis(
//         this.organizationId
//       );
//       this.hasFreeAnalysisAvailable.set(!hasUsed);
//     //  console.log(`✅ [AI-ASSISTANT] Free analysis available: ${!hasUsed}`);
//     } catch (error) {
//       console.error('❌ [AI-ASSISTANT] Error checking free analysis:', error);
//       this.hasFreeAnalysisAvailable.set(false);
//     }
//   }

//   // ===============================
//   // GENERATE ANALYSIS - EXPLICIT FLOW
//   // ===============================

//   async generateAnalysis(): Promise<void> {
//     if (
//       !this.applicationData ||
//       !this.currentOpportunity ||
//       !this.organizationId
//     ) {
//       console.error('❌ [AI-ASSISTANT] Missing required data for analysis');
//       this.analysisError.set('Missing application or opportunity data');
//       return;
//     }

//     console.log('🔄 [AI-ASSISTANT] Initiating analysis request...');

//     const isFree = this.hasFreeAnalysisAvailable();
//     const cost = isFree ? 0 : 50; // 50 credits for paid

//     try {
//       // Step 1: Create request record in DB
//       const requestId = await this.analysisRequestService.createAnalysisRequest(
//         this.organizationId,
//         isFree,
//         cost,
//         this.applicationData,
//         this.currentOpportunity,
//         this.profileData
//       );

//       this.currentAnalysisRequestId.set(requestId);

//       // Step 2: If paid, show gating modal; if free, run immediately
//       if (!isFree) {
//         this.creditGatingCost.set(cost);
//         this.showCreditGatingModal.set(true);
//      //   console.log(`💳 [AI-ASSISTANT] Showing credit modal (${cost} credits)`);
//         return;
//       }

//    //   console.log('🎁 [AI-ASSISTANT] Running FREE analysis');
//       await this.executeAnalysis();
//     } catch (error) {
//       console.error('❌ [AI-ASSISTANT] Failed to create request:', error);
//       this.analysisError.set('Failed to initialize analysis');
//     }
//   }

//   // ===============================
//   // CREDIT GATING HANDLERS
//   // ===============================

//   async onGatingConfirm(): Promise<void> {
//     if (!this.organizationId || !this.currentAnalysisRequestId()) {
//       console.error('❌ [AI-ASSISTANT] Missing org or request ID');
//       return;
//     }

//     this.isProcessingCredits.set(true);
//     this.analysisError.set(null);

//     try {
//     //  console.log('💳 [AI-ASSISTANT] Deducting credits...');
//       await this.creditGating.deductCreditsForAction(
//         this.organizationId,
//         'generate'
//       );

//       this.showCreditGatingModal.set(false);
//       await this.executeAnalysis();
//     } catch (error) {
//       console.error('❌ [AI-ASSISTANT] Credit deduction failed:', error);
//       this.analysisError.set('Failed to process credits. Try again.');
//     } finally {
//       this.isProcessingCredits.set(false);
//     }
//   }

//   onGatingCancel(): void {
//   //  console.log('❌ [AI-ASSISTANT] User cancelled');
//     this.showCreditGatingModal.set(false);

//     if (this.currentAnalysisRequestId()) {
//       this.analysisRequestService
//         .markAnalysisExecuted(
//           this.currentAnalysisRequestId()!,
//           undefined,
//           undefined,
//           'User cancelled'
//         )
//         .catch((err) => console.error('Failed to mark cancelled:', err));
//     }

//     this.currentAnalysisRequestId.set(null);
//   }

//   // ===============================
//   // EXECUTE ANALYSIS
//   // ===============================

//   private async executeAnalysis(): Promise<void> {
//     this.isGeneratingAnalysis.set(true);
//     this.analysisError.set(null);

//     try {
//       const requestId = this.currentAnalysisRequestId();
//       if (!requestId) {
//         throw new Error('No request ID available');
//       }

//       console.log('🔄 [AI-ASSISTANT] Running analysis...');

//       // Run the actual analysis
//       this.appIntelligence
//         .getComprehensiveAnalysis(
//           this.applicationData,
//           this.currentOpportunity,
//           this.profileData
//         )
//         .pipe(takeUntil(this.destroy$))
//         .subscribe({
//           next: async (analysis) => {
//             try {
//               this.applicationAnalysis.set(analysis.insights);
//               this.investmentScore.set(analysis.investmentScore);

//               // Mark as executed in DB
//               await this.analysisRequestService.markAnalysisExecuted(
//                 requestId,
//                 analysis.insights,
//                 analysis.investmentScore
//               );

//               this.isAnalysisAvailable.set(true);
//               this.isGeneratingAnalysis.set(false);
//               this.hasFreeAnalysisAvailable.set(false); // Used free analysis

//               console.log('✅ [AI-ASSISTANT] Analysis complete');
//             } catch (err) {
//               console.error('❌ [AI-ASSISTANT] Failed to save results:', err);
//               this.analysisError.set(
//                 'Analysis complete but failed to save results'
//               );
//             }
//           },
//           error: async (error) => {
//             console.error('❌ [AI-ASSISTANT] Analysis failed:', error);

//             try {
//               await this.analysisRequestService.markAnalysisExecuted(
//                 requestId,
//                 undefined,
//                 undefined,
//                 error.message
//               );
//             } catch (markErr) {
//               console.error('Failed to mark error:', markErr);
//             }

//             this.isGeneratingAnalysis.set(false);
//             this.analysisError.set('Analysis failed. Please try again.');
//           },
//         });
//     } catch (error) {
//       console.error('❌ [AI-ASSISTANT] Execution error:', error);
//       this.isGeneratingAnalysis.set(false);
//       this.analysisError.set('Failed to execute analysis');
//     }
//   }

//   // ===============================
//   // MARKET INTELLIGENCE
//   // ===============================

//   private loadMarketIntelligence() {
//     const industry = this.industry();

//     if (!industry) {
//       console.log('❌ [AI-ASSISTANT] No industry data available');
//       return;
//     }

//     this.isLoadingIntelligence.set(true);
//     this.intelligenceError.set(null);

//     this.marketIntelligence
//       .getMarketIntelligence(industry, { maxAge: 24 })
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (intelligence) => {
//           this.marketData.set(intelligence);
//           this.isLoadingIntelligence.set(false);
//         },
//         error: (error) => {
//           this.intelligenceError.set(error.message);
//           this.isLoadingIntelligence.set(false);
//         },
//       });
//   }

//   // ===============================
//   // UI HELPERS
//   // ===============================

//   getScoreColor(score: number): string {
//     if (score >= 75) return 'text-green-600';
//     if (score >= 60) return 'text-amber-600';
//     if (score >= 40) return 'text-blue-600';
//     return 'text-red-600';
//   }

//   getScoreBgColor(score: number): string {
//     if (score >= 75) return 'bg-green-50 border-green-200/50';
//     if (score >= 60) return 'bg-amber-50 border-amber-200/50';
//     if (score >= 40) return 'bg-blue-50 border-blue-200/50';
//     return 'bg-red-50 border-red-200/50';
//   }

//   getRecommendationColor(recommendation: string): string {
//     if (recommendation === 'strong_buy') return 'text-green-700';
//     if (recommendation === 'consider') return 'text-amber-700';
//     if (recommendation === 'need_more_info') return 'text-blue-700';
//     return 'text-red-700';
//   }

//   getRecommendationText(recommendation: string): string {
//     return recommendation.replace(/_/g, ' ').toUpperCase();
//   }

//   private assessTimingUrgency(insight: string): 'low' | 'medium' | 'high' {
//     const urgentKeywords = ['urgent', 'immediate', 'crisis'];
//     const mediumKeywords = ['trend', 'shift', 'change'];
//     const lower = insight.toLowerCase();
//     if (urgentKeywords.some((k) => lower.includes(k))) return 'high';
//     if (mediumKeywords.some((k) => lower.includes(k))) return 'medium';
//     return 'low';
//   }

//   getInsightIcon(type: string): any {
//     const icons: Record<string, any> = {
//       market_timing: this.ClockIcon,
//       competitor_activity: this.TargetIcon,
//       risk_alert: this.AlertTriangleIcon,
//       opportunity: this.ZapIcon,
//       regulatory: this.FileTextIcon,
//       funding_trend: this.DollarSignIcon,
//     };
//     return icons[type] || this.LightbulbIcon;
//   }

//   getInsightCardClass(urgency: string): string {
//     const classes = {
//       high: 'bg-red-50 border-red-200/50',
//       medium: 'bg-amber-50 border-amber-200/50',
//       low: 'bg-blue-50 border-blue-200/50',
//     };
//     return `border ${classes[urgency as keyof typeof classes]}`;
//   }

//   getInsightIconBg(urgency: string): string {
//     const classes = {
//       high: 'bg-red-100',
//       medium: 'bg-amber-100',
//       low: 'bg-blue-100',
//     };
//     return classes[urgency as keyof typeof classes];
//   }

//   getInsightIconColor(urgency: string): string {
//     const classes = {
//       high: 'text-red-600',
//       medium: 'text-amber-600',
//       low: 'text-blue-600',
//     };
//     return classes[urgency as keyof typeof classes];
//   }

//   getInsightTitleColor(urgency: string): string {
//     const classes = {
//       high: 'text-red-900',
//       medium: 'text-amber-900',
//       low: 'text-blue-900',
//     };
//     return classes[urgency as keyof typeof classes];
//   }

//   getInsightTextColor(urgency: string): string {
//     const classes = {
//       high: 'text-red-700',
//       medium: 'text-amber-700',
//       low: 'text-blue-700',
//     };
//     return classes[urgency as keyof typeof classes];
//   }

//   getInsightActionColor(urgency: string): string {
//     const classes = {
//       high: 'text-red-600 hover:text-red-800',
//       medium: 'text-amber-600 hover:text-amber-800',
//       low: 'text-blue-600 hover:text-blue-800',
//     };
//     return classes[urgency as keyof typeof classes];
//   }

//   getUrgencyDot(urgency: string): string {
//     const classes = {
//       high: 'bg-red-500',
//       medium: 'bg-amber-500',
//       low: 'bg-blue-500',
//     };
//     return classes[urgency as keyof typeof classes];
//   }

//   private formatAmount(amount: number): string {
//     if (amount >= 1000000) {
//       return `${(amount / 1000000).toFixed(1)}M`;
//     } else if (amount >= 1000) {
//       return `${(amount / 1000).toFixed(0)}K`;
//     }
//     return `${amount.toLocaleString()}`;
//   }

//   getEnhancedMarketInsight(): string {
//     const market = this.marketData();
//     if (!market) {
//       return this.getFallbackMarketInsight();
//     }
//     if (market.trends?.length > 0) {
//       return market.trends[0];
//     }
//     if (market.fundingTrends) {
//       const trend = market.fundingTrends;
//       return `${trend.dealCount} deals, avg ${this.formatAmount(
//         trend.averageRoundSize
//       )}, sentiment: ${trend.valuationTrend}`;
//     }
//     return 'Market analysis in progress...';
//   }

//   private getFallbackMarketInsight(): string {
//     if (this.formData.offerAmount) {
//       const amount = Number(this.formData.offerAmount);
//       const lower = Math.round((amount * 0.5) / 1000);
//       const upper = Math.round((amount * 1.5) / 1000);
//       return `SMEs typically seek R${lower}K-R${upper}K. Your structure aligns well.`;
//     }
//     return 'Market insights will appear based on real-time analysis.';
//   }

//   hasMarketData(): boolean {
//     return !!this.marketData()?.fundingTrends;
//   }

//   getMarketStats(): string {
//     const market = this.marketData();
//     if (!market?.fundingTrends) return '';
//     const trend = market.fundingTrends;
//     return `${trend.dealCount} deals • ${this.formatAmount(
//       trend.totalFunding
//     )} total • ${trend.valuationTrend} trend`;
//   }

//   getIntelligentSuggestion(): string {
//     const market = this.marketData();
//     const insights = this.allInsights();
//     const score = this.investmentScore();

//     if (score) {
//       if (score.recommendation === 'strong_buy') {
//         return `Strong opportunity (${score.overall}/100). Key strengths align well.`;
//       }
//       if (score.recommendation === 'pass') {
//         return `Significant concerns (${score.overall}/100). Review risks first.`;
//       }
//     }

//     const urgent = insights.find((i) => i.urgency === 'high');
//     if (urgent) {
//       return `URGENT: ${urgent.description}`;
//     }

//     if (market?.timingInsights?.length) {
//       return market.timingInsights[0];
//     }

//     return 'Run analysis to see personalized insights...';
//   }

//   handleInsightAction(insight: IntelligenceInsight): void {
//     console.log('Handling insight:', insight.title);
//   }

//   showAllInsights(): void {
//     console.log('View all insights:', this.allInsights().length);
//   }
// }

// src/app/ai/ai-assistant/ai-assistant.component.ts - REFACTORED WITH CONTROLLER
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
  ApplicationIntelligenceService,
  ApplicationInsight,
  InvestmentScore,
} from '../services/application-intelligence.service';
import { CreditGatingService } from 'src/app/credit-system/services/credit-gating.service';
import {
  AiAssistantUiService,
  IntelligenceInsight,
} from '../services/ai-assistant-ui.service';
import { CreditGatingModalComponent } from 'src/app/credit-system/credit-gating-modal.component';
import { AiAnalysisController } from '../controllers/analysis.controller';

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
  private appIntelligence = inject(ApplicationIntelligenceService);

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
    this.loadMarketIntelligence();
  }

  ngOnDestroy() {
    console.log('🔄 [AI-ASSISTANT] Component destroyed');
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
    console.log('🎯 [AI-ASSISTANT] generateAnalysis() called');

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
        isFree
      );

      // If paid, show modal; if free, execute immediately
      if (!isFree) {
        console.log('💳 [AI-ASSISTANT] Showing credit gating modal');
        this.showCreditGatingModal.set(true);
        return;
      }

      console.log('🎁 [AI-ASSISTANT] Running FREE analysis');
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
