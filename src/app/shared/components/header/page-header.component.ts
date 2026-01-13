import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex-shrink-0 px-4 lg:px-8 py-6 border-b-4 border-slate-200 bg-white sticky top-0 z-10"
    >
      <div class="flex items-center justify-between gap-4">
        <!-- Left: Back Button + Title Section -->
        <div class="flex items-center gap-4 flex-1 min-w-0">
          <!-- Back Button -->
          <button
            (click)="goBack()"
            class="flex-shrink-0 w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
            aria-label="Go back"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>

          <!-- Title & Subtitle -->
          <div class="min-w-0">
            <h1
              class="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate"
            >
              {{ title }}
            </h1>
            <p
              *ngIf="subtitle"
              class="text-xs lg:text-sm text-slate-600 mt-1 line-clamp-2"
            >
              {{ subtitle }}
            </p>
          </div>
        </div>

        <!-- Right: Completion Badge (Optional) -->
        <div
          *ngIf="completionPercentage !== undefined"
          class="flex-shrink-0 text-right"
        >
          <div class="text-2xl lg:text-4xl font-black text-teal-600">
            {{ completionPercentage }}%
          </div>
          <p
            class="text-xs text-slate-600 font-semibold mt-1 whitespace-nowrap"
          >
            Complete
          </p>
        </div>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() title: string = '';
  @Input() subtitle?: string;
  @Input() completionPercentage?: number;

  @Output() back = new EventEmitter<void>();

  goBack(): void {
    this.back.emit();
    window.history.back();
  }
}
