
// // src/app/shared/components/dashboard-header.component.ts
// import { Component } from '@angular/core';
// import { LucideAngularModule, Bell } from 'lucide-angular';

// @Component({
//   selector: 'dashboard-header',
//   standalone: true,
//   imports: [LucideAngularModule],
//   template: `
//     <header class="bg-white border-b border-neutral-200 px-6 py-4">
//       <div class="flex items-center justify-between">
//         <div>
//           <h1 class="text-2xl font-bold text-neutral-900">Welcome Senkosi</h1>
//           <p class="text-sm text-neutral-600 mt-1">
//             Complete your application process to access tools and funding that will help manage and grow your business effectively. 
//             Your progress is being saved automatically to provide you a seamless experience. Get investor ready today!
//           </p>
//         </div>
//         <div class="flex items-center space-x-3">
//           <button class="relative p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg">
//             <lucide-icon [img]="BellIcon" [size]="20" />
//             <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
//           </button>
//           <div class="w-8 h-8 bg-neutral-300 rounded-full"></div>
//         </div>
//       </div>
//     </header>
//   `,
// })
// export class DashboardHeaderComponent {
//   BellIcon = Bell;
// }


// src/app/shared/components/dashboard-header.component.ts
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { LucideAngularModule, Bell } from 'lucide-angular';
import { filter, map, startWith } from 'rxjs/operators';
import { ProfileManagementService } from '../services/profile-management.service';

interface RouteConfig {
  title: string;
  description: string;
}

@Component({
  selector: 'dashboard-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <header class="bg-white border-b border-neutral-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-neutral-900">
            {{ currentRouteConfig().title }}
          </h1>
          <p class="text-sm text-neutral-600 mt-1 max-w-3xl">
            {{ currentRouteConfig().description }}
          </p>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Notifications -->
          <button class="relative p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors">
            <lucide-icon [img]="BellIcon" [size]="20" />
            <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <!-- User Avatar & Name -->
          <div class="flex items-center space-x-3">
            <div class="text-right">
              <p class="text-sm font-medium text-neutral-900">{{ userName() }}</p>
              <p class="text-xs text-neutral-500">{{ userType() }}</p>
            </div>
            
            <!-- Avatar -->
            <div class="relative">
              @if (userAvatar(); as avatar) {
                <img 
                  [src]="avatar" 
                  [alt]="userName()"
                  class="w-10 h-10 rounded-full object-cover border-2 border-neutral-200"
                />
              } @else {
                <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  <span class="text-white font-semibold text-sm">{{ userInitials() }}</span>
                </div>
              }
              
              <!-- Online status indicator -->
              <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
})
export class DashboardHeaderComponent {
  private router = inject(Router);
  private profileService = inject(ProfileManagementService);
  
  BellIcon = Bell;

  // Route configurations
  private routeConfigs: Record<string, RouteConfig> = {
    '/dashboard': {
      title: 'Welcome back, {{name}}!',
      description: 'Here\'s an overview of your funding journey. Track your applications, explore new opportunities, and manage your business profile.'
    },
    '/profile': {
      title: 'Your Profile',
      description: 'Manage your personal information, business details, and account preferences. Keep your profile updated to improve your funding opportunities.'
    },
    '/applications': {
      title: 'Your Applications',
      description: 'Track the status of your funding applications, view feedback, and submit new applications to grow your business.'
    },
    '/opportunities': {
      title: 'Funding Opportunities',
      description: 'Discover funding opportunities tailored to your business. Filter by amount, type, and requirements to find the perfect match.'
    },
    '/documents': {
      title: 'Document Center',
      description: 'Upload, organize, and manage all your business documents. Having complete documentation speeds up the application process.'
    },
    '/settings': {
      title: 'Account Settings',
      description: 'Configure your account preferences, notification settings, and security options.'
    },
    '/analytics': {
      title: 'Business Analytics',
      description: 'View insights about your business performance, funding progress, and market opportunities.'
    },
    '/team': {
      title: 'Team Management',
      description: 'Manage your team members, assign roles, and control access to your business information.'
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

  // Current route configuration
  currentRouteConfig = computed(() => {
    const currentPath = this.router.url.split('?')[0]; // Remove query params
    const config = this.routeConfigs[currentPath] || this.routeConfigs['/dashboard'];
    
    // Replace {{name}} placeholder with actual user name
    const userName = this.userName();
    const title = config.title.replace('{{name}}', userName);
    
    return {
      title,
      description: config.description
    };
  });

  // Notification count (placeholder for future implementation)
  notificationCount = computed(() => 0);

  constructor() {
    // Load profile data if not already loaded
    if (!this.currentUser()) {
      this.profileService.loadProfileData().subscribe({
        error: (error) => {
          console.error('Failed to load user profile for header:', error);
        }
      });
    }
  }
}