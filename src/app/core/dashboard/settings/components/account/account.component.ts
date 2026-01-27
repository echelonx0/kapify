import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { LucideAngularModule, Check, AlertCircle } from 'lucide-angular';
import { AccountService } from '../../../services/account.service';
import { AccountDeletionCompleteComponent } from './account-deletion-complete.component';
import { DeleteAccountModalComponent } from './delete-account-modal.component';
import { LogoutAllModalComponent } from './logout-all-modal.component';
import { AccountActionsComponent } from './account-actions.component';
import { AccountProfileFormComponent } from './account-profile-form.component';

interface AccountData {
  email: string;
  fullName: string;
  jobTitle?: string;
  phone?: string;
  emailNotifications: boolean;
  marketingCommunications: boolean;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LucideAngularModule,
    DeleteAccountModalComponent,
    LogoutAllModalComponent,
    AccountDeletionCompleteComponent,
    AccountActionsComponent,
    AccountProfileFormComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Profile Settings Card -->
      <app-account-profile-form
        [accountData]="accountData"
        [isLoading]="accountService.isSaving()"
        (accountUpdated)="onAccountUpdated($event)"
      />

      <!-- Account Actions Card -->
      <app-account-actions
        [isLoading]="accountService.isSaving()"
        (logoutAllClicked)="showLogoutModal = true"
        (downloadDataClicked)="onDownloadData()"
        (deleteAccountClicked)="showDeleteModal = true"
      />

      <!-- Error Alert -->
      @if (error()) {
      <div
        class="px-4 py-3 bg-red-50 border border-red-200/50 rounded-xl flex items-center gap-3"
      >
        <lucide-icon
          [img]="AlertCircleIcon"
          [size]="18"
          class="text-red-600 flex-shrink-0"
        />
        <p class="text-sm font-medium text-red-700">{{ error() }}</p>
      </div>
      }

      <!-- Success Alert -->
      @if (successMessage()) {
      <div
        class="px-4 py-3 bg-green-50 border border-green-200/50 rounded-xl flex items-center gap-3"
      >
        <lucide-icon
          [img]="CheckIcon"
          [size]="18"
          class="text-green-600 flex-shrink-0"
        />
        <p class="text-sm font-medium text-green-700">{{ successMessage() }}</p>
      </div>
      }
    </div>

    <!-- Delete Account Modal -->
    @if (showDeleteModal) {
    <app-delete-account-modal
      (cancel)="showDeleteModal = false"
      (confirmed)="onDeleteConfirmed($event)"
    />
    }

    <!-- Logout All Modal -->
    @if (showLogoutModal) {
    <app-logout-all-modal
      (cancel)="showLogoutModal = false"
      (confirmed)="onLogoutConfirmed($event)"
    />
    }

    <!-- Deletion Complete Screen -->
    @if (showDeletionComplete) {
    <app-account-deletion-complete
      (redirectTriggered)="onRedirectAfterDelete()"
    />
    }
  `,
})
export class AccountComponent implements OnInit {
  @Input() accountData: AccountData | null = null;
  @Output() accountUpdated = new EventEmitter<AccountData>();
  @Output() logout = new EventEmitter<void>();

  accountService = inject(AccountService);
  private fb = inject(FormBuilder);

  // Icons
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;

  // State
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  showDeleteModal = false;
  showLogoutModal = false;
  showDeletionComplete = false;

  ngOnInit() {
    // Form initialization happens in sub-component
  }

  onAccountUpdated(data: AccountData) {
    this.accountUpdated.emit(data);
    this.successMessage.set('Account updated successfully');
    setTimeout(() => this.successMessage.set(null), 3000);
  }

  onDownloadData() {
    this.accountService.downloadAccountData().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `account-data-${
          new Date().toISOString().split('T')[0]
        }.json`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.successMessage.set('Data downloaded successfully');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        this.error.set(error?.message || 'Failed to download data');
      },
    });
  }

  onDeleteConfirmed(result: { success: boolean; message: string }) {
    this.showDeleteModal = false;

    if (result.success) {
      this.successMessage.set(result.message);
      // Show deletion complete screen
      setTimeout(() => {
        this.showDeletionComplete = true;
      }, 500);
    } else {
      this.error.set(result.message);
    }
  }

  onLogoutConfirmed(result: { success: boolean; message: string }) {
    this.showLogoutModal = false;

    if (result.success) {
      this.successMessage.set(result.message);
      setTimeout(() => {
        this.logout.emit();
      }, 1000);
    } else {
      this.error.set(result.message);
    }
  }

  onRedirectAfterDelete() {
    // AuthService will handle the redirect after signOut
    this.logout.emit();
  }
}
