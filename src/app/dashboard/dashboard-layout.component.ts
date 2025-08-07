// src/app/dashboard/dashboard-layout.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarNavComponent } from '../shared/components/sidebar-nav.component';
import { DashboardHeaderComponent } from '../shared/components/dashboard-header.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarNavComponent, DashboardHeaderComponent],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <sidebar-nav />
      
      <!-- Main Content -->
      <div class="ml-16">
        <dashboard-header />
        
        <!-- Page Content -->
        <main class="p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class DashboardLayoutComponent {}