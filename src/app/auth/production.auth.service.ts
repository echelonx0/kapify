// src/app/auth/enhanced-production.auth.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, of, throwError, timer } from 'rxjs';
import { map, catchError, timeout, tap, finalize, switchMap } from 'rxjs/operators'; 
import { SharedSupabaseService } from '../shared/services/shared-supabase.service';
import { RegistrationTransactionService, RegistrationTransactionResult } from '../shared/services/registration-transaction.service';
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

// Enhanced loading state management
interface LoadingState {
  registration: boolean;
  login: boolean;
  initialization: boolean;
  sessionUpdate: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private supabaseService = inject(SharedSupabaseService);
  private registrationTransaction = inject(RegistrationTransactionService);
  
  // Reactive state
  private userSubject = new BehaviorSubject<UserProfile | null>(null);
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  
  // Enhanced loading state management
  private loadingState = signal<LoadingState>({
    registration: false,
    login: false,
    initialization: true,
    sessionUpdate: false
  });
  
  // Signals for component consumption
  user = signal<UserProfile | null>(null);
  session = signal<Session | null>(null);
  
  // Computed loading states for different operations
  isInitializing = computed(() => this.loadingState().initialization);
  isLoggingIn = computed(() => this.loadingState().login);
  isRegistering = computed(() => this.loadingState().registration);
  isSessionUpdating = computed(() => this.loadingState().sessionUpdate);
  
  // Overall loading state (true if ANY operation is loading)
  isLoading = computed(() => {
    const state = this.loadingState();
    return state.registration || state.login || state.initialization || state.sessionUpdate;
  });
  
  isAuthenticated = computed(() => !!this.user());

  // Observables for reactive programming
  user$ = this.userSubject.asObservable();
  session$ = this.sessionSubject.asObservable();
  isAuthenticated$ = this.user$.pipe(map(user => !!user));

  constructor() {
    this.initializeAuth();
  }

  // ===============================
  // ENHANCED INITIALIZATION
  // ===============================

  private async initializeAuth(): Promise<void> {
    console.log('Starting enhanced auth initialization...');
    
    this.updateLoadingState({ initialization: true });

    try {
      // Wait for Supabase client to be ready
      await this.supabaseService.getClient();
      
      // Get initial session with timeout
      const sessionResult = await Promise.race([
        this.supabaseService.auth.getSession(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session initialization timeout')), 10000)
        )
      ]) as any;

      const { data: { session }, error } = sessionResult;
      
      if (error) {
        if (this.isLockTimeoutError(error)) {
          console.warn('Lock timeout during initialization, continuing without session');
          this.clearAuthState();
        } else {
          console.error('Session initialization error:', error);
          this.clearAuthState();
        }
      } else if (session?.user) {
        await this.establishUserSession(session);
      } else {
        this.clearAuthState();
      }

      // Set up auth state change listener
      this.supabaseService.auth.onAuthStateChange(async (event, session) => {
        try {
          console.log('Auth state changed:', event);
          
          if (session?.user) {
            await this.establishUserSession(session);
          } else {
            this.clearAuthState();
            if (event === 'SIGNED_OUT') {
              this.router.navigate(['/auth/login']);
            }
          }
        } catch (stateChangeError: any) {
          console.error('Error in auth state change handler:', stateChangeError);
          if (!this.isLockTimeoutError(stateChangeError)) {
            // Only clear state if it's not a lock timeout
            this.clearAuthState();
          }
        }
      });

    } catch (error: any) {
      console.error('Auth initialization failed:', error);
      this.clearAuthState();
    } finally {
      this.updateLoadingState({ initialization: false });
      console.log('Auth initialization completed');
    }
  }

  // ===============================
  // ENHANCED REGISTRATION
  // ===============================

 
// Fix 2: Synchronous loading state updates
register(credentials: RegisterRequest): Observable<AuthOperationResult> {
  console.log('Starting enhanced registration process...');
  
  this.updateLoadingState({ registration: true });

  const validationError = this.validateRegistrationInput(credentials);
  if (validationError) {
    this.updateLoadingState({ registration: false });
    return of({
      user: null,
      error: validationError,
      organizationCreated: false,
      success: false
    });
  }

  return this.registrationTransaction.executeRegistrationTransaction(credentials).pipe(
    timeout(60000),
    tap(result => {
      if (result.success && result.user) {
        console.log('Registration transaction completed, updating auth state');
        this.updateAuthStateFromTransaction(result);
      }
    }),
    map(result => this.mapTransactionResultToAuthResult(result)),
    catchError(error => {
      console.error('Registration failed:', error);
      const errorResult = this.createAuthErrorResult(error);
      return of(errorResult); // Return of() instead of throwError()
    }),
    finalize(() => {
      this.updateLoadingState({ registration: false });
    })
  );
}


  private validateRegistrationInput(credentials: RegisterRequest): string | null {
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

  private updateAuthStateFromTransaction(result: RegistrationTransactionResult): void {
    if (result.user && result.organizationId) {
      const userProfile = result.user;
      userProfile.organizationId = result.organizationId;
      
      this.user.set(userProfile);
      this.userSubject.next(userProfile);
      
      console.log('Auth state updated with registration result');
    }
  }

  private mapTransactionResultToAuthResult(result: RegistrationTransactionResult): AuthOperationResult {
    return {
      user: result.success ? result.user : null,
      error: result.success ? null : (result.error || 'Registration failed'),
      organizationId: result.organizationId,
      organizationCreated: !!result.organizationId,
      success: result.success
    };
  }

  // ===============================
  // ENHANCED LOGIN
  // ===============================

  login(credentials: LoginRequest): Observable<AuthOperationResult> {
    console.log('Starting enhanced login process...');
    
    this.updateLoadingState({ login: true });

    return from(this.performLogin(credentials.email, credentials.password)).pipe(
      timeout(30000), // 30 second timeout for login
      tap(result => {
        if (result.user) {
          console.log('Login completed successfully');
        }
      }),
      catchError(error => {
        console.error('Login failed:', error);
        return throwError(() => this.createAuthErrorResult(error));
      }),
      finalize(() => {
        this.updateLoadingState({ login: false });
      })
    );
  }

  private async performLogin(email: string, password: string): Promise<AuthOperationResult> {
    try {
      const loginResult = await Promise.race([
        this.supabaseService.auth.signInWithPassword({ email, password }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Login timeout')), 25000)
        )
      ]);

      const { data, error } = loginResult;

      if (error) {
        throw new Error(this.createLoginErrorMessage(error));
      }

      if (!data.user) {
        throw new Error('Login failed - no user data returned');
      }

      // Build user profile with organization context
      const userProfile = await this.buildUserProfile(data.user);

      // Update auth state
      this.session.set(data.session);
      this.sessionSubject.next(data.session);
      this.user.set(userProfile);
      this.userSubject.next(userProfile);

      return {
        user: userProfile,
        error: null,
        organizationId: userProfile.organizationId,
        organizationCreated: !!userProfile.organizationId,
        success: true
      };

    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  private createLoginErrorMessage(error: any): string {
    if (error.message?.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (error.message?.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link before logging in.';
    }
    if (error.message?.includes('too many requests')) {
      return 'Too many login attempts. Please wait a few minutes before trying again.';
    }
    return error.message || 'Login failed. Please try again.';
  }

  // ===============================
  // SESSION MANAGEMENT
  // ===============================

  private async establishUserSession(session: Session): Promise<void> {
    console.log('Establishing user session...');
    
    this.updateLoadingState({ sessionUpdate: true });

    try {
      this.session.set(session);
      this.sessionSubject.next(session);

      const userProfile = await this.buildUserProfile(session.user);
      this.user.set(userProfile);
      this.userSubject.next(userProfile);

      console.log('User session established:', userProfile.email);
    } catch (error) {
      console.error('Failed to establish user session:', error);
      this.clearAuthState();
      throw error;
    } finally {
      this.updateLoadingState({ sessionUpdate: false });
    }
  }

  private async buildUserProfile(user: User): Promise<UserProfile> {
    try {
      // Get user data with organization context
      const { data: userData, error } = await this.supabaseService
        .from('users')
        .select(`
          *,
          user_profiles (
            profile_step,
            completion_percentage,
            avatar_url,
            is_verified
          )
        `)
        .eq('id', user.id)
        .single();

      if (error || !userData) {
        console.warn('User data not found, creating from auth user');
        return this.createProfileFromAuthUser(user);
      }

      // Get organization ID
      const organizationId = await this.getUserOrganizationId(user.id);

      return {
        id: user.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        phone: userData.phone,
        userType: userData.user_type,
        profileStep: userData.user_profiles?.[0]?.profile_step || 0,
        completionPercentage: userData.user_profiles?.[0]?.completion_percentage || 0,
        avatarUrl: userData.user_profiles?.[0]?.avatar_url,
        isVerified: userData.user_profiles?.[0]?.is_verified || false,
        createdAt: userData.created_at,
        organizationId
      };

    } catch (error) {
      console.error('Error building user profile:', error);
      return this.createProfileFromAuthUser(user);
    }
  }

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
      organizationId: undefined
    };
  }

  private async getUserOrganizationId(userId: string): Promise<string | undefined> {
    try {
      const { data, error } = await this.supabaseService
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        return undefined;
      }

      return data.organization_id;
    } catch (error) {
      console.error('Error getting user organization ID:', error);
      return undefined;
    }
  }

  // ===============================
  // LOGOUT
  // ===============================

  async signOut(): Promise<void> {
    console.log('Starting sign out process...');
    
    try {
      const { error } = await this.supabaseService.auth.signOut();
      if (error && !this.isLockTimeoutError(error)) {
        console.error('SignOut error:', error);
      }
    } catch (error: any) {
      if (!this.isLockTimeoutError(error)) {
        console.error('SignOut failed:', error);
      }
    } finally {
      this.clearAuthState();
      this.router.navigate(['/auth/login']);
    }
  }

  // ===============================
  // STATE MANAGEMENT UTILITIES
  // ===============================

  private updateLoadingState(updates: Partial<LoadingState>): void {
    const current = this.loadingState();
    this.loadingState.set({ ...current, ...updates });
  }

  private clearAuthState(): void {
    console.log('Clearing auth state');
    this.user.set(null);
    this.session.set(null);
    this.userSubject.next(null);
    this.sessionSubject.next(null);
    
    // Reset all loading states
    this.loadingState.set({
      registration: false,
      login: false,
      initialization: false,
      sessionUpdate: false
    });
  }

  private isLockTimeoutError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return message.includes('lock') || 
           message.includes('navigatorlockacquiretimeouterror') ||
           message.includes('timeout');
  }

 private createAuthErrorResult(error: any): AuthOperationResult {
  let errorMessage = 'Operation failed. Please try again.';
  
  const errorString = error.message?.toLowerCase() || '';
  
  if (errorString.includes('timeout')) {
    errorMessage = 'The operation timed out. Please check your connection and try again.';
  } else if (errorString.includes('navigatorlockacquiretimeouterror') || errorString.includes('lock')) {
    errorMessage = 'A temporary system issue occurred. Please try again in a moment.';
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  return {
    user: null,
    error: errorMessage,
    organizationCreated: false,
    success: false
  };
}


  // ===============================
  // ORGANIZATION UTILITIES
  // ===============================

  userHasOrganization(): boolean {
    const user = this.user();
    return !!(user?.organizationId);
  }

  getCurrentUserOrganizationId(): string | null {
    const user = this.user();
    return user?.organizationId || null;
  }

  // ===============================
  // RECOVERY UTILITIES
  // ===============================

  // Check if current user needs organization recovery
  async checkCurrentUserNeedsOrganizationRecovery(): Promise<boolean> {
    const user = this.user();
    if (!user || user.organizationId) {
      return false;
    }

    try {
      const recoveryCheck = await this.registrationTransaction.checkUserNeedsRecovery(user.id);
      return recoveryCheck.needsRecovery && recoveryCheck.missingComponents.includes('organization');
    } catch (error) {
      console.error('Error checking organization recovery needs:', error);
      return false;
    }
  }

  // Recover organization for existing user (migration utility)
  recoverUserOrganization(): Observable<{ success: boolean; organizationId?: string }> {
    const user = this.user();
    if (!user) {
      return throwError(() => new Error('No authenticated user'));
    }

    if (user.organizationId) {
      return of({ success: true, organizationId: user.organizationId });
    }

    console.log('Attempting to recover organization for user:', user.id);

    const credentials: RegisterRequest = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      password: '', // Not needed for recovery
      confirmPassword: '',
      userType: user.userType as 'sme' | 'funder',
      agreeToTerms: true
    };

    // Create just the organization part
    return this.registrationTransaction.executeRegistrationTransaction(credentials).pipe(
      map(result => ({
        success: result.success,
        organizationId: result.organizationId
      })),
      tap(result => {
        if (result.success && result.organizationId) {
          // Update current user with organization ID
          const updatedUser = { ...user, organizationId: result.organizationId };
          this.user.set(updatedUser);
          this.userSubject.next(updatedUser);
          console.log('User organization recovered:', result.organizationId);
        }
      }),
      catchError(error => {
        console.error('Organization recovery failed:', error);
        return of({ success: false });
      })
    );
  }

  // ===============================
  // LEGACY COMPATIBILITY METHODS
  // ===============================

  // Legacy signUp method - delegates to new register method
  signUp(credentials: SignUpData): Observable<AuthOperationResult> {
    const registerRequest: RegisterRequest = {
      firstName: credentials.firstName,
      lastName: credentials.lastName,
      email: credentials.email,
      phone: credentials.phone,
      password: credentials.password,
      confirmPassword: credentials.password, // Assume they match for legacy calls
      userType: credentials.userType as 'sme' | 'funder',
      agreeToTerms: true // Assume consent for legacy calls
    };

    return this.register(registerRequest);
  }

  // Legacy method for getting access token
  getAccessToken(): string | null {
    const session = this.session();
    return session?.access_token || null;
  }

  // Legacy loading state for backward compatibility
  get isLoading$(): Observable<boolean> {
    return of(this.isLoading());
  }
}