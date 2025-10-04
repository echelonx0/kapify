// src/app/profile/steps/financial-analysis/utils/financial-data.transformer.ts

import { FinancialTableSection, FinancialTableRow } from "src/app/shared/financial-table/financial-data-table.component";
import { FinancialRowData, FinancialRatioData } from "../../../services/excel-parser.service";

 
 
export class FinancialDataTransformer {
  /**
   * Transform income statement data to table sections
   */
  static transformIncomeStatement(
    data: FinancialRowData[]
  ): FinancialTableSection[] {
    const calculatedFields = [
      'Gross Profit',
      'EBITDA',
      'Profit before tax'
    ];

    const rows: FinancialTableRow[] = data.map(item => ({
      label: item.label,
      values: item.values,
      editable: item.editable ?? true, // Default to true if undefined
      type: 'currency',
      isCalculated: calculatedFields.includes(item.label)
    }));

    return [{
      title: 'Income Statement',
      rows,
      collapsed: false
    }];
  }

  /**
   * Transform financial ratios data to table sections
   */
  static transformFinancialRatios(
    data: FinancialRatioData[]
  ): FinancialTableSection[] {
    const rows: FinancialTableRow[] = data.map(item => ({
      label: item.label,
      values: item.values,
      editable: item.editable ?? true, // Default to true if undefined
      type: item.type || 'ratio',
      isCalculated: false
    }));

    return [{
      title: 'Financial Ratios',
      rows,
      collapsed: false
    }];
  }

  /**
   * Transform table data back to income statement format
   */
  static transformTableToIncomeStatement(
    sections: FinancialTableSection[]
  ): FinancialRowData[] {
    const incomeSection = sections.find(s => s.title === 'Income Statement');
    if (!incomeSection) return [];

    return incomeSection.rows.map(row => ({
      label: row.label,
      values: row.values,
      editable: row.editable
    }));
  }

  /**
   * Transform table data back to financial ratios format
   */
  static transformTableToFinancialRatios(
    sections: FinancialTableSection[]
  ): FinancialRatioData[] {
    const ratiosSection = sections.find(s => s.title === 'Financial Ratios');
    if (!ratiosSection) return [];

    return ratiosSection.rows.map(row => ({
      label: row.label,
      values: row.values,
      editable: row.editable,
      type: (row.type as 'percentage' | 'ratio' | 'currency') || 'ratio' // Ensure type is always defined
    }));
  }
}