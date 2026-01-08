import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Loader,
  Search,
  Eye,
  Download,
  Trash2,
  ChevronRight,
  Clock,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-angular';
import { AnalysisResultsComponent } from '../../ai/document-analysis/components/analysis-results/analysis-results.component';
import { AnalysisReportExportService } from '../../ai/services/ai-analysis-export.service';
import {
  AIAnalysisHistoryService,
  AnalysisResultItem,
} from '../../ai/services/ai-analysis-history.service';

@Component({
  selector: 'app-ai-analysis-history',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AnalysisResultsComponent],
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
      <p class="text-slate-600 font-medium">Loading analysis results...</p>
    </div>
    }

    <!-- Empty State -->
    @if (!loading() && allResults().length === 0) {
    <div class="text-center py-16 bg-white rounded-2xl border border-slate-200">
      <h3 class="text-lg font-bold text-slate-900 mb-2">No analyses yet</h3>
      <p class="text-slate-600">
        Run your first document analysis to see results here
      </p>
    </div>
    }

    <!-- Results List -->
    @if (!loading() && paginatedResults().length > 0) {
    <div class="space-y-4">
      @for (result of paginatedResults(); track result.id) {
      <div
        [class.animate-out]="deletingId() === result.id"
        class="bg-white rounded-2xl border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden"
        [style]="getCardAnimationStyle(result.id)"
      >
        <div class="p-6">
          <!-- Header -->
          <div class="flex items-start justify-between gap-4 mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h4 class="text-lg font-bold text-slate-900">
                  Investment Analysis Report
                </h4>
                <span
                  class="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-300/50"
                >
                  {{ result.result.matchScore }}% Match
                </span>
              </div>

              <!-- Key Metrics Row -->
              <div class="flex items-center gap-4 text-sm text-slate-600">
                <span class="flex items-center gap-1">
                  Success Probability:
                  <strong class="text-slate-900"
                    >{{ result.result.successProbability }}%</strong
                  >
                </span>
                <span>•</span>
                <span>
                  Market Timing:
                  <strong class="text-slate-900 capitalize">{{
                    result.result.marketTimingInsight
                  }}</strong>
                </span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2">
              <button
                (click)="onViewClick(result)"
                class="p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors duration-200"
                title="View Full Report"
              >
                <lucide-angular [img]="EyeIcon" size="18"></lucide-angular>
              </button>
              <button
                (click)="onDownloadClick(result)"
                class="p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors duration-200"
                title="Download PDF"
              >
                <lucide-angular [img]="DownloadIcon" size="18"></lucide-angular>
              </button>
              <button
                (click)="onDeleteClick(result)"
                class="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Delete Analysis"
              >
                <lucide-angular [img]="Trash2Icon" size="18"></lucide-angular>
              </button>
            </div>
          </div>

          <!-- Metadata Row -->
          <div class="flex items-center gap-4 text-sm text-slate-500">
            <span class="flex items-center gap-1">
              <lucide-angular [img]="ClockIcon" size="14"></lucide-angular>
              {{ result.createdAt | date : 'MMM d, yyyy h:mm a' }}
            </span>
            @if (result.result.keyInsights) {
            <span>•</span>
            <span class="text-teal-600 font-medium">
              {{ result.result.keyInsights.length }} insights
            </span>
            }
          </div>
        </div>
      </div>
      }

      <!-- Pagination -->
      <div
        class="flex items-center justify-between mt-8 pt-8 border-t border-slate-200"
      >
        <p class="text-sm font-semibold text-slate-600">
          Showing {{ currentPage() * pageSize() + 1 }}-{{
            Math.min((currentPage() + 1) * pageSize(), allResults().length)
          }}
          of {{ allResults().length }}
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
          <h3 class="text-lg font-bold text-slate-900">Delete Analysis?</h3>
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
                The analysis and all associated data will be permanently
                deleted.
              </p>
            </div>
          </div>

          @if (deleteResultToConfirm()) {
          <div class="space-y-2 text-sm">
            <p class="text-slate-600">
              <span class="font-medium text-slate-900"
                >Investment Analysis Report</span
              >
            </p>
            <p class="text-slate-500">
              Match Score: {{ deleteResultToConfirm()!.result.matchScore }}%
            </p>
            <p class="text-slate-500">
              Created
              {{
                deleteResultToConfirm()!.createdAt | date : 'MMM d, yyyy h:mm a'
              }}
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
    @if (viewReportOpen() && selectedResult()) {
    <div
      (click)="closeViewReport()"
      class="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 transition-opacity duration-300"
    ></div>

    <div
      class="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto transition-all duration-300"
    >
      <div
        (click)="$event.stopPropagation()"
        class="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-4xl my-8"
      >
        <!-- Header -->
        <div
          class="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center"
            >
              <lucide-angular
                [img]="SparklesIcon"
                size="20"
                class="text-teal-600"
              ></lucide-angular>
            </div>
            <h3 class="text-lg font-bold text-slate-900">
              Investment Analysis Report
            </h3>
          </div>
          <button
            (click)="closeViewReport()"
            class="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <lucide-angular [img]="XIcon" size="20"></lucide-angular>
          </button>
        </div>

        <!-- Content -->
        <div class="overflow-y-auto max-h-[70vh]">
          <app-analysis-results
            [result]="selectedResult()!.result"
            [uploadedFileName]="'Analysis Report'"
          ></app-analysis-results>
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
export class AIAnalysisHistoryComponent implements OnInit {
  private historyService = inject(AIAnalysisHistoryService);
  private exportService = inject(AnalysisReportExportService);

  // Expose Math to template
  Math = Math;

  // Icons
  LoaderIcon = Loader;
  SearchIcon = Search;
  EyeIcon = Eye;
  DownloadIcon = Download;
  Trash2Icon = Trash2;
  ChevronRightIcon = ChevronRight;
  ClockIcon = Clock;
  SparklesIcon = Sparkles;
  XIcon = X;
  AlertCircle = AlertCircle;

  // State
  loading = signal(false);
  allResults = signal<AnalysisResultItem[]>([]);
  currentPage = signal(0);
  pageSize = signal(10);
  deleteConfirmOpen = signal(false);
  viewReportOpen = signal(false);
  selectedResult = signal<AnalysisResultItem | null>(null);
  deleteResultToConfirm = signal<AnalysisResultItem | null>(null);
  deletingId = signal<string | null>(null);
  analysisDeletingId = signal<string | null>(null);

  // Computed
  totalPages = computed(() =>
    Math.ceil(this.allResults().length / this.pageSize())
  );
  paginatedResults = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.allResults().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadResults();
  }

  /**
   * Load analysis results
   */
  private loadResults(): void {
    this.loading.set(true);
    this.historyService.getAnalysisHistory().subscribe({
      next: (results) => {
        this.allResults.set(results);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  /**
   * View full report
   */
  onViewClick(result: AnalysisResultItem): void {
    this.selectedResult.set(result);
    this.viewReportOpen.set(true);
  }

  closeViewReport(): void {
    this.viewReportOpen.set(false);
    this.selectedResult.set(null);
  }

  /**
   * Download PDF
   */
  async onDownloadClick(result: AnalysisResultItem): Promise<void> {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `Analysis_${result.result.matchScore}pct_${timestamp}.pdf`;

      await this.exportService.exportToPDF(result.result, fileName);
    } catch (error) {
      console.error('❌ Download failed:', error);
    }
  }

  /**
   * Delete confirmation
   */
  onDeleteClick(result: AnalysisResultItem): void {
    this.deleteResultToConfirm.set(result);
    this.deleteConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this.deleteConfirmOpen.set(false);
    this.deleteResultToConfirm.set(null);
  }

  /**
   * Confirm delete
   */
  confirmDelete(): void {
    const result = this.deleteResultToConfirm();
    if (!result) return;

    this.deletingId.set(result.id);
    this.analysisDeletingId.set(result.id);

    this.historyService.deleteAnalysis(result.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.analysisDeletingId.set(null);
        this.closeDeleteConfirm();
      },
      error: () => {
        this.deletingId.set(null);
        this.analysisDeletingId.set(null);
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
  getCardAnimationStyle(resultId: string): { [key: string]: string } {
    return this.analysisDeletingId() === resultId
      ? { opacity: '0', transform: 'translateX(-100%)' }
      : {};
  }
}
