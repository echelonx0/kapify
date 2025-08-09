// src/app/dashboard/pages/settings.component.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, User, Building, Settings, Bell, Shield, CreditCard, Users, Camera, Save, X, Download, UserPlus, MoreHorizontal, Trash2, ExternalLink, CheckCircle, AlertCircle, Calendar, DollarSign } from 'lucide-angular';
 
import { BadgeComponent } from '../../shared/components/ui/badge.component';
import { AvatarComponent } from '../../shared/components/ui/avatar.component'; 
import { DropdownComponent } from '../../shared/components/ui/shared-ui-components';
import { TableComponent, TableColumn, TableAction } from '../../shared/components/ui/table-ui.component';
import { DummyProfileDataService, DummyUserProfileData } from '../../shared/services/dummy-profile.service';

type SettingsTab = 'personal' | 'members' | 'integrations' | 'billing';

interface TeamMemberDisplay {
  id: string;
  name: string;
  email: string;
  dateAdded: string;
  lastActive: string;
  role: string;
  avatar?: string;
  isOnline?: boolean;
}

interface GuestUserDisplay {
  id: string;
  name: string;
  email: string;
  dateAdded: string;
  lastActive: string;
  role: string;
  avatar?: string;
}

interface PendingInviteDisplay {
  id: string;
  name: string;
  email: string;
  dateSent: string;
  role: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    LucideAngularModule,
    DropdownComponent,
    BadgeComponent,
    AvatarComponent,
    TableComponent
  ],
  templateUrl: 'settings-page.component.html'
})
export class SettingsComponent implements OnInit {
  private dummyDataService = inject(DummyProfileDataService);
  private fb = inject(FormBuilder);

  // Icons
  UserIcon = User;
  BuildingIcon = Building;
  SettingsIcon = Settings;
  BellIcon = Bell;
  ShieldIcon = Shield;
  CreditCardIcon = CreditCard;
  UsersIcon = Users;
  CameraIcon = Camera;
  SaveIcon = Save;
  XIcon = X;
  DownloadIcon = Download;
  UserPlusIcon = UserPlus;
  MoreHorizontalIcon = MoreHorizontal;
  Trash2Icon = Trash2;
  ExternalLinkIcon = ExternalLink;
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  CalendarIcon = Calendar;
  DollarSignIcon = DollarSign;

  // State
  activeTab = signal<SettingsTab>('personal');
  isLoading = signal(false);
  error = signal<string | null>(null);
  isSaving = signal(false);
  profileData = signal<DummyUserProfileData | null>(null);

  // Computed data
  currentUser = computed(() => this.profileData()?.user || null);
  currentOrganization = computed(() => this.profileData()?.organization || null);
  userDisplayName = computed(() => {
    const user = this.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  // Billing computed data
  currentPlan = computed(() => {
    const user = this.currentUser();
    return user?.accountTier || 'basic';
  });

  billingDetails = computed(() => {
    const org = this.currentOrganization();
    return org?.billingDetails || null;
  });

  nextBillingDate = computed(() => {
    // Mock next billing date - 30 days from now
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });

  monthlyAmount = computed(() => {
    const plan = this.currentPlan();
    const amounts = {
      'basic': 0,
      'premium': 99,
      'enterprise': 299
    };
    return amounts[plan as keyof typeof amounts] || 0;
  });

  // Forms
  profileForm!: FormGroup;
  organizationForm!: FormGroup;

  // Settings tabs configuration
  tabs = [
    { id: 'personal' as SettingsTab, label: 'Personal', enabled: true },
    { id: 'members' as SettingsTab, label: 'Members', enabled: true },
    { id: 'integrations' as SettingsTab, label: 'Integrations', enabled: false },
    { id: 'billing' as SettingsTab, label: 'Billing', enabled: true }
  ];

  // Dropdown options
  industryOptions = [
    { value: '', label: 'Select Industry' },
    { value: 'technology', label: 'Technology' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'other', label: 'Other' }
  ];

  // Table configurations
  memberColumns: TableColumn[] = [
    { key: 'name', label: 'NAME' },
    { key: 'dateAdded', label: 'DATE ADDED' },
    { key: 'lastActive', label: 'LAST ACTIVE' },
    { key: 'role', label: 'ROLE' }
  ];

  guestColumns: TableColumn[] = [
    { key: 'name', label: 'NAME' },
    { key: 'dateAdded', label: 'DATE ADDED' },
    { key: 'lastActive', label: 'LAST ACTIVE' },
    { key: 'role', label: 'ROLE' }
  ];

  inviteColumns: TableColumn[] = [
    { key: 'name', label: 'NAME' },
    { key: 'dateSent', label: 'DATE SENT' },
    { key: 'role', label: 'ROLE' }
  ];

  // Table actions
  memberHeaderActions: TableAction[] = [
    {
      label: 'Download CSV',
      icon: this.DownloadIcon,
      action: () => this.downloadMembersCsv()
    },
    {
      label: 'Invite a new member',
      icon: this.UserPlusIcon,
      action: () => this.inviteNewMember()
    }
  ];

  guestHeaderActions: TableAction[] = [
    {
      label: 'Download CSV',
      icon: this.DownloadIcon,
      action: () => this.downloadGuestsCsv()
    },
    {
      label: 'Invite a new guest',
      icon: this.UserPlusIcon,
      action: () => this.inviteNewGuest()
    }
  ];

  memberActions: TableAction[] = [
    {
      label: 'Remove',
      icon: this.Trash2Icon,
      variant: 'danger',
      action: (member) => this.removeMember(member)
    }
  ];

  guestActions: TableAction[] = [
    {
      label: 'Remove',
      icon: this.Trash2Icon,
      variant: 'danger',
      action: (guest) => this.removeGuest(guest)
    }
  ];

  inviteActions: TableAction[] = [
    {
      label: 'Resend invite',
      action: (invite) => this.resendInvite(invite)
    },
    {
      label: 'Revoke invite',
      variant: 'danger',
      action: (invite) => this.revokeInvite(invite)
    }
  ];

  // Display data computed properties
  teamMembersDisplay = computed(() => {
    const data = this.profileData();
    if (!data) return [];

    return data.teamMembers.map(member => {
      const userData = this.dummyDataService.getUserData(member.userId);
      return {
        id: member.id,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        dateAdded: this.formatDate(member.joinedAt),
        lastActive: this.formatDate(userData.lastLoginAt || member.updatedAt),
        role: member.role.displayName,
        avatar: userData.profilePicture,
        isOnline: this.isUserOnline(userData.lastLoginAt)
      };
    });
  });

  guestUsersDisplay = computed(() => {
    // For demo, return empty array since we don't have guest users in dummy data
    return [];
  });

  pendingInvitesDisplay = computed(() => {
    const data = this.profileData();
    if (!data) return [];

    return data.pendingInvitations.map(invite => ({
      id: invite.id,
      name: invite.inviteeEmail.split('@')[0], // Use email prefix as name
      email: invite.inviteeEmail,
      dateSent: this.formatDate(invite.createdAt),
      role: invite.inviteeRole
    }));
  });

  // Mock invoice data for billing
  mockInvoices = computed(() => [
    {
      id: 'inv-001',
      date: new Date('2024-07-01'),
      description: 'Premium Plan - July 2024',
      amount: 99,
      status: 'paid'
    },
    {
      id: 'inv-002', 
      date: new Date('2024-06-01'),
      description: 'Premium Plan - June 2024',
      amount: 99,
      status: 'paid'
    },
    {
      id: 'inv-003',
      date: new Date('2024-05-01'),
      description: 'Premium Plan - May 2024', 
      amount: 99,
      status: 'paid'
    },
    {
      id: 'inv-004',
      date: new Date('2024-04-01'),
      description: 'Premium Plan - April 2024',
      amount: 99,
      status: 'paid'
    }
  ]);

  ngOnInit() {
    this.initializeForms();
    this.loadProfile();
  }

  private initializeForms() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });

    this.organizationForm = this.fb.group({
      organizationName: ['', [Validators.required]],
      registrationNumber: [''],
      vatNumber: [''],
      industry: ['']
    });
  }

    loadProfile() {
    this.isLoading.set(true);
    this.error.set(null);

    this.dummyDataService.getProfileData().subscribe({
      next: (data) => {
        this.profileData.set(data);
        this.populateForms(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set('Failed to load profile data');
        this.isLoading.set(false);
        console.error('Failed to load profile:', error);
      }
    });
  }

  private populateForms(data: DummyUserProfileData) {
    this.profileForm.patchValue({
      firstName: data.user.firstName,
      lastName: data.user.lastName,
      email: data.user.email,
      phone: data.user.phone || ''
    });

    const org = data.organization;
    this.organizationForm.patchValue({
      organizationName: 'companyName' in org ? org.companyName : org.organizationName,
      registrationNumber: org.registrationNumber || '',
      vatNumber: 'vatNumber' in org ? org.vatNumber : '',
      industry: 'industry' in org ? org.industry : ''
    });
  }

  setActiveTab(tab: SettingsTab) {
    this.activeTab.set(tab);
  }

  getTabClasses(tabId: SettingsTab): string {
    const baseClasses = 'px-4 py-2 text-sm font-medium rounded-md transition-colors';
    const isActive = this.activeTab() === tabId;
    
    if (isActive) {
      return `${baseClasses} bg-neutral-900 text-white`;
    }
    return `${baseClasses} text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100`;
  }

  saveProfile() {
    if (this.profileForm.invalid) return;

    this.isSaving.set(true);
    const formValue = this.profileForm.value;

    this.dummyDataService.updateUserInfo(formValue).subscribe({
      next: () => {
        this.isSaving.set(false);
        // Show success message
      },
      error: (error) => {
        this.isSaving.set(false);
        console.error('Failed to save profile:', error);
      }
    });
  }

  triggerFileUpload() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      this.isSaving.set(true);
      this.dummyDataService.uploadProfilePicture(file).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.loadProfile(); // Refresh data
        },
        error: (error) => {
          this.isSaving.set(false);
          console.error('Failed to upload profile picture:', error);
        }
      });
    }
  }

  // Helper methods
   formatDate(date: Date | undefined): string {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    }).format(new Date(date));
  }

   isUserOnline(lastLogin: Date | undefined): boolean {
    if (!lastLogin) return false;
    const now = new Date();
    const diffMinutes = (now.getTime() - new Date(lastLogin).getTime()) / (1000 * 60);
    return diffMinutes < 30; // Consider online if active within 30 minutes
  }

  // Action methods
  downloadMembersCsv() {
    console.log('Download members CSV');
  }

  downloadGuestsCsv() {
    console.log('Download guests CSV');
  }

  inviteNewMember() {
    console.log('Invite new member');
  }

  inviteNewGuest() {
    console.log('Invite new guest');
  }

  removeMember(member: any) {
    console.log('Remove member:', member);
  }

  removeGuest(guest: any) {
    console.log('Remove guest:', guest);
  }

  resendInvite(invite: any) {
    console.log('Resend invite:', invite);
  }

  revokeInvite(invite: any) {
    console.log('Revoke invite:', invite);
  }

  // Billing action methods
  upgradePlan() {
    console.log('Upgrade plan clicked');
    // TODO: Open upgrade modal or redirect to billing portal
  }

  downloadInvoice(invoiceId: string) {
    console.log('Download invoice:', invoiceId);
    // TODO: Generate and download invoice PDF
  }

  downloadAllInvoices() {
    console.log('Download all invoices');
    // TODO: Generate and download ZIP of all invoices
  }
}