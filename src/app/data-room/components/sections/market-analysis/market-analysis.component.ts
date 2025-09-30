// src/app/SMEs/data-room/components/sections/market-analysis/market-analysis.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, TrendingUp, Sparkles, CheckCircle, FileText, Shield } from 'lucide-angular';
import { UiCardComponent, UiButtonComponent } from 'src/app/shared/components';

interface MarketIntelligence {
  marketSize: string;
  sectorGrowth: number;
  competitivePosition: string;
  trends: string[];
  valuationRange: string;
  roiProjection: string;
  paybackPeriod: string;
}

@Component({
  selector: 'app-market-analysis',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiCardComponent, UiButtonComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">Market Analysis</h2>
        @if (marketIntelligence()) {
          <span class="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
            AI-Enhanced Insights
          </span>
        }
      </div>

      @if (marketIntelligence()) {
        <ui-card class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Market Overview</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center">
              <div class="text-3xl font-bold text-primary-600 mb-2">{{ marketIntelligence()!.marketSize }}</div>
              <div class="text-gray-600">Total Addressable Market</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-green-600 mb-2">{{ marketIntelligence()!.sectorGrowth }}%</div>
              <div class="text-gray-600">Annual Growth Rate</div>
            </div>
            <div class="text-center">
              <div class="text-3xl font-bold text-purple-600 mb-2">{{ marketIntelligence()!.competitivePosition }}</div>
              <div class="text-gray-600">Market Position</div>
            </div>
          </div>
        </ui-card>

        <ui-card class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Key Market Trends</h3>
          <div class="space-y-4">
            @for (trend of marketIntelligence()!.trends; track $index) {
              <div class="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div class="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <lucide-icon [img]="TrendingUpIcon" [size]="16" class="text-primary-600" />
                </div>
                <p class="text-gray-700">{{ trend }}</p>
              </div>
            }
          </div>
        </ui-card>
      } @else {
        <div class="text-center py-12">
          <lucide-icon [img]="TrendingUpIcon" [size]="48" class="text-gray-400 mx-auto mb-4" />
          <p class="text-gray-600">Market analysis not available</p>
          <ui-button variant="primary" (clicked)="enhanceWithAI.emit()" [loading]="isAnalyzing()">
            <lucide-icon [img]="SparklesIcon" [size]="16" class="mr-2" />
            Generate Market Analysis
          </ui-button>
        </div>
      }
    </div>
  `
})
export class MarketAnalysisComponent {
  @Input() marketIntelligence = () => null as MarketIntelligence | null;
  @Input() isAnalyzing = () => false;
  @Output() enhanceWithAI = new EventEmitter<void>();

  TrendingUpIcon = TrendingUp;
  SparklesIcon = Sparkles;
}

// ==========================================
// Legal Compliance Component
// ==========================================

@Component({
  selector: 'app-legal-compliance',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiCardComponent],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-900">Legal & Compliance</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ui-card class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="ShieldIcon" [size]="24" class="text-green-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Company Registration</h3>
              <p class="text-sm text-green-600">Verified</p>
            </div>
          </div>
          <p class="text-sm text-gray-600">Registration #: {{ companyInfo?.registrationNumber }}</p>
        </ui-card>

        <ui-card class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="CheckCircleIcon" [size]="24" class="text-green-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Tax Compliance</h3>
              <p class="text-sm text-green-600">Current</p>
            </div>
          </div>
          <p class="text-sm text-gray-600">All tax obligations up to date</p>
        </ui-card>

        <ui-card class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="FileTextIcon" [size]="24" class="text-primary-600" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Legal Structure</h3>
              <p class="text-sm text-primary-600">Private Company</p>
            </div>
          </div>
          <p class="text-sm text-gray-600">Limited liability company</p>
        </ui-card>
      </div>

      <ui-card class="p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Regulatory Compliance</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div class="flex items-center gap-3">
              <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-green-500" />
              <span class="font-medium text-gray-900">Financial Services Conduct Authority (FSCA)</span>
            </div>
            <span class="text-sm text-green-600 font-medium">Compliant</span>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div class="flex items-center gap-3">
              <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-green-500" />
              <span class="font-medium text-gray-900">South African Reserve Bank (SARB)</span>
            </div>
            <span class="text-sm text-green-600 font-medium">Registered</span>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div class="flex items-center gap-3">
              <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-green-500" />
              <span class="font-medium text-gray-900">POPIA Compliance</span>
            </div>
            <span class="text-sm text-green-600 font-medium">Certified</span>
          </div>
        </div>
      </ui-card>
    </div>
  `
})
export class LegalComplianceComponent {
 @Input() companyInfo: { registrationNumber?: string } | null = null;


 ShieldIcon = Shield;
  CheckCircleIcon = CheckCircle;
  FileTextIcon = FileText;
}