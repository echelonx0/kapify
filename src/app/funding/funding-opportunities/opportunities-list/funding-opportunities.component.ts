// // funding-opportunities.component.ts - Updated Version
// import { Component, signal, OnInit, OnDestroy, inject, computed } from '@angular/core';
// import { Router } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { of, Subject } from 'rxjs';
// import { takeUntil, catchError } from 'rxjs/operators';
// import { AuthService } from 'src/app/auth/production.auth.service';
// import { FundingOpportunity } from 'src/app/shared/models/funder.models';
// import { SMEOpportunitiesService } from '../../services/opportunities.service';
// import { CategoryFiltersComponent } from './category-filters.component';
// import { AdvancedFiltersComponent } from './filters.component';
// import { LoadingStateComponent, EmptyStateComponent, InsightsWidgetComponent, NewsletterSignupComponent } from './loading-state.component';
// import { MarketplaceHeaderComponent } from './marketplace-header.component';
// import { OpportunitiesGridComponent } from './opportunities-grid.component';
// import { SearchStatsBarComponent } from './search-stats-bar.component';

 
 

// @Component({
//   selector: 'app-funding-opportunities',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MarketplaceHeaderComponent,
//     CategoryFiltersComponent,
//     SearchStatsBarComponent,
//     LoadingStateComponent,
//     EmptyStateComponent,
//     OpportunitiesGridComponent,
//     AdvancedFiltersComponent,
//     InsightsWidgetComponent,
//     NewsletterSignupComponent
//   ],
//   template: `
//     <div class="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/20">
      
//       <!-- Hero Header -->
//       <app-marketplace-header></app-marketplace-header>

//       <!-- Quick Category Filters -->
//       <app-category-filters 
//         [selectedType]="selectedFundingType()"
//         (typeSelected)="onCategorySelected($event)">
//       </app-category-filters>

//       <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
//           <!-- Main Content Area -->
//           <main class="lg:col-span-3 space-y-6">
            
//             <!-- Search and Stats Bar -->
//             <app-search-stats-bar
//               [searchQuery]="searchQuery()"
//               [totalResults]="filteredOpportunities().length"
//               [isLoading]="isLoading()"
//               (searchChanged)="onSearchChange($event)"
//               (refreshData)="refreshData()">
//             </app-search-stats-bar>

//             <!-- Loading State -->
//             <app-loading-state *ngIf="isLoading()"></app-loading-state>

//             <!-- Empty State -->
//             <app-empty-state 
//               *ngIf="!isLoading() && filteredOpportunities().length === 0"
//               (clearFilters)="clearFilters()">
//             </app-empty-state>

//             <!-- Opportunities Grid -->
//             <app-opportunities-grid
//               *ngIf="!isLoading() && filteredOpportunities().length > 0"
//               [opportunities]="filteredOpportunities()"
//               [userType]="getUserTypeLabel()"
//               [canApply]="canApplyToOpportunity()"
//               (apply)="applyToOpportunity($event)"
//               (viewDetails)="viewOpportunityDetails($event)"
//               (manage)="manageApplications($event)"
//               (signInToApply)="redirectToLogin()">
//             </app-opportunities-grid>

//           </main>

//           <!-- Enhanced Sidebar -->
//           <aside class="lg:col-span-1 space-y-6">
            
//             <!-- Advanced Filters -->
//             <app-advanced-filters
//               [selectedFundingType]="selectedFundingType()"
//               [selectedIndustry]="selectedIndustry()"
//               [selectedCurrency]="selectedCurrency()"
//               [minAmount]="minAmount()"
//               [maxAmount]="maxAmount()"
//               (fundingTypeChange)="onFundingTypeChange($event)"
//               (industryChange)="onIndustryChange($event)"
//               (currencyChange)="onCurrencyChange($event)"
//               (minAmountChange)="onMinAmountChange($event)"
//               (maxAmountChange)="onMaxAmountChange($event)"
//               (applyFilters)="applyFilters()"
//               (clearFilters)="clearFilters()">
//             </app-advanced-filters>

//             <!-- Insights Widget -->
//             <app-insights-widget></app-insights-widget>

//             <!-- Newsletter Signup -->
//             <app-newsletter-signup></app-newsletter-signup>

//           </aside>
//         </div>
//       </div>
//     </div>
//   `
// })
// export class FundingOpportunitiesComponent implements OnInit, OnDestroy {
//   // Services
//   private router = inject(Router);
//   private opportunitiesService = inject(SMEOpportunitiesService);
//   private authService = inject(AuthService);
//   private destroy$ = new Subject<void>();

//   // State
//   opportunities = signal<FundingOpportunity[]>([]);
//   filteredOpportunities = signal<FundingOpportunity[]>([]);
//   isLoading = signal(true);
  
//   // Filter state
//   searchQuery = signal('');
//   selectedFundingType = signal('');
//   selectedIndustry = signal('');
//   selectedCurrency = signal('');
//   minAmount = signal('');
//   maxAmount = signal('');

//   // Computed user context
//   currentUser = computed(() => this.authService.user());

//   ngOnInit() {
//     this.loadOpportunities();
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   loadOpportunities() {
//     this.isLoading.set(true);
    
//     this.opportunitiesService.loadActiveOpportunities().pipe(
//       takeUntil(this.destroy$),
//       catchError(error => {
//         console.error('Error loading opportunities:', error);
//         this.isLoading.set(false);
//         return of([]);
//       })
//     ).subscribe({
//       next: (opportunities) => {
//         this.opportunities.set(opportunities);
//         this.applyFilters();
//         this.isLoading.set(false);
//       },
//       error: (error) => {
//         console.error('Subscription error:', error);
//         this.isLoading.set(false);
//         this.opportunities.set([]);
//         this.applyFilters();
//       }
//     });
//   }

//   applyFilters() {
//     let filtered = this.opportunities();

//     // Search filter
//     const query = this.searchQuery().toLowerCase();
//     if (query) {
//       filtered = filtered.filter(opp => 
//         opp.title.toLowerCase().includes(query) ||
//         opp.description.toLowerCase().includes(query) ||
//         opp.shortDescription.toLowerCase().includes(query)
//       );
//     }

//     // Funding type filter
//     if (this.selectedFundingType()) {
//       filtered = filtered.filter(opp => opp.fundingType === this.selectedFundingType());
//     }

//     // Industry filter
//     if (this.selectedIndustry()) {
//       filtered = filtered.filter(opp => 
//         opp.eligibilityCriteria.industries.includes(this.selectedIndustry())
//       );
//     }

//     // Currency filter
//     if (this.selectedCurrency()) {
//       filtered = filtered.filter(opp => opp.currency === this.selectedCurrency());
//     }

//     // Amount filters
//     if (this.minAmount()) {
//       const min = Number(this.minAmount());
//       filtered = filtered.filter(opp => opp.maxInvestment >= min);
//     }

//     if (this.maxAmount()) {
//       const max = Number(this.maxAmount());
//       filtered = filtered.filter(opp => opp.minInvestment <= max);
//     }

//     // Only show active opportunities
//     filtered = filtered.filter(opp => opp.status === 'active');

//     this.filteredOpportunities.set(filtered);
//   }

//   // ===============================
//   // EVENT HANDLERS
//   // ===============================

//   onCategorySelected(type: string) {
//     this.selectedFundingType.set(type);
//     this.applyFilters();
//   }

//   onSearchChange(query: string) {
//     this.searchQuery.set(query);
//     this.applyFilters();
//   }

//   onFundingTypeChange(event: Event) {
//     const target = event.target as HTMLSelectElement;
//     this.selectedFundingType.set(target.value);
//     this.applyFilters();
//   }

//   onIndustryChange(event: Event) {
//     const target = event.target as HTMLSelectElement;
//     this.selectedIndustry.set(target.value);
//     this.applyFilters();
//   }

//   onCurrencyChange(event: Event) {
//     const target = event.target as HTMLSelectElement;
//     this.selectedCurrency.set(target.value);
//     this.applyFilters();
//   }

//   onMinAmountChange(event: Event) {
//     const target = event.target as HTMLInputElement;
//     this.minAmount.set(target.value);
//     this.applyFilters();
//   }

//   onMaxAmountChange(event: Event) {
//     const target = event.target as HTMLInputElement;
//     this.maxAmount.set(target.value);
//     this.applyFilters();
//   }

//   clearFilters() {
//     this.searchQuery.set('');
//     this.selectedFundingType.set('');
//     this.selectedIndustry.set('');
//     this.selectedCurrency.set('');
//     this.minAmount.set('');
//     this.maxAmount.set('');
//     this.applyFilters();
//   }

//   refreshData() {
//     this.loadOpportunities();
//   }

//   // ===============================
//   // PERMISSION METHODS
//   // ===============================

//   canApplyToOpportunity(): boolean {
//     const user = this.currentUser();
//     return !!(user && user.userType === 'sme');
//   }

//   getUserTypeLabel(): string {
//     const user = this.currentUser();
//     if (!user) return 'Guest';
//     return user.userType === 'sme' ? 'SME' : user.userType === 'funder' ? 'Funder' : 'User';
//   }

//   // ===============================
//   // NAVIGATION METHODS
//   // ===============================

//   viewOpportunityDetails(opportunityId: string) {
//     this.router.navigate(['/funding/opportunities', opportunityId]);
//   }

//   applyToOpportunity(opportunityId: string) {
//     this.router.navigate(['/applications/new'], { 
//       queryParams: { opportunityId } 
//     });
//   }

//   manageApplications(opportunityId: string) {
//     this.router.navigate(['/funder/opportunities', opportunityId, 'applications']);
//   }

//   redirectToLogin() {
//     this.router.navigate(['/auth/login'], {
//       queryParams: { returnUrl: this.router.url }
//     });
//   }
// }