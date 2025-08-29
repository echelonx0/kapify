// src/app/applications/components/ai-analysis/ai-application-analysis.component.ts
import { Component, Input, Output, EventEmitter, signal, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bot, Sparkles, TrendingUp, AlertTriangle, CheckCircle, Loader2, Target, Award, Shield, RefreshCw, XCircle } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { UiButtonComponent, UiCardComponent } from '../../shared/components';
import { FundingOpportunity } from '../../shared/models/funder.models';
import { AIAnalysisService, AIAnalysisRequest } from '../services/ai-analysis.service';
import { FundingApplicationProfile } from 'src/app/SMEs/applications/models/funding-application.models';
 
 

interface AIAnalysisResult {
  matchScore: number;
  strengths: string[];
  improvementAreas: string[];
  successProbability: number;
  competitivePositioning: 'strong' | 'moderate' | 'weak';
  keyInsights: string[];
  recommendations: string[];
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    impact: string;
  }>;
  generatedAt: Date;
  modelVersion?: string;
}

interface CoverInformation {
  requestedAmount: string;
  purposeStatement: string;
  useOfFunds: string;
  timeline: string;
  opportunityAlignment: string;
}

@Component({
  selector: 'app-ai-application-analysis',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent
  ],
  templateUrl: './ai-application-analysis.component.html'
})
export class AIApplicationAnalysisComponent implements OnDestroy {
  @Input() opportunity: FundingOpportunity | null = null;
  @Input() applicationData: CoverInformation | null = null;
  @Input() applicationId: string | null = null;  
  @Input()
  businessProfile!: FundingApplicationProfile;  
  @Input() isSubmitted = false;
  
  @Output() analysisCompleted = new EventEmitter<AIAnalysisResult>();
  @Output() improvementRequested = new EventEmitter<void>();
  @Output() proceedRequested = new EventEmitter<void>();

  // Services
  private aiAnalysisService = inject(AIAnalysisService);
  private destroy$ = new Subject<void>();

  // Icons
  BotIcon = Bot;
  SparklesIcon = Sparkles;
  TrendingUpIcon = TrendingUp;
  AlertTriangleIcon = AlertTriangle;
  CheckCircleIcon = CheckCircle;
  Loader2Icon = Loader2;
  TargetIcon = Target;
  AwardIcon = Award;
  ShieldIcon = Shield;
  RefreshCwIcon = RefreshCw;
  XCircleIcon = XCircle;

  // State from AI service
  isAnalyzing = computed(() => this.aiAnalysisService.isAnalyzing());
  analysisError = computed(() => this.aiAnalysisService.error());
  
  // Local state
  analysisResult = signal<AIAnalysisResult | null>(null);
  analysisProgress = signal(0);
  currentAnalysisStep = signal('');

  // Computed properties
  canAnalyze = computed(() => {
    if (!this.opportunity || !this.applicationData) return false;
    
    const data = this.applicationData;
    return !!(
      data.requestedAmount && 
      parseFloat(data.requestedAmount) > 0 &&
      data.purposeStatement?.trim() && 
      data.useOfFunds?.trim()
    );
  });

  hasError = computed(() => !!this.analysisError());
  
  constructor() {
    console.log('AI Application Analysis Component initialized with real AI service');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async startAnalysis() {
    if (!this.canAnalyze()) {
      console.warn('Cannot analyze - missing required data');
      return;
    }

    const request = this.buildAnalysisRequest();
    if (!request) {
      console.error('Failed to build analysis request');
      return;
    }

    // Clear previous results and errors
    this.analysisResult.set(null);
    this.aiAnalysisService.clearError();
    
    // Start progress simulation
    this.startProgressSimulation();

    // Call real AI analysis service
    this.aiAnalysisService.analyzeApplication(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          // Transform service result to component format
          const transformedResult = this.transformServiceResult(result);
          this.analysisResult.set(transformedResult);
          this.analysisCompleted.emit(transformedResult);
          this.completeProgress();
          console.log('AI Analysis completed:', result);
        },
        error: (error) => {
          console.error('AI Analysis failed:', error);
          this.analysisProgress.set(0);
          this.currentAnalysisStep.set('');
          // Error is already set in the service
        }
      });
  }

  private buildAnalysisRequest(): AIAnalysisRequest | null {
    const opportunity = this.opportunity;
    const applicationData = this.applicationData;

    if (!opportunity || !applicationData) {
      return null;
    }

    return {
      opportunity,
      applicationData: {
        requestedAmount: applicationData.requestedAmount || '0',
        purposeStatement: applicationData.purposeStatement || '',
        useOfFunds: applicationData.useOfFunds || '',
        timeline: applicationData.timeline || '',
        opportunityAlignment: applicationData.opportunityAlignment || ''
      },
      businessProfile: this.businessProfile
    };
  }

  private transformServiceResult(serviceResult: any): AIAnalysisResult {
    return {
      matchScore: serviceResult.matchScore || 0,
      successProbability: serviceResult.successProbability || 0,
      competitivePositioning: serviceResult.competitivePositioning || 'weak',
      strengths: serviceResult.strengths || [],
      improvementAreas: serviceResult.improvementAreas || [],
      keyInsights: serviceResult.keyInsights || [],
      recommendations: serviceResult.recommendations || [],
      riskFactors: serviceResult.riskFactors || [],
      generatedAt: serviceResult.generatedAt || new Date(),
      modelVersion: serviceResult.modelVersion
    };
  }

  // Progress simulation for better UX
  private startProgressSimulation() {
    const steps = [
      { progress: 15, step: 'Preparing application data...' },
      { progress: 30, step: 'Analyzing opportunity match...' },
      { progress: 50, step: 'Evaluating financial requirements...' },
      { progress: 70, step: 'Assessing success probability...' },
      { progress: 85, step: 'Generating insights...' }
    ];

    let currentStepIndex = 0;
    
    const updateProgress = () => {
      if (currentStepIndex < steps.length && this.isAnalyzing()) {
        const step = steps[currentStepIndex];
        this.analysisProgress.set(step.progress);
        this.currentAnalysisStep.set(step.step);
        
        currentStepIndex++;
        setTimeout(updateProgress, 800 + Math.random() * 400); // Vary timing
      }
    };

    updateProgress();
  }

  private completeProgress() {
    this.analysisProgress.set(100);
    this.currentAnalysisStep.set('Analysis complete!');
    
    // Clear progress after a moment
    setTimeout(() => {
      this.analysisProgress.set(0);
      this.currentAnalysisStep.set('');
    }, 1000);
  }

  refreshAnalysis() {
    this.startAnalysis();
  }

  improveApplication() {
    this.improvementRequested.emit();
  }

  proceedWithApplication() {
    this.proceedRequested.emit();
  }

  // Error handling methods
  retryAnalysis() {
    this.aiAnalysisService.clearError();
    this.startAnalysis();
  }

  getErrorMessage(): string {
    return this.analysisError() || 'An unexpected error occurred';
  }

  clearError() {
    this.aiAnalysisService.clearError();
  }

  // Validation helper
  getCannotAnalyzeReason(): string {
    if (!this.opportunity) return 'No opportunity data available';
    if (!this.applicationData) return 'No application data available';
    
    const data = this.applicationData;
    if (!data.requestedAmount || parseFloat(data.requestedAmount) <= 0) {
      return 'Please specify a valid requested amount';
    }
    if (!data.purposeStatement?.trim()) {
      return 'Please provide a purpose statement';
    }
    if (!data.useOfFunds?.trim()) {
      return 'Please describe how you will use the funds';
    }
    
    return 'Complete required fields to enable analysis';
  }

  // UI Helper Methods (unchanged from original)
  getScoreBarClass(score: number): string {
    if (score >= 80) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (score >= 60) return 'bg-gradient-to-r from-orange-500 to-orange-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  }

  getCompetitivePositioningClass(position: string): string {
    const baseClass = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (position) {
      case 'strong': return `${baseClass} bg-green-100 text-green-800`;
      case 'moderate': return `${baseClass} bg-orange-100 text-orange-800`;
      case 'weak': return `${baseClass} bg-red-100 text-red-800`;
      default: return `${baseClass} bg-gray-100 text-gray-800`;
    }
  }

  getRiskSeverityClass(severity: string): string {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  formatTime(date: Date): string {
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

  // Check if using real AI (for display purposes)
  isUsingRealAI(): boolean {
    const result = this.analysisResult();
    return result?.modelVersion === 'gemini-2.5-flash';
  }
}