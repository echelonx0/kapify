import { Component, computed, OnInit, inject, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  ArrowRight,
  CheckCircle,
  Building,
  FileText,
  Users,
  DollarSign,
  AlertTriangle,
  Headphones,
  Star,
  Twitter,
  Instagram,
  Share2,
  Copy,
  RefreshCw,
} from 'lucide-angular';

import { UiButtonComponent } from '../../../shared/components/ui-button.component';
import { UiStatusBadgeComponent } from '../../../shared/components/ui-status-badge.component';

import { AuthService } from '../../../auth/production.auth.service';
import { FundingProfileSetupService } from '../../services/funding-profile-setup.service';
import { Activity } from '../../../shared/services/database-activity.service';

@Component({
  selector: 'app-profile-home',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent,
    UiStatusBadgeComponent,
    RouterModule,
  ],
  templateUrl: 'profile-home.component.html',
  styles: [
    `
      :host ::ng-deep {
        .compact-mode {
          max-height: 300px;
          overflow-y: auto;
        }
      }
    `,
  ],
})
export class ProfileHomeComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private fundingApplicationService = inject(FundingProfileSetupService);
  private router = inject(Router);

  // Icons
  ArrowRightIcon = ArrowRight;
  CheckCircleIcon = CheckCircle;
  BuildingIcon = Building;
  FileText = FileText;
  UsersIcon = Users;
  DollarSignIcon = DollarSign;
  AlertTriangleIcon = AlertTriangle;
  HeadphonesIcon = Headphones;
  Star = Star;
  Twitter = Twitter;
  Instagram = Instagram;
  Share2Icon = Share2;
  CopyIcon = Copy;
  RefreshIcon = RefreshCw;

  email = 'info@bokamosoas.co.za';
  currentImage = '/images/workshop.png';
  private imageRotationInterval: any;

  // In profile-home.component.ts - add this computed property:
  completionPercentage = computed(() => {
    const completed = this.fundingApplicationService.steps.filter(
      (step) => step.completed
    ).length;
    const total = this.fundingApplicationService.steps.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });
  completedSteps = computed(() =>
    this.fundingApplicationService.completedSteps()
  );
  totalSteps = computed(() => this.fundingApplicationService.steps.length);

  inProgressSteps = computed(() => {
    const currentData = this.fundingApplicationService.data();
    return this.fundingApplicationService.steps.filter((step) => {
      const hasData = this.hasDataForStep(step.id, currentData);
      return hasData && !step.completed;
    }).length;
  });

  pendingSteps = computed(() => {
    return this.totalSteps() - this.completedSteps() - this.inProgressSteps();
  });

  currentStepId = computed(() =>
    this.fundingApplicationService.currentStepId()
  );
  isApplicationComplete = computed(() =>
    this.fundingApplicationService.isApplicationComplete()
  );
  isLoading = computed(() => this.fundingApplicationService.loading());

  // ===== DYNAMIC METRICS (Revenue-focused) =====
  getMetricValue = (): string => {
    const user = this.authService.user();
    return user?.userType === 'funder' ? '23+' : '47.8M';
  };

  getMetricLabel = (): string => {
    const user = this.authService.user();
    return user?.userType === 'funder' ? 'Companies Funded' : 'ZAR Available';
  };

  estimatedHours = (): number => {
    const remaining = this.pendingSteps();
    return Math.ceil(remaining * 0.5); // 30 mins per step estimate
  };

  // ===== STEP HELPERS =====
  private hasDataForStep(stepId: string, data: any): boolean {
    const stepDataMap: { [key: string]: string } = {
      'company-info': 'companyInfo',
      documents: 'supportingDocuments',
      'business-assessment': 'businessAssessment',
      'swot-analysis': 'swotAnalysis',
      management: 'managementStructure',
      'business-strategy': 'businessStrategy',
      'financial-profile': 'financialProfile',
    };

    const dataKey = stepDataMap[stepId];
    if (!dataKey) return false;
    return this.isObjectNotEmpty(data[dataKey]);
  }

  private isObjectNotEmpty(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    return Object.values(obj).some(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== '' &&
        (Array.isArray(value) ? value.length > 0 : true)
    );
  }

  getStepIconClasses(step: any): string {
    const baseClasses =
      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0';
    if (step.completed) return `${baseClasses} bg-green-500`;
    if (this.isCurrentStep(step.id))
      return `${baseClasses} bg-orange-500 text-white`;
    return `${baseClasses} bg-slate-200 text-slate-600`;
  }

  getStepIcon(stepId: string): any {
    const icons: { [key: string]: any } = {
      'company-info': Building,
      documents: FileText,
      'business-assessment': Building,
      'swot-analysis': AlertTriangle,
      management: Users,
      'business-strategy': FileText,
      'financial-profile': DollarSign,
    };
    return icons[stepId] || FileText;
  }

  getStepDescription(stepId: string): string {
    const descriptions: { [key: string]: string } = {
      'company-info': 'Company registration & structure',
      documents: 'Upload business documents',
      'business-assessment': 'Operations & market analysis',
      'swot-analysis': 'Strategic analysis & planning',
      management: 'Leadership team details',
      'business-strategy': 'Business plan & projections',
      'financial-profile': 'Financial data & requirements',
    };
    return descriptions[stepId] || 'Complete this section';
  }

  getStepStatusText(
    step: any
  ): 'Complete' | 'In Progress' | 'Pending' | 'Current' {
    if (step.completed) return 'Complete';
    if (this.isCurrentStep(step.id)) return 'Current';

    const currentData = this.fundingApplicationService.data();
    const hasData = this.hasDataForStep(step.id, currentData);
    return hasData ? 'In Progress' : 'Pending';
  }

  getStepStatusColor(step: any): 'success' | 'primary' | 'warning' {
    const status = this.getStepStatusText(step);
    if (status === 'Complete') return 'success';
    if (status === 'Current' || status === 'In Progress') return 'primary';
    return 'warning';
  }

  isCurrentStep(stepId: string): boolean {
    return this.currentStepId() === stepId;
  }

  // ===== ABOUT & TESTIMONIAL HELPERS =====
  getAboutText(): string {
    const user = this.authService.user();
    if (user?.userType === 'funder') {
      return 'Managing a diverse portfolio of South African SMEs with focus on sustainable growth and social impact.';
    }
    return `${
      user?.firstName || 'Your company'
    } is building tomorrow's success story. We're focused on innovation, growth, and delivering value.`;
  }

  getServiceTitle(): string {
    const user = this.authService.user();
    return user?.userType === 'funder' ? 'Portfolio Growth' : 'Funding Support';
  }

  getServiceDescription(): string {
    const user = this.authService.user();
    if (user?.userType === 'funder') {
      return 'Track and grow your investment portfolio with real-time insights and management tools.';
    }
    return 'Access tailored funding opportunities matched to your business profile and growth stage.';
  }

  getTestimonialText(): string {
    const user = this.authService.user();
    if (user?.userType === 'funder') {
      return 'The portfolio management tools have streamlined my investment process significantly. ROI tracking is exceptional.';
    }
    return 'Securing funding was seamless. The guided profile helped us present our best case to potential partners.';
  }

  getTestimonialAuthor(): string {
    const user = this.authService.user();
    return user?.userType === 'funder' ? 'Sarah K.' : 'Michael J.';
  }

  getTestimonialRole(): string {
    const user = this.authService.user();
    return user?.userType === 'funder' ? 'Portfolio Manager' : 'Founder & CEO';
  }

  getCurrentDate(): string {
    const date = new Date();
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ===== LIFECYCLE =====
  ngOnInit() {
    this.rotateImages();
    this.loadApplicationData();
  }

  ngOnDestroy() {
    if (this.imageRotationInterval) {
      clearInterval(this.imageRotationInterval);
    }
  }

  private rotateImages() {
    const images = ['/images/workshop.png', '/images/webinar.png'];
    let index = 0;
    this.imageRotationInterval = setInterval(() => {
      this.currentImage = images[index % images.length];
      index++;
    }, 5000);
  }

  private async loadApplicationData() {
    try {
      await this.fundingApplicationService.loadSavedApplication();
    } catch (error) {
      console.error('Failed to load application:', error);
    }
  }

  // ===== EVENT HANDLERS =====
  onActivityClicked(activity: Activity): void {
    switch (activity.type) {
      case 'milestone':
        this.router.navigate(['/profile/steps']);
        break;
      case 'funding':
        this.router.navigate(['/opportunities']);
        break;
      default:
        console.log('Activity:', activity);
    }
  }

  viewAllActivities(): void {
    this.router.navigate(['/dashboard/activities']);
  }

  goToStep(stepId: string): void {
    this.router.navigate(['/profile/steps', stepId]);
  }

  viewAllSteps(): void {
    this.router.navigate(['/profile/steps']);
  }

  scheduleCall(): void {
    this.router.navigate(['/dashboard/support']);
  }

  submitProfile(): void {
    // if (this.completionPercentage() >= 100) {
    //   this.fundingApplicationService.submitApplication();
    //   this.router.navigate(['/applications']);
    // }
  }

  // ===== SLUG MANAGEMENT =====
  private getProfileUrl(slug: string): string {
    return `${window.location.origin}/invest/${slug}`;
  }

  copyProfileLink(): void {
    const slug = this.fundingApplicationService.getCurrentSlug();
    if (!slug) {
      alert('Please save your profile first');
      return;
    }
    const url = this.getProfileUrl(slug);
    navigator.clipboard.writeText(url);
    alert('Link copied!');
  }

  sharePublicProfile(): void {
    const slug = this.fundingApplicationService.getCurrentSlug();
    if (!slug) {
      alert('Please save your profile first');
      return;
    }
    const url = this.getProfileUrl(slug);
    if (navigator.share) {
      navigator.share({
        title: 'Check out my business profile',
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard');
    }
  }

  refreshProfileLink(): void {
    this.fundingApplicationService.refreshSlug().then((slug) => {
      if (slug) {
        alert('Profile link refreshed');
      } else {
        alert('Failed to refresh link. Save your profile first.');
      }
    });
  }

  // ===== GETTER =====
  get applicationSteps() {
    return this.fundingApplicationService.steps;
  }
}
