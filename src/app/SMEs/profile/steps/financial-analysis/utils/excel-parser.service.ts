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
  values: number[];
  editable: boolean;
}

export interface CashFlowRowData {
  label: string;
  category: 'operating' | 'investing' | 'financing' | 'summary';
  values: number[];
  editable: boolean;
}

export interface FinancialRatioData extends FinancialRowData {
  type: 'ratio' | 'percentage' | 'currency';
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

// Constants
const EXPECTED_COLUMN_COUNT = 7;

@Injectable({
  providedIn: 'root',
})
export class ExcelFinancialParserService {
  private debugMode = true;

  async parseFinancialExcel(
    file: File,
    onProgress?: (progress: ParseProgress) => void
  ): Promise<ParsedFinancialData> {
    this.log(
      '🔄 Starting Excel parse for:',
      file.name,
      `(${this.formatBytes(file.size)})`
    );

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

    this.log('✓ Workbook loaded:', {
      sheets: workbook.SheetNames.length,
      sheetNames: workbook.SheetNames,
    });

    // Stage 3: Validate sheet structure
    const hasBalanceSheet = workbook.SheetNames.some((name) =>
      name.toLowerCase().includes('balance')
    );
    const hasCashFlow = workbook.SheetNames.some(
      (name) =>
        name.toLowerCase().includes('cash') ||
        name.toLowerCase().includes('cashflow')
    );

    if (!hasBalanceSheet) {
      throw new Error(
        'Missing "Balance Sheet" sheet. Please use the correct template.'
      );
    }

    // Stage 4: Extract data from each sheet
    onProgress?.({
      stage: 'extracting',
      progress: 50,
      message: 'Extracting financial data...',
    });

    // Find sheet names (case-insensitive)
    const balanceSheetName = workbook.SheetNames.find((name) =>
      name.toLowerCase().includes('balance')
    )!;
    const cashFlowSheetName = workbook.SheetNames.find(
      (name) =>
        name.toLowerCase().includes('cash') ||
        name.toLowerCase().includes('cashflow')
    );

    this.log('📊 Using sheets:', { balanceSheetName, cashFlowSheetName });

    // Parse Balance Sheet (contains Income Statement, Ratios, and Balance Sheet)
    const balanceSheetWorksheet = workbook.Sheets[balanceSheetName];
    const { incomeStatement, financialRatios, balanceSheet, columnHeaders } =
      this.parseBalanceSheetSheet(balanceSheetWorksheet, XLSX);

    // Parse Cash Flow sheet (if exists)
    let cashFlow: CashFlowRowData[] = [];
    if (cashFlowSheetName) {
      const cashFlowWorksheet = workbook.Sheets[cashFlowSheetName];
      cashFlow = this.parseCashFlowSheet(
        cashFlowWorksheet,
        XLSX,
        columnHeaders.length
      );
    }

    // Stage 5: Validate
    onProgress?.({
      stage: 'validating',
      progress: 80,
      message: 'Validating data structure...',
    });

    const parsedData: ParsedFinancialData = {
      incomeStatement,
      financialRatios,
      balanceSheet,
      cashFlow,
      columnHeaders,
      lastUpdated: new Date().toISOString(),
    };

    const validation = this.validateParsedData(parsedData);

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      this.log('⚠️ Warnings:', validation.warnings);
    }

    // Stage 6: Complete
    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Parse complete!',
    });

    this.log('✅ Parse successful:', {
      incomeRows: parsedData.incomeStatement.length,
      ratioRows: parsedData.financialRatios.length,
      balanceSheetRows: parsedData.balanceSheet?.length || 0,
      cashFlowRows: parsedData.cashFlow?.length || 0,
      headers: parsedData.columnHeaders,
    });

    return parsedData;
  }

  /**
   * Parse the "Balance Sheet" sheet which contains:
   * - Income Statement (rows 6-18)
   * - Financial Ratios (rows 21-26)
   * - Balance Sheet (rows 30-70)
   */
  private parseBalanceSheetSheet(
    worksheet: any,
    XLSX: any
  ): {
    incomeStatement: FinancialRowData[];
    financialRatios: FinancialRatioData[];
    balanceSheet: BalanceSheetRowData[];
    columnHeaders: string[];
  } {
    const incomeStatement: FinancialRowData[] = [];
    const financialRatios: FinancialRatioData[] = [];
    const balanceSheet: BalanceSheetRowData[] = [];
    let columnHeaders: string[] = [];

    // Get column headers from row 4 (Financial Year row)
    columnHeaders = this.extractColumnHeaders(worksheet, 4, XLSX);
    this.log('📅 Column headers:', columnHeaders);

    const colCount = columnHeaders.length || EXPECTED_COLUMN_COUNT;

    // Parse Income Statement (rows 6-18)
    this.log('📊 Parsing Income Statement...');
    for (let row = 6; row <= 18; row++) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label) {
        incomeStatement.push({
          label: rowData.label,
          values: rowData.values,
          editable: !this.isCalculatedIncomeField(rowData.label),
        });
      }
    }

    // Parse Financial Ratios (rows 21-26)
    this.log('📊 Parsing Financial Ratios...');
    for (let row = 21; row <= 26; row++) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label) {
        financialRatios.push({
          label: rowData.label,
          values: rowData.values,
          type: this.getRatioType(rowData.label),
          editable: false,
        });
      }
    }

    // Parse Balance Sheet - Assets
    this.log('📊 Parsing Balance Sheet...');

    // Non-Current Assets (rows 31-39)
    for (let row = 31; row <= 39; row++) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label) {
        balanceSheet.push({
          label: rowData.label,
          category: 'assets',
          subcategory: 'non-current',
          values: rowData.values,
          editable: !this.isCalculatedBalanceField(rowData.label),
        });
      }
    }

    // Current Assets (rows 41-46)
    for (let row = 41; row <= 46; row++) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label) {
        balanceSheet.push({
          label: rowData.label,
          category: 'assets',
          subcategory: 'current',
          values: rowData.values,
          editable: !this.isCalculatedBalanceField(rowData.label),
        });
      }
    }

    // Total Assets (row 48)
    const totalAssetsRow = this.extractRowData(worksheet, 48, colCount, XLSX);
    if (totalAssetsRow && totalAssetsRow.label) {
      balanceSheet.push({
        label: totalAssetsRow.label,
        category: 'assets',
        values: totalAssetsRow.values,
        editable: false,
      });
    }

    // Equity (rows 52-56)
    for (let row = 52; row <= 56; row++) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label) {
        balanceSheet.push({
          label: rowData.label,
          category: 'equity',
          values: rowData.values,
          editable: !this.isCalculatedBalanceField(rowData.label),
        });
      }
    }

    // Non-Current Liabilities (rows 58-64) - labeled as "Liabilities" in Charles's template
    for (let row = 58; row <= 64; row++) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label) {
        balanceSheet.push({
          label: rowData.label,
          category: 'liabilities',
          subcategory: 'non-current',
          values: rowData.values,
          editable: !this.isCalculatedBalanceField(rowData.label),
        });
      }
    }

    // Current Liabilities (rows 66-68)
    for (let row = 66; row <= 68; row++) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label) {
        balanceSheet.push({
          label: rowData.label,
          category: 'liabilities',
          subcategory: 'current',
          values: rowData.values,
          editable: !this.isCalculatedBalanceField(rowData.label),
        });
      }
    }

    // Total Equities and Liabilities (row 70)
    const totalELRow = this.extractRowData(worksheet, 70, colCount, XLSX);
    if (totalELRow && totalELRow.label) {
      balanceSheet.push({
        label: totalELRow.label,
        category: 'liabilities',
        values: totalELRow.values,
        editable: false,
      });
    }

    return { incomeStatement, financialRatios, balanceSheet, columnHeaders };
  }

  /**
   * Parse the "CashFlow" sheet
   */
  private parseCashFlowSheet(
    worksheet: any,
    XLSX: any,
    expectedColCount: number
  ): CashFlowRowData[] {
    const cashFlow: CashFlowRowData[] = [];
    const colCount = expectedColCount || EXPECTED_COLUMN_COUNT;

    this.log('📊 Parsing Cash Flow Statement...');

    // Operating Activities (rows 6-10)
    for (let row = 6; row <= 10; row++) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label) {
        cashFlow.push({
          label: rowData.label,
          category: 'operating',
          values: rowData.values,
          editable: !this.isCalculatedCashFlowField(rowData.label),
        });
      }
    }

    // Investing Activities (rows 12-16) - include header row 12
    for (let row = 12; row <= 16; row++) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label) {
        // Skip the header row for data but could include for display
        if (
          !rowData.label.toLowerCase().includes('cash flows from investing')
        ) {
          cashFlow.push({
            label: rowData.label,
            category: 'investing',
            values: rowData.values,
            editable: !this.isCalculatedCashFlowField(rowData.label),
          });
        }
      }
    }

    // Financing Activities (rows 18-24) - include header row 18
    for (let row = 18; row <= 24; row++) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label) {
        // Skip the header row for data
        if (
          !rowData.label.toLowerCase().includes('cash flows from financing')
        ) {
          cashFlow.push({
            label: rowData.label,
            category: 'financing',
            values: rowData.values,
            editable: !this.isCalculatedCashFlowField(rowData.label),
          });
        }
      }
    }

    // Summary rows (26, 28, 30)
    const summaryRows = [26, 28, 30];
    for (const row of summaryRows) {
      const rowData = this.extractRowData(worksheet, row, colCount, XLSX);
      if (rowData && rowData.label) {
        cashFlow.push({
          label: rowData.label,
          category: 'summary',
          values: rowData.values,
          editable: !this.isCalculatedCashFlowField(rowData.label),
        });
      }
    }

    return cashFlow;
  }

  /**
   * Extract column headers from a specific row
   */
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

  /**
   * Extract row data (label + values)
   */
  private extractRowData(
    worksheet: any,
    rowNum: number,
    colCount: number,
    XLSX: any
  ): { label: string; values: number[] } | null {
    // Get label from column A
    const labelCell =
      worksheet[XLSX.utils.encode_cell({ r: rowNum - 1, c: 0 })];
    if (!labelCell?.v) return null;

    const label = labelCell.v.toString().trim();
    if (!label) return null;

    // Get values from columns B onwards
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

  /**
   * Validate parsed data
   */
  validateParsedData(data: ParsedFinancialData): ParseValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for minimum data
    if (data.incomeStatement.length === 0) {
      errors.push('No Income Statement data found');
    }

    if (data.financialRatios.length === 0) {
      warnings.push('No Financial Ratios found');
    }

    if (!data.balanceSheet || data.balanceSheet.length === 0) {
      warnings.push('No Balance Sheet data found');
    }

    if (!data.cashFlow || data.cashFlow.length === 0) {
      warnings.push('No Cash Flow data found');
    }

    // Check column headers
    if (data.columnHeaders.length === 0) {
      errors.push('No year headers found');
    }

    // Check for actual data (not all zeros)
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

  // ===============================
  // HELPER METHODS
  // ===============================

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
      'Non-Currents Assets', // Section header
      'Current Assets', // Section header
      'Equities', // Section header
      'Liabilities', // Section header
      'Current Liabilities', // Section header
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

  private getRatioType(label: string): 'ratio' | 'percentage' | 'currency' {
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

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private log(...args: any[]) {
    if (this.debugMode) {
      console.log('[ExcelParser]', ...args);
    }
  }

  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }
}
