// src/app/SMEs/profile/steps/financial-analysis/financial-analysis.component.ts
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
  LucideAngularModule,
  Save,
  Clock,
  PenLine,
  RefreshCw,
  Download,
  AlertCircle,
} from 'lucide-angular';
import { interval, Subscription, Subject } from 'rxjs';
import { debounceTime, takeWhile, takeUntil } from 'rxjs/operators';
import { SupabaseDocumentService } from '../../../../shared/services/supabase-document.service';
import {
  ExcelFinancialParserService,
  ParseProgress,
  FinancialRowData,
  FinancialRatioData,
  ParsedFinancialData,
  BalanceSheetRowData,
  CashFlowRowData,
} from './utils/excel-parser.service';
import { SMEProfileStepsService } from '../../services/sme-profile-steps.service';
import {
  FinancialDataTableComponent,
  FinancialTableSection,
} from './financial-table/financial-data-table.component';
import { FinancialUploadComponent } from './components/financial-upload/financial-upload.component';
import { FinancialSummaryComponent } from './components/financial-summary/financial-summary.component';
import { FinancialNotesComponent } from './components/financial-notes/financial-notes.component';
import { FinancialDataTransformer } from './utils/financial-data.transformer';
import { FinancialRatioCalculatorService } from './services/financial-ratio-calculator.service';
import { FinancialTableSkeletonComponent } from './components/financial-table-skeleton.component';
import { FullscreenDarkModeService } from './services/fullscreen-dark-mode.service';

const EXPECTED_COLUMN_COUNT = 9;
const AUTO_SAVE_DEBOUNCE = 2000;

type FinancialTab =
  | 'income-statement'
  | 'balance-sheet'
  | 'cash-flow'
  | 'financial-ratios'
  | 'notes'
  | 'health-score';

type LoadingState = 'idle' | 'initializing' | 'parsing' | 'uploading' | 'ready';

@Component({
  selector: 'app-financial-analysis',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    FinancialDataTableComponent,
    FinancialUploadComponent,
    FinancialSummaryComponent,
    FinancialNotesComponent,
    FinancialTableSkeletonComponent,
  ],
  templateUrl: 'financial-analysis.component.html',
})
export class FinancialAnalysisComponent implements OnInit, OnDestroy {
  private profileService = inject(SMEProfileStepsService);
  private documentService = inject(SupabaseDocumentService);
  private excelParser = inject(ExcelFinancialParserService);
  private ratioCalculator = inject(FinancialRatioCalculatorService);
  private darkMode = inject(FullscreenDarkModeService); // Add this
  // Tab state
  activeTab = signal<FinancialTab>('income-statement');

  // Data signals
  incomeStatementData = signal<FinancialRowData[]>([]);
  balanceSheetData = signal<BalanceSheetRowData[]>([]);
  cashFlowData = signal<CashFlowRowData[]>([]);
  financialRatiosData = signal<FinancialRatioData[]>([]);
  columnHeaders = signal<string[]>([]);

  // Single loading state
  loadingState = signal<LoadingState>('idle');
  loadingMessage = signal('');

  // State signals
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);
  uploadedTemplate = signal<File | null>(null);
  editingMode = signal(false);
  notesText = signal('');

  // Parsing state
  parseError = signal<string | null>(null);
  parseWarnings = signal<string[]>([]);
  parseProgress = signal<ParseProgress | null>(null);

  // Computed table sections
  incomeStatementSections = computed(() =>
    FinancialDataTransformer.transformIncomeStatement(
      this.incomeStatementData()
    )
  );

  balanceSheetSections = computed(() =>
    FinancialDataTransformer.transformBalanceSheet(this.balanceSheetData())
  );

  cashFlowSections = computed(() =>
    FinancialDataTransformer.transformCashFlow(this.cashFlowData())
  );

  financialRatiosSections = computed(() =>
    FinancialDataTransformer.transformFinancialRatios(
      this.financialRatiosData()
    )
  );

  // VALIDATION - Now computed, always accurate
  validationResults = computed(() => {
    // Don't validate during loading
    if (this.isLoading()) {
      return { balanceSheetBalanced: true, cashFlowReconciled: true };
    }

    // Don't validate without data
    if (!this.hasFinancialData()) {
      return { balanceSheetBalanced: true, cashFlowReconciled: true };
    }

    return {
      balanceSheetBalanced: this.checkBalanceSheetBalanced(),
      cashFlowReconciled: this.checkCashFlowReconciled(),
    };
  });

  // Icons
  SaveIcon = Save;
  ClockIcon = Clock;
  EditIcon = PenLine;
  RefreshIcon = RefreshCw;
  DownloadIcon = Download;
  AlertIcon = AlertCircle;

  // Auto-save management
  private autoSaveSubscription?: Subscription;
  private destroy$ = new Subject<void>();
  private dataChangeSubject = new Subject<void>();

  async ngOnInit() {
    this.excelParser.setDebugMode(true);
    await this.loadExistingData();
    this.setupAutoSave();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.autoSaveSubscription?.unsubscribe();
  }

  // ===============================
  // LOADING STATE - SIMPLIFIED
  // ===============================

  isLoading(): boolean {
    const state = this.loadingState();
    return state !== 'idle' && state !== 'ready';
  }

  // private async loadExistingData(): Promise<void> {
  //   this.loadingState.set('initializing');
  //   this.loadingMessage.set('Loading financial data...');

  //   try {
  //     const profileData = this.profileService.data();
  //     const financialAnalysis = profileData.financialAnalysis;

  //     if (financialAnalysis && this.isValidFinancialData(financialAnalysis)) {
  //       this.loadFromExistingData(financialAnalysis as ParsedFinancialData);
  //     } else {
  //       this.initializeEmptyData();
  //     }

  //     // Small delay for smooth skeleton transition
  //     await new Promise((resolve) => setTimeout(resolve, 300));
  //   } catch (error) {
  //     console.error('Failed to load financial data:', error);
  //     this.parseError.set('Failed to load financial data');
  //   } finally {
  //     this.loadingState.set('ready');
  //   }
  // }

  // ===============================
  // VALIDATION - PURE COMPUTATION
  // ===============================

  private checkBalanceSheetBalanced(): boolean {
    const balanceSheet = this.balanceSheetData();
    if (balanceSheet.length === 0) return true;

    const totalAssetsRow = balanceSheet.find(
      (r) =>
        r.label.toLowerCase().includes('total assets') &&
        r.category === 'assets'
    );
    const totalLiabilitiesRow = balanceSheet.find(
      (r) =>
        r.label.toLowerCase().includes('total liabilities') &&
        r.category === 'liabilities'
    );
    const totalEquityRow = balanceSheet.find(
      (r) =>
        (r.label.toLowerCase().includes('total equity') ||
          r.label.toLowerCase().includes('total shareholders')) &&
        r.category === 'equity'
    );

    if (!totalAssetsRow || !totalLiabilitiesRow || !totalEquityRow) {
      return true;
    }

    const lastColIndex = this.columnHeaders().length - 1;
    if (lastColIndex < 0) return true;

    const assets = totalAssetsRow.values[lastColIndex] || 0;
    const liabilities = totalLiabilitiesRow.values[lastColIndex] || 0;
    const equity = totalEquityRow.values[lastColIndex] || 0;

    const diff = Math.abs(assets - (liabilities + equity));
    return diff <= 100;
  }

  private checkCashFlowReconciled(): boolean {
    const cashFlow = this.cashFlowData();
    const balanceSheet = this.balanceSheetData();

    if (cashFlow.length === 0 || balanceSheet.length === 0) {
      return true;
    }

    const cfClosingCashRow = cashFlow.find(
      (r) =>
        r.label.toLowerCase().includes('closing') ||
        r.label.toLowerCase().includes('ending') ||
        r.label.toLowerCase().includes('end of period')
    );

    const bsCashRow = balanceSheet.find(
      (r) =>
        (r.subcategory === 'current' &&
          r.label.toLowerCase().includes('cash') &&
          !r.label.toLowerCase().includes('equivalents')) ||
        r.label.toLowerCase() === 'cash and cash equivalents'
    );

    if (!cfClosingCashRow || !bsCashRow) {
      return true;
    }

    const lastColIndex = this.columnHeaders().length - 1;
    if (lastColIndex < 0) return true;

    const cfCash = cfClosingCashRow.values[lastColIndex] || 0;
    const bsCash = bsCashRow.values[lastColIndex] || 0;

    const diff = Math.abs(cfCash - bsCash);
    return diff <= 100;
  }

  // Public validation accessors for template
  isBalanceSheetBalanced(): boolean {
    return this.validationResults().balanceSheetBalanced;
  }

  isCashFlowReconciledToBS(): boolean {
    return this.validationResults().cashFlowReconciled;
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
    this.balanceSheetData.set(data.balanceSheet || []);
    this.cashFlowData.set(data.cashFlow || []);
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
    this.balanceSheetData.set([]);
    this.cashFlowData.set([]);
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

    this.loadingState.set('parsing');
    this.parseError.set(null);
    this.parseWarnings.set([]);
    this.parseProgress.set(null);

    try {
      const parsedData = await this.excelParser.parseFinancialExcel(
        file,
        (progress) => {
          this.parseProgress.set(progress);
          this.loadingMessage.set(progress.message);
        }
      );

      const validation = this.excelParser.validateParsedData(parsedData);

      if (!validation.isValid) {
        this.parseError.set(
          `Template validation failed: ${validation.errors.join(', ')}`
        );
        this.loadingState.set('ready');
        return;
      }

      if (validation.warnings.length > 0) {
        this.parseWarnings.set(validation.warnings);
      }

      const qualityWarning = this.checkDataQuality(parsedData);
      if (qualityWarning) {
        this.parseWarnings.update((warnings) => [...warnings, qualityWarning]);
      }

      this.loadingState.set('uploading');
      this.loadingMessage.set('Uploading file...');

      const uploadResult = await this.uploadFileToStorage(file);

      parsedData.uploadedFile = {
        documentKey: uploadResult.documentKey,
        fileName: uploadResult.fileName,
        publicUrl: uploadResult.publicUrl,
      };

      this.applyParsedData(parsedData);
      this.uploadedTemplate.set(file);
      this.recalculateAllRatios();
      this.triggerDataChange();

      this.loadingState.set('ready');
    } catch (error) {
      console.error('Error processing financial file:', error);
      this.parseError.set(
        error instanceof Error ? error.message : 'Failed to process file'
      );
      this.loadingState.set('ready');
    } finally {
      this.parseProgress.set(null);
    }
  }

  private async uploadFileToStorage(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      this.documentService
        .uploadDocument(file, 'financial-template', undefined, 'financial')
        .subscribe({
          next: (result) => resolve(result),
          error: (error) => reject(error),
        });
    });
  }

  private applyParsedData(parsedData: ParsedFinancialData) {
    this.incomeStatementData.set(parsedData.incomeStatement || []);
    this.financialRatiosData.set(parsedData.financialRatios || []);
    this.columnHeaders.set(parsedData.columnHeaders || []);
    this.balanceSheetData.set(parsedData.balanceSheet || []);
    this.cashFlowData.set(parsedData.cashFlow || []);
  }

  private checkDataQuality(data: ParsedFinancialData): string | null {
    if (!data.incomeStatement?.length || !data.financialRatios?.length) {
      return 'Warning: Some data sections are empty. Ensure your template is complete.';
    }
    return null;
  }

  // ===============================
  // REPLACE DATA FUNCTIONALITY
  // ===============================

  replaceData() {
    const hasData = this.hasFinancialData();

    if (hasData) {
      const confirmed = confirm(
        'Are you sure you want to replace all financial data?\n\n' +
          'This will remove:\n' +
          '• Income Statement data\n' +
          '• Balance Sheet data\n' +
          '• Cash Flow Statement data\n' +
          '• Financial Ratios\n\n' +
          'This action cannot be undone. Consider downloading your current data first.'
      );

      if (!confirmed) return;
    }

    this.clearAllData();
  }

  private clearAllData() {
    this.uploadedTemplate.set(null);
    this.incomeStatementData.set([]);
    this.balanceSheetData.set([]);
    this.cashFlowData.set([]);
    this.financialRatiosData.set([]);
    this.parseError.set(null);
    this.parseWarnings.set([]);
    this.editingMode.set(false);
    this.activeTab.set('income-statement');
    this.initializeEmptyData();
  }

  removeTemplate() {
    this.clearAllData();
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
    if (!this.hasFinancialData()) return;

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

    data.push(['BALANCE SHEET', ...Array(EXPECTED_COLUMN_COUNT).fill('')]);
    this.balanceSheetData().forEach((row) => {
      data.push([row.label, ...row.values]);
    });

    data.push(Array(EXPECTED_COLUMN_COUNT + 1).fill(''));

    data.push([
      'CASH FLOW STATEMENT',
      ...Array(EXPECTED_COLUMN_COUNT).fill(''),
    ]);
    this.cashFlowData().forEach((row) => {
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
    const sections = this.incomeStatementSections();
    const flatIndex = this.getFlatIndex(
      sections,
      event.sectionIndex,
      event.rowIndex
    );

    this.incomeStatementData.update((data) => {
      const newData = [...data];
      if (flatIndex >= 0 && flatIndex < newData.length) {
        newData[flatIndex] = {
          ...newData[flatIndex],
          values: [...newData[flatIndex].values],
        };
        newData[flatIndex].values[event.colIndex] = event.value;
      }
      return newData;
    });

    this.recalculateIncomeStatementFields();
    this.recalculateAllRatios();
    this.triggerDataChange();
  }

  onBalanceSheetCellChanged(event: {
    sectionIndex: number;
    rowIndex: number;
    colIndex: number;
    value: number;
  }) {
    const sections = this.balanceSheetSections();
    const flatIndex = this.getFlatIndexForBalanceSheet(
      sections,
      event.sectionIndex,
      event.rowIndex
    );

    this.balanceSheetData.update((data) => {
      const newData = [...data];
      if (flatIndex >= 0 && flatIndex < newData.length) {
        newData[flatIndex] = {
          ...newData[flatIndex],
          values: [...newData[flatIndex].values],
        };
        newData[flatIndex].values[event.colIndex] = event.value;
      }
      return newData;
    });

    this.recalculateAllRatios();
    this.triggerDataChange();
  }

  onCashFlowCellChanged(event: {
    sectionIndex: number;
    rowIndex: number;
    colIndex: number;
    value: number;
  }) {
    const sections = this.cashFlowSections();
    const flatIndex = this.getFlatIndexForCashFlow(
      sections,
      event.sectionIndex,
      event.rowIndex
    );

    this.cashFlowData.update((data) => {
      const newData = [...data];
      if (flatIndex >= 0 && flatIndex < newData.length) {
        newData[flatIndex] = {
          ...newData[flatIndex],
          values: [...newData[flatIndex].values],
        };
        newData[flatIndex].values[event.colIndex] = event.value;
      }
      return newData;
    });

    this.triggerDataChange();
  }

  onFinancialRatiosCellChanged(event: {
    sectionIndex: number;
    rowIndex: number;
    colIndex: number;
    value: number;
  }) {
    const sections = this.financialRatiosSections();
    const flatIndex = this.getFlatIndex(
      sections,
      event.sectionIndex,
      event.rowIndex
    );

    this.financialRatiosData.update((data) => {
      const newData = [...data];
      if (flatIndex >= 0 && flatIndex < newData.length) {
        newData[flatIndex] = {
          ...newData[flatIndex],
          values: [...newData[flatIndex].values],
        };
        newData[flatIndex].values[event.colIndex] = event.value;
      }
      return newData;
    });

    this.triggerDataChange();
  }

  // ===============================
  // INDEX MAPPING HELPERS
  // ===============================

  private getFlatIndex(
    sections: FinancialTableSection[],
    sectionIndex: number,
    rowIndex: number
  ): number {
    let flatIndex = 0;
    for (let i = 0; i < sectionIndex; i++) {
      flatIndex += sections[i]?.rows.length || 0;
    }
    return flatIndex + rowIndex;
  }

  private getFlatIndexForBalanceSheet(
    sections: FinancialTableSection[],
    sectionIndex: number,
    rowIndex: number
  ): number {
    const balanceData = this.balanceSheetData();
    const section = sections[sectionIndex];

    if (!section) return -1;

    const rowLabel = section.rows[rowIndex]?.label;
    if (!rowLabel) return -1;

    return balanceData.findIndex((row) => row.label === rowLabel);
  }

  private getFlatIndexForCashFlow(
    sections: FinancialTableSection[],
    sectionIndex: number,
    rowIndex: number
  ): number {
    const cashFlowData = this.cashFlowData();
    const section = sections[sectionIndex];

    if (!section) return -1;

    const rowLabel = section.rows[rowIndex]?.label;
    if (!rowLabel) return -1;

    return cashFlowData.findIndex((row) => row.label === rowLabel);
  }

  // ===============================
  // RECALCULATION METHODS
  // ===============================

  private recalculateIncomeStatementFields() {
    const currentData = this.incomeStatementData();
    const recalculated =
      this.ratioCalculator.recalculateIncomeStatement(currentData);
    this.incomeStatementData.set(recalculated);
  }

  private recalculateAllRatios() {
    const income = this.incomeStatementData();
    const balance = this.balanceSheetData();
    const cashFlow = this.cashFlowData();
    const existingRatios = this.financialRatiosData();

    if (income.length === 0 && balance.length === 0) {
      return;
    }

    const recalculatedRatios = this.ratioCalculator.recalculateRatios(
      income,
      balance,
      cashFlow,
      existingRatios
    );

    this.financialRatiosData.set(recalculatedRatios);
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
      .pipe(debounceTime(AUTO_SAVE_DEBOUNCE), takeUntil(this.destroy$))
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
    } catch (error) {
      console.error('Failed to save financial analysis:', error);
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
      balanceSheet: this.balanceSheetData(),
      cashFlow: this.cashFlowData(),
      financialRatios: this.financialRatiosData(),
      columnHeaders: this.columnHeaders(),
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
      this.balanceSheetData().some((row) =>
        row.values.some((val) => val !== 0)
      ) ||
      this.cashFlowData().some((row) => row.values.some((val) => val !== 0)) ||
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
      (this.incomeStatementData().length +
        this.balanceSheetData().length +
        this.cashFlowData().length +
        this.financialRatiosData().length) *
      EXPECTED_COLUMN_COUNT;

    const filledCells = [
      ...this.incomeStatementData(),
      ...this.balanceSheetData(),
      ...this.cashFlowData(),
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

  // shouldShowValidation(): boolean {
  //   // Don't show during loading
  //   if (this.isLoading()) {
  //     return false;
  //   }

  //   // Don't show if no data
  //   if (!this.hasFinancialData()) {
  //     return false;
  //   }

  //   // CRITICAL: Don't show while editing
  //   if (this.editingMode()) {
  //     return false;
  //   }

  //   // Only show when data is stable
  //   return this.loadingState() === 'ready';
  // }

  // src/app/SMEs/profile/steps/financial-analysis/financial-analysis.component.ts

  // Add this method to force a render cycle delay
  private async loadExistingData(): Promise<void> {
    return new Promise(async (resolve) => {
      // CRITICAL: Ensure skeleton shows by delaying data load
      await new Promise((r) => setTimeout(r, 100));

      const profileData = this.profileService.data();
      const financialAnalysis = profileData.financialAnalysis;

      if (financialAnalysis && this.isValidFinancialData(financialAnalysis)) {
        this.loadFromExistingData(financialAnalysis as ParsedFinancialData);
      } else {
        this.initializeEmptyData();
      }

      // Small delay to ensure data is rendered before hiding skeleton
      await new Promise((r) => setTimeout(r, 200));
      resolve();
    });
  }

  // Update shouldShowValidation to be more defensive
  shouldShowValidation(): boolean {
    // Don't show during loading
    if (this.isLoading()) {
      return false;
    }

    // Don't show if no data
    if (!this.hasFinancialData()) {
      return false;
    }

    // CRITICAL: Check edit mode AND active tab
    if (this.editingMode()) {
      return false;
    }

    // Don't show on notes or health score tabs
    const tab = this.activeTab();
    if (tab === 'notes' || tab === 'health-score') {
      return false;
    }

    // Only show when data is stable and user is viewing (not editing)
    return this.loadingState() === 'ready';
  }

  // Add method to check if validation should show for specific tab
  shouldShowBalanceSheetValidation(): boolean {
    return (
      this.shouldShowValidation() &&
      this.activeTab() === 'balance-sheet' &&
      this.balanceSheetData().length > 5
    );
  }

  shouldShowCashFlowValidation(): boolean {
    return (
      this.shouldShowValidation() &&
      this.activeTab() === 'cash-flow' &&
      this.cashFlowData().length > 5
    );
  }
}
