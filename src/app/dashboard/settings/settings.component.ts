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
  Shield,
  User,
} from 'lucide-angular';

import { GeneralInfoComponent } from './components/general-info/general-info.component';
import { LegalInfoComponent } from './components/legal/legal-info.component';
import { OrganizationSettingsService } from '../services/organization-settings.service';
import { ContactDetailsComponent } from './components/contact-details/contact-details.component';
import { TeamManagementComponent } from './components/team-management/team-management.component';

type SettingsSection =
  | 'general'
  | 'contact'
  | 'legal'
  | 'integrations'
  | 'billing'
  | 'team';

interface SettingsTab {
  id: SettingsSection;
  label: string;
  icon: any;
  enabled: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    GeneralInfoComponent,
    ContactDetailsComponent,
    LegalInfoComponent,
    TeamManagementComponent,
  ],
  templateUrl: 'settings.component.html',
  styles: [
    `
      :host {
        display: block;
      }

      .tab-button {
        position: relative;
        overflow: hidden;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .tab-button.active {
        background-color: #f8fafc;
      }

      .tab-button:hover:not(:disabled) {
        background-color: #f1f5f9;
      }

      .tab-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      :host ::ng-deep .settings-content {
        animation: fadeIn 0.3s ease-out;
      }
    `,
  ],
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
  UserIcon = User;

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
      label: 'General Info',
      icon: this.Building2Icon,
      enabled: true,
    },
    {
      id: 'contact',
      label: 'Contact Details',
      icon: this.GlobeIcon,
      enabled: true,
    },
    {
      id: 'legal',
      label: 'Legal Information',
      icon: this.FileTextIcon,
      enabled: true,
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: this.SettingsIcon,
      enabled: false,
    },
    {
      id: 'team', // NEW
      label: 'Team Members',
      icon: this.UserIcon,
      enabled: true,
    },
    {
      id: 'billing',
      label: 'Billing & Plans',
      icon: this.CreditCardIcon,
      enabled: false,
    },
  ];

  ngOnInit() {
    this.settingsService.organization$
      .pipe(takeUntil(this.destroy$))
      .subscribe((org) => {
        if (org) {
          console.log('Organization loaded:', org.name);
        } else {
          console.log('Did not find organisation data...');
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveSection(section: SettingsSection) {
    const tab = this.settingsTabs.find((t) => t.id === section);
    if (tab?.enabled) {
      this.activeSection.set(section);
    }
  }

  trackByTabId(index: number, tab: SettingsTab) {
    return tab.id;
  }

  getSectionClasses(sectionId: SettingsSection): string {
    const isActive = this.activeSection() === sectionId;
    const isEnabled = this.settingsTabs.find(
      (t) => t.id === sectionId
    )?.enabled;

    const classes = [
      'tab-button',
      'w-full',
      'text-left',
      'transition-all',
      'duration-200',
      'rounded-xl',
      isActive ? 'active bg-slate-100' : 'hover:bg-slate-50',
      !isEnabled ? 'disabled opacity-60 cursor-not-allowed' : 'cursor-pointer',
    ];

    return classes.filter(Boolean).join(' ');
  }

  getTabIconColor(tabId: SettingsSection): string {
    const isActive = this.activeSection() === tabId;
    return isActive ? 'text-orange-500' : 'text-slate-400';
  }

  getStatusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      active: 'Active',
      pending_verification: 'Pending Verification',
      verification_rejected: 'Verification Rejected',
      suspended: 'Suspended',
      inactive: 'Inactive',
    };
    return labels[status || ''] || 'Unknown';
  }

  getStatusClasses(status: string | undefined): string {
    const classMap: Record<string, string> = {
      active: 'bg-green-50 text-green-700 border border-green-200/50',
      pending_verification:
        'bg-amber-50 text-amber-700 border border-amber-200/50',
      verification_rejected: 'bg-red-50 text-red-700 border border-red-200/50',
      suspended: 'bg-red-50 text-red-700 border border-red-200/50',
      inactive: 'bg-slate-50 text-slate-700 border border-slate-200/50',
    };
    return (
      classMap[status || ''] ||
      'bg-slate-50 text-slate-700 border border-slate-200/50'
    );
  }

  getOrganizationTypeLabel(type: string | undefined): string {
    const labels: Record<string, string> = {
      investment_fund: 'Investment Fund',
      venture_capital: 'Venture Capital',
      private_equity: 'Private Equity',
      bank: 'Bank',
      government: 'Government Agency',
      ngo: 'NGO/Non-Profit',
      general: 'General',
      sme: 'Small Business',
      startup: 'Startup',
      nonprofit: 'Non-Profit',
      enterprise: 'Enterprise',
      funder: 'Funding Organization',
    };
    return labels[type || ''] || 'Organization';
  }

  onOrganizationUpdated(updatedOrg: any) {
    console.log('Organization updated:', updatedOrg.name);
  }

  retryLoad() {
    this.settingsService.loadOrganization().subscribe({
      error: (error) => {
        console.error('Retry failed:', error);
      },
    });
  }
}
