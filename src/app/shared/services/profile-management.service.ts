// src/app/shared/services/profile-management.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { User, SMEUser, FunderUser, SMEOrganization, FunderOrganization, UserType } from '../models/user.models';
import { AuthService } from '../../auth/auth.service';

export interface UserProfileData {
  user: User;
  organizationUser: SMEUser | FunderUser;
  organization: SMEOrganization | FunderOrganization;
}

export interface ProfileUpdateRequest {
  userUpdates?: Partial<User>;
  organizationUpdates?: Partial<SMEOrganization | FunderOrganization>;
  organizationUserUpdates?: Partial<SMEUser | FunderUser>;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileManagementService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  
  // State management
  private profileDataSubject = new BehaviorSubject<UserProfileData | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  // Signals for reactive state
  profileData = signal<UserProfileData | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Computed values
  currentUser = computed(() => this.profileData()?.user || null);
  currentOrganization = computed(() => this.profileData()?.organization || null);
  currentOrganizationUser = computed(() => this.profileData()?.organizationUser || null);
  userDisplayName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
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
    if (currentAuth?.user) {
      this.loadProfileData().subscribe();
    }
  }

  // Load complete profile data
  loadProfileData(): Observable<UserProfileData> {
    this.isLoading.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth?.user) {
      throw new Error('User not authenticated');
    }

    return this.http.get<UserProfileData>(`/api/users/${currentAuth.user.id}/profile`).pipe(
      tap(profileData => {
        this.profileData.set(profileData);
        this.profileDataSubject.next(profileData);
        this.isLoading.set(false);
      }),
      catchError(error => {
        this.error.set('Failed to load profile data');
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  // Update user profile
  updateProfile(updates: ProfileUpdateRequest): Observable<UserProfileData> {
    this.isLoading.set(true);
    this.error.set(null);
    
    const currentAuth = this.authService.user();
    if (!currentAuth?.user) {
      throw new Error('User not authenticated');
    }

    return this.http.patch<UserProfileData>(
      `/api/users/${currentAuth.user.id}/profile`,
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
        throw error;
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
  updateOrganizationInfo(updates: Partial<SMEOrganization | FunderOrganization>): Observable<SMEOrganization | FunderOrganization> {
    return this.updateProfile({ organizationUpdates: updates }).pipe(
      map(profile => profile.organization)
    );
  }

  // Update user role/permissions within organization
  updateOrganizationUser(updates: Partial<SMEUser | FunderUser>): Observable<SMEUser | FunderUser> {
    return this.updateProfile({ organizationUserUpdates: updates }).pipe(
      map(profile => profile.organizationUser)
    );
  }

  // Upload profile picture
  uploadProfilePicture(file: File): Observable<string> {
    this.isLoading.set(true);
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const currentAuth = this.authService.user();
    if (!currentAuth?.user) {
      throw new Error('User not authenticated');
    }

    return this.http.post<{ profilePictureUrl: string }>(
      `/api/users/${currentAuth.user.id}/profile-picture`,
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
        }
        this.isLoading.set(false);
      }),
      map(response => response.profilePictureUrl),
      catchError(error => {
        this.error.set('Failed to upload profile picture');
        this.isLoading.set(false);
        throw error;
      })
    );
  }

  // Get organization team members (if user has permission)
  getOrganizationTeam(): Observable<(SMEUser | FunderUser)[]> {
    const org = this.currentOrganization();
    if (!org) throw new Error('No organization found');

    return this.http.get<(SMEUser | FunderUser)[]>(`/api/organizations/${org.id}/team`);
  }

  // Invite new team member
  inviteTeamMember(email: string, role: string, permissions: any): Observable<void> {
    const org = this.currentOrganization();
    if (!org) throw new Error('No organization found');

    return this.http.post<void>(`/api/organizations/${org.id}/invite`, {
      email,
      role,
      permissions
    });
  }

  // Update team member role/permissions
  updateTeamMember(userId: string, updates: Partial<SMEUser | FunderUser>): Observable<SMEUser | FunderUser> {
    const org = this.currentOrganization();
    if (!org) throw new Error('No organization found');

    return this.http.patch<SMEUser | FunderUser>(
      `/api/organizations/${org.id}/team/${userId}`,
      updates
    );
  }

  // Remove team member
  removeTeamMember(userId: string): Observable<void> {
    const org = this.currentOrganization();
    if (!org) throw new Error('No organization found');

    return this.http.delete<void>(`/api/organizations/${org.id}/team/${userId}`);
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
}