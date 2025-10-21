import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Trash2, Copy, AlertCircle, CheckCircle, X } from 'lucide-angular';

export type ActionType = 'delete' | 'duplicate';

export interface ModalData {
  actionType: ActionType;
  opportunityTitle: string;
  hasApplications?: boolean;
  applicationCount?: number;
}

@Component({
  selector: 'app-opportunity-action-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center" (keydown.escape)="cancel()">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-black/50 cursor-pointer" (click)="cancel()"></div>
      
      <!-- Modal -->
      <div class="relative bg-white rounded-lg shadow-lg max-w-[420px] w-[90vw] overflow-hidden animate-slideUp">
        
        <!-- Close button -->
        <button
          type="button"
          class="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors z-10"
          (click)="cancel()"
          [disabled]="isLoading()"
          aria-label="Close modal"
        >
          <lucide-icon [img]="XIcon" size="20" class="text-gray-500" />
        </button>

        <!-- Header -->
        <div class="px-6 py-8 border-b border-gray-100 text-center pr-12">
          <div [class]="'w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ' + getIconBgClass()">
            <lucide-icon [img]="getIcon()" size="24" [class]="getIconColorClass()" />
          </div>
          <h2 class="text-lg font-semibold text-gray-900 mb-2">{{ getTitle() }}</h2>
          <p class="text-sm text-gray-600 break-words">{{ getSubtitle() }}</p>
        </div>

        <!-- Body -->
        <div class="px-6 py-6">
          <!-- Error State -->
          @if (errorMessage()) {
            <div class="flex gap-3 p-3 rounded-lg bg-red-50 border border-red-100 mb-4">
              <lucide-icon [img]="AlertCircleIcon" size="20" class="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p class="text-sm font-medium text-red-900">Error</p>
                <p class="text-sm text-red-700 mt-1">{{ errorMessage() }}</p>
              </div>
            </div>
          } @else {
            @switch (actionType) {
              @case ('delete') {
                <div class="flex gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100 mb-4">
                  <lucide-icon [img]="AlertCircleIcon" size="20" class="text-amber-600 flex-shrink-0 mt-0.5" />
                  <span class="text-sm text-amber-900">This action cannot be undone.</span>
                </div>

                @if (data().hasApplications && data().applicationCount! > 0) {
                  <div class="flex gap-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <span class="text-sm text-blue-900">
                      <strong>{{ data().applicationCount }} active application(s)</strong> will be archived.
                    </span>
                  </div>
                }
              }
              @case ('duplicate') {
                <div class="flex gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                  <lucide-icon [img]="CheckCircleIcon" size="20" class="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="text-sm font-medium text-green-900">A copy will be created as a draft.</p>
                    <p class="text-sm text-green-700 mt-1">Edit and publish when ready.</p>
                  </div>
                </div>
              }
            }
          }
        </div>

        <!-- Footer -->
        <div class="px-6 py-6 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            type="button"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            (click)="cancel()"
            [disabled]="isLoading()"
          >
            {{ errorMessage() ? 'Close' : 'Cancel' }}
          </button>
          @if (!errorMessage()) {
            <button
              type="button"
              class="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              [class]="getActionButtonClass()"
              (click)="confirm()"
              [disabled]="isLoading()"
            >
              @if (isLoading()) {
                <span class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                Processing...
              } @else {
                {{ getActionButtonText() }}
              }
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-slideUp {
      animation: slideUp 300ms cubic-bezier(0.16, 1, 0.3, 1);
    }
  `]
})
export class OpportunityActionModalComponent {
  data = signal<ModalData>({
    actionType: 'delete',
    opportunityTitle: '',
    hasApplications: false,
    applicationCount: 0
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // Icons
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  Trash2Icon = Trash2;
  CopyIcon = Copy;
  XIcon = X;

  // Callback signals
  onConfirm = signal<(() => void) | null>(null);
  onCancel = signal<(() => void) | null>(null);

  get actionType(): ActionType {
    return this.data().actionType;
  }

  getIcon() {
    return this.actionType === 'delete' ? this.Trash2Icon : this.CopyIcon;
  }

  getIconBgClass(): string {
    return this.actionType === 'delete' ? 'bg-red-50' : 'bg-green-50';
  }

  getIconColorClass(): string {
    return this.actionType === 'delete' ? 'text-red-600' : 'text-green-600';
  }

  getTitle(): string {
    return this.actionType === 'delete' ? 'Delete opportunity?' : 'Duplicate opportunity?';
  }

  getSubtitle(): string {
    return `"${this.data().opportunityTitle}"`;
  }

  getActionButtonText(): string {
    return this.actionType === 'delete' ? 'Delete' : 'Create Copy';
  }

  getActionButtonClass(): string {
    return this.actionType === 'delete'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-green-600 hover:bg-green-700';
  }

  setData(data: ModalData) {
    this.data.set(data);
    this.errorMessage.set(null);
    this.isLoading.set(false);
  }

  setCallbacks(onConfirm: () => void, onCancel: () => void) {
    this.onConfirm.set(onConfirm);
    this.onCancel.set(onCancel);
  }

  confirm() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.onConfirm()?.();
  }

  setError(message: string) {
    this.isLoading.set(false);
    this.errorMessage.set(message);
  }

  cancel() {
    if (!this.isLoading()) {
      this.onCancel()?.();
    }
  }

  close() {
    this.onCancel()?.();
  }
}