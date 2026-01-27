// import { Component, OnInit, signal, inject } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import {
//   ReactiveFormsModule,
//   FormBuilder,
//   FormGroup,
//   Validators,
// } from '@angular/forms';

// import { CircleAlert, Eye, LucideAngularModule } from 'lucide-angular';
// import {
//   InvitationAuthService,
//   InvitationDetails,
//   InvitationRegistrationRequest,
// } from '../../core/dashboard/settings/components/team-management/services/invitation-auth.service';
// import { ToastService } from 'src/app/shared/services/toast.service';

// @Component({
//   selector: 'app-accept-invitation',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
//   templateUrl: './accept-invitation.component.html',
//   styleUrls: ['./accept-invitation.component.css'],
// })
// export class AcceptInvitationComponent implements OnInit {
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private invitationAuthService = inject(InvitationAuthService);
//   private toastService = inject(ToastService);
//   private fb = inject(FormBuilder);
//   AlertCircleIcon = CircleAlert;
//   EyeIcon = Eye;
//   // State
//   invitationToken = signal<string | null>(null);
//   invitationDetails = signal<InvitationDetails | null>(null);
//   isValidating = signal(false);
//   isSubmitting = signal(false);
//   error = signal<string | null>(null);
//   success = signal(false);

//   form!: FormGroup;

//   ngOnInit() {
//     this.route.queryParams.subscribe((params) => {
//       const token = params['token'];
//       if (!token) {
//         this.error.set('Invalid invitation link. Please check the URL.');
//         return;
//       }

//       this.invitationToken.set(token);
//       this.validateInvitation(token);
//     });

//     this.initializeForm();
//   }

//   private initializeForm() {
//     this.form = this.fb.group({
//       firstName: ['', [Validators.required, Validators.minLength(2)]],
//       lastName: ['', [Validators.required, Validators.minLength(2)]],
//       email: [{ value: '', disabled: true }, Validators.required],
//       password: ['', [Validators.required, Validators.minLength(8)]],
//       confirmPassword: ['', Validators.required],
//     });
//   }

//   private validateInvitation(token: string) {
//     this.isValidating.set(true);
//     this.error.set(null);

//     this.invitationAuthService.validateInvitationToken(token).subscribe({
//       next: (result) => {
//         if (result.valid && result.details) {
//           this.invitationDetails.set(result.details);
//           this.form.patchValue({ email: result.details.email });
//         } else {
//           this.error.set(
//             result.error || 'Invitation not found or already used.',
//           );
//         }
//         this.isValidating.set(false);
//       },
//       error: (err) => {
//         this.error.set(
//           `Failed to validate invitation: ${err.message}. Please try again.`,
//         );
//         this.isValidating.set(false);
//       },
//     });
//   }

//   onSubmit() {
//     if (this.form.invalid) {
//       this.error.set('Please fill in all required fields correctly.');
//       return;
//     }

//     const formValue = this.form.getRawValue();

//     if (formValue.password !== formValue.confirmPassword) {
//       this.error.set('Passwords do not match.');
//       return;
//     }

//     const token = this.invitationToken();
//     if (!token) {
//       this.error.set('Invalid invitation token.');
//       return;
//     }

//     this.isSubmitting.set(true);
//     this.error.set(null);

//     const registrationRequest: InvitationRegistrationRequest = {
//       firstName: formValue.firstName,
//       lastName: formValue.lastName,
//       email: formValue.email,
//       password: formValue.password,
//       confirmPassword: formValue.confirmPassword,
//       invitationToken: token,
//     };

//     this.invitationAuthService
//       .registerInvitedUser(registrationRequest)
//       .subscribe({
//         next: (result) => {
//           if (result.success) {
//             this.success.set(true);
//             setTimeout(() => {
//               this.router.navigate(['/dashboard']);
//             }, 2000);
//           } else {
//             this.error.set(result.error || 'Registration failed.');
//             this.isSubmitting.set(false);
//           }
//         },
//         error: (err) => {
//           this.error.set('Registration failed. Please try again.');
//           this.isSubmitting.set(false);
//         },
//       });
//   }

//   getPasswordErrorMessage(): string {
//     const control = this.form.get('password');
//     if (control?.hasError('required')) return 'Password is required';
//     if (control?.hasError('minlength'))
//       return 'Password must be at least 8 characters';
//     return '';
//   }

//   getFirstNameErrorMessage(): string {
//     const control = this.form.get('firstName');
//     if (control?.hasError('required')) return 'First name is required';
//     if (control?.hasError('minlength'))
//       return 'First name must be at least 2 characters';
//     return '';
//   }

//   getLastNameErrorMessage(): string {
//     const control = this.form.get('lastName');
//     if (control?.hasError('required')) return 'Last name is required';
//     if (control?.hasError('minlength'))
//       return 'Last name must be at least 2 characters';
//     return '';
//   }
// }

import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

import { CircleAlert, Eye, LucideAngularModule } from 'lucide-angular';
import {
  InvitationAuthService,
  InvitationDetails,
  InvitationRegistrationRequest,
} from '../../core/dashboard/settings/components/team-management/services/invitation-auth.service';
import { ToastService } from 'src/app/shared/services/toast.service';

@Component({
  selector: 'app-accept-invitation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './accept-invitation.component.html',
  styleUrls: ['./accept-invitation.component.css'],
})
export class AcceptInvitationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invitationAuthService = inject(InvitationAuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder);
  AlertCircleIcon = CircleAlert;
  EyeIcon = Eye;

  // State
  invitationToken = signal<string | null>(null);
  invitationDetails = signal<InvitationDetails | null>(null);
  isValidating = signal(false);
  isSubmitting = signal(false);
  error = signal<string | null>(null);
  success = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  form!: FormGroup;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      if (!token) {
        const msg = 'Invalid invitation link. Please check the URL.';
        this.error.set(msg);
        this.toastService.error(msg);
        return;
      }

      this.invitationToken.set(token);
      this.validateInvitation(token);
    });

    this.initializeForm();
  }

  private initializeForm() {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }, Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  private validateInvitation(token: string) {
    this.isValidating.set(true);
    this.error.set(null);

    this.invitationAuthService.validateInvitationToken(token).subscribe({
      next: (result) => {
        if (result.valid && result.details) {
          this.invitationDetails.set(result.details);
          this.form.patchValue({ email: result.details.email });
          this.toastService.info(
            'Invitation validated. Complete your profile.',
          );
        } else {
          const msg = result.error || 'Invitation not found or already used.';
          this.error.set(msg);
          this.toastService.error(msg);
        }
        this.isValidating.set(false);
      },
      error: (err) => {
        const msg = `Failed to validate invitation: ${err.message}. Please try again.`;
        this.error.set(msg);
        this.toastService.error(msg);
        this.isValidating.set(false);
      },
    });
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  onSubmit() {
    if (this.form.invalid) {
      const msg = 'Please fill in all required fields correctly.';
      this.error.set(msg);
      this.toastService.error(msg);
      return;
    }

    const formValue = this.form.getRawValue();

    if (formValue.password !== formValue.confirmPassword) {
      const msg = 'Passwords do not match.';
      this.error.set(msg);
      this.toastService.error(msg);
      return;
    }

    const token = this.invitationToken();
    if (!token) {
      const msg = 'Invalid invitation token.';
      this.error.set(msg);
      this.toastService.error(msg);
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);

    const registrationRequest: InvitationRegistrationRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      password: formValue.password,
      confirmPassword: formValue.confirmPassword,
      invitationToken: token,
    };

    this.invitationAuthService
      .registerInvitedUser(registrationRequest)
      .subscribe({
        next: (result) => {
          if (result.success) {
            this.success.set(true);
            this.toastService.success(
              'Account created successfully! Redirecting...',
            );
            setTimeout(() => {
              this.router.navigate(['/dashboard']);
            }, 2000);
          } else {
            const msg = result.error || 'Registration failed.';
            this.error.set(msg);
            this.toastService.error(msg);
            this.isSubmitting.set(false);
          }
        },
        error: (err) => {
          const msg = 'Registration failed. Please try again.';
          this.error.set(msg);
          this.toastService.error(msg);
          this.isSubmitting.set(false);
        },
      });
  }

  getPasswordErrorMessage(): string {
    const control = this.form.get('password');
    if (control?.hasError('required')) return 'Password is required';
    if (control?.hasError('minlength'))
      return 'Password must be at least 8 characters';
    return '';
  }

  getFirstNameErrorMessage(): string {
    const control = this.form.get('firstName');
    if (control?.hasError('required')) return 'First name is required';
    if (control?.hasError('minlength'))
      return 'First name must be at least 2 characters';
    return '';
  }

  getLastNameErrorMessage(): string {
    const control = this.form.get('lastName');
    if (control?.hasError('required')) return 'Last name is required';
    if (control?.hasError('minlength'))
      return 'Last name must be at least 2 characters';
    return '';
  }
}
