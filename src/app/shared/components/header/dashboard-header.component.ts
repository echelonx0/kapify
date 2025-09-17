// src/app/shared/components/dashboard-header.component.ts
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { LucideAngularModule, Bell, Settings, Zap } from 'lucide-angular';
import { filter, map, startWith } from 'rxjs/operators';
import { ProfileManagementService } from '../../services/profile-management.service';
import { VersionService } from '../../services/version.service';
 

interface RouteConfig {
  title: string;
  description: string;
  showVersion?: boolean;
}

@Component({
  selector: 'dashboard-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <header class="bg-white border-b border-neutral-200 shadow-sm relative">
      <div class="px-6 py-6">
        <div class="flex items-center justify-between ml-16">
          <!-- Left side - Title and description -->
          <div class="flex-1 pr-8">
            <!-- Title with gradient accent -->
            <div class="flex items-center space-x-3 mb-2">
              <h1 class="text-3xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-700 bg-clip-text text-transparent">
                {{ currentRouteConfig().title }}
              </h1>
              @if (isHighPriorityRoute()) {
                <div class="flex items-center px-2 py-1 bg-gradient-to-r from-primary-100 to-primary-200 border border-primary-300 rounded-full">
                  <lucide-icon [img]="ZapIcon" [size]="14" class="text-primary-600 mr-1" />
                  <span class="text-xs font-semibold text-primary-700">Priority</span>
                </div>
              }
            </div>
            
            <!-- Description with integrated version badge -->
            <div class="flex items-center flex-wrap gap-3">
              <p class="text-neutral-600 leading-relaxed max-w-4xl">
                {{ currentRouteConfig().description }}
              </p>
              
              @if (shouldShowVersion()) {
                <!-- Sleek version badge integrated into description -->
                <div class="group relative inline-flex items-center">
                  <div class="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-neutral-50 to-neutral-100 hover:from-primary-50 hover:to-primary-100 border border-neutral-200 hover:border-primary-200 rounded-full transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md">
                    <!-- Version dot indicator -->
                    <div class="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-green-400 to-green-500 animate-pulse"></div>
                    
                    <!-- Version text -->
                    <span class="text-xs font-medium text-neutral-600 group-hover:text-primary-700 transition-colors">
                      {{ versionService.shortVersion() }}
                    </span>
                    
                    <!-- Environment indicator for non-production -->
                    @if (!versionService.isProduction()) {
                      <div class="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded"
                           [class]="versionService.getEnvironmentBadgeClass()">
                        {{ versionService.environment() }}
                      </div>
                    }
                  </div>
                  
                  <!-- Enhanced hover tooltip -->
                  <div class="absolute left-0 top-full mt-3 px-4 py-3 bg-neutral-900 text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 whitespace-nowrap z-20 shadow-xl">
                    <div class="space-y-1">
                      <div class="font-semibold text-white">FundFlow Platform</div>
                      <div class="text-neutral-200">{{ versionService.detailedVersion() }}</div>
                      @if (versionService.commitHash()) {
                        <div class="text-neutral-400 text-[10px] font-mono">{{ versionService.commitHash() }}</div>
                      }
                      @if (!versionService.isProduction()) {
                        <div class="text-yellow-300 text-[10px] uppercase font-bold tracking-wide">
                          {{ versionService.environment() }} BUILD
                        </div>
                      }
                    </div>
                    <div class="absolute -top-1.5 left-4 w-3 h-3 bg-neutral-900 rotate-45"></div>
                  </div>
                </div>
              }
            </div>
          </div>
       
          <!-- Right side - Actions and user info -->
          <div class="flex items-center space-x-6">
            <!-- Notifications with enhanced styling -->
            <div class="relative">
              <button 
                class="relative p-3 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 group"
                [class.bg-primary-50]="notificationCount() > 0"
                [class.text-primary-600]="notificationCount() > 0"
              >
                <lucide-icon 
                  [img]="BellIcon" 
                  [size]="22" 
                  class="transition-transform duration-200 group-hover:scale-110"
                />
                @if (notificationCount() > 0) {
                  <div class="absolute -top-1 -right-1 min-w-[20px] h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse">
                    {{ notificationCount() > 99 ? '99+' : notificationCount() }}
                  </div>
                }
              </button>
            </div>
            
            <!-- User profile section with card styling -->
            <div class="flex items-center space-x-4 p-2 rounded-xl hover:bg-neutral-50 transition-all duration-200 cursor-pointer group">
              <!-- User info -->
              <div class="text-right">
                <p class="text-sm font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                  {{ userName() }}
                </p>
                <div class="flex items-center space-x-2">
                  <p class="text-xs text-neutral-500">{{ userType() }}</p>
                  @if (currentOrganization()?.isVerified) {
                    <div class="w-2 h-2 bg-green-500 rounded-full" title="Verified"></div>
                  }
                </div>
              </div>
              
              <!-- Avatar with enhanced styling -->
              <div class="relative">
                @if (userAvatar(); as avatar) {
                  <img 
                    [src]="avatar" 
                    [alt]="userName()"
                    class="w-12 h-12 rounded-xl object-cover border-2 border-neutral-200 group-hover:border-primary-300 shadow-sm transition-all duration-200"
                  />
                } @else {
                  <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                    <span class="text-white font-bold text-base">{{ userInitials() }}</span>
                  </div>
                }
                
                <!-- Enhanced online status -->
                <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm">
                  <div class="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress indicator for incomplete profiles -->
        @if (showProgressBar()) {
          <div class="mt-4 ml-16">
            <div class="max-w-4xl">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-neutral-700">Profile Completion</span>
                <span class="text-sm text-neutral-600">{{ profileCompletion() }}%</span>
              </div>
              <div class="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000 ease-out"
                  [style.width.%]="profileCompletion()"
                ></div>
              </div>
            </div>
          </div>
        }
      </div>
    </header>
  `,
})
export class DashboardHeaderComponent {
  private router = inject(Router);
  private profileService = inject(ProfileManagementService);
  public versionService = inject(VersionService);
  
  BellIcon = Bell;
  SettingsIcon = Settings;
  ZapIcon = Zap;
  
  // Navigation state
  isNavigating = false;

  // Route configurations - enhanced with version display control
  private routeConfigs: Record<string, RouteConfig & { priority?: boolean }> = {
    '/dashboard': {
      title: 'Welcome back, {{name}}!',
      description: 'Track your applications, explore new opportunities, and manage your business profile.',
      showVersion: true // Show version on main dashboard
    },
    '/administrator': {
      title: 'Admin Console',
      description: 'Manage users, system settings, and monitor platform performance.',
      priority: true,
      showVersion: true
    },
    '/administrator/dashboard': {
      title: 'Admin Dashboard',
      description: 'Overview of system metrics, user activity, and key performance indicators.',
      priority: true,
      showVersion: true
    },
    '/profile': {
      title: 'Your Profile',
      description: 'Manage your personal information, business details, and account preferences. Keep your profile updated to improve your funding opportunities.',
      showVersion: false
    },
    '/applications': {
      title: 'Your Applications',
      description: 'Track the status of your funding applications, view feedback, and submit new applications to grow your business.',
      priority: true,
      showVersion: false
    },
    '/opportunities': {
      title: 'Funding Opportunities',
      description: 'Discover funding opportunities tailored to your business. Filter by amount, type, and requirements to find the perfect match.',
      priority: true,
      showVersion: false
    },
    '/documents': {
      title: 'Document Center',
      description: 'Upload, organize, and manage all your business documents. Having complete documentation speeds up the application process.',
      showVersion: false
    },
    '/settings': {
      title: 'Account Settings',
      description: 'Configure your account preferences, notification settings, and security options.',
      showVersion: false
    },
    '/analytics': {
      title: 'Business Analytics',
      description: 'View insights about your business performance, funding progress, and market opportunities.',
      showVersion: false
    },
    '/team': {
      title: 'Team Management',
      description: 'Manage your team members, assign roles, and control access to your business information.',
      showVersion: false
    }
  };

  // Current route URL
  currentRoute = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map((event: NavigationEnd) => event.urlAfterRedirects),
    startWith(this.router.url)
  );

  // User data from profile service
  currentUser = this.profileService.currentUser;
  currentProfile = this.profileService.currentProfile;
  currentOrganization = this.profileService.currentOrganization;
  
  // Computed user information
  userName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'User';
    return `${user.firstName} ${user.lastName}`;
  });

  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  });

  userAvatar = computed(() => {
    const user = this.currentUser();
    return user?.profilePicture || null;
  });

  userType = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    
    const typeMap: Record<string, string> = {
      'sme': 'SME Owner',
      'funder': 'Investor',
      'admin': 'Administrator',
      'consultant': 'Consultant'
    };
    
    return typeMap[user.userType] || user.userType;
  });

  // Enhanced route configuration with version control
  currentRouteConfig = computed(() => {
    const currentPath = this.router.url.split('?')[0];
    const config = this.routeConfigs[currentPath] || this.routeConfigs['/dashboard'];
    
    const userName = this.userName();
    const title = config.title.replace('{{name}}', userName);
    
    return {
      title,
      description: config.description,
      priority: config.priority || false,
      showVersion: config.showVersion || false
    };
  });

  // Check if current route is high priority
  isHighPriorityRoute = computed(() => {
    return this.currentRouteConfig().priority;
  });

  // Check if version should be displayed on current route
  shouldShowVersion = computed(() => {
    return this.currentRouteConfig().showVersion;
  });

  // Profile completion logic
  profileCompletion = computed(() => {
    const profile = this.currentProfile();
    return profile?.completionPercentage || 0;
  });

  showProgressBar = computed(() => {
    const completion = this.profileCompletion();
    return completion > 0 && completion < 100;
  });

  // Enhanced notification count with placeholder logic
  notificationCount = computed(() => {
    // TODO: Replace with actual notification service
    const user = this.currentUser();
    if (!user) return 0;
    
    // Placeholder: Show notifications for incomplete profiles
    const completion = this.profileCompletion();
    if (completion < 100) return 1;
    
    return 0;
  });

  constructor() {
    if (!this.currentUser()) {
      this.profileService.loadProfileData().subscribe({
        error: (error) => {
          console.error('Failed to load user profile for header:', error);
        }
      });
    }
  }

  isAdminUser = computed(() => {
    const user = this.currentUser();
    return user?.email === 'zivaigwe@gmail.com';
  });

  async goToAdmin() {
    if (this.isNavigating) return;
    
    this.isNavigating = true;
    
    try {
      await this.router.navigate(['/administrator/dashboard']);
    } catch (error) {
      console.error('Navigation to admin console failed:', error);
    } finally {
      this.isNavigating = false;
    }
  }
}