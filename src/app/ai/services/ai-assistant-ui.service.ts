// src/app/ai/services/ai-assistant-ui.service.ts
/**
 * AI Assistant UI Service
 *
 * Handles:
 * - Color schemes and styling
 * - Text formatting and utilities
 * - UI helper calculations
 * - CSS class generation
 */

import { Injectable } from '@angular/core';
import {
  InvestmentScore,
  ApplicationInsight,
} from './application-intelligence.service';

export interface IntelligenceInsight {
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

@Injectable({ providedIn: 'root' })
export class AiAssistantUiService {
  // ============================================================================
  // INVESTMENT SCORE STYLING
  // ============================================================================

  /**
   * Get text color for investment score
   */
  getScoreColor(score: number): string {
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-blue-600';
    return 'text-red-600';
  }

  /**
   * Get background color class for investment score
   */
  getScoreBgColor(score: number): string {
    if (score >= 75) return 'bg-green-50 border-green-200/50';
    if (score >= 60) return 'bg-amber-50 border-amber-200/50';
    if (score >= 40) return 'bg-blue-50 border-blue-200/50';
    return 'bg-red-50 border-red-200/50';
  }

  // ============================================================================
  // RECOMMENDATION STYLING
  // ============================================================================

  /**
   * Get text color for recommendation
   */
  getRecommendationColor(recommendation: string): string {
    if (recommendation === 'strong_buy') return 'text-green-700';
    if (recommendation === 'consider') return 'text-amber-700';
    if (recommendation === 'need_more_info') return 'text-blue-700';
    return 'text-red-700';
  }

  /**
   * Get background color for recommendation
   */
  getRecommendationBg(recommendation: string): string {
    if (recommendation === 'strong_buy') return 'bg-green-100';
    if (recommendation === 'consider') return 'bg-amber-100';
    if (recommendation === 'need_more_info') return 'bg-blue-100';
    return 'bg-red-100';
  }

  /**
   * Format recommendation text (convert snake_case to Title Case)
   */
  getRecommendationText(recommendation: string): string {
    return recommendation
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .toUpperCase();
  }

  // ============================================================================
  // INSIGHT STYLING & COLORS
  // ============================================================================

  /**
   * Get card CSS class for insight based on urgency
   */
  getInsightCardClass(urgency: string): string {
    const classes = {
      high: 'bg-red-50 border-red-200/50',
      medium: 'bg-amber-50 border-amber-200/50',
      low: 'bg-blue-50 border-blue-200/50',
    };
    return `border ${classes[urgency as keyof typeof classes] || classes.low}`;
  }

  /**
   * Get icon background color for insight
   */
  getInsightIconBg(urgency: string): string {
    const classes = {
      high: 'bg-red-100',
      medium: 'bg-amber-100',
      low: 'bg-blue-100',
    };
    return classes[urgency as keyof typeof classes] || classes.low;
  }

  /**
   * Get icon color for insight
   */
  getInsightIconColor(urgency: string): string {
    const classes = {
      high: 'text-red-600',
      medium: 'text-amber-600',
      low: 'text-blue-600',
    };
    return classes[urgency as keyof typeof classes] || classes.low;
  }

  /**
   * Get title color for insight
   */
  getInsightTitleColor(urgency: string): string {
    const classes = {
      high: 'text-red-900',
      medium: 'text-amber-900',
      low: 'text-blue-900',
    };
    return classes[urgency as keyof typeof classes] || classes.low;
  }

  /**
   * Get text color for insight
   */
  getInsightTextColor(urgency: string): string {
    const classes = {
      high: 'text-red-700',
      medium: 'text-amber-700',
      low: 'text-blue-700',
    };
    return classes[urgency as keyof typeof classes] || classes.low;
  }

  /**
   * Get action link color for insight
   */
  getInsightActionColor(urgency: string): string {
    const classes = {
      high: 'text-red-600 hover:text-red-800',
      medium: 'text-amber-600 hover:text-amber-800',
      low: 'text-blue-600 hover:text-blue-800',
    };
    return classes[urgency as keyof typeof classes] || classes.low;
  }

  /**
   * Get urgency indicator dot color
   */
  getUrgencyDot(urgency: string): string {
    const classes = {
      high: 'bg-red-500',
      medium: 'bg-amber-500',
      low: 'bg-blue-500',
    };
    return classes[urgency as keyof typeof classes] || classes.low;
  }

  // ============================================================================
  // INSIGHT TYPE HELPERS
  // ============================================================================

  /**
   * Assess urgency from insight text
   */
  assessTimingUrgency(insight: string): 'low' | 'medium' | 'high' {
    const urgentKeywords = ['urgent', 'immediate', 'crisis', 'critical'];
    const mediumKeywords = ['trend', 'shift', 'change', 'warning'];
    const lower = insight.toLowerCase();

    if (urgentKeywords.some((k) => lower.includes(k))) return 'high';
    if (mediumKeywords.some((k) => lower.includes(k))) return 'medium';
    return 'low';
  }

  // ============================================================================
  // NUMBER & CURRENCY FORMATTING
  // ============================================================================

  /**
   * Format amount to K/M notation
   */

  formatAmount(amount?: number): string {
    if (!amount) return '—'; // or '$0'
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  }

  /**
   * Format currency with currency code
   */
  formatCurrency(amount: number, currency: string = 'R'): string {
    return `${currency}${this.formatAmount(amount)}`;
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Format large number with commas
   */
  formatNumber(value: number): string {
    return value.toLocaleString();
  }

  // ============================================================================
  // MARKET DATA HELPERS
  // ============================================================================

  /**
   * Build market stats string
   */
  buildMarketStats(
    dealCount: number,
    totalFunding: number,
    valuationTrend: string
  ): string {
    return `${dealCount} deals • ${this.formatAmount(
      totalFunding
    )} total • ${valuationTrend} trend`;
  }

  /**
   * Build fallback market insight based on form data
   */
  buildFallbackMarketInsight(offerAmount?: number): string {
    if (offerAmount) {
      const lower = Math.round((offerAmount * 0.5) / 1000);
      const upper = Math.round((offerAmount * 1.5) / 1000);
      return `SMEs typically seek R${lower}K-R${upper}K. Your structure aligns well.`;
    }
    return 'Market insights will appear based on real-time analysis.';
  }

  /**
   * Generate intelligent suggestion based on analysis
   */
  generateIntelligentSuggestion(
    investmentScore: InvestmentScore | null,
    insights: IntelligenceInsight[],
    timingInsights?: string[]
  ): string {
    if (investmentScore) {
      if (investmentScore.recommendation === 'strong_buy') {
        return `Strong opportunity (${investmentScore.overall}/100). Key strengths align well.`;
      }
      if (investmentScore.recommendation === 'pass') {
        return `Significant concerns (${investmentScore.overall}/100). Review risks first.`;
      }
    }

    const urgent = insights.find((i) => i.urgency === 'high');
    if (urgent) {
      return `URGENT: ${urgent.description}`;
    }

    if (timingInsights?.length) {
      return timingInsights[0];
    }

    return 'Run analysis to see personalized insights...';
  }

  // ============================================================================
  // VALIDATION & STATE HELPERS
  // ============================================================================

  /**
   * Check if score has valid data
   */
  hasValidScore(score: InvestmentScore | null): boolean {
    return score !== null && score.overall >= 0 && score.overall <= 100;
  }

  /**
   * Check if insights array has content
   */
  hasInsights(insights: IntelligenceInsight[] | null | undefined): boolean {
    return Array.isArray(insights) && insights.length > 0;
  }

  /**
   * Get urgency count by level
   */
  getUrgencyCounts(insights: IntelligenceInsight[]): Record<string, number> {
    return {
      high: insights.filter((i) => i.urgency === 'high').length,
      medium: insights.filter((i) => i.urgency === 'medium').length,
      low: insights.filter((i) => i.urgency === 'low').length,
    };
  }

  /**
   * Get most critical insight
   */
  getMostCriticalInsight(
    insights: IntelligenceInsight[]
  ): IntelligenceInsight | null {
    const urgencyOrder = { high: 3, medium: 2, low: 1 };
    return insights.length > 0
      ? insights.reduce((prev, current) =>
          urgencyOrder[current.urgency] > urgencyOrder[prev.urgency]
            ? current
            : prev
        )
      : null;
  }

  // ============================================================================
  // TEXT UTILITIES
  // ============================================================================

  /**
   * Truncate text with ellipsis
   */
  truncate(text: string, length: number = 150): string {
    return text.length > length ? `${text.substring(0, length)}...` : text;
  }

  /**
   * Convert snake_case to Title Case
   */
  toTitleCase(text: string): string {
    return text
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Convert text to sentence case
   */
  toSentenceCase(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Highlight key terms in text
   */
  highlightTerms(text: string, terms: string[]): string {
    let result = text;
    terms.forEach((term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      result = result.replace(regex, `<strong>${term}</strong>`);
    });
    return result;
  }

  // ============================================================================
  // SCORE INTERPRETATION
  // ============================================================================

  /**
   * Get human-readable score label
   */
  getScoreLabel(score: number): string {
    if (score >= 90) return 'Exceptional';
    if (score >= 75) return 'Strong';
    if (score >= 60) return 'Good';
    if (score >= 45) return 'Fair';
    if (score >= 30) return 'Concerning';
    return 'Poor';
  }

  /**
   * Get score description
   */
  getScoreDescription(score: number): string {
    if (score >= 75)
      return 'This application shows strong fundamentals and high investment potential.';
    if (score >= 60)
      return 'This application has positive qualities but some areas need improvement.';
    if (score >= 40)
      return 'This application has potential but requires careful evaluation of risks.';
    return 'This application has significant concerns that should be addressed first.';
  }

  /**
   * Get recommendation description
   */
  getRecommendationDescription(recommendation: string): string {
    const descriptions: Record<string, string> = {
      strong_buy:
        'Highly recommended for investment. Strong fundamentals and growth potential.',
      consider:
        'Worth considering with due diligence. Potential with some conditions.',
      need_more_info:
        'Requires additional information before making a decision.',
      pass: 'Not recommended at this time. Significant concerns identified.',
    };
    return (
      descriptions[recommendation] ||
      'See detailed analysis for recommendation.'
    );
  }
}
