import { Injectable } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { UserProfile } from 'firebase/auth';
import { RegisterRequest } from 'src/app/auth/production.auth.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthHelperService {
  constructor(private supabaseService: SharedSupabaseService) {}

  // =========================
  // VALIDATION
  // =========================
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

  // =========================
  // ERROR HANDLING
  // =========================
  createLoginErrorMessage(error: any): string {
    const message = error?.message || '';

    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Please confirm your email before logging in.';
    }
    if (message.includes('Too many requests')) {
      return 'Too many login attempts. Please wait and try again.';
    }
    return 'Login failed. Please try again.';
  }

  isTransientError(error: any): boolean {
    const msg = error?.message?.toLowerCase() || '';
    return msg.includes('timeout') || msg.includes('lock');
  }

  // =========================
  // PROFILE BUILDING
  // =========================
  async buildUserProfile(user: User): Promise<UserProfile> {
    try {
      const { data, error } = await this.supabaseService
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
        `
        )
        .eq('id', user.id)
        .single();

      if (error || !data) {
        return this.createProfileFromAuthUser(user);
      }

      const organizationId = await this.getUserOrganizationId(user.id);

      return {
        id: user.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        phone: data.phone,
        userType: data.user_type,
        profileStep: data.user_profiles?.[0]?.profile_step ?? 0,
        completionPercentage:
          data.user_profiles?.[0]?.completion_percentage ?? 0,
        avatarUrl: data.user_profiles?.[0]?.avatar_url,
        isVerified: data.user_profiles?.[0]?.is_verified ?? false,
        createdAt: data.created_at,
        organizationId,
      };
    } catch {
      return this.createProfileFromAuthUser(user);
    }
  }

  createProfileFromAuthUser(user: User): UserProfile {
    const meta = user.user_metadata || {};
    return {
      id: user.id,
      email: user.email!,
      firstName: meta['first_name'] || 'User',
      lastName: meta['last_name'] || '',
      phone: meta['phone'],
      userType: meta['user_type'] || 'sme',
      profileStep: 0,
      completionPercentage: 0,
      isVerified: false,
      createdAt: user.created_at,
    };
  }

  // =========================
  // ORGANIZATION
  // =========================
  async getUserOrganizationId(userId: string): Promise<string | undefined> {
    const { data, error } = await this.supabaseService
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (error || !data) {
      return undefined;
    }
    return data.organization_id;
  }
}
