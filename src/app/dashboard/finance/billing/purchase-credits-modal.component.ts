// import {
//   Component,
//   Input,
//   Output,
//   EventEmitter,
//   signal,
//   inject,
//   OnInit,
// } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { LucideAngularModule, X, AlertCircle } from 'lucide-angular';
// import { StripeService } from '../../services/stripe.service';
// import { DatabaseActivityService } from 'src/app/shared/services/database-activity.service';
// import { AuthService } from 'src/app/auth/production.auth.service';

// @Component({
//   selector: 'app-purchase-credits-modal',
//   standalone: true,
//   imports: [CommonModule, FormsModule, LucideAngularModule],
//   template: `
//     @if (isOpen) {
//     <!-- Backdrop -->
//     <div
//       class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200"
//       (click)="onBackdropClick()"
//     ></div>

//     <!-- Modal -->
//     <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
//       <div
//         class="bg-white rounded-2xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
//       >
//         <!-- Header -->
//         <div
//           class="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between"
//         >
//           <h2 class="text-lg font-bold text-slate-900">Purchase Credits</h2>
//           <button
//             (click)="onBackdropClick()"
//             class="text-slate-500 hover:text-slate-700 transition-colors duration-200"
//             [disabled]="isProcessing()"
//           >
//             <lucide-icon [img]="XIcon" [size]="24" />
//           </button>
//         </div>

//         <!-- Content -->
//         <div class="p-6 space-y-6">
//           <!-- Price Info -->
//           <div class="bg-teal-50 rounded-xl p-4 border border-teal-200/50">
//             <p
//               class="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1"
//             >
//               Pricing
//             </p>
//             <p class="text-sm text-teal-900">
//               <span class="font-semibold">R0.01</span> per credit
//             </p>
//           </div>

//           <!-- Amount Input -->
//           <div>
//             <label class="block text-sm font-semibold text-slate-900 mb-2">
//               Number of Credits
//               <span class="text-teal-600">*</span>
//             </label>
//             <div class="relative">
//               <input
//                 type="number"
//                 [(ngModel)]="creditAmount"
//                 (ngModelChange)="onCreditAmountChange()"
//                 [min]="minCredits"
//                 [step]="stepSize"
//                 class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
//                 placeholder="Enter credit amount"
//                 [disabled]="isProcessing()"
//               />
//               <span
//                 class="absolute right-4 top-3 text-slate-500 text-sm font-medium"
//               >
//                 credits
//               </span>
//             </div>
//             <p class="text-xs text-slate-500 mt-2">
//               Minimum: {{ formatNumber(minCredits) }} credits
//             </p>
//           </div>

//           <!-- Cost Breakdown -->
//           <div class="bg-teal-50 rounded-xl p-4 border border-teal-200/50">
//             <div class="space-y-2 mb-3">
//               <div class="flex justify-between items-center">
//                 <span class="text-sm font-medium text-slate-600">Credits</span>
//                 <span class="font-semibold text-slate-900">
//                   {{ formatNumber(creditAmount) }}
//                 </span>
//               </div>
//               <div class="flex justify-between items-center">
//                 <span class="text-sm font-medium text-slate-600">Rate</span>
//                 <span class="font-semibold text-slate-900">R0.01/credit</span>
//               </div>
//             </div>
//             <div
//               class="border-t border-teal-200/50 pt-3 flex justify-between items-center"
//             >
//               <span class="font-semibold text-slate-900">Total Cost</span>
//               <span class="text-2xl font-bold text-teal-600">
//                 {{ formatCurrency(totalCostZAR) }}
//               </span>
//             </div>
//           </div>

//           <!-- Error State -->
//           @if (error()) {
//           <div
//             class="bg-red-50 border border-red-200/50 rounded-xl p-4 flex gap-3"
//           >
//             <lucide-icon
//               [img]="AlertIcon"
//               [size]="20"
//               class="text-red-600 flex-shrink-0 mt-0.5"
//             />
//             <div class="flex-1">
//               <p class="text-sm font-semibold text-red-900">Payment Failed</p>
//               <p class="text-xs text-red-700 mt-1">{{ error() }}</p>
//             </div>
//           </div>
//           }

//           <!-- Action Buttons -->
//           <div class="flex gap-3 pt-2">
//             <button
//               (click)="onBackdropClick()"
//               class="flex-1 px-4 py-2.5 border border-slate-200 text-slate-900 font-medium rounded-xl hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//               [disabled]="isProcessing()"
//             >
//               Cancel
//             </button>
//             <button
//               (click)="handleCheckout()"
//               class="flex-1 px-4 py-2.5 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               [disabled]="!isValidAmount() || isProcessing()"
//             >
//               @if (isProcessing()) {
//               <div
//                 class="w-4 h-4 rounded-full border-2 border-white border-t-teal-300 animate-spin"
//               ></div>
//               <span>Processing...</span>
//               } @else {
//               <span>Continue to Payment</span>
//               }
//             </button>
//           </div>

//           <!-- Terms -->
//           <p class="text-xs text-slate-500 text-center">
//             By proceeding, you agree to our Terms of Service and Privacy Policy.
//           </p>
//         </div>
//       </div>
//     </div>
//     }
//   `,
//   styles: [
//     `
//       :host {
//         display: block;
//       }
//     `,
//   ],
// })
// export class PurchaseCreditsModalComponent implements OnInit {
//   @Input() isOpen = false;
//   @Input() organizationId = '';
//   @Output() close = new EventEmitter<void>();
//   @Output() success = new EventEmitter<void>();

//   private stripeService = inject(StripeService);
//   private activityService = inject(DatabaseActivityService);
//   private authService = inject(AuthService);

//   XIcon = X;
//   AlertIcon = AlertCircle;

//   creditAmount = 50000;
//   isProcessing = signal(false);
//   error = signal<string | null>(null);

//   readonly minCredits = 10000;
//   readonly stepSize = 1000;
//   readonly creditsPerZAR = 100;

//   get totalCostZAR(): number {
//     return this.creditAmount / this.creditsPerZAR;
//   }

//   ngOnInit() {
//     if (this.isOpen) {
//       this.trackPurchaseInitiated();
//     }
//   }

//   /**
//    * Track that user opened purchase modal (intent)
//    */
//   private trackPurchaseInitiated(): void {
//     this.activityService
//       .createActivity({
//         type: 'system',
//         action: 'credit_purchase_initiated',
//         message: 'User opened purchase modal',
//         metadata: { step: 'intent' },
//       })
//       .subscribe({
//         error: (err) => console.warn('Failed to track purchase intent:', err),
//       });
//   }

//   /**
//    * Track successful credit purchase (completion)
//    */
//   private trackPurchaseCompleted(creditAmount: number, costZAR: number): void {
//     this.activityService
//       .createActivity({
//         type: 'system',
//         action: 'credit_purchase_completed',
//         message: `Purchased ${this.formatNumber(
//           creditAmount
//         )} credits for ${this.formatCurrency(costZAR)}`,
//         amount: creditAmount,
//         metadata: {
//           step: 'completion',
//           creditsPurchased: creditAmount,
//           costZAR: costZAR,
//         },
//       })
//       .subscribe({
//         error: (err) =>
//           console.warn('Failed to track purchase completion:', err),
//       });
//   }

//   /**
//    * Track failed credit purchase
//    */
//   private trackPurchaseFailed(errorMessage: string): void {
//     this.activityService
//       .createActivity({
//         type: 'system',
//         action: 'credit_purchase_failed',
//         message: `Payment failed: ${errorMessage}`,
//         metadata: {
//           step: 'failed',
//           error: errorMessage,
//         },
//       })
//       .subscribe({
//         error: (err) => console.warn('Failed to track purchase failure:', err),
//       });
//   }

//   onCreditAmountChange(): void {
//     this.error.set(null);
//     // Round to nearest step size
//     this.creditAmount =
//       Math.round(this.creditAmount / this.stepSize) * this.stepSize;
//     // Enforce minimum
//     if (this.creditAmount < this.minCredits) {
//       this.creditAmount = this.minCredits;
//     }
//   }

//   isValidAmount(): boolean {
//     return this.creditAmount >= this.minCredits;
//   }

//   formatNumber(num: number): string {
//     return num.toLocaleString('en-ZA');
//   }

//   formatCurrency(amount: number): string {
//     return amount.toLocaleString('en-ZA', {
//       style: 'currency',
//       currency: 'ZAR',
//       minimumFractionDigits: 0,
//     });
//   }

//   onBackdropClick(): void {
//     if (!this.isProcessing()) {
//       this.close.emit();
//     }
//   }

//   async handleCheckout(): Promise<void> {
//     if (!this.isValidAmount()) {
//       this.error.set(
//         `Minimum ${this.formatNumber(this.minCredits)} credits required`
//       );
//       return;
//     }

//     if (!this.organizationId) {
//       this.error.set('Organization not found');
//       this.trackPurchaseFailed('Organization not found');
//       return;
//     }

//     this.isProcessing.set(true);
//     this.error.set(null);

//     try {
//       const result = await this.stripeService.createCheckoutSession({
//         organizationId: this.organizationId,
//         creditAmount: this.creditAmount,
//         amountZAR: this.totalCostZAR,
//       });

//       if (result.success && result.sessionId && result.publicKey) {
//         try {
//           // Track successful payment
//           this.trackPurchaseCompleted(this.creditAmount, this.totalCostZAR);

//           // Redirect to checkout
//           await this.stripeService.redirectToCheckout(
//             result.sessionId,
//             result.publicKey
//           );

//           // Emit success after redirect
//           this.success.emit();
//           this.close.emit();
//         } catch (redirectErr) {
//           const errorMsg =
//             redirectErr instanceof Error
//               ? redirectErr.message
//               : 'Failed to redirect to payment';
//           this.error.set(errorMsg);
//           this.trackPurchaseFailed(errorMsg);
//           this.isProcessing.set(false);
//         }
//       } else {
//         const errorMsg = result.error || 'Failed to create checkout session';
//         this.error.set(errorMsg);
//         this.trackPurchaseFailed(errorMsg);
//         this.isProcessing.set(false);
//       }
//     } catch (err) {
//       const errorMsg = err instanceof Error ? err.message : 'Unknown error';
//       this.error.set(errorMsg);
//       this.trackPurchaseFailed(errorMsg);
//       this.isProcessing.set(false);
//     }
//   }
// }
import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, AlertCircle, Loader } from 'lucide-angular';
import { PaystackService } from '../../services/paystack.service';
import { DatabaseActivityService } from 'src/app/shared/services/database-activity.service';
import { AuthService } from 'src/app/auth/production.auth.service';

@Component({
  selector: 'app-purchase-credits-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    @if (isOpen) {
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200"
      (click)="onBackdropClick()"
    ></div>

    <!-- Modal -->
    <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div
        class="bg-white rounded-2xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <!-- Header -->
        <div
          class="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between"
        >
          <h2 class="text-lg font-bold text-slate-900">Purchase Credits</h2>
          <button
            (click)="onBackdropClick()"
            class="text-slate-500 hover:text-slate-700 transition-colors duration-200"
            [disabled]="isProcessing()"
          >
            <lucide-icon [img]="XIcon" [size]="24" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Price Info -->
          <div class="bg-teal-50 rounded-xl p-4 border border-teal-200/50">
            <p
              class="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1"
            >
              Pricing
            </p>
            <p class="text-sm text-teal-900">
              <span class="font-semibold">R0.01</span> per credit
            </p>
          </div>

          <!-- Amount Input -->
          <div>
            <label class="block text-sm font-semibold text-slate-900 mb-2">
              Number of Credits
              <span class="text-teal-600">*</span>
            </label>
            <div class="relative">
              <input
                type="number"
                [(ngModel)]="creditAmount"
                (ngModelChange)="onCreditAmountChange()"
                [min]="minCredits"
                [step]="stepSize"
                class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter credit amount"
                [disabled]="isProcessing()"
              />
              <span
                class="absolute right-4 top-3 text-slate-500 text-sm font-medium"
              >
                credits
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-2">
              Minimum: {{ formatNumber(minCredits) }} credits
            </p>
          </div>

          <!-- Cost Breakdown -->
          <div class="bg-teal-50 rounded-xl p-4 border border-teal-200/50">
            <div class="space-y-2 mb-3">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-slate-600">Credits</span>
                <span class="font-semibold text-slate-900">
                  {{ formatNumber(creditAmount) }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-slate-600">Rate</span>
                <span class="font-semibold text-slate-900">R0.01/credit</span>
              </div>
            </div>
            <div
              class="border-t border-teal-200/50 pt-3 flex justify-between items-center"
            >
              <span class="font-semibold text-slate-900">Total Cost</span>
              <span class="text-2xl font-bold text-teal-600">
                {{ formatCurrency(totalCostZAR) }}
              </span>
            </div>
          </div>

          <!-- Error State -->
          @if (error()) {
          <div
            class="bg-red-50 border border-red-200/50 rounded-xl p-4 flex gap-3"
          >
            <lucide-icon
              [img]="AlertIcon"
              [size]="20"
              class="text-red-600 flex-shrink-0 mt-0.5"
            />
            <div class="flex-1">
              <p class="text-sm font-semibold text-red-900">Payment Failed</p>
              <p class="text-xs text-red-700 mt-1">{{ error() }}</p>
            </div>
          </div>
          }

          <!-- Action Buttons -->
          <div class="flex gap-3 pt-2">
            <button
              (click)="onBackdropClick()"
              class="flex-1 px-4 py-2.5 border border-slate-200 text-slate-900 font-medium rounded-xl hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="isProcessing()"
            >
              Cancel
            </button>
            <button
              (click)="handlePayment()"
              class="flex-1 px-4 py-2.5 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              [disabled]="!isValidAmount() || isProcessing()"
            >
              @if (isProcessing()) {
              <lucide-icon
                [img]="LoaderIcon"
                [size]="16"
                class="animate-spin"
              />
              <span>Processing...</span>
              } @else {
              <span>Continue to Payment</span>
              }
            </button>
          </div>

          <!-- Terms -->
          <p class="text-xs text-slate-500 text-center">
            By proceeding, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class PurchaseCreditsModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() organizationId = '';
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private paystackService = inject(PaystackService);
  private activityService = inject(DatabaseActivityService);
  private authService = inject(AuthService);

  XIcon = X;
  AlertIcon = AlertCircle;
  LoaderIcon = Loader;

  creditAmount = 50000;
  isProcessing = signal(false);
  error = signal<string | null>(null);

  readonly minCredits = 10000;
  readonly stepSize = 1000;
  readonly creditsPerZAR = 100;

  get totalCostZAR(): number {
    return this.creditAmount / this.creditsPerZAR;
  }

  ngOnInit() {
    if (this.isOpen) {
      this.trackPurchaseInitiated();
    }
  }

  /**
   * Track that user opened purchase modal (intent)
   */
  private trackPurchaseInitiated(): void {
    this.activityService
      .createActivity({
        type: 'system',
        action: 'credit_purchase_initiated',
        message: 'User opened purchase modal',
        metadata: { step: 'intent', provider: 'paystack' },
      })
      .subscribe({
        error: (err) => console.warn('Failed to track purchase intent:', err),
      });
  }

  /**
   * Track successful credit purchase
   */
  private trackPurchaseCompleted(
    creditAmount: number,
    costZAR: number,
    reference: string
  ): void {
    this.activityService
      .createActivity({
        type: 'system',
        action: 'credit_purchase_completed',
        message: `Purchased ${this.formatNumber(
          creditAmount
        )} credits for ${this.formatCurrency(costZAR)}`,
        amount: creditAmount,
        metadata: {
          step: 'completion',
          provider: 'paystack',
          creditsPurchased: creditAmount,
          costZAR: costZAR,
          paystackReference: reference,
        },
      })
      .subscribe({
        error: (err) =>
          console.warn('Failed to track purchase completion:', err),
      });
  }

  /**
   * Track failed credit purchase
   */
  private trackPurchaseFailed(errorMessage: string): void {
    this.activityService
      .createActivity({
        type: 'system',
        action: 'credit_purchase_failed',
        message: `Payment failed: ${errorMessage}`,
        metadata: {
          step: 'failed',
          provider: 'paystack',
          error: errorMessage,
        },
      })
      .subscribe({
        error: (err) => console.warn('Failed to track purchase failure:', err),
      });
  }

  onCreditAmountChange(): void {
    this.error.set(null);
    // Round to nearest step size
    this.creditAmount =
      Math.round(this.creditAmount / this.stepSize) * this.stepSize;
    // Enforce minimum
    if (this.creditAmount < this.minCredits) {
      this.creditAmount = this.minCredits;
    }
  }

  isValidAmount(): boolean {
    return this.creditAmount >= this.minCredits;
  }

  formatNumber(num: number): string {
    return num.toLocaleString('en-ZA');
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    });
  }

  onBackdropClick(): void {
    if (!this.isProcessing()) {
      this.close.emit();
    }
  }

  async handlePayment(): Promise<void> {
    if (!this.isValidAmount()) {
      this.error.set(
        `Minimum ${this.formatNumber(this.minCredits)} credits required`
      );
      return;
    }

    if (!this.organizationId) {
      this.error.set('Organization not found');
      this.trackPurchaseFailed('Organization not found');
      return;
    }

    this.isProcessing.set(true);
    this.error.set(null);

    try {
      // Step 1: Initialize transaction on backend
      console.log('📝 Initializing payment...');
      const initResult = await this.paystackService.initializeTransaction({
        organizationId: this.organizationId,
        creditAmount: this.creditAmount,
        amountZAR: this.totalCostZAR,
      });

      if (!initResult.success || !initResult.accessCode) {
        const errorMsg = initResult.error || 'Failed to initialize payment';
        console.error('❌ Init failed:', errorMsg);
        this.error.set(errorMsg);
        this.trackPurchaseFailed(errorMsg);
        this.isProcessing.set(false);
        return;
      }

      console.log('✅ Payment initialized, opening Paystack popup...');

      // Step 2: Open Paystack Popup
      let reference: string;
      try {
        reference = await this.paystackService.openPaystackPopup(
          initResult.accessCode
        );
      } catch (popupErr) {
        const errorMsg =
          popupErr instanceof Error ? popupErr.message : 'Popup error';

        // User cancelled payment
        if (errorMsg.includes('cancelled')) {
          console.log('ℹ️ User cancelled payment');
          this.isProcessing.set(false);
          this.close.emit();
          return;
        }

        // Popup error
        console.error('❌ Popup error:', errorMsg);
        this.error.set(errorMsg);
        this.trackPurchaseFailed(errorMsg);
        this.isProcessing.set(false);
        return;
      }

      console.log('✅ Payment completed, reference:', reference);

      // Step 3: Verify payment (backend will add credits + create invoice)
      console.log('🔍 Verifying payment...');
      const verifyResult = await this.paystackService.verifyPayment(reference);

      if (!verifyResult.success) {
        const errorMsg = verifyResult.error || 'Payment verification failed';
        console.error('❌ Verification failed:', errorMsg);
        this.error.set(errorMsg);
        this.trackPurchaseFailed(errorMsg);
        this.isProcessing.set(false);
        return;
      }

      console.log('✅ Verification successful');

      // Track success
      this.trackPurchaseCompleted(
        this.creditAmount,
        this.totalCostZAR,
        reference
      );

      // Close modal and notify parent
      this.success.emit();
      this.close.emit();
      this.isProcessing.set(false);

      // Redirect to success page
      console.log('📍 Redirecting to success page...');
      window.location.href = `/credits?status=success&reference=${reference}`;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Payment error:', errorMsg);
      this.error.set(errorMsg);
      this.trackPurchaseFailed(errorMsg);
      this.isProcessing.set(false);
    }
  }
}
