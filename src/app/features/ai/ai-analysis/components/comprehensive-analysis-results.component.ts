import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Bot,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Target,
  Users,
  FileText,
  Shield,
} from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';
import { ComprehensiveAnalysis } from '../../services/modular-ai-analysis.service';

@Component({
  selector: 'app-comprehensive-analysis-results',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  template: `
    <div class="divide-y divide-slate-200">
      <!-- Header -->
      <div
        class="px-6 lg:px-8 py-4 lg:py-6 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-10 h-10 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <lucide-icon [img]="BotIcon" [size]="18" />
          </div>
          <div class="min-w-0">
            <h2 class="text-lg font-semibold text-slate-900">
              {{
                analysisPerspective === 'sme'
                  ? 'Application Analysis'
                  : 'Investment Analysis'
              }}
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              {{ formatTime(analysis.analysisDate) }} •
              {{ analysis.confidence }}% confidence
            </p>
          </div>
        </div>
        <ui-button variant="ghost" size="sm" (click)="handleRefresh()">
          <lucide-icon [img]="RefreshCwIcon" [size]="16" class="mr-2" />
          Refresh
        </ui-button>
      </div>

      <!-- Warnings (if any) -->
      @if (analysisWarnings.length > 0) {
      <div class="px-6 lg:px-8 py-4 bg-amber-50 border-l-4 border-amber-600">
        <div class="flex items-start gap-4">
          <lucide-icon
            [img]="AlertTriangleIcon"
            [size]="18"
            class="text-amber-600 flex-shrink-0 mt-0.5"
          />
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-amber-900 mb-2">Analysis Note</h4>
            <div class="space-y-1 mb-3">
              @for (warning of analysisWarnings; track $index) {
              <p class="text-amber-700 text-sm">{{ warning }}</p>
              }
            </div>
            <ui-button variant="secondary" size="sm" (click)="handleRetry()">
              <lucide-icon [img]="RefreshCwIcon" [size]="14" class="mr-1" />
              Retry
            </ui-button>
          </div>
        </div>
      </div>
      }

      <!-- Overall Score Section -->
      <div class="px-6 lg:px-8 py-6 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-end gap-4">
          <div class="flex items-baseline gap-3">
            <div class="text-4xl font-bold text-slate-900">
              {{ analysis.overallScore }}%
            </div>
            <div
              [class]="getReadinessBadgeClass()"
              class="px-3 py-1 rounded-full text-sm font-semibold"
            >
              {{ getReadinessLevel() | titlecase }}
            </div>
          </div>
          <p class="text-sm text-slate-600">
            {{
              analysisPerspective === 'sme'
                ? 'Application Readiness'
                : 'Investment Recommendation'
            }}
          </p>
        </div>

        <!-- Progress Bar -->
        <div>
          <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              [class]="getScoreBarGradient(analysis.overallScore)"
              class="h-full rounded-full transition-all duration-1000 ease-out"
              [style.width.%]="analysis.overallScore"
            ></div>
          </div>
        </div>

        <!-- Module Scores Grid -->
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div
            class="bg-white border border-slate-200 rounded-xl p-4 text-center"
          >
            <lucide-icon
              [img]="DollarSignIcon"
              [size]="18"
              class="text-green-600 mx-auto mb-2"
            />
            <div class="text-2xl font-bold text-slate-900">
              {{ analysis.financial.overallScore }}%
            </div>
            <p class="text-xs text-slate-600 font-semibold mt-1">Financial</p>
          </div>

          <div
            class="bg-white border border-slate-200 rounded-xl p-4 text-center"
          >
            <lucide-icon
              [img]="TargetIcon"
              [size]="18"
              class="text-teal-600 mx-auto mb-2"
            />
            <div class="text-2xl font-bold text-slate-900">
              {{ getMarketScore() }}%
            </div>
            <p class="text-xs text-slate-600 font-semibold mt-1">Market</p>
          </div>

          <div
            class="bg-white border border-slate-200 rounded-xl p-4 text-center"
          >
            <lucide-icon
              [img]="UsersIcon"
              [size]="18"
              class="text-slate-600 mx-auto mb-2"
            />
            <div class="text-2xl font-bold text-slate-900">
              {{ getManagementScore() }}%
            </div>
            <p class="text-xs text-slate-600 font-semibold mt-1">Team</p>
          </div>

          <div
            class="bg-white border border-slate-200 rounded-xl p-4 text-center"
          >
            <lucide-icon
              [img]="FileTextIcon"
              [size]="18"
              class="text-amber-600 mx-auto mb-2"
            />
            <div class="text-2xl font-bold text-slate-900">
              {{ analysis.compliance.completenessScore }}%
            </div>
            <p class="text-xs text-slate-600 font-semibold mt-1">Compliance</p>
          </div>

          <div
            class="bg-white border border-slate-200 rounded-xl p-4 text-center"
          >
            <lucide-icon
              [img]="ShieldIcon"
              [size]="18"
              class="text-red-600 mx-auto mb-2"
            />
            <div class="text-2xl font-bold text-slate-900">
              {{ getRiskScore() }}%
            </div>
            <p class="text-xs text-slate-600 font-semibold mt-1">
              {{ analysisPerspective === 'sme' ? 'Ready' : 'Risk' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Key Insights -->
      <div class="px-6 lg:px-8 py-6 space-y-6">
        <!-- Rationale -->
        <div class="bg-blue-50 border border-blue-200/50 rounded-xl p-4">
          <div class="flex items-start gap-3">
            <lucide-icon
              [img]="FileTextIcon"
              [size]="18"
              class="text-blue-600 flex-shrink-0 mt-0.5"
            />
            <div class="flex-1 min-w-0">
              <h4 class="font-semibold text-blue-900 mb-2">Summary</h4>
              <p class="text-blue-700 text-sm leading-relaxed">
                {{ getRationale() }}
              </p>
            </div>
          </div>
        </div>

        <!-- Key Insights -->
        @if (getKeyInsights().length > 0) {
        <div class="bg-green-50 border border-green-200/50 rounded-xl p-4">
          <div class="flex items-start gap-3 mb-4">
            <lucide-icon
              [img]="CheckCircleIcon"
              [size]="18"
              class="text-green-600 flex-shrink-0 mt-0.5"
            />
            <h4 class="font-semibold text-green-900">
              {{ analysisPerspective === 'sme' ? 'Strengths' : 'Strengths' }}
            </h4>
          </div>
          <div class="space-y-2">
            @for (insight of getKeyInsights(); track $index) {
            <div class="flex items-start gap-2 text-sm">
              <div
                class="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0"
              ></div>
              <span class="text-green-700">{{ insight }}</span>
            </div>
            }
          </div>
        </div>
        }

        <!-- Action Items -->
        @if (getActionItems().length > 0) {
        <div class="bg-amber-50 border border-amber-200/50 rounded-xl p-4">
          <div class="flex items-start gap-3 mb-4">
            <lucide-icon
              [img]="TrendingUpIcon"
              [size]="18"
              class="text-amber-600 flex-shrink-0 mt-0.5"
            />
            <h4 class="font-semibold text-amber-900">
              {{
                analysisPerspective === 'sme' ? 'Action Items' : 'Conditions'
              }}
            </h4>
          </div>
          <div class="space-y-3">
            @for (action of getActionItems(); track $index) {
            <div class="flex gap-3 text-sm">
              <div
                class="w-5 h-5 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold"
              >
                {{ $index + 1 }}
              </div>
              <span class="text-amber-700 pt-0.5">{{ action }}</span>
            </div>
            }
          </div>
        </div>
        }
      </div>

      <!-- Footer Actions -->
      <div
        class="px-6 lg:px-8 py-4 bg-slate-50/50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <p class="text-xs text-slate-500">
          <span class="font-medium">Completed:</span>
          {{ formatTime(analysis.analysisDate) }} •
          <span class="font-medium">Time:</span>
          {{ analysis.processingTimeMs / 1000 | number : '1.1-1' }}s
        </p>

        <div class="flex flex-col sm:flex-row gap-3">
          @if (analysisPerspective === 'sme') {
          <ui-button variant="secondary" (click)="handleImprove()">
            <lucide-icon [img]="TrendingUpIcon" [size]="16" class="mr-2" />
            Improve
          </ui-button>
          @if (analysis.overallScore >= 70) {
          <ui-button
            variant="primary"
            (click)="handleProceed()"
            class="bg-green-600 hover:bg-green-700 active:bg-green-800"
          >
            <lucide-icon [img]="CheckCircleIcon" [size]="16" class="mr-2" />
            Proceed
          </ui-button>
          } } @else {
          <ui-button variant="secondary" (click)="handleRefresh()">
            <lucide-icon [img]="RefreshCwIcon" [size]="16" class="mr-2" />
            Re-analyze
          </ui-button>
          }
        </div>
      </div>
    </div>
  `,
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

  getReadinessBadgeClass(): string {
    const level = this.getReadinessLevel();

    if (this.analysisPerspective === 'sme') {
      switch (level) {
        case 'ready_to_submit':
          return 'bg-green-50 text-green-700 border border-green-200/50';
        case 'needs_minor_improvements':
          return 'bg-amber-50 text-amber-700 border border-amber-200/50';
        case 'requires_major_work':
          return 'bg-red-50 text-red-700 border border-red-200/50';
        default:
          return 'bg-slate-100 text-slate-700 border border-slate-200';
      }
    } else {
      switch (level) {
        case 'approve':
          return 'bg-green-50 text-green-700 border border-green-200/50';
        case 'conditional_approve':
          return 'bg-amber-50 text-amber-700 border border-amber-200/50';
        case 'reject':
          return 'bg-red-50 text-red-700 border border-red-200/50';
        case 'request_more_info':
          return 'bg-blue-50 text-blue-700 border border-blue-200/50';
        default:
          return 'bg-slate-100 text-slate-700 border border-slate-200';
      }
    }
  }

  getScoreBarGradient(score: number): string {
    if (score >= 70) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (score >= 40) return 'bg-gradient-to-r from-amber-500 to-amber-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  }

  getMarketScore(): number {
    if (
      this.analysisPerspective === 'sme' &&
      this.analysis.market.marketAppealScore !== undefined
    ) {
      return this.analysis.market.marketAppealScore;
    }
    if (
      this.analysisPerspective === 'investor' &&
      this.analysis.market.differentiationScore !== undefined
    ) {
      return this.analysis.market.differentiationScore;
    }
    return 50;
  }

  getManagementScore(): number {
    if (
      this.analysisPerspective === 'sme' &&
      this.analysis.management.leadershipReadinessScore !== undefined
    ) {
      return this.analysis.management.leadershipReadinessScore;
    }
    if (
      this.analysisPerspective === 'investor' &&
      this.analysis.management.leadershipScore !== undefined
    ) {
      return this.analysis.management.leadershipScore;
    }
    return 50;
  }

  getRiskScore(): number {
    if (
      this.analysisPerspective === 'sme' &&
      this.analysis.risk.applicationReadinessScore !== undefined
    ) {
      return this.analysis.risk.applicationReadinessScore;
    }
    if (
      this.analysisPerspective === 'investor' &&
      this.analysis.risk.overallRiskScore !== undefined
    ) {
      return 100 - this.analysis.risk.overallRiskScore;
    }
    return 50;
  }

  getRationale(): string {
    if (this.analysisPerspective === 'sme') {
      return (
        this.analysis.readinessRationale || 'Analysis completed successfully.'
      );
    } else {
      return (
        this.analysis.investmentRationale || 'Investment evaluation completed.'
      );
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
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
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
