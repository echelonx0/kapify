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
  templateUrl: 'dashboard-header.component.html',
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
      description:
        'Track your applications, explore new opportunities, and manage your business profile.',
      showVersion: true, // Show version on main dashboard
    },
    '/administrator': {
      title: 'Admin Console',
      description:
        'Manage users, system settings, and monitor platform performance.',
      priority: true,
      showVersion: true,
    },
    '/administrator/dashboard': {
      title: 'Admin Dashboard',
      description:
        'Overview of system metrics, user activity, and key performance indicators.',
      priority: true,
      showVersion: true,
    },
    '/profile': {
      title: 'Your Profile',
      description:
        'Manage your personal information, business details, and account preferences. Keep your profile updated to improve your funding opportunities.',
      showVersion: false,
    },
    '/applications': {
      title: 'Your Applications',
      description:
        'Track the status of your funding applications, view feedback, and submit new applications to grow your business.',
      priority: true,
      showVersion: false,
    },
    '/opportunities': {
      title: 'Funding Opportunities',
      description:
        'Discover funding opportunities tailored to your business. Filter by amount, type, and requirements to find the perfect match.',
      priority: true,
      showVersion: false,
    },
    '/documents': {
      title: 'Document Center',
      description:
        'Upload, organize, and manage all your business documents. Having complete documentation speeds up the application process.',
      showVersion: false,
    },
    '/settings': {
      title: 'Account Settings',
      description:
        'Configure your account preferences, notification settings, and security options.',
      showVersion: false,
    },
    '/analytics': {
      title: 'Business Analytics',
      description:
        'View insights about your business performance, funding progress, and market opportunities.',
      showVersion: false,
    },
    '/team': {
      title: 'Team Management',
      description:
        'Manage your team members, assign roles, and control access to your business information.',
      showVersion: false,
    },
  };

  // Current route URL
  currentRoute = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
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
    return `${user.firstName?.[0] || ''}${
      user.lastName?.[0] || ''
    }`.toUpperCase();
  });

  userAvatar = computed(() => {
    const user = this.currentUser();
    return user?.profilePicture || null;
  });

  userType = computed(() => {
    const user = this.currentUser();
    if (!user) return '';

    const typeMap: Record<string, string> = {
      sme: 'SME Owner',
      funder: 'Investor',
      admin: 'Administrator',
      consultant: 'Consultant',
    };

    return typeMap[user.userType] || user.userType;
  });

  // Enhanced route configuration with version control
  currentRouteConfig = computed(() => {
    const currentPath = this.router.url.split('?')[0];
    const config =
      this.routeConfigs[currentPath] || this.routeConfigs['/dashboard'];

    const userName = this.userName();
    const title = config.title.replace('{{name}}', userName);

    return {
      title,
      description: config.description,
      priority: config.priority || false,
      showVersion: config.showVersion || false,
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
        },
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

  version() {
    this.router.navigate(['/version-info']);
  }
}
