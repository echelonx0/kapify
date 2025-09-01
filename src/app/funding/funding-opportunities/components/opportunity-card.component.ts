// src/app/funding/components/opportunity-card.component.ts
import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, DollarSign, Calendar, Users, Eye } from 'lucide-angular';
import { AuthService } from '../../../auth/production.auth.service';
import { UiButtonComponent } from '../../../shared/components';
import { FundingOpportunity } from '../../../shared/models/funder.models';

@Component({
  selector: 'app-opportunity-card',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent
  ],
  template: `
<div class="group relative overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_60px_rgb(0,0,0,0.15)] transition-all duration-500 border border-slate-200/60">
  
  <!-- Subtle header -->
  <div class="h-1.5 bg-gradient-to-r from-slate-300 to-slate-400"></div>

  <div class="p-8">
    <div class="flex items-start justify-between">
      
      <!-- Left content -->
      <div class="flex-1 pr-8">
        
        <!-- Header section -->
        <div class="flex items-center gap-4 mb-6">
          <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-slate-200 shadow-sm">
            <span class="text-xl font-bold text-slate-600">
              {{ getInitials() }}
            </span>
          </div>
          
          <div class="flex-1">
            <h3 class="text-2xl font-bold text-slate-900 mb-2 group-hover:text-slate-700 transition-colors duration-300">
              {{ opportunity.title }}
            </h3>
            <div class="flex items-center gap-3 flex-wrap">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-800 text-white">
                {{ formatFundingType() }}
              </span>
              @for (industry of visibleIndustries(); track industry) {
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {{ formatIndustry(industry) }}
                </span>
              }
            </div>
          </div>
        </div>

        <!-- Description -->
        <p class="text-slate-600 leading-relaxed mb-6">
          {{ opportunity.shortDescription }}
        </p>

        <!-- Metrics grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="rounded-xl bg-slate-50 p-4 border border-slate-200/60">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center">
                <lucide-icon [img]="DollarSignIcon" [size]="16" class="text-white" />
              </div>
              <div>
                <div class="text-sm font-semibold text-slate-900">
                  {{ opportunity.currency }} {{ formatAmount(opportunity.minInvestment) }} - {{ formatAmount(opportunity.maxInvestment) }}
                </div>
                <div class="text-xs text-slate-500">Investment Range</div>
              </div>
            </div>
          </div>
          
          <div class="rounded-xl bg-slate-50 p-4 border border-slate-200/60">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center">
                <lucide-icon [img]="CalendarIcon" [size]="16" class="text-white" />
              </div>
              <div>
                <div class="text-sm font-semibold text-slate-900">{{ opportunity.decisionTimeframe }} days</div>
                <div class="text-xs text-slate-500">Decision Timeline</div>
              </div>
            </div>
          </div>
          
          <div class="rounded-xl bg-slate-50 p-4 border border-slate-200/60">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-slate-700 flex items-center justify-center">
                <lucide-icon [img]="UsersIcon" [size]="16" class="text-white" />
              </div>
              <div>
                <div class="text-sm font-semibold text-slate-900">{{ opportunity.currentApplications }}/{{ opportunity.maxApplications || '∞' }}</div>
                <div class="text-xs text-slate-500">Applications</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress section -->
        <div>
          <div class="flex justify-between items-center mb-3">
            <span class="text-sm font-medium text-slate-700">Funding Progress</span>
            <span class="text-sm text-slate-500">{{ progressPercentage() }}%</span>
          </div>
          <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              class="h-full bg-slate-600 rounded-full transition-all duration-500"
              [style.width.%]="progressPercentage()">
            </div>
          </div>
        </div>
      </div>

      <!-- Right actions - properly aligned -->
      <div class="flex flex-col gap-3 min-w-[120px] pt-2">
        @if (canApply()) {
          <ui-button variant="primary" (clicked)="onApply()"
                    class="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm">
            Apply Now
          </ui-button>
        }
        
        <ui-button variant="outline" (clicked)="onViewDetails()"
                  class="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg font-medium border border-slate-200 hover:border-slate-300 transition-all duration-200 flex items-center justify-center gap-2 text-sm">
          <lucide-icon [img]="EyeIcon" [size]="14" />
          View Details
        </ui-button>
        
        @if (canManage()) {
          <ui-button variant="outline" (clicked)="onManage()"
                    class="bg-white hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-lg font-medium border border-slate-200 hover:border-slate-300 transition-all duration-200 text-sm">
            Manage
          </ui-button>
        }
      </div>
    </div>
  </div>

  <!-- Subtle background pattern -->
  <div class="absolute inset-0 opacity-[0.02] pointer-events-none">
    <div class="absolute top-4 left-4 w-32 h-32 bg-slate-500 rounded-full blur-3xl"></div>
    <div class="absolute bottom-4 right-4 w-24 h-24 bg-slate-400 rounded-full blur-2xl"></div>
  </div>
</div>
  `
})
export class OpportunityCardComponent {
  @Input({ required: true }) opportunity!: FundingOpportunity;
  
  @Output() apply = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<string>();
  @Output() manage = new EventEmitter<string>();
  @Output() signInToApply = new EventEmitter<void>();

  private authService = inject(AuthService);

  // Icons
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  UsersIcon = Users;
  EyeIcon = Eye;

  // Computed properties
  currentUser = computed(() => this.authService.user());
  
  visibleIndustries = computed(() => 
    this.opportunity.eligibilityCriteria.industries.slice(0, 2)
  );

  progressPercentage = computed(() => {
    if (this.opportunity.totalAvailable === 0) return 0;
    return Math.min((this.opportunity.amountDeployed / this.opportunity.totalAvailable) * 100, 100);
  });

  canApply = computed(() => {
    const user = this.currentUser();
    return !!(user && user.userType === 'sme');
  });

  canManage = computed(() => {
    const user = this.currentUser();
    if (!user || user.userType !== 'funder') return false;
    return this.opportunity.dealLead === user.id;
  });

  // Event handlers
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

  // Helper methods
  getInitials(): string {
    return this.opportunity.title
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  getFundingTypeClasses(): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (this.opportunity.fundingType) {
      case 'equity': return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'debt': return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'mezzanine': return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'grant': return `${baseClasses} bg-green-100 text-green-800`;
      case 'convertible': return `${baseClasses} bg-indigo-100 text-indigo-800`;
      default: return `${baseClasses} bg-neutral-100 text-neutral-800`;
    }
  }

  getHeaderGradient(): string {
    switch (this.opportunity.fundingType) {
      case 'equity': return 'from-slate-400 to-slate-600';
      case 'debt': return 'from-zinc-400 to-zinc-600';
      case 'grant': return 'from-green-400 to-green-600';
      case 'mezzanine': return 'from-cyan-400 to-cyan-600';
      case 'convertible': return 'from-sky-400 to-sky-600';
      default: return 'from-neutral-400 to-neutral-600';
    }
  }

  getProgressGradient(): string {
    switch (this.opportunity.fundingType) {
      case 'equity': return 'from-slate-400 to-slate-600';
      case 'debt': return 'from-zinc-400 to-zinc-600';
      case 'grant': return 'from-green-400 to-green-600';
      case 'mezzanine': return 'from-cyan-400 to-cyan-600';
      case 'convertible': return 'from-sky-400 to-sky-600';
      default: return 'from-neutral-400 to-neutral-600';
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

  formatIndustry(industry: string): string {
    return industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  }
}