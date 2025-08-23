// src/app/applications/components/application-form.component.ts
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UiButtonComponent, UiCardComponent } from '../../../shared/components';
import { LucideAngularModule, ArrowLeft, Building, DollarSign, FileText } from 'lucide-angular';
import { Location } from '@angular/common';

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
  templateUrl: 'application-form.component.html'
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
  
  constructor(private router: Router, private location: Location) {}

 goBack() {
  this.location.back();
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