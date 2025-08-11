// src/app/shared/services/supabase-document.service.ts - FIXED FOR YOUR COMPONENT
import { Injectable, signal, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';
import { environment } from '../../../environments/environment';

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
  documentKey: string; // Changed from documentType to match your component
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
  documentKey: string; // Changed to match your component
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SupabaseDocumentService {
  private authService = inject(AuthService);
  private supabase: SupabaseClient;
  
  // Upload progress tracking
  private uploadProgressSubject = new BehaviorSubject<Map<string, UploadProgress>>(new Map());
  public uploadProgress$ = this.uploadProgressSubject.asObservable();
  
  // State signals
  isUploading = signal<boolean>(false);
  uploadError = signal<string | null>(null);
  
  private readonly STORAGE_BUCKET = environment.storage?.bucket || 'platform-documents';
  private readonly MAX_FILE_SIZE = environment.storage?.maxFileSize || 52428800; // 50MB
  private readonly ALLOWED_TYPES = environment.storage?.allowedTypes || ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'xls', 'xlsx'];

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  // ===============================
  // FILE UPLOAD - MATCHING YOUR COMPONENT INTERFACE
  // ===============================

  uploadDocument(
    file: File,
    documentKey: string, // Matches your component's doc.key
    applicationId?: string,
    category: string = 'general'
  ): Observable<DocumentUploadResult> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      return throwError(() => new Error(validation.error));
    }

    this.updateUploadProgress(documentKey, 0, 'uploading');
    this.isUploading.set(true);
    this.uploadError.set(null);

    return from(this.performUpload(file, currentUser.id, documentKey, applicationId, category)).pipe(
      tap(result => {
        this.updateUploadProgress(documentKey, 100, 'complete');
        this.isUploading.set(false);
        console.log('✅ Document uploaded successfully:', result.fileName);
      }),
      catchError(error => {
        this.updateUploadProgress(documentKey, 0, 'error', error.message);
        this.isUploading.set(false);
        this.uploadError.set(error.message);
        console.error('❌ Document upload failed:', error);
        return throwError(() => error);
      })
    );
  }

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

      // Upload to Supabase Storage with progress simulation
      const uploadPromise = this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      // Simulate upload progress
      this.simulateUploadProgress(documentKey);

      const { data: uploadData, error: uploadError } = await uploadPromise;

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to generate public URL');
      }

      const result: DocumentUploadResult = {
        id: this.generateDocumentId(),
        documentKey,
        originalName: file.name,
        fileName,
        filePath,
        fileSize: file.size,
        mimeType: file.type,
        publicUrl: urlData.publicUrl,
        category
      };

      // Store metadata in database
      await this.storeDocumentMetadata(userId, result, applicationId);

      return result;
    } catch (error) {
      console.error('Upload operation failed:', error);
      throw error;
    }
  }

  // ===============================
  // DATABASE METADATA STORAGE
  // ===============================

  private async storeDocumentMetadata(
    userId: string,
    uploadResult: DocumentUploadResult,
    applicationId?: string
  ): Promise<void> {
    const metadata = {
      id: uploadResult.id,
      user_id: userId,
      application_id: applicationId,
      document_key: uploadResult.documentKey, // Fixed column name
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
      updated_at: new Date().toISOString()
    };

    const { error } = await this.supabase
      .from('documents')
      .insert(metadata);

    if (error) {
      console.error('Failed to store document metadata:', error);
      // Don't throw - file is already uploaded successfully
    }
  }

  // ===============================
  // DOCUMENT RETRIEVAL - MATCHING YOUR COMPONENT
  // ===============================

  getDocumentsByUser(applicationId?: string): Observable<Map<string, DocumentMetadata>> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.performGetDocuments(currentUser.id, applicationId)).pipe(
      map(documents => {
        // Return as Map keyed by documentKey to match your component usage
        const docMap = new Map<string, DocumentMetadata>();
        documents.forEach(doc => {
          docMap.set(doc.documentKey, doc);
        });
        return docMap;
      }),
      catchError(error => {
        console.error('Failed to retrieve documents:', error);
        return throwError(() => error);
      })
    );
  }

  private async performGetDocuments(userId: string, applicationId?: string): Promise<DocumentMetadata[]> {
    let query = this.supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId);

    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    const { data, error } = await query.order('uploaded_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to retrieve documents: ${error.message}`);
    }

    return (data || []).map(doc => ({
      id: doc.id,
      userId: doc.user_id,
      applicationId: doc.application_id,
      documentKey: doc.document_key, // Fixed column name
      originalName: doc.original_name,
      fileName: doc.file_name,
      filePath: doc.file_path,
      fileSize: doc.file_size,
      mimeType: doc.mime_type,
      publicUrl: doc.public_url,
      category: doc.category,
      status: doc.status,
      uploadedAt: doc.uploaded_at,
      updatedAt: doc.updated_at
    }));
  }

  // ===============================
  // DOCUMENT DELETION - BY DOCUMENT KEY
  // ===============================

  deleteDocumentByKey(documentKey: string): Observable<void> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(this.performDeleteByKey(documentKey, currentUser.id)).pipe(
      tap(() => {
        console.log('✅ Document deleted successfully:', documentKey);
      }),
      catchError(error => {
        console.error('❌ Document deletion failed:', error);
        return throwError(() => error);
      })
    );
  }

  private async performDeleteByKey(documentKey: string, userId: string): Promise<void> {
    // Get document metadata
    const { data: doc, error: docError } = await this.supabase
      .from('documents')
      .select('file_path')
      .eq('document_key', documentKey) // Use document_key instead of id
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
      console.error('Storage deletion failed:', storageError);
      // Continue with database cleanup even if storage deletion fails
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

  // ===============================
  // DOCUMENT DOWNLOAD
  // ===============================

  downloadDocumentByKey(documentKey: string): Observable<string> {
    return from(this.getSignedDownloadUrlByKey(documentKey)).pipe(
      tap(url => {
        // Create temporary download link
        const link = document.createElement('a');
        link.href = url;
        link.download = '';
        link.click();
      }),
      catchError(error => {
        console.error('Download failed:', error);
        return throwError(() => error);
      })
    );
  }

  private async getSignedDownloadUrlByKey(documentKey: string, expiresIn: number = 3600): Promise<string> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get document metadata to find file path
    const { data: doc, error: docError } = await this.supabase
      .from('documents')
      .select('file_path, original_name')
      .eq('document_key', documentKey)
      .eq('user_id', currentUser.id)
      .single();

    if (docError || !doc) {
      throw new Error('Document not found or access denied');
    }

    // Generate signed URL for private access
    const { data, error } = await this.supabase.storage
      .from(this.STORAGE_BUCKET)
      .createSignedUrl(doc.file_path, expiresIn);

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to generate download URL: ${error?.message}`);
    }

    return data.signedUrl;
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size must be less than ${this.formatFileSize(this.MAX_FILE_SIZE)}`
      };
    }

    // Check file type
    const extension = this.getFileExtension(file.name).toLowerCase().replace('.', '');
    if (!this.ALLOWED_TYPES.includes(extension)) {
      return {
        isValid: false,
        error: `File type not allowed. Supported types: ${this.ALLOWED_TYPES.join(', ')}`
      };
    }

    return { isValid: true };
  }

  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.');
    return parts.length > 1 ? '.' + parts.pop()!.toLowerCase() : '';
  }

  private generateDocumentId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private simulateUploadProgress(documentKey: string): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 95) {
        progress = 95; // Stop at 95% until actual upload completes
        clearInterval(interval);
      }
      this.updateUploadProgress(documentKey, Math.min(progress, 95), 'uploading');
    }, 200);
  }

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
      progress,
      status,
      error
    });
    
    this.uploadProgressSubject.next(newProgress);
  }

  // ===============================
  // PUBLIC PROGRESS TRACKING
  // ===============================

  getUploadProgress(documentKey: string): UploadProgress | null {
    return this.uploadProgressSubject.value.get(documentKey) || null;
  }

  clearUploadProgress(documentKey: string): void {
    const currentProgress = this.uploadProgressSubject.value;
    const newProgress = new Map(currentProgress);
    newProgress.delete(documentKey);
    this.uploadProgressSubject.next(newProgress);
  }

  // ===============================
  // METHODS TO MATCH YOUR COMPONENT USAGE
  // ===============================

  // Check if a document exists by key
  hasDocument(documentKey: string): Observable<boolean> {
    const currentUser = this.authService.user();
    if (!currentUser) {
      return throwError(() => new Error('User not authenticated'));
    }

    return from(
      this.supabase
        .from('documents')
        .select('id')
        .eq('document_key', documentKey)
        .eq('user_id', currentUser.id)
        .single()
    ).pipe(
      map(({ data, error }) => !error && !!data),
      catchError(() => from([false]))
    );
  }

  // Get file object for download (matches your component's downloadFile method)
  getFileForDownload(documentKey: string): Observable<Blob> {
    return this.downloadDocumentByKey(documentKey).pipe(
      switchMap(signedUrl => 
        from(fetch(signedUrl).then(response => response.blob()))
      )
    );
  }
}