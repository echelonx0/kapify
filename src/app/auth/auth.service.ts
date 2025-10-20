// // src/app/auth/auth.service.ts
// import { Injectable, signal, computed, inject } from '@angular/core';
// import { Router } from '@angular/router';
// import { from, Observable, of, throwError, firstValueFrom, timeout, catchError } from 'rxjs';
// import { map, tap, finalize } from 'rxjs/operators';
// import { SharedSupabaseService } from '../shared/services/shared-supabase.service';
// import { RegistrationTransactionService, RegistrationTransactionResult } from '../shared/services/registration-transaction.service';
// import { Session, User } from '@supabase/supabase-js';

// // NOTE: The interfaces are unchanged from the original file.
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
//   organizationId?: string;
// }

// export interface AuthOperationResult {
//   success: boolean;
//   user: UserProfile | null;
//   error: string | null;
//   organizationId?: string;
//   organizationCreated?: boolean;
// }

// interface LoadingState {
//   registration: boolean;
//   login: boolean;
//   initialization: boolean;
//   sessionUpdate: boolean;
// }

// /**
//  * To fully implement this refactored service, you should make the following change in your app.config.ts:
//  *
//  * import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
//  * import { AuthService } from './auth/auth.service';
//  *
//  * function initializeAuthFactory(authService: AuthService): () => Promise<void> {
//  *   return () => authService.initializeAuth();
//  * }
//  *
//  * export const appConfig: ApplicationConfig = {
//  *   providers: [
//  *     // ... other providers
//  *     AuthService, // Ensure AuthService is provided
//  *     {
//  *       provide: APP_INITIALIZER,
//  *       useFactory: initializeAuthFactory,
//  *       deps: [AuthService],
//  *       multi: true,
//  *     },
//  *   ],
//  * };
//  */
// @Injectable({
//   providedIn: 'root'
// })
// export class AuthService {
//   private router = inject(Router);
//   private supabaseService = inject(SharedSupabaseService);
//   private registrationTransaction = inject(RegistrationTransactionService);

//   // --- State Management using Angular Signals ---
//   private loadingState = signal<LoadingState>({
//     registration: false,
//     login: false,
//     initialization: true,
//     sessionUpdate: false
//   });

//   user = signal<UserProfile | null>(null);
//   session = signal<Session | null>(null);

//   // --- Computed Signals for derived state ---
//   isInitializing = computed(() => this.loadingState().initialization);
//   isLoggingIn = computed(() => this.loadingState().login);
//   isRegistering = computed(() => this.loadingState().registration);
//   isSessionUpdating = computed(() => this.loadingState().sessionUpdate);

//   isLoading = computed(() => {
//     const state = this.loadingState();
//     return state.registration || state.login || state.initialization || state.sessionUpdate;
//   });

//   isAuthenticated = computed(() => !!this.user());

//   // --- APP INITIALIZATION ---
//   // This method should be called by an APP_INITIALIZER factory.
//   async initializeAuth(): Promise<void> {
//     console.log('Starting auth initialization...');
//     this.updateLoadingState({ initialization: true });

//     try {
//       await this.supabaseService.getClient(); // Ensure Supabase client is ready

//       const sessionPromise = this.supabaseService.auth.getSession();
//       const { data: { session }, error } = await firstValueFrom(
//         from(sessionPromise).pipe(
//           timeout(10000),
//           catchError(() => {
//             console.error('Session initialization timed out.');
//             return of({ data: { session: null }, error: new Error('Session initialization timeout') });
//           })
//         )
//       );

//       if (error) {
//         console.error('Session initialization error:', error.message);
//         this.clearAuthState();
//       } else if (session?.user) {
//         await this.establishUserSession(session);
//       } else {
//         this.clearAuthState();
//       }

//       this.listenToAuthStateChanges();

//     } catch (error: any) {
//       console.error('Auth initialization failed:', error);
//       this.clearAuthState();
//     } finally {
//       this.updateLoadingState({ initialization: false });
//       console.log('Auth initialization completed.');
//     }
//   }

//   private listenToAuthStateChanges(): void {
//     this.supabaseService.auth.onAuthStateChange(async (event, session) => {
//       console.log('Auth state changed:', event);
//       this.updateLoadingState({ sessionUpdate: true });
//       try {
//         if (session?.user) {
//           await this.establishUserSession(session);
//         } else {
//           this.clearAuthState();
//           if (event === 'SIGNED_OUT') {
//             this.router.navigate(['/auth/login']);
//           }
//         }
//       } catch (error) {
//         console.error('Error in auth state change handler:', error);
//         this.clearAuthState();
//       } finally {
//         this.updateLoadingState({ sessionUpdate: false });
//       }
//     });
//   }

//   // --- CORE AUTH METHODS ---

//   register(credentials: RegisterRequest): Observable<AuthOperationResult> {
//     this.updateLoadingState({ registration: true });

//     const validationError = this.validateRegistrationInput(credentials);
//     if (validationError) {
//       this.updateLoadingState({ registration: false });
//       return of({ success: false, user: null, error: validationError });
//     }

//     return this.registrationTransaction.executeRegistrationTransaction(credentials).pipe(
//       timeout(60000),
//       tap((result: RegistrationTransactionResult) => {
//         if (result.success && result.user) {
//           const userProfile = result.user;
//           userProfile.organizationId = result.organizationId;
//           this.user.set(userProfile);
//           console.log('Registration successful, auth state updated.');
//         }
//       }),
//       map((result: RegistrationTransactionResult): AuthOperationResult => ({
//         success: result.success,
//         user: result.user,
//         error: result.error || null,
//         organizationId: result.organizationId,
//         organizationCreated: !!result.organizationId
//       })),
//       catchError(error => {
//         console.error('Registration failed:', error);
//         return of({
//           success: false,
//           user: null,
//           error: error.message || 'An unknown registration error occurred.'
//         });
//       }),
//       finalize(() => this.updateLoadingState({ registration: false }))
//     );
//   }

//   login(credentials: LoginRequest): Observable<AuthOperationResult> {
//     this.updateLoadingState({ login: true });

//     return from(this.performLogin(credentials)).pipe(
//       timeout(30000),
//       catchError(error => {
//         console.error('Login failed:', error);
//         return of({
//             success: false,
//             user: null,
//             error: error.message || 'Login failed. Please try again.'
//         });
//       }),
//       finalize(() => this.updateLoadingState({ login: false }))
//     );
//   }

//   private async performLogin(credentials: LoginRequest): Promise<AuthOperationResult> {
//     const { data, error } = await this.supabaseService.auth.signInWithPassword(credentials);

//     if (error) {
//       throw new Error(this.createLoginErrorMessage(error));
//     }
//     if (!data.user || !data.session) {
//       throw new Error('Login failed: No user data returned.');
//     }

//     // This will trigger onAuthStateChange, which calls establishUserSession
//     // But we can pre-emptively update state for a faster UI response.
//     await this.establishUserSession(data.session);

//     return {
//       success: true,
//       user: this.user(),
//       error: null,
//       organizationId: this.user()?.organizationId,
//       organizationCreated: !!this.user()?.organizationId
//     };
//   }

//   async signOut(): Promise<void> {
//     console.log('Signing out...');
//     try {
//       const { error } = await this.supabaseService.auth.signOut();
//       if (error) {
//         // Don't throw, just log, as the state will be cleared anyway.
//         console.error('SignOut error:', error.message);
//       }
//     } catch (error: any) {
//       console.error('SignOut failed:', error.message);
//     } finally {
//       this.clearAuthState();
//       this.router.navigate(['/auth/login']);
//     }
//   }

//   // --- SESSION & PROFILE MANAGEMENT ---

//   private async establishUserSession(session: Session): Promise<void> {
//     console.log('Establishing user session...');
//     try {
//       const userProfile = await this.buildUserProfile(session.user);
//       this.session.set(session);
//       this.user.set(userProfile);
//       console.log('User session established for:', userProfile.email);
//     } catch (error) {
//       console.error('Failed to establish user session:', error);
//       this.clearAuthState(); // Clear state on failure
//       throw error; // Re-throw to allow upstream handlers to catch it
//     }
//   }

//   /**
//    * OPTIMIZATION: This method can be improved by creating a single database function
//    * (e.g., 'get_user_profile_with_organization') on the backend to fetch all data in one call.
//    */
//   private async buildUserProfile(user: User): Promise<UserProfile> {
//     const { data, error } = await this.supabaseService
//       .from('users')
//       .select(`
//         *,
//         user_profiles (
//           profile_step,
//           completion_percentage,
//           avatar_url,
//           is_verified
//         ),
//         organization_users (
//           organization_id
//         )
//       `)
//       .eq('id', user.id)
//       .single();

//     if (error) {
//       console.warn('Failed to fetch user profile, creating from auth data.', error.message);
//       return this.createProfileFromAuthUser(user);
//     }

//     const profileData = data.user_profiles?.[0] || {};
//     return {
//       id: user.id,
//       email: data.email,
//       firstName: data.first_name,
//       lastName: data.last_name,
//       phone: data.phone,
//       userType: data.user_type,
//       profileStep: profileData.profile_step || 0,
//       completionPercentage: profileData.completion_percentage || 0,
//       avatarUrl: profileData.avatar_url,
//       isVerified: profileData.is_verified || false,
//       createdAt: data.created_at,
//       organizationId: data.organization_users?.[0]?.organization_id
//     };
//   }

//   // --- UTILITY METHODS ---

//   private clearAuthState(): void {
//     console.log('Clearing auth state.');
//     this.user.set(null);
//     this.session.set(null);
//     // Reset loading states, except for initialization if it's still running
//     this.loadingState.set({
//       registration: false,
//       login: false,
//       initialization: this.loadingState().initialization,
//       sessionUpdate: false
//     });
//   }

//   private updateLoadingState(updates: Partial<LoadingState>): void {
//     this.loadingState.set({ ...this.loadingState(), ...updates });
//   }

//   private createLoginErrorMessage(error: any): string {
//     const message = error.message || '';
//     if (message.includes('Invalid login credentials')) {
//       return 'Invalid email or password.';
//     }
//     if (message.includes('Email not confirmed')) {
//       return 'Please confirm your email before logging in.';
//     }
//     if (message.includes('rate limit')) {
//       return 'Too many login attempts. Please wait and try again.';
//     }
//     return message || 'An unknown login error occurred.';
//   }

//   private validateRegistrationInput(credentials: RegisterRequest): string | null {
//     if (!credentials.agreeToTerms) return 'You must accept the terms and conditions.';
//     if (credentials.password !== credentials.confirmPassword) return 'Passwords do not match.';
//     if (credentials.password.length < 8) return 'Password must be at least 8 characters long.';
//     if (!credentials.email || !credentials.firstName || !credentials.lastName) return 'Please fill in all required fields.';
//     return null;
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
//       createdAt: user.created_at,
//       organizationId: undefined
//     };
//   }

//   // --- LEGACY & COMPATIBILITY ---

//   // Kept for backward compatibility if needed, but delegates to new `register` method.
//   signUp(credentials: SignUpData): Observable<AuthOperationResult> {
//     const registerRequest: RegisterRequest = {
//       ...credentials,
//       confirmPassword: credentials.password,
//       userType: credentials.userType as 'sme' | 'funder',
//       agreeToTerms: true
//     };
//     return this.register(registerRequest);
//   }

//   getAccessToken(): string | null {
//     return this.session()?.access_token || null;
//   }
// }