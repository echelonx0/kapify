// src/app/funder/components/organization-info-form.component.ts - FIXED VERSION
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { 
  LucideAngularModule, 
  Building2, 
  FileText, 
  Mail,
  Phone,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  Save,
  Check,
  AlertCircleIcon
} from 'lucide-angular';
import { UiButtonComponent} from '../../shared/components';
import { UiSectionCardComponent } from '../../shared/components/ui-section-card.component';
import { FunderOnboardingService, FunderOrganization } from '../services/funder-onboarding.service';

interface OrganizationFormData {
  name: string;
  description: string;
  organizationType: 'investment_fund' | 'bank' | 'government' | 'ngo' | 'private_equity' | 'venture_capital' | '';
  legalName: string;
  registrationNumber: string;
  taxNumber: string;
  foundedYear: string;
  website: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  employeeCount: string;
  assetsUnderManagement: string;
}

@Component({
  selector: 'app-organization-info-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiButtonComponent,
 
    UiSectionCardComponent,
    LucideAngularModule
  ],
  templateUrl: 'organisation-information-form.component.html'
})
export class OrganizationInfoFormComponent implements OnInit, OnDestroy {
  protected onboardingService = inject(FunderOnboardingService);
  private destroy$ = new Subject<void>();
  private autoSaveSubject = new Subject<void>();

  // Icons
  Building2Icon = Building2;
  FileTextIcon = FileText;
  MailIcon = Mail;
  PhoneIcon = Phone;
  MapPinIcon = MapPin;
  UsersIcon = Users;
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  SaveIcon = Save;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircleIcon;

  currentYear = new Date().getFullYear();
  
  // **FIXED**: Removed isManualSave as it's handled in service
  
  // Section expansion state
  expandedSections = signal({
    basic: true,
    contact: false,
    address: false,
    legal: false,
    details: false
  });

  // Form data
  formData = signal<OrganizationFormData>({
    name: '',
    description: '',
    organizationType: '',
    legalName: '',
    registrationNumber: '',
    taxNumber: '',
    foundedYear: '',
    website: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
    employeeCount: '',
    assetsUnderManagement: ''
  });

  ngOnInit() {
    this.loadExistingData();
    this.setupSubscriptions();
    this.setupAutoSave();
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

  // **FIXED**: Simplified auto-save
  private setupAutoSave() {
    this.autoSaveSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(1000) // Wait 1 second after user stops typing
      )
      .subscribe(() => {
        this.saveToLocalStorageOnly();
      });
  }

  private populateFormFromOrganization(org: Partial<FunderOrganization>) {
    this.formData.update(data => ({
      ...data,
      name: org.name || '',
      description: org.description || '',
      organizationType: (org.organizationType as any) || '',
      legalName: org.legalName || '',
      registrationNumber: org.registrationNumber || '',
      taxNumber: org.taxNumber || '',
      foundedYear: org.foundedYear?.toString() || '',
      website: org.website || '',
      email: org.email || '',
      phone: org.phone || '',
      addressLine1: org.addressLine1 || '',
      addressLine2: org.addressLine2 || '',
      city: org.city || '',
      province: org.province || '',
      postalCode: org.postalCode || '',
      country: org.country || 'South Africa',
      employeeCount: org.employeeCount?.toString() || '',
      assetsUnderManagement: org.assetsUnderManagement?.toString() || ''
    }));
  }

  // ===============================
  // FORM HANDLING - FIXED
  // ===============================

  updateField(field: keyof OrganizationFormData, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const value = target.value;
    
    this.formData.update(data => ({
      ...data,
      [field]: value
    }));

    // **FIXED**: Only trigger debounced local save
    this.autoSaveSubject.next();
  }

  // **FIXED**: Clear method that only saves locally
  private saveToLocalStorageOnly() {
    const organizationData: Partial<FunderOrganization> = this.mapFormDataToOrganization();
    this.onboardingService.updateOrganizationData(organizationData);
    console.log('📝 Auto-saved to local storage');
  }

  private mapFormDataToOrganization(): Partial<FunderOrganization> {
    const data = this.formData();
    return {
      name: data.name?.trim() || undefined,
      description: data.description?.trim() || undefined,
      organizationType: data.organizationType as any || undefined,
      legalName: data.legalName?.trim() || undefined,
      registrationNumber: data.registrationNumber?.trim() || undefined,
      taxNumber: data.taxNumber?.trim() || undefined,
      foundedYear: data.foundedYear ? Number(data.foundedYear) : undefined,
      website: data.website?.trim() || undefined,
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      addressLine1: data.addressLine1?.trim() || undefined,
      addressLine2: data.addressLine2?.trim() || undefined,
      city: data.city?.trim() || undefined,
      province: data.province || undefined,
      postalCode: data.postalCode?.trim() || undefined,
      country: data.country || 'South Africa',
      employeeCount: data.employeeCount ? Number(data.employeeCount.split('-')[0]) : undefined,
      assetsUnderManagement: data.assetsUnderManagement ? Number(data.assetsUnderManagement) : undefined
    };
  }

  // ===============================
  // SECTION MANAGEMENT
  // ===============================

  toggleSection(section: 'basic' | 'contact' | 'address' | 'legal' | 'details', expanded: boolean) {
    this.expandedSections.update(sections => ({
      ...sections,
      [section]: expanded
    }));
  }

  // ===============================
  // VALIDATION METHODS
  // ===============================

  isBasicInfoComplete(): boolean {
    const data = this.formData();
    return !!(
      data.name?.trim() &&
      data.description?.trim() &&
      data.organizationType
    );
  }

  isContactInfoComplete(): boolean {
    const data = this.formData();
    return !!(
      data.email?.trim() &&
      data.phone?.trim()
    );
  }

  isAddressComplete(): boolean {
    const data = this.formData();
    return !!(
      data.addressLine1?.trim() &&
      data.city?.trim() &&
      data.province &&
      data.country
    );
  }

  isLegalInfoComplete(): boolean {
    const data = this.formData();
    return !!(
      data.legalName?.trim() &&
      data.registrationNumber?.trim()
    );
  }

  isOrgDetailsComplete(): boolean {
    const data = this.formData();
    return !!(
      data.employeeCount ||
      data.assetsUnderManagement
    );
  }

  hasAnyData(): boolean {
    const data = this.formData();
    return Object.values(data).some(value => value && value.toString().trim() !== '');
  }

  // ===============================
  // SAVE ACTIONS - SIMPLIFIED
  // ===============================

  saveAsDraft() {
    this.saveToLocalStorageOnly();
    console.log('📝 Draft saved locally');
  }

  saveAndValidate() {
    this.saveToLocalStorageOnly();
    // **FIXED**: Removed automatic database save
    console.log('📝 Data validated and saved locally');
  }

  // **FIXED**: Clean database save method
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
        console.log('✅ Organization saved to database', result);
      },
      error: (error) => {
        console.error('❌ Failed to save to database:', error);
        // Error is already handled in service
      }
    });
  }

  

  // **FIXED**: Check if currently saving
  isSaving(): boolean {
    return this.onboardingService.isSaving();
  }
}