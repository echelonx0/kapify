import { TestBed } from '@angular/core/testing';
import { CreditDeductionService, CreditAction } from './credit-deduction.service';
import { CreditGatingService } from './credit-gating.service';
import { OrgCreditService, OrgWallet } from 'src/app/shared/services/credit.service';

/**
 * UNIT TESTS: Credit Deduction & Gating Services
 *
 * These tests verify that:
 * 1. Credits deduct correctly
 * 2. Insufficient balance is caught
 * 3. Modal flows work as expected
 * 4. Wallet state updates properly
 *
 * Run with: ng test
 */

describe('CreditDeductionService', () => {
  let service: CreditDeductionService;
  let creditService: OrgCreditService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CreditDeductionService,
        {
          provide: OrgCreditService,
          useValue: {
            getOrCreateOrgWallet: jasmine.createSpy('getOrCreateOrgWallet'),
            deductCredits: jasmine.createSpy('deductCredits'),
          },
        },
      ],
    });

    service = TestBed.inject(CreditDeductionService);
    creditService = TestBed.inject(OrgCreditService);
  });

  // ===============================
  // COST CALCULATION TESTS
  // ===============================

  describe('getCost', () => {
    it('should return correct cost for VIEW action', () => {
      const cost = service.getCost(CreditAction.VIEW);
      expect(cost).toBe(10);
    });

    it('should return correct cost for DOWNLOAD action', () => {
      const cost = service.getCost(CreditAction.DOWNLOAD);
      expect(cost).toBe(15);
    });

    it('should return correct cost for SHARE action', () => {
      const cost = service.getCost(CreditAction.SHARE);
      expect(cost).toBe(20);
    });

    it('should return correct cost for GENERATE action', () => {
      const cost = service.getCost(CreditAction.GENERATE);
      expect(cost).toBe(50);
    });

    it('should return 0 for unknown action', () => {
      const cost = service.getCost('unknown_action');
      expect(cost).toBe(0);
    });

    it('should return 0 for string "view"', () => {
      const cost = service.getCost('view');
      expect(cost).toBe(10);
    });
  });

  // ===============================
  // AFFORDABILITY TESTS
  // ===============================

  describe('canAfford', () => {
    it('should return true if balance >= cost', async () => {
      (creditService.getOrCreateOrgWallet as jasmine.Spy).and.returnValue(
        Promise.resolve({ balance: 50, id: 'wallet-1' } as OrgWallet)
      );

      const canAfford = await service.canAfford('org-1', CreditAction.DOWNLOAD); // costs 15
      expect(canAfford).toBe(true);
    });

    it('should return false if balance < cost', async () => {
      (creditService.getOrCreateOrgWallet as jasmine.Spy).and.returnValue(
        Promise.resolve({ balance: 5, id: 'wallet-1' } as OrgWallet)
      );

      const canAfford = await service.canAfford('org-1', CreditAction.DOWNLOAD); // costs 15
      expect(canAfford).toBe(false);
    });

    it('should return true for free actions regardless of balance', async () => {
      (creditService.getOrCreateOrgWallet as jasmine.Spy).and.returnValue(
        Promise.resolve({ balance: 0, id: 'wallet-1' } as OrgWallet)
      );

      const canAfford = await service.canAfford('org-1', 'unknown_action'); // costs 0
      expect(canAfford).toBe(true);
    });
  });

  // ===============================
  // DEDUCTION TESTS (CRITICAL)
  // ===============================

  describe('deductCredits', () => {
    it('should deduct correct amount for valid action', (done) => {
      (creditService.getOrCreateOrgWallet as jasmine.Spy).and.returnValue(
        Promise.resolve({ balance: 100, id: 'wallet-1' } as OrgWallet)
      );
      (creditService.deductCredits as jasmine.Spy).and.returnValue(
        Promise.resolve(90) // 100 - 10
      );

      service.deductCredits('org-1', CreditAction.VIEW).subscribe({
        next: (result) => {
          expect(creditService.deductCredits).toHaveBeenCalledWith('org-1', 10);
          expect(result.newBalance).toBe(90);
          expect(result.previousBalance).toBe(100);
          expect(result.amountDeducted).toBe(10);
          expect(result.action).toBe('view');
          done();
        },
      });
    });

    it('should throw error if insufficient credits', (done) => {
      (creditService.getOrCreateOrgWallet as jasmine.Spy).and.returnValue(
        Promise.resolve({ balance: 5, id: 'wallet-1' } as OrgWallet) // Only 5 credits
      );

      service.deductCredits('org-1', CreditAction.GENERATE).subscribe({
        error: (err) => {
          expect(err.message).toContain('Insufficient credits');
          expect(err.message).toContain('50'); // Needs 50
          expect(err.message).toContain('5'); // Has 5
          done();
        },
      });
    });

    it('should handle free actions (cost = 0)', (done) => {
      service.deductCredits('org-1', 'unknown_action').subscribe({
        next: (result) => {
          expect(result.amountDeducted).toBe(0);
          expect(result.newBalance).toBe(0);
          expect(creditService.deductCredits).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('should include timestamp in result', (done) => {
      (creditService.getOrCreateOrgWallet as jasmine.Spy).and.returnValue(
        Promise.resolve({ balance: 100, id: 'wallet-1' } as OrgWallet)
      );
      (creditService.deductCredits as jasmine.Spy).and.returnValue(
        Promise.resolve(90)
      );

      const beforeTime = new Date();

      service.deductCredits('org-1', CreditAction.VIEW).subscribe({
        next: (result) => {
          const afterTime = new Date();

          expect(result.timestamp.getTime()).toBeGreaterThanOrEqual(
            beforeTime.getTime()
          );
          expect(result.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
          done();
        },
      });
    });
  });

  // ===============================
  // DISPLAY FORMATTING TESTS
  // ===============================

  describe('formatActionCost', () => {
    it('should format paid action correctly', () => {
      const formatted = service.formatActionCost(CreditAction.DOWNLOAD);
      expect(formatted).toBe('Download (15 credits)');
    });

    it('should format free action correctly', () => {
      const formatted = service.formatActionCost('unknown_action');
      expect(formatted).toBe('Unknown_action (Free)');
    });
  });

  describe('getAllActionCosts', () => {
    it('should return all action costs', () => {
      const costs = service.getAllActionCosts();

      expect(costs.view).toBe(10);
      expect(costs.download).toBe(15);
      expect(costs.share).toBe(20);
      expect(costs.generate).toBe(50);
    });
  });
});

// ===============================
// CREDIT GATING SERVICE TESTS
// ===============================

describe('CreditGatingService', () => {
  let service: CreditGatingService;
  let deductionService: CreditDeductionService;
  let creditService: OrgCreditService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CreditGatingService,
        CreditDeductionService,
        {
          provide: OrgCreditService,
          useValue: {
            getOrCreateOrgWallet: jasmine.createSpy('getOrCreateOrgWallet'),
            deductCredits: jasmine.createSpy('deductCredits'),
          },
        },
      ],
    });

    service = TestBed.inject(CreditGatingService);
    deductionService = TestBed.inject(CreditDeductionService);
    creditService = TestBed.inject(OrgCreditService);
  });

  // ===============================
  // WALLET LOADING TESTS
  // ===============================

  describe('loadWallet', () => {
    it('should load wallet and update signal', async () => {
      const mockWallet: OrgWallet = {
        id: 'wallet-1',
        balance: 150,
      };

      (creditService.getOrCreateOrgWallet as jasmine.Spy).and.returnValue(
        Promise.resolve(mockWallet)
      );

      await service.loadWallet('org-1');

      expect(service.wallet()).toEqual(mockWallet);
    });

    it('should set wallet to null on error', async () => {
      (creditService.getOrCreateOrgWallet as jasmine.Spy).and.returnValue(
        Promise.reject(new Error('Network error'))
      );

      await service.loadWallet('org-1');

      expect(service.wallet()).toBeNull();
    });

    it('should do nothing if orgId is empty', async () => {
      await service.loadWallet('');

      expect(creditService.getOrCreateOrgWallet).not.toHaveBeenCalled();
    });
  });

  // ===============================
  // AFFORDABILITY CHECKS
  // ===============================

  describe('canAfford', () => {
    it('should return true if user has enough credits', () => {
      service.wallet.set({ id: 'wallet-1', balance: 100 });

      const canAfford = service.canAfford(CreditAction.VIEW); // costs 10
      expect(canAfford).toBe(true);
    });

    it('should return false if user lacks credits', () => {
      service.wallet.set({ id: 'wallet-1', balance: 5 });

      const canAfford = service.canAfford(CreditAction.GENERATE); // costs 50
      expect(canAfford).toBe(false);
    });

    it('should return false if wallet not loaded', () => {
      service.wallet.set(null);

      const canAfford = service.canAfford(CreditAction.VIEW);
      expect(canAfford).toBe(false);
    });
  });

  // ===============================
  // REQUEST ACTION FLOW TESTS (CRITICAL)
  // ===============================

  describe('requestAction - User HAS Credits', () => {
    beforeEach(() => {
      service.wallet.set({ id: 'wallet-1', balance: 100 });
    });

    it('should open confirmation modal when user has enough credits', () => {
      const result = service.requestAction(CreditAction.DOWNLOAD, 'doc-123');

      expect(result).toBe(true);
      expect(service.costConfirmation().isOpen).toBe(true);
      expect(service.costConfirmation().action).toBe('download');
      expect(service.costConfirmation().cost).toBe(15);
      expect(service.costConfirmation().actionId).toBe('doc-123');
      expect(service.purchasePrompt().isOpen).toBe(false);
    });
  });

  describe('requestAction - User LACKS Credits', () => {
    beforeEach(() => {
      service.wallet.set({ id: 'wallet-1', balance: 5 });
    });

    it('should open purchase prompt when user lacks credits', () => {
      const result = service.requestAction(CreditAction.GENERATE, 'gen-456');

      expect(result).toBe(false);
      expect(service.purchasePrompt().isOpen).toBe(true);
      expect(service.purchasePrompt().creditsNeeded).toBe(45); // 50 - 5
      expect(service.purchasePrompt().action).toBe('generate');
      expect(service.costConfirmation().isOpen).toBe(false);
    });
  });

  // ===============================
  // MODAL MANAGEMENT TESTS
  // ===============================

  describe('confirmAction', () => {
    it('should return action from confirmation modal', () => {
      service.requestAction(CreditAction.DOWNLOAD, 'doc-1');

      const action = service.confirmAction();

      expect(action).toBe('download');
      expect(service.costConfirmation().isOpen).toBe(false);
    });

    it('should return null if no action in modal', () => {
      const action = service.confirmAction();

      expect(action).toBeNull();
    });
  });

  describe('closeCostModal', () => {
    it('should close confirmation modal', () => {
      service.requestAction(CreditAction.VIEW);
      expect(service.costConfirmation().isOpen).toBe(true);

      service.closeCostModal();

      expect(service.costConfirmation().isOpen).toBe(false);
    });
  });

  describe('closePurchasePrompt', () => {
    it('should close purchase prompt', () => {
      service.wallet.set({ id: 'wallet-1', balance: 0 });
      service.requestAction(CreditAction.GENERATE);
      expect(service.purchasePrompt().isOpen).toBe(true);

      service.closePurchasePrompt();

      expect(service.purchasePrompt().isOpen).toBe(false);
    });
  });

  // ===============================
  // COMPUTED SIGNALS TESTS
  // ===============================

  describe('computed signals', () => {
    it('hasEnoughCredits should be true if balance > 0', () => {
      service.wallet.set({ id: 'wallet-1', balance: 1 });
      expect(service.hasEnoughCredits()).toBe(true);

      service.wallet.set({ id: 'wallet-1', balance: 0 });
      expect(service.hasEnoughCredits()).toBe(false);
    });

    it('creditsFormatted should format balance with locale', () => {
      service.wallet.set({ id: 'wallet-1', balance: 1500 });
      const formatted = service.creditsFormatted();

      expect(formatted).toContain('1'); // Should contain at least '1'
      expect(typeof formatted).toBe('string');
    });
  });

  // ===============================
  // EDGE CASES
  // ===============================

  describe('edge cases', () => {
    it('should handle zero balance exactly at cost threshold', () => {
      service.wallet.set({ id: 'wallet-1', balance: 10 });

      // Exactly enough
      const canAfford1 = service.canAfford(CreditAction.VIEW); // costs 10
      expect(canAfford1).toBe(true);

      // Just over
      const result1 = service.requestAction(CreditAction.VIEW);
      expect(result1).toBe(true); // Should show confirmation, not purchase
      expect(service.costConfirmation().isOpen).toBe(true);
      service.closeCostModal();

      // Just under
      service.wallet.set({ id: 'wallet-1', balance: 9 });
      const result2 = service.requestAction(CreditAction.VIEW);
      expect(result2).toBe(false); // Should show purchase prompt
      expect(service.purchasePrompt().isOpen).toBe(true);
    });

    it('should handle null wallet gracefully', () => {
      service.wallet.set(null);

      const canAfford = service.canAfford(CreditAction.VIEW);
      expect(canAfford).toBe(false);

      const result = service.requestAction(CreditAction.VIEW);
      expect(result).toBe(false);
      expect(service.purchasePrompt().isOpen).toBe(true);
    });
  });
});
