// src/app/shared/components/financial-analysis-modal/financial-analysis-modal.component.ts
import { Component, signal, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  X,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Activity,
  DollarSign,
  BarChart3,
  LineChart as LineChartIcon,
} from 'lucide-angular';
import {
  FinancialIntelligenceService,
  FinancialAnalysisReport,
  CalculatedRatio,
  ValidationIssue,
  FinancialInsight,
  FinancialHealthScore,
} from '../../services/financial-intelligence.service';
import { ParsedFinancialData } from 'src/app/SMEs/SME-Profiles/steps/financial-analysis/utils/excel-parser.service';

@Component({
  selector: 'app-financial-analysis-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto" [class.hidden]="!isOpen()">
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        (click)="close()"
      ></div>

      <!-- Modal -->
      <div class="flex min-h-screen items-center justify-center p-4">
        <div
          class="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between p-6 border-b border-gray-200"
          >
            <div class="flex items-center space-x-3">
              <div
                class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center"
              >
                <lucide-icon
                  [name]="ActivityIcon"
                  [size]="24"
                  class="text-primary-600"
                />
              </div>
              <div>
                <h2 class="text-2xl font-bold text-gray-900">
                  Financial Intelligence Analysis
                </h2>
                <p class="text-sm text-gray-600">
                  Automated insights from your financial data
                </p>
              </div>
            </div>
            <button
              (click)="close()"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <lucide-icon [name]="XIcon" [size]="24" class="text-gray-500" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-6">
            @if (analysisReport()) {
            <!-- Health Score Banner -->
            <div
              class="mb-6 p-6 rounded-xl"
              [ngClass]="getHealthScoreColor(analysisReport()!.healthScore)"
            >
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">
                    Financial Health Score
                  </h3>
                  <p class="text-sm text-gray-600">
                    {{ analysisReport()!.periodCovered }}
                  </p>
                </div>
                <div class="text-right">
                  <div class="text-5xl font-bold text-gray-900">
                    {{ analysisReport()!.healthScore.overall }}
                    <span class="text-2xl text-gray-600">/100</span>
                  </div>
                  <div
                    class="text-xl font-semibold mt-1"
                    [ngClass]="
                      getGradeColor(analysisReport()!.healthScore.grade)
                    "
                  >
                    Grade {{ analysisReport()!.healthScore.grade }}
                  </div>
                </div>
              </div>

              <!-- Score Breakdown -->
              <div class="grid grid-cols-4 gap-4 mt-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900">
                    {{ analysisReport()!.healthScore.breakdown.profitability }}
                  </div>
                  <div class="text-xs text-gray-600 mt-1">Profitability</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900">
                    {{ analysisReport()!.healthScore.breakdown.liquidity }}
                  </div>
                  <div class="text-xs text-gray-600 mt-1">Liquidity</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900">
                    {{ analysisReport()!.healthScore.breakdown.efficiency }}
                  </div>
                  <div class="text-xs text-gray-600 mt-1">Efficiency</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900">
                    {{ analysisReport()!.healthScore.breakdown.growth }}
                  </div>
                  <div class="text-xs text-gray-600 mt-1">Growth</div>
                </div>
              </div>
            </div>

            <!-- Executive Summary -->
            <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 class="font-semibold text-blue-900 mb-2">
                Executive Summary
              </h4>
              <p class="text-sm text-blue-800">
                {{ analysisReport()!.executiveSummary }}
              </p>
            </div>

            <!-- Key Findings -->
            @if (analysisReport()!.keyFindings.length > 0) {
            <div class="mb-6">
              <h4 class="font-semibold text-gray-900 mb-3">Key Findings</h4>
              <div class="space-y-2">
                @for (finding of analysisReport()!.keyFindings; track finding) {
                <div
                  class="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg"
                >
                  <div class="text-primary-600 mt-0.5">•</div>
                  <p class="text-sm text-gray-700 flex-1">{{ finding }}</p>
                </div>
                }
              </div>
            </div>
            }

            <!-- Validation Issues -->
            @if (analysisReport()!.validationIssues.length > 0) {
            <div class="mb-6">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-900">Data Quality</h4>
                <span
                  class="px-3 py-1 rounded-full text-sm font-semibold"
                  [ngClass]="
                    getQualityBadgeColor(analysisReport()!.dataQualityScore)
                  "
                >
                  {{ analysisReport()!.dataQualityScore }}% Quality Score
                </span>
              </div>
              <div class="space-y-2">
                @for (issue of analysisReport()!.validationIssues; track
                issue.field) {
                <div
                  class="flex items-start space-x-3 p-3 rounded-lg"
                  [ngClass]="getIssueBgColor(issue.severity)"
                >
                  <lucide-icon
                    [name]="AlertCircleIcon"
                    [size]="20"
                    [class]="getIssueIconColor(issue.severity)"
                  />
                  <div class="flex-1">
                    <p
                      class="text-sm font-medium"
                      [class]="getIssueTextColor(issue.severity)"
                    >
                      {{ issue.field }}
                    </p>
                    <p
                      class="text-sm mt-1"
                      [class]="getIssueTextColor(issue.severity)"
                    >
                      {{ issue.message }}
                    </p>
                    @if (issue.expected !== undefined && issue.actual !==
                    undefined) {
                    <div
                      class="mt-1 text-xs"
                      [class]="getIssueTextColor(issue.severity)"
                    >
                      Expected: {{ formatNumber(issue.expected) }} | Actual:
                      {{ formatNumber(issue.actual) }}
                    </div>
                    }
                  </div>
                  @if (issue.autoFixable) {
                  <button
                    class="px-3 py-1 bg-white text-sm rounded hover:bg-gray-50"
                  >
                    Fix
                  </button>
                  }
                </div>
                }
              </div>
            </div>
            }

            <!-- Tabs -->
            <div class="mb-6 border-b border-gray-200">
              <nav class="flex space-x-8">
                <button
                  (click)="activeTab.set('insights')"
                  class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
                  [class]="
                    activeTab() === 'insights'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  "
                >
                  <div class="flex items-center space-x-2">
                    <lucide-icon [name]="LightbulbIcon" [size]="16" />
                    <span>Insights</span>
                  </div>
                </button>
                <button
                  (click)="activeTab.set('ratios')"
                  class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
                  [class]="
                    activeTab() === 'ratios'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  "
                >
                  <div class="flex items-center space-x-2">
                    <lucide-icon [name]="BarChart3Icon" [size]="16" />
                    <span>Calculated Ratios</span>
                  </div>
                </button>
              </nav>
            </div>

            <!-- Tab Content -->
            <div>
              @if (activeTab() === 'insights') {
              <!-- Insights Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (insight of analysisReport()!.insights; track
                insight.title) {
                <div
                  class="p-4 border rounded-lg"
                  [ngClass]="getInsightBorderColor(insight.type)"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex items-center space-x-2">
                      <lucide-icon
                        [name]="getInsightIcon(insight.type)"
                        [size]="20"
                        [class]="getInsightIconColor(insight.type)"
                      />
                      <h5 class="font-semibold text-gray-900">
                        {{ insight.title }}
                      </h5>
                    </div>
                    <span
                      class="px-2 py-1 rounded text-xs font-semibold"
                      [ngClass]="getImpactBadgeColor(insight.impact)"
                    >
                      {{ insight.impact }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">
                    {{ insight.description }}
                  </p>
                  @if (insight.recommendation) {
                  <div
                    class="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800"
                  >
                    <span class="font-medium">Recommendation:</span>
                    {{ insight.recommendation }}
                  </div>
                  }
                </div>
                }
              </div>

              @if (analysisReport()!.insights.length === 0) {
              <div class="text-center py-12">
                <lucide-icon
                  [name]="LightbulbIcon"
                  [size]="48"
                  class="mx-auto text-gray-300 mb-4"
                />
                <p class="text-gray-500">No specific insights generated</p>
              </div>
              } } @if (activeTab() === 'ratios') {
              <!-- Ratios by Category -->
              @for (category of getUniqueCategories(); track category) {
              <div class="mb-6">
                <h4 class="font-semibold text-gray-900 mb-3 capitalize">
                  {{ category }}
                </h4>
                <div class="space-y-3">
                  @for (ratio of getRatiosByCategory(category); track
                  ratio.name) {
                  <div class="p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-start justify-between mb-2">
                      <div class="flex-1">
                        <h5 class="font-medium text-gray-900">
                          {{ ratio.name }}
                        </h5>
                        <p class="text-xs text-gray-500 mt-1">
                          {{ ratio.formula }}
                        </p>
                      </div>
                      <div class="text-right ml-4">
                        <div class="text-2xl font-bold text-primary-600">
                          {{ formatRatioValue(ratio) }}
                        </div>
                      </div>
                    </div>
                    <p class="text-sm text-gray-600 mt-2">
                      {{ ratio.interpretation }}
                    </p>
                  </div>
                  }
                </div>
              </div>
              } @if (analysisReport()!.calculatedRatios.length === 0) {
              <div class="text-center py-12">
                <lucide-icon
                  [name]="BarChart3Icon"
                  [size]="48"
                  class="mx-auto text-gray-300 mb-4"
                />
                <p class="text-gray-500">
                  No ratios could be calculated from available data
                </p>
              </div>
              } }
            </div>
            } @else {
            <!-- Loading or No Data -->
            <div class="text-center py-12">
              <lucide-icon
                [name]="ActivityIcon"
                [size]="48"
                class="mx-auto text-gray-300 mb-4"
              />
              <p class="text-gray-500">
                No financial data available for analysis
              </p>
            </div>
            }
          </div>

          <!-- Footer -->
          <div class="border-t border-gray-200 p-4 bg-gray-50">
            <div class="flex items-center justify-between">
              <p class="text-xs text-gray-500">
                Analysis generated on
                {{ analysisReport()?.analysisDate | date : 'medium' }}
              </p>
              <div class="flex space-x-3">
                <button
                  (click)="exportReport()"
                  class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Export Report
                </button>
                <button
                  (click)="close()"
                  class="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class FinancialAnalysisModalComponent {
  private intelligenceService = inject(FinancialIntelligenceService);

  // Inputs
  financialData = input.required<ParsedFinancialData>();
  isOpen = input<boolean>(false);

  // Outputs
  closed = output<void>();

  // Icons
  XIcon = X;
  ActivityIcon = Activity;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  LightbulbIcon = Lightbulb;
  TrendingUpIcon = TrendingUp;
  TrendingDownIcon = TrendingDown;
  DollarSignIcon = DollarSign;
  BarChart3Icon = BarChart3;
  LineChartIcon = LineChartIcon;

  // State
  analysisReport = signal<FinancialAnalysisReport | null>(null);
  activeTab = signal<'insights' | 'ratios'>('insights');

  ngOnInit() {
    this.runAnalysis();
  }

  ngOnChanges() {
    if (this.isOpen()) {
      this.runAnalysis();
    }
  }

  private runAnalysis() {
    const data = this.financialData();
    if (data) {
      const report = this.intelligenceService.analyzeFinancialData(data);
      this.analysisReport.set(report);
    }
  }

  close() {
    this.closed.emit();
  }

  exportReport() {
    // TODO: Implement export functionality
    console.log('Export report:', this.analysisReport());
  }

  // Styling helpers
  getHealthScoreColor(score: FinancialHealthScore): string {
    if (score.overall >= 80) return 'bg-green-50 border border-green-200';
    if (score.overall >= 60) return 'bg-blue-50 border border-blue-200';
    if (score.overall >= 40) return 'bg-orange-50 border border-orange-200';
    return 'bg-red-50 border border-red-200';
  }

  getGradeColor(grade: string): string {
    const colors: Record<string, string> = {
      A: 'text-green-600',
      B: 'text-blue-600',
      C: 'text-orange-600',
      D: 'text-red-600',
      F: 'text-red-700',
    };
    return colors[grade] || 'text-gray-600';
  }

  getQualityBadgeColor(score: number): string {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-blue-100 text-blue-800';
    return 'bg-orange-100 text-orange-800';
  }

  getIssueBgColor(severity: string): string {
    const colors: Record<string, string> = {
      error: 'bg-red-50 border border-red-200',
      warning: 'bg-orange-50 border border-orange-200',
      info: 'bg-blue-50 border border-blue-200',
    };
    return colors[severity] || 'bg-gray-50';
  }

  getIssueIconColor(severity: string): string {
    const colors: Record<string, string> = {
      error: 'text-red-600',
      warning: 'text-orange-600',
      info: 'text-blue-600',
    };
    return colors[severity] || 'text-gray-600';
  }

  getIssueTextColor(severity: string): string {
    const colors: Record<string, string> = {
      error: 'text-red-900',
      warning: 'text-orange-900',
      info: 'text-blue-900',
    };
    return colors[severity] || 'text-gray-900';
  }

  getInsightBorderColor(type: string): string {
    const colors: Record<string, string> = {
      strength: 'border-green-200 bg-green-50',
      weakness: 'border-orange-200 bg-orange-50',
      opportunity: 'border-blue-200 bg-blue-50',
      risk: 'border-red-200 bg-red-50',
    };
    return colors[type] || 'border-gray-200 bg-gray-50';
  }

  getInsightIcon(type: string): any {
    const icons: Record<string, any> = {
      strength: this.TrendingUpIcon,
      weakness: this.TrendingDownIcon,
      opportunity: this.LightbulbIcon,
      risk: this.AlertCircleIcon,
    };
    return icons[type] || this.ActivityIcon;
  }

  getInsightIconColor(type: string): string {
    const colors: Record<string, string> = {
      strength: 'text-green-600',
      weakness: 'text-orange-600',
      opportunity: 'text-blue-600',
      risk: 'text-red-600',
    };
    return colors[type] || 'text-gray-600';
  }

  getImpactBadgeColor(impact: string): string {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-orange-100 text-orange-800',
      low: 'bg-blue-100 text-blue-800',
    };
    return colors[impact] || 'bg-gray-100 text-gray-800';
  }

  getUniqueCategories(): string[] {
    const report = this.analysisReport();
    if (!report) return [];

    const categories = new Set(report.calculatedRatios.map((r) => r.category));
    return Array.from(categories);
  }

  getRatiosByCategory(category: string): CalculatedRatio[] {
    const report = this.analysisReport();
    if (!report) return [];

    return report.calculatedRatios.filter((r) => r.category === category);
  }

  formatRatioValue(ratio: CalculatedRatio): string {
    if (
      ratio.category === 'profitability' ||
      ratio.category === 'growth' ||
      ratio.category === 'efficiency'
    ) {
      return `${ratio.value.toFixed(1)}%`;
    }
    return ratio.value.toFixed(2);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
