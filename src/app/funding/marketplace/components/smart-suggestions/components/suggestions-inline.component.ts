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
import {
  LucideAngularModule,
  X,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-angular';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { SuggestionCardComponent } from './suggestion-card.component';

import {
  SuggestionsMatchingService,
  MatchScore,
} from '../engine/suggestions-matching.service';
import { FundingProfileSetupService } from 'src/app/fund-seeking-orgs/services/funding-profile-setup.service';
import { ScoringBreakdownComponent } from './scoring-breakdown/scoring-breakdown-component';

@Component({
  selector: 'app-smart-suggestions-inline',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    SuggestionCardComponent,
    ScoringBreakdownComponent,
  ],
  templateUrl: './suggestions-inline.component.html',
})
export class SmartSuggestionsInlineComponent implements OnInit, OnDestroy {
  private matchingService = inject(SuggestionsMatchingService);
  private authService = inject(AuthService);
  private profileService = inject(FundingProfileSetupService);
  private destroy$ = new Subject<void>();

  // Output Events
  @Output() apply = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<string>();
  @Output() signIn = new EventEmitter<void>();
  @Output() viewAll = new EventEmitter<void>();

  // Icons
  SparklesIcon = Sparkles;
  RefreshIcon = RefreshCw;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;

  // State
  isCollapsed = signal(true);
  suggestions = signal<MatchScore[]>([]);
  isLoading = signal(false);
  isRefreshing = signal(false);
  hasProfile = signal(false);
  selectedScoringId = signal<string | null>(null);

  // Expose profile data to template
  profileData = () => this.profileService.data();

  // Computed
  isUserFunder = computed(() => this.authService.user()?.userType === 'funder');
  showComponent = computed(() => !this.isUserFunder());
  selectedScoringMatch = computed(() => {
    const id = this.selectedScoringId();
    if (!id) return null;
    return this.suggestions().find((m) => m.opportunity.id === id) || null;
  });

  ngOnInit() {
    // Load suggestions when component initializes
    this.loadSuggestions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle expanded/collapsed state
   */
  toggleCollapse() {
    this.isCollapsed.update((val) => !val);
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
    this.isCollapsed.set(true);
  }

  onViewDetails(opportunityId: string) {
    this.viewDetails.emit(opportunityId);
    this.isCollapsed.set(true);
  }

  onSignInToApply() {
    this.signIn.emit();
    this.isCollapsed.set(true);
  }

  viewAllOpportunities() {
    this.viewAll.emit();
    this.isCollapsed.set(true);
  }

  /**
   * Track function for ngFor
   */
  trackBySuggestion(index: number, suggestion: MatchScore): string {
    return suggestion.opportunity.id;
  }
}
