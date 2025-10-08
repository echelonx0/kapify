// src/app/funder/components/form-sections/eligibility-filters.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Target, DollarSign } from 'lucide-angular';
import { OpportunityFormStateService } from 'src/app/funder/services/opportunity-form-state.service';
import { OpportunityUIHelperService } from 'src/app/funder/services/ui-helper.service';

 

@Component({
  selector: 'app-eligibility-filters',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Target Industries -->
      <div class="space-y-3">
        <label class="block text-sm font-semibold text-gray-700">Target Industries</label>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          @for (industry of ui.targetIndustries; track industry.value) {
            <label class="relative cursor-pointer">
              <input 
                type="checkbox" 
                [value]="industry.value"
                [checked]="formState.formData().targetIndustries.includes(industry.value)"
                (change)="ui.onMultiSelectChange('targetIndustries', $event)"
                class="sr-only peer"
              >
              <div class="p-3 border border-gray-200 rounded-lg hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 text-center transition-all">
                <div class="text-sm font-medium text-gray-900">{{ industry.label }}</div>
              </div>
            </label>
          }
        </div>
      </div>

      <!-- Revenue Range -->
      <div class="space-y-4">
        <div class="flex items-center space-x-2">
          <lucide-angular [img]="DollarSignIcon" [size]="20" class="text-gray-600"></lucide-angular>
          <h4 class="text-lg font-semibold text-gray-900">Revenue Requirements</h4>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Minimum Revenue -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">Minimum Annual Revenue</label>
            <div class="relative">
               <input 
                type="text" 
                placeholder="1,000,000"
                [value]="ui.formatNumberWithCommas(formState.formData().minRevenue)"
                (input)="ui.onNumberInputChange('minRevenue', $event)"
                [class]="ui.getFieldClasses('minRevenue')"
                class="pl-12"
              >
            </div>
            @if (formState.getFieldError('minRevenue'); as error) {
              <p class="text-sm" [class.text-red-600]="error.type === 'error'" [class.text-yellow-600]="error.type === 'warning'">
                {{ error.message }}
              </p>
            } @else {
              <p class="text-xs text-gray-500">Leave blank for no minimum</p>
            }
          </div>

          <!-- Maximum Revenue -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">Maximum Annual Revenue</label>
            <div class="relative">
              <input 
                type="text" 
                placeholder="50,000,000"
                [value]="ui.formatNumberWithCommas(formState.formData().maxRevenue)"
                (input)="ui.onNumberInputChange('maxRevenue', $event)"
                [class]="ui.getFieldClasses('maxRevenue')"
                class="pl-12"
              >
            </div>
            @if (formState.getFieldError('maxRevenue'); as error) {
              <p class="text-sm" [class.text-red-600]="error.type === 'error'" [class.text-yellow-600]="error.type === 'warning'">
                {{ error.message }}
              </p>
            } @else {
              <p class="text-xs text-gray-500">Leave blank for no maximum</p>
            }
          </div>
        </div>
      </div>

      <!-- Years in Operation -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-gray-700">Minimum Years in Operation</label>
        <select 
          [value]="formState.formData().minYearsOperation"
          (change)="ui.onFieldChange('minYearsOperation', $event)"
          [class]="ui.getFieldClasses('minYearsOperation')"
        >
          <option value="">No minimum</option>
          <option value="1">1 year</option>
          <option value="2">2 years</option>
          <option value="3">3 years</option>
          <option value="5">5 years</option>
        </select>
        @if (formState.getFieldError('minYearsOperation'); as error) {
          <p class="text-sm" [class.text-red-600]="error.type === 'error'" [class.text-yellow-600]="error.type === 'warning'">
            {{ error.message }}
          </p>
        }
      </div>

      <!-- Business Stages -->
      <div class="space-y-3">
        <label class="block text-sm font-semibold text-gray-700">Business Stages</label>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          @for (stage of ui.businessStages; track stage.value) {
            <label class="relative cursor-pointer">
              <input 
                type="checkbox" 
                [value]="stage.value"
                [checked]="formState.formData().businessStages.includes(stage.value)"
                (change)="ui.onMultiSelectChange('businessStages', $event)"
                class="sr-only peer"
              >
              <div class="p-3 border border-gray-200 rounded-lg hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 text-center transition-all">
                <div class="text-sm font-medium text-gray-900">{{ stage.label }}</div>
              </div>
            </label>
          }
        </div>
        @if (formState.getFieldError('businessStages'); as error) {
          <p class="text-sm text-red-600">{{ error.message }}</p>
        }
      </div>

      <!-- Additional Criteria Info Box -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <lucide-angular [img]="TargetIcon" [size]="20" class="text-blue-600 mt-0.5"></lucide-angular>
          <div>
            <h4 class="text-sm font-medium text-blue-900">Targeting Your Investment</h4>
            <p class="text-sm text-blue-700 mt-1">
              These criteria help match your opportunity with the right businesses. 
              More specific criteria mean fewer but more qualified applications.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EligibilityFiltersComponent {
  public formState = inject(OpportunityFormStateService);
  public ui = inject(OpportunityUIHelperService);
  
  // Icons
  TargetIcon = Target;
  DollarSignIcon = DollarSign;
}