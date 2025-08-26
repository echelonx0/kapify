// src/app/funder/components/create-opportunity/steps/basic-info-step.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, FileText, Image, Video, Building, Globe, AlertCircle } from 'lucide-angular';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormStepProps, OpportunityFormData, ValidationError } from '../shared/form-interfaces';

@Component({
  selector: 'app-basic-info-step',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-8">
      <!-- Core Details Section -->
      <div class="space-y-6">
        <div class="flex items-center space-x-2 mb-4">
          <lucide-angular [img]="FileTextIcon" [size]="20" class="text-primary-600"></lucide-angular>
          <h3 class="text-lg font-semibold text-gray-900">Core Details</h3>
        </div>

        <!-- Title Field -->
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-gray-700">
            Opportunity Title <span class="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            placeholder="e.g., Growth Capital for Tech Startups"
            [value]="formData.title"
            (input)="onFieldChange('title', $event)"
            [class]="getFieldClasses('title')"
          >
          @if (getFieldError('title'); as error) {
            <p class="text-sm flex items-center" 
               [class.text-red-600]="error.type === 'error'" 
               [class.text-yellow-600]="error.type === 'warning'">
              <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
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
            [value]="formData.shortDescription"
            (input)="onFieldChange('shortDescription', $event)"
            maxlength="150"
            [class]="getFieldClasses('shortDescription')"
          >
          <div class="flex justify-between items-start">
            @if (getFieldError('shortDescription'); as error) {
              <p class="text-sm flex items-center" 
                 [class.text-red-600]="error.type === 'error'" 
                 [class.text-yellow-600]="error.type === 'warning'">
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ error.message }}
              </p>
            } @else {
              <span></span>
            }
            <p class="text-xs text-gray-500 ml-2 flex-shrink-0">
              {{ formData.shortDescription.length }}/150
            </p>
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
            [value]="formData.description"
            (input)="onFieldChange('description', $event)"
            [class]="getFieldClasses('description')"
            class="resize-none"
          ></textarea>
          @if (getFieldError('description'); as error) {
            <p class="text-sm flex items-center" 
               [class.text-red-600]="error.type === 'error'" 
               [class.text-yellow-600]="error.type === 'warning'">
              <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
              {{ error.message }}
            </p>
          }
          <div class="flex justify-between items-center">
            <p class="text-xs text-gray-500">
              Provide comprehensive details about the opportunity
            </p>
            <p class="text-xs text-gray-500">
              {{ formData.description.length }} characters
            </p>
          </div>
        </div>
      </div>

      <!-- Media & Branding Section -->
      <div class="space-y-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-2">
            <lucide-angular [img]="ImageIcon" [size]="20" class="text-primary-600"></lucide-angular>
            <h3 class="text-lg font-semibold text-gray-900">Media & Branding</h3>
          </div>
          <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Optional</span>
        </div>

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div class="flex items-start space-x-3">
            <lucide-angular [img]="ImageIcon" [size]="20" class="text-blue-600 mt-0.5"></lucide-angular>
            <div>
              <h4 class="text-sm font-medium text-blue-900">Enhance Your Opportunity</h4>
              <p class="text-sm text-blue-700 mt-1">
                Add images, videos, and branding to make your opportunity more attractive to potential applicants.
              </p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Opportunity Image URL -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700 flex items-center">
              <lucide-angular [img]="ImageIcon" [size]="16" class="mr-2"></lucide-angular>
              Opportunity Image URL
            </label>
            <input 
              type="url" 
              placeholder="https://example.com/opportunity-image.jpg"
              [value]="formData.fundingOpportunityImageUrl"
              (input)="onFieldChange('fundingOpportunityImageUrl', $event)"
              [class]="getFieldClasses('fundingOpportunityImageUrl')"
            >
            <p class="text-xs text-gray-500">Add a compelling image to represent your opportunity</p>
            @if (getFieldError('fundingOpportunityImageUrl'); as error) {
              <p class="text-sm flex items-center text-red-600">
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ error.message }}
              </p>
            }
            @if (formData.fundingOpportunityImageUrl && !getFieldError('fundingOpportunityImageUrl')) {
              <div class="mt-2 p-2 bg-gray-50 rounded border">
                <img 
                  [src]="formData.fundingOpportunityImageUrl" 
                  alt="Opportunity preview"
                  class="w-full h-24 object-cover rounded"
                  (error)="onImageError('fundingOpportunityImageUrl')"
                  (load)="onImageLoad('fundingOpportunityImageUrl')"
                >
              </div>
            }
          </div>

          <!-- Opportunity Video URL -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700 flex items-center">
              <lucide-angular [img]="VideoIcon" [size]="16" class="mr-2"></lucide-angular>
              Opportunity Video URL
            </label>
            <input 
              type="url" 
              placeholder="https://youtube.com/watch?v=example"
              [value]="formData.fundingOpportunityVideoUrl"
              (input)="onFieldChange('fundingOpportunityVideoUrl', $event)"
              [class]="getFieldClasses('fundingOpportunityVideoUrl')"
            >
            <p class="text-xs text-gray-500">YouTube, Vimeo, or other video platform URL</p>
            @if (getFieldError('fundingOpportunityVideoUrl'); as error) {
              <p class="text-sm flex items-center text-red-600">
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ error.message }}
              </p>
            }
          </div>

          <!-- Organization Name -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700 flex items-center">
              <lucide-angular [img]="BuildingIcon" [size]="16" class="mr-2"></lucide-angular>
              Organization Name
            </label>
            <input 
              type="text" 
              placeholder="Your organization or fund name"
              [value]="formData.funderOrganizationName"
              (input)="onFieldChange('funderOrganizationName', $event)"
              [class]="getFieldClasses('funderOrganizationName')"
            >
            <p class="text-xs text-gray-500">How your organization will appear to applicants</p>
            @if (getFieldError('funderOrganizationName'); as error) {
              <p class="text-sm flex items-center text-red-600">
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ error.message }}
              </p>
            }
          </div>

          <!-- Organization Logo URL -->
          <div class="space-y-2">
            <label class="block text-sm font-semibold text-gray-700 flex items-center">
              <lucide-angular [img]="GlobeIcon" [size]="16" class="mr-2"></lucide-angular>
              Organization Logo URL
            </label>
            <input 
              type="url" 
              placeholder="https://example.com/logo.png"
              [value]="formData.funderOrganizationLogoUrl"
              (input)="onFieldChange('funderOrganizationLogoUrl', $event)"
              [class]="getFieldClasses('funderOrganizationLogoUrl')"
            >
            <p class="text-xs text-gray-500">Your organization's logo for branding</p>
            @if (getFieldError('funderOrganizationLogoUrl'); as error) {
              <p class="text-sm flex items-center text-red-600">
                <lucide-angular [img]="AlertCircleIcon" [size]="14" class="mr-1"></lucide-angular>
                {{ error.message }}
              </p>
            }
            @if (formData.funderOrganizationLogoUrl && !getFieldError('funderOrganizationLogoUrl')) {
              <div class="mt-2 p-2 bg-gray-50 rounded border">
                <img 
                  [src]="formData.funderOrganizationLogoUrl" 
                  alt="Logo preview"
                  class="w-16 h-16 object-contain rounded"
                  (error)="onImageError('funderOrganizationLogoUrl')"
                  (load)="onImageLoad('funderOrganizationLogoUrl')"
                >
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Completion Progress -->
      <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div class="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span class="font-medium">Basic Info Completion</span>
          <span class="font-medium">{{ getCompletionPercentage() }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
            [style.width.%]="getCompletionPercentage()"
          ></div>
        </div>
        <div class="mt-2 flex items-center text-xs text-gray-500">
          <lucide-angular [img]="FileTextIcon" [size]="12" class="mr-1"></lucide-angular>
          Complete required fields to continue
        </div>
      </div>
    </div>
  `
})
export class BasicInfoStepComponent implements OnInit, OnDestroy, FormStepProps {
  @Input() formData!: OpportunityFormData;
  @Input() validationErrors: ValidationError[] = [];
  @Output() onFormChange = new EventEmitter<Partial<OpportunityFormData>>();
  @Output() onValidationChange = new EventEmitter<ValidationError[]>();

  // Icons
  FileTextIcon = FileText;
  ImageIcon = Image;
  VideoIcon = Video;
  BuildingIcon = Building;
  GlobeIcon = Globe;
  AlertCircleIcon = AlertCircle;

  private destroy$ = new Subject<void>();
  private validationSubject = new Subject<void>();

  ngOnInit() {
    // Auto-validate when form changes
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
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const updates = { [field]: target.value };
    
    this.onFormChange.emit(updates);
    this.validationSubject.next();
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

  getCompletionPercentage(): number {
    const requiredFields = ['title', 'shortDescription', 'description'];
    const completed = requiredFields.filter(field => {
      const value = this.formData[field as keyof OpportunityFormData] as string;
      return value && value.trim().length > 0;
    });

    return Math.round((completed.length / requiredFields.length) * 100);
  }

  onImageError(field: string) {
    // Add validation error for invalid image URL
    const errors = [...this.validationErrors.filter(e => e.field !== field)];
    errors.push({
      field,
      message: 'Invalid image URL or image failed to load',
      type: 'warning'
    });
    this.onValidationChange.emit(errors);
  }

  onImageLoad(field: string) {
    // Remove any existing validation errors for this field
    const errors = this.validationErrors.filter(e => e.field !== field);
    this.onValidationChange.emit(errors);
  }

  private validateStep() {
    const errors: ValidationError[] = [];
    
    // Core field validation
    if (!this.formData.title?.trim()) {
      errors.push({ field: 'title', message: 'Title is required', type: 'error' });
    } else if (this.formData.title.length < 5) {
      errors.push({ field: 'title', message: 'Title must be at least 5 characters', type: 'warning' });
    }

    if (!this.formData.shortDescription?.trim()) {
      errors.push({ field: 'shortDescription', message: 'Short description is required', type: 'error' });
    } else if (this.formData.shortDescription.length > 150) {
      errors.push({ field: 'shortDescription', message: 'Short description must be 150 characters or less', type: 'error' });
    }

    if (!this.formData.description?.trim()) {
      errors.push({ field: 'description', message: 'Description is required', type: 'error' });
    } else if (this.formData.description.length < 50) {
      errors.push({ field: 'description', message: 'Description should be at least 50 characters for better results', type: 'warning' });
    }

    // URL validation for media fields
    this.validateUrl('fundingOpportunityImageUrl', 'opportunity image', errors);
    this.validateUrl('fundingOpportunityVideoUrl', 'opportunity video', errors);
    this.validateUrl('funderOrganizationLogoUrl', 'organization logo', errors);

    // Organization name validation
    if (this.formData.funderOrganizationName && this.formData.funderOrganizationName.length > 100) {
      errors.push({ 
        field: 'funderOrganizationName', 
        message: 'Organization name should be 100 characters or less', 
        type: 'warning' 
      });
    }

    // Keep existing validation errors that are not from this step
    const nonStepErrors = this.validationErrors.filter(error => 
      !['title', 'shortDescription', 'description', 'fundingOpportunityImageUrl', 
        'fundingOpportunityVideoUrl', 'funderOrganizationName', 'funderOrganizationLogoUrl'].includes(error.field)
    );

    this.onValidationChange.emit([...nonStepErrors, ...errors]);
  }

  private validateUrl(field: keyof OpportunityFormData, displayName: string, errors: ValidationError[]) {
    const url = this.formData[field] as string;
    if (!url) return; // Optional field

    try {
      new URL(url);
      
      // Check if it's a valid HTTP/HTTPS URL
      if (!url.match(/^https?:\/\/.+/)) {
        errors.push({
          field,
          message: `${displayName.charAt(0).toUpperCase() + displayName.slice(1)} URL must start with http:// or https://`,
          type: 'error'
        });
      }
    } catch {
      errors.push({
        field,
        message: `Please enter a valid ${displayName} URL`,
        type: 'error'
      });
    }
  }
}