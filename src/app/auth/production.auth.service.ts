// // src/app/auth/production.auth.service.ts - FINAL FIX
// // Remove the broken import and clean up the code

// import { Injectable, signal, computed, inject } from '@angular/core';
// import { Router } from '@angular/router';
// import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
// import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
// import { map, catchError } from 'rxjs/operators';
// import { environment } from '../../environments/environment';

// // ❌ REMOVE THIS BROKEN LINE:
// // import { handleProfileError } from '../shared/utils/profileErrorHandler';

// export interface SignUpData {
//   email: string;
//   password: string;
//   firstName: string;
//   lastName: string;
//   phone?: string;
//   userType: 'sme' | 'funder' | 'consultant';
// }

// export interface RegisterRequest {
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone?: string;
//   password: string;
//   confirmPassword: string;
//   userType: 'sme' | 'funder';
//   companyName?: string;
//   agreeToTerms: boolean;
// }

// export interface LoginRequest {
//   email: string;
//   password: string;
// }

// export interface UserProfile {
//   id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   phone?: string;
//   userType: string;
//   profileStep: number;
//   completionPercentage: number;
//   avatarUrl?: string;
//   isVerified: boolean;
//   createdAt: string;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
//   private router = inject(Router);
//   private supabase: SupabaseClient;
  
//   // Reactive state
//   private userSubject = new BehaviorSubject<UserProfile | null>(null);
//   private sessionSubject = new BehaviorSubject<Session | null>(null);
//   private loadingSubject = new BehaviorSubject<boolean>(true);
  
//   // Signals for component consumption
//   user = signal<UserProfile | null>(null);
//   session = signal<Session | null>(null);
//   isLoading = signal<boolean>(true);
//   isAuthenticated = computed(() => !!this.user());

//   // Observables for reactive programming
//   user$ = this.userSubject.asObservable();
//   session$ = this.sessionSubject.asObservable();
//   isLoading$ = this.loadingSubject.asObservable();
//   isAuthenticated$ = this.user$.pipe(map(user => !!user));

//   constructor() {
//     console.log('🔌 Initializing Supabase with:');
//     console.log('URL:', environment.supabaseUrl);
//     console.log('Key length:', environment.supabaseAnonKey?.length);
    
//     this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
//       auth: {
//         debug: true,
//         persistSession: true,
//       }
//     });
//     this.initializeAuth();
//   }

//   private async initializeAuth(): Promise<void> {
//     try {
//       const { data: { session }, error } = await this.supabase.auth.getSession();
      
//       if (error) {
//         console.error('Session initialization error:', error);
//         this.clearAuthState();
//         return;
//       }

//       if (session?.user) {
//         await this.setUserSession(session);
//       } else {
//         this.clearAuthState();
//       }

//       this.supabase.auth.onAuthStateChange(async (event, session) => {
//         console.log('Auth state changed:', event, session?.user?.email);
        
//         if (session?.user) {
//           await this.setUserSession(session);
//         } else {
//           this.clearAuthState();
//           if (event === 'SIGNED_OUT') {
//             this.router.navigate(['/auth/login']);
//           }
//         }
//       });

//     } catch (error) {
//       console.error('Auth initialization failed:', error);
//       this.clearAuthState();
//     } finally {
//       this.isLoading.set(false);
//       this.loadingSubject.next(false);
//     }
//   }

//   // Register method with detailed logging
//   register(credentials: RegisterRequest): Observable<{ user: UserProfile | null; error: string | null }> {
//     return from(this.performRegister(credentials)).pipe(
//       catchError(error => {
//         console.error('❌ Register error:', error);
//         return throwError(() => ({
//           user: null,
//           error: error.message || 'Registration failed'
//         }));
//       })
//     );
//   }

//   private async performRegister(credentials: RegisterRequest) {
//     console.log('🚀 Starting registration process...');
    
//     // Validate terms agreement
//     if (!credentials.agreeToTerms) {
//       throw new Error('You must agree to the terms and conditions');
//     }

//     // Validate password confirmation
//     if (credentials.password !== credentials.confirmPassword) {
//       throw new Error('Passwords do not match');
//     }

//     try {
//       // 1. Create Supabase auth user
//       console.log('👤 Creating Supabase auth user...');
//       const { data: authData, error: authError } = await this.supabase.auth.signUp({
//         email: credentials.email,
//         password: credentials.password,
//         options: {
//           data: {
//             first_name: credentials.firstName,
//             last_name: credentials.lastName,
//             phone: credentials.phone,
//             user_type: credentials.userType,
//             company_name: credentials.companyName
//           }
//         }
//       });

//       if (authError) {
//         console.error('❌ Supabase auth error:', authError);
//         throw new Error(`Authentication failed: ${authError.message}`);
//       }

//       if (!authData.user) {
//         throw new Error('User creation failed - no user returned from Supabase');
//       }

//       console.log('✅ Supabase auth user created:', authData.user.id);

//       // 2. Create user profile in database
//       console.log('📝 Creating user profile in database...');
//       const { error: profileError } = await this.supabase
//         .from('users')
//         .insert({
//           id: authData.user.id,
//           email: credentials.email,
//           first_name: credentials.firstName,
//           last_name: credentials.lastName,
//           phone: credentials.phone,
//           user_type: credentials.userType,
//           company_name: credentials.companyName,
//           status: 'active', // Changed from 'pending_verification' to 'active'
//           email_verified: false
//         });

//       if (profileError) {
//         console.error('❌ Profile creation error:', profileError);
//         throw new Error(`Failed to create user profile: ${profileError.message}`);
//       }

//       console.log('✅ User profile created successfully');

//       // 3. Create user_profile entry (optional)
//       console.log('📋 Creating user profile metadata...');
//       const { error: userProfileError } = await this.supabase
//         .from('user_profiles')
//         .insert({
//           user_id: authData.user.id,
//           display_name: `${credentials.firstName} ${credentials.lastName}`,
//           profile_step: 0,
//           completion_percentage: 0,
//           is_active: true,
//           is_verified: false
//         });

//       if (userProfileError) {
//         console.error('⚠️ User profile metadata creation failed:', userProfileError);
//         // Don't throw error here - this is non-critical
//         console.log('💡 User profile metadata can be created later');
//       } else {
//         console.log('✅ User profile metadata created successfully');
//       }

//       // 4. Build and return user profile
//       console.log('🏗️ Building user profile object...');
//       const userProfile = await this.buildUserProfile(authData.user);
      
//       console.log('🎉 Registration completed successfully!');
//       return {
//         user: userProfile,
//         error: null
//       };

//     } catch (error: any) {
//       console.error('💥 Registration failed:', error);
//       throw error;
//     }
//   }

//   // Login method
//   login(credentials: LoginRequest): Observable<{ user: UserProfile | null; error: string | null }> {
//     return from(this.performLogin(credentials.email, credentials.password)).pipe(
//       catchError(error => {
//         console.error('Login error:', error);
//         return throwError(() => ({
//           user: null,
//           error: error.message || 'Login failed'
//         }));
//       })
//     );
//   }

//   private async performLogin(email: string, password: string) {
//     const { data, error } = await this.supabase.auth.signInWithPassword({
//       email,
//       password
//     });

//     if (error) {
//       throw new Error(error.message);
//     }

//     if (!data.user) {
//       throw new Error('Login failed');
//     }

//     return {
//       user: await this.buildUserProfile(data.user),
//       error: null
//     };
//   }

//   // ✅ REMOVE ALL REFERENCES TO handleProfileError
//   // Legacy signUp method (keeping for compatibility)
//   signUp(credentials: SignUpData): Observable<{ user: UserProfile | null; error: string | null }> {
//     return from(this.performSignUp(credentials)).pipe(
//       catchError(error => {
//         console.error('SignUp error:', error);
//         return throwError(() => ({
//           user: null,
//           error: error.message || 'Registration failed'
//         }));
//       })
//     );
//   }

//   private async performSignUp(credentials: SignUpData) {
//     const { data: authData, error: authError } = await this.supabase.auth.signUp({
//       email: credentials.email,
//       password: credentials.password,
//       options: {
//         data: {
//           first_name: credentials.firstName,
//           last_name: credentials.lastName,
//           phone: credentials.phone,
//           user_type: credentials.userType
//         }
//       }
//     });

//     if (authError) {
//       throw new Error(authError.message);
//     }

//     if (!authData.user) {
//       throw new Error('User creation failed');
//     }

//     const { error: profileError } = await this.supabase
//       .from('users')
//       .insert({
//         id: authData.user.id,
//         email: credentials.email,
//         first_name: credentials.firstName,
//         last_name: credentials.lastName,
//         phone: credentials.phone,
//         user_type: credentials.userType,
//         status: 'active',
//         email_verified: false
//       });

//     if (profileError) {
//       console.error('Profile creation error:', profileError);
//     }

//     const { error: userProfileError } = await this.supabase
//       .from('user_profiles')
//       .insert({
//         user_id: authData.user.id,
//         display_name: `${credentials.firstName} ${credentials.lastName}`,
//         profile_step: 0,
//         completion_percentage: 0,
//         is_active: true,
//         is_verified: false
//       });

//     if (userProfileError) {
//       console.error('User profile creation error:', userProfileError);
//       // ❌ REMOVED: handleProfileError(userProfileError, "updateProfile", authData.user.id);
//     }

//     return {
//       user: await this.buildUserProfile(authData.user),
//       error: null
//     };
//   }

//   // Rest of the methods remain the same...
//   async signOut(): Promise<void> {
//     try {
//       const { error } = await this.supabase.auth.signOut();
//       if (error) {
//         console.error('SignOut error:', error);
//       }
//       this.clearAuthState();
//       this.router.navigate(['/auth/login']);
//     } catch (error) {
//       console.error('SignOut failed:', error);
//       this.clearAuthState();
//     }
//   }

//   private async setUserSession(session: Session): Promise<void> {
//     try {
//       this.session.set(session);
//       this.sessionSubject.next(session);

//       const userProfile = await this.buildUserProfile(session.user);
//       this.user.set(userProfile);
//       this.userSubject.next(userProfile);

//       console.log('✅ User session established:', userProfile.email);
//     } catch (error) {
//       console.error('Failed to set user session:', error);
//       this.clearAuthState();
//     }
//   }

//   private clearAuthState(): void {
//     this.user.set(null);
//     this.session.set(null);
//     this.userSubject.next(null);
//     this.sessionSubject.next(null);
//   }

//   private async buildUserProfile(user: User): Promise<UserProfile> {
//     try {
//       const { data: userRecord, error: userError } = await this.supabase
//         .from('users')
//         .select(`
//           *,
//           user_profiles (
//             profile_step,
//             completion_percentage,
//             avatar_url,
//             is_verified
//           )
//         `)
//         .eq('id', user.id)
//         .single();

//       if (userError || !userRecord) {
//         console.warn('User record not found, creating from auth data');
//         return this.createProfileFromAuthUser(user);
//       }

//       return {
//         id: user.id,
//         email: userRecord.email,
//         firstName: userRecord.first_name,
//         lastName: userRecord.last_name,
//         phone: userRecord.phone,
//         userType: userRecord.user_type,
//         profileStep: userRecord.user_profiles?.[0]?.profile_step || 0,
//         completionPercentage: userRecord.user_profiles?.[0]?.completion_percentage || 0,
//         avatarUrl: userRecord.user_profiles?.[0]?.avatar_url,
//         isVerified: userRecord.user_profiles?.[0]?.is_verified || false,
//         createdAt: userRecord.created_at
//       };

//     } catch (error) {
//       console.error('Error building user profile:', error);
//       return this.createProfileFromAuthUser(user);
//     }
//   }

//   private createProfileFromAuthUser(user: User): UserProfile {
//     const metadata = user.user_metadata || {};
//     return {
//       id: user.id,
//       email: user.email!,
//       firstName: metadata['first_name'] || 'User',
//       lastName: metadata['last_name'] || '',
//       phone: metadata['phone'],
//       userType: metadata['user_type'] || 'sme',
//       profileStep: 0,
//       completionPercentage: 0,
//       isVerified: false,
//       createdAt: user.created_at
//     };
//   }

//   getAccessToken(): string | null {
//     const session = this.session();
//     return session?.access_token || null;
//   }

//   // Add any other methods you need...
// }

// src/app/auth/production.auth.service.ts - NUCLEAR FIX
// This version completely bypasses database operations during signup

import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private supabase: SupabaseClient;
  
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
    console.log('🔌 Initializing Supabase with MINIMAL config...');
    
    // Create Supabase client with MINIMAL auth configuration
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        debug: false, // Disable debug to reduce noise
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // DISABLE AUTO SCHEMA DETECTION
        flowType: 'implicit'
      },
      // DISABLE realtime and other features that might trigger database calls
      realtime: {
        params: {
          eventsPerSecond: -1
        }
      }
    });
    
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      console.log('🔍 Checking existing session...');
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('Session initialization error:', error);
        this.clearAuthState();
        return;
      }

      if (session?.user) {
        console.log('✅ Found existing session for:', session.user.email);
        await this.setUserSession(session);
      } else {
        console.log('ℹ️ No existing session found');
        this.clearAuthState();
      }

      // Set up auth state listener
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email);
        
        if (session?.user) {
          await this.setUserSession(session);
        } else {
          this.clearAuthState();
          if (event === 'SIGNED_OUT') {
            this.router.navigate(['/auth/login']);
          }
        }
      });

    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.clearAuthState();
    } finally {
      this.isLoading.set(false);
      this.loadingSubject.next(false);
    }
  }

  // NUCLEAR REGISTRATION - ABSOLUTELY NO DATABASE OPERATIONS
  register(credentials: RegisterRequest): Observable<{ user: UserProfile | null; error: string | null }> {
    return from(this.performNuclearRegister(credentials)).pipe(
      catchError(error => {
        console.error('❌ Nuclear register error:', error);
        return throwError(() => ({
          user: null,
          error: error.message || 'Registration failed'
        }));
      })
    );
  }

  private async performNuclearRegister(credentials: RegisterRequest) {
    console.log('☢️ NUCLEAR REGISTRATION: Bypassing ALL database operations...');
    
    // Validate terms agreement
    if (!credentials.agreeToTerms) {
      throw new Error('You must agree to the terms and conditions');
    }

    // Validate password confirmation
    if (credentials.password !== credentials.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    try {
      console.log('🎯 Creating Supabase auth user with NO metadata to avoid triggers...');
      
      // MINIMAL signup - NO user metadata to avoid triggering functions
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password
        // NO OPTIONS OBJECT - this might be triggering database functions
      });

      if (authError) {
        console.error('❌ Supabase auth error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user returned from Supabase');
      }

      console.log('✅ Supabase auth user created successfully:', authData.user.id);

      // Build user profile from auth data only - NO DATABASE CALLS
      const userProfile = this.createMinimalProfileFromAuthUser(authData.user, credentials);
      
      console.log('🎉 NUCLEAR Registration completed successfully!');
      
      // Set the user profile immediately without waiting for database
      this.user.set(userProfile);
      this.userSubject.next(userProfile);
      
      return {
        user: userProfile,
        error: null
      };

    } catch (error: any) {
      console.error('💥 Nuclear registration failed:', error);
      throw error;
    }
  }

  // Login method - also simplified
  login(credentials: LoginRequest): Observable<{ user: UserProfile | null; error: string | null }> {
    return from(this.performLogin(credentials.email, credentials.password)).pipe(
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => ({
          user: null,
          error: error.message || 'Login failed'
        }));
      })
    );
  }

  private async performLogin(email: string, password: string) {
    console.log('🔑 Performing login...');
    
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Login failed');
    }

    console.log('✅ Login successful for:', data.user.email);

    return {
      user: this.createMinimalProfileFromAuthUser(data.user),
      error: null
    };
  }

  async signOut(): Promise<void> {
    try {
      console.log('👋 Signing out...');
      const { error } = await this.supabase.auth.signOut();
      if (error) {
        console.error('SignOut error:', error);
      }
      this.clearAuthState();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('SignOut failed:', error);
      this.clearAuthState();
    }
  }

  private async setUserSession(session: Session): Promise<void> {
    try {
      this.session.set(session);
      this.sessionSubject.next(session);

      const userProfile = this.createMinimalProfileFromAuthUser(session.user);
      this.user.set(userProfile);
      this.userSubject.next(userProfile);

      console.log('✅ User session established:', userProfile.email);
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

  // MINIMAL PROFILE BUILDER - NO DATABASE DEPENDENCIES
  private createMinimalProfileFromAuthUser(user: User, registrationData?: RegisterRequest): UserProfile {
    const metadata = user.user_metadata || {};
    
    // Use registration data if available, otherwise fall back to metadata
    const firstName = registrationData?.firstName || metadata['first_name'] || 'User';
    const lastName = registrationData?.lastName || metadata['last_name'] || '';
    const phone = registrationData?.phone || metadata['phone'];
    const userType = registrationData?.userType || metadata['user_type'] || 'sme';
    
    return {
      id: user.id,
      email: user.email!,
      firstName,
      lastName,
      phone,
      userType,
      profileStep: 0,
      completionPercentage: 0,
      isVerified: user.email_confirmed_at ? true : false,
      createdAt: user.created_at
    };
  }

  getAccessToken(): string | null {
    const session = this.session();
    return session?.access_token || null;
  }

  // Optional: Add database profile creation method for LATER use
  async syncUserToDatabase(): Promise<void> {
    const currentUser = this.user();
    if (!currentUser) {
      console.warn('No user to sync to database');
      return;
    }

    try {
      console.log('🔄 Syncing user to database...');
      
      // Try to create user record
      const { error: userError } = await this.supabase
        .from('users')
        .upsert({
          id: currentUser.id,
          email: currentUser.email,
          first_name: currentUser.firstName,
          last_name: currentUser.lastName,
          phone: currentUser.phone,
          user_type: currentUser.userType,
          status: 'active',
          email_verified: currentUser.isVerified
        });

      if (userError) {
        console.warn('Database user sync failed:', userError);
        return;
      }

      // Try to create user_profiles record
      const { error: profileError } = await this.supabase
        .from('user_profiles')
        .upsert({
          user_id: currentUser.id,
          display_name: `${currentUser.firstName} ${currentUser.lastName}`,
          profile_step: 0,
          completion_percentage: 0,
          is_active: true,
          is_verified: currentUser.isVerified
        });

      if (profileError) {
        console.warn('Database profile sync failed:', profileError);
        return;
      }

      console.log('✅ User synced to database successfully');
      
    } catch (error) {
      console.warn('Database sync error:', error);
      // Don't throw - this is optional
    }
  }

  // Legacy signUp method for compatibility
  signUp(credentials: SignUpData): Observable<{ user: UserProfile | null; error: string | null }> {
    const registerRequest: RegisterRequest = {
      firstName: credentials.firstName,
      lastName: credentials.lastName,
      email: credentials.email,
      phone: credentials.phone,
      password: '',
      confirmPassword: '',
      userType: credentials.userType as 'sme' | 'funder',
      agreeToTerms: true
    };
    
    return this.register(registerRequest);
  }
}