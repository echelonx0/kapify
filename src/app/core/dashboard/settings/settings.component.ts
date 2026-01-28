import {
  Component,
  OnInit,
  signal,
  inject,
  OnDestroy,
  computed,
  effect,
} from '@angular/core';
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
  Sticker,
  Lock,
} from 'lucide-angular';

import { GeneralInfoComponent } from './components/general-info/general-info.component';
import { LegalInfoComponent } from './components/legal/legal-info.component';
import { OrganizationSettingsService } from '../services/organization-settings.service';
import { ContactDetailsComponent } from './components/contact-details/contact-details.component';
import { TeamManagementComponent } from './components/team-management/team-management.component';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { Router } from '@angular/router';

import { AccountComponent } from './components/account/account.component';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { CreditsComponent } from '../finance/credits/credits.component';
import { FundingProfileSetupService } from 'src/app/fund-seeking-orgs/services/funding-profile-setup.service';

type SettingsSection =
  | 'general'
  | 'contact'
  | 'legal'
  | 'integrations'
  | 'billing'
  | 'profile'
  | 'account'
  | 'password'
  | 'team';

interface SettingsTab {
  id: SettingsSection;
  label: string;
  icon: any;
  enabled: boolean;
}

const SETTINGS_TAB_STORAGE_KEY = 'kapify_settings_active_tab';

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
    CreditsComponent,
    AccountComponent,
    ChangePasswordComponent,
  ],
  templateUrl: 'settings.component.html',
  styles: [
    `
      :host {
        display: block;
      }

      /* Neo-Brutalist Tab Styling */
      .tab-button {
        position: relative;
        overflow: hidden;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        border-left: 3px solid transparent;
      }

      .tab-button:hover:not(:disabled) {
        background-color: #f1f5f9;
      }

      .tab-button.active {
        background-color: #f8fafc;
        border-left-color: #14b8a6;
      }

      .tab-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Icon color transition */
      .tab-icon {
        transition: color 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .tab-button.active .tab-icon {
        color: #0d9488;
      }

      /* Active label uppercase animation */
      .tab-label {
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: 500;
      }

      .tab-button.active .tab-label {
        font-weight: 700;
        letter-spacing: 0.025em;
      }

      /* Coming soon badge */
      .coming-soon-badge {
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(2px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Content section fade in */
      :host ::ng-deep .settings-content {
        animation: contentFadeIn 0.3s ease-out;
      }

      @keyframes contentFadeIn {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      /* Sidebar nav container */
      .settings-nav {
        transition: all 0.2s ease;
      }

      /* Organization card hover effect */
      .org-card {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .org-card:hover {
        transform: translateY(-1px);
      }

      /* Tab transition smoothness */
      .tab-button {
        --tw-transition-property: all;
        --tw-transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        --tw-transition-duration: 250ms;
      }
    `,
  ],
})
export class SettingsComponent implements OnInit, OnDestroy {
  private settingsService = inject(OrganizationSettingsService);
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private router = inject(Router);
  private profileService = inject(FundingProfileSetupService);

  // Icons
  SettingsIcon = Settings;
  Building2Icon = Building2;
  FileTextIcon = FileText;
  GlobeIcon = Globe;
  CreditCardIcon = CreditCard;
  ShieldIcon = Shield;
  UserIcon = User;
  ProfileIcon = Sticker;
  LockIcon = Lock;

  // State with localStorage persistence
  activeSection = signal<SettingsSection>(
    this.getPersistedActiveTab() || 'account',
  );

  // Service state
  isLoading = this.settingsService.isLoading;
  isSaving = this.settingsService.isSaving;
  error = this.settingsService.error;
  organization = this.settingsService.organization;
  userType = computed(() => this.authService.user()?.userType || 'sme');

  // Settings tabs configuration - computed to filter by organization type
  get settingsTabs(): SettingsTab[] {
    const isSME = this.userType() === 'sme';

    const allTabs: SettingsTab[] = [
      {
        id: 'account',
        label: 'Your Account',
        icon: this.ProfileIcon,
        enabled: true,
      },
      {
        id: 'team',
        label: 'Team Members',
        icon: this.UserIcon,
        enabled: true,
      },
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
        id: 'billing',
        label: 'Billing & Credits',
        icon: this.CreditCardIcon,
        enabled: true,
      },

      {
        id: 'password',
        label: 'Change Password',
        icon: this.LockIcon,
        enabled: true,
      },
      {
        id: 'profile',
        label: 'Public Profile',
        icon: this.ProfileIcon,
        enabled: false,
      },
      {
        id: 'integrations',
        label: 'Integrations',
        icon: this.SettingsIcon,
        enabled: false,
      },
    ];

    // Hide general, contact, legal for SMEs
    return isSME
      ? allTabs.filter(
          (tab) => !['general', 'contact', 'legal'].includes(tab.id),
        )
      : allTabs;
  }

  constructor() {
    // Effect to persist active section to localStorage whenever it changes
    effect(() => {
      const section = this.activeSection();
      this.persistActiveTab(section);
    });
  }

  ngOnInit() {
    this.settingsService.organization$
      .pipe(takeUntil(this.destroy$))
      .subscribe((org) => {
        if (org) {
          // Validate persisted tab is still available
          const currentSection = this.activeSection();
          if (!this.settingsTabs.find((t) => t.id === currentSection)) {
            // Reset to first available tab if persisted tab is no longer available
            this.activeSection.set(this.settingsTabs[0]?.id || 'billing');
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get persisted active tab from localStorage
   */
  private getPersistedActiveTab(): SettingsSection | null {
    try {
      const stored = localStorage.getItem(SETTINGS_TAB_STORAGE_KEY);
      if (stored && this.isValidTabId(stored)) {
        return stored as SettingsSection;
      }
    } catch (e) {
      console.warn('Failed to read persisted tab:', e);
    }
    return null;
  }

  /**
   * Persist active tab to localStorage
   */
  private persistActiveTab(section: SettingsSection): void {
    try {
      localStorage.setItem(SETTINGS_TAB_STORAGE_KEY, section);
    } catch (e) {
      console.warn('Failed to persist active tab:', e);
    }
  }

  /**
   * Validate tab ID is valid
   */
  private isValidTabId(id: string): boolean {
    const validIds: SettingsSection[] = [
      'general',
      'contact',
      'legal',
      'integrations',
      'billing',
      'profile',
      'account',
      'password',
      'team',
    ];
    return validIds.includes(id as SettingsSection);
  }

  setActiveSection(section: SettingsSection) {
    const tab = this.settingsTabs.find((t) => t.id === section);

    if (tab?.enabled) {
      if (section === 'profile') {
        this.navigateToProfile();
        return;
      }
      this.activeSection.set(section);
    }
  }

  private navigateToProfile() {
    const orgType = this.organization()?.organizationType;
    const userType = this.authService.user()?.userType;

    if (userType === 'sme' || orgType === 'sme') {
      // Get public profile slug and open in new tab
      const slug = this.profileService.getCurrentSlug();
      if (slug) {
        const profileUrl = `${window.location.origin}/invest/${slug}`;
        window.open(profileUrl, '_blank');
      } else {
        alert('Please save your profile first');
      }
    } else if (userType === 'funder' || orgType === 'investment_fund') {
      // Navigate to funder profile creation
      this.router.navigate(['/funder/create-profile']);
    } else {
      // Generic profile route
      this.router.navigate(['/profile']);
    }
  }

  trackByTabId(index: number, tab: SettingsTab) {
    return tab.id;
  }

  get isSME() {
    return this.userType() === 'sme';
  }

  getSectionClasses(sectionId: SettingsSection): string {
    const isActive = this.activeSection() === sectionId;
    const isEnabled = this.settingsTabs.find(
      (t) => t.id === sectionId,
    )?.enabled;

    const classes = [
      'tab-button',
      'w-full',
      'text-left',
      'px-4',
      'py-3',
      'rounded-lg',
      'transition-all',
      'duration-200',
      isActive ? 'active' : '',
      !isEnabled ? 'disabled opacity-60 cursor-not-allowed' : 'cursor-pointer',
    ];

    return classes.filter(Boolean).join(' ');
  }

  getTabIconColor(tabId: SettingsSection): string {
    const isActive = this.activeSection() === tabId;
    return isActive ? 'text-teal-600' : 'text-slate-400';
  }

  getTabLabelClass(tabId: SettingsSection): string {
    const isActive = this.activeSection() === tabId;
    return isActive ? 'uppercase tracking-wide' : '';
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
