// src/app/shared/services/feedback.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export type FeedbackType = 'bug' | 'feature';
export type FeedbackStatus =
  | 'submitted'
  | 'under_review'
  | 'in_progress'
  | 'completed'
  | 'wont_fix'
  | 'duplicate';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Feedback {
  id: string;
  userId: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  category?: string;
  upvotes: number;
  browserInfo?: any;
  pageUrl?: string;
  assignedTo?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;

  // From joined data
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
  commentCount?: number;
  userHasUpvoted?: boolean;
}

export interface FeedbackComment {
  id: string;
  feedbackId: string;
  userId: string;
  comment: string;
  isAdmin: boolean;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;

  // From joined data
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
}

export interface CreateFeedbackInput {
  type: FeedbackType;
  title: string;
  description: string;
  category?: string;
  browserInfo?: any;
  pageUrl?: string;
}

export interface CreateCommentInput {
  feedbackId: string;
  comment: string;
  isInternal?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  private feedbackSubject = new BehaviorSubject<Feedback[]>([]);
  public feedback$ = this.feedbackSubject.asObservable();

  // ===============================
  // CREATE FEEDBACK
  // ===============================

  createFeedback(input: CreateFeedbackInput): Observable<Feedback> {
    const user = this.authService.user();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const feedbackData = {
      user_id: user.id,
      type: input.type,
      title: input.title,
      description: input.description,
      category: input.category || null,
      browser_info: input.browserInfo || null,
      page_url: input.pageUrl || null,
      status: 'submitted',
      priority: 'medium',
      upvotes: 0,
    };

    return from(
      this.supabase.from('feedback').insert(feedbackData).select('*').single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseToFeedback(data);
      }),
      tap((feedback) => {
        console.log('✅ Feedback created:', feedback);
      }),
      catchError((error) => {
        console.error('❌ Failed to create feedback:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // GET FEEDBACK
  // ===============================

  getAllFeedback(): Observable<Feedback[]> {
    return from(
      this.supabase
        .from('feedback_with_details')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((item) => this.mapDatabaseToFeedback(item));
      }),
      tap((feedback) => {
        this.feedbackSubject.next(feedback);
      }),
      catchError((error) => {
        console.error('❌ Failed to get feedback:', error);
        return throwError(() => error);
      })
    );
  }

  getMyFeedback(): Observable<Feedback[]> {
    const user = this.authService.user();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabase
        .from('feedback')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((item) => this.mapDatabaseToFeedback(item));
      }),
      catchError((error) => {
        console.error('❌ Failed to get my feedback:', error);
        return throwError(() => error);
      })
    );
  }

  getFeedbackById(id: string): Observable<Feedback> {
    return from(
      this.supabase
        .from('feedback_with_details')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseToFeedback(data);
      }),
      catchError((error) => {
        console.error('❌ Failed to get feedback:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // UPDATE FEEDBACK (Admin only)
  // ===============================

  updateFeedbackStatus(
    id: string,
    status: FeedbackStatus,
    adminNotes?: string
  ): Observable<Feedback> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (adminNotes) {
      updates.admin_notes = adminNotes;
    }

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    return from(
      this.supabase
        .from('feedback')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseToFeedback(data);
      }),
      tap(() => {
        // Refresh feedback list
        this.getAllFeedback().subscribe();
      }),
      catchError((error) => {
        console.error('❌ Failed to update feedback:', error);
        return throwError(() => error);
      })
    );
  }

  updateFeedbackPriority(
    id: string,
    priority: FeedbackPriority
  ): Observable<Feedback> {
    return from(
      this.supabase
        .from('feedback')
        .update({ priority, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseToFeedback(data);
      }),
      tap(() => {
        this.getAllFeedback().subscribe();
      }),
      catchError((error) => {
        console.error('❌ Failed to update priority:', error);
        return throwError(() => error);
      })
    );
  }

  assignFeedback(id: string, userId: string): Observable<Feedback> {
    return from(
      this.supabase
        .from('feedback')
        .update({ assigned_to: userId, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseToFeedback(data);
      }),
      tap(() => {
        this.getAllFeedback().subscribe();
      }),
      catchError((error) => {
        console.error('❌ Failed to assign feedback:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // UPVOTES
  // ===============================

  upvoteFeedback(feedbackId: string): Observable<void> {
    const user = this.authService.user();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabase
        .from('feedback_upvotes')
        .insert({ feedback_id: feedbackId, user_id: user.id })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => {
        this.getAllFeedback().subscribe();
      }),
      catchError((error) => {
        console.error('❌ Failed to upvote:', error);
        return throwError(() => error);
      })
    );
  }

  removeUpvote(feedbackId: string): Observable<void> {
    const user = this.authService.user();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabase
        .from('feedback_upvotes')
        .delete()
        .eq('feedback_id', feedbackId)
        .eq('user_id', user.id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => {
        this.getAllFeedback().subscribe();
      }),
      catchError((error) => {
        console.error('❌ Failed to remove upvote:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // COMMENTS
  // ===============================

  getComments(feedbackId: string): Observable<FeedbackComment[]> {
    return from(
      this.supabase
        .from('feedback_comments')
        .select(
          `
          *,
          users:user_id (
            email,
            raw_user_meta_data
          )
        `
        )
        .eq('feedback_id', feedbackId)
        .order('created_at', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((item) => this.mapDatabaseToComment(item));
      }),
      catchError((error) => {
        console.error('❌ Failed to get comments:', error);
        return throwError(() => error);
      })
    );
  }

  createComment(input: CreateCommentInput): Observable<FeedbackComment> {
    const user = this.authService.user();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const commentData = {
      feedback_id: input.feedbackId,
      user_id: user.id,
      comment: input.comment,
      is_admin: false, // This should be set based on user role
      is_internal: input.isInternal || false,
    };

    return from(
      this.supabase
        .from('feedback_comments')
        .insert(commentData)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseToComment(data);
      }),
      catchError((error) => {
        console.error('❌ Failed to create comment:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // DELETE FEEDBACK
  // ===============================

  deleteFeedback(id: string): Observable<void> {
    return from(this.supabase.from('feedback').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => {
        this.getAllFeedback().subscribe();
      }),
      catchError((error) => {
        console.error('❌ Failed to delete feedback:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // MAPPING HELPERS
  // ===============================

  private mapDatabaseToFeedback(data: any): Feedback {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      category: data.category,
      upvotes: data.upvotes || 0,
      browserInfo: data.browser_info,
      pageUrl: data.page_url,
      assignedTo: data.assigned_to,
      adminNotes: data.admin_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at,

      // From view
      userEmail: data.user_email,
      userFirstName: data.user_first_name,
      userLastName: data.user_last_name,
      commentCount: data.comment_count || 0,
      userHasUpvoted: data.user_has_upvoted || false,
    };
  }

  private mapDatabaseToComment(data: any): FeedbackComment {
    return {
      id: data.id,
      feedbackId: data.feedback_id,
      userId: data.user_id,
      comment: data.comment,
      isAdmin: data.is_admin,
      isInternal: data.is_internal,
      createdAt: data.created_at,
      updatedAt: data.updated_at,

      // From joined data
      userEmail: data.users?.email,
      userFirstName: data.users?.raw_user_meta_data?.firstName,
      userLastName: data.users?.raw_user_meta_data?.lastName,
    };
  }

  // ===============================
  // ANALYTICS
  // ===============================

  getFeedbackStats(): Observable<{
    total: number;
    bugs: number;
    features: number;
    submitted: number;
    inProgress: number;
    completed: number;
  }> {
    return this.getAllFeedback().pipe(
      map((feedback) => {
        return {
          total: feedback.length,
          bugs: feedback.filter((f) => f.type === 'bug').length,
          features: feedback.filter((f) => f.type === 'feature').length,
          submitted: feedback.filter((f) => f.status === 'submitted').length,
          inProgress: feedback.filter((f) => f.status === 'in_progress').length,
          completed: feedback.filter((f) => f.status === 'completed').length,
        };
      })
    );
  }
}
