 
// import { Component, signal } from '@angular/core';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { Router } from '@angular/router';
// import { LucideAngularModule, Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-angular';
// import { UiButtonComponent, UiInputComponent, UiCardComponent } from '../shared/components';
// import { AuthService } from './auth.service';
 

// @Component({
//   selector: 'app-login',
//   standalone: true,
//   imports: [
//     ReactiveFormsModule,
//     LucideAngularModule,
//     UiButtonComponent,
//     UiInputComponent,
//     UiCardComponent
//   ],
//   template: `
//     <div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
//       <div class="w-full max-w-md">
//         <!-- Logo & Header -->
//         <div class="text-center mb-8">
//           <div class="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-4">
//             <span class="text-white font-bold text-xl">K</span>
//           </div>
//           <h1 class="text-2xl font-bold text-neutral-900">Welcome back</h1>
//           <p class="text-neutral-600 mt-2">Sign in to your Kapify account</p>
//         </div>

//         <ui-card>
//           <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
//             <!-- Email -->
//             <div>
//               <ui-input
//                 label="Email address"
//                 type="email"
//                 placeholder="Enter your email"
//                 [error]="getFieldError('email')"
//                 formControlName="email"
//                 [required]="true"
//               />
//             </div>

//             <!-- Password -->
//             <div>
//               <div class="relative">
//                 <ui-input
//                   label="Password"
//                   [type]="showPassword() ? 'text' : 'password'"
//                   placeholder="Enter your password"
//                   [error]="getFieldError('password')"
//                   formControlName="password"
//                   [required]="true"
//                 />
//                 <button
//                   type="button"
//                   class="absolute right-3 top-9 text-neutral-400 hover:text-neutral-600"
//                   (click)="togglePasswordVisibility()"
//                 >
//                   <lucide-icon [img]="showPassword() ? EyeOffIcon : EyeIcon" [size]="20" />
//                 </button>
//               </div>
//             </div>

//             <!-- Remember me & Forgot password -->
//             <div class="flex items-center justify-between">
//               <label class="flex items-center">
//                 <input
//                   type="checkbox"
//                   formControlName="rememberMe"
//                   class="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
//                 >
//                 <span class="ml-2 text-sm text-neutral-700">Remember me</span>
//               </label>
//               <a href="/forgot-password" class="text-sm text-primary-600 hover:text-primary-500">
//                 Forgot password?
//               </a>
//             </div>

//             <!-- Error Message -->
//             @if (error()) {
//               <div class="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm">
//                 {{ error() }}
//               </div>
//             }

//             <!-- Submit Button -->
//             <ui-button
//               variant="primary"
//               size="lg"
//               [fullWidth]="true"
//               [disabled]="loginForm.invalid || isLoading"
//               type="submit"
//             >
//               @if (isLoading) {
//                 <span>Signing in...</span>
//               } @else {
//                 <span>Sign in</span>
//                 <lucide-icon [img]="ArrowRightIcon" [size]="20" class="ml-2" />
//               }
//             </ui-button>
//           </form>

//           <!-- Divider -->
//           <div class="mt-6 relative">
//             <div class="absolute inset-0 flex items-center">
//               <div class="w-full border-t border-neutral-300"></div>
//             </div>
//             <div class="relative flex justify-center text-sm">
//               <span class="bg-white px-2 text-neutral-500">Don't have an account?</span>
//             </div>
//           </div>

//           <!-- Register Link -->
//           <div class="mt-6 text-center">
//             <ui-button variant="outline" [fullWidth]="true" (clicked)="goToRegister()">
//               Create your account
//             </ui-button>
//           </div>
//         </ui-card>

//         <!-- Footer -->
//         <div class="mt-8 text-center text-xs text-neutral-500">
//           By signing in, you agree to our 
//           <a href="/terms" class="text-primary-600 hover:underline">Terms of Service</a>
//           and 
//           <a href="/privacy" class="text-primary-600 hover:underline">Privacy Policy</a>
//         </div>
//       </div>
//     </div>
//   `
// })
// export class LoginComponent {
//   loginForm: FormGroup;
//   showPassword = signal(false);
//   error = signal<string | null>(null);

//   EyeIcon = Eye;
//   EyeOffIcon = EyeOff;
//   MailIcon = Mail;
//   LockIcon = Lock;
//   ArrowRightIcon = ArrowRight;

//   constructor(
//     private fb: FormBuilder,
//     private authService: AuthService,
//     private router: Router
//   ) {
//     this.loginForm = this.fb.group({
//       email: ['', [Validators.required, Validators.email]],
//       password: ['', [Validators.required, Validators.minLength(6)]],
//       rememberMe: [false]
//     });
//   }

//   get isLoading() {
//     return this.authService.isLoading();
//   }

//   togglePasswordVisibility() {
//     this.showPassword.set(!this.showPassword());
//   }

//   getFieldError(fieldName: string): string | undefined {
//     const field = this.loginForm.get(fieldName);
//     if (field?.errors && field?.touched) {
//       if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
//       if (field.errors['email']) return 'Please enter a valid email';
//       if (field.errors['minlength']) return `Password must be at least 6 characters`;
//     }
//     return undefined;
//   }

//   private getFieldDisplayName(fieldName: string): string {
//     const displayNames: { [key: string]: string } = {
//       email: 'Email',
//       password: 'Password'
//     };
//     return displayNames[fieldName] || fieldName;
//   }

//   async onSubmit() {
//     if (this.loginForm.valid) {
//       this.error.set(null);
//       const { email, password } = this.loginForm.value;
//       const result = await this.authService.login(email, password);
//       if (result.success) {
//         this.router.navigate(['/dashboard']);
//       } else {
//         this.error.set(result.error || 'Login failed');
//       }
//     }
//   }

//   goToRegister() {
//     this.router.navigate(['/register']);
//   }
// }
import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule, Eye, EyeOff, ArrowRight } from 'lucide-angular';
import { UiButtonComponent, UiInputComponent } from '../shared/components';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    UiButtonComponent,
    UiInputComponent
  ],
  template: `
    <div class="min-h-screen flex">
      <!-- Left Panel - Form -->
      <div class="flex-1 flex items-center justify-center px-8 py-12 bg-white">
        <div class="w-full max-w-md">
          <!-- Logo -->
          <div class="mb-12">
            <div class="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center mb-8">
              <span class="text-white font-bold text-lg">K</span>
            </div>
            <h1 class="text-3xl font-bold text-neutral-900 mb-2">Welcome back</h1>
            <p class="text-neutral-600">Sign in to continue to Kapify</p>
          </div>

          <!-- Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                formControlName="email"
                placeholder="Enter your email"
                [class]="getInputClasses('email')"
              />
              @if (getFieldError('email')) {
                <p class="mt-1 text-sm text-red-600">{{ getFieldError('email') }}</p>
              }
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="Enter your password"
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
            </div>

            <!-- Remember & Forgot -->
            <div class="flex items-center justify-between">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  formControlName="rememberMe"
                  class="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-2 focus:ring-primary-500 focus:ring-offset-0"
                />
                <span class="ml-2 text-sm text-neutral-700">Remember me</span>
              </label>
              <a 
                href="/forgot-password" 
                class="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Forgot password?
              </a>
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
              [disabled]="loginForm.invalid || isLoading"
              class="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 flex items-center justify-center"
            >
              @if (isLoading) {
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span class="ml-2">Signing in...</span>
              } @else {
                <span>Sign in</span>
                <lucide-icon [img]="ArrowRightIcon" [size]="20" class="ml-2" />
              }
            </button>
          </form>

          <!-- Register Link -->
          <div class="mt-8 text-center">
            <p class="text-neutral-600">
              Don't have an account? 
              <button 
                (click)="goToRegister()"
                class="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Sign up
              </button>
            </p>
          </div>

          <!-- Footer -->
          <div class="mt-12 text-center text-xs text-neutral-500">
            By signing in, you agree to our 
            <a href="/terms" class="text-primary-600 hover:underline">Terms</a>
            and 
            <a href="/privacy" class="text-primary-600 hover:underline">Privacy Policy</a>
          </div>
        </div>
      </div>

      <!-- Right Panel - Image -->
      <div class="hidden lg:block flex-1 relative overflow-hidden">
        <img 
          src="/images/auth.png" 
          alt="Welcome back illustration"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <!-- Optional overlay for better text contrast if needed -->
        <div class="absolute inset-0 bg-gradient-to-br from-primary-600/10 to-primary-500/5"></div>
      </div>
    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = signal(false);
  error = signal<string | null>(null);

  EyeIcon = Eye;
  EyeOffIcon = EyeOff;
  ArrowRightIcon = ArrowRight;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  get isLoading() {
    return this.authService.isLoading();
  }

  getInputClasses(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    const hasError = field?.errors && field?.touched;
    
    const baseClasses = 'w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
    const normalClasses = 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500';
    const errorClasses = 'border-red-300 focus:border-red-500 focus:ring-red-500';
    
    return `${baseClasses} ${hasError ? errorClasses : normalClasses}`;
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  getFieldError(fieldName: string): string | undefined {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `Password must be at least 6 characters`;
    }
    return undefined;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      email: 'Email',
      password: 'Password'
    };
    return displayNames[fieldName] || fieldName;
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      this.error.set(null);
      const { email, password } = this.loginForm.value;
      const result = await this.authService.login(email, password);
      if (result.success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.error.set(result.error || 'Invalid email or password');
      }
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }
}