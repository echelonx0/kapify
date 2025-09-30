// src/app/applications/components/new-application/components/review-summary/review-summary.component.ts

import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText, DollarSign, CheckCircle, AlertCircle, Building } from 'lucide-angular';
import { FundingOpportunity } from 'src/app/shared/models/funder.models'; 
import { ApplicationFormData } from '../../models/application-form.model';

@Component({
  selector: 'app-review-summary',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './review-summary.component.html'
})
export class ReviewSummaryComponent {
  // Inputs
  opportunity = input.required<FundingOpportunity>();
  formData = input.required<ApplicationFormData>();
  aiAnalysisResult = input<any | null>(null);
  profileCompletion = input<number>(0);
  
  // Icons
  FileTextIcon = FileText;
  DollarSignIcon = DollarSign;
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  BuildingIcon = Building;

  // Computed
  requestedAmount = computed(() => {
    const amount = this.formData().requestedAmount;
    return amount ? parseFloat(amount) : 0;
  });

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: this.opportunity().currency || 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getOrganizationName(): string {
    return 'Private Funder'; // Replace with actual logic
  }
}