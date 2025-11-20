import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Target,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';

@Component({
  selector: 'app-analysis-launcher',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div class="space-y-6">
      <!-- Hero Section -->
      <div class="bg-white rounded-2xl border border-slate-200 p-8 lg:p-12">
        <h2 class="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
          {{ getAnalysisTitle() }}
        </h2>
        <p class="text-slate-600 text-lg mb-8 max-w-2xl leading-relaxed">
          {{ getAnalysisDescription() }}
        </p>

        <!-- CTA Button -->
        @if (isLoadingProfile) {
        <div
          class="inline-flex items-center gap-3 px-6 py-3 bg-slate-100 rounded-xl text-slate-600"
        >
          <lucide-icon [img]="Loader2Icon" [size]="16" class="animate-spin" />
          <span class="font-medium text-sm">Loading profile...</span>
        </div>
        } @else {
        <ui-button
          variant="primary"
          size="lg"
          (click)="handleStartAnalysis()"
          [disabled]="!canAnalyze"
          class="w-full sm:w-auto"
        >
          {{ getPrimaryActionText() }}
        </ui-button>
        }
      </div>

      <!-- Capabilities Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        @for (capability of getAnalysisCapabilities(); track capability.title) {
        <div
          class="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200"
        >
          <div class="flex items-start gap-4">
            <div
              [class]="getCapabilityIconClass(capability.color)"
              class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            >
              <lucide-icon
                [img]="capability.icon"
                [size]="18"
                class="text-white"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-slate-900 mb-1">
                {{ capability.title }}
              </h4>
              <p class="text-sm text-slate-600">{{ capability.desc }}</p>
            </div>
          </div>
        </div>
        }
      </div>

      <!-- Validation Issues -->
      @if (!canAnalyze && validationIssues.length > 0) {
      <div class="bg-amber-50 border border-amber-200/50 rounded-2xl p-6">
        <div class="flex items-start gap-4">
          <lucide-icon
            [img]="AlertTriangleIcon"
            [size]="18"
            class="text-amber-600 flex-shrink-0 mt-0.5"
          />
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-amber-900 mb-3">
              Complete the following to analyze
            </h4>
            <div class="space-y-2">
              @for (issue of validationIssues; track $index) {
              <div class="flex items-start gap-2 text-sm">
                <div
                  class="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"
                ></div>
                <span class="text-amber-700">{{ issue }}</span>
              </div>
              }
            </div>
          </div>
        </div>
      </div>
      }
    </div>
  `,
})
export class AnalysisLauncherComponent {
  @Input() analysisMode: 'profile' | 'opportunity' = 'opportunity';
  @Input() analysisPerspective: 'sme' | 'investor' = 'sme';
  @Input() canAnalyze = false;
  @Input() validationIssues: string[] = [];
  @Input() isLoadingProfile = false;

  @Output() startAnalysis = new EventEmitter<void>();

  TargetIcon = Target;
  CheckCircleIcon = CheckCircle;
  TrendingUpIcon = TrendingUp;
  AlertTriangleIcon = AlertTriangle;
  Loader2Icon = Loader2;

  getAnalysisTitle(): string {
    const baseTitle =
      this.analysisMode === 'profile'
        ? 'Business Profile Analysis'
        : 'Opportunity Match Analysis';

    const perspective =
      this.analysisPerspective === 'sme'
        ? 'Application Readiness'
        : 'Investment Evaluation';

    return `${baseTitle} — ${perspective}`;
  }

  getAnalysisDescription(): string {
    if (this.analysisPerspective === 'sme') {
      return this.analysisMode === 'profile'
        ? 'Comprehensive evaluation of your business readiness for funding applications with actionable recommendations.'
        : 'Assessment of competitiveness and clear guidance to maximize funding success.';
    } else {
      return this.analysisMode === 'profile'
        ? 'Investment-focused evaluation of business viability and risk for funding decisions.'
        : 'Due diligence analysis of application quality and investment opportunity.';
    }
  }

  getAnalysisCapabilities() {
    if (this.analysisPerspective === 'sme') {
      return [
        {
          icon: this.TargetIcon,
          title: 'Readiness Check',
          desc: 'Application competitiveness assessment',
          color: 'teal',
        },
        {
          icon: this.CheckCircleIcon,
          title: 'Eligibility Review',
          desc: 'Requirements validation and gaps',
          color: 'green',
        },
        {
          icon: this.TrendingUpIcon,
          title: 'Improvement Plan',
          desc: 'Actionable steps to strengthen profile',
          color: 'amber',
        },
      ];
    } else {
      return [
        {
          icon: this.TargetIcon,
          title: 'Risk Assessment',
          desc: 'Investment risk evaluation',
          color: 'red',
        },
        {
          icon: this.CheckCircleIcon,
          title: 'Financial Review',
          desc: 'Financial health and projections',
          color: 'green',
        },
        {
          icon: this.TrendingUpIcon,
          title: 'Team Analysis',
          desc: 'Management capability assessment',
          color: 'amber',
        },
      ];
    }
  }

  getCapabilityIconClass(color: string): string {
    switch (color) {
      case 'teal':
        return 'bg-teal-600';
      case 'green':
        return 'bg-green-600';
      case 'amber':
        return 'bg-amber-600';
      case 'red':
        return 'bg-red-600';
      default:
        return 'bg-slate-600';
    }
  }

  getPrimaryActionText(): string {
    return this.analysisPerspective === 'sme'
      ? 'Check Application Readiness'
      : 'Evaluate Investment Opportunity';
  }

  handleStartAnalysis() {
    this.startAnalysis.emit();
  }
}
