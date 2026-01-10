// src/app/admin/admin-layout.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/production.auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

interface MainAppRoute {
  path: string;
  label: string;
  description: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: 'admin-layout.component.html',
  styles: [],
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // State
  currentPageTitle = signal('Dashboard');

  navItems: NavItem[] = [
    {
      path: 'dashboard',
      label: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
    },
    {
      path: 'verification',
      label: 'Organization Verification',
      icon: 'fas fa-check-circle',
    },
    {
      path: 'constants',
      label: 'Manage Settings',
      icon: 'fas fa-check-circle',
    },
    {
      path: 'credit-costs',
      label: 'Manage Costs',
      icon: 'fas fa-check-circle',
    },
    {
      path: 'back-office-questions',
      label: 'Manage Back Office',
      icon: 'fas fa-check-circle',
    },
    {
      path: 'fund-financial-terms',
      label: 'Manage Funding Terms',
      icon: 'fas fa-check-circle',
    },
    {
      path: 'compliance',
      label: 'Compliance Manager',
      icon: 'fas fa-shield-alt',
    },
    {
      path: 'ai-management',
      label: 'AI Management',
      icon: 'fas fa-brain',
    },
    {
      path: 'reports',
      label: 'Reports',
      icon: 'fas fa-chart-bar',
    },
    {
      path: 'guides',
      label: 'Guides Manager',
      icon: 'fas fa-chart-bar',
    },
    {
      path: 'faqs',
      label: 'FAQs Manager',
      icon: 'fas fa-chart-bar',
    },
    {
      path: 'support',
      label: 'Support Tickets',
      icon: 'fas fa-headset',
    },
  ];

  // Main app routes for quick navigation
  mainAppRoutes: MainAppRoute[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      description: 'Go to main dashboard',
    },
    {
      path: '/profile',
      label: 'Profile',
      description: 'Manage your profile',
    },
    {
      path: '/applications',
      label: 'Applications',
      description: 'View your applications',
    },
    {
      path: '/opportunities',
      label: 'Opportunities',
      description: 'Browse funding opportunities',
    },
    {
      path: '/funder/dashboard',
      label: 'Funder',
      description: 'Switch to funder dashboard',
    },
  ];

  constructor() {
    // Track current page for title
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updatePageTitle(event.urlAfterRedirects);
      });
  }

  getCurrentUser() {
    return this.authService.user();
  }

  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (!user) return 'A';
    return (
      `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
      'A'
    );
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  signOut() {
    this.authService.signOut();
  }

  navigateToMainApp(path: string) {
    this.router.navigate([path]);
  }

  private updatePageTitle(url: string) {
    const titleMap: Record<string, string> = {
      '/admin/dashboard': 'Dashboard',
      '/admin/verification': 'Organization Verification',
      '/admin/support': 'Support Tickets',
    };

    // Find matching title
    let title = 'Admin Dashboard';
    for (const [path, pathTitle] of Object.entries(titleMap)) {
      if (url.includes(path)) {
        title = pathTitle;
        break;
      }
    }

    this.currentPageTitle.set(title);
  }
}
