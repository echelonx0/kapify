import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KapifyOpportunityCardComponent } from '../opportunity-card/opportunity-card.component';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

@Component({
  selector: 'app-opportunities-grid',
  standalone: true,
  imports: [CommonModule, KapifyOpportunityCardComponent],
  template: `
    <div class="space-y-6">
      <!-- Opportunities List -->
      <div class="grid gap-6">
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

  canManageOpportunity(opportunity: FundingOpportunity): boolean {
    return (
      this.userType === 'Funder' && opportunity.dealLead === 'current-user-id'
    );
  }
}
