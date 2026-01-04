// src/app/admin/components/verification-details/verification-details.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent, UiCardComponent } from '../../../../shared/components';
import { VerificationOrganization } from '../../../services/organization-verification.service';
import { DocumentMetadata } from '../../../../shared/services/supabase-document.service';
import { MessageThread } from 'src/app/messaging/services/messaging.service';
 
type ActiveTab = 'details' | 'documents' | 'messaging' | 'activity';

@Component({
  selector: 'app-verification-details',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, UiCardComponent],
  templateUrl: 'verification-details.component.html',
})
export class VerificationDetailsComponent {
  @Input() selectedOrganization: VerificationOrganization | null = null;
  @Input() activeTab: ActiveTab = 'details';
  @Input() documents: DocumentMetadata[] = [];
  @Input() verificationThread: MessageThread | null = null;

  @Output() tabChanged = new EventEmitter<ActiveTab>();
  @Output() approveRequested = new EventEmitter<void>();
  @Output() rejectRequested = new EventEmitter<void>();
  @Output() infoRequested = new EventEmitter<void>();
  @Output() documentSelected = new EventEmitter<DocumentMetadata>();
  @Output() documentPreviewed = new EventEmitter<DocumentMetadata>();
  @Output() documentDownloaded = new EventEmitter<DocumentMetadata>();

  // Define tabs array with proper typing
  readonly tabs: ActiveTab[] = ['details', 'documents', 'messaging', 'activity'];

  getTabClasses(tab: ActiveTab): string {
    const isActive = this.activeTab === tab;
    return `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-primary-100 text-primary-800 border border-primary-200'
        : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
    }`;
  }

  getOrganizationStatusBadge(status: string): string {
    const badges = {
      'pending_verification': 'bg-warning/20 text-warning border border-warning/30',
      'active': 'bg-primary-100 text-primary-800 border border-primary-200',
      'rejected': 'bg-red-100 text-red-800 border border-red-200'
    };
    return badges[status as keyof typeof badges] || 'bg-neutral-100 text-neutral-700 border border-neutral-200';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getUserInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  }
}