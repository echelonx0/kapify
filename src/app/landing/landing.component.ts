// // src/app/landing/landing.component.ts
// import { Component, signal, computed } from '@angular/core';
// import { 
//   LucideAngularModule, 
//   CheckCircle, 
//   Users, 
//   TrendingUp, 
//   Shield, 
//   Clock, 
//   Star,
//   ArrowRight,
//   Menu,
//   X,
//   MapPin,
//   Phone,
//   Mail
// } from 'lucide-angular';
// import { UiButtonComponent, UiCardComponent } from '../shared/components';

// interface Statistic {
//   value: string;
//   label: string;
//   description: string;
// }

// interface Feature {
//   icon: any;
//   title: string;
//   description: string;
// }

// interface Testimonial {
//   name: string;
//   company: string;
//   role: string;
//   content: string;
//   rating: number;
// }

// @Component({
//   selector: 'app-landing',
//   standalone: true,
//   imports: [LucideAngularModule, UiButtonComponent, UiCardComponent],
//   templateUrl: 'landing.component.html',
// })
// export class LandingComponent {
//   mobileMenuOpen = signal(false);
//   email = 'info@kapify.co.za'
//   // Icons
//   MenuIcon = Menu;
//   XIcon = X;
//   CheckCircleIcon = CheckCircle;
//   ArrowRightIcon = ArrowRight;
//   MapPinIcon = MapPin;
//   PhoneIcon = Phone;
//   MailIcon = Mail;
//   StarIcon = Star;

//   heroStats: Statistic[] = [
//     { value: '98%', label: 'Success Rate', description: 'Pre-qualified matches' },
//     { value: '48hrs', label: 'Response Time', description: 'Average funder response' }
//   ];

//   features: Feature[] = [
//     {
//       icon: Users,
//       title: 'Smart Matching',
//       description: 'Our AI connects you with funders who actually invest in businesses like yours.'
//     },
//     {
//       icon: Shield,
//       title: 'Pre-Qualification',
//       description: 'Rigorous vetting ensures only serious, qualified opportunities reach investors.'
//     },
//     {
//       icon: Clock,
//       title: 'Fast Process',
//       description: 'Get matched and receive funding decisions in days, not months.'
//     },
//     {
//       icon: TrendingUp,
//       title: 'Higher Success',
//       description: '98% of our pre-qualified applications receive funding offers.'
//     },
//     {
//       icon: CheckCircle,
//       title: 'FSCA Compliant',
//       description: 'Fully regulated and compliant with South African financial regulations.'
//     },
//     {
//       icon: Star,
//       title: 'Expert Support',
//       description: 'Dedicated support team guides you through every step of the process.'
//     }
//   ];

//   applicationSteps = [
//     { number: 1, title: 'Complete Profile', description: 'Tell us about your business' },
//     { number: 2, title: 'Get Qualified', description: 'We verify your application' },
//     { number: 3, title: 'Match & Fund', description: 'Connect with the right funder' }
//   ];

//   processSteps = [
//     {
//       number: 1,
//       title: 'Submit Application',
//       description: 'Complete our comprehensive business assessment and submit required documents.'
//     },
//     {
//       number: 2,
//       title: 'Smart Matching',
//       description: 'Our AI analyzes your profile and matches you with compatible funding partners.'
//     },
//     {
//       number: 3,
//       title: 'Get Funded',
//       description: 'Receive funding offers from pre-qualified investors within 48 hours.'
//     }
//   ];

//   testimonials: Testimonial[] = [
//     {
//       name: 'Thabo Mthembu',
//       company: 'TechFlow Solutions',
//       role: 'CEO',
//       content: 'Kapify connected us with the perfect investor in just 3 days. The pre-qualification process saved us months of pitching to wrong investors.',
//       rating: 5
//     },
//     {
//       name: 'Sarah van der Merwe',
//       company: 'GreenLeaf Organics',
//       role: 'Founder',
//       content: 'The platform made fundraising so much easier. We got multiple offers and closed our Series A in record time.',
//       rating: 5
//     },
//     {
//       name: 'Mandla Ndlovu',
//       company: 'Digital Marketing Pro',
//       role: 'Managing Director',
//       content: 'Professional service, excellent support team, and results that speak for themselves. Highly recommended.',
//       rating: 5
//     }
//   ];

//   getStepClasses(index: number): string {
//     const completed = index < 1;
//     const active = index === 1;
    
//     if (completed) {
//       return 'w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium';
//     }
//     if (active) {
//       return 'w-8 h-8 bg-primary-100 text-primary-600 border-2 border-primary-500 rounded-full flex items-center justify-center text-sm font-medium';
//     }
//     return 'w-8 h-8 bg-neutral-200 text-neutral-500 rounded-full flex items-center justify-center text-sm font-medium';
//   }

//   getStars(rating: number): number[] {
//     return Array(rating).fill(0);
//   }

//   toggleMobileMenu() {
//     this.mobileMenuOpen.set(!this.mobileMenuOpen());
//   }

//   startApplication() {
//     // Navigate to application form
//     console.log('Starting application...');
//   }

//   openFunderPortal() {
//     // Navigate to funder portal
//     console.log('Opening funder portal...');
//   }

//   watchDemo() {
//     // Open demo modal or navigate to demo page
//     console.log('Watch demo...');
//   }

//   contactSales() {
//     // Open contact form or navigate to contact page
//     console.log('Contact sales...');
//   }
// }
 
// src/app/landing/landing.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  CheckCircle, 
  Users, 
  TrendingUp, 
  Shield, 
  Clock, 
  Star,
  ArrowRight,
  Menu,
  X,
  MapPin,
  Phone,
  Mail
} from 'lucide-angular';

interface Statistic {
  value: string;
  label: string;
  description: string;
}

interface Feature {
  icon: any;
  title: string;
  description: string;
}

interface ApplicationStep {
  number: number;
  title: string;
  description: string;
}

interface ProcessStep {
  number: number;
  title: string;
  description: string;
}

interface Testimonial {
  name: string;
  company: string;
  role: string;
  content: string;
  rating: number;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-white">
      <!-- Header -->
      <header class="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-20">
            <!-- Logo -->
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">K</span>
              </div>
              <span class="text-2xl font-bold text-gray-900">Kapify</span>
            </div>

            <!-- Desktop Navigation -->
            <nav class="hidden md:flex items-center space-x-10">
              <a href="#features" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
              <a href="#how-it-works" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">How It Works</a>
              <a href="#testimonials" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">Success Stories</a>
              <a href="#contact" class="text-gray-600 hover:text-gray-900 font-medium transition-colors">Contact</a>
            </nav>

            <!-- CTA Buttons -->
            <div class="hidden md:flex items-center space-x-4">
              <button 
                class="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                (click)="openFunderPortal()"
              >
                Funder Portal
              </button>
              <button 
                class="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                (click)="startApplication()"
              >
                Get Funding
              </button>
            </div>

            <!-- Mobile Menu Button -->
            <button 
              class="md:hidden p-2 text-gray-600 hover:text-gray-900"
              (click)="toggleMobileMenu()"
            >
              <lucide-icon [img]="mobileMenuOpen() ? XIcon : MenuIcon" [size]="24" />
            </button>
          </div>

          <!-- Mobile Menu -->
          @if (mobileMenuOpen()) {
            <div class="md:hidden border-t border-gray-200 py-6 space-y-6">
              <a href="#features" class="block text-gray-600 hover:text-gray-900 font-medium transition-colors">Features</a>
              <a href="#how-it-works" class="block text-gray-600 hover:text-gray-900 font-medium transition-colors">How It Works</a>
              <a href="#testimonials" class="block text-gray-600 hover:text-gray-900 font-medium transition-colors">Success Stories</a>
              <a href="#contact" class="block text-gray-600 hover:text-gray-900 font-medium transition-colors">Contact</a>
              <div class="pt-6 border-t border-gray-200 space-y-4">
                <button 
                  class="block w-full text-center px-6 py-3 text-gray-700 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50"
                  (click)="openFunderPortal()"
                >
                  Funder Portal
                </button>
                <button 
                  class="block w-full text-center px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600"
                  (click)="startApplication()"
                >
                  Get Funding
                </button>
              </div>
            </div>
          }
        </div>
      </header>

      <!-- Hero Section -->
      <section class="relative pt-32 pb-16 lg:pb-24 overflow-hidden">
        <!-- Background Image with Overlay -->
        <div class="absolute inset-0">
          <div class="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700"></div>
          <div class="absolute inset-0 bg-black/20"></div>
        </div>
        
        <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
            <!-- Left Content -->
            <div class="space-y-8">
              <!-- Badge -->
              <div class="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                <lucide-icon [img]="MapPinIcon" [size]="16" class="mr-2" />
                Proudly South African
              </div>

              <!-- Main Headline -->
              <div class="space-y-6">
                <h1 class="text-5xl lg:text-7xl font-bold text-white leading-tight">
                  Smart Funding.
                  <span class="block text-green-400">Qualified Results.</span>
                </h1>
                <p class="text-xl text-gray-200 leading-relaxed max-w-2xl">
                  We connect SMEs with the right funders through intelligent pre-qualification. 
                  Get funding faster, investors get better deals. Win-win guaranteed.
                </p>
              </div>

              <!-- Stats Cards -->
              <div class="grid grid-cols-2 gap-6 max-w-lg">
                @for (stat of heroStats; track stat.label) {
                  <div class="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                    <div class="text-4xl font-bold text-gray-900 mb-2">{{ stat.value }}</div>
                    <div class="text-sm font-bold text-gray-700 uppercase tracking-wider mb-1">{{ stat.label }}</div>
                    <div class="text-xs text-gray-500">{{ stat.description }}</div>
                  </div>
                }
              </div>

              <!-- CTA Buttons -->
              <div class="flex flex-col sm:flex-row gap-4">
                <button 
                  class="inline-flex items-center justify-center px-10 py-4 bg-orange-500 text-white text-lg font-bold rounded-lg hover:bg-orange-600 transition-colors"
                  (click)="startApplication()"
                >
                  Get Funded Today
                  <lucide-icon [img]="ArrowRightIcon" [size]="20" class="ml-2" />
                </button>
                <button 
                  class="inline-flex items-center justify-center px-10 py-4 border-2 border-white text-white text-lg font-bold rounded-lg hover:bg-white hover:text-gray-900 transition-colors"
                  (click)="watchDemo()"
                >
                  Watch Demo
                </button>
              </div>

              <!-- Trust Indicators -->
              <div class="flex flex-wrap items-center gap-8 text-sm text-gray-300">
                <div class="flex items-center space-x-2">
                  <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-green-400" />
                  <span>No upfront fees</span>
                </div>
                <div class="flex items-center space-x-2">
                  <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-green-400" />
                  <span>48hr response</span>
                </div>
                <div class="flex items-center space-x-2">
                  <lucide-icon [img]="CheckCircleIcon" [size]="16" class="text-green-400" />
                  <span>FSCA compliant</span>
                </div>
              </div>
            </div>

            <!-- Right Side - Application Card -->
            <div class="relative lg:ml-8">
              <div class="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200">
                <div class="space-y-8">
                  <div class="text-center">
                    <h3 class="text-2xl font-bold text-gray-900 mb-2">Quick Application</h3>
                    <p class="text-gray-600">Get matched with funders in 3 steps</p>
                  </div>
                  
                  <!-- Progress Steps -->
                  <div class="space-y-6">
                    @for (step of applicationSteps; track step.number; let i = $index) {
                      <div class="flex items-center space-x-4">
                        <div [class]="getStepClasses(i)">
                          {{ step.number }}
                        </div>
                        <div class="flex-1">
                          <div class="text-lg font-semibold text-gray-900">{{ step.title }}</div>
                          <div class="text-sm text-gray-600">{{ step.description }}</div>
                        </div>
                      </div>
                    }
                  </div>

                  <button 
                    class="w-full py-4 bg-green-500 text-white text-lg font-bold rounded-xl hover:bg-green-600 transition-colors"
                    (click)="startApplication()"
                  >
                    Start Your Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Why SMEs Choose Kapify
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
              Our intelligent platform eliminates guesswork and connects you with the right funding partners faster.
            </p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (feature of features; track feature.title) {
              <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow text-center">
                <div class="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <lucide-icon [img]="feature.icon" [size]="32" class="text-green-600" />
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-4">{{ feature.title }}</h3>
                <p class="text-gray-600 leading-relaxed">{{ feature.description }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section id="how-it-works" class="py-20 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              How Kapify Works
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
              Our streamlined process connects qualified SMEs with the right funders in record time.
            </p>
          </div>

          <div class="grid lg:grid-cols-3 gap-8">
            @for (step of processSteps; track step.number; let i = $index) {
              <div class="relative">
                @if (i < processSteps.length - 1) {
                  <div class="hidden lg:block absolute top-16 left-full w-full h-1 bg-green-200 transform -translate-y-1/2 z-0"></div>
                }
                <div class="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-200 z-10">
                  <div class="w-20 h-20 bg-green-500 text-white rounded-2xl flex items-center justify-center text-3xl font-bold mb-6 mx-auto">
                    {{ step.number }}
                  </div>
                  <h3 class="text-2xl font-bold text-gray-900 mb-4 text-center">{{ step.title }}</h3>
                  <p class="text-gray-600 text-center leading-relaxed">{{ step.description }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section id="testimonials" class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center mb-16">
            <h2 class="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Success Stories
            </h2>
            <p class="text-xl text-gray-600 max-w-3xl mx-auto">
              See how South African SMEs are growing with Kapify's funding connections.
            </p>
          </div>

          <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            @for (testimonial of testimonials; track testimonial.name) {
              <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                <div class="space-y-6">
                  <div class="flex items-center space-x-1">
                    @for (star of getStars(testimonial.rating); track $index) {
                      <lucide-icon [img]="StarIcon" [size]="20" class="text-yellow-400 fill-current" />
                    }
                  </div>
                  <blockquote class="text-gray-700 leading-relaxed italic text-lg">
                    "{{ testimonial.content }}"
                  </blockquote>
                  <div class="pt-6 border-t border-gray-200">
                    <div class="font-bold text-gray-900 text-lg">{{ testimonial.name }}</div>
                    <div class="text-gray-600">{{ testimonial.role }}</div>
                    <div class="text-green-600 font-semibold">{{ testimonial.company }}</div>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-20 bg-green-600">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div class="space-y-8">
            <h2 class="text-4xl lg:text-5xl font-bold text-white">
              Ready to Fund Your Growth?
            </h2>
            <p class="text-xl text-green-100 max-w-3xl mx-auto">
              Join hundreds of South African SMEs who've found the right funding through Kapify. 
              Start your application today and get matched with qualified investors.
            </p>
            <div class="flex flex-col sm:flex-row justify-center gap-6">
              <button 
                class="inline-flex items-center justify-center px-10 py-4 bg-white text-green-600 text-lg font-bold rounded-lg hover:bg-gray-50 transition-colors"
                (click)="startApplication()"
              >
                Start Your Application
                <lucide-icon [img]="ArrowRightIcon" [size]="20" class="ml-2" />
              </button>
              <button 
                class="inline-flex items-center justify-center px-10 py-4 border-2 border-white text-white text-lg font-bold rounded-lg hover:bg-white hover:text-green-600 transition-colors"
                (click)="contactSales()"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer id="contact" class="bg-gray-900 text-white py-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <!-- Company Info -->
            <div class="space-y-6">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-lg">K</span>
                </div>
                <span class="text-2xl font-bold">Kapify</span>
              </div>
              <p class="text-gray-400 leading-relaxed">
                Connecting South African SMEs with the right funding partners through intelligent pre-qualification.
              </p>
              <div class="text-sm text-gray-500">
                Owned by Bokamoso Advisory Services
              </div>
            </div>

            <!-- Quick Links -->
            <div class="space-y-4">
              <h3 class="text-lg font-bold">Platform</h3>
              <div class="space-y-3">
                <a href="#features" class="block text-gray-400 hover:text-white transition-colors">Features</a>
                <a href="#how-it-works" class="block text-gray-400 hover:text-white transition-colors">How It Works</a>
                <a href="/pricing" class="block text-gray-400 hover:text-white transition-colors">Pricing</a>
                <a href="/faq" class="block text-gray-400 hover:text-white transition-colors">FAQ</a>
              </div>
            </div>

            <!-- For Funders -->
            <div class="space-y-4">
              <h3 class="text-lg font-bold">For Funders</h3>
              <div class="space-y-3">
                <a href="/funder-portal" class="block text-gray-400 hover:text-white transition-colors">Funder Portal</a>
                <a href="/deal-flow" class="block text-gray-400 hover:text-white transition-colors">Deal Flow</a>
                <a href="/partnerships" class="block text-gray-400 hover:text-white transition-colors">Partnerships</a>
                <a href="/resources" class="block text-gray-400 hover:text-white transition-colors">Resources</a>
              </div>
            </div>

            <!-- Contact -->
            <div class="space-y-4">
              <h3 class="text-lg font-bold">Get In Touch</h3>
              <div class="space-y-4">
                <div class="flex items-center space-x-3">
                  <lucide-icon [img]="PhoneIcon" [size]="18" class="text-gray-400" />
                  <span class="text-gray-400">+27 (0) 11 123 4567</span>
                </div>
                <div class="flex items-center space-x-3">
                  <lucide-icon [img]="MailIcon" [size]="18" class="text-gray-400" />
                  <span class="text-gray-400">{{ email }}</span>
                </div>
                <div class="flex items-start space-x-3">
                  <lucide-icon [img]="MapPinIcon" [size]="18" class="text-gray-400 mt-0.5" />
                  <span class="text-gray-400">Sandton, Johannesburg<br />South Africa</span>
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Kapify by Bokamoso Advisory Services. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  `,
})
export class LandingComponent {
  mobileMenuOpen = signal(false);
  email = 'info@kapify.co.za';

  // Icons
  MenuIcon = Menu;
  XIcon = X;
  CheckCircleIcon = CheckCircle;
  ArrowRightIcon = ArrowRight;
  MapPinIcon = MapPin;
  PhoneIcon = Phone;
  MailIcon = Mail;
  StarIcon = Star;

  heroStats: Statistic[] = [
    { value: '98%', label: 'SUCCESS RATE', description: 'Pre-qualified matches' },
    { value: '48hrs', label: 'RESPONSE TIME', description: 'Average funder response' }
  ];

  features: Feature[] = [
    {
      icon: Users,
      title: 'Smart Matching',
      description: 'Our AI connects you with funders who actually invest in businesses like yours.'
    },
    {
      icon: Shield,
      title: 'Pre-Qualification',
      description: 'Rigorous vetting ensures only serious, qualified opportunities reach investors.'
    },
    {
      icon: Clock,
      title: 'Fast Process',
      description: 'Get matched and receive funding decisions in days, not months.'
    },
    {
      icon: TrendingUp,
      title: 'Higher Success',
      description: '98% of our pre-qualified applications receive funding offers.'
    },
    {
      icon: CheckCircle,
      title: 'FSCA Compliant',
      description: 'Fully regulated and compliant with South African financial regulations.'
    },
    {
      icon: Star,
      title: 'Expert Support',
      description: 'Dedicated support team guides you through every step of the process.'
    }
  ];

  applicationSteps: ApplicationStep[] = [
    { number: 1, title: 'Complete Profile', description: 'Tell us about your business' },
    { number: 2, title: 'Get Qualified', description: 'We verify your application' },
    { number: 3, title: 'Match & Fund', description: 'Connect with the right funder' }
  ];

  processSteps: ProcessStep[] = [
    {
      number: 1,
      title: 'Submit Application',
      description: 'Complete comprehensive business profile and submit required documents.'
    },
    {
      number: 2,
      title: 'Smart Matching',
      description: 'Our AI analyzes your profile and matches you with compatible funding partners.'
    },
    {
      number: 3,
      title: 'Get Funded',
      description: 'Receive funding offers from pre-qualified investors within 48 hours.'
    }
  ];

  testimonials: Testimonial[] = [
    {
      name: 'Thabo Mthembu',
      company: 'TechFlow Solutions',
      role: 'CEO',
      content: 'Kapify connected us with the perfect investor in just 3 days. The pre-qualification process saved us months of pitching to wrong investors.',
      rating: 5
    },
    {
      name: 'Sarah van der Merwe',
      company: 'GreenLeaf Organics',
      role: 'Founder',
      content: 'The platform made fundraising so much easier. We got multiple offers and closed our Series A in record time.',
      rating: 5
    },
    {
      name: 'Mandla Ndlovu',
      company: 'Digital Marketing Pro',
      role: 'Managing Director',
      content: 'Professional service, excellent support team, and results that speak for themselves. Highly recommended.',
      rating: 5
    }
  ];

  getStepClasses(index: number): string {
    const completed = index < 1;
    const active = index === 1;
    
    if (completed) {
      return 'w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-lg font-bold';
    }
    if (active) {
      return 'w-12 h-12 bg-green-100 text-green-600 border-2 border-green-500 rounded-full flex items-center justify-center text-lg font-bold';
    }
    return 'w-12 h-12 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-lg font-bold';
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  startApplication() {
    // Navigate to application form
    console.log('Starting application...');
  }

  openFunderPortal() {
    // Navigate to funder portal
    console.log('Opening funder portal...');
  }

  watchDemo() {
    // Open demo modal or navigate to demo page
    console.log('Watch demo...');
  }

  contactSales() {
    // Open contact form or navigate to contact page
    console.log('Contact sales...');
  }

  
}