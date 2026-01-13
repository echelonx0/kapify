import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { ActivityService } from 'src/app/shared/services/activity.service';
import { DemographicsConfigService } from './demographics-config.service';
import {
  DemographicCategory,
  DemographicField,
} from 'src/app/shared/models/funding-application-demographics.model';

/**
 * AdminDemographicsConfigService
 * - CRUD operations for demographic categories and fields
 * - Manages reordering and toggle active/inactive
 * - Triggers config reload on changes
 */

@Injectable({
  providedIn: 'root',
})
export class AdminDemographicsConfigService {
  private supabase = inject(SharedSupabaseService);
  private configService = inject(DemographicsConfigService);
  private activityService = inject(ActivityService);

  // ===== CATEGORY OPERATIONS =====

  /**
   * Create new demographic category
   */
  createCategory(
    categoryKey: string,
    label: string,
    description?: string
  ): Observable<DemographicCategory> {
    return from(
      this.performCreateCategory(categoryKey, label, description)
    ).pipe(
      tap(() => {
        this.activityService.trackProfileActivity(
          'updated',
          `Demographics category created: ${label}`,
          'demographics_category_created'
        );
        this.configService.reloadConfig();
      }),
      catchError((error) => {
        console.error('❌ Create category error:', error);
        this.activityService.trackProfileActivity(
          'updated',
          `Failed to create category: ${error?.message}`,
          'demographics_category_create_error'
        );
        return throwError(() => error);
      })
    );
  }

  private async performCreateCategory(
    categoryKey: string,
    label: string,
    description?: string
  ): Promise<DemographicCategory> {
    const { data, error } = await this.supabase
      .from('demographics_categories')
      .insert([
        {
          category_key: categoryKey,
          label,
          description: description || null,
          order_index: 999,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      label: data.label,
      description: data.description,
      order: data.order_index,
      fields: [],
    };
  }

  /**
   * Update demographic category
   */
  updateCategory(
    id: string,
    updates: Partial<DemographicCategory>
  ): Observable<DemographicCategory> {
    return from(this.performUpdateCategory(id, updates)).pipe(
      tap(() => {
        this.activityService.trackProfileActivity(
          'updated',
          `Demographics category updated: ${updates.label}`,
          'demographics_category_updated'
        );
        this.configService.reloadConfig();
      }),
      catchError((error) => {
        console.error('❌ Update category error:', error);
        return throwError(() => error);
      })
    );
  }

  private async performUpdateCategory(
    id: string,
    updates: Partial<DemographicCategory>
  ): Promise<DemographicCategory> {
    const updatePayload: any = {};
    if (updates.label) updatePayload.label = updates.label;
    if (updates.description !== undefined)
      updatePayload.description = updates.description;
    if (updates.order !== undefined) updatePayload.order_index = updates.order;

    const { data, error } = await this.supabase
      .from('demographics_categories')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      label: data.label,
      description: data.description,
      order: data.order_index,
      fields: [],
    };
  }

  /**
   * Delete demographic category
   */
  deleteCategory(id: string): Observable<void> {
    return from(this.performDeleteCategory(id)).pipe(
      tap(() => {
        this.activityService.trackProfileActivity(
          'updated',
          'Demographics category deleted',
          'demographics_category_deleted'
        );
        this.configService.reloadConfig();
      }),
      catchError((error) => {
        console.error('❌ Delete category error:', error);
        return throwError(() => error);
      })
    );
  }

  private async performDeleteCategory(id: string): Promise<void> {
    // Delete all fields first
    await this.supabase
      .from('demographics_fields')
      .delete()
      .eq('category_id', id);

    // Then delete category
    const { error } = await this.supabase
      .from('demographics_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ===== FIELD OPERATIONS =====

  /**
   * Create new demographic field
   */
  createField(
    categoryId: string,
    fieldName: string,
    label: string,
    type: DemographicField['type'],
    required: boolean = false,
    options?: {
      minValue?: number;
      maxValue?: number;
      optionsList?: string[];
      placeholder?: string;
      helpText?: string;
    }
  ): Observable<DemographicField> {
    return from(
      this.performCreateField(
        categoryId,
        fieldName,
        label,
        type,
        required,
        options
      )
    ).pipe(
      tap(() => {
        this.activityService.trackProfileActivity(
          'updated',
          `Demographics field created: ${label}`,
          'demographics_field_created'
        );
        this.configService.reloadConfig();
      }),
      catchError((error) => {
        console.error('❌ Create field error:', error);
        return throwError(() => error);
      })
    );
  }

  private async performCreateField(
    categoryId: string,
    fieldName: string,
    label: string,
    type: DemographicField['type'],
    required: boolean = false,
    options?: any
  ): Promise<DemographicField> {
    const { data, error } = await this.supabase
      .from('demographics_fields')
      .insert([
        {
          category_id: categoryId,
          field_name: fieldName,
          label,
          type,
          is_required: required,
          min_value: options?.minValue || null,
          max_value: options?.maxValue || null,
          options: options?.optionsList
            ? JSON.stringify(options.optionsList)
            : null,
          placeholder: options?.placeholder || null,
          help_text: options?.helpText || null,
          order_index: 999,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return this.mapFieldFromDb(data);
  }

  /**
   * Update demographic field
   */
  updateField(
    fieldName: string,
    updates: Partial<DemographicField>
  ): Observable<DemographicField> {
    return from(this.performUpdateField(fieldName, updates)).pipe(
      tap(() => {
        this.activityService.trackProfileActivity(
          'updated',
          `Demographics field updated: ${updates.label}`,
          'demographics_field_updated'
        );
        this.configService.reloadConfig();
      }),
      catchError((error) => {
        console.error('❌ Update field error:', error);
        return throwError(() => error);
      })
    );
  }

  private async performUpdateField(
    fieldName: string,
    updates: Partial<DemographicField>
  ): Promise<DemographicField> {
    const updatePayload: any = {};
    if (updates.label) updatePayload.label = updates.label;
    if (updates.type) updatePayload.type = updates.type;
    if (updates.required !== undefined)
      updatePayload.is_required = updates.required;
    if (updates.min !== undefined) updatePayload.min_value = updates.min;
    if (updates.max !== undefined) updatePayload.max_value = updates.max;
    if (updates.options)
      updatePayload.options = JSON.stringify(updates.options);
    if (updates.placeholder !== undefined)
      updatePayload.placeholder = updates.placeholder;
    if (updates.helpText !== undefined)
      updatePayload.help_text = updates.helpText;

    const { data, error } = await this.supabase
      .from('demographics_fields')
      .update(updatePayload)
      .eq('field_name', fieldName)
      .select()
      .single();

    if (error) throw error;
    return this.mapFieldFromDb(data);
  }

  /**
   * Delete demographic field
   */
  deleteField(fieldName: string): Observable<void> {
    return from(this.performDeleteField(fieldName)).pipe(
      tap(() => {
        this.activityService.trackProfileActivity(
          'updated',
          'Demographics field deleted',
          'demographics_field_deleted'
        );
        this.configService.reloadConfig();
      }),
      catchError((error) => {
        console.error('❌ Delete field error:', error);
        return throwError(() => error);
      })
    );
  }

  private async performDeleteField(fieldName: string): Promise<void> {
    const { error } = await this.supabase
      .from('demographics_fields')
      .delete()
      .eq('field_name', fieldName);

    if (error) throw error;
  }

  // ===== PRIVATE HELPERS =====

  /**
   * Map database field to shared DemographicField model
   */
  private mapFieldFromDb(f: any): DemographicField {
    let options: string[] | undefined;

    if (f.options) {
      try {
        options = JSON.parse(f.options);
      } catch (e) {
        if (typeof f.options === 'string') {
          options = f.options
            .split(',')
            .map((o: string) => o.trim())
            .filter((o: string) => o.length > 0);
        }
      }
    }

    return {
      name: f.field_name,
      label: f.label,
      type: f.type,
      required: f.is_required,
      min: f.min_value,
      max: f.max_value,
      options,
      placeholder: f.placeholder,
      helpText: f.help_text,
    };
  }
}
