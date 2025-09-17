// src/app/admin/admin-layout.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../auth/production.auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex">
      <!-- Sidebar -->
      <div class="bg-slate-900 text-white w-64 flex-shrink-0">
        <!-- Header -->
        <div class="p-6 border-b border-gray-700">
          <h1 class="text-xl font-bold">Kapify Admin</h1>
          <p class="text-sm text-gray-400">System Management</p>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-6 space-y-1">
          <div *ngFor="let item of navItems" class="space-y-1">
            <div 
              [routerLink]="item.path"
              routerLinkActive="bg-gray-800 text-white"
              [routerLinkActiveOptions]="{exact: false}"
              class="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white cursor-pointer"
            >
              <i [class]="item.icon" class="mr-3 h-5 w-5"></i>
              {{ item.label }}
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
  currentPageTitle = signal('Dashboard');

  navItems: NavItem[] = [
    {
      path: 'dashboard',
      label: 'Dashboard',
      icon: 'fas fa-tachometer-alt'
    },
    {
      path: 'verification',
      label: 'Organization Verification',
      icon: 'fas fa-check-circle'
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
      '/admin/verification': 'Organization Verification'
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