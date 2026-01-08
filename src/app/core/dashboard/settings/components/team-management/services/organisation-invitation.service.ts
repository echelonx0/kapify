import { Injectable, signal, inject, computed } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';

interface UserRecord {
  first_name: string;
  last_name: string;
  email: string;
  user_profiles?: Array<{
    avatar_url?: string;
  }>;
}

interface OrganizationUserRecord {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  users: UserRecord | UserRecord[];
}

export interface InvitationRequest {
  email: string;
  role: 'admin' | 'member' | 'viewer';
  firstName?: string;
  lastName?: string;
}

// FIX: Add invitation_token to expose it
export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  inviterName: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'invited' | 'expired' | 'cancelled';
  invitationToken: string; // ✅ ADD THIS
}

interface InvitationRecord {
  id: string;
  invitee_email: string;
  role: string;
  invited_by: string;
  invited_at: string;
  invitation_expires_at: string;
  invitation_token: string; // ✅ ADD THIS
  status: string;
  users?:
    | {
        first_name: string;
        last_name: string;
      }
    | Array<{
        first_name: string;
        last_name: string;
      }>;
}

export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: Date;
  avatarUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationInvitationService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);

  // State signals
  isInviting = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);

  private pendingInvitationsSubject = new BehaviorSubject<PendingInvitation[]>(
    []
  );
  private teamMembersSubject = new BehaviorSubject<TeamMember[]>([]);

  pendingInvitations$ = this.pendingInvitationsSubject.asObservable();
  teamMembers$ = this.teamMembersSubject.asObservable();

  pendingInvitations = signal<PendingInvitation[]>([]);
  teamMembers = signal<TeamMember[]>([]);

  // Computed
  canInvite = computed(() => {
    const user = this.authService.user();
    return this.isUserAdminOrOwner(user?.id);
  });

  constructor() {
    console.log('OrganizationInvitationService initialized');
  }

  /**
   * Check if user can invite team members
   */
  private async isUserAdminOrOwner(userId?: string): Promise<boolean> {
    if (!userId) return false;

    const orgId = this.authService.getCurrentUserOrganizationId();
    if (!orgId) return false;

    try {
      const { data, error } = await this.supabase
        .from('organization_users')
        .select('role')
        .eq('user_id', userId)
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .single();

      if (error || !data) return false;

      return ['owner', 'admin'].includes(data.role);
    } catch {
      return false;
    }
  }

  /**
   * Invite a new team member
   */
  inviteTeamMember(invitation: InvitationRequest): Observable<{
    success: boolean;
    invitationId?: string;
    error?: string;
  }> {
    console.log('📧 Inviting team member:', invitation.email);

    const user = this.authService.user();
    const orgId = this.authService.getCurrentUserOrganizationId();

    if (!user || !orgId) {
      return throwError(
        () => new Error('User not authenticated or no organization')
      );
    }

    this.isInviting.set(true);
    this.error.set(null);

    return from(this.performInvitation(invitation, user.id, orgId)).pipe(
      tap((result) => {
        if (result.success) {
          console.log('✅ Invitation sent successfully');
          // Reload invitations list
          this.loadPendingInvitations().subscribe();
        }
      }),
      catchError((error) => {
        console.error('❌ Invitation failed:', error);
        const errorMessage = error?.message || 'Failed to send invitation';
        this.error.set(errorMessage);
        return of({ success: false, error: errorMessage });
      }),
      tap(() => {
        this.isInviting.set(false);
      })
    );
  }

  /**
   * Perform the actual invitation
   * ✅ UPDATED: Denormalize org_name, org_type, inviter_name at invite time
   * EMAIL IS NON-BLOCKING: Returns success after record created,
   * sends email async with errors logged only to console.
   */
  private async performInvitation(
    invitation: InvitationRequest,
    userId: string,
    orgId: string
  ): Promise<{ success: boolean; invitationId?: string; error?: string }> {
    try {
      // 1. Check if user can invite
      const canInvite = await this.isUserAdminOrOwner(userId);
      if (!canInvite) {
        throw new Error('You do not have permission to invite team members');
      }

      // 2. Check if email already invited or active
      const { data: existingByEmail } = await this.supabase
        .from('organization_users')
        .select('id, status')
        .eq('organization_id', orgId)
        .eq('invitee_email', invitation.email)
        .maybeSingle();

      if (existingByEmail) {
        if (existingByEmail.status === 'invited') {
          throw new Error('An invitation has already been sent to this email');
        } else if (existingByEmail.status === 'active') {
          throw new Error('This user is already a member of your organization');
        }
      }

      // 3. ✅ NEW: Fetch org data once at invite time
      console.log('📋 Fetching org data for denormalization');
      const { data: org, error: orgError } = await this.supabase
        .from('organizations')
        .select('name, organization_type')
        .eq('id', orgId)
        .single();

      if (orgError || !org) {
        throw new Error('Organization not found');
      }

      // 4. ✅ NEW: Fetch inviter name once at invite time
      console.log('👤 Fetching inviter name for denormalization');
      const { data: inviter } = await this.supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      const inviterName = inviter
        ? `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() ||
          'Team Member'
        : 'Team Member';

      // 5. Generate secure invitation token
      const invitationToken = this.generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      // 6. ✅ UPDATED: Create invitation record with denormalized data
      const { data: invitationData, error: inviteError } = await this.supabase
        .from('organization_users')
        .insert({
          organization_id: orgId,
          invitee_email: invitation.email,
          role: invitation.role,
          status: 'invited',
          invited_by: userId,
          invited_at: new Date().toISOString(),
          invitation_token: invitationToken,
          invitation_expires_at: expiresAt.toISOString(),
          is_active: false,
          // ✅ NEW: Store org data directly in invitation record
          org_name: org.name,
          org_type: org.organization_type,
          inviter_name: inviterName,
        })
        .select('id')
        .single();

      if (inviteError || !invitationData) {
        console.error('Failed to create invitation:', inviteError);
        throw new Error('Failed to create invitation record');
      }

      // 7. SUCCESS: Return immediately (email is async/non-blocking)
      const result = {
        success: true,
        invitationId: invitationData.id,
      };

      console.log('✅ Invitation record created with denormalized data:', {
        invitationId: invitationData.id,
        orgName: org.name,
        orgType: org.organization_type,
        inviterName,
      });

      // 8. Send email async in background (errors don't break flow)
      this.sendInvitationEmailAsync(
        invitationData.id,
        invitation.email,
        orgId,
        userId,
        invitation.role,
        invitationToken,
        org.name,
        inviterName
      );

      return result;
    } catch (error: any) {
      console.error('Invitation error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to send invitation',
      };
    }
  }

  /**
   * ✅ UPDATED: Accept inviter params (no need to fetch)
   */
  private async sendInvitationEmailAsync(
    invitationId: string,
    email: string,
    orgId: string,
    userId: string,
    role: string,
    invitationToken: string,
    orgName: string,
    inviterName: string
  ): Promise<void> {
    try {
      const result = await this.sendInvitationEmail({
        invitationId,
        email,
        organizationName: orgName,
        inviterName,
        role,
        invitationToken,
      });

      if (!result.success) {
        console.warn(
          `📧 Email delivery failed for invitation ${invitationId}:`,
          result.error
        );
      }
    } catch (error: any) {
      console.warn(
        `📧 Email error for invitation ${invitationId}:`,
        error?.message
      );
    }
  }

  /**
   * Send invitation email via Supabase Edge Function
   */
  private async sendInvitationEmail(params: {
    invitationId: string;
    email: string;
    organizationName: string;
    inviterName: string;
    role: string;
    invitationToken: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.functions.invoke(
        'send-invitation-email',
        {
          body: params,
        }
      );

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Failed to invoke edge function:', error);
      return { success: false, error: error?.message };
    }
  }

  /**
   * Load pending invitations for current organization
   */
  loadPendingInvitations(): Observable<PendingInvitation[]> {
    const orgId = this.authService.getCurrentUserOrganizationId();
    if (!orgId) {
      return of([]);
    }

    this.isLoading.set(true);

    return from(this.fetchPendingInvitations(orgId)).pipe(
      tap((invitations) => {
        this.pendingInvitations.set(invitations);
        this.pendingInvitationsSubject.next(invitations);
      }),
      catchError((error) => {
        console.error('Failed to load invitations:', error);
        this.error.set('Failed to load pending invitations');
        return of([]);
      }),
      tap(() => {
        this.isLoading.set(false);
      })
    );
  }

  /**
   * Fetch pending invitations from database
   */
  private async fetchPendingInvitations(
    orgId: string
  ): Promise<PendingInvitation[]> {
    const { data, error } = await this.supabase
      .from('organization_users')
      .select(
        `
      id,
      invitee_email,
      role,
      invited_by,
      invited_at,
      invitation_expires_at,
      invitation_token,
      status,
      users!organization_users_invited_by_fkey (
        first_name,
        last_name
      )
    `
      )
      .eq('organization_id', orgId)
      .eq('status', 'invited')
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    return (data as unknown as InvitationRecord[]).map((inv) => {
      const inviterRecord = Array.isArray(inv.users) ? inv.users[0] : inv.users;

      return {
        id: inv.id,
        email: inv.invitee_email,
        role: inv.role,
        invitedBy: inv.invited_by,
        inviterName: inviterRecord
          ? `${inviterRecord.first_name || ''} ${
              inviterRecord.last_name || ''
            }`.trim() || 'Unknown'
          : 'Unknown',
        invitedAt: new Date(inv.invited_at),
        expiresAt: new Date(inv.invitation_expires_at),
        status: this.getInvitationStatus(inv.invitation_expires_at),
        invitationToken: inv.invitation_token, // ✅ INCLUDE THIS
      };
    });
  }

  /**
   * Load team members for current organization
   */
  loadTeamMembers(): Observable<TeamMember[]> {
    const orgId = this.authService.getCurrentUserOrganizationId();
    if (!orgId) {
      return of([]);
    }

    this.isLoading.set(true);

    return from(this.fetchTeamMembers(orgId)).pipe(
      tap((members) => {
        this.teamMembers.set(members);
        this.teamMembersSubject.next(members);
      }),
      catchError((error) => {
        console.error('Failed to load team members:', error);
        this.error.set('Failed to load team members');
        return of([]);
      }),
      tap(() => {
        this.isLoading.set(false);
      })
    );
  }

  /**
   * Fetch team members from database
   */
  private async fetchTeamMembers(orgId: string): Promise<TeamMember[]> {
    const { data, error } = await this.supabase
      .from('organization_users')
      .select(
        `
      id,
      user_id,
      role,
      status,
      joined_at,
      users!fk_organization_users_user (
        first_name,
        last_name,
        email,
        user_profiles (
          avatar_url
        )
      )
    `
      )
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching team members:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    return (data as unknown as OrganizationUserRecord[]).map((member) => {
      const userRecord = Array.isArray(member.users)
        ? member.users[0]
        : member.users;
      const userProfile = userRecord?.user_profiles?.[0];

      return {
        id: member.id,
        userId: member.user_id,
        name:
          `${userRecord?.first_name || ''} ${
            userRecord?.last_name || ''
          }`.trim() || 'Unknown',
        email: userRecord?.email || '',
        role: member.role,
        status: member.status,
        joinedAt: new Date(member.joined_at),
        avatarUrl: userProfile?.avatar_url,
      };
    });
  }

  /**
   * Resend invitation email
   */
  resendInvitation(invitationId: string): Observable<boolean> {
    this.isInviting.set(true);

    return from(this.performResendInvitation(invitationId)).pipe(
      tap((success) => {
        if (success) {
          console.log('✅ Invitation resent');
        }
      }),
      catchError((error) => {
        console.error('❌ Resend failed:', error);
        this.error.set('Failed to resend invitation');
        return of(false);
      }),
      tap(() => {
        this.isInviting.set(false);
      })
    );
  }

  /**
   * Perform resend invitation
   */
  private async performResendInvitation(
    invitationId: string
  ): Promise<boolean> {
    const { data: invitation, error } = await this.supabase
      .from('organization_users')
      .select(
        `
        id,
        invitee_email,
        role,
        organization_id,
        invitation_token,
        invited_by
      `
      )
      .eq('id', invitationId)
      .single();

    if (error || !invitation) {
      throw new Error('Invitation not found');
    }

    const [orgName, inviterName] = await Promise.all([
      this.getOrganizationName(invitation.organization_id),
      this.getUserName(invitation.invited_by),
    ]);

    const result = await this.sendInvitationEmail({
      invitationId: invitation.id,
      email: invitation.invitee_email,
      organizationName: orgName,
      inviterName: inviterName,
      role: invitation.role,
      invitationToken: invitation.invitation_token,
    });

    return result.success;
  }

  /**
   * Cancel invitation
   */
  cancelInvitation(invitationId: string): Observable<boolean> {
    return from(
      this.supabase.from('organization_users').delete().eq('id', invitationId)
    ).pipe(
      map(({ error }) => !error),
      tap((success) => {
        if (success) {
          console.log('✅ Invitation cancelled');
          this.loadPendingInvitations().subscribe();
        }
      }),
      catchError((error) => {
        console.error('❌ Cancel failed:', error);
        this.error.set('Failed to cancel invitation');
        return of(false);
      })
    );
  }

  /**
   * Check if user has pending invitation
   */
  async checkForPendingInvitation(email: string): Promise<{
    hasInvitation: boolean;
    token?: string;
    organizationId?: string;
    role?: string;
  }> {
    const { data, error } = await this.supabase
      .from('organization_users')
      .select('invitation_token, organization_id, role, invitation_expires_at')
      .eq('invitee_email', email)
      .eq('status', 'invited')
      .maybeSingle();

    if (error || !data) {
      return { hasInvitation: false };
    }

    const now = new Date();
    const expiresAt = new Date(data.invitation_expires_at);
    if (now > expiresAt) {
      return { hasInvitation: false };
    }

    return {
      hasInvitation: true,
      token: data.invitation_token,
      organizationId: data.organization_id,
      role: data.role,
    };
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  private generateSecureToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  }

  private async getOrganizationName(orgId: string): Promise<string> {
    const { data } = await this.supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    return data?.name || 'Organization';
  }

  private async getUserName(userId: string): Promise<string> {
    const { data } = await this.supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    if (!data) return 'Team Member';
    return (
      `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Team Member'
    );
  }

  private getInvitationStatus(expiresAt: string): 'invited' | 'expired' {
    const now = new Date();
    const expiry = new Date(expiresAt);
    return now > expiry ? 'expired' : 'invited';
  }

  getRoleDisplayName(role: string): string {
    const names: Record<string, string> = {
      owner: 'Owner',
      admin: 'Administrator',
      member: 'Member',
      viewer: 'Viewer',
    };
    return names[role] || role;
  }

  getRoleDescription(role: string): string {
    const descriptions: Record<string, string> = {
      owner:
        'Full access to all features including billing and team management',
      admin: 'Manage team members, applications, and organization settings',
      member: 'Create and manage applications and documents',
      viewer: 'View-only access to applications and data',
    };
    return descriptions[role] || '';
  }
}
