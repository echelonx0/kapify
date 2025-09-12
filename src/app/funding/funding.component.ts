// src/app/applications/applications.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarNavComponent } from '../shared/components/sidenav/sidebar-nav.component';
import { DashboardHeaderComponent } from '../shared/components/header/dashboard-header.component';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [RouterOutlet, SidebarNavComponent, DashboardHeaderComponent],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <sidebar-nav />
      
      <!-- Main Content -->
      <div class="ml-16">
        <!-- Sticky Header -->
        <div class="sticky top-0 z-40">
          <dashboard-header />
        </div>
        
        <!-- Page Content -->
        <main >
          <router-outlet />
        </main>
      </div>
    </div>
  `
})
export class FundingComponent {}