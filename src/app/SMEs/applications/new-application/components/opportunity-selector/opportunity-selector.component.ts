// src/app/applications/components/new-application/components/opportunity-selector/opportunity-selector.component.ts

import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle, AlertCircle, Building } from 'lucide-angular';
import { UiButtonComponent, UiCardComponent } from 'src/app/shared/components';
import { FundingOpportunity } from 'src/app/shared/models/funder.models';

@Component({
  selector: 'app-opportunity-selector',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiButtonComponent, UiCardComponent],
  templateUrl: './opportunity-selector.component.html'
})
export class OpportunitySelectorComponent {
  // Inputs
  opportunities = input.required<FundingOpportunity[]>();
  selectedOpportunityId = input<string | null>(null);
  isLoading = input<boolean>(false);
  
  // Outputs
  opportunitySelected = output<FundingOpportunity>();
  backClicked = output<void>();
  
  // Icons
  BuildingIcon = Building;
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;

  selectOpportunity(opportunity: FundingOpportunity): void {
    this.opportunitySelected.emit(opportunity);
  }

  goBack(): void {
    this.backClicked.emit();
  }

  formatCurrency(amount: number, currency: string = 'ZAR'): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getOrganizationName(opportunity: FundingOpportunity): string {
    return 'Private Funder'; // Replace with actual logic
  }
}