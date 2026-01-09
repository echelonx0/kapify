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
} from 'lucide-angular';
import { GenericExportService } from 'src/app/core/services/kapify-export.service';
import { ExportColumn } from 'src/app/core/models/export-options.interface';

/**
 * Application Report Record
 * Minimal fields needed for reporting - maps directly from FundingApplication
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
}

export interface ReportBuilderData {
  allRecords: ApplicationReportRecord[];
}

export interface ReportExportEvent {
  data: ApplicationReportRecord[];
  format: 'excel' | 'pdf' | 'csv';
  title: string;
  filters: ReportFilters;
}

export interface ReportFilters {
  dateRange: { start?: string; end?: string };
  statuses: string[];
  industries: string[];
  stages: string[];
  provinces: string[];
  fundingTypes: string[];
  amountRange: { min?: number; max?: number };
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
        class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-5xl my-8 overflow-hidden"
      >
        <!-- Header -->
        <div
          class="sticky top-0 z-10 px-8 py-6 border-b border-slate-200 bg-gradient-to-r from-teal-50 via-white to-slate-50 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center"
            >
              <lucide-angular
                [img]="BarChartIcon"
                size="20"
                class="text-teal-600"
              ></lucide-angular>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-slate-900">
                Build Custom Report
              </h2>
              <p class="text-sm text-slate-600 mt-0.5">
                Filter and export application data in your preferred format
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
            <!-- Filters Section -->
            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <lucide-angular
                    [img]="FilterIcon"
                    size="20"
                    class="text-slate-600"
                  ></lucide-angular>
                  <h3 class="text-lg font-bold text-slate-900">Filters</h3>
                </div>
                <button
                  (click)="clearAllFilters()"
                  class="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors flex items-center gap-1"
                >
                  <lucide-angular
                    [img]="RefreshIcon"
                    size="16"
                  ></lucide-angular>
                  Reset
                </button>
              </div>

              <!-- Date Range -->
              <div
                class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-slate-200"
              >
                <div>
                  <label
                    class="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    From Date
                  </label>
                  <input
                    type="date"
                    [(ngModel)]="filters.dateRange.start"
                    (change)="applyFilters()"
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
                    (change)="applyFilters()"
                    class="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <!-- Status Filter -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  Application Status
                </label>
                <div
                  class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
                >
                  @for (status of availableStatuses; track status) {
                  <label
                    class="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                    [class.bg-teal-50]="isStatusSelected(status)"
                    [class.border-teal-300]="isStatusSelected(status)"
                  >
                    <input
                      type="checkbox"
                      [checked]="isStatusSelected(status)"
                      (change)="toggleStatus(status)"
                      class="w-4 h-4 text-teal-500 rounded cursor-pointer"
                    />
                    <span class="text-sm font-medium text-slate-700">
                      {{ formatStatus(status) }}
                    </span>
                  </label>
                  }
                </div>
              </div>

              <!-- Industry Filter -->
              <div class="space-y-3 pb-6 border-b border-slate-200">
                <label class="block text-sm font-semibold text-slate-900">
                  Industry
                </label>
                <div
                  class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
                >
                  @for (industry of availableIndustries(); track industry) {
                  <label
                    class="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                    [class.bg-teal-50]="isIndustrySelected(industry)"
                    [class.border-teal-300]="isIndustrySelected(industry)"
                  >
                    <input
                      type="checkbox"
                      [checked]="isIndustrySelected(industry)"
                      (change)="toggleIndustry(industry)"
                      class="w-4 h-4 text-teal-500 rounded cursor-pointer"
                    />
                    <span class="text-sm font-medium text-slate-700">
                      {{ industry }}
                    </span>
                  </label>
                  }
                </div>
              </div>

              <!-- Business Stage Filter -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  Business Stage
                </label>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                  @for (stage of availableStages; track stage) {
                  <label
                    class="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                    [class.bg-teal-50]="isStageSelected(stage)"
                    [class.border-teal-300]="isStageSelected(stage)"
                  >
                    <input
                      type="checkbox"
                      [checked]="isStageSelected(stage)"
                      (change)="toggleStage(stage)"
                      class="w-4 h-4 text-teal-500 rounded cursor-pointer"
                    />
                    <span class="text-sm font-medium text-slate-700">
                      {{ stage }}
                    </span>
                  </label>
                  }
                </div>
              </div>

              <!-- Province Filter -->
              <div class="space-y-3 pb-6 border-b border-slate-200">
                <label class="block text-sm font-semibold text-slate-900">
                  Province
                </label>
                <div
                  class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
                >
                  @for (province of availableProvinces(); track province) {
                  <label
                    class="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                    [class.bg-teal-50]="isProvinceSelected(province)"
                    [class.border-teal-300]="isProvinceSelected(province)"
                  >
                    <input
                      type="checkbox"
                      [checked]="isProvinceSelected(province)"
                      (change)="toggleProvince(province)"
                      class="w-4 h-4 text-teal-500 rounded cursor-pointer"
                    />
                    <span class="text-sm font-medium text-slate-700">
                      {{ province }}
                    </span>
                  </label>
                  }
                </div>
              </div>

              <!-- Funding Type Filter -->
              <div class="space-y-3">
                <label class="block text-sm font-semibold text-slate-900">
                  Funding Type
                </label>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                  @for (type of availableFundingTypes; track type) {
                  <label
                    class="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                    [class.bg-teal-50]="isFundingTypeSelected(type)"
                    [class.border-teal-300]="isFundingTypeSelected(type)"
                  >
                    <input
                      type="checkbox"
                      [checked]="isFundingTypeSelected(type)"
                      (change)="toggleFundingType(type)"
                      class="w-4 h-4 text-teal-500 rounded cursor-pointer"
                    />
                    <span class="text-sm font-medium text-slate-700">
                      {{ type }}
                    </span>
                  </label>
                  }
                </div>
              </div>

              <!-- Amount Range -->
              <div
                class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-200"
              >
                <div>
                  <label
                    class="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    Min Amount (ZAR)
                  </label>
                  <input
                    type="number"
                    [(ngModel)]="filters.amountRange.min"
                    (change)="applyFilters()"
                    placeholder="0"
                    class="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label
                    class="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    Max Amount (ZAR)
                  </label>
                  <input
                    type="number"
                    [(ngModel)]="filters.amountRange.max"
                    (change)="applyFilters()"
                    placeholder="999,999,999"
                    class="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
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
                      <p class="text-sm font-semibold text-slate-900">Excel</p>
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
              records will be exported
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
              [disabled]="exporting() || filteredCount() === 0"
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

  isOpen = signal(false);
  exporting = signal(false);
  selectedFormat = signal<'excel' | 'pdf' | 'csv'>('excel');
  reportTitle = signal('Applications Report');

  filters: ReportFilters = {
    dateRange: { start: '', end: '' },
    statuses: [],
    industries: [],
    stages: [],
    provinces: [],
    fundingTypes: [],
    amountRange: { min: undefined, max: undefined },
  };

  availableStatuses: string[] = [
    'submitted',
    'under_review',
    'approved',
    'rejected',
  ];

  availableStages: string[] = [
    'Pre-Launch',
    'Startup',
    'Early Growth',
    'Growth',
    'Mature',
    'Expansion',
  ];

  availableFundingTypes: string[] = ['Equity', 'Debt', 'Grant', 'Hybrid'];

  availableIndustries = signal<string[]>([]);
  availableProvinces = signal<string[]>([]);

  readonly CloseIcon = X;
  readonly DownloadIcon = Download;
  readonly LoaderIcon = Loader2;
  readonly CheckIcon = Check;
  readonly BarChartIcon = BarChart3;
  readonly FilterIcon = Filter;
  readonly RefreshIcon = RefreshCw;

  filteredRecords = signal<ApplicationReportRecord[]>([]);

  totalRecords = computed(() => this.data?.allRecords.length ?? 0);
  filteredCount = computed(() => this.filteredRecords().length);
  approvedCount = computed(
    () =>
      this.filteredRecords().filter((r) => r.applicationStatus === 'approved')
        .length
  );
  pendingCount = computed(
    () =>
      this.filteredRecords().filter(
        (r) =>
          r.applicationStatus === 'submitted' ||
          r.applicationStatus === 'under_review'
      ).length
  );
  totalAmount = computed(() =>
    this.filteredRecords().reduce((sum, r) => sum + (r.amountRequested || 0), 0)
  );

  open(): void {
    this.isOpen.set(true);
    this.initializeAvailableOptions();
    this.applyFilters();
  }

  close(): void {
    this.isOpen.set(false);
    this.onClose.emit();
    setTimeout(() => this.resetFilters(), 300);
  }

  private initializeAvailableOptions(): void {
    if (!this.data?.allRecords) return;

    const industries = Array.from(
      new Set(this.data.allRecords.map((r) => r.industry).filter(Boolean))
    ).sort();
    this.availableIndustries.set(industries);

    const provinces = Array.from(
      new Set(this.data.allRecords.map((r) => r.province).filter(Boolean))
    ).sort();
    this.availableProvinces.set(provinces);
  }

  applyFilters(): void {
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

    if (this.filters.statuses.length > 0) {
      results = results.filter((r) =>
        this.filters.statuses.includes(r.applicationStatus)
      );
    }

    if (this.filters.industries.length > 0) {
      results = results.filter((r) =>
        this.filters.industries.includes(r.industry)
      );
    }

    if (this.filters.stages.length > 0) {
      results = results.filter((r) =>
        this.filters.stages.includes(r.businessStage)
      );
    }

    if (this.filters.provinces.length > 0) {
      results = results.filter((r) =>
        this.filters.provinces.includes(r.province)
      );
    }

    if (this.filters.fundingTypes.length > 0) {
      results = results.filter((r) =>
        this.filters.fundingTypes.includes(r.fundingType)
      );
    }

    if (this.filters.amountRange.min !== undefined) {
      results = results.filter(
        (r) => r.amountRequested >= this.filters.amountRange.min!
      );
    }

    if (this.filters.amountRange.max !== undefined) {
      results = results.filter(
        (r) => r.amountRequested <= this.filters.amountRange.max!
      );
    }

    this.filteredRecords.set(results);
  }

  toggleStatus(status: string): void {
    this.toggleInArray(this.filters.statuses, status);
    this.applyFilters();
  }

  toggleIndustry(industry: string): void {
    this.toggleInArray(this.filters.industries, industry);
    this.applyFilters();
  }

  toggleStage(stage: string): void {
    this.toggleInArray(this.filters.stages, stage);
    this.applyFilters();
  }

  toggleProvince(province: string): void {
    this.toggleInArray(this.filters.provinces, province);
    this.applyFilters();
  }

  toggleFundingType(fundingType: string): void {
    this.toggleInArray(this.filters.fundingTypes, fundingType);
    this.applyFilters();
  }

  private toggleInArray(arr: string[], value: string): void {
    const index = arr.indexOf(value);
    if (index > -1) {
      arr.splice(index, 1);
    } else {
      arr.push(value);
    }
  }

  isStatusSelected(status: string): boolean {
    return this.filters.statuses.includes(status);
  }

  isIndustrySelected(industry: string): boolean {
    return this.filters.industries.includes(industry);
  }

  isStageSelected(stage: string): boolean {
    return this.filters.stages.includes(stage);
  }

  isProvinceSelected(province: string): boolean {
    return this.filters.provinces.includes(province);
  }

  isFundingTypeSelected(fundingType: string): boolean {
    return this.filters.fundingTypes.includes(fundingType);
  }

  clearAllFilters(): void {
    this.filters = {
      dateRange: { start: '', end: '' },
      statuses: [],
      industries: [],
      stages: [],
      provinces: [],
      fundingTypes: [],
      amountRange: { min: undefined, max: undefined },
    };
    this.applyFilters();
  }

  async executeExport(): Promise<void> {
    if (this.filteredRecords().length === 0) return;

    this.exporting.set(true);

    try {
      const data = this.filteredRecords();
      const title = this.reportTitle();
      const format = this.selectedFormat();

      // Define export columns using GenericExportService
      const columns: ExportColumn<ApplicationReportRecord>[] = [
        { header: 'No', key: 'no', width: 5 },
        { header: 'Business Name', key: 'nameOfBusiness', width: 22 },
        { header: 'Industry', key: 'industry', width: 14 },
        {
          header: 'Contact',
          value: (row) => `${row.firstName} ${row.surname}`,
          width: 18,
        },
        { header: 'Email', key: 'email', width: 22 },
        { header: 'Phone', key: 'phoneNumber', width: 14 },
        { header: 'Stage', key: 'businessStage', width: 14 },
        { header: 'Years', key: 'yearsInOperation', width: 8 },
        { header: 'Employees', key: 'numberOfEmployees', width: 10 },
        { header: 'Province', key: 'province', width: 12 },
        {
          header: 'Revenue',
          key: 'priorYearAnnualRevenue',
          format: (val) => this.formatCurrency(val),
          width: 14,
        },
        {
          header: 'Amount',
          key: 'amountRequested',
          format: (val) => this.formatCurrency(val),
          width: 14,
        },
        { header: 'Funding Type', key: 'fundingType', width: 12 },
        { header: 'Status', key: 'applicationStatus', width: 14 },
        {
          header: 'Date',
          key: 'createdAt',
          format: (val) => this.formatDate(val),
          width: 14,
        },
      ];

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

      // Emit event for parent component tracking
      this.onExport.emit({
        data: data,
        format: format,
        title: title,
        filters: { ...this.filters },
      });

      await new Promise((resolve) => setTimeout(resolve, 800));
      this.close();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      this.exporting.set(false);
    }
  }

  private resetFilters(): void {
    this.clearAllFilters();
    this.selectedFormat.set('excel');
    this.reportTitle.set('Applications Report');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(date));
  }

  formatStatus(status: string): string {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
