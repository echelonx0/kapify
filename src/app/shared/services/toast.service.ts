import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  /**
   * Show a success toast
   */
  success(message: string, duration: number = 2000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Show an error toast
   */
  error(message: string, duration: number = 3000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Show an info toast
   */
  info(message: string, duration: number = 2000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Show a toast with custom type and duration
   */
  private show(message: string, type: Toast['type'], duration: number): void {
    const id = `toast-${Date.now()}`;
    const toast: Toast = { id, message, type, duration };

    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, toast]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  /**
   * Remove a toast by ID
   */
  remove(id: string): void {
    const current = this.toastsSubject.value;
    this.toastsSubject.next(current.filter((t) => t.id !== id));
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.toastsSubject.next([]);
  }
}
