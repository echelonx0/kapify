// src/app/shared/services/application-profile-management.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { ApplicationProfileData } from './funding-profile.service';
 

// Backend response interfaces
export interface BusinessPlanSectionData {
  sectionType: string;
  data: Record<string, any>;
  completed: boolean;
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackendProfileResponse {
  sections: BusinessPlanSectionData[];
}

export interface SaveSectionResponse {
  section: BusinessPlanSectionData;
  overallCompletion: number;
  message: string;
}

export interface SaveCompleteProfileResponse {
  success: boolean;
  profileId: string;
  overallCompletion: number;
  savedSections: string[];
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class FundingApplicationBackendService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly API_BASE = 'http://localhost:3000/api';
  
  // Only track backend operations
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  error = signal<string | null>(null);
  lastSavedAt = signal<Date | null>(null);

  constructor() {}

  // Load saved profile from backend (initial load only)
  loadSavedProfile(): Observable<ApplicationProfileData> {
    this.isLoading.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.get<BackendProfileResponse>(`${this.API_BASE}/users/${currentAuth.id}/business-plan`).pipe(
      tap(() => this.isLoading.set(false)),
      map(response => this.transformBackendToLocal(response)),
      catchError(error => {
        this.error.set('Failed to load saved profile data');
        this.isLoading.set(false);
        console.error('Load profile error:', error);
        return throwError(() => error);
      })
    );
  }

  // Save complete profile to backend (final submission)
  saveCompleteProfile(profileData: ApplicationProfileData): Observable<SaveCompleteProfileResponse> {
    this.isSaving.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isSaving.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    // Transform local data structure to backend format
    const backendPayload = this.transformLocalToBackend(profileData);
    
    return this.saveAllSections(currentAuth.id, backendPayload).pipe(
      tap(response => {
        this.isSaving.set(false);
        this.lastSavedAt.set(new Date());
        console.log('Complete profile saved successfully:', response);
      }),
      catchError(error => {
        this.error.set('Failed to save complete profile');
        this.isSaving.set(false);
        console.error('Save complete profile error:', error);
        return throwError(() => error);
      })
    );
  }

  // Save draft section (manual save during process)
  saveDraftSection(sectionType: string, sectionData: Record<string, any>, completed: boolean = false): Observable<SaveSectionResponse> {
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    const completionPercentage = this.calculateSectionCompletion(sectionData, completed);
    
    const payload = {
      data: sectionData,
      completed,
      completionPercentage
    };

    return this.http.patch<SaveSectionResponse>(
      `${this.API_BASE}/users/${currentAuth.id}/business-plan/${sectionType}`,
      payload
    ).pipe(
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

  // Auto-save functionality (periodic backup)
  autoSaveProfile(profileData: ApplicationProfileData): Observable<SaveCompleteProfileResponse> {
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    const backendPayload = this.transformLocalToBackend(profileData);
    
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

  // Submit profile for review (final action)
  submitProfileForReview(profileData: ApplicationProfileData): Observable<{success: boolean, applicationId: string}> {
    this.isSaving.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isSaving.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    // First save complete profile
    return this.saveCompleteProfile(profileData).pipe(
      // Then submit for review
      map(saveResponse => {
        // In production, this would trigger the review process
        return {
          success: true,
          applicationId: saveResponse.profileId
        };
      }),
      tap(response => {
        this.isSaving.set(false);
        console.log('Profile submitted for review:', response);
      }),
      catchError(error => {
        this.error.set('Failed to submit profile for review');
        this.isSaving.set(false);
        return throwError(() => error);
      })
    );
  }

  // Delete draft data
  clearSavedProfile(): Observable<{success: boolean}> {
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.delete<{success: boolean}>(`${this.API_BASE}/users/${currentAuth.id}/business-plan`).pipe(
      tap(() => {
        this.lastSavedAt.set(null);
        console.log('Saved profile data cleared');
      }),
      catchError(error => {
        this.error.set('Failed to clear saved profile');
        return throwError(() => error);
      })
    );
  }

  // Private helper methods
  private saveAllSections(userId: string, sections: Array<{sectionType: string, data: Record<string, any>, completed: boolean}>, isAutoSave: boolean = false): Observable<SaveCompleteProfileResponse> {
    // Create array of save requests
    const saveRequests = sections.map(section => 
      this.http.patch<SaveSectionResponse>(
        `${this.API_BASE}/users/${userId}/business-plan/${section.sectionType}`,
        {
          data: section.data,
          completed: section.completed,
          completionPercentage: this.calculateSectionCompletion(section.data, section.completed)
        }
      )
    );

    // Execute all saves in parallel
    return new Observable<SaveCompleteProfileResponse>(observer => {
      Promise.all(saveRequests.map(req => req.toPromise()))
        .then(responses => {
          const savedSections = responses.map(r => r!.section.sectionType);
          const overallCompletion = Math.max(...responses.map(r => r!.overallCompletion || 0));
          
          observer.next({
            success: true,
            profileId: `profile_${userId}_${Date.now()}`,
            overallCompletion,
            savedSections,
            message: isAutoSave ? 'Profile auto-saved successfully' : 'Profile saved successfully'
          });
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  private transformLocalToBackend(profileData: ApplicationProfileData): Array<{sectionType: string, data: Record<string, any>, completed: boolean}> {
    const sections: Array<{sectionType: string, data: Record<string, any>, completed: boolean}> = [];

    if (profileData.adminInformation) {
      sections.push({
        sectionType: 'admin',
        data: profileData.adminInformation,
        completed: this.isAdminInformationComplete(profileData.adminInformation)
      });
    }

    if (profileData.documents) {
      sections.push({
        sectionType: 'documents',
        data: profileData.documents,
        completed: this.isDocumentsComplete(profileData.documents)
      });
    }

    if (profileData.businessReview) {
      sections.push({
        sectionType: 'business-review',
        data: profileData.businessReview,
        completed: this.isBusinessReviewComplete(profileData.businessReview)
      });
    }

    if (profileData.swotAnalysis) {
      sections.push({
        sectionType: 'swot',
        data: profileData.swotAnalysis as Record<string, any>,
        completed: this.isSwotAnalysisComplete(profileData.swotAnalysis)
      });
    }

    if (profileData.managementGovernance) {
      sections.push({
        sectionType: 'management',
        data: profileData.managementGovernance as Record<string, any>,
        completed: this.isManagementGovernanceComplete(profileData.managementGovernance)
      });
    }

    if (profileData.businessPlan) {
      sections.push({
        sectionType: 'business-plan',
        data: profileData.businessPlan,
        completed: this.isBusinessPlanComplete(profileData.businessPlan)
      });
    }

    if (profileData.financialAnalysis) {
      sections.push({
        sectionType: 'financial',
        data: profileData.financialAnalysis,
        completed: this.isFinancialAnalysisComplete(profileData.financialAnalysis)
      });
    }

    return sections;
  }

  private transformBackendToLocal(response: BackendProfileResponse): ApplicationProfileData {
    const profileData: ApplicationProfileData = {};

    response.sections.forEach(section => {
      switch(section.sectionType) {
        case 'admin':
          profileData.adminInformation = section.data;
          break;
        case 'documents':
          profileData.documents = section.data;
          break;
        case 'business-review':
          profileData.businessReview = section.data;
          break;
        case 'swot':
          profileData.swotAnalysis = section.data as any;
          break;
        case 'management':
          profileData.managementGovernance = section.data as any;
          break;
        case 'business-plan':
          profileData.businessPlan = section.data;
          break;
        case 'financial':
          profileData.financialAnalysis = section.data;
          break;
      }
    });

    return profileData;
  }

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

  // Validation methods (same as before)
  private isAdminInformationComplete(data: Record<string, any>): boolean {
    const requiredFields = ['companyName', 'registrationNumber', 'industry', 'foundedYear'];
    return requiredFields.every(field => data[field] && data[field].toString().trim() !== '');
  }

  private isDocumentsComplete(data: Record<string, any>): boolean {
    const requiredDocs = ['businessRegistration', 'taxClearance', 'financialStatements'];
    return requiredDocs.every(doc => data[doc]);
  }

  private isBusinessReviewComplete(data: Record<string, any>): boolean {
    const requiredFields = ['businessModel', 'targetMarket', 'competitiveAdvantage'];
    return requiredFields.every(field => data[field] && data[field].toString().trim() !== '');
  }

  private isSwotAnalysisComplete(data: {strengths: string[], weaknesses: string[], opportunities: string[], threats: string[]}): boolean {
    return data.strengths?.length >= 2 && 
           data.weaknesses?.length >= 2 && 
           data.opportunities?.length >= 2 && 
           data.threats?.length >= 2;
  }

  private isManagementGovernanceComplete(data: Record<string, any>): boolean {
    return data['managementTeam']?.length >= 1 && data['boardOfDirectors']?.length >= 1;
  }

  private isBusinessPlanComplete(data: Record<string, any>): boolean {
    const requiredSections = ['executiveSummary', 'marketAnalysis', 'financialProjections'];
    return requiredSections.every(section => data[section] && data[section].toString().trim() !== '');
  }

  private isFinancialAnalysisComplete(data: Record<string, any>): boolean {
    const requiredFields = ['currentRevenue', 'projectedRevenue', 'fundingRequired'];
    return requiredFields.every(field => data[field] !== null && data[field] !== undefined);
  }
}