// // src/app/auth/auth.service.ts - PRODUCTION SUPABASE AUTH
// import { Injectable, signal, computed, inject } from '@angular/core';
// import { Router } from '@angular/router';
// import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
// import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
// import { map, catchError, } from 'rxjs/operators';
// import { environment } from '../../environments/environment';

// export interface SignUpData {
//   email: string;
//   password: string;
//   firstName: string;
//   lastName: string;
//   phone?: string;
//   userType: 'sme' | 'funder' | 'consultant';
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
//     this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
//     this.initializeAuth();
//   }

//   // ===============================
//   // INITIALIZATION
//   // ===============================

//   private async initializeAuth(): Promise<void> {
//     try {
//       // Get initial session
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

//       // Listen for auth changes
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

//   // ===============================
//   // AUTHENTICATION METHODS
//   // ===============================

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
//     // 1. Create Supabase auth user
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

//     // 2. Create user profile in database
//     const { error: profileError } = await this.supabase
//       .from('users')
//       .insert({
//         id: authData.user.id,
//         email: credentials.email,
//         password: 'managed_by_supabase', // Placeholder
//         first_name: credentials.firstName,
//         last_name: credentials.lastName,
//         phone: credentials.phone,
//         user_type: credentials.userType,
//         status: 'pending_verification',
//         email_verified: false
//       });

//     if (profileError) {
//       console.error('Profile creation error:', profileError);
//       // Don't throw here - auth user exists, profile can be created later
//     }

//     // 3. Create user_profile entry
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
//     }

//     return {
//       user: await this.buildUserProfile(authData.user),
//       error: null
//     };
//   }

//   signIn(email: string, password: string): Observable<{ user: UserProfile | null; error: string | null }> {
//     return from(this.performSignIn(email, password)).pipe(
//       catchError(error => {
//         console.error('SignIn error:', error);
//         return throwError(() => ({
//           user: null,
//           error: error.message || 'Login failed'
//         }));
//       })
//     );
//   }

//   private async performSignIn(email: string, password: string) {
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

//   // ===============================
//   // SESSION MANAGEMENT
//   // ===============================

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

//   // ===============================
//   // USER PROFILE BUILDING
//   // ===============================

//   private async buildUserProfile(user: User): Promise<UserProfile> {
//     try {
//       // Try to get user profile from database
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
//       firstName: metadata.first_name || 'User',
//       lastName: metadata.last_name || '',
//       phone: metadata.phone,
//       userType: metadata.user_type || 'sme',
//       profileStep: 0,
//       completionPercentage: 0,
//       isVerified: false,
//       createdAt: user.created_at
//     };
//   }

//   // ===============================
//   // UTILITY METHODS
//   // ===============================

//   async updateProfile(updates: Partial<UserProfile>): Promise<boolean> {
//     try {
//       const currentUser = this.user();
//       if (!currentUser) return false;

//       // Update users table
//       const { error: userError } = await this.supabase
//         .from('users')
//         .update({
//           first_name: updates.firstName,
//           last_name: updates.lastName,
//           phone: updates.phone,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', currentUser.id);

//       if (userError) {
//         console.error('User update error:', userError);
//         return false;
//       }

//       // Update user_profiles table
//       const { error: profileError } = await this.supabase
//         .from('user_profiles')
//         .update({
//           display_name: updates.firstName && updates.lastName 
//             ? `${updates.firstName} ${updates.lastName}` 
//             : undefined,
//           profile_step: updates.profileStep,
//           completion_percentage: updates.completionPercentage,
//           avatar_url: updates.avatarUrl,
//           updated_at: new Date().toISOString()
//         })
//         .eq('user_id', currentUser.id);

//       if (profileError) {
//         console.error('Profile update error:', profileError);
//       }

//       // Update local state
//       const updatedUser = { ...currentUser, ...updates };
//       this.user.set(updatedUser);
//       this.userSubject.next(updatedUser);

//       return true;
//     } catch (error) {
//       console.error('Profile update failed:', error);
//       return false;
//     }
//   }

//   getAccessToken(): string | null {
//     const session = this.session();
//     return session?.access_token || null;
//   }

//   async refreshSession(): Promise<boolean> {
//     try {
//       const { data, error } = await this.supabase.auth.refreshSession();
      
//       if (error) {
//         console.error('Session refresh failed:', error);
//         return false;
//       }

//       if (data.session) {
//         await this.setUserSession(data.session);
//         return true;
//       }

//       return false;
//     } catch (error) {
//       console.error('Session refresh error:', error);
//       return false;
//     }
//   }
// }

// src/app/auth/production.auth.service.ts - FIXED FOR REGISTER/LOGIN COMPONENTS

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

// FIX: Add missing RegisterRequest interface
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

// FIX: Add missing LoginRequest interface
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
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    this.initializeAuth();
  }

  // ===============================
  // INITIALIZATION
  // ===============================

  private async initializeAuth(): Promise<void> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('Session initialization error:', error);
        this.clearAuthState();
        return;
      }

      if (session?.user) {
        await this.setUserSession(session);
      } else {
        this.clearAuthState();
      }

      this.supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
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

  // ===============================
  // FIX: AUTHENTICATION METHODS FOR COMPONENTS
  // ===============================

  // FIX: Add register method that components expect
  register(credentials: RegisterRequest): Observable<{ user: UserProfile | null; error: string | null }> {
    return from(this.performRegister(credentials)).pipe(
      catchError(error => {
        console.error('Register error:', error);
        return throwError(() => ({
          user: null,
          error: error.message || 'Registration failed'
        }));
      })
    );
  }

  private async performRegister(credentials: RegisterRequest) {
    // Validate terms agreement
    if (!credentials.agreeToTerms) {
      throw new Error('You must agree to the terms and conditions');
    }

    // Validate password confirmation
    if (credentials.password !== credentials.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
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
    });

    if (authError) {
      throw new Error(authError.message);
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // 2. Create user profile in database
    const { error: profileError } = await this.supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: credentials.email,
        password: 'managed_by_supabase',
        first_name: credentials.firstName,
        last_name: credentials.lastName,
        phone: credentials.phone,
        user_type: credentials.userType,
        company_name: credentials.companyName,
        status: 'pending_verification',
        email_verified: false
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    // 3. Create user_profile entry
    const { error: userProfileError } = await this.supabase
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

    return {
      user: await this.buildUserProfile(authData.user),
      error: null
    };
  }

  // FIX: Add login method that components expect
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

    return {
      user: await this.buildUserProfile(data.user),
      error: null
    };
  }

  // Keep existing signUp and signIn methods for backward compatibility
  signUp(credentials: SignUpData): Observable<{ user: UserProfile | null; error: string | null }> {
    return from(this.performSignUp(credentials)).pipe(
      catchError(error => {
        console.error('SignUp error:', error);
        return throwError(() => ({
          user: null,
          error: error.message || 'Registration failed'
        }));
      })
    );
  }

  private async performSignUp(credentials: SignUpData) {
    const { data: authData, error: authError } = await this.supabase.auth.signUp({
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

    const { error: profileError } = await this.supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: credentials.email,
        password: 'managed_by_supabase',
        first_name: credentials.firstName,
        last_name: credentials.lastName,
        phone: credentials.phone,
        user_type: credentials.userType,
        status: 'pending_verification',
        email_verified: false
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    const { error: userProfileError } = await this.supabase
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

    return {
      user: await this.buildUserProfile(authData.user),
      error: null
    };
  }

  signIn(email: string, password: string): Observable<{ user: UserProfile | null; error: string | null }> {
    return from(this.performSignIn(email, password)).pipe(
      catchError(error => {
        console.error('SignIn error:', error);
        return throwError(() => ({
          user: null,
          error: error.message || 'Login failed'
        }));
      })
    );
  }

  private async performSignIn(email: string, password: string) {
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

    return {
      user: await this.buildUserProfile(data.user),
      error: null
    };
  }

  async signOut(): Promise<void> {
    try {
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

  // ===============================
  // SESSION MANAGEMENT
  // ===============================

  private async setUserSession(session: Session): Promise<void> {
    try {
      this.session.set(session);
      this.sessionSubject.next(session);

      const userProfile = await this.buildUserProfile(session.user);
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

  // ===============================
  // USER PROFILE BUILDING
  // ===============================

  private async buildUserProfile(user: User): Promise<UserProfile> {
    try {
      const { data: userRecord, error: userError } = await this.supabase
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
        return this.createProfileFromAuthUser(user);
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
        createdAt: userRecord.created_at
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
      createdAt: user.created_at
    };
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  async updateProfile(updates: Partial<UserProfile>): Promise<boolean> {
    try {
      const currentUser = this.user();
      if (!currentUser) return false;

      const { error: userError } = await this.supabase
        .from('users')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          phone: updates.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (userError) {
        console.error('User update error:', userError);
        return false;
      }

      const { error: profileError } = await this.supabase
        .from('user_profiles')
        .update({
          display_name: updates.firstName && updates.lastName 
            ? `${updates.firstName} ${updates.lastName}` 
            : undefined,
          profile_step: updates.profileStep,
          completion_percentage: updates.completionPercentage,
          avatar_url: updates.avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
      }

      const updatedUser = { ...currentUser, ...updates };
      this.user.set(updatedUser);
      this.userSubject.next(updatedUser);

      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    }
  }

  getAccessToken(): string | null {
    const session = this.session();
    return session?.access_token || null;
  }

  async refreshSession(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        return false;
      }

      if (data.session) {
        await this.setUserSession(data.session);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Session refresh error:', error);
      return false;
    }
  }
}