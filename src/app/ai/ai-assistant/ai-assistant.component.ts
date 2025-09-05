// src/app/ai/ai-assistant/ai-assistant.component.ts
import { Component, inject, Input, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Sparkles, Lightbulb, TrendingUp, Copy, Calculator, FileText, HelpCircle, AlertTriangle, Target, DollarSign, Clock, Zap } from 'lucide-angular';
import { Router } from '@angular/router';
import { Subject, takeUntil} from 'rxjs';
import { MarketIntelligenceService, MarketIntelligence, CompetitorIntelligence } from '../services/market-intelligence.service';
 
interface FormData {
  fundingType: string;
  offerAmount: string;
  industry?: string;
  targetStage?: string;
  [key: string]: any;
}

interface IntelligenceInsight {
  type: 'market_timing' | 'competitor_activity' | 'risk_alert' | 'opportunity' | 'regulatory' | 'funding_trend';
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
  template: `
    <div class="bg-gradient-to-br from-slate-500 via-primary-500 to-cyan-600 p-0.5 rounded-xl sticky top-6">
      <div class="bg-white rounded-xl p-6">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-8 h-8 bg-gradient-to-r from-slate-500 to-slate-500 rounded-lg flex items-center justify-center">
            <lucide-icon [img]="SparklesIcon" [size]="16" class="text-white"></lucide-icon>
          </div>
          <h3 class="font-semibold text-gray-900">Kapify Investment Assistant</h3>
          @if (isLoadingIntelligence()) {
            <div class="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
          }
        </div>

        <div class="space-y-4">
          <!-- Real-Time Market Intelligence -->
          @if (topInsight()) {
            <div [class]="getInsightCardClass(topInsight()!.urgency)" class="rounded-lg p-4">
              <div class="flex items-start space-x-3">
                <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                     [class]="getInsightIconBg(topInsight()!.urgency)">
                  <lucide-icon [img]="getInsightIcon(topInsight()!.type)" [size]="12" 
                               [class]="getInsightIconColor(topInsight()!.urgency)"></lucide-icon>
                </div>
                <div class="flex-1">
                  <h4 class="text-sm font-medium mb-1" [class]="getInsightTitleColor(topInsight()!.urgency)">
                    {{ topInsight()!.title }}
                  </h4>
                  <p class="text-xs leading-relaxed" [class]="getInsightTextColor(topInsight()!.urgency)">
                    {{ topInsight()!.description }}
                  </p>
                  @if (topInsight()!.actionItem) {
                    <button 
                      class="text-xs font-medium mt-2 hover:underline"
                      [class]="getInsightActionColor(topInsight()!.urgency)"
                      (click)="handleInsightAction(topInsight()!)">
                      {{ topInsight()!.actionItem }} →
                    </button>
                  }
                  <div class="flex items-center justify-between mt-2">
                    <span class="text-xs opacity-75" [class]="getInsightTextColor(topInsight()!.urgency)">
                      Confidence: {{ topInsight()!.confidence }}%
                    </span>
                    @if (topInsight()!.source) {
                      <span class="text-xs opacity-60" [class]="getInsightTextColor(topInsight()!.urgency)">
                        {{ topInsight()!.source }}
                      </span>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Enhanced Market Insight -->
          <div class="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <lucide-icon [img]="TrendingUpIcon" [size]="12" class="text-primary-600"></lucide-icon>
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-medium text-primary-900 mb-1">Market Intelligence</h4>
                <p class="text-xs text-primary-700 leading-relaxed">
                  {{ getEnhancedMarketInsight() }}
                </p>
                @if (hasMarketData()) {
                  <div class="mt-2 text-xs text-primary-600">
                    <span class="font-medium">{{ getMarketStats() }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Smart Suggestion with Intelligence -->
          <div class="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <div class="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <lucide-icon [img]="LightbulbIcon" [size]="12" class="text-slate-600"></lucide-icon>
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-medium text-slate-900 mb-1">Smart Suggestion</h4>
                <p class="text-xs text-slate-700 leading-relaxed">
                  {{ getIntelligentSuggestion() }}
                </p>
                <button 
                  class="text-xs text-slate-600 hover:text-slate-800 font-medium mt-2"
                  (click)="applySuggestion()"
                >
                  Apply suggestion →
                </button>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="space-y-2">
            <h4 class="text-sm font-semibold text-gray-900">Quick Actions</h4>
            
            <button 
              class="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all group"
              (click)="analyzeMarketTiming()"
              [disabled]="isLoadingIntelligence()"
            >
              <div class="flex items-center space-x-3">
                <lucide-icon [img]="ClockIcon" [size]="16" class="text-gray-400 group-hover:text-primary-600"></lucide-icon>
                <span class="text-sm text-gray-700 group-hover:text-primary-700">Analyze Market Timing</span>
              </div>
            </button>

            <button 
              class="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all group"
              (click)="researchCompetitors()"
              [disabled]="isLoadingIntelligence()"
            >
              <div class="flex items-center space-x-3">
                <lucide-icon [img]="TargetIcon" [size]="16" class="text-gray-400 group-hover:text-primary-600"></lucide-icon>
                <span class="text-sm text-gray-700 group-hover:text-primary-700">Research Competitors</span>
              </div>
            </button>

            <button 
              class="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all group"
              (click)="calculateReturns()"
            >
              <div class="flex items-center space-x-3">
                <lucide-icon [img]="CalculatorIcon" [size]="16" class="text-gray-400 group-hover:text-primary-600"></lucide-icon>
                <span class="text-sm text-gray-700 group-hover:text-primary-700">Calculate Returns</span>
              </div>
            </button>

            <button 
              class="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-all group"
              (click)="generateDescription()"
            >
              <div class="flex items-center space-x-3">
                <lucide-icon [img]="FileTextIcon" [size]="16" class="text-gray-400 group-hover:text-primary-600"></lucide-icon>
                <span class="text-sm text-gray-700 group-hover:text-primary-700">Generate Description</span>
              </div>
            </button>
          </div>

          <!-- Intelligence Summary -->
          @if (allInsights().length > 1) {
            <div class="border-t border-gray-200 pt-4">
              <div class="text-xs text-gray-500 mb-2">Additional Insights ({{ allInsights().length - 1 }})</div>
              <div class="space-y-2">
                @for (insight of allInsights().slice(1, 4); track insight.title) {
                  <div class="flex items-center space-x-2">
                    <div class="w-2 h-2 rounded-full" [class]="getUrgencyDot(insight.urgency)"></div>
                    <span class="text-xs text-gray-600 line-clamp-1">{{ insight.title }}</span>
                  </div>
                }
                @if (allInsights().length > 4) {
                  <button class="text-xs text-primary-600 hover:text-primary-800 font-medium" 
                          (click)="showAllInsights()">
                    +{{ allInsights().length - 4 }} more insights
                  </button>
                }
              </div>
            </div>
          }

          <!-- Progress Indicator -->
          <div class="border-t border-gray-200 pt-4">
            <div class="text-xs text-gray-500 mb-2">Form completion</div>
            <div class="flex items-center space-x-2">
              <div class="flex-1 bg-gray-200 rounded-full h-1.5">
                <div 
                  class="bg-gradient-to-r from-primary-500 to-slate-500 h-1.5 rounded-full transition-all duration-300" 
                  [style.width.%]="completionPercentage"
                ></div>
              </div>
              <span class="text-xs font-medium text-gray-700">{{ completionPercentage }}%</span>
            </div>
          </div>

          <!-- Contextual Help -->
          @if (contextualHelp()) {
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div class="flex items-start space-x-3">
                <div class="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <lucide-icon [img]="HelpCircleIcon" [size]="12" class="text-yellow-600"></lucide-icon>
                </div>
                <div class="flex-1">
                  <h4 class="text-sm font-medium text-yellow-900 mb-1">{{ contextualHelp()!.title }}</h4>
                  <p class="text-xs text-yellow-700 leading-relaxed">
                    {{ contextualHelp()!.message }}
                  </p>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class AiAssistantComponent implements OnInit, OnDestroy {
  @Input() currentStep: string = 'basic';
  @Input() formData: FormData = {} as FormData;
  @Input() completionPercentage: number = 0;
  @Input() currentOpportunity?: any;
  @Input() applicationData?: any;

  private router = inject(Router);
  private marketIntelligence = inject(MarketIntelligenceService);
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

  // Intelligence State
  marketData = signal<MarketIntelligence | null>(null);
  competitorData = signal<CompetitorIntelligence | null>(null);
  isLoadingIntelligence = signal(false);
  intelligenceError = signal<string | null>(null);

  // Computed Intelligence Insights
  allInsights = computed(() => {
    const insights: IntelligenceInsight[] = [];
    const market = this.marketData();
    const competitor = this.competitorData();

    // Market timing insights
    if (market?.timingInsights) {
      insights.push(...market.timingInsights.slice(0, 2).map(insight => ({
        type: 'market_timing' as const,
        urgency: this.assessTimingUrgency(insight),
        title: 'Market Timing Opportunity',
        description: insight,
        actionItem: 'Review timing strategy',
        confidence: market.confidence,
        source: 'Market Analysis'
      })));
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
          source: 'Funding Data'
        });
      }
    }

    // Regulatory insights
    if (market?.regulatoryChanges?.length) {
      market.regulatoryChanges.forEach(change => {
        insights.push({
          type: 'regulatory',
          urgency: 'medium',
          title: 'Regulatory Change Alert',
          description: change,
          actionItem: 'Review compliance impact',
          confidence: market.confidence,
          source: 'Regulatory Monitor'
        });
      });
    }

    // Competitor activity insights
    if (competitor?.recentNews?.length) {
      competitor.recentNews.slice(0, 1).forEach(news => {
        insights.push({
          type: 'competitor_activity',
          urgency: 'medium',
          title: 'Competitive Intelligence',
          description: news,
          actionItem: 'Assess competitive impact',
          confidence: competitor.confidence,
          source: 'Competitor Research'
        });
      });
    }

    // Risk alerts from market data
    if (market?.fundingTrends?.dealCount && market.fundingTrends.dealCount < 5) {
      insights.push({
        type: 'risk_alert',
        urgency: 'high',
        title: 'Low Deal Activity Warning',
        description: `Only ${market.fundingTrends.dealCount} deals last quarter in this sector. Market may be cooling.`,
        actionItem: 'Consider sector diversification',
        confidence: market.confidence,
        source: 'Deal Flow Analysis'
      });
    }

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
        message: this.getContextualRateAdvice()
      };
    }
    if (this.currentStep === 'basic' && this.marketData()?.trends.length) {
      return {
        title: 'Market Trend Alert',
        message: `${this.marketData()!.trends[0]}. Consider how this affects your positioning.`
      };
    }
    return null;
  });

  ngOnInit() {
    this.loadMarketIntelligence();
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
    const industry = this.formData.industry || this.currentOpportunity?.industry || this.applicationData?.industry;
    
    if (!industry) {
      console.log('No industry specified for market intelligence');
      return;
    }

    this.isLoadingIntelligence.set(true);
    this.intelligenceError.set(null);

    // Load market intelligence
    this.marketIntelligence.getMarketIntelligence(industry, { maxAge: 24 })
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
        }
      });

    // Load competitor intelligence if we have a company name
    const companyName = this.applicationData?.companyName || this.currentOpportunity?.title;
    if (companyName && companyName !== 'Unknown') {
      this.marketIntelligence.getCompetitorIntelligence(companyName, industry)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (competitor) => {
            this.competitorData.set(competitor);
            console.log('Competitor intelligence loaded:', competitor);
          },
          error: (error) => {
            console.warn('Competitor intelligence failed:', error);
          }
        });
    }
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
  // ENHANCED INSIGHTS METHODS
  // ===============================

  getIntelligentSuggestion(): string {
    const market = this.marketData();
    const insights = this.allInsights();

    // Priority: High urgency insights first
    const highUrgencyInsight = insights.find(i => i.urgency === 'high');
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
      return `Market shows ${trend.dealCount} deals averaging ${this.formatAmount(trend.averageRoundSize)}. Valuations are ${trend.valuationTrend}.`;
    }

    // Fallback to traditional suggestions
    if (this.currentStep === 'terms' && this.formData.fundingType === 'debt') {
      return 'Based on current market rates, consider setting your interest rate between 11-14% for competitive positioning.';
    }

    return 'Market intelligence is being analyzed. Suggestions will appear as data becomes available.';
  }

  getEnhancedMarketInsight(): string {
    const market = this.marketData();
    
    if (!market) {
      return this.getFallbackMarketInsight();
    }

    // Prioritize most impactful trends
    if (market.trends?.length > 0) {
      return `${market.trends[0]}. ${market.competitorActivity?.[0] || 'Monitor competitive landscape closely.'}`;
    }

    if (market.fundingTrends) {
      const trend = market.fundingTrends;
      return `${trend.dealCount} deals completed last quarter with average size ${this.formatAmount(trend.averageRoundSize)}. Market sentiment: ${trend.valuationTrend}.`;
    }

    return 'Real-time market analysis in progress...';
  }

  private getFallbackMarketInsight(): string {
    if (this.formData.offerAmount) {
      const amount = Number(this.formData.offerAmount);
      const lowerRange = Math.round(amount * 0.5 / 1000);
      const upperRange = Math.round(amount * 1.5 / 1000);
      return `SMEs typically seek R${lowerRange}K-R${upperRange}K investments. Your structure aligns well with market norms.`;
    }
    return 'Market insights will appear here based on real-time analysis.';
  }

  hasMarketData(): boolean {
    return !!(this.marketData()?.fundingTrends);
  }

  getMarketStats(): string {
    const market = this.marketData();
    if (!market?.fundingTrends) return '';
    
    const trend = market.fundingTrends;
    return `${trend.dealCount} deals • ${this.formatAmount(trend.totalFunding)} total • ${trend.valuationTrend} trend`;
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
    const industry = this.formData.industry || this.currentOpportunity?.industry;
    if (industry) {
      console.log('Refreshing market timing analysis for:', industry);
      this.marketIntelligence.getMarketIntelligence(industry, { forceRefresh: true })
        .pipe(takeUntil(this.destroy$))
        .subscribe(intelligence => {
          this.marketData.set(intelligence);
        });
    }
  }

  researchCompetitors() {
    const companyName = this.applicationData?.companyName || this.formData['companyName'];
    const industry = this.formData.industry || this.currentOpportunity?.industry;
    
    if (companyName && industry) {
      console.log('Refreshing competitor research for:', companyName);
      this.marketIntelligence.getCompetitorIntelligence(companyName, industry, { forceRefresh: true })
        .pipe(takeUntil(this.destroy$))
        .subscribe(competitor => {
          this.competitorData.set(competitor);
        });
    }
  }

  private exploreOpportunity(insight: IntelligenceInsight) {
    console.log('Exploring opportunity:', insight.title);
    // Could navigate to opportunity details or show more info
  }

  private addressRisk(insight: IntelligenceInsight) {
    console.log('Addressing risk:', insight.title);
    // Could show risk mitigation suggestions or documentation
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

  // ===============================
  // UI HELPER METHODS
  // ===============================

  private assessTimingUrgency(insight: string): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['urgent', 'immediate', 'crisis', 'crash', 'boom'];
    const mediumKeywords = ['trend', 'shift', 'change', 'opportunity'];
    
    const lowerInsight = insight.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerInsight.includes(keyword))) {
      return 'high';
    }
    if (mediumKeywords.some(keyword => lowerInsight.includes(keyword))) {
      return 'medium';
    }
    return 'low';
  }

  getInsightIcon(type: string): any {
    const icons: Record<string, any> = {
      'market_timing': this.ClockIcon,
      'competitor_activity': this.TargetIcon,
      'risk_alert': this.AlertTriangleIcon,
      'opportunity': this.ZapIcon,
      'regulatory': this.FileTextIcon,
      'funding_trend': this.DollarSignIcon
    };
    return icons[type] || this.LightbulbIcon;
  }

  getInsightCardClass(urgency: string): string {
    const classes = {
      'high': 'bg-red-50 border-red-200',
      'medium': 'bg-orange-50 border-orange-200',
      'low': 'bg-blue-50 border-blue-200'
    };
    return `border ${classes[urgency as keyof typeof classes]}`;
  }

  getInsightIconBg(urgency: string): string {
    const classes = {
      'high': 'bg-red-100',
      'medium': 'bg-orange-100', 
      'low': 'bg-blue-100'
    };
    return classes[urgency as keyof typeof classes];
  }

  getInsightIconColor(urgency: string): string {
    const classes = {
      'high': 'text-red-600',
      'medium': 'text-orange-600',
      'low': 'text-blue-600'
    };
    return classes[urgency as keyof typeof classes];
  }

  getInsightTitleColor(urgency: string): string {
    const classes = {
      'high': 'text-red-900',
      'medium': 'text-orange-900',
      'low': 'text-blue-900'
    };
    return classes[urgency as keyof typeof classes];
  }

  getInsightTextColor(urgency: string): string {
    const classes = {
      'high': 'text-red-700',
      'medium': 'text-orange-700',
      'low': 'text-blue-700'
    };
    return classes[urgency as keyof typeof classes];
  }

  getInsightActionColor(urgency: string): string {
    const classes = {
      'high': 'text-red-600 hover:text-red-800',
      'medium': 'text-orange-600 hover:text-orange-800',
      'low': 'text-blue-600 hover:text-blue-800'
    };
    return classes[urgency as keyof typeof classes];
  }

  getUrgencyDot(urgency: string): string {
    const classes = {
      'high': 'bg-red-500',
      'medium': 'bg-orange-500',
      'low': 'bg-blue-500'
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
    // Simple heuristic based on deal activity and trends
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