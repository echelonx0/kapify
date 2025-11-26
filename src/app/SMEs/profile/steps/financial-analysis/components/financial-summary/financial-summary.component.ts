import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  AlertCircle,
} from 'lucide-angular';

@Component({
  selector: 'app-financial-summary',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bg-slate-50 rounded-2xl p-4 lg:p-6">
      <!-- Header -->
      <div class="mb-6">
        <h3 class="text-lg font-bold text-slate-900">Financial Summary</h3>
        <p class="text-sm text-slate-600 mt-1">
          The financial health score summarizes the completeness of your
          financial data. It is based on the number of income statement items
          and financial ratios you have provided. A higher score indicates a
          more comprehensive financial profile. It is not a professional
          assessment of financial performance.
        </p>
      </div>

      <!-- Main Grid: Health Score + Metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Left Column: Health Score Card (spans 1 col on desktop) -->
        <div
          class="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-1"
        >
          <div class="flex items-start justify-between mb-4">
            <div>
              <p
                class="text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                Health Score
              </p>
              <p class="text-3xl font-bold text-slate-900 mt-1">
                {{ completionPercentage() }}%
              </p>
            </div>
            <div
              [ngClass]="getHealthScoreIconClass()"
              class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            >
              <lucide-icon [name]="BarChartIcon" [size]="20"></lucide-icon>
            </div>
          </div>

          <!-- Progress Bar: Teal Gradient -->
          <div
            class="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3"
          >
            <div
              class="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-700 ease-out"
              [style.width.%]="completionPercentage()"
            ></div>
          </div>

          <p class="text-xs text-slate-600">{{ getHealthScoreLabel() }}</p>
        </div>

        <!-- Right Columns: Three Metric Cards -->
        <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Metric 1: Data Completion -->
          <div
            class="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <p
                  class="text-xs font-semibold text-slate-500 uppercase tracking-wide"
                >
                  Completion
                </p>
                <p class="text-2xl font-bold text-slate-900 mt-1">
                  {{ completionPercentage() }}%
                </p>
                <p class="text-xs text-slate-600 mt-2">
                  {{ getCompletionStatus() }}
                </p>
              </div>
              <div
                class="bg-teal-100 text-teal-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              >
                <lucide-icon [name]="TrendingUpIcon" [size]="20"></lucide-icon>
              </div>
            </div>
          </div>

          <!-- Metric 2: Income Items -->
          <div
            class="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <p
                  class="text-xs font-semibold text-slate-500 uppercase tracking-wide"
                >
                  Income Items
                </p>
                <p class="text-2xl font-bold text-slate-900 mt-1">
                  {{ incomeStatementCount() }}
                </p>
                <p class="text-xs text-slate-600 mt-2">
                  Financial entries tracked
                </p>
              </div>
              <div
                class="bg-blue-100 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              >
                <lucide-icon [name]="DollarSignIcon" [size]="20"></lucide-icon>
              </div>
            </div>
          </div>

          <!-- Metric 3: Financial Ratios -->
          <div
            class="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:border-slate-300 transition-all duration-200 sm:col-span-2"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <p
                  class="text-xs font-semibold text-slate-500 uppercase tracking-wide"
                >
                  Financial Ratios
                </p>
                <p class="text-2xl font-bold text-slate-900 mt-1">
                  {{ financialRatiosCount() }}
                </p>
                <p class="text-xs text-slate-600 mt-2">
                  Key performance indicators
                </p>
              </div>
              <div
                class="bg-slate-100 text-slate-600 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              >
                <lucide-icon [name]="PieChartIcon" [size]="20"></lucide-icon>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Overview Section -->
      <div class="mt-6 bg-white rounded-2xl border border-slate-200 p-6">
        <h4 class="text-sm font-semibold text-slate-900 mb-4">Data Overview</h4>

        <div class="space-y-4">
          <!-- Income Statement Progress -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-slate-600"
                >Income Statement</span
              >
              <span class="text-xs font-bold text-slate-900">{{
                incomeStatementCount()
              }}</span>
            </div>
            <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500"
                [style.width.%]="getIncomeBarWidth()"
              ></div>
            </div>
          </div>

          <!-- Financial Ratios Progress -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-slate-600"
                >Financial Ratios</span
              >
              <span class="text-xs font-bold text-slate-900">{{
                financialRatiosCount()
              }}</span>
            </div>
            <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500"
                [style.width.%]="getRatiosBarWidth()"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Validation Warning (if needed) -->
      @if (!isValidTemplate()) {
      <div
        class="mt-6 bg-amber-50 rounded-xl border border-amber-200/50 p-4 flex items-start gap-3"
      >
        <div
          class="bg-amber-100 text-amber-600 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        >
          <lucide-icon [name]="AlertCircleIcon" [size]="18"></lucide-icon>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-semibold text-amber-900">
            Template Structure Issue
          </p>
          <p class="text-xs text-amber-700 mt-0.5">
            The uploaded template doesn't match the expected format. Some
            features may not work correctly.
          </p>
        </div>
      </div>
      }
    </div>
  `,
})
export class FinancialSummaryComponent {
  // Inputs
  completionPercentage = input<number>(0);
  incomeStatementCount = input<number>(0);
  financialRatiosCount = input<number>(0);
  isValidTemplate = input<boolean>(true);

  // Icons
  TrendingUpIcon = TrendingUp;
  TrendingDownIcon = TrendingDown;
  DollarSignIcon = DollarSign;
  BarChartIcon = BarChart3;
  PieChartIcon = PieChart;
  AlertCircleIcon = AlertCircle;

  // Computed bar widths (scaled for meaningful visualization)
  getIncomeBarWidth = computed(() => {
    const count = this.incomeStatementCount();
    const maxExpected = 15;
    return Math.min((count / maxExpected) * 100, 100);
  });

  getRatiosBarWidth = computed(() => {
    const count = this.financialRatiosCount();
    const maxExpected = 12;
    return Math.min((count / maxExpected) * 100, 100);
  });

  // Health score icon styling
  getHealthScoreIconClass(): string {
    const score = this.completionPercentage();
    if (score >= 80) return 'bg-green-100 text-green-600';
    if (score >= 60) return 'bg-teal-100 text-teal-600';
    if (score >= 40) return 'bg-amber-100 text-amber-600';
    return 'bg-red-100 text-red-600';
  }

  // Health score label
  getHealthScoreLabel(): string {
    const score = this.completionPercentage();
    if (score >= 80) return 'Excellent — Ready for institutional review';
    if (score >= 60) return 'Good — Most data captured';
    if (score >= 40) return 'Fair — Continue adding data';
    return 'Needs attention — Add more financial information';
  }

  // Completion status message
  getCompletionStatus(): string {
    const score = this.completionPercentage();
    if (score >= 80) return 'Institutional ready';
    if (score >= 60) return 'Nearly complete';
    if (score >= 40) return 'In progress';
    return 'Just started';
  }
}
