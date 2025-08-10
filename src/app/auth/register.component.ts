 

// src/app/auth/register.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Eye, EyeOff, ArrowRight, Users, Building, Check } from 'lucide-angular';
import { AuthService, RegisterRequest } from './auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule
  ],
  template: `
    <div class="min-h-screen flex">
      <!-- Left Panel - Form -->
      <div class="flex-1 flex items-center justify-center px-8 py-12 bg-white">
        <div class="w-full max-w-md">
          <!-- Logo -->
          <div class="mb-10">
            <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center mb-8">
              <span class="text-white font-bold text-lg">K</span>
            </div>
            <h1 class="text-3xl font-bold text-neutral-900 mb-2">Join Kapify</h1>
            <p class="text-neutral-600">Create your account and start your funding journey</p>
          </div>

          <!-- Form -->
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
                  <lucide-icon [img]="BuildingIcon" [size]="20" class="mb-2 mx-auto" />
                  <div class="font-medium text-sm">SME Owner</div>
                  <div class="text-xs opacity-75 mt-1">Looking for funding</div>
                </button>
                <button
                  type="button"
                  [class]="getUserTypeButtonClasses('funder')"
                  (click)="selectUserType('funder')"
                >
                  <lucide-icon [img]="UsersIcon" [size]="20" class="mb-2 mx-auto" />
                  <div class="font-medium text-sm">Investor</div>
                  <div class="text-xs opacity-75 mt-1">Providing funding</div>
                </button>
              </div>
            </div>

            <!-- Name Fields -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">First name</label>
                <input
                  type="text"
                  formControlName="firstName"
                  placeholder="John"
                  [class]="getInputClasses('firstName')"
                />
                @if (getFieldError('firstName')) {
                  <p class="mt-1 text-sm text-red-600">{{ getFieldError('firstName') }}</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">Last name</label>
                <input
                  type="text"
                  formControlName="lastName"
                  placeholder="Doe"
                  [class]="getInputClasses('lastName')"
                />
                @if (getFieldError('lastName')) {
                  <p class="mt-1 text-sm text-red-600">{{ getFieldError('lastName') }}</p>
                }
              </div>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">Email address</label>
              <input
                type="email"
                formControlName="email"
                placeholder="john@company.co.za"
                [class]="getInputClasses('email')"
              />
              @if (getFieldError('email')) {
                <p class="mt-1 text-sm text-red-600">{{ getFieldError('email') }}</p>
              }
            </div>

            <!-- Phone -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">Phone number</label>
              <input
                type="tel"
                formControlName="phone"
                placeholder="+27 81 123 4567"
                [class]="getInputClasses('phone')"
              />
              @if (getFieldError('phone')) {
                <p class="mt-1 text-sm text-red-600">{{ getFieldError('phone') }}</p>
              }
            </div>

            <!-- Company Name (SME only) -->
            @if (selectedUserType() === 'sme') {
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">Company name</label>
                <input
                  type="text"
                  formControlName="companyName"
                  placeholder="Your Company (Pty) Ltd"
                  [class]="getInputClasses('companyName')"
                />
                @if (getFieldError('companyName')) {
                  <p class="mt-1 text-sm text-red-600">{{ getFieldError('companyName') }}</p>
                }
              </div>
            }

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">Password</label>
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Create a strong password"
                  [class]="getInputClasses('password')"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  (click)="togglePasswordVisibility()"
                >
                  <lucide-icon [img]="showPassword() ? EyeOffIcon : EyeIcon" [size]="20" />
                </button>
              </div>
              @if (getFieldError('password')) {
                <p class="mt-1 text-sm text-red-600">{{ getFieldError('password') }}</p>
              }
              <p class="mt-1 text-sm text-neutral-500">Must be at least 8 characters</p>
            </div>

            <!-- Confirm Password -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">Confirm password</label>
              <div class="relative">
                <input
                  [type]="showConfirmPassword() ? 'text' : 'password'"
                  formControlName="confirmPassword"
                  placeholder="Confirm your password"
                  [class]="getInputClasses('confirmPassword')"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  (click)="toggleConfirmPasswordVisibility()"
                >
                  <lucide-icon [img]="showConfirmPassword() ? EyeOffIcon : EyeIcon" [size]="20" />
                </button>
              </div>
              @if (getFieldError('confirmPassword')) {
                <p class="mt-1 text-sm text-red-600">{{ getFieldError('confirmPassword') }}</p>
              }
            </div>

            <!-- Terms Agreement -->
            <div class="flex items-start space-x-3">
              <div class="relative">
                <input
                  type="checkbox"
                  formControlName="agreeToTerms"
                  class="sr-only"
                  id="agreeToTerms"
                />
                <label
                  for="agreeToTerms"
                  [class]="getCheckboxClasses()"
                  class="w-5 h-5 border-2 rounded flex items-center justify-center cursor-pointer transition-all"
                >
                  @if (registerForm.get('agreeToTerms')?.value) {
                    <lucide-icon [img]="CheckIcon" [size]="14" class="text-white" />
                  }
                </label>
              </div>
              <div class="text-sm text-neutral-600">
                I agree to the 
                <a href="/terms" class="text-primary-600 hover:text-primary-700 font-medium">Terms of Service</a>
                and 
                <a href="/privacy" class="text-primary-600 hover:text-primary-700 font-medium">Privacy Policy</a>
              </div>
            </div>

            <!-- Error Message -->
            @if (error()) {
              <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {{ error() }}
              </div>
            }

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="registerForm.invalid || isLoading()"
              class="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center"
            >
              @if (isLoading()) {
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span class="ml-2">Creating account...</span>
              } @else {
                <span>Create account</span>
                <lucide-icon [img]="ArrowRightIcon" [size]="20" class="ml-2" />
              }
            </button>
          </form>

          <!-- Login Link -->
          <div class="mt-8 text-center">
            <p class="text-neutral-600">
              Already have an account? 
              <a 
                routerLink="/login"
                class="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>

      <!-- Right Panel - Image -->
      <div class="hidden lg:block flex-1 relative overflow-hidden">
        <img 
          src="/images/auth.png" 
          alt="Join Kapify illustration"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <!-- Optional overlay for better text contrast if needed -->
        <div class="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-primary-500/5"></div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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
  CheckIcon = Check;

  // Use computed for reactive loading state
  isLoading = this.authService.isLoading;

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      companyName: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      userType: ['sme'],
      agreeToTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordMatchValidator });

    // Handle query params for user type
    this.route.queryParams.subscribe(params => {
      if (params['userType'] === 'funder') {
        this.selectedUserType.set('funder');
        this.registerForm.patchValue({ userType: 'funder' });
      }
    });

    this.updateCompanyNameValidation();
  }

  private updateCompanyNameValidation() {
    const companyNameControl = this.registerForm.get('companyName');
    
    const updateValidation = () => {
      if (this.selectedUserType() === 'sme') {
        companyNameControl?.setValidators([Validators.required]);
      } else {
        companyNameControl?.clearValidators();
      }
      companyNameControl?.updateValueAndValidity();
    };

    updateValidation();
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
    this.registerForm.patchValue({ userType: type });
    this.updateCompanyNameValidation();
  }

  getUserTypeButtonClasses(type: 'sme' | 'funder'): string {
    const baseClasses = 'p-4 border-2 rounded-lg text-center transition-all duration-200 hover:border-primary-300';
    const selectedClasses = 'border-primary-500 bg-primary-50 text-primary-700';
    const unselectedClasses = 'border-neutral-300 text-neutral-700';
    
    return `${baseClasses} ${this.selectedUserType() === type ? selectedClasses : unselectedClasses}`;
  }

  getInputClasses(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    const hasError = field?.errors && field?.touched;
    
    const baseClasses = 'w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
    const normalClasses = 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500';
    const errorClasses = 'border-red-300 focus:border-red-500 focus:ring-red-500';
    
    return `${baseClasses} ${hasError ? errorClasses : normalClasses}`;
  }

  getCheckboxClasses(): string {
    const isChecked = this.registerForm.get('agreeToTerms')?.value;
    const hasError = this.registerForm.get('agreeToTerms')?.errors && this.registerForm.get('agreeToTerms')?.touched;
    
    if (hasError) {
      return 'border-red-300 bg-white';
    }
    
    return isChecked ? 'border-primary-500 bg-primary-500' : 'border-neutral-300 bg-white hover:border-primary-300';
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
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `Password must be at least 8 characters`;
      if (field.errors['passwordMismatch']) return 'Passwords do not match';
      if (field.errors['requiredTrue']) return 'Please agree to the terms and conditions';
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

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.error.set(null);
      
      const formData = this.registerForm.value;
      const registerData: RegisterRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        userType: this.selectedUserType(),
        companyName: formData.companyName,
        agreeToTerms: formData.agreeToTerms
      };
      
      this.authService.register(registerData).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.error.set(err.error?.error || 'Registration failed. Please try again.');
        }
      });
    }
  }

  
}