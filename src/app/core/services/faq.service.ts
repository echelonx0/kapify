import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  user_type: 'sme' | 'funder' | 'both';
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

@Injectable({ providedIn: 'root' })
export class FAQService {
  private supabase = inject(SharedSupabaseService);

  private allFAQsSubject = new BehaviorSubject<FAQ[]>([]);
  allFAQs$ = this.allFAQsSubject.asObservable();

  isLoading = signal(false);
  error = signal<string | null>(null);

  // Get all FAQs regardless of user type
  getFAQs(): Observable<FAQ[]> {
    this.isLoading.set(true);
    return from(this.fetchFAQs()).pipe(
      tap((faqs) => {
        this.allFAQsSubject.next(faqs);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        console.error('Failed to load FAQs:', err);
        this.error.set('Failed to load FAQs');
        this.isLoading.set(false);
        return from([]);
      })
    );
  }

  // Get FAQs by category
  getFAQsByCategory(category: string): Observable<FAQ[]> {
    return this.allFAQs$.pipe(
      map((faqs) =>
        faqs
          .filter((f) => f.category === category)
          .sort((a, b) => a.sort_order - b.sort_order)
      )
    );
  }

  // Get all categories
  getCategories(): Observable<string[]> {
    return this.allFAQs$.pipe(
      map((faqs) => {
        const cats = new Set(faqs.map((f) => f.category));
        return Array.from(cats).sort();
      })
    );
  }

  // Admin: Get all FAQs
  async getAdminFAQs(): Promise<FAQ[]> {
    const { data, error } = await this.supabase
      .from('faqs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as FAQ[];
  }

  // Admin: Create FAQ
  async createFAQ(
    faq: Omit<FAQ, 'id' | 'created_at' | 'updated_at' | 'created_by'>
  ): Promise<FAQ> {
    const userId = this.supabase.getCurrentUserId();
    const { data, error } = await this.supabase
      .from('faqs')
      .insert([{ ...faq, created_by: userId }])
      .select()
      .single();

    if (error) throw error;
    return data as FAQ;
  }

  // Admin: Update FAQ
  async updateFAQ(
    id: string,
    updates: Partial<Omit<FAQ, 'id' | 'created_at' | 'created_by'>>
  ): Promise<FAQ> {
    const userId = this.supabase.getCurrentUserId();
    const { data, error } = await this.supabase
      .from('faqs')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FAQ;
  }

  // Admin: Delete FAQ
  async deleteFAQ(id: string): Promise<void> {
    const { error } = await this.supabase.from('faqs').delete().eq('id', id);
    if (error) throw error;
  }

  private async fetchFAQs(): Promise<FAQ[]> {
    const { data, error } = await this.supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('FAQ Query Error:', error);
      throw error;
    }
    return (data || []) as FAQ[];
  }

  /**
   * Get FAQs filtered by user type
   * Returns FAQs where user_type matches OR user_type is 'both'
   */
  getFAQsByUserType(userType: 'sme' | 'funder'): Observable<FAQ[]> {
    return from(this.fetchFAQsByUserType(userType)).pipe(
      catchError((error) => {
        console.error(`Failed to fetch FAQs for user type ${userType}:`, error);
        throw error;
      })
    );
  }

  /**
   * Fetch FAQs filtered by user type
   * Includes both user-type-specific FAQs and 'both' FAQs
   */
  private async fetchFAQsByUserType(
    userType: 'sme' | 'funder'
  ): Promise<FAQ[]> {
    const { data, error } = await this.supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .or(`user_type.eq.${userType},user_type.eq.both`)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data || []).map((faq) => this.transformFAQ(faq));
  }

  /**
   * Transform database FAQ to client format
   */
  private transformFAQ(dbFAQ: any): FAQ {
    return {
      id: dbFAQ.id,
      question: dbFAQ.question,
      answer: dbFAQ.answer,
      category: dbFAQ.category,
      user_type: dbFAQ.user_type,
      sort_order: dbFAQ.sort_order || 0,
      is_active: dbFAQ.is_active ?? true,
      created_at: dbFAQ.created_at,
      updated_at: dbFAQ.updated_at,
    };
  }
}
