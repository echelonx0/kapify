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
} from '../engine/suggestions-matching.service';
import { SuggestionCardComponent } from '../components/suggestion-card.component';
import { ScoringBreakdownComponent } from '../components/scoring-breakdown-component';
import { FundingApplicationCoverInformation } from 'src/app/shared/models/funding-application-cover.model';
import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';
import { ToastService } from 'src/app/shared/services/toast.service';
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
  templateUrl: './smart-suggestions-modal.component.html',
})
export class SmartSuggestionsModalComponent implements OnInit, OnDestroy {
  private matchingService = inject(SuggestionsMatchingService);
  private authService = inject(AuthService);
  private coverService = inject(FundingApplicationCoverService);
  private toast = inject(ToastService);

  private destroy$ = new Subject<void>();

  // Outputs
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
  isLoading = signal(false);
  isRefreshing = signal(false);
  suggestions = signal<MatchScore[]>([]);
  selectedScoringId = signal<string | null>(null);

  defaultCover = signal<FundingApplicationCoverInformation | null>(null);
  private isCoverLoaded = signal(false);

  hasProfile = computed(() => this.suggestions().some((m) => m.score >= 50));

  selectedScoringMatch = computed(() => {
    const id = this.selectedScoringId();
    return id
      ? this.suggestions().find((m) => m.opportunity.id === id) || null
      : null;
  });

  ngOnInit() {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** PUBLIC API */
  async open() {
    this.isOpen.set(true);
    this.isLoading.set(true);

    await this.loadDefaultCover();

    if (!this.isCoverLoaded()) {
      this.isLoading.set(false);
      return;
    }

    this.loadSuggestions();
  }

  close() {
    this.isOpen.set(false);
    this.selectedScoringId.set(null);
  }

  /** COVER LOADING */
  private async loadDefaultCover() {
    try {
      const cover = await this.coverService.loadDefaultCover();
      if (!cover) {
        this.toast.error('A funding request cover is required');
        this.isCoverLoaded.set(false);
        return;
      }

      this.defaultCover.set(cover);
      this.isCoverLoaded.set(true);
    } catch {
      this.toast.error('Failed to load funding cover');
      this.isCoverLoaded.set(false);
    }
  }

  /** SUGGESTIONS */
  private loadSuggestions() {
    this.matchingService
      .getSuggestedOpportunities({
        maxSuggestions: 5,
        excludeApplied: true,
        coverInfo: this.defaultCover(),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matches) => {
          this.suggestions.set(matches);
          this.isLoading.set(false);
          this.isRefreshing.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.isRefreshing.set(false);
        },
      });
  }

  refresh() {
    this.isRefreshing.set(true);
    this.loadSuggestions();
  }

  /** EVENTS */
  onApply(id: string) {
    this.apply.emit(id);
    this.close();
  }

  onViewDetails(id: string) {
    this.viewDetails.emit(id);
    this.close();
  }

  onSignInToApply() {
    this.signIn.emit();
    this.close();
  }

  viewAllOpportunities() {
    this.viewAll.emit();
    this.close();
  }

  showScoring(id: string) {
    this.selectedScoringId.set(id);
  }

  closeScoring() {
    this.selectedScoringId.set(null);
  }

  trackBySuggestion(_: number, s: MatchScore) {
    return s.opportunity.id;
  }

  /** TEMPLATE HELPERS */

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
}
