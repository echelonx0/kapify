import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { OrgCreditService } from 'src/app/shared/services/credit.service';

/**
 * Credit action types with fixed costs
 */
export enum CreditAction {
  VIEW = 'view',
  GENERATE = 'generate',
  SHARE = 'share',
  DOWNLOAD = 'download',
}

/**
 * Cost configuration for each action
 * Update this to change pricing
 */
const ACTION_COSTS: Record<CreditAction, number> = {
  [CreditAction.VIEW]: 10,
  [CreditAction.GENERATE]: 50,
  [CreditAction.SHARE]: 20,
  [CreditAction.DOWNLOAD]: 15,
};

export interface DeductionResult {
  newBalance: number;
  previousBalance: number;
  amountDeducted: number;
  action: string;
  timestamp: Date;
}

/**
 * CreditDeductionService
 *
 * Handles credit cost calculations and deductions for data room actions.
 * Single responsibility: manage credit deduction logic.
 *
 * Usage:
 *   const cost = this.deductionService.getCost('view'); // 10
 *   this.deductionService.deductCredits('org-1', 'download').subscribe(
 *     result => console.log('New balance:', result.newBalance)
 *   );
 */
@Injectable({ providedIn: 'root' })
export class CreditDeductionService {
  private creditService = inject(OrgCreditService);

  constructor() {
    console.log('✅ CreditDeductionService initialized');
  }

  /**
   * Get the cost of an action in credits
   * Returns 0 if action not recognized
   */
  getCost(action: CreditAction | string): number {
    return ACTION_COSTS[action as CreditAction] || 0;
  }

  /**
   * Check if an organization can afford an action
   * @param orgId Organization ID
   * @param action Action to check cost for
   * @returns Promise<boolean> true if wallet has enough credits
   */
  async canAfford(
    orgId: string,
    action: CreditAction | string
  ): Promise<boolean> {
    const cost = this.getCost(action);

    if (cost === 0) {
      return true; // Free action
    }

    try {
      const wallet = await this.creditService.getOrCreateOrgWallet(orgId);
      return wallet.balance >= cost;
    } catch (err) {
      console.error('❌ Error checking affordability:', err);
      return false;
    }
  }

  /**
   * Deduct credits for an action
   * Throws if insufficient balance
   *
   * @param orgId Organization ID
   * @param action Action to deduct credits for
   * @returns Observable<DeductionResult> with new balance and details
   *
   * @throws Error if insufficient credits or org not found
   */
  deductCredits(
    orgId: string,
    action: CreditAction | string
  ): Observable<DeductionResult> {
    const cost = this.getCost(action);

    // Free action (cost = 0)
    if (cost === 0) {
      console.log(`✅ Free action: ${action}`);
      return new Observable(sub => {
        sub.next({
          newBalance: 0,
          previousBalance: 0,
          amountDeducted: 0,
          action: action as string,
          timestamp: new Date(),
        });
        sub.complete();
      });
    }

    // Paid action - deduct credits
    return new Observable(sub => {
      this.creditService
        .getOrCreateOrgWallet(orgId)
        .then(wallet => {
          const previousBalance = wallet.balance;

          // Check if sufficient balance
          if (previousBalance < cost) {
            const shortfall = cost - previousBalance;
            throw new Error(
              `Insufficient credits. Need ${cost}, have ${previousBalance} (short by ${shortfall})`
            );
          }

          console.log(
            `💳 Deducting ${cost} credits for action: ${action} (balance: ${previousBalance} → ${
              previousBalance - cost
            })`
          );

          // Deduct credits
          return this.creditService.deductCredits(orgId, cost).then(newBalance => ({
            newBalance,
            previousBalance,
          }));
        })
        .then(({ newBalance, previousBalance }) => {
          const result: DeductionResult = {
            newBalance,
            previousBalance,
            amountDeducted: cost,
            action: action as string,
            timestamp: new Date(),
          };

          console.log(
            `✅ Credits deducted successfully. New balance: ${newBalance}`
          );

          sub.next(result);
          sub.complete();
        })
        .catch(err => {
          console.error('❌ Error deducting credits:', err);
          sub.error(err);
        });
    });
  }

  /**
   * Get all available actions with their costs
   * Useful for displaying pricing to users
   */
  getAllActionCosts(): Record<CreditAction, number> {
    return { ...ACTION_COSTS };
  }

  /**
   * Format action cost for display
   * e.g., "Download (15 credits)"
   */
  formatActionCost(action: CreditAction | string): string {
    const cost = this.getCost(action);
    if (cost === 0) {
      return `${this.capitalizeAction(action)} (Free)`;
    }
    return `${this.capitalizeAction(action)} (${cost} credits)`;
  }

  /**
   * Capitalize action name for display
   * e.g., "download" → "Download"
   */
  private capitalizeAction(action: CreditAction | string): string {
    return (action as string).charAt(0).toUpperCase() + (action as string).slice(1);
  }
}
