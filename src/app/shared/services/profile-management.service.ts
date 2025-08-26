//  // src/app/shared/services/profile-management.service.ts - FIXED VERSION
// import { Injectable, inject, signal, computed } from '@angular/core';
// import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
// import { map, tap, catchError } from 'rxjs/operators';
 
// import { 
//   User, 
//   UserType,
//   Organization,
//   OrganizationUser,
//   UserProfile,
// } from '../models/user.models';
// import { AuthService } from '../../auth/production.auth.service';
 
// import { SharedSupabaseService } from './shared-supabase.service';
 

// export interface UserProfileData {
//   user: User;
//   profile: UserProfile;
//   organizationUser?: OrganizationUser;
//   organization?: Organization;
// }

// export interface ProfileUpdateRequest {
//   userUpdates?: Partial<User>;
//   profileUpdates?: Partial<UserProfile>;
//   organizationUpdates?: Partial<Organization>;
//   organizationUserUpdates?: Partial<OrganizationUser>;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class ProfileManagementService {
//   private authService = inject(AuthService);
//    private supabaseService = inject(SharedSupabaseService); // Use shared service
  
//   // State management
//   private profileDataSubject = new BehaviorSubject<UserProfileData | null>(null);
  
//   // Signals for reactive state
//   profileData = signal<UserProfileData | null>(null);
//   isLoading = signal<boolean>(false);
//   error = signal<string | null>(null);
  
//   // Computed values
//   currentUser = computed(() => this.profileData()?.user || null);
//   currentProfile = computed(() => this.profileData()?.profile || null);
//   currentOrganization = computed(() => this.profileData()?.organization || null);
//   currentOrganizationUser = computed(() => this.profileData()?.organizationUser || null);
  
//   userDisplayName = computed(() => {
//     const user = this.currentUser();
//     return user ? `${user.firstName} ${user.lastName}` : '';
//   });
  
//   profileCompletionPercentage = computed(() => {
//     const profile = this.currentProfile();
//     return profile?.completionPercentage || 0;
//   });
  
//   userPermissions = computed(() => {
//     const orgUser = this.currentOrganizationUser();
//     return orgUser?.permissions || null;
//   });
  
//   canManageUsers = computed(() => {
//     const permissions = this.userPermissions();
//     return permissions && 'canManageUsers' in permissions 
//       ? permissions.canManageUsers 
//       : false;
//   });
  
//   canManageSettings = computed(() => {
//     const permissions = this.userPermissions();
//     return permissions && 'canManageOrganizationSettings' in permissions 
//       ? permissions.canManageOrganizationSettings 
//       : true; // Default for SME users
//   });

//   constructor() {
//     // Initialize Supabase client
 
    
//     // Initialize from auth service if available
//     const currentAuth = this.authService.user();
//     if (currentAuth) {
//       this.loadProfileData().subscribe({
//         next: (profileData) => {
//           console.log('✅ Profile data loaded:', profileData);
//         },
//         error: (error) => {
//           console.error('Failed to load initial profile data:', error);
//           // Create profile data from auth user if database load fails
//           this.createProfileFromAuthUser();
//         }
//       });
//     }
//   }

//    getCurrentOrganizationId(): string | null {
//     // First try from computed organization
//     const orgFromProfile = this.currentOrganization()?.id;
//     if (orgFromProfile) {
//       return orgFromProfile;
//     }

//     // Fallback: try from auth service if it has organization context
//     const authUser = this.authService.user();
//     if (authUser && 'organizationId' in authUser) {
//       return (authUser as any).organizationId;
//     }

//     // Final fallback: check if organizationUser has the organization reference
//     const orgUser = this.currentOrganizationUser();
//     if (orgUser && 'organizationId' in orgUser) {
//       return (orgUser as any).organizationId;
//     }

//     return null;
//   }
//   // Load profile data from Supabase (with fallback)
//   loadProfileData(): Observable<UserProfileData> {
//     this.isLoading.set(true);
//     this.error.set(null);
    
//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       this.isLoading.set(false);
//       return throwError(() => new Error('User not authenticated'));
//     }

//     console.log('🔄 Loading profile data for user:', currentAuth.id);

//     // Try to load from database, fall back to auth data
//     return this.loadFromDatabase(currentAuth.id).pipe(
//       catchError((error) => {
//         console.warn('Database load failed, creating from auth user:', error);
//         return this.createProfileFromAuthUser();
//       }),
//       tap(profileData => {
//         this.profileData.set(profileData);
//         this.profileDataSubject.next(profileData);
//         this.isLoading.set(false);
//       }),
//       catchError(error => {
//         this.error.set('Failed to load profile data');
//         this.isLoading.set(false);
//         console.error('Profile load error:', error);
//         return throwError(() => error);
//       })
//     );
//   }

//   // Try to load from Supabase database
//   private loadFromDatabase(userId: string): Observable<UserProfileData> {
//     return new Observable(observer => {
//       Promise.all([
//         // Load user from database
//         this.supabaseService
//           .from('users')
//           .select('*')
//           .eq('id', userId)
//           .single(),
        
//         // Load user profile from database
//         this.supabaseService
//           .from('user_profiles')
//           .select('*')
//           .eq('user_id', userId)
//           .single()
//       ]).then(([userResult, profileResult]) => {
        
//         if (userResult.error && profileResult.error) {
//           throw new Error('User not found in database');
//         }

//         // Build profile data from database
//         const profileData: UserProfileData = {
//           user: userResult.data ? this.mapDatabaseUserToModel(userResult.data) : this.createUserFromAuth(),
//           profile: profileResult.data ? this.mapDatabaseProfileToModel(profileResult.data) : this.createDefaultProfile()
//         };

//         observer.next(profileData);
//         observer.complete();
        
//       }).catch(error => {
//         observer.error(error);
//       });
//     });
//   }

//   // Create profile data from auth user (fallback)
//   private createProfileFromAuthUser(): Observable<UserProfileData> {
//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       return throwError(() => new Error('No authenticated user'));
//     }

//     const profileData: UserProfileData = {
//       user: this.createUserFromAuth(),
//       profile: this.createDefaultProfile()
//     };

//     console.log('📝 Created profile from auth user:', profileData);
    
//     // Optionally sync to database in background
//     this.syncToDatabase(profileData).subscribe({
//       next: () => console.log('✅ Profile synced to database'),
//       error: (error) => console.warn('⚠️ Database sync failed:', error)
//     });

//     return of(profileData);
//   }

//   // Create User model from auth service
//   private createUserFromAuth(): User {
//     const authUser = this.authService.user();
//     if (!authUser) throw new Error('No auth user');

//     return {
//       id: authUser.id,
//       email: authUser.email,
//       firstName: authUser.firstName,
//       lastName: authUser.lastName,
//       phone: authUser.phone,
//       userType: authUser.userType as UserType,
//       status: 'active',
//       emailVerified: authUser.isVerified,
//       createdAt: new Date(authUser.createdAt),
//       updatedAt: new Date( authUser.createdAt),
//       phoneVerified: false,
//       accountTier: 'basic'
//     };
//   }

//   // Upload profile picture
// uploadProfilePicture(file: File): Observable<string> {
//   this.isLoading.set(true);
  
//   const currentAuth = this.authService.user();
//   if (!currentAuth) {
//     this.isLoading.set(false);
//     return throwError(() => new Error('User not authenticated'));
//   }

//   // Upload to Supabase Storage
//   return new Observable(observer => {
//     const fileName = `${currentAuth.id}/profile-picture-${Date.now()}.${file.name.split('.').pop()}`;
    
//     this.supabaseService.storage
//       .from('profile-pictures')
//       .upload(fileName, file)
//       .then(({ data, error }) => {
//         if (error) throw error;
        
//         // Get public URL
//         const { data: { publicUrl } } = this.supabaseService.storage
//           .from('profile-pictures')
//           .getPublicUrl(fileName);
        
//         // Update profile with new picture URL
//         const currentProfile = this.profileData();
//         if (currentProfile) {
//           const updatedProfile = {
//             ...currentProfile,
//             user: {
//               ...currentProfile.user,
//               profilePicture: publicUrl
//             }
//           };
//           this.profileData.set(updatedProfile);
//           this.profileDataSubject.next(updatedProfile);
//         }
        
//         this.isLoading.set(false);
//         observer.next(publicUrl);
//         observer.complete();
//       })
//       .catch(error => {
//         this.error.set('Failed to upload profile picture');
//         this.isLoading.set(false);
//         observer.error(error);
//       });
//   });
// }

// // Update organization info
// updateOrganizationInfo(updates: Partial<Organization>): Observable<Organization> {
//   return this.updateProfile({ organizationUpdates: updates }).pipe(
//     map(profile => profile.organization!)
//   );
// }

// // Update user role/permissions within organization
// updateOrganizationUser(updates: Partial<OrganizationUser>): Observable<OrganizationUser> {
//   return this.updateProfile({ organizationUserUpdates: updates }).pipe(
//     map(profile => profile.organizationUser!)
//   );
// }

// // Get organization team members (if user has permission)
// getOrganizationTeam(): Observable<OrganizationUser[]> {
//   const org = this.currentOrganization();
//   if (!org) return throwError(() => new Error('No organization found'));

//   return new Observable(observer => {
//     this.supabaseService
//       .from('organization_users')
//       .select('*, users(*)')
//       .eq('organization_id', org.id)
//       .then(({ data, error }) => {
//         if (error) throw error;
//         observer.next(data || []);
//         observer.complete();
//       })
//      // .catch(error => observer.error(error));
//   });
// }

// // Invite new team member
// inviteTeamMember(email: string, role: string, permissions: any): Observable<void> {
//   const org = this.currentOrganization();
//   if (!org) return throwError(() => new Error('No organization found'));

//   return new Observable(observer => {
//     // This would typically send an email invitation
//     // For now, just log the invitation
//     console.log('📧 Team member invitation:', { email, role, permissions, orgId: org.id });
//     observer.next();
//     observer.complete();
//   });
// }

// // Update team member role/permissions
// updateTeamMember(userId: string, updates: Partial<OrganizationUser>): Observable<OrganizationUser> {
//   const org = this.currentOrganization();
//   if (!org) return throwError(() => new Error('No organization found'));

//   return new Observable(observer => {
//     this.supabaseService
//       .from('organization_users')
//       .update(updates)
//       .eq('user_id', userId)
//       .eq('organization_id', org.id)
//       .select()
//       .single()
//       .then(({ data, error }) => {
//         if (error) throw error;
//         observer.next(data);
//         observer.complete();
//       })
//     //  .catch(error => observer.error(error));
//   });
// }

// // Remove team member
// removeTeamMember(userId: string): Observable<void> {
//   const org = this.currentOrganization();
//   if (!org) return throwError(() => new Error('No organization found'));

//   return new Observable(observer => {
//     this.supabaseService
//       .from('organization_users')
//       .delete()
//       .eq('user_id', userId)
//       .eq('organization_id', org.id)
//       .then(({ error }) => {
//         if (error) throw error;
//         observer.next();
//         observer.complete();
//       })
//      // .catch(error => observer.error(error));
//   });
// }

// getAccountTierDisplayName(tier: string): string {
//   const displayNames: Record<string, string> = {
//     'basic': 'Basic',
//     'premium': 'Premium',
//     'enterprise': 'Enterprise'
//   };
//   return displayNames[tier] || tier;
// }
//   // Create default profile
//   private createDefaultProfile(): UserProfile {
//     const authUser = this.authService.user();
//     if (!authUser) throw new Error('No auth user');

//     return {
//       id: `profile-${authUser.id}`,
//       userId: authUser.id,
//       displayName: `${authUser.firstName} ${authUser.lastName}`,
//       profileStep: authUser.profileStep,
//       completionPercentage: authUser.completionPercentage,
//       isActive: true,
//       isVerified: authUser.isVerified,
//       createdAt: new Date( authUser.createdAt),
//       updatedAt: new Date( authUser.createdAt)
//     };
//   }

//   // Map database user to model
//   private mapDatabaseUserToModel(dbUser: any): User {
//     return {
//       id: dbUser.id,
//       email: dbUser.email,
//       firstName: dbUser.first_name,
//       lastName: dbUser.last_name,
//       phone: dbUser.phone,
//       userType: dbUser.user_type,
//       status: dbUser.status,
//       emailVerified: dbUser.email_verified,
//       createdAt: dbUser.created_at,
//       updatedAt: dbUser.updated_at,
//       phoneVerified: false,
//       accountTier: 'basic'
//     };
//   }

//   // Map database profile to model
//   private mapDatabaseProfileToModel(dbProfile: any): UserProfile {
//     return {
//       id: dbProfile.id,
//       userId: dbProfile.user_id,
//       displayName: dbProfile.display_name,
//       bio: dbProfile.bio,
//       profileStep: dbProfile.profile_step,
//       completionPercentage: dbProfile.completion_percentage,
//       avatarUrl: dbProfile.avatar_url,
//       isActive: dbProfile.is_active,
//       isVerified: dbProfile.is_verified,
//       createdAt: dbProfile.created_at,
//       updatedAt: dbProfile.updated_at
//     };
//   }

//   // Sync profile to database (optional)
//   private syncToDatabase(profileData: UserProfileData): Observable<void> {
//     return new Observable(observer => {
//       Promise.all([
//         // Upsert user
//         this.supabaseService
//           .from('users')
//           .upsert({
//             id: profileData.user.id,
//             email: profileData.user.email,
//             first_name: profileData.user.firstName,
//             last_name: profileData.user.lastName,
//             phone: profileData.user.phone,
//             user_type: profileData.user.userType,
//             status: profileData.user.status,
//             email_verified: profileData.user.emailVerified
//           }),
        
//         // Upsert profile
//         this.supabaseService
//           .from('user_profiles')
//           .upsert({
//             user_id: profileData.profile.userId,
//             display_name: profileData.profile.displayName,
//             bio: profileData.profile.bio,
//             profile_step: profileData.profile.profileStep,
//             completion_percentage: profileData.profile.completionPercentage,
//             avatar_url: profileData.profile.avatarUrl,
//             is_active: profileData.profile.isActive,
//             is_verified: profileData.profile.isVerified
//           })
//       ]).then(() => {
//         observer.next();
//         observer.complete();
//       }).catch(error => {
//         observer.error(error);
//       });
//     });
//   }

//   // Update profile (works with or without database)
//   updateProfile(updates: ProfileUpdateRequest): Observable<UserProfileData> {
//     this.isLoading.set(true);
//     this.error.set(null);
    
//     const currentData = this.profileData();
//     if (!currentData) {
//       this.isLoading.set(false);
//       return throwError(() => new Error('No profile data to update'));
//     }

//     // Apply updates
//     const updatedData: UserProfileData = {
//       user: { ...currentData.user, ...updates.userUpdates },
//       profile: { ...currentData.profile, ...updates.profileUpdates },
//       organization: currentData.organization ? { ...currentData.organization, ...updates.organizationUpdates } : undefined,
//       organizationUser: currentData.organizationUser ? { ...currentData.organizationUser, ...updates.organizationUserUpdates } : undefined
//     };

//     // Update locally first
//     this.profileData.set(updatedData);
//     this.profileDataSubject.next(updatedData);

//     // Sync to database in background
//     return this.syncToDatabase(updatedData).pipe(
//       map(() => updatedData),
//       tap(() => {
//         this.isLoading.set(false);
//         console.log('✅ Profile updated and synced');
//       }),
//       catchError(error => {
//         console.warn('⚠️ Profile updated locally but database sync failed:', error);
//         this.isLoading.set(false);
//         // Return success anyway since local update worked
//         return of(updatedData);
//       })
//     );
//   }

//   // Update user basic info
//   updateUserInfo(updates: Partial<User>): Observable<User> {
//     return this.updateProfile({ userUpdates: updates }).pipe(
//       map(profile => profile.user)
//     );
//   }

//   // Clear profile data (on logout)
//   clearProfileData(): void {
//     this.profileData.set(null);
//     this.profileDataSubject.next(null);
//     this.error.set(null);
//   }

//   // Helper methods for UI
//   getUserTypeDisplayName(userType: UserType): string {
//     const displayNames: Record<UserType, string> = {
//       'sme': 'SME',
//       'funder': 'Funder',
//       'admin': 'Administrator', 
//       'consultant': 'Consultant'
//     };
//     return displayNames[userType] || userType;
//   }

//   // Get user initials for avatar
//   getUserInitials(): string {
//     const user = this.currentUser();
//     if (!user) return '';
    
//     return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
//   }

//   // Calculate profile completion percentage
//   calculateProfileCompletion(): number {
//     const profileData = this.profileData();
//     if (!profileData) return 0;

//     let completed = 0;
//     let total = 10;

//     // Basic user fields
//     if (profileData.user.firstName) completed++;
//     if (profileData.user.lastName) completed++;
//     if (profileData.user.email) completed++;
//     if (profileData.user.phone) completed++;
//     if (profileData.user.emailVerified) completed++;

//     // Profile fields
//     if (profileData.profile?.displayName) completed++;
//     if (profileData.profile?.bio) completed++;

//     // Organization
//     if (profileData.organization?.name) completed++;
//     if (profileData.organization?.description) completed++;

//     // Organization user
//     if (profileData.organizationUser) completed++;

//     return Math.round((completed / total) * 100);
//   }

//   // Force sync to database (manual trigger)
//   forceSyncToDatabase(): Observable<void> {
//     const profileData = this.profileData();
//     if (!profileData) {
//       return throwError(() => new Error('No profile data to sync'));
//     }

//     console.log('🔄 Force syncing to database...');
//     return this.syncToDatabase(profileData);
//   }
// }


// src/app/shared/services/profile-management.service.ts - FIXED PROMISE HANDLING
import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
 
import { 
  User, 
  UserType,
  UserProfile,
  DEFAULT_PERMISSIONS,
  Organization,
  OrganizationPermissions,
  OrganizationType,
  OrganizationUser,
} from '../models/user.models';
 
import { AuthService } from '../../auth/production.auth.service';
import { SharedSupabaseService } from './shared-supabase.service';

export interface UserProfileData {
  user: User;
  profile: UserProfile;
  organizationUser?: OrganizationUser;
  organization?: Organization;
}

export interface ProfileUpdateRequest {
  userUpdates?: Partial<User>;
  profileUpdates?: Partial<UserProfile>;
  organizationUpdates?: Partial<Organization>;
  organizationUserUpdates?: Partial<OrganizationUser>;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileManagementService {
  private authService = inject(AuthService);
  private supabaseService = inject(SharedSupabaseService);
  
  // State management
  private profileDataSubject = new BehaviorSubject<UserProfileData | null>(null);
  
  // Signals for reactive state
  profileData = signal<UserProfileData | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Computed values
  currentUser = computed(() => this.profileData()?.user || null);
  currentProfile = computed(() => this.profileData()?.profile || null);
  currentOrganization = computed(() => this.profileData()?.organization || null);
  currentOrganizationUser = computed(() => this.profileData()?.organizationUser || null);
  
  userDisplayName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });
  
  profileCompletionPercentage = computed(() => {
    const profile = this.currentProfile();
    return profile?.completionPercentage || 0;
  });
  
  userPermissions = computed(() => {
    const orgUser = this.currentOrganizationUser();
    return orgUser?.permissions || null;
  });
  
  canManageUsers = computed(() => {
    const permissions = this.userPermissions();
    return permissions?.canManageUsers || false;
  });
  
  canManageSettings = computed(() => {
    const permissions = this.userPermissions();
    return permissions?.canManageOrganizationSettings || false;
  });

  canCreateOpportunities = computed(() => {
    const permissions = this.userPermissions();
    return permissions?.canCreateOpportunities || false;
  });

  // Organization-specific computed values
  organizationId = computed(() => this.currentOrganization()?.id || null);
  
  isOrganizationAdmin = computed(() => {
    const orgUser = this.currentOrganizationUser();
    return orgUser?.role === 'admin' || orgUser?.role === 'owner';
  });

  organizationType = computed(() => {
    const org = this.currentOrganization();
    return org?.organizationType;
  });

  isFunderOrganization = computed(() => {
    const orgType = this.organizationType();
    return orgType && [
      'investment_fund', 
      'bank', 
      'government', 
      'ngo', 
      'private_equity', 
      'venture_capital'
    ].includes(orgType);
  });

  constructor() {
    // Initialize from auth service if available
    const currentAuth = this.authService.user();
    if (currentAuth) {
      this.loadProfileData().subscribe({
        next: (profileData) => {
          console.log('Profile data loaded successfully');
        },
        error: (error) => {
          console.error('Failed to load initial profile data:', error);
          this.createProfileFromAuthUser();
        }
      });
    }
  }

  // ===============================
  // CORE PROFILE LOADING
  // ===============================

  loadProfileData(): Observable<UserProfileData> {
    this.isLoading.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    console.log('Loading profile data for user:', currentAuth.id);

    return this.loadFromDatabase(currentAuth.id).pipe(
      catchError((error) => {
        console.warn('Database load failed, creating from auth user:', error);
        return this.createProfileFromAuthUser();
      }),
      tap(profileData => {
        this.profileData.set(profileData);
        this.profileDataSubject.next(profileData);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to load profile data');
        this.isLoading.set(false);
        console.error('Profile load error:', error);
        return throwError(() => error);
      })
    );
  }

  // Enhanced database loading to include unified organization data
  private loadFromDatabase(userId: string): Observable<UserProfileData> {
    return new Observable(observer => {
      Promise.all([
        // Load user from database
        this.supabaseService
          .from('users')
          .select('*')
          .eq('id', userId)
          .single(),
        
        // Load user profile from database
        this.supabaseService
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single(),
        
        // Load organization user relationship with organization data
        this.supabaseService
          .from('organization_users')
          .select(`
            *,
            organizations (*)
          `)
          .eq('user_id', userId)
          .maybeSingle()
      ]).then(([userResult, profileResult, orgUserResult]) => {
        
        if (userResult.error && profileResult.error) {
          throw new Error('User not found in database');
        }

        // Build profile data from database
        const profileData: UserProfileData = {
          user: userResult.data ? this.mapDatabaseUserToModel(userResult.data) : this.createUserFromAuth(),
          profile: profileResult.data ? this.mapDatabaseProfileToModel(profileResult.data) : this.createDefaultProfile(),
        };

        // Add organization data if available
        if (orgUserResult.data) {
          profileData.organizationUser = this.mapDatabaseOrgUserToModel(orgUserResult.data);
          if (orgUserResult.data.organizations) {
            profileData.organization = this.mapDatabaseOrganizationToModel(orgUserResult.data.organizations);
          }
        }

        observer.next(profileData);
        observer.complete();
        
      }, (error) => {
        observer.error(error);
      });
    });
  }

  // Create profile data from auth user (fallback)
  private createProfileFromAuthUser(): Observable<UserProfileData> {
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      return throwError(() => new Error('No authenticated user'));
    }

    const profileData: UserProfileData = {
      user: this.createUserFromAuth(),
      profile: this.createDefaultProfile()
    };

    console.log('Created profile from auth user:', profileData);
    
    // Optionally sync to database in background
    this.syncToDatabase(profileData).subscribe({
      next: () => console.log('Profile synced to database'),
      error: (error) => console.warn('Database sync failed:', error)
    });

    return of(profileData);
  }

  // ===============================
  // ORGANIZATION MANAGEMENT
  // ===============================

  // Get current organization ID with fallback strategies
  getCurrentOrganizationId(): string | null {
    // First try from computed organization
    const orgFromProfile = this.currentOrganization()?.id;
    if (orgFromProfile) {
      return orgFromProfile;
    }

    // Fallback: check if organizationUser has the organization reference
    const orgUser = this.currentOrganizationUser();
    if (orgUser?.organizationId) {
      return orgUser.organizationId;
    }

    return null;
  }

  // Method to specifically load organization for funders
  loadOrganizationData(): Observable<Organization | null> {
    const userId = this.authService.user()?.id;
    if (!userId) {
      return throwError(() => new Error('User not authenticated'));
    }

    return new Observable(observer => {
      this.supabaseService
        .from('organization_users')
        .select('*, organizations(*)')
        .eq('user_id', userId)
        .maybeSingle()
        .then(
          ({ data, error }) => {
            if (error || !data?.organizations) {
              observer.next(null);
              observer.complete();
              return;
            }

            const organization = this.mapDatabaseOrganizationToModel(data.organizations);
            
            // Update current profile data with organization
            const currentData = this.profileData();
            if (currentData) {
              const updatedData = {
                ...currentData,
                organization,
                organizationUser: this.mapDatabaseOrgUserToModel(data)
              };
              this.profileData.set(updatedData);
              this.profileDataSubject.next(updatedData);
            }

            observer.next(organization);
            observer.complete();
          },
          (error) => observer.error(error)
        );
    });
  }

  // Update organization info
  updateOrganizationInfo(updates: Partial<Organization>): Observable<Organization> {
    return this.updateProfile({ organizationUpdates: updates }).pipe(
      map(profile => profile.organization!)
    );
  }

  // ===============================
  // TEAM MANAGEMENT
  // ===============================

  // Get organization team members (if user has permission)
  getOrganizationTeam(): Observable<OrganizationUser[]> {
    const org = this.currentOrganization();
    if (!org) return throwError(() => new Error('No organization found'));

    return new Observable(observer => {
      this.supabaseService
        .from('organization_users')
        .select('*, users(*)')
        .eq('organization_id', org.id)
        .then(
          ({ data, error }) => {
            if (error) throw error;
            const mappedData = (data || []).map(item => ({
              ...this.mapDatabaseOrgUserToModel(item),
              user: item.users ? this.mapDatabaseUserToModel(item.users) : undefined
            }));
            observer.next(mappedData);
            observer.complete();
          },
          (error) => observer.error(error)
        );
    });
  }

  // Invite new team member
  inviteTeamMember(email: string, role: string, permissions: OrganizationPermissions): Observable<void> {
    const org = this.currentOrganization();
    if (!org) return throwError(() => new Error('No organization found'));

    return new Observable(observer => {
      // This would typically send an email invitation
      console.log('Team member invitation:', { email, role, permissions, orgId: org.id });
      observer.next();
      observer.complete();
    });
  }

  // Update team member role/permissions - FIXED
  updateTeamMember(userId: string, updates: Partial<OrganizationUser>): Observable<OrganizationUser> {
    const org = this.currentOrganization();
    if (!org) return throwError(() => new Error('No organization found'));

    return new Observable(observer => {
      this.supabaseService
        .from('organization_users')
        .update({
          role: updates.role,
          permissions: updates.permissions,
          status: updates.status,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('organization_id', org.id)
        .select()
        .single()
        .then(
          ({ data, error }) => {
            if (error) throw error;
            observer.next(this.mapDatabaseOrgUserToModel(data));
            observer.complete();
          },
          (error) => observer.error(error)
        );
    });
  }

  // Remove team member - FIXED
  removeTeamMember(userId: string): Observable<void> {
    const org = this.currentOrganization();
    if (!org) return throwError(() => new Error('No organization found'));

    return new Observable(observer => {
      this.supabaseService
        .from('organization_users')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', org.id)
        .then(
          ({ error }) => {
            if (error) throw error;
            observer.next();
            observer.complete();
          },
          (error) => observer.error(error)
        );
    });
  }

  // ===============================
  // PROFILE UPDATES
  // ===============================

  // Update profile (works with or without database)
  updateProfile(updates: ProfileUpdateRequest): Observable<UserProfileData> {
    this.isLoading.set(true);
    this.error.set(null);
    
    const currentData = this.profileData();
    if (!currentData) {
      this.isLoading.set(false);
      return throwError(() => new Error('No profile data to update'));
    }

    // Apply updates
    const updatedData: UserProfileData = {
      user: { ...currentData.user, ...updates.userUpdates },
      profile: { ...currentData.profile, ...updates.profileUpdates },
      organization: currentData.organization ? { ...currentData.organization, ...updates.organizationUpdates } : undefined,
      organizationUser: currentData.organizationUser ? { ...currentData.organizationUser, ...updates.organizationUserUpdates } : undefined
    };

    // Update locally first
    this.profileData.set(updatedData);
    this.profileDataSubject.next(updatedData);

    // Sync to database in background
    return this.syncToDatabase(updatedData).pipe(
      map(() => updatedData),
      tap(() => {
        this.isLoading.set(false);
        console.log('Profile updated and synced');
      }),
      catchError(error => {
        console.warn('Profile updated locally but database sync failed:', error);
        this.isLoading.set(false);
        // Return success anyway since local update worked
        return of(updatedData);
      })
    );
  }

  // Update user basic info
  updateUserInfo(updates: Partial<User>): Observable<User> {
    return this.updateProfile({ userUpdates: updates }).pipe(
      map(profile => profile.user)
    );
  }

  // Upload profile picture - FIXED
  uploadProfilePicture(file: File): Observable<string> {
    this.isLoading.set(true);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return new Observable(observer => {
      const fileName = `${currentAuth.id}/profile-picture-${Date.now()}.${file.name.split('.').pop()}`;
      
      this.supabaseService.storage
        .from('profile-pictures')
        .upload(fileName, file)
        .then(
          ({ data, error }) => {
            if (error) throw error;
            
            // Get public URL
            const { data: { publicUrl } } = this.supabaseService.storage
              .from('profile-pictures')
              .getPublicUrl(fileName);
            
            // Update profile with new picture URL
            const currentProfile = this.profileData();
            if (currentProfile) {
              const updatedProfile = {
                ...currentProfile,
                user: {
                  ...currentProfile.user,
                  profilePicture: publicUrl
                }
              };
              this.profileData.set(updatedProfile);
              this.profileDataSubject.next(updatedProfile);
            }
            
            this.isLoading.set(false);
            observer.next(publicUrl);
            observer.complete();
          },
          (error) => {
            this.error.set('Failed to upload profile picture');
            this.isLoading.set(false);
            observer.error(error);
          }
        );
    });
  }

  // ===============================
  // DATABASE MAPPING
  // ===============================

  private mapDatabaseUserToModel(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      phone: dbUser.phone,
      userType: dbUser.user_type,
      status: dbUser.status,
      emailVerified: dbUser.email_verified,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
      phoneVerified: dbUser.phone_verified || false,
      accountTier: dbUser.account_tier || 'basic',
      profilePicture: dbUser.profile_picture
    };
  }

  private mapDatabaseProfileToModel(dbProfile: any): UserProfile {
    return {
      id: dbProfile.id,
      userId: dbProfile.user_id,
      displayName: dbProfile.display_name,
      bio: dbProfile.bio,
      profileStep: dbProfile.profile_step,
      completionPercentage: dbProfile.completion_percentage,
      avatarUrl: dbProfile.avatar_url,
      isActive: dbProfile.is_active,
      isVerified: dbProfile.is_verified,
      createdAt: new Date(dbProfile.created_at),
      updatedAt: new Date(dbProfile.updated_at)
    };
  }

  private mapDatabaseOrganizationToModel(dbOrg: any): Organization {
    return {
      id: dbOrg.id,
      name: dbOrg.name,
      description: dbOrg.description,
      organizationType: dbOrg.organization_type as OrganizationType,
      status: dbOrg.status,
      website: dbOrg.website,
      logoUrl: dbOrg.logo_url,
      legalName: dbOrg.legal_name,
      registrationNumber: dbOrg.registration_number,
      taxNumber: dbOrg.tax_number,
      foundedYear: dbOrg.founded_year,
      employeeCount: dbOrg.employee_count,
      assetsUnderManagement: dbOrg.assets_under_management,
      isVerified: dbOrg.is_verified,
      verificationDate: dbOrg.verification_date ? new Date(dbOrg.verification_date) : undefined,
      email: dbOrg.email,
      phone: dbOrg.phone,
      addressLine1: dbOrg.address_line1,
      addressLine2: dbOrg.address_line2,
      city: dbOrg.city,
      province: dbOrg.province,
      postalCode: dbOrg.postal_code,
      country: dbOrg.country || 'South Africa',
      createdAt: new Date(dbOrg.created_at),
      updatedAt: new Date(dbOrg.updated_at),
      version: dbOrg.version
    };
  }

  private mapDatabaseOrgUserToModel(dbOrgUser: any): OrganizationUser {
    return {
      id: dbOrgUser.id,
      userId: dbOrgUser.user_id,
      organizationId: dbOrgUser.organization_id,
      role: dbOrgUser.role,
      permissions: dbOrgUser.permissions || DEFAULT_PERMISSIONS[dbOrgUser.role] || {},
      status: dbOrgUser.status,
      joinedAt: new Date(dbOrgUser.joined_at),
      createdAt: new Date(dbOrgUser.created_at),
      updatedAt: new Date(dbOrgUser.updated_at)
    };
  }

  // ===============================
  // HELPER METHODS
  // ===============================

  createUserFromAuth(): User {
    const authUser = this.authService.user();
    if (!authUser) throw new Error('No auth user');

    return {
      id: authUser.id,
      email: authUser.email,
      firstName: authUser.firstName,
      lastName: authUser.lastName,
      phone: authUser.phone,
      userType: authUser.userType as UserType,
      status: 'active',
      emailVerified: authUser.isVerified,
      createdAt: new Date(authUser.createdAt),
      updatedAt: new Date(authUser.createdAt),
      phoneVerified: false,
      accountTier: 'basic'
    };
  }

  createDefaultProfile(): UserProfile {
    const authUser = this.authService.user();
    if (!authUser) throw new Error('No auth user');

    return {
      id: `profile-${authUser.id}`,
      userId: authUser.id,
      displayName: `${authUser.firstName} ${authUser.lastName}`,
      profileStep: authUser.profileStep,
      completionPercentage: authUser.completionPercentage,
      isActive: true,
      isVerified: authUser.isVerified,
      createdAt: new Date(authUser.createdAt),
      updatedAt: new Date(authUser.createdAt)
    };
  }

  // Sync profile to database - FIXED
  private syncToDatabase(profileData: UserProfileData): Observable<void> {
    return new Observable(observer => {
      Promise.all([
        // Upsert user
        this.supabaseService
          .from('users')
          .upsert({
            id: profileData.user.id,
            email: profileData.user.email,
            first_name: profileData.user.firstName,
            last_name: profileData.user.lastName,
            phone: profileData.user.phone,
            user_type: profileData.user.userType,
            status: profileData.user.status,
            email_verified: profileData.user.emailVerified,
            phone_verified: profileData.user.phoneVerified,
            account_tier: profileData.user.accountTier,
            profile_picture: profileData.user.profilePicture,
            updated_at: new Date().toISOString()
          }),
        
        // Upsert profile
        this.supabaseService
          .from('user_profiles')
          .upsert({
            user_id: profileData.profile.userId,
            display_name: profileData.profile.displayName,
            bio: profileData.profile.bio,
            profile_step: profileData.profile.profileStep,
            completion_percentage: profileData.profile.completionPercentage,
            avatar_url: profileData.profile.avatarUrl,
            is_active: profileData.profile.isActive,
            is_verified: profileData.profile.isVerified,
            updated_at: new Date().toISOString()
          })
      ]).then(
        () => {
          observer.next();
          observer.complete();
        },
        (error) => observer.error(error)
      );
    });
  }

  // Utility methods
  getUserTypeDisplayName(userType: UserType): string {
    const displayNames: Record<UserType, string> = {
      'sme': 'SME',
      'funder': 'Funder',
      'admin': 'Administrator', 
      'consultant': 'Consultant'
    };
    return displayNames[userType] || userType;
  }

  getAccountTierDisplayName(tier: string): string {
    const displayNames: Record<string, string> = {
      'basic': 'Basic',
      'premium': 'Premium',
      'enterprise': 'Enterprise'
    };
    return displayNames[tier] || tier;
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return '';
    
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  }

  calculateProfileCompletion(): number {
    const profileData = this.profileData();
    if (!profileData) return 0;

    let completed = 0;
    let total = 10;

    // Basic user fields
    if (profileData.user.firstName) completed++;
    if (profileData.user.lastName) completed++;
    if (profileData.user.email) completed++;
    if (profileData.user.phone) completed++;
    if (profileData.user.emailVerified) completed++;

    // Profile fields
    if (profileData.profile?.displayName) completed++;
    if (profileData.profile?.bio) completed++;

    // Organization
    if (profileData.organization?.name) completed++;
    if (profileData.organization?.description) completed++;

    // Organization user
    if (profileData.organizationUser) completed++;

    return Math.round((completed / total) * 100);
  }

  // Clear profile data (on logout)
  clearProfileData(): void {
    this.profileData.set(null);
    this.profileDataSubject.next(null);
    this.error.set(null);
  }

  // Force sync to database (manual trigger)
  forceSyncToDatabase(): Observable<void> {
    const profileData = this.profileData();
    if (!profileData) {
      return throwError(() => new Error('No profile data to sync'));
    }

    console.log('Force syncing to database...');
    return this.syncToDatabase(profileData);
  }
}