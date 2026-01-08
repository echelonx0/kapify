import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  X,
  Check,
  AlertCircle,
  TrendingUp,
} from 'lucide-angular';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
import { trigger, transition, style, animate } from '@angular/animations';

interface ScoringCategory {
  name: string;
  label: string;
  points: number;
  maxPoints: number;
  isMatch: boolean;
  reason: string;
  improvement?: string;
}

@Component({
  selector: 'app-scoring-breakdown',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Backdrop (mobile only) -->
    @if (true) {
    <div
      class="fixed inset-0 bg-black/25 lg:hidden z-40"
      (click)="onClose()"
      [@fadeInOut]
    ></div>
    }

    <!-- Drawer -->
    <div
      class="fixed right-0 top-0 bottom-0 w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col overflow-hidden z-50 lg:static lg:border-l"
      [@slideInFromRight]
    >
      <!-- Header -->
      <div class="flex-shrink-0 px-6 py-4 border-b border-slate-200">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-bold text-slate-900">Why This Match</h2>
          <button
            (click)="onClose()"
            class="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close scoring breakdown"
          >
            <lucide-icon [img]="CloseIcon" [size]="18" class="text-slate-600" />
          </button>
        </div>
        <p class="text-xs text-slate-600 line-clamp-2">
          {{ opportunity.title }}
        </p>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto">
        <!-- Overall Score Summary -->
        <div class="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div class="flex items-end gap-3 mb-2">
            <div class="text-3xl font-bold" [class]="getScoreColor()">
              {{ matchScore }}%
            </div>
            <div class="text-sm text-slate-600 mb-1">
              <span class="font-semibold" [class]="getScoreColor()">{{
                getMatchGrade()
              }}</span>
              match
            </div>
          </div>
          <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              [class]="
                'h-full rounded-full bg-gradient-to-r ' + getProgressGradient()
              "
              [style.width.%]="matchScore"
            ></div>
          </div>
        </div>

        <!-- Scoring Breakdown -->
        <div class="px-6 py-4">
          <p
            class="text-xs font-semibold text-slate-900 mb-4 uppercase tracking-wide"
          >
            How We Scored
          </p>

          <div class="space-y-3">
            @for (category of scoringCategories(); track category.name) {
            <div
              class="p-3 rounded-lg border transition-colors"
              [class]="{
                'bg-green-50 border-green-200/50': category.isMatch,
                'bg-slate-50 border-slate-200': !category.isMatch
              }"
            >
              <!-- Category Header -->
              <div class="flex items-start gap-3 mb-2">
                <div
                  class="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                  [class]="{
                    'bg-green-100 text-green-600': category.isMatch,
                    'bg-slate-100 text-slate-400': !category.isMatch
                  }"
                >
                  @if (category.isMatch) {
                  <lucide-icon [img]="CheckIcon" [size]="14" />
                  } @else {
                  <lucide-icon [img]="AlertCircleIcon" [size]="14" />
                  }
                </div>

                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-900">
                    {{ category.label }}
                  </p>
                  <p class="text-xs text-slate-600 mt-0.5">
                    {{ category.reason }}
                  </p>
                </div>

                <span
                  class="text-sm font-bold flex-shrink-0"
                  [class]="
                    category.isMatch ? 'text-green-600' : 'text-slate-400'
                  "
                >
                  +{{ category.points }}/{{ category.maxPoints }}
                </span>
              </div>

              <!-- Improvement Tip -->
              @if (!category.isMatch && category.improvement) {
              <div
                class="ml-8 p-2 bg-white/50 rounded border border-slate-200/50"
              >
                <p class="text-xs text-slate-700 flex items-start gap-2">
                  <lucide-icon
                    [img]="TrendingUpIcon"
                    [size]="14"
                    class="flex-shrink-0 text-amber-600 mt-0.5"
                  />
                  <span>{{ category.improvement }}</span>
                </p>
              </div>
              }
            </div>
            }
          </div>
        </div>

        <!-- Overall Improvement Section -->
        @if (improvementSuggestions && improvementSuggestions.length > 0) {
        <div class="px-6 py-4 border-t border-slate-200">
          <p
            class="text-xs font-semibold text-slate-900 mb-3 uppercase tracking-wide"
          >
            Improve Your Match
          </p>

          <div class="space-y-2">
            @for (suggestion of improvementSuggestions; track $index) {
            <div
              class="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200/50"
            >
              <lucide-icon
                [img]="TrendingUpIcon"
                [size]="14"
                class="flex-shrink-0 text-amber-600 mt-1"
              />
              <p class="text-xs text-amber-900">{{ suggestion }}</p>
            </div>
            }
          </div>
        </div>
        }

        <!-- Why This Matters -->
        <div class="px-6 py-4 border-t border-slate-200 bg-blue-50/50">
          <p class="text-xs text-blue-900 leading-relaxed">
            <span class="font-semibold">Higher match = Better fit.</span> We
            analyze your profile against funding requirements to show
            opportunities most likely to succeed.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('slideInFromRight', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateX(0)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateX(100%)' })
        ),
      ]),
    ]),
  ],
})
export class ScoringBreakdownComponent {
  @Input() matchScore: number = 0;
  @Input() opportunity!: FundingOpportunity;
  @Input() matchReasons: string[] = [];
  @Input() profileData: any;

  @Output() close = new EventEmitter<void>();

  // Icons
  CloseIcon = X;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;
  TrendingUpIcon = TrendingUp;

  // State
  scoringCategories = signal<ScoringCategory[]>([]);
  improvementSuggestions = signal<string[]>([]);

  constructor() {
    this.initializeBreakdown();
  }

  /**
   * Initialize scoring breakdown with categories and tips
   */
  private initializeBreakdown(): void {
    const categories: ScoringCategory[] = [
      {
        name: 'industry',
        label: 'Industry Match',
        points: 40,
        maxPoints: 40,
        isMatch: this.checkIndustryMatch(),
        reason: this.getIndustryReason(),
        improvement: this.getIndustryImprovement(),
      },
      {
        name: 'funding',
        label: 'Funding Amount',
        points: this.getFundingPoints(),
        maxPoints: 30,
        isMatch: this.checkFundingMatch(),
        reason: this.getFundingReason(),
        improvement: this.getFundingImprovement(),
      },
      {
        name: 'stage',
        label: 'Business Stage',
        points: 20,
        maxPoints: 20,
        isMatch: this.checkStageMatch(),
        reason: this.getStageReason(),
        improvement: this.getStageImprovement(),
      },
      {
        name: 'location',
        label: 'Location',
        points: 10,
        maxPoints: 10,
        isMatch: this.checkLocationMatch(),
        reason: this.getLocationReason(),
        improvement: this.getLocationImprovement(),
      },
    ];

    this.scoringCategories.set(categories);
    this.generateImprovementSuggestions(categories);
  }

  /**
   * Match scoring helpers
   */
  private checkIndustryMatch(): boolean {
    return this.matchReasons.some(
      (r) => r.includes('industry') || r.includes('Industry')
    );
  }

  private checkFundingMatch(): boolean {
    return this.matchReasons.some(
      (r) =>
        r.includes('Funding amount') ||
        r.includes('funding amount') ||
        r.includes('funding')
    );
  }

  private checkStageMatch(): boolean {
    return this.matchReasons.some(
      (r) => r.includes('stage') || r.includes('Stage')
    );
  }

  private checkLocationMatch(): boolean {
    return this.matchReasons.some(
      (r) => r.includes('location') || r.includes('Location')
    );
  }

  private getFundingPoints(): number {
    return this.checkFundingMatch()
      ? 30
      : this.matchReasons.some((r) => r.includes('Close'))
      ? 15
      : 0;
  }

  /**
   * Reason messages
   */
  private getIndustryReason(): string {
    if (this.checkIndustryMatch()) {
      const industry =
        this.profileData?.companyInfo?.industryType || 'your industry';
      return `Your business operates in ${this.formatIndustry(industry)}`;
    }
    return 'Industry does not match funder requirements';
  }

  private getFundingReason(): string {
    if (this.matchReasons.some((r) => r.includes('Close'))) {
      return 'Your funding needs are close to requirements';
    }
    if (this.checkFundingMatch()) {
      return 'Your funding needs align with this opportunity';
    }
    return 'Funding amount does not match your needs';
  }

  private getStageReason(): string {
    if (this.checkStageMatch()) {
      const yearsOp =
        parseInt(this.profileData?.companyInfo?.operationalYears) || 0;
      const stage = this.getBusinessStage(yearsOp);
      return `You're in the ${stage} stage`;
    }
    return 'Your business stage does not match requirements';
  }

  private getLocationReason(): string {
    if (this.checkLocationMatch()) {
      const province =
        this.profileData?.companyInfo?.registeredAddress?.province ||
        'your area';
      return `You're located in ${province}`;
    }
    return 'This opportunity is not available in your location';
  }

  /**
   * Improvement suggestions
   */
  private getIndustryImprovement(): string {
    return 'Complete or update your industry profile to unlock more relevant matches';
  }

  private getFundingImprovement(): string {
    const requested =
      this.profileData?.businessStrategy?.fundingRequirements
        ?.totalAmountRequired || 0;
    const min = this.opportunity.minInvestment || 0;

    if (requested < min) {
      const gap = min - requested;
      return `Consider raising your funding request by R${this.formatCurrency(
        gap
      )} to match this funder`;
    }
    return 'Adjust your funding requirements to match funder ranges';
  }

  private getStageImprovement(): string {
    const yearsOp =
      parseInt(this.profileData?.companyInfo?.operationalYears) || 0;
    if (yearsOp < 2) {
      return 'Look for early-stage investor programs as you grow';
    }
    return 'Update your operational timeline to reflect your current stage';
  }

  private getLocationImprovement(): string {
    const province =
      this.profileData?.companyInfo?.registeredAddress?.province ||
      'your province';
    return `This funder only operates in specific provinces. Look for opportunities available in ${province}`;
  }

  /**
   * Generate overall improvement suggestions
   */
  private generateImprovementSuggestions(categories: ScoringCategory[]): void {
    const suggestions: string[] = [];
    const failedCategories = categories.filter((c) => !c.isMatch);

    if (failedCategories.length === 0) {
      suggestions.push('You are a great fit for this opportunity—apply now!');
    } else if (failedCategories.length === 1) {
      const cat = failedCategories[0];
      suggestions.push(cat.improvement || 'Update your profile to improve');
    } else {
      // Multiple failures
      suggestions.push('Complete your business profile for better matches');

      if (failedCategories.some((c) => c.name === 'funding')) {
        suggestions.push(
          'Update your funding requirements to match opportunities'
        );
      }

      if (failedCategories.some((c) => c.name === 'industry')) {
        suggestions.push('Clarify your industry to unlock relevant funders');
      }
    }

    this.improvementSuggestions.set(suggestions);
  }

  /**
   * Grade display
   */
  getMatchGrade(): string {
    if (this.matchScore >= 86) return 'Excellent';
    if (this.matchScore >= 71) return 'Strong';
    if (this.matchScore >= 41) return 'Medium';
    return 'Weak';
  }

  getScoreColor(): string {
    if (this.matchScore >= 86) return 'text-green-600';
    if (this.matchScore >= 71) return 'text-teal-600';
    if (this.matchScore >= 41) return 'text-amber-600';
    return 'text-red-600';
  }

  getProgressGradient(): string {
    if (this.matchScore >= 86) return 'from-green-400 to-green-500';
    if (this.matchScore >= 71) return 'from-teal-400 to-teal-500';
    if (this.matchScore >= 41) return 'from-amber-400 to-amber-500';
    return 'from-red-400 to-red-500';
  }

  /**
   * Utilities
   */
  private getBusinessStage(yearsOp: number): string {
    if (yearsOp <= 2) return 'startup';
    if (yearsOp <= 5) return 'early-stage';
    return 'established';
  }

  private formatIndustry(industry: string): string {
    return industry.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M';
    }
    if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + 'K';
    }
    return amount.toString();
  }

  /**
   * Event handlers
   */
  onClose() {
    this.close.emit();
  }
}
