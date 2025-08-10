

// src/app/profile/steps/business-info.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UiInputComponent, UiCardComponent } from '../../shared/components';
import { FundingApplicationProfileService } from '../../applications/services/funding-profile.service';

@Component({
  selector: 'app-business-info',
  standalone: true,
  imports: [ReactiveFormsModule, UiInputComponent, UiCardComponent],
  template: `
    <div class="space-y-8">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-neutral-900">Business Information</h2>
        <p class="text-neutral-600 mt-2">Help us understand your business structure and operations</p>
      </div>

      <ui-card>
        <form [formGroup]="businessForm" class="space-y-6">
          <!-- Company Details -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-neutral-900">Company Details</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ui-input
                label="Company Name"
                placeholder="Your Company (Pty) Ltd"
                [error]="getFieldError('companyName')"
                formControlName="companyName"
                [required]="true"
              />
              <ui-input
                label="Registration Number"
                placeholder="2013/900800/07"
                [error]="getFieldError('registrationNumber')"
                formControlName="registrationNumber"
                [required]="true"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ui-input
                label="VAT Number"
                placeholder="4589098765"
                [error]="getFieldError('vatNumber')"
                formControlName="vatNumber"
                hint="Optional - only if VAT registered"
              />
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">Industry</label>
                <select 
                  formControlName="industry"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select your industry</option>
                  <option value="agriculture">Agriculture</option>
                  <option value="construction">Construction</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail</option>
                  <option value="services">Professional Services</option>
                  <option value="technology">Technology</option>
                  <option value="tourism">Tourism & Hospitality</option>
                  <option value="transport">Transport & Logistics</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ui-input
                label="Years in Operation"
                type="number"
                placeholder="5"
                [error]="getFieldError('yearsInOperation')"
                formControlName="yearsInOperation"
                [required]="true"
              />
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">Number of Employees</label>
                <select 
                  formControlName="numberOfEmployees"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select range</option>
                  <option value="1-5">1-5 employees</option>
                  <option value="6-20">6-20 employees</option>
                  <option value="21-50">21-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="200+">200+ employees</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Physical Address -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-neutral-900">Physical Address</h3>
            
            <ui-input
              label="Street Address"
              placeholder="290 Action Drive, Crystal Office Park"
              [error]="getFieldError('physicalAddress.street')"
              formControlName="street"
              [required]="true"
            />
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ui-input
                label="City"
                placeholder="Charlestown"
                [error]="getFieldError('physicalAddress.city')"
                formControlName="city"
                [required]="true"
              />
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">Province</label>
                <select 
                  formControlName="province"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select province</option>
                  <option value="Gauteng">Gauteng</option>
                  <option value="Western Cape">Western Cape</option>
                  <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                  <option value="Eastern Cape">Eastern Cape</option>
                  <option value="Free State">Free State</option>
                  <option value="Limpopo">Limpopo</option>
                  <option value="Mpumalanga">Mpumalanga</option>
                  <option value="Northern Cape">Northern Cape</option>
                  <option value="North West">North West</option>
                </select>
              </div>
              <ui-input
                label="Postal Code"
                placeholder="0157"
                [error]="getFieldError('physicalAddress.postalCode')"
                formControlName="postalCode"
                [required]="true"
              />
            </div>
          </div>

          @if (isSaving()) {
            <div class="text-sm text-neutral-500 flex items-center">
              <div class="w-2 h-2 bg-primary-500 rounded-full animate-pulse mr-2"></div>
              Saving changes...
            </div>
          }
        </form>
      </ui-card>
    </div>
  `
})
export class BusinessInfoComponent implements OnInit {
  businessForm: FormGroup;
  isSaving = signal(false);

  constructor(
    private fb: FormBuilder,
    private profileService: FundingApplicationProfileService
  ) {
    this.businessForm = this.fb.group({
      companyName: ['', [Validators.required]],
      registrationNumber: ['', [Validators.required]],
      vatNumber: [''],
      industry: ['', [Validators.required]],
      yearsInOperation: ['', [Validators.required, Validators.min(0)]],
      numberOfEmployees: ['', [Validators.required]],
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      province: ['', [Validators.required]],
      postalCode: ['', [Validators.required]]
    });

    // Auto-save on form changes
    this.businessForm.valueChanges.subscribe(() => {
      if (this.businessForm.valid) {
        this.autoSave();
      }
    });
  }

  ngOnInit() {
    const existingData = this.profileService.data().businessInfo;
    if (existingData) {
      this.businessForm.patchValue({
        ...existingData,
        ...existingData.physicalAddress
      });
    }
  }

  getFieldError(fieldName: string): string | undefined {
    const field = this.businessForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
      if (field.errors['min']) return 'Must be 0 or greater';
    }
    return undefined;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      companyName: 'Company name',
      registrationNumber: 'Registration number',
      industry: 'Industry',
      yearsInOperation: 'Years in operation',
      numberOfEmployees: 'Number of employees',
      street: 'Street address',
      city: 'City',
      province: 'Province',
      postalCode: 'Postal code'
    };
    return displayNames[fieldName] || fieldName;
  }

  async autoSave() {
    if (this.businessForm.valid) {
      this.isSaving.set(true);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const formValue = this.businessForm.value;
      const businessData = {
        companyName: formValue.companyName,
        registrationNumber: formValue.registrationNumber,
        vatNumber: formValue.vatNumber,
        industry: formValue.industry,
        yearsInOperation: formValue.yearsInOperation,
        numberOfEmployees: formValue.numberOfEmployees,
        physicalAddress: {
          street: formValue.street,
          city: formValue.city,
          province: formValue.province,
          postalCode: formValue.postalCode
        }
      };
      
      this.profileService.updateBusinessInfo(businessData);
      this.isSaving.set(false);
    }
  }
}
