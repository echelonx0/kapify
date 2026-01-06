// src/app/SMEs/profile/steps/financial-analysis/components/financial-table-skeleton/financial-table-skeleton.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-financial-table-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <!-- Table Header Skeleton -->
      <div class="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
        <div class="grid gap-4" [style.grid-template-columns]="gridTemplate">
          <div class="skeleton-box h-4 w-24 bg-slate-200/70 rounded"></div>
          @for (col of columns; track $index) {
          <div class="skeleton-box h-4 w-16 bg-slate-200/70 rounded"></div>
          }
        </div>
      </div>

      <!-- Table Rows Skeleton -->
      <div class="divide-y divide-slate-200">
        @for (row of rows; track $index) {
        <div
          class="px-6 py-4 hover:bg-slate-50/50 transition-colors duration-200"
        >
          <div class="grid gap-4" [style.grid-template-columns]="gridTemplate">
            <!-- Label column -->
            <div class="flex items-center">
              <div
                class="skeleton-box h-4 bg-slate-200/70 rounded"
                [style.width]="rowWidths[$index] + 'px'"
              ></div>
            </div>

            <!-- Value columns -->
            @for (col of columns; track colIndex; let colIndex = $index) {
            <div class="flex items-center justify-end">
              <div class="skeleton-box h-4 w-20 bg-slate-200/70 rounded"></div>
            </div>
            }
          </div>
        </div>
        }
      </div>

      <!-- Loading indicator -->
      <div class="px-6 py-4 bg-slate-50/30 border-t border-slate-200">
        <div
          class="flex items-center justify-center gap-2 text-sm text-slate-500"
        >
          <div class="skeleton-pulse w-4 h-4 rounded-full bg-teal-300"></div>
          <span>Loading financial data...</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .skeleton-box {
        animation: skeleton-loading 1.5s ease-in-out infinite;
        background: linear-gradient(
          90deg,
          rgba(226, 232, 240, 0.7) 0%,
          rgba(226, 232, 240, 0.9) 50%,
          rgba(226, 232, 240, 0.7) 100%
        );
        background-size: 200% 100%;
      }

      @keyframes skeleton-loading {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      .skeleton-pulse {
        animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.4;
        }
      }
    `,
  ],
})
export class FinancialTableSkeletonComponent implements OnInit {
  @Input() rowCount: number = 8;
  @Input() columnCount: number = 9;

  // Pre-generate random widths once on init
  rowWidths: number[] = [];

  get rows(): number[] {
    return Array(this.rowCount).fill(0);
  }

  get columns(): number[] {
    return Array(this.columnCount).fill(0);
  }

  get gridTemplate(): string {
    return `minmax(200px, 1fr) repeat(${this.columnCount}, minmax(120px, 1fr))`;
  }

  ngOnInit(): void {
    // Generate random widths ONCE during initialization
    this.rowWidths = Array(this.rowCount)
      .fill(0)
      .map(() => this.getRandomWidth(120, 200));
  }

  /**
   * Generate single random width value
   */
  private getRandomWidth(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
