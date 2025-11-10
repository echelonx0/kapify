// src/app/funder/components/form-sections/media-branding.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Sparkles,
  Eye,
  Users,
  Settings,
  Lightbulb,
  CircleAlert,
} from 'lucide-angular';
import { OpportunityFormStateService } from 'src/app/funder/services/opportunity-form-state.service';
import { OpportunityUIHelperService } from 'src/app/funder/services/ui-helper.service';

@Component({
  selector: 'app-media-branding',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-2 mt-8">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-2">
          <h3 class="text-lg font-semibold text-gray-900">Media & Branding</h3>
        </div>
        <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
          >Optional</span
        >
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div class="flex items-start space-x-3">
          <lucide-angular
            [img]="LightbulbIcon"
            [size]="20"
            class="text-blue-600 mt-0.5"
          ></lucide-angular>
          <div>
            <h4 class="text-sm font-medium text-blue-900">
              Enhance Your Opportunity
            </h4>
            <p class="text-sm text-blue-700 mt-1">
              Add images, videos, and branding to make your opportunity more
              attractive to potential applicants.
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Opportunity Image URL -->
        <div class="space-y-2">
          <label
            class="block text-sm font-semibold text-gray-700 flex items-center"
          >
            <lucide-angular
              [img]="EyeIcon"
              [size]="16"
              class="mr-2"
            ></lucide-angular>
            Opportunity Image URL
          </label>
          <input
            type="url"
            placeholder="https://example.com/opportunity-image.jpg"
            [value]="formState.formData().fundingOpportunityImageUrl"
            (input)="ui.onFieldChange('fundingOpportunityImageUrl', $event)"
            [class]="ui.getFieldClasses('fundingOpportunityImageUrl')"
          />
          <p class="text-xs text-gray-500">
            Add a compelling image to represent your opportunity
          </p>
          @if (formState.getFieldError('fundingOpportunityImageUrl'); as error)
          {
          <p class="text-sm text-red-600 flex items-center">
            <lucide-angular
              [img]="AlertCircleIcon"
              [size]="14"
              class="mr-1"
            ></lucide-angular>
            {{ error.message }}
          </p>
          } @if (formState.formData().fundingOpportunityImageUrl &&
          !formState.getFieldError('fundingOpportunityImageUrl')) {
          <div class="mt-2 p-2 bg-gray-50 rounded border">
            <img
              [src]="formState.formData().fundingOpportunityImageUrl"
              alt="Opportunity preview"
              class="w-full h-24 object-cover rounded"
              (error)="ui.onImageError('fundingOpportunityImageUrl')"
            />
          </div>
          }
        </div>

        <!-- Opportunity Video URL -->
        <div class="space-y-2">
          <label
            class="block text-sm font-semibold text-gray-700 flex items-center"
          >
            <lucide-angular
              [img]="SparklesIcon"
              [size]="16"
              class="mr-2"
            ></lucide-angular>
            Opportunity Video URL
          </label>
          <input
            type="url"
            placeholder="https://youtube.com/watch?v=example"
            [value]="formState.formData().fundingOpportunityVideoUrl"
            (input)="ui.onFieldChange('fundingOpportunityVideoUrl', $event)"
            [class]="ui.getFieldClasses('fundingOpportunityVideoUrl')"
          />
          <p class="text-xs text-gray-500">
            YouTube, Vimeo, or other video platform URL
          </p>
          @if (formState.getFieldError('fundingOpportunityVideoUrl'); as error)
          {
          <p class="text-sm text-red-600 flex items-center">
            <lucide-angular
              [img]="AlertCircleIcon"
              [size]="14"
              class="mr-1"
            ></lucide-angular>
            {{ error.message }}
          </p>
          }
        </div>

        <!-- Organization Name -->
        <div class="space-y-2">
          <label
            class="block text-sm font-semibold text-gray-700 flex items-center"
          >
            <lucide-angular
              [img]="UsersIcon"
              [size]="16"
              class="mr-2"
            ></lucide-angular>
            Organization Name
          </label>
          <input
            type="text"
            placeholder="Your organization or fund name"
            [value]="formState.formData().funderOrganizationName"
            (input)="ui.onFieldChange('funderOrganizationName', $event)"
            [class]="ui.getFieldClasses('funderOrganizationName')"
          />
          <p class="text-xs text-gray-500">
            How your organization will appear to applicants
          </p>
          @if (formState.getFieldError('funderOrganizationName'); as error) {
          <p class="text-sm text-red-600 flex items-center">
            <lucide-angular
              [img]="AlertCircleIcon"
              [size]="14"
              class="mr-1"
            ></lucide-angular>
            {{ error.message }}
          </p>
          }
        </div>

        <!-- Organization Logo URL -->
        <div class="space-y-2">
          <label
            class="block text-sm font-semibold text-gray-700 flex items-center"
          >
            <lucide-angular
              [img]="SettingsIcon"
              [size]="16"
              class="mr-2"
            ></lucide-angular>
            Organization Logo URL
          </label>
          <input
            type="url"
            placeholder="https://example.com/logo.png"
            [value]="formState.formData().funderOrganizationLogoUrl"
            (input)="ui.onFieldChange('funderOrganizationLogoUrl', $event)"
            [class]="ui.getFieldClasses('funderOrganizationLogoUrl')"
          />
          <p class="text-xs text-gray-500">
            Your organization's logo for branding
          </p>
          @if (formState.getFieldError('funderOrganizationLogoUrl'); as error) {
          <p class="text-sm text-red-600 flex items-center">
            <lucide-angular
              [img]="AlertCircleIcon"
              [size]="14"
              class="mr-1"
            ></lucide-angular>
            {{ error.message }}
          </p>
          } @if (formState.formData().funderOrganizationLogoUrl &&
          !formState.getFieldError('funderOrganizationLogoUrl')) {
          <div class="mt-2 p-2 bg-gray-50 rounded border">
            <img
              [src]="formState.formData().funderOrganizationLogoUrl"
              alt="Logo preview"
              class="w-16 h-16 object-contain rounded"
              (error)="ui.onImageError('funderOrganizationLogoUrl')"
            />
          </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class MediaBrandingComponent {
  public formState = inject(OpportunityFormStateService);
  public ui = inject(OpportunityUIHelperService);

  // Icons
  SparklesIcon = Sparkles;
  EyeIcon = Eye;
  UsersIcon = Users;
  SettingsIcon = Settings;
  LightbulbIcon = Lightbulb;
  AlertCircleIcon = CircleAlert;
}
