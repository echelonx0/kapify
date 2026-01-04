import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';

export interface Guide {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  content: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface GuideViewTrack {
  guide_id: string;
  user_id: string;
  viewed_at: string;
}

export interface GuideStat {
  id: string;
  title: string;
  category: string;
  total_views: number;
  last_viewed_at?: string;
  sort_order: number;
}

@Injectable({ providedIn: 'root' })
export class GuideService {
  private supabase = inject(SharedSupabaseService);

  // State
  private allGuidesSubject = new BehaviorSubject<Guide[]>([]);
  allGuides$ = this.allGuidesSubject.asObservable();

  isLoading = signal(false);
  error = signal<string | null>(null);

  // Computed
  activeGuides = computed(() =>
    this.allGuidesSubject.value.filter((g) => g.is_active)
  );

  categories = computed(() => {
    const cats = new Set(this.allGuidesSubject.value.map((g) => g.category));
    return Array.from(cats).sort();
  });

  // ===== USER METHODS =====

  /**
   * Get all active guides for user display
   */
  getAllGuides(): Observable<Guide[]> {
    this.isLoading.set(true);
    return from(this.fetchAllGuides()).pipe(
      tap((guides) => {
        this.allGuidesSubject.next(guides);
        this.isLoading.set(false);
      }),
      catchError((err) => {
        console.error('Failed to load guides:', err);
        this.error.set('Failed to load guides');
        this.isLoading.set(false);
        return from([]);
      })
    );
  }

  /**
   * Get guides by category
   */
  getGuidesByCategory(category: string): Observable<Guide[]> {
    return this.allGuides$.pipe(
      map((guides) =>
        guides
          .filter((g) => g.category === category && g.is_active)
          .sort((a, b) => a.sort_order - b.sort_order)
      )
    );
  }

  /**
   * Get random unviewed guides (for recommendations)
   */
  async getRandomUnviewedGuides(limit: number = 3): Promise<Guide[]> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) return [];

    try {
      // Get all guides
      const allGuides = this.allGuidesSubject.value.filter((g) => g.is_active);

      // Get viewed guides
      const { data: viewedData } = await this.supabase
        .from('guide_views')
        .select('guide_id')
        .eq('user_id', userId);

      const viewedIds = new Set((viewedData || []).map((v) => v.guide_id));

      // Find unviewed guides
      const unviewed = allGuides.filter((g) => !viewedIds.has(g.id));

      // Shuffle and return
      return unviewed.sort(() => Math.random() - 0.5).slice(0, limit);
    } catch (err) {
      console.error('Failed to get random guides:', err);
      return [];
    }
  }

  /**
   * Track guide view
   */
  trackGuideView(guideId: string): Observable<void> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return from([undefined]);
    }

    return from(
      this.supabase
        .from('guide_views')
        .upsert({
          guide_id: guideId,
          user_id: userId,
          viewed_at: new Date().toISOString(),
        })
        .then(() => undefined)
    ).pipe(
      catchError((err) => {
        console.warn('Failed to track guide view:', err);
        return from([undefined]);
      })
    );
  }

  /**
   * Check if user has viewed a guide
   */
  async hasViewedGuide(guideId: string): Promise<boolean> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) return false;

    try {
      const { data } = await this.supabase
        .from('guide_views')
        .select('id')
        .eq('guide_id', guideId)
        .eq('user_id', userId)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  // ===== ADMIN METHODS =====

  /**
   * Get all guides (admin - includes inactive)
   */
  async getGuidesForAdmin(): Promise<Guide[]> {
    const { data, error } = await this.supabase
      .from('guides')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as Guide[];
  }

  /**
   * Get guide statistics (admin dashboard)
   */
  async getGuideStats(): Promise<GuideStat[]> {
    const { data, error } = await this.supabase
      .from('guide_stats')
      .select('*');

    if (error) throw error;
    return (data || []) as GuideStat[];
  }

  /**
   * Create guide
   */
  async createGuide(
    guide: Omit<Guide, 'id' | 'created_at' | 'updated_at' | 'created_by'>
  ): Promise<Guide> {
    const userId = this.supabase.getCurrentUserId();
    const { data, error } = await this.supabase
      .from('guides')
      .insert([{ ...guide, created_by: userId }])
      .select()
      .single();

    if (error) throw error;
    return data as Guide;
  }

  /**
   * Update guide
   */
  async updateGuide(
    id: string,
    updates: Partial<Omit<Guide, 'id' | 'created_at' | 'created_by'>>
  ): Promise<Guide> {
    const userId = this.supabase.getCurrentUserId();
    const { data, error } = await this.supabase
      .from('guides')
      .update({ ...updates, updated_by: userId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Guide;
  }

  /**
   * Delete guide
   */
  async deleteGuide(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('guides')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Bulk update guides (reorder)
   */
  async reorderGuides(guides: Array<{ id: string; sort_order: number }>): Promise<void> {
    const userId = this.supabase.getCurrentUserId();
    const updates = guides.map((g) => ({
      ...g,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await this.supabase
      .from('guides')
      .upsert(updates);

    if (error) throw error;
  }

  // ===== PRIVATE HELPERS =====

  private async fetchAllGuides(): Promise<Guide[]> {
    const { data, error } = await this.supabase
      .from('guides')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as Guide[];
  }
}
