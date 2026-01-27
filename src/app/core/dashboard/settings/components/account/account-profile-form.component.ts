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
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { LucideAngularModule, Save, AlertCircle, Check } from 'lucide-angular';
import { AccountService } from '../../../services/account.service';

interface AccountData {
  email: string;
  fullName: string;
  jobTitle?: string;
  phone?: string;
  emailNotifications: boolean;
  marketingCommunications: boolean;
}

@Component({
  selector: 'app-account-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div
      class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-4"
    >
      <!-- Header -->
      <div class="px-8 py-6 border-b border-slate-200 bg-slate-50/50">
        <h3 class="text-xl font-bold text-slate-900">Account Settings</h3>
        <p class="text-sm text-slate-600 mt-1">
          Manage your profile information and notification preferences
        </p>
      </div>

      <!-- Form -->
      <form [formGroup]="profileForm" (ngSubmit)="onSave()" class="p-8">
        <!-- Preferences Section -->
        <div class="space-y-4 py-6">
          <h4 class="text-sm font-semibold text-slate-900">Preferences</h4>

          <!-- Email Notifications -->
          <div
            class="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div>
              <p class="text-sm font-medium text-slate-900">
                Email Notifications
              </p>
              <p class="text-xs text-slate-600 mt-0.5">
                Receive updates about account activity
              </p>
            </div>
            <input
              type="checkbox"
              formControlName="emailNotifications"
              class="w-5 h-5 rounded border-slate-300 text-teal-500 focus:ring-teal-500 cursor-pointer"
            />
          </div>

          <!-- Marketing Communications -->
          <div
            class="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div>
              <p class="text-sm font-medium text-slate-900">
                Marketing Communications
              </p>
              <p class="text-xs text-slate-600 mt-0.5">
                Receive product updates and news
              </p>
            </div>
            <input
              type="checkbox"
              formControlName="marketingCommunications"
              class="w-5 h-5 rounded border-slate-300 text-teal-500 focus:ring-teal-500 cursor-pointer"
            />
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-between pt-6 border-t border-slate-200"
        >
          <div class="text-sm">
            @if (lastSaved()) {
            <div class="flex items-center gap-1.5 text-green-600 font-medium">
              <lucide-icon [img]="CheckIcon" [size]="16" />
              Saved {{ formatLastSaved(lastSaved()) }}
            </div>
            } @else if (hasUnsavedChanges()) {
            <div class="flex items-center gap-1.5 text-amber-600 font-medium">
              <lucide-icon [img]="AlertCircleIcon" [size]="16" />
              You have unsaved changes
            </div>
            }
          </div>

          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="onReset()"
              [disabled]="isLoading || !hasUnsavedChanges()"
              class="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>

            <button
              type="submit"
              [disabled]="profileForm.invalid || isLoading"
              class="px-4 py-2.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 active:bg-teal-700 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              @if (isLoading) {
              <div
                class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
              ></div>
              <span>Saving...</span>
              } @else {
              <lucide-icon [img]="SaveIcon" [size]="16" />
              <span>Save Changes</span>
              }
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class AccountProfileFormComponent implements OnInit {
  @Input() accountData: AccountData | null = null;
  @Input() isLoading = false;
  @Output() accountUpdated = new EventEmitter<AccountData>();

  private accountService = inject(AccountService);
  private fb = inject(FormBuilder);

  // Icons
  SaveIcon = Save;
  AlertCircleIcon = AlertCircle;
  CheckIcon = Check;

  // State
  profileForm!: FormGroup;
  lastSaved = this.accountService.lastSaved;
  initialFormValue: any = null;

  ngOnInit() {
    this.initializeForm();
    this.populateForm();
  }

  private initializeForm() {
    this.profileForm = this.fb.group({
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
  }

  private populateForm() {
    if (!this.accountData) return;

    const formValue = {
      fullName: this.accountData.fullName || '',
      jobTitle: this.accountData.jobTitle || '',
      phone: this.accountData.phone || '',
      emailNotifications: this.accountData.emailNotifications ?? true,
      marketingCommunications:
        this.accountData.marketingCommunications ?? false,
    };

    this.profileForm.patchValue(formValue);
    this.initialFormValue = { ...formValue };
  }

  hasUnsavedChanges(): boolean {
    if (!this.initialFormValue) return false;
    return (
      JSON.stringify(this.profileForm.value) !==
      JSON.stringify(this.initialFormValue)
    );
  }

  getError(field: string): string | null {
    const control = this.profileForm.get(field);
    if (!control || !control.errors || !control.touched) return null;

    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength'])
      return `Minimum ${control.errors['minlength'].requiredLength} characters`;
    if (control.errors['maxlength'])
      return `Maximum ${control.errors['maxlength'].requiredLength} characters`;

    return 'Invalid input';
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
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const formValue = this.profileForm.value;
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
      next: () => {
        this.initialFormValue = { ...this.profileForm.value };
        this.accountUpdated.emit({
          ...this.accountData!,
          ...updates,
        });
      },
      error: (error) => {
        console.error('Update failed:', error);
      },
    });
  }

  onReset() {
    if (this.initialFormValue) {
      this.profileForm.patchValue(this.initialFormValue);
    }
  }
}
