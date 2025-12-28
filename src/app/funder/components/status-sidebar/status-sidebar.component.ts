// src/app/shared/components/organization-status-sidebar/organization-status-sidebar.component.ts
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Sparkles,
  Shield,
  CreditCard,
  MessageSquare,
  Bug,
  Lightbulb,
  Send,
  X,
  ChevronRight,
  Info,
  Lock,
  Zap,
  TrendingUp,
  HelpCircle,
  Check,
} from 'lucide-angular';
import { AuthService } from '../../../auth/production.auth.service';
import {
  FeedbackService,
  FeedbackType,
} from 'src/app/admin/services/feedback.service';

@Component({
  selector: 'app-organization-status-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div
      class="h-full flex flex-col bg-white border-l border-slate-200 overflow-hidden"
    >
      <!-- Header -->
      <div
        class="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-blue-50 flex-shrink-0"
      >
        <div class="flex items-center gap-3">
          <div>
            <h2 class="text-base font-bold text-slate-900">Platform Guide</h2>
            <p class="text-xs text-slate-600">How Kapify works</p>
          </div>
        </div>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto">
        <div class="p-6 space-y-6">
          <!-- AI Intelligence Section -->
          <div class="space-y-3 fade-in" style="--delay: 0.1s">
            <div class="flex items-center gap-2 mb-3">
              <div
                class="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center"
              >
                <lucide-icon
                  [img]="SparklesIcon"
                  [size]="16"
                  class="text-purple-600"
                />
              </div>
              <h3 class="text-sm font-bold text-slate-900">
                AI-Powered Matching
              </h3>
            </div>

            <div class="space-y-2">
              <div
                class="flex items-start gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer info-card"
                style="--delay: 0.15s"
              >
                <lucide-icon
                  [img]="ZapIcon"
                  [size]="14"
                  class="text-teal-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p class="text-xs font-semibold text-slate-900">
                    Smart Application Scoring
                  </p>
                  <p class="text-xs text-slate-600 mt-0.5">
                    AI analyzes applications against your criteria automatically
                  </p>
                </div>
              </div>

              <div
                class="flex items-start gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer info-card"
                style="--delay: 0.2s"
              >
                <lucide-icon
                  [img]="TrendingUpIcon"
                  [size]="14"
                  class="text-blue-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p class="text-xs font-semibold text-slate-900">
                    Predictive Analytics
                  </p>
                  <p class="text-xs text-slate-600 mt-0.5">
                    Get insights on application success probability
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Data Privacy Section -->
          <div class="space-y-3 fade-in" style="--delay: 0.25s">
            <div class="flex items-center gap-2 mb-3">
              <div
                class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"
              >
                <lucide-icon
                  [img]="ShieldIcon"
                  [size]="16"
                  class="text-green-600"
                />
              </div>
              <h3 class="text-sm font-bold text-slate-900">Data & Privacy</h3>
            </div>

            <div class="space-y-2">
              <div
                class="flex items-start gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer info-card"
                style="--delay: 0.3s"
              >
                <lucide-icon
                  [img]="LockIcon"
                  [size]="14"
                  class="text-green-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p class="text-xs font-semibold text-slate-900">
                    Bank-Grade Security
                  </p>
                  <p class="text-xs text-slate-600 mt-0.5">
                    256-bit encryption, SOC 2 compliant
                  </p>
                </div>
              </div>

              <div
                class="flex items-start gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer info-card"
                style="--delay: 0.35s"
              >
                <lucide-icon
                  [img]="InfoIcon"
                  [size]="14"
                  class="text-blue-600 flex-shrink-0 mt-0.5"
                />
                <div>
                  <p class="text-xs font-semibold text-slate-900">
                    Your Data, Your Control
                  </p>
                  <p class="text-xs text-slate-600 mt-0.5">
                    Export or delete your data anytime
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pricing Section -->
          <div class="mt-4 space-y-3 fade-in" style="--delay: 0.4s">
            <div class="flex items-center gap-2 mb-8">
              <div
                class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"
              >
                <lucide-icon
                  [img]="CreditCardIcon"
                  [size]="16"
                  class="text-amber-600"
                />
              </div>
              <h3 class="text-sm font-bold text-slate-900">
                Pricing & Subscriptions
              </h3>
            </div>

            <div
              class="p-4 mt-4 bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200/50 rounded-xl"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-slate-900"
                  >Kapify uses a credit system</span
                >
                <span
                  class="px-2 py-0.5 bg-teal-500 text-white text-xs font-bold rounded-full"
                  >Pay as you need</span
                >
              </div>
              <p class="text-xs text-slate-600 mb-3">
                Use credits to unlock premium features like AI-powered matching,
                advanced analytics, and priority support. Only pay for what you
                use.
              </p>
              <button
                class="w-full bg-white text-teal-600 font-semibold text-xs px-4 py-2 rounded-lg border border-teal-200 hover:bg-teal-50 transition-colors"
              >
                Buy More Credits
              </button>
            </div>
          </div>

          <!-- Feedback Section -->
          <div class="space-y-3 fade-in" style="--delay: 0.45s">
            <div class="flex items-center gap-2 mb-3">
              <div
                class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"
              >
                <lucide-icon
                  [img]="MessageSquareIcon"
                  [size]="16"
                  class="text-blue-600"
                />
              </div>
              <h3 class="text-sm font-bold text-slate-900">Help & Feedback</h3>
            </div>

            <div class="space-y-2">
              <button
                (click)="openFeedbackForm('bug')"
                class="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-red-50 hover:border-red-200 border border-transparent transition-all text-left feedback-button"
                style="--delay: 0.5s"
              >
                <div
                  class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0"
                >
                  <lucide-icon
                    [img]="BugIcon"
                    [size]="16"
                    class="text-red-600"
                  />
                </div>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-slate-900">
                    Report a Bug
                  </p>
                  <p class="text-xs text-slate-600">Help us improve</p>
                </div>
                <lucide-icon
                  [img]="ChevronRightIcon"
                  [size]="16"
                  class="text-slate-400"
                />
              </button>

              <button
                (click)="openFeedbackForm('feature')"
                class="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all text-left feedback-button"
                style="--delay: 0.55s"
              >
                <div
                  class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0"
                >
                  <lucide-icon
                    [img]="LightbulbIcon"
                    [size]="16"
                    class="text-blue-600"
                  />
                </div>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-slate-900">
                    Request a Feature
                  </p>
                  <p class="text-xs text-slate-600">Share your ideas</p>
                </div>
                <lucide-icon
                  [img]="ChevronRightIcon"
                  [size]="16"
                  class="text-slate-400"
                />
              </button>

              <button
                class="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 border border-transparent transition-all text-left feedback-button"
                style="--delay: 0.6s"
              >
                <div
                  class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0"
                >
                  <lucide-icon
                    [img]="HelpCircleIcon"
                    [size]="16"
                    class="text-slate-600"
                  />
                </div>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-slate-900">
                    Help Center
                  </p>
                  <p class="text-xs text-slate-600">Browse documentation</p>
                </div>
                <lucide-icon
                  [img]="ChevronRightIcon"
                  [size]="16"
                  class="text-slate-400"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Feedback Modal -->
    @if (showFeedbackModal()) {
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      (click)="closeFeedbackForm()"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/30 backdrop-blur-sm modal-backdrop"
      ></div>

      <!-- Modal -->
      <div
        class="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden modal-slide-up"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div
          class="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <div [class]="getFeedbackIconClass()">
              <lucide-icon
                [img]="getFeedbackIcon()"
                [size]="20"
                class="text-white"
              />
            </div>
            <div>
              <h3 class="text-lg font-bold text-slate-900">
                {{ getFeedbackTitle() }}
              </h3>
              <p class="text-xs text-slate-600">
                {{ getFeedbackDescription() }}
              </p>
            </div>
          </div>
          <button
            (click)="closeFeedbackForm()"
            class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <lucide-icon [img]="XIcon" [size]="20" class="text-slate-600" />
          </button>
        </div>

        <!-- Form -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form (ngSubmit)="submitFeedback()" #feedbackForm="ngForm">
            <!-- Title -->
            <div class="mb-4">
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Title
                <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                [(ngModel)]="feedback.title"
                name="title"
                required
                maxlength="100"
                placeholder="{{
                  feedbackType() === 'bug'
                    ? 'e.g., Form not submitting'
                    : 'e.g., Export to Excel'
                }}"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              />
              <p class="text-xs text-slate-500 mt-1">
                {{ feedback.title.length }}/100 characters
              </p>
            </div>

            <!-- Description -->
            <div class="mb-4">
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Description
                <span class="text-red-500">*</span>
              </label>
              <textarea
                [(ngModel)]="feedback.description"
                name="description"
                required
                rows="6"
                maxlength="1000"
                placeholder="{{ feedbackType() === 'bug' ? 'What happened? What did you expect to happen?' : 'Describe the feature you'd like to see' }}"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
              ></textarea>
              <p class="text-xs text-slate-500 mt-1">
                {{ feedback.description.length }}/1000 characters
              </p>
            </div>

            <!-- Category (for feature requests) -->
            @if (feedbackType() === 'feature') {
            <div class="mb-4">
              <label class="block text-sm font-semibold text-slate-900 mb-2">
                Category (Optional)
              </label>
              <select
                [(ngModel)]="feedback.category"
                name="category"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
              >
                <option value="">Select a category</option>
                <option value="opportunities">Opportunities</option>
                <option value="applications">Applications</option>
                <option value="profile">Profile Management</option>
                <option value="analytics">Analytics & Reporting</option>
                <option value="integrations">Integrations</option>
                <option value="other">Other</option>
              </select>
            </div>
            }

            <!-- Submit Button -->
            <div class="flex gap-3">
              <button
                type="button"
                (click)="closeFeedbackForm()"
                class="flex-1 bg-slate-100 text-slate-700 font-semibold py-3 px-6 rounded-xl hover:bg-slate-200 transition-colors"
                [disabled]="isSubmitting()"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="!feedbackForm.valid || isSubmitting()"
                class="flex-1 bg-teal-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                @if (isSubmitting()) {
                <div
                  class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                ></div>
                <span>Submitting...</span>
                } @else {
                <lucide-icon [img]="SendIcon" [size]="18" />
                <span
                  >Submit
                  {{
                    feedbackType() === 'bug' ? 'Bug Report' : 'Request'
                  }}</span
                >
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    }

    <!-- Success Toast -->
    @if (showSuccessToast()) {
    <div class="fixed bottom-6 right-6 z-50 toast-slide-up">
      <div
        class="bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3"
      >
        <div
          class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center"
        >
          <lucide-icon [img]="CheckIcon" [size]="18" />
        </div>
        <div>
          <p class="font-semibold">Success!</p>
          <p class="text-sm opacity-90">
            Your {{ feedbackType() }} has been submitted
          </p>
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      /* Fade in animation */
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .fade-in {
        opacity: 0;
        animation: fadeIn 400ms ease-out forwards;
        animation-delay: var(--delay, 0s);
      }

      /* Info card hover */
      .info-card {
        opacity: 0;
        animation: fadeIn 400ms ease-out forwards;
        animation-delay: var(--delay, 0s);
      }

      .info-card:hover {
        transform: translateX(2px);
      }

      /* Feedback button animation */
      .feedback-button {
        opacity: 0;
        animation: fadeIn 400ms ease-out forwards;
        animation-delay: var(--delay, 0s);
      }

      .feedback-button:hover {
        transform: translateX(4px);
      }

      /* Modal animations */
      @keyframes modalBackdrop {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .modal-backdrop {
        animation: modalBackdrop 300ms ease-out;
      }

      @keyframes modalSlideUp {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .modal-slide-up {
        animation: modalSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      /* Toast animation */
      @keyframes toastSlideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .toast-slide-up {
        animation: toastSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1);
      }

      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 6px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 3px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }

      /* Accessibility */
      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }

        .fade-in,
        .info-card,
        .feedback-button,
        .modal-backdrop,
        .modal-slide-up,
        .toast-slide-up {
          opacity: 1;
          transform: none;
          animation: none;
        }
      }
    `,
  ],
})
export class OrganizationStatusSidebarComponent implements OnInit {
  private feedbackService = inject(FeedbackService);
  private authService = inject(AuthService);

  // Icons
  SparklesIcon = Sparkles;
  ShieldIcon = Shield;
  CreditCardIcon = CreditCard;
  MessageSquareIcon = MessageSquare;
  BugIcon = Bug;
  LightbulbIcon = Lightbulb;
  SendIcon = Send;
  XIcon = X;
  ChevronRightIcon = ChevronRight;
  InfoIcon = Info;
  LockIcon = Lock;
  ZapIcon = Zap;
  TrendingUpIcon = TrendingUp;
  HelpCircleIcon = HelpCircle;
  CheckIcon = Check;

  // State
  showFeedbackModal = signal(false);
  feedbackType = signal<FeedbackType>('bug');
  isSubmitting = signal(false);
  showSuccessToast = signal(false);

  feedback = {
    title: '',
    description: '',
    category: '',
  };

  ngOnInit() {
    // Any initialization
  }

  openFeedbackForm(type: FeedbackType) {
    this.feedbackType.set(type);
    this.feedback = {
      title: '',
      description: '',
      category: '',
    };
    this.showFeedbackModal.set(true);
  }

  closeFeedbackForm() {
    this.showFeedbackModal.set(false);
    this.feedback = {
      title: '',
      description: '',
      category: '',
    };
  }

  getFeedbackTitle(): string {
    return this.feedbackType() === 'bug' ? 'Report a Bug' : 'Request a Feature';
  }

  getFeedbackDescription(): string {
    return this.feedbackType() === 'bug'
      ? 'Help us fix issues and improve your experience'
      : 'Share your ideas to make Kapify better';
  }

  getFeedbackIcon() {
    return this.feedbackType() === 'bug' ? this.BugIcon : this.LightbulbIcon;
  }

  getFeedbackIconClass(): string {
    const baseClass = 'w-10 h-10 rounded-lg flex items-center justify-center';
    return this.feedbackType() === 'bug'
      ? `${baseClass} bg-red-500`
      : `${baseClass} bg-blue-500`;
  }

  submitFeedback() {
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);

    const browserInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
    };

    this.feedbackService
      .createFeedback({
        type: this.feedbackType(),
        title: this.feedback.title,
        description: this.feedback.description,
        category: this.feedback.category || undefined,
        browserInfo,
        pageUrl: window.location.href,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.showFeedbackModal.set(false);
          this.showSuccessToast.set(true);

          // Hide toast after 3 seconds
          setTimeout(() => {
            this.showSuccessToast.set(false);
          }, 3000);
        },
        error: (error) => {
          console.error('Failed to submit feedback:', error);
          this.isSubmitting.set(false);
          alert('Failed to submit feedback. Please try again.');
        },
      });
  }
}
