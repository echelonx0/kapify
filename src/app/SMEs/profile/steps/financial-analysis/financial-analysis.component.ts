// src/app/profile/steps/financial-analysis/financial-analysis.component.ts - FIXED WITH REAL EXCEL PARSING
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiCardComponent, UiButtonComponent } from '../../../../shared/components';
import { LucideAngularModule, Upload, Download, FileSpreadsheet, Save, Clock, Edit2, AlertCircle, CheckCircle, X } from 'lucide-angular';
import { interval, Subscription, Subject } from 'rxjs';
import { debounceTime, takeWhile, takeUntil } from 'rxjs/operators';
import { SupabaseDocumentService } from '../../../../shared/services/supabase-document.service';
import * as XLSX from 'xlsx';
import { SMEProfileStepsService } from '../../../services/sme-profile-steps.service';

interface FinancialRowData {
  label: string;
  values: number[];
  editable?: boolean;
}

interface FinancialRatioData extends FinancialRowData {
  type: 'ratio' | 'percentage' | 'currency';
}

interface ParsedFinancialData {
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

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Expected template structure for validation
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

@Component({
  selector: 'app-financial-analysis',
  standalone: true,
  imports: [FormsModule, UiCardComponent, UiButtonComponent, LucideAngularModule],
  templateUrl: 'financial-analysis.component.html'
})
export class FinancialAnalysisComponent implements OnInit, OnDestroy {
  private profileService = inject(SMEProfileStepsService);
  private documentService = inject(SupabaseDocumentService);

  // State signals
  isSaving = signal(false);
  isUploading = signal(false);
  lastSaved = signal<Date | null>(null);
  uploadedTemplate = signal<File | null>(null);
  editingMode = signal(false);
  notesText = '';
  
  // Parsing state
  isParsingFile = signal(false);
  parseError = signal<string | null>(null);
  parseWarnings = signal<string[]>([]);

  // Data signals
  incomeStatementData = signal<FinancialRowData[]>([]);
  financialRatiosData = signal<FinancialRatioData[]>([]);
  columnHeaders = signal<string[]>([]);
  
  // Existing financial data from profile
  existingData = signal<ParsedFinancialData | null>(null);

  // Icons
  UploadIcon = Upload;
  DownloadIcon = Download;
  FileSpreadsheetIcon = FileSpreadsheet;
  SaveIcon = Save;
  ClockIcon = Clock;
  EditIcon = Edit2;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  XIcon = X;

  // Auto-save management
  private autoSaveSubscription?: Subscription;
  private destroy$ = new Subject<void>();
  private dataChangeSubject = new Subject<void>();

  ngOnInit() {
    this.loadExistingData();
    this.setupAutoSave();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.autoSaveSubscription?.unsubscribe();
  }

  // ===============================
  // DATA LOADING & INITIALIZATION
  // ===============================

  private loadExistingData() {
    const profileData = this.profileService.data();
    const financialAnalysis = profileData.financialAnalysis;
    
    if (financialAnalysis && this.isValidFinancialData(financialAnalysis)) {
      this.existingData.set(financialAnalysis as ParsedFinancialData);
      this.loadFromExistingData(financialAnalysis as ParsedFinancialData);
      console.log('✅ Loaded existing financial data');
      console.log('Existing Data:', financialAnalysis);
    } else {
      this.initializeEmptyData();
      console.log('ℹ️ No existing financial data, initialized empty structure');
    }
  }

  private isValidFinancialData(data: any): boolean {
    return data && 
           data.incomeStatement && 
           Array.isArray(data.incomeStatement) && 
           data.financialRatios && 
           Array.isArray(data.financialRatios);
  }

  private loadFromExistingData(data: ParsedFinancialData) {
    this.incomeStatementData.set(data.incomeStatement || []);
    this.financialRatiosData.set(data.financialRatios || []);
    this.columnHeaders.set(data.columnHeaders || []);
    this.notesText = ''; // Notes would be stored separately
    
    // Check if we have an uploaded file reference
    if (data.uploadedFile) {
      console.log('📄 Found reference to uploaded file:', data.uploadedFile.fileName);
    }
  }

  private initializeEmptyData() {
    const currentYear = new Date().getFullYear();
    const headers = [
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
    
    this.columnHeaders.set(headers);

    // Initialize empty income statement
    this.incomeStatementData.set(
      EXPECTED_INCOME_STATEMENT_ROWS.map(label => ({
        label,
        values: new Array(9).fill(0),
        editable: !this.isCalculatedField(label)
      }))
    );

    // Initialize empty financial ratios
    this.financialRatiosData.set(
      EXPECTED_RATIO_ROWS.map(label => ({
        label,
        values: new Array(9).fill(0),
        type: this.getRatioType(label),
        editable: !this.isCalculatedRatio(label)
      }))
    );
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
    if (label.includes('margin') || label.includes('Growth') || label.includes('ROE') || label.includes('ROI')) return 'percentage';
    return 'ratio';
  }

  // ===============================
  // FILE UPLOAD & PARSING - REAL IMPLEMENTATION
  // ===============================

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('border-primary-500', 'bg-primary-100');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('border-primary-500', 'bg-primary-100');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('border-primary-500', 'bg-primary-100');
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      this.processFile(file);
      input.value = '';
    }
  }

  triggerFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e) => this.onFileSelected(e);
    input.click();
  }

  

  private async uploadFileToStorage(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      this.documentService.uploadDocument(
        file, 
        'financial-template', 
        undefined, 
        'financial'
      ).subscribe({
        next: (result) => resolve(result),
        error: (error) => reject(new Error(`File upload failed: ${error.message}`))
      });
    });
  }
 

 
 

// Add this for better user feedback
getProcessingStatusText(): string {
  if (this.isParsingFile()) return 'Processing Excel file...';
  if (this.isUploading()) return 'Uploading to storage...';
  return 'Choose File';
}

 

  private validateParsedData(data: ParsedFinancialData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Check if we have the expected income statement rows
    const foundIncomeLabels = data.incomeStatement.map(row => row.label);
    const missingIncome = EXPECTED_INCOME_STATEMENT_ROWS.filter(expected => 
      !foundIncomeLabels.includes(expected)
    );
    
    if (missingIncome.length > 0) {
      errors.push(`Missing income statement rows: ${missingIncome.join(', ')}`);
    }
    
    // Check if we have the expected ratio rows
    const foundRatioLabels = data.financialRatios.map(row => row.label);
    const missingRatios = EXPECTED_RATIO_ROWS.filter(expected => 
      !foundRatioLabels.includes(expected)
    );
    
    if (missingRatios.length > 0) {
      errors.push(`Missing financial ratio rows: ${missingRatios.join(', ')}`);
    }
    
    // Check column count (should have 9 time periods)
    if (data.columnHeaders.length !== 9) {
      warnings.push(`Expected 9 time periods, found ${data.columnHeaders.length}`);
    }
    
    // Check for empty data
    const hasData = data.incomeStatement.some(row => row.values.some(val => val !== 0)) ||
                    data.financialRatios.some(row => row.values.some(val => val !== 0));
    
    if (!hasData) {
      warnings.push('No financial data found in the template');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private applyParsedData(data: ParsedFinancialData) {
    this.incomeStatementData.set(data.incomeStatement);
    this.financialRatiosData.set(data.financialRatios);
    this.columnHeaders.set(data.columnHeaders);
    
    // Recalculate derived fields
    this.recalculateFields();
  }

  // ===============================
  // FILE MANAGEMENT
  // ===============================

  removeTemplate() {
    this.uploadedTemplate.set(null);
    this.parseError.set(null);
    this.parseWarnings.set([]);
    
    const existing = this.existingData();
    if (existing?.uploadedFile) {
      // Remove file from storage
      this.documentService.deleteDocumentByKey('financial-template').subscribe({
        next: () => console.log('✅ Financial template file deleted'),
        error: (error) => console.warn('⚠️ Failed to delete file from storage:', error)
      });
    }
    
    this.initializeEmptyData();
    this.triggerDataChange();
  }

 // Fixed downloadTemplate and createTemplateData methods

downloadTemplate() {
  // Create and download the Excel template
  const templateData = this.createTemplateData();
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(templateData);
  
  XLSX.utils.book_append_sheet(wb, ws, 'Financial Analysis');
  XLSX.writeFile(wb, 'financial_analysis_template.xlsx');
}

private createTemplateData(): (string | number)[][] {
  const headers: (string | number)[] = ['Item', 'Y-3', 'Y-2', 'Y-1', 'Current', 'P+1', 'P+2', 'P+3', 'P+4', 'P+5'];
  const data: (string | number)[][] = [headers];
  
  // Add income statement section
  data.push(['INCOME STATEMENT', '', '', '', '', '', '', '', '', '']);
  EXPECTED_INCOME_STATEMENT_ROWS.forEach(label => {
    data.push([label, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });
  
  // Add spacing
  data.push(['', '', '', '', '', '', '', '', '', '']);
  
  // Add financial ratios section
  data.push(['FINANCIAL RATIOS', '', '', '', '', '', '', '', '', '']);
  EXPECTED_RATIO_ROWS.forEach(label => {
    data.push([label, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });
  
  return data;
}

  downloadCurrentData() {
    if (!this.hasFinancialData()) {
      console.warn('No financial data to download');
      return;
    }
    
    // Create Excel file with current data
    const exportData = this.createExportData();
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Financial Analysis');
    
    const fileName = `financial_analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

private createExportData(): (string | number)[][] {
  const headers: (string | number)[] = ['Item', ...this.columnHeaders()];
  const data: (string | number)[][] = [headers];
  
  // Add income statement
  data.push(['INCOME STATEMENT', '', '', '', '', '', '', '', '', '']);
  this.incomeStatementData().forEach(row => {
    data.push([row.label, ...row.values]);
  });
  
  // Add spacing
  data.push(['', '', '', '', '', '', '', '', '', '']);
  
  // Add financial ratios
  data.push(['FINANCIAL RATIOS', '', '', '', '', '', '', '', '', '']);
  this.financialRatiosData().forEach(row => {
    data.push([row.label, ...row.values]);
  });
  
  return data;
}

  // ===============================
  // DATA EDITING & CALCULATIONS
  // ===============================

  // Add to your component
onCellBlur(event: Event, rowIndex: number, colIndex: number, isRatio: boolean = false) {
  const input = event.target as HTMLInputElement;
  if (input && input.value !== '') {
    const numValue = parseFloat(input.value) || 0;
    this.updateCellValue(rowIndex, colIndex, numValue, isRatio);
  }
}
  toggleEditMode() {
    this.editingMode.set(!this.editingMode());
  }

  updateCellValue(rowIndex: number, colIndex: number, newValue: number, isRatio: boolean = false) {
    if (isRatio) {
      this.financialRatiosData.update(data => {
        const newData = [...data];
        newData[rowIndex] = {
          ...newData[rowIndex],
          values: [...newData[rowIndex].values]
        };
        newData[rowIndex].values[colIndex] = newValue;
        return newData;
      });
    } else {
      this.incomeStatementData.update(data => {
        const newData = [...data];
        newData[rowIndex] = {
          ...newData[rowIndex],
          values: [...newData[rowIndex].values]
        };
        newData[rowIndex].values[colIndex] = newValue;
        
        // Recalculate dependent fields
        this.recalculateFields();
        return newData;
      });
    }
    
    this.triggerDataChange();
  }

  private recalculateFields() {
    const incomeData = this.incomeStatementData();
    
    // Find relevant rows
    const revenueRow = incomeData.find(row => row.label === 'Revenue');
    const costRow = incomeData.find(row => row.label === 'Cost of sales');
    const grossProfitRow = incomeData.find(row => row.label === 'Gross Profit');
    const adminRow = incomeData.find(row => row.label === 'Administrative expenses');
    const opExpRow = incomeData.find(row => row.label === 'Other Operating Expenses (Excl depreciation & amortisation)');
    const salariesRow = incomeData.find(row => row.label === 'Salaries & Staff Cost');
    const ebitdaRow = incomeData.find(row => row.label === 'EBITDA');
    const interestIncomeRow = incomeData.find(row => row.label === 'Interest Income');
    const financesCostRow = incomeData.find(row => row.label === 'Finances Cost');
    const depreciationRow = incomeData.find(row => row.label === 'Depreciation & Amortisation');
    const profitBeforeTaxRow = incomeData.find(row => row.label === 'Profit before tax');
    
    // Recalculate Gross Profit = Revenue - Cost of sales
    if (revenueRow && costRow && grossProfitRow) {
      grossProfitRow.values = revenueRow.values.map((revenue, i) => revenue + costRow.values[i]); // Cost is typically negative
    }

    // Recalculate EBITDA = Gross Profit - Administrative expenses - Other Operating Expenses - Salaries & Staff Cost
    if (grossProfitRow && adminRow && opExpRow && salariesRow && ebitdaRow) {
      ebitdaRow.values = grossProfitRow.values.map((grossProfit, i) => 
        grossProfit + adminRow.values[i] + opExpRow.values[i] + salariesRow.values[i]
      );
    }

    // Recalculate Profit before tax = EBITDA + Interest Income - Finances Cost - Depreciation & Amortisation
    if (ebitdaRow && interestIncomeRow && financesCostRow && depreciationRow && profitBeforeTaxRow) {
      profitBeforeTaxRow.values = ebitdaRow.values.map((ebitda, i) => 
        ebitda + (interestIncomeRow.values[i] || 0) + (financesCostRow.values[i] || 0) + (depreciationRow.values[i] || 0)
      );
    }

    // Update the signal with recalculated data
    this.incomeStatementData.set([...incomeData]);
  }

  // ===============================
  // AUTO-SAVE FUNCTIONALITY
  // ===============================

  private setupAutoSave() {
    // Auto-save every 30 seconds when data changes
    this.autoSaveSubscription = interval(30000).pipe(
      takeWhile(() => true),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.hasFinancialData() && !this.isSaving()) {
        this.saveData(false);
      }
    });

    // Debounced save on data changes (2 seconds)
    this.dataChangeSubject.pipe(
      debounceTime(2000),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.hasFinancialData() && !this.isSaving()) {
        this.saveData(false);
      }
    });
  }

  private triggerDataChange() {
    this.dataChangeSubject.next();
  }

  async saveManually() {
    await this.saveData(true);
  }

  private async saveData(isManual: boolean = false) {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    
    try {
      const financialData = this.buildFinancialProfileData();
      this.profileService.updateFinancialAnalysis(financialData);
      
      if (isManual) {
        await this.profileService.saveCurrentProgress();
      }
      
      this.lastSaved.set(new Date());
      console.log(`✅ Financial data ${isManual ? 'manually' : 'auto'} saved successfully`);
      
    } catch (error) {
      console.error('❌ Failed to save financial analysis:', error);
      if (isManual) {
        this.parseError.set('Failed to save data. Please try again.');
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  private buildFinancialProfileData(): ParsedFinancialData {
    const uploadedFile = this.existingData()?.uploadedFile || (this.uploadedTemplate() ? {
      documentKey: 'financial-template',
      fileName: this.uploadedTemplate()?.name || 'financial_template.xlsx',
      publicUrl: ''
    } : undefined);

    return {
      incomeStatement: this.incomeStatementData(),
      financialRatios: this.financialRatiosData(),
      columnHeaders: this.columnHeaders(),
      lastUpdated: new Date().toISOString(),
      uploadedFile
    };
  }

  // ===============================
  // UTILITY & FORMATTING METHODS
  // ===============================

  hasFinancialData(): boolean {
    return this.incomeStatementData().some(row => row.values.some(val => val !== 0)) ||
           this.financialRatiosData().some(row => row.values.some(val => val !== 0)) ||
           !!this.uploadedTemplate();
  }

  formatCurrency(value: number): string {
    if (value === 0 || value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-ZA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatRatio(value: number, type?: string): string {
    if (value === 0 || value === null || value === undefined) return '-';
    
    if (type === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    
    if (type === 'currency') {
      return this.formatCurrency(value);
    }
    
    return value.toFixed(2);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getLastSavedText(): string {
    const saved = this.lastSaved();
    if (!saved) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    return saved.toLocaleDateString();
  }

  // Check if file is currently being processed
  isProcessingFile(): boolean {
    return this.isParsingFile() || this.isUploading();
  }

 

  // Clear all errors and warnings
  clearErrors() {
    this.parseError.set(null);
    this.parseWarnings.set([]);
  }

  // Check if template structure is valid
  hasValidTemplate(): boolean {
    const incomeData = this.incomeStatementData();
    const ratioData = this.financialRatiosData();
    
    return incomeData.length > 0 && 
           ratioData.length > 0 && 
           incomeData.some(row => EXPECTED_INCOME_STATEMENT_ROWS.includes(row.label)) &&
           ratioData.some(row => EXPECTED_RATIO_ROWS.includes(row.label));
  }

  // Get completion percentage for financial data
  getCompletionPercentage(): number {
    if (!this.hasFinancialData()) return 0;
    
    const totalCells = (this.incomeStatementData().length + this.financialRatiosData().length) * 9;
    const filledCells = [...this.incomeStatementData(), ...this.financialRatiosData()]
      .reduce((count, row) => count + row.values.filter(val => val !== 0).length, 0);
    
    return Math.round((filledCells / totalCells) * 100);
  }

  async saveNotes() {
    // Notes can be saved as part of the financial data
    this.triggerDataChange();
  }




  // Replace your parseExcelFile and extractDataFromJsonArray methods with these optimized versions

private async parseExcelFile(file: File, uploadResult: any): Promise<ParsedFinancialData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        
        // Use minimal parsing options for speed
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellStyles: false,
         
          sheetStubs: false,
          bookVBA: false
        });
        
        if (workbook.SheetNames.length === 0) {
          reject(new Error('Excel file contains no worksheets'));
          return;
        }
        
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Get the actual range to avoid processing empty cells
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');
        
        // Process data directly from worksheet cells for better performance
        const parsedData = this.extractDataDirectlyFromSheet(worksheet, range, uploadResult);
        resolve(parsedData);
        
      } catch (error) {
        reject(new Error(`Excel parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

 

// Add timeout protection to processFile method
private async processFile(file: File) {
  const allowedTypes = ['.xlsx', '.xls'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  if (!allowedTypes.includes(fileExtension)) {
    this.parseError.set('Please upload only Excel files (.xlsx, .xls)');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    this.parseError.set('File size must be less than 10MB');
    return;
  }

  this.isParsingFile.set(true);
  this.parseError.set(null);
  this.parseWarnings.set([]);
  
  // Add timeout protection
  const timeoutMs = 30000; // 30 second timeout
  let timeoutId: any;
  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('File processing timed out. Please try a smaller file or contact support.'));
    }, timeoutMs);
  });
  
  try {
    // Step 1: Upload
    const uploadResult = await Promise.race([
      this.uploadFileToStorage(file),
      timeoutPromise
    ]);
    
    clearTimeout(timeoutId);
    
    // Step 2: Parse with timeout
    const parseTimeoutId = setTimeout(() => {
      throw new Error('Excel parsing timed out. File may be too complex.');
    }, 15000);
    
    const parsedData = await this.parseExcelFile(file, uploadResult);
    clearTimeout(parseTimeoutId);
    
    // Step 3: Validate
    const validation = this.validateParsedData(parsedData);
    
    if (!validation.isValid) {
      this.parseError.set(`Template validation failed: ${validation.errors.join(', ')}`);
      return;
    }
    
    if (validation.warnings.length > 0) {
      this.parseWarnings.set(validation.warnings);
    }
    
    // Step 4: Apply data
    this.applyParsedData(parsedData);
    this.uploadedTemplate.set(file);
    this.triggerDataChange();
    
    console.log('✅ Financial data processed successfully');
    
  } catch (error) {
    console.error('❌ Error processing financial file:', error);
    this.parseError.set(error instanceof Error ? error.message : 'Failed to process file');
  } finally {
    clearTimeout(timeoutId);
    this.isParsingFile.set(false);
  }
}

// Fix for extractDataDirectlyFromSheet method
private extractDataDirectlyFromSheet(worksheet: XLSX.WorkSheet, range: XLSX.Range, uploadResult: any): ParsedFinancialData {
  // Extract headers from first row - START FROM COLUMN 0, not 1
  const headers: string[] = [];
  
  // Check if we have any data at all
  if (range.e.r < 0 || range.e.c < 0) {
    throw new Error('Excel file appears to be empty');
  }
  
  // Start from column 0 and include the first column in headers if it contains data
  for (let col = 0; col <= Math.min(range.e.c, 20); col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    const cell = worksheet[cellAddress];
    if (cell?.v) {
      const headerValue = cell.v.toString().trim();
      if (headerValue) {
        headers.push(headerValue);
      }
    }
  }
  
  // If still no headers found, check if data starts from row 1 instead of row 0
  if (headers.length === 0) {
    for (let col = 0; col <= Math.min(range.e.c, 20); col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col });
      const cell = worksheet[cellAddress];
      if (cell?.v) {
        const headerValue = cell.v.toString().trim();
        if (headerValue) {
          headers.push(headerValue);
        }
      }
    }
  }
  
  if (headers.length === 0) {
    throw new Error('No column headers found. Please ensure your Excel file has headers in the first row.');
  }
  
  console.log('Found headers:', headers);
  
  const incomeStatement: FinancialRowData[] = [];
  const financialRatios: FinancialRatioData[] = [];
  
  // Determine data start row based on where we found headers
  const dataStartRow = headers.length > 0 ? 1 : 2;
  const maxRows = Math.min(range.e.r, 100);
  
  for (let row = dataStartRow; row <= maxRows; row++) {
    // Get label from first column (column 0)
    const labelCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
    if (!labelCell?.v) continue;
    
    const label = labelCell.v.toString().trim();
    if (!label) continue;
    
    // Skip section headers
    if (label.toUpperCase().includes('INCOME STATEMENT') || 
        label.toUpperCase().includes('FINANCIAL RATIOS') ||
        label === '') continue;
    
    // Extract values - start from column 1 since column 0 is the label
    const values: number[] = [];
    const valueStartCol = 1;
    const maxValueCols = Math.min(headers.length - 1, 10); // Don't exceed reasonable column count
    
    for (let col = valueStartCol; col <= valueStartCol + maxValueCols - 1 && col <= range.e.c; col++) {
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
    }
    
    // Ensure values array matches expected length (9 columns for years)
    while (values.length < 9) values.push(0);
    if (values.length > 9) values.splice(9);
    
    // Categorize by exact or partial label matching
    const isIncomeStatementRow = EXPECTED_INCOME_STATEMENT_ROWS.some(expected => 
      expected.toLowerCase().includes(label.toLowerCase()) || 
      label.toLowerCase().includes(expected.toLowerCase())
    );
    
    const isRatioRow = EXPECTED_RATIO_ROWS.some(expected => 
      expected.toLowerCase().includes(label.toLowerCase()) || 
      label.toLowerCase().includes(expected.toLowerCase())
    );
    
    if (isIncomeStatementRow) {
      // Find the best matching expected label
      const matchedLabel = EXPECTED_INCOME_STATEMENT_ROWS.find(expected => 
        expected.toLowerCase().includes(label.toLowerCase()) || 
        label.toLowerCase().includes(expected.toLowerCase())
      ) || label;
      
      incomeStatement.push({
        label: matchedLabel,
        values,
        editable: !this.isCalculatedField(matchedLabel)
      });
    } else if (isRatioRow) {
      // Find the best matching expected label
      const matchedLabel = EXPECTED_RATIO_ROWS.find(expected => 
        expected.toLowerCase().includes(label.toLowerCase()) || 
        label.toLowerCase().includes(expected.toLowerCase())
      ) || label;
      
      financialRatios.push({
        label: matchedLabel,
        values,
        type: this.getRatioType(matchedLabel),
        editable: !this.isCalculatedRatio(matchedLabel)
      });
    }
    
    // Early exit if we have all expected rows
    if (incomeStatement.length >= EXPECTED_INCOME_STATEMENT_ROWS.length && 
        financialRatios.length >= EXPECTED_RATIO_ROWS.length) {
      break;
    }
  }
  
  // Filter headers to only include numeric columns (remove the label column)
  const numericHeaders = headers.slice(1, 10); // Take up to 9 year columns
  
  return {
    incomeStatement,
    financialRatios,
    columnHeaders: numericHeaders.length > 0 ? numericHeaders : [
      'Y-3', 'Y-2', 'Y-1', 'Current', 'P+1', 'P+2', 'P+3', 'P+4', 'P+5'
    ],
    lastUpdated: new Date().toISOString(),
    uploadedFile: {
      documentKey: uploadResult.documentKey,
      fileName: uploadResult.fileName,
      publicUrl: uploadResult.publicUrl
    }
  };
}
}