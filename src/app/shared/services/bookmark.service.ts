import { Injectable } from '@angular/core';
import { Observable, of, throwError, from } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/production.auth.service';
import { SharedSupabaseService } from './shared-supabase.service';

@Injectable({ providedIn: 'root' })
export class BookmarkService {
  constructor(
    private auth: AuthService,
    private supabaseService: SharedSupabaseService
  ) {}

  /**
   * Check if user has bookmarked an opportunity
   */
  isBookmarked(opportunityId: string): Observable<boolean> {
    const user = this.auth.user();
    if (!user?.id) return of(false);

    return from(
      this.supabaseService
        .from('opportunity_bookmarks')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('opportunity_id', opportunityId)
    ).pipe(
      map((result) => {
        if (result.error) {
          console.error('Bookmark check error:', result.error);
          return false;
        }
        return !!result.data && result.data.length > 0;
      }),
      catchError((error) => {
        console.error('Bookmark check error:', error);
        return of(false);
      })
    );
  }

  /**
   * Get all bookmarks for current user
   */
  getUserBookmarks(): Observable<string[]> {
    const user = this.auth.user();
    if (!user?.id) return of([]);

    return from(
      this.supabaseService
        .from('opportunity_bookmarks')
        .select('opportunity_id')
        .eq('user_id', user.id)
    ).pipe(
      map((result) => {
        if (result.error) {
          console.error('Get bookmarks error:', result.error);
          return [];
        }
        return result.data?.map((b: any) => b.opportunity_id) || [];
      }),
      catchError((error) => {
        console.error('Get bookmarks error:', error);
        return of([]);
      })
    );
  }

  /**
   * Add bookmark
   */
  addBookmark(opportunityId: string): Observable<void> {
    const user = this.auth.user();
    if (!user?.id) {
      return throwError(() => new Error('Not authenticated'));
    }

    return from(
      this.supabaseService.from('opportunity_bookmarks').insert({
        user_id: user.id,
        opportunity_id: opportunityId,
      })
    ).pipe(
      map(() => undefined),
      catchError((error) => {
        console.error('Add bookmark error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Remove bookmark
   */
  removeBookmark(opportunityId: string): Observable<void> {
    const user = this.auth.user();
    if (!user?.id) {
      return throwError(() => new Error('Not authenticated'));
    }

    return from(
      this.supabaseService
        .from('opportunity_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('opportunity_id', opportunityId)
    ).pipe(
      map(() => undefined),
      catchError((error) => {
        console.error('Remove bookmark error:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Toggle bookmark (add if not bookmarked, remove if bookmarked)
   */
  toggleBookmark(opportunityId: string): Observable<boolean> {
    return this.isBookmarked(opportunityId).pipe(
      switchMap((bookmarked) =>
        bookmarked
          ? this.removeBookmark(opportunityId).pipe(map(() => false))
          : this.addBookmark(opportunityId).pipe(map(() => true))
      ),
      catchError((error) => {
        console.error('Toggle bookmark error:', error);
        return throwError(() => error);
      })
    );
  }
}
