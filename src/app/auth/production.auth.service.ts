// // src/app/auth/production.auth.service.ts  
// import { Injectable, signal, computed, inject } from '@angular/core';
// import { Router } from '@angular/router';
 
// import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
// import { map, catchError } from 'rxjs/operators'; 
// import { SharedSupabaseService } from '../shared/services/supabase.service';
// import { Session, User } from '@supabase/supabase-js';

 
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
//   private supabaseService = inject(SharedSupabaseService);
  
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
 
    
    
  
 
//     this.initializeAuth();
//   }

//   private async initializeAuth(): Promise<void> {
//     try {
//       const { data: { session }, error } = await this.supabaseService.auth.getSession();
      
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

//       this.supabaseService.auth.onAuthStateChange(async (event, session) => {
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
//       const { data: authData, error: authError } = await this.supabaseService.auth.signUp({
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
//       const { error: profileError } = await this.supabaseService
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
//       const { error: userProfileError } = await this.supabaseService
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
//     const { data, error } = await this.supabaseService.auth.signInWithPassword({
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
//     const { data: authData, error: authError } = await this.supabaseService.auth.signUp({
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

//     const { error: profileError } = await this.supabaseService
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

//     const { error: userProfileError } = await this.supabaseService
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
//       const { error } = await this.supabaseService.auth.signOut();
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
//       const { data: userRecord, error: userError } = await this.supabaseService
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

 
// }
 
// src/app/auth/production.auth.service.ts  
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
 
import { BehaviorSubject, Observable, from, throwError, timer } from 'rxjs';
import { map, catchError, timeout, retry } from 'rxjs/operators'; 
import { SharedSupabaseService } from '../shared/services/supabase.service';
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
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private supabaseService = inject(SharedSupabaseService);
  
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
      console.log('🔐 Initializing auth...');
      
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
        // Handle lock errors gracefully
        if (error.message?.includes('NavigatorLockAcquireTimeoutError') || 
            error.message?.includes('lock')) {
          console.warn('⚠️ Lock timeout occurred, continuing without session');
          this.clearAuthState();
          return;
        }
        console.error('❌ Session initialization error:', error);
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
          console.log('🔄 Auth state changed:', event, session?.user?.email);
          
          if (session?.user) {
            await this.setUserSession(session);
          } else {
            this.clearAuthState();
            if (event === 'SIGNED_OUT') {
              this.router.navigate(['/auth/login']);
            }
          }
        } catch (stateChangeError: any) {
          console.error('❌ Error in auth state change handler:', stateChangeError);
          // Don't clear auth state on listener errors unless critical
          if (stateChangeError?.message?.includes('lock')) {
            console.warn('⚠️ Lock error in state change, continuing...');
          }
        }
      });

    } catch (error: any) {
      // Handle initialization errors gracefully
      if (error.message?.includes('NavigatorLockAcquireTimeoutError') || 
          error.message?.includes('lock') ||
          error.message?.includes('timeout')) {
        console.warn('⚠️ Auth initialization timeout/lock error, continuing without session');
      } else {
        console.error('❌ Auth initialization failed:', error);
      }
      this.clearAuthState();
    } finally {
      this.isLoading.set(false);
      this.loadingSubject.next(false);
    }
  }

  // Register method with improved error handling
  register(credentials: RegisterRequest): Observable<{ user: UserProfile | null; error: string | null }> {
    return from(this.performRegister(credentials)).pipe(
      timeout(30000), // 30 second timeout
      retry({
        count: 2,
        delay: (error) => {
          // Retry on lock errors but not on validation errors
          if (error.message?.includes('lock') || error.message?.includes('timeout')) {
            return timer(1000); // Retry after 1 second
          }
          throw error; // Don't retry validation errors
        }
      }),
      catchError(error => {
        console.error('❌ Register error:', error);
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
          error: errorMessage
        }));
      })
    );
  }

  private async performRegister(credentials: RegisterRequest) {
    console.log('🚀 Starting registration process...');
    
    // Validate terms agreement
    if (!credentials.agreeToTerms) {
      throw new Error('You must agree to the terms and conditions');
    }

    // Validate password confirmation
    if (credentials.password !== credentials.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    try {
      // 1. Create Supabase auth user with timeout
      console.log('👤 Creating Supabase auth user...');
      
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
          setTimeout(() => reject(new Error('Auth signup timeout')), 15000)
        )
      ]) as any;

      const { data: authData, error: authError } = authResult;

      if (authError) {
        console.error('❌ Supabase auth error:', authError);
        throw new Error(`Authentication failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user returned from Supabase');
      }

      console.log('✅ Supabase auth user created:', authData.user.id);

      // 2. Create user profile in database
      console.log('📝 Creating user profile in database...');
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
        console.error('❌ Profile creation error:', profileError);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      console.log('✅ User profile created successfully');

      // 3. Create user_profile entry (optional)
      console.log('📋 Creating user profile metadata...');
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
        console.error('⚠️ User profile metadata creation failed:', userProfileError);
        console.log('💡 User profile metadata can be created later');
      } else {
        console.log('✅ User profile metadata created successfully');
      }

      // 4. Build and return user profile
      console.log('🏗️ Building user profile object...');
      const userProfile = await this.buildUserProfile(authData.user);
      
      console.log('🎉 Registration completed successfully!');
      return {
        user: userProfile,
        error: null
      };

    } catch (error: any) {
      console.error('💥 Registration failed:', error);
      throw error;
    }
  }

  // Login method with better error handling
  login(credentials: LoginRequest): Observable<{ user: UserProfile | null; error: string | null }> {
    return from(this.performLogin(credentials.email, credentials.password)).pipe(
      timeout(15000), // 15 second timeout
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
        console.error('❌ Login error:', error);
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
          error: errorMessage
        }));
      })
    );
  }

  private async performLogin(email: string, password: string) {
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

    return {
      user: await this.buildUserProfile(data.user),
      error: null
    };
  }

  // Legacy signUp method (keeping for compatibility)
  signUp(credentials: SignUpData): Observable<{ user: UserProfile | null; error: string | null }> {
    return from(this.performSignUp(credentials)).pipe(
      timeout(30000),
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

    return {
      user: await this.buildUserProfile(authData.user),
      error: null
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

  private async buildUserProfile(user: User): Promise<UserProfile> {
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

  getAccessToken(): string | null {
    const session = this.session();
    return session?.access_token || null;
  }
}