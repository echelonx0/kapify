// src/app/shared/components/landing-header.component.ts
import { Component, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Menu, X, LogOut } from 'lucide-angular';
import { UiButtonComponent } from '../shared/components/ui-button.component';
import { AuthService } from 'src/app/auth/production.auth.service';

@Component({
  selector: 'landing-header',
  standalone: true,
  imports: [LucideAngularModule, UiButtonComponent],
  templateUrl: 'landing-header.component.html',
})
export class LandingHeaderComponent {
  mobileMenuOpen = signal(false);
  MenuIcon = Menu;
  XIcon = X;
  LogOutIcon = LogOut;

  constructor(private router: Router, private authService: AuthService) {}

  // Computed auth state
  isAuthenticated = computed(() => !!this.authService.user());
  currentUser = computed(() => this.authService.user());

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  goHome() {
    this.router.navigate(['/']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  version() {
    this.router.navigate(['/version-info']);
  }

  goToMarketplace() {
    this.router.navigate(['/marketplace']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  openFunderPortal() {
    this.router.navigate(['/register'], {
      queryParams: { userType: 'funder' },
    });
  }

  startApplication() {
    this.router.navigate(['/register'], { queryParams: { userType: 'sme' } });
  }

  logout() {
    this.authService.signOut();
    this.router.navigate(['/']);
  }
}
