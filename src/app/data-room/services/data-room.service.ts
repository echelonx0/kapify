// src/app/SMEs/data-room/services/data-room.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from, of, throwError, forkJoin } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { AuthService } from 'src/app/auth/production.auth.service';
import {
  DataRoom,
  DataRoomSection,
  DataRoomView,
  ViewerContext,
  UserPermissions,
  transformDataRoomFromDB,
  transformDataRoomToDB,
  transformSectionFromDB
} from '../models/data-room.models';

@Injectable({
  providedIn: 'root'
})
export class DataRoomService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  // Default sections configuration
  private readonly DEFAULT_SECTIONS: Omit<DataRoomSection, 'id' | 'dataRoomId' | 'createdAt' | 'updatedAt'>[] = [
    {
      sectionKey: 'executive',
      title: 'Executive Summary',
      description: 'Company overview and investment thesis',
      displayOrder: 1,
      isEnabled: true,
      icon: 'Target',
      metadata: {}
    },
    {
      sectionKey: 'financials',
      title: 'Financial Dashboard',
      description: 'Financial performance and projections',
      displayOrder: 2,
      isEnabled: true,
      icon: 'BarChart3',
      metadata: {}
    },
    {
      sectionKey: 'documents',
      title: 'Document Repository',
      description: 'Legal and compliance documents',
      displayOrder: 3,
      isEnabled: true,
      icon: 'FileText',
      metadata: {}
    },
    {
      sectionKey: 'management',
      title: 'Management Team',
      description: 'Leadership team and governance',
      displayOrder: 4,
      isEnabled: true,
      icon: 'Users',
      metadata: {}
    },
    {
      sectionKey: 'market',
      title: 'Market Analysis',
      description: 'AI-powered market intelligence',
      displayOrder: 5,
      isEnabled: true,
      icon: 'TrendingUp',
      metadata: {}
    },
    {
      sectionKey: 'legal',
      title: 'Legal & Compliance',
      description: 'Regulatory compliance status',
      displayOrder: 6,
      isEnabled: true,
      icon: 'Shield',
      metadata: {}
    }
  ];

  /**
   * Get or create data room for an organization
   * Auto-creates if doesn't exist
   */
  getOrCreateDataRoom(organizationId?: string): Observable<DataRoom> {
    const userId = organizationId || this.authService.user()?.id;
    
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabase
        .from('data_rooms')
        .select('*')
        .eq('organization_id', userId)
        .single()
    ).pipe(
      switchMap(({ data, error }) => {
        if (error && error.code === 'PGRST116') {
          // Not found, create new
          return this.createDataRoom(userId);
        }
        
        if (error) {
          throw error;
        }
        
        return of(transformDataRoomFromDB(data));
      }),
      catchError(err => {
        console.error('Error in getOrCreateDataRoom:', err);
        return throwError(() => new Error('Failed to load data room'));
      })
    );
  }

  /**
   * Create a new data room with default sections
   */
  private createDataRoom(organizationId: string): Observable<DataRoom> {
    const newDataRoom = {
      organization_id: organizationId,
      title: 'Investment Data Room',
      is_active: true,
      visibility: 'private',
      metadata: {}
    };

    return from(
      this.supabase
        .from('data_rooms')
        .insert(newDataRoom)
        .select()
        .single()
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) throw error;
        
        const dataRoom = transformDataRoomFromDB(data);
        
        // Initialize default sections
        return this.initializeDefaultSections(dataRoom.id).pipe(
          map(() => dataRoom)
        );
      })
    );
  }

  /**
   * Initialize default sections for a data room
   */
  initializeDefaultSections(dataRoomId: string): Observable<DataRoomSection[]> {
    const sectionsToInsert = this.DEFAULT_SECTIONS.map(section => ({
      data_room_id: dataRoomId,
      section_key: section.sectionKey,
      title: section.title,
      description: section.description,
      display_order: section.displayOrder,
      is_enabled: section.isEnabled,
      icon: section.icon,
      metadata: section.metadata
    }));

    return from(
      this.supabase
        .from('data_room_sections')
        .insert(sectionsToInsert)
        .select()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(transformSectionFromDB);
      })
    );
  }

  /**
   * Get data room with viewer context
   * Returns appropriate view based on ownership vs shared access
   */
  getDataRoomView(dataRoomId: string, viewerUserId?: string): Observable<DataRoomView> {
    const userId = viewerUserId || this.authService.user()?.id;
    
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return forkJoin({
      dataRoom: this.getDataRoom(dataRoomId),
      sections: this.getSections(dataRoomId),
      viewerContext: this.getViewerContext(dataRoomId, userId)
    }).pipe(
      map(({ dataRoom, sections, viewerContext }) => {
        const permissions = this.calculatePermissions(viewerContext, dataRoom);
        
        // Filter sections based on permissions
        const accessibleSections = sections.filter(section => 
          permissions.accessibleSections.includes(section.sectionKey)
        );

        return {
          dataRoom,
          sections: accessibleSections,
          documents: [], // Will be loaded by document service
          viewerContext,
          permissions
        };
      })
    );
  }

  /**
   * Get data room by ID
   */
  getDataRoom(dataRoomId: string): Observable<DataRoom> {
    return from(
      this.supabase
        .from('data_rooms')
        .select('*')
        .eq('id', dataRoomId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return transformDataRoomFromDB(data);
      })
    );
  }

  /**
   * Get sections for a data room
   */
  getSections(dataRoomId: string): Observable<DataRoomSection[]> {
    return from(
      this.supabase
        .from('data_room_sections')
        .select('*')
        .eq('data_room_id', dataRoomId)
        .order('display_order', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(transformSectionFromDB);
      })
    );
  }

  /**
   * Update data room
   */
  updateDataRoom(dataRoomId: string, updates: Partial<DataRoom>): Observable<DataRoom> {
    const dbUpdates = transformDataRoomToDB(updates);

    return from(
      this.supabase
        .from('data_rooms')
        .update(dbUpdates)
        .eq('id', dataRoomId)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return transformDataRoomFromDB(data);
      })
    );
  }

  /**
   * Toggle section visibility
   */
  toggleSection(sectionId: string, enabled: boolean): Observable<void> {
    return from(
      this.supabase
        .from('data_room_sections')
        .update({ is_enabled: enabled })
        .eq('id', sectionId)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  /**
   * Reorder sections
   */
  reorderSections(dataRoomId: string, sectionOrder: { id: string; order: number }[]): Observable<void> {
    const updates = sectionOrder.map(({ id, order }) =>
      this.supabase
        .from('data_room_sections')
        .update({ display_order: order })
        .eq('id', id)
    );

    return forkJoin(updates.map(update => from(update))).pipe(
      map(() => undefined)
    );
  }

  /**
   * Get viewer context (owner vs viewer with share details)
   */
  private getViewerContext(dataRoomId: string, userId: string): Observable<ViewerContext> {
    return forkJoin({
      dataRoom: this.getDataRoom(dataRoomId),
      share: this.getActiveShare(dataRoomId, userId)
    }).pipe(
      map(({ dataRoom, share }) => {
        const isOwner = dataRoom.organizationId === userId;

        if (isOwner) {
          return {
            userId,
            userType: 'owner' as const,
            shareId: undefined,
            permissionLevel: undefined,
            allowedSections: undefined,
            allowedDocumentIds: undefined
          };
        }

        if (!share) {
          throw new Error('Access denied: No active share found');
        }

        return {
          userId,
          userType: 'viewer' as const,
          shareId: share.id,
          permissionLevel: share.permissionLevel,
          allowedSections: share.allowedSections,
          allowedDocumentIds: share.sharedDocumentIds
        };
      })
    );
  }

  /**
   * Get active share for a user
   */
  private getActiveShare(dataRoomId: string, userId: string): Observable<any | null> {
    return from(
      this.supabase
        .from('data_room_shares')
        .select(`
          *,
          data_room_share_documents (
            document_id
          )
        `)
        .eq('data_room_id', dataRoomId)
        .eq('shared_with_user_id', userId)
        .eq('status', 'active')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error && error.code === 'PGRST116') {
          return null; // No share found
        }
        
        if (error) throw error;
        
        // Extract document IDs from junction table
        const sharedDocumentIds = data.data_room_share_documents?.map(
          (doc: any) => doc.document_id
        ) || [];

        return {
          ...data,
          sharedDocumentIds
        };
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Calculate user permissions based on context
   */
  private calculatePermissions(context: ViewerContext, dataRoom: DataRoom): UserPermissions {
    if (context.userType === 'owner') {
      // Owner has full access
      return {
        canView: true,
        canDownload: true,
        canManage: true,
        canShare: true,
        canExport: true,
        accessibleSections: this.DEFAULT_SECTIONS.map(s => s.sectionKey),
        accessibleDocumentIds: [] // Empty means all accessible
      };
    }

    // Viewer permissions based on share
    const canDownload = context.permissionLevel === 'download' || context.permissionLevel === 'full';
    const accessibleSections = context.allowedSections || this.DEFAULT_SECTIONS.map(s => s.sectionKey);

    return {
      canView: true,
      canDownload,
      canManage: false,
      canShare: false,
      canExport: canDownload,
      accessibleSections,
      accessibleDocumentIds: context.allowedDocumentIds || []
    };
  }

  /**
   * Check if user can access a specific section
   */
  canAccessSection(sectionKey: string, permissions: UserPermissions): boolean {
    return permissions.accessibleSections.includes(sectionKey);
  }

  /**
   * Check if user can access a specific document
   */
  canAccessDocument(documentId: string, permissions: UserPermissions): boolean {
    // If accessibleDocumentIds is empty, user can access all documents
    if (permissions.accessibleDocumentIds.length === 0) {
      return true;
    }
    
    return permissions.accessibleDocumentIds.includes(documentId);
  }
}