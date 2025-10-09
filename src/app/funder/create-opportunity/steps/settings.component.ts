// src/app/funder/create-opportunity/steps/settings.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Eye, Settings, Calendar, Info } from 'lucide-angular';
import { OpportunityFormStateService } from 'src/app/funder/services/opportunity-form-state.service';
import { OpportunityUIHelperService } from 'src/app/funder/services/ui-helper.service';

@Component({
  selector: 'app-application-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      
      <!-- Visibility Settings Section -->
      <div class="settings-section">
        <div class="settings-section-header">
          <lucide-angular [img]="EyeIcon" [size]="20" class="text-primary-600 mr-3"></lucide-angular>
          <h3>Visibility Settings</h3>
        </div>
        
        <div class="space-y-4">
          <!-- Public Opportunity -->
          <label class="form-check-label settings-option">
            <input 
              type="checkbox" 
              [checked]="formState.formData().isPublic"
              (change)="ui.onCheckboxChange('isPublic', $event)"
            >
            <div class="flex-1">
              <div class="settings-option-title">Public Opportunity</div>
              <p class="settings-option-description">
                Make this opportunity visible to all qualified SMEs on the platform
              </p>
            </div>
          </label>

          <!-- Auto-match Applications -->
          <label class="form-check-label settings-option">
            <input 
              type="checkbox" 
              [checked]="formState.formData().autoMatch"
              (change)="ui.onCheckboxChange('autoMatch', $event)"
            >
            <div class="flex-1">
              <div class="settings-option-title">Auto-match Applications</div>
              <p class="settings-option-description">
                Automatically suggest this opportunity to qualified businesses
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- Application Settings Section -->
      <div class="settings-section">
        <div class="settings-section-header">
          <lucide-angular [img]="SettingsIcon" [size]="20" class="text-primary-600 mr-3"></lucide-angular>
          <h3>Application Settings</h3>
        </div>
        
        <div class="space-y-6">
          <!-- Application Deadline -->
          <div class="space-y-4">
            <label class="block text-sm font-semibold text-gray-700">
              Does this opportunity have a deadline?
            </label>
            
            <div class="flex space-x-6">
              <label class="form-check-label">
                <input 
                  type="radio" 
                  name="hasDeadline" 
                  value="yes"
                  [checked]="hasDeadlinePreference()"
                  (change)="onDeadlineToggle(true)"
                >
                <span class="text-sm font-medium text-gray-700">Yes</span>
              </label>
              
              <label class="form-check-label">
                <input 
                  type="radio" 
                  name="hasDeadline" 
                  value="no"
                  [checked]="!hasDeadlinePreference()"
                  (change)="onDeadlineToggle(false)"
                >
                <span class="text-sm font-medium text-gray-700">No</span>
              </label>
            </div>

            <!-- Deadline Date Field -->
            @if (hasDeadlinePreference()) {
              <div class="ml-8 space-y-2 mt-4">
                <label class="block text-sm font-semibold text-gray-700 flex items-center">
                  <lucide-angular [img]="CalendarIcon" [size]="16" class="mr-2 text-gray-500"></lucide-angular>
                  Application Deadline
                </label>
                <input 
                  type="date" 
                  [value]="formState.formData().applicationDeadline"
                  (input)="ui.onFieldChange('applicationDeadline', $event)"
                  [class]="ui.getFieldClasses('applicationDeadline')"
                  [min]="getMinDate()"
                  class="w-full max-w-xs"
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
            <label class="block text-sm font-semibold text-gray-700">
              Maximum Applications
            </label>
            <input 
              type="text" 
              placeholder="No limit"
              [value]="ui.formatNumberWithCommas(formState.formData().maxApplications)"
              (input)="ui.onNumberInputChange('maxApplications', $event)"
              [class]="ui.getFieldClasses('maxApplications')"
              class="w-full max-w-xs"
            >
            @if (formState.getFieldError('maxApplications'); as error) {
              <p class="text-sm" [class.text-red-600]="error.type === 'error'" [class.text-yellow-600]="error.type === 'warning'">
                {{ error.message }}
              </p>
            } @else {
              <p class="text-xs text-gray-500">Leave blank for unlimited applications</p>
            }
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-start space-x-3">
          <lucide-angular [img]="InfoIcon" [size]="20" class="text-green-600 mt-0.5 flex-shrink-0"></lucide-angular>
          <div>
            <h4 class="text-sm font-medium text-green-900 mb-1">Application Management</h4>
            <p class="text-sm text-green-700 leading-relaxed">
              These settings help you control the application flow. You can always adjust them later, 
              and we'll notify applicants of any changes to deadlines.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ApplicationSettingsComponent implements OnInit {
  public formState = inject(OpportunityFormStateService);
  public ui = inject(OpportunityUIHelperService);
  
  // Icons
  EyeIcon = Eye;
  SettingsIcon = Settings;
  CalendarIcon = Calendar;
  InfoIcon = Info;

  // Track deadline preference
  hasDeadlinePreference = signal<boolean>(false);

  ngOnInit() {
    const existingDeadline = this.formState.formData().applicationDeadline;
    this.hasDeadlinePreference.set(!!(existingDeadline && existingDeadline.trim()));
  }

  onDeadlineToggle(hasDeadline: boolean): void {
    this.hasDeadlinePreference.set(hasDeadline);
    
    if (!hasDeadline) {
      const event = { target: { value: '' } } as any;
      this.ui.onFieldChange('applicationDeadline', event);
    }
  }

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
}