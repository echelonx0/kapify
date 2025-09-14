// search-stats-bar.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, RefreshCw, Filter, BarChart3 } from 'lucide-angular';

@Component({
  selector: 'app-search-stats-bar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="card bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
      <div class="p-6">
        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
          
          <!-- Enhanced Search -->
          <div class="flex-1">
            <div class="relative group">
              <lucide-icon
                [img]="SearchIcon"
                [size]="20"
                class="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500 transition-colors"
              />
              <input
                type="text"
                placeholder="Search opportunities by title, funder, or description..."
                [value]="searchQuery"
                (input)="onSearchInput($event)"
                class="w-full pl-12 pr-4 py-4 bg-white border-2 border-neutral-200 rounded-xl text-sm placeholder-neutral-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all duration-200 shadow-sm"
              />
            </div>
          </div>

          <!-- Stats and Actions -->
          <div class="flex items-center gap-4">
            
            <!-- Results Count -->
            <div class="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-lg border border-primary-200">
              <lucide-icon [img]="BarChart3Icon" [size]="16" class="text-primary-600" />
              <span class="text-sm font-medium text-primary-700">
                {{ formatResultsCount() }}
              </span>
            </div>

            <!-- Loading Indicator -->
            <div *ngIf="isLoading" class="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
              <div class="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <span class="text-sm text-blue-700">Loading...</span>
            </div>

            <!-- Refresh Button -->
            <button 
              (click)="refresh()"
              [disabled]="isLoading"
              class="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm group">
              <lucide-icon 
                [img]="RefreshCwIcon" 
                [size]="16" 
                [class]="'transition-transform duration-300 ' + (isLoading ? 'animate-spin' : 'group-hover:rotate-180')" />
              <span class="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        <!-- Mobile Stats Row -->
        <div class="sm:hidden mt-4 pt-4 border-t border-neutral-100">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <lucide-icon [img]="BarChart3Icon" [size]="16" class="text-primary-600" />
              <span class="text-sm font-medium text-primary-700">
                {{ formatResultsCount() }}
              </span>
            </div>
            
            <div class="flex items-center gap-2 text-neutral-500">
              <lucide-icon [img]="FilterIcon" [size]="14" />
              <span class="text-xs">Scroll down for filters</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class SearchStatsBarComponent {
  @Input() searchQuery: string = '';
  @Input() totalResults: number = 0;
  @Input() isLoading: boolean = false;
  @Output() searchChanged = new EventEmitter<string>();
  @Output() refreshData = new EventEmitter<void>();

  SearchIcon = Search;
  RefreshCwIcon = RefreshCw;
  FilterIcon = Filter;
  BarChart3Icon = BarChart3;

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchChanged.emit(target.value);
  }

  refresh() {
    this.refreshData.emit();
  }

  formatResultsCount(): string {
    if (this.isLoading) {
      return 'Loading...';
    }
    
    if (this.totalResults === 0) {
      return 'No opportunities found';
    }
    
    if (this.totalResults === 1) {
      return '1 opportunity found';
    }
    
    return `${this.totalResults.toLocaleString()} opportunities found`;
  }
}