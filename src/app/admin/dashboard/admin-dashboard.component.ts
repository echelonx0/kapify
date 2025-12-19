// src/app/admin/admin-dashboard.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AdminService,
  AdminStats,
  AdminUser,
  AdminOrganization,
  AdminOpportunity,
} from '../services/admin.service';
import { AuthService } from '../../auth/production.auth.service';
import { UiButtonComponent, UiCardComponent } from '../../shared/components';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/ui/shared-ui-components';
import { OrganizationVerificationComponent } from '../organization-verification/organization-verification.component';

type TabType =
  | 'overview'
  | 'users'
  | 'organizations'
  | 'opportunities'
  | 'verification';
interface FilterState {
  users: {
    status: string;
    userType: string;
    search: string;
  };
  organizations: {
    status: string;
    type: string;
    search: string;
  };
  opportunities: {
    status: string;
    type: string;
    search: string;
  };
}

@Component({
  selector: 'admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UiButtonComponent,
    UiCardComponent,
    DropdownComponent,
    OrganizationVerificationComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // State signals
  activeTab = signal<TabType>('overview');
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Data signals
  stats = signal<AdminStats | null>(null);
  users = signal<AdminUser[]>([]);
  organizations = signal<AdminOrganization[]>([]);
  opportunities = signal<AdminOpportunity[]>([]);
  recentActivity = signal<any[]>([]);

  // Modal state
  selectedUser = signal<AdminUser | null>(null);
  selectedOrganization = signal<AdminOrganization | null>(null);
  selectedOpportunity = signal<AdminOpportunity | null>(null);

  // Enhanced filter state - keep as regular object for two-way binding
  filters: FilterState = {
    users: { status: '', userType: '', search: '' },
    organizations: { status: '', type: '', search: '' },
    opportunities: { status: '', type: '', search: '' },
  };

  // Trigger signal for reactivity
  filterUpdate = signal(0);

  // Enhanced computed filtered data with manual trigger
  filteredUsers = computed(() => {
    this.filterUpdate(); // Trigger dependency
    const currentFilters = this.filters.users;
    return this.users().filter((user) => {
      // Search filter - check name, email, and phone
      const searchTerm = currentFilters.search.toLowerCase().trim();
      const matchesSearch =
        !searchTerm ||
        `${user.firstName || ''} ${user.lastName || ''} ${user.email || ''} ${
          user.phone || ''
        }`
          .toLowerCase()
          .includes(searchTerm);

      // Status filter
      const matchesStatus =
        !currentFilters.status || user.status === currentFilters.status;

      // Type filter
      const matchesType =
        !currentFilters.userType || user.userType === currentFilters.userType;

      return matchesSearch && matchesStatus && matchesType;
    });
  });

  filteredOrganizations = computed(() => {
    this.filterUpdate(); // Trigger dependency
    const currentFilters = this.filters.organizations;
    return this.organizations().filter((org) => {
      // Search filter - check name, city, and country
      const searchTerm = currentFilters.search.toLowerCase().trim();
      const matchesSearch =
        !searchTerm ||
        `${org.name || ''} ${org.city || ''} ${org.country || ''}`
          .toLowerCase()
          .includes(searchTerm);

      // Status filter
      const matchesStatus =
        !currentFilters.status || org.status === currentFilters.status;

      // Type filter
      const matchesType =
        !currentFilters.type || org.organizationType === currentFilters.type;

      return matchesSearch && matchesStatus && matchesType;
    });
  });

  filteredOpportunities = computed(() => {
    this.filterUpdate(); // Trigger dependency
    const currentFilters = this.filters.opportunities;
    return this.opportunities().filter((opp) => {
      // Search filter - check title and organization name
      const searchTerm = currentFilters.search.toLowerCase().trim();
      const matchesSearch =
        !searchTerm ||
        `${opp.title || ''} ${opp.organizationName || ''}`
          .toLowerCase()
          .includes(searchTerm);

      // Status filter
      const matchesStatus =
        !currentFilters.status || opp.status === currentFilters.status;

      // Type filter
      const matchesType =
        !currentFilters.type || opp.fundingType === currentFilters.type;

      return matchesSearch && matchesStatus && matchesType;
    });
  });

  // Enhanced navigation tabs with dynamic counts
  tabs = computed(() => [
    { id: 'overview' as TabType, label: 'Overview', count: undefined },
    {
      id: 'users' as TabType,
      label: 'Users',
      count: this.filteredUsers().length,
    },
    {
      id: 'organizations' as TabType,
      label: 'Organizations',
      count: this.filteredOrganizations().length,
    },
    {
      id: 'opportunities' as TabType,
      label: 'Opportunities',
      count: this.filteredOpportunities().length,
    },
    { id: 'verification' as TabType, label: 'Verification', count: undefined }, // NEW
  ]);

  ngOnInit() {
    // Check admin access (uncomment when ready)
    // const currentUser = this.authService.user();
    // if (!currentUser || currentUser.userType !== 'admin') {
    //   this.router.navigate(['/dashboard']);
    //   return;
    // }

    this.loadInitialData();
  }

  // ===============================
  // DATA LOADING
  // ===============================

  loadInitialData() {
    this.isLoading.set(true);
    this.error.set(null);

    Promise.all([
      this.adminService.getStats().toPromise(),
      this.adminService.getAllUsers().toPromise(),
      this.adminService.getAllOrganizations().toPromise(),
      this.adminService.getAllOpportunities().toPromise(),
      this.adminService.getRecentActivity().toPromise(),
    ])
      .then(([stats, users, organizations, opportunities, activity]) => {
        this.stats.set(stats!);
        this.users.set(users!);
        this.organizations.set(organizations!);
        this.opportunities.set(opportunities!);
        this.recentActivity.set(activity!);
        this.isLoading.set(false);
      })
      .catch((error) => {
        console.error('Failed to load admin data:', error);
        this.error.set(
          'Failed to load admin data. Please refresh and try again.'
        );
        this.isLoading.set(false);
      });
  }

  // ===============================
  // NAVIGATION & UI ENHANCEMENTS
  // ===============================

  navigateToBackOfficeQuestions() {
    this.router.navigate(['/admin/back-office-questions']);
  }
  // And add this helper to get admin management links
  getAdminManagementLinks() {
    return [
      {
        icon: 'settings',
        label: 'Constants',
        description: 'Manage dropdown options and system constants',
        route: '/admin/constants',
      },
      {
        icon: 'dollar',
        label: 'Credit Costs',
        description: 'Configure credit pricing and costs',
        route: '/admin/credit-costs',
      },
      {
        icon: 'form',
        label: 'Back Office Questions',
        description: 'Manage business assessment form questions',
        route: '/admin/back-office-questions',
      },
    ];
  }
  setActiveTab(tab: TabType) {
    this.activeTab.set(tab);
  }

  getEnhancedTabClasses(tabId: TabType): string {
    const isActive = this.activeTab() === tabId;
    return `inline-flex items-center px-6 py-3 mx-1 text-sm font-semibold rounded-xl transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
        : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100/80'
    }`;
  }

  getTabCountClasses(tabId: TabType): string {
    const isActive = this.activeTab() === tabId;
    return `ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
      isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
    }`;
  }

  getCurrentUser() {
    return this.authService.user();
  }

  signOut() {
    this.authService.signOut();
  }

  // ===============================
  // ENHANCED FILTERING METHODS
  // ===============================

  onFilterChange() {
    // Trigger reactivity for computed properties
    this.filterUpdate.update((v) => v + 1);
  }

  // User filter methods
  updateUserStatusFilter(status: string) {
    this.filters.users.status = status;
    this.onFilterChange();
  }

  updateUserTypeFilter(userType: string) {
    this.filters.users.userType = userType;
    this.onFilterChange();
  }

  resetUserFilters() {
    this.filters.users = { status: '', userType: '', search: '' };
    this.onFilterChange();
  }

  // Organization filter methods
  updateOrgStatusFilter(status: string) {
    this.filters.organizations.status = status;
    this.onFilterChange();
  }

  updateOrgTypeFilter(type: string) {
    this.filters.organizations.type = type;
    this.onFilterChange();
  }

  resetOrganizationFilters() {
    this.filters.organizations = { status: '', type: '', search: '' };
    this.onFilterChange();
  }

  // Opportunity filter methods
  updateOpportunityStatusFilter(status: string) {
    this.filters.opportunities.status = status;
    this.onFilterChange();
  }

  updateOpportunityTypeFilter(type: string) {
    this.filters.opportunities.type = type;
    this.onFilterChange();
  }

  resetOpportunityFilters() {
    this.filters.opportunities = { status: '', type: '', search: '' };
    this.onFilterChange();
  }

  // Legacy method for backward compatibility
  resetFilters() {
    this.filters = {
      users: { status: '', userType: '', search: '' },
      organizations: { status: '', type: '', search: '' },
      opportunities: { status: '', type: '', search: '' },
    };
    this.onFilterChange();
  }

  // ===============================
  // DROPDOWN OPTIONS
  // ===============================

  getUserStatusOptions(): DropdownOption[] {
    return [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'suspended', label: 'Suspended' },
    ];
  }

  getUserTypeOptions(): DropdownOption[] {
    return [
      { value: '', label: 'All Types' },
      { value: 'sme', label: 'SME' },
      { value: 'funder', label: 'Funder' },
      { value: 'consultant', label: 'Consultant' },
      { value: 'admin', label: 'Admin' },
    ];
  }

  getOrganizationStatusOptions(): DropdownOption[] {
    return [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'pending_verification', label: 'Pending Verification' },
      { value: 'verified', label: 'Verified' },
      { value: 'suspended', label: 'Suspended' },
    ];
  }

  getOrganizationTypeOptions(): DropdownOption[] {
    return [
      { value: '', label: 'All Types' },
      { value: 'sme', label: 'SME' },
      { value: 'investment_fund', label: 'Investment Fund' },
      { value: 'bank', label: 'Bank' },
      { value: 'government', label: 'Government' },
      { value: 'ngo', label: 'NGO' },
    ];
  }

  getOpportunityStatusOptions(): DropdownOption[] {
    return [
      { value: '', label: 'All Status' },
      { value: 'draft', label: 'Draft' },
      { value: 'active', label: 'Active' },
      { value: 'paused', label: 'Paused' },
      { value: 'closed', label: 'Closed' },
    ];
  }

  getOpportunityTypeOptions(): DropdownOption[] {
    return [
      { value: '', label: 'All Types' },
      { value: 'loan', label: 'Loan' },
      { value: 'grant', label: 'Grant' },
      { value: 'equity', label: 'Equity' },
      { value: 'invoice_financing', label: 'Invoice Financing' },
    ];
  }

  // ===============================
  // USER MANAGEMENT
  // ===============================

  viewUser(user: AdminUser) {
    this.selectedUser.set(user);
  }

  toggleUserStatus(user: AdminUser) {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';

    this.adminService.updateUserStatus(user.id, newStatus).subscribe({
      next: (updatedUser) => {
        // Update local state
        this.users.update((users) =>
          users.map((u) => (u.id === user.id ? updatedUser : u))
        );
        if (this.selectedUser()?.id === user.id) {
          this.selectedUser.set(updatedUser);
        }

        // Show success message (you can add a toast service here)
        console.log(
          `User ${user.firstName} ${user.lastName} ${
            newStatus === 'active' ? 'activated' : 'suspended'
          } successfully`
        );
      },
      error: (error) => {
        console.error('Failed to update user status:', error);
        this.error.set('Failed to update user status. Please try again.');
      },
    });
  }

  resetUserPassword(user: AdminUser) {
    if (
      confirm(
        `Reset password for ${user.firstName} ${user.lastName}? They will need to use the temporary password to log in.`
      )
    ) {
      this.adminService.resetUserPassword(user.id).subscribe({
        next: (response) => {
          alert(
            `Password reset successfully. Temporary password: ${response.temporaryPassword}\n\nPlease share this securely with the user.`
          );
        },
        error: (error) => {
          console.error('Failed to reset password:', error);
          this.error.set('Failed to reset password. Please try again.');
        },
      });
    }
  }

  // ===============================
  // ORGANIZATION MANAGEMENT
  // ===============================

  viewOrganization(org: AdminOrganization) {
    this.selectedOrganization.set(org);
  }

  verifyOrganization(org: AdminOrganization) {
    if (
      confirm(
        `Verify ${org.name}? This will mark the organization as verified and enable full platform access.`
      )
    ) {
      this.adminService.verifyOrganization(org.id).subscribe({
        next: (updatedOrg) => {
          this.organizations.update((orgs) =>
            orgs.map((o) => (o.id === org.id ? updatedOrg : o))
          );
          console.log(`${org.name} verified successfully`);
        },
        error: (error) => {
          console.error('Failed to verify organization:', error);
          this.error.set('Failed to verify organization. Please try again.');
        },
      });
    }
  }

  toggleOrganizationStatus(org: AdminOrganization) {
    const newStatus = org.status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'suspend';

    if (confirm(`Are you sure you want to ${action} ${org.name}?`)) {
      this.adminService.updateOrganizationStatus(org.id, newStatus).subscribe({
        next: (updatedOrg) => {
          this.organizations.update((orgs) =>
            orgs.map((o) => (o.id === org.id ? updatedOrg : o))
          );
          console.log(`${org.name} ${action}d successfully`);
        },
        error: (error) => {
          console.error('Failed to update organization status:', error);
          this.error.set(
            'Failed to update organization status. Please try again.'
          );
        },
      });
    }
  }

  // ===============================
  // OPPORTUNITY MANAGEMENT
  // ===============================

  createOpportunity() {
    this.router.navigate(['/admin/opportunities/create']);
  }

  viewOpportunity(opportunity: AdminOpportunity) {
    this.selectedOpportunity.set(opportunity);
  }

  toggleOpportunityStatus(opportunity: AdminOpportunity) {
    const newStatus = opportunity.status === 'active' ? 'paused' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'pause';

    if (
      confirm(
        `${action.charAt(0).toUpperCase() + action.slice(1)} "${
          opportunity.title
        }"?`
      )
    ) {
      this.adminService
        .updateOpportunityStatus(opportunity.id, newStatus)
        .subscribe({
          next: (updatedOpp) => {
            this.opportunities.update((opps) =>
              opps.map((o) => (o.id === opportunity.id ? updatedOpp : o))
            );
            console.log(`"${opportunity.title}" ${action}d successfully`);
          },
          error: (error) => {
            console.error('Failed to update opportunity status:', error);
            this.error.set(
              'Failed to update opportunity status. Please try again.'
            );
          },
        });
    }
  }

  deleteOpportunity(opportunity: AdminOpportunity) {
    if (
      confirm(
        `Delete "${
          opportunity.title
        }"? This action cannot be undone and will affect ${
          opportunity.applicationsCount || 0
        } applications.`
      )
    ) {
      this.adminService.deleteOpportunity(opportunity.id).subscribe({
        next: () => {
          this.opportunities.update((opps) =>
            opps.filter((o) => o.id !== opportunity.id)
          );
          console.log(`"${opportunity.title}" deleted successfully`);
        },
        error: (error) => {
          console.error('Failed to delete opportunity:', error);
          this.error.set('Failed to delete opportunity. Please try again.');
        },
      });
    }
  }

  // ===============================
  // MODAL MANAGEMENT
  // ===============================

  closeModal() {
    this.selectedUser.set(null);
    this.selectedOrganization.set(null);
    this.selectedOpportunity.set(null);
  }

  // ===============================
  // ENHANCED UTILITY METHODS
  // ===============================

  getUserInitials(user: AdminUser): string {
    const first = user.firstName?.charAt(0)?.toUpperCase() || '';
    const last = user.lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  }

  getEnhancedStatusBadge(status: string): string {
    const badges = {
      active:
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 shadow-sm',
      inactive:
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-700 shadow-sm',
      suspended:
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-red-200 text-red-800 shadow-sm',
      pending_verification:
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-warning/20 to-warning/30 text-warning shadow-sm',
      verified:
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm',
      draft:
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-600 shadow-sm',
      paused:
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-warning/20 to-warning/30 text-warning shadow-sm',
      closed:
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-neutral-200 to-neutral-300 text-neutral-700 shadow-sm',
    };
    return badges[status as keyof typeof badges] || badges['inactive'];
  }

  getEnhancedActivityIcon(type: string): string {
    const baseClasses =
      'w-10 h-10 rounded-xl flex items-center justify-center shadow-sm';
    const icons = {
      user: `${baseClasses} bg-gradient-to-r from-blue-400 to-blue-600`,
      organization: `${baseClasses} bg-gradient-to-r from-primary-400 to-primary-600`,
      opportunity: `${baseClasses} bg-gradient-to-r from-yellow-400 to-orange-500`,
      application: `${baseClasses} bg-gradient-to-r from-purple-400 to-purple-600`,
      system: `${baseClasses} bg-gradient-to-r from-neutral-400 to-neutral-600`,
    };
    return icons[type as keyof typeof icons] || icons['system'];
  }

  // Legacy method for backward compatibility
  getStatusBadgeClass(status: string): string {
    return this.getEnhancedStatusBadge(status);
  }

  // Legacy method for backward compatibility
  getActivityIcon(type: string): string {
    return this.getEnhancedActivityIcon(type);
  }

  formatTime(date: Date | string): string {
    if (!date) return 'Unknown';

    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;

    return d.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  formatDate(date: Date | string): string {
    if (!date) return 'Unknown';

    return new Date(date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  formatCurrency(amount: number | undefined): string {
    if (!amount && amount !== 0) return 'N/A';

    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // ===============================
  // COMPUTED STATS HELPERS
  // ===============================

  getActiveOpportunitiesCount(): number {
    return this.opportunities().filter((opp) => opp.status === 'active').length;
  }

  getPendingVerificationCount(): number {
    return this.organizations().filter(
      (org) => org.status === 'pending_verification'
    ).length;
  }

  getTotalApplicationsCount(): number {
    return this.opportunities().reduce(
      (total, opp) => total + (opp.applicationsCount || 0),
      0
    );
  }

  // ===============================
  // SEARCH AND SORTING HELPERS
  // ===============================

  sortUsersByName(users: AdminUser[]): AdminUser[] {
    return [...users].sort((a, b) => {
      const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
      const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim();
      return nameA.localeCompare(nameB);
    });
  }

  sortOrganizationsByName(orgs: AdminOrganization[]): AdminOrganization[] {
    return [...orgs].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  sortOpportunitiesByDate(
    opportunities: AdminOpportunity[]
  ): AdminOpportunity[] {
    return [...opportunities].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Most recent first
    });
  }

  // ===============================
  // ACCESSIBILITY AND UX HELPERS
  // ===============================

  getAriaLabel(
    item: any,
    type: 'user' | 'organization' | 'opportunity'
  ): string {
    switch (type) {
      case 'user':
        return `User ${item.firstName} ${item.lastName}, ${item.status}, ${item.userType}`;
      case 'organization':
        return `Organization ${item.name}, ${item.status}, ${item.organizationType}`;
      case 'opportunity':
        return `Opportunity ${item.title}, ${item.status}, ${item.fundingType}`;
      default:
        return 'Item';
    }
  }

  getFocusClass(): string {
    return 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';
  }

  // ===============================
  // DATA EXPORT HELPERS (Future Enhancement)
  // ===============================

  exportUsersToCSV() {
    const users = this.filteredUsers();
    const csvContent = this.convertToCSV(users, [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'userType', label: 'User Type' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created Date' },
    ]);
    this.downloadCSV(csvContent, 'users-export.csv');
  }

  private convertToCSV(
    data: any[],
    columns: { key: string; label: string }[]
  ): string {
    const header = columns.map((col) => col.label).join(',');
    const rows = data.map((item) =>
      columns
        .map((col) => {
          const value = item[col.key];
          if (col.key.includes('Date') || col.key.includes('At')) {
            return this.formatDate(value);
          }
          return `"${value || ''}"`;
        })
        .join(',')
    );
    return [header, ...rows].join('\n');
  }

  private downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
