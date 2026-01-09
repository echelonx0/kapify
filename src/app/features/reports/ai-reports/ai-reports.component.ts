// import {
//   Component,
//   OnInit,
//   OnDestroy,
//   inject,
//   signal,
//   computed,
//   ViewChild,
//   effect,
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Subject, takeUntil } from 'rxjs';
// import {
//   LucideAngularModule,
//   FileText,
//   RefreshCcw,
//   Loader2,
//   TriangleAlert,
//   Search,
//   X,
//   ChevronRight,
//   TrendingUp,
//   Inbox,
// } from 'lucide-angular';
// import { AuthService } from 'src/app/auth/services/production.auth.service';

// import { ApplicationsStatsComponent } from '../analysis-history/components/applications-stats.component';
// import {
//   ReportBuilderComponent,
//   ReportBuilderData,
// } from '../analysis-history/components/report-builder-modal-premium.component';
// import { KapifyReports } from '../models/kapify-reports.interface';
// import { KapifyReportsExportService } from '../services/kapify-reports-export.service';
// import { KapifyReportsGeneratorService } from '../services/kapify-reports-generator.service';
// import { AIAnalysisHistoryComponent } from '../analysis-history/analysis-history.component';

// interface ActivityReport extends KapifyReports {
//   matchScore?: number;
//   completionScore?: number;
//   timeline?: {
//     createdDaysAgo: number;
//     status: string;
//   };
//   createdAt?: Date | string;
// }

// @Component({
//   selector: 'app-ai-reports',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     LucideAngularModule,
//     AIAnalysisHistoryComponent,
//     ApplicationsStatsComponent,
//     ReportBuilderComponent,
//   ],
//   templateUrl: './ai-reports.component.html',
//   styleUrl: './ai-reports.component.css',
// })
// export class AIReportsComponent implements OnInit, OnDestroy {
//   private generator = inject(KapifyReportsGeneratorService);
//   private exporter = inject(KapifyReportsExportService);
//   private authService = inject(AuthService);
//   private destroy$ = new Subject<void>();

//   @ViewChild(AIAnalysisHistoryComponent)
//   analysisHistoryComponent!: AIAnalysisHistoryComponent;

//   @ViewChild(ReportBuilderComponent)
//   reportBuilderComponent!: ReportBuilderComponent;

//   // User context
//   userType = computed(() => this.authService.user()?.userType || null);
//   isFunder = computed(() => this.userType() === 'funder');
//   isSME = computed(() => this.userType() === 'sme');

//   // Tab management
//   activeTab = signal<'applications' | 'analysis'>('applications');

//   // Report Builder
//   reportBuilderOpen = signal(false);

//   // Application Data
//   reports = signal<ActivityReport[]>([]);
//   filteredReports = signal<ActivityReport[]>([]);
//   loading = signal(true);
//   exporting = signal(false);
//   error = signal<string | null>(null);

//   selectedReport = signal<ActivityReport | null>(null);
//   sheetOpen = signal(false);

//   searchQuery = signal('');
//   selectedStatus = signal('');
//   selectedProvinces = signal<string[]>([]);
//   startDate = signal<string>('');
//   endDate = signal<string>('');

//   pageSize = signal(8);
//   currentPage = signal(0);

//   /* ================= COMPUTED ================= */

//   hasReports = computed(() => this.reports().length > 0);
//   filteredCount = computed(() => this.filteredReports().length);

//   totalPages = computed(() =>
//     Math.max(1, Math.ceil(this.filteredCount() / this.pageSize()))
//   );

//   paginatedReports = computed(() => {
//     const start = this.currentPage() * this.pageSize();
//     return this.filteredReports().slice(start, start + this.pageSize());
//   });

//   uniqueStatuses = computed(() =>
//     Array.from(new Set(this.reports().map((r) => r.applicationStatus))).sort()
//   );

//   uniqueProvinces = computed(() =>
//     Array.from(new Set(this.reports().map((r) => r.province)))
//       .filter(Boolean)
//       .sort()
//   );

//   activitySummary = computed(() => {
//     const reports = this.reports();
//     const totalApplications = reports.length;
//     const approved = reports.filter(
//       (r) => r.applicationStatus === 'Approved'
//     ).length;
//     const pending = reports.filter(
//       (r) => r.applicationStatus === 'Under Review'
//     ).length;
//     const avgMatchScore =
//       reports.length === 0
//         ? 0
//         : Math.round(
//             reports.reduce((sum, r) => sum + (r.matchScore ?? 0), 0) /
//               reports.length
//           );

//     return { totalApplications, approved, pending, avgMatchScore };
//   });

//   // Report builder data
//   reportBuilderData = computed(
//     (): ReportBuilderData => ({
//       allRecords: this.reports().map((r) => ({
//         id: r.phoneNumber || '',
//         no: r.no || 0,
//         nameOfBusiness: r.nameOfBusiness,
//         industry: r.industry,
//         businessStage: r.businessStage,
//         yearsInOperation: r.yearsInOperation,
//         numberOfEmployees: r.numberOfEmployees,
//         province: r.province,
//         priorYearAnnualRevenue: r.priorYearAnnualRevenue,
//         firstName: r.firstName,
//         surname: r.surname,
//         email: r.email,
//         phoneNumber: r.phoneNumber,
//         amountRequested: r.amountRequested,
//         fundingType: r.fundingType,
//         applicationStatus: r.applicationStatus,
//         createdAt: r.createdAt || new Date(),
//       })),
//     })
//   );

//   /* ================= ICONS ================= */

//   readonly RefreshIcon = RefreshCcw;
//   readonly LoaderIcon = Loader2;
//   readonly SearchIcon = Search;
//   readonly CloseIcon = X;
//   readonly FileIcon = FileText;
//   readonly TableIcon = TrendingUp;
//   readonly AlertIcon = TriangleAlert;
//   readonly InboxIcon = Inbox;
//   readonly ChevronRightIcon = ChevronRight;

//   constructor() {
//     console.log('I am firing here');

//     // Auto-switch tab based on user type
//     effect(() => {
//       if (this.isSME()) {
//         console.log('The user is an SME');
//         this.activeTab.set('analysis');
//       } else if (this.isFunder()) {
//         console.log('The user is a Funder');
//         this.activeTab.set('applications');
//       }
//     });
//   }

//   ngOnInit(): void {
//     this.loadReports();
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   loadReports(): void {
//     // SMEs don't need to load application reports
//     if (this.isSME()) {
//       this.loading.set(false);
//       return;
//     }

//     // Get funderId from auth service (for funders)
//     const funderId = this.authService.getCurrentUserOrganizationId();

//     if (!funderId) {
//       this.error.set('Organization ID not found. Please log in again.');
//       this.loading.set(false);
//       return;
//     }

//     this.loading.set(true);
//     this.generator
//       .generateReports(funderId)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (data) => {
//           this.reports.set(data.map((r) => this.enrichReport(r)));
//           this.applyFilters();
//           this.loading.set(false);
//         },
//         error: (err) => {
//           console.error('Error loading reports:', err);
//           this.error.set('Failed to load reports');
//           this.loading.set(false);
//         },
//       });
//   }

//   refreshReports(): void {
//     this.loadReports();
//   }

//   switchTab(tab: 'applications' | 'analysis'): void {
//     this.activeTab.set(tab);
//   }

//   /* ================= REPORT BUILDER ================= */

//   generateReports(): void {
//     console.log(
//       '📊 Opening report builder with',
//       this.reports().length,
//       'reports'
//     );
//     this.reportBuilderOpen.set(true);

//     // Open the report builder component modal
//     setTimeout(() => {
//       if (this.reportBuilderComponent) {
//         this.reportBuilderComponent.open();
//       }
//     }, 0);
//   }

//   closeReportBuilder(): void {
//     this.reportBuilderOpen.set(false);
//   }

//   /* ================= FILTERING ================= */

//   onFilterChange(): void {
//     this.applyFilters();
//   }

//   applyFilters(): void {
//     let results = [...this.reports()];

//     if (this.searchQuery()) {
//       const q = this.searchQuery().toLowerCase();
//       results = results.filter(
//         (r) =>
//           r.nameOfBusiness.toLowerCase().includes(q) ||
//           r.fundingOpportunity.toLowerCase().includes(q)
//       );
//     }

//     if (this.selectedStatus()) {
//       results = results.filter(
//         (r) => r.applicationStatus === this.selectedStatus()
//       );
//     }

//     if (this.selectedProvinces().length > 0) {
//       results = results.filter((r) =>
//         this.selectedProvinces().includes(r.province)
//       );
//     }

//     if (this.startDate() || this.endDate()) {
//       const start = this.startDate()
//         ? new Date(this.startDate())
//         : new Date('1900-01-01');
//       const end = this.endDate()
//         ? new Date(this.endDate())
//         : new Date('2099-12-31');

//       results = results.filter((r) => {
//         const reportDate = new Date(r.createdAt || new Date());
//         return reportDate >= start && reportDate <= end;
//       });
//     }

//     this.filteredReports.set(results);
//     this.currentPage.set(0);
//   }

//   clearFilters(): void {
//     this.searchQuery.set('');
//     this.selectedStatus.set('');
//     this.selectedProvinces.set([]);
//     this.startDate.set('');
//     this.endDate.set('');
//     this.applyFilters();
//   }

//   /* ================= PROVINCE MULTI-SELECT ================= */

//   toggleProvince(province: string): void {
//     this.selectedProvinces.update((provinces) => {
//       if (provinces.includes(province)) {
//         return provinces.filter((p) => p !== province);
//       } else {
//         return [...provinces, province];
//       }
//     });
//     this.onFilterChange();
//   }

//   selectAllProvinces(): void {
//     this.selectedProvinces.set([...this.uniqueProvinces()]);
//     this.onFilterChange();
//   }

//   deselectAllProvinces(): void {
//     this.selectedProvinces.set([]);
//     this.onFilterChange();
//   }

//   isProvinceSelected(province: string): boolean {
//     return this.selectedProvinces().includes(province);
//   }

//   /* ================= PAGINATION ================= */

//   previousPage(): void {
//     if (this.currentPage() > 0) {
//       this.currentPage.update((p) => p - 1);
//     }
//   }

//   nextPage(): void {
//     if (this.currentPage() < this.totalPages() - 1) {
//       this.currentPage.update((p) => p + 1);
//     }
//   }

//   /* ================= EXPORT ================= */

//   async exportToExcel(): Promise<void> {
//     this.exporting.set(true);
//     await this.exporter.exportToExcel(this.filteredReports());
//     this.exporting.set(false);
//   }

//   async exportToPDF(): Promise<void> {
//     this.exporting.set(true);
//     await this.exporter.exportToPDF(this.filteredReports());
//     this.exporting.set(false);
//   }

//   /* ================= DETAIL SHEET ================= */

//   openReport(report: ActivityReport): void {
//     this.selectedReport.set(report);
//     this.sheetOpen.set(true);
//   }

//   closeSheet(): void {
//     this.sheetOpen.set(false);
//     setTimeout(() => this.selectedReport.set(null), 300);
//   }

//   /* ================= STATUS HELPERS ================= */

//   getStatusColor(status: string): string {
//     switch (status) {
//       case 'Approved':
//         return 'bg-green-50 border-green-200/50 text-green-700';
//       case 'Rejected':
//         return 'bg-red-50 border-red-200/50 text-red-700';
//       case 'Under Review':
//         return 'bg-amber-50 border-amber-200/50 text-amber-700';
//       default:
//         return 'bg-slate-100 border-slate-200 text-slate-600';
//     }
//   }

//   getMatchScoreColor(score: number): string {
//     if (score >= 80) return 'text-green-600';
//     if (score >= 60) return 'text-amber-600';
//     return 'text-red-600';
//   }

//   /* ================= UTILITIES ================= */

//   mathRound(value: number): number {
//     return Math.round(value);
//   }

//   mathMin(a: number, b: number): number {
//     return Math.min(a, b);
//   }

//   formatCurrency(amount: number): string {
//     return new Intl.NumberFormat('en-ZA', {
//       style: 'currency',
//       currency: 'ZAR',
//       maximumFractionDigits: 0,
//     }).format(amount);
//   }

//   private enrichReport(report: KapifyReports): ActivityReport {
//     return {
//       ...report,
//       matchScore: Math.floor(Math.random() * 40) + 60,
//       completionScore: 80,
//       timeline: {
//         createdDaysAgo: this.getDaysAgo(report.createdAt),
//         status: this.getTimelineStatus(report.createdAt),
//       },
//     };
//   }

//   private getDaysAgo(date: Date | string | undefined): number {
//     if (!date) return 0;
//     const reportDate = new Date(date);
//     const now = new Date();
//     const diffTime = Math.abs(now.getTime() - reportDate.getTime());
//     return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//   }

//   private getTimelineStatus(date: Date | string | undefined): string {
//     const daysAgo = this.getDaysAgo(date);
//     if (daysAgo === 0) return 'Today';
//     if (daysAgo === 1) return 'Yesterday';
//     if (daysAgo < 7) return 'This week';
//     if (daysAgo < 30) return 'This month';
//     return 'Older';
//   }
// }

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  LucideAngularModule,
  FileText,
  RefreshCcw,
  Loader2,
  TriangleAlert,
  Search,
  X,
  ChevronRight,
  TrendingUp,
  Inbox,
} from 'lucide-angular';
import { AuthService } from 'src/app/auth/services/production.auth.service';

import {
  ReportBuilderComponent,
  ReportBuilderData,
} from '../analysis-history/components/report-builder-modal-premium.component';
import { KapifyReports } from '../models/kapify-reports.interface';
import { KapifyReportsExportService } from '../services/kapify-reports-export.service';
import { KapifyReportsGeneratorService } from '../services/kapify-reports-generator.service';
import { AIAnalysisHistoryComponent } from '../analysis-history/analysis-history.component';
import { DataIntegritySectionComponent } from '../data-integrity-section/data-integrity-section.component';

interface ActivityReport extends KapifyReports {
  matchScore?: number;
  completionScore?: number;
  timeline?: {
    createdDaysAgo: number;
    status: string;
  };
  createdAt?: Date | string;
}

@Component({
  selector: 'app-ai-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    AIAnalysisHistoryComponent,

    ReportBuilderComponent,
    DataIntegritySectionComponent,
  ],
  templateUrl: './ai-reports.component.html',
  styleUrl: './ai-reports.component.css',
})
export class AIReportsComponent implements OnInit, OnDestroy {
  private generator = inject(KapifyReportsGeneratorService);
  private exporter = inject(KapifyReportsExportService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  @ViewChild(AIAnalysisHistoryComponent)
  analysisHistoryComponent!: AIAnalysisHistoryComponent;

  @ViewChild(ReportBuilderComponent)
  reportBuilderComponent!: ReportBuilderComponent;

  // User context
  userType = computed(() => this.authService.user()?.userType || null);
  isFunder = computed(() => this.userType() === 'funder');
  isSME = computed(() => this.userType() === 'sme');

  // Tab management
  activeTab = signal<'applications' | 'analysis'>('applications');

  // Report Builder
  reportBuilderOpen = signal(false);

  // Application Data
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

  // Report builder data
  reportBuilderData = computed(
    (): ReportBuilderData => ({
      allRecords: this.reports().map((r) => ({
        id: r.phoneNumber || '',
        no: r.no || 0,
        nameOfBusiness: r.nameOfBusiness,
        industry: r.industry,
        businessStage: r.businessStage,
        yearsInOperation: r.yearsInOperation,
        numberOfEmployees: r.numberOfEmployees,
        province: r.province,
        priorYearAnnualRevenue: r.priorYearAnnualRevenue,
        firstName: r.firstName,
        surname: r.surname,
        email: r.email,
        phoneNumber: r.phoneNumber,
        amountRequested: r.amountRequested,
        fundingType: r.fundingType,
        applicationStatus: r.applicationStatus,
        createdAt: r.createdAt || new Date(),
      })),
    })
  );

  /* ================= ICONS ================= */

  readonly RefreshIcon = RefreshCcw;
  readonly LoaderIcon = Loader2;
  readonly SearchIcon = Search;
  readonly CloseIcon = X;
  readonly FileIcon = FileText;
  readonly TableIcon = TrendingUp;
  readonly AlertIcon = TriangleAlert;
  readonly InboxIcon = Inbox;
  readonly ChevronRightIcon = ChevronRight;

  constructor() {
    console.log('I am firing here');

    // Auto-switch tab based on user type
    effect(() => {
      if (this.isSME()) {
        console.log('The user is an SME');
        this.activeTab.set('analysis');
      } else if (this.isFunder()) {
        console.log('The user is a Funder');
        this.activeTab.set('applications');
      }
    });
  }

  ngOnInit(): void {
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReports(): void {
    // SMEs don't need to load application reports
    if (this.isSME()) {
      this.loading.set(false);
      return;
    }

    // Get funderId from auth service (for funders)
    const funderId = this.authService.getCurrentUserOrganizationId();

    if (!funderId) {
      this.error.set('Organization ID not found. Please log in again.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.generator
      .generateReports(funderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.reports.set(data.map((r) => this.enrichReport(r)));
          this.applyFilters();
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading reports:', err);
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
  }

  /* ================= REPORT BUILDER ================= */

  generateReports(): void {
    console.log(
      '📊 Opening report builder with',
      this.reports().length,
      'reports'
    );
    this.reportBuilderOpen.set(true);

    // Open the report builder component modal
    setTimeout(() => {
      if (this.reportBuilderComponent) {
        this.reportBuilderComponent.open();
      }
    }, 0);
  }

  closeReportBuilder(): void {
    this.reportBuilderOpen.set(false);
  }

  /* ================= FILTERING ================= */

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let results = [...this.reports()];

    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
      results = results.filter(
        (r) =>
          r.nameOfBusiness.toLowerCase().includes(q) ||
          r.fundingOpportunity.toLowerCase().includes(q)
      );
    }

    if (this.selectedStatus()) {
      results = results.filter(
        (r) => r.applicationStatus === this.selectedStatus()
      );
    }

    if (this.selectedProvinces().length > 0) {
      results = results.filter((r) =>
        this.selectedProvinces().includes(r.province)
      );
    }

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
