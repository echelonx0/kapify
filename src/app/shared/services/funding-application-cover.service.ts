import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject, Subject } from 'rxjs';
import { tap, catchError, takeUntil, map } from 'rxjs/operators';
import { SharedSupabaseService } from './shared-supabase.service';
import { AuthService } from '../../auth/services/production.auth.service';
import { SupabaseDocumentService } from './supabase-document.service';
import { ActivityService } from './activity.service';
import {
  FundingApplicationCoverInformation,
  UpdateCoverRequest,
  CreateCoverRequest,
  CoverOperationResult,
  CoverListResult,
  CoverQueryOptions,
  ValidationResult,
  CompletionStatus,
} from '../models/funding-application-cover.model';
import { DemographicsService } from './demographics.service';

/**
 * FundingApplicationCoverService
 *
 * Central hub for cover management.
 * - Covers are templates/snapshots, NOT locked to opportunities
 * - Users can snapshot a cover into any opportunity at creation time
 * - Full CRUD + validation + document attachment
 * - Activity tracking for all operations
 * - Proper error handling & RLS compliance
 */
@Injectable({
  providedIn: 'root',
})
export class FundingApplicationCoverService implements OnDestroy {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  private documentService = inject(SupabaseDocumentService);
  private activityService = inject(ActivityService);
  private demographicsService = inject(DemographicsService);
  private destroy$ = new Subject<void>();

  // ===== STATE MANAGEMENT =====
  // Current working cover (e.g., being edited)
  private currentCover = signal<FundingApplicationCoverInformation | null>(
    null
  );

  // Default template cover
  private defaultCover = signal<FundingApplicationCoverInformation | null>(
    null
  );

  // All covers for organization (cached)
  private allCovers = signal<FundingApplicationCoverInformation[]>([]);

  // Loading/error states
  private isLoading = signal(false);
  private isSaving = signal(false);
  private error = signal<string | null>(null);
  private lastFetchTime = signal<number>(0);

  // Cache TTL (5 minutes)
  private readonly CACHE_TTL = 5 * 60 * 1000;

  // ===== PUBLIC READONLY SIGNALS =====
  readonly cover = this.currentCover.asReadonly();
  readonly defaultProfile = this.defaultCover.asReadonly();
  readonly covers = this.allCovers.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly saving = this.isSaving.asReadonly();
  readonly coverError = this.error.asReadonly();

  // ===== OBSERVABLES (for reactive components) =====
  private coverSubject =
    new BehaviorSubject<FundingApplicationCoverInformation | null>(null);
  public cover$ = this.coverSubject.asObservable();

  private coversSubject = new BehaviorSubject<
    FundingApplicationCoverInformation[]
  >([]);
  public covers$ = this.coversSubject.asObservable();

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize service: load default cover on auth
   */
  private initializeService(): void {
    this.authService.session$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (session) => {
        if (session?.user) {
          try {
            await this.loadDefaultCover();
          } catch (error) {
            console.warn('Failed to load default cover on init:', error);
          }
        } else {
          this.clearState();
        }
      });
  }

  // ===== LOAD OPERATIONS =====

  /**
   * Load default cover for organization
   * Runs once on init or on demand
   */
  async loadDefaultCover(): Promise<FundingApplicationCoverInformation | null> {
    try {
      const orgId = this.authService.getCurrentUserOrganizationId();
      if (!orgId) {
        console.warn('No organization context for loading default cover');
        return null;
      }

      const { data, error } = await this.supabase
        .from('funding_application_cover_information')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_default', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading default cover:', error);
        return null;
      }

      if (data) {
        const cover = this.transformDatabaseToLocal(data);
        this.defaultCover.set(cover);
        this.coverSubject.next(cover);
        console.log('✅ Default cover loaded');
        return cover;
      }

      return null;
    } catch (error) {
      console.error('Failed to load default cover:', error);
      return null;
    }
  }

  /**
   * Get all covers for organization
   * With caching to avoid excessive queries
   */
  async getCoversByOrganization(
    options?: CoverQueryOptions
  ): Promise<CoverListResult> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const orgId = this.authService.getCurrentUserOrganizationId();
      if (!orgId) {
        return {
          success: false,
          covers: [],
          total: 0,
          error: 'No organization context',
        };
      }

      // Check cache
      const now = Date.now();
      if (
        this.allCovers().length > 0 &&
        now - this.lastFetchTime() < this.CACHE_TTL
      ) {
        console.log('📦 Using cached covers');
        return {
          success: true,
          covers: this.allCovers(),
          total: this.allCovers().length,
        };
      }

      // Fetch from database
      let query = this.supabase
        .from('funding_application_cover_information')
        .select('*', { count: 'exact' })
        .eq('organization_id', orgId);

      // Apply filters
      if (options?.onlyDefaults) {
        query = query.eq('is_default', true);
      }

      // Apply sorting
      const sortBy = options?.sortBy || 'updated';
      const sortOrder = options?.sortOrder || 'desc';
      query = query.order(
        sortBy === 'name'
          ? 'executive_summary'
          : sortBy === 'created'
          ? 'created_at'
          : 'updated_at',
        { ascending: sortOrder === 'asc' }
      );

      // Apply pagination
      if (options?.limit) {
        const offset = options?.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      const covers = (data || []).map((d) => this.transformDatabaseToLocal(d));
      this.allCovers.set(covers);
      this.coversSubject.next(covers);
      this.lastFetchTime.set(Date.now());

      console.log(`✅ Loaded ${covers.length} covers`);
      return {
        success: true,
        covers,
        total: count || 0,
      };
    } catch (err: any) {
      const message = err?.message || 'Failed to load covers';
      this.error.set(message);
      console.error('❌ Get covers error:', err);
      return {
        success: false,
        covers: [],
        total: 0,
        error: message,
      };
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get single cover by ID
   */
  async getCoverById(
    coverId: string
  ): Promise<FundingApplicationCoverInformation | null> {
    try {
      const orgId = this.authService.getCurrentUserOrganizationId();
      if (!orgId) {
        throw new Error('No organization context');
      }

      const { data, error } = await this.supabase
        .from('funding_application_cover_information')
        .select('*')
        .eq('id', coverId)
        .eq('organization_id', orgId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw error;
      }

      return this.transformDatabaseToLocal(data);
    } catch (error) {
      console.error('Error fetching cover:', error);
      return null;
    }
  }

  /**
   * Create cover from default template
   * Pre-populates from default cover
   */
  async createCoverFromDefault(
    initialData?: CreateCoverRequest
  ): Promise<CoverOperationResult> {
    try {
      const defaultCover = this.defaultCover();
      const mergedData: CreateCoverRequest | undefined = defaultCover
        ? {
            industries: initialData?.industries || defaultCover.industries,
            fundingAmount:
              initialData?.fundingAmount || defaultCover.fundingAmount,
            fundingTypes:
              initialData?.fundingTypes || defaultCover.fundingTypes,
            businessStages:
              initialData?.businessStages || defaultCover.businessStages,
            investmentCriteria:
              initialData?.investmentCriteria ||
              defaultCover.investmentCriteria,
            exclusionCriteria:
              initialData?.exclusionCriteria || defaultCover.exclusionCriteria,
            location: initialData?.location || defaultCover.location,
            useOfFunds: initialData?.useOfFunds || defaultCover.useOfFunds,
            executiveSummary:
              initialData?.executiveSummary || defaultCover.executiveSummary,
            repaymentStrategy:
              initialData?.repaymentStrategy || defaultCover.repaymentStrategy,
            equityOffered:
              initialData?.equityOffered || defaultCover.equityOffered,
          }
        : initialData;

      const result = await this.createBlankCover(mergedData);

      if (result.success && result.cover) {
        this.activityService.trackProfileActivity(
          'created',
          'Funding cover created from default template',
          'cover_creation_from_template'
        );
      }

      return result;
    } catch (error: any) {
      console.error('Error creating from default:', error);
      return {
        success: false,
        error: error?.message || 'Failed to create from template',
      };
    }
  }

  // ===== UPDATE OPERATIONS =====

  /**
   * Update existing cover
   * Returns Observable for reactive component consumption
   */
  updateCover(
    coverId: string,
    updates: UpdateCoverRequest
  ): Observable<CoverOperationResult> {
    return from(this.performUpdateCover(coverId, updates)).pipe(
      tap((result) => {
        if (result.success && result.cover) {
          this.currentCover.set(result.cover);
          this.coverSubject.next(result.cover);
          this.invalidateCache();

          this.activityService.trackProfileActivity(
            'updated',
            'Funding cover updated',
            'cover_update'
          );
        }
      }),
      catchError((error) => {
        const message = error?.message || 'Failed to update cover';
        this.error.set(message);
        console.error('❌ Update cover error:', error);

        this.activityService.trackProfileActivity(
          'updated',
          `Failed to update cover: ${message}`,
          'cover_update_error'
        );

        return throwError(() => new Error(message));
      }),
      takeUntil(this.destroy$)
    );
  }

  private async performUpdateCover(
    coverId: string,
    updates: UpdateCoverRequest
  ): Promise<CoverOperationResult> {
    try {
      this.isSaving.set(true);

      const orgId = this.authService.getCurrentUserOrganizationId();
      if (!orgId) {
        throw new Error('No organization context');
      }

      // Transform to database format
      const dbUpdates: any = {};
      if (updates.industries !== undefined)
        dbUpdates.industries = updates.industries;
      if (updates.fundingAmount !== undefined)
        dbUpdates.funding_amount = updates.fundingAmount;
      if (updates.fundingTypes !== undefined)
        dbUpdates.funding_types = updates.fundingTypes;
      if (updates.businessStages !== undefined)
        dbUpdates.business_stages = updates.businessStages;
      if (updates.investmentCriteria !== undefined)
        dbUpdates.investment_criteria = updates.investmentCriteria;
      if (updates.exclusionCriteria !== undefined)
        dbUpdates.exclusion_criteria = updates.exclusionCriteria;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.useOfFunds !== undefined)
        dbUpdates.use_of_funds = updates.useOfFunds;
      if (updates.executiveSummary !== undefined)
        dbUpdates.executive_summary = updates.executiveSummary;
      if (updates.repaymentStrategy !== undefined)
        dbUpdates.repayment_strategy = updates.repaymentStrategy;
      if (updates.equityOffered !== undefined)
        dbUpdates.equity_offered = updates.equityOffered;
      if (updates.isDefault !== undefined)
        dbUpdates.is_default = updates.isDefault;
      if (updates.coverDocumentUrl !== undefined)
        dbUpdates.cover_document_url = updates.coverDocumentUrl;
      if (updates.coverDocumentName !== undefined)
        dbUpdates.cover_document_name = updates.coverDocumentName;
      if (updates.coverDocumentId !== undefined)
        dbUpdates.cover_document_id = updates.coverDocumentId;

      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await this.supabase
        .from('funding_application_cover_information')
        .update(dbUpdates)
        .eq('id', coverId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) {
        throw new Error(`Update failed: ${error.message}`);
      }

      const cover = this.transformDatabaseToLocal(data);
      return {
        success: true,
        cover,
        message: 'Cover updated successfully',
      };
    } catch (error) {
      console.error('Error updating cover:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Set cover as default for organization
   * Unsets any previous default
   */
  async setAsDefault(coverId: string): Promise<CoverOperationResult> {
    try {
      this.isSaving.set(true);
      const orgId = this.authService.getCurrentUserOrganizationId();
      if (!orgId) throw new Error('No organization context');

      // Unset current default
      const currentDefault = this.defaultCover();
      if (currentDefault && currentDefault.id !== coverId) {
        const { error: unsetError } = await this.supabase
          .from('funding_application_cover_information')
          .update({ is_default: false, updated_at: new Date().toISOString() })
          .eq('id', currentDefault.id)
          .eq('organization_id', orgId);

        if (unsetError) {
          console.warn('Failed to unset previous default:', unsetError);
        }
      }

      // Set new default
      const { data, error } = await this.supabase
        .from('funding_application_cover_information')
        .update({ is_default: true, updated_at: new Date().toISOString() })
        .eq('id', coverId)
        .eq('organization_id', orgId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to set default: ${error.message}`);
      }

      const cover = this.transformDatabaseToLocal(data);
      this.defaultCover.set(cover);
      this.invalidateCache();

      this.activityService.trackProfileActivity(
        'updated',
        'Cover set as default',
        'cover_set_default'
      );

      return {
        success: true,
        cover,
        message: 'Cover set as default',
      };
    } catch (error: any) {
      const message = error?.message || 'Failed to set default';
      this.error.set(message);
      return {
        success: false,
        error: message,
      };
    } finally {
      this.isSaving.set(false);
    }
  }

  // ===== DOCUMENT MANAGEMENT =====

  /**
   * Attach document to cover
   * UNIFIED operation: upload + update in one call
   */
  async attachDocumentToCover(
    coverId: string,
    file: File
  ): Promise<CoverOperationResult> {
    try {
      this.isSaving.set(true);
      this.error.set(null);

      // Step 1: Upload document
      const documentKey = `cover_${coverId}_document`;
      const uploadResult = await this.documentService
        .uploadDocument(file, documentKey, undefined, 'cover')
        .toPromise();

      if (!uploadResult) {
        throw new Error('Document upload failed');
      }

      // Step 2: Update cover with document info
      const updateResult = await this.performUpdateCover(coverId, {
        coverDocumentId: uploadResult.id,
        coverDocumentUrl: uploadResult.publicUrl,
        coverDocumentName: uploadResult.originalName,
      });

      if (updateResult.success) {
        this.activityService.trackProfileActivity(
          'updated',
          `Document attached to cover: ${uploadResult.originalName}`,
          'cover_document_attached'
        );
      }

      return updateResult;
    } catch (error: any) {
      const message = error?.message || 'Failed to attach document';
      this.error.set(message);

      this.activityService.trackProfileActivity(
        'updated',
        'Failed to attach document to cover',
        'cover_document_error'
      );

      return {
        success: false,
        error: message,
      };
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Remove document from cover
   */
  async removeDocumentFromCover(
    coverId: string
  ): Promise<CoverOperationResult> {
    try {
      this.isSaving.set(true);

      const cover = await this.getCoverById(coverId);
      if (!cover?.coverDocumentUrl) {
        return {
          success: false,
          error: 'No document attached to this cover',
        };
      }

      // Remove from storage
      const documentKey = `cover_${coverId}_document`;
      try {
        await this.documentService.deleteDocumentByKey(documentKey).toPromise();
      } catch (docError) {
        console.warn('Failed to delete document from storage:', docError);
      }

      // Update cover
      return await this.performUpdateCover(coverId, {
        coverDocumentId: undefined,
        coverDocumentUrl: undefined,
        coverDocumentName: undefined,
      });
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to remove document',
      };
    } finally {
      this.isSaving.set(false);
    }
  }

  // ===== VALIDATION =====

  /**
   * Validate cover completion
   */
  validateCoverCompletion(
    cover: FundingApplicationCoverInformation
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!cover.industries || cover.industries.length === 0) {
      errors.push('At least one industry is required');
    }
    if (!cover.fundingAmount || cover.fundingAmount <= 0) {
      errors.push('Funding amount must be greater than 0');
    }
    if (!cover.fundingTypes || cover.fundingTypes.length === 0) {
      errors.push('At least one funding type is required');
    }
    if (!cover.businessStages || cover.businessStages.length === 0) {
      errors.push('At least one business stage is required');
    }
    if (!cover.location) {
      errors.push('Location is required');
    }
    if (!cover.useOfFunds) {
      errors.push('Use of funds description is required');
    }

    // Warnings
    if (
      cover.fundingTypes.includes('equity') &&
      cover.equityOffered === undefined
    ) {
      warnings.push(
        'Equity funding type selected but equity percentage not specified'
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get completion status
   */
  getCompletionStatus(
    cover: FundingApplicationCoverInformation
  ): CompletionStatus {
    const requiredFields = [
      'industries',
      'fundingAmount',
      'fundingTypes',
      'businessStages',
      'location',
      'useOfFunds',
    ];

    const filledFields = requiredFields.filter((field) => {
      const value = (cover as any)[field];
      if (Array.isArray(value)) return value.length > 0;
      return !!value;
    });

    const completionPercentage = Math.round(
      (filledFields.length / requiredFields.length) * 100
    );

    return {
      completionPercentage,
      filledFields,
      missingRequiredFields: requiredFields.filter(
        (f) => !filledFields.includes(f)
      ),
      isReadyForSubmission: completionPercentage === 100,
    };
  }

  // ===== UTILITY METHODS =====

  /**
   * Copy cover (create new instance with same data)
   */
  async copyCover(coverId: string): Promise<CoverOperationResult> {
    try {
      const original = await this.getCoverById(coverId);
      if (!original) {
        return {
          success: false,
          error: 'Cover not found',
        };
      }

      const copyData: CreateCoverRequest = {
        industries: [...original.industries],
        fundingAmount: original.fundingAmount,
        fundingTypes: [...original.fundingTypes],
        businessStages: [...original.businessStages],
        investmentCriteria: [...original.investmentCriteria],
        exclusionCriteria: [...original.exclusionCriteria],
        location: original.location,
        useOfFunds: original.useOfFunds,
        executiveSummary: `${original.executiveSummary} (Copy)`,
        repaymentStrategy: original.repaymentStrategy,
        equityOffered: original.equityOffered,
      };

      const result = await this.createBlankCover(copyData);

      if (result.success) {
        this.activityService.trackProfileActivity(
          'created',
          `Cover copied from: ${original.executiveSummary}`,
          'cover_copy'
        );
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to copy cover',
      };
    }
  }

  /**
   * Invalidate cache (after modifications)
   */
  private invalidateCache(): void {
    this.lastFetchTime.set(0);
  }

  /**
   * Clear all state
   */
  private clearState(): void {
    this.currentCover.set(null);
    this.defaultCover.set(null);
    this.allCovers.set([]);
    this.coverSubject.next(null);
    this.coversSubject.next([]);
    this.error.set(null);
    this.invalidateCache();
  }

  // ===== TRANSFORMATION =====

  private transformDatabaseToLocal(
    dbRecord: any
  ): FundingApplicationCoverInformation {
    return {
      id: dbRecord.id,
      organizationId: dbRecord.organization_id,
      isDefault: dbRecord.is_default,
      languageCode: dbRecord.language_code,
      industries: dbRecord.industries || [],
      fundingAmount: dbRecord.funding_amount || 0,
      fundingTypes: dbRecord.funding_types || [],
      businessStages: dbRecord.business_stages || [],
      investmentCriteria: dbRecord.investment_criteria || [],
      exclusionCriteria: dbRecord.exclusion_criteria || [],
      location: dbRecord.location || '',
      useOfFunds: dbRecord.use_of_funds || '',
      executiveSummary: dbRecord.executive_summary || '',
      repaymentStrategy: dbRecord.repayment_strategy,
      equityOffered: dbRecord.equity_offered,
      coverDocumentId: dbRecord.cover_document_id,
      coverDocumentUrl: dbRecord.cover_document_url,
      coverDocumentName: dbRecord.cover_document_name,
      createdAt: new Date(dbRecord.created_at),
      updatedAt: new Date(dbRecord.updated_at),
    };
  }

  // KEY CHANGES FOR SINGLE-PROFILE MODE:
  // 1. createBlankCover() always sets is_default: true
  // 2. copyCover() method REMOVED
  // 3. setAsDefault() logic removed (all covers are default)
  // 4. Initialize loads defaultCover via loadDefaultCover()

  // PASTE THIS METHOD into FundingApplicationCoverService to replace createBlankCover():

  /**
   * Create funding request (always default in single-profile mode)
   * Minimal data - user fills in later
   */
  async createBlankCover(
    initialData?: CreateCoverRequest
  ): Promise<CoverOperationResult> {
    try {
      this.isSaving.set(true);
      this.error.set(null);

      const userId = this.authService.getCurrentUserId();
      const orgId = this.authService.getCurrentUserOrganizationId();

      if (!userId || !orgId) {
        throw new Error('Authentication required');
      }

      const coverData = {
        organization_id: orgId,
        is_default: true, // ✅ ALWAYS default in single-profile mode
        language_code: 'en',
        industries: initialData?.industries || [],
        funding_amount: initialData?.fundingAmount || 0,
        funding_types: initialData?.fundingTypes || [],
        business_stages: initialData?.businessStages || [],
        investment_criteria: initialData?.investmentCriteria || [],
        exclusion_criteria: initialData?.exclusionCriteria || [],
        location: initialData?.location || '',
        use_of_funds: initialData?.useOfFunds || '',
        executive_summary: initialData?.executiveSummary || '',
        repayment_strategy: initialData?.repaymentStrategy || null,
        equity_offered: initialData?.equityOffered || null,
        cover_document_id: null,
        cover_document_url: null,
        cover_document_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('funding_application_cover_information')
        .insert([coverData])
        .select()
        .single();

      if (error) {
        throw new Error(`Create failed: ${error.message}`);
      }

      const cover = this.transformDatabaseToLocal(data);
      this.currentCover.set(cover);
      this.coverSubject.next(cover);
      this.defaultCover.set(cover); // ✅ Set as default
      this.invalidateCache();

      this.activityService.trackProfileActivity(
        'created',
        'Funding request created',
        'funding_request_creation'
      );

      return {
        success: true,
        cover,
        message: 'Funding request created successfully',
      };
    } catch (error: any) {
      const message = error?.message || 'Failed to create funding request';
      this.error.set(message);
      console.error('❌ Create funding request error:', error);

      this.activityService.trackProfileActivity(
        'updated',
        `Failed to create funding request: ${error?.message}`,
        'funding_request_creation_error'
      );

      return {
        success: false,
        error: message,
      };
    } finally {
      this.isSaving.set(false);
    }
  }

  // ============================================
  // REMOVE THESE METHODS (not needed in single-profile mode):
  // - copyCover()
  // - setAsDefault()
  // - createCoverFromDefault()
  // ============================================

  // ============================================
  // UPDATE deleteCover() - remove default check:
  // ============================================

  async deleteCover(coverId: string): Promise<CoverOperationResult> {
    try {
      this.isSaving.set(true);
      const orgId = this.authService.getCurrentUserOrganizationId();
      if (!orgId) throw new Error('No organization context');

      // In single-profile mode, allow deletion (it's the only one)
      // Just clean up documents

      const cover = await this.getCoverById(coverId);
      if (cover?.coverDocumentUrl) {
        const documentKey = `cover_${coverId}_document`;
        try {
          await this.documentService
            .deleteDocumentByKey(documentKey)
            .toPromise();
        } catch (docError) {
          console.warn('Failed to delete associated document:', docError);
        }
      }

      const { error } = await this.supabase
        .from('funding_application_cover_information')
        .delete()
        .eq('id', coverId)
        .eq('organization_id', orgId);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      if (this.currentCover()?.id === coverId) {
        this.currentCover.set(null);
        this.coverSubject.next(null);
      }

      if (this.defaultCover()?.id === coverId) {
        this.defaultCover.set(null);
      }

      this.invalidateCache();

      this.activityService.trackProfileActivity(
        'updated',
        'Funding request deleted',
        'funding_request_deleted'
      );

      return {
        success: true,
        message: 'Funding request deleted successfully',
      };
    } catch (error: any) {
      const message = error?.message || 'Failed to delete funding request';
      this.error.set(message);

      this.activityService.trackProfileActivity(
        'updated',
        `Failed to delete funding request: ${message}`,
        'funding_request_deletion_error'
      );

      return {
        success: false,
        error: message,
      };
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Load cover with demographics
   */
  async loadCoverWithDemographics(
    coverId: string
  ): Promise<FundingApplicationCoverInformation | null> {
    const cover = await this.getCoverById(coverId);
    if (cover) {
      // Also load demographics
      await this.demographicsService.loadDemographics(coverId);
    }
    return cover;
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.coverSubject.complete();
    this.coversSubject.complete();
  }
}
