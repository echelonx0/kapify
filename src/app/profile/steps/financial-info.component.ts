
// src/app/profile/steps/financial-info.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UiInputComponent, UiCardComponent } from '../../shared/components';
import { FundingApplicationProfileService } from '../../applications/services/funding-profile.service';
 

@Component({
  selector: 'app-financial-info',
  standalone: true,
  imports: [ReactiveFormsModule, UiInputComponent, UiCardComponent],
  template: `
    <div class="space-y-8">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-neutral-900">Financial Overview</h2>
        <p class="text-neutral-600 mt-2">Share your financial information to help us match you with suitable funders</p>
      </div>

      <ui-card>
        <form [formGroup]="financialForm" class="space-y-8">
          <!-- Revenue Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-neutral-900">Revenue & Profitability</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">Monthly Revenue</label>
                <select 
                  formControlName="monthlyRevenue"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select monthly revenue range</option>
                  <option value="0-50k">R0 - R50,000</option>
                  <option value="50k-100k">R50,001 - R100,000</option>
                  <option value="100k-250k">R100,001 - R250,000</option>
                  <option value="250k-500k">R250,001 - R500,000</option>
                  <option value="500k-1m">R500,001 - R1,000,000</option>
                  <option value="1m+">R1,000,000+</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">Annual Revenue</label>
                <select 
                  formControlName="annualRevenue"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select annual revenue range</option>
                  <option value="0-500k">R0 - R500,000</option>
                  <option value="500k-1m">R500,001 - R1,000,000</option>
                  <option value="1m-5m">R1,000,001 - R5,000,000</option>
                  <option value="5m-10m">R5,000,001 - R10,000,000</option>
                  <option value="10m-50m">R10,000,001 - R50,000,000</option>
                  <option value="50m+">R50,000,000+</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">Profit Margin</label>
                <select 
                  formControlName="profitMargin"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select profit margin</option>
                  <option value="negative">Loss making</option>
                  <option value="0-5">0% - 5%</option>
                  <option value="5-10">5% - 10%</option>
                  <option value="10-20">10% - 20%</option>
                  <option value="20-30">20% - 30%</option>
                  <option value="30+">30%+</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">Existing Debt</label>
                <select 
                  formControlName="existingDebt"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select debt level</option>
                  <option value="none">No existing debt</option>
                  <option value="0-100k">R0 - R100,000</option>
                  <option value="100k-500k">R100,001 - R500,000</option>
                  <option value="500k-1m">R500,001 - R1,000,000</option>
                  <option value="1m-5m">R1,000,001 - R5,000,000</option>
                  <option value="5m+">R5,000,000+</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Credit & Banking -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-neutral-900">Credit & Banking</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">Credit Rating</label>
                <select 
                  formControlName="creditRating"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select credit rating</option>
                  <option value="excellent">Excellent (720+)</option>
                  <option value="good">Good (650-719)</option>
                  <option value="fair">Fair (580-649)</option>
                  <option value="poor">Poor (Below 580)</option>
                  <option value="unknown">Don't know</option>
                </select>
              </div>
              
              <ui-input
                label="Bank Name"
                placeholder="Standard Bank, FNB, ABSA, etc."
                [error]="getFieldError('bankName')"
                formControlName="bankName"
                [required]="true"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-neutral-700 mb-2">Account Type</label>
                <select 
                  formControlName="accountType"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select account type</option>
                  <option value="business-cheque">Business Cheque Account</option>
                  <option value="business-current">Business Current Account</option>
                  <option value="business-savings">Business Savings Account</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <ui-input
                label="Years with Bank"
                type="number"
                placeholder="5"
                [error]="getFieldError('yearsWithBank')"
                formControlName="yearsWithBank"
                [required]="true"
                hint="How long have you banked with them?"
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
export class FinancialInfoComponent implements OnInit {
  financialForm: FormGroup;
  isSaving = signal(false);

  constructor(
    private fb: FormBuilder,
    private profileService: FundingApplicationProfileService
  ) {
    this.financialForm = this.fb.group({
      monthlyRevenue: ['', [Validators.required]],
      annualRevenue: ['', [Validators.required]],
      profitMargin: ['', [Validators.required]],
      existingDebt: ['', [Validators.required]],
      creditRating: ['', [Validators.required]],
      bankName: ['', [Validators.required]],
      accountType: ['', [Validators.required]],
      yearsWithBank: ['', [Validators.required, Validators.min(0)]]
    });

    this.financialForm.valueChanges.subscribe(() => {
      if (this.financialForm.valid) {
        this.autoSave();
      }
    });
  }

  ngOnInit() {
    const existingData = this.profileService.data().financialInfo;
    if (existingData) {
      this.financialForm.patchValue({
        ...existingData,
        ...existingData.bankingDetails
      });
    }
  }

  getFieldError(fieldName: string): string | undefined {
    const field = this.financialForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
      if (field.errors['min']) return 'Must be 0 or greater';
    }
    return undefined;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      bankName: 'Bank name',
      yearsWithBank: 'Years with bank'
    };
    return displayNames[fieldName] || fieldName;
  }

  async autoSave() {
    if (this.financialForm.valid) {
      this.isSaving.set(true);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const formValue = this.financialForm.value;
      const financialData = {
        monthlyRevenue: formValue.monthlyRevenue,
        annualRevenue: formValue.annualRevenue,
        profitMargin: formValue.profitMargin,
        existingDebt: formValue.existingDebt,
        creditRating: formValue.creditRating,
        bankingDetails: {
          bankName: formValue.bankName,
          accountType: formValue.accountType,
          yearsWithBank: formValue.yearsWithBank
        }
      };
      
      this.profileService.updateFinancialInfo(financialData);
      this.isSaving.set(false);
    }
  }
}
