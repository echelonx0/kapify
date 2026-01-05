import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  AlertCircle,
  AlertTriangle,
  CheckCheck,
  File,
  Filter,
  Loader2,
  LucideAngularModule,
  XCircle,
  icons,
} from 'lucide-angular';
import { KapifyReports } from './kapify-reports.interface';
import { KapifyReportsGeneratorService } from './kapify-reports-generator.service';
import { KapifyReportsExportService } from './kapify-reports-export.service';

// Register all icons used in the component
const lucideIcons = {
  activity: icons.Activity,
  'file-text': icons.FileText,
  'check-circle-2': CheckCheck,
  'x-circle': XCircle,
  clock: icons.Clock,
  send: icons.Send,
  eye: icons.Eye,
  slash: icons.Slash,
  target: icons.Target,
  filter: Filter,
  search: icons.Search,
  x: icons.X,
  'refresh-cw': icons.RefreshCw,
  'loader-2': Loader2,
  'alert-circle': AlertCircle,
  table: icons.Table,
  'file-pdf': File,
  'chevron-left': icons.ChevronLeft,
  'chevron-right': icons.ChevronRight,
  briefcase: icons.Briefcase,
  users: icons.Users,
  'trending-up': icons.TrendingUp,
  inbox: icons.Inbox,
  'arrow-left': icons.ArrowLeft,
  'alert-triangle': AlertTriangle,
  'arrow-right': icons.ArrowRight,
};

interface ActivityReport extends KapifyReports {
  matchScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  completionScore?: number;
  actionIcon?: string;
  actionType?: 'submitted' | 'approved' | 'rejected' | 'updated' | 'created';
  timeline?: {
    createdDaysAgo: number;
    status: string;
    icon: string;
  };
}

@Component({
  selector: 'app-ai-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  providers: [
    {
      provide: 'LUCIDE_ICONS',
      useValue: lucideIcons,
    },
  ],
  templateUrl: './ai-reports.component.html',
  styleUrl: './ai-reports.component.css',
})
export class AIReportsComponent implements OnInit, OnDestroy {
  private generator = inject(KapifyReportsGeneratorService);
  private exporter = inject(KapifyReportsExportService);
  private destroy$ = new Subject<void>();

  // Make icons available to template
  icons = lucideIcons;

  // ===================================
  // STATE MANAGEMENT
  // ===================================

  reports = signal<ActivityReport[]>([]);
  filteredReports = signal<ActivityReport[]>([]);
  loading = signal(true);
  exporting = signal(false);
  error = signal<string | null>(null);
  selectedReport = signal<ActivityReport | null>(null);
  sheetOpen = signal(false);

  // Filter state
  searchQuery = signal('');
  selectedStatus = signal<string>('');
  selectedRisk = signal<string>('');
  sortBy = signal<'recent' | 'risk' | 'match' | 'alphabetical'>('recent');

  // Pagination
  pageSize = signal(8);
  currentPage = signal(0);

  // ===================================
  // COMPUTED PROPERTIES
  // ===================================

  hasReports = computed(() => this.reports().length > 0);
  filteredCount = computed(() => this.filteredReports().length);
  totalPages = computed(() =>
    Math.ceil(this.filteredCount() / this.pageSize())
  );

  paginatedReports = computed(() => {
    const start = this.currentPage() * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredReports().slice(start, end);
  });

  // Summary stats
  activitySummary = computed(() => {
    const reports = this.reports();
    if (reports.length === 0) {
      return {
        totalApplications: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        avgMatchScore: 0,
        highRiskCount: 0,
        thisWeek: 0,
      };
    }

    const approved = reports.filter(
      (r) => r.applicationStatus === 'Approved'
    ).length;
    const rejected = reports.filter(
      (r) => r.applicationStatus === 'Rejected'
    ).length;
    const pending = reports.filter((r) =>
      ['Draft', 'Submitted', 'Under Review'].includes(r.applicationStatus)
    ).length;

    const avgMatch =
      reports.reduce((sum, r) => sum + (r.matchScore || 0), 0) / reports.length;

    const highRisk = reports.filter(
      (r) => r.riskLevel === 'high' || r.riskLevel === 'critical'
    ).length;

    const thisWeek = Math.floor(reports.length * 0.3);

    return {
      totalApplications: reports.length,
      approved,
      pending,
      rejected,
      avgMatchScore: Math.round(avgMatch),
      highRiskCount: highRisk,
      thisWeek,
    };
  });

  // Get unique filter options
  uniqueStatuses = computed(() => {
    const statuses = new Set(this.reports().map((r) => r.applicationStatus));
    return Array.from(statuses).sort();
  });

  uniqueRisks = computed(() => {
    const risks = new Set(
      this.reports()
        .map((r) => r.riskLevel)
        .filter((r) => r)
    );
    return Array.from(risks).sort();
  });

  // ===================================
  // LIFECYCLE
  // ===================================

  ngOnInit(): void {
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================
  // DATA LOADING
  // ===================================

  loadReports(): void {
    this.loading.set(true);
    this.error.set(null);

    this.generator
      .generateReports()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const enrichedReports = data.map((report, index) =>
            this.enrichReportWithActivity(report, index)
          );

          this.reports.set(enrichedReports);
          this.applyFilters();
          this.loading.set(false);

          console.log(`✅ Loaded ${enrichedReports.length} activity reports`);
        },
        error: (err) => {
          const message = err?.message || 'Failed to load reports';
          this.error.set(message);
          this.loading.set(false);
          console.error('❌ Error loading reports:', err);
        },
      });
  }

  refreshReports(): void {
    this.loading.set(true);
    this.error.set(null);

    this.generator
      .generateReports()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const enrichedReports = data.map((report, index) =>
            this.enrichReportWithActivity(report, index)
          );

          this.reports.set(enrichedReports);
          this.applyFilters();
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to refresh');
          this.loading.set(false);
        },
      });
  }

  // ===================================
  // FILTERING & SORTING
  // ===================================

  applyFilters(): void {
    let results = [...this.reports()];

    // Search
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      results = results.filter(
        (r) =>
          r.nameOfBusiness.toLowerCase().includes(query) ||
          r.fundingOpportunity.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.selectedStatus()) {
      results = results.filter(
        (r) => r.applicationStatus === this.selectedStatus()
      );
    }

    // Risk filter
    if (this.selectedRisk()) {
      results = results.filter((r) => r.riskLevel === this.selectedRisk());
    }

    // Apply sorting
    results.sort((a, b) => {
      switch (this.sortBy()) {
        case 'risk':
          const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return (
            (riskOrder[a.riskLevel || 'low'] || 3) -
            (riskOrder[b.riskLevel || 'low'] || 3)
          );
        case 'match':
          return (b.matchScore || 0) - (a.matchScore || 0);
        case 'alphabetical':
          return a.nameOfBusiness.localeCompare(b.nameOfBusiness);
        case 'recent':
        default:
          return a.no - b.no;
      }
    });

    this.filteredReports.set(results);
    this.currentPage.set(0);
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedStatus.set('');
    this.selectedRisk.set('');
    this.sortBy.set('recent');
    this.applyFilters();
  }

  // ===================================
  // PAGINATION
  // ===================================

  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // ===================================
  // DETAIL VIEW
  // ===================================

  openReport(report: ActivityReport): void {
    this.selectedReport.set(report);
    this.sheetOpen.set(true);
  }

  closeSheet(): void {
    this.sheetOpen.set(false);
    setTimeout(() => {
      this.selectedReport.set(null);
    }, 300);
  }

  // ===================================
  // EXPORT
  // ===================================

  async exportToExcel(): Promise<void> {
    if (this.filteredReports().length === 0) {
      this.error.set('No reports to export');
      return;
    }

    this.exporting.set(true);
    try {
      await this.exporter.exportToExcel(this.filteredReports());
      console.log('✅ Export to Excel successful');
    } catch (err) {
      this.error.set('Failed to export to Excel');
      console.error('Export error:', err);
    } finally {
      this.exporting.set(false);
    }
  }

  async exportToPDF(): Promise<void> {
    if (this.filteredReports().length === 0) {
      this.error.set('No reports to export');
      return;
    }

    this.exporting.set(true);
    try {
      await this.exporter.exportToPDF(this.filteredReports());
      console.log('✅ Export to PDF successful');
    } catch (err) {
      this.error.set('Failed to export to PDF');
      console.error('Export error:', err);
    } finally {
      this.exporting.set(false);
    }
  }

  // ===================================
  // DATA ENRICHMENT
  // ===================================

  private enrichReportWithActivity(
    report: KapifyReports,
    index: number
  ): ActivityReport {
    const matchScore = this.calculateMatchScore(report);
    const riskLevel = this.calculateRiskLevel(report);
    const completionScore = this.calculateCompletionScore(report);
    const actionType = this.getActionType(report);
    const timeline = this.getTimeline(report);

    return {
      ...report,
      matchScore,
      riskLevel,
      completionScore,
      actionType,
      timeline,
    };
  }

  private calculateMatchScore(report: KapifyReports): number {
    let score = 50;
    if (report.applicationStatus === 'Approved') score += 30;
    else if (report.applicationStatus === 'Rejected') score -= 30;
    if (report.yearsInOperation > 3) score += 10;
    if (report.bbbeeLeve && report.bbbeeLeve !== 'Non-Compliant') score += 10;
    if (report.priorYearAnnualRevenue > 500000) score += 10;
    return Math.min(100, Math.max(0, score));
  }

  private calculateRiskLevel(
    report: KapifyReports
  ): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;
    if (report.applicationStatus === 'Rejected') riskScore += 40;
    else if (report.applicationStatus === 'Draft') riskScore += 20;
    if (!report.bbbeeLeve || report.bbbeeLeve === 'Non-Compliant')
      riskScore += 20;
    if (report.priorYearAnnualRevenue < 100000) riskScore += 20;
    if (report.yearsInOperation < 1) riskScore += 20;

    if (riskScore >= 60) return 'critical';
    if (riskScore >= 40) return 'high';
    if (riskScore >= 20) return 'medium';
    return 'low';
  }

  private calculateCompletionScore(report: KapifyReports): number {
    let filled = 0;
    const fields = [
      report.nameOfBusiness,
      report.industry,
      report.physicalAddress,
      report.businessDetails,
      report.yearsInOperation,
      report.numberOfEmployees,
      report.bbbeeLeve,
      report.priorYearAnnualRevenue,
      report.firstName,
      report.surname,
      report.email,
      report.phoneNumber,
      report.amountRequested,
      report.fundingType,
      report.fundingOpportunity,
      report.useOfFunds,
    ];
    filled = fields.filter((f) => f).length;
    return Math.round((filled / fields.length) * 100);
  }

  private getActionType(
    report: KapifyReports
  ): 'submitted' | 'approved' | 'rejected' | 'updated' | 'created' {
    if (report.applicationStatus === 'Approved') return 'approved';
    if (report.applicationStatus === 'Rejected') return 'rejected';
    if (report.applicationStatus === 'Submitted') return 'submitted';
    if (report.applicationStatus === 'Draft') return 'created';
    return 'updated';
  }

  private getTimeline(report: KapifyReports): {
    createdDaysAgo: number;
    status: string;
    icon: string;
  } {
    // Mock timeline data
    const daysAgo = Math.floor(Math.random() * 30);
    const statuses = ['Just now', 'Today', 'This week', 'This month'];
    let status = statuses[0];
    let icon = 'zap';

    if (daysAgo > 7) {
      status = 'This month';
      icon = 'calendar';
    } else if (daysAgo > 1) {
      status = 'This week';
      icon = 'clock';
    } else if (daysAgo > 0) {
      status = 'Today';
      icon = 'sun';
    }

    return { createdDaysAgo: daysAgo, status, icon };
  }

  // ===================================
  // FORMATTING & DISPLAY
  // ===================================

  getStatusIcon(status: string): string {
    const iconMap: Record<string, string> = {
      Approved: 'check-circle-2',
      Rejected: 'x-circle',
      'Under Review': 'clock',
      Submitted: 'send',
      Draft: 'file-text',
      Review: 'eye',
      Withdrawn: 'slash',
    };
    return iconMap[status] || 'file-text';
  }

  getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      Approved: 'text-green-600 bg-green-50 border-green-200/50',
      Rejected: 'text-red-600 bg-red-50 border-red-200/50',
      'Under Review': 'text-amber-600 bg-amber-50 border-amber-200/50',
      Submitted: 'text-blue-600 bg-blue-50 border-blue-200/50',
      Draft: 'text-slate-600 bg-slate-50 border-slate-200',
      Review: 'text-amber-600 bg-amber-50 border-amber-200/50',
      Withdrawn: 'text-slate-500 bg-slate-50 border-slate-200',
    };
    return colorMap[status] || 'text-slate-600 bg-slate-50 border-slate-200';
  }

  getRiskIcon(risk: string): string {
    const iconMap: Record<string, string> = {
      critical: 'alert-triangle',
      high: 'alert-circle',
      medium: 'info',
      low: 'check',
    };
    return iconMap[risk] || 'help-circle';
  }

  getRiskColor(risk: string): string {
    const colorMap: Record<string, string> = {
      critical: 'text-red-600 bg-red-50 border-red-200/50',
      high: 'text-amber-600 bg-amber-50 border-amber-200/50',
      medium: 'text-blue-600 bg-blue-50 border-blue-200/50',
      low: 'text-green-600 bg-green-50 border-green-200/50',
    };
    return colorMap[risk] || 'text-slate-600 bg-slate-50 border-slate-200';
  }

  getMatchScoreColor(score: number): string {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-teal-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-ZA').format(value);
  }

  // Safe Math for templates
  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  mathRound(value: number): number {
    return Math.round(value);
  }
}
