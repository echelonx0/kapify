import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AIReportsService, AnalysisReport } from './ai-reports.service';

@Component({
  selector: 'app-ai-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ai-reports.component.html',
})
export class AIReportsComponent implements OnInit, OnDestroy {
  private aiReportsService = inject(AIReportsService);
  private destroy$ = new Subject<void>();

  // State management
  reports = signal<AnalysisReport[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  selectedReport = signal<AnalysisReport | null>(null);
  sheetOpen = signal(false);

  // Computed
  hasReports = computed(() => this.reports().length > 0);

  ngOnInit(): void {
    this.loadReports();
  }

  /**
   * Load user's analysis reports
   */
  loadReports(): void {
    this.loading.set(true);
    this.error.set(null);

    this.aiReportsService
      .getUserAnalysisReports()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.reports.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err.message);
          this.loading.set(false);
        },
      });
  }

  /**
   * Open detail sheet for a report
   */
  openReport(report: AnalysisReport): void {
    this.selectedReport.set(report);
    this.sheetOpen.set(true);
  }

  /**
   * Close detail sheet
   */
  closeSheet(): void {
    this.sheetOpen.set(false);
    setTimeout(() => {
      this.selectedReport.set(null);
    }, 300);
  }

  /**
   * Get display label for analysis type
   */
  getAnalysisTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      profile: 'Profile Analysis',
      opportunity: 'Opportunity Analysis',
    };
    return labels[type] || type;
  }

  /**
   * Format date to readable string
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Get severity badge color
   */
  getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      critical: 'red',
      high: 'amber',
      medium: 'blue',
      low: 'green',
    };
    return colors[severity] || 'slate';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
