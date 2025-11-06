import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, AlertCircle } from 'lucide-angular';
import { StripeService } from '../services/stripe.service';

@Component({
  selector: 'app-purchase-credits-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    @if (isOpen) {
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
      (click)="onBackdropClick()"
    ></div>

    <!-- Modal -->
    <div class="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div
        class="bg-white rounded-2xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <!-- Header -->
        <div
          class="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between"
        >
          <h2 class="text-xl font-bold text-slate-900">Buy Credits</h2>
          <button
            (click)="close.emit()"
            class="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <lucide-icon [img]="XIcon" [size]="24" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Price Info -->
          <div class="bg-slate-50 rounded-xl p-4">
            <p class="text-xs font-medium text-slate-600 mb-1">Pricing</p>
            <p class="text-sm text-slate-700">
              <span class="font-semibold">1 ZAR</span> = 100 credits
            </p>
          </div>

          <!-- Amount Input -->
          <div>
            <label class="block text-sm font-semibold text-slate-900 mb-2">
              Number of Credits
            </label>
            <div class="relative">
              <input
                type="number"
                [(ngModel)]="creditAmount"
                (ngModelChange)="onCreditAmountChange()"
                [min]="10000"
                [step]="1000"
                class="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="Minimum 10,000 credits"
              />
              <span class="absolute right-4 top-3.5 text-slate-500 text-sm">
                credits
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-2">Minimum: 10,000 credits</p>
          </div>

          <!-- Cost Breakdown -->
          <div class="bg-orange-50 rounded-xl p-4 border border-orange-200">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-slate-600">Credits</span>
              <span class="font-semibold text-slate-900">
                {{ formatNumber(creditAmount) }}
              </span>
            </div>
            <div class="flex justify-between items-center mb-3">
              <span class="text-sm text-slate-600">Rate</span>
              <span class="font-semibold text-slate-900">R0.01/credit</span>
            </div>
            <div
              class="border-t border-orange-200 pt-3 flex justify-between items-center"
            >
              <span class="font-semibold text-slate-900">Total</span>
              <span class="text-2xl font-bold text-orange-600">
                {{ formatCurrency(totalCostZAR) }}
              </span>
            </div>
          </div>

          <!-- Error State -->
          @if (error()) {
          <div
            class="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3"
          >
            <lucide-icon
              [img]="AlertIcon"
              [size]="20"
              class="text-red-600 flex-shrink-0 mt-0.5"
            />
            <div>
              <p class="text-sm font-medium text-red-900">Error</p>
              <p class="text-xs text-red-700 mt-1">{{ error() }}</p>
            </div>
          </div>
          }

          <!-- Action Buttons -->
          <div class="flex gap-3">
            <button
              (click)="close.emit()"
              class="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-900 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
              [disabled]="isProcessing()"
            >
              Cancel
            </button>
            <button
              (click)="handleCheckout()"
              class="flex-1 px-4 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              [disabled]="!isValidAmount() || isProcessing()"
            >
              @if (isProcessing()) {
              <div
                class="w-4 h-4 rounded-full border-2 border-white border-t-orange-300 animate-spin"
              ></div>
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
export class PurchaseCreditsModalComponent {
  @Input() isOpen = false;
  @Input() organizationId = '';
  @Output() close = new EventEmitter<void>();
  @Output() success = new EventEmitter<void>();

  private stripeService = inject(StripeService);

  XIcon = X;
  AlertIcon = AlertCircle;

  creditAmount = 10000;
  isProcessing = signal(false);
  error = signal<string | null>(null);

  readonly MIN_CREDITS = 10000;
  readonly CREDITS_PER_ZAR = 100;
  readonly STEP_SIZE = 1000;

  get totalCostZAR(): number {
    return this.creditAmount / this.CREDITS_PER_ZAR;
  }

  onCreditAmountChange() {
    this.error.set(null);
    // Round to nearest 1000
    this.creditAmount =
      Math.round(this.creditAmount / this.STEP_SIZE) * this.STEP_SIZE;
    if (this.creditAmount < this.MIN_CREDITS) {
      this.creditAmount = this.MIN_CREDITS;
    }
  }

  isValidAmount(): boolean {
    return this.creditAmount >= this.MIN_CREDITS;
  }

  formatNumber(num: number): string {
    return num.toLocaleString('en-ZA');
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    });
  }

  onBackdropClick() {
    this.close.emit();
  }

  handleCheckout() {
    if (!this.isValidAmount()) {
      this.error.set('Credits must be at least 10,000');
      return;
    }

    if (!this.organizationId) {
      this.error.set('Organization not found');
      return;
    }

    this.isProcessing.set(true);
    this.error.set(null);

    // Create checkout session with dummy service
    this.stripeService
      .createCheckoutSession({
        organizationId: this.organizationId,
        creditAmount: this.creditAmount,
        amountZAR: this.totalCostZAR,
      })
      .then((result) => {
        if (result.success) {
          // In real implementation, redirect to Stripe
          // await stripe.redirectToCheckout({ sessionId: result.sessionId });
          console.log('✅ Checkout session created:', result.sessionId);
          this.success.emit();
        } else {
          this.error.set(result.error || 'Failed to create checkout session');
          this.isProcessing.set(false);
        }
      })
      .catch((err) => {
        console.error('Checkout error:', err);
        this.error.set('Payment processing failed. Please try again.');
        this.isProcessing.set(false);
      });
  }

  Math = Math;
}
