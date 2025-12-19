// // src/app/funder/components/form-sections/funding-structure.component.ts
// import { Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import {
//   LucideAngularModule,
//   TrendingUp,
//   PieChart,
//   RefreshCw,
//   FileText,
//   DollarSign,
//   Gift,
// } from 'lucide-angular';
// import { OpportunityFormStateService } from 'src/app/funder/create-opportunity/services/opportunity-form-state.service';
// import { OpportunityUIHelperService } from '../../services/ui-helper.service';

// type FundingType =
//   | 'debt'
//   | 'equity'
//   | 'convertible'
//   | 'mezzanine'
//   | 'grant'
//   | 'purchase_order'
//   | 'invoice_financing';

// @Component({
//   selector: 'app-funding-structure',
//   standalone: true,
//   imports: [CommonModule, FormsModule, LucideAngularModule],
//   templateUrl: './investment-terms.component.html',
// })
// export class InvestmentTermsComponent {
//   public formState = inject(OpportunityFormStateService);
//   public ui = inject(OpportunityUIHelperService);

//   // Icons
//   TrendingUpIcon = TrendingUp;
//   PieChartIcon = PieChart;
//   RefreshCwIcon = RefreshCw;
//   FileTextIcon = FileText;
//   DollarSignIcon = DollarSign;
//   GiftIcon = Gift;

//   // Funding Types with Tooltip Definitions
//   fundingTypes: {
//     value: FundingType;
//     label: string;
//     desc: string;
//     icon: any;
//     tooltip: string;
//   }[] = [
//     {
//       value: 'debt',
//       label: 'Debt',
//       desc: 'Traditional loan',
//       icon: this.TrendingUpIcon,
//       tooltip: 'Funds are lent and repaid with interest, no equity given.',
//     },
//     {
//       value: 'equity',
//       label: 'Equity',
//       desc: 'Ownership stake',
//       icon: this.PieChartIcon,
//       tooltip: 'Investor receives shares in exchange for capital.',
//     },
//     {
//       value: 'convertible',
//       label: 'Convertible',
//       desc: 'Converts to equity',
//       icon: this.RefreshCwIcon,
//       tooltip: 'Starts as a loan and converts into equity later.',
//     },
//     {
//       value: 'purchase_order',
//       label: 'Purchase Order Funding',
//       desc: 'Fulfills confirmed orders',
//       icon: this.FileTextIcon,
//       tooltip: 'Short-term finance to fulfill a customer purchase order.',
//     },
//     {
//       value: 'invoice_financing',
//       label: 'Invoice Financing',
//       desc: 'Advance on invoices',
//       icon: this.DollarSignIcon,
//       tooltip: 'Receive cash flow by financing unpaid invoices.',
//     },
//     {
//       value: 'grant',
//       label: 'Grant Funding',
//       desc: 'Non-repayable capital',
//       icon: this.GiftIcon,
//       tooltip: 'Funds provided with no repayment required.',
//     },
//   ];

//   // Startup & Investment Tooltips
//   tooltip = {
//     typicalInvestment: 'Average expected investment per business.',
//     minInvestment: 'Minimum contribution from investors.',
//     maxInvestment: 'Maximum contribution allowed per investor.',
//     decisionTimeframe: 'How long it takes for funding decisions to be made.',
//     equityOffered: 'Percentage of ownership offered to investors.',
//     expectedReturns: 'Anticipated internal rate of return (IRR).',
//     exitStrategy: 'Plan for how investors can exit and realize returns.',
//   };

//   /**
//    * Handle funding type checkbox toggle
//    * Directly calls formState to update the array
//    */
//   onFundingTypeToggle(value: string, event: Event): void {
//     const checked = (event.target as HTMLInputElement).checked;
//     this.formState.updateMultiSelectField('fundingType', value, checked);
//   }
// }

// src/app/funder/components/form-sections/investment-terms.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
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
import { OpportunityUIHelperService } from '../../services/ui-helper.service';
import {
  FundFinancialTermsService,
  FundFinancialTerm,
} from 'src/app/admin/services/fund-financial-terms.service';
import { OpportunityFormStateService } from '../../services/opportunity-form-state.service';

type FundingType =
  | 'debt'
  | 'equity'
  | 'convertible'
  | 'mezzanine'
  | 'grant'
  | 'purchase_order'
  | 'invoice_financing';

@Component({
  selector: 'app-investment-terms',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './investment-terms.component.html',
})
export class InvestmentTermsComponent implements OnInit {
  public formState = inject(OpportunityFormStateService);
  public ui = inject(OpportunityUIHelperService);
  private termsService = inject(FundFinancialTermsService);

  // Load terms from DB
  readonly allTerms = signal<FundFinancialTerm[]>([]);
  readonly isLoading = signal(false);

  // Icons
  TrendingUpIcon = TrendingUp;
  PieChartIcon = PieChart;
  RefreshCwIcon = RefreshCw;
  FileTextIcon = FileText;
  DollarSignIcon = DollarSign;
  GiftIcon = Gift;

  // Hardcoded funding types (these could also come from DB if needed)
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

  // Tooltips - dynamically populated from DB or fallback
  tooltip = {
    typicalInvestment: 'Average expected investment per business.',
    minInvestment: 'Minimum contribution from investors.',
    maxInvestment: 'Maximum contribution allowed per investor.',
    decisionTimeframe: 'How long it takes for funding decisions to be made.',
    equityOffered: 'Percentage of ownership offered to investors.',
    expectedReturns: 'Anticipated internal rate of return (IRR).',
    exitStrategy: 'Plan for how investors can exit and realize returns.',
  };

  async ngOnInit() {
    this.isLoading.set(true);
    console.log('🔵 InvestmentTermsComponent ngOnInit started');
    try {
      console.log('🔵 Calling loadAllTerms()');
      await this.termsService.loadAllTerms();
      console.log('🔵 loadAllTerms() completed');

      const serviceTerms = this.termsService.allTerms();
      console.log('🔵 Service allTerms signal:', serviceTerms);
      console.log('🔵 Service allTerms length:', serviceTerms.length);

      this.allTerms.set(serviceTerms);
      console.log('🔵 Component allTerms set');
    } catch (err) {
      console.error('❌ Failed to load terms:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Handle funding type checkbox toggle
   */
  onFundingTypeToggle(value: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.formState.updateMultiSelectField('fundingType', value, checked);
  }

  /**
   * Get term by field name for dynamically populated labels/hints
   */
  getTermByFieldName(fieldName: string): FundFinancialTerm | undefined {
    return this.allTerms().find((term) => term.field_name === fieldName);
  }

  /**
   * Get tooltip or hint from DB, fallback to hardcoded
   */
  getTooltip(fieldName: string): string {
    const term = this.getTermByFieldName(fieldName);
    return (
      term?.hint || this.tooltip[fieldName as keyof typeof this.tooltip] || ''
    );
  }

  /**
   * Get label from DB, fallback to hardcoded
   */
  getLabel(fieldName: string): string {
    const term = this.getTermByFieldName(fieldName);
    return term?.label || fieldName;
  }
}
