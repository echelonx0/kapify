import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  CheckCircle,
  ArrowRight,
} from 'lucide-angular';

@Component({
  selector: 'app-account-deletion-complete',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div
      class="fixed inset-0 bg-slate-50 z-50 flex items-center justify-center p-4"
    >
      <div class="max-w-md w-full text-center space-y-6">
        <!-- Success Icon -->
        <div class="flex justify-center">
          <div
            class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center animate-pulse"
          >
            <lucide-icon
              [img]="CheckCircleIcon"
              [size]="32"
              class="text-green-600"
            />
          </div>
        </div>

        <!-- Message -->
        <div class="space-y-2">
          <h2 class="text-2xl font-bold text-slate-900">Account Deleted</h2>
          <p class="text-sm text-slate-600">
            Your account and all associated data have been permanently removed
            from our system.
          </p>
        </div>

        <!-- Additional Info (optional) -->
        <div class="p-4 bg-slate-100/50 rounded-xl space-y-2 text-left">
          <p class="text-xs font-semibold text-slate-900">What was deleted:</p>
          <ul class="space-y-1 text-xs text-slate-600">
            <li class="flex gap-2">
              <span class="text-slate-400 flex-shrink-0">•</span>
              <span>Your profile and authentication records</span>
            </li>
            <li class="flex gap-2">
              <span class="text-slate-400 flex-shrink-0">•</span>
              <span>All applications and documents</span>
            </li>
            <li class="flex gap-2">
              <span class="text-slate-400 flex-shrink-0">•</span>
              <span>Communication history</span>
            </li>
          </ul>
        </div>

        <!-- Auto-redirect countdown -->
        <div class="text-xs text-slate-500 font-medium">
          Redirecting in {{ countdown() }}s...
        </div>

        <!-- Manual redirect button -->
        <button
          type="button"
          (click)="redirectNow()"
          class="w-full px-6 py-2.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 active:bg-teal-700 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <span>Go to Login</span>
          <lucide-icon [img]="ArrowRightIcon" [size]="16" />
        </button>
      </div>
    </div>
  `,
})
export class AccountDeletionCompleteComponent implements OnInit {
  @Input() autoRedirectDelay = 5000; // 5 seconds
  @Output() redirectTriggered = new EventEmitter<void>();

  // Icons
  CheckCircleIcon = CheckCircle;
  ArrowRightIcon = ArrowRight;

  countdown = signal(5);
  private countdownInterval: any;

  ngOnInit() {
    // Start countdown
    let remaining = 5;
    this.countdownInterval = setInterval(() => {
      remaining--;
      this.countdown.set(remaining);

      if (remaining <= 0) {
        clearInterval(this.countdownInterval);
        this.redirectNow();
      }
    }, 1000);
  }

  redirectNow() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.redirectTriggered.emit();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
