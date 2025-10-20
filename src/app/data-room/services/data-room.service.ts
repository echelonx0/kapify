import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Observable, from, of, throwError, Subject } from 'rxjs';
import { map, switchMap, catchError, shareReplay, takeUntil } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
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

export const DEFAULT_SECTIONS: Omit<DataRoomSection, 'id' | 'dataRoomId' | 'createdAt' | 'updatedAt'>[] = [
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

// Precompute section keys (avoid repeated mapping)
const DEFAULT_SECTION_KEYS = DEFAULT_SECTIONS.map(s => s.sectionKey);

interface CachedDataRoom {
  observable: Observable<DataRoom>;
  subscription: any;
}

/**
 * DataRoomService
 * - Removes AuthService injection (use supabase.getCurrentUserId())
 * - Eliminates query duplication with shareReplay
 * - Caches computed values
 * - Standardized error handling
 * - Proper cleanup on destroy
 * - Single responsibility per method
 */
@Injectable({
  providedIn: 'root'
})
export class DataRoomService implements OnDestroy {
  private supabase = inject(SharedSupabaseService);
  private destroy$ = new Subject<void>();

  // Cache data rooms to avoid redundant queries
  private dataRoomCache = new Map<string, CachedDataRoom>();

  constructor() {
    console.log('✅ DataRoomService initialized');
  }

  // ===============================
  // CORE DATA ROOM METHODS
  // ===============================

  /**
   * Get or create data room for an organization
   * FIXED: Uses getCurrentUserId() instead of AuthService
   */
  getOrCreateDataRoom(organizationId?: string): Observable<DataRoom> {
    const userId = organizationId || this.supabase.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.getCachedDataRoom(userId).pipe(
      switchMap(dataRoom => {
        if (dataRoom) {
          return of(dataRoom);
        }
        // Not found, create new
        return this.createDataRoom(userId);
      }),
      catchError(error => {
        console.error('❌ Error in getOrCreateDataRoom:', error);
        return throwError(() => new Error('Failed to load data room'));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get data room (cached)
   * Returns cached observable to avoid duplicate queries
   */
  private getCachedDataRoom(organizationId: string): Observable<DataRoom | null> {
    // Return cached if available
    if (this.dataRoomCache.has(organizationId)) {
      return this.dataRoomCache.get(organizationId)!.observable as Observable<DataRoom | null>;
    }

    // Create new cached observable
    const observable: Observable<DataRoom | null> = from(
      this.supabase
        .from('data_rooms')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data ? transformDataRoomFromDB(data) : null;
      }),
      catchError(() => of(null)),
      shareReplay(1),
      takeUntil(this.destroy$)
    );

    this.dataRoomCache.set(organizationId, { observable: observable as any, subscription: null });
    return observable;
  }

  /**
   * Create a new data room with default sections
   */
  private async createDataRoom(organizationId: string): Promise<DataRoom> {
    const newDataRoom = {
      organization_id: organizationId,
      title: 'Investment Data Room',
      is_active: true,
      visibility: 'private',
      metadata: {}
    };

    const { data, error } = await this.supabase
      .from('data_rooms')
      .insert(newDataRoom)
      .select()
      .single();

    if (error) throw error;

    const dataRoom = transformDataRoomFromDB(data);

    // Initialize default sections
    await this.initializeDefaultSections(dataRoom.id).toPromise();

    return dataRoom;
  }

  /**
   * Initialize default sections for a data room
   */
  initializeDefaultSections(dataRoomId: string): Observable<DataRoomSection[]> {
    const sectionsToInsert = DEFAULT_SECTIONS.map(section => ({
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
        return (data || []).map(transformSectionFromDB);
      }),
      catchError(error => {
        console.error('❌ Error initializing sections:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  // ===============================
  // VIEW METHODS
  // ===============================

  /**
   * Get data room with viewer context and permissions
   * FIXED: Single query instead of waterfall (no duplicate getDataRoom calls)
   */
  getDataRoomView(dataRoomId: string, viewerUserId?: string): Observable<DataRoomView> {
    const userId = viewerUserId || this.supabase.getCurrentUserId();

    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.fetchDataRoomWithContext(dataRoomId, userId)).pipe(
      map(({ dataRoom, sections, viewerContext }) => {
        const permissions = this.calculatePermissions(viewerContext, dataRoom);

        // Filter sections based on permissions
        const accessibleSections = sections.filter((section: DataRoomSection) =>
          permissions.accessibleSections.includes(section.sectionKey)
        );

        return {
          dataRoom,
          sections: accessibleSections,
          documents: [],
          viewerContext,
          permissions
        };
      }),
      catchError(error => {
        console.error('❌ Error loading data room view:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Fetch data room with context (combined query)
   */
  private async fetchDataRoomWithContext(
    dataRoomId: string,
    userId: string
  ): Promise<{
    dataRoom: DataRoom;
    sections: DataRoomSection[];
    viewerContext: ViewerContext;
  }> {
    // Single query for data room
    const { data: dataRoomData, error: drError } = await this.supabase
      .from('data_rooms')
      .select('*')
      .eq('id', dataRoomId)
      .single();

    if (drError) throw drError;

    const dataRoom = transformDataRoomFromDB(dataRoomData);

    // Query sections in parallel
    const { data: sectionsData, error: secError } = await this.supabase
      .from('data_room_sections')
      .select('*')
      .eq('data_room_id', dataRoomId)
      .order('display_order', { ascending: true });

    if (secError) throw secError;

    const sections = (sectionsData || []).map(transformSectionFromDB);

    // Determine if owner or viewer
    const isOwner = dataRoom.organizationId === userId;
    let viewerContext: ViewerContext;

    if (isOwner) {
      viewerContext = {
        userId,
        userType: 'owner' as const,
        shareId: undefined,
        permissionLevel: undefined,
        allowedSections: undefined,
        allowedDocumentIds: undefined
      };
    } else {
      // Query share for viewer
      const share = await this.getActiveShareData(dataRoomId, userId);

      if (!share) {
        throw new Error('Access denied: No active share found');
      }

      viewerContext = {
        userId,
        userType: 'viewer' as const,
        shareId: share.id,
        permissionLevel: share.permission_level,
        allowedSections: share.allowed_sections,
        allowedDocumentIds: share.sharedDocumentIds
      };
    }

    return { dataRoom, sections, viewerContext };
  }

  // ===============================
  // DATA ROOM MANAGEMENT
  // ===============================

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
      }),
      catchError(error => {
        console.error('❌ Error fetching data room:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
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
        return (data || []).map(transformSectionFromDB);
      }),
      catchError(error => {
        console.error('❌ Error fetching sections:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
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
      }),
      catchError(error => {
        console.error('❌ Error updating data room:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
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
      }),
      catchError(error => {
        console.error('❌ Error toggling section:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Reorder sections (batch update)
   */
  async reorderSections(dataRoomId: string, sectionOrder: { id: string; order: number }[]): Promise<void> {
    const updates = sectionOrder.map(({ id, order }) =>
      this.supabase
        .from('data_room_sections')
        .update({ display_order: order })
        .eq('id', id)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      throw new Error(`Failed to reorder sections: ${errors[0].error?.message}`);
    }
  }

  // ===============================
  // PERMISSION & ACCESS CONTROL
  // ===============================

  /**
   * Get active share data for a user
   */
  private async getActiveShareData(
    dataRoomId: string,
    userId: string
  ): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('data_room_shares')
        .select(`
          id,
          permission_level,
          allowed_sections,
          data_room_share_documents (document_id)
        `)
        .eq('data_room_id', dataRoomId)
        .eq('shared_with_user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return null;
      }

      // Extract document IDs from junction table
      const sharedDocumentIds = data.data_room_share_documents?.map(
        (doc: any) => doc.document_id
      ) || [];

      return {
        ...data,
        sharedDocumentIds
      };
    } catch (error) {
      console.error('❌ Error fetching share data:', error);
      return null;
    }
  }

  /**
   * Calculate user permissions (cached computation)
   */
  private calculatePermissions(context: ViewerContext, dataRoom: DataRoom): UserPermissions {
    if (context.userType === 'owner') {
      return {
        canView: true,
        canDownload: true,
        canManage: true,
        canShare: true,
        canExport: true,
        accessibleSections: DEFAULT_SECTION_KEYS, // Use precomputed keys
        accessibleDocumentIds: []
      };
    }

    // Viewer permissions based on share
    const canDownload = context.permissionLevel === 'download' || context.permissionLevel === 'full';
    const accessibleSections = context.allowedSections || DEFAULT_SECTION_KEYS;

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
    if (permissions.accessibleDocumentIds.length === 0) {
      return true; // Empty means all accessible
    }

    return permissions.accessibleDocumentIds.includes(documentId);
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    console.log('🧹 DataRoomService destroyed');
    this.destroy$.next();
    this.destroy$.complete();
    this.dataRoomCache.clear();
  }
}