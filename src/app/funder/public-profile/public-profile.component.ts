// import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { Meta, Title } from '@angular/platform-browser';
// import { Subject, takeUntil } from 'rxjs';
// import {
//   PublicProfile,
//   SuccessMetric,
//   FundingArea,
//   TeamMember,
// } from '../models/public-profile.models';
// import { PublicProfileService } from '../services/public-profile.service';
// import { FunderOpportunitiesGridComponent } from './components/fund-opportunities-grid.component';
// import { FunderHeroEnhancedComponent } from 'src/app/funder/public-profile/components/funder-hero-enhanced.component';

// @Component({
//   selector: 'app-funder-profile',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FunderOpportunitiesGridComponent,
//     FunderHeroEnhancedComponent,
//   ],
//   templateUrl: 'public-profile.component.html',
// })
// export class FunderProfileComponent implements OnInit, OnDestroy {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private profileService = inject(PublicProfileService);
//   private meta = inject(Meta);
//   private title = inject(Title);
//   private destroy$ = new Subject<void>();

//   // State
//   profile = signal<PublicProfile | null>(null);
//   isLoading = signal(true);
//   error = signal<string | null>(null);

//   ngOnInit() {
//     this.loadProfile();
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   private loadProfile() {
//     this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
//       const slug = params['slug'];
//       console.log(`The slug is ...${slug}`);
//       if (slug) this.fetchProfile(slug);
//     });
//   }
//   get typicalInvestment() {
//     return this.profile()?.investmentRange?.typical ?? 0;
//   }

//   private fetchProfile(slug: string) {
//     this.isLoading.set(true);
//     this.error.set(null);

//     this.profileService
//       .loadPublicProfile(slug)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (profile) => {
//           if (profile) {
//             this.profile.set(profile);
//             console.log(profile);
//             this.setupSEO(profile);
//           } else {
//             this.error.set('Profile not found or not published');
//           }
//           this.isLoading.set(false);
//         },
//         error: (error) => {
//           console.error('Failed to load profile:', error);
//           this.error.set('Failed to load funder profile');
//           this.isLoading.set(false);
//         },
//       });
//   }

//   private setupSEO(profile: PublicProfile) {
//     const pageTitle = `${profile.organizationName} - ${profile.tagline}`;
//     const description =
//       profile.metaDescription || profile.elevator_pitch || profile.tagline;

//     this.title.setTitle(pageTitle);
//     this.meta.updateTag({ name: 'description', content: description });
//     this.meta.updateTag({ property: 'og:title', content: pageTitle });
//     this.meta.updateTag({ property: 'og:description', content: description });
//     this.meta.updateTag({ property: 'og:type', content: 'website' });

//     if (profile.logoUrl) {
//       this.meta.updateTag({ property: 'og:image', content: profile.logoUrl });
//     }
//   }

//   // ===============================
//   // ACTIONS
//   // ===============================

//   startApplication() {
//     console.log('Application started:', this.profile()?.slug);
//     this.router.navigate(['/apply'], {
//       queryParams: { funder: this.profile()?.slug },
//     });
//   }

//   playVideo() {
//     const videoUrl = this.profile()?.heroVideo?.url;
//     if (videoUrl) window.open(videoUrl, '_blank');
//   }

//   // ===============================
//   // DISPLAY HELPERS
//   // ===============================

//   getTopFundingAreas(): FundingArea[] {
//     return this.profile()?.fundingAreas.slice(0, 4) || [];
//   }

//   getKeyMetrics(): SuccessMetric[] {
//     return (
//       this.profile()
//         ?.successMetrics.filter((m) => m.emphasis)
//         .slice(0, 3) || []
//     );
//   }

//   getLeadership(): TeamMember[] {
//     return this.profile()?.teamMembers.slice(0, 3) || [];
//   }

//   formatAmount(amount: number): string {
//     const currency = this.profile()?.investmentRange?.currency || 'ZAR';
//     if (amount >= 1000000)
//       return `${currency} ${(amount / 1000000).toFixed(1)}M`;
//     if (amount >= 1000) return `${currency} ${(amount / 1000).toFixed(0)}K`;
//     return `${currency} ${amount.toLocaleString()}`;
//   }
// }

import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import {
  PublicProfile,
  SuccessMetric,
  FundingArea,
  TeamMember,
} from '../models/public-profile.models';
import { PublicProfileService } from '../services/public-profile.service';
import { FunderOpportunitiesGridComponent } from './components/fund-opportunities-grid.component';
import { FunderHeroEnhancedComponent } from 'src/app/funder/public-profile/components/funder-hero-enhanced.component';
import { FunderProfileHeaderComponent } from './components/header/funder-header.component';
import { FunderWhatWeFundComponent } from './components/funding-areas/funding-areas.component';

@Component({
  selector: 'app-funder-profile',
  standalone: true,
  imports: [
    CommonModule,
    FunderOpportunitiesGridComponent,
    FunderHeroEnhancedComponent,
    FunderProfileHeaderComponent,
    FunderWhatWeFundComponent,
  ],
  template: `
    <div class="min-h-screen bg-slate-950">
      <!-- Header -->
      <app-funder-profile-header [profile]="profile()" />

      @if (isLoading()) {
      <div class="min-h-screen flex items-center justify-center">
        <div
          class="w-8 h-8 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"
        ></div>
      </div>
      } @else if (error()) {
      <div class="min-h-screen flex items-center justify-center px-6">
        <div class="max-w-md text-center">
          <h1 class="text-3xl font-black text-white mb-3">Profile Not Found</h1>
          <p class="text-slate-300">
            This profile doesn't exist or has been archived.
          </p>
        </div>
      </div>
      } @else {
      <!-- HERO -->
      @if (profile()) {
      <app-funder-hero-enhanced
        [profile]="profile()"
      ></app-funder-hero-enhanced>
      }

      <!-- KEY METRICS -->
      @if ((getKeyMetrics().length) > 0) {
      <section class="py-24 bg-white">
        <div class="max-w-7xl mx-auto px-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-16">
            @for (metric of getKeyMetrics(); track metric.label) {
            <div class="text-center">
              <div class="text-6xl lg:text-7xl font-black text-slate-900 mb-2">
                {{ metric.value }}
              </div>
              <div
                class="text-xs font-bold uppercase tracking-widest text-slate-500"
              >
                {{ metric.label }}
              </div>
            </div>
            }
          </div>
        </div>
      </section>
      }

      <!-- WHAT WE FUND (Extracted Component) -->
      @if ((profile()?.fundingAreas?.length ?? 0) > 0) {
      <app-funder-what-we-fund
        [fundingAreas]="getTopFundingAreas()"
      ></app-funder-what-we-fund>
      }

      <!-- INVESTMENT RANGE -->
      @if (profile()?.investmentRange) {
      <section id="investment-range" class="py-28 bg-slate-950">
        <div class="max-w-7xl mx-auto px-6">
          <div class="mb-20">
            <span
              class="inline-block text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4"
              >Ticket Sizes</span
            >
            <h2 class="text-5xl lg:text-6xl font-black text-white">
              Investment Range
            </h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              class="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-10 border border-slate-700"
            >
              <p
                class="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4"
              >
                Minimum
              </p>
              <p class="text-6xl font-black text-white mb-4">
                {{ formatAmount(profile()!.investmentRange!.min) }}
              </p>
              <p class="text-xs text-slate-500">
                {{ profile()!.investmentRange!.currency }}
              </p>
            </div>

            @if (typicalInvestment > 0) {
            <div
              class="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-10 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 relative"
            >
              <div
                class="absolute -top-3 right-6 px-3 py-1 bg-emerald-600 text-xs font-bold text-white rounded-full"
              >
                Most Common
              </div>
              <p
                class="text-xs uppercase tracking-widest text-emerald-100 font-bold mb-4"
              >
                Typical
              </p>
              <p class="text-6xl font-black text-white mb-4">
                {{ formatAmount(typicalInvestment) }}
              </p>
              <p class="text-xs text-emerald-100">
                {{ profile()!.investmentRange!.currency }}
              </p>
            </div>
            }

            <div
              class="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-10 border border-slate-700"
            >
              <p
                class="text-xs uppercase tracking-widest text-slate-400 font-bold mb-4"
              >
                Maximum
              </p>
              <p class="text-6xl font-black text-white mb-4">
                {{ formatAmount(profile()!.investmentRange!.max) }}
              </p>
              <p class="text-xs text-slate-500">
                {{ profile()!.investmentRange!.currency }}
              </p>
            </div>
          </div>
        </div>
      </section>
      }

      <!-- INVESTMENT APPROACH -->
      @if (profile()?.investmentApproach) {
      <section class="py-28 bg-white">
        <div class="max-w-4xl mx-auto px-6">
          <span
            class="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600 mb-6"
            >Philosophy</span
          >
          <h2 class="text-5xl lg:text-6xl font-black text-slate-900 mb-10">
            Our Investment Approach
          </h2>
          <p class="text-xl text-slate-700 leading-relaxed">
            {{ profile()!.investmentApproach }}
          </p>
        </div>
      </section>
      }

      <!-- ACTIVE OPPORTUNITIES -->
      <app-funder-opportunities-grid
        [organizationId]="profile()?.organizationId || ''"
      ></app-funder-opportunities-grid>

      <!-- HOW IT WORKS -->
      <section class="py-28 bg-slate-50">
        <div class="max-w-7xl mx-auto px-6">
          <div class="mb-20">
            <span
              class="inline-block text-xs font-bold uppercase tracking-widest text-emerald-600 mb-4"
              >Timeline</span
            >
            <h2 class="text-5xl lg:text-6xl font-black text-slate-900">
              The Process
            </h2>
          </div>

          <div class="max-w-4xl">
            <div class="space-y-8">
              <div class="flex gap-8 items-stretch">
                <div class="flex flex-col items-center">
                  <div
                    class="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500 text-white font-black shadow-lg"
                  >
                    1
                  </div>
                  <div
                    class="w-0.5 h-24 bg-gradient-to-b from-emerald-500 to-slate-200 mt-4"
                  ></div>
                </div>
                <div class="pb-8">
                  <h4 class="text-2xl font-black text-slate-900 mb-2">
                    Submit Application
                  </h4>
                  <p class="text-slate-600">
                    Share your pitch, metrics, and vision. ~10 minutes to
                    complete.
                  </p>
                </div>
              </div>

              <div class="flex gap-8 items-stretch">
                <div class="flex flex-col items-center">
                  <div
                    class="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500 text-white font-black shadow-lg"
                  >
                    2
                  </div>
                  <div
                    class="w-0.5 h-24 bg-gradient-to-b from-emerald-500 to-slate-200 mt-4"
                  ></div>
                </div>
                <div class="pb-8">
                  <h4 class="text-2xl font-black text-slate-900 mb-2">
                    We Review
                  </h4>
                  <p class="text-slate-600">
                    @if (profile()?.responseTimePromise) {
                    {{ profile()!.responseTimePromise }}
                    } @else { Feedback within 5-7 business days. }
                  </p>
                </div>
              </div>

              <div class="flex gap-8 items-stretch">
                <div class="flex flex-col items-center">
                  <div
                    class="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500 text-white font-black shadow-lg"
                  >
                    3
                  </div>
                </div>
                <div>
                  <h4 class="text-2xl font-black text-slate-900 mb-2">
                    Partner & Close
                  </h4>
                  <p class="text-slate-600">
                    Due diligence, negotiation, and funding. Typical close: 60
                    days.
                  </p>
                </div>
              </div>
            </div>

            <button
              (click)="startApplication()"
              class="mt-12 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-emerald-500/50"
            >
              Start Your Application
            </button>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="bg-slate-900 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-6 py-24">
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-16"
          >
            <!-- Brand -->
            <div class="space-y-4">
              @if (profile()?.logoUrl) {
              <img
                [src]="profile()!.logoUrl"
                [alt]="profile()!.organizationName"
                class="h-8 w-auto"
              />
              } @else {
              <h3 class="text-lg font-black text-white">
                {{ profile()?.organizationName }}
              </h3>
              } @if (profile()?.elevator_pitch) {
              <p class="text-sm text-slate-400">
                {{ profile()!.elevator_pitch }}
              </p>
              }
            </div>

            <!-- Links -->
            <div>
              <h4
                class="text-xs font-black uppercase tracking-widest text-white mb-6"
              >
                Navigation
              </h4>
              <ul class="space-y-3 text-sm text-slate-300">
                <li>
                  <a
                    href="#what-we-fund"
                    class="hover:text-emerald-400 transition-colors"
                    >Sectors</a
                  >
                </li>
                <li>
                  <a
                    href="#investment-range"
                    class="hover:text-emerald-400 transition-colors"
                    >Investment</a
                  >
                </li>
                <li>
                  <a
                    href="#team"
                    class="hover:text-emerald-400 transition-colors"
                    >Team</a
                  >
                </li>
              </ul>
            </div>

            <!-- Company -->
            <div>
              <h4
                class="text-xs font-black uppercase tracking-widest text-white mb-6"
              >
                Company
              </h4>
              <ul class="space-y-3 text-sm text-slate-300">
                <li>
                  <a href="#" class="hover:text-emerald-400 transition-colors"
                    >About</a
                  >
                </li>
                <li>
                  <a href="#" class="hover:text-emerald-400 transition-colors"
                    >Portfolio</a
                  >
                </li>
                <li>
                  <a href="#" class="hover:text-emerald-400 transition-colors"
                    >Blog</a
                  >
                </li>
              </ul>
            </div>

            <!-- Social -->
            <div>
              <h4
                class="text-xs font-black uppercase tracking-widest text-white mb-6"
              >
                Connect
              </h4>
              @if ((profile()?.socialLinks?.length ?? 0) > 0) {
              <div class="space-y-3 text-sm text-slate-300 mb-8">
                @for (link of profile()!.socialLinks!; track link.platform) {
                <a
                  [href]="link.url"
                  target="_blank"
                  class="flex items-center gap-2 hover:text-emerald-400 transition-colors capitalize"
                >
                  → {{ link.displayText || link.platform }}
                </a>
                }
              </div>
              }
              <button
                (click)="startApplication()"
                class="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all text-sm"
              >
                Apply Now
              </button>
            </div>
          </div>

          <!-- Bottom -->
          <div
            class="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-400"
          >
            <p>&copy; {{ profile()?.organizationName }}. Built for founders.</p>
            <div class="flex gap-6">
              <a href="#" class="hover:text-emerald-400 transition-colors"
                >Privacy</a
              >
              <a href="#" class="hover:text-emerald-400 transition-colors"
                >Terms</a
              >
              <a href="#" class="hover:text-emerald-400 transition-colors"
                >Cookies</a
              >
            </div>
          </div>
        </div>
      </footer>
      }
    </div>
  `,
})
export class FunderProfileComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private profileService = inject(PublicProfileService);
  private meta = inject(Meta);
  private title = inject(Title);
  private destroy$ = new Subject<void>();

  // State
  profile = signal<PublicProfile | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProfile() {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const slug = params['slug'];
      if (slug) this.fetchProfile(slug);
    });
  }

  get typicalInvestment() {
    return this.profile()?.investmentRange?.typical ?? 0;
  }

  private fetchProfile(slug: string) {
    this.isLoading.set(true);
    this.error.set(null);

    this.profileService
      .loadPublicProfile(slug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          if (profile) {
            this.profile.set(profile);
            this.setupSEO(profile);
          } else {
            this.error.set('Profile not found or not published');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load profile:', error);
          this.error.set('Failed to load funder profile');
          this.isLoading.set(false);
        },
      });
  }

  private setupSEO(profile: PublicProfile) {
    const pageTitle = `${profile.organizationName} - ${profile.tagline}`;
    const description =
      profile.metaDescription || profile.elevator_pitch || profile.tagline;

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    if (profile.logoUrl) {
      this.meta.updateTag({ property: 'og:image', content: profile.logoUrl });
    }
  }

  startApplication() {
    const slug = this.profile()?.slug;
    if (slug) {
      this.router.navigate(['/apply'], {
        queryParams: { funder: slug },
      });
    }
  }

  getTopFundingAreas(): FundingArea[] {
    return this.profile()?.fundingAreas.slice(0, 4) || [];
  }

  getKeyMetrics(): SuccessMetric[] {
    return (
      this.profile()
        ?.successMetrics.filter((m) => m.emphasis)
        .slice(0, 3) || []
    );
  }

  formatAmount(amount: number): string {
    const currency = this.profile()?.investmentRange?.currency || 'ZAR';
    if (amount >= 1000000)
      return `${currency} ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${currency} ${(amount / 1000).toFixed(0)}K`;
    return `${currency} ${amount.toLocaleString()}`;
  }
}
