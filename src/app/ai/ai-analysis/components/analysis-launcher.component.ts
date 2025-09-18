// src/app/ai/ai-analysis/components/analysis-launcher.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Sparkles, Target, CheckCircle, TrendingUp, Bot, AlertTriangle, Loader2 } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';

@Component({
  selector: 'app-analysis-launcher',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div class="px-8 py-10">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-700 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
          <lucide-icon [img]="SparklesIcon" [size]="24" class="text-white" />
        </div>
        <h3 class="text-2xl font-semibold text-gray-900 mb-3">{{ getAnalysisTitle() }}</h3>
        <p class="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
          {{ getAnalysisDescription() }}
        </p>
      </div>

      <!-- Analysis Capabilities Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        @for (capability of getAnalysisCapabilities(); track capability.title) {
          <div class="text-center">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                 [class]="'bg-' + capability.color + '-50'">
              <lucide-icon [img]="capability.icon" [size]="20" 
                          [class]="'text-' + capability.color + '-600'" />
            </div>
            <h4 class="font-semibold text-gray-900 mb-1">{{ capability.title }}</h4>
            <p class="text-sm text-gray-600">{{ capability.desc }}</p>
          </div>
        }
      </div>

      <!-- Validation Issues (if any) -->
      @if (!canAnalyze && validationIssues.length > 0) {
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <lucide-icon [img]="AlertTriangleIcon" [size]="20" class="text-amber-600 mt-0.5" />
            </div>
            <div class="flex-1">
              <h4 class="font-semibold text-amber-900 mb-2">Requirements Check</h4>
              <div class="space-y-2">
                @for (issue of validationIssues; track $index) {
                  <div class="flex items-center space-x-2">
                    <div class="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                    <span class="text-sm text-amber-800">{{ issue }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Action Button -->
      <div class="text-center">
        @if (isLoadingProfile) {
          <div class="inline-flex items-center space-x-3 px-8 py-3 bg-gray-100 rounded-lg">
            <lucide-icon [img]="Loader2Icon" [size]="16" class="text-gray-600 animate-spin" />
            <span class="text-gray-600 font-medium">Loading business profile...</span>
          </div>
        } @else {
          <ui-button 
            variant="primary" 
            size="lg"
            (click)="handleStartAnalysis()" 
            [disabled]="!canAnalyze"
            class="px-8 py-3 text-base font-semibold">
            <lucide-icon [img]="SparklesIcon" [size]="18" class="mr-2" />
            {{ getPrimaryActionText() }}
          </ui-button>
        }
      </div>
    </div>
  `
})
export class AnalysisLauncherComponent {
  @Input() analysisMode: 'profile' | 'opportunity' = 'opportunity';
  @Input() analysisPerspective: 'sme' | 'investor' = 'sme';
  @Input() canAnalyze = false;
  @Input() validationIssues: string[] = [];
  @Input() isLoadingProfile = false;
  
  @Output() startAnalysis = new EventEmitter<void>();

  // Icons
  SparklesIcon = Sparkles;
  TargetIcon = Target;
  CheckCircleIcon = CheckCircle;
  TrendingUpIcon = TrendingUp;
  BotIcon = Bot;
  AlertTriangleIcon = AlertTriangle;
  Loader2Icon = Loader2;

  getAnalysisTitle(): string {
    const baseTitle = this.analysisMode === 'profile' 
      ? 'Business Profile Analysis' 
      : 'Opportunity Match Analysis';
    
    const perspective = this.analysisPerspective === 'sme' ? 'Application Readiness' : 'Investment Evaluation';
    return `${baseTitle} - ${perspective}`;
  }

  getAnalysisDescription(): string {
    if (this.analysisPerspective === 'sme') {
      return this.analysisMode === 'profile'
        ? 'Comprehensive evaluation of your business readiness for funding applications with actionable improvement recommendations'
        : 'Intelligent assessment of your application\'s competitiveness and guidance to maximize funding success';
    } else {
      return this.analysisMode === 'profile'
        ? 'Investment-focused evaluation of business viability and risk assessment for funding decisions'
        : 'Due diligence analysis of application quality and investment opportunity assessment';
    }
  }

  getAnalysisCapabilities() {
    if (this.analysisPerspective === 'sme') {
      return [
        { icon: this.TargetIcon, title: 'Readiness Check', desc: 'Application competitiveness assessment', color: 'blue' },
        { icon: this.CheckCircleIcon, title: 'Eligibility Review', desc: 'Requirements validation and gaps', color: 'green' },
        { icon: this.TrendingUpIcon, title: 'Improvement Plan', desc: 'Actionable steps to strengthen profile', color: 'purple' },
        { icon: this.BotIcon, title: 'AI Insights', desc: 'Strategic positioning recommendations', color: 'amber' }
      ];
    } else {
      return [
        { icon: this.SparklesIcon, title: 'Risk Assessment', desc: 'Investment risk evaluation', color: 'red' },
        { icon: this.TargetIcon, title: 'Financial Review', desc: 'Financial health and projections', color: 'green' },
        { icon: this.CheckCircleIcon, title: 'Team Analysis', desc: 'Management capability assessment', color: 'purple' },
        { icon: this.TrendingUpIcon, title: 'Market Position', desc: 'Competitive positioning analysis', color: 'blue' }
      ];
    }
  }

  getPrimaryActionText(): string {
    return this.analysisPerspective === 'sme' ? 'Check Application Readiness' : 'Evaluate Investment Opportunity';
  }

  handleStartAnalysis() {
    this.startAnalysis.emit();
  }
}