import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Filter,
  RefreshCw,
  Search,
  ChevronDown,
} from 'lucide-angular';
import { ConstantsService } from 'src/app/shared/services/constants.service';

@Component({
  selector: 'app-advanced-filters',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './marketplace-filters.component.html',
})
export class AdvancedFiltersComponent implements OnInit, OnChanges {
  private constants = inject(ConstantsService);

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
    currency: false,
    minAmount: false,
    maxAmount: false,
  };

  // Get data from constants service (reactive)
  get fundingTypes() {
    return this.constants.fundingOptions();
  }

  get industries() {
    return this.constants.industries();
  }

  get currencies() {
    return this.constants.currencies();
  }

  minAmountRanges: any[] = [
    { value: 'R50K', label: 'From R50,000' },
    { value: 'R100K', label: 'From R100,000' },
    { value: 'R500K', label: 'From R500,000' },
    { value: 'R1M', label: 'From R1,000,000' },
    { value: 'R5M', label: 'From R5,000,000' },
    { value: 'R10M', label: 'From R10,000,000' },
  ];

  maxAmountRanges: any[] = [
    { value: 'R100K', label: 'Up to R100,000' },
    { value: 'R500K', label: 'Up to R500,000' },
    { value: 'R1M', label: 'Up to R1,000,000' },
    { value: 'R5M', label: 'Up to R5,000,000' },
    { value: 'R10M', label: 'Up to R10,000,000' },
    { value: 'R50M', label: 'Up to R50,000,000' },
  ];

  ngOnInit() {
    this.initializeFromInputs();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['selectedFundingType'] ||
      changes['selectedIndustry'] ||
      changes['selectedCurrency']
    ) {
      this.initializeFromInputs();
    }
  }

  private initializeFromInputs() {
    this.activeFundingTypes = this.selectedFundingType
      ? [this.selectedFundingType]
      : [];
    this.activeIndustries = this.selectedIndustry
      ? [this.selectedIndustry]
      : [];
    this.activeCurrencies = this.selectedCurrency
      ? [this.selectedCurrency]
      : [];
  }

  toggleDropdown(dropdown: keyof typeof this.dropdownStates, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    Object.keys(this.dropdownStates).forEach((key) => {
      if (key !== dropdown) {
        this.dropdownStates[key as keyof typeof this.dropdownStates] = false;
      }
    });

    this.dropdownStates[dropdown] = !this.dropdownStates[dropdown];
  }

  closeAllDropdowns(event?: Event) {
    Object.keys(this.dropdownStates).forEach((key) => {
      this.dropdownStates[key as keyof typeof this.dropdownStates] = false;
    });
  }

  selectAllFundingTypes() {
    const isAllSelected =
      this.activeFundingTypes.length === this.fundingTypes.length;
    this.activeFundingTypes = isAllSelected
      ? []
      : this.fundingTypes.map((t) => t.value);
    const event = {
      target: { value: this.activeFundingTypes[0] || '' },
    } as any;
    this.fundingTypeChange.emit(event);
  }

  selectAllIndustries() {
    const isAllSelected =
      this.activeIndustries.length === this.industries.length;
    this.activeIndustries = isAllSelected
      ? []
      : this.industries.map((i) => i.value);
    const event = { target: { value: this.activeIndustries[0] || '' } } as any;
    this.industryChange.emit(event);
  }

  selectAllCurrencies() {
    const isAllSelected =
      this.activeCurrencies.length === this.currencies.length;
    this.activeCurrencies = isAllSelected
      ? []
      : this.currencies.map((c) => c.value);
    const event = { target: { value: this.activeCurrencies[0] || '' } } as any;
    this.currencyChange.emit(event);
  }

  toggleFundingType(type: string) {
    const isSelected = this.activeFundingTypes.includes(type);

    if (isSelected) {
      this.activeFundingTypes = this.activeFundingTypes.filter(
        (t) => t !== type
      );
    } else {
      this.activeFundingTypes = [...this.activeFundingTypes, type];
    }

    const event = {
      target: { value: this.activeFundingTypes[0] || '' },
    } as any;
    this.fundingTypeChange.emit(event);
  }

  toggleIndustry(industry: string) {
    const isSelected = this.activeIndustries.includes(industry);

    if (isSelected) {
      this.activeIndustries = this.activeIndustries.filter(
        (i) => i !== industry
      );
    } else {
      this.activeIndustries = [...this.activeIndustries, industry];
    }

    const event = { target: { value: this.activeIndustries[0] || '' } } as any;
    this.industryChange.emit(event);
  }

  toggleCurrency(currency: string) {
    const isSelected = this.activeCurrencies.includes(currency);

    if (isSelected) {
      this.activeCurrencies = this.activeCurrencies.filter(
        (c) => c !== currency
      );
    } else {
      this.activeCurrencies = [...this.activeCurrencies, currency];
    }

    const event = { target: { value: this.activeCurrencies[0] || '' } } as any;
    this.currencyChange.emit(event);
  }

  setMinAmount(value: string) {
    this.minAmount = value;
    const event = { target: { value } } as any;
    this.minAmountChange.emit(event);
    this.closeAllDropdowns();
  }

  setMaxAmount(value: string) {
    this.maxAmount = value;
    const event = { target: { value } } as any;
    this.maxAmountChange.emit(event);
    this.closeAllDropdowns();
  }

  clearAmountRange() {
    this.minAmount = '';
    this.maxAmount = '';
    const emptyEvent = { target: { value: '' } } as any;
    this.minAmountChange.emit(emptyEvent);
    this.maxAmountChange.emit(emptyEvent);
  }

  clearAllFilters() {
    this.activeFundingTypes = [];
    this.activeIndustries = [];
    this.activeCurrencies = [];
    this.minAmount = '';
    this.maxAmount = '';

    const emptyEvent = { target: { value: '' } } as any;
    this.fundingTypeChange.emit(emptyEvent);
    this.industryChange.emit(emptyEvent);
    this.currencyChange.emit(emptyEvent);
    this.minAmountChange.emit(emptyEvent);
    this.maxAmountChange.emit(emptyEvent);

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

  getOptionLabel(options: any[], value: string): string {
    return this.constants.getOptionLabel(options, value);
  }

  formatAmountRange(): string {
    if (this.minAmount && this.maxAmount)
      return `${this.minAmount} - ${this.maxAmount}`;
    if (this.minAmount) return this.minAmount;
    if (this.maxAmount) return this.maxAmount;
    return '';
  }
}
