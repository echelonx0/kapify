import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  LucideAngularModule,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Search,
  X,
  RefreshCcw,
  Loader2,
  TriangleAlert,
  Table,
  File,
  ChevronRight,
  TrendingUp,
  Inbox,
} from 'lucide-angular';

import { KapifyReports } from './models/kapify-reports.interface';
import { KapifyReportsGeneratorService } from './services/kapify-reports-generator.service';
import { KapifyReportsExportService } from './services/kapify-reports-export.service';

interface ActivityReport extends KapifyReports {
  matchScore?: number;
  completionScore?: number;
  timeline?: {
    createdDaysAgo: number;
    status: string;
  };
  createdAt?: Date | string; // Override as optional
}

@Component({
  selector: 'app-ai-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './ai-reports.component.html',
  styleUrl: './ai-reports.component.css',
})
export class AIReportsComponent implements OnInit, OnDestroy {
  private generator = inject(KapifyReportsGeneratorService);
  private exporter = inject(KapifyReportsExportService);
  private destroy$ = new Subject<void>();

  /* ================= ICON DECLARATIONS ================= */

  readonly RefreshIcon = RefreshCcw;
  readonly LoaderIcon = Loader2;
  readonly SearchIcon = Search;
  readonly FilterIcon = Filter;
  readonly CloseIcon = X;
  readonly FileIcon = FileText;
  readonly ApprovedIcon = CheckCircle2;
  readonly RejectedIcon = XCircle;
  readonly PendingIcon = Clock;
  readonly AlertIcon = TriangleAlert;
  readonly TableIcon = Table;
  readonly PdfIcon = File;
  readonly ChevronRightIcon = ChevronRight;
  readonly InboxIcon = Inbox;
  readonly TrendingUpIcon = TrendingUp;

  /* ================= STATE ================= */

  reports = signal<ActivityReport[]>([]);
  filteredReports = signal<ActivityReport[]>([]);
  loading = signal(true);
  exporting = signal(false);
  error = signal<string | null>(null);

  selectedReport = signal<ActivityReport | null>(null);
  sheetOpen = signal(false);

  searchQuery = signal('');
  selectedStatus = signal('');
  selectedProvinces = signal<string[]>([]);
  startDate = signal<string>('');
  endDate = signal<string>('');

  pageSize = signal(8);
  currentPage = signal(0);

  /* ================= COMPUTED ================= */

  hasReports = computed(() => this.reports().length > 0);
  filteredCount = computed(() => this.filteredReports().length);

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredCount() / this.pageSize()))
  );

  paginatedReports = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.filteredReports().slice(start, start + this.pageSize());
  });

  uniqueStatuses = computed(() =>
    Array.from(new Set(this.reports().map((r) => r.applicationStatus))).sort()
  );

  uniqueProvinces = computed(() =>
    Array.from(new Set(this.reports().map((r) => r.province)))
      .filter(Boolean)
      .sort()
  );

  activitySummary = computed(() => {
    const reports = this.reports();
    const totalApplications = reports.length;
    const approved = reports.filter(
      (r) => r.applicationStatus === 'Approved'
    ).length;
    const pending = reports.filter(
      (r) => r.applicationStatus === 'Under Review'
    ).length;
    const avgMatchScore =
      reports.length === 0
        ? 0
        : Math.round(
            reports.reduce((sum, r) => sum + (r.matchScore ?? 0), 0) /
              reports.length
          );

    return { totalApplications, approved, pending, avgMatchScore };
  });

  provinceFilterLabel = computed(() => {
    const selected = this.selectedProvinces();
    if (selected.length === 0) return 'All Provinces';
    if (selected.length === 1) return selected[0];
    return `${selected.length} provinces selected`;
  });

  /* ================= LIFECYCLE ================= */

  ngOnInit(): void {
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ================= DATA ================= */

  loadReports(): void {
    this.loading.set(true);
    this.generator
      .generateReports()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.reports.set(data.map((r) => this.enrichReport(r)));
          this.applyFilters();
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load reports');
          this.loading.set(false);
        },
      });
  }

  refreshReports(): void {
    this.loadReports();
  }

  /* ================= FILTERING ================= */

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let results = [...this.reports()];

    // Search filter
    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
      results = results.filter(
        (r) =>
          r.nameOfBusiness.toLowerCase().includes(q) ||
          r.fundingOpportunity.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (this.selectedStatus()) {
      results = results.filter(
        (r) => r.applicationStatus === this.selectedStatus()
      );
    }

    // Province filter - multi-select
    if (this.selectedProvinces().length > 0) {
      results = results.filter((r) =>
        this.selectedProvinces().includes(r.province)
      );
    }

    // Date range filter
    if (this.startDate() || this.endDate()) {
      const start = this.startDate()
        ? new Date(this.startDate())
        : new Date('1900-01-01');
      const end = this.endDate()
        ? new Date(this.endDate())
        : new Date('2099-12-31');

      results = results.filter((r) => {
        const reportDate = new Date(r.createdAt || new Date());
        return reportDate >= start && reportDate <= end;
      });
    }

    this.filteredReports.set(results);
    this.currentPage.set(0);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('');
    this.selectedProvinces.set([]);
    this.startDate.set('');
    this.endDate.set('');
    this.applyFilters();
  }

  /* ================= PROVINCE MULTI-SELECT ================= */

  toggleProvince(province: string): void {
    this.selectedProvinces.update((provinces) => {
      if (provinces.includes(province)) {
        return provinces.filter((p) => p !== province);
      } else {
        return [...provinces, province];
      }
    });
    this.onFilterChange();
  }

  selectAllProvinces(): void {
    this.selectedProvinces.set([...this.uniqueProvinces()]);
    this.onFilterChange();
  }

  deselectAllProvinces(): void {
    this.selectedProvinces.set([]);
    this.onFilterChange();
  }

  isProvinceSelected(province: string): boolean {
    return this.selectedProvinces().includes(province);
  }

  /* ================= PAGINATION ================= */

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update((p) => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update((p) => p + 1);
    }
  }

  /* ================= EXPORT ================= */

  async exportToExcel(): Promise<void> {
    this.exporting.set(true);
    await this.exporter.exportToExcel(this.filteredReports());
    this.exporting.set(false);
  }

  async exportToPDF(): Promise<void> {
    this.exporting.set(true);
    await this.exporter.exportToPDF(this.filteredReports());
    this.exporting.set(false);
  }

  /* ================= DETAIL SHEET ================= */

  openReport(report: ActivityReport): void {
    this.selectedReport.set(report);
    this.sheetOpen.set(true);
  }

  closeSheet(): void {
    this.sheetOpen.set(false);
    setTimeout(() => this.selectedReport.set(null), 300);
  }

  /* ================= STATUS HELPERS ================= */

  getStatusIcon(status: string): any {
    switch (status) {
      case 'Approved':
        return this.ApprovedIcon;
      case 'Rejected':
        return this.RejectedIcon;
      case 'Under Review':
        return this.PendingIcon;
      default:
        return this.FileIcon;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Approved':
        return 'bg-green-50 border-green-200/50 text-green-700';
      case 'Rejected':
        return 'bg-red-50 border-red-200/50 text-red-700';
      case 'Under Review':
        return 'bg-amber-50 border-amber-200/50 text-amber-700';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-600';
    }
  }

  getMatchScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  }

  /* ================= UTILITIES ================= */

  mathRound(value: number): number {
    return Math.round(value);
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  private enrichReport(report: KapifyReports): ActivityReport {
    return {
      ...report,
      matchScore: Math.floor(Math.random() * 40) + 60,
      completionScore: 80,
      timeline: {
        createdDaysAgo: this.getDaysAgo(report.createdAt),
        status: this.getTimelineStatus(report.createdAt),
      },
    };
  }

  private getDaysAgo(date: Date | string | undefined): number {
    if (!date) return 0;
    const reportDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - reportDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getTimelineStatus(date: Date | string | undefined): string {
    const daysAgo = this.getDaysAgo(date);
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return 'This week';
    if (daysAgo < 30) return 'This month';
    return 'Older';
  }
}
