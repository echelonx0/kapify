// src/app/profile/services/funding-application-backend.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { FundingApplicationProfile } from '../models/funding-application.models';
import { environment } from '../../../environments/environment';

// Backend response interfaces
export interface FundingApplicationSectionData {
  sectionType: string;
  data: Record<string, any>;
  completed: boolean;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackendFundingApplicationResponse {
  sections: FundingApplicationSectionData[];
  overallCompletion: number;
  lastUpdated: string;
}

export interface SaveSectionResponse {
  section: FundingApplicationSectionData;
  overallCompletion: number;
  message: string;
  success: boolean;
}

export interface SaveCompleteApplicationResponse {
  success: boolean;
  applicationId: string;
  overallCompletion: number;
  savedSections: string[];
  message: string;
  lastSaved: string;
}

export interface SubmitApplicationResponse {
  success: boolean;
  applicationId: string;
  submissionDate: string;
  status: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class FundingApplicationBackendService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  // Environment-based API configuration
  private readonly API_BASE = environment.production 
    ? environment.supabaseUrl // Supabase endpoint for production
    : 'http://localhost:3000/api'; // Local backend for development
  
  // Loading and error states
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  error = signal<string | null>(null);
  lastSavedAt = signal<Date | null>(null);

  constructor() {}

  // ===============================
  // LOAD SAVED APPLICATION
  // ===============================

  loadSavedProfile(): Observable<FundingApplicationProfile> {
    this.isLoading.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    const endpoint = environment.production 
      ? `${this.API_BASE}/rest/v1/business_plan_sections?user_id=eq.${currentAuth.id}`
      : `${this.API_BASE}/users/${currentAuth.id}/funding-application`;

    return this.http.get<BackendFundingApplicationResponse>(endpoint, {
      headers: environment.production ? this.getSupabaseHeaders() : {}
    }).pipe(
      tap(() => this.isLoading.set(false)),
      map(response => this.transformBackendToLocal(response)),
      catchError(error => {
        this.error.set('Failed to load saved application data');
        this.isLoading.set(false);
        console.error('Load application error:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // SAVE COMPLETE APPLICATION
  // ===============================

  saveCompleteProfile(applicationData: FundingApplicationProfile): Observable<SaveCompleteApplicationResponse> {
    this.isSaving.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isSaving.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    // Transform local data structure to backend format
    const backendPayload = this.transformLocalToBackend(applicationData);
    
    return this.saveAllSections(currentAuth.id, backendPayload).pipe(
      tap(response => {
        this.isSaving.set(false);
        this.lastSavedAt.set(new Date());
        console.log('Complete application saved successfully:', response);
      }),
      catchError(error => {
        this.error.set('Failed to save complete application');
        this.isSaving.set(false);
        console.error('Save complete application error:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // SAVE DRAFT SECTION
  // ===============================

  saveDraftSection(sectionType: string, sectionData: Record<string, any>, completed: boolean = false): Observable<SaveSectionResponse> {
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    const completionPercentage = this.calculateSectionCompletion(sectionData, completed);
    
    const payload = {
      user_id: currentAuth.id,
      section_type: sectionType,
      data: sectionData,
      completed,
      completion_percentage: completionPercentage,
      updated_at: new Date().toISOString()
    };

    const endpoint = environment.production
      ? `${this.API_BASE}/rest/v1/business_plan_sections`
      : `${this.API_BASE}/users/${currentAuth.id}/funding-application/${sectionType}`;

    const request = environment.production
      ? this.http.post<SaveSectionResponse>(endpoint, payload, { headers: this.getSupabaseHeaders() })
      : this.http.patch<SaveSectionResponse>(endpoint, payload);

    return request.pipe(
      tap(response => {
        console.log(`Section ${sectionType} saved as draft:`, response);
      }),
      catchError(error => {
        this.error.set(`Failed to save ${sectionType} section`);
        console.error(`Save ${sectionType} section error:`, error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // AUTO-SAVE FUNCTIONALITY
  // ===============================

  autoSaveProfile(applicationData: FundingApplicationProfile): Observable<SaveCompleteApplicationResponse> {
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    const backendPayload = this.transformLocalToBackend(applicationData);
    
    return this.saveAllSections(currentAuth.id, backendPayload, true).pipe(
      tap(response => {
        this.lastSavedAt.set(new Date());
        console.log('Auto-save completed:', response);
      }),
      catchError(error => {
        console.error('Auto-save failed:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // SUBMIT FOR REVIEW
  // ===============================

  submitProfileForReview(applicationData: FundingApplicationProfile): Observable<SubmitApplicationResponse> {
    this.isSaving.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isSaving.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    // First save complete application
    return this.saveCompleteProfile(applicationData).pipe(
      // Then submit for review
      map(saveResponse => {
        const submissionResponse: SubmitApplicationResponse = {
          success: true,
          applicationId: saveResponse.applicationId,
          submissionDate: new Date().toISOString(),
          status: 'submitted',
          message: 'Application submitted successfully for review'
        };

        // In production, this would trigger the review process
        if (environment.production) {
          // Create application record in Supabase
          this.createApplicationRecord(currentAuth.id, saveResponse.applicationId);
        }

        return submissionResponse;
      }),
      tap(response => {
        this.isSaving.set(false);
        console.log('Application submitted for review:', response);
      }),
      catchError(error => {
        this.error.set('Failed to submit application for review');
        this.isSaving.set(false);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // DELETE DRAFT DATA
  // ===============================

  clearSavedProfile(): Observable<{success: boolean}> {
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    const endpoint = environment.production
      ? `${this.API_BASE}/rest/v1/business_plan_sections?user_id=eq.${currentAuth.id}`
      : `${this.API_BASE}/users/${currentAuth.id}/funding-application`;

    const headers = environment.production ? this.getSupabaseHeaders() : {};

    return this.http.delete<{success: boolean}>(endpoint, { headers }).pipe(
      tap(() => {
        this.lastSavedAt.set(null);
        console.log('Saved application data cleared');
      }),
      catchError(error => {
        this.error.set('Failed to clear saved application');
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // PRIVATE HELPER METHODS
  // ===============================

  private saveAllSections(
    userId: string, 
    sections: Array<{sectionType: string, data: Record<string, any>, completed: boolean}>, 
    isAutoSave: boolean = false
  ): Observable<SaveCompleteApplicationResponse> {
    
    if (environment.production) {
      return this.saveAllSectionsSupabase(userId, sections, isAutoSave);
    } else {
      return this.saveAllSectionsLocal(userId, sections, isAutoSave);
    }
  }

  private saveAllSectionsLocal(
    userId: string,
    sections: Array<{sectionType: string, data: Record<string, any>, completed: boolean}>,
    isAutoSave: boolean
  ): Observable<SaveCompleteApplicationResponse> {
    
    // Create array of save requests for local backend
    const saveRequests = sections.map(section => 
      this.http.patch<SaveSectionResponse>(
        `${this.API_BASE}/users/${userId}/funding-application/${section.sectionType}`,
        {
          data: section.data,
          completed: section.completed,
          completion_percentage: this.calculateSectionCompletion(section.data, section.completed)
        }
      )
    );

    // Execute all saves in parallel
    return new Observable<SaveCompleteApplicationResponse>(observer => {
      Promise.all(saveRequests.map(req => req.toPromise()))
        .then(responses => {
          const savedSections = responses.map(r => r!.section.sectionType);
          const overallCompletion = Math.max(...responses.map(r => r!.overallCompletion || 0));
          
          observer.next({
            success: true,
            applicationId: `funding_app_${userId}_${Date.now()}`,
            overallCompletion,
            savedSections,
            message: isAutoSave ? 'Application auto-saved successfully' : 'Application saved successfully',
            lastSaved: new Date().toISOString()
          });
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  private saveAllSectionsSupabase(
    userId: string,
    sections: Array<{sectionType: string, data: Record<string, any>, completed: boolean}>,
    isAutoSave: boolean
  ): Observable<SaveCompleteApplicationResponse> {
    
    // Prepare batch upsert for Supabase
    const supabasePayload = sections.map(section => ({
      user_id: userId,
      section_type: section.sectionType,
      data: section.data,
      completed: section.completed,
      completion_percentage: this.calculateSectionCompletion(section.data, section.completed),
      updated_at: new Date().toISOString()
    }));

    return this.http.post<any[]>(
      `${this.API_BASE}/rest/v1/business_plan_sections`,
      supabasePayload,
      { 
        headers: {
          ...this.getSupabaseHeaders(),
          'Prefer': 'resolution=merge-duplicates'
        }
      }
    ).pipe(
      map(response => {
        const overallCompletion = this.calculateOverallCompletion(sections);
        
        return {
          success: true,
          applicationId: `funding_app_${userId}_${Date.now()}`,
          overallCompletion,
          savedSections: sections.map(s => s.sectionType),
          message: isAutoSave ? 'Application auto-saved successfully' : 'Application saved successfully',
          lastSaved: new Date().toISOString()
        };
      })
    );
  }

  private getSupabaseHeaders(): Record<string, string> {
    return {
      'apikey': environment.supabaseAnonKey,
      'Authorization': `Bearer ${environment.supabaseAnonKey}`,
      'Content-Type': 'application/json'
    };
  }

  private createApplicationRecord(userId: string, applicationId: string): void {
    if (!environment.production) return;

    const applicationPayload = {
      id: applicationId,
      applicant_id: userId,
      title: 'SME Funding Application',
      description: 'Complete funding application profile',
      status: 'submitted',
      stage: 'initial_review',
      submitted_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    this.http.post(
      `${this.API_BASE}/rest/v1/applications`,
      applicationPayload,
      { headers: this.getSupabaseHeaders() }
    ).subscribe({
      next: () => console.log('Application record created'),
      error: (error) => console.error('Failed to create application record:', error)
    });
  }

  // ===============================
  // DATA TRANSFORMATION METHODS
  // ===============================

  private transformLocalToBackend(applicationData: FundingApplicationProfile): Array<{sectionType: string, data: Record<string, any>, completed: boolean}> {
    const sections: Array<{sectionType: string, data: Record<string, any>, completed: boolean}> = [];

    if (applicationData.companyInfo) {
      sections.push({
        sectionType: 'company-info',
        data: applicationData.companyInfo as Record<string, any>,
        completed: this.isCompanyInfoComplete(applicationData.companyInfo)
      });
    }

    if (applicationData.supportingDocuments) {
      sections.push({
        sectionType: 'documents',
        data: applicationData.supportingDocuments as Record<string, any>,
        completed: this.isDocumentsComplete(applicationData.supportingDocuments)
      });
    }

    if (applicationData.businessAssessment) {
      sections.push({
        sectionType: 'business-assessment',
        data: applicationData.businessAssessment as Record<string, any>,
        completed: this.isBusinessAssessmentComplete(applicationData.businessAssessment)
      });
    }

    if (applicationData.swotAnalysis) {
      sections.push({
        sectionType: 'swot-analysis',
        data: applicationData.swotAnalysis as Record<string, any>,
        completed: this.isSwotAnalysisComplete(applicationData.swotAnalysis)
      });
    }

    if (applicationData.managementStructure) {
      sections.push({
        sectionType: 'management',
        data: applicationData.managementStructure as Record<string, any>,
        completed: this.isManagementStructureComplete(applicationData.managementStructure)
      });
    }

    if (applicationData.businessStrategy) {
      sections.push({
        sectionType: 'business-strategy',
        data: applicationData.businessStrategy as Record<string, any>,
        completed: this.isBusinessStrategyComplete(applicationData.businessStrategy)
      });
    }

    if (applicationData.financialProfile) {
      sections.push({
        sectionType: 'financial-profile',
        data: applicationData.financialProfile as Record<string, any>,
        completed: this.isFinancialProfileComplete(applicationData.financialProfile)
      });
    }

    return sections;
  }

  private transformBackendToLocal(response: BackendFundingApplicationResponse): FundingApplicationProfile {
    const applicationData: FundingApplicationProfile = {};

    response.sections?.forEach(section => {
      switch(section.sectionType) {
        case 'company-info':
          applicationData.companyInfo = section.data as any;
          break;
        case 'documents':
          applicationData.supportingDocuments = section.data as any;
          break;
        case 'business-assessment':
          applicationData.businessAssessment = section.data as any;
          break;
        case 'swot-analysis':
          applicationData.swotAnalysis = section.data as any;
          break;
        case 'management':
          applicationData.managementStructure = section.data as any;
          break;
        case 'business-strategy':
          applicationData.businessStrategy = section.data as any;
          break;
        case 'financial-profile':
          applicationData.financialProfile = section.data as any;
          break;
      }
    });

    return applicationData;
  }

  // ===============================
  // VALIDATION METHODS
  // ===============================

  private calculateSectionCompletion(data: Record<string, any>, completed: boolean): number {
    if (completed) return 100;
    
    const fields = Object.values(data);
    const filledFields = fields.filter(value => 
      value !== null && 
      value !== undefined && 
      value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;
    
    return fields.length > 0 ? Math.round((filledFields / fields.length) * 100) : 0;
  }

  private calculateOverallCompletion(sections: Array<{sectionType: string, data: Record<string, any>, completed: boolean}>): number {
    if (sections.length === 0) return 0;
    
    const completedSections = sections.filter(section => section.completed).length;
    return Math.round((completedSections / sections.length) * 100);
  }

  private isCompanyInfoComplete(data: any): boolean {
    const requiredFields = ['companyName', 'registrationNumber', 'industryType', 'foundingYear'];
    return requiredFields.every(field => data[field] && data[field].toString().trim() !== '');
  }

  private isDocumentsComplete(data: any): boolean {
    const requiredDocs = ['companyRegistration', 'taxClearanceCertificate', 'auditedFinancials'];
    return requiredDocs.some(doc => data[doc]); // At least one required document
  }

  private isBusinessAssessmentComplete(data: any): boolean {
    const requiredFields = ['businessModel', 'valueProposition', 'targetMarkets'];
    return requiredFields.every(field => data[field] && data[field].toString().trim() !== '');
  }

  private isSwotAnalysisComplete(data: any): boolean {
    return data.strengths?.length >= 2 && 
           data.weaknesses?.length >= 2 && 
           data.opportunities?.length >= 2 && 
           data.threats?.length >= 2;
  }

  private isManagementStructureComplete(data: any): boolean {
    return data.executiveTeam?.length >= 1 || data.managementTeam?.length >= 1;
  }

  private isBusinessStrategyComplete(data: any): boolean {
    const requiredSections = ['executiveSummary', 'missionStatement', 'fundingRequirements'];
    return requiredSections.every(section => data[section] && data[section].toString().trim() !== '');
  }

  private isFinancialProfileComplete(data: any): boolean {
    const requiredFields = ['monthlyRevenue', 'monthlyCosts', 'currentAssets'];
    return requiredFields.some(field => data[field] !== null && data[field] !== undefined);
  }
}