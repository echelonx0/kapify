// src/app/shared/components/landing-footer.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Phone, Mail, MapPin, ArrowRight, Linkedin, Twitter, Facebook, Instagram } from 'lucide-angular';

@Component({
  selector: 'landing-footer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <!-- Premium Footer with Gradient -->
    <footer class="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-5">
        <div class="absolute inset-0" 
             style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 40px 40px;">
        </div>
      </div>

      <!-- Top CTA Section -->
      <div class="relative border-b border-white/10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div class="grid lg:grid-cols-2 gap-12 items-center">
            <div class="space-y-4 animate-fade-in-up">
              <h2 class="text-4xl font-bold">Ready to get funded?</h2>
              <p class="text-xl text-gray-300">Join 2,847 businesses already matched with their perfect funders</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-4 lg:justify-end animate-fade-in-up animation-delay-200">
              <button 
                (click)="goToRegister()"
                class="inline-flex items-center justify-center px-8 py-4 bg-green-500 text-white text-lg font-bold rounded-lg hover:bg-green-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                Get Started Free
                <lucide-icon [img]="ArrowRightIcon" [size]="20" class="ml-2" />
              </button>
              <button 
                (click)="openFunderPortal()"
                class="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white text-lg font-bold rounded-lg hover:bg-white hover:text-slate-900 transition-all">
                I'm a Funder
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Footer Content -->
      <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div class="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          
          <!-- Company Info - Larger Column -->
          <div class="lg:col-span-2 space-y-6 animate-fade-in-up">
            <div class="flex items-center space-x-3 cursor-pointer group" (click)="goHome()">
              <div class="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <span class="text-white font-bold text-xl">K</span>
              </div>
              <span class="text-2xl font-bold">Kapify</span>
            </div>
            <p class="text-gray-300 leading-relaxed max-w-md">
              South Africa's intelligent funding marketplace. We connect SMEs with the right funders through smart matching, eliminating wasted applications and accelerating funding decisions.
            </p>
            <div class="space-y-2">
              <div class="text-sm text-gray-400">Owned by</div>
              <div class="text-lg font-semibold text-white">Bokamoso Advisory Services</div>
            </div>
            
            <!-- Social Links -->
            <div class="flex items-center gap-4 pt-4">
              <a href="#" class="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all transform hover:scale-110">
                <lucide-icon [img]="LinkedinIcon" [size]="20" class="text-white" />
              </a>
              <a href="#" class="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all transform hover:scale-110">
                <lucide-icon [img]="TwitterIcon" [size]="20" class="text-white" />
              </a>
              <a href="#" class="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all transform hover:scale-110">
                <lucide-icon [img]="FacebookIcon" [size]="20" class="text-white" />
              </a>
              <a href="#" class="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all transform hover:scale-110">
                <lucide-icon [img]="InstagramIcon" [size]="20" class="text-white" />
              </a>
            </div>
          </div>

          <!-- Platform Links -->
          <div class="space-y-6 animate-fade-in-up animation-delay-100">
            <h3 class="text-lg font-bold">Platform</h3>
            <div class="space-y-3">
              <a href="#features" class="block text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200">Features</a>
              <a href="#how-it-works" class="block text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200">How It Works</a>
              <a href="#pricing" class="block text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200">Pricing</a>
              <button (click)="goToLogin()" class="block text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200 text-left">Sign In</button>
              <button (click)="goToRegister()" class="block text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200 text-left">Get Started</button>
            </div>
          </div>

          <!-- For Businesses -->
          <div class="space-y-6 animate-fade-in-up animation-delay-200">
            <h3 class="text-lg font-bold">For Businesses</h3>
            <div class="space-y-3">
              <a href="#" class="block text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200">Find Funding</a>
              <a href="#" class="block text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200">Success Stories</a>
              <a href="#" class="block text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200">Resources</a>
              <a href="#" class="block text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200">Support</a>
            </div>
          </div>

          <!-- For Funders -->
          <div class="space-y-6 animate-fade-in-up animation-delay-300">
            <h3 class="text-lg font-bold">For Funders</h3>
            <div class="space-y-3">
              <button (click)="openFunderPortal()" class="block text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200 text-left">Funder Portal</button>
              <a href="#" class="block text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200">Deal Flow</a>
              <a href="#" class="block text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200">Partnerships</a>
              <a href="#" class="block text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200">API Access</a>
            </div>
          </div>
        </div>

        <!-- Contact Bar -->
        <div class="mt-16 pt-8 border-t border-white/10 animate-fade-in-up animation-delay-400">
          <div class="grid md:grid-cols-3 gap-6">
            <div class="flex items-center space-x-3 group cursor-pointer hover:bg-white/5 p-3 rounded-lg transition-all">
              <div class="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                <lucide-icon [img]="PhoneIcon" [size]="20" class="text-green-400" />
              </div>
              <div>
                <div class="text-sm text-gray-400">Call us</div>
                <div class="text-white font-semibold">+27 (0) 11 123 4567</div>
              </div>
            </div>

            <div class="flex items-center space-x-3 group cursor-pointer hover:bg-white/5 p-3 rounded-lg transition-all">
              <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <lucide-icon [img]="MailIcon" [size]="20" class="text-blue-400" />
              </div>
              <div>
                <div class="text-sm text-gray-400">Email us</div>
                <div class="text-white font-semibold">{{email}}</div>
              </div>
            </div>

            <div class="flex items-center space-x-3 group cursor-pointer hover:bg-white/5 p-3 rounded-lg transition-all">
              <div class="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <lucide-icon [img]="MapPinIcon" [size]="20" class="text-purple-400" />
              </div>
              <div>
                <div class="text-sm text-gray-400">Visit us</div>
                <div class="text-white font-semibold">Sandton, Johannesburg</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="relative border-t border-white/10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-gray-400 text-sm">
              &copy; 2025 Kapify by Bokamoso Advisory Services. All rights reserved.
            </p>
            <div class="flex items-center gap-6 text-sm">
              <a href="#" class="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" class="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" class="text-gray-400 hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-fade-in-up {
      animation: fadeInUp 0.6s ease-out forwards;
      opacity: 0;
    }

    .animation-delay-100 {
      animation-delay: 0.1s;
    }

    .animation-delay-200 {
      animation-delay: 0.2s;
    }

    .animation-delay-300 {
      animation-delay: 0.3s;
    }

    .animation-delay-400 {
      animation-delay: 0.4s;
    }

    /* Smooth hover transitions */
    a, button {
      transition: all 0.2s ease;
    }
  `]
})
export class LandingFooterComponent {
  PhoneIcon = Phone;
  MailIcon = Mail;
  MapPinIcon = MapPin;
  ArrowRightIcon = ArrowRight;
  LinkedinIcon = Linkedin;
  TwitterIcon = Twitter;
  FacebookIcon = Facebook;
  InstagramIcon = Instagram;
  
  email = 'info@kapify.co.za';

  constructor(private router: Router) {}

  goHome() {
    this.router.navigate(['/']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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