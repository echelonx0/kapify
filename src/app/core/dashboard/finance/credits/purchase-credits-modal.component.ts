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
// import { LucideAngularModule, X, Loader, CircleAlert } from 'lucide-angular';
// import { PaystackService } from '../../services/paystack.service';
// import { DatabaseActivityService } from 'src/app/shared/services/database-activity.service';

// @Component({
//   selector: 'app-purchase-credits-modal',
//   standalone: true,
//   imports: [CommonModule, FormsModule, LucideAngularModule],
//   template: `
//     @if (isOpen) {
//       <!-- Backdrop -->
//       <div
//         class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200"
//         (click)="onBackdropClick()"
//       ></div>

//       <!-- Modal -->
//       <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
//         <div
//           class="bg-white rounded-2xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
//         >
//           <!-- Header -->
//           <div
//             class="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between"
//           >
//             <h2 class="text-lg font-bold text-slate-900">Purchase Credits</h2>
//             <button
//               (click)="onBackdropClick()"
//               class="text-slate-500 hover:text-slate-700 transition-colors duration-200"
//               [disabled]="isProcessing()"
//             >
//               <lucide-icon [img]="XIcon" [size]="24" />
//             </button>
//           </div>

//           <!-- Content -->
//           <div class="p-6 space-y-6">
//             <!-- Price Info -->
//             <div class="bg-teal-50 rounded-xl p-4 border border-teal-200/50">
//               <p
//                 class="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1"
//               >
//                 Pricing
//               </p>
//               <p class="text-sm text-teal-900">
//                 <span class="font-semibold">R1.00</span> per credit
//               </p>
//             </div>

//             <!-- Amount Input -->
//             <div>
//               <label class="block text-sm font-semibold text-slate-900 mb-2">
//                 Number of Credits
//                 <span class="text-teal-600">*</span>
//               </label>
//               <div class="relative">
//                 <input
//                   type="number"
//                   [(ngModel)]="creditAmount"
//                   (ngModelChange)="onCreditAmountChange()"
//                   [min]="minCredits"
//                   [step]="stepSize"
//                   class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
//                   placeholder="Enter credit amount"
//                   [disabled]="isProcessing()"
//                 />
//                 <span
//                   class="absolute right-4 top-3 text-slate-500 text-sm font-medium"
//                 >
//                   credits
//                 </span>
//               </div>
//               <p class="text-xs text-slate-500 mt-2">
//                 Minimum: {{ formatNumber(minCredits) }} credits
//               </p>
//             </div>

//             <!-- Cost Breakdown -->
//             <div class="bg-teal-50 rounded-xl p-4 border border-teal-200/50">
//               <div class="space-y-2 mb-3">
//                 <div class="flex justify-between items-center">
//                   <span class="text-sm font-medium text-slate-600"
//                     >Credits</span
//                   >
//                   <span class="font-semibold text-slate-900">
//                     {{ formatNumber(creditAmount) }}
//                   </span>
//                 </div>
//                 <div class="flex justify-between items-center">
//                   <span class="text-sm font-medium text-slate-600">Rate</span>
//                   <span class="font-semibold text-slate-900">R1.00/credit</span>
//                 </div>
//               </div>
//               <div
//                 class="border-t border-teal-200/50 pt-3 flex justify-between items-center"
//               >
//                 <span class="font-semibold text-slate-900">Total Cost</span>
//                 <span class="text-2xl font-bold text-teal-600">
//                   {{ formatCurrency(totalCostZAR) }}
//                 </span>
//               </div>
//             </div>

//             <!-- Error State -->
//             @if (error()) {
//               <div
//                 class="bg-red-50 border border-red-200/50 rounded-xl p-4 flex gap-3"
//               >
//                 <lucide-icon
//                   [img]="AlertIcon"
//                   [size]="20"
//                   class="text-red-600 flex-shrink-0 mt-0.5"
//                 />
//                 <div class="flex-1">
//                   <p class="text-sm font-semibold text-red-900">
//                     {{ error() }}
//                   </p>
//                 </div>
//               </div>
//             }

//             <!-- Terms Checkbox -->
//             <div class="flex items-start gap-3">
//               <input
//                 type="checkbox"
//                 id="termsCheckbox"
//                 [(ngModel)]="termsAccepted"
//                 (ngModelChange)="onTermsChange()"
//                 [disabled]="isProcessing()"
//                 class="mt-1 w-4 h-4 accent-teal-500 cursor-pointer rounded border border-slate-300 transition-colors duration-200"
//               />
//               <label
//                 for="termsCheckbox"
//                 class="text-sm text-slate-700 cursor-pointer leading-relaxed"
//               >
//                 I understand that credits are
//                 <span class="font-semibold">non-refundable</span> and
//                 <span class="font-semibold">non-transferable</span>
//               </label>
//             </div>

//             <!-- Action Buttons -->
//             <div class="flex gap-3 pt-2">
//               <button
//                 (click)="onBackdropClick()"
//                 class="flex-1 px-4 py-2.5 border border-slate-200 text-slate-900 font-medium rounded-xl hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
//                 [disabled]="isProcessing()"
//               >
//                 Cancel
//               </button>
//               <button
//                 (click)="handlePayment()"
//                 class="flex-1 px-4 py-2.5 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                 [disabled]="
//                   !isValidAmount() || !termsAccepted() || isProcessing()
//                 "
//               >
//                 @if (isProcessing()) {
//                   <lucide-icon
//                     [img]="LoaderIcon"
//                     [size]="16"
//                     class="animate-spin"
//                   />
//                   <span>Processing...</span>
//                 } @else {
//                   <span>Continue to Payment</span>
//                 }
//               </button>
//             </div>

//             <!-- Terms -->
//             <p class="text-xs text-slate-500 text-center">
//               By proceeding, you agree to our Terms of Service and Privacy
//               Policy.
//             </p>
//           </div>
//         </div>
//       </div>
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

//   private paystackService = inject(PaystackService);
//   private activityService = inject(DatabaseActivityService);

//   XIcon = X;
//   AlertIcon = CircleAlert;
//   LoaderIcon = Loader;

//   creditAmount = 500;
//   isProcessing = signal(false);
//   error = signal<string | null>(null);
//   termsAccepted = signal(false);

//   readonly minCredits = 100;
//   readonly stepSize = 10;
//   readonly creditsPerZAR = 1; // 1 ZAR = 1 credit

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
//         metadata: { step: 'intent', provider: 'paystack' },
//       })
//       .subscribe({
//         error: (err) => console.warn('Failed to track purchase intent:', err),
//       });
//   }

//   /**
//    * Track terms acceptance
//    */
//   private trackTermsAccepted(): void {
//     this.activityService
//       .createActivity({
//         type: 'system',
//         action: 'credit_terms_accepted',
//         message: 'User accepted non-refundable terms',
//         metadata: { termsVersion: '1.0' },
//       })
//       .subscribe({
//         error: (err) => console.warn('Failed to track terms acceptance:', err),
//       });
//   }

//   /**
//    * Track payment attempt without terms
//    */
//   private trackPaymentAttemptedWithoutTerms(): void {
//     this.activityService
//       .createActivity({
//         type: 'system',
//         action: 'credit_payment_attempted_without_terms',
//         message: 'User attempted payment without accepting terms',
//         metadata: { compliance: 'warning' },
//       })
//       .subscribe({
//         error: (err) =>
//           console.warn('Failed to track terms compliance warning:', err),
//       });
//   }

//   /**
//    * Track successful credit purchase
//    */
//   private trackPurchaseCompleted(
//     creditAmount: number,
//     costZAR: number,
//     reference: string,
//   ): void {
//     this.activityService
//       .createActivity({
//         type: 'system',
//         action: 'credit_purchase_completed',
//         message: `Purchased ${this.formatNumber(
//           creditAmount,
//         )} credits for ${this.formatCurrency(costZAR)}`,
//         amount: creditAmount,
//         metadata: {
//           step: 'completion',
//           provider: 'paystack',
//           creditsPurchased: creditAmount,
//           costZAR: costZAR,
//           paystackReference: reference,
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
//           provider: 'paystack',
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

//   onTermsChange(): void {
//     this.error.set(null);
//     if (this.termsAccepted()) {
//       this.trackTermsAccepted();
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

//   async handlePayment(): Promise<void> {
//     // Validate amount
//     if (!this.isValidAmount()) {
//       this.error.set(
//         `Minimum ${this.formatNumber(this.minCredits)} credits required`,
//       );
//       return;
//     }

//     // Validate terms acceptance
//     if (!this.termsAccepted()) {
//       this.error.set('You must agree to the non-refundable terms to continue');
//       this.trackPaymentAttemptedWithoutTerms();
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
//       // Step 1: Initialize transaction on backend

//       const initResult = await this.paystackService.initializeTransaction({
//         organizationId: this.organizationId,
//         creditAmount: this.creditAmount,
//         amountZAR: this.totalCostZAR,
//       });

//       if (!initResult.success || !initResult.accessCode) {
//         const errorMsg = initResult.error || 'Failed to initialize payment';
//         console.error('❌ Init failed:', errorMsg);
//         this.error.set(errorMsg);
//         this.trackPurchaseFailed(errorMsg);
//         this.isProcessing.set(false);
//         return;
//       }

//       // Step 2: Open Paystack Popup
//       let reference: string;
//       try {
//         reference = await this.paystackService.openPaystackPopup(
//           initResult.accessCode,
//         );
//       } catch (popupErr) {
//         const errorMsg =
//           popupErr instanceof Error ? popupErr.message : 'Popup error';

//         // User cancelled payment
//         if (errorMsg.includes('cancelled')) {
//           console.log('ℹ️ User cancelled payment');
//           this.isProcessing.set(false);
//           this.close.emit();
//           return;
//         }

//         // Popup error
//         console.error('❌ Popup error:', errorMsg);
//         this.error.set(errorMsg);
//         this.trackPurchaseFailed(errorMsg);
//         this.isProcessing.set(false);
//         return;
//       }

//       const verifyResult = await this.paystackService.verifyPayment(reference);

//       if (!verifyResult.success) {
//         const errorMsg = verifyResult.error || 'Payment verification failed';
//         console.error('❌ Verification failed:', errorMsg);
//         this.error.set(errorMsg);
//         this.trackPurchaseFailed(errorMsg);
//         this.isProcessing.set(false);
//         return;
//       }

//       //  console.log('✅ Verification successful');

//       // Track success
//       this.trackPurchaseCompleted(
//         this.creditAmount,
//         this.totalCostZAR,
//         reference,
//       );

//       // Close modal and notify parent
//       this.success.emit();
//       this.close.emit();
//       this.isProcessing.set(false);

//       // Redirect to success page
//       //  console.log('📍 Redirecting to success page...');
//       window.location.href = `/credits?status=success&reference=${reference}`;
//     } catch (err) {
//       const errorMsg = err instanceof Error ? err.message : 'Unknown error';
//       console.error('❌ Payment error:', errorMsg);
//       this.error.set(errorMsg);
//       this.trackPurchaseFailed(errorMsg);
//       this.isProcessing.set(false);
//     }
//   }
// }
// src/app/core/dashboard/finance/credits/purchase-credits-modal.FIXES.ts
// ✅ FIXED:
// 1. Signal type mismatches: [isOpen] and [isEditMode] now pass boolean values correctly
// 2. AuthService method calls: use existing getCurrentUserId() and user() signal
// 3. Organization data handling: use ProfileManagementService for org updates

// KEY CHANGES:
// - Pass boolean to child component: [isOpen]="invoiceDetailsModalOpen()" -> child accepts boolean
// - Replace this.authService.getCurrentOrganization() with this.authService.user()
// - Replace this.authService.updateOrganizationData() with ProfileManagementService.updateOrganizationInfo()
// - Add helper method to AuthService: getCurrentOrganizationId() (already exists!)
// src/app/core/dashboard/finance/credits/purchase-credits-modal.component.ts
// ✅ CORRECT FIXES:
// 1. @Input signals accept boolean values from parent
// 2. Use ACTUAL PaystackService.initializeTransaction() method (NOT initializePayment)
// 3. Proper error typing (err: PaystackCheckoutResponse)
// 4. Respect existing InvoiceDetailsSnapshot interface (legal_name required)

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../auth/services/production.auth.service';
import { ProfileManagementService } from '../../../../shared/services/profile-management.service';
import {
  PaystackService,
  PaystackCheckoutRequest,
  PaystackCheckoutResponse,
} from '../../../../core/dashboard/services/paystack.service';
import { InvoiceDetailsModalComponent } from 'src/app/features/invoice/invoice-details-modal';

@Component({
  selector: 'app-purchase-credits-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, InvoiceDetailsModalComponent],
  template: `
    <!-- Modal Container -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/25 backdrop-blur-sm"
        (click)="!isProcessing() && onCancel()"
      ></div>

      <!-- Modal -->
      <div
        class="relative bg-white rounded-2xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <!-- Header -->
        <div
          class="sticky top-0 z-10 px-8 py-6 border-b border-slate-200 bg-slate-50/50"
        >
          <h2 class="text-xl font-bold text-slate-900">Purchase Credits</h2>
          <p class="text-sm text-slate-600 mt-1">
            Buy credits to power your funding applications
          </p>
        </div>

        <!-- Content -->
        <div class="p-8 space-y-6">
          <!-- Credit Package Selection -->
          <div>
            <label class="block text-sm font-semibold text-slate-900 mb-4">
              Select Package
              <span class="text-teal-600">*</span>
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                *ngFor="let pkg of creditPackages()"
                (click)="selectedPackage.set(pkg.id)"
                [class.border-teal-600]="selectedPackage() === pkg.id"
                class="p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-all duration-200"
              >
                <div class="font-semibold text-slate-900">
                  {{ pkg.credits }} Credits
                </div>
                <div class="text-2xl font-bold text-teal-600 mt-2">
                  R{{ pkg.price }}
                </div>
                <div class="text-xs text-slate-500 mt-1">
                  R{{ (pkg.price / pkg.credits).toFixed(4) }}/credit
                </div>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div class="bg-slate-50 rounded-xl p-6 border border-slate-200">
            <h3 class="font-semibold text-slate-900 mb-3">Summary</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-600">Credits</span>
                <span class="font-medium text-slate-900">{{
                  selectedPackageData()?.credits
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Price</span>
                <span class="font-medium text-slate-900"
                  >R{{ selectedPackageData()?.price }}</span
                >
              </div>
              <div class="h-px bg-slate-200 my-2"></div>
              <div class="flex justify-between">
                <span class="font-semibold text-slate-900">Total</span>
                <span class="font-bold text-teal-600 text-lg"
                  >R{{ selectedPackageData()?.price }}</span
                >
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div
            *ngIf="error()"
            class="bg-red-50 border border-red-200/50 rounded-xl p-4 text-red-700 text-sm"
          >
            {{ error() }}
          </div>
        </div>

        <!-- Footer -->
        <div
          class="sticky bottom-0 z-10 px-8 py-4 border-t border-slate-200 bg-white flex gap-3 justify-end"
        >
          <button
            (click)="onCancel()"
            [disabled]="isProcessing()"
            class="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 active:bg-slate-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            (click)="onContinueToPayment()"
            [disabled]="isProcessing() || !selectedPackage()"
            class="px-6 py-2.5 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isProcessing() ? 'Processing...' : 'Continue to Payment' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Invoice Details Modal -->
    <app-invoice-details-modal
      [isOpen]="invoiceDetailsModalOpen"
      [isEditMode]="invoiceEditMode"
      [initialData]="invoiceInitialData"
      (confirmed)="onInvoiceDetailsConfirmed($event)"
      (cancelled)="onInvoiceDetailsCancelled()"
    />
  `,
})
export class PurchaseCreditsModalComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private authService = inject(AuthService);
  private profileService = inject(ProfileManagementService);
  private paystackService = inject(PaystackService);
  private toastService = inject(ToastService);

  isProcessing = signal(false);
  error = signal<string | null>(null);

  // ✅ Invoice modal states: plain booleans
  invoiceDetailsModalOpen = false;
  invoiceEditMode = false;
  invoiceInitialData?: any;

  // Credit packages
  creditPackages = signal([
    { id: 1, credits: 5000, price: 50 },
    { id: 2, credits: 15000, price: 135 },
    { id: 3, credits: 50000, price: 400 },
    { id: 4, credits: 100000, price: 750 },
  ]);

  selectedPackage = signal<number | null>(1);

  selectedPackageData = computed(() => {
    const pkgId = this.selectedPackage();
    return this.creditPackages().find((p) => p.id === pkgId) || null;
  });

  ngOnInit() {
    // Auto-select first package
    this.selectedPackage.set(1);
  }

  /**
   * Continue to payment:
   * 1. Check if organization invoice data is complete
   * 2. If complete: show preview + edit option
   * 3. If incomplete: show modal to collect data
   */
  async onContinueToPayment() {
    this.isProcessing.set(true);
    this.error.set(null);

    try {
      const currentUser = this.authService.user();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const org = this.profileService.currentOrganization();
      if (!org) {
        throw new Error('Organization not found');
      }

      // Check if invoice data is complete
      const hasCompleteData = this.hasCompleteInvoiceData(org);

      if (hasCompleteData) {
        // Data exists: show preview with edit option
        this.invoiceEditMode = true;
        this.invoiceInitialData = {
          business_name: org.name || '',
          legal_name: org.legalName || org.name || '',
          vat_number: org.vatNumber || '0000000000',
          address_line1: org.addressLine1 || '',
          address_line2: org.addressLine2 || '',
          city: org.city || '',
          province: org.province || '',
          postal_code: org.postalCode || '',
        };
        this.invoiceDetailsModalOpen = true;
      } else {
        // Data incomplete: show blocking modal
        this.invoiceEditMode = false;
        this.invoiceInitialData = undefined;
        this.invoiceDetailsModalOpen = true;
      }
    } catch (err: any) {
      this.error.set(err?.message || 'Failed to proceed');
      this.toastService.error(err?.message || 'An error occurred');
    } finally {
      this.isProcessing.set(false);
    }
  }

  /**
   * Check if organization has complete invoice data
   */
  private hasCompleteInvoiceData(org: any): boolean {
    return !!(
      org?.name &&
      org?.addressLine1 &&
      org?.city &&
      org?.province &&
      org?.postalCode
    );
  }

  /**
   * Handle confirmed invoice details
   * ✅ Now properly types InvoiceDetailsSnapshot from PaystackService
   */
  onInvoiceDetailsConfirmed(snapshot: any) {
    this.isProcessing.set(true);

    try {
      // Update org with invoice details
      this.profileService
        .updateOrganizationInfo({
          name: snapshot.business_name,
          legalName: snapshot.legal_name,
          addressLine1: snapshot.address_line1,
          addressLine2: snapshot.address_line2,
          city: snapshot.city,
          province: snapshot.province,
          postalCode: snapshot.postal_code,
        })
        .subscribe({
          next: () => {
            this.toastService.success('Invoice details saved');
            this.invoiceDetailsModalOpen = false;

            // Store snapshot in sessionStorage for redirect after payment
            sessionStorage.setItem('invoiceSnapshot', JSON.stringify(snapshot));

            // Proceed to payment
            this.proceedToPayment(snapshot);
          },
          error: (err: any) => {
            this.error.set('Failed to save invoice details');
            this.toastService.error('Failed to save invoice details');
            this.isProcessing.set(false);
          },
        });
    } catch (err: any) {
      this.error.set(err?.message || 'An error occurred');
      this.isProcessing.set(false);
    }
  }

  /**
   * Handle cancelled invoice details modal
   */
  onInvoiceDetailsCancelled() {
    if (!this.invoiceEditMode) {
      // If blocking modal was cancelled, close payment modal too
      this.close.emit();
    }
    this.invoiceDetailsModalOpen = false;
  }

  /**
   * Proceed to payment via Paystack
   * ✅ Complete flow: initialize transaction, open popup, verify payment
   */
  private async proceedToPayment(invoiceSnapshot: any) {
    try {
      const pkg = this.selectedPackageData();
      if (!pkg) {
        throw new Error('No package selected');
      }

      const currentUser = this.authService.user();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const org = this.profileService.currentOrganization();
      if (!org?.id) {
        throw new Error('Organization not found');
      }

      // Step 1: Initialize transaction with backend
      const initResponse = await this.paystackService.initializeTransaction({
        organizationId: org.id,
        creditAmount: pkg.credits,
        amountZAR: pkg.price,
      });

      if (!initResponse.success || !initResponse.accessCode) {
        throw new Error(initResponse.error || 'Payment initialization failed');
      }

      console.log('✅ Transaction initialized with access code:', initResponse.accessCode);

      // Step 2: Open Paystack popup with the access code
      let reference: string;
      try {
        reference = await this.paystackService.openPaystackPopup(initResponse.accessCode);
        console.log('✅ Payment completed, reference:', reference);
      } catch (popupErr) {
        const errorMsg = popupErr instanceof Error ? popupErr.message : 'Popup error';

        // User cancelled payment
        if (errorMsg.includes('cancelled')) {
          console.log('ℹ️ User cancelled payment');
          this.isProcessing.set(false);
          return;
        }

        // Popup error
        throw new Error(errorMsg);
      }

      // Step 3: Verify payment with backend
      const verifyResponse = await this.paystackService.verifyPayment(reference);

      if (!verifyResponse.success) {
        throw new Error(verifyResponse.error || 'Payment verification failed');
      }

      console.log('✅ Payment verified successfully');

      // Success: Close modal and redirect
      this.toastService.success('Payment successful! Credits added to your account.');
      this.success.emit();
      this.close.emit();
      this.isProcessing.set(false);

      // Redirect to credits page with success status
      setTimeout(() => {
        window.location.href = `/credits?status=success&reference=${reference}`;
      }, 500);
    } catch (err: any) {
      console.error('❌ Payment error:', err);
      this.error.set(err?.message || 'Payment failed');
      this.toastService.error(err?.message || 'Payment failed');
      this.isProcessing.set(false);
    }
  }

  onCancel() {
    if (this.isProcessing()) return;
    this.close.emit();
    this.error.set(null);
  }

  ngOnDestroy() {
    // Cleanup
  }
}
