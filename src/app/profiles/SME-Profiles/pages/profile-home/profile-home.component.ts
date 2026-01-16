import {
  Component,
  computed,
  OnInit,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  ArrowRight,
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
  Plus,
  CircleCheckBig,
  TriangleAlert,
  SquarePen,
} from 'lucide-angular';

import { UiButtonComponent } from '../../../../shared/components/ui-button.component';
import { UiStatusBadgeComponent } from '../../../../shared/components/ui-status-badge.component';
import { CoverStatusSectionComponent } from '../cover-status-section/cover-status-section.component';

import { AuthService } from '../../../../auth/services/production.auth.service';
import { FundingProfileSetupService } from '../../../../fund-seeking-orgs/services/funding-profile-setup.service';
import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';

import { PlatformDisclaimerComponent } from 'src/app/core/dashboard/components/disclaimer/disclaimer.component';
import { ProfileTipsModalComponent } from '../../components/profile-tips/profile-tips.component';

@Component({
  selector: 'app-profile-home',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent,
    UiStatusBadgeComponent,
    PlatformDisclaimerComponent,
    RouterModule,
    CoverStatusSectionComponent,
    ProfileTipsModalComponent,
  ],
  templateUrl: 'profile-home.component.html',
  styleUrl: './profile-home.component.css',
})
export class ProfileHomeComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private fundingApplicationService = inject(FundingProfileSetupService);
  private coverService = inject(FundingApplicationCoverService);
  private router = inject(Router);

  // Icons
  ArrowRightIcon = ArrowRight;
  CheckCircleIcon = CircleCheckBig;
  BuildingIcon = Building;
  FileText = FileText;
  UsersIcon = Users;
  DollarSignIcon = DollarSign;
  AlertTriangleIcon = TriangleAlert;
  HeadphonesIcon = Headphones;
  Star = Star;
  Twitter = Twitter;
  Instagram = Instagram;
  Share2Icon = Share2;
  CopyIcon = Copy;
  RefreshIcon = RefreshCw;
  EditIcon = SquarePen;
  PlusIcon = Plus;

  email = 'info@bokamosoas.co.za';
  private imageRotationInterval: any;
  //  signal to control modal visibility
  showProfileTips = signal(false);
  // ===== COMPUTED PROPERTIES =====
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

  estimatedHours = (): number => {
    const remaining = this.pendingSteps();
    return Math.ceil(remaining * 0.5);
  };

  borderClass = computed(() => {
    return 'border-4 border-slate-600';
    return 'border-4 border-slate-900';
  });

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
      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 step-icon';
    if (step.completed)
      return `${baseClasses} bg-green-600 text-white step-icon-completed`;
    if (this.isCurrentStep(step.id))
      return `${baseClasses} bg-teal-500 text-white`;
    return `${baseClasses} bg-slate-100 text-slate-600`;
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

  isStepInProgress(step: any): boolean {
    return this.getStepStatusText(step) === 'In Progress';
  }

  getCardClass(step: any): string {
    return this.isCurrentStep(step.id) ? 'is-current' : '';
  }

  // ===== LIFECYCLE =====
  ngOnInit() {
    this.loadApplicationData();
    this.loadCoverData();
  }

  goBack() {
    window.history.back();
  }
  ngOnDestroy() {
    if (this.imageRotationInterval) {
      clearInterval(this.imageRotationInterval);
    }
  }

  private async loadApplicationData() {
    try {
      await this.fundingApplicationService.loadSavedApplication();
    } catch (error) {
      console.error('Failed to load application:', error);
    }
  }

  /**
   * Load cover data
   */
  private async loadCoverData() {
    try {
      await this.coverService.loadDefaultCover();
    } catch (error) {
      console.error('Failed to load cover data:', error);
    }
  }

  // ===== EVENT HANDLERS =====
  goToStep(stepId: string): void {
    this.router.navigate(['/profile/steps', stepId]);
  }

  viewAllSteps(): void {
    this.router.navigate(['/profile/steps']);
  }

  scheduleCall(): void {
    this.router.navigate(['/dashboard/support']);
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
  // When user clicks hint icon/button
  openProfileTips() {
    this.showProfileTips.set(true);
  }

  closeProfileTips() {
    this.showProfileTips.set(false);
  }
  // ===== GETTER =====
  get applicationSteps() {
    return this.fundingApplicationService.steps;
  }
}
