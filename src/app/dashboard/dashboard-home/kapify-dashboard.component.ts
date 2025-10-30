// kapify-dashboard.component.ts (Updated with User Type Logic)
import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
} from 'lucide-angular';
import { UiButtonComponent } from '../../shared/components';
import {
  RightPanelContent,
  RightPanelComponent,
} from '../components/right-panel.component';
import { ProfileManagementService } from 'src/app/shared/services/profile-management.service';
import { AuthService } from 'src/app/auth/production.auth.service';

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
    UiButtonComponent,
    RightPanelComponent,
  ],
  templateUrl: './kapify-dashboard.component.html',
  styles: [
    `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class KapifyDashboard implements OnInit {
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

  // State
  isLoading = signal(false);
  rightPanelContent = signal<RightPanelContent>('activity-inbox');
  currentUser = computed(() => this.profileService.currentUser());
  userType = computed(() => this.authService.user()?.userType || 'sme');

  private profileService = inject(ProfileManagementService);
  private authService = inject(AuthService);

  // SME-specific onboarding content
  private smeOnboardingData: OnboardingCard[] = [
    {
      id: 'how-it-works',
      title: 'How Kapify Works',
      description:
        'Complete your profile, get matched with suitable organisations, and with kapify intelligent assist.',
      icon: this.BookOpenIcon,
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
      icon: this.DollarSignIcon,
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
      icon: this.BookOpenIcon,
      type: 'info',
      actionText: 'Learn the Process',
      rightPanelContent: 'how-it-works',
      color: 'blue',
    },
    // {
    //   id: 'review-applications',
    //   title: 'Review Applications',
    //   description:
    //     'Access a pipeline of pre-screened businesses that match your investment criteria and funding focus.',
    //   icon: this.FileTextIcon,
    //   type: 'action',
    //   actionText: 'View Your Opportunities',
    //   actionRoute: '/funding/opportunities',
    //   color: 'purple',
    // },
    {
      id: 'manage-criteria',
      title: 'Set Funding Criteria',
      description:
        'Define your investment preferences, funding amounts, sectors, and business stages to receive relevant matches.',
      icon: this.TargetIcon,
      type: 'action',
      actionText: 'Manage Profile',
      actionRoute: '/funder/dashboard',
      color: 'orange',
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
      };
    }
    return {
      title: 'Explore Kapify Executive',
      description:
        'You can make yourself available to advice startups and SMEs looking for guidance on funding and growth strategies.',
      buttonText: 'Start a Subscription to explore Kapify Executive',
      route: '/subscriptions/executive',
    };
  });

  constructor(private router: Router) {}

  ngOnInit() {
    // Load profile data if not already loaded
    if (!this.currentUser()) {
      const user = this.authService.user();
      this.profileService.loadProfileData().subscribe({
        error: (error) => {
          console.error('Failed to load profile data:', error);
        },
      });
    }
  }

  // Computed properties for stats (different for SME vs Funder)
  stats = computed(() => {
    if (this.userType() === 'funder') {
      return {
        total: 0, // Applications reviewed
        businesses: 1240, // Active businesses seeking funding
        avgDealSize: 1.2, // Million ZAR
        successRate: 87, // Match success rate
      };
    }
    return {
      total: 0, // Applications submitted
      funders: 250, // Active funders on platform
      successRate: 87, // Platform success rate
      totalFunded: 2.4, // Billion ZAR funded through platform
    };
  });

  // Actions
  learnMore() {
    this.router.navigate(['/how-it-works']);
  }

  startApplication() {
    const route = this.ctaContent().route;
    this.router.navigate([route]);
  }

  handleCardAction(card: OnboardingCard) {
    if (card.rightPanelContent) {
      this.rightPanelContent.set(card.rightPanelContent);
    } else if (card.actionRoute) {
      this.router.navigate([card.actionRoute]);
    }
  }

  onRightPanelContentChange(content: RightPanelContent) {
    this.rightPanelContent.set(content);
  }

  // Utility methods for card styling
  getCardBorderClass(color: string): string {
    const classMap: Record<string, string> = {
      blue: 'hover:border-blue-200',
      green: 'hover:border-green-200',
      purple: 'hover:border-purple-200',
      orange: 'hover:border-orange-200',
      yellow: 'hover:border-yellow-200',
    };
    return classMap[color] || 'hover:border-gray-200';
  }
  navigate() {
    this.router.navigate(['/funder/onboarding/welcome']);
  }
  getCardIconClass(color: string): string {
    const classMap: Record<string, string> = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      purple: 'bg-purple-100',
      orange: 'bg-orange-100',
      yellow: 'bg-yellow-100',
    };
    return classMap[color] || 'bg-gray-100';
  }

  getCardIconTextClass(color: string): string {
    const classMap: Record<string, string> = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      yellow: 'text-yellow-600',
    };
    return classMap[color] || 'text-gray-600';
  }

  formatTotalFunded(): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(2400000000);
  }
}
