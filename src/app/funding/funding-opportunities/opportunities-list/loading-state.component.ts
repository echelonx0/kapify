// loading-state.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card p-12 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
      <h3 class="text-lg font-semibold text-neutral-900 mb-2">Loading Opportunities</h3>
      <p class="text-neutral-600">Finding the best funding matches for you...</p>
    </div>
  `
})
export class LoadingStateComponent {}
