// src/app/funder/components/application-detail/components/application-header/application-header.component.ts

import { Component, Input, Output, EventEmitter, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  ArrowLeft,
  AlertCircle,
  Loader2,
  Settings
} from 'lucide-angular';

import { FundingApplication } from 'src/app/SMEs/models/application.models';

@Component({
  selector: 'app-application-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './application-header.component.html',
  styleUrls: ['./application-header.component.css']
})
export class ApplicationHeaderComponent {
  @Input() application!: FundingApplication;
  @Input() profileLoading = false;
  @Input() profileError: string | null = null;
  @Input() hasCompleteData = false;
  
  @Output() back = new EventEmitter<void>();
  @Output() manageStatus = new EventEmitter<void>();

  // Icons
  ArrowLeftIcon = ArrowLeft;
  AlertCircleIcon = AlertCircle;
  Loader2Icon = Loader2;
  SettingsIcon = Settings;

  statusBadgeClass = computed(() => {
    const status = this.application?.status || 'draft';
    const classMap: Record<string, string> = {
      draft: 'status-badge status-draft',
      submitted: 'status-badge status-submitted',
      under_review: 'status-badge status-under-review',
      approved: 'status-badge status-approved',
      rejected: 'status-badge status-rejected',
      withdrawn: 'status-badge status-draft'
    };
    return classMap[status] || 'status-badge status-draft';
  });

  statusText = computed(() => {
    const status = this.application?.status || 'draft';
    const statusMap: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    };
    return statusMap[status] || status;
  });

  internalStatus = computed(() => {
    return this.application?.metadata?.internalStatus || null;
  });

  priority = computed(() => {
    return this.application?.metadata?.priority || null;
  });

  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  onBack() {
    this.back.emit();
  }

  onManageStatus() {
    this.manageStatus.emit();
  }
}
