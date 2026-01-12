import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import {
  LucideAngularModule,
  TrendingUp,
  Zap,
  History,
  CreditCard,
  AlertCircle,
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
  selector: 'app-billing-credits',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, PurchaseCreditsModalComponent],
  templateUrl: 'billing-credits.component.html',
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

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
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
    `,
  ],
})
export class BillingCreditsComponent implements OnInit, OnDestroy {
  private creditService = inject(OrgCreditService);
  private supabase = inject(SharedSupabaseService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // Icons
  TrendingUpIcon = TrendingUp;
  ZapIcon = Zap;
  HistoryIcon = History;
  CreditCardIcon = CreditCard;
  AlertIcon = AlertCircle;
  ChevronDownIcon = ChevronDown;

  // State
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

  ngOnInit() {
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

  toggleTransactions() {
    this.isTransactionsExpanded.set(!this.isTransactionsExpanded());
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

  formatBalance(balance: number | undefined): string {
    if (!balance) return '0';
    return balance.toLocaleString('en-ZA');
  }

  formatCurrency(amount: number): string {
    return (amount / 100).toLocaleString('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
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

  retryLoadWallet() {
    this.error.set(null);
    this.loadWallet();
  }

  // Template helpers
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

  isHighBalance(): boolean {
    return (this.wallet()?.balance || 0) > 10000;
  }
}
