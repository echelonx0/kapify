import { Component, computed } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { FunderHeaderComponent } from './header/funder-header.component';
import { SidebarNavComponent } from '../shared/components';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [RouterOutlet, SidebarNavComponent, FunderHeaderComponent],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <sidebar-nav />

      <!-- Only show header if NOT in onboarding or create-opportunity routes -->
      @if (!isHiddenHeaderRoute()) {
      <div class="sticky top-0 z-10 bg-neutral-50 border-b border-gray-200">
        <funder-header></funder-header>
      </div>
      }

      <!-- Page Content -->
      <main class="ml-16">
        <router-outlet />
      </main>
    </div>
  `,
})
export class FunderComponent {
  constructor(private router: Router) {}

  /** Hide header on onboarding + create-opportunity routes */
  isHiddenHeaderRoute = computed(() => {
    const url = this.router.url;
    return (
      url.startsWith('/funder/onboarding') ||
      url.startsWith('/funding/create-opportunity') ||
      url.startsWith('/funder/opportunities/edit')
    );
  });
}
