 

// src/app/profile/steps/documents-upload/documents-upload.component.ts
import { Component, signal, OnInit, OnDestroy, inject, HostListener } from '@angular/core'; 
import { LucideAngularModule, Upload, FileText, CheckCircle, X, Download, Trash2, ChevronDown, ChevronUp, Save, Clock, AlertCircle, RefreshCw, Eye, Plus } from 'lucide-angular';
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { FundingProfileSetupService } from '../../../services/funding-profile-setup.service';
import { SupabaseDocumentService, DocumentMetadata } from '../../../../shared/services/supabase-document.service';
import { UiCardComponent, UiButtonComponent } from '../../../../shared/components';
import { CommonModule } from '@angular/common';

interface DocumentSection {
  id: string;
  title: string;
  description: string;
  expanded: boolean;
  documents: DocumentUpload[];
}

interface DocumentUpload {
  key: string;
  label: string;
  description: string;
  required: boolean;
  file?: File;
  uploaded: boolean;
  uploading?: boolean;
  uploadProgress?: number;
  error?: string;
  size?: number;
  metadata?: DocumentMetadata;
}

 
interface UploadStatus {
  total: number;
  uploaded: number;
  uploading: number;
  failed: number;
}

@Component({
  selector: 'app-documents-upload',
  standalone: true,
  imports: [UiCardComponent, UiButtonComponent, LucideAngularModule, CommonModule],
  templateUrl: './documents-upload.component.html'
})
export class DocumentsUploadComponent implements OnInit, OnDestroy {
  private fundingApplicationService = inject(FundingProfileSetupService);
  private supabaseDocumentService = inject(SupabaseDocumentService);

  // State signals
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);
  
    previewDocument = signal<DocumentUpload | null>(null);
  previewUrls = new Map<string, string>();

 
  // Icons
  UploadIcon = Upload;
  FileTextIcon = FileText;
  CheckCircleIcon = CheckCircle;
  XIcon = X;
  DownloadIcon = Download;
  Trash2Icon = Trash2;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;
  SaveIcon = Save;
  ClockIcon = Clock;
  AlertCircleIcon = AlertCircle;
  RefreshCwIcon = RefreshCw;
  EyeIcon = Eye;
  PlusIcon = Plus;

  // Subscriptions
  private autoSaveSubscription?: Subscription;
  private progressSubscription?: Subscription;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  // Document storage
  private uploadedDocuments = signal<{ [key: string]: File }>({});

  documentSections = signal<DocumentSection[]>([
    {
      id: 'company',
      title: 'Company Documents',
      description: 'Essential business registration and legal documents',
      expanded: true,
      documents: [
        {
          key: 'companyProfile',
          label: 'Company profile',
          description: 'Company Information Profile (CIP) or CIPC certificate',
          required: true,
          uploaded: false
        },
        {
          key: 'companyRegistrationDocument',
          label: 'Company registration',
          description: 'CIPC registration or incorporation documents',
          required: true,
          uploaded: false
        },
        {
          key: 'taxPin',
          label: 'Tax PIN document',
          description: 'Tax PIN document from SARS',
          required: true,
          uploaded: false
        },
        {
          key: 'beeAffidavit',
          label: 'B-BBEE certificate',
          description: 'B-BBEE affidavit or certificate',
          required: false,
          uploaded: false
        },
        {
          key: 'businessPlan',
          label: 'Business plan',
          description: 'Current business plan with financial projections',
          required: false,
          uploaded: false
        },
        {
          key: 'shareholderRegister',
          label: 'Shareholder register',
          description: 'Current shareholder register and ownership structure',
          required: false,
          uploaded: false
        },
        {
          key: 'fundingApplicationRequest',
          label: 'Funding application',
          description: 'Formal funding application request document',
          required: false,
          uploaded: false
        },
        {
          key: 'pitchDeck',
          label: 'Pitch deck',
          description: 'Investment pitch deck presentation',
          required: false,
          uploaded: false
        }
      ]
    },
    {
      id: 'financial',
      title: 'Financial Reports',
      description: 'Financial statements and projections',
      expanded: true,
      documents: [
        {
          key: 'currentYearFinancials',
          label: 'Current year financials',
          description: 'Latest audited or reviewed financial statements',
          required: true,
          uploaded: false
        },
        {
          key: 'priorYearFinancialYear1',
          label: 'Prior year financials (Year 1)',
          description: 'Previous year audited financial statements',
          required: true,
          uploaded: false
        },
        {
          key: 'priorYearFinancialYear2',
          label: 'Prior year financials (Year 2)',
          description: 'Two years ago audited financial statements',
          required: false,
          uploaded: false
        },
        {
          key: 'assetRegister',
          label: 'Asset register',
          description: 'Current asset register with valuations',
          required: false,
          uploaded: false
        },
        {
          key: 'financialProjections',
          label: 'Financial projections',
          description: 'Financial projections and cash flow forecasts',
          required: true,
          uploaded: false
        },
        {
          key: 'salesPipeline',
          label: 'Sales pipeline',
          description: 'Current sales pipeline and customer contracts',
          required: false,
          uploaded: false
        }
      ]
    },
    {
      id: 'additional',
      title: 'Additional Requirements',
      description: 'Supporting documents and agreements',
      expanded: false,
      documents: [
        {
          key: 'letterOfIntent',
          label: 'Letters of intent',
          description: 'Letters of intent from potential customers or partners',
          required: false,
          uploaded: false
        },
        {
          key: 'quotations',
          label: 'Quotations',
          description: 'Quotations for equipment or services to be purchased',
          required: false,
          uploaded: false
        },
        {
          key: 'mouOrSaleAgreements',
          label: 'MOUs or sale agreements',
          description: 'Memorandums of understanding or sale agreements',
          required: false,
          uploaded: false
        },
        {
          key: 'other',
          label: 'Other documents',
          description: 'Any other relevant supporting documents',
          required: false,
          uploaded: false
        }
      ]
    }
  ]);

  ngOnInit() {
    this.loadExistingData();
    this.setupAutoSave();
    this.setupProgressTracking();
  }

  ngOnDestroy() {
    this.autoSaveSubscription?.unsubscribe();
    this.progressSubscription?.unsubscribe();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

      // Clean up preview URLs
  this.previewUrls.forEach(url => URL.revokeObjectURL(url));
  this.previewUrls.clear();
  }

  getDocumentCardClasses(doc: DocumentUpload): string {
  const baseClasses = 'border rounded-lg transition-all duration-200';
  
  if (doc.error) {
    return `${baseClasses} border-red-200 bg-red-50`;
  }
  
  if (doc.uploading) {
    return `${baseClasses} border-blue-200 bg-blue-50`;
  }
  
  if (doc.uploaded) {
    return `${baseClasses} border-green-200 bg-green-50`;
  }
  
  return `${baseClasses} border-neutral-200 bg-white hover:border-primary-300 hover:shadow-sm`;
}

downloadAllDocuments() {
  const uploadedDocs = this.getAllDocuments().filter(doc => doc.uploaded && !doc.error);
  
  if (uploadedDocs.length === 0) {
    alert('No documents available for download');
    return;
  }
  
  uploadedDocs.forEach((doc, index) => {
    // Stagger downloads to avoid browser blocking
    setTimeout(() => {
      this.downloadFile(doc);
    }, index * 500);
  });
}

previewAllDocuments() {
  const previewableDocs = this.getAllDocuments().filter(doc => 
    doc.uploaded && !doc.error && this.isPreviewable(doc)
  );
  
  if (previewableDocs.length === 0) {
    alert('No previewable documents available');
    return;
  }
  
  // Open each in a new tab with small delay
  previewableDocs.forEach((doc, index) => {
    setTimeout(() => {
      this.viewDocument(doc);
    }, index * 200);
  });
}

// ===============================
// DOCUMENT VALIDATION HELPERS
// ===============================

getDocumentValidationStatus(doc: DocumentUpload): 'valid' | 'warning' | 'error' | 'missing' {
  if (doc.error) return 'error';
  if (!doc.uploaded && doc.required) return 'missing';
  if (!doc.uploaded && !doc.required) return 'warning';
  return 'valid';
}

getValidationMessage(doc: DocumentUpload): string {
  const status = this.getDocumentValidationStatus(doc);
  
  switch (status) {
    case 'error':
      return doc.error || 'Upload failed';
    case 'missing':
      return 'Required document missing';
    case 'warning':
      return 'Optional document not uploaded';
    case 'valid':
      return 'Document uploaded successfully';
    default:
      return '';
  }
}

// ===============================
// ENHANCED ANALYTICS & TRACKING
// ===============================

getDocumentAnalytics() {
  const allDocs = this.getAllDocuments();
  const requiredDocs = allDocs.filter(doc => doc.required);
  const uploadedDocs = allDocs.filter(doc => doc.uploaded && !doc.error);
  const failedDocs = allDocs.filter(doc => doc.error);
  const previewableDocs = allDocs.filter(doc => this.isPreviewable(doc));
  
  return {
    total: allDocs.length,
    required: requiredDocs.length,
    uploaded: uploadedDocs.length,
    failed: failedDocs.length,
    previewable: previewableDocs.length,
    completionRate: Math.round((uploadedDocs.length / allDocs.length) * 100),
    requiredCompletionRate: Math.round((requiredDocs.filter(doc => doc.uploaded && !doc.error).length / requiredDocs.length) * 100),
    totalSize: uploadedDocs.reduce((total, doc) => total + (doc.file?.size || 0), 0)
  };
}

// ===============================
// KEYBOARD SHORTCUTS
// ===============================

@HostListener('keydown', ['$event'])
handleKeyboardShortcuts(event: KeyboardEvent) {
  // ESC to close preview
  if (event.key === 'Escape' && this.previewDocument()) {
    this.closePreview();
    event.preventDefault();
  }
  
  // Ctrl/Cmd + D to download all
  if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
    this.downloadAllDocuments();
    event.preventDefault();
  }
}

// ===============================
// DOCUMENT EXPORT FUNCTIONALITY
// ===============================

async exportDocumentList(): Promise<void> {
  const analytics = this.getDocumentAnalytics();
  const allDocs = this.getAllDocuments();
  
  const exportData = {
    exportDate: new Date().toISOString(),
    analytics,
    sections: this.documentSections().map(section => ({
      title: section.title,
      description: section.description,
      progress: this.getSectionProgress(section),
      documents: section.documents.map(doc => ({
        label: doc.label,
        description: doc.description,
        required: doc.required,
        uploaded: doc.uploaded,
        fileName: doc.file?.name,
        fileSize: doc.file?.size,
        uploadedAt: doc.metadata?.uploadedAt,
        status: this.getDocumentValidationStatus(doc),
        validationMessage: this.getValidationMessage(doc)
      }))
    }))
  };
  
  // Create and download JSON file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `document-upload-summary-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
  // ===============================
  // ENHANCED PROGRESS TRACKING
  // ===============================

  getUploadStatus(): UploadStatus {
    const allDocs = this.getAllDocuments();
    return {
      total: allDocs.length,
      uploaded: allDocs.filter(doc => doc.uploaded && !doc.error).length,
      uploading: allDocs.filter(doc => doc.uploading).length,
      failed: allDocs.filter(doc => doc.error).length
    };
  }

  hasActiveUploads(): boolean {
    return this.getAllDocuments().some(doc => doc.uploading);
  }

  hasUploadErrors(): boolean {
    return this.getAllDocuments().some(doc => doc.error);
  }

  getSectionProgress(section: DocumentSection): number {
    const uploaded = section.documents.filter(doc => doc.uploaded && !doc.error).length;
    return section.documents.length > 0 ? Math.round((uploaded / section.documents.length) * 100) : 0;
  }

  getSectionUploadedCount(section: DocumentSection): number {
    return section.documents.filter(doc => doc.uploaded && !doc.error).length;
  }

  getRemainingDocuments(): number {
    return this.totalRequiredDocuments() - this.completedRequiredDocuments();
  }

 getAllDocuments(): DocumentUpload[] {
    return this.documentSections().flatMap(section => section.documents);
  }

  // ===============================
  // ENHANCED FILE PROCESSING
  // ===============================
  hasPreviewableDocuments(): boolean {
  return this.getAllDocuments().some(doc => 
    doc.uploaded && !doc.error && this.isPreviewable(doc)
  );
}

    async processFile(file: File, documentKey: string) {
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      this.setDocumentError(documentKey, validation.error!);
      return;
    }

    // Set uploading state
    this.setDocumentUploading(documentKey, file);

    // Upload to Supabase
    const category = this.getCategoryForDocument(documentKey);
    
    this.supabaseDocumentService.uploadDocument(file, documentKey, undefined, category).subscribe({
      next: (result) => {
        this.setDocumentUploaded(documentKey, file, result);
        this.debouncedSave();
      },
      error: (error) => {
        this.setDocumentError(documentKey, error.message);
      }
    });
  }

  openPreview(doc: DocumentUpload) {
  if (this.isPreviewable(doc) && doc.file) {
    this.previewDocument.set(doc);
    
    // Create preview URL if not exists
    if (!this.previewUrls.has(doc.key)) {
      const url = URL.createObjectURL(doc.file);
      this.previewUrls.set(doc.key, url);
    }
  }
}

closePreview() {
  this.previewDocument.set(null);
}

getPreviewUrl(doc: DocumentUpload): string | null {
  return this.previewUrls.get(doc.key) || null;
}


  private setDocumentUploading(documentKey: string, file: File) {
    this.updateDocument(documentKey, {
      file,
      uploading: true,
      uploadProgress: 0,
      error: undefined,
      uploaded: false
    });
  }

  private setDocumentUploaded(documentKey: string, file: File, result: any) {
    this.updateDocument(documentKey, {
      file,
      uploading: false,
      uploadProgress: 100,
      uploaded: true,
      error: undefined,
      size: file.size,
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

    // Update uploaded documents signal
    this.uploadedDocuments.update(current => ({
      ...current,
      [documentKey]: file
    }));
  }

  private setDocumentError(documentKey: string, error: string) {
    this.updateDocument(documentKey, {
      uploading: false,
      uploadProgress: 0,
      error,
      uploaded: false
    });
  }

  private updateDocument(documentKey: string, updates: Partial<DocumentUpload>) {
    this.documentSections.update(sections =>
      sections.map(section => ({
        ...section,
        documents: section.documents.map(doc =>
          doc.key === documentKey ? { ...doc, ...updates } : doc
        )
      }))
    );
  }

  // ===============================
  // ENHANCED ERROR HANDLING
  // ===============================

  private validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        error: `File size must be less than 10MB. Your file is ${this.formatFileSize(file.size)}.`
      };
    }

    // Check file type
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      return {
        isValid: false,
        error: `File type not supported. Please upload: ${allowedTypes.join(', ')}`
      };
    }

    return { isValid: true };
  }

  retryUpload(documentKey: string) {
    // Clear error and try upload again
    this.updateDocument(documentKey, {
      error: undefined,
      uploading: false,
      uploaded: false
    });
    
    // If we have the file cached, retry the upload
    const doc = this.findDocument(documentKey);
    if (doc?.file) {
      this.processFile(doc.file, documentKey);
    }
  }

  private findDocument(documentKey: string): DocumentUpload | undefined {
    return this.getAllDocuments().find(doc => doc.key === documentKey);
  }

  // ===============================
  // UI STYLING HELPERS
  // ===============================

  getUploadAreaClasses(doc: DocumentUpload): string {
    if (doc.error) {
      return 'border-red-300 bg-red-50 hover:border-red-400';
    }
    return 'border-neutral-300 hover:border-primary-300 hover:bg-primary-50';
  }

  // ===============================
  // UI INTERACTIONS
  // ===============================

  toggleSection(sectionId: string) {
    this.documentSections.update(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, expanded: !section.expanded }
          : section
      )
    );
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.add('border-primary-500', 'bg-primary-50');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('border-primary-500', 'bg-primary-50');
  }

  onDrop(event: DragEvent, documentKey: string) {
    event.preventDefault();
    event.stopPropagation();
    
    const target = event.currentTarget as HTMLElement;
    target.classList.remove('border-primary-500', 'bg-primary-50');
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0], documentKey);
    }
  }

  async onFileSelected(event: Event, documentKey: string) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      await this.processFile(file, documentKey);
      input.value = '';
    }
  }

  removeFile(documentKey: string) {
    this.supabaseDocumentService.deleteDocumentByKey(documentKey).subscribe({
      next: () => {
        this.updateDocument(documentKey, {
          file: undefined,
          uploaded: false,
          uploading: false,
          error: undefined,
          size: undefined,
          metadata: undefined
        });
        
        this.uploadedDocuments.update(current => {
          const updated = { ...current };
          delete updated[documentKey];
          return updated;
        });
        
        this.debouncedSave();
      },
      error: (error) => {
        this.setDocumentError(documentKey, `Failed to delete: ${error.message}`);
      }
    });
  }

  downloadFile(doc: DocumentUpload) {
    if (doc.metadata) {
      this.supabaseDocumentService.downloadDocumentByKey(doc.key).subscribe({
        error: (error) => {
          if (doc.file) {
            this.downloadLocalFile(doc.file);
          } else {
            this.setDocumentError(doc.key, `Download failed: ${error.message}`);
          }
        }
      });
    } else if (doc.file) {
      this.downloadLocalFile(doc.file);
    }
  }

  private downloadLocalFile(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===============================
  // HELPER ACTIONS
  // ===============================

  previewDocumentList() {
    // Could open a modal with document checklist
    console.log('Preview document list functionality');
  }

  requestHelp() {
    window.open('mailto:support@kapify.com?subject=Document Upload Help', '_blank');
  }

  // ===============================
  // DATA MANAGEMENT
  // ===============================

  private loadExistingData() {
    this.supabaseDocumentService.getDocumentsByUser().subscribe({
      next: (documentsMap) => {
        this.updateDocumentSectionsFromSupabase(documentsMap);
      },
      error: (error) => {
        console.error('Failed to load documents:', error);
        this.loadFromLocalService();
      }
    });
  }

  private loadFromLocalService() {
    const existingData = this.fundingApplicationService.data().supportingDocuments;
    if (existingData) {
      this.updateDocumentSectionsFromData(existingData);
    }
  }

  private updateDocumentSectionsFromSupabase(documentsMap: Map<string, DocumentMetadata>) {
    const uploadedDocs: { [key: string]: File } = {};
    
    this.documentSections.update(sections => 
      sections.map(section => ({
        ...section,
        documents: section.documents.map(doc => {
          const metadata = documentsMap.get(doc.key);
          if (metadata) {
            // Create a virtual File object from metadata for UI compatibility
            const virtualFile = new File([''], metadata.originalName, {
              type: metadata.mimeType
            });
            Object.defineProperty(virtualFile, 'size', { value: metadata.fileSize });
            uploadedDocs[doc.key] = virtualFile;

            return {
              ...doc,
              file: virtualFile,
              uploaded: true,
              uploading: false,
              error: undefined,
              size: metadata.fileSize,
              metadata
            };
          }
          return doc;
        })
      }))
    );
    
    this.uploadedDocuments.set(uploadedDocs);
  }

  private updateDocumentSectionsFromData(data: any) {
    const uploadedDocs: { [key: string]: File } = {};
    
    this.documentSections.update(sections => 
      sections.map(section => ({
        ...section,
        documents: section.documents.map(doc => {
          const file = data[doc.key];
          if (file) {
            uploadedDocs[doc.key] = file;
          }
          return {
            ...doc,
            file: file as File,
            uploaded: !!file,
            uploading: false,
            error: undefined,
            size: file?.size
          };
        })
      }))
    );
    
    this.uploadedDocuments.set(uploadedDocs);
  }

  private setupAutoSave() {
    this.autoSaveSubscription = interval(30000).pipe(
      takeWhile(() => true)
    ).subscribe(() => {
      if (this.hasDocumentData() && !this.isSaving()) {
        this.saveData(false);
      }
    });
  }

  private setupProgressTracking() {
    this.progressSubscription = this.supabaseDocumentService.uploadProgress$.subscribe(
      progressMap => {
        const activeUploads = Array.from(progressMap.values()).filter(p => p.status === 'uploading');
        
        // Update individual document progress
        activeUploads.forEach(progress => {
          this.updateDocument(progress.documentKey, {
            uploadProgress: progress.progress,
            uploading: progress.status === 'uploading'
          });
        });
        
        // Handle completed uploads
        Array.from(progressMap.values())
          .filter(p => p.status === 'complete')
          .forEach(progress => {
            this.updateDocument(progress.documentKey, {
              uploading: false,
              uploadProgress: 100
            });
            this.supabaseDocumentService.clearUploadProgress(progress.documentKey);
          });

        // Handle failed uploads
        Array.from(progressMap.values())
          .filter(p => p.status === 'error')
          .forEach(progress => {
            this.setDocumentError(progress.documentKey, progress.error || 'Upload failed');
            this.supabaseDocumentService.clearUploadProgress(progress.documentKey);
          });
      }
    );
  }

  private debouncedSave() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      if (this.hasDocumentData() && !this.isSaving()) {
        this.saveData(false);
      }
    }, 2000) as ReturnType<typeof setTimeout>;
  }

  private async saveData(isManual: boolean = false) {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    
    try {
      const documentsData = this.buildSupportingDocumentsData();
      this.fundingApplicationService.updateSupportingDocuments(documentsData);
      
      if (isManual) {
        await this.fundingApplicationService.saveCurrentProgress();
      }
      
      this.lastSaved.set(new Date());
    } catch (error) {
      console.error('Failed to save documents:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private buildSupportingDocumentsData(): any {
    const documentsData: any = {};
    const uploaded = this.uploadedDocuments();
    
    Object.keys(uploaded).forEach(key => {
      documentsData[key] = uploaded[key];
    });
    
    return documentsData;
  }

  private hasDocumentData(): boolean {
    const uploaded = this.uploadedDocuments();
    return Object.keys(uploaded).length > 0;
  }

  private getCategoryForDocument(documentKey: string): string {
    if (documentKey.includes('financial') || 
        documentKey.includes('Financial') || 
        documentKey.includes('asset') || 
        documentKey.includes('sales')) {
      return 'financial';
    }
    if (documentKey.includes('letter') || 
        documentKey.includes('quotations') || 
        documentKey.includes('mou') || 
        documentKey.includes('other')) {
      return 'additional';
    }
    return 'company';
  }

  // ===============================
  // COMPUTED VALUES
  // ===============================

  totalDocuments = () => {
    return this.documentSections().reduce((total, section) => 
      total + section.documents.length, 0
    );
  };

  completedDocuments = () => {
    return this.documentSections().reduce((total, section) => 
      total + section.documents.filter(doc => doc.uploaded && !doc.error).length, 0
    );
  };

  totalRequiredDocuments = () => {
    return this.documentSections().reduce((total, section) => 
      total + section.documents.filter(doc => doc.required).length, 0
    );
  };

  completedRequiredDocuments = () => {
    return this.documentSections().reduce((total, section) => 
      total + section.documents.filter(doc => doc.required && doc.uploaded && !doc.error).length, 0
    );
  };

  allRequiredDocumentsUploaded = () => {
    return this.completedRequiredDocuments() === this.totalRequiredDocuments();
  };

  getCompletionPercentage = () => {
    const total = this.totalRequiredDocuments();
    const completed = this.completedRequiredDocuments();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // ===============================
  // UTILITY METHODS
  // ===============================

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

 

// Add these methods to your DocumentsUploadComponent:

// ===============================
// DOCUMENT PREVIEW/VIEW FUNCTIONALITY
// ===============================

viewDocument(doc: DocumentUpload) {
  if (doc.metadata?.publicUrl) {
    // For uploaded documents, open the public URL
    window.open(doc.metadata.publicUrl, '_blank');
  } else if (doc.file) {
    // For local files, create blob URL and preview
    this.previewLocalFile(doc.file);
  }
}

private previewLocalFile(file: File) {
  const fileType = file.type.toLowerCase();
  
  if (fileType.includes('pdf')) {
    // PDF preview
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
    // Clean up URL after a delay to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } else if (fileType.includes('image')) {
    // Image preview
    this.openImagePreviewModal(file);
  } else {
    // For other document types, trigger download
    this.downloadLocalFile(file);
  }
}

private openImagePreviewModal(file: File) {
  const url = URL.createObjectURL(file);
  
  // Create modal overlay
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
  
  // Create image container
  const container = document.createElement('div');
  container.className = 'relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden';
  
  // Create image
  const img = document.createElement('img');
  img.src = url;
  img.className = 'max-w-full max-h-[80vh] object-contain';
  img.alt = file.name;
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.className = 'absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center text-xl hover:bg-opacity-75';
  
  // Add elements
  container.appendChild(img);
  container.appendChild(closeBtn);
  modal.appendChild(container);
  document.body.appendChild(modal);
  
  // Close handlers
  const closeModal = () => {
    document.body.removeChild(modal);
    URL.revokeObjectURL(url);
  };
  
  closeBtn.onclick = closeModal;
  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
  
  // ESC key handler
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// ===============================
// DOCUMENT NAME FORMATTING
// ===============================

getDisplayFileName(doc: DocumentUpload): string {
  const fileName = doc.file?.name || doc.metadata?.originalName || doc.label;
  return this.truncateFileName(fileName, 40);
}

private truncateFileName(fileName: string, maxLength: number): string {
  if (fileName.length <= maxLength) return fileName;
  
  const extension = fileName.split('.').pop();
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  const maxNameLength = maxLength - (extension ? extension.length + 4 : 3); // Account for ... and .ext
  
  if (nameWithoutExt.length > maxNameLength) {
    return `${nameWithoutExt.substring(0, maxNameLength)}...${extension ? '.' + extension : ''}`;
  }
  
  return fileName;
}

getFileTypeIcon(doc: DocumentUpload): string {
  const fileName = doc.file?.name || doc.metadata?.originalName || '';
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return '📄';
    case 'doc':
    case 'docx':
      return '📝';
    case 'xls':
    case 'xlsx':
      return '📊';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return '🖼️';
    default:
      return '📎';
  }
}

isPreviewable(doc: DocumentUpload): boolean {
  const fileName = doc.file?.name || doc.metadata?.originalName || '';
  const extension = fileName.split('.').pop()?.toLowerCase();
  return ['pdf', 'jpg', 'jpeg', 'png'].includes(extension || '');
}

// ===============================
// DOCUMENT ACTIONS
// ===============================

getDocumentActions(doc: DocumentUpload): Array<{label: string, action: () => void, icon: string, variant?: string}> {
  const actions = [];
  
  if (doc.uploaded && !doc.uploading) {
    // View action for previewable files
    if (this.isPreviewable(doc)) {
      actions.push({
        label: 'View',
        action: () => this.viewDocument(doc),
        icon: 'Eye',
        variant: 'outline'
      });
    }
    
    // Download action
    actions.push({
      label: 'Download',
      action: () => this.downloadFile(doc),
      icon: 'Download',
      variant: 'outline'
    });
    
    // Delete action
    actions.push({
      label: 'Remove',
      action: () => this.removeFile(doc.key),
      icon: 'Trash2',
      variant: 'outline'
    });
  }
  
  if (doc.error) {
    actions.push({
      label: 'Retry',
      action: () => this.retryUpload(doc.key),
      icon: 'RefreshCw',
      variant: 'primary'
    });
  }
  
  return actions;
}
}