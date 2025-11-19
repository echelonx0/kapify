// src/app/profile/steps/personal-info.component.ts
import { Component, signal, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  UiInputComponent,
  UiCardComponent,
  UiButtonComponent,
} from '../../../shared/components';
import { SMEProfileStepsService } from '../services/sme-profile-steps.service';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [ReactiveFormsModule, UiInputComponent, UiCardComponent],
  template: `
    <div class="space-y-8">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-neutral-900">
          Personal Information
        </h2>
        <p class="text-neutral-600 mt-2">
          Tell us about yourself to get started with your funding application
        </p>
      </div>

      <ui-card>
        <form
          [formGroup]="personalForm"
          (ngSubmit)="onSubmit()"
          class="space-y-6"
        >
          <!-- Name Fields -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ui-input
              label="First Name"
              placeholder="John"
              [error]="getFieldError('firstName')"
              formControlName="firstName"
              [required]="true"
            />
            <ui-input
              label="Last Name"
              placeholder="Doe"
              [error]="getFieldError('lastName')"
              formControlName="lastName"
              [required]="true"
            />
          </div>

          <!-- Contact Info -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ui-input
              label="Email Address"
              type="email"
              placeholder="john@company.co.za"
              [error]="getFieldError('email')"
              formControlName="email"
              [required]="true"
            />
            <ui-input
              label="Phone Number"
              type="tel"
              placeholder="+27 81 123 4567"
              [error]="getFieldError('phone')"
              formControlName="phone"
              [required]="true"
            />
          </div>

          <!-- ID and Position -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ui-input
              label="ID Number"
              placeholder="8001015009087"
              [error]="getFieldError('idNumber')"
              formControlName="idNumber"
              [required]="true"
              hint="Your South African ID number"
            />
            <ui-input
              label="Position in Company"
              placeholder="CEO, Managing Director, etc."
              [error]="getFieldError('position')"
              formControlName="position"
              [required]="true"
            />
          </div>

          <!-- Auto-save indicator -->
          @if (isSaving()) {
          <div class="text-sm text-neutral-500 flex items-center">
            <div
              class="w-2 h-2 bg-primary-500 rounded-full animate-pulse mr-2"
            ></div>
            Saving changes...
          </div>
          } @else if (lastSaved()) {
          <div class="text-sm text-neutral-500">
            ✓ Changes saved automatically
          </div>
          }
        </form>
      </ui-card>
    </div>
  `,
})
export class PersonalInfoComponent implements OnInit {
  personalForm: FormGroup;
  isSaving = signal(false);
  lastSaved = signal(false);

  constructor(
    private fb: FormBuilder,
    private profileService: SMEProfileStepsService
  ) {
    this.personalForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      idNumber: ['', [Validators.required, Validators.pattern(/^\d{13}$/)]],
      position: ['', [Validators.required]],
    });

    // Auto-save on form changes
    this.personalForm.valueChanges.subscribe(() => {
      if (this.personalForm.valid) {
        this.autoSave();
      }
    });
  }

  ngOnInit() {
    // Load existing data
    const existingData = this.profileService.data().personalInfo;
    if (existingData) {
      this.personalForm.patchValue(existingData);
    }
  }

  getFieldError(fieldName: string): string | undefined {
    const field = this.personalForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required'])
        return `${this.getFieldDisplayName(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['pattern'])
        return 'Please enter a valid 13-digit ID number';
    }
    return undefined;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email address',
      phone: 'Phone number',
      idNumber: 'ID number',
      position: 'Position',
    };
    return displayNames[fieldName] || fieldName;
  }

  async autoSave() {
    if (this.personalForm.valid) {
      this.isSaving.set(true);
      try {
        this.profileService.updatePersonalInfo(this.personalForm.value);
        this.lastSaved.set(true);
        setTimeout(() => this.lastSaved.set(false), 3000);
      } finally {
        this.isSaving.set(false);
      }
    }
  }
  onSubmit() {
    if (this.personalForm.valid) {
      this.profileService.updatePersonalInfo(this.personalForm.value);
    }
  }
}
