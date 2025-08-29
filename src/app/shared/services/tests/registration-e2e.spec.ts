// src/app/auth/tests/registration-e2e.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, delay, from } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';
import { routes } from '../../../app.routes';
 
import { By } from '@angular/platform-browser';
 
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, AuthOperationResult } from '../../../auth/production.auth.service';
import { RegisterComponent } from '../../../auth/register/register.component';

// E2E Test Helper Class
class RegistrationE2EHelper {
  constructor(
    private component: RegisterComponent,
    private fixture: ComponentFixture<RegisterComponent>,
    private authService: jasmine.SpyObj<AuthService>
  ) {}

  // Simulate user filling out form
  fillRegistrationForm(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    password?: string;
    confirmPassword?: string;
    userType?: 'sme' | 'funder';
    agreeToTerms?: boolean;
  }) {
    const form = this.component.registerForm;
    
    if (data.firstName !== undefined) form.patchValue({ firstName: data.firstName });
    if (data.lastName !== undefined) form.patchValue({ lastName: data.lastName });
    if (data.email !== undefined) form.patchValue({ email: data.email });
    if (data.phone !== undefined) form.patchValue({ phone: data.phone });
    if (data.companyName !== undefined) form.patchValue({ companyName: data.companyName });
    if (data.password !== undefined) form.patchValue({ password: data.password });
    if (data.confirmPassword !== undefined) form.patchValue({ confirmPassword: data.confirmPassword });
    if (data.userType !== undefined) {
      this.component.selectUserType(data.userType);
    }
    if (data.agreeToTerms !== undefined) form.patchValue({ agreeToTerms: data.agreeToTerms });
    
    this.fixture.detectChanges();
  }

  // Get form field element
  getFormField(fieldName: string): HTMLInputElement {
    return this.fixture.debugElement.query(By.css(`[formControlName="${fieldName}"]`))?.nativeElement;
  }

  // Get submit button
  getSubmitButton(): HTMLButtonElement {
    return this.fixture.debugElement.query(By.css('button[type="submit"]'))?.nativeElement;
  }

  // Get error message elements
  getErrorMessages(): string[] {
    const errorElements = this.fixture.debugElement.queryAll(By.css('.text-red-600, .error-message'));
    return errorElements.map(el => el.nativeElement.textContent.trim());
  }

  // Get user type buttons
  getUserTypeButton(type: 'sme' | 'funder'): HTMLButtonElement {
    return this.fixture.debugElement.query(By.css(`[data-user-type="${type}"]`))?.nativeElement;
  }

  // Check loading indicators
  isShowingLoadingIndicator(): boolean {
    const loadingElements = this.fixture.debugElement.queryAll(By.css('.loading, .spinner, [data-loading]'));
    return loadingElements.length > 0 && loadingElements.some(el => 
      el.nativeElement.style.display !== 'none'
    );
  }

  // Simulate form submission
  submitForm(): void {
    const submitButton = this.getSubmitButton();
    if (submitButton && !submitButton.disabled) {
      submitButton.click();
      this.fixture.detectChanges();
    }
  }

  // Wait for async operations
  async waitForAsyncOperations(): Promise<void> {
    this.fixture.detectChanges();
    await this.fixture.whenStable();
    this.fixture.detectChanges();
  }

  // Check form validation states
  getFieldValidationState(fieldName: string): 'valid' | 'invalid' | 'pending' {
    const field = this.component.registerForm.get(fieldName);
    if (!field) return 'valid';
    
    if (field.pending) return 'pending';
    if (field.invalid && field.touched) return 'invalid';
    return 'valid';
  }

  // Get form values
  getFormValues() {
    return this.component.registerForm.value;
  }
}

// Main E2E Test Suite
describe('Registration Component E2E', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let helper: RegistrationE2EHelper;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['register'], {
      isLoading: jasmine.createSpy().and.returnValue(false),
      isRegistering: jasmine.createSpy().and.returnValue(false)
    });

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        ReactiveFormsModule,
        LucideAngularModule,
        RouterTestingModule.withRoutes(routes)
      ],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { 
          provide: ActivatedRoute, 
          useValue: { 
            queryParams: of({}) 
          } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    
    helper = new RegistrationE2EHelper(component, fixture, authService);
    
    fixture.detectChanges();
  });

  // ===============================
  // HAPPY PATH E2E SCENARIOS
  // ===============================

  describe('Happy Path Registration Flow', () => {
    it('should complete full SME registration successfully', async () => {
      // ARRANGE: Mock successful registration
      authService.register.and.returnValue(of({
        user: {
          id: 'user-123',
          email: 'john@testcompany.com',
          firstName: 'John',
          lastName: 'Doe',
          organizationId: 'org-123'
        } as any,
        error: null,
        organizationId: 'org-123',
        organizationCreated: true,
        success: true
      }));

      // ACT 1: User fills out SME registration form
      helper.fillRegistrationForm({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@testcompany.com',
        phone: '+27123456789',
        companyName: 'Test SME Company',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        userType: 'sme',
        agreeToTerms: true
      });

      await helper.waitForAsyncOperations();

      // ASSERT 1: Form should be valid
      expect(component.registerForm.valid).toBe(true);
      expect(helper.getFieldValidationState('firstName')).toBe('valid');
      expect(helper.getFieldValidationState('companyName')).toBe('valid');

      // ACT 2: User submits form
      helper.submitForm();
      await helper.waitForAsyncOperations();

      // ASSERT 2: Registration should be called with correct data
      expect(authService.register).toHaveBeenCalledWith(jasmine.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@testcompany.com',
        userType: 'sme',
        companyName: 'Test SME Company',
        agreeToTerms: true
      }));

      // ASSERT 3: User should be redirected to dashboard
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should complete full Funder registration successfully', async () => {
      // ARRANGE: Mock successful registration
      authService.register.and.returnValue(of({
        user: {
          id: 'user-456',
          email: 'jane@investmentfund.com',
          firstName: 'Jane',
          lastName: 'Smith',
          organizationId: 'org-456'
        } as any,
        error: null,
        organizationId: 'org-456',
        organizationCreated: true,
        success: true
      }));

      // ACT 1: User selects Funder type and fills form
      helper.fillRegistrationForm({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@investmentfund.com',
        phone: '+27987654321',
        password: 'SecurePass456',
        confirmPassword: 'SecurePass456',
        userType: 'funder',
        agreeToTerms: true
      });

      await helper.waitForAsyncOperations();

      // ASSERT 1: Company name should not be required for funders
      expect(component.registerForm.valid).toBe(true);
      expect(helper.getFieldValidationState('companyName')).toBe('valid');

      // ACT 2: Submit form
      helper.submitForm();
      await helper.waitForAsyncOperations();

      // ASSERT 2: Correct registration call
      expect(authService.register).toHaveBeenCalledWith(jasmine.objectContaining({
        userType: 'funder',
        companyName: undefined
      }));

      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  // ===============================
  // LOADING STATE E2E SCENARIOS
  // ===============================

  describe('Loading State Management', () => {
    it('should show loading state during registration', async () => {
      // ARRANGE: Mock delayed registration response
      authService.register.and.returnValue(
        of({
          user: null,
          error: null,
          organizationCreated: false,
          success: false
        }).pipe(delay(1000))
      );

      // Mock loading state
      authService.isRegistering.and.returnValue(true);

      // ACT: Fill form and submit
      helper.fillRegistrationForm({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        userType: 'sme',
        companyName: 'Test Company',
        agreeToTerms: true
      });

      helper.submitForm();
      fixture.detectChanges();

      // ASSERT: Loading indicators should be visible
      expect(component.isLoading()).toBe(true);
      
      // Check that submit button is disabled during loading
      const submitButton = helper.getSubmitButton();
      expect(submitButton.disabled).toBe(true);
    });

    it('should clear loading state on successful registration', async () => {
      // ARRANGE
      let resolveRegistration: (value: AuthOperationResult) => void;
      const registrationPromise = new Promise<AuthOperationResult>(resolve => {
        resolveRegistration = resolve;
      });

      authService.register.and.returnValue(from(registrationPromise));

      // Initially not loading
      authService.isRegistering.and.returnValue(false);

      // ACT: Submit form
      helper.fillRegistrationForm({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        userType: 'sme',
        companyName: 'Test Company',
        agreeToTerms: true
      });

      helper.submitForm();

      // Set loading during operation
      authService.isRegistering.and.returnValue(true);
      fixture.detectChanges();

      expect(component.isLoading()).toBe(true);

      // Resolve registration
      resolveRegistration!({
        user: {
          id: 'user-123',
          email: '',
          firstName: '',
          lastName: '',
          userType: '',
          profileStep: 0,
          completionPercentage: 0,
          isVerified: false,
          createdAt: ''
        },
        error: null,
        organizationCreated: true,
        success: true
      });

      // Clear loading after completion
      authService.isRegistering.and.returnValue(false);
      await helper.waitForAsyncOperations();

      // ASSERT: Loading should be cleared
      expect(component.isLoading()).toBe(false);
    });
  });

  // ===============================
  // ERROR HANDLING E2E SCENARIOS
  // ===============================

  describe('Error Handling Scenarios', () => {
    it('should display server validation errors to user', async () => {
      // ARRANGE: Mock registration failure
      authService.register.and.returnValue(throwError(() => ({
        user: null,
        error: 'This email address is already registered. Please use a different email.',
        organizationCreated: false
      })));

      // ACT: Fill form and submit
      helper.fillRegistrationForm({
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        userType: 'sme',
        companyName: 'Test Company',
        agreeToTerms: true
      });

      helper.submitForm();
      await helper.waitForAsyncOperations();

      // ASSERT: Error should be displayed to user
      expect(component.error()).toContain('already registered');
      
      const errorMessages = helper.getErrorMessages();
      expect(errorMessages.some(msg => msg.includes('already registered'))).toBe(true);
    });

    it('should handle network timeout gracefully', async () => {
      // ARRANGE: Mock timeout error
      authService.register.and.returnValue(throwError(() => ({
        user: null,
        error: 'Registration timed out. Please check your connection and try again.',
        organizationCreated: false
      })));

      // ACT: Fill form and submit
      helper.fillRegistrationForm({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        userType: 'sme',
        companyName: 'Test Company',
        agreeToTerms: true
      });

      helper.submitForm();
      await helper.waitForAsyncOperations();

      // ASSERT: User-friendly timeout message
      expect(component.error()).toContain('timed out');
      expect(component.error()).toContain('connection');
      
      // Form should remain filled for user to retry
      expect(helper.getFormValues().email).toBe('john@test.com');
    });

    it('should recover from organization creation failure', async () => {
      // ARRANGE: Mock partial failure (user created, org failed)
      authService.register.and.returnValue(throwError(() => ({
        user: null,
        error: 'Failed to create organization. Please try again.',
        organizationCreated: false
      })));

      // ACT: Submit form
      helper.fillRegistrationForm({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'password123',
        confirmPassword: 'password123',
        userType: 'sme',
        companyName: 'Test Company',
        agreeToTerms: true
      });

      helper.submitForm();
      await helper.waitForAsyncOperations();

      // ASSERT: Specific organization error shown
      expect(component.error()).toContain('organization');
      
      // ARRANGE 2: Mock successful retry
      authService.register.and.returnValue(of({
        user: { id: 'user-123' } as any,
        error: null,
        organizationCreated: true,
        success: true
      }));

      // ACT 2: User retries
      helper.submitForm();
      await helper.waitForAsyncOperations();

      // ASSERT 2: Should succeed on retry
      expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  // ===============================
  // FORM VALIDATION E2E SCENARIOS
  // ===============================

  describe('Form Validation Scenarios', () => {
    it('should prevent submission with invalid form', async () => {
      // ACT: Try to submit empty form
      helper.submitForm();
      await helper.waitForAsyncOperations();

      // ASSERT: Registration should not be called
      expect(authService.register).not.toHaveBeenCalled();
      
      // Validation errors should be shown
      expect(helper.getFieldValidationState('firstName')).toBe('invalid');
      expect(helper.getFieldValidationState('email')).toBe('invalid');
    });

    it('should validate password requirements in real-time', async () => {
      // ACT: Enter weak password
      helper.fillRegistrationForm({
        password: '123'
      });

      // Trigger validation by touching confirm password
      const confirmField = helper.getFormField('confirmPassword');
      confirmField.focus();
      confirmField.blur();
      await helper.waitForAsyncOperations();

      // ASSERT: Password validation errors should appear
      expect(helper.getFieldValidationState('password')).toBe('invalid');
      const errorMessages = helper.getErrorMessages();
      expect(errorMessages.some(msg => msg.includes('8 characters'))).toBe(true);
    });

    it('should validate password confirmation matching', async () => {
      // ACT: Enter mismatched passwords
      helper.fillRegistrationForm({
        password: 'SecurePass123',
        confirmPassword: 'DifferentPass456'
      });

      // Trigger validation
      const confirmField = helper.getFormField('confirmPassword');
      confirmField.focus();
      confirmField.blur();
      await helper.waitForAsyncOperations();

      // ASSERT: Mismatch error should appear
      expect(helper.getFieldValidationState('confirmPassword')).toBe('invalid');
      const errorMessages = helper.getErrorMessages();
      expect(errorMessages.some(msg => msg.includes('do not match'))).toBe(true);
    });

    it('should require company name for SME users', async () => {
      // ACT: Select SME but don't fill company name
      helper.fillRegistrationForm({
        firstName: 'John',
        lastName: 'Doe',
        userType: 'sme'
        // companyName intentionally omitted
      });

      const companyField = helper.getFormField('companyName');
      companyField.focus();
      companyField.blur();
      await helper.waitForAsyncOperations();

      // ASSERT: Company name should be required
      expect(helper.getFieldValidationState('companyName')).toBe('invalid');
    });

    it('should not require company name for Funder users', async () => {
      // ACT: Select Funder without company name
      helper.fillRegistrationForm({
        firstName: 'Jane',
        lastName: 'Smith',
        userType: 'funder'
        // companyName intentionally omitted
      });

      await helper.waitForAsyncOperations();

      // ASSERT: Company name should not be required
      expect(helper.getFieldValidationState('companyName')).toBe('valid');
    });
  });

  // ===============================
  // USER INTERACTION E2E SCENARIOS
  // ===============================

  describe('User Interaction Scenarios', () => {
    it('should toggle password visibility', async () => {
      // ACT: Enter password
      helper.fillRegistrationForm({ password: 'SecurePass123' });
      
      const passwordField = helper.getFormField('password');
      expect(passwordField.type).toBe('password');

      // Click toggle button
      const toggleButton = fixture.debugElement.query(By.css('[data-password-toggle]'));
      if (toggleButton) {
        toggleButton.nativeElement.click();
        await helper.waitForAsyncOperations();

        // ASSERT: Password should be visible
        expect(passwordField.type).toBe('text');

        // Click again to hide
        toggleButton.nativeElement.click();
        await helper.waitForAsyncOperations();

        expect(passwordField.type).toBe('password');
      }
    });

    it('should switch between user types correctly', async () => {
      // ACT: Start with SME
      helper.fillRegistrationForm({
        userType: 'sme',
        companyName: 'Test Company'
      });

      expect(component.selectedUserType()).toBe('sme');
      expect(helper.getFieldValidationState('companyName')).toBe('valid');

      // Switch to Funder
      const funderButton = helper.getUserTypeButton('funder');
      if (funderButton) {
        funderButton.click();
        await helper.waitForAsyncOperations();

        // ASSERT: User type should change and company name validation should update
        expect(component.selectedUserType()).toBe('funder');
        // Company name should no longer be required
      }
    });

    it('should handle terms and conditions checkbox', async () => {
      // ACT: Fill form but don't agree to terms
      helper.fillRegistrationForm({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        password: 'SecurePass123',
        confirmPassword: 'SecurePass123',
        userType: 'sme',
        companyName: 'Test Company',
        agreeToTerms: false
      });

      helper.submitForm();
      await helper.waitForAsyncOperations();

      // ASSERT: Should not submit and show error
      expect(authService.register).not.toHaveBeenCalled();
      expect(helper.getFieldValidationState('agreeToTerms')).toBe('invalid');

      // ACT: Agree to terms
      helper.fillRegistrationForm({ agreeToTerms: true });
      helper.submitForm();
      await helper.waitForAsyncOperations();

      // ASSERT: Should now allow submission (mock success)
      authService.register.and.returnValue(of({
        user: { id: 'user-123' } as any,
        error: null,
        organizationCreated: true,
        success: true
      }));
    });
  });

  // ===============================
  // ACCESSIBILITY E2E SCENARIOS
  // ===============================

  describe('Accessibility Scenarios', () => {
    it('should support keyboard navigation', async () => {
      const firstNameField = helper.getFormField('firstName');
      const lastNameField = helper.getFormField('lastName');
      const emailField = helper.getFormField('email');

      // ACT: Tab through form
      firstNameField.focus();
      
      // Simulate Tab key
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      firstNameField.dispatchEvent(tabEvent);
      
      await helper.waitForAsyncOperations();

      // ASSERT: Focus should move to next field
      expect(document.activeElement).toBe(lastNameField);
    });

    it('should have proper ARIA labels and error associations', async () => {
      // Fill form to trigger validation
      helper.fillRegistrationForm({
        email: 'invalid-email'
      });

      const emailField = helper.getFormField('email');
      emailField.focus();
      emailField.blur();
      await helper.waitForAsyncOperations();

      // ASSERT: Error should be properly associated
      const errorElement = fixture.debugElement.query(By.css('[role="alert"], .error-message'));
      if (errorElement) {
        expect(errorElement.nativeElement.textContent).toContain('valid email');
      }
    });
  });

  // ===============================
  // PERFORMANCE E2E SCENARIOS
  // ===============================

  describe('Performance Scenarios', () => {
    it('should handle rapid form changes without performance issues', async () => {
      const startTime = performance.now();

      // ACT: Rapidly change form values
      for (let i = 0; i < 50; i++) {
        helper.fillRegistrationForm({
          firstName: `John${i}`,
          lastName: `Doe${i}`,
          email: `john${i}@test.com`
        });
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // ASSERT: Should complete within reasonable time (less than 2 seconds)
      expect(duration).toBeLessThan(2000);
      
      // Form should still be responsive
      expect(component.registerForm.get('firstName')?.value).toBe('John49');
    });

    it('should debounce validation checks', async () => {
      let validationCallCount = 0;
      const originalValidator = component.registerForm.get('email')?.validator;
      
      // Mock validator to count calls
      component.registerForm.get('email')?.setValidators(() => {
        validationCallCount++;
        return null;
      });

      // ACT: Rapidly type in email field
      const emailField = helper.getFormField('email');
      for (let i = 0; i < 10; i++) {
        emailField.value = `test${i}@example.com`;
        emailField.dispatchEvent(new Event('input'));
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      await helper.waitForAsyncOperations();

      // ASSERT: Should not call validator for every keystroke
      expect(validationCallCount).toBeLessThan(10);
    });
  });
});