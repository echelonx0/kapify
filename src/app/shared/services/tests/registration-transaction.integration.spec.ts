// src/app/shared/services/tests/registration-transaction.integration.spec.ts
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RegistrationTransactionService, RegistrationTransactionState } from '../registration-transaction.service';
import { OrganizationSetupService } from '../organization-setup.service';
import { SharedSupabaseService } from '../shared-supabase.service';
import { RegisterRequest } from '../../../auth/production.auth.service';
import { OrganizationType } from '../../models/user.models';

// Mock responses
const MOCK_AUTH_USER = {
  id: 'user-123',
  email: 'test@example.com',
  user_metadata: {
    first_name: 'John',
    last_name: 'Doe',
    user_type: 'sme'
  },
  created_at: new Date().toISOString()
};

const MOCK_ORGANIZATION = {
  id: 'org-123',
  name: 'Test Company',
  organizationType: 'sme' as OrganizationType,  // Add type assertion
  status: 'active' as const,
  isVerified: false,
  country: 'South Africa',
  createdAt: new Date(),
  updatedAt: new Date()
};
const MOCK_REGISTER_REQUEST: RegisterRequest = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'test@example.com',
  phone: '+27123456789',
  password: 'SecurePass123',
  confirmPassword: 'SecurePass123',
  userType: 'sme',
  companyName: 'Test Company',
  agreeToTerms: true
};

// Integration Test Suite
describe('RegistrationTransactionService Integration', () => {
  let service: RegistrationTransactionService;
  let supabaseService: any;
  let organizationService: jasmine.SpyObj<OrganizationSetupService>;

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  beforeEach(() => {
    const mockSupabase = {
      auth: {
        signUp: jasmine.createSpy('signUp')
      },
      from: jasmine.createSpy('from').and.returnValue({
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single')
          })
        }),
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single'),
            maybeSingle: jasmine.createSpy('maybeSingle')
          })
        }),
        delete: jasmine.createSpy('delete').and.returnValue({
          eq: jasmine.createSpy('eq')
        })
      })
    };

    const mockOrgService = jasmine.createSpyObj('OrganizationSetupService', [
      'createOrganizationForUser'
    ]);

    TestBed.configureTestingModule({
      providers: [
        RegistrationTransactionService,
        { provide: SharedSupabaseService, useValue: mockSupabase },
        { provide: OrganizationSetupService, useValue: mockOrgService }
      ]
    });

    service = TestBed.inject(RegistrationTransactionService);
    supabaseService = TestBed.inject(SharedSupabaseService);
    organizationService = TestBed.inject(OrganizationSetupService) as jasmine.SpyObj<OrganizationSetupService>;
  });

  // ===============================
  // SUCCESSFUL TRANSACTION TESTS
  // ===============================

  describe('Successful Transaction Flow', () => {
    beforeEach(() => {
      // Mock successful responses for all phases
      supabaseService.auth.signUp.and.returnValue(
        Promise.resolve({ 
          data: { user: MOCK_AUTH_USER }, 
          error: null 
        })
      );

      supabaseService.from().insert().select().single.and.returnValue(
        Promise.resolve({ data: { id: 'profile-123' }, error: null })
      );

      organizationService.createOrganizationForUser.and.returnValue(
        of({
          success: true,
          organization: MOCK_ORGANIZATION,
          organizationUserId: 'org-user-123',
          message: 'Success'
        })
      );

      supabaseService.from().select().eq().single.and.returnValue(
        Promise.resolve({ 
          data: {
            ...MOCK_AUTH_USER,
            first_name: 'John',
            last_name: 'Doe',
            user_profiles: [{
              profile_step: 0,
              completion_percentage: 0,
              is_verified: false
            }]
          }, 
          error: null 
        })
      );
    });

    it('should execute complete registration transaction successfully', (done) => {
      service.executeRegistrationTransaction(MOCK_REGISTER_REQUEST).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.user).toBeTruthy();
          expect(result.organizationId).toBe('org-123');
          expect(result.user.organizationId).toBe('org-123');
          done();
        },
        error: (err) => {
          fail('Expected success but got error: ' + err);
          done();
        }
      });
    });

    it('should call all required services in correct order', (done) => {
      service.executeRegistrationTransaction(MOCK_REGISTER_REQUEST).subscribe({
        next: () => {
          // Verify auth user creation was called
          expect(supabaseService.auth.signUp).toHaveBeenCalledWith({
            email: MOCK_REGISTER_REQUEST.email,
            password: MOCK_REGISTER_REQUEST.password,
            options: {
              data: {
                first_name: MOCK_REGISTER_REQUEST.firstName,
                last_name: MOCK_REGISTER_REQUEST.lastName,
                phone: MOCK_REGISTER_REQUEST.phone,
                user_type: MOCK_REGISTER_REQUEST.userType,
                company_name: MOCK_REGISTER_REQUEST.companyName
              }
            }
          });

          // Verify user profile creation was called
          expect(supabaseService.from).toHaveBeenCalledWith('users');
          
          // Verify organization creation was called
          expect(organizationService.createOrganizationForUser).toHaveBeenCalledWith({
            userId: MOCK_AUTH_USER.id,
            userType: MOCK_REGISTER_REQUEST.userType,
            firstName: MOCK_REGISTER_REQUEST.firstName,
            lastName: MOCK_REGISTER_REQUEST.lastName,
            email: MOCK_REGISTER_REQUEST.email,
            phone: MOCK_REGISTER_REQUEST.phone,
            companyName: MOCK_REGISTER_REQUEST.companyName
          });

          done();
        }
      });
    });

    it('should build complete user profile with organization context', (done) => {
      service.executeRegistrationTransaction(MOCK_REGISTER_REQUEST).subscribe({
        next: (result) => {
          expect(result.user).toEqual(jasmine.objectContaining({
            id: MOCK_AUTH_USER.id,
            email: MOCK_AUTH_USER.email,
            firstName: 'John',
            lastName: 'Doe',
            organizationId: 'org-123',
            userType: 'sme'
          }));
          done();
        }
      });
    });
  });

  // ===============================
  // PHASE-SPECIFIC FAILURE TESTS
  // ===============================

  describe('Transaction Phase Failures', () => {
    it('should handle auth user creation failure', (done) => {
      supabaseService.auth.signUp.and.returnValue(
        Promise.resolve({ 
          data: null, 
          error: { message: 'Email already registered' } 
        })
      );

      service.executeRegistrationTransaction(MOCK_REGISTER_REQUEST).subscribe({
        next: () => {
          fail('Expected error but got success');
          done();
        },
        error: (result) => {
          expect(result.success).toBe(false);
          expect(result.error).toContain('Authentication failed');
          expect(result.state?.phase).toBe('auth');
          done();
        }
      });
    });

    it('should handle user profile creation failure with rollback', (done) => {
      // Mock successful auth creation
      supabaseService.auth.signUp.and.returnValue(
        Promise.resolve({ 
          data: { user: MOCK_AUTH_USER }, 
          error: null 
        })
      );

      // Mock failed profile creation
      supabaseService.from().insert().select().single.and.returnValue(
        Promise.resolve({ data: null, error: { message: 'Database error' } })
      );

      // Mock successful rollback
      supabaseService.from().delete().eq.and.returnValue(
        Promise.resolve({ error: null })
      );

      service.executeRegistrationTransaction(MOCK_REGISTER_REQUEST).subscribe({
        next: () => {
          fail('Expected error but got success');
          done();
        },
        error: (result) => {
          expect(result.success).toBe(false);
          expect(result.error).toContain('user profile');
          expect(result.state?.phase).toBe('user_profile');
          expect(result.state?.completedSteps).toContain('auth_user_created');
          done();
        }
      });
    });

    it('should handle organization creation failure with rollback', (done) => {
      // Mock successful steps up to organization
      supabaseService.auth.signUp.and.returnValue(
        Promise.resolve({ 
          data: { user: MOCK_AUTH_USER }, 
          error: null 
        })
      );

      supabaseService.from().insert().select().single.and.returnValue(
        Promise.resolve({ data: { id: 'profile-123' }, error: null })
      );

      // Mock failed organization creation
      organizationService.createOrganizationForUser.and.returnValue(
        throwError(() => new Error('Organization creation failed'))
      );

      service.executeRegistrationTransaction(MOCK_REGISTER_REQUEST).subscribe({
        next: () => {
          fail('Expected error but got success');
          done();
        },
        error: (result) => {
          expect(result.success).toBe(false);
          expect(result.error).toContain('organization');
          expect(result.state?.phase).toBe('organization');
          expect(result.state?.completedSteps).toContain('auth_user_created');
          expect(result.state?.completedSteps).toContain('user_profile_created');
          done();
        }
      });
    });
  });

  // ===============================
  // TIMEOUT HANDLING TESTS
  // ===============================

  describe('Timeout Handling', () => {
    it('should handle auth creation timeout', (done) => {
      // Mock delayed response (longer than timeout)
      supabaseService.auth.signUp.and.returnValue(
        new Promise(resolve => setTimeout(resolve, 20000))
      );

      service.executeRegistrationTransaction(MOCK_REGISTER_REQUEST).subscribe({
        next: () => {
          fail('Expected timeout error but got success');
          done();
        },
        error: (result) => {
          expect(result.success).toBe(false);
          expect(result.error).toContain('timed out');
          done();
        }
      });
    });
  });

  // ===============================
  // ROLLBACK MECHANISM TESTS
  // ===============================

  describe('Rollback Mechanisms', () => {
    beforeEach(() => {
      // Mock successful auth and profile creation
      supabaseService.auth.signUp.and.returnValue(
        Promise.resolve({ 
          data: { user: MOCK_AUTH_USER }, 
          error: null 
        })
      );

      supabaseService.from().insert().select().single.and.returnValue(
        Promise.resolve({ data: { id: 'profile-123' }, error: null })
      );

      // Mock successful rollback operations
      supabaseService.from().delete().eq.and.returnValue(
        Promise.resolve({ error: null })
      );
    });

    it('should execute rollback actions in reverse order', (done) => {
      // Mock organization creation failure after successful steps
      organizationService.createOrganizationForUser.and.returnValue(
        throwError(() => new Error('Org creation failed'))
      );

      const deleteCallOrder: string[] = [];
      
      // Track deletion calls
      supabaseService.from.and.callFake((table: string) => ({
        delete: () => ({
          eq: (column: string, value: string) => {
            deleteCallOrder.push(`${table}:${column}:${value}`);
            return Promise.resolve({ error: null });
          }
        }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: 'test' }, error: null }) }) }),
        select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) })
      }));

      service.executeRegistrationTransaction(MOCK_REGISTER_REQUEST).subscribe({
        error: () => {
          // Verify rollback order (should be reverse of creation)
          expect(deleteCallOrder.length).toBeGreaterThan(0);
          // Most recent operations should be rolled back first
          expect(deleteCallOrder[0]).toContain('user_profiles');
          expect(deleteCallOrder[deleteCallOrder.length - 1]).toContain('users');
          done();
        }
      });
    });

    it('should continue rollback even if individual rollback actions fail', (done) => {
      organizationService.createOrganizationForUser.and.returnValue(
        throwError(() => new Error('Org creation failed'))
      );

      let deleteCallCount = 0;
      supabaseService.from().delete().eq.and.callFake(() => {
        deleteCallCount++;
        if (deleteCallCount === 1) {
          return Promise.reject(new Error('Rollback failed'));
        }
        return Promise.resolve({ error: null });
      });

      service.executeRegistrationTransaction(MOCK_REGISTER_REQUEST).subscribe({
        error: (result) => {
          expect(result.success).toBe(false);
          expect(deleteCallCount).toBeGreaterThan(1); // Should continue despite failure
          done();
        }
      });
    });
  });

  // ===============================
  // RECOVERY UTILITY TESTS
  // ===============================

  describe('Recovery Utilities', () => {
    it('should correctly identify user needing recovery', async () => {
      // Mock user with missing organization
      supabaseService.from().select().eq().maybeSingle.and.returnValue(
        Promise.resolve({ data: null, error: null })
      );

      const recoveryCheck = await service.checkUserNeedsRecovery('user-123');
      
      expect(recoveryCheck.needsRecovery).toBe(true);
      expect(recoveryCheck.missingComponents).toContain('organization');
      expect(recoveryCheck.canRecover).toBe(true);
    });

    it('should identify user with complete setup', async () => {
      // Mock user with complete setup
      supabaseService.from().select().eq().maybeSingle.and.returnValue(
        Promise.resolve({ data: { organization_id: 'org-123' }, error: null })
      );

      const recoveryCheck = await service.checkUserNeedsRecovery('user-123');
      
      expect(recoveryCheck.needsRecovery).toBe(false);
      expect(recoveryCheck.missingComponents).toHaveSize(0);
      expect(recoveryCheck.canRecover).toBe(true);
    });
  });

  // ===============================
  // ERROR MESSAGE TESTS
  // ===============================

  describe('Error Message Creation', () => {
    it('should create user-friendly error for email conflicts', (done) => {
      supabaseService.auth.signUp.and.returnValue(
        Promise.resolve({ 
          data: null, 
          error: { message: 'User already registered with this email' } 
        })
      );

      service.executeRegistrationTransaction(MOCK_REGISTER_REQUEST).subscribe({
        error: (result) => {
          expect(result.error).toContain('already registered');
          expect(result.error).toContain('different email');
          done();
        }
      });
    });

    it('should create phase-specific error messages', (done) => {
      // Mock organization phase failure
      supabaseService.auth.signUp.and.returnValue(
        Promise.resolve({ data: { user: MOCK_AUTH_USER }, error: null })
      );

      supabaseService.from().insert().select().single.and.returnValue(
        Promise.resolve({ data: { id: 'profile-123' }, error: null })
      );

      organizationService.createOrganizationForUser.and.returnValue(
        throwError(() => new Error('Generic error'))
      );

      service.executeRegistrationTransaction(MOCK_REGISTER_REQUEST).subscribe({
        error: (result) => {
          expect(result.error).toContain('create organization');
          done();
        }
      });
    });
  });

  // ===============================
  // CONCURRENT OPERATION TESTS
  // ===============================

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous registration attempts', (done) => {
      let completedTransactions = 0;
      const totalTransactions = 3;

      // Mock successful response
      supabaseService.auth.signUp.and.returnValue(
        Promise.resolve({ data: { user: MOCK_AUTH_USER }, error: null })
      );

      supabaseService.from().insert().select().single.and.returnValue(
        Promise.resolve({ data: { id: 'profile-123' }, error: null })
      );

      organizationService.createOrganizationForUser.and.returnValue(
        of({
          success: true,
          organization: MOCK_ORGANIZATION,
          organizationUserId: 'org-user-123',
          message: 'Success'
        })
      );

      supabaseService.from().select().eq().single.and.returnValue(
        Promise.resolve({ data: MOCK_AUTH_USER, error: null })
      );

      // Start multiple transactions
      for (let i = 0; i < totalTransactions; i++) {
        const request = { ...MOCK_REGISTER_REQUEST, email: `test${i}@example.com` };
        
        service.executeRegistrationTransaction(request).subscribe({
          next: () => {
            completedTransactions++;
            if (completedTransactions === totalTransactions) {
              expect(supabaseService.auth.signUp).toHaveBeenCalledTimes(totalTransactions);
              done();
            }
          },
          error: (err) => {
            fail('Expected success but got error: ' + err);
            done();
          }
        });
      }
    });
  });
});