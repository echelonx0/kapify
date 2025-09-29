// src/app/SMEs/data-room/components/document-repository/document-upload-modal/document-upload-modal.component.ts
import { Component, Output, EventEmitter, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Upload, X, File, AlertCircle, CheckCircle } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';
import { DataRoomDocumentService } from '../../../services/data-room-document.service';
import { DataRoomSection, CreateDataRoomDocumentRequest } from '../../../models/data-room.models';

@Component({
  selector: 'app-document-upload-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    UiButtonComponent
  ],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-50 overflow-y-auto">
        <!-- Backdrop -->
        <div 
          class="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          (click)="close()"
        ></div>

        <!-- Modal -->
        <div class="flex min-h-full items-center justify-center p-4">
          <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <!-- Header -->
            <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Upload Document</h2>
              <button
                (click)="close()"
                class="text-gray-400 hover:text-gray-600"
              >
                <lucide-icon [img]="XIcon" [size]="24" />
              </button>
            </div>

            <!-- Form -->
            <form [formGroup]="uploadForm" (ngSubmit)="onSubmit()" class="p-6">
              <!-- File Upload Area -->
              <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Document File *
                </label>
                
                @if (!selectedFile()) {
                  <!-- Drop Zone -->
                  <div
                    class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
                    (click)="fileInput.click()"
                    (dragover)="onDragOver($event)"
                    (dragleave)="onDragLeave($event)"
                    (drop)="onDrop($event)"
                    [class.border-primary-500]="isDragging()"
                  >
                    <lucide-icon [img]="UploadIcon" [size]="48" class="text-gray-400 mx-auto mb-4" />
                    <p class="text-gray-600 mb-2">
                      <span class="text-primary-600 font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p class="text-sm text-gray-500">
                      Maximum file size: 50MB
                    </p>
                  </div>
                  <input
                    #fileInput
                    type="file"
                    class="hidden"
                    (change)="onFileSelected($event)"
                    accept="*/*"
                  />
                } @else {
                  <!-- Selected File -->
                  <div class="border border-gray-300 rounded-lg p-4 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <lucide-icon [img]="FileIcon" [size]="20" class="text-blue-600" />
                      </div>
                      <div>
                        <p class="font-medium text-gray-900">{{ selectedFile()!.name }}</p>
                        <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile()!.size) }}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      (click)="removeFile()"
                      class="text-red-600 hover:text-red-700"
                    >
                      <lucide-icon [img]="XIcon" [size]="20" />
                    </button>
                  </div>
                }

                @if (uploadForm.get('file')?.touched && uploadForm.get('file')?.errors) {
                  <p class="mt-1 text-sm text-red-600">File is required</p>
                }
              </div>

              <!-- Title -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  formControlName="title"
                  placeholder="e.g., Q4 Financial Statements"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  [class.border-red-500]="uploadForm.get('title')?.touched && uploadForm.get('title')?.errors"
                />
                @if (uploadForm.get('title')?.touched && uploadForm.get('title')?.errors) {
                  <p class="mt-1 text-sm text-red-600">Title is required</p>
                }
              </div>

              <!-- Category -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  formControlName="category"
                  placeholder="e.g., Financial Statements, Pitch Deck, Market Research"
                  list="categoryOptions"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  [class.border-red-500]="uploadForm.get('category')?.touched && uploadForm.get('category')?.errors"
                />
                <datalist id="categoryOptions">
                  <option value="Financial Statements">
                  <option value="Pitch Deck">
                  <option value="Market Research">
                  <option value="Legal Documents">
                  <option value="Customer Testimonials">
                  <option value="Product Documentation">
                  <option value="Partnership Agreements">
                  <option value="Business Plan">
                  <option value="Compliance Certificates">
                </datalist>
                <p class="mt-1 text-xs text-gray-500">
                  Type a custom category or select from suggestions
                </p>
                @if (uploadForm.get('category')?.touched && uploadForm.get('category')?.errors) {
                  <p class="mt-1 text-sm text-red-600">Category is required</p>
                }
              </div>

              <!-- Description -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  formControlName="description"
                  rows="3"
                  placeholder="Brief description of the document..."
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                ></textarea>
              </div>

              <!-- Section Assignment -->
              @if (sections().length > 0) {
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Section
                  </label>
                  <select
                    formControlName="sectionId"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">No section (General)</option>
                    @for (section of sections(); track section.id) {
                      <option [value]="section.id">{{ section.title }}</option>
                    }
                  </select>
                </div>
              }

              <!-- Tags -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  formControlName="tagsInput"
                  placeholder="e.g., financial, Q4, 2024 (comma-separated)"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p class="mt-1 text-xs text-gray-500">
                  Separate tags with commas
                </p>
              </div>

              <!-- Featured Checkbox -->
              <div class="mb-6">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    formControlName="isFeatured"
                    class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span class="text-sm text-gray-700">Mark as featured document</span>
                </label>
              </div>

              <!-- Upload Progress -->
              @if (isUploading()) {
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">Uploading...</span>
                    <span class="text-sm text-gray-600">{{ uploadProgress() }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      class="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      [style.width.%]="uploadProgress()"
                    ></div>
                  </div>
                </div>
              }

              <!-- Error Message -->
              @if (error()) {
                <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <lucide-icon [img]="AlertCircleIcon" [size]="20" class="text-red-600 flex-shrink-0 mt-0.5" />
                  <p class="text-sm text-red-700">{{ error() }}</p>
                </div>
              }

              <!-- Success Message -->
              @if (success()) {
                <div class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                  <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-green-600 flex-shrink-0 mt-0.5" />
                  <p class="text-sm text-green-700">Document uploaded successfully!</p>
                </div>
              }

              <!-- Actions -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <ui-button
                  variant="outline"
                  type="button"
                  (clicked)="close()"
                  [disabled]="isUploading()"
                >
                  Cancel
                </ui-button>
                <ui-button
                  variant="primary"
                  type="submit"
                  [disabled]="uploadForm.invalid || !selectedFile() || isUploading()"
                  [loading]="isUploading()"
                >
                  {{ isUploading() ? 'Uploading...' : 'Upload Document' }}
                </ui-button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class DocumentUploadModalComponent {
  @Output() uploaded = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private documentService = inject(DataRoomDocumentService);

  // Icons
  UploadIcon = Upload;
  XIcon = X;
  FileIcon = File;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;

  // State
  isOpen = signal(false);
  isUploading = signal(false);
  uploadProgress = signal(0);
  selectedFile = signal<File | null>(null);
  isDragging = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  // Props
  dataRoomId = signal<string>('');
  sections = signal<DataRoomSection[]>([]);

  // Form
  uploadForm: FormGroup;

  constructor() {
    this.uploadForm = this.fb.group({
      file: [null, Validators.required],
      title: ['', Validators.required],
      category: ['', Validators.required],
      description: [''],
      sectionId: [''],
      tagsInput: [''],
      isFeatured: [false]
    });
  }

  open(dataRoomId: string, sections: DataRoomSection[] = []): void {
    this.dataRoomId.set(dataRoomId);
    this.sections.set(sections);
    this.isOpen.set(true);
    this.reset();
  }

  close(): void {
    if (!this.isUploading()) {
      this.isOpen.set(false);
      this.reset();
      this.closed.emit();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  handleFile(file: File): void {
    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      this.error.set('File size exceeds maximum limit of 50MB');
      return;
    }

    this.selectedFile.set(file);
    this.uploadForm.patchValue({ file });
    
    // Auto-fill title if empty
    if (!this.uploadForm.get('title')?.value) {
      const titleWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      this.uploadForm.patchValue({ title: titleWithoutExt });
    }

    this.error.set(null);
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.uploadForm.patchValue({ file: null });
  }

  async onSubmit(): Promise<void> {
    if (this.uploadForm.invalid || !this.selectedFile()) {
      return;
    }

    this.isUploading.set(true);
    this.error.set(null);
    this.success.set(false);
    this.uploadProgress.set(0);

    try {
      const formValue = this.uploadForm.value;
      
      // Parse tags
      const tags = formValue.tagsInput
        ? formValue.tagsInput.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [];

      const request: CreateDataRoomDocumentRequest = {
        dataRoomId: this.dataRoomId(),
        sectionId: formValue.sectionId || undefined,
        documentType: 'file',
        file: this.selectedFile()!,
        category: formValue.category,
        title: formValue.title,
        description: formValue.description || undefined,
        tags,
        isFeatured: formValue.isFeatured,
        isShareable: true
      };

      // Simulate progress (real implementation would track actual upload)
      const progressInterval = setInterval(() => {
        this.uploadProgress.update(p => Math.min(p + 10, 90));
      }, 200);

      await this.documentService.addFileDocument(request).toPromise();

      clearInterval(progressInterval);
      this.uploadProgress.set(100);
      this.success.set(true);

      // Wait a bit to show success, then close
      setTimeout(() => {
        this.uploaded.emit();
        this.close();
      }, 1500);

    } catch (err: any) {
      console.error('Upload failed:', err);
      this.error.set(err.message || 'Failed to upload document');
      this.uploadProgress.set(0);
    } finally {
      this.isUploading.set(false);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  private reset(): void {
    this.uploadForm.reset({
      file: null,
      title: '',
      category: '',
      description: '',
      sectionId: '',
      tagsInput: '',
      isFeatured: false
    });
    this.selectedFile.set(null);
    this.error.set(null);
    this.success.set(false);
    this.uploadProgress.set(0);
  }
}