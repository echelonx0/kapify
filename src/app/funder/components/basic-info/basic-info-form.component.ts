import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  LucideAngularModule,
  Mail,
  Phone,
  Globe,
  Save,
  Check,
  CircleAlert,
  ChevronDown,
  ChevronRight,
} from 'lucide-angular';
import { UiButtonComponent } from '../../../shared/components';
import { LogoUploadComponent } from './logo-upload.component';
import { FunderOnboardingService } from '../../services/funder-onboarding.service';
import { FunderOrganization } from '../../../shared/models/user.models';

/**
 * ✅ organizationType removed from form interface
 * It's immutable at registration and should never be displayed or editable
 */
interface BasicInfoFormData {
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  logoUrl?: string;
}

interface SectionState {
  basic: boolean;
  contact: boolean;
}

@Component({
  selector: 'app-basic-info-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiButtonComponent,
    LogoUploadComponent,
    LucideAngularModule,
  ],
  templateUrl: 'basic-info-form.component.html',
})
export class BasicInfoFormComponent implements OnInit, OnDestroy {
  protected onboardingService = inject(FunderOnboardingService);
  private destroy$ = new Subject<void>();

  // Icons
  MailIcon = Mail;
  PhoneIcon = Phone;
  GlobeIcon = Globe;
  SaveIcon = Save;
  CheckIcon = Check;
  AlertCircleIcon = CircleAlert;
  ChevronDownIcon = ChevronDown;
  ChevronRightIcon = ChevronRight;

  // Section expansion state
  expandedSections = signal<SectionState>({
    basic: true,
    contact: false,
  });

  // Form data - organizationType removed
  formData = signal<BasicInfoFormData>({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    logoUrl: undefined,
  });

  ngOnInit() {
    this.loadExistingData();
    this.setupSubscriptions();
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
      .subscribe((state) => {
        if (state.organization) {
          this.populateFormFromOrganization(state.organization);
        }
      });
  }

  private populateFormFromOrganization(org: Partial<FunderOrganization>) {
    this.formData.update((data) => ({
      ...data,
      name: org.name || '',
      description: org.description || '',
      email: org.email || '',
      phone: org.phone || '',
      website: org.website || '',
      logoUrl: org.logoUrl || undefined,
    }));
  }

  // ===============================
  // SECTION TOGGLE
  // ===============================

  toggleSection(section: keyof SectionState) {
    this.expandedSections.update((sections) => ({
      ...sections,
      [section]: !sections[section],
    }));
  }

  // ===============================
  // FORM HANDLING
  // ===============================

  updateField(field: keyof BasicInfoFormData, event: Event) {
    const target = event.target as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    const value = target.value;

    this.formData.update((data) => ({
      ...data,
      [field]: value,
    }));
  }

  // ===============================
  // LOGO UPLOAD HANDLERS
  // ===============================

  onLogoUploaded(result: { url: string; fileName: string }) {
    this.formData.update((data) => ({
      ...data,
      logoUrl: result.url,
    }));
    this.saveToLocalStorageOnly();
    console.log('✅ Logo uploaded and saved:', result.fileName);
  }

  onLogoRemoved() {
    this.formData.update((data) => ({
      ...data,
      logoUrl: undefined,
    }));
    this.saveToLocalStorageOnly();
    console.log('🗑️ Logo removed');
  }

  private saveToLocalStorageOnly() {
    const organizationData: Partial<FunderOrganization> =
      this.mapFormDataToOrganization();
    this.onboardingService.updateOrganizationData(organizationData);
    console.log('📝 Auto-saved basic info to local storage');
  }

  /**
   * ✅ organizationType is excluded from all mappings
   */
  private mapFormDataToOrganization(): Partial<FunderOrganization> {
    const data = this.formData();
    return {
      name: data.name?.trim() || undefined,
      description: data.description?.trim() || undefined,
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      website: data.website?.trim() || undefined,
      logoUrl: data.logoUrl || undefined,
    };
  }

  // ===============================
  // VALIDATION METHODS
  // ===============================

  /**
   * ✅ organizationType check removed - it's immutable
   */
  isBasicInfoComplete(): boolean {
    const data = this.formData();
    return !!(data.name?.trim() && data.description?.trim());
  }

  isContactInfoComplete(): boolean {
    const data = this.formData();
    return !!(data.email?.trim() && data.phone?.trim());
  }

  isFormValid(): boolean {
    return this.isBasicInfoComplete() && this.isContactInfoComplete();
  }

  hasAnyData(): boolean {
    const data = this.formData();
    return Object.values(data).some(
      (value) => value && value.toString().trim() !== '',
    );
  }

  // ===============================
  // SAVE ACTIONS
  // ===============================

  saveAsDraft() {
    this.saveToLocalStorageOnly();
    console.log('📝 Basic info draft saved locally');
  }

  saveAndValidate() {
    this.saveToLocalStorageOnly();
    console.log('📝 Basic info validated and saved locally');
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
        console.log('✅ Basic info saved to database', result);
      },
      error: (error) => {
        console.error('❌ Failed to save basic info to database:', error);
      },
    });
  }
}
