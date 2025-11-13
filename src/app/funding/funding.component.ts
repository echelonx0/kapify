// import { Component, computed } from '@angular/core';
// import { RouterOutlet, Router } from '@angular/router';
// import { SidebarNavComponent } from '../shared/components/sidenav/sidebar-nav.component';
// import { DashboardHeaderComponent } from '../shared/components/header/dashboard-header.component';
// import { NgIf } from '@angular/common';

// @Component({
//   selector: 'app-funding',
//   standalone: true,
//   imports: [RouterOutlet, SidebarNavComponent, DashboardHeaderComponent, NgIf],
//   template: `
//     <div class="min-h-screen bg-neutral-50">
//       <sidebar-nav />

//       <div class="ml-16">
//         <!-- Sticky Header (hidden on certain routes) -->
//         @if (!isHiddenHeaderRoute()) {
//         <div class="sticky top-0 z-40">
//           <dashboard-header />
//         </div>
//         }

//         <!-- Page Content -->
//         <main>
//           <router-outlet />
//         </main>
//       </div>
//     </div>
//   `,
// })
// export class FundingComponent {
//   constructor(private router: Router) {}

//   /**
//    * Hide header on create-opportunity and onboarding routes
//    */
//   isHiddenHeaderRoute = computed(() => {
//     const url = this.router.url;

//     return (
//       url.startsWith('/funding/create-opportunity') ||
//       (url.startsWith('/funding/opportunities/') && url.includes('/edit')) ||
//       url.startsWith('/funder/onboarding')
//     );
//   });
// }
import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarNavComponent } from '../shared/components/sidenav/sidebar-nav.component';
import { DashboardHeaderComponent } from '../shared/components/header/dashboard-header.component';
import { ResponsiveLayoutComponent } from '../shared/responsive-layout.component';

@Component({
  selector: 'app-funding',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarNavComponent,
    DashboardHeaderComponent,
    ResponsiveLayoutComponent,
  ],
  template: `
    <app-responsive-layout [showHeader]="!isHiddenHeaderRoute()">
      <!-- SIDEBAR SLOT -->
      <div app-sidebar>
        <sidebar-nav />
      </div>

      <!-- HEADER SLOT -->
      <div app-header>
        <dashboard-header />
      </div>

      <!-- CONTENT SLOT -->
      <div app-content>
        <router-outlet />
      </div>
    </app-responsive-layout>
  `,
})
export class FundingComponent {
  private router = inject(Router);

  /**
   * Hide header on create-opportunity and onboarding routes
   * These routes use full-height forms with their own headers
   */
  isHiddenHeaderRoute = computed(() => {
    const url = this.router.url;

    return (
      url.startsWith('/funding/create-opportunity') ||
      (url.startsWith('/funding/opportunities/') && url.includes('/edit')) ||
      url.startsWith('/funder/onboarding')
    );
  });
}
