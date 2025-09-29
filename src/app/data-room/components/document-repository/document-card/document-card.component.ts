// src/app/SMEs/data-room/components/document-repository/document-card/document-card.component.ts
import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText, Link, Download, Eye, Edit, Trash2, ExternalLink } from 'lucide-angular';
import { UiButtonComponent, UiCardComponent } from 'src/app/shared/components';
import { DataRoomDocument } from '../../../models/data-room.models';

@Component({
  selector: 'app-document-card',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent
  ],
  template: `
    <ui-card class="document-card hover:shadow-lg transition-all duration-200 cursor-pointer">
      <div class="p-4">
        <!-- Header -->
        <div class="flex items-start justify-between mb-3">
          <div [class]="'w-12 h-12 rounded-lg flex items-center justify-center ' + getIconBackground()">
            <lucide-icon 
              [img]="document().documentType === 'file' ? FileTextIcon : LinkIcon" 
              [size]="24" 
              [class]="getIconColor()"
            />
          </div>
          
          @if (document().isFeatured) {
            <div class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
              Featured
            </div>
          }
        </div>

        <!-- Content -->
        <div class="mb-3">
          <h3 class="font-semibold text-gray-900 mb-1 line-clamp-2">
            {{ document().title }}
          </h3>
          
          @if (document().description) {
            <p class="text-sm text-gray-600 line-clamp-2 mb-2">
              {{ document().description }}
            </p>
          }
          
          <!-- Category -->
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {{ document().category }}
            </span>
            
            @if (document().documentType === 'file' && document().fileSize) {
              <span class="text-xs text-gray-500">
                {{ formatFileSize(document().fileSize!) }}
              </span>
            }
          </div>

          <!-- Tags -->
          @if (document().tags && document().tags.length > 0) {
            <div class="flex flex-wrap gap-1 mb-2">
              @for (tag of document().tags.slice(0, 3); track tag) {
                <span class="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                  {{ tag }}
                </span>
              }
              @if (document().tags.length > 3) {
                <span class="text-xs text-gray-500">
                  +{{ document().tags.length - 3 }}
                </span>
              }
            </div>
          }

          <!-- Metadata -->
          <div class="text-xs text-gray-500">
            Added {{ formatDate(document().createdAt) }}
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 pt-3 border-t border-gray-100">
          @if (canManage()) {
            <!-- Owner Actions -->
            <ui-button 
              variant="ghost" 
              size="sm"
              (clicked)="onView()"
              class="flex-1"
            >
              <lucide-icon [img]="EyeIcon" [size]="16" class="mr-1" />
              View
            </ui-button>
            
            <ui-button 
              variant="ghost" 
              size="sm"
              (clicked)="onEdit()"
            >
              <lucide-icon [img]="EditIcon" [size]="16" />
            </ui-button>
            
            <ui-button 
              variant="ghost" 
              size="sm"
              (clicked)="onDelete()"
              class="text-red-600 hover:text-red-700"
            >
              <lucide-icon [img]="TrashIcon" [size]="16" />
            </ui-button>
          } @else {
            <!-- Viewer Actions -->
            @if (document().documentType === 'link') {
              <ui-button 
                variant="primary" 
                size="sm"
                (clicked)="onView()"
                class="flex-1"
              >
                <lucide-icon [img]="ExternalLinkIcon" [size]="16" class="mr-1" />
                Open Link
              </ui-button>
            } @else {
              <ui-button 
                variant="ghost" 
                size="sm"
                (clicked)="onView()"
                class="flex-1"
              >
                <lucide-icon [img]="EyeIcon" [size]="16" class="mr-1" />
                View
              </ui-button>
              
              @if (canDownload()) {
                <ui-button 
                  variant="primary" 
                  size="sm"
                  (clicked)="onDownload()"
                >
                  <lucide-icon [img]="DownloadIcon" [size]="16" class="mr-1" />
                  Download
                </ui-button>
              }
            }
          }
        </div>
      </div>
    </ui-card>
  `,
  styles: [`
    .document-card {
      height: 100%;
      border: 1px solid #e5e7eb;
    }

    .document-card:hover {
      border-color: #3b82f6;
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class DocumentCardComponent {
  @Input({ required: true }) document!: () => DataRoomDocument;
  @Input() canManage = () => false;
  @Input() canDownload = () => false;

  @Output() view = new EventEmitter<DataRoomDocument>();
  @Output() edit = new EventEmitter<DataRoomDocument>();
  @Output() delete = new EventEmitter<DataRoomDocument>();
  @Output() download = new EventEmitter<DataRoomDocument>();

  // Icons
  FileTextIcon = FileText;
  LinkIcon = Link;
  DownloadIcon = Download;
  EyeIcon = Eye;
  EditIcon = Edit;
  TrashIcon = Trash2;
  ExternalLinkIcon = ExternalLink;

  onView(): void {
    this.view.emit(this.document());
  }

  onEdit(): void {
    this.edit.emit(this.document());
  }

  onDelete(): void {
    this.delete.emit(this.document());
  }

  onDownload(): void {
    this.download.emit(this.document());
  }

  getIconBackground(): string {
    return this.document().documentType === 'file' 
      ? 'bg-blue-100' 
      : 'bg-purple-100';
  }

  getIconColor(): string {
    return this.document().documentType === 'file'
      ? 'text-blue-600'
      : 'text-purple-600';
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return date.toLocaleDateString();
  }
}