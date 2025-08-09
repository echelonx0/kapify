// src/app/shared/components/enhanced-sidebar-nav.component.ts
import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Home, User, FileText, DollarSign, Settings, LogOut, Building, ChevronDown, Bell } from 'lucide-angular';
import { AuthService } from '../../auth/auth.service';
import { ProfileManagementService } from '../services/profile-management.service';

interface NavItem {
  label: string;
  icon: any;
  route: string;
  userTypes: ('sme' | 'funder')[]; 
  badge?: number;
}

@Component({
  selector: 'sidebar-nav',
  standalone: true,
  imports: [RouterModule, LucideAngularModule, CommonModule],
  template: `
    <nav class="fixed left-0 top-0 h-full w-16 hover:w-64 bg-white border-r border-neutral-200 flex flex-col py-4 z-40 transition-all duration-300 ease-in-out group shadow-lg">
      <!-- Logo Section -->
      <div class="flex items-center justify-center group-hover:justify-start group-hover:px-4 mb-8">
        <button 
          (click)="goToDashboard()"
          class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center hover:bg-primary-600 transition-colors flex-shrink-0"
        >
          <span class="text-white font-bold text-lg">K</span>
        </button>
        <span class="ml-3 font-bold text-xl text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Kapify
        </span>
      </div>

      <!-- User Profile Section -->
 

      <!-- Navigation Items -->
      <div class="flex flex-col space-y-1 flex-1 px-2">
        @for (item of visibleNavItems(); track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-primary-50 text-primary-600 border-r-2 border-primary-600"
            [routerLinkActiveOptions]="{exact: item.route === '/dashboard/home'}"
            class="flex items-center px-2 py-2.5 text-sm font-medium rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200 group/item"
            [title]="item.label"
          >
            <div class="flex items-center justify-center w-6 h-6 flex-shrink-0">
              <lucide-icon [img]="item.icon" [size]="20" />
            </div>
            <span class="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              {{ item.label }}
            </span>
            @if (item.badge && item.badge > 0) {
              <span class="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-2 py-1 bg-red-500 text-white text-xs rounded-full min-w-[1.25rem] text-center">
                {{ item.badge > 99 ? '99+' : item.badge }}
              </span>
            }
          </a>
        }
      </div>

      <!-- Quick Actions -->
      <div class="px-2 mb-4">
        <div class="border-t border-neutral-200 pt-4">
          <!-- Notifications -->
          <button
            (click)="toggleNotifications()"
            class="flex items-center w-full px-2 py-2.5 text-sm font-medium rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200 relative"
            title="Notifications"
          >
            <div class="flex items-center justify-center w-6 h-6 flex-shrink-0">
              <lucide-icon [img]="BellIcon" [size]="20" />
              @if (unreadNotifications() > 0) {
                <span class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {{ unreadNotifications() > 9 ? '9+' : unreadNotifications() }}
                </span>
              }
            </div>
            <span class="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Notifications
            </span>
          </button>

          <!-- Settings -->
          <a
            routerLink="/dashboard/settings"
            routerLinkActive="bg-primary-50 text-primary-600"
            class="flex items-center px-2 py-2.5 text-sm font-medium rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200"
            title="Settings"
          >
            <div class="flex items-center justify-center w-6 h-6 flex-shrink-0">
              <lucide-icon [img]="SettingsIcon" [size]="20" />
            </div>
            <span class="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Settings
            </span>
          </a>
        </div>
      </div>

      <!-- Logout Button -->
      <div class="px-2">
        <button
          (click)="logout()"
          class="flex items-center w-full px-2 py-2.5 text-sm font-medium rounded-lg text-neutral-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          title="Logout"
        >
          <div class="flex items-center justify-center w-6 h-6 flex-shrink-0">
            <lucide-icon [img]="LogOutIcon" [size]="20" />
          </div>
          <span class="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Logout
          </span>
        </button>
      </div>

      <!-- Notifications Panel -->
      @if (showNotifications()) {
        <div class="absolute left-16 top-0 w-80 h-full bg-white border-r border-neutral-200 shadow-lg z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div class="p-4 border-b border-neutral-200">
            <h3 class="font-medium text-neutral-900">Notifications</h3>
          </div>
          <div class="p-4">
            <p class="text-sm text-neutral-600 text-center py-8">No new notifications</p>
          </div>
        </div>
      }
    </nav>

    <!-- Main content offset -->
    <div class="ml-16 group-hover:ml-64 transition-all duration-300 ease-in-out">
      <!-- This div ensures content shifts when sidebar expands -->
    </div>
  `
})
export class SidebarNavComponent implements OnInit {
  private authService = inject(AuthService);
  private profileService = inject(ProfileManagementService);
  private router = inject(Router);

  // Icons
  HomeIcon = Home;
  UserIcon = User;
  FileTextIcon = FileText;
  DollarSignIcon = DollarSign;
  BuildingIcon = Building;
  SettingsIcon = Settings;
  LogOutIcon = LogOut;
  BellIcon = Bell;
  ChevronDownIcon = ChevronDown;

  // State
  showNotifications = signal(false);
  isOnline = signal(true);
  unreadNotifications = signal(3); // TODO: Get from notifications service

  // Profile data
  currentUser = computed(() => this.profileService.currentUser());
  userDisplayName = computed(() => this.profileService.userDisplayName());

  // Navigation items with potential badges
  private navItems: NavItem[] = [
    { label: 'Home', icon: Home, route: '/dashboard/home', userTypes: ['sme', 'funder'] },
    { label: 'Profile', icon: User, route: '/dashboard/profile', userTypes: ['sme'] },
    { label: 'Applications', icon: FileText, route: '/applications', userTypes: ['sme'], badge: 2 }, // Example badge
    { label: 'Funding Opportunities', icon: DollarSign, route: '/funding', userTypes: ['sme'] },
    { label: 'Funder Dashboard', icon: Building, route: '/dashboard/funder-dashboard', userTypes: ['funder'] },
  ];

  visibleNavItems = computed(() => {
    const user = this.authService.user();
    const userType = user?.user?.userType || 'sme';
    const mappedUserType = this.mapUserTypeForNavigation(userType);
    
    return this.navItems.filter(item => 
      item.userTypes.includes(mappedUserType)
    );
  });

  ngOnInit() {
    // Load profile data if not already loaded
    if (!this.currentUser()) {
      this.profileService.loadProfileData().subscribe({
        error: (error) => {
          console.error('Failed to load profile data:', error);
        }
      });
    }

    // Set up online status detection
    this.setupOnlineStatusDetection();
  }

  private setupOnlineStatusDetection() {
    this.isOnline.set(navigator.onLine);
    
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
  }

  private mapUserTypeForNavigation(userType: string): 'sme' | 'funder' {
    switch (userType) {
      case 'sme': return 'sme';
      case 'funder': return 'funder';
      case 'admin':
      case 'consultant': return 'funder';
      default: return 'sme';
    }
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  toggleNotifications() {
    this.showNotifications.update(current => !current);
  }

  logout() {
    this.profileService.clearProfileData();
    this.authService.logout();
    this.router.navigate(['/']);
  }

  getUserInitials(): string {
    return this.profileService.getUserInitials();
  }

  getUserTypeDisplayName(): string {
    const user = this.currentUser();
    return user ? this.profileService.getUserTypeDisplayName(user.userType) : '';
  }
}