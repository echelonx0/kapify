import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { AuthPasswordService } from 'src/app/auth/services/auth-password.service';
import { PasswordResetResult } from '../models/auth.models';

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
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private passwordService = inject(AuthPasswordService);
  private destroy$ = new Subject<void>();

  // Form state
  emailForm!: FormGroup;

  // UI state
  showSuccess = signal(false);
  isSubmitting = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.initializeForm();
  }

  /**
   * Initialize email form
   */
  private initializeForm(): void {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  /**
   * Component initialization
   */
  ngOnInit(): void {
    // Component ready
  }

  /**
   * Check if email field is invalid
   */
  isEmailFieldInvalid(): boolean {
    const emailControl = this.emailForm.get('email');
    return !!(emailControl?.touched && emailControl?.invalid);
  }

  /**
   * Handle form submission - request password reset
   */
  onSubmit(): void {
    if (!this.emailForm.valid) {
      this.error.set('Please enter a valid email address');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const email = this.emailForm.get('email')?.value;

    this.passwordService
      .requestPasswordReset({ email })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: PasswordResetResult) => {
          if (result.success) {
            this.showSuccess.set(true);
            // Auto-navigate after 5 seconds
            setTimeout(() => {
              this.navigateToLogin();
            }, 5000);
          } else {
            this.error.set(
              result.error || 'Failed to send reset email. Please try again.',
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
