// // src/app/funder/services/funder-opportunity-backend.service.ts
// import { Injectable, signal, inject } from '@angular/core';
// import { Observable, from, of, throwError } from 'rxjs';
// import { tap, catchError, switchMap } from 'rxjs/operators';
 
// import { AuthService } from '../../auth/production.auth.service';
// import { FundingOpportunity} from '../../shared/models/funder.models';
// import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';

// // Backend data structures to match Supabase schema
// interface OpportunitySection {
//   sectionType: string;
//   data: Record<string, any>;
//   completed: boolean;
// }

// interface SaveOpportunityResponse {
//   success: boolean;
//   opportunityId: string;
//   overallCompletion: number;
//   savedSections: string[];
//   message: string;
//   lastSaved: string;
// }

// interface PublishOpportunityResponse {
//   success: boolean;
//   opportunityId: string;
//   publishedAt: string;
//   status: string;
//   message: string;
// }

// interface LoadOpportunityResponse {
//   success: boolean;
//   opportunityData: Partial<FundingOpportunity>;
//   lastSaved?: string;
//   completionPercentage: number;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class FunderOpportunityBackendService {
//   private supabase = inject(SharedSupabaseService);
//   private authService = inject(AuthService);

//   // State management
//   isLoading = signal(false);
//   isSaving = signal(false);
//   isPublishing = signal(false);
//   error = signal<string | null>(null);
//   lastSavedAt = signal<string | null>(null);

//   constructor() {
   
//   }

//   // ===============================
//   // LOAD OPPORTUNITY DATA
//   // ===============================

//   loadOpportunityData(opportunityId?: string): Observable<LoadOpportunityResponse> {
//     this.isLoading.set(true);
//     this.error.set(null);
    
//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       this.isLoading.set(false);
//       return throwError(() => new Error('User not authenticated'));
//     }

//     return from(this.loadFromSupabase(currentAuth.id, opportunityId)).pipe(
//       tap(response => {
//         this.isLoading.set(false);
//         if (response.lastSaved) {
//           this.lastSavedAt.set(response.lastSaved);
//         }
//         console.log('Opportunity data loaded successfully');
//       }),
//       catchError(error => {
//         this.error.set('Failed to load opportunity data');
//         this.isLoading.set(false);
//         console.error('Load opportunity error:', error);
//         return throwError(() => error);
//       })
//     );
//   }

//   private async loadFromSupabase(userId: string, opportunityId?: string): Promise<LoadOpportunityResponse> {
//     try {
//       if (opportunityId) {
//         // Load specific opportunity
//         const { data: opportunity, error } = await this.supabase
//           .from('funding_opportunities')
//           .select('*')
//           .eq('id', opportunityId)
//           .eq('created_by', userId)
//           .single();

//         if (error) {
//           throw new Error(`Failed to load opportunity: ${error.message}`);
//         }

//         const opportunityData = this.transformBackendToLocal(opportunity);
        
//         return {
//           success: true,
//           opportunityData,
//           lastSaved: opportunity.updated_at,
//           completionPercentage: this.calculateOpportunityCompletion(opportunityData)
//         };
//       } else {
//         // Load draft sections for new opportunity
//         const { data: sections, error } = await this.supabase
//           .from('opportunity_drafts')
//           .select('*')
//           .eq('user_id', userId)
//           .order('updated_at', { ascending: false });

//         if (error) {
//           throw new Error(`Supabase error: ${error.message}`);
//         }

//         const opportunityData: Partial<FundingOpportunity> = {};

//         sections?.forEach(section => {
//           switch(section.section_type) {
//             case 'basic-info':
//               Object.assign(opportunityData, section.data);
//               break;
//             case 'investment-terms':
//               Object.assign(opportunityData, section.data);
//               break;
//             case 'eligibility-criteria':
//               opportunityData.eligibilityCriteria = section.data;
//               break;
//             case 'application-process':
//               opportunityData.applicationProcess = section.data;
//               break;
//             case 'settings':
//               Object.assign(opportunityData, section.data);
//               break;
//           }
//         });

//         return {
//           success: true,
//           opportunityData,
//           lastSaved: sections?.[0]?.updated_at,
//           completionPercentage: this.calculateOpportunityCompletion(opportunityData)
//         };
//       }
//     } catch (error) {
//       console.error('Error loading from Supabase:', error);
//       throw error;
//     }
//   }

//   // ===============================
//   // SAVE OPPORTUNITY (DRAFT)
//   // ===============================

//   saveOpportunityDraft(opportunityData: Partial<FundingOpportunity>, isAutoSave: boolean = false): Observable<SaveOpportunityResponse> {
//     this.isSaving.set(true);
//     this.error.set(null);
    
//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       this.isSaving.set(false);
//       return throwError(() => new Error('User not authenticated'));
//     }

//     const sections = this.transformLocalToBackend(opportunityData);
    
//     return from(this.saveAllSectionsToSupabase(currentAuth.id, sections, isAutoSave)).pipe(
//       tap(response => {
//         this.isSaving.set(false);
//         this.lastSavedAt.set(response.lastSaved);
//         console.log('Opportunity draft saved successfully');
//       }),
//       catchError(error => {
//         this.isSaving.set(false);
//         this.error.set('Failed to save opportunity draft');
//         console.error('Save opportunity error:', error);
//         return throwError(() => error);
//       })
//     );
//   }

//   // ===============================
//   // PUBLISH OPPORTUNITY
//   // ===============================
// // Option 4: Most robust - using utility function
// private async validateUserCanPublish(userId: string): Promise<boolean> {
//   try {
//     // Check organization exists and is complete
//     const organizationId = await this.getOrganizationId(userId);
    
//     // Check organization has required fields completed
//     const { data: org, error } = await this.supabase
//       .from('organizations')
//       .select('name, description, organization_type, email, phone, city, province, country')
//       .eq('id', organizationId)
//       .single();

//     if (error) {
//       throw new Error('Failed to validate organization details');
//     }

//     if (!org) {
//       throw new Error('Organization data not found');
//     }

//     // Validate completeness
//     const validationResult = this.validateOrganizationCompleteness(org);
    
//     if (!validationResult.isComplete) {
//       throw new Error(`Please complete your organization profile. Missing: ${validationResult.missingFields.join(', ')}`);
//     }

//     return true;
//   } catch (error) {
//     console.error('Organization validation failed:', error);
//     throw error;
//   }
// }

// // Utility method for organization validation
// private validateOrganizationCompleteness(org: any): {isComplete: boolean, missingFields: string[]} {
//   const requiredFields = [
//     { key: 'name', label: 'Organization Name' },
//     { key: 'description', label: 'Description' },
//     { key: 'organization_type', label: 'Organization Type' },
//     { key: 'email', label: 'Email' },
//     { key: 'phone', label: 'Phone' },
//     { key: 'city', label: 'City' },
//     { key: 'province', label: 'Province' },
//     { key: 'country', label: 'Country' }
//   ];

//   const missingFields: string[] = [];

//   requiredFields.forEach(field => {
//     const value = org[field.key];
//     if (!value || (typeof value === 'string' && !value.trim())) {
//       missingFields.push(field.label);
//     }
//   });

//   return {
//     isComplete: missingFields.length === 0,
//     missingFields
//   };
// }

// // 2. Enhanced publish method with organization validation
// publishOpportunity(opportunityData: Partial<FundingOpportunity>): Observable<PublishOpportunityResponse> {
//   this.isPublishing.set(true);
//   this.error.set(null);
  
//   const currentAuth = this.authService.user();
//   if (!currentAuth) {
//     this.isPublishing.set(false);
//     return throwError(() => new Error('User not authenticated'));
//   }

//   // Pre-validate organization exists before attempting to publish
//   return from(this.validateUserCanPublish(currentAuth.id)).pipe(
//     switchMap(() => this.publishToSupabase(currentAuth.id, opportunityData)),
//     tap(response => {
//       this.isPublishing.set(false);
//       console.log('Opportunity published successfully');
//       // Clear draft sections after successful publish
//       this.clearDraftSections(currentAuth.id);
//     }),
//     catchError(error => {
//       this.isPublishing.set(false);
//       this.error.set('Failed to publish opportunity');
//       console.error('Publish opportunity error:', error);
//       return throwError(() => error);
//     })
//   );
// }

  

//   // ===============================
//   // UPDATE EXISTING OPPORTUNITY
//   // ===============================

//   updateOpportunity(opportunityId: string, updates: Partial<FundingOpportunity>): Observable<SaveOpportunityResponse> {
//     this.isSaving.set(true);
//     this.error.set(null);
    
//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       this.isSaving.set(false);
//       return throwError(() => new Error('User not authenticated'));
//     }

//     return from(this.updateInSupabase(opportunityId, updates, currentAuth.id)).pipe(
//       tap(response => {
//         this.isSaving.set(false);
//         this.lastSavedAt.set(response.lastSaved);
//         console.log('Opportunity updated successfully');
//       }),
//       catchError(error => {
//         this.isSaving.set(false);
//         this.error.set('Failed to update opportunity');
//         console.error('Update opportunity error:', error);
//         return throwError(() => error);
//       })
//     );
//   }

//   private async updateInSupabase(opportunityId: string, updates: Partial<FundingOpportunity>, userId: string): Promise<SaveOpportunityResponse> {
//     try {
//       const updateData = this.buildOpportunityForDatabase(userId, updates, false);
      
//       const { data, error } = await this.supabase
//         .from('funding_opportunities')
//         .update({
//           ...updateData,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', opportunityId)
//         .eq('created_by', userId)
//         .select()
//         .single();

//       if (error) {
//         throw new Error(`Failed to update opportunity: ${error.message}`);
//       }

//       return {
//         success: true,
//         opportunityId: data.id,
//         overallCompletion: 100,
//         savedSections: ['all'],
//         message: 'Opportunity updated successfully',
//         lastSaved: data.updated_at
//       };
//     } catch (error) {
//       console.error('Error updating in Supabase:', error);
//       throw error;
//     }
//   }

//   // ===============================
//   // DELETE/CLEAR OPERATIONS
//   // ===============================

//   clearDraftData(): Observable<{success: boolean}> {
//     this.error.set(null);
    
//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     return from(this.clearDraftSections(currentAuth.id)).pipe(
//       tap(() => {
//         this.lastSavedAt.set(null);
//         console.log('Draft data cleared');
//       }),
//       catchError(error => {
//         this.error.set('Failed to clear draft data');
//         return throwError(() => error);
//       })
//     );
//   }

//   private async clearDraftSections(userId: string): Promise<{success: boolean}> {
//     try {
//       const { error } = await this.supabase
//         .from('opportunity_drafts')
//         .delete()
//         .eq('user_id', userId);

//       if (error) {
//         throw new Error(`Supabase error: ${error.message}`);
//       }

//       return { success: true };
//     } catch (error) {
//       console.error('Error clearing draft sections:', error);
//       throw error;
//     }
//   }

//   // ===============================
//   // DATA TRANSFORMATION METHODS
//   // ===============================

//   private transformLocalToBackend(opportunityData: Partial<FundingOpportunity>): OpportunitySection[] {
//     const sections: OpportunitySection[] = [];

//     // Basic information section
//     const basicInfo = {
//       title: opportunityData.title,
//       description: opportunityData.description,
//       shortDescription: opportunityData.shortDescription,
//       targetCompanyProfile: opportunityData.targetCompanyProfile
//     };
    
//     if (Object.values(basicInfo).some(val => val)) {
//       sections.push({
//         sectionType: 'basic-info',
//         data: basicInfo,
//         completed: this.isBasicInfoComplete(basicInfo)
//       });
//     }

//     // Investment terms section
//     const investmentTerms = {
//       offerAmount: opportunityData.offerAmount,
//       minInvestment: opportunityData.minInvestment,
//       maxInvestment: opportunityData.maxInvestment,
//       currency: opportunityData.currency,
//       fundingType: opportunityData.fundingType,
//       interestRate: opportunityData.interestRate,
//       equityOffered: opportunityData.equityOffered,
//       repaymentTerms: opportunityData.repaymentTerms,
//       securityRequired: opportunityData.securityRequired,
//       useOfFunds: opportunityData.useOfFunds,
//       investmentStructure: opportunityData.investmentStructure,
//       expectedReturns: opportunityData.expectedReturns,
//       investmentHorizon: opportunityData.investmentHorizon,
//       exitStrategy: opportunityData.exitStrategy,
//       decisionTimeframe: opportunityData.decisionTimeframe
//     };
    
//     if (Object.values(investmentTerms).some(val => val !== undefined)) {
//       sections.push({
//         sectionType: 'investment-terms',
//         data: investmentTerms,
//         completed: this.isInvestmentTermsComplete(investmentTerms)
//       });
//     }

//     // Eligibility criteria section
//     if (opportunityData.eligibilityCriteria) {
//       sections.push({
//         sectionType: 'eligibility-criteria',
//         data: opportunityData.eligibilityCriteria,
//         completed: this.isEligibilityCriteriaComplete(opportunityData.eligibilityCriteria)
//       });
//     }

//     // Application process section
//     if (opportunityData.applicationProcess) {
//       sections.push({
//         sectionType: 'application-process',
//         data: opportunityData.applicationProcess,
//         completed: this.isApplicationProcessComplete(opportunityData.applicationProcess)
//       });
//     }

//     // Settings section
//     const settings = {
//       totalAvailable: opportunityData.totalAvailable,
//       maxApplications: opportunityData.maxApplications,
//       autoMatch: opportunityData.autoMatch,
//       matchCriteria: opportunityData.matchCriteria,
//       applicationDeadline: opportunityData.applicationDeadline
//     };
    
//     if (Object.values(settings).some(val => val !== undefined)) {
//       sections.push({
//         sectionType: 'settings',
//         data: settings,
//         completed: this.isSettingsComplete(settings)
//       });
//     }

//     return sections;
//   }

//   private transformBackendToLocal(dbOpportunity: any): Partial<FundingOpportunity> {
//     return {
//       id: dbOpportunity.id,
//       fundId: dbOpportunity.fund_id,
//       organizationId: dbOpportunity.organization_id,
//       title: dbOpportunity.title,
//       description: dbOpportunity.description,
//       shortDescription: dbOpportunity.short_description,
//       offerAmount: dbOpportunity.offer_amount,
//       minInvestment: dbOpportunity.min_investment,
//       maxInvestment: dbOpportunity.max_investment,
//       currency: dbOpportunity.currency,
//       fundingType: dbOpportunity.funding_type,
//       interestRate: dbOpportunity.interest_rate,
//       equityOffered: dbOpportunity.equity_offered,
//       repaymentTerms: dbOpportunity.repayment_terms,
//       securityRequired: dbOpportunity.security_required,
//       useOfFunds: dbOpportunity.use_of_funds,
//       investmentStructure: dbOpportunity.investment_structure,
//       expectedReturns: dbOpportunity.expected_returns,
//       investmentHorizon: dbOpportunity.investment_horizon,
//       exitStrategy: dbOpportunity.exit_strategy,
//       applicationDeadline: dbOpportunity.application_deadline ? new Date(dbOpportunity.application_deadline) : undefined,
//       decisionTimeframe: dbOpportunity.decision_timeframe,
//       eligibilityCriteria: dbOpportunity.eligibility_criteria,
//       targetCompanyProfile: dbOpportunity.target_company_profile,
//       status: dbOpportunity.status,
//       totalAvailable: dbOpportunity.total_available,
//       amountCommitted: dbOpportunity.amount_committed,
//       amountDeployed: dbOpportunity.amount_deployed,
//       maxApplications: dbOpportunity.max_applications,
//       currentApplications: dbOpportunity.current_applications,
//       viewCount: dbOpportunity.view_count,
//       applicationCount: dbOpportunity.application_count,
//       conversionRate: dbOpportunity.conversion_rate,
//       dealLead: dbOpportunity.deal_lead,
//       dealTeam: dbOpportunity.deal_team,
//       autoMatch: dbOpportunity.auto_match,
//       matchCriteria: dbOpportunity.match_criteria,
//       applicationProcess: dbOpportunity.application_process,
//       createdAt: new Date(dbOpportunity.created_at),
//       updatedAt: new Date(dbOpportunity.updated_at),
//       publishedAt: dbOpportunity.published_at ? new Date(dbOpportunity.published_at) : undefined
//     };
//   }


//   // ===============================
//   // HELPER METHODS
//   // ===============================

//   private async saveAllSectionsToSupabase(
//     userId: string, 
//     sections: OpportunitySection[], 
//     isAutoSave: boolean = false
//   ): Promise<SaveOpportunityResponse> {
//     try {
//       const supabasePayload = sections.map(section => ({
//         user_id: userId,
//         section_type: section.sectionType,
//         data: section.data,
//         completed: section.completed,
//         completion_percentage: this.calculateSectionCompletion(section.data, section.completed),
//         updated_at: new Date().toISOString()
//       }));

//       const { data: results, error } = await this.supabase
//         .from('opportunity_drafts')
//         .upsert(supabasePayload, {
//           onConflict: 'user_id,section_type',
//           ignoreDuplicates: false
//         })
//         .select();

//       if (error) {
//         throw new Error(`Supabase error: ${error.message}`);
//       }

//       const overallCompletion = this.calculateOverallCompletion(sections);
//       const opportunityId = `opp_draft_${userId}_${Date.now()}`;
      
//       return {
//         success: true,
//         opportunityId,
//         overallCompletion,
//         savedSections: sections.map(s => s.sectionType),
//         message: isAutoSave ? 'Draft auto-saved successfully' : 'Draft saved successfully',
//         lastSaved: new Date().toISOString()
//       };
//     } catch (error) {
//       console.error('Error saving sections to Supabase:', error);
//       throw error;
//     }
//   }

//   // Completion validation methods
//   private isBasicInfoComplete(data: any): boolean {
//     return !!(data.title && data.description && data.shortDescription);
//   }

//   private isInvestmentTermsComplete(data: any): boolean {
//     return !!(data.fundingType && data.offerAmount && data.currency && data.decisionTimeframe);
//   }

//   private isEligibilityCriteriaComplete(data: any): boolean {
//     return !!(data.industries?.length > 0 && data.businessStages?.length > 0);
//   }

//   private isApplicationProcessComplete(data: any): boolean {
//     return !!(data?.length > 0);
//   }

//   private isSettingsComplete(data: any): boolean {
//     return data.totalAvailable !== undefined;
//   }

//   private calculateSectionCompletion(data: any, completed: boolean): number {
//     if (completed) return 100;
    
//     const fields = Object.values(data).filter(val => val !== undefined && val !== null && val !== '');
//     const totalFields = Object.keys(data).length;
    
//     return totalFields > 0 ? Math.round((fields.length / totalFields) * 100) : 0;
//   }

//   private calculateOverallCompletion(sections: OpportunitySection[]): number {
//     if (sections.length === 0) return 0;
    
//     const completionSum = sections.reduce((sum, section) => 
//       sum + this.calculateSectionCompletion(section.data, section.completed), 0
//     );
    
//     return Math.round(completionSum / sections.length);
//   }

//   private calculateOpportunityCompletion(opportunityData: Partial<FundingOpportunity>): number {
//     const sections = this.transformLocalToBackend(opportunityData);
//     return this.calculateOverallCompletion(sections);
//   }

// private async getOrganizationId(userId: string): Promise<string> {
//   try {
//     const { data: organization, error } = await this.supabase
//       .from('organization_users')
//       .select('id, status, is_verified')
//       .eq('user_id', userId)
//       .single();

//     if (error) {
//       if (error.code === 'PGRST116') { // No rows returned
//         throw new Error('No organization found. Please complete your organization setup first.');
//       }
//       throw new Error(`Database error: ${error.message}`);
//     }

//     if (!organization) {
//       throw new Error('Organization not found. Please complete your organization setup first.');
//     }

//     // Optional: Check if organization is active
//     if (organization.status !== 'active') {
//       throw new Error('Your organization is not active. Please contact support.');
//     }

//     return organization.id;
//   } catch (error) {
//     console.error('Error fetching organization:', error);
//     throw error;
//   }
// }


// // 4. Enhanced buildOpportunityForDatabase with better ID generation
// private async buildOpportunityForDatabase(
//   userId: string, 
//   opportunityData: Partial<FundingOpportunity>, 
//   includeMetadata: boolean = true
// ): Promise<any> {
//   // Get and validate organization ID
//   const organizationId = await this.getOrganizationId(userId);
  
//   const baseData = {
//     title: opportunityData.title,
//     description: opportunityData.description,
//     short_description: opportunityData.shortDescription,
//     offer_amount: opportunityData.offerAmount,
//     min_investment: opportunityData.minInvestment,
//     max_investment: opportunityData.maxInvestment,
//     currency: opportunityData.currency,
//     funding_type: opportunityData.fundingType,
//     interest_rate: opportunityData.interestRate,
//     equity_offered: opportunityData.equityOffered,
//     repayment_terms: opportunityData.repaymentTerms,
//     security_required: opportunityData.securityRequired,
//     use_of_funds: opportunityData.useOfFunds,
//     investment_structure: opportunityData.investmentStructure,
//     expected_returns: opportunityData.expectedReturns,
//     investment_horizon: opportunityData.investmentHorizon,
//     exit_strategy: opportunityData.exitStrategy,
//     application_deadline: opportunityData.applicationDeadline?.toISOString(),
//     decision_timeframe: opportunityData.decisionTimeframe,
//     eligibility_criteria: opportunityData.eligibilityCriteria,
//     target_company_profile: opportunityData.targetCompanyProfile,
//     total_available: opportunityData.totalAvailable,
//     max_applications: opportunityData.maxApplications,
//     auto_match: opportunityData.autoMatch,
//     match_criteria: opportunityData.matchCriteria,
//     application_process: opportunityData.applicationProcess,
//     updated_at: new Date().toISOString()
//   };

//   if (includeMetadata) {
//     // Generate better unique ID
//     const timestamp = Date.now();
//     const randomSuffix = Math.random().toString(36).substring(2, 8);
    
//     return {
//       ...baseData,
//       id: opportunityData.id || `opp_${timestamp}_${randomSuffix}`,
//       fund_id: null, // Will be set when funds are implemented
//       organization_id: organizationId, // Link to organization
//       created_by: userId,
//       status: 'active',
//       amount_committed: 0,
//       amount_deployed: 0,
//       current_applications: 0,
//       view_count: 0,
//       application_count: 0,
//       conversion_rate: 0,
//       deal_lead: userId,
//       deal_team: [userId],
//       created_at: new Date().toISOString(),
//       published_at: new Date().toISOString()
//     };
//   }

//   return baseData;
// }

// // 5. Add method to check if user can create opportunities
// canCreateOpportunities(): Observable<{canCreate: boolean, reason?: string}> {
//   const currentAuth = this.authService.user();
//   if (!currentAuth) {
//     return of({canCreate: false, reason: 'User not authenticated'});
//   }

//   return from(this.checkCreatePermission(currentAuth.id)).pipe(
//     catchError(error => {
//       return of({canCreate: false, reason: error.message});
//     })
//   );
// }

// private async checkCreatePermission(userId: string): Promise<{canCreate: boolean, reason?: string}> {
//   try {
//     await this.validateUserCanPublish(userId);
//     return {canCreate: true};
//   } catch (error: any) {
//     return {canCreate: false, reason: error.message};
//   }
// }

// // 6. Enhanced error handling for publishToSupabase
// private async publishToSupabase(userId: string, opportunityData: Partial<FundingOpportunity>): Promise<PublishOpportunityResponse> {
//   try {
//     const publishedOpportunity = await this.buildOpportunityForDatabase(userId, opportunityData);
    
//     const { data, error } = await this.supabase
//       .from('funding_opportunities')
//       .insert(publishedOpportunity)
//       .select()
//       .single();

//     if (error) {
//       // Handle specific database errors
//       if (error.code === '23503') { // Foreign key violation
//         throw new Error('Organization not found. Please complete your organization setup first.');
//       } else if (error.code === '23505') { // Unique constraint violation
//         throw new Error('An opportunity with this information already exists.');
//       } else {
//         throw new Error(`Failed to publish opportunity: ${error.message}`);
//       }
//     }

//     if (!data) {
//       throw new Error('Failed to create opportunity - no data returned');
//     }

//     return {
//       success: true,
//       opportunityId: data.id,
//       publishedAt: data.published_at,
//       status: data.status,
//       message: 'Opportunity published successfully and is now visible to SMEs'
//     };
//   } catch (error) {
//     console.error('Error publishing to Supabase:', error);
//     throw error;
//   }
// }
// }
 