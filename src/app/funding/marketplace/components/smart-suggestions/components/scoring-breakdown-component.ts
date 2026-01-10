import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
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
  isMatch: boolean;
  reason: string;
}

@Component({
  selector: 'app-scoring-breakdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Backdrop (mobile only) -->
    <div
      class="fixed inset-0 bg-black/25 lg:hidden z-40"
      (click)="onClose()"
      [@fadeInOut]
    ></div>

    <!-- Drawer -->
    <div
      class="fixed right-0 top-0 bottom-0 w-full lg:w-96 bg-white border-l border-slate-200 flex flex-col overflow-hidden z-50"
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
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <!-- Score Summary -->
        <div class="mb-6">
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
        <p class="text-xs font-semibold text-slate-900 mb-3 uppercase">
          How We Scored
        </p>

        <div class="space-y-3">
          @for (category of categories(); track category.name) {
          <div
            class="p-3 rounded-lg border transition-colors"
            [class]="{
              'bg-green-50 border-green-200/50': category.isMatch,
              'bg-slate-50 border-slate-200': !category.isMatch
            }"
          >
            <div class="flex items-start gap-3">
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
              <div class="flex-1">
                <p class="text-sm font-semibold text-slate-900">
                  {{ category.label }}
                </p>
                <p class="text-xs text-slate-600 mt-0.5">
                  {{ category.reason }}
                </p>
              </div>
            </div>
          </div>
          }
        </div>

        <!-- Info -->
        <div
          class="mt-6 p-3 bg-blue-50/50 rounded-lg border border-blue-200/30"
        >
          <p class="text-xs text-blue-900 leading-relaxed">
            <span class="font-semibold">Higher match = Better fit.</span> We
            analyze your profile against funder requirements.
          </p>
        </div>
      </div>
    </div>
  `,
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

  @Output() close = new EventEmitter<void>();

  CloseIcon = X;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;
  TrendingUpIcon = TrendingUp;

  categories = signal<ScoringCategory[]>([]);

  ngOnInit() {
    console.log('[ScoringBreakdown] Component initialized');
    console.log('[ScoringBreakdown] Input opportunity:', this.opportunity);
    console.log('[ScoringBreakdown] Input matchScore:', this.matchScore);
    console.log('[ScoringBreakdown] Input matchReasons:', this.matchReasons);
    this.buildCategories();
  }

  private buildCategories() {
    const cats: ScoringCategory[] = [
      {
        name: 'industry',
        label: 'Industry Match',
        isMatch: this.hasReason('industry', 'Industry'),
        reason: this.hasReason('industry', 'Industry')
          ? 'Your industry aligns with funder requirements'
          : 'Industry does not match requirements',
      },
      {
        name: 'funding',
        label: 'Funding Amount',
        isMatch: this.hasReason('funding', 'Funding', 'Close'),
        reason: this.hasReason('funding', 'Funding', 'Close')
          ? 'Your funding needs match opportunity range'
          : 'Funding amount outside your range',
      },
      {
        name: 'stage',
        label: 'Business Stage',
        isMatch: this.hasReason('stage', 'Stage'),
        reason: this.hasReason('stage', 'Stage')
          ? 'Your business stage is eligible'
          : 'Business stage does not match',
      },
      {
        name: 'location',
        label: 'Location',
        isMatch: this.hasReason('location', 'Location'),
        reason: this.hasReason('location', 'Location')
          ? 'Opportunity available in your area'
          : 'Not available in your location',
      },
    ];

    console.log('[ScoringBreakdown] Built categories:', cats);
    this.categories.set(cats);
  }

  private hasReason(...keywords: string[]): boolean {
    const result = this.matchReasons.some((r) =>
      keywords.some((k) => r.includes(k))
    );
    console.log('[ScoringBreakdown] hasReason check:', { keywords, result });
    return result;
  }

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

  onClose() {
    console.log('[ScoringBreakdown] Close button clicked');
    this.close.emit();
  }
}
