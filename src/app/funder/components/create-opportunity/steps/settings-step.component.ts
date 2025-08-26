// src/app/funder/components/create-opportunity/steps/settings-step.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Settings, Eye, Users, Calendar, Globe, Shield, AlertCircle, CheckCircle, Clock } from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormStepProps, OpportunityFormData, ValidationError, NumberFieldKey } from '../shared/form-interfaces';

@Component({
  selector: 'app-settings-step',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-8">
      <!-- Visibility Settings -->
      <div class="space-y-6">
        <div class="flex items-center space-x-2">
          <lucide-angular [img]="EyeIcon" [size]="20" class="text-primary-600"></lucide-angular>
          <h3 class="text-lg font-semibold text-gray-900">Visibility Settings</h3>
        </div>
        
        <div class="space-y-4">
          <label class="flex items-start space-x-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                 [class.border-primary-500]="formData.isPublic"
                 [class.bg-primary-50]="formData.isPublic">
            <input 
              type="checkbox" 
              [checked]="formData.isPublic"
              (change)="onCheckboxChange('isPublic', $event)"
              class="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            >
            <div class="flex-1">
              <div class="flex items-center space-x-2">
                <lucide-angular [img]="GlobeIcon" [size]="16" class="text-primary-600"></lucide-angular>
                <div class="font-medium text-gray-900">Public Opportunity</div>
                @if (formData.isPublic) {
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <lucide-angular [img]="CheckCircleIcon" [size]="12" class="mr-1"></lucide-angular>
                    Active
                  </span>
                }
              </div>
              <p class="text-sm text-gray-600 mt-1">Make this opportunity visible to all qualified SMEs on the platform</p>
              @if (formData.isPublic) {
                <div class="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                  <lucide-angular [img]="CheckCircleIcon" [size]="14" class="inline mr-1"></lucide-angular>
                  This opportunity will appear in public listings and search results
                </div>
              }
            </div>
          </label>

          <label class="flex items-start space-x-3 cursor-pointer p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                 [class.border-primary-500]="formData.autoMatch"
                 [class.bg-primary-50]="formData.autoMatch">
            <input 
              type="checkbox" 
              [checked]="formData.autoMatch"
              (change)="onCheckboxChange('autoMatch', $event)"
              class="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            >
            <div class="flex-1">
              <div class="flex items-center space-x-2">
                <lucide-angular [img]="UsersIcon" [size]="16" class="text-primary-600"></lucide-angular>
                <div class="font-medium text-gray-900">Auto-match Applications</div>
                @if (formData.autoMatch) {
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <lucide-angular [img]="CheckCircleIcon" [size]="12" class="mr-1"></lucide-angular>
                    Enabled
                  </span>
                }
              </div>
              <p class="text-sm text-gray-600 mt-1">Automatically suggest this opportunity to qualified businesses</p>
              @if (formData.autoMatch) {
                <div class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  <lucide-angular [img]="CheckCircleIcon" [size]="14" class="inline mr-1"></lucide-angular>
                  Our AI will proactively match your opportunity with suitable businesses
                </div>
              }
            </div>
          </label>
        </div>
      </div>

      <!-- Application Settings -->
      <div class="space-y-6">
        <div class="flex items-center space-x-2">
          <lucide-angular [img]="SettingsIcon" [size]="20" class="text-primary-600"></lucide-angular>
          <h3 class="text-lg font-semibold text-gray-900">Application Settings</h3>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Application Deadline -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700 flex items-center">
              <lucide-angular [img]="CalendarIcon" [size]="16" class="mr-2"></lucide-angular>
              Application Deadline
            </label>
            <input 
              type="date" 
              [value]="formData.applicationDeadline"
              [min]="getMinDate()"
              (input)="onFieldChange('applicationDeadline', $event)"
              [class]="getFieldClasses('applicationDeadline')"
            >
            @if (getFieldError('applicationDeadline'); as error) {
              <p class="text-sm flex items-center text-red-600">
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ error.message }}
              </p>
            } @else {
              <p class="text-xs text-gray-500">
                @if (formData.applicationDeadline) {
                  Applications close on {{ formatDate(formData.applicationDeadline) }}
                } @else {
                  Leave empty for no deadline
                }
              </p>
            }
          </div>

          <!-- Maximum Applications -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700 flex items-center">
              <lucide-angular [img]="UsersIcon" [size]="16" class="mr-2"></lucide-angular>
              Maximum Applications
            </label>
            <input 
              type="text" 
              placeholder="No limit"
              [value]="formatNumberWithCommas(formData.maxApplications)"
              (input)="onNumberInput('maxApplications', $event)"
              [class]="getFieldClasses('maxApplications')"
            >
            @if (getFieldError('maxApplications'); as error) {
              <p class="text-sm flex items-center" 
                 [class.text-red-600]="error.type === 'error'" 
                 [class.text-yellow-600]="error.type === 'warning'">
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ error.message }}
              </p>
            } @else {
              <p class="text-xs text-gray-500">
                @if (formData.maxApplications) {
                  Will close after {{ formatNumberWithCommas(formData.maxApplications) }} applications
                } @else {
                  No limit on number of applications
                }
              </p>
            }
          </div>
        </div>
      </div>

      <!-- Advanced Settings -->
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <lucide-angular [img]="ShieldIcon" [size]="20" class="text-primary-600"></lucide-angular>
            <h3 class="text-lg font-semibold text-gray-900">Advanced Settings</h3>
          </div>
          <button 
            type="button"
            (click)="toggleAdvancedSettings()"
            class="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            {{ showAdvanced ? 'Hide' : 'Show' }} Advanced
          </button>
        </div>

        @if (showAdvanced) {
          <div class="bg-gray-50 rounded-lg p-6 space-y-4">
            <div class="space-y-4">
              <!-- Currency Selection -->
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Default Currency</label>
                <select 
                  [value]="formData.currency"
                  (change)="onFieldChange('currency', $event)"
                  [class]="getFieldClasses('currency')"
                >
                  <option value="ZAR">ZAR - South African Rand</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
                <p class="text-xs text-gray-500">Currency for all monetary amounts in this opportunity</p>
              </div>

              <!-- Use of Funds -->
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Preferred Use of Funds</label>
                <textarea 
                  rows="3" 
                  placeholder="Describe how you expect businesses to use the funding (e.g., equipment, inventory, marketing, expansion)..."
                  [value]="formData.useOfFunds"
                  (input)="onFieldChange('useOfFunds', $event)"
                  [class]="getFieldClasses('useOfFunds')"
                  class="resize-none"
                ></textarea>
                <p class="text-xs text-gray-500">This helps applicants understand your expectations</p>
              </div>

              <!-- Investment Structure -->
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-700">Investment Structure</label>
                <textarea 
                  rows="3" 
                  placeholder="Describe the structure of your investment (tranches, milestones, board representation, etc.)..."
                  [value]="formData.investmentStructure"
                  (input)="onFieldChange('investmentStructure', $event)"
                  [class]="getFieldClasses('investmentStructure')"
                  class="resize-none"
                ></textarea>
                <p class="text-xs text-gray-500">Explain how the investment will be structured</p>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Settings Summary -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <lucide-angular [img]="SettingsIcon" [size]="20" class="text-blue-600 mt-0.5"></lucide-angular>
          <div class="flex-1">
            <h4 class="text-sm font-medium text-blue-800 mb-2">Current Settings Summary</h4>
            <div class="space-y-1 text-sm text-blue-700">
              <div class="flex items-center justify-between">
                <span>Visibility:</span>
                <span class="font-medium">{{ formData.isPublic ? 'Public' : 'Private' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Auto-matching:</span>
                <span class="font-medium">{{ formData.autoMatch ? 'Enabled' : 'Disabled' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span>Application Deadline:</span>
                <span class="font-medium">
                  @if (formData.applicationDeadline) {
                    {{ formatDate(formData.applicationDeadline) }}
                  } @else {
                    No deadline
                  }
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span>Max Applications:</span>
                <span class="font-medium">
                  @if (formData.maxApplications) {
                    {{ formatNumberWithCommas(formData.maxApplications) }}
                  } @else {
                    No limit
                  }
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span>Currency:</span>
                <span class="font-medium">{{ formData.currency || 'ZAR' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <lucide-angular [img]="ClockIcon" [size]="20" class="text-yellow-600 mt-0.5"></lucide-angular>
          <div>
            <h4 class="text-sm font-medium text-yellow-800">Recommendations</h4>
            <ul class="mt-2 text-sm text-yellow-700 space-y-1">
              @if (!formData.isPublic) {
                <li>• Consider making your opportunity public to reach more qualified businesses</li>
              }
              @if (!formData.autoMatch) {
                <li>• Enable auto-matching to help qualified businesses find your opportunity</li>
              }
              @if (!formData.applicationDeadline) {
                <li>• Setting a deadline can create urgency and improve application quality</li>
              }
              @if (!formData.maxApplications) {
                <li>• Consider limiting applications to manage your review workload effectively</li>
              }
            </ul>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsStepComponent implements OnInit, OnDestroy, FormStepProps {
  @Input() formData!: OpportunityFormData;
  @Input() validationErrors: ValidationError[] = [];
  @Output() onFormChange = new EventEmitter<Partial<OpportunityFormData>>();
  @Output() onValidationChange = new EventEmitter<ValidationError[]>();

  // Icons
  SettingsIcon = Settings;
  EyeIcon = Eye;
  UsersIcon = Users;
  CalendarIcon = Calendar;
  GlobeIcon = Globe;
  ShieldIcon = Shield;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;

  private destroy$ = new Subject<void>();
  private validationSubject = new Subject<void>();

  showAdvanced = false;

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

  onCheckboxChange(field: keyof OpportunityFormData, event: Event) {
    const target = event.target as HTMLInputElement;
    const updates = { [field]: target.checked };
    
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

  getMinDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  toggleAdvancedSettings() {
    this.showAdvanced = !this.showAdvanced;
  }

  private validateStep() {
    const errors: ValidationError[] = [];
    
    // Application deadline validation
    if (this.formData.applicationDeadline) {
      const deadline = new Date(this.formData.applicationDeadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadline <= today) {
        errors.push({
          field: 'applicationDeadline',
          message: 'Application deadline must be in the future',
          type: 'error'
        });
      }
    }

    // Max applications validation
    if (this.formData.maxApplications) {
      const maxApps = this.parseNumberValue(this.formData.maxApplications);
      if (maxApps <= 0) {
        errors.push({
          field: 'maxApplications',
          message: 'Maximum applications must be greater than 0',
          type: 'error'
        });
      } else if (maxApps < 5) {
        errors.push({
          field: 'maxApplications',
          message: 'Consider allowing at least 5 applications for better selection',
          type: 'warning'
        });
      }
    }

    // Keep existing validation errors that are not from this step
    const stepFields = ['applicationDeadline', 'maxApplications', 'currency', 'useOfFunds', 'investmentStructure'];
    const nonStepErrors = this.validationErrors.filter(error => !stepFields.includes(error.field));

    this.onValidationChange.emit([...nonStepErrors, ...errors]);
  }
}