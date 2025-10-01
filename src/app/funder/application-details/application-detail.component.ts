// src/app/funder/components/application-detail/application-detail.component.ts - UPDATED

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
import { Subject, takeUntil, forkJoin } from 'rxjs';
 
import { AuthService } from '../../auth/production.auth.service';
import { ApplicationManagementService } from '../../SMEs/services/application-management.service';
import { FundingOpportunity } from '../../shared/models/funder.models';
import { SMEOpportunitiesService } from '../../funding/services/opportunities.service';
import { MessagingService, MessageThread } from 'src/app/messaging/services/messaging.service';
import { AiAssistantComponent } from 'src/app/ai/ai-assistant/ai-assistant.component';
import { ApplicationTabsComponent } from './application-tabs/application-tabs.component';
import { AiExecutiveSummaryComponent } from './ai-executive-summary/ai-executive-summary.component';
import { ApplicantProfileComponent } from './applicant-profile/applicant-profile.component';
import { FundingProfileBackendService } from 'src/app/SMEs/services/funding-profile-backend.service';
import { ProfileDataTransformerService } from 'src/app/SMEs/services/profile-data-transformer.service';
import { ProfileData } from 'src/app/SMEs/services/funding.models';
import { FundingApplication } from 'src/app/SMEs/models/application.models';

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

interface ApplicationFormData {
  requestedAmount?: number | string;
  purposeStatement?: string;
  useOfFunds?: string;
  timeline?: string;
  opportunityAlignment?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    AiExecutiveSummaryComponent,
    ApplicationTabsComponent,
    AiAssistantComponent,
    ApplicantProfileComponent
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
  private readonly backendService = inject(FundingProfileBackendService);
  private readonly transformer = inject(ProfileDataTransformerService);

  // Make Object available to template
  Object = Object;

  // Icons (keeping existing icons)
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
  
  // PROFILE DATA STATE - CENTRALIZED
  profileData = signal<Partial<ProfileData> | null>(null);
  profileError = signal<string | null>(null);
  profileLoading = signal(false);
  
  // General loading/error state
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // UI State
  activeTab = signal<TabId>('overview');
  
  // Messaging state (keeping existing)
  messageThreads = signal<MessageThread[]>([]);
  activeThread = signal<MessageThread | null>(null);
  newMessage = signal('');
  isCreatingThread = signal(false);
  isSendingMessage = signal(false);
  showCreateThread = signal(false);

  // Status update state (keeping existing)
  isUpdatingStatus = signal(false);
  statusComment = signal('');
  showStatusModal = signal(false);
  pendingStatus = signal<FundingApplication['status'] | null>(null);

  // Activity state (keeping existing)
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

  // Enhanced computed - includes profile data
  applicationForAI = computed(() => {
    const app = this.application();
    const opp = this.opportunity();
    const profile = this.profileData();
    const formData = this.formData();
    
    if (!app || !opp) return null;

    return {
      application: app,
      opportunity: opp,
      profileData: profile, // Now includes full profile
      formData: {
        requestedAmount: this.getRequestedAmount()?.toString() || '0',
        purposeStatement: formData.purposeStatement || app.description || '',
        useOfFunds: formData.useOfFunds || '',
        timeline: formData.timeline || '',
        opportunityAlignment: formData.opportunityAlignment || ''
      }
    };
  });

  // Check if we have complete data for analysis
  hasCompleteDataForAnalysis = computed(() => {
    return !!(this.application() && this.opportunity() && this.profileData());
  });

  // Type-safe form data access
  formData = computed((): ApplicationFormData => {
    const app = this.application();
    return (app?.formData as ApplicationFormData) || {};
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('applicationId');
    if (id) {
      this.applicationId.set(id);
      this.loadAllData();
      this.loadMessageThreads();
    } else {
      this.router.navigate(['/funder/dashboard']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * MAIN DATA LOADING METHOD - LOADS EVERYTHING IN PARALLEL
   */
  private async loadAllData() {
    this.isLoading.set(true);
    this.error.set(null);
    this.profileError.set(null);

    try {
      console.log('🔄 Loading application and profile data...');
      
      // Load application details first
      const application = await this.applicationService
        .getApplicationById(this.applicationId())
        .pipe(takeUntil(this.destroy$))
        .toPromise();

      if (!application) {
        this.error.set('Application not found');
        return;
      }

      this.application.set(application);

      // Check if we have applicant ID for profile loading
      if (!application.applicantId) {
        this.error.set('Application is missing applicant information. Cannot proceed with analysis.');
        return;
      }

      // Load opportunity and profile in parallel
      const parallelLoads = forkJoin({
        opportunity: this.opportunitiesService
          .getOpportunityById(application.opportunityId)
          .pipe(takeUntil(this.destroy$)),
        profile: this.loadApplicantProfile(application.applicantId)
      });

      const results = await parallelLoads.toPromise();

      if (results?.opportunity) {
        this.opportunity.set(results.opportunity);
      }

      console.log('✅ All data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading application data:', error);
      this.error.set('Failed to load application details');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * LOAD APPLICANT PROFILE - WITH PROPER ERROR HANDLING
   */
  private async loadApplicantProfile(applicantId: string): Promise<void> {
    this.profileLoading.set(true);
    this.profileError.set(null);
    
    try {
      console.log(`🔄 Loading profile for applicant: ${applicantId}`);
      
      // Use the new method that accepts user ID
      const fundingProfile = await this.backendService
        .loadSavedProfileForUser(applicantId)
        .pipe(takeUntil(this.destroy$))
        .toPromise();
      
      if (fundingProfile) {
        // Transform backend data to UI format
        const profileData = this.transformer.transformFromFundingProfile(fundingProfile);
        this.profileData.set(profileData);
        
        console.log('✅ Applicant profile loaded successfully');
      } else {
        throw new Error('No profile data returned from backend');
      }
      
    } catch (error) {
      console.error('❌ Failed to load applicant profile:', error);
      
      // Set specific error message based on error type
      let errorMessage = 'Unable to load applicant profile data.';
      
      if (error instanceof Error) {
        if (error.message.includes('No profile data found')) {
          errorMessage = 'Applicant has not completed their business profile. Analysis may be limited.';
        } else if (error.message.includes('User ID is required')) {
          errorMessage = 'Invalid applicant information. Cannot load profile.';
        } else {
          errorMessage = `Profile loading failed: ${error.message}`;
        }
      }
      
      this.profileError.set(errorMessage);
      
      // For critical errors, also set main error
      if (error instanceof Error && error.message.includes('User ID is required')) {
        this.error.set('Application data is corrupted. Please contact support.');
      }
      
    } finally {
      this.profileLoading.set(false);
    }
  }

  /**
   * PUBLIC METHOD TO RETRY PROFILE LOADING
   */
  async retryProfileLoading() {
    const application = this.application();
    if (application?.applicantId) {
      await this.loadApplicantProfile(application.applicantId);
    }
  }

  // Type-safe getters for form data (keeping existing methods)
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

  // Event handler for market research (keeping existing)
  onMarketResearchRequested() {
    console.log('Market research requested for application:', this.application()?.id);
    // Switch to AI analysis tab
    this.setActiveTab('ai-analysis');
  }

  private loadMessageThreads() {
    this.messagingService.loadThreads();
    
    this.messagingService.threads$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (threads) => {
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

 

  // Tab management
  setActiveTab(tabId: TabId) {
    this.activeTab.set(tabId);
  }

  // Navigation
  goBack() {
    const application = this.application();
    if (application?.opportunityId) {
      this.router.navigate(['/funder/opportunities', application.opportunityId, 'applications']);
    } else {
      this.router.navigate(['/funder/dashboard']);
    }
  }

  // Utility methods (keeping existing)
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

  // Helper methods for template
  getFormDataEntries(): Array<{key: string, value: any}> {
    const formData = this.formData();
    return Object.entries(formData).map(([key, value]) => ({
      key,
      value
    }));
  }

  formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^\w/, c => c.toUpperCase());
  }

  getDocumentEntries(): Array<{key: string, value: any}> {
    const app = this.application();
    if (!app?.documents) return [];
    
    return Object.entries(app.documents).map(([key, value]) => ({
      key,
      value
    }));
  }

  hasDocuments(): boolean {
    const app = this.application();
    return !!(app?.documents && Object.keys(app.documents).length > 0);
  }


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

  
  // Status management methods
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

  onStatusCommentInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    if (target) {
      this.statusComment.set(target.value);
    }
  }

  // Messaging methods
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

  onMessageInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    if (target) {
      this.newMessage.set(target.value);
    }
  }

  async requestMoreInfo(application: FundingApplication) {
    const message = prompt('Enter your request for additional information:');
    if (message) {
      try {
        await this.applicationService.requestAdditionalInfo(application.id, message).toPromise();
        await this.loadAllData();
      } catch (error) {
        console.error('Error requesting additional information:', error);
      }
    }
  }

  // Utility methods for messaging
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

  // Additional utility methods
  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '??';
  }
 
}