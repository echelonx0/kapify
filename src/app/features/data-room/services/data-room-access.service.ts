import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable, from, throwError, Subject, of } from 'rxjs';
import { map, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import {
  DataRoomAccessLog,
  AccessLogEntry,
  AccessLogFilters,
  AccessSummary,
  DocumentAccessStats,
  UserAccessSummary,
  transformAccessLogFromDB,
} from '../models/data-room.models';

// Constants
const BATCH_SIZE = 100;

@Injectable({
  providedIn: 'root',
})
export class DataRoomAccessService implements OnDestroy {
  private supabase = inject(SharedSupabaseService);
  private destroy$ = new Subject<void>();

  constructor() {
    console.log('✅ DataRoomAccessService initialized');
  }

  // ===============================
  // ACCESS LOGGING
  // ===============================

  /**
   * Track section view
   */
  trackSectionView(sectionKey: string, dataRoomId: string): Observable<void> {
    return this.logAccess({
      dataRoomId,
      actionType: 'view',
      sectionKey,
    });
  }

  /**
   * Log access event
   */
  logAccess(entry: AccessLogEntry): Observable<void> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Get access context (owner vs viewer)
    return from(this.getAccessContext(entry.dataRoomId, userId)).pipe(
      switchMap((context) =>
        from(
          this.supabase.from('data_room_access_logs').insert({
            data_room_id: entry.dataRoomId,
            user_id: userId,
            share_id: context.shareId || null,
            action_type: entry.actionType,
            section_key: entry.sectionKey || null,
            document_id: entry.documentId || null,
            ip_address: null, // Set by database trigger
            user_agent: navigator.userAgent,
            metadata: entry.metadata || {},
          })
        )
      ),
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError((error) => {
        console.error('❌ Error logging access:', error);
        // Don't throw - logging errors shouldn't break app
        return from([undefined]);
      }),
      takeUntil(this.destroy$)
    );
  }

  // ============================================
  // ACCESS ANALYTICS METHODS
  // ============================================

  /**
   * Get access log with filters
   */
  getAccessLog(
    dataRoomId: string,
    filters?: AccessLogFilters
  ): Observable<DataRoomAccessLog[]> {
    let query = this.supabase
      .from('data_room_access_logs')
      .select(
        `
        *,
        user:user_id (
          id,
          email,
          raw_user_meta_data
        ),
        document:document_id (
          id,
          title
        )
      `
      )
      .eq('data_room_id', dataRoomId);

    // Apply filters
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters?.actionType) {
      query = query.eq('action_type', filters.actionType);
    }

    if (filters?.sectionKey) {
      query = query.eq('section_key', filters.sectionKey);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 10) - 1
      );
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;

        return data.map((log) => {
          const transformed = transformAccessLogFromDB(log);

          if (log.user) {
            transformed.user = {
              id: log.user.id,
              email: log.user.email,
              name: log.user.raw_user_meta_data?.full_name,
            };
          }

          if (log.document) {
            transformed.document = {
              id: log.document.id,
              title: log.document.title,
            };
          }

          return transformed;
        });
      })
    );
  }
  /**
   * Batch log access events
   * FIXED: Use batch insert instead of individual inserts
   */
  async batchLogAccess(entries: AccessLogEntry[]): Promise<void> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (entries.length === 0) {
      return;
    }

    try {
      // Get context for all unique data rooms at once
      const uniqueRoomIds = [...new Set(entries.map((e) => e.dataRoomId))];
      const contexts = await Promise.all(
        uniqueRoomIds.map((roomId) => this.getAccessContext(roomId, userId))
      );

      const contextMap = new Map(
        uniqueRoomIds.map((roomId, idx) => [roomId, contexts[idx]])
      );

      // Prepare batch records
      const records = entries.map((entry) => ({
        data_room_id: entry.dataRoomId,
        user_id: userId,
        share_id: contextMap.get(entry.dataRoomId)?.shareId || null,
        action_type: entry.actionType,
        section_key: entry.sectionKey || null,
        document_id: entry.documentId || null,
        ip_address: null,
        user_agent: navigator.userAgent,
        metadata: entry.metadata || {},
      }));

      // Insert in batches
      for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        const { error } = await this.supabase
          .from('data_room_access_logs')
          .insert(batch);

        if (error) throw error;
      }
    } catch (error) {
      console.error('❌ Error batch logging access:', error);
      // Don't rethrow - logging shouldn't break app
    }
  }

  /**
   * Track document view
   */
  trackDocumentView(documentId: string, dataRoomId: string): Observable<void> {
    return this.logAccess({
      dataRoomId,
      actionType: 'view',
      documentId,
    });
  }
  private incrementDownloadCount(dataRoomId: string): Observable<void> {
    const userId = this.supabase.getCurrentUserId();

    if (!userId) {
      return of(undefined);
    }

    return from(
      this.supabase
        .from('data_room_shares')
        .select('download_count')
        .eq('data_room_id', dataRoomId)
        .eq('shared_with_user_id', userId)
        .single()
    ).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) {
          return of(undefined);
        }

        const newCount = (data.download_count || 0) + 1;

        return from(
          this.supabase
            .from('data_room_shares')
            .update({
              download_count: newCount,
              last_accessed_at: new Date().toISOString(),
            })
            .eq('data_room_id', dataRoomId)
            .eq('shared_with_user_id', userId)
        );
      }),
      map(() => undefined)
    );
  }
  /**
   * Track document download
   */
  trackDocumentDownload(
    documentId: string,
    dataRoomId: string
  ): Observable<void> {
    return this.logAccess({
      dataRoomId,
      actionType: 'download',
      documentId,
    }).pipe(switchMap(() => this.incrementDownloadCount(dataRoomId)));
  }
  // ===============================
  // ACCESS LOG RETRIEVAL
  // ===============================

  /**
   * Get access logs for a data room
   */
  getAccessLogs(
    dataRoomId: string,
    filters?: AccessLogFilters
  ): Observable<DataRoomAccessLog[]> {
    let query = this.supabase
      .from('data_room_access_logs')
      .select('*')
      .eq('data_room_id', dataRoomId);

    // Apply filters
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.actionType) {
      query = query.eq('action_type', filters.actionType);
    }
    if (filters?.sectionKey) {
      query = query.eq('section_key', filters.sectionKey);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    // Apply ordering and limit/offset
    if (filters?.limit || filters?.offset) {
      const start = filters?.offset || 0;
      const end = start + (filters?.limit || 1000) - 1;
      query = query.range(start, end);
    } else {
      query = query.limit(1000);
    }

    return from(query.order('created_at', { ascending: false })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(transformAccessLogFromDB);
      }),
      catchError((error) => {
        console.error('❌ Error fetching access logs:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get recent access logs (last N logs)
   */
  getRecentLogs(
    dataRoomId: string,
    limit: number = 50
  ): Observable<DataRoomAccessLog[]> {
    return this.getAccessLogs(dataRoomId, { limit });
  }

  /**
   * Get access logs for a specific user
   */
  getUserAccessLogs(
    userId: string,
    limit: number = 100
  ): Observable<DataRoomAccessLog[]> {
    return from(
      this.supabase
        .from('data_room_access_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(transformAccessLogFromDB);
      }),
      catchError((error) => {
        console.error('❌ Error fetching user access logs:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get access logs for a document
   */
  getDocumentAccessLogs(
    documentId: string,
    limit: number = 100
  ): Observable<DataRoomAccessLog[]> {
    return from(
      this.supabase
        .from('data_room_access_logs')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(transformAccessLogFromDB);
      }),
      catchError((error) => {
        console.error('❌ Error fetching document access logs:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  // ===============================
  // ACCESS SUMMARY & ANALYTICS
  // ===============================

  /**
   * Get access summary for a data room
   * FIXED: Single aggregation query instead of N+1
   */
  getAccessSummary(dataRoomId: string): Observable<AccessSummary> {
    return from(
      this.supabase.rpc('get_access_summary', { p_data_room_id: dataRoomId })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError((error) => {
        console.error('❌ Error fetching access summary:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get document access statistics
   */
  getDocumentAccessStats(
    dataRoomId: string
  ): Observable<DocumentAccessStats[]> {
    return from(
      this.supabase.rpc('get_document_access_stats', {
        p_data_room_id: dataRoomId,
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      }),
      catchError((error) => {
        console.error('❌ Error fetching document access stats:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get user access summary
   */
  getUserAccessSummary(dataRoomId: string): Observable<UserAccessSummary[]> {
    return from(
      this.supabase.rpc('get_user_access_summary', {
        p_data_room_id: dataRoomId,
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      }),
      catchError((error) => {
        console.error('❌ Error fetching user access summary:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get most viewed sections
   */
  getMostViewedSections(
    dataRoomId: string,
    limit: number = 10
  ): Observable<any[]> {
    return from(
      this.supabase.rpc('get_most_viewed_sections', {
        p_data_room_id: dataRoomId,
        p_limit: limit,
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      }),
      catchError((error) => {
        console.error('❌ Error fetching most viewed sections:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get most viewed documents
   */
  getMostViewedDocuments(
    dataRoomId: string,
    limit: number = 10
  ): Observable<any[]> {
    return from(
      this.supabase.rpc('get_most_viewed_documents', {
        p_data_room_id: dataRoomId,
        p_limit: limit,
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      }),
      catchError((error) => {
        console.error('❌ Error fetching most viewed documents:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get user activity heatmap
   */
  getActivityHeatmap(dataRoomId: string): Observable<any[]> {
    return from(
      this.supabase.rpc('get_activity_heatmap', { p_data_room_id: dataRoomId })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      }),
      catchError((error) => {
        console.error('❌ Error fetching activity heatmap:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  // ===============================
  // PRIVATE HELPERS
  // ===============================

  /**
   * Get access context (owner vs viewer with share)
   * FIXED: Combined query instead of separate calls
   */
  private async getAccessContext(
    dataRoomId: string,
    userId: string
  ): Promise<{ shareId?: string }> {
    // Check ownership first
    const { data: ownerData } = await this.supabase
      .from('data_rooms')
      .select('id')
      .eq('id', dataRoomId)
      .eq('organization_id', userId)
      .maybeSingle();

    if (ownerData) {
      return {}; // Owner, no share ID
    }

    // Get share if viewer
    const { data: shareData } = await this.supabase
      .from('data_room_shares')
      .select('id')
      .eq('data_room_id', dataRoomId)
      .eq('shared_with_user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    return { shareId: shareData?.id };
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    console.log('🧹 DataRoomAccessService destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
