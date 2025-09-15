// advanced-filters.component.ts - Fixed and cleaned up
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Filter, RefreshCw, Search, ChevronDown } from 'lucide-angular';

@Component({
  selector: 'app-advanced-filters',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bg-white" (click)="closeAllDropdowns($event)">
      <!-- Filter Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center">
          <lucide-icon [img]="FilterIcon" [size]="20" class="mr-3 text-slate-600" />
          <h3 class="text-lg font-semibold text-slate-900">Filter Opportunities</h3>
          <span class="ml-3 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md font-medium border border-emerald-200">
            Advanced Search
          </span>
        </div>
        
        <!-- Clear All Button -->
        <button 
          *ngIf="hasActiveFilters()"
          (click)="clearAllFilters()"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors duration-200 border border-slate-200">
          <lucide-icon [img]="RefreshCwIcon" [size]="16" />
          Clear All
        </button>
      </div>

      <!-- Horizontal Filters Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        
        <!-- Funding Type Filter -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-slate-700">
            Funding Type
          </label>
          <div class="relative">
            <button 
              (click)="toggleDropdown('fundingType', $event)"
              class="w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-left text-sm text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200">
              <span *ngIf="activeFundingTypes.length === 0" class="text-slate-500">Select types...</span>
              <span *ngIf="activeFundingTypes.length === 1">{{ formatFundingType(activeFundingTypes[0]) }}</span>
              <span *ngIf="activeFundingTypes.length > 1">{{ activeFundingTypes.length }} types selected</span>
              <lucide-icon [img]="ChevronDownIcon" [size]="16" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            </button>
            
            <div *ngIf="dropdownStates.fundingType" class="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg">
              <div class="p-2 space-y-1 max-h-48 overflow-y-auto">
                <label *ngFor="let type of fundingTypes" class="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <input 
                    type="checkbox" 
                    [checked]="activeFundingTypes.includes(type.value)"
                    (change)="toggleFundingType(type.value)"
                    class="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded">
                  <span class="ml-3 text-sm text-slate-700">{{ type.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Industry Filter -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-slate-700">
            Industry
          </label>
          <div class="relative">
            <button 
              (click)="toggleDropdown('industry', $event)"
              class="w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-left text-sm text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200">
              <span *ngIf="activeIndustries.length === 0" class="text-slate-500">Select industries...</span>
              <span *ngIf="activeIndustries.length === 1">{{ formatIndustry(activeIndustries[0]) }}</span>
              <span *ngIf="activeIndustries.length > 1">{{ activeIndustries.length }} industries selected</span>
              <lucide-icon [img]="ChevronDownIcon" [size]="16" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            </button>
            
            <div *ngIf="dropdownStates.industry" class="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg">
              <div class="p-2 space-y-1 max-h-48 overflow-y-auto">
                <label *ngFor="let industry of industries" class="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <input 
                    type="checkbox" 
                    [checked]="activeIndustries.includes(industry.value)"
                    (change)="toggleIndustry(industry.value)"
                    class="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded">
                  <span class="ml-3 text-sm text-slate-700">{{ industry.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Currency Filter -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-slate-700">
            Currency
          </label>
          <div class="relative">
            <button 
              (click)="toggleDropdown('currency', $event)"
              class="w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-left text-sm text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200">
              <span *ngIf="activeCurrencies.length === 0" class="text-slate-500">Select currencies...</span>
              <span *ngIf="activeCurrencies.length === 1">{{ activeCurrencies[0] }}</span>
              <span *ngIf="activeCurrencies.length > 1">{{ activeCurrencies.length }} currencies selected</span>
              <lucide-icon [img]="ChevronDownIcon" [size]="16" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            </button>
            
            <div *ngIf="dropdownStates.currency" class="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg">
              <div class="p-2 space-y-1">
                <label *ngFor="let currency of currencies" class="flex items-center p-2 hover:bg-slate-50 rounded cursor-pointer">
                  <input 
                    type="checkbox" 
                    [checked]="activeCurrencies.includes(currency.value)"
                    (change)="toggleCurrency(currency.value)"
                    class="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded">
                  <span class="ml-3 text-sm text-slate-700">{{ currency.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Amount Range - Min -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-slate-700">
            Min Amount
          </label>
          <input 
            type="number" 
            placeholder="0"
            [value]="minAmount"
            (input)="onMinAmountChange($event)"
            class="w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-sm text-slate-700 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>

        <!-- Amount Range - Max -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-slate-700">
            Max Amount
          </label>
          <input 
            type="number" 
            placeholder="No limit"
            [value]="maxAmount"
            (input)="onMaxAmountChange($event)"
            class="w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-sm text-slate-700 placeholder-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
      </div>

      <!-- Active Filters Summary -->
      <div *ngIf="hasActiveFilters()" class="bg-emerald-50 border border-emerald-200 rounded-md p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center flex-wrap gap-3">
            <span class="text-sm font-medium text-emerald-800">Active Filters:</span>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let type of activeFundingTypes" class="inline-flex items-center gap-1 px-3 py-1 bg-white text-emerald-700 rounded-md text-sm border border-emerald-200">
                {{ formatFundingType(type) }}
                <button (click)="toggleFundingType(type)" class="ml-1 hover:text-emerald-900 text-emerald-500 font-semibold">×</button>
              </span>
              <span *ngFor="let industry of activeIndustries" class="inline-flex items-center gap-1 px-3 py-1 bg-white text-emerald-700 rounded-md text-sm border border-emerald-200">
                {{ formatIndustry(industry) }}
                <button (click)="toggleIndustry(industry)" class="ml-1 hover:text-emerald-900 text-emerald-500 font-semibold">×</button>
              </span>
              <span *ngFor="let currency of activeCurrencies" class="inline-flex items-center gap-1 px-3 py-1 bg-white text-emerald-700 rounded-md text-sm border border-emerald-200">
                {{ currency }}
                <button (click)="toggleCurrency(currency)" class="ml-1 hover:text-emerald-900 text-emerald-500 font-semibold">×</button>
              </span>
              <span *ngIf="minAmount || maxAmount" class="inline-flex items-center gap-1 px-3 py-1 bg-white text-emerald-700 rounded-md text-sm border border-emerald-200">
                {{ formatAmountRange() }}
                <button (click)="clearAmountRange()" class="ml-1 hover:text-emerald-900 text-emerald-500 font-semibold">×</button>
              </span>
            </div>
          </div>
          
          <button 
            (click)="applyFilters.emit()"
            class="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200 shadow-sm">
            <lucide-icon [img]="SearchIcon" [size]="16" />
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  `
})
export class AdvancedFiltersComponent implements OnInit, OnChanges {
  // Input properties for backward compatibility
  @Input() selectedFundingType: string = '';
  @Input() selectedIndustry: string = '';
  @Input() selectedCurrency: string = '';
  @Input() minAmount: string = '';
  @Input() maxAmount: string = '';

  // Output events for backward compatibility
  @Output() fundingTypeChange = new EventEmitter<Event>();
  @Output() industryChange = new EventEmitter<Event>();
  @Output() currencyChange = new EventEmitter<Event>();
  @Output() minAmountChange = new EventEmitter<Event>();
  @Output() maxAmountChange = new EventEmitter<Event>();
  @Output() applyFilters = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  // Icons
  FilterIcon = Filter;
  RefreshCwIcon = RefreshCw;
  SearchIcon = Search;
  ChevronDownIcon = ChevronDown;

  // Internal state for multi-select
  activeFundingTypes: string[] = [];
  activeIndustries: string[] = [];
  activeCurrencies: string[] = [];

  // Dropdown state
  dropdownStates = {
    fundingType: false,
    industry: false,
    currency: false
  };

  // Options data
  fundingTypes = [
    { value: 'equity', label: 'Equity' },
    { value: 'debt', label: 'Debt' },
    { value: 'grant', label: 'Grant' },
    { value: 'mezzanine', label: 'Mezzanine' },
    { value: 'convertible', label: 'Convertible' }
  ];

  industries = [
    { value: 'technology', label: 'Technology' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'financial_services', label: 'Financial Services' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'renewable_energy', label: 'Renewable Energy' },
    { value: 'education', label: 'Education' }
  ];

  currencies = [
    { value: 'ZAR', label: 'ZAR (South African Rand)' },
    { value: 'USD', label: 'USD (US Dollar)' },
    { value: 'EUR', label: 'EUR (Euro)' },
    { value: 'GBP', label: 'GBP (British Pound)' }
  ];

  ngOnInit() {
    this.initializeFromInputs();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedFundingType'] || changes['selectedIndustry'] || changes['selectedCurrency']) {
      this.initializeFromInputs();
    }
  }

  private initializeFromInputs() {
    this.activeFundingTypes = this.selectedFundingType ? [this.selectedFundingType] : [];
    this.activeIndustries = this.selectedIndustry ? [this.selectedIndustry] : [];
    this.activeCurrencies = this.selectedCurrency ? [this.selectedCurrency] : [];
  }

  toggleDropdown(dropdown: keyof typeof this.dropdownStates, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    // Close all other dropdowns
    Object.keys(this.dropdownStates).forEach(key => {
      if (key !== dropdown) {
        this.dropdownStates[key as keyof typeof this.dropdownStates] = false;
      }
    });
    
    this.dropdownStates[dropdown] = !this.dropdownStates[dropdown];
  }

  closeAllDropdowns(event?: Event) {
    Object.keys(this.dropdownStates).forEach(key => {
      this.dropdownStates[key as keyof typeof this.dropdownStates] = false;
    });
  }

  toggleFundingType(type: string) {
    const isSelected = this.activeFundingTypes.includes(type);
    
    if (isSelected) {
      this.activeFundingTypes = this.activeFundingTypes.filter(t => t !== type);
    } else {
      this.activeFundingTypes = [...this.activeFundingTypes, type];
    }
    
    // Emit backward compatible event with first selected value or empty
    const event = { target: { value: this.activeFundingTypes[0] || '' } } as any;
    this.fundingTypeChange.emit(event);
  }

  toggleIndustry(industry: string) {
    const isSelected = this.activeIndustries.includes(industry);
    
    if (isSelected) {
      this.activeIndustries = this.activeIndustries.filter(i => i !== industry);
    } else {
      this.activeIndustries = [...this.activeIndustries, industry];
    }
    
    // Emit backward compatible event with first selected value or empty
    const event = { target: { value: this.activeIndustries[0] || '' } } as any;
    this.industryChange.emit(event);
  }

  toggleCurrency(currency: string) {
    const isSelected = this.activeCurrencies.includes(currency);
    
    if (isSelected) {
      this.activeCurrencies = this.activeCurrencies.filter(c => c !== currency);
    } else {
      this.activeCurrencies = [...this.activeCurrencies, currency];
    }
    
    // Emit backward compatible event with first selected value or empty
    const event = { target: { value: this.activeCurrencies[0] || '' } } as any;
    this.currencyChange.emit(event);
  }

  onMinAmountChange(event: Event) {
    this.minAmountChange.emit(event);
  }

  onMaxAmountChange(event: Event) {
    this.maxAmountChange.emit(event);
  }

  clearAmountRange() {
    const minEvent = { target: { value: '' } } as any;
    const maxEvent = { target: { value: '' } } as any;
    this.minAmountChange.emit(minEvent);
    this.maxAmountChange.emit(maxEvent);
  }

  clearAllFilters() {
    // Clear internal arrays
    this.activeFundingTypes = [];
    this.activeIndustries = [];
    this.activeCurrencies = [];
    
    // Emit backward compatible events
    const emptyEvent = { target: { value: '' } } as any;
    this.fundingTypeChange.emit(emptyEvent);
    this.industryChange.emit(emptyEvent);
    this.currencyChange.emit(emptyEvent);
    this.minAmountChange.emit(emptyEvent);
    this.maxAmountChange.emit(emptyEvent);
    
    // Emit main clear event
    this.clearFilters.emit();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.activeFundingTypes.length || 
      this.activeIndustries.length || 
      this.activeCurrencies.length || 
      this.minAmount || 
      this.maxAmount
    );
  }

  formatFundingType(type: string): string {
    const found = this.fundingTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  formatIndustry(industry: string): string {
    const found = this.industries.find(i => i.value === industry);
    return found ? found.label : industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatAmountRange(): string {
    const min = this.minAmount ? `R${Number(this.minAmount).toLocaleString()}` : '';
    const max = this.maxAmount ? `R${Number(this.maxAmount).toLocaleString()}` : '';
    
    if (min && max) return `${min} - ${max}`;
    if (min) return `From ${min}`;
    if (max) return `Up to ${max}`;
    return '';
  }
}