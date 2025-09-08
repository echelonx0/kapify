// advanced-filters.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Filter, RefreshCw, Sliders } from 'lucide-angular';

@Component({
  selector: 'app-advanced-filters',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="section-card">
      <div class="section-header">
        <h3 class="section-title text-white flex items-center">
          <lucide-icon [img]="FilterIcon" [size]="18" class="mr-2" />
          Advanced Filters
        </h3>
        <p class="section-description text-primary-100 mt-1">
          Narrow down opportunities to find your perfect match
        </p>
      </div>
      
      <div class="p-6 space-y-6">
        
        <!-- Funding Type Filter -->
        <div class="space-y-3">
          <label class="block text-sm font-semibold text-neutral-800 mb-2">
            Funding Type
          </label>
          <select 
            [value]="selectedFundingType" 
            (change)="onFundingTypeChange($event)"
            class="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm shadow-sm">
            <option value="">All Funding Types</option>
            <option value="equity">💼 Equity Investment</option>
            <option value="debt">💰 Debt Financing</option>
            <option value="grant">🎁 Grant Funding</option>
            <option value="mezzanine">📈 Mezzanine Finance</option>
            <option value="convertible">🔄 Convertible Notes</option>
          </select>
        </div>

        <!-- Industry Filter -->
        <div class="space-y-3">
          <label class="block text-sm font-semibold text-neutral-800 mb-2">
            Industry Focus
          </label>
          <select 
            [value]="selectedIndustry" 
            (change)="onIndustryChange($event)"
            class="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm shadow-sm">
            <option value="">All Industries</option>
            <option value="technology">🚀 Technology</option>
            <option value="manufacturing">🏭 Manufacturing</option>
            <option value="retail">🛍️ Retail & E-commerce</option>
            <option value="healthcare">🏥 Healthcare</option>
            <option value="financial_services">🏦 Financial Services</option>
            <option value="agriculture">🌾 Agriculture</option>
            <option value="renewable_energy">⚡ Renewable Energy</option>
            <option value="education">📚 Education</option>
          </select>
        </div>

        <!-- Currency Filter -->
        <div class="space-y-3">
          <label class="block text-sm font-semibold text-neutral-800 mb-2">
            Currency
          </label>
          <select 
            [value]="selectedCurrency" 
            (change)="onCurrencyChange($event)"
            class="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm shadow-sm">
            <option value="">All Currencies</option>
            <option value="ZAR">🇿🇦 South African Rand (ZAR)</option>
            <option value="USD">🇺🇸 US Dollar (USD)</option>
            <option value="EUR">🇪🇺 Euro (EUR)</option>
            <option value="GBP">🇬🇧 British Pound (GBP)</option>
          </select>
        </div>

        <!-- Amount Range Filter -->
        <div class="space-y-3">
          <label class="block text-sm font-semibold text-neutral-800 mb-2">
            <lucide-icon [img]="SlidersIcon" [size]="16" class="inline mr-2" />
            Funding Amount Range
          </label>
          
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-1">Minimum</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">R</span>
                <input 
                  type="number" 
                  placeholder="0"
                  [value]="minAmount"
                  (input)="onMinAmountChange($event)"
                  class="w-full pl-8 pr-4 py-3 bg-white border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm" />
              </div>
            </div>
            
            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-1">Maximum</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">R</span>
                <input 
                  type="number" 
                  placeholder="Any"
                  [value]="maxAmount"
                  (input)="onMaxAmountChange($event)"
                  class="w-full pl-8 pr-4 py-3 bg-white border-2 border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 text-sm" />
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Amount Presets -->
        <div class="space-y-3">
          <label class="block text-xs font-medium text-neutral-600">Quick Amount Ranges</label>
          <div class="grid grid-cols-2 gap-2">
            <button 
              (click)="setAmountRange(0, 100000)"
              class="px-3 py-2 text-xs bg-neutral-100 hover:bg-primary-100 hover:text-primary-700 border border-neutral-200 hover:border-primary-300 rounded-lg transition-all duration-200">
              Under R100K
            </button>
            <button 
              (click)="setAmountRange(100000, 1000000)"
              class="px-3 py-2 text-xs bg-neutral-100 hover:bg-primary-100 hover:text-primary-700 border border-neutral-200 hover:border-primary-300 rounded-lg transition-all duration-200">
              R100K - R1M
            </button>
            <button 
              (click)="setAmountRange(1000000, 10000000)"
              class="px-3 py-2 text-xs bg-neutral-100 hover:bg-primary-100 hover:text-primary-700 border border-neutral-200 hover:border-primary-300 rounded-lg transition-all duration-200">
              R1M - R10M
            </button>
            <button 
              (click)="setAmountRange(10000000, 0)"
              class="px-3 py-2 text-xs bg-neutral-100 hover:bg-primary-100 hover:text-primary-700 border border-neutral-200 hover:border-primary-300 rounded-lg transition-all duration-200">
              Over R10M
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4 border-t border-neutral-100">
          <button 
            (click)="applyFilters.emit()"
            class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 focus:ring-4 focus:ring-primary-200 transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg">
            <lucide-icon [img]="FilterIcon" [size]="16" />
            Apply Filters
          </button>
          
          <button 
            (click)="clearFilters.emit()"
            class="px-4 py-3 bg-white border-2 border-neutral-200 text-neutral-700 rounded-xl font-medium hover:border-neutral-300 hover:bg-neutral-50 focus:ring-4 focus:ring-neutral-100 transition-all duration-200">
            <lucide-icon [img]="RefreshCwIcon" [size]="16" />
          </button>
        </div>

        <!-- Filter Summary -->
        <div *ngIf="hasActiveFilters()" class="pt-4 border-t border-neutral-100">
          <div class="bg-primary-50 border border-primary-200 rounded-lg p-3">
            <div class="text-xs font-medium text-primary-700 mb-2">Active Filters:</div>
            <div class="flex flex-wrap gap-1">
              <span *ngIf="selectedFundingType" class="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                {{ formatFundingType(selectedFundingType) }}
                <button (click)="clearFundingType()" class="hover:text-primary-900">×</button>
              </span>
              <span *ngIf="selectedIndustry" class="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                {{ formatIndustry(selectedIndustry) }}
                <button (click)="clearIndustry()" class="hover:text-primary-900">×</button>
              </span>
              <span *ngIf="selectedCurrency" class="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                {{ selectedCurrency }}
                <button (click)="clearCurrency()" class="hover:text-primary-900">×</button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .section-header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }
  `]
})
export class AdvancedFiltersComponent {
  @Input() selectedFundingType: string = '';
  @Input() selectedIndustry: string = '';
  @Input() selectedCurrency: string = '';
  @Input() minAmount: string = '';
  @Input() maxAmount: string = '';

  @Output() fundingTypeChange = new EventEmitter<Event>();
  @Output() industryChange = new EventEmitter<Event>();
  @Output() currencyChange = new EventEmitter<Event>();
  @Output() minAmountChange = new EventEmitter<Event>();
  @Output() maxAmountChange = new EventEmitter<Event>();
  @Output() applyFilters = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();

  FilterIcon = Filter;
  RefreshCwIcon = RefreshCw;
  SlidersIcon = Sliders;

  onFundingTypeChange(event: Event) {
    this.fundingTypeChange.emit(event);
  }

  onIndustryChange(event: Event) {
    this.industryChange.emit(event);
  }

  onCurrencyChange(event: Event) {
    this.currencyChange.emit(event);
  }

  onMinAmountChange(event: Event) {
    this.minAmountChange.emit(event);
  }

  onMaxAmountChange(event: Event) {
    this.maxAmountChange.emit(event);
  }

  setAmountRange(min: number, max: number) {
    // Emit synthetic events to trigger parent updates
    const minEvent = { target: { value: min.toString() } } as any;
    const maxEvent = { target: { value: max === 0 ? '' : max.toString() } } as any;
    
    this.minAmountChange.emit(minEvent);
    this.maxAmountChange.emit(maxEvent);
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedFundingType || this.selectedIndustry || this.selectedCurrency || this.minAmount || this.maxAmount);
  }

  clearFundingType() {
    const event = { target: { value: '' } } as any;
    this.fundingTypeChange.emit(event);
  }

  clearIndustry() {
    const event = { target: { value: '' } } as any;
    this.industryChange.emit(event);
  }

  clearCurrency() {
    const event = { target: { value: '' } } as any;
    this.currencyChange.emit(event);
  }

  formatFundingType(type: string): string {
    const types: Record<string, string> = {
      equity: 'Equity',
      debt: 'Debt',
      grant: 'Grant',
      mezzanine: 'Mezzanine',
      convertible: 'Convertible'
    };
    return types[type] || type;
  }

  formatIndustry(industry: string): string {
    return industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}