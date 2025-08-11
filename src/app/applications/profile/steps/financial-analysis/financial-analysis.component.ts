// // src/app/profile/steps/financial-analysis/financial-analysis.component.ts
// import { Component, signal, OnInit } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { UiCardComponent, UiButtonComponent } from '../../../../shared/components';
// import { LucideAngularModule, Upload, Download, FileSpreadsheet } from 'lucide-angular';
// import { FundingApplicationProfileService } from '../../../services/funding-profile.service';

// interface FinancialData {
//   incomeStatement: any[];
//   financialRatios: any[];
//   template?: File;
// }

// @Component({
//   selector: 'app-financial-analysis',
//   standalone: true,
//   imports: [FormsModule, UiCardComponent, UiButtonComponent, LucideAngularModule],
//   templateUrl: 'financial-analysis.component.html'
// })
// export class FinancialAnalysisComponent implements OnInit {
//   isSaving = signal(false);
//   uploadedTemplate = signal<File | null>(null);
//   notesText = '';

//   // Icons
//   UploadIcon = Upload;
//   DownloadIcon = Download;
//   FileSpreadsheetIcon = FileSpreadsheet;

//   constructor(private profileService: FundingApplicationProfileService) {}

//   ngOnInit() {
//     this.loadExistingData();
//   }

//   hasFinancialData(): boolean {
//     return !!this.uploadedTemplate() || this.incomeStatementData().length > 0;
//   }

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

//   private async processFile(file: File) {
//     // Validate file type
//     const allowedTypes = ['.xlsx', '.xls'];
//     const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
//     if (!allowedTypes.includes(fileExtension)) {
//       alert('Please upload only Excel files (.xlsx, .xls)');
//       return;
//     }

//     // Validate file size (10MB limit)
//     if (file.size > 10 * 1024 * 1024) {
//       alert('File size must be less than 10MB');
//       return;
//     }

//     this.isSaving.set(true);
    
//     // Simulate processing
//     await new Promise(resolve => setTimeout(resolve, 1000));
    
//     this.uploadedTemplate.set(file);
//     this.isSaving.set(false);
//     this.saveData();
//   }

//   removeTemplate() {
//     this.uploadedTemplate.set(null);
//     this.saveData();
//   }

//   downloadTemplate() {
//     // In a real app, this would download the actual template
//     const templateUrl = '/assets/templates/financial_analysis_template.xlsx';
//     const a = document.createElement('a');
//     a.href = templateUrl;
//     a.download = 'financial_analysis_template.xlsx';
//     a.click();
//   }

//   triggerFileUpload() {
//     const input = document.createElement('input');
//     input.type = 'file';
//     input.accept = '.xlsx,.xls';
//     input.onchange = (e) => this.onFileSelected(e);
//     input.click();
//   }

//   formatFileSize(bytes: number): string {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
//       return `${(value * 100).toFixed(1)}%`;
//     }
    
//     return value.toFixed(2);
//   }

//   incomeStatementData() {
//     return [
//       {
//         label: 'Revenue',
//         values: [5555515.16, 6210626.81, 6189967.14, 8119722.90, 9375145.83, 10265784.69, 11241034.23, 12488226.98, 13674608.55]
//       },
//       {
//         label: 'Cost of sales',
//         values: [-2639980.80, -3075502.40, -3003372.06, -3487583.38, -4120564.10, -4666004.46, -4929418.33, -5809523.19, -6461526.03]
//       },
//       {
//         label: 'Gross Profit',
//         values: [2915534.36, 3135124.42, 3186595.08, 4632139.52, 5254581.74, 5599780.23, 6311615.90, 6678703.79, 7213082.52]
//       },
//       {
//         label: 'Administrative expenses',
//         values: [0, 0, 0, 0, 0, 0, 0, 0, 0]
//       },
//       {
//         label: 'Other Operating Expenses (Excl depreciation & amortisation)',
//         values: [-1054934.91, -1037830.14, -1132436.08, -1259120.85, -1347259.31, -1441567.46, -1542477.18, -1650450.58, -1765982.12]
//       },
//       {
//         label: 'Salaries & Staff Cost',
//         values: [-1350632.18, -1272114.31, -1460489.10, -1585527.36, -1680659.00, -1781498.54, -1888388.45, -2001691.76, -2121793.27]
//       },
//       {
//         label: 'EBITDA',
//         values: [509967.27, 825179.97, 593669.90, 1787491.31, 2226663.43, 2376714.23, 2880750.27, 3026561.45, 3325307.13]
//       },
//       {
//         label: 'Interest Income',
//         values: [63888.42, 69318.94, 83182.73, 41591.36, 11744.63, 0, 11275.00, 42646.45, 0]
//       }
//     ];
//   }

//   financialRatiosData() {
//     return [
//       {
//         label: 'Return on Equity (ROE)',
//         values: [0.06, 0.11, 0.07, 0.12, 0.10, 0.12, 0.16, 0.14, 0.13],
//         type: 'ratio'
//       },
//       {
//         label: 'Debt Equity Ratio (Total liabilities)',
//         values: [0.69, 0.56, 0.43, 1.05, 0.80, 0.49, 0.29, 0.47, 0.34],
//         type: 'ratio'
//       },
//       {
//         label: 'Current Ratio',
//         values: [1.41, 1.61, 1.78, 0.97, 1.11, 1.13, 1.11, 1.29, 1.62],
//         type: 'ratio'
//       },
//       {
//         label: 'Acid Test Ratio (Quick Ratio)',
//         values: [1.41, 1.61, 1.78, 0.97, 1.11, 1.13, 1.11, 1.29, 1.62],
//         type: 'ratio'
//       },
//       {
//         label: 'Equity Investment Value',
//         values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
//         type: 'ratio'
//       },
//       {
//         label: 'Return on Investment (ROI)',
//         values: [6.2, 11.1, 7.5, 11.5, 10.0, 11.9, 16.1, 13.7, 13.4],
//         type: 'percentage'
//       },
//       {
//         label: 'Sales Growth',
//         values: [0.0, 11.8, -0.3, 31.2, 15.5, 9.5, 9.5, 11.1, 9.5],
//         type: 'percentage'
//       },
//       {
//         label: 'Gross profit margin',
//         values: [52.5, 50.5, 51.5, 57.0, 56.0, 54.5, 56.1, 53.5, 52.7],
//         type: 'percentage'
//       },
//       {
//         label: 'Cost to Income ratio',
//         values: [43.3, 37.2, 41.9, 35.0, 32.3, 31.4, 30.5, 29.2, 28.4],
//         type: 'percentage'
//       },
//       {
//         label: 'Operating margin (EBITDA)',
//         values: [9.2, 13.3, 9.6, 22.0, 23.8, 23.2, 25.6, 24.2, 24.3],
//         type: 'percentage'
//       },
//       {
//         label: 'Interest Cover Ratio',
//         values: [3.87, 7.94, 8.98, 5.85, 6.11, 8.35, 14.72, 10.06, 12.24],
//         type: 'ratio'
//       },
//       {
//         label: 'Net Operating Profit Margin',
//         values: [3.7, 6.7, 4.9, 6.5, 5.4, 6.7, 9.8, 8.7, 8.9],
//         type: 'percentage'
//       }
//     ];
//   }

//   async saveNotes() {
//     this.isSaving.set(true);
//     await new Promise(resolve => setTimeout(resolve, 300));
//     this.saveData();
//     this.isSaving.set(false);
//   }

//   private loadExistingData() {
//     // Load existing data from profile service
//     const existingData = this.profileService.data().financialAnalysis;
//     if (existingData) {
//       this.notesText = existingData['notes'] || '';
//       if (existingData['template']) {
//         this.uploadedTemplate.set(existingData['template']);
//       }
//     }
//   }

//   private async saveData() {
//     const financialAnalysisData = {
//       template: this.uploadedTemplate(),
//       notes: this.notesText,
//       incomeStatement: this.incomeStatementData(),
//       financialRatios: this.financialRatiosData(),
//       lastUpdated: new Date().toISOString()
//     };
    
//     // Update profile service
//     this.profileService.updateFinancialAnalysis?.(financialAnalysisData);
//   }
// }

// src/app/profile/steps/financial-analysis/financial-analysis.component.ts
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiCardComponent, UiButtonComponent } from '../../../../shared/components';
import { LucideAngularModule, Upload, Download, FileSpreadsheet, Save, Clock, Edit2 } from 'lucide-angular';
 
import { interval, Subscription, Subject } from 'rxjs';
import { debounceTime, takeWhile, takeUntil } from 'rxjs/operators';
import { FinancialProfile } from '../../../models/funding-application.models';
import { FundingApplicationService } from '../../../services/funding-application.service';

interface FinancialRowData {
  label: string;
  values: number[];
  editable?: boolean;
}

interface FinancialRatioData extends FinancialRowData {
  type: 'ratio' | 'percentage' | 'currency';
}

@Component({
  selector: 'app-financial-analysis',
  standalone: true,
  imports: [FormsModule, UiCardComponent, UiButtonComponent, LucideAngularModule],
  templateUrl: 'financial-analysis.component.html'
})
export class FinancialAnalysisComponent implements OnInit, OnDestroy {
  private fundingApplicationService = inject(FundingApplicationService);

  // State signals
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);
  uploadedTemplate = signal<File | null>(null);
  editingMode = signal(false);
  notesText = '';

  // Data signals
  incomeStatementData = signal<FinancialRowData[]>([]);
  financialRatiosData = signal<FinancialRatioData[]>([]);

  // Icons
  UploadIcon = Upload;
  DownloadIcon = Download;
  FileSpreadsheetIcon = FileSpreadsheet;
  SaveIcon = Save;
  ClockIcon = Clock;
  EditIcon = Edit2;

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
  // AUTO-SAVE SETUP
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

  // ===============================
  // DATA LOADING & SAVING
  // ===============================

  private loadExistingData() {
    const existingData = this.fundingApplicationService.data().financialProfile;
    if (existingData) {
      this.populateFromExistingData(existingData);
    } else {
      this.initializeDefaultData();
    }
  }

  private populateFromExistingData(data: FinancialProfile) {
    // Load notes
    this.notesText = data.historicalFinancials?.[0]?.toString() || ''; // Adapt as needed

    // Load financial projections if they exist
    if (data.projectedRevenue && data.projectedRevenue.length > 0) {
      this.loadFinancialDataFromProfile(data);
    } else {
      this.initializeDefaultData();
    }
  }

  private loadFinancialDataFromProfile(data: FinancialProfile) {
    // Transform FinancialProfile data to display format
    // This would be more complex in real implementation
    this.initializeDefaultData();
    this.triggerDataChange();
  }

  private initializeDefaultData() {
    // Initialize with empty data structure matching CSV format
    this.incomeStatementData.set([
      { label: 'Revenue', values: new Array(9).fill(0), editable: true },
      { label: 'Cost of sales', values: new Array(9).fill(0), editable: true },
      { label: 'Gross Profit', values: new Array(9).fill(0), editable: false }, // Calculated
      { label: 'Administrative expenses', values: new Array(9).fill(0), editable: true },
      { label: 'Other Operating Expenses (Excl depreciation & amortisation)', values: new Array(9).fill(0), editable: true },
      { label: 'Salaries & Staff Cost', values: new Array(9).fill(0), editable: true },
      { label: 'EBITDA', values: new Array(9).fill(0), editable: false }, // Calculated
      { label: 'Interest Income', values: new Array(9).fill(0), editable: true },
      { label: 'Finances Cost', values: new Array(9).fill(0), editable: true },
      { label: 'Depreciation & Amortisation', values: new Array(9).fill(0), editable: true },
      { label: 'Profit before tax', values: new Array(9).fill(0), editable: false } // Calculated
    ]);

    this.financialRatiosData.set([
      { label: 'Return on Equity (ROE)', values: new Array(9).fill(0), type: 'ratio', editable: false },
      { label: 'Debt Equity Ratio (Total liabilities)', values: new Array(9).fill(0), type: 'ratio', editable: false },
      { label: 'Current Ratio', values: new Array(9).fill(0), type: 'ratio', editable: true },
      { label: 'Acid Test Ratio (Quick Ratio)', values: new Array(9).fill(0), type: 'ratio', editable: true },
      { label: 'Equity Investment Value', values: new Array(9).fill(0), type: 'currency', editable: true },
      { label: 'Return on Investment (ROI)', values: new Array(9).fill(0), type: 'percentage', editable: false },
      { label: 'Sales Growth', values: new Array(9).fill(0), type: 'percentage', editable: false },
      { label: 'Gross profit margin', values: new Array(9).fill(0), type: 'percentage', editable: false },
      { label: 'Cost to Income ratio', values: new Array(9).fill(0), type: 'percentage', editable: false },
      { label: 'Operating margin (EBITDA)', values: new Array(9).fill(0), type: 'percentage', editable: false },
      { label: 'Interest Cover Ratio', values: new Array(9).fill(0), type: 'ratio', editable: false },
      { label: 'Net Operating Profit Margin', values: new Array(9).fill(0), type: 'percentage', editable: false }
    ]);
  }

  private async saveData(isManual: boolean = false) {
    if (this.isSaving()) return;

    this.isSaving.set(true);

    try {
      const financialProfileData = this.buildFinancialProfileData();
      this.fundingApplicationService.updateFinancialProfile(financialProfileData);

      if (isManual) {
        await this.fundingApplicationService.saveCurrentProgress();
      }

      this.lastSaved.set(new Date());
    } catch (error) {
      console.error('Failed to save financial analysis:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private buildFinancialProfileData(): FinancialProfile {
    const currentYear = new Date().getFullYear();
    
    // Extract revenue data for projections
    const revenueRow = this.incomeStatementData().find(row => row.label === 'Revenue');
    const profitRow = this.incomeStatementData().find(row => row.label === 'Profit before tax');

    return {
      // Historical data (first 4 years)
      historicalFinancials: [
        {
          year: currentYear - 3,
          revenue: revenueRow?.values[0] || 0,
          grossProfit: this.incomeStatementData().find(row => row.label === 'Gross Profit')?.values[0] || 0,
          netProfit: profitRow?.values[0] || 0,
          assets: 0, // Would need additional data
          liabilities: 0, // Would need additional data
          cashFlow: this.incomeStatementData().find(row => row.label === 'EBITDA')?.values[0] || 0
        },
        {
          year: currentYear - 2,
          revenue: revenueRow?.values[1] || 0,
          grossProfit: this.incomeStatementData().find(row => row.label === 'Gross Profit')?.values[1] || 0,
          netProfit: profitRow?.values[1] || 0,
          assets: 0,
          liabilities: 0,
          cashFlow: this.incomeStatementData().find(row => row.label === 'EBITDA')?.values[1] || 0
        },
        {
          year: currentYear - 1,
          revenue: revenueRow?.values[2] || 0,
          grossProfit: this.incomeStatementData().find(row => row.label === 'Gross Profit')?.values[2] || 0,
          netProfit: profitRow?.values[2] || 0,
          assets: 0,
          liabilities: 0,
          cashFlow: this.incomeStatementData().find(row => row.label === 'EBITDA')?.values[2] || 0
        }
      ],

      // Current financial position
      currentAssets: 0, // Would need balance sheet data
      currentLiabilities: 0,
      netWorth: 0,
      monthlyRevenue: (revenueRow?.values[3] || 0) / 12,
      monthlyCosts: (this.incomeStatementData().find(row => row.label === 'Cost of sales')?.values[3] || 0) / 12,
      cashFlow: this.incomeStatementData().find(row => row.label === 'EBITDA')?.values[3] || 0,

      // Financial projections (remaining years)
      projectedRevenue: [
        {
          year: currentYear + 1,
          optimistic: (revenueRow?.values[4] || 0) * 1.1,
          realistic: revenueRow?.values[4] || 0,
          pessimistic: (revenueRow?.values[4] || 0) * 0.9,
          assumptions: 'Based on historical growth trends'
        },
        {
          year: currentYear + 2,
          optimistic: (revenueRow?.values[5] || 0) * 1.1,
          realistic: revenueRow?.values[5] || 0,
          pessimistic: (revenueRow?.values[5] || 0) * 0.9,
          assumptions: 'Market expansion and product development'
        }
      ],

      projectedProfitability: [
        {
          year: currentYear + 1,
          optimistic: (profitRow?.values[4] || 0) * 1.15,
          realistic: profitRow?.values[4] || 0,
          pessimistic: (profitRow?.values[4] || 0) * 0.85,
          assumptions: 'Operational efficiency improvements'
        }
      ],

      cashFlowProjections: [
        {
          month: 1,
          year: currentYear + 1,
          inflow: (revenueRow?.values[4] || 0) / 12,
          outflow: (this.incomeStatementData().find(row => row.label === 'Cost of sales')?.values[4] || 0) / 12,
          netCashFlow: 0,
          cumulativeCashFlow: 0
        }
      ],

      // Financial ratios
      profitMargin: this.calculateProfitMargin(),
      debtToEquity: this.getFinancialRatio('Debt Equity Ratio (Total liabilities)', 3),
      currentRatio: this.getFinancialRatio('Current Ratio', 3),
      returnOnAssets: this.getFinancialRatio('Return on Investment (ROI)', 3) / 100,

      // Banking information would be collected elsewhere
      primaryBank: '',
      bankingHistory: 0,
      creditFacilities: [],
      creditRating: undefined
    };
  }

  private calculateProfitMargin(): number {
    const revenue = this.incomeStatementData().find(row => row.label === 'Revenue')?.values[3] || 0;
    const profit = this.incomeStatementData().find(row => row.label === 'Profit before tax')?.values[3] || 0;
    return revenue > 0 ? (profit / revenue) * 100 : 0;
  }

  private getFinancialRatio(ratioName: string, yearIndex: number): number {
    return this.financialRatiosData().find(row => row.label === ratioName)?.values[yearIndex] || 0;
  }

  // ===============================
  // FILE HANDLING
  // ===============================

  hasFinancialData(): boolean {
    return !!this.uploadedTemplate() || 
           this.incomeStatementData().some(row => row.values.some(val => val !== 0));
  }

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

  private async processFile(file: File) {
    // Validate file type
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert('Please upload only Excel files (.xlsx, .xls) or CSV files');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    this.isSaving.set(true);
    
    try {
      // In a real implementation, you would parse the Excel/CSV file here
      // For now, we'll load sample data
      await this.parseFinancialFile(file);
      
      this.uploadedTemplate.set(file);
      this.triggerDataChange();
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please check the format and try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  private async parseFinancialFile(file: File): Promise<void> {
    // Simulate file parsing with sample data from your CSV
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Load sample data that matches your CSV structure
    this.incomeStatementData.set([
      { label: 'Revenue', values: [5555515.16, 6210626.81, 6189967.14, 8119722.90, 9375145.83, 10265784.69, 11241034.23, 12488226.98, 13674608.55], editable: true },
      { label: 'Cost of sales', values: [-2639980.80, -3075502.40, -3003372.06, -3487583.38, -4120564.10, -4666004.46, -4929418.33, -5809523.19, -6461526.03], editable: true },
      { label: 'Gross Profit', values: [2915534.36, 3135124.42, 3186595.08, 4632139.52, 5254581.74, 5599780.23, 6311615.90, 6678703.79, 7213082.52], editable: false },
      { label: 'Administrative expenses', values: [0, 0, 0, 0, 0, 0, 0, 0, 0], editable: true },
      { label: 'Other Operating Expenses (Excl depreciation & amortisation)', values: [-1054934.91, -1037830.14, -1132436.08, -1259120.85, -1347259.31, -1441567.46, -1542477.18, -1650450.58, -1765982.12], editable: true },
      { label: 'Salaries & Staff Cost', values: [-1350632.18, -1272114.31, -1460489.10, -1585527.36, -1680659.00, -1781498.54, -1888388.45, -2001691.76, -2121793.27], editable: true },
      { label: 'EBITDA', values: [509967.27, 825179.97, 593669.90, 1787491.31, 2226663.43, 2376714.23, 2880750.27, 3026561.45, 3325307.13], editable: false },
      { label: 'Interest Income', values: [63888.42, 69318.94, 83182.73, 41591.36, 11744.63, 0, 11275.00, 42646.45, 0], editable: true }
    ]);

    this.financialRatiosData.set([
      { label: 'Return on Equity (ROE)', values: [0.06, 0.11, 0.07, 0.12, 0.10, 0.12, 0.16, 0.14, 0.13], type: 'ratio', editable: false },
      { label: 'Debt Equity Ratio (Total liabilities)', values: [0.69, 0.56, 0.43, 1.05, 0.80, 0.49, 0.29, 0.47, 0.34], type: 'ratio', editable: false },
      { label: 'Current Ratio', values: [1.41, 1.61, 1.78, 0.97, 1.11, 1.13, 1.11, 1.29, 1.62], type: 'ratio', editable: true },
      { label: 'Acid Test Ratio (Quick Ratio)', values: [1.41, 1.61, 1.78, 0.97, 1.11, 1.13, 1.11, 1.29, 1.62], type: 'ratio', editable: true },
      { label: 'Equity Investment Value', values: [0, 0, 0, 0, 0, 0, 0, 0, 0], type: 'currency', editable: true },
      { label: 'Return on Investment (ROI)', values: [6.2, 11.1, 7.5, 11.5, 10.0, 11.9, 16.1, 13.7, 13.4], type: 'percentage', editable: false },
      { label: 'Sales Growth', values: [0.0, 11.8, -0.3, 31.2, 15.5, 9.5, 9.5, 11.1, 9.5], type: 'percentage', editable: false },
      { label: 'Gross profit margin', values: [52.5, 50.5, 51.5, 57.0, 56.0, 54.5, 56.1, 53.5, 52.7], type: 'percentage', editable: false },
      { label: 'Cost to Income ratio', values: [43.3, 37.2, 41.9, 35.0, 32.3, 31.4, 30.5, 29.2, 28.4], type: 'percentage', editable: false },
      { label: 'Operating margin (EBITDA)', values: [9.2, 13.3, 9.6, 22.0, 23.8, 23.2, 25.6, 24.2, 24.3], type: 'percentage', editable: false },
      { label: 'Interest Cover Ratio', values: [3.87, 7.94, 8.98, 5.85, 6.11, 8.35, 14.72, 10.06, 12.24], type: 'ratio', editable: false },
      { label: 'Net Operating Profit Margin', values: [3.7, 6.7, 4.9, 6.5, 5.4, 6.7, 9.8, 8.7, 8.9], type: 'percentage', editable: false }
    ]);
  }

  removeTemplate() {
    this.uploadedTemplate.set(null);
    this.initializeDefaultData();
    this.triggerDataChange();
  }

  downloadTemplate() {
    const templateUrl = '/assets/templates/financial_analysis_template.xlsx';
    const a = document.createElement('a');
    a.href = templateUrl;
    a.download = 'financial_analysis_template.xlsx';
    a.click();
  }

  triggerFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = (e) => this.onFileSelected(e);
    input.click();
  }

  // ===============================
  // EDITING FUNCTIONALITY
  // ===============================

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
        this.recalculateFields(newData);
        return newData;
      });
    }
    
    this.triggerDataChange();
  }

  private recalculateFields(data: FinancialRowData[]) {
    // Recalculate Gross Profit = Revenue - Cost of sales
    const revenueRow = data.find(row => row.label === 'Revenue');
    const costRow = data.find(row => row.label === 'Cost of sales');
    const grossProfitRow = data.find(row => row.label === 'Gross Profit');
    
    if (revenueRow && costRow && grossProfitRow) {
      grossProfitRow.values = revenueRow.values.map((revenue, i) => revenue + costRow.values[i]); // Cost is negative
    }

    // Recalculate EBITDA
    const adminRow = data.find(row => row.label === 'Administrative expenses');
    const opExpRow = data.find(row => row.label === 'Other Operating Expenses (Excl depreciation & amortisation)');
    const salariesRow = data.find(row => row.label === 'Salaries & Staff Cost');
    const ebitdaRow = data.find(row => row.label === 'EBITDA');
    
    if (grossProfitRow && adminRow && opExpRow && salariesRow && ebitdaRow) {
      ebitdaRow.values = grossProfitRow.values.map((grossProfit, i) => 
        grossProfit + adminRow.values[i] + opExpRow.values[i] + salariesRow.values[i]
      );
    }
  }

  // ===============================
  // FORMATTING HELPERS
  // ===============================

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    
    return value.toFixed(2);
  }

  async saveNotes() {
    this.triggerDataChange();
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
}