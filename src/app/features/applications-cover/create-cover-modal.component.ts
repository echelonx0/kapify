import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CreateCoverChoice {
  action: 'fresh';
}

/**
 * CreateCoverModalComponent
 *
 * Simplified neo-brutalist confirmation modal.
 * User confirms they want to create a new funding profile.
 * No copy/duplicate — focus on fresh start only.
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
        class="bg-white rounded-2xl border-4 border-slate-300 shadow-2xl max-w-md w-full animate-fadeInScale"
      >
        <!-- Header -->
        <div class="px-8 py-8 border-b-4 border-slate-200">
          <h2 class="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Create Funding Request
          </h2>
          <p class="text-sm text-slate-600 font-semibold">
            Ready to get started?
          </p>
        </div>

        <!-- Content -->
        <div class="px-8 py-8">
          <div class="space-y-4">
            <div class="flex items-start gap-4">
              <div
                class="w-12 h-12 rounded-lg bg-teal-100 border-2 border-teal-600 flex items-center justify-center flex-shrink-0"
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
              <div class="flex-1">
                <p class="text-lg font-black text-slate-900">Start Fresh</p>
                <p class="text-sm text-slate-600 mt-2">
                  Create a blank funding request. You'll fill in your details
                  and reuse it for every opportunity you apply to.
                </p>
              </div>
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
            (click)="confirm()"
            class="px-5 py-2.5 bg-teal-600 text-white font-bold rounded-lg border-3 border-teal-700 hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 text-sm uppercase tracking-wide"
          >
            Create Request
          </button>
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
    </div>
  `,
})
export class CreateCoverModalComponent {
  @Output() choiceMade = new EventEmitter<CreateCoverChoice>();
  @Output() cancel = new EventEmitter<void>();

  confirm(): void {
    this.choiceMade.emit({ action: 'fresh' });
  }
}
