// src/app/shared/services/constants.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { SupabaseConstantsService } from '../../admin/services/remote-constants.service';

export interface SelectOption {
  value: string;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class ConstantsService {
  private supabaseConstants = inject(SupabaseConstantsService);

  // Expose signals from Supabase service (reactive)
  readonly fundingOptions = this.supabaseConstants.fundingOptions;
  readonly industries = this.supabaseConstants.industries;
  readonly businessStages = this.supabaseConstants.businessStages;
  readonly geographicRegions = this.supabaseConstants.geographicRegions;
  readonly currencies = this.supabaseConstants.currencies;

  // Local signals for app-specific constants
  readonly timeframes = signal<SelectOption[]>([
    { value: '7', label: '7 days' },
    { value: '14', label: '14 days' },
    { value: '30', label: '30 days' },
    { value: '60', label: '60 days' },
    { value: '90', label: '90 days' },
  ]);

  readonly investmentCriteria = signal<string[]>([
    'Minimum 2 years of operational history',
    'Demonstrated product-market fit',
    'Strong and experienced founding team',
    'Clear revenue model or growth strategy',
    'Registered business with verifiable documentation',
    'Open to regular reporting and governance requirements',
  ]);

  readonly excludedSectors = signal<string[]>([
    'Arms and Ammunition Manufacturing',
    'Tobacco Production',
    'Adult Entertainment',
    'Gambling and Betting',
    'Unregulated Crypto Assets',
    'Political or Religious Organizations',
  ]);

  readonly termTooltips = signal<Record<string, string>>({
    'Equity Investment':
      'Investor receives ownership shares in exchange for capital.',
    'Debt Financing':
      'Funds are borrowed and repaid with interest, without giving up ownership.',
    'Convertible Notes':
      'A loan that converts into equity at a later funding round.',
    'Venture Capital':
      'Equity investment from professional firms focused on high-growth startups.',
    'Angel Investment':
      'Capital provided by individual investors in exchange for equity.',
    Crowdfunding:
      'Funds raised from many small investors, often via online platforms.',
    'Purchase Order Funding':
      'Short-term finance to fulfill a confirmed purchase order.',
    'Invoice Financing':
      'Advance payment on unpaid invoices to improve cash flow.',
    'Grant Funding':
      'Non-repayable funds provided by institutions, governments, or foundations.',
    'Typical Investment':
      'The average investment amount commonly made by investors in this category.',
    'Min Investment': 'The minimum capital amount required to participate.',
    'Max Investment': 'The maximum capital amount an investor may contribute.',
    'Investment Criteria':
      'Conditions a business must meet to qualify for funding.',
    'Excluded Sectors': 'Industries that are not eligible for investment.',
  });

  findOption(options: SelectOption[], value: string): SelectOption | undefined {
    return options.find((o) => o.value === value);
  }

  getOptionLabel(options: SelectOption[], value: string): string {
    return this.findOption(options, value)?.label || value;
  }
}
