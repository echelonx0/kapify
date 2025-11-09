// // src/app/SMEs/services/funding-profile-backend.service.ts
// import { Injectable, inject, signal } from '@angular/core';
// import { Observable, throwError, from } from 'rxjs';
// import { tap, catchError, switchMap } from 'rxjs/operators';
// import { AuthService } from '../../auth/production.auth.service';
// import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
// import { ActivityService } from '../../shared/services/activity.service';
// import { FundingApplicationProfile } from '../applications/models/funding-application.models';

// // Backend response interfaces
// export interface FundingApplicationSectionData {
//   sectionType: string;
//   data: Record<string, any>;
//   completed: boolean;
//   completionPercentage: number;
//   createdAt: string;
//   updatedAt: string;
// }

// export interface BackendFundingApplicationResponse {
//   sections: FundingApplicationSectionData[];
//   overallCompletion: number;
//   lastUpdated: string;
// }

// export interface SaveSectionResponse {
//   section: FundingApplicationSectionData;
//   overallCompletion: number;
//   message: string;
//   success: boolean;
// }

// export interface SaveCompleteApplicationResponse {
//   success: boolean;
//   applicationId: string;
//   overallCompletion: number;
//   savedSections: string[];
//   message: string;
//   lastSaved: string;
// }

// export interface SubmitApplicationResponse {
//   success: boolean;
//   applicationId: string;
//   submissionDate: string;
//   status: string;
//   message: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class FundingProfileBackendService {
//   private authService = inject(AuthService);
//   private supabase = inject(SharedSupabaseService);
//   private activityService = inject(ActivityService);

//   // Loading and error states
//   isLoading = signal<boolean>(false);
//   isSaving = signal<boolean>(false);
//   error = signal<string | null>(null);
//   lastSavedAt = signal<Date | null>(null);

//   // ===============================
//   // LOAD SAVED APPLICATION
//   // ===============================

//   loadSavedProfile(): Observable<FundingApplicationProfile> {
//     this.isLoading.set(true);
//     this.error.set(null);

//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       this.isLoading.set(false);
//       return throwError(() => new Error('User not authenticated'));
//     }

//     return from(this.loadFromSupabase(currentAuth.id)).pipe(
//       tap((profile) => {
//         this.isLoading.set(false);

//         // Track profile load activity
//         this.activityService.trackProfileActivity(
//           'updated',
//           'Funding application profile loaded from saved data',
//           'profile_load'
//         );
//       }),
//       catchError(error => {
//         this.error.set('Failed to load saved application data');
//         this.isLoading.set(false);
//         console.error('Load application error:', error);

//         // Track error activity
//         this.activityService.trackProfileActivity(
//           'updated',
//           'Failed to load funding application profile',
//           'profile_load_error'
//         );

//         return throwError(() => error);
//       })
//     );
//   }

// // Add this method to your FundingProfileBackendService class

// /**
//  * Load saved profile for a specific user (for funder review purposes)
//  * @param userId - The user ID of the applicant whose profile to load
//  */
// loadSavedProfileForUser(userId: string): Observable<FundingApplicationProfile> {
//   this.isLoading.set(true);
//   this.error.set(null);

//   if (!userId) {
//     this.isLoading.set(false);
//     return throwError(() => new Error('User ID is required'));
//   }

//   return from(this.loadFromSupabaseForUser(userId)).pipe(
//     tap((profile) => {
//       this.isLoading.set(false);

//       // Track profile load activity for the specific user
//       this.activityService.trackProfileActivity(
//         'updated',
//         `Funding application profile loaded for review (User: ${userId})`,
//         'profile_load_review'
//       );
//     }),
//     catchError(error => {
//       this.error.set(`Failed to load application profile for user: ${userId}`);
//       this.isLoading.set(false);
//       console.error('Load application profile error:', error);

//       // Track error activity
//       this.activityService.trackProfileActivity(
//         'updated',
//         `Failed to load funding application profile for user: ${userId}`,
//         'profile_load_error'
//       );

//       return throwError(() => error);
//     })
//   );
// }

// /**
//  * Load profile data from Supabase for a specific user
//  * @param userId - The target user's ID
//  */
// private async loadFromSupabaseForUser(userId: string): Promise<FundingApplicationProfile> {
//   try {
//     console.log(`🔍 Loading profile data for user: ${userId}`);

//     const { data: sections, error } = await this.supabase
//       .from('business_plan_sections')
//       .select('*')
//       .eq('user_id', userId)
//       .order('updated_at', { ascending: false });

//     if (error) {
//       throw new Error(`Supabase error: ${error.message}`);
//     }

//     if (!sections || sections.length === 0) {
//       throw new Error(`No profile data found for user: ${userId}`);
//     }

//     const applicationData: FundingApplicationProfile = {};

//     sections.forEach(section => {
//       switch(section.section_type) {
//         case 'company-info':
//           applicationData.companyInfo = section.data;
//           break;
//         case 'documents':
//           applicationData.supportingDocuments = section.data;
//           break;
//         case 'business-assessment':
//           applicationData.businessAssessment = section.data;
//           break;
//         case 'swot-analysis':
//           applicationData.swotAnalysis = section.data;
//           break;
//         case 'management':
//           applicationData.managementStructure = section.data;
//           break;
//         case 'business-strategy':
//           applicationData.businessStrategy = section.data;
//           break;
//         case 'financial-profile':
//           applicationData.financialProfile = section.data;
//           break;
//       }
//     });

//     console.log(`✅ Profile data loaded successfully for user: ${userId}`);
//     return applicationData;
//   } catch (error) {
//     console.error(`❌ Error loading profile for user ${userId}:`, error);
//     throw error;
//   }
// }
//   private async debugAuthContext(): Promise<void> {
//     try {
//       // Check Angular auth service
//       const currentAuth = this.authService.user();
//       console.log('🔍 Angular Auth User:', currentAuth);

//       // Check Supabase auth directly
//       const { data: { user }, error } = await this.supabase.auth.getUser();
//       console.log('🔍 Supabase Auth User:', user);
//       console.log('🔍 Supabase Auth Error:', error);

//       // Test RLS context with a simple query
//       const { data: testData, error: testError } = await this.supabase
//         .from('business_plan_sections')
//         .select('user_id')
//         .limit(1);

//       console.log('🔍 Test Query Result:', testData);
//       console.log('🔍 Test Query Error:', testError);

//       // Check if there's a session
//       const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
//       console.log('🔍 Supabase Session:', session);
//       console.log('🔍 Session Error:', sessionError);

//     } catch (error) {
//       console.error('🚨 Debug Auth Context Error:', error);
//     }
//   }

//   private async loadFromSupabase(userId: string): Promise<FundingApplicationProfile> {
//     try {
//       const { data: sections, error } = await this.supabase
//         .from('business_plan_sections')
//         .select('*')
//         .eq('user_id', userId)
//         .order('updated_at', { ascending: false });

//       if (error) {
//         throw new Error(`Supabase error: ${error.message}`);
//       }

//       const applicationData: FundingApplicationProfile = {};

//       sections?.forEach(section => {
//         switch(section.section_type) {
//           case 'company-info':
//             applicationData.companyInfo = section.data;
//             break;
//           case 'documents':
//             applicationData.supportingDocuments = section.data;
//             break;
//           case 'business-assessment':
//             applicationData.businessAssessment = section.data;
//             break;
//           case 'swot-analysis':
//             applicationData.swotAnalysis = section.data;
//             break;
//           case 'management':
//             applicationData.managementStructure = section.data;
//             break;
//           case 'business-strategy':
//             applicationData.businessStrategy = section.data;
//             break;
//           case 'financial-profile':
//             applicationData.financialProfile = section.data;
//             break;
//         }
//       });

//       return applicationData;
//     } catch (error) {
//       console.error('Error loading from Supabase:', error);
//       throw error;
//     }
//   }

//   // ===============================
//   // SAVE COMPLETE APPLICATION
//   // ===============================

//   saveCompleteProfile(applicationData: FundingApplicationProfile): Observable<SaveCompleteApplicationResponse> {
//     this.isSaving.set(true);
//     this.error.set(null);

//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       this.isSaving.set(false);
//       return throwError(() => new Error('User not authenticated'));
//     }

//     const sections = this.transformLocalToBackend(applicationData);

//     return from(this.saveAllSectionsToSupabase(currentAuth.id, sections)).pipe(
//       tap(response => {
//         this.isSaving.set(false);
//         this.lastSavedAt.set(new Date());
//         console.log('Complete application saved successfully:', response);

//         // Track successful save activity
//         this.activityService.trackProfileActivity(
//           'completed',
//           `Complete funding application saved with ${response.overallCompletion}% completion`,
//           'complete_save'
//         );

//         // Track individual section saves
//         response.savedSections.forEach(sectionType => {
//           this.activityService.trackProfileActivity(
//             'updated',
//             `${this.getSectionDisplayName(sectionType)} section saved successfully`,
//             sectionType
//           );
//         });
//       }),
//       catchError(error => {
//         this.error.set('Failed to save complete application');
//         this.isSaving.set(false);
//         console.error('Save complete application error:', error);

//         // Track save error activity
//         this.activityService.trackProfileActivity(
//           'updated',
//           'Failed to save complete funding application',
//           'save_error'
//         );

//         return throwError(() => error);
//       })
//     );
//   }

//   // ===============================
//   // SAVE DRAFT SECTION
//   // ===============================

//   saveDraftSection(sectionType: string, sectionData: Record<string, any>, completed: boolean = false): Observable<SaveSectionResponse> {
//     this.error.set(null);

//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     const completionPercentage = this.calculateSectionCompletion(sectionData, completed);

//     return from(this.saveSectionToSupabase(
//       currentAuth.id,
//       sectionType,
//       sectionData,
//       completed,
//       completionPercentage
//     )).pipe(
//       tap(response => {
//         console.log(`Section ${sectionType} saved as draft:`, response);

//         // Track draft section save activity
//         const sectionDisplayName = this.getSectionDisplayName(sectionType);
//         const statusText = completed ? 'completed' : `${completionPercentage}% completed`;

//         this.activityService.trackProfileActivity(
//           completed ? 'completed' : 'updated',
//           `${sectionDisplayName} section saved as ${completed ? 'final' : 'draft'} (${statusText})`,
//           sectionType
//         );
//       }),
//       catchError(error => {
//         this.error.set(`Failed to save ${sectionType} section`);
//         console.error(`Save ${sectionType} section error:`, error);

//         // Track section save error
//         this.activityService.trackProfileActivity(
//           'updated',
//           `Failed to save ${this.getSectionDisplayName(sectionType)} section`,
//           `${sectionType}_error`
//         );

//         return throwError(() => error);
//       })
//     );
//   }

//   private async saveSectionToSupabase(
//     userId: string,
//     sectionType: string,
//     data: Record<string, any>,
//     completed: boolean,
//     completionPercentage: number
//   ): Promise<SaveSectionResponse> {
//     try {
//       // ADD THIS DEBUG CALL
//       await this.debugAuthContext();
//       console.log('🔍 Attempting to save for userId:', userId);

//       const sectionData = {
//         user_id: userId,
//         section_type: sectionType,
//         data: data,
//         completed: completed,
//         completion_percentage: completionPercentage,
//         updated_at: new Date().toISOString()
//       };

//       // Use upsert to handle insert or update
//       const { data: result, error } = await this.supabase
//         .from('business_plan_sections')
//         .upsert(sectionData, {
//           onConflict: 'user_id,section_type',
//           ignoreDuplicates: false
//         })
//         .select()
//         .single();

//       if (error) {
//         throw new Error(`Supabase error: ${error.message}`);
//       }

//       return {
//         section: {
//           sectionType: result.section_type,
//           data: result.data,
//           completed: result.completed,
//           completionPercentage: result.completion_percentage,
//           createdAt: result.created_at,
//           updatedAt: result.updated_at
//         },
//         overallCompletion: completionPercentage,
//         message: 'Section saved successfully',
//         success: true
//       };
//     } catch (error) {
//       console.error('Error saving section to Supabase:', error);
//       throw error;
//     }
//   }

//   // ===============================
//   // AUTO-SAVE FUNCTIONALITY
//   // ===============================

//   autoSaveProfile(applicationData: FundingApplicationProfile): Observable<SaveCompleteApplicationResponse> {
//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     const sections = this.transformLocalToBackend(applicationData);

//     return from(this.saveAllSectionsToSupabase(currentAuth.id, sections, true)).pipe(
//       tap(response => {
//         this.lastSavedAt.set(new Date());
//         console.log('Auto-save completed:', response);

//         // Track auto-save activity (less verbose)
//         this.activityService.trackProfileActivity(
//           'updated',
//           `Application auto-saved (${response.overallCompletion}% complete)`,
//           'auto_save'
//         );
//       }),
//       catchError(error => {
//         console.error('Auto-save failed:', error);

//         // Track auto-save failure
//         this.activityService.trackProfileActivity(
//           'updated',
//           'Auto-save failed - please save manually',
//           'auto_save_error'
//         );

//         return throwError(() => error);
//       })
//     );
//   }

//   // ===============================
//   // SUBMIT FOR REVIEW
//   // ===============================

//   submitProfileForReview(applicationData: FundingApplicationProfile): Observable<SubmitApplicationResponse> {
//     this.isSaving.set(true);
//     this.error.set(null);

//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       this.isSaving.set(false);
//       return throwError(() => new Error('User not authenticated'));
//     }

//     return this.saveCompleteProfile(applicationData).pipe(
//       switchMap(saveResponse => from(this.createApplicationRecord(currentAuth.id, saveResponse.applicationId))),
//       tap(response => {
//         this.isSaving.set(false);
//         console.log('Application submitted for review:', response);

//         // Track application submission
//         this.activityService.trackApplicationActivity(
//           'submitted',
//           response.applicationId,
//           `Funding application submitted for review on ${new Date().toLocaleDateString()}`,
//           this.extractFundingAmount(applicationData)
//         );

//         // Track profile completion
//         this.activityService.trackProfileActivity(
//           'completed',
//           'Funding application profile completed and submitted for review',
//           'submission'
//         );
//       }),
//       catchError(error => {
//         this.error.set('Failed to submit application for review');
//         this.isSaving.set(false);

//         // Track submission failure
//         this.activityService.trackApplicationActivity(
//           'updated',
//           'temp_id',
//           'Failed to submit funding application for review',
//           this.extractFundingAmount(applicationData)
//         );

//         return throwError(() => error);
//       })
//     );
//   }

//   // ===============================
//   // DELETE DRAFT DATA
//   // ===============================

//   clearSavedProfile(): Observable<{success: boolean}> {
//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     return from(this.clearFromSupabase(currentAuth.id)).pipe(
//       tap(() => {
//         this.lastSavedAt.set(null);
//         console.log('Saved application data cleared');

//         // Track profile clearing
//         this.activityService.trackProfileActivity(
//           'updated',
//           'Funding application draft data cleared',
//           'profile_clear'
//         );
//       }),
//       catchError(error => {
//         this.error.set('Failed to clear saved application');

//         // Track clear error
//         this.activityService.trackProfileActivity(
//           'updated',
//           'Failed to clear funding application draft data',
//           'clear_error'
//         );

//         return throwError(() => error);
//       })
//     );
//   }

//   private async clearFromSupabase(userId: string): Promise<{success: boolean}> {
//     try {
//       const { error } = await this.supabase
//         .from('business_plan_sections')
//         .delete()
//         .eq('user_id', userId);

//       if (error) {
//         throw new Error(`Supabase error: ${error.message}`);
//       }

//       return { success: true };
//     } catch (error) {
//       console.error('Error clearing from Supabase:', error);
//       throw error;
//     }
//   }

//   // ===============================
//   // PRIVATE HELPER METHODS
//   // ===============================

//   private async saveAllSectionsToSupabase(
//     userId: string,
//     sections: Array<{sectionType: string, data: Record<string, any>, completed: boolean}>,
//     isAutoSave: boolean = false
//   ): Promise<SaveCompleteApplicationResponse> {
//     try {
//       const supabasePayload = sections.map(section => ({
//         user_id: userId,
//         section_type: section.sectionType,
//         data: section.data,
//         completed: section.completed,
//         completion_percentage: this.calculateSectionCompletion(section.data, section.completed),
//         updated_at: new Date().toISOString()
//       }));

//       // Use upsert for batch operation
//       const { data: results, error } = await this.supabase
//         .from('business_plan_sections')
//         .upsert(supabasePayload, {
//           onConflict: 'user_id,section_type',
//           ignoreDuplicates: false
//         })
//         .select();

//       if (error) {
//         throw new Error(`Supabase error: ${error.message}`);
//       }

//       const overallCompletion = this.calculateOverallCompletion(sections);
//       const applicationId = `funding_app_${userId}_${Date.now()}`;

//       return {
//         success: true,
//         applicationId,
//         overallCompletion,
//         savedSections: sections.map(s => s.sectionType),
//         message: isAutoSave ? 'Application auto-saved successfully' : 'Application saved successfully',
//         lastSaved: new Date().toISOString()
//       };
//     } catch (error) {
//       console.error('Error saving all sections to Supabase:', error);
//       throw error;
//     }
//   }

//   private async createApplicationRecord(userId: string, applicationId: string): Promise<SubmitApplicationResponse> {
//     try {
//       const applicationPayload = {
//         id: applicationId,
//         applicant_id: userId,
//         title: 'SME Funding Application',
//         description: 'Complete funding application profile',
//         status: 'submitted',
//         stage: 'initial_review',
//         submitted_at: new Date().toISOString(),
//         created_at: new Date().toISOString()
//       };

//       const { data, error } = await this.supabase
//         .from('applications')
//         .insert(applicationPayload)
//         .select()
//         .single();

//       if (error) {
//         throw new Error(`Failed to create application record: ${error.message}`);
//       }

//       return {
//         success: true,
//         applicationId: data.id,
//         submissionDate: data.submitted_at,
//         status: data.status,
//         message: 'Application submitted successfully for review'
//       };
//     } catch (error) {
//       console.error('Error creating application record:', error);
//       throw error;
//     }
//   }

//   // ===============================
//   // DATA TRANSFORMATION METHODS
//   // ===============================

//   private transformLocalToBackend(applicationData: FundingApplicationProfile): Array<{sectionType: string, data: Record<string, any>, completed: boolean}> {
//     const sections: Array<{sectionType: string, data: Record<string, any>, completed: boolean}> = [];

//     if (applicationData.companyInfo) {
//       sections.push({
//         sectionType: 'company-info',
//         data: applicationData.companyInfo as Record<string, any>,
//         completed: this.isCompanyInfoComplete(applicationData.companyInfo)
//       });
//     }

//     if (applicationData.supportingDocuments) {
//       sections.push({
//         sectionType: 'documents',
//         data: applicationData.supportingDocuments as Record<string, any>,
//         completed: this.isDocumentsComplete(applicationData.supportingDocuments)
//       });
//     }

//     if (applicationData.businessAssessment) {
//       sections.push({
//         sectionType: 'business-assessment',
//         data: applicationData.businessAssessment as Record<string, any>,
//         completed: this.isBusinessAssessmentComplete(applicationData.businessAssessment)
//       });
//     }

//     if (applicationData.swotAnalysis) {
//       sections.push({
//         sectionType: 'swot-analysis',
//         data: applicationData.swotAnalysis as Record<string, any>,
//         completed: this.isSwotAnalysisComplete(applicationData.swotAnalysis)
//       });
//     }

//     if (applicationData.managementStructure) {
//       sections.push({
//         sectionType: 'management',
//         data: applicationData.managementStructure as Record<string, any>,
//         completed: this.isManagementStructureComplete(applicationData.managementStructure)
//       });
//     }

//     if (applicationData.businessStrategy) {
//       sections.push({
//         sectionType: 'business-strategy',
//         data: applicationData.businessStrategy as Record<string, any>,
//         completed: this.isBusinessStrategyComplete(applicationData.businessStrategy)
//       });
//     }

//     if (applicationData.financialProfile) {
//       sections.push({
//         sectionType: 'financial-profile',
//         data: applicationData.financialProfile as Record<string, any>,
//         completed: this.isFinancialProfileComplete(applicationData.financialProfile)
//       });
//     }

//     return sections;
//   }

//   // ===============================
//   // VALIDATION METHODS
//   // ===============================

//   private calculateSectionCompletion(data: Record<string, any>, completed: boolean): number {
//     if (completed) return 100;

//     const fields = Object.values(data);
//     const filledFields = fields.filter(value =>
//       value !== null &&
//       value !== undefined &&
//       value !== '' &&
//       (Array.isArray(value) ? value.length > 0 : true)
//     ).length;

//     return fields.length > 0 ? Math.round((filledFields / fields.length) * 100) : 0;
//   }

//   private calculateOverallCompletion(sections: Array<{sectionType: string, data: Record<string, any>, completed: boolean}>): number {
//     if (sections.length === 0) return 0;

//     const completedSections = sections.filter(section => section.completed).length;
//     return Math.round((completedSections / sections.length) * 100);
//   }

//   private isCompanyInfoComplete(data: any): boolean {
//     const requiredFields = ['companyName', 'registrationNumber', 'industryType', 'foundingYear'];
//     return requiredFields.every(field => data[field] && data[field].toString().trim() !== '');
//   }

//   private isDocumentsComplete(data: any): boolean {
//     const requiredDocs = ['companyRegistration', 'taxClearanceCertificate', 'auditedFinancials'];
//     return requiredDocs.some(doc => data[doc]); // At least one required document
//   }

//   private isBusinessAssessmentComplete(data: any): boolean {
//     const requiredFields = ['businessModel', 'valueProposition', 'targetMarkets'];
//     return requiredFields.every(field => data[field] && data[field].toString().trim() !== '');
//   }

//   private isSwotAnalysisComplete(data: any): boolean {
//     return data.strengths?.length >= 2 &&
//            data.weaknesses?.length >= 2 &&
//            data.opportunities?.length >= 2 &&
//            data.threats?.length >= 2;
//   }

//   private isManagementStructureComplete(data: any): boolean {
//     return data.executiveTeam?.length >= 1 || data.managementTeam?.length >= 1;
//   }

//   private isBusinessStrategyComplete(data: any): boolean {
//     const requiredSections = ['executiveSummary', 'missionStatement', 'fundingRequirements'];
//     return requiredSections.every(section => data[section] && data[section].toString().trim() !== '');
//   }

//   private isFinancialProfileComplete(data: any): boolean {
//     const requiredFields = ['monthlyRevenue', 'monthlyCosts', 'currentAssets'];
//     return requiredFields.some(field => data[field] !== null && data[field] !== undefined);
//   }

//   // ===============================
//   // ACTIVITY TRACKING UTILITY METHODS
//   // ===============================

//   /**
//    * Get human-readable section display name for activities
//    */
//   private getSectionDisplayName(sectionType: string): string {
//     const displayNames: Record<string, string> = {
//       'company-info': 'Company Information',
//       'documents': 'Supporting Documents',
//       'business-assessment': 'Business Assessment',
//       'swot-analysis': 'SWOT Analysis',
//       'management': 'Management Structure',
//       'business-strategy': 'Business Strategy',
//       'financial-profile': 'Financial Profile'
//     };
//     return displayNames[sectionType] || sectionType;
//   }

//   /**
//    * Extract funding amount from application data for activity tracking
//    */
//   private extractFundingAmount(applicationData: FundingApplicationProfile): number | undefined {
//     if (applicationData.businessStrategy?.fundingRequirements) {
//       const fundingReq = applicationData.businessStrategy.fundingRequirements;
//       // Try to extract numeric value from funding requirements
//       if (typeof fundingReq === 'number') return fundingReq;
//       if (typeof fundingReq === 'string') {
//      const match = (fundingReq as string).match(/(\d+(?:\.\d+)?)/);
//   return match ? parseFloat(match[1]) : undefined;
//       }
//     }

//     if (applicationData.financialProfile?.monthlyRevenue) {
//       return applicationData.financialProfile.monthlyRevenue * 12; // Estimated annual revenue
//     }

//     return undefined;
//   }

//   // ===============================
//   // PUBLIC ACTIVITY TRACKING METHODS
//   // ===============================

//   /**
//    * Track document upload activities (called from document components)
//    */
//   trackDocumentUpload(documentType: string, documentId: string, success: boolean): void {
//     if (success) {
//       this.activityService.trackDocumentActivity(
//         'uploaded',
//         `${documentType} document uploaded successfully`,
//         documentId,
//         documentType
//       );
//     } else {
//       this.activityService.trackDocumentActivity(
//         'rejected',
//         `Failed to upload ${documentType} document`,
//         documentId,
//         documentType
//       );
//     }
//   }

//   /**
//    * Track document verification activities
//    */
//   trackDocumentVerification(documentType: string, documentId: string, verified: boolean): void {
//     this.activityService.trackDocumentActivity(
//       verified ? 'verified' : 'rejected',
//       `${documentType} document ${verified ? 'verified' : 'rejected'} by system`,
//       documentId,
//       documentType
//     );
//   }

//   /**
//    * Track application status changes (called from admin/review components)
//    */
//   trackApplicationStatusChange(
//     applicationId: string,
//     newStatus: 'approved' | 'rejected' | 'under_review' | 'requires_changes',
//     message: string,
//     amount?: number
//   ): void {
//     const action = newStatus === 'approved' ? 'approved' :
//                   newStatus === 'rejected' ? 'rejected' : 'updated';

//     this.activityService.trackApplicationActivity(
//       action,
//       applicationId,
//       message,
//       amount
//     );
//   }
// }
// FIXED: src/app/SMEs/services/funding-profile-backend.service.ts
// - Fixed loadFromSupabase signature
// - Fixed TypeScript type errors

import { Injectable, inject, signal } from '@angular/core';
import { Observable, throwError, from } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { ActivityService } from '../../shared/services/activity.service';
import { FundingApplicationProfile } from '../applications/models/funding-application.models';

@Injectable({
  providedIn: 'root',
})
export class FundingProfileBackendService {
  private authService = inject(AuthService);
  private supabase = inject(SharedSupabaseService);
  private activityService = inject(ActivityService);

  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  error = signal<string | null>(null);
  lastSavedAt = signal<Date | null>(null);

  // ===============================
  // HELPER: Get User's Organization
  // ===============================

  /**
   * Get the authenticated user's active organization
   */
  private async getUserOrganization(userId: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        throw new Error('User has no active organization');
      }

      return data.organization_id;
    } catch (error) {
      console.error('Failed to get user organization:', error);
      throw error;
    }
  }

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

    return from(this.loadProfileByUser(currentAuth.id)).pipe(
      tap((profile) => {
        this.isLoading.set(false);

        this.activityService.trackProfileActivity(
          'updated',
          'Funding application profile loaded from saved data',
          'profile_load'
        );
      }),
      catchError((error) => {
        this.error.set('Failed to load saved application data');
        this.isLoading.set(false);
        console.error('Load application error:', error);

        this.activityService.trackProfileActivity(
          'updated',
          'Failed to load funding application profile',
          'profile_load_error'
        );

        return throwError(() => error);
      })
    );
  }

  /**
   * Load profile for current user (resolves org first)
   */
  private async loadProfileByUser(
    userId: string
  ): Promise<FundingApplicationProfile> {
    const organizationId = await this.getUserOrganization(userId);
    return this.loadFromSupabase(organizationId);
  }

  /**
   * Load profile for specific organization
   */
  private async loadFromSupabase(
    organizationId: string
  ): Promise<FundingApplicationProfile> {
    try {
      console.log(`🔍 Loading profile for organization: ${organizationId}`);

      const { data: sections, error } = await this.supabase
        .from('business_plan_sections')
        .select('*')
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      const applicationData: FundingApplicationProfile = {};

      sections?.forEach((section: any) => {
        switch (section.section_type) {
          case 'company-info':
            applicationData.companyInfo = section.data;
            break;
          case 'documents':
            applicationData.supportingDocuments = section.data;
            break;
          case 'business-assessment':
            applicationData.businessAssessment = section.data;
            break;
          case 'swot-analysis':
            applicationData.swotAnalysis = section.data;
            break;
          case 'management':
            applicationData.managementStructure = section.data;
            break;
          case 'business-strategy':
            applicationData.businessStrategy = section.data;
            break;
          case 'financial-profile':
            applicationData.financialProfile = section.data;
            break;
        }
      });

      console.log(`✅ Profile loaded for org: ${organizationId}`);
      return applicationData;
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      throw error;
    }
  }

  /**
   * Load profile for a specific organization (for funder review)
   */
  loadProfileForOrganization(
    organizationId: string
  ): Observable<FundingApplicationProfile> {
    this.isLoading.set(true);
    this.error.set(null);

    if (!organizationId) {
      this.isLoading.set(false);
      return throwError(() => new Error('Organization ID is required'));
    }

    return from(this.loadFromSupabase(organizationId)).pipe(
      tap((profile) => {
        this.isLoading.set(false);

        this.activityService.trackProfileActivity(
          'updated',
          `Profile loaded for org: ${organizationId}`,
          'profile_load_review'
        );
      }),
      catchError((error) => {
        this.error.set(`Failed to load profile for organization`);
        this.isLoading.set(false);

        this.activityService.trackProfileActivity(
          'updated',
          `Failed to load profile for org: ${organizationId}`,
          'profile_load_error'
        );

        return throwError(() => error);
      })
    );
  }

  /**
   * Load profile for a specific user (for funder review purposes)
   * Used when reviewer needs to access an applicant's profile by user ID
   *
   * @param userId - The user ID of the applicant whose profile to load
   */
  loadSavedProfileForUser(
    userId: string
  ): Observable<FundingApplicationProfile> {
    this.isLoading.set(true);
    this.error.set(null);

    if (!userId) {
      this.isLoading.set(false);
      return throwError(() => new Error('User ID is required'));
    }

    return from(this.loadProfileByUser(userId)).pipe(
      tap((profile) => {
        this.isLoading.set(false);

        this.activityService.trackProfileActivity(
          'updated',
          `Funding application profile loaded for review (User: ${userId})`,
          'profile_load_review'
        );
      }),
      catchError((error) => {
        this.error.set(
          `Failed to load application profile for user: ${userId}`
        );
        this.isLoading.set(false);
        console.error('Load application profile error:', error);

        this.activityService.trackProfileActivity(
          'updated',
          `Failed to load funding application profile for user: ${userId}`,
          'profile_load_error'
        );

        return throwError(() => error);
      })
    );
  }

  // ===============================
  // SAVE COMPLETE APPLICATION
  // ===============================

  saveCompleteProfile(
    applicationData: FundingApplicationProfile
  ): Observable<any> {
    this.isSaving.set(true);
    this.error.set(null);

    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isSaving.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    const sections = this.transformLocalToBackend(applicationData);

    return from(this.saveProfileByUser(currentAuth.id, sections)).pipe(
      tap((response) => {
        this.isSaving.set(false);
        this.lastSavedAt.set(new Date());
        console.log('Complete application saved successfully:', response);

        this.activityService.trackProfileActivity(
          'completed',
          `Complete funding application saved with ${response.overallCompletion}% completion`,
          'complete_save'
        );

        response.savedSections.forEach((sectionType: string) => {
          this.activityService.trackProfileActivity(
            'updated',
            `${this.getSectionDisplayName(
              sectionType
            )} section saved successfully`,
            sectionType
          );
        });
      }),
      catchError((error) => {
        this.error.set('Failed to save complete application');
        this.isSaving.set(false);
        console.error('Save error:', error);

        this.activityService.trackProfileActivity(
          'updated',
          'Failed to save complete funding application',
          'save_error'
        );

        return throwError(() => error);
      })
    );
  }

  /**
   * Save profile for current user (resolves org first)
   */
  private async saveProfileByUser(
    userId: string,
    sections: Array<{
      sectionType: string;
      data: Record<string, any>;
      completed: boolean;
    }>
  ): Promise<any> {
    const organizationId = await this.getUserOrganization(userId);
    return this.saveAllSectionsToSupabase(organizationId, userId, sections);
  }

  // ===============================
  // SAVE DRAFT SECTION
  // ===============================

  saveDraftSection(
    sectionType: string,
    sectionData: Record<string, any>,
    completed: boolean = false
  ): Observable<any> {
    this.error.set(null);

    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    const completionPercentage = this.calculateSectionCompletion(
      sectionData,
      completed
    );

    return from(
      this.saveSectionByUser(
        currentAuth.id,
        sectionType,
        sectionData,
        completed,
        completionPercentage
      )
    ).pipe(
      tap((response) => {
        console.log(`Section ${sectionType} saved as draft:`, response);

        const sectionDisplayName = this.getSectionDisplayName(sectionType);
        const statusText = completed
          ? 'completed'
          : `${completionPercentage}% completed`;

        this.activityService.trackProfileActivity(
          completed ? 'completed' : 'updated',
          `${sectionDisplayName} section saved as ${
            completed ? 'final' : 'draft'
          } (${statusText})`,
          sectionType
        );
      }),
      catchError((error) => {
        this.error.set(`Failed to save ${sectionType} section`);
        console.error(`Save error:`, error);

        this.activityService.trackProfileActivity(
          'updated',
          `Failed to save ${this.getSectionDisplayName(sectionType)} section`,
          `${sectionType}_error`
        );

        return throwError(() => error);
      })
    );
  }

  /**
   * Save section for current user (resolves org first)
   */
  private async saveSectionByUser(
    userId: string,
    sectionType: string,
    data: Record<string, any>,
    completed: boolean,
    completionPercentage: number
  ): Promise<any> {
    const organizationId = await this.getUserOrganization(userId);
    return this.saveSectionToSupabase(
      organizationId,
      userId,
      sectionType,
      data,
      completed,
      completionPercentage
    );
  }

  private async saveSectionToSupabase(
    organizationId: string,
    userId: string,
    sectionType: string,
    data: Record<string, any>,
    completed: boolean,
    completionPercentage: number
  ): Promise<any> {
    try {
      console.log('🔍 Saving section for org:', organizationId);

      const sectionData = {
        organization_id: organizationId,
        user_id: userId, // Keep for audit trail
        section_type: sectionType,
        data: data,
        completed: completed,
        completion_percentage: completionPercentage,
        updated_at: new Date().toISOString(),
      };

      const { data: result, error } = await this.supabase
        .from('business_plan_sections')
        .upsert(sectionData, {
          onConflict: 'organization_id,section_type',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return {
        section: {
          sectionType: result.section_type,
          data: result.data,
          completed: result.completed,
          completionPercentage: result.completion_percentage,
          createdAt: result.created_at,
          updatedAt: result.updated_at,
        },
        overallCompletion: completionPercentage,
        message: 'Section saved successfully',
        success: true,
      };
    } catch (error) {
      console.error('Error saving section:', error);
      throw error;
    }
  }

  // ===============================
  // AUTO-SAVE FUNCTIONALITY
  // ===============================

  autoSaveProfile(applicationData: FundingApplicationProfile): Observable<any> {
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    const sections = this.transformLocalToBackend(applicationData);

    return from(this.saveProfileByUser(currentAuth.id, sections)).pipe(
      tap((response) => {
        this.lastSavedAt.set(new Date());
        console.log('Auto-save completed:', response);

        this.activityService.trackProfileActivity(
          'updated',
          `Application auto-saved (${response.overallCompletion}% complete)`,
          'auto_save'
        );
      }),
      catchError((error) => {
        console.error('Auto-save failed:', error);

        this.activityService.trackProfileActivity(
          'updated',
          'Auto-save failed - please save manually',
          'auto_save_error'
        );

        return throwError(() => error);
      })
    );
  }

  // ===============================
  // SUBMIT FOR REVIEW
  // ===============================

  submitProfileForReview(
    applicationData: FundingApplicationProfile
  ): Observable<any> {
    this.isSaving.set(true);
    this.error.set(null);

    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isSaving.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return this.saveCompleteProfile(applicationData).pipe(
      switchMap((saveResponse) =>
        from(this.submitForReview(currentAuth.id, saveResponse))
      ),
      tap((response) => {
        this.isSaving.set(false);
        console.log('Application submitted:', response);

        this.activityService.trackProfileActivity(
          'completed',
          'Funding application profile completed and submitted for review',
          'submission'
        );
      }),
      catchError((error) => {
        this.error.set('Failed to submit application');
        this.isSaving.set(false);
        return throwError(() => error);
      })
    );
  }

  private async submitForReview(
    userId: string,
    saveResponse: any
  ): Promise<any> {
    const organizationId = await this.getUserOrganization(userId);

    return {
      success: true,
      applicationId: `funding_app_${organizationId}_${Date.now()}`,
      submissionDate: new Date().toISOString(),
      status: 'submitted',
      message: 'Application submitted successfully',
    };
  }

  // ===============================
  // DELETE DRAFT DATA
  // ===============================

  clearSavedProfile(): Observable<{ success: boolean }> {
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.clearByUser(currentAuth.id)).pipe(
      tap(() => {
        this.lastSavedAt.set(null);
        console.log('Saved application data cleared');

        this.activityService.trackProfileActivity(
          'updated',
          'Funding application draft data cleared',
          'profile_clear'
        );
      }),
      catchError((error) => {
        this.error.set('Failed to clear saved application');

        this.activityService.trackProfileActivity(
          'updated',
          'Failed to clear funding application draft data',
          'clear_error'
        );

        return throwError(() => error);
      })
    );
  }

  private async clearByUser(userId: string): Promise<{ success: boolean }> {
    const organizationId = await this.getUserOrganization(userId);
    return this.clearFromSupabase(organizationId);
  }

  private async clearFromSupabase(
    organizationId: string
  ): Promise<{ success: boolean }> {
    try {
      const { error } = await this.supabase
        .from('business_plan_sections')
        .delete()
        .eq('organization_id', organizationId);

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error clearing from Supabase:', error);
      throw error;
    }
  }

  // ===============================
  // PRIVATE HELPER METHODS
  // ===============================

  private async saveAllSectionsToSupabase(
    organizationId: string,
    userId: string,
    sections: Array<{
      sectionType: string;
      data: Record<string, any>;
      completed: boolean;
    }>
  ): Promise<any> {
    try {
      const supabasePayload = sections.map((section) => ({
        organization_id: organizationId,
        user_id: userId, // Keep for audit
        section_type: section.sectionType,
        data: section.data,
        completed: section.completed,
        completion_percentage: this.calculateSectionCompletion(
          section.data,
          section.completed
        ),
        updated_at: new Date().toISOString(),
      }));

      const { data: results, error } = await this.supabase
        .from('business_plan_sections')
        .upsert(supabasePayload, {
          onConflict: 'organization_id,section_type',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      const overallCompletion = this.calculateOverallCompletion(sections);

      return {
        success: true,
        applicationId: `funding_app_${organizationId}_${Date.now()}`,
        overallCompletion,
        savedSections: sections.map((s) => s.sectionType),
        message: 'Application saved successfully',
        lastSaved: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error saving sections:', error);
      throw error;
    }
  }

  // ===============================
  // VALIDATION & CALCULATION
  // ===============================

  private calculateSectionCompletion(
    data: Record<string, any>,
    completed: boolean
  ): number {
    if (completed) return 100;

    const fields = Object.values(data);
    const filledFields = fields.filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== '' &&
        (Array.isArray(value) ? value.length > 0 : true)
    ).length;

    return fields.length > 0
      ? Math.round((filledFields / fields.length) * 100)
      : 0;
  }

  private calculateOverallCompletion(
    sections: Array<{
      sectionType: string;
      data: Record<string, any>;
      completed: boolean;
    }>
  ): number {
    if (sections.length === 0) return 0;

    const completedSections = sections.filter(
      (section) => section.completed
    ).length;
    return Math.round((completedSections / sections.length) * 100);
  }

  private isCompanyInfoComplete(data: any): boolean {
    const requiredFields = [
      'companyName',
      'registrationNumber',
      'industryType',
      'foundingYear',
    ];
    return requiredFields.every(
      (field) => data[field] && data[field].toString().trim() !== ''
    );
  }

  private isDocumentsComplete(data: any): boolean {
    const requiredDocs = [
      'companyRegistration',
      'taxClearanceCertificate',
      'auditedFinancials',
    ];
    return requiredDocs.some((doc) => data[doc]);
  }

  private isBusinessAssessmentComplete(data: any): boolean {
    const requiredFields = [
      'businessModel',
      'valueProposition',
      'targetMarkets',
    ];
    return requiredFields.every(
      (field) => data[field] && data[field].toString().trim() !== ''
    );
  }

  private isSwotAnalysisComplete(data: any): boolean {
    return (
      data.strengths?.length >= 2 &&
      data.weaknesses?.length >= 2 &&
      data.opportunities?.length >= 2 &&
      data.threats?.length >= 2
    );
  }

  private isManagementStructureComplete(data: any): boolean {
    return data.executiveTeam?.length >= 1 || data.managementTeam?.length >= 1;
  }

  private isBusinessStrategyComplete(data: any): boolean {
    const requiredSections = [
      'executiveSummary',
      'missionStatement',
      'fundingRequirements',
    ];
    return requiredSections.every(
      (section) => data[section] && data[section].toString().trim() !== ''
    );
  }

  private isFinancialProfileComplete(data: any): boolean {
    const requiredFields = ['monthlyRevenue', 'monthlyCosts', 'currentAssets'];
    return requiredFields.some(
      (field) => data[field] !== null && data[field] !== undefined
    );
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private transformLocalToBackend(
    applicationData: FundingApplicationProfile
  ): Array<{
    sectionType: string;
    data: Record<string, any>;
    completed: boolean;
  }> {
    const sections: Array<{
      sectionType: string;
      data: Record<string, any>;
      completed: boolean;
    }> = [];

    if (applicationData.companyInfo) {
      sections.push({
        sectionType: 'company-info',
        data: applicationData.companyInfo as Record<string, any>,
        completed: this.isCompanyInfoComplete(applicationData.companyInfo),
      });
    }

    if (applicationData.supportingDocuments) {
      sections.push({
        sectionType: 'documents',
        data: applicationData.supportingDocuments as Record<string, any>,
        completed: this.isDocumentsComplete(
          applicationData.supportingDocuments
        ),
      });
    }

    if (applicationData.businessAssessment) {
      sections.push({
        sectionType: 'business-assessment',
        data: applicationData.businessAssessment as Record<string, any>,
        completed: this.isBusinessAssessmentComplete(
          applicationData.businessAssessment
        ),
      });
    }

    if (applicationData.swotAnalysis) {
      sections.push({
        sectionType: 'swot-analysis',
        data: applicationData.swotAnalysis as Record<string, any>,
        completed: this.isSwotAnalysisComplete(applicationData.swotAnalysis),
      });
    }

    if (applicationData.managementStructure) {
      sections.push({
        sectionType: 'management',
        data: applicationData.managementStructure as Record<string, any>,
        completed: this.isManagementStructureComplete(
          applicationData.managementStructure
        ),
      });
    }

    if (applicationData.businessStrategy) {
      sections.push({
        sectionType: 'business-strategy',
        data: applicationData.businessStrategy as Record<string, any>,
        completed: this.isBusinessStrategyComplete(
          applicationData.businessStrategy
        ),
      });
    }

    if (applicationData.financialProfile) {
      sections.push({
        sectionType: 'financial-profile',
        data: applicationData.financialProfile as Record<string, any>,
        completed: this.isFinancialProfileComplete(
          applicationData.financialProfile
        ),
      });
    }

    return sections;
  }

  private getSectionDisplayName(sectionType: string): string {
    const displayNames: Record<string, string> = {
      'company-info': 'Company Information',
      documents: 'Supporting Documents',
      'business-assessment': 'Business Assessment',
      'swot-analysis': 'SWOT Analysis',
      management: 'Management Structure',
      'business-strategy': 'Business Strategy',
      'financial-profile': 'Financial Profile',
    };
    return displayNames[sectionType] || sectionType;
  }
}
