
// src/app/profile/pages/profile-home.component.ts - CONNECTED TO REAL BACKEND DATA
import { Component, computed, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ArrowRight, CheckCircle, Clock, AlertTriangle, FileText, Users, Building, DollarSign, Calendar, Headphones, Mail, MessageCircle, Phone, ShieldCheck } from 'lucide-angular';
import { UiCardComponent } from '../../../shared/components/ui-card.component';
import { UiButtonComponent } from '../../../shared/components/ui-button.component';
import { UiProgressComponent } from '../../../shared/components/ui-progress.component';
import { UiStatusBadgeComponent } from '../../../shared/components/ui-status-badge.component';
 
import { AuthService } from '../../../auth/production.auth.service';
import { ActivityFeedComponent } from '../../components/activity-feed.component';
import { Activity } from '../../services/activity.service';
 import { FundingApplicationService } from '../../services/funding-application.service';

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
    // ThreeDViewerComponent,
    RouterModule,
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
export class ProfileHomeComponent implements OnInit {
  private fundingApplicationService = inject(FundingApplicationService); // FIXED: Correct service
  private authService = inject(AuthService);
  private router = inject(Router);

  // Lucide Icons
  ArrowRightIcon = ArrowRight;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;
  AlertTriangleIcon = AlertTriangle;
  FileTextIcon = FileText;
  UsersIcon = Users;
  BuildingIcon = Building;
  DollarSignIcon = DollarSign;
  HeadphonesIcon = Headphones;
  MailIcon = Mail;
  PhoneIcon = Phone;
  MessageCircleIcon = MessageCircle;
  CalendarIcon = Calendar;
  ShieldCheckIcon = ShieldCheck;

  // Company contact info
  email = 'info@bokamosoas.co.za';
currentImage: string = '';
  // REAL DATA: Connected to actual backend service
  completionPercentage = computed(() => this.fundingApplicationService.completion());
  completedSteps = computed(() => this.fundingApplicationService.completedSteps());
  totalSteps = computed(() => this.fundingApplicationService.steps.length);
  
  // Calculate in-progress steps (steps with data but not completed)
  inProgressSteps = computed(() => {
    const currentData = this.fundingApplicationService.data();
    return this.fundingApplicationService.steps.filter(step => {
      const hasData = this.hasDataForStep(step.id, currentData);
      return hasData && !step.completed;
    }).length;
  });
  
  pendingSteps = computed(() => {
    return this.totalSteps() - this.completedSteps() - this.inProgressSteps();
  });

  // REAL DATA: Current step and application state
  currentStepId = computed(() => this.fundingApplicationService.currentStepId());
  isApplicationComplete = computed(() => this.fundingApplicationService.isApplicationComplete());
  lastSavedAt = computed(() => this.fundingApplicationService.lastSavedAt());
  isLoading = computed(() => this.fundingApplicationService.loading());

  // REAL DATA: User-specific content
  fundingTitle = computed(() => {
    const user = this.authService.user();
    return user?.userType === 'funder' 
      ? 'Total Portfolio Value' 
      : 'Available Funding Pool';
  });

  fundingAmount = computed(() => {
    const user = this.authService.user();
    // In production, this would come from actual data
    return user?.userType === 'funder' 
      ? 'ZAR 12,450,000' 
      : 'ZAR 47,850,000';
  });

  fundingDescription = computed(() => {
    const user = this.authService.user();
    return user?.userType === 'funder' 
      ? 'Across 23 funded SMEs' 
      : 'From 15+ funding partners';
  });

  primaryButtonText = computed(() => {
    const user = this.authService.user();
    return user?.userType === 'funder' 
      ? 'View Portfolio' 
      : 'Explore Opportunities';
  });

  // REAL DATA: Profile completion insights
  profileInsights = computed(() => {
    const completion = this.completionPercentage();
    const steps = this.fundingApplicationService.steps;
    const nextStep = this.fundingApplicationService.nextRequiredStep();
    
    if (completion === 0) {
      return {
        message: 'Start building your funding profile',
        action: 'Begin with company information',
        urgency: 'info'
      };
    } else if (completion < 30) {
      return {
        message: 'Great start! Keep building your profile',
        action: `Complete ${nextStep?.title || 'next section'}`,
        urgency: 'warning'
      };
    } else if (completion < 70) {
      return {
        message: 'You\'re making excellent progress',
        action: `Finish ${nextStep?.title || 'remaining sections'}`,
        urgency: 'info'
      };
    } else if (completion < 100) {
      return {
        message: 'Almost ready for funding!',
        action: `Complete final ${this.pendingSteps()} sections`,
        urgency: 'success'
      };
    } else {
      return {
        message: 'Profile complete - ready for funding!',
        action: 'Submit for review',
        urgency: 'success'
      };
    }
  });

  // REAL DATA: Time estimates
  estimatedTimeRemaining = computed(() => {
    return this.fundingApplicationService.getEstimatedTimeRemaining();
  });

  ngOnInit() {
     this.setRandomImage();
       setInterval(() => this.setRandomImage(), 5000); // every 5s
    // Load real data when component initializes
    this.loadApplicationData();
  }

  private async loadApplicationData() {
    try {
      // This will load from localStorage first, then sync with backend
      await this.fundingApplicationService.loadSavedApplication();
    } catch (error) {
      console.error('Failed to load application data:', error);
    }
  }

  // REAL DATA: Step data helpers
  private hasDataForStep(stepId: string, data: any): boolean {
    switch (stepId) {
      case 'company-info':
        return !!data.companyInfo && this.isObjectNotEmpty(data.companyInfo);
      case 'documents':
        return !!data.supportingDocuments && this.isObjectNotEmpty(data.supportingDocuments);
      case 'business-assessment':
        return !!data.businessAssessment && this.isObjectNotEmpty(data.businessAssessment);
      case 'swot-analysis':
        return !!data.swotAnalysis && this.hasMinimumSwotData(data.swotAnalysis);
      case 'management':
        return !!data.managementStructure && this.isObjectNotEmpty(data.managementStructure);
      case 'business-strategy':
        return !!data.businessStrategy && this.isObjectNotEmpty(data.businessStrategy);
      case 'financial-profile':
        return !!data.financialProfile && this.isObjectNotEmpty(data.financialProfile);
      default:
        return false;
    }
  }

  private isObjectNotEmpty(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    return Object.values(obj).some(value => 
      value !== null && 
      value !== undefined && 
      value !== '' &&
      (Array.isArray(value) ? value.length > 0 : true)
    );
  }

  private hasMinimumSwotData(swot: any): boolean {
    return swot.strengths?.length >= 1 || 
           swot.weaknesses?.length >= 1 || 
           swot.opportunities?.length >= 1 || 
           swot.threats?.length >= 1;
  }

  setRandomImage() {
    const images = [
      '/images/workshop.png',
      '/images/webinar.png'
    ];
    this.currentImage = images[Math.floor(Math.random() * images.length)];
  }
  // EVENT HANDLERS
  onActivityClicked(activity: Activity): void {
    console.log('Activity clicked:', activity);
    
    switch (activity.type) {
      case 'milestone':
        this.router.navigate(['/profile/steps']);
        break;
      case 'funding':
        this.router.navigate(['/opportunities']);
        break;
      default:
        this.showActivityDetails(activity);
    }
  }

  viewAllActivities(): void {
    this.router.navigate(['/dashboard/activities']);
  }

  private showActivityDetails(activity: Activity): void {
    console.log('Show activity details for:', activity);
  }

  // NAVIGATION METHODS - Updated for new route structure
  startProfile() {
    this.router.navigate(['/profile/steps/company-info']); // Use new route names
  }

  continueProfile() {
    const currentStepId = this.currentStepId();
    if (currentStepId && currentStepId !== 'company-info') {
      this.router.navigate(['/profile/steps', currentStepId]);
    } else {
      // Go to first incomplete step
      const nextStep = this.fundingApplicationService.nextRequiredStep();
      if (nextStep) {
        this.router.navigate(['/profile/steps', nextStep.id]);
      } else {
        this.router.navigate(['/profile/steps/company-info']);
      }
    }
  }

  reviewProfile() {
    this.router.navigate(['/profile/steps']);
  }

  viewAllSteps() {
    this.router.navigate(['/profile/steps']);
  }

  goToStep(stepId: string) {
    // Map old step IDs to new ones if needed
    const stepMapping: { [key: string]: string } = {
      'admin': 'company-info',
      'business-review': 'business-assessment',
      'swot': 'swot-analysis',
      'business-plan': 'business-strategy',
      'financial': 'financial-profile'
    };
    
    const actualStepId = stepMapping[stepId] || stepId;
    this.router.navigate(['/profile/steps', actualStepId]);
  }

  getProfileButtonText(): string {
    const completion = this.completionPercentage();
    if (completion === 0) {
      return 'Start Your Profile';
    } else if (completion < 100) {
      return 'Continue Profile';
    } else {
      return 'Review Complete Profile';
    }
  }

  // STEP DISPLAY METHODS - Updated to use real data
  isCurrentStep(stepId: string): boolean {
    return this.currentStepId() === stepId;
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
      'company-info': Building,
      'documents': FileText,
      'swot-analysis': AlertTriangle,
      'management': Users,
      'business-strategy': FileText,
      'financial-profile': DollarSign,
      // Legacy mappings
      'admin': Building,
      'business-review': Building,
      'swot': AlertTriangle,
      'business-plan': FileText,
      'financial': DollarSign
    };
    return icons[stepId] || FileText;
  }

  getStepDescription(stepId: string): string {
    const descriptions: { [key: string]: string } = {
      'company-info': 'Company registration & structure',
      'documents': 'Upload business documents',
      'business-assessment': 'Operations & market analysis',
      'swot-analysis': 'Strategic analysis & planning',
      'management': 'Leadership team details',
      'business-strategy': 'Business plan & projections',
      'financial-profile': 'Financial data & requirements',
      // Legacy mappings
      'admin': 'Company registration & structure',
      'business-review': 'Operations & market analysis',
      'swot': 'Strategic analysis & planning',
      'business-plan': 'Business plan & projections',
      'financial': 'Financial data & requirements'
    };
    return descriptions[stepId] || 'Complete this section';
  }

  getStepStatusText(step: any): string {
    if (step.completed) {
      return 'Complete';
    } else if (this.isCurrentStep(step.id)) {
      return 'Current';
    } else {
      const currentData = this.fundingApplicationService.data();
      const hasData = this.hasDataForStep(step.id, currentData);
      return hasData ? 'In Progress' : 'Pending';
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

  // ACTION METHODS
  viewOpportunities() {
    const user = this.authService.user();
    if (user?.userType === 'funder') {
      this.router.navigate(['/dashboard/portfolio']);
    } else {
      this.router.navigate(['/opportunities']);
    }
  }

  primaryAction() {
    const user = this.authService.user();
    if (user?.userType === 'funder') {
      this.router.navigate(['/dashboard']);
    } else {
      this.router.navigate(['/applications']);
    }
  }

  upgradeSubscription() {
    this.router.navigate(['/dashboard/subscription']);
  }

  requestHelp() {
    // Open email client or contact form
    window.location.href = `mailto:${this.email}?subject=Profile Assistance Request&body=Hi, I need help completing my funding profile.`;
  }

  scheduleCall() {
    // Could integrate with calendly or booking system
    this.router.navigate(['/dashboard/support']);
  }

  // REAL DATA: Save progress manually
  async saveProgress() {
    try {
      await this.fundingApplicationService.saveCurrentProgress();
      console.log('Progress saved successfully');
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  // Get the actual steps from the service
  get applicationSteps() {
    return this.fundingApplicationService.steps;
  }
}