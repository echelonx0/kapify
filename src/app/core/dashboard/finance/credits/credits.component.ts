import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import {
  LucideAngularModule,
  TrendingUp,
  Zap,
  History,
  CreditCard,
  CircleAlert,
  CircleCheck,
  ChevronDown,
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
  templateUrl: './credits.component.html',
  styles: [
    `
      :host {
        display: block;
      }

      .metric-card {
        transition: all 0.2s ease;
      }

      .metric-card:hover {
        transform: translateY(-2px);
      }

      /* Animations */
      @keyframes springFadeIn {
        0% {
          opacity: 0;
          transform: translateY(12px) scale(0.98);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes slideOut {
        0% {
          opacity: 1;
          transform: translateY(0) scaleY(1);
          max-height: 500px;
        }
        100% {
          opacity: 0;
          transform: translateY(-8px) scaleY(0.95);
          max-height: 0;
        }
      }

      .animate-in {
        animation: springFadeIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      .animate-in.dismissing {
        animation: slideOut 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      .success-banner {
        overflow: hidden;
      }

      .cancelled-banner {
        animation: springFadeIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .chevron-rotate {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .chevron-rotate.expanded {
        transform: rotate(180deg);
      }

      .transactions-container {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .transactions-container.expanded {
        max-height: 600px;
      }

      /* Focus Ring Styling (Neo-Brutalist) */
      button:focus-visible {
        outline: 2px solid;
        outline-offset: 2px;
      }

      /* Pulse animation for loading */
      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .animate-spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .success-banner {
          margin-bottom: 1.5rem;
        }

        .cancelled-banner {
          margin-bottom: 1.5rem;
        }
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
  ChevronDownIcon = ChevronDown;

  // Payment Status
  status = signal<'success' | 'cancelled' | null>(null);
  reference = signal<string | null>(null);

  // Auto-Dismiss Logic
  autoDismissCountdown = signal<number>(5);
  isDismissingSuccess = signal(false);
  private autoDismissTimer$ = new Subject<void>();

  // Wallet State
  wallet = signal<OrgWallet | null>(null);
  transactions = signal<OrgTransaction[]>([]);
  isLoading = signal(false);
  isPurchaseModalOpen = signal(false);
  error = signal<string | null>(null);
  isTransactionsExpanded = signal(false);

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

  constructor() {
    // Auto-dismiss countdown effect
    effect(() => {
      if (this.status() === 'success' && !this.isDismissingSuccess()) {
        this.startAutoDismiss();
      }
    });
  }

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
    this.autoDismissTimer$.next();
    this.autoDismissTimer$.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Start auto-dismiss countdown
   * User has 5 seconds to view the success message
   */
  private startAutoDismiss(): void {
    this.autoDismissCountdown.set(5);

    interval(1000)
      .pipe(takeUntil(this.autoDismissTimer$))
      .subscribe(() => {
        const current = this.autoDismissCountdown();

        if (current <= 1) {
          this.autoDismissTimer$.next();
          this.dismissSuccess();
        } else {
          this.autoDismissCountdown.set(current - 1);
        }
      });
  }

  /**
   * Dismiss success banner with animation
   * Triggers slide-out animation and clears status
   */
  dismissSuccess(): void {
    this.isDismissingSuccess.set(true);

    // Wait for animation to complete before clearing status
    setTimeout(() => {
      this.status.set(null);
      this.reference.set(null);
      this.isDismissingSuccess.set(false);

      // Clear query params cleanly
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        queryParamsHandling: 'merge',
      });
    }, 350);
  }

  toggleTransactions() {
    this.isTransactionsExpanded.set(!this.isTransactionsExpanded());
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
        },
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

  /**
   * Format balance as plain number with thousands separator
   * Used for displaying credit counts
   */
  formatBalance(amount: number | undefined): string {
    if (!amount) return '0';
    return amount.toLocaleString('en-ZA');
  }

  /**
   * Format transaction amount with sign
   */
  formatTransactionAmount(txn: OrgTransaction): string {
    const sign = txn.type === 'spend' ? '−' : '+';
    return sign + this.formatBalance(Math.abs(txn.amount));
  }

  /**
   * Format transaction date
   */
  formatTransactionDate(date: string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  /**
   * Get human-readable transaction label
   */
  getTransactionLabel(type: string): string {
    const labels: Record<string, string> = {
      purchase: 'Purchased',
      spend: 'Used',
      refund: 'Refunded',
      adjustment: 'Adjusted',
    };
    return labels[type] || type;
  }

  /**
   * Get color class for transaction type
   */
  getTransactionColor(type: string): string {
    const colors: Record<string, string> = {
      purchase: 'text-green-600',
      spend: 'text-red-600',
      refund: 'text-blue-600',
      adjustment: 'text-slate-600',
    };
    return colors[type] || 'text-slate-600';
  }

  /**
   * Check if wallet balance is healthy
   */
  isHighBalance(): boolean {
    return (this.wallet()?.balance || 0) > 1000;
  }
}
