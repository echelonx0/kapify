import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  X,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-angular';
import { AnalysisResult } from 'src/app/funder/services/analysis-results.service';
import { AnalysisPdfService } from 'src/app/funder/services/analysis-pdf.service';

@Component({
  selector: 'app-analysis-results-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (isOpen) {
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/25 backdrop-blur-sm z-40"
      (click)="close()"
    ></div>

    <!-- Modal -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      (click)="closeIfBackdrop($event)"
    >
      <div
        class="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="sticky top-0 bg-gradient-to-r from-teal-50 to-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between"
        >
          <h2 class="text-xl font-bold text-slate-900">Analysis Results</h2>
          <button
            (click)="close()"
            class="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <lucide-icon [img]="XIcon" [size]="24"></lucide-icon>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <!-- Loading State -->
          @if (isLoading()) {
          <div class="flex items-center justify-center py-8">
            <div class="text-center">
              <lucide-icon
                [img]="Loader2Icon"
                [size]="32"
                class="animate-spin text-teal-500 mx-auto mb-2"
              ></lucide-icon>
              <p class="text-sm text-slate-600">Loading analysis...</p>
            </div>
          </div>
          }

          <!-- Error State -->
          @if (error()) {
          <div
            class="bg-red-50 border border-red-200/50 rounded-xl p-4 flex items-start gap-3"
          >
            <lucide-icon
              [img]="AlertCircleIcon"
              [size]="16"
              class="text-red-600 mt-0.5 flex-shrink-0"
            ></lucide-icon>
            <div>
              <h3 class="text-sm font-semibold text-red-900">
                Error Loading Analysis
              </h3>
              <p class="text-xs text-red-700 mt-1">{{ error() }}</p>
            </div>
          </div>
          }

          <!-- Results Display -->
          @if (analysis && !isLoading()) {
          <div class="space-y-4">
            <!-- Investment Score Card -->
            <div class="rounded-2xl border p-6" [class]="getScoreBgClass()">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-sm font-semibold text-slate-900">
                  Investment Score
                </h3>
                <div class="text-right">
                  <div class="text-3xl font-bold" [class]="getScoreTextClass()">
                    {{ analysis.analysisResult.investmentScore.overall }}
                  </div>
                  <div
                    class="text-xs font-semibold uppercase tracking-wide mt-1"
                    [class]="getRecommendationClass()"
                  >
                    {{
                      analysis.analysisResult.investmentScore.recommendation
                        | uppercase
                    }}
                  </div>
                </div>
              </div>

              <!-- Breakdown Bars -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-600"
                    >Financial Health</span
                  >
                  <div class="flex items-center gap-2">
                    <div
                      class="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden"
                    >
                      <div
                        class="h-full bg-gradient-to-r from-teal-400 to-teal-500"
                        [style.width.%]="
                          analysis.analysisResult.investmentScore.breakdown
                            .financial
                        "
                      ></div>
                    </div>
                    <span class="text-xs font-semibold text-slate-900 w-6">{{
                      analysis.analysisResult.investmentScore.breakdown
                        .financial
                    }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-600"
                    >Market Fit</span
                  >
                  <div class="flex items-center gap-2">
                    <div
                      class="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden"
                    >
                      <div
                        class="h-full bg-gradient-to-r from-teal-400 to-teal-500"
                        [style.width.%]="
                          analysis.analysisResult.investmentScore.breakdown
                            .market
                        "
                      ></div>
                    </div>
                    <span class="text-xs font-semibold text-slate-900 w-6">{{
                      analysis.analysisResult.investmentScore.breakdown.market
                    }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-600"
                    >Team/Profile</span
                  >
                  <div class="flex items-center gap-2">
                    <div
                      class="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden"
                    >
                      <div
                        class="h-full bg-gradient-to-r from-teal-400 to-teal-500"
                        [style.width.%]="
                          analysis.analysisResult.investmentScore.breakdown.team
                        "
                      ></div>
                    </div>
                    <span class="text-xs font-semibold text-slate-900 w-6">{{
                      analysis.analysisResult.investmentScore.breakdown.team
                    }}</span>
                  </div>
                </div>

                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-600"
                    >Traction</span
                  >
                  <div class="flex items-center gap-2">
                    <div
                      class="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden"
                    >
                      <div
                        class="h-full bg-gradient-to-r from-teal-400 to-teal-500"
                        [style.width.%]="
                          analysis.analysisResult.investmentScore.breakdown
                            .traction
                        "
                      ></div>
                    </div>
                    <span class="text-xs font-semibold text-slate-900 w-6">{{
                      analysis.analysisResult.investmentScore.breakdown.traction
                    }}</span>
                  </div>
                </div>
              </div>

              <div
                class="mt-4 pt-4 border-t text-xs text-slate-600 flex items-center justify-between"
              >
                <span
                  >Confidence:
                  {{
                    analysis.analysisResult.investmentScore.confidence
                  }}%</span
                >
              </div>
            </div>

            <!-- Top Insights -->
            <div>
              <h3 class="text-sm font-semibold text-slate-900 mb-3">
                Top Insights
              </h3>
              <div class="space-y-2">
                @for (insight of topInsights(); track insight.title) {
                <div
                  class="p-3 rounded-lg border"
                  [class]="getInsightCardClass(insight.severity)"
                >
                  <div class="flex gap-3">
                    <div
                      class="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      [class]="getInsightIndicatorClass(insight.severity)"
                    ></div>
                    <div class="flex-1">
                      <h4 class="text-xs font-semibold text-slate-900">
                        {{ insight.title }}
                      </h4>
                      <p class="text-xs text-slate-600 mt-1">
                        {{ insight.description }}
                      </p>
                      <p class="text-xs font-medium text-slate-700 mt-1.5">
                        → {{ insight.recommendation }}
                      </p>
                    </div>
                  </div>
                </div>
                }
              </div>
            </div>
          </div>
          }
        </div>

        <!-- Footer -->
        <div
          class="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center justify-between"
        >
          <span class="text-xs text-slate-600">
            @if (analysis) { Generated {{ formatDate(analysis.createdAt) }} }
          </span>

          <div class="flex gap-3">
            <button
              (click)="close()"
              class="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors duration-200"
            >
              Close
            </button>

            @if (analysis) {
            <button
              (click)="downloadPdf()"
              [disabled]="isDownloading()"
              class="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              @if (isDownloading()) {
              <lucide-icon
                [img]="Loader2Icon"
                [size]="16"
                class="animate-spin"
              ></lucide-icon>
              <span>Downloading...</span>
              } @else {
              <lucide-icon [img]="DownloadIcon" [size]="16"></lucide-icon>
              <span>Download PDF</span>
              }
            </button>
            }
          </div>
        </div>
      </div>
    </div>
    }
  `,
  styles: [],
})
export class AnalysisResultsModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() analysis: AnalysisResult | null = null;
  @Input() smeName = '';

  @Output() closeModal = new EventEmitter<void>();

  private pdfService = inject(AnalysisPdfService);

  // Icons
  XIcon = X;
  DownloadIcon = Download;
  Loader2Icon = Loader2;
  AlertCircleIcon = AlertCircle;

  // State
  isLoading = signal(false);
  isDownloading = signal(false);
  error = signal<string | null>(null);

  // Computed
  topInsights = computed(() => {
    if (!this.analysis) return [];
    const insights = this.analysis?.analysisResult?.insights || [];
    return (insights as Array<any>).slice(0, 3);
  });

  ngOnInit() {
    console.log('✅ [MODAL] Analysis Results Modal initialized');
  }

  close() {
    this.closeModal.emit();
  }

  closeIfBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  async downloadPdf() {
    if (!this.analysis || !this.smeName) {
      console.error('❌ [MODAL] Missing analysis or SME name');
      return;
    }

    this.isDownloading.set(true);
    this.error.set(null);

    try {
      const analysis = this.analysis;
      const score = analysis.analysisResult.investmentScore;
      const rawInsights = analysis.analysisResult.insights || [];

      // Ensure insights have correct type
      const insights = rawInsights.map((i: any) => ({
        title: i.title || '',
        description: i.description || '',
        type: i.type || 'insight',
        severity: (i.severity || 'medium') as 'low' | 'medium' | 'high',
        recommendation: i.recommendation || '',
        source: i.source,
        confidence: i.confidence,
      }));

      await this.pdfService.generatePdf({
        smeName: this.smeName,
        generationDate: new Date(analysis.createdAt),
        investmentScore: score,
        insights,
        processingTimeMs: analysis.processingTimeMs,
      });

      console.log('✅ [MODAL] PDF downloaded successfully');
    } catch (err) {
      console.error('❌ [MODAL] PDF download failed:', err);
      this.error.set('Failed to generate PDF. Please try again.');
    } finally {
      this.isDownloading.set(false);
    }
  }

  formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  }

  // Styling helpers
  getScoreBgClass(): string {
    const score = this.analysis?.analysisResult.investmentScore.overall || 0;
    if (score >= 75) return 'bg-green-50 border-green-200/50';
    if (score >= 60) return 'bg-amber-50 border-amber-200/50';
    if (score >= 40) return 'bg-blue-50 border-blue-200/50';
    return 'bg-red-50 border-red-200/50';
  }

  getScoreTextClass(): string {
    const score = this.analysis?.analysisResult.investmentScore.overall || 0;
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    if (score >= 40) return 'text-blue-600';
    return 'text-red-600';
  }

  getRecommendationClass(): string {
    const rec =
      this.analysis?.analysisResult.investmentScore.recommendation || '';
    if (rec === 'strong_buy') return 'text-green-700';
    if (rec === 'consider') return 'text-amber-700';
    if (rec === 'need_more_info') return 'text-blue-700';
    return 'text-red-700';
  }

  getInsightCardClass(severity: string | undefined): string {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200/50';
      case 'medium':
        return 'bg-amber-50 border-amber-200/50';
      case 'low':
        return 'bg-blue-50 border-blue-200/50';
      default:
        return 'bg-slate-50 border-slate-200/50';
    }
  }

  getInsightIndicatorClass(severity: string | undefined): string {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-slate-400';
    }
  }
}
