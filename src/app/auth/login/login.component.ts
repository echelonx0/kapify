 
// src/app/auth/login.component.ts
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Eye, EyeOff, ArrowRight } from 'lucide-angular';
import { AuthService } from '../production.auth.service';
 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: 'login.component.html'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loginForm: FormGroup;
  showPassword = signal(false);
  error = signal<string | null>(null);

  // Icons
  EyeIcon = Eye;
  EyeOffIcon = EyeOff;
  ArrowRightIcon = ArrowRight;

  // Use computed for reactive loading state
  isLoading = this.authService.isLoading;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
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
      if (field.errors['minlength']) return `Password must be at least 8 characters`;
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

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.error.set(null);
      const { email, password } = this.loginForm.value;
      
      this.authService.login({ email, password }).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.error.set(err.error?.error || 'Invalid email or password');
        }
      });
    }
  }
}