// opportunities-grid.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KapifyOpportunityCardComponent } from './opportunity-card.component';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

@Component({
  selector: 'app-opportunities-grid',
  standalone: true,
  imports: [CommonModule, KapifyOpportunityCardComponent],
  template: `
    <div class="space-y-6">
      <!-- Opportunities List -->
      <div class="grid gap-6 mb-8">
        <app-enhanced-opportunity-card
          *ngFor="let opportunity of opportunities; trackBy: trackByOpportunity"
          [opportunity]="opportunity"
          [canApply]="canApply"
          [canManage]="canManageOpportunity(opportunity)"
          (apply)="apply.emit($event)"
          (viewDetails)="viewDetails.emit($event)"
          (manage)="manage.emit($event)"
          (signInToApply)="signInToApply.emit()"
        >
        </app-enhanced-opportunity-card>
      </div>

      <!-- Load More Button (if needed) -->
      <div *ngIf="opportunities.length >= 10" class="text-center pt-8">
        <button
          class="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-all duration-200"
        >
          Load More Opportunities
        </button>
      </div>
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
export class OpportunitiesGridComponent {
  @Input() opportunities: FundingOpportunity[] = [];
  @Input() userType: string = '';
  @Input() canApply: boolean = false;
  @Output() apply = new EventEmitter<string>();
  @Output() viewDetails = new EventEmitter<string>();
  @Output() manage = new EventEmitter<string>();
  @Output() signInToApply = new EventEmitter<void>();

  trackByOpportunity(index: number, opportunity: FundingOpportunity): string {
    return opportunity.id;
  }

  getResultsTitle(): string {
    const count = this.opportunities.length;
    if (count === 0) return 'No opportunities found';
    if (count === 1) return '1 funding opportunity';
    return `${count} funding opportunities`;
  }

  getResultsSubtitle(): string {
    if (this.opportunities.length === 0) {
      return 'Try adjusting your filters to see more results';
    }
    return 'Sorted by relevance and application deadline';
  }

  canManageOpportunity(opportunity: FundingOpportunity): boolean {
    return (
      this.userType === 'Funder' && opportunity.dealLead === 'current-user-id'
    );
  }
}
