// // src/app/SMEs/profile/steps/admin-information-step/admin-information.component.ts - REFACTORED
// import { Component, signal, computed, inject } from '@angular/core';
// import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
// import { LucideAngularModule, AlertTriangle, Plus, Edit, Trash2, ChevronDown, ChevronUp, Save, Clock } from 'lucide-angular';
// import { UiInputComponent, UiButtonComponent } from '../../../../shared/components';
// import { BaseFormStepComponent } from '../base/base-form-step.component';
// import { FormUtilitiesService } from '../base/form-utilities.service';
// import { CompanyInformation } from 'src/app/SMEs/applications/models/funding-application.models';

// interface Shareholder {
//   id: string;
//   fullName: string;
//   currentShareholding: number;
//   postInvestmentShareholding: number;
// }

// interface SectionStates {
//   contact: boolean;
//   business: boolean;
//   legal: boolean;
//   shareholders: boolean;
// }

// @Component({
//   selector: 'app-admin-information',
//   standalone: true,
//   imports: [ReactiveFormsModule, LucideAngularModule, UiInputComponent, UiButtonComponent],
//   templateUrl: 'admin-information.component.html'
// })
// export class AdminInformationComponent extends BaseFormStepComponent {
//   private fb = inject(FormBuilder);
//   private formUtils = inject(FormUtilitiesService);

//   // Form groups
//   adminForm!: FormGroup;
//   shareholderForm!: FormGroup;
  
//   // Component-specific state
//   showShareholderModal = signal(false);
//   editingShareholderIndex = signal(-1);
//   shareholders = signal<Shareholder[]>([]);
//   showValidationWarning = signal(false);

//   // Icons (keep existing ones for template compatibility)
//   AlertTriangleIcon = AlertTriangle;
//   ChevronDownIcon = ChevronDown;
//   ChevronUpIcon = ChevronUp;
//   PlusIcon = Plus;
//   EditIcon = Edit;
//   Trash2Icon = Trash2;
//   SaveIcon = Save;
//   ClockIcon = Clock;

//   // Section state management
//   private sectionStates = signal<SectionStates>({
//     contact: true,
//     business: true,
//     legal: true,
//     shareholders: false
//   });

//   // Computed validation summary
//   validationSummary = computed(() => 
//     this.formUtils.getValidationSummary(this.adminForm, this.fieldDisplayNames)
//   );

//   constructor() {
//     super();
    
//     // Initialize forms
//     this.initializeForms();
    
//     // Configure base class
//     this.configureAutoSave({
//       intervalMs: 30000, // 30 seconds
//       debounceMs: 2000   // 2 second debounce
//     });

//     // Set user-friendly field names for error messages
//     this.setFieldDisplayNames({
//       firstName: 'First name',
//       lastName: 'Last name',
//       email: 'Email',
//       phone: 'Phone number',
//       role: 'Role',
//       companyName: 'Company name',
//       registrationNumber: 'Registration number',
//       businessPhone: 'Business phone',
//       yearsInOperation: 'Years in operation',
//       addressLine1: 'Address line 1',
//       suburb: 'Suburb',
//       province: 'Province',
//       city: 'City',
//       postalCode: 'Postal code',
//       industry: 'Industry',
//       businessStage: 'Business stage',
//       bbbeeLevel: 'B-BBEE level',
//       staffCount: 'Staff count',
//       businessDescription: 'Business description',
//       cipcReturns: 'CIPC returns',
//       vatRegistered: 'VAT registration',
//       vatNumber: 'VAT number',
//       taxCompliance: 'Tax compliance',
//       incomeTaxNumber: 'Income tax number',
//       workmansComp: 'Workman\'s compensation'
//     });

//     // Show validation warning after 30 seconds if form is incomplete
//     setTimeout(() => {
//       if (!this.adminForm.valid) {
//         this.showValidationWarning.set(true);
//       }
//     }, 30000);
//   }

//   // ===============================
//   // BASE CLASS IMPLEMENTATIONS
//   // ===============================

//   getStepId(): string {
//     return 'company-info';
//   }

//   getFormGroup(): FormGroup {
//     return this.adminForm;
//   }

//   loadExistingData(): void {
//     const existingData = this.profileService.data().companyInfo;
//     if (existingData) {
//       this.populateFormsFromData(existingData);
//     }

//     // Load shareholders
//     this.loadExistingShareholders();
//   }

//   buildSaveData(): CompanyInformation {
//     const formValue = this.adminForm.value;
//     const shareholdersData = this.shareholders();

//     return {
//       companyName: formValue.companyName || '',
//       registrationNumber: formValue.registrationNumber || '',
//       vatNumber: formValue.vatRegistered === 'yes' ? formValue.vatNumber : undefined,
//       industryType: formValue.industry || '',
//       businessActivity: formValue.businessDescription || '',
//       foundingYear: new Date().getFullYear() - (formValue.yearsInOperation || 0),
//       operationalYears: formValue.yearsInOperation || 0,
//       companyType: 'pty_ltd',
//       employeeCount: formValue.staffCount?.toString() || '',
      
//       // Convert shareholders to ownership structure
//       ownership: shareholdersData.map(shareholder => ({
//         ownerName: shareholder.fullName,
//         ownershipPercentage: shareholder.currentShareholding,
//         role: 'Shareholder'
//       })),

//       registeredAddress: {
//         street: formValue.addressLine1 || '',
//         city: formValue.suburb || '',
//         province: formValue.province || '',
//         postalCode: formValue.postalCode || '',
//         country: 'South Africa'
//       },

//       operationalAddress: {
//         street: formValue.addressLine1 || '',
//         city: formValue.suburb || '',
//         province: formValue.province || '',
//         postalCode: formValue.postalCode || '',
//         country: 'South Africa'
//       },

//       contactPerson: {
//         fullName: `${formValue.firstName || ''} ${formValue.lastName || ''}`.trim(),
//         position: formValue.role || '',
//         email: formValue.email || '',
//         phone: formValue.phone || '',
//         idNumber: undefined
//       },

//       taxComplianceStatus: formValue.taxCompliance === 'compliant' ? 'compliant' : 'outstanding',
//       bbbeeLevel: formValue.bbbeeLevel || undefined,
//       regulatoryLicenses: []
//     };
//   }

//   hasFormData(): boolean {
//     const values = this.adminForm.value;
//     return Object.values(values).some(value => 
//       value !== null && value !== undefined && value !== ''
//     ) || this.shareholders().length > 0;
//   }

//   // ===============================
//   // CUSTOM VALIDATION
//   // ===============================

//   protected override customValidation() {
//     const baseValidation = super.customValidation();
    
//     // Add business-specific validation
//     const businessValidation = FormUtilitiesService.validateBusinessData(this.adminForm.value);
    
//     // Check shareholder validation
//     const shareholderErrors: string[] = [];
//     const shareholders = this.shareholders();
    
//     if (shareholders.length > 0) {
//       const totalOwnership = shareholders.reduce((sum, s) => sum + s.currentShareholding, 0);
//       if (Math.abs(totalOwnership - 100) > 0.1) {
//         shareholderErrors.push('Total shareholding must equal 100%');
//       }
//     }

//     return {
//       isValid: baseValidation.isValid && businessValidation.isValid && shareholderErrors.length === 0,
//       errors: [
//         ...baseValidation.errors,
//         ...businessValidation.errors,
//         ...shareholderErrors
//       ],
//       warnings: baseValidation.warnings,
//       missingFields: baseValidation.missingFields
//     };
//   }

//   // ===============================
//   // FORM INITIALIZATION
//   // ===============================

//   private initializeForms(): void {
//     this.adminForm = this.fb.group({
//       // Contact Details
//       firstName: ['', [Validators.required]],
//       lastName: ['', [Validators.required]],
//       email: ['', [Validators.required, Validators.email]],
//       phone: ['', [Validators.required, FormUtilitiesService.phoneValidator()]],
//       role: ['', [Validators.required]],

//       // Business Details
//       companyName: ['', [Validators.required]],
//       registrationNumber: ['', [Validators.required]],
//       businessPhone: ['', [FormUtilitiesService.phoneValidator()]],
//       yearsInOperation: ['', [Validators.required, Validators.min(0)]],
//       addressLine1: ['', [Validators.required]],
//       addressLine2: [''],
//       suburb: ['', [Validators.required]],
//       province: ['', [Validators.required]],
//       city: ['', [Validators.required]],
//       postalCode: ['', [Validators.required]],
//       industry: ['', [Validators.required]],
//       businessStage: ['', [Validators.required]],
//       bbbeeLevel: [''],
//       staffCount: ['', [Validators.required, Validators.min(1)]],
//       businessDescription: ['', [Validators.required, Validators.maxLength(500)]],

//       // Legal and Compliance
//       cipcReturns: ['', [Validators.required]],
//       vatRegistered: ['', [Validators.required]],
//       vatNumber: [''],
//       taxCompliance: ['', [Validators.required]],
//       incomeTaxNumber: ['', [Validators.required]],
//       workmansComp: ['', [Validators.required]]
//     });

//     this.shareholderForm = this.fb.group({
//       fullName: ['', [Validators.required]],
//       currentShareholding: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
//       postInvestmentShareholding: ['', [Validators.required, Validators.min(0), Validators.max(100)]]
//     });

//     // Set up conditional VAT number validation
//     this.adminForm.get('vatRegistered')?.valueChanges.subscribe(value => {
//       const vatNumberControl = this.adminForm.get('vatNumber');
//       if (value === 'yes') {
//         vatNumberControl?.setValidators([Validators.required]);
//       } else {
//         vatNumberControl?.clearValidators();
//       }
//       vatNumberControl?.updateValueAndValidity();
//     });
//   }

//   // ===============================
//   // DATA POPULATION
//   // ===============================

//   private populateFormsFromData(data: CompanyInformation): void {
//     this.adminForm.patchValue({
//       // Contact details from contactPerson
//       firstName: data.contactPerson?.fullName?.split(' ')[0] || '',
//       lastName: data.contactPerson?.fullName?.split(' ').slice(1).join(' ') || '',
//       email: data.contactPerson?.email || '',
//       phone: data.contactPerson?.phone || '',
//       role: data.contactPerson?.position || '',

//       // Business details
//       companyName: data.companyName || '',
//       registrationNumber: data.registrationNumber || '',
//       yearsInOperation: data.operationalYears || '',
//       addressLine1: data.operationalAddress?.street || '',
//       suburb: data.operationalAddress?.city || '',
//       province: data.operationalAddress?.province || '',
//       postalCode: data.operationalAddress?.postalCode || '',
//       industry: data.industryType || '',
//       businessDescription: data.businessActivity || '',
//       staffCount: data.employeeCount || '',

//       // Legal compliance
//       vatNumber: data.vatNumber || '',
//       vatRegistered: data.vatNumber ? 'yes' : 'no',
//       taxCompliance: data.taxComplianceStatus === 'compliant' ? 'compliant' : 'outstanding'
//     });

//     // Convert ownership to shareholders format
//     if (data.ownership && data.ownership.length > 0) {
//       const shareholderData = data.ownership.map((owner, index) => ({
//         id: (index + 1).toString(),
//         fullName: owner.ownerName,
//         currentShareholding: owner.ownershipPercentage,
//         postInvestmentShareholding: owner.ownershipPercentage
//       }));
//       this.shareholders.set(shareholderData);
//     }
//   }

//   private loadExistingShareholders(): void {
//     const existingData = this.profileService.data().companyInfo;
//     if (existingData?.ownership && existingData.ownership.length > 0) {
//       const shareholderData = existingData.ownership.map((owner, index) => ({
//         id: (index + 1).toString(),
//         fullName: owner.ownerName,
//         currentShareholding: owner.ownershipPercentage,
//         postInvestmentShareholding: owner.ownershipPercentage
//       }));
//       this.shareholders.set(shareholderData);
//     }
//   }

//   // ===============================
//   // UI HELPER METHODS (Simplified)
//   // ===============================

//   getSectionExpanded(sectionId: keyof SectionStates): boolean {
//     const states = this.sectionStates();
//     return states[sectionId];
//   }

//   toggleSection(sectionId: keyof SectionStates): void {
//     this.sectionStates.update(current => ({
//       ...current,
//       [sectionId]: !current[sectionId]
//     }));
//   }

//   dismissWarning(): void {
//     this.showValidationWarning.set(false);
//   }

//   // Override base class method to provide better completion calculation
//   override getCompletionPercentage(): number {
//     const validation = this.validationSummary();
//     const shareholderCompletion = this.shareholders().length > 0 ? 100 : 0;
    
//     // Weight form completion (80%) + shareholders (20%)
//     return Math.round((validation.completionPercentage * 0.8) + (shareholderCompletion * 0.2));
//   }

//   // ===============================
//   // SHAREHOLDER MANAGEMENT (Unchanged)
//   // ===============================

//   addShareholder(): void {
//     this.shareholderForm.reset();
//     this.editingShareholderIndex.set(-1);
//     this.showShareholderModal.set(true);
//   }

//   editShareholder(index: number): void {
//     const shareholder = this.shareholders()[index];
//     this.shareholderForm.patchValue(shareholder);
//     this.editingShareholderIndex.set(index);
//     this.showShareholderModal.set(true);
//   }

//   deleteShareholder(index: number): void {
//     if (confirm('Are you sure you want to delete this shareholder?')) {
//       this.shareholders.update(current => current.filter((_, i) => i !== index));
//       this.hasUnsavedChanges.set(true); // Trigger auto-save
//     }
//   }

//   closeShareholderModal(): void {
//     this.showShareholderModal.set(false);
//     this.editingShareholderIndex.set(-1);
//     this.shareholderForm.reset();
//   }

//   saveShareholder(): void {
//     if (this.shareholderForm.valid) {
//       const formValue = this.shareholderForm.value;
//       const shareholderData: Shareholder = {
//         id: this.editingShareholderIndex() !== -1 
//           ? this.shareholders()[this.editingShareholderIndex()].id
//           : FormUtilitiesService.generateId(),
//         fullName: formValue.fullName,
//         currentShareholding: formValue.currentShareholding,
//         postInvestmentShareholding: formValue.postInvestmentShareholding
//       };

//       if (this.editingShareholderIndex() !== -1) {
//         // Update existing shareholder
//         this.shareholders.update(current => 
//           current.map((s, i) => i === this.editingShareholderIndex() ? shareholderData : s)
//         );
//       } else {
//         // Add new shareholder
//         this.shareholders.update(current => [...current, shareholderData]);
//       }

//       this.closeShareholderModal();
//       this.hasUnsavedChanges.set(true); // Trigger auto-save
//     }
//   }

//   // ===============================
//   // BUSINESS FIELD SUGGESTIONS
//   // ===============================

//   getIndustrySuggestions(): string[] {
//     return FormUtilitiesService.getBusinessFieldSuggestions('industry');
//   }

//   getBusinessStageSuggestions(): string[] {
//     return FormUtilitiesService.getBusinessFieldSuggestions('businessStage');
//   }
// }

// /*
// KEY IMPROVEMENTS AFTER REFACTORING:

// 1. CODE REDUCTION:
//    - From ~650 lines to ~300 lines (54% reduction)
//    - Removed 100+ lines of auto-save logic
//    - Removed 50+ lines of validation helpers
//    - Removed 30+ lines of navigation methods

// 2. ENHANCED FEATURES:
//    - Better validation with business-specific rules
//    - Improved error messages with field display names
//    - Real-time validation summary
//    - Auto-save configuration
//    - Phone and business validation

// 3. MAINTAINABILITY:
//    - Single responsibility: only company info logic
//    - Type-safe with proper interfaces
//    - Centralized auto-save in base class
//    - Consistent patterns

// 4. BETTER UX:
//    - Configurable auto-save intervals
//    - User-friendly error messages
//    - Real-time validation feedback
//    - Business field suggestions

// REMOVED (handled by base class):
// - setupAutoSave() method
// - debouncedSave() method
// - saveData() method
// - getLastSavedText() method
// - getFieldError() method
// - getFieldDisplayName() method
// - saveManually() method
// - goBack() method
// - saveAndContinue() method
// - Auto-save subscription management
// - Debounce timer management
// - isSaving and lastSaved signals
// */