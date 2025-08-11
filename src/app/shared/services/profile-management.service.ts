// src/app/shared/services/profile-management.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { 
  User, 

  UserType,
  Organization,
  OrganizationUser,
  UserProfile,
 
} from '../models/user.models';
import { AuthService } from '../../auth/production.auth.service';
 

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
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly API_BASE = 'http://localhost:3000/api';
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
    return permissions && 'canManageUsers' in permissions 
      ? permissions.canManageUsers 
      : false;
  });
  
  canManageSettings = computed(() => {
    const permissions = this.userPermissions();
    return permissions && 'canManageOrganizationSettings' in permissions 
      ? permissions.canManageOrganizationSettings 
      : true; // Default for SME users
  });

  constructor() {
    // Initialize from auth service if available
    const currentAuth = this.authService.user();
    if (currentAuth) {
      this.loadProfileData().subscribe({
        error: (error) => {
          console.error('Failed to load initial profile data:', error);
        }
      });
    }
  }

// In ProfileManagementService, revert to proper endpoint:
loadProfileData(): Observable<UserProfileData> {
  this.isLoading.set(true);
  this.error.set(null);
  
  const currentAuth = this.authService.user();
  if (!currentAuth) {
    this.isLoading.set(false);
    return throwError(() => new Error('User not authenticated'));
  }

  // Use the proper users endpoint
  return this.http.get<UserProfileData>(`${this.API_BASE}/users/${currentAuth.id}/profile`).pipe(
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

  // Load complete profile data
//   loadProfileData(): Observable<UserProfileData> {
//     this.isLoading.set(true);
//     this.error.set(null);
    
//     const currentAuth = this.authService.user();
//     if (!currentAuth) {
//       this.isLoading.set(false);
//       return throwError(() => new Error('User not authenticated'));
//     }
 
// return this.http.get<UserProfileData>(`${this.API_BASE}/users/${currentAuth.id}/profile`).pipe(
     
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

  // Update user profile
  updateProfile(updates: ProfileUpdateRequest): Observable<UserProfileData> {
    this.isLoading.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.patch<UserProfileData>(
     `${this.API_BASE}/users/${currentAuth.id}/profile`,
      updates
    ).pipe(
      tap(updatedProfile => {
        this.profileData.set(updatedProfile);
        this.profileDataSubject.next(updatedProfile);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to update profile');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  // Update user basic info
  updateUserInfo(updates: Partial<User>): Observable<User> {
    return this.updateProfile({ userUpdates: updates }).pipe(
      map(profile => profile.user)
    );
  }

  // Update organization info
  updateOrganizationInfo(updates: Partial<Organization>): Observable<Organization> {
    return this.updateProfile({ organizationUpdates: updates }).pipe(
      map(profile => profile.organization!)
    );
  }

  // Update user role/permissions within organization
  updateOrganizationUser(updates: Partial<OrganizationUser>): Observable<OrganizationUser> {
    return this.updateProfile({ organizationUserUpdates: updates }).pipe(
      map(profile => profile.organizationUser!)
    );
  }

  // Upload profile picture
  uploadProfilePicture(file: File): Observable<string> {
    this.isLoading.set(true);
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const currentAuth = this.authService.user();
    if (!currentAuth) {
      this.isLoading.set(false);
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.post<{ profilePictureUrl: string }>(
     `${this.API_BASE}/users/${currentAuth.id}/profile-picture`,
      formData
    ).pipe(
      tap(response => {
        const currentProfile = this.profileData();
        if (currentProfile) {
          const updatedProfile = {
            ...currentProfile,
            user: {
              ...currentProfile.user,
              profilePicture: response.profilePictureUrl
            }
          };
          this.profileData.set(updatedProfile);
          this.profileDataSubject.next(updatedProfile);
        }
        this.isLoading.set(false);
      }),
      map(response => response.profilePictureUrl),
      catchError(error => {
        this.error.set('Failed to upload profile picture');
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  // Get organization team members (if user has permission)
  getOrganizationTeam(): Observable<OrganizationUser[]> {
    const org = this.currentOrganization();
    if (!org) return throwError(() => new Error('No organization found'));

    return this.http.get<OrganizationUser[]>(`/api/organizations/${org.id}/team`);
  }

  // Invite new team member
  inviteTeamMember(email: string, role: string, permissions: any): Observable<void> {
    const org = this.currentOrganization();
    if (!org) return throwError(() => new Error('No organization found'));

    return this.http.post<void>(`${this.API_BASE}/organizations/${org.id}/invite`, {
      email,
      role,
      permissions
    });
  }

  // Update team member role/permissions
  updateTeamMember(userId: string, updates: Partial<OrganizationUser>): Observable<OrganizationUser> {
    const org = this.currentOrganization();
    if (!org) return throwError(() => new Error('No organization found'));

    return this.http.patch<OrganizationUser>(
      `${this.API_BASE}/organizations/${org.id}/team/${userId}`,
      updates
    );
  }

  // Remove team member
  removeTeamMember(userId: string): Observable<void> {
    const org = this.currentOrganization();
    if (!org) return throwError(() => new Error('No organization found'));

    return this.http.delete<void>(`${this.API_BASE}/organizations/${org.id}/team/${userId}`);
  }

  // Clear profile data (on logout)
  clearProfileData(): void {
    this.profileData.set(null);
    this.profileDataSubject.next(null);
    this.error.set(null);
  }

  // Helper methods for UI
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

  // Get user initials for avatar
  getUserInitials(): string {
    const user = this.currentUser();
    if (!user) return '';
    
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  }

  // Calculate profile completion percentage (temporary implementation)
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
}