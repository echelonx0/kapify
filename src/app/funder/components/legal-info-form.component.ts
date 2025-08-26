 
// src/app/funder/components/legal-info-form.component.ts - REQUIRED FIELDS ONLY
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
import { UiButtonComponent} from '../../shared/components'; 
import { FunderOnboardingService } from '../services/funder-onboarding.service';
import { FunderOrganization } from '../../shared/models/user.models';

interface LegalInfoFormData {
  legalName: string;
  registrationNumber: string;
  taxNumber: string;
  foundedYear: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  employeeCount: string;
  assetsUnderManagement: string;
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
  template: `
    <div class="space-y-8">
      <!-- Legal Registration Section -->
      <div class="transform transition-all duration-300 hover:scale-[1.01]">
        <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <!-- Section Header -->
          <button
            (click)="toggleSection('legal')"
            class="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors duration-200"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <lucide-icon [img]="FileTextIcon" [size]="20" class="text-blue-600" />
              </div>
              <div class="text-left">
                <h3 class="font-semibold text-neutral-900">Legal Registration</h3>
                <p class="text-sm text-neutral-600">Official registration and compliance details</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              @if (isLegalSectionComplete()) {
                <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <lucide-icon [img]="CheckIcon" [size]="14" class="text-green-600" />
                </div>
              }
              <span class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">Required</span>
              <lucide-icon 
                [img]="expandedSections().legal ? ChevronDownIcon : ChevronRightIcon" 
                [size]="20" 
                class="text-neutral-400 transition-transform duration-200"
              />
            </div>
          </button>

          <!-- Expandable Content -->
          <div 
            class="transition-all duration-300 ease-in-out overflow-hidden"
            [style.max-height]="expandedSections().legal ? '1000px' : '0px'"
            [style.opacity]="expandedSections().legal ? '1' : '0'"
          >
            <div class="px-6 pb-6 border-t border-neutral-100">
              <div class="pt-4 space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Legal Name - REQUIRED -->
                  <div class="transform transition-all duration-200 hover:scale-[1.02]">
                    <label class="block text-sm font-medium text-neutral-700 mb-2">
                      Legal Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Official registered name"
                      [value]="formData().legalName"
                      (input)="updateField('legalName', $event)"
                      class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                      [class.border-red-300]="showValidation() && !formData().legalName.trim()"
                    />
                    @if (showValidation() && !formData().legalName.trim()) {
                      <p class="mt-1 text-sm text-red-600">Legal name is required</p>
                    }
                  </div>

                  <!-- Registration Number - REQUIRED -->
                  <div class="transform transition-all duration-200 hover:scale-[1.02]">
                    <label class="block text-sm font-medium text-neutral-700 mb-2">
                      Registration Number <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Company registration number"
                      [value]="formData().registrationNumber"
                      (input)="updateField('registrationNumber', $event)"
                      class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                      [class.border-red-300]="showValidation() && !formData().registrationNumber.trim()"
                    />
                    @if (showValidation() && !formData().registrationNumber.trim()) {
                      <p class="mt-1 text-sm text-red-600">Registration number is required</p>
                    }
                  </div>

                  <!-- Tax Number - OPTIONAL -->
                  <div class="transform transition-all duration-200 hover:scale-[1.02]">
                    <label class="block text-sm font-medium text-neutral-700 mb-2">
                      Tax Number
                    </label>
                    <input
                      type="text"
                      placeholder="VAT/Tax identification number (optional)"
                      [value]="formData().taxNumber"
                      (input)="updateField('taxNumber', $event)"
                      class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    />
                  </div>

                  <!-- Founded Year - OPTIONAL -->
                  <div class="transform transition-all duration-200 hover:scale-[1.02]">
                    <label class="block text-sm font-medium text-neutral-700 mb-2">
                      Founded Year
                    </label>
                    <input
                      type="number"
                      placeholder="2020 (optional)"
                      min="1900"
                      [max]="currentYear"
                      [value]="formData().foundedYear"
                      (input)="updateField('foundedYear', $event)"
                      class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Address Section -->
      <div class="transform transition-all duration-300 hover:scale-[1.01]">
        <div class="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <!-- Section Header -->
          <button
            (click)="toggleSection('address')"
            class="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors duration-200"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <lucide-icon [img]="MapPinIcon" [size]="20" class="text-green-600" />
              </div>
              <div class="text-left">
                <h3 class="font-semibold text-neutral-900">Registered Address</h3>
                <p class="text-sm text-neutral-600">Official business address for legal correspondence</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              @if (isAddressSectionComplete()) {
                <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <lucide-icon [img]="CheckIcon" [size]="14" class="text-green-600" />
                </div>
              }
              <span class="text-xs bg-red-100 text-red-600 px-2 py-1 rounded font-medium">Required</span>
              <lucide-icon 
                [img]="expandedSections().address ? ChevronDownIcon : ChevronRightIcon" 
                [size]="20" 
                class="text-neutral-400 transition-transform duration-200"
              />
            </div>
          </button>

          <!-- Expandable Content -->
          <div 
            class="transition-all duration-300 ease-in-out overflow-hidden"
            [style.max-height]="expandedSections().address ? '1000px' : '0px'"
            [style.opacity]="expandedSections().address ? '1' : '0'"
          >
            <div class="px-6 pb-6 border-t border-neutral-100">
              <div class="pt-4 space-y-6">
                <!-- Address Line 1 - REQUIRED -->
                <div class="transform transition-all duration-200 hover:scale-[1.02]">
                  <label class="block text-sm font-medium text-neutral-700 mb-2">
                    Address Line 1 <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="123 Main Street"
                    [value]="formData().addressLine1"
                    (input)="updateField('addressLine1', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    [class.border-red-300]="showValidation() && !formData().addressLine1.trim()"
                  />
                  @if (showValidation() && !formData().addressLine1.trim()) {
                    <p class="mt-1 text-sm text-red-600">Street address is required</p>
                  }
                </div>

                <!-- Address Line 2 - OPTIONAL -->
                <div class="transform transition-all duration-200 hover:scale-[1.02]">
                  <label class="block text-sm font-medium text-neutral-700 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    placeholder="Suite 456 (optional)"
                    [value]="formData().addressLine2"
                    (input)="updateField('addressLine2', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <!-- City - REQUIRED -->
                  <div class="transform transition-all duration-200 hover:scale-[1.02]">
                    <label class="block text-sm font-medium text-neutral-700 mb-2">
                      City <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Cape Town"
                      [value]="formData().city"
                      (input)="updateField('city', $event)"
                      class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                      [class.border-red-300]="showValidation() && !formData().city.trim()"
                    />
                    @if (showValidation() && !formData().city.trim()) {
                      <p class="mt-1 text-sm text-red-600">City is required</p>
                    }
                  </div>

                  <!-- Province - REQUIRED -->
                  <div class="transform transition-all duration-200 hover:scale-[1.02]">
                    <label class="block text-sm font-medium text-neutral-700 mb-2">
                      Province <span class="text-red-500">*</span>
                    </label>
                    <select
                      [value]="formData().province"
                      (change)="updateField('province', $event)"
                      class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                      [class.border-red-300]="showValidation() && !formData().province"
                    >
                      <option value="">Select province</option>
                      <option value="western_cape">Western Cape</option>
                      <option value="gauteng">Gauteng</option>
                      <option value="kwazulu_natal">KwaZulu-Natal</option>
                      <option value="eastern_cape">Eastern Cape</option>
                      <option value="free_state">Free State</option>
                      <option value="limpopo">Limpopo</option>
                      <option value="mpumalanga">Mpumalanga</option>
                      <option value="north_west">North West</option>
                      <option value="northern_cape">Northern Cape</option>
                    </select>
                    @if (showValidation() && !formData().province) {
                      <p class="mt-1 text-sm text-red-600">Province is required</p>
                    }
                  </div>

                  <!-- Postal Code - OPTIONAL -->
                  <div class="transform transition-all duration-200 hover:scale-[1.02]">
                    <label class="block text-sm font-medium text-neutral-700 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      placeholder="8001 (optional)"
                      [value]="formData().postalCode"
                      (input)="updateField('postalCode', $event)"
                      class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <!-- Country - REQUIRED -->
                <div class="transform transition-all duration-200 hover:scale-[1.02]">
                  <label class="block text-sm font-medium text-neutral-700 mb-2">
                    Country <span class="text-red-500">*</span>
                  </label>
                  <select
                    [value]="formData().country"
                    (change)="updateField('country', $event)"
                    class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    [class.border-red-300]="showValidation() && !formData().country"
                  >
                    <option value="South Africa">South Africa</option>
                    <option value="Botswana">Botswana</option>
                    <option value="Namibia">Namibia</option>
                    <option value="Zambia">Zambia</option>
                    <option value="Zimbabwe">Zimbabwe</option>
                  </select>
                  @if (showValidation() && !formData().country) {
                    <p class="mt-1 text-sm text-red-600">Country is required</p>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Organization Scale Section - OPTIONAL -->
      <div class="transform transition-all duration-300 hover:scale-[1.01]">
        <div class=" rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <!-- Section Header -->
          <button
            (click)="toggleSection('scale')"
            class="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors duration-200"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <lucide-icon [img]="UsersIcon" [size]="20" class="text-purple-600" />
              </div>
              <div class="text-left">
                <h3 class="font-semibold text-neutral-900">Organization Scale</h3>
                <p class="text-sm text-neutral-600">Size and financial scope information (optional)</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              @if (isScaleInfoComplete()) {
                <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                  <lucide-icon [img]="CheckIcon" [size]="14" class="text-green-600" />
                </div>
              }
              <span class="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded font-medium">Optional</span>
              <lucide-icon 
                [img]="expandedSections().scale ? ChevronDownIcon : ChevronRightIcon" 
                [size]="20" 
                class="text-neutral-400 transition-transform duration-200"
              />
            </div>
          </button>

          <!-- Expandable Content -->
          <div 
            class="transition-all duration-300 ease-in-out overflow-hidden"
            [style.max-height]="expandedSections().scale ? '1000px' : '0px'"
            [style.opacity]="expandedSections().scale ? '1' : '0'"
          >
            <div class="px-6 pb-6 border-t border-neutral-100">
              <div class="pt-4 space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Employee Count -->
                  <div class="transform transition-all duration-200 hover:scale-[1.02]">
                    <label class="block text-sm font-medium text-neutral-700 mb-2">
                      Employee Count
                    </label>
                    <select
                      [value]="formData().employeeCount"
                      (change)="updateField('employeeCount', $event)"
                      class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    >
                      <option value="">Select size</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>

                  <!-- Assets Under Management -->
                  <div class="transform transition-all duration-200 hover:scale-[1.02]">
                    <label class="block text-sm font-medium text-neutral-700 mb-2">
                      Assets Under Management (ZAR)
                    </label>
                    <input
                      type="number"
                      placeholder="100000000"
                      [value]="formData().assetsUnderManagement"
                      (input)="updateField('assetsUnderManagement', $event)"
                      class="block w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    />
                    <p class="mt-1 text-sm text-neutral-500">Enter the amount in South African Rand</p>
                  </div>
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
            <h3 class="font-medium text-blue-900">Step 2 Progress</h3>
            <p class="text-sm text-blue-700 mt-1">
              @if (isRequiredFieldsComplete()) {
                <span class="inline-flex items-center">
                  <span class="mr-2">✅</span>
                  Ready to proceed to verification
                </span>
              } @else {
                Complete required fields to continue:
                @if (!isLegalSectionComplete()) {
                  <span class="block mt-1">• Legal name and registration number needed</span>
                }
                @if (!isAddressSectionComplete()) {
                  <span class="block mt-1">• Address, city, province, and country needed</span>
                }
              }
            </p>
          </div>
          
          @if (isRequiredFieldsComplete()) {
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
    taxNumber: '',
    foundedYear: '',
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
      taxNumber: org.taxNumber || '',
      foundedYear: org.foundedYear?.toString() || '',
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

  private mapFormDataToOrganization(): Partial<FunderOrganization> {
    const data = this.formData();
    return {
      legalName: data.legalName?.trim() || undefined,
      registrationNumber: data.registrationNumber?.trim() || undefined,
      taxNumber: data.taxNumber?.trim() || undefined,
      foundedYear: data.foundedYear ? Number(data.foundedYear) : undefined,
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

  isScaleInfoComplete(): boolean {
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
 