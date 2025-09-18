// src/app/ai/ai-analysis/components/ai-analysis-progress.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bot, Loader2, X } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';

@Component({
  selector: 'app-ai-analysis-progress',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div class="px-8 py-10">
      
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-br from-slate-600 to-cyan-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
          <lucide-icon [img]="BotIcon" [size]="24" class="text-white animate-pulse" />
        </div>
        <h3 class="text-2xl font-semibold text-gray-900 mb-3">
          {{ getAnalysisTitle() }}
        </h3>
        <p class="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
          {{ getAnalysisDescription() }}
        </p>
      </div>

      <!-- Progress Section -->
      <div class="max-w-2xl mx-auto mb-8">
        
        <!-- Current Stage -->
        <div class="flex items-center space-x-3 bg-blue-50 rounded-lg p-4 mb-6">
          <lucide-icon [img]="Loader2Icon" [size]="20" class="text-blue-600 animate-spin flex-shrink-0" />
          <div class="flex-1">
            <p class="font-semibold text-blue-800">{{ currentStage }}</p>
            <p class="text-sm text-blue-700 mt-1">{{ getStageDescription() }}</p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div class="bg-gradient-to-r from-blue-500 to-slate-600 h-3 rounded-full transition-all duration-500 ease-out"
               [style.width.%]="progress"></div>
        </div>

        <!-- Progress Text -->
        <div class="flex justify-between items-center text-sm">
          <span class="text-gray-600">{{ progress }}% complete</span>
          <span class="text-gray-600">{{ getEstimatedTimeRemaining() }}</span>
        </div>

        <!-- Progress Steps -->
        <div class="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          @for (step of getAnalysisSteps(); track step.key) {
            <div class="flex items-center space-x-3 p-3 rounded-lg"
                 [class]="getStepClass(step.key)">
              <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                   [class]="getStepIconClass(step.key)">
                @if (isStepCompleted(step.key)) {
                  <lucide-icon [img]="step.completedIcon" [size]="16" class="text-white" />
                } @else if (isStepActive(step.key)) {
                  <lucide-icon [img]="Loader2Icon" [size]="16" class="text-white animate-spin" />
                } @else {
                  <lucide-icon [img]="step.icon" [size]="16" />
                }
              </div>
              <div class="min-w-0 flex-1">
                <p class="font-medium text-sm" [class]="getStepTextClass(step.key)">{{ step.name }}</p>
                <p class="text-xs text-gray-500">{{ step.description }}</p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="text-center">
        <ui-button variant="outline" (click)="handleCancel()" class="px-6">
          <lucide-icon [img]="XIcon" [size]="16" class="mr-2" />
          Cancel Analysis
        </ui-button>
      </div>

      <!-- Tips Section -->
      <div class="mt-8 bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
        <h4 class="font-semibold text-gray-900 mb-3">While you wait...</h4>
        <div class="space-y-2">
          @for (tip of getWaitingTips(); track $index) {
            <div class="flex items-start space-x-3">
              <div class="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
              <span class="text-sm text-gray-600">{{ tip }}</span>
            </div>
          }
        </div>
      </div>

    </div>
  `
})
export class AiAnalysisProgressComponent {
  @Input() currentStage = '';
  @Input() progress = 0;
  @Input() analysisPerspective: 'sme' | 'investor' = 'sme';
  
  @Output() cancelAnalysis = new EventEmitter<void>();

  // Icons
  BotIcon = Bot;
  Loader2Icon = Loader2;
  XIcon = X;

  getAnalysisTitle(): string {
    return this.analysisPerspective === 'sme' 
      ? 'Analyzing Application Readiness...' 
      : 'Performing Due Diligence Analysis...';
  }

  getAnalysisDescription(): string {
    return this.analysisPerspective === 'sme'
      ? 'Our AI is evaluating your business profile and generating personalized recommendations to optimize your funding success.'
      : 'Conducting comprehensive investment analysis including financial health, market position, and risk assessment.';
  }

  getStageDescription(): string {
    // Map current stages to user-friendly descriptions
    const stageDescriptions: Record<string, string> = {
      'Analyzing financial health...': 'Evaluating revenue, profitability, and financial stability',
      'Checking document compliance...': 'Verifying required documentation and regulatory compliance',
      'Evaluating management capability...': 'Assessing leadership team and governance structure',
      'Analyzing market position...': 'Reviewing competitive positioning and market opportunity',
      'Performing risk assessment...': 'Identifying potential risks and mitigation strategies',
      'Generating final recommendations...': 'Synthesizing insights and creating action plan'
    };
    
    return stageDescriptions[this.currentStage] || 'Processing your business data with advanced AI algorithms';
  }

  getEstimatedTimeRemaining(): string {
    if (this.progress >= 90) return 'Almost done';
    if (this.progress >= 70) return '~30 seconds';
    if (this.progress >= 40) return '~1 minute';
    if (this.progress >= 20) return '~2 minutes';
    return '~3 minutes';
  }

  getAnalysisSteps() {
    const baseSteps = [
      { 
        key: 'financial', 
        name: 'Financial', 
        description: 'Health check',
        icon: Bot, 
        completedIcon: Bot 
      },
      { 
        key: 'compliance', 
        name: 'Compliance', 
        description: 'Documentation',
        icon: Bot, 
        completedIcon: Bot 
      },
      { 
        key: 'management', 
        name: 'Management', 
        description: 'Team assessment',
        icon: Bot, 
        completedIcon: Bot 
      },
      { 
        key: 'market', 
        name: 'Market', 
        description: 'Position analysis',
        icon: Bot, 
        completedIcon: Bot 
      },
      { 
        key: 'synthesis', 
        name: 'Synthesis', 
        description: 'Final report',
        icon: Bot, 
        completedIcon: Bot 
      }
    ];

    return baseSteps;
  }

  isStepCompleted(stepKey: string): boolean {
    const stepProgress: Record<string, number> = {
      'financial': 20,
      'compliance': 35,
      'management': 50,
      'market': 65,
      'synthesis': 90
    };
    
    return this.progress > (stepProgress[stepKey] || 0);
  }

  isStepActive(stepKey: string): boolean {
    const stepProgress: Record<string, number> = {
      'financial': 20,
      'compliance': 35,
      'management': 50,
      'market': 65,
      'synthesis': 90
    };
    
    const stepStart = stepProgress[stepKey] || 0;
    const nextStepStart = Object.values(stepProgress).find(p => p > stepStart) || 100;
    
    return this.progress >= stepStart && this.progress < nextStepStart;
  }

  getStepClass(stepKey: string): string {
    if (this.isStepCompleted(stepKey)) {
      return 'bg-green-50 border border-green-200';
    } else if (this.isStepActive(stepKey)) {
      return 'bg-blue-50 border border-blue-200';
    }
    return 'bg-gray-50 border border-gray-200';
  }

  getStepIconClass(stepKey: string): string {
    if (this.isStepCompleted(stepKey)) {
      return 'bg-green-500';
    } else if (this.isStepActive(stepKey)) {
      return 'bg-blue-500';
    }
    return 'bg-gray-300';
  }

  getStepTextClass(stepKey: string): string {
    if (this.isStepCompleted(stepKey)) {
      return 'text-green-800';
    } else if (this.isStepActive(stepKey)) {
      return 'text-blue-800';
    }
    return 'text-gray-600';
  }

  getWaitingTips(): string[] {
    if (this.analysisPerspective === 'sme') {
      return [
        'Review your business profile for any missing information',
        'Consider your funding strategy and timeline',
        'Prepare additional documentation if needed',
        'Think about how you\'ll present your business story'
      ];
    } else {
      return [
        'Review the applicant\'s submitted documents',
        'Consider your investment criteria and risk tolerance',
        'Prepare follow-up questions for due diligence',
        'Think about potential terms and conditions'
      ];
    }
  }

  handleCancel() {
    this.cancelAnalysis.emit();
  }
}