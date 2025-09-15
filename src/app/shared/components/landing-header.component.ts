// // src/app/shared/components/landing-header.component.ts
// import { Component, signal } from '@angular/core';
// import { Router } from '@angular/router';
// import { LucideAngularModule, Menu, X } from 'lucide-angular';
// import { UiButtonComponent } from './ui-button.component';

// @Component({
//   selector: 'landing-header',
//   standalone: true,
//   imports: [LucideAngularModule, UiButtonComponent],
//   template: `
//     <header class="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-neutral-200 z-50">
//       <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div class="flex items-center justify-between h-16">
//           <!-- Logo -->
//           <div class="flex items-center space-x-3 cursor-pointer" (click)="goHome()">
//             <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
//               <span class="text-white font-bold text-sm">K</span>
//             </div>
//             <span class="text-xl font-bold text-neutral-900">Kapify</span>
//           </div>

//           <!-- Desktop Navigation -->
//           <nav class="hidden md:flex items-center space-x-8">
//             <a href="#features" class="text-neutral-600 hover:text-neutral-900 transition-colors">Features</a>
//             <a href="#how-it-works" class="text-neutral-600 hover:text-neutral-900 transition-colors">How It Works</a>
//             <a href="#testimonials" class="text-neutral-600 hover:text-neutral-900 transition-colors">Success Stories</a>
//             <a href="#contact" class="text-neutral-600 hover:text-neutral-900 transition-colors">Contact</a>
//           </nav>

//           <!-- CTA Buttons -->
//           <div class="hidden md:flex items-center space-x-3">
//             <ui-button variant="ghost" size="sm" (clicked)="openFunderPortal()">
//               Funder Portal
//             </ui-button>
//             <ui-button variant="outline" size="sm" (clicked)="goToLogin()">
//               Sign In
//             </ui-button>
//             <ui-button variant="primary" size="sm" (clicked)="startApplication()">
//               Get Funding
//             </ui-button>
//           </div>

//           <!-- Mobile Menu Button -->
//           <button 
//             class="md:hidden p-2 text-neutral-600 hover:text-neutral-900"
//             (click)="toggleMobileMenu()"
//           >
//             <lucide-icon [img]="mobileMenuOpen() ? XIcon : MenuIcon" [size]="24" />
//           </button>
//         </div>

//         <!-- Mobile Menu -->
//         @if (mobileMenuOpen()) {
//           <div class="md:hidden border-t border-neutral-200 py-4 space-y-4">
//             <a href="#features" class="block text-neutral-600 hover:text-neutral-900 transition-colors">Features</a>
//             <a href="#how-it-works" class="block text-neutral-600 hover:text-neutral-900 transition-colors">How It Works</a>
//             <a href="#testimonials" class="block text-neutral-600 hover:text-neutral-900 transition-colors">Success Stories</a>
//             <a href="#contact" class="block text-neutral-600 hover:text-neutral-900 transition-colors">Contact</a>
//             <div class="pt-4 border-t border-neutral-200 space-y-3">
//               <ui-button variant="ghost" [fullWidth]="true" (clicked)="openFunderPortal()">
//                 Funder Portal
//               </ui-button>
//               <ui-button variant="outline" [fullWidth]="true" (clicked)="goToLogin()">
//                 Sign In
//               </ui-button>
//               <ui-button variant="primary" [fullWidth]="true" (clicked)="startApplication()">
//                 Get Funding
//               </ui-button>
//             </div>
//           </div>
//         }
//       </div>
//     </header>
//   `
// })
// export class LandingHeaderComponent {
//   mobileMenuOpen = signal(false);
  
//   MenuIcon = Menu;
//   XIcon = X;

//   constructor(private router: Router) {}

//   toggleMobileMenu() {
//     this.mobileMenuOpen.set(!this.mobileMenuOpen());
//   }

//   goHome() {
//     this.router.navigate(['/']);
//   }

//   goToLogin() {
//     this.router.navigate(['/login']);
//   }

//   openFunderPortal() {
//     // Navigate to funder registration
//     this.router.navigate(['/register'], { queryParams: { userType: 'funder' } });
//   }

//   startApplication() {
//     // Navigate to SME registration  
//     this.router.navigate(['/register'], { queryParams: { userType: 'sme' } });
//   }
// }



// src/app/shared/components/landing-header.component.ts
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Menu, X } from 'lucide-angular';
import { UiButtonComponent } from './ui-button.component';

@Component({
  selector: 'landing-header',
  standalone: true,
  imports: [LucideAngularModule, UiButtonComponent],
  template: `
    <header class="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-neutral-200 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center space-x-3 cursor-pointer" (click)="goHome()">
            <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">K</span>
            </div>
            <span class="text-xl font-bold text-neutral-900">Kapify</span>
          </div>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center space-x-8">
            <a href="#features" class="text-neutral-600 hover:text-neutral-900 transition-colors">Features</a>
            <a (click)="goToMarketplace()" class="text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer">Browse Funding</a>
            <a href="#how-it-works" class="text-neutral-600 hover:text-neutral-900 transition-colors">How It Works</a>
            <a href="#testimonials" class="text-neutral-600 hover:text-neutral-900 transition-colors">Success Stories</a>
            <a href="#contact" class="text-neutral-600 hover:text-neutral-900 transition-colors">Contact</a>
          </nav>

          <!-- CTA Buttons -->
          <div class="hidden md:flex items-center space-x-3">
            <ui-button variant="ghost" size="sm" (clicked)="openFunderPortal()">
              Funder Portal
            </ui-button>
            <ui-button variant="outline" size="sm" (clicked)="goToLogin()">
              Sign In
            </ui-button>
            <ui-button variant="primary" size="sm" (clicked)="startApplication()">
              Get Funding
            </ui-button>
          </div>

          <!-- Mobile Menu Button -->
          <button 
            class="md:hidden p-2 text-neutral-600 hover:text-neutral-900"
            (click)="toggleMobileMenu()"
          >
            <lucide-icon [img]="mobileMenuOpen() ? XIcon : MenuIcon" [size]="24" />
          </button>
        </div>

        <!-- Mobile Menu -->
        @if (mobileMenuOpen()) {
          <div class="md:hidden border-t border-neutral-200 py-4 space-y-4">
            <a href="#features" class="block text-neutral-600 hover:text-neutral-900 transition-colors">Features</a>
            <a (click)="goToMarketplace(); toggleMobileMenu()" class="block text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer">Browse Funding</a>
            <a href="#how-it-works" class="block text-neutral-600 hover:text-neutral-900 transition-colors">How It Works</a>
            <a href="#testimonials" class="block text-neutral-600 hover:text-neutral-900 transition-colors">Success Stories</a>
            <a href="#contact" class="block text-neutral-600 hover:text-neutral-900 transition-colors">Contact</a>
            <div class="pt-4 border-t border-neutral-200 space-y-3">
              <ui-button variant="ghost" [fullWidth]="true" (clicked)="openFunderPortal()">
                Funder Portal
              </ui-button>
              <ui-button variant="outline" [fullWidth]="true" (clicked)="goToLogin()">
                Sign In
              </ui-button>
              <ui-button variant="primary" [fullWidth]="true" (clicked)="startApplication()">
                Get Funding
              </ui-button>
            </div>
          </div>
        }
      </div>
    </header>
  `
})
export class LandingHeaderComponent {
  mobileMenuOpen = signal(false);
  
  MenuIcon = Menu;
  XIcon = X;

  constructor(private router: Router) {}

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

  openFunderPortal() {
    // Navigate to funder registration
    this.router.navigate(['/register'], { queryParams: { userType: 'funder' } });
  }

  startApplication() {
    // Navigate to SME registration  
    this.router.navigate(['/register'], { queryParams: { userType: 'sme' } });
  }
}