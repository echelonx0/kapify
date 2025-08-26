// src/app/funder/components/create-opportunity/steps/investment-terms-step.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, DollarSign, TrendingUp, PieChart, RefreshCw, FileText, AlertCircle, Calculator } from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormStepProps, OpportunityFormData, ValidationError, NumberFieldKey } from '../shared/form-interfaces';

interface TimeframeOption {
  value: string;
  label: string;
  description: string;
}

@Component({
  selector: 'app-investment-terms-step',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-8">
      <!-- Funding Type Selection -->
      <div class="space-y-3">
        <label class="block text-sm font-semibold text-gray-700">
          Funding Type <span class="text-red-500">*</span>
        </label>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label class="relative cursor-pointer">
            <input 
              type="radio" 
              name="fundingType" 
              value="debt"
              [checked]="formData.fundingType === 'debt'"
              (change)="onFieldChange('fundingType', $event)"
              class="sr-only peer"
            >
            <div class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all"
                 [class.border-red-300]="hasFieldError('fundingType')"
                 [class.hover:border-red-400]="hasFieldError('fundingType')">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <lucide-angular [img]="TrendingUpIcon" [size]="16" class="text-green-600"></lucide-angular>
              </div>
              <div>
                <div class="font-medium text-gray-900">Debt</div>
                <div class="text-xs text-gray-500">Traditional loan</div>
              </div>
            </div>
          </label>

          <label class="relative cursor-pointer">
            <input 
              type="radio" 
              name="fundingType" 
              value="equity"
              [checked]="formData.fundingType === 'equity'"
              (change)="onFieldChange('fundingType', $event)"
              class="sr-only peer"
            >
            <div class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all"
                 [class.border-red-300]="hasFieldError('fundingType')"
                 [class.hover:border-red-400]="hasFieldError('fundingType')">
              <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <lucide-angular [img]="PieChartIcon" [size]="16" class="text-purple-600"></lucide-angular>
              </div>
              <div>
                <div class="font-medium text-gray-900">Equity</div>
                <div class="text-xs text-gray-500">Ownership stake</div>
              </div>
            </div>
          </label>

          <label class="relative cursor-pointer">
            <input 
              type="radio" 
              name="fundingType" 
              value="convertible"
              [checked]="formData.fundingType === 'convertible'"
              (change)="onFieldChange('fundingType', $event)"
              class="sr-only peer"
            >
            <div class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all"
                 [class.border-red-300]="hasFieldError('fundingType')"
                 [class.hover:border-red-400]="hasFieldError('fundingType')">
              <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <lucide-angular [img]="RefreshCwIcon" [size]="16" class="text-orange-600"></lucide-angular>
              </div>
              <div>
                <div class="font-medium text-gray-900">Convertible</div>
                <div class="text-xs text-gray-500">Converts to equity</div>
              </div>
            </div>
          </label>
        </div>
        @if (getFieldError('fundingType'); as error) {
          <p class="text-sm text-red-600 flex items-center">
            <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
            {{ error.message }}
          </p>
        }
      </div>

      <!-- Investment Amounts -->
      <div class="space-y-6">
        <div class="flex items-center space-x-2">
          <lucide-angular [img]="CalculatorIcon" [size]="20" class="text-primary-600"></lucide-angular>
          <h3 class="text-lg font-semibold text-gray-900">Investment Structure</h3>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Total Available -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              Total Available <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">{{ formData.currency || 'ZAR' }}</span>
              <input 
                type="text" 
                placeholder="5,000,000"
                [value]="formatNumberWithCommas(formData.totalAvailable)"
                (input)="onNumberInput('totalAvailable', $event)"
                [class]="getFieldClasses('totalAvailable')"
                class="pl-16"
              >
            </div>
            @if (getFieldError('totalAvailable'); as error) {
              <p class="text-sm flex items-center" 
                 [class.text-red-600]="error.type === 'error'" 
                 [class.text-yellow-600]="error.type === 'warning'">
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ error.message }}
              </p>
            } @else {
              <p class="text-xs text-gray-500">Total funding pool available</p>
            }
          </div>

          <!-- Typical Investment -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              Typical Investment <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">{{ formData.currency || 'ZAR' }}</span>
              <input 
                type="text" 
                placeholder="500,000"
                [value]="formatNumberWithCommas(formData.offerAmount)"
                (input)="onNumberInput('offerAmount', $event)"
                [class]="getFieldClasses('offerAmount')"
                class="pl-16"
              >
            </div>
            @if (getFieldError('offerAmount'); as error) {
              <p class="text-sm flex items-center" 
                 [class.text-red-600]="error.type === 'error'" 
                 [class.text-yellow-600]="error.type === 'warning'">
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ error.message }}
              </p>
            } @else {
              <p class="text-xs text-gray-500">Expected per-business investment</p>
            }
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Minimum Investment -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">Minimum Investment</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">{{ formData.currency || 'ZAR' }}</span>
              <input 
                type="text" 
                placeholder="100,000"
                [value]="formatNumberWithCommas(formData.minInvestment)"
                (input)="onNumberInput('minInvestment', $event)"
                [class]="getFieldClasses('minInvestment')"
                class="pl-16"
              >
            </div>
            @if (getFieldError('minInvestment'); as error) {
              <p class="text-sm flex items-center" 
                 [class.text-red-600]="error.type === 'error'" 
                 [class.text-yellow-600]="error.type === 'warning'">
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ error.message }}
              </p>
            } @else {
              <p class="text-xs text-gray-500">Minimum amount investors can contribute</p>
            }
          </div>

          <!-- Maximum Investment -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">Maximum Investment</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">{{ formData.currency || 'ZAR' }}</span>
              <input 
                type="text" 
                placeholder="2,000,000"
                [value]="formatNumberWithCommas(formData.maxInvestment)"
                (input)="onNumberInput('maxInvestment', $event)"
                [class]="getFieldClasses('maxInvestment')"
                class="pl-16"
              >
            </div>
            @if (getFieldError('maxInvestment'); as error) {
              <p class="text-sm flex items-center" 
                 [class.text-red-600]="error.type === 'error'" 
                 [class.text-yellow-600]="error.type === 'warning'">
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ error.message }}
              </p>
            } @else {
              <p class="text-xs text-gray-500">Maximum amount investors can contribute</p>
            }
          </div>
        </div>

        <!-- Investment Validation Summary -->
        @if (getInvestmentErrors().length > 0) {
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex">
              <lucide-angular [img]="AlertCircleIcon" [size]="20" class="text-red-500 mr-3 mt-0.5"></lucide-angular>
              <div>
                <h4 class="text-sm font-medium text-red-800 mb-2">Investment Amount Issues</h4>
                <ul class="text-sm text-red-700 space-y-1">
                  @for (error of getInvestmentErrors(); track error.field) {
                    <li>• {{ error.message }}</li>
                  }
                </ul>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Terms Section based on funding type -->
      @if (formData.fundingType === 'debt') {
        <div class="bg-gray-50 rounded-xl p-6 space-y-4">
          <div class="flex items-center space-x-2">
            <lucide-angular [img]="FileTextIcon" [size]="20" class="text-gray-600"></lucide-angular>
            <h4 class="text-lg font-semibold text-gray-900">Debt Terms</h4>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-700">Interest Rate (%)</label>
              <div class="relative">
                <input 
                  type="text" 
                  placeholder="12.5"
                  [value]="formData.interestRate"
                  (input)="onFieldChange('interestRate', $event)"
                  [class]="getFieldClasses('interestRate')"
                >
                <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-700">Repayment Terms</label>
              <select 
                [value]="formData.repaymentTerms"
                (change)="onFieldChange('repaymentTerms', $event)"
                [class]="getFieldClasses('repaymentTerms')"
              >
                <option value="">Select terms</option>
                <option value="monthly">Monthly payments</option>
                <option value="quarterly">Quarterly payments</option>
                <option value="annually">Annual payments</option>
                <option value="bullet">Bullet payment at maturity</option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">Security Requirements</label>
            <textarea 
              rows="3" 
              placeholder="Describe any collateral, guarantees, or security requirements..."
              [value]="formData.securityRequired"
              (input)="onFieldChange('securityRequired', $event)"
              [class]="getFieldClasses('securityRequired')"
              class="resize-none"
            ></textarea>
          </div>
        </div>
      }

      @if (formData.fundingType === 'equity') {
        <div class="bg-purple-50 rounded-xl p-6 space-y-4">
          <div class="flex items-center space-x-2">
            <lucide-angular [img]="PieChartIcon" [size]="20" class="text-purple-600"></lucide-angular>
            <h4 class="text-lg font-semibold text-gray-900">Equity Terms</h4>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-700">Equity Offered (%)</label>
              <div class="relative">
                <input 
                  type="text" 
                  placeholder="15"
                  [value]="formData.equityOffered"
                  (input)="onFieldChange('equityOffered', $event)"
                  [class]="getFieldClasses('equityOffered')"
                >
                <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-700">Expected Returns (%)</label>
              <div class="relative">
                <input 
                  type="text" 
                  placeholder="25"
                  [value]="formData.expectedReturns"
                  (input)="onFieldChange('expectedReturns', $event)"
                  [class]="getFieldClasses('expectedReturns')"
                >
                <span class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">% IRR</span>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">Exit Strategy</label>
            <textarea 
              rows="3" 
              placeholder="Describe your preferred exit strategy and timeline..."
              [value]="formData.exitStrategy"
              (input)="onFieldChange('exitStrategy', $event)"
              [class]="getFieldClasses('exitStrategy')"
              class="resize-none"
            ></textarea>
          </div>
        </div>
      }

      <!-- Decision Timeline -->
      <div class="space-y-3">
        <label class="block text-sm font-semibold text-gray-700">
          Decision Timeframe <span class="text-red-500">*</span>
        </label>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          @for (timeframe of timeframes; track timeframe.value) {
            <label class="relative cursor-pointer">
              <input 
                type="radio" 
                name="decisionTimeframe" 
                [value]="timeframe.value"
                [checked]="formData.decisionTimeframe === timeframe.value"
                (change)="onFieldChange('decisionTimeframe', $event)"
                class="sr-only peer"
              >
              <div class="p-3 border border-gray-200 rounded-lg hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 text-center transition-all">
                <div class="font-semibold text-gray-900">{{ timeframe.label }}</div>
                <div class="text-xs text-gray-500">{{ timeframe.description }}</div>
              </div>
            </label>
          }
        </div>
      </div>
    </div>
  `
})
export class InvestmentTermsStepComponent implements OnInit, OnDestroy, FormStepProps {
  @Input() formData!: OpportunityFormData;
  @Input() validationErrors: ValidationError[] = [];
  @Output() onFormChange = new EventEmitter<Partial<OpportunityFormData>>();
  @Output() onValidationChange = new EventEmitter<ValidationError[]>();

  // Icons
  DollarSignIcon = DollarSign;
  TrendingUpIcon = TrendingUp;
  PieChartIcon = PieChart;
  RefreshCwIcon = RefreshCw;
  FileTextIcon = FileText;
  AlertCircleIcon = AlertCircle;
  CalculatorIcon = Calculator;

  private destroy$ = new Subject<void>();
  private validationSubject = new Subject<void>();

  timeframes: TimeframeOption[] = [
    { value: '7', label: '7 days', description: 'Fast track' },
    { value: '30', label: '30 days', description: 'Standard' },
    { value: '60', label: '60 days', description: 'Extended' },
    { value: '90', label: '90 days', description: 'Comprehensive' }
  ];

  ngOnInit() {
    this.validationSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.validateStep();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFieldChange(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const updates = { [field]: target.value };
    
    this.onFormChange.emit(updates);
    this.validationSubject.next();
  }

  onNumberInput(field: NumberFieldKey, event: Event): void {
    const target = event.target as HTMLInputElement;
    let value = target.value;
    
    // Remove non-numeric characters except for the decimal point
    value = value.replace(/[^\d]/g, '');
    
    // Parse to number and format with commas
    const numValue = Number(value) || 0;
    const formattedValue = numValue === 0 ? '' : this.formatNumberWithCommas(numValue);
    
    // Update the input field display
    target.value = formattedValue;
    
    // Update form data with the clean numeric string
    const updates = { [field]: value };
    this.onFormChange.emit(updates);
    this.validationSubject.next();
  }

  formatNumberWithCommas(value: string | number): string {
    if (!value) return '';
    const numValue = typeof value === 'string' ? this.parseNumberValue(value) : value;
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  }

  private parseNumberValue(value: string): number {
    if (!value) return 0;
    // Remove commas and spaces, then parse
    const cleaned = value.replace(/[,\s]/g, '');
    return Number(cleaned) || 0;
  }

  getFieldClasses(fieldName: string): string {
    const baseClasses = 'block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-primary-500 text-sm transition-all';
    
    if (this.hasFieldError(fieldName)) {
      return `${baseClasses} border-red-300 focus:ring-red-500 focus:border-red-500`;
    } else if (this.hasFieldWarning(fieldName)) {
      return `${baseClasses} border-yellow-300 focus:ring-yellow-500 focus:border-yellow-500`;
    }
    
    return `${baseClasses} border-gray-300 focus:ring-primary-500`;
  }

  getFieldError(fieldName: string): ValidationError | null {
    return this.validationErrors.find(error => error.field === fieldName) || null;
  }

  hasFieldError(fieldName: string): boolean {
    return this.validationErrors.some(error => error.field === fieldName && error.type === 'error');
  }

  hasFieldWarning(fieldName: string): boolean {
    return this.validationErrors.some(error => error.field === fieldName && error.type === 'warning');
  }

  getInvestmentErrors(): ValidationError[] {
    const investmentFields = ['fundingType', 'offerAmount', 'minInvestment', 'maxInvestment', 'totalAvailable'];
    return this.validationErrors.filter(error => investmentFields.includes(error.field));
  }

  private validateStep() {
    const errors: ValidationError[] = [];
    
    // Required field validations
    if (!this.formData.fundingType) {
      errors.push({ field: 'fundingType', message: 'Funding type is required', type: 'error' });
    }

    const offerAmount = this.parseNumberValue(this.formData.offerAmount);
    const minInvestment = this.parseNumberValue(this.formData.minInvestment);
    const maxInvestment = this.parseNumberValue(this.formData.maxInvestment);
    const totalAvailable = this.parseNumberValue(this.formData.totalAvailable);

    if (offerAmount <= 0) {
      errors.push({ field: 'offerAmount', message: 'Offer amount must be greater than 0', type: 'error' });
    }

    if (totalAvailable <= 0) {
      errors.push({ field: 'totalAvailable', message: 'Total available must be greater than 0', type: 'error' });
    }

    // Investment range validation
    if (minInvestment > 0 && maxInvestment > 0) {
      if (maxInvestment < minInvestment) {
        errors.push({ 
          field: 'maxInvestment', 
          message: 'Maximum investment must be greater than or equal to minimum investment', 
          type: 'error' 
        });
      }
    }

    // Logical amount validations
    if (offerAmount > 0 && totalAvailable > 0) {
      if (offerAmount > totalAvailable) {
        errors.push({ 
          field: 'offerAmount', 
          message: 'Offer amount cannot exceed total available funding', 
          type: 'error' 
        });
      }
    }

    if (minInvestment > 0 && offerAmount > 0) {
      if (minInvestment > offerAmount) {
        errors.push({ 
          field: 'minInvestment', 
          message: 'Minimum investment cannot exceed the offer amount', 
          type: 'warning' 
        });
      }
    }

    if (maxInvestment > 0 && totalAvailable > 0) {
      if (maxInvestment > totalAvailable) {
        errors.push({ 
          field: 'maxInvestment', 
          message: 'Maximum investment cannot exceed total available funding', 
          type: 'warning' 
        });
      }
    }

    // Keep existing validation errors that are not from this step
    const stepFields = ['fundingType', 'offerAmount', 'minInvestment', 'maxInvestment', 'totalAvailable', 
      'interestRate', 'equityOffered', 'repaymentTerms', 'securityRequired', 'expectedReturns', 
      'exitStrategy', 'decisionTimeframe'];
    
    const nonStepErrors = this.validationErrors.filter(error => !stepFields.includes(error.field));

    this.onValidationChange.emit([...nonStepErrors, ...errors]);
  }
}