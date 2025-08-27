// src/app/ai/services/ai-analysis.service.ts
// Background processing - user doesn't wait, gets notified when ready

import { Injectable, inject, signal } from '@angular/core';
import { Observable, of, from, throwError, timer } from 'rxjs';
import { switchMap, takeWhile, map, catchError, tap } from 'rxjs/operators';

import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { AuthService } from '../../auth/production.auth.service';
import { ProfileManagementService } from '../../shared/services/profile-management.service';
import { FundingOpportunity } from '../../shared/models/funder.models';
import { FundingApplicationProfile } from '../../applications/models/funding-application.models';

export interface AIAnalysisRequest {
  opportunity: FundingOpportunity;
  applicationData: {
    requestedAmount: string;
    purposeStatement: string;
    useOfFunds: string;
    timeline: string;
    opportunityAlignment: string;
  };
  businessProfile: FundingApplicationProfile;
}

export interface AIAnalysisResult {
  matchScore: number;
  strengths: string[];
  improvementAreas: string[];
  successProbability: number;
  competitivePositioning: 'strong' | 'moderate' | 'weak';
  keyInsights: string[];
  recommendations: string[];
  riskFactors: Array<{ factor: string; severity: 'low' | 'medium' | 'high'; impact: string }>;
  generatedAt: Date;
  analysisId: string;
  modelVersion: string;
}

@Injectable({ providedIn: 'root' })
export class AIAnalysisService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  private profileService = inject(ProfileManagementService);

  // Signals for UI
  isAnalyzing = signal<boolean>(false);
  error = signal<string | null>(null);
  analysisProgress = signal<number>(0);
  latestResult = signal<AIAnalysisResult | null>(null);

  private analysisCache = new Map<string, AIAnalysisResult>();

  constructor() {
    console.log('AI Analysis Service initialized - Background processing mode');
  }

  /**
   * Fire-and-forget analysis: returns immediately, results come later
   */
  analyzeApplication(request: AIAnalysisRequest): Observable<AIAnalysisResult> {
    this.isAnalyzing.set(true);
    this.error.set(null);
    this.analysisProgress.set(0);

    const cacheKey = this.generateCacheKey(request);
    if (this.analysisCache.has(cacheKey)) {
      this.isAnalyzing.set(false);
      const cached = this.analysisCache.get(cacheKey)!;
      this.latestResult.set(cached);
      return of(cached);
    }

    return this.startBackgroundAnalysis(request).pipe(
      switchMap(({ jobId, immediateResult }) => {
        if (immediateResult) {
          return of(this.handleResult(immediateResult, cacheKey));
        }
        return this.pollForResults(jobId, cacheKey);
      }),
      catchError((error) => {
        this.isAnalyzing.set(false);
        this.analysisProgress.set(0);
        this.error.set(this.getErrorMessage(error));
        console.error('AI Analysis failed:', error);
        return throwError(() => error);
      })
    );
  }

  private startBackgroundAnalysis(
    request: AIAnalysisRequest
  ): Observable<{ jobId: string; immediateResult?: any }> {
    const user = this.authService.user();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const edgeFunctionRequest = {
      ...this.buildEdgeFunctionRequest(request),
      backgroundMode: true
    };

    return from(
      this.supabase.functions.invoke('analyse-fund-application', {
        body: edgeFunctionRequest
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        if (data.result) {
          return { jobId: 'immediate', immediateResult: data.result };
        }
        return { jobId: data.jobId };
      })
    );
  }

  private pollForResults(jobId: string, cacheKey: string): Observable<AIAnalysisResult> {
    return timer(0, 5000).pipe(
      switchMap(() => this.checkAnalysisStatus(jobId)),
      tap(status => {
        if (status.progress) this.analysisProgress.set(status.progress);
      }),
      takeWhile(status => status.status !== 'completed' && status.status !== 'failed', true),
      switchMap(status => {
        if (status.status === 'completed') {
          return this.getAnalysisResults(jobId).pipe(
            map(result => this.handleResult(result, cacheKey))
          );
        } else if (status.status === 'failed') {
          throw new Error(status.error || 'Analysis failed');
        }
        return of(null as any); // still processing
      }),
      catchError((error) => throwError(() => error))
    );
  }

  private checkAnalysisStatus(
    jobId: string
  ): Observable<{ status: string; progress?: number; error?: string }> {
    return from(
      this.supabase.functions.invoke('check-analysis-status', { body: { jobId } })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  private getAnalysisResults(jobId: string): Observable<AIAnalysisResult> {
    return from(
      this.supabase.functions.invoke('get-analysis-results', { body: { jobId } })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.transformAIResponseToResult(data, null);
      })
    );
  }

  private handleResult(result: AIAnalysisResult, cacheKey: string): AIAnalysisResult {
    this.isAnalyzing.set(false);
    this.analysisProgress.set(100);
    this.error.set(null);
    this.analysisCache.set(cacheKey, result);
    this.latestResult.set(result);
    return result;
  }

  // --- Helpers and unchanged methods from your original service ---

  private buildEdgeFunctionRequest(request: AIAnalysisRequest): any {
    const profile = this.profileService.currentProfile();
    const organization = this.profileService.currentOrganization();

    return {
      applicationId: `temp_${Date.now()}`,
      applicationData: {
        requestedAmount: parseFloat(request.applicationData.requestedAmount) || 0,
        purposeStatement: request.applicationData.purposeStatement || '',
        useOfFunds: request.applicationData.useOfFunds || '',
        timeline: request.applicationData.timeline || '',
        opportunityAlignment: request.applicationData.opportunityAlignment || ''
      },
      opportunityData: {
        id: request.opportunity.id,
        title: request.opportunity.title,
        fundingType: request.opportunity.fundingType,
        minInvestment: request.opportunity.minInvestment,
        maxInvestment: request.opportunity.maxInvestment,
        currency: request.opportunity.currency,
        eligibilityCriteria: request.opportunity.eligibilityCriteria,
        decisionTimeframe: request.opportunity.decisionTimeframe,
        totalAvailable: request.opportunity.totalAvailable
      },
      applicantProfile: {
        businessInfo: {
          companyName: organization?.name || 'Business Name',
          industry: this.extractIndustry(request.businessProfile, organization),
          businessStage: this.extractBusinessStage(organization),
          yearsInOperation: this.extractYearsInOperation(organization),
          employeeCount: organization?.employeeCount || 1
        },
        financials: {
          annualRevenue: this.extractAnnualRevenue(request.businessProfile),
          monthlyRevenue: this.extractMonthlyRevenue(request.businessProfile),
          profitMargin: this.extractProfitMargin(request.businessProfile),
          cashFlow: this.extractCashFlow(request.businessProfile)
        },
        completionPercentage: profile?.completionPercentage || 0
      }
    };
  }

  private transformAIResponseToResult(
    aiResult: any,
    _originalRequest: AIAnalysisRequest | null
  ): AIAnalysisResult {
    return {
      matchScore: aiResult.matchScore || 0,
      successProbability: aiResult.successProbability || 0,
      competitivePositioning: aiResult.competitivePositioning || 'weak',
      strengths: aiResult.strengths || [],
      improvementAreas: aiResult.improvementAreas || [],
      keyInsights: aiResult.keyInsights || [],
      recommendations: aiResult.recommendations || [],
      riskFactors: aiResult.riskFactors || [],
      generatedAt: new Date(aiResult.generatedAt) || new Date(),
      analysisId: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      modelVersion: aiResult.modelVersion || 'gemini-2.5-flash'
    };
  }

  private getErrorMessage(error: any): string {
    if (error.name === 'TimeoutError') {
      return 'AI analysis is taking longer than expected. Please try again.';
    }
    if (error.message?.includes('Unauthorized')) {
      return 'Authentication required. Please log in and try again.';
    }
    if (error.message?.includes('Quota exceeded') || error.message?.includes('rate limit')) {
      return 'AI service quota exceeded. Please try again later.';
    }
    if (error.message?.includes('Invalid API key')) {
      return 'AI service configuration error. Please contact support.';
    }
    if (error.message) {
      return error.message;
    }
    if (error.error?.message) {
      return error.error.message;
    }
    return 'AI analysis service is temporarily unavailable. Please try again later.';
  }

  private generateCacheKey(request: AIAnalysisRequest): string {
    const key = JSON.stringify({
      opportunityId: request.opportunity.id,
      requestedAmount: request.applicationData.requestedAmount,
      purposeStatement: request.applicationData.purposeStatement?.substring(0, 50),
      useOfFunds: request.applicationData.useOfFunds?.substring(0, 50)
    });
    return btoa(key);
  }

  // Profile extraction methods
  private extractIndustry(businessProfile: any, organization: any): string {
    if (businessProfile?.industry) return businessProfile.industry;
    if (organization?.organizationType) {
      const typeToIndustry: Record<string, string> = {
        investment_fund: 'Financial Services',
        bank: 'Financial Services',
        technology: 'Technology',
        manufacturing: 'Manufacturing',
        retail: 'Retail',
        healthcare: 'Healthcare'
      };
      return typeToIndustry[organization.organizationType] || 'Technology';
    }
    return 'Technology';
  }

  private extractBusinessStage(organization: any): string {
    const yearsInOperation = this.extractYearsInOperation(organization);
    if (yearsInOperation <= 2) return 'startup';
    if (yearsInOperation <= 5) return 'early-stage';
    if (yearsInOperation <= 10) return 'growth';
    return 'mature';
  }

  private extractYearsInOperation(organization: any): number {
    if (organization?.foundedYear) {
      return new Date().getFullYear() - organization.foundedYear;
    }
    return 3;
  }

  private extractAnnualRevenue(businessProfile: any): number {
    if (businessProfile?.financials?.annualRevenue) {
      return businessProfile.financials.annualRevenue;
    }
    return 2000000;
  }

  private extractMonthlyRevenue(businessProfile: any): number {
    return this.extractAnnualRevenue(businessProfile) / 12;
  }

  private extractProfitMargin(businessProfile: any): number {
    if (businessProfile?.financials?.profitMargin) {
      return businessProfile.financials.profitMargin;
    }
    return 15;
  }

  private extractCashFlow(businessProfile: any): number {
    return this.extractMonthlyRevenue(businessProfile) * 0.1;
  }

  // Utility methods
  clearCache(): void {
    this.analysisCache.clear();
  }

  getCachedAnalysis(request: AIAnalysisRequest): AIAnalysisResult | null {
    const cacheKey = this.generateCacheKey(request);
    return this.analysisCache.get(cacheKey) || null;
  }

  clearError(): void {
    this.error.set(null);
  }

  canAnalyze(request: AIAnalysisRequest): boolean {
    return !!(
      request.opportunity &&
      request.applicationData &&
      request.applicationData.requestedAmount &&
      parseFloat(request.applicationData.requestedAmount) > 0 &&
      request.applicationData.purposeStatement?.trim() &&
      request.applicationData.useOfFunds?.trim()
    );
  }

  getAnalysisReadinessIssues(request: AIAnalysisRequest): string[] {
    const issues: string[] = [];

    if (!request.opportunity) {
      issues.push('No opportunity data available');
    }
    if (!request.applicationData) {
      issues.push('No application data available');
      return issues;
    }
    if (!request.applicationData.requestedAmount || parseFloat(request.applicationData.requestedAmount) <= 0) {
      issues.push('Valid requested amount required');
    }
    if (!request.applicationData.purposeStatement?.trim()) {
      issues.push('Purpose statement required');
    }
    if (!request.applicationData.useOfFunds?.trim()) {
      issues.push('Use of funds description required');
    }
    return issues;
  }

  getServiceStatus(): {
    cacheSize: number;
    isAnalyzing: boolean;
    hasError: boolean;
    errorMessage: string | null;
  } {
    return {
      cacheSize: this.analysisCache.size,
      isAnalyzing: this.isAnalyzing(),
      hasError: !!this.error(),
      errorMessage: this.error()
    };
  }
}
