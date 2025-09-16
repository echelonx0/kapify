// src/app/funder/components/legal-info-form.component.ts 
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  LucideAngularModule, 
  FileText,
  MapPin,
  Building,
  Calendar,
  Users,
  DollarSign,
  Save,
  Check,
  AlertCircleIcon,
  ChevronDown,
  ChevronRight
} from 'lucide-angular';
import { UiButtonComponent} from '../../../shared/components'; 
import { FunderOnboardingService } from '../../services/funder-onboarding.service';
import { FunderOrganization } from '../../../shared/models/user.models';

interface LegalInfoFormData {
  legalName: string;
  registrationNumber: string;
  fspLicenseNumber: string;
  ncrNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
 
}

interface SectionState {
  legal: boolean;
  address: boolean;
  scale: boolean;
}

@Component({
  selector: 'app-legal-info-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiButtonComponent,
    LucideAngularModule
  ],
  templateUrl: 'legal-info.component.html'
})
export class LegalInfoFormComponent implements OnInit, OnDestroy {
  protected onboardingService = inject(FunderOnboardingService);
  private destroy$ = new Subject<void>();

  // Icons
  FileTextIcon = FileText;
  MapPinIcon = MapPin;
  BuildingIcon = Building;
  CalendarIcon = Calendar;
  UsersIcon = Users;
  DollarSignIcon = DollarSign;
  SaveIcon = Save;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircleIcon;
  ChevronDownIcon = ChevronDown;
  ChevronRightIcon = ChevronRight;

  currentYear = new Date().getFullYear();
  showValidation = signal(false);

  // Section expansion state
  expandedSections = signal<SectionState>({
    legal: true,
    address: false,
    scale: false
  });

  // Form data - ONLY legal info fields
  formData = signal<LegalInfoFormData>({
    legalName: '',
    registrationNumber: '',
    fspLicenseNumber: '',
    ncrNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
   
  });

  ngOnInit() {
    this.loadExistingData();
    this.setupSubscriptions();
    this.setupSmartSectionExpansion();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadExistingData() {
    const existingData = this.onboardingService.getCurrentOrganization();
    if (existingData) {
      this.populateFormFromOrganization(existingData);
    }
  }

  private setupSubscriptions() {
    this.onboardingService.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state.organization) {
          this.populateFormFromOrganization(state.organization);
        }
      });
  }

  private setupSmartSectionExpansion() {
    // Auto-expand next section when current one is completed
    const current = this.expandedSections();
    
    if (this.isLegalSectionComplete() && current.legal && !current.address) {
      this.expandedSections.update(sections => ({
        ...sections,
        address: true
      }));
    }
    
    if (this.isAddressSectionComplete() && current.address && !current.scale) {
      this.expandedSections.update(sections => ({
        ...sections,
        scale: true
      }));
    }
  }

private populateFormFromOrganization(org: Partial<FunderOrganization>) {
  this.formData.update(data => ({
    ...data,
    legalName: org.legalName || '',
    registrationNumber: org.registrationNumber || '',
    fspLicenseNumber: org.fspLicenseNumber || '',
    ncrNumber: org.ncrNumber?.toString() || '',
    addressLine1: org.addressLine1 || '',
    addressLine2: org.addressLine2 || '',
    city: org.city || '',
    province: org.province || '',
    postalCode: org.postalCode || '',
    country: org.country || 'South Africa'
    // ✅ REMOVED: employeeCount and assetsUnderManagement (not in this form)
  }));
}

private mapFormDataToOrganization(): Partial<FunderOrganization> {
  const data = this.formData();
  return {
    legalName: data.legalName?.trim() || undefined,
    registrationNumber: data.registrationNumber?.trim() || undefined,
    fspLicenseNumber: data.fspLicenseNumber?.trim() || undefined,
    // ✅ FIXED: Keep as string to match database VARCHAR type
    ncrNumber: data.ncrNumber?.trim() || undefined,
 
    addressLine1: data.addressLine1?.trim() || undefined,
    addressLine2: data.addressLine2?.trim() || undefined,
    city: data.city?.trim() || undefined,
    province: data.province || undefined,
    postalCode: data.postalCode?.trim() || undefined,
    country: data.country || 'South Africa'
  };
}
  // ===============================
  // SECTION TOGGLE
  // ===============================

  toggleSection(section: keyof SectionState) {
    this.expandedSections.update(sections => ({
      ...sections,
      [section]: !sections[section]
    }));
  }

  // ===============================
  // FORM HANDLING
  // ===============================

  updateField(field: keyof LegalInfoFormData, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const value = target.value;
    
    this.formData.update(data => ({
      ...data,
      [field]: value
    }));

    // Auto-save to local storage after any change
    this.saveToLocalStorageOnly();
    
    // Auto-expand sections as they become complete
    this.setupSmartSectionExpansion();
  }

  private saveToLocalStorageOnly() {
    const organizationData: Partial<FunderOrganization> = this.mapFormDataToOrganization();
    this.onboardingService.updateOrganizationData(organizationData);
  }

 

  // ===============================
  // VALIDATION METHODS - EXACT MATCH WITH SERVICE
  // ===============================

  // These methods MUST match exactly what the service expects
  isLegalSectionComplete(): boolean {
    const data = this.formData();
    return !!(
      data.legalName?.trim() &&
      data.registrationNumber?.trim()
    );
  }

  isAddressSectionComplete(): boolean {
    const data = this.formData();
    return !!(
      data.addressLine1?.trim() &&
      data.city?.trim() &&
      data.province &&
      data.country
    );
  }

  // This matches the service's isLegalInfoValid() method
  isRequiredFieldsComplete(): boolean {
    return this.isLegalSectionComplete() && this.isAddressSectionComplete();
  }

 

  hasAnyData(): boolean {
    const data = this.formData();
    return Object.values(data).some(value => value && value.toString().trim() !== '');
  }

  // ===============================
  // SAVE ACTIONS
  // ===============================

  saveAsDraft() {
    this.saveToLocalStorageOnly();
    console.log('📝 Legal info draft saved locally');
  }

  saveAndValidate() {
    // Show validation errors if form is incomplete
    this.showValidation.set(true);
    
    if (!this.isRequiredFieldsComplete()) {
      console.warn('⚠️ Required fields missing');
      return;
    }
    
    this.saveToLocalStorageOnly();
    console.log('📝 Legal info validated and saved locally');
  }

  saveToDatabase() {
    if (!this.hasAnyData()) {
      console.warn('No data to save');
      return;
    }

    if (this.onboardingService.isSaving()) {
      console.warn('Save already in progress');
      return;
    }

    console.log('💾 Starting manual save to database...');

    // First ensure local data is up to date
    this.saveToLocalStorageOnly();

    // Then save to database
    this.onboardingService.saveToDatabase().subscribe({
      next: (result) => {
        console.log('✅ Legal info saved to database', result);
      },
      error: (error) => {
        console.error('❌ Failed to save legal info to database:', error);
      }
    });
  }
}
 