// src/app/SMEs/profile/steps/financial-analysis/utils/financial-data.transformer.ts

import {
  FinancialTableSection,
  FinancialTableRow,
} from '../financial-table/financial-data-table.component';
import {
  FinancialRowData,
  FinancialRatioData,
  BalanceSheetRowData,
  CashFlowRowData,
} from './excel-parser.service';

/**
 * Calculated field labels for Income Statement
 * These fields are computed from other values and should not be directly editable
 */
const INCOME_CALCULATED_FIELDS = [
  'Gross Profit',
  'EBITDA',
  'Profit before tax',
];

/**
 * Calculated field labels for Balance Sheet
 * Totals and subtotals that are computed
 */
const BALANCE_CALCULATED_FIELDS = [
  'Total Current Assets',
  'Total Non-Current Assets',
  'Total Assets',
  'Total Current Liabilities',
  'Total Non-Current Liabilities',
  'Total Liabilities',
  'Total Equity',
  'Total Shareholders Equity',
  'Total Equities and Liabilities',
];

/**
 * Calculated field labels for Cash Flow
 * Net cash amounts and totals
 */
const CASHFLOW_CALCULATED_FIELDS = [
  'Net cash from operating activities',
  'Net cash used in investing activities',
  'Net cash used in financing activities',
  'Net increase in cash and cash equivalents',
  'Net change in cash',
  'Cash and cash equivalents at end of period',
];

export class FinancialDataTransformer {
  /**
   * Transform income statement data to table sections
   */
  static transformIncomeStatement(
    data: FinancialRowData[]
  ): FinancialTableSection[] {
    if (!data || data.length === 0) {
      return [];
    }

    const rows: FinancialTableRow[] = data.map((item) => ({
      label: item.label,
      values: item.values,
      editable: item.editable ?? !this.isCalculatedIncomeField(item.label),
      type: 'currency',
      isCalculated: this.isCalculatedIncomeField(item.label),
    }));

    return [
      {
        title: 'Income Statement',
        rows,
        collapsed: false,
      },
    ];
  }

  /**
   * Transform financial ratios data to table sections
   */
  static transformFinancialRatios(
    data: FinancialRatioData[]
  ): FinancialTableSection[] {
    if (!data || data.length === 0) {
      return [];
    }

    const rows: FinancialTableRow[] = data.map((item) => ({
      label: item.label,
      values: item.values,
      editable: false, // Ratios are calculated, not directly editable
      type: item.type || 'ratio',
      isCalculated: true, // All ratios are calculated
    }));

    return [
      {
        title: 'Financial Ratios',
        rows,
        collapsed: false,
      },
    ];
  }

  /**
   * Transform balance sheet data to table sections
   * Groups by category: Assets, Liabilities, Equity
   */
  static transformBalanceSheet(
    data: BalanceSheetRowData[]
  ): FinancialTableSection[] {
    if (!data || data.length === 0) {
      return [];
    }

    const assets = data.filter((r) => r.category === 'assets');
    const liabilities = data.filter((r) => r.category === 'liabilities');
    const equity = data.filter((r) => r.category === 'equity');

    const sections: FinancialTableSection[] = [];

    if (assets.length > 0) {
      sections.push({
        title: 'Assets',
        rows: assets.map((item) => ({
          label: item.label,
          values: item.values,
          editable: item.editable ?? !this.isCalculatedBalanceField(item.label),
          type: 'currency' as const,
          isCalculated: this.isCalculatedBalanceField(item.label),
        })),
        collapsed: false,
      });
    }

    if (liabilities.length > 0) {
      sections.push({
        title: 'Liabilities',
        rows: liabilities.map((item) => ({
          label: item.label,
          values: item.values,
          editable: item.editable ?? !this.isCalculatedBalanceField(item.label),
          type: 'currency' as const,
          isCalculated: this.isCalculatedBalanceField(item.label),
        })),
        collapsed: false,
      });
    }

    if (equity.length > 0) {
      sections.push({
        title: 'Equity',
        rows: equity.map((item) => ({
          label: item.label,
          values: item.values,
          editable: item.editable ?? !this.isCalculatedBalanceField(item.label),
          type: 'currency' as const,
          isCalculated: this.isCalculatedBalanceField(item.label),
        })),
        collapsed: false,
      });
    }

    return sections;
  }

  /**
   * Transform cash flow data to table sections
   * Groups by category: Operating, Investing, Financing
   */
  static transformCashFlow(data: CashFlowRowData[]): FinancialTableSection[] {
    if (!data || data.length === 0) {
      return [];
    }

    const operating = data.filter((r) => r.category === 'operating');
    const investing = data.filter((r) => r.category === 'investing');
    const financing = data.filter((r) => r.category === 'financing');

    const sections: FinancialTableSection[] = [];

    if (operating.length > 0) {
      sections.push({
        title: 'Operating Activities',
        rows: operating.map((item) => ({
          label: item.label,
          values: item.values,
          editable:
            item.editable ?? !this.isCalculatedCashFlowField(item.label),
          type: 'currency' as const,
          isCalculated: this.isCalculatedCashFlowField(item.label),
        })),
        collapsed: false,
      });
    }

    if (investing.length > 0) {
      sections.push({
        title: 'Investing Activities',
        rows: investing.map((item) => ({
          label: item.label,
          values: item.values,
          editable:
            item.editable ?? !this.isCalculatedCashFlowField(item.label),
          type: 'currency' as const,
          isCalculated: this.isCalculatedCashFlowField(item.label),
        })),
        collapsed: false,
      });
    }

    if (financing.length > 0) {
      sections.push({
        title: 'Financing Activities',
        rows: financing.map((item) => ({
          label: item.label,
          values: item.values,
          editable:
            item.editable ?? !this.isCalculatedCashFlowField(item.label),
          type: 'currency' as const,
          isCalculated: this.isCalculatedCashFlowField(item.label),
        })),
        collapsed: false,
      });
    }

    return sections;
  }

  // ===============================
  // REVERSE TRANSFORMATIONS (Table -> Data)
  // ===============================

  /**
   * Transform table data back to income statement format
   */
  static transformTableToIncomeStatement(
    sections: FinancialTableSection[]
  ): FinancialRowData[] {
    const incomeSection = sections.find((s) => s.title === 'Income Statement');
    if (!incomeSection) return [];

    return incomeSection.rows.map((row) => ({
      label: row.label,
      values: row.values,
      editable: row.editable,
    }));
  }

  /**
   * Transform table data back to financial ratios format
   */
  static transformTableToFinancialRatios(
    sections: FinancialTableSection[]
  ): FinancialRatioData[] {
    const ratiosSection = sections.find((s) => s.title === 'Financial Ratios');
    if (!ratiosSection) return [];

    return ratiosSection.rows.map((row) => ({
      label: row.label,
      values: row.values,
      editable: row.editable,
      type: (row.type as 'percentage' | 'ratio' | 'currency') || 'ratio',
    }));
  }

  /**
   * Transform table sections back to balance sheet format
   */
  static transformTableToBalanceSheet(
    sections: FinancialTableSection[]
  ): BalanceSheetRowData[] {
    const result: BalanceSheetRowData[] = [];

    const assetsSection = sections.find((s) => s.title === 'Assets');
    if (assetsSection) {
      assetsSection.rows.forEach((row) => {
        result.push({
          label: row.label,
          category: 'assets',
          values: row.values,
          editable: row.editable,
        });
      });
    }

    const liabilitiesSection = sections.find((s) => s.title === 'Liabilities');
    if (liabilitiesSection) {
      liabilitiesSection.rows.forEach((row) => {
        result.push({
          label: row.label,
          category: 'liabilities',
          values: row.values,
          editable: row.editable,
        });
      });
    }

    const equitySection = sections.find((s) => s.title === 'Equity');
    if (equitySection) {
      equitySection.rows.forEach((row) => {
        result.push({
          label: row.label,
          category: 'equity',
          values: row.values,
          editable: row.editable,
        });
      });
    }

    return result;
  }

  /**
   * Transform table sections back to cash flow format
   */
  static transformTableToCashFlow(
    sections: FinancialTableSection[]
  ): CashFlowRowData[] {
    const result: CashFlowRowData[] = [];

    const operatingSection = sections.find(
      (s) => s.title === 'Operating Activities'
    );
    if (operatingSection) {
      operatingSection.rows.forEach((row) => {
        result.push({
          label: row.label,
          category: 'operating',
          values: row.values,
          editable: row.editable,
        });
      });
    }

    const investingSection = sections.find(
      (s) => s.title === 'Investing Activities'
    );
    if (investingSection) {
      investingSection.rows.forEach((row) => {
        result.push({
          label: row.label,
          category: 'investing',
          values: row.values,
          editable: row.editable,
        });
      });
    }

    const financingSection = sections.find(
      (s) => s.title === 'Financing Activities'
    );
    if (financingSection) {
      financingSection.rows.forEach((row) => {
        result.push({
          label: row.label,
          category: 'financing',
          values: row.values,
          editable: row.editable,
        });
      });
    }

    return result;
  }

  // ===============================
  // HELPER METHODS
  // ===============================

  /**
   * Check if an Income Statement field is calculated
   */
  private static isCalculatedIncomeField(label: string): boolean {
    return INCOME_CALCULATED_FIELDS.some(
      (field) => label.toLowerCase() === field.toLowerCase()
    );
  }

  /**
   * Check if a Balance Sheet field is calculated (totals)
   */
  private static isCalculatedBalanceField(label: string): boolean {
    const lowerLabel = label.toLowerCase();
    return BALANCE_CALCULATED_FIELDS.some(
      (field) =>
        lowerLabel === field.toLowerCase() ||
        lowerLabel.includes(field.toLowerCase())
    );
  }

  /**
   * Check if a Cash Flow field is calculated
   */
  private static isCalculatedCashFlowField(label: string): boolean {
    const lowerLabel = label.toLowerCase();
    return CASHFLOW_CALCULATED_FIELDS.some(
      (field) =>
        lowerLabel === field.toLowerCase() ||
        lowerLabel.includes(field.toLowerCase())
    );
  }
}
