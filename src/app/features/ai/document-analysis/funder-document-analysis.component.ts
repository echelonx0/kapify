import {
  Component,
  signal,
  computed,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  FileText,
  Upload,
  Sparkles,
  TrendingUp,
  Download,
  Eye,
  Globe,
  Target,
  DollarSign,
  Clock,
  Building,
  CircleAlert,
  Zap,
  X,
  Info,
  LoaderCircle,
  CircleX,
  TriangleAlert,
  CircleCheckBig,
  ChevronDown,
} from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';

import {
  FunderDocumentAnalysisService,
  ProcessingStatus,
  DocumentAnalysisResult,
} from '../services/funder-document-analysis.service';
import {
  OrgCreditService,
  OrgWallet,
} from 'src/app/shared/services/credit.service';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import {
  ProcessingStageStatus,
  ProcessingTimelineComponent,
} from './components/processing-timeline.component';
import { CostConfirmationModalComponent } from './components/cost-confirmation-modal.component';
import { CondensedHowItWorksComponent } from './components/condensed-how-it-works.component';
import { DocumentAnalysisHeader } from './components/analysis-header.component';

const ANALYSIS_COST_CREDITS = 500;
const ANALYSIS_COST_ZAR = 500;

interface CostConfirmation {
  isOpen: boolean;
}

@Component({
  selector: 'app-funder-document-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    DocumentAnalysisHeader,
    CostConfirmationModalComponent,
    ProcessingTimelineComponent,
    CondensedHowItWorksComponent,
  ],
  templateUrl: 'funder-document-analysis.component.html',
  styles: [],
})
export class FunderDocumentAnalysisComponent implements OnInit, OnDestroy {
  private analysisService = inject(FunderDocumentAnalysisService);
  private creditService = inject(OrgCreditService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // Icons
  FileTextIcon = FileText;
  UploadIcon = Upload;
  SparklesIcon = Sparkles;
  TrendingUpIcon = TrendingUp;
  AlertTriangleIcon = TriangleAlert;
  CheckCircleIcon = CircleCheckBig;
  XCircleIcon = CircleX;
  Loader2Icon = LoaderCircle;
  DownloadIcon = Download;
  EyeIcon = Eye;
  GlobeIcon = Globe;
  TargetIcon = Target;
  DollarSignIcon = DollarSign;
  ClockIcon = Clock;
  BuildingIcon = Building;
  AlertIcon = CircleAlert;
  ZapIcon = Zap;
  XIcon = X;
  InfoIcon = Info;
  ChevronDownIcon = ChevronDown;

  // State
  isDragOver = signal(false);
  isProcessing = signal(false);
  analysisResult = signal<DocumentAnalysisResult | null>(null);
  errorMessage = signal<string | null>(null);
  uploadedFile = signal<File | null>(null);
  companyName = signal<string | null>(null);

  // UI State
  redirectCountdown = signal(5);

  // Credits
  wallet = signal<OrgWallet | null>(null);
  isLoadingWallet = signal(false);
  costConfirmation = signal<CostConfirmation>({ isOpen: false });
  pendingFile = signal<File | null>(null);

  processingStatuses = signal<ProcessingStageStatus[]>([
    {
      stage: 'upload',
      label: 'Processing Document',
      completed: false,
      active: false,
    },
    {
      stage: 'extract',
      label: 'Extracting Content',
      completed: false,
      active: false,
    },
    {
      stage: 'market',
      label: 'Gathering Market Intelligence',
      completed: false,
      active: false,
    },
    { stage: 'analyze', label: 'AI Analysis', completed: false, active: false },
    {
      stage: 'complete',
      label: 'Generating Insights',
      completed: false,
      active: false,
    },
  ]);
  keyFeatures = [
    {
      title: 'Investment Viability Score',
      desc: 'Proprietary business intelligence rating',
    },
    {
      title: 'Success Probability',
      desc: 'Funding success modeling',
    },
    {
      title: 'Market Benchmarks',
      desc: 'Real-time market data comparison',
    },
    {
      title: 'Strategic Intelligence',
      desc: 'Competitive advantage analysis',
    },
  ];

  // Computed
  hasError = computed(() => !!this.errorMessage());
  orgId = computed(() => this.authService.getCurrentUserOrganizationId() || '');
  hasEnoughCredits = computed(
    () => (this.wallet()?.balance || 0) >= ANALYSIS_COST_CREDITS,
  );
  creditsFormatted = computed(() => {
    const balance = this.wallet()?.balance || 0;
    return balance.toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    });
  });

  // Make constant accessible to template
  readonly ANALYSIS_COST_ZAR = ANALYSIS_COST_ZAR;

  ngOnInit() {
    this.loadWallet();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadWallet() {
    this.isLoadingWallet.set(true);
    const id = this.orgId();

    if (!id) {
      this.isLoadingWallet.set(false);
      return;
    }

    this.creditService
      .getOrCreateOrgWallet(id)
      .then((wallet) => {
        this.wallet.set(wallet);
        this.isLoadingWallet.set(false);
      })
      .catch((err) => {
        console.error('Failed to load wallet:', err);
        this.isLoadingWallet.set(false);
      });
  }

  // ===== FILE HANDLING =====
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File) {
    // Validate file
    if (!file.type.includes('pdf')) {
      this.errorMessage.set('Please upload a PDF file');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      // 15MB limit
      this.errorMessage.set('File size must be less than 15MB');
      return;
    }

    // Check credits before showing cost modal
    if (!this.hasEnoughCredits()) {
      this.errorMessage.set(
        `Insufficient credits. You need ${this.formatCurrency(
          ANALYSIS_COST_ZAR,
        )} to analyze this document.`,
      );
      return;
    }

    this.uploadedFile.set(file);
    this.pendingFile.set(file);
    this.costConfirmation.set({ isOpen: true });
  }

  closeCostModal() {
    this.costConfirmation.set({ isOpen: false });
    this.pendingFile.set(null);
    this.companyName.set(null);
  }

  confirmAnalysis(companyNameInput: string) {
    const file = this.pendingFile();
    if (file) {
      this.companyName.set(companyNameInput);
      this.closeCostModal();
      this.startAnalysis(file, companyNameInput);
    }
  }

  private async startAnalysis(file: File, companyNameInput: string) {
    this.isProcessing.set(true);
    this.errorMessage.set(null);
    this.analysisResult.set(null);
    const id = this.orgId();

    if (!id) {
      this.errorMessage.set('Organization not found');
      this.isProcessing.set(false);
      return;
    }

    try {
      // Deduct credits immediately
      this.creditService
        .spendCredits(
          id,
          ANALYSIS_COST_CREDITS,
          'Document Analysis',
          this.authService.user()?.id,
        )
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadWallet(); // Reload wallet to show new balance
            this.executeAnalysis(file, companyNameInput);
          },
          error: (err) => {
            console.error('Failed to deduct credits:', err);
            this.errorMessage.set(
              'Failed to process payment. Analysis cancelled.',
            );
            this.isProcessing.set(false);
          },
        });
    } catch (error: any) {
      console.error('Analysis setup failed:', error);
      this.errorMessage.set(
        error.message || 'Analysis failed. Please try again.',
      );
      this.isProcessing.set(false);
    }
  }

  private executeAnalysis(file: File, companyNameInput: string) {
    try {
      // Reset processing statuses
      this.processingStatuses.set([
        {
          stage: 'upload',
          label: 'Processing Document',
          completed: false,
          active: true,
        },
        {
          stage: 'extract',
          label: 'Extracting Content',
          completed: false,
          active: false,
        },
        {
          stage: 'market',
          label: 'Gathering Market Intelligence',
          completed: false,
          active: false,
        },
        {
          stage: 'analyze',
          label: 'AI Analysis',
          completed: false,
          active: false,
        },
        {
          stage: 'complete',
          label: 'Generating Insights',
          completed: false,
          active: false,
        },
      ]);

      // Subscribe to processing status updates
      this.analysisService.processingStatus$
        .pipe(takeUntil(this.destroy$))
        .subscribe((status) => {
          if (status) {
            this.updateProcessingStatus(status);
          }
        });

      // Start the analysis with company name
      this.analysisService.analyzeDocument(file, companyNameInput).subscribe({
        next: (result) => {
          this.analysisResult.set(result);
          this.markStageComplete('complete');
          this.startRedirectCountdown();
        },
        error: (error) => {
          console.error('Analysis failed:', error);
          this.errorMessage.set(
            error.message || 'Analysis failed. Please try again.',
          );
          this.refundCredits();
          this.isProcessing.set(false);
        },
        complete: () => {
          this.isProcessing.set(false);
        },
      });
    } catch (error: any) {
      console.error('Analysis failed:', error);
      this.errorMessage.set(
        error.message || 'Analysis failed. Please try again.',
      );
      this.refundCredits();
      this.isProcessing.set(false);
    }
  }

  private refundCredits() {
    const id = this.orgId();
    if (!id) return;

    this.creditService
      .addCredits(
        id,
        ANALYSIS_COST_CREDITS,
        'Refund - Analysis Failed',
        this.authService.user()?.id,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadWallet();
          console.log('Credits refunded due to analysis failure');
        },
        error: (err) => console.error('Failed to refund credits:', err),
      });
  }

  private updateProcessingStatus(status: ProcessingStatus) {
    // Map processing status to our stages
    switch (status.stage) {
      case 'uploading':
        this.updateStageStatus('upload', true, status.details);
        break;
      case 'extracting':
        this.markStageComplete('upload');
        this.updateStageStatus('extract', true, status.details);
        break;
      case 'market_research':
        this.markStageComplete('extract');
        this.updateStageStatus('market', true, status.details);
        break;
      case 'ai_analysis':
        this.markStageComplete('market');
        this.updateStageStatus('analyze', true, status.details);
        break;
      case 'completed':
        this.markStageComplete('analyze');
        this.updateStageStatus('complete', true, status.details);
        break;
      case 'error':
        this.errorMessage.set(status.message);
        break;
    }
  }

  private updateStageStatus(stage: string, active: boolean, details?: string) {
    const stages = this.processingStatuses();
    const stageIndex = stages.findIndex((s) => s.stage === stage);

    if (stageIndex >= 0) {
      stages[stageIndex] = {
        ...stages[stageIndex],
        active,
        details,
      };
      this.processingStatuses.set([...stages]);
    }
  }

  private markStageComplete(stage: string) {
    const stages = this.processingStatuses();
    const stageIndex = stages.findIndex((s) => s.stage === stage);

    if (stageIndex >= 0) {
      stages[stageIndex] = {
        ...stages[stageIndex],
        completed: true,
        active: false,
      };
      this.processingStatuses.set([...stages]);
    }
  }

  // ===== NAVIGATION =====
  private startRedirectCountdown() {
    this.redirectCountdown.set(5);

    const countdownInterval = setInterval(() => {
      const current = this.redirectCountdown();

      if (current <= 1) {
        clearInterval(countdownInterval);
        this.viewAnalysisDetail();
      } else {
        this.redirectCountdown.set(current - 1);
      }
    }, 1000);

    this.destroy$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      clearInterval(countdownInterval);
    });
  }

  viewAnalysisDetail() {
    const result = this.analysisResult();
    if (!result) return;

    this.analysisService.setCurrentAnalysisResult(result);
    this.router.navigate(['/dashboard/analysis', 'temp-' + Date.now()]);
  }

  // ===== RESET AND ACTIONS =====
  resetAnalysis() {
    this.isProcessing.set(false);
    this.analysisResult.set(null);
    this.errorMessage.set(null);
    this.uploadedFile.set(null);
    this.companyName.set(null);
    this.isDragOver.set(false);
    this.analysisService.clearStatus();
  }

  downloadReport() {
    const result = this.analysisResult();
    if (!result) return;

    const reportData = {
      documentName: this.uploadedFile()?.name || 'Business Proposal',
      companyName: this.companyName() || 'Unknown',
      analysisDate: new Date().toISOString(),
      executiveSummary: {
        investmentScore: result.matchScore,
        successProbability: result.successProbability,
        marketTiming: result.marketTimingInsight,
        competitivePosition: result.competitivePositioning,
        confidence: result.confidence,
      },
      analysis: result,
      generatedBy: 'Kapify AI Document Analysis',
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-report-${
      this.companyName() || 'unknown'
    }-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ===== UI HELPER METHODS =====
  getTimingClasses(timing: string): string {
    switch (timing) {
      case 'favorable':
        return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 text-green-600';
      case 'neutral':
        return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100 text-gray-600';
      case 'challenging':
        return 'bg-gradient-to-br from-red-50 to-rose-50 border-red-100 text-red-600';
      default:
        return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100 text-gray-600';
    }
  }

  getPositionClasses(position: string): string {
    switch (position) {
      case 'strong':
        return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 text-green-600';
      case 'moderate':
        return 'bg-gradient-to-br from-stone-50 to-slate-50 border-stone-100 text-stone-600';
      case 'weak':
        return 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 text-orange-600';
      default:
        return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100 text-gray-600';
    }
  }

  getRiskSeverityBadge(severity: string): string {
    const baseClasses = 'px-2 py-1 rounded text-xs font-medium';
    switch (severity) {
      case 'high':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'medium':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'low':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    });
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return `${amount.toLocaleString()}`;
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  }
}
