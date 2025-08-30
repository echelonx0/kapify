// src/app/admin/enhanced-admin-dashboard.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  LucideAngularModule, 
  Users, 
  Building, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Activity, 
  Mail, 
  UserPlus, 
  Send, 
  Settings, 
  Download,
  Filter,
  Search,
  Plus,
  Eye,
  MoreVertical,
  Bell,
  RefreshCw,
  BarChart3,
  PieChart,
  Calendar,
  MessageSquare
} from 'lucide-angular';
import { AdminService, AdminStats, AdminUser, AdminOrganization, AdminOpportunity } from '../services/admin.service';
import { AuthService } from '../../auth/production.auth.service';
import { UiButtonComponent, UiCardComponent } from '../../shared/components';
import { DropdownComponent, DropdownOption } from '../../shared/components/ui/shared-ui-components';

type TabType = 'overview' | 'users' | 'organizations' | 'opportunities' | 'analytics';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  variant: 'primary' | 'secondary' | 'outline';
  action: () => void;
}

interface FilterState {
  users: { status: string; userType: string; search: string; };
  organizations: { status: string; type: string; search: string; };
  opportunities: { status: string; type: string; search: string; };
}

@Component({
  selector: 'enhanced-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    LucideAngularModule,
    UiButtonComponent, 
    UiCardComponent, 
    DropdownComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30">
      <!-- Enhanced Header -->
      <div class="bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
        <div class="px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <div class="flex items-center space-x-4">
              <div class="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                <lucide-icon [name]="'settings'" [size]="20" class="text-white"></lucide-icon>
              </div>
              <div>
                <h1 class="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Kapify Admin
                </h1>
                <p class="text-xs text-slate-500 font-medium">Platform Management Console</p>
              </div>
            </div>
            
            <!-- Header Actions -->
            <div class="flex items-center space-x-3">
              <!-- Notifications -->
              <button class="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <lucide-icon [name]="'bell'" [size]="20" class="text-slate-600"></lucide-icon>
                <span class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              
              <!-- Quick Actions Dropdown -->
              <div class="relative">
                <button 
                  (click)="toggleQuickActions()"
                  class="flex items-center space-x-2 px-3 py-2 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  <lucide-icon [name]="'plus'" [size]="16" class="text-primary-600"></lucide-icon>
                  <span class="text-sm font-medium text-primary-700">Quick Actions</span>
                </button>
                
                <!-- Quick Actions Menu -->
                <div 
                  *ngIf="showQuickActions()"
                  class="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 z-50 animate-fade-in"
                >
                  <div class="p-2">
                    <button 
                      *ngFor="let action of quickActions" 
                      (click)="action.action()"
                      class="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                    >
                      <lucide-icon [name]="action.icon" [size]="16" class="text-slate-600"></lucide-icon>
                      <span class="text-sm font-medium text-slate-700">{{ action.label }}</span>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- User Menu -->
              <div class="flex items-center space-x-3 pl-3 border-l border-slate-200">
                <div class="text-right hidden sm:block">
                  <p class="text-sm font-semibold text-slate-800">{{ getCurrentUser()?.firstName }}</p>
                  <p class="text-xs text-slate-500">Super Admin</p>
                </div>
                <button 
                  (click)="signOut()"
                  class="w-8 h-8 bg-gradient-to-r from-slate-400 to-slate-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm hover:shadow-md transition-all"
                >
                  {{ getUserInitials() }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Navigation Tabs -->
      <div class="bg-white/80 backdrop-blur-sm border-b border-slate-200/50">
        <div class="px-6 lg:px-8">
          <nav class="flex space-x-1 py-3">
            <button
              *ngFor="let tab of enhancedTabs(); trackBy: trackByTab"
              (click)="setActiveTab(tab.id)"
              [class]="getEnhancedTabClasses(tab.id)"
            >
              <lucide-icon [name]="tab.icon" [size]="16" class="mr-2"></lucide-icon>
              <span class="font-semibold">{{ tab.label }}</span>
              <span 
                *ngIf="tab.count !== undefined"
                [class]="getTabCountClasses(tab.id)"
              >
                {{ tab.count }}
              </span>
              <span 
                *ngIf="tab.trend"
                [class]="getTrendClasses(tab.trend)"
              >
                {{ tab.trend > 0 ? '+' : '' }}{{ tab.trend }}%
              </span>
            </button>
          </nav>
        </div>
      </div>

      <!-- Main Content Container -->
      <div class="px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <!-- Enhanced Loading State -->
        <div *ngIf="isLoading()" class="flex items-center justify-center py-20">
          <div class="text-center">
            <div class="relative w-16 h-16 mx-auto mb-4">
              <div class="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
              <div class="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p class="text-slate-600 font-semibold">Loading admin dashboard...</p>
            <p class="text-slate-400 text-sm mt-2">Fetching latest platform data</p>
          </div>
        </div>

        <!-- Enhanced Error State -->
        <div *ngIf="error()" class="mb-8">
          <div class="bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 rounded-2xl p-6 shadow-sm">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-4">
                <lucide-icon [name]="'activity'" [size]="16" class="text-white"></lucide-icon>
              </div>
              <div>
                <h3 class="text-red-800 font-bold text-lg">System Error</h3>
                <p class="text-red-700 mt-1">{{ error() }}</p>
                <button 
                  (click)="loadInitialData()"
                  class="mt-3 text-sm text-red-600 hover:text-red-700 font-semibold flex items-center"
                >
                  <lucide-icon [name]="'refresh-cw'" [size]="14" class="mr-1"></lucide-icon>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Overview Tab - Premium Stats Cards -->
        <div *ngIf="activeTab() === 'overview' && !isLoading()">
          <!-- Key Metrics Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Total Users Card -->
            <div class="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div class="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div class="relative">
                <div class="flex items-center justify-between mb-4">
                  <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <lucide-icon [name]="'users'" [size]="24" class="text-white"></lucide-icon>
                  </div>
                  <div class="text-blue-200 text-sm font-semibold">+12%</div>
                </div>
                <div>
                  <p class="text-blue-100 text-sm font-medium uppercase tracking-wide">Total Users</p>
                  <p class="text-3xl font-bold mt-1">{{ stats()?.totalUsers || 0 | number }}</p>
                  <p class="text-blue-200 text-xs mt-2">{{ getActiveUsersCount() }} active this month</p>
                </div>
              </div>
            </div>

            <!-- Organizations Card -->
            <div class="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div class="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div class="relative">
                <div class="flex items-center justify-between mb-4">
                  <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <lucide-icon [name]="'building'" [size]="24" class="text-white"></lucide-icon>
                  </div>
                  <div class="text-emerald-200 text-sm font-semibold">+8%</div>
                </div>
                <div>
                  <p class="text-emerald-100 text-sm font-medium uppercase tracking-wide">Organizations</p>
                  <p class="text-3xl font-bold mt-1">{{ stats()?.totalOrganizations || 0 | number }}</p>
                  <p class="text-emerald-200 text-xs mt-2">{{ getPendingVerificationCount() }} pending verification</p>
                </div>
              </div>
            </div>

            <!-- Opportunities Card -->
            <div class="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div class="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div class="relative">
                <div class="flex items-center justify-between mb-4">
                  <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <lucide-icon [name]="'dollar-sign'" [size]="24" class="text-white"></lucide-icon>
                  </div>
                  <div class="text-orange-200 text-sm font-semibold">+15%</div>
                </div>
                <div>
                  <p class="text-orange-100 text-sm font-medium uppercase tracking-wide">Opportunities</p>
                  <p class="text-3xl font-bold mt-1">{{ stats()?.totalOpportunities || 0 | number }}</p>
                  <p class="text-orange-200 text-xs mt-2">{{ getActiveOpportunitiesCount() }} currently active</p>
                </div>
              </div>
            </div>

            <!-- Applications Card -->
            <div class="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div class="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div class="relative">
                <div class="flex items-center justify-between mb-4">
                  <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <lucide-icon [name]="'file-text'" [size]="24" class="text-white"></lucide-icon>
                  </div>
                  <div class="text-purple-200 text-sm font-semibold">+22%</div>
                </div>
                <div>
                  <p class="text-purple-100 text-sm font-medium uppercase tracking-wide">Applications</p>
                  <p class="text-3xl font-bold mt-1">{{ getTotalApplicationsCount() || 0 | number }}</p>
                  <p class="text-purple-200 text-xs mt-2">{{ stats()?.activeApplications || 0 }} pending review</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Charts & Activity Row -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <!-- Recent Activity -->
            <div class="lg:col-span-2">
              <div class="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg">
                <div class="p-6 border-b border-slate-200/50">
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-xl font-bold text-slate-900">Platform Activity</h3>
                      <p class="text-slate-600 text-sm">Recent system events and user actions</p>
                    </div>
                    <button class="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <lucide-icon [name]="'more-vertical'" [size]="16" class="text-slate-600"></lucide-icon>
                    </button>
                  </div>
                </div>
                <div class="p-6">
                  <div class="space-y-4">
                    <div *ngFor="let activity of recentActivity().slice(0, 6); let i = index" 
                         class="flex items-center p-4 rounded-xl hover:bg-slate-50/50 transition-colors"
                         [class.bg-slate-25]="i < 2">
                      <div [class]="getActivityIconClasses(activity.type)">
                        <lucide-icon [name]="getActivityIconName(activity.type)" [size]="16" class="text-white"></lucide-icon>
                      </div>
                      <div class="ml-4 flex-1">
                        <p class="text-sm font-semibold text-slate-900">{{ activity.message }}</p>
                        <div class="flex items-center mt-1 space-x-3">
                          <p class="text-xs text-slate-500">{{ formatTime(activity.createdAt) }}</p>
                          <span *ngIf="activity.user" class="text-xs text-slate-400">by {{ activity.user }}</span>
                        </div>
                      </div>
                      <div class="w-2 h-2 bg-primary-400 rounded-full" *ngIf="i < 2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- System Stats -->
            <div class="space-y-6">
              <!-- Quick Stats -->
              <div class="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-6">
                <h3 class="text-lg font-bold text-slate-900 mb-4">System Health</h3>
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-600">Platform Uptime</span>
                    <span class="text-sm font-semibold text-green-600">99.9%</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-600">Active Sessions</span>
                    <span class="text-sm font-semibold text-slate-900">2,847</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-600">Response Time</span>
                    <span class="text-sm font-semibold text-slate-900">125ms</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-600">Error Rate</span>
                    <span class="text-sm font-semibold text-green-600">0.02%</span>
                  </div>
                </div>
              </div>

              <!-- Alerts -->
              <div class="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50 p-6">
                <div class="flex items-center mb-3">
                  <lucide-icon [name]="'bell'" [size]="16" class="text-amber-600 mr-2"></lucide-icon>
                  <h3 class="text-sm font-bold text-amber-800">System Alerts</h3>
                </div>
                <div class="space-y-2">
                  <div class="text-xs text-amber-700">
                    <span class="font-semibold">12 organizations</span> pending verification
                  </div>
                  <div class="text-xs text-amber-700">
                    <span class="font-semibold">3 funding opportunities</span> expiring soon
                  </div>
                  <div class="text-xs text-amber-700">
                    <span class="font-semibold">Database backup</span> completed successfully
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Users Tab - Enhanced Design -->
        <div *ngIf="activeTab() === 'users' && !isLoading()">
          <!-- Enhanced Filters with Actions -->
          <div class="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg p-6 mb-8">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-xl font-bold text-slate-900">User Management</h2>
                <p class="text-slate-600 text-sm">Manage platform users and their access</p>
              </div>
              <div class="flex items-center space-x-3">
                <ui-button variant="outline" size="sm" (clicked)="exportUsers()">
                  <lucide-icon [name]="'download'" [size]="16" class="mr-2"></lucide-icon>
                  Export
                </ui-button>
                <ui-button variant="primary" (clicked)="inviteUser()">
                  <lucide-icon [name]="'user-plus'" [size]="16" class="mr-2"></lucide-icon>
                  Invite User
                </ui-button>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Search Users</label>
                <div class="relative">
                  <input
                    type="text"
                    [(ngModel)]="filters.users.search"
                    (input)="onFilterChange()"
                    placeholder="Search by name or email..."
                    class="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/80 backdrop-blur-sm transition-all"
                  />
                  <lucide-icon [name]="'search'" [size]="16" class="absolute left-3 top-3.5 text-slate-400"></lucide-icon>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <ui-dropdown
                  [options]="getUserStatusOptions()"
                  [selectedValue]="filters.users.status"
                  placeholder="All Status"
                  (selectionChange)="updateUserStatusFilter($event)"
                />
              </div>
              
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-2">User Type</label>
                <ui-dropdown
                  [options]="getUserTypeOptions()"
                  [selectedValue]="filters.users.userType"
                  placeholder="All Types"
                  (selectionChange)="updateUserTypeFilter($event)"
                />
              </div>
              
              <div class="flex items-end">
                <ui-button
                  variant="outline"
                  [fullWidth]="true"
                  (clicked)="resetUserFilters()"
                >
                  <lucide-icon [name]="'filter'" [size]="16" class="mr-2"></lucide-icon>
                  Reset
                </ui-button>
              </div>
            </div>
          </div>

          <!-- Enhanced Users Table -->
          <div class="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/50 shadow-lg overflow-hidden">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-gradient-to-r from-slate-50 to-slate-100/50">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Joined</th>
                    <th class="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Activity</th>
                    <th class="relative px-6 py-4"><span class="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody class="bg-white/50 backdrop-blur-sm divide-y divide-slate-100">
                  <tr *ngFor="let user of filteredUsers(); trackBy: trackByUserId" 
                      class="group hover:bg-gradient-to-r hover:from-primary-25 hover:to-transparent transition-all duration-200">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-sm">
                          <span class="text-sm font-bold text-white">{{ getUserInitials(user) }}</span>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-semibold text-slate-900">{{ user.firstName }} {{ user.lastName }}</div>
                          <div class="text-sm text-slate-500">{{ user.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span [class]="getStatusBadgeClasses(user.status)">
                        {{ user.status | titlecase }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {{ user.userType | titlecase }}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {{ formatDate(user.createdAt) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {{ formatTime(user.lastLoginAt || user.createdAt) }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                      <div class="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ui-button variant="ghost" size="sm" (clicked)="viewUser(user)">
                          <lucide-icon [name]="'eye'" [size]="14" class="mr-1"></lucide-icon>
                          View
                        </ui-button>
                        <ui-button 
                          [variant]="user.status === 'active' ? 'outline' : 'secondary'"
                          size="sm"
                          (clicked)="toggleUserStatus(user)"
                        >
                          {{ user.status === 'active' ? 'Suspend' : 'Activate' }}
                        </ui-button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Organizations Tab content and Opportunities Tab content would follow similar enhanced patterns -->
        <!-- ... (continuing with other tab content) ... -->

      </div>

      <!-- Enhanced Modals would go here -->
      <!-- ... (modal content) ... -->

    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-fade-in {
      animation: fade-in 0.3s ease-out both;
    }
    
    .bg-slate-25 {
      background-color: rgb(248 250 252 / 0.5);
    }
    
    .hover\:shadow-2xl:hover {
      box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
    }
  `]
})
export class KapifyAdminDashboard implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // State
  activeTab = signal<TabType>('overview');
  isLoading = signal(false);
  error = signal<string | null>(null);
  showQuickActions = signal(false);
  
  // Data
  stats = signal<AdminStats | null>(null);
  users = signal<AdminUser[]>([]);
  organizations = signal<AdminOrganization[]>([]);
  opportunities = signal<AdminOpportunity[]>([]);
  recentActivity = signal<any[]>([]);
  
  // Modals
  selectedUser = signal<AdminUser | null>(null);

  // Enhanced filter state
  filters: FilterState = {
    users: { status: '', userType: '', search: '' },
    organizations: { status: '', type: '', search: '' },
    opportunities: { status: '', type: '', search: '' }
  };

  filterUpdate = signal(0);

  // Quick Actions
  quickActions: QuickAction[] = [
    {
      id: 'invite-user',
      label: 'Invite New User',
      icon: 'user-plus',
      variant: 'primary',
      action: () => this.inviteUser()
    },
    {
      id: 'send-broadcast',
      label: 'Send Broadcast',
      icon: 'send',
      variant: 'secondary',
      action: () => this.sendBroadcast()
    },
    {
      id: 'export-data',
      label: 'Export Platform Data',
      icon: 'download',
      variant: 'outline',
      action: () => this.exportPlatformData()
    },
    {
      id: 'system-settings',
      label: 'System Settings',
      icon: 'settings',
      variant: 'outline',
      action: () => this.openSystemSettings()
    }
  ];

  // Enhanced tabs with icons and trends
  enhancedTabs = computed(() => [
    { 
      id: 'overview' as TabType, 
      label: 'Overview', 
      icon: 'bar-chart-3',
      count: undefined,
      trend: undefined
    },
    { 
      id: 'users' as TabType, 
      label: 'Users', 
      icon: 'users',
      count: this.filteredUsers().length,
      trend: 12
    },
    { 
      id: 'organizations' as TabType, 
      label: 'Organizations', 
      icon: 'building',
      count: this.filteredOrganizations().length,
      trend: 8
    },
    { 
      id: 'opportunities' as TabType, 
      label: 'Opportunities', 
      icon: 'dollar-sign',
      count: this.filteredOpportunities().length,
      trend: 15
    },
    { 
      id: 'analytics' as TabType, 
      label: 'Analytics', 
      icon: 'pie-chart',
      count: undefined,
      trend: undefined
    }
  ]);

  // Computed filtered data
  filteredUsers = computed(() => {
    this.filterUpdate();
    const currentFilters = this.filters.users;
    return this.users().filter(user => {
      const searchTerm = currentFilters.search.toLowerCase().trim();
      const matchesSearch = !searchTerm || 
        `${user.firstName || ''} ${user.lastName || ''} ${user.email || ''}`
          .toLowerCase().includes(searchTerm);
      
      const matchesStatus = !currentFilters.status || user.status === currentFilters.status;
      const matchesType = !currentFilters.userType || user.userType === currentFilters.userType;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  });

  filteredOrganizations = computed(() => {
    this.filterUpdate();
    const currentFilters = this.filters.organizations;
    return this.organizations().filter(org => {
      const searchTerm = currentFilters.search.toLowerCase().trim();
      const matchesSearch = !searchTerm || 
        `${org.name || ''} ${org.city || ''} ${org.country || ''}`
          .toLowerCase().includes(searchTerm);
      
      const matchesStatus = !currentFilters.status || org.status === currentFilters.status;
      const matchesType = !currentFilters.type || org.organizationType === currentFilters.type;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  });

  filteredOpportunities = computed(() => {
    this.filterUpdate();
    const currentFilters = this.filters.opportunities;
    return this.opportunities().filter(opp => {
      const searchTerm = currentFilters.search.toLowerCase().trim();
      const matchesSearch = !searchTerm || 
        `${opp.title || ''} ${opp.organizationName || ''}`
          .toLowerCase().includes(searchTerm);
      
      const matchesStatus = !currentFilters.status || opp.status === currentFilters.status;
      const matchesType = !currentFilters.type || opp.fundingType === currentFilters.type;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  });

  ngOnInit() {
    this.loadInitialData();
    
    // Close quick actions when clicking outside
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        this.showQuickActions.set(false);
      }
    });
  }

  loadInitialData() {
    this.isLoading.set(true);
    this.error.set(null);

    Promise.all([
      this.adminService.getStats().toPromise(),
      this.adminService.getAllUsers().toPromise(),
      this.adminService.getAllOrganizations().toPromise(),
      this.adminService.getAllOpportunities().toPromise(),
      this.adminService.getRecentActivity().toPromise()
    ]).then(([stats, users, organizations, opportunities, activity]) => {
      this.stats.set(stats!);
      this.users.set(users!);
      this.organizations.set(organizations!);
      this.opportunities.set(opportunities!);
      this.recentActivity.set(activity!);
      this.isLoading.set(false);
    }).catch(error => {
      console.error('Failed to load admin data:', error);
      this.error.set('Failed to load admin data. Please refresh and try again.');
      this.isLoading.set(false);
    });
  }

  // Enhanced UI Methods
  setActiveTab(tab: TabType) {
    this.activeTab.set(tab);
  }

  toggleQuickActions() {
    this.showQuickActions.update(show => !show);
  }

  getEnhancedTabClasses(tabId: TabType): string {
    const isActive = this.activeTab() === tabId;
    return `group relative flex items-center px-6 py-3 mx-1 text-sm font-semibold rounded-xl transition-all duration-300 ${
      isActive
        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
        : 'text-slate-600 hover:text-slate-800 hover:bg-white/60 hover:shadow-sm'
    }`;
  }

  getTabCountClasses(tabId: TabType): string {
    const isActive = this.activeTab() === tabId;
    return `ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors ${
      isActive
        ? 'bg-white/20 text-white'
        : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'
    }`;
  }

  getTrendClasses(trend: number): string {
    const isPositive = trend > 0;
    return `ml-2 text-xs font-semibold ${
      isPositive ? 'text-green-600' : 'text-red-600'
    }`;
  }

  // Activity helpers
  getActivityIconClasses(type: string): string {
    const baseClasses = 'w-10 h-10 rounded-xl flex items-center justify-center shadow-sm';
    const typeClasses = {
      'user': 'bg-gradient-to-r from-blue-500 to-blue-600',
      'organization': 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      'opportunity': 'bg-gradient-to-r from-amber-500 to-orange-500',
      'application': 'bg-gradient-to-r from-purple-500 to-purple-600',
      'system': 'bg-gradient-to-r from-slate-500 to-slate-600'
    };
    return `${baseClasses} ${typeClasses[type as keyof typeof typeClasses] || typeClasses.system}`;
  }

  getActivityIconName(type: string): string {
    const iconMap = {
      'user': 'users',
      'organization': 'building',
      'opportunity': 'dollar-sign',
      'application': 'file-text',
      'system': 'settings'
    };
    return iconMap[type as keyof typeof iconMap] || 'activity';
  }

  getStatusBadgeClasses(status: string): string {
    const badges = {
      'active': 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-sm',
      'inactive': 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 shadow-sm',
      'suspended': 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-red-200 text-red-800 shadow-sm',
      'pending': 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 shadow-sm'
    };
    return badges[status as keyof typeof badges] || badges.inactive;
  }

  // Filter methods
  onFilterChange() {
    this.filterUpdate.update(v => v + 1);
  }

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

  // Quick Action methods
  inviteUser() {
    this.showQuickActions.set(false);
    console.log('Opening invite user modal...');
    // Implement invite user functionality
  }

  sendBroadcast() {
    this.showQuickActions.set(false);
    console.log('Opening broadcast modal...');
    // Implement broadcast functionality
  }

  exportPlatformData() {
    this.showQuickActions.set(false);
    console.log('Exporting platform data...');
    // Implement export functionality
  }

  exportUsers() {
    console.log('Exporting users...');
    // Implement user export
  }

  openSystemSettings() {
    this.showQuickActions.set(false);
    this.router.navigate(['/admin/settings']);
  }

  // User management
  viewUser(user: AdminUser) {
    this.selectedUser.set(user);
  }

  toggleUserStatus(user: AdminUser) {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    this.adminService.updateUserStatus(user.id, newStatus).subscribe({
      next: (updatedUser) => {
        this.users.update(users => 
          users.map(u => u.id === user.id ? updatedUser : u)
        );
        console.log(`User ${user.firstName} ${user.lastName} ${newStatus}`);
      },
      error: (error) => {
        console.error('Failed to update user status:', error);
        this.error.set('Failed to update user status. Please try again.');
      }
    });
  }

  // Dropdown options
  getUserStatusOptions(): DropdownOption[] {
    return [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'suspended', label: 'Suspended' }
    ];
  }

  getUserTypeOptions(): DropdownOption[] {
    return [
      { value: '', label: 'All Types' },
      { value: 'sme', label: 'SME' },
      { value: 'funder', label: 'Funder' },
      { value: 'consultant', label: 'Consultant' },
      { value: 'admin', label: 'Admin' }
    ];
  }

  // Utility methods
  getCurrentUser() {
    return this.authService.user();
  }

  getUserInitials(user?: AdminUser): string {
    if (!user) {
      const currentUser = this.getCurrentUser();
      const first = currentUser?.firstName?.charAt(0)?.toUpperCase() || '';
      const last = currentUser?.lastName?.charAt(0)?.toUpperCase() || '';
      return first + last || 'A';
    }
    
    const first = user.firstName?.charAt(0)?.toUpperCase() || '';
    const last = user.lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  }

  signOut() {
    this.authService.signOut();
  }

  formatTime(date: Date | string): string {
    if (!date) return 'Never';
    
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
    
    return d.toLocaleDateString('en-ZA', { 
      day: 'numeric', 
      month: 'short'
    });
  }

  formatDate(date: Date | string): string {
    if (!date) return 'Unknown';
    
    return new Date(date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  // Stats computed methods
  getActiveUsersCount(): number {
    return this.users().filter(user => user.status === 'active').length;
  }

  getActiveOpportunitiesCount(): number {
    return this.opportunities().filter(opp => opp.status === 'active').length;
  }

  getPendingVerificationCount(): number {
    return this.organizations().filter(org => org.status === 'pending_verification').length;
  }

  getTotalApplicationsCount(): number {
    return this.opportunities().reduce((total, opp) => total + (opp.applicationsCount || 0), 0);
  }

  // TrackBy functions for performance
  trackByUserId(index: number, user: AdminUser): string {
    return user.id;
  }

  trackByTab(index: number, tab: any): string {
    return tab.id;
  }
}