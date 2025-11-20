import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Bot,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';

@Component({
  selector: 'app-ai-analysis-progress',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div
      class="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8"
    >
      <div class="w-full max-w-2xl">
        <!-- Header -->
        <div class="text-center mb-12">
          <div
            class="w-12 h-12 bg-teal-100 text-teal-600 rounded-lg mx-auto mb-4 flex items-center justify-center"
          >
            <lucide-icon [img]="BotIcon" [size]="24" class="animate-pulse" />
          </div>
          <h2 class="text-3xl font-bold text-slate-900 mb-2">
            {{ getAnalysisTitle() }}
          </h2>
          <p class="text-slate-600 max-w-lg mx-auto">
            {{ getAnalysisDescription() }}
          </p>
        </div>

        <!-- Current Stage Card -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div class="flex items-start gap-4">
            <div
              class="w-10 h-10 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            >
              <lucide-icon
                [img]="Loader2Icon"
                [size]="18"
                class="animate-spin"
              />
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-slate-900">{{ currentStage }}</p>
              <p class="text-sm text-slate-600 mt-1">
                {{ getStageDescription() }}
              </p>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mb-6">
          <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-700 ease-out"
              [style.width.%]="progress"
            ></div>
          </div>
          <div class="flex justify-between items-center mt-3">
            <span class="text-sm font-medium text-slate-900"
              >{{ progress }}%</span
            >
            <span class="text-sm text-slate-600">{{
              getEstimatedTimeRemaining()
            }}</span>
          </div>
        </div>

        <!-- Progress Steps -->
        <div class="grid grid-cols-5 gap-2 mb-8">
          @for (step of getAnalysisSteps(); track step.key) {
          <div class="flex flex-col items-center gap-2">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
              [class]="getStepIconContainerClass(step.key)"
            >
              @if (isStepCompleted(step.key)) {
              <lucide-icon
                [img]="CheckCircle2Icon"
                [size]="18"
                class="text-white"
              />
              } @else if (isStepActive(step.key)) {
              <lucide-icon
                [img]="Loader2Icon"
                [size]="16"
                class="text-white animate-spin"
              />
              } @else {
              <div class="w-2 h-2 bg-slate-400 rounded-full"></div>
              }
            </div>
            <div class="text-center">
              <p class="text-xs font-semibold text-slate-900">
                {{ step.name }}
              </p>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ step.description }}
              </p>
            </div>
          </div>
          }
        </div>

        <!-- Tips Section -->
        <div class="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h4 class="font-semibold text-slate-900 mb-4">While you wait</h4>
          <div class="space-y-3">
            @for (tip of getWaitingTips(); track $index) {
            <div class="flex items-start gap-3">
              <div
                class="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 flex-shrink-0"
              ></div>
              <span class="text-sm text-slate-600">{{ tip }}</span>
            </div>
            }
          </div>
        </div>

        <!-- Cancel Button -->
        <div class="text-center">
          <ui-button variant="secondary" (click)="handleCancel()">
            <lucide-icon [img]="XIcon" [size]="16" class="mr-2" />
            Cancel
          </ui-button>
        </div>
      </div>
    </div>
  `,
})
export class AiAnalysisProgressComponent {
  @Input() currentStage = '';
  @Input() progress = 0;
  @Input() analysisPerspective: 'sme' | 'investor' = 'sme';

  @Output() cancelAnalysis = new EventEmitter<void>();

  // Icons
  BotIcon = Bot;
  CheckCircle2Icon = CheckCircle2;
  Loader2Icon = Loader2;
  XIcon = X;

  getAnalysisTitle(): string {
    return this.analysisPerspective === 'sme'
      ? 'Analyzing Your Application'
      : 'Running Due Diligence';
  }

  getAnalysisDescription(): string {
    return this.analysisPerspective === 'sme'
      ? 'Our AI is evaluating your profile and generating personalized recommendations to optimize your funding success.'
      : 'Conducting comprehensive analysis of financial health, market position, and risk factors.';
  }

  getStageDescription(): string {
    const stageDescriptions: Record<string, string> = {
      'Analyzing financial health...':
        'Evaluating revenue, profitability, and financial stability',
      'Checking document compliance...':
        'Verifying required documentation and regulatory compliance',
      'Evaluating management capability...':
        'Assessing leadership team and governance structure',
      'Analyzing market position...':
        'Reviewing competitive positioning and market opportunity',
      'Performing risk assessment...':
        'Identifying potential risks and mitigation strategies',
      'Generating final recommendations...':
        'Synthesizing insights and creating action plan',
    };

    return (
      stageDescriptions[this.currentStage] || 'Processing your business data'
    );
  }

  getEstimatedTimeRemaining(): string {
    if (this.progress >= 90) return 'Almost done';
    if (this.progress >= 70) return '~30 seconds';
    if (this.progress >= 40) return '~1 minute';
    if (this.progress >= 20) return '~2 minutes';
    return '~3 minutes';
  }

  getAnalysisSteps() {
    return [
      { key: 'financial', name: 'Financial', description: 'Health' },
      { key: 'compliance', name: 'Compliance', description: 'Docs' },
      { key: 'management', name: 'Team', description: 'Assessment' },
      { key: 'market', name: 'Market', description: 'Position' },
      { key: 'synthesis', name: 'Report', description: 'Final' },
    ];
  }

  isStepCompleted(stepKey: string): boolean {
    const stepProgress: Record<string, number> = {
      financial: 20,
      compliance: 35,
      management: 50,
      market: 65,
      synthesis: 90,
    };
    return this.progress > (stepProgress[stepKey] || 0);
  }

  isStepActive(stepKey: string): boolean {
    const stepProgress: Record<string, number> = {
      financial: 20,
      compliance: 35,
      management: 50,
      market: 65,
      synthesis: 90,
    };

    const stepStart = stepProgress[stepKey] || 0;
    const nextStepStart =
      Object.values(stepProgress).find((p) => p > stepStart) || 100;
    return this.progress >= stepStart && this.progress < nextStepStart;
  }

  getStepIconContainerClass(stepKey: string): string {
    if (this.isStepCompleted(stepKey)) {
      return 'bg-green-600';
    } else if (this.isStepActive(stepKey)) {
      return 'bg-teal-600';
    }
    return 'bg-slate-200';
  }

  getWaitingTips(): string[] {
    if (this.analysisPerspective === 'sme') {
      return [
        'Review your business profile for any missing information',
        'Prepare additional documentation if needed',
        'Think about your funding goals and timeline',
        'Consider your growth strategy for the next 3-5 years',
      ];
    } else {
      return [
        "Review the applicant's submitted documents",
        'Consider your investment criteria and risk tolerance',
        'Prepare follow-up questions for due diligence',
        'Think about potential terms and investment structure',
      ];
    }
  }

  handleCancel() {
    this.cancelAnalysis.emit();
  }
}
