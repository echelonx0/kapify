// src/app/funding/opportunity-details.component.ts
import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

import {
  LucideAngularModule,
  ArrowLeft,
  Building2,
  DollarSign,
  Calendar,
  MapPin,
  CheckCircle,
  FileText,
  Users,
  Eye,
  CircleOff,
} from 'lucide-angular';

import { Subject, takeUntil } from 'rxjs';
import { SidebarNavComponent } from 'src/app/shared/components';
import { SMEOpportunitiesService } from '../services/opportunities.service';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { PublicProfileService } from 'src/app/funder/services/public-profile.service';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

@Component({
  selector: 'app-opportunity-details',
  standalone: true,
  imports: [CommonModule, SidebarNavComponent, LucideAngularModule],
  templateUrl: 'funding-detail.component.html',
})
export class OpportunityDetailsComponent implements OnInit {
  // Services
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private opportunitiesService = inject(SMEOpportunitiesService);
  private authService = inject(AuthService);
  private publicProfileService = inject(PublicProfileService);

  // Icons
  ArrowLeftIcon = ArrowLeft;
  Building2Icon = Building2;
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  MapPinIcon = MapPin;
  CheckCircleIcon = CheckCircle;
  FileTextIcon = FileText;
  UsersIcon = Users;
  EyeIcon = Eye;
  CircleOffIcon = CircleOff;

  // State
  opportunity = signal<FundingOpportunity | null>(null);
  isLoading = signal(true);
  hasPublicProfile = signal(false);
  isLoadingProfile = signal(false);
  private destroy$ = new Subject<void>();

  // Computed user context
  currentUser = computed(() => this.authService.user());

  ngOnInit() {
    const opportunityId = this.route.snapshot.paramMap.get('id');
    if (opportunityId) {
      this.loadOpportunity(opportunityId);
    }
  }

  loadOpportunity(id: string) {
    this.isLoading.set(true);
    this.opportunitiesService.getOpportunityById(id).subscribe({
      next: (opportunity) => {
        this.opportunity.set(opportunity || null);
        if (opportunity?.organizationId) {
          this.loadPublicProfile(opportunity.organizationId);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading opportunity:', error);
        this.isLoading.set(false);
      },
    });
  }

  private loadPublicProfile(organizationId: string) {
    this.isLoadingProfile.set(true);
    this.publicProfileService
      .loadOrganizationProfile(organizationId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.hasPublicProfile.set(!!profile);
          this.isLoadingProfile.set(false);
        },
        error: (error) => {
          console.log('No public profile found or error loading:', error);
          this.hasPublicProfile.set(false);
          this.isLoadingProfile.set(false);
        },
      });
  }

  // ===============================
  // PERMISSION METHODS
  // ===============================

  canApplyToOpportunity(): boolean {
    const user = this.currentUser();
    return !!(user && user.userType === 'sme');
  }

  canManageOpportunity(): boolean {
    const user = this.currentUser();
    const opp = this.opportunity();
    if (!user || !opp || user.userType !== 'funder') return false;

    // Simple check - user is the deal lead
    return opp.dealLead === user.id;
  }

  canViewInvestorProfile(): boolean {
    return this.hasPublicProfile();
  }

  getUserTypeLabel(): string {
    const user = this.currentUser();
    if (!user) return 'Guest';
    return user.userType === 'sme'
      ? 'SME'
      : user.userType === 'funder'
      ? 'Funder'
      : 'User';
  }

  // Navigation methods
  goBack() {
    window.history.back();
  }

  applyNow() {
    const opp = this.opportunity();
    if (opp) {
      this.router.navigate(['/applications/new', opp.id]); // ← Route param
    }
  }

  viewApplication() {
    this.router.navigate(['/applications']);
  }

  manageApplications() {
    const opp = this.opportunity();
    if (opp?.id) {
      this.router.navigate(['/funder/opportunities', opp.id, 'applications']);
    }
  }

  editOpportunity() {
    const opportunityId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/funder/opportunities/edit', opportunityId]);
  }

  viewInvestorProfile() {
    const opp = this.opportunity();
    if (opp?.organizationId && this.canViewInvestorProfile()) {
      this.router.navigate(['/funder/profile', opp.organizationId]);
    }
  }

  redirectToLogin() {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  // ===============================
  // HELPER & FORMATTING METHODS
  // ===============================

  getInitials(title: string): string {
    return title
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getInvestorName(opportunity: FundingOpportunity): string {
    // Mock investor names based on opportunity
    const investors: Record<string, string> = {
      'opp-001': 'Bokamoso Private Equity Fund',
      'opp-002': 'Industrial Development Corporation',
      'opp-003': 'Retail Growth Partners',
      'opp-004': 'AgriTech Innovation Foundation',
      'opp-005': 'Export Finance Corporation',
    };
    return investors[opportunity.id] || 'Private Investment Fund';
  }

  getFundingTypeClasses(type: string): string {
    const baseClasses =
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    switch (type) {
      case 'equity':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'debt':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'mezzanine':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'grant':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'convertible':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
      default:
        return `${baseClasses} bg-neutral-100 text-neutral-800`;
    }
  }

  formatFundingType(type: string): string {
    const types: Record<string, string> = {
      equity: 'Equity Investment',
      debt: 'Debt Financing',
      mezzanine: 'Mezzanine Financing',
      grant: 'Grant Funding',
      convertible: 'Convertible Note',
    };
    return types[type] || type;
  }

  formatIndustry(industry: string): string {
    return industry.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatIndustryDescription(industry: string): string {
    const descriptions: Record<string, string> = {
      technology: 'Technology and Digital Transformation',
      manufacturing: 'Manufacturing and Industrial',
      retail: 'Retail and Consumer Goods',
      agriculture: 'Agriculture and Food Processing',
      healthcare: 'Health and Wellness',
      fintech: 'Financial Technology',
      education: 'Education and Skills Development',
      energy: 'Renewable Energy and Environmental Sustainability',
      logistics: 'Logistics and Transportation',
      professional_services: 'Professional Services',
    };
    return descriptions[industry] || this.formatIndustry(industry);
  }

  formatBusinessStages(stages: string[]): string {
    const formatted = stages.map((stage) =>
      stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    );

    if (formatted.length <= 2) {
      return formatted.join(' and ');
    }

    return `${formatted.slice(0, -1).join(', ')}, and ${
      formatted[formatted.length - 1]
    }`;
  }

  formatLocation(location: string): string {
    return location.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  }

  formatFullAmount(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  getProgressPercentage(): number {
    const opp = this.opportunity();
    if (!opp || opp.totalAvailable === 0) return 0;
    return Math.min((opp.amountDeployed / opp.totalAvailable) * 100, 100);
  }

  // Template helper methods to avoid null checking issues in template
  hasGeographicRestrictions(): boolean {
    const opp = this.opportunity();
    return !!opp?.eligibilityCriteria.geographicRestrictions?.length;
  }

  getGeographicRestrictions(): string[] {
    const opp = this.opportunity();
    return opp?.eligibilityCriteria.geographicRestrictions || [];
  }

  getExclusionCriteria(): string[] {
    const opp = this.opportunity();
    console.log(opp?.exclusionCriteria);

    return opp?.exclusionCriteria || [];
  }

  getEligibilityCriteria(): string[] {
    const opp = this.opportunity();

    console.log(`Eligibility Criteria: `, opp?.eligibilityCriteria);
    return opp?.investmentCriteria || [];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
