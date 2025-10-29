import { Injectable, signal, inject } from '@angular/core';
import {
  Observable,
  from,
  throwError,
  BehaviorSubject,
  Subject,
  timer,
} from 'rxjs';
import { tap, catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SharedSupabaseService } from './shared-supabase.service';

export interface DocumentUploadResult {
  id: string;
  documentKey: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  publicUrl: string;
  category: string;
}

export interface DocumentMetadata {
  id: string;
  userId: string;
  applicationId?: string;
  documentKey: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  publicUrl: string;
  category: string;
  status: 'uploaded' | 'processing' | 'approved' | 'rejected';
  uploadedAt: string;
  updatedAt: string;
}

export interface UploadProgress {
  documentKey: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseDocumentService {
  private supabase = inject(SharedSupabaseService);
  private destroy$ = new Subject<void>();

  // Upload progress tracking with auto-cleanup
  private uploadProgressSubject = new BehaviorSubject<
    Map<string, UploadProgress>
  >(new Map());
  private progressCleanupTimers = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  public uploadProgress$ = this.uploadProgressSubject.asObservable();

  // State signals
  isUploading = signal<boolean>(false);
  uploadError = signal<string | null>(null);

  private readonly STORAGE_BUCKET =
    environment.storage?.bucket || 'platform-documents';
  private readonly MAX_FILE_SIZE = environment.storage?.maxFileSize || 52428800; // 50MB
  private readonly ALLOWED_TYPES = environment.storage?.allowedTypes || [
    'pdf',
    'doc',
    'docx',
    'jpg',
    'jpeg',
    'png',
    'xls',
    'xlsx',
  ];
  private readonly PROGRESS_CLEANUP_DELAY = 60000; // 60s

  constructor() {
    this.validateStorageBucket();
  }

  /**
   * Validate that the storage bucket is configured
   */
  private validateStorageBucket(): void {
    if (!this.STORAGE_BUCKET || this.STORAGE_BUCKET.trim() === '') {
      console.warn('⚠️ Storage bucket not configured in environment');
    }
  }

  /**
   * Upload document with progress tracking
   * Matches component interface: uploadDocument(file, doc.key, appId, category)
   */
  uploadDocument(
    file: File,
    documentKey: string,
    applicationId?: string,
    category: string = 'general'
  ): Observable<DocumentUploadResult> {
    // Get user ID - fail fast if not authenticated
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      const error = new Error('User not authenticated. Please log in first.');
      this.uploadError.set(error.message);
      return throwError(() => error);
    }

    // Validate file before starting
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      const error = new Error(validation.error || 'File validation failed');
      this.uploadError.set(error.message);
      return throwError(() => error);
    }

    // Initialize progress tracking
    this.updateUploadProgress(documentKey, 0, 'uploading');
    this.isUploading.set(true);
    this.uploadError.set(null);

    return from(
      this.performUpload(file, userId, documentKey, applicationId, category)
    ).pipe(
      tap((result) => {
        this.updateUploadProgress(documentKey, 100, 'complete');
        this.isUploading.set(false);
        this.scheduleProgressCleanup(documentKey);
        console.log('✅ Document uploaded:', result.fileName);
      }),
      catchError((error) => {
        const message = error?.message || 'Upload failed';
        this.updateUploadProgress(documentKey, 0, 'error', message);
        this.isUploading.set(false);
        this.uploadError.set(message);
        console.error('❌ Document upload failed:', error);
        this.scheduleProgressCleanup(documentKey);
        return throwError(() => error);
      })
    );
  }

  /**
   * Perform the actual file upload to Supabase storage
   */
  private async performUpload(
    file: File,
    userId: string,
    documentKey: string,
    applicationId?: string,
    category: string = 'general'
  ): Promise<DocumentUploadResult> {
    try {
      // Generate unique file path
      const fileExtension = this.getFileExtension(file.name);
      const timestamp = Date.now();
      const fileName = `${documentKey}_${timestamp}${fileExtension}`;
      const filePath = applicationId
        ? `${userId}/applications/${applicationId}/${category}/${fileName}`
        : `${userId}/${category}/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } =
        await this.supabase.storage
          .from(this.STORAGE_BUCKET)
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Simulate realistic upload progress
      this.simulateUploadProgress(documentKey);

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to generate public URL for uploaded file');
      }

      const result: DocumentUploadResult = {
        id: uploadData?.id || '',
        documentKey,
        originalName: file.name,
        fileName,
        filePath,
        fileSize: file.size,
        mimeType: file.type,
        publicUrl: urlData.publicUrl,
        category,
      };

      // Store metadata in database (non-critical failure)
      await this.storeDocumentMetadata(userId, result, applicationId);

      return result;
    } catch (error) {
      console.error('Upload operation failed:', error);
      throw error;
    }
  }

  /**
   * Store document metadata in database
   * Non-critical: file is already uploaded successfully
   */
  private async storeDocumentMetadata(
    userId: string,
    uploadResult: DocumentUploadResult,
    applicationId?: string
  ): Promise<void> {
    const metadata = {
      user_id: userId,
      application_id: applicationId || null,
      document_key: uploadResult.documentKey,
      original_name: uploadResult.originalName,
      file_name: uploadResult.fileName,
      file_path: uploadResult.filePath,
      file_size: uploadResult.fileSize,
      mime_type: uploadResult.mimeType,
      public_url: uploadResult.publicUrl,
      category: uploadResult.category,
      status: 'uploaded',
      metadata: {},
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await this.supabase.from('documents').insert(metadata);

      if (error) {
        console.warn(
          'Failed to store document metadata (non-critical):',
          error
        );
      }
    } catch (error) {
      console.warn('Metadata storage error (non-critical):', error);
    }
  }

  /**
   * Get documents for user, optionally filtered by application
   * Returns Map<documentKey, metadata> to match component usage
   */
  getDocumentsByUser(
    applicationId?: string
  ): Observable<Map<string, DocumentMetadata>> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.performGetDocuments(userId, applicationId)).pipe(
      map((documents) => {
        const docMap = new Map<string, DocumentMetadata>();
        documents.forEach((doc) => {
          docMap.set(doc.documentKey, doc);
        });
        return docMap;
      }),
      catchError((error) => {
        console.error('Failed to retrieve documents:', error);
        return throwError(
          () => new Error(`Failed to load documents: ${error?.message}`)
        );
      })
    );
  }

  /**
   * Fetch documents from database
   */
  private async performGetDocuments(
    userId: string,
    applicationId?: string
  ): Promise<DocumentMetadata[]> {
    let query = this.supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);

    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    const { data, error } = await query.order('uploaded_at', {
      ascending: false,
    });

    if (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }

    return (data || []).map((doc) => ({
      id: doc.id,
      userId: doc.user_id,
      applicationId: doc.application_id,
      documentKey: doc.document_key,
      originalName: doc.original_name,
      fileName: doc.file_name,
      filePath: doc.file_path,
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      publicUrl: doc.public_url,
      category: doc.category,
      status: doc.status,
      uploadedAt: doc.uploaded_at,
      updatedAt: doc.updated_at,
    }));
  }

  /**
   * Delete document by key
   * Matches component: this.documentService.deleteDocumentByKey(doc.key)
   */
  deleteDocumentByKey(documentKey: string): Observable<void> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.performDeleteByKey(documentKey, userId)).pipe(
      tap(() => {
        console.log('✅ Document deleted:', documentKey);
      }),
      catchError((error) => {
        const message = error?.message || 'Delete failed';
        console.error('❌ Document deletion failed:', message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Perform actual deletion from storage and database
   */
  private async performDeleteByKey(
    documentKey: string,
    userId: string
  ): Promise<void> {
    // Get document metadata
    const { data: doc, error: docError } = await this.supabase
      .from('documents')
      .select('file_path')
      .eq('document_key', documentKey)
      .eq('user_id', userId)
      .single();

    if (docError || !doc) {
      throw new Error('Document not found or access denied');
    }

    // Delete from storage
    const { error: storageError } = await this.supabase.storage
      .from(this.STORAGE_BUCKET)
      .remove([doc.file_path]);

    if (storageError) {
      console.warn(
        'Storage deletion failed (continuing with DB cleanup):',
        storageError
      );
    }

    // Delete from database
    const { error: dbError } = await this.supabase
      .from('documents')
      .delete()
      .eq('document_key', documentKey)
      .eq('user_id', userId);

    if (dbError) {
      throw new Error(`Database deletion failed: ${dbError.message}`);
    }
  }

  /**
   * Download document by key
   * Matches component: this.documentService.downloadDocumentByKey(doc.key)
   */
  downloadDocumentByKey(documentKey: string): Observable<string> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.getSignedDownloadUrlByKey(documentKey, userId)).pipe(
      tap((url) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = '';
        link.click();
      }),
      catchError((error) => {
        console.error('Download failed:', error);
        return throwError(
          () => new Error(`Download failed: ${error?.message}`)
        );
      })
    );
  }

  /**
   * Get signed download URL
   */
  private async getSignedDownloadUrlByKey(
    documentKey: string,
    userId: string,
    expiresIn: number = 3600
  ): Promise<string> {
    // Get document metadata
    const { data: doc, error: docError } = await this.supabase
      .from('documents')
      .select('file_path, original_name')
      .eq('document_key', documentKey)
      .eq('user_id', userId)
      .single();

    if (docError || !doc) {
      throw new Error('Document not found or access denied');
    }

    // Generate signed URL
    const { data, error } = await this.supabase.storage
      .from(this.STORAGE_BUCKET)
      .createSignedUrl(doc.file_path, expiresIn);

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to generate download URL: ${error?.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Check if document exists
   */
  hasDocument(documentKey: string): Observable<boolean> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabase
        .from('documents')
        .select('id')
        .eq('document_key', documentKey)
        .eq('user_id', userId)
        .single()
    ).pipe(
      map(({ data, error }) => !error && !!data),
      catchError(() => from([false]))
    );
  }

  /**
   * Get file blob for download
   */
  getFileForDownload(documentKey: string): Observable<Blob> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.getSignedDownloadUrlByKey(documentKey, userId)).pipe(
      switchMap((signedUrl) =>
        from(
          fetch(signedUrl).then((response) => {
            if (!response.ok) {
              throw new Error(`Download failed: ${response.statusText}`);
            }
            return response.blob();
          })
        )
      ),
      catchError((error) => {
        console.error('File download failed:', error);
        return throwError(() => error);
      })
    );
  }

  // ===================================
  // PROGRESS TRACKING & UTILITIES
  // ===================================

  /**
   * Get current upload progress
   */
  getUploadProgress(documentKey: string): UploadProgress | null {
    return this.uploadProgressSubject.value.get(documentKey) || null;
  }

  /**
   * Clear upload progress manually
   */
  clearUploadProgress(documentKey: string): void {
    const currentProgress = this.uploadProgressSubject.value;
    const newProgress = new Map(currentProgress);
    newProgress.delete(documentKey);
    this.uploadProgressSubject.next(newProgress);

    // Cancel cleanup timer if exists
    this.cancelProgressCleanup(documentKey);
  }

  /**
   * Schedule automatic progress cleanup
   */
  private scheduleProgressCleanup(documentKey: string): void {
    this.cancelProgressCleanup(documentKey);

    const timer = setTimeout(() => {
      this.clearUploadProgress(documentKey);
      this.progressCleanupTimers.delete(documentKey);
    }, this.PROGRESS_CLEANUP_DELAY);

    this.progressCleanupTimers.set(documentKey, timer);
  }

  /**
   * Cancel scheduled cleanup
   */
  private cancelProgressCleanup(documentKey: string): void {
    const existingTimer = this.progressCleanupTimers.get(documentKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.progressCleanupTimers.delete(documentKey);
    }
  }

  /**
   * Update progress state
   */
  private updateUploadProgress(
    documentKey: string,
    progress: number,
    status: 'uploading' | 'complete' | 'error',
    error?: string
  ): void {
    const currentProgress = this.uploadProgressSubject.value;
    const newProgress = new Map(currentProgress);

    newProgress.set(documentKey, {
      documentKey,
      progress: Math.min(progress, 100),
      status,
      error,
    });

    this.uploadProgressSubject.next(newProgress);
  }

  /**
   * Simulate realistic upload progress
   */
  private simulateUploadProgress(documentKey: string): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 95) {
        progress = 95;
        clearInterval(interval);
        return;
      }
      this.updateUploadProgress(
        documentKey,
        Math.min(progress, 95),
        'uploading'
      );
    }, 200);
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { isValid: boolean; error?: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size must be less than ${this.formatFileSize(
          this.MAX_FILE_SIZE
        )}`,
      };
    }

    const extension = this.getFileExtension(file.name)
      .toLowerCase()
      .replace('.', '');
    if (!this.ALLOWED_TYPES.includes(extension)) {
      return {
        isValid: false,
        error: `File type not allowed. Supported: ${this.ALLOWED_TYPES.join(
          ', '
        )}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Extract file extension
   */
  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? '.' + parts.pop()!.toLowerCase() : '';
  }

  /**
   * Format bytes to human-readable size
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.uploadProgressSubject.complete();

    // Clear all pending cleanup timers
    this.progressCleanupTimers.forEach((timer) => clearTimeout(timer));
    this.progressCleanupTimers.clear();
  }
}
