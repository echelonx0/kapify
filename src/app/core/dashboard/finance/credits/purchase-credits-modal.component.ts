import {
  Component,
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
import { PaystackService } from '../../../../core/dashboard/services/paystack.service';
import { DatabaseActivityService } from '../../../../shared/services/database-activity.service';
import { InvoiceDetailsModalComponent } from 'src/app/features/invoice/invoice-details-modal';

@Component({
  selector: 'app-purchase-credits-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, InvoiceDetailsModalComponent],
  template: `
    <!-- Modal Container -->
    <div class="fixed inset-0 z-50 flex items-center justify-center">
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
                  {{ formatCurrency(pkg.credits) }}
                </div>
                <div class="text-2xl font-bold text-teal-600 mt-2">
                  {{ formatCurrency(pkg.price) }}
                </div>
                <div class="text-xs text-slate-500 mt-1">
                  {{ formatCurrency(pkg.price / pkg.credits) }}/credit
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
                  formatCurrency(selectedPackageData()?.credits)
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Price</span>
                <span class="font-medium text-slate-900">{{
                  formatCurrency(selectedPackageData()?.price)
                }}</span>
              </div>
              <div class="h-px bg-slate-200 my-2"></div>
              <div class="flex justify-between">
                <span class="font-semibold text-slate-900">Total</span>
                <span class="font-bold text-teal-600 text-lg">{{
                  formatCurrency(selectedPackageData()?.price)
                }}</span>
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
  private activityService = inject(DatabaseActivityService);

  isProcessing = signal(false);
  error = signal<string | null>(null);

  // ✅ Invoice modal states: plain booleans
  invoiceDetailsModalOpen = false;
  invoiceEditMode = false;
  invoiceInitialData?: any;

  // Credit packages
  creditPackages = signal([
    { id: 1, credits: 500, price: 500 },
    { id: 2, credits: 1500, price: 1500 },
    { id: 3, credits: 5000, price: 5000 },
    { id: 4, credits: 10000, price: 10000 },
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
   * 1. Track activity: flow started
   * 2. Check if organization invoice data is complete
   * 3. If complete: show preview + edit option
   * 4. If incomplete: show modal to collect data
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

      const pkg = this.selectedPackageData();
      if (!pkg) {
        throw new Error('No package selected');
      }

      // ✅ Track activity: flow started
      this.activityService.trackSystemActivity(
        'credit_purchase_flow_started',
        `Credit purchase flow initiated: ${pkg.credits} credits for ${this.formatCurrency(pkg.price)}`,
        {
          credits: pkg.credits,
          amountZAR: pkg.price,
          status: 'in_progress',
        },
      );

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
   * ✅ Track activity: flow completed on successful payment
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

      console.log(
        '✅ Transaction initialized with access code:',
        initResponse.accessCode,
      );

      // Step 2: Open Paystack popup with the access code
      let reference: string;
      try {
        reference = await this.paystackService.openPaystackPopup(
          initResponse.accessCode,
        );
        console.log('✅ Payment completed, reference:', reference);
      } catch (popupErr) {
        const errorMsg =
          popupErr instanceof Error ? popupErr.message : 'Popup error';

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
      const verifyResponse =
        await this.paystackService.verifyPayment(reference);

      if (!verifyResponse.success) {
        throw new Error(verifyResponse.error || 'Payment verification failed');
      }

      console.log('✅ Payment verified successfully');

      // ✅ Track activity: flow completed successfully
      this.activityService.trackSystemActivity(
        'credit_purchase_flow_completed',
        `Credit purchase completed: ${pkg.credits} credits for ${this.formatCurrency(pkg.price)} (Reference: ${reference})`,
        {
          credits: pkg.credits,
          amountZAR: pkg.price,
          status: 'completed',
          reference,
        },
      );

      // Success: Close modal and redirect
      this.toastService.success(
        'Payment successful! Credits added to your account.',
      );
      this.success.emit();
      this.close.emit();
      this.isProcessing.set(false);

      // Redirect to credits page with success status
      // setTimeout(() => {
      //   window.location.href = `/credits?status=success&reference=${reference}`;
      // }, 500);
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

  /**
   * Format number as currency (ZAR)
   */
  formatCurrency(amount: number | undefined): string {
    if (!amount) return 'R0';
    return amount.toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    });
  }

  ngOnDestroy() {
    // Cleanup
  }
}
