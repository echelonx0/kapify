import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X,
  Download,
  Loader2,
  Check,
  BarChart3,
  Filter,
  RefreshCw,
  ChevronDown,
} from 'lucide-angular';
import { GenericExportService } from 'src/app/core/services/kapify-export.service';
import { ExportColumn } from 'src/app/core/models/export-options.interface';

/**
 * KapifyReports - Complete field mapping
 * All fields that can appear in exported reports
 */
interface KapifyReports {
  // Company Details Section
  no: number;
  nameOfBusiness: string;
  industry: string;
  physicalAddress: string;
  businessDetails: string;
  businessStage:
    | 'Pre-Launch'
    | 'Startup'
    | 'Early Growth'
    | 'Growth'
    | 'Mature'
    | 'Expansion';
  yearsInOperation: number;
  numberOfEmployees: number;
  bbbeeLeve:
    | 'Level 1'
    | 'Level 2'
    | 'Level 3'
    | 'Level 4'
    | 'Level 5'
    | 'Level 6'
    | 'Level 7'
    | 'Level 8'
    | 'Non-Compliant';
  province: string;
  priorYearAnnualRevenue: number;

  // Contact Person Details Section
  firstName: string;
  surname: string;
  email: string;
  phoneNumber: string;
  role: string;

  // Funding Details Section
  amountRequested: number;
  fundingType: 'Equity' | 'Debt' | 'Grant' | 'Hybrid';
  fundingOpportunity: string;
  useOfFunds: string;
  applicationStatus:
    | 'Draft'
    | 'Submitted'
    | 'Review'
    | 'Under Review'
    | 'Approved'
    | 'Rejected'
    | 'Withdrawn';

  // System Fields
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Field metadata for report builder
 */
export interface ReportField {
  key: keyof KapifyReports;
  label: string;
  category: 'company' | 'contact' | 'funding' | 'system';
  width?: number;
}

/**
 * Application report record (minimal fields needed)
 */
export interface ApplicationReportRecord {
  id: string;
  no: number;
  nameOfBusiness: string;
  industry: string;
  businessStage: string;
  yearsInOperation: number;
  numberOfEmployees: number;
  province: string;
  priorYearAnnualRevenue: number;
  firstName: string;
  surname: string;
  email: string;
  phoneNumber: string;
  amountRequested: number;
  fundingType: string;
  applicationStatus: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

export interface ReportBuilderData {
  allRecords: ApplicationReportRecord[];
}

export interface ReportExportEvent {
  data: ApplicationReportRecord[];
  format: 'excel' | 'pdf' | 'csv';
  title: string;
  selectedFields: (keyof KapifyReports)[];
  dateRange: { start?: string; end?: string };
}

export interface ReportFilters {
  dateRange: { start?: string; end?: string };
}

@Component({
  selector: 'app-report-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `<!-- Backdrop -->
    @if (isOpen()) {
    <div
      (click)="close()"
      class="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 transition-opacity duration-300"
    ></div>
    }

    <!-- Modal -->
    @if (isOpen()) {
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto transition-all duration-300"
    >
      <div
        (click)="$event.stopPropagation()"
        class="bg-white rounded-2xl border border-slate-200 w-full max-w-5xl my-8 overflow-hidden"
      >
        <!-- Header -->
        <div
          class="sticky top-0 z-10 px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-teal-50 via-white to-slate-50 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div>
              <h2 class="text-2xl font-bold text-slate-900">Export report</h2>
              <p class="text-sm text-slate-600 mt-0.5">
                Select date range and fields to export application data
              </p>
            </div>
          </div>
          <button
            (click)="close()"
            [disabled]="exporting()"
            class="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            <lucide-angular [img]="CloseIcon" size="24"></lucide-angular>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="max-h-[calc(100vh-240px)] overflow-y-auto">
          <div class="px-8 py-6 space-y-8">
            <!-- Date Range Section -->
            <div class="space-y-4 pb-6 border-b border-slate-200">
              <div class="flex items-center gap-2">
                <lucide-angular
                  [img]="FilterIcon"
                  size="20"
                  class="text-slate-600"
                ></lucide-angular>
                <h3 class="text-lg font-bold text-slate-900">Date Range</h3>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    class="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    From Date
                  </label>
                  <input
                    type="date"
                    [(ngModel)]="filters.dateRange.start"
                    class="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label
                    class="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    To Date
                  </label>
                  <input
                    type="date"
                    [(ngModel)]="filters.dateRange.end"
                    class="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <!-- Field Selection Sections -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-bold text-slate-900">
                  Select Fields to Export
                </h3>
                <button
                  (click)="clearAllFields()"
                  class="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors flex items-center gap-1"
                >
                  <lucide-angular
                    [img]="RefreshIcon"
                    size="16"
                  ></lucide-angular>
                  Deselect All
                </button>
              </div>

              <!-- Company Details Section -->
              <div class="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  (click)="toggleSection('company')"
                  class="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors duration-200"
                >
                  <div class="flex items-center gap-3">
                    <h4 class="text-sm font-semibold text-slate-900">
                      Company Details
                    </h4>
                    <span
                      class="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 font-semibold"
                    >
                      {{ companyFieldsSelected() }}/{{ companyFields().length }}
                    </span>
                  </div>
                  <lucide-angular
                    [img]="ChevronIcon"
                    size="18"
                    class="text-slate-600 transition-transform duration-200"
                    [class.rotate-180]="isSectionOpen('company')"
                  ></lucide-angular>
                </button>

                @if (isSectionOpen('company')) {
                <div
                  class="px-6 py-4 space-y-3 border-t border-slate-200 bg-white"
                >
                  @for (field of companyFields(); track field.key) {
                  <label
                    class="flex items-center gap-3 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                    [class.bg-teal-50]="isFieldSelected(field.key)"
                    [class.border-teal-300]="isFieldSelected(field.key)"
                  >
                    <input
                      type="checkbox"
                      [checked]="isFieldSelected(field.key)"
                      (change)="toggleField(field.key)"
                      class="w-4 h-4 text-teal-500 rounded cursor-pointer"
                    />
                    <span class="text-sm font-medium text-slate-700 flex-1">
                      {{ field.label }}
                    </span>
                  </label>
                  }
                </div>
                }
              </div>

              <!-- Contact Person Details Section -->
              <div class="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  (click)="toggleSection('contact')"
                  class="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors duration-200"
                >
                  <div class="flex items-center gap-3">
                    <h4 class="text-sm font-semibold text-slate-900">
                      Contact Person Details
                    </h4>
                    <span
                      class="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 font-semibold"
                    >
                      {{ contactFieldsSelected() }}/{{ contactFields().length }}
                    </span>
                  </div>
                  <lucide-angular
                    [img]="ChevronIcon"
                    size="18"
                    class="text-slate-600 transition-transform duration-200"
                    [class.rotate-180]="isSectionOpen('contact')"
                  ></lucide-angular>
                </button>

                @if (isSectionOpen('contact')) {
                <div
                  class="px-6 py-4 space-y-3 border-t border-slate-200 bg-white"
                >
                  @for (field of contactFields(); track field.key) {
                  <label
                    class="flex items-center gap-3 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                    [class.bg-teal-50]="isFieldSelected(field.key)"
                    [class.border-teal-300]="isFieldSelected(field.key)"
                  >
                    <input
                      type="checkbox"
                      [checked]="isFieldSelected(field.key)"
                      (change)="toggleField(field.key)"
                      class="w-4 h-4 text-teal-500 rounded cursor-pointer"
                    />
                    <span class="text-sm font-medium text-slate-700 flex-1">
                      {{ field.label }}
                    </span>
                  </label>
                  }
                </div>
                }
              </div>

              <!-- Funding Details Section -->
              <div class="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  (click)="toggleSection('funding')"
                  class="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors duration-200"
                >
                  <div class="flex items-center gap-3">
                    <h4 class="text-sm font-semibold text-slate-900">
                      Funding Details
                    </h4>
                    <span
                      class="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 font-semibold"
                    >
                      {{ fundingFieldsSelected() }}/{{ fundingFields().length }}
                    </span>
                  </div>
                  <lucide-angular
                    [img]="ChevronIcon"
                    size="18"
                    class="text-slate-600 transition-transform duration-200"
                    [class.rotate-180]="isSectionOpen('funding')"
                  ></lucide-angular>
                </button>

                @if (isSectionOpen('funding')) {
                <div
                  class="px-6 py-4 space-y-3 border-t border-slate-200 bg-white"
                >
                  @for (field of fundingFields(); track field.key) {
                  <label
                    class="flex items-center gap-3 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                    [class.bg-teal-50]="isFieldSelected(field.key)"
                    [class.border-teal-300]="isFieldSelected(field.key)"
                  >
                    <input
                      type="checkbox"
                      [checked]="isFieldSelected(field.key)"
                      (change)="toggleField(field.key)"
                      class="w-4 h-4 text-teal-500 rounded cursor-pointer"
                    />
                    <span class="text-sm font-medium text-slate-700 flex-1">
                      {{ field.label }}
                    </span>
                  </label>
                  }
                </div>
                }
              </div>

              <!-- System Fields Section -->
              <div class="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  (click)="toggleSection('system')"
                  class="w-full px-6 py-4 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors duration-200"
                >
                  <div class="flex items-center gap-3">
                    <h4 class="text-sm font-semibold text-slate-900">
                      System Fields
                    </h4>
                    <span
                      class="text-xs px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 font-semibold"
                    >
                      {{ systemFieldsSelected() }}/{{ systemFields().length }}
                    </span>
                  </div>
                  <lucide-angular
                    [img]="ChevronIcon"
                    size="18"
                    class="text-slate-600 transition-transform duration-200"
                    [class.rotate-180]="isSectionOpen('system')"
                  ></lucide-angular>
                </button>

                @if (isSectionOpen('system')) {
                <div
                  class="px-6 py-4 space-y-3 border-t border-slate-200 bg-white"
                >
                  @for (field of systemFields(); track field.key) {
                  <label
                    class="flex items-center gap-3 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                    [class.bg-teal-50]="isFieldSelected(field.key)"
                    [class.border-teal-300]="isFieldSelected(field.key)"
                  >
                    <input
                      type="checkbox"
                      [checked]="isFieldSelected(field.key)"
                      (change)="toggleField(field.key)"
                      class="w-4 h-4 text-teal-500 rounded cursor-pointer"
                    />
                    <span class="text-sm font-medium text-slate-700 flex-1">
                      {{ field.label }}
                    </span>
                  </label>
                  }
                </div>
                }
              </div>
            </div>

            <!-- Report Configuration -->
            <div class="space-y-6 pt-6 border-t border-slate-200">
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  Report Title
                </label>
                <input
                  type="text"
                  [(ngModel)]="reportTitle"
                  placeholder="e.g., Q4 2024 Applications Report"
                  class="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  Export Format
                </label>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <!-- Excel Format -->
                  <label
                    class="flex items-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all duration-200"
                    [class.border-teal-300]="selectedFormat() === 'excel'"
                    [class.bg-teal-50]="selectedFormat() === 'excel'"
                  >
                    <input
                      type="radio"
                      [(ngModel)]="selectedFormat"
                      value="excel"
                      class="w-4 h-4 text-teal-500 cursor-pointer"
                    />
                    <div class="ml-3 flex-1">
                      <p class="text-sm font-semibold text-slate-900">EXCEL</p>
                      <p class="text-xs text-slate-600">
                        Spreadsheet with formatting
                      </p>
                    </div>
                    @if (selectedFormat() === 'excel') {
                    <lucide-angular
                      [img]="CheckIcon"
                      size="20"
                      class="text-teal-600"
                    ></lucide-angular>
                    }
                  </label>

                  <!-- PDF Format -->
                  <label
                    class="flex items-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all duration-200"
                    [class.border-teal-300]="selectedFormat() === 'pdf'"
                    [class.bg-teal-50]="selectedFormat() === 'pdf'"
                  >
                    <input
                      type="radio"
                      [(ngModel)]="selectedFormat"
                      value="pdf"
                      class="w-4 h-4 text-teal-500 cursor-pointer"
                    />
                    <div class="ml-3 flex-1">
                      <p class="text-sm font-semibold text-slate-900">PDF</p>
                      <p class="text-xs text-slate-600">Professional report</p>
                    </div>
                    @if (selectedFormat() === 'pdf') {
                    <lucide-angular
                      [img]="CheckIcon"
                      size="20"
                      class="text-teal-600"
                    ></lucide-angular>
                    }
                  </label>

                  <!-- CSV Format -->
                  <label
                    class="flex items-center p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all duration-200"
                    [class.border-teal-300]="selectedFormat() === 'csv'"
                    [class.bg-teal-50]="selectedFormat() === 'csv'"
                  >
                    <input
                      type="radio"
                      [(ngModel)]="selectedFormat"
                      value="csv"
                      class="w-4 h-4 text-teal-500 cursor-pointer"
                    />
                    <div class="ml-3 flex-1">
                      <p class="text-sm font-semibold text-slate-900">CSV</p>
                      <p class="text-xs text-slate-600">Data export</p>
                    </div>
                    @if (selectedFormat() === 'csv') {
                    <lucide-angular
                      [img]="CheckIcon"
                      size="20"
                      class="text-teal-600"
                    ></lucide-angular>
                    }
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="sticky bottom-0 z-10 px-8 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between"
        >
          <div class="space-y-0.5">
            <p class="text-sm font-semibold text-slate-900">
              <span class="text-teal-600">{{ filteredCount() | number }}</span>
              records • <span class="text-teal-600">{{ selectedCount() }}</span>
              fields selected
            </p>
            <p class="text-xs text-slate-600">
              {{ selectedFormat() | uppercase }} • {{ reportTitle() }}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button
              (click)="close()"
              [disabled]="exporting()"
              class="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 active:bg-slate-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              (click)="executeExport()"
              [disabled]="
                exporting() || filteredCount() === 0 || selectedCount() === 0
              "
              class="flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if (!exporting()) {
              <lucide-angular [img]="DownloadIcon" size="18"></lucide-angular>
              Generate Report } @else {
              <lucide-angular
                [img]="LoaderIcon"
                size="18"
                class="animate-spin"
              ></lucide-angular>
              Generating... }
            </button>
          </div>
        </div>
      </div>
    </div>
    } `,
})
export class ReportBuilderComponent {
  @Input() data: ReportBuilderData | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onExport = new EventEmitter<ReportExportEvent>();

  private exportService = inject(GenericExportService);

  // State signals
  isOpen = signal(false);
  exporting = signal(false);
  selectedFormat = signal<'excel' | 'pdf' | 'csv'>('excel');
  reportTitle = signal('Applications Report');
  selectedFields = signal<Set<keyof KapifyReports>>(new Set());
  openSections = signal<Set<string>>(
    new Set(['company', 'contact', 'funding', 'system'])
  );

  filters: ReportFilters = {
    dateRange: { start: '', end: '' },
  };

  // Icon references
  readonly CloseIcon = X;
  readonly DownloadIcon = Download;
  readonly LoaderIcon = Loader2;
  readonly CheckIcon = Check;
  readonly BarChartIcon = BarChart3;
  readonly FilterIcon = Filter;
  readonly RefreshIcon = RefreshCw;
  readonly ChevronIcon = ChevronDown;

  // Report field definitions
  private allFields: ReportField[] = [
    // Company Details
    { key: 'no', label: 'No.', category: 'company', width: 5 },
    {
      key: 'nameOfBusiness',
      label: 'Business Name',
      category: 'company',
      width: 22,
    },
    { key: 'industry', label: 'Industry', category: 'company', width: 14 },
    {
      key: 'physicalAddress',
      label: 'Physical Address',
      category: 'company',
      width: 24,
    },
    {
      key: 'businessDetails',
      label: 'Business Details',
      category: 'company',
      width: 20,
    },
    {
      key: 'businessStage',
      label: 'Business Stage',
      category: 'company',
      width: 14,
    },
    {
      key: 'yearsInOperation',
      label: 'Years in Operation',
      category: 'company',
      width: 12,
    },
    {
      key: 'numberOfEmployees',
      label: 'Employees',
      category: 'company',
      width: 10,
    },
    { key: 'bbbeeLeve', label: 'BBBEE Level', category: 'company', width: 12 },
    { key: 'province', label: 'Province', category: 'company', width: 12 },
    {
      key: 'priorYearAnnualRevenue',
      label: 'Prior Year Revenue',
      category: 'company',
      width: 16,
    },
    // Contact Details
    { key: 'firstName', label: 'First Name', category: 'contact', width: 14 },
    { key: 'surname', label: 'Surname', category: 'contact', width: 14 },
    { key: 'email', label: 'Email', category: 'contact', width: 24 },
    {
      key: 'phoneNumber',
      label: 'Phone Number',
      category: 'contact',
      width: 14,
    },
    { key: 'role', label: 'Role', category: 'contact', width: 12 },
    // Funding Details
    {
      key: 'amountRequested',
      label: 'Amount Requested',
      category: 'funding',
      width: 14,
    },
    {
      key: 'fundingType',
      label: 'Funding Type',
      category: 'funding',
      width: 12,
    },
    {
      key: 'fundingOpportunity',
      label: 'Funding Opportunity',
      category: 'funding',
      width: 20,
    },
    {
      key: 'useOfFunds',
      label: 'Use of Funds',
      category: 'funding',
      width: 20,
    },
    {
      key: 'applicationStatus',
      label: 'Application Status',
      category: 'funding',
      width: 14,
    },
    // System Fields
    { key: 'createdAt', label: 'Created Date', category: 'system', width: 14 },
    { key: 'updatedAt', label: 'Updated Date', category: 'system', width: 14 },
  ];

  // Filtered field lists
  companyFields = computed(() =>
    this.allFields.filter((f) => f.category === 'company')
  );
  contactFields = computed(() =>
    this.allFields.filter((f) => f.category === 'contact')
  );
  fundingFields = computed(() =>
    this.allFields.filter((f) => f.category === 'funding')
  );
  systemFields = computed(() =>
    this.allFields.filter((f) => f.category === 'system')
  );

  // Data signals
  filteredRecords = signal<ApplicationReportRecord[]>([]);

  // Computed properties
  totalRecords = computed(() => this.data?.allRecords.length ?? 0);
  filteredCount = computed(() => this.filteredRecords().length);
  selectedCount = computed(() => this.selectedFields().size);

  companyFieldsSelected = computed(
    () =>
      this.companyFields().filter((f) => this.selectedFields().has(f.key))
        .length
  );
  contactFieldsSelected = computed(
    () =>
      this.contactFields().filter((f) => this.selectedFields().has(f.key))
        .length
  );
  fundingFieldsSelected = computed(
    () =>
      this.fundingFields().filter((f) => this.selectedFields().has(f.key))
        .length
  );
  systemFieldsSelected = computed(
    () =>
      this.systemFields().filter((f) => this.selectedFields().has(f.key)).length
  );

  open(): void {
    this.isOpen.set(true);
    this.initializeFields();
    this.applyDateFilter();
  }

  close(): void {
    this.isOpen.set(false);
    this.onClose.emit();
    setTimeout(() => this.resetState(), 300);
  }

  private initializeFields(): void {
    const fields = new Set<keyof KapifyReports>();
    this.allFields.forEach((f) => fields.add(f.key));
    this.selectedFields.set(fields);
  }

  private applyDateFilter(): void {
    if (!this.data?.allRecords) {
      this.filteredRecords.set([]);
      return;
    }

    let results = [...this.data.allRecords];

    if (this.filters.dateRange.start || this.filters.dateRange.end) {
      const start = this.filters.dateRange.start
        ? new Date(this.filters.dateRange.start)
        : new Date('1900-01-01');
      const end = this.filters.dateRange.end
        ? new Date(this.filters.dateRange.end)
        : new Date('2099-12-31');

      results = results.filter((r) => {
        const recordDate = new Date(r.createdAt || new Date());
        return recordDate >= start && recordDate <= end;
      });
    }

    this.filteredRecords.set(results);
  }

  toggleSection(section: string): void {
    const sections = new Set(this.openSections());
    if (sections.has(section)) {
      sections.delete(section);
    } else {
      sections.add(section);
    }
    this.openSections.set(sections);
  }

  isSectionOpen(section: string): boolean {
    return this.openSections().has(section);
  }

  toggleField(key: keyof KapifyReports): void {
    const fields = new Set(this.selectedFields());
    if (fields.has(key)) {
      fields.delete(key);
    } else {
      fields.add(key);
    }
    this.selectedFields.set(fields);
  }

  isFieldSelected(key: keyof KapifyReports): boolean {
    return this.selectedFields().has(key);
  }

  clearAllFields(): void {
    this.selectedFields.set(new Set());
  }

  async executeExport(): Promise<void> {
    if (this.filteredRecords().length === 0 || this.selectedFields().size === 0)
      return;

    this.exporting.set(true);

    try {
      const data = this.filteredRecords();
      const title = this.reportTitle();
      const format = this.selectedFormat();

      // Build export columns from selected fields
      const columns: ExportColumn<ApplicationReportRecord>[] =
        this.buildExportColumns();

      // Use GenericExportService
      await this.exportService.export(data, {
        fileName: title,
        format: format,
        columns: columns,
        pdf: {
          title: title,
          orientation: 'landscape',
        },
      });

      // Emit event for parent tracking
      this.onExport.emit({
        data: data,
        format: format,
        title: title,
        selectedFields: Array.from(this.selectedFields()),
        dateRange: { ...this.filters.dateRange },
      });

      await new Promise((resolve) => setTimeout(resolve, 800));
      this.close();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      this.exporting.set(false);
    }
  }

  private buildExportColumns(): ExportColumn<ApplicationReportRecord>[] {
    const columns: ExportColumn<ApplicationReportRecord>[] = [];

    this.allFields.forEach((field) => {
      const isSelected = this.selectedFields().has(field.key);

      const column: ExportColumn<ApplicationReportRecord> = {
        header: field.label,
        width: field.width,
      };

      if (isSelected) {
        column.key = field.key as keyof ApplicationReportRecord;

        // Apply formatting based on field type
        if (
          field.key === 'amountRequested' ||
          field.key === 'priorYearAnnualRevenue'
        ) {
          column.format = (val) => this.formatCurrency(val);
        } else if (field.key === 'createdAt' || field.key === 'updatedAt') {
          column.format = (val) => this.formatDate(val);
        }
      }

      columns.push(column);
    });

    return columns;
  }

  private formatCurrency(amount: number): string {
    if (!amount) return '';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  }

  private resetState(): void {
    this.selectedFields.set(new Set());
    this.openSections.set(new Set(['company', 'contact', 'funding', 'system']));
    this.selectedFormat.set('excel');
    this.reportTitle.set('Applications Report');
    this.filters = { dateRange: { start: '', end: '' } };
  }
}
