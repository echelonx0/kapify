import {
  Component,
  signal,
  inject,
  computed,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Eye, LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/production.auth.service';
import { RegisterRequest } from '../models/auth.models';
import { WelcomeEmailService } from '../services/welcome-email.service';
import { ToastService } from 'src/app/shared/services/toast.service';

interface Slide {
  image: string;
  title?: string;
  subtitle?: string;
  id?: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: './register.component.html',
})
export class RegisterComponent implements OnDestroy {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private welcomeEmailService = inject(WelcomeEmailService);
  private toastService = inject(ToastService);
  @ViewChild('termsCheckbox') termsCheckboxRef?: ElementRef<HTMLInputElement>;

  registerForm!: FormGroup;
  selectedUserType = signal<'sme' | 'funder'>('sme');
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  Eye = Eye;

  // Multi-step form
  currentStep = signal<1 | 2>(1);

  private subscriptions = new Subscription();
  slides = signal<Slide[]>([
    {
      image: '/images/auth-3.png',
      title: 'Single use platform',
      subtitle: 'Choose the best financing option for your business.',
    },
    {
      image: '/images/auth-2.png',
      title: 'Fast approvals',
      subtitle: 'Get matched with investors quickly.',
    },
    {
      image: '/images/auth.png',
      title: 'Trusted investors',
      subtitle: 'Access a vetted network of funders.',
    },
  ]);

  activeSlideIndex = signal<number>(0);
  autoplay = true;
  autoplayIntervalMs = 5000;
  private autoplayTimer: any = null;

  // Reactive loading states from AuthService
  isInitializing = this.authService.isInitializing;
  isRegistering = this.authService.isRegistering;
  isLoading = this.authService.isLoading;

  // Computed states for UI
  canSubmit = computed(() => {
    return (
      this.registerForm?.valid && !this.isLoading() && !this.isRegistering()
    );
  });

  constructor() {
    this.initializeForm();
    this.setupRouteSubscription();
    this.updateCompanyNameValidation();
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.stopAutoplay();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, this.nameValidator]],
        lastName: ['', [Validators.required, this.nameValidator]],
        email: [
          '',
          [Validators.required, Validators.email, this.emailValidator],
        ],
        phone: ['', [Validators.required, this.phoneValidator]],
        companyName: [''],
        password: ['', [Validators.required, this.passwordValidator]],
        confirmPassword: ['', [Validators.required]],
        userType: ['sme'],
        agreeToTerms: [false, [Validators.requiredTrue]],
      },
      {
        validators: [this.passwordMatchValidator],
        updateOn: 'change',
      },
    );

    // Watch checkbox state for robustness
    this.registerForm.get('agreeToTerms')?.valueChanges.subscribe((value) => {
      this.syncCheckboxState(value);
    });
  }

  private syncCheckboxState(value: boolean): void {
    if (this.termsCheckboxRef?.nativeElement) {
      this.termsCheckboxRef.nativeElement.checked = value === true;
    }
  }

  private setupRouteSubscription(): void {
    const routeSubscription = this.route.queryParams.subscribe((params) => {
      if (params['userType'] === 'funder') {
        this.selectedUserType.set('funder');
        this.registerForm.patchValue({ userType: 'funder' });
        this.updateCompanyNameValidation();
      }
    });

    this.subscriptions.add(routeSubscription);
  }

  // ===============================
  // MULTI-STEP FORM LOGIC
  // ===============================

  isStep1Valid(): boolean {
    const step1Fields = ['firstName', 'lastName', 'email'];
    return step1Fields.every((field) => {
      const control = this.registerForm.get(field);
      return control?.valid && control?.dirty;
    });
  }

  nextStep(): void {
    if (this.isStep1Valid() && this.currentStep() === 1) {
      this.error.set(null);
      this.currentStep.set(2);
      // Smooth scroll to top on mobile
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }

  previousStep(): void {
    if (this.currentStep() === 2) {
      this.currentStep.set(1);
      this.error.set(null);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
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

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({
        ...confirmPassword.errors,
        passwordMismatch: true,
      });
      return { passwordMismatch: true };
    } else if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }

  private emailValidator = (control: AbstractControl) => {
    if (!control.value) return null;

    const email = control.value.toLowerCase().trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      return { invalidFormat: true };
    }

    try {
      if (this.selectedUserType?.() === 'funder') {
        const commonPersonalDomains = [
          'gmail.com',
          'yahoo.com',
          'hotmail.com',
          'outlook.com',
        ];
        const domain = email.split('@')[1];
        if (commonPersonalDomains.includes(domain)) {
          return { personalEmailForBusiness: true };
        }
      }
    } catch (e) {
      console.warn(
        'Could not access selectedUserType for email validation:',
        e,
      );
    }

    return null;
  };

  private updateCompanyNameValidation(): void {
    const companyNameControl = this.registerForm.get('companyName');

    if (this.selectedUserType() === 'sme') {
      companyNameControl?.setValidators([
        Validators.required,
        this.companyNameValidator,
      ]);
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

  // ===============================
  // FORM INTERACTION METHODS
  // ===============================

  selectUserType(type: 'sme' | 'funder'): void {
    this.selectedUserType.set(type);
    this.registerForm.patchValue({ userType: type });
    this.updateCompanyNameValidation();

    const emailControl = this.registerForm.get('email');
    if (emailControl && emailControl.value) {
      emailControl.updateValueAndValidity();
    }

    this.clearErrors();
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

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
      agreeToTerms: formData.agreeToTerms === true,
    };

    console.log('Submitting registration for:', registerData.email);

    const registrationSubscription = this.authService
      .register(registerData)
      .subscribe({
        next: (response) => {
          console.log('Registration response received:', response);

          if (response.success && response.user) {
            this.success.set('Account created successfully! Redirecting...');
            console.log(
              'Registration successful, navigating based on user type',
            );

            setTimeout(() => {
              if (this.selectedUserType() === 'funder') {
                console.log('Navigating funder to onboarding welcome');
                this.router.navigate(['/funder/onboarding/welcome']);
              } else {
                console.log('Navigating SME to dashboard welcome');
                this.router.navigate(['/dashboard/welcome']);
              }
            }, 1500);
          } else {
            this.error.set(
              response.error || 'Registration failed. Please try again.',
            );
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

          if (
            errorMessage.includes('User already registered') ||
            errorMessage.includes('Email already confirmed')
          ) {
            errorMessage =
              'An account with this email already exists. Please try logging in instead.';
          } else if (errorMessage.includes('Email rate limit')) {
            errorMessage =
              'Too many registration attempts. Please wait a few minutes before trying again.';
          } else if (errorMessage.includes('Signup is disabled')) {
            errorMessage =
              'Registration is temporarily disabled. Please try again later.';
          }

          this.error.set(errorMessage);
        },
      });

    this.subscriptions.add(registrationSubscription);
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.registerForm.controls).forEach((key) => {
      const control = this.registerForm.get(key);
      if (control) {
        control.markAsTouched();
        control.updateValueAndValidity();
      }
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
    const isSelected = this.selectedUserType() === type;

    const baseClasses =
      'p-4 border-2 rounded-xl text-center transition-all duration-200 cursor-pointer';

    const selectedClasses =
      'border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-200';

    const unselectedClasses =
      'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50';

    return `${baseClasses} ${isSelected ? selectedClasses : unselectedClasses}`;
  }

  getInputClasses(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    const hasError = field?.errors && field?.touched;
    const isValid = !field?.errors && field?.touched && field?.value;

    const baseClasses =
      'w-full px-4 py-2.5 border rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

    const normalClasses =
      'border-slate-200 focus:ring-teal-500 focus:border-transparent bg-white';

    const errorClasses =
      'border-red-200/50 focus:ring-red-500 focus:border-transparent bg-red-50/30';

    const validClasses =
      'border-green-200/50 focus:ring-green-500 focus:border-transparent bg-green-50/30';

    if (hasError) return `${baseClasses} ${errorClasses}`;
    if (isValid) return `${baseClasses} ${validClasses}`;
    return `${baseClasses} ${normalClasses}`;
  }

  getCheckboxClasses(): string {
    const field = this.registerForm.get('agreeToTerms');
    const hasError = field?.errors && field?.touched;
    const isChecked = field?.value === true;

    const baseClasses =
      'h-5 w-5 rounded-md border-2 transition-all duration-200 cursor-pointer accent-teal-500';

    if (hasError) {
      return `${baseClasses} border-red-300 bg-red-50`;
    }

    if (isChecked) {
      return `${baseClasses} border-teal-500 bg-teal-500`;
    }

    return `${baseClasses} border-slate-300 bg-white hover:border-slate-400`;
  }

  // ===============================
  // ERROR MESSAGE HELPERS
  // ===============================

  getFieldError(fieldName: string): string | undefined {
    const field = this.registerForm.get(fieldName);
    if (!field?.errors || !field?.touched) return undefined;

    const errors = field.errors;

    if (errors['required'])
      return `${this.getFieldDisplayName(fieldName)} is required`;
    if (errors['email'] || errors['invalidFormat'])
      return 'Please enter a valid email address';
    if (errors['personalEmailForBusiness'])
      return 'Please use a business email address for investor registration';
    if (errors['invalidPhone'])
      return 'Please enter a valid South African phone number';
    if (errors['tooShort'] && fieldName === 'password')
      return 'Password must be at least 8 characters long';
    if (errors['tooShort'])
      return `${this.getFieldDisplayName(fieldName)} is too short`;
    if (errors['tooLong'])
      return `${this.getFieldDisplayName(fieldName)} is too long`;
    if (errors['invalidCharacters'])
      return 'Only letters, spaces, hyphens, apostrophes, and periods are allowed';
    if (errors['noLowercase'])
      return 'Password must contain at least one lowercase letter';
    if (errors['noUppercase'])
      return 'Password must contain at least one uppercase letter';
    if (errors['noNumber']) return 'Password must contain at least one number';
    if (errors['noSpecialChar'])
      return 'Password must contain at least one special character';
    if (errors['passwordMismatch']) return 'Passwords do not match';
    if (errors['requiredTrue'])
      return 'Please agree to the terms and conditions';

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
      confirmPassword: 'Password confirmation',
    };
    return displayNames[fieldName] || fieldName;
  }

  getPasswordStrengthIndicator(): {
    strength: number;
    label: string;
    color: string;
  } {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

    const indicators = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Very Weak', color: 'red-600' },
      { strength: 2, label: 'Weak', color: 'orange-600' },
      { strength: 3, label: 'Fair', color: 'yellow-600' },
      { strength: 4, label: 'Good', color: 'blue-600' },
      { strength: 5, label: 'Strong', color: 'green-600' },
    ];

    return indicators[strength];
  }

  get shouldDisableForm(): boolean {
    return this.isLoading() || this.isRegistering();
  }

  // ===============================
  // CAROUSEL METHODS
  // ===============================

  startAutoplay(): void {
    if (!this.autoplay) return;
    this.stopAutoplay();
    this.autoplayTimer = setInterval(() => {
      this.nextSlide();
    }, this.autoplayIntervalMs);
  }

  stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearInterval(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }

  selectSlide(index: number): void {
    const slides = this.slides();
    if (index < 0 || index >= slides.length) return;
    this.activeSlideIndex.set(index);
  }

  nextSlide(): void {
    const next = (this.activeSlideIndex() + 1) % this.slides().length;
    this.activeSlideIndex.set(next);
  }

  prevSlide(): void {
    const prev =
      (this.activeSlideIndex() - 1 + this.slides().length) %
      this.slides().length;
    this.activeSlideIndex.set(prev);
  }
}
