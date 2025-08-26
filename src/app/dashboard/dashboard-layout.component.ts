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
        <!-- Sticky Header -->
        <div class="sticky top-0 z-10 bg-neutral-50 border-b border-gray-200">
          <dashboard-header />
        </div>
        
        <!-- Page Content   -->
        <main class="flex-1 overflow-y-auto">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  // styles: [`
  //   :host {
  //     display: block;
  //     height: 100vh;
  //     overflow: hidden;
  //   }
  // `]
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private currentUrl = signal('');
  
  // Option to conditionally show/hide header (currently disabled)
  private showHeaderConditionally = false;

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

  isHomeRoute = computed(() => {
    const url = this.currentUrl();
    return url === '/dashboard/home' || url === '/dashboard';
  });

  // Keep the option to conditionally show header available
  shouldShowHeader = computed(() => {
    if (!this.showHeaderConditionally) {
      return true; // Always show header when conditional display is disabled
    }
    return !this.isHomeRoute(); // Show header only for non-home routes when conditional
  });

  contentClass = computed(() => {
    return this.isHomeRoute() ? 'flex-1 flex flex-col' : 'flex-1 flex flex-col ';
  });

  mainClass = computed(() => {
    return this.isHomeRoute() ? 'flex-1' : 'flex-1';
  });
}