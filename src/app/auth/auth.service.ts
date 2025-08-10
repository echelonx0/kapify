// src/app/auth/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../shared/models/user.models';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  userType: 'sme' | 'funder';
  companyName?: string;
  agreeToTerms: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  profile?: any;
  organization?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_BASE = '/api/auth';
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  
  private authState = signal<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    accessToken: null,
    refreshToken: null
  });

  private refreshTimer?: any;

  // Public readonly signals - fix the structure here
  readonly user = computed(() => this.authState().user);
  readonly isAuthenticated = computed(() => this.authState().isAuthenticated);
  readonly isLoading = computed(() => this.authState().isLoading);
  readonly accessToken = computed(() => this.authState().accessToken);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const accessToken = localStorage.getItem(this.TOKEN_KEY);
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

    if (accessToken && refreshToken) {
      this.setTokens(accessToken, refreshToken);
      this.loadCurrentUser().subscribe({
        next: () => {
          this.scheduleTokenRefresh();
        },
        error: () => {
          this.clearAuth();
        }
      });
    }
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    this.setLoading(true);
    
    return this.http.post<AuthResponse>(`${this.API_BASE}/register`, data).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      }),
      catchError(error => {
        this.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.setLoading(true);
    
    return this.http.post<AuthResponse>(`${this.API_BASE}/login`, credentials).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      }),
      catchError(error => {
        this.setLoading(false);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<any> {
    const refreshToken = this.authState().refreshToken;
    
    return this.http.post(`${this.API_BASE}/logout`, { refreshToken }).pipe(
      tap(() => {
        this.clearAuth();
        this.router.navigate(['/']);
      }),
      catchError(() => {
        // Even if logout fails on server, clear local auth
        this.clearAuth();
        this.router.navigate(['/']);
        return throwError(() => new Error('Logout failed'));
      })
    );
  }

  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.authState().refreshToken;
    
    if (!refreshToken) {
      this.clearAuth();
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${this.API_BASE}/refresh`,
      { refreshToken }
    ).pipe(
      tap(response => {
        this.setTokens(response.accessToken, response.refreshToken);
        this.scheduleTokenRefresh();
      }),
      catchError(error => {
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }

  private loadCurrentUser(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${this.API_BASE}/me`).pipe(
      tap(response => {
        this.authState.update(state => ({
          ...state,
          user: response.user,
          isAuthenticated: true,
          isLoading: false
        }));
      })
    );
  }

  private handleAuthSuccess(response: AuthResponse): void {
    this.setTokens(response.accessToken, response.refreshToken);
    
    this.authState.set({
      user: response.user,
      isAuthenticated: true,
      isLoading: false,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken
    });

    this.scheduleTokenRefresh();
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    
    this.authState.update(state => ({
      ...state,
      accessToken,
      refreshToken
    }));
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.authState.set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null
    });
  }

  private setLoading(loading: boolean): void {
    this.authState.update(state => ({ ...state, isLoading: loading }));
  }

  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh token 2 minutes before expiry (tokens expire in 15 minutes)
    const refreshTime = 13 * 60 * 1000; // 13 minutes
    
    this.refreshTimer = timer(refreshTime).subscribe(() => {
      this.refreshToken().subscribe({
        error: () => {
          this.clearAuth();
          this.router.navigate(['/login']);
        }
      });
    });
  }

  // Helper method to get auth headers
  getAuthHeaders(): { [header: string]: string } {
    const token = this.accessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    const user = this.user();
    // Implement permission checking logic based on your user model
    return user?.status === 'active' && user?.emailVerified;
  }

  // Check if user can perform action based on profile completion
  canPerformAction(requiredCompletion: number = 90): boolean {
    // This will be implemented when profile completion is available
    return true; // For now, allow all actions
  }
}