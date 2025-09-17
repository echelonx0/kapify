// src/app/funder/components/form-sections/application-settings.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Eye, Settings, Calendar } from 'lucide-angular';

import { OpportunityFormStateService } from '../../services/opportunity-form-state.service';
import { OpportunityUIHelperService } from '../../services/ui-helper.service';

@Component({
  selector: 'app-application-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Visibility Settings -->
      <div class="space-y-4">
        <div class="flex items-center space-x-2">
          <lucide-angular [img]="EyeIcon" [size]="20" class="text-gray-600"></lucide-angular>
          <h3 class="text-lg font-semibold text-gray-900">Visibility Settings</h3>
        </div>
        
        <div class="space-y-4">
          <label class="flex items-start space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              [checked]="formState.formData().isPublic"
              (change)="ui.onCheckboxChange('isPublic', $event)"
              class="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            >
            <div>
              <div class="font-medium text-gray-900">Public Opportunity</div>
              <p class="text-sm text-gray-600">Make this opportunity visible to all qualified SMEs on the platform</p>
            </div>
          </label>

          <label class="flex items-start space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              [checked]="formState.formData().autoMatch"
              (change)="ui.onCheckboxChange('autoMatch', $event)"
              class="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            >
            <div>
              <div class="font-medium text-gray-900">Auto-match Applications</div>
              <p class="text-sm text-gray-600">Automatically suggest this opportunity to qualified businesses</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Application Settings -->
      <div class="space-y-4">
        <div class="flex items-center space-x-2">
          <lucide-angular [img]="SettingsIcon" [size]="20" class="text-gray-600"></lucide-angular>
          <h3 class="text-lg font-semibold text-gray-900">Application Settings</h3>
        </div>
        
        <!-- Application Deadline Section -->
        <div class="space-y-4">
          <div class="space-y-3">
            <label class="block text-sm font-semibold text-gray-700">
              Does this opportunity have a deadline?
            </label>
            <div class="flex space-x-6">
              <label class="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="hasDeadline" 
                  value="yes"
                  [checked]="hasDeadlinePreference()"
                  (change)="onDeadlineToggle(true)"
                  class="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                >
                <span class="ml-2 text-sm text-gray-700">Yes</span>
              </label>
              <label class="flex items-center cursor-pointer">
                <input 
                  type="radio" 
                  name="hasDeadline" 
                  value="no"
                  [checked]="!hasDeadlinePreference()"
                  (change)="onDeadlineToggle(false)"
                  class="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                >
                <span class="ml-2 text-sm text-gray-700">No</span>
              </label>
            </div>
          </div>

          <!-- Deadline Date Field (conditional) -->
          @if (hasDeadlinePreference()) {
            <div class="ml-6 space-y-2">
              <label class="block text-sm font-semibold text-gray-700 flex items-center">
                <lucide-angular [img]="CalendarIcon" [size]="16" class="mr-2"></lucide-angular>
                Application Deadline
              </label>
              <input 
                type="date" 
                [value]="formState.formData().applicationDeadline"
                (input)="ui.onFieldChange('applicationDeadline', $event)"
                [class]="ui.getFieldClasses('applicationDeadline')"
                [min]="getMinDate()"
              >
              @if (formState.getFieldError('applicationDeadline'); as error) {
                <p class="text-sm" [class.text-red-600]="error.type === 'error'" [class.text-yellow-600]="error.type === 'warning'">
                  {{ error.message }}
                </p>
              }
            </div>
          }
        </div>

        <!-- Maximum Applications -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700">Maximum Applications</label>
          <input 
            type="text" 
            placeholder="No limit"
            [value]="ui.formatNumberWithCommas(formState.formData().maxApplications)"
            (input)="ui.onNumberInputChange('maxApplications', $event)"
            [class]="ui.getFieldClasses('maxApplications')"
          >
          @if (formState.getFieldError('maxApplications'); as error) {
            <p class="text-sm" [class.text-red-600]="error.type === 'error'" [class.text-yellow-600]="error.type === 'warning'">
              {{ error.message }}
            </p>
          } @else {
            <p class="text-xs text-gray-500">Leave blank to allow unlimited applications</p>
          }
        </div>
      </div>

      <!-- Settings Info Box -->
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <lucide-angular [img]="SettingsIcon" [size]="20" class="text-green-600 mt-0.5"></lucide-angular>
          <div>
            <h4 class="text-sm font-medium text-green-900">Application Management</h4>
            <p class="text-sm text-green-700 mt-1">
              These settings help you control the application flow. You can always adjust them later, 
              and we'll notify applicants of any changes to deadlines.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ApplicationSettingsComponent implements OnInit {
  public formState = inject(OpportunityFormStateService);
  public ui = inject(OpportunityUIHelperService);
  
  // Icons
  EyeIcon = Eye;
  SettingsIcon = Settings;
  CalendarIcon = Calendar;

  // Track deadline preference separately from the actual date
  hasDeadlinePreference = signal<boolean>(false);

  ngOnInit() {
    // Initialize based on existing deadline
    const existingDeadline = this.formState.formData().applicationDeadline;
    this.hasDeadlinePreference.set(!!(existingDeadline && existingDeadline.trim()));
  }

  // Handle deadline toggle
  onDeadlineToggle(hasDeadline: boolean): void {
    this.hasDeadlinePreference.set(hasDeadline);
    
    if (!hasDeadline) {
      // Clear deadline if user chooses "No"
      const event = {
        target: { value: '' }
      } as any;
      this.ui.onFieldChange('applicationDeadline', event);
    }
  }

  // Get minimum date (today)
  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}