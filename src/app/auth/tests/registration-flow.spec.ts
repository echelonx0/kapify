// src/app/auth/tests/registration-flow.spec.ts
import { fakeAsync, tick, TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthService, RegisterRequest } from '../production.auth.service';
import { RegistrationTransactionService } from '../../shared/services/registration-transaction.service';
import { SharedSupabaseService } from '../../shared/services/shared-supabase.service';
import { Router } from '@angular/router';

// Mock data
const MOCK_USER_DATA = {
  id: 'test-user-123',
  email: 'test@example.com',
  user_metadata: {
    first_name: 'John',
    last_name: 'Doe',
    user_type: 'sme'
  },
  created_at: new Date().toISOString()
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

const MOCK_SESSION = {
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  user: MOCK_USER_DATA
};

// Test Utilities
class RegistrationTestUtils {
  static createMockSupabaseService() {
    return {
      auth: {
        signUp: jasmine.createSpy('signUp').and.returnValue(
          Promise.resolve({ 
            data: { user: MOCK_USER_DATA }, 
            error: null 
          })
        ),
        signInWithPassword: jasmine.createSpy('signInWithPassword').and.returnValue(
          Promise.resolve({ 
            data: { user: MOCK_USER_DATA, session: MOCK_SESSION }, 
            error: null 
          })
        ),
        getSession: jasmine.createSpy('getSession').and.returnValue(
          Promise.resolve({ 
            data: { session: null }, 
            error: null 
          })
        ),
        onAuthStateChange: jasmine.createSpy('onAuthStateChange'),
        signOut: jasmine.createSpy('signOut').and.returnValue(
          Promise.resolve({ error: null })
        )
      },
      from: jasmine.createSpy('from').and.returnValue({
        insert: jasmine.createSpy('insert').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: { id: 'test-id' }, error: null })
            )
          })
        }),
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.returnValue(
              Promise.resolve({ data: MOCK_USER_DATA, error: null })
            ),
            maybeSingle: jasmine.createSpy('maybeSingle').and.returnValue(
              Promise.resolve({ data: { organization_id: 'org-123' }, error: null })
            )
          })
        }),
        delete: jasmine.createSpy('delete').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(
            Promise.resolve({ error: null })
          )
        }),
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(
            Promise.resolve({ error: null })
          )
        })
      }),
      getClient: jasmine.createSpy('getClient').and.returnValue(Promise.resolve({}))
    };
  }

  static createMockTransactionService() {
    return {
      executeRegistrationTransaction: jasmine.createSpy('executeRegistrationTransaction').and.returnValue(
        of({
          success: true,
          user: {
            id: MOCK_USER_DATA.id,
            email: MOCK_USER_DATA.email,
            firstName: 'John',
            lastName: 'Doe',
            userType: 'sme',
            organizationId: 'org-123'
          },
          organizationId: 'org-123'
        })
      ),
      checkUserNeedsRecovery: jasmine.createSpy('checkUserNeedsRecovery').and.returnValue(
        Promise.resolve({
          needsRecovery: false,
          missingComponents: [],
          canRecover: true
        })
      )
    };
  }

  static createMockRouter() {
    return {
      navigate: jasmine.createSpy('navigate')
    };
  }
}

// Main Test Suite
describe('Enhanced Registration Flow', () => {
  let authService: AuthService;
  let transactionService: jasmine.SpyObj<RegistrationTransactionService>;
  let supabaseService: any;
  let router: jasmine.SpyObj<Router>;

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  beforeEach(async () => {
    const mockSupabase = RegistrationTestUtils.createMockSupabaseService();
    const mockTransaction = RegistrationTestUtils.createMockTransactionService();
    const mockRouter = RegistrationTestUtils.createMockRouter();

    await TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: SharedSupabaseService, useValue: mockSupabase },
        { provide: RegistrationTransactionService, useValue: mockTransaction },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    transactionService = TestBed.inject(RegistrationTransactionService) as jasmine.SpyObj<RegistrationTransactionService>;
    supabaseService = TestBed.inject(SharedSupabaseService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  // ===============================
  // LOADING STATE TESTS
  // ===============================

  describe('Loading State Management', () => {
    it('should start with initialization loading', () => {
      expect(authService.isInitializing()).toBe(true);
      expect(authService.isLoading()).toBe(true);
    });

    it('should set registration loading during register call', (done) => {
      authService.register(MOCK_REGISTER_REQUEST).subscribe({
        next: () => {
          expect(authService.isRegistering()).toBe(false); // Should be false after completion
          done();
        }
      });

      // Check loading state during operation
      setTimeout(() => {
        expect(authService.isRegistering()).toBe(true);
      }, 10);
    });

    it('should set login loading during login call', (done) => {
      authService.login({ email: 'test@example.com', password: 'password' }).subscribe({
        next: () => {
          expect(authService.isLoggingIn()).toBe(false); // Should be false after completion
          done();
        }
      });

      // Check loading state during operation
      setTimeout(() => {
        expect(authService.isLoggingIn()).toBe(true);
      }, 10);
    });

    it('should clear loading state on error', (done) => {
      transactionService.executeRegistrationTransaction.and.returnValue(
        throwError(() => new Error('Test error'))
      );

      authService.register(MOCK_REGISTER_REQUEST).subscribe({
        error: () => {
          expect(authService.isRegistering()).toBe(false);
          expect(authService.isLoading()).toBe(false);
          done();
        }
      });
    });
  });

  // ===============================
  // REGISTRATION VALIDATION TESTS
  // ===============================

  describe('Registration Validation', () => {
    it('should reject registration without terms agreement', (done) => {
      const invalidRequest = { ...MOCK_REGISTER_REQUEST, agreeToTerms: false };
      
      authService.register(invalidRequest).subscribe((result) => {
          expect(result.error).toContain('terms and conditions');
          done();
        }
      );
    });

    it('should reject registration with mismatched passwords', (done) => {
      const invalidRequest = { ...MOCK_REGISTER_REQUEST, confirmPassword: 'different' };
      
      authService.register(invalidRequest).subscribe({
        error: (result) => {
          expect(result.error).toContain('do not match');
          done();
        }
      });
    });

    it('should reject registration with short password', (done) => {
      const invalidRequest = { 
        ...MOCK_REGISTER_REQUEST, 
        password: '123', 
        confirmPassword: '123' 
      };
      
      authService.register(invalidRequest).subscribe({
        error: (result) => {
          expect(result.error).toContain('8 characters');
          done();
        }
      });
    });

    it('should reject registration with missing required fields', (done) => {
      const invalidRequest = { ...MOCK_REGISTER_REQUEST, firstName: '' };
      
      authService.register(invalidRequest).subscribe((result) => {
          expect(result.error).toContain('required fields');
          done();
        }
      );
    });
  });

  // ===============================
  // SUCCESSFUL FLOW TESTS
  // ===============================

  describe('Successful Registration Flow', () => {
    it('should complete successful registration', (done) => {
      authService.register(MOCK_REGISTER_REQUEST).subscribe({
        next: (result) => {
          expect(result.user).toBeTruthy();
          expect(result.error).toBe(null);
          expect(result.organizationId).toBe('org-123');
          expect(result.organizationCreated).toBe(true);
          expect(authService.isAuthenticated()).toBe(true);
          done();
        }
      });
    });

    it('should update auth state after successful registration', (done) => {
      authService.register(MOCK_REGISTER_REQUEST).subscribe({
        next: () => {
          expect(authService.user()).toBeTruthy();
          expect(authService.user()?.organizationId).toBe('org-123');
          expect(authService.userHasOrganization()).toBe(true);
          done();
        }
      });
    });

    it('should call transaction service with correct parameters', (done) => {
      authService.register(MOCK_REGISTER_REQUEST).subscribe({
        next: () => {
          expect(transactionService.executeRegistrationTransaction).toHaveBeenCalledWith(MOCK_REGISTER_REQUEST);
          done();
        }
      });
    });
  });

  // ===============================
  // ERROR HANDLING TESTS
  // ===============================

  describe('Error Handling', () => {
    it('should handle transaction service errors gracefully', (done) => {
      transactionService.executeRegistrationTransaction.and.returnValue(
        throwError(() => new Error('Database connection failed'))
      );

      authService.register(MOCK_REGISTER_REQUEST).subscribe({
        error: (result) => {
          expect(result.success).toBe(false);
          expect(result.error).toBeTruthy();
          expect(authService.isAuthenticated()).toBe(false);
          done();
        }
      });
    });

    it('should handle timeout errors with user-friendly messages', (done) => {
      transactionService.executeRegistrationTransaction.and.returnValue(
        throwError(() => new Error('timeout'))
      );

      authService.register(MOCK_REGISTER_REQUEST).subscribe({
        error: (result) => {
          expect(result.error).toContain('timed out');
          expect(result.error).toContain('connection');
          done();
        }
      });
    });

    it('should handle lock errors with appropriate messages', (done) => {
      transactionService.executeRegistrationTransaction.and.returnValue(
        throwError(() => new Error('NavigatorLockAcquireTimeoutError'))
      );

      authService.register(MOCK_REGISTER_REQUEST).subscribe({
        error: (result) => {
          expect(result.error).toContain('system issue');
          done();
        }
      });
    });
  });

  // ===============================
  // LOGIN TESTS
  // ===============================

  describe('Login Flow', () => {
    it('should complete successful login', (done) => {
      authService.login({ email: 'test@example.com', password: 'password' }).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.user).toBeTruthy();
          expect(authService.isAuthenticated()).toBe(true);
          done();
        }
      });
    });

    it('should handle invalid credentials error', (done) => {
      supabaseService.auth.signInWithPassword.and.returnValue(
        Promise.resolve({ 
          data: null, 
          error: { message: 'Invalid login credentials' } 
        })
      );

      authService.login({ email: 'wrong@example.com', password: 'wrong' }).subscribe({
        error: (result) => {
          expect(result.error).toContain('Invalid email or password');
          done();
        }
      });
    });

    it('should handle unconfirmed email error', (done) => {
      supabaseService.auth.signInWithPassword.and.returnValue(
        Promise.resolve({ 
          data: null, 
          error: { message: 'Email not confirmed' } 
        })
      );

      authService.login({ email: 'unconfirmed@example.com', password: 'password' }).subscribe({
        error: (result) => {
          expect(result.error).toContain('confirmation link');
          done();
        }
      });
    });
  });

  // ===============================
  // ORGANIZATION UTILITIES TESTS
  // ===============================

  describe('Organization Utilities', () => {
    beforeEach(fakeAsync(() => {
      // Set up authenticated user with organization
      authService.register(MOCK_REGISTER_REQUEST).subscribe();
      tick();
    }));

    it('should correctly identify user has organization', () => {
      expect(authService.userHasOrganization()).toBe(true);
    });

    it('should return correct organization ID', () => {
      expect(authService.getCurrentUserOrganizationId()).toBe('org-123');
    });

    it('should handle user without organization', (done) => {
      // Clear user state
      authService.signOut().then(() => {
        expect(authService.userHasOrganization()).toBe(false);
        expect(authService.getCurrentUserOrganizationId()).toBe(null);
        done();
      });
    });
  });

  // ===============================
  // RECOVERY TESTS
  // ===============================

  describe('Recovery Utilities', () => {
    it('should check if user needs organization recovery', async () => {
      // Mock user without organization
      authService.user.set({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'sme',
        profileStep: 0,
        completionPercentage: 0,
        isVerified: false,
        createdAt: new Date().toISOString()
        // No organizationId
      });

      transactionService.checkUserNeedsRecovery.and.returnValue(
        Promise.resolve({
          needsRecovery: true,
          missingComponents: ['organization'],
          canRecover: true
        })
      );

      const needsRecovery = await authService.checkCurrentUserNeedsOrganizationRecovery();
      expect(needsRecovery).toBe(true);
    });

    it('should recover organization for user without one', (done) => {
      // Mock user without organization
      authService.user.set({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'sme',
        profileStep: 0,
        completionPercentage: 0,
        isVerified: false,
        createdAt: new Date().toISOString()
        // No organizationId
      });

      authService.recoverUserOrganization().subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(result.organizationId).toBe('org-123');
          expect(authService.user()?.organizationId).toBe('org-123');
          done();
        }
      });
    });
  });

  // ===============================
  // LEGACY COMPATIBILITY TESTS
  // ===============================

  describe('Legacy Compatibility', () => {
    it('should support legacy signUp method', (done) => {
      const legacyCredentials = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'sme' as const
      };

      authService.signUp(legacyCredentials).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(transactionService.executeRegistrationTransaction).toHaveBeenCalled();
          done();
        }
      });
    });

    it('should return access token when session exists', (done) => {
      authService.register(MOCK_REGISTER_REQUEST).subscribe({
        next: () => {
          // Mock session
          authService.session.set(MOCK_SESSION as any);
          expect(authService.getAccessToken()).toBe('mock-token');
          done();
        }
      });
    });
  });
});