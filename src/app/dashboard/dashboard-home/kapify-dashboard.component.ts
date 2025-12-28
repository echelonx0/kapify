// import {
//   Component,
//   signal,
//   computed,
//   OnInit,
//   OnDestroy,
//   inject,
//   ChangeDetectionStrategy,
// } from '@angular/core';
// import { Router } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Subject, takeUntil } from 'rxjs';
// import {
//   LucideAngularModule,
//   FileText,
//   Clock,
//   TrendingUp,
//   DollarSign,
//   Plus,
//   Filter,
//   Eye,
//   Search,
//   X,
//   BookOpen,
//   Users,
//   Target,
//   CheckCircle,
//   ArrowRight,
//   Lightbulb,
//   Shield,
//   Zap,
//   BarChart3,
//   FolderOpen,
//   Home,
//   ChevronDown,
// } from 'lucide-angular';
// import {
//   RightPanelContent,
//   RightPanelComponent,
// } from '../components/right-panel.component';

// import { ProfileManagementService } from 'src/app/shared/services/profile-management.service';
// import { AuthService } from 'src/app/auth/production.auth.service';
// import { FunderOnboardingService } from 'src/app/funder/services/funder-onboarding.service';
// import { OpportunityManagementService } from 'src/app/funder/services/opportunity-management.service';
// import {
//   PrimaryCTACardComponent,
//   CTAContent,
// } from '../components/cta-card/cta-card.component';
// import { OrganizationStatusOverviewComponent } from '../components/status-overview/status-overview.component';

// interface OnboardingCard {
//   id: string;
//   title: string;
//   description: string;
//   icon: any;
//   type: 'info' | 'action' | 'feature';
//   actionText?: string;
//   actionRoute?: string;
//   rightPanelContent?: RightPanelContent;
//   completed?: boolean;
//   color: string;
// }

// @Component({
//   selector: 'app-kapify-dashboard',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     LucideAngularModule,
//     RightPanelComponent,
//     PrimaryCTACardComponent,
//     OrganizationStatusOverviewComponent,
//   ],
//   templateUrl: './kapify-dashboard.component.html',
//   styleUrl: './kapify-dashboard.component.css',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class KapifyDashboard implements OnInit, OnDestroy {
//   private router = inject(Router);
//   private profileService = inject(ProfileManagementService);
//   private authService = inject(AuthService);
//   private onboardingService = inject(FunderOnboardingService);
//   private managementService = inject(OpportunityManagementService);
//   private destroy$ = new Subject<void>();

//   // Icons
//   FileTextIcon = FileText;
//   ClockIcon = Clock;
//   TrendingUpIcon = TrendingUp;
//   DollarSignIcon = DollarSign;
//   PlusIcon = Plus;
//   FilterIcon = Filter;
//   EyeIcon = Eye;
//   SearchIcon = Search;
//   XIcon = X;
//   BookOpenIcon = BookOpen;
//   UsersIcon = Users;
//   TargetIcon = Target;
//   CheckCircleIcon = CheckCircle;
//   ArrowRightIcon = ArrowRight;
//   LightbulbIcon = Lightbulb;
//   ShieldIcon = Shield;
//   ZapIcon = Zap;
//   BarChart3Icon = BarChart3;
//   FolderOpenIcon = FolderOpen;
//   HomeIcon = Home;
//   ChevronDownIcon = ChevronDown;

//   // State Signals
//   isLoading = signal(false);
//   rightPanelContent = signal<RightPanelContent>('activity-inbox');
//   currentUser = computed(() => this.profileService.currentUser());
//   userType = computed(() => this.authService.user()?.userType || 'sme');
//   isMobilePanelOpen = signal(false);

//   // Analytics state
//   analytics = signal<any>(null);
//   recentOpportunities = signal<any[]>([]);
//   onboardingState = signal<any>(null);

//   // SME-specific onboarding content
//   private smeOnboardingData: OnboardingCard[] = [
//     {
//       id: 'complete-profile',
//       title: 'Complete Your Business Profile',
//       description:
//         'Add your business details, financial information, and documentation to increase your chances of securing funding.',
//       icon: Target,
//       type: 'action',
//       actionText: 'Complete Profile',
//       actionRoute: '/profile/business',
//       color: 'teal',
//     },
//     {
//       id: 'how-it-works',
//       title: 'How Kapify Works',
//       description:
//         'Learn how to navigate the platform, submit applications, and connect with the right funders for your business.',
//       icon: BookOpen,
//       type: 'info',
//       actionText: 'Learn More',
//       rightPanelContent: 'how-it-works',
//       color: 'blue',
//     },
//   ];

//   // Funder-specific onboarding content
//   private funderOnboardingData: OnboardingCard[] = [
//     {
//       id: 'setup-organization',
//       title: 'Complete Organization Setup',
//       description:
//         'Add your organization details, funding criteria, and verification documents to start receiving applications.',
//       icon: Shield,
//       type: 'action',
//       actionText: 'Setup Organization',
//       actionRoute: '/funder/onboarding',
//       color: 'teal',
//     },
//     {
//       id: 'how-it-works-funder',
//       title: 'How Kapify Works for Funders',
//       description:
//         'Learn how to create opportunities, review applications, and connect with qualified businesses seeking funding.',
//       icon: BookOpen,
//       type: 'info',
//       actionText: 'Learn More',
//       rightPanelContent: 'how-it-works',
//       color: 'blue',
//     },
//     {
//       id: 'create-opportunity',
//       title: 'Create Your First Opportunity',
//       description:
//         'Define your funding criteria, set application requirements, and publish your first funding opportunity to the platform.',
//       icon: Plus,
//       type: 'action',
//       actionText: 'Create Opportunity',
//       actionRoute: '/funding/create-opportunity',
//       color: 'green',
//     },
//     {
//       id: 'manage-criteria',
//       title: 'Set Funding Preferences',
//       description:
//         'Configure your investment focus, preferred sectors, business stages, and funding amounts to receive relevant matches.',
//       icon: Target,
//       type: 'action',
//       actionText: 'Manage Preferences',
//       actionRoute: '/funder/preferences',
//       color: 'amber',
//     },
//   ];

//   // Dynamically compute cards based on user type
//   onboardingCards = computed(() =>
//     this.userType() === 'funder'
//       ? this.funderOnboardingData
//       : this.smeOnboardingData
//   );

//   // Computed CTA content for the component
//   ctaContent = computed<CTAContent>(() => {
//     if (this.userType() === 'funder') {
//       return {
//         title: 'Credit-Based Platform Access',
//         description:
//           'Kapify uses a flexible credit system. Purchase credits as you need them and use them to unlock premium features, post opportunities, and access detailed analytics. No subscriptions, no commitments.',
//         buttonText: 'Learn About Credits',
//         icon: Zap,
//         gradient: 'amber',
//       };
//     }
//     return {
//       title: 'Become a Kapify Executive',
//       description:
//         'Share your expertise with emerging businesses. Join our executive network to provide strategic guidance, mentorship, and funding advice to startups and SMEs across South Africa.',
//       buttonText: 'Explore Executive Program',
//       icon: Lightbulb,
//       gradient: 'teal',
//     };
//   });

//   // Computed stats based on user type
//   statsCards = computed(() => {
//     if (this.userType() === 'funder') {
//       const analytics = this.analytics();
//       return [
//         {
//           id: 'active-opportunities',
//           label: 'Active Opportunities',
//           value: this.getActiveOpportunitiesCount(),
//           icon: FolderOpen,
//           color: 'teal' as const,
//           description: 'Currently open for applications',
//         },
//         {
//           id: 'total-applications',
//           label: 'Total Applications',
//           value: this.formatNumber(analytics?.totalApplications || 0),
//           icon: FileText,
//           color: 'blue' as const,
//           description: 'Applications received to date',
//         },
//         {
//           id: 'acceptance-rate',
//           label: 'Acceptance Rate',
//           value: `${(analytics?.averageConversionRate || 0).toFixed(1)}%`,
//           icon: TrendingUp,
//           color: 'green' as const,
//           description: 'Application approval percentage',
//         },
//         {
//           id: 'total-views',
//           label: 'Profile Views',
//           value: this.formatNumber(analytics?.totalViews || 0),
//           icon: Eye,
//           color: 'amber' as const,
//           description: 'Total opportunity impressions',
//         },
//       ];
//     }

//     return [
//       {
//         id: 'funders',
//         label: 'Active Funders',
//         value: '250+',
//         icon: Users,
//         color: 'teal' as const,
//         description: 'Organizations offering funding',
//       },
//       {
//         id: 'opportunities',
//         label: 'Open Opportunities',
//         value: '180+',
//         icon: FolderOpen,
//         color: 'blue' as const,
//         description: 'Available funding options',
//       },
//       {
//         id: 'success-rate',
//         label: 'Success Rate',
//         value: '87%',
//         icon: TrendingUp,
//         color: 'green' as const,
//         description: 'Platform funding success rate',
//       },
//       {
//         id: 'total-funded',
//         label: 'Total Funded',
//         value: 'R2.4B',
//         icon: DollarSign,
//         color: 'amber' as const,
//         description: 'Capital deployed via Kapify',
//       },
//     ];
//   });

//   ngOnInit(): void {
//     this.loadProfileData();
//     this.loadOrgID();
//     this.setupSubscriptions();
//     this.loadDashboardData();
//   }

//   loadOrgID() {
//     this.authService.getCurrentUserOrganizationId();
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   private loadProfileData(): void {
//     if (!this.currentUser()) {
//       this.profileService.loadProfileData().subscribe({
//         error: (error) => console.error('Failed to load profile data:', error),
//       });
//     }
//   }

//   private setupSubscriptions(): void {
//     if (this.userType() === 'funder') {
//       this.onboardingService.onboardingState$
//         .pipe(takeUntil(this.destroy$))
//         .subscribe((state) => {
//           this.onboardingState.set(state);
//         });

//       this.managementService.analytics$
//         .pipe(takeUntil(this.destroy$))
//         .subscribe((analytics) => {
//           this.analytics.set(analytics);
//         });

//       this.managementService.opportunities$
//         .pipe(takeUntil(this.destroy$))
//         .subscribe((opportunities) => {
//           this.recentOpportunities.set(opportunities.slice(0, 5));
//         });
//     }
//   }

//   private loadDashboardData(): void {
//     if (this.userType() === 'funder') {
//       this.onboardingService.checkOnboardingStatus().subscribe();
//       this.managementService.loadAnalytics().subscribe();
//       this.managementService.loadUserOpportunities().subscribe();
//     }
//   }

//   // Analytics Methods
//   getActiveOpportunitiesCount(): number {
//     return this.recentOpportunities().filter((opp) => opp.status === 'active')
//       .length;
//   }

//   formatNumber(num: number): string {
//     return new Intl.NumberFormat('en-ZA').format(num);
//   }

//   formatCurrency(amount: number): string {
//     return new Intl.NumberFormat('en-ZA', {
//       style: 'currency',
//       currency: 'ZAR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0,
//     }).format(amount);
//   }

//   // Mobile panel management
//   toggleMobilePanel(): void {
//     this.isMobilePanelOpen.set(!this.isMobilePanelOpen());
//   }

//   // Stat card click handler
//   handleStatClick(statId: string): void {
//     if (this.userType() === 'funder') {
//       switch (statId) {
//         case 'active-opportunities':
//           this.router.navigate(['/funder/dashboard'], {
//             queryParams: { tab: 'opportunities' },
//           });
//           break;
//         case 'total-applications':
//           this.router.navigate(['/funder/dashboard'], {
//             queryParams: { tab: 'applications' },
//           });
//           break;
//         case 'acceptance-rate':
//         case 'total-views':
//           console.log(`Clicked on stat: ${statId}`);
//           break;
//       }
//     }
//   }

//   // Navigation Actions
//   handleCardAction(card: OnboardingCard): void {
//     if (card.rightPanelContent) {
//       this.rightPanelContent.set(card.rightPanelContent);
//       if (window.innerWidth < 1024) {
//         this.isMobilePanelOpen.set(true);
//       }
//     } else if (card.actionRoute) {
//       this.router.navigate([card.actionRoute]);
//     }
//   }

//   // CTA Card action handler
//   handleCTAClick(): void {
//     const route =
//       this.userType() === 'funder'
//         ? '/finance/credit-info'
//         : '/executive-application-form';
//     this.router.navigate([route]);
//   }

//   onRightPanelContentChange(content: RightPanelContent): void {
//     this.rightPanelContent.set(content);
//   }

//   createOpportunity(): void {
//     if (this.userType() === 'funder') {
//       this.router.navigate(['/funding/create-opportunity']);
//     }
//   }

//   viewAllOpportunities(): void {
//     if (this.userType() === 'funder') {
//       this.router.navigate(['/funder/dashboard'], {
//         queryParams: { tab: 'opportunities' },
//       });
//     }
//   }

//   openHelpCenter(): void {
//     this.rightPanelContent.set('how-it-works');
//     if (window.innerWidth < 1024) {
//       this.isMobilePanelOpen.set(true);
//     }
//   }

//   contactSupport(): void {
//     console.log('Contact support clicked');
//   }

//   // Card styling utility methods
//   getStatCardIconBg(color: string): string {
//     const colorMap: Record<string, string> = {
//       teal: 'bg-teal-100',
//       green: 'bg-green-100',
//       blue: 'bg-blue-100',
//       amber: 'bg-amber-100',
//     };
//     return colorMap[color] || 'bg-slate-100';
//   }

//   getStatCardIconColor(color: string): string {
//     const colorMap: Record<string, string> = {
//       teal: 'text-teal-600',
//       green: 'text-green-600',
//       blue: 'text-blue-600',
//       amber: 'text-amber-600',
//     };
//     return colorMap[color] || 'text-slate-600';
//   }

//   getCardBorderClass(color: string): string {
//     const classMap: Record<string, string> = {
//       blue: 'hover:border-blue-300',
//       green: 'hover:border-green-300',
//       amber: 'hover:border-amber-300',
//       teal: 'hover:border-teal-300',
//     };
//     return classMap[color] || 'hover:border-slate-300';
//   }

//   getCardIconClass(color: string): string {
//     const classMap: Record<string, string> = {
//       blue: 'bg-blue-100',
//       green: 'bg-green-100',
//       amber: 'bg-amber-100',
//       teal: 'bg-teal-100',
//     };
//     return classMap[color] || 'bg-slate-100';
//   }

//   getCardIconTextClass(color: string): string {
//     const classMap: Record<string, string> = {
//       blue: 'text-blue-600',
//       green: 'text-green-600',
//       amber: 'text-amber-600',
//       teal: 'text-teal-600',
//     };
//     return classMap[color] || 'text-slate-600';
//   }

//   //   // Greeting message based on time of day
//   getGreetingMessage(): string {
//     const hour = new Date().getHours();
//     const userTypeText =
//       this.userType() === 'funder' ? 'funder' : 'entrepreneur';

//     if (hour < 12) {
//       return `Good morning! Ready to make progress today?`;
//     } else if (hour < 18) {
//       return `Good afternoon! Let's keep the momentum going.`;
//     } else {
//       return `Good evening! Time to review today's achievements.`;
//     }
//   }
// }

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
import {
  RightPanelContent,
  RightPanelComponent,
} from '../components/right-panel.component';

import { ProfileManagementService } from 'src/app/shared/services/profile-management.service';
import { AuthService } from 'src/app/auth/production.auth.service';
import { FunderOnboardingService } from 'src/app/funder/services/funder-onboarding.service';
import { OpportunityManagementService } from 'src/app/funder/services/opportunity-management.service';
import {
  PrimaryCTACardComponent,
  CTAContent,
} from '../components/cta-card/cta-card.component';
import {
  OrganizationStatusOverviewComponent,
  ActionEvent,
} from '../components/status-overview/status-overview.component';

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
    PrimaryCTACardComponent,
    OrganizationStatusOverviewComponent,
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
        title: 'Credit-Based Platform Access',
        description:
          'Kapify uses a flexible credit system. Purchase credits as you need them and use them to unlock premium features, post opportunities, and access detailed analytics. No subscriptions, no commitments.',
        buttonText: 'Learn About Credits',
        icon: Zap,
        gradient: 'amber',
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

  ngOnInit(): void {
    this.loadProfileData();
    this.loadOrgID();
    this.setupSubscriptions();
    this.loadDashboardData();
  }

  loadOrgID() {
    this.authService.getCurrentUserOrganizationId();
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
        this.router.navigate(['/funder/profile']);
        break;
      case 'share_profile':
        console.log('Share profile clicked');
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

  // CTA Card action handler
  handleCTAClick(): void {
    const route =
      this.userType() === 'funder'
        ? '/finance/credit-info'
        : '/executive-application-form';
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
      this.router.navigate(['/funder/dashboard'], {
        queryParams: { tab: 'opportunities' },
      });
    }
  }

  openHelpCenter(): void {
    this.rightPanelContent.set('how-it-works');
    if (window.innerWidth < 1024) {
      this.isMobilePanelOpen.set(true);
    }
  }

  contactSupport(): void {
    console.log('Contact support clicked');
  }

  // Greeting message based on time of day
  getGreetingMessage(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return `Good morning! Ready to make progress today?`;
    } else if (hour < 18) {
      return `Good afternoon! Let's keep the momentum going.`;
    } else {
      return `Good evening! Time to review today's achievements.`;
    }
  }
}
