// // src/app/admin/services/remote-constants.service.ts
// import { Injectable, inject, signal } from '@angular/core';
// import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

// export interface SelectOption {
//   value: string;
//   label: string;
// }

// export interface Constant {
//   id: string;
//   category_id: string;
//   category_key: string;
//   value_key: string;
//   display_label: string;
//   description?: string;
//   order_index: number;
//   is_active: boolean;
//   metadata?: Record<string, any>;
//   created_at: string;
//   updated_at: string;
//   created_by?: string;
//   updated_by?: string;
// }

// @Injectable({ providedIn: 'root' })
// export class SupabaseConstantsService {
//   private supabase = inject(SharedSupabaseService);

//   // Signals for reactive updates - must be readable in templates
//   readonly fundingOptions = signal<SelectOption[]>([]);
//   readonly industries = signal<SelectOption[]>([]);
//   readonly businessStages = signal<SelectOption[]>([]);
//   readonly geographicRegions = signal<SelectOption[]>([]);
//   readonly currencies = signal<SelectOption[]>([]);
//   readonly timeframes = signal<SelectOption[]>([]);

//   readonly isLoading = signal(false);
//   readonly error = signal<string | null>(null);

//   // Local storage key for backup
//   private readonly LOCAL_STORAGE_KEY = 'kapify_constants_backup';
//   private readonly CACHE_VERSION = 'v1';

//   constructor() {
//     // Auto-initialize on service creation
//     this.initialize();
//   }

//   async initialize(): Promise<void> {
//     this.isLoading.set(true);
//     try {
//       await this.loadAllConstants();
//       this.error.set(null);
//     } catch (err) {
//       // console.error('❌ Failed to load constants from Supabase:', err);
//       this.loadFromLocalBackup();
//       this.error.set('Using cached constants. Some data may be outdated.');
//     } finally {
//       this.isLoading.set(false);
//     }
//   }

//   private async loadAllConstants(): Promise<void> {
//     const categories = [
//       'funding_options',
//       'industries',
//       'business_stages',
//       'geographic_regions',
//       'currencies',
//     ];

//     const allConstants = await Promise.all(
//       categories.map((cat) => this.loadConstantsByCategory(cat))
//     );

//     // Map each category to its signal
//     this.fundingOptions.set(allConstants[0]);
//     this.industries.set(allConstants[1]);
//     this.businessStages.set(allConstants[2]);
//     this.geographicRegions.set(allConstants[3]);
//     this.currencies.set(allConstants[4]);

//     // console.log('📊 Constants loaded:', {
//     //   fundingOptions: allConstants[0].length,
//     //   industries: allConstants[1].length,
//     //   businessStages: allConstants[2].length,
//     //   geographicRegions: allConstants[3].length,
//     //   currencies: allConstants[4].length,
//     // });

//     // Save to local backup
//     this.saveToLocalBackup({
//       fundingOptions: allConstants[0],
//       industries: allConstants[1],
//       businessStages: allConstants[2],
//       geographicRegions: allConstants[3],
//       currencies: allConstants[4],
//     });
//   }

//   private async loadConstantsByCategory(
//     categoryKey: string
//   ): Promise<SelectOption[]> {
//     const { data, error } = await this.supabase
//       .from('constants')
//       .select('id, value_key, display_label, order_index')
//       .eq('category_key', categoryKey)
//       .eq('is_active', true)
//       .order('order_index', { ascending: true });

//     if (error) {
//       console.error(`Error loading ${categoryKey}:`, error);
//       throw error;
//     }

//     return (data || []).map((c: any) => ({
//       value: c.value_key,
//       label: c.display_label,
//     }));
//   }

//   // ===== ADMIN METHODS =====

//   async getAllConstants(): Promise<Constant[]> {
//     const { data, error } = await this.supabase
//       .from('constants')
//       .select('*')
//       .order('category_key')
//       .order('order_index');

//     if (error) throw error;
//     return data || [];
//   }

//   async getConstantsByCategory(categoryKey: string): Promise<Constant[]> {
//     const { data, error } = await this.supabase
//       .from('constants')
//       .select('*')
//       .eq('category_key', categoryKey)
//       .order('order_index', { ascending: true });

//     if (error) throw error;
//     return data || [];
//   }

//   async createConstant(
//     categoryId: string,
//     categoryKey: string,
//     valueKey: string,
//     displayLabel: string,
//     description?: string,
//     metadata?: Record<string, any>
//   ): Promise<Constant> {
//     const userId = this.supabase.getCurrentUserId();

//     const { data, error } = await this.supabase
//       .from('constants')
//       .insert([
//         {
//           category_id: categoryId,
//           category_key: categoryKey,
//           value_key: valueKey,
//           display_label: displayLabel,
//           description: description || null,
//           metadata: metadata || null,
//           created_by: userId,
//         },
//       ])
//       .select()
//       .single();

//     if (error) throw error;

//     // Reload constants
//     await this.loadAllConstants();
//     return data;
//   }

//   async updateConstant(
//     id: string,
//     updates: Partial<Constant>
//   ): Promise<Constant> {
//     const userId = this.supabase.getCurrentUserId();

//     const { data, error } = await this.supabase
//       .from('constants')
//       .update({
//         ...updates,
//         updated_by: userId,
//         updated_at: new Date().toISOString(),
//       })
//       .eq('id', id)
//       .select()
//       .single();

//     if (error) throw error;

//     // Reload constants
//     await this.loadAllConstants();
//     return data;
//   }

//   async toggleConstantActive(id: string, isActive: boolean): Promise<Constant> {
//     return this.updateConstant(id, { is_active: isActive });
//   }

//   async deleteConstant(id: string): Promise<void> {
//     const { error } = await this.supabase
//       .from('constants')
//       .delete()
//       .eq('id', id);

//     if (error) throw error;

//     // Reload constants
//     await this.loadAllConstants();
//   }

//   async reorderConstants(
//     updates: Array<{ id: string; order_index: number }>
//   ): Promise<void> {
//     const promises = updates.map((update) =>
//       this.supabase
//         .from('constants')
//         .update({ order_index: update.order_index })
//         .eq('id', update.id)
//     );

//     const results = await Promise.all(promises);
//     const hasError = results.some((r) => r.error);

//     if (hasError) {
//       throw new Error('Failed to reorder constants');
//     }

//     // Reload constants
//     await this.loadAllConstants();
//   }

//   // ===== BACKUP & RECOVERY =====

//   private saveToLocalBackup(data: Record<string, SelectOption[]>): void {
//     try {
//       const backup = {
//         version: this.CACHE_VERSION,
//         timestamp: new Date().toISOString(),
//         data,
//       };
//       localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(backup));
//     } catch (err) {
//       console.error('Failed to save constants to local backup:', err);
//     }
//   }

//   private loadFromLocalBackup(): void {
//     try {
//       const backup = localStorage.getItem(this.LOCAL_STORAGE_KEY);
//       if (!backup) {
//         console.warn('⚠️ No local backup found, using empty arrays');
//         return;
//       }

//       const parsed = JSON.parse(backup);
//       if (parsed.data) {
//         this.fundingOptions.set(parsed.data.fundingOptions || []);
//         this.industries.set(parsed.data.industries || []);
//         this.businessStages.set(parsed.data.businessStages || []);
//         this.geographicRegions.set(parsed.data.geographicRegions || []);
//         this.currencies.set(parsed.data.currencies || []);
//       }
//     } catch (err) {
//       console.error('Failed to load local backup:', err);
//     }
//   }

//   async getBackupHistory(limit: number = 50): Promise<any[]> {
//     const { data, error } = await this.supabase
//       .from('constants_backup')
//       .select('*')
//       .order('backed_up_at', { ascending: false })
//       .limit(limit);

//     if (error) throw error;
//     return data || [];
//   }

//   async restoreFromBackup(backupId: string): Promise<void> {
//     const { data: backup, error: fetchError } = await this.supabase
//       .from('constants_backup')
//       .select('*')
//       .eq('id', backupId)
//       .single();

//     if (fetchError) throw fetchError;

//     if (backup.action === 'deleted' && backup.new_values) {
//       // Restore the original constant
//       const original = backup.new_values;
//       const { error: restoreError } = await this.supabase
//         .from('constants')
//         .insert([
//           {
//             id: original.id,
//             category_id: original.category_id,
//             category_key: original.category_key,
//             value_key: original.value_key,
//             display_label: original.display_label,
//             description: original.description,
//             order_index: original.order_index,
//             is_active: original.is_active,
//           },
//         ]);

//       if (restoreError) throw restoreError;
//     }

//     // Reload constants
//     await this.loadAllConstants();
//   }

//   // ===== UTILITY METHODS =====

//   async getCategoryId(categoryKey: string): Promise<string> {
//     const { data, error } = await this.supabase
//       .from('constants_categories')
//       .select('id')
//       .eq('category_key', categoryKey)
//       .single();

//     if (error) throw error;
//     return data?.id || '';
//   }

//   findOption(options: SelectOption[], value: string): SelectOption | undefined {
//     return options.find((o) => o.value === value);
//   }

//   getOptionLabel(options: SelectOption[], value: string): string {
//     return this.findOption(options, value)?.label || value;
//   }

//   exportConstantsAsJSON(): string {
//     return JSON.stringify(
//       {
//         fundingOptions: this.fundingOptions(),
//         industries: this.industries(),
//         businessStages: this.businessStages(),
//         geographicRegions: this.geographicRegions(),
//         currencies: this.currencies(),
//         exportedAt: new Date().toISOString(),
//       },
//       null,
//       2
//     );
//   }
// }

// src/app/admin/services/remote-constants.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface SelectOption {
  value: string;
  label: string;
}

export interface Constant {
  id: string;
  category_id: string;
  category_key: string;
  value_key: string;
  display_label: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseConstantsService {
  private supabase = inject(SharedSupabaseService);

  // Signals for reactive updates - must be readable in templates
  readonly fundingOptions = signal<SelectOption[]>([]);
  readonly industries = signal<SelectOption[]>([]);
  readonly businessStages = signal<SelectOption[]>([]);
  readonly geographicRegions = signal<SelectOption[]>([]);
  readonly currencies = signal<SelectOption[]>([]);
  readonly investorTypes = signal<SelectOption[]>([]);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // Local storage key for backup
  private readonly LOCAL_STORAGE_KEY = 'kapify_constants_backup';
  private readonly CACHE_VERSION = 'v1';

  constructor() {
    // Auto-initialize on service creation
    this.initialize();
  }

  async initialize(): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.loadAllConstants();
      this.error.set(null);
    } catch (err) {
      // console.error('❌ Failed to load constants from Supabase:', err);
      this.loadFromLocalBackup();
      this.error.set('Using cached constants. Some data may be outdated.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadAllConstants(): Promise<void> {
    const categories = [
      'funding_options',
      'industries',
      'business_stages',
      'geographic_regions',
      'currencies',
      'investor_types',
    ];

    const allConstants = await Promise.all(
      categories.map((cat) => this.loadConstantsByCategory(cat))
    );

    // Map each category to its signal
    this.fundingOptions.set(allConstants[0]);
    this.industries.set(allConstants[1]);
    this.businessStages.set(allConstants[2]);
    this.geographicRegions.set(allConstants[3]);
    this.currencies.set(allConstants[4]);
    this.investorTypes.set(allConstants[5]);

    // console.log('📊 Constants loaded:', {
    //   fundingOptions: allConstants[0].length,
    //   industries: allConstants[1].length,
    //   businessStages: allConstants[2].length,
    //   geographicRegions: allConstants[3].length,
    //   currencies: allConstants[4].length,
    //   investorTypes: allConstants[5].length,
    // });

    // Save to local backup
    this.saveToLocalBackup({
      fundingOptions: allConstants[0],
      industries: allConstants[1],
      businessStages: allConstants[2],
      geographicRegions: allConstants[3],
      currencies: allConstants[4],
      investorTypes: allConstants[5],
    });
  }

  private async loadConstantsByCategory(
    categoryKey: string
  ): Promise<SelectOption[]> {
    const { data, error } = await this.supabase
      .from('constants')
      .select('id, value_key, display_label, order_index')
      .eq('category_key', categoryKey)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error(`Error loading ${categoryKey}:`, error);
      throw error;
    }

    return (data || []).map((c: any) => ({
      value: c.value_key,
      label: c.display_label,
    }));
  }

  // ===== ADMIN METHODS =====

  async getAllConstants(): Promise<Constant[]> {
    const { data, error } = await this.supabase
      .from('constants')
      .select('*')
      .order('category_key')
      .order('order_index');

    if (error) throw error;
    return data || [];
  }

  async getConstantsByCategory(categoryKey: string): Promise<Constant[]> {
    const { data, error } = await this.supabase
      .from('constants')
      .select('*')
      .eq('category_key', categoryKey)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async createConstant(
    categoryId: string,
    categoryKey: string,
    valueKey: string,
    displayLabel: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<Constant> {
    const userId = this.supabase.getCurrentUserId();

    const { data, error } = await this.supabase
      .from('constants')
      .insert([
        {
          category_id: categoryId,
          category_key: categoryKey,
          value_key: valueKey,
          display_label: displayLabel,
          description: description || null,
          metadata: metadata || null,
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Reload constants
    await this.loadAllConstants();
    return data;
  }

  async updateConstant(
    id: string,
    updates: Partial<Constant>
  ): Promise<Constant> {
    const userId = this.supabase.getCurrentUserId();

    const { data, error } = await this.supabase
      .from('constants')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Reload constants
    await this.loadAllConstants();
    return data;
  }

  async toggleConstantActive(id: string, isActive: boolean): Promise<Constant> {
    return this.updateConstant(id, { is_active: isActive });
  }

  async deleteConstant(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('constants')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Reload constants
    await this.loadAllConstants();
  }

  async reorderConstants(
    updates: Array<{ id: string; order_index: number }>
  ): Promise<void> {
    const promises = updates.map((update) =>
      this.supabase
        .from('constants')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
    );

    const results = await Promise.all(promises);
    const hasError = results.some((r) => r.error);

    if (hasError) {
      throw new Error('Failed to reorder constants');
    }

    // Reload constants
    await this.loadAllConstants();
  }

  // ===== BACKUP & RECOVERY =====

  private saveToLocalBackup(data: Record<string, SelectOption[]>): void {
    try {
      const backup = {
        version: this.CACHE_VERSION,
        timestamp: new Date().toISOString(),
        data,
      };
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(backup));
    } catch (err) {
      console.error('Failed to save constants to local backup:', err);
    }
  }

  private loadFromLocalBackup(): void {
    try {
      const backup = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!backup) {
        console.warn('⚠️ No local backup found, using empty arrays');
        return;
      }

      const parsed = JSON.parse(backup);
      if (parsed.data) {
        this.fundingOptions.set(parsed.data.fundingOptions || []);
        this.industries.set(parsed.data.industries || []);
        this.businessStages.set(parsed.data.businessStages || []);
        this.geographicRegions.set(parsed.data.geographicRegions || []);
        this.currencies.set(parsed.data.currencies || []);
        this.investorTypes.set(parsed.data.investorTypes || []);
      }
    } catch (err) {
      console.error('Failed to load local backup:', err);
    }
  }

  async getBackupHistory(limit: number = 50): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('constants_backup')
      .select('*')
      .order('backed_up_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async restoreFromBackup(backupId: string): Promise<void> {
    const { data: backup, error: fetchError } = await this.supabase
      .from('constants_backup')
      .select('*')
      .eq('id', backupId)
      .single();

    if (fetchError) throw fetchError;

    if (backup.action === 'deleted' && backup.new_values) {
      // Restore the original constant
      const original = backup.new_values;
      const { error: restoreError } = await this.supabase
        .from('constants')
        .insert([
          {
            id: original.id,
            category_id: original.category_id,
            category_key: original.category_key,
            value_key: original.value_key,
            display_label: original.display_label,
            description: original.description,
            order_index: original.order_index,
            is_active: original.is_active,
          },
        ]);

      if (restoreError) throw restoreError;
    }

    // Reload constants
    await this.loadAllConstants();
  }

  // ===== UTILITY METHODS =====

  async getCategoryId(categoryKey: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('constants_categories')
      .select('id')
      .eq('category_key', categoryKey)
      .single();

    if (error) throw error;
    return data?.id || '';
  }

  findOption(options: SelectOption[], value: string): SelectOption | undefined {
    return options.find((o) => o.value === value);
  }

  getOptionLabel(options: SelectOption[], value: string): string {
    return this.findOption(options, value)?.label || value;
  }

  exportConstantsAsJSON(): string {
    return JSON.stringify(
      {
        fundingOptions: this.fundingOptions(),
        industries: this.industries(),
        businessStages: this.businessStages(),
        geographicRegions: this.geographicRegions(),
        currencies: this.currencies(),
        investorTypes: this.investorTypes(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }
}
