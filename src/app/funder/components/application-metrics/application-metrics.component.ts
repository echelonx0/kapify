// src/app/funder/components/application-detail/components/application-metrics/application-metrics.component.ts

import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  DollarSign,
  Calendar,
  Building,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-angular';

import { FundingApplication } from 'src/app/SMEs/models/application.models';
import { FundingOpportunity } from '../../create-opportunity/shared/funding.interfaces';
 
interface TimelineEvent {
  label: string;
  date: Date | null;
  icon: any;
  completed: boolean;
}

@Component({
  selector: 'app-application-metrics',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './application-metrics.component.html',
  styleUrls: ['./application-metrics.component.css']
})
export class ApplicationMetricsComponent {
  @Input() application!: FundingApplication;
  @Input() opportunity!: FundingOpportunity;

  // Icons
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  BuildingIcon = Building;
  TrendingUpIcon = TrendingUp;
  ClockIcon = Clock;
  CheckCircleIcon = CheckCircle;

  requestedAmount = computed(() => {
    const formData = this.application?.formData as any;
    const amount = formData?.requestedAmount;
    
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  });

  timeline = computed(() => {
    const formData = this.application?.formData as any;
    return formData?.timeline || null;
  });

  useOfFunds = computed(() => {
    const formData = this.application?.formData as any;
    return formData?.useOfFunds || null;
  });

  timelineEvents = computed((): TimelineEvent[] => {
    const app = this.application;
    if (!app) return [];

    return [
      {
        label: 'Application Created',
        date: app.createdAt,
        icon: this.ClockIcon,
        completed: !!app.createdAt
      },
      {
        label: 'Submitted',
        date: app.submittedAt || null,
        icon: this.CheckCircleIcon,
        completed: !!app.submittedAt
      },
      {
        label: 'Review Started',
        date: app.reviewStartedAt || null,
        icon: this.ClockIcon,
        completed: !!app.reviewStartedAt
      },
      {
        label: 'Decision Made',
        date: app.decidedAt || null,
        icon: this.CheckCircleIcon,
        completed: !!app.decidedAt
      }
    ];
  });

  formatCurrency(amount: number, currency: string = 'ZAR'): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  formatDateShort(date: Date): string {
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
}
