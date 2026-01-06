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

export interface ApplicationDetailModalData {
  id: string;
  title: string;
  applicantOrganizationName?: string;
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
  completionScore?: number;
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
  template: `
    <!-- Backdrop -->
    <div
      *ngIf="isOpen()"
      (click)="close()"
      class="fixed inset-0 bg-black/25 backdrop-blur-sm z-40 transition-opacity duration-300"
    ></div>

    <!-- Modal -->
    <div
      *ngIf="isOpen()"
      class="fixed right-0 top-0 h-screen w-full md:w-96 bg-white shadow-xl z-50 overflow-y-auto transition-transform duration-300"
    >
      <!-- Header -->
      <div
        class="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center"
          >
            <lucide-angular
              [img]="FileTextIcon"
              size="20"
              class="text-teal-600"
            ></lucide-angular>
          </div>
          <h3 class="text-lg font-bold text-slate-900">Application Details</h3>
        </div>
        <button
          (click)="close()"
          class="text-slate-600 hover:text-slate-900 transition-colors"
        >
          <lucide-angular [img]="CloseIcon" size="20"></lucide-angular>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Header -->
        <div>
          <h4 class="text-2xl font-bold text-slate-900 mb-2">
            {{
              getCurrentData()?.applicantOrganizationName ||
                getCurrentData()?.applicantName
            }}
          </h4>
          <div class="flex items-center gap-2">
            <span
              [class]="
                'px-2.5 py-1 rounded-full text-xs font-semibold border ' +
                getStatusColor(getCurrentData()?.status)
              "
            >
              {{ getCurrentData()?.status }}
            </span>
            @if (getCurrentData()?.matchScore) {
            <span
              [class]="
                'px-2.5 py-1 rounded-full text-xs font-semibold ' +
                getMatchScoreBadgeColor(getCurrentData()?.matchScore || 0)
              "
            >
              {{ getCurrentData()?.matchScore }}% Match
            </span>
            }
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-teal-50 rounded-xl border border-teal-200/50 p-4">
            <p
              class="text-xs font-semibold text-teal-600 uppercase tracking-wide"
            >
              Requested Amount
            </p>
            <p class="text-lg font-bold text-teal-700 mt-2">
              {{
                formatCurrency(
                  getCurrentData()?.requestedAmount || 0,
                  getCurrentData()?.currency
                )
              }}
            </p>
          </div>
          <div class="bg-slate-100 rounded-xl border border-slate-200 p-4">
            <p
              class="text-xs font-semibold text-slate-600 uppercase tracking-wide"
            >
              Completion
            </p>
            <p class="text-lg font-bold text-slate-700 mt-2">
              {{ getCurrentData()?.completionScore || 0 }}%
            </p>
          </div>
        </div>

        <!-- Status & Stage -->
        <div class="space-y-3">
          <p class="text-sm font-semibold text-slate-900">Application Status</p>
          <div class="space-y-2 text-sm">
            <div
              class="flex justify-between items-center py-2 border-b border-slate-100"
            >
              <span class="text-slate-600">Status</span>
              <span class="font-medium text-slate-900">{{
                getCurrentData()?.status
              }}</span>
            </div>
            <div
              class="flex justify-between items-center py-2 border-b border-slate-100"
            >
              <span class="text-slate-600">Current Stage</span>
              <span class="font-medium text-slate-900">{{
                getCurrentData()?.stage
              }}</span>
            </div>
            @if (getCurrentData()?.submittedAt) {
            <div
              class="flex justify-between items-center py-2 border-b border-slate-100"
            >
              <span class="text-slate-600">Submitted</span>
              <span class="font-medium text-slate-900">
                {{ formatDate(getCurrentData()?.submittedAt) }}
              </span>
            </div>
            }
            <div class="flex justify-between items-center py-2">
              <span class="text-slate-600">Created</span>
              <span class="font-medium text-slate-900">
                {{ formatDate(getCurrentData()?.createdAt) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Business Info -->
        @if (getCurrentData()?.applicant) {
        <div class="space-y-3">
          <p class="text-sm font-semibold text-slate-900">Contact Details</p>
          <div class="space-y-2 text-sm">
            @if (getCurrentData()?.applicant?.firstName) {
            <div
              class="flex justify-between items-center py-2 border-b border-slate-100"
            >
              <span class="text-slate-600">Name</span>
              <span class="font-medium text-slate-900">
                {{ getCurrentData()?.applicant?.firstName }}
                {{ getCurrentData()?.applicant?.lastName }}
              </span>
            </div>
            } @if (getCurrentData()?.applicant?.email) {
            <div
              class="flex justify-between items-center py-2 border-b border-slate-100"
            >
              <span class="text-slate-600">Email</span>
              <span class="font-medium text-slate-900 truncate">
                {{ getCurrentData()?.applicant?.email }}
              </span>
            </div>
            } @if (getCurrentData()?.applicant?.companyName) {
            <div class="flex justify-between items-center py-2">
              <span class="text-slate-600">Organization</span>
              <span class="font-medium text-slate-900">
                {{ getCurrentData()?.applicant?.companyName }}
              </span>
            </div>
            }
          </div>
        </div>
        }

        <!-- Funding Details -->
        @if (getCurrentData()?.opportunity) {
        <div class="space-y-3">
          <p class="text-sm font-semibold text-slate-900">
            Funding Opportunity
          </p>
          <div
            class="bg-gradient-to-br from-teal-50 to-slate-50 rounded-xl border border-teal-200/50 p-4 space-y-3"
          >
            @if (getCurrentData()?.opportunity?.title) {
            <div>
              <p
                class="text-xs font-semibold text-teal-600 uppercase tracking-wide"
              >
                Opportunity
              </p>
              <p class="text-sm font-bold text-teal-700 mt-1">
                {{ getCurrentData()?.opportunity?.title }}
              </p>
            </div>
            } @if (getCurrentData()?.opportunity?.fundingType) {
            <div class="flex gap-2 flex-wrap">
              <span
                *ngFor="let type of getCurrentData()?.opportunity?.fundingType"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-700 border border-teal-200/50"
              >
                {{ type }}
              </span>
            </div>
            }
          </div>
        </div>
        }

        <!-- Description -->
        @if (getCurrentData()?.description) {
        <div class="space-y-3">
          <p class="text-sm font-semibold text-slate-900">Description</p>
          <p class="text-sm text-slate-600 leading-relaxed">
            {{ getCurrentData()?.description }}
          </p>
        </div>
        }

        <!-- Actions -->
        <div class="flex items-center gap-3 pt-6 border-t border-slate-200">
          @if (canDownload()) {
          <button
            (click)="onDownloadClick()"
            class="flex-1 bg-teal-500 text-white font-medium py-2.5 rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <lucide-angular [img]="DownloadIcon" size="16"></lucide-angular>
            Download
          </button>
          }
          <button
            (click)="close()"
            class="flex-1 bg-slate-100 text-slate-700 font-medium py-2.5 rounded-xl hover:bg-slate-200 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  `,
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
