import {
  Component,
  OnInit,
  signal,
  inject,
  computed,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Users,
  UserPlus,
  Mail,
  Shield,
  Clock,
  X,
  RefreshCw,
  Crown,
  Eye,
  Settings as SettingsIcon,
  Link,
  Copy,
  EllipsisVertical,
  AlertCircle,
  CheckCircle,
} from 'lucide-angular';
import { InviteModalComponent } from './invite-modal/invite-modal.component';
import {
  OrganizationInvitationService,
  OrganizationTeamMember,
  PendingInvitation,
  OperationError,
} from './services/organisation-invitation.service';
import {
  ChangeRoleModalComponent,
  ChangeRoleRequest,
} from './change-role-modal/change-role-modal.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    InviteModalComponent,
    ChangeRoleModalComponent,
  ],
  templateUrl: './team-management.component.html',
  styleUrls: ['./team-management.component.css'],
})
export class TeamManagementComponent implements OnInit, OnDestroy {
  // Services
  invitationService = inject(OrganizationInvitationService);
  private destroy$ = new Subject<void>();

  // Icons
  UsersIcon = Users;
  UserPlusIcon = UserPlus;
  MailIcon = Mail;
  MoreVerticalIcon = EllipsisVertical;
  ShieldIcon = Shield;
  ClockIcon = Clock;
  XIcon = X;
  RefreshCwIcon = RefreshCw;
  CrownIcon = Crown;
  EyeIcon = Eye;
  SettingsIcon = SettingsIcon;
  LinkIcon = Link;
  CopyIcon = Copy;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;

  // ===================================
  // UI STATE
  // ===================================

  showInviteModal = signal(false);
  showDropdownId = signal<string | null>(null);
  showChangeRoleModal = signal(false);
  changeRoleRequest = signal<ChangeRoleRequest | null>(null);
  showShareModal = signal(false);
  selectedInvitation = signal<PendingInvitation | null>(null);
  copyFeedback = signal<string | null>(null);

  // ===================================
  // SERVICE STATE (SIGNALS)
  // ===================================

  teamMembers = this.invitationService.teamMembers;
  pendingInvitations = this.invitationService.pendingInvitations;
  isLoading = this.invitationService.isLoading;
  isInviting = this.invitationService.isInviting;
  isResending = this.invitationService.isResending;
  isDeleting = this.invitationService.isDeleting;
  isChangingRole = this.invitationService.isChangingRole;
  errors = this.invitationService.errors;

  // ===================================
  // COMPUTED SIGNALS
  // ===================================

  totalMembers = computed(
    () => this.teamMembers().length + this.pendingInvitations().length,
  );

  activeMembers = computed(
    () => this.teamMembers().filter((m) => m.status === 'active').length,
  );

  invitationExpiryDate = computed(() => {
    const invitation = this.selectedInvitation();
    return invitation?.expiresAt || new Date();
  });

  // Check if user can perform admin actions (via service)
  canInvite = computed(() => {
    return !this.isLoading();
  });

  // ===================================
  // LIFECYCLE
  // ===================================

  ngOnInit() {
    this.loadTeamData();

    // Subscribe to error stream and auto-clear after timeout
    this.invitationService.errors$
      .pipe(takeUntil(this.destroy$))
      .subscribe((error) => {
        // Service handles auto-removal, but we ensure UI is updated
        console.log('Error occurred:', error.userMessage);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================
  // DATA LOADING
  // ===================================

  loadTeamData() {
    this.invitationService.loadTeamMembers().subscribe();
    this.invitationService.loadPendingInvitations().subscribe();
  }

  // ===================================
  // INVITE MODAL
  // ===================================

  openInviteModal() {
    this.invitationService.clearErrors();
    this.showInviteModal.set(true);
  }

  closeInviteModal() {
    this.showInviteModal.set(false);
  }

  onInvitationSent() {
    this.closeInviteModal();
    this.loadTeamData();
  }

  // ===================================
  // PENDING INVITATIONS
  // ===================================

  resendInvitation(invitationId: string) {
    this.invitationService.resendInvitation(invitationId).subscribe();
  }

  cancelInvitation(invitationId: string) {
    if (
      confirm(
        'Are you sure you want to cancel this invitation? This cannot be undone.',
      )
    ) {
      this.invitationService.cancelInvitation(invitationId).subscribe();
    }
  }

  openShareModal(invitation: PendingInvitation) {
    this.selectedInvitation.set(invitation);
    this.showShareModal.set(true);
    this.copyFeedback.set(null);
  }

  closeShareModal() {
    this.showShareModal.set(false);
    this.selectedInvitation.set(null);
    this.copyFeedback.set(null);
  }

  copyInviteLink() {
    const invitation = this.selectedInvitation();
    if (!invitation) return;

    const inviteUrl = `${window.location.origin}/auth/accept-invitation?token=${invitation.invitationToken}`;

    navigator.clipboard
      .writeText(inviteUrl)
      .then(() => {
        this.copyFeedback.set('✓ Copied');
        setTimeout(() => {
          if (this.copyFeedback() === '✓ Copied') {
            this.copyFeedback.set(null);
          }
        }, 2000);
      })
      .catch(() => {
        this.invitationService.errors.set([
          ...this.invitationService.errors(),
          {
            code: 'COPY_ERROR',
            message: 'Failed to copy',
            userMessage: 'Failed to copy link to clipboard',
            retryable: false,
            timestamp: new Date(),
          },
        ]);
      });
  }

  getInviteLink(): string {
    const invitation = this.selectedInvitation();
    if (!invitation) return '';
    return `${window.location.origin}/auth/accept-invitation?token=${invitation.invitationToken}`;
  }

  // ===================================
  // TEAM MEMBERS
  // ===================================

  confirmDeleteMember(memberId: string, memberName: string) {
    if (
      confirm(
        `Remove ${memberName} from the organization? They can be re-invited later.`,
      )
    ) {
      this.invitationService.deleteTeamMember(memberId).subscribe();
    }
  }

  toggleDropdown(memberId: string) {
    this.showDropdownId.set(
      this.showDropdownId() === memberId ? null : memberId,
    );
  }

  // ===================================
  // CHANGE ROLE
  // ===================================

  openChangeRoleModal(member: OrganizationTeamMember): void {
    if (member.role === 'owner') {
      this.invitationService.errors.set([
        ...this.invitationService.errors(),
        {
          code: 'OWNER_ERROR',
          message: 'Cannot change owner role',
          userMessage: 'Owner role cannot be changed',
          retryable: false,
          timestamp: new Date(),
        },
      ]);
      return;
    }

    this.changeRoleRequest.set({
      memberId: member.id,
      memberName: member.name,
      currentRole: member.role,
    });

    this.showChangeRoleModal.set(true);
    this.showDropdownId.set(null);
  }

  onRoleChangeConfirmed(event: { memberId: string; newRole: string }): void {
    this.invitationService
      .changeTeamMemberRole(event.memberId, event.newRole)
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.closeChangeRoleModal();
          }
        },
      });
  }

  closeChangeRoleModal(): void {
    this.showChangeRoleModal.set(false);
    this.changeRoleRequest.set(null);
  }

  // ===================================
  // DISPLAY UTILITIES
  // ===================================

  getRoleBadgeClasses(role: string): string {
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

  getRoleIcon(role: string) {
    const icons: Record<string, any> = {
      owner: this.CrownIcon,
      admin: this.ShieldIcon,
      member: this.UsersIcon,
      viewer: this.EyeIcon,
    };
    return icons[role] || this.UsersIcon;
  }

  getRoleDisplayName(role: string): string {
    return this.invitationService.getRoleDisplayName(role);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  getExpiryWarning(expiresAt: Date): {
    show: boolean;
    message: string;
    class: string;
  } {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));

    if (hoursLeft < 0) {
      return {
        show: true,
        message: 'Expired',
        class: 'text-red-600 font-bold',
      };
    }
    if (hoursLeft < 24) {
      return {
        show: true,
        message: `Expires in ${hoursLeft}h`,
        class: 'text-amber-600 font-bold',
      };
    }
    return { show: false, message: '', class: '' };
  }

  formatExpiryDate(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days < 0) {
      return 'Expired';
    }
    if (days === 0 && hours > 0) {
      return `Expires in ${hours}h`;
    }
    if (days === 0) {
      return 'Expires today';
    }
    if (days === 1) {
      return 'Expires tomorrow';
    }
    return `Expires in ${days} days`;
  }

  // ===================================
  // ERROR HANDLING DISPLAY
  // ===================================

  closeError(errorId: string): void {
    const current = this.errors();
    this.invitationService.errors.set(
      current.filter((e) => e.code + e.timestamp.getTime() !== errorId),
    );
  }

  getErrorIcon(code: string): any {
    return this.AlertCircleIcon;
  }

  // ===================================
  // TRACK BY FUNCTIONS
  // ===================================

  trackByMemberId(index: number, member: any): string {
    return member.id;
  }

  trackByInvitationId(index: number, invitation: any): string {
    return invitation.id;
  }

  trackByErrorId(index: number, error: OperationError): string {
    return error.code + error.timestamp.getTime();
  }
}
