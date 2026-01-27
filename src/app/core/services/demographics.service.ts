import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { Observable, from, throwError, Subject } from 'rxjs';
import { tap, catchError, takeUntil } from 'rxjs/operators';

import { DemographicsConfigService } from '../../core/services/demographics-config.service';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import {
  DemographicsData,
  DemographicsValidationResult,
  FieldValidationError,
  DemographicsCompletionStatus,
  DemographicField,
} from 'src/app/shared/models/funding-application-demographics.model';
import { ActivityService } from 'src/app/shared/services/activity.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

/**
 * DemographicsService
 * - Manages demographic data collection for funding requests
 * - Validates data based on field types
 * - Tracks completion status
 * - Syncs with funding_application_cover_information table
 */
@Injectable({
  providedIn: 'root',
})
export class DemographicsService implements OnDestroy {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  private activityService = inject(ActivityService);
  private configService = inject(DemographicsConfigService);
  private destroy$ = new Subject<void>();

  // ===== STATE =====
  private demographicsData = signal<DemographicsData>({});
  private isLoading = signal(false);
  private isSaving = signal(false);
  private error = signal<string | null>(null);
  private lastSavedAt = signal<Date | null>(null);

  // ===== PUBLIC READONLY SIGNALS =====
  readonly demographics = this.demographicsData.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly saving = this.isSaving.asReadonly();
  readonly demographicsError = this.error.asReadonly();
  readonly savedAt = this.lastSavedAt.asReadonly();

  constructor() {
    // No initialization needed - demographics loaded on demand
  }

  // ===== LOAD OPERATIONS =====

  /**
   * Load demographics for a funding request
   */
  async loadDemographics(coverId: string): Promise<DemographicsData | null> {
    try {
      this.isLoading.set(true);
      this.error.set(null);

      const orgId = this.authService.getCurrentUserOrganizationId();
      if (!orgId) {
        throw new Error('No organization context');
      }

      const { data, error } = await this.supabase
        .from('funding_application_cover_information')
        .select('demographics, demographics_updated_at')
        .eq('id', coverId)
        .eq('organization_id', orgId)
        .single();

      if (error) {
        throw error;
      }

      if (data && data.demographics) {
        const demographics = data.demographics as DemographicsData;
        this.demographicsData.set(demographics);
        this.lastSavedAt.set(
          data.demographics_updated_at
            ? new Date(data.demographics_updated_at)
            : null
        );
        console.log('✅ Demographics loaded:', demographics);
        return demographics;
      }

      // No demographics yet
      this.demographicsData.set({});
      console.log('✅ No existing demographics found, starting fresh');
      return null;
    } catch (err: any) {
      const message = err?.message || 'Failed to load demographics';
      this.error.set(message);
      console.error('❌ Load demographics error:', err);
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  // ===== SAVE OPERATIONS =====

  /**
   * Save demographics for a funding request
   * Returns Observable for reactive consumption
   */
  saveDemographics(
    coverId: string,
    data: DemographicsData
  ): Observable<{ success: boolean; error?: string }> {
    return from(this.performSaveDemographics(coverId, data)).pipe(
      tap((result) => {
        if (result.success) {
          this.demographicsData.set(data);
          this.lastSavedAt.set(new Date());
          this.error.set(null);

          this.activityService.trackProfileActivity(
            'updated',
            'Demographics saved',
            'demographics_saved'
          );
        }
      }),
      catchError((error) => {
        const message = error?.message || 'Failed to save demographics';
        this.error.set(message);
        console.error('❌ Save demographics error:', error);

        this.activityService.trackProfileActivity(
          'updated',
          `Failed to save demographics: ${message}`,
          'demographics_save_error'
        );

        return throwError(() => new Error(message));
      }),
      takeUntil(this.destroy$)
    );
  }

  private async performSaveDemographics(
    coverId: string,
    data: DemographicsData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.isSaving.set(true);

      const orgId = this.authService.getCurrentUserOrganizationId();
      if (!orgId) {
        throw new Error('No organization context');
      }

      // Validate data
      const validation = this.validateDemographics(data);
      if (!validation.isValid) {
        throw new Error(
          `Validation failed: ${validation.errors
            .map((e) => e.error)
            .join(', ')}`
        );
      }

      // Update database
      const { error } = await this.supabase
        .from('funding_application_cover_information')
        .update({
          demographics: data,
          demographics_updated_at: new Date().toISOString(),
        })
        // .eq('id', coverId)
        .eq('organization_id', orgId);

      if (error) {
        throw error;
      }

      console.log('✅ Demographics saved to database');
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Save failed',
      };
    } finally {
      this.isSaving.set(false);
    }
  }

  // ===== VALIDATION =====

  /**
   * Validate demographic data
   */
  validateDemographics(data: DemographicsData): DemographicsValidationResult {
    const errors: FieldValidationError[] = [];

    const categories = this.configService.getCategories();

    for (const category of categories) {
      for (const field of category.fields) {
        const value = data[category.id]?.[field.name || ''];

        // Check required fields
        if (
          field.required &&
          (value === null || value === undefined || value === '')
        ) {
          errors.push({
            fieldName: `${category.id}.${field.name}`,
            error: `${field.label} is required`,
          });
          continue;
        }

        // Skip validation for empty non-required fields
        if (!value && value !== 0) continue;

        const fieldError = this.validateField(field, value);
        if (fieldError) {
          errors.push({
            fieldName: `${category.id}.${field.name}`,
            error: fieldError,
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a single field
   */
  private validateField(field: DemographicField, value: any): string | null {
    switch (field.type) {
      case 'percentage':
      case 'number': {
        const num = Number(value);
        if (isNaN(num)) {
          return `${field.label} must be a number`;
        }
        if (field.min !== undefined && num < field.min) {
          return `${field.label} must be at least ${field.min}`;
        }
        if (field.max !== undefined && num > field.max) {
          return `${field.label} must be at most ${field.max}`;
        }
        return null;
      }

      case 'dropdown': {
        if (field.options && !field.options.includes(String(value))) {
          return `${field.label} has invalid value`;
        }
        return null;
      }

      case 'text': {
        const str = String(value);
        if (str.trim().length === 0) {
          return `${field.label} cannot be empty`;
        }
        return null;
      }

      default:
        return null;
    }
  }

  // ===== COMPLETION STATUS =====

  /**
   * Get demographic completion status
   */
  getCompletionStatus(
    data: DemographicsData = this.demographicsData()
  ): DemographicsCompletionStatus {
    let totalFields = 0;
    let filledFields = 0;
    const categoryCompletion: DemographicsCompletionStatus['categoryCompletion'] =
      {};

    // Use config service categories
    const categories = this.configService.getCategories();

    for (const category of categories) {
      let categoryTotal = 0;
      let categoryFilled = 0;

      for (const field of category.fields) {
        categoryTotal++;
        totalFields++;

        // Use field.name to access the data
        const value = data[category.id]?.[field.name || ''];

        if (value !== null && value !== undefined && value !== '') {
          categoryFilled++;
          filledFields++;
        }
      }

      categoryCompletion[category.id] = {
        total: categoryTotal,
        filled: categoryFilled,
        percentage:
          categoryTotal > 0
            ? Math.round((categoryFilled / categoryTotal) * 100)
            : 0,
      };
    }

    return {
      totalFields,
      filledFields,
      completionPercentage:
        totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0,
      categoryCompletion,
    };
  }

  // ===== UTILITIES =====

  /**
   * Get field value
   */
  getFieldValue(categoryId: string, fieldName: string): any {
    return this.demographicsData()[categoryId]?.[fieldName] ?? null;
  }

  /**
   * Set field value (local state only, doesn't save)
   */
  setFieldValue(categoryId: string, fieldName: string, value: any): void {
    const current = { ...this.demographicsData() };
    if (!current[categoryId]) {
      current[categoryId] = {};
    }
    current[categoryId][fieldName] = value;
    this.demographicsData.set(current);
    console.log('📝 Field updated:', categoryId, fieldName, value);
  }

  /**
   * Clear all demographics
   */
  clear(): void {
    this.demographicsData.set({});
    this.error.set(null);
    this.lastSavedAt.set(null);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
