import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  signal,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notifications-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsInputComponent {
  @Input() threadId!: string;
  @Input() isSending = false;
  @Output() onSend = new EventEmitter<string>();

  @ViewChild('textarea') textarea?: ElementRef<HTMLTextAreaElement>;

  messageContent = signal('');
  textareaHeight = signal('auto');

  constructor() {
    // Auto-expand textarea
    effect(() => {
      setTimeout(() => {
        this.adjustTextareaHeight();
      });
    });
  }

  /**
   * Handle textarea input and auto-expand
   */
  onInput(): void {
    this.adjustTextareaHeight();
  }

  /**
   * Adjust textarea height based on content
   */
  private adjustTextareaHeight(): void {
    if (!this.textarea) return;

    const textarea = this.textarea.nativeElement;
    textarea.style.height = 'auto';

    const height = Math.min(textarea.scrollHeight, 160); // Max 160px
    this.textareaHeight.set(`${height}px`);
  }

  /**
   * Handle textarea input and update signal
   */
  onTextareaInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.messageContent.set(target.value);
    this.adjustTextareaHeight();
  }

  /**
   * Send message on Enter (Ctrl/Cmd + Enter on mobile)
   */
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  /**
   * Send message
   */
  sendMessage(): void {
    const content = this.messageContent().trim();
    if (!content || this.isSending) return;

    this.onSend.emit(content);
    this.messageContent.set('');
    this.textareaHeight.set('auto');

    // Reset textarea
    if (this.textarea) {
      this.textarea.nativeElement.style.height = 'auto';
      this.textarea.nativeElement.focus();
    }
  }

  /**
   * Check if send button should be disabled
   */
  isSendDisabled(): boolean {
    return !this.messageContent().trim() || this.isSending;
  }
}
