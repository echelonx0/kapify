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
  CircleCheckIcon,
  CoinsIcon,
  CreditCardIcon,
  SparklesIcon,
  CheckCircleIcon,
  Download,
  Eye,
  Building,
  Globe,
  ClockIcon,
} from 'lucide-angular';

import { KapifyReports } from './models/kapify-reports.interface';
import { KapifyReportsGeneratorService } from './services/kapify-reports-generator.service';
import { KapifyReportsExportService } from './services/kapify-reports-export.service';
import { AIAnalysisHistoryService } from 'src/app/features/ai/services/ai-analysis-history.service';
import {
  AnalysisHistoryItem,
  AIAnalysisSummary,
} from 'src/app/features/ai/document-analysis/analysis-interface.component';

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

  private analysisHistory = inject(AIAnalysisHistoryService);
  private destroy$ = new Subject<void>();

  // Tab management
  activeTab = signal<'applications' | 'analysis'>('applications');

  // Analysis history state
  analysisHistoryData = signal<AnalysisHistoryItem[]>([]);
  analysisSummary = signal<AIAnalysisSummary>({
    totalAnalyses: 0,
    freeAnalyses: 0,
    paidAnalyses: 0,
    totalCreditsSpent: 0,
    averageCostPerAnalysis: 0,
    pendingAnalyses: 0,
    failedAnalyses: 0,
  });

  // Analysis filters
  analysisSearchQuery = signal('');
  selectedAnalysisType = signal('');
  selectedAnalysisStatus = signal('');
  analysisStartDate = signal<string>('');
  analysisEndDate = signal<string>('');
  showFreeOnly = signal(false);
  showPaidOnly = signal(false);

  // Analysis pagination
  analysisCurrentPage = signal(0);
  analysisPageSize = signal(10);

  // Analysis detail modal
  selectedAnalysis = signal<AnalysisHistoryItem | null>(null);
  analysisDetailOpen = signal(false);
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
  CircleCheckIcon = CircleCheckIcon;
  CreditCardIcon = CreditCardIcon;
  CoinsIcon = CoinsIcon;
  SparklesIcon = SparklesIcon;
  CheckCircleIcon = CheckCircleIcon;
  ClockIcon = ClockIcon;
  readonly DownloadIcon = Download;
  readonly EyeIcon = Eye;
  readonly BuildingIcon = Building;
  readonly GlobeIcon = Globe;
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

  filteredAnalysisHistory = computed(() => {
    let results = [...this.analysisHistoryData()];

    // Apply filters
    if (this.analysisSearchQuery()) {
      const q = this.analysisSearchQuery().toLowerCase();
      results = results.filter(
        (a) =>
          a.applicationTitle?.toLowerCase().includes(q) ||
          a.opportunityTitle?.toLowerCase().includes(q) ||
          a.userName?.toLowerCase().includes(q)
      );
    }

    if (this.selectedAnalysisType()) {
      results = results.filter(
        (a) => a.requestType === this.selectedAnalysisType()
      );
    }

    if (this.selectedAnalysisStatus()) {
      results = results.filter(
        (a) => a.status === this.selectedAnalysisStatus()
      );
    }

    if (this.showFreeOnly()) {
      results = results.filter((a) => a.wasFree);
    }

    if (this.showPaidOnly()) {
      results = results.filter((a) => !a.wasFree);
    }

    // Date range
    if (this.analysisStartDate() || this.analysisEndDate()) {
      const start = this.analysisStartDate()
        ? new Date(this.analysisStartDate())
        : new Date('1900-01-01');
      const end = this.analysisEndDate()
        ? new Date(this.analysisEndDate())
        : new Date('2099-12-31');

      results = results.filter((a) => {
        const date = new Date(a.createdAt);
        return date >= start && date <= end;
      });
    }

    return results;
  });

  paginatedAnalysisHistory = computed(() => {
    const start = this.analysisCurrentPage() * this.analysisPageSize();
    return this.filteredAnalysisHistory().slice(
      start,
      start + this.analysisPageSize()
    );
  });

  analysisTotalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(this.filteredAnalysisHistory().length / this.analysisPageSize())
    )
  );

  uniqueAnalysisTypes = computed(() =>
    Array.from(new Set(this.analysisHistoryData().map((a) => a.requestType)))
  );

  uniqueAnalysisStatuses = computed(() =>
    Array.from(new Set(this.analysisHistoryData().map((a) => a.status)))
  );
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

  switchTab(tab: 'applications' | 'analysis'): void {
    this.activeTab.set(tab);
    if (tab === 'analysis' && this.analysisHistoryData().length === 0) {
      this.loadAnalysisHistory();
    }
  }

  loadAnalysisHistory(): void {
    this.loading.set(true);

    // Load summary
    this.analysisHistory.getAnalysisSummary().subscribe({
      next: (summary) => {
        this.analysisSummary.set(summary);
      },
      error: (err) => console.error('Failed to load summary:', err),
    });

    // Load history
    this.analysisHistory.getAnalysisHistory().subscribe({
      next: (history) => {
        this.analysisHistoryData.set(history);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load analysis history');
        this.loading.set(false);
      },
    });
  }

  openAnalysisDetail(analysis: AnalysisHistoryItem): void {
    this.selectedAnalysis.set(analysis);
    this.analysisDetailOpen.set(true);
  }

  closeAnalysisDetail(): void {
    this.analysisDetailOpen.set(false);
    setTimeout(() => this.selectedAnalysis.set(null), 300);
  }

  async downloadAnalysisReport(analysis: AnalysisHistoryItem): Promise<void> {
    // TODO: Implement PDF/Excel generation from analysis results
    console.log('Downloading analysis report:', analysis.id);
  }

  formatCredits(credits: number): string {
    return `R${(credits / 100).toFixed(2)}`;
  }

  getAnalysisStatusColor(status: string): string {
    switch (status) {
      case 'executed_free':
      case 'executed_paid':
        return 'bg-green-50 border-green-200/50 text-green-700';
      case 'pending':
        return 'bg-amber-50 border-amber-200/50 text-amber-700';
      case 'cancelled':
        return 'bg-slate-100 border-slate-200 text-slate-600';
      case 'failed':
        return 'bg-red-50 border-red-200/50 text-red-700';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-600';
    }
  }

  getAnalysisTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      analysis: 'Profile Analysis',
      matching: 'Opportunity Matching',
      scoring: 'Investment Scoring',
      document_review: 'Document Review',
    };
    return labels[type] || type;
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

  // ===============================
  // TAB 2: ANALYSIS HISTORY METHODS
  // ===============================

  /**
   * Apply analysis filters
   */
  onAnalysisFilterChange(): void {
    // Filters are applied via computed signal
    // Reset to first page
    this.analysisCurrentPage.set(0);
  }

  /**
   * Clear all analysis filters
   */
  clearAnalysisFilters(): void {
    this.analysisSearchQuery.set('');
    this.selectedAnalysisType.set('');
    this.selectedAnalysisStatus.set('');
    this.analysisStartDate.set('');
    this.analysisEndDate.set('');
    this.showFreeOnly.set(false);
    this.showPaidOnly.set(false);
  }

  /**
   * Analysis pagination
   */
  previousAnalysisPage(): void {
    if (this.analysisCurrentPage() > 0) {
      this.analysisCurrentPage.update((p) => p - 1);
    }
  }

  nextAnalysisPage(): void {
    if (this.analysisCurrentPage() < this.analysisTotalPages() - 1) {
      this.analysisCurrentPage.update((p) => p + 1);
    }
  }

  /**
   * Get time ago helper (reuse existing or add this)
   */
  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'week', seconds: 604800 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  }
}
