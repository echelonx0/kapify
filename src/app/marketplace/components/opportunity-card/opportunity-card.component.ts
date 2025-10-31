// src/app/marketplace/opportunities-list/opportunity-card.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  Eye,
  ExternalLink,
  Clock,
  Building,
  TrendingUp,
  Award,
} from 'lucide-angular';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

@Component({
  selector: 'app-enhanced-opportunity-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: 'opportunity-card.component.html',
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class KapifyOpportunityCardComponent {
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

  // --- New helper methods ---
  private getPrimaryFundingType(): string | undefined {
    const ft = this.opportunity.fundingType;
    return Array.isArray(ft) ? ft[0] : ft;
  }

  private getAllFundingTypes(): string[] {
    const ft = this.opportunity.fundingType;
    return Array.isArray(ft) ? ft : ft ? [ft] : [];
  }

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
      case 'active':
        return 'bg-green-500';
      case 'closed':
        return 'bg-red-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  }

  getFundingTypeClass(): string {
    const primaryType = this.getPrimaryFundingType();
    switch (primaryType) {
      case 'equity':
        return 'status-badge bg-purple-100 text-purple-700';
      case 'debt':
        return 'status-badge bg-blue-100 text-blue-700';
      case 'grant':
        return 'status-badge bg-green-100 text-green-700';
      case 'mezzanine':
        return 'status-badge bg-cyan-100 text-cyan-700';
      case 'convertible':
        return 'status-badge bg-indigo-100 text-indigo-700';
      case 'purchase_order':
        return 'status-badge bg-amber-100 text-amber-700';
      case 'invoice_financing':
        return 'status-badge bg-teal-100 text-teal-700';
      default:
        return 'status-badge bg-neutral-100 text-neutral-700';
    }
  }

  formatFundingType(): string {
    const typeLabels: Record<string, string> = {
      equity: 'Equity',
      debt: 'Debt',
      mezzanine: 'Mezzanine',
      grant: 'Grant',
      convertible: 'Convertible',
      purchase_order: 'Purchase Order',
      invoice_financing: 'Invoice Financing',
    };

    const allTypes = this.getAllFundingTypes();
    return allTypes.map((t) => typeLabels[t] || t).join(', ');
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

    const locations =
      this.opportunity.eligibilityCriteria.geographicRestrictions;
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
    return industry
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
  }

  getProgressPercentage(): number {
    if (
      !this.opportunity.totalAvailable ||
      this.opportunity.totalAvailable === 0
    ) {
      return 0;
    }
    const deployed = this.opportunity.amountDeployed || 0;
    return Math.min((deployed / this.opportunity.totalAvailable) * 100, 100);
  }

  formatProgress(): string {
    const percentage = this.getProgressPercentage();
    const remaining =
      this.opportunity.totalAvailable - (this.opportunity.amountDeployed || 0);

    if (percentage === 0) {
      return 'Fully available';
    }

    if (percentage >= 100) {
      return 'Fully deployed';
    }

    return `${this.formatAmount(remaining)} remaining`;
  }

  showApplicationCount(): boolean {
    return !!(
      this.opportunity.currentApplications &&
      this.opportunity.currentApplications > 0
    );
  }

  isPopular(): boolean {
    return !!(
      this.opportunity.currentApplications &&
      this.opportunity.currentApplications > 10
    );
  }

  trackByIndustry(index: number, industry: string): string {
    return industry;
  }
}
