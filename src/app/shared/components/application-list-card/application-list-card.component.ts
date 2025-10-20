// src/app/shared/components/application-list-card/application-list-card.component.ts
import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  FileText, 
  Clock, 
  TrendingUp, 
  DollarSign,
  Eye,
  Calendar,
  Building,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-angular';
import { UserType } from '../../models/user.models';

export interface BaseApplicationCard {
  id: string;
  title: string;
  applicationNumber?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  fundingType?: string;
  requestedAmount: number;
  currency: string;
  currentStage?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  applicantName?: string;
  applicantCompany?: string;
  opportunityTitle?: string;
  opportunityId?: string;
}
 
@Component({
  selector: 'app-application-list-card',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule
  ],
  templateUrl: './application-list-card.component.html',
  styles: [`
    :host {
      display: block;
    }

    /* Smooth hover animations */
    :host ::ng-deep .group {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    :host ::ng-deep .group:hover {
      transform: translateY(-2px);
    }

    /* Status accent gradient */
    .accent-draft {
      background: linear-gradient(90deg, #94a3b8, #cbd5e1);
    }

    .accent-submitted {
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
    }

    .accent-under-review {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }

    .accent-approved {
      background: linear-gradient(90deg, #10b981, #34d399);
    }

    .accent-rejected {
      background: linear-gradient(90deg, #ef4444, #f87171);
    }

    .accent-withdrawn {
      background: linear-gradient(90deg, #6b7280, #9ca3af);
    }
  `]
})
export class ApplicationListCardComponent {
  @Input({ required: true }) application!: BaseApplicationCard;
  @Input() userType: UserType = 'sme';
  @Input() showProgress: boolean = true;
  
  @Output() primaryAction = new EventEmitter<BaseApplicationCard>();
  @Output() secondaryAction = new EventEmitter<BaseApplicationCard>();
  @Output() viewDetails = new EventEmitter<BaseApplicationCard>();

  // Icons
  FileTextIcon = FileText;
  ClockIcon = Clock;
  TrendingUpIcon = TrendingUp;
  DollarSignIcon = DollarSign;
  EyeIcon = Eye;
  CalendarIcon = Calendar;
  BuildingIcon = Building;
  UserIcon = User;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;

  // Computed properties
  statusText = computed(() => {
    const statusMap: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    };
    return statusMap[this.application.status] || this.application.status;
  });

  statusBadgeClass = computed(() => {
    const baseClass = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold';
    const statusClass = `status-${this.application.status.replace('_', '-')}`;
    
    const classMap: Record<string, string> = {
      'status-draft': `${baseClass} bg-slate-100 text-slate-700 border border-slate-200/50`,
      'status-submitted': `${baseClass} bg-blue-50 text-blue-700 border border-blue-200/50`,
      'status-under-review': `${baseClass} bg-amber-50 text-amber-700 border border-amber-200/50`,
      'status-approved': `${baseClass} bg-green-50 text-green-700 border border-green-200/50`,
      'status-rejected': `${baseClass} bg-red-50 text-red-700 border border-red-200/50`,
      'status-withdrawn': `${baseClass} bg-slate-50 text-slate-700 border border-slate-200/50`
    };
    
    return classMap[statusClass] || classMap['status-draft'];
  });

  getStatusAccentClass = (): string => {
    const classMap: Record<string, string> = {
      'draft': 'accent-draft',
      'submitted': 'accent-submitted',
      'under_review': 'accent-under-review',
      'approved': 'accent-approved',
      'rejected': 'accent-rejected',
      'withdrawn': 'accent-withdrawn'
    };
    return classMap[this.application.status] || 'accent-draft';
  };

  statusIcon = computed(() => {
    const iconMap: Record<string, any> = {
      draft: FileText,
      submitted: Clock,
      under_review: Clock,
      approved: CheckCircle,
      rejected: AlertCircle,
      withdrawn: AlertCircle
    };
    return iconMap[this.application.status] || FileText;
  });

  dateLabel = computed(() => {
    if (this.application.submittedAt) {
      return 'Submitted';
    }
    return 'Last Updated';
  });

  dateValue = computed(() => {
    return this.application.submittedAt || this.application.updatedAt;
  });

  // Methods
  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  }

  formatDate(date: Date): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  }

  getProgress(): number {
    const progressMap: Record<string, number> = {
      draft: 10,
      submitted: 25,
      under_review: 60,
      approved: 100,
      rejected: 100,
      withdrawn: 0
    };
    return progressMap[this.application.status] || 0;
  }
}