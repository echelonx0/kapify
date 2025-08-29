// // src/app/auth/register.component.ts  

// import { Component, signal, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
// import { Router, RouterModule, ActivatedRoute } from '@angular/router';
// import { LucideAngularModule, Eye, EyeOff, ArrowRight, Users, Building, Check } from 'lucide-angular';
// import { AuthService, RegisterRequest } from '../production.auth.service';
 

// @Component({
//   selector: 'app-register',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     RouterModule,
//     LucideAngularModule
//   ],
//   templateUrl: './register.component.html',
// })
// export class RegisterComponent {
//   private authService = inject(AuthService);
//   private fb = inject(FormBuilder);
//   private router = inject(Router);
//   private route = inject(ActivatedRoute);

//   registerForm: FormGroup;
//   selectedUserType = signal<'sme' | 'funder'>('sme');
//   showPassword = signal(false);
//   showConfirmPassword = signal(false);
//   error = signal<string | null>(null);

//   // Icons
//   EyeIcon = Eye;
//   EyeOffIcon = EyeOff;
//   ArrowRightIcon = ArrowRight;
//   UsersIcon = Users;
//   BuildingIcon = Building;
//   CheckIcon = Check;

//   // Use computed for reactive loading state
//   isLoading = this.authService.isLoading;

//   constructor() {
//     this.registerForm = this.fb.group({
//       firstName: ['', [Validators.required]],
//       lastName: ['', [Validators.required]],
//       email: ['', [Validators.required, Validators.email]],
//       phone: ['', [Validators.required]],
//       companyName: [''],
//       password: ['', [Validators.required, Validators.minLength(8)]],
//       confirmPassword: ['', [Validators.required]],
//       userType: ['sme'],
//       agreeToTerms: [false, [Validators.requiredTrue]]
//     }, { validators: this.passwordMatchValidator });

//     // Handle query params for user type
//     this.route.queryParams.subscribe(params => {
//       if (params['userType'] === 'funder') {
//         this.selectedUserType.set('funder');
//         this.registerForm.patchValue({ userType: 'funder' });
//       }
//     });

//     this.updateCompanyNameValidation();
//   }

//   private updateCompanyNameValidation() {
//     const companyNameControl = this.registerForm.get('companyName');
    
//     const updateValidation = () => {
//       if (this.selectedUserType() === 'sme') {
//         companyNameControl?.setValidators([Validators.required]);
//       } else {
//         companyNameControl?.clearValidators();
//       }
//       companyNameControl?.updateValueAndValidity();
//     };

//     updateValidation();
//   }

//   passwordMatchValidator(control: AbstractControl) {
//     const password = control.get('password');
//     const confirmPassword = control.get('confirmPassword');
    
//     if (password && confirmPassword && password.value !== confirmPassword.value) {
//       confirmPassword.setErrors({ passwordMismatch: true });
//       return { passwordMismatch: true };
//     }
    
//     return null;
//   }

//   selectUserType(type: 'sme' | 'funder') {
//     this.selectedUserType.set(type);
//     this.registerForm.patchValue({ userType: type });
//     this.updateCompanyNameValidation();
//   }

//   getUserTypeButtonClasses(type: 'sme' | 'funder'): string {
//     const baseClasses = 'p-4 border-2 rounded-lg text-center transition-all duration-200 hover:border-primary-300';
//     const selectedClasses = 'border-primary-500 bg-primary-50 text-primary-700';
//     const unselectedClasses = 'border-neutral-300 text-neutral-700';
    
//     return `${baseClasses} ${this.selectedUserType() === type ? selectedClasses : unselectedClasses}`;
//   }

//   getInputClasses(fieldName: string): string {
//     const field = this.registerForm.get(fieldName);
//     const hasError = field?.errors && field?.touched;
    
//     const baseClasses = 'w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
//     const normalClasses = 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500';
//     const errorClasses = 'border-red-300 focus:border-red-500 focus:ring-red-500';
    
//     return `${baseClasses} ${hasError ? errorClasses : normalClasses}`;
//   }

//   getCheckboxClasses(): string {
//     const isChecked = this.registerForm.get('agreeToTerms')?.value;
//     const hasError = this.registerForm.get('agreeToTerms')?.errors && this.registerForm.get('agreeToTerms')?.touched;
    
//     if (hasError) {
//       return 'border-red-300 bg-white';
//     }
    
//     return isChecked ? 'border-primary-500 bg-primary-500' : 'border-neutral-300 bg-white hover:border-primary-300';
//   }

//   togglePasswordVisibility() {
//     this.showPassword.set(!this.showPassword());
//   }

//   toggleConfirmPasswordVisibility() {
//     this.showConfirmPassword.set(!this.showConfirmPassword());
//   }

//   getFieldError(fieldName: string): string | undefined {
//     const field = this.registerForm.get(fieldName);
//     if (field?.errors && field?.touched) {
//       if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
//       if (field.errors['email']) return 'Please enter a valid email address';
//       if (field.errors['minlength']) return `Password must be at least 8 characters`;
//       if (field.errors['passwordMismatch']) return 'Passwords do not match';
//       if (field.errors['requiredTrue']) return 'Please agree to the terms and conditions';
//     }
//     return undefined;
//   }

//   private getFieldDisplayName(fieldName: string): string {
//     const displayNames: { [key: string]: string } = {
//       firstName: 'First name',
//       lastName: 'Last name',
//       email: 'Email',
//       phone: 'Phone number',
//       companyName: 'Company name',
//       password: 'Password',
//       confirmPassword: 'Confirm password'
//     };
//     return displayNames[fieldName] || fieldName;
//   }

//   onSubmit(): void {
//     if (this.registerForm.valid) {
//       this.error.set(null);
      
//       const formData = this.registerForm.value;
//       const registerData: RegisterRequest = {
//         firstName: formData.firstName,
//         lastName: formData.lastName,
//         email: formData.email,
//         phone: formData.phone,
//         password: formData.password,
//         confirmPassword: formData.confirmPassword,
//         userType: this.selectedUserType(),
//         companyName: formData.companyName,
//         agreeToTerms: formData.agreeToTerms
//       };
      
//       // FIX: Use the correct method name
//       this.authService.register(registerData).subscribe({
//         next: (response) => {
//           if (response.user) {
//             console.log('✅ Registration successful:', response.user);
//             this.router.navigate(['/dashboard']);
//           } else {
//             this.error.set(response.error || 'Registration failed. Please try again.');
//           }
//         },
//         error: (err) => {
//           console.error('❌ Registration error:', err);
//           this.error.set(err.error || err.message || 'Registration failed. Please try again.');
//         }
//       });
//     }
//   }
// }

// src/app/auth/register.component.ts - UPDATED FOR ENHANCED AUTH SERVICE

import { Component, signal, inject, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Eye, EyeOff, ArrowRight, Users, Building, Check, AlertCircle, Loader } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { AuthService, RegisterRequest } from '../production.auth.service';

 

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnDestroy {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  registerForm!: FormGroup;
  selectedUserType = signal<'sme' | 'funder'>('sme');
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  
  private subscriptions = new Subscription();

  // Icons
  EyeIcon = Eye;
  EyeOffIcon = EyeOff;
  ArrowRightIcon = ArrowRight;
  UsersIcon = Users;
  BuildingIcon = Building;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;
  LoaderIcon = Loader;

  // Reactive loading states from enhanced auth service
  isInitializing = this.authService.isInitializing;
  isRegistering = this.authService.isRegistering;
  isLoading = this.authService.isLoading;

  // Computed states for UI
  canSubmit = computed(() => {
    return this.registerForm?.valid && 
           !this.isLoading() && 
           !this.isRegistering();
  });

  submitButtonText = computed(() => {
    if (this.isRegistering()) {
      return 'Creating Account...';
    }
    if (this.isLoading()) {
      return 'Loading...';
    }
    return 'Create Account';
  });

  constructor() {
    this.initializeForm();
    this.setupRouteSubscription();
    this.updateCompanyNameValidation();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, this.nameValidator]],
      lastName: ['', [Validators.required, this.nameValidator]],
      email: ['', [Validators.required, Validators.email, this.emailValidator]],
      phone: ['', [Validators.required, this.phoneValidator]],
      companyName: [''],
      password: ['', [Validators.required, this.passwordValidator]],
      confirmPassword: ['', [Validators.required]],
      userType: ['sme'],
      agreeToTerms: [false, [Validators.requiredTrue]]
    }, { 
      validators: [this.passwordMatchValidator, this.termsValidator],
      updateOn: 'change'
    });
  }

  private setupRouteSubscription(): void {
    const routeSubscription = this.route.queryParams.subscribe(params => {
      if (params['userType'] === 'funder') {
        this.selectedUserType.set('funder');
        this.registerForm.patchValue({ userType: 'funder' });
        this.updateCompanyNameValidation();
      }
    });
    
    this.subscriptions.add(routeSubscription);
  }

  // ===============================
  // CUSTOM VALIDATORS
  // ===============================

  private nameValidator(control: AbstractControl) {
    if (!control.value) return null;
    
    const name = control.value.trim();
    if (name.length < 2) {
      return { tooShort: true };
    }
    if (name.length > 50) {
      return { tooLong: true };
    }
    if (!/^[a-zA-Z\s\-'\.]+$/.test(name)) {
      return { invalidCharacters: true };
    }
    return null;
  }

  private emailValidator(control: AbstractControl) {
    if (!control.value) return null;
    
    const email = control.value.toLowerCase().trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
      return { invalidFormat: true };
    }
    
    // Additional business email validation for funders
    if (this.selectedUserType() === 'funder') {
      const commonPersonalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
      const domain = email.split('@')[1];
      if (commonPersonalDomains.includes(domain)) {
        return { personalEmailForBusiness: true };
      }
    }
    
    return null;
  }

  private phoneValidator(control: AbstractControl) {
    if (!control.value) return null;
    
    const phone = control.value.replace(/\s+/g, '');
    // South African phone number validation
    if (!/^(\+27|0)[0-9]{9}$/.test(phone)) {
      return { invalidPhone: true };
    }
    return null;
  }

  private passwordValidator(control: AbstractControl) {
    if (!control.value) return null;
    
    const password = control.value;
    const errors: any = {};
    
    if (password.length < 8) {
      errors.tooShort = true;
    }
    if (password.length > 128) {
      errors.tooLong = true;
    }
    if (!/[a-z]/.test(password)) {
      errors.noLowercase = true;
    }
    if (!/[A-Z]/.test(password)) {
      errors.noUppercase = true;
    }
    if (!/[0-9]/.test(password)) {
      errors.noNumber = true;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.noSpecialChar = true;
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  }

  private passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
      return { passwordMismatch: true };
    } else if (confirmPassword?.errors?.['passwordMismatch']) {
      // Clear password mismatch error if passwords now match
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  private termsValidator(control: AbstractControl) {
    const agreeToTerms = control.get('agreeToTerms');
    if (agreeToTerms && !agreeToTerms.value) {
      return { termsNotAccepted: true };
    }
    return null;
  }

  // ===============================
  // FORM INTERACTION METHODS
  // ===============================

  selectUserType(type: 'sme' | 'funder'): void {
    this.selectedUserType.set(type);
    this.registerForm.patchValue({ userType: type });
    this.updateCompanyNameValidation();
    this.clearErrors();
  }

  private updateCompanyNameValidation(): void {
    const companyNameControl = this.registerForm.get('companyName');
    
    if (this.selectedUserType() === 'sme') {
      companyNameControl?.setValidators([Validators.required, this.companyNameValidator]);
    } else {
      companyNameControl?.clearValidators();
    }
    companyNameControl?.updateValueAndValidity();
  }

  private companyNameValidator(control: AbstractControl) {
    if (!control.value) return null;
    
    const name = control.value.trim();
    if (name.length < 2) {
      return { tooShort: true };
    }
    if (name.length > 100) {
      return { tooLong: true };
    }
    return null;
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  // ===============================
  // FORM SUBMISSION
  // ===============================

  onSubmit(): void {
    if (!this.canSubmit()) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.clearMessages();
    
    const formData = this.registerForm.value;
    const registerData: RegisterRequest = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.toLowerCase().trim(),
      phone: formData.phone,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      userType: this.selectedUserType(),
      companyName: formData.companyName?.trim() || undefined,
      agreeToTerms: formData.agreeToTerms
    };

    console.log('Submitting registration for:', registerData.email);

    const registrationSubscription = this.authService.register(registerData).subscribe({
      next: (response) => {
        console.log('Registration response received:', response);
        
        if (response.user) {
          this.success.set('Account created successfully! Redirecting...');
          console.log('Registration successful, navigating to dashboard');
          
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        } else {
          this.error.set(response.error || 'Registration failed. Please try again.');
        }
      },
      error: (err) => {
        console.error('Registration error:', err);
        
        let errorMessage = 'Registration failed. Please try again.';
        
        if (err.error) {
          errorMessage = err.error;
        } else if (err.message) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        
        this.error.set(errorMessage);
        
        // Re-enable form for user to try again
        this.registerForm.enable();
      }
    });

    this.subscriptions.add(registrationSubscription);
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }

  private clearMessages(): void {
    this.error.set(null);
    this.success.set(null);
  }

  private clearErrors(): void {
    this.error.set(null);
  }

  // ===============================
  // UI HELPER METHODS
  // ===============================

  getUserTypeButtonClasses(type: 'sme' | 'funder'): string {
    const baseClasses = 'p-4 border-2 rounded-lg text-center transition-all duration-200 hover:border-primary-300 cursor-pointer';
    const selectedClasses = 'border-primary-500 bg-primary-50 text-primary-700 ring-2 ring-primary-200';
    const unselectedClasses = 'border-neutral-300 text-neutral-700 hover:bg-neutral-50';
    
    return `${baseClasses} ${this.selectedUserType() === type ? selectedClasses : unselectedClasses}`;
  }

  getInputClasses(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    const hasError = field?.errors && field?.touched;
    const isValid = !field?.errors && field?.touched && field?.value;
    
    const baseClasses = 'w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
    const normalClasses = 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500';
    const errorClasses = 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50';
    const validClasses = 'border-green-300 focus:border-green-500 focus:ring-green-500 bg-green-50';
    
    if (hasError) return `${baseClasses} ${errorClasses}`;
    if (isValid) return `${baseClasses} ${validClasses}`;
    return `${baseClasses} ${normalClasses}`;
  }

  getCheckboxClasses(): string {
    const field = this.registerForm.get('agreeToTerms');
    const hasError = field?.errors && field?.touched;
    const isChecked = field?.value;
    
    const baseClasses = 'h-5 w-5 rounded border-2 transition-all duration-200 focus:ring-2 focus:ring-offset-0';
    
    if (hasError) {
      return `${baseClasses} border-red-300 bg-red-50 focus:ring-red-500`;
    }
    
    if (isChecked) {
      return `${baseClasses} border-primary-500 bg-primary-500 text-white focus:ring-primary-500`;
    }
    
    return `${baseClasses} border-neutral-300 bg-white hover:border-primary-300 focus:ring-primary-500`;
  }

  getSubmitButtonClasses(): string {
    const baseClasses = 'w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
    const loadingClasses = 'bg-primary-300 text-primary-800 cursor-not-allowed';
    const disabledClasses = 'bg-neutral-300 text-neutral-500 cursor-not-allowed';
    const enabledClasses = 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 transform hover:scale-[1.02]';
    
    if (this.isLoading() || this.isRegistering()) {
      return `${baseClasses} ${loadingClasses}`;
    }
    
    if (!this.canSubmit()) {
      return `${baseClasses} ${disabledClasses}`;
    }
    
    return `${baseClasses} ${enabledClasses}`;
  }

  // ===============================
  // ERROR MESSAGE HELPERS
  // ===============================

  getFieldError(fieldName: string): string | undefined {
    const field = this.registerForm.get(fieldName);
    if (!field?.errors || !field?.touched) return undefined;

    const errors = field.errors;
    
    // Custom error messages for better UX
    if (errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
    if (errors['email'] || errors['invalidFormat']) return 'Please enter a valid email address';
    if (errors['personalEmailForBusiness']) return 'Please use a business email address for funder registration';
    if (errors['invalidPhone']) return 'Please enter a valid South African phone number';
    if (errors['tooShort'] && fieldName === 'password') return 'Password must be at least 8 characters long';
    if (errors['tooShort']) return `${this.getFieldDisplayName(fieldName)} is too short`;
    if (errors['tooLong']) return `${this.getFieldDisplayName(fieldName)} is too long`;
    if (errors['invalidCharacters']) return 'Only letters, spaces, hyphens, apostrophes, and periods are allowed';
    if (errors['noLowercase']) return 'Password must contain at least one lowercase letter';
    if (errors['noUppercase']) return 'Password must contain at least one uppercase letter';
    if (errors['noNumber']) return 'Password must contain at least one number';
    if (errors['noSpecialChar']) return 'Password must contain at least one special character';
    if (errors['passwordMismatch']) return 'Passwords do not match';
    if (errors['requiredTrue']) return 'Please agree to the terms and conditions';

    return 'Please check this field';
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email address',
      phone: 'Phone number',
      companyName: 'Company name',
      password: 'Password',
      confirmPassword: 'Password confirmation'
    };
    return displayNames[fieldName] || fieldName;
  }

  getPasswordStrengthIndicator(): { strength: number; label: string; color: string } {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;
    
    const indicators = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Very Weak', color: 'text-red-600' },
      { strength: 2, label: 'Weak', color: 'text-orange-600' },
      { strength: 3, label: 'Fair', color: 'text-yellow-600' },
      { strength: 4, label: 'Good', color: 'text-blue-600' },
      { strength: 5, label: 'Strong', color: 'text-green-600' }
    ];
    
    return indicators[strength];
  }
}