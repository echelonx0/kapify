import {
  Component,
  Output,
  EventEmitter,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, AlertTriangle, Trash2, X } from 'lucide-angular';
import { AccountDeleteService } from '../../../services/account-delete.service';

@Component({
  selector: 'app-delete-account-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <!-- Modal Backdrop -->
    <div
      class="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      (click)="onCancel()"
    >
      <!-- Modal Content -->
      <div
        class="bg-white rounded-2xl border border-slate-200 max-w-md w-full shadow-lg"
        (click)="$event.stopPropagation()"
      >
        <!-- Header with warning badge -->
        <div
          class="px-6 py-4 border-b border-slate-200 bg-red-50 flex items-start justify-between"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0"
            >
              <lucide-icon
                [img]="AlertTriangleIcon"
                [size]="20"
                class="text-red-600"
              />
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900">Delete Account</h3>
              <p class="text-xs text-red-700 font-medium mt-0.5">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            type="button"
            (click)="onCancel()"
            [disabled]="isDeleting()"
            class="text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            <lucide-icon [img]="XIcon" [size]="20" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <!-- Warning text -->
          <div class="space-y-2">
            <p class="text-sm text-slate-900 font-medium">
              {{ deleteService.getDeleteWarningData().title }}
            </p>
            <ul class="space-y-1 text-xs text-slate-600">
              @for (item of deleteService.getDeleteWarningData().items; track
              item) {
              <li class="flex gap-2">
                <span class="text-red-600 flex-shrink-0">•</span>
                <span>{{ item }}</span>
              </li>
              }
            </ul>
          </div>

          <!-- Confirmation input -->
          <div class="pt-4 border-t border-slate-200 space-y-2">
            <label class="block text-sm font-semibold text-slate-900">
              Type to confirm
              <span class="text-red-600">*</span>
            </label>
            <input
              type="text"
              [(ngModel)]="confirmationText"
              placeholder="DELETE MY ACCOUNT"
              [disabled]="isDeleting()"
              class="w-full px-4 py-2.5 border border-red-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            />
            <p class="text-xs text-slate-500">This text is case-sensitive</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            (click)="onCancel()"
            [disabled]="isDeleting()"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="onConfirmDelete()"
            [disabled]="!isConfirmationValid() || isDeleting()"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            @if (isDeleting()) {
            <div
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <span>Deleting...</span>
            } @else {
            <lucide-icon [img]="TrashIcon" [size]="16" />
            <span>Delete Permanently</span>
            }
          </button>
        </div>

        <!-- Progress message -->
        @if (deleteProgress()) {
        <div
          class="px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 text-center"
        >
          {{ deleteProgress() }}
        </div>
        }
      </div>
    </div>
  `,
})
export class DeleteAccountModalComponent implements OnInit {
  @Output() cancel = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<{
    success: boolean;
    message: string;
  }>();

  deleteService = inject(AccountDeleteService);

  // Icons
  AlertTriangleIcon = AlertTriangle;
  TrashIcon = Trash2;
  XIcon = X;

  // State
  confirmationText = '';
  isDeleting = this.deleteService.isDeleting;
  deleteProgress = this.deleteService.deleteProgress;

  ngOnInit() {
    // Focus confirmation input
    setTimeout(() => {
      const input = document.querySelector(
        'input[placeholder="DELETE MY ACCOUNT"]'
      ) as HTMLInputElement;
      input?.focus();
    });
  }

  isConfirmationValid(): boolean {
    return this.confirmationText.toUpperCase() === 'DELETE MY ACCOUNT';
  }

  onCancel() {
    if (!this.isDeleting()) {
      this.cancel.emit();
    }
  }

  onConfirmDelete() {
    if (!this.isConfirmationValid()) return;

    this.deleteService.deleteAccount(this.confirmationText).subscribe({
      next: (result) => {
        this.confirmed.emit({
          success: result.success,
          message: result.message,
        });
      },
      error: (error) => {
        this.confirmed.emit({
          success: false,
          message: error?.message || 'Deletion failed',
        });
      },
    });
  }
}
