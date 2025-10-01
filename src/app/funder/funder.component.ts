// src/app/funder/funder.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarNavComponent } from '../shared/components/sidenav/sidebar-nav.component';
import { DashboardHeaderComponent } from '../shared/components/header/dashboard-header.component';
import { FunderHeaderComponent } from './header/funder-header.component';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [RouterOutlet, SidebarNavComponent, FunderHeaderComponent],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <sidebar-nav />
      <!-- Main Content -->
     

        <div class="sticky top-0 z-10 bg-neutral-50 border-b border-gray-200">
          <funder-header></funder-header>
          </div>
        <!-- Page Content -->
        <main class="ml-16">
          <router-outlet />
        </main>
      
    </div>
  `
})
export class FunderComponent {}