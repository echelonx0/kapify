// src/app/funder/components/form-sections/funding-structure.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  TrendingUp,
  PieChart,
  RefreshCw,
  FileText,
  DollarSign,
  Gift,
} from 'lucide-angular';
import { OpportunityFormStateService } from 'src/app/funder/services/opportunity-form-state.service';
import { OpportunityUIHelperService } from 'src/app/funder/services/ui-helper.service';

type FundingType =
  | 'debt'
  | 'equity'
  | 'convertible'
  | 'mezzanine'
  | 'grant'
  | 'purchase_order'
  | 'invoice_financing';

@Component({
  selector: 'app-funding-structure',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './fund-structure.component.html',
})
export class FundingStructureComponent {
  public formState = inject(OpportunityFormStateService);
  public ui = inject(OpportunityUIHelperService);

  // Icons
  TrendingUpIcon = TrendingUp;
  PieChartIcon = PieChart;
  RefreshCwIcon = RefreshCw;
  FileTextIcon = FileText;
  DollarSignIcon = DollarSign;
  GiftIcon = Gift;

  // Funding Types with Tooltip Definitions
  fundingTypes: {
    value: FundingType;
    label: string;
    desc: string;
    icon: any;
    tooltip: string;
  }[] = [
    {
      value: 'debt',
      label: 'Debt',
      desc: 'Traditional loan',
      icon: this.TrendingUpIcon,
      tooltip: 'Funds are lent and repaid with interest, no equity given.',
    },
    {
      value: 'equity',
      label: 'Equity',
      desc: 'Ownership stake',
      icon: this.PieChartIcon,
      tooltip: 'Investor receives shares in exchange for capital.',
    },
    {
      value: 'convertible',
      label: 'Convertible',
      desc: 'Converts to equity',
      icon: this.RefreshCwIcon,
      tooltip: 'Starts as a loan and converts into equity later.',
    },
    {
      value: 'purchase_order',
      label: 'Purchase Order Funding',
      desc: 'Fulfills confirmed orders',
      icon: this.FileTextIcon,
      tooltip: 'Short-term finance to fulfill a customer purchase order.',
    },
    {
      value: 'invoice_financing',
      label: 'Invoice Financing',
      desc: 'Advance on invoices',
      icon: this.DollarSignIcon,
      tooltip: 'Receive cash flow by financing unpaid invoices.',
    },
    {
      value: 'grant',
      label: 'Grant Funding',
      desc: 'Non-repayable capital',
      icon: this.GiftIcon,
      tooltip: 'Funds provided with no repayment required.',
    },
  ];

  // Startup & Investment Tooltips
  tooltip = {
    typicalInvestment: 'Average expected investment per business.',
    minInvestment: 'Minimum contribution from investors.',
    maxInvestment: 'Maximum contribution allowed per investor.',
    decisionTimeframe: 'How long it takes for funding decisions to be made.',
    equityOffered: 'Percentage of ownership offered to investors.',
    expectedReturns: 'Anticipated internal rate of return (IRR).',
    exitStrategy: 'Plan for how investors can exit and realize returns.',
  };

  /**
   * Handle funding type checkbox toggle
   * Directly calls formState to update the array
   */
  onFundingTypeToggle(value: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.formState.updateMultiSelectField('fundingType', value, checked);
  }
}
