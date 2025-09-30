// src/app/applications/components/new-application/services/application-form.service.ts

import { Injectable, signal, computed } from '@angular/core';
import { ApplicationFormData } from '../models/application-form.model';
 

@Injectable()
export class ApplicationFormService {
  private formDataSignal = signal<ApplicationFormData>({
    requestedAmount: '',
    purposeStatement: '',
    useOfFunds: '',
    coverStatement: undefined
  });

  // Public readonly signals
  formData = this.formDataSignal.asReadonly();

  // Computed properties
  completionPercentage = computed(() => {
    const data = this.formDataSignal();
    let completed = 0;
    const total = 3; // removed timeline & opportunityAlignment

    if (data.requestedAmount) completed++;
    if (data.purposeStatement) completed++;
    if (data.useOfFunds) completed++;

    return Math.round((completed / total) * 100);
  });

  hasFormData = computed(() => {
    const data = this.formDataSignal();
    return !!(data.requestedAmount || data.purposeStatement || data.useOfFunds);
  });

  // Update methods
  updateRequestedAmount(amount: string): void {
    this.formDataSignal.update(current => ({
      ...current,
      requestedAmount: amount
    }));
  }

  updatePurposeStatement(statement: string): void {
    this.formDataSignal.update(current => ({
      ...current,
      purposeStatement: statement
    }));
  }

  updateUseOfFunds(useOfFunds: string): void {
    this.formDataSignal.update(current => ({
      ...current,
      useOfFunds: useOfFunds
    }));
  }

  updateCoverStatement(file: File | undefined): void {
    this.formDataSignal.update(current => ({
      ...current,
      coverStatement: file
    }));
  }

  // Pre-fill from route or draft
  prefillForm(data: Partial<ApplicationFormData>): void {
    this.formDataSignal.update(current => ({
      ...current,
      ...data
    }));
  }

  // Reset form
  resetForm(): void {
    this.formDataSignal.set({
      requestedAmount: '',
      purposeStatement: '',
      useOfFunds: '',
      coverStatement: undefined
    });
  }

  // Get plain object for saving
  getFormDataForSave(): ApplicationFormData {
    return { ...this.formDataSignal() };
  }
}