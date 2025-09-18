// src/app/dashboard/components/settings/settings.component.ts
import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { 
  LucideAngularModule, 
  Building2, 
  FileText,
  Settings,
  Globe,
  CreditCard,
  Shield
} from 'lucide-angular';
 
import { GeneralInfoComponent } from './components/general-info/general-info.component'; 
import { LegalInfoComponent } from './components/legal/legal-info.component';
import { OrganizationSettingsService } from '../services/organization-settings.service';
import { ContactDetailsComponent } from './components/contact-details/contact-details.component';

type SettingsSection = 'general' | 'contact' | 'legal' | 'integrations' | 'billing';

interface SettingsTab {
  id: SettingsSection;
  label: string;
  icon: any;
  enabled: boolean;
  description: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    GeneralInfoComponent,
    ContactDetailsComponent,
    LegalInfoComponent
  ],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <!-- Header -->
      <div class="bg-white border-b border-neutral-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="py-6">
            <div class="flex items-center">
              <lucide-icon [img]="SettingsIcon" [size]="24" class="text-neutral-900 mr-3" />
              <div>
                <h1 class="text-2xl font-bold text-neutral-900">Organization Settings</h1>
                <p class="text-sm text-neutral-600 mt-1">
                  Manage your organization details and preferences
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex gap-8">
          <!-- Sidebar Navigation -->
          <div class="w-64 flex-shrink-0">
            <nav class="space-y-2">
              @for (tab of settingsTabs; track tab.id) {
                <button
                  (click)="setActiveSection(tab.id)"
                  [class]="getSectionClasses(tab.id)"
                  [disabled]="!tab.enabled"
                  class="w-full"
                >
                  <div class="flex items-center px-3 py-2">
                    <lucide-icon [img]="tab.icon" [size]="18" class="mr-3 flex-shrink-0" />
                    <div class="flex-1 text-left">
                      <div class="text-sm font-medium">{{ tab.label }}</div>
                      @if (!tab.enabled) {
                        <div class="text-xs text-neutral-500">Coming Soon</div>
                      }
                    </div>
                  </div>
                </button>
              }
            </nav>

            <!-- Organization Quick Info -->
            @if (organization() && !isLoading()) {
              <div class="mt-8 p-4 bg-white rounded-lg border border-neutral-200 shadow-sm">
                <div class="flex items-center mb-3">
                  @if (organization()?.logoUrl) {
                    <img 
                      [src]="organization()?.logoUrl" 
                      [alt]="organization()?.name + ' logo'"
                      class="w-10 h-10 rounded-lg object-cover mr-3"
                    />
                  } @else {
                    <div class="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center mr-3">
                      <lucide-icon [img]="Building2Icon" [size]="20" class="text-neutral-600" />
                    </div>
                  }
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-neutral-900 truncate">
                      {{ organization()?.name }}
                    </p>
                    <p class="text-xs text-neutral-500">
                      {{ getOrganizationTypeLabel(organization()?.organizationType) }}
                    </p>
                  </div>
                </div>
                
                <div class="flex items-center justify-between text-xs">
                  <span class="text-neutral-500">Status</span>
                  <span [class]="getStatusClasses(organization()?.status)">
                    {{ getStatusLabel(organization()?.status) }}
                  </span>
                </div>
                
                @if (organization()?.isVerified) {
                  <div class="flex items-center mt-2 text-xs text-green-600">
                    <lucide-icon [img]="ShieldIcon" [size]="12" class="mr-1" />
                    Verified Organization
                  </div>
                }
              </div>
            }
          </div>

          <!-- Main Content -->
          <div class="flex-1">
            @if (isLoading()) {
              <div class="bg-white rounded-lg border border-neutral-200 shadow-sm p-8">
                <div class="flex items-center justify-center">
                  <div class="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mr-3"></div>
                  <span class="text-neutral-600">Loading organization details...</span>
                </div>
              </div>
            } @else if (error()) {
              <div class="bg-white rounded-lg border border-red-200 shadow-sm p-8">
                <div class="text-center">
                  <h3 class="text-lg font-medium text-red-900 mb-2">Error Loading Settings</h3>
                  <p class="text-red-700 mb-4">{{ error() }}</p>
                  <button 
                    (click)="retryLoad()"
                    class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            } @else {
              <!-- Active Section Component -->
              @switch (activeSection()) {
                @case ('general') {
                  <app-general-info 
                    [organization]="organization()"
                    [isLoading]="isSaving()"
                    (organizationUpdated)="onOrganizationUpdated($event)"
                  />
                }
                @case ('contact') {
                  <app-contact-details 
                    [organization]="organization()"
                    [isLoading]="isSaving()"
                    (organizationUpdated)="onOrganizationUpdated($event)"
                  />
                }
                @case ('legal') {
                  <app-legal-info 
                    [organization]="organization()"
                    [isLoading]="isSaving()"
                    (organizationUpdated)="onOrganizationUpdated($event)"
                  />
                }
                @default {
                  <div class="bg-white rounded-lg border border-neutral-200 shadow-sm p-8 text-center">
                    <h3 class="text-lg font-medium text-neutral-900 mb-2">Coming Soon</h3>
                    <p class="text-neutral-600">This section is under development.</p>
                  </div>
                }
              }
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-navigation {
      display: flex;
      justify-content: center;
    }

    .section-card {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .section-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .section-description {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .stat-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.12);
    }

    .stat-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .action-button {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 1rem;
      text-align: left;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      transition: all 0.2s;
      cursor: pointer;
    }

    .action-button:hover {
      border-color: #d1d5db;
      box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.05);
    }

    .empty-state {
      padding: 3rem;
      text-align: center;
    }

    .empty-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f3f4f6;
      border-radius: 50%;
    }

    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .empty-description {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
  `]
})
export class SettingsComponent implements OnInit, OnDestroy {
  private settingsService = inject(OrganizationSettingsService);
  private destroy$ = new Subject<void>();

  // Icons
  SettingsIcon = Settings;
  Building2Icon = Building2;
  FileTextIcon = FileText;
  GlobeIcon = Globe;
  CreditCardIcon = CreditCard;
  ShieldIcon = Shield;

  // State
  activeSection = signal<SettingsSection>('general');

  // Service state
  isLoading = this.settingsService.isLoading;
  isSaving = this.settingsService.isSaving;
  error = this.settingsService.error;
  organization = this.settingsService.organization;

  // Settings tabs configuration
  settingsTabs: SettingsTab[] = [
    {
      id: 'general',
      label: 'General',
      icon: this.Building2Icon,
      enabled: true,
      description: 'Organization name, type, and description'
    },
    {
      id: 'contact',
      label: 'Contact',
      icon: this.GlobeIcon,
      enabled: true,
      description: 'Email, phone, website, and address'
    },
    {
      id: 'legal',
      label: 'Legal',
      icon: this.FileTextIcon,
      enabled: true,
      description: 'Registration, compliance, and verification'
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: this.SettingsIcon,
      enabled: false,
      description: 'Third-party integrations and APIs'
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: this.CreditCardIcon,
      enabled: false,
      description: 'Subscription and payment details'
    }
  ];

  ngOnInit() {
    // Organization data will be auto-loaded by the service
    this.settingsService.organization$
      .pipe(takeUntil(this.destroy$))
      .subscribe(org => {
        if (org) {
          console.log('Organization loaded in settings:', org.name);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveSection(section: SettingsSection) {
    const tab = this.settingsTabs.find(t => t.id === section);
    if (tab?.enabled) {
      this.activeSection.set(section);
    }
  }

  getSectionClasses(sectionId: SettingsSection): string {
    const baseClasses = 'text-left rounded-md transition-all duration-200';
    const isActive = this.activeSection() === sectionId;
    const tab = this.settingsTabs.find(t => t.id === sectionId);
    
    if (!tab?.enabled) {
      return `${baseClasses} text-neutral-400 cursor-not-allowed opacity-60`;
    }
    
    if (isActive) {
      return `${baseClasses} bg-primary-50 text-primary-700 border border-primary-200`;
    }
    
    return `${baseClasses} text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50`;
  }

  getOrganizationTypeLabel(type: string | undefined): string {
    const labels: Record<string, string> = {
      'investment_fund': 'Investment Fund',
      'venture_capital': 'Venture Capital',
      'private_equity': 'Private Equity',
      'bank': 'Bank',
      'government': 'Government Agency',
      'ngo': 'NGO/Non-Profit',
      'general': 'General'
    };
    return labels[type || ''] || 'Unknown';
  }

  getStatusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      'active': 'Active',
      'pending_verification': 'Pending Verification',
      'verification_rejected': 'Verification Rejected',
      'suspended': 'Suspended',
      'inactive': 'Inactive'
    };
    return labels[status || ''] || 'Unknown';
  }

  getStatusClasses(status: string | undefined): string {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'pending_verification':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case 'verification_rejected':
        return `${baseClasses} bg-red-100 text-red-700`;
      case 'suspended':
        return `${baseClasses} bg-red-100 text-red-700`;
      case 'inactive':
        return `${baseClasses} bg-neutral-100 text-neutral-700`;
      default:
        return `${baseClasses} bg-neutral-100 text-neutral-500`;
    }
  }

  onOrganizationUpdated(updatedOrg: any) {
    // Organization will be updated automatically through the service
    console.log('Organization updated:', updatedOrg.name);
  }

  retryLoad() {
    this.settingsService.loadOrganization().subscribe({
      error: (error) => {
        console.error('Retry failed:', error);
      }
    });
  }
}