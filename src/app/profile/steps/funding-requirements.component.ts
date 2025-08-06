
// src/app/profile/steps/funding-requirements.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UiInputComponent, UiCardComponent } from '../../shared/components';
import { ProfileService } from '../profile.service';


@Component({
  selector: 'app-funding-requirements',
  standalone: true,
  imports: [ReactiveFormsModule, UiInputComponent, UiCardComponent],
  template: `
    <div class="space-y-8">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-neutral-900">Funding Requirements</h2>
        <p class="text-neutral-600 mt-2">Tell us about your funding needs to match you with the right investors</p>
      </div>

      <ui-card>
        <form [formGroup]="fundingForm" class="space-y-8">
          <!-- Funding Amount -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-neutral-900">Funding Details</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">Amount Required</label>
                <select 
                  formControlName="amountRequired"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select funding amount</option>
                  <option value="50k-100k">R50,000 - R100,000</option>
                  <option value="100k-250k">R100,001 - R250,000</option>
                  <option value="250k-500k">R250,001 - R500,000</option>
                  <option value="500k-1m">R500,001 - R1,000,000</option>
                  <option value="1m-2m">R1,000,001 - R2,000,000</option>
                  <option value="2m-5m">R2,000,001 - R5,000,000</option>
                  <option value="5m+">R5,000,000+</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">Timeline Required</label>
                <select 
                  formControlName="timelineRequired"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select timeline</option>
                  <option value="immediate">Immediate (within 1 month)</option>
                  <option value="1-3months">1-3 months</option>
                  <option value="3-6months">3-6 months</option>
                  <option value="6-12months">6-12 months</option>
                  <option value="12months+">12+ months</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">Purpose of Funding</label>
              <textarea
                formControlName="purposeOfFunding"
                rows="4"
                placeholder="Describe how you plan to use the funding (e.g., equipment purchase, working capital, expansion, etc.)"
                class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              ></textarea>
            </div>
          </div>

          <!-- Repayment & Security -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-neutral-900">Repayment & Security</h3>
            
            <div>
              <label class="block text-sm font-medium text-neutral-700 mb-2">Preferred Repayment Period</label>
              <select 
                formControlName="repaymentPeriod"
                class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Select repayment period</option>
                <option value="6months">6 months</option>
                <option value="12months">12 months</option>
                <option value="18months">18 months</option>
                <option value="24months">24 months</option>
                <option value="36months">36 months</option>
                <option value="48months">48 months</option>
                <option value="60months">60 months</option>
                <option value="longer">Longer than 60 months</option>
              </select>
            </div>

            <div class="space-y-4">
              <div class="flex items-start space-x-3">
                <input
                  type="checkbox"
                  formControlName="collateralAvailable"
                  class="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 mt-1"
                >
                <div class="flex-1">
                  <label class="text-sm font-medium text-neutral-700">
                    I have collateral available to secure the loan
                  </label>
                  <p class="text-xs text-neutral-500 mt-1">
                    Collateral can include property, equipment, inventory, or other valuable assets
                  </p>
                </div>
              </div>

              @if (fundingForm.get('collateralAvailable')?.value) {
                <div>
                  <label class="block text-sm font-medium text-neutral-700 mb-2">Collateral Description</label>
                  <textarea
                    formControlName="collateralDescription"
                    rows="3"
                    placeholder="Describe the collateral you can offer (type, estimated value, etc.)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  ></textarea>
                </div>
              }
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
export class FundingRequirementsComponent implements OnInit {
  fundingForm: FormGroup;
  isSaving = signal(false);

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService
  ) {
    this.fundingForm = this.fb.group({
      amountRequired: ['', [Validators.required]],
      purposeOfFunding: ['', [Validators.required, Validators.minLength(50)]],
      timelineRequired: ['', [Validators.required]],
      repaymentPeriod: ['', [Validators.required]],
      collateralAvailable: [false],
      collateralDescription: ['']
    });

    // Add conditional validation for collateral description
    this.fundingForm.get('collateralAvailable')?.valueChanges.subscribe(hasCollateral => {
      const collateralDesc = this.fundingForm.get('collateralDescription');
      if (hasCollateral) {
        collateralDesc?.setValidators([Validators.required]);
      } else {
        collateralDesc?.clearValidators();
      }
      collateralDesc?.updateValueAndValidity();
    });

    this.fundingForm.valueChanges.subscribe(() => {
      if (this.fundingForm.valid) {
        this.autoSave();
      }
    });
  }

  ngOnInit() {
    const existingData = this.profileService.data().fundingInfo;
    if (existingData) {
      this.fundingForm.patchValue(existingData);
    }
  }

  async autoSave() {
    if (this.fundingForm.valid) {
      this.isSaving.set(true);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.profileService.updateFundingInfo(this.fundingForm.value);
      this.isSaving.set(false);
    }
  }
}
