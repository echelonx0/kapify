import { Component, Input, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ArrowRight,
} from 'lucide-angular';

import { AuthService } from 'src/app/auth/services/production.auth.service';
import { PublicProfile } from 'src/app/funder/models/public-profile.models';

@Component({
  selector: 'app-funder-profile-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './funder-header.component.html',
  styles: [
    `
      :host {
        display: block;
      }

      button,
      a {
        @apply cursor-pointer transition-all duration-200;
      }

      @keyframes slideInFromTop {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-in {
        animation: slideInFromTop 0.2s ease-out;
      }
    `,
  ],
})
export class FunderProfileHeaderComponent {
  @Input() profile!: PublicProfile | null;

  private router = inject(Router);
  private authService = inject(AuthService);

  // Icons
  MenuIcon = Menu;
  XIcon = X;
  LogOutIcon = LogOut;
  ChevronDownIcon = ChevronDown;
  ArrowRightIcon = ArrowRight;

  // State
  mobileMenuOpen = signal(false);

  // Computed auth state
  isAuthenticated = computed(() => !!this.authService.user());
  currentUser = computed(() => this.authService.user());

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  goHome() {
    this.router.navigate(['/']);
    this.mobileMenuOpen.set(false);
  }

  goToLogin() {
    this.router.navigate(['/login']);
    this.mobileMenuOpen.set(false);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
    this.mobileMenuOpen.set(false);
  }

  startApplication() {
    const slug = this.profile?.slug;
    if (slug) {
      this.router.navigate(['/'], {
        queryParams: { funder: slug },
      });
    } else {
      this.router.navigate(['/register'], {
        queryParams: { userType: 'sme' },
      });
    }
    this.mobileMenuOpen.set(false);
  }

  logout() {
    this.authService.signOut();
    this.router.navigate(['/']);
    this.mobileMenuOpen.set(false);
  }
}
