// src/app/marketplace/components/suggestion-card.component.ts
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronDown, ChevronUp, DollarSign, Award, Building2, TrendingUp, Sparkles } from 'lucide-angular';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
 
@Component({
  selector: 'app-suggestion-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: 'suggestion-card.component.html',
  styleUrl: 'suggestion-card.component.css'
})
export class SuggestionCardComponent {
  @Input() opportunity!: FundingOpportunity;
  @Input() matchScore: number = 0;
  @Input() matchReasons: string[] = [];
  @Input() canApply: boolean = false;

  @Output() apply = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<string>();
  @Output() signIn = new EventEmitter<void>();

  isExpanded = signal(false);

  // Icons
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;
  DollarSignIcon = DollarSign;
  AwardIcon = Award;
  BuildingIcon = Building2;
  TrendingUpIcon = TrendingUp;
  SparklesIcon = Sparkles;

  toggle() {
    this.isExpanded.update(v => !v);
  }

  
 getFundingTypeClass(): string {
  // Return the first type for styling, fallback to 'debt'
  if (Array.isArray(this.opportunity.fundingType) && this.opportunity.fundingType.length > 0) {
    return this.opportunity.fundingType[0].toLowerCase();
  }
  return 'debt';
}

formatFundingType(): string {
  const types: Record<string, string> = {
    equity: 'Equity',
    debt: 'Debt',
    mezzanine: 'Mezzanine',
    grant: 'Grant',
    convertible: 'Convertible'
  };

  if (Array.isArray(this.opportunity.fundingType) && this.opportunity.fundingType.length > 0) {
    // Map array values to formatted labels
    return this.opportunity.fundingType
      .map(type => types[type.toLowerCase()] || type)
      .join(', ');
  }

  return 'Funding';
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

  getTopReason(): string {
    return this.matchReasons[0] || 'Recommended for you';
  }

  getDisplayIndustries(): string[] {
    return this.opportunity.eligibilityCriteria?.industries?.slice(0, 3) || [];
  }

  formatIndustry(industry: string): string {
    return industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getProgressPercentage(): number {
    if (!this.opportunity.totalAvailable) return 0;
    const deployed = this.opportunity.amountDeployed || 0;
    return Math.min((deployed / this.opportunity.totalAvailable) * 100, 100);
  }

  formatAvailable(): string {
    const remaining = this.opportunity.totalAvailable - (this.opportunity.amountDeployed || 0);
    return this.formatAmount(remaining);
  }

  onApply(event: Event) {
    event.stopPropagation();
    this.apply.emit(this.opportunity.id);
  }

  onViewDetails(event: Event) {
    event.stopPropagation();
    this.viewDetails.emit(this.opportunity.id);
  }

  onSignIn(event: Event) {
    event.stopPropagation();
    this.signIn.emit();
  }
}