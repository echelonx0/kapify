// src/app/funder/components/funder-header/funder-header.component.ts
import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { LucideAngularModule, ChevronRight, Home } from 'lucide-angular';
import { filter, map, startWith } from 'rxjs/operators';
import { ProfileManagementService } from 'src/app/shared/services/profile-management.service';
import { VersionService } from 'src/app/shared/services/version.service';
 

interface FunderRouteConfig {
  title: string;
  description: string;
  breadcrumbs: Array<{ label: string; path?: string }>;
}

@Component({
  selector: 'funder-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: 'funder-header.component.html',
})
export class FunderHeaderComponent {
  private router = inject(Router);
  private profileService = inject(ProfileManagementService);
  public versionService = inject(VersionService);
  
  ChevronRightIcon = ChevronRight;
  HomeIcon = Home;

  // Funder-specific route configurations
  private funderRouteConfigs: Record<string, FunderRouteConfig> = {
    '/funder': {
      title: 'Funder Dashboard',
      description: 'Manage your funding opportunities, review applications, and track your investment portfolio.',
      breadcrumbs: [{ label: 'Funder Dashboard' }]
    },
    '/funder/dashboard': {
      title: 'Funder Dashboard',
      description: 'Manage your funding opportunities, review applications, and track your investment portfolio.',
      breadcrumbs: [{ label: 'Funder Dashboard' }]
    },
    '/funder/onboarding': {
      title: 'Organization Onboarding',
      description: 'Complete your organization setup to start creating funding opportunities.',
      breadcrumbs: [
        { label: 'Dashboard', path: '/funder/dashboard' },
        { label: 'Onboarding' }
      ]
    },
    '/funder/onboarding/welcome': {
      title: 'Welcome to Onboarding',
      description: 'Get started with setting up your organization profile and verification.',
      breadcrumbs: [
        { label: 'Dashboard', path: '/funder/dashboard' },
        { label: 'Onboarding', path: '/funder/onboarding' },
        { label: 'Welcome' }
      ]
    },
    '/funder/onboarding/organization-info': {
      title: 'Organization Information',
      description: 'Provide basic information about your organization, including name, type, and contact details.',
      breadcrumbs: [
        { label: 'Dashboard', path: '/funder/dashboard' },
        { label: 'Onboarding', path: '/funder/onboarding' },
        { label: 'Organization Info' }
      ]
    },
    '/funder/onboarding/legal-compliance': {
      title: 'Legal & Compliance',
      description: 'Complete your legal information, registration details, and compliance requirements.',
      breadcrumbs: [
        { label: 'Dashboard', path: '/funder/dashboard' },
        { label: 'Onboarding', path: '/funder/onboarding' },
        { label: 'Legal & Compliance' }
      ]
    },
    '/funder/onboarding/verification': {
      title: 'Verification',
      description: 'Review your information and submit for verification to activate your funder account.',
      breadcrumbs: [
        { label: 'Dashboard', path: '/funder/dashboard' },
        { label: 'Onboarding', path: '/funder/onboarding' },
        { label: 'Verification' }
      ]
    },
    '/funder/create-profile': {
      title: 'Public Profile Management',
      description: 'Create and manage your public funder profile to attract quality applications.',
      breadcrumbs: [
        { label: 'Dashboard', path: '/funder/dashboard' },
        { label: 'Public Profile' }
      ]
    },
    '/funder/opportunities/import': {
      title: 'Import Opportunity',
      description: 'Import funding opportunities from external sources or templates.',
      breadcrumbs: [
        { label: 'Dashboard', path: '/funder/dashboard' },
        { label: 'Opportunities', path: '/funder/opportunities' },
        { label: 'Import' }
      ]
    },
    '/funder/opportunities/create': {
      title: 'Create Opportunity',
      description: 'Create a new funding opportunity to attract applications from SMEs.',
      breadcrumbs: [
        { label: 'Dashboard', path: '/funder/dashboard' },
        { label: 'Opportunities', path: '/funder/opportunities' },
        { label: 'Create' }
      ]
    }
  };

  // Current route URL
  currentRoute = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map((event: NavigationEnd) => event.urlAfterRedirects),
    startWith(this.router.url)
  );

  // User data
  currentUser = this.profileService.currentUser;
  currentOrganization = this.profileService.currentOrganization;
  
  // Computed user information
  userName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'Funder';
    return `${user.firstName} ${user.lastName}`;
  });

  userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) return 'F';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  });

  userAvatar = computed(() => {
    const user = this.currentUser();
    return user?.profilePicture || null;
  });

  userType = computed(() => {
    return 'Funder';
  });

  // Route configuration with dynamic matching
  currentRouteConfig = computed(() => {
    const currentPath = this.router.url.split('?')[0];
    
    // Direct match
    if (this.funderRouteConfigs[currentPath]) {
      return this.funderRouteConfigs[currentPath];
    }
    
    // Dynamic route matching for opportunities and applications
    if (currentPath.includes('/funder/opportunities/') && currentPath.includes('/applications')) {
      return {
        title: 'Application Management',
        description: 'Review and manage applications for your funding opportunity.',
        breadcrumbs: [
          { label: 'Dashboard', path: '/funder/dashboard' },
          { label: 'Opportunities', path: '/funder/opportunities' },
          { label: 'Applications' }
        ]
      };
    }
    
    if (currentPath.match(/\/funder\/opportunities\/[^\/]+$/)) {
      return {
        title: 'Opportunity Details',
        description: 'View and manage your funding opportunity details and settings.',
        breadcrumbs: [
          { label: 'Dashboard', path: '/funder/dashboard' },
          { label: 'Opportunities', path: '/funder/opportunities' },
          { label: 'Details' }
        ]
      };
    }
    
    if (currentPath.match(/\/funder\/applications\/[^\/]+$/)) {
      return {
        title: 'Application Details',
        description: 'Review application details, documents, and make funding decisions.',
        breadcrumbs: [
          { label: 'Dashboard', path: '/funder/dashboard' },
          { label: 'Applications', path: '/funder/applications' },
          { label: 'Details' }
        ]
      };
    }
    
    // Default fallback
    return this.funderRouteConfigs['/funder/dashboard'];
  });

  constructor() {
    if (!this.currentUser()) {
      this.profileService.loadProfileData().subscribe({
        error: (error) => {
          console.error('Failed to load user profile for funder header:', error);
        }
      });
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }
}