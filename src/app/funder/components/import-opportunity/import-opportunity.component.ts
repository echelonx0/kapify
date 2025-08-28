// src/app/funder/components/import-opportunity/import-opportunity.component.ts
import { Component, signal, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { LucideAngularModule, Upload, FileText, X, CheckCircle, AlertCircle, Download, Eye, ArrowRight, ArrowLeft, MapPin } from 'lucide-angular';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ImportedData {
  [key: string]: any;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'array';
  transform?: (value: any) => any;
}

interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: ValidationError[];
  data: any[];
}

@Component({
  selector: 'app-import-opportunity',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: 'import-opportunity.component.html',
})
export class ImportOpportunityComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Icons
  UploadIcon = Upload;
  FileTextIcon = FileText;
  XIcon = X;
  CheckIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  DownloadIcon = Download;
  EyeIcon = Eye;
  ArrowRightIcon = ArrowRight;
  ArrowLeftIcon = ArrowLeft;
  MapPinIcon = MapPin;

  // Output events
  @Output() closeImport = new EventEmitter<void>();
  @Output() importComplete = new EventEmitter<any[]>();

  // State
  currentStep = signal<'upload' | 'mapping' | 'preview' | 'results'>('upload');
  uploadedFile = signal<File | null>(null);
  isDragging = signal(false);
  parseProgress = signal(0);
  parseError = signal<string | null>(null);
  isProcessing = signal(false);

  // Data
  rawData = signal<any[]>([]);
  detectedColumns = signal<string[]>([]);
  sampleData = signal<any[]>([]);
  transformedData = signal<any[]>([]);
  validationErrors = signal<ValidationError[]>([]);
  importResult = signal<ImportResult | null>(null);

  // Mapping
  fieldMappings = signal<FieldMapping[]>([]);

  // Steps
  steps = [
    { id: 'upload', title: 'Upload File' },
    { id: 'mapping', title: 'Map Fields' },
    { id: 'preview', title: 'Preview & Validate' },
    { id: 'results', title: 'Import Results' }
  ];

  // Field definitions for opportunity import
  private opportunityFields: FieldMapping[] = [
    { sourceField: '', targetField: 'title', required: true, dataType: 'string' },
    { sourceField: '', targetField: 'description', required: true, dataType: 'string' },
    { sourceField: '', targetField: 'shortDescription', required: true, dataType: 'string' },
    { sourceField: '', targetField: 'fundingType', required: true, dataType: 'string' },
    { sourceField: '', targetField: 'offerAmount', required: true, dataType: 'number' },
    { sourceField: '', targetField: 'minInvestment', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'maxInvestment', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'totalAvailable', required: true, dataType: 'number' },
    { sourceField: '', targetField: 'currency', required: false, dataType: 'string' },
    { sourceField: '', targetField: 'decisionTimeframe', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'interestRate', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'equityOffered', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'expectedReturns', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'investmentHorizon', required: false, dataType: 'number' },
    { sourceField: '', targetField: 'applicationDeadline', required: false, dataType: 'date' }
  ];

  ngOnInit() {
    this.fieldMappings.set([...this.opportunityFields]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // STEP NAVIGATION
  // ===============================

  isStepActive(stepId: string): boolean {
    return this.currentStep() === stepId;
  }

  isStepCompleted(stepId: string): boolean {
    const steps = ['upload', 'mapping', 'preview', 'results'];
    const currentIndex = steps.indexOf(this.currentStep());
    const stepIndex = steps.indexOf(stepId);
    return stepIndex < currentIndex;
  }

  nextStep() {
    const current = this.currentStep();
    switch (current) {
      case 'upload':
        if (this.uploadedFile() && this.parseProgress() === 100) {
          this.currentStep.set('mapping');
        }
        break;
      case 'mapping':
        if (this.canProceedFromMapping()) {
          this.processData();
          this.currentStep.set('preview');
        }
        break;
      case 'preview':
        if (this.canImport()) {
          this.importData();
        }
        break;
    }
  }

  previousStep() {
    const current = this.currentStep();
    switch (current) {
      case 'mapping':
        this.currentStep.set('upload');
        break;
      case 'preview':
        this.currentStep.set('mapping');
        break;
      case 'results':
        this.currentStep.set('preview');
        break;
    }
  }

  // ===============================
  // FILE HANDLING
  // ===============================

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    // Validate file type
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(fileExtension)) {
      this.parseError.set('Invalid file type. Please upload a CSV or Excel file.');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      this.parseError.set('File too large. Please upload a file smaller than 10MB.');
      return;
    }

    this.uploadedFile.set(file);
    this.parseError.set(null);
    this.parseFile(file);
  }

  private async parseFile(file: File) {
    this.parseProgress.set(0);
    
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        await this.parseCsvFile(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        await this.parseExcelFile(file);
      }
      
      this.parseProgress.set(100);
    } catch (error: any) {
      this.parseError.set(error.message || 'Failed to parse file');
      this.parseProgress.set(0);
    }
  }

private async parseCsvFile(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('CSV parsing errors: ' + results.errors.map(e => e.message).join(', ')));
          return;
        }
        
        this.rawData.set(results.data as any[]);
        this.detectedColumns.set(results.meta.fields || []);
        this.sampleData.set(results.data.slice(0, 5) as any[]);
        resolve(undefined);
      },
      error: (error) => {
        reject(new Error('Failed to parse CSV: ' + error.message));
      }
    });
  });
}
  private async parseExcelFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Use the first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: null 
          }) as any[][];
          
          if (jsonData.length === 0) {
            reject(new Error('Excel file appears to be empty'));
            return;
          }
          
          // First row as headers
          const headers = jsonData[0].map(h => String(h || '').trim()).filter(h => h);
          const dataRows = jsonData.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''));
          
          // Convert to objects
          const parsedData = dataRows.map(row => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index] || null;
            });
            return obj;
          });
          
          this.rawData.set(parsedData);
          this.detectedColumns.set(headers);
          this.sampleData.set(parsedData.slice(0, 5));
          resolve();
          
        } catch (error: any) {
          reject(new Error('Failed to parse Excel file: ' + error.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  removeFile() {
    this.uploadedFile.set(null);
    this.rawData.set([]);
    this.detectedColumns.set([]);
    this.sampleData.set([]);
    this.parseProgress.set(0);
    this.parseError.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // ===============================
  // TEMPLATE DOWNLOAD
  // ===============================

  downloadTemplate(format: 'csv' | 'xlsx') {
    const templateData = [
      {
        title: 'Example Growth Capital Fund',
        description: 'Funding for established SMEs looking to expand operations and market reach',
        shortDescription: 'Growth capital for expanding SMEs',
        fundingType: 'equity',
        offerAmount: 500000,
        minInvestment: 100000,
        maxInvestment: 2000000,
        totalAvailable: 5000000,
        currency: 'ZAR',
        decisionTimeframe: 30,
        interestRate: null,
        equityOffered: 15,
        expectedReturns: 25,
        investmentHorizon: 5,
        applicationDeadline: '2024-12-31'
      },
      {
        title: 'SME Debt Financing Program',
        description: 'Traditional debt financing for working capital and equipment purchases',
        shortDescription: 'Working capital and equipment financing',
        fundingType: 'debt',
        offerAmount: 250000,
        minInvestment: 50000,
        maxInvestment: 1000000,
        totalAvailable: 2000000,
        currency: 'ZAR',
        decisionTimeframe: 14,
        interestRate: 12.5,
        equityOffered: null,
        expectedReturns: null,
        investmentHorizon: 3,
        applicationDeadline: '2024-11-30'
      }
    ];

    if (format === 'csv') {
      const csv = Papa.unparse(templateData);
      this.downloadFile(csv, 'funding-opportunities-template.csv', 'text/csv');
    } else {
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Opportunities');
      XLSX.writeFile(wb, 'funding-opportunities-template.xlsx');
    }
  }

  private downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // ===============================
  // FIELD MAPPING
  // ===============================

  autoMapFields() {
    const mappings = this.fieldMappings();
    const columns = this.detectedColumns();
    
    // Common field name patterns
    const patterns: Record<string, RegExp[]> = {
      title: [/^title$/i, /^name$/i, /^opportunity.?name$/i],
      description: [/^description$/i, /^desc$/i, /^details$/i],
      shortDescription: [/^short.?desc/i, /^summary$/i, /^brief$/i],
      fundingType: [/^funding.?type$/i, /^type$/i, /^fund.?type$/i],
      offerAmount: [/^offer.?amount$/i, /^amount$/i, /^funding.?amount$/i],
      minInvestment: [/^min.?investment$/i, /^minimum$/i, /^min.?amount$/i],
      maxInvestment: [/^max.?investment$/i, /^maximum$/i, /^max.?amount$/i],
      totalAvailable: [/^total.?available$/i, /^total$/i, /^available$/i],
      currency: [/^currency$/i, /^curr$/i],
      decisionTimeframe: [/^decision.?timeframe$/i, /^timeframe$/i, /^days$/i],
      interestRate: [/^interest.?rate$/i, /^rate$/i],
      equityOffered: [/^equity$/i, /^equity.?offered$/i],
      expectedReturns: [/^expected.?returns$/i, /^returns$/i],
      investmentHorizon: [/^investment.?horizon$/i, /^horizon$/i, /^years$/i],
      applicationDeadline: [/^application.?deadline$/i, /^deadline$/i, /^due.?date$/i]
    };

    mappings.forEach(mapping => {
      const fieldPatterns = patterns[mapping.targetField];
      if (!fieldPatterns) return;

      const matchedColumn = columns.find(col => 
        fieldPatterns.some(pattern => pattern.test(col))
      );

      if (matchedColumn) {
        mapping.sourceField = matchedColumn;
      }
    });

    this.fieldMappings.set([...mappings]);
  }

  getFieldDisplayName(field: string): string {
    const displayNames: Record<string, string> = {
      title: 'Title',
      description: 'Description',
      shortDescription: 'Short Description',
      fundingType: 'Funding Type',
      offerAmount: 'Offer Amount',
      minInvestment: 'Minimum Investment',
      maxInvestment: 'Maximum Investment',
      totalAvailable: 'Total Available',
      currency: 'Currency',
      decisionTimeframe: 'Decision Timeframe (days)',
      interestRate: 'Interest Rate (%)',
      equityOffered: 'Equity Offered (%)',
      expectedReturns: 'Expected Returns (%)',
      investmentHorizon: 'Investment Horizon (years)',
      applicationDeadline: 'Application Deadline'
    };
    return displayNames[field] || field;
  }

  getFieldDescription(field: string): string {
    const descriptions: Record<string, string> = {
      title: 'Name of the funding opportunity',
      description: 'Detailed description of the opportunity',
      shortDescription: 'Brief summary for listings',
      fundingType: 'Type: debt, equity, convertible, mezzanine, grant',
      offerAmount: 'Typical investment amount per business',
      minInvestment: 'Minimum investment amount',
      maxInvestment: 'Maximum investment amount',
      totalAvailable: 'Total funding pool available',
      currency: 'Currency code (e.g., ZAR, USD)',
      decisionTimeframe: 'Days to make funding decision',
      interestRate: 'Annual interest rate for debt funding',
      equityOffered: 'Percentage of equity offered',
      expectedReturns: 'Expected annual return percentage',
      investmentHorizon: 'Expected investment duration in years',
      applicationDeadline: 'Last date to apply (YYYY-MM-DD)'
    };
    return descriptions[field] || '';
  }

  getSampleValue(columnName: string): string {
    const sample = this.sampleData()[0];
    if (!sample || !columnName) return '';
    const value = sample[columnName];
    return value ? String(value).substring(0, 30) + (String(value).length > 30 ? '...' : '') : '';
  }

  canProceedFromMapping(): boolean {
    const mappings = this.fieldMappings();
    const requiredMappings = mappings.filter(m => m.required);
    return requiredMappings.every(m => m.sourceField !== '');
  }

  // ===============================
  // DATA PROCESSING & VALIDATION
  // ===============================

  processData() {
    const mappings = this.fieldMappings();
    const rawData = this.rawData();
    
    const transformedData = rawData.map((row, index) => {
      const transformed: any = {};
      
      mappings.forEach(mapping => {
        if (!mapping.sourceField) return;
        
        const rawValue = row[mapping.sourceField];
        transformed[mapping.targetField] = this.transformValue(rawValue, mapping);
      });
      
      return transformed;
    });
    
    this.transformedData.set(transformedData);
  }

  private transformValue(value: any, mapping: FieldMapping): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    switch (mapping.dataType) {
      case 'number':
        const numValue = typeof value === 'string' ? 
          parseFloat(value.replace(/[,\s]/g, '')) : Number(value);
        return isNaN(numValue) ? null : numValue;
        
      case 'string':
        return String(value).trim();
        
      case 'date':
        try {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
        } catch {
          return null;
        }
        
      case 'boolean':
        if (typeof value === 'boolean') return value;
        const str = String(value).toLowerCase();
        return ['true', 'yes', '1', 'y'].includes(str);
        
      default:
        return value;
    }
  }

  validateData() {
    const data = this.transformedData();
    const mappings = this.fieldMappings();
    const errors: ValidationError[] = [];

    data.forEach((row, rowIndex) => {
      mappings.forEach(mapping => {
        const value = row[mapping.targetField];
        
        // Required field validation
        if (mapping.required && (value === null || value === undefined || value === '')) {
          errors.push({
            row: rowIndex,
            field: mapping.targetField,
            value,
            message: `${this.getFieldDisplayName(mapping.targetField)} is required`,
            severity: 'error'
          });
          return;
        }

        // Field-specific validations
        this.validateFieldValue(rowIndex, mapping.targetField, value, errors);
      });

      // Cross-field validations
      this.validateRowConstraints(rowIndex, row, errors);
    });

    this.validationErrors.set(errors);
  }

  private validateFieldValue(rowIndex: number, field: string, value: any, errors: ValidationError[]) {
    if (value === null || value === undefined) return;

    switch (field) {
      case 'fundingType':
        const validTypes = ['debt', 'equity', 'convertible', 'mezzanine', 'grant'];
        if (!validTypes.includes(value.toLowerCase())) {
          errors.push({
            row: rowIndex,
            field,
            value,
            message: `Funding type must be one of: ${validTypes.join(', ')}`,
            severity: 'error'
          });
        }
        break;

      case 'offerAmount':
      case 'minInvestment':
      case 'maxInvestment':
      case 'totalAvailable':
        if (typeof value === 'number' && value <= 0) {
          errors.push({
            row: rowIndex,
            field,
            value,
            message: `${this.getFieldDisplayName(field)} must be greater than 0`,
            severity: 'error'
          });
        }
        break;

      case 'interestRate':
      case 'equityOffered':
      case 'expectedReturns':
        if (typeof value === 'number' && (value < 0 || value > 100)) {
          errors.push({
            row: rowIndex,
            field,
            value,
            message: `${this.getFieldDisplayName(field)} must be between 0 and 100`,
            severity: 'warning'
          });
        }
        break;

      case 'currency':
        const validCurrencies = ['ZAR', 'USD', 'EUR', 'GBP'];
        if (typeof value === 'string' && !validCurrencies.includes(value.toUpperCase())) {
          errors.push({
            row: rowIndex,
            field,
            value,
            message: `Currency should be one of: ${validCurrencies.join(', ')}`,
            severity: 'warning'
          });
        }
        break;
    }
  }

  private validateRowConstraints(rowIndex: number, row: any, errors: ValidationError[]) {
    // Min/Max investment validation
    if (row.minInvestment && row.maxInvestment && row.minInvestment > row.maxInvestment) {
      errors.push({
        row: rowIndex,
        field: 'maxInvestment',
        value: row.maxInvestment,
        message: 'Maximum investment must be greater than or equal to minimum investment',
        severity: 'error'
      });
    }

    // Offer amount vs total available
    if (row.offerAmount && row.totalAvailable && row.offerAmount > row.totalAvailable) {
      errors.push({
        row: rowIndex,
        field: 'offerAmount',
        value: row.offerAmount,
        message: 'Offer amount cannot exceed total available funding',
        severity: 'warning'
      });
    }
  }

  getPreviewRows() {
    return this.transformedData().slice(0, 10);
  }

  hasRowErrors(rowIndex: number): boolean {
    return this.validationErrors().some(error => error.row === rowIndex && error.severity === 'error');
  }

  getErrorSummary(): string {
    const errors = this.validationErrors();
    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warningCount = errors.filter(e => e.severity === 'warning').length;
    
    const parts = [];
    if (errorCount > 0) parts.push(`${errorCount} error${errorCount !== 1 ? 's' : ''}`);
    if (warningCount > 0) parts.push(`${warningCount} warning${warningCount !== 1 ? 's' : ''}`);
    
    return parts.join(' and ');
  }

  canImport(): boolean {
    const errors = this.validationErrors().filter(e => e.severity === 'error');
    return errors.length === 0 && this.transformedData().length > 0;
  }

  getValidRowCount(): number {
    const data = this.transformedData();
    const errorRows = new Set(this.validationErrors()
      .filter(e => e.severity === 'error')
      .map(e => e.row));
    
    return data.filter((_, index) => !errorRows.has(index)).length;
  }

  formatCurrency(amount: any): string {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(Number(amount) || 0);
  }

  // ===============================
  // IMPORT EXECUTION
  // ===============================

  async importData() {
    this.isProcessing.set(true);
    
    try {
      const validData = this.getValidRowsForImport();
      
      // Here you would call your service to create the opportunities
      // For now, we'll simulate the import
      await this.simulateImport(validData);
      
      this.importResult.set({
        success: true,
        imported: validData.length,
        errors: [],
        data: validData
      });
      
      this.currentStep.set('results');
      
      // Emit the imported data
      this.importComplete.emit(validData);
      
    } catch (error: any) {
      this.importResult.set({
        success: false,
        imported: 0,
        errors: [{ row: 0, field: 'general', value: null, message: error.message, severity: 'error' }],
        data: []
      });
      this.currentStep.set('results');
    } finally {
      this.isProcessing.set(false);
    }
  }

  private getValidRowsForImport(): any[] {
    const data = this.transformedData();
    const errorRows = new Set(this.validationErrors()
      .filter(e => e.severity === 'error')
      .map(e => e.row));
    
    return data.filter((_, index) => !errorRows.has(index));
  }

  private async simulateImport(data: any[]): Promise<void> {
    // Simulate API calls with delay
    for (let i = 0; i < data.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      // Here you would call: await this.opportunityService.createOpportunity(data[i]);
    }
  }

  // ===============================
  // MODAL ACTIONS
  // ===============================

  closeModal() {
    this.closeImport.emit();
  }
}