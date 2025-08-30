// src/app/dashboard/dashboard-layout.component.ts
import { Component, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarNavComponent } from '../shared/components/sidebar-nav.component';
import { DashboardHeaderComponent } from '../shared/components/dashboard-header.component';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarNavComponent, DashboardHeaderComponent, CommonModule],
  template: `
    <div class="min-h-screen bg-neutral-50 flex">
      <!-- Sidebar - always visible -->
      <sidebar-nav />
      
      <!-- Main Content Area -->
      <div [class]="contentClass()">
        <!-- Conditionally show header -->
        @if (shouldShowHeader()) {
          <div class="sticky top-0 z-10 bg-neutral-50 border-b border-gray-200">
            <dashboard-header />
          </div>
        }
        
        <!-- Page Content -->
        <main [class]="mainClass()">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private currentUrl = signal('');

  constructor(private router: Router) {}

  ngOnInit() {
    // Set initial URL
    this.currentUrl.set(this.router.url);

    // Subscribe to router events
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentUrl.set(event.url);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isHeaderDisabledRoute = computed(() => {
    const url = this.currentUrl();
    // Check for welcome route - it can be /dashboard/welcome or end with /welcome
    return url.includes('/welcome') || url === '/dashboard/welcome';
  });

  shouldShowHeader = computed(() => {
    return !this.isHeaderDisabledRoute();
  });

  contentClass = computed(() => {
    return 'flex-1 flex flex-col';
  });

  mainClass = computed(() => {
    // For welcome route, make it take full height without scrolling
    return this.isHeaderDisabledRoute() 
      ? 'flex-1 overflow-hidden h-screen' 
      : 'flex-1 overflow-y-auto';
  });
}