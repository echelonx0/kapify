// src/app/data-room/services/credit-deduction.service.ts
// UPDATED: Fetches costs from database instead of hardcoded values
import { Injectable, inject } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { OrgCreditService } from 'src/app/shared/services/credit.service';
import { CreditCostsService } from '../../admin/services/credit-costs.service';

/**
 * Credit action types
 * These are the core actions; additional actions can be added via admin panel
 */
export enum CreditAction {
  VIEW = 'view',
  GENERATE = 'generate',
  SHARE = 'share',
  DOWNLOAD = 'download',
}

/**
 * Fallback costs if database fetch fails
 * Used only as last resort to prevent blocking operations
 */
const FALLBACK_COSTS: Record<string, number> = {
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
 *
 * UPDATED: Now fetches costs from database via CreditCostsService.
 * Falls back to hardcoded defaults if database is unavailable.
 *
 * Usage:
 *   const cost = await this.deductionService.getCost('view'); // fetches from DB
 *   this.deductionService.deductCredits('org-1', 'download').subscribe(
 *     result => console.log('New balance:', result.newBalance)
 *   );
 */
@Injectable({ providedIn: 'root' })
export class CreditDeductionService {
  private creditService = inject(OrgCreditService);
  private costsService = inject(CreditCostsService);

  // Local cache for synchronous access (populated from CreditCostsService)
  private localCostsCache = new Map<string, number>();
  private cacheInitialized = false;

  constructor() {
    console.log('✅ CreditDeductionService initialized');
    // Pre-warm cache on service init
    this.initializeCache();
  }

  /**
   * Initialize cache from database
   */
  private async initializeCache(): Promise<void> {
    try {
      const costs = await this.costsService.getActiveCosts();
      this.localCostsCache = new Map(costs);
      this.cacheInitialized = true;
      console.log(
        `✅ Credit costs cache initialized: ${this.localCostsCache.size} actions`
      );
    } catch (err) {
      console.warn(
        '⚠️ Failed to initialize costs cache, using fallbacks:',
        err
      );
      // Populate with fallbacks
      Object.entries(FALLBACK_COSTS).forEach(([key, value]) => {
        this.localCostsCache.set(key, value);
      });
      this.cacheInitialized = true;
    }
  }

  /**
   * Get the cost of an action in credits (async, fetches from DB if needed)
   * Returns fallback cost if action not found
   */
  async getCostAsync(action: CreditAction | string): Promise<number> {
    // Try to get from CreditCostsService (which has its own cache)
    return await this.costsService.getCost(
      action as string,
      FALLBACK_COSTS[action as string] || 0
    );
  }

  /**
   * Get the cost of an action in credits (sync, uses local cache)
   * Returns fallback cost if not in cache
   *
   * @deprecated Use getCostAsync for most accurate costs
   */
  getCost(action: CreditAction | string): number {
    // Return from local cache
    if (this.localCostsCache.has(action as string)) {
      return this.localCostsCache.get(action as string)!;
    }

    // Fallback
    return FALLBACK_COSTS[action as string] || 0;
  }

  /**
   * Force refresh the local costs cache
   */
  async refreshCosts(): Promise<void> {
    try {
      const costs = await this.costsService.getActiveCosts();
      this.localCostsCache = new Map(costs);
      console.log('✅ Credit costs cache refreshed');
    } catch (err) {
      console.error('❌ Failed to refresh costs cache:', err);
    }
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
    const cost = await this.getCostAsync(action);

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
    return new Observable((sub) => {
      // Get cost asynchronously
      this.getCostAsync(action)
        .then((cost) => {
          // Free action (cost = 0)
          if (cost === 0) {
            console.log(`✅ Free action: ${action}`);
            sub.next({
              newBalance: 0,
              previousBalance: 0,
              amountDeducted: 0,
              action: action as string,
              timestamp: new Date(),
            });
            sub.complete();
            return;
          }

          // Paid action - deduct credits
          return this.creditService
            .getOrCreateOrgWallet(orgId)
            .then((wallet) => {
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
              return this.creditService
                .deductCredits(orgId, cost)
                .then((newBalance) => ({
                  newBalance,
                  previousBalance,
                  cost,
                }));
            })
            .then(({ newBalance, previousBalance, cost: deductedCost }) => {
              const result: DeductionResult = {
                newBalance,
                previousBalance,
                amountDeducted: deductedCost,
                action: action as string,
                timestamp: new Date(),
              };

              console.log(
                `✅ Credits deducted successfully. New balance: ${newBalance}`
              );

              sub.next(result);
              sub.complete();
            });
        })
        .catch((err) => {
          console.error('❌ Error deducting credits:', err);
          sub.error(err);
        });
    });
  }

  /**
   * Get all available actions with their costs (async)
   * Useful for displaying pricing to users
   */
  async getAllActionCostsAsync(): Promise<Record<string, number>> {
    const costs = await this.costsService.getActiveCosts();
    const result: Record<string, number> = {};
    costs.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Get all available actions with their costs (sync, from cache)
   *
   * @deprecated Use getAllActionCostsAsync for most accurate costs
   */
  getAllActionCosts(): Record<CreditAction, number> {
    const result: Record<string, number> = {};
    this.localCostsCache.forEach((value, key) => {
      result[key] = value;
    });
    return result as Record<CreditAction, number>;
  }

  /**
   * Format action cost for display
   * e.g., "Download (15 credits)"
   */
  async formatActionCostAsync(action: CreditAction | string): Promise<string> {
    const cost = await this.getCostAsync(action);
    if (cost === 0) {
      return `${this.capitalizeAction(action)} (Free)`;
    }
    return `${this.capitalizeAction(action)} (${cost} credits)`;
  }

  /**
   * Format action cost for display (sync version)
   *
   * @deprecated Use formatActionCostAsync for most accurate costs
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
    return (
      (action as string).charAt(0).toUpperCase() + (action as string).slice(1)
    );
  }
}
