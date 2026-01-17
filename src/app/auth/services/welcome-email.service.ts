import { Injectable, inject } from '@angular/core';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

/**
 * WelcomeEmailService
 *
 * Sends welcome emails to newly registered users
 * Called after successful registration/account creation
 *
 * Uses edge function: send_welcome_email
 * Non-blocking: email failures don't affect registration flow
 */
@Injectable({
  providedIn: 'root',
})
export class WelcomeEmailService {
  private supabase = inject(SharedSupabaseService);

  /**
   * Send welcome email to newly registered user
   * Called after user registration completes
   *
   * Non-blocking: Failures are logged but don't throw
   */
  async sendWelcomeEmail(options: {
    email: string;
    firstName: string;
    lastName?: string;
    userType: 'sme' | 'funder';
  }): Promise<boolean> {
    try {
      console.log('📧 Sending welcome email to:', options.email);

      // Validate email
      if (!options.email || !options.email.includes('@')) {
        console.warn('⚠️ Invalid email format, skipping welcome email');
        return true; // Non-critical - don't block
      }

      // Call edge function
      const { data, error } = await this.supabase.functions.invoke(
        'send_welcome_email',
        {
          body: {
            email: options.email,
            firstName: options.firstName,
            lastName: options.lastName || '',
            userType: options.userType,
          },
        },
      );

      // Non-blocking: Log warnings but don't fail
      if (error) {
        console.warn(
          '⚠️ Welcome email service error (non-critical):',
          error.message,
        );
        return true; // Don't block registration
      }

      if (!data?.success) {
        console.warn('⚠️ Welcome email service returned false');
        return true; // Don't block registration
      }

      console.log('✅ Welcome email queued successfully');
      return true;
    } catch (error) {
      console.error('❌ Welcome email function error:', error);
      return true; // Non-blocking - don't fail registration
    }
  }

  /**
   * Send welcome email to SME
   * Convenience method with SME-specific defaults
   */
  async sendSMEWelcomeEmail(
    email: string,
    firstName: string,
    lastName?: string,
  ): Promise<boolean> {
    return this.sendWelcomeEmail({
      email,
      firstName,
      lastName,
      userType: 'sme',
    });
  }

  /**
   * Send welcome email to Funder
   * Convenience method with Funder-specific defaults
   */
  async sendFunderWelcomeEmail(
    email: string,
    firstName: string,
    lastName?: string,
  ): Promise<boolean> {
    return this.sendWelcomeEmail({
      email,
      firstName,
      lastName,
      userType: 'funder',
    });
  }
}
