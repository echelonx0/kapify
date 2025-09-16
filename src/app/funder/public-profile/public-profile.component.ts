// src/app/funder/public-profile/public-profile.component.html
import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { LucideAngularModule, ExternalLink, MapPin, Globe, Linkedin, Twitter, Facebook, Instagram, Youtube, ArrowRight, CheckCircle, Shield, DollarSign, Clock, Target, Users, Award, Play, FileText, ArrowLeft, Home } from 'lucide-angular';
import { UiButtonComponent } from 'src/app/shared/components';
import { PublicProfile, SuccessMetric } from '../models/public-profile.models';
import { PublicProfileService } from '../services/public-profile.service';
 

@Component({
  selector: 'app-funder-profile',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent],
  templateUrl: 'public-profile.component.html'
})
export class FunderProfileComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private profileService = inject(PublicProfileService);
  private meta = inject(Meta);
  private title = inject(Title);
  private destroy$ = new Subject<void>();

  // Icons
  ExternalLinkIcon = ExternalLink;
  MapPinIcon = MapPin;
  GlobeIcon = Globe;
  LinkedinIcon = Linkedin;
  TwitterIcon = Twitter;
  FacebookIcon = Facebook;
  InstagramIcon = Instagram;
  YoutubeIcon = Youtube;
  ArrowRightIcon = ArrowRight;
  CheckCircleIcon = CheckCircle;
  ShieldIcon = Shield;
  DollarSignIcon = DollarSign;
  ClockIcon = Clock;
  TargetIcon = Target;
  UsersIcon = Users;
  AwardIcon = Award;
  PlayIcon = Play;
  FileTextIcon = FileText;
ArrowLeftIcon = ArrowLeft;
HomeIcon = Home;
  // State
  profile = signal<PublicProfile | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isPreview = signal(false);

  // Computed
  isVerified = computed(() => this.profile()?.organizationId ? true : false); // Would need to check org verification

  ngOnInit() {
    this.loadProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProfile() {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const slug = params['slug'];
        if (slug) {
          this.isPreview.set(this.route.snapshot.queryParams['preview'] === 'true');
          this.fetchProfile(slug);
        }
      });
  }

  private fetchProfile(slug: string) {
    this.isLoading.set(true);
    this.error.set(null);

    this.profileService.loadPublicProfile(slug)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          if (profile) {
            this.profile.set(profile);
            this.setupSEO(profile);
          } else {
            this.error.set('Funder profile not found or not published');
          }
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Failed to load profile:', error);
          this.error.set('Failed to load funder profile');
          this.isLoading.set(false);
        }
      });
  }

  private setupSEO(profile: PublicProfile) {
    const orgName = this.getOrganizationName();
    const pageTitle = `${orgName} - ${profile.tagline}`;
    const description = profile.metaDescription || profile.elevator_pitch || profile.tagline;

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
    // Navigate to application form or external application URL
    this.router.navigate(['/apply'], { 
      queryParams: { funder: this.profile()?.slug } 
    });
  }

  playVideo() {
    const videoUrl = this.profile()?.heroVideo?.url;
    if (videoUrl) {
      // Open video in modal or navigate to video page
      window.open(videoUrl, '_blank');
    }
  }

  goHome() {
    this.router.navigate(['/dashboard/funder-dashboard']);
  }

  goBack() {
  window.history.back();
}

createProfile() {
  this.router.navigate(['/funder/create-profile']);
}

  // ===============================
  // DISPLAY HELPERS
  // ===============================

  getOrganizationName(): string {
    // This would come from the organization data joined with the profile
    return this.profile()?.organizationId || 'Investment Fund';
  }

  getDisplayMetrics(): SuccessMetric[] {
    const metrics = this.profile()?.successMetrics || [];
    // Sort by emphasis first, then by order
    return metrics.sort((a, b) => {
      if (a.emphasis && !b.emphasis) return -1;
      if (!a.emphasis && b.emphasis) return 1;
      return 0;
    });
  }

  getMetricIcon(metric: SuccessMetric): any {
    const label = metric.label.toLowerCase();
    
    if (label.includes('companies') || label.includes('portfolio')) return this.UsersIcon;
    if (label.includes('funding') || label.includes('invested') || label.includes('deployed')) return this.DollarSignIcon;
    if (label.includes('return') || label.includes('irr') || label.includes('%')) return this.TargetIcon;
    if (label.includes('years') || label.includes('experience')) return this.ClockIcon;
    if (label.includes('awards') || label.includes('recognition')) return this.AwardIcon;
    
    return this.TargetIcon;
  }

  shouldShowAboutSection(): boolean {
    const profile = this.profile();
    return !!(profile?.foundingStory || profile?.investmentApproach || profile?.teamMembers.length);
  }

  formatAmount(amount: number): string {
    const currency = this.profile()?.investmentRange?.currency || 'ZAR';
    
    if (amount >= 1000000) {
      return `${currency} ${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${currency} ${(amount / 1000).toFixed(0)}K`;
    } else {
      return `${currency} ${amount.toLocaleString()}`;
    }
  }

  getSocialIcon(platform: string): any {
    const icons: Record<string, any> = {
      linkedin: this.LinkedinIcon,
      twitter: this.TwitterIcon,
      facebook: this.FacebookIcon,
      instagram: this.InstagramIcon,
      youtube: this.YoutubeIcon,
      website: this.GlobeIcon
    };
    return icons[platform] || this.GlobeIcon;
  }
}