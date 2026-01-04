import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected';
export type ExpertiseArea =
  | 'finance'
  | 'marketing'
  | 'operations'
  | 'technology'
  | 'strategy'
  | 'sales'
  | 'hr'
  | 'legal'
  | 'product'
  | 'other';
export type EngagementType =
  | 'mentorship'
  | 'advisory'
  | 'consulting'
  | 'board_member'
  | 'part_time'
  | 'flexible';

export interface ExecutiveApplication {
  id: string;
  userId: string;
  status: ApplicationStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reviewerNotes?: string;

  // Personal Information
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;

  // Professional Background
  roleTitle: string;
  companyName: string;
  yearsExperience: number;
  industry?: string;
  professionalSummary: string;

  // Expertise & Availability
  expertiseAreas: ExpertiseArea[];
  otherExpertise?: string;
  availabilityHoursPerWeek?: number;
  preferredEngagementType: EngagementType[];

  // Motivation & Goals
  motivation: string;
  valueProposition?: string;

  // Optional References
  referenceName1?: string;
  referenceEmail1?: string;
  referenceName2?: string;
  referenceEmail2?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface ExecutiveApplicationFormData {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  roleTitle: string;
  companyName: string;
  yearsExperience: number;
  industry?: string;
  professionalSummary: string;
  expertiseAreas: ExpertiseArea[];
  otherExpertise?: string;
  availabilityHoursPerWeek?: number;
  preferredEngagementType: EngagementType[];
  motivation: string;
  valueProposition?: string;
  referenceName1?: string;
  referenceEmail1?: string;
  referenceName2?: string;
  referenceEmail2?: string;
}

interface DatabaseApplication {
  id: string;
  user_id: string;
  status: ApplicationStatus;
  submitted_at?: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  role_title: string;
  company_name: string;
  years_experience: number;
  industry?: string;
  professional_summary: string;
  expertise_areas: ExpertiseArea[];
  other_expertise?: string;
  availability_hours_per_week?: number;
  preferred_engagement_type: EngagementType[];
  motivation: string;
  value_proposition?: string;
  reference_name_1?: string;
  reference_email_1?: string;
  reference_name_2?: string;
  reference_email_2?: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class ExecutiveApplicationService {
  private supabase = inject(SharedSupabaseService);

  // State management
  private applicationSubject = new BehaviorSubject<ExecutiveApplication | null>(
    null
  );
  public application$ = this.applicationSubject.asObservable();

  isSaving = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);

  /**
   * Get current user's application
   */
  getCurrentApplication(): Observable<ExecutiveApplication | null> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    this.isLoading.set(true);
    this.error.set(null);

    return from(this.fetchApplication(userId)).pipe(
      tap((application) => {
        this.applicationSubject.next(application);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        const message = error?.message || 'Failed to load application';
        this.error.set(message);
        this.isLoading.set(false);
        console.error('Error loading application:', error);
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Create or update application as draft
   */
  saveAsDraft(
    formData: ExecutiveApplicationFormData
  ): Observable<ExecutiveApplication> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    this.isSaving.set(true);
    this.error.set(null);

    return from(this.upsertApplication(userId, formData, 'draft')).pipe(
      tap((application) => {
        this.applicationSubject.next(application);
        this.isSaving.set(false);
        console.log('✅ Application saved as draft');
      }),
      catchError((error) => {
        const message = error?.message || 'Failed to save draft';
        this.error.set(message);
        this.isSaving.set(false);
        console.error('❌ Error saving draft:', error);
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Submit application for review
   */
  submitApplication(
    formData: ExecutiveApplicationFormData
  ): Observable<ExecutiveApplication> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    this.isSaving.set(true);
    this.error.set(null);

    return from(this.upsertApplication(userId, formData, 'submitted')).pipe(
      tap((application) => {
        this.applicationSubject.next(application);
        this.isSaving.set(false);
        console.log('✅ Application submitted successfully');
      }),
      catchError((error) => {
        const message = error?.message || 'Failed to submit application';
        this.error.set(message);
        this.isSaving.set(false);
        console.error('❌ Error submitting application:', error);
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Delete draft application
   */
  deleteDraft(): Observable<void> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    this.isSaving.set(true);
    this.error.set(null);

    return from(this.deleteApplication(userId)).pipe(
      tap(() => {
        this.applicationSubject.next(null);
        this.isSaving.set(false);
        console.log('✅ Draft deleted successfully');
      }),
      catchError((error) => {
        const message = error?.message || 'Failed to delete draft';
        this.error.set(message);
        this.isSaving.set(false);
        console.error('❌ Error deleting draft:', error);
        return throwError(() => new Error(message));
      })
    );
  }

  /**
   * Check if user has an existing application
   */
  hasApplication(): Observable<boolean> {
    return this.application$.pipe(map((app) => app !== null));
  }

  /**
   * Get application status
   */
  getApplicationStatus(): Observable<ApplicationStatus | null> {
    return this.application$.pipe(map((app) => app?.status || null));
  }

  // ===================================
  // PRIVATE METHODS
  // ===================================

  private async fetchApplication(
    userId: string
  ): Promise<ExecutiveApplication | null> {
    const { data, error } = await this.supabase
      .from('executive_applications')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no application exists, return null (not an error)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch application: ${error.message}`);
    }

    return this.transformDatabaseToLocal(data);
  }

  private async upsertApplication(
    userId: string,
    formData: ExecutiveApplicationFormData,
    status: ApplicationStatus
  ): Promise<ExecutiveApplication> {
    const databaseData = this.transformLocalToDatabase(
      userId,
      formData,
      status
    );

    const { data, error } = await this.supabase
      .from('executive_applications')
      .upsert(databaseData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save application: ${error.message}`);
    }

    return this.transformDatabaseToLocal(data);
  }

  private async deleteApplication(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('executive_applications')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'draft');

    if (error) {
      throw new Error(`Failed to delete application: ${error.message}`);
    }
  }

  // ===================================
  // TRANSFORMATION METHODS
  // ===================================

  private transformDatabaseToLocal(
    data: DatabaseApplication
  ): ExecutiveApplication {
    return {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      submittedAt: data.submitted_at,
      reviewedAt: data.reviewed_at,
      reviewerNotes: data.reviewer_notes,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      location: data.location,
      linkedinUrl: data.linkedin_url,
      roleTitle: data.role_title,
      companyName: data.company_name,
      yearsExperience: data.years_experience,
      industry: data.industry,
      professionalSummary: data.professional_summary,
      expertiseAreas: data.expertise_areas,
      otherExpertise: data.other_expertise,
      availabilityHoursPerWeek: data.availability_hours_per_week,
      preferredEngagementType: data.preferred_engagement_type,
      motivation: data.motivation,
      valueProposition: data.value_proposition,
      referenceName1: data.reference_name_1,
      referenceEmail1: data.reference_email_1,
      referenceName2: data.reference_name_2,
      referenceEmail2: data.reference_email_2,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private transformLocalToDatabase(
    userId: string,
    formData: ExecutiveApplicationFormData,
    status: ApplicationStatus
  ): Partial<DatabaseApplication> {
    return {
      user_id: userId,
      status,
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,
      linkedin_url: formData.linkedinUrl,
      role_title: formData.roleTitle,
      company_name: formData.companyName,
      years_experience: formData.yearsExperience,
      industry: formData.industry,
      professional_summary: formData.professionalSummary,
      expertise_areas: formData.expertiseAreas,
      other_expertise: formData.otherExpertise,
      availability_hours_per_week: formData.availabilityHoursPerWeek,
      preferred_engagement_type: formData.preferredEngagementType,
      motivation: formData.motivation,
      value_proposition: formData.valueProposition,
      reference_name_1: formData.referenceName1,
      reference_email_1: formData.referenceEmail1,
      reference_name_2: formData.referenceName2,
      reference_email_2: formData.referenceEmail2,
    };
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Reset service state
   */
  reset(): void {
    this.applicationSubject.next(null);
    this.isSaving.set(false);
    this.isLoading.set(false);
    this.error.set(null);
  }
}
