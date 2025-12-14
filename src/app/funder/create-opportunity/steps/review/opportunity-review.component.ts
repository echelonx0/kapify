// src/app/funder/create-opportunity/steps/review/opportunity-review.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CircleAlert, CircleX, LucideAngularModule } from 'lucide-angular';
import {
  Check,
  Target,
  DollarSign,
  MapPin,
  Building2,
  TrendingUp,
  Shield,
  Calendar,
} from 'lucide-angular';

@Component({
  selector: 'app-opportunity-review',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './opportunity-review.component.html',
})
export class OpportunityReviewComponent {
  // Icons
  AlertCircleIcon = CircleAlert;
  CheckIcon = Check;
  TargetIcon = Target;
  DollarSignIcon = DollarSign;
  MapPinIcon = MapPin;
  Building2Icon = Building2;
  TrendingUpIcon = TrendingUp;
  ShieldIcon = Shield;
  CalendarIcon = Calendar;
  XCircleIcon = CircleX;

  // Inputs from parent component
  @Input() validationErrors: Array<{ field: string; message: string }> = [];
  @Input() formData: any;

  /**
   * Get display label for business stage
   */
  getStageLabel(value: string): string {
    const stages: Record<string, string> = {
      idea: 'Idea Stage',
      startup: 'Startup',
      growth: 'Growth',
      established: 'Established',
      expansion: 'Expansion',
    };
    return stages[value] || value;
  }

  /**
   * Get display label for industry
   */
  getIndustryLabel(value: string): string {
    const industries: Record<string, string> = {
      technology: 'Technology',
      healthcare: 'Healthcare',
      finance: 'Finance',
      retail: 'Retail',
      manufacturing: 'Manufacturing',
      agriculture: 'Agriculture',
      education: 'Education',
      energy: 'Energy',
      realestate: 'Real Estate',
      hospitality: 'Hospitality',
      transportation: 'Transportation',
      construction: 'Construction',
      other: 'Other',
    };
    return industries[value] || value;
  }

  /**
   * Get display label for geographic region
   */
  getRegionLabel(value: string): string {
    const regions: Record<string, string> = {
      global: 'Global',
      northamerica: 'North America',
      southamerica: 'South America',
      europe: 'Europe',
      asia: 'Asia',
      africa: 'Africa',
      oceania: 'Oceania',
      middleeast: 'Middle East',
    };
    return regions[value] || value;
  }

  /**
   * Check if eligibility section has any data
   */
  hasEligibilityData(): boolean {
    if (!this.formData) return false;

    return !!(
      (this.formData.investmentCriteria &&
        this.formData.investmentCriteria.length > 0) ||
      (this.formData.exclusionCriteria &&
        this.formData.exclusionCriteria.length > 0) ||
      (this.formData.targetIndustries &&
        this.formData.targetIndustries.length > 0) ||
      (this.formData.businessStages &&
        this.formData.businessStages.length > 0) ||
      (this.formData.geographicRestrictions &&
        this.formData.geographicRestrictions.length > 0) ||
      this.formData.minRevenue ||
      this.formData.minYearsOperation ||
      this.formData.requiresCollateral
    );
  }

  /**
   * Format currency amount
   */
  formatAmount(amount: number | string | undefined): string {
    if (!amount) return '0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString();
  }

  /**
   * Get years operation display text
   */
  getYearsOperationText(years: string | undefined): string {
    if (!years || years === '') return 'No minimum';
    return `${years} ${parseInt(years) === 1 ? 'year' : 'years'}`;
  }
}
