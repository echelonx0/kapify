import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertTriangle, Loader2 } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';

interface AlgorithmStage {
  number: number;
  title: string;
  explanation: string;
  delay: string;
}

@Component({
  selector: 'app-analysis-launcher',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div class="space-y-8">
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

      <!-- Algorithm Explanation Section -->
      <div class="space-y-4">
        <div class="px-2">
          <h3 class="text-sm font-semibold text-slate-900 mb-1">
            How We Calculate Your Readiness.
          </h3>
          <p class="text-xs text-slate-600">
            {{ getAlgorithmIntro() }}
          </p>
        </div>

        <!-- Algorithm Pipeline -->
        <div class="space-y-3">
          @for (stage of getAlgorithmStages(); track stage.number) {
          <div
            class="animate-fade-in-up opacity-0"
            [style.animation-delay]="stage.delay"
          >
            <div
              class="bg-white border border-slate-200/50 rounded-xl p-4 hover:border-slate-300 transition-all duration-200"
            >
              <!-- Stage Header -->
              <div class="flex items-start gap-3 mb-2">
                <div
                  class="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 text-xs font-semibold"
                >
                  {{ stage.number }}
                </div>
                <h4 class="text-sm font-semibold text-slate-900">
                  {{ stage.title }}
                </h4>
              </div>

              <!-- Stage Explanation -->
              <p class="text-xs text-slate-600 leading-relaxed pl-9">
                {{ stage.explanation }}
              </p>
            </div>
          </div>
          }
        </div>
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
  styles: [
    `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      :host ::ng-deep .animate-fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
      }
    `,
  ],
})
export class AnalysisLauncherComponent {
  @Input() analysisMode: 'profile' | 'opportunity' = 'opportunity';
  @Input() analysisPerspective: 'sme' | 'investor' = 'sme';
  @Input() canAnalyze = false;
  @Input() validationIssues: string[] = [];
  @Input() isLoadingProfile = false;

  @Output() startAnalysis = new EventEmitter<void>();

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
        ? 'We analyze your business profile to show you exactly how ready you are for funding. You will get a clear readiness score and specific areas to improve.'
        : 'See how competitive your application is against this opportunity and what steps will help you succeed.';
    } else {
      return this.analysisMode === 'profile'
        ? 'Comprehensive investment evaluation of business viability, market fit, and team capability. All analysis is done on your computer using business rules'
        : 'Due diligence analysis to assess application quality and investment opportunity alignment. All analysis is done on your computer using business rules';
    }
  }

  getAlgorithmIntro(): string {
    if (this.analysisPerspective === 'sme') {
      return 'Your readiness is evaluated across four key areas that funders care about most.';
    } else {
      return 'Investment quality is assessed across key business and financial factors.';
    }
  }

  getAlgorithmStages(): AlgorithmStage[] {
    if (this.analysisPerspective === 'sme') {
      return [
        {
          number: 1,
          title: 'Profile Completeness',
          explanation:
            'We check if your business profile has all the essential information funders need — company details, financial data, strategy, and supporting documents. A complete profile shows you are organized and serious.',
          delay: '0ms',
        },
        {
          number: 2,
          title: 'Financial Health',
          explanation:
            'We review your revenue, profit margins, and financial trends. Funders need confidence that your business has solid financial foundations and the ability to repay or deliver returns.',
          delay: '100ms',
        },
        {
          number: 3,
          title: 'Business Stage Fit',
          explanation:
            'We evaluate whether your business stage (startup, growth, mature) and company size match the type of funding you are seeking. Some funders specialize in early-stage, others in established businesses.',
          delay: '200ms',
        },
        {
          number: 4,
          title: 'Opportunity Alignment',
          explanation:
            'We compare your business against the specific opportunity — your industry, size, funding needs, and business model. Better alignment means higher chances of success.',
          delay: '300ms',
        },
      ];
    } else {
      return [
        {
          number: 1,
          title: 'Financial Assessment',
          explanation:
            'Analysis of revenue growth, profitability, burn rate, and financial ratios to assess business sustainability and risk profile.',
          delay: '0ms',
        },
        {
          number: 2,
          title: 'Business Model Viability',
          explanation:
            'Evaluation of market fit, competitive positioning, value proposition, and operational execution capability.',
          delay: '100ms',
        },
        {
          number: 3,
          title: 'Management Capacity',
          explanation:
            'Assessment of team experience, domain expertise, and organizational capability to execute growth plans.',
          delay: '200ms',
        },
        {
          number: 4,
          title: 'Risk & Compliance',
          explanation:
            'Review of regulatory compliance, tax status, legal structure, and identified risk factors affecting investment decision.',
          delay: '300ms',
        },
      ];
    }
  }

  getPrimaryActionText(): string {
    return this.analysisPerspective === 'sme'
      ? 'Check your Profile Readiness'
      : 'Evaluate Business Profile';
  }

  handleStartAnalysis() {
    this.startAnalysis.emit();
  }
}
