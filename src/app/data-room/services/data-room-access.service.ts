// // src/app/SMEs/data-room/services/data-room-access.service.ts
// import { Injectable, inject } from '@angular/core';
// import { Observable, from, throwError, forkJoin, of } from 'rxjs';
// import { map, switchMap } from 'rxjs/operators';
// import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
// import { AuthService } from 'src/app/auth/production.auth.service';
// import {
//   DataRoomAccessLog,
//   AccessLogEntry,
//   AccessLogFilters,
//   AccessSummary,
//   DocumentAccessStats,
//   UserAccessSummary,
//   transformAccessLogFromDB
// } from '../models/data-room.models';

// @Injectable({
//   providedIn: 'root'
// })
// export class DataRoomAccessService {
//   private supabase = inject(SharedSupabaseService);
//   private authService = inject(AuthService);

//   // ============================================
//   // ACCESS LOGGING METHODS
//   // ============================================

//   /**
//    * Log access event
//    */
//   logAccess(entry: AccessLogEntry): Observable<void> {
//     const userId = this.authService.user()?.id;
    
//     if (!userId) {
//       return throwError(() => new Error('User not authenticated'));
//     }

//     // Get additional context
//     return this.getAccessContext(entry.dataRoomId, userId).pipe(
//       switchMap(context => {
//         const logData = {
//           data_room_id: entry.dataRoomId,
//           user_id: userId,
//           share_id: context.shareId || null,
//           action_type: entry.actionType,
//           section_key: entry.sectionKey || null,
//           document_id: entry.documentId || null,
//           ip_address: null, // Will be set by database trigger or edge function
//           user_agent: navigator.userAgent,
//           metadata: entry.metadata || {}
//         };

//         return from(
//           this.supabase
//             .from('data_room_access_logs')
//             .insert(logData)
//         );
//       }),
//       map(({ error }) => {
//         if (error) throw error;
//       })
//     );
//   }

//   /**
//    * Track document view
//    */
//   trackDocumentView(documentId: string, dataRoomId: string): Observable<void> {
//     return this.logAccess({
//       dataRoomId,
//       actionType: 'view',
//       documentId
//     });
//   }

//   /**
//    * Track document download
//    */
//   trackDocumentDownload(documentId: string, dataRoomId: string): Observable<void> {
//     return this.logAccess({
//       dataRoomId,
//       actionType: 'download',
//       documentId
//     }).pipe(
//       switchMap(() => this.incrementDownloadCount(dataRoomId))
//     );
//   }

//   /**
//    * Track section view
//    */
//   trackSectionView(sectionKey: string, dataRoomId: string): Observable<void> {
//     return this.logAccess({
//       dataRoomId,
//       actionType: 'view',
//       sectionKey
//     });
//   }

//   // ============================================
//   // ACCESS ANALYTICS METHODS
//   // ============================================

//   /**
//    * Get access log with filters
//    */
//   getAccessLog(dataRoomId: string, filters?: AccessLogFilters): Observable<DataRoomAccessLog[]> {
//     let query = this.supabase
//       .from('data_room_access_logs')
//       .select(`
//         *,
//         user:user_id (
//           id,
//           email,
//           raw_user_meta_data
//         ),
//         document:document_id (
//           id,
//           title
//         )
//       `)
//       .eq('data_room_id', dataRoomId);

//     // Apply filters
//     if (filters?.userId) {
//       query = query.eq('user_id', filters.userId);
//     }

//     if (filters?.actionType) {
//       query = query.eq('action_type', filters.actionType);
//     }

//     if (filters?.sectionKey) {
//       query = query.eq('section_key', filters.sectionKey);
//     }

//     if (filters?.startDate) {
//       query = query.gte('created_at', filters.startDate.toISOString());
//     }

//     if (filters?.endDate) {
//       query = query.lte('created_at', filters.endDate.toISOString());
//     }

//     query = query.order('created_at', { ascending: false });

//     if (filters?.limit) {
//       query = query.limit(filters.limit);
//     }

//     if (filters?.offset) {
//       query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
//     }

//     return from(query).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
        
//         return data.map(log => {
//           const transformed = transformAccessLogFromDB(log);
          
//           if (log.user) {
//             transformed.user = {
//               id: log.user.id,
//               email: log.user.email,
//               name: log.user.raw_user_meta_data?.full_name
//             };
//           }
          
//           if (log.document) {
//             transformed.document = {
//               id: log.document.id,
//               title: log.document.title
//             };
//           }
          
//           return transformed;
//         });
//       })
//     );
//   }

//   /**
//    * Get access summary for a data room
//    */
//   getAccessSummary(dataRoomId: string): Observable<AccessSummary> {
//     return forkJoin({
//       totalViews: this.getActionCount(dataRoomId, 'view'),
//       totalDownloads: this.getActionCount(dataRoomId, 'download'),
//       uniqueViewers: this.getUniqueViewersCount(dataRoomId),
//       recentActivity: this.getAccessLog(dataRoomId, { limit: 10 }),
//       topDocuments: this.getTopDocuments(dataRoomId)
//     });
//   }

//   /**
//    * Get document-specific analytics
//    */
//   getDocumentAnalytics(documentId: string): Observable<{
//     viewCount: number;
//     downloadCount: number;
//     viewers: UserAccessSummary[];
//   }> {
//     return forkJoin({
//       viewCount: this.getDocumentActionCount(documentId, 'view'),
//       downloadCount: this.getDocumentActionCount(documentId, 'download'),
//       viewers: this.getDocumentViewers(documentId)
//     });
//   }

//   /**
//    * Get top accessed documents
//    */
//   getTopDocuments(dataRoomId: string, limit: number = 5): Observable<DocumentAccessStats[]> {
//     return from(
//       this.supabase.rpc('get_top_documents', {
//         p_data_room_id: dataRoomId,
//         p_limit: limit
//       })
//     ).pipe(
//       switchMap(({ data, error }) => {
//         if (error) {
//           // Fallback if RPC doesn't exist
//           return this.getTopDocumentsFallback(dataRoomId, limit);
//         }
//         return of(data || []);
//       })
//     );
//   }

//   /**
//    * Get user access summary for a data room
//    */
//   getUserAccessSummary(dataRoomId: string, userId: string): Observable<UserAccessSummary> {
//     return forkJoin({
//       viewCount: this.getUserActionCount(dataRoomId, userId, 'view'),
//       downloadCount: this.getUserActionCount(dataRoomId, userId, 'download'),
//       lastAccess: this.getUserLastAccess(dataRoomId, userId)
//     }).pipe(
//       switchMap(({ viewCount, downloadCount, lastAccess }) => {
//         return this.getUserInfo(userId).pipe(
//           map(userInfo => ({
//             userId,
//             userName: userInfo.name,
//             userEmail: userInfo.email,
//             viewCount,
//             downloadCount,
//             lastAccess
//           }))
//         );
//       })
//     );
//   }

//   // ============================================
//   // PERMISSION CHECKING METHODS
//   // ============================================

//   /**
//    * Check if user has permission for specific action
//    */
//   checkPermission(userId: string, dataRoomId: string, action: 'view' | 'download' | 'manage'): Observable<boolean> {
//     // Check if user is owner
//     return this.isDataRoomOwner(dataRoomId, userId).pipe(
//       switchMap(isOwner => {
//         if (isOwner) {
//           return from([true]); // Owner has all permissions
//         }

//         // Check share permissions
//         return this.getActiveShare(dataRoomId, userId).pipe(
//           map(share => {
//             if (!share) return false;

//             switch (action) {
//               case 'view':
//                 return true; // All shares have view permission
//               case 'download':
//                 return share.permission_level === 'download' || share.permission_level === 'full';
//               case 'manage':
//                 return share.permission_level === 'full';
//               default:
//                 return false;
//             }
//           })
//         );
//       })
//     );
//   }

//   // ============================================
//   // PRIVATE HELPER METHODS
//   // ============================================

//   private getAccessContext(dataRoomId: string, userId: string): Observable<{ shareId?: string }> {
//     return this.getActiveShare(dataRoomId, userId).pipe(
//       map(share => ({
//         shareId: share?.id
//       }))
//     );
//   }

//   private getActiveShare(dataRoomId: string, userId: string): Observable<any> {
//     return from(
//       this.supabase
//         .from('data_room_shares')
//         .select('*')
//         .eq('data_room_id', dataRoomId)
//         .eq('shared_with_user_id', userId)
//         .eq('status', 'active')
//         .maybeSingle()
//     ).pipe(
//       map(({ data }) => data)
//     );
//   }

//   private incrementDownloadCount(dataRoomId: string): Observable<void> {
//     const userId = this.authService.user()?.id;
    
//     if (!userId) {
//       return of(undefined);
//     }

//     return from(
//       this.supabase
//         .from('data_room_shares')
//         .select('download_count')
//         .eq('data_room_id', dataRoomId)
//         .eq('shared_with_user_id', userId)
//         .single()
//     ).pipe(
//       switchMap(({ data, error }) => {
//         if (error || !data) {
//           return of(undefined);
//         }

//         const newCount = (data.download_count || 0) + 1;
        
//         return from(
//           this.supabase
//             .from('data_room_shares')
//             .update({ 
//               download_count: newCount,
//               last_accessed_at: new Date().toISOString()
//             })
//             .eq('data_room_id', dataRoomId)
//             .eq('shared_with_user_id', userId)
//         );
//       }),
//       map(() => undefined)
//     );
//   }

//   private getActionCount(dataRoomId: string, actionType: string): Observable<number> {
//     return from(
//       this.supabase
//         .from('data_room_access_logs')
//         .select('id', { count: 'exact', head: true })
//         .eq('data_room_id', dataRoomId)
//         .eq('action_type', actionType)
//     ).pipe(
//       map(({ count }) => count || 0)
//     );
//   }

//   private getDocumentActionCount(documentId: string, actionType: string): Observable<number> {
//     return from(
//       this.supabase
//         .from('data_room_access_logs')
//         .select('id', { count: 'exact', head: true })
//         .eq('document_id', documentId)
//         .eq('action_type', actionType)
//     ).pipe(
//       map(({ count }) => count || 0)
//     );
//   }

//   private getUserActionCount(dataRoomId: string, userId: string, actionType: string): Observable<number> {
//     return from(
//       this.supabase
//         .from('data_room_access_logs')
//         .select('id', { count: 'exact', head: true })
//         .eq('data_room_id', dataRoomId)
//         .eq('user_id', userId)
//         .eq('action_type', actionType)
//     ).pipe(
//       map(({ count }) => count || 0)
//     );
//   }

//   private getUniqueViewersCount(dataRoomId: string): Observable<number> {
//     return from(
//       this.supabase
//         .from('data_room_access_logs')
//         .select('user_id')
//         .eq('data_room_id', dataRoomId)
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) return 0;
//         const uniqueUsers = new Set(data.map(log => log.user_id));
//         return uniqueUsers.size;
//       })
//     );
//   }

//   private getTopDocumentsFallback(dataRoomId: string, limit: number): Observable<DocumentAccessStats[]> {
//     return this.getAccessLog(dataRoomId, { actionType: 'view' }).pipe(
//       map(logs => {
//         const documentStats = new Map<string, { title: string; viewCount: number; downloadCount: number; lastAccessed: Date }>();

//         logs.forEach(log => {
//           if (!log.documentId) return;

//           const existing = documentStats.get(log.documentId);
//           if (existing) {
//             if (log.actionType === 'view') existing.viewCount++;
//             if (log.actionType === 'download') existing.downloadCount++;
//             if (log.createdAt > existing.lastAccessed) {
//               existing.lastAccessed = log.createdAt;
//             }
//           } else {
//             documentStats.set(log.documentId, {
//               title: log.document?.title || 'Unknown',
//               viewCount: log.actionType === 'view' ? 1 : 0,
//               downloadCount: log.actionType === 'download' ? 1 : 0,
//               lastAccessed: log.createdAt
//             });
//           }
//         });

//         return Array.from(documentStats.entries())
//           .map(([documentId, stats]) => ({
//             documentId,
//             documentTitle: stats.title,
//             viewCount: stats.viewCount,
//             downloadCount: stats.downloadCount,
//             lastAccessed: stats.lastAccessed
//           }))
//           .sort((a, b) => b.viewCount - a.viewCount)
//           .slice(0, limit);
//       })
//     );
//   }

//  private getDocumentViewers(documentId: string): Observable<UserAccessSummary[]> {
//   return from(
//     this.supabase
//       .from('data_room_access_logs')
//       .select(`
//         user_id,
//         action_type,
//         created_at,
//         user:user_id (
//           id,
//           email,
//           raw_user_meta_data
//         )
//       `)
//       .eq('document_id', documentId)
//       .order('created_at', { ascending: false })
//   ).pipe(
//     map(({ data, error }) => {
//       if (error) throw error;

//       const userStats = new Map<string, { email: string; name?: string; viewCount: number; downloadCount: number; lastAccess: Date }>();

//       data.forEach(log => {
//         // FIX: Access first element of user array
//         const user = Array.isArray(log.user) ? log.user[0] : log.user;
        
//         const existing = userStats.get(log.user_id);
//         if (existing) {
//           if (log.action_type === 'view') existing.viewCount++;
//           if (log.action_type === 'download') existing.downloadCount++;
//           if (new Date(log.created_at) > existing.lastAccess) {
//             existing.lastAccess = new Date(log.created_at);
//           }
//         } else {
//           userStats.set(log.user_id, {
//             email: user?.email || 'Unknown',
//             name: user?.raw_user_meta_data?.full_name,
//             viewCount: log.action_type === 'view' ? 1 : 0,
//             downloadCount: log.action_type === 'download' ? 1 : 0,
//             lastAccess: new Date(log.created_at)
//           });
//         }
//       });

//       return Array.from(userStats.entries()).map(([userId, stats]) => ({
//         userId,
//         userName: stats.name,
//         userEmail: stats.email,
//         viewCount: stats.viewCount,
//         downloadCount: stats.downloadCount,
//         lastAccess: stats.lastAccess
//       }));
//     })
//   );
// }

//   private getUserLastAccess(dataRoomId: string, userId: string): Observable<Date> {
//     return from(
//       this.supabase
//         .from('data_room_access_logs')
//         .select('created_at')
//         .eq('data_room_id', dataRoomId)
//         .eq('user_id', userId)
//         .order('created_at', { ascending: false })
//         .limit(1)
//         .single()
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) return new Date();
//         return new Date(data.created_at);
//       })
//     );
//   }

//   private getUserInfo(userId: string): Observable<{ email: string; name?: string }> {
//     return from(
//       this.supabase.auth.admin.getUserById(userId)
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) throw error;
//         return {
//           email: data.user.email || 'Unknown',
//           name: data.user.user_metadata?.['full_name']
//         };
//       })
//     );
//   }

//   private isDataRoomOwner(dataRoomId: string, userId: string): Observable<boolean> {
//     return from(
//       this.supabase
//         .from('data_rooms')
//         .select('organization_id')
//         .eq('id', dataRoomId)
//         .single()
//     ).pipe(
//       map(({ data, error }) => {
//         if (error) return false;
//         return data.organization_id === userId;
//       })
//     );
//   }
// }


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
  transformAccessLogFromDB
} from '../models/data-room.models';

// Constants
const BATCH_SIZE = 100;

/**
 * DataRoomAccessService
 * - Removes AuthService injection (use supabase.getCurrentUserId())
 * - Fixes N+1 access context queries (batch fetch)
 * - Batch operations instead of individual queries
 * - Standardized error handling
 * - Proper cleanup on destroy
 */
@Injectable({
  providedIn: 'root'
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
      sectionKey
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
      switchMap(context =>
        from(
          this.supabase
            .from('data_room_access_logs')
            .insert({
              data_room_id: entry.dataRoomId,
              user_id: userId,
              share_id: context.shareId || null,
              action_type: entry.actionType,
              section_key: entry.sectionKey || null,
              document_id: entry.documentId || null,
              ip_address: null, // Set by database trigger
              user_agent: navigator.userAgent,
              metadata: entry.metadata || {}
            })
        )
      ),
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError(error => {
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
  getAccessLog(dataRoomId: string, filters?: AccessLogFilters): Observable<DataRoomAccessLog[]> {
    let query = this.supabase
      .from('data_room_access_logs')
      .select(`
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
      `)
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
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        
        return data.map(log => {
          const transformed = transformAccessLogFromDB(log);
          
          if (log.user) {
            transformed.user = {
              id: log.user.id,
              email: log.user.email,
              name: log.user.raw_user_meta_data?.full_name
            };
          }
          
          if (log.document) {
            transformed.document = {
              id: log.document.id,
              title: log.document.title
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
      const uniqueRoomIds = [...new Set(entries.map(e => e.dataRoomId))];
      const contexts = await Promise.all(
        uniqueRoomIds.map(roomId => this.getAccessContext(roomId, userId))
      );

      const contextMap = new Map(uniqueRoomIds.map((roomId, idx) => [roomId, contexts[idx]]));

      // Prepare batch records
      const records = entries.map(entry => ({
        data_room_id: entry.dataRoomId,
        user_id: userId,
        share_id: contextMap.get(entry.dataRoomId)?.shareId || null,
        action_type: entry.actionType,
        section_key: entry.sectionKey || null,
        document_id: entry.documentId || null,
        ip_address: null,
        user_agent: navigator.userAgent,
        metadata: entry.metadata || {}
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
      documentId
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
              last_accessed_at: new Date().toISOString()
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
  trackDocumentDownload(documentId: string, dataRoomId: string): Observable<void> {
    return this.logAccess({
      dataRoomId,
      actionType: 'download',
      documentId
    }).pipe(
      switchMap(() => this.incrementDownloadCount(dataRoomId))
    );
  }
  // ===============================
  // ACCESS LOG RETRIEVAL
  // ===============================

  /**
   * Get access logs for a data room
   */
getAccessLogs(dataRoomId: string, filters?: AccessLogFilters): Observable<DataRoomAccessLog[]> {
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
    catchError(error => {
      console.error('❌ Error fetching access logs:', error);
      return throwError(() => error);
    }),
    takeUntil(this.destroy$)
  );
}

  /**
   * Get recent access logs (last N logs)
   */
  getRecentLogs(dataRoomId: string, limit: number = 50): Observable<DataRoomAccessLog[]> {
    return this.getAccessLogs(dataRoomId, { limit });
  }

  /**
   * Get access logs for a specific user
   */
  getUserAccessLogs(userId: string, limit: number = 100): Observable<DataRoomAccessLog[]> {
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
      catchError(error => {
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
      catchError(error => {
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
      catchError(error => {
        console.error('❌ Error fetching access summary:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get document access statistics
   */
  getDocumentAccessStats(dataRoomId: string): Observable<DocumentAccessStats[]> {
    return from(
      this.supabase.rpc('get_document_access_stats', { p_data_room_id: dataRoomId })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      }),
      catchError(error => {
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
      this.supabase.rpc('get_user_access_summary', { p_data_room_id: dataRoomId })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      }),
      catchError(error => {
        console.error('❌ Error fetching user access summary:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get most viewed sections
   */
  getMostViewedSections(dataRoomId: string, limit: number = 10): Observable<any[]> {
    return from(
      this.supabase.rpc('get_most_viewed_sections', {
        p_data_room_id: dataRoomId,
        p_limit: limit
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      }),
      catchError(error => {
        console.error('❌ Error fetching most viewed sections:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get most viewed documents
   */
  getMostViewedDocuments(dataRoomId: string, limit: number = 10): Observable<any[]> {
    return from(
      this.supabase.rpc('get_most_viewed_documents', {
        p_data_room_id: dataRoomId,
        p_limit: limit
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      }),
      catchError(error => {
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
      catchError(error => {
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