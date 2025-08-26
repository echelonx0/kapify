// src/app/funder/components/create-opportunity/steps/eligibility-criteria-step.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Users, Target, Building, MapPin, Calendar, AlertCircle, CheckCircle } from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormStepProps, OpportunityFormData, ValidationError, NumberFieldKey, ArrayFieldKey } from '../shared/form-interfaces';

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-eligibility-criteria-step',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-8">
      <!-- Header with optional indicator -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <lucide-angular [img]="TargetIcon" [size]="20" class="text-blue-600 mt-0.5"></lucide-angular>
          <div>
            <h4 class="text-sm font-medium text-blue-900">Define Your Target Market</h4>
            <p class="text-sm text-blue-700 mt-1">
              Set criteria to help qualified businesses find your opportunity. All fields in this section are optional but help improve matching.
            </p>
          </div>
        </div>
      </div>

      <!-- Target Industries -->
      <div class="space-y-3">
        <label class="block text-sm font-semibold text-gray-700 flex items-center">
          <lucide-angular [img]="BuildingIcon" [size]="16" class="mr-2"></lucide-angular>
          Target Industries
        </label>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          @for (industry of targetIndustries; track industry.value) {
            <label class="relative cursor-pointer">
              <input 
                type="checkbox" 
                [value]="industry.value"
                [checked]="formData.targetIndustries.includes(industry.value)"
                (change)="onMultiSelectChange('targetIndustries', $event)"
                class="sr-only peer"
              >
              <div class="p-3 border border-gray-200 rounded-lg hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 text-center transition-all">
                <div class="text-sm font-medium text-gray-900">{{ industry.label }}</div>
              </div>
            </label>
          }
        </div>
        @if (formData.targetIndustries.length > 0) {
          <div class="mt-2 flex flex-wrap gap-2">
            @for (industryValue of formData.targetIndustries; track industryValue) {
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800">
                {{ getIndustryLabel(industryValue) }}
                <button 
                  type="button"
                  (click)="removeFromArray('targetIndustries', industryValue)"
                  class="ml-1 text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            }
          </div>
        }
      </div>

      <!-- Business Stages -->
      <div class="space-y-3">
        <label class="block text-sm font-semibold text-gray-700 flex items-center">
          <lucide-angular [img]="CalendarIcon" [size]="16" class="mr-2"></lucide-angular>
          Business Stages
        </label>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          @for (stage of businessStages; track stage.value) {
            <label class="relative cursor-pointer">
              <input 
                type="checkbox" 
                [value]="stage.value"
                [checked]="formData.businessStages.includes(stage.value)"
                (change)="onMultiSelectChange('businessStages', $event)"
                class="sr-only peer"
              >
              <div class="p-3 border border-gray-200 rounded-lg hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 text-center transition-all">
                <div class="text-sm font-medium text-gray-900">{{ stage.label }}</div>
              </div>
            </label>
          }
        </div>
        @if (formData.businessStages.length > 0) {
          <div class="mt-2 flex flex-wrap gap-2">
            @for (stageValue of formData.businessStages; track stageValue) {
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                {{ getStageLabel(stageValue) }}
                <button 
                  type="button"
                  (click)="removeFromArray('businessStages', stageValue)"
                  class="ml-1 text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </span>
            }
          </div>
        }
      </div>

      <!-- Revenue Range -->
      <div class="space-y-6">
        <div class="flex items-center space-x-2">
          <lucide-angular [img]="TargetIcon" [size]="20" class="text-primary-600"></lucide-angular>
          <h3 class="text-lg font-semibold text-gray-900">Revenue Requirements</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Minimum Revenue -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">Minimum Annual Revenue</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">{{ formData.currency || 'ZAR' }}</span>
              <input 
                type="text" 
                placeholder="1,000,000"
                [value]="formatNumberWithCommas(formData.minRevenue)"
                (input)="onNumberInput('minRevenue', $event)"
                [class]="getFieldClasses('minRevenue')"
                class="pl-16"
              >
            </div>
            @if (getFieldError('minRevenue'); as error) {
              <p class="text-sm flex items-center" 
                 [class.text-red-600]="error.type === 'error'" 
                 [class.text-yellow-600]="error.type === 'warning'">
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ error.message }}
              </p>
            } @else {
              <p class="text-xs text-gray-500">Minimum annual revenue requirement</p>
            }
          </div>

          <!-- Maximum Revenue -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">Maximum Annual Revenue</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">{{ formData.currency || 'ZAR' }}</span>
              <input 
                type="text" 
                placeholder="50,000,000"
                [value]="formatNumberWithCommas(formData.maxRevenue)"
                (input)="onNumberInput('maxRevenue', $event)"
                [class]="getFieldClasses('maxRevenue')"
                class="pl-16"
              >
            </div>
            @if (getFieldError('maxRevenue'); as error) {
              <p class="text-sm flex items-center" 
                 [class.text-red-600]="error.type === 'error'" 
                 [class.text-yellow-600]="error.type === 'warning'">
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ error.message }}
              </p>
            } @else {
              <p class="text-xs text-gray-500">Maximum annual revenue (optional cap)</p>
            }
          </div>
        </div>
      </div>

      <!-- Operating Experience -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-gray-700 flex items-center">
          <lucide-angular [img]="CalendarIcon" [size]="16" class="mr-2"></lucide-angular>
          Minimum Years in Operation
        </label>
        <select 
          [value]="formData.minYearsOperation"
          (change)="onFieldChange('minYearsOperation', $event)"
          [class]="getFieldClasses('minYearsOperation')"
        >
          <option value="">No minimum</option>
          <option value="1">1 year</option>
          <option value="2">2 years</option>
          <option value="3">3 years</option>
          <option value="5">5 years</option>
          <option value="10">10 years</option>
        </select>
        <p class="text-xs text-gray-500">How long should businesses be operating before applying?</p>
      </div>

      <!-- Geographic Restrictions -->
      <div class="space-y-3">
        <label class="block text-sm font-semibold text-gray-700 flex items-center">
          <lucide-angular [img]="MapPinIcon" [size]="16" class="mr-2"></lucide-angular>
          Geographic Focus
        </label>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          @for (location of geographicOptions; track location.value) {
            <label class="relative cursor-pointer">
              <input 
                type="checkbox" 
                [value]="location.value"
                [checked]="formData.geographicRestrictions.includes(location.value)"
                (change)="onMultiSelectChange('geographicRestrictions', $event)"
                class="sr-only peer"
              >
              <div class="p-3 border border-gray-200 rounded-lg hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 text-center transition-all">
                <div class="text-sm font-medium text-gray-900">{{ location.label }}</div>
              </div>
            </label>
          }
        </div>
        @if (formData.geographicRestrictions.length > 0) {
          <div class="mt-2 flex flex-wrap gap-2">
            @for (locationValue of formData.geographicRestrictions; track locationValue) {
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                {{ getLocationLabel(locationValue) }}
                <button 
                  type="button"
                  (click)="removeFromArray('geographicRestrictions', locationValue)"
                  class="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            }
          </div>
        } @else {
          <p class="text-xs text-gray-500 mt-2">No restrictions selected - opportunity is available nationwide</p>
        }
      </div>

      <!-- Additional Requirements -->
      <div class="space-y-4">
        <div class="flex items-center space-x-2">
          <lucide-angular [img]="UsersIcon" [size]="20" class="text-primary-600"></lucide-angular>
          <h3 class="text-lg font-semibold text-gray-900">Additional Requirements</h3>
        </div>

        <div class="space-y-4">
          <label class="flex items-start space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              [checked]="formData.requiresCollateral"
              (change)="onCheckboxChange('requiresCollateral', $event)"
              class="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            >
            <div>
              <div class="font-medium text-gray-900">Requires Collateral</div>
              <p class="text-sm text-gray-600">Businesses must provide collateral or guarantees for this opportunity</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Summary Section -->
      @if (getCriteriaCount() > 0) {
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <lucide-angular [img]="CheckCircleIcon" [size]="20" class="text-green-600 mt-0.5"></lucide-angular>
            <div>
              <h4 class="text-sm font-medium text-green-800">Eligibility Criteria Set</h4>
              <p class="text-sm text-green-700 mt-1">
                You've defined {{ getCriteriaCount() }} eligibility criteria. This will help match your opportunity with suitable businesses.
              </p>
              <div class="mt-2 space-y-1 text-sm text-green-700">
                @if (formData.targetIndustries.length > 0) {
                  <div>• Target Industries: {{ formData.targetIndustries.length }} selected</div>
                }
                @if (formData.businessStages.length > 0) {
                  <div>• Business Stages: {{ formData.businessStages.length }} selected</div>
                }
                @if (formData.minRevenue) {
                  <div>• Minimum Revenue: {{ formatCurrency(formData.minRevenue) }}</div>
                }
                @if (formData.maxRevenue) {
                  <div>• Maximum Revenue: {{ formatCurrency(formData.maxRevenue) }}</div>
                }
                @if (formData.minYearsOperation) {
                  <div>• Minimum Operating Years: {{ formData.minYearsOperation }}</div>
                }
                @if (formData.geographicRestrictions.length > 0) {
                  <div>• Geographic Focus: {{ formData.geographicRestrictions.length }} regions</div>
                }
                @if (formData.requiresCollateral) {
                  <div>• Collateral Required</div>
                }
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <lucide-angular [img]="TargetIcon" [size]="20" class="text-gray-600 mt-0.5"></lucide-angular>
            <div>
              <h4 class="text-sm font-medium text-gray-800">No Criteria Set</h4>
              <p class="text-sm text-gray-600 mt-1">
                Your opportunity will be available to all businesses. Consider adding some criteria to help target the right applicants.
              </p>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class EligibilityCriteriaStepComponent implements OnInit, OnDestroy, FormStepProps {
  @Input() formData!: OpportunityFormData;
  @Input() validationErrors: ValidationError[] = [];
  @Output() onFormChange = new EventEmitter<Partial<OpportunityFormData>>();
  @Output() onValidationChange = new EventEmitter<ValidationError[]>();

  // Icons
  UsersIcon = Users;
  TargetIcon = Target;
  BuildingIcon = Building;
  MapPinIcon = MapPin;
  CalendarIcon = Calendar;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;

  private destroy$ = new Subject<void>();
  private validationSubject = new Subject<void>();

  targetIndustries: SelectOption[] = [
    { value: 'technology', label: 'Technology' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'retail', label: 'Retail' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'construction', label: 'Construction' },
    { value: 'transport', label: 'Transportation' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'education', label: 'Education' },
    { value: 'energy', label: 'Energy' },
    { value: 'media', label: 'Media & Communications' }
  ];

  businessStages: SelectOption[] = [
    { value: 'startup', label: 'Startup' },
    { value: 'early-stage', label: 'Early Stage' },
    { value: 'growth', label: 'Growth' },
    { value: 'expansion', label: 'Expansion' },
    { value: 'mature', label: 'Mature' },
    { value: 'turnaround', label: 'Turnaround' }
  ];

  geographicOptions: SelectOption[] = [
    { value: 'western-cape', label: 'Western Cape' },
    { value: 'gauteng', label: 'Gauteng' },
    { value: 'kwazulu-natal', label: 'KwaZulu-Natal' },
    { value: 'eastern-cape', label: 'Eastern Cape' },
    { value: 'free-state', label: 'Free State' },
    { value: 'limpopo', label: 'Limpopo' },
    { value: 'mpumalanga', label: 'Mpumalanga' },
    { value: 'north-west', label: 'North West' },
    { value: 'northern-cape', label: 'Northern Cape' }
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
    const target = event.target as HTMLSelectElement;
    const updates = { [field]: target.value };
    
    this.onFormChange.emit(updates);
    this.validationSubject.next();
  }

  onCheckboxChange(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLInputElement;
    const updates = { [field]: target.checked };
    
    this.onFormChange.emit(updates);
    this.validationSubject.next();
  }

  onMultiSelectChange(field: ArrayFieldKey, event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    const checked = target.checked;
    
    const currentArray = this.formData[field] as string[];
    let newArray: string[];
    
    if (checked) {
      newArray = [...currentArray, value];
    } else {
      newArray = currentArray.filter(item => item !== value);
    }
    
    const updates = { [field]: newArray };
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

  removeFromArray(field: ArrayFieldKey, valueToRemove: string) {
    const currentArray = this.formData[field] as string[];
    const newArray = currentArray.filter(item => item !== valueToRemove);
    
    const updates = { [field]: newArray };
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

  formatCurrency(value: string): string {
    if (!value) return '';
    const numValue = this.parseNumberValue(value);
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(numValue);
  }

  private parseNumberValue(value: string): number {
    if (!value) return 0;
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

  getIndustryLabel(value: string): string {
    return this.targetIndustries.find(i => i.value === value)?.label || value;
  }

  getStageLabel(value: string): string {
    return this.businessStages.find(s => s.value === value)?.label || value;
  }

  getLocationLabel(value: string): string {
    return this.geographicOptions.find(l => l.value === value)?.label || value;
  }

  getCriteriaCount(): number {
    let count = 0;
    if (this.formData.targetIndustries.length > 0) count++;
    if (this.formData.businessStages.length > 0) count++;
    if (this.formData.minRevenue) count++;
    if (this.formData.maxRevenue) count++;
    if (this.formData.minYearsOperation) count++;
    if (this.formData.geographicRestrictions.length > 0) count++;
    if (this.formData.requiresCollateral) count++;
    return count;
  }

  private validateStep() {
    const errors: ValidationError[] = [];
    
    // Revenue range validation
    if (this.formData.minRevenue && this.formData.maxRevenue) {
      const minRev = this.parseNumberValue(this.formData.minRevenue);
      const maxRev = this.parseNumberValue(this.formData.maxRevenue);
      if (minRev > 0 && maxRev > 0 && maxRev < minRev) {
        errors.push({ 
          field: 'maxRevenue', 
          message: 'Maximum revenue must be greater than minimum revenue', 
          type: 'error' 
        });
      }
    }

    // Keep existing validation errors that are not from this step
    const stepFields = ['minRevenue', 'maxRevenue', 'minYearsOperation'];
    const nonStepErrors = this.validationErrors.filter(error => !stepFields.includes(error.field));

    this.onValidationChange.emit([...nonStepErrors, ...errors]);
  }
}