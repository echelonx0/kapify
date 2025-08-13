// src/app/funding/opportunity-details.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarNavComponent } from '../shared/components/sidebar-nav.component';

import { UiButtonComponent, UiCardComponent } from '../shared/components';
import { LucideAngularModule, ArrowLeft, Building2, DollarSign, Calendar, MapPin, CheckCircle, FileText, Users, Eye } from 'lucide-angular';
 
import { FundingOpportunity } from '../shared/models/funder.models';
import { OpportunitiesService } from './services/opportunities.service';

@Component({
  selector: 'app-opportunity-details',
  standalone: true,
  imports: [
    CommonModule,
    SidebarNavComponent,
    
    UiButtonComponent,
    UiCardComponent,
    LucideAngularModule
  ],
  templateUrl: 'funding-detail.component.html'
})
export class OpportunityDetailsComponent implements OnInit {
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

  // State
  opportunity = signal<FundingOpportunity | null>(null);
  isLoading = signal(true);
  
  // Mock user state
  currentUserId = 'user-001';
  userApplications = signal<string[]>(['opp-001']);

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private opportunitiesService: OpportunitiesService
  ) {}

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
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading opportunity:', error);
        this.isLoading.set(false);
      }
    });
  }

  // Navigation methods
  goBack() {
    this.router.navigate(['/funding/opportunities']);
  }

  applyNow() {
    const opp = this.opportunity();
    if (opp) {
      this.router.navigate(['/applications/new'], { 
        queryParams: { opportunityId: opp.id } 
      });
    }
  }

  viewApplication() {
    this.router.navigate(['/applications']);
  }

  manageApplications() {
    const opp = this.opportunity();
    if (opp) {
      this.router.navigate(['/funder-dashboard/opportunities', opp.id, 'applications']);
    }
  }

  // Helper methods
  isOwner(opportunity: FundingOpportunity): boolean {
    return opportunity.dealLead === this.currentUserId;
  }

  hasExistingApplication(): boolean {
    const opp = this.opportunity();
    return opp ? this.userApplications().includes(opp.id) : false;
  }

  getInitials(title: string): string {
    return title
      .split(' ')
      .map(word => word.charAt(0))
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
      'opp-005': 'Export Finance Corporation'
    };
    return investors[opportunity.id] || 'Private Investment Fund';
  }

  getFundingTypeClasses(type: string): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
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
      convertible: 'Convertible Note'
    };
    return types[type] || type;
  }

  formatIndustry(industry: string): string {
    return industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
      professional_services: 'Professional Services'
    };
    return descriptions[industry] || this.formatIndustry(industry);
  }

  formatBusinessStages(stages: string[]): string {
    const formatted = stages.map(stage => 
      stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
    
    if (formatted.length <= 2) {
      return formatted.join(' and ');
    }
    
    return `${formatted.slice(0, -1).join(', ')}, and ${formatted[formatted.length - 1]}`;
  }

  formatLocation(location: string): string {
    return location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
    return !!(opp?.eligibilityCriteria.geographicRestrictions?.length);
  }

  getGeographicRestrictions(): string[] {
    const opp = this.opportunity();
    return opp?.eligibilityCriteria.geographicRestrictions || [];
  }
}