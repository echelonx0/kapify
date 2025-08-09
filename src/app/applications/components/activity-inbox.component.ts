// src/app/shared/components/activity-inbox.component.ts
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
  template: `
    <div class="h-full flex flex-col bg-white">
      <!-- Inbox Header -->
      <div class="px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Activity</h2>
            <p class="text-sm text-gray-600">Recent updates and messages</p>
          </div>
          
          @if (!selectedThread()) {
            <div class="flex items-center space-x-2">
              <div class="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  [(ngModel)]="searchQuery"
                  class="w-32 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <lucide-icon [img]="SearchIcon" [size]="14" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          } @else {
            <button
              (click)="closeThread()"
              class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <lucide-icon [img]="ArrowLeftIcon" [size]="20" class="text-gray-600" />
            </button>
          }
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 overflow-hidden">
        @if (!selectedThread()) {
          <!-- Thread List View -->
          <div class="h-full overflow-y-auto">
            @for (thread of filteredThreads(); track thread.id) {
              <div 
                class="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-all duration-200 transform hover:scale-[1.02]"
                (click)="selectThread(thread)"
              >
                <div class="px-6 py-4">
                  <div class="flex items-start space-x-3">
                    <!-- Avatar -->
                    <div class="flex-shrink-0">
                      @if (thread.lastMessage.user.avatar) {
                        <img [src]="thread.lastMessage.user.avatar" [alt]="thread.lastMessage.user.name" 
                             class="w-10 h-10 rounded-full ring-2 ring-white shadow-sm">
                      } @else {
                        <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium shadow-sm">
                          {{ thread.lastMessage.user.initials }}
                        </div>
                      }
                      @if (thread.unreadCount > 0) {
                        <div class="w-3 h-3 bg-red-500 rounded-full -mt-1 -mr-1 border-2 border-white"></div>
                      }
                    </div>

                    <!-- Message Preview -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center justify-between mb-1">
                        <p class="text-sm font-medium text-gray-900 truncate">
                          {{ thread.lastMessage.user.name }}
                        </p>
                        <div class="flex items-center space-x-2">
                          @if (thread.messageCount > 1) {
                            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {{ thread.messageCount }}
                            </span>
                          }
                          <span class="text-xs text-gray-500">
                            {{ getTimeAgo(thread.lastMessage.timestamp) }}
                          </span>
                        </div>
                      </div>
                      
                      <p class="text-sm text-gray-600 truncate mb-1">{{ thread.subject }}</p>
                      <p class="text-xs text-gray-500 line-clamp-2">{{ thread.lastMessage.content }}</p>
                      
                      @if (thread.lastMessage.projectName) {
                        <div class="mt-2">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {{ thread.lastMessage.projectName }}
                          </span>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }

            @if (filteredThreads().length === 0) {
              <div class="flex items-center justify-center py-12 text-gray-500">
                <div class="text-center">
                  <p class="text-lg font-medium mb-2">No messages found</p>
                  <p class="text-sm">Try adjusting your search criteria</p>
                </div>
              </div>
            }
          </div>
        } @else {
          <!-- Thread Detail View -->
          <div class="h-full flex flex-col">
            <!-- Thread Header -->
            <div class="px-6 py-4 border-b border-gray-200 flex-shrink-0 bg-gray-50">
              <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {{ selectedThread()!.lastMessage.user.initials }}
                </div>
                <div class="flex-1">
                  <h3 class="font-medium text-gray-900">{{ selectedThread()!.subject }}</h3>
                  <p class="text-sm text-gray-600">{{ getParticipantsList(selectedThread()!) }}</p>
                </div>
                <button class="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                  <lucide-icon [img]="MoreVerticalIcon" [size]="16" class="text-gray-600" />
                </button>
              </div>
            </div>

            <!-- Messages -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4" #messagesContainer>
              @for (message of selectedThread()!.messages; track message.id; let isLast = $last) {
                <div 
                  class="animate-slide-in opacity-0"
                  [style.animation-delay]="($index * 50) + 'ms'"
                  [class.self-message]="message.user.name === 'You'"
                >
                  @if (message.user.name === 'You') {
                    <!-- Sent Message -->
                    <div class="flex justify-end">
                      <div class="max-w-xs lg:max-w-md">
                        <div class="bg-blue-600 text-white rounded-lg px-4 py-2 shadow-sm">
                          <p class="text-sm">{{ message.content }}</p>
                        </div>
                        <p class="text-xs text-gray-500 mt-1 text-right">
                          {{ getTimeAgo(message.timestamp) }}
                        </p>
                      </div>
                    </div>
                  } @else {
                    <!-- Received Message -->
                    <div class="flex space-x-3">
                      <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {{ message.user.initials }}
                        </div>
                      </div>
                      <div class="flex-1 max-w-xs lg:max-w-md">
                        <div class="bg-gray-100 rounded-lg px-4 py-2 shadow-sm">
                          <div class="flex items-center space-x-2 mb-1">
                            <span class="text-sm font-medium text-gray-900">{{ message.user.name }}</span>
                            @if (message.user.role) {
                              <span class="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                {{ message.user.role }}
                              </span>
                            }
                          </div>
                          <p class="text-sm text-gray-700">{{ message.content }}</p>
                          
                          @if (message.type === 'file') {
                            <div class="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                              <lucide-icon [img]="PaperclipIcon" [size]="12" />
                              <span>File attachment</span>
                            </div>
                          }
                        </div>
                        <p class="text-xs text-gray-500 mt-1">
                          {{ getTimeAgo(message.timestamp) }}
                        </p>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Message Input -->
            <div class="border-t border-gray-200 p-4 flex-shrink-0 bg-white">
              <div class="flex items-end space-x-3">
                <div class="flex-1">
                  <textarea
                    [(ngModel)]="replyMessage"
                    (keydown)="onEnterKey($event)"
                    placeholder="Type your reply..."
                    rows="2"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  ></textarea>
                </div>
                <div class="flex items-center space-x-2">
                  <button
                    class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Attach file"
                  >
                    <lucide-icon [img]="PaperclipIcon" [size]="18" />
                  </button>
                  <button
                    class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Add emoji"
                  >
                    <lucide-icon [img]="SmileIcon" [size]="18" />
                  </button>
                  <button
                    (click)="sendReply()"
                    [disabled]="!replyMessage().trim()"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    <lucide-icon [img]="SendIcon" [size]="16" class="mr-1" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
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