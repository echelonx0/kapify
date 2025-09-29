// src/app/SMEs/data-room/services/data-room-document.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { AuthService } from 'src/app/auth/production.auth.service';
import {
  DataRoomDocument,
  CreateDataRoomDocumentRequest,
  UpdateDataRoomDocumentRequest,
  DocumentFilters,
  transformDocumentFromDB
} from '../models/data-room.models';

@Injectable({
  providedIn: 'root'
})
export class DataRoomDocumentService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  
  private readonly BUCKET_NAME = 'data-room-documents';
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  /**
   * Add file document to data room
   * Uploads file to storage and creates document record
   */
  addFileDocument(request: CreateDataRoomDocumentRequest): Observable<DataRoomDocument> {
    if (!request.file) {
      return throwError(() => new Error('File is required for file document'));
    }

    if (request.file.size > this.MAX_FILE_SIZE) {
      return throwError(() => new Error('File size exceeds maximum limit of 50MB'));
    }

    const userId = this.authService.user()?.id;
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Generate unique file name
    const timestamp = Date.now();
    const sanitizedFileName = this.sanitizeFileName(request.file.name);
    const filePath = `${userId}/${request.dataRoomId}/${timestamp}_${sanitizedFileName}`;

    // Upload file first
    return this.uploadFile(filePath, request.file).pipe(
      switchMap(uploadResult => {
        // Create document record in documents table first
        return this.createBaseDocumentRecord(userId, request, uploadResult.path);
      }),
      switchMap(documentRecord => {
        // Create data room document record
        return this.createDataRoomDocumentRecord(request, documentRecord.id);
      })
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
      })
    );
  }

  /**
   * Update document (replaces file if provided)
   */
  updateDocument(request: UpdateDataRoomDocumentRequest): Observable<DataRoomDocument> {
    // If new file provided, replace it
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
        // If it's a file document, delete from storage
        if (document.documentType === 'file' && document.documentId) {
          return this.deleteBaseDocument(document.documentId).pipe(
            switchMap(() => this.deleteDataRoomDocument(documentId))
          );
        }

        // For link documents, just delete the record
        return this.deleteDataRoomDocument(documentId);
      })
    );
  }

  /**
   * Bulk delete documents
   */
  bulkDeleteDocuments(documentIds: string[]): Observable<void> {
    return forkJoin(
      documentIds.map(id => this.deleteDocument(id))
    ).pipe(
      map(() => undefined)
    );
  }

  /**
   * Get all documents for a data room with optional filters
   */
  getAllDocuments(dataRoomId: string, filters?: DocumentFilters): Observable<DataRoomDocument[]> {
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

    // Apply filters
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
      query = query.or(`title.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
    }

    query = query.order('display_order', { ascending: true });

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        
        return data.map(doc => {
          const transformed = transformDocumentFromDB(doc);
          
          // Add file metadata if available
          if (doc.documents) {
            transformed.fileSize = doc.documents.file_size;
            transformed.mimeType = doc.documents.mime_type;
            transformed.originalName = doc.documents.original_name;
          }
          
          return transformed;
        });
      })
    );
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
        
        return data.map(doc => {
          const transformed = transformDocumentFromDB(doc);
          if (doc.documents) {
            transformed.fileSize = doc.documents.file_size;
            transformed.mimeType = doc.documents.mime_type;
            transformed.originalName = doc.documents.original_name;
          }
          return transformed;
        });
      })
    );
  }

  /**
   * Get documents by category
   */
  getDocumentsByCategory(dataRoomId: string, category: string): Observable<DataRoomDocument[]> {
    return this.getAllDocuments(dataRoomId, { category });
  }

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
      switchMap(baseDoc => {
        return from(
          this.supabase.storage
            .from(this.BUCKET_NAME)
            .download(baseDoc.file_path)
        ).pipe(
          map(({ data, error }) => {
            if (error) throw error;
            return data;
          })
        );
      })
    );
  }

  /**
   * Get temporary signed URL for document
   */
  getTemporaryUrl(documentId: string, expiresIn: number = 3600): Observable<string> {
    return this.getDocument(documentId).pipe(
      switchMap(document => {
        if (document.documentType === 'link') {
          return of(document.externalUrl!);
        }

        if (!document.documentId) {
          return throwError(() => new Error('Document file not found'));
        }

        return this.getDocumentFile(document.documentId);
      }),
      switchMap(baseDoc => {
        if (typeof baseDoc === 'string') {
          return of(baseDoc); // Already a URL for link documents
        }

        return from(
          this.supabase.storage
            .from(this.BUCKET_NAME)
            .createSignedUrl(baseDoc.file_path, expiresIn)
        ).pipe(
          map(({ data, error }) => {
            if (error) throw error;
            return data.signedUrl;
          })
        );
      })
    );
  }

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
        
        const categories = data.map(doc => doc.category);
        return [...new Set(categories)].sort();
      })
    );
  }

  /**
   * Reorder documents within a section
   */
  reorderDocuments(documentOrders: { id: string; order: number }[]): Observable<void> {
    const updates = documentOrders.map(({ id, order }) =>
      from(
        this.supabase
          .from('data_room_documents')
          .update({ display_order: order })
          .eq('id', id)
      )
    );

    return forkJoin(updates).pipe(map(() => undefined));
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private getDocument(documentId: string): Observable<DataRoomDocument> {
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
      })
    );
  }

  private uploadFile(path: string, file: File): Observable<{ path: string }> {
    return from(
      this.supabase.storage
        .from(this.BUCKET_NAME)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return { path: data.path };
      })
    );
  }

  private createBaseDocumentRecord(userId: string, request: CreateDataRoomDocumentRequest, filePath: string): Observable<any> {
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
      })
    );
  }

  private createDataRoomDocumentRecord(request: CreateDataRoomDocumentRequest, documentId: string): Observable<DataRoomDocument> {
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
      })
    );
  }

  private updateDocumentMetadata(request: UpdateDataRoomDocumentRequest): Observable<DataRoomDocument> {
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
      })
    );
  }

  private replaceDocumentFile(documentId: string, newFile: File): Observable<void> {
    return this.getDocument(documentId).pipe(
      switchMap(document => {
        if (document.documentType !== 'file' || !document.documentId) {
          return throwError(() => new Error('Cannot replace file for link document'));
        }

        return this.getDocumentFile(document.documentId);
      }),
      switchMap(baseDoc => {
        // Delete old file
        return from(
          this.supabase.storage
            .from(this.BUCKET_NAME)
            .remove([baseDoc.file_path])
        );
      }),
      switchMap(() => {
        // Upload new file
        const userId = this.authService.user()?.id;
        const timestamp = Date.now();
        const sanitizedFileName = this.sanitizeFileName(newFile.name);
        const filePath = `${userId}/${documentId}/${timestamp}_${sanitizedFileName}`;

        return this.uploadFile(filePath, newFile);
      }),
      switchMap(uploadResult => {
        // Update base document record
        return this.getDocument(documentId).pipe(
          switchMap(doc => {
            return from(
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
            );
          })
        );
      }),
      map(() => undefined)
    );
  }

  private deleteDataRoomDocument(documentId: string): Observable<void> {
    return from(
      this.supabase
        .from('data_room_documents')
        .delete()
        .eq('id', documentId)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      })
    );
  }

  private deleteBaseDocument(documentId: string): Observable<void> {
    return this.getDocumentFile(documentId).pipe(
      switchMap(baseDoc => {
        // Delete from storage
        return from(
          this.supabase.storage
            .from(this.BUCKET_NAME)
            .remove([baseDoc.file_path])
        );
      }),
      switchMap(() => {
        // Delete record
        return from(
          this.supabase
            .from('documents')
            .delete()
            .eq('id', documentId)
        );
      }),
      map(() => undefined)
    );
  }

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
      })
    );
  }

  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}