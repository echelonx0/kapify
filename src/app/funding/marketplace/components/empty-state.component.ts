
// empty-state.component.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, Filter } from 'lucide-angular';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="empty-state">
      <div class="empty-icon">
        <lucide-icon [img]="SearchIcon" [size]="32" class="text-neutral-400" />
      </div>
      <h3 class="empty-title">No funding opportunities found</h3>
      <p class="empty-description">
        We couldn't find any opportunities matching your current criteria. 
        Try adjusting your filters or search terms to discover more funding options.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <button 
          (click)="clearFilters.emit()"
          class="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 focus:ring-4 focus:ring-primary-200 transition-all duration-200">
          <lucide-icon [img]="FilterIcon" [size]="16" />
          Clear all filters
        </button>
        
        <button class="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-neutral-200 text-neutral-700 rounded-lg font-semibold hover:border-neutral-300 hover:bg-neutral-50 transition-all duration-200">
          <lucide-icon [img]="SearchIcon" [size]="16" />
          Browse all opportunities
        </button>
      </div>
    </div>
  `
})
export class EmptyStateComponent {
  @Output() clearFilters = new EventEmitter<void>();
  
  SearchIcon = Search;
  FilterIcon = Filter;
}
