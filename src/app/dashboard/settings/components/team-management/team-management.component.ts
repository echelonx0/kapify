import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Users,
  UserPlus,
  Mail,
  MoreVertical,
  Shield,
  Clock,
  X,
  RefreshCw,
  Crown,
  Eye,
  Settings as SettingsIcon,
} from 'lucide-angular';
import { InviteModalComponent } from './invite-modal/invite-modal.component';
import { AuthService } from '../../../../auth/production.auth.service';
import { OrganizationInvitationService } from './services/organisation-invitation.service';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, InviteModalComponent],
  templateUrl: './team-management.component.html',
  styleUrls: ['./team-management.component.css'],
})
export class TeamManagementComponent implements OnInit {
  // Make service public for template access
  invitationService = inject(OrganizationInvitationService);
  private authService = inject(AuthService);

  // Icons
  UsersIcon = Users;
  UserPlusIcon = UserPlus;
  MailIcon = Mail;
  MoreVerticalIcon = MoreVertical;
  ShieldIcon = Shield;
  ClockIcon = Clock;
  XIcon = X;
  RefreshCwIcon = RefreshCw;
  CrownIcon = Crown;
  EyeIcon = Eye;
  SettingsIcon = SettingsIcon;

  // State
  showInviteModal = signal(false);
  showDropdownId = signal<string | null>(null);
  canInvite = signal(false); // Changed to signal

  // Service state
  teamMembers = this.invitationService.teamMembers;
  pendingInvitations = this.invitationService.pendingInvitations;
  isLoading = this.invitationService.isLoading;
  isInviting = this.invitationService.isInviting;
  error = this.invitationService.error;

  // Computed
  totalMembers = computed(
    () => this.teamMembers().length + this.pendingInvitations().length
  );

  activeMembers = computed(
    () => this.teamMembers().filter((m) => m.status === 'active').length
  );

  async ngOnInit() {
    this.loadTeamData();

    // Check if user can invite (async)
    const canInviteResult = await this.checkCanInvite();
    this.canInvite.set(canInviteResult);
  }

  private async checkCanInvite(): Promise<boolean> {
    const user = this.authService.user();
    if (!user) return false;

    const orgId = this.authService.getCurrentUserOrganizationId();
    if (!orgId) return false;

    try {
      const { data, error } = await this.invitationService['supabase']
        .from('organization_users')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .single();

      if (error || !data) return false;

      return ['owner', 'admin'].includes(data.role);
    } catch {
      return false;
    }
  }

  loadTeamData() {
    this.invitationService.loadTeamMembers().subscribe();
    this.invitationService.loadPendingInvitations().subscribe();
  }

  openInviteModal() {
    this.showInviteModal.set(true);
  }

  closeInviteModal() {
    this.showInviteModal.set(false);
  }

  onInvitationSent() {
    this.closeInviteModal();
    this.loadTeamData();
  }

  resendInvitation(invitationId: string) {
    this.invitationService.resendInvitation(invitationId).subscribe({
      next: (success) => {
        if (success) {
          console.log('Invitation resent successfully');
        }
      },
    });
  }

  cancelInvitation(invitationId: string) {
    if (confirm('Are you sure you want to cancel this invitation?')) {
      this.invitationService.cancelInvitation(invitationId).subscribe({
        next: (success) => {
          if (success) {
            this.loadTeamData();
          }
        },
      });
    }
  }

  toggleDropdown(memberId: string) {
    this.showDropdownId.set(
      this.showDropdownId() === memberId ? null : memberId
    );
  }

  getRoleBadgeClasses(role: string): string {
    const baseClasses =
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold';
    const roleClasses: Record<string, string> = {
      owner: 'bg-teal-50 text-teal-700 border border-teal-200/50',
      admin: 'bg-blue-50 text-blue-700 border border-blue-200/50',
      member: 'bg-slate-50 text-slate-700 border border-slate-200/50',
      viewer: 'bg-amber-50 text-amber-700 border border-amber-200/50',
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
      year: 'numeric',
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
        class: 'text-red-600',
      };
    }
    if (hoursLeft < 24) {
      return {
        show: true,
        message: `Expires in ${hoursLeft}h`,
        class: 'text-amber-600',
      };
    }
    return { show: false, message: '', class: '' };
  }

  trackByMemberId(index: number, member: any): string {
    return member.id;
  }

  trackByInvitationId(index: number, invitation: any): string {
    return invitation.id;
  }
}
