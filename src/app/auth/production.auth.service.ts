// src/app/auth/production.auth.service.ts - ENHANCED WITH ORGANIZATION CREATION
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, from, of, throwError, timer } from 'rxjs';
import { map, catchError, timeout, retry, tap, finalize } from 'rxjs/operators'; 
import { SharedSupabaseService } from '../shared/services/shared-supabase.service';
import { OrganizationSetupService } from '../shared/services/organization-setup.service';
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
  organizationId?: string; // Add organization context
}

export interface RegistrationResult {
  user: UserProfile | null;
  error: string | null;
  organizationId?: string;
  organizationCreated?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private supabaseService = inject(SharedSupabaseService);
  private organizationSetupService = inject(OrganizationSetupService);
  
  // Reactive state
  private userSubject = new BehaviorSubject<UserProfile | null>(null);
  private sessionSubject = new BehaviorSubject<Session | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(true);
  
  // Signals for component consumption
  user = signal<UserProfile | null>(null);
  session = signal<Session | null>(null);
  isLoading = signal<boolean>(true);
  isAuthenticated = computed(() => !!this.user());

  // Observables for reactive programming
  user$ = this.userSubject.asObservable();
  session$ = this.sessionSubject.asObservable();
  isLoading$ = this.loadingSubject.asObservable();
  isAuthenticated$ = this.user$.pipe(map(user => !!user));

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      console.log('Initializing auth...');
      
      // Wait for Supabase client to be ready
      await this.supabaseService.getClient();
      
      // Use timeout for the session request
      const sessionResult = await Promise.race([
        this.supabaseService.auth.getSession(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session request timeout')), 5000)
        )
      ]) as any;

      const { data: { session }, error } = sessionResult;
      
      if (error) {
        if (error.message?.includes('NavigatorLockAcquireTimeoutError') || 
            error.message?.includes('lock')) {
          console.warn('Lock timeout occurred, continuing without session');
          this.clearAuthState();
          return;
        }
        console.error('Session initialization error:', error);
        this.clearAuthState();
        return;
      }

      if (session?.user) {
        await this.setUserSession(session);
      } else {
        this.clearAuthState();
      }

      // Set up auth state change listener with error handling
      this.supabaseService.auth.onAuthStateChange(async (event, session) => {
        try {
          console.log('Auth state changed:', event, session?.user?.email);
          
          if (session?.user) {
            await this.setUserSession(session);
          } else {
            this.clearAuthState();
            if (event === 'SIGNED_OUT') {
              this.router.navigate(['/auth/login']);
            }
          }
        } catch (stateChangeError: any) {
          console.error('Error in auth state change handler:', stateChangeError);
          if (stateChangeError?.message?.includes('lock')) {
            console.warn('Lock error in state change, continuing...');
          }
        }
      });

    } catch (error: any) {
      if (error.message?.includes('NavigatorLockAcquireTimeoutError') || 
          error.message?.includes('lock') ||
          error.message?.includes('timeout')) {
        console.warn('Auth initialization timeout/lock error, continuing without session');
      } else {
        console.error('Auth initialization failed:', error);
      }
      this.clearAuthState();
    } finally {
      this.isLoading.set(false);
      this.loadingSubject.next(false);
    }
  }

  // ===============================
  // ENHANCED REGISTRATION WITH ORGANIZATION CREATION
  // ===============================

  register(credentials: RegisterRequest): Observable<RegistrationResult> {
    return from(this.performEnhancedRegister(credentials)).pipe(
      timeout(45000), // Increased timeout for organization creation
      retry({
        count: 2,
        delay: (error) => {
          if (error.message?.includes('lock') || error.message?.includes('timeout')) {
            return timer(1000);
          }
          throw error;
        }
      }),
      catchError(error => {
        console.error('Register error:', error);
        let errorMessage = 'Registration failed';
        
        if (error.message?.includes('lock')) {
          errorMessage = 'Registration is temporarily unavailable. Please try again.';
        } else if (error.message?.includes('timeout')) {
          errorMessage = 'Registration timed out. Please check your connection and try again.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        return throwError(() => ({
          user: null,
          error: errorMessage,
          organizationCreated: false
        }));
      })
    );
  }

  private async performEnhancedRegister(credentials: RegisterRequest): Promise<RegistrationResult> {
    console.log('Starting enhanced registration process...');
    
    // Validate terms agreement
    if (!credentials.agreeToTerms) {
      throw new Error('You must agree to the terms and conditions');
    }

    // Validate password confirmation
    if (credentials.password !== credentials.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    try {
      // 1. Create Supabase auth user
      console.log('Creating Supabase auth user...');
      
      const authResult = await Promise.race([
        this.supabaseService.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: {
              first_name: credentials.firstName,
              last_name: credentials.lastName,
              phone: credentials.phone,
              user_type: credentials.userType,
              company_name: credentials.companyName
            }
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth signup timeout')), 20000)
        )
      ]) as any;

      const { data: authData, error: authError } = authResult;

      if (authError) {
        console.error('Supabase auth error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user returned from Supabase');
      }

      console.log('Supabase auth user created:', authData.user.id);

      // 2. Create user profile in database
      console.log('Creating user profile in database...');
      const { error: profileError } = await this.supabaseService
        .from('users')
        .insert({
          id: authData.user.id,
          email: credentials.email,
          first_name: credentials.firstName,
          last_name: credentials.lastName,
          phone: credentials.phone,
          user_type: credentials.userType,
          company_name: credentials.companyName,
          status: 'active',
          email_verified: false
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      console.log('User profile created successfully');

      // 3. Create user_profile entry
      console.log('Creating user profile metadata...');
      const { error: userProfileError } = await this.supabaseService
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          display_name: `${credentials.firstName} ${credentials.lastName}`,
          profile_step: 0,
          completion_percentage: 0,
          is_active: true,
          is_verified: false
        });

      if (userProfileError) {
        console.error('User profile metadata creation failed:', userProfileError);
        console.log('User profile metadata can be created later');
      } else {
        console.log('User profile metadata created successfully');
      }

      // 4. CREATE ORGANIZATION - This is the key addition
      console.log('Creating organization for user...');
      let organizationId: string | undefined;
      let organizationCreated = false;

      try {
        const orgSetupResult = await this.organizationSetupService.createOrganizationForUser({
          userId: authData.user.id,
          userType: credentials.userType,
          firstName: credentials.firstName,
          lastName: credentials.lastName,
          email: credentials.email,
          phone: credentials.phone,
          companyName: credentials.companyName
        }).toPromise();

        if (orgSetupResult?.success) {
          organizationId = orgSetupResult.organization.id;
          organizationCreated = true;
          console.log('Organization created successfully:', organizationId);
        } else {
          console.warn('Organization creation failed:', orgSetupResult?.message);
        }
      } catch (orgError: any) {
        console.error('Organization creation failed:', orgError);
        // Don't fail registration if org creation fails - user can complete later
        console.log('Registration will continue without organization');
      }

      // 5. Build and return user profile with organization context
      console.log('Building enhanced user profile object...');
      const userProfile = await this.buildEnhancedUserProfile(authData.user, organizationId);
      
      console.log('Enhanced registration completed successfully!');
      return {
        user: userProfile,
        error: null,
        organizationId,
        organizationCreated
      };

    } catch (error: any) {
      console.error('Enhanced registration failed:', error);
      throw error;
    }
  }

  // ===============================
  // ENHANCED USER PROFILE BUILDING
  // ===============================

  private async buildEnhancedUserProfile(user: User, organizationId?: string): Promise<UserProfile> {
    try {
      const { data: userRecord, error: userError } = await this.supabaseService
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

      if (userError || !userRecord) {
        console.warn('User record not found, creating from auth data');
        return this.createEnhancedProfileFromAuthUser(user, organizationId);
      }

      // If no organizationId provided, try to get it from database
      let finalOrganizationId = organizationId;
      if (!finalOrganizationId) {
        const orgResult = await this.getUserOrganizationId(user.id);
        finalOrganizationId = orgResult || undefined;
      }

      return {
        id: user.id,
        email: userRecord.email,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        phone: userRecord.phone,
        userType: userRecord.user_type,
        profileStep: userRecord.user_profiles?.[0]?.profile_step || 0,
        completionPercentage: userRecord.user_profiles?.[0]?.completion_percentage || 0,
        avatarUrl: userRecord.user_profiles?.[0]?.avatar_url,
        isVerified: userRecord.user_profiles?.[0]?.is_verified || false,
        createdAt: userRecord.created_at,
        organizationId: finalOrganizationId
      };

    } catch (error) {
      console.error('Error building enhanced user profile:', error);
      return this.createEnhancedProfileFromAuthUser(user, organizationId);
    }
  }

  private createEnhancedProfileFromAuthUser(user: User, organizationId?: string): UserProfile {
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
      organizationId
    };
  }

  private async getUserOrganizationId(userId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabaseService
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data.organization_id;
    } catch (error) {
      console.error('Error getting user organization ID:', error);
      return null;
    }
  }

  // ===============================
  // ENHANCED LOGIN WITH ORGANIZATION CONTEXT
  // ===============================

login(credentials: LoginRequest): Observable<RegistrationResult> {
  this.isLoading.set(true); // 🔹 start loading immediately

  return from(this.performEnhancedLogin(credentials.email, credentials.password)).pipe(
    timeout(15000),
    retry({
      count: 2,
      delay: (error) => {
        if (error.message?.includes('lock') || error.message?.includes('timeout')) {
          return timer(1000);
        }
        throw error;
      }
    }),
    tap(result => {
      // if login succeeds, update signals
      if (result.user) {
        this.user.set(result.user);
        this.userSubject.next(result.user);
        this.session.set((result as any).session ?? null); // optional
      }
    }),
    catchError(error => {
      console.error('Login error:', error);
      let errorMessage = 'Login failed';
      
      if (error.message?.includes('lock')) {
        errorMessage = 'Login is temporarily unavailable. Please try again.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Login timed out. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return throwError(() => ({
        user: null,
        error: errorMessage,
        organizationCreated: false
      }));
    }),
    finalize(() => {
      this.isLoading.set(false); // 🔹 stop loading when request finishes (success or error)
    })
  );
}


  private async performEnhancedLogin(email: string, password: string): Promise<RegistrationResult> {
    const loginResult = await Promise.race([
      this.supabaseService.auth.signInWithPassword({
        email,
        password
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 10000)
      )
    ]) as any;

    const { data, error } = loginResult;

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Login failed');
    }

    // Build enhanced user profile with organization context
    const userProfile = await this.buildEnhancedUserProfile(data.user);

    return {
      user: userProfile,
      error: null,
      organizationId: userProfile.organizationId,
      organizationCreated: !!userProfile.organizationId
    };
  }

  // ===============================
  // ORGANIZATION UTILITIES
  // ===============================

  // Check if current user has organization
  userHasOrganization(): boolean {
    const user = this.user();
    return !!(user?.organizationId);
  }

  // Get current user's organization ID
  getCurrentUserOrganizationId(): string | null {
    const user = this.user();
    return user?.organizationId || null;
  }

  // Ensure current user has organization (migration utility)
  ensureCurrentUserHasOrganization(): Observable<{ success: boolean; organizationId?: string }> {
    const user = this.user();
    if (!user) {
      return throwError(() => new Error('No authenticated user'));
    }

    if (user.organizationId) {
      return of({ success: true, organizationId: user.organizationId });
    }

    // Create organization for existing user
    console.log('Creating organization for existing user:', user.id);
    
    return this.organizationSetupService.createOrganizationForUser({
      userId: user.id,
      userType: user.userType as 'sme' | 'funder' | 'consultant',
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone
    }).pipe(
      tap(result => {
        if (result.success) {
          // Update current user with organization ID
          const updatedUser = { ...user, organizationId: result.organization.id };
          this.user.set(updatedUser);
          this.userSubject.next(updatedUser);
          console.log('User organization context updated:', result.organization.id);
        }
      }),
      map(result => ({
        success: result.success,
        organizationId: result.organization?.id
      }))
    );
  }

  // ===============================
  // EXISTING METHODS (Updated with organization context)
  // ===============================

  // Legacy signUp method with organization creation
  signUp(credentials: SignUpData): Observable<RegistrationResult> {
    return from(this.performEnhancedSignUp(credentials)).pipe(
      timeout(45000),
      catchError(error => {
        console.error('SignUp error:', error);
        return throwError(() => ({
          user: null,
          error: error.message || 'Registration failed',
          organizationCreated: false
        }));
      })
    );
  }

  private async performEnhancedSignUp(credentials: SignUpData): Promise<RegistrationResult> {
    const { data: authData, error: authError } = await this.supabaseService.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          first_name: credentials.firstName,
          last_name: credentials.lastName,
          phone: credentials.phone,
          user_type: credentials.userType
        }
      }
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // Create user profile
    const { error: profileError } = await this.supabaseService
      .from('users')
      .insert({
        id: authData.user.id,
        email: credentials.email,
        first_name: credentials.firstName,
        last_name: credentials.lastName,
        phone: credentials.phone,
        user_type: credentials.userType,
        status: 'active',
        email_verified: false
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    const { error: userProfileError } = await this.supabaseService
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        display_name: `${credentials.firstName} ${credentials.lastName}`,
        profile_step: 0,
        completion_percentage: 0,
        is_active: true,
        is_verified: false
      });

    if (userProfileError) {
      console.error('User profile creation error:', userProfileError);
    }

    // Create organization
    let organizationId: string | undefined;
    let organizationCreated = false;

    try {
      const orgSetupResult = await this.organizationSetupService.createOrganizationForUser({
        userId: authData.user.id,
        userType: credentials.userType,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        email: credentials.email,
        phone: credentials.phone
      }).toPromise();

      if (orgSetupResult?.success) {
        organizationId = orgSetupResult.organization.id;
        organizationCreated = true;
        console.log('Organization created for signUp user:', organizationId);
      }
    } catch (orgError: any) {
      console.error('Organization creation failed in signUp:', orgError);
    }

    return {
      user: await this.buildEnhancedUserProfile(authData.user, organizationId),
      error: null,
      organizationId,
      organizationCreated
    };
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabaseService.auth.signOut();
      if (error && !error.message?.includes('lock')) {
        console.error('SignOut error:', error);
      }
      this.clearAuthState();
      this.router.navigate(['/auth/login']);
    } catch (error: any) {
      if (!error.message?.includes('lock')) {
        console.error('SignOut failed:', error);
      }
      this.clearAuthState();
    }
  }

  private async setUserSession(session: Session): Promise<void> {
    try {
      this.session.set(session);
      this.sessionSubject.next(session);

      const userProfile = await this.buildEnhancedUserProfile(session.user);
      this.user.set(userProfile);
      this.userSubject.next(userProfile);

      console.log('Enhanced user session established:', userProfile.email);
    } catch (error) {
      console.error('Failed to set user session:', error);
      this.clearAuthState();
    }
  }

  private clearAuthState(): void {
    this.user.set(null);
    this.session.set(null);
    this.userSubject.next(null);
    this.sessionSubject.next(null);
  }

  getAccessToken(): string | null {
    const session = this.session();
    return session?.access_token || null;
  }
}