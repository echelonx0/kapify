import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
} from 'lucide-angular';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { AuthPasswordService } from 'src/app/auth/services/auth-password.service';
import { DatabaseActivityService } from 'src/app/shared/services/database-activity.service';
import { from } from 'rxjs';

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './recover-password.component.html',
  styles: [
    `
      :host {
        display: block;
      }

      input:focus {
        outline: none;
      }

      input {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .strength-bar {
        transition: background-color 0.3s ease-out;
      }
    `,
  ],
})
export class RecoverPasswordComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private supabase = inject(SharedSupabaseService);
  private passwordService = inject(AuthPasswordService);
  private activityService = inject(DatabaseActivityService);
  private fb = inject(FormBuilder);

  // Icons
  AlertCircleIcon = AlertCircle;
  EyeIcon = Eye;
  EyeOffIcon = EyeOff;
  LockIcon = Lock;
  CheckCircleIcon = CheckCircle;

  // Form
  passwordForm!: FormGroup;

  // State
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isLoading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  passwordStrength = signal<'weak' | 'fair' | 'good' | 'strong'>('weak');

  ngOnInit() {
    this.initializeForm();
  }

  /**
   * Initialize the password form
   * Token validation happens on submit via Supabase session
   * Supabase automatically handles the recovery token from URL query params
   */
  private initializeForm(): void {
    this.passwordForm = this.fb.group(
      {
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
      },
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

  /**
   * Validate password strength requirements
   */
  private passwordStrengthValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    const valid = hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
    return !valid ? { weakPassword: true } : null;
  }

  /**
   * Validate passwords match
   */
  private passwordsMatchValidator(
    group: AbstractControl,
  ): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return newPassword && confirmPassword && newPassword !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  }

  /**
   * Update password strength indicator
   */
  private updatePasswordStrength(password: string): void {
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

  /**
   * Get password strength color
   */
  getPasswordStrengthColor(): string {
    const colors = {
      weak: 'bg-red-500',
      fair: 'bg-amber-500',
      good: 'bg-teal-500',
      strong: 'bg-green-500',
    };
    return colors[this.passwordStrength()];
  }

  /**
   * Get password strength label
   */
  getPasswordStrengthLabel(): string {
    const labels = {
      weak: 'Weak',
      fair: 'Fair',
      good: 'Good',
      strong: 'Strong',
    };
    return labels[this.passwordStrength()];
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(field: 'password' | 'confirm'): void {
    if (field === 'password') {
      this.showPassword.set(!this.showPassword());
    } else {
      this.showConfirmPassword.set(!this.showConfirmPassword());
    }
  }

  /**
   * Submit password reset
   * Supabase validates the token from URL query params automatically
   */
  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    if (this.passwordForm.hasError('passwordMismatch')) {
      this.error.set('Passwords do not match');
      return;
    }

    this.isLoading.set(true);
    const newPassword = this.passwordForm.value.newPassword;

    // Call Supabase to update password
    // The recovery token from URL query params is automatically in the session
    from(this.performPasswordReset(newPassword)).subscribe({
      next: () => {
        // Log successful reset
        this.activityService.trackAuthActivity(
          'password_reset_completed',
          'User successfully reset their password',
          'success',
        );

        this.successMessage.set('Password reset successfully!');
        this.isLoading.set(false);

        // Redirect to login after brief delay
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { resetSuccess: true },
          });
        }, 2000);
      },
      error: (error) => {
        console.error('Password reset failed:', error);
        this.isLoading.set(false);

        // Log failed reset
        this.activityService.trackAuthActivity(
          'password_reset_failed',
          `Password reset failed: ${error?.message || 'Unknown error'}`,
          'failed',
        );

        // Handle specific Supabase errors
        const errorMessage = this.getResetErrorMessage(error);
        this.error.set(errorMessage);
      },
    });
  }

  /**
   * Perform the actual password reset via Supabase
   * Uses the recovery session created by the URL token
   */
  private async performPasswordReset(newPassword: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      return Promise.resolve();
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get user-friendly error message
   */
  private getResetErrorMessage(error: any): string {
    const message = error?.message?.toLowerCase() || '';

    if (message.includes('invalid token') || message.includes('expired')) {
      return 'Your reset link has expired. Please request a new one.';
    }

    if (message.includes('unauthorized')) {
      return 'Authorization failed. Please request a new password reset.';
    }

    if (message.includes('password')) {
      return 'Password does not meet security requirements. Please try again.';
    }

    return 'Failed to reset password. Please try again or request a new link.';
  }

  /**
   * Request a new reset link
   */
  requestNewLink(): void {
    this.router.navigate(['/login'], { queryParams: { forgotPassword: true } });
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string): boolean {
    const field = this.passwordForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Get field-specific error message
   */
  getFieldError(fieldName: string): string {
    const field = this.passwordForm.get(fieldName);

    if (!field) return '';

    if (field.hasError('required')) return 'This field is required';
    if (field.hasError('minlength')) {
      const length = field.getError('minlength').requiredLength;
      return `Minimum ${length} characters required`;
    }
    if (field.hasError('weakPassword')) {
      return 'Password must include uppercase, lowercase, number, and special character';
    }

    return '';
  }

  /**
   * Check if password contains special character
   */
  isSpecialCharPresent(): boolean {
    const password = this.passwordForm.get('newPassword')?.value;
    if (!password) return false;
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);
  }

  /**
   * Check if password has minimum length
   */
  hasMinLength(): boolean {
    const password = this.passwordForm.get('newPassword')?.value;
    return password?.length >= 8 || false;
  }

  /**
   * Check if password has uppercase letter
   */
  hasUpperCase(): boolean {
    const password = this.passwordForm.get('newPassword')?.value;
    return /[A-Z]/.test(password) || false;
  }

  /**
   * Check if password has lowercase letter
   */
  hasLowerCase(): boolean {
    const password = this.passwordForm.get('newPassword')?.value;
    return /[a-z]/.test(password) || false;
  }

  /**
   * Check if password has number
   */
  hasNumber(): boolean {
    const password = this.passwordForm.get('newPassword')?.value;
    return /\d/.test(password) || false;
  }
}
