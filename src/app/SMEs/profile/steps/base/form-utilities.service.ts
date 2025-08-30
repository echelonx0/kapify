// src/app/SMEs/profile/steps/base/form-utilities.service.ts
import { Injectable } from '@angular/core';
import { FormGroup, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';

export interface FormSectionState {
  id: string;
  expanded: boolean;
  completed: boolean;
  hasErrors: boolean;
  progress: number;
}

export interface ValidationSummary {
  isValid: boolean;
  totalFields: number;
  validFields: number;
  errors: { field: string; message: string }[];
  warnings: string[];
  completionPercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class FormUtilitiesService {
  
  // Section state management
  private sectionStates = new BehaviorSubject<{ [key: string]: FormSectionState }>({});
  public sectionStates$ = this.sectionStates.asObservable();

  // ===============================
  // FORM VALIDATION UTILITIES
  // ===============================

  /**
   * Get comprehensive validation summary for a form
   */
  getValidationSummary(form: FormGroup, fieldLabels: { [key: string]: string } = {}): ValidationSummary {
    const controls = this.getFormControls(form);
    const totalFields = Object.keys(controls).length;
    let validFields = 0;
    const errors: { field: string; message: string }[] = [];
    const warnings: string[] = [];

    Object.keys(controls).forEach(fieldName => {
      const control = controls[fieldName];
      if (control.valid && control.value !== '' && control.value !== null) {
        validFields++;
      }

      if (control.invalid && control.touched) {
        const fieldLabel = fieldLabels[fieldName] || this.formatFieldName(fieldName);
        const errorMessage = this.getControlErrorMessage(control, fieldLabel);
        if (errorMessage) {
          errors.push({ field: fieldName, message: errorMessage });
        }
      }

      // Check for warnings (valid but potentially incomplete)
      if (control.valid && control.value === '' && !control.hasError('required')) {
        warnings.push(`${fieldLabels[fieldName] || this.formatFieldName(fieldName)} is empty`);
      }
    });

    return {
      isValid: errors.length === 0 && form.valid,
      totalFields,
      validFields,
      errors,
      warnings,
      completionPercentage: totalFields > 0 ? Math.round((validFields / totalFields) * 100) : 0
    };
  }

  /**
   * Get all form controls recursively (including nested FormGroups)
   */
  private getFormControls(form: FormGroup): { [key: string]: AbstractControl } {
    const controls: { [key: string]: AbstractControl } = {};

    Object.keys(form.controls).forEach(key => {
      const control = form.controls[key];
      if (control instanceof FormGroup) {
        // Recursively get nested form controls
        const nestedControls = this.getFormControls(control);
        Object.keys(nestedControls).forEach(nestedKey => {
          controls[`${key}.${nestedKey}`] = nestedControls[nestedKey];
        });
      } else {
        controls[key] = control;
      }
    });

    return controls;
  }

  /**
   * Get user-friendly error message for a control
   */
  private getControlErrorMessage(control: AbstractControl, fieldLabel: string): string | null {
    if (!control.errors) return null;

    const errors = control.errors;
    
    if (errors['required']) return `${fieldLabel} is required`;
    if (errors['email']) return `${fieldLabel} must be a valid email address`;
    if (errors['min']) return `${fieldLabel} must be at least ${errors['min'].min}`;
    if (errors['max']) return `${fieldLabel} must be no more than ${errors['max'].max}`;
    if (errors['minlength']) return `${fieldLabel} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${fieldLabel} must be no more than ${errors['maxlength'].requiredLength} characters`;
    if (errors['pattern']) return `${fieldLabel} format is invalid`;
    if (errors['phone']) return `${fieldLabel} must be a valid phone number`;
    if (errors['url']) return `${fieldLabel} must be a valid URL`;
    if (errors['date']) return `${fieldLabel} must be a valid date`;
    if (errors['currency']) return `${fieldLabel} must be a valid currency amount`;

    // Return generic message for unknown errors
    return `${fieldLabel} is invalid`;
  }

  /**
   * Format camelCase field names to readable labels
   */
  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/\./g, ' ') // Replace dots with spaces for nested fields
      .trim();
  }

  // ===============================
  // CUSTOM VALIDATORS
  // ===============================

  /**
   * South African phone number validator
   */
  static phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const phoneRegex = /^(\+27|0)[0-9]{9}$/;
      const valid = phoneRegex.test(control.value.replace(/\s/g, ''));
      
      return valid ? null : { phone: { value: control.value } };
    };
  }

  /**
   * South African ID number validator
   */
  static idNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const idRegex = /^\d{13}$/;
      const valid = idRegex.test(control.value);
      
      return valid ? null : { idNumber: { value: control.value } };
    };
  }

  /**
   * Currency amount validator
   */
  static currencyValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const currencyRegex = /^\d+(\.\d{1,2})?$/;
      const valid = currencyRegex.test(control.value.toString());
      
      return valid ? null : { currency: { value: control.value } };
    };
  }

  /**
   * URL validator
   */
  static urlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      try {
        new URL(control.value);
        return null;
      } catch {
        return { url: { value: control.value } };
      }
    };
  }

  /**
   * File type validator
   */
  static fileTypeValidator(allowedTypes: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const file = control.value as File;
      if (!file.name) return null;
      
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      const valid = allowedTypes.includes(extension);
      
      return valid ? null : { 
        fileType: { 
          value: extension, 
          allowedTypes,
          message: `File must be one of: ${allowedTypes.join(', ')}` 
        } 
      };
    };
  }

  /**
   * File size validator (in bytes)
   */
  static fileSizeValidator(maxSize: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const file = control.value as File;
      if (!file.size) return null;
      
      const valid = file.size <= maxSize;
      
      return valid ? null : { 
        fileSize: { 
          value: file.size, 
          maxSize,
          message: `File size must be less than ${this.formatFileSize(maxSize)}` 
        } 
      };
    };
  }

  /**
   * Conditional validator - only validate if condition is met
   */
  static conditionalValidator(condition: () => boolean, validator: ValidatorFn): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!condition()) {
        return null; // Don't validate if condition is false
      }
      return validator(control);
    };
  }

  // ===============================
  // SECTION STATE MANAGEMENT
  // ===============================

  /**
   * Update section state
   */
  updateSectionState(sectionId: string, updates: Partial<FormSectionState>): void {
    const currentStates = this.sectionStates.value;
    const currentState = currentStates[sectionId] || {
      id: sectionId,
      expanded: false,
      completed: false,
      hasErrors: false,
      progress: 0
    };

    this.sectionStates.next({
      ...currentStates,
      [sectionId]: { ...currentState, ...updates }
    });
  }

  /**
   * Get section state
   */
  getSectionState(sectionId: string): FormSectionState | null {
    return this.sectionStates.value[sectionId] || null;
  }

  /**
   * Toggle section expansion
   */
  toggleSection(sectionId: string): void {
    const currentState = this.getSectionState(sectionId);
    this.updateSectionState(sectionId, {
      expanded: !(currentState?.expanded ?? false)
    });
  }

  /**
   * Calculate section progress based on form
   */
  calculateSectionProgress(form: FormGroup): number {
    const summary = this.getValidationSummary(form);
    return summary.completionPercentage;
  }

  // ===============================
  // UTILITY FUNCTIONS
  // ===============================

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format currency amount
   */
  static formatCurrency(amount: number, currency = 'ZAR'): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Parse currency string to number
   */
  static parseCurrency(currencyString: string): number {
    return parseFloat(currencyString.replace(/[^\d.-]/g, '')) || 0;
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('27')) {
      return `+27 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    } else if (cleaned.startsWith('0')) {
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
    
    return phone; // Return original if format not recognized
  }

  /**
   * Generate unique ID
   */
  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Debounce function for form changes
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(null, args), wait);
    };
  }

  /**
   * Deep clone object (for form data manipulation)
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as any;
    if (typeof obj === 'object') {
      const cloned: any = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone((obj as any)[key]);
      });
      return cloned;
    }
    return obj;
  }

  // ===============================
  // FORM PRESETS AND TEMPLATES
  // ===============================

  /**
   * Get common field configurations
   */
  static getCommonFieldConfig(fieldType: string) {
    const configs = {
      email: {
        type: 'email',
        validators: ['required', 'email'],
        placeholder: 'user@example.com'
      },
      phone: {
        type: 'tel',
        validators: ['required', 'phone'],
        placeholder: '+27 81 123 4567'
      },
      currency: {
        type: 'number',
        validators: ['required', 'currency'],
        placeholder: '0.00',
        step: '0.01'
      },
      percentage: {
        type: 'number',
        validators: ['required', 'min:0', 'max:100'],
        placeholder: '0',
        min: 0,
        max: 100
      },
      year: {
        type: 'number',
        validators: ['required', 'min:1900', 'max:2100'],
        placeholder: new Date().getFullYear().toString(),
        min: 1900,
        max: 2100
      },
      url: {
        type: 'url',
        validators: ['url'],
        placeholder: 'https://example.com'
      }
    };

    return configs[fieldType as keyof typeof configs] || {};
  }

  /**
   * Auto-complete suggestions for common business fields
   */
  static getBusinessFieldSuggestions(fieldType: string): string[] {
    const suggestions = {
      industry: [
        'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
        'Manufacturing', 'Construction', 'Agriculture', 'Energy',
        'Transportation', 'Real Estate', 'Professional Services'
      ],
      businessStage: [
        'Startup', 'Early Stage', 'Growth Stage', 'Expansion',
        'Mature', 'Established', 'Scale-up'
      ],
      fundingType: [
        'Seed Funding', 'Series A', 'Series B', 'Bridge Loan',
        'Working Capital', 'Equipment Financing', 'Growth Capital'
      ],
      companyType: [
        'Private Company', 'Public Company', 'Partnership',
        'Sole Proprietorship', 'Non-Profit', 'Cooperative'
      ]
    };

    return suggestions[fieldType as keyof typeof suggestions] || [];
  }

  /**
   * Validate business-specific data
   */
  static validateBusinessData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate company registration number format (South Africa)
    if (data.registrationNumber && !/^\d{4}\/\d{6}\/\d{2}$/.test(data.registrationNumber)) {
      errors.push('Registration number must be in format YYYY/NNNNNN/NN');
    }

    // Validate VAT number format (South Africa)
    if (data.vatNumber && !/^\d{10}$/.test(data.vatNumber)) {
      errors.push('VAT number must be 10 digits');
    }

    // Validate business age consistency
    if (data.foundingYear && data.yearsInOperation) {
      const currentYear = new Date().getFullYear();
      const calculatedYears = currentYear - data.foundingYear;
      if (Math.abs(calculatedYears - data.yearsInOperation) > 1) {
        errors.push('Years in operation should match founding year');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}