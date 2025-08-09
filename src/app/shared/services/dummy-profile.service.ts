// src/app/shared/services/dummy-profile-data.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, delay, BehaviorSubject } from 'rxjs';
import { map, filter, switchMap } from 'rxjs/operators';
import { 
  User, 
  SMEUser, 
  FunderUser, 
  SMEOrganization, 
  FunderOrganization, 
  UserType,
  SMERole,
  FunderRole,
  SMEPermissions,
  FunderPermissions,
  UserInvitation
} from '../models/user.models';

export interface DummyUserProfileData {
  user: User;
  organizationUser: SMEUser | FunderUser;
  organization: SMEOrganization | FunderOrganization;
  teamMembers: (SMEUser | FunderUser)[];
  pendingInvitations: UserInvitation[];
}

@Injectable({
  providedIn: 'root'
})
export class DummyProfileDataService {
  private profileDataSubject = new BehaviorSubject<DummyUserProfileData | null>(null);
  private isInitialized = false;
  
  constructor() {
    this.initializeDummyData();
  }

  private initializeDummyData() {
    if (this.isInitialized) return;
    
    // Create dummy SME organization data
    const smeOrganization: SMEOrganization = {
      id: 'org-1',
      companyName: 'TechFlow Solutions',
      registrationNumber: '2019/123456/07',
      vatNumber: '4123456789',
      industry: 'technology',
      accountTier: 'premium',
      subscriptionId: 'sub_123',
      billingDetails: {
        companyName: 'TechFlow Solutions',
        vatNumber: '4123456789',
        address: {
          street: '123 Innovation Drive',
          suburb: 'Sandton',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2196',
          country: 'South Africa'
        },
        billingEmail: 'billing@techflow.co.za',
        paymentMethod: {
          id: 'pm_123',
          type: 'card',
          last4: '4242',
          brand: 'visa',
          isDefault: true,
          expiryMonth: 12,
          expiryYear: 2026
        },
        invoiceHistory: []
      },
      settings: {
        emailNotifications: {
          applicationUpdates: true,
          fundingMatches: true,
          documentRequests: true,
          systemUpdates: false
        },
        smsNotifications: {
          urgentUpdates: true,
          applicationDeadlines: true
        },
        profileVisibility: 'verified_funders',
        allowDirectContact: true,
        shareDataWithPartners: false,
        allowAnalytics: true
      },
      isActive: true,
      isVerified: true,
      verifiedAt: new Date('2024-01-15'),
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2024-08-01')
    };

    // Current user
    const currentUser: User = {
      id: 'user-1',
      email: 'john.doe@techflow.co.za',
      firstName: 'John',
      lastName: 'Doe',
      userType: 'sme',
      phone: '+27 82 123 4567',
      profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
      accountTier: 'premium',
      subscriptionId: 'sub_123',
      billingEmail: 'billing@techflow.co.za',
      lastLoginAt: new Date('2024-08-08'),
      createdAt: new Date('2023-12-01'),
      updatedAt: new Date('2024-08-08')
    };

    // SME permissions for owner
    const ownerPermissions: SMEPermissions = {
      canEditProfile: true,
      canViewProfile: true,
      canDeleteProfile: true,
      canCreateApplications: true,
      canViewApplications: true,
      canEditApplications: true,
      canDeleteApplications: true,
      canSubmitApplications: true,
      canUploadDocuments: true,
      canViewDocuments: true,
      canDeleteDocuments: true,
      canViewFinancials: true,
      canEditFinancials: true,
      canInviteUsers: true,
      canManageUsers: true,
      canManageRoles: true,
      canViewBilling: true,
      canManageBilling: true,
      canViewReports: true,
      canExportReports: true
    };

    // Current organization user (owner)
    const currentOrgUser: SMEUser = {
      id: 'sme-user-1',
      userId: 'user-1',
      organizationId: 'org-1',
      role: {
        id: 'role-owner',
        name: 'owner',
        displayName: 'Owner',
        description: 'Full access to all organization features'
      },
      permissions: ownerPermissions,
      profileComplete: true,
      onboardingComplete: true,
      isOwner: true,
      joinedAt: new Date('2023-12-01'),
      updatedAt: new Date('2024-08-01')
    };

    // Team members
    const teamMembers: SMEUser[] = [
      {
        id: 'sme-user-2',
        userId: 'user-2',
        organizationId: 'org-1',
        role: {
          id: 'role-admin',
          name: 'admin',
          displayName: 'Administrator',
          description: 'Administrative access with most permissions'
        },
        permissions: {
          ...ownerPermissions,
          canDeleteProfile: false,
          canManageBilling: false
        },
        profileComplete: true,
        onboardingComplete: true,
        isOwner: false,
        invitedBy: 'user-1',
        joinedAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-07-20')
      },
      {
        id: 'sme-user-3',
        userId: 'user-3',
        organizationId: 'org-1',
        role: {
          id: 'role-manager',
          name: 'manager',
          displayName: 'Manager',
          description: 'Can manage applications and documents'
        },
        permissions: {
          canEditProfile: false,
          canViewProfile: true,
          canDeleteProfile: false,
          canCreateApplications: true,
          canViewApplications: true,
          canEditApplications: true,
          canDeleteApplications: false,
          canSubmitApplications: true,
          canUploadDocuments: true,
          canViewDocuments: true,
          canDeleteDocuments: false,
          canViewFinancials: true,
          canEditFinancials: false,
          canInviteUsers: false,
          canManageUsers: false,
          canManageRoles: false,
          canViewBilling: false,
          canManageBilling: false,
          canViewReports: true,
          canExportReports: false
        },
        profileComplete: true,
        onboardingComplete: true,
        isOwner: false,
        invitedBy: 'user-1',
        joinedAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-07-15')
      },
      {
        id: 'sme-user-4',
        userId: 'user-4',
        organizationId: 'org-1',
        role: {
          id: 'role-viewer',
          name: 'viewer',
          displayName: 'Viewer',
          description: 'Read-only access to most features'
        },
        permissions: {
          canEditProfile: false,
          canViewProfile: true,
          canDeleteProfile: false,
          canCreateApplications: false,
          canViewApplications: true,
          canEditApplications: false,
          canDeleteApplications: false,
          canSubmitApplications: false,
          canUploadDocuments: false,
          canViewDocuments: true,
          canDeleteDocuments: false,
          canViewFinancials: true,
          canEditFinancials: false,
          canInviteUsers: false,
          canManageUsers: false,
          canManageRoles: false,
          canViewBilling: false,
          canManageBilling: false,
          canViewReports: true,
          canExportReports: false
        },
        profileComplete: true,
        onboardingComplete: false,
        isOwner: false,
        invitedBy: 'user-2',
        joinedAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-07-01')
      }
    ];

    // Pending invitations
    const pendingInvitations: UserInvitation[] = [
      {
        id: 'inv-1',
        organizationId: 'org-1',
        organizationType: 'sme',
        inviterUserId: 'user-1',
        inviteeEmail: 'sarah.wilson@gmail.com',
        inviteeRole: 'manager',
        message: 'Welcome to our team! Looking forward to working with you.',
        permissions: teamMembers[1].permissions,
        status: 'pending',
        expiresAt: new Date('2024-08-20'),
        createdAt: new Date('2024-08-05')
      }
    ];

    const profileData: DummyUserProfileData = {
      user: currentUser,
      organizationUser: currentOrgUser,
      organization: smeOrganization,
      teamMembers: [currentOrgUser, ...teamMembers],
      pendingInvitations
    };

    this.profileDataSubject.next(profileData);
    this.isInitialized = true;
  }

  // Get profile data - ensures data exists
  getProfileData(): Observable<DummyUserProfileData> {
    return this.profileDataSubject.asObservable().pipe(
      filter(data => data !== null),
      map(data => data!),
      delay(300)
    );
  }

  updateUserInfo(updates: Partial<User>): Observable<User> {
    return this.getProfileData().pipe(
      delay(500),
      map(data => {
        const updatedUser: User = { 
          ...data.user, 
          ...updates, 
          updatedAt: new Date() 
        };
        const updatedData = { ...data, user: updatedUser };
        this.profileDataSubject.next(updatedData);
        return updatedUser;
      })
    );
  }

  updateOrganizationInfo(updates: Partial<SMEOrganization | FunderOrganization>): Observable<SMEOrganization | FunderOrganization> {
    return this.getProfileData().pipe(
      delay(500),
      map(data => {
        const currentOrg = data.organization;
        let updatedOrg: SMEOrganization | FunderOrganization;
        
        // Type-safe update based on organization type
        if ('companyName' in currentOrg) {
          // SME Organization
          updatedOrg = {
            ...currentOrg,
            ...updates,
            updatedAt: new Date()
          } as SMEOrganization;
        } else {
          // Funder Organization
          updatedOrg = {
            ...currentOrg,
            ...updates,
            updatedAt: new Date()
          } as FunderOrganization;
        }
        
        const updatedData = { ...data, organization: updatedOrg };
        this.profileDataSubject.next(updatedData);
        return updatedOrg;
      })
    );
  }

  uploadProfilePicture(file: File): Observable<string> {
    const profilePictureUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';
    
    return this.getProfileData().pipe(
      delay(1000),
      map(data => {
        const updatedUser: User = { 
          ...data.user, 
          profilePicture: profilePictureUrl,
          updatedAt: new Date()
        };
        const updatedData = { ...data, user: updatedUser };
        this.profileDataSubject.next(updatedData);
        return profilePictureUrl;
      })
    );
  }

  getOrganizationTeam(): Observable<(SMEUser | FunderUser)[]> {
    return this.getProfileData().pipe(
      delay(300),
      map(data => data.teamMembers)
    );
  }

  inviteTeamMember(email: string, role: string, permissions: any): Observable<void> {
    return this.getProfileData().pipe(
      delay(800),
      map(data => {
        const newInvitation: UserInvitation = {
          id: `inv-${Date.now()}`,
          organizationId: data.organization.id,
          organizationType: 'sme',
          inviterUserId: data.user.id,
          inviteeEmail: email,
          inviteeRole: role,
          permissions,
          status: 'pending',
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          createdAt: new Date()
        };
        
        const updatedData = {
          ...data,
          pendingInvitations: [...data.pendingInvitations, newInvitation]
        };
        this.profileDataSubject.next(updatedData);
      })
    );
  }

  // Get dummy user data for team members
  getUserData(userId: string): User {
    const users: Record<string, User> = {
      'user-2': {
        id: 'user-2',
        email: 'jane.smith@techflow.co.za',
        firstName: 'Jane',
        lastName: 'Smith',
        userType: 'sme',
        phone: '+27 83 987 6543',
        profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b1e0?w=150&h=150&fit=crop&crop=face',
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        accountTier: 'premium',
        lastLoginAt: new Date('2024-08-07'),
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-08-07')
      },
      'user-3': {
        id: 'user-3',
        email: 'mike.johnson@techflow.co.za',
        firstName: 'Mike',
        lastName: 'Johnson',
        userType: 'sme',
        phone: '+27 84 555 1234',
        profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        status: 'active',
        emailVerified: true,
        phoneVerified: false,
        accountTier: 'premium',
        lastLoginAt: new Date('2024-08-06'),
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-08-06')
      },
      'user-4': {
        id: 'user-4',
        email: 'lisa.brown@techflow.co.za',
        firstName: 'Lisa',
        lastName: 'Brown',
        userType: 'sme',
        phone: '+27 85 444 5678',
        status: 'active',
        emailVerified: true,
        phoneVerified: true,
        accountTier: 'premium',
        lastLoginAt: new Date('2024-08-05'),
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-08-05')
      }
    };
    
    return users[userId] || {
      id: userId,
      email: 'unknown@techflow.co.za',
      firstName: 'Unknown',
      lastName: 'User',
      userType: 'sme',
      status: 'active',
      emailVerified: false,
      phoneVerified: false,
      accountTier: 'basic',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Additional helper methods for team management
  removeTeamMember(userId: string): Observable<void> {
    return this.getProfileData().pipe(
      delay(500),
      map(data => {
        const updatedTeamMembers = data.teamMembers.filter(member => member.userId !== userId);
        const updatedData = { ...data, teamMembers: updatedTeamMembers };
        this.profileDataSubject.next(updatedData);
      })
    );
  }

  resendInvitation(invitationId: string): Observable<void> {
    return this.getProfileData().pipe(
      delay(500),
      map(data => {
        const updatedInvitations = data.pendingInvitations.map(inv => 
          inv.id === invitationId 
            ? { ...inv, createdAt: new Date(), expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }
            : inv
        );
        const updatedData = { ...data, pendingInvitations: updatedInvitations };
        this.profileDataSubject.next(updatedData);
      })
    );
  }

  revokeInvitation(invitationId: string): Observable<void> {
    return this.getProfileData().pipe(
      delay(500),
      map(data => {
        const updatedInvitations = data.pendingInvitations.filter(inv => inv.id !== invitationId);
        const updatedData = { ...data, pendingInvitations: updatedInvitations };
        this.profileDataSubject.next(updatedData);
      })
    );
  }

  // Clear data on logout
  clearData(): void {
    this.profileDataSubject.next(null);
    this.isInitialized = false;
  }
}