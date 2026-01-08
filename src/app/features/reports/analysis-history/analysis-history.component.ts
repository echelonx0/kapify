import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  LucideAngularModule,
  SparklesIcon,
  Download,
  Clock,
  Loader2,
  X,
  ChevronRight,
  AlertCircle,
  Search,
  Trash2,
} from 'lucide-angular';

import { AIAnalysisHistoryService } from 'src/app/features/ai/services/ai-analysis-history.service';
import {
  AnalysisHistoryItem,
  AIAnalysisSummary,
} from 'src/app/features/ai/document-analysis/analysis-interface.component';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/auth/services/production.auth.service';

@Component({
  selector: 'app-analysis-history',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-8">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Analyses -->
        <div
          class="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-sm transition-shadow"
        >
          <div class="flex items-center justify-between mb-4">
            <div
              class="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center"
            >
              <lucide-angular
                [img]="SparklesIcon"
                size="20"
                class="text-stone-600"
              ></lucide-angular>
            </div>
            <span
              class="text-xs font-semibold text-stone-600 bg-stone-50 px-2.5 py-1 rounded-full"
              >Total</span
            >
          </div>
          <p class="text-sm text-slate-600 font-medium">Total Analyses</p>
          <p class="text-2xl font-bold text-slate-900 mt-2">
            {{ summary().totalAnalyses }}
          </p>
        </div>

        <!-- Free Analyses -->
        <div
          class="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-sm transition-shadow"
        >
          <div class="flex items-center justify-between mb-4">
            <div
              class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"
            >
              <lucide-angular
                [img]="SparklesIcon"
                size="20"
                class="text-green-600"
              ></lucide-angular>
            </div>
            <span
              class="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full"
              >Free</span
            >
          </div>
          <p class="text-sm text-slate-600 font-medium">Free Analyses</p>
          <p class="text-2xl font-bold text-green-600 mt-2">
            {{ summary().freeAnalyses }}
          </p>
        </div>

        <!-- Paid Analyses -->
        <div
          class="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-sm transition-shadow"
        >
          <div class="flex items-center justify-between mb-4">
            <div
              class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center"
            >
              <lucide-angular
                [img]="SparklesIcon"
                size="20"
                class="text-slate-600"
              ></lucide-angular>
            </div>
            <span
              class="text-xs font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full"
              >Paid</span
            >
          </div>
          <p class="text-sm text-slate-600 font-medium">Paid Analyses</p>
          <p class="text-2xl font-bold text-slate-600 mt-2">
            {{ summary().paidAnalyses }}
          </p>
        </div>

        <!-- Credits Spent -->
        <div
          class="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-sm transition-shadow"
        >
          <div class="flex items-center justify-between mb-4">
            <div
              class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"
            >
              <lucide-angular
                [img]="SparklesIcon"
                size="20"
                class="text-amber-600"
              ></lucide-angular>
            </div>
            <span
              class="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full"
              >Cost</span
            >
          </div>
          <p class="text-sm text-slate-600 font-medium">Credits Spent</p>
          <p class="text-2xl font-bold text-amber-600 mt-2">
            {{ formatCredits(summary().totalCreditsSpent) }}
          </p>
        </div>
      </div>

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
        <p class="text-slate-600 font-medium">Loading analysis history...</p>
      </div>
      }

      <!-- Empty State -->
      @if (!loading() && allAnalysisData().length === 0) {
      <div
        class="text-center py-16 bg-white rounded-2xl border border-slate-200"
      >
        <h3 class="text-lg font-bold text-slate-900 mb-2">No analyses yet</h3>
        <p class="text-slate-600">
          Run your first AI analysis to see results here
        </p>
      </div>
      }

      <!-- No Filtered Results -->
      @if (!loading() && allAnalysisData().length > 0 &&
      filteredHistory().length === 0) {
      <div
        class="text-center py-16 bg-white rounded-2xl border border-slate-200"
      >
        <lucide-angular
          [img]="SearchIcon"
          size="32"
          class="text-slate-400 mx-auto mb-4"
        ></lucide-angular>
        <h3 class="text-lg font-bold text-slate-900 mb-2">No results found</h3>
        <p class="text-slate-600">Try adjusting your filters</p>
      </div>
      }

      <!-- Analysis History Items with Animation -->
      @if (!loading() && filteredHistory().length > 0) {
      <div class="space-y-4">
        @for (analysis of paginatedHistory(); track analysis.id) {
        <div
          [class.animate-out]="analysisDeletingId() === analysis.id"
          class="bg-white rounded-2xl border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer overflow-hidden"
          [style]="getCardAnimationStyle(analysis.id)"
        >
          <div
            (click)="selectAnalysis(analysis)"
            class="p-6 transition-opacity duration-300"
          >
            <!-- Header Row -->
            <div class="flex items-start justify-between gap-4 mb-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <h4 class="text-lg font-bold text-slate-900">
                    {{ getAnalysisTypeLabel(analysis.requestType) }}
                  </h4>
                  <span
                    [class]="
                      'px-2.5 py-1 rounded-full text-xs font-semibold border ' +
                      getStatusColor(analysis.status)
                    "
                  >
                    {{ analysis.status | titlecase }}
                  </span>
                  @if (analysis.wasFree) {
                  <span
                    class="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200/50"
                  >
                    Free
                  </span>
                  } @else {
                  <span
                    class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200/50"
                  >
                    {{ formatCredits(analysis.costCredits) }}
                  </span>
                  }
                </div>

                <!-- Details -->
                <div class="flex items-center gap-3 text-sm text-slate-600">
                  @if (analysis.applicationTitle) {
                  <span class="flex items-center gap-1">
                    {{ analysis.applicationTitle }}
                  </span>
                  } @if (analysis.opportunityTitle) {
                  <span>•</span>
                  <span>{{ analysis.opportunityTitle }}</span>
                  } @if (analysis.userName) {
                  <span>•</span>
                  <span>{{ analysis.userName }}</span>
                  }
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2">
                @if (analysis.canDownload) {
                <button
                  (click)="onDownloadClick(analysis); $event.stopPropagation()"
                  class="p-2 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors duration-200"
                  title="Download Report"
                >
                  <lucide-angular
                    [img]="DownloadIcon"
                    size="18"
                  ></lucide-angular>
                </button>
                }
                <button
                  (click)="onDeleteClick(analysis); $event.stopPropagation()"
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
                {{ analysis.createdAt | date : 'MMM d, yyyy h:mm a' }}
              </span>
              @if (analysis.executedAt) {
              <span>•</span>
              <span>
                Completed {{ getTimeAgo(analysis.executedAt.toISOString()) }}
              </span>
              } @if (analysis.hasResults) {
              <span>•</span>
              <span class="text-teal-600 font-medium">Results available</span>
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
              Math.min(
                (currentPage() + 1) * pageSize(),
                filteredHistory().length
              )
            }}
            of {{ filteredHistory().length }}
          </p>

          <div class="flex items-center gap-2">
            <button
              (click)="previousPage()"
              [disabled]="currentPage() === 0"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <lucide-angular
                [img]="ChevronRightIcon"
                size="16"
              ></lucide-angular>
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
              <lucide-angular
                [img]="ChevronRightIcon"
                size="16"
              ></lucide-angular>
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

            @if (deleteAnalysisToConfirm()) {
            <div class="space-y-2 text-sm">
              <p class="text-slate-600">
                <span class="font-medium text-slate-900">{{
                  getAnalysisTypeLabel(deleteAnalysisToConfirm()!.requestType)
                }}</span>
              </p>
              <p class="text-slate-500">
                Created
                {{
                  deleteAnalysisToConfirm()!.createdAt
                    | date : 'MMM d, yyyy h:mm a'
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
              [disabled]="deletingAnalysisId() !== null"
              class="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              (click)="confirmDelete()"
              [disabled]="deletingAnalysisId() !== null"
              class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
            >
              @if (deletingAnalysisId()) {
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

      <!-- Detail Modal -->
      @if (selectedAnalysisItem() && detailOpen()) {
      <div
        (click)="closeDetail()"
        class="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 transition-opacity duration-300"
      ></div>

      <div
        class="fixed right-0 top-0 h-screen w-full md:w-[600px] bg-white shadow-xl z-50 overflow-y-auto transition-transform duration-300"
      >
        <!-- Header -->
        <div
          class="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center"
            >
              <lucide-angular
                [img]="SparklesIcon"
                size="20"
                class="text-stone-600"
              ></lucide-angular>
            </div>
            <h3 class="text-lg font-bold text-slate-900">Analysis Details</h3>
          </div>
          <button
            (click)="closeDetail()"
            class="text-slate-600 hover:text-slate-900 transition-colors"
          >
            <lucide-angular [img]="X" size="20"></lucide-angular>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Analysis Type & Status -->
          <div>
            <h4 class="text-2xl font-bold text-slate-900 mb-2">
              {{ getAnalysisTypeLabel(selectedAnalysisItem()!.requestType) }}
            </h4>
            <div class="flex items-center gap-2">
              <span
                [class]="
                  'px-2.5 py-1 rounded-full text-xs font-semibold border ' +
                  getStatusColor(selectedAnalysisItem()!.status)
                "
              >
                {{ selectedAnalysisItem()!.status | titlecase }}
              </span>
              @if (selectedAnalysisItem()!.wasFree) {
              <span
                class="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200/50"
              >
                Free Analysis
              </span>
              } @else {
              <span
                class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200/50"
              >
                Cost: {{ formatCredits(selectedAnalysisItem()!.costCredits) }}
              </span>
              }
            </div>
          </div>

          <!-- Metadata -->
          <div class="space-y-3">
            <p class="text-sm font-semibold text-slate-900">
              Analysis Information
            </p>
            <div class="space-y-2 text-sm">
              <div
                class="flex justify-between items-center py-2 border-b border-slate-100"
              >
                <span class="text-slate-600">Created</span>
                <span class="font-medium text-slate-900">{{
                  selectedAnalysisItem()!.createdAt
                    | date : 'MMM d, yyyy h:mm a'
                }}</span>
              </div>
              @if (selectedAnalysisItem()!.executedAt) {
              <div
                class="flex justify-between items-center py-2 border-b border-slate-100"
              >
                <span class="text-slate-600">Executed</span>
                <span class="font-medium text-slate-900">{{
                  selectedAnalysisItem()!.executedAt
                    | date : 'MMM d, yyyy h:mm a'
                }}</span>
              </div>
              } @if (selectedAnalysisItem()!.userName) {
              <div
                class="flex justify-between items-center py-2 border-b border-slate-100"
              >
                <span class="text-slate-600">Analyzed by</span>
                <span class="font-medium text-slate-900">{{
                  selectedAnalysisItem()!.userName
                }}</span>
              </div>
              } @if (selectedAnalysisItem()!.applicationTitle) {
              <div
                class="flex justify-between items-center py-2 border-b border-slate-100"
              >
                <span class="text-slate-600">Application</span>
                <span class="font-medium text-slate-900">{{
                  selectedAnalysisItem()!.applicationTitle
                }}</span>
              </div>
              } @if (selectedAnalysisItem()!.opportunityTitle) {
              <div class="flex justify-between items-center py-2">
                <span class="text-slate-600">Opportunity</span>
                <span class="font-medium text-slate-900">{{
                  selectedAnalysisItem()!.opportunityTitle
                }}</span>
              </div>
              }
            </div>
          </div>

          <!-- Error Message -->
          @if (selectedAnalysisItem()!.errorMessage) {
          <div
            class="bg-red-50 border border-red-200/50 rounded-2xl p-4 flex items-start gap-3"
          >
            <lucide-angular
              [img]="AlertCircle"
              size="20"
              class="text-red-600 flex-shrink-0 mt-0.5"
            ></lucide-angular>
            <div class="flex-1">
              <p class="text-sm font-medium text-red-700">Analysis Failed</p>
              <p class="text-sm text-red-600 mt-1">
                {{ selectedAnalysisItem()!.errorMessage }}
              </p>
            </div>
          </div>
          }

          <!-- Actions -->
          <div class="flex items-center gap-3">
            @if (selectedAnalysisItem()!.canDownload) {
            <button
              (click)="onDownloadClick(selectedAnalysisItem()!)"
              class="flex-1 bg-teal-500 text-white font-medium py-2.5 rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <lucide-angular [img]="DownloadIcon" size="16"></lucide-angular>
              Download Report
            </button>
            }
            <button
              (click)="onDeleteClick(selectedAnalysisItem()!); closeDetail()"
              class="flex-1 bg-red-50 text-red-600 font-medium py-2.5 rounded-xl hover:bg-red-100 transition-colors duration-200 flex items-center justify-center gap-2 border border-red-200/50"
            >
              <lucide-angular [img]="Trash2Icon" size="16"></lucide-angular>
              Delete
            </button>
          </div>
        </div>
      </div>
      }

      <!-- Global Styles for Animations -->
      <style>
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
      </style>
    </div>
  `,
})
export class AnalysisHistoryComponent implements OnInit, OnDestroy {
  private analysisService = inject(AIAnalysisHistoryService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // Data
  allAnalysisData = signal<AnalysisHistoryItem[]>([]);
  summary = signal<AIAnalysisSummary>({
    totalAnalyses: 0,
    freeAnalyses: 0,
    paidAnalyses: 0,
    totalCreditsSpent: 0,
    averageCostPerAnalysis: 0,
    pendingAnalyses: 0,
    failedAnalyses: 0,
  });

  // UI State
  loading = signal(false);
  detailOpen = signal(false);
  selectedAnalysisItem = signal<AnalysisHistoryItem | null>(null);
  deleteConfirmOpen = signal(false);
  deleteAnalysisToConfirm = signal<AnalysisHistoryItem | null>(null);
  deletingAnalysisId = signal<string | null>(null);
  analysisDeletingId = signal<string | null>(null);

  // Filters
  searchQuery = signal('');
  selectedAnalysisType = signal('');
  selectedAnalysisStatus = signal('');
  startDate = signal('');
  endDate = signal('');
  showFreeOnly = signal(false);
  showPaidOnly = signal(false);

  // Pagination
  currentPage = signal(0);
  pageSize = signal(10);

  // Icons
  readonly SparklesIcon = SparklesIcon;
  readonly DownloadIcon = Download;
  readonly ClockIcon = Clock;
  readonly LoaderIcon = Loader2;
  readonly X = X;
  readonly ChevronRightIcon = ChevronRight;
  readonly AlertCircle = AlertCircle;
  readonly SearchIcon = Search;
  readonly Trash2Icon = Trash2;

  // Computed
  filteredHistory = computed(() => {
    let results = [...this.allAnalysisData()];

    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
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

    if (this.startDate() || this.endDate()) {
      const start = this.startDate()
        ? new Date(this.startDate())
        : new Date('1900-01-01');
      const end = this.endDate()
        ? new Date(this.endDate())
        : new Date('2099-12-31');

      results = results.filter((a) => {
        const date = new Date(a.createdAt);
        return date >= start && date <= end;
      });
    }

    return results;
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredHistory().length / this.pageSize()))
  );

  paginatedHistory = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.filteredHistory().slice(start, start + this.pageSize());
  });

  uniqueAnalysisTypes = computed(() =>
    Array.from(new Set(this.allAnalysisData().map((a) => a.requestType)))
  );

  uniqueAnalysisStatuses = computed(() =>
    Array.from(new Set(this.allAnalysisData().map((a) => a.status)))
  );

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.loading.set(true);

    this.analysisService
      .getAnalysisSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (err) => console.error('Failed to load summary:', err),
      });

    this.analysisService
      .getAnalysisHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.allAnalysisData.set(history);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load analysis history:', err);
          this.loading.set(false);
        },
      });
  }

  refresh(): void {
    this.loadData();
  }

  onFilterChange(): void {
    this.currentPage.set(0);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedAnalysisType.set('');
    this.selectedAnalysisStatus.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.showFreeOnly.set(false);
    this.showPaidOnly.set(false);
    this.currentPage.set(0);
  }

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

  selectAnalysis(analysis: AnalysisHistoryItem): void {
    this.selectedAnalysisItem.set(analysis);
    this.detailOpen.set(true);
  }

  closeDetail(): void {
    this.detailOpen.set(false);
    setTimeout(() => this.selectedAnalysisItem.set(null), 300);
  }

  onDownloadClick(analysis: AnalysisHistoryItem): void {
    console.log('Download analysis:', analysis.id);
    // TODO: Implement download logic when ready
  }

  /**
   * Open delete confirmation modal
   */
  onDeleteClick(analysis: AnalysisHistoryItem): void {
    this.deleteAnalysisToConfirm.set(analysis);
    this.deleteConfirmOpen.set(true);
  }

  /**
   * Close delete confirmation modal
   */
  closeDeleteConfirm(): void {
    this.deleteConfirmOpen.set(false);
    setTimeout(() => this.deleteAnalysisToConfirm.set(null), 300);
  }

  /**
   * Confirm and execute delete - fetch orgId from AuthService
   */
  confirmDelete(): void {
    const analysis = this.deleteAnalysisToConfirm();
    if (!analysis) return;

    this.deletingAnalysisId.set(analysis.id);
    this.analysisDeletingId.set(analysis.id);

    this.analysisService
      .deleteAnalysis(analysis)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          setTimeout(() => {
            this.deleteConfirmOpen.set(false);
            this.deleteAnalysisToConfirm.set(null);
            this.deletingAnalysisId.set(null);
            this.analysisDeletingId.set(null);

            // Refresh summary only (history already updated via cache)
            this.analysisService
              .getAnalysisSummary()
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (summary) => this.summary.set(summary),
              });

            this.showDeleteToast();
          }, 300);
        },
        error: (err) => {
          console.error('❌ Delete failed:', err);
          this.deletingAnalysisId.set(null);
          this.analysisDeletingId.set(null);
          alert(err?.message || 'Failed to delete analysis');
        },
      });
  }

  /**
   * Show delete success toast (integrate with your toast service)
   */
  private showDeleteToast(): void {
    // TODO: Integrate with your toast/notification service
    console.log('✅ Analysis deleted successfully');
  }

  /**
   * Get animation style for card being deleted
   */
  getCardAnimationStyle(analysisId: string): any {
    if (this.analysisDeletingId() === analysisId) {
      return {
        'pointer-events': 'none',
      };
    }
    return {};
  }

  getStatusColor(status: string): string {
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

  formatCredits(credits: number): string {
    return `R${(credits / 100).toFixed(2)}`;
  }

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

  Math = Math;
}

// import { Component, OnInit, inject, signal, computed } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { AuthService } from 'src/app/auth/services/production.auth.service';
// import {
//   AIAnalysisResult,
//   AIAnalysisResultsService,
// } from '../../ai/services/ai-analysis-history.service';

// @Component({
//   selector: 'app-analysis-results',
//   standalone: true,
//   imports: [CommonModule],
//   template: `
//     <div class="space-y-6">
//       <header class="flex items-center justify-between">
//         <h2 class="text-2xl font-bold text-slate-900">AI Analysis Results</h2>
//         <span class="text-sm text-slate-500"> {{ totalResults() }} total </span>
//       </header>

//       @if (loading()) {
//       <p class="text-slate-600">Loading results...</p>
//       } @if (!loading() && results().length === 0) {
//       <div class="bg-white border rounded-xl p-8 text-center">
//         <p class="text-slate-700 font-medium">No AI results yet</p>
//         <p class="text-sm text-slate-500 mt-1">
//           Run an analysis to see saved results here.
//         </p>
//       </div>
//       }

//       <div class="space-y-4">
//         @for (result of results(); track result.id) {
//         <div class="bg-white border rounded-xl p-5 hover:shadow-sm transition">
//           <div class="flex items-start justify-between">
//             <div>
//               <h3 class="font-semibold text-slate-900">
//                 {{ getAnalysisLabel(result.analysis_type) }}
//               </h3>
//               <p class="text-sm text-slate-500 mt-1">
//                 {{ result.created_at | date : 'MMM d, yyyy · h:mm a' }}
//               </p>
//             </div>

//             <div class="flex gap-2">
//               <button
//                 (click)="download(result)"
//                 class="text-sm px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
//               >
//                 Download
//               </button>
//               <button
//                 (click)="delete(result)"
//                 class="text-sm px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
//               >
//                 Delete
//               </button>
//             </div>
//           </div>

//           <pre class="mt-4 text-xs bg-slate-50 rounded-lg p-3 overflow-auto"
//             >{{ result.analysis_result | json }}
//             </pre
//           >
//         </div>
//         }
//       </div>
//     </div>
//   `,
// })
// export class AnalysisResultsComponent implements OnInit {
//   private resultsService = inject(AIAnalysisResultsService);
//   private authService = inject(AuthService);

//   loading = signal(false);
//   results = signal<AIAnalysisResult[]>([]);

//   totalResults = computed(() => this.results().length);

//   ngOnInit(): void {
//     const userId = this.authService.getCurrentUserOrganizationId();
//     if (!userId) return;

//     this.loading.set(true);

//     this.resultsService.getUserResults(userId).subscribe({
//       next: (data) => {
//         this.results.set(data);
//         this.loading.set(false);
//       },
//       error: (err) => {
//         console.error('Failed to load results', err);
//         this.loading.set(false);
//       },
//     });
//   }

//   delete(result: AIAnalysisResult): void {
//     if (!confirm('Delete this analysis result?')) return;

//     this.resultsService.deleteResult(result.id).subscribe({
//       next: () => {
//         this.results.update((list) => list.filter((r) => r.id !== result.id));
//       },
//       error: (err) => {
//         console.error('Delete failed', err);
//         alert('Failed to delete result');
//       },
//     });
//   }

//   download(result: AIAnalysisResult): void {
//     const blob = new Blob([JSON.stringify(result.analysis_result, null, 2)], {
//       type: 'application/json',
//     });

//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `ai-analysis-${result.id}.json`;
//     a.click();
//     URL.revokeObjectURL(url);
//   }

//   getAnalysisLabel(type: string): string {
//     return type === 'profile' ? 'Profile Analysis' : 'Opportunity Analysis';
//   }
// }
