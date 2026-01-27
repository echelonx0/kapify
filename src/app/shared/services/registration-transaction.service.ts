// src/app/shared/services/registration-transaction.service.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

import { SharedSupabaseService } from './shared-supabase.service';
import { OrganizationSetupService } from './organization-setup.service';
import { User } from '@supabase/supabase-js';
import { RegisterRequest } from 'src/app/auth/models/auth.models';
import { WelcomeEmailService } from 'src/app/auth/services/welcome-email.service';

export interface RegistrationTransactionState {
  phase:
    | 'auth'
    | 'user_profile'
    | 'user_metadata'
    | 'organization'
    | 'complete';
  authUser?: User;
  userProfileId?: string;
  organizationId?: string;
  error?: string;
  completedSteps: string[];
  rollbackActions: RollbackAction[];
}

export interface RollbackAction {
  action:
    | 'delete_auth_user'
    | 'delete_user_profile'
    | 'delete_user_metadata'
    | 'delete_organization'
    | 'delete_org_relationship';
  id: string;
  additionalData?: any;
}

export interface RegistrationTransactionResult {
  success: boolean;
  user?: any;
  organizationId?: string;
  error?: string;
  state?: RegistrationTransactionState;
}

@Injectable({
  providedIn: 'root',
})
export class RegistrationTransactionService {
  private supabaseService = inject(SharedSupabaseService);
  private organizationSetupService = inject(OrganizationSetupService);
  private welcomeEmailService = inject(WelcomeEmailService); // ← ADD THIS

  constructor() {
    // console.log('RegistrationTransactionService initialized');
  }

  // ===============================
  // MAIN TRANSACTION ORCHESTRATOR
  // ===============================

  executeRegistrationTransaction(
    credentials: RegisterRequest,
  ): Observable<RegistrationTransactionResult> {
    console.log('Starting registration transaction for:', credentials.email);

    const transactionState: RegistrationTransactionState = {
      phase: 'auth',
      completedSteps: [],
      rollbackActions: [],
    };

    return from(
      this.performRegistrationTransaction(credentials, transactionState),
    ).pipe(
      tap((result) => {
        if (result.success) {
          console.log('✅ Registration transaction completed successfully');

          // ✅ FIRE AND FORGET: Send welcome email (non-blocking)
          // This does NOT wait, does NOT check response, does NOT block
          this.sendWelcomeEmailAsync(credentials);
        } else {
          console.error('❌ Registration transaction failed:', result.error);
        }
      }),
      catchError((error) => {
        console.error('Registration transaction error:', error);
        return from(this.handleTransactionFailure(error, transactionState));
      }),
    );
  }

  /**
   * Send welcome email in background (non-blocking, fire-and-forget)
   *
   * ✅ KEY POINTS:
   * - Does NOT await
   * - Does NOT check response
   * - Does NOT throw errors
   * - Does NOT block registration
   * - Starts in background and moves on immediately
   */
  private sendWelcomeEmailAsync(credentials: RegisterRequest): void {
    // Fire in background - don't wait
    this.welcomeEmailService
      .sendWelcomeEmail({
        email: credentials.email,
        firstName: credentials.firstName,
        lastName: credentials.lastName || '',
        userType: credentials.userType,
      })
      .then(() => {
        console.log(
          '✅ Welcome email sent successfully to:',
          credentials.email,
        );
      })
      .catch((error) => {
        // Log error but DON'T throw - email is non-critical
        console.warn(
          '⚠️ Welcome email failed (non-blocking, registration completed):',
          error,
        );
      });
  }

  private async performRegistrationTransaction(
    credentials: RegisterRequest,
    state: RegistrationTransactionState,
  ): Promise<RegistrationTransactionResult> {
    try {
      // PHASE 1: Create Supabase Auth User
      console.log('Transaction Phase 1: Creating auth user');
      state.phase = 'auth';
      const authResult = await this.createAuthUser(credentials);
      state.authUser = authResult.user;
      state.completedSteps.push('auth_user_created');
      state.rollbackActions.push({
        action: 'delete_auth_user',
        id: authResult.user.id,
      });

      // PHASE 2: Create User Profile Record
      console.log('Transaction Phase 2: Creating user profile');
      state.phase = 'user_profile';
      await this.createUserProfile(authResult.user, credentials);
      state.userProfileId = authResult.user.id;
      state.completedSteps.push('user_profile_created');
      state.rollbackActions.push({
        action: 'delete_user_profile',
        id: authResult.user.id,
      });

      // PHASE 3: Create User Metadata
      console.log('Transaction Phase 3: Creating user metadata');
      state.phase = 'user_metadata';
      await this.createUserMetadata(authResult.user, credentials);
      state.completedSteps.push('user_metadata_created');
      state.rollbackActions.push({
        action: 'delete_user_metadata',
        id: authResult.user.id,
      });

      // PHASE 4: Create Organization
      console.log('Transaction Phase 4: Creating organization');
      state.phase = 'organization';
      const orgResult = await this.createOrganization(
        authResult.user,
        credentials,
      );
      state.organizationId = orgResult.organization.id;
      state.completedSteps.push('organization_created');
      state.rollbackActions.push({
        action: 'delete_organization',
        id: orgResult.organization.id,
      });

      // PHASE 5: Complete
      console.log('Transaction Phase 5: Transaction complete');
      state.phase = 'complete';

      return {
        success: true,
        user: await this.buildFinalUserProfile(
          authResult.user,
          state.organizationId!,
        ),
        organizationId: state.organizationId,
        state,
      };
    } catch (error: any) {
      console.error(
        `Registration transaction failed at phase ${state.phase}:`,
        error,
      );
      state.error = error.message;
      throw error;
    }
  }

  private async createAuthUser(
    credentials: RegisterRequest,
  ): Promise<{ user: User }> {
    try {
      const { data: authData, error: authError } = await Promise.race([
        this.supabaseService.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: {
              first_name: credentials.firstName,
              last_name: credentials.lastName,
              phone: credentials.phone,
              user_type: credentials.userType,
              company_name: credentials.companyName,
            },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Auth user creation timeout')),
            15000,
          ),
        ),
      ]);

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error(
          'User creation failed - no user returned from Supabase',
        );
      }

      console.log('Auth user created successfully:', authData.user.id);
      return { user: authData.user };
    } catch (error: any) {
      if (error.message?.includes('timeout')) {
        throw new Error(
          'User creation timed out. Please check your connection and try again.',
        );
      }
      throw error;
    }
  }

  private createUserFriendlyError(error: any, phase: string): string {
    const originalMessage = error.message || '';

    if (originalMessage.includes('timeout')) {
      return 'Registration timed out. Please check your connection and try again.';
    }

    if (originalMessage.includes('User already registered')) {
      return 'An account with this email address already exists. Please try logging in instead.';
    }

    if (originalMessage.includes('Email rate limit exceeded')) {
      return 'Too many registration attempts. Please wait a few minutes before trying again.';
    }

    if (originalMessage.includes('Invalid email')) {
      return 'Please enter a valid email address.';
    }

    if (originalMessage.includes('Password should be at least')) {
      return originalMessage;
    }

    if (originalMessage.includes('Email already confirmed')) {
      return 'This email is already registered. Please try logging in instead.';
    }

    if (originalMessage.includes('Signup is disabled')) {
      return 'Registration is temporarily disabled. Please try again later.';
    }

    if (
      originalMessage.length < 100 &&
      !originalMessage.includes('Error:') &&
      !originalMessage.includes('Exception') &&
      !originalMessage.includes('postgresql') &&
      !originalMessage.includes('HTTP')
    ) {
      return originalMessage;
    }

    // Fallback to phase-specific messages
    switch (phase) {
      case 'auth':
        return 'Failed to create user account. Please check your email and password.';
      case 'user_profile':
        return 'Failed to create user profile. Please try again.';
      case 'organization':
        return 'Failed to create organization. Please try again.';
      default:
        return 'Registration failed. Please try again.';
    }
  }

  private async handleTransactionFailure(
    error: any,
    state: RegistrationTransactionState,
  ): Promise<RegistrationTransactionResult> {
    console.log(
      'Executing COMPLETE rollback for failed registration transaction',
    );
    console.log('Failed at phase:', state.phase);
    console.log('Completed steps:', state.completedSteps);
    console.log('Original error:', error);

    try {
      // Execute rollback in reverse order - COMPLETE wipe
      await this.executeRollback(state.rollbackActions);
      console.log('Rollback completed successfully');
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }

    return {
      success: false,
      error: this.shouldUseOriginalError(error)
        ? error.message
        : this.createUserFriendlyError(error, state.phase),
      state,
    };
  }

  private shouldUseOriginalError(error: any): boolean {
    const message = error.message || '';

    const userFriendlyErrors = [
      'User already registered',
      'Email rate limit exceeded',
      'Invalid email',
      'Password should be at least',
      'Email already confirmed',
      'Signup is disabled',
    ];

    return userFriendlyErrors.some((friendlyError) =>
      message.includes(friendlyError),
    );
  }

  private async createUserProfile(
    user: User,
    credentials: RegisterRequest,
  ): Promise<void> {
    try {
      const { error: profileError } = await this.supabaseService
        .from('users')
        .insert({
          id: user.id,
          email: credentials.email,
          first_name: credentials.firstName,
          last_name: credentials.lastName,
          phone: credentials.phone,
          user_type: credentials.userType,
          company_name: credentials.companyName,
          status: 'active',
          email_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        throw new Error(
          `Failed to create user profile: ${profileError.message}`,
        );
      }

      console.log('User profile created successfully');
    } catch (error) {
      console.error('User profile creation failed:', error);
      throw error;
    }
  }

  private async createUserMetadata(
    user: User,
    credentials: RegisterRequest,
  ): Promise<void> {
    try {
      const { error: metadataError } = await this.supabaseService
        .from('user_profiles')
        .insert({
          user_id: user.id,
          display_name: `${credentials.firstName} ${credentials.lastName}`,
          profile_step: 0,
          completion_percentage: 0,
          is_active: true,
          is_verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (metadataError) {
        console.warn(
          'User metadata creation failed (non-critical):',
          metadataError,
        );
      } else {
        console.log('User metadata created successfully');
      }
    } catch (error) {
      console.warn('User metadata creation error (non-critical):', error);
    }
  }

  private async createOrganization(
    user: User,
    credentials: RegisterRequest,
  ): Promise<{
    organization: any;
    organizationUserId: string;
  }> {
    try {
      console.log(
        'Creating organization for user:',
        user.id,
        'Type:',
        credentials.userType,
      );

      const orgSetupResult = await this.organizationSetupService
        .createOrganizationForUser({
          userId: user.id,
          userType: credentials.userType,
          firstName: credentials.firstName,
          lastName: credentials.lastName,
          email: credentials.email,
          phone: credentials.phone,
          companyName: credentials.companyName,
        })
        .toPromise();

      console.log('Organization setup result:', {
        success: orgSetupResult?.success,
        organizationId: orgSetupResult?.organization?.id,
        message: orgSetupResult?.message,
      });

      if (!orgSetupResult?.success) {
        const errorMsg = orgSetupResult?.message || 'Unknown error';
        console.error('Organization creation failed with message:', errorMsg);
        throw new Error(errorMsg);
      }

      if (!orgSetupResult.organization?.id) {
        throw new Error('Organization created but no ID returned');
      }

      console.log(
        'Organization created successfully:',
        orgSetupResult.organization.id,
      );
      return {
        organization: orgSetupResult.organization,
        organizationUserId: orgSetupResult.organizationUserId,
      };
    } catch (error: any) {
      console.error('Organization creation error:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      throw error;
    }
  }

  private async buildFinalUserProfile(
    user: User,
    organizationId: string,
  ): Promise<any> {
    try {
      const { data: userRecord, error: userError } = await this.supabaseService
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

      if (userError || !userRecord) {
        console.warn('Could not fetch complete user record, using fallback');
        return this.createFallbackUserProfile(user, organizationId);
      }

      return {
        id: user.id,
        email: userRecord.email,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        phone: userRecord.phone,
        userType: userRecord.user_type,
        profileStep: userRecord.user_profiles?.[0]?.profile_step || 0,
        completionPercentage:
          userRecord.user_profiles?.[0]?.completion_percentage || 0,
        avatarUrl: userRecord.user_profiles?.[0]?.avatar_url,
        isVerified: userRecord.user_profiles?.[0]?.is_verified || false,
        createdAt: userRecord.created_at,
        organizationId,
      };
    } catch (error) {
      console.error('Error building final user profile:', error);
      return this.createFallbackUserProfile(user, organizationId);
    }
  }

  private createFallbackUserProfile(user: User, organizationId: string): any {
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
      organizationId,
    };
  }

  private async executeRollback(
    rollbackActions: RollbackAction[],
  ): Promise<void> {
    // Execute rollback actions in reverse order
    for (const action of rollbackActions.reverse()) {
      try {
        await this.executeRollbackAction(action);
        console.log('Rollback action completed:', action.action, action.id);
      } catch (error) {
        console.error('Rollback action failed:', action.action, error);
        // Continue with other rollback actions even if one fails
      }
    }
  }

  private async executeRollbackAction(action: RollbackAction): Promise<void> {
    switch (action.action) {
      case 'delete_auth_user':
        // Note: Supabase doesn't allow deleting auth users from client
        // This would need to be handled by a server function in production
        console.warn(
          'Auth user rollback not implemented - requires server-side function',
        );
        break;

      case 'delete_user_profile':
        await this.supabaseService.from('users').delete().eq('id', action.id);
        break;

      case 'delete_user_metadata':
        await this.supabaseService
          .from('user_profiles')
          .delete()
          .eq('user_id', action.id);
        break;

      case 'delete_organization':
        await this.supabaseService
          .from('organizations')
          .delete()
          .eq('id', action.id);
        break;

      case 'delete_org_relationship':
        await this.supabaseService
          .from('organization_users')
          .delete()
          .eq('id', action.id);
        break;

      default:
        console.warn('Unknown rollback action:', action.action);
    }
  }

  async checkUserNeedsRecovery(userId: string): Promise<{
    needsRecovery: boolean;
    missingComponents: string[];
    canRecover: boolean;
  }> {
    try {
      const missingComponents: string[] = [];

      const { data: userProfile } = await this.supabaseService
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!userProfile) {
        missingComponents.push('user_profile');
      }

      const { data: orgUser } = await this.supabaseService
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!orgUser) {
        missingComponents.push('organization');
      }

      return {
        needsRecovery: missingComponents.length > 0,
        missingComponents,
        canRecover:
          missingComponents.length > 0 && missingComponents.length < 3,
      };
    } catch (error) {
      console.error('Error checking user recovery needs:', error);
      return {
        needsRecovery: true,
        missingComponents: ['unknown'],
        canRecover: false,
      };
    }
  }
}
