import {
  Component,
  signal,
  computed,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import {
  LucideAngularModule,
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  Building2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  FileText,
  ClockIcon,
  BarChart3,
  FolderOpen,
  Settings,
  Home,
  ChevronDown,
  ChevronUp,
} from 'lucide-angular';
import { UiButtonComponent } from '../../shared/components';
import {
  FunderOnboardingService,
  OnboardingState,
} from '../services/funder-onboarding.service';
import { OpportunityManagementService } from '../services/opportunity-management.service';
import { FunderDocumentAnalysisComponent } from 'src/app/ai/document-analysis/funder-document-analysis.component';
import {
  ActionEvent,
  OrganizationStatusSidebarComponent,
} from '../components/status-sidebar/status-sidebar.component';
import { PublicProfile } from '../models/public-profile.models';
import { PublicProfileService } from '../services/public-profile.service';
import { FunderApplicationsComponent } from '../application-details/funder-applications/funder-applications.component';
import { DraftManagementService } from '../services/draft-management.service';

import { OpportunityActionModalComponent } from 'src/app/shared/components/modal/app-modal.component';
import { ActionModalService } from 'src/app/shared/components/modal/modal.service';

type TabId = 'overview' | 'opportunities' | 'applications' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: any;
  description: string;
}

@Component({
  selector: 'app-funder-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    UiButtonComponent,
    LucideAngularModule,
    FunderDocumentAnalysisComponent,
    OrganizationStatusSidebarComponent,

    FunderApplicationsComponent,
    OpportunityActionModalComponent,
  ],
  templateUrl: 'dashboard.component.html',
  styleUrl: 'funder-dashboard.component.css',
})
export class FunderDashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private onboardingService = inject(FunderOnboardingService);
  private managementService = inject(OpportunityManagementService);
  private destroy$ = new Subject<void>();
  private publicProfileService = inject(PublicProfileService);
  protected draftService = inject(DraftManagementService);
  private actionModalService = inject(ActionModalService);

  // State
  activeTab = signal<TabId>('overview');
  isDocumentAnalysisExpanded = signal(true);

  tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      description: 'Dashboard overview and key metrics',
    },
    {
      id: 'opportunities',
      label: 'Opportunities',
      icon: FolderOpen,
      description: 'Manage your funding opportunities',
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: FileText,
      description: 'Review and manage applications',
    },
    // {
    //   id: 'settings',
    //   label: 'Settings',
    //   icon: Settings,
    //   description: 'Organization settings and preferences',
    // },
  ];

  // Icons
  PlusIcon = Plus;
  TrendingUpIcon = TrendingUp;
  UsersIcon = Users;
  DollarSignIcon = DollarSign;
  Building2Icon = Building2;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  ArrowRightIcon = ArrowRight;
  ClockIcon = ClockIcon;
  FileTextIcon = FileText;
  BarChart3Icon = BarChart3;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;

  // State signals
  onboardingState = signal<OnboardingState | null>(null);
  analytics = signal<any>(null);
  recentOpportunities = signal<any[]>([]);
  showDocumentAnalysis = signal(false);
  publicProfile = signal<PublicProfile | null>(null);

  // Computed properties
  hasPublicProfile = computed(() => !!this.publicProfile());
  publicProfileUrl = computed(() => {
    const profile = this.publicProfile();
    return profile?.slug
      ? `${window.location.origin}/funder/${profile.slug}`
      : null;
  });

  ngOnInit() {
    this.loadDashboardData();
    this.setupSubscriptions();
    this.loadPublicProfile();
    this.loadDocumentAnalysisPreference();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Document Analysis Toggle Methods
  toggleDocumentAnalysis() {
    const newState = !this.isDocumentAnalysisExpanded();
    this.isDocumentAnalysisExpanded.set(newState);
    this.saveDocumentAnalysisPreference(newState);
  }

  private loadDocumentAnalysisPreference() {
    const saved = localStorage.getItem('documentAnalysisExpanded');
    if (saved !== null) {
      this.isDocumentAnalysisExpanded.set(saved === 'true');
    }
  }

  private saveDocumentAnalysisPreference(expanded: boolean) {
    localStorage.setItem('documentAnalysisExpanded', expanded.toString());
  }

  // Tab navigation
  switchTab(tabId: TabId) {
    this.activeTab.set(tabId);
  }

  isActiveTab(tabId: TabId): boolean {
    return this.activeTab() === tabId;
  }

  // Draft management methods
  continueDraft() {
    this.router.navigate(['/funding/create-opportunity']);
  }

  startFreshOpportunity() {
    this.draftService
      .checkDraftAndProceed()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (action) => {
          switch (action) {
            case 'continue':
              this.continueDraft();
              break;
            case 'clear':
              this.clearDraftAndStartFresh();
              break;
            case 'create_new':
              this.navigateToCreateOpportunity();
              break;
          }
        },
        error: (error) => {
          console.error('Error checking draft:', error);
          this.navigateToCreateOpportunity();
        },
      });
  }

  deleteDraft() {
    if (
      confirm(
        'Are you sure you want to delete your draft? This action cannot be undone.'
      )
    ) {
      this.draftService
        .clearAllDrafts()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Draft deleted successfully');
          },
          error: (error) => {
            console.error('Failed to delete draft:', error);
            alert('Failed to delete draft. Please try again.');
          },
        });
    }
  }

  createOpportunity() {
    if (this.onboardingState()?.canCreateOpportunities) {
      this.handleCreateOpportunity();
    } else {
      this.completeOnboarding();
    }
  }

  private handleCreateOpportunity() {
    this.draftService
      .checkDraftAndProceed()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (action) => {
          switch (action) {
            case 'continue':
              this.continueDraft();
              break;
            case 'clear':
              this.clearDraftAndStartFresh();
              break;
            case 'create_new':
              this.navigateToCreateOpportunity();
              break;
          }
        },
        error: (error) => {
          console.error('Error in create opportunity flow:', error);
          this.navigateToCreateOpportunity();
        },
      });
  }

  private clearDraftAndStartFresh() {
    this.draftService
      .clearAllDrafts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.navigateToCreateOpportunity();
        },
        error: (error) => {
          console.error('Failed to clear draft:', error);
          this.navigateToCreateOpportunity();
        },
      });
  }

  private navigateToCreateOpportunity() {
    try {
      this.router.navigate(['/funding/create-opportunity']);
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/funding/create-opportunity';
    }
  }

  private loadPublicProfile() {
    const organizationId = this.onboardingState()?.organization?.id;
    if (organizationId) {
      this.publicProfileService
        .loadOrganizationProfile(organizationId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (profile) => {
            this.publicProfile.set(profile);
          },
          error: (error) => {
            console.log('No public profile found or error loading:', error);
          },
        });
    }
  }

  // Navigation methods for public profile
  managePublicProfile() {
    this.router.navigate(['/funder/create-profile']);
  }

  shareProfileLink() {
    const url = this.publicProfileUrl();
    if (url) {
      navigator.clipboard.writeText(url).then(() => {
        console.log('Profile URL copied to clipboard');
      });
    }
  }

  viewPublicProfile() {
    const url = this.publicProfileUrl();
    if (url) {
      window.open(url, '_blank');
    }
  }

  openDocumentAnalysis() {
    this.showDocumentAnalysis.set(true);
  }

  importOpportunity() {
    this.router.navigate(['/funder/opportunities/import']);
  }

  private loadDashboardData() {
    this.onboardingService.checkOnboardingStatus().subscribe();
    this.managementService.loadAnalytics().subscribe();
    this.managementService.loadUserOpportunities().subscribe();
  }

  private setupSubscriptions() {
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

  // Navigation methods
  viewAllOpportunities() {
    this.router.navigate(['/funding/opportunities']);
  }

  viewOpportunity(opportunityId: string) {
    this.router.navigate(['/funder/opportunities', opportunityId]);
  }

  manageApplications(opportunityId: string) {
    this.router.navigate([
      '/funder/opportunities',
      opportunityId,
      'applications',
    ]);
  }

  editOpportunity(opportunityId: string) {
    this.router.navigate(['/funder/opportunities/edit', opportunityId]);
  }

  // UPDATED: Use ActionModalService instead of ViewChild
  deleteOpportunity(opportunityId: string) {
    const opportunity = this.recentOpportunities().find(
      (o) => o.id === opportunityId
    );
    if (!opportunity) return;

    this.actionModalService.showDelete(
      opportunity.title,
      opportunity.currentApplications > 0,
      opportunity.currentApplications
    );

    this.actionModalService.open(
      {
        actionType: 'delete',
        opportunityTitle: opportunity.title,
        hasApplications: opportunity.currentApplications > 0,
        applicationCount: opportunity.currentApplications,
      },
      {
        onConfirm: () => this.performDelete(opportunityId),
        onCancel: () => this.actionModalService.close(),
      }
    );
  }

  private performDelete(opportunityId: string) {
    this.managementService
      .deleteOpportunity(opportunityId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('Opportunity deleted:', result.message);
          this.actionModalService.close();
        },
        error: (error) => {
          console.error('Delete failed:', error);
          const errorMsg = this.extractErrorMessage(error);
          this.actionModalService.setError(errorMsg);
        },
      });
  }

  duplicateOpportunity(opportunityId: string) {
    const opportunity = this.recentOpportunities().find(
      (o) => o.id === opportunityId
    );
    if (!opportunity) return;

    this.actionModalService.showDuplicate(opportunity.title);

    this.actionModalService.open(
      {
        actionType: 'duplicate',
        opportunityTitle: opportunity.title,
      },
      {
        onConfirm: () => this.performDuplicate(opportunityId),
        onCancel: () => this.actionModalService.close(),
      }
    );
  }

  private performDuplicate(opportunityId: string) {
    this.managementService
      .duplicateOpportunity(opportunityId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('Opportunity duplicated:', result.newOpportunityId);
          this.actionModalService.close();
          this.router.navigate([
            '/funder/opportunities/edit',
            result.newOpportunityId,
          ]);
        },
        error: (error) => {
          console.error('Duplicate failed:', error);
          const errorMsg = this.extractErrorMessage(error);
          this.actionModalService.setError(errorMsg);
        },
      });
  }

  private extractErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error.message) {
      const msg = error.message;

      if (msg.includes('invalid input syntax for type uuid')) {
        return 'Failed to create opportunity. Please try again.';
      }
      if (msg.includes('not found')) {
        return 'Opportunity not found or has been deleted.';
      }
      if (msg.includes('access denied')) {
        return 'You do not have permission to perform this action.';
      }
      if (msg.includes('not authenticated')) {
        return 'Your session has expired. Please log in again.';
      }

      return msg
        .replace(/Error: /g, '')
        .replace(/at _/g, '')
        .split(' at ')[0]
        .trim();
    }

    return 'An error occurred. Please try again.';
  }

  viewAnalytics() {
    // this.router.navigate(['/funder/analytics']);
  }

  improveProfile() {
    this.router.navigate(['/funder/onboarding'], {
      fragment: 'verification',
    });
  }

  // Helper methods
  getActiveOpportunitiesCount(): number {
    return this.recentOpportunities().filter((opp) => opp.status === 'active')
      .length;
  }

  formatStatus(status: string): string {
    const statuses: Record<string, string> = {
      draft: 'Draft',
      active: 'Active',
      paused: 'Paused',
      closed: 'Closed',
    };
    return statuses[status] || status;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-ZA').format(num);
  }

  handleOrganizationAction(event: ActionEvent) {
    console.log('Organization action:', event);

    switch (event.type) {
      case 'complete_setup':
        this.completeOnboarding();
        break;

      case 'get_verified':
        this.requestVerification();
        break;

      case 'edit_organization':
        this.editOrganization();
        break;

      case 'manage_public_profile':
        this.managePublicProfile();
        break;

      default:
        console.warn('Unknown organization action:', event.type);
    }
  }

  private requestVerification() {
    this.onboardingService
      .requestVerification()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('Verification requested:', result.message);
        },
        error: (error) => {
          console.error('Verification request failed:', error);
        },
      });
  }

  completeOnboarding() {
    this.router.navigate(['/funder/onboarding']);
  }

  editOrganization() {
    this.router.navigate(['/funder/onboarding']);
  }
}
