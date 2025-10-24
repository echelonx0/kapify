 
import { Component, Input, Output, EventEmitter, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  FileText, 
  Clock, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Building,
  User,
  AlertCircle,
  CheckCircle,
  LogOut
} from 'lucide-angular';
import { UserType } from '../../models/user.models';
import { ApplicationManagementService } from 'src/app/SMEs/services/application-management.service';
import { ActionModalService } from '../modal/modal.service';
 

export interface BaseApplicationCard {
  id: string;
  title: string;
  applicationNumber?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  fundingType?: string[];
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
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './application-list-card.component.html',
  styles: [`
    :host {
      display: block;
    }
    :host ::ng-deep .group {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    :host ::ng-deep .group:hover {
      transform: translateY(-2px);
    }
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

   appManagementService = inject(ApplicationManagementService);
   modalService = inject(ActionModalService);
  canWithdraw = computed(() => {
    // Only SMEs can withdraw their own applications
    return this.userType === 'sme' && 
           (this.application.status === 'draft' || this.application.status === 'submitted');
  });
  // Icons
  FileTextIcon = FileText;
  ClockIcon = Clock;
  TrendingUpIcon = TrendingUp;
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  BuildingIcon = Building;
  UserIcon = User;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  LogOutIcon = LogOut;

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

  getFundingTypeTags(): string[] {
    if (!this.application.fundingType || this.application.fundingType.length === 0) {
      return [];
    }
    return this.application.fundingType.map(type => 
      type.split('_').join(' ').charAt(0).toUpperCase() + type.split('_').join(' ').slice(1)
    );
  }

  getFundingTypeColor(type: string): string {
    const colorMap: Record<string, string> = {
      'Debt': 'bg-blue-100 text-blue-700 border border-blue-200',
      'Equity': 'bg-purple-100 text-purple-700 border border-purple-200',
      'Convertible': 'bg-indigo-100 text-indigo-700 border border-indigo-200',
      'Mezzanine': 'bg-amber-100 text-amber-700 border border-amber-200',
      'Grant': 'bg-green-100 text-green-700 border border-green-200',
      'Purchase Order': 'bg-cyan-100 text-cyan-700 border border-cyan-200',
      'Invoice Financing': 'bg-teal-100 text-teal-700 border border-teal-200'
    };
    return colorMap[type] || 'bg-slate-100 text-slate-700 border border-slate-200';
  }

  withdrawApplication(): void {
    this.modalService.showWithdrawConfirm(
      this.application.title,
      this.application.applicationNumber
    );

    const subscription = this.modalService.confirmed$.subscribe(() => {
      this.performWithdrawal();
      subscription.unsubscribe();
    });
  }

  private performWithdrawal(): void {
    this.appManagementService.updateApplicationStatus(
      this.application.id,
      'withdrawn'
    ).subscribe({
      next: (updatedApp) => {
        this.modalService.showWithdrawSuccess(this.application.title);
        this.secondaryAction.emit(updatedApp as any);
      },
      error: (error) => {
        this.modalService.showWithdrawError(
          this.application.title,
          error.message || 'Failed to withdraw application. Please try again.'
        );
      }
    });
  }
}