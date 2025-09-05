 // src/app/funding/funding-opportunities.component.ts 
import { Component, signal, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Filter, DollarSign, Calendar, MapPin, Building, TrendingUp, Eye, FileText, Users, RefreshCw, AlertCircle } from 'lucide-angular';
import { of, Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';

import { AuthService } from '../../auth/production.auth.service';
import { UiButtonComponent } from '../../shared/components';
import { FundingOpportunity } from '../../shared/models/funder.models';
import { SMEOpportunitiesService } from '../services/opportunities.service';
import { OpportunityCardComponent } from './components/opportunity-card.component';

@Component({
  selector: 'app-funding-opportunities',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiButtonComponent,
    LucideAngularModule,
    OpportunityCardComponent
  ],
  templateUrl: 'funding-opportunities.component.html',
  styles: [`
    @keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 10s ease infinite;
}
`]
})
export class FundingOpportunitiesComponent implements OnInit, OnDestroy {
  // Services
  private router = inject(Router);
  private opportunitiesService = inject(SMEOpportunitiesService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // Icons
  SearchIcon = Search;
  FilterIcon = Filter;
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  MapPinIcon = MapPin;
  BuildingIcon = Building;
  TrendingUpIcon = TrendingUp;
  EyeIcon = Eye;
  FileTextIcon = FileText;
  UsersIcon = Users;
  RefreshCwIcon = RefreshCw;
  AlertCircleIcon = AlertCircle;

  // State
  opportunities = signal<FundingOpportunity[]>([]);
  filteredOpportunities = signal<FundingOpportunity[]>([]);
  isLoading = signal(true);
  
  // Filter state
  searchQuery = signal('');
  showFilters = signal(false);
  selectedFundingType = signal('');
  selectedIndustry = signal('');
  selectedCurrency = signal('');
  minAmount = signal('');
  maxAmount = signal('');

  // Computed user context
  currentUser = computed(() => this.authService.user());

  ngOnInit() {
    this.loadOpportunities();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOpportunities() {
    this.isLoading.set(true);
    
    this.opportunitiesService.loadActiveOpportunities().pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        console.error('Error loading opportunities:', error);
        this.isLoading.set(false);
        return of([]); // Return empty array to prevent infinite loading
      })
    ).subscribe({
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
      }
    });
  }

  applyFilters() {
    let filtered = this.opportunities();

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(opp => 
        opp.title.toLowerCase().includes(query) ||
        opp.description.toLowerCase().includes(query) ||
        opp.shortDescription.toLowerCase().includes(query)
      );
    }

    // Funding type filter
    if (this.selectedFundingType()) {
      filtered = filtered.filter(opp => opp.fundingType === this.selectedFundingType());
    }

    // Industry filter
    if (this.selectedIndustry()) {
      filtered = filtered.filter(opp => 
        opp.eligibilityCriteria.industries.includes(this.selectedIndustry())
      );
    }

    // Currency filter
    if (this.selectedCurrency()) {
      filtered = filtered.filter(opp => opp.currency === this.selectedCurrency());
    }

    // Amount filters
    if (this.minAmount()) {
      const min = Number(this.minAmount());
      filtered = filtered.filter(opp => opp.maxInvestment >= min);
    }

    if (this.maxAmount()) {
      const max = Number(this.maxAmount());
      filtered = filtered.filter(opp => opp.minInvestment <= max);
    }

    // Only show active opportunities
    filtered = filtered.filter(opp => opp.status === 'active');

    this.filteredOpportunities.set(filtered);
  }

  // ===============================
  // SIMPLE PERMISSION METHODS
  // ===============================

canApplyToOpportunity(): boolean {
  const user = this.currentUser();
  return !!(user && user.userType === 'sme');
}

  canManageOpportunity(opportunity: FundingOpportunity): boolean {
    const user = this.currentUser();
    if (!user || user.userType !== 'funder') return false;
    
    // Simple check - user is the deal lead
    return opportunity.dealLead === user.id;
  }

  getUserTypeLabel(): string {
    const user = this.currentUser();
    if (!user) return 'Guest';
    return user.userType === 'sme' ? 'SME' : user.userType === 'funder' ? 'Funder' : 'User';
  }

  // ===============================
  // EVENT HANDLERS
  // ===============================

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
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

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedFundingType.set('');
    this.selectedIndustry.set('');
    this.selectedCurrency.set('');
    this.minAmount.set('');
    this.maxAmount.set('');
    this.showFilters.set(false);
    this.applyFilters();
  }

  refreshData() {
    this.loadOpportunities();
  }

  // ===============================
  // NAVIGATION METHODS
  // ===============================

  viewOpportunityDetails(opportunityId: string) {
    this.router.navigate(['/funding/opportunities', opportunityId]);
  }

  applyToOpportunity(opportunityId: string) {
    this.router.navigate(['/applications/new'], { 
      queryParams: { opportunityId } 
    });
  }

 

  manageApplications(opportunityId: string) {
    this.router.navigate(['/funder/opportunities', opportunityId, 'applications']);
  }

  redirectToLogin() {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  // ===============================
  // HELPER METHODS
  // ===============================

  getInitials(title: string): string {
    return title
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getFundingTypeClasses(type: string): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (type) {
      case 'equity':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'debt':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'mezzanine':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'grant':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'convertible':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      default:
        return `${baseClasses} bg-neutral-100 text-neutral-800`;
    }
  }

  formatFundingType(type: string): string {
    const types: Record<string, string> = {
      equity: 'Equity',
      debt: 'Debt',
      mezzanine: 'Mezzanine',
      grant: 'Grant',
      convertible: 'Convertible'
    };
    return types[type] || type;
  }

  formatIndustry(industry: string): string {
    return industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  }

  formatLocations(locations: string[]): string {
    const formatted = locations.map(loc => 
      loc.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
    
    if (formatted.length <= 2) {
      return formatted.join(' and ');
    }
    
    return `${formatted.slice(0, 2).join(', ')} and ${formatted.length - 2} more`;
  }

  getProgressPercentage(opportunity: FundingOpportunity): number {
    if (opportunity.totalAvailable === 0) return 0;
    return Math.min((opportunity.amountDeployed / opportunity.totalAvailable) * 100, 100);
  }
}