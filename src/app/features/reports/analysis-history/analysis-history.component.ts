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
  X,
  ChevronRight,
  Search,
  Trash2,
  CircleAlert,
  LoaderCircle,
  View,
  ChartPie,
} from 'lucide-angular';

import { AIAnalysisHistoryService } from 'src/app/features/ai/services/ai-analysis-history.service';
import {
  AnalysisHistoryItem,
  AIAnalysisSummary,
} from 'src/app/features/ai/document-analysis/analysis-interface.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-analysis-history',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './analysis-history.component.html',
  styleUrl: './analysis-history.component.css',
})
export class AnalysisHistoryComponent implements OnInit, OnDestroy {
  private analysisService = inject(AIAnalysisHistoryService);
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
  readonly LoaderIcon = LoaderCircle;
  readonly ChartPie = ChartPie;
  readonly X = X;
  readonly ChevronRightIcon = ChevronRight;
  readonly AlertCircle = CircleAlert;
  readonly SearchIcon = Search;
  readonly Trash2Icon = Trash2;
  readonly ViewIcon = View;

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
