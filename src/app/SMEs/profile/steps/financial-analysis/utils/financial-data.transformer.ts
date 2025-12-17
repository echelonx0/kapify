// src/app/SMEs/profile/steps/financial-analysis/utils/financial-data-transformer-refactored-v4.ts
import {
  FinancialTableSection,
  FinancialTableRow,
} from '../financial-table/financial-data-table.component';
import {
  FinancialRowData,
  BalanceSheetRowData,
  CashFlowRowData,
  FinancialRatioData,
} from './excel-parser.service';

export class FinancialDataTransformer {
  /**
   * Transform Income Statement rows + income ratios into table sections
   * Income statement data + separate collapsible section (orange) for income ratios
   */
  static transformIncomeStatement(
    incomeData: FinancialRowData[],
    incomeRatios?: FinancialRatioData[]
  ): FinancialTableSection[] {
    if (incomeData.length === 0) return [];

    const sections: FinancialTableSection[] = [
      {
        title: 'Income Statement',
        rows: incomeData.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable ?? true,
          isCalculated: !row.editable,
          isBold: this.isBoldIncomeRow(row.label),
          isTotal: this.isTotalIncomeRow(row.label),
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      },
    ];

    // Add income-based ratios as separate collapsible section (orange, expanded by default)
    if (incomeRatios && incomeRatios.length > 0) {
      sections.push({
        title: 'Financial Performance Ratios',
        rows: incomeRatios.map((ratio) => ({
          label: ratio.label,
          values: ratio.values,
          editable: false,
          isCalculated: true,
          isBold: false,
          isTotal: false,
          type: ratio.type,
          suffix:
            ratio.type === 'percentage'
              ? '%'
              : ratio.type === 'ratio'
              ? 'x'
              : '',
        })),
        isCollapsible: true,
        defaultExpanded: true,
        accentColor: 'orange',
      });
    }

    return sections;
  }

  /**
   * Transform Balance Sheet rows + balance sheet ratios into table sections
   * Structure:
   * - ASSETS (visual label - no rows)
   *   - Non-Current Assets (section)
   *   - Current Assets (section)
   *   - Total Assets (as final item)
   * - EQUITIES AND LIABILITIES (visual label - no rows)
   *   - Equities (section)
   *   - Liabilities (section)
   *   - Current Liabilities (section)
   *   - Total Equities and Liabilities (as final item)
   */
  static transformBalanceSheet(
    balanceData: BalanceSheetRowData[],
    balanceRatios?: FinancialRatioData[]
  ): FinancialTableSection[] {
    if (balanceData.length === 0) return [];

    const sections: FinancialTableSection[] = [];

    // ===== ASSETS SECTION =====
    // Add "ASSETS" as a visual label section (non-collapsible, read-only, empty rows)
    sections.push({
      title: 'ASSETS',
      rows: [],
      isCollapsible: false,
      defaultExpanded: true,
      isVisualLabel: true,
    });

    // Extract and group asset rows by subsection
    const assetsBySubsection = this.groupAssetsBySubsection(balanceData);

    // Add Non-Current Assets section
    if (assetsBySubsection.nonCurrent.length > 0) {
      sections.push({
        title: 'Non-Current Assets',
        rows: assetsBySubsection.nonCurrent.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: false,
          isTotal: false,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Add Current Assets section
    if (assetsBySubsection.current.length > 0) {
      sections.push({
        title: 'Current Assets',
        rows: assetsBySubsection.current.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: false,
          isTotal: false,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Add Total Assets as final section (not as separate header section)
    const totalAssets = balanceData.find(
      (r) => r.label.toLowerCase() === 'total assets' && r.category === 'assets'
    );
    if (totalAssets) {
      sections.push({
        title: 'Total Assets',
        rows: [
          {
            label: totalAssets.label,
            values: totalAssets.values,
            editable: false,
            isCalculated: !totalAssets.editable,
            isBold: true,
            isTotal: true,
            type: 'currency' as const,
          },
        ],
        isCollapsible: false,
        defaultExpanded: true,
        isSimpleRow: true, // NEW: Flag for simple sections with just one row
      });
    }

    // ===== EQUITIES & LIABILITIES SECTION =====
    // Add "EQUITIES AND LIABILITIES" as a visual label section
    sections.push({
      title: 'EQUITIES AND LIABILITIES',
      rows: [],
      isCollapsible: false,
      defaultExpanded: true,
      isVisualLabel: true,
    });

    // Add Equities section
    const equities = balanceData.filter((r) => r.category === 'equity');
    if (equities.length > 0) {
      sections.push({
        title: 'Equities',
        rows: equities.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: false,
          isTotal: false,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Add Liabilities section (long-term)
    const longTermLiabilities = balanceData.filter(
      (r) => r.category === 'liabilities' && r.subcategory === 'non-current'
    );
    if (longTermLiabilities.length > 0) {
      sections.push({
        title: 'Liabilities',
        rows: longTermLiabilities.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: false,
          isTotal: false,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Add Current Liabilities section
    const currentLiabilities = balanceData.filter(
      (r) => r.category === 'liabilities' && r.subcategory === 'current'
    );
    if (currentLiabilities.length > 0) {
      sections.push({
        title: 'Current Liabilities',
        rows: currentLiabilities.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: false,
          isTotal: false,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // Add Total Equities and Liabilities as final section (not as separate header section)
    const totalEL = balanceData.find(
      (r) =>
        r.label.toLowerCase() === 'total equities and liabilities' &&
        r.category === 'liabilities'
    );
    if (totalEL) {
      sections.push({
        title: 'Total Equities and Liabilities',
        rows: [
          {
            label: totalEL.label,
            values: totalEL.values,
            editable: false,
            isCalculated: !totalEL.editable,
            isBold: true,
            isTotal: true,
            type: 'currency' as const,
          },
        ],
        isCollapsible: false,
        defaultExpanded: true,
        isSimpleRow: true, // NEW: Flag for simple sections with just one row
      });
    }

    // Add balance sheet ratios as separate collapsible section (orange, expanded by default)
    if (balanceRatios && balanceRatios.length > 0) {
      sections.push({
        title: 'Financial Ratios',
        rows: balanceRatios.map((ratio) => ({
          label: ratio.label,
          values: ratio.values,
          editable: false,
          isCalculated: true,
          isBold: false,
          isTotal: false,
          type: ratio.type,
          suffix:
            ratio.type === 'percentage'
              ? '%'
              : ratio.type === 'ratio'
              ? 'x'
              : '',
        })),
        isCollapsible: true,
        defaultExpanded: true,
        accentColor: 'orange',
        spacingBefore: true,
      });
    }

    return sections;
  }

  /**
   * Transform Cash Flow rows into organized sections
   * Groups by: Operating | Investing | Financing | Summary
   */
  static transformCashFlow(data: CashFlowRowData[]): FinancialTableSection[] {
    if (data.length === 0) return [];

    const operatingRows: CashFlowRowData[] = [];
    const investingRows: CashFlowRowData[] = [];
    const financingRows: CashFlowRowData[] = [];
    const summaryRows: CashFlowRowData[] = [];

    for (const row of data) {
      switch (row.category) {
        case 'operating':
          operatingRows.push(row);
          break;
        case 'investing':
          investingRows.push(row);
          break;
        case 'financing':
          financingRows.push(row);
          break;
        case 'summary':
          summaryRows.push(row);
          break;
      }
    }

    const sections: FinancialTableSection[] = [];

    // ===== OPERATING ACTIVITIES =====
    if (operatingRows.length > 0) {
      const operatingHeaderRow = operatingRows.find(
        (r) =>
          !r.editable &&
          !r.isSubtotal &&
          r.label.toLowerCase().includes('cash flows from operating')
      );

      const operatingHeader =
        operatingHeaderRow?.label || 'Operating Activities';

      const operatingItems = operatingRows.filter(
        (r) => r !== operatingHeaderRow
      );

      sections.push({
        title: operatingHeader,
        rows: operatingItems.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: row.isSubtotal,
          isTotal: row.isSubtotal,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // ===== INVESTING ACTIVITIES =====
    if (investingRows.length > 0) {
      const investingHeaderRow = investingRows.find(
        (r) =>
          !r.editable &&
          !r.isSubtotal &&
          r.label.toLowerCase().includes('cash flows from investing')
      );

      const investingHeader =
        investingHeaderRow?.label || 'Investing Activities';

      const investingItems = investingRows.filter(
        (r) => r !== investingHeaderRow
      );

      sections.push({
        title: investingHeader,
        rows: investingItems.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: row.isSubtotal,
          isTotal: row.isSubtotal,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // ===== FINANCING ACTIVITIES =====
    if (financingRows.length > 0) {
      const financingHeaderRow = financingRows.find(
        (r) =>
          !r.editable &&
          !r.isSubtotal &&
          r.label.toLowerCase().includes('cash flows from financing')
      );

      const financingHeader =
        financingHeaderRow?.label || 'Financing Activities';

      const financingItems = financingRows.filter(
        (r) => r !== financingHeaderRow
      );

      sections.push({
        title: financingHeader,
        rows: financingItems.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: row.isSubtotal,
          isTotal: row.isSubtotal,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    // ===== SUMMARY SECTION =====
    if (summaryRows.length > 0) {
      sections.push({
        title: 'Summary',
        rows: summaryRows.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: row.isSubtotal,
          isTotal: row.isSubtotal,
          type: 'currency' as const,
        })),
        isCollapsible: false,
        defaultExpanded: true,
      });
    }

    return sections;
  }

  /**
   * Transform Financial Ratios into organized sections by type
   */
  static transformFinancialRatios(
    incomeRatios?: FinancialRatioData[],
    balanceRatios?: FinancialRatioData[]
  ): FinancialTableSection[] {
    const sections: FinancialTableSection[] = [];

    if (incomeRatios && incomeRatios.length > 0) {
      sections.push({
        title: 'Income Statement Ratios',
        rows: incomeRatios.map((ratio) => ({
          label: ratio.label,
          values: ratio.values,
          editable: false,
          isCalculated: true,
          isBold: false,
          isTotal: false,
          type: ratio.type,
          suffix:
            ratio.type === 'percentage'
              ? '%'
              : ratio.type === 'ratio'
              ? 'x'
              : '',
        })),
        isCollapsible: true,
        defaultExpanded: true,
        accentColor: 'orange',
      });
    }

    if (balanceRatios && balanceRatios.length > 0) {
      sections.push({
        title: 'Balance Sheet Ratios',
        rows: balanceRatios.map((ratio) => ({
          label: ratio.label,
          values: ratio.values,
          editable: false,
          isCalculated: true,
          isBold: false,
          isTotal: false,
          type: ratio.type,
          suffix:
            ratio.type === 'percentage'
              ? '%'
              : ratio.type === 'ratio'
              ? 'x'
              : '',
        })),
        isCollapsible: true,
        defaultExpanded: true,
        accentColor: 'orange',
        spacingBefore: true,
      });
    }

    return sections;
  }

  // ===== PRIVATE HELPERS =====

  private static groupAssetsBySubsection(data: BalanceSheetRowData[]): {
    nonCurrent: BalanceSheetRowData[];
    current: BalanceSheetRowData[];
  } {
    return {
      nonCurrent: data.filter(
        (r) => r.category === 'assets' && r.subcategory === 'non-current'
      ),
      current: data.filter(
        (r) => r.category === 'assets' && r.subcategory === 'current'
      ),
    };
  }

  private static isBoldIncomeRow(label: string): boolean {
    const boldRows = [
      'Gross Profit',
      'EBITDA',
      'Profit before tax',
      'Profit/(Loss) for the period',
    ];
    return boldRows.some((row) => label.toLowerCase() === row.toLowerCase());
  }

  private static isTotalIncomeRow(label: string): boolean {
    const totalRows = [
      'Gross Profit',
      'EBITDA',
      'Profit before tax',
      'Profit/(Loss) for the period',
    ];
    return totalRows.some((row) => label.toLowerCase() === row.toLowerCase());
  }
}
