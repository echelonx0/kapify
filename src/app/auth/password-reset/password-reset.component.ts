import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { AuthPasswordService } from 'src/app/auth/services/auth-password.service';
import { PasswordResetData, PasswordResetResult } from '../models/auth.models';

interface PasswordStrengthFeedback {
  isValid: boolean;
  feedback: string[];
}

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css'],
})
export class PasswordResetComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private passwordService = inject(AuthPasswordService);
  private destroy$ = new Subject<void>();

  // Form state
  resetForm!: FormGroup;
  private token = '';

  // UI state
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  showSuccess = signal(false);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  // Password strength
  passwordStrength = signal(0);
  passwordFeedback = signal<{ isValid: boolean; feedback: string[] }>({
    isValid: false,
    feedback: [],
  });

  // Computed properties
  isPasswordFieldInvalid = computed(() => {
    const passwordControl = this.resetForm?.get('password');
    return passwordControl?.touched && passwordControl?.invalid;
  });

  isConfirmPasswordFieldInvalid = computed(() => {
    const confirmControl = this.resetForm?.get('confirmPassword');
    const passwordControl = this.resetForm?.get('password');
    const mismatch =
      confirmControl?.touched &&
      confirmControl?.value &&
      confirmControl?.value !== passwordControl?.value;
    return mismatch || (confirmControl?.touched && confirmControl?.invalid);
  });

  constructor() {
    this.initializeForm();
  }

  /**
   * Initialize reactive form
   */
  private initializeForm(): void {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  /**
   * Component initialization
   */
  ngOnInit(): void {
    this.extractTokenFromUrl();
    this.setupFormValidation();
  }

  /**
   * Extract reset token from URL hash
   */
  private extractTokenFromUrl(): void {
    this.route.fragment.pipe(takeUntil(this.destroy$)).subscribe((fragment) => {
      if (fragment) {
        const params = new URLSearchParams(fragment);
        this.token = params.get('access_token') || '';

        if (!this.token) {
          this.error.set(
            'Invalid reset link. Please request a new password reset.'
          );
        }
      } else {
        this.error.set(
          'Invalid reset link. Please request a new password reset.'
        );
      }
    });
  }

  /**
   * Setup custom validators
   */
  private setupFormValidation(): void {
    const confirmControl = this.resetForm.get('confirmPassword');
    const passwordControl = this.resetForm.get('password');

    passwordControl?.valueChanges.subscribe(() => {
      confirmControl?.updateValueAndValidity();
    });

    this.resetForm.setValidators((control: AbstractControl) => {
      const group = control as FormGroup;
      const password = group.get('password')?.value;
      const confirm = group.get('confirmPassword')?.value;

      if (password && confirm && password !== confirm) {
        return { passwordMismatch: true };
      }
      return null;
    });
  }

  /**
   * Update password strength indicator
   */
  updatePasswordStrength(): void {
    const password = this.resetForm.get('password')?.value || '';
    const strength = this.passwordService.calculatePasswordStrength(password);
    const feedback = this.passwordService.getPasswordStrengthFeedback(password);

    this.passwordStrength.set(strength);
    this.passwordFeedback.set(feedback);
  }

  /**
   * Get strength bar color
   */
  getStrengthBarColor(): string {
    const strength = this.passwordStrength();
    if (strength < 40) return 'from-red-400 to-red-500';
    if (strength < 70) return 'from-amber-400 to-amber-500';
    return 'from-teal-400 to-teal-500';
  }

  /**
   * Get strength label
   */
  getStrengthLabel(): string {
    const strength = this.passwordStrength();
    if (strength < 40) return '❌ Weak';
    if (strength < 70) return '⚠️ Fair';
    return '✅ Strong';
  }

  /**
   * Get strength text color
   */
  getStrengthTextColor(): string {
    const strength = this.passwordStrength();
    if (strength < 40) return 'text-red-700';
    if (strength < 70) return 'text-amber-700';
    return 'text-green-700';
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword.update((val) => !val);
  }

  /**
   * Toggle confirm password visibility
   */
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((val) => !val);
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (!this.resetForm.valid || !this.token) {
      this.error.set('Please fill in all fields correctly');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const resetData: PasswordResetData = {
      token: this.token,
      password: this.resetForm.get('password')?.value,
      confirmPassword: this.resetForm.get('confirmPassword')?.value,
    };

    this.passwordService
      .resetPassword(resetData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: PasswordResetResult) => {
          if (result.success) {
            this.showSuccess.set(true);
            // Auto-navigate after 3 seconds
            setTimeout(() => {
              this.navigateToLogin();
            }, 3000);
          } else {
            this.error.set(
              result.error || 'Password reset failed. Please try again.'
            );
            this.isSubmitting.set(false);
          }
        },
        error: (err) => {
          console.error('Password reset error:', err);
          this.error.set('An error occurred. Please try again.');
          this.isSubmitting.set(false);
        },
      });
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
