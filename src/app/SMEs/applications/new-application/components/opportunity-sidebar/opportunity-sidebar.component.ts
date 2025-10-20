// src/app/applications/components/new-application/components/opportunity-sidebar/opportunity-sidebar.component.ts

import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Building, DollarSign, Clock, AlertCircle, Users, Eye, TrendingUp, FileText } from 'lucide-angular';
import { UiCardComponent } from 'src/app/shared/components';
import { FundingOpportunity } from 'src/app/shared/models/funder.models'; 
import { ApplicationStepId } from '../../models/application-form.model';

@Component({
  selector: 'app-opportunity-sidebar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UiCardComponent],
  templateUrl: './opportunity-sidebar.component.html'
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

  // Computed
  showAIInsights = computed(() => {
    return this.currentStep() === 'ai-analysis' || this.aiAnalysisResult() !== null;
  });

  formatCurrency(amount: number, currency: string = 'ZAR'): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getOrganizationName(): string {
    return 'Private Funder';  
  }

  getApplicationProgress(): number {
    const opp = this.opportunity();
    if (!opp || !opp.maxApplications) return 0;
    return Math.round(((opp.currentApplications || 0) / opp.maxApplications) * 100);
  }
}