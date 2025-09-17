// src/app/funder/components/form-sections/funding-structure.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, TrendingUp, PieChart, RefreshCw } from 'lucide-angular';
import { OpportunityFormStateService } from 'src/app/funder/services/opportunity-form-state.service';
import { OpportunityUIHelperService } from 'src/app/funder/services/ui-helper.service';

 
@Component({
  selector: 'app-funding-structure',
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
              [checked]="formState.formData().fundingType === 'debt'"
              (change)="ui.onFieldChange('fundingType', $event)"
              class="sr-only peer"
            >
            <div class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all"
                 [class.border-red-300]="formState.hasFieldError('fundingType')"
                 [class.hover:border-red-400]="formState.hasFieldError('fundingType')">
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
              [checked]="formState.formData().fundingType === 'equity'"
              (change)="ui.onFieldChange('fundingType', $event)"
              class="sr-only peer"
            >
            <div class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all"
                 [class.border-red-300]="formState.hasFieldError('fundingType')"
                 [class.hover:border-red-400]="formState.hasFieldError('fundingType')">
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
              [checked]="formState.formData().fundingType === 'convertible'"
              (change)="ui.onFieldChange('fundingType', $event)"
              class="sr-only peer"
            >
            <div class="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all"
                 [class.border-red-300]="formState.hasFieldError('fundingType')"
                 [class.hover:border-red-400]="formState.hasFieldError('fundingType')">
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
        @if (formState.getFieldError('fundingType'); as error) {
          <p class="text-sm text-red-600">{{ error.message }}</p>
        }
      </div>

      <!-- Investment Amounts -->
      <div class="space-y-6">
        <h3 class="text-lg font-semibold text-gray-900">Investment Structure</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Total Available -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700">
              Total Available <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">ZAR</span>
              <input 
                type="text" 
                placeholder="5,000,000"
                [value]="ui.formatNumberWithCommas(formState.formData().totalAvailable)"
                (input)="ui.onNumberInputChange('totalAvailable', $event)"
                [class]="ui.getFieldClasses('totalAvailable')"
                class="pl-12"
              >
            </div>
            @if (formState.getFieldError('totalAvailable'); as error) {
              <p class="text-sm" [class.text-red-600]="error.type === 'error'" [class.text-yellow-600]="error.type === 'warning'">
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
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">ZAR</span>
              <input 
                type="text" 
                placeholder="500,000"
                [value]="ui.formatNumberWithCommas(formState.formData().offerAmount)"
                (input)="ui.onNumberInputChange('offerAmount', $event)"
                [class]="ui.getFieldClasses('offerAmount')"
                class="pl-12"
              >
            </div>
            @if (formState.getFieldError('offerAmount'); as error) {
              <p class="text-sm" [class.text-red-600]="error.type === 'error'" [class.text-yellow-600]="error.type === 'warning'">
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
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">ZAR</span>
              <input 
                type="text" 
                placeholder="100,000"
                [value]="ui.formatNumberWithCommas(formState.formData().minInvestment)"
                (input)="ui.onNumberInputChange('minInvestment', $event)"
                [class]="ui.getFieldClasses('minInvestment')"
                class="pl-12"
              >
            </div>
            @if (formState.getFieldError('minInvestment'); as error) {
              <p class="text-sm" [class.text-red-600]="error.type === 'error'" [class.text-yellow-600]="error.type === 'warning'">
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
              <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">ZAR</span>
              <input 
                type="text" 
                placeholder="2,000,000"
                [value]="ui.formatNumberWithCommas(formState.formData().maxInvestment)"
                (input)="ui.onNumberInputChange('maxInvestment', $event)"
                [class]="ui.getFieldClasses('maxInvestment')"
                class="pl-12"
              >
            </div>
            @if (formState.getFieldError('maxInvestment'); as error) {
              <p class="text-sm" [class.text-red-600]="error.type === 'error'" [class.text-yellow-600]="error.type === 'warning'">
                {{ error.message }}
              </p>
            } @else {
              <p class="text-xs text-gray-500">Maximum amount investors can contribute</p>
            }
          </div>
        </div>
      </div>

      <!-- Equity Terms (only for equity funding) -->
      @if (formState.formData().fundingType === 'equity') {
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
                  [value]="formState.formData().equityOffered"
                  (input)="ui.onFieldChange('equityOffered', $event)"
                  [class]="ui.getFieldClasses('equityOffered')"
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
                  [value]="formState.formData().expectedReturns"
                  (input)="ui.onFieldChange('expectedReturns', $event)"
                  [class]="ui.getFieldClasses('expectedReturns')"
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
              [value]="formState.formData().exitStrategy"
              (input)="ui.onFieldChange('exitStrategy', $event)"
              [class]="ui.getFieldClasses('exitStrategy')"
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
          @for (timeframe of ui.timeframes; track timeframe.value) {
            <label class="relative cursor-pointer">
              <input 
                type="radio" 
                name="decisionTimeframe" 
                [value]="timeframe.value"
                [checked]="formState.formData().decisionTimeframe === timeframe.value"
                (change)="ui.onFieldChange('decisionTimeframe', $event)"
                class="sr-only peer"
              >
              <div class="p-3 border border-gray-200 rounded-lg hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 text-center transition-all">
                <div class="font-semibold text-gray-900">{{ timeframe.label }}</div>
                <div class="text-xs text-gray-500">{{ timeframe.description }}</div>
              </div>
            </label>
          }
        </div>
        @if (formState.getFieldError('decisionTimeframe'); as error) {
          <p class="text-sm text-red-600">{{ error.message }}</p>
        }
      </div>
    </div>
  `
})
export class FundingStructureComponent {
  public formState = inject(OpportunityFormStateService);
  public ui = inject(OpportunityUIHelperService);
  
  // Icons
  TrendingUpIcon = TrendingUp;
  PieChartIcon = PieChart;
  RefreshCwIcon = RefreshCw;
}