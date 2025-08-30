// src/app/shared/components/messaging.component.ts
import { Component, signal, computed, OnInit, ElementRef, ViewChild, AfterViewChecked, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  LucideAngularModule, 
  Send,
  Paperclip,
  Smile,
  ArrowLeft,
  MoreVertical,
  Search,
  X
} from 'lucide-angular';
import { MessagingService, MessageThread, Message } from '../services/messaging.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-activity-inbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  templateUrl: 'messaging.component.html',
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    @keyframes slide-in {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-slide-in {
      animation: slide-in 0.3s ease-out forwards;
    }

    .self-message {
      animation-delay: 0ms !important;
    }
  `]
})
export class ActivityInboxComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  private messagingService = inject(MessagingService);
  private subscriptions: Subscription[] = [];
 
  // Icons
  SendIcon = Send;
  PaperclipIcon = Paperclip;
  SmileIcon = Smile;
  ArrowLeftIcon = ArrowLeft;
  MoreVerticalIcon = MoreVertical;
  SearchIcon = Search;
  XIcon = X;

  // State
  selectedThread = signal<MessageThread | null>(null);
  replyMessage = signal('');
  searchQuery = signal('');
  threads = signal<MessageThread[]>([]);
  isLoading = signal(false);
  
  private shouldScrollToBottom = false;

  ngOnInit() {
    this.loadThreads();
    this.subscribeToThreads();
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

  private subscribeToThreads() {
    const threadsSubscription = this.messagingService.threads$.subscribe({
      next: (threads) => {
        this.threads.set(threads);
        
        // Update selected thread if it's currently viewed
        const currentSelected = this.selectedThread();
        if (currentSelected) {
          const updatedSelected = threads.find(t => t.id === currentSelected.id);
          if (updatedSelected) {
            this.selectedThread.set(updatedSelected);
            this.shouldScrollToBottom = true;
          }
        }
      },
      error: (error) => {
        console.error('Error in threads subscription:', error);
      }
    });

    this.subscriptions.push(threadsSubscription);
  }

  private async loadThreads() {
    this.isLoading.set(true);
    try {
      await this.messagingService.loadThreads();
    } catch (error) {
      console.error('Error loading threads:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Computed properties
  filteredThreads = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.threads();
    
    return this.threads().filter(thread => 
      thread.subject.toLowerCase().includes(query) ||
      (thread.lastMessage?.content.toLowerCase().includes(query)) ||
      thread.participants.some(p => p.name.toLowerCase().includes(query))
    );
  });

  async selectThread(thread: MessageThread) {
    this.selectedThread.set(thread);
    this.shouldScrollToBottom = true;

    // Mark thread as read
    try {
      await this.messagingService.markThreadAsRead(thread.id);
    } catch (error) {
      console.error('Error marking thread as read:', error);
    }
  }

  closeThread() {
    this.selectedThread.set(null);
    this.replyMessage.set('');
  }

  async sendReply() {
    const message = this.replyMessage().trim();
    const currentThread = this.selectedThread();
    
    if (!message || !currentThread) return;

    try {
      const success = await this.messagingService.sendMessage(
        currentThread.id, 
        message, 
        'message'
      );

      if (success) {
        this.replyMessage.set('');
        this.shouldScrollToBottom = true;
      } else {
        console.error('Failed to send message');
        // You might want to show a toast notification here
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // You might want to show a toast notification here
    }
  }

  onEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendReply();
    }
  }

  getParticipantsList(thread: MessageThread): string {
    return thread.participants.map(p => p.name).join(', ');
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

  getUserDisplayName(message: Message): string {
    return message.user?.name || 'Unknown User';
  }

  getUserInitials(message: Message): string {
    return message.user?.initials || 'U';
  }

  refresh() {
    this.loadThreads();
  }

  // Helper method for template to check if message is from current user
  isCurrentUserMessage(message: Message): boolean {
    return message.user?.name === 'You';
  }
}