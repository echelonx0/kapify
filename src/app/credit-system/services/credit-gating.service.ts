import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { OrgCreditService, OrgWallet } from 'src/app/shared/services/credit.service';
import { CreditDeductionService, CreditAction } from './credit-deduction.service';

/**
 * Represents a pending cost confirmation (when user has enough credits)
 */
export interface CostConfirmation {
  action: string;
  cost: number;
  isOpen: boolean;
  actionId?: string;
}

/**
 * Represents a purchase prompt (when user doesn't have enough credits)
 */
export interface PurchasePrompt {
  isOpen: boolean;
  creditsNeeded: number;
  action: string;
  actionId?: string;
}

/**
 * CreditGatingService
 *
 * Manages credit-based access control for data room actions.
 * Responsibilities:
 * - Track organization wallet balance
 * - Show cost confirmation modals (when user has enough credits)
 * - Show purchase prompts (when user doesn't have enough credits)
 * - Coordinate credit deductions with UI state updates
 *
 * Usage:
 *   // Inject in component
 *   private gatingService = inject(CreditGatingService);
 *
 *   // Check if action is affordable
 *   if (this.gatingService.canAfford('view')) {
 *     this.gatingService.requestAction('view', documentId);
 *   }
 *
 *   // Delegate state to service
 *   get wallet() { return this.gatingService.wallet; }
 *   get costConfirmation() { return this.gatingService.costConfirmation; }
 *
 *   // User confirms action
 *   confirmAndExecute() {
 *     const action = this.gatingService.confirmAction();
 *     this.executeAction(action);
 *   }
 */
@Injectable({ providedIn: 'root' })
export class CreditGatingService implements OnDestroy {
  private creditService = inject(OrgCreditService);
  private deductionService = inject(CreditDeductionService);
  private destroy$ = new Subject<void>();

  // ===============================
  // WALLET STATE
  // ===============================

  /** Current organization wallet balance and details */
  wallet = signal<OrgWallet | null>(null);

  /** Whether wallet is currently loading */
  isLoadingWallet = signal(false);

  // ===============================
  // COMPUTED STATE
  // ===============================

  /** Computed: does user have at least 1 credit? */
  hasEnoughCredits = computed(() => (this.wallet()?.balance || 0) > 0);

  /** Computed: formatted balance for display (e.g., "150") */
  creditsFormatted = computed(() =>
    (this.wallet()?.balance || 0).toLocaleString('en-ZA')
  );

  // ===============================
  // MODAL STATE
  // ===============================

  /**
   * Cost confirmation modal state
   * Shows when user has enough credits and needs to confirm the debit
   */
  costConfirmation = signal<CostConfirmation>({
    action: '',
    cost: 0,
    isOpen: false,
  });

  /**
   * Purchase prompt state
   * Shows when user doesn't have enough credits for the action
   */
  purchasePrompt = signal<PurchasePrompt>({
    isOpen: false,
    creditsNeeded: 0,
    action: '',
  });

  constructor() {
    console.log('✅ CreditGatingService initialized');
  }

  /**
   * Load wallet for an organization
   * Call this in ngOnInit with the current organization ID
   *
   * @param orgId Organization ID to load wallet for
   */
  async loadWallet(orgId: string): Promise<void> {
    if (!orgId) {
      console.warn('⚠️ No organization ID provided to loadWallet');
      return;
    }

    this.isLoadingWallet.set(true);

    try {
      const wallet = await this.creditService.getOrCreateOrgWallet(orgId);
      this.wallet.set(wallet);
      console.log(`✅ Wallet loaded: ${wallet.balance} credits`);
    } catch (err) {
      console.error('❌ Failed to load wallet:', err);
      this.wallet.set(null);
    } finally {
      this.isLoadingWallet.set(false);
    }
  }

  /**
   * Refresh wallet balance from server
   * Call after a purchase or action to get latest balance
   *
   * @param orgId Organization ID
   */
  async refreshWallet(orgId: string): Promise<void> {
    if (!orgId) return;

    try {
      const wallet = await this.creditService.getOrCreateOrgWallet(orgId);
      this.wallet.set(wallet);
      console.log(`✅ Wallet refreshed: ${wallet.balance} credits`);
    } catch (err) {
      console.error('❌ Failed to refresh wallet:', err);
    }
  }

  // ===============================
  // ACTION REQUEST FLOW
  // ===============================

  /**
   * Check if an action is affordable
   * This is a quick check without side effects
   *
   * @param action Action to check (view, download, etc)
   * @returns true if user has enough credits
   */
  canAfford(action: CreditAction | string): boolean {
    const cost = this.deductionService.getCost(action);
    const balance = this.wallet()?.balance || 0;
    return balance >= cost;
  }

  /**
   * Request an action (initiates confirmation or purchase flow)
   *
   * If user has enough credits:
   *   - Opens cost confirmation modal
   *   - User confirms → you call confirmAndExecute()
   *
   * If user doesn't have enough credits:
   *   - Opens purchase prompt
   *   - User buys credits → wallet refreshes
   *   - User retries action
   *
   * @param action Action type (view, download, share, generate)
   * @param actionId Optional ID of the specific resource (document ID, etc)
   * @returns true if confirmation modal was opened, false if purchase prompt opened
   */
  requestAction(action: CreditAction | string, actionId?: string): boolean {
    const cost = this.deductionService.getCost(action);
    const balance = this.wallet()?.balance || 0;

    // ✅ USER HAS ENOUGH CREDITS
    if (balance >= cost) {
      this.costConfirmation.set({
        action: action as string,
        cost,
        isOpen: true,
        actionId,
      });

      console.log(
        `💡 Cost confirmation modal opened: ${action} costs ${cost} credits`
      );
      return true;
    }

    // ❌ USER DOESN'T HAVE ENOUGH CREDITS
    const creditsNeeded = cost - balance;

    this.purchasePrompt.set({
      isOpen: true,
      creditsNeeded,
      action: action as string,
      actionId,
    });

    console.log(
      `⚠️ Purchase prompt opened: need ${creditsNeeded} more credits for ${action}`
    );
    return false;
  }

  /**
   * User confirms the cost and wants to proceed
   * Returns the action details so component can execute it
   *
   * @returns action string from the confirmation modal (or null if modal was closed)
   */
  confirmAction(): string | null {
    const { action } = this.costConfirmation();
    this.closeCostModal();
    return action || null;
  }

  /**
   * Get the action ID from the confirmation modal
   * Useful if your action requires the resource ID
   *
   * @returns actionId string (or undefined if not set)
   */
  getConfirmedActionId(): string | undefined {
    return this.costConfirmation().actionId;
  }

  /**
   * Close the cost confirmation modal
   * Call this after user clicks "Cancel"
   */
  closeCostModal(): void {
    this.costConfirmation.set({
      ...this.costConfirmation(),
      isOpen: false,
    });
  }

  /**
   * Close the purchase prompt modal
   * Call this after user clicks "Cancel" on the purchase prompt
   */
  closePurchasePrompt(): void {
    this.purchasePrompt.set({
      ...this.purchasePrompt(),
      isOpen: false,
    });
  }

  /**
   * User purchased credits and modal is closing
   * Refresh wallet and re-try the action
   *
   * @param orgId Organization ID
   * @param onSuccess Optional callback after wallet refreshes
   */
  async purchaseComplete(orgId: string, onSuccess?: () => void): Promise<void> {
    await this.refreshWallet(orgId);
    this.closePurchasePrompt();

    // Automatically retry with the same action
    const { action, actionId } = this.purchasePrompt();
    if (action) {
      this.requestAction(action, actionId);
    }

    onSuccess?.();
  }

  // ===============================
  // CREDIT DEDUCTION (for components)
  // ===============================

  /**
   * Deduct credits for an action and update wallet
   * Call this after user confirms the action
   *
   * Usage:
   *   this.gatingService.deductCreditsForAction(orgId, 'download').subscribe({
   *     next: () => {
   *       console.log('Credits deducted, new balance:', this.gatingService.wallet().balance);
   *       // Execute the action here
   *     },
   *     error: (err) => console.error('Failed to deduct credits:', err)
   *   });
   *
   * @param orgId Organization ID
   * @param action Action to deduct credits for
   * @returns Observable that completes when deduction is done (with updated wallet)
   */
  deductCreditsForAction(
    orgId: string,
    action: CreditAction | string
  ): Promise<{ newBalance: number }> {
    return new Promise((resolve, reject) => {
      this.deductionService.deductCredits(orgId, action).subscribe({
        next: (result) => {
          // Update wallet with new balance
          if (this.wallet()) {
            this.wallet.set({
              ...this.wallet()!,
              balance: result.newBalance,
            });
          }

          console.log(`✅ Credits deducted. New balance: ${result.newBalance}`);
          resolve({ newBalance: result.newBalance });
        },
        error: (err) => {
          console.error('❌ Error deducting credits:', err);
          reject(err);
        },
      });
    });
  }

  // ===============================
  // HELPERS & DISPLAY UTILITIES
  // ===============================

  /**
   * Get the cost of an action
   * Useful for displaying prices to users
   *
   * @param action Action type
   * @returns Cost in credits
   */
  getActionCost(action: CreditAction | string): number {
    return this.deductionService.getCost(action);
  }

  /**
   * Format action cost for display
   * e.g., "Download (15 credits)"
   *
   * @param action Action type
   * @returns Formatted string
   */
  formatActionCost(action: CreditAction | string): string {
    return this.deductionService.formatActionCost(action);
  }

  /**
   * Get all available actions with costs
   * Useful for building pricing tables
   *
   * @returns Record mapping actions to their costs
   */
  getAllActionCosts(): Record<string, number> {
    return this.deductionService.getAllActionCosts();
  }

  // ===============================
  // CLEANUP
  // ===============================

  ngOnDestroy(): void {
    console.log('🧹 CreditGatingService destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
