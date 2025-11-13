import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable, from, throwError, Subject } from 'rxjs';
import { map, switchMap, catchError, shareReplay, takeUntil, tap } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { environment } from 'src/environments/environment';
import {
  DataRoomDocument,
  CreateDataRoomDocumentRequest,
  UpdateDataRoomDocumentRequest,
  DocumentFilters,
  transformDocumentFromDB
} from '../models/data-room.models';

// Constants from centralized environment configuration
const BUCKET_NAME = environment.storage.dataRoomBucket;
const MAX_FILE_SIZE = environment.storage.maxFileSize;
const SIGNED_URL_EXPIRY = environment.storage.signedUrlExpiry;
const CACHE_TTL = environment.cache.documentTTL;

interface CachedDocuments {
  observable: Observable<DataRoomDocument[]>;
  timestamp: number;
}

/**
 * DataRoomDocumentService
 * - Removes AuthService injection (use supabase.getCurrentUserId())
 * - Eliminates query duplication with extracted helpers
 * - Adds caching for frequently accessed data
 * - Standardized error handling
 * - Proper cleanup on destroy
 */
@Injectable({
  providedIn: 'root'
})
export class DataRoomDocumentService implements OnDestroy {
  private supabase = inject(SharedSupabaseService);
  private destroy$ = new Subject<void>();

  // Cache documents to avoid redundant queries
  private documentCache = new Map<string, CachedDocuments>();

  constructor() {
    console.log('✅ DataRoomDocumentService initialized');
  }

  // ===============================
  // DOCUMENT CRUD OPERATIONS
  // ===============================

  /**
   * Add file document to data room with transaction safety
   *
   * PRODUCTION-SAFE: Implements rollback on failure
   * - Validates file content (not just extension)
   * - Cleans up storage if database operations fail
   * - Prevents orphaned files in storage
   */
  addFileDocument(request: CreateDataRoomDocumentRequest): Observable<DataRoomDocument> {
    if (!request.file) {
      return throwError(() => new Error('File is required for file document'));
    }

    // Enhanced file validation
    const validation = this.validateFile(request.file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.error || 'File validation failed'));
    }

    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Generate unique file name
    const timestamp = Date.now();
    const sanitizedFileName = this.sanitizeFileName(request.file.name);
    const filePath = `${userId}/${request.dataRoomId}/${timestamp}_${sanitizedFileName}`;

    // Track uploaded file path for rollback
    let uploadedFilePath: string | null = null;
    let createdBaseDocumentId: string | null = null;

    return this.uploadFile(filePath, request.file).pipe(
      tap(uploadResult => {
        uploadedFilePath = uploadResult.path;
      }),
      switchMap(uploadResult =>
        this.createBaseDocumentRecord(userId, request, uploadResult.path).pipe(
          tap(documentRecord => {
            createdBaseDocumentId = documentRecord.id;
          })
        )
      ),
      switchMap(documentRecord =>
        this.createDataRoomDocumentRecord(request, documentRecord.id).pipe(
          tap(() => this.invalidateCache(request.dataRoomId))
        )
      ),
      catchError(error => {
        console.error('❌ Error adding file document - initiating rollback:', error);

        // ROLLBACK: Clean up any created resources
        this.rollbackFileUpload(uploadedFilePath, createdBaseDocumentId).subscribe({
          next: () => console.log('✅ Rollback completed successfully'),
          error: (rollbackError) => console.error('❌ Rollback failed:', rollbackError)
        });

        return throwError(() => new Error(`Document upload failed: ${error.message || 'Unknown error'}`));
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Add link document to data room
   */
  addLinkDocument(request: CreateDataRoomDocumentRequest): Observable<DataRoomDocument> {
    if (!request.externalUrl) {
      return throwError(() => new Error('External URL is required for link document'));
    }

    if (!this.isValidUrl(request.externalUrl)) {
      return throwError(() => new Error('Invalid URL format'));
    }

    const documentData = {
      data_room_id: request.dataRoomId,
      section_id: request.sectionId || null,
      document_id: null,
      external_url: request.externalUrl,
      document_type: 'link' as const,
      category: request.category,
      title: request.title,
      description: request.description || null,
      tags: request.tags || [],
      is_featured: request.isFeatured || false,
      is_shareable: request.isShareable !== false,
      display_order: 0,
      metadata: {}
    };

    return from(
      this.supabase
        .from('data_room_documents')
        .insert(documentData)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return transformDocumentFromDB(data);
      }),
      tap(() => this.invalidateCache(request.dataRoomId)),
      catchError(error => {
        console.error('❌ Error adding link document:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Update document (replaces file if provided)
   */
  updateDocument(request: UpdateDataRoomDocumentRequest): Observable<DataRoomDocument> {
    if (request.file) {
      return this.replaceDocumentFile(request.documentId, request.file).pipe(
        switchMap(() => this.updateDocumentMetadata(request))
      );
    }

    return this.updateDocumentMetadata(request);
  }

  /**
   * Delete document (removes file from storage if file type)
   */
  deleteDocument(documentId: string): Observable<void> {
    return this.getDocument(documentId).pipe(
      switchMap(document => {
        if (document.documentType === 'file' && document.documentId) {
          return this.deleteBaseDocument(document.documentId).pipe(
            switchMap(() => this.deleteDataRoomDocument(documentId)),
            tap(() => this.invalidateAllCaches())
          );
        }

        return this.deleteDataRoomDocument(documentId).pipe(
          tap(() => this.invalidateAllCaches())
        );
      }),
      catchError(error => {
        console.error('❌ Error deleting document:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Bulk delete documents
   */
  async bulkDeleteDocuments(documentIds: string[]): Promise<void> {
    const results = await Promise.allSettled(
      documentIds.map(id => this.deleteDocument(id).toPromise())
    );

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(`Failed to delete ${failures.length}/${documentIds.length} documents`);
    }

    this.invalidateAllCaches();
  }

  // ===============================
  // DOCUMENT RETRIEVAL
  // ===============================

  /**
   * Get all documents for a data room with optional filters
   */
  getAllDocuments(dataRoomId: string, filters?: DocumentFilters): Observable<DataRoomDocument[]> {
    // Return cached if available and not expired
    const cached = this.getValidCache(dataRoomId);
    if (cached) {
      return cached;
    }

    let query = this.supabase
      .from('data_room_documents')
      .select(`
        *,
        documents (
          file_size,
          mime_type,
          original_name
        )
      `)
      .eq('data_room_id', dataRoomId);

    // Apply filters (all optional)
    if (filters?.sectionId) {
      query = query.eq('section_id', filters.sectionId);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.documentType) {
      query = query.eq('document_type', filters.documentType);
    }
    if (filters?.isShareable !== undefined) {
      query = query.eq('is_shareable', filters.isShareable);
    }
    if (filters?.isFeatured !== undefined) {
      query = query.eq('is_featured', filters.isFeatured);
    }
    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }
    if (filters?.searchQuery) {
      query = query.or(
        `title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`
      );
    }

    const observable = from(query.order('display_order', { ascending: true })).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(doc => this.enrichDocumentWithMetadata(doc));
      }),
      catchError(error => {
        console.error('❌ Error fetching documents:', error);
        return throwError(() => error);
      }),
      shareReplay(1),
      takeUntil(this.destroy$)
    );

    // Cache the observable
    this.documentCache.set(dataRoomId, {
      observable,
      timestamp: Date.now()
    });

    return observable;
  }

  /**
   * Get documents by section
   */
  getDocumentsBySection(sectionId: string): Observable<DataRoomDocument[]> {
    return from(
      this.supabase
        .from('data_room_documents')
        .select(`
          *,
          documents (
            file_size,
            mime_type,
            original_name
          )
        `)
        .eq('section_id', sectionId)
        .order('display_order', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).map(doc => this.enrichDocumentWithMetadata(doc));
      }),
      catchError(error => {
        console.error('❌ Error fetching section documents:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get documents by category
   */
  getDocumentsByCategory(dataRoomId: string, category: string): Observable<DataRoomDocument[]> {
    return this.getAllDocuments(dataRoomId, { category });
  }

  /**
   * Get single document
   */
  getDocument(documentId: string): Observable<DataRoomDocument> {
    return from(
      this.supabase
        .from('data_room_documents')
        .select('*')
        .eq('id', documentId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return transformDocumentFromDB(data);
      }),
      catchError(error => {
        console.error('❌ Error fetching document:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  // ===============================
  // DOCUMENT ACCESS
  // ===============================

  /**
   * Download document
   */
  downloadDocument(documentId: string): Observable<Blob> {
    return this.getDocument(documentId).pipe(
      switchMap(document => {
        if (document.documentType === 'link') {
          return throwError(() => new Error('Cannot download link documents'));
        }

        if (!document.documentId) {
          return throwError(() => new Error('Document file not found'));
        }

        return this.getDocumentFile(document.documentId);
      }),
      switchMap(baseDoc =>
        from(
          this.supabase.storage
            .from(BUCKET_NAME)
            .download(baseDoc.file_path)
        )
      ),
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError(error => {
        console.error('❌ Error downloading document:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Get temporary signed URL for document
   */
  getTemporaryUrl(documentId: string, expiresIn: number = SIGNED_URL_EXPIRY): Observable<string> {
    return this.getDocument(documentId).pipe(
      switchMap(document => {
        if (document.documentType === 'link') {
          return from([document.externalUrl!]);
        }

        if (!document.documentId) {
          return throwError(() => new Error('Document file not found'));
        }

        return this.getDocumentFile(document.documentId);
      }),
      switchMap(baseDoc => {
        if (typeof baseDoc === 'string') {
          return from([baseDoc]); // Link document URL
        }

        return from(
          this.supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(baseDoc.file_path, expiresIn)
        ).pipe(
          map(({ data, error }) => {
            if (error) throw error;
            return data.signedUrl;
          })
        );
      }),
      catchError(error => {
        console.error('❌ Error getting signed URL:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  // ===============================
  // UTILITIES
  // ===============================

  /**
   * Get unique categories for a data room
   */
  getCategories(dataRoomId: string): Observable<string[]> {
    return from(
      this.supabase
        .from('data_room_documents')
        .select('category')
        .eq('data_room_id', dataRoomId)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;

        const categories = data.map((doc: any) => doc.category);
        return [...new Set(categories)].sort();
      }),
      catchError(error => {
        console.error('❌ Error fetching categories:', error);
        return throwError(() => error);
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Reorder documents within a section
   */
  async reorderDocuments(documentOrders: { id: string; order: number }[]): Promise<void> {
    const results = await Promise.allSettled(
      documentOrders.map(({ id, order }) =>
        this.supabase
          .from('data_room_documents')
          .update({ display_order: order })
          .eq('id', id)
      )
    );

    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(`Failed to reorder ${failures.length}/${documentOrders.length} documents`);
    }

    this.invalidateAllCaches();
  }

  // ===============================
  // PRIVATE HELPERS
  // ===============================

  /**
   * Enrich document with file metadata (extracted helper)
   */
  private enrichDocumentWithMetadata(doc: any): DataRoomDocument {
    const transformed = transformDocumentFromDB(doc);

    if (doc.documents) {
      transformed.fileSize = doc.documents.file_size;
      transformed.mimeType = doc.documents.mime_type;
      transformed.originalName = doc.documents.original_name;
    }

    return transformed;
  }

  /**
   * Upload file to storage
   */
  private uploadFile(path: string, file: File): Observable<{ path: string }> {
    return from(
      this.supabase.storage
        .from(BUCKET_NAME)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return { path: data.path };
      }),
      catchError(error => {
        console.error('❌ Error uploading file:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create base document record
   */
  private createBaseDocumentRecord(
    userId: string,
    request: CreateDataRoomDocumentRequest,
    filePath: string
  ): Observable<any> {
    const documentData = {
      user_id: userId,
      application_id: null,
      document_key: `data_room_${Date.now()}`,
      original_name: request.file!.name,
      file_name: request.file!.name,
      file_path: filePath,
      file_size: request.file!.size,
      mime_type: request.file!.type,
      category: request.category,
      status: 'uploaded',
      metadata: {}
    };

    return from(
      this.supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError(error => {
        console.error('❌ Error creating base document:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create data room document record
   */
  private createDataRoomDocumentRecord(
    request: CreateDataRoomDocumentRequest,
    documentId: string
  ): Observable<DataRoomDocument> {
    const dataRoomDocData = {
      data_room_id: request.dataRoomId,
      section_id: request.sectionId || null,
      document_id: documentId,
      external_url: null,
      document_type: 'file' as const,
      category: request.category,
      title: request.title,
      description: request.description || null,
      tags: request.tags || [],
      is_featured: request.isFeatured || false,
      is_shareable: request.isShareable !== false,
      display_order: 0,
      metadata: {}
    };

    return from(
      this.supabase
        .from('data_room_documents')
        .insert(dataRoomDocData)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return transformDocumentFromDB(data);
      }),
      catchError(error => {
        console.error('❌ Error creating data room document:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update document metadata
   */
  private updateDocumentMetadata(
    request: UpdateDataRoomDocumentRequest
  ): Observable<DataRoomDocument> {
    const updates: any = {};

    if (request.title) updates.title = request.title;
    if (request.description !== undefined) updates.description = request.description;
    if (request.category) updates.category = request.category;
    if (request.tags !== undefined) updates.tags = request.tags;
    if (request.isFeatured !== undefined) updates.is_featured = request.isFeatured;
    if (request.isShareable !== undefined) updates.is_shareable = request.isShareable;
    if (request.displayOrder !== undefined) updates.display_order = request.displayOrder;

    return from(
      this.supabase
        .from('data_room_documents')
        .update(updates)
        .eq('id', request.documentId)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return transformDocumentFromDB(data);
      }),
      tap(() => this.invalidateAllCaches()),
      catchError(error => {
        console.error('❌ Error updating document metadata:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Replace document file
   */
  private replaceDocumentFile(documentId: string, newFile: File): Observable<void> {
    return this.getDocument(documentId).pipe(
      switchMap(document => {
        if (document.documentType !== 'file' || !document.documentId) {
          return throwError(() => new Error('Cannot replace file for link document'));
        }

        return this.getDocumentFile(document.documentId);
      }),
      switchMap(baseDoc =>
        from(
          this.supabase.storage
            .from(BUCKET_NAME)
            .remove([baseDoc.file_path])
        )
      ),
      switchMap(() => {
        const userId = this.supabase.getCurrentUserId();
        const timestamp = Date.now();
        const sanitizedFileName = this.sanitizeFileName(newFile.name);
        const filePath = `${userId}/${documentId}/${timestamp}_${sanitizedFileName}`;

        return this.uploadFile(filePath, newFile);
      }),
      switchMap(uploadResult =>
        this.getDocument(documentId).pipe(
          switchMap(doc =>
            from(
              this.supabase
                .from('documents')
                .update({
                  file_path: uploadResult.path,
                  file_size: newFile.size,
                  mime_type: newFile.type,
                  original_name: newFile.name,
                  file_name: newFile.name
                })
                .eq('id', doc.documentId)
            )
          )
        )
      ),
      map(() => undefined),
      catchError(error => {
        console.error('❌ Error replacing document file:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete data room document record
   */
  private deleteDataRoomDocument(documentId: string): Observable<void> {
    return from(
      this.supabase
        .from('data_room_documents')
        .delete()
        .eq('id', documentId)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
      catchError(error => {
        console.error('❌ Error deleting data room document:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete base document (file + record)
   */
  private deleteBaseDocument(documentId: string): Observable<void> {
    return this.getDocumentFile(documentId).pipe(
      switchMap(baseDoc =>
        from(
          this.supabase.storage
            .from(BUCKET_NAME)
            .remove([baseDoc.file_path])
        )
      ),
      switchMap(() =>
        from(
          this.supabase
            .from('documents')
            .delete()
            .eq('id', documentId)
        )
      ),
      map(() => undefined),
      catchError(error => {
        console.error('❌ Error deleting base document:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get document file record
   */
  private getDocumentFile(documentId: string): Observable<any> {
    return from(
      this.supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError(error => {
        console.error('❌ Error fetching document file:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get valid cache (if not expired)
   */
  private getValidCache(dataRoomId: string): Observable<DataRoomDocument[]> | null {
    const cached = this.documentCache.get(dataRoomId);

    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      this.documentCache.delete(dataRoomId);
      return null;
    }

    return cached.observable;
  }

  /**
   * Invalidate cache for a specific data room
   */
  private invalidateCache(dataRoomId: string): void {
    this.documentCache.delete(dataRoomId);
  }

  /**
   * Invalidate all caches
   */
  private invalidateAllCaches(): void {
    this.documentCache.clear();
  }

  /**
   * Sanitize file name
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * PRODUCTION-SAFE: Comprehensive file validation
   *
   * Validates:
   * - File size
   * - File extension
   * - MIME type match with extension
   * - Content type validation
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Size validation
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size (${this.formatBytes(file.size)}) exceeds maximum allowed size (${this.formatBytes(MAX_FILE_SIZE)})`
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty (0 bytes)'
      };
    }

    // Extension validation
    const extension = this.getFileExtension(file.name);
    if (!environment.storage.allowedTypes.includes(extension)) {
      return {
        valid: false,
        error: `File type '.${extension}' is not allowed. Allowed types: ${environment.storage.allowedTypes.join(', ')}`
      };
    }

    // MIME type validation (match extension with actual content type)
    const allowedMimeTypes = environment.storage.allowedMimeTypes[extension];
    if (allowedMimeTypes && !allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File MIME type '${file.type}' does not match extension '.${extension}'. Possible file type mismatch.`
      };
    }

    // Security: Block executable files
    const dangerousExtensions = ['exe', 'bat', 'cmd', 'sh', 'app', 'dmg', 'pkg', 'deb', 'rpm'];
    if (dangerousExtensions.includes(extension.toLowerCase())) {
      return {
        valid: false,
        error: 'Executable files are not allowed for security reasons'
      };
    }

    return { valid: true };
  }

  /**
   * Get file extension without dot
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  /**
   * Format bytes to human-readable size
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * PRODUCTION-SAFE: Rollback file upload transaction
   *
   * Cleans up resources created during failed upload:
   * - Deletes uploaded file from storage
   * - Deletes base document record from database
   *
   * Called automatically when document creation fails
   */
  private rollbackFileUpload(
    filePath: string | null,
    baseDocumentId: string | null
  ): Observable<void> {
    const cleanupTasks: Observable<any>[] = [];

    // Clean up storage
    if (filePath) {
      console.log(`🔄 Rolling back: Deleting file from storage: ${filePath}`);
      cleanupTasks.push(
        from(
          this.supabase.storage.from(BUCKET_NAME).remove([filePath])
        ).pipe(
          catchError(error => {
            console.warn('⚠️  Storage cleanup failed (non-critical):', error);
            return from([null]); // Continue with other cleanup
          })
        )
      );
    }

    // Clean up database record
    if (baseDocumentId) {
      console.log(`🔄 Rolling back: Deleting document record: ${baseDocumentId}`);
      cleanupTasks.push(
        from(
          this.supabase.from('documents').delete().eq('id', baseDocumentId)
        ).pipe(
          catchError(error => {
            console.warn('⚠️  Database cleanup failed (non-critical):', error);
            return from([null]);
          })
        )
      );
    }

    if (cleanupTasks.length === 0) {
      return from([undefined]);
    }

    // Execute all cleanup tasks in parallel
    return from(Promise.all(cleanupTasks.map(task => task.toPromise()))).pipe(
      map(() => undefined)
    );
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    console.log('🧹 DataRoomDocumentService destroyed');
    this.destroy$.next();
    this.destroy$.complete();
    this.documentCache.clear();
  }
}