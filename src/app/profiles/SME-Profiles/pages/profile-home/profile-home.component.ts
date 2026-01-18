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
  X,
} from 'lucide-angular';

import { UiStatusBadgeComponent } from '../../../../shared/components/ui-status-badge.component';

import { AuthService } from '../../../../auth/services/production.auth.service';
import { FundingProfileSetupService } from '../../../../fund-seeking-orgs/services/funding-profile-setup.service';
import { FundingApplicationCoverService } from 'src/app/shared/services/funding-application-cover.service';

import { PlatformDisclaimerComponent } from 'src/app/core/dashboard/components/disclaimer/disclaimer.component';
import { ProfileTipsComponent } from '../../components/profile-tips/profile-tips.component';
import { ActivityService } from 'src/app/shared/services/activity.service';

@Component({
  selector: 'app-profile-home',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiStatusBadgeComponent,
    PlatformDisclaimerComponent,
    RouterModule,
    ProfileTipsComponent,
  ],
  // templateUrl: 'profile-home.component.html',
  template: `<div class="min-h-screen bg-slate-50">
    <!-- MAIN CONTENT: Responsive Layout -->
    <div class="px-4 py-4 lg:ml-12 lg:px-8 lg:py-2">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-1">
          <h2 class="text-xl font-bold text-slate-900">
            Your business funding Profile
          </h2>
          @if (applicationSteps.length > 6) {
            <button
              class="hidden lg:inline-flex px-4 py-2.5 text-sm font-semibold text-teal-600 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors duration-200"
              (click)="viewAllSteps()"
            >
              Update Information
            </button>
          }

          <button
            (click)="goBack()"
            class="hidden lg:inline-flex px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors duration-200"
            aria-label="Go back"
          >
            Back
          </button>
        </div>

        <!-- MAIN GRID: Left (Disclaimer + Cards) + Right (Tips fixed) -->
        <div
          class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-6 relative"
        >
          <!-- LEFT COLUMN: Disclaimer + Step Cards (2/3 width) -->
          <div class="lg:col-span-2">
            <!-- Disclaimer -->
            <div class="mb-6">
              <app-platform-disclaimer></app-platform-disclaimer>
            </div>
            <!-- Step Cards Grid: Responsive columns (2x2 on desktop) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
              @for (step of applicationSteps.slice(0, 6); track step.id) {
                <div
                  [class]="'step-card ' + getCardClass(step)"
                  class="bg-white rounded-2xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all duration-200 cursor-pointer group flex flex-col"
                  (click)="goToStep(step.id)"
                >
                  <!-- Icon -->
                  <div class="flex items-start justify-between mb-3">
                    <ui-status-badge
                      [text]="getStepStatusText(step)"
                      [color]="getStepStatusColor(step)"
                      class="text-xs"
                    >
                    </ui-status-badge>
                  </div>

                  <!-- Content -->
                  <div class="flex-1">
                    <h3 class="text-sm font-semibold text-slate-900 mb-1">
                      {{ step.title }}
                    </h3>
                    <p class="text-xs text-slate-600 line-clamp-2">
                      {{ getStepDescription(step.id) }}
                    </p>
                  </div>

                  <!-- Progress Bar (in progress only) -->
                  @if (isStepInProgress(step)) {
                    <div
                      class="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden"
                    >
                      <div
                        class="h-full progress-fill bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-700"
                        [style.width.%]="65"
                      ></div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- SHARE BUTTONS: Horizontal row under step cards -->
            <div
              class="bg-white rounded-lg p-4 scale-in-up w-full mt-8"
              [class]="borderClass()"
              [style]="'--delay: 0.15s'"
            >
              <div class="flex flex-col sm:flex-row gap-2 lg:gap-3">
                <button
                  class="hidden lg:inline-flex px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors duration-200"
                  (click)="viewAllSteps()"
                >
                  Update Profile
                </button>

                <button
                  (click)="manageFundingRequest()"
                  class="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-black rounded-lg border-3 border-teal-700 uppercase tracking-wide text-xs lg:text-sm hover:bg-teal-700 active:bg-teal-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                >
                  Funding Request
                </button>

                <!-- Manage Demographics -->
                <button
                  (click)="navigateToDemographics()"
                  class="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 font-black rounded-lg border-3 border-slate-900 uppercase tracking-wide text-xs lg:text-sm hover:bg-slate-100 active:bg-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  Other Demographics
                </button>

                <button
                  (click)="scheduleCall()"
                  class="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 font-black rounded-lg border-3 border-slate-900 uppercase tracking-wide text-xs lg:text-sm hover:bg-slate-100 active:bg-slate-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                >
                  Schedule Call
                </button>
              </div>
            </div>

            <!-- View All Mobile Button -->
            @if (applicationSteps.length > 6) {
              <button
                class="lg:hidden w-full mt-4 px-4 py-2.5 text-sm font-semibold text-teal-600 border border-teal-200 rounded-xl hover:bg-teal-50 transition-colors duration-200"
                (click)="viewAllSteps()"
              >
                View All {{ applicationSteps.length }} Sections
              </button>
            }
          </div>

          <!-- RIGHT COLUMN: Tips (fixed on desktop, aligned with disclaimer) -->
          <div
            class="hidden lg:flex flex-col lg:sticky lg:top-8 lg:max-h-[calc(100vh-8rem)]"
          >
            <app-profile-tips class="flex-1 overflow-y-auto"></app-profile-tips>
          </div>
        </div>
      </div>
    </div>
  </div>`,
  styleUrl: './profile-home.component.css',
})
export class ProfileHomeComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private fundingApplicationService = inject(FundingProfileSetupService);
  private coverService = inject(FundingApplicationCoverService);
  private router = inject(Router);
  private activityService = inject(ActivityService);
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
  // Default funding request (single-profile mode)
  defaultFundingRequest = this.coverService.defaultProfile;
  email = 'info@bokamosoas.co.za';
  private imageRotationInterval: any;
  //  signal to control modal visibility
  showProfileTips = signal(false);
  // ===== COMPUTED PROPERTIES =====
  completionPercentage = computed(() => {
    const completed = this.fundingApplicationService.steps.filter(
      (step) => step.completed,
    ).length;
    const total = this.fundingApplicationService.steps.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  completedSteps = computed(() =>
    this.fundingApplicationService.completedSteps(),
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
    this.fundingApplicationService.currentStepId(),
  );

  isApplicationComplete = computed(() =>
    this.fundingApplicationService.isApplicationComplete(),
  );

  isLoading = computed(() => this.fundingApplicationService.loading());

  estimatedHours = (): number => {
    const remaining = this.pendingSteps();
    return Math.ceil(remaining * 0.5);
  };

  borderClass = computed(() => {
    return 'border-4 border-slate-600';
  });
  CloseIcon = X;

  getIconBgClass(color: string): string {
    const bgMap: Record<string, string> = {
      teal: 'bg-teal-100 border-teal-600 text-teal-700',
      green: 'bg-green-100 border-green-600 text-green-700',
      blue: 'bg-blue-100 border-blue-600 text-blue-700',
      amber: 'bg-amber-100 border-amber-600 text-amber-700',
    };
    return bgMap[color] || bgMap['teal'];
  }

  getTitleClass(color: string): string {
    const titleMap: Record<string, string> = {
      teal: 'text-teal-900',
      green: 'text-green-900',
      blue: 'text-blue-900',
      amber: 'text-amber-900',
    };
    return titleMap[color] || titleMap['teal'];
  }
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
        (Array.isArray(value) ? value.length > 0 : true),
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
    step: any,
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

  onClose() {}

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

  /**
   * Handle modal choice
   */
  async onCreateChoice(choice: { action: 'fresh' }): Promise<void> {
    this.showProfileTips.set(false);

    try {
      const result = await this.coverService.createBlankCover();
      if (result.success && result.cover) {
        // this.router.navigate(['covers'], {
        //   relativeTo: this.route.parent,
        //   queryParams: {
        //     mode: 'edit',
        //     coverId: result.cover.id,
        //   },
        // });

        this.activityService.trackProfileActivity(
          'created',
          'New funding request created',
          'funding_request_create_fresh',
        );
      }
    } catch (error) {
      console.error('Error creating funding request:', error);
    }
  }

  /**
   * Manage funding request (navigate to editor)
   */
  manageFundingRequest(): void {
    const defaultRequest = this.defaultFundingRequest();
    if (!defaultRequest) return;

    this.activityService.trackProfileActivity(
      'updated',
      'User opened funding request editor',
      'funding_request_manage_view',
    );

    // this.router.navigate(['covers'], {
    //   relativeTo: this.route.parent,
    //   queryParams: {
    //     mode: 'edit',
    //     coverId: defaultRequest.id,
    //   },
    // });
  }

  /**
   * Navigate to demographics form
   */
  navigateToDemographics(): void {
    this.activityService.trackProfileActivity(
      'updated',
      'User opened demographics editor',
      'funding_request_demographics_manage',
    );

    // this.router.navigate(['covers'], {
    //   relativeTo: this.route.parent,
    //   queryParams: {
    //     coverId,
    //     view: 'demographics',
    //   },
    // });
  }
}
