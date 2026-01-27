import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, of, catchError, finalize } from 'rxjs';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { AuditLogService } from '../../services/audit-log.service';
import { ToastService } from 'src/app/shared/services/toast.service';

export interface DeleteAccountResult {
  success: boolean;
  message: string;
  error?: string;
  redirectUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AccountDeleteService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  private auditLog = inject(AuditLogService);
  private toast = inject(ToastService);

  isDeleting = signal(false);
  deleteProgress = signal<string | null>(null);

  getDeleteWarningData(): {
    title: string;
    items: string[];
    permanent: boolean;
  } {
    return {
      title: 'The following data will be permanently deleted:',
      items: [
        'Your account profile and authentication credentials',
        'All funding applications and their status',
        'All uploaded documents and supporting materials',
        'Communication history with funders and consultants',
        'Investment data and transaction records',
        'Activity logs and audit trail',
      ],
      permanent: true,
    };
  }

  deleteAccount(confirmationText: string): Observable<DeleteAccountResult> {
    if (confirmationText.toUpperCase() !== 'DELETE MY ACCOUNT') {
      return of({
        success: false,
        message: 'Confirmation text did not match.',
        error: 'INVALID_CONFIRMATION',
      });
    }

    this.isDeleting.set(true);
    this.deleteProgress.set('Deleting your account...');

    return from(this.invokeDeleteFunction()).pipe(
      catchError((error) =>
        of({
          success: false,
          message: 'Account deletion failed',
          error: error?.message ?? 'UNKNOWN_ERROR',
        })
      ),
      finalize(() => {
        this.isDeleting.set(false);
      })
    );
  }

  private async invokeDeleteFunction(): Promise<DeleteAccountResult> {
    try {
      const token = this.authService.getAccessToken();

      if (!token) {
        throw new Error('User not authenticated');
      }

      // Release NavigatorLock by delaying function invocation
      await new Promise((resolve) => setTimeout(resolve, 100));

      const { data, error } = await this.supabase.functions.invoke(
        'delete-user',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: {},
        }
      );

      if (error) {
        console.error('Delete function error:', error);
        this.toast.error(`Delete failed ${error}`);
        throw new Error(error.message ?? 'Deletion failed');
      }

      if (!data?.success) {
        throw new Error(data?.error ?? 'Deletion failed');
      }

      await this.auditLog.logAccountDeleted();
      this.deleteProgress.set('Signing you out...');
      await this.authService.signOut();

      return {
        success: true,
        message: 'Your account has been permanently deleted.',
        redirectUrl: '/auth/login',
      };
    } catch (error: any) {
      console.error('Delete account error:', error);
      throw error;
    }
  }
}
