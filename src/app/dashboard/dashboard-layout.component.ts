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
    <div class="min-h-screen bg-neutral-50 overflow-hidden">
      <!-- Show sidebar only for non-home routes -->
      <sidebar-nav   />
      
      <!-- Main Content -->
      <div [class]="contentClass()">
        <!-- Show header only for non-home routes -->
        <dashboard-header   />
        
        <!-- Page Content -->
        <main [class]="mainClass()">
          <router-outlet />
        </main>
      </div>
    </div>
  `
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

  isHomeRoute = computed(() => {
    const url = this.currentUrl();
    return url === '/dashboard/home' || url === '/dashboard';
  });

  contentClass = computed(() => {
    return this.isHomeRoute() ? '' : 'ml-16';
  });

  mainClass = computed(() => {
    return this.isHomeRoute() ? 'h-screen overflow-hidden' : 'p-6';
  });
}