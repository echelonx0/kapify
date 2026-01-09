import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, of, throwError, Subject } from 'rxjs';
import {
  map,
  catchError,
  timeout,
  tap,
  finalize,
  takeUntil,
} from 'rxjs/operators';
import { Session, User } from '@supabase/supabase-js';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { RegistrationTransactionService } from '../../shared/services/registration-transaction.service';
import { AuthHelperService } from './auth-helper.service';
import {
  AuthOperationResult,
  LoadingState,
  LoginRequest,
  RegisterRequest,
  SignUpData,
  UserProfile,
} from '../models/auth.models';

/**
 * AuthService
 * - Consolidates auth state using SharedSupabaseService
 * - Delegates business logic to helper services (AuthHelperService, AuthPasswordService)
 * - Single source of truth for session/user
 * - Proper cleanup on destroy
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService implements OnDestroy {
  private router = inject(Router);
  private supabaseService = inject(SharedSupabaseService);
  private registrationTransaction = inject(RegistrationTransactionService);
  private authHelper = inject(AuthHelperService);
  private destroy$ = new Subject<void>();

  // Single source of truth: user profile
  private userSubject = signal<UserProfile | null>(null);

  // Loading state management
  private loadingState = signal<LoadingState>({
    registration: false,
    login: false,
    initialization: false,
    sessionUpdate: false,
    passwordReset: false,
  });

  // Public signals for component consumption
  user = computed(() => this.userSubject());
  isAuthenticated = computed(() => !!this.userSubject());

  // Computed loading states
  isInitializing = computed(() => this.loadingState().initialization);
  isLoggingIn = computed(() => this.loadingState().login);
  isRegistering = computed(() => this.loadingState().registration);
  isSessionUpdating = computed(() => this.loadingState().sessionUpdate);
  isResettingPassword = computed(() => this.loadingState().passwordReset);

  isLoading = computed(() => {
    const state = this.loadingState();
    return (
      state.registration ||
      state.login ||
      state.initialization ||
      state.sessionUpdate ||
      state.passwordReset
    );
  });

  // Expose SharedSupabaseService session$ for reactive components
  session$ = this.supabaseService.session$;

  // Observable interfaces for legacy/reactive code
  user$ = new Observable<UserProfile | null>((subscriber) => {
    const subscription = this.supabaseService.session$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (session) => {
        if (session?.user) {
          const profile = await this.authHelper.buildUserProfile(session.user);
          subscriber.next(profile);
        } else {
          subscriber.next(null);
        }
      });
    return () => subscription.unsubscribe();
  });

  isAuthenticated$ = this.session$.pipe(
    map((session) => !!session?.user),
    takeUntil(this.destroy$)
  );

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize auth: wire up session changes to user profile loading
   */
  private async initializeAuth(): Promise<void> {
    this.updateLoadingState({ initialization: true });

    try {
      await this.supabaseService.ensureInitialized();

      const initialSession = await this.supabaseService.waitForSession();
      if (initialSession?.user) {
        await this.establishUserSession(initialSession);
      } else {
        this.clearAuthState();
      }

      this.supabaseService
        .onAuthStateChange(async (event, session) => {
          try {
            if (session?.user) {
              await this.establishUserSession(session);
            } else {
              this.clearAuthState();
              if (event === 'SIGNED_OUT') {
                this.router.navigate(['/auth/login']);
              }
            }
          } catch (error: any) {
            if (!this.isTransientError(error)) {
              this.clearAuthState();
            }
          }
        })
        .unsubscribe();
    } catch (error: any) {
      console.error('❌ Auth initialization failed:', error);
      this.clearAuthState();
    } finally {
      this.updateLoadingState({ initialization: false });
    }
  }

  /**
   * Get user's organization ID
   */
  /**
   * Get user's organization ID - bypasses recursive RLS policy
   * Uses maybeSingle() with explicit filtering to avoid policy recursion
   */
  async getUserOrganizationId(userId: string): Promise<string | undefined> {
    try {
      // Use direct query instead of relying on RLS to avoid recursion
      const { data, error } = await this.supabaseService
        .from('organization_users')
        .select('organization_id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (error) {
        // Check if it's a "not found" error (expected) vs actual error
        if (error.code === 'PGRST116') {
          console.warn(
            '⚠️ No active organization_users record for user:',
            userId
          );
          return undefined;
        }

        console.error('❌ Error fetching org ID:', {
          code: error.code,
          message: error.message,
        });
        return undefined;
      }

      if (!data || !data.organization_id) {
        console.warn('⚠️ Organization ID is null for user:', userId);
        return undefined;
      }

      return data.organization_id;
    } catch (error: any) {
      console.error(
        '❌ Unexpected error in getUserOrganizationId:',
        error?.message
      );
      return undefined;
    }
  }

  /**
   * Register new user
   */
  register(credentials: RegisterRequest): Observable<AuthOperationResult> {
    this.updateLoadingState({ registration: true });

    const validationError =
      this.authHelper.validateRegistrationInput(credentials);
    if (validationError) {
      this.updateLoadingState({ registration: false });
      return of({
        user: null,
        error: validationError,
        organizationCreated: false,
        success: false,
      });
    }

    return this.registrationTransaction
      .executeRegistrationTransaction(credentials)
      .pipe(
        timeout(60000),
        tap((result) => {
          if (result.success && result.user) {
            this.updateAuthStateFromTransaction(result);
          }
        }),
        map((result) => this.mapTransactionResultToAuthResult(result)),
        catchError((error) => {
          console.error('❌ Registration failed:', error);
          return of({
            user: null,
            error:
              error?.error ||
              error?.message ||
              'Registration failed. Please try again.',
            organizationCreated: false,
            success: false,
          });
        }),
        finalize(() => {
          this.updateLoadingState({ registration: false });
        }),
        takeUntil(this.destroy$)
      );
  }

  /**
   * Login with email and password
   */
  login(credentials: LoginRequest): Observable<AuthOperationResult> {
    this.updateLoadingState({ login: true });

    return from(
      this.performLogin(credentials.email, credentials.password)
    ).pipe(
      timeout(30000),
      catchError((error) => {
        console.error('❌ Login failed:', error);
        return of({
          user: null,
          error: error?.message || 'Login failed. Please try again.',
          success: false,
        });
      }),
      finalize(() => {
        this.updateLoadingState({ login: false });
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Perform the actual login
   */
  private async performLogin(
    email: string,
    password: string
  ): Promise<AuthOperationResult> {
    try {
      const loginResult = await Promise.race([
        this.supabaseService.auth.signInWithPassword({ email, password }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Login timeout')), 25000)
        ),
      ]);

      const { data, error } = loginResult;

      if (error) {
        throw new Error(this.authHelper.createLoginErrorMessage(error));
      }

      if (!data.user) {
        throw new Error('Login failed - no user data returned');
      }

      const userProfile = await this.authHelper.buildUserProfile(data.user);
      this.userSubject.set(userProfile);

      return {
        user: userProfile,
        error: null,
        organizationId: userProfile.organizationId,
        organizationCreated: !!userProfile.organizationId,
        success: true,
      };
    } catch (error: any) {
      console.error('Login operation failed:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabaseService.auth.signOut();
      if (error && !this.isTransientError(error)) {
        console.error('SignOut error:', error);
      }
    } catch (error: any) {
      if (!this.isTransientError(error)) {
        console.error('SignOut failed:', error);
      }
    } finally {
      this.clearAuthState();
      this.router.navigate(['/login']);
    }
  }

  /**
   * Check if route can be activated (for route guards)
   */
  canActivateRoute(): Observable<boolean> {
    if (this.isInitializing()) {
      return new Observable<boolean>((subscriber) => {
        const checkAuth = () => {
          if (!this.isInitializing()) {
            subscriber.next(this.isAuthenticated());
            subscriber.complete();
          } else {
            setTimeout(checkAuth, 50);
          }
        };
        checkAuth();
      }).pipe(
        timeout(10000),
        catchError(() => of(false))
      );
    }

    return of(this.isAuthenticated());
  }

  /**
   * Check if user needs organization recovery
   */
  async checkCurrentUserNeedsOrganizationRecovery(): Promise<boolean> {
    const user = this.userSubject();
    if (!user || user.organizationId) {
      return false;
    }

    try {
      const recoveryCheck =
        await this.registrationTransaction.checkUserNeedsRecovery(user.id);
      return (
        recoveryCheck.needsRecovery &&
        recoveryCheck.missingComponents.includes('organization')
      );
    } catch (error) {
      console.error('Error checking organization recovery needs:', error);
      return false;
    }
  }

  /**
   * Recover organization for existing user
   */
  recoverUserOrganization(): Observable<{
    success: boolean;
    organizationId?: string;
  }> {
    const user = this.userSubject();
    if (!user) {
      return throwError(() => new Error('No authenticated user'));
    }

    if (user.organizationId) {
      return of({ success: true, organizationId: user.organizationId });
    }

    const credentials: RegisterRequest = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      password: '',
      confirmPassword: '',
      userType: user.userType as 'sme' | 'funder',
      agreeToTerms: true,
    };

    return this.registrationTransaction
      .executeRegistrationTransaction(credentials)
      .pipe(
        map((result) => ({
          success: result.success,
          organizationId: result.organizationId,
        })),
        tap((result) => {
          if (result.success && result.organizationId) {
            const updatedUser = {
              ...user,
              organizationId: result.organizationId,
            };
            this.userSubject.set(updatedUser);
          }
        }),
        catchError((error) => {
          console.error('❌ Organization recovery failed:', error);
          return of({ success: false });
        }),
        takeUntil(this.destroy$)
      );
  }

  /**
   * Check if user has an organization
   */
  userHasOrganization(): boolean {
    const user = this.userSubject();
    return !!user?.organizationId;
  }

  /**
   * Get current user's organization ID
   */
  getCurrentUserOrganizationId(): string | null {
    const user = this.userSubject();
    return user?.organizationId || null;
  }

  /**
   * Legacy signUp method - delegates to register
   */
  signUp(credentials: SignUpData): Observable<AuthOperationResult> {
    const registerRequest: RegisterRequest = {
      firstName: credentials.firstName,
      lastName: credentials.lastName,
      email: credentials.email,
      phone: credentials.phone,
      password: credentials.password,
      confirmPassword: credentials.password,
      userType: credentials.userType as 'sme' | 'funder',
      agreeToTerms: true,
    };

    return this.register(registerRequest);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    const session = this.supabaseService.session;
    return session?.access_token || null;
  }

  /**
   * Get loading state as Observable (legacy)
   */
  get isLoading$(): Observable<boolean> {
    return of(this.isLoading());
  }

  // ===================================
  // PRIVATE UTILITIES
  // ===================================

  /**
   * Update loading state
   */
  private updateLoadingState(updates: Partial<LoadingState>): void {
    const current = this.loadingState();
    this.loadingState.set({ ...current, ...updates });
  }

  /**
   * Clear all auth state
   */
  private clearAuthState(): void {
    this.userSubject.set(null);
    this.loadingState.set({
      registration: false,
      login: false,
      initialization: false,
      sessionUpdate: false,
      passwordReset: false,
    });
  }

  /**
   * Establish user session after login/auth state change
   */
  private async establishUserSession(session: Session): Promise<void> {
    this.updateLoadingState({ sessionUpdate: true });

    try {
      const userProfile = await this.authHelper.buildUserProfile(session.user);
      this.userSubject.set(userProfile);
    } catch (error) {
      console.error('Failed to establish user session:', error);
      this.clearAuthState();
      throw error;
    } finally {
      this.updateLoadingState({ sessionUpdate: false });
    }
  }

  /**
   * Update auth state from transaction result
   */
  private updateAuthStateFromTransaction(result: any): void {
    if (result.user && result.organizationId) {
      const userProfile = result.user;
      userProfile.organizationId = result.organizationId;
      this.userSubject.set(userProfile);
    }
  }

  /**
   * Map transaction result to auth operation result
   */
  private mapTransactionResultToAuthResult(result: any): AuthOperationResult {
    return {
      user: result.success ? result.user : null,
      error: result.success ? null : result.error || 'Registration failed',
      organizationId: result.organizationId,
      organizationCreated: !!result.organizationId,
      success: result.success,
    };
  }

  /**
   * Check if error is transient
   */
  private isTransientError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return (
      message.includes('lock') ||
      message.includes('navigatorlockacquiretimeouterror') ||
      message.includes('timeout')
    );
  }
  /**
   * Get current user's ID from the user signal
   */
  getCurrentUserId(): string | null {
    const user = this.userSubject();
    return user?.id || null;
  }
  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
