// src/app/auth/register.component.ts
import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Eye, EyeOff, ArrowRight, Users, Building } from 'lucide-angular';
import { 
  UiButtonComponent, 
  UiInputComponent, 
  UiCardComponent 
} from '../shared/components';
import { AuthService, RegisterData } from './auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    UiButtonComponent,
    UiInputComponent,
    UiCardComponent
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4 py-8">
      <div class="w-full max-w-md">
        <!-- Logo & Header -->
        <div class="text-center mb-8">
          <div class="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span class="text-white font-bold text-xl">K</span>
          </div>
          <h1 class="text-2xl font-bold text-neutral-900">Get started with Kapify</h1>
          <p class="text-neutral-600 mt-2">Create your account and start your funding journey</p>
        </div>

        <ui-card>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- User Type Selection -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-3">I am a</label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  [class]="getUserTypeButtonClasses('sme')"
                  (click)="selectUserType('sme')"
                >
                  <lucide-icon [img]="BuildingIcon" [size]="20" class="mb-2" />
                  <div class="font-medium">SME Owner</div>
                  <div class="text-xs opacity-75">Looking for funding</div>
                </button>
                <button
                  type="button"
                  [class]="getUserTypeButtonClasses('funder')"
                  (click)="selectUserType('funder')"
                >
                  <lucide-icon [img]="UsersIcon" [size]="20" class="mb-2" />
                  <div class="font-medium">Investor</div>
                  <div class="text-xs opacity-75">Providing funding</div>
                </button>
              </div>
            </div>

            <!-- Name Fields -->
            <div class="grid grid-cols-2 gap-4">
              <ui-input
                label="First name"
                placeholder="John"
                [error]="getFieldError('firstName')"
                formControlName="firstName"
                [required]="true"
              />
              <ui-input
                label="Last name"
                placeholder="Doe"
                [error]="getFieldError('lastName')"
                formControlName="lastName"
                [required]="true"
              />
            </div>

            <!-- Email -->
            <ui-input
              label="Email address"
              type="email"
              placeholder="john@company.co.za"
              [error]="getFieldError('email')"
              formControlName="email"
              [required]="true"
            />

            <!-- Phone -->
            <ui-input
              label="Phone number"
              type="tel"
              placeholder="+27 81 123 4567"
              [error]="getFieldError('phone')"
              formControlName="phone"
              [required]="true"
            />

            <!-- Company Name (SME only) -->
            @if (selectedUserType() === 'sme') {
              <ui-input
                label="Company name"
                placeholder="Your Company (Pty) Ltd"
                [error]="getFieldError('companyName')"
                formControlName="companyName"
                [required]="true"
              />
            }

            <!-- Password -->
            <div class="relative">
              <ui-input
                label="Password"
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="Create a strong password"
                [error]="getFieldError('password')"
                formControlName="password"
                [required]="true"
                hint="Must be at least 8 characters"
              />
              <button
                type="button"
                class="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600"
                (click)="togglePasswordVisibility()"
              >
                <lucide-icon [img]="showPassword() ? EyeOffIcon : EyeIcon" [size]="20" />
              </button>
            </div>

            <!-- Confirm Password -->
            <div class="relative">
              <ui-input
                label="Confirm password"
                [type]="showConfirmPassword() ? 'text' : 'password'"
                placeholder="Confirm your password"
                [error]="getFieldError('confirmPassword')"
                formControlName="confirmPassword"
                [required]="true"
              />
              <button
                type="button"
                class="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600"
                (click)="toggleConfirmPasswordVisibility()"
              >
                <lucide-icon [img]="showConfirmPassword() ? EyeOffIcon : EyeIcon" [size]="20" />
              </button>
            </div>

            <!-- Terms Agreement -->
            <div class="flex items-start space-x-3">
              <input
                type="checkbox"
                formControlName="agreeToTerms"
                class="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 mt-0.5"
              >
              <div class="text-sm text-neutral-600">
                I agree to the 
                <a href="/terms" class="text-primary-600 hover:underline">Terms of Service</a>
                and 
                <a href="/privacy" class="text-primary-600 hover:underline">Privacy Policy</a>
              </div>
            </div>

            <!-- Error Message -->
            @if (error()) {
              <div class="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">
                {{ error() }}
              </div>
            }

            <!-- Submit Button -->
            <ui-button
              variant="primary"
              size="lg"
              [fullWidth]="true"
              [disabled]="registerForm.invalid || isLoading"
              type="submit"
            >
              @if (isLoading) {
                <span>Creating account...</span>
              } @else {
                <span>Create account</span>
                <lucide-icon [img]="ArrowRightIcon" [size]="20" class="ml-2" />
              }
            </ui-button>
          </form>

          <!-- Divider -->
          <div class="mt-6 relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-neutral-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="bg-white px-2 text-neutral-500">Already have an account?</span>
            </div>
          </div>

          <!-- Login Link -->
          <div class="mt-6 text-center">
            <ui-button variant="outline" [fullWidth]="true" (clicked)="goToLogin()">
              Sign in instead
            </ui-button>
          </div>
        </ui-card>

        <!-- Footer -->
        <div class="mt-8 text-center text-xs text-neutral-500">
          By creating an account, you agree to our terms and privacy policy
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  registerForm: FormGroup;
  selectedUserType = signal<'sme' | 'funder'>('sme');
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  error = signal<string | null>(null);

  // Icons
  EyeIcon = Eye;
  EyeOffIcon = EyeOff;
  ArrowRightIcon = ArrowRight;
  UsersIcon = Users;
  BuildingIcon = Building;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      companyName: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      agreeToTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });

    // Handle query params for user type from landing page
    this.route.queryParams.subscribe(params => {
      if (params['userType'] === 'funder') {
        this.selectedUserType.set('funder');
      }
    });

    // Watch for user type changes and update company name validation
    this.updateCompanyNameValidation();
  }

  get isLoading() {
    return this.authService.isLoading();
  }

  private updateCompanyNameValidation() {
    // Use effect to watch for user type changes
    const companyNameControl = this.registerForm.get('companyName');
    
    // Set up a manual subscription to the signal
    const updateValidation = () => {
      if (this.selectedUserType() === 'sme') {
        companyNameControl?.setValidators([Validators.required]);
      } else {
        companyNameControl?.clearValidators();
      }
      companyNameControl?.updateValueAndValidity();
    };

    // Initial validation setup
    updateValidation();
    
    // Note: In a real app, you might want to use Angular's effect() from @angular/core
    // For now, we'll rely on the template reactivity
  }

  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  selectUserType(type: 'sme' | 'funder') {
    this.selectedUserType.set(type);
  }

  getUserTypeButtonClasses(type: 'sme' | 'funder'): string {
    const baseClasses = 'p-4 border rounded-lg text-center transition-all hover:border-primary-300';
    const selectedClasses = 'border-primary-500 bg-primary-50 text-primary-700';
    const unselectedClasses = 'border-neutral-300 text-neutral-700';
    
    return `${baseClasses} ${this.selectedUserType() === type ? selectedClasses : unselectedClasses}`;
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  getFieldError(fieldName: string): string | undefined {
    const field = this.registerForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `Password must be at least 8 characters`;
      if (field.errors['passwordMismatch']) return 'Passwords do not match';
      if (field.errors['requiredTrue']) return 'Please agree to the terms';
    }
    return undefined;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone number',
      companyName: 'Company name',
      password: 'Password',
      confirmPassword: 'Confirm password'
    };
    return displayNames[fieldName] || fieldName;
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      this.error.set(null);
      
      const formData = this.registerForm.value;
      const registerData: RegisterData = {
        ...formData,
        userType: this.selectedUserType()
      };
      
      const result = await this.authService.register(registerData);
      
      if (result.success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set(result.error || 'Registration failed');
      }
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}