// src/app/funder/components/ai-executive-summary/ai-executive-summary.component.ts
import { Component, Input, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  Zap, 
  TrendingUp, 
  Shield, 
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-angular';  
import { FundingApplication } from 'src/app/SMEs/models/application.models';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
 
interface AIInsight {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  confidence: number;
}

interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  score: number;
  factors: string[];
}

interface MarketFit {
  score: number;
  alignment: string;
  potential: string;
}

@Component({
  selector: 'app-ai-executive-summary',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  template: `
    <div class="gradient-border">
      <div class="gradient-content">
        <div class="flex items-start justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center">
            <lucide-icon [img]="ZapIcon" [size]="20" class="text-slate-600 mr-2"></lucide-icon>
            Quick Evaluation
          </h2>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-medium" [class]="getConfidenceColorClass()">
              {{ overallConfidence() }}% Confidence
            </span>
            <div class="w-16 h-1 bg-gray-200 rounded-full">
              <div 
                class="h-1 rounded-full transition-all duration-500" 
                [class]="getConfidenceBarClass()"
                [style.width.%]="overallConfidence()">
              </div>
            </div>
          </div>
        </div>
        
        <!-- Key Metrics -->
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="metric-card rounded-lg p-4" [class]="getOverallScoreCardClass()">
            <div class="text-2xl font-bold" [class]="getOverallScoreTextClass()">
              {{ overallScore() }}/10
            </div>
            <div class="text-sm font-medium text-gray-700">Overall Score</div>
            <div class="text-xs text-gray-500 mt-1">{{ getScoreDescription() }}</div>
          </div>
          
          <div class="metric-card rounded-lg p-4" [class]="getRiskCardClass()">
            <div class="text-2xl font-bold" [class]="getRiskTextClass()">
              {{ riskAssessment().level | titlecase }}
            </div>
            <div class="text-sm font-medium text-gray-700">Risk Level</div>
            <div class="text-xs text-gray-500 mt-1">{{ getRiskDescription() }}</div>
          </div>
          
          <div class="metric-card rounded-lg p-4" [class]="getMarketFitCardClass()">
            <div class="text-2xl font-bold" [class]="getMarketFitTextClass()">
              {{ marketFit().score }}%
            </div>
            <div class="text-sm font-medium text-gray-700">Market Fit</div>
            <div class="text-xs text-gray-500 mt-1">{{ marketFit().potential }}</div>
          </div>
        </div>

        <!-- AI Key Insight -->
        <div class="border-l-4 p-4 rounded-r-lg" [class]="getInsightBorderClass()">
          <p class="font-medium mb-2" [class]="getInsightTitleClass()">
            <lucide-icon [img]="getInsightIcon()" [size]="16" class="inline mr-1"></lucide-icon>
            Key AI Insight
          </p>
          <p class="text-sm leading-relaxed" [class]="getInsightTextClass()">
            {{ keyInsight().message }}
          </p>
          @if (keyInsight().confidence < 70) {
            <p class="text-xs mt-2 text-amber-600">
              <lucide-icon [img]="AlertTriangleIcon" [size]="12" class="inline mr-1"></lucide-icon>
              Lower confidence - manual review recommended
            </p>
          }
        </div>

        <!-- Additional Insights -->
        @if (additionalInsights().length > 0) {
          <div class="mt-4 space-y-2">
            <h4 class="text-sm font-medium text-gray-700 mb-2">Additional Analysis</h4>
            @for (insight of additionalInsights(); track insight.message) {
              <div class="flex items-start space-x-2 text-sm">
                <lucide-icon 
                  [img]="getInsightTypeIcon(insight.type)" 
                  [size]="14" 
                  [class]="getInsightTypeClass(insight.type)">
                </lucide-icon>
                <span class="text-gray-700">{{ insight.message }}</span>
                <span class="text-xs text-gray-500 ml-auto">
                  {{ insight.confidence }}%
                </span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .gradient-border {
      background: linear-gradient(135deg, #26667F 0%, #26667F 100%);
      padding: 2px;
      border-radius: 12px;
    }
    
    .gradient-content {
      background: white;
      border-radius: 10px;
      padding: 1.5rem;
    }
    
    .metric-card {
      transition: all 0.2s ease;
    }
    
    .metric-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .risk-low {
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
    }
    
    .risk-medium {
      background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
    }
    
    .risk-high {
      background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
    }
  `]
})
export class AiExecutiveSummaryComponent implements OnInit {
  @Input() application!: FundingApplication;
  @Input() opportunity!: FundingOpportunity;

  // Icons
  ZapIcon = Zap;
  TrendingUpIcon = TrendingUp;
  ShieldIcon = Shield;
  TargetIcon = Target;
  AlertTriangleIcon = AlertTriangle;
  CheckCircleIcon = CheckCircle;
  BarChart3Icon = BarChart3;

  // Computed analysis
  overallScore = computed(() => this.calculateOverallScore());
  overallConfidence = computed(() => this.calculateOverallConfidence());
  riskAssessment = computed(() => this.calculateRiskAssessment());
  marketFit = computed(() => this.calculateMarketFit());
  keyInsight = computed(() => this.generateKeyInsight());
  additionalInsights = computed(() => this.generateAdditionalInsights());

  ngOnInit() {
    if (!this.application || !this.opportunity) {
      console.warn('AI Executive Summary: Missing required inputs');
    }
  }

  private calculateOverallScore(): number {
    if (!this.application || !this.opportunity) return 0;

    let score = 5; // Base score

    // Check AI match score if available
    if (this.application.aiMatchScore) {
      score = Math.round(this.application.aiMatchScore / 10);
    } else {
      // Calculate based on available data
      const factors = this.getScoreFactors();
      score = Math.min(10, Math.max(1, factors.reduce((sum, factor) => sum + factor, 0)));
    }

   return Number(score.toFixed(2));

  }

  private getScoreFactors(): number[] {
    const factors: number[] = [];
    const formData = this.application.formData || {};
    
    // Application completeness (0-2 points)
    const completeness = this.calculateCompleteness();
    factors.push(completeness * 2);
    
    // Funding amount alignment (0-3 points)
    const requestedAmount = this.getRequestedAmount();
    if (requestedAmount && this.opportunity.offerAmount) {
      const ratio = requestedAmount / this.opportunity.offerAmount;
      if (ratio <= 0.8) factors.push(3); // Good fit
      else if (ratio <= 1.0) factors.push(2); // Acceptable
      else factors.push(1); // Over budget
    } else {
      factors.push(1); // Missing data
    }
    
    // Timeline reasonableness (0-2 points)
    if (formData['timeline']) {
      factors.push(2); // Has timeline
    } else {
      factors.push(1); // No timeline
    }
    
    // Use of funds clarity (0-3 points)
    const useOfFunds = formData['useOfFunds'];
    if (useOfFunds && useOfFunds.length > 50) {
      factors.push(3); // Detailed
    } else if (useOfFunds) {
      factors.push(2); // Basic
    } else {
      factors.push(1); // Missing
    }

    return factors;
  }

  private calculateCompleteness(): number {
    const formData = this.application.formData || {};
    const requiredFields = ['requestedAmount', 'useOfFunds', 'timeline'];
    const completedFields = requiredFields.filter(field => formData[field]).length;
    return completedFields / requiredFields.length;
  }

  private calculateOverallConfidence(): number {
    if (!this.application) return 0;

    let confidence = 50; // Base confidence

    // Increase confidence based on data availability
    if (this.application.formData && Object.keys(this.application.formData).length > 3) {
      confidence += 20;
    }

    if (this.application.documents && Object.keys(this.application.documents).length > 0) {
      confidence += 15;
    }

    if (this.application.applicant) {
      confidence += 10;
    }

    // AI analysis available
    if (this.application.aiAnalysisStatus === 'completed') {
      confidence += 20;
    }

    return Math.min(95, confidence);
  }

  private calculateRiskAssessment(): RiskAssessment {
    if (!this.application || !this.opportunity) {
      return { level: 'high', score: 0, factors: ['Insufficient data'] };
    }

    const riskFactors: string[] = [];
    let riskScore = 0;

    const requestedAmount = this.getRequestedAmount();
    const maxAmount = this.opportunity.offerAmount;

    // Amount risk
    if (requestedAmount && maxAmount) {
      const ratio = requestedAmount / maxAmount;
      if (ratio > 1.0) {
        riskFactors.push('Requesting above maximum amount');
        riskScore += 30;
      } else if (ratio > 0.8) {
        riskFactors.push('High funding request');
        riskScore += 15;
      }
    }

    // Application completeness risk
    const completeness = this.calculateCompleteness();
    if (completeness < 0.7) {
      riskFactors.push('Incomplete application');
      riskScore += 25;
    }

    // Timeline risk
    const formData = this.application.formData || {};
    if (!formData['timeline']) {
      riskFactors.push('No project timeline provided');
      riskScore += 20;
    }

    // Use of funds risk
    if (!formData['useOfFunds'] || formData['useOfFunds'].length < 30) {
      riskFactors.push('Unclear use of funds');
      riskScore += 20;
    }

    let level: 'low' | 'medium' | 'high';
    if (riskScore <= 20) level = 'low';
    else if (riskScore <= 50) level = 'medium';
    else level = 'high';

    if (riskFactors.length === 0) {
      riskFactors.push('Standard due diligence required');
    }

    return { level, score: riskScore, factors: riskFactors };
  }

  private calculateMarketFit(): MarketFit {
    if (!this.application || !this.opportunity) {
      return { score: 0, alignment: 'Unknown', potential: 'Insufficient data' };
    }

    let score = 50; // Base score
    let alignment = 'Basic alignment';
    let potential = 'Moderate potential';

    const formData = this.application.formData || {};

    // Industry/sector alignment
    if (this.application.applicant?.industry) {
      score += 20;
      alignment = 'Industry match found';
    }

    // Funding type alignment
    if (this.opportunity.fundingType) {
      score += 15;
    }

    // Project description quality
    if (this.application.description && this.application.description.length > 100) {
      score += 10;
    }

    // Opportunity alignment statement
    if (formData['opportunityAlignment']) {
      score += 15;
      alignment = 'Strong strategic alignment';
    }

    // Set potential based on score
    if (score >= 80) potential = 'High growth potential';
    else if (score >= 60) potential = 'Good potential';
    else if (score >= 40) potential = 'Moderate potential';
    else potential = 'Limited potential';

    return { score: Math.min(100, score), alignment, potential };
  }

  private generateKeyInsight(): AIInsight {
    if (!this.application || !this.opportunity) {
      return {
        type: 'neutral',
        message: 'Insufficient data for comprehensive analysis. Manual review required.',
        confidence: 30
      };
    }

    const overallScore = this.overallScore();
    const risk = this.riskAssessment();
    const market = this.marketFit();
    const requestedAmount = this.getRequestedAmount();

    let message = '';
    let type: 'positive' | 'negative' | 'neutral' = 'neutral';
    let confidence = this.overallConfidence();

    if (overallScore >= 8) {
      type = 'positive';
      message = `Strong application with ${market.score}% market fit. `;
      
      if (requestedAmount && this.opportunity.offerAmount) {
        const ratio = requestedAmount / this.opportunity.offerAmount;
        if (ratio <= 0.8) {
          message += `Conservative funding request (${this.formatCurrency(requestedAmount)}) shows financial prudence.`;
        } else {
          message += `Funding request aligns well with opportunity parameters.`;
        }
      }
      
      if (risk.level === 'low') {
        message += ' Low risk profile with manageable due diligence requirements.';
      }
    } else if (overallScore <= 4) {
      type = 'negative';
      message = `Application requires significant improvement. Key concerns: ${risk.factors.slice(0, 2).join(', ')}.`;
      
      if (risk.level === 'high') {
        message += ' High-risk profile requires careful evaluation.';
      }
    } else {
      type = 'neutral';
      message = `Moderate application with ${market.potential.toLowerCase()}. `;
      
      if (risk.factors.length > 0) {
        message += `Primary considerations: ${risk.factors[0]}.`;
      }
      
      message += ' Standard review process recommended.';
    }

    return { type, message, confidence };
  }

  private generateAdditionalInsights(): AIInsight[] {
    if (!this.application || !this.opportunity) return [];

    const insights: AIInsight[] = [];
    const formData = this.application.formData || {};
    const requestedAmount = this.getRequestedAmount();

    // Funding efficiency insight
    if (requestedAmount && this.opportunity.offerAmount) {
      const efficiency = (this.opportunity.offerAmount - requestedAmount) / this.opportunity.offerAmount;
      if (efficiency > 0.3) {
        insights.push({
          type: 'positive',
          message: `Efficient funding request - 32% below maximum, indicating realistic planning`,
          confidence: 85
        });
      }
    }

    // Timeline insight
    if (formData['timeline']) {
      insights.push({
        type: 'positive',
        message: `Project timeline provided - demonstrates planning capability`,
        confidence: 75
      });
    }

    // Documentation insight
    const docCount = this.application.documents ? Object.keys(this.application.documents).length : 0;
    if (docCount > 2) {
      insights.push({
        type: 'positive',
        message: `Well-documented application with ${docCount} supporting documents`,
        confidence: 80
      });
    } else if (docCount === 0) {
      insights.push({
        type: 'negative',
        message: `No supporting documents uploaded - may require additional verification`,
        confidence: 90
      });
    }

    return insights.slice(0, 3); // Limit to 3 insights
  }

  private getRequestedAmount(): number | null {
    const formData = this.application?.formData || {};
    const amount = formData['requestedAmount'];
    
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: this.opportunity?.currency || 'ZAR'
    }).format(amount);
  }

  // Style helper methods
  getConfidenceColorClass(): string {
    const confidence = this.overallConfidence();
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  getConfidenceBarClass(): string {
    const confidence = this.overallConfidence();
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getOverallScoreCardClass(): string {
    const score = this.overallScore();
    if (score >= 8) return 'risk-low';
    if (score >= 6) return 'risk-medium';
    return 'risk-high';
  }

  getOverallScoreTextClass(): string {
    const score = this.overallScore();
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  }

  getScoreDescription(): string {
    const score = this.overallScore();
    if (score >= 9) return 'Excellent fit';
    if (score >= 8) return 'Very good fit';
    if (score >= 7) return 'Good fit';
    if (score >= 6) return 'Fair fit';
    if (score >= 5) return 'Needs improvement';
    return 'Poor fit';
  }

  getRiskCardClass(): string {
    const risk = this.riskAssessment();
    return `risk-${risk.level}`;
  }

  getRiskTextClass(): string {
    const risk = this.riskAssessment();
    if (risk.level === 'low') return 'text-green-600';
    if (risk.level === 'medium') return 'text-yellow-600';
    return 'text-red-600';
  }

  getRiskDescription(): string {
    const risk = this.riskAssessment();
    if (risk.level === 'low') return 'Manageable risks';
    if (risk.level === 'medium') return 'Moderate concerns';
    return 'Significant risks';
  }

  getMarketFitCardClass(): string {
    const score = this.marketFit().score;
    if (score >= 80) return 'risk-low';
    if (score >= 60) return 'risk-medium';
    return 'risk-high';
  }

  getMarketFitTextClass(): string {
    const score = this.marketFit().score;
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  getInsightBorderClass(): string {
    const insight = this.keyInsight();
    if (insight.type === 'positive') return 'bg-blue-50 border-blue-400';
    if (insight.type === 'negative') return 'bg-red-50 border-red-400';
    return 'bg-gray-50 border-gray-400';
  }

  getInsightTitleClass(): string {
    const insight = this.keyInsight();
    if (insight.type === 'positive') return 'text-blue-800';
    if (insight.type === 'negative') return 'text-red-800';
    return 'text-gray-800';
  }

  getInsightTextClass(): string {
    const insight = this.keyInsight();
    if (insight.type === 'positive') return 'text-blue-700';
    if (insight.type === 'negative') return 'text-red-700';
    return 'text-gray-700';
  }

  getInsightIcon(): any {
    const insight = this.keyInsight();
    if (insight.type === 'positive') return this.CheckCircleIcon;
    if (insight.type === 'negative') return this.AlertTriangleIcon;
    return this.BarChart3Icon;
  }

  getInsightTypeIcon(type: string): any {
    if (type === 'positive') return this.CheckCircleIcon;
    if (type === 'negative') return this.AlertTriangleIcon;
    return this.BarChart3Icon;
  }

  getInsightTypeClass(type: string): string {
    if (type === 'positive') return 'text-green-500 mt-0.5';
    if (type === 'negative') return 'text-red-500 mt-0.5';
    return 'text-gray-500 mt-0.5';
  }
}