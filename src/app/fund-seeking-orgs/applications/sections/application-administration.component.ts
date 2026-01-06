// src/app/applications/sections/application-administration.component.ts
import { Component, signal, input, OnInit } from '@angular/core';
 
import { LucideAngularModule, User, Building, Phone, Mail, MapPin, Calendar } from 'lucide-angular';
import { UiCardComponent } from 'src/app/shared/components';

interface ContactDetails {
  fullName: string;
  role: string;
  emailAddress: string;
  phoneNumber: string;
}

interface BusinessDetails {
  nameOfBusiness: string;
  companyRegistration: string;
  telephoneNumber: string;
  yearsInOperation: number;
  physicalAddress: string;
}

interface LegalCompliance {
  cipcAnnualReturns: string;
  isVatRegistered: boolean;
  vatNumber?: string;
  incomeTaxNumber?: string;
  taxComplianceStatus: string;
  workmansCompensation?: string;
}

interface ApplicationData {
  id: string;
  contactDetails: ContactDetails;
  businessDetails: BusinessDetails;
  legalCompliance: LegalCompliance;
  lastUpdated?: Date;
}

@Component({
  selector: 'app-application-administration',
  standalone: true,
  imports: [UiCardComponent, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div>
        <h2 class="text-xl font-semibold text-neutral-900">Administration Information</h2>
        <p class="text-neutral-600 mt-1">
          Key administrative details about the business and primary contact person.
        </p>
        @if (applicationData()?.lastUpdated) {
          <p class="text-sm text-neutral-500 mt-2">
            Last updated: {{ applicationData()?.lastUpdated | date:'MMM d, yyyy h:mm a' }}
          </p>
        }
      </div>

      <!-- Contact Details Section -->
      <ui-card title="Contact Details" subtitle="Primary contact person for this application">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mt-1">
                <lucide-icon [img]="UserIcon" [size]="16" class="text-primary-600" />
              </div>
              <div class="flex-1">
                <dt class="text-sm font-medium text-neutral-500">Full Name</dt>
                <dd class="text-sm text-neutral-900 mt-1">
                  {{ applicationData()?.contactDetails?.fullName || 'Not specified' }}
                </dd>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mt-1">
                <lucide-icon [img]="BuildingIcon" [size]="16" class="text-primary-600" />
              </div>
              <div class="flex-1">
                <dt class="text-sm font-medium text-neutral-500">Role</dt>
                <dd class="text-sm text-neutral-900 mt-1">
                  {{ applicationData()?.contactDetails?.role || 'Not specified' }}
                </dd>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mt-1">
                <lucide-icon [img]="MailIcon" [size]="16" class="text-primary-600" />
              </div>
              <div class="flex-1">
                <dt class="text-sm font-medium text-neutral-500">Email Address</dt>
                <dd class="text-sm text-neutral-900 mt-1">
                  <a 
                    href="mailto:{{ applicationData()?.contactDetails?.emailAddress }}"
                    class="text-primary-600 hover:text-primary-700"
                  >
                    {{ applicationData()?.contactDetails?.emailAddress || 'Not specified' }}
                  </a>
                </dd>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mt-1">
                <lucide-icon [img]="PhoneIcon" [size]="16" class="text-primary-600" />
              </div>
              <div class="flex-1">
                <dt class="text-sm font-medium text-neutral-500">Phone Number</dt>
                <dd class="text-sm text-neutral-900 mt-1">
                  <a 
                    href="tel:{{ applicationData()?.contactDetails?.phoneNumber }}"
                    class="text-primary-600 hover:text-primary-700"
                  >
                    {{ applicationData()?.contactDetails?.phoneNumber || 'Not specified' }}
                  </a>
                </dd>
              </div>
            </div>
          </div>
        </div>
      </ui-card>

      <!-- Business Details Section -->
      <ui-card title="Business Details" subtitle="Core business information and registration details">
        <div class="space-y-6">
          <!-- Business Name and Registration -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-1">
                <lucide-icon [img]="BuildingIcon" [size]="16" class="text-green-600" />
              </div>
              <div class="flex-1">
                <dt class="text-sm font-medium text-neutral-500">Name of Business</dt>
                <dd class="text-base font-semibold text-neutral-900 mt-1">
                  {{ applicationData()?.businessDetails?.nameOfBusiness || 'Not specified' }}
                </dd>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-1">
                <lucide-icon [img]="BuildingIcon" [size]="16" class="text-green-600" />
              </div>
              <div class="flex-1">
                <dt class="text-sm font-medium text-neutral-500">Company Registration</dt>
                <dd class="text-sm font-mono text-neutral-900 mt-1">
                  {{ applicationData()?.businessDetails?.companyRegistration || 'Not specified' }}
                </dd>
              </div>
            </div>
          </div>

          <!-- Contact and Operations -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-1">
                <lucide-icon [img]="PhoneIcon" [size]="16" class="text-green-600" />
              </div>
              <div class="flex-1">
                <dt class="text-sm font-medium text-neutral-500">Business Phone</dt>
                <dd class="text-sm text-neutral-900 mt-1">
                  <a 
                    href="tel:{{ applicationData()?.businessDetails?.telephoneNumber }}"
                    class="text-primary-600 hover:text-primary-700"
                  >
                    {{ applicationData()?.businessDetails?.telephoneNumber || 'Not specified' }}
                  </a>
                </dd>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-1">
                <lucide-icon [img]="CalendarIcon" [size]="16" class="text-green-600" />
              </div>
              <div class="flex-1">
                <dt class="text-sm font-medium text-neutral-500">Years in Operation</dt>
                <dd class="text-sm text-neutral-900 mt-1">
                  {{ applicationData()?.businessDetails?.yearsInOperation || 'Not specified' }} years
                </dd>
              </div>
            </div>
          </div>

          <!-- Physical Address -->
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-1">
              <lucide-icon [img]="MapPinIcon" [size]="16" class="text-green-600" />
            </div>
            <div class="flex-1">
              <dt class="text-sm font-medium text-neutral-500">Physical Address</dt>
              <dd class="text-sm text-neutral-900 mt-1 leading-relaxed">
                {{ applicationData()?.businessDetails?.physicalAddress || 'Not specified' }}
              </dd>
            </div>
          </div>
        </div>
      </ui-card>

      <!-- Legal and Compliance Section -->
      <ui-card title="Legal and Compliance" subtitle="Tax registration and compliance status">
        <div class="space-y-6">
          <!-- CIPC and VAT Registration -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                <lucide-icon [img]="BuildingIcon" [size]="16" class="text-blue-600" />
              </div>
              <div class="flex-1">
                <dt class="text-sm font-medium text-neutral-500">CIPC Annual Returns</dt>
                <dd class="mt-1">
                  <span [class]="getComplianceStatusClass(applicationData()?.legalCompliance?.cipcAnnualReturns)">
                    {{ getComplianceStatusText(applicationData()?.legalCompliance?.cipcAnnualReturns) }}
                  </span>
                </dd>
              </div>
            </div>

            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                <lucide-icon [img]="BuildingIcon" [size]="16" class="text-blue-600" />
              </div>
              <div class="flex-1">
                <dt class="text-sm font-medium text-neutral-500">VAT Registration</dt>
                <dd class="mt-1">
                  @if (applicationData()?.legalCompliance?.isVatRegistered) {
                    <div class="space-y-1">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        VAT Registered
                      </span>
                      @if (applicationData()?.legalCompliance?.vatNumber) {
                        <div class="text-sm font-mono text-neutral-900">
                          {{ applicationData()?.legalCompliance?.vatNumber }}
                        </div>
                      }
                    </div>
                  } @else {
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                      Not VAT Registered
                    </span>
                  }
                </dd>
              </div>
            </div>
          </div>

          <!-- Tax Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @if (applicationData()?.legalCompliance?.incomeTaxNumber) {
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                  <lucide-icon [img]="BuildingIcon" [size]="16" class="text-blue-600" />
                </div>
                <div class="flex-1">
                  <dt class="text-sm font-medium text-neutral-500">Income Tax Number</dt>
                  <dd class="text-sm font-mono text-neutral-900 mt-1">
                    {{ applicationData()?.legalCompliance?.incomeTaxNumber }}
                  </dd>
                </div>
              </div>
            }

            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                <lucide-icon [img]="BuildingIcon" [size]="16" class="text-blue-600" />
              </div>
              <div class="flex-1">
                <dt class="text-sm font-medium text-neutral-500">Tax Compliance Status</dt>
                <dd class="mt-1">
                  <span [class]="getComplianceStatusClass(applicationData()?.legalCompliance?.taxComplianceStatus)">
                    {{ getComplianceStatusText(applicationData()?.legalCompliance?.taxComplianceStatus) }}
                  </span>
                </dd>
              </div>
            </div>
          </div>

          <!-- Additional Compliance -->
          @if (applicationData()?.legalCompliance?.workmansCompensation) {
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
                <lucide-icon [img]="BuildingIcon" [size]="16" class="text-blue-600" />
              </div>
              <div class="flex-1">
                <dt class="text-sm font-medium text-neutral-500">Workman's Compensation</dt>
                <dd class="text-sm text-neutral-900 mt-1">
                  {{ applicationData()?.legalCompliance?.workmansCompensation }}
                </dd>
              </div>
            </div>
          }
        </div>
      </ui-card>
    </div>
  `
})
export class ApplicationAdministrationComponent implements OnInit {
  applicationId = input.required<string>();
  
  // Signals
  applicationData = signal<ApplicationData | null>(null);
  isLoading = signal(true);

  // Icons
  UserIcon = User;
  BuildingIcon = Building;
  PhoneIcon = Phone;
  MailIcon = Mail;
  MapPinIcon = MapPin;
  CalendarIcon = Calendar;

  constructor() {}

  ngOnInit() {
    this.loadAdministrationData();
  }

  getComplianceStatusClass(status?: string): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status?.toLowerCase()) {
      case 'compliant':
      case 'yes':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'non-compliant':
      case 'no':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-neutral-100 text-neutral-800`;
    }
  }

  getComplianceStatusText(status?: string): string {
    if (!status) return 'Not specified';
    
    switch (status.toLowerCase()) {
      case 'compliant':
      case 'yes':
        return 'Compliant';
      case 'non-compliant':
      case 'no':
        return 'Non-Compliant';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  }

  private loadAdministrationData() {
    // Mock data - replace with actual service call
    setTimeout(() => {
      this.applicationData.set({
        id: this.applicationId(),
        contactDetails: {
          fullName: 'Bash Cele',
          role: 'FD',
          emailAddress: 'bashcele@gmail.com',
          phoneNumber: '27717496762'
        },
        businessDetails: {
          nameOfBusiness: 'Senkosi Inc',
          companyRegistration: '2013/900800/07',
          telephoneNumber: '27717496762',
          yearsInOperation: 10,
          physicalAddress: '290 Action Drive, Crystal Office Park, Charlestown, Gauteng, Centurion, 0157, South Africa'
        },
        legalCompliance: {
          cipcAnnualReturns: 'compliant',
          isVatRegistered: true,
          vatNumber: '4589098765',
          incomeTaxNumber: 'IT123456789',
          taxComplianceStatus: 'compliant',
          workmansCompensation: 'Active'
        },
        lastUpdated: new Date()
      });
      this.isLoading.set(false);
    }, 500);
  }
}