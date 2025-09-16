// src/app/funder/components/basic-info-form.component.ts - ANIMATED VERSION
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil} from 'rxjs';
import { 
  LucideAngularModule, 
  Building2, 
  Mail,
  Phone,
  Globe,
  Save,
  Check,
  AlertCircleIcon,
  ChevronDown,
  ChevronRight,
  FileText
} from 'lucide-angular';
import { UiButtonComponent} from '../../../shared/components'; 
import { FunderOnboardingService } from '../../services/funder-onboarding.service';
import { FunderOrganization } from '../../../shared/models/user.models';

interface BasicInfoFormData {
  name: string;
  description: string;
  organizationType: 'investment_fund' | 'bank' | 'government' | 'ngo' | 'private_equity' | 'venture_capital' | '';
  email: string;
  phone: string;
  website: string;
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
    LucideAngularModule
  ],
  templateUrl: 'basic-info-form.component.html'
})
export class BasicInfoFormComponent implements OnInit, OnDestroy {
  protected onboardingService = inject(FunderOnboardingService);
  private destroy$ = new Subject<void>();
   

  // Icons
  Building2Icon = Building2;
  MailIcon = Mail;
  PhoneIcon = Phone;
  GlobeIcon = Globe;
  SaveIcon = Save;
  CheckIcon = Check;
  AlertCircleIcon = AlertCircleIcon;
  ChevronDownIcon = ChevronDown;
  ChevronRightIcon = ChevronRight;
  FileTextIcon = FileText;

  // Section expansion state
  expandedSections = signal<SectionState>({
    basic: true,
    contact: false
  });

  // Form data - ONLY basic info fields
  formData = signal<BasicInfoFormData>({
    name: '',
    description: '',
    organizationType: '',
    email: '',
    phone: '',
    website: ''
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
      .subscribe(state => {
        if (state.organization) {
          this.populateFormFromOrganization(state.organization);
        }
      });
  }

 
 

  private populateFormFromOrganization(org: Partial<FunderOrganization>) {
    this.formData.update(data => ({
      ...data,
      name: org.name || '',
      description: org.description || '',
      organizationType: (org.organizationType as any) || '',
      email: org.email || '',
      phone: org.phone || '',
      website: org.website || ''
    }));
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

  updateField(field: keyof BasicInfoFormData, event: Event) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const value = target.value;
    
    this.formData.update(data => ({
      ...data,
      [field]: value
    }));

   
  }

  private saveToLocalStorageOnly() {
    const organizationData: Partial<FunderOrganization> = this.mapFormDataToOrganization();
    this.onboardingService.updateOrganizationData(organizationData);
    console.log('📝 Auto-saved basic info to local storage');
  }

  private mapFormDataToOrganization(): Partial<FunderOrganization> {
    const data = this.formData();
    return {
      name: data.name?.trim() || undefined,
      description: data.description?.trim() || undefined,
      organizationType: data.organizationType as any || undefined,
      email: data.email?.trim() || undefined,
      phone: data.phone?.trim() || undefined,
      website: data.website?.trim() || undefined
    };
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

  isFormValid(): boolean {
    return this.isBasicInfoComplete() && this.isContactInfoComplete();
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
      }
    });
  }
}