// src/app/admin/components/organization-verification/organization-verification.component.ts
import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  MessagingService,
  MessageThread,
} from 'src/app/messaging/services/messaging.service';
import { DocumentMetadata } from 'src/app/shared/services/supabase-document.service';
import {
  OrganizationVerificationService,
  VerificationOrganization,
  VerificationStats,
} from '../services/organization-verification.service';

type ActiveTab = 'details' | 'documents' | 'messaging';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-organization-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './organization-verification.component.html',
})
export class OrganizationVerificationComponent implements OnInit, OnDestroy {
  private verificationService = inject(OrganizationVerificationService);
  private messagingService = inject(MessagingService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  // State signals
  organizations = signal<VerificationOrganization[]>([]);
  stats = signal<VerificationStats>({
    pendingCount: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalProcessed: 0,
  });

  selectedOrganization = signal<VerificationOrganization | null>(null);
  activeTab = signal<ActiveTab>('details');
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Right panel data
  documents = signal<DocumentMetadata[]>([]);
  verificationThread = signal<MessageThread | null>(null);

  // Filters
  searchTerm = signal('');
  statusFilter = signal('pending'); // Default to pending
  subFilter = signal('all');
  sortDirection = signal<SortDirection>('desc');

  // Sub-filter options for secondary bar
  subFilterOptions = computed(() => {
    const filtered = this.filteredOrganizations();
    const withDocs = filtered.filter((org) => (org.documentCount || 0) > 0);
    const processed = filtered.filter((org) => org.verificationThreadId);

    return [
      { label: 'All', value: 'all', count: filtered.length },
      { label: 'With Documents', value: 'with_docs', count: withDocs.length },
      {
        label: 'Has been processed',
        value: 'processed',
        count: processed.length,
      },
    ];
  });

  // Modal states
  showApprovalModal = signal(false);
  showRejectionModal = signal(false);
  showInfoRequestModal = signal(false);

  // Forms
  approvalForm: FormGroup;
  rejectionForm: FormGroup;
  infoRequestForm: FormGroup;

  // Computed properties
  filteredOrganizations = computed(() => {
    const orgs = this.organizations();
    const search = this.searchTerm().toLowerCase();
    const status = this.statusFilter();

    return orgs.filter((org) => {
      const matchesSearch =
        !search ||
        org.name.toLowerCase().includes(search) ||
        org.legalName?.toLowerCase().includes(search) ||
        org.registrationNumber?.toLowerCase().includes(search) ||
        org.email?.toLowerCase().includes(search);

      const matchesStatus =
        status === 'all' ||
        (status === 'pending' && org.status === 'pending_verification') ||
        (status === 'with_docs' && (org.documentCount || 0) > 0) ||
        (status === 'no_docs' && (org.documentCount || 0) === 0);

      return matchesSearch && matchesStatus;
    });
  });

  sortedOrganizations = computed(() => {
    const filtered = this.filteredOrganizations();
    const subFilterValue = this.subFilter();
    const direction = this.sortDirection();

    // Apply sub-filter
    let result = filtered;
    if (subFilterValue === 'with_docs') {
      result = filtered.filter((org) => (org.documentCount || 0) > 0);
    } else if (subFilterValue === 'processed') {
      result = filtered.filter((org) => org.verificationThreadId);
    }

    // Sort by created date
    return [...result].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return direction === 'desc' ? dateB - dateA : dateA - dateB;
    });
  });

  constructor() {
    // Initialize forms
    this.approvalForm = this.fb.group({
      adminNotes: [''],
    });

    this.rejectionForm = this.fb.group({
      reason: ['', Validators.required],
    });

    this.infoRequestForm = this.fb.group({
      messageContent: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loadVerificationData();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // SETUP & DATA LOADING
  // ===============================

  private loadVerificationData() {
    this.isLoading.set(true);
    this.verificationService.refreshVerifications();
  }

  private setupSubscriptions() {
    this.verificationService.organizations$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orgs) => {
          this.organizations.set(orgs);
          this.isLoading.set(false);

          // If we have a selected org, update it
          const selectedId = this.selectedOrganization()?.id;
          if (selectedId) {
            const updatedSelected = orgs.find((org) => org.id === selectedId);
            if (updatedSelected) {
              this.selectedOrganization.set(updatedSelected);
            } else {
              this.selectedOrganization.set(null);
            }
          }
        },
        error: (error) => {
          console.error('Error loading organizations:', error);
          this.error.set('Failed to load verification requests');
          this.isLoading.set(false);
        },
      });

    this.verificationService.stats$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (stats) => this.stats.set(stats),
    });
  }

  refreshData() {
    this.verificationService.refreshVerifications();
  }

  // ===============================
  // ORGANIZATION SELECTION
  // ===============================

  selectOrganization(org: VerificationOrganization) {
    // Toggle selection
    if (this.selectedOrganization()?.id === org.id) {
      this.selectedOrganization.set(null);
      this.documents.set([]);
    } else {
      this.selectedOrganization.set(org);
      this.loadOrganizationData(org);
    }
  }

  private async loadOrganizationData(org: VerificationOrganization) {
    try {
      await this.loadOrganizationDocuments(org.id);

      if (org.verificationThreadId) {
        await this.loadVerificationThread(org.verificationThreadId);
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
    }
  }

  private async loadOrganizationDocuments(organizationId: string) {
    // Placeholder - integrate with your document service
    this.documents.set([]);
  }

  private async loadVerificationThread(threadId: string) {
    try {
      const thread = this.messagingService.getThread(threadId);
      this.verificationThread.set(thread);
    } catch (error) {
      console.error('Error loading verification thread:', error);
    }
  }

  // ===============================
  // FILTER & SORT MANAGEMENT
  // ===============================

  onSearchChanged(searchTerm: string) {
    this.searchTerm.set(searchTerm);
  }

  onFilterChanged(filter: string) {
    this.statusFilter.set(filter);
    this.subFilter.set('all'); // Reset sub-filter when main filter changes
  }

  onSubFilterChanged(filter: string) {
    this.subFilter.set(filter);
  }

  toggleSort() {
    this.sortDirection.set(this.sortDirection() === 'desc' ? 'asc' : 'desc');
  }

  // ===============================
  // VERIFICATION ACTIONS
  // ===============================

  openApprovalModal() {
    this.approvalForm.reset();
    this.showApprovalModal.set(true);
  }

  openRejectionModal() {
    this.rejectionForm.reset();
    this.showRejectionModal.set(true);
  }

  openInfoRequestModal() {
    this.infoRequestForm.reset();
    this.showInfoRequestModal.set(true);
  }

  approveOrganization() {
    const selectedOrg = this.selectedOrganization();
    if (!selectedOrg || !this.approvalForm.valid) return;

    const adminNotes = this.approvalForm.get('adminNotes')?.value;

    this.verificationService
      .approveOrganization(selectedOrg.id, adminNotes)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.showApprovalModal.set(false);
            this.selectedOrganization.set(null);
          }
        },
        error: (error) => {
          console.error('Approval failed:', error);
          this.error.set('Failed to approve organization');
        },
      });
  }

  rejectOrganization() {
    const selectedOrg = this.selectedOrganization();
    if (!selectedOrg || !this.rejectionForm.valid) return;

    const reason = this.rejectionForm.get('reason')?.value;

    this.verificationService
      .rejectOrganization(selectedOrg.id, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.showRejectionModal.set(false);
            this.selectedOrganization.set(null);
          }
        },
        error: (error) => {
          console.error('Rejection failed:', error);
          this.error.set('Failed to reject organization');
        },
      });
  }

  requestMoreInfo() {
    const selectedOrg = this.selectedOrganization();
    if (!selectedOrg || !this.infoRequestForm.valid) return;

    const messageContent = this.infoRequestForm.get('messageContent')?.value;

    this.verificationService
      .requestMoreInformation(selectedOrg.id, messageContent)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.showInfoRequestModal.set(false);

            // Reload the thread
            this.verificationService
              .ensureVerificationThread(selectedOrg.id)
              .pipe(takeUntil(this.destroy$))
              .subscribe((threadId) => {
                if (threadId) {
                  this.loadVerificationThread(threadId);
                }
              });
          }
        },
        error: (error) => {
          console.error('Info request failed:', error);
          this.error.set('Failed to request additional information');
        },
      });
  }

  // ===============================
  // DOCUMENT MANAGEMENT
  // ===============================

  previewDocument(doc: DocumentMetadata) {
    if (doc.mimeType.includes('pdf')) {
      window.open(doc.publicUrl, '_blank');
    } else if (doc.mimeType.includes('image')) {
      window.open(doc.publicUrl, '_blank');
    } else {
      this.downloadDocument(doc);
    }
  }

  downloadDocument(doc: DocumentMetadata) {
    const link = document.createElement('a');
    link.href = doc.publicUrl;
    link.download = doc.originalName;
    link.click();
  }

  // ===============================
  // MODAL MANAGEMENT
  // ===============================

  closeModal() {
    this.showApprovalModal.set(false);
    this.showRejectionModal.set(false);
    this.showInfoRequestModal.set(false);
  }

  // ===============================
  // UI HELPER METHODS
  // ===============================

  getOrgInitials(org: VerificationOrganization): string {
    const words = org.name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return org.name.substring(0, 2).toUpperCase();
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  getCurrentDateRange(): string {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
    };

    return `${formatDate(weekAgo)} - ${formatDate(today)}`;
  }

  getFilterButtonClasses(filterValue: string): string {
    const isActive = this.statusFilter() === filterValue;
    const baseClasses =
      'px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center space-x-2';
    const activeClasses = isActive
      ? 'bg-orange-500 text-white'
      : 'bg-slate-100 text-slate-700 hover:bg-slate-200';

    return `${baseClasses} ${activeClasses}`;
  }

  getSubFilterButtonClasses(filterValue: string): string {
    const isActive = this.subFilter() === filterValue;
    const baseClasses =
      'px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center space-x-2';
    const activeClasses = isActive
      ? 'bg-blue-500 text-white'
      : 'bg-slate-100 text-slate-700 hover:bg-slate-200';

    return `${baseClasses} ${activeClasses}`;
  }

  getSubFilterCountClasses(filterValue: string): string {
    const isActive = this.subFilter() === filterValue;
    const baseClasses = 'px-2 py-0.5 rounded-full text-xs font-semibold';
    const activeClasses = isActive
      ? 'bg-white/20 text-white'
      : 'bg-slate-200 text-slate-700';

    return `${baseClasses} ${activeClasses}`;
  }
}
