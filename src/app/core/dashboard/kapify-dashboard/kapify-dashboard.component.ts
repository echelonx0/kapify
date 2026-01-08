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
  Eye,
  Search,
  X,
  BookOpen,
  Users,
  Target,
  ArrowRight,
  Lightbulb,
  Shield,
  Zap,
  FolderOpen,
  Home,
  ChevronDown,
  CircleQuestionMark,
  ChartColumn,
  CircleCheckBig,
  Funnel,
  MessageSquare,
} from 'lucide-angular';
import {
  RightPanelContent,
  RightPanelComponent,
} from '../components/right-panel.component';

import { ProfileManagementService } from 'src/app/shared/services/profile-management.service';
import { AuthService } from 'src/app/auth/services/production.auth.service';
import { FunderOnboardingService } from 'src/app/funder/services/funder-onboarding.service';
import { OpportunityManagementService } from 'src/app/funder/services/opportunity-management.service';
import {
  // PrimaryCTACardComponent,
  CTAContent,
  PrimaryCTACardComponent,
} from '../components/cta-card/cta-card.component';
import {
  OrganizationStatusOverviewComponent,
  ActionEvent,
} from '../components/status-overview/status-overview.component';
import { SupportModalComponent } from 'src/app/features/support/support.modal';

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

@Component({
  selector: 'app-kapify-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    RightPanelComponent,
    // PrimaryCTACardComponent,
    OrganizationStatusOverviewComponent,
    SupportModalComponent,
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
  showSupportModal = signal(false);
  // Icons
  FileTextIcon = FileText;
  ClockIcon = Clock;
  TrendingUpIcon = TrendingUp;
  DollarSignIcon = DollarSign;
  PlusIcon = Plus;
  FilterIcon = Funnel;
  EyeIcon = Eye;
  SearchIcon = Search;
  XIcon = X;
  BookOpenIcon = BookOpen;
  UsersIcon = Users;
  TargetIcon = Target;
  CheckCircleIcon = CircleCheckBig;
  ArrowRightIcon = ArrowRight;
  LightbulbIcon = Lightbulb;
  ShieldIcon = Shield;
  ZapIcon = Zap;
  BarChart3Icon = ChartColumn;
  FolderOpenIcon = FolderOpen;
  HomeIcon = Home;
  ChevronDownIcon = ChevronDown;
  HelpCircleIcon = CircleQuestionMark;
  MessageSquareIcon = MessageSquare;
  // State Signals
  isLoading = signal(false);
  rightPanelContent = signal<RightPanelContent>('activity-inbox');
  currentUser = computed(() => this.profileService.currentUser());
  userType = computed(() => this.authService.user()?.userType || 'sme');
  isMobilePanelOpen = signal(false);

  // Analytics state
  analytics = signal<any>(null);
  recentOpportunities = signal<any[]>([]);
  onboardingState = signal<any>(null);

  // SME-specific onboarding content
  private smeOnboardingData: OnboardingCard[] = [
    {
      id: 'complete-profile',
      title: 'Complete Your Business Profile',
      description:
        'Add your business details, financial information, and documentation to increase your chances of securing funding.',
      icon: Target,
      type: 'action',
      actionText: 'Complete Profile',
      actionRoute: '/profile/business',
      color: 'teal',
    },
    {
      id: 'how-it-works',
      title: 'How Kapify Works',
      description:
        'Learn how to navigate the platform, submit applications, and connect with the right funders for your business.',
      icon: BookOpen,
      type: 'info',
      actionText: 'Learn More',
      rightPanelContent: 'how-it-works',
      color: 'blue',
    },
  ];

  // Funder-specific onboarding content
  private funderOnboardingData: OnboardingCard[] = [
    {
      id: 'setup-organization',
      title: 'Complete Organization Setup',
      description:
        'Add your organization details, funding criteria, and verification documents to start receiving applications.',
      icon: Shield,
      type: 'action',
      actionText: 'Setup Organization',
      actionRoute: '/funder/onboarding',
      color: 'teal',
    },
    {
      id: 'how-it-works-funder',
      title: 'How Kapify Works for Funders',
      description:
        'Learn how to create opportunities, review applications, and connect with qualified businesses seeking funding.',
      icon: BookOpen,
      type: 'info',
      actionText: 'Learn More',
      rightPanelContent: 'how-it-works',
      color: 'blue',
    },
    {
      id: 'create-opportunity',
      title: 'Create Your First Opportunity',
      description:
        'Define your funding criteria, set application requirements, and publish your first funding opportunity to the platform.',
      icon: Plus,
      type: 'action',
      actionText: 'Create Opportunity',
      actionRoute: '/funding/create-opportunity',
      color: 'green',
    },
    {
      id: 'manage-criteria',
      title: 'Set Funding Preferences',
      description:
        'Configure your investment focus, preferred sectors, business stages, and funding amounts to receive relevant matches.',
      icon: Target,
      type: 'action',
      actionText: 'Manage Preferences',
      actionRoute: '/funder/preferences',
      color: 'amber',
    },
  ];

  // Dynamically compute cards based on user type
  onboardingCards = computed(() =>
    this.userType() === 'funder'
      ? this.funderOnboardingData
      : this.smeOnboardingData
  );

  // Computed CTA content for the component
  ctaContent = computed<CTAContent>(() => {
    if (this.userType() === 'funder') {
      return {
        title: 'Business valuation',
        description:
          'Kapify can help you get a professional eveluation of your business.',
        buttonText: 'Learn About Kapify Valuation service',
        icon: Zap,
        gradient: 'slate',
      };
    }
    return {
      title: 'Become a Kapify Executive',
      description:
        'Share your expertise with emerging businesses. Join our executive network to provide strategic guidance, mentorship, and funding advice to startups and SMEs across South Africa.',
      buttonText: 'Explore Executive Program',
      icon: Lightbulb,
      gradient: 'teal',
    };
  });
  constructor() {
    window.addEventListener('closeSupport', () => {
      this.showSupportModal.set(false);
    });
  }
  ngOnInit(): void {
    this.loadProfileData();
    this.loadOrgID();
    this.setupSubscriptions();
    this.loadDashboardData();
  }

  loadOrgID() {
    this.authService.getCurrentUserOrganizationId();
  }
  // ADD THIS METHOD
  openSupport(): void {
    this.showSupportModal.set(true);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('closeSupport', () => {}); // Clean up
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

  // Organization status action handler
  handleOrganizationAction(event: ActionEvent): void {
    switch (event.type) {
      case 'complete_setup':
      case 'edit_organization':
        this.router.navigate(['/funder/onboarding']);
        break;
      case 'get_verified':
        console.log('Request verification clicked');
        // Add verification request logic here
        break;
      case 'manage_public_profile':
        this.router.navigate(['/funder/create-profile']);
        break;

        // Add share profile logic here
        break;
    }
  }

  // Mobile panel management
  toggleMobilePanel(): void {
    this.isMobilePanelOpen.set(!this.isMobilePanelOpen());
  }

  // Navigation Actions
  handleCardAction(card: OnboardingCard): void {
    if (card.rightPanelContent) {
      this.rightPanelContent.set(card.rightPanelContent);
      if (window.innerWidth < 1024) {
        this.isMobilePanelOpen.set(true);
      }
    } else if (card.actionRoute) {
      this.router.navigate([card.actionRoute]);
    }
  }

  viewFAQs(): void {
    this.router.navigate(['/dashboard/faqs']);
  }

  // CTA Card action handler
  handleCTAClick(): void {
    // const route =
    //   this.userType() === 'funder'
    //     ? '/finance/credit-info'
    //     : '/executive-application-form';
    // this.router.navigate([route]);
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
      this.router.navigate(['/funder/dashboard'], {
        queryParams: { tab: 'opportunities' },
      });
    }
  }
  viewGuides(): void {
    this.router.navigate(['/dashboard/guides']);
  }

  goToProfile(): void {
    if (this.userType() === 'funder') {
      this.router.navigate(['/funder/onboarding'], {
        queryParams: { tab: 'opportunities' },
      });
    } else {
      this.router.navigate(['/profile']);
    }
  }

  openHelpCenter(): void {
    this.rightPanelContent.set('how-it-works');
    if (window.innerWidth < 1024) {
      this.isMobilePanelOpen.set(true);
    }
  }

  // Greeting message based on time of day
  getGreetingMessage(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good morning. Capitalise on momentum and meaningful opportunity.';
    } else if (hour < 18) {
      return 'Good afternoon. Turning capital into impact requires clarity and intent.';
    } else {
      return 'Good evening. Measured capital decisions define long-term success.';
    }
  }
}
