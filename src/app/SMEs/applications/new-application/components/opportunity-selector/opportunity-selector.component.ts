// src/app/applications/components/new-application/components/opportunity-selector/opportunity-selector.component.ts
import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  CheckCircle,
  AlertCircle,
  Building,
  Search,
  Filter,
} from 'lucide-angular';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

interface FilterOptions {
  fundingType: string[];
  minAmount: number | null;
  maxAmount: number | null;
  searchQuery: string;
}

@Component({
  selector: 'app-opportunity-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './opportunity-selector.component.html',
})
export class OpportunitySelectorComponent {
  // ===============================
  // INPUTS & OUTPUTS
  // ===============================

  opportunities = input.required<FundingOpportunity[]>();
  selectedOpportunityId = input<string | null | undefined>(null);
  isLoading = input<boolean>(false);

  opportunitySelected = output<FundingOpportunity>();
  backClicked = output<void>();

  // ===============================
  // ICONS
  // ===============================

  BuildingIcon = Building;
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  SearchIcon = Search;
  FilterIcon = Filter;

  // ===============================
  // STATE
  // ===============================

  filters = signal<FilterOptions>({
    fundingType: [],
    minAmount: null,
    maxAmount: null,
    searchQuery: '',
  });

  showFilters = signal(false);

  // ===============================
  // COMPUTED
  // ===============================

  filteredOpportunities = computed(() => {
    const filterState = this.filters();
    const allOps = this.opportunities();

    return allOps.filter((op) => {
      // Search filter
      if (filterState.searchQuery) {
        const query = filterState.searchQuery.toLowerCase();
        const matchesTitle = op.title.toLowerCase().includes(query);
        const matchesDesc = op.shortDescription?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Funding type filter
      if (filterState.fundingType.length > 0) {
        const opTypes = Array.isArray(op.fundingType)
          ? op.fundingType
          : [op.fundingType];
        const hasMatch = opTypes.some((type) =>
          filterState.fundingType.includes(type)
        );
        if (!hasMatch) return false;
      }

      // Amount filters
      if (filterState.minAmount !== null) {
        if (op.maxInvestment < filterState.minAmount) return false;
      }

      if (filterState.maxAmount !== null) {
        if (op.minInvestment > filterState.maxAmount) return false;
      }

      return true;
    });
  });

  hasActiveFilters = computed(() => {
    const f = this.filters();
    return (
      f.fundingType.length > 0 ||
      f.minAmount !== null ||
      f.maxAmount !== null ||
      f.searchQuery.length > 0
    );
  });

  availableFundingTypes = computed(() => {
    const types = new Set<string>();
    this.opportunities().forEach((op) => {
      if (Array.isArray(op.fundingType)) {
        op.fundingType.forEach((t) => types.add(t));
      } else {
        types.add(op.fundingType);
      }
    });
    return Array.from(types).sort();
  });

  // ===============================
  // METHODS
  // ===============================

  selectOpportunity(opportunity: FundingOpportunity): void {
    this.opportunitySelected.emit(opportunity);
  }

  goBack(): void {
    this.backClicked.emit();
  }

  formatCurrency(amount: number, currency: string = 'ZAR'): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  getOrganizationName(opportunity: FundingOpportunity): string {
    return (
      opportunity.funderOrganizationName ||
      opportunity.title ||
      'Private Funder'
    );
  }

  toggleFundingTypeFilter(type: string): void {
    this.filters.update((f) => {
      const types = f.fundingType.includes(type)
        ? f.fundingType.filter((t) => t !== type)
        : [...f.fundingType, type];
      return { ...f, fundingType: types };
    });
  }

  updateSearchQuery(query: string): void {
    this.filters.update((f) => ({ ...f, searchQuery: query }));
  }

  updateMinAmount(amount: string): void {
    const num = amount ? parseFloat(amount) : null;
    this.filters.update((f) => ({ ...f, minAmount: num }));
  }

  updateMaxAmount(amount: string): void {
    const num = amount ? parseFloat(amount) : null;
    this.filters.update((f) => ({ ...f, maxAmount: num }));
  }

  clearFilters(): void {
    this.filters.set({
      fundingType: [],
      minAmount: null,
      maxAmount: null,
      searchQuery: '',
    });
  }

  formatFundingType(type: string | string[]): string {
    const typeStr = typeof type === 'string' ? type : type[0];
    const formatted: Record<string, string> = {
      debt: 'Debt',
      equity: 'Equity',
      convertible: 'Convertible',
      mezzanine: 'Mezzanine',
      grant: 'Grant',
      purchase_order: 'Purchase Order',
      invoice_financing: 'Invoice Financing',
    };
    return formatted[typeStr] || typeStr;
  }

  getInvestmentRangeDisplay(opportunity: FundingOpportunity): string {
    const min = this.formatCurrency(
      opportunity.minInvestment,
      opportunity.currency
    );
    const max = this.formatCurrency(
      opportunity.maxInvestment,
      opportunity.currency
    );
    return `${min} - ${max}`;
  }

  getEligibilitySummary(opportunity: FundingOpportunity): string[] {
    const summary: string[] = [];

    if (opportunity.eligibilityCriteria?.industries?.length) {
      summary.push(
        `Industries: ${opportunity.eligibilityCriteria.industries.join(', ')}`
      );
    }

    if (opportunity.eligibilityCriteria?.minRevenue) {
      summary.push(
        `Min Revenue: ${this.formatCurrency(
          opportunity.eligibilityCriteria.minRevenue,
          opportunity.currency
        )}`
      );
    }

    if (opportunity.eligibilityCriteria?.minYearsOperation) {
      summary.push(
        `Min Years: ${opportunity.eligibilityCriteria.minYearsOperation}`
      );
    }

    return summary.slice(0, 2); // Show max 2 criteria
  }

  getRiskIndicator(opportunity: FundingOpportunity): {
    level: string;
    color: string;
  } {
    // Simple risk calculation based on investment range and terms
    const spreadPercent =
      ((opportunity.maxInvestment - opportunity.minInvestment) /
        opportunity.maxInvestment) *
      100;

    if (spreadPercent < 20) {
      return { level: 'Low Risk', color: 'text-green-600' };
    } else if (spreadPercent < 50) {
      return { level: 'Medium Risk', color: 'text-amber-600' };
    } else {
      return { level: 'Higher Risk', color: 'text-red-600' };
    }
  }

  /**
   * ✅ KAPIFY DESIGN SYSTEM COLORS
   * Updated badge colors to match design system:
   * - Removed non-system colors (purple, cyan, orange, indigo)
   * - Using only: teal, slate, green, amber, red, blue
   */
  getFundingTypeColor(type: string | string[]): string {
    const typeStr = typeof type === 'string' ? type : type[0];
    const colors: Record<string, string> = {
      equity: 'bg-blue-50 text-blue-700',
      debt: 'bg-teal-50 text-teal-700',
      convertible: 'bg-amber-50 text-amber-700',
      mezzanine: 'bg-amber-100 text-amber-700',
      grant: 'bg-green-50 text-green-700',
      purchase_order: 'bg-slate-100 text-slate-700',
      invoice_financing: 'bg-blue-50 text-blue-700',
    };
    return colors[typeStr] || 'bg-slate-100 text-slate-700';
  }

  isArrayFundingType(value: unknown): boolean {
    return Array.isArray(value);
  }
}
