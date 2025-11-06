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
import { SharedSupabaseService } from '../shared/services/shared-supabase.service';
import {
  RegistrationTransactionService,
  RegistrationTransactionResult,
} from '../shared/services/registration-transaction.service';
import { Session, User } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType: 'sme' | 'funder' | 'consultant';
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
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

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType: string;
  profileStep: number;
  completionPercentage: number;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: string;
  organizationId?: string;
}

export interface AuthOperationResult {
  success: boolean;
  user: UserProfile | null;
  error: string | null;
  organizationId?: string;
  organizationCreated?: boolean;
}

interface LoadingState {
  registration: boolean;
  login: boolean;
  initialization: boolean;
  sessionUpdate: boolean;
}

/**
 * AuthService
 * - Consolidates auth state using SharedSupabaseService
 * - Eliminates duplicate state management
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
  private destroy$ = new Subject<void>();

  // Single source of truth: user profile (session comes from SharedSupabaseService)
  private userSubject = signal<UserProfile | null>(null);

  // Loading state management
  private loadingState = signal<LoadingState>({
    registration: false,
    login: false,
    initialization: false,
    sessionUpdate: false,
  });

  // Public signals for component consumption
  user = computed(() => this.userSubject());
  isAuthenticated = computed(() => !!this.userSubject());

  // Computed loading states
  isInitializing = computed(() => this.loadingState().initialization);
  isLoggingIn = computed(() => this.loadingState().login);
  isRegistering = computed(() => this.loadingState().registration);
  isSessionUpdating = computed(() => this.loadingState().sessionUpdate);

  isLoading = computed(() => {
    const state = this.loadingState();
    return (
      state.registration ||
      state.login ||
      state.initialization ||
      state.sessionUpdate
    );
  });

  // Expose SharedSupabaseService session$ for components that need reactive session
  // This is the single source of truth for authentication state
  session$ = this.supabaseService.session$;

  // Observable interfaces for legacy/reactive code
  user$ = new Observable<UserProfile | null>((subscriber) => {
    const subscription = this.supabaseService.session$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (session) => {
        if (session?.user) {
          const profile = await this.buildUserProfile(session.user);
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
    console.log('🔐 Starting auth initialization...');

    this.updateLoadingState({ initialization: true });

    try {
      // Ensure Supabase is initialized
      await this.supabaseService.ensureInitialized();

      // Get initial session and establish user
      const initialSession = await this.supabaseService.waitForSession();
      if (initialSession?.user) {
        await this.establishUserSession(initialSession);
      } else {
        this.clearAuthState();
      }

      // Subscribe to future session changes
      this.supabaseService
        .onAuthStateChange(async (event, session) => {
          try {
            console.log(`🔐 Auth state changed: ${event}`);

            if (session?.user) {
              await this.establishUserSession(session);
            } else {
              this.clearAuthState();
              if (event === 'SIGNED_OUT') {
                this.router.navigate(['/auth/login']);
              }
            }
          } catch (error: any) {
            console.error('Error handling auth state change:', error);
            // Don't clear state on transient errors
            if (!this.isTransientError(error)) {
              this.clearAuthState();
            }
          }
        })
        .unsubscribe(); // Unsubscribe from the returned subscription (onAuthStateChange handles its own lifecycle)
    } catch (error: any) {
      console.error('❌ Auth initialization failed:', error);
      this.clearAuthState();
    } finally {
      this.updateLoadingState({ initialization: false });
      console.log('✅ Auth initialization completed');
    }
  }

  /**
   * Register new user
   * Matches component: this.authService.register(formData)
   */
  register(credentials: RegisterRequest): Observable<AuthOperationResult> {
    console.log('📝 Starting registration process...');

    this.updateLoadingState({ registration: true });

    // Validate input
    const validationError = this.validateRegistrationInput(credentials);
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
            console.log('✅ Registration transaction completed');
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
   * Matches component: this.authService.login(formData)
   */
  login(credentials: LoginRequest): Observable<AuthOperationResult> {
    console.log('🔑 Starting login process...');

    this.updateLoadingState({ login: true });

    return from(
      this.performLogin(credentials.email, credentials.password)
    ).pipe(
      timeout(30000),
      tap((result) => {
        if (result.success) {
          console.log('✅ Login completed successfully');
        }
      }),
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
        throw new Error(this.createLoginErrorMessage(error));
      }

      if (!data.user) {
        throw new Error('Login failed - no user data returned');
      }

      // Build user profile
      const userProfile = await this.buildUserProfile(data.user);

      // Update local state
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
   * Create user-friendly login error messages
   */
  private createLoginErrorMessage(error: any): string {
    const message = error?.message || '';

    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link before logging in.';
    }
    if (
      message.includes('Too many requests') ||
      message.includes('rate limit')
    ) {
      return 'Too many login attempts. Please wait a few minutes before trying again.';
    }
    if (message.includes('User not found')) {
      return 'No account found with this email address.';
    }
    if (message.includes('Password')) {
      return 'Invalid password. Please check your password and try again.';
    }

    // Return original if user-friendly, otherwise generic
    if (message && message.length < 100 && !message.includes('Error:')) {
      return message;
    }

    return 'Login failed. Please try again.';
  }

  /**
   * Validate registration input
   */
  private validateRegistrationInput(
    credentials: RegisterRequest
  ): string | null {
    if (!credentials.agreeToTerms) {
      return 'You must accept the terms and conditions to proceed';
    }

    if (credentials.password !== credentials.confirmPassword) {
      return 'Passwords do not match';
    }

    if (credentials.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (!credentials.email || !credentials.firstName || !credentials.lastName) {
      return 'Please fill in all required fields';
    }

    return null;
  }

  /**
   * Establish user session from registration transaction
   */
  private updateAuthStateFromTransaction(
    result: RegistrationTransactionResult
  ): void {
    if (result.user && result.organizationId) {
      const userProfile = result.user;
      userProfile.organizationId = result.organizationId;
      this.userSubject.set(userProfile);
      console.log('✅ Auth state updated with registration result');
    }
  }

  /**
   * Map transaction result to auth operation result
   */
  private mapTransactionResultToAuthResult(
    result: RegistrationTransactionResult
  ): AuthOperationResult {
    return {
      user: result.success ? result.user : null,
      error: result.success ? null : result.error || 'Registration failed',
      organizationId: result.organizationId,
      organizationCreated: !!result.organizationId,
      success: result.success,
    };
  }

  /**
   * Establish user session after login/auth state change
   */
  private async establishUserSession(session: Session): Promise<void> {
    console.log('🔐 Establishing user session...');

    this.updateLoadingState({ sessionUpdate: true });

    try {
      const userProfile = await this.buildUserProfile(session.user);
      this.userSubject.set(userProfile);
      console.log('✅ User session established:', userProfile.email);
    } catch (error) {
      console.error('Failed to establish user session:', error);
      this.clearAuthState();
      throw error;
    } finally {
      this.updateLoadingState({ sessionUpdate: false });
    }
  }

  /**
   * Build complete user profile from Supabase user
   */
  private async buildUserProfile(user: User): Promise<UserProfile> {
    try {
      // Get user data from users table
      const { data: userData, error } = await this.supabaseService
        .from('users')
        .select(
          `
          *,
          user_profiles (
            profile_step,
            completion_percentage,
            avatar_url,
            is_verified
          )
        `
        )
        .eq('id', user.id)
        .single();

      if (error || !userData) {
        console.warn('User data not found, creating from auth user');
        return this.createProfileFromAuthUser(user);
      }

      // Get organization ID if exists
      const organizationId = await this.getUserOrganizationId(user.id);

      return {
        id: user.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        phone: userData.phone,
        userType: userData.user_type,
        profileStep: userData.user_profiles?.[0]?.profile_step || 0,
        completionPercentage:
          userData.user_profiles?.[0]?.completion_percentage || 0,
        avatarUrl: userData.user_profiles?.[0]?.avatar_url,
        isVerified: userData.user_profiles?.[0]?.is_verified || false,
        createdAt: userData.created_at,
        organizationId,
      };
    } catch (error) {
      console.error('Error building user profile:', error);
      return this.createProfileFromAuthUser(user);
    }
  }

  /**
   * Create minimal profile from auth user (fallback)
   */
  private createProfileFromAuthUser(user: User): UserProfile {
    const metadata = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email!,
      firstName: metadata['first_name'] || 'User',
      lastName: metadata['last_name'] || '',
      phone: metadata['phone'],
      userType: metadata['user_type'] || 'sme',
      profileStep: 0,
      completionPercentage: 0,
      isVerified: false,
      createdAt: user.created_at,
      organizationId: undefined,
    };
  }

  async testOrgIdLookup(): Promise<void> {
    const user = this.userSubject();
    if (!user) {
      console.log('❌ No user');
      return;
    }

    const orgId = await this.getUserOrganizationId(user.id);
    console.log('🔍 Org ID lookup result:', orgId);
    console.log('📊 Current user in signal:', user);
  }
  /**
   * Get user's organization ID
   */
  /**
   * Get user's organization ID - bypasses recursive RLS policy
   * Uses maybeSingle() with explicit filtering to avoid policy recursion
   */
  private async getUserOrganizationId(
    userId: string
  ): Promise<string | undefined> {
    try {
      console.log('🔍 Fetching org ID for user:', userId);

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

      console.log('✅ Organization ID found:', data.organization_id);
      return data.organization_id;
    } catch (error: any) {
      console.error(
        '❌ Unexpected error in getUserOrganizationId:',
        error?.message
      );
      return undefined;
    }
  }

  // ALTERNATIVE: If single() still fails, use this service-level query
  // This bypasses RLS entirely by using Supabase Admin API
  private async getUserOrganizationIdAdmin(
    userId: string
  ): Promise<string | undefined> {
    try {
      // If you have access to admin client, use it:
      // const { data } = await this.supabaseService.admin
      //   .from('organization_users')
      //   .select('organization_id')
      //   .eq('user_id', userId)
      //   .eq('status', 'active')
      //   .single();

      // For now, return undefined and we'll fix the RLS policy
      return undefined;
    } catch (error: any) {
      console.error('Admin query failed:', error?.message);
      return undefined;
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    console.log('🔓 Starting sign out...');

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
    // If still initializing, wait for completion
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

    console.log('🔄 Attempting to recover organization for user:', user.id);

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
            console.log(
              '✅ User organization recovered:',
              result.organizationId
            );
          }
        }),
        catchError((error) => {
          console.error('❌ Organization recovery failed:', error);
          return of({ success: false });
        }),
        takeUntil(this.destroy$)
      );
  }

  // ===================================
  // ORGANIZATION UTILITIES
  // ===================================

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
    console.info(user);
    return user?.organizationId || null;
  }

  // ===================================
  // LEGACY COMPATIBILITY METHODS
  // ===================================

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
    console.log('🧹 Clearing auth state');
    this.userSubject.set(null);
    this.loadingState.set({
      registration: false,
      login: false,
      initialization: false,
      sessionUpdate: false,
    });
  }

  /**
   * Check if error is transient (lock timeout, etc)
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
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
