// // src/app/applications/components/new-application/services/application-form.service.ts

// import { Injectable, signal, computed } from '@angular/core';
// import { ApplicationFormData } from '../models/application-form.model';

// @Injectable()
// export class ApplicationFormService {
//   private formDataSignal = signal<ApplicationFormData>({
//     requestedAmount: '',
//     purposeStatement: '',
//     useOfFunds: '',
//     fundingType: '',
//     coverStatement: undefined,
//   });

//   // Public readonly signals
//   formData = this.formDataSignal.asReadonly();

//   // Computed properties
//   completionPercentage = computed(() => {
//     const data = this.formDataSignal();
//     let completed = 0;
//     const total = 3; // requestedAmount, purposeStatement, useOfFunds

//     if (data.requestedAmount) completed++;
//     if (data.purposeStatement) completed++;
//     if (data.useOfFunds) completed++;

//     return Math.round((completed / total) * 100);
//   });

//   hasFormData = computed(() => {
//     const data = this.formDataSignal();
//     return !!(data.requestedAmount || data.purposeStatement || data.useOfFunds);
//   });

//   // Update methods
//   updateRequestedAmount(amount: string): void {
//     this.formDataSignal.update((current) => ({
//       ...current,
//       requestedAmount: amount,
//     }));
//   }

//   updatePurposeStatement(statement: string): void {
//     this.formDataSignal.update((current) => ({
//       ...current,
//       purposeStatement: statement,
//     }));
//   }

//   updateUseOfFunds(useOfFunds: string): void {
//     this.formDataSignal.update((current) => ({
//       ...current,
//       useOfFunds: useOfFunds,
//     }));
//   }

//   updateFundingType(fundingType: string): void {
//     this.formDataSignal.update((current) => ({
//       ...current,
//       fundingType,
//     }));
//   }

//   updateCoverStatement(file: File | undefined): void {
//     this.formDataSignal.update((current) => ({
//       ...current,
//       coverStatement: file,
//     }));
//   }

//   // Pre-fill from route or draft
//   prefillForm(data: Partial<ApplicationFormData>): void {
//     this.formDataSignal.update((current) => ({
//       ...current,
//       ...data,
//     }));
//   }

//   // Reset form
//   resetForm(): void {
//     this.formDataSignal.set({
//       requestedAmount: '',
//       purposeStatement: '',
//       useOfFunds: '',
//       fundingType: '',
//       coverStatement: undefined,
//     });
//   }

//   // Get plain object for saving
//   getFormDataForSave(): ApplicationFormData {
//     return { ...this.formDataSignal() };
//   }
// }

import { Injectable, signal, computed } from '@angular/core';
import { ApplicationFormData } from '../models/application-form.model';

/**
 * ApplicationFormService
 *
 * Manages form state for funding application.
 * Supports pre-filling from covers with auto-calculation of completion.
 */
@Injectable()
export class ApplicationFormService {
  private formDataSignal = signal<ApplicationFormData>({
    requestedAmount: '',
    purposeStatement: '',
    useOfFunds: '',
    fundingType: '',
    coverStatement: undefined,
  });

  // Public readonly signals
  formData = this.formDataSignal.asReadonly();

  // Computed properties
  completionPercentage = computed(() => {
    const data = this.formDataSignal();
    let completed = 0;
    const total = 4; // requestedAmount, purposeStatement, useOfFunds, fundingType

    if (data.requestedAmount) completed++;
    if (data.purposeStatement) completed++;
    if (data.useOfFunds) completed++;
    if (data.fundingType) completed++;

    return Math.round((completed / total) * 100);
  });

  hasFormData = computed(() => {
    const data = this.formDataSignal();
    return !!(
      data.requestedAmount ||
      data.purposeStatement ||
      data.useOfFunds ||
      data.fundingType
    );
  });

  // ===== UPDATE METHODS =====

  /**
   * Update requested amount
   */
  updateRequestedAmount(amount: string): void {
    this.formDataSignal.update((current) => ({
      ...current,
      requestedAmount: amount,
    }));
  }

  /**
   * Update purpose statement
   */
  updatePurposeStatement(statement: string): void {
    this.formDataSignal.update((current) => ({
      ...current,
      purposeStatement: statement,
    }));
  }

  /**
   * Update use of funds
   */
  updateUseOfFunds(useOfFunds: string): void {
    this.formDataSignal.update((current) => ({
      ...current,
      useOfFunds: useOfFunds,
    }));
  }

  /**
   * Update funding type
   */
  updateFundingType(fundingType: string): void {
    this.formDataSignal.update((current) => ({
      ...current,
      fundingType,
    }));
  }

  /**
   * Update cover statement file
   */
  updateCoverStatement(file: File | undefined): void {
    this.formDataSignal.update((current) => ({
      ...current,
      coverStatement: file,
    }));
  }

  /**
   * Pre-fill form from route or draft (maintains existing data if not overwritten)
   */
  prefillForm(data: Partial<ApplicationFormData>): void {
    this.formDataSignal.update((current) => ({
      ...current,
      ...data,
    }));
  }

  /**
   * Load all form data at once (for cover loading)
   */
  loadFromCover(data: ApplicationFormData): void {
    this.formDataSignal.set(data);
  }

  /**
   * Reset form
   */
  resetForm(): void {
    this.formDataSignal.set({
      requestedAmount: '',
      purposeStatement: '',
      useOfFunds: '',
      fundingType: '',
      coverStatement: undefined,
    });
  }

  /**
   * Get plain object for saving
   */
  getFormDataForSave(): ApplicationFormData {
    return { ...this.formDataSignal() };
  }

  /**
   * Check if form has any data
   */
  hasAnyData(): boolean {
    return this.hasFormData();
  }
}
