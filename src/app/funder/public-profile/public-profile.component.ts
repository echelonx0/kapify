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

@Component({
  selector: 'app-funder-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'public-profile.component.html',
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
            console.log(profile.heroImageUrl);
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

  // ===============================
  // ACTIONS
  // ===============================

  startApplication() {
    console.log('Application started:', this.profile()?.slug);
    this.router.navigate(['/apply'], {
      queryParams: { funder: this.profile()?.slug },
    });
  }

  playVideo() {
    const videoUrl = this.profile()?.heroVideo?.url;
    if (videoUrl) window.open(videoUrl, '_blank');
  }

  // ===============================
  // DISPLAY HELPERS
  // ===============================

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

  getLeadership(): TeamMember[] {
    return this.profile()?.teamMembers.slice(0, 3) || [];
  }

  formatAmount(amount: number): string {
    const currency = this.profile()?.investmentRange?.currency || 'ZAR';
    if (amount >= 1000000)
      return `${currency} ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${currency} ${(amount / 1000).toFixed(0)}K`;
    return `${currency} ${amount.toLocaleString()}`;
  }
}
