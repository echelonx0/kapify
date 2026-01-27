import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertCircle, LogOut, X } from 'lucide-angular';
import { AuditLogService } from 'src/app/core/services/audit-log.service';
import { AccountService } from '../../../services/account.service';

@Component({
  selector: 'app-logout-all-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Modal Backdrop -->
    <div
      class="fixed inset-0 bg-black/25 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      (click)="onCancel()"
    >
      <!-- Modal Content -->
      <div
        class="bg-white rounded-2xl border border-slate-200 max-w-sm w-full shadow-lg"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="px-6 py-4 border-b border-slate-200 bg-amber-50 flex items-start justify-between"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0"
            >
              <lucide-icon
                [img]="AlertCircleIcon"
                [size]="20"
                class="text-amber-600"
              />
            </div>
            <h3 class="text-base font-bold text-slate-900">
              Logout All Devices?
            </h3>
          </div>
          <button
            type="button"
            (click)="onCancel()"
            [disabled]="isLoggingOut()"
            class="text-slate-500 hover:text-slate-700 disabled:opacity-50"
          >
            <lucide-icon [img]="XIcon" [size]="20" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-4">
          <p class="text-sm text-slate-600">
            You will be signed out from all devices and active sessions. You'll
            need to log in again.
          </p>

          <div
            class="p-3 bg-amber-50 border border-amber-200/50 rounded-lg flex gap-2"
          >
            <div class="flex-shrink-0 mt-0.5">
              <lucide-icon
                [img]="AlertCircleIcon"
                [size]="16"
                class="text-amber-600"
              />
            </div>
            <p class="text-xs text-amber-700">
              This will log you out of all active sessions immediately.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            (click)="onCancel()"
            [disabled]="isLoggingOut()"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="onConfirmLogout()"
            [disabled]="isLoggingOut()"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            @if (isLoggingOut()) {
            <div
              class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <span>Logging out...</span>
            } @else {
            <lucide-icon [img]="LogOutIcon" [size]="16" />
            <span>Logout All Devices</span>
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class LogoutAllModalComponent {
  @Output() cancel = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<{
    success: boolean;
    message: string;
  }>();

  private accountService = inject(AccountService);
  private auditLog = inject(AuditLogService);

  // Icons
  AlertCircleIcon = AlertCircle;
  LogOutIcon = LogOut;
  XIcon = X;

  // State
  isLoggingOut = signal(false);

  onCancel() {
    if (!this.isLoggingOut()) {
      this.cancel.emit();
    }
  }

  onConfirmLogout() {
    this.isLoggingOut.set(true);

    this.accountService.logoutAllDevices().subscribe({
      next: async () => {
        await this.auditLog.logLogoutAll();
        this.confirmed.emit({
          success: true,
          message: 'Logged out from all devices',
        });
      },
      error: (error) => {
        this.isLoggingOut.set(false);
        this.confirmed.emit({
          success: false,
          message: error?.message || 'Logout failed',
        });
      },
    });
  }
}
