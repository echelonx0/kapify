import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="flex-shrink-0 px-4 lg:px-8 py-5 border-b-4 border-slate-200 bg-white sticky top-0 z-10"
    >
      <div class="flex items-center justify-between gap-4">
        <!-- LEFT: Back Button + Title -->
        <div class="flex items-center gap-4 min-w-0">
          <!-- Back Button -->
          <button
            (click)="goBack()"
            class="flex-shrink-0 w-9 h-9 flex items-center justify-center
               rounded-xl border border-slate-300
               bg-white text-slate-600
               hover:bg-slate-100 hover:text-slate-900
               active:bg-slate-200
               focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500
               transition-all duration-200 shadow-sm"
            aria-label="Go back"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>

          <!-- Title & Subtitle -->
          <div class="min-w-0">
            <h1
              class="text-xl lg:text-2xl font-black text-slate-900 tracking-tight truncate"
            >
              {{ title }}
            </h1>
            <p
              *ngIf="subtitle"
              class="text-[0.7rem] lg:text-xs text-slate-600 mt-1 line-clamp-2"
            >
              {{ subtitle }}
            </p>
          </div>
        </div>

        <!-- RIGHT: Completion Badge -->
        <div
          *ngIf="completionPercentage !== undefined"
          class="flex-shrink-0 text-right"
        >
          <div
            class="text-xl lg:text-3xl font-black text-teal-600 leading-none"
          >
            {{ completionPercentage }}%
          </div>
          <p
            class="text-[0.65rem] text-slate-600 font-semibold mt-1 whitespace-nowrap"
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
