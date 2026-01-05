// import {
//   Component,
//   Input,
//   computed,
//   signal,
//   OnInit,
//   effect,
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   LucideAngularModule,
//   TrendingUp,
//   TrendingDown,
//   DollarSign,
//   FileSpreadsheet,
//   Calendar,
//   CircleAlert,
//   CircleCheckBig,
//   ChartColumn,
//   ViewIcon,
//   X,
//   DownloadIcon,
// } from 'lucide-angular';
// import { ParsedFinancialData } from 'src/app/SMEs/profile/steps/financial-analysis/utils/excel-parser.service';
// import { FinancialDataTableComponent } from 'src/app/SMEs/profile/steps/financial-analysis/financial-table/financial-data-table.component';
// import { FinancialDataTransformer } from 'src/app/SMEs/profile/steps/financial-analysis/utils/financial-data.transformer';

// @Component({
//   selector: 'app-financial-analysis-viewer',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule, FinancialDataTableComponent],
//   templateUrl: './financial-analysis-viewer.component.html',
//   styleUrls: ['./financial-analysis-viewer.component.css'],
// })
// export class FinancialAnalysisViewerComponent implements OnInit {
//   @Input() financialAnalysis: ParsedFinancialData | null = null;

//   // Modal state
//   showExpandedView = signal(false);
//   activeTab = signal<'income' | 'balance' | 'cash'>('income');

//   // Period selection state
//   selectedPeriodIndex = signal<number>(0);

//   // Icons
//   TrendingUpIcon = TrendingUp;
//   TrendingDownIcon = TrendingDown;
//   DollarSignIcon = DollarSign;
//   BarChart3Icon = ChartColumn;
//   FileSpreadsheetIcon = FileSpreadsheet;
//   ViewIcon = ViewIcon;
//   CalendarIcon = Calendar;
//   AlertCircleIcon = CircleAlert;
//   CheckCircleIcon = CircleCheckBig;
//   CloseIcon = X;
//   DownloadIcon = DownloadIcon;

//   // Computed properties
//   hasData = computed(() => {
//     const data = this.financialAnalysis;
//     return !!(
//       data &&
//       (data.incomeStatement?.length > 0 ||
//         (data.balanceSheet?.length ?? 0) > 0 ||
//         (data.cashFlow?.length ?? 0) > 0)
//     );
//   });

//   uploadedFile = computed(() => {
//     return this.financialAnalysis?.uploadedFile;
//   });

//   columnHeaders = computed(() => {
//     return this.financialAnalysis?.columnHeaders || [];
//   });

//   // Transformed table data
//   incomeStatementSections = computed(() => {
//     const data = this.financialAnalysis;
//     if (!data?.incomeStatement) return [];

//     const incomeRatios = (data.financialRatios || []).filter((r) =>
//       ['Sales Growth', 'Gross profit margin', 'Cost to Income ratio'].some(
//         (label) => r.label.toLowerCase().includes(label.toLowerCase())
//       )
//     );

//     return FinancialDataTransformer.transformIncomeStatement(
//       data.incomeStatement,
//       incomeRatios
//     );
//   });

//   balanceSheetSections = computed(() => {
//     const data = this.financialAnalysis;
//     if (!data?.balanceSheet) return [];

//     const balanceRatios = (data.financialRatios || []).filter((r) =>
//       ['Current Ratio', 'Debt Equity Ratio', 'Return on Equity'].some((label) =>
//         r.label.toLowerCase().includes(label.toLowerCase())
//       )
//     );

//     return FinancialDataTransformer.transformBalanceSheet(
//       data.balanceSheet,
//       balanceRatios
//     );
//   });

//   cashFlowSections = computed(() => {
//     const data = this.financialAnalysis;
//     if (!data?.cashFlow) return [];
//     return FinancialDataTransformer.transformCashFlow(data.cashFlow);
//   });

//   // Summary metrics
//   summaryMetrics = computed(() => {
//     const data = this.financialAnalysis;
//     if (!data) return null;

//     return {
//       incomeStatementRows: data.incomeStatement?.length || 0,
//       balanceSheetRows: data.balanceSheet?.length || 0,
//       cashFlowRows: data.cashFlow?.length || 0,
//       financialRatiosRows: data.financialRatios?.length || 0,
//       totalPeriods: data.columnHeaders?.length || 0,
//       lastUpdated: data.lastUpdated,
//     };
//   });

//   // Key financial ratios for SELECTED period
//   keyRatios = computed(() => {
//     const ratios = this.financialAnalysis?.financialRatios;
//     if (!ratios || ratios.length === 0) return [];

//     const selectedIndex = this.selectedPeriodIndex();

//     return ratios.map((ratio) => ({
//       label: ratio.label,
//       value: ratio.values[selectedIndex] ?? null,
//       type: ratio.type,
//     }));
//   });

//   // Get selected year for header display
//   selectedYear = computed(() => {
//     const headers = this.columnHeaders();
//     const index = this.selectedPeriodIndex();
//     return headers[index] || '';
//   });

//   // Recent revenue trend (last 3 periods)
//   revenueTrend = computed(() => {
//     const income = this.financialAnalysis?.incomeStatement;
//     if (!income || income.length === 0) return null;

//     const revenueRow = income.find((row) =>
//       row.label.toLowerCase().includes('revenue')
//     );
//     if (!revenueRow) return null;

//     const headers = this.columnHeaders();
//     const lastIndex = headers.length - 1;
//     if (lastIndex < 2) return null;

//     return {
//       current: revenueRow.values[lastIndex] || 0,
//       previous: revenueRow.values[lastIndex - 1] || 0,
//       beforePrevious: revenueRow.values[lastIndex - 2] || 0,
//       periods: [
//         headers[lastIndex - 2],
//         headers[lastIndex - 1],
//         headers[lastIndex],
//       ],
//     };
//   });

//   // Calculate growth rate
//   revenueGrowth = computed(() => {
//     const trend = this.revenueTrend();
//     if (!trend || trend.previous === 0) return null;

//     const growth = ((trend.current - trend.previous) / trend.previous) * 100;
//     return {
//       percentage: growth,
//       isPositive: growth > 0,
//     };
//   });

//   ngOnInit() {
//     // Initialize selectedPeriodIndex to latest
//     const headers = this.columnHeaders();
//     if (headers.length > 0) {
//       this.selectedPeriodIndex.set(headers.length - 1);
//     }
//   }

//   // Select period by index
//   selectPeriod(index: number): void {
//     this.selectedPeriodIndex.set(index);
//   }

//   // Check if period is selected
//   isPeriodSelected(index: number): boolean {
//     return this.selectedPeriodIndex() === index;
//   }

//   // Format currency
//   formatCurrency(amount: number): string {
//     return new Intl.NumberFormat('en-ZA', {
//       style: 'currency',
//       currency: 'ZAR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   }

//   // Format percentage
//   formatPercentage(value: number): string {
//     return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
//   }

//   // Format ratio based on type
//   formatRatio(value: number | null, type: string): string {
//     if (value === null || value === undefined) return 'N/A';

//     switch (type) {
//       case 'percentage':
//         return `${value.toFixed(1)}%`;
//       case 'currency':
//         return this.formatCurrency(value);
//       case 'ratio':
//         return value.toFixed(2);
//       default:
//         return value.toFixed(2);
//     }
//   }

//   // Download uploaded file
//   downloadTemplate() {
//     const file = this.uploadedFile();
//     if (file?.publicUrl) {
//       window.open(file.publicUrl, '_blank');
//     }
//   }

//   // Format date
//   formatDate(dateString: string): string {
//     return new Intl.DateTimeFormat('en-ZA', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric',
//     }).format(new Date(dateString));
//   }

//   // Modal methods
//   openExpandedView() {
//     this.showExpandedView.set(true);
//     document.body.style.overflow = 'hidden';
//   }

//   closeExpandedView() {
//     this.showExpandedView.set(false);
//     document.body.style.overflow = 'auto';
//   }

//   switchTab(tab: 'income' | 'balance' | 'cash') {
//     this.activeTab.set(tab);
//   }
// }

import {
  Component,
  Input,
  computed,
  signal,
  OnInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileSpreadsheet,
  Calendar,
  CircleAlert,
  CircleCheckBig,
  ChartColumn,
  Eye,
  X,
  DownloadIcon,
} from 'lucide-angular';
import { ParsedFinancialData } from 'src/app/SMEs/profile/steps/financial-analysis/utils/excel-parser.service';
import { FinancialDataTableComponent } from 'src/app/SMEs/profile/steps/financial-analysis/financial-table/financial-data-table.component';
import { FinancialDataTransformer } from 'src/app/SMEs/profile/steps/financial-analysis/utils/financial-data.transformer';

@Component({
  selector: 'app-financial-analysis-viewer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, FinancialDataTableComponent],
  templateUrl: './financial-analysis-viewer.component.html',
  styleUrls: ['./financial-analysis-viewer.component.css'],
})
export class FinancialAnalysisViewerComponent implements OnInit {
  @Input() financialAnalysis: ParsedFinancialData | null = null;

  // Modal state
  showExpandedView = signal(false);
  activeTab = signal<'income' | 'balance' | 'cash' | 'ratios'>('income');

  // Period selection state
  selectedPeriodIndex = signal<number>(0);

  // Icons
  TrendingUpIcon = TrendingUp;
  TrendingDownIcon = TrendingDown;
  DollarSignIcon = DollarSign;
  BarChart3Icon = ChartColumn;
  FileSpreadsheetIcon = FileSpreadsheet;
  ViewIcon = Eye;
  CalendarIcon = Calendar;
  AlertCircleIcon = CircleAlert;
  CheckCircleIcon = CircleCheckBig;
  CloseIcon = X;
  DownloadIcon = DownloadIcon;

  // Computed properties
  hasData = computed(() => {
    const data = this.financialAnalysis;
    return !!(
      data &&
      (data.incomeStatement?.length > 0 ||
        (data.balanceSheet?.length ?? 0) > 0 ||
        (data.cashFlow?.length ?? 0) > 0)
    );
  });

  uploadedFile = computed(() => {
    return this.financialAnalysis?.uploadedFile;
  });

  columnHeaders = computed(() => {
    return this.financialAnalysis?.columnHeaders || [];
  });

  // Transformed table data
  incomeStatementSections = computed(() => {
    const data = this.financialAnalysis;
    if (!data?.incomeStatement) return [];

    const incomeRatios = (data.financialRatios || []).filter((r) =>
      ['Sales Growth', 'Gross profit margin', 'Cost to Income ratio'].some(
        (label) => r.label.toLowerCase().includes(label.toLowerCase())
      )
    );

    return FinancialDataTransformer.transformIncomeStatement(
      data.incomeStatement,
      incomeRatios
    );
  });

  balanceSheetSections = computed(() => {
    const data = this.financialAnalysis;
    if (!data?.balanceSheet) return [];

    const balanceRatios = (data.financialRatios || []).filter((r) =>
      ['Current Ratio', 'Debt Equity Ratio', 'Return on Equity'].some((label) =>
        r.label.toLowerCase().includes(label.toLowerCase())
      )
    );

    return FinancialDataTransformer.transformBalanceSheet(
      data.balanceSheet,
      balanceRatios
    );
  });

  cashFlowSections = computed(() => {
    const data = this.financialAnalysis;
    if (!data?.cashFlow) return [];
    return FinancialDataTransformer.transformCashFlow(data.cashFlow);
  });

  financialRatiosSections = computed(() => {
    const data = this.financialAnalysis;
    if (!data?.financialRatios) return [];

    const incomeRatios = (data.financialRatios || []).filter((r) =>
      [
        'Sales Growth',
        'Gross profit margin',
        'Cost to Income ratio',
        'Operating margin (EBITDA)',
        'Interest Cover Ratio',
        'Net Operating Profit Margin',
      ].some((label) => r.label.toLowerCase().includes(label.toLowerCase()))
    );

    const balanceRatios = (data.financialRatios || []).filter((r) =>
      [
        'Return on Equity',
        'Return on Assets',
        'Current Ratio',
        'Acid Test Ratio',
        'Debt Equity Ratio',
        'Debtors Days',
        'Creditors Days',
        'Equity Investment Value',
        'Return on Investment',
      ].some((label) => r.label.toLowerCase().includes(label.toLowerCase()))
    );

    return FinancialDataTransformer.transformFinancialRatios(
      incomeRatios,
      balanceRatios
    );
  });

  // Summary metrics
  summaryMetrics = computed(() => {
    const data = this.financialAnalysis;
    if (!data) return null;

    return {
      incomeStatementRows: data.incomeStatement?.length || 0,
      balanceSheetRows: data.balanceSheet?.length || 0,
      cashFlowRows: data.cashFlow?.length || 0,
      financialRatiosRows: data.financialRatios?.length || 0,
      totalPeriods: data.columnHeaders?.length || 0,
      lastUpdated: data.lastUpdated,
    };
  });

  // Key financial ratios for SELECTED period
  keyRatios = computed(() => {
    const ratios = this.financialAnalysis?.financialRatios;
    if (!ratios || ratios.length === 0) return [];

    const selectedIndex = this.selectedPeriodIndex();

    return ratios.map((ratio) => ({
      label: ratio.label,
      value: ratio.values[selectedIndex] ?? null,
      type: ratio.type,
    }));
  });

  // Get selected year for header display
  selectedYear = computed(() => {
    const headers = this.columnHeaders();
    const index = this.selectedPeriodIndex();
    return headers[index] || '';
  });

  // Recent revenue trend (last 3 periods)
  revenueTrend = computed(() => {
    const income = this.financialAnalysis?.incomeStatement;
    if (!income || income.length === 0) return null;

    const revenueRow = income.find((row) =>
      row.label.toLowerCase().includes('revenue')
    );
    if (!revenueRow) return null;

    const headers = this.columnHeaders();
    const lastIndex = headers.length - 1;
    if (lastIndex < 2) return null;

    return {
      current: revenueRow.values[lastIndex] || 0,
      previous: revenueRow.values[lastIndex - 1] || 0,
      beforePrevious: revenueRow.values[lastIndex - 2] || 0,
      periods: [
        headers[lastIndex - 2],
        headers[lastIndex - 1],
        headers[lastIndex],
      ],
    };
  });

  // Calculate growth rate
  revenueGrowth = computed(() => {
    const trend = this.revenueTrend();
    if (!trend || trend.previous === 0) return null;

    const growth = ((trend.current - trend.previous) / trend.previous) * 100;
    return {
      percentage: growth,
      isPositive: growth > 0,
    };
  });

  ngOnInit() {
    // Initialize selectedPeriodIndex to latest
    const headers = this.columnHeaders();
    if (headers.length > 0) {
      this.selectedPeriodIndex.set(headers.length - 1);
    }
  }

  // Select period by index
  selectPeriod(index: number): void {
    this.selectedPeriodIndex.set(index);
  }

  // Check if period is selected
  isPeriodSelected(index: number): boolean {
    return this.selectedPeriodIndex() === index;
  }

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Format percentage
  formatPercentage(value: number): string {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  // Format ratio based on type
  formatRatio(value: number | null, type: string): string {
    if (value === null || value === undefined) return 'N/A';

    switch (type) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return this.formatCurrency(value);
      case 'ratio':
        return value.toFixed(2);
      default:
        return value.toFixed(2);
    }
  }

  // Download uploaded file
  downloadTemplate() {
    const file = this.uploadedFile();
    if (file?.publicUrl) {
      window.open(file.publicUrl, '_blank');
    }
  }

  // Format date
  formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  }

  // Modal methods
  openExpandedView() {
    this.showExpandedView.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeExpandedView() {
    this.showExpandedView.set(false);
    document.body.style.overflow = 'auto';
  }

  switchTab(tab: 'income' | 'balance' | 'cash' | 'ratios') {
    this.activeTab.set(tab);
  }
}
