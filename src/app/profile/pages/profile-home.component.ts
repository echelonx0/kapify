// src/app/profile/pages/profile-home.component.ts
import { Component, computed } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowRight, CheckCircle, Clock, AlertTriangle, FileText, Users, Building, DollarSign } from 'lucide-angular';
import { UiCardComponent } from '../../shared/components/ui-card.component';
import { UiButtonComponent } from '../../shared/components/ui-button.component';
import { UiProgressComponent } from '../../shared/components/ui-progress.component';
import { UiStatusBadgeComponent } from '../../shared/components/ui-status-badge.component';
import { ProfileService } from '../profile.service';
import { AuthService } from '../../auth/auth.service';
import { ActivityFeedComponent } from '../../applications/components/activity-feed.component';
import { Activity } from '../../applications/services/activity.service';
import { ThreeDViewerComponent } from '../../shared/components/three_d_viewer.component';

// Legacy activity interface for old mock data (rename to avoid conflict)
interface LegacyActivity {
  id: string;
  type: 'success' | 'info' | 'warning' | 'profile';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

@Component({
  selector: 'app-profile-home',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiCardComponent,
    UiButtonComponent,
    UiProgressComponent,
    UiStatusBadgeComponent,
    ActivityFeedComponent,
    ThreeDViewerComponent,
      RouterModule,  // Add this
  ],
  templateUrl:'profile-home.component.html',
  styles: [`
    .gradient-bg {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    }
    .main-content-area {
      min-height: 400px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    }
  `]
})
export class ProfileHomeComponent {
  // Lucide Icons
  ArrowRightIcon = ArrowRight;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;
  AlertTriangleIcon = AlertTriangle;
  FileTextIcon = FileText;
  UsersIcon = Users;
  BuildingIcon = Building;
  DollarSignIcon = DollarSign;
  threeDModelUrl = '';

  // Computed properties
  completionPercentage = computed(() => this.profileService.completionPercentage());
  completedSteps = computed(() => this.profileService.steps.filter(step => step.completed).length);
  totalSteps = computed(() => this.profileService.steps.length);
  inProgressSteps = computed(() => 1);
  pendingSteps = computed(() => this.totalSteps() - this.completedSteps() - this.inProgressSteps());

  // Conditional content based on user type
  fundingTitle = computed(() => {
    return this.authService.user()?.user?.userType === 'funder' 
      ? 'Total Funding Raised' 
      : 'Total Funding Available';
  });

  fundingAmount = computed(() => {
    return this.authService.user()?.user?.userType === 'funder' 
      ? 'ZAR 1,234,500' 
      : 'ZAR 2,847,500';
  });

  fundingDescription = computed(() => {
    return this.authService.user()?.user?.userType === 'funder' 
      ? 'Successfully funded projects' 
      : 'Available funding opportunities';
  });

  primaryButtonText = computed(() => {
    return this.authService.user()?.user?.userType === 'funder' 
      ? 'View Portfolio' 
      : 'View Opportunities';
  });

  secondaryButtonText = computed(() => {
    return this.authService.user()?.user?.userType === 'funder' 
      ? 'New Investment' 
      : 'Apply Now';
  });

  // Legacy mock data (keeping for reference, but activity feed now uses service data)
  recentActivities: LegacyActivity[] = [
    {
      id: '1',
      type: 'success',
      title: 'Profile section completed',
      description: 'Business documents uploaded successfully',
      timestamp: '2 hours ago',
      icon: 'check'
    },
    {
      id: '2',
      type: 'info',
      title: 'New funding opportunity',
      description: 'Tech Innovation Grant - €50,000 available',
      timestamp: '5 hours ago',
      icon: 'info'
    },
    {
      id: '3',
      type: 'warning',
      title: 'Action required',
      description: 'Complete financial statements section',
      timestamp: '1 day ago',
      icon: 'warning'
    },
    {
      id: '4',
      type: 'profile',
      title: 'Profile viewed',
      description: 'European Investment Fund reviewed your profile',
      timestamp: '2 days ago',
      icon: 'user'
    },
    {
      id: '5',
      type: 'success',
      title: 'Application submitted',
      description: 'SME Growth Fund application submitted',
      timestamp: '3 days ago',
      icon: 'check'
    }
  ];

  benefits = [
    {
      title: 'Better Funding Matches',
      description: 'Get matched with funders that align with your business model and growth stage.'
    },
    {
      title: 'Higher Success Rate',
      description: 'Complete profiles have 3x higher approval rates for funding applications.'
    },
    {
      title: 'Faster Processing',
      description: 'Pre-qualified profiles get priority review and faster funding decisions.'
    },
    {
      title: 'Investor Confidence',
      description: 'Detailed profiles build trust and credibility with potential funders.'
    }
  ];

  subscriptionStatus = {
    planName: 'Basic Plan',
    status: 'Limited Access',
    actionText: 'Upgrade Now'
  };

  constructor(
    public profileService: ProfileService,
    public authService: AuthService,
    private router: Router
  ) {}

  // Event handlers for the NEW activity feed component
  onActivityClicked(activity: Activity): void {
    console.log('Activity clicked:', activity);
    
    // Route to activity details based on fundraising activity type
    switch (activity.type) {
      case 'donation':
        this.router.navigate(['/dashboard/donations', activity.id]);
        break;
      case 'withdrawal':
        this.router.navigate(['/dashboard/withdrawals', activity.id]);
        break;
      case 'campaign':
        this.router.navigate(['/dashboard/campaigns', activity.id]);
        break;
      case 'user':
        if (activity.user?.id) {
          this.router.navigate(['/dashboard/users', activity.user.id]);
        }
        break;
      case 'system':
        this.showActivityDetails(activity);
        break;
      default:
        this.showActivityDetails(activity);
    }
  }

  viewAllActivities(): void {
    this.router.navigate(['/dashboard/activities']);
  }

  private showActivityDetails(activity: Activity): void {
    // For now, just log. Later implement modal or details page
    console.log('Show activity details for:', activity);
    // Could implement a modal service here:
    // this.modalService.openActivityDetails(activity);
  }

  // FIXED NAVIGATION METHODS - Consistent routing
  startProfile() {
    this.router.navigate(['/profile/steps']);
  }

  continueProfile() {
    const currentStepId = this.profileService.currentStepId();
    this.router.navigate(['/profile/steps', currentStepId]);
  }

  reviewProfile() {
    this.router.navigate(['/profile/steps']);
  }

  viewAllSteps() {
    this.router.navigate(['/profile/steps']);
  }

  goToStep(stepId: string) {
    this.router.navigate(['/profile/steps', stepId]);
  }

  getProfileButtonText(): string {
    if (this.completionPercentage() === 0) {
      return 'Start Your Profile';
    } else if (this.completionPercentage() < 100) {
      return 'Continue Profile';
    } else {
      return 'Review Complete Profile';
    }
  }

  // Legacy activity methods (for any remaining old activity displays)
  getActivityIconClasses(type: string): string {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0';
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-100 text-green-600`;
      case 'info':
        return `${baseClasses} bg-blue-100 text-blue-600`;
      case 'warning':
        return `${baseClasses} bg-orange-100 text-orange-600`;
      case 'profile':
        return `${baseClasses} bg-purple-100 text-purple-600`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`;
    }
  }

  getActivityIcon(type: string): any {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'info':
        return FileText;
      case 'warning':
        return AlertTriangle;
      case 'profile':
        return Users;
      default:
        return Clock;
    }
  }

  // Step methods
  isCurrentStep(stepId: string): boolean {
    return this.profileService.currentStepId() === stepId;
  }

  getStepIconClasses(step: any): string {
    const baseClasses = 'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0';
    
    if (step.completed) {
      return `${baseClasses} bg-green-500`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-blue-500 text-white`;
    } else {
      return `${baseClasses} bg-gray-200 text-gray-600`;
    }
  }

  getStepIcon(stepId: string): any {
    const icons: { [key: string]: any } = {
      'admin': Building,
      'documents': FileText,
      'business-review': Building,
      'swot': AlertTriangle,
      'management': Users,
      'business-plan': FileText,
      'financial': DollarSign
    };
    return icons[stepId] || FileText;
  }

  getStepDescription(stepId: string): string {
    const descriptions: { [key: string]: string } = {
      'admin': 'Company registration & legal structure',
      'documents': 'Upload business documents',
      'business-review': 'Operations & market position',
      'swot': 'Strengths & opportunities analysis',
      'management': 'Leadership team details',
      'business-plan': 'Strategic planning & projections',
      'financial': 'Financial statements & metrics'
    };
    return descriptions[stepId] || 'Complete this section';
  }

  getStepStatusText(step: any): string {
    if (step.completed) {
      return 'Complete';
    } else if (this.isCurrentStep(step.id)) {
      return 'Current';
    } else {
      return 'Pending';
    }
  }

  getStepStatusColor(step: any): 'success' | 'primary' | 'warning' {
    if (step.completed) {
      return 'success';
    } else if (this.isCurrentStep(step.id)) {
      return 'primary';
    } else {
      return 'warning';
    }
  }

  // FIXED ACTION METHODS - Revenue-focused routing
  viewOpportunities() {
    if (this.authService.user()?.user?.userType === 'funder') {
      this.router.navigate(['/dashboard/portfolio']);
    } else {
      this.router.navigate(['/funding-opportunities']);
    }
  }

  primaryAction() {
    if (this.authService.user()?.user?.userType === 'funder') {
      this.router.navigate(['/funder-dashboard']);
    } else {
      this.router.navigate(['/applications']);
    }
  }

  upgradeSubscription() {
    this.router.navigate(['/dashboard/subscription']);
  }

  requestHelp() {
    this.router.navigate(['/dashboard/support']);
  }
}