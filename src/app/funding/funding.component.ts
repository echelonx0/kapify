import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarNavComponent } from '../shared/components/sidenav/sidebar-nav.component';
import { DashboardHeaderComponent } from '../shared/components/header/dashboard-header.component';
import { OpportunitiesHeaderComponent } from './marketplace/components/opportunity-header/opportunities-header.component';

@Component({
  selector: 'app-funding',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarNavComponent,
    DashboardHeaderComponent,
    OpportunitiesHeaderComponent,
  ],
  template: `
    <div class="min-h-screen bg-slate-50">
      <sidebar-nav />

      <div class="ml-16">
        <!-- Dashboard Header (hidden on opportunities & create routes) -->
        @if (!isHiddenDashboardHeader()) {
        <div class="sticky top-0 z-40">
          <dashboard-header />
        </div>
        }

        <!-- Opportunities Header (shown ONLY on /opportunities route) -->
        @if (isOpportunitiesRoute()&& !isHiddenDashboardHeader() ) {
        <div class=" top-0 z-40 bg-white mt-4">
          <app-opportunities-header />
        </div>
        }

        <!-- Page Content -->
        <main>
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class FundingComponent {
  private router = inject(Router);

  /**
   * Determine if we're on opportunities route (show opportunities header)
   */
  isOpportunitiesRoute = computed(() => {
    const url = this.router.url;
    return url.startsWith('/funding/opportunities') && !url.includes('/edit');
  });

  /**
   * Hide dashboard header on create-opportunity, opportunities, and onboarding routes
   */
  isHiddenDashboardHeader = computed(() => {
    const url = this.router.url;

    return (
      url.startsWith('/funding/create-opportunity') ||
      url.startsWith('/funding/opportunities') ||
      (url.startsWith('/funding/opportunities/') && url.includes('/edit')) ||
      url.startsWith('/funder/onboarding')
    );
  });
}
