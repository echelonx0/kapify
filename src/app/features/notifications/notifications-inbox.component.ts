import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { NotificationsDetailComponent } from './notifications-detail.component';
import {
  MessagingService,
  MessageThread,
} from 'src/app/messaging/services/messaging.service';

@Component({
  selector: 'app-notifications-inbox',
  standalone: true,
  imports: [CommonModule, NotificationsDetailComponent],
  templateUrl: './notifications-inbox.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate(
          '300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateX(0)', opacity: 1 })
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'translateX(100%)', opacity: 0 })
        ),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms 100ms ease-out', style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class NotificationsInboxComponent implements OnInit, OnDestroy {
  private messagingService = inject(MessagingService);

  // Signals for state management
  threads = signal<MessageThread[]>([]);
  selectedThreadId = signal<string | null>(null);
  isLoadingThreads = signal(false);
  isMobile = signal(false);
  searchQuery = signal('');

  // Expose Math for template use
  Math = Math;

  // Computed values
  selectedThread = computed(() => {
    const threadId = this.selectedThreadId();
    return threadId
      ? this.threads().find((t) => t.id === threadId) || null
      : null;
  });

  filteredThreads = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const allThreads = this.threads();

    if (!query) return allThreads;

    return allThreads.filter(
      (thread) =>
        thread.subject.toLowerCase().includes(query) ||
        thread.lastMessage?.content.toLowerCase().includes(query)
    );
  });

  totalUnreadCount = computed(() => {
    return this.threads().reduce((sum, thread) => sum + thread.unreadCount, 0);
  });

  constructor() {
    // Handle responsive behavior
    effect(() => {
      this.checkMobileBreakpoint();
      window.addEventListener('resize', () => this.checkMobileBreakpoint());
    });
  }

  ngOnInit(): void {
    this.loadThreads();
  }

  /**
   * Load all message threads
   */
  private loadThreads(): void {
    this.isLoadingThreads.set(true);
    this.messagingService.loadThreads().then(() => {
      this.messagingService.threads$.subscribe((threads) => {
        this.threads.set(threads);
        this.isLoadingThreads.set(false);
      });
    });
  }

  /**
   * Select a thread and mark as read
   */
  selectThread(threadId: string): void {
    this.selectedThreadId.set(threadId);

    // Auto-mark as read when opened
    this.messagingService.markThreadAsRead(threadId);
  }

  /**
   * Close detail view on mobile
   */
  closeDetail(): void {
    this.selectedThreadId.set(null);
  }

  /**
   * Check if device is mobile
   */
  private checkMobileBreakpoint(): void {
    this.isMobile.set(window.innerWidth < 1024);
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Get badge color based on thread status
   */
  getStatusColor(thread: MessageThread): string {
    if (thread.unreadCount > 0) return 'teal';
    return 'slate';
  }

  /**
   * Track by thread ID for performance
   */
  trackByThreadId(index: number, thread: MessageThread): string {
    return thread.id;
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', () => this.checkMobileBreakpoint());
  }
}
