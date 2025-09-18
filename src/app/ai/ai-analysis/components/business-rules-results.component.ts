// src/app/ai/ai-analysis/components/business-rules-results.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle, TrendingUp, AlertTriangle, Target, FileText, RefreshCw, Bot } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';
import { BusinessRulesResult } from '../../services/business-rules.service';

@Component({
  selector: 'app-business-rules-results',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div class="divide-y divide-gray-100">
      
      <!-- Header Section -->
      <div class="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-xl font-semibold text-gray-900">Initial Assessment</h3>
            <p class="text-gray-600 mt-1">Generated {{ formatTime(result.generatedAt) }}</p>
          </div>
          <ui-button variant="ghost" size="sm" (click)="handleRefresh()">
            <lucide-icon [img]="RefreshCwIcon" [size]="16" class="mr-2" />
            Refresh
          </ui-button>
        </div>
      </div>

      <!-- Overall Score Section -->
      <div class="px-8 py-6">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center space-x-4">
            <div class="text-4xl font-bold text-gray-900">
              {{ result.compatibilityScore }}%
            </div>
            <div>
              <div [class]="getCompatibilityBadgeClass(result.eligibilityStatus)" 
                   class="capitalize mb-2">
                {{ result.eligibilityStatus }}
              </div>
              <p class="text-sm text-gray-600">
                {{ analysisPerspective === 'sme' ? 'Application Readiness' : 'Investment Compatibility' }}
              </p>
            </div>
          </div>
        </div>
        
        <div class="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div [class]="getScoreBarClass(result.compatibilityScore)" 
               class="h-3 rounded-full transition-all duration-700 ease-out" 
               [style.width.%]="result.compatibilityScore"></div>
        </div>

        <!-- Score Breakdown -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center space-x-3 mb-2">
              <lucide-icon [img]="getMatchQualityIcon(result.industryAlignment.match)" 
                           [size]="18" 
                           [class]="getMatchQualityClass(result.industryAlignment.match)" />
              <span class="font-semibold text-gray-900">Industry Match</span>
            </div>
            <div class="text-2xl font-bold text-gray-900 mb-1">
              {{ result.industryAlignment.score }}/30
            </div>
            <p class="text-sm text-gray-600 capitalize">{{ result.industryAlignment.match }}</p>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center space-x-3 mb-2">
              <lucide-icon [img]="getMatchQualityIcon(result.stageCompatibility.match)" 
                           [size]="18" 
                           [class]="getMatchQualityClass(result.stageCompatibility.match)" />
              <span class="font-semibold text-gray-900">Stage Match</span>
            </div>
            <div class="text-2xl font-bold text-gray-900 mb-1">
              {{ result.stageCompatibility.score }}/25
            </div>
            <p class="text-sm text-gray-600 capitalize">{{ result.stageCompatibility.match }}</p>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center space-x-3 mb-2">
              <lucide-icon [img]="result.financialReadiness.level === 'strong' ? CheckCircleIcon : 
                                   result.financialReadiness.level === 'moderate' ? TargetIcon : AlertTriangleIcon" 
                           [size]="18" 
                           [class]="result.financialReadiness.level === 'strong' ? 'text-green-600' : 
                                    result.financialReadiness.level === 'moderate' ? 'text-orange-600' : 'text-red-600'" />
              <span class="font-semibold text-gray-900">Financial</span>
            </div>
            <div class="text-2xl font-bold text-gray-900 mb-1">
              {{ result.financialReadiness.score }}/25
            </div>
            <p class="text-sm text-gray-600 capitalize">{{ result.financialReadiness.level }}</p>
          </div>
          
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center space-x-3 mb-2">
              <lucide-icon [img]="FileTextIcon" 
                           [size]="18" 
                           [class]="result.profileCompleteness.score >= 15 ? 'text-green-600' : 
                                    result.profileCompleteness.score >= 10 ? 'text-orange-600' : 'text-red-600'" />
              <span class="font-semibold text-gray-900">Completeness</span>
            </div>
            <div class="text-2xl font-bold text-gray-900 mb-1">
              {{ result.profileCompleteness.percentage }}%
            </div>
            <p class="text-sm text-gray-600">Profile Complete</p>
          </div>
        </div>
      </div>

      <!-- Insights Section -->
      <div class="px-8 py-6 space-y-6">
        
        <!-- Strengths -->
        @if (result.strengths.length > 0) {
          <div class="bg-green-50 border-l-4 border-green-400 p-6 rounded-r-lg">
            <div class="flex items-center space-x-3 mb-4">
              <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-green-600" />
              <h4 class="font-semibold text-green-900 text-lg">
                {{ analysisPerspective === 'sme' ? 'Key Strengths to Highlight' : 'Investment Strengths' }}
              </h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (strength of result.strengths; track $index) {
                <div class="flex items-start space-x-3">
                  <div class="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span class="text-green-800 font-medium">{{ strength }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Improvement Areas -->
        @if (result.improvementAreas.length > 0) {
          <div class="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-lg">
            <div class="flex items-center space-x-3 mb-4">
              <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-amber-600" />
              <h4 class="font-semibold text-amber-900 text-lg">
                {{ analysisPerspective === 'sme' ? 'Areas to Strengthen' : 'Investment Concerns' }}
              </h4>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (area of result.improvementAreas; track $index) {
                <div class="flex items-start space-x-3">
                  <div class="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span class="text-amber-800 font-medium">{{ area }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Risk Factors -->
        @if (result.riskFlags.length > 0) {
          <div class="bg-red-50 border-l-4 border-red-400 p-6 rounded-r-lg">
            <div class="flex items-center space-x-3 mb-4">
              <lucide-icon [img]="AlertTriangleIcon" [size]="20" class="text-red-600" />
              <h4 class="font-semibold text-red-900 text-lg">
                {{ analysisPerspective === 'sme' ? 'Critical Issues to Address' : 'Risk Factors' }}
              </h4>
            </div>
            <div class="space-y-4">
              @for (risk of result.riskFlags; track $index) {
                <div class="flex items-start space-x-4 bg-white rounded-lg p-4 border border-red-200">
                  <div [class]="getRiskSeverityClass(risk.severity)" class="flex-shrink-0">
                    {{ risk.severity.toUpperCase() }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-red-900 mb-1">{{ risk.issue }}</p>
                    <p class="text-red-700 text-sm">{{ risk.impact }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Recommendations -->
        @if (result.recommendations.length > 0) {
          <div class="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
            <div class="flex items-center space-x-3 mb-4">
              <lucide-icon [img]="TargetIcon" [size]="20" class="text-blue-600" />
              <h4 class="font-semibold text-blue-900 text-lg">
                {{ analysisPerspective === 'sme' ? 'Action Plan' : 'Strategic Recommendations' }}
              </h4>
            </div>
            <div class="space-y-3">
              @for (recommendation of result.recommendations; track $index) {
                <div class="flex items-start space-x-3 bg-white rounded-lg p-4 border border-blue-200">
                  <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span class="text-xs font-bold text-blue-600">{{ $index + 1 }}</span>
                  </div>
                  <span class="text-blue-800 font-medium">{{ recommendation }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Comprehensive Analysis CTA Section -->
      <div class="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div class="flex items-center justify-between">
          <div class="flex items-start space-x-4">
            <div class="w-12 h-12 bg-gradient-to-br from-slate-600 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <lucide-icon [img]="BotIcon" [size]="20" class="text-white" />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-xl font-semibold mb-2">
                {{ analysisPerspective === 'sme' ? 'Ready for Detailed Analysis?' : 'Run Full Due Diligence?' }}
              </h4>
              <p class="text-blue-100 mb-4 leading-relaxed">
                @if (analysisPerspective === 'sme') {
                  Get comprehensive insights and actionable recommendations in 2-3 minutes
                } @else {
                  Perform complete investment evaluation with detailed risk assessment
                }
              </p>
              <ui-button size="lg" variant="ghost" (click)="handleStartComprehensive()">
                <lucide-icon [img]="BotIcon" [size]="18" class="mr-2" />
                {{ getComprehensiveActionText() }}
              </ui-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      @if (analysisMode === 'opportunity') {
        <div class="px-8 py-6 bg-gray-50 flex items-center justify-between">
          <div class="text-sm text-gray-600">
            <span class="font-medium">Last updated:</span> {{ formatTime(result.generatedAt) }}
          </div>
          
          <div class="flex space-x-4">
            @if (result.compatibilityScore >= 60) {
              <ui-button variant="outline" (click)="handleImprove()">
                <lucide-icon [img]="TrendingUpIcon" [size]="16" class="mr-2" />
                {{ analysisPerspective === 'sme' ? 'Optimize Profile' : 'Request Improvements' }}
              </ui-button>
              <ui-button variant="primary" (click)="handleProceed()" 
                        class="bg-green-600 hover:bg-green-700">
                <lucide-icon [img]="CheckCircleIcon" [size]="16" class="mr-2" />
                {{ analysisPerspective === 'sme' ? 'Continue Application' : 'Proceed with Evaluation' }}
              </ui-button>
            } @else {
              <ui-button (click)="handleImprove()">
                <lucide-icon [img]="TrendingUpIcon" [size]="16" class="mr-2" />
                {{ analysisPerspective === 'sme' ? 'Improve Profile First' : 'Request Improvements' }}
              </ui-button>
            }
          </div>
        </div>
      } @else {
        <div class="px-8 py-6 bg-gray-50 flex items-center justify-between">
          <div class="text-sm text-gray-600">
            <span class="font-medium">Last updated:</span> {{ formatTime(result.generatedAt) }}
          </div>
          <ui-button variant="outline" (click)="handleRefresh()">
            <lucide-icon [img]="RefreshCwIcon" [size]="16" class="mr-2" />
            Refresh Analysis
          </ui-button>
        </div>
      }
    </div>
  `
})
export class BusinessRulesResultsComponent {
  @Input() result!: BusinessRulesResult;
  @Input() analysisMode: 'profile' | 'opportunity' = 'opportunity';
  @Input() analysisPerspective: 'sme' | 'investor' = 'sme';
  
  @Output() startComprehensiveAnalysis = new EventEmitter<void>();
  @Output() improveApplication = new EventEmitter<void>();
  @Output() proceedWithApplication = new EventEmitter<void>();
  @Output() refreshAnalysis = new EventEmitter<void>();

  // Icons
  CheckCircleIcon = CheckCircle;
  TrendingUpIcon = TrendingUp;
  AlertTriangleIcon = AlertTriangle;
  TargetIcon = Target;
  FileTextIcon = FileText;
  RefreshCwIcon = RefreshCw;
  BotIcon = Bot;

  getCompatibilityBadgeClass(eligibility: string): string {
    const baseClass = 'px-3 py-1 rounded-full text-sm font-medium';
    switch (eligibility) {
      case 'eligible': return `${baseClass} bg-green-100 text-green-800`;
      case 'conditional': return `${baseClass} bg-orange-100 text-orange-800`;
      case 'ineligible': return `${baseClass} bg-red-100 text-red-800`;
      default: return `${baseClass} bg-gray-100 text-gray-800`;
    }
  }

  getScoreBarClass(score: number): string {
    if (score >= 70) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (score >= 40) return 'bg-gradient-to-r from-orange-500 to-orange-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  }

  getRiskSeverityClass(severity: string): string {
    const baseClass = 'px-2 py-1 rounded text-xs font-medium';
    switch (severity) {
      case 'high': return `${baseClass} bg-red-100 text-red-800`;
      case 'medium': return `${baseClass} bg-orange-100 text-orange-800`;
      case 'low': return `${baseClass} bg-yellow-100 text-yellow-800`;
      default: return `${baseClass} bg-gray-100 text-gray-800`;
    }
  }

  getMatchQualityIcon(match: string): any {
    switch (match) {
      case 'strong': return this.CheckCircleIcon;
      case 'moderate': return this.TargetIcon;
      case 'weak': return this.AlertTriangleIcon;
      default: return this.AlertTriangleIcon;
    }
  }

  getMatchQualityClass(match: string): string {
    switch (match) {
      case 'strong': return 'text-green-600';
      case 'moderate': return 'text-orange-600';
      case 'weak': return 'text-red-600';
      default: return 'text-gray-600';
    }
  }

  getComprehensiveActionText(): string {
    return this.analysisPerspective === 'sme' ? 'Run AI Analysis' : 'Run Due Diligence';
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

  handleStartComprehensive() {
    this.startComprehensiveAnalysis.emit();
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
}