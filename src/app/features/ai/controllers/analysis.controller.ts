// src/app/ai/services/ai-analysis.controller.ts
/**
 * AI Analysis Controller
 *
 * Handles:
 * - Analysis workflow orchestration (generate → create request → execute → persist)
 * - Credit gating integration
 * - Error handling and logging
 * - State management for analysis process
 * - User ID extraction from AuthService
 *
 * Separates business logic from UI concerns
 */

import { Injectable, inject, signal } from '@angular/core';

import { AiAnalysisRequestService } from '../services/ai_analysis_request.service';

import {
  ApplicationInsight,
  InvestmentScore,
  ApplicationIntelligenceService,
} from '../services/application-intelligence.service';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { CreditGatingService } from '../../credit-system/services/credit-gating.service';

export interface AnalysisRequest {
  id: string;
  orgId: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  error?: string;
}

export interface AnalysisResult {
  insights: ApplicationInsight[];
  investmentScore: InvestmentScore;
  processingTimeMs: number;
}

@Injectable({ providedIn: 'root' })
export class AiAnalysisController {
  private analysisRequestService = inject(AiAnalysisRequestService);
  private creditGatingService = inject(CreditGatingService);
  private appIntelligenceService = inject(ApplicationIntelligenceService);
  private authService = inject(AuthService);

  // ✅ STATE MANAGEMENT
  isAnalysisAvailable = signal(false);
  isGeneratingAnalysis = signal(false);
  isProcessingCredits = signal(false);
  analysisError = signal<string | null>(null);

  currentAnalysisRequestId = signal<string | null>(null);
  currentAnalysisRequest = signal<AnalysisRequest | null>(null);
  analysisCost = signal(0);
  hasFreeAnalysisAvailable = signal(true);

  // ============================================================================
  // ANALYSIS INITIALIZATION
  // ============================================================================

  /**
   * Initialize analysis workflow
   * Creates request record and determines if free or paid
   * Extracts user ID from AuthService
   *
   * @param organizationId Organization ID
   * @param applicationData Application data snapshot
   * @param opportunityData Opportunity data snapshot
   * @param profileData Profile data snapshot
   * @param isFree Whether this is free analysis
   * @param applicationId Application ID (for linking results) ← NEW
   * @param opportunityId Opportunity ID (for linking results) ← NEW
   * @returns Analysis request ID
   */
  async initializeAnalysis(
    organizationId: string,
    applicationData: any,
    opportunityData: any,
    profileData: any,
    isFree: boolean = true,
    applicationId?: string,
    opportunityId?: string
  ): Promise<string> {
    console.log('🔍 [ANALYSIS-CONTROLLER] Initializing analysis', {
      organizationId,
      isFree,
      applicationId,
      opportunityId,
      hasAppData: !!applicationData,
      hasOppData: !!opportunityData,
    });

    this.analysisError.set(null);

    // Validate inputs
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    if (!applicationData) {
      throw new Error('Application data is required');
    }
    if (!opportunityData) {
      throw new Error('Opportunity data is required');
    }

    try {
      // Get current user ID from AuthService
      const currentUser = this.authService.user();
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      const cost = isFree ? 0 : 50;
      const requestId = await this.analysisRequestService.createAnalysisRequest(
        organizationId,
        isFree,
        cost,
        applicationData,
        opportunityData,
        profileData,
        currentUser.id, // ← USER ID
        applicationId, // ← APPLICATION ID
        opportunityId // ← OPPORTUNITY ID
      );

      this.currentAnalysisRequestId.set(requestId);
      this.analysisCost.set(cost);
      this.currentAnalysisRequest.set({
        id: requestId,
        orgId: organizationId,
        status: 'pending',
      });

      return requestId;
    } catch (error) {
      this.analysisError.set(`Failed to initialize analysis: ${error}`);
      throw error;
    }
  }

  // ============================================================================
  // CREDIT GATING
  // ============================================================================

  /**
   * Process credits for paid analysis
   */
  async processCredits(organizationId: string): Promise<void> {
    this.isProcessingCredits.set(true);
    this.analysisError.set(null);

    try {
      await this.creditGatingService.deductCreditsForAction(
        organizationId,
        'generate'
      );
    } catch (error) {
      this.analysisError.set(`Failed to process credits: ${error}`);
      throw error;
    } finally {
      this.isProcessingCredits.set(false);
    }
  }

  // ============================================================================
  // ANALYSIS EXECUTION
  // ============================================================================

  /**
   * Execute comprehensive analysis
   * Returns Observable that component can subscribe to
   */
  executeAnalysis(
    applicationData: any,
    opportunityData: any,
    profileData: any
  ) {
    const requestId = this.currentAnalysisRequestId();
    const startTime = performance.now();

    console.log('🚀 [ANALYSIS-CONTROLLER] Executing analysis', {
      requestId,
      hasAppData: !!applicationData,
      hasOppData: !!opportunityData,
    });

    this.isGeneratingAnalysis.set(true);
    this.analysisError.set(null);

    // Return the observable for component to subscribe
    return this.appIntelligenceService.getComprehensiveAnalysis(
      applicationData,
      opportunityData,
      profileData
    );
  }

  // ============================================================================
  // PERSIST ANALYSIS RESULTS
  // ============================================================================

  /**
   * Persist successful analysis results to database
   */
  async persistAnalysisSuccess(
    insights: ApplicationInsight[],
    investmentScore: InvestmentScore,
    processingTimeMs?: number
  ): Promise<void> {
    const requestId = this.currentAnalysisRequestId();

    if (!requestId) {
      throw new Error('No active analysis request');
    }

    console.log('💾 [ANALYSIS-CONTROLLER] Persisting success', {
      requestId,
      insightCount: insights?.length,
      processingTimeMs: processingTimeMs || 0,
      overallScore: investmentScore?.overall,
    });

    try {
      // Get user ID for persistence
      const currentUser = this.authService.user();
      const userId = currentUser?.id;

      // Service signature: markAnalysisExecuted(requestId, results?, score?, error?, userId?)
      await this.analysisRequestService.markAnalysisExecuted(
        requestId,
        { insights, processingTimeMs }, // analysisResults
        investmentScore, // investmentScore
        undefined, // error (no error means success)
        userId // user ID for results insertion
      );

      console.log('✅ [ANALYSIS-CONTROLLER] Results persisted successfully');

      // Update state
      this.isAnalysisAvailable.set(true);
      this.isGeneratingAnalysis.set(false);
      this.hasFreeAnalysisAvailable.set(false); // Consumed free analysis

      // Update request status
      const request = this.currentAnalysisRequest();
      if (request) {
        request.status = 'completed';
        this.currentAnalysisRequest.set(request);
      }
    } catch (error) {
      this.isGeneratingAnalysis.set(false);
      console.error(
        '❌ [ANALYSIS-CONTROLLER] Failed to persist results:',
        error
      );
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.analysisError.set(`Failed to save results: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Persist analysis error to database
   */
  async persistAnalysisError(
    errorMessage: string,
    processingTimeMs?: number
  ): Promise<void> {
    const requestId = this.currentAnalysisRequestId();

    if (!requestId) {
      console.warn('No active analysis request to mark as error');
      return;
    }

    console.log('⚠️ [ANALYSIS-CONTROLLER] Persisting error', {
      requestId,
      error: errorMessage,
      processingTimeMs: processingTimeMs || 0,
    });

    try {
      // Service signature: markAnalysisExecuted(requestId, results?, score?, error?, userId?)
      await this.analysisRequestService.markAnalysisExecuted(
        requestId,
        undefined, // no results on error
        undefined, // no score on error
        errorMessage // error message
      );

      console.log('✅ [ANALYSIS-CONTROLLER] Error persisted');

      // Update request status
      const request = this.currentAnalysisRequest();
      if (request) {
        request.status = 'failed';
        request.error = errorMessage;
        this.currentAnalysisRequest.set(request);
      }
    } catch (persistError) {
      const errorMsg =
        persistError instanceof Error
          ? persistError.message
          : String(persistError);
      console.error(
        '❌ [ANALYSIS-CONTROLLER] Failed to persist error:',
        errorMsg
      );
      // Don't throw - this is a secondary operation
    }
  }

  // ============================================================================
  // CANCELLATION
  // ============================================================================

  /**
   * Cancel ongoing analysis
   */
  async cancelAnalysis(): Promise<void> {
    const requestId = this.currentAnalysisRequestId();

    if (!requestId) {
      return;
    }

    try {
      await this.analysisRequestService.markAnalysisExecuted(
        requestId,
        undefined,
        undefined,
        'User cancelled'
      );

      console.log('✅ [ANALYSIS-CONTROLLER] Cancellation persisted');
    } catch (error) {
      console.error(
        '⚠️ [ANALYSIS-CONTROLLER] Failed to persist cancellation:',
        error
      );
      // Don't throw - allow cleanup to continue
    } finally {
      this.reset();
    }
  }

  // ============================================================================
  // FREE ANALYSIS TRACKING
  // ============================================================================

  /**
   * Check if organization has free analysis available
   */
  async checkFreeAnalysisAvailability(organizationId: string): Promise<void> {
    if (!organizationId) {
      this.hasFreeAnalysisAvailable.set(false);
      return;
    }

    try {
      const hasUsed = await this.analysisRequestService.hasUsedFreeAnalysis(
        organizationId
      );

      this.hasFreeAnalysisAvailable.set(!hasUsed);
    } catch (error) {
      this.hasFreeAnalysisAvailable.set(false);
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get current analysis cost
   */
  getCurrentCost(): number {
    return this.analysisCost();
  }

  /**
   * Check if analysis is free
   */
  isFreeAnalysis(): boolean {
    return this.analysisCost() === 0;
  }

  /**
   * Get current request status
   */
  getCurrentRequestStatus(): AnalysisRequest | null {
    return this.currentAnalysisRequest();
  }

  /**
   * Reset analysis state
   */
  reset(): void {
    this.currentAnalysisRequestId.set(null);
    this.currentAnalysisRequest.set(null);
    this.analysisCost.set(0);
    this.isGeneratingAnalysis.set(false);
    this.isProcessingCredits.set(false);
    this.analysisError.set(null);
  }

  /**
   * Get formatted error message
   */
  getFormattedError(): string {
    return this.analysisError() || 'Unknown error occurred';
  }
}
