// src/app/shared/services/financial-intelligence.service.ts
import { Injectable } from '@angular/core';
import { FinancialRowData, FinancialRatioData, ParsedFinancialData } from './excel-financial-parser.service';

// =====================================
// INTERFACES
// =====================================

export interface CalculatedRatio {
  name: string;
  value: number;
  formula: string;
  category: 'profitability' | 'liquidity' | 'efficiency' | 'growth' | 'leverage';
  interpretation: string;
  benchmark?: { industry: number; comparison: 'above' | 'below' | 'inline' };
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  expected?: number;
  actual?: number;
  autoFixable: boolean;
}

export interface FinancialInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'risk';
  category: 'profitability' | 'liquidity' | 'efficiency' | 'growth' | 'leverage';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation?: string;
}

export interface FinancialHealthScore {
  overall: number; // 0-100
  breakdown: {
    profitability: number;
    liquidity: number;
    efficiency: number;
    growth: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export interface FinancialAnalysisReport {
  // Calculated metrics
  calculatedRatios: CalculatedRatio[];
  
  // Validation results
  validationIssues: ValidationIssue[];
  dataQualityScore: number; // 0-100
  
  // Intelligence
  insights: FinancialInsight[];
  healthScore: FinancialHealthScore;
  
  // Summary
  executiveSummary: string;
  keyFindings: string[];
  
  // Metadata
  analysisDate: Date;
  periodCovered: string;
}

interface IncomeStatementMetrics {
  revenue: number[];
  costOfSales: number[];
  grossProfit: number[];
  operatingExpenses: number[];
  ebitda: number[];
  profitBeforeTax: number[];
}

// =====================================
// MAIN SERVICE
// =====================================

@Injectable({
  providedIn: 'root'
})
export class FinancialIntelligenceService {

  /**
   * Main analysis method - takes parsed financial data and returns comprehensive analysis
   */
  analyzeFinancialData(data: ParsedFinancialData): FinancialAnalysisReport {
    console.log('🧠 Starting financial intelligence analysis...');
    
    // Extract structured metrics
    const metrics = this.extractMetrics(data);
    
    // Calculate ratios
    const calculatedRatios = this.calculateAllRatios(metrics, data);
    
    // Validate data
    const validationIssues = this.validateData(data, metrics);
    const dataQualityScore = this.calculateDataQuality(validationIssues);
    
    // Generate insights
    const insights = this.generateInsights(calculatedRatios, metrics, data);
    
    // Calculate health score
    const healthScore = this.calculateHealthScore(calculatedRatios, insights);
    
    // Generate summary
    const executiveSummary = this.generateExecutiveSummary(healthScore, insights);
    const keyFindings = this.extractKeyFindings(insights, calculatedRatios);
    
    return {
      calculatedRatios,
      validationIssues,
      dataQualityScore,
      insights,
      healthScore,
      executiveSummary,
      keyFindings,
      analysisDate: new Date(),
      periodCovered: this.getPeriodCovered(data.columnHeaders)
    };
  }

  // =====================================
  // METRIC EXTRACTION
  // =====================================

  private extractMetrics(data: ParsedFinancialData): IncomeStatementMetrics {
    const getRowValues = (label: string): number[] => {
      const row = data.incomeStatement.find(r => 
        r.label.toLowerCase().includes(label.toLowerCase())
      );
      return row ? row.values : [];
    };

    return {
      revenue: getRowValues('revenue'),
      costOfSales: getRowValues('cost of sales'),
      grossProfit: getRowValues('gross profit'),
      operatingExpenses: getRowValues('operating expenses'),
      ebitda: getRowValues('ebitda'),
      profitBeforeTax: getRowValues('profit before tax')
    };
  }

  // =====================================
  // RATIO CALCULATIONS
  // =====================================

  private calculateAllRatios(
    metrics: IncomeStatementMetrics, 
    data: ParsedFinancialData
  ): CalculatedRatio[] {
    const ratios: CalculatedRatio[] = [];
    const periods = metrics.revenue.length;

    // Calculate for latest period (index 0 is most recent in your data structure)
    const latestIndex = 0;

    // 1. PROFITABILITY RATIOS
    if (this.hasValidData(metrics.revenue, latestIndex) && 
        this.hasValidData(metrics.grossProfit, latestIndex)) {
      
      const grossMargin = (metrics.grossProfit[latestIndex] / metrics.revenue[latestIndex]) * 100;
      ratios.push({
        name: 'Gross Profit Margin',
        value: grossMargin,
        formula: '(Gross Profit / Revenue) × 100',
        category: 'profitability',
        interpretation: this.interpretGrossMargin(grossMargin)
      });
    }

    if (this.hasValidData(metrics.revenue, latestIndex) && 
        this.hasValidData(metrics.ebitda, latestIndex)) {
      
      const ebitdaMargin = (metrics.ebitda[latestIndex] / metrics.revenue[latestIndex]) * 100;
      ratios.push({
        name: 'EBITDA Margin',
        value: ebitdaMargin,
        formula: '(EBITDA / Revenue) × 100',
        category: 'profitability',
        interpretation: this.interpretEbitdaMargin(ebitdaMargin)
      });
    }

    if (this.hasValidData(metrics.revenue, latestIndex) && 
        this.hasValidData(metrics.profitBeforeTax, latestIndex)) {
      
      const netMargin = (metrics.profitBeforeTax[latestIndex] / metrics.revenue[latestIndex]) * 100;
      ratios.push({
        name: 'Net Profit Margin',
        value: netMargin,
        formula: '(Profit Before Tax / Revenue) × 100',
        category: 'profitability',
        interpretation: this.interpretNetMargin(netMargin)
      });
    }

    // 2. EFFICIENCY RATIOS
    if (this.hasValidData(metrics.revenue, latestIndex) && 
        this.hasValidData(metrics.costOfSales, latestIndex)) {
      
      const costToIncome = (Math.abs(metrics.costOfSales[latestIndex]) / metrics.revenue[latestIndex]) * 100;
      ratios.push({
        name: 'Cost to Income Ratio',
        value: costToIncome,
        formula: '(Cost of Sales / Revenue) × 100',
        category: 'efficiency',
        interpretation: this.interpretCostToIncome(costToIncome)
      });
    }

    // 3. GROWTH RATIOS
    if (periods >= 2 && this.hasValidData(metrics.revenue, 0) && this.hasValidData(metrics.revenue, 1)) {
      const revenueGrowth = ((metrics.revenue[0] - metrics.revenue[1]) / Math.abs(metrics.revenue[1])) * 100;
      ratios.push({
        name: 'Revenue Growth (YoY)',
        value: revenueGrowth,
        formula: '((Current Revenue - Previous Revenue) / Previous Revenue) × 100',
        category: 'growth',
        interpretation: this.interpretRevenueGrowth(revenueGrowth)
      });
    }

    if (periods >= 2 && this.hasValidData(metrics.profitBeforeTax, 0) && this.hasValidData(metrics.profitBeforeTax, 1)) {
      const profitGrowth = ((metrics.profitBeforeTax[0] - metrics.profitBeforeTax[1]) / Math.abs(metrics.profitBeforeTax[1])) * 100;
      ratios.push({
        name: 'Profit Growth (YoY)',
        value: profitGrowth,
        formula: '((Current Profit - Previous Profit) / Previous Profit) × 100',
        category: 'growth',
        interpretation: this.interpretProfitGrowth(profitGrowth)
      });
    }

    // Add any existing ratios from upload
    data.financialRatios.forEach(ratio => {
      if (this.hasValidData(ratio.values, latestIndex)) {
        ratios.push({
          name: ratio.label,
          value: ratio.values[latestIndex],
          formula: 'Provided in upload',
          category: this.categorizRatio(ratio.label),
          interpretation: this.interpretGenericRatio(ratio.label, ratio.values[latestIndex], ratio.type)
        });
      }
    });

    return ratios;
  }

  // =====================================
  // DATA VALIDATION
  // =====================================

  private validateData(
    data: ParsedFinancialData, 
    metrics: IncomeStatementMetrics
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // 1. Check calculation accuracy
    metrics.revenue.forEach((rev, index) => {
      if (this.hasValidData(metrics.revenue, index) && 
          this.hasValidData(metrics.costOfSales, index) && 
          this.hasValidData(metrics.grossProfit, index)) {
        
        const expectedGrossProfit = rev + metrics.costOfSales[index]; // Cost is negative
        const actualGrossProfit = metrics.grossProfit[index];
        const difference = Math.abs(expectedGrossProfit - actualGrossProfit);
        
        if (difference > 1) { // Allow R1 rounding difference
          issues.push({
            severity: 'error',
            field: `Gross Profit (Period ${index + 1})`,
            message: 'Gross Profit calculation mismatch',
            expected: expectedGrossProfit,
            actual: actualGrossProfit,
            autoFixable: true
          });
        }
      }
    });

    // 2. Check for negative values where unexpected
    if (metrics.revenue.some(val => val < 0)) {
      issues.push({
        severity: 'warning',
        field: 'Revenue',
        message: 'Revenue contains negative values',
        autoFixable: false
      });
    }

    // 3. Check for zero values
    if (metrics.revenue.some(val => val === 0)) {
      issues.push({
        severity: 'warning',
        field: 'Revenue',
        message: 'Revenue contains zero values - incomplete data',
        autoFixable: false
      });
    }

    // 4. Check for missing data
    if (metrics.ebitda.length === 0 || metrics.ebitda.every(val => val === 0)) {
      issues.push({
        severity: 'info',
        field: 'EBITDA',
        message: 'EBITDA not provided - some ratios cannot be calculated',
        autoFixable: false
      });
    }

    // 5. Check ratio duplicates
    const ratioLabels = data.financialRatios.map(r => r.label);
    const duplicates = ratioLabels.filter((label, index) => ratioLabels.indexOf(label) !== index);
    
    if (duplicates.length > 0) {
      issues.push({
        severity: 'warning',
        field: 'Financial Ratios',
        message: `Duplicate ratio labels found: ${duplicates.join(', ')}`,
        autoFixable: false
      });
    }

    return issues;
  }

  private calculateDataQuality(issues: ValidationIssue[]): number {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    // Start at 100, deduct points
    let score = 100;
    score -= errorCount * 20; // -20 per error
    score -= warningCount * 10; // -10 per warning
    
    return Math.max(0, score);
  }

  // =====================================
  // INSIGHT GENERATION
  // =====================================

  private generateInsights(
    ratios: CalculatedRatio[],
    metrics: IncomeStatementMetrics,
    data: ParsedFinancialData
  ): FinancialInsight[] {
    const insights: FinancialInsight[] = [];

    // 1. Profitability insights
    const grossMargin = ratios.find(r => r.name === 'Gross Profit Margin');
    if (grossMargin) {
      if (grossMargin.value > 50) {
        insights.push({
          type: 'strength',
          category: 'profitability',
          title: 'Strong Gross Margins',
          description: `Gross profit margin of ${grossMargin.value.toFixed(1)}% indicates healthy pricing power and cost management.`,
          impact: 'high',
          actionable: false
        });
      } else if (grossMargin.value < 20) {
        insights.push({
          type: 'weakness',
          category: 'profitability',
          title: 'Low Gross Margins',
          description: `Gross profit margin of ${grossMargin.value.toFixed(1)}% is below healthy levels.`,
          impact: 'high',
          actionable: true,
          recommendation: 'Review pricing strategy and cost of goods sold. Consider supplier negotiations or price increases.'
        });
      }
    }

    // 2. Growth insights
    const revenueGrowth = ratios.find(r => r.name === 'Revenue Growth (YoY)');
    if (revenueGrowth) {
      if (revenueGrowth.value > 20) {
        insights.push({
          type: 'strength',
          category: 'growth',
          title: 'Exceptional Revenue Growth',
          description: `Year-over-year revenue growth of ${revenueGrowth.value.toFixed(1)}% demonstrates strong market demand.`,
          impact: 'high',
          actionable: false
        });
      } else if (revenueGrowth.value < 0) {
        insights.push({
          type: 'risk',
          category: 'growth',
          title: 'Declining Revenue',
          description: `Revenue decreased by ${Math.abs(revenueGrowth.value).toFixed(1)}% year-over-year.`,
          impact: 'high',
          actionable: true,
          recommendation: 'Investigate market conditions, competitive pressures, and customer retention. Develop growth recovery plan.'
        });
      }
    }

    // 3. Efficiency insights
    const costToIncome = ratios.find(r => r.name === 'Cost to Income Ratio');
    if (costToIncome && costToIncome.value > 70) {
      insights.push({
        type: 'weakness',
        category: 'efficiency',
        title: 'High Cost Structure',
        description: `Cost to income ratio of ${costToIncome.value.toFixed(1)}% indicates tight margins.`,
        impact: 'medium',
        actionable: true,
        recommendation: 'Analyze operating expenses for reduction opportunities. Consider process automation or outsourcing.'
      });
    }

    // 4. Trend insights
    if (metrics.revenue.length >= 3) {
      const isGrowingConsistently = this.isConsistentGrowth(metrics.revenue);
      if (isGrowingConsistently) {
        insights.push({
          type: 'strength',
          category: 'growth',
          title: 'Consistent Revenue Growth',
          description: 'Revenue shows consistent upward trend across multiple periods.',
          impact: 'medium',
          actionable: false
        });
      }
    }

    return insights;
  }

  // =====================================
  // HEALTH SCORE CALCULATION
  // =====================================

  private calculateHealthScore(
    ratios: CalculatedRatio[],
    insights: FinancialInsight[]
  ): FinancialHealthScore {
    // Score each category 0-100
    const profitability = this.scoreProfitability(ratios);
    const liquidity = this.scoreLiquidity(ratios);
    const efficiency = this.scoreEfficiency(ratios);
    const growth = this.scoreGrowth(ratios);

    const overall = (profitability + liquidity + efficiency + growth) / 4;

    return {
      overall: Math.round(overall),
      breakdown: {
        profitability: Math.round(profitability),
        liquidity: Math.round(liquidity),
        efficiency: Math.round(efficiency),
        growth: Math.round(growth)
      },
      grade: this.scoreToGrade(overall)
    };
  }

  private scoreProfitability(ratios: CalculatedRatio[]): number {
    const grossMargin = ratios.find(r => r.name === 'Gross Profit Margin')?.value || 0;
    const netMargin = ratios.find(r => r.name === 'Net Profit Margin')?.value || 0;
    
    // Gross margin: 50%+ = 100, 30% = 70, 10% = 40, <0% = 0
    const grossScore = Math.min(100, Math.max(0, (grossMargin / 50) * 100));
    
    // Net margin: 20%+ = 100, 10% = 70, 5% = 50, <0% = 0
    const netScore = Math.min(100, Math.max(0, (netMargin / 20) * 100));
    
    return (grossScore + netScore) / 2;
  }

  private scoreLiquidity(ratios: CalculatedRatio[]): number {
    const currentRatio = ratios.find(r => r.name.toLowerCase().includes('current ratio'))?.value;
    const quickRatio = ratios.find(r => r.name.toLowerCase().includes('quick ratio') || r.name.toLowerCase().includes('acid test'))?.value;
    
    if (!currentRatio && !quickRatio) return 50; // Neutral score if no data
    
    // Current ratio: 2+ = 100, 1.5 = 80, 1.0 = 50, <1.0 = declining
    const currentScore = currentRatio ? Math.min(100, Math.max(0, (currentRatio / 2) * 100)) : 50;
    
    return currentScore;
  }

  private scoreEfficiency(ratios: CalculatedRatio[]): number {
    const costToIncome = ratios.find(r => r.name === 'Cost to Income Ratio')?.value;
    
    if (!costToIncome) return 50;
    
    // Lower is better: 40% = 100, 60% = 70, 80% = 40, 100%+ = 0
    return Math.min(100, Math.max(0, 100 - costToIncome));
  }

  private scoreGrowth(ratios: CalculatedRatio[]): number {
    const revenueGrowth = ratios.find(r => r.name === 'Revenue Growth (YoY)')?.value;
    
    if (revenueGrowth === undefined) return 50;
    
    // Growth: 30%+ = 100, 15% = 80, 5% = 60, 0% = 50, negative = declining
    if (revenueGrowth >= 30) return 100;
    if (revenueGrowth >= 15) return 80;
    if (revenueGrowth >= 5) return 60;
    if (revenueGrowth >= 0) return 50;
    return Math.max(0, 50 + (revenueGrowth * 2)); // Declining score
  }

  private scoreToGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // =====================================
  // SUMMARY GENERATION
  // =====================================

  private generateExecutiveSummary(
    healthScore: FinancialHealthScore,
    insights: FinancialInsight[]
  ): string {
    const strengths = insights.filter(i => i.type === 'strength').length;
    const weaknesses = insights.filter(i => i.type === 'weakness').length;
    const risks = insights.filter(i => i.type === 'risk').length;

    return `Financial health score: ${healthScore.overall}/100 (Grade ${healthScore.grade}). ` +
           `Analysis identified ${strengths} strength(s), ${weaknesses} weakness(es), and ${risks} risk(s). ` +
           `${healthScore.overall >= 80 ? 'Strong financial position with good funding prospects.' : 
             healthScore.overall >= 60 ? 'Moderate financial health with areas for improvement.' :
             'Financial challenges require attention before pursuing funding.'}`;
  }

  private extractKeyFindings(
    insights: FinancialInsight[],
    ratios: CalculatedRatio[]
  ): string[] {
    const findings: string[] = [];

    // Top 3 high-impact insights
    insights
      .filter(i => i.impact === 'high')
      .slice(0, 3)
      .forEach(insight => {
        findings.push(`${insight.type === 'strength' ? '✓' : '⚠'} ${insight.title}: ${insight.description}`);
      });

    // Add key ratios
    const topRatios = ratios
      .filter(r => ['Gross Profit Margin', 'Revenue Growth (YoY)', 'EBITDA Margin'].includes(r.name))
      .slice(0, 2);
    
    topRatios.forEach(ratio => {
      findings.push(`${ratio.name}: ${ratio.value.toFixed(1)}${ratio.category === 'profitability' || ratio.category === 'growth' ? '%' : ''}`);
    });

    return findings.slice(0, 5); // Max 5 findings
  }

  // =====================================
  // HELPER METHODS
  // =====================================

  private hasValidData(values: number[], index: number): boolean {
    return values && values.length > index && values[index] !== 0 && values[index] !== undefined;
  }

  private isConsistentGrowth(values: number[]): boolean {
    for (let i = 0; i < values.length - 1; i++) {
      if (values[i] <= values[i + 1]) return false;
    }
    return true;
  }

  private getPeriodCovered(headers: string[]): string {
    if (headers.length === 0) return 'Unknown period';
    return `${headers[headers.length - 1]} to ${headers[0]}`;
  }

  private categorizRatio(label: string): CalculatedRatio['category'] {
    const lower = label.toLowerCase();
    if (lower.includes('margin') || lower.includes('roe') || lower.includes('roi')) return 'profitability';
    if (lower.includes('current') || lower.includes('quick') || lower.includes('liquidity')) return 'liquidity';
    if (lower.includes('growth') || lower.includes('increase')) return 'growth';
    if (lower.includes('debt') || lower.includes('equity') || lower.includes('leverage')) return 'leverage';
    return 'efficiency';
  }

  // =====================================
  // INTERPRETATION METHODS
  // =====================================

  private interpretGrossMargin(value: number): string {
    if (value >= 50) return 'Excellent - Strong pricing power and efficient cost management';
    if (value >= 30) return 'Good - Healthy margin supporting operations';
    if (value >= 20) return 'Fair - Room for improvement in cost control or pricing';
    return 'Poor - Margins may be insufficient to cover operating expenses';
  }

  private interpretEbitdaMargin(value: number): string {
    if (value >= 20) return 'Excellent - Strong operational efficiency';
    if (value >= 10) return 'Good - Solid operating performance';
    if (value >= 5) return 'Fair - Adequate but could be improved';
    return 'Poor - Operating efficiency needs attention';
  }

  private interpretNetMargin(value: number): string {
    if (value >= 15) return 'Excellent - Highly profitable operations';
    if (value >= 8) return 'Good - Healthy bottom-line performance';
    if (value >= 3) return 'Fair - Modest profitability';
    if (value >= 0) return 'Marginal - Breaking even or minimal profit';
    return 'Loss - Business is currently unprofitable';
  }

  private interpretCostToIncome(value: number): string {
    if (value <= 50) return 'Excellent - Very efficient cost structure';
    if (value <= 65) return 'Good - Well-managed expenses';
    if (value <= 80) return 'Fair - Costs are manageable but high';
    return 'Poor - High cost burden limiting profitability';
  }

  private interpretRevenueGrowth(value: number): string {
    if (value >= 30) return 'Exceptional - Very strong market expansion';
    if (value >= 15) return 'Strong - Healthy business growth';
    if (value >= 5) return 'Moderate - Steady growth trajectory';
    if (value >= 0) return 'Flat - Minimal or no growth';
    return 'Declining - Revenue contraction needs addressing';
  }

  private interpretProfitGrowth(value: number): string {
    if (value >= 30) return 'Exceptional - Profit scaling faster than revenue';
    if (value >= 15) return 'Strong - Healthy profit expansion';
    if (value >= 0) return 'Positive - Growing profitability';
    return 'Declining - Profit margins under pressure';
  }

  private interpretGenericRatio(name: string, value: number, type: string): string {
    if (type === 'percentage') {
      return `${value.toFixed(1)}% - See specific guidance for ${name}`;
    }
    if (type === 'ratio') {
      return `${value.toFixed(2)}:1 ratio - Industry benchmarks vary`;
    }
    return `Value: ${value.toLocaleString()}`;
  }
}
