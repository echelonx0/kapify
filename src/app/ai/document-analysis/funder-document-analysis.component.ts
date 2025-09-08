// src/app/ai/document-analysis/funder-document-analysis.component.ts
import { Component, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  FileText, 
  Upload, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Download,
  Eye,
  Globe,
  Target,
  DollarSign,
  Clock,
  Building
} from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';

import { UiButtonComponent } from 'src/app/shared/components';
import { FunderDocumentAnalysisService, ProcessingStatus, DocumentAnalysisResult } from '../services/funder-document-analysis.service';

@Component({
  selector: 'app-funder-document-analysis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    UiButtonComponent
  ],
  templateUrl: 'funder-document-analysis.component.html'
})
export class FunderDocumentAnalysisComponent implements OnDestroy {
  private analysisService = inject(FunderDocumentAnalysisService);
  private destroy$ = new Subject<void>();

  // Icons
  FileTextIcon = FileText;
  UploadIcon = Upload;
  SparklesIcon = Sparkles;
  TrendingUpIcon = TrendingUp;
  AlertTriangleIcon = AlertTriangle;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  Loader2Icon = Loader2;
  DownloadIcon = Download;
  EyeIcon = Eye;
  GlobeIcon = Globe;
  TargetIcon = Target;
  DollarSignIcon = DollarSign;
  ClockIcon = Clock;
  BuildingIcon = Building;
 
  // State
  isDragOver = signal(false);
  isProcessing = signal(false);
  analysisResult = signal<DocumentAnalysisResult | null>(null);
  errorMessage = signal<string | null>(null);
  uploadedFile = signal<File | null>(null);
  
  processingStatuses = signal<Array<{
    stage: string;
    label: string;
    details?: string;
    completed: boolean;
    active: boolean;
  }>>([
    { stage: 'upload', label: 'Processing Document', completed: false, active: false },
    { stage: 'extract', label: 'Extracting Content', completed: false, active: false },
    { stage: 'market', label: 'Gathering Market Intelligence', completed: false, active: false },
    { stage: 'analyze', label: 'AI Analysis', completed: false, active: false },
    { stage: 'complete', label: 'Generating Insights', completed: false, active: false }
  ]);

  // Computed
  hasError = computed(() => !!this.errorMessage());

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // File Handling Methods
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

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      this.errorMessage.set('File size must be less than 10MB');
      return;
    }

    this.uploadedFile.set(file);
    this.startAnalysis(file);
  }

  private async startAnalysis(file: File) {
    this.isProcessing.set(true);
    this.errorMessage.set(null);
    this.analysisResult.set(null);

    try {
      // Reset processing statuses
      this.processingStatuses.set([
        { stage: 'upload', label: 'Processing Document', completed: false, active: true },
        { stage: 'extract', label: 'Extracting Content', completed: false, active: false },
        { stage: 'market', label: 'Gathering Market Intelligence', completed: false, active: false },
        { stage: 'analyze', label: 'AI Analysis', completed: false, active: false },
        { stage: 'complete', label: 'Generating Insights', completed: false, active: false }
      ]);

      // Subscribe to processing status updates
      this.analysisService.processingStatus$
        .pipe(takeUntil(this.destroy$))
        .subscribe(status => {
          if (status) {
            this.updateProcessingStatus(status);
          }
        });

      // Start the analysis
      this.analysisService.analyzeDocument(file).subscribe({
        next: (result) => {
          this.analysisResult.set(result);
          this.markStageComplete('complete');
        },
        error: (error) => {
          console.error('Analysis failed:', error);
          this.errorMessage.set(error.message || 'Analysis failed. Please try again.');
            this.isProcessing.set(false); // Add this line
        },
        complete: () => {
          this.isProcessing.set(false);
        }
      });

    } catch (error: any) {
      console.error('Analysis failed:', error);
      this.errorMessage.set(error.message || 'Analysis failed. Please try again.');
      this.isProcessing.set(false);
    }
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
    const stageIndex = stages.findIndex(s => s.stage === stage);
    
    if (stageIndex >= 0) {
      stages[stageIndex] = {
        ...stages[stageIndex],
        active,
        details
      };
      this.processingStatuses.set([...stages]);
    }
  }

  private markStageComplete(stage: string) {
    const stages = this.processingStatuses();
    const stageIndex = stages.findIndex(s => s.stage === stage);
    
    if (stageIndex >= 0) {
      stages[stageIndex] = {
        ...stages[stageIndex],
        completed: true,
        active: false
      };
      this.processingStatuses.set([...stages]);
    }
  }

  // Reset and Actions
  resetAnalysis() {
    this.isProcessing.set(false);
    this.analysisResult.set(null);
    this.errorMessage.set(null);
    this.uploadedFile.set(null);
    this.isDragOver.set(false);
    this.analysisService.clearStatus();
  }

  downloadReport() {
    const result = this.analysisResult();
    if (!result) return;

    // Create a comprehensive report
    const reportData = {
      documentName: this.uploadedFile()?.name || 'Business Proposal',
      analysisDate: new Date().toISOString(),
      executiveSummary: {
        investmentScore: result.matchScore,
        successProbability: result.successProbability,
        marketTiming: result.marketTimingInsight,
        competitivePosition: result.competitivePositioning,
        confidence: result.confidence
      },
      analysis: result,
      generatedBy: 'Kapify AI Document Analysis'
    };

    // Convert to JSON and download
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  shareAnalysis() {
    // In a real implementation, this would open a sharing modal
    // or copy a shareable link to the clipboard
    console.log('Share analysis functionality to be implemented');
  }

  // UI Helper Methods
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
        return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 text-blue-600';
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