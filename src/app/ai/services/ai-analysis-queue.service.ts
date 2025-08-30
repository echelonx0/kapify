// src/app/shared/services/ai-analysis-queue.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
 
import { FundingOpportunity } from 'src/app/shared/models/funder.models';
import { FundingApplicationProfile } from 'src/app/SMEs/applications/models/funding-application.models';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
 
export interface AIAnalysisJobRequest {
  analysisMode: 'profile' | 'opportunity';
  businessProfile: FundingApplicationProfile;
  opportunity?: FundingOpportunity | null;
  applicationData?: {
    requestedAmount: string;
    purposeStatement: string;
    useOfFunds: string;
    timeline: string;
    opportunityAlignment: string;
  } | null;
  userEmail?: string;
  applicationId?: string;
}

export interface AIAnalysisJob {
  id: string;
  userId: string;
  jobId: string;
  analysisMode: 'profile' | 'opportunity';
  requestPayload: AIAnalysisJobRequest;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  emailSent: boolean;
  emailSentAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AIAnalysisQueueService {
  private supabase = inject(SharedSupabaseService);

  constructor() {
   
  }

  // =======================
  // QUEUE ANALYSIS JOB
  // =======================

  /**
   * Queue an AI analysis job for background processing
   */
  queueAnalysisJob(request: AIAnalysisJobRequest): Observable<{ jobId: string; status: string }> {
    return from(this.submitAnalysisJob(request));
  }

  private async submitAnalysisJob(request: AIAnalysisJobRequest): Promise<{ jobId: string; status: string }> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Authentication required for AI analysis');
      }

      // Prepare request payload for Edge Function
      const edgeFunctionPayload = {
        analysisMode: request.analysisMode,
        businessProfile: request.businessProfile,
        opportunity: request.opportunity,
        applicationData: request.applicationData,
        backgroundMode: true, // Important: tells Edge Function to queue job
        userEmail: request.userEmail || user.email,
        applicationId: request.applicationId
      };

      // Call the analyze-application Edge Function
      const { data, error } = await this.supabase.functions.invoke('analyze-application', {
        body: edgeFunctionPayload,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(`Failed to queue analysis: ${error.message}`);
      }

      if (!data?.jobId) {
        throw new Error('Invalid response from analysis service');
      }

      console.log('AI analysis job queued:', data.jobId);
      
      return {
        jobId: data.jobId,
        status: data.status || 'pending'
      };

    } catch (error) {
      console.error('Error queueing AI analysis job:', error);
      throw error;
    }
  }

  // =======================
  // JOB STATUS & RESULTS
  // =======================

  /**
   * Get user's AI analysis jobs history
   */
  getUserAnalysisJobs(limit: number = 10): Observable<AIAnalysisJob[]> {
    return from(this.fetchUserJobs(limit));
  }

  private async fetchUserJobs(limit: number): Promise<AIAnalysisJob[]> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const { data, error } = await this.supabase
        .from('ai_analysis_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching analysis jobs:', error);
        throw error;
      }

      return (data || []).map(job => ({
        id: job.id,
        userId: job.user_id,
        jobId: job.job_id,
        analysisMode: job.analysis_mode,
        requestPayload: job.request_payload,
        status: job.status,
        result: job.result_data,
        emailSent: job.email_sent || false,
        emailSentAt: job.email_sent_at ? new Date(job.email_sent_at) : undefined,
        error: job.error,
        createdAt: new Date(job.created_at),
        updatedAt: new Date(job.updated_at),
        completedAt: job.completed_at ? new Date(job.completed_at) : undefined
      }));

    } catch (error) {
      console.error('Error fetching user analysis jobs:', error);
      throw error;
    }
  }

  /**
   * Get specific job status by jobId
   */
  getJobStatus(jobId: string): Observable<AIAnalysisJob | null> {
    return from(this.fetchJobStatus(jobId));
  }

  private async fetchJobStatus(jobId: string): Promise<AIAnalysisJob | null> {
    try {
      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const { data, error } = await this.supabase
        .from('ai_analysis_jobs')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Job not found
        }
        throw error;
      }

      return {
        id: data.id,
        userId: data.user_id,
        jobId: data.job_id,
        analysisMode: data.analysis_mode,
        requestPayload: data.request_payload,
        status: data.status,
        result: data.result_data,
        emailSent: data.email_sent || false,
        emailSentAt: data.email_sent_at ? new Date(data.email_sent_at) : undefined,
        error: data.error,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined
      };

    } catch (error) {
      console.error('Error fetching job status:', error);
      throw error;
    }
  }

  // =======================
  // REAL-TIME SUBSCRIPTIONS
  // =======================

  /**
   * Subscribe to job updates for the current user
   */
  subscribeToJobUpdates(callback: (job: AIAnalysisJob) => void): () => void {
    let subscription: any;
    
    this.supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      subscription = this.supabase
        .channel('ai_analysis_jobs')
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'ai_analysis_jobs',
            filter: `user_id=eq.${user.id}` 
          }, 
          (payload) => {
            const job = this.transformDatabaseJob(payload.new);
            callback(job);
          }
        )
        .subscribe();
    });

    // Return unsubscribe function
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }

  private transformDatabaseJob(data: any): AIAnalysisJob {
    return {
      id: data.id,
      userId: data.user_id,
      jobId: data.job_id,
      analysisMode: data.analysis_mode,
      requestPayload: data.request_payload,
      status: data.status,
      result: data.result_data,
      emailSent: data.email_sent || false,
      emailSentAt: data.email_sent_at ? new Date(data.email_sent_at) : undefined,
      error: data.error,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined
    };
  }

  // =======================
  // UTILITY METHODS
  // =======================

  private async getAuthToken(): Promise<string> {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    
    if (error || !session) {
      throw new Error('No active session found');
    }
    
    return session.access_token;
  }

  /**
   * Clean up old completed jobs (optional utility)
   */
  cleanupOldJobs(olderThanDays: number = 30): Observable<{ deleted: number }> {
    return from(this.performCleanup(olderThanDays));
  }

  private async performCleanup(olderThanDays: number): Promise<{ deleted: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { data: { user }, error: authError } = await this.supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Authentication required');
      }

      const { data, error } = await this.supabase
        .from('ai_analysis_jobs')
        .delete()
        .eq('user_id', user.id)
        .in('status', ['completed', 'failed'])
        .lt('created_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        throw error;
      }

      return { deleted: data?.length || 0 };

    } catch (error) {
      console.error('Error cleaning up old jobs:', error);
      throw error;
    }
  }
}