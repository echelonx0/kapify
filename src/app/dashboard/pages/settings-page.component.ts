// // src/app/dashboard/pages/settings.component.ts
// import { Component, OnInit, signal, computed, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { LucideAngularModule, User, Building, Settings, Bell, Shield, CreditCard, Users, Camera, Save, X, Download, UserPlus, MoreHorizontal, Trash2, ExternalLink, CheckCircle, AlertCircle, Calendar, DollarSign } from 'lucide-angular';
 
// import { BadgeComponent } from '../../shared/components/ui/badge.component';
// import { AvatarComponent } from '../../shared/components/ui/avatar.component'; 
// import { DropdownComponent } from '../../shared/components/ui/shared-ui-components';
// import { TableComponent, TableColumn, TableAction } from '../../shared/components/ui/table-ui.component';
// import { ProfileManagementService, UserProfileData } from '../../shared/services/profile-management.service';
 
 

// type SettingsTab = 'personal' | 'members' | 'integrations' | 'billing';

// // interface TeamMemberDisplay {
// //   id: string;
// //   name: string;
// //   email: string;
// //   dateAdded: string;
// //   lastActive: string;
// //   role: string;
// //   avatar?: string;
// //   isOnline?: boolean;
// // }

// // interface PendingInviteDisplay {
// //   id: string;
// //   name: string;
// //   email: string;
// //   dateSent: string;
// //   role: string;
// // }

// @Component({
//   selector: 'app-settings',
//   standalone: true,
//   imports: [
//     CommonModule, 
//     ReactiveFormsModule, 
//     LucideAngularModule,
//     DropdownComponent,
//     BadgeComponent,
//     AvatarComponent,
//     TableComponent
//   ],
//   templateUrl: 'settings-page.component.html'
// })
// export class SettingsComponent implements OnInit {
//   private profileService = inject(ProfileManagementService);
 
//   private fb = inject(FormBuilder);

//   // Icons
//   UserIcon = User;
//   BuildingIcon = Building;
//   SettingsIcon = Settings;
//   BellIcon = Bell;
//   ShieldIcon = Shield;
//   CreditCardIcon = CreditCard;
//   UsersIcon = Users;
//   CameraIcon = Camera;
//   SaveIcon = Save;
//   XIcon = X;
//   DownloadIcon = Download;
//   UserPlusIcon = UserPlus;
//   MoreHorizontalIcon = MoreHorizontal;
//   Trash2Icon = Trash2;
//   ExternalLinkIcon = ExternalLink;
//   CheckCircleIcon = CheckCircle;
//   AlertCircleIcon = AlertCircle;
//   CalendarIcon = Calendar;
//   DollarSignIcon = DollarSign;

//   // State
//   activeTab = signal<SettingsTab>('personal');
//   isSaving = signal(false);

//   // Use ProfileManagementService signals
//   isLoading = this.profileService.isLoading;
//   error = this.profileService.error;
//   profileData = this.profileService.profileData;

//   // Computed data
//   currentUser = this.profileService.currentUser;
//   currentProfile = this.profileService.currentProfile;
//   currentOrganization = this.profileService.currentOrganization;
//   currentOrganizationUser = this.profileService.currentOrganizationUser;

//   userDisplayName = computed(() => {
//     const user = this.currentUser();
//     return user ? `${user.firstName} ${user.lastName}` : '';
//   });

//   // Billing computed data
//   currentPlan = computed(() => {
//     const user = this.currentUser();
//     return user?.accountTier || 'basic';
//   });

//   billingDetails = computed(() => {
//     // Mock billing details 
//     // TODO: Replace with real billing data when billing system is implemented
//     const user = this.currentUser();
//     const org = this.currentOrganization();
    
//     if (!user || !org) return null;
    
//     return {
//       companyName: org.name,
//       vatNumber: null, // TODO: Add to organization model
//       billingEmail: user.email,
//       address: {
//         street: 'Not provided',
//         suburb: 'Not provided',
//         city: 'Not provided',
//         province: 'Not provided',
//         postalCode: 'Not provided',
//         country: 'South Africa'
//       },
//       paymentMethod: user.accountTier !== 'basic' ? {
//         id: 'pm_mock',
//         type: 'card',
//         last4: '4242',
//         brand: 'visa',
//         isDefault: true,
//         expiryMonth: 12,
//         expiryYear: 2026
//       } : null
//     };
//   });

//   nextBillingDate = computed(() => {
//     // Mock next billing date - 30 days from now
//     const date = new Date();
//     date.setDate(date.getDate() + 30);
//     return date;
//   });

//   monthlyAmount = computed(() => {
//     const plan = this.currentPlan();
//     const amounts = {
//       'basic': 0,
//       'premium': 99,
//       'enterprise': 299
//     };
//     return amounts[plan as keyof typeof amounts] || 0;
//   });

//   // Forms
//   profileForm!: FormGroup;
//   organizationForm!: FormGroup;

//   // Settings tabs configuration
//   tabs = [
//     { id: 'personal' as SettingsTab, label: 'Personal', enabled: true },
//     { id: 'members' as SettingsTab, label: 'Members', enabled: true },
//     { id: 'integrations' as SettingsTab, label: 'Integrations', enabled: false },
//     { id: 'billing' as SettingsTab, label: 'Billing', enabled: true }
//   ];

//   // Dropdown options
//   industryOptions = [
//     { value: '', label: 'Select Industry' },
//     { value: 'technology', label: 'Technology' },
//     { value: 'manufacturing', label: 'Manufacturing' },
//     { value: 'retail', label: 'Retail' },
//     { value: 'healthcare', label: 'Healthcare' },
//     { value: 'finance', label: 'Finance' },
//     { value: 'other', label: 'Other' }
//   ];

//   // Table configurations
//   memberColumns: TableColumn[] = [
//     { key: 'name', label: 'NAME' },
//     { key: 'dateAdded', label: 'DATE ADDED' },
//     { key: 'lastActive', label: 'LAST ACTIVE' },
//     { key: 'role', label: 'ROLE' }
//   ];

//   guestColumns: TableColumn[] = [
//     { key: 'name', label: 'NAME' },
//     { key: 'dateAdded', label: 'DATE ADDED' },
//     { key: 'lastActive', label: 'LAST ACTIVE' },
//     { key: 'role', label: 'ROLE' }
//   ];

//   inviteColumns: TableColumn[] = [
//     { key: 'name', label: 'NAME' },
//     { key: 'dateSent', label: 'DATE SENT' },
//     { key: 'role', label: 'ROLE' }
//   ];

//   // Table actions
//   memberHeaderActions: TableAction[] = [
//     {
//       label: 'Download CSV',
//       icon: this.DownloadIcon,
//       action: () => this.downloadMembersCsv()
//     },
//     {
//       label: 'Invite a new member',
//       icon: this.UserPlusIcon,
//       action: () => this.inviteNewMember()
//     }
//   ];

//   guestHeaderActions: TableAction[] = [
//     {
//       label: 'Download CSV',
//       icon: this.DownloadIcon,
//       action: () => this.downloadGuestsCsv()
//     },
//     {
//       label: 'Invite a new guest',
//       icon: this.UserPlusIcon,
//       action: () => this.inviteNewGuest()
//     }
//   ];

//   memberActions: TableAction[] = [
//     {
//       label: 'Remove',
//       icon: this.Trash2Icon,
//       variant: 'danger',
//       action: (member) => this.removeMember(member)
//     }
//   ];

//   guestActions: TableAction[] = [
//     {
//       label: 'Remove',
//       icon: this.Trash2Icon,
//       variant: 'danger',
//       action: (guest) => this.removeGuest(guest)
//     }
//   ];

//   inviteActions: TableAction[] = [
//     {
//       label: 'Resend invite',
//       action: (invite) => this.resendInvite(invite)
//     },
//     {
//       label: 'Revoke invite',
//       variant: 'danger',
//       action: (invite) => this.revokeInvite(invite)
//     }
//   ];

//   // Team members data (mock for now since we don't have team API yet)
//   teamMembersDisplay = computed(() => {
//     const user = this.currentUser();
//     const orgUser = this.currentOrganizationUser();
    
//     if (!user || !orgUser) return [];

//     // For now, return just the current user as a team member
//     // TODO: Replace with real team API when available
//     return [{
//       id: user.id,
//       name: `${user.firstName} ${user.lastName}`,
//       email: user.email,
//       dateAdded: this.formatDate(new Date(user.createdAt)),
//       lastActive: this.formatDate(user.lastLoginAt ? new Date(user.lastLoginAt) : new Date()),
//       role: 'Owner', // orgUser.role,
//       avatar: user.profilePicture,
//       isOnline: this.isUserOnline(user.lastLoginAt ? new Date(user.lastLoginAt) : undefined)
//     }];
//   });

//   pendingInvitesDisplay = computed(() => {
//     // Mock pending invites - TODO: Replace with real API
//     return [];
//   });

//   guestUsersDisplay = computed(() => {
//     // Mock guest users - TODO: Replace with real API when guest system is implemented
//     return [];
//   });

//   // Mock invoice data for billing
//   mockInvoices = computed(() => [
//     {
//       id: 'inv-001',
//       date: new Date('2024-07-01'),
//       description: 'Premium Plan - July 2024',
//       amount: 99,
//       status: 'paid'
//     },
//     {
//       id: 'inv-002', 
//       date: new Date('2024-06-01'),
//       description: 'Premium Plan - June 2024',
//       amount: 99,
//       status: 'paid'
//     },
//     {
//       id: 'inv-003',
//       date: new Date('2024-05-01'),
//       description: 'Premium Plan - May 2024', 
//       amount: 99,
//       status: 'paid'
//     }
//   ]);

//   ngOnInit() {
//     this.initializeForms();
//     this.loadProfile();
//   }

//   private initializeForms() {
//     this.profileForm = this.fb.group({
//       firstName: ['', [Validators.required]],
//       lastName: ['', [Validators.required]],
//       email: ['', [Validators.required, Validators.email]],
//       phone: ['']
//     });

//     this.organizationForm = this.fb.group({
//       organizationName: ['', [Validators.required]],
//       description: [''],
//       website: [''],
//       phone: ['']
//     });
//   }

//   loadProfile() {
//     // Profile data is already loaded by ProfileManagementService
//     // Just populate forms when data is available
//     const data = this.profileData();
//     if (data) {
//       this.populateForms(data);
//     } else {
//       // Load profile data if not already loaded
//       this.profileService.loadProfileData().subscribe({
//         next: (data) => {
//           this.populateForms(data);
//         },
//         error: (error) => {
//           console.error('Failed to load profile:', error);
//         }
//       });
//     }
//   }

//   private populateForms(data: UserProfileData) {
//     // Populate user form
//     this.profileForm.patchValue({
//       firstName: data.user.firstName,
//       lastName: data.user.lastName,
//       email: data.user.email,
//       phone: data.user.phone || ''
//     });

//     // Populate organization form
//     if (data.organization) {
//       this.organizationForm.patchValue({
//         organizationName: data.organization.name,
//         description: data.organization.description || '',
//         website: data.organization.website || '',
//         phone: data.organization.phone || ''
//       });
//     }
//   }

//   setActiveTab(tab: SettingsTab) {
//     this.activeTab.set(tab);
//   }

//   getTabClasses(tabId: SettingsTab): string {
//     const baseClasses = 'px-4 py-2 text-sm font-medium rounded-md transition-colors';
//     const isActive = this.activeTab() === tabId;
    
//     if (isActive) {
//       return `${baseClasses} bg-neutral-900 text-white`;
//     }
//     return `${baseClasses} text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100`;
//   }

//   saveProfile() {
//     if (this.profileForm.invalid) return;

//     this.isSaving.set(true);
//     const formValue = this.profileForm.value;

//     this.profileService.updateUserInfo(formValue).subscribe({
//       next: () => {
//         this.isSaving.set(false);
//         // Show success message - TODO: Add toast notification
//         console.log('Profile saved successfully');
//       },
//       error: (error) => {
//         this.isSaving.set(false);
//         console.error('Failed to save profile:', error);
//         // TODO: Show error message
//       }
//     });
//   }

//   saveOrganization() {
//     if (this.organizationForm.invalid) return;

//     this.isSaving.set(true);
//     const formValue = this.organizationForm.value;

//     this.profileService.updateOrganizationInfo({
//       name: formValue.organizationName,
//       description: formValue.description,
//       website: formValue.website,
//       phone: formValue.phone
//     }).subscribe({
//       next: () => {
//         this.isSaving.set(false);
//         console.log('Organization saved successfully');
//       },
//       error: (error) => {
//         this.isSaving.set(false);
//         console.error('Failed to save organization:', error);
//       }
//     });
//   }

//   triggerFileUpload() {
//     const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
//     fileInput?.click();
//   }

//   onFileSelected(event: Event) {
//     const target = event.target as HTMLInputElement;
//     const file = target.files?.[0];
    
//     if (file) {
//       if (file.size > 5 * 1024 * 1024) {
//         alert('File size must be less than 5MB');
//         return;
//       }

//       if (!file.type.startsWith('image/')) {
//         alert('Please select an image file');
//         return;
//       }

//       this.isSaving.set(true);
//       this.profileService.uploadProfilePicture(file).subscribe({
//         next: () => {
//           this.isSaving.set(false);
//           console.log('Profile picture uploaded successfully');
//         },
//         error: (error) => {
//           this.isSaving.set(false);
//           console.error('Failed to upload profile picture:', error);
//         }
//       });
//     }
//   }

//   // Helper methods
//   formatDate(date: Date | undefined): string {
//     if (!date) return 'Never';
//     return new Intl.DateTimeFormat('en-US', {
//       month: 'short',
//       day: '2-digit',
//       year: 'numeric'
//     }).format(date);
//   }

//   isUserOnline(lastLogin: Date | undefined): boolean {
//     if (!lastLogin) return false;
//     const now = new Date();
//     const diffMinutes = (now.getTime() - lastLogin.getTime()) / (1000 * 60);
//     return diffMinutes < 30; // Consider online if active within 30 minutes
//   }

//   // Action methods - TODO: Implement when team management API is available
//   downloadMembersCsv() {
//     console.log('Download members CSV - TODO: Implement');
//   }

//   downloadGuestsCsv() {
//     console.log('Download guests CSV - TODO: Implement');
//   }

//   inviteNewMember() {
//     console.log('Invite new member - TODO: Implement');
//     // TODO: Open invite modal
//   }

//   inviteNewGuest() {
//     console.log('Invite new guest - TODO: Implement');
//     // TODO: Open invite modal for guests
//   }

//   removeMember(member: any) {
//     console.log('Remove member:', member);
//     // TODO: Implement with real API
//     if (confirm(`Are you sure you want to remove ${member.name}?`)) {
//       // this.profileService.removeTeamMember(member.id).subscribe(...)
//     }
//   }

//   removeGuest(guest: any) {
//     console.log('Remove guest:', guest);
//     // TODO: Implement with real API
//     if (confirm(`Are you sure you want to remove ${guest.name}?`)) {
//       // this.profileService.removeGuest(guest.id).subscribe(...)
//     }
//   }

//   resendInvite(invite: any) {
//     console.log('Resend invite:', invite);
//     // TODO: Implement with real API
//   }

//   revokeInvite(invite: any) {
//     console.log('Revoke invite:', invite);
//     // TODO: Implement with real API
//   }

//   // Billing action methods - TODO: Implement billing integration
//   upgradePlan() {
//     console.log('Upgrade plan clicked');
//     // TODO: Open upgrade modal or redirect to billing portal
//   }

//   downloadInvoice(invoiceId: string) {
//     console.log('Download invoice:', invoiceId);
//     // TODO: Generate and download invoice PDF
//   }

//   downloadAllInvoices() {
//     console.log('Download all invoices');
//     // TODO: Generate and download ZIP of all invoices
//   }
// }