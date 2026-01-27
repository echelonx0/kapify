import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

export type SupportCategory = 'account' | 'technical' | 'billing' | 'other';
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  userId: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: SupportCategory;
  status: SupportStatus;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;

  // From joined data
  userFirstName?: string;
  userLastName?: string;
  commentCount?: number;
}

export interface SupportComment {
  id: string;
  ticketId: string;
  userId: string;
  comment: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;

  // From joined data
  userEmail?: string;
  userFirstName?: string;
  userLastName?: string;
}

export interface CreateSupportTicketInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: SupportCategory;
}

export interface CreateCommentInput {
  ticketId: string;
  comment: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupportService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  private ticketsSubject = new BehaviorSubject<SupportTicket[]>([]);
  public tickets$ = this.ticketsSubject.asObservable();

  // ===============================
  // CREATE TICKET
  // ===============================

  createTicket(input: CreateSupportTicketInput): Observable<SupportTicket> {
    const user = this.authService.user();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const ticketData = {
      user_id: user.id,
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      category: input.category,
      status: 'open',
    };

    return from(
      this.supabase
        .from('support_tickets')
        .insert(ticketData)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseToTicket(data);
      }),

      tap(async (ticket) => {
        console.log('✅ Support ticket created:', ticket.id);

        /**
         * Fire-and-forget support email dispatch
         * Uses the same Supabase Edge Function invocation
         * pattern as funder-document-analysis.service
         */
        try {
          const { error } = await this.supabase.functions.invoke(
            'send-support-email',
            {
              body: {
                ticketId: ticket.id,
                name: ticket.name,
                email: ticket.email,
                subject: ticket.subject,
                message: ticket.message,
                category: ticket.category,
              },
            }
          );

          if (error) {
            console.error('❌ Support email function returned error:', error);
          }
        } catch (err) {
          // Must never break ticket creation
          console.error('❌ Failed to invoke support email function:', err);
        }
      }),

      catchError((error) => {
        console.error('❌ Failed to create support ticket:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // GET TICKETS
  // ===============================

  getAllTickets(): Observable<SupportTicket[]> {
    return from(
      this.supabase
        .from('support_tickets_with_details')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((item) => this.mapDatabaseToTicket(item));
      }),
      tap((tickets) => {
        this.ticketsSubject.next(tickets);
      }),
      catchError((error) => {
        console.error('❌ Failed to get tickets:', error);
        return throwError(() => error);
      })
    );
  }

  getMyTickets(): Observable<SupportTicket[]> {
    const user = this.authService.user();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map((item) => this.mapDatabaseToTicket(item));
      }),
      catchError((error) => {
        console.error('❌ Failed to get my tickets:', error);
        return throwError(() => error);
      })
    );
  }

  getTicketById(id: string): Observable<SupportTicket> {
    return from(
      this.supabase
        .from('support_tickets_with_details')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseToTicket(data);
      }),
      catchError((error) => {
        console.error('❌ Failed to get ticket:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // UPDATE TICKET
  // ===============================

  updateTicketStatus(
    id: string,
    status: SupportStatus
  ): Observable<SupportTicket> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'closed') {
      updates.closed_at = new Date().toISOString();
    }

    return from(
      this.supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseToTicket(data);
      }),
      tap(() => {
        this.getAllTickets().subscribe();
      }),
      catchError((error) => {
        console.error('❌ Failed to update ticket status:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // COMMENTS
  // ===============================

  getComments(ticketId: string): Observable<SupportComment[]> {
    return from(
      this.supabase
        .from('support_comments')
        .select(
          `
          *,
          users:user_id (
            email,
            raw_user_meta_data
          )
        `
        )
        .eq('ticket_id', ticketId)
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

  createComment(input: CreateCommentInput): Observable<SupportComment> {
    const user = this.authService.user();
    if (!user) {
      return throwError(() => new Error('User not authenticated'));
    }

    const commentData = {
      ticket_id: input.ticketId,
      user_id: user.id,
      comment: input.comment,
      is_admin: true, // Will be set based on user role in production
    };

    return from(
      this.supabase
        .from('support_comments')
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
  // DELETE TICKET
  // ===============================

  deleteTicket(id: string): Observable<void> {
    return from(
      this.supabase.from('support_tickets').delete().eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      tap(() => {
        this.getAllTickets().subscribe();
      }),
      catchError((error) => {
        console.error('❌ Failed to delete ticket:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // MAPPING HELPERS
  // ===============================

  private mapDatabaseToTicket(data: any): SupportTicket {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      category: data.category,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      closedAt: data.closed_at,

      // From view
      userFirstName: data.user_first_name,
      userLastName: data.user_last_name,
      commentCount: data.comment_count || 0,
    };
  }

  private mapDatabaseToComment(data: any): SupportComment {
    return {
      id: data.id,
      ticketId: data.ticket_id,
      userId: data.user_id,
      comment: data.comment,
      isAdmin: data.is_admin,
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

  getTicketStats(): Observable<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  }> {
    return this.getAllTickets().pipe(
      map((tickets) => {
        return {
          total: tickets.length,
          open: tickets.filter((t) => t.status === 'open').length,
          inProgress: tickets.filter((t) => t.status === 'in_progress').length,
          resolved: tickets.filter((t) => t.status === 'resolved').length,
          closed: tickets.filter((t) => t.status === 'closed').length,
        };
      })
    );
  }
}
