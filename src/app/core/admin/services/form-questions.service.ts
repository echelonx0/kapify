// src/app/admin/services/back-office-form-questions.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export interface BackOfficeFormQuestion {
  id: string;
  field_name: string;
  label: string;
  placeholder?: string;
  hint?: string;
  order_index: number;
  is_required: boolean;
  input_type: 'text' | 'number' | 'select' | 'textarea';
  field_group?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

@Injectable({ providedIn: 'root' })
export class BackOfficeFormQuestionsService {
  private supabase = inject(SharedSupabaseService);

  readonly allQuestions = signal<BackOfficeFormQuestion[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  async loadAllQuestions(): Promise<BackOfficeFormQuestion[]> {
    this.isLoading.set(true);
    // console.log('🟢 Service: loadAllQuestions() started');
    try {
      // console.log('🟢 Service: Querying back_office_form_questions table');
      const { data, error } = await this.supabase
        .from('back_office_form_questions')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      // console.log('🟢 Service: Query response - error:', error);
      // console.log('🟢 Service: Query response - data:', data);

      if (error) {
        console.error('🟢 Service: Query error details:', error);
        throw error;
      }

      const questions = (data || []) as BackOfficeFormQuestion[];
      // console.log('🟢 Service: Parsed questions:', questions);
      // console.log('🟢 Service: Questions count:', questions.length);

      this.allQuestions.set(questions);
      // console.log(
      //   '🟢 Service: Signal updated with',
      //   questions.length,
      //   'questions'
      // );
      // console.log('🟢 Service: Signal value after set:', this.allQuestions());

      return questions;
    } catch (err) {
      //   console.error('❌ Service: Failed to load back office questions:', err);
      this.error.set('Failed to load form questions');
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateQuestion(
    id: string,
    updates: Partial<BackOfficeFormQuestion>
  ): Promise<void> {
    const userId = this.supabase.getCurrentUserId();
    const { error } = await this.supabase
      .from('back_office_form_questions')
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
    await this.loadAllQuestions();
  }

  async createQuestion(
    question: Omit<
      BackOfficeFormQuestion,
      'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'
    >
  ): Promise<void> {
    const userId = this.supabase.getCurrentUserId();
    const { error } = await this.supabase
      .from('back_office_form_questions')
      .insert([{ ...question, created_by: userId }]);

    if (error) throw error;
    await this.loadAllQuestions();
  }

  async deleteQuestion(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('back_office_form_questions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await this.loadAllQuestions();
  }

  async toggleActive(id: string, isActive: boolean): Promise<void> {
    await this.updateQuestion(id, { is_active: isActive });
  }
}
