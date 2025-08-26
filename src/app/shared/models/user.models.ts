 

// src/app/shared/models/user.models.ts
export type UserType = 'sme' | 'funder' | 'admin' | 'consultant';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type AccountTier = 'basic' | 'premium' | 'enterprise';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  userType: UserType;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  accountTier: AccountTier;
  profilePicture?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  displayName?: string;
  bio?: string;
  profileStep: number;
  completionPercentage: number;
  avatarUrl?: string;
  preferences?: any;
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

 

// Legacy interfaces for compatibility with existing code
export interface SMEUser extends OrganizationUser {
  permissions: SMEPermissions;
}

export interface FunderUser extends OrganizationUser {
  permissions: FunderPermissions;
}

export interface SMEOrganization extends Organization {
  type: 'sme';
}

export interface FunderOrganization extends Organization {
  type: 'funder';
   userId?: string;
}

export interface SMEPermissions {
  canEditProfile: boolean;
  canViewProfile: boolean;
  canDeleteProfile: boolean;
  canCreateApplications: boolean;
  canViewApplications: boolean;
  canEditApplications: boolean;
  canDeleteApplications: boolean;
  canSubmitApplications: boolean;
  canUploadDocuments: boolean;
  canViewDocuments: boolean;
  canDeleteDocuments: boolean;
  canViewFinancials: boolean;
  canEditFinancials: boolean;
  canInviteUsers: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewBilling: boolean;
  canManageBilling: boolean;
  canViewReports: boolean;
  canExportReports: boolean;
}

export interface FunderPermissions {
  canViewApplications: boolean;
  canReviewApplications: boolean;
  canApproveApplications: boolean;
  canRejectApplications: boolean;
  canCreateOpportunities: boolean;
  canEditOpportunities: boolean;
  canDeleteOpportunities: boolean;
  canViewReports: boolean;
  canExportReports: boolean;
  canManageUsers: boolean;
  canManageOrganizationSettings: boolean;
}

// src/app/shared/models/organization.models.ts
export type OrganizationType = 
  | 'investment_fund' 
  | 'bank' 
  | 'government' 
  | 'ngo' 
  | 'private_equity' 
  | 'venture_capital'
  | 'sme'
  | 'consultant'
  | 'general';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  
  // Core fields
  organizationType: OrganizationType;
  status: 'active' | 'inactive' | 'pending_verification' | 'suspended';
  website?: string;
  logoUrl?: string;
  
  // Funder-specific fields (optional for SMEs)
  legalName?: string;
  registrationNumber?: string;
  taxNumber?: string;
  foundedYear?: number;
  employeeCount?: number;
  assetsUnderManagement?: number;
  isVerified: boolean;
  verificationDate?: Date;
  
  // Contact information
  email?: string;
  phone?: string;
  
  // Address information
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  version?: number;
}

export interface OrganizationUser {
  id: string;
  userId: string;
  organizationId: string;
  role: 'admin' | 'member' | 'viewer' | 'owner';
  permissions: OrganizationPermissions;
  status: 'active' | 'inactive' | 'pending';
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationPermissions {
  canManageOrganizationSettings?: boolean;
  canManageUsers?: boolean;
  canCreateOpportunities?: boolean;
  canManageApplications?: boolean;
  canViewReports?: boolean;
  canManageFinances?: boolean;
}

// Default permissions by role
export const DEFAULT_PERMISSIONS: Record<string, OrganizationPermissions> = {
  owner: {
    canManageOrganizationSettings: true,
    canManageUsers: true,
    canCreateOpportunities: true,
    canManageApplications: true,
    canViewReports: true,
    canManageFinances: true
  },
  admin: {
    canManageOrganizationSettings: true,
    canManageUsers: true,
    canCreateOpportunities: true,
    canManageApplications: true,
    canViewReports: true,
    canManageFinances: false
  },
  member: {
    canManageOrganizationSettings: false,
    canManageUsers: false,
    canCreateOpportunities: true,
    canManageApplications: true,
    canViewReports: true,
    canManageFinances: false
  },
  viewer: {
    canManageOrganizationSettings: false,
    canManageUsers: false,
    canCreateOpportunities: false,
    canManageApplications: false,
    canViewReports: true,
    canManageFinances: false
  }
};