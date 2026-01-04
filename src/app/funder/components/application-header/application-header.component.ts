import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  inject,
  signal,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Settings,
  BarChart3,
} from 'lucide-angular';

import { FundingApplication } from 'src/app/SMEs/models/application.models';
import { Router } from '@angular/router';
import { AnalysisResultsModalComponent } from '../../application-details/components/results-modal/analysis-results.modal.component';
import {
  AnalysisResultsService,
  AnalysisResult,
} from '../../services/analysis-results.service';

@Component({
  selector: 'app-application-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, AnalysisResultsModalComponent],
  templateUrl: './application-header.component.html',
  styleUrls: ['./application-header.component.css'],
})
export class ApplicationHeaderComponent implements OnInit, OnChanges {
  @Input() application!: FundingApplication;
  @Input() profileLoading = false;
  @Input() profileError: string | null = null;
  @Input() hasCompleteData = false;

  @Output() back = new EventEmitter<void>();
  @Output() manageStatus = new EventEmitter<void>();

  @Output() showContactModal = new EventEmitter<void>();

  private router = inject(Router);
  private analysisResultsService = inject(AnalysisResultsService);

  // Icons
  ArrowLeftIcon = ArrowLeft;
  AlertCircleIcon = AlertCircle;
  Loader2Icon = Loader2;
  SettingsIcon = Settings;
  BarChart3Icon = BarChart3;

  // State
  showAnalysisModal = signal(false);
  analysis = signal<AnalysisResult | null>(null);
  loadingAnalysis = signal(false);
  analysisError = signal<string | null>(null);

  // Computed
  hasAnalysis = computed(() => !!this.analysis());

  ngOnInit() {
    this.loadAnalysisIfReady();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['application'] && this.application?.id) {
      this.loadAnalysisIfReady();
    }
  }
  //  da8d5d26-ff00-44ac-9e83-94535f981aa2
  /**
   * Load analysis if conditions are met
   */
  private loadAnalysisIfReady() {
    if (this.application?.id && !this.loadingAnalysis()) {
      this.loadAnalysis();
    }
  }

  /**
   * Load analysis results for this application
   */
  private loadAnalysis() {
    this.loadingAnalysis.set(true);
    this.analysisError.set(null);

    this.analysisResultsService
      .getAnalysisForApplication(this.application.id)
      .subscribe({
        next: (result) => {
          this.analysis.set(result);
          this.loadingAnalysis.set(false);
        },
        error: (error) => {
          console.error('❌ [HEADER] Failed to load analysis:', error);
          this.analysisError.set('Failed to load analysis');
          this.loadingAnalysis.set(false);
        },
      });
  }

  statusBadgeClass = computed(() => {
    const status = this.application?.status || 'draft';
    const classMap: Record<string, string> = {
      draft: 'status-badge status-draft',
      submitted: 'status-badge status-submitted',
      under_review: 'status-badge status-under-review',
      approved: 'status-badge status-approved',
      rejected: 'status-badge status-rejected',
      withdrawn: 'status-badge status-draft',
    };
    return classMap[status] || 'status-badge status-draft';
  });

  statusText = computed(() => {
    const status = this.application?.status || 'draft';
    const statusMap: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
    };
    return statusMap[status] || status;
  });

  internalStatus = computed(() => {
    return this.application?.metadata?.internalStatus || null;
  });

  priority = computed(() => {
    return this.application?.metadata?.priority || null;
  });

  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  onBack() {
    this.back.emit();
  }

  allApplications() {
    this.router.navigate(['/funder/dashboard'], {
      queryParams: { tab: 'applications' },
    });
  }

  onManageStatus() {
    this.manageStatus.emit();
  }

  onShowContact() {
    this.showContactModal.emit();
  }

  /**
   * Open analysis results modal
   */
  openAnalysisModal() {
    if (this.analysis()) {
      this.showAnalysisModal.set(true);
    }
  }

  /**
   * Close analysis results modal
   */
  closeAnalysisModal() {
    this.showAnalysisModal.set(false);
  }

  /**
   * Get score color for badge display
   */
  getScoreColor(score?: number | undefined): string {
    if (score === undefined || score === null) return 'text-slate-600';
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-blue-600';
    return 'text-red-600';
  }
}
