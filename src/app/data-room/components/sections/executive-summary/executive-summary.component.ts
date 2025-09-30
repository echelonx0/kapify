// src/app/SMEs/data-room/components/sections/executive-summary/executive-summary.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Building, TrendingUp, DollarSign, BarChart3, PieChart, Calculator, Globe, Star, CheckCircle } from 'lucide-angular';
import { UiCardComponent } from 'src/app/shared/components';

interface CompanyInfo {
  companyName: string;
  registrationNumber: string;
  industry: string;
  yearsInOperation: number;
  description: string;
}

interface FinancialMetrics {
  monthlyRevenue: number;
  annualRevenue: number;
  monthlyExpenses: number;
  profitMargin: number;
  projectedGrowth: number;
}

interface FundingInfo {
  amountRequired: number;
  purposeOfFunding: string;
  useOfFunds: {
    expansion?: number;
    productDevelopment?: number;
    workingCapital?: number;
  };
}

interface MarketIntelligence {
  marketSize: string;
  sectorGrowth: number;
  competitivePosition: string;
  trends: string[];
  valuationRange: string;
  roiProjection: string;
  paybackPeriod: string;
  keyStrengths: string[];
}

@Component({
  selector: 'app-executive-summary',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiCardComponent],
  template: `
    <div class="space-y-6">
      <!-- Company Header -->
      <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white">
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-3xl font-bold mb-2">{{ companyInfo?.companyName }}</h1>
            <p class="text-primary-100 text-lg mb-4">{{ companyInfo?.description }}</p>
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-2">
                <lucide-icon [img]="BuildingIcon" [size]="20" class="text-primary-200" />
                <span class="text-primary-100">{{ companyInfo?.industry }}</span>
              </div>
              <div class="flex items-center gap-2">
                <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-primary-200" />
                <span class="text-primary-100">{{ companyInfo?.yearsInOperation }} years</span>
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
              <div class="text-2xl font-bold">{{ formatCurrency(fundingInfo?.amountRequired || 0) }}</div>
              <div class="text-primary-100 text-sm">Funding Sought</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Metrics Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Annual Revenue Card -->
        <ui-card class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="DollarSignIcon" [size]="24" class="text-green-600" />
            </div>
            <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-green-500" />
          </div>
          <div class="space-y-1">
            <div class="text-2xl font-bold text-gray-900">
              {{ formatCurrency(financialMetrics?.annualRevenue || 0) }}
            </div>
            <div class="text-gray-500 text-sm">Annual Revenue</div>
            <div class="text-green-600 text-sm font-medium">
              +{{ financialMetrics?.projectedGrowth || 0 }}% projected growth
            </div>
          </div>
        </ui-card>

        <!-- Profit Margin Card -->
        <ui-card class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="BarChart3Icon" [size]="24" class="text-primary-600" />
            </div>
            <lucide-icon [img]="PieChartIcon" [size]="20" class="text-primary-500" />
          </div>
          <div class="space-y-1">
            <div class="text-2xl font-bold text-gray-900">{{ financialMetrics?.profitMargin || 0 }}%</div>
            <div class="text-gray-500 text-sm">Profit Margin</div>
            <div class="text-primary-600 text-sm font-medium">Industry leading</div>
          </div>
        </ui-card>

        <!-- Market Growth Card -->
        <ui-card class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="GlobeIcon" [size]="24" class="text-purple-600" />
            </div>
            <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-purple-500" />
          </div>
          <div class="space-y-1">
            <div class="text-2xl font-bold text-gray-900">{{ marketIntelligence?.sectorGrowth || 0 }}%</div>
            <div class="text-gray-500 text-sm">Market Growth</div>
            <div class="text-purple-600 text-sm font-medium">YoY expansion</div>
          </div>
        </ui-card>

        <!-- ROI Projection Card -->
        <ui-card class="p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="CalculatorIcon" [size]="24" class="text-orange-600" />
            </div>
            <lucide-icon [img]="StarIcon" [size]="20" class="text-orange-500" />
          </div>
          <div class="space-y-1">
            <div class="text-2xl font-bold text-gray-900">{{ marketIntelligence?.roiProjection || 'N/A' }}</div>
            <div class="text-gray-500 text-sm">Projected ROI</div>
            <div class="text-orange-600 text-sm font-medium">5-year horizon</div>
          </div>
        </ui-card>
      </div>

      <!-- AI-Enhanced Market Intelligence -->
      @if (marketIntelligence) {
        <div class="bg-gradient-to-br from-purple-50 to-primary-50 rounded-xl p-6 border border-purple-200">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="StarIcon" [size]="20" class="text-white" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900">AI Market Intelligence</h3>
            <span class="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">Real-time</span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Market Position</h4>
              <p class="text-gray-600 text-sm mb-3">{{ marketIntelligence.competitivePosition }}</p>
              <div class="text-sm text-purple-600 font-medium">{{ marketIntelligence.marketSize }}</div>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Investment Outlook</h4>
              <p class="text-gray-600 text-sm mb-3">{{ marketIntelligence.valuationRange }}</p>
              <div class="text-sm text-purple-600 font-medium">{{ marketIntelligence.paybackPeriod }}</div>
            </div>
            
            <div>
              <h4 class="font-medium text-gray-900 mb-2">Key Trends</h4>
              <ul class="space-y-1">
                @for (trend of marketIntelligence.trends.slice(0, 2); track $index) {
                  <li class="text-sm text-gray-600 flex items-start gap-2">
                    <div class="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2"></div>
                    {{ trend }}
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>
      }

      <!-- Investment Thesis -->
      <ui-card class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Investment Thesis</h3>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-green-500" />
              Key Strengths
            </h4>
            @if (marketIntelligence?.keyStrengths?.length) {
              <ul class="space-y-2">
                @for (strength of marketIntelligence.keyStrengths; track $index) {
                  <li class="text-gray-600 text-sm flex items-start gap-3">
                    <div class="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                    {{ strength }}
                  </li>
                }
              </ul>
            } @else {
              <p class="text-gray-500 text-sm italic">Enhance with AI to see strengths</p>
            }
          </div>
          
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Use of Funds</h4>
            @if (fundingInfo?.useOfFunds) {
              <div class="space-y-3">
                @if (fundingInfo.useOfFunds.expansion) {
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm text-gray-600">Market Expansion</span>
                      <span class="text-sm font-medium">{{ fundingInfo.useOfFunds.expansion }}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div class="bg-primary-600 h-2 rounded-full" [style.width.%]="fundingInfo.useOfFunds.expansion"></div>
                    </div>
                  </div>
                }
                
                @if (fundingInfo.useOfFunds.productDevelopment) {
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm text-gray-600">Product Development</span>
                      <span class="text-sm font-medium">{{ fundingInfo.useOfFunds.productDevelopment }}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div class="bg-green-600 h-2 rounded-full" [style.width.%]="fundingInfo.useOfFunds.productDevelopment"></div>
                    </div>
                  </div>
                }
                
                @if (fundingInfo.useOfFunds.workingCapital) {
                  <div>
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm text-gray-600">Working Capital</span>
                      <span class="text-sm font-medium">{{ fundingInfo.useOfFunds.workingCapital }}%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div class="bg-purple-600 h-2 rounded-full" [style.width.%]="fundingInfo.useOfFunds.workingCapital"></div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-gray-500 text-sm italic">Breakdown not available</p>
            }
          </div>
        </div>
      </ui-card>
    </div>
  `
})
export class ExecutiveSummaryComponent {
  @Input() companyInfo: CompanyInfo | null = null;
  @Input() financialMetrics: FinancialMetrics | null = null;
  @Input() fundingInfo: FundingInfo | null = null;
  @Input() marketIntelligence: MarketIntelligence | null = null;

  BuildingIcon = Building;
  TrendingUpIcon = TrendingUp;
  DollarSignIcon = DollarSign;
  BarChart3Icon = BarChart3;
  PieChartIcon = PieChart;
  CalculatorIcon = Calculator;
  GlobeIcon = Globe;
  StarIcon = Star;
  CheckCircleIcon = CheckCircle;

  formatCurrency(amount: number): string {
    if (amount >= 1000000) return `R${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `R${(amount / 1000).toFixed(0)}K`;
    return `R${amount}`;
  }
}