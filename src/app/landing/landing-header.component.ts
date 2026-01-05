import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ArrowRight,
} from 'lucide-angular';

import { AuthService } from 'src/app/auth/services/production.auth.service';

interface NavItem {
  label: string;
  action: () => void;
  submenu?: NavItem[];
}

@Component({
  selector: 'landing-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <header
      class="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div
            class="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            (click)="goHome()"
          >
            <div
              class="w-8 h-8 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center shadow-sm"
            >
              <span class="text-white font-bold text-sm">K</span>
            </div>
            <span class="text-xl font-bold text-slate-900">Kapify</span>
          </div>

          <!-- Desktop Navigation -->
          @if (!isAuthenticated()) {
          <nav class="hidden lg:flex items-center space-x-1">
            @for (item of navItems(); track item.label) {
            <div class="relative group">
              <button
                (click)="item.action()"
                class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors group-hover:opacity-100 flex items-center gap-1.5"
              >
                {{ item.label }}
                @if (item.submenu) {
                <lucide-icon
                  [img]="ChevronDownIcon"
                  [size]="16"
                  class="group-hover:rotate-180 transition-transform"
                />
                }
              </button>

              <!-- Dropdown (if submenu exists) -->
              @if (item.submenu) {
              <div
                class="absolute left-0 mt-0 w-48 bg-white rounded-xl border border-slate-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2"
              >
                @for (sub of item.submenu; track sub.label) {
                <button
                  (click)="sub.action()"
                  class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-between group/sub"
                >
                  {{ sub.label }}
                  <lucide-icon
                    [img]="ArrowRightIcon"
                    [size]="16"
                    class="opacity-0 group-hover/sub:opacity-100 transition-opacity"
                  />
                </button>
                }
              </div>
              }
            </div>
            }
          </nav>
          } @else {
          <!-- Logged in: show minimal nav -->
          <div class="flex-1"></div>
          }

          <!-- Right Section: CTA Buttons -->
          <div class="hidden md:flex items-center space-x-3">
            @if (!isAuthenticated()) {
            <!-- Not Logged In -->
            <button
              (click)="openFunderPortal()"
              class="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Funder Portal
            </button>
            <button
              (click)="goToLogin()"
              class="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              (click)="startApplication()"
              class="px-4 py-2 bg-teal-500 text-white text-sm font-bold rounded-lg hover:bg-teal-600 active:bg-teal-700 transition-colors cursor-pointer shadow-sm hover:shadow-md"
            >
              Get Started
            </button>
            } @else {
            <!-- Logged In -->
            <div class="flex items-center space-x-3">
              <span class="text-sm font-medium text-slate-700">
                {{ currentUser()?.email }}
              </span>
              <button
                (click)="goToDashboard()"
                class="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Dashboard
              </button>
              <button
                (click)="logout()"
                class="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Log out"
              >
                <lucide-icon [img]="LogOutIcon" [size]="18" />
              </button>
            </div>
            }
          </div>

          <!-- Mobile Menu Button -->
          <button
            class="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            (click)="toggleMobileMenu()"
          >
            <lucide-icon
              [img]="mobileMenuOpen() ? XIcon : MenuIcon"
              [size]="24"
            />
          </button>
        </div>

        <!-- Mobile Menu -->
        @if (mobileMenuOpen()) {
        <div
          class="md:hidden border-t border-slate-200 py-4 space-y-3 animate-in fade-in slide-in-from-top-2"
        >
          @if (!isAuthenticated()) {
          <!-- Navigation Links -->
          @for (item of navItems(); track item.label) {
          <button
            (click)="item.action(); toggleMobileMenu()"
            class="block w-full text-left px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            {{ item.label }}
          </button>
          } }

          <!-- Divider -->
          <div class="border-t border-slate-200 pt-3 space-y-3">
            @if (!isAuthenticated()) {
            <!-- Not Logged In -->
            <button
              (click)="openFunderPortal(); toggleMobileMenu()"
              class="block w-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-left"
            >
              Funder Portal
            </button>
            <button
              (click)="goToLogin(); toggleMobileMenu()"
              class="block w-full px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              (click)="startApplication(); toggleMobileMenu()"
              class="block w-full px-4 py-2 bg-teal-500 text-white text-sm font-bold rounded-lg hover:bg-teal-600 transition-colors cursor-pointer"
            >
              Get Started
            </button>
            } @else {
            <!-- Logged In -->
            <div
              class="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wide"
            >
              Signed in as
            </div>
            <div class="px-4 text-sm font-medium text-slate-900">
              {{ currentUser()?.email }}
            </div>
            <button
              (click)="goToDashboard(); toggleMobileMenu()"
              class="block w-full px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Dashboard
            </button>
            <button
              (click)="logout(); toggleMobileMenu()"
              class="block w-full px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <lucide-icon [img]="LogOutIcon" [size]="16" />
              Log Out
            </button>
            }
          </div>
        </div>
        }
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* Ensure all clickable items show cursor:pointer on hover */
      button,
      a {
        @apply cursor-pointer;
      }

      /* Smooth transitions for all interactive elements */
      button,
      a {
        @apply transition-all duration-200;
      }

      /* Mobile menu animation */
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
export class LandingHeaderComponent {
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

  // Navigation items
  navItems = signal<NavItem[]>([
    {
      label: 'Products',
      action: () => this.scrollToSection('products'),
      submenu: [
        {
          label: 'For Funders',
          action: () => this.scrollToSection('for-funders'),
        },
        {
          label: 'For SMEs',
          action: () => this.scrollToSection('for-smes'),
        },
      ],
    },
    {
      label: 'How It Works',
      action: () => this.goToPricing(),
    },

    {
      label: 'FAQs',
      action: () => this.gotoFAQS(),
    },
    // {
    //   label: 'Funding',
    //   action: () => this.goToMarketplace(),
    // },
    // {
    //   label: 'Resources',
    //   action: () => this.scrollToSection('resources'),
    //   submenu: [
    //     {
    //       label: 'Documentation',
    //       action: () => this.router.navigate(['/docs']),
    //     },
    //     { label: 'Blog', action: () => this.router.navigate(['/blog']) },
    //   ],
    // },
  ]);

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

  goToPricing() {
    this.router.navigate(['/pricing']);
    this.mobileMenuOpen.set(false);
  }
  gotoFAQS() {
    this.router.navigate(['/faqs']);
    this.mobileMenuOpen.set(false);
  }
  goToMarketplace() {
    this.router.navigate(['/marketplace']);
    this.mobileMenuOpen.set(false);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
    this.mobileMenuOpen.set(false);
  }

  openFunderPortal() {
    this.router.navigate(['/register'], {
      queryParams: { userType: 'funder' },
    });
    this.mobileMenuOpen.set(false);
  }

  startApplication() {
    this.router.navigate(['/register'], {
      queryParams: { userType: 'sme' },
    });
    this.mobileMenuOpen.set(false);
  }

  logout() {
    this.authService.signOut();
    this.router.navigate(['/']);
    this.mobileMenuOpen.set(false);
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    this.mobileMenuOpen.set(false);
  }
}
