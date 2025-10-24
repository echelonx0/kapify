// src/app/shared/models/public-profile.models.ts
export interface SocialLink {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'youtube' | 'website';
  url: string;
  displayText?: string;
}

export interface SuccessMetric {
  label: string;
  value: string;
  icon?: string;
  emphasis?: boolean; // For highlighting key metrics
}

export interface FundingArea {
  name: string;
  description?: string;
  tags: string[];
}

export interface InvestmentRange {
  min: number;
  max: number;
  currency: string;
  typical?: number; // Most common investment size
}

export interface TeamMember {
  name: string;
  title: string;
  bio?: string;
  imageUrl?: string;
  linkedinUrl?: string;
}

export interface PublicProfile {
  id: string;
  organizationId: string;
    organizationName: string; // ADD THIS
  slug: string; // URL-friendly identifier
  
  // Hero Section
  heroVideo?: {
    url: string;
    thumbnail?: string;
    duration?: number;
  };
  tagline: string;
  elevator_pitch?: string; // 2-3 sentence description
  
  // Social Proof & Metrics
  portfolioHighlights: string[]; // "Funded 50+ companies", "R2.5B+ deployed"
  successMetrics: SuccessMetric[];
  logoUrl?: string;
  featuredPortfolioLogos?: string[]; // Company logos for social proof
  
  // Trust Signals
  certifications: string[];
  awards?: string[];
  socialLinks: SocialLink[];
  
  // Conversion Drivers
  fundingAreas: FundingArea[];
  investmentRange: InvestmentRange;
  applicationProcess: string; // "Apply in 10 minutes"
  responseTimePromise?: string; // "We respond within 48 hours"
  
  // About Section
  foundingStory?: string;
  investmentApproach?: string;
  teamMembers: TeamMember[];
  
  // SEO & Metadata
  metaDescription?: string;
  keywords?: string[];
  
  // Status & Publishing
  isPublished: boolean;
  publishedAt?: Date;
  lastModified: Date;
  
  // Analytics
  viewCount?: number;
  applicationCount?: number; // Applications generated from profile
  
  // Configuration
  theme?: 'default' | 'professional' | 'modern';
  primaryColor?: string;
  showContactInfo: boolean;
  allowDirectContact: boolean;
}

export interface PublicProfileStats {
  totalViews: number;
  viewsThisMonth: number;
  applicationsGenerated: number;
  conversionRate: number; // views to applications
  averageTimeOnPage: number;
  topReferrers: { source: string; views: number }[];
}
