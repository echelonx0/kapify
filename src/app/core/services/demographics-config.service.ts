// import { Injectable, signal, inject, OnDestroy } from '@angular/core';
// import { Observable, Subject, BehaviorSubject } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';
// import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
// import {
//   DemographicCategory,
//   DemographicField,
// } from 'src/app/shared/models/funding-application-demographics.model';

// /**
//  * DemographicsConfigService
//  * - Loads demographic categories & fields from Supabase
//  * - Maps to shared DemographicCategory/DemographicField types
//  * - Falls back to localStorage if Supabase unavailable
//  * - Provides hardcoded fallback as last resort
//  */

// export interface DemographicsConfig {
//   categories: DemographicCategory[];
//   loadedAt: Date;
//   source: 'supabase' | 'localStorage' | 'hardcoded';
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class DemographicsConfigService implements OnDestroy {
//   private supabase = inject(SharedSupabaseService);
//   private destroy$ = new Subject<void>();

//   // ===== STATE SIGNALS =====
//   private configState = signal<DemographicsConfig | null>(null);
//   private isLoading = signal(false);
//   private error = signal<string | null>(null);

//   // ===== PUBLIC SIGNALS =====
//   readonly config = this.configState.asReadonly();
//   readonly loading = this.isLoading.asReadonly();
//   readonly configError = this.error.asReadonly();

//   // ===== REALTIME RELOAD =====
//   private reloadSubject = new BehaviorSubject<void>(undefined);
//   reload$ = this.reloadSubject.asObservable();

//   // ===== STORAGE & CACHE =====
//   private readonly STORAGE_KEY = 'kapify_demographics_config';
//   private readonly CACHE_VERSION = 'v1';
//   private readonly MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

//   constructor() {
//     this.initializeConfig();
//   }

//   /**
//    * Initialize config on service creation
//    */
//   private async initializeConfig(): Promise<void> {
//     this.isLoading.set(true);
//     this.error.set(null);

//     try {
//       const config = await this.loadFromSupabase();
//       this.configState.set(config);
//       this.saveToLocalStorage(config);
//       console.log(
//         '✅ Demographics config loaded from Supabase:',
//         config.categories.length,
//         'categories'
//       );
//     } catch (err) {
//       console.warn('⚠️ Supabase load failed, trying localStorage:', err);

//       try {
//         const config = this.loadFromLocalStorage();
//         if (config) {
//           this.configState.set(config);
//           this.error.set('Using cached config. Some changes may be outdated.');
//           console.log('✅ Demographics config loaded from localStorage');
//         } else {
//           throw new Error('No cached config available');
//         }
//       } catch (cacheErr) {
//         console.warn(
//           '⚠️ LocalStorage load failed, using hardcoded fallback:',
//           cacheErr
//         );
//         const config = this.getHardcodedFallback();
//         this.configState.set(config);
//         this.error.set(
//           'Using fallback config. Please contact support if this persists.'
//         );
//         console.log('✅ Demographics config loaded from hardcoded fallback');
//       }
//     } finally {
//       this.isLoading.set(false);
//     }
//   }

//   /**
//    * Reload config from Supabase
//    */
//   async reloadConfig(): Promise<DemographicsConfig | null> {
//     this.isLoading.set(true);
//     this.error.set(null);

//     try {
//       const config = await this.loadFromSupabase();
//       this.configState.set(config);
//       this.saveToLocalStorage(config);
//       this.reloadSubject.next();
//       console.log('✅ Demographics config reloaded');
//       return config;
//     } catch (err) {
//       console.error('❌ Failed to reload config:', err);
//       this.error.set('Failed to reload config');
//       return null;
//     } finally {
//       this.isLoading.set(false);
//     }
//   }

//   /**
//    * Load config from Supabase
//    */
//   private async loadFromSupabase(): Promise<DemographicsConfig> {
//     try {
//       const { data: categoriesData, error: catError } = await this.supabase
//         .from('demographics_categories')
//         .select('*')
//         .eq('is_active', true)
//         .order('order_index', { ascending: true });

//       if (catError) throw catError;
//       if (!categoriesData || categoriesData.length === 0) {
//         throw new Error('No demographic categories found in Supabase');
//       }

//       const { data: fieldsData, error: fieldError } = await this.supabase
//         .from('demographics_fields')
//         .select('*')
//         .eq('is_active', true)
//         .order('order_index', { ascending: true });

//       if (fieldError) throw fieldError;

//       // Build category objects with fields
//       const categories: DemographicCategory[] = categoriesData.map((cat) => ({
//         id: cat.id,
//         label: cat.label,
//         description: cat.description,
//         order: cat.order_index,
//         fields: (fieldsData || [])
//           .filter((f) => f.category_id === cat.id)
//           .map((f) => this.mapFieldFromDb(f)),
//       }));

//       return {
//         categories,
//         loadedAt: new Date(),
//         source: 'supabase',
//       };
//     } catch (err: any) {
//       throw new Error(`Supabase load failed: ${err?.message}`);
//     }
//   }

//   /**
//    * Load config from localStorage
//    */
//   private loadFromLocalStorage(): DemographicsConfig | null {
//     try {
//       const cached = localStorage.getItem(this.STORAGE_KEY);
//       if (!cached) return null;

//       const parsed = JSON.parse(cached);
//       const loadedAt = new Date(parsed.loadedAt);
//       const age = Date.now() - loadedAt.getTime();
//       if (age > this.MAX_CACHE_AGE_MS) {
//         console.warn('⚠️ Cached config is older than 24 hours');
//       }

//       return {
//         ...parsed,
//         loadedAt: new Date(parsed.loadedAt),
//         source: 'localStorage',
//       };
//     } catch (err) {
//       console.error('❌ Failed to parse localStorage config:', err);
//       return null;
//     }
//   }

//   /**
//    * Save config to localStorage
//    */
//   private saveToLocalStorage(config: DemographicsConfig): void {
//     try {
//       localStorage.setItem(
//         this.STORAGE_KEY,
//         JSON.stringify({
//           version: this.CACHE_VERSION,
//           ...config,
//           loadedAt: config.loadedAt.toISOString(),
//         })
//       );
//     } catch (err) {
//       console.warn('Failed to save config to localStorage:', err);
//     }
//   }

//   /**
//    * Hardcoded fallback config
//    */
//   private getHardcodedFallback(): DemographicsConfig {
//     return {
//       categories: [
//         {
//           id: 'shareholding',
//           label: 'Shareholding',
//           description: 'Business ownership structure',
//           order: 1,
//           fields: [
//             {
//               name: 'blackOwnership',
//               label: 'Black Ownership (%)',
//               type: 'percentage',
//               required: false,
//               min: 0,
//               max: 100,
//               placeholder: 'e.g., 45',
//               helpText: 'Percentage of shareholding under Black Ownership',
//             },
//             {
//               name: 'womanOwnership',
//               label: 'Woman Ownership (%)',
//               type: 'percentage',
//               required: false,
//               min: 0,
//               max: 100,
//               placeholder: 'e.g., 60',
//               helpText: 'Percentage of shareholding held by women',
//             },
//             {
//               name: 'womenBlackOwnership',
//               label: 'Black Woman Ownership (%)',
//               type: 'percentage',
//               required: false,
//               min: 0,
//               max: 100,
//               placeholder: 'e.g., 30',
//               helpText: 'Percentage of shareholding held by Black women',
//             },
//             {
//               name: 'youthOwnership',
//               label: 'Youth Ownership (%)',
//               type: 'percentage',
//               required: false,
//               min: 0,
//               max: 100,
//               placeholder: 'e.g., 51',
//               helpText: 'Percentage of shareholding held by youth (under 35)',
//             },
//             {
//               name: 'youthBlackOwnership',
//               label: 'Black Youth Ownership (%)',
//               type: 'percentage',
//               required: false,
//               min: 0,
//               max: 100,
//               placeholder: 'e.g., 40',
//               helpText: 'Percentage of shareholding held by Black youth',
//             },
//             {
//               name: 'disabilityOwnership',
//               label: 'Disability Ownership (%)',
//               type: 'percentage',
//               required: false,
//               min: 0,
//               max: 100,
//               placeholder: 'e.g., 25',
//               helpText:
//                 'Percentage of shareholding held by individuals with disability',
//             },
//             {
//               name: 'disabilityBlackOwnership',
//               label: 'Black Disability Ownership (%)',
//               type: 'percentage',
//               required: false,
//               min: 0,
//               max: 100,
//               placeholder: 'e.g., 15',
//               helpText:
//                 'Percentage of shareholding held by Black individuals with disability',
//             },
//           ],
//         },
//         {
//           id: 'businessArea',
//           label: 'Business Area',
//           description: 'Where your business is located',
//           order: 2,
//           fields: [
//             {
//               name: 'area',
//               label: 'Which area is the business registered in?',
//               type: 'dropdown',
//               required: false,
//               options: ['Urban', 'Township', 'Rural'],
//               helpText: 'Select the primary business location',
//             },
//           ],
//         },
//         {
//           id: 'jobStats',
//           label: 'Jobs Statistics',
//           description: 'Employment impact metrics',
//           order: 3,
//           fields: [
//             {
//               name: 'jobsCreated',
//               label: 'Jobs Created (last 12-24 months)',
//               type: 'number',
//               required: false,
//               min: 0,
//               placeholder: 'e.g., 15',
//               helpText: 'Number of jobs created in the last 12-24 months',
//             },
//             {
//               name: 'expectedJobs',
//               label: 'Expected Jobs (next 12-36 months)',
//               type: 'number',
//               required: false,
//               min: 0,
//               placeholder: 'e.g., 25',
//               helpText:
//                 'Number of jobs expected to be created in the next 12-36 months',
//             },
//           ],
//         },
//       ],
//       loadedAt: new Date(),
//       source: 'hardcoded',
//     };
//   }

//   /**
//    * Map database field to DemographicField
//    * Supabase columns: field_name, is_required, min_value, max_value, help_text
//    * Model properties: name, required, min, max, helpText
//    */
//   private mapFieldFromDb(f: any): DemographicField {
//     let options: string[] | undefined;

//     if (f.options) {
//       try {
//         options = JSON.parse(f.options);
//       } catch (e) {
//         if (typeof f.options === 'string') {
//           options = f.options
//             .split(',')
//             .map((o: string) => o.trim())
//             .filter((o: string) => o.length > 0);
//         }
//       }
//     }

//     // Map Supabase column names to model property names
//     return {
//       name: f.field_name, // field_name → name
//       label: f.label,
//       type: f.type,
//       required: f.is_required, // is_required → required
//       placeholder: f.placeholder,
//       options,
//       min: f.min_value, // min_value → min
//       max: f.max_value, // max_value → max
//       helpText: f.help_text, // help_text → helpText
//     };
//   }

//   /**
//    * Get all active categories
//    */
//   getCategories(): DemographicCategory[] {
//     return this.configState()?.categories || [];
//   }

//   /**
//    * Get category by ID
//    */
//   getCategory(categoryId: string): DemographicCategory | undefined {
//     return this.getCategories().find((c) => c.id === categoryId);
//   }

//   /**
//    * Get all fields for a category
//    */
//   getFieldsByCategory(categoryId: string): DemographicField[] {
//     const category = this.getCategory(categoryId);
//     return category?.fields || [];
//   }

//   /**
//    * Check if config is loaded
//    */
//   isLoaded(): boolean {
//     return !!this.configState();
//   }

//   /**
//    * Get config source
//    */
//   getSource(): 'supabase' | 'localStorage' | 'hardcoded' | null {
//     return this.configState()?.source || null;
//   }

//   /**
//    * Watch config changes
//    */
//   watchConfigChanges(): Observable<DemographicsConfig | null> {
//     return new Observable((subscriber) => {
//       subscriber.next(this.configState());

//       const subscription = this.reload$
//         .pipe(takeUntil(this.destroy$))
//         .subscribe(() => {
//           subscriber.next(this.configState());
//         });

//       return () => subscription.unsubscribe();
//     });
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }
// }

import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import {
  DemographicCategory,
  DemographicField,
} from 'src/app/shared/models/funding-application-demographics.model';

/**
 * DemographicsConfigService
 * - Loads demographic categories & fields from Supabase
 * - Maps to shared DemographicCategory/DemographicField types
 * - Falls back to localStorage if Supabase unavailable
 * - Provides hardcoded fallback as last resort
 */

export interface DemographicsConfig {
  categories: DemographicCategory[];
  loadedAt: Date;
  source: 'supabase' | 'localStorage' | 'hardcoded';
}

@Injectable({
  providedIn: 'root',
})
export class DemographicsConfigService implements OnDestroy {
  private supabase = inject(SharedSupabaseService);
  private destroy$ = new Subject<void>();

  // ===== STATE SIGNALS =====
  private configState = signal<DemographicsConfig | null>(null);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  // ===== PUBLIC SIGNALS =====
  readonly config = this.configState.asReadonly();
  readonly loading = this.isLoading.asReadonly();
  readonly configError = this.error.asReadonly();

  // ===== REALTIME RELOAD =====
  private reloadSubject = new BehaviorSubject<void>(undefined);
  reload$ = this.reloadSubject.asObservable();

  // ===== STORAGE & CACHE =====
  private readonly STORAGE_KEY = 'kapify_demographics_config';
  private readonly CACHE_VERSION = 'v1';
  private readonly MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;

  constructor() {
    this.initializeConfig();
  }

  /**
   * Initialize config on service creation
   */
  private async initializeConfig(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const config = await this.loadFromSupabase();
      this.configState.set(config);
      this.saveToLocalStorage(config);
      this.reloadSubject.next();
      console.log(
        '✅ Demographics config loaded from Supabase:',
        config.categories.length,
        'categories'
      );
    } catch (err) {
      console.warn('⚠️ Supabase load failed, trying localStorage:', err);

      try {
        const config = this.loadFromLocalStorage();
        if (config) {
          this.configState.set(config);
          this.error.set('Using cached config. Some changes may be outdated.');
          this.reloadSubject.next();
          console.log('✅ Demographics config loaded from localStorage');
        } else {
          throw new Error('No cached config available');
        }
      } catch (cacheErr) {
        console.warn(
          '⚠️ LocalStorage load failed, using hardcoded fallback:',
          cacheErr
        );
        const config = this.getHardcodedFallback();
        this.configState.set(config);
        this.error.set(
          'Using fallback config. Please contact support if this persists.'
        );
        this.reloadSubject.next();
        console.log('✅ Demographics config loaded from hardcoded fallback');
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Reload config from Supabase
   */
  async reloadConfig(): Promise<DemographicsConfig | null> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const config = await this.loadFromSupabase();
      this.configState.set(config);
      this.saveToLocalStorage(config);
      this.reloadSubject.next();
      console.log('✅ Demographics config reloaded');
      return config;
    } catch (err) {
      console.error('❌ Failed to reload config:', err);
      this.error.set('Failed to reload config');
      return null;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Load config from Supabase
   */
  private async loadFromSupabase(): Promise<DemographicsConfig> {
    try {
      const { data: categoriesData, error: catError } = await this.supabase
        .from('demographics_categories')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (catError) throw catError;
      if (!categoriesData || categoriesData.length === 0) {
        throw new Error('No demographic categories found in Supabase');
      }

      const { data: fieldsData, error: fieldError } = await this.supabase
        .from('demographics_fields')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (fieldError) throw fieldError;

      // Build category objects with fields
      const categories: DemographicCategory[] = categoriesData.map((cat) => ({
        id: cat.id,
        label: cat.label,
        description: cat.description,
        order: cat.order_index,
        fields: (fieldsData || [])
          .filter((f) => f.category_id === cat.id)
          .map((f) => this.mapFieldFromDb(f)),
      }));

      return {
        categories,
        loadedAt: new Date(),
        source: 'supabase',
      };
    } catch (err: any) {
      throw new Error(`Supabase load failed: ${err?.message}`);
    }
  }

  /**
   * Load config from localStorage
   */
  private loadFromLocalStorage(): DemographicsConfig | null {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      const loadedAt = new Date(parsed.loadedAt);
      const age = Date.now() - loadedAt.getTime();
      if (age > this.MAX_CACHE_AGE_MS) {
        console.warn('⚠️ Cached config is older than 24 hours');
      }

      return {
        ...parsed,
        loadedAt: new Date(parsed.loadedAt),
        source: 'localStorage',
      };
    } catch (err) {
      console.error('❌ Failed to parse localStorage config:', err);
      return null;
    }
  }

  /**
   * Save config to localStorage
   */
  private saveToLocalStorage(config: DemographicsConfig): void {
    try {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          version: this.CACHE_VERSION,
          ...config,
          loadedAt: config.loadedAt.toISOString(),
        })
      );
    } catch (err) {
      console.warn('Failed to save config to localStorage:', err);
    }
  }

  /**
   * Hardcoded fallback config
   */
  private getHardcodedFallback(): DemographicsConfig {
    return {
      categories: [
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
              min: 0,
              max: 100,
              placeholder: 'e.g., 45',
              helpText: 'Percentage of shareholding under Black Ownership',
            },
            {
              name: 'womanOwnership',
              label: 'Woman Ownership (%)',
              type: 'percentage',
              required: false,
              min: 0,
              max: 100,
              placeholder: 'e.g., 60',
              helpText: 'Percentage of shareholding held by women',
            },
            {
              name: 'womenBlackOwnership',
              label: 'Black Woman Ownership (%)',
              type: 'percentage',
              required: false,
              min: 0,
              max: 100,
              placeholder: 'e.g., 30',
              helpText: 'Percentage of shareholding held by Black women',
            },
            {
              name: 'youthOwnership',
              label: 'Youth Ownership (%)',
              type: 'percentage',
              required: false,
              min: 0,
              max: 100,
              placeholder: 'e.g., 51',
              helpText: 'Percentage of shareholding held by youth (under 35)',
            },
            {
              name: 'youthBlackOwnership',
              label: 'Black Youth Ownership (%)',
              type: 'percentage',
              required: false,
              min: 0,
              max: 100,
              placeholder: 'e.g., 40',
              helpText: 'Percentage of shareholding held by Black youth',
            },
            {
              name: 'disabilityOwnership',
              label: 'Disability Ownership (%)',
              type: 'percentage',
              required: false,
              min: 0,
              max: 100,
              placeholder: 'e.g., 25',
              helpText:
                'Percentage of shareholding held by individuals with disability',
            },
            {
              name: 'disabilityBlackOwnership',
              label: 'Black Disability Ownership (%)',
              type: 'percentage',
              required: false,
              min: 0,
              max: 100,
              placeholder: 'e.g., 15',
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
              min: 0,
              placeholder: 'e.g., 15',
              helpText: 'Number of jobs created in the last 12-24 months',
            },
            {
              name: 'expectedJobs',
              label: 'Expected Jobs (next 12-36 months)',
              type: 'number',
              required: false,
              min: 0,
              placeholder: 'e.g., 25',
              helpText:
                'Number of jobs expected to be created in the next 12-36 months',
            },
          ],
        },
      ],
      loadedAt: new Date(),
      source: 'hardcoded',
    };
  }

  /**
   * Map database field to DemographicField
   * Supabase columns: field_name, is_required, min_value, max_value, help_text
   * Model properties: name, required, min, max, helpText
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

    // Map Supabase column names to model property names
    return {
      name: f.field_name, // field_name → name
      label: f.label,
      type: f.type,
      required: f.is_required, // is_required → required
      placeholder: f.placeholder,
      options,
      min: f.min_value, // min_value → min
      max: f.max_value, // max_value → max
      helpText: f.help_text, // help_text → helpText
    };
  }

  /**
   * Get all active categories
   */
  getCategories(): DemographicCategory[] {
    return this.configState()?.categories || [];
  }

  /**
   * Get category by ID
   */
  getCategory(categoryId: string): DemographicCategory | undefined {
    return this.getCategories().find((c) => c.id === categoryId);
  }

  /**
   * Get all fields for a category
   */
  getFieldsByCategory(categoryId: string): DemographicField[] {
    const category = this.getCategory(categoryId);
    return category?.fields || [];
  }

  /**
   * Check if config is loaded
   */
  isLoaded(): boolean {
    return !!this.configState();
  }

  /**
   * Get config source
   */
  getSource(): 'supabase' | 'localStorage' | 'hardcoded' | null {
    return this.configState()?.source || null;
  }

  /**
   * Watch config changes - emits immediately if loaded, then on reload
   */
  watchConfigChanges(): Observable<DemographicsConfig | null> {
    return new Observable((subscriber) => {
      // Emit current state immediately if loaded
      const currentConfig = this.configState();
      if (currentConfig) {
        subscriber.next(currentConfig);
      }

      // Subscribe to reload events
      const subscription = this.reload$
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          const updated = this.configState();
          if (updated) {
            subscriber.next(updated);
          }
        });

      return () => subscription.unsubscribe();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
