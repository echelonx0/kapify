
// src/app/applications/applications.component.ts
import { Component } from '@angular/core';
import { SidebarNavComponent } from '../shared/components/sidebar-nav.component';
import { DashboardHeaderComponent } from '../shared/components/dashboard-header.component';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [SidebarNavComponent, DashboardHeaderComponent],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <sidebar-nav />
    
    </div>
  `
})
export class ApplicationsComponent {}