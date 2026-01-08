import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  computed,
  Output,
  EventEmitter,
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
} from '../../services/suggestions-matching.service';
import { ScoringBreakdownComponent } from './components/scoring-breakdown-component';
import { SuggestionCardComponent } from './modal/suggestion-card.component';

@Component({
  selector: 'app-smart-suggestions-modal',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    SuggestionCardComponent,
    ScoringBreakdownComponent,
  ],
  templateUrl: './smart-suggestions-modal.component.html',
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
  isUserFunder = computed(() => this.authService.user()?.userType === 'funder');
  selectedScoringMatch = computed(() => {
    const id = this.selectedScoringId();
    if (!id) return null;
    return this.suggestions().find((m) => m.opportunity.id === id) || null;
  });

  ngOnInit() {
    // Don't load until modal opens
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Open modal and load suggestions
   */
  open() {
    this.isOpen.set(true);
    this.loadSuggestions();
  }

  /**
   * Close modal
   */
  close() {
    this.isOpen.set(false);
    this.selectedScoringId.set(null);
  }

  /**
   * Load suggestions
   */
  private loadSuggestions() {
    this.isLoading.set(true);

    this.matchingService
      .getSuggestedOpportunities(5, true)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (matches) => {
          this.suggestions.set(matches);
          this.hasProfile.set(matches.some((m) => m.score > 50));
          this.isLoading.set(false);
          this.isRefreshing.set(false);
        },
        error: (error) => {
          console.error('Error loading suggestions:', error);
          this.isLoading.set(false);
          this.isRefreshing.set(false);
        },
      });
  }

  /**
   * Refresh suggestions
   */
  refresh() {
    this.isRefreshing.set(true);
    this.loadSuggestions();
  }

  /**
   * Show scoring breakdown for opportunity
   */
  showScoring(opportunityId: string) {
    this.selectedScoringId.set(opportunityId);
  }

  /**
   * Close scoring breakdown
   */
  closeScoring() {
    this.selectedScoringId.set(null);
  }

  /**
   * Check eligibility for application
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
   * Helper text for empty states
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
   * Navigation handlers
   */
  onApply(opportunityId: string) {
    this.apply.emit(opportunityId);
    this.close();
  }

  onViewDetails(opportunityId: string) {
    this.viewDetails.emit(opportunityId);
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

  /**
   * Track function for ngFor
   */
  trackBySuggestion(index: number, suggestion: MatchScore): string {
    return suggestion.opportunity.id;
  }
}
