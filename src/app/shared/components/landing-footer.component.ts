
// src/app/shared/components/landing-footer.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Phone, Mail, MapPin } from 'lucide-angular';

@Component({
  selector: 'landing-footer',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <footer id="contact" class="bg-neutral-900 text-white py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <!-- Company Info -->
          <div class="space-y-4">
            <div class="flex items-center space-x-3 cursor-pointer" (click)="goHome()">
              <div class="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">K</span>
              </div>
              <span class="text-xl font-bold">Kapify</span>
            </div>
            <p class="text-neutral-400">
              Connecting South African SMEs with the right funding partners through intelligent pre-qualification.
            </p>
            <div class="text-sm text-neutral-500">
              Owned by Bokamoso Advisory Services
            </div>
          </div>

          <!-- Quick Links -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Platform</h3>
            <div class="space-y-2">
              <a href="#features" class="block text-neutral-400 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" class="block text-neutral-400 hover:text-white transition-colors">How It Works</a>
              <button (click)="goToLogin()" class="block text-neutral-400 hover:text-white transition-colors text-left">Sign In</button>
              <button (click)="goToRegister()" class="block text-neutral-400 hover:text-white transition-colors text-left">Get Started</button>
            </div>
          </div>

          <!-- For Funders -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">For Funders</h3>
            <div class="space-y-2">
              <button (click)="openFunderPortal()" class="block text-neutral-400 hover:text-white transition-colors text-left">Funder Portal</button>
              <a href="#" class="block text-neutral-400 hover:text-white transition-colors">Deal Flow</a>
              <a href="#" class="block text-neutral-400 hover:text-white transition-colors">Partnerships</a>
              <a href="#" class="block text-neutral-400 hover:text-white transition-colors">Resources</a>
            </div>
          </div>

          <!-- Contact -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold">Get In Touch</h3>
            <div class="space-y-3">
              <div class="flex items-center space-x-3">
                <lucide-icon [img]="PhoneIcon" [size]="16" class="text-neutral-400" />
                <span class="text-neutral-400">+27 (0) 11 123 4567</span>
              </div>
              <div class="flex items-center space-x-3">
                <lucide-icon [img]="MailIcon" [size]="16" class="text-neutral-400" />
                <span class="text-neutral-400">{{email}}</span>
              </div>
              <div class="flex items-start space-x-3">
                <lucide-icon [img]="MapPinIcon" [size]="16" class="text-neutral-400 mt-0.5" />
                <span class="text-neutral-400">Sandton, Johannesburg<br>South Africa</span>
              </div>
            </div>
          </div>
        </div>

        <div class="border-t border-neutral-800 mt-12 pt-8 text-center text-neutral-400">
          <p>&copy; 2025 Kapify by Bokamoso Advisory Services. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `
})
export class LandingFooterComponent {
  PhoneIcon = Phone;
  MailIcon = Mail;
  MapPinIcon = MapPin;
    email = 'info@kapify.co.za'
  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  openFunderPortal() {
    this.router.navigate(['/register'], { queryParams: { userType: 'funder' } });
  }
}