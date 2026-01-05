// src/app/shared/components/navigation.component.ts - Reusable nav component
import { Component, input } from '@angular/core';
import { Router } from '@angular/router';
import { UiButtonComponent } from './ui-button.component';
import { AuthService } from 'src/app/auth/services/production.auth.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [UiButtonComponent],
  template: `
    <nav class="flex items-center space-x-6">
      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center space-x-8">
        @for (item of navItems; track item.label) {
        <a
          [href]="item.href"
          class="text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          {{ item.label }}
        </a>
        }
      </div>

      <!-- Auth Buttons -->
      <div class="flex items-center space-x-3">
        @if (authService.isAuthenticated()) {
        <!-- Logged in state -->
        <ui-button variant="ghost" size="sm" (clicked)="goToDashboard()">
          Dashboard
        </ui-button>
        <ui-button variant="outline" size="sm" (clicked)="logout()">
          Logout
        </ui-button>
        } @else {
        <!-- Logged out state -->
        <ui-button variant="ghost" size="sm" (clicked)="goToLogin()">
          Sign In
        </ui-button>
        <ui-button variant="primary" size="sm" (clicked)="goToRegister()">
          Get Started
        </ui-button>
        }
      </div>
    </nav>
  `,
})
export class NavigationComponent {
  showMobileMenu = input(false);

  navItems = [
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Success Stories', href: '/#testimonials' },
    { label: 'Contact', href: '/contact' },
  ];

  constructor(public authService: AuthService, private router: Router) {}

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  logout() {
    this.router.navigate(['/']);
  }
}
