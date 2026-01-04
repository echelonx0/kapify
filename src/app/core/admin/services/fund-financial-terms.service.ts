// src/app/admin/services/fund-financial-terms.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface FundFinancialTerm {
  id: string;
  field_name: string;
  label: string;
  placeholder?: string;
  hint?: string;
  order_index: number;
  is_required: boolean;
  input_type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  field_group?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

@Injectable({ providedIn: 'root' })
export class FundFinancialTermsService {
  private supabase = inject(SharedSupabaseService);

  readonly allTerms = signal<FundFinancialTerm[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  async loadAllTerms(): Promise<FundFinancialTerm[]> {
    this.isLoading.set(true);
    console.log('🔵 FundFinancialTermsService: loadAllTerms() started');
    try {
      console.log('🔵 Querying fund_financial_terms table');
      const { data, error } = await this.supabase
        .from('fund_financial_terms')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      console.log('🔵 Query response - error:', error);
      console.log('🔵 Query response - data:', data);

      if (error) {
        console.error('🔵 Query error details:', error);
        throw error;
      }

      const terms = (data || []) as FundFinancialTerm[];
      console.log('🔵 Parsed terms:', terms);
      console.log('🔵 Terms count:', terms.length);

      this.allTerms.set(terms);
      console.log('🔵 Signal updated with', terms.length, 'terms');
      console.log('🔵 Signal value after set:', this.allTerms());

      return terms;
    } catch (err) {
      console.error('❌ Failed to load fund financial terms:', err);
      this.error.set('Failed to load financial terms');
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateTerm(
    id: string,
    updates: Partial<FundFinancialTerm>
  ): Promise<void> {
    const userId = this.supabase.getCurrentUserId();
    const { error } = await this.supabase
      .from('fund_financial_terms')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    await this.loadAllTerms();
  }

  async createTerm(
    term: Omit<
      FundFinancialTerm,
      'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
    >
  ): Promise<void> {
    const userId = this.supabase.getCurrentUserId();
    const { error } = await this.supabase
      .from('fund_financial_terms')
      .insert([{ ...term, created_by: userId }]);

    if (error) throw error;
    await this.loadAllTerms();
  }

  async deleteTerm(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('fund_financial_terms')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await this.loadAllTerms();
  }

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await this.updateTerm(id, { is_active: isActive });
  }
}
