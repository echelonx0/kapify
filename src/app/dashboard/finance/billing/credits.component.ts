import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import {
  LucideAngularModule,
  TrendingUp,
  Zap,
  History,
  CreditCard,
  CircleAlert,
  CircleCheck,
} from 'lucide-angular';

import {
  OrgCreditService,
  OrgWallet,
  OrgTransaction,
} from 'src/app/shared/services/credit.service';
import { SharedSupabaseService } from 'src/app/shared/services/shared-supabase.service';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { PurchaseCreditsModalComponent } from './purchase-credits-modal.component';

@Component({
  selector: 'app-credits',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, PurchaseCreditsModalComponent],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <header class="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <h1 class="text-3xl font-bold text-slate-900">Buy Credits</h1>
          <p class="text-sm text-slate-600 mt-1">
            Purchase credits for funding applications
          </p>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <!-- Success Banner -->
        @if (status() === 'success') {
        <div
          class="mb-8 bg-green-50 border border-green-200/50 rounded-2xl p-6 flex items-start gap-4"
        >
          <lucide-icon
            [img]="CheckCircle2Icon"
            [size]="24"
            class="text-green-600 flex-shrink-0 mt-0.5"
          />
          <div class="flex-1">
            <h2 class="font-semibold text-green-900 mb-1">
              Payment Successful
            </h2>
            <p class="text-sm text-green-700 mb-2">
              Your credits have been added to your account.
            </p>
            <p class="text-xs text-green-600 font-mono">
              Reference: {{ reference() }}
            </p>
          </div>
        </div>
        } @else if (status() === 'cancelled') {
        <div
          class="mb-8 bg-amber-50 border border-amber-200/50 rounded-2xl p-6 flex items-start gap-4"
        >
          <lucide-icon
            [img]="AlertCircleIcon"
            [size]="24"
            class="text-amber-600 flex-shrink-0 mt-0.5"
          />
          <div class="flex-1">
            <h2 class="font-semibold text-amber-900 mb-1">Payment Cancelled</h2>
            <p class="text-sm text-amber-700">
              You cancelled the payment. No charges were made.
            </p>
          </div>
        </div>
        }

        <!-- Loading State -->
        @if (isLoading()) {
        <div
          class="bg-white rounded-2xl border border-slate-200 shadow-sm p-12"
        >
          <div class="flex flex-col items-center justify-center">
            <div
              class="w-10 h-10 rounded-full border-2 border-slate-200 border-t-teal-500 animate-spin mb-4"
            ></div>
            <p class="text-slate-600 font-medium">Loading credit details...</p>
          </div>
        </div>
        } @else if (error()) {
        <div
          class="mb-6 bg-red-50 border border-red-200/50 rounded-2xl p-6 flex items-start gap-4"
        >
          <lucide-icon
            [img]="AlertCircleIcon"
            [size]="24"
            class="text-red-600 flex-shrink-0 mt-0.5"
          />
          <div class="flex-1">
            <h3 class="font-semibold text-red-900 mb-1">
              Failed to load credits
            </h3>
            <p class="text-sm text-red-700 mb-4">{{ error() }}</p>
            <button
              (click)="retryLoadWallet()"
              class="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              Try Again →
            </button>
          </div>
        </div>
        } @else if (wallet()) {
        <div class="space-y-8">
          <!-- Balance Card -->
          <div
            class="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-2xl border border-teal-200/50 p-8 shadow-sm"
          >
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-teal-700 mb-2">
                  Current Balance
                </p>
                <div class="flex items-baseline gap-2">
                  <span class="text-5xl font-bold text-teal-900">
                    {{ formatBalance(wallet()?.balance) }}
                  </span>
                  <span class="text-lg font-medium text-teal-700">credits</span>
                </div>
                <p class="text-sm text-teal-700 mt-3">
                  ≈ {{ formatCurrency(wallet()?.balance || 0) }} ZAR
                </p>
              </div>
              <button
                (click)="openPurchaseModal()"
                class="px-6 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200 shadow-md"
              >
                <lucide-icon
                  [img]="CreditCardIcon"
                  [size]="18"
                  class="inline mr-2"
                />
                Buy Credits
              </button>
            </div>
          </div>

          <!-- Metrics Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Monthly Usage -->
            <div
              class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div class="flex items-start justify-between mb-4">
                <p class="text-sm font-medium text-slate-600">
                  Usage This Month
                </p>
                <lucide-icon
                  [img]="ZapIcon"
                  [size]="20"
                  class="text-slate-400"
                />
              </div>
              <p class="text-3xl font-bold text-slate-900">
                {{ formatBalance(monthlySpend()) }}
              </p>
              <p class="text-xs text-slate-500 mt-2">credits consumed</p>
            </div>

            <!-- Wallet Status -->
            <div
              class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div class="flex items-start justify-between mb-4">
                <p class="text-sm font-medium text-slate-600">Wallet Status</p>
                @if (isHighBalance()) {
                <div class="w-3 h-3 rounded-full bg-green-600"></div>
                } @else {
                <div class="w-3 h-3 rounded-full bg-amber-600"></div>
                }
              </div>
              <p class="text-3xl font-bold text-slate-900">
                @if (isHighBalance()) { Active } @else { Low Balance }
              </p>
              <p class="text-xs text-slate-500 mt-2">
                @if (isHighBalance()) { Ready to use } @else { Consider
                purchasing credits }
              </p>
            </div>

            <!-- Total Purchased -->
            <div
              class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div class="flex items-start justify-between mb-4">
                <p class="text-sm font-medium text-slate-600">
                  Total Purchased
                </p>
                <lucide-icon
                  [img]="TrendingUpIcon"
                  [size]="20"
                  class="text-slate-400"
                />
              </div>
              <p class="text-3xl font-bold text-slate-900">
                {{ formatBalance(totalPurchased()) }}
              </p>
              <p class="text-xs text-slate-500 mt-2">all time</p>
            </div>
          </div>

          <!-- Recent Transactions -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div class="border-b border-slate-200 p-6">
              <div class="flex items-center gap-2">
                <lucide-icon
                  [img]="HistoryIcon"
                  [size]="20"
                  class="text-slate-600"
                />
                <h2 class="text-lg font-semibold text-slate-900">
                  Recent Transactions
                </h2>
              </div>
            </div>

            @if (recentTransactions().length > 0) {
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th
                      class="text-left text-xs font-semibold text-slate-600 px-6 py-3"
                    >
                      Type
                    </th>
                    <th
                      class="text-left text-xs font-semibold text-slate-600 px-6 py-3"
                    >
                      Amount
                    </th>
                    <th
                      class="text-left text-xs font-semibold text-slate-600 px-6 py-3"
                    >
                      Description
                    </th>
                    <th
                      class="text-left text-xs font-semibold text-slate-600 px-6 py-3"
                    >
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  @for (txn of recentTransactions(); track txn.id) {
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-6 py-4">
                      <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        [ngClass]="
                          txn.type === 'purchase'
                            ? 'bg-green-50 text-green-700'
                            : txn.type === 'spend'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-slate-50 text-slate-700'
                        "
                      >
                        {{ getTransactionLabel(txn.type) }}
                      </span>
                    </td>
                    <td
                      class="px-6 py-4 font-semibold"
                      [ngClass]="getTransactionColor(txn.type)"
                    >
                      {{ formatTransactionAmount(txn) }}
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-600">
                      {{ txn.description || '—' }}
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-500">
                      {{ formatTransactionDate(txn.created_at) }}
                    </td>
                  </tr>
                  }
                </tbody>
              </table>
            </div>
            } @else {
            <div class="p-12 text-center">
              <p class="text-slate-500 text-sm">No transactions yet</p>
            </div>
            }
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4">
            <button
              (click)="goToDashboard()"
              class="flex-1 px-6 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-600 active:bg-teal-700 transition-colors duration-200"
            >
              Back to Dashboard
            </button>
            <button
              (click)="goToInvoices()"
              class="flex-1 px-6 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 active:bg-slate-300 transition-colors duration-200"
            >
              View Invoices
            </button>
          </div>
        </div>
        }
      </main>
    </div>

    <!-- Purchase Modal -->
    @if (isPurchaseModalOpen()) {
    <app-purchase-credits-modal
      [isOpen]="isPurchaseModalOpen()"
      [organizationId]="wallet()?.organization_id || ''"
      (close)="closePurchaseModal()"
      (success)="onPurchaseSuccess()"
    />
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
export class CreditsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private creditService = inject(OrgCreditService);
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // Icons
  TrendingUpIcon = TrendingUp;
  ZapIcon = Zap;
  HistoryIcon = History;
  CreditCardIcon = CreditCard;
  AlertCircleIcon = CircleAlert;
  CheckCircle2Icon = CircleCheck;

  // Payment Status
  status = signal<'success' | 'cancelled' | null>(null);
  reference = signal<string | null>(null);

  // Wallet State
  wallet = signal<OrgWallet | null>(null);
  transactions = signal<OrgTransaction[]>([]);
  isLoading = signal(false);
  isPurchaseModalOpen = signal(false);
  error = signal<string | null>(null);

  // Computed: Total ever purchased
  totalPurchased = computed(() => {
    const txns = this.transactions();
    let sum = 0;
    for (const t of txns) {
      if (t.type === 'purchase') {
        sum += t.amount;
      }
    }
    return sum;
  });

  // Computed: Monthly spend
  monthlySpend = computed(() => {
    const txns = this.transactions();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let sum = 0;
    for (const t of txns) {
      if (t.type === 'spend' && new Date(t.created_at) >= monthStart) {
        sum += Math.abs(t.amount);
      }
    }
    return sum;
  });

  // Computed: Recent transactions
  recentTransactions = computed(() => {
    return this.transactions().slice(0, 5);
  });

  ngOnInit() {
    // Check payment status from query params
    this.route.queryParams.subscribe((params) => {
      const queryStatus = params['status'];
      const reference = params['reference'];

      if (queryStatus === 'success' || queryStatus === 'cancelled') {
        this.status.set(queryStatus);
        if (reference) {
          this.reference.set(reference);
        }
      }
    });

    // Load wallet and transactions
    this.loadWallet();
    this.subscribeToWallet();
    this.loadTransactions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadWallet() {
    this.isLoading.set(true);
    this.error.set(null);

    const orgId = this.authService.getCurrentUserOrganizationId();
    if (!orgId) {
      this.error.set('Organization not found');
      this.isLoading.set(false);
      return;
    }

    this.creditService
      .getOrCreateOrgWallet(orgId)
      .then((wallet) => {
        this.wallet.set(wallet);
        this.isLoading.set(false);
      })
      .catch((err) => {
        console.error('Failed to load wallet:', err);
        this.error.set('Failed to load wallet. Please try again.');
        this.isLoading.set(false);
      });
  }

  private subscribeToWallet() {
    const orgId = this.authService.getCurrentUserOrganizationId();
    if (!orgId) return;

    this.supabase.client
      .channel(`org-wallet:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credits_wallets',
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          if (payload.new) {
            this.wallet.set(payload.new as OrgWallet);
          }
        }
      )
      .subscribe();
  }

  private loadTransactions() {
    const orgId = this.authService.getCurrentUserOrganizationId();
    if (!orgId) return;

    this.creditService
      .getTransactions(orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (txns) => {
          this.transactions.set(txns);
        },
        error: (err) => {
          console.error('Failed to load transactions:', err);
        },
      });
  }

  openPurchaseModal() {
    this.isPurchaseModalOpen.set(true);
  }

  closePurchaseModal() {
    this.isPurchaseModalOpen.set(false);
  }

  onPurchaseSuccess() {
    this.closePurchaseModal();
    this.loadWallet();
    this.loadTransactions();
  }

  retryLoadWallet() {
    this.error.set(null);
    this.loadWallet();
  }

  goToInvoices() {
    this.router.navigate(['/invoice']);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  // Formatting helpers
  formatBalance(balance: number | undefined): string {
    if (!balance) return '0';
    return balance.toLocaleString('en-ZA');
  }

  formatCurrency(amount: number): string {
    return (amount / 100).toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    });
  }

  formatTransactionAmount(txn: OrgTransaction): string {
    const sign = txn.type === 'spend' ? '-' : '+';
    return sign + this.formatBalance(Math.abs(txn.amount));
  }

  formatTransactionDate(date: string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  getTransactionLabel(type: string): string {
    const labels: Record<string, string> = {
      purchase: 'Purchased',
      spend: 'Used',
      refund: 'Refunded',
      adjustment: 'Adjusted',
    };
    return labels[type] || type;
  }

  getTransactionColor(type: string): string {
    const colors: Record<string, string> = {
      purchase: 'text-green-600',
      spend: 'text-red-600',
      refund: 'text-blue-600',
      adjustment: 'text-slate-600',
    };
    return colors[type] || 'text-slate-600';
  }

  isHighBalance(): boolean {
    return (this.wallet()?.balance || 0) > 10000;
  }
}
