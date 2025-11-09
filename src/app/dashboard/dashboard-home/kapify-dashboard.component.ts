import {
  Component,
  signal,
  computed,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  LucideAngularModule,
  FileText,
  Clock,
  TrendingUp,
  DollarSign,
  Plus,
  Filter,
  Eye,
  Search,
  X,
  BookOpen,
  Users,
  Target,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Shield,
  Zap,
  BarChart3,
  FolderOpen,
  Home,
  ChevronDown,
} from 'lucide-angular';
import { UiButtonComponent } from '../../shared/components';
import {
  RightPanelContent,
  RightPanelComponent,
} from '../components/right-panel.component';
import { ProfileManagementService } from 'src/app/shared/services/profile-management.service';
import { AuthService } from 'src/app/auth/production.auth.service';
import { FunderOnboardingService } from 'src/app/funder/services/funder-onboarding.service';
import { OpportunityManagementService } from 'src/app/funder/services/opportunity-management.service';

interface OnboardingCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  type: 'info' | 'action' | 'feature';
  actionText?: string;
  actionRoute?: string;
  rightPanelContent?: RightPanelContent;
  completed?: boolean;
  color: string;
}

interface AnalyticsStat {
  id: string;
  label: string;
  value: string | number;
  icon: any;
  color: 'teal' | 'green' | 'blue' | 'amber';
  description?: string;
}

@Component({
  selector: 'app-kapify-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    UiButtonComponent,
    RightPanelComponent,
  ],
  templateUrl: './kapify-dashboard.component.html',
  styleUrl: './kapify-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KapifyDashboard implements OnInit, OnDestroy {
  private router = inject(Router);
  private profileService = inject(ProfileManagementService);
  private authService = inject(AuthService);
  private onboardingService = inject(FunderOnboardingService);
  private managementService = inject(OpportunityManagementService);
  private destroy$ = new Subject<void>();

  // Icons
  FileTextIcon = FileText;
  ClockIcon = Clock;
  TrendingUpIcon = TrendingUp;
  DollarSignIcon = DollarSign;
  PlusIcon = Plus;
  FilterIcon = Filter;
  EyeIcon = Eye;
  SearchIcon = Search;
  XIcon = X;
  BookOpenIcon = BookOpen;
  UsersIcon = Users;
  TargetIcon = Target;
  CheckCircleIcon = CheckCircle;
  ArrowRightIcon = ArrowRight;
  LightbulbIcon = Lightbulb;
  ShieldIcon = Shield;
  ZapIcon = Zap;
  BarChart3Icon = BarChart3;
  FolderOpenIcon = FolderOpen;
  HomeIcon = Home;
  ChevronDownIcon = ChevronDown;

  // State Signals
  isLoading = signal(false);
  rightPanelContent = signal<RightPanelContent>('activity-inbox');
  currentUser = computed(() => this.profileService.currentUser());
  userType = computed(() => this.authService.user()?.userType || 'sme');

  // Analytics state (integrated from funder dashboard)
  analytics = signal<any>(null);
  recentOpportunities = signal<any[]>([]);
  onboardingState = signal<any>(null);

  // SME-specific onboarding content
  private smeOnboardingData: OnboardingCard[] = [
    {
      id: 'how-it-works',
      title: 'How Kapify Works',
      description:
        'Complete your profile, get matched with suitable organisations, and with kapify intelligent assist.',
      icon: BookOpen,
      type: 'info',
      actionText: 'Learn the Process',
      rightPanelContent: 'how-it-works',
      color: 'blue',
    },
    {
      id: 'funding-types',
      title: 'Explore Funding Types',
      description:
        'Discover different funding options available depending on your business stage and needs.',
      icon: DollarSign,
      type: 'feature',
      actionText: 'View Funding Options',
      rightPanelContent: 'funding-types',
      color: 'green',
    },
  ];

  // Funder-specific onboarding content
  private funderOnboardingData: OnboardingCard[] = [
    {
      id: 'how-it-works-funder',
      title: 'How Kapify Works for Funders',
      description:
        'Set up your funding criteria, review applications, and connect with vetted businesses seeking funding.',
      icon: BookOpen,
      type: 'info',
      actionText: 'Learn the Process',
      rightPanelContent: 'how-it-works',
      color: 'blue',
    },
    {
      id: 'manage-criteria',
      title: 'Set Funding Criteria',
      description:
        'Define your investment preferences, funding amounts, sectors, and business stages to receive relevant matches.',
      icon: Target,
      type: 'action',
      actionText: 'Manage Profile',
      actionRoute: '/funder/dashboard',
      color: 'amber',
    },
  ];

  // Dynamically compute cards based on user type
  onboardingCards = computed(() =>
    this.userType() === 'funder'
      ? this.funderOnboardingData
      : this.smeOnboardingData
  );

  // Computed CTA content based on user type
  ctaContent = computed(() => {
    if (this.userType() === 'funder') {
      return {
        title: 'Kapify uses a credit system',
        description:
          'You only pay for what you use. There is no subscription. Just buy credits, and then use them in the platform',
        buttonText: 'How it works',
        route: '/finance/credit-info',
        icon: Zap,
      };
    }
    return {
      title: 'Explore Kapify Executive',
      description:
        'You can make yourself available to advice startups and SMEs looking for guidance on funding and growth strategies.',
      buttonText: 'Start a Subscription to explore Kapify Executive',
      route: '/subscriptions/executive',
      icon: Lightbulb,
    };
  });

  // Computed stats based on user type
  statsCards = computed(() => {
    const baseStats: AnalyticsStat[] = [];

    if (this.userType() === 'funder') {
      const analytics = this.analytics();
      return [
        {
          id: 'active-opportunities',
          label: 'Active Opportunities',
          value: this.getActiveOpportunitiesCount(),
          icon: FolderOpen,
          color: 'blue',
          description: 'Your active funding opportunities',
        },
        {
          id: 'total-applications',
          label: 'Accepted Applications',
          value: this.formatNumber(analytics?.totalApplications || 0),
          icon: Users,
          color: 'green',
          description: 'Applications received',
        },
        {
          id: 'conversion-rate',
          label: 'Rejected Applications',
          value: `${(analytics?.averageConversionRate || 0).toFixed(1)}%`,
          icon: TrendingUp,
          color: 'teal',
          description: 'Application conversion rate',
        },
        {
          id: 'total-views',
          label: 'Total Views',
          value: this.formatNumber(analytics?.totalViews || 0),
          icon: BarChart3,
          color: 'amber',
          description: 'Profile and opportunity views',
        },
      ];
    }

    return [
      {
        id: 'applications',
        label: 'Applications Submitted',
        value: 0,
        icon: FileText,
        color: 'teal',
        description: 'Your submitted applications',
      },
      {
        id: 'funders',
        label: 'Active Funders',
        value: '250+',
        icon: Users,
        color: 'green',
        description: 'Funders on the platform',
      },
      {
        id: 'success-rate',
        label: 'Success Rate',
        value: '87%',
        icon: TrendingUp,
        color: 'blue',
        description: 'Platform success rate',
      },
      {
        id: 'total-funded',
        label: 'Total Funded',
        value: 'R2.4B',
        icon: DollarSign,
        color: 'amber',
        description: 'Funded through Kapify',
      },
    ];
  });

  ngOnInit(): void {
    this.loadProfileData();
    this.setupSubscriptions();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProfileData(): void {
    if (!this.currentUser()) {
      this.profileService.loadProfileData().subscribe({
        error: (error) => console.error('Failed to load profile data:', error),
      });
    }
  }

  private setupSubscriptions(): void {
    if (this.userType() === 'funder') {
      this.onboardingService.onboardingState$
        .pipe(takeUntil(this.destroy$))
        .subscribe((state) => {
          this.onboardingState.set(state);
        });

      this.managementService.analytics$
        .pipe(takeUntil(this.destroy$))
        .subscribe((analytics) => {
          this.analytics.set(analytics);
        });

      this.managementService.opportunities$
        .pipe(takeUntil(this.destroy$))
        .subscribe((opportunities) => {
          this.recentOpportunities.set(opportunities.slice(0, 5));
        });
    }
  }

  private loadDashboardData(): void {
    if (this.userType() === 'funder') {
      this.onboardingService.checkOnboardingStatus().subscribe();
      this.managementService.loadAnalytics().subscribe();
      this.managementService.loadUserOpportunities().subscribe();
    }
  }

  // Analytics Methods
  getActiveOpportunitiesCount(): number {
    return this.recentOpportunities().filter((opp) => opp.status === 'active')
      .length;
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-ZA').format(num);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Navigation Actions
  handleCardAction(card: OnboardingCard): void {
    if (card.rightPanelContent) {
      this.rightPanelContent.set(card.rightPanelContent);
    } else if (card.actionRoute) {
      this.router.navigate([card.actionRoute]);
    }
  }

  startApplication(): void {
    const route = this.ctaContent().route;
    this.router.navigate([route]);
  }

  onRightPanelContentChange(content: RightPanelContent): void {
    this.rightPanelContent.set(content);
  }

  createOpportunity(): void {
    if (this.userType() === 'funder') {
      this.router.navigate(['/funding/create-opportunity']);
    }
  }

  viewAllOpportunities(): void {
    if (this.userType() === 'funder') {
      this.router.navigate(['/funder/opportunities']);
    }
  }

  // Card styling utility methods
  getStatCardBgColor(color: string): string {
    const colorMap: Record<string, string> = {
      teal: 'bg-teal-50',
      green: 'bg-green-50',
      blue: 'bg-blue-50',
      amber: 'bg-amber-50',
    };
    return colorMap[color] || 'bg-slate-50';
  }

  getStatCardTextColor(color: string): string {
    const colorMap: Record<string, string> = {
      teal: 'text-teal-700',
      green: 'text-green-700',
      blue: 'text-blue-700',
      amber: 'text-amber-700',
    };
    return colorMap[color] || 'text-slate-700';
  }

  getStatCardIconBg(color: string): string {
    const colorMap: Record<string, string> = {
      teal: 'bg-teal-100',
      green: 'bg-green-100',
      blue: 'bg-blue-100',
      amber: 'bg-amber-100',
    };
    return colorMap[color] || 'bg-slate-100';
  }

  getStatCardIconColor(color: string): string {
    const colorMap: Record<string, string> = {
      teal: 'text-teal-600',
      green: 'text-green-600',
      blue: 'text-blue-600',
      amber: 'text-amber-600',
    };
    return colorMap[color] || 'text-slate-600';
  }

  getCardBorderClass(color: string): string {
    const classMap: Record<string, string> = {
      blue: 'hover:border-blue-300/50',
      green: 'hover:border-green-300/50',
      amber: 'hover:border-amber-300/50',
      teal: 'hover:border-teal-300/50',
    };
    return classMap[color] || 'hover:border-slate-300/50';
  }

  getCardIconClass(color: string): string {
    const classMap: Record<string, string> = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      amber: 'bg-amber-100',
      teal: 'bg-teal-100',
    };
    return classMap[color] || 'bg-slate-100';
  }

  getCardIconTextClass(color: string): string {
    const classMap: Record<string, string> = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      amber: 'text-amber-600',
      teal: 'text-teal-600',
    };
    return classMap[color] || 'text-slate-600';
  }

  getCTAGradient(): string {
    if (this.userType() === 'funder') {
      return 'from-amber-500 to-amber-600';
    }
    return 'from-teal-500 to-teal-600';
  }
}
