// src/app/shared/models/user.models.ts

export type UserType = 'sme' | 'funder' | 'admin' | 'consultant';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type AccountTier = 'basic' | 'premium' | 'enterprise';

// Base User
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  phone?: string;
  profilePicture?: string;
  
  // Account status
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  
  // Subscription & billing
  accountTier: AccountTier;
  subscriptionId?: string;
  billingEmail?: string;
  
  // Audit
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// SME Organization (can have multiple users)
export interface SMEOrganization {
  id: string;
  
  // Basic info
  companyName: string;
  registrationNumber: string;
  vatNumber?: string;
  industry: string;
  
  // Subscription & billing
  accountTier: AccountTier;
  subscriptionId?: string;
  billingDetails: BillingDetails;
  
  // Settings
  settings: SMESettings;
  
  // Status
  isActive: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// SME User (belongs to organization)
export interface SMEUser {
  id: string;
  userId: string; // links to User
  organizationId: string; // links to SMEOrganization
  
  // Role in organization
  role: SMERole;
  permissions: SMEPermissions;
  
  // Profile completion
  profileComplete: boolean;
  onboardingComplete: boolean;
  
  // Relationships
  isOwner: boolean;
  invitedBy?: string; // user id
  
  joinedAt: Date;
  updatedAt: Date;
}

export interface SMERole {
  id: string;
  name: 'owner' | 'admin' | 'manager' | 'viewer' | 'custom';
  displayName: string;
  description: string;
}

export interface SMEPermissions {
  // Profile management
  canEditProfile: boolean;
  canViewProfile: boolean;
  canDeleteProfile: boolean;
  
  // Applications
  canCreateApplications: boolean;
  canViewApplications: boolean;
  canEditApplications: boolean;
  canDeleteApplications: boolean;
  canSubmitApplications: boolean;
  
  // Documents
  canUploadDocuments: boolean;
  canViewDocuments: boolean;
  canDeleteDocuments: boolean;
  
  // Financial data
  canViewFinancials: boolean;
  canEditFinancials: boolean;
  
  // User management
  canInviteUsers: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  
  // Billing
  canViewBilling: boolean;
  canManageBilling: boolean;
  
  // Reports
  canViewReports: boolean;
  canExportReports: boolean;
}

export interface SMESettings {
  // Notifications
  emailNotifications: {
    applicationUpdates: boolean;
    fundingMatches: boolean;
    documentRequests: boolean;
    systemUpdates: boolean;
  };
  
  smsNotifications: {
    urgentUpdates: boolean;
    applicationDeadlines: boolean;
  };
  
  // Privacy
  profileVisibility: 'public' | 'verified_funders' | 'invited_only';
  allowDirectContact: boolean;
  
  // Data sharing
  shareDataWithPartners: boolean;
  allowAnalytics: boolean;
}

// Funder Organization (investment firm/bank)
export interface FunderOrganization {
  id: string;
  
  // Basic info
  organizationName: string;
  organizationType: 'bank' | 'vc' | 'private_equity' | 'angel_network' | 'government' | 'development_finance' | 'family_office';
  registrationNumber?: string;
  fscaLicense?: string;
  
  // Contact details
  headquartersAddress: Address;
  website?: string;
  linkedinProfile?: string;
  
  // Subscription & billing
  accountTier: AccountTier;
  subscriptionId?: string;
  billingDetails: BillingDetails;
  
  // Investment profile
  aum?: number; // Assets Under Management
  portfolioCompanies?: number;
  establishedYear?: number;
  
  // Settings
  settings: FunderSettings;
  
  // Verification
  isVerified: boolean;
  verificationLevel: 'basic' | 'enhanced' | 'institutional';
  verifiedAt?: Date;
  
  // Status
  isActive: boolean;
  acceptingApplications: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// Funder User (belongs to organization)
export interface FunderUser {
  id: string;
  userId: string; // links to User
  organizationId: string; // links to FunderOrganization
  
  // Role in organization
  role: FunderRole;
  permissions: FunderPermissions;
  
  // Professional details
  jobTitle: string;
  department?: string;
  bio?: string;
  linkedin?: string;
  
  // Investment focus
  investmentFocus?: string[];
  investmentRange?: {
    min: number;
    max: number;
  };
  
  // Relationships
  isOwner: boolean;
  invitedBy?: string; // user id
  
  joinedAt: Date;
  updatedAt: Date;
}

export interface FunderRole {
  id: string;
  name: 'owner' | 'partner' | 'principal' | 'associate' | 'analyst' | 'admin' | 'viewer' | 'custom';
  displayName: string;
  description: string;
  level: number; // hierarchy level
}

export interface FunderPermissions {
  // Fund management
  canCreateFunds: boolean;
  canEditFunds: boolean;
  canDeleteFunds: boolean;
  canActivateDeactivateFunds: boolean;
  
  // Deal flow
  canViewAllApplications: boolean;
  canViewAssignedApplications: boolean;
  canReviewApplications: boolean;
  canMakeInvestmentDecisions: boolean;
  canApproveFunding: boolean;
  
  // User management
  canInviteUsers: boolean;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canViewTeamActivity: boolean;
  
  // Analytics & reporting
  canViewPortfolioAnalytics: boolean;
  canViewFundPerformance: boolean;
  canExportReports: boolean;
  canViewSystemAnalytics: boolean;
  
  // Settings
  canManageOrganizationSettings: boolean;
  canManageBilling: boolean;
  canManageIntegrations: boolean;
  
  // Investment limits
  maxInvestmentAmount?: number;
  requiresApprovalAbove?: number;
}

export interface FunderSettings {
  // Deal flow preferences
  dealflowFilters: {
    autoMatchCriteria: InvestmentCriteria;
    notificationThreshold: number; // match score threshold
    maxApplicationsPerDay: number;
  };
  
  // Notifications
  emailNotifications: {
    newApplications: boolean;
    highQualityMatches: boolean;
    applicationUpdates: boolean;
    portfolioUpdates: boolean;
    systemAlerts: boolean;
  };
  
  smsNotifications: {
    urgentMatches: boolean;
    investmentDeadlines: boolean;
  };
  
  // Data & privacy
  profileVisibility: 'public' | 'verified_smes' | 'referrals_only';
  shareInvestmentCriteria: boolean;
  allowDirectContact: boolean;
  
  // Integration settings
  crmIntegration?: string;
  reportingIntegration?: string;
}

// Supporting interfaces
export interface BillingDetails {
  companyName: string;
  vatNumber?: string;
  address: Address;
  billingEmail: string;
  paymentMethod?: PaymentMethod;
  invoiceHistory: Invoice[];
}

export interface Address {
  street: string;
  suburb?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer' | 'debit_order';
  last4?: string;
  brand?: string;
  isDefault: boolean;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issuedAt: Date;
  paidAt?: Date;
  dueAt: Date;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvestmentCriteria {
  fundingTypes: string[];
  industries: string[];
  minAmount: number;
  maxAmount: number;
  riskTolerance: 'low' | 'medium' | 'high';
  geographicFocus: string[];
  businessStages: string[];
  minInvestorReadinessScore?: number;
  requiresCollateral?: boolean;
  maxDealSize?: number;
}

// User invitation system
export interface UserInvitation {
  id: string;
  organizationId: string;
  organizationType: 'sme' | 'funder';
  
  inviterUserId: string;
  inviteeEmail: string;
  inviteeRole: string;
  
  message?: string;
  permissions: SMEPermissions | FunderPermissions;
  
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expiresAt: Date;
  acceptedAt?: Date;
  
  createdAt: Date;
}

// User activity tracking
export interface UserActivity {
  id: string;
  userId: string;
  organizationId: string;
  
  action: string;
  entity: string; // 'application', 'fund', 'user', etc.
  entityId: string;
  
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  
  createdAt: Date;
}