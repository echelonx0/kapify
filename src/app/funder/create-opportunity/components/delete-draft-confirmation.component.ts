import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  AlertCircle,
  Trash2,
  X,
  RefreshCw,
} from 'lucide-angular';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-delete-draft-confirmation-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  animations: [
    trigger('modalEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate(
          '150ms ease-in',
          style({ opacity: 0, transform: 'scale(0.95)' })
        ),
      ]),
    ]),
  ],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      (click)="onCancel()"
    >
      <!-- Modal Container -->
      <div
        class="bg-white rounded-2xl border-3 border-red-400 shadow-lg max-w-md w-full"
        [@modalEnter]
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header -->
        <div
          class="px-6 py-4 border-b-3 border-red-400 bg-red-50 flex items-center gap-3"
        >
          <div
            class="w-10 h-10 rounded-lg bg-red-100 border-2 border-red-600 flex items-center justify-center flex-shrink-0"
          >
            <lucide-angular
              [img]="AlertCircleIcon"
              [size]="20"
              class="text-red-700"
            ></lucide-angular>
          </div>
          <div class="flex-1">
            <h2
              class="text-lg font-black text-red-900 uppercase tracking-tight"
            >
              Delete Draft?
            </h2>
          </div>
          <button
            (click)="onCancel()"
            class="flex-shrink-0 p-1 text-red-600 hover:bg-red-100 active:bg-red-200 rounded-lg transition-colors duration-200"
            title="Close"
          >
            <lucide-angular [img]="XIcon" [size]="20"></lucide-angular>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="px-6 py-6">
          <p class="text-sm text-slate-700 mb-4">
            Are you sure you want to delete <strong>{{ draftTitle }}</strong
            >?
          </p>

          <div class="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-6">
            <p
              class="text-xs font-bold text-red-900 uppercase tracking-wide mb-2"
            >
              ⚠️ This action cannot be undone
            </p>
            <ul class="text-xs text-red-700 space-y-1">
              <li class="flex items-center gap-2">
                <span class="w-1 h-1 bg-red-600 rounded-full"></span>
                Draft will be permanently deleted from all locations
              </li>
              <li class="flex items-center gap-2">
                <span class="w-1 h-1 bg-red-600 rounded-full"></span>
                This includes cloud storage and local backup
              </li>
              <li class="flex items-center gap-2">
                <span class="w-1 h-1 bg-red-600 rounded-full"></span>
                You will be redirected to your dashboard
              </li>
            </ul>
          </div>

          <p class="text-xs text-slate-600">
            If you want to keep this draft, click <strong>Cancel</strong> below.
          </p>
        </div>

        <!-- Modal Actions -->
        <div
          class="px-6 py-4 border-t-3 border-slate-200 bg-slate-50 flex gap-3 justify-between"
        >
          <button
            (click)="onCancel()"
            [disabled]="isDeleting"
            class="flex-1 px-4 py-2.5 text-sm font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg uppercase tracking-wide transition-colors duration-200"
          >
            Cancel
          </button>

          <button
            (click)="onConfirm()"
            [disabled]="isDeleting"
            class="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg uppercase tracking-wide transition-colors duration-200 flex items-center justify-center gap-2"
          >
            @if (isDeleting) {
            <lucide-angular
              [img]="RefreshCwIcon"
              [size]="16"
              class="animate-spin"
            ></lucide-angular>
            <span>Deleting...</span>
            } @else {
            <lucide-angular [img]="Trash2Icon" [size]="16"></lucide-angular>
            <span>Delete Draft</span>
            }
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class DeleteDraftConfirmationModalComponent {
  @Input() draftTitle: string = 'Draft';
  @Input() isDeleting: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  // Icons
  AlertCircleIcon = AlertCircle;
  Trash2Icon = Trash2;
  XIcon = X;
  RefreshCwIcon = RefreshCw;

  onConfirm(): void {
    if (!this.isDeleting) {
      this.confirm.emit();
    }
  }

  onCancel(): void {
    if (!this.isDeleting) {
      this.cancel.emit();
    }
  }
}
