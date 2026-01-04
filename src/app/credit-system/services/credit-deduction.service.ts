// src/app/data-room/services/credit-deduction.service.ts - FIXED VERSION
// UPDATED: Uses spendCredits() from OrgCreditService instead of non-existent deductCredits()
import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { OrgCreditService } from 'src/app/shared/services/credit.service';
import { CreditCostsService } from '../../core/admin/services/credit-costs.service';

/**
 * Credit action types
 */
export enum CreditAction {
  VIEW = 'view',
  GENERATE = 'generate',
  SHARE = 'share',
  DOWNLOAD = 'download',
}

/**
 * Fallback costs if database fetch fails
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

@Injectable({ providedIn: 'root' })
export class CreditDeductionService {
  private creditService = inject(OrgCreditService);
  private costsService = inject(CreditCostsService);
  private localCostsCache = new Map<string, number>();
  private cacheInitialized = false;

  constructor() {
    console.log('✅ CreditDeductionService initialized');
    this.initializeCache();
  }

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
      Object.entries(FALLBACK_COSTS).forEach(([key, value]) => {
        this.localCostsCache.set(key, value);
      });
      this.cacheInitialized = true;
    }
  }

  async getCostAsync(action: CreditAction | string): Promise<number> {
    return await this.costsService.getCost(
      action as string,
      FALLBACK_COSTS[action as string] || 0
    );
  }

  getCost(action: CreditAction | string): number {
    if (this.localCostsCache.has(action as string)) {
      return this.localCostsCache.get(action as string)!;
    }
    return FALLBACK_COSTS[action as string] || 0;
  }

  async refreshCosts(): Promise<void> {
    try {
      const costs = await this.costsService.getActiveCosts();
      this.localCostsCache = new Map(costs);
      console.log('✅ Credit costs cache refreshed');
    } catch (err) {
      console.error('❌ Failed to refresh costs cache:', err);
    }
  }

  async canAfford(
    orgId: string,
    action: CreditAction | string
  ): Promise<boolean> {
    const cost = await this.getCostAsync(action);
    if (cost === 0) return true;

    try {
      const wallet = await this.creditService.getOrCreateOrgWallet(orgId);
      return wallet.balance >= cost;
    } catch (err) {
      console.error('❌ Error checking affordability:', err);
      return false;
    }
  }

  /**
   * ✅ FIXED: Now uses spendCredits() RPC function
   */
  deductCredits(
    orgId: string,
    action: CreditAction | string
  ): Observable<DeductionResult> {
    return from(
      (async () => {
        const cost = await this.getCostAsync(action);

        if (cost === 0) {
          console.log(`✅ Free action: ${action}`);
          return {
            newBalance: 0,
            previousBalance: 0,
            amountDeducted: 0,
            action: action as string,
            timestamp: new Date(),
          };
        }

        const wallet = await this.creditService.getOrCreateOrgWallet(orgId);
        const previousBalance = wallet.balance;

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

        // ✅ Use spendCredits RPC function
        await this.creditService
          .spendCredits(
            orgId,
            cost,
            `Credits spent for action: ${action}`,
            undefined
          )
          .toPromise();

        // Fetch updated wallet
        const updatedWallet = await this.creditService.getOrCreateOrgWallet(
          orgId
        );

        const result: DeductionResult = {
          newBalance: updatedWallet.balance,
          previousBalance,
          amountDeducted: cost,
          action: action as string,
          timestamp: new Date(),
        };

        console.log(
          `✅ Credits deducted successfully. New balance: ${result.newBalance}`
        );

        return result;
      })()
    );
  }

  async getAllActionCostsAsync(): Promise<Record<string, number>> {
    const costs = await this.costsService.getActiveCosts();
    const result: Record<string, number> = {};
    costs.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  getAllActionCosts(): Record<CreditAction, number> {
    const result: Record<string, number> = {};
    this.localCostsCache.forEach((value, key) => {
      result[key] = value;
    });
    return result as Record<CreditAction, number>;
  }

  async formatActionCostAsync(action: CreditAction | string): Promise<string> {
    const cost = await this.getCostAsync(action);
    if (cost === 0) {
      return `${this.capitalizeAction(action)} (Free)`;
    }
    return `${this.capitalizeAction(action)} (${cost} credits)`;
  }

  formatActionCost(action: CreditAction | string): string {
    const cost = this.getCost(action);
    if (cost === 0) {
      return `${this.capitalizeAction(action)} (Free)`;
    }
    return `${this.capitalizeAction(action)} (${cost} credits)`;
  }

  private capitalizeAction(action: CreditAction | string): string {
    return (
      (action as string).charAt(0).toUpperCase() + (action as string).slice(1)
    );
  }
}
