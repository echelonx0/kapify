// src/app/funder/application-details/application-tabs/application-tabs.component.ts
import { Component, Input, Output, EventEmitter, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  MessageSquare, 
  TrendingUp, 
  FileText, 
  AlertCircle, 
  Search, 
  Download, 
  BarChart3,
  Eye,
  X // Added X icon for modal close
} from 'lucide-angular';
import { Subject } from 'rxjs';
import { UiButtonComponent } from 'src/app/shared/components';
import { ApplicationMessagingComponent } from 'src/app/messaging/application-messaging/application-messaging.component';
import { MessagingService } from 'src/app/messaging/services/messaging.service';
import { TestModalComponent } from 'src/app/test-modal.component';
 
interface FundingApplication {
  id: string;
  title?: string;
  applicantId?: string;
  applicant?: {
    industry?: string;
  };
  documents?: Record<string, any>;
}

interface FundingOpportunity {
  id: string;
  title?: string;
}

export type TabId = 'messages' | 'market-research' | 'documents';

interface TabData {
  id: TabId;
  label: string;
  icon: any;
  badge?: number;
}

@Component({
  selector: 'app-application-tabs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    UiButtonComponent,
    ApplicationMessagingComponent,

  ],
  templateUrl: './application-tabs.component.html',
  styleUrls: ['./application-tabs.component.css']
})
export class ApplicationTabsComponent implements OnInit, OnDestroy {
  @Input() application: FundingApplication | null = null;
  @Input() opportunity: FundingOpportunity | null = null;
  @Output() marketResearchRequested = new EventEmitter<void>();

  private messagingService = inject(MessagingService);
  private destroy$ = new Subject<void>();

  // Icons
  MessageSquareIcon = MessageSquare;
  TrendingUpIcon = TrendingUp;
  FileTextIcon = FileText;
  AlertCircleIcon = AlertCircle;
  SearchIcon = Search;
  DownloadIcon = Download;
  BarChart3Icon = BarChart3;
  EyeIcon = Eye;
  XIcon = X; // Added X icon

  // State
  activeTab = signal<TabId>('messages');
  
  // Market research state
  isGeneratingResearch = signal(false);
  marketResearchGenerated = signal(false);
  researchError = signal<string | null>(null);

  // Message badge count - computed from messaging service
  messagesBadgeCount = signal(0);

  // Document modal state
  selectedDocument = signal<any>(null);
  isModalOpen = signal(false);

  // Computed
  tabs = computed((): TabData[] => {
    const unreadCount = this.messagesBadgeCount();
    return [
      { 
        id: 'messages', 
        label: 'Team Messages', 
        icon: this.MessageSquareIcon,
        badge: unreadCount > 0 ? unreadCount : undefined
      },
      { id: 'market-research', label: 'Market Research', icon: this.TrendingUpIcon },
      { id: 'documents', label: 'Documents', icon: this.FileTextIcon }
    ];
  });

  applicationDocuments = computed(() => {
    const app = this.application;
    if (!app?.documents) {
      console.log('🔍 [DEBUG] No documents found in application:', app);
      return [];
    }
    
    console.log('📄 [DEBUG] Processing application documents:', app.documents);
    
    const documentEntries = Object.entries(app.documents).map(([key, value]) => ({
      key,
      value,
      name: this.formatFieldName(key),
      type: this.getDocumentType(value),
      size: this.getDocumentSize(value),
    }));

    console.log('📋 [DEBUG] Processed document entries:', documentEntries);
    return documentEntries;
  });

  hasDocuments = computed(() => {
    const docs = this.applicationDocuments();
    const hasAny = docs.length > 0;
    console.log('📄 [DEBUG] Has documents check:', hasAny, 'Total:', docs.length);
    return hasAny;
  });

  // Document modal computed properties
  documentViewUrl = computed(() => {
    const doc = this.selectedDocument();
    return doc ? this.getDocumentViewUrl(doc) : null;
  });

  documentType = computed(() => {
    const doc = this.selectedDocument();
    return doc ? this.getDocumentType(doc).toLowerCase() : '';
  });

  isPdfDocument = computed(() => {
    return this.documentType() === 'pdf';
  });

  isImageDocument = computed(() => {
    const type = this.documentType();
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(type);
  });

  isTextDocument = computed(() => {
    const type = this.documentType();
    return ['txt', 'text'].includes(type);
  });

  ngOnInit() {
    this.loadMessageBadgeCount();
    
    // Debug application loading
    const app = this.application;
    console.log('🔍 [DEBUG] Application tabs initialized with application:', app?.id);
    console.log('📄 [DEBUG] Application documents:', app?.documents);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // TAB MANAGEMENT
  // ===============================

  setActiveTab(tabId: TabId) {
    this.activeTab.set(tabId);
  }

  // ===============================
  // MESSAGING FUNCTIONALITY
  // ===============================

  private async loadMessageBadgeCount() {
    if (!this.application?.id) return;

    try {
      // Get application threads and count unread messages
      const threads = await this.messagingService.getApplicationThreads(this.application.id);
      const unreadCount = threads.reduce((total, thread) => total + thread.unreadCount, 0);
      this.messagesBadgeCount.set(unreadCount);
    } catch (error) {
      console.error('Error loading message badge count:', error);
    }
  }

  // ===============================
  // MARKET RESEARCH FUNCTIONALITY
  // ===============================

  async generateMarketResearch() {
    const application = this.application;
    const opportunity = this.opportunity;
    
    if (!application || !opportunity) {
      console.error('Missing application or opportunity data for market research');
      return;
    }

    this.isGeneratingResearch.set(true);
    this.researchError.set(null);

    try {
      console.log('Generating market research...');
      
      // Simulate API call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate random success/failure for demo
          if (Math.random() > 0.7) {
            reject(new Error('Market research generation failed'));
          } else {
            resolve(true);
          }
        }, 2000);
      });

      this.marketResearchGenerated.set(true);
      this.marketResearchRequested.emit();
      console.log('Market research generated successfully');
      
    } catch (error) {
      console.error('Error generating market research:', error);
      this.researchError.set('Failed to generate market research. Please try again.');
    } finally {
      this.isGeneratingResearch.set(false);
    }
  }

  retryMarketResearch() {
    this.researchError.set(null);
    this.generateMarketResearch();
  }

  clearResearchError() {
    this.researchError.set(null);
  }

  // ===============================
  // DOCUMENT MODAL FUNCTIONALITY - NEW IMPLEMENTATION
  // ===============================

  /**
   * Open document in modal
   */
  viewDocument(doc: any) {
    console.log('👁️ [DEBUG] Opening document in modal:', doc);
    
    const url = this.getDocumentViewUrl(doc);
    if (url) {
      this.selectedDocument.set(doc);
      this.openModal();
    } else {
      console.log('⚠️ [DEBUG] No view URL available for:', doc.name);
      this.showDocumentError('Preview not available for this document');
    }
  }

  /**
   * Open the modal using Preline's HSOverlay
   */
  private openModal() {
    this.isModalOpen.set(true);
    
    // Use Preline's HSOverlay to open modal
    setTimeout(() => {
      const modalElement = document.getElementById('document-viewer-modal');
      if (modalElement && (window as any).HSOverlay) {
        (window as any).HSOverlay.open(modalElement);
      }
    }, 0);
  }

  /**
   * Close the modal
   */
  closeModal() {
    this.isModalOpen.set(false);
    this.selectedDocument.set(null);
    
    // Use Preline's HSOverlay to close modal
    const modalElement = document.getElementById('document-viewer-modal');
    if (modalElement && (window as any).HSOverlay) {
      (window as any).HSOverlay.close(modalElement);
    }
  }

  /**
   * Download document - forces file download
   */
  downloadDocument(doc: any) {
    console.log('📥 [DEBUG] Downloading document:', doc);
    
    const url = this.getDocumentDownloadUrl(doc);
    if (url) {
      console.log('📥 [DEBUG] Downloading from URL:', url);
      
      // Create invisible download link and trigger click
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.value?.fileName || doc.value?.name || doc.name || 'document';
      link.target = '_blank';
      
      // Add to DOM temporarily and click
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.log('⚠️ [DEBUG] No download URL available for:', doc.name);
      this.showDocumentError('Download not available for this document');
    }
  }

  /**
   * Download document from modal
   */
  downloadCurrentDocument() {
    const doc = this.selectedDocument();
    if (doc) {
      this.downloadDocument(doc);
    }
  }

  /**
   * Get URL for viewing document (preview/inline)
   */
  private getDocumentViewUrl(doc: any): string | null {
    // Priority order for view URLs
    if (doc.value?.viewUrl) return doc.value.viewUrl;
    if (doc.value?.previewUrl) return doc.value.previewUrl;
    if (doc.value?.url) return doc.value.url;
    if (doc.value?.downloadUrl) return doc.value.downloadUrl;
    
    return null;
  }

  /**
   * Get URL for downloading document
   */
  private getDocumentDownloadUrl(doc: any): string | null {
    // Priority order for download URLs
    if (doc.value?.downloadUrl) return doc.value.downloadUrl;
    if (doc.value?.url) return doc.value.url;
    if (doc.value?.fileUrl) return doc.value.fileUrl;
    
    return null;
  }

  /**
   * Show document error message
   */
  private showDocumentError(message: string) {
    // You can replace this with your preferred notification system
    alert(message);
    
    // Or use a toast/notification service if available:
    // this.notificationService.showError(message);
  }

  /**
   * Check if document can be previewed inline
   */
  canPreviewDocument(doc: any): boolean {
    const type = this.getDocumentType(doc).toLowerCase();
    const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'txt'];
    return previewableTypes.includes(type) || !!doc.value?.viewUrl || !!doc.value?.previewUrl;
  }

  // ===============================
  // DOCUMENT UTILITIES (EXISTING)
  // ===============================

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^\w/, c => c.toUpperCase());
  }

  private getDocumentType(doc: any): string {
    console.log('🔍 [DEBUG] Getting document type for:', doc);
    
    if (typeof doc === 'string') return 'text';
    if (doc?.type) return doc.type;
    if (doc?.fileType) return doc.fileType;
    if (doc?.name || doc?.fileName) {
      const fileName = doc.name || doc.fileName;
      const ext = fileName.split('.').pop()?.toLowerCase();
      return ext || 'file';
    }
    return 'file';
  }

  private getDocumentSize(doc: any): string {
    console.log('🔍 [DEBUG] Getting document size for:', doc);
    
    if (doc?.size) {
      const size = Number(doc.size);
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (doc?.fileSize) {
      const size = Number(doc.fileSize);
      if (size < 1024) return `${size} B`;
      if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    return 'Unknown size';
  }

  formatDate(date: Date | null): string {
    if (!date) return 'Unknown date';
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }
}