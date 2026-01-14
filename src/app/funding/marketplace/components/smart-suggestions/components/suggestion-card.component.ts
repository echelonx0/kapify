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
  templateUrl: './suggestion-card.component.html',
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
  @Output() viewScoring = new EventEmitter<string>();

  // Icons
  ArrowRightIcon = ArrowRight;
  LockIcon = Lock;
  LogInIcon = LogIn;

  /**
   * Get grade based on match score
   */
  getMatchGrade(): string {
    if (this.matchScore >= 86) return 'Excellent';
    if (this.matchScore >= 71) return 'Strong';
    if (this.matchScore >= 41) return 'Medium';
    return 'Weak';
  }

  /**
   * Get color class based on grade
   */
  getMatchColor(): string {
    if (this.matchScore >= 86) return 'text-green-600';
    if (this.matchScore >= 71) return 'text-teal-600';
    if (this.matchScore >= 41) return 'text-amber-600';
    return 'text-red-600';
  }

  /**
   * Get gradient color for progress bar based on grade
   */
  getProgressGradient(): string {
    if (this.matchScore >= 86) return 'from-green-400 to-green-500';
    if (this.matchScore >= 71) return 'from-teal-400 to-teal-500';
    if (this.matchScore >= 41) return 'from-amber-400 to-amber-500';
    return 'from-red-400 to-red-500';
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

  onViewScoring() {
    this.viewScoring.emit(this.opportunity.id);
  }
}
