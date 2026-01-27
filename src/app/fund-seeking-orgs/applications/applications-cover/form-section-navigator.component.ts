import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FormSection {
  id: string;
  label: string;
}

/**
 * FormSectionNavigator - Neo-Brutalist Edition
 *
 * Bold, intentional design with:
 * - Thick borders on all tab buttons (border-3)
 * - High-contrast active/inactive states
 * - Uppercase section headers with wide tracking
 * - Strong typography hierarchy
 * - Sticky sidebar (desktop), collapsible (mobile)
 */
@Component({
  selector: 'app-form-section-navigator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- DESKTOP SIDEBAR -->
    <aside
      class="hidden lg:flex flex-col w-80 bg-white sticky top-0 h-screen border-l-4 border-slate-300"
    >
      <!-- HEADER -->
      <div class="px-8 py-6 border-b-4 border-slate-300 bg-slate-50">
        <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">
          {{ footerText || 'Sections' }}
        </h3>
      </div>

      <!-- TABS LIST -->
      <nav class="flex-1 px-6 py-6 space-y-2 overflow-y-auto">
        @for (section of sections; track section.id) {
        <button
          (click)="selectSection(section.id)"
          [class.bg-white]="activeSection === section.id"
          [class.border-teal-600]="activeSection === section.id"
          [class.text-teal-900]="activeSection === section.id"
          [class.font-black]="activeSection === section.id"
          [class.bg-slate-50]="activeSection !== section.id"
          [class.border-slate-400]="activeSection !== section.id"
          [class.text-slate-700]="activeSection !== section.id"
          [class.font-bold]="activeSection !== section.id"
          class="w-full text-left px-5 py-4 rounded-lg border-3 transition-all duration-200 hover:border-slate-500 active:scale-95 text-sm"
        >
          {{ section.label }}
        </button>
        }
      </nav>
    </aside>

    <!-- MOBILE HAMBURGER -->
    <button
      (click)="toggleMobile()"
      class="lg:hidden fixed bottom-20 left-6 z-40 w-12 h-12 rounded-lg bg-teal-600 text-white flex items-center justify-center border-3 border-teal-700 hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 active:scale-95"
      aria-label="Toggle sections"
    >
      <svg
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2.5"
          d="M4 6h16M4 12h16M4 18h16"
        ></path>
      </svg>
    </button>

    <!-- MOBILE MENU -->
    @if (isMobileOpen) {
    <div class="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
      <!-- Mobile header -->
      <div
        class="px-6 py-6 border-b-4 border-slate-300 bg-slate-50 flex items-center justify-between"
      >
        <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">
          {{ footerText || 'Sections' }}
        </h3>
        <button
          (click)="toggleMobile()"
          class="w-10 h-10 flex items-center justify-center text-slate-900 border-2 border-slate-400 rounded-lg hover:bg-slate-100 active:scale-95 transition-all duration-200"
          aria-label="Close"
        >
          <svg fill="currentColor" viewBox="0 0 20 20" class="w-5 h-5">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Mobile tabs -->
      <nav class="flex-1 px-6 py-6 space-y-2 overflow-y-auto">
        @for (section of sections; track section.id) {
        <button
          (click)="selectAndCloseMobile(section.id)"
          [class.bg-white]="activeSection === section.id"
          [class.border-teal-600]="activeSection === section.id"
          [class.text-teal-900]="activeSection === section.id"
          [class.font-black]="activeSection === section.id"
          [class.bg-slate-50]="activeSection !== section.id"
          [class.border-slate-400]="activeSection !== section.id"
          [class.text-slate-700]="activeSection !== section.id"
          [class.font-bold]="activeSection !== section.id"
          class="w-full text-left px-5 py-4 rounded-lg border-3 transition-all duration-200 hover:border-slate-500 text-base"
        >
          {{ section.label }}
        </button>
        }
      </nav>
    </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class FormSectionNavigatorComponent {
  @Input() sections: FormSection[] = [];
  @Input() activeSection: string | null = null;
  @Input() footerText?: string;
  @Output() sectionSelected = new EventEmitter<string>();

  isMobileOpen = false;

  selectSection(sectionId: string): void {
    this.sectionSelected.emit(sectionId);
  }

  selectAndCloseMobile(sectionId: string): void {
    this.sectionSelected.emit(sectionId);
    this.isMobileOpen = false;
  }

  toggleMobile(): void {
    this.isMobileOpen = !this.isMobileOpen;
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (this.isMobileOpen) {
      this.isMobileOpen = false;
    }
  }
}
