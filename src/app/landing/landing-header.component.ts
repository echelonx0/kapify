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

  goToMarketplace() {
    this.router.navigate(['/marketplace']);
  }

  goToDashboard() {
    const user = this.currentUser();
    if (!user) return;
    if (user.userType === 'sme') {
      this.router.navigate(['/dashboard/sme']);
    } else if (user.userType === 'funder') {
      this.router.navigate(['/dashboard/funder']);
    } else {
      this.router.navigate(['/dashboard']);
    }
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
