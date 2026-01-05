import {
  Component,
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
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import {
  LucideAngularModule,
  Save,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-angular';
import { AccountService } from 'src/app/dashboard/services/account.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './change-password.component.html',
  styles: [
    `
      :host {
        display: block;
      }

      input:focus {
        outline: none;
      }

      /* Focus ring animation */
      input:focus {
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
      input {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* Password strength indicator */
      .strength-bar {
        transition: background-color 0.3s ease-out;
      }
    `,
  ],
})
export class ChangePasswordComponent implements OnInit {
  private accountService = inject(AccountService);
  private fb = inject(FormBuilder);

  // Icons
  SaveIcon = Save;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;
  EyeIcon = Eye;
  EyeOffIcon = EyeOff;

  // Form
  passwordForm!: FormGroup;

  // State
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isLoading = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  passwordStrength = signal<'weak' | 'fair' | 'good' | 'strong'>('weak');

  ngOnInit() {
    this.initializeForm();
  }

  private initializeForm() {
    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', [Validators.required]],
        newPassword: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            this.passwordStrengthValidator.bind(this),
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordsMatchValidator.bind(this),
      }
    );

    // Track password strength
    this.passwordForm.get('newPassword')?.valueChanges.subscribe((value) => {
      this.updatePasswordStrength(value);
    });

    // Clear errors on input
    this.passwordForm.valueChanges.subscribe(() => {
      this.error.set(null);
    });
  }

  private passwordStrengthValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      value
    );

    const valid =
      hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

    return !valid ? { weakPassword: true } : null;
  }

  private passwordsMatchValidator(
    group: AbstractControl
  ): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return newPassword && confirmPassword && newPassword !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  }

  private updatePasswordStrength(password: string) {
    if (!password) {
      this.passwordStrength.set('weak');
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

    if (strength <= 2) this.passwordStrength.set('weak');
    else if (strength === 3) this.passwordStrength.set('fair');
    else if (strength === 4) this.passwordStrength.set('good');
    else this.passwordStrength.set('strong');
  }

  getPasswordStrengthColor(): string {
    const colors = {
      weak: 'bg-red-500',
      fair: 'bg-amber-500',
      good: 'bg-teal-500',
      strong: 'bg-green-500',
    };
    return colors[this.passwordStrength()];
  }

  getPasswordStrengthLabel(): string {
    const labels = {
      weak: 'Weak',
      fair: 'Fair',
      good: 'Good',
      strong: 'Strong',
    };
    return labels[this.passwordStrength()];
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
    switch (field) {
      case 'current':
        this.showCurrentPassword.set(!this.showCurrentPassword());
        break;
      case 'new':
        this.showNewPassword.set(!this.showNewPassword());
        break;
      case 'confirm':
        this.showConfirmPassword.set(!this.showConfirmPassword());
        break;
    }
  }

  onSubmit() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    if (this.passwordForm.hasError('passwordMismatch')) {
      this.error.set('Passwords do not match');
      return;
    }

    this.isLoading.set(true);

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.accountService
      .changePassword(currentPassword, newPassword)
      .subscribe({
        next: () => {
          this.successMessage.set('Password changed successfully');
          this.passwordForm.reset();
          this.passwordStrength.set('weak');
          this.isLoading.set(false);

          setTimeout(() => {
            this.successMessage.set(null);
          }, 3000);
        },
        error: (error) => {
          console.error('Password change failed:', error);
          this.error.set(
            error.message || 'Failed to change password. Please try again.'
          );
          this.isLoading.set(false);
        },
      });
  }

  onCancel() {
    this.passwordForm.reset();
    this.passwordStrength.set('weak');
    this.error.set(null);
  }

  hasError(fieldName: string): boolean {
    const field = this.passwordForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);

    if (!field) return '';

    if (field.hasError('required')) return 'This field is required';
    if (field.hasError('minlength'))
      return `Minimum ${field.getError('minlength').requiredLength} characters required`;
    if (field.hasError('weakPassword'))
      return 'Password must include uppercase, lowercase, number, and special character';

    return '';
  }
}
