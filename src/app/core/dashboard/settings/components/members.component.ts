// src/app/dashboard/components/settings/components/members.component.ts
import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  Users, 
  UserPlus, 
  MoreHorizontal,
  Trash2,
  Mail,
  Crown,
  Shield,
  Eye,
  Download
} from 'lucide-angular';
import { OrganizationSettings } from '../../services/organization-settings.service';

 
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  avatar?: string;
  isOnline: boolean;
  lastActive: Date;
  joinedAt: Date;
}

interface PendingInvite {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  sentAt: Date;
  sentBy: string;
}

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-lg border border-neutral-200">
        <div class="px-6 py-4 border-b border-neutral-200">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-neutral-900">Team Members</h3>
              <p class="text-sm text-neutral-600 mt-1">
                Manage your team and control access to your organization
              </p>
            </div>
            
            <button
              (click)="openInviteModal()"
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
              disabled
            >
              <lucide-icon [img]="UserPlusIcon" [size]="16" class="mr-2" />
              Invite Member
            </button>
          </div>
        </div>

        <!-- Team Members List -->
        <div class="divide-y divide-neutral-200">
          @for (member of mockTeamMembers(); track member.id) {
            <div class="px-6 py-4 flex items-center justify-between hover:bg-neutral-50">
              <div class="flex items-center">
                <!-- Avatar -->
                <div class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                  @if (member.avatar) {
                    <img [src]="member.avatar" [alt]="member.name" class="w-10 h-10 rounded-full object-cover" />
                  } @else {
                    <span class="text-sm font-medium text-primary-700">
                      {{ getInitials(member.name) }}
                    </span>
                  }
                </div>

                <!-- Member Info -->
                <div>
                  <div class="flex items-center">
                    <h4 class="text-sm font-medium text-neutral-900">{{ member.name }}</h4>
                    @if (member.role === 'owner') {
                      <lucide-icon [img]="CrownIcon" [size]="14" class="ml-2 text-yellow-500" />
                    } @else if (member.role === 'admin') {
                      <lucide-icon [img]="ShieldIcon" [size]="14" class="ml-2 text-blue-500" />
                    }
                    @if (member.isOnline) {
                      <span class="ml-2 w-2 h-2 bg-green-500 rounded-full"></span>
                    }
                  </div>
                  <div class="flex items-center text-sm text-neutral-600 mt-1">
                    <lucide-icon [img]="MailIcon" [size]="12" class="mr-1" />
                    {{ member.email }}
                  </div>
                </div>
              </div>

              <div class="flex items-center space-x-4">
                <!-- Role Badge -->
                <span [class]="getRoleClasses(member.role)">
                  {{ getRoleLabel(member.role) }}
                </span>

                <!-- Last Active -->
                <div class="text-sm text-neutral-500 text-right">
                  <div>{{ formatLastActive(member.lastActive) }}</div>
                  <div class="text-xs">{{ formatDate(member.joinedAt) }}</div>
                </div>

                <!-- Actions -->
                <div class="relative">
                  <button
                    class="p-2 text-neutral-400 hover:text-neutral-600 rounded-md hover:bg-neutral-100"
                    disabled
                  >
                    <lucide-icon [img]="MoreHorizontalIcon" [size]="16" />
                  </button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="px-6 py-8 text-center text-neutral-500">
              <lucide-icon [img]="UsersIcon" [size]="48" class="mx-auto mb-4 text-neutral-300" />
              <h4 class="text-lg font-medium text-neutral-900 mb-2">No team members</h4>
              <p class="text-neutral-600">Invite team members to collaborate on funding opportunities</p>
            </div>
          }
        </div>
      </div>

      <!-- Pending Invitations -->
      @if (mockPendingInvites().length > 0) {
        <div class="bg-white rounded-lg border border-neutral-200">
          <div class="px-6 py-4 border-b border-neutral-200">
            <h3 class="text-lg font-medium text-neutral-900">Pending Invitations</h3>
            <p class="text-sm text-neutral-600 mt-1">
              Invitations that haven't been accepted yet
            </p>
          </div>

          <div class="divide-y divide-neutral-200">
            @for (invite of mockPendingInvites(); track invite.id) {
              <div class="px-6 py-4 flex items-center justify-between">
                <div class="flex items-center">
                  <div class="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center mr-4">
                    <lucide-icon [img]="MailIcon" [size]="20" class="text-neutral-500" />
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-neutral-900">{{ invite.email }}</h4>
                    <p class="text-sm text-neutral-600">
                      Invited {{ formatDate(invite.sentAt) }} by {{ invite.sentBy }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center space-x-4">
                  <!-- Role Badge -->
                  <span [class]="getRoleClasses(invite.role)">
                    {{ getRoleLabel(invite.role) }}
                  </span>

                  <!-- Actions -->
                  <div class="flex space-x-2">
                    <button
                      class="px-3 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded-md hover:bg-primary-100"
                      disabled
                    >
                      Resend
                    </button>
                    <button
                      class="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100"
                      disabled
                    >
                      <lucide-icon [img]="Trash2Icon" [size]="12" class="mr-1" />
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Member Permissions Info -->
      <div class="bg-white rounded-lg border border-neutral-200">
        <div class="px-6 py-4 border-b border-neutral-200">
          <h3 class="text-lg font-medium text-neutral-900">Role Permissions</h3>
          <p class="text-sm text-neutral-600 mt-1">
            Understanding what each role can do in your organization
          </p>
        </div>

        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Owner -->
            <div class="space-y-3">
              <div class="flex items-center">
                <lucide-icon [img]="CrownIcon" [size]="16" class="text-yellow-500 mr-2" />
                <h4 class="font-medium text-neutral-900">Owner</h4>
              </div>
              <ul class="text-sm text-neutral-600 space-y-1">
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  Full organization control
                </li>
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  Manage all members
                </li>
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  Billing and subscription
                </li>
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  Create opportunities
                </li>
              </ul>
            </div>

            <!-- Admin -->
            <div class="space-y-3">
              <div class="flex items-center">
                <lucide-icon [img]="ShieldIcon" [size]="16" class="text-blue-500 mr-2" />
                <h4 class="font-medium text-neutral-900">Admin</h4>
              </div>
              <ul class="text-sm text-neutral-600 space-y-1">
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  Manage organization settings
                </li>
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  Invite/remove members
                </li>
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                  No billing access
                </li>
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  Create opportunities
                </li>
              </ul>
            </div>

            <!-- Member -->
            <div class="space-y-3">
              <div class="flex items-center">
                <lucide-icon [img]="UsersIcon" [size]="16" class="text-green-500 mr-2" />
                <h4 class="font-medium text-neutral-900">Member</h4>
              </div>
              <ul class="text-sm text-neutral-600 space-y-1">
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                  No organization settings
                </li>
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                  Cannot manage members
                </li>
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  Create opportunities
                </li>
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  Review applications
                </li>
              </ul>
            </div>

            <!-- Viewer -->
            <div class="space-y-3">
              <div class="flex items-center">
                <lucide-icon [img]="EyeIcon" [size]="16" class="text-neutral-500 mr-2" />
                <h4 class="font-medium text-neutral-900">Viewer</h4>
              </div>
              <ul class="text-sm text-neutral-600 space-y-1">
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                  Read-only access
                </li>
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  View opportunities
                </li>
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  View applications
                </li>
                <li class="flex items-center">
                  <span class="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                  Cannot create content
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Coming Soon Notice -->
      <div class="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
            <lucide-icon [img]="UsersIcon" [size]="24" class="text-white" />
          </div>
          <div>
            <h3 class="text-lg font-medium text-blue-900">Team Management Coming Soon</h3>
            <p class="text-blue-700 mt-1">
              Full team management features including invitations, role management, and permissions are currently in development. 
              For now, you can view your current team structure and understand the role permissions system.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MembersComponent {
  @Input() organization: OrganizationSettings | null = null;

  // Icons
  UsersIcon = Users;
  UserPlusIcon = UserPlus;
  MoreHorizontalIcon = MoreHorizontal;
  Trash2Icon = Trash2;
  MailIcon = Mail;
  CrownIcon = Crown;
  ShieldIcon = Shield;
  EyeIcon = Eye;
  DownloadIcon = Download;

  // Mock data for development - TODO: Replace with real API calls
  mockTeamMembers = signal<TeamMember[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@organization.com',
      role: 'owner',
      isOnline: true,
      lastActive: new Date(),
      joinedAt: new Date('2024-01-15')
    }
    // Add more mock members as needed
  ]);

  mockPendingInvites = signal<PendingInvite[]>([
    // Mock pending invites - empty for now
  ]);

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getRoleClasses(role: string): string {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    
    switch (role) {
      case 'owner':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case 'admin':
        return `${baseClasses} bg-blue-100 text-blue-700`;
      case 'member':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'viewer':
        return `${baseClasses} bg-neutral-100 text-neutral-700`;
      default:
        return `${baseClasses} bg-neutral-100 text-neutral-500`;
    }
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'owner': 'Owner',
      'admin': 'Admin',
      'member': 'Member',
      'viewer': 'Viewer'
    };
    return labels[role] || 'Unknown';
  }

  formatLastActive(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  // TODO: Implement when team API is ready
  openInviteModal() {
    console.log('TODO: Open invite member modal');
    // This will open a modal to invite new members
  }

  removeMember(memberId: string) {
    console.log('TODO: Remove member', memberId);
    // This will remove a team member
  }

  resendInvite(inviteId: string) {
    console.log('TODO: Resend invitation', inviteId);
    // This will resend a pending invitation
  }

  revokeInvite(inviteId: string) {
    console.log('TODO: Revoke invitation', inviteId);
    // This will revoke a pending invitation
  }
}