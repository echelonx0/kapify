// src/app/profile/steps/financial-analysis/utils/financial-data.transformer.ts

import {
  FinancialTableSection,
  FinancialTableRow,
} from 'src/app/SMEs/profile/steps/financial-analysis/financial-table/financial-data-table.component';
import { FinancialRowData, FinancialRatioData } from './excel-parser.service';

export class FinancialDataTransformer {
  /**
   * Transform income statement data to table sections
   */
  static transformIncomeStatement(
    data: FinancialRowData[]
  ): FinancialTableSection[] {
    const calculatedFields = ['Gross Profit', 'EBITDA', 'Profit before tax'];

    const rows: FinancialTableRow[] = data.map((item) => ({
      label: item.label,
      values: item.values,
      editable: item.editable ?? true, // Default to true if undefined
      type: 'currency',
      isCalculated: calculatedFields.includes(item.label),
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
    const rows: FinancialTableRow[] = data.map((item) => ({
      label: item.label,
      values: item.values,
      editable: item.editable ?? true, // Default to true if undefined
      type: item.type || 'ratio',
      isCalculated: false,
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
      type: (row.type as 'percentage' | 'ratio' | 'currency') || 'ratio', // Ensure type is always defined
    }));
  }

  /**
   * Transform balance sheet data to table sections
   */
  static transformBalanceSheet(
    data: any[] // BalanceSheetRowData[]
  ): FinancialTableSection[] {
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
          editable: item.editable,
          type: 'currency',
          isCalculated: item.label.includes('Total'),
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
          editable: item.editable,
          type: 'currency',
          isCalculated: item.label.includes('Total'),
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
          editable: item.editable,
          type: 'currency',
          isCalculated: item.label.includes('Total'),
        })),
        collapsed: false,
      });
    }

    return sections;
  }

  /**
   * Transform cash flow data to table sections
   */
  static transformCashFlow(
    data: any[] // CashFlowRowData[]
  ): FinancialTableSection[] {
    const categories = {
      operating: data.filter((r) => r.category === 'operating'),
      investing: data.filter((r) => r.category === 'investing'),
      financing: data.filter((r) => r.category === 'financing'),
    };

    const sections: FinancialTableSection[] = [];

    if (categories.operating.length > 0) {
      sections.push({
        title: 'Operating Activities',
        rows: categories.operating.map((item) => ({
          label: item.label,
          values: item.values,
          editable: item.editable,
          type: 'currency',
          isCalculated: item.label.includes('Net Cash'),
        })),
        collapsed: false,
      });
    }

    if (categories.investing.length > 0) {
      sections.push({
        title: 'Investing Activities',
        rows: categories.investing.map((item) => ({
          label: item.label,
          values: item.values,
          editable: item.editable,
          type: 'currency',
          isCalculated: item.label.includes('Net Cash'),
        })),
        collapsed: false,
      });
    }

    if (categories.financing.length > 0) {
      sections.push({
        title: 'Financing Activities',
        rows: categories.financing.map((item) => ({
          label: item.label,
          values: item.values,
          editable: item.editable,
          type: 'currency',
          isCalculated: item.label.includes('Net Cash'),
        })),
        collapsed: false,
      });
    }

    return sections;
  }
}
