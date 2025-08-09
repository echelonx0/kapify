// src/app/applications/components/application-form.component.ts
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UiButtonComponent, UiCardComponent } from '../../shared/components';
import { LucideAngularModule, ArrowLeft, Building, DollarSign, FileText } from 'lucide-angular';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    UiButtonComponent, 
    UiCardComponent, 
    LucideAngularModule
  ],
  template: `
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center space-x-3 mb-4">
          <button 
            (click)="goBack()" 
            class="flex items-center text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <lucide-icon [img]="ArrowLeftIcon" [size]="16" class="mr-1" />
            Back to Applications
          </button>
        </div>
        
        <h1 class="text-2xl font-bold text-neutral-900">New Application</h1>
        <p class="text-neutral-600 mt-1">Start your funding application process</p>
      </div>

      <!-- Progress Steps -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          @for (step of steps(); track step.id) {
            <div class="flex items-center">
              <div [class]="getStepClasses(step.id)">
                {{ step.number }}
              </div>
              <div class="ml-3">
                <p [class]="getStepTextClasses(step.id)">{{ step.title }}</p>
                <p class="text-xs text-neutral-500">{{ step.description }}</p>
              </div>
              @if (step.id !== 'review') {
                <div class="w-16 h-0.5 bg-neutral-200 ml-8"></div>
              }
            </div>
          }
        </div>
      </div>
      
      <!-- Form Content -->
      <ui-card>
        @switch (currentStep()) {
          @case ('basic') {
            <div class="space-y-6">
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="BuildingIcon" [size]="20" class="text-primary-600" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900">Basic Information</h3>
                  <p class="text-sm text-neutral-600">Tell us about your funding request</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Application Title <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter a descriptive title for your application"
                    [value]="formData().title"
                    (input)="onTitleChange($event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Funding Type <span class="text-red-500">*</span>
                  </label>
                  <select
                    [value]="formData().fundingType"
                    (change)="onFundingTypeChange($event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Select funding type</option>
                    <option value="debt">Debt Financing</option>
                    <option value="equity">Equity Investment</option>
                    <option value="mezzanine">Mezzanine Financing</option>
                    <option value="convertible">Convertible Note</option>
                    <option value="grant">Grant</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Requested Amount <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    [value]="formData().requestedAmount"
                    (input)="onRequestedAmountChange($event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <div class="space-y-1">
                  <label class="block text-sm font-medium text-neutral-700">
                    Currency <span class="text-red-500">*</span>
                  </label>
                  <select
                    [value]="formData().currency"
                    (change)="onCurrencyChange($event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="ZAR">ZAR (South African Rand)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </select>
                </div>
              </div>

              <div class="space-y-1">
                <label class="block text-sm font-medium text-neutral-700">
                  Purpose Statement <span class="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Describe the purpose of this funding request and how it will benefit your business..."
                  [value]="formData().purposeStatement"
                  (input)="onPurposeStatementChange($event)"
                  rows="4"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors resize-y border-neutral-300 focus:border-primary-500 focus:ring-primary-500 bg-white"
                ></textarea>
              </div>

              <div class="space-y-1">
                <label class="block text-sm font-medium text-neutral-700">
                  Description
                </label>
                <textarea
                  placeholder="Provide additional details about your application..."
                  [value]="formData().description"
                  (input)="onDescriptionChange($event)"
                  rows="3"
                  class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors resize-y border-neutral-300 focus:border-primary-500 focus:ring-primary-500 bg-white"
                ></textarea>
              </div>
            </div>
          }

          @case ('funding') {
            <div class="space-y-6">
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="DollarSignIcon" [size]="20" class="text-green-600" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900">Use of Funds</h3>
                  <p class="text-sm text-neutral-600">Break down how you plan to use the funding</p>
                </div>
              </div>

              <div class="text-center py-12">
                <h4 class="text-lg font-medium text-neutral-900 mb-2">Use of Funds Breakdown</h4>
                <p class="text-neutral-500 mb-6">This section is under development</p>
                <p class="text-sm text-neutral-600">
                  You'll be able to specify how funds will be allocated across different categories
                  such as working capital, equipment, expansion, etc.
                </p>
              </div>
            </div>
          }

          @case ('review') {
            <div class="space-y-6">
              <div class="flex items-center space-x-3 mb-6">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="FileTextIcon" [size]="20" class="text-blue-600" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-neutral-900">Review & Submit</h3>
                  <p class="text-sm text-neutral-600">Review your application before submitting</p>
                </div>
              </div>

              <!-- Application Summary -->
              <div class="bg-neutral-50 rounded-lg p-6">
                <h4 class="font-medium text-neutral-900 mb-4">Application Summary</h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="text-neutral-500">Title:</span>
                    <div class="font-medium">{{ formData().title || 'Not specified' }}</div>
                  </div>
                  <div>
                    <span class="text-neutral-500">Funding Type:</span>
                    <div class="font-medium capitalize">{{ formData().fundingType || 'Not specified' }}</div>
                  </div>
                  <div>
                    <span class="text-neutral-500">Requested Amount:</span>
                    <div class="font-medium">{{ formData().currency }} {{ getFormattedAmount() }}</div>
                  </div>
                  <div>
                    <span class="text-neutral-500">Currency:</span>
                    <div class="font-medium">{{ formData().currency }}</div>
                  </div>
                </div>

                @if (formData().purposeStatement) {
                  <div class="mt-4">
                    <span class="text-neutral-500 text-sm">Purpose Statement:</span>
                    <div class="mt-1 text-sm">{{ formData().purposeStatement }}</div>
                  </div>
                }
              </div>

              <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div class="flex">
                  <div class="ml-3">
                    <h4 class="text-sm font-medium text-yellow-800">Next Steps</h4>
                    <p class="mt-1 text-sm text-yellow-700">
                      After submitting this application, you'll be able to complete additional sections including
                      document uploads, business review, and financial analysis.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          }
        }

        <!-- Form Actions -->
        <div class="flex items-center justify-between pt-6 mt-6 border-t border-neutral-200">
          <div class="flex items-center space-x-3">
            @if (currentStep() !== 'basic') {
              <ui-button variant="outline" (clicked)="previousStep()">
                Previous
              </ui-button>
            }
            
            <ui-button variant="outline" (clicked)="goBack()">
              Cancel
            </ui-button>
          </div>

          <div class="flex items-center space-x-3">
            <ui-button variant="outline" (clicked)="saveDraft()" [disabled]="isSaving()">
              @if (isSaving()) {
                Saving...
              } @else {
                Save Draft
              }
            </ui-button>

            @if (currentStep() === 'review') {
              <ui-button 
                variant="primary" 
                (clicked)="submitApplication()" 
                [disabled]="!canSubmit() || isSubmitting()"
              >
                @if (isSubmitting()) {
                  Submitting...
                } @else {
                  Submit Application
                }
              </ui-button>
            } @else {
              <ui-button variant="primary" (clicked)="nextStep()" [disabled]="!canContinue()">
                Continue
              </ui-button>
            }
          </div>
        </div>
      </ui-card>
    </div>
  `
})
export class ApplicationFormComponent {
  // Icons
  ArrowLeftIcon = ArrowLeft;
  BuildingIcon = Building;
  DollarSignIcon = DollarSign;
  FileTextIcon = FileText;

  // Form state
  currentStep = signal<'basic' | 'funding' | 'review'>('basic');
  isSaving = signal(false);
  isSubmitting = signal(false);

  // Form data
  formData = signal({
    title: '',
    fundingType: '',
    requestedAmount: '',
    currency: 'ZAR',
    purposeStatement: '',
    description: ''
  });

  // Steps configuration
  steps = signal([
    { id: 'basic', number: 1, title: 'Basic Info', description: 'Application details' },
    { id: 'funding', number: 2, title: 'Use of Funds', description: 'Funding breakdown' },
    { id: 'review', number: 3, title: 'Review', description: 'Submit application' }
  ]);
  
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/applications']);
  }

  updateFormData(field: string, value: string) {
    this.formData.update(data => ({
      ...data,
      [field]: value
    }));
  }

  // Event handlers for form controls
  onTitleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.updateFormData('title', target.value);
  }

  onFundingTypeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.updateFormData('fundingType', target.value);
  }

  onRequestedAmountChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.updateFormData('requestedAmount', target.value);
  }

  onCurrencyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.updateFormData('currency', target.value);
  }

  onPurposeStatementChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.updateFormData('purposeStatement', target.value);
  }

  onDescriptionChange(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.updateFormData('description', target.value);
  }

  // Step navigation
  nextStep() {
    const current = this.currentStep();
    if (current === 'basic') {
      this.currentStep.set('funding');
    } else if (current === 'funding') {
      this.currentStep.set('review');
    }
  }

  previousStep() {
    const current = this.currentStep();
    if (current === 'review') {
      this.currentStep.set('funding');
    } else if (current === 'funding') {
      this.currentStep.set('basic');
    }
  }

  // Validation
  canContinue(): boolean {
    const data = this.formData();
    const current = this.currentStep();
    
    if (current === 'basic') {
      return !!(data.title && data.fundingType && data.requestedAmount && data.purposeStatement);
    }
    
    return true;
  }

  canSubmit(): boolean {
    return this.canContinue();
  }

  // Actions
  saveDraft() {
    this.isSaving.set(true);
    // TODO: Implement save draft functionality
    setTimeout(() => {
      this.isSaving.set(false);
      console.log('Draft saved');
    }, 1000);
  }

  submitApplication() {
    this.isSubmitting.set(true);
    // TODO: Implement submit functionality
    setTimeout(() => {
      this.isSubmitting.set(false);
      console.log('Application submitted');
      this.router.navigate(['/applications']);
    }, 2000);
  }

  // UI helpers
  getStepClasses(stepId: string): string {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium';
    const current = this.currentStep();
    const steps = ['basic', 'funding', 'review'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(stepId);
    
    if (stepIndex < currentIndex) {
      return `${baseClasses} bg-green-500 text-white`;
    } else if (stepIndex === currentIndex) {
      return `${baseClasses} bg-primary-500 text-white`;
    } else {
      return `${baseClasses} bg-neutral-200 text-neutral-500`;
    }
  }

  getStepTextClasses(stepId: string): string {
    const current = this.currentStep();
    const steps = ['basic', 'funding', 'review'];
    const currentIndex = steps.indexOf(current);
    const stepIndex = steps.indexOf(stepId);
    
    if (stepIndex <= currentIndex) {
      return 'text-sm font-medium text-neutral-900';
    } else {
      return 'text-sm font-medium text-neutral-500';
    }
  }

  getFormattedAmount(): string {
    const amount = Number(this.formData().requestedAmount) || 0;
    return this.formatNumber(amount);
  }

  formatNumber(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}