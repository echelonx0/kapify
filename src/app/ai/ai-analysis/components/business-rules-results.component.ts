import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Target,
  FileText,
  RefreshCw,
  Bot,
} from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';
import { BusinessRulesResult } from '../../services/business-rules.service';

@Component({
  selector: 'app-business-rules-results',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div class="divide-y divide-slate-200">
      <!-- Header -->
      <div
        class="px-6 lg:px-8 py-4 lg:py-6 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between"
      >
        <div>
          <h3 class="text-lg font-semibold text-slate-900">
            Assessment Results
          </h3>
          <p class="text-xs text-slate-500 mt-1">
            {{ formatTime(result.generatedAt) }}
          </p>
        </div>
        <ui-button variant="ghost" size="sm" (click)="handleRefresh()">
          <lucide-icon [img]="RefreshCwIcon" [size]="16" class="mr-2" />
          Refresh
        </ui-button>
      </div>

      <!-- Insights Sections -->
      <div class="px-6 lg:px-8 py-6 space-y-6">
        <!-- Strengths -->
        @if (result.strengths.length > 0) {
        <div class="border border-green-200/50 rounded-xl p-4 bg-green-50">
          <div class="flex items-center gap-2 mb-3">
            <lucide-icon
              [img]="CheckCircleIcon"
              [size]="18"
              class="text-green-600"
            />
            <h4 class="font-semibold text-green-900">
              {{
                analysisPerspective === 'sme'
                  ? 'Key Strengths'
                  : 'Investment Strengths'
              }}
            </h4>
          </div>
          <div class="space-y-2">
            @for (strength of result.strengths; track $index) {
            <div class="flex items-start gap-2 text-sm">
              <div
                class="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0"
              ></div>
              <span class="text-green-700">{{ strength }}</span>
            </div>
            }
          </div>
        </div>
        }

        <!-- Improvement Areas -->
        @if (result.improvementAreas.length > 0) {
        <div class="border border-amber-200/50 rounded-xl p-4 bg-amber-50">
          <div class="flex items-center gap-2 mb-3">
            <lucide-icon
              [img]="TrendingUpIcon"
              [size]="18"
              class="text-amber-600"
            />
            <h4 class="font-semibold text-amber-900">
              {{
                analysisPerspective === 'sme'
                  ? 'Areas to Strengthen'
                  : 'Concerns'
              }}
            </h4>
          </div>
          <div class="space-y-2">
            @for (area of result.improvementAreas; track $index) {
            <div class="flex items-start gap-2 text-sm">
              <div
                class="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 flex-shrink-0"
              ></div>
              <span class="text-amber-700">{{ area }}</span>
            </div>
            }
          </div>
        </div>
        }

        <!-- Risk Factors -->
        @if (result.riskFlags.length > 0) {
        <div class="border border-red-200/50 rounded-xl p-4 bg-red-50">
          <div class="flex items-center gap-2 mb-4">
            <lucide-icon
              [img]="AlertTriangleIcon"
              [size]="18"
              class="text-red-600"
            />
            <h4 class="font-semibold text-red-900">
              {{
                analysisPerspective === 'sme'
                  ? 'Critical Issues'
                  : 'Risk Factors'
              }}
            </h4>
          </div>
          <div class="space-y-3">
            @for (risk of result.riskFlags; track $index) {
            <div class="flex gap-3 text-sm">
              <span
                class="inline-block px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded whitespace-nowrap"
              >
                {{ risk.severity | uppercase }}
              </span>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-red-900">{{ risk.issue }}</p>
                <p class="text-red-700 text-xs mt-0.5">{{ risk.impact }}</p>
              </div>
            </div>
            }
          </div>
        </div>
        }

        <!-- Recommendations -->
        @if (result.recommendations.length > 0) {
        <div class="border border-teal-300/50 rounded-xl p-4 bg-teal-50">
          <div class="flex items-center gap-2 mb-4">
            <lucide-icon [img]="TargetIcon" [size]="18" class="text-teal-600" />
            <h4 class="font-semibold text-teal-900">
              {{
                analysisPerspective === 'sme' ? 'Next Steps' : 'Recommendations'
              }}
            </h4>
          </div>
          <div class="space-y-3">
            @for (recommendation of result.recommendations; track $index) {
            <div class="flex gap-3 text-sm">
              <div
                class="w-6 h-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
              >
                {{ $index + 1 }}
              </div>
              <span class="text-teal-700 pt-0.5">{{ recommendation }}</span>
            </div>
            }
          </div>
        </div>
        }
      </div>

      <!-- Comprehensive Analysis CTA -->
      <div class="px-6 lg:px-8 py-6 bg-white border-t border-slate-200">
        <div
          class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div class="flex gap-4">
            <div
              class="w-10 h-10 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center flex-shrink-0"
            >
              <lucide-icon [img]="BotIcon" [size]="20" />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-slate-900">
                {{
                  analysisPerspective === 'sme'
                    ? 'Run Full Analysis?'
                    : 'Run Due Diligence?'
                }}
              </h4>
              <p class="text-sm text-slate-600 mt-1">
                @if (analysisPerspective === 'sme') { Get comprehensive insights
                and action items in 2-3 minutes } @else { Complete investment
                evaluation with detailed risk assessment }
              </p>
            </div>
          </div>
          <ui-button
            variant="primary"
            (click)="handleStartComprehensive()"
            class="lg:whitespace-nowrap"
          >
            <lucide-icon [img]="BotIcon" [size]="16" class="mr-2" />
            {{
              analysisPerspective === 'sme'
                ? 'Run Analysis'
                : 'Run Due Diligence'
            }}
          </ui-button>
        </div>
      </div>

      <!-- Actions Footer -->
      <div
        class="px-6 lg:px-8 py-4 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <p class="text-xs text-slate-500">
          <span class="font-medium">Updated:</span>
          {{ formatTime(result.generatedAt) }}
        </p>

        @if (analysisMode === 'opportunity') {
        <div class="flex flex-col sm:flex-row gap-3">
          @if (result.compatibilityScore >= 60) {
          <ui-button variant="secondary" (click)="handleImprove()">
            <lucide-icon [img]="TrendingUpIcon" [size]="16" class="mr-2" />
            {{ analysisPerspective === 'sme' ? 'Optimize' : 'Improve' }}
          </ui-button>
          <ui-button
            variant="primary"
            (click)="handleProceed()"
            class="bg-green-600 hover:bg-green-700 active:bg-green-800"
          >
            <lucide-icon [img]="CheckCircleIcon" [size]="16" class="mr-2" />
            {{ analysisPerspective === 'sme' ? 'Continue' : 'Proceed' }}
          </ui-button>
          } @else {
          <ui-button variant="secondary" (click)="handleImprove()">
            <lucide-icon [img]="TrendingUpIcon" [size]="16" class="mr-2" />
            {{
              analysisPerspective === 'sme'
                ? 'Improve First'
                : 'Request Changes'
            }}
          </ui-button>
          }
        </div>
        }
      </div>
    </div>
  `,
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

  getEligibilityBadgeClass(eligibility: string): string {
    switch (eligibility) {
      case 'eligible':
        return 'bg-green-50 text-green-700 border border-green-200/50';
      case 'conditional':
        return 'bg-amber-50 text-amber-700 border border-amber-200/50';
      case 'ineligible':
        return 'bg-red-50 text-red-700 border border-red-200/50';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  }

  getScoreBarGradient(score: number): string {
    if (score >= 70) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (score >= 40) return 'bg-gradient-to-r from-amber-500 to-amber-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  }

  getMatchIcon(match: string): any {
    switch (match) {
      case 'strong':
        return this.CheckCircleIcon;
      case 'moderate':
        return this.TargetIcon;
      case 'weak':
        return this.AlertTriangleIcon;
      default:
        return this.AlertTriangleIcon;
    }
  }

  getMatchColor(match: string): string {
    switch (match) {
      case 'strong':
        return 'text-green-600';
      case 'moderate':
        return 'text-amber-600';
      case 'weak':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  }

  getFinancialIcon(level: string): any {
    switch (level) {
      case 'strong':
        return this.CheckCircleIcon;
      case 'moderate':
        return this.TargetIcon;
      case 'weak':
        return this.AlertTriangleIcon;
      default:
        return this.AlertTriangleIcon;
    }
  }

  getFinancialColor(level: string): string {
    switch (level) {
      case 'strong':
        return 'text-green-600';
      case 'moderate':
        return 'text-amber-600';
      case 'weak':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
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
