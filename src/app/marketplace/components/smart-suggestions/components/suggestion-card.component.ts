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
  styles: [`
    .suggestion-card {
      position: relative;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      border: 2px solid transparent;
    }

    .suggestion-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-color: #e0e7ff;
      transform: translateY(-2px);
    }

    .suggestion-card.expanded {
      border-color: #6366f1;
    }

    /* Match Badge */
    .match-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 56px;
      height: 56px;
      z-index: 10;
    }

    .match-ring {
      width: 56px;
      height: 56px;
      transform: rotate(-90deg);
    }

    .match-score {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: baseline;
      font-weight: 700;
    }

    .score-number {
      font-size: 16px;
      color: #10b981;
      line-height: 1;
    }

    .score-percent {
      font-size: 10px;
      color: #10b981;
      margin-left: 1px;
    }

    /* Card Header */
    .card-header {
      padding: 20px;
      padding-right: 80px;
      cursor: pointer;
      user-select: none;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .title-section {
      flex: 1;
      min-width: 0;
    }

    .opportunity-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 6px 0;
      line-height: 1.3;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .funder-name {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #6b7280;
      font-weight: 500;
    }

    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      color: #10b981;
      font-weight: 600;
      padding: 2px 6px;
      background: #d1fae5;
      border-radius: 4px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .funding-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .funding-badge.equity { background: #ede9fe; color: #7c3aed; }
    .funding-badge.debt { background: #dbeafe; color: #2563eb; }
    .funding-badge.grant { background: #d1fae5; color: #059669; }
    .funding-badge.convertible { background: #e0e7ff; color: #4f46e5; }
    .funding-badge.mezzanine { background: #cffafe; color: #0891b2; }

    .expand-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: #f3f4f6;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .expand-btn:hover {
      background: #e5e7eb;
      color: #111827;
    }

    .amount-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      border-radius: 10px;
      margin-bottom: 12px;
    }

    .amount-text {
      font-size: 16px;
      font-weight: 700;
      color: #047857;
    }

    /* Match Reasons Compact */
    .match-reasons-compact {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
      border-radius: 8px;
      border-left: 3px solid #6366f1;
    }

    .reasons-text {
      flex: 1;
      font-size: 13px;
      color: #4338ca;
      font-weight: 500;
    }

    .more-reasons {
      font-size: 11px;
      color: #6366f1;
      font-weight: 600;
      padding: 2px 8px;
      background: white;
      border-radius: 12px;
    }

    /* Card Body (Expanded) */
    .card-body {
      padding: 0 20px 20px 20px;
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .match-reasons-full {
      margin-bottom: 20px;
      padding: 16px;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-radius: 12px;
      border: 1px solid #bae6fd;
    }

    .reasons-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #0c4a6e;
      margin: 0 0 12px 0;
    }

    .reasons-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .reasons-list li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 14px;
      color: #075985;
      line-height: 1.5;
    }

    .checkmark {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .description-section {
      margin-bottom: 16px;
    }

    .description-text {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.6;
      margin: 0;
    }

    .tags-section {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    .industry-tag {
      padding: 6px 12px;
      background: #f3f4f6;
      color: #374151;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .industry-tag.hidden {
      display: none;
    }

    .progress-section {
      margin-bottom: 20px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .progress-label {
      font-size: 13px;
      color: #6b7280;
      font-weight: 500;
    }

    .progress-value {
      font-size: 13px;
      color: #111827;
      font-weight: 700;
    }

    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
      border-radius: 4px;
      transition: width 0.6s ease;
    }

    .card-actions {
      display: flex;
      gap: 10px;
    }

    .btn-primary,
    .btn-secondary,
    .btn-outline {
      flex: 1;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
      white-space: nowrap;
    }

    .btn-primary {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    .btn-secondary {
      background: #6b7280;
      color: white;
    }

    .btn-secondary:hover {
      background: #4b5563;
    }

    .btn-outline {
      background: white;
      color: #6366f1;
      border: 2px solid #e0e7ff;
    }

    .btn-outline:hover {
      background: #eef2ff;
      border-color: #c7d2fe;
    }

    @media (max-width: 640px) {
      .card-header {
        padding-right: 70px;
      }

      .match-badge {
        width: 48px;
        height: 48px;
      }

      .match-ring {
        width: 48px;
        height: 48px;
      }

      .score-number {
        font-size: 14px;
      }

      .card-actions {
        flex-direction: column;
      }

      .btn-primary,
      .btn-secondary,
      .btn-outline {
        width: 100%;
      }
    }
  `]
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
    return this.opportunity.fundingType || 'debt';
  }

  formatFundingType(): string {
    const types: Record<string, string> = {
      equity: 'Equity',
      debt: 'Debt',
      mezzanine: 'Mezzanine',
      grant: 'Grant',
      convertible: 'Convertible'
    };
    return types[this.opportunity.fundingType] || 'Funding';
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