//src/app/SMEs/data-room/components/sections/financial-dashboard/financial-dashboard.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, BarChart3, PieChart, Calculator, Download } from 'lucide-angular';
import { UiCardComponent, UiButtonComponent } from 'src/app/shared/components';

interface FinancialMetrics {
  monthlyRevenue: number;
  annualRevenue: number;
  monthlyExpenses: number;
  profitMargin: number;
  projectedGrowth: number;
  ebitda?: number;
  currentAssets?: number;
}

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiCardComponent,
    UiButtonComponent
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">Financial Dashboard</h2>
        <ui-button variant="primary">
          <lucide-icon [img]="DownloadIcon" [size]="16" class="mr-2" />
          Export Report
        </ui-button>
      </div>

      @if (financialMetrics) {
        <!-- Financial Metrics Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Monthly Revenue -->
          <ui-card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <lucide-icon [img]="TrendingUpIcon" [size]="24" class="text-green-600" />
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-2xl font-bold text-gray-900">{{ formatCurrency(financialMetrics.monthlyRevenue) }}</div>
              <div class="text-gray-500 text-sm">Monthly Revenue</div>
              <div class="text-green-600 text-sm font-medium">+12% vs last month</div>
            </div>
          </ui-card>

          <!-- Monthly Expenses -->
          <ui-card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <lucide-icon [img]="BarChart3Icon" [size]="24" class="text-red-600" />
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-2xl font-bold text-gray-900">{{ formatCurrency(financialMetrics.monthlyExpenses) }}</div>
              <div class="text-gray-500 text-sm">Monthly Expenses</div>
              <div class="text-red-600 text-sm font-medium">+5% vs last month</div>
            </div>
          </ui-card>

          <!-- Monthly Profit -->
          <ui-card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <lucide-icon [img]="PieChartIcon" [size]="24" class="text-primary-600" />
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-2xl font-bold text-gray-900">{{ formatCurrency(getMonthlyProfit()) }}</div>
              <div class="text-gray-500 text-sm">Monthly Profit</div>
              <div class="text-primary-600 text-sm font-medium">{{ financialMetrics.profitMargin }}% margin</div>
            </div>
          </ui-card>

          <!-- Growth Rate -->
          <ui-card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <lucide-icon [img]="CalculatorIcon" [size]="24" class="text-purple-600" />
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-2xl font-bold text-gray-900">{{ financialMetrics.projectedGrowth }}%</div>
              <div class="text-gray-500 text-sm">YoY Growth Rate</div>
              <div class="text-purple-600 text-sm font-medium">Above industry avg</div>
            </div>
          </ui-card>
        </div>

        <!-- Financial Projections Table -->
        <ui-card class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">3-Year Financial Projections</h3>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 font-medium text-gray-900">Metric</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-900">Year 1</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-900">Year 2</th>
                  <th class="text-right py-3 px-4 font-medium text-gray-900">Year 3</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr>
                  <td class="py-3 px-4 text-gray-900">Revenue</td>
                  <td class="py-3 px-4 text-right text-gray-600">{{ formatCurrency(getProjectedRevenue(1)) }}</td>
                  <td class="py-3 px-4 text-right text-gray-600">{{ formatCurrency(getProjectedRevenue(2)) }}</td>
                  <td class="py-3 px-4 text-right text-gray-600">{{ formatCurrency(getProjectedRevenue(3)) }}</td>
                </tr>
                <tr>
                  <td class="py-3 px-4 text-gray-900">Gross Profit</td>
                  <td class="py-3 px-4 text-right text-gray-600">{{ formatCurrency(getProjectedGrossProfit(1)) }}</td>
                  <td class="py-3 px-4 text-right text-gray-600">{{ formatCurrency(getProjectedGrossProfit(2)) }}</td>
                  <td class="py-3 px-4 text-right text-gray-600">{{ formatCurrency(getProjectedGrossProfit(3)) }}</td>
                </tr>
                <tr>
                  <td class="py-3 px-4 text-gray-900">EBITDA</td>
                  <td class="py-3 px-4 text-right text-gray-600">{{ formatCurrency(getProjectedEBITDA(1)) }}</td>
                  <td class="py-3 px-4 text-right text-gray-600">{{ formatCurrency(getProjectedEBITDA(2)) }}</td>
                  <td class="py-3 px-4 text-right text-gray-600">{{ formatCurrency(getProjectedEBITDA(3)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </ui-card>

        <!-- Key Financial Ratios -->
        <ui-card class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Key Financial Ratios</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">Profit Margin</span>
                <span class="text-lg font-bold text-gray-900">{{ financialMetrics.profitMargin }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-green-600 h-2 rounded-full transition-all" 
                  [style.width.%]="financialMetrics.profitMargin"
                ></div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">Growth Rate</span>
                <span class="text-lg font-bold text-gray-900">{{ financialMetrics.projectedGrowth }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-primary-600 h-2 rounded-full transition-all" 
                  [style.width.%]="Math.min(financialMetrics.projectedGrowth, 100)"
                ></div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-gray-600">Expense Ratio</span>
                <span class="text-lg font-bold text-gray-900">{{ getExpenseRatio() }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div 
                  class="bg-orange-600 h-2 rounded-full transition-all" 
                  [style.width.%]="getExpenseRatio()"
                ></div>
              </div>
            </div>
          </div>
        </ui-card>
      } @else {
        <!-- Empty State -->
        <div class="text-center py-12">
          <lucide-icon [img]="BarChart3Icon" [size]="48" class="text-gray-400 mx-auto mb-4" />
          <p class="text-gray-600">Financial data not available</p>
          <p class="text-sm text-gray-400">Complete your financial profile to see dashboard</p>
        </div>
      }
    </div>
  `
})
export class FinancialDashboardComponent {
  @Input() financialMetrics: FinancialMetrics | null = null;

  // Icons
  TrendingUpIcon = TrendingUp;
  BarChart3Icon = BarChart3;
  PieChartIcon = PieChart;
  CalculatorIcon = Calculator;
  DownloadIcon = Download;

  Math = Math;

  formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return `R${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `R${(amount / 1000).toFixed(0)}K`;
    }
    return `R${amount}`;
  }

  getMonthlyProfit(): number {
    if (!this.financialMetrics) return 0;
    return this.financialMetrics.monthlyRevenue - this.financialMetrics.monthlyExpenses;
  }

  getProjectedRevenue(year: number): number {
    if (!this.financialMetrics) return 0;
    const multiplier = year === 1 ? 1.2 : year === 2 ? 1.35 : 1.8;
    return this.financialMetrics.annualRevenue * multiplier;
  }

  getProjectedGrossProfit(year: number): number {
    if (!this.financialMetrics) return 0;
    const multiplier = year === 1 ? 0.7 : year === 2 ? 0.75 : 0.8;
    return this.financialMetrics.annualRevenue * multiplier;
  }

  getProjectedEBITDA(year: number): number {
    if (!this.financialMetrics) return 0;
    const multiplier = year === 1 ? 0.2 : year === 2 ? 0.25 : 0.3;
    return this.financialMetrics.annualRevenue * multiplier;
  }

  getExpenseRatio(): number {
    if (!this.financialMetrics) return 0;
    return Math.round((this.financialMetrics.monthlyExpenses / this.financialMetrics.monthlyRevenue) * 100);
  }
}