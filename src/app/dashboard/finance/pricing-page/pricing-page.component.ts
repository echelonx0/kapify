import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Check,
  Phone,
  ArrowRight,
  Eye,
  Download,
  MessageSquare,
  Users,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  DollarSign,
} from 'lucide-angular';
import { AuthService } from 'src/app/auth/production.auth.service';
import { LandingHeaderComponent } from 'src/app/landing/landing-header.component';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  credits: number;
  popular?: boolean;
  savings?: string;
  features: string[];
  cta: string;
}

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, LandingHeaderComponent],
  template: `
    <landing-header />
    <div class="min-h-screen bg-white">
      <!-- Hero Section -->
      <div
        class="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200"
      >
        <div class="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-20">
          <div class="max-w-3xl mx-auto text-center">
            <h1 class="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Transparent, simple pricing
            </h1>
            <p class="text-xl text-slate-600">
              Choose the plan that fits your investment goals. No setup fees, no
              surprises.
            </p>
          </div>
        </div>
      </div>

      <!-- Pricing Tiers Section -->
      <div class="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div class="space-y-4 mb-16">
          @for (tier of tiers(); track tier.id) {
          <div
            class="group relative bg-white rounded-2xl border transition-all duration-300 hover:shadow-lg"
            [class.border-teal-300]="tier.popular"
            [class.border-slate-200]="!tier.popular"
            [class.ring-2]="tier.popular"
            [class.ring-teal-500]="tier.popular"
          >
            <!-- Gradient bg for popular -->
            @if (tier.popular) {
            <div
              class="absolute inset-0 bg-gradient-to-r from-teal-50 to-transparent opacity-40 rounded-2xl"
            ></div>
            }

            <!-- Popular badge -->
            @if (tier.popular) {
            <div class="absolute top-0 right-0 z-10">
              <div
                class="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-xs font-bold rounded-bl-2xl"
              >
                MOST POPULAR
              </div>
            </div>
            }

            <!-- Content -->
            <div class="relative p-8 lg:p-10 flex flex-col lg:flex-row gap-8">
              <!-- Left: Pricing -->
              <div class="lg:w-1/4 flex flex-col justify-start">
                <p
                  class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
                >
                  {{ tier.name }}
                </p>
                <div class="mb-3">
                  <span class="text-5xl font-bold text-slate-900">
                    R{{ tier.price }}
                  </span>
                  <span class="text-sm text-slate-500">/month</span>
                </div>
                <p class="text-xs text-slate-500 mb-6">
                  {{ formatCredits(tier.credits) }} credits
                </p>

                @if (tier.savings) {
                <div class="mb-6">
                  <span
                    class="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200/50"
                  >
                    {{ tier.savings }}
                  </span>
                </div>
                }

                <button
                  (click)="onSelectPlan(tier.id)"
                  class="px-6 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  {{ tier.cta }}
                  <lucide-icon [img]="ArrowRightIcon" [size]="16" />
                </button>
              </div>

              <!-- Middle: Features -->
              <div class="lg:w-1/2">
                <p
                  class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4"
                >
                  Includes
                </p>
                <ul class="space-y-2.5">
                  @for (feature of tier.features; track feature) {
                  <li class="flex items-start gap-3">
                    <div
                      class="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5"
                    >
                      <lucide-icon
                        [img]="CheckIcon"
                        [size]="12"
                        class="text-teal-600"
                      />
                    </div>
                    <span class="text-sm text-slate-700">{{ feature }}</span>
                  </li>
                  }
                </ul>
              </div>

              <!-- Right: Selection indicator -->
              <div class="lg:w-1/4 flex items-start justify-end pt-1">
                <div
                  class="px-3 py-1.5 rounded-full text-xs font-bold"
                  [class.bg-teal-50]="tier.popular"
                  [class.text-teal-700]="tier.popular"
                  [class.text-slate-500]="!tier.popular"
                >
                  {{ tier.popular ? '✓ Most chosen' : 'Available' }}
                </div>
              </div>
            </div>
          </div>
          }
        </div>

        <!-- Contact Card (Right side) -->
        <div class="grid lg:grid-cols-3 gap-8 items-start">
          <!-- Info grid (2 cols on lg) -->
          <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            @for (info of infoCards(); track info.id) {
            <div class="bg-slate-50 rounded-2xl border border-slate-200 p-6">
              <div
                class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 mb-3"
              >
                <lucide-icon [img]="info.icon" [size]="20" />
              </div>
              <p class="text-sm font-bold text-slate-900 mb-1">
                {{ info.title }}
              </p>
              <p class="text-xs text-slate-600">{{ info.description }}</p>
            </div>
            }
          </div>

          <!-- Contact Card -->
          <div
            class="bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl p-8 text-white"
          >
            <div
              class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4"
            >
              <lucide-icon [img]="PhoneIcon" [size]="24" />
            </div>
            <h3 class="text-xl font-bold mb-2">Custom Plans?</h3>
            <p class="text-sm text-teal-100 mb-6">
              Need a tailored solution for your team? Let's talk about what
              works best for you.
            </p>
            <button
              (click)="onContactSales()"
              class="w-full px-4 py-3 bg-white text-teal-600 font-bold rounded-xl hover:bg-slate-50 transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
            >
              Get in Touch
              <lucide-icon [img]="ArrowRightIcon" [size]="16" />
            </button>
            <p class="text-xs text-teal-200 mt-4 text-center">
              Enterprise • SLA • Custom integrations
            </p>
          </div>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="bg-slate-50 border-t border-slate-200 py-16">
        <div class="max-w-3xl mx-auto px-4 lg:px-8">
          <h2 class="text-3xl font-bold text-slate-900 mb-12 text-center">
            Questions?
          </h2>

          <div class="space-y-6">
            @for (faq of faqs(); track faq.id) {
            <div class="bg-white rounded-xl p-6 border border-slate-200">
              <h3 class="font-bold text-slate-900 mb-2">{{ faq.q }}</h3>
              <p class="text-sm text-slate-600">{{ faq.a }}</p>
            </div>
            }
          </div>
        </div>
      </div>

      <!-- CTA Footer -->
      <div class="bg-white border-t border-slate-200 py-12">
        <div class="max-w-3xl mx-auto px-4 lg:px-8 text-center">
          <h2 class="text-2xl font-bold text-slate-900 mb-4">
            Ready to start investing?
          </h2>
          <p class="text-slate-600 mb-8">
            Choose your plan above and get instant access to opportunities.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              (click)="onSignUp()"
              class="px-8 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 transition-colors duration-200"
            >
              Get Started
            </button>
            <button
              (click)="onLearnMore()"
              class="px-8 py-3 border-2 border-slate-300 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors duration-200"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class PricingPageComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  // Icons
  CheckIcon = Check;
  PhoneIcon = Phone;
  ArrowRightIcon = ArrowRight;
  EyeIcon = Eye;
  DownloadIcon = Download;
  MessageSquareIcon = MessageSquare;
  UsersIcon = Users;
  ZapIcon = Zap;
  ShieldIcon = Shield;
  TrendingUpIcon = TrendingUp;
  ClockIcon = Clock;
  DollarSignIcon = DollarSign;

  tiers = signal<PricingTier[]>([
    {
      id: 'starter',
      name: 'Starter',
      price: 500,
      credits: 50000,
      features: [
        'View 100 applications',
        'Download 50 documents',
        'Send 25 messages',
        'Access for 90 days',
        'Email support',
      ],
      cta: 'Get Started',
    },
    {
      id: 'medium',
      name: 'Medium',
      price: 1350,
      credits: 150000,
      popular: true,
      savings: 'Save 10%',
      features: [
        'View 300+ applications',
        'Download 150 documents',
        'Send 75 messages',
        'Request 15 meetings',
        'Priority support',
        'Activity analytics',
      ],
      cta: 'Choose Plan',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 2400,
      credits: 300000,
      savings: 'Save 20%',
      features: [
        'Unlimited application views',
        'Unlimited document downloads',
        'Send 200 messages',
        'Request 50 meetings',
        '24/7 priority support',
        'Advanced analytics',
        'Custom reports',
      ],
      cta: 'Choose Plan',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 3500,
      credits: 500000,
      savings: 'Save 30%',
      features: [
        'Everything in Pro',
        'Unlimited everything',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantee',
        'Team collaboration',
      ],
      cta: 'Contact Sales',
    },
  ]);

  infoCards = signal([
    {
      id: 'credits',
      icon: this.ZapIcon,
      title: 'Credits Never Expire',
      description: 'Use your credits whenever you want. No time limits.',
    },
    {
      id: 'transparent',
      icon: this.ShieldIcon,
      title: 'Transparent Pricing',
      description: 'Every action has a clear cost. No hidden fees.',
    },
    {
      id: 'volume',
      icon: this.TrendingUpIcon,
      title: 'Volume Discounts',
      description: 'Save up to 30% when you buy larger packages.',
    },
  ]);

  faqs = signal([
    {
      id: 'expire',
      q: 'Do credits expire?',
      a: 'No. Your credits remain active indefinitely. Use them at your own pace.',
    },
    {
      id: 'refund',
      q: 'Can I get a refund?',
      a: 'Credits are non-refundable. However, they never expire, so you can use them anytime.',
    },
    {
      id: 'upgrade',
      q: 'Can I upgrade later?',
      a: 'Yes. You can purchase additional credits whenever you need them.',
    },
    {
      id: 'team',
      q: 'Do you offer team plans?',
      a: 'Enterprise plans support team collaboration. Contact us for custom pricing.',
    },
  ]);

  formatCredits(amount: number): string {
    return amount.toLocaleString('en-ZA');
  }

  onSelectPlan(tierId: string): void {}

  onContactSales(): void {
    // Open contact modal or navigate to contact page
    window.open(
      'mailto:sales@kapify.co?subject=Enterprise%20Plan%20Inquiry',
      '_blank'
    );
  }

  onSignUp(): void {
    this.router.navigate(['/auth/signup']);
  }

  onLearnMore(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
