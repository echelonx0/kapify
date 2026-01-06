// src/app/SMEs/data-room/components/document-repository/document-repository.component.ts
import { Component, Input, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Plus, Upload, Link, Download } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';
import { DataRoomDocumentService } from '../../services/data-room-document.service';
import { DataRoomAccessService } from '../../services/data-room-access.service';
import { DataRoomDocument, DataRoomSection, UserPermissions } from '../../models/data-room.models';
import { DocumentGridComponent } from './document-grid/document-grid.component';
import { DocumentUploadModalComponent } from './document-upload-modal/document-upload-modal.component';
import { LinkDocumentModalComponent } from './link-document-modal/link-document-modal.component';

@Component({
  selector: 'app-document-repository',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent,
    DocumentGridComponent,
    DocumentUploadModalComponent,
    LinkDocumentModalComponent
  ],
  template: `
    <div class="document-repository">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Document Repository</h2>
          <p class="text-gray-600 mt-1">
            @if (permissions.canManage) {
              Manage your data room documents and links
            } @else {
              Browse available documents
            }
          </p>
        </div>

        <!-- Actions (Owner Only) -->
        @if (permissions.canManage) {
          <div class="flex items-center gap-3">
            <ui-button variant="outline" (clicked)="openUploadModal()">
              <lucide-icon [img]="UploadIcon" [size]="16" class="mr-2" />
              Upload File
            </ui-button>
            <ui-button variant="outline" (clicked)="openLinkModal()">
              <lucide-icon [img]="LinkIcon" [size]="16" class="mr-2" />
              Add Link
            </ui-button>
          </div>
        }
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total Documents</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ documents().length }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="PlusIcon" [size]="24" class="text-blue-600" />
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Files</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ fileCount() }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="UploadIcon" [size]="24" class="text-green-600" />
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Links</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ linkCount() }}</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="LinkIcon" [size]="24" class="text-purple-600" />
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Categories</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ categories().length }}</p>
            </div>
            <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="PlusIcon" [size]="24" class="text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="text-center py-12">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-gray-600">Loading documents...</p>
        </div>
      } @else if (error()) {
        <!-- Error State -->
        <div class="text-center py-12">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <lucide-icon [img]="PlusIcon" [size]="32" class="text-red-600" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Failed to load documents</h3>
          <p class="text-gray-600 mb-4">{{ error() }}</p>
          <ui-button variant="primary" (clicked)="loadDocuments()">
            Try Again
          </ui-button>
        </div>
      } @else {
        <!-- Document Grid -->
        <app-document-grid
          [documents]="documents()"
          [categories]="categories()"
          [canManage]="permissions.canManage"
          [canDownload]="permissions.canDownload"
          (view)="onViewDocument($event)"
          (edit)="onEditDocument($event)"
          (delete)="onDeleteDocument($event)"
          (download)="onDownloadDocument($event)"
        />
      }

      <!-- Modals -->
      <app-document-upload-modal
        (uploaded)="onDocumentUploaded()"
        (closed)="onModalClosed()"
      />

      <app-link-document-modal
        (added)="onLinkAdded()"
        (closed)="onModalClosed()"
      />
    </div>
  `,
  styles: [`
    .document-repository {
      padding: 1.5rem 0;
    }
  `]
})
export class DocumentRepositoryComponent implements OnInit {
  @Input({ required: true }) dataRoomId!: string;
  @Input({ required: true }) permissions!: UserPermissions;
  @Input() sections: DataRoomSection[] = [];

  @ViewChild(DocumentUploadModalComponent) uploadModal!: DocumentUploadModalComponent;
  @ViewChild(LinkDocumentModalComponent) linkModal!: LinkDocumentModalComponent;

  private documentService = inject(DataRoomDocumentService);
  private accessService = inject(DataRoomAccessService);

  // Icons
  PlusIcon = Plus;
  UploadIcon = Upload;
  LinkIcon = Link;
  DownloadIcon = Download;

  // State
  documents = signal<DataRoomDocument[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Computed
  categories = computed(() => {
    const cats = new Set(this.documents().map(doc => doc.category));
    return Array.from(cats).sort();
  });

  fileCount = computed(() => 
    this.documents().filter(doc => doc.documentType === 'file').length
  );

  linkCount = computed(() => 
    this.documents().filter(doc => doc.documentType === 'link').length
  );

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.documentService.getAllDocuments(this.dataRoomId).subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load documents:', err);
        this.error.set('Failed to load documents. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  openUploadModal(): void {
    this.uploadModal.open(this.dataRoomId, this.sections);
  }

  openLinkModal(): void {
    this.linkModal.open(this.dataRoomId, this.sections);
  }

  onDocumentUploaded(): void {
    this.loadDocuments();
  }

  onLinkAdded(): void {
    this.loadDocuments();
  }

  onModalClosed(): void {
    // Handle modal close if needed
  }

  onViewDocument(document: DataRoomDocument): void {
    // Track view
    this.accessService.trackDocumentView(document.id, this.dataRoomId).subscribe();

    // Open document
    if (document.documentType === 'link') {
      window.open(document.externalUrl, '_blank');
    } else {
      // Get temporary URL and open
      this.documentService.getTemporaryUrl(document.id).subscribe({
        next: (url) => {
          window.open(url, '_blank');
        },
        error: (err) => {
          console.error('Failed to get document URL:', err);
          alert('Failed to open document');
        }
      });
    }
  }

  onEditDocument(document: DataRoomDocument): void {
    // TODO: Implement edit modal
    console.log('Edit document:', document);
  }

  onDeleteDocument(document: DataRoomDocument): void {
    if (confirm(`Are you sure you want to delete "${document.title}"?`)) {
      this.documentService.deleteDocument(document.id).subscribe({
        next: () => {
          this.loadDocuments();
        },
        error: (err) => {
          console.error('Failed to delete document:', err);
          alert('Failed to delete document');
        }
      });
    }
  }

onDownloadDocument(document: DataRoomDocument): void {
  if (document.documentType === 'link') {
    window.open(document.externalUrl, '_blank');
    return;
  }

  // Track download
  this.accessService.trackDocumentDownload(document.id, this.dataRoomId).subscribe();

  // Download file
  this.documentService.downloadDocument(document.id).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a'); // ✅ Changed from document to window.document
      link.href = url;
      link.download = document.originalName || document.title;
      link.click();
      window.URL.revokeObjectURL(url);
    },
    error: (err) => {
      console.error('Failed to download document:', err);
      alert('Failed to download document');
    }
  });
}
}