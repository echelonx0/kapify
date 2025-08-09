 
// src/app/profile/steps/admin-information.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { LucideAngularModule, AlertTriangle, Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-angular';
import { UiInputComponent, UiCardComponent, UiButtonComponent } from '../../shared/components';
import { ProfileService } from '../profile.service';

interface Shareholder {
  id: string;
  fullName: string;
  currentShareholding: number;
  postInvestmentShareholding: number;
}

interface SectionStates {
  contact: boolean;
  business: boolean;
  legal: boolean;
  shareholders: boolean;
}

@Component({
  selector: 'app-admin-information',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, UiInputComponent, UiButtonComponent],
  templateUrl: 'admin-information.component.html'
})
export class AdminInformationComponent implements OnInit {
  adminForm: FormGroup;
  shareholderForm: FormGroup;
  isSaving = signal(false);
  lastSaved = signal(false);
  showValidationWarning = signal(false);
  showShareholderModal = signal(false);
  editingShareholderIndex = signal(-1);
  shareholders = signal<Shareholder[]>([]);

  // Icons
  AlertTriangleIcon = AlertTriangle;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;
  PlusIcon = Plus;
  EditIcon = Edit;
  Trash2Icon = Trash2;

  // Section states with proper typing
  private sectionStates = signal<SectionStates>({
    contact: true,
    business: true,
    legal: true,
    shareholders: false
  });

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService
  ) {
    this.adminForm = this.fb.group({
      // Contact Details
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      role: ['', [Validators.required]],

      // Business Details
      companyName: ['', [Validators.required]],
      registrationNumber: ['', [Validators.required]],
      businessPhone: [''],
      yearsInOperation: ['', [Validators.required, Validators.min(0)]],
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      suburb: ['', [Validators.required]],
      province: ['', [Validators.required]],
      city: ['', [Validators.required]],
      postalCode: ['', [Validators.required]],
      industry: ['', [Validators.required]],
      businessStage: ['', [Validators.required]],
      bbbeeLevel: [''],
      staffCount: ['', [Validators.required, Validators.min(1)]],
      businessDescription: ['', [Validators.required, Validators.maxLength(500)]],

      // Legal and Compliance
      cipcReturns: ['', [Validators.required]],
      vatRegistered: ['', [Validators.required]],
      vatNumber: [''],
      taxCompliance: ['', [Validators.required]],
      incomeTaxNumber: ['', [Validators.required]],
      workmansComp: ['', [Validators.required]]
    });

    this.shareholderForm = this.fb.group({
      fullName: ['', [Validators.required]],
      currentShareholding: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      postInvestmentShareholding: ['', [Validators.required, Validators.min(0), Validators.max(100)]]
    });

    // Set up conditional VAT number validation
    this.adminForm.get('vatRegistered')?.valueChanges.subscribe(value => {
      const vatNumberControl = this.adminForm.get('vatNumber');
      if (value === 'yes') {
        vatNumberControl?.setValidators([Validators.required]);
      } else {
        vatNumberControl?.clearValidators();
      }
      vatNumberControl?.updateValueAndValidity();
    });

    // Auto-save on form changes
    this.adminForm.valueChanges.subscribe(() => {
      this.autoSave();
    });

    // Show validation warning after 30 seconds if form is incomplete
    setTimeout(() => {
      if (this.adminForm.invalid) {
        this.showValidationWarning.set(true);
      }
    }, 30000);
  }

  ngOnInit() {
    // Load existing data
    const existingData = this.profileService.data();
    if (existingData.personalInfo) {
      this.adminForm.patchValue({
        firstName: existingData.personalInfo.firstName,
        lastName: existingData.personalInfo.lastName,
        email: existingData.personalInfo.email,
        phone: existingData.personalInfo.phone,
        role: existingData.personalInfo.position
      });
    }

    if (existingData.businessInfo) {
      this.adminForm.patchValue({
        companyName: existingData.businessInfo.companyName,
        registrationNumber: existingData.businessInfo.registrationNumber,
        yearsInOperation: existingData.businessInfo.yearsInOperation,
        addressLine1: existingData.businessInfo.physicalAddress?.street,
        suburb: existingData.businessInfo.physicalAddress?.city,
        province: existingData.businessInfo.physicalAddress?.province,
        postalCode: existingData.businessInfo.physicalAddress?.postalCode,
        industry: existingData.businessInfo.industry,
        staffCount: existingData.businessInfo.numberOfEmployees
      });
    }

    // Load shareholders if they exist
    this.loadExistingShareholders();
  }

  getSectionExpanded(sectionId: keyof SectionStates): boolean {
    const states = this.sectionStates();
    return states[sectionId];
  }

  toggleSection(sectionId: keyof SectionStates) {
    this.sectionStates.update(current => ({
      ...current,
      [sectionId]: !current[sectionId]
    }));
  }

  getFieldError(fieldName: string): string | undefined {
    const field = this.adminForm.get(fieldName);
    if (field?.errors && field?.touched) {
      if (field.errors['required']) return `${this.getFieldDisplayName(fieldName)} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['min']) return 'Value must be greater than 0';
      if (field.errors['max']) return 'Value cannot exceed 100';
      if (field.errors['maxlength']) return 'Description cannot exceed 500 characters';
    }
    return undefined;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone number',
      role: 'Role',
      companyName: 'Company name',
      registrationNumber: 'Registration number',
      yearsInOperation: 'Years in operation',
      addressLine1: 'Address line 1',
      suburb: 'Suburb',
      province: 'Province',
      city: 'City',
      postalCode: 'Postal code',
      industry: 'Industry',
      businessStage: 'Business stage',
      staffCount: 'Staff count',
      businessDescription: 'Business description',
      cipcReturns: 'CIPC returns',
      vatRegistered: 'VAT registration',
      vatNumber: 'VAT number',
      taxCompliance: 'Tax compliance',
      incomeTaxNumber: 'Income tax number',
      workmansComp: 'Workman\'s compensation'
    };
    return displayNames[fieldName] || fieldName;
  }

  dismissWarning() {
    this.showValidationWarning.set(false);
  }

  // Shareholder Management
  addShareholder() {
    this.shareholderForm.reset();
    this.editingShareholderIndex.set(-1);
    this.showShareholderModal.set(true);
  }

  editShareholder(index: number) {
    const shareholder = this.shareholders()[index];
    this.shareholderForm.patchValue(shareholder);
    this.editingShareholderIndex.set(index);
    this.showShareholderModal.set(true);
  }

  deleteShareholder(index: number) {
    if (confirm('Are you sure you want to delete this shareholder?')) {
      this.shareholders.update(current => current.filter((_, i) => i !== index));
      this.saveData();
    }
  }

  closeShareholderModal() {
    this.showShareholderModal.set(false);
    this.editingShareholderIndex.set(-1);
    this.shareholderForm.reset();
  }

  saveShareholder() {
    if (this.shareholderForm.valid) {
      const formValue = this.shareholderForm.value;
      const shareholderData: Shareholder = {
        id: this.editingShareholderIndex() !== -1 
          ? this.shareholders()[this.editingShareholderIndex()].id
          : Date.now().toString(),
        fullName: formValue.fullName,
        currentShareholding: formValue.currentShareholding,
        postInvestmentShareholding: formValue.postInvestmentShareholding
      };

      if (this.editingShareholderIndex() !== -1) {
        // Update existing shareholder
        this.shareholders.update(current => 
          current.map((s, i) => i === this.editingShareholderIndex() ? shareholderData : s)
        );
      } else {
        // Add new shareholder
        this.shareholders.update(current => [...current, shareholderData]);
      }

      this.closeShareholderModal();
      this.saveData();
    }
  }

  private loadExistingShareholders() {
    // Load from your data service - mock data for now
    const mockShareholders: Shareholder[] = [
      {
        id: '1',
        fullName: 'Elizabeth Swan',
        currentShareholding: 51,
        postInvestmentShareholding: 51
      },
      {
        id: '2',
        fullName: 'Jack Sparrow',
        currentShareholding: 49,
        postInvestmentShareholding: 49
      }
    ];
    this.shareholders.set(mockShareholders);
  }

  async autoSave() {
    if (this.adminForm.valid) {
      this.isSaving.set(true);
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.saveData();
      this.isSaving.set(false);
      this.lastSaved.set(true);
      
      // Hide saved indicator after 3 seconds
      setTimeout(() => this.lastSaved.set(false), 3000);
    }
  }

  private saveData() {
    const formValue = this.adminForm.value;
    
    // Update personal information
    const personalInfo = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone,
      idNumber: '', // Would need to add ID number field
      position: formValue.role
    };

    // Update business information
    const businessInfo = {
      companyName: formValue.companyName,
      registrationNumber: formValue.registrationNumber,
      vatNumber: formValue.vatNumber,
      industry: formValue.industry,
      yearsInOperation: formValue.yearsInOperation,
      numberOfEmployees: formValue.staffCount,
      physicalAddress: {
        street: formValue.addressLine1,
        city: formValue.suburb,
        province: formValue.province,
        postalCode: formValue.postalCode
      }
    };

    // Update additional fields that might be used later
    const additionalInfo = {
      businessStage: formValue.businessStage,
      bbbeeLevel: formValue.bbbeeLevel,
      businessDescription: formValue.businessDescription,
      addressLine2: formValue.addressLine2,
      city: formValue.city,
      businessPhone: formValue.businessPhone,
      
      // Legal and compliance
      cipcReturns: formValue.cipcReturns,
      vatRegistered: formValue.vatRegistered,
      taxCompliance: formValue.taxCompliance,
      incomeTaxNumber: formValue.incomeTaxNumber,
      workmansComp: formValue.workmansComp,
      
      // Shareholders
      shareholders: this.shareholders()
    };

    // Save to profile service
    this.profileService.updatePersonalInfo(personalInfo);
    this.profileService.updateBusinessInfo(businessInfo);
    
    // You might want to extend the profile service to handle additional fields
    // or create a separate method for administrative information
    
    // Mark this step as completed
    // this.profileService.markStepCompleted('admin'); // Uncomment when method exists
  }
}