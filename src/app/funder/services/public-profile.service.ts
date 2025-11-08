// UPDATED: src/app/funder/services/public-profile.service.ts

import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, throwError, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import {
  PublicProfile,
  PublicProfileStats,
} from '../models/public-profile.models';

@Injectable({
  providedIn: 'root',
})
export class PublicProfileService {
  private supabaseService = inject(SharedSupabaseService);

  // State
  private profileSubject = new BehaviorSubject<PublicProfile | null>(null);
  public profile$ = this.profileSubject.asObservable();

  isLoading = signal(false);
  error = signal<string | null>(null);

  // ===============================
  // PROFILE MANAGEMENT
  // ===============================

  loadOrganizationProfile(
    organizationId: string
  ): Observable<PublicProfile | null> {
    this.isLoading.set(true);
    this.error.set(null);

    return from(
      this.supabaseService
        .from('public_profiles')
        .select(
          `
          *,
          organization:organizations(
            name,
            logo_url,
            is_verified
          )
        `
        )
        .eq('organization_id', organizationId)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') {
            return null;
          }
          throw error;
        }
        return this.mapDatabaseToModel(data);
      }),
      tap((profile) => {
        this.profileSubject.next(profile);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('Failed to load public profile:', error);
        this.error.set(error.message);
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  loadPublicProfile(slug: string): Observable<PublicProfile | null> {
    return from(
      this.supabaseService
        .from('public_profiles')
        .select(
          `
          *,
          organization:organizations(
            name,
            logo_url,
            is_verified,
            description
          )
        `
        )
        .eq('slug', slug)
        .eq('is_published', true)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') {
            return null;
          }
          throw error;
        }

        this.trackProfileView(data.id);
        return this.mapDatabaseToModel(data);
      }),
      catchError((error) => {
        console.error('Failed to load public profile:', error);
        return throwError(() => error);
      })
    );
  }

  createProfile(
    organizationId: string,
    organizationName: string,
    profileData: Partial<PublicProfile>
  ): Observable<PublicProfile> {
    this.isLoading.set(true);
    this.error.set(null);

    const slug = this.generateSlug(profileData.tagline || 'organization');

    const dbData = {
      organization_id: organizationId,
      organization_name: organizationName,
      slug,
      tagline: profileData.tagline || '',
      elevator_pitch: profileData.elevator_pitch,
      hero_video: profileData.heroVideo,
      logo_url: profileData.logoUrl || null, // ← ADD THIS
      hero_image_url: profileData.heroImageUrl || null, // ← ADD THIS
      portfolio_highlights: profileData.portfolioHighlights || [],
      success_metrics: profileData.successMetrics || [],
      certifications: profileData.certifications || [],
      awards: profileData.awards || [],
      social_links: profileData.socialLinks || [],
      funding_areas: profileData.fundingAreas || [],
      investment_range: profileData.investmentRange,
      application_process:
        profileData.applicationProcess || 'Apply through our platform',
      response_time_promise: profileData.responseTimePromise,
      founding_story: profileData.foundingStory,
      investment_approach: profileData.investmentApproach,
      team_members: profileData.teamMembers || [],
      meta_description: profileData.metaDescription,
      keywords: profileData.keywords || [],
      is_published: false,
      theme: profileData.theme || 'default',
      primary_color: profileData.primaryColor,
      show_contact_info: profileData.showContactInfo ?? true,
      allow_direct_contact: profileData.allowDirectContact ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return from(
      this.supabaseService
        .from('public_profiles')
        .insert(dbData)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseToModel(data);
      }),
      tap((profile) => {
        this.profileSubject.next(profile);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('Failed to create public profile:', error);
        this.error.set(error.message);
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  updateProfile(
    profileId: string,
    updates: Partial<PublicProfile>
  ): Observable<PublicProfile> {
    this.isLoading.set(true);
    this.error.set(null);

    const dbUpdates = {
      ...this.mapModelToDatabase(updates),
      updated_at: new Date().toISOString(),
    };

    return from(
      this.supabaseService
        .from('public_profiles')
        .update(dbUpdates)
        .eq('id', profileId)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return this.mapDatabaseToModel(data);
      }),
      tap((profile) => {
        this.profileSubject.next(profile);
        this.isLoading.set(false);
      }),
      catchError((error) => {
        console.error('Failed to update public profile:', error);
        this.error.set(error.message);
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  publishProfile(profileId: string): Observable<PublicProfile> {
    return this.updateProfile(profileId, {
      isPublished: true,
      publishedAt: new Date(),
    });
  }

  unpublishProfile(profileId: string): Observable<PublicProfile> {
    return this.updateProfile(profileId, {
      isPublished: false,
    });
  }

  // ===============================
  // ANALYTICS & TRACKING
  // ===============================

  private trackProfileView(profileId: string): void {
    this.supabaseService
      .from('profile_views')
      .insert({
        profile_id: profileId,
        viewed_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      })
      .then(({ error }) => {
        if (error) {
          console.warn('Failed to track profile view:', error);
        }
      });
  }

  getProfileStats(profileId: string): Observable<PublicProfileStats> {
    return from(
      this.supabaseService.rpc('get_profile_stats', { profile_id: profileId })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError((error) => {
        console.error('Failed to load profile stats:', error);
        return throwError(() => error);
      })
    );
  }

  // ===============================
  // UTILITY METHODS
  // ===============================

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim()
      .substring(0, 50);
  }

  validateSlug(slug: string, excludeProfileId?: string): Observable<boolean> {
    let query = this.supabaseService
      .from('public_profiles')
      .select('id')
      .eq('slug', slug);

    if (excludeProfileId) {
      query = query.neq('id', excludeProfileId);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.length === 0;
      })
    );
  }

  getPublicProfileUrl(slug: string): string {
    return `${window.location.origin}/funder/${slug}`;
  }

  // ===============================
  // DATA MAPPING
  // ===============================

  private mapDatabaseToModel(dbData: any): PublicProfile {
    return {
      id: dbData.id,
      organizationId: dbData.organization_id,
      organizationName: dbData.organization_name,
      slug: dbData.slug,
      heroVideo: dbData.hero_video,
      tagline: dbData.tagline,
      elevator_pitch: dbData.elevator_pitch,
      logoUrl: dbData.logo_url, // ← MAPPED FROM DB
      heroImageUrl: dbData.hero_image_url, // ← MAPPED FROM DB
      portfolioHighlights: dbData.portfolio_highlights || [],
      successMetrics: dbData.success_metrics || [],
      featuredPortfolioLogos: dbData.featured_portfolio_logos || [],
      certifications: dbData.certifications || [],
      awards: dbData.awards || [],
      socialLinks: dbData.social_links || [],
      fundingAreas: dbData.funding_areas || [],
      investmentRange: dbData.investment_range,
      applicationProcess: dbData.application_process,
      responseTimePromise: dbData.response_time_promise,
      foundingStory: dbData.founding_story,
      investmentApproach: dbData.investment_approach,
      teamMembers: dbData.team_members || [],
      metaDescription: dbData.meta_description,
      keywords: dbData.keywords || [],
      isPublished: dbData.is_published,
      publishedAt: dbData.published_at
        ? new Date(dbData.published_at)
        : undefined,
      lastModified: new Date(dbData.updated_at),
      viewCount: dbData.view_count,
      applicationCount: dbData.application_count,
      theme: dbData.theme || 'default',
      primaryColor: dbData.primary_color,
      showContactInfo: dbData.show_contact_info ?? true,
      allowDirectContact: dbData.allow_direct_contact ?? false,
    };
  }

  private mapModelToDatabase(modelData: Partial<PublicProfile>): any {
    const dbData: any = {};

    if (modelData.heroVideo !== undefined)
      dbData.hero_video = modelData.heroVideo;
    if (modelData.tagline !== undefined) dbData.tagline = modelData.tagline;
    if (modelData.elevator_pitch !== undefined)
      dbData.elevator_pitch = modelData.elevator_pitch;
    if (modelData.logoUrl !== undefined) dbData.logo_url = modelData.logoUrl; // ← MAP TO DB
    if (modelData.heroImageUrl !== undefined)
      dbData.hero_image_url = modelData.heroImageUrl; // ← MAP TO DB
    if (modelData.portfolioHighlights !== undefined)
      dbData.portfolio_highlights = modelData.portfolioHighlights;
    if (modelData.successMetrics !== undefined)
      dbData.success_metrics = modelData.successMetrics;
    if (modelData.featuredPortfolioLogos !== undefined)
      dbData.featured_portfolio_logos = modelData.featuredPortfolioLogos;
    if (modelData.certifications !== undefined)
      dbData.certifications = modelData.certifications;
    if (modelData.awards !== undefined) dbData.awards = modelData.awards;
    if (modelData.socialLinks !== undefined)
      dbData.social_links = modelData.socialLinks;
    if (modelData.fundingAreas !== undefined)
      dbData.funding_areas = modelData.fundingAreas;
    if (modelData.investmentRange !== undefined)
      dbData.investment_range = modelData.investmentRange;
    if (modelData.applicationProcess !== undefined)
      dbData.application_process = modelData.applicationProcess;
    if (modelData.responseTimePromise !== undefined)
      dbData.response_time_promise = modelData.responseTimePromise;
    if (modelData.foundingStory !== undefined)
      dbData.founding_story = modelData.foundingStory;
    if (modelData.investmentApproach !== undefined)
      dbData.investment_approach = modelData.investmentApproach;
    if (modelData.teamMembers !== undefined)
      dbData.team_members = modelData.teamMembers;
    if (modelData.metaDescription !== undefined)
      dbData.meta_description = modelData.metaDescription;
    if (modelData.keywords !== undefined) dbData.keywords = modelData.keywords;
    if (modelData.isPublished !== undefined)
      dbData.is_published = modelData.isPublished;
    if (modelData.publishedAt !== undefined)
      dbData.published_at = modelData.publishedAt?.toISOString();
    if (modelData.theme !== undefined) dbData.theme = modelData.theme;
    if (modelData.primaryColor !== undefined)
      dbData.primary_color = modelData.primaryColor;
    if (modelData.showContactInfo !== undefined)
      dbData.show_contact_info = modelData.showContactInfo;
    if (modelData.allowDirectContact !== undefined)
      dbData.allow_direct_contact = modelData.allowDirectContact;

    return dbData;
  }
}
