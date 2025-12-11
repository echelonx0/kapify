import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileSpreadsheet,
  Download,
  Calendar,
  CircleAlert,
  CircleCheckBig,
  ChartColumn,
} from 'lucide-angular';
import { ParsedFinancialData } from 'src/app/SMEs/profile/steps/financial-analysis/utils/excel-parser.service';

@Component({
  selector: 'app-financial-analysis-viewer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './financial-analysis-viewer.component.html',
  styleUrls: ['./financial-analysis-viewer.component.css'],
})
export class FinancialAnalysisViewerComponent {
  @Input() financialAnalysis: ParsedFinancialData | null = null;

  // Icons
  TrendingUpIcon = TrendingUp;
  TrendingDownIcon = TrendingDown;
  DollarSignIcon = DollarSign;
  BarChart3Icon = ChartColumn;
  FileSpreadsheetIcon = FileSpreadsheet;
  DownloadIcon = Download;
  CalendarIcon = Calendar;
  AlertCircleIcon = CircleAlert;
  CheckCircleIcon = CircleCheckBig;

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

  uploadedFile = computed(() => this.financialAnalysis?.uploadedFile);

  columnHeaders = computed(() => this.financialAnalysis?.columnHeaders || []);

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

  // Key financial ratios
  keyRatios = computed(() => {
    const ratios = this.financialAnalysis?.financialRatios;
    if (!ratios || ratios.length === 0) return [];

    // Get the most recent period (last column)
    const lastPeriodIndex = this.columnHeaders().length - 1;
    if (lastPeriodIndex < 0) return [];

    return ratios.map((ratio) => ({
      label: ratio.label,
      value: ratio.values[lastPeriodIndex] || 0,
      type: ratio.type,
    }));
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
  formatRatio(value: number, type: string): string {
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
}
