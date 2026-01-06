import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Building,
  DollarSign,
  Clock,
  AlertCircle,
  Users,
  Eye,
  TrendingUp,
  FileText,
  Ban,
} from 'lucide-angular';
import { UiCardComponent } from 'src/app/shared/components';
import { ApplicationStepId } from '../../models/application-form.model';
import { FundingOpportunity } from 'src/app/funder/create-opportunity/shared/funding.interfaces';

@Component({
  selector: 'app-opportunity-sidebar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiCardComponent],
  templateUrl: './opportunity-sidebar.component.html',
})
export class OpportunitySidebarComponent {
  // Inputs
  opportunity = input<FundingOpportunity | null>(null);
  currentStep = input.required<ApplicationStepId>();
  aiAnalysisResult = input<any | null>(null);

  // Icons
  BuildingIcon = Building;
  DollarSignIcon = DollarSign;
  ClockIcon = Clock;
  AlertCircleIcon = AlertCircle;
  UsersIcon = Users;
  EyeIcon = Eye;
  TrendingUpIcon = TrendingUp;
  FileTextIcon = FileText;
  BanIcon = Ban;

  // Computed
  showAIInsights = computed(() => {
    return (
      this.currentStep() === 'ai-analysis' || this.aiAnalysisResult() !== null
    );
  });

  formatCurrency(amount: number, currency: string = 'ZAR'): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  getOrganizationName(): string {
    return 'Private Funder';
  }

  getApplicationProgress(): number {
    const opp = this.opportunity();
    if (!opp || !opp.maxApplications) return 0;
    return Math.round(
      ((opp.currentApplications || 0) / opp.maxApplications) * 100
    );
  }

  getFundingTypesDisplay(): string {
    const opp = this.opportunity();
    if (!opp?.fundingType || opp.fundingType.length === 0)
      return 'Not specified';
    return opp.fundingType
      .map(
        (type) =>
          type.split('_').join(' ').charAt(0).toUpperCase() +
          type.split('_').join(' ').slice(1)
      )
      .join(', ');
  }

  getEligibilitySummary(): string[] {
    const opp = this.opportunity();
    if (!opp?.eligibilityCriteria) return [];

    const criteria = opp.eligibilityCriteria;
    const summary: string[] = [];

    if (criteria.industries?.length) {
      summary.push(`Industries: ${criteria.industries.join(', ')}`);
    }
    if (criteria.businessStages?.length) {
      summary.push(`Stages: ${criteria.businessStages.join(', ')}`);
    }
    if (criteria.minRevenue || criteria.maxRevenue) {
      const min = criteria.minRevenue
        ? this.formatCurrency(criteria.minRevenue)
        : 'Any';
      const max = criteria.maxRevenue
        ? this.formatCurrency(criteria.maxRevenue)
        : 'Any';
      summary.push(`Revenue: ${min} - ${max}`);
    }
    if (criteria.minYearsOperation) {
      summary.push(`Min. ${criteria.minYearsOperation} years in operation`);
    }
    if (criteria.requiresCollateral) {
      summary.push('Collateral required');
    }

    return summary;
  }

  getExclusionCriteria(): string[] {
    return this.opportunity()?.exclusionCriteria || [];
  }
}
