// src/app/funder/components/application-detail/application-detail.component.ts
import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  ArrowLeft, 
  User, 
  FileText, 
  Bot, 
  MessageSquare, 
  Activity,
  Clock,
  Calendar,
  DollarSign,
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Send,
  Plus,
  Loader2
} from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';

import { UiButtonComponent } from '../../shared/components';
import { SidebarNavComponent } from '../../shared/components/sidenav/sidebar-nav.component';
import { EnhancedAIAnalysisComponent } from '../../ai/ai-analysis/enhanced-ai-analysis.component';
import { AuthService } from '../../auth/production.auth.service';
import { ApplicationManagementService, FundingApplication } from '../../SMEs/services/application-management.service';
 
import { FundingOpportunity } from '../../shared/models/funder.models';
import { SMEOpportunitiesService } from '../../funding/services/opportunities.service';
import { MessagingService, MessageThread } from 'src/app/messaging/services/messaging.service';
import { AiAssistantComponent } from 'src/app/ai/ai-assistant/ai-assistant.component';
import { ApplicationTabsComponent } from './application-tabs/application-tabs.component';
import { AiExecutiveSummaryComponent } from './ai-executive-summary/ai-executive-summary.component';

type TabId = 'overview' | 'ai-analysis' | 'messages' | 'documents' | 'activity';

interface TabData {
  id: TabId;
  label: string;
  icon: any;
}

interface ApplicationActivity {
  id: string;
  action: string;
  description: string;
  timestamp: Date;
  actor: string;
}

// Type-safe interface for form data
interface ApplicationFormData {
  requestedAmount?: number | string;
  purposeStatement?: string;
  useOfFunds?: string;
  timeline?: string;
  opportunityAlignment?: string;
  [key: string]: any; // Allow other fields
}

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
  AiExecutiveSummaryComponent ,
    ApplicationTabsComponent ,
    AiAssistantComponent
  ],
  templateUrl: './application-detail.component.html',
  styleUrls: ['./application-detail.component.css']
})
export class ApplicationDetailComponent implements OnInit, OnDestroy {
  // Services
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private applicationService = inject(ApplicationManagementService);
  private messagingService = inject(MessagingService);
  private opportunitiesService = inject(SMEOpportunitiesService);
  private destroy$ = new Subject<void>();

  // Make Object available to template
  Object = Object;

  // Icons
  ArrowLeftIcon = ArrowLeft;
  UserIcon = User;
  FileTextIcon = FileText;
  BotIcon = Bot;
  MessageSquareIcon = MessageSquare;
  ActivityIcon = Activity;
  ClockIcon = Clock;
  CalendarIcon = Calendar;
  DollarSignIcon = DollarSign;
  BuildingIcon = Building;
  MailIcon = Mail;
  PhoneIcon = Phone;
  MapPinIcon = MapPin;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  AlertCircleIcon = AlertCircle;
  EyeIcon = Eye;
  DownloadIcon = Download;
  SendIcon = Send;
  PlusIcon = Plus;
  Loader2Icon = Loader2;

  // State
  applicationId = signal<string>('');
  application = signal<FundingApplication | null>(null);
  opportunity = signal<FundingOpportunity | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // UI State
  activeTab = signal<TabId>('overview');
  
  // Messaging state
  messageThreads = signal<MessageThread[]>([]);
  activeThread = signal<MessageThread | null>(null);
  newMessage = signal('');
  isCreatingThread = signal(false);
  isSendingMessage = signal(false);
  showCreateThread = signal(false);

  // Status update state
  isUpdatingStatus = signal(false);
  statusComment = signal('');
  showStatusModal = signal(false);
  pendingStatus = signal<FundingApplication['status'] | null>(null);

  // Activity state
  activities = signal<ApplicationActivity[]>([]);

  // Computed
  currentUser = computed(() => this.authService.user());
  
  tabs = computed((): TabData[] => [
    { id: 'overview', label: 'Overview', icon: this.EyeIcon },
    { id: 'ai-analysis', label: 'AI Analysis', icon: this.BotIcon },
    { id: 'messages', label: 'Messages', icon: this.MessageSquareIcon },
    { id: 'documents', label: 'Documents', icon: this.FileTextIcon },
    { id: 'activity', label: 'Activity', icon: this.ActivityIcon }
  ]);

  canUpdateStatus = computed(() => {
    const app = this.application();
    if (!app) return false;
    return ['submitted', 'under_review'].includes(app.status);
  });

  // Type-safe form data access
  formData = computed((): ApplicationFormData => {
    const app = this.application();
    return (app?.formData as ApplicationFormData) || {};
  });

  applicationForAI = computed(() => {
    const app = this.application();
    const opp = this.opportunity();
    const formData = this.formData();
    
    if (!app || !opp) return null;

    // Transform application data for AI analysis with proper type safety
    return {
      requestedAmount: this.getRequestedAmount()?.toString() || '0',
      purposeStatement: formData.purposeStatement || app.description || '',
      useOfFunds: formData.useOfFunds || '',
      timeline: formData.timeline || '',
      opportunityAlignment: formData.opportunityAlignment || ''
    };
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('applicationId');
    if (id) {
      this.applicationId.set(id);
      this.loadApplicationData();
      this.loadMessageThreads();
    } else {
      this.router.navigate(['/funder/dashboard']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Type-safe getters for form data
  getRequestedAmount(): number | null {
    const formData = this.formData();
    const amount = formData.requestedAmount;
    
    if (typeof amount === 'number') return amount;
    if (typeof amount === 'string') {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  getTimeline(): string | null {
    return this.formData().timeline || null;
  }

  getUseOfFunds(): string | null {
    return this.formData().useOfFunds || null;
  }

  hasFormData(): boolean {
    const formData = this.formData();
    return Object.keys(formData).length > 0;
  }
// 3. ADD METHOD TO HANDLE MARKET RESEARCH REQUEST
onMarketResearchRequested() {
  // Switch to AI analysis tab or show market research results
  console.log('Market research requested for application:', this.application()?.id);
  // You could emit an event to parent or update local state
  // For example, you might want to trigger the AI assistant to show market insights
}
  private async loadApplicationData() {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Load application details
      const application = await this.applicationService
        .getApplicationById(this.applicationId())
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      if (application) {
        this.application.set(application);
        
        // Load associated opportunity
        const opportunity = await this.opportunitiesService
          .getOpportunityById(application.opportunityId)
          .pipe(takeUntil(this.destroy$))
          .toPromise();
        
        if (opportunity) {
          this.opportunity.set(opportunity);
        }

        // Generate mock activity for now
        this.generateMockActivity(application);
      } else {
        this.error.set('Application not found');
      }
    } catch (error) {
      console.error('Error loading application:', error);
      this.error.set('Failed to load application details');
    } finally {
      this.isLoading.set(false);
    }
  }

  private loadMessageThreads() {
    this.messagingService.loadThreads();
    
    this.messagingService.threads$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (threads) => {
          // Filter threads related to this application
          const appThreads = threads.filter(thread => 
            thread.metadata?.applicationId === this.applicationId() ||
            thread.subject.toLowerCase().includes('application')
          );
          this.messageThreads.set(appThreads);
        },
        error: (error) => {
          console.error('Error loading message threads:', error);
        }
      });
  }

  private generateMockActivity(application: FundingApplication) {
    const activities: ApplicationActivity[] = [
      {
        id: '1',
        action: 'submitted',
        description: 'Application submitted for review',
        timestamp: application.submittedAt || application.createdAt,
        actor: application.applicant?.firstName + ' ' + application.applicant?.lastName || 'Applicant'
      },
      {
        id: '2', 
        action: 'received',
        description: 'Application received and assigned for initial review',
        timestamp: new Date(application.createdAt.getTime() + 1000 * 60 * 5), // 5 minutes later
        actor: 'System'
      }
    ];

    if (application.status === 'under_review') {
      activities.push({
        id: '3',
        action: 'review_started',
        description: 'Application moved to under review status',
        timestamp: application.reviewStartedAt || new Date(),
        actor: 'Reviewer'
      });
    }

    this.activities.set(activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
  }

  // Tab management
  setActiveTab(tabId: TabId) {
    this.activeTab.set(tabId);
  }

  // Status management
  async updateStatus(status: FundingApplication['status'], comment?: string) {
    if (!this.canUpdateStatus()) return;

    this.isUpdatingStatus.set(true);
    
    try {
      const updatedApp = await this.applicationService
        .updateApplicationStatus(this.applicationId(), status, undefined, comment)
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      if (updatedApp) {
        this.application.set(updatedApp);
        
        // Add activity
        const newActivity: ApplicationActivity = {
          id: Date.now().toString(),
          action: status,
          description: `Application ${status.replace('_', ' ')}${comment ? ': ' + comment : ''}`,
          timestamp: new Date(),
          actor: this.currentUser()?.firstName + ' ' + this.currentUser()?.lastName || 'Reviewer'
        };
        
        const currentActivities = this.activities();
        this.activities.set([newActivity, ...currentActivities]);
      }
      
      this.closeStatusModal();
    } catch (error) {
      console.error('Error updating status:', error);
      // You might want to show a toast notification here
    } finally {
      this.isUpdatingStatus.set(false);
    }
  }

  openStatusModal(status: FundingApplication['status']) {
    this.pendingStatus.set(status);
    this.statusComment.set('');
    this.showStatusModal.set(true);
  }

  closeStatusModal() {
    this.showStatusModal.set(false);
    this.pendingStatus.set(null);
    this.statusComment.set('');
  }

  confirmStatusUpdate() {
    const status = this.pendingStatus();
    const comment = this.statusComment().trim();
    
    if (status) {
      this.updateStatus(status, comment || undefined);
    }
  }

  // Messaging
  async createMessageThread() {
    const application = this.application();
    if (!application?.applicantId) return;

    this.isCreatingThread.set(true);

    try {
      const threadId = await this.messagingService.createThread(
        `Re: ${application.title}`,
        [application.applicantId]
      );

      if (threadId) {
        // Load updated threads
        await this.messagingService.loadThreads();
        this.showCreateThread.set(false);
      }
    } catch (error) {
      console.error('Error creating message thread:', error);
    } finally {
      this.isCreatingThread.set(false);
    }
  }

  selectThread(thread: MessageThread) {
    this.activeThread.set(thread);
    this.messagingService.markThreadAsRead(thread.id);
  }

  async sendMessage() {
    const thread = this.activeThread();
    const message = this.newMessage().trim();
    
    if (!thread || !message) return;

    this.isSendingMessage.set(true);

    try {
      const success = await this.messagingService.sendMessage(
        thread.id,
        message,
        'message'
      );

      if (success) {
        this.newMessage.set('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      this.isSendingMessage.set(false);
    }
  }

  onEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Type-safe event handlers
  onMessageInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    if (target) {
      this.newMessage.set(target.value);
    }
  }

  onStatusCommentInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    if (target) {
      this.statusComment.set(target.value);
    }
  }

  // Navigation
  goBack() {
    // Go back to application management for this opportunity
    const application = this.application();
    if (application?.opportunityId) {
      this.router.navigate(['/funder/opportunities', application.opportunityId, 'applications']);
    } else {
      this.router.navigate(['/funder/dashboard']);
    }
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      draft: 'status-badge status-draft',
      submitted: 'status-badge status-submitted', 
      under_review: 'status-badge status-under-review',
      approved: 'status-badge status-approved',
      rejected: 'status-badge status-rejected',
      withdrawn: 'status-badge status-draft'
    };
    return classMap[status] || 'status-badge status-draft';
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review', 
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn'
    };
    return statusMap[status] || status;
  }

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

  formatCurrency(amount?: number, currency: string = 'ZAR'): string {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getTimeAgo(timestamp: string | Date): string {
    const now = new Date();
    const messageDate = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const diff = now.getTime() - messageDate.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  getParticipantNames(thread: MessageThread): string {
    return thread.participants.map(p => p.name).join(', ');
  }

  // Document utility
  hasDocuments(): boolean {
    const app = this.application();
    return !!(app?.documents && Object.keys(app.documents).length > 0);
  }

  // getDocumentEntries(): [string, any][] {
  //   const app = this.application();
  //   if (!app?.documents) return [];
  //   return Object.entries(app.documents);
  // }

  // AI Analysis event handlers
  onAIAnalysisCompleted(result: any) {
    console.log('AI Analysis completed:', result);
    // Handle AI analysis results if needed
  }

  onImprovementRequested() {
    // This might trigger a message to the applicant
    // asking them to improve their application
    console.log('Improvement requested');
  }

  onProceedRequested() {
    // This might automatically move the application to next stage
    console.log('Proceed requested');
  }

  // Add these methods to your ApplicationDetailComponent class

  // Helper methods for template - add these to your component
  
  /**
   * Get form data entries as array of objects with key/value
   */
  getFormDataEntries(): Array<{key: string, value: any}> {
    const formData = this.formData();
    return Object.entries(formData).map(([key, value]) => ({
      key,
      value
    }));
  }

  /**
   * Format field names from camelCase to readable text
   */
  formatFieldName(fieldName: string): string {
    return fieldName
      // Insert space before uppercase letters
      .replace(/([A-Z])/g, ' $1')
      // Trim and capitalize first letter
      .trim()
      .replace(/^\w/, c => c.toUpperCase());
  }

  /**
   * Get document entries as array of objects with key/value
   */
  getDocumentEntries(): Array<{key: string, value: any}> {
    const app = this.application();
    if (!app?.documents) return [];
    
    return Object.entries(app.documents).map(([key, value]) => ({
      key,
      value
    }));
  }
}