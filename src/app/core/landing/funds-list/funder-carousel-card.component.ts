import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TrustBadgesComponent } from './trust-badges.component';
import { PublicProfile } from 'src/app/funder/models/public-profile.models';

@Component({
  selector: 'app-funder-carousel-card',
  standalone: true,
  imports: [CommonModule, TrustBadgesComponent],
  styles: [
    `
      @keyframes gradient {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }

      .animate-gradient {
        background-size: 200% 200%;
        animation: gradient 6s ease infinite;
      }
    `,
  ],
  template: `
    <div
      class="group overflow-hidden rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 hover:border-emerald-500 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10"
    >
      <!-- Logo/Image Section -->
      @if (profile.logoUrl) {
      <div
        class="relative h-48 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center"
      >
        <img
          [src]="profile.logoUrl"
          [alt]="profile.organizationName"
          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      } @else {
      <div
        class="w-full h-48 bg-gradient-to-br from-emerald-600 via-slate-700 to-slate-900 animate-gradient relative overflow-hidden flex items-center justify-center"
      >
        <!-- Animated gradient overlay -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-slate-500/20 animate-pulse"
        ></div>
        <div
          class="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-3xl group-hover:scale-125 transition-transform duration-300"
        >
          {{ getInitial(profile.organizationName) }}
        </div>
      </div>
      }

      <!-- Content -->
      <div class="p-8">
        <!-- Name -->
        <h3
          class="text-xl font-black text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors"
        >
          {{ profile.organizationName }}
        </h3>

        <!-- Tagline/Description -->
        @if (profile.tagline) {
        <p class="text-sm font-bold text-emerald-400 mb-4">
          {{ profile.tagline }}
        </p>
        }

        <!-- Investment Range -->
        @if (profile.investmentRange) {
        <p class="text-sm text-slate-300 leading-relaxed mb-4">
          Invests {{ formatRange(profile.investmentRange) }}
        </p>
        }

        <!-- Trust Badges -->
        @if (profile.certifications && profile.certifications.length > 0) {
        <app-trust-badges
          [certifications]="profile.certifications.slice(0, 2)"
          class="mb-6"
        />
        }

        <!-- Sectors -->
        @if (profile.fundingAreas && profile.fundingAreas.length > 0) {
        <div class="mb-6">
          <p class="text-xs uppercase font-bold text-emerald-400 mb-2">
            Focus Areas
          </p>
          <div class="flex flex-wrap gap-2">
            @for (area of profile.fundingAreas.slice(0, 2); track area.name) {
            <span
              class="px-3 py-1 bg-slate-700 text-slate-200 rounded-full text-xs font-medium"
            >
              {{ area.name }}
            </span>
            } @if (profile.fundingAreas.length > 2) {
            <span
              class="px-3 py-1 bg-slate-700 text-slate-400 rounded-full text-xs font-medium"
            >
              +{{ profile.fundingAreas.length - 2 }}
            </span>
            }
          </div>
        </div>
        }

        <!-- View Profile Link -->
        <a
          href="#"
          class="text-sm font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-2 transition-colors"
        >
          View Profile →
        </a>
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
