// src/app/auth/register.component.ts - KEEP YOUR DESIGN, FIX TYPESCRIPT

import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { LucideAngularModule, Eye, EyeOff, ArrowRight, Users, Building, Check } from 'lucide-angular';
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
      
      // FIX: Use the correct method name
      this.authService.register(registerData).subscribe({
        next: (response) => {
          if (response.user) {
            console.log('✅ Registration successful:', response.user);
            this.router.navigate(['/dashboard']);
          } else {
            this.error.set(response.error || 'Registration failed. Please try again.');
          }
        },
        error: (err) => {
          console.error('❌ Registration error:', err);
          this.error.set(err.error || err.message || 'Registration failed. Please try again.');
        }
      });
    }
  }
}