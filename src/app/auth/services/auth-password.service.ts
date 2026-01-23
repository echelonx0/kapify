import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { tap, catchError, timeout, map } from 'rxjs/operators';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { DatabaseActivityService } from '../../shared/services/database-activity.service';

import {
  PasswordResetRequest,
  PasswordResetResult,
  PasswordResetData,
} from 'src/app/auth/models/auth.models';
import { AuthHelperService } from './auth-helper.service';
import { ToastService } from 'src/app/shared/services/toast.service';

/**
 * AuthPasswordService
 * Handles password reset and password-related operations
 * Tracks all password reset attempts for security and compliance
 */
@Injectable({
  providedIn: 'root',
})
export class AuthPasswordService {
  private supabase = inject(SharedSupabaseService);
  private activityService = inject(DatabaseActivityService);
  private authHelper = inject(AuthHelperService);
  private toastService = inject(ToastService);

  /**
   * Request password reset via email
   * Matches component: this.passwordService.requestPasswordReset(email)
   */
  requestPasswordReset(
    request: PasswordResetRequest,
  ): Observable<PasswordResetResult> {
    return from(this.performPasswordResetRequest(request.email)).pipe(
      timeout(15000),
      tap(() => {
        // Track successful reset request
        this.activityService.trackAuthActivity(
          'password_reset_requested',
          `Password reset email sent to ${request.email}`,
          'success',
        );
      }),
      map(
        () =>
          ({
            success: true,
            message: 'Password reset email sent. Check your inbox.',
            error: undefined,
          }) as PasswordResetResult,
      ),
      catchError((error) => {
        const errorMessage =
          this.authHelper.createPasswordResetErrorMessage(error);

        // Track failed reset request
        // this.activityService.trackAuthActivity(
        //   'password_reset_requested',
        //   `Password reset request failed: ${errorMessage}`,
        //   'failed',
        // );

        console.error('❌ Password reset request failed:', error);
        return of({
          success: false,
          message: 'Failed to send reset email',
          error: errorMessage,
        } as PasswordResetResult);
      }),
    );
  }

  /**
   * Perform the actual password reset request
   */
  private async performPasswordResetRequest(email: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/recover-password',
      });

      if (error) {
        throw new Error(error.message);
      }

      return Promise.resolve();
    } catch (error: any) {
      this.toastService.error('Password reset request failed');
      throw error;
    }
  }

  /**
   * Get password strength feedback
   * Used by component for real-time validation display
   */
  getPasswordStrengthFeedback(password: string): {
    isValid: boolean;
    feedback: string[];
  } {
    return this.authHelper.validatePasswordStrength(password);
  }

  /**
   * Calculate password strength percentage for UI
   */
  calculatePasswordStrength(password: string): number {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      special: /[!@#$%^&*]/.test(password),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    return (passedChecks / Object.keys(checks).length) * 100;
  }
}
