// src/app/shared/services/excel-financial-parser.service.ts
import { Injectable } from '@angular/core';

export interface FinancialRowData {
  label: string;
  values: number[];
  editable?: boolean;
}

export interface FinancialRatioData extends FinancialRowData {
  type: 'ratio' | 'percentage' | 'currency';
}

export interface ParsedFinancialData {
  incomeStatement: FinancialRowData[];
  financialRatios: FinancialRatioData[];
  columnHeaders: string[];
  lastUpdated: string;
  uploadedFile?: {
    documentKey: string;
    fileName: string;
    publicUrl: string;
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
const EXPECTED_COLUMN_COUNT = 9;
const MAX_COLUMNS_TO_SCAN = 15; // Only scan first 15 columns
const MAX_ROWS_TO_SCAN = 150; // Limit row scanning

const EXPECTED_INCOME_STATEMENT_ROWS = [
  'Revenue',
  'Cost of sales', 
  'Gross Profit',
  'Administrative expenses',
  'Other Operating Expenses (Excl depreciation & amortisation)',
  'Salaries & Staff Cost',
  'EBITDA',
  'Interest Income',
  'Finances Cost',
  'Depreciation & Amortisation',
  'Profit before tax'
];

const EXPECTED_RATIO_ROWS = [
  'Return on Equity (ROE)',
  'Debt Equity Ratio (Total liabilities)',
  'Current Ratio',
  'Acid Test Ratio (Quick Ratio)',
  'Equity Investment Value',
  'Return on Investment (ROI)',
  'Sales Growth',
  'Gross profit margin',
  'Cost to Income ratio',
  'Operating margin (EBITDA)',
  'Interest Cover Ratio',
  'Net Operating Profit Margin'
];

@Injectable({
  providedIn: 'root'
})
export class ExcelFinancialParserService {
  private debugMode = true;

  async parseFinancialExcel(
    file: File,
    onProgress?: (progress: ParseProgress) => void
  ): Promise<ParsedFinancialData> {
    
    this.log('🔄 Starting Excel parse for:', file.name, `(${this.formatBytes(file.size)})`);
    
    // Stage 1: Read file
    onProgress?.({ stage: 'reading', progress: 10, message: 'Reading Excel file...' });
    const arrayBuffer = await this.readFileAsArrayBuffer(file);
    
    // Stage 2: Parse workbook (optimized)
    onProgress?.({ stage: 'parsing', progress: 30, message: 'Parsing workbook structure...' });
    const XLSX = await import('xlsx');
    
    const workbook = XLSX.read(arrayBuffer, { 
      type: 'array',
      cellStyles: false,
      sheetStubs: false,
      bookVBA: false,
      cellFormula: false // Skip formulas to speed up
    });
    
    this.log('✓ Workbook loaded:', {
      sheets: workbook.SheetNames.length,
      sheetNames: workbook.SheetNames
    });
    
    // Stage 3: Find correct sheet
    const targetSheet = this.findFinancialSheet(workbook);
    if (!targetSheet) {
      throw new Error('Could not find financial data sheet. Expected sheet with income statement data.');
    }
    
    this.log('✓ Using sheet:', targetSheet.name);
    
    // Stage 4: Extract data (optimized with column limits)
    onProgress?.({ stage: 'extracting', progress: 50, message: 'Extracting financial data...' });
    const worksheet = workbook.Sheets[targetSheet.name];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');
    
    this.log('Sheet dimensions:', {
      rows: range.e.r + 1,
      cols: range.e.c + 1,
      scanning: `Limited to ${MAX_COLUMNS_TO_SCAN} cols × ${MAX_ROWS_TO_SCAN} rows`
    });
    
    const parsedData = this.extractFinancialData(worksheet, range, XLSX);
    
    // Stage 5: Validate
    onProgress?.({ stage: 'validating', progress: 80, message: 'Validating data structure...' });
    const validation = this.validateParsedData(parsedData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      this.log('⚠️ Warnings:', validation.warnings);
    }
    
    // Stage 6: Complete
    onProgress?.({ stage: 'complete', progress: 100, message: 'Parse complete!' });
    this.log('✅ Parse successful:', {
      incomeRows: parsedData.incomeStatement.length,
      ratioRows: parsedData.financialRatios.length,
      headers: parsedData.columnHeaders
    });
    
    return parsedData;
  }

  private findFinancialSheet(workbook: any): { name: string, index: number } | null {
    // Priority order: look for sheets with financial data
    const priorityNames = ['Financial Analysis', 'F. Ratios', 'Financials', 'Income Statement'];
    
    for (const targetName of priorityNames) {
      const exactMatch = workbook.SheetNames.find((name: string) => 
        name.toLowerCase().includes(targetName.toLowerCase())
      );
      if (exactMatch) {
        return { name: exactMatch, index: workbook.SheetNames.indexOf(exactMatch) };
      }
    }
    
    // Fallback: use first sheet
    this.log('⚠️ No specific financial sheet found, using first sheet');
    return { name: workbook.SheetNames[0], index: 0 };
  }

  private extractFinancialData(worksheet: any, range: any, XLSX: any): ParsedFinancialData {
    // OPTIMIZATION: Limit scanning range
    const maxRow = Math.min(range.e.r, MAX_ROWS_TO_SCAN);
    const maxCol = Math.min(range.e.c, MAX_COLUMNS_TO_SCAN);
    
    this.log('📊 Extracting data from limited range:', { maxRow, maxCol });
    
    // Find header row (should be within first 5 rows)
    let headerRow = -1;
    const headers: string[] = [];
    
    for (let row = 0; row <= Math.min(5, maxRow); row++) {
      const potentialHeaders: string[] = [];
      
      for (let col = 1; col <= maxCol; col++) { // Start from col 1 (skip label column)
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        
        if (cell?.v) {
          const value = cell.v.toString().trim();
          if (value) {
            potentialHeaders.push(value);
          }
        }
      }
      
      // Look for year-like patterns or numeric headers
      if (potentialHeaders.length >= 3 && this.looksLikeHeaderRow(potentialHeaders)) {
        headerRow = row;
        headers.push(...potentialHeaders.slice(0, EXPECTED_COLUMN_COUNT));
        this.log('✓ Found header row:', row, headers);
        break;
      }
    }
    
    if (headerRow === -1) {
      this.log('⚠️ No header row found, generating default headers');
      headers.push(...this.generateDefaultHeaders());
      headerRow = 3; // Assume row 3 based on file inspection
    }
    
    // Extract data rows
    const incomeStatement: FinancialRowData[] = [];
    const financialRatios: FinancialRatioData[] = [];
    
    const dataStartRow = headerRow + 1;
    let currentSection: 'income' | 'ratios' | 'unknown' = 'unknown';
    
    for (let row = dataStartRow; row <= maxRow; row++) {
      const labelCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
      if (!labelCell?.v) continue;
      
      const label = labelCell.v.toString().trim();
      if (!label) continue;
      
      // Detect section changes
      if (this.isSectionHeader(label)) {
        if (label.toLowerCase().includes('income')) {
          currentSection = 'income';
          this.log('→ Entering Income Statement section at row', row);
        } else if (label.toLowerCase().includes('ratio')) {
          currentSection = 'ratios';
          this.log('→ Entering Financial Ratios section at row', row);
        }
        continue;
      }
      
      // Extract row values (OPTIMIZED: only scan needed columns)
      const values: number[] = [];
      for (let col = 1; col <= Math.min(EXPECTED_COLUMN_COUNT + 1, maxCol); col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
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
        
        if (values.length >= EXPECTED_COLUMN_COUNT) break;
      }
      
      // Normalize to expected column count
      while (values.length < EXPECTED_COLUMN_COUNT) values.push(0);
      if (values.length > EXPECTED_COLUMN_COUNT) values.splice(EXPECTED_COLUMN_COUNT);
      
      // Categorize row
      const isIncomeRow = this.matchesIncomeStatement(label);
      const isRatioRow = this.matchesFinancialRatio(label);
      
      if (isIncomeRow || currentSection === 'income') {
        const matchedLabel = this.findMatchingLabel(label, EXPECTED_INCOME_STATEMENT_ROWS) || label;
        incomeStatement.push({
          label: matchedLabel,
          values,
          editable: !this.isCalculatedField(matchedLabel)
        });
      } else if (isRatioRow || currentSection === 'ratios') {
        const matchedLabel = this.findMatchingLabel(label, EXPECTED_RATIO_ROWS) || label;
        financialRatios.push({
          label: matchedLabel,
          values,
          type: this.getRatioType(matchedLabel),
          editable: !this.isCalculatedRatio(matchedLabel)
        });
      }
      
      // Early exit optimization
      if (incomeStatement.length >= EXPECTED_INCOME_STATEMENT_ROWS.length && 
          financialRatios.length >= EXPECTED_RATIO_ROWS.length) {
        this.log('✓ All expected rows found, stopping scan at row', row);
        break;
      }
    }
    
    return {
      incomeStatement,
      financialRatios,
      columnHeaders: headers.length > 0 ? headers : this.generateDefaultHeaders(),
      lastUpdated: new Date().toISOString()
    };
  }

  validateParsedData(data: ParsedFinancialData): ParseValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check income statement
    const foundIncomeLabels = data.incomeStatement.map(row => row.label);
    const missingIncome = EXPECTED_INCOME_STATEMENT_ROWS.filter(expected => 
      !foundIncomeLabels.includes(expected)
    );
    
    if (missingIncome.length > 3) { // Allow some flexibility
      warnings.push(`Missing ${missingIncome.length} income statement rows`);
    }
    
    // Check financial ratios
    const foundRatioLabels = data.financialRatios.map(row => row.label);
    const missingRatios = EXPECTED_RATIO_ROWS.filter(expected => 
      !foundRatioLabels.includes(expected)
    );
    
    if (missingRatios.length > 3) {
      warnings.push(`Missing ${missingRatios.length} financial ratio rows`);
    }
    
    // Check data presence
    const hasData = data.incomeStatement.some(row => row.values.some(val => val !== 0)) ||
                    data.financialRatios.some(row => row.values.some(val => val !== 0));
    
    if (!hasData) {
      errors.push('No financial data found in the template');
    }
    
    // Check column count
    if (data.columnHeaders.length !== EXPECTED_COLUMN_COUNT) {
      warnings.push(`Expected ${EXPECTED_COLUMN_COUNT} time periods, found ${data.columnHeaders.length}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // ===============================
  // HELPER METHODS
  // ===============================

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  }

  private looksLikeHeaderRow(values: string[]): boolean {
    // Check if values look like year headers or time periods
    const yearPattern = /\d{4}\/\d{2}|\d{4}-\d{2}|20\d{2}|Y-\d+|P\+\d+/;
    const matchCount = values.filter(v => yearPattern.test(v)).length;
    return matchCount >= 3; // At least 3 year-like values
  }

  private isSectionHeader(label: string): boolean {
    const lower = label.toLowerCase();
    return lower.includes('income statement') || 
           lower.includes('financial ratio') ||
           lower.includes('amounts in');
  }

  private matchesIncomeStatement(label: string): boolean {
    return EXPECTED_INCOME_STATEMENT_ROWS.some(expected => 
      this.fuzzyMatch(label, expected)
    );
  }

  private matchesFinancialRatio(label: string): boolean {
    return EXPECTED_RATIO_ROWS.some(expected => 
      this.fuzzyMatch(label, expected)
    );
  }

  private fuzzyMatch(input: string, target: string): boolean {
    const inputLower = input.toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetLower = target.toLowerCase().replace(/[^a-z0-9]/g, '');
    return inputLower.includes(targetLower) || targetLower.includes(inputLower);
  }

  private findMatchingLabel(input: string, candidates: string[]): string | null {
    return candidates.find(candidate => this.fuzzyMatch(input, candidate)) || null;
  }

  private isCalculatedField(label: string): boolean {
    return ['Gross Profit', 'EBITDA', 'Profit before tax'].includes(label);
  }

  private isCalculatedRatio(label: string): boolean {
    return [
      'Return on Equity (ROE)',
      'Return on Investment (ROI)', 
      'Sales Growth',
      'Gross profit margin',
      'Cost to Income ratio',
      'Operating margin (EBITDA)',
      'Interest Cover Ratio',
      'Net Operating Profit Margin'
    ].includes(label);
  }

  private getRatioType(label: string): 'ratio' | 'percentage' | 'currency' {
    if (label.includes('Equity Investment Value')) return 'currency';
    if (label.includes('margin') || label.includes('Growth') || 
        label.includes('ROE') || label.includes('ROI')) return 'percentage';
    return 'ratio';
  }

  private generateDefaultHeaders(): string[] {
    const currentYear = new Date().getFullYear();
    return [
      `${currentYear - 3}`, 
      `${currentYear - 2}`, 
      `${currentYear - 1}`, 
      `${currentYear}`, 
      `${currentYear + 1}`, 
      `${currentYear + 2}`, 
      `${currentYear + 3}`, 
      `${currentYear + 4}`, 
      `${currentYear + 5}`
    ];
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