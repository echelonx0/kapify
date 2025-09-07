// src/app/messaging/application-messaging/application-messaging.component.ts
import { Component, Input, signal, computed, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  MessageSquare,
  Send,
  Plus,
  Loader2,
  ArrowLeft,
  MoreVertical,
  User
} from 'lucide-angular';
 
import { Subscription } from 'rxjs';
import { UiButtonComponent } from 'src/app/shared/components';
import { MessagingService, MessageThread } from '../services/messaging.service';

@Component({
  selector: 'app-application-messaging',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    UiButtonComponent
  ],
  templateUrl: 'application-messaging.component.html'
})
export class ApplicationMessagingComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @Input() applicationId!: string;

  private messagingService = inject(MessagingService);
  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = false;

  // Icons
  MessageSquareIcon = MessageSquare;
  SendIcon = Send;
  PlusIcon = Plus;
  Loader2Icon = Loader2;
  ArrowLeftIcon = ArrowLeft;
  MoreVerticalIcon = MoreVertical;
  UserIcon = User;

  // State
  selectedThread = signal<MessageThread | null>(null);
  newMessage = signal('');
  isLoading = signal(false);
  isCreatingThread = signal(false);
  isSendingMessage = signal(false);
  applicationThreads = signal<MessageThread[]>([]);
  applicationContext = signal<any>(null);

  ngOnInit() {
    if (this.applicationId) {
      this.loadApplicationData();
      this.loadApplicationThreads();
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom && this.messagesContainer) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) {}
  }

  private async loadApplicationData() {
    try {
      // Get application context using the new method
      const context = await this.messagingService.getApplicationContext(this.applicationId);
      this.applicationContext.set(context);
    } catch (error) {
      console.error('Error loading application context:', error);
    }
  }

  private async loadApplicationThreads() {
    this.isLoading.set(true);
    try {
      // Get application-specific threads using the new method
      const threads = await this.messagingService.getApplicationThreads(this.applicationId);
      this.applicationThreads.set(threads);
    } catch (error) {
      console.error('Error loading application threads:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async createNewThread() {
    this.isCreatingThread.set(true);
    
    try {
      const context = this.applicationContext();
      const subject = `Re: ${context?.title || 'Application Discussion'}`;
      
      // Create thread using the new method (automatically includes applicant)
      const threadId = await this.messagingService.createApplicationThread(
        this.applicationId,
        subject
      );
      
      if (threadId) {
        // Reload threads to show the new one
        await this.loadApplicationThreads();
        
        // Find and select the new thread
        const newThread = this.applicationThreads().find(t => t.id === threadId);
        if (newThread) {
          this.selectThread(newThread);
        }
      }
    } catch (error) {
      console.error('Error creating thread:', error);
    } finally {
      this.isCreatingThread.set(false);
    }
  }

  selectThread(thread: MessageThread) {
    this.selectedThread.set(thread);
    this.shouldScrollToBottom = true;

    // Mark thread as read
    this.messagingService.markThreadAsRead(thread.id);
  }

  closeThread() {
    this.selectedThread.set(null);
    this.newMessage.set('');
  }

  async sendMessage() {
    const message = this.newMessage().trim();
    const thread = this.selectedThread();
    
    if (!message || !thread) return;

    this.isSendingMessage.set(true);

    try {
      const success = await this.messagingService.sendMessage(
        thread.id,
        message,
        'message'
      );

      if (success) {
        this.newMessage.set('');
        this.shouldScrollToBottom = true;
        
        // Reload threads to get updated message
        await this.loadApplicationThreads();
        
        // Update selected thread
        const updatedThread = this.applicationThreads().find(t => t.id === thread.id);
        if (updatedThread) {
          this.selectedThread.set(updatedThread);
        }
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

  getParticipantNames(thread: MessageThread): string {
    return thread.participants
      .filter(p => p.name !== 'You')
      .map(p => p.name)
      .join(', ') || 'You';
  }

  getApplicantName(): string {
    const context = this.applicationContext();
    if (!context?.users) return 'Unknown Applicant';
    
    const firstName = context.users.first_name || '';
    const lastName = context.users.last_name || '';
    return `${firstName} ${lastName}`.trim() || context.users.email || 'Unknown Applicant';
  }

  formatTime(timestamp: string | Date): string {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    if (isNaN(date.getTime())) return 'Unknown time';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
}