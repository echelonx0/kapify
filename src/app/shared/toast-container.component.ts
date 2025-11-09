import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import {
  LucideAngularModule,
  CheckCircle,
  AlertCircle,
  Info,
  X,
} from 'lucide-angular';
import { ToastService, Toast } from './services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none"
    >
      @for (toast of toasts; track toast.id) {
      <div
        [@slideIn]
        [class]="'toast toast-' + toast.type"
        class="flex items-start gap-3 px-4 py-3 rounded-xl shadow-md border pointer-events-auto"
      >
        <!-- Icon -->
        <div class="flex-shrink-0 mt-0.5">
          @switch (toast.type) { @case ('success') {
          <lucide-icon
            [img]="CheckCircleIcon"
            [size]="18"
            class="text-green-600"
          />
          } @case ('error') {
          <lucide-icon
            [img]="AlertCircleIcon"
            [size]="18"
            class="text-red-600"
          />
          } @case ('info') {
          <lucide-icon [img]="InfoIcon" [size]="18" class="text-blue-600" />
          } }
        </div>

        <!-- Message -->
        <p class="text-sm font-medium flex-1 leading-tight">
          {{ toast.message }}
        </p>

        <!-- Close Button -->
        <button
          (click)="removeToast(toast.id)"
          class="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
          [attr.aria-label]="'Close notification'"
        >
          <lucide-icon [img]="XIcon" [size]="16" />
        </button>
      </div>
      }
    </div>
  `,
  styles: [
    `
      .toast {
        &.toast-success {
          @apply bg-green-50 border-green-200/50 text-green-900;
        }

        &.toast-error {
          @apply bg-red-50 border-red-200/50 text-red-900;
        }

        &.toast-info {
          @apply bg-blue-50 border-blue-200/50 text-blue-900;
        }
      }
    `,
  ],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(400px)', opacity: 0 }),
        animate(
          '300ms ease-out',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        animate(
          '300ms ease-in',
          style({ transform: 'translateX(400px)', opacity: 0 })
        ),
      ]),
    ]),
  ],
})
export class ToastContainerComponent implements OnInit {
  private toastService = inject(ToastService);

  // Icons
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  InfoIcon = Info;
  XIcon = X;

  toasts: Toast[] = [];

  ngOnInit(): void {
    this.toastService.toasts$.subscribe((toasts) => {
      this.toasts = toasts;
    });
  }

  removeToast(id: string): void {
    this.toastService.remove(id);
  }
}
