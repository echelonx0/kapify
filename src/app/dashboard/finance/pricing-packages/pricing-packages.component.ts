import { Component, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Check, ArrowRight } from 'lucide-angular';

interface PricingPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  period?: string;
  popular?: boolean;
  savings?: string;
  description: string;
  features: string[];
  ctaText: string;
  highlightColor: 'teal' | 'emerald' | 'cyan';
}

@Component({
  selector: 'app-pricing-packages',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="text-center mb-12">
        <h2 class="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
          Choose Your Package
        </h2>
        <p class="text-lg text-slate-600 max-w-2xl mx-auto">
          Buy more credits at once to unlock better rates. Credits never expire.
        </p>
      </div>

      <!-- Pricing Cards -->
      <div class="space-y-4">
        @for (pkg of packages(); track pkg.id) {
        <div
          class="group relative bg-white rounded-2xl border transition-all duration-300 hover:shadow-lg overflow-hidden cursor-pointer"
          [class.border-teal-300]="pkg.popular"
          [class.border-slate-200]="!pkg.popular"
          [class.ring-2]="pkg.popular"
          [class.ring-teal-500]="pkg.popular"
          (click)="selectPackage(pkg.id)"
        >
          <!-- Gradient Background for Popular -->
          @if (pkg.popular) {
          <div
            class="absolute inset-0 bg-gradient-to-r from-teal-50 to-transparent opacity-40"
          ></div>
          }

          <!-- Popular Badge -->
          @if (pkg.popular) {
          <div class="absolute top-0 right-0 z-10">
            <div
              class="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-xs font-bold rounded-bl-2xl"
            >
              MOST POPULAR
            </div>
          </div>
          }

          <!-- Card Content -->
          <div class="relative p-8 lg:p-10 flex flex-col lg:flex-row gap-8">
            <!-- Left: Pricing Section -->
            <div class="lg:w-1/3 flex flex-col justify-start">
              <div class="mb-6">
                <p
                  class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"
                >
                  {{ pkg.name }}
                </p>
                <div class="flex items-baseline gap-1 mb-1">
                  <span class="text-4xl lg:text-5xl font-bold text-slate-900">
                    {{ formatCurrency(pkg.price) }}
                  </span>
                  <span class="text-sm text-slate-500">/month</span>
                </div>
                <p class="text-xs text-slate-500 mt-2">
                  {{ formatCredits(pkg.credits) }} credits
                </p>
                <p class="text-xs text-slate-500">
                  R{{ (pkg.price / (pkg.credits / 1000)).toFixed(3) }}/1000
                  credits
                </p>
              </div>

              <!-- Savings Badge -->
              @if (pkg.savings) {
              <div class="mb-6">
                <span
                  class="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200/50"
                >
                  {{ pkg.savings }}
                </span>
              </div>
              }

              <!-- CTA Button -->
              <button
                (click)="onPackageSelect($event, pkg.id)"
                class="px-6 py-3 bg-teal-500 text-white font-bold rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 flex items-center justify-center gap-2 group/btn"
              >
                {{ pkg.ctaText }}
                <lucide-icon
                  [img]="ArrowRightIcon"
                  [size]="18"
                  class="group-hover/btn:translate-x-0.5 transition-transform"
                />
              </button>
            </div>

            <!-- Middle: Features List -->
            <div class="lg:w-1/3">
              <p
                class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4"
              >
                Includes
              </p>
              <ul class="space-y-3">
                @for (feature of pkg.features; track feature) {
                <li class="flex items-start gap-3">
                  <div
                    class="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <lucide-icon
                      [img]="CheckIcon"
                      [size]="14"
                      class="text-teal-600"
                    />
                  </div>
                  <span class="text-sm text-slate-700">{{ feature }}</span>
                </li>
                }
              </ul>
            </div>

            <!-- Right: Selection Indicator -->
            <div class="lg:w-1/3 flex flex-col justify-between">
              <div class="text-right mb-4">
                @if (selectedPackageId() === pkg.id) {
                <div
                  class="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 text-xs font-bold rounded-xl border border-teal-200/50"
                >
                  <div class="w-2 h-2 rounded-full bg-teal-600"></div>
                  SELECTED
                </div>
                }
              </div>

              <!-- Placeholder for expansion room -->
              <p class="text-xs text-slate-500 text-right">
                {{ pkg.description }}
              </p>
            </div>
          </div>
        </div>
        }
      </div>

      <!-- Info Footer -->
      <p class="text-center text-sm text-slate-500 pt-4">
        All packages include priority support and real-time activity tracking.
      </p>
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
export class PricingPackagesComponent {
  @Output() packageSelected = new EventEmitter<string>();

  CheckIcon = Check;
  ArrowRightIcon = ArrowRight;

  selectedPackageId = signal<string>('medium');

  packages = signal<PricingPackage[]>([
    {
      id: 'starter',
      name: 'Starter',
      credits: 50000,
      price: 500,
      description: 'Perfect for exploring',
      popular: false,
      features: [
        'View 100 applications',
        'Download 50 documents',
        'Send 25 messages',
        'Access for 90 days',
        'Email support',
      ],
      ctaText: 'Get Started',
      highlightColor: 'cyan',
    },
    {
      id: 'medium',
      name: 'Medium',
      credits: 150000,
      price: 1350,
      savings: 'Save 10%',
      description: 'Most popular choice',
      popular: true,
      features: [
        'View 300+ applications',
        'Download 150 documents',
        'Send 75 messages',
        'Request 15 meetings',
        'Priority support',
        'Activity analytics',
      ],
      ctaText: 'Purchase Now',
      highlightColor: 'teal',
    },
    {
      id: 'pro',
      name: 'Pro',
      credits: 300000,
      price: 2400,
      savings: 'Save 20%',
      description: 'For active investors',
      popular: false,
      features: [
        'Unlimited application views',
        'Unlimited document downloads',
        'Send 200 messages',
        'Request 50 meetings',
        '24/7 priority support',
        'Advanced analytics',
        'Custom reports',
      ],
      ctaText: 'Upgrade to Pro',
      highlightColor: 'emerald',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      credits: 500000,
      price: 3500,
      savings: 'Save 30%',
      description: 'Maximum value',
      popular: false,
      features: [
        'Everything in Pro',
        'Unlimited everything',
        'Dedicated account manager',
        'Custom integrations',
        'SLA guarantee',
        'Team collaboration tools',
      ],
      ctaText: 'Contact Sales',
      highlightColor: 'emerald',
    },
  ]);

  selectPackage(packageId: string): void {
    this.selectedPackageId.set(packageId);
  }

  onPackageSelect(event: Event, packageId: string): void {
    event.stopPropagation();
    this.selectPackage(packageId);
    this.packageSelected.emit(packageId);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  formatCredits(amount: number): string {
    return amount.toLocaleString('en-ZA');
  }
}
