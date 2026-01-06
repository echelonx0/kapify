import {
  Component,
  signal,
  OnInit,
  OnDestroy,
  inject,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { of, Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/production.auth.service';

import { AdvancedFiltersComponent } from '../components/filters.component';
import { OpportunitiesGridComponent } from '../components/opportuniy-grid/opportunities-grid.component';
import { SearchStatsBarComponent } from './search-stats-bar.component';
import { EmptyStateComponent } from '../components/empty-state.component';
import { LoadingStateComponent } from './loading-state.component';

import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
import { OpportunitiesHeaderComponent } from '../components/opportunity-header/opportunities-header.component';
import { SmartSuggestionsModalComponent } from '../components/smart-suggestions/modal/smart-suggestions-modal.component';
import { LandingFooterComponent } from 'src/app/core/landing/footer/landing-footer.component';
import { LandingHeaderComponent } from 'src/app/core/landing/landing-header.component';
import { SMEOpportunitiesService } from '../../services/opportunities.service';

@Component({
  selector: 'app-funding-opportunities',
  standalone: true,
  imports: [
    CommonModule,
    LandingHeaderComponent,
    LandingFooterComponent,
    OpportunitiesHeaderComponent,
    SearchStatsBarComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    OpportunitiesGridComponent,
    AdvancedFiltersComponent,
    SmartSuggestionsModalComponent,
  ],
  templateUrl: './funding-opportunities.component.html',
})
export class FundingOpportunitiesComponent implements OnInit, OnDestroy {
  @ViewChild(SmartSuggestionsModalComponent)
  suggestionsModal?: SmartSuggestionsModalComponent;

  @ViewChild('opportunitiesGrid') opportunitiesGridRef?: ElementRef;

  private router = inject(Router);
  private opportunitiesService = inject(SMEOpportunitiesService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // State
  opportunities = signal<FundingOpportunity[]>([]);
  filteredOpportunities = signal<FundingOpportunity[]>([]);
  isLoading = signal(true);

  searchQuery = signal('');
  selectedFundingType = signal('');
  selectedIndustry = signal('');
  selectedCurrency = signal('');
  minAmount = signal('');
  maxAmount = signal('');

  // Check if user is authenticated
  isAuthenticated = computed(() => !!this.authService.user());
  currentUser = computed(() => this.authService.user());
  isUserFunder = computed(() => this.authService.user()?.userType === 'funder');

  ngOnInit() {
    this.loadOpportunities();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOpportunities() {
    this.isLoading.set(true);

    this.opportunitiesService
      .loadActiveOpportunities()
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error loading opportunities:', error);
          this.isLoading.set(false);
          return of([]);
        })
      )
      .subscribe({
        next: (opportunities) => {
          this.opportunities.set(opportunities);
          this.applyFilters();
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Subscription error:', error);
          this.isLoading.set(false);
          this.opportunities.set([]);
          this.applyFilters();
        },
      });
  }

  applyFilters() {
    let filtered = this.opportunities();

    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (opp) =>
          opp.title.toLowerCase().includes(query) ||
          opp.description.toLowerCase().includes(query) ||
          opp.shortDescription.toLowerCase().includes(query)
      );
    }

    if (this.selectedFundingType()) {
      const selectedType = this.selectedFundingType();
      filtered = filtered.filter(
        (opp) =>
          Array.isArray(opp.fundingType) &&
          opp.fundingType.includes(selectedType)
      );
    }

    if (this.selectedIndustry()) {
      filtered = filtered.filter((opp) =>
        opp.eligibilityCriteria.industries.includes(this.selectedIndustry())
      );
    }

    if (this.selectedCurrency()) {
      filtered = filtered.filter(
        (opp) => opp.currency === this.selectedCurrency()
      );
    }

    if (this.minAmount()) {
      const min = Number(this.minAmount());
      filtered = filtered.filter((opp) => opp.maxInvestment >= min);
    }

    if (this.maxAmount()) {
      const max = Number(this.maxAmount());
      filtered = filtered.filter((opp) => opp.minInvestment <= max);
    }

    filtered = filtered.filter((opp) => opp.status === 'active');

    this.filteredOpportunities.set(filtered);
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
    this.applyFilters();
  }

  onFundingTypeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedFundingType.set(target.value);
    this.applyFilters();
  }

  onIndustryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedIndustry.set(target.value);
    this.applyFilters();
  }

  onCurrencyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedCurrency.set(target.value);
    this.applyFilters();
  }

  onMinAmountChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.minAmount.set(target.value);
    this.applyFilters();
  }

  onMaxAmountChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.maxAmount.set(target.value);
    this.applyFilters();
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedFundingType.set('');
    this.selectedIndustry.set('');
    this.selectedCurrency.set('');
    this.minAmount.set('');
    this.maxAmount.set('');
    this.applyFilters();
  }

  refreshData() {
    this.loadOpportunities();
  }

  /**
   * Open smart suggestions modal (triggered from header or other source)
   */
  openSmartSuggestions() {
    this.suggestionsModal?.open();
  }

  /**
   * Handle navigation from modal
   */
  handleSuggestionApply(opportunityId: any) {
    if (typeof opportunityId === 'string') {
      this.applyToOpportunity(opportunityId);
    }
  }

  handleSuggestionViewDetails(opportunityId: any) {
    if (typeof opportunityId === 'string') {
      this.viewOpportunityDetails(opportunityId);
    }
  }

  handleSuggestionSignIn() {
    this.redirectToLogin();
  }

  handleViewAllOpportunities() {
    this.suggestionsModal?.close();
    // Scroll to opportunities grid
    setTimeout(() => {
      this.opportunitiesGridRef?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  }

  // ===== Original Navigation Methods =====

  canApplyToOpportunity(): boolean {
    const user = this.currentUser();
    return !!(user && user.userType === 'sme');
  }

  getUserTypeLabel(): string {
    const user = this.currentUser();
    if (!user) return 'Guest';
    return user.userType === 'sme'
      ? 'SME'
      : user.userType === 'funder'
      ? 'Funder'
      : 'User';
  }

  viewOpportunityDetails(opportunityId: string) {
    if (!this.currentUser()) {
      this.router.navigate(['/opportunity', opportunityId]);
    } else if (this.currentUser()?.userType === 'sme') {
      this.router.navigate(['/funding/opportunities', opportunityId]);
    } else if (this.currentUser()?.userType === 'funder') {
      this.router.navigate(['/funding/opportunities', opportunityId]);
    } else {
      this.router.navigate(['/opportunity', opportunityId]);
    }
  }

  applyToOpportunity(opportunityId: string) {
    if (!this.currentUser()) {
      this.router.navigate(['/funding/opportunities', opportunityId]);
      return;
    }

    this.router.navigate(['/applications/new'], {
      queryParams: { opportunityId },
    });
  }

  manageApplications(opportunityId: string) {
    this.router.navigate([
      '/funder/opportunities',
      opportunityId,
      'applications',
    ]);
  }

  redirectToLogin() {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url },
    });
  }
}
