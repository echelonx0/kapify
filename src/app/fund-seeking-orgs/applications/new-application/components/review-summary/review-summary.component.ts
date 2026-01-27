import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  FileText,
  DollarSign,
  Building,
  CircleCheckBig,
  CircleAlert,
  Target,
  MapPin,
  Zap,
} from 'lucide-angular';

import { ApplicationFormData } from '../../models/application-form.model';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';
import { FundingApplicationCoverInformation } from 'src/app/shared/models/funding-application-cover.model';

@Component({
  selector: 'app-review-summary',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './review-summary.component.html',
})
export class ReviewSummaryComponent {
  // Inputs
  opportunity = input.required<FundingOpportunity>();
  formData = input.required<ApplicationFormData>();
  coverData = input<FundingApplicationCoverInformation | null>(null);
  aiAnalysisResult = input<any | null>(null);
  profileCompletion = input<number>(0);

  // Icons
  FileTextIcon = FileText;
  DollarSignIcon = DollarSign;
  CheckCircleIcon = CircleCheckBig;
  AlertCircleIcon = CircleAlert;
  BuildingIcon = Building;
  TargetIcon = Target;
  MapPinIcon = MapPin;
  ZapIcon = Zap;

  // Computed
  requestedAmount = computed(() => {
    const amount = this.formData().requestedAmount;
    return amount ? parseFloat(amount) : 0;
  });

  /**
   * Format currency with opportunity's currency code
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: this.opportunity().currency || 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Format business stage for display
   * Converts snake_case to Title Case
   */
  formatBusinessStage(stage: string): string {
    if (!stage) return '';
    return stage
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getOrganizationName(): string {
    return 'Private Funder'; // Replace with actual logic
  }
}
