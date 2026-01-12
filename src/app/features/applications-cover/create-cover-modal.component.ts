import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FundingApplicationCoverInformation } from 'src/app/shared/models/funding-application-cover.model';

export interface CreateCoverChoice {
  action: 'fresh' | 'copy';
  coverId?: string;
}

/**
 * CreateCoverModalComponent
 *
 * Neo-brutalist modal that helps users decide:
 * - Start from fresh blank cover
 * - Copy an existing cover
 *
 * Replaces abrupt auto-creation with guided UX.
 * Improves conversion by giving users clear choice.
 */
@Component({
  selector: 'app-create-cover-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
    >
      <!-- Modal Container -->
      <div
        class="bg-white rounded-2xl border-4 border-slate-300 shadow-2xl max-w-2xl w-full animate-fadeInScale"
      >
        <!-- Header -->
        <div class="px-8 py-8 border-b-4 border-slate-200">
          <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Create New Funding Profile
          </h2>
          <p class="text-sm text-slate-600 font-semibold">
            Choose how you'd like to get started
          </p>
        </div>

        <!-- Content -->
        <div class="px-8 py-8 space-y-4">
          <!-- Option 1: Start Fresh -->
          <button
            (click)="selectChoice('fresh')"
            class="w-full text-left px-6 py-6 bg-white border-3 border-slate-300 rounded-xl hover:border-teal-500 hover:bg-teal-50 transition-all duration-200 group"
          >
            <div class="flex items-start gap-4">
              <div
                class="w-12 h-12 rounded-lg bg-teal-100 border-2 border-teal-600 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200"
              >
                <svg
                  class="w-6 h-6 text-teal-700"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M10.5 1.5H5.75A2.25 2.25 0 003.5 3.75v12.5A2.25 2.25 0 005.75 18.5h8.5a2.25 2.25 0 002.25-2.25V9.5m-8-4v4m0-4a1 1 0 011-1h2a1 1 0 011 1m-3 4h4M4 16h12"
                  ></path>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-lg font-black text-slate-900">Start Fresh</p>
                <p class="text-sm text-slate-600 mt-1">
                  Create a brand new blank profile with your own criteria
                </p>
              </div>
              <div
                class="text-teal-600 font-black text-2xl group-hover:translate-x-1 transition-transform"
              >
                →
              </div>
            </div>
          </button>

          <!-- Option 2: Copy Existing (only if covers exist) -->
          <button
            *ngIf="existingCovers.length > 0"
            (click)="selectChoice('copy')"
            class="w-full text-left px-6 py-6 bg-white border-3 border-slate-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
          >
            <div class="flex items-start gap-4">
              <div
                class="w-12 h-12 rounded-lg bg-green-100 border-2 border-green-600 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200"
              >
                <svg
                  class="w-6 h-6 text-green-700"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                  ></path>
                  <path
                    d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z"
                  ></path>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-lg font-black text-slate-900">Copy Existing</p>
                <p class="text-sm text-slate-600 mt-1">
                  Duplicate one of your profiles as a starting point
                </p>
              </div>
              <div
                class="text-green-600 font-black text-2xl group-hover:translate-x-1 transition-transform"
              >
                →
              </div>
            </div>
          </button>

          <!-- Copy Selection List (shown when copy is selected) -->
          <div
            *ngIf="showCopySelection()"
            class="pt-4 border-t-2 border-slate-200"
          >
            <p
              class="text-xs font-black text-slate-700 uppercase tracking-widest mb-3"
            >
              Select Profile to Copy
            </p>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <button
                *ngFor="let cover of existingCovers"
                (click)="selectChoice('copy', cover.id)"
                class="w-full text-left px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-lg hover:bg-slate-100 hover:border-green-500 transition-all duration-200"
              >
                <p class="font-bold text-slate-900 text-sm">
                  {{ cover.executiveSummary || 'Untitled' }}
                </p>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{
                    cover.industries.slice(0, 2).join(', ') || 'No industries'
                  }}
                </p>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="px-8 py-4 border-t-4 border-slate-200 bg-slate-50 rounded-b-xl flex gap-3 justify-end"
        >
          <button
            (click)="cancel.emit()"
            class="px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-200 active:bg-slate-300 transition-all duration-200 text-sm"
          >
            Cancel
          </button>
          <button
            *ngIf="!showCopySelection()"
            (click)="cancel.emit()"
            class="px-5 py-2.5 bg-teal-600 text-white font-bold rounded-lg border-3 border-teal-700 hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 text-sm uppercase tracking-wide"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>

    <!-- Global Styles for Animation -->
    <style>
      @keyframes fadeInScale {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .animate-fadeInScale {
        animation: fadeInScale 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    </style>
  `,
})
export class CreateCoverModalComponent {
  @Input() existingCovers: FundingApplicationCoverInformation[] = [];

  @Output() choiceMade = new EventEmitter<CreateCoverChoice>();
  @Output() cancel = new EventEmitter<void>();

  private selectedAction = signal<'fresh' | 'copy' | null>(null);

  readonly showCopySelection = () => this.selectedAction() === 'copy';

  selectChoice(action: 'fresh' | 'copy', coverId?: string): void {
    if (action === 'fresh') {
      // Emit immediately for fresh
      this.choiceMade.emit({ action: 'fresh' });
    } else if (action === 'copy') {
      if (coverId) {
        // Emit with coverId for copy
        this.choiceMade.emit({ action: 'copy', coverId });
      } else {
        // Show copy selection list
        this.selectedAction.set('copy');
      }
    }
  }
}
