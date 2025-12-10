import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div class="flex flex-col">
        @for (toast of toastService.toasts(); track toast.id) {
        <div
          [class]="getToastClasses(toast.type)"
          [attr.data-toast-id]="toast.id"
          class="pointer-events-auto w-full border-b animate-slide-down"
        >
          <div
            class="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-3"
          >
            <!-- Icon -->
            <div [class]="getIconClasses(toast.type)">
              @switch (toast.type) { @case ('success') {
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              } @case ('error') {
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              } @case ('warning') {
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              } @case ('info') {
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              } }
            </div>

            <!-- Message -->
            <span class="flex-1 text-sm font-medium">
              {{ toast.message }}
            </span>

            <!-- Dismiss Button -->
            <button
              (click)="toastService.dismiss(toast.id)"
              class="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors duration-200 p-1.5 -mr-2"
              [attr.aria-label]="'Dismiss ' + toast.type + ' notification'"
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
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        }
      </div>
    </div>
  `,
  styles: `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-100%);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    :host {
      --animate-duration: 300ms;
    }

    :global(.animate-slide-down) {
      animation: slideDown var(--animate-duration) ease-out;
    }
  `,
})
export class ToastComponent {
  protected toastService = inject(ToastService);

  getToastClasses(type: string): string {
    const baseClasses = 'flex items-center border transition-all duration-200';

    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-200/50 text-green-900`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-200/50 text-red-900`;
      case 'warning':
        return `${baseClasses} bg-amber-50 border-amber-200/50 text-amber-900`;
      case 'info':
      default:
        return `${baseClasses} bg-blue-50 border-blue-200/50 text-blue-900`;
    }
  }

  getIconClasses(type: string): string {
    const baseClasses =
      'flex-shrink-0 w-5 h-5 flex items-center justify-center';

    switch (type) {
      case 'success':
        return `${baseClasses} text-green-600`;
      case 'error':
        return `${baseClasses} text-red-600`;
      case 'warning':
        return `${baseClasses} text-amber-600`;
      case 'info':
      default:
        return `${baseClasses} text-blue-600`;
    }
  }
}
