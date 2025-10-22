// src/app/funder/services/funding-opportunity.service.ts
import { Injectable, signal, inject } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
 
import { AuthService } from '../../auth/production.auth.service';
import { FundingOpportunity } from '../../shared/models/funder.models';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';

// Section-based data structures to match existing schema
interface OpportunitySection {
  id?: string;
  user_id: string;
  section_type: 'basic-info' | 'investment-terms' | 'eligibility-criteria' | 'application-process' | 'settings';
  data: Record<string, any>;
  completed: boolean;
  completion_percentage: number;
  organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Response interfaces
interface SaveSectionResponse {
  success: boolean;
  sectionType: string;
  message: string;
  lastSaved: string;
  sectionCompletion: number;
  overallCompletion: number;
}

interface SaveDraftResponse {
  success: boolean;
  savedSections: string[];
  message: string;
  lastSaved: string;
  overallCompletion: number;
}

interface PublishOpportunityResponse {
  success: boolean;
  opportunityId: string;
  publishedAt: string;
  message: string;
}

interface LoadDraftResponse {
  success: boolean;
  draftData: Partial<FundingOpportunity>;
  lastSaved?: string;
  completionPercentage: number;
  sectionsData: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class FundingOpportunityService {
  private supabaseService = inject(SharedSupabaseService) ;
  private authService = inject(AuthService);

  // State management
  isLoading = signal(false);
  isSaving = signal(false);
  isPublishing = signal(false);
  error = signal<string | null>(null);
  lastSavedAt = signal<string | null>(null);
  overallCompletion = signal(0);

  // Section-specific completion tracking
  sectionCompletions = signal<Record<string, number>>({
    'basic-info': 0,
    'investment-terms': 0,
    'eligibility-criteria': 0,
    'application-process': 0,
    'settings': 0
  });

  // Draft auto-save subject
  private draftDataSubject = new BehaviorSubject<Partial<FundingOpportunity>>({});
  public draftData$ = this.draftDataSubject.asObservable();

  constructor() {
  
  }

  // ===============================
  // SECTION-BASED DRAFT MANAGEMENT
  // ===============================

  /**
   * Save a specific section of the form
   */
  saveSection(
    sectionType: 'basic-info' | 'investment-terms' | 'eligibility-criteria' | 'application-process' | 'settings',
    sectionData: Record<string, any>,
    autoSave: boolean = false
  ): Observable<SaveSectionResponse> {
    this.isSaving.set(true);
    this.error.set(null);

    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isSaving.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.saveSectionToSupabase(currentAuth.id, sectionType, sectionData, autoSave)).pipe(
      tap(response => {
        this.isSaving.set(false);
        this.lastSavedAt.set(response.lastSaved);
        
        // Update section completion tracking
        this.sectionCompletions.update(completions => ({
          ...completions,
          [sectionType]: response.sectionCompletion
        }));
        this.overallCompletion.set(response.overallCompletion);
        
        if (!autoSave) {
          console.log(`Section ${sectionType} saved successfully`);
        }
      }),
      catchError(error => {
        this.error.set(`Failed to save ${sectionType} section`);
        this.isSaving.set(false);
        console.error(`Save section error (${sectionType}):`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Save entire form data (splits into sections automatically)
   */
  saveDraft(formData: Partial<FundingOpportunity>, autoSave: boolean = false): Observable<SaveDraftResponse> {
    this.isSaving.set(true);
    this.error.set(null);

    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isSaving.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.saveAllSectionsToSupabase(currentAuth.id, formData, autoSave)).pipe(
      tap(response => {
        this.isSaving.set(false);
        this.lastSavedAt.set(response.lastSaved);
        this.overallCompletion.set(response.overallCompletion);
        this.draftDataSubject.next(formData);
        
        if (!autoSave) {
          console.log('Draft saved successfully');
        }
      }),
      catchError(error => {
        this.error.set('Failed to save draft');
        this.isSaving.set(false);
        console.error('Save draft error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Load existing draft data
   */
  loadDraft(): Observable<LoadDraftResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.loadDraftFromSupabase(currentAuth.id)).pipe(
      tap(response => {
        this.isLoading.set(false);
        if (response.lastSaved) {
          this.lastSavedAt.set(response.lastSaved);
        }
        this.overallCompletion.set(response.completionPercentage);
        this.draftDataSubject.next(response.draftData);
        
        // Update section completions
        const completions: Record<string, number> = {
          'basic-info': 0,
          'investment-terms': 0,
          'eligibility-criteria': 0,
          'application-process': 0,
          'settings': 0
        };
        
        Object.keys(response.sectionsData).forEach(sectionType => {
          const section = response.sectionsData[sectionType];
          if (section) {
            completions[sectionType] = section.completion_percentage || 0;
          }
        });
        
        this.sectionCompletions.set(completions);
        console.log('Draft loaded successfully');
      }),
      catchError(error => {
        this.error.set('Failed to load draft');
        this.isLoading.set(false);
        console.error('Load draft error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete current draft (all sections)
   */
  deleteDraft(): Observable<{success: boolean}> {
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.deleteDraftFromSupabase(currentAuth.id)).pipe(
      tap(() => {
        this.lastSavedAt.set(null);
        this.overallCompletion.set(0);
        this.sectionCompletions.set({
          'basic-info': 0,
          'investment-terms': 0,
          'eligibility-criteria': 0,
          'application-process': 0,
          'settings': 0
        });
        this.draftDataSubject.next({});
        console.log('Draft deleted successfully');
      }),
      catchError(error => {
        console.error('Delete draft error:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // OPPORTUNITY MANAGEMENT
  // ===============================

  /**
   * Publish opportunity from draft or form data
   */

publishOpportunity(formData: Partial<FundingOpportunity>): Observable<PublishOpportunityResponse> {
  console.log('=== PUBLISH OPPORTUNITY SERVICE START ===');
  console.log('Input formData:', JSON.stringify(formData, null, 2));
  console.log('Current isPublishing state:', this.isPublishing());
  
  this.isPublishing.set(true);
  this.error.set(null);
  console.log('Set isPublishing to true, cleared error');

  const currentAuth = this.authService.user();
  console.log('Current auth user:', currentAuth ? { id: currentAuth.id, email: currentAuth.email } : 'null');
  
  if (!currentAuth) {
    console.error('❌ User not authenticated, aborting publish');
    this.isPublishing.set(false);
    return throwError(() => new Error('User not authenticated'));
  }

  console.log('🚀 Starting publishToSupabase with userId:', currentAuth.id);
  
  return from(this.publishToSupabase(currentAuth.id, formData)).pipe(
    tap(response => {
      console.log('✅ PublishToSupabase successful, response:', response);
      this.isPublishing.set(false);
      console.log('Set isPublishing to false');
      
      // Clear draft after successful publish - with error handling
      console.log('🧹 Starting draft cleanup...');
      this.deleteDraft().subscribe({
        next: () => {
          console.log('✅ Draft deleted successfully after publish');
        },
        error: (deleteError) => {
          console.warn('⚠️ Failed to delete draft after publish (non-critical):', deleteError);
        }
      });
      
      console.log('✅ Opportunity published successfully');
    }),
    catchError(error => {
      console.error('❌ Publish opportunity error caught in pipe:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      
      this.error.set('Failed to publish opportunity');
      this.isPublishing.set(false);
      console.log('Set isPublishing to false due to error');
      console.log('Set error message to: "Failed to publish opportunity"');
      
      return throwError(() => error);
    })
  );
}

  /**
   * Load published opportunities for user
   */
  loadOpportunities(): Observable<FundingOpportunity[]> {
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.loadOpportunitiesFromSupabase(currentAuth.id)).pipe(
      map(opportunities => opportunities.map(opp => this.transformDbToModel(opp))),
      catchError(error => {
        console.error('Load opportunities error:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // PRIVATE METHODS - SECTION OPERATIONS
  // ===============================

  private async saveSectionToSupabase(
    userId: string,
    sectionType: string,
    sectionData: Record<string, any>,
    autoSave: boolean
  ): Promise<SaveSectionResponse> {
    try {
      // Generate temporary organization ID until proper organization setup
      const organizationId = await this.getOrCreateTempOrganizationId(userId);
      
      const sectionCompletion = this.calculateSectionCompletion(sectionType, sectionData);
      
      const sectionRecord: Partial<OpportunitySection> = {
        user_id: userId,
        section_type: sectionType as any,
        data: sectionData,
        completed: sectionCompletion >= 100,
        completion_percentage: sectionCompletion,
        organization_id: organizationId
      };

      // Use upsert to handle existing sections
      const { data, error } = await this.supabaseService
        .from('opportunity_drafts')
        .upsert(
          sectionRecord,
          { 
            onConflict: 'user_id,section_type',
            ignoreDuplicates: false 
          }
        )
        .select()
        .single();

      if (error) throw error;

      // Calculate overall completion
      const overallCompletion = await this.calculateOverallCompletion(userId);

      return {
        success: true,
        sectionType,
        message: autoSave ? 'Auto-saved' : 'Section saved successfully',
        lastSaved: new Date().toISOString(),
        sectionCompletion,
        overallCompletion
      };

    } catch (error: any) {
      console.error(`Error saving section ${sectionType}:`, error);
      throw new Error(`Failed to save section: ${error.message}`);
    }
  }

  private async saveAllSectionsToSupabase(
    userId: string,
    formData: Partial<FundingOpportunity>,
    autoSave: boolean
  ): Promise<SaveDraftResponse> {
    try {
      const organizationId = await this.getOrCreateTempOrganizationId(userId);
      const sections = this.splitFormDataIntoSections(formData);
      const savedSections: string[] = [];

      // Save all sections
      for (const [sectionType, sectionData] of Object.entries(sections)) {
        const sectionCompletion = this.calculateSectionCompletion(sectionType, sectionData);
        
        const sectionRecord: Partial<OpportunitySection> = {
          user_id: userId,
          section_type: sectionType as any,
          data: sectionData,
          completed: sectionCompletion >= 100,
          completion_percentage: sectionCompletion,
          organization_id: organizationId
        };

        const { error } = await this.supabaseService
          .from('opportunity_drafts')
          .upsert(
            sectionRecord,
            { 
              onConflict: 'user_id,section_type',
              ignoreDuplicates: false 
            }
          );

        if (error) {
          console.error(`Error saving section ${sectionType}:`, error);
        } else {
          savedSections.push(sectionType);
        }
      }

      const overallCompletion = await this.calculateOverallCompletion(userId);

      return {
        success: true,
        savedSections,
        message: autoSave ? 'Auto-saved' : 'Draft saved successfully',
        lastSaved: new Date().toISOString(),
        overallCompletion
      };

    } catch (error: any) {
      console.error('Error saving draft sections:', error);
      throw new Error(`Failed to save draft: ${error.message}`);
    }
  }

  private async loadDraftFromSupabase(userId: string): Promise<LoadDraftResponse> {
    try {
      const { data: sections, error } = await this.supabaseService
        .from('opportunity_drafts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      if (!sections || sections.length === 0) {
        return {
          success: true,
          draftData: {},
          completionPercentage: 0,
          sectionsData: {}
        };
      }

      // Convert sections back to form data
      const draftData = this.mergeSectionsToFormData(sections);
      const sectionsData: Record<string, any> = {};
      let lastSaved: string | undefined;

      sections.forEach(section => {
        sectionsData[section.section_type] = section;
        if (!lastSaved || section.updated_at > lastSaved) {
          lastSaved = section.updated_at;
        }
      });

      const overallCompletion = await this.calculateOverallCompletion(userId);
      
      return {
        success: true,
        draftData,
        lastSaved,
        completionPercentage: overallCompletion,
        sectionsData
      };

    } catch (error: any) {
      console.error('Error loading draft from Supabase:', error);
      throw new Error(`Failed to load draft: ${error.message}`);
    }
  }

  private async deleteDraftFromSupabase(userId: string): Promise<{success: boolean}> {
    try {
      const { error } = await this.supabaseService
        .from('opportunity_drafts')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };

    } catch (error: any) {
      console.error('Error deleting draft from Supabase:', error);
      throw new Error(`Failed to delete draft: ${error.message}`);
    }
  }

  // ===============================
  // PRIVATE METHODS - PUBLISHING
  // ===============================

private async publishToSupabase(
  userId: string, 
  formData: Partial<FundingOpportunity>
): Promise<PublishOpportunityResponse> {
  try {
    console.log('=== PUBLISH TO SUPABASE START ===');
    console.log('userId:', userId);
    console.log('formData received:', JSON.stringify(formData, null, 2));

    // Validate required fields before attempting to publish
    console.log('🔍 Validating required fields...');
    
    if (!formData.title?.trim()) {
      console.error('❌ Validation failed: Title is missing');
      throw new Error('Title is required');
    }
    console.log('✅ Title valid:', formData.title);
    
    if (!formData.description?.trim()) {
      console.error('❌ Validation failed: Description is missing');
      throw new Error('Description is required');
    }
    console.log('✅ Description valid (length):', formData.description.length);
    
    if (!formData.fundingType) {
      console.error('❌ Validation failed: Funding type is missing');
      throw new Error('Funding type is required');
    }
    console.log('✅ Funding type valid:', formData.fundingType);
    
    if (!formData.offerAmount || formData.offerAmount <= 0) {
      console.error('❌ Validation failed: Invalid offer amount:', formData.offerAmount);
      throw new Error('Valid offer amount is required');
    }
    console.log('✅ Offer amount valid:', formData.offerAmount);
    
    if (!formData.totalAvailable || formData.totalAvailable <= 0) {
      console.error('❌ Validation failed: Invalid total available:', formData.totalAvailable);
      throw new Error('Valid total available amount is required');
    }
    console.log('✅ Total available valid:', formData.totalAvailable);

    // Ensure investment amounts are valid
    const minInvestment = formData.minInvestment || 0;
    const maxInvestment = formData.maxInvestment || 0;
    console.log('Investment amounts - Min:', minInvestment, 'Max:', maxInvestment);
    
    if (minInvestment > 0 && maxInvestment > 0 && maxInvestment < minInvestment) {
      console.error('❌ Validation failed: Max investment < Min investment');
      throw new Error('Maximum investment must be greater than or equal to minimum investment');
    }
    console.log('✅ Investment amounts valid');

    // Generate temporary organization ID
    console.log('🏢 Getting organization ID...');
    const organizationId = await this.getOrCreateTempOrganizationId(userId);
    console.log('✅ Organization ID obtained:', organizationId);
    
    const opportunityData = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      created_by: userId,
      title: formData.title,
      description: formData.description,
      short_description: formData.shortDescription,
      target_company_profile: formData.targetCompanyProfile,
      offer_amount: formData.offerAmount || 0,
      min_investment: formData.minInvestment || 0,
      max_investment: formData.maxInvestment || 0,
      currency: formData.currency || 'ZAR',
      funding_type: formData.fundingType,
      interest_rate: formData.interestRate,
      equity_offered: formData.equityOffered,
      repayment_terms: formData.repaymentTerms,
      security_required: formData.securityRequired,
      use_of_funds: formData.useOfFunds,
      investment_structure: formData.investmentStructure,
      expected_returns: formData.expectedReturns,
      investment_horizon: formData.investmentHorizon,
      exit_strategy: formData.exitStrategy,
      application_deadline: formData.applicationDeadline?.toISOString(),
      decision_timeframe: formData.decisionTimeframe || 30,
      application_process: formData.applicationProcess || {},
      eligibility_criteria: formData.eligibilityCriteria || {},
      status: 'active',
      total_available: formData.totalAvailable || 0,
      amount_committed: 0,
      amount_deployed: 0,
      max_applications: formData.maxApplications,
      current_applications: 0,
      view_count: 0,
      application_count: 0,
      auto_match: formData.autoMatch ?? true,
      match_criteria: formData.matchCriteria,
      deal_lead: userId,
      deal_team: [userId],
       funding_opportunity_image_url: formData.fundingOpportunityImageUrl,
      funding_opportunity_video_url: formData.fundingOpportunityVideoUrl,
      funder_organization_name: formData.funderOrganizationName,
      funder_organization_logo_url: formData.funderOrganizationLogoUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString()
    };

    console.log('📝 Prepared opportunity data for insert:', JSON.stringify(opportunityData, null, 2));
    console.log('🔍 Key validation checks:');
    console.log('  - min_investment:', opportunityData.min_investment);
    console.log('  - max_investment:', opportunityData.max_investment);
    console.log('  - offer_amount:', opportunityData.offer_amount);
    console.log('  - total_available:', opportunityData.total_available);
    console.log('  - Check constraint (max >= min):', opportunityData.max_investment >= opportunityData.min_investment);

    console.log('💾 Inserting into Supabase...');
    const { data, error } = await this.supabaseService
      .from('funding_opportunities')
      .insert(opportunityData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('✅ Supabase insert successful!');
    console.log('Inserted data:', data);

    const response = {
      success: true,
      opportunityId: data.id,
      publishedAt: data.published_at,
      message: 'Opportunity published successfully'
    };
    
    console.log('📤 Returning response:', response);
    console.log('=== PUBLISH TO SUPABASE END ===');
    
    return response;

  } catch (error: any) {
    console.error('=== PUBLISH TO SUPABASE ERROR ===');
    console.error('❌ Error publishing opportunity:', error);
    console.error('Error type:', typeof error);
    console.error('Error constructor:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.details) {
      console.error('Error details:', error.details);
    }
    if (error.hint) {
      console.error('Error hint:', error.hint);
    }
    
    throw new Error(`Failed to publish opportunity: ${error.message}`);
  }
}

  private async loadOpportunitiesFromSupabase(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabaseService
        .from('funding_opportunities')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];

    } catch (error: any) {
      console.error('Error loading opportunities:', error);
      throw new Error(`Failed to load opportunities: ${error.message}`);
    }
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

private async getOrCreateTempOrganizationId(userId: string): Promise<string> {
  try {
    // First, try to find an existing organization for this user
    const { data: existingOrg, error: findError } = await this.supabaseService
      .from('organization_users')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!findError && existingOrg) {
      console.log('Using existing organization:', existingOrg.id);
      return existingOrg.id;
    }

    // If no organization exists, create a temporary one
    console.log('Creating temporary organization for user:', userId);
    
    const tempOrgData = {
      id: crypto.randomUUID(),
      user_id: userId,
      name: 'Temporary Organization',
      organization_type: 'other',
      description: 'Temporary organization created for opportunity drafts',
      website: null,
      phone: null,
      address: null,
      city: null,
      country: 'South Africa',
      registration_number: null,
      tax_number: null,
      is_verified: false,
      verification_status: 'pending',
      verification_documents: {},
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: newOrg, error: createError } = await this.supabaseService
      .from('organization_users')
      .insert(tempOrgData)
      .select('id')
      .single();

    if (createError) {
      console.error('Failed to create temporary organization:', createError);
      throw new Error(`Failed to create organization: ${createError.message}`);
    }

    console.log('Created temporary organization:', newOrg.id);
    return newOrg.id;

  } catch (error: any) {
    console.error('Error getting/creating organization ID:', error);
    
    // Fallback: try to find any organization for this user (in case of race conditions)
    try {
      const { data: fallbackOrg } = await this.supabaseService
        .from('organization_users')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (fallbackOrg) {
        console.log('Using fallback organization:', fallbackOrg.id);
        return fallbackOrg.id;
      }
    } catch (fallbackError) {
      console.error('Fallback organization lookup failed:', fallbackError);
    }
    
    throw new Error('Unable to create or find organization for user. Please complete your organization setup first.');
  }
}

// Also add this helper method to check if user has a proper organization
async checkUserOrganization(userId: string): Promise<{
  hasOrganization: boolean;
  organizationId: string | null;
  isTemporary: boolean;
}> {
  try {
    const { data: org, error } = await this.supabaseService
      .from('organization_users')
      .select('id, name')
      .eq('user_id', userId)
      .single();

    if (error || !org) {
      return { hasOrganization: false, organizationId: null, isTemporary: false };
    }

    const isTemporary = org.name === 'Temporary Organization';
    
    return {
      hasOrganization: true,
      organizationId: org.id,
      isTemporary
    };

  } catch (error) {
    console.error('Error checking user organization:', error);
    return { hasOrganization: false, organizationId: null, isTemporary: false };
  }
}

  private splitFormDataIntoSections(formData: Partial<FundingOpportunity>): Record<string, any> {
    return {
      'basic-info': {
        title: formData.title,
        description: formData.description,
        shortDescription: formData.shortDescription,
        targetCompanyProfile: formData.targetCompanyProfile,
           fundingOpportunityImageUrl: formData.fundingOpportunityImageUrl,
      fundingOpportunityVideoUrl: formData.fundingOpportunityVideoUrl,
      funderOrganizationName: formData.funderOrganizationName,
      funderOrganizationLogoUrl: formData.funderOrganizationLogoUrl,
      },
      'investment-terms': {
        offerAmount: formData.offerAmount,
        minInvestment: formData.minInvestment,
        maxInvestment: formData.maxInvestment,
        currency: formData.currency,
        fundingType: formData.fundingType,
        interestRate: formData.interestRate,
        equityOffered: formData.equityOffered,
        repaymentTerms: formData.repaymentTerms,
        securityRequired: formData.securityRequired,
        useOfFunds: formData.useOfFunds,
        investmentStructure: formData.investmentStructure,
        expectedReturns: formData.expectedReturns,
        investmentHorizon: formData.investmentHorizon,
        exitStrategy: formData.exitStrategy,
        decisionTimeframe: formData.decisionTimeframe
      },
      'eligibility-criteria': {
        eligibilityCriteria: formData.eligibilityCriteria
      },
      'application-process': {
        applicationProcess: formData.applicationProcess,
        applicationDeadline: formData.applicationDeadline
      },
      'settings': {
        totalAvailable: formData.totalAvailable,
        maxApplications: formData.maxApplications,
        autoMatch: formData.autoMatch,
        matchCriteria: formData.matchCriteria
      }
    };
  }

  private mergeSectionsToFormData(sections: OpportunitySection[]): Partial<FundingOpportunity> {
    const formData: Partial<FundingOpportunity> = {};

    sections.forEach(section => {
      const data = section.data;
      
      switch (section.section_type) {
        case 'basic-info':
          Object.assign(formData, {
            title: data['title'],
            description: data['description'],
            shortDescription: data['shortDescription'],
            targetCompanyProfile: data['targetCompanyProfile'],
             fundingOpportunityImageUrl: data['fundingOpportunityImageUrl'],
          fundingOpportunityVideoUrl: data['fundingOpportunityVideoUrl'],
          funderOrganizationName: data['funderOrganizationName'],
          funderOrganizationLogoUrl: data['funderOrganizationLogoUrl'],
          });
          break;
          
        case 'investment-terms':
          Object.assign(formData, {
            offerAmount: data['offerAmount'],
            minInvestment: data['minInvestment'],
            maxInvestment: data['maxInvestment'],
            currency: data['currency'],
            fundingType: data['fundingType'],
            interestRate: data['interestRate'],
            equityOffered: data['equityOffered'],
            repaymentTerms: data['repaymentTerms'],
            securityRequired: data['securityRequired'],
            useOfFunds: data['useOfFunds'],
            investmentStructure: data['investmentStructure'],
            expectedReturns: data['expectedReturns'],
            investmentHorizon: data['investmentHorizon'],
            exitStrategy: data['exitStrategy'],
            decisionTimeframe: data['decisionTimeframe']
          });
          break;
          
        case 'eligibility-criteria':
          formData.eligibilityCriteria = data['eligibilityCriteria'];
          break;
          
        case 'application-process':
          Object.assign(formData, {
            applicationProcess: data['applicationProcess'],
            applicationDeadline: data['applicationDeadline'] ? new Date(data['applicationDeadline']) : undefined
          });
          break;
          
        case 'settings':
          Object.assign(formData, {
            totalAvailable: data['totalAvailable'],
            maxApplications: data['maxApplications'],
            autoMatch: data['autoMatch'],
            matchCriteria: data['matchCriteria']
          });
          break;
      }
    });

    return formData;
  }

  private calculateSectionCompletion(sectionType: string, sectionData: Record<string, any>): number {
    const requiredFields: Record<string, string[]> = {
      'basic-info': ['title', 'description', 'shortDescription'],
      'investment-terms': ['fundingType', 'offerAmount', 'currency', 'decisionTimeframe'],
      'eligibility-criteria': [], // Optional section
      'application-process': [], // Optional section
      'settings': ['totalAvailable']
    };

    const required = requiredFields[sectionType] || [];
    if (required.length === 0) return 100; // Optional sections are always "complete"

    const completedFields = required.filter(field => {
      const value = sectionData[field];
      return value !== undefined && value !== null && value !== '' && value !== 0;
    });

    return Math.round((completedFields.length / required.length) * 100);
  }

  private async calculateOverallCompletion(userId: string): Promise<number> {
    try {
      const { data: sections, error } = await this.supabaseService
        .from('opportunity_drafts')
        .select('section_type, completion_percentage')
        .eq('user_id', userId);

      if (error || !sections || sections.length === 0) {
        return 0;
      }

      const totalCompletion = sections.reduce((sum, section) => 
        sum + (section.completion_percentage || 0), 0
      );

      // Calculate average across all 5 possible sections
      return Math.round(totalCompletion / 5);

    } catch (error) {
      console.error('Error calculating overall completion:', error);
      return 0;
    }
  }

  private transformDbToModel(dbData: any): FundingOpportunity {
    return {
      id: dbData.id,
      fundId: dbData.fund_id,
      organizationId: dbData.organization_id,
      // createdBy: dbData.created_by, // TODO: Add this
      title: dbData.title,
      description: dbData.description,
      shortDescription: dbData.short_description,
      targetCompanyProfile: dbData.target_company_profile,
      offerAmount: dbData.offer_amount,
      minInvestment: dbData.min_investment,
      maxInvestment: dbData.max_investment,
      currency: dbData.currency,
      fundingType: dbData.funding_type,
      interestRate: dbData.interest_rate,
      equityOffered: dbData.equity_offered,
      repaymentTerms: dbData.repayment_terms,
      securityRequired: dbData.security_required,
      useOfFunds: dbData.use_of_funds,
      investmentStructure: dbData.investment_structure,
      expectedReturns: dbData.expected_returns,
      investmentHorizon: dbData.investment_horizon,
      exitStrategy: dbData.exit_strategy,
      applicationDeadline: dbData.application_deadline ? new Date(dbData.application_deadline) : undefined,
      decisionTimeframe: dbData.decision_timeframe,
      applicationProcess: dbData.application_process,
      eligibilityCriteria: dbData.eligibility_criteria,
      status: dbData.status,
      totalAvailable: dbData.total_available,
      amountCommitted: dbData.amount_committed,
      amountDeployed: dbData.amount_deployed,
      maxApplications: dbData.max_applications,
      currentApplications: dbData.current_applications,
      viewCount: dbData.view_count,
      applicationCount: dbData.application_count,
      conversionRate: dbData.conversion_rate,
      dealLead: dbData.deal_lead,
      dealTeam: dbData.deal_team,
      
      autoMatch: dbData.auto_match,
      matchCriteria: dbData.match_criteria,
      createdAt: new Date(dbData.created_at),
      updatedAt: new Date(dbData.updated_at),
      publishedAt: dbData.published_at ? new Date(dbData.published_at) : undefined,
      closedAt: dbData.closed_at ? new Date(dbData.closed_at) : undefined,

      // ADD NEW FIELDS HERE
    fundingOpportunityImageUrl: dbData.funding_opportunity_image_url,
    fundingOpportunityVideoUrl: dbData.funding_opportunity_video_url,
    funderOrganizationName: dbData.funder_organization_name,
    funderOrganizationLogoUrl: dbData.funder_organization_logo_url,

    };
  }

  // ===============================
  // PUBLIC GETTERS
  // ===============================

  getOverallCompletion(): number {
    return this.overallCompletion();
  }

  getSectionCompletion(sectionType: string): number {
    return this.sectionCompletions()[sectionType] || 0;
  }

  getLastSavedAt(): string | null {
    return this.lastSavedAt();
  }

  getCurrentError(): string | null {
    return this.error();
  }

  // ===============================
  // SECTION-SPECIFIC HELPERS
  // ===============================

  /**
   * Save only basic info section
   */
  saveBasicInfo(basicData: {
    title: string;
    description: string;
    shortDescription: string;
    targetCompanyProfile?: string;
  }): Observable<SaveSectionResponse> {
    return this.saveSection('basic-info', basicData);
  }

  /**
   * Save only investment terms section
   */
  saveInvestmentTerms(termsData: {
    offerAmount: number;
    minInvestment: number;
    maxInvestment: number;
    currency: string;
    fundingType: string;
    // ... other investment fields
  }): Observable<SaveSectionResponse> {
    return this.saveSection('investment-terms', termsData);
  }

  /**
   * Save only eligibility criteria section
   */
  saveEligibilityCriteria(criteriaData: {
    eligibilityCriteria: any;
  }): Observable<SaveSectionResponse> {
    return this.saveSection('eligibility-criteria', criteriaData);
  }

  /**
   * Save only application process section
   */
  saveApplicationProcess(processData: {
    applicationProcess: any;
    applicationDeadline?: Date;
  }): Observable<SaveSectionResponse> {
    return this.saveSection('application-process', processData);
  }

  /**
   * Save only settings section
   */
  saveSettings(settingsData: {
    totalAvailable: number;
    maxApplications?: number;
    autoMatch: boolean;
    matchCriteria?: any;
  }): Observable<SaveSectionResponse> {
    return this.saveSection('settings', settingsData);
  }

  //Drafts section
  // Add these methods to your FundingOpportunityService class

// ===============================
// EDIT PUBLISHED OPPORTUNITIES
// ===============================

/**
 * Load published opportunity for editing
 */
loadOpportunityForEdit(opportunityId: string): Observable<LoadDraftResponse> {
  this.isLoading.set(true);
  this.error.set(null);

  const currentAuth = this.authService.user();
  if (!currentAuth) {
    this.isLoading.set(false);
    return throwError(() => new Error('User not authenticated'));
  }

  return from(this.loadPublishedOpportunity(opportunityId, currentAuth.id)).pipe(
    tap(response => {
      this.isLoading.set(false);
      if (response.success && response.draftData) {
        this.draftDataSubject.next(response.draftData);
        this.overallCompletion.set(100); // Published opportunities are 100% complete
        
        // Set all sections as complete for editing
        this.sectionCompletions.set({
          'basic-info': 100,
          'investment-terms': 100,
          'eligibility-criteria': 100,
          'application-process': 100,
          'settings': 100
        });
      }
      console.log('Published opportunity loaded for editing');
    }),
    catchError(error => {
      this.error.set('Failed to load opportunity for editing');
      this.isLoading.set(false);
      console.error('Load opportunity for edit error:', error);
      return throwError(() => error);
    })
  );
}

/**
 * Update published opportunity
 */
updateOpportunity(opportunityId: string, formData: Partial<FundingOpportunity>): Observable<PublishOpportunityResponse> {
  this.isPublishing.set(true);
  this.error.set(null);

  const currentAuth = this.authService.user();
  if (!currentAuth) {
    this.isPublishing.set(false);
    return throwError(() => new Error('User not authenticated'));
  }

  return from(this.updatePublishedOpportunity(opportunityId, currentAuth.id, formData)).pipe(
    tap(response => {
      this.isPublishing.set(false);
      console.log('Opportunity updated successfully');
    }),
    catchError(error => {
      this.error.set('Failed to update opportunity');
      this.isPublishing.set(false);
      console.error('Update opportunity error:', error);
      return throwError(() => error);
    })
  );
}

// ===============================
// ENHANCED DRAFT LOADING WITH MERGE
// ===============================

/**
 * Load draft with local storage merge
 */
loadDraftWithMerge(): Observable<LoadDraftResponse> {
  this.isLoading.set(true);
  this.error.set(null);

  const currentAuth = this.authService.user();
  if (!currentAuth) {
    this.isLoading.set(false);
    return throwError(() => new Error('User not authenticated'));
  }

  return from(this.loadAndMergeDrafts(currentAuth.id)).pipe(
    tap(response => {
      this.isLoading.set(false);
      if (response.lastSaved) {
        this.lastSavedAt.set(response.lastSaved);
      }
      this.overallCompletion.set(response.completionPercentage);
      this.draftDataSubject.next(response.draftData);
      
      // Update section completions from merged data
    //  this.updateSectionCompletionsFromService();
      console.log('Draft loaded with merge successfully');
    }),
    catchError(error => {
      this.error.set('Failed to load draft');
      this.isLoading.set(false);
      console.error('Load draft with merge error:', error);
      return throwError(() => error);
    })
  );
}

/**
 * Clear all drafts (database + localStorage)
 */
clearAllDrafts(): Observable<{success: boolean}> {
  const currentAuth = this.authService.user();
  if (!currentAuth) {
    return throwError(() => new Error('User not authenticated'));
  }

  return from(this.clearAllDraftData(currentAuth.id)).pipe(
    tap(() => {
      this.lastSavedAt.set(null);
      this.overallCompletion.set(0);
      this.sectionCompletions.set({
        'basic-info': 0,
        'investment-terms': 0,
        'eligibility-criteria': 0,
        'application-process': 0,
        'settings': 0
      });
      this.draftDataSubject.next({});
      console.log('All drafts cleared successfully');
    }),
    catchError(error => {
      console.error('Clear drafts error:', error);
      return throwError(() => error);
    })
  );
}

// ===============================
// PRIVATE IMPLEMENTATION METHODS
// ===============================

private async loadPublishedOpportunity(opportunityId: string, userId: string): Promise<LoadDraftResponse> {
  try {
    const { data: opportunity, error } = await this.supabaseService
      .from('funding_opportunities')
      .select('*')
      .eq('id', opportunityId)
      .eq('created_by', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        throw new Error('Opportunity not found or access denied');
      }
      throw new Error(`Failed to load opportunity: ${error.message}`);
    }

    const opportunityData = this.transformDbToFormData(opportunity);
    
    return {
      success: true,
      draftData: opportunityData,
      lastSaved: opportunity.updated_at,
      completionPercentage: 100,
      sectionsData: {}
    };

  } catch (error: any) {
    console.error('Error loading published opportunity:', error);
    throw new Error(`Failed to load opportunity: ${error.message}`);
  }
}

private async updatePublishedOpportunity(
  opportunityId: string,
  userId: string,
  formData: Partial<FundingOpportunity>
): Promise<PublishOpportunityResponse> {
  try {
    const updateData = {
      title: formData.title,
      description: formData.description,
      short_description: formData.shortDescription,
      target_company_profile: formData.targetCompanyProfile,
      offer_amount: formData.offerAmount,
      min_investment: formData.minInvestment,
      max_investment: formData.maxInvestment,
      currency: formData.currency,
      funding_type: formData.fundingType,
      interest_rate: formData.interestRate,
      equity_offered: formData.equityOffered,
      repayment_terms: formData.repaymentTerms,
      security_required: formData.securityRequired,
      use_of_funds: formData.useOfFunds,
      investment_structure: formData.investmentStructure,
      expected_returns: formData.expectedReturns,
      investment_horizon: formData.investmentHorizon,
      exit_strategy: formData.exitStrategy,
      application_deadline: formData.applicationDeadline?.toISOString(),
      decision_timeframe: formData.decisionTimeframe,
      application_process: formData.applicationProcess,
      eligibility_criteria: formData.eligibilityCriteria,
      total_available: formData.totalAvailable,
      max_applications: formData.maxApplications,
      auto_match: formData.autoMatch,
      match_criteria: formData.matchCriteria,
       funding_opportunity_image_url: formData.fundingOpportunityImageUrl,
      funding_opportunity_video_url: formData.fundingOpportunityVideoUrl,
      funder_organization_name: formData.funderOrganizationName,
      funder_organization_logo_url: formData.funderOrganizationLogoUrl,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabaseService
      .from('funding_opportunities')
      .update(updateData)
      .eq('id', opportunityId)
      .eq('created_by', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update opportunity: ${error.message}`);
    }

    return {
      success: true,
      opportunityId: data.id,
      publishedAt: data.updated_at,
      message: 'Opportunity updated successfully'
    };

  } catch (error: any) {
    console.error('Error updating published opportunity:', error);
    throw new Error(`Failed to update opportunity: ${error.message}`);
  }
}

private async loadAndMergeDrafts(userId: string): Promise<LoadDraftResponse> {
  try {
    // Load from both sources
    const [dbDraft, localDraft] = await Promise.all([
      this.loadDraftFromSupabase(userId),
      this.loadFromLocalStorageAsync()
    ]);

    // Determine which draft to use
    let finalDraft: LoadDraftResponse;
    
    if (!dbDraft.draftData || Object.keys(dbDraft.draftData).length === 0) {
      // No database draft, use local
      finalDraft = localDraft || { success: true, draftData: {}, completionPercentage: 0, sectionsData: {} };
    } else if (!localDraft || Object.keys(localDraft.draftData).length === 0) {
      // No local draft, use database
      finalDraft = dbDraft;
    } else {
      // Both exist - database takes precedence (per our strategy)
      finalDraft = dbDraft;
      
      // Log the merge decision
      console.log('Draft conflict resolved: Using database draft over local storage');
      
      // Clear local storage since we're using database version
      this.clearLocalStorageSync();
    }

    return finalDraft;

  } catch (error: any) {
    console.error('Error loading and merging drafts:', error);
    throw new Error(`Failed to load drafts: ${error.message}`);
  }
}

private async loadFromLocalStorageAsync(): Promise<LoadDraftResponse | null> {
  try {
    const saved = localStorage.getItem('opportunity_draft');
    if (!saved) return null;

    const saveData = JSON.parse(saved);
    return {
      success: true,
      draftData: this.transformFormDataToOpportunity(saveData.formData),
      lastSaved: saveData.lastSaved,
      completionPercentage: this.calculateFormCompletion(saveData.formData),
      sectionsData: {}
    };
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

private clearLocalStorageSync() {
  try {
    localStorage.removeItem('opportunity_draft');
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

private async clearAllDraftData(userId: string): Promise<{success: boolean}> {
  try {
    // Clear database draft
    await this.deleteDraftFromSupabase(userId);
    
    // Clear local storage
    this.clearLocalStorageSync();

    return { success: true };
  } catch (error: any) {
    console.error('Error clearing all draft data:', error);
    throw new Error(`Failed to clear drafts: ${error.message}`);
  }
}

private transformDbToFormData(dbOpportunity: any): Partial<FundingOpportunity> {
  return {
    id: dbOpportunity.id,
    title: dbOpportunity.title,
    description: dbOpportunity.description,
    shortDescription: dbOpportunity.short_description,
    targetCompanyProfile: dbOpportunity.target_company_profile,
    offerAmount: dbOpportunity.offer_amount,
    minInvestment: dbOpportunity.min_investment,
    maxInvestment: dbOpportunity.max_investment,
    currency: dbOpportunity.currency,
    fundingType: dbOpportunity.funding_type,
    interestRate: dbOpportunity.interest_rate,
    equityOffered: dbOpportunity.equity_offered,
    repaymentTerms: dbOpportunity.repayment_terms,
    securityRequired: dbOpportunity.security_required,
    useOfFunds: dbOpportunity.use_of_funds,
    investmentStructure: dbOpportunity.investment_structure,
    expectedReturns: dbOpportunity.expected_returns,
    investmentHorizon: dbOpportunity.investment_horizon,
    exitStrategy: dbOpportunity.exit_strategy,
    applicationDeadline: dbOpportunity.application_deadline ? new Date(dbOpportunity.application_deadline) : undefined,
    decisionTimeframe: dbOpportunity.decision_timeframe,
    applicationProcess: dbOpportunity.application_process,
    eligibilityCriteria: dbOpportunity.eligibility_criteria,
    totalAvailable: dbOpportunity.total_available,
    maxApplications: dbOpportunity.max_applications,
    autoMatch: dbOpportunity.auto_match,
    matchCriteria: dbOpportunity.match_criteria,
    status: dbOpportunity.status,
     // ADD NEW FIELDS HERE
    fundingOpportunityImageUrl: dbOpportunity.funding_opportunity_image_url,
    fundingOpportunityVideoUrl: dbOpportunity.funding_opportunity_video_url,
    funderOrganizationName: dbOpportunity.funder_organization_name,
    funderOrganizationLogoUrl: dbOpportunity.funder_organization_logo_url
  };
}

private transformFormDataToOpportunity(formData: any): Partial<FundingOpportunity> {
  return {
    title: formData.title,
    description: formData.description,
    shortDescription: formData.shortDescription,
    offerAmount: Number(formData.offerAmount) || 0,
    minInvestment: Number(formData.minInvestment) || 0,
    maxInvestment: Number(formData.maxInvestment) || 0,
    currency: formData.currency,
    fundingType: formData.fundingType,
    interestRate: formData.interestRate ? Number(formData.interestRate) : undefined,
    equityOffered: formData.equityOffered ? Number(formData.equityOffered) : undefined,
    repaymentTerms: formData.repaymentTerms,
    securityRequired: formData.securityRequired,
    useOfFunds: formData.useOfFunds,
    investmentStructure: formData.investmentStructure,
    expectedReturns: formData.expectedReturns ? Number(formData.expectedReturns) : undefined,
    investmentHorizon: formData.investmentHorizon ? Number(formData.investmentHorizon) : undefined,
    exitStrategy: formData.exitStrategy,
    applicationDeadline: formData.applicationDeadline ? new Date(formData.applicationDeadline) : undefined,
    decisionTimeframe: Number(formData.decisionTimeframe) || 30,
    totalAvailable: Number(formData.totalAvailable) || 0,
    maxApplications: formData.maxApplications ? Number(formData.maxApplications) : undefined,
    autoMatch: formData.autoMatch,
    eligibilityCriteria: {
      industries: formData.targetIndustries || [],
      businessStages: formData.businessStages || [],
      minRevenue: formData.minRevenue ? Number(formData.minRevenue) : undefined,
      maxRevenue: formData.maxRevenue ? Number(formData.maxRevenue) : undefined,
      minYearsOperation: formData.minYearsOperation ? Number(formData.minYearsOperation) : undefined,
      geographicRestrictions: formData.geographicRestrictions || [],
      requiresCollateral: formData.requiresCollateral || false
    }
  };
}

private calculateFormCompletion(formData: any): number {
  const requiredFields = ['title', 'description', 'shortDescription', 'fundingType', 'offerAmount', 'totalAvailable', 'decisionTimeframe'];
  const completedFields = requiredFields.filter(field => 
    formData[field] !== undefined && formData[field] !== null && formData[field] !== ''
  );
  return Math.round((completedFields.length / requiredFields.length) * 100);
}

// ===============================
// PUBLIC GETTERS FOR DRAFT STATUS
// ===============================

/**
 * Check if user has any draft data
 */
hasDraft(): Observable<boolean> {
  const currentAuth = this.authService.user();
  if (!currentAuth) {
    return from([false]);
  }

  return from(this.checkForDraftData(currentAuth.id));
}

private async checkForDraftData(userId: string): Promise<boolean> {
  try {
    // Check database draft
    const { data: dbSections, error } = await this.supabaseService
      .from('opportunity_drafts')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (!error && dbSections && dbSections.length > 0) {
      return true;
    }

    // Check local storage
    const localDraft = localStorage.getItem('opportunity_draft');
    return !!localDraft;

  } catch (error) {
    console.error('Error checking for draft data:', error);
    return false;
  }
}

/**
 * Get draft summary for dashboard
 */
getDraftSummary(): Observable<{
  hasDraft: boolean;
  completionPercentage: number;
  lastSaved: string | null;
  title: string | null;
}> {
  const currentAuth = this.authService.user();
  if (!currentAuth) {
    return from([{ hasDraft: false, completionPercentage: 0, lastSaved: null, title: null }]);
  }

  return from(this.fetchDraftSummary(currentAuth.id));
}

private async fetchDraftSummary(userId: string): Promise<{
  hasDraft: boolean;
  completionPercentage: number;
  lastSaved: string | null;
  title: string | null;
}> {
  try {
    const draftResponse = await this.loadAndMergeDrafts(userId);
    
    if (!draftResponse.draftData || Object.keys(draftResponse.draftData).length === 0) {
      return { hasDraft: false, completionPercentage: 0, lastSaved: null, title: null };
    }

    return {
      hasDraft: true,
      completionPercentage: draftResponse.completionPercentage,
      lastSaved: draftResponse.lastSaved || null,
      title: draftResponse.draftData.title || null
    };

  } catch (error) {
    console.error('Error fetching draft summary:', error);
    return { hasDraft: false, completionPercentage: 0, lastSaved: null, title: null };
  }
}
}