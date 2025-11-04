// src/app/marketplace/components/smart-suggestions.component.ts

import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Sparkles,
  TrendingUp,
  RefreshCw,
} from 'lucide-angular';
import { AuthService } from 'src/app/auth/production.auth.service';
import {
  SuggestionsMatchingService,
  MatchScore,
} from '../../services/suggestions-matching.service';
import { SuggestionCardComponent } from './components/suggestion-card.component';

@Component({
  selector: 'app-smart-suggestions',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SuggestionCardComponent],
  templateUrl: 'smart-suggestions.component.html',
  styleUrl: 'smart-suggestions.component.css',
})
export class SmartSuggestionsComponent implements OnInit {
  private matchingService = inject(SuggestionsMatchingService);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Icons
  SparklesIcon = Sparkles;
  TrendingUpIcon = TrendingUp;
  RefreshIcon = RefreshCw;

  // State
  suggestions = signal<MatchScore[]>([]);
  isLoading = signal(true);
  isRefreshing = signal(false);
  hasProfile = signal(false);

  // Computed
  isLoggedIn = computed(() => !!this.authService.user());
  showComponent = computed(
    () =>
      this.isLoggedIn() && (!this.isLoading() || this.suggestions().length > 0)
  );

  ngOnInit() {
    this.loadSuggestions();
  }

  private loadSuggestions() {
    this.isLoading.set(true);

    this.matchingService.getSuggestedOpportunities(3, true).subscribe({
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

  refresh() {
    this.isRefreshing.set(true);
    this.loadSuggestions();
  }

  /** Logic for per-suggestion eligibility */
  getApplicationEligibility(match: MatchScore) {
    const user = this.authService.user();

    if (!user) {
      return { canApply: false, reason: 'You need to sign in to apply.' };
    }

    if (user.userType !== 'sme') {
      return {
        canApply: false,
        reason: 'Only SME accounts can apply to funding opportunities.',
      };
    }

    if (match.score < 75) {
      return {
        canApply: false,
        reason: `Your match score is only ${match.score}%. You need at least 75% to apply.`,
      };
    }

    return { canApply: true, reason: '' };
  }

  getSubheading(): string {
    if (this.hasProfile()) {
      return 'Based on your business profile and preferences';
    }
    return 'Recently published opportunities you might be interested in';
  }

  getEmptyStateTitle(): string {
    if (this.hasProfile()) {
      return 'No matches found right now';
    }
    return 'Complete your profile for personalized suggestions';
  }

  getEmptyStateMessage(): string {
    if (this.hasProfile()) {
      return 'Check back soon for new opportunities, or browse all available funding options.';
    }
    return 'Complete your business profile to receive AI-powered opportunity recommendations tailored to your business.';
  }

  onApply(opportunityId: string) {
    this.router.navigate(['/applications/new'], {
      queryParams: { opportunityId },
    });
  }

  onViewDetails(opportunityId: string) {
    this.router.navigate(['/funding/opportunities', opportunityId]);
  }

  onSignInToApply() {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  viewAllOpportunities() {
    const element = document.querySelector('.opportunities-grid');
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  trackBySuggestion(index: number, suggestion: MatchScore): string {
    return suggestion.opportunity.id;
  }
}
