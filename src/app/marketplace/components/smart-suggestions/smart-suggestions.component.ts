// src/app/marketplace/components/smart-suggestions.component.ts
import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Sparkles, TrendingUp, RefreshCw } from 'lucide-angular';
import { AuthService } from 'src/app/auth/production.auth.service';
import { SuggestionsMatchingService, MatchScore } from '../../services/suggestions-matching.service';
import { SuggestionCardComponent } from './components/suggestion-card.component';
 
@Component({
  selector: 'app-smart-suggestions',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    SuggestionCardComponent
  ],
  template: `
    <div class="smart-suggestions-container" *ngIf="showComponent()">
      <!-- Header -->
      <div class="suggestions-header">
        <div class="header-content">
          <div class="flex items-center gap-3">
            <div class="icon-wrapper">
              <lucide-icon [img]="SparklesIcon" [size]="24" class="text-primary-600" />
            </div>
            <div>
              <h2 class="text-2xl font-bold text-neutral-900">Recommended For You</h2>
              <p class="text-sm text-neutral-600 mt-1">
                {{ getSubheading() }}
              </p>
            </div>
          </div>
          
          <button 
            (click)="refresh()"
            [disabled]="isRefreshing()"
            class="refresh-button"
            [class.refreshing]="isRefreshing()">
            <lucide-icon [img]="RefreshIcon" [size]="16" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="loading-state">
        <div class="animate-pulse space-y-4">
          <div class="h-48 bg-neutral-200 rounded-xl"></div>
          <div class="h-48 bg-neutral-200 rounded-xl"></div>
          <div class="h-48 bg-neutral-200 rounded-xl"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading() && suggestions().length === 0" class="empty-state">
        <lucide-icon [img]="TrendingUpIcon" [size]="48" class="text-neutral-400 mb-4" />
        <h3 class="text-lg font-semibold text-neutral-900 mb-2">
          {{ getEmptyStateTitle() }}
        </h3>
        <p class="text-neutral-600 mb-4">
          {{ getEmptyStateMessage() }}
        </p>
        <button 
          (click)="viewAllOpportunities()"
          class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Browse All Opportunities
        </button>
      </div>

      <!-- Suggestions Grid -->
      <div *ngIf="!isLoading() && suggestions().length > 0" class="suggestions-grid">
        <app-suggestion-card
          *ngFor="let suggestion of suggestions(); trackBy: trackBySuggestion"
          [opportunity]="suggestion.opportunity"
          [matchScore]="suggestion.score"
          [matchReasons]="suggestion.matchReasons"
          [canApply]="canApply()"
          (apply)="onApply($event)"
          (viewDetails)="onViewDetails($event)"
          (signIn)="onSignInToApply()">
        </app-suggestion-card>
      </div>

      <!-- View All Link -->
      <div *ngIf="suggestions().length > 0" class="view-all-footer">
        <button 
          (click)="viewAllOpportunities()"
          class="view-all-button">
          View All Opportunities
          <lucide-icon [img]="TrendingUpIcon" [size]="16" />
        </button>
      </div>
    </div>
  `,
  styles: [`
    .smart-suggestions-container {
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
    }

    .suggestions-header {
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .icon-wrapper {
      width: 48px;
      height: 48px;
      background: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }

    .suggestions-header h2 {
      color: white;
    }

    .suggestions-header p {
      color: rgba(255, 255, 255, 0.9);
    }

    .refresh-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 0.5rem;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      backdrop-filter: blur(10px);
    }

    .refresh-button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.3);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .refresh-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .refresh-button.refreshing lucide-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .loading-state,
    .empty-state {
      background: white;
      border-radius: 0.75rem;
      padding: 2rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
    }

    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 20px;
    }

    @media (max-width: 768px) {
      .smart-suggestions-container {
        padding: 1.5rem 1rem;
      }

      .suggestions-grid {
        grid-template-columns: 1fr;
      }

      .header-content {
        flex-direction: column;
      }
    }
  `]
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
  showComponent = computed(() => 
    this.isLoggedIn() && (!this.isLoading() || this.suggestions().length > 0)
  );
  canApply = computed(() => {
    const user = this.authService.user();
    return !!(user && user.userType === 'sme');
  });

  ngOnInit() {
    this.loadSuggestions();
  }

  private loadSuggestions() {
    this.isLoading.set(true);

    this.matchingService.getSuggestedOpportunities(3, true).subscribe({
      next: (matches) => {
        this.suggestions.set(matches);
        this.hasProfile.set(matches.some(m => m.score > 50));
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      },
      error: (error) => {
        console.error('Error loading suggestions:', error);
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      }
    });
  }

  refresh() {
    this.isRefreshing.set(true);
    this.loadSuggestions();
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

  shouldShowScore(suggestion: MatchScore): boolean {
    return suggestion.score >= 60;
  }

  onApply(opportunityId: string) {
    this.router.navigate(['/applications/new'], {
      queryParams: { opportunityId }
    });
  }

  onViewDetails(opportunityId: string) {
    this.router.navigate(['/funding/opportunities', opportunityId]);
  }

  onSignInToApply() {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  viewAllOpportunities() {
    // Scroll to main opportunities list
    const element = document.querySelector('.opportunities-grid');
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  trackBySuggestion(index: number, suggestion: MatchScore): string {
    return suggestion.opportunity.id;
  }
}