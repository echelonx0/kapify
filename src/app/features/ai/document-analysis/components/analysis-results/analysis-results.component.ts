import { Component, Input, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  LucideAngularModule,
  Download,
  Eye,
  Globe,
  TrendingUp,
  CheckCircle,
  Clock,
  Building,
  ChevronDown,
  X,
  ExternalLink,
  Lightbulb,
  Loader,
  ChevronLeft,
  ArrowRight,
} from 'lucide-angular';
import {
  DocumentAnalysisResult,
  FunderDocumentAnalysisService,
} from '../../../services/funder-document-analysis.service';
import { AnalysisReportExportService } from '../../../services/ai-analysis-export.service';
import { AIAnalysisHistoryService } from '../../../services/ai-analysis-history.service';

@Component({
  selector: 'app-analysis-results',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './analysis-results.component.html',
  styleUrls: ['./analysis-results.component.css'],
})
export class AnalysisResultsComponent implements OnInit {
  @Input() result: DocumentAnalysisResult | null = null;
  @Input() uploadedFileName: string = 'Business Proposal';

  private exportService = inject(AnalysisReportExportService);
  private historyService = inject(AIAnalysisHistoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private analysisService = inject(FunderDocumentAnalysisService);

  // State
  showMethodologyModal = signal(false);
  expandedAccordion = signal<string | null>(null);
  expandedInsight = signal<number | null>(null);
  isDownloading = signal(false);
  isLoading = signal(false);
  companyName = signal<string>('');

  // Icons
  DownloadIcon = Download;
  EyeIcon = Eye;
  GlobeIcon = Globe;
  TrendingUpIcon = TrendingUp;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;
  BuildingIcon = Building;
  ChevronDownIcon = ChevronDown;
  XIcon = X;
  ExternalLinkIcon = ExternalLink;
  LightbulbIcon = Lightbulb;
  LoaderIcon = Loader;
  ChevronLeftIcon = ChevronLeft;
  ArrowRightIcon = ArrowRight;

  ngOnInit() {
    // First, try to get from service (takes precedence)
    const serviceResult = this.analysisService.getCurrentAnalysisResult();

    if (serviceResult) {
      this.result = serviceResult;
      this.ensureResultStructure();
      this.extractCompanyName();
      this.analysisService.clearCurrentAnalysisResult(); // Clean up
      console.log('✅ Result loaded from service:', this.result);
      return;
    }

    // Fallback: load from route (for direct navigation)
    if (!this.result) {
      this.loadAnalysisFromRoute();
    } else {
      this.ensureResultStructure();
      this.extractCompanyName();
      console.log('✅ Result loaded:', this.result);
    }
  }

  /**
   * Extract company name from result metadata
   */
  private extractCompanyName(): void {
    if (!this.result) return;

    // Check if company name is stored in analysis_result metadata
    const metadata = (this.result as any).metadata || {};
    if (metadata.companyName) {
      this.companyName.set(metadata.companyName);
      return;
    }

    // If not found, try to extract from result (it should be passed during analysis)
    if ((this.result as any).companyName) {
      this.companyName.set((this.result as any).companyName);
      return;
    }

    // Default fallback
    this.companyName.set('Business Proposal');
  }

  /**
   * Load analysis from route params (ID-based)
   */
  private loadAnalysisFromRoute(): void {
    this.isLoading.set(true);

    this.route.params.subscribe((params) => {
      const analysisId = params['id'];

      if (!analysisId) {
        console.error('❌ No analysis ID in route');
        this.router.navigate(['/dashboard/reports']);
        return;
      }

      // Fetch from history service
      this.historyService.getAnalysisHistory().subscribe({
        next: (results) => {
          const analysis = results.find((r) => r.id === analysisId);

          if (!analysis) {
            console.error('❌ Analysis not found:', analysisId);
            this.router.navigate(['/dashboard/reports']);
            return;
          }

          this.result = analysis.result;
          this.uploadedFileName = `Analysis_${analysis.result.matchScore}pct`;
          this.ensureResultStructure();
          this.extractCompanyName();
          this.isLoading.set(false);
          console.log('✅ Analysis loaded from history:', this.result);
        },
        error: (err) => {
          console.error('❌ Failed to load analysis:', err);
          this.isLoading.set(false);
          this.router.navigate(['/dashboard/reports']);
        },
      });
    });
  }

  /**
   * Ensure result object has all expected properties
   */
  private ensureResultStructure() {
    if (!this.result) return;

    if (!this.result.strengths) this.result.strengths = [];
    if (!this.result.improvementAreas) this.result.improvementAreas = [];
    if (!this.result.hiddenGemIndicators) this.result.hiddenGemIndicators = [];
    if (!this.result.contrarianSignals) this.result.contrarianSignals = [];
    if (!this.result.keyInsights) this.result.keyInsights = [];
    if (!this.result.riskFactors) this.result.riskFactors = [];
    if (!this.result.sources) this.result.sources = [];
    if (!this.result.recommendations) this.result.recommendations = [];
    if (!this.result.searchQueries) this.result.searchQueries = [];
    if (!this.result.conclusion) this.result.conclusion = '';
    if (!this.result.nextSteps) this.result.nextSteps = [];

    if (!this.result.marketIntelligence) {
      this.result.marketIntelligence = {
        sector: 'N/A',
        trends: [],
        competitorActivity: [],
        timingInsights: [],
        riskFactors: [],
        opportunities: [],
        fundingTrends: {
          dealCount: 0,
          averageRoundSize: 0,
          totalFunding: 0,
          valuationTrend: 'stable' as const,
        },
      };
    }

    // Ensure nested marketIntelligence properties
    if (!this.result.marketIntelligence.trends)
      this.result.marketIntelligence.trends = [];
    if (!this.result.marketIntelligence.competitorActivity)
      this.result.marketIntelligence.competitorActivity = [];
    if (!this.result.marketIntelligence.timingInsights)
      this.result.marketIntelligence.timingInsights = [];
    if (!this.result.marketIntelligence.riskFactors)
      this.result.marketIntelligence.riskFactors = [];
    if (!this.result.marketIntelligence.opportunities)
      this.result.marketIntelligence.opportunities = [];

    if (!this.result.marketIntelligence.fundingTrends) {
      this.result.marketIntelligence.fundingTrends = {
        dealCount: 0,
        averageRoundSize: 0,
        totalFunding: 0,
        valuationTrend: 'stable' as const,
      };
    }
  }

  toggleAccordion(section: string): void {
    this.expandedAccordion.set(
      this.expandedAccordion() === section ? null : section
    );
  }

  toggleInsight(index: number): void {
    this.expandedInsight.set(this.expandedInsight() === index ? null : index);
  }

  openLink(url: string | undefined): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  goBack(): void {
    window.history.back();
  }

  async downloadReport(): Promise<void> {
    if (!this.result) return;

    try {
      this.isDownloading.set(true);

      const timestamp = new Date().toISOString().split('T')[0];
      const companyLabel = this.companyName() || 'analysis';
      const fileName = `${companyLabel}_analysis_${timestamp}.pdf`;

      await this.exportService.exportToPDF(this.result, fileName);

      console.log('✅ Report downloaded successfully');
    } catch (error) {
      console.error('❌ Download failed:', error);
    } finally {
      this.isDownloading.set(false);
    }
  }

  /* ===== UI HELPERS ===== */

  getTimingClasses(timing: string | undefined): string {
    switch (timing?.toLowerCase()) {
      case 'favorable':
        return 'bg-green-50 border-green-200/50 text-green-600';
      case 'neutral':
        return 'bg-slate-50 border-slate-200/50 text-slate-600';
      case 'challenging':
        return 'bg-red-50 border-red-200/50 text-red-600';
      default:
        return 'bg-slate-50 border-slate-200/50 text-slate-600';
    }
  }

  getPositionClasses(position: string | undefined): string {
    switch (position?.toLowerCase()) {
      case 'strong':
        return 'bg-green-50 border-green-200/50 text-green-600';
      case 'moderate':
        return 'bg-slate-50 border-slate-200/50 text-slate-600';
      case 'weak':
        return 'bg-orange-50 border-orange-200/50 text-orange-600';
      default:
        return 'bg-slate-50 border-slate-200/50 text-slate-600';
    }
  }

  getRiskSeverityBadge(severity: string | undefined): string {
    const base = 'px-2 py-1 rounded text-xs font-medium';
    switch (severity?.toLowerCase()) {
      case 'high':
        return `${base} bg-red-100 text-red-800`;
      case 'medium':
        return `${base} bg-amber-100 text-amber-800`;
      case 'low':
        return `${base} bg-yellow-100 text-yellow-800`;
      default:
        return `${base} bg-slate-100 text-slate-800`;
    }
  }

  getSourceTypeColor(type: string | undefined): string {
    const base = 'px-2.5 py-1 rounded-lg text-xs font-medium';
    switch (type?.toLowerCase()) {
      case 'research':
        return `${base} bg-blue-50 text-blue-700 border border-blue-200/50`;
      case 'news':
        return `${base} bg-amber-50 text-amber-700 border border-amber-200/50`;
      case 'analyst':
        return `${base} bg-purple-50 text-purple-700 border border-purple-200/50`;
      case 'company':
        return `${base} bg-teal-50 text-teal-700 border border-teal-300/50`;
      default:
        return `${base} bg-slate-50 text-slate-700 border border-slate-200/50`;
    }
  }

  getTimeAgo(dateString: string): string {
    if (!dateString) return 'unknown';
    const date = new Date(dateString);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} minutes ago`;

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hours ago`;

    return `${Math.floor(hrs / 24)} days ago`;
  }

  formatAmount(amount: number): string {
    if (!amount) return '$0';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount}`;
  }
}
