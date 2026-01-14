// src/app/shared/components/application-detail-modal/application-detail-modal.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, Download, FileText } from 'lucide-angular';
import { FundingApplicationCoverInformation } from 'src/app/shared/models/funding-application-cover.model';

export interface ApplicationDetailModalData {
  id: string;
  title: string;
  applicantOrganizationName?: string;
  fundingRequest?: FundingApplicationCoverInformation;
  applicantName?: string;
  status: string;
  stage: string;
  requestedAmount: number;
  currency: string;
  description?: string;
  formData?: Record<string, any>;
  submittedAt?: Date;
  createdAt?: Date;
  matchScore?: number;
  fundingPurpose?: string;
  completionScore?: number;
  fundingRequirements?: {
    totalAmountRequired: number;
    currency: string;
    fundingType: 'loan' | 'grant' | 'equity' | 'convertible' | 'revenue_share';
    fundingPurpose: string;
    timeline: string;
    repaymentTerms?: string;
    collateral?: string;
  };
  applicant?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    companyName?: string;
  };
  opportunity?: {
    title?: string;
    fundingType?: string[];
    currency?: string;
  };
}

@Component({
  selector: 'app-application-detail-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './application-detail-modal.component.html',
  styles: [
    `
      :host ::ng-deep {
        .space-y-6 > * + * {
          margin-top: 1.5rem;
        }
        .space-y-3 > * + * {
          margin-top: 0.75rem;
        }
        .space-y-2 > * + * {
          margin-top: 0.5rem;
        }
      }
    `,
  ],
})
export class ApplicationDetailModalComponent {
  @Input() set application(
    value: ApplicationDetailModalData | null | undefined
  ) {
    if (value) {
      this.data.set(value);
      this.isOpen.set(true);
    }
  }

  @Output() onClose = new EventEmitter<void>();
  @Output() onDownload = new EventEmitter<ApplicationDetailModalData>();

  isOpen = signal(false);
  data = signal<ApplicationDetailModalData | null>(null);

  readonly FileTextIcon = FileText;
  readonly CloseIcon = X;
  readonly DownloadIcon = Download;

  canDownload = computed(() => {
    const app = this.getCurrentData();
    return app?.status === 'under_review' || app?.status === 'submitted';
  });

  hasFundingRequest = computed(() => {
    const app = this.getCurrentData();
    return !!app?.fundingRequest;
  });

  getCurrentData(): ApplicationDetailModalData | null {
    return this.data();
  }

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.onClose.emit();
    setTimeout(() => {
      this.data.set(null);
    }, 300);
  }

  onDownloadClick(): void {
    const current = this.getCurrentData();
    if (current) {
      this.onDownload.emit(current);
    }
  }

  getStatusColor(status?: string): string {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200/50 text-green-700';
      case 'rejected':
        return 'bg-red-50 border-red-200/50 text-red-700';
      case 'under_review':
        return 'bg-amber-50 border-amber-200/50 text-amber-700';
      case 'submitted':
        return 'bg-teal-50 border-teal-200/50 text-teal-700';
      case 'draft':
        return 'bg-slate-100 border-slate-200/50 text-slate-600';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-600';
    }
  }

  getMatchScoreBadgeColor(score: number): string {
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  }

  getFundingTypeColor(fundingType?: string): string {
    switch (fundingType) {
      case 'equity':
        return 'bg-blue-50 text-blue-700 border-blue-200/50';
      case 'loan':
        return 'bg-amber-50 text-amber-700 border-amber-200/50';
      case 'debt':
        return 'bg-amber-50 text-amber-700 border-amber-200/50';
      case 'grant':
        return 'bg-green-50 text-green-700 border-green-200/50';
      case 'convertible':
        return 'bg-purple-50 text-purple-700 border-purple-200/50';
      case 'revenue_share':
        return 'bg-teal-50 text-teal-700 border-teal-200/50';
      case 'mezzanine':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/50';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200/50';
    }
  }

  formatFundingType(fundingType?: string | string[]): string {
    if (!fundingType) return '';
    const types = Array.isArray(fundingType) ? fundingType : [fundingType];
    return types
      .map((type) =>
        type
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      )
      .join(', ');
  }

  formatCurrency(amount: number, currency?: string): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency || 'ZAR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date?: Date | string): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }
}
