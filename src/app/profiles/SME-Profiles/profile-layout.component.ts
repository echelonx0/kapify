// src/app/profile/profile-layout.component.ts - FIXED LAYOUT
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarNavComponent } from '../../shared/components';

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarNavComponent],
  template: `
    <div class="h-screen flex flex-col bg-slate-50">
      <!-- Sidebar Navigation -->
      <sidebar-nav />

      <!-- Main Content Area (scrollable) -->
      <main class="flex-1 overflow-hidden">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class ProfileLayoutComponent {}
