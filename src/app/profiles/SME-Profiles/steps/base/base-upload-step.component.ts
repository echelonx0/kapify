// src/app/SMEs/profile/steps/base/base-upload-step.component.ts
import { signal, computed, inject, Directive, HostListener } from '@angular/core';
import { BaseFormStepComponent } from './base-form-step.component'; 
import { Subscription, firstValueFrom } from 'rxjs';
import { DocumentMetadata, SupabaseDocumentService } from 'src/app/shared/services/supabase-document.service';

export interface UploadDocument {
  key: string;
  label: string;
  description: string;
  required: boolean;
  file?: File;
  uploaded: boolean;
  uploading: boolean;
  uploadProgress?: number;
  error?: string;
  metadata?: DocumentMetadata;
}

export interface UploadSection {
  id: string;
  title: string;
  description: string;
  expanded: boolean;
  documents: UploadDocument[];
}

export interface UploadValidation {
  isValid: boolean;
  totalDocuments: number;
  uploadedDocuments: number;
  requiredDocuments: number;
  uploadedRequiredDocuments: number;
  errors: string[];
}

@Directive()
export abstract class BaseUploadStepComponent extends BaseFormStepComponent {
  protected documentService = inject(SupabaseDocumentService);

  // Upload state
  protected uploadSections = signal<UploadSection[]>([]);
  protected previewDocument = signal<UploadDocument | null>(null);
  protected globalUploading = signal(false);
  
  // Progress tracking
  private progressSubscription?: Subscription;
  private previewUrls = new Map<string, string>();

  // Computed values
  totalDocuments = computed(() => 
    this.uploadSections().reduce((total, section) => total + section.documents.length, 0)
  );

  uploadedDocuments = computed(() =>
    this.uploadSections().reduce((total, section) => 
      total + section.documents.filter(doc => doc.uploaded && !doc.error).length, 0)
  );

  requiredDocuments = computed(() =>
    this.uploadSections().reduce((total, section) => 
      total + section.documents.filter(doc => doc.required).length, 0)
  );

  uploadedRequiredDocuments = computed(() =>
    this.uploadSections().reduce((total, section) => 
      total + section.documents.filter(doc => doc.required && doc.uploaded && !doc.error).length, 0)
  );

  uploadProgress = computed(() => {
    const total = this.totalDocuments();
    const uploaded = this.uploadedDocuments();
    return total > 0 ? Math.round((uploaded / total) * 100) : 0;
  });

  requiredProgress = computed(() => {
    const required = this.requiredDocuments();
    const uploadedRequired = this.uploadedRequiredDocuments();
    return required > 0 ? Math.round((uploadedRequired / required) * 100) : 100;
  });

  activeUploads = computed(() =>
    this.uploadSections().flatMap(section => 
      section.documents.filter(doc => doc.uploading)
    ).length
  );

  failedUploads = computed(() =>
    this.uploadSections().flatMap(section => 
      section.documents.filter(doc => doc.error)
    )
  );

  // ===============================
  // ABSTRACT METHODS
  // ===============================

  /**
   * Initialize upload sections and documents
   */
  abstract initializeUploadSections(): UploadSection[];

  /**
   * Get category for document (for storage organization)
   */
  abstract getDocumentCategory(documentKey: string): string;

  // ===============================
  // INITIALIZATION
  // ===============================

  protected override customInit(): void {
    this.setupUploadSections();
    this.setupProgressTracking();
  }

  private setupUploadSections(): void {
    const sections = this.initializeUploadSections();
    this.uploadSections.set(sections);
  }

  private setupProgressTracking(): void {
    this.progressSubscription = this.documentService.uploadProgress$.subscribe(
      progressMap => {
        const activeUploads = Array.from(progressMap.values()).filter(p => p.status === 'uploading');
        
        // Update individual document progress
        activeUploads.forEach(progress => {
          this.updateDocumentProgress(progress.documentKey, {
            uploadProgress: progress.progress,
            uploading: progress.status === 'uploading'
          });
        });
        
        // Handle completed uploads
        Array.from(progressMap.values())
          .filter(p => p.status === 'complete')
          .forEach(progress => {
            this.updateDocumentProgress(progress.documentKey, {
              uploading: false,
              uploadProgress: 100,
              uploaded: true,
              error: undefined
            });
            this.documentService.clearUploadProgress(progress.documentKey);
          });

        // Handle failed uploads
        Array.from(progressMap.values())
          .filter(p => p.status === 'error')
          .forEach(progress => {
            this.updateDocumentProgress(progress.documentKey, {
              uploading: false,
              error: progress.error || 'Upload failed'
            });
            this.documentService.clearUploadProgress(progress.documentKey);
          });
      }
    );
  }

  // ===============================
  // FILE UPLOAD OPERATIONS
  // ===============================

  /**
   * Handle file selection via input
   */
  async onFileSelected(event: Event, documentKey: string): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      await this.processFile(file, documentKey);
      input.value = '';
    }
  }

  /**
   * Handle drag and drop file upload
   */
  async onFileDrop(event: DragEvent, documentKey: string): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('border-primary-500', 'bg-primary-50');
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      await this.processFile(files[0], documentKey);
    }
  }

  /**
   * Process and upload file
   */
  async processFile(file: File, documentKey: string): Promise<void> {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      this.setDocumentError(documentKey, validation.error!);
      return;
    }

    // Set uploading state
    this.setDocumentUploading(documentKey, file);

    try {
      // Upload to storage
      const category = this.getDocumentCategory(documentKey);
      
      this.documentService.uploadDocument(file, documentKey, undefined, category).subscribe({
        next: (result) => {
          this.setDocumentUploaded(documentKey, file, result);
          this.triggerAutoSave();
        },
        error: (error) => {
          this.setDocumentError(documentKey, error.message);
        }
      });
    } catch (error) {
      this.setDocumentError(documentKey, 'Failed to start upload');
    }
  }

  /**
   * Remove uploaded document
   */
  async removeDocument(documentKey: string): Promise<void> {
    if (!confirm('Are you sure you want to remove this document?')) return;

    try {
      await firstValueFrom(this.documentService.deleteDocumentByKey(documentKey));
      
      this.updateDocument(documentKey, {
        file: undefined,
        uploaded: false,
        uploading: false,
        error: undefined,
        metadata: undefined,
        uploadProgress: 0
      });
      
      this.triggerAutoSave();
    } catch (error) {
      this.setDocumentError(documentKey, 'Failed to delete document');
    }
  }

  /**
   * Retry failed upload
   */
  async retryUpload(documentKey: string): Promise<void> {
    const document = this.findDocument(documentKey);
    if (!document?.file) return;

    // Clear error and retry
    this.updateDocument(documentKey, {
      error: undefined,
      uploading: false,
      uploaded: false
    });
    
    await this.processFile(document.file, documentKey);
  }

  // ===============================
  // DOCUMENT STATE MANAGEMENT
  // ===============================

  private setDocumentUploading(documentKey: string, file: File): void {
    this.updateDocument(documentKey, {
      file,
      uploading: true,
      uploadProgress: 0,
      error: undefined,
      uploaded: false
    });
  }

  private setDocumentUploaded(documentKey: string, file: File, result: any): void {
    this.updateDocument(documentKey, {
      file,
      uploading: false,
      uploadProgress: 100,
      uploaded: true,
      error: undefined,
      metadata: {
        id: result.id,
        userId: '',
        documentKey: result.documentKey,
        originalName: result.originalName,
        fileName: result.fileName,
        filePath: result.filePath,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
        publicUrl: result.publicUrl,
        category: result.category,
        status: 'uploaded',
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  }

  private setDocumentError(documentKey: string, error: string): void {
    this.updateDocument(documentKey, {
      uploading: false,
      uploadProgress: 0,
      error,
      uploaded: false
    });
  }

  private updateDocumentProgress(documentKey: string, updates: Partial<UploadDocument>): void {
    this.updateDocument(documentKey, updates);
  }

  private updateDocument(documentKey: string, updates: Partial<UploadDocument>): void {
    this.uploadSections.update(sections =>
      sections.map(section => ({
        ...section,
        documents: section.documents.map(doc =>
          doc.key === documentKey ? { ...doc, ...updates } : doc
        )
      }))
    );
  }

  private findDocument(documentKey: string): UploadDocument | undefined {
    return this.uploadSections()
      .flatMap(section => section.documents)
      .find(doc => doc.key === documentKey);
  }

  // ===============================
  // FILE VALIDATION
  // ===============================

  private validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size (10MB limit by default)
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        error: `File size must be less than 10MB. Your file is ${this.formatFileSize(file.size)}.`
      };
    }

    // Check file type
    const allowedTypes = this.getAllowedFileTypes();
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File type not supported. Please upload: ${allowedTypes.join(', ')}`
      };
    }

    return { isValid: true };
  }

  protected getAllowedFileTypes(): string[] {
    return ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
  }

  // ===============================
  // DRAG AND DROP HANDLERS
  // ===============================

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('border-primary-500', 'bg-primary-50');
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('border-primary-500', 'bg-primary-50');
  }

  // ===============================
  // SECTION MANAGEMENT
  // ===============================

  toggleSection(sectionId: string): void {
    this.uploadSections.update(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, expanded: !section.expanded }
          : section
      )
    );
  }

  isSectionExpanded(sectionId: string): boolean {
    return this.uploadSections().find(s => s.id === sectionId)?.expanded ?? false;
  }

  getSectionProgress(sectionId: string): number {
    const section = this.uploadSections().find(s => s.id === sectionId);
    if (!section) return 0;
    
    const uploaded = section.documents.filter(doc => doc.uploaded && !doc.error).length;
    return section.documents.length > 0 ? Math.round((uploaded / section.documents.length) * 100) : 0;
  }

  // ===============================
  // PREVIEW AND DOWNLOAD
  // ===============================

  viewDocument(document: UploadDocument): void {
    if (document.metadata?.publicUrl) {
      window.open(document.metadata.publicUrl, '_blank');
    } else if (document.file && this.isPreviewable(document)) {
      this.previewDocument.set(document);
      
      // Create preview URL if not exists
      if (!this.previewUrls.has(document.key)) {
        const url = URL.createObjectURL(document.file);
        this.previewUrls.set(document.key, url);
      }
    } else if (document.file) {
      this.downloadLocalFile(document.file);
    }
  }

  closePreview(): void {
    this.previewDocument.set(null);
  }

  getPreviewUrl(document: UploadDocument): string | null {
    return this.previewUrls.get(document.key) || null;
  }

  downloadDocument(document: UploadDocument): void {
    if (document.metadata) {
      this.documentService.downloadDocumentByKey(document.key).subscribe({
        error: (error) => {
          if (document.file) {
            this.downloadLocalFile(document.file);
          } else {
            console.error('Download failed:', error);
          }
        }
      });
    } else if (document.file) {
      this.downloadLocalFile(document.file);
    }
  }

  private downloadLocalFile(file: File): void {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  isPreviewable(document: UploadDocument): boolean {
    const fileName = document.file?.name || document.metadata?.originalName || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['pdf', 'jpg', 'jpeg', 'png'].includes(extension || '');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileTypeIcon(document: UploadDocument): string {
    const fileName = document.file?.name || document.metadata?.originalName || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'xls':
      case 'xlsx': return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      default: return '📎';
    }
  }

  // ===============================
  // KEYBOARD SHORTCUTS
  // ===============================

  @HostListener('keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    // ESC to close preview
    if (event.key === 'Escape' && this.previewDocument()) {
      this.closePreview();
      event.preventDefault();
    }
  }

  // ===============================
  // VALIDATION AND COMPLETION
  // ===============================

  validateUploads(): UploadValidation {
    const total = this.totalDocuments();
    const uploaded = this.uploadedDocuments();
    const required = this.requiredDocuments();
    const uploadedRequired = this.uploadedRequiredDocuments();
    
    const errors: string[] = [];
    
    if (uploadedRequired < required) {
      errors.push(`${required - uploadedRequired} required document${required - uploadedRequired > 1 ? 's' : ''} missing`);
    }
    
    const failedDocs = this.failedUploads();
    if (failedDocs.length > 0) {
      errors.push(`${failedDocs.length} document${failedDocs.length > 1 ? 's' : ''} failed to upload`);
    }

    return {
      isValid: errors.length === 0 && uploadedRequired === required,
      totalDocuments: total,
      uploadedDocuments: uploaded,
      requiredDocuments: required,
      uploadedRequiredDocuments: uploadedRequired,
      errors
    };
  }

  allRequiredDocumentsUploaded(): boolean {
    return this.uploadedRequiredDocuments() === this.requiredDocuments();
  }

  // ===============================
  // OVERRIDE BASE METHODS
  // ===============================

  hasFormData(): boolean {
    return this.uploadedDocuments() > 0;
  }

  protected override customValidation() {
    const baseValidation = super.customValidation();
    const uploadValidation = this.validateUploads();
    
    return {
      isValid: baseValidation.isValid && uploadValidation.isValid,
      errors: [...baseValidation.errors, ...uploadValidation.errors],
      warnings: baseValidation.warnings,
      missingFields: baseValidation.missingFields
    };
  }

  override getCompletionPercentage(): number {
    return this.requiredProgress();
  }

  // ===============================
  // DATA LOADING AND SAVING
  // ===============================

  loadExistingData(): void {
    this.documentService.getDocumentsByUser().subscribe({
      next: (documentsMap) => {
        this.updateSectionsFromSupabase(documentsMap);
      },
      error: (error) => {
        console.error('Failed to load documents:', error);
        this.loadFromLocalService();
      }
    });
  }

  private updateSectionsFromSupabase(documentsMap: Map<string, DocumentMetadata>): void {
    this.uploadSections.update(sections => 
      sections.map(section => ({
        ...section,
        documents: section.documents.map(doc => {
          const metadata = documentsMap.get(doc.key);
          if (metadata) {
            // Create virtual File object for UI compatibility
            const virtualFile = new File([''], metadata.originalName, {
              type: metadata.mimeType
            });
            Object.defineProperty(virtualFile, 'size', { value: metadata.fileSize });

            return {
              ...doc,
              file: virtualFile,
              uploaded: true,
              uploading: false,
              error: undefined,
              metadata
            };
          }
          return doc;
        })
      }))
    );
  }

  private loadFromLocalService(): void {
    const existingData = this.profileService.data().supportingDocuments || {};
    this.updateSectionsFromLocalData(existingData);
  }

  private updateSectionsFromLocalData(data: any): void {
    this.uploadSections.update(sections => 
      sections.map(section => ({
        ...section,
        documents: section.documents.map(doc => ({
          ...doc,
          file: data[doc.key] as File,
          uploaded: !!data[doc.key],
          uploading: false,
          error: undefined
        }))
      }))
    );
  }

  buildSaveData(): any {
    const uploadedFiles: any = {};
    
    this.uploadSections().forEach(section => {
      section.documents.forEach(doc => {
        if (doc.uploaded && doc.file) {
          uploadedFiles[doc.key] = doc.file;
        }
      });
    });
    
    return uploadedFiles;
  }

  // ===============================
  // CLEANUP
  // ===============================

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    
    this.progressSubscription?.unsubscribe();
    
    // Clean up preview URLs
    this.previewUrls.forEach(url => URL.revokeObjectURL(url));
    this.previewUrls.clear();
  }

  private triggerAutoSave(): void {
    this.hasUnsavedChanges.set(true);
    if (this.autoSaveConfig.saveOnFormChange) {
      this.saveData(false);
    }
  }
}