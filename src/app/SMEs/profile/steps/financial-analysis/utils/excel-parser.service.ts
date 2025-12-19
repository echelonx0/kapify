// src/app/SMEs/profile/steps/financial-analysis/utils/excel-parser.service.ts
import { Injectable } from '@angular/core';

export interface FinancialRowData {
  label: string;
  values: number[];
  editable?: boolean;
}

export interface BalanceSheetRowData {
  label: string;
  category: 'assets' | 'liabilities' | 'equity';
  subcategory?: 'current' | 'non-current';
  isSectionHeader?: boolean;
  isTotal?: boolean;
  values: number[];
  editable: boolean;
}

export interface CashFlowRowData {
  label: string;
  category: 'operating' | 'investing' | 'financing' | 'summary';
  isSubtotal?: boolean;
  values: number[];
  editable: boolean;
}

export interface FinancialRatioData extends FinancialRowData {
  type: 'ratio' | 'percentage' | 'currency';
  category?: string;
}

export interface ParsedFinancialData {
  incomeStatement: FinancialRowData[];
  balanceSheet?: BalanceSheetRowData[];
  cashFlow?: CashFlowRowData[];
  financialRatios: FinancialRatioData[];
  columnHeaders: string[];
  lastUpdated: string;
  uploadedFile?: {
    id?: string;
    documentKey: string;
    fileName: string;
    publicUrl: string;
    filePath?: string;
    fileSize?: number;
    mimeType?: string;
  };
}

export interface ParseValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ParseProgress {
  stage: 'reading' | 'parsing' | 'extracting' | 'validating' | 'complete';
  progress: number;
  message: string;
}

const EXPECTED_COLUMN_COUNT = 9;

@Injectable({
  providedIn: 'root',
})
export class ExcelFinancialParserService {
  private debugMode = true;

  async parseFinancialExcel(
    file: File,
    onProgress?: (progress: ParseProgress) => void
  ): Promise<ParsedFinancialData> {
    // Stage 1: Read file
    onProgress?.({
      stage: 'reading',
      progress: 10,
      message: 'Reading Excel file...',
    });
    const arrayBuffer = await this.readFileAsArrayBuffer(file);

    // Stage 2: Parse workbook
    onProgress?.({
      stage: 'parsing',
      progress: 30,
      message: 'Parsing workbook structure...',
    });
    const XLSX = await import('xlsx');

    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellStyles: false,
      sheetStubs: false,
      bookVBA: false,
      cellFormula: false,
    });

    // this.log('✓ Workbook loaded:', {
    //   sheets: workbook.SheetNames.length,
    //   sheetNames: workbook.SheetNames,
    // });

    // Stage 3: Validate sheet structure
    const incomeStatementSheet = workbook.SheetNames.find((name) =>
      name.toLowerCase().includes('income')
    );
    const balanceSheetSheet = workbook.SheetNames.find((name) =>
      name.toLowerCase().includes('balance')
    );
    const cashFlowSheet = workbook.SheetNames.find(
      (name) =>
        name.toLowerCase().includes('cash') ||
        name.toLowerCase().includes('cashflow')
    );

    if (!incomeStatementSheet || !balanceSheetSheet) {
      throw new Error(
        'Missing required sheets. Ensure template has "Income Statement" and "Balance Sheet" sheets.'
      );
    }

    // Stage 4: Extract data from sheets
    onProgress?.({
      stage: 'extracting',
      progress: 50,
      message: 'Extracting financial data...',
    });

    // Parse Income Statement sheet (includes Income + Ratios on same sheet)
    const incomeWorksheet = workbook.Sheets[incomeStatementSheet];
    const { incomeStatement, incomeRatios, columnHeaders } =
      this.parseIncomeStatementSheet(incomeWorksheet, XLSX);

    // Parse Balance Sheet
    const balanceWorksheet = workbook.Sheets[balanceSheetSheet];
    const { balanceSheet, balanceSheetRatios } = this.parseBalanceSheetSheet(
      balanceWorksheet,
      XLSX,
      columnHeaders.length
    );

    // Parse Cash Flow (if exists)
    let cashFlow: CashFlowRowData[] = [];
    if (cashFlowSheet) {
      const cashFlowWorksheet = workbook.Sheets[cashFlowSheet];
      cashFlow = this.parseCashFlowSheet(
        cashFlowWorksheet,
        XLSX,
        columnHeaders.length
      );
    }

    // Merge all ratios (from income sheet + balance sheet)
    const allRatios = [...incomeRatios, ...balanceSheetRatios];

    // Stage 5: Validate
    onProgress?.({
      stage: 'validating',
      progress: 80,
      message: 'Validating data structure...',
    });

    const parsedData: ParsedFinancialData = {
      incomeStatement,
      balanceSheet,
      cashFlow,
      financialRatios: allRatios,
      columnHeaders,
      lastUpdated: new Date().toISOString(),
    };

    const validation = this.validateParsedData(parsedData);

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      console.log('⚠️ Warnings:', validation.warnings);
    }

    // Stage 6: Complete
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Parse complete!',
    });

    return parsedData;
  }

  /**
   * Parse Income Statement sheet (rows 6-18)
   * Financial Ratios section (rows 21-26) are extracted separately
   */
  private parseIncomeStatementSheet(
    worksheet: any,
    XLSX: any
  ): {
    incomeStatement: FinancialRowData[];
    incomeRatios: FinancialRatioData[];
    columnHeaders: string[];
  } {
    const incomeStatement: FinancialRowData[] = [];
    const incomeRatios: FinancialRatioData[] = [];
    let columnHeaders: string[] = [];

    // Extract column headers from row 4 (Financial Year)
    columnHeaders = this.extractColumnHeaders(worksheet, 4, XLSX);
    //  this.log('📅 Column headers:', columnHeaders);

    const colCount = columnHeaders.length || EXPECTED_COLUMN_COUNT;

    // ===== INCOME STATEMENT ROWS (6-18) =====
    // this.log('📊 Parsing Income Statement...');
    const incomeRows = [
      { row: 6, label: 'Revenue' },
      { row: 7, label: 'Cost of sales' },
      { row: 8, label: 'Gross Profit' },
      { row: 9, label: 'Administrative expenses' },
      {
        row: 10,
        label: 'Other Operating Expenses (Excl depreciation & amortisation)',
      },
      { row: 11, label: 'Salaries & Staff Cost' },
      { row: 12, label: 'EBITDA' },
      { row: 13, label: 'Interest Income' },
      { row: 14, label: 'Finances Cost' },
      { row: 15, label: 'Depreciation & Amortisation' },
      { row: 16, label: 'Profit before tax' },
      { row: 17, label: 'Income tax expense' },
      { row: 18, label: 'Profit/(Loss) for the period' },
    ];

    for (const rowConfig of incomeRows) {
      const rowData = this.extractRowData(
        worksheet,
        rowConfig.row,
        colCount,
        XLSX
      );
      if (rowData) {
        incomeStatement.push({
          label: rowData.label,
          values: rowData.values,
          editable: !this.isCalculatedIncomeField(rowData.label),
        });
      }
    }

    // ===== FINANCIAL RATIOS ROWS (21-26) on Income Statement sheet =====
    // this.log('📊 Parsing Financial Ratios from Income Statement...');
    const ratioRows = [
      { row: 21, label: 'Sales Growth' },
      { row: 22, label: 'Gross profit margin' },
      { row: 23, label: 'Cost to Income ratio' },
      { row: 24, label: 'Operating margin (EBITDA)' },
      { row: 25, label: 'Interest Cover Ratio' },
      { row: 26, label: 'Net Operating Profit Margin' },
    ];

    for (const ratioConfig of ratioRows) {
      const rowData = this.extractRowData(
        worksheet,
        ratioConfig.row,
        colCount,
        XLSX
      );
      if (rowData) {
        incomeRatios.push({
          label: rowData.label,
          values: rowData.values,
          type: this.getRatioType(rowData.label),
          editable: false,
        });
      }
    }

    return { incomeStatement, incomeRatios, columnHeaders };
  }

  /**
   * Parse Balance Sheet sheet (EXACT TEMPLATE MAPPING)
   * Template structure from financial_template.xlsx:
   * - Row 5: Non-Current Assets (subtotal header)
   * - Rows 6-13: Non-current asset items
   * - Row 15: Current Assets (subtotal header)
   * - Rows 16-20: Current asset items
   * - Row 22: Total Assets
   * - Row 26: Equities (subtotal header)
   * - Rows 27-30: Equity items
   * - Row 32: Liabilities (subtotal header)
   * - Rows 33-38: Long-term liability items
   * - Row 40: Current Liabilities (subtotal header)
   * - Rows 41-42: Current liability items
   * - Row 44: Total Equities and Liabilities
   * - Rows 47-59: Financial Ratios
   */
  private parseBalanceSheetSheet(
    worksheet: any,
    XLSX: any,
    expectedColCount: number
  ): {
    balanceSheet: BalanceSheetRowData[];
    balanceSheetRatios: FinancialRatioData[];
  } {
    const balanceSheet: BalanceSheetRowData[] = [];
    const balanceSheetRatios: FinancialRatioData[] = [];
    const colCount = expectedColCount || EXPECTED_COLUMN_COUNT;

    // ===== ASSETS SECTION =====
    // Non-Current Assets Header (Row 5)
    this.addSectionHeader(
      balanceSheet,
      'Non-Current Assets',
      'assets',
      worksheet,
      XLSX,
      colCount
    );

    // Non-Current Asset Items (Rows 6-13)
    const nonCurrentAssetRows = [6, 7, 8, 9, 10, 11, 12, 13];
    for (const row of nonCurrentAssetRows) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label.trim() !== '') {
        balanceSheet.push({
          label: rowData.label,
          category: 'assets',
          subcategory: 'non-current',
          values: rowData.values,
          editable: !this.isCalculatedBalanceField(rowData.label),
        });
      }
    }

    // Current Assets Header (Row 15)
    this.addSectionHeader(
      balanceSheet,
      'Current Assets',
      'assets',
      worksheet,
      XLSX,
      colCount
    );

    // Current Asset Items (Rows 16-20)
    const currentAssetRows = [16, 17, 18, 19, 20];
    for (const row of currentAssetRows) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label.trim() !== '') {
        balanceSheet.push({
          label: rowData.label,
          category: 'assets',
          subcategory: 'current',
          values: rowData.values,
          editable: !this.isCalculatedBalanceField(rowData.label),
        });
      }
    }

    // Total Assets (Row 22)
    const totalAssetsRow = this.extractRowData(worksheet, 22, colCount, XLSX);
    if (totalAssetsRow) {
      balanceSheet.push({
        label: totalAssetsRow.label,
        category: 'assets',
        isTotal: true,
        values: totalAssetsRow.values,
        editable: false,
      });
    }

    // ===== EQUITIES SECTION =====
    // Equities Header (Row 26)
    this.addSectionHeader(
      balanceSheet,
      'Equities',
      'equity',
      worksheet,
      XLSX,
      colCount
    );

    // Equity Items (Rows 27-30)
    const equityRows = [27, 28, 29, 30];
    for (const row of equityRows) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label.trim() !== '') {
        balanceSheet.push({
          label: rowData.label,
          category: 'equity',
          values: rowData.values,
          editable: !this.isCalculatedBalanceField(rowData.label),
        });
      }
    }

    // ===== LIABILITIES SECTION =====
    // Liabilities Header (Row 32)
    this.addSectionHeader(
      balanceSheet,
      'Liabilities',
      'liabilities',
      worksheet,
      XLSX,
      colCount
    );

    // Long-Term Liability Items (Rows 33-38)
    const longTermLiabilityRows = [33, 34, 35, 36, 37, 38];
    for (const row of longTermLiabilityRows) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label.trim() !== '') {
        balanceSheet.push({
          label: rowData.label,
          category: 'liabilities',
          subcategory: 'non-current',
          values: rowData.values,
          editable: !this.isCalculatedBalanceField(rowData.label),
        });
      }
    }

    // Current Liabilities Header (Row 40)
    this.addSectionHeader(
      balanceSheet,
      'Current Liabilities',
      'liabilities',
      worksheet,
      XLSX,
      colCount
    );

    // Current Liability Items (Rows 41-42)
    const currentLiabilityRows = [41, 42];
    for (const row of currentLiabilityRows) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label.trim() !== '') {
        balanceSheet.push({
          label: rowData.label,
          category: 'liabilities',
          subcategory: 'current',
          values: rowData.values,
          editable: !this.isCalculatedBalanceField(rowData.label),
        });
      }
    }

    // Total Equities and Liabilities (Row 44)
    const totalELRow = this.extractRowData(worksheet, 44, colCount, XLSX);
    if (totalELRow) {
      balanceSheet.push({
        label: totalELRow.label,
        category: 'liabilities',
        isTotal: true,
        values: totalELRow.values,
        editable: false,
      });
    }

    // ===== FINANCIAL RATIOS SECTION (Rows 47-59) =====
    //  this.log('📊 Parsing Financial Ratios from Balance Sheet...');
    const balanceRatioRows = [
      { row: 49, label: 'Return on Equity (ROE)' },
      { row: 50, label: 'Return on Equity (ROA)' },
      { row: 51, label: 'Debt Equity Ratio (Total liabilities)' },
      { row: 54, label: 'Current Ratio' },
      { row: 55, label: 'Acid Test Ratio (Quick Ratio)' },
      { row: 56, label: 'Debtors Days' },
      { row: 57, label: 'Creditors Days' },
      // { row: 58, label: 'Equity Investment Value' },
      { row: 59, label: 'Return on Investment (ROI)' },
    ];

    for (const ratioConfig of balanceRatioRows) {
      const rowData = this.extractRowData(
        worksheet,
        ratioConfig.row,
        colCount,
        XLSX
      );
      if (rowData) {
        balanceSheetRatios.push({
          label: rowData.label,
          values: rowData.values,
          type: this.getRatioType(rowData.label),
          editable: false,
        });
      }
    }

    return { balanceSheet, balanceSheetRatios };
  }

  /**
   * Parse Cash Flow sheet (EXACT TEMPLATE MAPPING)
   * Template structure from financial_template.xlsx:
   * - Row 4: "Cash flows from operating activities" (header)
   * - Rows 6-9: Operating activity items
   * - Row 10: "Net cash from operating activities" (subtotal)
   * - Row 12: "Cash flows from investing activities" (header)
   * - Rows 13-15: Investing activity items
   * - Row 16: "Net cash used in investing activities" (subtotal)
   * - Row 18: "Cash flows from financing activities" (header)
   * - Rows 19-23: Financing activity items
   * - Row 24: "Net cash used in financing activities" (subtotal)
   * - Row 26: "Net increase in cash and cash equivalents" (summary)
   * - Row 28: "Cash and cash equivalents at beginning of period" (summary)
   * - Row 30: "Cash and cash equivalents at end of period" (summary)
   */
  private parseCashFlowSheet(
    worksheet: any,
    XLSX: any,
    expectedColCount: number
  ): CashFlowRowData[] {
    const cashFlow: CashFlowRowData[] = [];
    const colCount = expectedColCount || EXPECTED_COLUMN_COUNT;

    //  this.log('📊 Parsing Cash Flow Statement (Direct Template Mapping)...');

    // ===== OPERATING ACTIVITIES SECTION =====
    // Operating Activities Header (Row 4) - NOT marked as section header, used as row
    const operatingHeader = this.extractRowData(worksheet, 4, colCount, XLSX);
    if (operatingHeader) {
      cashFlow.push({
        label: operatingHeader.label,
        category: 'operating',
        isSubtotal: false, // Header row, not subtotal
        values: operatingHeader.values,
        editable: false,
      });
    }

    // Operating Activity Items (Rows 6-9)
    const operatingRows = [6, 7, 8, 9];
    for (const row of operatingRows) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label.trim() !== '') {
        cashFlow.push({
          label: rowData.label,
          category: 'operating',
          isSubtotal: false,
          values: rowData.values,
          editable: !this.isCalculatedCashFlowField(rowData.label),
        });
      }
    }

    // Net cash from operating activities (Row 10) - Subtotal
    const netOperating = this.extractRowData(worksheet, 10, colCount, XLSX);
    if (netOperating) {
      cashFlow.push({
        label: netOperating.label,
        category: 'operating',
        isSubtotal: true,
        values: netOperating.values,
        editable: false,
      });
    }

    // ===== INVESTING ACTIVITIES SECTION =====
    // Investing Activities Header (Row 12) - NOT marked as section header, used as row
    const investingHeader = this.extractRowData(worksheet, 12, colCount, XLSX);
    if (investingHeader) {
      cashFlow.push({
        label: investingHeader.label,
        category: 'investing',
        isSubtotal: false,
        values: investingHeader.values,
        editable: false,
      });
    }

    // Investing Activity Items (Rows 13-15)
    const investingRows = [13, 14, 15];
    for (const row of investingRows) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label.trim() !== '') {
        cashFlow.push({
          label: rowData.label,
          category: 'investing',
          isSubtotal: false,
          values: rowData.values,
          editable: !this.isCalculatedCashFlowField(rowData.label),
        });
      }
    }

    // Net cash used in investing activities (Row 16) - Subtotal
    const netInvesting = this.extractRowData(worksheet, 16, colCount, XLSX);
    if (netInvesting) {
      cashFlow.push({
        label: netInvesting.label,
        category: 'investing',
        isSubtotal: true,
        values: netInvesting.values,
        editable: false,
      });
    }

    // ===== FINANCING ACTIVITIES SECTION =====
    // Financing Activities Header (Row 18) - NOT marked as section header, used as row
    const financingHeader = this.extractRowData(worksheet, 18, colCount, XLSX);
    if (financingHeader) {
      cashFlow.push({
        label: financingHeader.label,
        category: 'financing',
        isSubtotal: false,
        values: financingHeader.values,
        editable: false,
      });
    }

    // Financing Activity Items (Rows 19-23)
    const financingRows = [19, 20, 21, 22, 23];
    for (const row of financingRows) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label.trim() !== '') {
        cashFlow.push({
          label: rowData.label,
          category: 'financing',
          isSubtotal: false,
          values: rowData.values,
          editable: !this.isCalculatedCashFlowField(rowData.label),
        });
      }
    }

    // Net cash used in financing activities (Row 24) - Subtotal
    const netFinancing = this.extractRowData(worksheet, 24, colCount, XLSX);
    if (netFinancing) {
      cashFlow.push({
        label: netFinancing.label,
        category: 'financing',
        isSubtotal: true,
        values: netFinancing.values,
        editable: false,
      });
    }

    // ===== SUMMARY SECTION =====
    // Net increase in cash (Row 26)
    const netIncrease = this.extractRowData(worksheet, 26, colCount, XLSX);
    if (netIncrease) {
      cashFlow.push({
        label: netIncrease.label,
        category: 'summary',
        isSubtotal: true,
        values: netIncrease.values,
        editable: false,
      });
    }

    // Cash at beginning of period (Row 28)
    const cashBeginning = this.extractRowData(worksheet, 28, colCount, XLSX);
    if (cashBeginning) {
      cashFlow.push({
        label: cashBeginning.label,
        category: 'summary',
        isSubtotal: false,
        values: cashBeginning.values,
        editable: false,
      });
    }

    // Cash at end of period (Row 30)
    const cashEnding = this.extractRowData(worksheet, 30, colCount, XLSX);
    if (cashEnding) {
      cashFlow.push({
        label: cashEnding.label,
        category: 'summary',
        isSubtotal: true,
        values: cashEnding.values,
        editable: false,
      });
    }

    return cashFlow;
  }
  // ===== HELPER METHODS =====

  private addSectionHeader(
    data: BalanceSheetRowData[],
    label: string,
    category: 'assets' | 'liabilities' | 'equity',
    worksheet: any,
    XLSX: any,
    colCount: number
  ): void {
    data.push({
      label,
      category,
      isSectionHeader: true,
      values: Array(colCount).fill(0),
      editable: false,
    });
  }

  private addCashFlowSection(
    data: CashFlowRowData[],
    category: 'operating' | 'investing' | 'financing',
    sectionLabel: string,
    worksheet: any,
    XLSX: any,
    rows: number[],
    colCount: number
  ): void {
    for (const row of rows) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label) {
        data.push({
          label: rowData.label,
          category,
          values: rowData.values,
          editable: !this.isCalculatedCashFlowField(rowData.label),
        });
      }
    }
  }

  private extractColumnHeaders(
    worksheet: any,
    rowNum: number,
    XLSX: any
  ): string[] {
    const headers: string[] = [];

    for (let col = 2; col <= 15; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowNum - 1, c: col - 1 });
      const cell = worksheet[cellAddress];

      if (cell?.v) {
        const value = cell.v.toString().trim();
        if (value && (value.includes('/') || /^\d{4}/.test(value))) {
          headers.push(value);
        }
      }
    }

    return headers;
  }

  private extractRowData(
    worksheet: any,
    rowNum: number,
    colCount: number,
    XLSX: any
  ): { label: string; values: number[] } | null {
    const labelCell =
      worksheet[XLSX.utils.encode_cell({ r: rowNum - 1, c: 0 })];
    if (!labelCell?.v) return null;

    const label = labelCell.v.toString().trim();
    if (!label) return null;

    const values: number[] = [];
    for (let col = 2; col <= colCount + 1; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowNum - 1, c: col - 1 });
      const cell = worksheet[cellAddress];

      let numValue = 0;
      if (cell?.v !== undefined) {
        if (typeof cell.v === 'number') {
          numValue = cell.v;
        } else {
          const parsed = parseFloat(cell.v.toString().replace(/[,\s]/g, ''));
          numValue = isNaN(parsed) ? 0 : parsed;
        }
      }
      values.push(numValue);
    }

    return { label, values };
  }

  validateParsedData(data: ParsedFinancialData): ParseValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.incomeStatement.length === 0) {
      errors.push('No Income Statement data found');
    }

    if (!data.balanceSheet || data.balanceSheet.length === 0) {
      warnings.push('No Balance Sheet data found');
    }

    if (!data.cashFlow || data.cashFlow.length === 0) {
      warnings.push('No Cash Flow data found');
    }

    if (data.columnHeaders.length === 0) {
      errors.push('No year headers found');
    }

    const hasIncomeData = data.incomeStatement.some((row) =>
      row.values.some((val) => val !== 0)
    );
    const hasBalanceData = data.balanceSheet?.some((row) =>
      row.values.some((val) => val !== 0)
    );
    const hasCashFlowData = data.cashFlow?.some((row) =>
      row.values.some((val) => val !== 0)
    );

    if (!hasIncomeData && !hasBalanceData && !hasCashFlowData) {
      warnings.push('All values are zero - template may be empty');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private isCalculatedIncomeField(label: string): boolean {
    const calculatedFields = [
      'Gross Profit',
      'EBITDA',
      'Profit before tax',
      'Profit/(Loss) for the period',
    ];
    return calculatedFields.some((field) =>
      label.toLowerCase().includes(field.toLowerCase())
    );
  }

  private isCalculatedBalanceField(label: string): boolean {
    const calculatedFields = [
      'Total Assets',
      'Total Equities and Liabilities',
      'Total Current Assets',
      'Total Non-Current Assets',
      'Total Liabilities',
      'Total Current Liabilities',
      'Total Non-Current Liabilities',
      'Total Equity',
      'Total Shareholders Equity',
    ];
    return calculatedFields.some(
      (field) => label.toLowerCase().trim() === field.toLowerCase().trim()
    );
  }

  private isCalculatedCashFlowField(label: string): boolean {
    const calculatedFields = [
      'Net cash from operating activities',
      'Net cash used in investing activities',
      'Net cash used in financing activities',
      'Net increase in cash and cash equivalents',
      'Cash and cash equivalents at end of period',
    ];
    return calculatedFields.some((field) =>
      label.toLowerCase().includes(field.toLowerCase())
    );
  }

  private isBalanceSectionHeader(label: string): boolean {
    const headers = [
      'Non-Current Assets',
      'Current Assets',
      'Total Assets',
      'Equities',
      'Liabilities',
      'Non-Current Liabilities',
      'Current Liabilities',
      'Total Equities and Liabilities',
    ];
    return headers.some((h) => label.toLowerCase() === h.toLowerCase());
  }

  private getRatioType(label: string): 'ratio' | 'percentage' | 'currency' {
    // Days metrics show as plain numbers (no suffix)
    if (label.toLowerCase().includes('days')) {
      return 'ratio';
    }

    if (
      label.toLowerCase().includes('margin') ||
      label.toLowerCase().includes('growth')
    ) {
      return 'percentage';
    }

    if (
      label.toLowerCase().includes('ratio') ||
      label.toLowerCase().includes('cover')
    ) {
      return 'ratio';
    }

    if (
      label.toLowerCase().includes('value') ||
      label.toLowerCase().includes('equity')
    ) {
      return 'currency';
    }

    return 'percentage';
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
