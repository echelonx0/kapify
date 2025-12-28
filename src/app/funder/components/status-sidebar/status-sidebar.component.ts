// // src/app/shared/components/organization-status-sidebar/organization-status-sidebar.component.ts
// import { Component, signal, inject, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import {
//   LucideAngularModule,
//   Sparkles,
//   Shield,
//   CreditCard,
//   MessageSquare,
//   Bug,
//   Lightbulb,
//   Send,
//   X,
//   ChevronRight,
//   Info,
//   Lock,
//   Zap,
//   TrendingUp,
//   HelpCircle,
//   Check,
// } from 'lucide-angular';
// import {
//   FeedbackService,
//   FeedbackType,
// } from 'src/app/admin/services/feedback.service';
// import { PurchaseCreditsModalComponent } from 'src/app/dashboard/finance/billing/purchase-credits-modal.component';

// @Component({
//   selector: 'app-organization-status-sidebar',
//   standalone: true,
//   imports: [CommonModule, FormsModule, LucideAngularModule, PurchaseCreditsModalComponent],
//   templateUrl: './status-sidebar.component.html',
//   styles: [
//     `
//       /* Fade in animation */
//       @keyframes fadeIn {
//         from {
//           opacity: 0;
//           transform: translateY(10px);
//         }
//         to {
//           opacity: 1;
//           transform: translateY(0);
//         }
//       }

//       .fade-in {
//         opacity: 0;
//         animation: fadeIn 400ms ease-out forwards;
//         animation-delay: var(--delay, 0s);
//       }

//       /* Info card hover */
//       .info-card {
//         opacity: 0;
//         animation: fadeIn 400ms ease-out forwards;
//         animation-delay: var(--delay, 0s);
//       }

//       .info-card:hover {
//         transform: translateX(2px);
//       }

//       /* Feedback button animation */
//       .feedback-button {
//         opacity: 0;
//         animation: fadeIn 400ms ease-out forwards;
//         animation-delay: var(--delay, 0s);
//       }

//       .feedback-button:hover {
//         transform: translateX(4px);
//       }

//       /* Modal animations */
//       @keyframes modalBackdrop {
//         from {
//           opacity: 0;
//         }
//         to {
//           opacity: 1;
//         }
//       }

//       .modal-backdrop {
//         animation: modalBackdrop 300ms ease-out;
//       }

//       @keyframes modalSlideUp {
//         from {
//           opacity: 0;
//           transform: translateY(20px) scale(0.95);
//         }
//         to {
//           opacity: 1;
//           transform: translateY(0) scale(1);
//         }
//       }

//       .modal-slide-up {
//         animation: modalSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1);
//       }

//       /* Toast animation */
//       @keyframes toastSlideUp {
//         from {
//           opacity: 0;
//           transform: translateY(20px);
//         }
//         to {
//           opacity: 1;
//           transform: translateY(0);
//         }
//       }

//       .toast-slide-up {
//         animation: toastSlideUp 400ms cubic-bezier(0.16, 1, 0.3, 1);
//       }

//       /* Custom scrollbar */
//       ::-webkit-scrollbar {
//         width: 6px;
//       }

//       ::-webkit-scrollbar-track {
//         background: transparent;
//       }

//       ::-webkit-scrollbar-thumb {
//         background: #cbd5e1;
//         border-radius: 3px;
//       }

//       ::-webkit-scrollbar-thumb:hover {
//         background: #94a3b8;
//       }

//       /* Accessibility */
//       @media (prefers-reduced-motion: reduce) {
//         *,
//         *::before,
//         *::after {
//           animation-duration: 0.01ms !important;
//           animation-iteration-count: 1 !important;
//           transition-duration: 0.01ms !important;
//         }

//         .fade-in,
//         .info-card,
//         .feedback-button,
//         .modal-backdrop,
//         .modal-slide-up,
//         .toast-slide-up {
//           opacity: 1;
//           transform: none;
//           animation: none;
//         }
//       }
//     `,
//   ],
// })
// export class OrganizationStatusSidebarComponent implements OnInit {
//   private feedbackService = inject(FeedbackService);

//   isPurchaseModalOpen = signal(false);
//   // Icons
//   SparklesIcon = Sparkles;
//   ShieldIcon = Shield;
//   CreditCardIcon = CreditCard;
//   MessageSquareIcon = MessageSquare;
//   BugIcon = Bug;
//   LightbulbIcon = Lightbulb;
//   SendIcon = Send;
//   XIcon = X;
//   ChevronRightIcon = ChevronRight;
//   InfoIcon = Info;
//   LockIcon = Lock;
//   ZapIcon = Zap;
//   TrendingUpIcon = TrendingUp;
//   HelpCircleIcon = HelpCircle;
//   CheckIcon = Check;

//   // State
//   showFeedbackModal = signal(false);
//   feedbackType = signal<FeedbackType>('bug');
//   isSubmitting = signal(false);
//   showSuccessToast = signal(false);

//   feedback = {
//     title: '',
//     description: '',
//     category: '',
//   };

//   ngOnInit() {
//     // Any initialization
//   }

//   openFeedbackForm(type: FeedbackType) {
//     this.feedbackType.set(type);
//     this.feedback = {
//       title: '',
//       description: '',
//       category: '',
//     };
//     this.showFeedbackModal.set(true);
//   }

//   closeFeedbackForm() {
//     this.showFeedbackModal.set(false);
//     this.feedback = {
//       title: '',
//       description: '',
//       category: '',
//     };
//   }

//   getFeedbackTitle(): string {
//     return this.feedbackType() === 'bug' ? 'Report a Bug' : 'Request a Feature';
//   }

//   getFeedbackDescription(): string {
//     return this.feedbackType() === 'bug'
//       ? 'Help us fix issues and improve your experience'
//       : 'Share your ideas to make Kapify better';
//   }

//   getFeedbackIcon() {
//     return this.feedbackType() === 'bug' ? this.BugIcon : this.LightbulbIcon;
//   }

//   getFeedbackIconClass(): string {
//     const baseClass = 'w-10 h-10 rounded-lg flex items-center justify-center';
//     return this.feedbackType() === 'bug'
//       ? `${baseClass} bg-red-500`
//       : `${baseClass} bg-blue-500`;
//   }
//   openPurchaseModal() {
//     this.isPurchaseModalOpen.set(true);
//   }
//   submitFeedback() {
//     if (this.isSubmitting()) return;

//     this.isSubmitting.set(true);

//     const browserInfo = {
//       userAgent: navigator.userAgent,
//       language: navigator.language,
//       platform: navigator.platform,
//       screenResolution: `${window.screen.width}x${window.screen.height}`,
//     };

//     this.feedbackService
//       .createFeedback({
//         type: this.feedbackType(),
//         title: this.feedback.title,
//         description: this.feedback.description,
//         category: this.feedback.category || undefined,
//         browserInfo,
//         pageUrl: window.location.href,
//       })
//       .subscribe({
//         next: () => {
//           this.isSubmitting.set(false);
//           this.showFeedbackModal.set(false);
//           this.showSuccessToast.set(true);

//           // Hide toast after 3 seconds
//           setTimeout(() => {
//             this.showSuccessToast.set(false);
//           }, 3000);
//         },
//         error: (error) => {
//           console.error('Failed to submit feedback:', error);
//           this.isSubmitting.set(false);
//           alert('Failed to submit feedback. Please try again.');
//         },
//       });
//   }
// }

// src/app/shared/components/organization-status-sidebar/organization-status-sidebar.component.ts
import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
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
import { PurchaseCreditsModalComponent } from 'src/app/dashboard/finance/billing/purchase-credits-modal.component';
import {
  OrgCreditService,
  OrgWallet,
} from 'src/app/shared/services/credit.service';

@Component({
  selector: 'app-organization-status-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    PurchaseCreditsModalComponent,
  ],
  templateUrl: './status-sidebar.component.html',
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
export class OrganizationStatusSidebarComponent implements OnInit, OnDestroy {
  private feedbackService = inject(FeedbackService);
  private creditService = inject(OrgCreditService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

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

  // Feedback State
  showFeedbackModal = signal(false);
  feedbackType = signal<FeedbackType>('bug');
  isSubmitting = signal(false);
  showSuccessToast = signal(false);

  feedback = {
    title: '',
    description: '',
    category: '',
  };

  // Purchase Modal State
  isPurchaseModalOpen = signal(false);
  wallet = signal<OrgWallet | null>(null);
  isLoadingWallet = signal(false);

  ngOnInit() {
    this.loadWallet();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================
  // WALLET & PURCHASE MODAL
  // ===================================

  private loadWallet() {
    const orgId = this.authService.getCurrentUserOrganizationId();
    if (!orgId) {
      console.warn('No organization ID found');
      return;
    }

    this.isLoadingWallet.set(true);

    this.creditService
      .getOrCreateOrgWallet(orgId)
      .then((wallet) => {
        this.wallet.set(wallet);
        this.isLoadingWallet.set(false);
      })
      .catch((error) => {
        console.error('Failed to load wallet:', error);
        this.isLoadingWallet.set(false);
      });
  }

  openPurchaseModal() {
    // Ensure wallet is loaded before opening modal
    if (!this.wallet()) {
      this.loadWallet();
    }
    this.isPurchaseModalOpen.set(true);
  }

  closePurchaseModal() {
    this.isPurchaseModalOpen.set(false);
  }

  onPurchaseSuccess() {
    this.closePurchaseModal();
    // Reload wallet to get updated balance
    this.loadWallet();

    // Show success message
    this.showSuccessToast.set(true);
    setTimeout(() => {
      this.showSuccessToast.set(false);
    }, 3000);
  }

  // ===================================
  // FEEDBACK FORM
  // ===================================

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
      .pipe(takeUntil(this.destroy$))
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
