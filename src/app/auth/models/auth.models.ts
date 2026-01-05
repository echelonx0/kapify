/**
 * Auth Models
 * Single source of truth for all authentication-related interfaces
 */

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

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  password: string;
  confirmPassword: string;
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
  organizationId?: string;
}

export interface AuthOperationResult {
  success: boolean;
  user: UserProfile | null;
  error: string | null;
  organizationId?: string;
  organizationCreated?: boolean;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface LoadingState {
  registration: boolean;
  login: boolean;
  initialization: boolean;
  sessionUpdate: boolean;
  passwordReset: boolean;
}
