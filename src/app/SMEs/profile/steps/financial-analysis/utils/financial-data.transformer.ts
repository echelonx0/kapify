// src/app/SMEs/profile/steps/financial-analysis/utils/financial-data-transformer-refactored-v2.ts
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
        })),
        isCollapsible: true,
        defaultExpanded: true,
        accentColor: 'orange', // Orange-50 background for ratio section
      });
    }

    return sections;
  }

  /**
   * Transform Balance Sheet rows + balance sheet ratios into table sections
   * Groups by: Non-Current Assets | Current Assets | Equities | Liabilities
   * Plus separate collapsible section (orange) for balance sheet ratios
   */
  static transformBalanceSheet(
    balanceData: BalanceSheetRowData[],
    balanceRatios?: FinancialRatioData[]
  ): FinancialTableSection[] {
    if (balanceData.length === 0) return [];

    const sections: FinancialTableSection[] = [];
    let currentSection: { title: string; rows: BalanceSheetRowData[] } | null =
      null;

    // Group balance sheet data by sections
    for (const row of balanceData) {
      if (row.isSectionHeader) {
        if (currentSection && currentSection.rows.length > 0) {
          sections.push(this.createBalanceSheetSection(currentSection));
        }
        currentSection = {
          title: row.label,
          rows: [],
        };
      } else if (currentSection) {
        currentSection.rows.push(row);
      }
    }

    if (currentSection && currentSection.rows.length > 0) {
      sections.push(this.createBalanceSheetSection(currentSection));
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
        })),
        isCollapsible: true,
        defaultExpanded: true,
        accentColor: 'orange', // Orange-50 background for ratio section
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

    if (operatingRows.length > 0) {
      sections.push({
        title: 'Operating Activities',
        rows: operatingRows.map((row) => ({
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

    if (investingRows.length > 0) {
      sections.push({
        title: 'Investing Activities',
        rows: investingRows.map((row) => ({
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

    if (financingRows.length > 0) {
      sections.push({
        title: 'Financing Activities',
        rows: financingRows.map((row) => ({
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

    if (summaryRows.length > 0) {
      sections.push({
        title: 'Summary',
        rows: summaryRows.map((row) => ({
          label: row.label,
          values: row.values,
          editable: row.editable,
          isCalculated: !row.editable,
          isBold: true,
          isTotal: true,
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
   * Income ratios at top + spacing + Balance sheet ratios below
   * Both with orange-50 background, both collapsible (expanded by default)
   */
  static transformFinancialRatios(
    incomeRatios?: FinancialRatioData[],
    balanceRatios?: FinancialRatioData[]
  ): FinancialTableSection[] {
    const sections: FinancialTableSection[] = [];

    // Income-based ratios section
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
        })),
        isCollapsible: true,
        defaultExpanded: true,
        accentColor: 'orange',
      });
    }

    // Balance sheet ratios section (with spacing above)
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
        })),
        isCollapsible: true,
        defaultExpanded: true,
        accentColor: 'orange',
        spacingBefore: true, // Add spacing before this section
      });
    }

    return sections;
  }

  // ===== PRIVATE HELPERS =====

  private static createBalanceSheetSection(section: {
    title: string;
    rows: BalanceSheetRowData[];
  }): FinancialTableSection {
    return {
      title: section.title,
      rows: section.rows.map((row) => ({
        label: row.label,
        values: row.values,
        editable: row.editable,
        isCalculated: !row.editable,
        isBold: this.isBoldBalanceRow(row),
        isTotal: row.isTotal || false,
        type: 'currency' as const,
      })),
      isCollapsible: false,
      defaultExpanded: true,
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

  private static isBoldBalanceRow(row: BalanceSheetRowData): boolean {
    return (
      row.isTotal ||
      ['Assets', 'Equities', 'Liabilities'].some((keyword) =>
        row.label.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }
}
