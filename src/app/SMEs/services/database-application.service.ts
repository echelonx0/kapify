// src/app/applications/services/database-application.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError  } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { Application, ApplicationStatus, ReviewNote } from '../../shared/models/application.models';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
 

// Database  
interface DatabaseApplication {
  id: string;
  applicant_id: string;
  title: string;
  description?: string;
  status: string;
  stage: string;
  form_data: any;
  documents: any;
  review_notes: any;
  terms?: any;
  submitted_at?: string;
  review_started_at?: string;
  reviewed_at?: string;
  decided_at?: string;
  created_at: string;
  updated_at: string;
  opportunity_id?: string;
}

// Service for managing applications in the database
@Injectable({
  providedIn: 'root'
})
export class DatabaseApplicationService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  // State management
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  // Reactive data streams
  private applicationsSubject = new BehaviorSubject<Application[]>([]);
  applications$ = this.applicationsSubject.asObservable();

  constructor() {
 
  }

  // ===============================
  // LOAD APPLICATIONS
  // ===============================

  /**
   * Get all applications for the current user
   */
  getApplications(): Observable<Application[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchUserApplications()).pipe(
      tap(applications => {
        this.applicationsSubject.next(applications);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to load applications');
        this.isLoading.set(false);
        console.error('Load applications error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get a specific application by ID
   */
  getApplicationById(id: string): Observable<Application | undefined> {
    return from(this.fetchApplicationById(id)).pipe(
      catchError(error => {
        this.error.set('Failed to load application details');
        console.error('Fetch application error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get applications for a specific opportunity
   */
  getApplicationsByOpportunity(opportunityId: string): Observable<Application[]> {
    return from(this.fetchApplicationsByOpportunity(opportunityId)).pipe(
      catchError(error => {
        this.error.set('Failed to load opportunity applications');
        console.error('Fetch opportunity applications error:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // DATABASE OPERATIONS
  // ===============================

  private async fetchUserApplications(): Promise<Application[]> {
    try {
      const currentUser = this.authService.user();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('applications')
        .select(`
          *,
          funding_opportunities (
            id,
            title,
            funding_type,
            min_investment,
            max_investment,
            currency,
            organization_id
          )
        `)
        .eq('applicant_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch applications: ${error.message}`);
      }

      console.log(`Fetched ${data?.length || 0} applications for user`);
      return data?.map(item => this.transformDatabaseToLocal(item)) || [];
    } catch (error) {
      console.error('Error fetching user applications:', error);
      throw error;
    }
  }

  private async fetchApplicationById(id: string): Promise<Application | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('applications')
        .select(`
          *,
          funding_opportunities (
            id,
            title,
            funding_type,
            min_investment,
            max_investment,
            currency,
            organization_id
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return undefined;
        }
        throw new Error(`Failed to fetch application: ${error.message}`);
      }

      return this.transformDatabaseToLocal(data);
    } catch (error) {
      console.error('Error fetching application by ID:', error);
      throw error;
    }
  }

  private async fetchApplicationsByOpportunity(opportunityId: string): Promise<Application[]> {
    try {
      const { data, error } = await this.supabase
        .from('applications')
        .select(`
          *,
          funding_opportunities (
            id,
            title,
            funding_type,
            min_investment,
            max_investment,
            currency,
            organization_id
          )
        `)
        .eq('opportunity_id', opportunityId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch opportunity applications: ${error.message}`);
      }

      return data?.map(item => this.transformDatabaseToLocal(item)) || [];
    } catch (error) {
      console.error('Error fetching applications by opportunity:', error);
      throw error;
    }
  }

  // ===============================
  // CREATE & UPDATE OPERATIONS
  // ===============================

  /**
   * Create a new application
   */
  createApplication(applicationData: {
    title: string;
    description?: string;
    opportunityId?: string;
    formData?: any;
    documents?: any;
  }): Observable<Application> {
    return from(this.insertApplication(applicationData)).pipe(
      tap(newApplication => {
        // Update local cache
        const currentApplications = this.applicationsSubject.value;
        this.applicationsSubject.next([newApplication, ...currentApplications]);
      }),
      catchError(error => {
        this.error.set('Failed to create application');
        console.error('Create application error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing application
   */
  updateApplication(id: string, updates: {
    title?: string;
    description?: string;
    status?: ApplicationStatus;
    stage?: string;
    formData?: any;
    documents?: any;
    terms?: any;
  }): Observable<Application> {
    return from(this.updateApplicationInDatabase(id, updates)).pipe(
      tap(updatedApplication => {
        // Update local cache
        const currentApplications = this.applicationsSubject.value;
        const index = currentApplications.findIndex(app => app.id === id);
        if (index !== -1) {
          const newApplications = [...currentApplications];
          newApplications[index] = updatedApplication;
          this.applicationsSubject.next(newApplications);
        }
      }),
      catchError(error => {
        this.error.set('Failed to update application');
        console.error('Update application error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Submit an application (change status to submitted)
   */
  submitApplication(id: string): Observable<Application> {
    const updates = {
      status: 'submitted' as ApplicationStatus,
      stage: 'initial_review',
      // Set submitted_at timestamp - this will be handled by the database update
    };

    return from(this.updateApplicationInDatabase(id, updates, true)).pipe(
      tap(updatedApplication => {
        // Update local cache
        const currentApplications = this.applicationsSubject.value;
        const index = currentApplications.findIndex(app => app.id === id);
        if (index !== -1) {
          const newApplications = [...currentApplications];
          newApplications[index] = updatedApplication;
          this.applicationsSubject.next(newApplications);
        }
      }),
      catchError(error => {
        this.error.set('Failed to submit application');
        console.error('Submit application error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Withdraw an application
   */
  withdrawApplication(id: string, reason: string): Observable<Application> {
    const updates = {
      status: 'withdrawn' as ApplicationStatus,
      // Add reason to form_data
      formData: { withdrawalReason: reason }
    };

    return this.updateApplication(id, updates);
  }

  private async insertApplication(applicationData: {
    title: string;
    description?: string;
    opportunityId?: string;
    formData?: any;
    documents?: any;
  }): Promise<Application> {
    try {
      const currentUser = this.authService.user();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const dbApplication: Partial<DatabaseApplication> = {
        applicant_id: currentUser.id,
        title: applicationData.title,
        description: applicationData.description || '',
        status: 'draft',
        stage: 'initial_review',
        form_data: applicationData.formData || {},
        documents: applicationData.documents || {},
        review_notes: {},
        opportunity_id: applicationData.opportunityId
      };

      const { data, error } = await this.supabase
        .from('applications')
        .insert(dbApplication)
        .select(`
          *,
          funding_opportunities (
            id,
            title,
            funding_type,
            min_investment,
            max_investment,
            currency,
            organization_id
          )
        `)
        .single();

      if (error) {
        throw new Error(`Failed to create application: ${error.message}`);
      }

      return this.transformDatabaseToLocal(data);
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  }

  private async updateApplicationInDatabase(
    id: string, 
    updates: any, 
    isSubmission: boolean = false
  ): Promise<Application> {
    try {
      // Prepare database updates
      const dbUpdates: Partial<DatabaseApplication> = {};
      
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.stage) dbUpdates.stage = updates.stage;
      if (updates.formData) dbUpdates.form_data = updates.formData;
      if (updates.documents) dbUpdates.documents = updates.documents;
      if (updates.terms) dbUpdates.terms = updates.terms;

      // Handle submission timestamp
      if (isSubmission && updates.status === 'submitted') {
        dbUpdates.submitted_at = new Date().toISOString();
      }

      // Always update the updated_at timestamp
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await this.supabase
        .from('applications')
        .update(dbUpdates)
        .eq('id', id)
        .select(`
          *,
          funding_opportunities (
            id,
            title,
            funding_type,
            min_investment,
            max_investment,
            currency,
            organization_id
          )
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update application: ${error.message}`);
      }

      return this.transformDatabaseToLocal(data);
    } catch (error) {
      console.error('Error updating application:', error);
      throw error;
    }
  }

  // ===============================
  // REVIEW NOTES
  // ===============================

  /**
   * Add a review note to an application
   */
  addReviewNote(applicationId: string, note: {
    content: string;
    category: string;
    isPrivate: boolean;
  }): Observable<ReviewNote> {
    return from(this.insertReviewNote(applicationId, note)).pipe(
      catchError(error => {
        this.error.set('Failed to add review note');
        console.error('Add review note error:', error);
        return throwError(() => error);
      })
    );
  }

  private async insertReviewNote(applicationId: string, note: {
    content: string;
    category: string;
    isPrivate: boolean;
  }): Promise<ReviewNote> {
    try {
      const currentUser = this.authService.user();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // First, get the current review notes
      const { data: app, error: fetchError } = await this.supabase
        .from('applications')
        .select('review_notes')
        .eq('id', applicationId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch application: ${fetchError.message}`);
      }

      // Create new review note
      const newNote: ReviewNote = {
        id: `note-${Date.now()}`,
        reviewerId: currentUser.id,
        reviewerName: `${currentUser.firstName} ${currentUser.lastName}`,
        category: note.category as any,
        content: note.content,
        sentiment: 'neutral',
        isPrivate: note.isPrivate,
        tags: [],
        createdAt: new Date()
      };

      // Update review notes in database
      const currentNotes = app.review_notes || {};
      const updatedNotes = {
        ...currentNotes,
        notes: [...(currentNotes.notes || []), newNote]
      };

      const { error: updateError } = await this.supabase
        .from('applications')
        .update({ review_notes: updatedNotes })
        .eq('id', applicationId);

      if (updateError) {
        throw new Error(`Failed to add review note: ${updateError.message}`);
      }

      return newNote;
    } catch (error) {
      console.error('Error adding review note:', error);
      throw error;
    }
  }

  // ===============================
  // STATISTICS
  // ===============================

  /**
   * Get application statistics for the current user
   */
  getApplicationsStats(): Observable<{
    total: number;
    draft: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
  }> {
    return from(this.fetchApplicationsStats()).pipe(
      catchError(error => {
        this.error.set('Failed to load application statistics');
        console.error('Fetch stats error:', error);
        return throwError(() => error);
      })
    );
  }

  private async fetchApplicationsStats(): Promise<{
    total: number;
    draft: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
  }> {
    try {
      const currentUser = this.authService.user();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.supabase
        .from('applications')
        .select('status')
        .eq('applicant_id', currentUser.id);

      if (error) {
        throw new Error(`Failed to fetch application stats: ${error.message}`);
      }

      const stats = {
        total: data?.length || 0,
        draft: 0,
        submitted: 0,
        underReview: 0,
        approved: 0,
        rejected: 0
      };

      data?.forEach(app => {
        switch (app.status) {
          case 'draft':
            stats.draft++;
            break;
          case 'submitted':
            stats.submitted++;
            break;
          case 'under_review':
            stats.underReview++;
            break;
          case 'approved':
            stats.approved++;
            break;
          case 'rejected':
            stats.rejected++;
            break;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching application stats:', error);
      throw error;
    }
  }

  // ===============================
  // DATA TRANSFORMATION
  // ===============================

  /**
   * Transform database record to local Application model
   */
  private transformDatabaseToLocal(dbApp: any): Application {
    // Extract opportunity data if available
    const opportunity = dbApp.funding_opportunities;

    return {
      id: dbApp.id,
      smeId: dbApp.applicant_id,
      smeOrganizationId: '', // Will be populated from user profile
      funderId: '', // Will be populated from opportunity
      funderOrganizationId: opportunity?.organization_id || '',
      fundId: '',
      opportunityId: dbApp.opportunity_id,

      // Application basics
      applicationNumber: `APP-${dbApp.created_at.split('-')[0]}-${dbApp.id.split('-')[0]}`,
      title: dbApp.title,
      description: dbApp.description || '',

      // Investment request - extracted from form_data
      requestedAmount: dbApp.form_data?.requestedAmount || 0,
      currency: opportunity?.currency || 'ZAR',
      fundingType: opportunity?.funding_type || 'debt',

      // Use of funds - from form_data
      useOfFunds: dbApp.form_data?.useOfFunds ? [{
        category: 'other',
        description: dbApp.form_data.useOfFunds,
        amount: dbApp.form_data?.requestedAmount || 0,
        percentage: 100,
        timeline:  'Not Specified',
        priority: 'high',
        justification: dbApp.form_data?.purposeStatement || '',
        expectedImpact: 'Business growth and expansion'
      }] : [],
      purposeStatement: dbApp.form_data?.purposeStatement || '',

      // Required assessments (placeholders for now)
      smeProfileId: '', // Will be linked to user profile
      swotAnalysisId: '',

      // Application process
      status: dbApp.status as ApplicationStatus,
      currentStage: {
        id: `stage-${dbApp.stage}`,
        name: this.getStageDisplayName(dbApp.stage),
        description: this.getStageDescription(dbApp.stage),
        order: this.getStageOrder(dbApp.stage),
        isRequired: true,
        status: dbApp.status === 'draft' ? 'in_progress' : 'completed',
        assignedTo: dbApp.applicant_id,
        estimatedDuration: 7,
        actualStartDate: new Date(dbApp.created_at),
        requirements: this.getStageRequirements(dbApp.stage)
      },
      applicationSteps: [],

      // Review process
      reviewTeam: [],
      reviewNotes: this.parseReviewNotes(dbApp.review_notes),

      // Communication
      messagesThread: `thread-${dbApp.id}`,

      // Timeline tracking
      submittedAt: dbApp.submitted_at ? new Date(dbApp.submitted_at) : undefined,
      reviewStartedAt: dbApp.review_started_at ? new Date(dbApp.review_started_at) : undefined,
      decisionDate: dbApp.decided_at ? new Date(dbApp.decided_at) : undefined,

      // Compliance & audit (empty for now)
      complianceChecks: [],
      auditTrail: [],

      createdAt: new Date(dbApp.created_at),
      updatedAt: new Date(dbApp.updated_at)
    } as unknown as Application;
  }

  /**
   * Parse review notes from database format
   */
  private parseReviewNotes(reviewNotesData: any): ReviewNote[] {
    if (!reviewNotesData || !reviewNotesData.notes) {
      return [];
    }

    return reviewNotesData.notes.map((note: any) => ({
      id: note.id,
      reviewerId: note.reviewerId,
      reviewerName: note.reviewerName,
      category: note.category,
      content: note.content,
      sentiment: note.sentiment || 'neutral',
      isPrivate: note.isPrivate || false,
      tags: note.tags || [],
      createdAt: new Date(note.createdAt)
    }));
  }

  /**
   * Helper methods for stage information
   */
  private getStageDisplayName(stage: string): string {
    const stageNames: Record<string, string> = {
      'initial_review': 'Initial Review',
      'due_diligence': 'Due Diligence',
      'investment_committee': 'Investment Committee',
      'documentation': 'Documentation',
      'completed': 'Completed'
    };
    return stageNames[stage] || 'Unknown Stage';
  }

  private getStageDescription(stage: string): string {
    const descriptions: Record<string, string> = {
      'initial_review': 'Application being reviewed by the funding team',
      'due_diligence': 'Detailed assessment of business and financials',
      'investment_committee': 'Final decision by investment committee',
      'documentation': 'Finalizing legal documentation',
      'completed': 'Application process completed'
    };
    return descriptions[stage] || 'Stage in progress';
  }

  private getStageOrder(stage: string): number {
    const orders: Record<string, number> = {
      'initial_review': 1,
      'due_diligence': 2,
      'investment_committee': 3,
      'documentation': 4,
      'completed': 5
    };
    return orders[stage] || 1;
  }

  private getStageRequirements(stage: string): string[] {
    const requirements: Record<string, string[]> = {
      'initial_review': ['Complete application form', 'Upload required documents'],
      'due_diligence': ['Provide financial statements', 'Management interviews'],
      'investment_committee': ['Present to committee', 'Answer additional questions'],
      'documentation': ['Sign term sheet', 'Complete legal documentation'],
      'completed': ['Funding disbursed']
    };
    return requirements[stage] || [];
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  /**
   * Clear local cache
   */
  clearCache(): void {
    this.applicationsSubject.next([]);
    this.error.set(null);
  }

  /**
   * Get current applications from cache
   */
  getCurrentApplications(): Application[] {
    return this.applicationsSubject.value;
  }
}