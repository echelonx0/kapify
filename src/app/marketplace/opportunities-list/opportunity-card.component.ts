// enhanced-opportunity-card.component.ts - FIXED VERSION
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, DollarSign, Calendar, MapPin, Users, Eye, ExternalLink, Clock, Building, TrendingUp, Award } from 'lucide-angular';
import { FundingOpportunity } from '../../shared/models/funder.models';

@Component({
  selector: 'app-enhanced-opportunity-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="application-card group cursor-pointer" [class]="getCardStatusClass()">
      
      <!-- Status Border -->
      <div class="status-border" [class]="getStatusBorderClass()"></div>
      
      <div class="card-content">
        
        <!-- Header Section -->
        <div class="header-row">
          <div class="header-info">
            <div class="title-row">
              <h3 class="application-title">{{ opportunity.title }}</h3>
              <div class="flex items-center gap-2">
                <span class="status-badge" [class]="getFundingTypeClass()">
                  {{ formatFundingType() }}
                </span>
                <span *ngIf="isPopular()" class="stage-badge bg-orange-100 text-orange-700">
                  <lucide-icon [img]="TrendingUpIcon" [size]="12" class="mr-1" />
                  Popular
                </span>
              </div>
            </div>
            
            <!-- Funder Info -->
            <div class="flex items-center gap-2 text-sm text-neutral-600 mb-2">
              <div class="icon-container neutral w-6 h-6">
                <lucide-icon [img]="BuildingIcon" [size]="12" />
              </div>
              <span class="font-medium">{{ opportunity.funderOrganizationName || 'Private Funder' }}</span>
              <span class="text-neutral-400">•</span>
              <div class="flex items-center gap-1">
                <lucide-icon [img]="AwardIcon" [size]="12" class="text-green-500" />
                <span class="text-green-600 font-medium">Verified</span>
              </div>
            </div>
          </div>

          <div class="action-buttons flex-shrink-0">
            <button 
              (click)="onViewDetails()"
              class="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 group/btn">
              <lucide-icon [img]="EyeIcon" [size]="14" class="group-hover/btn:scale-110 transition-transform" />
              <span>View</span>
            </button>
          </div>
        </div>

        <!-- Key Details Grid -->
        <div class="details-grid">
          
          <!-- Funding Amount -->
          <div class="detail-item">
            <div class="detail-icon amount-icon">
              <lucide-icon [img]="DollarSignIcon" [size]="16" />
            </div>
            <div class="detail-info">
              <span class="detail-label">Funding Range</span>
              <span class="detail-value">{{ formatAmountRange() }}</span>
            </div>
          </div>

          <!-- Timeline -->
          <div class="detail-item">
            <div class="detail-icon date-icon">
              <lucide-icon [img]="ClockIcon" [size]="16" />
            </div>
            <div class="detail-info">
              <span class="detail-label">Decision Time</span>
              <span class="detail-value">{{ formatDecisionTime() }}</span>
            </div>
          </div>

          <!-- Location -->
          <div class="detail-item">
            <div class="detail-icon opportunity-icon">
              <lucide-icon [img]="MapPinIcon" [size]="16" />
            </div>
            <div class="detail-info">
              <span class="detail-label">Location</span>
              <span class="detail-value">{{ formatLocations() }}</span>
            </div>
          </div>

          <!-- Applications (if space allows) -->
          <div class="detail-item" *ngIf="showApplicationCount()">
            <div class="detail-icon applicant-icon">
              <lucide-icon [img]="UsersIcon" [size]="16" />
            </div>
            <div class="detail-info">
              <span class="detail-label">Interest</span>
              <span class="detail-value">{{ formatApplicationCount() }}</span>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="description">
          <p class="line-clamp-2">{{ opportunity.shortDescription || opportunity.description }}</p>
        </div>

        <!-- Industry Tags -->
        <div class="flex flex-wrap gap-2 mb-4">
          <span 
            *ngFor="let industry of getDisplayIndustries(); trackBy: trackByIndustry"
            class="inline-flex items-center px-2 py-1 bg-neutral-100 text-neutral-700 rounded-md text-xs font-medium">
            {{ formatIndustry(industry) }}
          </span>
        </div>

        <!-- Progress and Actions -->
        <div class="flex items-center justify-between">
          
          <!-- Funding Progress -->
          <div class="progress-container flex-1 mr-4">
            <div class="progress-bar">
              <div 
                class="progress-fill"
                [style.width.%]="getProgressPercentage()">
              </div>
            </div>
            <span class="progress-text">
              {{ formatProgress() }}
            </span>
          </div>

          <!-- Primary Action -->
          <div class="flex items-center gap-2">
            <button 
              *ngIf="canApply"
              (click)="onApply()"
              class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-semibold hover:from-primary-600 hover:to-primary-700 focus:ring-4 focus:ring-primary-200 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg group/apply">
              <span>Apply Now</span>
              <lucide-icon [img]="ExternalLinkIcon" [size]="14" class="group-hover/apply:translate-x-0.5 transition-transform" />
            </button>

            <button 
              *ngIf="canManage"
              (click)="onManage()"
              class="inline-flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all duration-200">
              <span>Manage</span>
            </button>

            <button 
              *ngIf="!canApply && !canManage"
              (click)="onSignInToApply()"
              class="inline-flex items-center gap-2 px-6 py-3 bg-neutral-600 text-white rounded-lg font-semibold hover:bg-neutral-700 focus:ring-4 focus:ring-neutral-200 transition-all duration-200">
              <span>Sign In to Apply</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class EnhancedOpportunityCardComponent {
  @Input() opportunity!: FundingOpportunity;
  @Input() canApply: boolean = false;
  @Input() canManage: boolean = false;
  @Output() apply = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<string>();
  @Output() manage = new EventEmitter<string>();
  @Output() signInToApply = new EventEmitter<void>();

  // Icons
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  MapPinIcon = MapPin;
  UsersIcon = Users;
  EyeIcon = Eye;
  ExternalLinkIcon = ExternalLink;
  ClockIcon = Clock;
  BuildingIcon = Building;
  TrendingUpIcon = TrendingUp;
  AwardIcon = Award;

  onApply() {
    this.apply.emit(this.opportunity.id);
  }

  onViewDetails() {
    this.viewDetails.emit(this.opportunity.id);
  }

  onManage() {
    this.manage.emit(this.opportunity.id);
  }

  onSignInToApply() {
    this.signInToApply.emit();
  }

  getCardStatusClass(): string {
    return `card-${this.opportunity.status || 'active'}`;
  }

  getStatusBorderClass(): string {
    switch (this.opportunity.status) {
      case 'active': return 'bg-green-500';
      case 'closed': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  }

  getFundingTypeClass(): string {
    switch (this.opportunity.fundingType) {
      case 'equity': return 'status-badge bg-purple-100 text-purple-700';
      case 'debt': return 'status-badge bg-blue-100 text-blue-700';
      case 'grant': return 'status-badge bg-green-100 text-green-700';
      case 'mezzanine': return 'status-badge bg-cyan-100 text-cyan-700';
      case 'convertible': return 'status-badge bg-indigo-100 text-indigo-700';
      default: return 'status-badge bg-neutral-100 text-neutral-700';
    }
  }

  formatFundingType(): string {
    const types: Record<string, string> = {
      equity: 'Equity',
      debt: 'Debt',
      mezzanine: 'Mezzanine',
      grant: 'Grant',
      convertible: 'Convertible'
    };
    return types[this.opportunity.fundingType] || this.opportunity.fundingType;
  }

  formatAmountRange(): string {
    const currency = this.opportunity.currency || 'ZAR';
    const min = this.formatAmount(this.opportunity.minInvestment);
    const max = this.formatAmount(this.opportunity.maxInvestment);
    return `${currency} ${min} - ${max}`;
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toLocaleString();
  }

  formatDecisionTime(): string {
    if (this.opportunity.decisionTimeframe) {
      return `${this.opportunity.decisionTimeframe} days`;
    }
    return 'Not specified';
  }

  formatLocations(): string {
    if (!this.opportunity.eligibilityCriteria?.geographicRestrictions?.length) {
      return 'South Africa';
    }
    
    const locations = this.opportunity.eligibilityCriteria.geographicRestrictions;
    const formatted = locations.map((loc: string) => 
      loc.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    );
    
    if (formatted.length <= 2) {
      return formatted.join(' & ');
    }
    
    return `${formatted.slice(0, 2).join(', ')} +${formatted.length - 2}`;
  }

  formatApplicationCount(): string {
    const count = this.opportunity.currentApplications || 0;
    if (count === 0) return 'No applications yet';
    if (count === 1) return '1 application';
    if (count > 100) return '100+ applications';
    return `${count} applications`;
  }

  getDisplayIndustries(): string[] {
    const industries = this.opportunity.eligibilityCriteria?.industries || [];
    return industries.slice(0, 3); // Show max 3 industries
  }

  formatIndustry(industry: string): string {
    return industry.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }

  getProgressPercentage(): number {
    if (!this.opportunity.totalAvailable || this.opportunity.totalAvailable === 0) {
      return 0;
    }
    const deployed = this.opportunity.amountDeployed || 0;
    return Math.min((deployed / this.opportunity.totalAvailable) * 100, 100);
  }

  formatProgress(): string {
    const percentage = this.getProgressPercentage();
    const remaining = this.opportunity.totalAvailable - (this.opportunity.amountDeployed || 0);
    
    if (percentage === 0) {
      return 'Fully available';
    }
    
    if (percentage >= 100) {
      return 'Fully deployed';
    }
    
    return `${this.formatAmount(remaining)} remaining`;
  }

  showApplicationCount(): boolean {
    return !!(this.opportunity.currentApplications && this.opportunity.currentApplications > 0);
  }

  isPopular(): boolean {
    return !!(this.opportunity.currentApplications && this.opportunity.currentApplications > 10);
  }

  trackByIndustry(index: number, industry: string): string {
    return industry;
  }
}