// // src/app/profile/steps/financial-analysis/financial-analysis.component.ts
// import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { UiCardComponent, UiButtonComponent } from '../../../../shared/components';
// import { LucideAngularModule, Upload, Download, FileSpreadsheet, Save, Clock, Edit2, AlertCircle, CheckCircle, X } from 'lucide-angular';
// import { interval, Subscription, Subject } from 'rxjs';
// import { debounceTime, takeWhile, takeUntil } from 'rxjs/operators';
// import { SupabaseDocumentService } from '../../../../shared/services/supabase-document.service';
// import { SMEProfileStepsService } from '../../../services/sme-profile-steps.service';

// interface FinancialRowData {
//   label: string;
//   values: number[];
//   editable?: boolean;
// }

// interface FinancialRatioData extends FinancialRowData {
//   type: 'ratio' | 'percentage' | 'currency';
// }

// interface ParsedFinancialData {
//   incomeStatement: FinancialRowData[];
//   financialRatios: FinancialRatioData[];
//   columnHeaders: string[];
//   lastUpdated: string;
//   uploadedFile?: {
//     documentKey: string;
//     fileName: string;
//     publicUrl: string;
//   };
// }

// interface ValidationResult {
//   isValid: boolean;
//   errors: string[];
//   warnings: string[];
// }

// // Constants
// const EXPECTED_COLUMN_COUNT = 9;

// const EXPECTED_INCOME_STATEMENT_ROWS = [
//   'Revenue',
//   'Cost of sales', 
//   'Gross Profit',
//   'Administrative expenses',
//   'Other Operating Expenses (Excl depreciation & amortisation)',
//   'Salaries & Staff Cost',
//   'EBITDA',
//   'Interest Income',
//   'Finances Cost',
//   'Depreciation & Amortisation',
//   'Profit before tax'
// ];

// const EXPECTED_RATIO_ROWS = [
//   'Return on Equity (ROE)',
//   'Debt Equity Ratio (Total liabilities)',
//   'Current Ratio',
//   'Acid Test Ratio (Quick Ratio)',
//   'Equity Investment Value',
//   'Return on Investment (ROI)',
//   'Sales Growth',
//   'Gross profit margin',
//   'Cost to Income ratio',
//   'Operating margin (EBITDA)',
//   'Interest Cover Ratio',
//   'Net Operating Profit Margin'
// ];

// @Component({
//   selector: 'app-financial-analysis',
//   standalone: true,
//   imports: [FormsModule, UiCardComponent, UiButtonComponent, LucideAngularModule],
//   templateUrl: 'financial-analysis.component.html'
// })
// export class FinancialAnalysisComponent implements OnInit, OnDestroy {
//   private profileService = inject(SMEProfileStepsService);
//   private documentService = inject(SupabaseDocumentService);

//   // State signals
//   isSaving = signal(false);
//   isUploading = signal(false);
//   lastSaved = signal<Date | null>(null);
//   uploadedTemplate = signal<File | null>(null);
//   editingMode = signal(false);
//   notesText = '';
  
//   // Parsing state
//   isParsingFile = signal(false);
//   parseError = signal<string | null>(null);
//   parseWarnings = signal<string[]>([]);

//   // Data signals
//   incomeStatementData = signal<FinancialRowData[]>([]);
//   financialRatiosData = signal<FinancialRatioData[]>([]);
//   columnHeaders = signal<string[]>([]);
  
//   // Existing financial data from profile
//   existingData = signal<ParsedFinancialData | null>(null);

//   // Icons
//   UploadIcon = Upload;
//   DownloadIcon = Download;
//   FileSpreadsheetIcon = FileSpreadsheet;
//   SaveIcon = Save;
//   ClockIcon = Clock;
//   EditIcon = Edit2;
//   AlertCircleIcon = AlertCircle;
//   CheckCircleIcon = CheckCircle;
//   XIcon = X;

//   // Auto-save management
//   private autoSaveSubscription?: Subscription;
//   private destroy$ = new Subject<void>();
//   private dataChangeSubject = new Subject<void>();

//   ngOnInit() {
//     this.loadExistingData();
//     this.setupAutoSave();
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//     this.autoSaveSubscription?.unsubscribe();
//   }

//   // ===============================
//   // DATA LOADING & INITIALIZATION
//   // ===============================

//   private loadExistingData() {
//     const profileData = this.profileService.data();
//     const financialAnalysis = profileData.financialAnalysis;
    
//     if (financialAnalysis && this.isValidFinancialData(financialAnalysis)) {
//       this.existingData.set(financialAnalysis as ParsedFinancialData);
//       this.loadFromExistingData(financialAnalysis as ParsedFinancialData);
//       console.log('✅ Loaded existing financial data');
//     } else {
//       this.initializeEmptyData();
//       console.log('ℹ️ No existing financial data, initialized empty structure');
//     }
//   }

//   private isValidFinancialData(data: any): boolean {
//     return data && 
//            data.incomeStatement && 
//            Array.isArray(data.incomeStatement) && 
//            data.financialRatios && 
//            Array.isArray(data.financialRatios);
//   }

//   private loadFromExistingData(data: ParsedFinancialData) {
//     this.incomeStatementData.set(data.incomeStatement || []);
//     this.financialRatiosData.set(data.financialRatios || []);
//     this.columnHeaders.set(data.columnHeaders || []);
//     this.notesText = '';
    
//     if (data.uploadedFile) {
//       console.log('📄 Found reference to uploaded file:', data.uploadedFile.fileName);
//     }
//   }

//   private initializeEmptyData() {
//     const currentYear = new Date().getFullYear();
//     const headers = [
//       `${currentYear - 3}`, 
//       `${currentYear - 2}`, 
//       `${currentYear - 1}`, 
//       `${currentYear}`, 
//       `${currentYear + 1}`, 
//       `${currentYear + 2}`, 
//       `${currentYear + 3}`, 
//       `${currentYear + 4}`, 
//       `${currentYear + 5}`
//     ];
    
//     this.columnHeaders.set(headers);

//     this.incomeStatementData.set(
//       EXPECTED_INCOME_STATEMENT_ROWS.map(label => ({
//         label,
//         values: new Array(EXPECTED_COLUMN_COUNT).fill(0),
//         editable: !this.isCalculatedField(label)
//       }))
//     );

//     this.financialRatiosData.set(
//       EXPECTED_RATIO_ROWS.map(label => ({
//         label,
//         values: new Array(EXPECTED_COLUMN_COUNT).fill(0),
//         type: this.getRatioType(label),
//         editable: !this.isCalculatedRatio(label)
//       }))
//     );
//   }

//   private isCalculatedField(label: string): boolean {
//     return ['Gross Profit', 'EBITDA', 'Profit before tax'].includes(label);
//   }

//   private isCalculatedRatio(label: string): boolean {
//     return [
//       'Return on Equity (ROE)',
//       'Return on Investment (ROI)', 
//       'Sales Growth',
//       'Gross profit margin',
//       'Cost to Income ratio',
//       'Operating margin (EBITDA)',
//       'Interest Cover Ratio',
//       'Net Operating Profit Margin'
//     ].includes(label);
//   }

//   private getRatioType(label: string): 'ratio' | 'percentage' | 'currency' {
//     if (label.includes('Equity Investment Value')) return 'currency';
//     if (label.includes('margin') || label.includes('Growth') || label.includes('ROE') || label.includes('ROI')) return 'percentage';
//     return 'ratio';
//   }

//   // ===============================
//   // FILE UPLOAD & PARSING
//   // ===============================

//   onDragOver(event: DragEvent) {
//     event.preventDefault();
//     event.stopPropagation();
//     const target = event.currentTarget as HTMLElement;
//     target.classList.add('border-primary-500', 'bg-primary-100');
//   }

//   onDragLeave(event: DragEvent) {
//     event.preventDefault();
//     event.stopPropagation();
//     const target = event.currentTarget as HTMLElement;
//     target.classList.remove('border-primary-500', 'bg-primary-100');
//   }

//   onDrop(event: DragEvent) {
//     event.preventDefault();
//     event.stopPropagation();
    
//     const target = event.currentTarget as HTMLElement;
//     target.classList.remove('border-primary-500', 'bg-primary-100');
    
//     const files = event.dataTransfer?.files;
//     if (files && files.length > 0) {
//       this.processFile(files[0]);
//     }
//   }

//   onFileSelected(event: Event) {
//     const input = event.target as HTMLInputElement;
//     const file = input.files?.[0];
    
//     if (file) {
//       this.processFile(file);
//       input.value = '';
//     }
//   }

//   triggerFileUpload() {
//     const input = document.createElement('input');
//     input.type = 'file';
//     input.accept = '.xlsx,.xls';
//     input.onchange = (e) => this.onFileSelected(e);
//     input.click();
//   }

//   getProcessingStatusText(): string {
//     if (this.isParsingFile()) return 'Processing Excel file...';
//     if (this.isUploading()) return 'Uploading to storage...';
//     return 'Choose File';
//   }

//   private async processFile(file: File) {
//     const allowedTypes = ['.xlsx', '.xls'];
//     const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
//     if (!allowedTypes.includes(fileExtension)) {
//       this.parseError.set('Please upload only Excel files (.xlsx, .xls)');
//       return;
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       this.parseError.set('File size must be less than 10MB');
//       return;
//     }

//     this.isParsingFile.set(true);
//     this.parseError.set(null);
//     this.parseWarnings.set([]);
    
//     let parseTimeoutId: any;
    
//     try {
//       // STEP 1: Parse locally first (no upload yet)
//       parseTimeoutId = setTimeout(() => {
//         throw new Error('Excel parsing timed out. File may be too complex.');
//       }, 15000);
      
//       const parsedData = await this.parseExcelFile(file);
//       clearTimeout(parseTimeoutId);
      
//       // STEP 2: Validate parsed data
//       const validation = this.validateParsedData(parsedData);
      
//       if (!validation.isValid) {
//         this.parseError.set(`Template validation failed: ${validation.errors.join(', ')}`);
//         return;
//       }
      
//       if (validation.warnings.length > 0) {
//         this.parseWarnings.set(validation.warnings);
//       }
      
//       // Check data quality
//       const qualityWarning = this.checkDataQuality(parsedData);
//       if (qualityWarning) {
//         this.parseWarnings.update(warnings => [...warnings, qualityWarning]);
//       }
      
//       // STEP 3: Only upload if parsing succeeded
//       this.isParsingFile.set(false);
//       this.isUploading.set(true);
      
//       const uploadResult = await this.uploadFileToStorage(file);
      
//       // STEP 4: Attach upload metadata
//       parsedData.uploadedFile = {
//         documentKey: uploadResult.documentKey,
//         fileName: uploadResult.fileName,
//         publicUrl: uploadResult.publicUrl
//       };
      
//       // STEP 5: Apply data
//       this.applyParsedData(parsedData);
//       this.uploadedTemplate.set(file);
//       this.triggerDataChange();
      
//       console.log('✅ Financial data processed successfully');
      
//     } catch (error) {
//       console.error('❌ Error processing financial file:', error);
//       this.parseError.set(error instanceof Error ? error.message : 'Failed to process file');
//     } finally {
//       if (parseTimeoutId) clearTimeout(parseTimeoutId);
//       this.isParsingFile.set(false);
//       this.isUploading.set(false);
//     }
//   }

//   private async parseExcelFile(file: File): Promise<ParsedFinancialData> {
//     const XLSX = await import('xlsx');
    
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
      
//       reader.onload = (e) => {
//         try {
//           const data = new Uint8Array(e.target?.result as ArrayBuffer);
          
//           const workbook = XLSX.read(data, { 
//             type: 'array',
//             cellStyles: false,
//             sheetStubs: false,
//             bookVBA: false
//           });
          
//           if (workbook.SheetNames.length === 0) {
//             reject(new Error('Excel file contains no worksheets'));
//             return;
//           }
          
//           const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//           const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');
          
//           const parsedData = this.extractDataDirectlyFromSheet(worksheet, range, XLSX);
//           resolve(parsedData);
          
//         } catch (error) {
//           reject(new Error(`Excel parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
//         }
//       };
      
//       reader.onerror = () => reject(new Error('Failed to read file'));
//       reader.readAsArrayBuffer(file);
//     });
//   }

//   private extractDataDirectlyFromSheet(worksheet: any, range: any, XLSX: any): ParsedFinancialData {
//     const headers: string[] = [];
    
//     if (range.e.r < 0 || range.e.c < 0) {
//       throw new Error('Excel file appears to be empty');
//     }
    
//     // Extract headers from first row
//     for (let col = 0; col <= Math.min(range.e.c, 20); col++) {
//       const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
//       const cell = worksheet[cellAddress];
//       if (cell?.v) {
//         const headerValue = cell.v.toString().trim();
//         if (headerValue) {
//           headers.push(headerValue);
//         }
//       }
//     }
    
//     // Fallback: check row 1
//     if (headers.length === 0) {
//       for (let col = 0; col <= Math.min(range.e.c, 20); col++) {
//         const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col });
//         const cell = worksheet[cellAddress];
//         if (cell?.v) {
//           const headerValue = cell.v.toString().trim();
//           if (headerValue) {
//             headers.push(headerValue);
//           }
//         }
//       }
//     }
    
//     if (headers.length === 0) {
//       throw new Error('No column headers found. Please ensure your Excel file has headers in the first row.');
//     }
    
//     const incomeStatement: FinancialRowData[] = [];
//     const financialRatios: FinancialRatioData[] = [];
    
//     const dataStartRow = 1;
//     const maxRows = Math.min(range.e.r, 100);
    
//     for (let row = dataStartRow; row <= maxRows; row++) {
//       const labelCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 0 })];
//       if (!labelCell?.v) continue;
      
//       const label = labelCell.v.toString().trim();
//       if (!label) continue;
      
//       // Skip section headers
//       if (label.toUpperCase().includes('INCOME STATEMENT') || 
//           label.toUpperCase().includes('FINANCIAL RATIOS') ||
//           label === '') continue;
      
//       // Extract values
//       const values: number[] = [];
//       const valueStartCol = 1;
//       const maxValueCols = Math.min(headers.length - 1, 10);
      
//       for (let col = valueStartCol; col <= valueStartCol + maxValueCols - 1 && col <= range.e.c; col++) {
//         const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
//         const cell = worksheet[cellAddress];
        
//         let numValue = 0;
//         if (cell?.v !== undefined) {
//           if (typeof cell.v === 'number') {
//             numValue = cell.v;
//           } else {
//             const parsed = parseFloat(cell.v.toString().replace(/[,\s]/g, ''));
//             numValue = isNaN(parsed) ? 0 : parsed;
//           }
//         }
//         values.push(numValue);
//       }
      
//       // Normalize to expected column count
//       while (values.length < EXPECTED_COLUMN_COUNT) values.push(0);
//       if (values.length > EXPECTED_COLUMN_COUNT) values.splice(EXPECTED_COLUMN_COUNT);
      
//       // Categorize rows
//       const isIncomeStatementRow = EXPECTED_INCOME_STATEMENT_ROWS.some(expected => 
//         expected.toLowerCase().includes(label.toLowerCase()) || 
//         label.toLowerCase().includes(expected.toLowerCase())
//       );
      
//       const isRatioRow = EXPECTED_RATIO_ROWS.some(expected => 
//         expected.toLowerCase().includes(label.toLowerCase()) || 
//         label.toLowerCase().includes(expected.toLowerCase())
//       );
      
//       if (isIncomeStatementRow) {
//         const matchedLabel = EXPECTED_INCOME_STATEMENT_ROWS.find(expected => 
//           expected.toLowerCase().includes(label.toLowerCase()) || 
//           label.toLowerCase().includes(expected.toLowerCase())
//         ) || label;
        
//         incomeStatement.push({
//           label: matchedLabel,
//           values,
//           editable: !this.isCalculatedField(matchedLabel)
//         });
//       } else if (isRatioRow) {
//         const matchedLabel = EXPECTED_RATIO_ROWS.find(expected => 
//           expected.toLowerCase().includes(label.toLowerCase()) || 
//           label.toLowerCase().includes(expected.toLowerCase())
//         ) || label;
        
//         financialRatios.push({
//           label: matchedLabel,
//           values,
//           type: this.getRatioType(matchedLabel),
//           editable: !this.isCalculatedRatio(matchedLabel)
//         });
//       }
      
//       // Early exit optimization
//       if (incomeStatement.length >= EXPECTED_INCOME_STATEMENT_ROWS.length && 
//           financialRatios.length >= EXPECTED_RATIO_ROWS.length) {
//         break;
//       }
//     }
    
//     const numericHeaders = headers.slice(1, 10);
    
//     return {
//       incomeStatement,
//       financialRatios,
//       columnHeaders: numericHeaders.length > 0 ? numericHeaders : [
//         'Y-3', 'Y-2', 'Y-1', 'Current', 'P+1', 'P+2', 'P+3', 'P+4', 'P+5'
//       ],
//       lastUpdated: new Date().toISOString()
//     };
//   }

//   private async uploadFileToStorage(file: File): Promise<any> {
//     return new Promise((resolve, reject) => {
//       this.documentService.uploadDocument(
//         file, 
//         'financial-template', 
//         undefined, 
//         'financial'
//       ).subscribe({
//         next: (result) => resolve(result),
//         error: (error) => reject(new Error(`File upload failed: ${error.message}`))
//       });
//     });
//   }

//   private validateParsedData(data: ParsedFinancialData): ValidationResult {
//     const errors: string[] = [];
//     const warnings: string[] = [];
    
//     const foundIncomeLabels = data.incomeStatement.map(row => row.label);
//     const missingIncome = EXPECTED_INCOME_STATEMENT_ROWS.filter(expected => 
//       !foundIncomeLabels.includes(expected)
//     );
    
//     if (missingIncome.length > 0) {
//       errors.push(`Missing income statement rows: ${missingIncome.join(', ')}`);
//     }
    
//     const foundRatioLabels = data.financialRatios.map(row => row.label);
//     const missingRatios = EXPECTED_RATIO_ROWS.filter(expected => 
//       !foundRatioLabels.includes(expected)
//     );
    
//     if (missingRatios.length > 0) {
//       errors.push(`Missing financial ratio rows: ${missingRatios.join(', ')}`);
//     }
    
//     if (data.columnHeaders.length !== EXPECTED_COLUMN_COUNT) {
//       warnings.push(`Expected ${EXPECTED_COLUMN_COUNT} time periods, found ${data.columnHeaders.length}`);
//     }
    
//     const hasData = data.incomeStatement.some(row => row.values.some(val => val !== 0)) ||
//                     data.financialRatios.some(row => row.values.some(val => val !== 0));
    
//     if (!hasData) {
//       warnings.push('No financial data found in the template');
//     }
    
//     return {
//       isValid: errors.length === 0,
//       errors,
//       warnings
//     };
//   }

//   private checkDataQuality(data: ParsedFinancialData): string | null {
//     const totalCells = (data.incomeStatement.length + data.financialRatios.length) * EXPECTED_COLUMN_COUNT;
//     const filledCells = [...data.incomeStatement, ...data.financialRatios]
//       .reduce((count, row) => count + row.values.filter(val => val !== 0).length, 0);
    
//     const fillPercentage = (filledCells / totalCells) * 100;
    
//     if (fillPercentage < 50) {
//       return `Only ${Math.round(fillPercentage)}% of cells contain data. Consider filling in more financial information.`;
//     }
    
//     return null;
//   }

//   private applyParsedData(data: ParsedFinancialData) {
//     this.incomeStatementData.set(data.incomeStatement);
//     this.financialRatiosData.set(data.financialRatios);
//     this.columnHeaders.set(data.columnHeaders);
//     this.recalculateFields();
//   }

//   // ===============================
//   // FILE MANAGEMENT
//   // ===============================

//   removeTemplate() {
//     this.uploadedTemplate.set(null);
//     this.parseError.set(null);
//     this.parseWarnings.set([]);
    
//     const existing = this.existingData();
//     if (existing?.uploadedFile) {
//       this.documentService.deleteDocumentByKey('financial-template').subscribe({
//         next: () => console.log('✅ Financial template file deleted'),
//         error: (error) => console.warn('⚠️ Failed to delete file from storage:', error)
//       });
//     }
    
//     this.initializeEmptyData();
//     this.triggerDataChange();
//   }

//   downloadTemplate() {
//     import('xlsx')
//       .then(XLSX => {
//         const templateData = this.createTemplateData();
//         const wb = XLSX.utils.book_new();
//         const ws = XLSX.utils.aoa_to_sheet(templateData);
        
//         XLSX.utils.book_append_sheet(wb, ws, 'Financial Analysis');
//         XLSX.writeFile(wb, 'financial_analysis_template.xlsx');
//       })
//       .catch(error => {
//         console.error('Download failed:', error);
//         this.parseError.set('Failed to download template. Please try again.');
//       });
//   }

//   private createTemplateData(): (string | number)[][] {
//     const headers: (string | number)[] = ['Item', 'Y-3', 'Y-2', 'Y-1', 'Current', 'P+1', 'P+2', 'P+3', 'P+4', 'P+5'];
//     const data: (string | number)[][] = [headers];
//     const emptyRow = new Array(EXPECTED_COLUMN_COUNT + 1).fill(0);
    
//     data.push(['INCOME STATEMENT', ...Array(EXPECTED_COLUMN_COUNT).fill('')]);
//     EXPECTED_INCOME_STATEMENT_ROWS.forEach(label => {
//       data.push([label, ...Array(EXPECTED_COLUMN_COUNT).fill(0)]);
//     });
    
//     data.push(Array(EXPECTED_COLUMN_COUNT + 1).fill(''));
    
//     data.push(['FINANCIAL RATIOS', ...Array(EXPECTED_COLUMN_COUNT).fill('')]);
//     EXPECTED_RATIO_ROWS.forEach(label => {
//       data.push([label, ...Array(EXPECTED_COLUMN_COUNT).fill(0)]);
//     });
    
//     return data;
//   }

//   async downloadCurrentData() {
//     if (!this.hasFinancialData()) {
//       console.warn('No financial data to download');
//       return;
//     }
    
//     try {
//       const XLSX = await import('xlsx');
//       const exportData = this.createExportData();
//       const wb = XLSX.utils.book_new();
//       const ws = XLSX.utils.aoa_to_sheet(exportData);
      
//       XLSX.utils.book_append_sheet(wb, ws, 'Financial Analysis');
      
//       const fileName = `financial_analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
//       XLSX.writeFile(wb, fileName);
//     } catch (error) {
//       console.error('Download failed:', error);
//       this.parseError.set('Failed to download data. Please try again.');
//     }
//   }

//   private createExportData(): (string | number)[][] {
//     const headers: (string | number)[] = ['Item', ...this.columnHeaders()];
//     const data: (string | number)[][] = [headers];
    
//     data.push(['INCOME STATEMENT', ...Array(EXPECTED_COLUMN_COUNT).fill('')]);
//     this.incomeStatementData().forEach(row => {
//       data.push([row.label, ...row.values]);
//     });
    
//     data.push(Array(EXPECTED_COLUMN_COUNT + 1).fill(''));
    
//     data.push(['FINANCIAL RATIOS', ...Array(EXPECTED_COLUMN_COUNT).fill('')]);
//     this.financialRatiosData().forEach(row => {
//       data.push([row.label, ...row.values]);
//     });
    
//     return data;
//   }

//   // ===============================
//   // DATA EDITING & CALCULATIONS
//   // ===============================

//   onCellBlur(event: Event, rowIndex: number, colIndex: number, isRatio: boolean = false) {
//     const input = event.target as HTMLInputElement;
//     if (input && input.value !== '') {
//       const numValue = parseFloat(input.value) || 0;
//       this.updateCellValue(rowIndex, colIndex, numValue, isRatio);
//     }
//   }

//   toggleEditMode() {
//     this.editingMode.set(!this.editingMode());
//   }

//   updateCellValue(rowIndex: number, colIndex: number, newValue: number, isRatio: boolean = false) {
//     if (isRatio) {
//       this.financialRatiosData.update(data => {
//         const newData = [...data];
//         newData[rowIndex] = {
//           ...newData[rowIndex],
//           values: [...newData[rowIndex].values]
//         };
//         newData[rowIndex].values[colIndex] = newValue;
//         return newData;
//       });
//     } else {
//       this.incomeStatementData.update(data => {
//         const newData = [...data];
//         newData[rowIndex] = {
//           ...newData[rowIndex],
//           values: [...newData[rowIndex].values]
//         };
//         newData[rowIndex].values[colIndex] = newValue;
//         return newData;
//       });
//       this.recalculateFields();
//     }
    
//     this.triggerDataChange();
//   }

//   private recalculateFields() {
//     const incomeData = [...this.incomeStatementData()];
    
//     const revenueRow = incomeData.find(row => row.label === 'Revenue');
//     const costRow = incomeData.find(row => row.label === 'Cost of sales');
//     const grossProfitRow = incomeData.find(row => row.label === 'Gross Profit');
//     const adminRow = incomeData.find(row => row.label === 'Administrative expenses');
//     const opExpRow = incomeData.find(row => row.label === 'Other Operating Expenses (Excl depreciation & amortisation)');
//     const salariesRow = incomeData.find(row => row.label === 'Salaries & Staff Cost');
//     const ebitdaRow = incomeData.find(row => row.label === 'EBITDA');
//     const interestIncomeRow = incomeData.find(row => row.label === 'Interest Income');
//     const financesCostRow = incomeData.find(row => row.label === 'Finances Cost');
//     const depreciationRow = incomeData.find(row => row.label === 'Depreciation & Amortisation');
//     const profitBeforeTaxRow = incomeData.find(row => row.label === 'Profit before tax');
    
//     if (revenueRow && costRow && grossProfitRow) {
//       grossProfitRow.values = revenueRow.values.map((revenue, i) => revenue + costRow.values[i]);
//     }

//     if (grossProfitRow && adminRow && opExpRow && salariesRow && ebitdaRow) {
//       ebitdaRow.values = grossProfitRow.values.map((grossProfit, i) => 
//         grossProfit + adminRow.values[i] + opExpRow.values[i] + salariesRow.values[i]
//       );
//     }

//     if (ebitdaRow && interestIncomeRow && financesCostRow && depreciationRow && profitBeforeTaxRow) {
//       profitBeforeTaxRow.values = ebitdaRow.values.map((ebitda, i) => 
//         ebitda + (interestIncomeRow.values[i] || 0) + (financesCostRow.values[i] || 0) + (depreciationRow.values[i] || 0)
//       );
//     }

//     this.incomeStatementData.set(incomeData);
//   }

//   // ===============================
//   // AUTO-SAVE FUNCTIONALITY
//   // ===============================

//   private setupAutoSave() {
//     this.autoSaveSubscription = interval(30000).pipe(
//       takeWhile(() => true),
//       takeUntil(this.destroy$)
//     ).subscribe(() => {
//       if (this.hasFinancialData() && !this.isSaving()) {
//         this.saveData(false);
//       }
//     });

//     this.dataChangeSubject.pipe(
//       debounceTime(2000),
//       takeUntil(this.destroy$)
//     ).subscribe(() => {
//       if (this.hasFinancialData() && !this.isSaving()) {
//         this.saveData(false);
//       }
//     });
//   }

//   private triggerDataChange() {
//     this.dataChangeSubject.next();
//   }

//   async saveManually() {
//     await this.saveData(true);
//   }

//   private async saveData(isManual: boolean = false) {
//     if (this.isSaving()) return;

//     this.isSaving.set(true);
    
//     try {
//       const financialData = this.buildFinancialProfileData();
//       this.profileService.updateFinancialAnalysis(financialData);
      
//       if (isManual) {
//         await this.profileService.saveCurrentProgress();
//       }
      
//       this.lastSaved.set(new Date());
//       console.log(`✅ Financial data ${isManual ? 'manually' : 'auto'} saved successfully`);
      
//     } catch (error) {
//       console.error('❌ Failed to save financial analysis:', error);
//       if (isManual) {
//         this.parseError.set('Failed to save data. Please try again.');
//       }
//     } finally {
//       this.isSaving.set(false);
//     }
//   }

//   private buildFinancialProfileData(): ParsedFinancialData {
//     const uploadedFile = this.existingData()?.uploadedFile || (this.uploadedTemplate() ? {
//       documentKey: 'financial-template',
//       fileName: this.uploadedTemplate()?.name || 'financial_template.xlsx',
//       publicUrl: ''
//     } : undefined);

//     return {
//       incomeStatement: this.incomeStatementData(),
//       financialRatios: this.financialRatiosData(),
//       columnHeaders: this.columnHeaders(),
//       lastUpdated: new Date().toISOString(),
//       uploadedFile
//     };
//   }

//   // ===============================
//   // UTILITY & FORMATTING METHODS
//   // ===============================

//   hasFinancialData(): boolean {
//     return this.incomeStatementData().some(row => row.values.some(val => val !== 0)) ||
//            this.financialRatiosData().some(row => row.values.some(val => val !== 0)) ||
//            !!this.uploadedTemplate();
//   }

//   formatCurrency(value: number): string {
//     if (value === 0 || value === null || value === undefined) return '-';
//     return new Intl.NumberFormat('en-ZA', {
//       style: 'decimal',
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     }).format(value);
//   }

//   formatRatio(value: number, type?: string): string {
//     if (value === 0 || value === null || value === undefined) return '-';
    
//     if (type === 'percentage') {
//       return `${value.toFixed(1)}%`;
//     }
    
//     if (type === 'currency') {
//       return this.formatCurrency(value);
//     }
    
//     return value.toFixed(2);
//   }

//   formatFileSize(bytes: number): string {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//   }

//   getLastSavedText(): string {
//     const saved = this.lastSaved();
//     if (!saved) return '';
    
//     const now = new Date();
//     const diffMs = now.getTime() - saved.getTime();
//     const diffMins = Math.floor(diffMs / 60000);
    
//     if (diffMins < 1) return 'just now';
//     if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
//     const diffHours = Math.floor(diffMins / 60);
//     if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
//     return saved.toLocaleDateString();
//   }

//   isProcessingFile(): boolean {
//     return this.isParsingFile() || this.isUploading();
//   }

//   clearErrors() {
//     this.parseError.set(null);
//     this.parseWarnings.set([]);
//   }

//   hasValidTemplate(): boolean {
//     const incomeData = this.incomeStatementData();
//     const ratioData = this.financialRatiosData();
    
//     return incomeData.length > 0 && 
//            ratioData.length > 0 && 
//            incomeData.some(row => EXPECTED_INCOME_STATEMENT_ROWS.includes(row.label)) &&
//            ratioData.some(row => EXPECTED_RATIO_ROWS.includes(row.label));
//   }

//   getCompletionPercentage(): number {
//     if (!this.hasFinancialData()) return 0;
    
//     const totalCells = (this.incomeStatementData().length + this.financialRatiosData().length) * EXPECTED_COLUMN_COUNT;
//     const filledCells = [...this.incomeStatementData(), ...this.financialRatiosData()]
//       .reduce((count, row) => count + row.values.filter(val => val !== 0).length, 0);
    
//     return Math.round((filledCells / totalCells) * 100);
//   }

//   async saveNotes() {
//     this.triggerDataChange();
//   }
// }


// src/app/profile/steps/financial-analysis/financial-analysis.component.ts
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiCardComponent, UiButtonComponent } from '../../../../shared/components';
import { LucideAngularModule, Upload, Download, FileSpreadsheet, Save, Clock, Edit2, AlertCircle, CheckCircle, X } from 'lucide-angular';
import { interval, Subscription, Subject } from 'rxjs';
import { debounceTime, takeWhile, takeUntil } from 'rxjs/operators';
import { SupabaseDocumentService } from '../../../../shared/services/supabase-document.service';
 import { ExcelFinancialParserService, ParseProgress, FinancialRowData, FinancialRatioData, ParsedFinancialData } from 'src/app/SMEs/profile/services/excel-parser.service';
import { SMEProfileStepsService } from '../../services/sme-profile-steps.service';
 
// Constants
const EXPECTED_COLUMN_COUNT = 9;

@Component({
  selector: 'app-financial-analysis',
  standalone: true,
  imports: [FormsModule, UiCardComponent, UiButtonComponent, LucideAngularModule],
  templateUrl: 'financial-analysis.component.html'
})
export class FinancialAnalysisComponent implements OnInit, OnDestroy {
  private profileService = inject(SMEProfileStepsService);
  private documentService = inject(SupabaseDocumentService);
  private excelParser = inject(ExcelFinancialParserService);

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
  parseProgress = signal<ParseProgress | null>(null);

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
    this.excelParser.setDebugMode(true); // Enable detailed logging
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
    this.notesText = '';
    
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
    this.incomeStatementData.set([]);
    this.financialRatiosData.set([]);
  }

  // ===============================
  // FILE UPLOAD & PARSING - SIMPLIFIED
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

  getProcessingStatusText(): string {
    const progress = this.parseProgress();
    if (progress) {
      return progress.message;
    }
    if (this.isParsingFile()) return 'Processing Excel file...';
    if (this.isUploading()) return 'Uploading to storage...';
    return 'Choose File';
  }

  private async processFile(file: File) {
    // Validate file type
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
    this.parseProgress.set(null);
    
    try {
      console.log('🔄 Starting file processing:', file.name);
      
      // STEP 1: Parse file using service (with progress tracking)
      const parsedData = await this.excelParser.parseFinancialExcel(file, (progress) => {
        this.parseProgress.set(progress);
        console.log(`📊 Parse progress: ${progress.progress}% - ${progress.message}`);
      });
      
      // STEP 2: Get validation results
      const validation = this.excelParser.validateParsedData(parsedData);
      
      if (!validation.isValid) {
        this.parseError.set(`Template validation failed: ${validation.errors.join(', ')}`);
        return;
      }
      
      if (validation.warnings.length > 0) {
        this.parseWarnings.set(validation.warnings);
      }
      
      // Check data quality
      const qualityWarning = this.checkDataQuality(parsedData);
      if (qualityWarning) {
        this.parseWarnings.update(warnings => [...warnings, qualityWarning]);
      }
      
      // STEP 3: Upload file to storage
      this.isParsingFile.set(false);
      this.isUploading.set(true);
      console.log('📤 Uploading file to storage...');
      
      const uploadResult = await this.uploadFileToStorage(file);
      
      // STEP 4: Attach upload metadata
      parsedData.uploadedFile = {
        documentKey: uploadResult.documentKey,
        fileName: uploadResult.fileName,
        publicUrl: uploadResult.publicUrl
      };
      
      // STEP 5: Apply data
      this.applyParsedData(parsedData);
      this.uploadedTemplate.set(file);
      this.triggerDataChange();
      
      console.log('✅ Financial data processed successfully');
      
    } catch (error) {
      console.error('❌ Error processing financial file:', error);
      this.parseError.set(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      this.isParsingFile.set(false);
      this.isUploading.set(false);
      this.parseProgress.set(null);
    }
  }

  private async uploadFileToStorage(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      this.documentService.uploadDocument(
        file, 
        'financial-template', 
        undefined, 
        'financial'
      ).subscribe({
        next: (result) => {
          console.log('✅ File uploaded successfully');
          resolve(result);
        },
        error: (error) => {
          console.error('❌ Upload failed:', error);
          reject(new Error(`File upload failed: ${error.message}`));
        }
      });
    });
  }

  private checkDataQuality(data: ParsedFinancialData): string | null {
    const totalCells = (data.incomeStatement.length + data.financialRatios.length) * EXPECTED_COLUMN_COUNT;
    const filledCells = [...data.incomeStatement, ...data.financialRatios]
      .reduce((count, row) => count + row.values.filter(val => val !== 0).length, 0);
    
    const fillPercentage = (filledCells / totalCells) * 100;
    
    if (fillPercentage < 50) {
      return `Only ${Math.round(fillPercentage)}% of cells contain data. Consider filling in more financial information.`;
    }
    
    return null;
  }

  private applyParsedData(data: ParsedFinancialData) {
    this.incomeStatementData.set(data.incomeStatement);
    this.financialRatiosData.set(data.financialRatios);
    this.columnHeaders.set(data.columnHeaders);
    this.recalculateFields();
  }

  // ===============================
  // FILE MANAGEMENT
  // ===============================

  removeTemplate() {
    this.uploadedTemplate.set(null);
    this.parseError.set(null);
    this.parseWarnings.set([]);
    this.parseProgress.set(null);
    
    const existing = this.existingData();
    if (existing?.uploadedFile) {
      this.documentService.deleteDocumentByKey('financial-template').subscribe({
        next: () => console.log('✅ Financial template file deleted'),
        error: (error) => console.warn('⚠️ Failed to delete file from storage:', error)
      });
    }
    
    this.initializeEmptyData();
    this.triggerDataChange();
  }

  downloadTemplate() {
    import('xlsx')
      .then(XLSX => {
        const templateData = this.createTemplateData();
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(templateData);
        
        XLSX.utils.book_append_sheet(wb, ws, 'Financial Analysis');
        XLSX.writeFile(wb, 'financial_analysis_template.xlsx');
      })
      .catch(error => {
        console.error('Download failed:', error);
        this.parseError.set('Failed to download template. Please try again.');
      });
  }

  private createTemplateData(): (string | number)[][] {
    const headers: (string | number)[] = ['Item', 'Y-3', 'Y-2', 'Y-1', 'Current', 'P+1', 'P+2', 'P+3', 'P+4', 'P+5'];
    const data: (string | number)[][] = [headers];
    
    data.push(['INCOME STATEMENT', ...Array(EXPECTED_COLUMN_COUNT).fill('')]);
    
    const incomeRows = [
      'Revenue', 'Cost of sales', 'Gross Profit', 'Administrative expenses',
      'Other Operating Expenses (Excl depreciation & amortisation)', 'Salaries & Staff Cost',
      'EBITDA', 'Interest Income', 'Finances Cost', 'Depreciation & Amortisation', 'Profit before tax'
    ];
    incomeRows.forEach(label => {
      data.push([label, ...Array(EXPECTED_COLUMN_COUNT).fill(0)]);
    });
    
    data.push(Array(EXPECTED_COLUMN_COUNT + 1).fill(''));
    
    data.push(['FINANCIAL RATIOS', ...Array(EXPECTED_COLUMN_COUNT).fill('')]);
    
    const ratioRows = [
      'Return on Equity (ROE)', 'Debt Equity Ratio (Total liabilities)', 'Current Ratio',
      'Acid Test Ratio (Quick Ratio)', 'Equity Investment Value', 'Return on Investment (ROI)',
      'Sales Growth', 'Gross profit margin', 'Cost to Income ratio', 'Operating margin (EBITDA)',
      'Interest Cover Ratio', 'Net Operating Profit Margin'
    ];
    ratioRows.forEach(label => {
      data.push([label, ...Array(EXPECTED_COLUMN_COUNT).fill(0)]);
    });
    
    return data;
  }

  async downloadCurrentData() {
    if (!this.hasFinancialData()) {
      console.warn('No financial data to download');
      return;
    }
    
    try {
      const XLSX = await import('xlsx');
      const exportData = this.createExportData();
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      
      XLSX.utils.book_append_sheet(wb, ws, 'Financial Analysis');
      
      const fileName = `financial_analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Download failed:', error);
      this.parseError.set('Failed to download data. Please try again.');
    }
  }

  private createExportData(): (string | number)[][] {
    const headers: (string | number)[] = ['Item', ...this.columnHeaders()];
    const data: (string | number)[][] = [headers];
    
    data.push(['INCOME STATEMENT', ...Array(EXPECTED_COLUMN_COUNT).fill('')]);
    this.incomeStatementData().forEach(row => {
      data.push([row.label, ...row.values]);
    });
    
    data.push(Array(EXPECTED_COLUMN_COUNT + 1).fill(''));
    
    data.push(['FINANCIAL RATIOS', ...Array(EXPECTED_COLUMN_COUNT).fill('')]);
    this.financialRatiosData().forEach(row => {
      data.push([row.label, ...row.values]);
    });
    
    return data;
  }

  // ===============================
  // DATA EDITING & CALCULATIONS
  // ===============================

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
        return newData;
      });
      this.recalculateFields();
    }
    
    this.triggerDataChange();
  }

  private recalculateFields() {
    const incomeData = [...this.incomeStatementData()];
    
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
    
    if (revenueRow && costRow && grossProfitRow) {
      grossProfitRow.values = revenueRow.values.map((revenue, i) => revenue + costRow.values[i]);
    }

    if (grossProfitRow && adminRow && opExpRow && salariesRow && ebitdaRow) {
      ebitdaRow.values = grossProfitRow.values.map((grossProfit, i) => 
        grossProfit + adminRow.values[i] + opExpRow.values[i] + salariesRow.values[i]
      );
    }

    if (ebitdaRow && interestIncomeRow && financesCostRow && depreciationRow && profitBeforeTaxRow) {
      profitBeforeTaxRow.values = ebitdaRow.values.map((ebitda, i) => 
        ebitda + (interestIncomeRow.values[i] || 0) + (financesCostRow.values[i] || 0) + (depreciationRow.values[i] || 0)
      );
    }

    this.incomeStatementData.set(incomeData);
  }

  // ===============================
  // AUTO-SAVE FUNCTIONALITY
  // ===============================

  private setupAutoSave() {
    this.autoSaveSubscription = interval(30000).pipe(
      takeWhile(() => true),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      if (this.hasFinancialData() && !this.isSaving()) {
        this.saveData(false);
      }
    });

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

  isProcessingFile(): boolean {
    return this.isParsingFile() || this.isUploading();
  }

  clearErrors() {
    this.parseError.set(null);
    this.parseWarnings.set([]);
  }

  hasValidTemplate(): boolean {
    const incomeData = this.incomeStatementData();
    const ratioData = this.financialRatiosData();
    
    return incomeData.length > 0 && ratioData.length > 0;
  }

  getCompletionPercentage(): number {
    if (!this.hasFinancialData()) return 0;
    
    const totalCells = (this.incomeStatementData().length + this.financialRatiosData().length) * EXPECTED_COLUMN_COUNT;
    const filledCells = [...this.incomeStatementData(), ...this.financialRatiosData()]
      .reduce((count, row) => count + row.values.filter(val => val !== 0).length, 0);
    
    return Math.round((filledCells / totalCells) * 100);
  }

  async saveNotes() {
    this.triggerDataChange();
  }
}