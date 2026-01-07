// import { Injectable, inject } from '@angular/core';
// import { Observable, from, throwError, of } from 'rxjs';
// import { tap, catchError, map } from 'rxjs/operators';

// import { AuthService } from '../../../../../../auth/services/production.auth.service';
// import { SharedSupabaseService } from '../../../../../../shared/services/shared-supabase.service';
// import { UserProfile } from 'src/app/auth/models/auth.models';

// export interface InvitationDetails {
//   id: string;
//   email: string;
//   role: string;
//   organizationId: string;
//   invitedBy: string;
//   inviterName: string;
//   expiresAt: Date;
//   organizationName: string;
// }

// export interface InvitationRegistrationRequest {
//   firstName: string;
//   lastName: string;
//   email: string;
//   password: string;
//   confirmPassword: string;
//   invitationToken: string;
// }

// export interface InvitationRegistrationResult {
//   success: boolean;
//   user?: UserProfile;
//   organizationId?: string;
//   error?: string;
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class InvitationAuthService {
//   private supabase = inject(SharedSupabaseService);
//   private authService = inject(AuthService);

//   /**
//    * Validate invitation token and get invitation details
//    * Called when user clicks invite link
//    */
//   validateInvitationToken(token: string): Observable<{
//     valid: boolean;
//     details?: InvitationDetails;
//     error?: string;
//   }> {
//     return from(this.fetchInvitationDetails(token)).pipe(
//       map((details) => ({
//         valid: true,
//         details,
//       })),
//       catchError((error) => {
//         console.error('Invitation validation failed:', error);
//         return of({
//           valid: false,
//           error: error.message,
//         });
//       })
//     );
//   }

//   /**
//    * Register invited user and accept invitation
//    * Single operation: creates user + joins org + accepts invite
//    */
//   registerInvitedUser(
//     request: InvitationRegistrationRequest
//   ): Observable<InvitationRegistrationResult> {
//     console.log('📧 Starting invited user registration:', request.email);

//     // Validate input
//     const validationError = this.validateInvitationRegistrationInput(request);
//     if (validationError) {
//       return of({
//         success: false,
//         error: validationError,
//       });
//     }

//     return from(this.performInvitedUserRegistration(request)).pipe(
//       tap((result) => {
//         if (result.success) {
//           console.log('✅ Invited user registration completed');
//         }
//       }),
//       catchError((error) => {
//         console.error('❌ Invited user registration failed:', error);
//         return of({
//           success: false,
//           error: error.message || 'Registration failed. Please try again.',
//         });
//       })
//     );
//   }

//   /**
//    * Fetch invitation details by token
//    * Private - called by validateInvitationToken
//    * FIX: Handle FK relationships correctly and add detailed logging
//    */
//   private async fetchInvitationDetails(
//     token: string
//   ): Promise<InvitationDetails> {
//     console.log(
//       '🔍 Fetching invitation with token:',
//       token.slice(0, 16) + '...'
//     );

//     // Step 1: Get the raw invitation record
//     const { data: invitation, error } = await this.supabase
//       .from('organization_users')
//       .select('*')
//       .eq('invitation_token', token)
//       .eq('status', 'invited')
//       .single();

//     if (error) {
//       console.error('❌ Query error:', error);
//       throw new Error('Invitation not found or already used');
//     }

//     if (!invitation) {
//       console.error('❌ No invitation found for token');
//       throw new Error('Invitation not found or already used');
//     }

//     console.log('✅ Invitation record found:', {
//       id: invitation.id,
//       email: invitation.invitee_email,
//       status: invitation.status,
//       expiresAt: invitation.invitation_expires_at,
//     });

//     // Step 2: Check expiry
//     const now = new Date();
//     const expiresAt = new Date(invitation.invitation_expires_at);
//     if (now > expiresAt) {
//       console.error('❌ Invitation expired');
//       throw new Error('This invitation has expired. Please request a new one.');
//     }

//     // Step 3: Fetch organization name separately (avoid FK issues)
//     const { data: org, error: orgError } = await this.supabase
//       .from('organizations')
//       .select('name')
//       .eq('id', invitation.organization_id)
//       .single();

//     if (orgError) {
//       console.warn('⚠️ Could not fetch org name:', orgError);
//     }
//     const orgName = org?.name || 'Organization';

//     // Step 4: Fetch inviter name separately (avoid FK issues)
//     const { data: inviter, error: inviterError } = await this.supabase
//       .from('users')
//       .select('first_name, last_name')
//       .eq('id', invitation.invited_by)
//       .single();

//     if (inviterError) {
//       console.warn('⚠️ Could not fetch inviter name:', inviterError);
//     }
//     const inviterName = inviter
//       ? `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() ||
//         'Team Member'
//       : 'Team Member';

//     console.log('✅ Invitation details resolved:', {
//       organizationName: orgName,
//       inviterName,
//     });

//     return {
//       id: invitation.id,
//       email: invitation.invitee_email,
//       role: invitation.role,
//       organizationId: invitation.organization_id,
//       invitedBy: invitation.invited_by,
//       inviterName,
//       expiresAt,
//       organizationName: orgName,
//     };
//   }

//   /**
//    * Perform invited user registration
//    * Steps: 1. Register auth user 2. Create profile 3. Accept invitation
//    */
//   private async performInvitedUserRegistration(
//     request: InvitationRegistrationRequest
//   ): Promise<InvitationRegistrationResult> {
//     try {
//       // Fetch invitation details first to validate
//       const invitationDetails = await this.fetchInvitationDetails(
//         request.invitationToken
//       );

//       // Verify email matches invitation
//       if (
//         request.email.toLowerCase() !== invitationDetails.email.toLowerCase()
//       ) {
//         throw new Error(
//           'Email does not match invitation. Please use the email you were invited with.'
//         );
//       }

//       // Step 1: Create auth user
//       console.log('Step 1: Creating auth user');
//       const authUser = await this.createAuthUserForInvitation({
//         email: request.email,
//         password: request.password,
//         firstName: request.firstName,
//         lastName: request.lastName,
//       });

//       // Step 2: Create user profile
//       console.log('Step 2: Creating user profile');
//       await this.createUserProfileForInvitation(authUser.id, {
//         email: request.email,
//         firstName: request.firstName,
//         lastName: request.lastName,
//       });

//       // Step 3: Accept invitation
//       console.log('Step 3: Accepting invitation');
//       await this.acceptInvitationRecord(request.invitationToken, authUser.id);

//       // Step 4: Build and return user profile
//       const userProfile = await this.buildInvitedUserProfile(
//         authUser.id,
//         invitationDetails.organizationId
//       );

//       console.log('✅ Invited user registration complete');

//       return {
//         success: true,
//         user: userProfile,
//         organizationId: invitationDetails.organizationId,
//       };
//     } catch (error: any) {
//       console.error('Invited user registration error:', error);

//       // Attempt cleanup on failure
//       await this.cleanupFailedRegistration(error);

//       throw error;
//     }
//   }

//   /**
//    * Create auth user for invited registration
//    */
//   private async createAuthUserForInvitation(data: {
//     email: string;
//     password: string;
//     firstName: string;
//     lastName: string;
//   }): Promise<{ id: string; email: string }> {
//     try {
//       const { data: authData, error } = await this.supabase.auth.signUp({
//         email: data.email,
//         password: data.password,
//         options: {
//           data: {
//             first_name: data.firstName,
//             last_name: data.lastName,
//             user_type: 'sme', //TODO: MAKE DYNAMIC
//           },
//         },
//       });

//       if (error) {
//         throw new Error(error.message);
//       }

//       if (!authData.user) {
//         throw new Error('Failed to create user account');
//       }

//       console.log('✅ Auth user created:', authData.user.id);
//       return { id: authData.user.id, email: authData.user.email! };
//     } catch (error: any) {
//       console.error('Auth user creation failed:', error);
//       throw error;
//     }
//   }

//   /**
//    * Create user profile record in database
//    */
//   private async createUserProfileForInvitation(
//     userId: string,
//     data: { email: string; firstName: string; lastName: string }
//   ): Promise<void> {
//     try {
//       // Create users table record
//       const { error: userError } = await this.supabase.from('users').insert({
//         id: userId,
//         email: data.email,
//         first_name: data.firstName,
//         last_name: data.lastName,
//         user_type: 'sme', //TODO: MAKE DYNAMIC
//         status: 'active',
//         email_verified: true,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//       });

//       if (userError) {
//         throw new Error(`Failed to create user profile: ${userError.message}`);
//       }

//       // Create user_profiles metadata record
//       const { error: metadataError } = await this.supabase
//         .from('user_profiles')
//         .insert({
//           user_id: userId,
//           display_name: `${data.firstName} ${data.lastName}`,
//           profile_step: 0,
//           completion_percentage: 0,
//           is_active: true,
//           is_verified: true,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         });

//       if (metadataError) {
//         console.warn(
//           'User metadata creation warning (non-critical):',
//           metadataError
//         );
//       }

//       console.log('✅ User profile created:', userId);
//     } catch (error: any) {
//       console.error('User profile creation failed:', error);
//       throw error;
//     }
//   }

//   /**
//    * Accept invitation record - mark as active and join organization
//    */
//   private async acceptInvitationRecord(
//     token: string,
//     userId: string
//   ): Promise<void> {
//     try {
//       const { error } = await this.supabase
//         .from('organization_users')
//         .update({
//           user_id: userId,
//           status: 'active',
//           is_active: true,
//           joined_at: new Date().toISOString(),
//           invitation_accepted_at: new Date().toISOString(),
//           invitation_token: null,
//           invitee_email: null,
//           updated_at: new Date().toISOString(),
//         })
//         .eq('invitation_token', token)
//         .eq('status', 'invited');

//       if (error) {
//         throw new Error(`Failed to accept invitation: ${error.message}`);
//       }

//       console.log('✅ Invitation accepted for user:', userId);
//     } catch (error: any) {
//       console.error('Invitation acceptance failed:', error);
//       throw error;
//     }
//   }

//   /**
//    * Build complete user profile after invitation acceptance
//    */
//   private async buildInvitedUserProfile(
//     userId: string,
//     organizationId: string
//   ): Promise<UserProfile> {
//     try {
//       const { data: userData, error } = await this.supabase
//         .from('users')
//         .select(
//           `
//           *,
//           user_profiles (
//             profile_step,
//             completion_percentage,
//             avatar_url,
//             is_verified
//           )
//         `
//         )
//         .eq('id', userId)
//         .single();

//       if (error || !userData) {
//         throw new Error('Failed to fetch user profile');
//       }

//       return {
//         id: userId,
//         email: userData.email,
//         firstName: userData.first_name,
//         lastName: userData.last_name,
//         phone: userData.phone,
//         userType: userData.user_type,
//         profileStep: userData.user_profiles?.[0]?.profile_step || 0,
//         completionPercentage:
//           userData.user_profiles?.[0]?.completion_percentage || 0,
//         avatarUrl: userData.user_profiles?.[0]?.avatar_url,
//         isVerified: true,
//         createdAt: userData.created_at,
//         organizationId,
//       };
//     } catch (error: any) {
//       console.error('Error building user profile:', error);
//       throw error;
//     }
//   }

//   /**
//    * Validate invitation registration input
//    */
//   private validateInvitationRegistrationInput(
//     request: InvitationRegistrationRequest
//   ): string | null {
//     if (!request.firstName || request.firstName.trim().length < 2) {
//       return 'First name is required (minimum 2 characters)';
//     }

//     if (!request.lastName || request.lastName.trim().length < 2) {
//       return 'Last name is required (minimum 2 characters)';
//     }

//     if (!request.email) {
//       return 'Email is required';
//     }

//     if (!request.password || request.password.length < 8) {
//       return 'Password must be at least 8 characters long';
//     }

//     if (request.password !== request.confirmPassword) {
//       return 'Passwords do not match';
//     }

//     if (!request.invitationToken) {
//       return 'Invalid invitation token';
//     }

//     return null;
//   }

//   /**
//    * Cleanup failed registration (best effort)
//    * Attempts to rollback created records
//    */
//   private async cleanupFailedRegistration(error: any): Promise<void> {
//     console.log('Attempting cleanup for failed registration');
//   }
// }
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

import { AuthService } from '../../../../../../auth/services/production.auth.service';
import { SharedSupabaseService } from '../../../../../../shared/services/shared-supabase.service';
import { UserProfile } from 'src/app/auth/models/auth.models';

export interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  invitedBy: string;
  inviterName: string;
  expiresAt: Date;
  organizationName: string;
  organizationType: 'sme' | 'funder';
}

export interface InvitationRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  invitationToken: string;
}

export interface InvitationRegistrationResult {
  success: boolean;
  user?: UserProfile;
  organizationId?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class InvitationAuthService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  /**
   * Validate invitation token and get invitation details
   * Called when user clicks invite link
   */
  validateInvitationToken(token: string): Observable<{
    valid: boolean;
    details?: InvitationDetails;
    error?: string;
  }> {
    return from(this.fetchInvitationDetails(token)).pipe(
      map((details) => ({
        valid: true,
        details,
      })),
      catchError((error) => {
        console.error('Invitation validation failed:', error);
        return of({
          valid: false,
          error: error.message,
        });
      })
    );
  }

  /**
   * Register invited user and accept invitation
   * Single operation: creates user + joins org + accepts invite
   */
  registerInvitedUser(
    request: InvitationRegistrationRequest
  ): Observable<InvitationRegistrationResult> {
    console.log('📧 Starting invited user registration:', request.email);

    // Validate input
    const validationError = this.validateInvitationRegistrationInput(request);
    if (validationError) {
      return of({
        success: false,
        error: validationError,
      });
    }

    return from(this.performInvitedUserRegistration(request)).pipe(
      tap((result) => {
        if (result.success) {
          console.log('✅ Invited user registration completed');
        }
      }),
      catchError((error) => {
        console.error('❌ Invited user registration failed:', error);
        return of({
          success: false,
          error: error.message || 'Registration failed. Please try again.',
        });
      })
    );
  }

  /**
   * Fetch invitation details by token
   * Private - called by validateInvitationToken
   * Now includes organizationType from organizations table
   */
  private async fetchInvitationDetails(
    token: string
  ): Promise<InvitationDetails> {
    console.log(
      '🔍 Fetching invitation with token:',
      token.slice(0, 16) + '...'
    );

    // Step 1: Get the raw invitation record
    const { data: invitation, error } = await this.supabase
      .from('organization_users')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'invited')
      .single();

    if (error) {
      console.error('❌ Query error:', error);
      throw new Error('Invitation not found or already used');
    }

    if (!invitation) {
      console.error('❌ No invitation found for token');
      throw new Error('Invitation not found or already used');
    }

    console.log('✅ Invitation record found:', {
      id: invitation.id,
      email: invitation.invitee_email,
      status: invitation.status,
      expiresAt: invitation.invitation_expires_at,
    });

    // Step 2: Check expiry
    const now = new Date();
    const expiresAt = new Date(invitation.invitation_expires_at);
    if (now > expiresAt) {
      console.error('❌ Invitation expired');
      throw new Error('This invitation has expired. Please request a new one.');
    }

    // Step 3: Fetch organization name and type
    const { data: org, error: orgError } = await this.supabase
      .from('organizations')
      .select('name, organization_type')
      .eq('id', invitation.organization_id)
      .single();

    if (orgError) {
      console.warn('⚠️ Could not fetch org data:', orgError);
    }
    const orgName = org?.name || 'Organization';
    const orgType = (org?.organization_type as 'sme' | 'funder') || 'sme';

    // Step 4: Fetch inviter name separately (avoid FK issues)
    const { data: inviter, error: inviterError } = await this.supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', invitation.invited_by)
      .single();

    if (inviterError) {
      console.warn('⚠️ Could not fetch inviter name:', inviterError);
    }
    const inviterName = inviter
      ? `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() ||
        'Team Member'
      : 'Team Member';

    console.log('✅ Invitation details resolved:', {
      organizationName: orgName,
      organizationType: orgType,
      inviterName,
    });

    return {
      id: invitation.id,
      email: invitation.invitee_email,
      role: invitation.role,
      organizationId: invitation.organization_id,
      invitedBy: invitation.invited_by,
      inviterName,
      expiresAt,
      organizationName: orgName,
      organizationType: orgType,
    };
  }

  /**
   * Perform invited user registration
   * Steps: 1. Register auth user 2. Create profile 3. Accept invitation
   */
  private async performInvitedUserRegistration(
    request: InvitationRegistrationRequest
  ): Promise<InvitationRegistrationResult> {
    try {
      // Fetch invitation details first to validate and get organization type
      const invitationDetails = await this.fetchInvitationDetails(
        request.invitationToken
      );

      // Verify email matches invitation
      if (
        request.email.toLowerCase() !== invitationDetails.email.toLowerCase()
      ) {
        throw new Error(
          'Email does not match invitation. Please use the email you were invited with.'
        );
      }

      // Step 1: Create auth user with organization type
      console.log(
        'Step 1: Creating auth user with type:',
        invitationDetails.organizationType
      );
      const authUser = await this.createAuthUserForInvitation({
        email: request.email,
        password: request.password,
        firstName: request.firstName,
        lastName: request.lastName,
        userType: invitationDetails.organizationType,
      });

      // Step 2: Create user profile with organization type
      console.log(
        'Step 2: Creating user profile with type:',
        invitationDetails.organizationType
      );
      await this.createUserProfileForInvitation(authUser.id, {
        email: request.email,
        firstName: request.firstName,
        lastName: request.lastName,
        userType: invitationDetails.organizationType,
      });

      // Step 3: Accept invitation
      console.log('Step 3: Accepting invitation');
      await this.acceptInvitationRecord(request.invitationToken, authUser.id);

      // Step 4: Build and return user profile
      const userProfile = await this.buildInvitedUserProfile(
        authUser.id,
        invitationDetails.organizationId,
        invitationDetails.organizationType
      );

      console.log('✅ Invited user registration complete');

      return {
        success: true,
        user: userProfile,
        organizationId: invitationDetails.organizationId,
      };
    } catch (error: any) {
      console.error('Invited user registration error:', error);

      // Attempt cleanup on failure
      await this.cleanupFailedRegistration(error);

      throw error;
    }
  }

  /**
   * Create auth user for invited registration
   * Now accepts userType parameter instead of hard-coding 'sme'
   */
  private async createAuthUserForInvitation(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: 'sme' | 'funder';
  }): Promise<{ id: string; email: string }> {
    try {
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            user_type: data.userType,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!authData.user) {
        throw new Error('Failed to create user account');
      }

      console.log('✅ Auth user created:', authData.user.id);
      return { id: authData.user.id, email: authData.user.email! };
    } catch (error: any) {
      console.error('Auth user creation failed:', error);
      throw error;
    }
  }

  /**
   * Create user profile record in database
   * Now accepts userType parameter instead of hard-coding 'sme'
   */
  private async createUserProfileForInvitation(
    userId: string,
    data: {
      email: string;
      firstName: string;
      lastName: string;
      userType: 'sme' | 'funder';
    }
  ): Promise<void> {
    try {
      // Create users table record
      const { error: userError } = await this.supabase.from('users').insert({
        id: userId,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        user_type: data.userType,
        status: 'active',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (userError) {
        throw new Error(`Failed to create user profile: ${userError.message}`);
      }

      // Create user_profiles metadata record
      const { error: metadataError } = await this.supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          display_name: `${data.firstName} ${data.lastName}`,
          profile_step: 0,
          completion_percentage: 0,
          is_active: true,
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (metadataError) {
        console.warn(
          'User metadata creation warning (non-critical):',
          metadataError
        );
      }

      console.log('✅ User profile created:', userId);
    } catch (error: any) {
      console.error('User profile creation failed:', error);
      throw error;
    }
  }

  /**
   * Accept invitation record - mark as active and join organization
   */
  private async acceptInvitationRecord(
    token: string,
    userId: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('organization_users')
        .update({
          user_id: userId,
          status: 'active',
          is_active: true,
          joined_at: new Date().toISOString(),
          invitation_accepted_at: new Date().toISOString(),
          invitation_token: null,
          invitee_email: null,
          updated_at: new Date().toISOString(),
        })
        .eq('invitation_token', token)
        .eq('status', 'invited');

      if (error) {
        throw new Error(`Failed to accept invitation: ${error.message}`);
      }

      console.log('✅ Invitation accepted for user:', userId);
    } catch (error: any) {
      console.error('Invitation acceptance failed:', error);
      throw error;
    }
  }

  /**
   * Build complete user profile after invitation acceptance
   * Now accepts userType parameter
   */
  private async buildInvitedUserProfile(
    userId: string,
    organizationId: string,
    userType: 'sme' | 'funder'
  ): Promise<UserProfile> {
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
        `
        )
        .eq('id', userId)
        .single();

      if (error || !userData) {
        throw new Error('Failed to fetch user profile');
      }

      return {
        id: userId,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        phone: userData.phone,
        userType: userType,
        profileStep: userData.user_profiles?.[0]?.profile_step || 0,
        completionPercentage:
          userData.user_profiles?.[0]?.completion_percentage || 0,
        avatarUrl: userData.user_profiles?.[0]?.avatar_url,
        isVerified: true,
        createdAt: userData.created_at,
        organizationId,
      };
    } catch (error: any) {
      console.error('Error building user profile:', error);
      throw error;
    }
  }

  /**
   * Validate invitation registration input
   */
  private validateInvitationRegistrationInput(
    request: InvitationRegistrationRequest
  ): string | null {
    if (!request.firstName || request.firstName.trim().length < 2) {
      return 'First name is required (minimum 2 characters)';
    }

    if (!request.lastName || request.lastName.trim().length < 2) {
      return 'Last name is required (minimum 2 characters)';
    }

    if (!request.email) {
      return 'Email is required';
    }

    if (!request.password || request.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (request.password !== request.confirmPassword) {
      return 'Passwords do not match';
    }

    if (!request.invitationToken) {
      return 'Invalid invitation token';
    }

    return null;
  }

  /**
   * Cleanup failed registration (best effort)
   * Attempts to rollback created records
   */
  private async cleanupFailedRegistration(error: any): Promise<void> {
    console.log('Attempting cleanup for failed registration');
  }
}
