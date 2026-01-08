import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TrustBadgesComponent } from './trust-badges.component';
import { PublicProfile } from 'src/app/funder/models/public-profile.models';

@Component({
  selector: 'app-funder-carousel-card',
  standalone: true,
  imports: [CommonModule, TrustBadgesComponent],
  template: `
    <div
      class="group h-full rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 bg-white border border-slate-200 hover:border-teal-300"
    >
      <!-- Hero Background with Animated Gradient -->
      <div
        class="relative h-40 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200"
      >
        <!-- Animated gradient overlay -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-slate-500/10 group-hover:from-teal-500/20 transition-all duration-500"
        ></div>

        <!-- Logo -->
        @if (profile.logoUrl) {
        <div class="absolute inset-0 flex items-center justify-center p-6">
          <img
            [src]="profile.logoUrl"
            [alt]="profile.organizationName"
            class="h-12 w-auto object-contain group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        } @else {
        <!-- Fallback: Organization initial with gradient -->
        <div class="absolute inset-0 flex items-center justify-center">
          <div
            class="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-slate-600 flex items-center justify-center text-white font-black text-2xl group-hover:scale-125 transition-transform duration-300"
          >
            {{ getInitial(profile.organizationName) }}
          </div>
        </div>
        }

        <!-- Verification Badge -->
        @if (profile.certifications && profile.certifications.length > 0) {
        <div
          class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5"
        >
          <svg
            class="w-4 h-4 text-teal-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
        }
      </div>

      <!-- Content -->
      <div class="p-6 flex flex-col h-[calc(100%-160px)]">
        <!-- Name -->
        <h3
          class="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors"
        >
          {{ profile.organizationName }}
        </h3>

        <!-- Tagline -->
        @if (profile.tagline) {
        <p class="text-sm text-slate-600 mb-4 line-clamp-2">
          {{ profile.tagline }}
        </p>
        }

        <!-- Trust Badges -->
        @if (profile.certifications && profile.certifications.length > 0) {
        <app-trust-badges
          [certifications]="profile.certifications.slice(0, 2)"
          class="mb-4"
        />
        }

        <!-- Investment Range -->
        @if (profile.investmentRange) {
        <div class="mb-4 p-3 rounded-lg bg-teal-50 border border-teal-200">
          <p class="text-xs uppercase font-bold text-teal-700 mb-1">
            Investment Range
          </p>
          <p class="text-sm font-bold text-slate-900">
            {{ formatRange(profile.investmentRange) }}
          </p>
        </div>
        }

        <!-- Sectors -->
        @if (profile.fundingAreas && profile.fundingAreas.length > 0) {
        <div class="mb-4">
          <p class="text-xs uppercase font-bold text-slate-600 mb-2">Sectors</p>
          <div class="flex flex-wrap gap-1.5">
            @for (area of profile.fundingAreas.slice(0, 3); track area.name) {
            <span
              class="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium"
            >
              {{ area.name }}
            </span>
            } @if (profile.fundingAreas.length > 3) {
            <span
              class="px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-xs font-medium"
            >
              +{{ profile.fundingAreas.length - 3 }}
            </span>
            }
          </div>
        </div>
        }

        <!-- CTA Button -->
        <div class="mt-auto pt-4 border-t border-slate-200">
          <button
            class="w-full py-2.5 px-4 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600 active:bg-teal-700 transition-all duration-200 text-sm"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  `,
})
export class FunderCarouselCardComponent {
  @Input() profile!: PublicProfile;

  getInitial(name: string): string {
    return (name?.charAt(0) || 'F').toUpperCase();
  }

  formatRange(range: any): string {
    if (!range) return 'N/A';
    const currency = range.currency || 'ZAR';
    const min = this.formatAmount(range.min);
    const max = this.formatAmount(range.max);
    return `${currency} ${min} - ${max}`;
  }

  private formatAmount(amount: number): string {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toLocaleString();
  }
}
