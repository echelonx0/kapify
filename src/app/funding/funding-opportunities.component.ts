

// src/app/funding/funding-opportunities.component.ts  
import { Component } from '@angular/core';
import { SidebarNavComponent } from '../shared/components/sidebar-nav.component';
import { DashboardHeaderComponent } from '../shared/components/dashboard-header.component';

@Component({
  selector: 'app-funding-opportunities',
  standalone: true,
  imports: [SidebarNavComponent, DashboardHeaderComponent],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <sidebar-nav />
      <div class="ml-16">
        <dashboard-header />
        <main class="p-6">
          <h1 class="text-2xl font-bold text-neutral-900 mb-6">Funding Opportunities</h1>
          <div class="bg-white rounded-lg border border-neutral-200 p-6 text-center">
            <p class="text-neutral-600">Available funding opportunities will appear here.</p>
          </div>
        </main>
      </div>
    </div>
  `
})
export class FundingOpportunitiesComponent {}

