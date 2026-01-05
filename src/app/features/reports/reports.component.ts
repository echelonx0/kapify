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
import { takeUntil, debounceTime } from 'rxjs/operators';
import {
  ReportService,
  Report,
  ReportFilter,
  ReportStats,
  DocumentAnalysis,
  ApplicationAnalysis,
  ActivityRecord,
} from './report.service';
import { FormatDatePipe, FormatTimePipe } from './format-date.pipes';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, FormatDatePipe, FormatTimePipe],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-white border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <div
            class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          >
            <div>
              <h1 class="text-3xl font-bold text-slate-900">Reports</h1>
              <p class="text-slate-600 text-sm mt-1">
                AI-generated analysis reports and activity logs
              </p>
            </div>
            <button
              (click)="refreshReports()"
              [disabled]="isLoading()"
              class="bg-teal-500 text-white font-medium rounded-xl px-6 py-2.5 text-sm
                hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading() ? 'Loading...' : 'Refresh' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        @if (stats(); as s) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <p class="text-slate-600 text-sm font-medium">Total Analyses</p>
            <p class="text-3xl font-bold text-slate-900 mt-2">
              {{ s.totalAnalyses }}
            </p>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <p class="text-slate-600 text-sm font-medium">Avg. Confidence</p>
            <p class="text-3xl font-bold text-slate-900 mt-2">
              {{ s.averageConfidence }}%
            </p>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <p class="text-slate-600 text-sm font-medium">This Month</p>
            <p class="text-3xl font-bold text-slate-900 mt-2">
              {{ s.analysesThisMonth }}
            </p>
          </div>
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <p class="text-slate-600 text-sm font-medium">Latest Report</p>
            <p class="text-base font-semibold text-teal-600 mt-2">
              {{ s.latestTimestamp ? (s.latestTimestamp | formatDate) : 'N/A' }}
            </p>
          </div>
        </div>
        }
      </div>

      <!-- Filters -->
      <div class="max-w-7xl mx-auto px-4 lg:px-8 pb-6">
        <div class="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 class="text-lg font-bold text-slate-900 mb-4">Filters</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Date From -->
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                From Date
              </label>
              <input
                type="date"
                [(ngModel)]="filterDateFrom"
                (change)="onFilterChange()"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl
                  text-slate-900 placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                  transition-all duration-200"
              />
            </div>

            <!-- Date To -->
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                To Date
              </label>
              <input
                type="date"
                [(ngModel)]="filterDateTo"
                (change)="onFilterChange()"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl
                  text-slate-900 placeholder-slate-400
                  focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
                  transition-all duration-200"
              />
            </div>

            <!-- Confidence Filter -->
            <div>
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Min Confidence
              </label>
              <select
                [(ngModel)]="filterConfidence"
                (change)="onFilterChange()"
                class="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl
                  text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500
                  focus:border-transparent transition-all duration-200"
              >
                <option value="">All Scores</option>
                <option value="80">80% or higher</option>
                <option value="90">90% or higher</option>
                <option value="95">95% or higher</option>
              </select>
            </div>
          </div>

          <!-- Reset Button -->
          <button
            (click)="resetFilters()"
            class="mt-4 text-slate-600 font-medium text-sm
              hover:text-slate-900 transition-colors duration-200"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <!-- Reports List -->
      <div class="max-w-7xl mx-auto px-4 lg:px-8 pb-12">
        @if (isLoading()) {
        <div class="text-center py-12">
          <div
            class="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto"
          ></div>
          <p class="text-slate-600 text-sm mt-4">Loading reports...</p>
        </div>
        } @else if (error()) {
        <div
          class="bg-red-50 border border-red-200/50 rounded-2xl p-6 flex items-start gap-3"
        >
          <div
            class="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0"
          >
            ⚠️
          </div>
          <div>
            <p class="text-red-700 font-medium">Error loading reports</p>
            <p class="text-red-600 text-sm mt-1">{{ error() }}</p>
          </div>
        </div>
        } @else if (filteredReports().length === 0) {
        <div class="text-center py-16">
          <div class="text-6xl mb-4">📭</div>
          <p class="text-slate-900 font-semibold text-lg">No reports found</p>
          <p class="text-slate-600 text-sm mt-2">
            Try adjusting your filters or check back later
          </p>
        </div>
        } @else {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          @for (report of filteredReports(); track report.id) {
          <div
            class="bg-white rounded-2xl border border-slate-200 p-6
                  hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer"
            (click)="toggleExpandedReport(report.id)"
          >
            <!-- Report Header -->
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <!-- Title -->
                <div class="flex items-center gap-2 mb-2">
                  <span
                    class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                          {{ getReportBadgeClass(report) }}"
                  >
                    {{ getReportTypeBadge(report) }}
                  </span>
                </div>

                <h3 class="text-base font-semibold text-slate-900 truncate">
                  {{ getReportTitle(report) }}
                </h3>

                <!-- Metadata -->
                <p class="text-xs text-slate-500 mt-1">
                  {{ report.createdAt | formatTime }}
                </p>
              </div>

              <!-- Confidence Score -->
              @if ( report.type === 'document' || report.type === 'application'
              ) {
              <div class="ml-4 flex flex-col items-end">
                <p class="text-2xl font-bold text-teal-600">
                  {{ report.confidenceScore }}%
                </p>
                <p class="text-xs text-slate-500">Confidence</p>
              </div>
              }
            </div>

            <!-- Expanded Details -->
            @if (isReportExpanded(report.id)) {
            <div class="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <!-- Document Analysis Details -->
              @if (report.type === 'document') {
              <ng-container
                *ngTemplateOutlet="
                  documentDetails;
                  context: { $implicit: report }
                "
              ></ng-container>
              }

              <!-- Application Analysis Details -->
              @if (report.type === 'application') {
              <ng-container
                *ngTemplateOutlet="
                  applicationDetails;
                  context: { $implicit: report }
                "
              ></ng-container>
              }

              <!-- Activity Record Details -->
              @if (report.type === 'activity') {
              <ng-container
                *ngTemplateOutlet="
                  activityDetails;
                  context: { $implicit: report }
                "
              ></ng-container>
              }
            </div>
            }
          </div>
          }
        </div>
        }
      </div>
    </div>

    <!-- Document Details Template -->
    <ng-template #documentDetails let-report>
      <div>
        <p class="text-sm text-slate-600">
          <span class="font-semibold">Type:</span> {{ report.analysisType }}
        </p>
        <p class="text-sm text-slate-600 mt-1">
          <span class="font-semibold">Processing:</span>
          {{ report.processingTimeMs }}ms
        </p>
        @if (report.sources && report.sources.length > 0) {
        <div class="mt-2">
          <p class="text-sm font-semibold text-slate-700">Sources:</p>
          <div class="flex flex-wrap gap-1 mt-1">
            @for (source of report.sources; track source) {
            <span
              class="inline-flex px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs"
            >
              {{ source }}
            </span>
            }
          </div>
        </div>
        }
      </div>
    </ng-template>

    <!-- Application Details Template -->
    <ng-template #applicationDetails let-report>
      <div>
        <p class="text-sm text-slate-600">
          <span class="font-semibold">Model:</span> {{ report.modelVersion }}
        </p>
        <p class="text-sm text-slate-600 mt-1">
          <span class="font-semibold">Processing:</span>
          {{ report.processingTimeMs }}ms
        </p>
        <p class="text-sm text-slate-600 mt-1">
          <span class="font-semibold">Expires:</span>
          {{ report.expiresAt | formatDate }}
        </p>
        @if ( report.analysisResult?.recommendations &&
        report.analysisResult.recommendations.length > 0 ) {
        <div class="mt-2">
          <p class="text-sm font-semibold text-slate-700">
            Key Recommendations:
          </p>
          <ul class="list-disc list-inside mt-1 space-y-1">
            @for (rec of report.analysisResult.recommendations.slice(0, 3);
            track rec) {
            <li class="text-sm text-slate-600">{{ rec }}</li>
            }
          </ul>
        </div>
        }
      </div>
    </ng-template>

    <!-- Activity Details Template -->
    <ng-template #activityDetails let-report>
      <div>
        <p class="text-sm text-slate-600">
          <span class="font-semibold">Action:</span> {{ report.action }}
        </p>
        <p class="text-sm text-slate-600 mt-1">{{ report.message }}</p>
      </div>
    </ng-template>
  `,
  styles: [],
})
export class ReportsComponent implements OnInit, OnDestroy {
  private reportService = inject(ReportService);
  private destroy$ = new Subject<void>();
  private filterChange$ = new Subject<void>();

  // State signals
  isLoading = signal(false);
  error = signal<string | null>(null);
  reports = signal<Report[]>([]);
  stats = signal<ReportStats | null>(null);
  expandedReports = signal<Set<string>>(new Set());

  // Filter signals
  filterDateFrom = signal<string>(this.getLast30DaysDate());
  filterDateTo = signal<string>(new Date().toISOString().split('T')[0]);
  filterConfidence = signal<string>('');

  // Computed
  filteredReports = computed(() => {
    const all = this.reports();
    const confMin = this.filterConfidence()
      ? parseInt(this.filterConfidence())
      : 0;

    return all.filter((r) => {
      if ((r.type === 'document' || r.type === 'application') && confMin > 0) {
        return r.confidenceScore >= confMin;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.loadReports();
    this.setupFilterDebounce();
  }

  private setupFilterDebounce(): void {
    this.filterChange$
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadReports();
      });
  }

  private loadReports(): void {
    this.isLoading.set(true);
    this.error.set(null);

    const filter: ReportFilter = {
      dateFrom: new Date(this.filterDateFrom()),
      dateTo: new Date(this.filterDateTo()),
      confidenceMin: this.filterConfidence()
        ? parseInt(this.filterConfidence())
        : undefined,
    };

    this.reportService
      .getReports(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reports) => {
          this.reports.set(reports);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set(err?.message || 'Failed to load reports');
          this.isLoading.set(false);
        },
      });

    this.reportService
      .getReportStats(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => this.stats.set(stats),
        error: (error) => {
          console.error(error);
        },
      });
  }

  refreshReports(): void {
    this.reportService.clearCache();
    this.loadReports();
  }

  onFilterChange(): void {
    this.filterChange$.next();
  }

  resetFilters(): void {
    this.filterDateFrom.set(this.getLast30DaysDate());
    this.filterDateTo.set(new Date().toISOString().split('T')[0]);
    this.filterConfidence.set('');
    this.onFilterChange();
  }

  toggleExpandedReport(reportId: string): void {
    const expanded = new Set(this.expandedReports());
    if (expanded.has(reportId)) {
      expanded.delete(reportId);
    } else {
      expanded.add(reportId);
    }
    this.expandedReports.set(expanded);
  }

  isReportExpanded(reportId: string): boolean {
    return this.expandedReports().has(reportId);
  }

  getReportTitle(report: Report): string {
    if (report.type === 'document') {
      return (report as DocumentAnalysis).fileName;
    }
    if (report.type === 'application') {
      return `Application: ${(report as ApplicationAnalysis).applicationId}`;
    }
    return (report as ActivityRecord).message.substring(0, 50);
  }

  getReportTypeBadge(report: Report): string {
    if (report.type === 'document') {
      return (report as DocumentAnalysis).analysisType.replace('_', ' ');
    }
    return report.type.charAt(0).toUpperCase() + report.type.slice(1);
  }

  getReportBadgeClass(report: Report): string {
    const base = 'bg-teal-50 text-teal-700 border border-teal-300/50';
    if (report.type === 'activity') {
      return 'bg-blue-50 text-blue-700 border border-blue-300/50';
    }
    if (report.type === 'document' || report.type === 'application') {
      const conf = report.confidenceScore;
      if (conf >= 90)
        return 'bg-green-50 text-green-700 border border-green-200/50';
      if (conf >= 80) return base;
      return 'bg-amber-50 text-amber-700 border border-amber-200/50';
    }
    return base;
  }

  private getLast30DaysDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
