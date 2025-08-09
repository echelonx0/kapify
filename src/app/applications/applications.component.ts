// src/app/applications/applications.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarNavComponent } from '../shared/components/sidebar-nav.component';
import { DashboardHeaderComponent } from '../shared/components/dashboard-header.component';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [RouterOutlet, SidebarNavComponent, DashboardHeaderComponent],
  template: `
    <div class="h-screen bg-neutral-50 flex overflow-hidden">
      <sidebar-nav />
      
      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <dashboard-header />
        
        <!-- Page Content - Takes remaining height -->
        <main class="flex-1 overflow-hidden">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }
  `]
})
export class ApplicationsComponent {}