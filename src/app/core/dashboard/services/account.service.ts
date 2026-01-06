import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AccountUpdate {
  fullName?: string;
  jobTitle?: string;
  phone?: string;
  emailNotifications?: boolean;
  marketingCommunications?: boolean;
}

export interface AccountResponse {
  email: string;
  fullName: string;
  jobTitle?: string;
  phone?: string;
  emailNotifications: boolean;
  marketingCommunications: boolean;
  lastPasswordChanged?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private apiUrl = '/api/account';
  lastSaved = signal<Date | null>(null);

  constructor(private http: HttpClient) {}

  updateAccount(updates: AccountUpdate): Observable<AccountResponse> {
    return this.http
      .put<AccountResponse>(`${this.apiUrl}/profile`, updates)
      .pipe(
        tap(() => {
          this.lastSaved.set(new Date());
        })
      );
  }

  openPasswordChangeModal() {
    // Trigger modal service or emit event
    console.log('Opening password change modal');
  }

  openTwoFactorModal() {
    // Trigger modal service or emit event
    console.log('Opening 2FA modal');
  }

  changePassword(
    currentPassword: string,
    newPassword: string
  ): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(`${this.apiUrl}/password`, {
        currentPassword,
        newPassword,
      })
      .pipe(
        tap(() => {
          this.lastSaved.set(new Date());
        })
      );
  }

  logoutAllDevices(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/logout-all`, {});
  }

  downloadAccountData(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/data/export`, {
      responseType: 'blob',
    });
  }

  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}`);
  }

  setupTwoFactor(): Observable<{ secret: string; qrCode: string }> {
    return this.http.post<{ secret: string; qrCode: string }>(
      `${this.apiUrl}/2fa/setup`,
      {}
    );
  }

  confirmTwoFactor(code: string): Observable<{ backupCodes: string[] }> {
    return this.http.post<{ backupCodes: string[] }>(
      `${this.apiUrl}/2fa/confirm`,
      { code }
    );
  }

  disableTwoFactor(code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/2fa/disable`, {
      code,
    });
  }
}
