// src/app/shared/components/organization-status-overview/organization-status-overview.component.ts
import {
  Component,
  signal,
  computed,
  OnInit,
  OnDestroy,
  inject,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Building2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  FileText,
  ExternalLink,
  ChevronRight,
  Zap,
  Target,
  TrendingUp,
} from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import {
  FunderOnboardingService,
  OnboardingState,
} from '../../../funder/services/funder-onboarding.service';

export interface ActionEvent {
  type:
    | 'complete_setup'
    | 'get_verified'
    | 'edit_organization'
    | 'manage_public_profile'
    | 'share_profile';
  target?: string;
}

interface StatusPriority {
  item: string;
  field: string;
  revenueImpact: 'high' | 'medium' | 'low';
  userEffort: 'quick' | 'moderate' | 'complex';
  description: string;
  action: string;
}

@Component({
  selector: 'app-organization-status-overview',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './status-overview.component.html',
  styleUrl: './status-overview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationStatusOverviewComponent implements OnInit, OnDestroy {
  private onboardingService = inject(FunderOnboardingService);
  private destroy$ = new Subject<void>();

  // Icons
  Building2Icon = Building2;
  CheckCircleIcon = CheckCircle;
  AlertTriangleIcon = AlertTriangle;
  ClockIcon = Clock;
  ShieldIcon = Shield;
  FileTextIcon = FileText;
  ExternalLinkIcon = ExternalLink;
  ChevronRightIcon = ChevronRight;
  ZapIcon = Zap;
  TargetIcon = Target;
  TrendingUpIcon = TrendingUp;

  // State
  onboardingState = signal<OnboardingState | null>(null);
  logoLoadError = signal(false);
  isAnimated = signal(false);

  // Events
  actionClicked = output<ActionEvent>();

  // Priority matrix for missing items
  private priorityMatrix: StatusPriority[] = [
    {
      item: 'Organization Name',
      field: 'name',
      revenueImpact: 'high',
      userEffort: 'quick',
      description: 'Required for opportunity creation',
      action: 'Add organization name',
    },
    {
      item: 'Contact Email',
      field: 'email',
      revenueImpact: 'high',
      userEffort: 'quick',
      description: 'SMEs need to contact you',
      action: 'Add contact email',
    },
    {
      item: 'Legal Name',
      field: 'legalName',
      revenueImpact: 'high',
      userEffort: 'quick',
      description: 'Required for verification',
      action: 'Add legal name',
    },
    {
      item: 'Registration Number',
      field: 'registrationNumber',
      revenueImpact: 'high',
      userEffort: 'moderate',
      description: 'Builds trust with applicants',
      action: 'Add registration number',
    },
    {
      item: 'Business Address',
      field: 'addressLine1',
      revenueImpact: 'medium',
      userEffort: 'moderate',
      description: 'Required for legal compliance',
      action: 'Add business address',
    },
    {
      item: 'Phone Number',
      field: 'phone',
      revenueImpact: 'medium',
      userEffort: 'quick',
      description: 'Alternative contact method',
      action: 'Add phone number',
    },
    {
      item: 'Organization Description',
      field: 'description',
      revenueImpact: 'medium',
      userEffort: 'moderate',
      description: 'Helps SMEs understand your focus',
      action: 'Add description',
    },
  ];

  // Computed properties
  isComplete = computed(() => {
    return this.onboardingState()?.isComplete ?? false;
  });

  isVerified = computed(() => {
    return this.onboardingState()?.organization?.isVerified ?? false;
  });

  hasUrgentItems = computed(() => {
    return this.getHighPriorityMissingItems().length > 0;
  });

  canCreateOpportunities = computed(() => {
    return this.onboardingState()?.canCreateOpportunities ?? false;
  });

  ngOnInit() {
    this.loadOnboardingState();
    this.setupSubscriptions();

    // Trigger animation after short delay
    setTimeout(() => this.isAnimated.set(true), 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // DATA LOADING
  // ===============================

  private loadOnboardingState() {
    this.onboardingService
      .checkOnboardingStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state) => {
          this.onboardingState.set(state);
          console.log('✅ Organization status loaded:', state);
        },
        error: (error) => {
          console.error('❌ Failed to load onboarding state:', error);
        },
      });
  }

  private setupSubscriptions() {
    this.onboardingService.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.onboardingState.set(state);
      });
  }

  // ===============================
  // LOGO DISPLAY
  // ===============================

  getOrganizationLogo(): string | null {
    const org = this.onboardingState()?.organization;
    if (!org?.logoUrl || this.logoLoadError()) {
      return null;
    }
    return org.logoUrl;
  }

  onLogoLoadError() {
    console.warn('⚠️ Failed to load organization logo');
    this.logoLoadError.set(true);
  }

  // ===============================
  // STATUS COMPUTATION
  // ===============================

  getCompletionPercentage(): number {
    return this.onboardingState()?.completionPercentage ?? 0;
  }

  getOrganizationName(): string {
    const org = this.onboardingState()?.organization;
    return org?.name || 'Organization Setup';
  }

  getStatusText(): string {
    const state = this.onboardingState();
    if (!state) return 'Loading...';

    if (state.organization?.isVerified) return 'Verified';
    if (state.isComplete) return 'Complete';
    if (state.completionPercentage >= 50) return 'In Progress';
    return 'Setup Required';
  }

  getMainStatusTitle(): string {
    const state = this.onboardingState();
    if (!state) return 'Loading Organization Status';

    if (state.organization?.isVerified) {
      return '✓ Organization Verified';
    } else if (state.isComplete) {
      return '✓ Setup Complete';
    } else if (state.completionPercentage >= 50) {
      return '⚡ Almost There!';
    } else {
      return '⚠️ Organization Setup Required';
    }
  }

  getMainStatusDescription(): string {
    const state = this.onboardingState();
    if (!state) return 'Loading your organization details...';

    if (state.organization?.isVerified) {
      return 'Your organization is verified and ready to create opportunities.';
    } else if (state.isComplete) {
      return 'Setup complete. Request verification to unlock all features.';
    } else {
      const missing = this.getTotalMissingItems();
      return `${missing} item${
        missing === 1 ? '' : 's'
      } remaining to enable opportunity creation.`;
    }
  }

  // ===============================
  // MISSING ITEMS ANALYSIS
  // ===============================

  getHighPriorityMissingItems(): StatusPriority[] {
    const org = this.onboardingState()?.organization;
    if (!org) return [];

    return this.priorityMatrix.filter((priority) => {
      const fieldValue = this.getFieldValue(org, priority.field);
      const isMissing =
        !fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim());
      return (
        isMissing &&
        priority.revenueImpact === 'high' &&
        priority.userEffort === 'quick'
      );
    });
  }

  getAllMissingItems(): StatusPriority[] {
    const org = this.onboardingState()?.organization;
    if (!org) return [];

    return this.priorityMatrix
      .filter((priority) => {
        const fieldValue = this.getFieldValue(org, priority.field);
        const isMissing =
          !fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim());
        return isMissing;
      })
      .sort((a, b) => {
        const impactWeight = { high: 3, medium: 2, low: 1 };
        const effortWeight = { quick: 3, moderate: 2, complex: 1 };

        const aScore =
          impactWeight[a.revenueImpact] * effortWeight[a.userEffort];
        const bScore =
          impactWeight[b.revenueImpact] * effortWeight[b.userEffort];

        return bScore - aScore;
      });
  }

  getTotalMissingItems(): number {
    return this.getAllMissingItems().length;
  }

  private getFieldValue(org: any, field: string): any {
    return org[field];
  }

  shouldShowVerification(): boolean {
    const state = this.onboardingState();
    return !!(state?.isComplete && !state.organization?.isVerified);
  }

  canRequestVerification(): boolean {
    const state = this.onboardingState();
    return !!(
      state?.isComplete && state.organization?.status !== 'pending_verification'
    );
  }

  getVerificationButtonText(): string {
    const state = this.onboardingState();
    if (state?.organization?.status === 'pending_verification') {
      return 'Verification Pending';
    }
    return 'Request Verification';
  }

  getPrimaryAction(): StatusPriority | null {
    const highPriority = this.getHighPriorityMissingItems();
    return highPriority.length > 0 ? highPriority[0] : null;
  }

  // ===============================
  // ACTION HANDLERS
  // ===============================

  handlePrimaryAction() {
    const action = this.getPrimaryAction();
    if (action) {
      this.actionClicked.emit({ type: 'complete_setup', target: action.field });
    }
  }

  completeSetup() {
    this.actionClicked.emit({ type: 'complete_setup' });
  }

  editOrganization() {
    this.actionClicked.emit({ type: 'edit_organization' });
  }

  requestVerification() {
    if (this.canRequestVerification()) {
      this.actionClicked.emit({ type: 'get_verified' });
    }
  }

  managePublicProfile() {
    this.actionClicked.emit({ type: 'manage_public_profile' });
  }

  // ===============================
  // STYLING METHODS
  // ===============================

  getStatusIcon(): any {
    const state = this.onboardingState();
    if (!state) return this.ClockIcon;

    if (state.organization?.isVerified) return this.CheckCircleIcon;
    if (state.isComplete) return this.ShieldIcon;
    return this.AlertTriangleIcon;
  }

  getStatusBadgeClass(): string {
    const state = this.onboardingState();
    if (!state) return 'bg-slate-50 text-slate-700 border-slate-200/50';

    if (state.organization?.isVerified) {
      return 'bg-green-50 text-green-700 border-green-200/50';
    } else if (state.isComplete) {
      return 'bg-slate-50 text-slate-700 border-slate-200/50';
    } else if (state.completionPercentage >= 50) {
      return 'bg-amber-50 text-amber-700 border-amber-200/50';
    } else {
      return 'bg-red-50 text-red-700 border-red-200/50';
    }
  }

  getMainStatusCardClass(): string {
    const state = this.onboardingState();
    if (!state) return 'bg-slate-50 border-slate-200/50';

    if (state.organization?.isVerified) {
      return 'bg-green-50 border-green-200/50';
    } else if (state.isComplete) {
      return 'bg-teal-50 border-teal-200/50';
    } else if (state.completionPercentage >= 50) {
      return 'bg-amber-50 border-amber-200/50';
    } else {
      return 'bg-red-50 border-red-200/50';
    }
  }

  getStatusIconBg(): string {
    const state = this.onboardingState();
    if (!state) return 'bg-slate-100';

    if (state.organization?.isVerified) return 'bg-green-100';
    if (state.isComplete) return 'bg-teal-100';
    if (state.completionPercentage >= 50) return 'bg-amber-100';
    return 'bg-red-100';
  }

  getStatusIconColor(): string {
    const state = this.onboardingState();
    if (!state) return 'text-slate-600';

    if (state.organization?.isVerified) return 'text-green-600';
    if (state.isComplete) return 'text-teal-600';
    if (state.completionPercentage >= 50) return 'text-amber-600';
    return 'text-red-600';
  }

  getStatusTitleColor(): string {
    const state = this.onboardingState();
    if (!state) return 'text-slate-900';

    if (state.organization?.isVerified) return 'text-green-900';
    if (state.isComplete) return 'text-teal-900';
    if (state.completionPercentage >= 50) return 'text-amber-900';
    return 'text-red-900';
  }

  getStatusTextColor(): string {
    const state = this.onboardingState();
    if (!state) return 'text-slate-700';

    if (state.organization?.isVerified) return 'text-green-700';
    if (state.isComplete) return 'text-teal-700';
    if (state.completionPercentage >= 50) return 'text-amber-700';
    return 'text-red-700';
  }

  getProgressBarColor(): string {
    const state = this.onboardingState();
    if (!state) return 'bg-slate-400';

    if (state.organization?.isVerified) {
      return 'bg-gradient-to-r from-green-400 to-green-500';
    } else if (state.isComplete) {
      return 'bg-gradient-to-r from-teal-400 to-teal-500';
    } else if (state.completionPercentage >= 50) {
      return 'bg-gradient-to-r from-amber-400 to-amber-500';
    } else {
      return 'bg-gradient-to-r from-red-400 to-red-500';
    }
  }

  formatOrganizationType(type: string): string {
    const types: Record<string, string> = {
      investment_fund: 'Investment Fund',
      venture_capital: 'Venture Capital',
      private_equity: 'Private Equity',
      bank: 'Bank',
      government: 'Government Agency',
      ngo: 'NGO/Non-Profit',
    };
    return types[type] || type;
  }
}
