// src/app/applications/services/opportunity-application.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
 
import { AuthService } from '../../auth/production.auth.service';
 
 
import { FundingOpportunity } from '../../shared/models/funder.models';
import { SMEProfileStepsService } from './sme-profile-steps.service';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { ProfileData } from '../models/profile.models';

// Application interfaces
export interface OpportunityApplication {
  id: string;
  applicantId: string;
  opportunityId: string;
  title: string;
  description?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  stage: 'initial_review' | 'due_diligence' | 'investment_committee' | 'documentation' | 'completed';
  
  // Application data
  profileData: Partial<ProfileData>;
  coverInformation: CoverInformation;
  
  // Metadata
  submittedAt?: Date;
  reviewStartedAt?: Date;
  reviewedAt?: Date;
  decidedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Related data
  opportunity?: FundingOpportunity;
  aiAssessment?: AIAssessment;
  reviewNotes: ReviewNote[];
}

export interface CoverInformation {
  requestedAmount: number;
  purposeStatement: string;
  useOfFunds: string;
  timeline?: string;
  opportunityAlignment?: string;
}

export interface AIAssessment {
  overallScore: number; // 0-100
  matchScore: number;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  successProbability: 'high' | 'medium' | 'low';
  competitivePosition: 'strong' | 'moderate' | 'weak';
  assessedAt: Date;
}

export interface ReviewNote {
  id: string;
  reviewerId: string;
  reviewerName: string;
  note: string;
  type: 'internal' | 'external' | 'request_info';
  createdAt: Date;
  isRead: boolean;
}

export interface ApplicationDraft {
  opportunityId: string;
  coverInformation: Partial<CoverInformation>;
  lastSaved: Date;
}

@Injectable({
  providedIn: 'root'
})
export class OpportunityApplicationService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  private profileService = inject(SMEProfileStepsService);

  // State management
  isLoading = signal(false);
  isSaving = signal(false);
  isSubmitting = signal(false);
  error = signal<string | null>(null);
  
  // Data streams
  private applicationsSubject = new BehaviorSubject<OpportunityApplication[]>([]);
  applications$ = this.applicationsSubject.asObservable();
  
  // Draft management
  private draftsSubject = new BehaviorSubject<ApplicationDraft[]>([]);
  drafts$ = this.draftsSubject.asObservable();

  constructor() {
   
    this.loadUserApplications();
    this.loadDrafts();
  }

  // ===============================
  // LOAD USER APPLICATIONS
  // ===============================

  loadUserApplications(): Observable<OpportunityApplication[]> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchUserApplications(currentUser.id)).pipe(
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

  private async fetchUserApplications(userId: string): Promise<OpportunityApplication[]> {
    console.log('Fetching applications for user:', userId);
    try {
      const { data, error } = await this.supabase
        .from('applications')
        .select(`
          *,
          opportunity:opportunity_id (
            id,
            title,
            funding_type,
            min_investment,
            max_investment,
            currency,
            organization_id,
            decision_timeframe
          )
        `)
        .eq('applicant_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch applications: ${error.message}`);
      }
console.log('Fetched applications data:', data);
      return (data || []).map((item: any) => this.transformDatabaseToLocal(item));
    } catch (error) {
      console.error('Error fetching user applications:', error);
      throw error;
    }
  }

  // ===============================
  // CREATE NEW APPLICATION
  // ===============================

  createApplication(
    opportunityId: string, 
    coverInformation: CoverInformation
  ): Observable<OpportunityApplication> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    // Get user's profile data
    const profileData = this.profileService.data();

    return from(this.submitApplicationToDatabase(
      currentUser.id,
      opportunityId,
      profileData,
      coverInformation
    )).pipe(
      tap(application => {
        // Update local state
        const currentApps = this.applicationsSubject.value;
        this.applicationsSubject.next([application, ...currentApps]);
        
        // Clear any draft for this opportunity
        this.clearDraft(opportunityId);
        
        this.isSubmitting.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to submit application');
        this.isSubmitting.set(false);
        console.error('Submit application error:', error);
        return throwError(() => error);
      })
    );
  }

  private async submitApplicationToDatabase(
    userId: string,
    opportunityId: string,
    profileData: Partial<ProfileData>,
    coverInformation: CoverInformation
  ): Promise<OpportunityApplication> {
    try {
      const applicationData = {
        applicant_id: userId,
        opportunity_id: opportunityId,
        title: `Application for Funding`, // Will be updated with opportunity name
        description: coverInformation.purposeStatement,
        status: 'submitted',
        stage: 'initial_review',
        form_data: {
          profileData,
          coverInformation,
          submissionVersion: '1.0'
        },
        documents: profileData.documents || {},
        review_notes: [],
        terms: {},
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('applications')
        .insert(applicationData)
        .select(`
          *,
          opportunity:opportunity_id (
            id,
            title,
            funding_type,
            min_investment,
            max_investment,
            currency,
            organization_id,
            decision_timeframe
          )
        `)
        .single();

      if (error) {
        throw new Error(`Failed to submit application: ${error.message}`);
      }

      // Update opportunity application count
      await this.incrementOpportunityApplicationCount(opportunityId);

      return this.transformDatabaseToLocal(data);
    } catch (error) {
      console.error('Error submitting application to database:', error);
      throw error;
    }
  }

  private async incrementOpportunityApplicationCount(opportunityId: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('increment_opportunity_applications', {
        opportunity_id: opportunityId
      });

      if (error) {
        console.warn('Failed to update opportunity application count:', error);
      }
    } catch (error) {
      console.warn('Error incrementing application count:', error);
    }
  }

  // ===============================
  // DRAFT MANAGEMENT
  // ===============================

  saveDraft(opportunityId: string, coverInformation: Partial<CoverInformation>): Observable<void> {
    this.isSaving.set(true);
    
    return from(this.saveDraftToStorage(opportunityId, coverInformation)).pipe(
      tap(() => {
        this.isSaving.set(false);
        // Update drafts list
        const currentDrafts = this.draftsSubject.value;
        const existingIndex = currentDrafts.findIndex(d => d.opportunityId === opportunityId);
        
        const draft: ApplicationDraft = {
          opportunityId,
          coverInformation,
          lastSaved: new Date()
        };

        if (existingIndex >= 0) {
          currentDrafts[existingIndex] = draft;
        } else {
          currentDrafts.push(draft);
        }
        
        this.draftsSubject.next([...currentDrafts]);
      }),
      catchError(error => {
        this.error.set('Failed to save draft');
        this.isSaving.set(false);
        console.error('Save draft error:', error);
        return throwError(() => error);
      })
    );
  }

  private async saveDraftToStorage(
    opportunityId: string, 
    coverInformation: Partial<CoverInformation>
  ): Promise<void> {
    try {
      const draftData = {
        opportunityId,
        coverInformation,
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem(
        `application-draft-${opportunityId}`, 
        JSON.stringify(draftData)
      );
    } catch (error) {
      console.error('Error saving draft to storage:', error);
      throw error;
    }
  }

  loadDraft(opportunityId: string): ApplicationDraft | null {
    try {
      const draftStr = localStorage.getItem(`application-draft-${opportunityId}`);
      if (draftStr) {
        const draft = JSON.parse(draftStr);
        return {
          ...draft,
          lastSaved: new Date(draft.lastSaved)
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading draft:', error);
      return null;
    }
  }

  clearDraft(opportunityId: string): void {
    try {
      localStorage.removeItem(`application-draft-${opportunityId}`);
      
      // Update drafts list
      const currentDrafts = this.draftsSubject.value;
      const filteredDrafts = currentDrafts.filter(d => d.opportunityId !== opportunityId);
      this.draftsSubject.next(filteredDrafts);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  }

  private loadDrafts(): void {
    try {
      const drafts: ApplicationDraft[] = [];
      
      // Scan localStorage for draft keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('application-draft-')) {
          const draftStr = localStorage.getItem(key);
          if (draftStr) {
            try {
              const draft = JSON.parse(draftStr);
              drafts.push({
                ...draft,
                lastSaved: new Date(draft.lastSaved)
              });
            } catch (e) {
              console.warn('Invalid draft data for key:', key);
            }
          }
        }
      }
      
      this.draftsSubject.next(drafts);
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  }

  // ===============================
  // APPLICATION MANAGEMENT
  // ===============================

  getApplicationById(id: string): Observable<OpportunityApplication | null> {
    return from(this.fetchApplicationById(id)).pipe(
      catchError(error => {
        this.error.set('Failed to load application');
        console.error('Fetch application error:', error);
        return throwError(() => error);
      })
    );
  }

  private async fetchApplicationById(id: string): Promise<OpportunityApplication | null> {
    try {
      const { data, error } = await this.supabase
        .from('applications')
        .select(`
          *,
          opportunity:opportunity_id (
            id,
            title,
            funding_type,
            min_investment,
            max_investment,
            currency,
            organization_id,
            decision_timeframe
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null;
        }
        throw new Error(`Failed to fetch application: ${error.message}`);
      }

      return this.transformDatabaseToLocal(data);
    } catch (error) {
      console.error('Error fetching application by ID:', error);
      throw error;
    }
  }

  withdrawApplication(id: string, reason: string): Observable<OpportunityApplication> {
    this.error.set(null);

    return from(this.updateApplicationStatus(id, 'withdrawn', reason)).pipe(
      tap(updatedApp => {
        // Update local state
        const currentApps = this.applicationsSubject.value;
        const index = currentApps.findIndex(app => app.id === id);
        if (index >= 0) {
          currentApps[index] = updatedApp;
          this.applicationsSubject.next([...currentApps]);
        }
      }),
      catchError(error => {
        this.error.set('Failed to withdraw application');
        console.error('Withdraw application error:', error);
        return throwError(() => error);
      })
    );
  }

  private async updateApplicationStatus(
    id: string, 
    status: OpportunityApplication['status'], 
    reason?: string
  ): Promise<OpportunityApplication> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (reason) {
        // Add reason to review notes
        const currentApp = await this.fetchApplicationById(id);
        if (currentApp) {
          const newNote = {
            id: `note_${Date.now()}`,
            reviewerId: this.authService.user()?.id || 'system',
            reviewerName: 'Applicant',
            note: reason,
            type: 'external',
            createdAt: new Date(),
            isRead: false
          };

          updateData.review_notes = [...(currentApp.reviewNotes || []), newNote];
        }
      }

      const { data, error } = await this.supabase
        .from('applications')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          opportunity:opportunity_id (
            id,
            title,
            funding_type,
            min_investment,
            max_investment,
            currency,
            organization_id,
            decision_timeframe
          )
        `)
        .single();

      if (error) {
        throw new Error(`Failed to update application: ${error.message}`);
      }

      return this.transformDatabaseToLocal(data);
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  }

  // ===============================
  // STATISTICS
  // ===============================

  getApplicationsStats(): Observable<{
    total: number;
    draft: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
  }> {
    const applications = this.applicationsSubject.value;
    
    const stats = {
      total: applications.length,
      draft: 0,
      submitted: 0,
      underReview: 0,
      approved: 0,
      rejected: 0
    };

    applications.forEach(app => {
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

    return from([stats]);
  }

  // ===============================
  // DATA TRANSFORMATION
  // ===============================

  private transformDatabaseToLocal(dbData: any): OpportunityApplication {
    const formData = dbData.form_data || {};
    
    return {
      id: dbData.id,
      applicantId: dbData.applicant_id,
      opportunityId: dbData.opportunity_id,
      title: dbData.title,
      description: dbData.description,
      status: dbData.status,
      stage: dbData.stage,
      profileData: formData.profileData || {},
      coverInformation: formData.coverInformation || {
        requestedAmount: 0,
        purposeStatement: '',
        useOfFunds: '',
        timeline: '',
        opportunityAlignment: ''
      },
      submittedAt: dbData.submitted_at ? new Date(dbData.submitted_at) : undefined,
      reviewStartedAt: dbData.review_started_at ? new Date(dbData.review_started_at) : undefined,
      reviewedAt: dbData.reviewed_at ? new Date(dbData.reviewed_at) : undefined,
      decidedAt: dbData.decided_at ? new Date(dbData.decided_at) : undefined,
      createdAt: new Date(dbData.created_at),
      updatedAt: new Date(dbData.updated_at),
      opportunity: dbData.opportunity,
      reviewNotes: dbData.review_notes || [],
      aiAssessment: formData.aiAssessment
    };
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  getCurrentApplications(): OpportunityApplication[] {
    return this.applicationsSubject.value;
  }

  getCurrentDrafts(): ApplicationDraft[] {
    return this.draftsSubject.value;
  }

  clearError(): void {
    this.error.set(null);
  }

  // Check if user has already applied to an opportunity
  hasAppliedToOpportunity(opportunityId: string): boolean {
    return this.applicationsSubject.value.some(
      app => app.opportunityId === opportunityId && app.status !== 'withdrawn'
    );
  }

  // Get application for specific opportunity
  getApplicationForOpportunity(opportunityId: string): OpportunityApplication | null {
    return this.applicationsSubject.value.find(
      app => app.opportunityId === opportunityId && app.status !== 'withdrawn'
    ) || null;
  }
}