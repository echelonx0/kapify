// // src/app/ai/ai-assistant/ai-assistant.component.ts - FIXED VERSION
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
//   imports: [CommonModule, LucideAngularModule],
//   templateUrl: 'ai-assistant.component.html',
// })
// export class AiAssistantComponent implements OnInit, OnDestroy {
//   // ✅ INPUTS - Now includes profileData
//   @Input() currentStep: string = 'basic';
//   @Input() formData: FormData = {} as FormData;
//   @Input() completionPercentage: number = 0;
//   @Input() currentOpportunity?: any;
//   @Input() applicationData?: any;
//   @Input() profileData?: any; // ✅ NEW - Full profile data including financialAnalysis
//   @Input() organizationId?: string; // ✅ NEW - For credit gating

//   private lastAnalysisHash = signal<string | null>(null);
//   private hasRunFreeAnalysis = signal(false); // ✅ Track if free analysis was used

//   private marketIntelligence = inject(MarketIntelligenceService);
//   private appIntelligence = inject(ApplicationIntelligenceService);
//   private creditGating = inject(CreditGatingService);
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

//   // Intelligence State
//   marketData = signal<MarketIntelligence | null>(null);
//   competitorData = signal<CompetitorIntelligence | null>(null);
//   isLoadingIntelligence = signal(false);
//   intelligenceError = signal<string | null>(null);

//   // Application Intelligence State
//   applicationAnalysis = signal<ApplicationInsight[]>([]);
//   investmentScore = signal<InvestmentScore | null>(null);
//   isAnalyzingApplication = signal(false);

//   // ✅ CREDIT GATING STATE
//   showCreditPrompt = signal(false);
//   creditsRequired = signal(0);

//   // Market research state
//   isGeneratingResearch = signal(false);
//   marketResearchGenerated = signal(false);
//   researchError = signal<string | null>(null);

//   // ✅ COMPUTED - Extract industry from multiple sources
//   private industry = computed(() => {
//     // Priority 1: ProfileData company info
//     if (this.profileData?.businessInfo?.industry) {
//       return this.profileData.businessInfo.industry;
//     }

//     // Priority 2: ProfileData companyInfo (from backend)
//     if (this.profileData?.companyInfo?.industryType) {
//       return this.profileData.companyInfo.industryType;
//     }

//     // Priority 3: FormData
//     if (this.formData.industry) {
//       return this.formData.industry;
//     }

//     // Priority 4: Opportunity
//     if (this.currentOpportunity?.industry) {
//       return this.currentOpportunity.industry;
//     }

//     // Priority 5: Application data
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

//     // Market timing insights
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

//     // Risk Factors from Market Intelligence
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

//     // Opportunities from Market Intelligence
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

//     // Funding trend insights
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

//     // Regulatory insights
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

//     // Competitor activity insights
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

//     // Risk alerts from market data
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

//     // Application-specific insights
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

//   contextualHelp = computed(() => {
//     if (this.currentStep === 'terms' && this.formData.fundingType === 'debt') {
//       return {
//         title: 'Current Market Rates',
//         message: this.getContextualRateAdvice(),
//       };
//     }
//     if (this.currentStep === 'basic' && this.marketData()?.trends.length) {
//       return {
//         title: 'Market Trend Alert',
//         message: `${
//           this.marketData()!.trends[0]
//         }. Consider how this affects your positioning.`,
//       };
//     }
//     return null;
//   });

//   async ngOnInit() {
//     // ✅ Load wallet if organizationId provided
//     if (this.organizationId) {
//       await this.creditGating.loadWallet(this.organizationId);
//     }

//     // Load free market intelligence (always free)
//     this.loadMarketIntelligence();

//     // ✅ Run ONE free analysis automatically
//     this.analyzeApplication();

//     this.setupIntelligenceRefresh();
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   // ===============================
//   // INTELLIGENCE LOADING
//   // ===============================

//   private loadMarketIntelligence() {
//     const industry = this.industry();

//     if (!industry) {
//       // console.log('❌ [AI-ASSISTANT] No industry data available');
//       // console.log('📊 [AI-ASSISTANT] profileData:', this.profileData);
//       // console.log('📊 [AI-ASSISTANT] formData:', this.formData);
//       // console.log('📊 [AI-ASSISTANT] opportunity:', this.currentOpportunity);
//       return;
//     }

//     console.log('✅ [AI-ASSISTANT] Loading market intelligence for:', industry);

//     this.isLoadingIntelligence.set(true);
//     this.intelligenceError.set(null);

//     // Load market intelligence (FREE - no credit deduction)
//     this.marketIntelligence
//       .getMarketIntelligence(industry, { maxAge: 24 })
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (intelligence) => {
//           this.marketData.set(intelligence);
//           this.isLoadingIntelligence.set(false);
//           console.log('✅ Market intelligence loaded:', intelligence);
//         },
//         error: (error) => {
//           this.intelligenceError.set(error.message);
//           this.isLoadingIntelligence.set(false);
//           console.error('Failed to load market intelligence:', error);
//         },
//       });

//     // Load competitor intelligence if we have a company name (FREE)
//     const companyName =
//       this.profileData?.businessInfo?.companyName ||
//       this.profileData?.companyInfo?.companyName ||
//       this.applicationData?.companyName ||
//       this.currentOpportunity?.title;

//     if (companyName && companyName !== 'Unknown') {
//       this.marketIntelligence
//         .getCompetitorIntelligence(companyName, industry)
//         .pipe(takeUntil(this.destroy$))
//         .subscribe({
//           next: (competitor) => {
//             this.competitorData.set(competitor);
//             console.log('✅ Competitor intelligence loaded:', competitor);
//           },
//           error: (error) => {
//             console.warn('⚠️ Competitor intelligence failed:', error);
//           },
//         });
//     }
//   }

//   // ✅ CREDIT-GATED APPLICATION ANALYSIS
//   private async analyzeApplication() {
//     if (!this.applicationData || !this.currentOpportunity) {
//       console.log('❌ [AI-ASSISTANT] Missing application or opportunity data');
//       return;
//     }

//     // Check if data changed
//     const hash = btoa(
//       JSON.stringify({
//         application: this.applicationData,
//         opportunity: this.currentOpportunity,
//         profile: this.profileData,
//       })
//     );

//     if (this.lastAnalysisHash() === hash) {
//       console.log('ℹ️ [AI-ASSISTANT] Analysis already run for this data');
//       return;
//     }

//     // ✅ FIRST ANALYSIS IS FREE
//     if (!this.hasRunFreeAnalysis()) {
//       console.log('🎁 [AI-ASSISTANT] Running FREE initial analysis');
//       this.lastAnalysisHash.set(hash);
//       this.hasRunFreeAnalysis.set(true);
//       await this.performAnalysis();
//       return;
//     }

//     // ✅ SUBSEQUENT ANALYSES REQUIRE CREDITS
//     console.log('💰 [AI-ASSISTANT] Analysis requires credits');

//     if (!this.organizationId) {
//       console.error('❌ [AI-ASSISTANT] No organization ID for credit check');
//       return;
//     }

//     // Check if user can afford analysis
//     const canAfford = this.creditGating.canAfford('generate'); // 'generate' action = AI analysis

//     if (!canAfford) {
//       const cost = this.creditGating.getActionCost('generate');
//       this.creditsRequired.set(cost);
//       this.showCreditPrompt.set(true);
//       console.log(`⚠️ [AI-ASSISTANT] Need ${cost} credits for analysis`);
//       return;
//     }

//     // Request credit confirmation
//     const confirmed = this.creditGating.requestAction(
//       'generate',
//       'ai-analysis'
//     );

//     if (confirmed) {
//       // User confirmed, deduct credits and run analysis
//       await this.deductCreditsAndAnalyze(hash);
//     }
//   }

//   // ✅ Deduct credits and perform analysis
//   private async deductCreditsAndAnalyze(hash: string) {
//     if (!this.organizationId) return;

//     try {
//       // Deduct credits
//       await this.creditGating.deductCreditsForAction(
//         this.organizationId,
//         'generate'
//       );

//       console.log('✅ [AI-ASSISTANT] Credits deducted, running analysis');

//       // Update hash and run analysis
//       this.lastAnalysisHash.set(hash);
//       await this.performAnalysis();
//     } catch (error) {
//       console.error('❌ [AI-ASSISTANT] Failed to deduct credits:', error);
//       this.intelligenceError.set('Failed to process credit payment');
//     }
//   }

//   // ✅ Actual analysis execution (separated from credit logic)
//   private async performAnalysis() {
//     this.isAnalyzingApplication.set(true);

//     this.appIntelligence
//       .getComprehensiveAnalysis(
//         this.applicationData,
//         this.currentOpportunity,
//         this.profileData // ✅ Now has full profile including financialAnalysis
//       )
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (analysis) => {
//           this.applicationAnalysis.set(analysis.insights);
//           this.investmentScore.set(analysis.investmentScore);
//           this.isAnalyzingApplication.set(false);

//           console.log(
//             '✅ [AI-ASSISTANT] Comprehensive analysis complete:',
//             analysis
//           );
//         },
//         error: (error) => {
//           console.error('❌ [AI-ASSISTANT] Analysis failed:', error);
//           this.isAnalyzingApplication.set(false);
//           this.intelligenceError.set('Analysis failed. Please try again.');
//         },
//       });
//   }

//   // ✅ Manual refresh - requires credits
//   async refreshAnalysis(): Promise<void> {
//     if (!this.hasRunFreeAnalysis()) {
//       // First time - free
//       await this.analyzeApplication();
//       return;
//     }

//     // Subsequent - requires credits
//     if (!this.organizationId) {
//       console.error('❌ [AI-ASSISTANT] No organization ID for refresh');
//       return;
//     }

//     const canAfford = this.creditGating.canAfford('generate');

//     if (!canAfford) {
//       const cost = this.creditGating.getActionCost('generate');
//       this.creditsRequired.set(cost);
//       this.showCreditPrompt.set(true);
//       return;
//     }

//     // Reset hash to force re-analysis
//     this.lastAnalysisHash.set(null);
//     await this.analyzeApplication();
//   }

//   // ✅ Close credit prompt
//   closeCreditPrompt() {
//     this.showCreditPrompt.set(false);
//   }

//   private setupIntelligenceRefresh() {
//     // Refresh intelligence every 30 minutes (FREE - no credits)
//     const refreshInterval = setInterval(() => {
//       if (!this.isLoadingIntelligence()) {
//         this.loadMarketIntelligence();
//       }
//     }, 30 * 60 * 1000);

//     // Cleanup on destroy
//     this.destroy$.subscribe(() => {
//       clearInterval(refreshInterval);
//     });
//   }

//   // ===============================
//   // MARKET RESEARCH FUNCTIONALITY
//   // ===============================

//   async generateMarketResearch() {
//     const application = this.applicationData;
//     const opportunity = this.currentOpportunity;

//     if (!application || !opportunity) {
//       console.error(
//         'Missing application or opportunity data for market research'
//       );
//       return;
//     }

//     this.isGeneratingResearch.set(true);
//     this.researchError.set(null);

//     try {
//       console.log('Generating market research...');

//       // Simulate API call
//       await new Promise((resolve, reject) => {
//         setTimeout(() => {
//           if (Math.random() > 0.7) {
//             reject(new Error('Market research generation failed'));
//           } else {
//             resolve(true);
//           }
//         }, 2000);
//       });

//       this.marketResearchGenerated.set(true);
//       console.log('Market research generated successfully');
//     } catch (error) {
//       console.error('Error generating market research:', error);
//       this.researchError.set(
//         'Failed to generate market research. Please try again.'
//       );
//     } finally {
//       this.isGeneratingResearch.set(false);
//     }
//   }

//   retryMarketResearch() {
//     this.researchError.set(null);
//     this.generateMarketResearch();
//   }

//   getIntelligentSuggestion(): string {
//     const market = this.marketData();
//     const insights = this.allInsights();
//     const score = this.investmentScore();

//     // Priority: Investment score recommendation
//     if (score) {
//       if (score.recommendation === 'strong_buy') {
//         return `Strong investment opportunity (${score.overall}/100). Key strengths align with market opportunity.`;
//       }
//       if (score.recommendation === 'pass') {
//         return `Significant concerns identified (${score.overall}/100). Review risk factors before proceeding.`;
//       }
//     }

//     // High urgency insights
//     const highUrgencyInsight = insights.find((i) => i.urgency === 'high');
//     if (highUrgencyInsight) {
//       return `URGENT: ${highUrgencyInsight.description}`;
//     }

//     // Market timing insights
//     if (market?.timingInsights?.length) {
//       return market.timingInsights[0];
//     }

//     // Funding trends insight
//     if (market?.fundingTrends) {
//       const trend = market.fundingTrends;
//       return `Market shows ${
//         trend.dealCount
//       } deals averaging ${this.formatAmount(
//         trend.averageRoundSize
//       )}. Valuations are ${trend.valuationTrend}.`;
//     }

//     return 'Analyzing application and market data...';
//   }

//   getEnhancedMarketInsight(): string {
//     const market = this.marketData();

//     if (!market) {
//       return this.getFallbackMarketInsight();
//     }

//     // Prioritize most impactful trends
//     if (market.trends?.length > 0) {
//       return `${market.trends[0]}. ${
//         market.competitorActivity?.[0] ||
//         'Monitor competitive landscape closely.'
//       }`;
//     }

//     if (market.fundingTrends) {
//       const trend = market.fundingTrends;
//       return `${
//         trend.dealCount
//       } deals completed last quarter with average size ${this.formatAmount(
//         trend.averageRoundSize
//       )}. Market sentiment: ${trend.valuationTrend}.`;
//     }

//     return 'Real-time market analysis in progress...';
//   }

//   private getFallbackMarketInsight(): string {
//     if (this.formData.offerAmount) {
//       const amount = Number(this.formData.offerAmount);
//       const lowerRange = Math.round((amount * 0.5) / 1000);
//       const upperRange = Math.round((amount * 1.5) / 1000);
//       return `SMEs typically seek R${lowerRange}K-R${upperRange}K investments. Your structure aligns well with market norms.`;
//     }
//     return 'Market insights will appear here based on real-time analysis.';
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

//   // ===============================
//   // ACTION HANDLERS
//   // ===============================

//   handleInsightAction(insight: IntelligenceInsight) {
//     console.log('Handling insight action:', insight);

//     switch (insight.type) {
//       case 'market_timing':
//         this.analyzeMarketTiming();
//         break;
//       case 'competitor_activity':
//         this.researchCompetitors();
//         break;
//       case 'opportunity':
//         this.exploreOpportunity(insight);
//         break;
//       case 'risk_alert':
//         this.addressRisk(insight);
//         break;
//       default:
//         console.log('No specific action for insight type:', insight.type);
//     }
//   }

//   analyzeMarketTiming() {
//     const industry = this.industry();
//     if (industry) {
//       console.log('Refreshing market timing analysis for:', industry);
//       this.marketIntelligence
//         .getMarketIntelligence(industry, { forceRefresh: true })
//         .pipe(takeUntil(this.destroy$))
//         .subscribe((intelligence) => {
//           this.marketData.set(intelligence);
//         });
//     }
//   }

//   researchCompetitors() {
//     const companyName =
//       this.profileData?.businessInfo?.companyName ||
//       this.applicationData?.companyName ||
//       this.formData['companyName'];
//     const industry = this.industry();

//     if (companyName && industry) {
//       console.log('Refreshing competitor research for:', companyName);
//       this.marketIntelligence
//         .getCompetitorIntelligence(companyName, industry, {
//           forceRefresh: true,
//         })
//         .pipe(takeUntil(this.destroy$))
//         .subscribe((competitor) => {
//           this.competitorData.set(competitor);
//         });
//     }
//   }

//   private exploreOpportunity(insight: IntelligenceInsight) {
//     console.log('Exploring opportunity:', insight.title);
//   }

//   private addressRisk(insight: IntelligenceInsight) {
//     console.log('Addressing risk:', insight.title);
//   }

//   applySuggestion(): void {
//     console.log('Applying AI suggestion...');
//   }

//   calculateReturns(): void {
//     console.log('Calculating returns...');
//   }

//   generateDescription(): void {
//     console.log('Generating description...');
//   }

//   showAllInsights(): void {
//     console.log('Showing all insights:', this.allInsights());
//   }

//   // ===============================
//   // UI HELPER METHODS
//   // ===============================

//   getScoreColor(score: number): string {
//     if (score >= 75) return 'text-green-600';
//     if (score >= 60) return 'text-amber-600';
//     if (score >= 40) return 'text-blue-600';
//     return 'text-red-600';
//   }

//   getScoreBgColor(score: number): string {
//     if (score >= 75) return 'bg-green-50 border-green-200';
//     if (score >= 60) return 'bg-amber-50 border-amber-200';
//     if (score >= 40) return 'bg-blue-50 border-blue-200';
//     return 'bg-red-50 border-red-200';
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
//     const urgentKeywords = ['urgent', 'immediate', 'crisis', 'crash', 'boom'];
//     const mediumKeywords = ['trend', 'shift', 'change', 'opportunity'];

//     const lowerInsight = insight.toLowerCase();

//     if (urgentKeywords.some((keyword) => lowerInsight.includes(keyword))) {
//       return 'high';
//     }
//     if (mediumKeywords.some((keyword) => lowerInsight.includes(keyword))) {
//       return 'medium';
//     }
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
//       high: 'bg-red-50 border-red-200',
//       medium: 'bg-amber-50 border-amber-200',
//       low: 'bg-blue-50 border-blue-200',
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

//   private getContextualRateAdvice(): string {
//     const market = this.marketData();
//     if (market?.fundingTrends?.averageRoundSize) {
//       const avgRate = this.estimateMarketRate(market.fundingTrends);
//       return `Current market rates averaging ${avgRate}% based on recent deal activity. Consider positioning within this range.`;
//     }
//     return 'Debt financing typically ranges 10-18% interest rates in SA. Equity investments expect 20-35% IRR.';
//   }

//   private estimateMarketRate(fundingTrends: any): string {
//     if (fundingTrends.valuationTrend === 'down') return '12-15';
//     if (fundingTrends.valuationTrend === 'up') return '15-18';
//     return '13-16';
//   }

//   private formatAmount(amount: number): string {
//     if (amount >= 1000000) {
//       return `${(amount / 1000000).toFixed(1)}M`;
//     } else if (amount >= 1000) {
//       return `${(amount / 1000).toFixed(0)}K`;
//     }
//     return `${amount.toLocaleString()}`;
//   }
// }

// src/app/ai/ai-assistant/ai-assistant.component.ts - REFACTORED
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
import { AiAnalysisRequestService } from '../services/ai_analysis_request.service';
import { CreditGatingModalComponent } from 'src/app/credit-system/credit-gating-modal.component';

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

  private marketIntelligence = inject(MarketIntelligenceService);
  private appIntelligence = inject(ApplicationIntelligenceService);
  creditGating = inject(CreditGatingService);
  private analysisRequestService = inject(AiAnalysisRequestService);
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
  PlayIcon = Play;

  // ✅ ANALYSIS STATE - NOW EXPLICIT, NOT AUTO-RUN
  isAnalysisAvailable = signal(false); // Has analysis been run?
  isGeneratingAnalysis = signal(false); // Currently running analysis?
  analysisError = signal<string | null>(null);

  // ✅ CREDIT GATING STATE
  showCreditGatingModal = signal(false);
  creditGatingCost = signal(0);
  isProcessingCredits = signal(false);
  currentAnalysisRequestId = signal<string | null>(null);
  hasFreeAnalysisAvailable = signal(true);

  // Intelligence state
  marketData = signal<MarketIntelligence | null>(null);
  competitorData = signal<CompetitorIntelligence | null>(null);
  isLoadingIntelligence = signal(false);
  intelligenceError = signal<string | null>(null);

  // Application Intelligence State
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

  // Computed Intelligence Insights
  allInsights = computed(() => {
    const insights: IntelligenceInsight[] = [];
    const market = this.marketData();
    const competitor = this.competitorData();

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

  async ngOnInit() {
    // Load wallet if org provided
    if (this.organizationId) {
      await this.creditGating.loadWallet(this.organizationId);
      this.checkFreeAnalysisAvailability();
    }

    // Load market intelligence (always free, no auto-analysis)
    this.loadMarketIntelligence();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // FREE ANALYSIS CHECK
  // ===============================

  private async checkFreeAnalysisAvailability() {
    if (!this.organizationId) return;

    try {
      const hasUsed = await this.analysisRequestService.hasUsedFreeAnalysis(
        this.organizationId
      );
      this.hasFreeAnalysisAvailable.set(!hasUsed);
      console.log(`✅ [AI-ASSISTANT] Free analysis available: ${!hasUsed}`);
    } catch (error) {
      console.error('❌ [AI-ASSISTANT] Error checking free analysis:', error);
      this.hasFreeAnalysisAvailable.set(false);
    }
  }

  // ===============================
  // GENERATE ANALYSIS - EXPLICIT FLOW
  // ===============================

  async generateAnalysis(): Promise<void> {
    if (
      !this.applicationData ||
      !this.currentOpportunity ||
      !this.organizationId
    ) {
      console.error('❌ [AI-ASSISTANT] Missing required data for analysis');
      this.analysisError.set('Missing application or opportunity data');
      return;
    }

    console.log('🔄 [AI-ASSISTANT] Initiating analysis request...');

    const isFree = this.hasFreeAnalysisAvailable();
    const cost = isFree ? 0 : 50; // 50 credits for paid

    try {
      // Step 1: Create request record in DB
      const requestId = await this.analysisRequestService.createAnalysisRequest(
        this.organizationId,
        isFree,
        cost,
        this.applicationData,
        this.currentOpportunity,
        this.profileData
      );

      this.currentAnalysisRequestId.set(requestId);

      // Step 2: If paid, show gating modal; if free, run immediately
      if (!isFree) {
        this.creditGatingCost.set(cost);
        this.showCreditGatingModal.set(true);
        console.log(`💳 [AI-ASSISTANT] Showing credit modal (${cost} credits)`);
        return;
      }

      console.log('🎁 [AI-ASSISTANT] Running FREE analysis');
      await this.executeAnalysis();
    } catch (error) {
      console.error('❌ [AI-ASSISTANT] Failed to create request:', error);
      this.analysisError.set('Failed to initialize analysis');
    }
  }

  // ===============================
  // CREDIT GATING HANDLERS
  // ===============================

  async onGatingConfirm(): Promise<void> {
    if (!this.organizationId || !this.currentAnalysisRequestId()) {
      console.error('❌ [AI-ASSISTANT] Missing org or request ID');
      return;
    }

    this.isProcessingCredits.set(true);
    this.analysisError.set(null);

    try {
      console.log('💳 [AI-ASSISTANT] Deducting credits...');
      await this.creditGating.deductCreditsForAction(
        this.organizationId,
        'generate'
      );

      this.showCreditGatingModal.set(false);
      await this.executeAnalysis();
    } catch (error) {
      console.error('❌ [AI-ASSISTANT] Credit deduction failed:', error);
      this.analysisError.set('Failed to process credits. Try again.');
    } finally {
      this.isProcessingCredits.set(false);
    }
  }

  onGatingCancel(): void {
    console.log('❌ [AI-ASSISTANT] User cancelled');
    this.showCreditGatingModal.set(false);

    if (this.currentAnalysisRequestId()) {
      this.analysisRequestService
        .markAnalysisExecuted(
          this.currentAnalysisRequestId()!,
          undefined,
          undefined,
          'User cancelled'
        )
        .catch((err) => console.error('Failed to mark cancelled:', err));
    }

    this.currentAnalysisRequestId.set(null);
  }

  // ===============================
  // EXECUTE ANALYSIS
  // ===============================

  private async executeAnalysis(): Promise<void> {
    this.isGeneratingAnalysis.set(true);
    this.analysisError.set(null);

    try {
      const requestId = this.currentAnalysisRequestId();
      if (!requestId) {
        throw new Error('No request ID available');
      }

      console.log('🔄 [AI-ASSISTANT] Running analysis...');

      // Run the actual analysis
      this.appIntelligence
        .getComprehensiveAnalysis(
          this.applicationData,
          this.currentOpportunity,
          this.profileData
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (analysis) => {
            try {
              this.applicationAnalysis.set(analysis.insights);
              this.investmentScore.set(analysis.investmentScore);

              // Mark as executed in DB
              await this.analysisRequestService.markAnalysisExecuted(
                requestId,
                analysis.insights,
                analysis.investmentScore
              );

              this.isAnalysisAvailable.set(true);
              this.isGeneratingAnalysis.set(false);
              this.hasFreeAnalysisAvailable.set(false); // Used free analysis

              console.log('✅ [AI-ASSISTANT] Analysis complete');
            } catch (err) {
              console.error('❌ [AI-ASSISTANT] Failed to save results:', err);
              this.analysisError.set(
                'Analysis complete but failed to save results'
              );
            }
          },
          error: async (error) => {
            console.error('❌ [AI-ASSISTANT] Analysis failed:', error);

            try {
              await this.analysisRequestService.markAnalysisExecuted(
                requestId,
                undefined,
                undefined,
                error.message
              );
            } catch (markErr) {
              console.error('Failed to mark error:', markErr);
            }

            this.isGeneratingAnalysis.set(false);
            this.analysisError.set('Analysis failed. Please try again.');
          },
        });
    } catch (error) {
      console.error('❌ [AI-ASSISTANT] Execution error:', error);
      this.isGeneratingAnalysis.set(false);
      this.analysisError.set('Failed to execute analysis');
    }
  }

  // ===============================
  // MARKET INTELLIGENCE
  // ===============================

  private loadMarketIntelligence() {
    const industry = this.industry();

    if (!industry) {
      console.log('❌ [AI-ASSISTANT] No industry data available');
      return;
    }

    this.isLoadingIntelligence.set(true);
    this.intelligenceError.set(null);

    this.marketIntelligence
      .getMarketIntelligence(industry, { maxAge: 24 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (intelligence) => {
          this.marketData.set(intelligence);
          this.isLoadingIntelligence.set(false);
        },
        error: (error) => {
          this.intelligenceError.set(error.message);
          this.isLoadingIntelligence.set(false);
        },
      });
  }

  // ===============================
  // UI HELPERS
  // ===============================

  getScoreColor(score: number): string {
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-blue-600';
    return 'text-red-600';
  }

  getScoreBgColor(score: number): string {
    if (score >= 75) return 'bg-green-50 border-green-200/50';
    if (score >= 60) return 'bg-amber-50 border-amber-200/50';
    if (score >= 40) return 'bg-blue-50 border-blue-200/50';
    return 'bg-red-50 border-red-200/50';
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
    const urgentKeywords = ['urgent', 'immediate', 'crisis'];
    const mediumKeywords = ['trend', 'shift', 'change'];
    const lower = insight.toLowerCase();
    if (urgentKeywords.some((k) => lower.includes(k))) return 'high';
    if (mediumKeywords.some((k) => lower.includes(k))) return 'medium';
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
      high: 'bg-red-50 border-red-200/50',
      medium: 'bg-amber-50 border-amber-200/50',
      low: 'bg-blue-50 border-blue-200/50',
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

  private formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return `${amount.toLocaleString()}`;
  }

  getEnhancedMarketInsight(): string {
    const market = this.marketData();
    if (!market) {
      return this.getFallbackMarketInsight();
    }
    if (market.trends?.length > 0) {
      return market.trends[0];
    }
    if (market.fundingTrends) {
      const trend = market.fundingTrends;
      return `${trend.dealCount} deals, avg ${this.formatAmount(
        trend.averageRoundSize
      )}, sentiment: ${trend.valuationTrend}`;
    }
    return 'Market analysis in progress...';
  }

  private getFallbackMarketInsight(): string {
    if (this.formData.offerAmount) {
      const amount = Number(this.formData.offerAmount);
      const lower = Math.round((amount * 0.5) / 1000);
      const upper = Math.round((amount * 1.5) / 1000);
      return `SMEs typically seek R${lower}K-R${upper}K. Your structure aligns well.`;
    }
    return 'Market insights will appear based on real-time analysis.';
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

  getIntelligentSuggestion(): string {
    const market = this.marketData();
    const insights = this.allInsights();
    const score = this.investmentScore();

    if (score) {
      if (score.recommendation === 'strong_buy') {
        return `Strong opportunity (${score.overall}/100). Key strengths align well.`;
      }
      if (score.recommendation === 'pass') {
        return `Significant concerns (${score.overall}/100). Review risks first.`;
      }
    }

    const urgent = insights.find((i) => i.urgency === 'high');
    if (urgent) {
      return `URGENT: ${urgent.description}`;
    }

    if (market?.timingInsights?.length) {
      return market.timingInsights[0];
    }

    return 'Run analysis to see personalized insights...';
  }

  handleInsightAction(insight: IntelligenceInsight): void {
    console.log('Handling insight:', insight.title);
  }

  showAllInsights(): void {
    console.log('View all insights:', this.allInsights().length);
  }
}
