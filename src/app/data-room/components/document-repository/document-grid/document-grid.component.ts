// src/app/SMEs/data-room/components/document-repository/document-grid/document-grid.component.ts
import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Filter, SortAsc, SortDesc, Grid, List } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';
import { DataRoomDocument } from '../../../models/data-room.models';
import { DocumentCardComponent } from '../document-card/document-card.component';

type SortField = 'title' | 'category' | 'createdAt' | 'fileSize';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-document-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    UiButtonComponent,
    DocumentCardComponent
  ],
  template: `
    <div class="document-grid-container">
      <!-- Filters & Controls -->
      <div class="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <!-- Search -->
          <div class="flex-1 relative">
            <lucide-icon 
              [img]="SearchIcon" 
              [size]="20" 
              class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
              placeholder="Search documents..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <!-- Category Filter -->
          <select
            [(ngModel)]="selectedCategory"
            (ngModelChange)="onFilterChange()"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            @for (category of categories(); track category) {
              <option [value]="category">{{ category }}</option>
            }
          </select>

          <!-- Document Type Filter -->
          <select
            [(ngModel)]="selectedType"
            (ngModelChange)="onFilterChange()"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="file">Files</option>
            <option value="link">Links</option>
          </select>

          <!-- Sort -->
          <div class="flex gap-2">
            <select
              [(ngModel)]="sortField"
              (ngModelChange)="onSortChange()"
              class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="createdAt">Date</option>
              <option value="title">Title</option>
              <option value="category">Category</option>
              <option value="fileSize">Size</option>
            </select>

            <ui-button
              variant="ghost"
              size="sm"
              (clicked)="toggleSortDirection()"
            >
              <lucide-icon 
                [img]="sortDirection === 'asc' ? SortAscIcon : SortDescIcon" 
                [size]="20"
              />
            </ui-button>
          </div>

          <!-- View Mode -->
          <div class="flex gap-1 border border-gray-300 rounded-lg p-1">
            <button
              (click)="viewMode.set('grid')"
              [class]="'p-2 rounded ' + (viewMode() === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100')"
            >
              <lucide-icon [img]="GridIcon" [size]="20" />
            </button>
            <button
              (click)="viewMode.set('list')"
              [class]="'p-2 rounded ' + (viewMode() === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100')"
            >
              <lucide-icon [img]="ListIcon" [size]="20" />
            </button>
          </div>
        </div>

        <!-- Active Filters -->
        @if (hasActiveFilters()) {
          <div class="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
            <span class="text-sm text-gray-600">Active filters:</span>
            @if (searchQuery) {
              <span class="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
                Search: "{{ searchQuery }}"
              </span>
            }
            @if (selectedCategory) {
              <span class="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
                Category: {{ selectedCategory }}
              </span>
            }
            @if (selectedType) {
              <span class="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full">
                Type: {{ selectedType }}
              </span>
            }
            <button
              (click)="clearFilters()"
              class="text-xs text-primary-600 hover:text-primary-700 font-medium ml-2"
            >
              Clear all
            </button>
          </div>
        }
      </div>

      <!-- Results Count -->
      <div class="flex items-center justify-between mb-4">
        <p class="text-sm text-gray-600">
          {{ filteredDocuments().length }} document{{ filteredDocuments().length !== 1 ? 's' : '' }} found
        </p>
      </div>

      <!-- Document Grid/List -->
      @if (filteredDocuments().length > 0) {
        <div [class]="viewMode() === 'grid' ? 'document-grid' : 'document-list'">
          @for (doc of filteredDocuments(); track doc.id) {
            <app-document-card
              [document]="() => doc"
              [canManage]="canManage"
              [canDownload]="canDownload"
              (view)="onView($event)"
              (edit)="onEdit($event)"
              (delete)="onDelete($event)"
              (download)="onDownload($event)"
            />
          }
        </div>
      } @else {
        <!-- Empty State -->
        <div class="text-center py-12">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <lucide-icon [img]="SearchIcon" [size]="32" class="text-gray-400" />
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
          <p class="text-gray-600 mb-4">
            @if (hasActiveFilters()) {
              Try adjusting your filters or search terms
            } @else {
              No documents have been added yet
            }
          </p>
          @if (hasActiveFilters()) {
            <ui-button variant="outline" (clicked)="clearFilters()">
              Clear Filters
            </ui-button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .document-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .document-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    @media (max-width: 768px) {
      .document-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DocumentGridComponent {
  @Input({ required: true }) documents!: () => DataRoomDocument[];
  @Input() categories = () => [] as string[];
  @Input() canManage = () => false;
  @Input() canDownload = () => false;

  @Output() view = new EventEmitter<DataRoomDocument>();
  @Output() edit = new EventEmitter<DataRoomDocument>();
  @Output() delete = new EventEmitter<DataRoomDocument>();
  @Output() download = new EventEmitter<DataRoomDocument>();

  // Icons
  SearchIcon = Search;
  FilterIcon = Filter;
  SortAscIcon = SortAsc;
  SortDescIcon = SortDesc;
  GridIcon = Grid;
  ListIcon = List;

  // State
  searchQuery = '';
  selectedCategory = '';
  selectedType = '';
  sortField = signal<SortField>('createdAt');
  sortDirection = signal<SortDirection>('desc');
  viewMode = signal<ViewMode>('grid');

  // Computed filtered and sorted documents
  filteredDocuments = computed(() => {
    let docs = this.documents();

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      docs = docs.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    if (this.selectedCategory) {
      docs = docs.filter(doc => doc.category === this.selectedCategory);
    }

    // Apply type filter
    if (this.selectedType) {
      docs = docs.filter(doc => doc.documentType === this.selectedType);
    }

    // Apply sorting
    return this.sortDocuments(docs);
  });

  onSearchChange(): void {
    // Debouncing handled by ngModelChange
  }

  onFilterChange(): void {
    // Triggers computed recalculation
  }

  onSortChange(): void {
    // Triggers computed recalculation
  }

  toggleSortDirection(): void {
    this.sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedType = '';
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedCategory || this.selectedType);
  }

  private sortDocuments(docs: DataRoomDocument[]): DataRoomDocument[] {
    const sorted = [...docs].sort((a, b) => {
      let comparison = 0;

      switch (this.sortField()) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'fileSize':
          const sizeA = a.fileSize || 0;
          const sizeB = b.fileSize || 0;
          comparison = sizeA - sizeB;
          break;
      }

      return this.sortDirection() === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  onView(document: DataRoomDocument): void {
    this.view.emit(document);
  }

  onEdit(document: DataRoomDocument): void {
    this.edit.emit(document);
  }

  onDelete(document: DataRoomDocument): void {
    this.delete.emit(document);
  }

  onDownload(document: DataRoomDocument): void {
    this.download.emit(document);
  }
}