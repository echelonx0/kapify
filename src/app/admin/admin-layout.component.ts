
// src/app/admin/admin-layout.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../auth/production.auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  children?: NavItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex">
      <!-- Sidebar -->
      <div class="bg-gray-900 text-white w-64 flex-shrink-0">
        <!-- Header -->
        <div class="p-6 border-b border-gray-700">
          <h1 class="text-xl font-bold">Kapify Admin</h1>
          <p class="text-sm text-gray-400">System Management</p>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-6 space-y-1">
          <div *ngFor="let item of navItems" class="space-y-1">
            <div 
              *ngIf="!item.children"
              [routerLink]="item.path"
              routerLinkActive="bg-gray-800 text-white"
              [routerLinkActiveOptions]="{exact: false}"
              class="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
            >
              <i [class]="item.icon" class="mr-3 h-5 w-5"></i>
              {{ item.label }}
            </div>
            
            <!-- Parent with children -->
            <div *ngIf="item.children" class="space-y-1">
              <button
                (click)="toggleSection(item.path)"
                class="group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <i [class]="item.icon" class="mr-3 h-5 w-5"></i>
                <span class="flex-1 text-left">{{ item.label }}</span>
                <i 
                  [class]="isExpanded(item.path) ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"
                  class="ml-2 h-3 w-3"
                ></i>
              </button>
              
              <!-- Children -->
              <div *ngIf="isExpanded(item.path)" class="ml-6 space-y-1">
                <div
                  *ngFor="let child of item.children"
                  [routerLink]="child.path"
                  routerLinkActive="bg-gray-800 text-white"
                  class="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-400 hover:bg-gray-700 hover:text-white cursor-pointer"
                >
                  <i [class]="child.icon" class="mr-3 h-4 w-4"></i>
                  {{ child.label }}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <!-- User info -->
        <div class="p-4 border-t border-gray-700">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                <span class="text-sm font-medium">{{ getUserInitials() }}</span>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-white">{{ getCurrentUser()?.email }}</p>
              <p class="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
          <button
            (click)="signOut()"
            class="mt-3 w-full bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>

      <!-- Main content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top bar -->
        <header class="bg-white shadow-sm border-b border-gray-200">
          <div class="px-6 py-4">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900">{{ currentPageTitle() }}</h2>
              <div class="flex items-center space-x-4">
                <span class="text-sm text-gray-500">{{ getCurrentDate() }}</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: []
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // State
  expandedSections = signal<Set<string>>(new Set());
  currentPageTitle = signal('Dashboard');

  navItems: NavItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: 'fas fa-tachometer-alt'
    },
    {
      path: 'users',
      label: 'User Management',
      icon: 'fas fa-users',
      children: [
        { path: '/administrator/users', label: 'All Users', icon: 'fas fa-list' }
      ]
    },
    {
      path: 'organizations',
      label: 'Organizations',
      icon: 'fas fa-building',
      children: [
        { path: '/administrator/organizations', label: 'All Organizations', icon: 'fas fa-list' }
      ]
    },
    {
      path: 'opportunities',
      label: 'Opportunities',
      icon: 'fas fa-dollar-sign',
      children: [
        { path: '/administrator/opportunities', label: 'All Opportunities', icon: 'fas fa-list' },
        { path: '/administrator/opportunities/create', label: 'Create New', icon: 'fas fa-plus' }
      ]
    },
    {
      path: '/administrator/applications',
      label: 'Applications',
      icon: 'fas fa-file-alt'
    },
    {
      path: 'system',
      label: 'System',
      icon: 'fas fa-cog',
      children: [
        { path: '/administrator/system/activity', label: 'Activity Logs', icon: 'fas fa-history' },
        { path: '/administrator/system/reports', label: 'Reports', icon: 'fas fa-chart-bar' },
        { path: '/administrator/system/maintenance', label: 'Maintenance', icon: 'fas fa-tools' }
      ]
    },
    {
      path: '/administrator/settings',
      label: 'Settings',
      icon: 'fas fa-sliders-h'
    }
  ];

  constructor() {
    // Track current page for title
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updatePageTitle(event.urlAfterRedirects);
      });
  }

  toggleSection(path: string) {
    const expanded = this.expandedSections();
    if (expanded.has(path)) {
      expanded.delete(path);
    } else {
      expanded.add(path);
    }
    this.expandedSections.set(new Set(expanded));
  }

  isExpanded(path: string): boolean {
    return this.expandedSections().has(path);
  }

  getCurrentUser() {
    return this.authService.user();
  }

  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (!user) return 'A';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'A';
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  signOut() {
    this.authService.signOut();
  }

  private updatePageTitle(url: string) {
    const titleMap: Record<string, string> = {
      '/admin/dashboard': 'Dashboard',
      '/admin/users': 'User Management',
      '/admin/organizations': 'Organization Management',
      '/admin/opportunities': 'Opportunity Management',
      '/admin/opportunities/create': 'Create Opportunity',
      '/admin/applications': 'Application Management',
      '/admin/system/activity': 'Activity Logs',
      '/admin/system/reports': 'System Reports',
      '/admin/system/maintenance': 'System Maintenance',
      '/admin/settings': 'Settings'
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
