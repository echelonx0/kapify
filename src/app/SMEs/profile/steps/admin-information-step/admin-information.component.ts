// src/app/profile/steps/admin-information-step/admin-information.component.ts
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LucideAngularModule, AlertTriangle, Plus, Edit, Trash2, ChevronDown, ChevronUp, Save, Clock } from 'lucide-angular';
import { UiInputComponent, UiButtonComponent } from '../../../../shared/components';
 
import { interval, Subscription } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { FundingProfileSetupService } from '../../../services/funding-profile-setup.service';
import { CompanyInformation } from '../../../models/funding-application.models';

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
export class AdminInformationComponent implements OnInit, OnDestroy {
  private fundingApplicationService = inject(FundingProfileSetupService);
  private fb = inject(FormBuilder);

  adminForm: FormGroup;
  shareholderForm: FormGroup;
  
  // State signals
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);
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
  SaveIcon = Save;
  ClockIcon = Clock;

  // Section states with proper typing
  private sectionStates = signal<SectionStates>({
    contact: true,
    business: true,
    legal: true,
    shareholders: false
  });

  // Auto-save subscription
  private autoSaveSubscription?: Subscription;
  
  // FIX: Proper timeout typing that works across environments
  private debounceTimer?: ReturnType<typeof setTimeout>;

  constructor() {
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

    // Show validation warning after 30 seconds if form is incomplete
    setTimeout(() => {
      if (this.adminForm.invalid) {
        this.showValidationWarning.set(true);
      }
    }, 30000);
  }

  ngOnInit() {
    this.loadExistingData();
    this.setupAutoSave();
  }

  ngOnDestroy() {
    this.autoSaveSubscription?.unsubscribe();
    // FIX: Properly clear timeout with correct typing
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  // ===============================
  // DATA LOADING & SAVING
  // ===============================

  private loadExistingData() {
    const existingData = this.fundingApplicationService.data().companyInfo;
    if (existingData) {
      this.populateFormsFromData(existingData);
    }

    // Load shareholders from existing data or mock data
    this.loadExistingShareholders();
  }

  private populateFormsFromData(data: CompanyInformation) {
    // Populate main form
    this.adminForm.patchValue({
      // Contact details from contactPerson
      firstName: data.contactPerson?.fullName?.split(' ')[0] || '',
      lastName: data.contactPerson?.fullName?.split(' ').slice(1).join(' ') || '',
      email: data.contactPerson?.email || '',
      phone: data.contactPerson?.phone || '',
      role: data.contactPerson?.position || '',

      // Business details
      companyName: data.companyName || '',
      registrationNumber: data.registrationNumber || '',
      yearsInOperation: data.operationalYears || '',
      addressLine1: data.operationalAddress?.street || '',
      suburb: data.operationalAddress?.city || '',
      province: data.operationalAddress?.province || '',
      postalCode: data.operationalAddress?.postalCode || '',
      industry: data.industryType || '',
      businessDescription: data.businessActivity || '',
      staffCount: data.employeeCount || '',

      // Legal compliance
      vatNumber: data.vatNumber || '',
      vatRegistered: data.vatNumber ? 'yes' : 'no',
      taxCompliance: data.taxComplianceStatus === 'compliant' ? 'compliant' : 'outstanding'
    });

    // Convert ownership to shareholders format
    if (data.ownership && data.ownership.length > 0) {
      const shareholderData = data.ownership.map((owner, index) => ({
        id: (index + 1).toString(),
        fullName: owner.ownerName,
        currentShareholding: owner.ownershipPercentage,
        postInvestmentShareholding: owner.ownershipPercentage // Default to same
      }));
      this.shareholders.set(shareholderData);
    }
  }

  private setupAutoSave() {
    // Auto-save every 30 seconds when data changes
    this.autoSaveSubscription = interval(30000).pipe(
      takeWhile(() => true)
    ).subscribe(() => {
      if (this.hasFormData() && !this.isSaving()) {
        this.saveData(false);
      }
    });

    // Also save on form value changes (debounced)
    this.adminForm.valueChanges.subscribe(() => this.debouncedSave());
  }

  private debouncedSave() {
    // FIX: Properly handle timeout with correct typing
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // FIX: Use proper return type from setTimeout
    this.debounceTimer = setTimeout(() => {
      if (this.hasFormData() && !this.isSaving()) {
        this.saveData(false);
      }
    }, 2000) as ReturnType<typeof setTimeout>;
  }

  async saveManually() {
    await this.saveData(true);
  }

  private async saveData(isManual: boolean = false) {
    if (this.isSaving()) return;

    this.isSaving.set(true);
    
    try {
      const companyData = this.buildCompanyInfoData();
      this.fundingApplicationService.updateCompanyInfo(companyData);
      
      if (isManual) {
        // Force save to backend for manual saves
        await this.fundingApplicationService.saveCurrentProgress();
      }
      
      this.lastSaved.set(new Date());
    } catch (error) {
      console.error('Failed to save company information:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private buildCompanyInfoData(): CompanyInformation {
    const formValue = this.adminForm.value;
    const shareholdersData = this.shareholders();

    return {
      companyName: formValue.companyName || '',
      registrationNumber: formValue.registrationNumber || '',
      vatNumber: formValue.vatRegistered === 'yes' ? formValue.vatNumber : undefined,
      industryType: formValue.industry || '',
      businessActivity: formValue.businessDescription || '',
      foundingYear: new Date().getFullYear() - (formValue.yearsInOperation || 0),
      operationalYears: formValue.yearsInOperation || 0,
      companyType: 'pty_ltd', // Default, could be made selectable
      employeeCount: formValue.staffCount?.toString() || '',
      
      // Convert shareholders to ownership structure
      ownership: shareholdersData.map(shareholder => ({
        ownerName: shareholder.fullName,
        ownershipPercentage: shareholder.currentShareholding,
        role: 'Shareholder'
      })),

      registeredAddress: {
        street: formValue.addressLine1 || '',
        city: formValue.suburb || '',
        province: formValue.province || '',
        postalCode: formValue.postalCode || '',
        country: 'South Africa'
      },

      operationalAddress: {
        street: formValue.addressLine1 || '',
        city: formValue.suburb || '',
        province: formValue.province || '',
        postalCode: formValue.postalCode || '',
        country: 'South Africa'
      },

      contactPerson: {
        fullName: `${formValue.firstName || ''} ${formValue.lastName || ''}`.trim(),
        position: formValue.role || '',
        email: formValue.email || '',
        phone: formValue.phone || '',
        idNumber: undefined // Would need to add this field
      },

      taxComplianceStatus: formValue.taxCompliance === 'compliant' ? 'compliant' : 'outstanding',
      bbbeeLevel: formValue.bbbeeLevel || undefined,
      regulatoryLicenses: [] // Would be populated elsewhere
    };
  }

  // ===============================
  // UI HELPER METHODS
  // ===============================

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

  hasFormData(): boolean {
    const values = this.adminForm.value;
    return Object.values(values).some(value => 
      value !== null && value !== undefined && value !== ''
    );
  }

  getLastSavedText(): string {
    const saved = this.lastSaved();
    if (!saved) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    return saved.toLocaleDateString();
  }

  // ===============================
  // SHAREHOLDER MANAGEMENT
  // ===============================

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
    // Check if shareholders exist in the funding application data
    const existingData = this.fundingApplicationService.data().companyInfo;
    if (existingData?.ownership && existingData.ownership.length > 0) {
      const shareholderData = existingData.ownership.map((owner, index) => ({
        id: (index + 1).toString(),
        fullName: owner.ownerName,
        currentShareholding: owner.ownershipPercentage,
        postInvestmentShareholding: owner.ownershipPercentage
      }));
      this.shareholders.set(shareholderData);
    } else {
      // Load mock data for demonstration (remove in production)
      const mockShareholders: Shareholder[] = [
        {
          id: '1',
          fullName: 'Dummy Shareholder Swan',
          currentShareholding: 51,
          postInvestmentShareholding: 51
        },
        {
          id: '2',
          fullName: 'Jack Sparrow Test Shareholder',
          currentShareholding: 49,
          postInvestmentShareholding: 49
        }
      ];
      this.shareholders.set(mockShareholders);
    }
  }
}