// src/app/SMEs/services/application-management.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';

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
  aiAnalysisStatus?: string;
  aiMatchScore?: number;

  // Joined data from other tables (loaded separately now)
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
  recentActivity: number;
  averageProcessingTime: number;
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
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  // Loading states
  isLoading = signal<boolean>(false);
  isUpdating = signal<boolean>(false);
  error = signal<string | null>(null);

  // ===============================
  // FETCH APPLICATIONS - SIMPLIFIED
  // ===============================

  /**
   * Get all applications for a specific opportunity - FIXED VERSION
   */
  getApplicationsByOpportunity(opportunityId: string): Observable<FundingApplication[]> {
    this.isLoading.set(true);
    this.error.set(null);

    console.log('Fetching applications for opportunity:', opportunityId);

    return from(this.fetchApplicationsSimplified(opportunityId)).pipe(
      tap((apps) => {
        console.log('Applications loaded:', apps.length);
        this.isLoading.set(false);
      }),
      catchError(error => {
        console.error('Error loading applications:', error);
        this.error.set('Failed to load applications');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get all applications for opportunities in the funder's organization - FIXED VERSION
   */
  getApplicationsByOrganization(organizationId: string, filter?: ApplicationFilter): Observable<FundingApplication[]> {
    this.isLoading.set(true);
    this.error.set(null);

    console.log('Fetching applications for organization:', organizationId);

    return from(this.fetchApplicationsByOrganization(organizationId, filter)).pipe(
      tap((apps) => {
        console.log('Organization applications loaded:', apps.length);
        this.isLoading.set(false);
      }),
      catchError(error => {
        console.error('Error loading organization applications:', error);
        this.error.set('Failed to load organization applications');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get applications with full user details (separate call)
   */
  getApplicationsWithDetails(opportunityId: string): Observable<FundingApplication[]> {
    return from(this.fetchApplicationsWithDetails(opportunityId));
  }

  /**
   * Get single application by ID - simplified
   */
  getApplicationById(applicationId: string): Observable<FundingApplication> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchSingleApplication(applicationId)).pipe(
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
    return this.addReviewNote(applicationId, requestMessage, 'request_info').pipe(
      tap(() => {
        console.log('Additional information requested for application:', applicationId);
      })
    );
  }

  // ===============================
  // STATISTICS
  // ===============================

  /**
   * Get application statistics for an opportunity
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
  // PRIVATE METHODS - SIMPLIFIED
  // ===============================

  /**
   * Simplified fetch - just get applications without joins
   */
private async fetchApplicationsSimplified(opportunityId: string): Promise<FundingApplication[]> {
    try {
      console.log('🔍 [DEBUG] Starting fetchApplicationsSimplified');
      console.log('🎯 [DEBUG] Opportunity ID:', opportunityId);
      console.log('👤 [DEBUG] Current user:', this.authService.user());

      // Test 1: Raw Supabase query
      console.log('📊 [DEBUG] Executing Supabase query...');
      const { data, error } = await this.supabase
        .from('applications')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });

      console.log('📋 [DEBUG] Raw Supabase response:');
      console.log('  - Error:', error);
      console.log('  - Data length:', data?.length || 0);
      console.log('  - Data sample:', data?.[0]);

      if (error) {
        console.error('🚫 [DEBUG] Supabase error details:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data) {
        console.log('⚠️ [DEBUG] Data is null/undefined');
        return [];
      }

      if (data.length === 0) {
        console.log('📭 [DEBUG] Data array is empty');
        return [];
      }

      console.log('✅ [DEBUG] Raw applications found:', data.length);
      console.log('📄 [DEBUG] First application data:', JSON.stringify(data[0], null, 2));

      // Test 2: Transform data
      console.log('🔄 [DEBUG] Starting data transformation...');
      const transformedData = this.transformApplicationsData(data);
      console.log('✅ [DEBUG] Transformed applications:', transformedData.length);
      console.log('📄 [DEBUG] First transformed application:', JSON.stringify(transformedData[0], null, 2));

      return transformedData;
    } catch (error) {
      console.error('💥 [DEBUG] Error in fetchApplicationsSimplified:', error);
      console.error('💥 [DEBUG] Error stack:', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Get applications for organization - simplified version
   */
  private async fetchApplicationsByOrganization(
    organizationId: string, 
    filter?: ApplicationFilter
  ): Promise<FundingApplication[]> {
    try {
      console.log('Querying applications for organization:', organizationId);

      // First, get opportunities for this organization
      const { data: opportunities, error: oppError } = await this.supabase
        .from('funding_opportunities')
        .select('id')
        .eq('organization_id', organizationId);

      if (oppError) {
        throw new Error(`Failed to fetch opportunities: ${oppError.message}`);
      }

      if (!opportunities || opportunities.length === 0) {
        console.log('No opportunities found for organization:', organizationId);
        return [];
      }

      const opportunityIds = opportunities.map(opp => opp.id);
      console.log('Found opportunities:', opportunityIds.length);

      // Now get applications for these opportunities
      let query = this.supabase
        .from('applications')
        .select('*')
        .in('opportunity_id', opportunityIds)
        .not('status', 'eq', 'withdrawn'); // Exclude withdrawn applications

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
        console.error('Supabase error:', error);
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log('No applications found for organization opportunities');
        return [];
      }

      console.log('Raw applications found:', data.length);
      let applications = this.transformApplicationsData(data);

      // Apply search filter (client-side)
      if (filter?.searchQuery) {
        const searchLower = filter.searchQuery.toLowerCase();
        applications = applications.filter(app =>
          app.title.toLowerCase().includes(searchLower) ||
          app.description?.toLowerCase().includes(searchLower)
        );
      }

      return applications;
    } catch (error) {
      console.error('Error in fetchApplicationsByOrganization:', error);
      throw error;
    }
  }

  /**
   * Get applications with user details (separate queries)
   */
  private async fetchApplicationsWithDetails(opportunityId: string): Promise<FundingApplication[]> {
    try {
      // First get applications
      const applications = await this.fetchApplicationsSimplified(opportunityId);
      
      if (applications.length === 0) {
        return applications;
      }

      // Get unique applicant IDs
      const applicantIds = [...new Set(applications.map(app => app.applicantId))];
      
      // Fetch applicant details (this might fail due to RLS, but won't block main query)
      try {
        const { data: usersData } = await this.supabase
          .from('profiles')
          .select('*')
          .in('id', applicantIds);

        // Map user data to applications
        if (usersData) {
          applications.forEach(app => {
            const userData = usersData.find(u => u.id === app.applicantId);
            if (userData) {
              app.applicant = {
                id: userData.id,
                firstName: userData.first_name || '',
                lastName: userData.last_name || '',
                email: userData.email || '',
                companyName: userData.company_name,
                industry: userData.industry,
                registrationNumber: userData.registration_number
              };
            }
          });
        }
      } catch (userError) {
        console.warn('Could not load user details:', userError);
        // Continue without user data
      }

      return applications;
    } catch (error) {
      console.error('Error in fetchApplicationsWithDetails:', error);
      throw error;
    }
  }

  /**
   * Get single application
   */
  private async fetchSingleApplication(applicationId: string): Promise<FundingApplication> {
    try {
      const { data, error } = await this.supabase
        .from('applications')
        .select('*')
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
      console.error('Error fetching single application:', error);
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
      }
      // Note: Organization filtering removed for now - add back when RLS is sorted

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
    console.log('🔄 [DEBUG] transformApplicationsData called with:', rawData.length, 'items');
    
    try {
      const transformed = rawData.map((item, index) => {
        console.log(`🔄 [DEBUG] Transforming item ${index}:`, item.id);
        return this.transformApplicationData(item);
      });
      
      console.log('✅ [DEBUG] Successfully transformed', transformed.length, 'applications');
      return transformed;
    } catch (error) {
      console.error('💥 [DEBUG] Error in transformApplicationsData:', error);
      throw error;
    }
  }

  private transformApplicationData(rawData: any): FundingApplication {
    console.log('🔄 [DEBUG] Transforming single application:', rawData.id);
    
    try {
      const transformed = {
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
        aiAnalysisStatus: rawData.ai_analysis_status,
        aiMatchScore: rawData.ai_match_score,
        applicant: {
          id: rawData.applicant_id,
          firstName: 'Loading...',
          lastName: '',
          email: '',
        }
      };

      console.log('✅ [DEBUG] Successfully transformed application:', transformed.id);
      return transformed;
    } catch (error) {
      console.error('💥 [DEBUG] Error transforming single application:', error);
      throw error;
    }
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