// src/app/SMEs/data-room/components/document-repository/link-document-modal/link-document-modal.component.ts
import { Component, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Link, X, AlertCircle, CheckCircle, ExternalLink } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';
import { DataRoomDocumentService } from '../../../services/data-room-document.service';
import { DataRoomSection, CreateDataRoomDocumentRequest } from '../../../models/data-room.models';

@Component({
  selector: 'app-link-document-modal',
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
          <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <!-- Header -->
            <div class="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900">Add Link Document</h2>
              <button
                (click)="close()"
                class="text-gray-400 hover:text-gray-600"
              >
                <lucide-icon [img]="XIcon" [size]="24" />
              </button>
            </div>

            <!-- Form -->
            <form [formGroup]="linkForm" (ngSubmit)="onSubmit()" class="p-6">
              <!-- URL Input -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Document URL *
                </label>
                <div class="relative">
                  <input
                    type="url"
                    formControlName="url"
                    placeholder="https://example.com/document.pdf"
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    [class.border-red-500]="linkForm.get('url')?.touched && linkForm.get('url')?.errors"
                  />
                  <lucide-icon 
                    [img]="LinkIcon" 
                    [size]="20" 
                    class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                </div>
                @if (linkForm.get('url')?.touched && linkForm.get('url')?.errors) {
                  <p class="mt-1 text-sm text-red-600">
                    @if (linkForm.get('url')?.errors?.['required']) {
                      URL is required
                    }
                    @if (linkForm.get('url')?.errors?.['pattern']) {
                      Please enter a valid URL
                    }
                  </p>
                }
                <p class="mt-1 text-xs text-gray-500">
                  Supported: Google Drive, Dropbox, OneDrive, or any public URL
                </p>
              </div>

              <!-- URL Preview -->
              @if (linkForm.get('url')?.valid && linkForm.get('url')?.value) {
                <div class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                  <lucide-icon [img]="ExternalLinkIcon" [size]="20" class="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-blue-900 mb-1">Link Preview</p>
                    <p class="text-xs text-blue-700 truncate">{{ linkForm.get('url')?.value }}</p>
                  </div>
                </div>
              }

              <!-- Title -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  formControlName="title"
                  placeholder="e.g., Market Research Report 2024"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  [class.border-red-500]="linkForm.get('title')?.touched && linkForm.get('title')?.errors"
                />
                @if (linkForm.get('title')?.touched && linkForm.get('title')?.errors) {
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
                  placeholder="e.g., Market Research, Product Demos, External Resources"
                  list="categoryOptions"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  [class.border-red-500]="linkForm.get('category')?.touched && linkForm.get('category')?.errors"
                />
                <datalist id="categoryOptions">
                  <option value="Market Research">
                  <option value="Product Demos">
                  <option value="Customer Testimonials">
                  <option value="Media Coverage">
                  <option value="External Resources">
                  <option value="Industry Reports">
                  <option value="Case Studies">
                  <option value="Video Presentations">
                </datalist>
                <p class="mt-1 text-xs text-gray-500">
                  Type a custom category or select from suggestions
                </p>
                @if (linkForm.get('category')?.touched && linkForm.get('category')?.errors) {
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
                  placeholder="Brief description of the linked resource..."
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
                  placeholder="e.g., research, competitors, analysis (comma-separated)"
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
                  <p class="text-sm text-green-700">Link added successfully!</p>
                </div>
              }

              <!-- Actions -->
              <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <ui-button
                  variant="outline"
                  type="button"
                  (clicked)="close()"
                  [disabled]="isAdding()"
                >
                  Cancel
                </ui-button>
                <ui-button
                  variant="primary"
                  type="submit"
                  [disabled]="linkForm.invalid || isAdding()"
                  [loading]="isAdding()"
                >
                  {{ isAdding() ? 'Adding...' : 'Add Link' }}
                </ui-button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `
})
export class LinkDocumentModalComponent {
  @Output() added = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private documentService = inject(DataRoomDocumentService);

  // Icons
  LinkIcon = Link;
  XIcon = X;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  ExternalLinkIcon = ExternalLink;

  // State
  isOpen = signal(false);
  isAdding = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  // Props
  dataRoomId = signal<string>('');
  sections = signal<DataRoomSection[]>([]);

  // Form
  linkForm: FormGroup;

  // URL validation pattern
  private urlPattern = /^https?:\/\/.+/i;

  constructor() {
    this.linkForm = this.fb.group({
      url: ['', [Validators.required, Validators.pattern(this.urlPattern)]],
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
    if (!this.isAdding()) {
      this.isOpen.set(false);
      this.reset();
      this.closed.emit();
    }
  }

  async onSubmit(): Promise<void> {
    if (this.linkForm.invalid) {
      return;
    }

    this.isAdding.set(true);
    this.error.set(null);
    this.success.set(false);

    try {
      const formValue = this.linkForm.value;
      
      // Parse tags
      const tags = formValue.tagsInput
        ? formValue.tagsInput.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : [];

      const request: CreateDataRoomDocumentRequest = {
        dataRoomId: this.dataRoomId(),
        sectionId: formValue.sectionId || undefined,
        documentType: 'link',
        externalUrl: formValue.url,
        category: formValue.category,
        title: formValue.title,
        description: formValue.description || undefined,
        tags,
        isFeatured: formValue.isFeatured,
        isShareable: true
      };

      await this.documentService.addLinkDocument(request).toPromise();

      this.success.set(true);

      // Wait a bit to show success, then close
      setTimeout(() => {
        this.added.emit();
        this.close();
      }, 1500);

    } catch (err: any) {
      console.error('Failed to add link:', err);
      this.error.set(err.message || 'Failed to add link document');
    } finally {
      this.isAdding.set(false);
    }
  }

  private reset(): void {
    this.linkForm.reset({
      url: '',
      title: '',
      category: '',
      description: '',
      sectionId: '',
      tagsInput: '',
      isFeatured: false
    });
    this.error.set(null);
    this.success.set(false);
  }
}