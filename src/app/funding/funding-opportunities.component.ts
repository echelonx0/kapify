// src/app/funding/funding-opportunities.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarNavComponent } from '../shared/components/sidebar-nav.component';
import { UiButtonComponent } from '../shared/components';
import { LucideAngularModule, Search, Filter, DollarSign, Calendar, MapPin, Building, TrendingUp, Eye, FileText, Users } from 'lucide-angular';
 
import { FundingOpportunity } from '../shared/models/funder.models';
import { OpportunitiesService } from './services/opportunities.service';

@Component({
  selector: 'app-funding-opportunities',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarNavComponent,  
    UiButtonComponent,
  
    LucideAngularModule
  ],
  templateUrl: 'funding-opportunities.component.html'
})
export class FundingOpportunitiesComponent implements OnInit {
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

  // Mock user state - replace with actual auth service
  currentUserId = 'user-001';
  userApplications = signal<string[]>(['opp-001']); // Mock existing applications

  constructor(
    private router: Router,
    private opportunitiesService: OpportunitiesService
  ) {}

  ngOnInit() {
    this.loadOpportunities();
  }

  loadOpportunities() {
    this.isLoading.set(true);
    this.opportunitiesService.getOpportunities().subscribe({
      next: (opportunities) => {
        this.opportunities.set(opportunities);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading opportunities:', error);
        this.isLoading.set(false);
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

  // Event handlers
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

  // Navigation methods - UPDATED TO MATCH ROUTING STRUCTURE
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  viewOpportunityDetails(opportunityId: string) {
    this.router.navigate(['/funding/opportunities', opportunityId]);
  }

  applyToOpportunity(opportunityId: string) {
    this.router.navigate(['/applications/new'], { 
      queryParams: { opportunityId } 
    });
  }

  viewApplication(opportunityId: string) {
    // Find existing application for this opportunity
    this.router.navigate(['/applications']);
  }

  manageApplications(opportunityId: string) {
    this.router.navigate(['/funder-dashboard/opportunities', opportunityId, 'applications']);
  }

  // Helper methods
  isOwner(opportunity: FundingOpportunity): boolean {
    return opportunity.dealLead === this.currentUserId;
  }

  hasExistingApplication(opportunityId: string): boolean {
    return this.userApplications().includes(opportunityId);
  }

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