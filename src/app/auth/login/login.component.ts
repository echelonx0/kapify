import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/production.auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: 'login.component.html',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  loginForm: FormGroup;
  showPassword = signal(false);
  error = signal<string | null>(null);

  // Reactive loading state from AuthService
  isLoading = this.authService.isLoading;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false],
    });
  }

  getInputClasses(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    const hasError = field?.errors && field?.touched;

    const baseClasses =
      'w-full px-4 py-2.5 border rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

    const normalClasses =
      'border-slate-200 focus:ring-teal-500 focus:border-transparent bg-white';
    const errorClasses =
      'border-red-200/50 focus:ring-red-500 focus:border-transparent bg-red-50/30';

    return `${baseClasses} ${hasError ? errorClasses : normalClasses}`;
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  getFieldError(fieldName: string): string | undefined {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        return `Password must be at least 8 characters`;
      }
    }
    return undefined;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      email: 'Email',
      password: 'Password',
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
          const errorMessage =
            err?.error?.message ||
            err?.error?.error ||
            'Invalid email or password';
          this.error.set(errorMessage);
        },
      });
    }
  }
}
