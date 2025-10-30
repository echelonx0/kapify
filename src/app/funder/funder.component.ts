// src/app/funder/funder.component.ts
import { Component, computed } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { FunderHeaderComponent } from './header/funder-header.component';
import { SidebarNavComponent } from '../shared/components';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [RouterOutlet, SidebarNavComponent, FunderHeaderComponent],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <sidebar-nav />

      <!-- Only show header if NOT in onboarding route -->
      @if (!isOnboardingRoute()) {
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

  isOnboardingRoute = computed(() =>
    this.router.url.startsWith('/funder/onboarding')
  );
}
