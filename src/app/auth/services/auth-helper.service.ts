import { Injectable, inject } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { RegisterRequest, UserProfile } from '../models/auth.models';

/**
 * AuthHelperService
 * Consolidates validation, error mapping, and profile building logic
 * Keeps main AuthService lean and focused on state management
 */
@Injectable({
  providedIn: 'root',
})
export class AuthHelperService {
  private supabase = inject(SharedSupabaseService);

  /**
   * Validate registration input
   */
  validateRegistrationInput(credentials: RegisterRequest): string | null {
    if (!credentials.agreeToTerms) {
      return 'You must accept the terms and conditions to proceed';
    }

    if (credentials.password !== credentials.confirmPassword) {
      return 'Passwords do not match';
    }

    if (credentials.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (!credentials.email || !credentials.firstName || !credentials.lastName) {
      return 'Please fill in all required fields';
    }

    return null;
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    feedback: string[];
  } {
    const feedback: string[] = [];

    if (password.length < 8) {
      feedback.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      feedback.push('One uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      feedback.push('One lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      feedback.push('One number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      feedback.push('One special character (!@#$%^&*)');
    }

    return {
      isValid: feedback.length === 0,
      feedback,
    };
  }

  /**
   * Create user-friendly login error messages
   */
  createLoginErrorMessage(error: any): string {
    const message = error?.message || '';

    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link before logging in.';
    }
    if (
      message.includes('Too many requests') ||
      message.includes('rate limit')
    ) {
      return 'Too many login attempts. Please wait a few minutes before trying again.';
    }
    if (message.includes('User not found')) {
      return 'No account found with this email address.';
    }
    if (message.includes('Password')) {
      return 'Invalid password. Please check your password and try again.';
    }

    if (message && message.length < 100 && !message.includes('Error:')) {
      return message;
    }

    return 'Login failed. Please try again.';
  }

  /**
   * Create user-friendly password reset error messages
   */
  createPasswordResetErrorMessage(error: any): string {
    const message = error?.message || '';

    if (message.includes('not found') || message.includes('no user')) {
      return 'No account found with this email address.';
    }
    if (message.includes('rate limit') || message.includes('Too many')) {
      return 'Too many reset requests. Please try again in a few minutes.';
    }
    if (message.includes('invalid') || message.includes('expired')) {
      return 'This reset link has expired. Please request a new one.';
    }
    if (message.includes('password')) {
      return 'Password reset failed. Please try again.';
    }

    if (message && message.length < 100 && !message.includes('Error:')) {
      return message;
    }

    return 'Password reset failed. Please try again.';
  }

  /**
   * Build complete user profile from Supabase user
   */
  async buildUserProfile(user: User): Promise<UserProfile> {
    try {
      const { data: userData, error } = await this.supabase
        .from('users')
        .select(
          `
          *,
          user_profiles (
            profile_step,
            completion_percentage,
            avatar_url,
            is_verified
          )
        `,
        )
        .eq('id', user.id)
        .single();

      if (error || !userData) {
        console.warn('User data not found, creating from auth user');
        return this.createProfileFromAuthUser(user);
      }

      const organizationId = await this.getUserOrganizationId(user.id);

      return {
        id: user.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        phone: userData.phone,
        userType: userData.user_type,
        profileStep: userData.user_profiles?.[0]?.profile_step || 0,
        completionPercentage:
          userData.user_profiles?.[0]?.completion_percentage || 0,
        avatarUrl: userData.user_profiles?.[0]?.avatar_url,
        isVerified: userData.user_profiles?.[0]?.is_verified || false,
        createdAt: userData.created_at,
        organizationId,
      };
    } catch (error) {
      console.error('Error building user profile:', error);
      return this.createProfileFromAuthUser(user);
    }
  }

  /**
   * Create minimal profile from auth user (fallback)
   */
  createProfileFromAuthUser(user: User): UserProfile {
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
      createdAt: user.created_at,
      organizationId: undefined,
    };
  }

  /**
   * Get user's organization ID
   */
  async getUserOrganizationId(userId: string): Promise<string | undefined> {
    try {
      const { data, error } = await this.supabase
        .from('organization_users')
        .select('organization_id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn(
            '⚠️ No active organization_users record for user:',
            userId,
          );
          return undefined;
        }

        console.error('❌ Error fetching org ID:', {
          code: error.code,
          message: error.message,
        });
        return undefined;
      }

      if (!data || !data.organization_id) {
        console.warn('⚠️ Organization ID is null for user:', userId);
        return undefined;
      }

      return data.organization_id;
    } catch (error: any) {
      console.error(
        '❌ Unexpected error in getUserOrganizationId:',
        error?.message,
      );
      return undefined;
    }
  }
}
