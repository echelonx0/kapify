// src/app/funder/services/application-management.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Observable, from, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { environment } from '../../../environments/environment';

// Application interfaces
export interface FundingApplication {
  id: string;
  applicantId: string;
  opportunityId: string;
  title: string;
  description?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  stage: 'initial_review' | 'due_diligence' | 'investment_committee' | 'documentation' | 'completed';
  formData: Record<string, any>;
  documents: Record<string, any>;
  reviewNotes: ReviewNote[];
  terms?: Record<string, any>;
  submittedAt?: Date;
  reviewStartedAt?: Date;
  reviewedAt?: Date;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Joined data from other tables
  applicant?: ApplicantInfo;
  opportunity?: OpportunityInfo;
}

export interface ReviewNote {
  id: string;
  reviewerId: string;
  reviewerName: string;
  note: string;
  type: 'internal' | 'external' | 'request_info';
  createdAt: Date;
  isRead?: boolean;
}

export interface ApplicantInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  industry?: string;
  registrationNumber?: string;
}

export interface OpportunityInfo {
  id: string;
  title: string;
  fundingType: string;
  offerAmount: number;
  currency: string;
  organizationId: string;
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<string, number>;
  byStage: Record<string, number>;
  recentActivity: number; // applications updated in last 7 days
  averageProcessingTime: number; // days
}

export interface ApplicationFilter {
  status?: string[];
  stage?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationManagementService {
  private supabase: SupabaseClient;
  private authService = inject(AuthService);

  // Loading states
  isLoading = signal<boolean>(false);
  isUpdating = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  // ===============================
  // FETCH APPLICATIONS
  // ===============================

  /**
   * Get all applications for a specific opportunity
   */
  getApplicationsByOpportunity(opportunityId: string): Observable<FundingApplication[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchApplicationsFromSupabase(opportunityId)).pipe(
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        this.error.set('Failed to load applications');
        this.isLoading.set(false);
        console.error('Error loading applications:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all applications for opportunities in the funder's organization
   */
  getApplicationsByOrganization(organizationId: string, filter?: ApplicationFilter): Observable<FundingApplication[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchApplicationsByOrganization(organizationId, filter)).pipe(
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        this.error.set('Failed to load organization applications');
        this.isLoading.set(false);
        console.error('Error loading organization applications:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a single application with full details
   */
  getApplicationById(applicationId: string): Observable<FundingApplication> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchApplicationById(applicationId)).pipe(
      tap(() => this.isLoading.set(false)),
      catchError(error => {
        this.error.set('Failed to load application details');
        this.isLoading.set(false);
        console.error('Error loading application:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // UPDATE APPLICATION STATUS
  // ===============================

  /**
   * Update application status and stage
   */
  updateApplicationStatus(
    applicationId: string, 
    status: FundingApplication['status'], 
    stage?: FundingApplication['stage'],
    reviewNote?: string
  ): Observable<FundingApplication> {
    this.isUpdating.set(true);
    this.error.set(null);

    const currentUser = this.authService.user();
    if (!currentUser) {
      this.isUpdating.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.updateApplicationInSupabase(applicationId, status, stage, currentUser, reviewNote)).pipe(
      tap(() => this.isUpdating.set(false)),
      catchError(error => {
        this.error.set('Failed to update application status');
        this.isUpdating.set(false);
        console.error('Error updating application:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add review note to application
   */
  addReviewNote(
    applicationId: string, 
    note: string, 
    type: ReviewNote['type'] = 'internal'
  ): Observable<FundingApplication> {
    this.error.set(null);
    const currentUser = this.authService.user();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.addReviewNoteToSupabase(applicationId, note, type, currentUser)).pipe(
      catchError(error => {
        this.error.set('Failed to add review note');
        console.error('Error adding review note:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Request additional information from applicant
   */
  requestAdditionalInfo(applicationId: string, requestMessage: string): Observable<FundingApplication> {
    // This will add a review note of type 'request_info' and potentially send notification
    return this.addReviewNote(applicationId, requestMessage, 'request_info').pipe(
      tap(() => {
        // Here you could trigger email notification to applicant
        console.log('Additional information requested for application:', applicationId);
      })
    );
  }

  // ===============================
  // STATISTICS
  // ===============================

  /**
   * Get application statistics for an opportunity or organization
   */
  getApplicationStats(opportunityId?: string, organizationId?: string): Observable<ApplicationStats> {
    return from(this.fetchApplicationStats(opportunityId, organizationId)).pipe(
      catchError(error => {
        this.error.set('Failed to load application statistics');
        console.error('Error loading stats:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // PRIVATE SUPABASE METHODS
  // ===============================

  private async fetchApplicationsFromSupabase(opportunityId: string): Promise<FundingApplication[]> {
    try {
      const { data, error } = await this.supabase
        .from('applications')
        .select(`
          *,
          applicant:applicant_id (
            id,
            raw_user_meta_data
          ),
          opportunity:opportunity_id (
            id,
            title,
            funding_type,
            offer_amount,
            currency,
            organization_id
          )
        `)
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return this.transformApplicationsData(data || []);
    } catch (error) {
      console.error('Error fetching applications from Supabase:', error);
      throw error;
    }
  }

  private async fetchApplicationsByOrganization(
    organizationId: string, 
    filter?: ApplicationFilter
  ): Promise<FundingApplication[]> {
    try {
      let query = this.supabase
        .from('applications')
        .select(`
          *,
          applicant:applicant_id (
            id,
            raw_user_meta_data
          ),
          opportunity:opportunity_id!inner (
            id,
            title,
            funding_type,
            offer_amount,
            currency,
            organization_id
          )
        `)
        .eq('opportunity.organization_id', organizationId);

      // Apply filters
      if (filter?.status?.length) {
        query = query.in('status', filter.status);
      }

      if (filter?.stage?.length) {
        query = query.in('stage', filter.stage);
      }

      if (filter?.dateRange) {
        query = query
          .gte('created_at', filter.dateRange.start.toISOString())
          .lte('created_at', filter.dateRange.end.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      let applications = this.transformApplicationsData(data || []);

      // Apply search filter (client-side for now)
      if (filter?.searchQuery) {
        const searchLower = filter.searchQuery.toLowerCase();
        applications = applications.filter(app =>
          app.title.toLowerCase().includes(searchLower) ||
          app.applicant?.firstName?.toLowerCase().includes(searchLower) ||
          app.applicant?.lastName?.toLowerCase().includes(searchLower) ||
          app.applicant?.companyName?.toLowerCase().includes(searchLower)
        );
      }

      return applications;
    } catch (error) {
      console.error('Error fetching organization applications:', error);
      throw error;
    }
  }

  private async fetchApplicationById(applicationId: string): Promise<FundingApplication> {
    try {
      const { data, error } = await this.supabase
        .from('applications')
        .select(`
          *,
          applicant:applicant_id (
            id,
            raw_user_meta_data
          ),
          opportunity:opportunity_id (
            id,
            title,
            funding_type,
            offer_amount,
            currency,
            organization_id
          )
        `)
        .eq('id', applicationId)
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data) {
        throw new Error('Application not found');
      }

      return this.transformApplicationData(data);
    } catch (error) {
      console.error('Error fetching application by ID:', error);
      throw error;
    }
  }

  private async updateApplicationInSupabase(
    applicationId: string,
    status: FundingApplication['status'],
    stage?: FundingApplication['stage'],
    reviewer?: any,
    reviewNote?: string
  ): Promise<FundingApplication> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (stage) {
        updateData.stage = stage;
      }

      // Set timestamp fields based on status
      if (status === 'under_review' && !updateData.review_started_at) {
        updateData.review_started_at = new Date().toISOString();
      }
      
      if (status === 'approved' || status === 'rejected') {
        updateData.decided_at = new Date().toISOString();
        updateData.reviewed_at = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from('applications')
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update application: ${error.message}`);
      }

      // Add review note if provided
      if (reviewNote && reviewer) {
        await this.addReviewNoteToSupabase(applicationId, reviewNote, 'internal', reviewer);
      }

      return this.transformApplicationData(data);
    } catch (error) {
      console.error('Error updating application in Supabase:', error);
      throw error;
    }
  }

  private async addReviewNoteToSupabase(
    applicationId: string,
    note: string,
    type: ReviewNote['type'],
    reviewer: any
  ): Promise<FundingApplication> {
    try {
      // Get current application
      const { data: currentApp, error: fetchError } = await this.supabase
        .from('applications')
        .select('review_notes')
        .eq('id', applicationId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch application: ${fetchError.message}`);
      }

      // Create new review note
      const newNote: ReviewNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reviewerId: reviewer.id,
        reviewerName: `${reviewer.firstName} ${reviewer.lastName}`.trim() || reviewer.email,
        note,
        type,
        createdAt: new Date(),
        isRead: false
      };

      // Append to existing notes
      const existingNotes = currentApp.review_notes || [];
      const updatedNotes = [...existingNotes, newNote];

      // Update application
      const { data, error } = await this.supabase
        .from('applications')
        .update({
          review_notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add review note: ${error.message}`);
      }

      return this.transformApplicationData(data);
    } catch (error) {
      console.error('Error adding review note to Supabase:', error);
      throw error;
    }
  }

  private async fetchApplicationStats(
    opportunityId?: string,
    organizationId?: string
  ): Promise<ApplicationStats> {
    try {
      let query = this.supabase.from('applications').select('status, stage, created_at, updated_at');

      if (opportunityId) {
        query = query.eq('opportunity_id', opportunityId);
      } else if (organizationId) {
        // Join with opportunities table to filter by organization
        query = this.supabase
          .from('applications')
          .select('status, stage, created_at, updated_at, opportunity:opportunity_id!inner(organization_id)')
          .eq('opportunity.organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch stats: ${error.message}`);
      }

      return this.calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching application stats:', error);
      throw error;
    }
  }

  // ===============================
  // DATA TRANSFORMATION
  // ===============================

  private transformApplicationsData(rawData: any[]): FundingApplication[] {
    return rawData.map(item => this.transformApplicationData(item));
  }

  private transformApplicationData(rawData: any): FundingApplication {
    const applicantData = rawData.applicant?.raw_user_meta_data || {};
    
    return {
      id: rawData.id,
      applicantId: rawData.applicant_id,
      opportunityId: rawData.opportunity_id,
      title: rawData.title,
      description: rawData.description,
      status: rawData.status,
      stage: rawData.stage,
      formData: rawData.form_data || {},
      documents: rawData.documents || {},
      reviewNotes: rawData.review_notes || [],
      terms: rawData.terms || {},
      submittedAt: rawData.submitted_at ? new Date(rawData.submitted_at) : undefined,
      reviewStartedAt: rawData.review_started_at ? new Date(rawData.review_started_at) : undefined,
      reviewedAt: rawData.reviewed_at ? new Date(rawData.reviewed_at) : undefined,
      decidedAt: rawData.decided_at ? new Date(rawData.decided_at) : undefined,
      createdAt: new Date(rawData.created_at),
      updatedAt: new Date(rawData.updated_at),
      applicant: {
        id: rawData.applicant?.id,
        firstName: applicantData.firstName || '',
        lastName: applicantData.lastName || '',
        email: applicantData.email || rawData.applicant?.email || '',
        companyName: applicantData.companyName,
        industry: applicantData.industry,
        registrationNumber: applicantData.registrationNumber
      },
      opportunity: rawData.opportunity ? {
        id: rawData.opportunity.id,
        title: rawData.opportunity.title,
        fundingType: rawData.opportunity.funding_type,
        offerAmount: rawData.opportunity.offer_amount,
        currency: rawData.opportunity.currency,
        organizationId: rawData.opportunity.organization_id
      } : undefined
    };
  }

  private calculateStats(applications: any[]): ApplicationStats {
    const total = applications.length;
    const byStatus: Record<string, number> = {};
    const byStage: Record<string, number> = {};
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    let recentActivity = 0;
    
    let totalProcessingTime = 0;
    let completedApplications = 0;

    applications.forEach(app => {
      // Count by status
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;
      
      // Count by stage
      byStage[app.stage] = (byStage[app.stage] || 0) + 1;
      
      // Recent activity
      const updatedAt = new Date(app.updated_at);
      if (updatedAt >= sevenDaysAgo) {
        recentActivity++;
      }
      
      // Processing time for completed applications
      if ((app.status === 'approved' || app.status === 'rejected') && app.created_at && app.updated_at) {
        const created = new Date(app.created_at);
        const completed = new Date(app.updated_at);
        const processingDays = Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        totalProcessingTime += processingDays;
        completedApplications++;
      }
    });

    const averageProcessingTime = completedApplications > 0 ? 
      Math.round(totalProcessingTime / completedApplications) : 0;

    return {
      total,
      byStatus,
      byStage,
      recentActivity,
      averageProcessingTime
    };
  }
}