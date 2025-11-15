// src/app/profile/steps/financial-analysis/financial-analysis.component.ts
import {
  Component,
  signal,
  OnInit,
  OnDestroy,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  UiCardComponent,
  UiButtonComponent,
} from '../../../../shared/components';
import { LucideAngularModule, Save, Clock, PenLine } from 'lucide-angular';
import { interval, Subscription, Subject } from 'rxjs';
import { debounceTime, takeWhile, takeUntil } from 'rxjs/operators';
import { SupabaseDocumentService } from '../../../../shared/services/supabase-document.service';
import {
  ExcelFinancialParserService,
  ParseProgress,
  FinancialRowData,
  FinancialRatioData,
  ParsedFinancialData,
} from 'src/app/SMEs/profile/services/excel-parser.service';
import { SMEProfileStepsService } from '../../services/sme-profile-steps.service';
import { FinancialDataTableComponent } from 'src/app/shared/financial-table/financial-data-table.component';
import { FinancialUploadComponent } from './components/financial-upload/financial-upload.component';
import { FinancialSummaryComponent } from './components/financial-summary/financial-summary.component';
import { FinancialNotesComponent } from './components/financial-notes/financial-notes.component';
import { FinancialDataTransformer } from './utils/financial-data.transformer';

const EXPECTED_COLUMN_COUNT = 9;

type FinancialTab =
  | 'income-statement'
  | 'financial-ratios'
  | 'notes'
  | 'health-score';

@Component({
  selector: 'app-financial-analysis',
  standalone: true,
  imports: [
    CommonModule,
    UiCardComponent,
    UiButtonComponent,
    LucideAngularModule,
    FinancialDataTableComponent,
    FinancialUploadComponent,
    FinancialSummaryComponent,
    FinancialNotesComponent,
  ],
  templateUrl: 'financial-analysis.component.html',
})
export class FinancialAnalysisComponent implements OnInit, OnDestroy {
  private profileService = inject(SMEProfileStepsService);
  private documentService = inject(SupabaseDocumentService);
  private excelParser = inject(ExcelFinancialParserService);

  // Tab state
  activeTab = signal<FinancialTab>('income-statement');

  // State signals
  isSaving = signal(false);
  isUploading = signal(false);
  lastSaved = signal<Date | null>(null);
  uploadedTemplate = signal<File | null>(null);
  editingMode = signal(false);
  notesText = signal('');

  // Parsing state
  isParsingFile = signal(false);
  parseError = signal<string | null>(null);
  parseWarnings = signal<string[]>([]);
  parseProgress = signal<ParseProgress | null>(null);

  // Data signals
  incomeStatementData = signal<FinancialRowData[]>([]);
  financialRatiosData = signal<FinancialRatioData[]>([]);
  columnHeaders = signal<string[]>([]);

  // Computed table sections
  incomeStatementSections = computed(() =>
    FinancialDataTransformer.transformIncomeStatement(
      this.incomeStatementData()
    )
  );

  financialRatiosSections = computed(() =>
    FinancialDataTransformer.transformFinancialRatios(
      this.financialRatiosData()
    )
  );

  // Icons
  SaveIcon = Save;
  ClockIcon = Clock;
  EditIcon = PenLine;

  // Auto-save management
  private autoSaveSubscription?: Subscription;
  private destroy$ = new Subject<void>();
  private dataChangeSubject = new Subject<void>();

  ngOnInit() {
    this.excelParser.setDebugMode(true);
    this.loadExistingData();
    this.setupAutoSave();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.autoSaveSubscription?.unsubscribe();
  }

  // ===============================
  // TAB MANAGEMENT
  // ===============================

  switchTab(tab: FinancialTab) {
    this.activeTab.set(tab);
    this.editingMode.set(false);
  }

  toggleEditMode() {
    this.editingMode.set(!this.editingMode());
  }

  // ===============================
  // DATA LOADING & INITIALIZATION
  // ===============================

  private loadExistingData() {
    const profileData = this.profileService.data();
    const financialAnalysis = profileData.financialAnalysis;

    if (financialAnalysis && this.isValidFinancialData(financialAnalysis)) {
      this.loadFromExistingData(financialAnalysis as ParsedFinancialData);
      console.log('✅ Loaded existing financial data');
    } else {
      this.initializeEmptyData();
      console.log('ℹ️ No existing financial data, initialized empty structure');
    }
  }

  private isValidFinancialData(data: any): boolean {
    return (
      data &&
      data.incomeStatement &&
      Array.isArray(data.incomeStatement) &&
      data.financialRatios &&
      Array.isArray(data.financialRatios)
    );
  }

  private loadFromExistingData(data: ParsedFinancialData) {
    this.incomeStatementData.set(data.incomeStatement || []);
    this.financialRatiosData.set(data.financialRatios || []);
    this.columnHeaders.set(data.columnHeaders || []);
    // this.notesText.set(data.notes || '');
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
      `${currentYear + 5}`,
    ];

    this.columnHeaders.set(headers);
    this.incomeStatementData.set([]);
    this.financialRatiosData.set([]);
  }

  // ===============================
  // FILE UPLOAD & PARSING
  // ===============================

  async onFileSelected(file: File) {
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

      const parsedData = await this.excelParser.parseFinancialExcel(
        file,
        (progress) => {
          this.parseProgress.set(progress);
        }
      );

      const validation = this.excelParser.validateParsedData(parsedData);

      if (!validation.isValid) {
        this.parseError.set(
          `Template validation failed: ${validation.errors.join(', ')}`
        );
        return;
      }

      if (validation.warnings.length > 0) {
        this.parseWarnings.set(validation.warnings);
      }

      const qualityWarning = this.checkDataQuality(parsedData);
      if (qualityWarning) {
        this.parseWarnings.update((warnings) => [...warnings, qualityWarning]);
      }

      this.isParsingFile.set(false);
      this.isUploading.set(true);

      const uploadResult = await this.uploadFileToStorage(file);

      parsedData.uploadedFile = {
        documentKey: uploadResult.documentKey,
        fileName: uploadResult.fileName,
        publicUrl: uploadResult.publicUrl,
      };

      this.applyParsedData(parsedData);
      this.uploadedTemplate.set(file);
      this.triggerDataChange();

      console.log('✅ Financial data processed successfully');
    } catch (error) {
      console.error('❌ Error processing financial file:', error);
      this.parseError.set(
        error instanceof Error ? error.message : 'Failed to process file'
      );
    } finally {
      this.isParsingFile.set(false);
      this.isUploading.set(false);
      this.parseProgress.set(null);
    }
  }

  private async uploadFileToStorage(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      this.documentService
        .uploadDocument(file, 'financial-template', undefined, 'financial')
        .subscribe({
          next: (result) => {
            console.log('✅ File uploaded successfully');
            resolve(result);
          },
          error: (error) => {
            console.error('❌ Upload failed:', error);
            reject(error);
          },
        });
    });
  }

  private applyParsedData(parsedData: ParsedFinancialData) {
    this.incomeStatementData.set(parsedData.incomeStatement || []);
    this.financialRatiosData.set(parsedData.financialRatios || []);
    this.columnHeaders.set(parsedData.columnHeaders || []);
  }

  private checkDataQuality(data: ParsedFinancialData): string | null {
    if (!data.incomeStatement?.length || !data.financialRatios?.length) {
      return 'Warning: Some data sections are empty. Ensure your template is complete.';
    }
    return null;
  }

  removeTemplate() {
    this.uploadedTemplate.set(null);
    this.incomeStatementData.set([]);
    this.financialRatiosData.set([]);
    this.parseError.set(null);
    this.parseWarnings.set([]);
  }

  // ===============================
  // TEMPLATE & DATA DOWNLOAD
  // ===============================

  downloadTemplate() {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 9 }, (_, i) => currentYear - 3 + i);

    const incomeLabels = [
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
      'Profit before tax',
    ];

    const ratioRows = [
      'Gross Profit Margin',
      'Net Profit Margin',
      'Return on Assets (ROA)',
      'Return on Equity (ROE)',
      'Current Ratio',
      'Debt to Equity Ratio',
      'Interest Coverage Ratio',
      'Asset Turnover',
    ];

    const incomeData: (string | number)[][] = [['Item', ...years]];
    incomeLabels.forEach((label) => {
      incomeData.push([label, ...Array(EXPECTED_COLUMN_COUNT).fill(0)]);
    });

    incomeData.push(Array(EXPECTED_COLUMN_COUNT + 1).fill(''));

    const ratioData: (string | number)[][] = [['Ratio', ...years]];
    ratioRows.forEach((label) => {
      ratioData.push([label, ...Array(EXPECTED_COLUMN_COUNT).fill(0)]);
    });

    this.downloadExcelFile(incomeData, 'financial_template.xlsx');
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

      const fileName = `financial_analysis_${
        new Date().toISOString().split('T')[0]
      }.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Download failed:', error);
      this.parseError.set('Failed to download data. Please try again.');
    }
  }

  private async downloadExcelFile(
    data: (string | number)[][],
    fileName: string
  ) {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Financial Data');
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Template download failed:', error);
    }
  }

  private createExportData(): (string | number)[][] {
    const headers: (string | number)[] = ['Item', ...this.columnHeaders()];
    const data: (string | number)[][] = [headers];

    data.push(['INCOME STATEMENT', ...Array(EXPECTED_COLUMN_COUNT).fill('')]);
    this.incomeStatementData().forEach((row) => {
      data.push([row.label, ...row.values]);
    });

    data.push(Array(EXPECTED_COLUMN_COUNT + 1).fill(''));
    data.push(['FINANCIAL RATIOS', ...Array(EXPECTED_COLUMN_COUNT).fill('')]);
    this.financialRatiosData().forEach((row) => {
      data.push([row.label, ...row.values]);
    });

    return data;
  }

  // ===============================
  // TABLE DATA HANDLING
  // ===============================

  onIncomeStatementCellChanged(event: {
    sectionIndex: number;
    rowIndex: number;
    colIndex: number;
    value: number;
  }) {
    this.incomeStatementData.update((data) => {
      const newData = [...data];
      newData[event.rowIndex] = {
        ...newData[event.rowIndex],
        values: [...newData[event.rowIndex].values],
      };
      newData[event.rowIndex].values[event.colIndex] = event.value;
      return newData;
    });

    this.recalculateFields();
    this.triggerDataChange();
  }

  onFinancialRatiosCellChanged(event: {
    sectionIndex: number;
    rowIndex: number;
    colIndex: number;
    value: number;
  }) {
    this.financialRatiosData.update((data) => {
      const newData = [...data];
      newData[event.rowIndex] = {
        ...newData[event.rowIndex],
        values: [...newData[event.rowIndex].values],
      };
      newData[event.rowIndex].values[event.colIndex] = event.value;
      return newData;
    });

    this.triggerDataChange();
  }

  private recalculateFields() {
    const incomeData = [...this.incomeStatementData()];

    const revenueRow = incomeData.find((row) => row.label === 'Revenue');
    const costRow = incomeData.find((row) => row.label === 'Cost of sales');
    const grossProfitRow = incomeData.find(
      (row) => row.label === 'Gross Profit'
    );
    const adminRow = incomeData.find(
      (row) => row.label === 'Administrative expenses'
    );
    const opExpRow = incomeData.find(
      (row) =>
        row.label ===
        'Other Operating Expenses (Excl depreciation & amortisation)'
    );
    const salariesRow = incomeData.find(
      (row) => row.label === 'Salaries & Staff Cost'
    );
    const ebitdaRow = incomeData.find((row) => row.label === 'EBITDA');
    const interestIncomeRow = incomeData.find(
      (row) => row.label === 'Interest Income'
    );
    const financesCostRow = incomeData.find(
      (row) => row.label === 'Finances Cost'
    );
    const depreciationRow = incomeData.find(
      (row) => row.label === 'Depreciation & Amortisation'
    );
    const profitBeforeTaxRow = incomeData.find(
      (row) => row.label === 'Profit before tax'
    );

    if (revenueRow && costRow && grossProfitRow) {
      grossProfitRow.values = revenueRow.values.map(
        (revenue, i) => revenue + costRow.values[i]
      );
    }

    if (grossProfitRow && adminRow && opExpRow && salariesRow && ebitdaRow) {
      ebitdaRow.values = grossProfitRow.values.map(
        (grossProfit, i) =>
          grossProfit +
          adminRow.values[i] +
          opExpRow.values[i] +
          salariesRow.values[i]
      );
    }

    if (
      ebitdaRow &&
      interestIncomeRow &&
      financesCostRow &&
      depreciationRow &&
      profitBeforeTaxRow
    ) {
      profitBeforeTaxRow.values = ebitdaRow.values.map(
        (ebitda, i) =>
          ebitda +
          (interestIncomeRow.values[i] || 0) +
          (financesCostRow.values[i] || 0) +
          (depreciationRow.values[i] || 0)
      );
    }

    this.incomeStatementData.set(incomeData);
  }

  // ===============================
  // AUTO-SAVE FUNCTIONALITY
  // ===============================

  private setupAutoSave() {
    this.autoSaveSubscription = interval(30000)
      .pipe(
        takeWhile(() => true),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.hasFinancialData() && !this.isSaving()) {
          this.saveData(false);
        }
      });

    this.dataChangeSubject
      .pipe(debounceTime(2000), takeUntil(this.destroy$))
      .subscribe(() => {
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
      console.log(
        `✅ Financial data ${isManual ? 'manually' : 'auto'} saved successfully`
      );
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
    const uploadedFile = this.uploadedTemplate()
      ? {
          documentKey: 'financial-template',
          fileName: this.uploadedTemplate()?.name || 'financial_template.xlsx',
          publicUrl: '',
        }
      : undefined;

    return {
      incomeStatement: this.incomeStatementData(),
      financialRatios: this.financialRatiosData(),
      columnHeaders: this.columnHeaders(),
      // notes: this.notesText(),
      lastUpdated: new Date().toISOString(),
      uploadedFile,
    };
  }

  // ===============================
  // COMPUTED VALUES
  // ===============================

  hasFinancialData(): boolean {
    return (
      this.incomeStatementData().some((row) =>
        row.values.some((val) => val !== 0)
      ) ||
      this.financialRatiosData().some((row) =>
        row.values.some((val) => val !== 0)
      ) ||
      !!this.uploadedTemplate()
    );
  }

  hasValidTemplate(): boolean {
    const incomeData = this.incomeStatementData();
    const ratioData = this.financialRatiosData();
    return incomeData.length > 0 && ratioData.length > 0;
  }

  getCompletionPercentage(): number {
    if (!this.hasFinancialData()) return 0;

    const totalCells =
      (this.incomeStatementData().length + this.financialRatiosData().length) *
      EXPECTED_COLUMN_COUNT;
    const filledCells = [
      ...this.incomeStatementData(),
      ...this.financialRatiosData(),
    ].reduce(
      (count, row) => count + row.values.filter((val) => val !== 0).length,
      0
    );

    return Math.round((filledCells / totalCells) * 100);
  }

  getLastSavedText(): string {
    const saved = this.lastSaved();
    if (!saved) return '';

    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60)
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    return saved.toLocaleDateString();
  }

  clearErrors() {
    this.parseError.set(null);
    this.parseWarnings.set([]);
  }

  onNotesSaved(notes: string) {
    this.notesText.set(notes);
    this.triggerDataChange();
  }
}
