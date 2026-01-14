import {
  Component,
  signal,
  OnInit,
  OnDestroy,
  inject,
  computed,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { of, Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { AdvancedFiltersComponent } from '../components/marketplace-filters/marketplace-filters.component';
import { OpportunitiesGridComponent } from '../components/opportuniy-grid/opportunities-grid.component';
import { SearchStatsBarComponent } from './search-stats-bar.component';
import { EmptyStateComponent } from '../components/empty-state.component';
import { LoadingStateComponent } from './loading-state.component';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
import { OpportunitiesHeaderComponent } from '../components/opportunity-header/opportunities-header.component';
import { SmartSuggestionsModalComponent } from '../components/smart-suggestions/modal/smart-suggestions-modal.component';
import { LandingFooterComponent } from 'src/app/core/landing/footer/landing-footer.component';
import { LandingHeaderComponent } from 'src/app/core/landing/components/landing-header.component';
import { SMEOpportunitiesService } from '../../services/opportunities.service';
import { OpportunityApplicationService } from 'src/app/fund-seeking-orgs/services/opportunity-application.service';

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
  private applicationService = inject(OpportunityApplicationService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // State
  opportunities = signal<FundingOpportunity[]>([]);
  filteredOpportunities = signal<FundingOpportunity[]>([]);
  applications = signal<any[]>([]);
  isLoading = signal(true);

  searchQuery = signal('');
  selectedFundingType = signal('');
  selectedIndustry = signal('');
  selectedCurrency = signal('');
  minAmount = signal('');
  maxAmount = signal('');

  // Pagination state
  currentPage = signal(1);
  pageSize = signal(3);
  isMobile = signal(window.innerWidth < 1024);

  // Computed values
  isAuthenticated = computed(() => !!this.authService.user());
  currentUser = computed(() => this.authService.user());
  isUserFunder = computed(() => this.authService.user()?.userType === 'funder');

  // Application status map (O(1) lookup)
  applicationsMap = computed(() => {
    const apps = this.applications();
    const map = new Map<string, boolean>();
    apps.forEach((app) => {
      if (app.opportunityId) {
        map.set(app.opportunityId, true);
      }
    });
    return map;
  });

  totalPages = computed(() =>
    Math.ceil(this.filteredOpportunities().length / this.pageSize())
  );

  paginatedOpportunities = computed(() => {
    const startIdx = (this.currentPage() - 1) * this.pageSize();
    const endIdx = startIdx + this.pageSize();
    return this.filteredOpportunities().slice(startIdx, endIdx);
  });

  // Enrich opportunities with application status
  paginatedOpportunitiesWithStatus = computed(() => {
    return this.paginatedOpportunities().map((opp) => ({
      ...opp,
      userHasApplied: this.applicationsMap().has(opp.id),
    }));
  });

  pageRange = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const range = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 5; i++) range.push(i);
      } else if (current >= total - 2) {
        for (let i = total - 4; i <= total; i++) range.push(i);
      } else {
        for (let i = current - 2; i <= current + 2; i++) range.push(i);
      }
    }
    return range;
  });

  getPaginationText = computed(() => {
    const total = this.filteredOpportunities().length;
    const pageSize = this.pageSize();
    const current = this.currentPage();
    const startIdx = (current - 1) * pageSize + 1;
    const endIdx = Math.min(current * pageSize, total);

    if (total === 0) return 'No opportunities';
    return `Showing ${startIdx}–${endIdx} of ${total} opportunities`;
  });

  ngOnInit() {
    this.loadApplicationsAndOpportunities();

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event: Event) {
    const newIsMobile = window.innerWidth < 1024;
    const wasDesktop = !this.isMobile();
    const isNowDesktop = !newIsMobile;

    if (wasDesktop !== isNowDesktop) {
      this.isMobile.set(newIsMobile);
      this.pageSize.set(newIsMobile ? 2 : 3);
      this.currentPage.set(1);
    }
  }

  private loadApplicationsAndOpportunities() {
    this.isLoading.set(true);

    if (this.isAuthenticated()) {
      this.applicationService
        .loadUserApplications()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (apps) => {
            this.applications.set(apps);
            console.log(`Applied to ${apps} Applications`);
            this.loadOpportunities();
          },
          error: (error) => {
            console.warn('Failed to load user applications:', error);
            this.applications.set([]);

            this.loadOpportunities();
          },
        });
    } else {
      this.loadOpportunities();
    }
  }

  private loadOpportunities() {
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
          this.currentPage.set(1);
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
    this.currentPage.set(1);
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
    this.loadApplicationsAndOpportunities();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.opportunitiesGridRef?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  /**
   * DEBUG: Test method to open modal
   */
  testOpenModal() {
    console.log('[TEST] testOpenModal called');
    console.log('[TEST] suggestionsModal exists?', !!this.suggestionsModal);
    console.log('[TEST] suggestionsModal ref:', this.suggestionsModal);

    if (this.suggestionsModal) {
      console.log('[TEST] Calling open() on modal');
      this.suggestionsModal.open();
    } else {
      console.error(
        '[TEST] ❌ suggestionsModal is undefined - ViewChild not working'
      );
    }
  }

  openSmartSuggestions() {
    console.log('[Modal] openSmartSuggestions() called');
    console.log('[Modal] suggestionsModal:', this.suggestionsModal);
    this.suggestionsModal?.open();
  }

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
    setTimeout(() => {
      this.opportunitiesGridRef?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  }

  // ===== Navigation Methods =====

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
