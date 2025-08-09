// src/app/applications/sections/application-document-upload.component.ts
import { Component, signal, input, OnInit } from '@angular/core';
import { UiCardComponent, UiButtonComponent } from '../../shared/components';
import { LucideAngularModule, Upload, FileText, CheckCircle, X, Download, Trash2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-angular';
import { ApplicationDocumentService } from '../services/application-document.service';
 
interface DocumentSection {
  id: string;
  title: string;
  description: string;
  expanded: boolean;
  documents: ApplicationDocument[];
}

interface ApplicationDocument {
  id: string;
  key: string;
  label: string;
  description: string;
  required: boolean;
  file?: File;
  uploaded: boolean;
  uploadedAt?: Date;
  size?: number;
  url?: string;
  version?: number;
  status: 'missing' | 'uploaded' | 'approved' | 'rejected';
  rejectionReason?: string;
}

@Component({
  selector: 'app-application-document-upload',
  standalone: true,
  imports: [UiCardComponent, UiButtonComponent, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="text-center">
        <h2 class="text-2xl font-bold text-neutral-900">Application Documents</h2>
        <p class="text-neutral-600 mt-2 max-w-3xl mx-auto">
          Please provide the necessary documents to support your application. 
          Accurate and complete documentation helps expedite the review process.
          @if (userRole() === 'sme' && isEditMode()) {
            <span class="text-primary-600 font-medium">You can update documents as requested by your funder.</span>
          }
        </p>
      </div>

      <!-- Upload Progress -->
      @if (getTotalDocuments() > 0) {
        <div class="bg-white border border-neutral-200 rounded-lg p-4">
          <div class="flex items-center justify-between text-sm mb-2">
            <span class="text-neutral-700">Document Upload Progress</span>
            <span class="text-neutral-500">{{ getUploadedCount() }} of {{ getTotalDocuments() }} uploaded</span>
          </div>
          <div class="w-full bg-neutral-200 rounded-full h-2">
            <div 
              class="h-2 rounded-full bg-primary-500 transition-all duration-300"
              [style.width.%]="getUploadProgress()">
            </div>
          </div>
        </div>
      }

      <!-- Document Sections -->
      @for (section of documentSections(); track section.id) {
        <ui-card [padding]="false">
          <!-- Section Header -->
          <button
            (click)="toggleSection(section.id)"
            class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
          >
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-neutral-900">{{ section.title }}</h3>
              <p class="text-sm text-neutral-600 mt-1">{{ section.description }}</p>
              
              <!-- Section Status -->
              <div class="flex items-center space-x-4 mt-2">
                @if (getSectionProgress(section) === 100) {
                  <span class="inline-flex items-center text-xs font-medium text-green-600">
                    <lucide-icon [img]="CheckCircleIcon" [size]="14" class="mr-1" />
                    Complete
                  </span>
                } @else {
                  <span class="inline-flex items-center text-xs font-medium text-neutral-500">
                    {{ getSectionUploadedCount(section) }}/{{ section.documents.length }} uploaded
                  </span>
                }
              </div>
            </div>
            
            <lucide-icon 
              [img]="section.expanded ? ChevronUpIcon : ChevronDownIcon" 
              [size]="20" 
              class="text-neutral-400 transition-transform"
            />
          </button>

          <!-- Section Content -->
          @if (section.expanded) {
            <div class="border-t border-neutral-200">
              <div class="divide-y divide-neutral-100">
                @for (document of section.documents; track document.id) {
                  <div class="p-6 space-y-4">
                    <!-- Document Header -->
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <div class="flex items-center space-x-2">
                          <h4 class="font-medium text-neutral-900">{{ document.label }}</h4>
                          @if (document.required) {
                            <span class="text-red-500 text-sm">*</span>
                          }
                          @if (document.status === 'approved') {
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <lucide-icon [img]="CheckCircleIcon" [size]="12" class="mr-1" />
                              Approved
                            </span>
                          } @else if (document.status === 'rejected') {
                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <lucide-icon [img]="AlertCircleIcon" [size]="12" class="mr-1" />
                              Requires Attention
                            </span>
                          }
                        </div>
                        
                        <p class="text-sm text-neutral-600 mt-1">{{ document.description }}</p>
                        
                        <!-- Rejection Reason -->
                        @if (document.status === 'rejected' && document.rejectionReason) {
                          <div class="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
                            <div class="flex">
                              <lucide-icon [img]="AlertCircleIcon" [size]="16" class="text-red-400 mr-2 mt-0.5" />
                              <div class="text-sm">
                                <p class="font-medium text-red-800">Reviewer Feedback:</p>
                                <p class="text-red-700 mt-1">{{ document.rejectionReason }}</p>
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    </div>

                    <!-- Document Actions -->
                    <div class="flex items-center justify-between">
                      <!-- File Info -->
                      @if (document.uploaded && document.file) {
                        <div class="flex items-center text-sm text-neutral-600">
                          <lucide-icon [img]="FileTextIcon" [size]="16" class="mr-2" />
                          <span>{{ document.file.name }}</span>
                          <span class="mx-2">•</span>
                          <span>{{ formatFileSize(document.size || 0) }}</span>
                          @if (document.version && document.version > 1) {
                            <span class="mx-2">•</span>
                            <span class="text-primary-600 font-medium">v{{ document.version }}</span>
                          }
                        </div>
                      } @else {
                        <div class="text-sm text-neutral-500">No file uploaded</div>
                      }

                      <!-- Action Buttons -->
                      <div class="flex items-center space-x-2">
                        @if (document.uploaded) {
                          <!-- Download Button -->
                          <ui-button
                            variant="ghost"
                            size="sm"
                            (clicked)="downloadDocument(document)"
                          >
                            <lucide-icon [img]="DownloadIcon" [size]="14" class="mr-1" />
                            Download
                          </ui-button>

                          <!-- Replace/Update Button - Only for SME in edit mode -->
                          @if (userRole() === 'sme' && isEditMode()) {
                            <ui-button
                              variant="outline"
                              size="sm"
                              (clicked)="replaceDocument(document)"
                              [disabled]="isUploading()"
                            >
                              <lucide-icon [img]="UploadIcon" [size]="14" class="mr-1" />
                              @if (document.status === 'rejected') {
                                Reupload
                              } @else {
                                Update
                              }
                            </ui-button>
                          }

                          <!-- Remove Button - Only for SME in edit mode -->
                          @if (userRole() === 'sme' && isEditMode()) {
                            <ui-button
                              variant="ghost"
                              size="sm"
                              (clicked)="removeDocument(document)"
                              [disabled]="isUploading()"
                            >
                              <lucide-icon [img]="Trash2Icon" [size]="14" class="text-red-500" />
                            </ui-button>
                          }
                        } @else {
                          <!-- Upload Button - Only for SME in edit mode -->
                          @if (userRole() === 'sme' && isEditMode()) {
                            <ui-button
                              variant="primary"
                              size="sm"
                              (clicked)="uploadDocument(document)"
                              [disabled]="isUploading()"
                            >
                              @if (isUploading()) {
                                <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Uploading...
                              } @else {
                                <lucide-icon [img]="UploadIcon" [size]="14" class="mr-1" />
                                Upload
                              }
                            </ui-button>
                          } @else {
                            <span class="text-sm text-neutral-500 italic">
                              @if (document.required) {
                                Required document not uploaded
                              } @else {
                                Optional document
                              }
                            </span>
                          }
                        }
                      </div>
                    </div>

                    <!-- Upload Progress -->
                    @if (uploadingDocuments().has(document.id)) {
                      <div class="w-full bg-neutral-200 rounded-full h-2">
                        <div 
                          class="h-2 rounded-full bg-primary-500 transition-all duration-300"
                          [style.width.%]="getDocumentUploadProgress(document.id)">
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </ui-card>
      }

      <!-- Hidden File Input -->
      <input
        #fileInput
        type="file"
        class="hidden"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        (change)="onFileSelected($event)"
      />

      <!-- Action Buttons -->
      @if (userRole() === 'sme' && isEditMode()) {
        <div class="flex items-center justify-between bg-white border border-neutral-200 rounded-lg p-6">
          <div>
            <h3 class="text-sm font-medium text-neutral-900">Document Updates</h3>
            <p class="text-sm text-neutral-600 mt-1">
              Upload new documents or update existing ones as requested by your funder.
            </p>
          </div>
          
          <div class="flex items-center space-x-3">
            <ui-button
              variant="outline"
              (clicked)="saveDraft()"
              [disabled]="isSaving()"
            >
              Save Draft
            </ui-button>
            
            <ui-button
              variant="primary"
              (clicked)="submitUpdates()"
              [disabled]="isSaving() || !hasChanges()"
            >
              @if (isSaving()) {
                Submitting...
              } @else {
                Submit Updates
              }
            </ui-button>
          </div>
        </div>
      }
    </div>
  `
})
export class ApplicationDocumentUploadComponent implements OnInit {
  applicationId = input.required<string>();
  userRole = input<'sme' | 'funder'>('sme');
  isEditMode = input(false);

  // Signals
  documentSections = signal<DocumentSection[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);
  uploadingDocuments = signal(new Set<string>());
  selectedDocument = signal<ApplicationDocument | null>(null);

  // Icons
  UploadIcon = Upload;
  FileTextIcon = FileText;
  CheckCircleIcon = CheckCircle;
  XIcon = X;
  DownloadIcon = Download;
  Trash2Icon = Trash2;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;
  AlertCircleIcon = AlertCircle;

  constructor(
    private documentService: ApplicationDocumentService
  ) {}

  ngOnInit() {
    this.loadDocuments();
  }

  toggleSection(sectionId: string) {
    this.documentSections.update(sections =>
      sections.map(section =>
        section.id === sectionId
          ? { ...section, expanded: !section.expanded }
          : section
      )
    );
  }
uploadDocument(doc: ApplicationDocument) {
  // Trigger file input
  this.selectedDocument.set(doc);
  const fileInput = document.querySelector('#fileInput') as HTMLInputElement;
  if (fileInput) {
    fileInput.click();
  }
}
  replaceDocument(document: ApplicationDocument) {
    this.uploadDocument(document);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    const document = this.selectedDocument();
    
    if (files && files.length > 0 && document) {
      const file = files[0];
      this.processFileUpload(document, file);
    }
    
    // Reset file input
    input.value = '';
  }

  processFileUpload(document: ApplicationDocument, file: File) {
    this.uploadingDocuments.update(set => new Set(set).add(document.id));

    this.documentService.uploadDocument(this.applicationId(), document.id, file).subscribe({
      next: (response) => {
        // Update document status
        this.updateDocumentInSections(document.id, {
          ...document,
          uploaded: true,
          file: file,
          size: file.size,
          uploadedAt: new Date(),
          status: 'uploaded',
          version: (document.version || 0) + 1
        });

        this.uploadingDocuments.update(set => {
          const newSet = new Set(set);
          newSet.delete(document.id);
          return newSet;
        });
      },
      error: (error) => {
        console.error('Upload failed:', error);
        this.uploadingDocuments.update(set => {
          const newSet = new Set(set);
          newSet.delete(document.id);
          return newSet;
        });
        // Show error message
      }
    });
  }

  downloadDocument(document: ApplicationDocument) {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  }

  removeDocument(document: ApplicationDocument) {
    if (confirm('Are you sure you want to remove this document?')) {
      this.documentService.removeDocument(this.applicationId(), document.id).subscribe({
        next: () => {
          this.updateDocumentInSections(document.id, {
            ...document,
            uploaded: false,
            file: undefined,
            size: undefined,
            uploadedAt: undefined,
            status: 'missing',
            url: undefined
          });
        },
        error: (error) => {
          console.error('Failed to remove document:', error);
        }
      });
    }
  }

  saveDraft() {
    this.isSaving.set(true);
    // Save current state as draft
    setTimeout(() => {
      this.isSaving.set(false);
    }, 1000);
  }

  submitUpdates() {
    this.isSaving.set(true);
    // Submit document updates
    setTimeout(() => {
      this.isSaving.set(false);
    }, 1000);
  }

  // Helper methods
  getTotalDocuments(): number {
    return this.documentSections().reduce((total, section) => total + section.documents.length, 0);
  }

  getUploadedCount(): number {
    return this.documentSections().reduce((count, section) => 
      count + section.documents.filter(doc => doc.uploaded).length, 0
    );
  }

  getUploadProgress(): number {
    const total = this.getTotalDocuments();
    const uploaded = this.getUploadedCount();
    return total > 0 ? Math.round((uploaded / total) * 100) : 0;
  }

  getSectionProgress(section: DocumentSection): number {
    const uploaded = section.documents.filter(doc => doc.uploaded).length;
    return section.documents.length > 0 ? Math.round((uploaded / section.documents.length) * 100) : 0;
  }

  getSectionUploadedCount(section: DocumentSection): number {
    return section.documents.filter(doc => doc.uploaded).length;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isUploading(): boolean {
    return this.uploadingDocuments().size > 0;
  }

  hasChanges(): boolean {
    // Check if any documents have been modified
    return true; // Implement proper change detection
  }

  getDocumentUploadProgress(documentId: string): number {
    // Return upload progress for specific document
    return 50; // Implement proper progress tracking
  }

  private loadDocuments() {
    this.documentService.getApplicationDocuments(this.applicationId()).subscribe({
      next: (sections) => {
        this.documentSections.set(sections.map(section => ({
          ...section,
          expanded: true // Start with sections expanded
        })));
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load documents:', error);
        this.isLoading.set(false);
      }
    });
  }

  private updateDocumentInSections(documentId: string, updatedDocument: ApplicationDocument) {
    this.documentSections.update(sections =>
      sections.map(section => ({
        ...section,
        documents: section.documents.map(doc =>
          doc.id === documentId ? updatedDocument : doc
        )
      }))
    );
  }
}