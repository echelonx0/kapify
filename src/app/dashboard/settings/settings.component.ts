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
  templateUrl: 'settings.component.html',
  styles: [`
    .settings-page {
  display: flex;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f9fafb; /* neutral-50 */
}

/* Sidebar */
.sidebar {
  width: 16rem;
  flex-shrink: 0;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sidebar-nav button {
  width: 100%;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.75rem;
  transition: all 0.2s ease-in-out;
}

.sidebar-nav button:hover {
  background-color: #f3f4f6; /* hover neutral-100 */
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
}

.nav-icon {
  margin-right: 0.75rem;
  flex-shrink: 0;
  color: #4b5563; /* neutral-600 */
}

.nav-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827; /* neutral-900 */
}

.nav-subtext {
  font-size: 0.75rem;
  color: #6b7280; /* neutral-500 */
}

/* Organization Card */
.org-card {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  transition: all 0.2s;
}

.org-card:hover {
  box-shadow: 0 4px 6px rgba(0,0,0,0.08);
}

.org-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.org-logo, .org-logo-placeholder {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
}

.org-logo-placeholder {
  background-color: #f3f4f6;
  color: #4b5563;
}

.org-info .org-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.org-info .org-type {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Status Badge */
.org-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.status-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  transition: all 0.2s;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
}

.bg-green { background-color: #22c55e; }
.bg-yellow { background-color: #eab308; }
.bg-red { background-color: #ef4444; }
.bg-gray { background-color: #9ca3af; }

.org-verified {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: #16a34a; /* green-600 */
}

/* Main content */
.settings-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Loading and Error Cards */
.loading-card, .error-card, .coming-soon-card {
  padding: 2rem;
  border-radius: 0.75rem;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  text-align: center;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 0.25rem solid #22c55e;
  border-top-color: transparent;
  border-radius: 9999px;
  animation: spin 1s linear infinite;
  margin: 0 auto 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-card h3 {
  color: #b91c1c;
  margin-bottom: 0.5rem;
}

.error-card p {
  color: #991b1b;
  margin-bottom: 1rem;
}

.error-card button {
  background-color: #b91c1c;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.error-card button:hover {
  background-color: #991b1b;
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
    // {
    //   id: 'integrations',
    //   label: 'Integrations',
    //   icon: this.SettingsIcon,
    //   enabled: false,
    //   description: 'Third-party integrations and APIs'
    // },
    // {
    //   id: 'billing',
    //   label: 'Billing',
    //   icon: this.CreditCardIcon,
    //   enabled: false,
    //   description: 'Subscription and payment details'
    // }
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

  trackByTabId(index: number, tab: any) {
  return tab.id;
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