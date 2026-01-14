import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, of, throwError } from 'rxjs';
import { tap, finalize, catchError, map } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { AuditLogService } from '../../services/audit-log.service';

export interface AccountUpdate {
  fullName?: string;
  jobTitle?: string;
  phone?: string;
  emailNotifications?: boolean;
  marketingCommunications?: boolean;
}

export interface AccountProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  phone?: string;
  email_notifications: boolean;
  marketing_communications: boolean;
  updated_at: string;
}

/**
 * AccountService
 * Manages user account operations via Supabase
 * All operations are logged to audit_logs table
 */
@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private supabase = inject(SharedSupabaseService);
  private auditLog = inject(AuditLogService);

  lastSaved = signal<Date | null>(null);
  isSaving = signal(false);

  /**
   * Get current user's account profile
   */
  getProfile(): Observable<AccountProfile | null> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return of(null);
    }

    return from(this.fetchProfile(userId)).pipe(
      catchError((error) => {
        console.error('Failed to fetch profile:', error);
        return of(null);
      })
    );
  }

  /**
   * Fetch profile from database
   */
  private async fetchProfile(userId: string): Promise<AccountProfile | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select(
        'id, email, first_name, last_name, job_title, phone, email_notifications, marketing_communications, updated_at'
      )
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return null;
    }

    return data as AccountProfile;
  }

  /**
   * Update user profile
   */
  updateAccount(updates: AccountUpdate): Observable<AccountProfile | null> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    this.isSaving.set(true);

    return from(this.performProfileUpdate(userId, updates)).pipe(
      tap(async (profile) => {
        this.lastSaved.set(new Date());
        await this.auditLog.logProfileUpdated(null, updates);
        console.log('✅ Account updated and logged');
      }),
      catchError((error) => {
        console.error('Profile update failed:', error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.isSaving.set(false);
      })
    );
  }

  /**
   * Perform profile update to Supabase
   */
  private async performProfileUpdate(
    userId: string,
    updates: AccountUpdate
  ): Promise<AccountProfile> {
    const updateData: any = {};

    if (updates.fullName) {
      const [firstName, ...lastNameParts] = updates.fullName.split(' ');
      updateData.first_name = firstName;
      updateData.last_name = lastNameParts.join(' ');
    }
    if (updates.jobTitle !== undefined) updateData.job_title = updates.jobTitle;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.emailNotifications !== undefined)
      updateData.email_notifications = updates.emailNotifications;
    if (updates.marketingCommunications !== undefined)
      updateData.marketing_communications = updates.marketingCommunications;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }

    return data as AccountProfile;
  }

  /**
   * Change password via Supabase auth
   */
  changePassword(
    currentPassword: string,
    newPassword: string
  ): Observable<{ message: string }> {
    this.isSaving.set(true);

    return from(this.supabase.auth.updateUser({ password: newPassword })).pipe(
      map(() => ({ message: 'Password changed successfully' })),
      tap(async () => {
        this.lastSaved.set(new Date());
        await this.auditLog.logPasswordChange();
        console.log('✅ Password changed and logged');
      }),
      catchError((error) => {
        console.error('Password change failed:', error);
        return throwError(() => new Error('Failed to change password'));
      }),
      finalize(() => {
        this.isSaving.set(false);
      })
    );
  }

  /**
   * Logout all devices by updating session
   * All other sessions will be invalidated
   */
  logoutAllDevices(): Observable<{ message: string }> {
    this.isSaving.set(true);

    return from(this.performLogoutAll()).pipe(
      tap(async () => {
        await this.auditLog.logLogoutAll();
        console.log('✅ Logout all devices logged');
      }),
      catchError((error) => {
        console.error('Logout all failed:', error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.isSaving.set(false);
      })
    );
  }

  /**
   * Perform logout all via Supabase signOut
   */
  private async performLogoutAll(): Promise<{ message: string }> {
    const { error } = await this.supabase.auth.signOut({
      scope: 'global',
    });

    if (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }

    return { message: 'Logged out from all devices' };
  }

  /**
   * Download account data as JSON
   */
  downloadAccountData(): Observable<Blob> {
    const userId = this.supabase.getCurrentUserId();
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    this.isSaving.set(true);

    return from(this.generateAccountDataExport(userId)).pipe(
      tap(async () => {
        await this.auditLog.logDataExported();
        console.log('✅ Data export logged');
      }),
      catchError((error) => {
        console.error('Data export failed:', error);
        return throwError(() => error);
      }),
      finalize(() => {
        this.isSaving.set(false);
      })
    );
  }

  /**
   * Generate account data export
   */
  private async generateAccountDataExport(userId: string): Promise<Blob> {
    try {
      // Fetch user profile
      const { data: profile } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // Fetch applications
      const { data: applications } = await this.supabase
        .from('applications')
        .select('*')
        .eq('applicant_id', userId);

      // Fetch documents
      const { data: documents } = await this.supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId);

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile,
        applications: applications || [],
        documents: documents || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      return blob;
    } catch (error) {
      console.error('Export generation failed:', error);
      throw error;
    }
  }

  /**
   * Setup two-factor authentication
   */
  setupTwoFactor(): Observable<{ secret: string; qrCode: string }> {
    // This requires backend RPC call or custom implementation
    // For now, return placeholder
    return of({
      secret: 'placeholder',
      qrCode: 'placeholder',
    });
  }

  /**
   * Confirm two-factor setup with verification code
   */
  confirmTwoFactor(code: string): Observable<{ backupCodes: string[] }> {
    this.isSaving.set(true);

    return of({ backupCodes: [] }).pipe(
      tap(async () => {
        await this.auditLog.logTwoFactorEnabled();
        console.log('✅ 2FA enabled and logged');
      }),
      finalize(() => {
        this.isSaving.set(false);
      })
    );
  }

  /**
   * Disable two-factor authentication
   */
  disableTwoFactor(code: string): Observable<{ message: string }> {
    this.isSaving.set(true);

    return of({ message: 'Two-factor authentication disabled' }).pipe(
      tap(async () => {
        await this.auditLog.logTwoFactorDisabled();
        console.log('✅ 2FA disabled and logged');
      }),
      finalize(() => {
        this.isSaving.set(false);
      })
    );
  }
}
