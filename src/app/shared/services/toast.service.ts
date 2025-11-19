import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  autoDismiss: boolean;
  duration: number;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastIdCounter = 0;
  private readonly MAX_TOASTS = 3;
  private dismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

  toasts = signal<Toast[]>([]);

  show(options: {
    message: string;
    type?: ToastType;
    autoDismiss?: boolean;
    duration?: number;
  }): string {
    const {
      message,
      type = 'info',
      autoDismiss = true,
      duration = 4000,
    } = options;

    const id = `toast-${++this.toastIdCounter}`;

    const toast: Toast = {
      id,
      message,
      type,
      autoDismiss,
      duration,
    };

    // Add toast to queue
    const currentToasts = this.toasts();
    this.toasts.set([...currentToasts, toast]);

    // Remove oldest toast if exceeding max
    if (currentToasts.length + 1 > this.MAX_TOASTS) {
      const oldestId = currentToasts[0].id;
      this.dismiss(oldestId);
    }

    // Auto-dismiss if enabled
    if (autoDismiss) {
      const timer = setTimeout(() => {
        this.dismiss(id);
      }, duration);

      this.dismissTimers.set(id, timer);
    }

    return id;
  }

  dismiss(id: string): void {
    // Cancel timer if exists
    const timer = this.dismissTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }

    // Remove from queue
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  dismissAll(): void {
    // Clear all timers
    this.dismissTimers.forEach((timer) => clearTimeout(timer));
    this.dismissTimers.clear();

    // Clear toasts
    this.toasts.set([]);
  }

  // Convenience methods
  success(message: string, duration?: number): string {
    return this.show({ message, type: 'success', autoDismiss: true, duration });
  }

  error(message: string, duration?: number): string {
    return this.show({
      message,
      type: 'error',
      autoDismiss: false,
      duration,
    });
  }

  warning(message: string, duration?: number): string {
    return this.show({ message, type: 'warning', autoDismiss: true, duration });
  }

  info(message: string, duration?: number): string {
    return this.show({ message, type: 'info', autoDismiss: true, duration });
  }
}
