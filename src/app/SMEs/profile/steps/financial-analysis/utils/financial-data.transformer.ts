// // src/app/SMEs/profile/steps/financial-analysis/utils/financial-data.transformer.ts

// import {
//   FinancialTableSection,
//   FinancialTableRow,
// } from '../financial-table/financial-data-table.component';
// import {
//   FinancialRowData,
//   FinancialRatioData,
//   BalanceSheetRowData,
//   CashFlowRowData,
// } from './excel-parser.service';

// /**
//  * Calculated field labels for Income Statement
//  * These fields are computed from other values and should not be directly editable
//  */
// const INCOME_CALCULATED_FIELDS = [
//   'Gross Profit',
//   'EBITDA',
//   'Profit before tax',
// ];

// /**
//  * Calculated field labels for Balance Sheet
//  * Totals and subtotals that are computed
//  */
// const BALANCE_CALCULATED_FIELDS = [
//   'Total Current Assets',
//   'Total Non-Current Assets',
//   'Total Assets',
//   'Total Current Liabilities',
//   'Total Non-Current Liabilities',
//   'Total Liabilities',
//   'Total Equity',
//   'Total Shareholders Equity',
//   'Total Equities and Liabilities',
// ];

// /**
//  * Calculated field labels for Cash Flow
//  * Net cash amounts and totals
//  */
// const CASHFLOW_CALCULATED_FIELDS = [
//   'Net cash from operating activities',
//   'Net cash used in investing activities',
//   'Net cash used in financing activities',
//   'Net increase in cash and cash equivalents',
//   'Net change in cash',
//   'Cash and cash equivalents at end of period',
// ];

// export class FinancialDataTransformer {
//   /**
//    * Transform income statement data to table sections
//    */
//   static transformIncomeStatement(
//     data: FinancialRowData[]
//   ): FinancialTableSection[] {
//     if (!data || data.length === 0) {
//       return [];
//     }

//     const rows: FinancialTableRow[] = data.map((item) => ({
//       label: item.label,
//       values: item.values,
//       editable: item.editable ?? !this.isCalculatedIncomeField(item.label),
//       type: 'currency',
//       isCalculated: this.isCalculatedIncomeField(item.label),
//     }));

//     return [
//       {
//         title: 'Income Statement',
//         rows,
//         collapsed: false,
//       },
//     ];
//   }

//   /**
//    * Transform financial ratios data to table sections
//    */
//   static transformFinancialRatios(
//     data: FinancialRatioData[]
//   ): FinancialTableSection[] {
//     if (!data || data.length === 0) {
//       return [];
//     }

//     const rows: FinancialTableRow[] = data.map((item) => ({
//       label: item.label,
//       values: item.values,
//       editable: false, // Ratios are calculated, not directly editable
//       type: item.type || 'ratio',
//       isCalculated: true, // All ratios are calculated
//     }));

//     return [
//       {
//         title: 'Financial Ratios',
//         rows,
//         collapsed: false,
//       },
//     ];
//   }

//   /**
//    * Transform balance sheet data to table sections
//    * Groups by category: Assets, Liabilities, Equity
//    */
//   static transformBalanceSheet(
//     data: BalanceSheetRowData[]
//   ): FinancialTableSection[] {
//     if (!data || data.length === 0) {
//       return [];
//     }

//     const assets = data.filter((r) => r.category === 'assets');
//     const liabilities = data.filter((r) => r.category === 'liabilities');
//     const equity = data.filter((r) => r.category === 'equity');

//     const sections: FinancialTableSection[] = [];

//     if (assets.length > 0) {
//       sections.push({
//         title: 'Assets',
//         rows: assets.map((item) => ({
//           label: item.label,
//           values: item.values,
//           editable: item.editable ?? !this.isCalculatedBalanceField(item.label),
//           type: 'currency' as const,
//           isCalculated: this.isCalculatedBalanceField(item.label),
//         })),
//         collapsed: false,
//       });
//     }

//     if (liabilities.length > 0) {
//       sections.push({
//         title: 'Liabilities',
//         rows: liabilities.map((item) => ({
//           label: item.label,
//           values: item.values,
//           editable: item.editable ?? !this.isCalculatedBalanceField(item.label),
//           type: 'currency' as const,
//           isCalculated: this.isCalculatedBalanceField(item.label),
//         })),
//         collapsed: false,
//       });
//     }

//     if (equity.length > 0) {
//       sections.push({
//         title: 'Equity',
//         rows: equity.map((item) => ({
//           label: item.label,
//           values: item.values,
//           editable: item.editable ?? !this.isCalculatedBalanceField(item.label),
//           type: 'currency' as const,
//           isCalculated: this.isCalculatedBalanceField(item.label),
//         })),
//         collapsed: false,
//       });
//     }

//     return sections;
//   }

//   /**
//    * Transform cash flow data to table sections
//    * Groups by category: Operating, Investing, Financing
//    */
//   static transformCashFlow(data: CashFlowRowData[]): FinancialTableSection[] {
//     if (!data || data.length === 0) {
//       return [];
//     }

//     const operating = data.filter((r) => r.category === 'operating');
//     const investing = data.filter((r) => r.category === 'investing');
//     const financing = data.filter((r) => r.category === 'financing');

//     const sections: FinancialTableSection[] = [];

//     if (operating.length > 0) {
//       sections.push({
//         title: 'Operating Activities',
//         rows: operating.map((item) => ({
//           label: item.label,
//           values: item.values,
//           editable:
//             item.editable ?? !this.isCalculatedCashFlowField(item.label),
//           type: 'currency' as const,
//           isCalculated: this.isCalculatedCashFlowField(item.label),
//         })),
//         collapsed: false,
//       });
//     }

//     if (investing.length > 0) {
//       sections.push({
//         title: 'Investing Activities',
//         rows: investing.map((item) => ({
//           label: item.label,
//           values: item.values,
//           editable:
//             item.editable ?? !this.isCalculatedCashFlowField(item.label),
//           type: 'currency' as const,
//           isCalculated: this.isCalculatedCashFlowField(item.label),
//         })),
//         collapsed: false,
//       });
//     }

//     if (financing.length > 0) {
//       sections.push({
//         title: 'Financing Activities',
//         rows: financing.map((item) => ({
//           label: item.label,
//           values: item.values,
//           editable:
//             item.editable ?? !this.isCalculatedCashFlowField(item.label),
//           type: 'currency' as const,
//           isCalculated: this.isCalculatedCashFlowField(item.label),
//         })),
//         collapsed: false,
//       });
//     }

//     return sections;
//   }

//   // ===============================
//   // REVERSE TRANSFORMATIONS (Table -> Data)
//   // ===============================

//   /**
//    * Transform table data back to income statement format
//    */
//   static transformTableToIncomeStatement(
//     sections: FinancialTableSection[]
//   ): FinancialRowData[] {
//     const incomeSection = sections.find((s) => s.title === 'Income Statement');
//     if (!incomeSection) return [];

//     return incomeSection.rows.map((row) => ({
//       label: row.label,
//       values: row.values,
//       editable: row.editable,
//     }));
//   }

//   /**
//    * Transform table data back to financial ratios format
//    */
//   static transformTableToFinancialRatios(
//     sections: FinancialTableSection[]
//   ): FinancialRatioData[] {
//     const ratiosSection = sections.find((s) => s.title === 'Financial Ratios');
//     if (!ratiosSection) return [];

//     return ratiosSection.rows.map((row) => ({
//       label: row.label,
//       values: row.values,
//       editable: row.editable,
//       type: (row.type as 'percentage' | 'ratio' | 'currency') || 'ratio',
//     }));
//   }

//   /**
//    * Transform table sections back to balance sheet format
//    */
//   static transformTableToBalanceSheet(
//     sections: FinancialTableSection[]
//   ): BalanceSheetRowData[] {
//     const result: BalanceSheetRowData[] = [];

//     const assetsSection = sections.find((s) => s.title === 'Assets');
//     if (assetsSection) {
//       assetsSection.rows.forEach((row) => {
//         result.push({
//           label: row.label,
//           category: 'assets',
//           values: row.values,
//           editable: row.editable,
//         });
//       });
//     }

//     const liabilitiesSection = sections.find((s) => s.title === 'Liabilities');
//     if (liabilitiesSection) {
//       liabilitiesSection.rows.forEach((row) => {
//         result.push({
//           label: row.label,
//           category: 'liabilities',
//           values: row.values,
//           editable: row.editable,
//         });
//       });
//     }

//     const equitySection = sections.find((s) => s.title === 'Equity');
//     if (equitySection) {
//       equitySection.rows.forEach((row) => {
//         result.push({
//           label: row.label,
//           category: 'equity',
//           values: row.values,
//           editable: row.editable,
//         });
//       });
//     }

//     return result;
//   }

//   /**
//    * Transform table sections back to cash flow format
//    */
//   static transformTableToCashFlow(
//     sections: FinancialTableSection[]
//   ): CashFlowRowData[] {
//     const result: CashFlowRowData[] = [];

//     const operatingSection = sections.find(
//       (s) => s.title === 'Operating Activities'
//     );
//     if (operatingSection) {
//       operatingSection.rows.forEach((row) => {
//         result.push({
//           label: row.label,
//           category: 'operating',
//           values: row.values,
//           editable: row.editable,
//         });
//       });
//     }

//     const investingSection = sections.find(
//       (s) => s.title === 'Investing Activities'
//     );
//     if (investingSection) {
//       investingSection.rows.forEach((row) => {
//         result.push({
//           label: row.label,
//           category: 'investing',
//           values: row.values,
//           editable: row.editable,
//         });
//       });
//     }

//     const financingSection = sections.find(
//       (s) => s.title === 'Financing Activities'
//     );
//     if (financingSection) {
//       financingSection.rows.forEach((row) => {
//         result.push({
//           label: row.label,
//           category: 'financing',
//           values: row.values,
//           editable: row.editable,
//         });
//       });
//     }

//     return result;
//   }

//   // ===============================
//   // HELPER METHODS
//   // ===============================

//   /**
//    * Check if an Income Statement field is calculated
//    */
//   private static isCalculatedIncomeField(label: string): boolean {
//     return INCOME_CALCULATED_FIELDS.some(
//       (field) => label.toLowerCase() === field.toLowerCase()
//     );
//   }

//   /**
//    * Check if a Balance Sheet field is calculated (totals)
//    */
//   private static isCalculatedBalanceField(label: string): boolean {
//     const lowerLabel = label.toLowerCase();
//     return BALANCE_CALCULATED_FIELDS.some(
//       (field) =>
//         lowerLabel === field.toLowerCase() ||
//         lowerLabel.includes(field.toLowerCase())
//     );
//   }

//   /**
//    * Check if a Cash Flow field is calculated
//    */
//   private static isCalculatedCashFlowField(label: string): boolean {
//     const lowerLabel = label.toLowerCase();
//     return CASHFLOW_CALCULATED_FIELDS.some(
//       (field) =>
//         lowerLabel === field.toLowerCase() ||
//         lowerLabel.includes(field.toLowerCase())
//     );
//   }
// }
// src/app/SMEs/profile/steps/financial-analysis/utils/financial-data.transformer.ts
// UPDATED: Handles Charles's template structure with proper section grouping

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
 */
const INCOME_CALCULATED_FIELDS = [
  'Gross Profit',
  'EBITDA',
  'Profit before tax',
  'Profit/(Loss) for the period',
];

/**
 * Section headers in Balance Sheet (not editable)
 */
const BALANCE_SECTION_HEADERS = [
  'Non-Currents Assets',
  'Current Assets',
  'Equities',
  'Liabilities',
  'Current Liabilities',
];

/**
 * Calculated/Total fields in Balance Sheet
 */
const BALANCE_CALCULATED_FIELDS = [
  'Total Assets',
  'Total Equities and Liabilities',
];

/**
 * Calculated fields in Cash Flow
 */
const CASHFLOW_CALCULATED_FIELDS = [
  'Net cash from operating activities',
  'Net cash used in investing activities',
  'Net cash used in financing activities',
  'Net increase in cash and cash equivalents',
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
      isBold: this.isCalculatedIncomeField(item.label),
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
      editable: false,
      type: item.type || 'ratio',
      isCalculated: true,
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
   * Groups by: Non-Current Assets, Current Assets, Total Assets, Equity, Non-Current Liabilities, Current Liabilities
   */
  static transformBalanceSheet(
    data: BalanceSheetRowData[]
  ): FinancialTableSection[] {
    if (!data || data.length === 0) {
      return [];
    }

    const sections: FinancialTableSection[] = [];

    // Non-Current Assets
    const nonCurrentAssets = data.filter(
      (r) => r.category === 'assets' && r.subcategory === 'non-current'
    );
    if (nonCurrentAssets.length > 0) {
      sections.push({
        title: 'Non-Current Assets',
        rows: nonCurrentAssets.map((item) => this.toTableRow(item, 'balance')),
        collapsed: false,
        isCollapsible: true,
      });
    }

    // Current Assets
    const currentAssets = data.filter(
      (r) => r.category === 'assets' && r.subcategory === 'current'
    );
    if (currentAssets.length > 0) {
      sections.push({
        title: 'Current Assets',
        rows: currentAssets.map((item) => this.toTableRow(item, 'balance')),
        collapsed: false,
        isCollapsible: true,
      });
    }

    // Total Assets (standalone row, no subcategory)
    const totalAssets = data.filter(
      (r) =>
        r.category === 'assets' &&
        !r.subcategory &&
        r.label.toLowerCase().includes('total')
    );
    if (totalAssets.length > 0) {
      sections.push({
        title: 'Total Assets',
        rows: totalAssets.map((item) => ({
          ...this.toTableRow(item, 'balance'),
          isTotal: true,
          isBold: true,
        })),
        collapsed: false,
        isCollapsible: false,
      });
    }

    // Equity
    const equity = data.filter((r) => r.category === 'equity');
    if (equity.length > 0) {
      sections.push({
        title: 'Equity',
        rows: equity.map((item) => this.toTableRow(item, 'balance')),
        collapsed: false,
        isCollapsible: true,
      });
    }

    // Non-Current Liabilities (labeled as "Liabilities" in Charles's template)
    const nonCurrentLiabilities = data.filter(
      (r) => r.category === 'liabilities' && r.subcategory === 'non-current'
    );
    if (nonCurrentLiabilities.length > 0) {
      sections.push({
        title: 'Non-Current Liabilities',
        rows: nonCurrentLiabilities.map((item) =>
          this.toTableRow(item, 'balance')
        ),
        collapsed: false,
        isCollapsible: true,
      });
    }

    // Current Liabilities
    const currentLiabilities = data.filter(
      (r) => r.category === 'liabilities' && r.subcategory === 'current'
    );
    if (currentLiabilities.length > 0) {
      sections.push({
        title: 'Current Liabilities',
        rows: currentLiabilities.map((item) =>
          this.toTableRow(item, 'balance')
        ),
        collapsed: false,
        isCollapsible: true,
      });
    }

    // Total Equities and Liabilities (standalone row)
    const totalEL = data.filter(
      (r) =>
        r.category === 'liabilities' &&
        !r.subcategory &&
        r.label.toLowerCase().includes('total')
    );
    if (totalEL.length > 0) {
      sections.push({
        title: 'Total',
        rows: totalEL.map((item) => ({
          ...this.toTableRow(item, 'balance'),
          isTotal: true,
          isBold: true,
        })),
        collapsed: false,
        isCollapsible: false,
      });
    }

    return sections;
  }

  /**
   * Transform cash flow data to table sections
   * Groups by: Operating, Investing, Financing, Summary
   */
  static transformCashFlow(data: CashFlowRowData[]): FinancialTableSection[] {
    if (!data || data.length === 0) {
      return [];
    }

    const sections: FinancialTableSection[] = [];

    // Operating Activities
    const operating = data.filter((r) => r.category === 'operating');
    if (operating.length > 0) {
      sections.push({
        title: 'Operating Activities',
        rows: operating.map((item) => this.toCashFlowTableRow(item)),
        collapsed: false,
        isCollapsible: true,
      });
    }

    // Investing Activities
    const investing = data.filter((r) => r.category === 'investing');
    if (investing.length > 0) {
      sections.push({
        title: 'Investing Activities',
        rows: investing.map((item) => this.toCashFlowTableRow(item)),
        collapsed: false,
        isCollapsible: true,
      });
    }

    // Financing Activities
    const financing = data.filter((r) => r.category === 'financing');
    if (financing.length > 0) {
      sections.push({
        title: 'Financing Activities',
        rows: financing.map((item) => this.toCashFlowTableRow(item)),
        collapsed: false,
        isCollapsible: true,
      });
    }

    // Summary (Net change, opening/closing cash)
    const summary = data.filter((r) => r.category === 'summary');
    if (summary.length > 0) {
      sections.push({
        title: 'Cash Position',
        rows: summary.map((item) => ({
          ...this.toCashFlowTableRow(item),
          isBold: true,
        })),
        collapsed: false,
        isCollapsible: false,
      });
    }

    return sections;
  }

  // ===============================
  // HELPER METHODS
  // ===============================

  private static toTableRow(
    item: BalanceSheetRowData,
    context: 'balance' | 'cashflow'
  ): FinancialTableRow {
    const isHeader = BALANCE_SECTION_HEADERS.some(
      (h) => item.label.toLowerCase().trim() === h.toLowerCase().trim()
    );
    const isCalculated = isHeader || this.isCalculatedBalanceField(item.label);

    return {
      label: item.label,
      values: item.values,
      editable: item.editable && !isHeader && !isCalculated,
      type: 'currency',
      isCalculated,
      isBold: isHeader || isCalculated,
    };
  }

  private static toCashFlowTableRow(item: CashFlowRowData): FinancialTableRow {
    const isCalculated = this.isCalculatedCashFlowField(item.label);

    return {
      label: item.label,
      values: item.values,
      editable: item.editable && !isCalculated,
      type: 'currency',
      isCalculated,
      isBold: isCalculated,
    };
  }

  private static isCalculatedIncomeField(label: string): boolean {
    return INCOME_CALCULATED_FIELDS.some((field) =>
      label.toLowerCase().includes(field.toLowerCase())
    );
  }

  private static isCalculatedBalanceField(label: string): boolean {
    return BALANCE_CALCULATED_FIELDS.some((field) =>
      label.toLowerCase().includes(field.toLowerCase())
    );
  }

  private static isCalculatedCashFlowField(label: string): boolean {
    return CASHFLOW_CALCULATED_FIELDS.some((field) =>
      label.toLowerCase().includes(field.toLowerCase())
    );
  }

  // ===============================
  // REVERSE TRANSFORMATIONS (for saving back)
  // ===============================

  static transformTableToBalanceSheet(
    sections: FinancialTableSection[]
  ): BalanceSheetRowData[] {
    const result: BalanceSheetRowData[] = [];

    const sectionMapping: {
      title: string;
      category: 'assets' | 'liabilities' | 'equity';
      subcategory?: 'current' | 'non-current';
    }[] = [
      {
        title: 'Non-Current Assets',
        category: 'assets',
        subcategory: 'non-current',
      },
      { title: 'Current Assets', category: 'assets', subcategory: 'current' },
      { title: 'Total Assets', category: 'assets' },
      { title: 'Equity', category: 'equity' },
      {
        title: 'Non-Current Liabilities',
        category: 'liabilities',
        subcategory: 'non-current',
      },
      {
        title: 'Current Liabilities',
        category: 'liabilities',
        subcategory: 'current',
      },
      { title: 'Total', category: 'liabilities' },
    ];

    for (const mapping of sectionMapping) {
      const section = sections.find((s) => s.title === mapping.title);
      if (section) {
        section.rows.forEach((row) => {
          result.push({
            label: row.label,
            category: mapping.category,
            subcategory: mapping.subcategory,
            values: row.values,
            editable: row.editable,
          });
        });
      }
    }

    return result;
  }

  static transformTableToCashFlow(
    sections: FinancialTableSection[]
  ): CashFlowRowData[] {
    const result: CashFlowRowData[] = [];

    const sectionMapping: {
      title: string;
      category: 'operating' | 'investing' | 'financing' | 'summary';
    }[] = [
      { title: 'Operating Activities', category: 'operating' },
      { title: 'Investing Activities', category: 'investing' },
      { title: 'Financing Activities', category: 'financing' },
      { title: 'Cash Position', category: 'summary' },
    ];

    for (const mapping of sectionMapping) {
      const section = sections.find((s) => s.title === mapping.title);
      if (section) {
        section.rows.forEach((row) => {
          result.push({
            label: row.label,
            category: mapping.category,
            values: row.values,
            editable: row.editable,
          });
        });
      }
    }

    return result;
  }
}
