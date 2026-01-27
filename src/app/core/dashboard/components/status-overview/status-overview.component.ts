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
  Shield,
  FileText,
  ExternalLink,
  CircleCheckBig,
  TriangleAlert,
} from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import {
  FunderOnboardingService,
  OnboardingState,
} from '../../../../funder/services/funder-onboarding.service';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/shared/services/toast.service';

export interface ActionEvent {
  type:
    | 'complete_setup'
    | 'get_verified'
    | 'edit_organization'
    | 'manage_public_profile';
  target?: string;
}

interface StatusPriority {
  item: string;
  field: string;
  revenueImpact: 'high' | 'medium' | 'low';
  userEffort: 'quick' | 'moderate' | 'complex';
  description: string;
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
  private router = inject(Router);
  private toastService = inject(ToastService);
  // Icons
  readonly CheckCircleIcon = CircleCheckBig;
  readonly AlertTriangleIcon = TriangleAlert;
  readonly ShieldIcon = Shield;
  readonly FileTextIcon = FileText;
  readonly ExternalLinkIcon = ExternalLink;

  // State
  onboardingState = signal<OnboardingState | null>(null);
  isAnimated = signal(false);

  // Events
  actionClicked = output<ActionEvent>();

  // Priority matrix for missing items
  private readonly priorityMatrix: StatusPriority[] = [
    {
      item: 'Organization Name',
      field: 'name',
      revenueImpact: 'high',
      userEffort: 'quick',
      description: 'Required for opportunity creation',
    },
    {
      item: 'Contact Email',
      field: 'email',
      revenueImpact: 'high',
      userEffort: 'quick',
      description: 'SMEs need to contact you',
    },
    {
      item: 'Legal Name',
      field: 'legalName',
      revenueImpact: 'high',
      userEffort: 'quick',
      description: 'Required for verification',
    },
    {
      item: 'Registration Number',
      field: 'registrationNumber',
      revenueImpact: 'high',
      userEffort: 'moderate',
      description: 'Builds trust with applicants',
    },
    {
      item: 'Business Address',
      field: 'addressLine1',
      revenueImpact: 'medium',
      userEffort: 'moderate',
      description: 'Required for legal compliance',
    },
    {
      item: 'Phone Number',
      field: 'phone',
      revenueImpact: 'medium',
      userEffort: 'quick',
      description: 'Alternative contact method',
    },
    {
      item: 'Organization Description',
      field: 'description',
      revenueImpact: 'medium',
      userEffort: 'moderate',
      description: 'Helps SMEs understand your focus',
    },
  ];

  /* ================= COMPUTED PROPERTIES ================= */

  isComplete = computed(() => this.onboardingState()?.isComplete ?? false);
  isVerified = computed(
    () => this.onboardingState()?.organization?.isVerified ?? false,
  );
  completionPercentage = computed(
    () => this.onboardingState()?.completionPercentage ?? 0,
  );
  canCreateOpportunities = computed(
    () => this.onboardingState()?.canCreateOpportunities ?? false,
  );

  hasUrgentItems = computed(
    () => this.getHighPriorityMissingItems().length > 0,
  );
  primaryAction = computed(() => {
    const highPriority = this.getHighPriorityMissingItems();
    return highPriority.length > 0 ? highPriority[0] : null;
  });
  totalMissingItems = computed(() => this.getAllMissingItems().length);

  // Status computed properties
  statusIcon = computed(() => {
    if (this.isVerified()) return this.CheckCircleIcon;
    if (this.isComplete()) return this.ShieldIcon;
    return this.AlertTriangleIcon;
  });

  statusTitle = computed(() => {
    if (this.isVerified()) return '✓ Organization Verified';
    if (this.isComplete()) return '✓ Setup Complete';
    if (this.completionPercentage() >= 50) return '⚡ Almost There!';
    return '⚠️ Setup Required';
  });

  statusDescription = computed(() => {
    if (!this.onboardingState()) return 'Loading...';
    if (this.isVerified())
      return 'Your organization is verified and ready to create opportunities.';
    if (this.isComplete())
      return 'Setup complete. Kapify verification in progress.';
    const missing = this.totalMissingItems();
    return `${missing} item${missing === 1 ? '' : 's'} remaining.`;
  });

  borderClass = computed(() => {
    if (this.isVerified()) return 'border-4 border-green-600';
    if (this.isComplete()) return 'border-4 border-teal-600';
    if (this.completionPercentage() >= 50) return 'border-4 border-amber-600';
    return 'border-4 border-slate-900';
  });

  bgClass = computed(() => {
    if (this.isVerified()) return 'bg-green-50';
    if (this.isComplete()) return 'bg-teal-50';
    if (this.completionPercentage() >= 50) return 'bg-amber-50';
    return 'bg-white';
  });

  iconBgClass = computed(() => {
    if (this.isVerified()) return 'bg-green-100 border-3 border-green-600';
    if (this.isComplete()) return 'bg-teal-100 border-3 border-teal-600';
    if (this.completionPercentage() >= 50)
      return 'bg-amber-100 border-3 border-amber-600';
    return 'bg-slate-100 border-3 border-slate-900';
  });

  iconColorClass = computed(() => {
    if (this.isVerified()) return 'text-green-700';
    if (this.isComplete()) return 'text-teal-700';
    if (this.completionPercentage() >= 50) return 'text-amber-700';
    return 'text-slate-900';
  });

  progressBarClass = computed(() => {
    if (this.isVerified())
      return 'bg-gradient-to-r from-green-500 to-green-600';
    if (this.isComplete()) return 'bg-gradient-to-r from-teal-500 to-teal-600';
    if (this.completionPercentage() >= 50)
      return 'bg-gradient-to-r from-amber-500 to-amber-600';
    return 'bg-gradient-to-r from-slate-900 to-slate-800';
  });

  ngOnInit(): void {
    this.loadOnboardingState();
    this.setupSubscriptions();
    setTimeout(() => this.isAnimated.set(true), 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ================= DATA LOADING ================= */

  private loadOnboardingState(): void {
    this.onboardingService
      .checkOnboardingStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state) => {
          this.onboardingState.set(state);
          // console.log('✅ Organization status loaded:', state);
        },
        error: (error) => {
          console.error('❌ Failed to load onboarding state:', error);
        },
      });
  }

  private setupSubscriptions(): void {
    this.onboardingService.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.onboardingState.set(state);
      });
  }

  /* ================= MISSING ITEMS ANALYSIS ================= */

  private isMissingField(org: any, field: string): boolean {
    const value = org?.[field];
    return !value || (typeof value === 'string' && !value.trim());
  }

  getHighPriorityMissingItems(): StatusPriority[] {
    const org = this.onboardingState()?.organization;
    if (!org) return [];

    return this.priorityMatrix.filter(
      (priority) =>
        this.isMissingField(org, priority.field) &&
        priority.revenueImpact === 'high' &&
        priority.userEffort === 'quick',
    );
  }

  getAllMissingItems(): StatusPriority[] {
    const org = this.onboardingState()?.organization;
    if (!org) return [];

    return this.priorityMatrix
      .filter((priority) => this.isMissingField(org, priority.field))
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

  canRequestVerification(): boolean {
    const state = this.onboardingState();
    return !!(
      state?.isComplete && state.organization?.status !== 'pending_verification'
    );
  }

  /* ================= ACTION HANDLERS ================= */

  handlePrimaryAction(): void {
    const action = this.primaryAction();
    if (action) {
      this.actionClicked.emit({ type: 'complete_setup', target: action.field });
    }
  }

  completeSetup(): void {
    this.actionClicked.emit({ type: 'complete_setup' });
  }

  editOrganization(): void {
    this.actionClicked.emit({ type: 'edit_organization' });
  }

  requestVerification(): void {
    if (this.canRequestVerification()) {
      this.actionClicked.emit({ type: 'get_verified' });
    }
  }

  managePublicProfile(): void {
    this.actionClicked.emit({ type: 'manage_public_profile' });
  }

  createOpportunity(): void {
    if (this.canCreateOpportunities()) {
      this.router.navigate(['/funding/create-opportunity']);
    } else {
      this.toastService.error(
        'Complete your organization setup and verification to create opportunities.',
      );
    }
  }
}
