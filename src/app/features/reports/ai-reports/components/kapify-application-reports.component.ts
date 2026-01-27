import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Loader,
  Eye,
  Download,
  Trash2,
  ChevronRight,
  Clock,
  FileText,
  X,
  AlertCircle,
} from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import {
  KapifyReportsService,
  KapifyApplicationReport,
} from '../../services/kapify-reports.service';
import { KapifyReportsExportService } from '../../services/kapify-reports-export.service';
import { KapifyReportViewComponent } from './kapify-report-view.component';

@Component({
  selector: 'app-kapify-application-reports',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, KapifyReportViewComponent],
  template: `<div class="space-y-8">
    <!-- Loading State -->
    @if (loading()) {
    <div class="text-center py-16">
      <div
        class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4"
      >
        <lucide-angular
          [img]="LoaderIcon"
          size="24"
          class="text-teal-600 animate-spin"
        ></lucide-angular>
      </div>
      <p class="text-slate-600 font-medium">Loading saved reports...</p>
    </div>
    }

    <!-- Empty State -->
    @if (!loading() && allReports().length === 0) {
    <div class="text-center py-16 bg-white rounded-2xl border border-slate-200">
      <div
        class="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-100 mb-4"
      >
        <lucide-angular
          [img]="FileTextIcon"
          size="24"
          class="text-slate-400"
        ></lucide-angular>
      </div>
      <h3 class="text-lg font-bold text-slate-900 mb-2">No saved reports</h3>
      <p class="text-slate-600">
        Generate and save application reports to see them here
      </p>
    </div>
    }

    <!-- Reports List -->
    @if (!loading() && paginatedReports().length > 0) {
    <div class="space-y-4">
      @for (report of paginatedReports(); track report.id) {
      <div
        [class.animate-out]="deletingId() === report.id"
        class="bg-white rounded-2xl border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden"
        [style]="getCardAnimationStyle(report.id)"
      >
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-start justify-between gap-4 mb-4">
            <div class="flex-1">
              <h4 class="text-lg font-bold text-slate-900 mb-2">
                {{ report.title }}
              </h4>

              <!-- Key Metrics -->
              <div class="flex items-center gap-4 text-sm text-slate-600">
                <span class="flex items-center gap-1">
                  Records:
                  <strong class="text-slate-900">{{
                    report.report_data.length
                  }}</strong>
                </span>
                <span>•</span>
                <span>
                  Format:
                  <strong class="text-slate-900 uppercase">{{
                    report.export_config.format
                  }}</strong>
                </span>
                <span>•</span>
                <span>
                  Fields:
                  <strong class="text-slate-900">{{
                    report.export_config.selectedFields.length
                  }}</strong>
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2">
              <button
                (click)="onViewClick(report)"
                class="p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors duration-200"
                title="View Report"
              >
                <lucide-angular [img]="EyeIcon" size="18"></lucide-angular>
              </button>
              <button
                (click)="onDownloadClick(report)"
                [disabled]="downloadingId() === report.id"
                class="p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                title="Download Report"
              >
                <lucide-angular [img]="DownloadIcon" size="18"></lucide-angular>
              </button>
              <button
                (click)="onDeleteClick(report)"
                class="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Delete Report"
              >
                <lucide-angular [img]="Trash2Icon" size="18"></lucide-angular>
              </button>
            </div>
          </div>

          <!-- Metadata -->
          <div class="flex items-center gap-4 text-sm text-slate-500">
            <span class="flex items-center gap-1">
              <lucide-angular [img]="ClockIcon" size="14"></lucide-angular>
              {{ report.created_at | date : 'MMM d, yyyy h:mm a' }}
            </span>
          </div>
        </div>
      </div>
      }

      <!-- Pagination -->
      @if (totalPages() > 1) {
      <div
        class="flex items-center justify-between mt-8 pt-8 border-t border-slate-200"
      >
        <p class="text-sm font-semibold text-slate-600">
          Showing {{ currentPage() * pageSize() + 1 }}-{{
            Math.min((currentPage() + 1) * pageSize(), allReports().length)
          }}
          of {{ allReports().length }}
        </p>

        <div class="flex items-center gap-2">
          <button
            (click)="previousPage()"
            [disabled]="currentPage() === 0"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <lucide-angular [img]="ChevronRightIcon" size="16"></lucide-angular>
            Previous
          </button>

          <div class="flex items-center gap-1">
            <span class="text-sm text-slate-600 font-medium">
              {{ currentPage() + 1 }} / {{ totalPages() }}
            </span>
          </div>

          <button
            (click)="nextPage()"
            [disabled]="currentPage() >= totalPages() - 1"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <lucide-angular [img]="ChevronRightIcon" size="16"></lucide-angular>
          </button>
        </div>
      </div>
      }
    </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (deleteConfirmOpen()) {
    <div
      (click)="closeDeleteConfirm()"
      class="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 transition-opacity duration-300 animate-fade-in"
    ></div>

    <div
      class="fixed inset-0 flex items-center justify-center z-50 p-4 transition-all duration-300 animate-fade-in"
    >
      <div
        (click)="$event.stopPropagation()"
        class="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full animate-scale-in"
      >
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-200">
          <h3 class="text-lg font-bold text-slate-900">Delete Report?</h3>
        </div>

        <!-- Content -->
        <div class="px-6 py-4 space-y-4">
          <div
            class="bg-red-50 border border-red-200/50 rounded-xl p-4 flex items-start gap-3"
          >
            <lucide-angular
              [img]="AlertCircle"
              size="20"
              class="text-red-600 flex-shrink-0 mt-0.5"
            ></lucide-angular>
            <div class="flex-1">
              <p class="text-sm font-medium text-red-700">
                This action cannot be undone
              </p>
              <p class="text-sm text-red-600 mt-1">
                The report and all associated data will be permanently deleted.
              </p>
            </div>
          </div>

          @if (deleteReportToConfirm(); as report) {
          <div class="space-y-2 text-sm">
            <p class="text-slate-600">
              <span class="font-medium text-slate-900">{{ report.title }}</span>
            </p>
            <p class="text-slate-500">
              Records: {{ report.report_data.length }}
            </p>
            <p class="text-slate-500">
              Created {{ report.created_at | date : 'MMM d, yyyy h:mm a' }}
            </p>
          </div>
          }
        </div>

        <!-- Footer -->
        <div
          class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3"
        >
          <button
            (click)="closeDeleteConfirm()"
            [disabled]="deletingId() !== null"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            (click)="confirmDelete()"
            [disabled]="deletingId() !== null"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
          >
            @if (deletingId()) {
            <lucide-angular
              [img]="LoaderIcon"
              size="16"
              class="animate-spin"
            ></lucide-angular>
            <span>Deleting...</span>
            } @else {
            <lucide-angular [img]="Trash2Icon" size="16"></lucide-angular>
            <span>Delete</span>
            }
          </button>
        </div>
      </div>
    </div>
    }

    <!-- View Report Modal -->
    @if (viewReportOpen() && selectedReport(); as report) {
    <div
      (click)="closeViewReport()"
      class="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 transition-opacity duration-300"
    ></div>

    <div
      class="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto transition-all duration-300"
    >
      <div
        (click)="$event.stopPropagation()"
        class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-6xl my-8"
      >
        <!-- Header -->
        <div
          class="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between rounded-t-2xl"
        >
          <div>
            <h3 class="text-lg font-bold text-slate-900">
              {{ report.title }}
            </h3>
            <p class="text-sm text-slate-600 mt-1">
              {{ report.report_data.length }} records •
              {{ report.created_at | date : 'MMM d, yyyy h:mm a' }}
            </p>
          </div>
          <button
            (click)="closeViewReport()"
            class="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <lucide-angular [img]="XIcon" size="20"></lucide-angular>
          </button>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto max-h-[70vh] px-8 py-6">
          <app-kapify-report-view
            [report]="selectedReport"
            (onClose)="closeViewReport()"
          ></app-kapify-report-view>
        </div>
      </div>
    </div>
    }
  </div>`,
  styles: [
    `
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      @keyframes slideOutLeft {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(-100%);
        }
      }

      .animate-fade-in {
        animation: fadeIn 300ms ease-out;
      }

      .animate-scale-in {
        animation: scaleIn 300ms ease-out;
      }

      .animate-out {
        animation: slideOutLeft 300ms ease-in-out forwards;
      }
    `,
  ],
})
export class KapifyApplicationReportsComponent implements OnInit, OnDestroy {
  private reportsService = inject(KapifyReportsService);
  private exportService = inject(KapifyReportsExportService);
  private destroy$ = new Subject<void>();

  // Expose Math to template
  Math = Math;

  // Icons
  LoaderIcon = Loader;
  EyeIcon = Eye;
  DownloadIcon = Download;
  Trash2Icon = Trash2;
  ChevronRightIcon = ChevronRight;
  ClockIcon = Clock;
  FileTextIcon = FileText;
  XIcon = X;
  AlertCircle = AlertCircle;

  // State
  loading = signal(false);
  allReports = signal<KapifyApplicationReport[]>([]);
  currentPage = signal(0);
  pageSize = signal(8);
  deleteConfirmOpen = signal(false);
  viewReportOpen = signal(false);
  selectedReport = signal<KapifyApplicationReport | null>(null);
  deleteReportToConfirm = signal<KapifyApplicationReport | null>(null);
  deletingId = signal<string | null>(null);
  downloadingId = signal<string | null>(null);

  // Computed - Simple, clean logic
  totalPages = computed(() =>
    Math.ceil(this.allReports().length / this.pageSize())
  );

  paginatedReports = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.allReports().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all reports
   */
  private loadReports(): void {
    this.loading.set(true);
    this.reportsService
      .getReportsForOrganization()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reports) => {
          this.allReports.set(reports);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  /**
   * View report details
   */
  onViewClick(report: KapifyApplicationReport): void {
    this.selectedReport.set(report);
    this.viewReportOpen.set(true);
  }

  closeViewReport(): void {
    this.viewReportOpen.set(false);
    this.selectedReport.set(null);
  }

  /**
   * Download report
   */
  async onDownloadClick(report: KapifyApplicationReport): Promise<void> {
    this.downloadingId.set(report.id);

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `${report.title}_${timestamp}`;

      // Use the export service with report data and config
      await this.exportService.exportReport(
        report.report_data,
        report.export_config,
        fileName
      );
    } catch (error) {
      console.error('❌ Download failed:', error);
    } finally {
      this.downloadingId.set(null);
    }
  }

  /**
   * Delete confirmation
   */
  onDeleteClick(report: KapifyApplicationReport): void {
    this.deleteReportToConfirm.set(report);
    this.deleteConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this.deleteConfirmOpen.set(false);
    this.deleteReportToConfirm.set(null);
  }

  /**
   * Confirm delete
   */
  confirmDelete(): void {
    const report = this.deleteReportToConfirm();
    if (!report) return;

    this.deletingId.set(report.id);

    this.reportsService
      .deleteReport(report.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deletingId.set(null);
          this.closeDeleteConfirm();
          this.loadReports(); // Refresh the list
        },
        error: () => {
          this.deletingId.set(null);
        },
      });
  }

  /**
   * Pagination
   */
  nextPage(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  /**
   * Card animation style
   */
  getCardAnimationStyle(reportId: string): { [key: string]: string } {
    return this.deletingId() === reportId
      ? { opacity: '0', transform: 'translateX(-100%)' }
      : {};
  }
}
