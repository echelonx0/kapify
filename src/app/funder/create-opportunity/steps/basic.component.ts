// src/app/funder/components/form-sections/opportunity-basics.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FileText, Target } from 'lucide-angular';
import { OpportunityFormStateService } from 'src/app/funder/services/opportunity-form-state.service';
import { OpportunityUIHelperService } from 'src/app/funder/services/ui-helper.service';

 
@Component({
  selector: 'app-opportunity-basics',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Title Field -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-gray-700">
          Opportunity Title <span class="text-red-500">*</span>
        </label>
        <input 
          type="text" 
          placeholder="e.g., Growth Capital for Tech Startups"
          [value]="formState.formData().title"
          (input)="ui.onFieldChange('title', $event)"
          [class]="ui.getFieldClasses('title')"
        >
        @if (formState.getFieldError('title'); as error) {
          <p class="text-sm" [class.text-red-600]="error.type === 'error'" [class.text-yellow-600]="error.type === 'warning'">
            {{ error.message }}
          </p>
        }
      </div>

      <!-- Short Description Field -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-gray-700">
          Short Description <span class="text-red-500">*</span>
        </label>
        <input 
          type="text" 
          placeholder="Brief summary for listings (150 characters max)"
          [value]="formState.formData().shortDescription"
          (input)="ui.onFieldChange('shortDescription', $event)"
          maxlength="150"
          [class]="ui.getFieldClasses('shortDescription')"
        >
        <div class="flex justify-between">
          @if (formState.getFieldError('shortDescription'); as error) {
            <p class="text-sm" [class.text-red-600]="error.type === 'error'" [class.text-yellow-600]="error.type === 'warning'">
              {{ error.message }}
            </p>
          } @else {
            <span></span>
          }
          <p class="text-xs text-gray-500">{{ formState.formData().shortDescription.length }}/150 characters</p>
        </div>
      </div>

      <!-- Full Description Field -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-gray-700">
          Full Description <span class="text-red-500">*</span>
        </label>
        <textarea 
          rows="6" 
          placeholder="Detailed description of your funding opportunity, investment criteria, and what you're looking for in potential partners..."
          [value]="formState.formData().description"
          (input)="ui.onFieldChange('description', $event)"
          [class]="ui.getFieldClasses('description')"
          class="resize-none"
        ></textarea>
        @if (formState.getFieldError('description'); as error) {
          <p class="text-sm" [class.text-red-600]="error.type === 'error'" [class.text-yellow-600]="error.type === 'warning'">
            {{ error.message }}
          </p>
        }
      </div>
    </div>
  `
})
export class OpportunityBasicsComponent {
  public formState = inject(OpportunityFormStateService);
  public ui = inject(OpportunityUIHelperService);
}