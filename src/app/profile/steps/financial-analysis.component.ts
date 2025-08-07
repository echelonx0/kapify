// src/app/profile/steps/financial-analysis.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiCardComponent, UiButtonComponent } from '../../shared/components';
import { LucideAngularModule, Upload, Download, FileSpreadsheet } from 'lucide-angular';
import { ProfileService } from '../profile.service';

interface FinancialData {
  incomeStatement: any[];
  financialRatios: any[];
  template?: File;
}

@Component({
  selector: 'app-financial-analysis',
  standalone: true,
  imports: [FormsModule, UiCardComponent, UiButtonComponent, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h2 class="text-xl font-semibold text-neutral-900">Financial Analysis</h2>
        <p class="text-neutral-600 mt-1">
          The purpose of this to perform a financial analysis on the business using the most common financial ratios. 
          It is important to understand these ratios as they tell a story about the financial health of the business.
        </p>
      </div>

      <!-- Template Upload Section -->
      <div class="bg-primary-50 border border-primary-200 rounded-lg p-6">
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <lucide-icon [img]="FileSpreadsheetIcon" [size]="16" class="text-primary-600" />
            </div>
          </div>
          <div class="flex-1">
            <h3 class="text-sm font-medium text-primary-800 mb-2">Import data with spreadsheet file</h3>
            <p class="text-sm text-primary-700 mb-4">
              Use <button class="underline hover:no-underline font-medium" (click)="downloadTemplate()">this template</button> 
              with predefined columns and rows to fill in the dataset for the financial ratios below.
            </p>
            
            @if (uploadedTemplate()) {
              <div class="bg-white rounded-lg p-4 border border-primary-200">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <lucide-icon [img]="FileSpreadsheetIcon" [size]="20" class="text-green-600" />
                    <div>
                      <div class="text-sm font-medium text-neutral-900">{{ uploadedTemplate()?.name }}</div>
                      <div class="text-xs text-neutral-500">{{ formatFileSize(uploadedTemplate()?.size || 0) }}</div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button
                      (click)="downloadTemplate()"
                      class="text-primary-600 hover:text-primary-700 p-1"
                      title="Download"
                    >
                      <lucide-icon [img]="DownloadIcon" [size]="16" />
                    </button>
                    <button
                      (click)="removeTemplate()"
                      class="text-red-600 hover:text-red-700 p-1"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            } @else {
              <div class="relative">
                <div 
                  class="border-2 border-dashed border-primary-300 rounded-lg p-6 text-center hover:border-primary-400 hover:bg-primary-50 transition-all cursor-pointer"
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event)"
                >
                  <lucide-icon [img]="UploadIcon" [size]="32" class="text-primary-400 mx-auto mb-3" />
                  <p class="text-sm text-primary-700 mb-1">Click to upload or drag and drop</p>
                  <p class="text-xs text-primary-600">Excel files (.xlsx, .xls) up to 10MB</p>
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  (change)="onFileSelected($event)"
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Financial Tables -->
      @if (hasFinancialData()) {
        <!-- Income Statement -->
        <ui-card [padding]="false">
          <div class="px-6 py-4 border-b border-neutral-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-neutral-900">Income Statement</h3>
              <span class="text-sm text-neutral-500">Financial Analysis</span>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-neutral-200">
              <thead class="bg-neutral-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Amounts in Rand</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase" colspan="3">Actuals (History)</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Current</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase" colspan="4">Budget (Projections)</th>
                </tr>
                <tr class="bg-neutral-50 border-t border-neutral-200">
                  <th class="px-6 py-2 text-left text-xs font-medium text-neutral-500">Financial Year</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2020/21</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2021/22</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2022/23</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2023/24</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2024/25</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2025/26</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2026/27</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2027/28</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2028/29</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-neutral-200">
                @for (row of incomeStatementData(); track row.label) {
                  <tr class="hover:bg-neutral-50">
                    <td class="px-6 py-3 text-sm font-medium text-neutral-900">{{ row.label }}</td>
                    @for (value of row.values; track $index) {
                      <td class="px-6 py-3 text-sm text-neutral-900 text-right">{{ formatCurrency(value) }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </ui-card>

        <!-- Financial Ratios -->
        <ui-card [padding]="false">
          <div class="px-6 py-4 border-b border-neutral-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-neutral-900">Financial Ratios</h3>
              <span class="text-sm text-neutral-500">Financial Analysis</span>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-neutral-200">
              <thead class="bg-neutral-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Financial Ratios</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase" colspan="3">Actuals (History)</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase">Current</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase" colspan="4">Budget (Projections)</th>
                </tr>
                <tr class="bg-neutral-50 border-t border-neutral-200">
                  <th class="px-6 py-2 text-left text-xs font-medium text-neutral-500"></th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2020/21</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2021/22</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2022/23</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2023/24</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2024/25</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2025/26</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2026/27</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2027/28</th>
                  <th class="px-6 py-2 text-center text-xs font-medium text-neutral-500">2028/29</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-neutral-200">
                @for (row of financialRatiosData(); track row.label) {
                  <tr class="hover:bg-neutral-50">
                    <td class="px-6 py-3 text-sm font-medium text-neutral-900">{{ row.label }}</td>
                    @for (value of row.values; track $index) {
                      <td class="px-6 py-3 text-sm text-neutral-900 text-right">{{ formatRatio(value, row.type) }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </ui-card>

        <!-- Notes Section -->
        <ui-card>
          <h3 class="text-lg font-semibold text-neutral-900 mb-4">Notes/Comments</h3>
          <div>
            <textarea
              [(ngModel)]="notesText"
              (ngModelChange)="saveNotes()"
              placeholder="Add any notes or comments about the financial analysis..."
              rows="4"
              class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            ></textarea>
          </div>
        </ui-card>
      } @else {
        <!-- Empty State -->
        <div class="text-center py-12">
          <lucide-icon [img]="FileSpreadsheetIcon" [size]="48" class="text-neutral-400 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-neutral-900 mb-2">No Financial Data</h3>
          <p class="text-neutral-600 mb-6">Upload a financial template to begin your analysis</p>
          <ui-button variant="primary" (clicked)="triggerFileUpload()">
            <lucide-icon [img]="UploadIcon" [size]="16" class="mr-2" />
            Upload Financial Data
          </ui-button>
        </div>
      }

      <!-- Auto-save indicator -->
      @if (isSaving()) {
        <div class="text-sm text-neutral-500 flex items-center justify-center">
          <div class="w-2 h-2 bg-primary-500 rounded-full animate-pulse mr-2"></div>
          Saving changes...
        </div>
      }
    </div>
  `
})
export class FinancialAnalysisComponent implements OnInit {
  isSaving = signal(false);
  uploadedTemplate = signal<File | null>(null);
  notesText = '';

  // Icons
  UploadIcon = Upload;
  DownloadIcon = Download;
  FileSpreadsheetIcon = FileSpreadsheet;

  constructor(private profileService: ProfileService) {}

  ngOnInit() {
    this.loadExistingData();
  }

  hasFinancialData(): boolean {
    return !!this.uploadedTemplate() || this.incomeStatementData().length > 0;
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
    const allowedTypes = ['.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert('Please upload only Excel files (.xlsx, .xls)');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    this.isSaving.set(true);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.uploadedTemplate.set(file);
    this.isSaving.set(false);
    this.saveData();
  }

  removeTemplate() {
    this.uploadedTemplate.set(null);
    this.saveData();
  }

  downloadTemplate() {
    // In a real app, this would download the actual template
    const templateUrl = '/assets/templates/financial_analysis_template.xlsx';
    const a = document.createElement('a');
    a.href = templateUrl;
    a.download = 'financial_analysis_template.xlsx';
    a.click();
  }

  triggerFileUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e) => this.onFileSelected(e);
    input.click();
  }

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
      return `${(value * 100).toFixed(1)}%`;
    }
    
    return value.toFixed(2);
  }

  incomeStatementData() {
    return [
      {
        label: 'Revenue',
        values: [5555515.16, 6210626.81, 6189967.14, 8119722.90, 9375145.83, 10265784.69, 11241034.23, 12488226.98, 13674608.55]
      },
      {
        label: 'Cost of sales',
        values: [-2639980.80, -3075502.40, -3003372.06, -3487583.38, -4120564.10, -4666004.46, -4929418.33, -5809523.19, -6461526.03]
      },
      {
        label: 'Gross Profit',
        values: [2915534.36, 3135124.42, 3186595.08, 4632139.52, 5254581.74, 5599780.23, 6311615.90, 6678703.79, 7213082.52]
      },
      {
        label: 'Administrative expenses',
        values: [0, 0, 0, 0, 0, 0, 0, 0, 0]
      },
      {
        label: 'Other Operating Expenses (Excl depreciation & amortisation)',
        values: [-1054934.91, -1037830.14, -1132436.08, -1259120.85, -1347259.31, -1441567.46, -1542477.18, -1650450.58, -1765982.12]
      },
      {
        label: 'Salaries & Staff Cost',
        values: [-1350632.18, -1272114.31, -1460489.10, -1585527.36, -1680659.00, -1781498.54, -1888388.45, -2001691.76, -2121793.27]
      },
      {
        label: 'EBITDA',
        values: [509967.27, 825179.97, 593669.90, 1787491.31, 2226663.43, 2376714.23, 2880750.27, 3026561.45, 3325307.13]
      },
      {
        label: 'Interest Income',
        values: [63888.42, 69318.94, 83182.73, 41591.36, 11744.63, 0, 11275.00, 42646.45, 0]
      }
    ];
  }

  financialRatiosData() {
    return [
      {
        label: 'Return on Equity (ROE)',
        values: [0.06, 0.11, 0.07, 0.12, 0.10, 0.12, 0.16, 0.14, 0.13],
        type: 'ratio'
      },
      {
        label: 'Debt Equity Ratio (Total liabilities)',
        values: [0.69, 0.56, 0.43, 1.05, 0.80, 0.49, 0.29, 0.47, 0.34],
        type: 'ratio'
      },
      {
        label: 'Current Ratio',
        values: [1.41, 1.61, 1.78, 0.97, 1.11, 1.13, 1.11, 1.29, 1.62],
        type: 'ratio'
      },
      {
        label: 'Acid Test Ratio (Quick Ratio)',
        values: [1.41, 1.61, 1.78, 0.97, 1.11, 1.13, 1.11, 1.29, 1.62],
        type: 'ratio'
      },
      {
        label: 'Equity Investment Value',
        values: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        type: 'ratio'
      },
      {
        label: 'Return on Investment (ROI)',
        values: [6.2, 11.1, 7.5, 11.5, 10.0, 11.9, 16.1, 13.7, 13.4],
        type: 'percentage'
      },
      {
        label: 'Sales Growth',
        values: [0.0, 11.8, -0.3, 31.2, 15.5, 9.5, 9.5, 11.1, 9.5],
        type: 'percentage'
      },
      {
        label: 'Gross profit margin',
        values: [52.5, 50.5, 51.5, 57.0, 56.0, 54.5, 56.1, 53.5, 52.7],
        type: 'percentage'
      },
      {
        label: 'Cost to Income ratio',
        values: [43.3, 37.2, 41.9, 35.0, 32.3, 31.4, 30.5, 29.2, 28.4],
        type: 'percentage'
      },
      {
        label: 'Operating margin (EBITDA)',
        values: [9.2, 13.3, 9.6, 22.0, 23.8, 23.2, 25.6, 24.2, 24.3],
        type: 'percentage'
      },
      {
        label: 'Interest Cover Ratio',
        values: [3.87, 7.94, 8.98, 5.85, 6.11, 8.35, 14.72, 10.06, 12.24],
        type: 'ratio'
      },
      {
        label: 'Net Operating Profit Margin',
        values: [3.7, 6.7, 4.9, 6.5, 5.4, 6.7, 9.8, 8.7, 8.9],
        type: 'percentage'
      }
    ];
  }

  async saveNotes() {
    this.isSaving.set(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    this.saveData();
    this.isSaving.set(false);
  }

  private loadExistingData() {
    // Load existing data from profile service
    const existingData = this.profileService.data().financialAnalysis;
    if (existingData) {
      this.notesText = existingData.notes || '';
      if (existingData.template) {
        this.uploadedTemplate.set(existingData.template);
      }
    }
  }

  private async saveData() {
    const financialAnalysisData = {
      template: this.uploadedTemplate(),
      notes: this.notesText,
      incomeStatement: this.incomeStatementData(),
      financialRatios: this.financialRatiosData(),
      lastUpdated: new Date().toISOString()
    };
    
    // Update profile service
    this.profileService.updateFinancialAnalysis?.(financialAnalysisData);
  }
}