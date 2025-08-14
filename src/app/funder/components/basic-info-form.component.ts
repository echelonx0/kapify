// src/app/funder/components/basic-info-form.component.ts - ANIMATED VERSION
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime } from 'rxjs';
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
import { UiButtonComponent} from '../../shared/components'; 
import { FunderOnboardingService, FunderOrganization } from '../services/funder-onboarding.service';

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
  template: `
    <div class="space-y-8">
    

      <!-- Basic Organization Section -->
      <div class="transform transition-all duration-300 hover:scale-[1.01]">
        <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <!-- Section Header -->
          <button
            (click)="toggleSection('basic')"
            class="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors duration-200"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <lucide-icon [img]="Building2Icon" [size]="20" class="text-blue-600" />
              </div>
              <div class="text-left">
                <h3 class="font-semibold text-neutral-900">Organization Details</h3>
                <p class="text-sm text-neutral-600">Core information about your funding organization</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              @if (isBasicInfoComplete()) {
                <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <lucide-icon [img]="CheckIcon" [size]="14" class="text-green-600" />
                </div>
              }
              <span class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">Required</span>
              <lucide-icon 
                [img]="expandedSections().basic ? ChevronDownIcon : ChevronRightIcon" 
                [size]="20" 
                class="text-neutral-400 transition-transform duration-200"
              />
            </div>
          </button>

          <!-- Expandable Content -->
          <div 
            class="transition-all duration-300 ease-in-out overflow-hidden"
            [style.max-height]="expandedSections().basic ? '1000px' : '0px'"
            [style.opacity]="expandedSections().basic ? '1' : '0'"
          >
            <div class="px-6 pb-6 border-t border-neutral-100">
              <div class="pt-4 space-y-6">
                <!-- Organization Name -->
                <div class="transform transition-all duration-200 hover:scale-[1.02]">
                  <label class="block text-sm font-medium text-neutral-700 mb-2">
                    Organization Name <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., South African Growth Fund"
                    [value]="formData().name"
                    (input)="updateField('name', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>

                <!-- Organization Type -->
                <div class="transform transition-all duration-200 hover:scale-[1.02]">
                  <label class="block text-sm font-medium text-neutral-700 mb-2">
                    Organization Type <span class="text-red-500">*</span>
                  </label>
                  <select
                    [value]="formData().organizationType"
                    (change)="updateField('organizationType', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  >
                    <option value="">Select organization type</option>
                    <option value="investment_fund">Investment Fund</option>
                    <option value="venture_capital">Venture Capital</option>
                    <option value="private_equity">Private Equity</option>
                    <option value="bank">Bank</option>
                    <option value="government">Government Agency</option>
                    <option value="ngo">NGO/Non-Profit</option>
                  </select>
                </div>

                <!-- Description -->
                <div class="transform transition-all duration-200 hover:scale-[1.02]">
                  <label class="block text-sm font-medium text-neutral-700 mb-2">
                    Description <span class="text-red-500">*</span>
                  </label>
                  <textarea
                    rows="4"
                    placeholder="Describe your organization's mission, focus areas, and investment approach..."
                    [value]="formData().description"
                    (input)="updateField('description', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Information Section -->
      <div class="transform transition-all duration-300 hover:scale-[1.01]">
        <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <!-- Section Header -->
          <button
            (click)="toggleSection('contact')"
            class="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors duration-200"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <lucide-icon [img]="MailIcon" [size]="20" class="text-green-600" />
              </div>
              <div class="text-left">
                <h3 class="font-semibold text-neutral-900">Contact Information</h3>
                <p class="text-sm text-neutral-600">How SMEs and partners can reach your organization</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              @if (isContactInfoComplete()) {
                <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <lucide-icon [img]="CheckIcon" [size]="14" class="text-green-600" />
                </div>
              }
              <span class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">Required</span>
              <lucide-icon 
                [img]="expandedSections().contact ? ChevronDownIcon : ChevronRightIcon" 
                [size]="20" 
                class="text-neutral-400 transition-transform duration-200"
              />
            </div>
          </button>

          <!-- Expandable Content -->
          <div 
            class="transition-all duration-300 ease-in-out overflow-hidden"
            [style.max-height]="expandedSections().contact ? '1000px' : '0px'"
            [style.opacity]="expandedSections().contact ? '1' : '0'"
          >
            <div class="px-6 pb-6 border-t border-neutral-100">
              <div class="pt-4 space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Email -->
                  <div class="transform transition-all duration-200 hover:scale-[1.02]">
                    <label class="block text-sm font-medium text-neutral-700 mb-2">
                      Email Address <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="contact@yourfund.co.za"
                      [value]="formData().email"
                      (input)="updateField('email', $event)"
                      class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    />
                  </div>

                  <!-- Phone -->
                  <div class="transform transition-all duration-200 hover:scale-[1.02]">
                    <label class="block text-sm font-medium text-neutral-700 mb-2">
                      Phone Number <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="+27 11 123 4567"
                      [value]="formData().phone"
                      (input)="updateField('phone', $event)"
                      class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <!-- Website -->
                <div class="transform transition-all duration-200 hover:scale-[1.02]">
                  <label class="block text-sm font-medium text-neutral-700 mb-2">
                    Website (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://yourfund.co.za"
                    [value]="formData().website"
                    (input)="updateField('website', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Auto-save Status -->
      <div class="flex items-center justify-between p-4 bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl border border-neutral-200 shadow-sm">
        <div class="flex items-center text-sm text-neutral-600">
          @if (onboardingService.isSaving()) {
            <div class="flex items-center">
              <div class="w-2 h-2 bg-primary-500 rounded-full animate-pulse mr-2"></div>
              Saving changes...
            </div>
          } @else if (onboardingService.lastSavedLocally()) {
            <div class="flex items-center text-green-600">
              <lucide-icon [img]="CheckIcon" [size]="16" class="mr-2" />
              Changes saved locally
            </div>
          } @else {
            <span>Start filling out the form to auto-save your progress</span>
          }
        </div>
        
        <ui-button
          variant="outline"
          size="sm"
          (clicked)="saveToDatabase()"
          [disabled]="onboardingService.isSaving() || !hasAnyData()"
          class="transform transition-all duration-200 hover:scale-105"
        >
          @if (onboardingService.isSaving()) {
            <lucide-icon [img]="SaveIcon" [size]="16" class="mr-2 animate-spin" />
            Saving...
          } @else {
            <lucide-icon [img]="SaveIcon" [size]="16" class="mr-2" />
            Save Progress
          }
        </ui-button>
      </div>

      <!-- Error Display -->
      @if (onboardingService.error()) {
        <div class="p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm animate-in slide-in-from-top duration-300">
          <div class="flex items-center">
            <lucide-icon [img]="AlertCircleIcon" [size]="20" class="text-red-600 mr-3" />
            <p class="text-red-800">{{ onboardingService.error() }}</p>
          </div>
        </div>
      }

      <!-- Step Completion Status -->
      <div class="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-blue-900">Step 1 Progress</h3>
            <p class="text-sm text-blue-700 mt-1">
              @if (isFormValid()) {
                <span class="inline-flex items-center">
                  <span class="mr-2">✅</span>
                  Ready to proceed to legal information
                </span>
              } @else {
                Complete all required fields to continue
              }
            </p>
          </div>
          
          @if (isFormValid()) {
            <div class="flex items-center text-blue-600 animate-in fade-in duration-300">
              <lucide-icon [img]="CheckIcon" [size]="20" class="mr-2" />
              <span class="font-medium">Complete</span>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class BasicInfoFormComponent implements OnInit, OnDestroy {
  protected onboardingService = inject(FunderOnboardingService);
  private destroy$ = new Subject<void>();
  private autoSaveSubject = new Subject<void>();

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
    this.setupAutoSave();
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

  private setupAutoSave() {
    this.autoSaveSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(1000)
      )
      .subscribe(() => {
        this.saveToLocalStorageOnly();
      });
  }

  private setupSmartSectionExpansion() {
    // Auto-expand contact section when basic info is completed
    this.autoSaveSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500)
      )
      .subscribe(() => {
        const current = this.expandedSections();
        
        if (this.isBasicInfoComplete() && current.basic && !current.contact) {
          this.expandedSections.update(sections => ({
            ...sections,
            contact: true
          }));
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

    this.autoSaveSubject.next();
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