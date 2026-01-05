import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Search,
  RefreshCw,
  Sparkles,
} from 'lucide-angular';

@Component({
  selector: 'app-search-stats-bar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="mb-6 space-y-4">
      <!-- Search and Actions Row -->
      <div
        class="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
      >
        <!-- Search Input -->
        <div class="flex-1 w-full">
          <div class="relative">
            <input
              type="text"
              [value]="searchQuery"
              (input)="onSearch($event)"
              placeholder="Search opportunities..."
              class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 w-full sm:w-auto">
          <!-- Smart Suggestions Button -->
          @if (showSmartSuggestions) {
          <button
            (click)="onSmartSuggestions()"
            class="flex items-center gap-2 px-4 py-2.5 bg-teal-50 border border-teal-300/50 rounded-xl text-teal-700 text-sm font-medium hover:bg-teal-100 transition-colors"
            title="Get AI-powered recommendations"
          >
            <lucide-icon [img]="SparklesIcon" [size]="16" />
            <span class="hidden sm:inline">Recommended</span>
          </button>
          }

          <!-- Refresh Button -->
          <button
            (click)="onRefresh()"
            [disabled]="isLoading"
            class="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh results"
          >
            <lucide-icon
              [img]="RefreshIcon"
              [size]="16"
              [class.animate-spin]="isLoading"
            />
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="flex items-center justify-between text-xs text-slate-600">
        <div>
          @if (!isLoading) {
          <span class="font-medium text-slate-900">{{ totalResults }}</span>
          <span> opportunities found</span>
          } @else {
          <span>Loading opportunities...</span>
          }
        </div>
        <div class="text-slate-500">Showing latest first</div>
      </div>
    </div>
  `,
})
export class SearchStatsBarComponent {
  @Input() searchQuery: string = '';
  @Input() totalResults: number = 0;
  @Input() isLoading: boolean = false;
  @Input() showSmartSuggestions: boolean = false;

  @Output() searchChanged = new EventEmitter<string>();
  @Output() refreshData = new EventEmitter<void>();
  @Output() smartSuggestionsClick = new EventEmitter<void>();

  SearchIcon = Search;
  RefreshIcon = RefreshCw;
  SparklesIcon = Sparkles;

  onSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchChanged.emit(input.value);
  }

  onRefresh() {
    this.refreshData.emit();
  }

  onSmartSuggestions() {
    this.smartSuggestionsClick.emit();
  }
}
