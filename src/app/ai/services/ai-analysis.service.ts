 
// src/app/ai/services/ai-analysis.service.ts - UPDATED FOR QUEUE INTEGRATION
import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { FundingOpportunity } from '../../shared/models/funder.models';
import { FundingApplicationProfile } from 'src/app/SMEs/applications/models/funding-application.models';
import { AIAnalysisQueueService } from './ai-analysis-queue.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
 
export interface AIAnalysisRequest {
  opportunity: FundingOpportunity | null;
  applicationData: {
    requestedAmount: string;
    purposeStatement: string;
    useOfFunds: string;
    timeline: string;
    opportunityAlignment: string;
  } | null;
  businessProfile: FundingApplicationProfile;
  backgroundMode?: boolean;
}

export interface AIAnalysisResult {
  matchScore: number;
  successProbability: number;
  competitivePositioning: 'strong' | 'moderate' | 'weak';
  strengths: string[];
  improvementAreas: string[];
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    impact: string;
  }>;
  keyInsights: string[];
  recommendations: string[];
  generatedAt: string;
  modelVersion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AIAnalysisService {
  private supabase = inject(SharedSupabaseService);
  private queueService = inject(AIAnalysisQueueService);

  // State management
  private isAnalyzingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  public isAnalyzing = signal(false);
  public error = signal<string | null>(null);

  constructor() {
    

    // Keep signals in sync with subjects
    this.isAnalyzingSubject.subscribe(value => this.isAnalyzing.set(value));
    this.errorSubject.subscribe(value => this.error.set(value));
  }

  // =======================
  // MAIN ANALYSIS METHODS
  // =======================

  /**
   * Analyze application - supports both immediate and background modes
   */
  analyzeApplication(request: AIAnalysisRequest): Observable<AIAnalysisResult | { jobId: string; status: string }> {
    // Clear previous error
    this.clearError();

    if (request.backgroundMode) {
      return this.queueBackgroundAnalysis(request);
    } else {
      return this.performImmediateAnalysis(request);
    }
  }

  /**
   * Queue analysis for background processing (email delivery)
   */
  private queueBackgroundAnalysis(request: AIAnalysisRequest): Observable<{ jobId: string; status: string }> {
    const queueRequest = {
      analysisMode: request.opportunity ? 'opportunity' as const : 'profile' as const,
      businessProfile: request.businessProfile,
      opportunity: request.opportunity,
      applicationData: request.applicationData
    };

    return this.queueService.queueAnalysisJob(queueRequest).pipe(
      catchError(error => {
        this.setError(`Failed to queue AI analysis: ${error.message || error}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * Perform immediate AI analysis (synchronous)
   */
  private performImmediateAnalysis(request: AIAnalysisRequest): Observable<AIAnalysisResult> {
    this.setAnalyzing(true);

    return from(this.callAIAnalysisEdgeFunction(request)).pipe(
      map(result => this.transformAnalysisResult(result)),
      catchError(error => {
        const errorMessage = this.getErrorMessage(error);
        this.setError(errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
      // Always clear analyzing state
      map(result => {
        this.setAnalyzing(false);
        return result;
      })
    );
  }

  /**
   * Call the Supabase Edge Function for AI analysis
   */
  private async callAIAnalysisEdgeFunction(request: AIAnalysisRequest): Promise<any> {
    try {
      const { data, error } = await this.supabase.functions.invoke('analyze-application', {
        body: {
          analysisMode: request.opportunity ? 'opportunity' : 'profile',
          businessProfile: request.businessProfile,
          opportunityData: request.opportunity,
          applicationData: request.applicationData,
          applicantProfile: request.businessProfile, // Backward compatibility
          applicationId: this.generateApplicationId()
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'AI analysis failed');
      }

      if (!data) {
        throw new Error('No response from AI analysis service');
      }

      return data;

    } catch (error) {
      console.error('AI Analysis service error:', error);
      throw error;
    }
  }

  // =======================
  // RESULT MANAGEMENT
  // =======================

  /**
   * Get user's saved AI analysis results
   */
  getSavedAnalysisResults(): Observable<AIAnalysisResult[]> {
    return this.queueService.getUserAnalysisJobs(20).pipe(
      map(jobs => jobs
        .filter(job => job.status === 'completed' && job.result)
        .map(job => this.transformAnalysisResult(job.result))
      ),
      catchError(error => {
        console.error('Error fetching saved results:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get specific analysis result by job ID
   */
  getAnalysisResult(jobId: string): Observable<AIAnalysisResult | null> {
    return this.queueService.getJobStatus(jobId).pipe(
      map(job => {
        if (job && job.status === 'completed' && job.result) {
          return this.transformAnalysisResult(job.result);
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching analysis result:', error);
        return throwError(() => error);
      })
    );
  }

  // =======================
  // REAL-TIME UPDATES
  // =======================

  /**
   * Subscribe to AI analysis job updates
   */
  subscribeToJobUpdates(callback: (result: AIAnalysisResult) => void): () => void {
    return this.queueService.subscribeToJobUpdates((job) => {
      if (job.status === 'completed' && job.result) {
        const analysisResult = this.transformAnalysisResult(job.result);
        callback(analysisResult);
      }
    });
  }

  // =======================
  // STATE MANAGEMENT
  // =======================

  private setAnalyzing(analyzing: boolean): void {
    this.isAnalyzingSubject.next(analyzing);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
    if (error) {
      this.setAnalyzing(false);
    }
  }

  clearError(): void {
    this.setError(null);
  }

  // =======================
  // UTILITY METHODS
  // =======================

  private transformAnalysisResult(data: any): AIAnalysisResult {
    return {
      matchScore: data.matchScore || 0,
      successProbability: data.successProbability || 0,
      competitivePositioning: data.competitivePositioning || 'weak',
      strengths: Array.isArray(data.strengths) ? data.strengths : [],
      improvementAreas: Array.isArray(data.improvementAreas) ? data.improvementAreas : [],
      riskFactors: Array.isArray(data.riskFactors) ? data.riskFactors : [],
      keyInsights: Array.isArray(data.keyInsights) ? data.keyInsights : [],
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
      generatedAt: data.generatedAt || new Date().toISOString(),
      modelVersion: data.modelVersion
    };
  }

  private getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error) return error.error;
    return 'An unexpected error occurred during AI analysis';
  }

  private generateApplicationId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // =======================
  // CACHE MANAGEMENT
  // =======================

  /**
   * Clear any cached analysis results (if implemented)
   */
  clearCache(): void {
    // Implementation depends on your caching strategy
    console.log('AI analysis cache cleared');
  }

  // =======================
  // HELPER METHODS FOR UI
  // =======================

  getActivityTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'application': 'blue',
      'funding': 'green',
      'profile': 'purple',
      'document': 'orange',
      'system': 'gray',
      'partnership': 'indigo',
      'milestone': 'pink'
    };
    return colors[type] || 'gray';
  }

  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}w ago`;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}