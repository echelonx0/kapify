import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  LogOut,
  Download,
  Trash2,
} from 'lucide-angular';

@Component({
  selector: 'app-account-actions',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <!-- Header -->
      <div class="px-8 py-6 border-b border-slate-200 bg-slate-50/50">
        <h3 class="text-xl font-bold text-slate-900">Account Actions</h3>
        <p class="text-sm text-slate-600 mt-1">
          Manage your account access and data
        </p>
      </div>

      <!-- Actions -->
      <div class="p-8 space-y-4">
        <!-- Logout All Devices -->
        <div
          class="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
        >
          <div>
            <p class="text-sm font-medium text-slate-900">Logout All Devices</p>
            <p class="text-xs text-slate-600 mt-0.5">
              Sign out from all active sessions
            </p>
          </div>
          <button
            type="button"
            (click)="onLogoutAllClicked()"
            [disabled]="isLoading"
            class="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <lucide-icon [img]="LogOutIcon" [size]="16" />
            <span>Logout</span>
          </button>
        </div>

        <!-- Download Data -->
        <div
          class="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
        >
          <div>
            <p class="text-sm font-medium text-slate-900">Download Your Data</p>
            <p class="text-xs text-slate-600 mt-0.5">
              Export all your account data as JSON
            </p>
          </div>
          <button
            type="button"
            (click)="onDownloadDataClicked()"
            [disabled]="isLoading"
            class="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <lucide-icon [img]="DownloadIcon" [size]="16" />
            <span>Download</span>
          </button>
        </div>

        <!-- Delete Account -->
        <div
          class="flex items-center justify-between p-4 rounded-lg hover:bg-red-50 transition-colors border border-red-200"
        >
          <div>
            <p class="text-sm font-medium text-red-900">Delete Account</p>
            <p class="text-xs text-red-700 mt-0.5">
              Permanently delete your account and all data
            </p>
          </div>
          <button
            type="button"
            (click)="onDeleteAccountClicked()"
            [disabled]="isLoading"
            class="px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 bg-red-50 hover:bg-red-100"
          >
            <lucide-icon [img]="TrashIcon" [size]="16" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class AccountActionsComponent {
  @Input() isLoading = false;
  @Output() logoutAllClicked = new EventEmitter<void>();
  @Output() downloadDataClicked = new EventEmitter<void>();
  @Output() deleteAccountClicked = new EventEmitter<void>();

  // Icons
  LogOutIcon = LogOut;
  DownloadIcon = Download;
  TrashIcon = Trash2;

  onLogoutAllClicked() {
    this.logoutAllClicked.emit();
  }

  onDownloadDataClicked() {
    this.downloadDataClicked.emit();
  }

  onDeleteAccountClicked() {
    this.deleteAccountClicked.emit();
  }
}
