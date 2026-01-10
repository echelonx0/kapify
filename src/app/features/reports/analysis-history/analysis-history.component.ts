import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  CircleAlert,
  File,
} from 'lucide-angular';
import { AnalysisReportExportService } from '../../ai/services/ai-analysis-export.service';
import {
  AIAnalysisHistoryService,
  AnalysisResultItem,
} from '../../ai/services/ai-analysis-history.service';

@Component({
  selector: 'app-ai-analysis-history',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './analysis-history.component.html',
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
  private router = inject(Router);

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
  AlertCircle = CircleAlert;
  FileIcon = File;

  // State
  loading = signal(false);
  allResults = signal<AnalysisResultItem[]>([]);
  currentPage = signal(0);
  pageSize = signal(10);
  deleteConfirmOpen = signal(false);
  deleteResultToConfirm = signal<AnalysisResultItem | null>(null);
  deletingId = signal<string | null>(null);

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
   * Navigate to analysis detail view
   */
  onViewClick(result: AnalysisResultItem): void {
    this.router.navigate(['/dashboard/analysis', result.id]);
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

    this.historyService.deleteAnalysis(result.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.closeDeleteConfirm();
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
  getCardAnimationStyle(resultId: string): { [key: string]: string } {
    return this.deletingId() === resultId
      ? { opacity: '0', transform: 'translateX(-100%)' }
      : {};
  }
}
