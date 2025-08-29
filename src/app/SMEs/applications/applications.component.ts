// src/app/applications/applications.component.ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DashboardHeaderComponent, SidebarNavComponent } from 'src/app/shared/components';
 
@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [RouterOutlet, SidebarNavComponent, DashboardHeaderComponent],
  template: `
<div class="h-screen bg-neutral-50 flex overflow-hidden">
  <sidebar-nav />

  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Sticky Header -->
    <dashboard-header class="sticky top-0 z-50 bg-white shadow-sm" />

    <!-- Page Content - scrollable -->
    <main class="flex-1 overflow-y-auto">
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