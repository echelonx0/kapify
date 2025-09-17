// src/app/admin/components/organization-verification/organization-verification.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms'; 
import { MessagingService, MessageThread } from 'src/app/messaging/services/messaging.service';
import { UiButtonComponent, UiCardComponent } from 'src/app/shared/components';
import { SupabaseDocumentService, DocumentMetadata } from 'src/app/shared/services/supabase-document.service';
import { OrganizationVerificationService, VerificationOrganization, VerificationStats } from 'src/app/admin/services/organization-verification.service';
 
type ActiveTab = 'details' | 'documents' | 'messaging' | 'activity';

@Component({
  selector: 'app-organization-verification',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UiButtonComponent,
    UiCardComponent
  ],
  templateUrl: './organization-verification.component.html',
  styleUrls: ['./organization-verification.component.scss']
})
export class OrganizationVerificationComponent implements OnInit {
  private verificationService = inject(OrganizationVerificationService);
  private messagingService = inject(MessagingService);
  private documentService = inject(SupabaseDocumentService);
  private fb = inject(FormBuilder);

  // State signals
  organizations = signal<VerificationOrganization[]>([]);
  stats = signal<VerificationStats>({
    pendingCount: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalProcessed: 0
  });
  
  selectedOrganization = signal<VerificationOrganization | null>(null);
  activeTab = signal<ActiveTab>('details');
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  // Right panel data
  documents = signal<DocumentMetadata[]>([]);
  verificationThread = signal<MessageThread | null>(null);
  selectedDocument = signal<DocumentMetadata | null>(null);
  
  // Filters
  searchTerm = signal('');
  statusFilter = signal('all');
  
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
    
    return orgs.filter(org => {
      const matchesSearch = !search || 
        org.name.toLowerCase().includes(search) ||
        org.legalName?.toLowerCase().includes(search) ||
        org.registrationNumber?.toLowerCase().includes(search);
      
      const matchesStatus = status === 'all' || 
        (status === 'pending' && org.status === 'pending_verification') ||
        (status === 'with_docs' && (org.documentCount || 0) > 0) ||
        (status === 'no_docs' && (org.documentCount || 0) === 0);
      
      return matchesSearch && matchesStatus;
    });
  });

  constructor() {
    // Initialize forms
    this.approvalForm = this.fb.group({
      adminNotes: ['']
    });

    this.rejectionForm = this.fb.group({
      reason: ['', Validators.required]
    });

    this.infoRequestForm = this.fb.group({
      messageContent: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadVerificationData();
    this.setupSubscriptions();
  }

  private loadVerificationData() {
    this.isLoading.set(true);
    this.verificationService.refreshVerifications();
  }

  private setupSubscriptions() {
    // Subscribe to verification service data
    this.verificationService.organizations$.subscribe({
      next: (orgs) => {
        this.organizations.set(orgs);
        this.isLoading.set(false);
        
        // If we have a selected org, update it
        const selectedId = this.selectedOrganization()?.id;
        if (selectedId) {
          const updatedSelected = orgs.find(org => org.id === selectedId);
          if (updatedSelected) {
            this.selectedOrganization.set(updatedSelected);
          }
        }
      },
      error: (error) => {
        console.error('Error loading organizations:', error);
        this.error.set('Failed to load verification requests');
        this.isLoading.set(false);
      }
    });

    this.verificationService.stats$.subscribe({
      next: (stats) => this.stats.set(stats)
    });
  }

  // ===============================
  // ORGANIZATION SELECTION
  // ===============================

  selectOrganization(org: VerificationOrganization) {
    this.selectedOrganization.set(org);
    this.activeTab.set('details');
    this.loadOrganizationData(org);
  }

  private async loadOrganizationData(org: VerificationOrganization) {
    try {
      // Load documents
      await this.loadOrganizationDocuments(org.id);
      
      // Load verification thread if it exists
      if (org.verificationThreadId) {
        await this.loadVerificationThread(org.verificationThreadId);
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
    }
  }

  private async loadOrganizationDocuments(organizationId: string) {
    // This would need integration with your document service
    // For now, we'll set empty array as placeholder
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
  // TAB MANAGEMENT
  // ===============================

  setActiveTab(tab: ActiveTab) {
    this.activeTab.set(tab);
    
    // Load data for specific tabs
    const selectedOrg = this.selectedOrganization();
    if (!selectedOrg) return;

    switch (tab) {
      case 'documents':
        this.loadOrganizationDocuments(selectedOrg.id);
        break;
      case 'messaging':
        if (!this.verificationThread() && selectedOrg.verificationThreadId) {
          this.loadVerificationThread(selectedOrg.verificationThreadId);
        }
        break;
    }
  }

  getTabClasses(tab: ActiveTab): string {
    const isActive = this.activeTab() === tab;
    return `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-primary-100 text-primary-800 border border-primary-200'
        : 'text-neutral-600 hover:text-neutral-800 hover:bg-neutral-50'
    }`;
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
    
    this.verificationService.approveOrganization(selectedOrg.id, adminNotes).subscribe({
      next: (success) => {
        if (success) {
          this.showApprovalModal.set(false);
          this.selectedOrganization.set(null);
          console.log('Organization approved successfully');
        }
      },
      error: (error) => {
        console.error('Approval failed:', error);
        this.error.set('Failed to approve organization');
      }
    });
  }

  rejectOrganization() {
    const selectedOrg = this.selectedOrganization();
    if (!selectedOrg || !this.rejectionForm.valid) return;

    const reason = this.rejectionForm.get('reason')?.value;
    
    this.verificationService.rejectOrganization(selectedOrg.id, reason).subscribe({
      next: (success) => {
        if (success) {
          this.showRejectionModal.set(false);
          this.selectedOrganization.set(null);
          console.log('Organization rejected successfully');
        }
      },
      error: (error) => {
        console.error('Rejection failed:', error);
        this.error.set('Failed to reject organization');
      }
    });
  }

  requestMoreInfo() {
    const selectedOrg = this.selectedOrganization();
    if (!selectedOrg || !this.infoRequestForm.valid) return;

    const messageContent = this.infoRequestForm.get('messageContent')?.value;
    
    this.verificationService.requestMoreInformation(selectedOrg.id, messageContent).subscribe({
      next: (success) => {
        if (success) {
          this.showInfoRequestModal.set(false);
          this.setActiveTab('messaging'); // Switch to messaging tab
          // Reload the thread
          this.verificationService.ensureVerificationThread(selectedOrg.id).subscribe(threadId => {
            if (threadId) {
              this.loadVerificationThread(threadId);
            }
          });
        }
      },
      error: (error) => {
        console.error('Info request failed:', error);
        this.error.set('Failed to request additional information');
      }
    });
  }

  // ===============================
  // DOCUMENT MANAGEMENT
  // ===============================

  selectDocument(doc: DocumentMetadata) {
    this.selectedDocument.set(doc);
  }

  previewDocument(doc: DocumentMetadata) {
    if (doc.mimeType.includes('pdf')) {
      // Open PDF in new tab for preview
      window.open(doc.publicUrl, '_blank');
    } else if (doc.mimeType.includes('image')) {
      // Show image preview modal (implement as needed)
      this.selectedDocument.set(doc);
    } else {
      // Download for other file types
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
  // UTILITY METHODS
  // ===============================

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

  getDocumentIcon(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'file-text';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'table';
    if (mimeType.includes('document') || mimeType.includes('word')) return 'file-text';
    return 'file';
  }

  getUserInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  }

  getOrganizationStatusBadge(status: string): string {
    const badges = {
      'pending_verification': 'bg-warning/20 text-warning border border-warning/30',
      'active': 'bg-primary-100 text-primary-800 border border-primary-200',
      'rejected': 'bg-red-100 text-red-800 border border-red-200'
    };
    return badges[status as keyof typeof badges] || 'bg-neutral-100 text-neutral-700 border border-neutral-200';
  }

  closeModal() {
    this.showApprovalModal.set(false);
    this.showRejectionModal.set(false);
    this.showInfoRequestModal.set(false);
  }

  refreshData() {
    this.verificationService.refreshVerifications();
  }
}