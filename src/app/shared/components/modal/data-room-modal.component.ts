// src/app/shared/components/modal/data-room-modal.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Sparkles,
} from 'lucide-angular';
import { ActionModalService } from './modal.service';

@Component({
  selector: 'app-data-room-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (modalService.isOpen()) {
    <div
      class="fixed inset-0 z-50 flex items-center justify-center"
      (keydown.escape)="close()"
    >
      <!-- Overlay -->
      <div
        class="absolute inset-0 bg-black/50 cursor-pointer"
        (click)="close()"
      ></div>

      <!-- Modal -->
      <div
        class="relative bg-white rounded-lg shadow-lg max-w-[420px] w-[90vw] overflow-hidden animate-slideUp"
      >
        <!-- Close button -->
        <button
          type="button"
          class="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors z-10"
          (click)="close()"
          [disabled]="modalService.isLoading()"
          aria-label="Close modal"
        >
          <lucide-icon [img]="XIcon" size="20" class="text-gray-500" />
        </button>

        <!-- Header -->
        <div class="px-6 py-8 border-b border-gray-100 text-center pr-12">
          <div
            [class]="
              'w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ' +
              getIconBgClass()
            "
          >
            <lucide-icon
              [img]="getIcon()"
              size="24"
              [class]="getIconColorClass()"
            />
          </div>
          <h2 class="text-lg font-semibold text-gray-900 mb-2">
            {{ modalService.data().title }}
          </h2>
          <p class="text-sm text-gray-600 break-words">
            {{ modalService.data().subtitle }}
          </p>
        </div>

        <!-- Body -->
        @if (modalService.data().errorMessage) {
        <div class="px-6 py-6">
          <div
            class="flex gap-3 p-3 rounded-lg bg-red-50 border border-red-100"
          >
            <lucide-icon
              [img]="AlertCircleIcon"
              size="20"
              class="text-red-600 flex-shrink-0 mt-0.5"
            />
            <div>
              <p class="text-sm font-medium text-red-900">Error</p>
              <p class="text-sm text-red-700 mt-1">
                {{ modalService.data().errorMessage }}
              </p>
            </div>
          </div>
        </div>
        }

        <!-- Footer -->
        <div class="px-6 py-6 border-t border-gray-100 bg-gray-50 flex gap-3">
          @if (modalService.data().showCancel) {
          <button
            type="button"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            (click)="cancel()"
            [disabled]="modalService.isLoading()"
          >
            {{ modalService.data().cancelText || 'Cancel' }}
          </button>
          }

          <button
            type="button"
            class="px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            [class]="getButtonClass()"
            [class.flex-1]="!modalService.data().showCancel"
            (click)="confirm()"
            [disabled]="modalService.isLoading()"
          >
            @if (modalService.isLoading()) {
            <span
              class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            ></span>
            Processing... } @else {
            {{ modalService.data().actionText || 'Got it' }}
            }
          </button>
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
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
    `,
  ],
})
export class DataRoomModalComponent {
  modalService = inject(ActionModalService);

  // Icons
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  InfoIcon = Info;
  SparklesIcon = Sparkles;
  XIcon = X;

  getIcon() {
    const type = this.modalService.actionType();
    switch (type) {
      case 'error':
        return this.AlertCircleIcon;
      case 'success':
        return this.CheckCircleIcon;
      case 'info':
        return this.SparklesIcon;
      case 'warning':
        return this.AlertCircleIcon;
      default:
        return this.InfoIcon;
    }
  }

  getIconBgClass(): string {
    const type = this.modalService.actionType();
    switch (type) {
      case 'error':
        return 'bg-red-50';
      case 'success':
        return 'bg-green-50';
      case 'info':
        return 'bg-blue-50';
      case 'warning':
        return 'bg-amber-50';
      default:
        return 'bg-slate-50';
    }
  }

  getIconColorClass(): string {
    const type = this.modalService.actionType();
    switch (type) {
      case 'error':
        return 'text-red-600';
      case 'success':
        return 'text-green-600';
      case 'info':
        return 'text-blue-600';
      case 'warning':
        return 'text-amber-600';
      default:
        return 'text-slate-600';
    }
  }

  getButtonClass(): string {
    const type = this.modalService.actionType();
    switch (type) {
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700';
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  }

  confirm() {
    this.modalService.confirm();
  }

  cancel() {
    this.modalService.cancel();
  }

  close() {
    this.modalService.cancel();
  }
}
