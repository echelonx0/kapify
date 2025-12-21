// src/app/ai/services/ai-analysis-request.service.ts - UPDATED
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

/**
 * Represents an AI analysis request record
 */
export interface AiAnalysisRequest {
  id: string;
  org_id: string;
  request_type: string;
  status: 'pending' | 'executed_free' | 'executed_paid' | 'cancelled';
  cost_credits: number;
  was_free: boolean;
  application_data?: Record<string, any>;
  opportunity_data?: Record<string, any>;
  profile_data?: Record<string, any>;
  analysis_results?: Record<string, any>;
  investment_score?: Record<string, any>;
  created_at: string;
  executed_at?: string;
  error_message?: string;
  user_id?: string;
}

@Injectable({ providedIn: 'root' })
export class AiAnalysisRequestService {
  private supabase = inject(SharedSupabaseService);

  /**
   * ✅ FIXED: Check if organization has already used their free analysis
   * @param orgId Organization ID
   * @returns true if free analysis has been used, false otherwise
   */
  async hasUsedFreeAnalysis(orgId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .rpc('has_org_used_free_analysis', { org_id_param: orgId })
        .single();

      if (error) {
        console.error('❌ [AI Analysis] Error checking free analysis:', error);
        throw error;
      }

      // ✅ FIX: Ensure we return boolean, not object
      // RPC might return boolean or object, so we explicitly cast
      const result = typeof data === 'boolean' ? data : Boolean(data);

      console.log(
        `✅ [AI Analysis] Free analysis check for ${orgId}: ${
          result ? 'USED' : 'AVAILABLE'
        }`
      );
      return result;
    } catch (error) {
      console.error(
        '❌ [AI Analysis] Failed to check free analysis status:',
        error
      );
      throw error;
    }
  }

  /**
   * Record an AI analysis request in the database
   * Call this BEFORE running the analysis
   *
   * @param orgId Organization ID
   * @param isFree Whether this is the free analysis
   * @param cost Cost in credits (0 for free)
   * @param applicationData Application snapshot
   * @param opportunityData Opportunity snapshot
   * @param profileData Profile snapshot
   * @param userId User ID (from AuthService)
   * @returns Analysis request ID
   */
  async createAnalysisRequest(
    orgId: string,
    isFree: boolean,
    cost: number,
    applicationData?: Record<string, any>,
    opportunityData?: Record<string, any>,
    profileData?: Record<string, any>,
    userId?: string
  ): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .rpc('record_ai_analysis_request', {
          org_id_param: orgId,
          request_type_param: 'analysis',
          was_free_param: isFree,
          cost_param: cost,
          app_data_param: applicationData || null,
          opp_data_param: opportunityData || null,
          profile_data_param: profileData || null,
          user_id_param: userId || null,
        })
        .single();

      if (error) {
        console.error('❌ [AI Analysis] Error creating request:', error);
        throw error;
      }

      console.log(
        `✅ [AI Analysis] Request created: ${data} (free: ${isFree}, cost: ${cost}, userId: ${userId})`
      );
      return data as string;
    } catch (error) {
      console.error('❌ [AI Analysis] Failed to create request:', error);
      throw error;
    }
  }

  /**
   * Mark an analysis request as executed and store results
   * Call this AFTER analysis completes
   *
   * @param requestId Analysis request ID (returned from createAnalysisRequest)
   * @param analysisResults The analysis results
   * @param investmentScore The investment score
   * @param error Optional error message if analysis failed
   * @param userId Optional user ID for results insertion
   * @param analysisType Type of analysis: 'profile' or 'opportunity' (default: 'profile')
   */
  async markAnalysisExecuted(
    requestId: string,
    analysisResults?: Record<string, any>,
    investmentScore?: Record<string, any>,
    error?: string,
    userId?: string,
    analysisType: string = 'profile'
  ): Promise<void> {
    try {
      const { error: rpcError } = await this.supabase.rpc(
        'mark_analysis_executed',
        {
          request_id_param: requestId,
          analysis_results_param: analysisResults || null,
          investment_score_param: investmentScore || null,
          error_msg_param: error || null,
          user_id_param: userId || null,
          analysis_type_param: analysisType,
        }
      );

      if (rpcError) {
        console.error('❌ [AI Analysis] Error marking executed:', rpcError);
        throw rpcError;
      }

      const status = error ? 'FAILED' : 'EXECUTED';
      console.log(`✅ [AI Analysis] Request ${status}: ${requestId}`);
    } catch (error) {
      console.error('❌ [AI Analysis] Failed to mark executed:', error);
      throw error;
    }
  }

  /**
   * Get analysis request by ID
   * @param requestId Analysis request ID
   * @returns Analysis request details
   */
  async getAnalysisRequest(requestId: string): Promise<AiAnalysisRequest> {
    try {
      const { data, error } = await this.supabase
        .from('ai_analysis_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        throw error;
      }

      return data as AiAnalysisRequest;
    } catch (error) {
      console.error('❌ [AI Analysis] Failed to fetch request:', error);
      throw error;
    }
  }

  /**
   * Get all analysis requests for organization
   * @param orgId Organization ID
   * @param limit Number of results to limit
   * @returns Array of analysis requests
   */
  async getOrgAnalysisRequests(
    orgId: string,
    limit: number = 10
  ): Promise<AiAnalysisRequest[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_analysis_requests')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return (data || []) as AiAnalysisRequest[];
    } catch (error) {
      console.error('❌ [AI Analysis] Failed to fetch org requests:', error);
      throw error;
    }
  }

  /**
   * Get count of executed analyses for organization
   * @param orgId Organization ID
   * @returns Count of executed analyses
   */
  async getExecutedAnalysisCount(orgId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('ai_analysis_requests')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .in('status', ['executed_free', 'executed_paid']);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ [AI Analysis] Failed to count analyses:', error);
      throw error;
    }
  }
}
