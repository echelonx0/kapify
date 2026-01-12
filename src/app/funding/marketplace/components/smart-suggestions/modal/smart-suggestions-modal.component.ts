import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  computed,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, RefreshCw, Sparkles } from 'lucide-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

import {
  SuggestionsMatchingService,
  MatchScore,
} from '../../../services/suggestions-matching.service';
import { SuggestionCardComponent } from '../components/suggestion-card.component';
import { ScoringBreakdownComponent } from '../components/scoring-breakdown-component';

@Component({
  selector: 'app-smart-suggestions-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LucideAngularModule,
    SuggestionCardComponent,
    ScoringBreakdownComponent,
  ],
  template: `
    @if (isOpen()) {
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/25 backdrop-blur-sm z-40"
      (click)="close()"
      [@fadeInOut]
    ></div>

    <!-- Modal -->
    <div
      class="fixed right-0 top-0 h-screen w-full sm:w-96 bg-white shadow-lg z-50 flex flex-col overflow-hidden"
      [@slideInOut]
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-slate-200"
      >
        <div class="flex items-center gap-3">
          <div>
            <h2 class="text-base font-semibold text-slate-900">
              Recommended For You
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">{{ getSubheading() }}</p>
          </div>
        </div>
        <button
          (click)="close()"
          class="text-slate-400 hover:text-slate-600 transition-colors p-1"
          aria-label="Close recommendations"
        >
          <lucide-icon [img]="CloseIcon" [size]="20" />
        </button>
      </div>

      <!-- Content Area - Scrollable -->
      <div class="flex-1 overflow-y-auto">
        <!-- Loading State -->
        @if (isLoading()) {
        <div class="p-4 space-y-3">
          @for (i of [1, 2, 3]; track i) {
          <div class="h-32 bg-slate-100 rounded-xl animate-pulse"></div>
          }
        </div>
        }

        <!-- Empty State -->
        @if (!isLoading() && suggestions().length === 0) {
        <div class="p-6 text-center">
          <div
            class="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-4"
          >
            <lucide-icon
              [img]="SparklesIcon"
              [size]="24"
              class="text-slate-400"
            />
          </div>
          <h3 class="text-sm font-semibold text-slate-900 mb-1">
            {{ getEmptyStateTitle() }}
          </h3>
          <p class="text-xs text-slate-600 mb-4">
            {{ getEmptyStateMessage() }}
          </p>
          <button
            (click)="viewAllOpportunities()"
            class="w-full px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600 transition-colors"
          >
            Browse All
          </button>
        </div>
        }

        <!-- Suggestions List -->
        @if (!isLoading() && suggestions().length > 0) {
        <div class="p-4 space-y-4">
          @for ( suggestion of suggestions(); track trackBySuggestion($index,
          suggestion) ) {
          <app-suggestion-card
            [opportunity]="suggestion.opportunity"
            [matchScore]="suggestion.score"
            [matchReasons]="suggestion.matchReasons"
            [canApply]="getApplicationEligibility(suggestion).canApply"
            [reasonMessage]="getApplicationEligibility(suggestion).reason"
            (apply)="onApply($event)"
            (viewDetails)="onViewDetails($event)"
            (signIn)="onSignInToApply()"
            (viewScoring)="showScoring($event)"
          >
          </app-suggestion-card>
          }
        </div>
        }
      </div>

      <!-- Footer -->
      @if (!isLoading() && suggestions().length > 0) {
      <div class="border-t border-slate-200 px-4 py-3 flex gap-2">
        <button
          (click)="refresh()"
          [disabled]="isRefreshing()"
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        >
          <lucide-icon
            [img]="RefreshIcon"
            [size]="16"
            [class.animate-spin]="isRefreshing()"
          />
          <span>Refresh</span>
        </button>
        <button
          (click)="viewAllOpportunities()"
          class="flex-1 px-4 py-2 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-colors"
        >
          View All
        </button>
      </div>
      }
    </div>

    <!-- Scoring Breakdown Overlay -->
    @if (selectedScoringMatch()) {
    <app-scoring-breakdown
      [opportunity]="selectedScoringMatch()!.opportunity"
      [matchScore]="selectedScoringMatch()!.score"
      [matchReasons]="selectedScoringMatch()!.matchReasons"
      (close)="closeScoring()"
    >
    </app-scoring-breakdown>
    } }
  `,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
    ]),
    trigger('slideInOut', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)' })),
      ]),
    ]),
  ],
})
export class SmartSuggestionsModalComponent implements OnInit, OnDestroy {
  private matchingService = inject(SuggestionsMatchingService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // Output Events
  @Output() apply = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<string>();
  @Output() signIn = new EventEmitter<void>();
  @Output() viewAll = new EventEmitter<void>();

  // Icons
  SparklesIcon = Sparkles;
  CloseIcon = X;
  RefreshIcon = RefreshCw;

  // State
  isOpen = signal(false);
  suggestions = signal<MatchScore[]>([]);
  isLoading = signal(false);
  isRefreshing = signal(false);
  hasProfile = signal(false);
  selectedScoringId = signal<string | null>(null);

  // Computed
  selectedScoringMatch = computed(() => {
    const id = this.selectedScoringId();
    console.log('[selectedScoringMatch] Computing for ID:', id);

    if (!id) {
      console.log('[selectedScoringMatch] No ID, returning null');
      return null;
    }

    const match = this.suggestions().find((m) => m.opportunity.id === id);
    console.log('[selectedScoringMatch] Found match:', match);
    return match || null;
  });

  isUserFunder = computed(() => this.authService.user()?.userType === 'funder');

  ngOnInit() {
    console.log('[SmartSuggestionsModal] Component initialized');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Public API: Open modal and load suggestions
   */
  open() {
    console.log('[Modal.open] Opening modal');
    this.isOpen.set(true);
    this.loadSuggestions();
  }

  /**
   * Close modal
   */
  close() {
    console.log('[Modal.close] Closing modal');
    this.isOpen.set(false);
    this.selectedScoringId.set(null);
  }

  /**
   * Load suggestions from service
   */
  private loadSuggestions() {
    console.log('[Modal.loadSuggestions] Starting load');
    this.isLoading.set(true);

    this.matchingService
      .getSuggestedOpportunities(5, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matches) => {
          console.log('[Modal.loadSuggestions] Loaded matches:', matches);
          this.suggestions.set(matches);
          this.hasProfile.set(matches.some((m) => m.score > 50));
          this.isLoading.set(false);
          this.isRefreshing.set(false);
        },
        error: (error) => {
          console.error('[Modal.loadSuggestions] Error loading:', error);
          this.isLoading.set(false);
          this.isRefreshing.set(false);
        },
      });
  }

  /**
   * Refresh suggestions
   */
  refresh() {
    console.log('[Modal.refresh] Refreshing suggestions');
    this.isRefreshing.set(true);
    this.loadSuggestions();
  }

  /**
   * Check if user can apply to opportunity
   */
  getApplicationEligibility(match: MatchScore) {
    const user = this.authService.user();

    if (!user) {
      return { canApply: false, reason: 'Sign in to apply' };
    }

    if (user.userType !== 'sme') {
      return { canApply: false, reason: 'SME accounts only' };
    }

    if (match.score < 75) {
      return {
        canApply: false,
        reason: `${match.score}% match (75% required)`,
      };
    }

    return { canApply: true, reason: '' };
  }

  /**
   * Text helpers
   */
  getSubheading(): string {
    return this.hasProfile()
      ? 'Based on your business profile'
      : 'Recently published opportunities';
  }

  getEmptyStateTitle(): string {
    return this.hasProfile()
      ? 'No matches right now'
      : 'Complete your profile first';
  }

  getEmptyStateMessage(): string {
    return this.hasProfile()
      ? 'Check back soon for new opportunities'
      : 'Build your profile to get personalized recommendations';
  }

  /**
   * Event handlers
   */
  onApply(opportunityId: string) {
    console.log('[Modal.onApply] Applying to:', opportunityId);
    this.apply.emit(opportunityId);
    this.close();
  }

  onViewDetails(opportunityId: string) {
    console.log('[Modal.onViewDetails] Viewing:', opportunityId);
    this.viewDetails.emit(opportunityId);
    this.close();
  }

  onSignInToApply() {
    console.log('[Modal.onSignInToApply] Signing in');
    this.signIn.emit();
    this.close();
  }

  viewAllOpportunities() {
    console.log('[Modal.viewAllOpportunities] Viewing all');
    this.viewAll.emit();
    this.close();
  }

  /**
   * Scoring breakdown
   */
  showScoring(opportunityId: string) {
    console.log('[Modal.showScoring] Showing scoring for:', opportunityId);
    console.log('[Modal.showScoring] Current suggestions:', this.suggestions());

    this.selectedScoringId.set(opportunityId);

    console.log(
      '[Modal.showScoring] selectedScoringMatch now:',
      this.selectedScoringMatch()
    );
  }

  closeScoring() {
    console.log('[Modal.closeScoring] Closing scoring breakdown');
    this.selectedScoringId.set(null);
  }

  /**
   * Track function for ngFor
   */
  trackBySuggestion(index: number, suggestion: MatchScore): string {
    return suggestion.opportunity.id;
  }
}
