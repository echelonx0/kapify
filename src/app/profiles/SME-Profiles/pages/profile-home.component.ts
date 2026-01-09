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

import { AuthService } from '../../../auth/services/production.auth.service';
import { FundingProfileSetupService } from '../../../fund-seeking-orgs/services/funding-profile-setup.service';
import { DataIntegritySectionComponent } from 'src/app/features/reports/data-integrity-section/data-integrity-section.component';

@Component({
  selector: 'app-profile-home',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiButtonComponent,
    UiStatusBadgeComponent,
    DataIntegritySectionComponent,
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

        /* Fade in on load */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Slide in from left */
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Scale pulse for icons */
        @keyframes scalePulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        /* Apply animations */
        .hero-section {
          animation: fadeIn 0.5s ease-out;
        }

        .step-card {
          animation: fadeIn 0.5s ease-out;
          animation-fill-mode: both;
        }

        .step-card:nth-child(1) {
          animation-delay: 0.05s;
        }
        .step-card:nth-child(2) {
          animation-delay: 0.1s;
        }
        .step-card:nth-child(3) {
          animation-delay: 0.15s;
        }
        .step-card:nth-child(4) {
          animation-delay: 0.2s;
        }
        .step-card:nth-child(5) {
          animation-delay: 0.25s;
        }
        .step-card:nth-child(6) {
          animation-delay: 0.3s;
        }

        .right-sidebar-card {
          animation: slideInLeft 0.5s ease-out;
          animation-fill-mode: both;
        }

        .right-sidebar-card:nth-child(1) {
          animation-delay: 0.2s;
        }
        .right-sidebar-card:nth-child(2) {
          animation-delay: 0.25s;
        }
        .right-sidebar-card:nth-child(3) {
          animation-delay: 0.3s;
        }

        .step-icon-completed {
          animation: scalePulse 2s ease-in-out infinite;
        }

        /* Smooth hover lift on cards */
        .step-card {
          transition: all 0.2s ease-out;
        }

        .step-card:hover {
          transform: translateY(-2px);
          border-color: rgb(71 85 105 / 0.3);
          box-shadow: 0 4px 12px rgb(0 0 0 / 0.08);
        }

        /* Button interactions */
        .action-button {
          transition: all 0.2s ease-out;
        }

        .action-button:hover {
          transform: translateY(-1px);
        }

        .action-button:active {
          transform: translateY(0);
        }

        /* Progress bar animation */
        .progress-fill {
          transition: width 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Stat counter animation */
        .stat-number {
          animation: fadeIn 0.6s ease-out 0.1s both;
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
  private imageRotationInterval: any;

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
      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0';
    if (step.completed) return `${baseClasses} bg-green-600 text-white`;
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

  // ===== LIFECYCLE =====
  ngOnInit() {
    this.loadApplicationData();
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

  // ===== GETTER =====
  get applicationSteps() {
    return this.fundingApplicationService.steps;
  }
}
