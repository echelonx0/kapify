import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SideNavItem {
  id: string;
  label: string;
  icon?: string;
  badge?: {
    label: string;
    value?: string | number;
    color?: 'teal' | 'green' | 'slate' | 'amber';
  };
  disabled?: boolean;
  action?: () => void;
}

/**
 * SideNavComponent
 * Neo-brutalist vertical side navigation
 * - Positioned on right side
 * - Sticky, hides on mobile (lg: only)
 * - Bold borders and typography
 * - Active state with left border + background
 *
 * Usage:
 * <app-side-nav
 *   [items]="navItems"
 *   [activeId]="activeCategory()"
 *   (itemSelected)="onCategorySelected($event)"
 * />
 */
@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav
      class="hidden lg:flex flex-col sticky top-0 h-screen w-80 bg-white border-l-4 border-slate-300 overflow-y-auto z-20"
    >
      <!-- Nav Header -->
      <div
        class="flex-shrink-0 px-6 py-6 border-b-4 border-slate-200 bg-slate-50"
      >
        <h3 class="text-sm font-black text-slate-900 uppercase tracking-widest">
          {{ title }}
        </h3>
      </div>

      <!-- Nav Items -->
      <div class="flex-1 divide-y divide-slate-200">
        @for (item of items; track item.id) {
        <button
          (click)="item.action ? item.action() : selectItem(item.id)"
          [disabled]="item.disabled"
          [ngClass]="{
            'bg-teal-50 border-l-4 border-teal-600': activeId === item.id,
            'bg-white border-l-4 border-transparent hover:bg-slate-50':
              activeId !== item.id && !item.disabled,
            'bg-slate-50 border-l-4 border-transparent opacity-50 cursor-not-allowed':
              item.disabled,
          }"
          class="w-full text-left px-6 py-5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-inset"
        >
          <!-- Item Content -->
          <div class="flex items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p
                [ngClass]="{
                  'font-black text-slate-900': activeId === item.id,
                  'font-semibold text-slate-700': activeId !== item.id,
                  'text-slate-500': item.disabled,
                }"
                class="text-sm uppercase tracking-wide truncate"
              >
                {{ item.label }}
              </p>
            </div>

            <!-- Badge -->
            <div
              *ngIf="item.badge"
              [ngClass]="getBadgeClass(item.badge.color || 'slate')"
              class="flex-shrink-0 px-2.5 py-1 rounded-lg border-2 text-xs font-bold"
            >
              {{ item.badge.value || item.badge.label }}
            </div>
          </div>
        </button>
        }
      </div>

      <!-- Footer (optional) -->
      <div
        *ngIf="footerText"
        class="flex-shrink-0 px-6 py-4 border-t-4 border-slate-200 bg-slate-50 text-xs text-slate-600 font-semibold"
      >
        {{ footerText }}
      </div>
    </nav>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class SideNavComponent {
  @Input() items: SideNavItem[] = [];
  @Input() activeId: string | null = null;
  @Input() title = 'Categories';
  @Input() footerText?: string;
  @Output() itemSelected = new EventEmitter<string>();

  selectItem(id: string): void {
    this.itemSelected.emit(id);
  }

  /**
   * Get badge styling based on color
   */
  getBadgeClass(color: string): string {
    const classes: Record<string, string> = {
      teal: 'bg-teal-50 border-teal-400 text-teal-700',
      green: 'bg-green-50 border-green-400 text-green-700',
      slate: 'bg-slate-100 border-slate-300 text-slate-700',
      amber: 'bg-amber-50 border-amber-400 text-amber-700',
    };
    return classes[color] || classes['slate'];
  }
}
