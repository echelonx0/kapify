import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
  OnInit,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  LucideAngularModule,
  Save,
  Check,
  AlertCircle,
  LogOut,
  Download,
  Trash2,
} from 'lucide-angular';
import { AccountService } from 'src/app/core/dashboard/services/account.service';

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
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './account.component.html',
  styles: [
    `
      :host {
        display: block;
      }

      input:focus,
      select:focus,
      textarea:focus {
        outline: none;
      }

      /* Focus ring animation */
      input:focus,
      select:focus,
      textarea:focus {
        animation: focusPulse 0.2s ease-out;
      }

      @keyframes focusPulse {
        from {
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.1);
        }
        to {
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
      }

      /* Smooth transitions */
      input,
      select,
      textarea {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
    `,
  ],
})
export class AccountComponent implements OnInit {
  @Input() accountData: AccountData | null = null;
  @Input() isLoading = false;
  @Output() accountUpdated = new EventEmitter<AccountData>();
  @Output() logout = new EventEmitter<void>();

  private accountService = inject(AccountService);
  private fb = inject(FormBuilder);

  // Icons
  SaveIcon = Save;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;
  LogOutIcon = LogOut;
  DownloadIcon = Download;
  TrashIcon = Trash2;

  // Form
  accountForm!: FormGroup;

  // State
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  lastSaved = signal<Date | null>(null);
  initialFormValue: any = null;

  constructor() {
    effect(() => {
      const date = this.accountService.lastSaved();
      this.lastSaved.set(date);
    });
  }

  ngOnInit() {
    this.initializeForm();
    this.populateForm();
  }

  private initializeForm() {
    this.accountForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(255),
        ],
      ],
      jobTitle: ['', [Validators.maxLength(255)]],
      phone: ['', [Validators.maxLength(20)]],
      emailNotifications: [true],
      marketingCommunications: [false],
    });

    this.accountForm.valueChanges.subscribe(() => {
      this.error.set(null);
    });
  }

  private populateForm() {
    if (!this.accountData) return;

    const formValue = {
      email: this.accountData.email || '',
      fullName: this.accountData.fullName || '',
      jobTitle: this.accountData.jobTitle || '',
      phone: this.accountData.phone || '',
      emailNotifications: this.accountData.emailNotifications ?? true,
      marketingCommunications:
        this.accountData.marketingCommunications ?? false,
    };

    this.accountForm.patchValue(formValue);
    this.initialFormValue = { ...formValue };
  }

  hasUnsavedChanges(): boolean {
    if (!this.initialFormValue) return false;
    return (
      JSON.stringify(this.accountForm.value) !==
      JSON.stringify(this.initialFormValue)
    );
  }

  formatLastSaved(date: Date | null): string {
    if (!date) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }

  onSave() {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    const formValue = this.accountForm.value;
    const updates = {
      fullName: formValue.fullName?.trim(),
      jobTitle: formValue.jobTitle?.trim(),
      phone: formValue.phone?.trim(),
      emailNotifications: formValue.emailNotifications,
      marketingCommunications: formValue.marketingCommunications,
    };

    // Remove empty strings
    Object.keys(updates).forEach((key) => {
      if (
        typeof updates[key as keyof typeof updates] === 'string' &&
        updates[key as keyof typeof updates] === ''
      ) {
        delete updates[key as keyof typeof updates];
      }
    });

    this.accountService.updateAccount(updates).subscribe({
      next: (updatedAccount) => {
        this.accountUpdated.emit(updatedAccount);
        this.initialFormValue = { ...this.accountForm.value };
        this.successMessage.set('Account updated successfully');
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        console.error('Update failed:', error);
        this.error.set(error.message || 'Failed to save changes');
      },
    });
  }

  onReset() {
    if (this.initialFormValue) {
      this.accountForm.patchValue(this.initialFormValue);
    }
    this.error.set(null);
  }

  logoutAllDevices() {
    if (!confirm('Are you sure? You will be logged out from all devices.')) {
      return;
    }

    this.accountService.logoutAllDevices().subscribe({
      next: () => {
        this.successMessage.set('Logged out from all devices');
        setTimeout(() => this.logout.emit(), 1000);
      },
      error: (error) => {
        console.error('Logout failed:', error);
        this.error.set(error.message || 'Failed to logout from all devices');
      },
    });
  }

  downloadData() {
    this.accountService.downloadAccountData().subscribe({
      next: (blob) => {
        // Trigger download
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
        console.error('Download failed:', error);
        this.error.set(error.message || 'Failed to download data');
      },
    });
  }

  openDeleteModal() {
    if (
      !confirm(
        'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted.'
      )
    ) {
      return;
    }

    const confirmText = prompt(
      'Type "DELETE MY ACCOUNT" to confirm permanent deletion:'
    );
    if (confirmText?.toUpperCase() === 'DELETE MY ACCOUNT') {
      this.deleteAccount();
    }
  }

  private deleteAccount() {
    this.accountService.deleteAccount().subscribe({
      next: () => {
        this.successMessage.set('Account deleted successfully');
        setTimeout(() => this.logout.emit(), 2000);
      },
      error: (error) => {
        console.error('Delete failed:', error);
        this.error.set(error.message || 'Failed to delete account');
      },
    });
  }
}
