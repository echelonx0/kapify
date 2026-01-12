import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import {
  DemographicCategory,
  DemographicField,
} from 'src/app/shared/models/funding-application-demographics.model';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

/**
 * DemographicsConfigService
 * - Loads demographic categories and fields from Supabase
 * - Falls back to hardcoded local config if Supabase unavailable
 * - Caches config in signals for reactive consumption
 * - Auto-refreshes periodically
 */
@Injectable({
  providedIn: 'root',
})
export class DemographicsConfigService implements OnDestroy {
  private supabase = inject(SharedSupabaseService);
  private destroy$ = new Subject<void>();

  // ===== STATE =====
  private categoriesSignal = signal<DemographicCategory[]>([]);
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);
  private lastLoadedSignal = signal<Date | null>(null);
  private isUsingFallbackSignal = signal(false);

  // ===== PUBLIC READONLY SIGNALS =====
  readonly categories = this.categoriesSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly lastLoaded = this.lastLoadedSignal.asReadonly();
  readonly isUsingFallback = this.isUsingFallbackSignal.asReadonly();

  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private refreshTimer?: number;

  // Local fallback config (from hardcoded original)
  private readonly LOCAL_FALLBACK_CONFIG: DemographicCategory[] = [
    {
      id: 'shareholding',
      label: 'Shareholding',
      description: 'Business ownership structure',
      order: 1,
      fields: [
        {
          name: 'blackOwnership',
          label: 'Black Ownership (%)',
          type: 'percentage',
          required: false,
          placeholder: 'e.g., 45',
          min: 0,
          max: 100,
          helpText: 'Percentage of shareholding under Black Ownership',
        },
        {
          name: 'womanOwnership',
          label: 'Woman Ownership (%)',
          type: 'percentage',
          required: false,
          placeholder: 'e.g., 60',
          min: 0,
          max: 100,
          helpText: 'Percentage of shareholding held by women',
        },
        {
          name: 'womenBlackOwnership',
          label: 'Black Woman Ownership (%)',
          type: 'percentage',
          required: false,
          placeholder: 'e.g., 30',
          min: 0,
          max: 100,
          helpText: 'Percentage of shareholding held by Black women',
        },
        {
          name: 'youthOwnership',
          label: 'Youth Ownership (%)',
          type: 'percentage',
          required: false,
          placeholder: 'e.g., 51',
          min: 0,
          max: 100,
          helpText: 'Percentage of shareholding held by youth (under 35)',
        },
        {
          name: 'youthBlackOwnership',
          label: 'Black Youth Ownership (%)',
          type: 'percentage',
          required: false,
          placeholder: 'e.g., 40',
          min: 0,
          max: 100,
          helpText: 'Percentage of shareholding held by Black youth',
        },
        {
          name: 'disabilityOwnership',
          label: 'Disability Ownership (%)',
          type: 'percentage',
          required: false,
          placeholder: 'e.g., 25',
          min: 0,
          max: 100,
          helpText:
            'Percentage of shareholding held by individuals with disability',
        },
        {
          name: 'disabilityBlackOwnership',
          label: 'Black Disability Ownership (%)',
          type: 'percentage',
          required: false,
          placeholder: 'e.g., 15',
          min: 0,
          max: 100,
          helpText:
            'Percentage of shareholding held by Black individuals with disability',
        },
      ],
    },
    {
      id: 'businessArea',
      label: 'Business Area',
      description: 'Where your business is located',
      order: 2,
      fields: [
        {
          name: 'area',
          label: 'Which area is the business registered in?',
          type: 'dropdown',
          required: false,
          options: ['Urban', 'Township', 'Rural'],
          helpText: 'Select the primary business location',
        },
      ],
    },
    {
      id: 'jobStats',
      label: 'Jobs Statistics',
      description: 'Employment impact metrics',
      order: 3,
      fields: [
        {
          name: 'jobsCreated',
          label: 'Jobs Created (last 12-24 months)',
          type: 'number',
          required: false,
          placeholder: 'e.g., 15',
          min: 0,
          helpText: 'Number of jobs created in the last 12-24 months',
        },
        {
          name: 'expectedJobs',
          label: 'Expected Jobs (next 12-36 months)',
          type: 'number',
          required: false,
          placeholder: 'e.g., 25',
          min: 0,
          helpText:
            'Number of jobs expected to be created in the next 12-36 months',
        },
      ],
    },
  ];

  constructor() {
    // Auto-load on service creation
    this.loadConfig();

    // Setup auto-refresh
    this.setupAutoRefresh();
  }

  /**
   * Load config from Supabase, fallback to local if needed
   */
  async loadConfig(): Promise<void> {
    try {
      this.isLoadingSignal.set(true);
      this.errorSignal.set(null);

      // Load from Supabase
      const config = await this.loadFromSupabase();

      if (config && config.length > 0) {
        this.categoriesSignal.set(config);
        this.isUsingFallbackSignal.set(false);
        this.lastLoadedSignal.set(new Date());
        console.log('✅ Demographics config loaded from Supabase');
      } else {
        throw new Error('No config returned from Supabase');
      }
    } catch (error: any) {
      console.warn(
        '⚠️ Failed to load config from Supabase, using fallback:',
        error?.message
      );
      this.categoriesSignal.set(this.LOCAL_FALLBACK_CONFIG);
      this.isUsingFallbackSignal.set(true);
      this.errorSignal.set(
        'Using local config. Some updates may not be visible.'
      );
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Load categories and fields from Supabase
   */
  private async loadFromSupabase(): Promise<DemographicCategory[]> {
    // Load categories
    const { data: categoriesData, error: categoriesError } = await this.supabase
      .from('demographics_categories')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (categoriesError) {
      throw new Error(`Failed to load categories: ${categoriesError.message}`);
    }

    if (!categoriesData || categoriesData.length === 0) {
      return [];
    }

    // Load fields for each category
    const categories: DemographicCategory[] = await Promise.all(
      categoriesData.map(async (cat: any) => {
        const { data: fieldsData, error: fieldsError } = await this.supabase
          .from('demographics_fields')
          .select('*')
          .eq('category_id', cat.id)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (fieldsError) {
          console.warn(
            `Failed to load fields for category ${cat.category_key}:`,
            fieldsError
          );
        }

        // Transform database fields to DemographicField format
        const fields: DemographicField[] = (fieldsData || []).map(
          (field: any) => ({
            name: field.field_name,
            label: field.label,
            type: field.type,
            required: field.is_required,
            placeholder: field.placeholder,
            options: field.options
              ? Array.isArray(field.options)
                ? field.options
                : field.options
              : undefined,
            min: field.min_value,
            max: field.max_value,
            helpText: field.help_text,
          })
        );

        return {
          id: cat.category_key,
          label: cat.label,
          description: cat.description,
          order: cat.order_index,
          fields,
        };
      })
    );

    return categories;
  }

  /**
   * Get all categories
   */
  getCategories(): DemographicCategory[] {
    return this.categoriesSignal();
  }

  /**
   * Get category by ID
   */
  getCategory(categoryId: string): DemographicCategory | undefined {
    return this.categoriesSignal().find((cat) => cat.id === categoryId);
  }

  /**
   * Get field within a category
   */
  getField(
    categoryId: string,
    fieldName: string
  ): DemographicField | undefined {
    const category = this.getCategory(categoryId);
    return category?.fields.find((f) => f.name === fieldName);
  }

  /**
   * Refresh config from Supabase
   */
  async refresh(): Promise<void> {
    await this.loadConfig();
  }

  /**
   * Setup auto-refresh every 5 minutes
   */
  private setupAutoRefresh(): void {
    this.refreshTimer = window.setInterval(() => {
      this.refresh().catch((error) => {
        console.error('Auto-refresh failed:', error);
      });
    }, this.REFRESH_INTERVAL);
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}
