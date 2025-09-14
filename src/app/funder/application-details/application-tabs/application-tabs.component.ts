 

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
  BarChart3 
} from 'lucide-angular';
import { Subject } from 'rxjs';
import { UiButtonComponent } from 'src/app/shared/components';
import { ApplicationMessagingComponent } from 'src/app/messaging/application-messaging/application-messaging.component';
import { MessagingService } from 'src/app/messaging/services/messaging.service';
 
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
    ApplicationMessagingComponent
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

  // State
  activeTab = signal<TabId>('messages');
  
  // Market research state
  isGeneratingResearch = signal(false);
  marketResearchGenerated = signal(false);
  researchError = signal<string | null>(null);

  // Message badge count - computed from messaging service
  messagesBadgeCount = signal(0);

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
      uploadedAt: this.getDocumentDate(value)
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
  // DOCUMENT UTILITIES
  // ===============================

  downloadDocument(doc: any) {
    console.log('📄 [DEBUG] Downloading document:', doc);
    
    // Enhanced download logic
    if (doc.value?.downloadUrl) {
      console.log('📄 [DEBUG] Opening download URL:', doc.value.downloadUrl);
      window.open(doc.value.downloadUrl, '_blank');
    } else if (doc.value?.url) {
      console.log('📄 [DEBUG] Opening URL:', doc.value.url);
      window.open(doc.value.url, '_blank');
    } else {
      console.log('⚠️ [DEBUG] No download URL available for:', doc.name);
      alert('Download not available for this document');
    }
  }

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

  private getDocumentDate(doc: any): Date | null {
    console.log('🔍 [DEBUG] Getting document date for:', doc);
    
    if (doc?.uploadedAt) return new Date(doc.uploadedAt);
    if (doc?.uploadDate) return new Date(doc.uploadDate);
    if (doc?.createdAt) return new Date(doc.createdAt);
    if (doc?.created_at) return new Date(doc.created_at);
    return null;
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