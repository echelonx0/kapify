import { Component, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  X,
  Mail,
  User,
  Shield,
  Users,
  Eye,
  Crown,
} from 'lucide-angular';
import {
  OrganizationInvitationService,
  InvitationRequest,
} from '../services/organisation-invitation.service';

@Component({
  selector: 'app-invite-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './invite-modal.component.html',
  styleUrls: ['./invite-modal.component.css'],
})
export class InviteModalComponent {
  private invitationService = inject(OrganizationInvitationService);

  @Output() invitationSent = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  // Icons
  XIcon = X;
  MailIcon = Mail;
  UserIcon = User;
  ShieldIcon = Shield;
  UsersIcon = Users;
  EyeIcon = Eye;
  CrownIcon = Crown;

  // Form state
  email = signal('');
  firstName = signal('');
  lastName = signal('');
  selectedRole = signal<'admin' | 'member' | 'viewer'>('member');

  // Validation
  emailError = signal<string | null>(null);
  formError = signal<string | null>(null);

  // Service state
  isInviting = this.invitationService.isInviting;

  // Role options
  roleOptions = [
    {
      value: 'admin' as const,
      label: 'Administrator',
      icon: this.ShieldIcon,
      description: 'Can manage team members and organization settings',
      color: 'blue',
    },
    {
      value: 'member' as const,
      label: 'Member',
      icon: this.UsersIcon,
      description: 'Can create and manage applications and documents',
      color: 'teal',
    },
    {
      value: 'viewer' as const,
      label: 'Viewer',
      icon: this.EyeIcon,
      description: 'Can view applications and data (read-only)',
      color: 'amber',
    },
  ];

  selectRole(role: 'admin' | 'member' | 'viewer') {
    this.selectedRole.set(role);
  }

  validateEmail(): boolean {
    const emailValue = this.email().trim();

    if (!emailValue) {
      this.emailError.set('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
      this.emailError.set('Please enter a valid email address');
      return false;
    }

    this.emailError.set(null);
    return true;
  }

  onEmailBlur() {
    if (this.email().trim()) {
      this.validateEmail();
    }
  }

  sendInvitation() {
    // Reset errors
    this.formError.set(null);

    // Validate
    if (!this.validateEmail()) {
      return;
    }

    const invitation: InvitationRequest = {
      email: this.email().trim(),
      role: this.selectedRole(),
      firstName: this.firstName().trim() || undefined,
      lastName: this.lastName().trim() || undefined,
    };

    this.invitationService.inviteTeamMember(invitation).subscribe({
      next: (result) => {
        if (result.success) {
          this.invitationSent.emit();
        } else {
          this.formError.set('Failed to send invitation');
        }
      },
      error: (error) => {
        this.formError.set(error?.message || 'Failed to send invitation');
      },
    });
  }

  cancel() {
    this.cancelled.emit();
  }

  getRoleColorClasses(color: string): string {
    const selected = this.selectedRole();
    const option = this.roleOptions.find((r) => r.value === selected);
    const isSelected = option?.color === color;

    const colorMap: Record<string, string> = {
      blue: isSelected
        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500'
        : 'bg-white border-slate-200 hover:border-blue-200',
      teal: isSelected
        ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-500'
        : 'bg-white border-slate-200 hover:border-teal-200',
      amber: isSelected
        ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500'
        : 'bg-white border-slate-200 hover:border-amber-200',
    };

    return colorMap[color] || colorMap['teal'];
  }

  getRoleIconColor(color: string): string {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-600',
      teal: 'text-teal-600',
      amber: 'text-amber-600',
    };
    return colorMap[color] || 'text-slate-600';
  }

  trackByRoleValue(index: number, role: any): string {
    return role.value;
  }
}
