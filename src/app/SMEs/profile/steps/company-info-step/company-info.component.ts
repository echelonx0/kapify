import {
  Component,
  signal,
  computed,
  OnInit,
  OnDestroy,
  inject,
  effect,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  LucideAngularModule,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Save,
  Clock,
} from 'lucide-angular';
import {
  UiInputComponent,
  UiButtonComponent,
} from '../../../../shared/components';

import { FundingProfileSetupService } from '../../../services/funding-profile-setup.service';
import { CompanyInformation } from 'src/app/SMEs/applications/models/funding-application.models';
import {
  ShareholderManagerComponent,
  Shareholder,
} from './components/shareholder-manager.component';

@Component({
  selector: 'app-admin-information',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    LucideAngularModule,
    UiInputComponent,
    UiButtonComponent,
    ShareholderManagerComponent,
  ],
  templateUrl: 'company-info.component.html',
})
export class CompanyInfoComponent implements OnInit, OnDestroy {
  private fundingApplicationService = inject(FundingProfileSetupService);
  private fb = inject(FormBuilder);
  private cachedCompanyInfo: any = null;
  // Forms
  adminForm: FormGroup;
  shareholderForm: FormGroup | undefined;

  // UI State
  isSaving = signal(false);
  lastSaved = signal<Date | null>(null);
  showValidationWarning = signal(false);

  // Data
  shareholders = signal<Shareholder[]>([]);

  // Section expansion state
  private expandedSections = signal<Record<string, boolean>>({
    contact: true,
    business: true,
    legal: true,
    shareholders: false,
  });

  // Icons
  AlertTriangleIcon = AlertTriangle;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;
  SaveIcon = Save;
  ClockIcon = Clock;

  // Computed: Last saved text
  readonly lastSavedText = computed(() => {
    const saved = this.lastSaved();
    if (!saved) return '';

    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60)
      return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

    return saved.toLocaleDateString();
  });

  // Computed: Has unsaved changes
  readonly hasUnsavedChanges = computed(() => {
    return this.adminForm.dirty || this.shareholders().length > 0;
  });

  // Computed: Is form valid
  readonly isFormValid = computed(() => {
    return this.adminForm.valid;
  });

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.adminForm = this.createAdminForm();

    // Setup effects in constructor (proper injection context)
    effect(() => {
      if (!this.fundingApplicationService.loading()) {
        this.loadExistingData();
      }
    });

    effect(() => {
      const serviceData = this.fundingApplicationService.data().companyInfo;
      if (serviceData?.ownership) {
        this.shareholders.set(
          serviceData.ownership.map((owner, index) => ({
            id: index.toString(),
            fullName: owner.ownerName,
            currentShareholding: owner.ownershipPercentage,
            postInvestmentShareholding: owner.ownershipPercentage,
          }))
        );
      }
    });
  }

  ngOnInit() {
    // Subscribe to form changes for debounced sync
    this.adminForm.valueChanges.subscribe(() => {
      this.syncFormToService();
    });
  }

  ngOnDestroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  // ===============================
  // FORM CREATION
  // ===============================

  private createAdminForm(): FormGroup {
    return this.fb.group({
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
      businessDescription: [
        '',
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(500),
        ],
      ],

      // Legal and Compliance (OPTIONAL - captures data but doesn't block save)
      cipcReturns: [''],
      vatRegistered: [''],
      vatNumber: [''],
      taxCompliance: [''],
      incomeTaxNumber: ['', [Validators.pattern(/^\d{10}$/)]],
      workmansComp: [''],
    });
  }

  // ===============================
  // DATA LOADING
  // ===============================

  private loadExistingData() {
    const existingData = this.fundingApplicationService.data().companyInfo;
    if (existingData) {
      this.populateAdminForm(existingData);
      this.loadShareholderData(existingData);
      this.cachedCompanyInfo = existingData;
    }
  }

  private populateAdminForm(data: CompanyInformation) {
    const [firstName, ...lastNameParts] = (
      data.contactPerson?.fullName || ''
    ).split(' ');

    this.adminForm.patchValue(
      {
        firstName: firstName || '',
        lastName: lastNameParts.join(' ') || '',
        email: data.contactPerson?.email || '',
        phone: data.contactPerson?.phone || '',
        role: data.contactPerson?.position || '',
        companyName: data.companyName || '',
        registrationNumber: data.registrationNumber || '',
        businessPhone: data.businessPhone || '',
        yearsInOperation: data.operationalYears || '',
        addressLine1: data.operationalAddress?.street || '',
        suburb: data.operationalAddress?.city || '',
        province: data.operationalAddress?.province || '',
        postalCode: data.operationalAddress?.postalCode || '',
        city: data.operationalAddress?.city || '',
        industry: data.industryType || '',
        businessStage: data.businessStage || '',
        bbbeeLevel: data.bbbeeLevel || '',
        staffCount: data.employeeCount || '',
        businessDescription: data.businessActivity || '',
        vatNumber: data.vatNumber || '',
        vatRegistered: data.vatNumber ? 'yes' : 'no',
        taxCompliance:
          data.taxComplianceStatus === 'compliant'
            ? 'compliant'
            : 'outstanding',
        cipcReturns: data.cipcReturns || '',
        incomeTaxNumber: data.incomeTaxNumber || '',
        workmansComp: data.workmansCompensation || '',
      },
      { emitEvent: false }
    );

    // Set up conditional VAT validation
    this.setupVatValidation();

    this.adminForm.markAsPristine();
  }

  private setupVatValidation() {
    const vatRegisteredControl = this.adminForm.get('vatRegistered');
    const vatNumberControl = this.adminForm.get('vatNumber');

    if (vatRegisteredControl && vatNumberControl) {
      // Set initial validation based on current value
      if (vatRegisteredControl.value === 'yes') {
        vatNumberControl.setValidators([Validators.required]);
      } else {
        vatNumberControl.clearValidators();
      }
      vatNumberControl.updateValueAndValidity({ emitEvent: false });

      // Subscribe to future changes
      vatRegisteredControl.valueChanges.subscribe((value) => {
        if (value === 'yes') {
          vatNumberControl.setValidators([Validators.required]);
        } else {
          vatNumberControl.clearValidators();
        }
        vatNumberControl.updateValueAndValidity();
      });
    }
  }

  private loadShareholderData(data: CompanyInformation) {
    if (data.ownership && data.ownership.length > 0) {
      const shareholderData = data.ownership.map((owner, index) => ({
        id: index.toString(),
        fullName: owner.ownerName,
        currentShareholding: owner.ownershipPercentage,
        postInvestmentShareholding: owner.ownershipPercentage,
      }));
      this.shareholders.set(shareholderData);
    }
  }

  // ===============================
  // SAVE OPERATIONS
  // ===============================

  async saveManually() {
    if (this.isSaving() || !this.adminForm.valid) {
      console.log(
        'Form validity check - Valid:',
        this.adminForm.valid,
        'Errors:',
        this.getFormErrors()
      );
      return;
    }

    this.isSaving.set(true);
    try {
      const companyData = this.buildCompanyInfoData();
      console.log('Saving company data:', companyData);
      this.fundingApplicationService.updateCompanyInfo(companyData);
      await this.fundingApplicationService.saveCurrentProgress();
      this.lastSaved.set(new Date());
      this.adminForm.markAsPristine();
      console.log('Company information saved successfully');
    } catch (error) {
      console.error('Failed to save company information:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  private syncFormToService() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      if (this.adminForm.valid && this.adminForm.dirty) {
        const companyData = this.buildCompanyInfoData();
        this.fundingApplicationService.updateCompanyInfo(companyData);
        this.adminForm.markAsPristine();
      }
    }, 500);
  }

  private buildCompanyInfoData(): CompanyInformation {
    const formValue = this.adminForm.value;
    const address = this.buildAddress(formValue);

    return {
      companyName: formValue.companyName || '',
      registrationNumber: formValue.registrationNumber || '',
      vatNumber:
        formValue.vatRegistered === 'yes' ? formValue.vatNumber : undefined,
      industryType: formValue.industry || '',
      businessActivity: formValue.businessDescription || '',
      foundingYear:
        new Date().getFullYear() - (formValue.yearsInOperation || 0),
      operationalYears: formValue.yearsInOperation || 0,
      companyType: 'pty_ltd',
      employeeCount: formValue.staffCount?.toString() || '',
      businessStage: formValue.businessStage || undefined,
      businessPhone: formValue.businessPhone || undefined,
      bbbeeLevel: formValue.bbbeeLevel || undefined,

      ownership:
        this.shareholders().length > 0
          ? this.shareholders().map((shareholder) => ({
              ownerName: shareholder.fullName,
              ownershipPercentage: shareholder.currentShareholding,
              role: 'Shareholder',
            }))
          : this.cachedCompanyInfo?.ownership || [],

      registeredAddress: address,
      operationalAddress: address,

      contactPerson: {
        fullName: `${formValue.firstName || ''} ${
          formValue.lastName || ''
        }`.trim(),
        position: formValue.role || '',
        email: formValue.email || '',
        phone: formValue.phone || '',
        idNumber: undefined,
      },

      taxComplianceStatus:
        formValue.taxCompliance === 'compliant' ? 'compliant' : 'outstanding',
      cipcReturns: formValue.cipcReturns || undefined,
      incomeTaxNumber: formValue.incomeTaxNumber || undefined,
      workmansCompensation: formValue.workmansComp || undefined,
      regulatoryLicenses: [],
    };
  }

  private buildAddress(formValue: any) {
    const street = formValue.addressLine2
      ? `${formValue.addressLine1}, ${formValue.addressLine2}`
      : formValue.addressLine1;

    return {
      street: street || '',
      city: formValue.city || '',
      province: formValue.province || '',
      postalCode: formValue.postalCode || '',
      country: 'South Africa',
    };
  }

  // ===============================
  // UI HELPERS
  // ===============================

  toggleSection(section: string) {
    this.expandedSections.update((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  getSectionExpanded(section: string): boolean {
    return this.expandedSections()[section] ?? false;
  }

  dismissWarning() {
    this.showValidationWarning.set(false);
  }

  getLastSavedText(): string {
    return this.lastSavedText();
  }

  onShareholdersChange(updatedShareholders: Shareholder[]) {
    this.shareholders.set(updatedShareholders);
    this.syncShareholdersToService(updatedShareholders);
  }

  private syncShareholdersToService(updatedShareholders: Shareholder[]) {
    const existingData =
      this.fundingApplicationService.data().companyInfo || {};
    this.fundingApplicationService.updateCompanyInfo({
      ...existingData,
      ownership: updatedShareholders.map((s) => ({
        ownerName: s.fullName,
        ownershipPercentage: s.currentShareholding,
        role: 'Shareholder',
      })),
    });
  }

  getFieldError(fieldName: string): string | undefined {
    const field = this.adminForm.get(fieldName);
    if (!field?.errors || !field.touched) return undefined;

    const displayName = this.getFieldDisplayName(fieldName);

    if (field.errors['required']) return `${displayName} is required`;
    if (field.errors['email']) return 'Enter a valid email address';
    if (field.errors['minlength']) {
      return `${displayName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors['maxlength']) return `Cannot exceed 500 characters`;
    if (field.errors['pattern'] && fieldName === 'incomeTaxNumber') {
      return 'Income tax number must be exactly 10 digits';
    }
    if (field.errors['pattern']) return 'Invalid format';
    if (field.errors['min']) return 'Value must be greater than 0';
    if (field.errors['max']) return 'Value cannot exceed 100';

    return undefined;
  }

  /**
   * Debug helper: returns all field errors for troubleshooting
   */
  private getFormErrors(): Record<string, any> {
    const errors: Record<string, any> = {};
    Object.keys(this.adminForm.controls).forEach((key) => {
      const control = this.adminForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  private getFieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
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
      workmansComp: "Workman's compensation",
      businessPhone: 'Business phone',
      addressLine2: 'Address line 2',
    };
    return displayNames[fieldName] || fieldName;
  }
}
