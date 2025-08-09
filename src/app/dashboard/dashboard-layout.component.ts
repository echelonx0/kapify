// src/app/dashboard/dashboard-layout.component.ts
import { Component, computed } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarNavComponent } from '../shared/components/sidebar-nav.component';
import { DashboardHeaderComponent } from '../shared/components/dashboard-header.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarNavComponent, DashboardHeaderComponent],
  template: `
    <div class="min-h-screen bg-neutral-50 overflow-hidden">
      <!-- Show sidebar only for non-home routes -->
      <sidebar-nav *ngIf="!isHomeRoute()" />
      
      <!-- Main Content -->
      <div [class]="contentClass()">
        <!-- Show header only for non-home routes -->
        <dashboard-header *ngIf="!isHomeRoute()" />
        
        <!-- Page Content -->
        <main [class]="mainClass()">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class DashboardLayoutComponent {
  
  constructor(private router: Router) {}

  isHomeRoute = computed(() => {
    return this.router.url === '/dashboard/home' || this.router.url === '/dashboard';
  });

  contentClass = computed(() => {
    return this.isHomeRoute() ? '' : 'ml-16';
  });

  mainClass = computed(() => {
    return this.isHomeRoute() ? 'h-screen overflow-hidden' : 'p-6';
  });
}