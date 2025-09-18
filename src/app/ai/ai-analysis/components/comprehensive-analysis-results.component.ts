// src/app/ai/ai-analysis/components/comprehensive-analysis-results.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bot, CheckCircle, TrendingUp, AlertTriangle, RefreshCw, DollarSign, Target, Users, FileText, Shield } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';
import { ComprehensiveAnalysis } from '../../services/modular-ai-analysis.service';

@Component({
  selector: 'app-comprehensive-analysis-results',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div class="divide-y divide-gray-100">
      
      <!-- Comprehensive Header -->
      <div class="px-8 py-6 bg-gradient-to-r from-slate-50 to-cyan-50">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="w-12 h-12 bg-gradient-to-br from-slate-600 to-cyan-600 rounded-xl flex items-center justify-center">
              <lucide-icon [img]="BotIcon" [size]="20" class="text-white" />
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900">
                {{ analysisPerspective === 'sme' ? 'Application Readiness Report' : 'Investment Analysis Report' }}
              </h3>
              <p class="text-gray-600 mt-1">
                Generated {{ formatTime(analysis.analysisDate) }} • 
                {{ analysis.confidence }}% confidence
              </p>
            </div>
          </div>
          <ui-button variant="ghost" size="sm" (click)="handleRefresh()">
            <lucide-icon [img]="RefreshCwIcon" [size]="16" class="mr-2" />
            Refresh
          </ui-button>
        </div>
      </div>

      <!-- Analysis Warnings (if any) -->
      @if (analysisWarnings.length > 0) {
        <div class="px-8 py-4 bg-amber-50 border-l-4 border-amber-400">
          <div class="flex items-start">
            <lucide-icon [img]="AlertTriangleIcon" [size]="20" class="text-amber-600 mt-0.5 mr-3" />
            <div class="flex-1">
              <h4 class="font-semibold text-amber-900 mb-2">Analysis Completed with Limitations</h4>
              <div class="space-y-1">
                @for (warning of analysisWarnings; track $index) {
                  <p class="text-amber-800 text-sm">{{ warning }}</p>
                }
              </div>
              <div class="mt-3">
                <ui-button variant="outline" size="sm" (click)="handleRetry()" 
                          class="text-amber-700 border-amber-300 hover:bg-amber-100">
                  <lucide-icon [img]="RefreshCwIcon" [size]="14" class="mr-1" />
                  Retry for Better Accuracy
                </ui-button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Overall Assessment -->
      <div class="px-8 py-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-6">
            <div class="text-5xl font-bold text-gray-900">
              {{ analysis.overallScore }}%
            </div>
            <div>
              <div class="px-4 py-2 rounded-full text-sm font-semibold mb-2"
                   [class]="'bg-' + getReadinessColor() + '-100 text-' + getReadinessColor() + '-800'">
                {{ getReadinessLevel() | titlecase }}
              </div>
              <p class="text-sm text-gray-600 font-medium">
                {{ analysisPerspective === 'sme' ? 'Application Readiness' : 'Investment Recommendation' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-gray-200 rounded-full h-4 mb-8">
          <div [class]="getScoreBarClass(analysis.overallScore)" 
               class="h-4 rounded-full transition-all duration-1000 ease-out" 
               [style.width.%]="analysis.overallScore"></div>
        </div>

        <!-- Module Scores Grid -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-6">
          <div class="bg-gray-50 rounded-xl p-4 text-center">
            <lucide-icon [img]="DollarSignIcon" [size]="24" class="text-green-600 mx-auto mb-2" />
            <div class="text-2xl font-bold text-gray-900">
              {{ analysis.financial.overallScore }}%
            </div>
            <p class="text-sm text-gray-600 font-medium">Financial</p>
          </div>
          
          <div class="bg-gray-50 rounded-xl p-4 text-center">
            <lucide-icon [img]="TargetIcon" [size]="24" class="text-blue-600 mx-auto mb-2" />
            <div class="text-2xl font-bold text-gray-900">
              {{ getMarketScore() }}%
            </div>
            <p class="text-sm text-gray-600 font-medium">Market</p>
          </div>
          
          <div class="bg-gray-50 rounded-xl p-4 text-center">
            <lucide-icon [img]="UsersIcon" [size]="24" class="text-slate-600 mx-auto mb-2" />
            <div class="text-2xl font-bold text-gray-900">
              {{ getManagementScore() }}%
            </div>
            <p class="text-sm text-gray-600 font-medium">Management</p>
          </div>
          
          <div class="bg-gray-50 rounded-xl p-4 text-center">
            <lucide-icon [img]="FileTextIcon" [size]="24" class="text-orange-600 mx-auto mb-2" />
            <div class="text-2xl font-bold text-gray-900">
              {{ analysis.compliance.completenessScore }}%
            </div>
            <p class="text-sm text-gray-600 font-medium">Compliance</p>
          </div>
          
          <div class="bg-gray-50 rounded-xl p-4 text-center">
            <lucide-icon [img]="ShieldIcon" [size]="24" class="text-red-600 mx-auto mb-2" />
            <div class="text-2xl font-bold text-gray-900">
              {{ getRiskScore() }}%
            </div>
            <p class="text-sm text-gray-600 font-medium">{{ analysisPerspective === 'sme' ? 'Readiness' : 'Risk Adj.' }}</p>
          </div>
        </div>
      </div>

      <!-- Key Insights -->
      <div class="px-8 py-6 space-y-6">
        
        <!-- Rationale -->
        <div class="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
          <div class="flex items-center space-x-3 mb-4">
            <lucide-icon [img]="FileTextIcon" [size]="20" class="text-blue-600" />
            <h4 class="font-semibold text-blue-900 text-lg">Assessment Summary</h4>
          </div>
          <p class="text-blue-800 leading-relaxed">
            {{ getRationale() }}
          </p>
        </div>

        <!-- Key Insights -->
        @if (getKeyInsights().length > 0) {
          <div class="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
            <div class="flex items-center space-x-3 mb-4">
              <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-green-600" />
              <h4 class="font-semibold text-green-900 text-lg">
                {{ analysisPerspective === 'sme' ? 'Competitive Advantages' : 'Key Strengths' }}
              </h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (insight of getKeyInsights(); track $index) {
                <div class="flex items-start space-x-3">
                  <div class="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span class="text-green-800 font-medium">{{ insight }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Action Items -->
        @if (getActionItems().length > 0) {
          <div class="bg-orange-50 border-l-4 border-orange-400 p-6 rounded-r-lg">
            <div class="flex items-center space-x-3 mb-4">
              <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-orange-600" />
              <h4 class="font-semibold text-orange-900 text-lg">
                {{ analysisPerspective === 'sme' ? 'Action Plan' : 'Conditions' }}
              </h4>
            </div>
            <div class="space-y-3">
              @for (action of getActionItems(); track $index) {
                <div class="flex items-start space-x-3 bg-white rounded-lg p-4 border border-orange-200">
                  <div class="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="text-xs font-bold text-orange-600">{{ $index + 1 }}</span>
                  </div>
                  <span class="text-orange-800 font-medium">{{ action }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Final Actions -->
      <div class="px-8 py-6 bg-gray-50 flex items-center justify-between">
        <div class="text-sm text-gray-600">
          <span class="font-medium">Analysis completed:</span> {{ formatTime(analysis.analysisDate) }} • 
          <span class="font-medium">Processing time:</span> {{ analysis.processingTimeMs / 1000 | number:'1.1-1' }}s
        </div>
        
        <div class="flex space-x-4">
          @if (analysisPerspective === 'sme') {
            <ui-button variant="outline" (click)="handleImprove()">
              <lucide-icon [img]="TrendingUpIcon" [size]="16" class="mr-2" />
              Improve Profile
            </ui-button>
            @if (analysis.overallScore >= 70) {
              <ui-button variant="primary" (click)="handleProceed()" 
                        class="bg-green-600 hover:bg-green-700">
                <lucide-icon [img]="CheckCircleIcon" [size]="16" class="mr-2" />
                Ready to Apply
              </ui-button>
            }
          } @else {
            <ui-button variant="outline" (click)="handleRefresh()">
              <lucide-icon [img]="RefreshCwIcon" [size]="16" class="mr-2" />
              Re-analyze
            </ui-button>
          }
        </div>
      </div>
    </div>
  `
})
export class ComprehensiveAnalysisResultsComponent {
  @Input() analysis!: ComprehensiveAnalysis;
  @Input() analysisPerspective: 'sme' | 'investor' = 'sme';
  @Input() analysisWarnings: string[] = [];
  
  @Output() improveApplication = new EventEmitter<void>();
  @Output() proceedWithApplication = new EventEmitter<void>();
  @Output() refreshAnalysis = new EventEmitter<void>();
  @Output() retryAnalysis = new EventEmitter<void>();

  // Icons
  BotIcon = Bot;
  CheckCircleIcon = CheckCircle;
  TrendingUpIcon = TrendingUp;
  AlertTriangleIcon = AlertTriangle;
  RefreshCwIcon = RefreshCw;
  DollarSignIcon = DollarSign;
  TargetIcon = Target;
  UsersIcon = Users;
  FileTextIcon = FileText;
  ShieldIcon = Shield;

  getReadinessLevel(): string {
    if (this.analysisPerspective === 'sme') {
      return this.analysis.applicationReadiness || 'unknown';
    } else {
      return this.analysis.recommendation || 'unknown';
    }
  }

  getReadinessColor(): string {
    const level = this.getReadinessLevel();
    
    if (this.analysisPerspective === 'sme') {
      switch (level) {
        case 'ready_to_submit': return 'green';
        case 'needs_minor_improvements': return 'orange';
        case 'requires_major_work': return 'red';
        default: return 'gray';
      }
    } else {
      switch (level) {
        case 'approve': return 'green';
        case 'conditional_approve': return 'orange';
        case 'reject': return 'red';
        case 'request_more_info': return 'blue';
        default: return 'gray';
      }
    }
  }

  getScoreBarClass(score: number): string {
    if (score >= 70) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (score >= 40) return 'bg-gradient-to-r from-orange-500 to-orange-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  }

  getMarketScore(): number {
    if (this.analysisPerspective === 'sme' && this.analysis.market.marketAppealScore !== undefined) {
      return this.analysis.market.marketAppealScore;
    }
    if (this.analysisPerspective === 'investor' && this.analysis.market.differentiationScore !== undefined) {
      return this.analysis.market.differentiationScore;
    }
    return 50; // Default
  }

  getManagementScore(): number {
    if (this.analysisPerspective === 'sme' && this.analysis.management.leadershipReadinessScore !== undefined) {
      return this.analysis.management.leadershipReadinessScore;
    }
    if (this.analysisPerspective === 'investor' && this.analysis.management.leadershipScore !== undefined) {
      return this.analysis.management.leadershipScore;
    }
    return 50; // Default
  }

  getRiskScore(): number {
    if (this.analysisPerspective === 'sme' && this.analysis.risk.applicationReadinessScore !== undefined) {
      return this.analysis.risk.applicationReadinessScore;
    }
    if (this.analysisPerspective === 'investor' && this.analysis.risk.overallRiskScore !== undefined) {
      return 100 - this.analysis.risk.overallRiskScore; // Invert risk to positive score
    }
    return 50; // Default
  }

  getRationale(): string {
    if (this.analysisPerspective === 'sme') {
      return this.analysis.readinessRationale || 'Analysis completed successfully.';
    } else {
      return this.analysis.investmentRationale || 'Investment evaluation completed.';
    }
  }

  getKeyInsights(): string[] {
    if (this.analysisPerspective === 'sme') {
      return this.analysis.competitiveAdvantages || [];
    } else {
      return this.analysis.keyStrengths || [];
    }
  }

  getActionItems(): string[] {
    if (this.analysisPerspective === 'sme') {
      return this.analysis.actionPlan || [];
    } else {
      return this.analysis.conditions || [];
    }
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  }

  handleImprove() {
    this.improveApplication.emit();
  }

  handleProceed() {
    this.proceedWithApplication.emit();
  }

  handleRefresh() {
    this.refreshAnalysis.emit();
  }

  handleRetry() {
    this.retryAnalysis.emit();
  }
}