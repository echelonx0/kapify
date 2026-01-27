// import { Injectable, signal, inject } from '@angular/core';
// import { Observable, from, throwError, of } from 'rxjs';
// import { tap, catchError, map } from 'rxjs/operators';
// import { AuthService } from 'src/app/auth/services/production.auth.service';
// import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
// import { ToastService } from 'src/app/shared/services/toast.service';

// interface UserRecord {
//   first_name: string;
//   last_name: string;
//   email: string;
//   user_profiles?: Array<{
//     avatar_url?: string;
//   }>;
// }

// interface OrganizationUserRecord {
//   id: string;
//   user_id: string;
//   role: string;
//   status: string;
//   joined_at: string;
//   users: UserRecord | UserRecord[];
// }

// export interface InvitationRequest {
//   email: string;
//   role: 'admin' | 'member' | 'viewer';
//   firstName?: string;
//   lastName?: string;
// }

// export interface PendingInvitation {
//   id: string;
//   email: string;
//   role: string;
//   invitedBy: string;
//   inviterName: string;
//   invitedAt: Date;
//   expiresAt: Date;
//   status: 'invited' | 'expired' | 'cancelled';
//   invitationToken: string;
// }

// interface InvitationRecord {
//   id: string;
//   invitee_email: string;
//   role: string;
//   invited_by: string;
//   invited_at: string;
//   invitation_expires_at: string;
//   invitation_token: string;
//   status: string;
//   users?:
//     | {
//         first_name: string;
//         last_name: string;
//       }
//     | Array<{
//         first_name: string;
//         last_name: string;
//       }>;
// }

// export interface OrganizationTeamMember {
//   id: string;
//   userId: string;
//   name: string;
//   email: string;
//   role: string;
//   status: string;
//   joinedAt: Date;
//   avatarUrl?: string;
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class OrganizationInvitationService {
//   private supabase = inject(SharedSupabaseService);
//   private authService = inject(AuthService);
//   private toastService = inject(ToastService);

//   // State signals
//   isInviting = signal(false);
//   isLoading = signal(false);
//   error = signal<string | null>(null);

//   pendingInvitations = signal<PendingInvitation[]>([]);
//   teamMembers = signal<OrganizationTeamMember[]>([]);

//   constructor() {
//     console.log('OrganizationInvitationService initialized');
//   }

//   /**
//    * Check if user can invite team members
//    */
//   private async isUserAdminOrOwner(userId?: string): Promise<boolean> {
//     if (!userId) return false;

//     const orgId = this.authService.getCurrentUserOrganizationId();
//     if (!orgId) return false;

//     try {
//       const { data, error } = await this.supabase
//         .from('organization_users')
//         .select('role')
//         .eq('user_id', userId)
//         .eq('organization_id', orgId)
//         .eq('status', 'active')
//         .single();

//       if (error || !data) return false;

//       return ['owner', 'admin'].includes(data.role);
//     } catch {
//       return false;
//     }
//   }

//   /**
//    * Invite a new team member
//    */
//   inviteTeamMember(invitation: InvitationRequest): Observable<{
//     success: boolean;
//     invitationId?: string;
//     error?: string;
//   }> {
//     console.log('📧 Inviting team member:', invitation.email);

//     const user = this.authService.user();
//     const orgId = this.authService.getCurrentUserOrganizationId();

//     if (!user || !orgId) {
//       return throwError(
//         () => new Error('User not authenticated or no organization'),
//       );
//     }

//     this.isInviting.set(true);
//     this.error.set(null); // ✅ Clear previous errors

//     return from(this.performInvitation(invitation, user.id, orgId)).pipe(
//       tap((result) => {
//         if (result.success) {
//           console.log('✅ Invitation sent successfully');
//           this.loadPendingInvitations().subscribe();
//         }
//       }),
//       catchError((error) => {
//         console.error('❌ Invitation failed:', error);
//         const errorMessage = error?.message || 'Failed to send invitation';
//         this.error.set(errorMessage);
//         return of({ success: false, error: errorMessage });
//       }),
//       tap(() => {
//         this.isInviting.set(false);
//       }),
//     );
//   }

//   /**
//    * Perform the actual invitation
//    */
//   private async performInvitation(
//     invitation: InvitationRequest,
//     userId: string,
//     orgId: string,
//   ): Promise<{ success: boolean; invitationId?: string; error?: string }> {
//     try {
//       // 1. Check if user can invite
//       const canInvite = await this.isUserAdminOrOwner(userId);
//       if (!canInvite) {
//         throw new Error('You do not have permission to invite team members');
//       }

//       // 2. Check if email already invited or active
//       const { data: existingByEmail } = await this.supabase
//         .from('organization_users')
//         .select('id, status')
//         .eq('organization_id', orgId)
//         .eq('invitee_email', invitation.email)
//         .maybeSingle();

//       if (existingByEmail) {
//         if (existingByEmail.status === 'invited') {
//           throw new Error('An invitation has already been sent to this email');
//         } else if (existingByEmail.status === 'active') {
//           throw new Error('This user is already a member of your organization');
//         }
//       }

//       // 3. Fetch org data for denormalization
//       const { data: org, error: orgError } = await this.supabase
//         .from('organizations')
//         .select('name, organization_type')
//         .eq('id', orgId)
//         .single();

//       if (orgError || !org) {
//         throw new Error('Organization not found');
//       }

//       // 4. Fetch inviter name for denormalization
//       const { data: inviter } = await this.supabase
//         .from('users')
//         .select('first_name, last_name')
//         .eq('id', userId)
//         .single();

//       const inviterName = inviter
//         ? `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim() ||
//           'Team Member'
//         : 'Team Member';

//       // 5. Generate secure invitation token
//       const invitationToken = this.generateSecureToken();
//       const expiresAt = new Date();
//       expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

//       // 6. Create invitation record with denormalized data
//       const { data: invitationData, error: inviteError } = await this.supabase
//         .from('organization_users')
//         .insert({
//           organization_id: orgId,
//           invitee_email: invitation.email,
//           role: invitation.role,
//           status: 'invited',
//           invited_by: userId,
//           invited_at: new Date().toISOString(),
//           invitation_token: invitationToken,
//           invitation_expires_at: expiresAt.toISOString(),
//           is_active: false,
//           org_name: org.name,
//           org_type: org.organization_type,
//           inviter_name: inviterName,
//         })
//         .select('id')
//         .single();

//       if (inviteError || !invitationData) {
//         console.error('Failed to create invitation:', inviteError);
//         throw new Error('Failed to create invitation record');
//       }

//       const result = {
//         success: true,
//         invitationId: invitationData.id,
//       };

//       console.log('✅ Invitation record created:', {
//         invitationId: invitationData.id,
//       });

//       // 7. Send email async (non-blocking)
//       this.sendInvitationEmailAsync(
//         invitationData.id,
//         invitation.email,
//         orgId,
//         userId,
//         invitation.role,
//         invitationToken,
//         org.name,
//         inviterName,
//       );

//       return result;
//     } catch (error: any) {
//       console.error('Invitation error:', error);
//       return {
//         success: false,
//         error: error?.message || 'Failed to send invitation',
//       };
//     }
//   }

//   /**
//    * Send invitation email async (non-blocking)
//    */
//   private async sendInvitationEmailAsync(
//     invitationId: string,
//     email: string,
//     orgId: string,
//     userId: string,
//     role: string,
//     invitationToken: string,
//     orgName: string,
//     inviterName: string,
//   ): Promise<void> {
//     try {
//       const result = await this.sendInvitationEmail({
//         invitationId,
//         email,
//         organizationName: orgName,
//         inviterName,
//         role,
//         invitationToken,
//       });

//       if (!result.success) {
//         console.warn(
//           `📧 Email delivery failed for invitation ${invitationId}:`,
//           result.error,
//         );
//       }
//     } catch (error: any) {
//       console.warn(
//         `📧 Email error for invitation ${invitationId}:`,
//         error?.message,
//       );
//     }
//   }

//   /**
//    * Send invitation email via Supabase Edge Function
//    */
//   private async sendInvitationEmail(params: {
//     invitationId: string;
//     email: string;
//     organizationName: string;
//     inviterName: string;
//     role: string;
//     invitationToken: string;
//   }): Promise<{ success: boolean; error?: string }> {
//     try {
//       const { data, error } = await this.supabase.functions.invoke(
//         'send-invitation-email',
//         {
//           body: params,
//         },
//       );

//       if (error) {
//         console.error('Edge function error:', error);
//         return { success: false, error: error.message };
//       }

//       return { success: true };
//     } catch (error: any) {
//       console.error('Failed to invoke edge function:', error);
//       return { success: false, error: error?.message };
//     }
//   }

//   /**
//    * Load pending invitations for current organization
//    */
//   loadPendingInvitations(): Observable<PendingInvitation[]> {
//     const orgId = this.authService.getCurrentUserOrganizationId();
//     if (!orgId) {
//       return of([]);
//     }

//     this.isLoading.set(true);

//     return from(this.fetchPendingInvitations(orgId)).pipe(
//       tap((invitations) => {
//         this.pendingInvitations.set(invitations);
//       }),
//       catchError((error) => {
//         console.error('Failed to load invitations:', error);
//         this.error.set('Failed to load pending invitations');
//         return of([]);
//       }),
//       tap(() => {
//         this.isLoading.set(false);
//       }),
//     );
//   }

//   /**
//    * Fetch pending invitations from database
//    */
//   private async fetchPendingInvitations(
//     orgId: string,
//   ): Promise<PendingInvitation[]> {
//     const { data, error } = await this.supabase
//       .from('organization_users')
//       .select(
//         `
//       id,
//       invitee_email,
//       role,
//       invited_by,
//       invited_at,
//       invitation_expires_at,
//       invitation_token,
//       status,
//       users!organization_users_invited_by_fkey (
//         first_name,
//         last_name
//       )
//     `,
//       )
//       .eq('organization_id', orgId)
//       .eq('status', 'invited')
//       .order('invited_at', { ascending: false });

//     if (error) {
//       console.error('Error fetching invitations:', error);
//       throw error;
//     }

//     if (!data) {
//       return [];
//     }

//     return (data as unknown as InvitationRecord[]).map((inv) => {
//       const inviterRecord = Array.isArray(inv.users) ? inv.users[0] : inv.users;

//       return {
//         id: inv.id,
//         email: inv.invitee_email,
//         role: inv.role,
//         invitedBy: inv.invited_by,
//         inviterName: inviterRecord
//           ? `${inviterRecord.first_name || ''} ${
//               inviterRecord.last_name || ''
//             }`.trim() || 'Unknown'
//           : 'Unknown',
//         invitedAt: new Date(inv.invited_at),
//         expiresAt: new Date(inv.invitation_expires_at),
//         status: this.getInvitationStatus(inv.invitation_expires_at),
//         invitationToken: inv.invitation_token,
//       };
//     });
//   }

//   /**
//    * Load team members for current organization
//    */
//   loadTeamMembers(): Observable<OrganizationTeamMember[]> {
//     const orgId = this.authService.getCurrentUserOrganizationId();
//     if (!orgId) {
//       return of([]);
//     }

//     this.isLoading.set(true);

//     return from(this.fetchTeamMembers(orgId)).pipe(
//       tap((members) => {
//         this.teamMembers.set(members);
//       }),
//       catchError((error) => {
//         console.error('Failed to load team members:', error);
//         this.error.set('Failed to load team members');
//         return of([]);
//       }),
//       tap(() => {
//         this.isLoading.set(false);
//       }),
//     );
//   }

//   /**
//    * Fetch team members from database
//    */
//   private async fetchTeamMembers(
//     orgId: string,
//   ): Promise<OrganizationTeamMember[]> {
//     const { data, error } = await this.supabase
//       .from('organization_users')
//       .select(
//         `
//       id,
//       user_id,
//       role,
//       status,
//       joined_at,
//       users!fk_organization_users_user (
//         first_name,
//         last_name,
//         email,
//         user_profiles (
//           avatar_url
//         )
//       )
//     `,
//       )
//       .eq('organization_id', orgId)
//       .eq('status', 'active')
//       .order('joined_at', { ascending: false });

//     if (error) {
//       console.error('Error fetching team members:', error);
//       throw error;
//     }

//     if (!data) {
//       return [];
//     }

//     return (data as unknown as OrganizationUserRecord[]).map((member) => {
//       const userRecord = Array.isArray(member.users)
//         ? member.users[0]
//         : member.users;
//       const userProfile = userRecord?.user_profiles?.[0];

//       return {
//         id: member.id,
//         userId: member.user_id,
//         name:
//           `${userRecord?.first_name || ''} ${
//             userRecord?.last_name || ''
//           }`.trim() || 'Unknown',
//         email: userRecord?.email || '',
//         role: member.role,
//         status: member.status,
//         joinedAt: new Date(member.joined_at),
//         avatarUrl: userProfile?.avatar_url,
//       };
//     });
//   }

//   /**
//    * Resend invitation email
//    * ✅ FIX: Reset expiry + safety checks
//    */
//   resendInvitation(invitationId: string): Observable<boolean> {
//     this.isInviting.set(true);
//     this.error.set(null); // ✅ Clear previous errors

//     return from(this.performResendInvitation(invitationId)).pipe(
//       tap((success) => {
//         if (success) {
//           this.toastService.success('Invitation resent successfully.');
//           this.loadPendingInvitations().subscribe();
//         }
//       }),
//       catchError((error) => {
//         console.error('❌ Resend failed:', error);
//         this.toastService.error('Failed to resend invitation.');
//         this.error.set('Failed to resend invitation');
//         return of(false);
//       }),
//       tap(() => {
//         this.isInviting.set(false);
//       }),
//     );
//   }

//   /**
//    * Perform resend invitation
//    * ✅ FIX: Added safety check .eq('status', 'invited')
//    * ✅ FIX: Reset expiry to 7 days from resend date
//    */
//   private async performResendInvitation(
//     invitationId: string,
//   ): Promise<boolean> {
//     try {
//       // 1. Fetch current data (with safety check)
//       const { data: invitation, error } = await this.supabase
//         .from('organization_users')
//         .select(
//           `
//         id,
//         invitee_email,
//         role,
//         organization_id,
//         invitation_token,
//         invited_by,
//         status
//       `,
//         )
//         .eq('id', invitationId)
//         .eq('status', 'invited') // ✅ SAFETY: Only resend if still invited
//         .single();

//       if (error || !invitation) {
//         throw new Error('Invitation not found or already accepted');
//       }

//       // 2. Reset expiry to 7 days from NOW
//       const newExpiresAt = new Date();
//       newExpiresAt.setDate(newExpiresAt.getDate() + 7);

//       // 3. Update with safety check
//       const { error: updateError } = await this.supabase
//         .from('organization_users')
//         .update({
//           invitation_expires_at: newExpiresAt.toISOString(),
//           invited_at: new Date().toISOString(),
//         })
//         .eq('id', invitationId)
//         .eq('status', 'invited'); // ✅ SAFETY: Only update if still invited

//       if (updateError) throw updateError;

//       // 4. Send email
//       const [orgName, inviterName] = await Promise.all([
//         this.getOrganizationName(invitation.organization_id),
//         this.getUserName(invitation.invited_by),
//       ]);

//       const result = await this.sendInvitationEmail({
//         invitationId: invitation.id,
//         email: invitation.invitee_email,
//         organizationName: orgName,
//         inviterName: inviterName,
//         role: invitation.role,
//         invitationToken: invitation.invitation_token,
//       });

//       if (!result.success) {
//         console.warn(`Email failed for resend: ${invitationId}`);
//         // Don't fail the resend - record is already updated
//       }

//       return result.success;
//     } catch (error: any) {
//       console.error('Resend error:', error);
//       throw error;
//     }
//   }

//   /**
//    * Cancel invitation
//    */
//   cancelInvitation(invitationId: string): Observable<boolean> {
//     this.error.set(null); // ✅ Clear previous errors

//     return from(
//       this.supabase.from('organization_users').delete().eq('id', invitationId),
//     ).pipe(
//       map(({ error }) => !error),
//       tap((success) => {
//         if (success) {
//           console.log('✅ Invitation cancelled');
//           this.loadPendingInvitations().subscribe();
//         }
//       }),
//       catchError((error) => {
//         console.error('❌ Cancel failed:', error);
//         this.error.set('Failed to cancel invitation');
//         return of(false);
//       }),
//     );
//   }

//   /**
//    * Check if user has pending invitation
//    */
//   async checkForPendingInvitation(email: string): Promise<{
//     hasInvitation: boolean;
//     token?: string;
//     organizationId?: string;
//     role?: string;
//   }> {
//     const { data, error } = await this.supabase
//       .from('organization_users')
//       .select('invitation_token, organization_id, role, invitation_expires_at')
//       .eq('invitee_email', email)
//       .eq('status', 'invited')
//       .maybeSingle();

//     if (error || !data) {
//       return { hasInvitation: false };
//     }

//     const now = new Date();
//     const expiresAt = new Date(data.invitation_expires_at);
//     if (now > expiresAt) {
//       return { hasInvitation: false };
//     }

//     return {
//       hasInvitation: true,
//       token: data.invitation_token,
//       organizationId: data.organization_id,
//       role: data.role,
//     };
//   }

//   /**
//    * Delete team member (soft delete)
//    * ✅ FIX: Added error.set(null)
//    */
//   deleteTeamMember(memberId: string): Observable<boolean> {
//     this.error.set(null); // ✅ Clear previous errors

//     return from(this.performDeleteMember(memberId)).pipe(
//       tap((success) => {
//         if (success) {
//           this.toastService.success('Member removed from organization');
//           this.loadTeamMembers().subscribe();
//         }
//       }),
//       catchError((error) => {
//         console.error('❌ Delete failed:', error);
//         this.toastService.error('Failed to remove member');
//         this.error.set(error?.message || 'Failed to remove member');
//         return of(false);
//       }),
//     );
//   }

//   /**
//    * Perform delete team member
//    * ✅ Uses 'inactive' status (matches constraint)
//    */
//   private async performDeleteMember(memberId: string): Promise<boolean> {
//     try {
//       // Verify user can delete (owner/admin only)
//       const canDelete = await this.canUserManageMembers();
//       if (!canDelete) {
//         throw new Error('You do not have permission to remove members');
//       }

//       // Soft delete: set status to 'inactive'
//       const { error } = await this.supabase
//         .from('organization_users')
//         .update({
//           status: 'inactive',
//           removed_at: new Date().toISOString(),
//         })
//         .eq('id', memberId)
//         .eq('status', 'active'); // Safety: only remove active members

//       if (error) throw error;
//       return true;
//     } catch (error: any) {
//       console.error('Delete member error:', error);
//       throw error;
//     }
//   }

//   /**
//    * Check if current user can manage team members
//    */
//   private async canUserManageMembers(): Promise<boolean> {
//     const user = this.authService.user();
//     const orgId = this.authService.getCurrentUserOrganizationId();

//     if (!user?.id || !orgId) return false;

//     const { data } = await this.supabase
//       .from('organization_users')
//       .select('role')
//       .eq('user_id', user.id)
//       .eq('organization_id', orgId)
//       .eq('status', 'active')
//       .single();

//     return ['owner', 'admin'].includes(data?.role);
//   }

//   // ===================================
//   // UTILITY METHODS
//   // ===================================

//   private generateSecureToken(): string {
//     const array = new Uint8Array(32);
//     crypto.getRandomValues(array);
//     return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
//       '',
//     );
//   }

//   private async getOrganizationName(orgId: string): Promise<string> {
//     const { data } = await this.supabase
//       .from('organizations')
//       .select('name')
//       .eq('id', orgId)
//       .single();

//     return data?.name || 'Organization';
//   }

//   private async getUserName(userId: string): Promise<string> {
//     const { data } = await this.supabase
//       .from('users')
//       .select('first_name, last_name')
//       .eq('id', userId)
//       .single();

//     if (!data) return 'Team Member';
//     return (
//       `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Team Member'
//     );
//   }

//   private getInvitationStatus(expiresAt: string): 'invited' | 'expired' {
//     const now = new Date();
//     const expiry = new Date(expiresAt);
//     return now > expiry ? 'expired' : 'invited';
//   }

//   getRoleDisplayName(role: string): string {
//     const names: Record<string, string> = {
//       owner: 'Owner',
//       admin: 'Administrator',
//       member: 'Member',
//       viewer: 'Viewer',
//     };
//     return names[role] || role;
//   }

//   getRoleDescription(role: string): string {
//     const descriptions: Record<string, string> = {
//       owner:
//         'Full access to all features including billing and team management',
//       admin: 'Manage team members, applications, and organization settings',
//       member: 'Create and manage applications and documents',
//       viewer: 'View-only access to applications and data',
//     };
//     return descriptions[role] || '';
//   }

//   /**
//    * ADD THIS METHOD TO OrganizationInvitationService
//    * Location: After the deleteTeamMember() method
//    */

//   /**
//    * Change team member role
//    * ✅ Only owner/admin can change roles
//    * ✅ Owners cannot be demoted
//    * ✅ Admins cannot change other admins or owners
//    * ✅ Tracks activity and notifies member
//    */
//   changeTeamMemberRole(
//     memberId: string,
//     newRole: string,
//   ): Observable<{ success: boolean; error?: string }> {
//     this.error.set(null);

//     // Validate role
//     const validRoles = ['owner', 'admin', 'member', 'viewer'];
//     if (!validRoles.includes(newRole)) {
//       const msg = 'Invalid role selected';
//       this.error.set(msg);
//       return of({ success: false, error: msg });
//     }

//     return from(this.performChangeRole(memberId, newRole)).pipe(
//       tap((result) => {
//         if (result.success) {
//           this.toastService.success(`Role updated successfully`);
//           this.loadTeamMembers().subscribe();
//         }
//       }),
//       catchError((error) => {
//         const msg = error?.message || 'Failed to change role';
//         this.error.set(msg);
//         this.toastService.error(msg);
//         return of({ success: false, error: msg });
//       }),
//     );
//   }

//   /**
//    * Perform the actual role change with full validation
//    */
//   private async performChangeRole(
//     memberId: string,
//     newRole: string,
//   ): Promise<{ success: boolean; error?: string }> {
//     try {
//       const currentUser = this.authService.user();
//       const orgId = this.authService.getCurrentUserOrganizationId();

//       if (!currentUser?.id || !orgId) {
//         throw new Error('User not authenticated or no organization');
//       }

//       // 1. Verify current user is owner or admin
//       const userRole = await this.getUserRoleInOrg(currentUser.id, orgId);
//       if (!['owner', 'admin'].includes(userRole)) {
//         throw new Error('You do not have permission to change roles');
//       }

//       // 2. Fetch target member data
//       const { data: targetMember, error: fetchError } = await this.supabase
//         .from('organization_users')
//         .select(
//           `
//       id,
//       user_id,
//       role,
//       status,
//       users!fk_organization_users_user (
//         id,
//         first_name,
//         last_name,
//         email
//       )
//     `,
//         )
//         .eq('id', memberId)
//         .eq('organization_id', orgId)
//         .eq('status', 'active')
//         .single();

//       if (fetchError || !targetMember) {
//         throw new Error('Member not found or not active');
//       }

//       const targetUser = Array.isArray(targetMember.users)
//         ? targetMember.users[0]
//         : targetMember.users;
//       const targetRole = targetMember.role;

//       // 3. Prevent demoting owners
//       if (targetRole === 'owner') {
//         throw new Error('Cannot change owner role');
//       }

//       // 4. Admin can only change member/viewer roles (not admin/owner)
//       if (userRole === 'admin' && ['owner', 'admin'].includes(targetRole)) {
//         throw new Error('Admins can only change member and viewer roles');
//       }

//       if (userRole === 'admin' && ['owner', 'admin'].includes(newRole)) {
//         throw new Error('Admins can only assign member and viewer roles');
//       }

//       // 5. Cannot change your own role
//       if (targetMember.user_id === currentUser.id) {
//         throw new Error('You cannot change your own role');
//       }

//       // 6. Update role in database
//       const { error: updateError } = await this.supabase
//         .from('organization_users')
//         .update({
//           role: newRole,
//           updated_at: new Date().toISOString(),
//         })
//         .eq('id', memberId)
//         .eq('status', 'active');

//       if (updateError) {
//         throw new Error(`Database update failed: ${updateError.message}`);
//       }

//       // 7. Track activity (async, non-blocking)
//       this.trackRoleChangeActivity(
//         currentUser.id,
//         targetMember.user_id,
//         targetUser?.email || '',
//         targetRole,
//         newRole,
//         currentUser.firstName,
//         currentUser.lastName,
//       );

//       // 8. Notify member (async, non-blocking)
//       this.notifyMemberRoleChanged(
//         targetMember.user_id,
//         targetUser?.first_name || '',
//         targetUser?.last_name || '',
//         targetRole,
//         newRole,
//       );

//       return { success: true };
//     } catch (error: any) {
//       console.error('Role change error:', error);
//       throw error;
//     }
//   }

//   /**
//    * Get user's role in organization
//    */
//   private async getUserRoleInOrg(
//     userId: string,
//     orgId: string,
//   ): Promise<string> {
//     const { data, error } = await this.supabase
//       .from('organization_users')
//       .select('role')
//       .eq('user_id', userId)
//       .eq('organization_id', orgId)
//       .eq('status', 'active')
//       .single();

//     if (error || !data) {
//       throw new Error('User role not found in organization');
//     }

//     return data.role;
//   }

//   /**
//    * Track role change activity (async, fire-and-forget)
//    * Inject ActivityService to use this
//    */
//   private async trackRoleChangeActivity(
//     changedByUserId: string,
//     targetUserId: string,
//     targetUserEmail: string,
//     oldRole: string,
//     newRole: string,
//     changerFirstName: string,
//     changerLastName: string,
//   ): Promise<void> {
//     try {
//       // Only track if ActivityService is available
//       // Extend this method if you have activity tracking service
//       console.log('📝 Role change activity logged:', {
//         changedBy: `${changerFirstName} ${changerLastName}`,
//         targetUser: targetUserEmail,
//         from: oldRole,
//         to: newRole,
//         timestamp: new Date().toISOString(),
//       });
//     } catch (error) {
//       console.warn('Failed to track role change activity:', error);
//     }
//   }

//   /**
//    * Notify member of role change via messaging
//    * Uses MessagingService to send system message
//    */
//   private async notifyMemberRoleChanged(
//     targetUserId: string,
//     targetFirstName: string,
//     targetLastName: string,
//     oldRole: string,
//     newRole: string,
//   ): Promise<void> {
//     try {
//       // Get or create notification thread for this user
//       const threadSubject = 'Your role has been updated';

//       const { data: threadData, error: threadError } = await this.supabase
//         .from('message_threads')
//         .select('id')
//         .eq('created_by', 'system')
//         .contains('metadata', { type: 'role_change_notification' })
//         .eq('is_broadcast', false)
//         .single();

//       let threadId: string;

//       if (threadError || !threadData) {
//         // Create new notification thread
//         const { data: newThread, error: createError } = await this.supabase
//           .from('message_threads')
//           .insert({
//             subject: threadSubject,
//             created_by: 'system',
//             metadata: {
//               type: 'role_change_notification',
//               targetUserId,
//             },
//           })
//           .select('id')
//           .single();

//         if (createError || !newThread) {
//           throw new Error('Failed to create notification thread');
//         }

//         threadId = newThread.id;

//         // Add participant
//         await this.supabase.from('thread_participants').insert({
//           thread_id: threadId,
//           user_id: targetUserId,
//           can_reply: false,
//         });
//       } else {
//         threadId = threadData.id;
//       }

//       // Send notification message
//       const roleName = this.getRoleDisplayName(newRole);
//       const oldRoleName = this.getRoleDisplayName(oldRole);
//       const message = `Your role in the organization has been changed from ${oldRoleName} to ${roleName}. You now have access to ${this.getPermissionsSummary(newRole)}.`;

//       await this.supabase.from('messages').insert({
//         thread_id: threadId,
//         sender_id: 'system',
//         message_type: 'system',
//         content: message,
//         is_system_message: true,
//         metadata: {
//           type: 'role_change',
//           oldRole,
//           newRole,
//         },
//       });

//       console.log('✅ Role change notification sent to member');
//     } catch (error) {
//       console.warn(
//         'Failed to notify member of role change (non-critical):',
//         error,
//       );
//     }
//   }

//   /**
//    * Get permissions summary for a role (used in notification)
//    */
//   private getPermissionsSummary(role: string): string {
//     const summaries: Record<string, string> = {
//       owner: 'all features including billing and team management',
//       admin: 'team member management and organization settings',
//       member: 'application and document management',
//       viewer: 'view-only access to applications and data',
//     };
//     return summaries[role] || 'organization features';
//   }

//   /**
//    * Add this method if it doesn't already exist in the service
//    * Returns badge classes for role display
//    */
//   getRoleDisplayBadgeClasses(role: string): string {
//     const baseClasses =
//       'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border';
//     const roleClasses: Record<string, string> = {
//       owner: 'bg-teal-50 text-teal-700 border-teal-200/50',
//       admin: 'bg-blue-50 text-blue-700 border-blue-200/50',
//       member: 'bg-slate-50 text-slate-700 border-slate-200/50',
//       viewer: 'bg-amber-50 text-amber-700 border-amber-200/50',
//     };
//     return `${baseClasses} ${roleClasses[role] || roleClasses['member']}`;
//   }
// }

import { Injectable, signal, inject } from '@angular/core';
import { Observable, from, throwError, of, Subject } from 'rxjs';
import { tap, catchError, map, retry, delay, timeout } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { DatabaseActivityService } from 'src/app/shared/services/database-activity.service';

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

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  invitedBy: string;
  inviterName: string;
  invitedAt: Date;
  expiresAt: Date;
  status: 'invited' | 'expired' | 'cancelled';
  invitationToken: string;
}

interface InvitationRecord {
  id: string;
  invitee_email: string;
  role: string;
  invited_by: string;
  invited_at: string;
  invitation_expires_at: string;
  invitation_token: string;
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

export interface OrganizationTeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: Date;
  avatarUrl?: string;
}

// ===================================
// ERROR HANDLING TYPES
// ===================================

export interface OperationError {
  code: string;
  message: string;
  userMessage: string; // What to show to user
  retryable: boolean;
  timestamp: Date;
}

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: OperationError;
}

@Injectable({
  providedIn: 'root',
})
export class OrganizationInvitationService {
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private activityService = inject(DatabaseActivityService);

  // ===================================
  // STATE MANAGEMENT
  // ===================================

  isInviting = signal(false);
  isLoading = signal(false);
  isChangingRole = signal(false);
  isResending = signal(false);
  isDeleting = signal(false);

  // Error queue: show multiple errors instead of overwriting
  private errorSubject = new Subject<OperationError>();
  errors = signal<OperationError[]>([]);

  pendingInvitations = signal<PendingInvitation[]>([]);
  teamMembers = signal<OrganizationTeamMember[]>([]);

  // Public observable for error stream
  errors$ = this.errorSubject.asObservable();

  constructor() {
    console.log('OrganizationInvitationService initialized');
    // Subscribe to error stream
    this.errors$.subscribe((error) => {
      this.addError(error);
      // Auto-remove after 6 seconds
      setTimeout(
        () => this.removeError(error.code + error.timestamp.getTime()),
        6000,
      );
    });
  }

  // ===================================
  // ERROR HANDLING UTILITIES
  // ===================================

  /**
   * Add error to queue
   */
  private addError(error: OperationError): void {
    const current = this.errors();
    // Prevent duplicate errors
    if (
      !current.some((e) => e.code === error.code && e.message === error.message)
    ) {
      this.errors.set([...current, error]);
    }
  }

  /**
   * Remove error from queue
   */
  private removeError(errorId: string): void {
    const current = this.errors();
    this.errors.set(
      current.filter((e) => e.code + e.timestamp.getTime() !== errorId),
    );
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors.set([]);
  }

  /**
   * Create standardized error
   */
  private createError(
    code: string,
    message: string,
    userMessage: string,
    retryable: boolean = false,
  ): OperationError {
    return {
      code,
      message,
      userMessage,
      retryable,
      timestamp: new Date(),
    };
  }

  /**
   * Handle Supabase errors with categorization
   */
  private handleSupabaseError(error: any, context: string): OperationError {
    console.error(`[${context}] Supabase error:`, error);

    // Auth errors
    if (
      error?.code === 'PGRST401' ||
      error?.message?.includes('not authenticated')
    ) {
      return this.createError(
        'AUTH_ERROR',
        'Not authenticated',
        'Your session has expired. Please log in again.',
        false,
      );
    }

    // Permission errors
    if (
      error?.code === 'PGRST403' ||
      error?.message?.includes('permission') ||
      error?.message?.includes('row level security')
    ) {
      return this.createError(
        'PERMISSION_ERROR',
        'Access denied',
        'You do not have permission to perform this action.',
        false,
      );
    }

    // Duplicate/constraint errors
    if (
      error?.code === 'PGRST23505' ||
      error?.message?.includes('duplicate') ||
      error?.message?.includes('already')
    ) {
      return this.createError(
        'DUPLICATE_ERROR',
        'Duplicate record',
        'This record already exists. Try a different value.',
        false,
      );
    }

    // Not found errors
    if (error?.code === 'PGRST116' || error?.message?.includes('not found')) {
      return this.createError(
        'NOT_FOUND_ERROR',
        'Resource not found',
        'The requested resource no longer exists.',
        false,
      );
    }

    // Network/timeout errors (retryable)
    if (
      error?.message?.includes('timeout') ||
      error?.message?.includes('network') ||
      error?.message?.includes('ECONNREFUSED')
    ) {
      return this.createError(
        'NETWORK_ERROR',
        'Network error',
        'Connection failed. Please try again.',
        true,
      );
    }

    // Default error
    return this.createError(
      'UNKNOWN_ERROR',
      error?.message || 'Unknown error',
      'An unexpected error occurred. Please try again.',
      false,
    );
  }

  /**
   * Emit error and notify user
   */
  private emitError(error: OperationError, showToast: boolean = true): void {
    this.errorSubject.next(error);
    if (showToast) {
      this.toastService.error(error.userMessage);
    }
  }

  // ===================================
  // VALIDATION METHODS
  // ===================================

  /**
   * Validate invitation email format
   */
  private validateEmail(email: string): OperationError | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return this.createError(
        'INVALID_EMAIL',
        'Invalid email format',
        'Please enter a valid email address.',
        false,
      );
    }
    return null;
  }

  /**
   * Validate role
   */
  private validateRole(role: string): OperationError | null {
    const validRoles = ['admin', 'member', 'viewer'];
    if (!validRoles.includes(role)) {
      return this.createError(
        'INVALID_ROLE',
        'Invalid role',
        'The selected role is invalid.',
        false,
      );
    }
    return null;
  }

  /**
   * Check if user can manage team
   */
  private async canUserManageTeam(): Promise<{
    can: boolean;
    error?: OperationError;
  }> {
    try {
      const user = this.authService.user();
      const orgId = this.authService.getCurrentUserOrganizationId();

      if (!user?.id || !orgId) {
        return {
          can: false,
          error: this.createError(
            'AUTH_ERROR',
            'User not authenticated',
            'Please log in to continue.',
            false,
          ),
        };
      }

      const { data, error } = await this.supabase
        .from('organization_users')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        return {
          can: false,
          error: this.createError(
            'PERMISSION_ERROR',
            'Role not found',
            'You do not have permission to manage this organization.',
            false,
          ),
        };
      }

      const canManage = ['owner', 'admin'].includes(data.role);
      return { can: canManage };
    } catch (error: any) {
      return {
        can: false,
        error: this.handleSupabaseError(error, 'canUserManageTeam'),
      };
    }
  }

  // ===================================
  // INVITATION METHODS
  // ===================================

  /**
   * Invite team member with full error handling
   */
  inviteTeamMember(invitation: InvitationRequest): Observable<{
    success: boolean;
    invitationId?: string;
  }> {
    console.log('📧 Inviting team member:', invitation.email);

    // 1. Validate email
    const emailError = this.validateEmail(invitation.email);
    if (emailError) {
      this.emitError(emailError);
      return of({ success: false });
    }

    // 2. Validate role
    const roleError = this.validateRole(invitation.role);
    if (roleError) {
      this.emitError(roleError);
      return of({ success: false });
    }

    this.isInviting.set(true);
    this.clearErrors();

    return from(this.performInvitation(invitation)).pipe(
      timeout(30000), // 30 second timeout
      retry({
        count: 1,
        delay: (error, retryCount) => {
          const opError = error as OperationError;
          console.log(
            `Retry attempt ${retryCount} for invitation: ${invitation.email}`,
          );
          return opError.retryable
            ? of(null).pipe(delay(1000))
            : throwError(() => error);
        },
      }),
      tap((result) => {
        if (result.success) {
          this.toastService.success(`Invitation sent to ${invitation.email}`);
          this.loadPendingInvitations().subscribe();
        }
      }),
      catchError((error) => {
        const opError = this.handleSupabaseError(error, 'inviteTeamMember');
        this.emitError(opError);
        return of({ success: false });
      }),
      tap(() => {
        this.isInviting.set(false);
      }),
    );
  }

  /**
   * Perform invitation with complete validation and activity logging
   */
  private async performInvitation(
    invitation: InvitationRequest,
  ): Promise<{ success: boolean; invitationId?: string }> {
    try {
      const user = this.authService.user();
      const orgId = this.authService.getCurrentUserOrganizationId();

      if (!user?.id || !orgId) {
        throw this.createError(
          'AUTH_ERROR',
          'User not authenticated',
          'Please log in to continue.',
          false,
        );
      }

      // Check permissions
      const permCheck = await this.canUserManageTeam();
      if (!permCheck.can) {
        throw (
          permCheck.error || this.createError('PERMISSION_ERROR', '', '', false)
        );
      }

      // Check if already invited/active
      const { data: existing, error: checkError } = await this.supabase
        .from('organization_users')
        .select('id, status')
        .eq('organization_id', orgId)
        .eq('invitee_email', invitation.email)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw this.handleSupabaseError(checkError, 'checkExistingInvitation');
      }

      if (existing) {
        if (existing.status === 'invited') {
          throw this.createError(
            'DUPLICATE_ERROR',
            'Already invited',
            'An invitation has already been sent to this email.',
            false,
          );
        } else if (existing.status === 'active') {
          throw this.createError(
            'DUPLICATE_ERROR',
            'Already member',
            'This user is already a member of your organization.',
            false,
          );
        }
      }

      // Fetch org data
      const { data: org, error: orgError } = await this.supabase
        .from('organizations')
        .select('name, organization_type')
        .eq('id', orgId)
        .single();

      if (orgError || !org) {
        throw this.handleSupabaseError(orgError, 'fetchOrganization');
      }

      // Fetch inviter name
      const { data: inviter, error: inviterError } = await this.supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      if (inviterError) {
        console.warn('Failed to fetch inviter details:', inviterError);
      }

      const inviterName =
        inviter && (inviter.first_name || inviter.last_name)
          ? `${inviter.first_name || ''} ${inviter.last_name || ''}`.trim()
          : 'Team Member';

      // Generate token
      const invitationToken = this.generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation
      const { data: invitationData, error: inviteError } = await this.supabase
        .from('organization_users')
        .insert({
          organization_id: orgId,
          invitee_email: invitation.email,
          role: invitation.role,
          status: 'invited',
          invited_by: user.id,
          invited_at: new Date().toISOString(),
          invitation_token: invitationToken,
          invitation_expires_at: expiresAt.toISOString(),
          is_active: false,
          org_name: org.name,
          org_type: org.organization_type,
          inviter_name: inviterName,
        })
        .select('id')
        .single();

      if (inviteError || !invitationData) {
        throw this.handleSupabaseError(inviteError, 'createInvitation');
      }

      // Track activity (fire-and-forget)
      this.activityService.trackApplicationActivity(
        'invitation_sent',
        orgId,
        `Invited ${invitation.email} as ${invitation.role}`,
      );

      // Send email async (fire-and-forget)
      this.sendInvitationEmailAsync(
        invitationData.id,
        invitation.email,
        orgId,
        user.id,
        invitation.role,
        invitationToken,
        org.name,
        inviterName,
      );

      return {
        success: true,
        invitationId: invitationData.id,
      };
    } catch (error: any) {
      console.error('Invitation error:', error);

      // Re-throw if already an OperationError
      if (error?.code && error?.userMessage) {
        throw error;
      }

      throw this.handleSupabaseError(error, 'performInvitation');
    }
  }

  /**
   * Send invitation email async
   */
  private async sendInvitationEmailAsync(
    invitationId: string,
    email: string,
    orgId: string,
    userId: string,
    role: string,
    invitationToken: string,
    orgName: string,
    inviterName: string,
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
          result.error,
        );
        // Log to activity but don't fail the operation
        this.activityService.trackApplicationActivity(
          'email_failed',
          orgId,
          `Failed to send invitation email to ${email}: ${result.error}`,
        );
      }
    } catch (error: any) {
      console.warn(
        `📧 Email error for invitation ${invitationId}:`,
        error?.message,
      );
    }
  }

  /**
   * Send email via Edge Function
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
        },
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

  // ===================================
  // LOAD DATA METHODS
  // ===================================

  /**
   * Load pending invitations
   */
  loadPendingInvitations(): Observable<PendingInvitation[]> {
    const orgId = this.authService.getCurrentUserOrganizationId();
    if (!orgId) {
      return of([]);
    }

    this.isLoading.set(true);

    return from(this.fetchPendingInvitations(orgId)).pipe(
      timeout(15000),
      tap((invitations) => {
        this.pendingInvitations.set(invitations);
      }),
      catchError((error) => {
        const opError = this.handleSupabaseError(
          error,
          'loadPendingInvitations',
        );
        this.emitError(opError, false); // Don't spam toast on load
        return of([]);
      }),
      tap(() => {
        this.isLoading.set(false);
      }),
    );
  }

  /**
   * Fetch pending invitations
   */
  private async fetchPendingInvitations(
    orgId: string,
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
    `,
      )
      .eq('organization_id', orgId)
      .eq('status', 'invited')
      .order('invited_at', { ascending: false });

    if (error) {
      throw this.handleSupabaseError(error, 'fetchPendingInvitations');
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
        invitationToken: inv.invitation_token,
      };
    });
  }

  /**
   * Load team members
   */
  loadTeamMembers(): Observable<OrganizationTeamMember[]> {
    const orgId = this.authService.getCurrentUserOrganizationId();
    if (!orgId) {
      return of([]);
    }

    this.isLoading.set(true);

    return from(this.fetchTeamMembers(orgId)).pipe(
      timeout(15000),
      tap((members) => {
        this.teamMembers.set(members);
      }),
      catchError((error) => {
        const opError = this.handleSupabaseError(error, 'loadTeamMembers');
        this.emitError(opError, false);
        return of([]);
      }),
      tap(() => {
        this.isLoading.set(false);
      }),
    );
  }

  /**
   * Fetch team members
   */
  private async fetchTeamMembers(
    orgId: string,
  ): Promise<OrganizationTeamMember[]> {
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
    `,
      )
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .order('joined_at', { ascending: false });

    if (error) {
      throw this.handleSupabaseError(error, 'fetchTeamMembers');
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

  // ===================================
  // RESEND INVITATION
  // ===================================

  /**
   * Resend invitation with full error handling
   */
  resendInvitation(invitationId: string): Observable<boolean> {
    this.isResending.set(true);
    this.clearErrors();

    return from(this.performResendInvitation(invitationId)).pipe(
      timeout(20000),
      retry({
        count: 1,
        delay: (error, retryCount) => {
          const opError = error as OperationError;
          console.log(
            `Retry attempt ${retryCount} for resend: ${invitationId}`,
          );
          return opError.retryable
            ? of(null).pipe(delay(1000))
            : throwError(() => error);
        },
      }),
      tap((success) => {
        if (success) {
          this.toastService.success('Invitation resent successfully');
          this.loadPendingInvitations().subscribe();
        }
      }),
      catchError((error) => {
        const opError = this.handleSupabaseError(error, 'resendInvitation');
        this.emitError(opError);
        return of(false);
      }),
      tap(() => {
        this.isResending.set(false);
      }),
    );
  }

  /**
   * Perform resend with validation
   */
  private async performResendInvitation(
    invitationId: string,
  ): Promise<boolean> {
    try {
      const { data: invitation, error } = await this.supabase
        .from('organization_users')
        .select(
          `
        id,
        invitee_email,
        role,
        organization_id,
        invitation_token,
        invited_by,
        status
      `,
        )
        .eq('id', invitationId)
        .eq('status', 'invited')
        .single();

      if (error || !invitation) {
        throw this.createError(
          'NOT_FOUND_ERROR',
          'Invitation not found',
          'This invitation no longer exists or has already been accepted.',
          false,
        );
      }

      // Reset expiry to 7 days from NOW
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      const { error: updateError } = await this.supabase
        .from('organization_users')
        .update({
          invitation_expires_at: newExpiresAt.toISOString(),
          invited_at: new Date().toISOString(),
        })
        .eq('id', invitationId)
        .eq('status', 'invited');

      if (updateError) {
        throw this.handleSupabaseError(updateError, 'updateInvitationExpiry');
      }

      // Send email
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

      // Track activity
      this.activityService.trackApplicationActivity(
        'invitation_resent',
        invitation.organization_id,
        `Resent invitation to ${invitation.invitee_email}`,
      );

      return result.success;
    } catch (error: any) {
      if (error?.code && error?.userMessage) {
        throw error;
      }
      throw this.handleSupabaseError(error, 'performResendInvitation');
    }
  }

  // ===================================
  // CANCEL INVITATION
  // ===================================

  /**
   * Cancel invitation
   */
  cancelInvitation(invitationId: string): Observable<boolean> {
    this.clearErrors();

    return from(this.performCancelInvitation(invitationId)).pipe(
      timeout(15000),
      tap((success) => {
        if (success) {
          this.toastService.success('Invitation cancelled');
          this.loadPendingInvitations().subscribe();
        }
      }),
      catchError((error) => {
        const opError = this.handleSupabaseError(error, 'cancelInvitation');
        this.emitError(opError);
        return of(false);
      }),
    );
  }

  /**
   * Perform cancel
   */
  private async performCancelInvitation(
    invitationId: string,
  ): Promise<boolean> {
    try {
      // Get invitation details for logging
      const { data: invitation } = await this.supabase
        .from('organization_users')
        .select('organization_id, invitee_email')
        .eq('id', invitationId)
        .single();

      const { error } = await this.supabase
        .from('organization_users')
        .delete()
        .eq('id', invitationId);

      if (error) {
        throw this.handleSupabaseError(error, 'deleteInvitation');
      }

      // Track activity
      if (invitation) {
        this.activityService.trackApplicationActivity(
          'invitation_cancelled',
          invitation.organization_id,
          `Cancelled invitation to ${invitation.invitee_email}`,
        );
      }

      return true;
    } catch (error: any) {
      if (error?.code && error?.userMessage) {
        throw error;
      }
      throw this.handleSupabaseError(error, 'performCancelInvitation');
    }
  }

  // ===================================
  // DELETE TEAM MEMBER
  // ===================================

  /**
   * Delete team member
   */
  deleteTeamMember(memberId: string): Observable<boolean> {
    this.isDeleting.set(true);
    this.clearErrors();

    return from(this.performDeleteMember(memberId)).pipe(
      timeout(20000),
      tap((success) => {
        if (success) {
          this.toastService.success('Member removed from organization');
          this.loadTeamMembers().subscribe();
        }
      }),
      catchError((error) => {
        const opError = this.handleSupabaseError(error, 'deleteTeamMember');
        this.emitError(opError);
        return of(false);
      }),
      tap(() => {
        this.isDeleting.set(false);
      }),
    );
  }

  /**
   * Perform delete with validation and activity tracking
   */
  private async performDeleteMember(memberId: string): Promise<boolean> {
    try {
      const permCheck = await this.canUserManageTeam();
      if (!permCheck.can) {
        throw (
          permCheck.error || this.createError('PERMISSION_ERROR', '', '', false)
        );
      }

      // Fetch member details for validation and logging
      const { data: member, error: fetchError } = await this.supabase
        .from('organization_users')
        .select(
          `
        id,
        organization_id,
        user_id,
        role,
        status,
        users!fk_organization_users_user (
          first_name,
          last_name,
          email
        )
      `,
        )
        .eq('id', memberId)
        .eq('status', 'active')
        .single();

      if (fetchError || !member) {
        throw this.createError(
          'NOT_FOUND_ERROR',
          'Member not found',
          'This member no longer exists or is already inactive.',
          false,
        );
      }

      // Prevent removing owner
      if (member.role === 'owner') {
        throw this.createError(
          'INVALID_OPERATION',
          'Cannot remove owner',
          'The organization owner cannot be removed.',
          false,
        );
      }

      // Prevent removing self
      const currentUser = this.authService.user();
      if (member.user_id === currentUser?.id) {
        throw this.createError(
          'INVALID_OPERATION',
          'Cannot remove self',
          'You cannot remove yourself from the organization.',
          false,
        );
      }

      // Soft delete
      const { error: deleteError } = await this.supabase
        .from('organization_users')
        .update({
          status: 'inactive',
          removed_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('status', 'active');

      if (deleteError) {
        throw this.handleSupabaseError(deleteError, 'updateMemberStatus');
      }

      // Track activity
      const memberUser = Array.isArray(member.users)
        ? member.users[0]
        : member.users;
      const memberName = memberUser
        ? `${memberUser.first_name || ''} ${memberUser.last_name || ''}`.trim() ||
          memberUser.email
        : 'Unknown';

      this.activityService.trackApplicationActivity(
        'member_removed',
        member.organization_id,
        `Removed ${memberName} from organization`,
      );

      return true;
    } catch (error: any) {
      if (error?.code && error?.userMessage) {
        throw error;
      }
      throw this.handleSupabaseError(error, 'performDeleteMember');
    }
  }

  // ===================================
  // CHANGE ROLE
  // ===================================

  /**
   * Change team member role
   */
  changeTeamMemberRole(
    memberId: string,
    newRole: string,
  ): Observable<{ success: boolean }> {
    this.isChangingRole.set(true);
    this.clearErrors();

    // Validate role
    const roleError = this.validateRole(newRole);
    if (roleError) {
      this.emitError(roleError);
      this.isChangingRole.set(false);
      return of({ success: false });
    }

    return from(this.performChangeRole(memberId, newRole)).pipe(
      timeout(20000),
      tap((result) => {
        if (result.success) {
          this.toastService.success('Role updated successfully');
          this.loadTeamMembers().subscribe();
        }
      }),
      catchError((error) => {
        const opError = this.handleSupabaseError(error, 'changeTeamMemberRole');
        this.emitError(opError);
        return of({ success: false });
      }),
      tap(() => {
        this.isChangingRole.set(false);
      }),
    );
  }

  /**
   * Perform role change with full validation
   */
  private async performChangeRole(
    memberId: string,
    newRole: string,
  ): Promise<{ success: boolean }> {
    try {
      const currentUser = this.authService.user();
      const orgId = this.authService.getCurrentUserOrganizationId();

      if (!currentUser?.id || !orgId) {
        throw this.createError(
          'AUTH_ERROR',
          'User not authenticated',
          'Please log in to continue.',
          false,
        );
      }

      // Check permissions
      const userRole = await this.getUserRoleInOrg(currentUser.id, orgId);
      if (!['owner', 'admin'].includes(userRole)) {
        throw this.createError(
          'PERMISSION_ERROR',
          'Insufficient permissions',
          'You do not have permission to change roles.',
          false,
        );
      }

      // Fetch target member
      const { data: targetMember, error: fetchError } = await this.supabase
        .from('organization_users')
        .select(
          `
        id,
        user_id,
        role,
        status,
        users!fk_organization_users_user (
          first_name,
          last_name,
          email
        )
      `,
        )
        .eq('id', memberId)
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .single();

      if (fetchError || !targetMember) {
        throw this.createError(
          'NOT_FOUND_ERROR',
          'Member not found',
          'This member no longer exists.',
          false,
        );
      }

      const targetRole = targetMember.role;

      // Prevent demoting owners
      if (targetRole === 'owner') {
        throw this.createError(
          'INVALID_OPERATION',
          'Cannot change owner role',
          'The organization owner cannot be demoted.',
          false,
        );
      }

      // Prevent changing own role
      if (targetMember.user_id === currentUser.id) {
        throw this.createError(
          'INVALID_OPERATION',
          'Cannot change own role',
          'You cannot change your own role.',
          false,
        );
      }

      // Admin can only change member/viewer roles
      if (userRole === 'admin' && ['owner', 'admin'].includes(targetRole)) {
        throw this.createError(
          'PERMISSION_ERROR',
          'Insufficient permissions',
          'Admins can only change member and viewer roles.',
          false,
        );
      }

      if (userRole === 'admin' && ['owner', 'admin'].includes(newRole)) {
        throw this.createError(
          'PERMISSION_ERROR',
          'Cannot assign admin role',
          'Admins can only assign member and viewer roles.',
          false,
        );
      }

      // Update role
      const { error: updateError } = await this.supabase
        .from('organization_users')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('status', 'active');

      if (updateError) {
        throw this.handleSupabaseError(updateError, 'updateMemberRole');
      }

      // Track activity
      const memberUser = Array.isArray(targetMember.users)
        ? targetMember.users[0]
        : targetMember.users;
      const memberEmail = memberUser?.email || 'unknown';

      this.activityService.trackApplicationActivity(
        'role_changed',
        orgId,
        `Changed ${memberEmail} role from ${targetRole} to ${newRole}`,
      );

      // Send notification (async)
      this.notifyMemberRoleChanged(
        targetMember.user_id,
        memberUser?.first_name || '',
        memberUser?.last_name || '',
        targetRole,
        newRole,
      );

      return { success: true };
    } catch (error: any) {
      if (error?.code && error?.userMessage) {
        throw error;
      }
      throw this.handleSupabaseError(error, 'performChangeRole');
    }
  }

  /**
   * Get user's role in org
   */
  private async getUserRoleInOrg(
    userId: string,
    orgId: string,
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from('organization_users')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      throw this.createError(
        'PERMISSION_ERROR',
        'Role not found',
        'You do not have a role in this organization.',
        false,
      );
    }

    return data.role;
  }

  // ===================================
  // NOTIFICATIONS & ACTIVITY
  // ===================================

  /**
   * Notify member of role change (async, fire-and-forget)
   */
  private async notifyMemberRoleChanged(
    userId: string,
    firstName: string,
    lastName: string,
    oldRole: string,
    newRole: string,
  ): Promise<void> {
    try {
      const roleName = this.getRoleDisplayName(newRole);
      const message = `Your role has been changed to ${roleName}. You now have ${this.getPermissionsSummary(newRole)}.`;

      const { data: threadData, error: threadError } = await this.supabase
        .from('message_threads')
        .insert({
          subject: 'Your role has been updated',
          created_by: 'system',
          metadata: {
            type: 'role_change',
            targetUserId: userId,
          },
        })
        .select('id')
        .single();

      if (threadError || !threadData) {
        console.warn('Failed to create notification thread:', threadError);
        return;
      }

      // Add participant
      await this.supabase.from('thread_participants').insert({
        thread_id: threadData.id,
        user_id: userId,
        can_reply: false,
      });

      // Send message
      await this.supabase.from('messages').insert({
        thread_id: threadData.id,
        sender_id: 'system',
        message_type: 'system',
        content: message,
        is_system_message: true,
        metadata: {
          type: 'role_change',
          oldRole,
          newRole,
        },
      });

      console.log('✅ Role change notification sent');
    } catch (error) {
      console.warn('Failed to notify member (non-critical):', error);
    }
  }

  /**
   * Get permissions summary
   */
  private getPermissionsSummary(role: string): string {
    const summaries: Record<string, string> = {
      admin: 'access to team management',
      member: 'full application management',
      viewer: 'view-only access',
      owner: 'full organization access',
    };
    return summaries[role] || 'basic access';
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  /**
   * Generate secure token
   */
  private generateSecureToken(): string {
    try {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, (byte) =>
        byte.toString(16).padStart(2, '0'),
      ).join('');
    } catch (error) {
      console.error('Failed to generate secure token:', error);
      throw this.createError(
        'TOKEN_ERROR',
        'Failed to generate token',
        'An unexpected error occurred. Please try again.',
        true,
      );
    }
  }

  /**
   * Get organization name
   */
  private async getOrganizationName(orgId: string): Promise<string> {
    try {
      const { data } = await this.supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .single();
      return data?.name || 'Organization';
    } catch {
      return 'Organization';
    }
  }

  /**
   * Get user name
   */
  private async getUserName(userId: string): Promise<string> {
    try {
      const { data } = await this.supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', userId)
        .single();

      return data && (data.first_name || data.last_name)
        ? `${data.first_name || ''} ${data.last_name || ''}`.trim()
        : 'Team Member';
    } catch {
      return 'Team Member';
    }
  }

  /**
   * Get invitation status
   */
  private getInvitationStatus(expiresAt: string): 'invited' | 'expired' {
    return new Date() > new Date(expiresAt) ? 'expired' : 'invited';
  }

  /**
   * Check for pending invitation
   */
  async checkForPendingInvitation(email: string): Promise<{
    hasInvitation: boolean;
    token?: string;
    organizationId?: string;
    role?: string;
  }> {
    try {
      const { data } = await this.supabase
        .from('organization_users')
        .select(
          'invitation_token, organization_id, role, invitation_expires_at',
        )
        .eq('invitee_email', email)
        .eq('status', 'invited')
        .maybeSingle();

      if (!data || new Date() > new Date(data.invitation_expires_at)) {
        return { hasInvitation: false };
      }

      return {
        hasInvitation: true,
        token: data.invitation_token,
        organizationId: data.organization_id,
        role: data.role,
      };
    } catch {
      return { hasInvitation: false };
    }
  }

  // ===================================
  // DISPLAY UTILITIES
  // ===================================

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

  getRoleDisplayBadgeClasses(role: string): string {
    const baseClasses =
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border';
    const roleClasses: Record<string, string> = {
      owner: 'bg-teal-50 text-teal-700 border-teal-300/50',
      admin: 'bg-blue-50 text-blue-700 border-blue-300/50',
      member: 'bg-slate-50 text-slate-700 border-slate-300/50',
      viewer: 'bg-amber-50 text-amber-700 border-amber-300/50',
    };
    return `${baseClasses} ${roleClasses[role] || roleClasses['member']}`;
  }
}
