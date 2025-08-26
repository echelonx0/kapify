// src/app/shared/components/messaging.component.ts
import { Component, signal, computed, OnInit, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
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

interface ActivityMessage {
  id: string;
  type: 'message' | 'update' | 'comment' | 'file';
  user: {
    name: string;
    avatar?: string;
    initials: string;
    role?: string;
  };
  content: string;
  timestamp: Date;
  projectName?: string;
  isRead: boolean;
  replies?: ActivityMessage[];
  parentId?: string;
}

interface MessageThread {
  id: string;
  subject: string;
  lastMessage: ActivityMessage;
  messageCount: number;
  unreadCount: number;
  participants: string[];
  messages: ActivityMessage[];
}

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
export class ActivityInboxComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
 
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
  
  private shouldScrollToBottom = false;

  ngOnInit() {
    this.loadThreads();
    this.simulateIncomingMessages();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom && this.messagesContainer) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom() {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch(err) {}
  }

  // Computed properties
  filteredThreads = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.threads();
    
    return this.threads().filter(thread => 
      thread.subject.toLowerCase().includes(query) ||
      thread.lastMessage.content.toLowerCase().includes(query) ||
      thread.lastMessage.user.name.toLowerCase().includes(query)
    );
  });

  private loadThreads() {
    // Mock thread data
    const mockThreads: MessageThread[] = [
      {
        id: 'thread-1',
        subject: 'Tech Startup Growth Capital Application',
        lastMessage: {
          id: 'msg-1',
          type: 'message',
          user: { name: 'Sarah Johnson', initials: 'SJ', role: 'Senior Analyst' },
          content: 'Your application has moved to due diligence stage. Please prepare additional financial documents.',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          projectName: 'Tech Growth Application',
          isRead: false
        },
        messageCount: 5,
        unreadCount: 2,
        participants: ['Sarah Johnson', 'You'],
        messages: [
          {
            id: 'msg-1-1',
            type: 'message',
            user: { name: 'Sarah Johnson', initials: 'SJ', role: 'Senior Analyst' },
            content: 'Hi! I\'ve reviewed your initial application and I\'m impressed with your business model.',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            isRead: true
          },
          {
            id: 'msg-1-2',
            type: 'message',
            user: { name: 'You', initials: 'YU' },
            content: 'Thank you for the positive feedback! I\'m excited to move forward with the process.',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
            isRead: true
          },
          {
            id: 'msg-1-3',
            type: 'update',
            user: { name: 'Sarah Johnson', initials: 'SJ', role: 'Senior Analyst' },
            content: 'I\'ve scheduled a call with our investment committee for next week. Please prepare a detailed market analysis.',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
            isRead: true
          },
          {
            id: 'msg-1-4',
            type: 'file',
            user: { name: 'You', initials: 'YU' },
            content: 'Uploaded the requested market analysis document.',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
            isRead: true
          },
          {
            id: 'msg-1-5',
            type: 'message',
            user: { name: 'Sarah Johnson', initials: 'SJ', role: 'Senior Analyst' },
            content: 'Your application has moved to due diligence stage. Please prepare additional financial documents.',
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            isRead: false
          }
        ]
      },
      {
        id: 'thread-2',
        subject: 'Manufacturing Equipment Finance - Approved!',
        lastMessage: {
          id: 'msg-2',
          type: 'update',
          user: { name: 'Mike Chen', initials: 'MC', role: 'Loan Officer' },
          content: 'Congratulations! Your Manufacturing Equipment Finance application has been approved.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          projectName: 'Equipment Finance',
          isRead: true
        },
        messageCount: 3,
        unreadCount: 0,
        participants: ['Mike Chen', 'You'],
        messages: [
          {
            id: 'msg-2-1',
            type: 'message',
            user: { name: 'Mike Chen', initials: 'MC', role: 'Loan Officer' },
            content: 'Your equipment finance application is under final review. We should have a decision within 48 hours.',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            isRead: true
          },
          {
            id: 'msg-2-2',
            type: 'message',
            user: { name: 'You', initials: 'YU' },
            content: 'Thank you for the update. Looking forward to hearing back from you.',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000),
            isRead: true
          },
          {
            id: 'msg-2-3',
            type: 'update',
            user: { name: 'Mike Chen', initials: 'MC', role: 'Loan Officer' },
            content: 'Congratulations! Your Manufacturing Equipment Finance application has been approved. The loan documentation will be sent to you shortly.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            isRead: true
          }
        ]
      },
      {
        id: 'thread-3',
        subject: 'AgriTech Innovation Grant - Documentation Required',
        lastMessage: {
          id: 'msg-3',
          type: 'comment',
          user: { name: 'Lisa Park', initials: 'LP', role: 'Grant Coordinator' },
          content: 'Could you provide more details on the market validation for your AgriTech solution?',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          projectName: 'AgriTech Grant',
          isRead: true
        },
        messageCount: 2,
        unreadCount: 0,
        participants: ['Lisa Park', 'You'],
        messages: [
          {
            id: 'msg-3-1',
            type: 'message',
            user: { name: 'Lisa Park', initials: 'LP', role: 'Grant Coordinator' },
            content: 'Thank you for submitting your AgriTech innovation grant application. The technical review looks promising.',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
            isRead: true
          },
          {
            id: 'msg-3-2',
            type: 'comment',
            user: { name: 'Lisa Park', initials: 'LP', role: 'Grant Coordinator' },
            content: 'The financial projections look strong. Could you provide more details on the market validation and your pilot program results?',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            isRead: true
          }
        ]
      }
    ];

    this.threads.set(mockThreads);
  }

  private simulateIncomingMessages() {
    // Simulate new messages every 45 seconds
    setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance of new message
        const threads = this.threads();
        if (threads.length > 0) {
          const randomThread = threads[Math.floor(Math.random() * threads.length)];
          const newMessage: ActivityMessage = {
            id: `msg-${Date.now()}`,
            type: 'message',
            user: { 
              name: this.getRandomUser(), 
              initials: this.getRandomUser().split(' ').map(n => n[0]).join(''),
              role: this.getRandomRole()
            },
            content: this.getRandomMessage(),
            timestamp: new Date(),
            isRead: false
          };

          // Update the thread
          const updatedThreads = threads.map(thread => {
            if (thread.id === randomThread.id) {
              return {
                ...thread,
                lastMessage: newMessage,
                messageCount: thread.messageCount + 1,
                unreadCount: thread.unreadCount + 1,
                messages: [...thread.messages, newMessage]
              };
            }
            return thread;
          });

          this.threads.set(updatedThreads);

          // If this thread is currently selected, scroll to bottom
          if (this.selectedThread()?.id === randomThread.id) {
            this.shouldScrollToBottom = true;
          }
        }
      }
    }, 45000);
  }

  selectThread(thread: MessageThread) {
    // Mark all messages as read when opening thread
    const updatedThread = {
      ...thread,
      unreadCount: 0,
      messages: thread.messages.map(msg => ({ ...msg, isRead: true }))
    };
    
    this.selectedThread.set(updatedThread);
    this.shouldScrollToBottom = true;

    // Update the threads list
    this.threads.update(threads => 
      threads.map(t => t.id === thread.id ? updatedThread : t)
    );
  }

  closeThread() {
    this.selectedThread.set(null);
    this.replyMessage.set('');
  }

  sendReply() {
    const message = this.replyMessage().trim();
    if (!message || !this.selectedThread()) return;

    const newMessage: ActivityMessage = {
      id: `msg-${Date.now()}`,
      type: 'message',
      user: { name: 'You', initials: 'YU' },
      content: message,
      timestamp: new Date(),
      isRead: true
    };

    // Update selected thread
    const currentThread = this.selectedThread()!;
    const updatedThread = {
      ...currentThread,
      lastMessage: newMessage,
      messageCount: currentThread.messageCount + 1,
      messages: [...currentThread.messages, newMessage]
    };

    this.selectedThread.set(updatedThread);

    // Update threads list
    this.threads.update(threads => 
      threads.map(t => t.id === currentThread.id ? updatedThread : t)
    );

    this.replyMessage.set('');
    this.shouldScrollToBottom = true;
  }

  onEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendReply();
    }
  }

  getParticipantsList(thread: MessageThread): string {
    return thread.participants.join(', ');
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  private getRandomUser(): string {
    const users = ['Sarah Johnson', 'Mike Chen', 'Lisa Park', 'David Wilson', 'Emma Thompson'];
    return users[Math.floor(Math.random() * users.length)];
  }

  private getRandomRole(): string {
    const roles = ['Senior Analyst', 'Loan Officer', 'Grant Coordinator', 'Investment Manager', 'Compliance Officer'];
    return roles[Math.floor(Math.random() * roles.length)];
  }

  private getRandomMessage(): string {
    const messages = [
      'Your application status has been updated.',
      'Please provide additional documentation.',
      'The review committee has scheduled a meeting.',
      'Congratulations on reaching the next stage!',
      'We need clarification on your financial projections.'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}