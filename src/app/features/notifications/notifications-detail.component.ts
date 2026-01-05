import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
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

import { NotificationsInputComponent } from './notifications-input.component';
import {
  MessageThread,
  MessagingService,
  Message,
} from 'src/app/messaging/services/messaging.service';

@Component({
  selector: 'app-notifications-detail',
  standalone: true,
  imports: [CommonModule, NotificationsInputComponent],
  templateUrl: './notifications-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('messageAppear', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(8px)' }),
        animate(
          '200ms 50ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class NotificationsDetailComponent implements OnInit {
  @Input() thread!: MessageThread;
  @Output() onClose = new EventEmitter<void>();

  @ViewChild('messagesContainer') messagesContainer?: ElementRef;

  private messagingService = inject(MessagingService);

  isSending = signal(false);
  currentUser = signal<any>(null);

  constructor() {
    // Subscribe to current user
    effect(() => {
      this.messagingService.currentUser$.subscribe((user) => {
        this.currentUser.set(user);
      });
    });
  }

  ngOnInit(): void {
    this.scrollToBottom();
  }

  /**
   * Send a reply message
   */
  async onMessageSend(content: string): Promise<void> {
    if (!content.trim() || !this.thread) return;

    this.isSending.set(true);
    const success = await this.messagingService.sendMessage(
      this.thread.id,
      content.trim(),
      'message'
    );

    this.isSending.set(false);

    if (success) {
      this.scrollToBottom();
    }
  }

  /**
   * Scroll to bottom of messages
   */
  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  /**
   * Format time for display
   */
  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format date for message grouping
   */
  formatMessageDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year:
          date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  }

  /**
   * Check if message date is different from previous
   */
  shouldShowDateSeparator(currentMsg: Message, previousMsg?: Message): boolean {
    if (!previousMsg) return true;
    const currentDate = new Date(currentMsg.created_at).toDateString();
    const previousDate = new Date(previousMsg.created_at).toDateString();
    return currentDate !== previousDate;
  }

  /**
   * Check if consecutive message from same user
   */
  isConsecutiveMessage(currentMsg: Message, nextMsg?: Message): boolean {
    if (!nextMsg) return false;
    return currentMsg.sender_id === nextMsg.sender_id;
  }

  /**
   * Track by message ID for performance
   */
  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }

  /**
   * Get message alignment and styling
   */
  isOwnMessage(message: Message): boolean {
    return message.sender_id === this.currentUser()?.id;
  }

  /**
   * Get avatar color based on user type
   */
  getAvatarColor(userType?: string): string {
    const colorMap: Record<string, string> = {
      funder: 'from-blue-400 to-blue-600',
      sme: 'from-teal-400 to-teal-600',
      consultant: 'from-purple-400 to-purple-600',
    };
    return colorMap[userType || ''] || 'from-slate-400 to-slate-600';
  }

  /**
   * Close detail view
   */
  closeDetail(): void {
    this.onClose.emit();
  }
}
