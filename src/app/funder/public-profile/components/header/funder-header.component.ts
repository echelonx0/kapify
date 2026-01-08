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
  template: `
    <header
      class="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50"
    >
      <div
        class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between"
      >
        <!-- Logo / Back Button -->
        <div
          class="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          (click)="goHome()"
        >
          <div
            class="w-7 h-7 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm"
          >
            <span class="text-white font-bold text-xs">K</span>
          </div>
          <span class="text-lg font-bold text-white">Kapify</span>
        </div>

        <!-- Navigation Links (Desktop) -->
        <nav
          class="hidden lg:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-300"
        >
          <a
            href="#what-we-fund"
            class="hover:text-emerald-400 transition-colors"
            >Sectors</a
          >
          <a
            href="#investment-range"
            class="hover:text-emerald-400 transition-colors"
            >Investment</a
          >
          <a href="#team" class="hover:text-emerald-400 transition-colors"
            >Team</a
          >
        </nav>

        <!-- Right Section: Auth & CTA -->
        <div class="hidden md:flex items-center space-x-3">
          @if (!isAuthenticated()) {
          <!-- Not Logged In -->
          <button
            (click)="goToLogin()"
            class="px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            (click)="startApplication()"
            class="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-all text-sm shadow-lg hover:shadow-emerald-500/50 cursor-pointer"
          >
            Apply
          </button>
          } @else {
          <!-- Logged In -->
          <span class="text-xs font-medium text-slate-400">
            {{ currentUser()?.email }}
          </span>
          <button
            (click)="goToDashboard()"
            class="px-3 py-2 text-xs font-bold text-slate-300 border border-slate-700 rounded-lg hover:border-emerald-500 hover:text-emerald-400 transition-all cursor-pointer"
          >
            Dashboard
          </button>
          <button
            (click)="logout()"
            class="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
            title="Log out"
          >
            <lucide-icon [img]="LogOutIcon" [size]="18" />
          </button>
          }
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
          (click)="toggleMobileMenu()"
        >
          <lucide-icon
            [img]="mobileMenuOpen() ? XIcon : MenuIcon"
            [size]="20"
          />
        </button>
      </div>

      <!-- Mobile Menu -->
      @if (mobileMenuOpen()) {
      <div
        class="md:hidden border-t border-slate-800 bg-slate-950 py-4 space-y-3 animate-in fade-in slide-in-from-top-2"
      >
        <!-- Navigation Links -->
        <a
          href="#what-we-fund"
          class="block px-6 py-2 text-xs font-bold text-slate-300 hover:text-emerald-400 transition-colors"
          (click)="toggleMobileMenu()"
          >Sectors</a
        >
        <a
          href="#investment-range"
          class="block px-6 py-2 text-xs font-bold text-slate-300 hover:text-emerald-400 transition-colors"
          (click)="toggleMobileMenu()"
          >Investment</a
        >
        <a
          href="#team"
          class="block px-6 py-2 text-xs font-bold text-slate-300 hover:text-emerald-400 transition-colors"
          (click)="toggleMobileMenu()"
          >Team</a
        >

        <!-- Divider -->
        <div class="border-t border-slate-800 pt-3 space-y-3 px-6">
          @if (!isAuthenticated()) {
          <!-- Not Logged In -->
          <button
            (click)="goToLogin(); toggleMobileMenu()"
            class="block w-full px-3 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer text-left"
          >
            Sign In
          </button>
          <button
            (click)="startApplication(); toggleMobileMenu()"
            class="block w-full px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-all text-sm cursor-pointer"
          >
            Apply
          </button>
          } @else {
          <!-- Logged In -->
          <div
            class="text-xs font-medium text-slate-500 uppercase tracking-wide"
          >
            Signed in as
          </div>
          <div class="text-xs font-bold text-white">
            {{ currentUser()?.email }}
          </div>
          <button
            (click)="goToDashboard(); toggleMobileMenu()"
            class="block w-full px-3 py-2 text-xs font-bold text-slate-300 border border-slate-700 rounded-lg hover:border-emerald-500 hover:text-emerald-400 transition-all cursor-pointer"
          >
            Dashboard
          </button>
          <button
            (click)="logout(); toggleMobileMenu()"
            class="block w-full px-3 py-2 text-xs font-bold text-slate-300 hover:text-emerald-400 rounded-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <lucide-icon [img]="LogOutIcon" [size]="16" />
            Log Out
          </button>
          }
        </div>
      </div>
      }
    </header>
  `,
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
      this.router.navigate(['/apply'], {
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
