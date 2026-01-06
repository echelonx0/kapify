import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowRight, Lock, LogIn } from 'lucide-angular';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

@Component({
  selector: 'app-suggestion-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      class="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-all duration-200 hover:shadow-sm"
    >
      <!-- Header: Match Score & Title -->
      <div class="flex items-start justify-between gap-4 mb-4">
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-slate-900 line-clamp-2">
            {{ opportunity.title }}
          </h3>
          <p class="text-xs text-slate-600 mt-1">
            {{
              opportunity['funderName'] ||
                opportunity['funder']?.name ||
                'Funder'
            }}
          </p>
        </div>

        <!-- Match Score Badge -->
        <div class="flex-shrink-0 text-right">
          <div
            class="text-2xl font-bold text-teal-600"
            [class]="'text-' + getMatchColor()"
          >
            {{ matchScore }}%
          </div>
          <p class="text-xs text-slate-500 mt-0.5">Match</p>
        </div>
      </div>

      <!-- Match Score Bar -->
      <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          class="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-700"
          [style.width.%]="matchScore"
        ></div>
      </div>

      <!-- Opportunity Details -->
      <div class="space-y-3 mb-4">
        <!-- Funding Amount -->
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-600">Funding Range</span>
          <span class="font-medium text-slate-900">
            {{ formatAmount(opportunity.minInvestment) }} -
            {{ formatAmount(opportunity.maxInvestment) }}
          </span>
        </div>

        <!-- Type -->
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-600">Type</span>
          <span class="font-medium text-slate-900">
            {{ getTypeLabel(opportunity.fundingType) }}
          </span>
        </div>
      </div>

      <!-- Match Reasons (Compact) -->
      @if (matchReasons && matchReasons.length > 0) {
      <div class="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
        <p class="text-xs font-medium text-slate-900 mb-2">Why this match:</p>
        <ul class="space-y-1">
          @for (reason of matchReasons.slice(0, 2); track $index) {
          <li class="text-xs text-slate-600 flex items-start gap-2">
            <span class="text-teal-600 flex-shrink-0">•</span>
            <span>{{ reason }}</span>
          </li>
          }
        </ul>
      </div>
      }

      <!-- Action Buttons -->
      <div class="flex gap-2">
        <!-- View Details -->
        <button
          (click)="onViewDetails()"
          class="flex-1 px-3 py-2.5 bg-slate-100 text-slate-900 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors"
        >
          Details
        </button>

        <!-- Apply / Sign In / Locked -->
        @if (canApply) {
        <button
          (click)="onApply()"
          class="flex-1 px-3 py-2.5 bg-teal-500 text-white text-xs font-medium rounded-lg hover:bg-teal-600 active:bg-teal-700 transition-colors flex items-center justify-center gap-2"
        >
          <span>Apply</span>
          <lucide-icon [img]="ArrowRightIcon" [size]="14" />
        </button>
        } @else { @if (reasonMessage.includes('Sign')) {
        <button
          (click)="onSignInToApply()"
          class="flex-1 px-3 py-2.5 bg-slate-200 text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
        >
          <lucide-icon [img]="LogInIcon" [size]="14" />
          <span class="hidden xs:inline">Sign In</span>
        </button>
        } @else {
        <div
          class="flex-1 px-3 py-2.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
          title="{{ reasonMessage }}"
        >
          <lucide-icon [img]="LockIcon" [size]="14" />
          <span class="hidden xs:inline">Locked</span>
        </div>
        } }
      </div>

      <!-- Reason Message (if locked) -->
      @if (!canApply && reasonMessage) {
      <p class="text-xs text-slate-600 mt-2 text-center">
        {{ reasonMessage }}
      </p>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class SuggestionCardComponent {
  @Input() opportunity!: FundingOpportunity;
  @Input() matchScore: number = 0;
  @Input() matchReasons: string[] = [];
  @Input() canApply: boolean = false;
  @Input() reasonMessage: string = '';

  @Output() apply = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<string>();
  @Output() signIn = new EventEmitter<void>();

  // Icons
  ArrowRightIcon = ArrowRight;
  LockIcon = Lock;
  LogInIcon = LogIn;

  /**
   * Get color class based on match score
   */
  getMatchColor(): string {
    if (this.matchScore >= 85) return '2xl font-bold text-green-600';
    if (this.matchScore >= 70) return '2xl font-bold text-teal-600';
    return '2xl font-bold text-amber-600';
  }

  /**
   * Format currency amount
   */
  formatAmount(amount?: number): string {
    if (!amount) return 'N/A';
    if (amount >= 1000000) {
      return 'R' + (amount / 1000000).toFixed(1) + 'M';
    }
    if (amount >= 1000) {
      return 'R' + (amount / 1000).toFixed(0) + 'K';
    }
    return 'R' + amount.toFixed(0);
  }

  /**
   * Format funding type array
   */
  getTypeLabel(fundingType: string[] | string): string {
    if (!fundingType) return 'Various';
    const types = Array.isArray(fundingType) ? fundingType : [fundingType];
    return types.slice(0, 2).join(', ');
  }

  /**
   * Event handlers
   */
  onApply() {
    this.apply.emit(this.opportunity.id);
  }

  onViewDetails() {
    this.viewDetails.emit(this.opportunity.id);
  }

  onSignInToApply() {
    this.signIn.emit();
  }
}
