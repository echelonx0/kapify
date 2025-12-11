// src/app/funder/components/application-management.component.ts
import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ArrowLeft,
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Bot,
  Eye,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Calendar,
} from 'lucide-angular';

import { UiButtonComponent } from '../../../shared/components';
import { SidebarNavComponent } from '../../../shared/components/sidenav/sidebar-nav.component';
import { AIAssistantModalComponent } from '../../../ai/ai-assistant/ai-assistant-modal.component';
import { AuthService } from '../../../auth/production.auth.service';
import { SMEOpportunitiesService } from '../../../funding/services/opportunities.service';
import { ApplicationManagementService } from 'src/app/SMEs/services/application-management.service';
import {
  ApplicationListCardComponent,
  BaseApplicationCard,
} from 'src/app/shared/components/application-list-card/application-list-card.component';
import {
  FundingApplication,
  ApplicationStats,
} from 'src/app/SMEs/models/application.models';
import { FundingOpportunity } from '../../create-opportunity/shared/funding.interfaces';

type TabId = 'overview' | 'all' | 'review-queue' | 'completed';

@Component({
  selector: 'app-application-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    UiButtonComponent,
    SidebarNavComponent,
    AIAssistantModalComponent,
    ApplicationListCardComponent,
  ],
  templateUrl: 'application-management.component.html',
  styles: [
    `
      .tab-active {
        @apply border-primary-500 text-primary-600;
      }
      .tab-inactive {
        @apply border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300;
      }
    `,
  ],
})
export class ApplicationManagementComponent implements OnInit {
  // Services
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private applicationService = inject(ApplicationManagementService);
  private authService = inject(AuthService);
  private opportunitiesService = inject(SMEOpportunitiesService);

  // Icons
  ArrowLeftIcon = ArrowLeft;
  UsersIcon = Users;
  FileTextIcon = FileText;
  ClockIcon = Clock;
  CheckCircleIcon = CheckCircle;
  XCircleIcon = XCircle;
  SearchIcon = Search;
  FilterIcon = Filter;
  BotIcon = Bot;
  EyeIcon = Eye;
  MessageSquareIcon = MessageSquare;
  AlertCircleIcon = AlertCircle;
  TrendingUpIcon = TrendingUp;
  CalendarIcon = Calendar;

  // State
  opportunityId = signal<string>('');
  opportunity = signal<FundingOpportunity | null>(null);
  applications = signal<FundingApplication[]>([]);
  stats = signal<ApplicationStats | null>(null);
  isLoading = signal(true);

  // UI State
  activeTab = signal<TabId>('overview');
  showAIModal = signal(false);
  selectedApplicationForAI = signal<FundingApplication | null>(null);

  // Filters
  searchQuery = signal('');
  statusFilter = signal('');
  stageFilter = signal('');

  // Computed
  currentUser = computed(() => this.authService.user());

  tabs = computed(() => {
    const apps = this.applications();
    return [
      { id: 'overview' as TabId, label: 'Overview', icon: this.TrendingUpIcon },
      {
        id: 'all' as TabId,
        label: 'All Applications',
        count: apps.length,
        icon: this.FileTextIcon,
      },
      {
        id: 'review-queue' as TabId,
        label: 'Review Queue',
        count: apps.filter(
          (app) => app.status === 'submitted' || app.status === 'under_review'
        ).length,
        icon: this.ClockIcon,
      },
      {
        id: 'completed' as TabId,
        label: 'Completed',
        count: apps.filter(
          (app) => app.status === 'approved' || app.status === 'rejected'
        ).length,
        icon: this.CheckCircleIcon,
      },
    ];
  });

  filteredApplications = computed(() => {
    let filtered = this.applications();

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (app) =>
          app.title.toLowerCase().includes(query) ||
          app.applicant?.firstName?.toLowerCase().includes(query) ||
          app.applicant?.lastName?.toLowerCase().includes(query) ||
          app.applicant?.companyName?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.statusFilter()) {
      filtered = filtered.filter((app) => app.status === this.statusFilter());
    }

    // Stage filter
    if (this.stageFilter()) {
      filtered = filtered.filter((app) => app.stage === this.stageFilter());
    }

    return filtered;
  });

  displayedApplications = computed(() => {
    const filtered = this.filteredApplications();

    switch (this.activeTab()) {
      case 'review-queue':
        return filtered.filter(
          (app) => app.status === 'submitted' || app.status === 'under_review'
        );
      case 'completed':
        return filtered.filter(
          (app) => app.status === 'approved' || app.status === 'rejected'
        );
      case 'all':
      default:
        return filtered;
    }
  });

  recentApplications = computed(() => {
    return this.applications()
      .slice()
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);
  });

  hasActiveFilters = computed(() => {
    return !!(this.searchQuery() || this.statusFilter() || this.stageFilter());
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('opportunityId');
    if (id) {
      this.opportunityId.set(id);
      this.loadData();
    } else {
      this.router.navigate(['/funder/dashboard']);
    }
  }

  private extractRequestedAmount(formData: Record<string, any>): number {
    // Handle different possible data structures in formData
    if (formData?.['coverInformation']?.requestedAmount) {
      return formData['coverInformation'].requestedAmount;
    }

    if (formData?.['requestedAmount']) {
      return formData['requestedAmount'];
    }

    // Check for nested funding information
    if (formData?.['fundingInformation']?.requestedAmount) {
      return formData['fundingInformation'].requestedAmount;
    }

    // Default fallback
    return 0;
  }
  // Transform method for funder applications
  transformFunderToBaseCard(app: FundingApplication): BaseApplicationCard {
    return {
      id: app.id,
      title: app.title,
      applicationNumber: `APP-${app.id.slice(-6).toUpperCase()}`,
      status: app.status,
      fundingType: app.opportunity?.fundingType,
      requestedAmount: this.extractRequestedAmount(app.formData),
      currency: app.opportunity?.currency || 'ZAR',
      currentStage: this.formatStage(app.stage),
      description: app.description,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      submittedAt: app.submittedAt,
      applicantName: `${app.applicant?.firstName || ''} ${
        app.applicant?.lastName || ''
      }`.trim(),
      applicantCompany: app.applicant?.companyName,
      opportunityTitle: app.opportunity?.title,
    };
  }
  private async loadData() {
    this.isLoading.set(true);

    try {
      // Load opportunity details
      const opportunityData = await this.opportunitiesService
        .getOpportunityById(this.opportunityId())
        .toPromise();
      this.opportunity.set(opportunityData || null);

      // Load applications
      const applicationsData = await this.applicationService
        .getApplicationsByOpportunity(this.opportunityId())
        .toPromise();
      this.applications.set(applicationsData || []);

      // Load stats
      const statsData = await this.applicationService
        .getApplicationStats(this.opportunityId())
        .toPromise();
      this.stats.set(statsData || null);
    } catch (error) {
      console.error('Error loading application management data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Tab management
  setActiveTab(tabId: TabId) {
    this.activeTab.set(tabId);
  }

  // Filter methods
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  onStatusFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value);
  }

  onStageFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.stageFilter.set(target.value);
  }

  clearFilters() {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.stageFilter.set('');
  }

  // AI Assistant
  openAIAssistant(application?: FundingApplication) {
    this.selectedApplicationForAI.set(application || null);
    this.showAIModal.set(true);
  }

  closeAIModal() {
    this.showAIModal.set(false);
    this.selectedApplicationForAI.set(null);
  }

  // Application actions
  viewApplication(applicationId: string) {
    // Navigate to detailed application view instead of generic applications route
    console.log('Viewing application for ', applicationId);
    this.router.navigate(['/funder/applications', applicationId]);
  }

  async updateApplicationStatus(
    applicationId: string,
    status: FundingApplication['status']
  ) {
    try {
      await this.applicationService
        .updateApplicationStatus(applicationId, status)
        .toPromise();
      // Reload data to reflect changes
      await this.loadData();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  }

  async requestMoreInfo(application: FundingApplication) {
    const message = prompt('Enter your request for additional information:');
    if (message) {
      try {
        await this.applicationService
          .requestAdditionalInfo(application.id, message)
          .toPromise();
        await this.loadData();
      } catch (error) {
        console.error('Error requesting additional information:', error);
      }
    }
  }

  // Navigation
  goBack() {
    this.router.navigate(['/funder/dashboard']);
  }

  // Utility methods
  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '??';
  }

  getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'Draft',
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
    };
    return statusMap[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800',
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  formatStage(stage: string): string {
    return stage.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }

  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  getEmptyStateMessage(): string {
    switch (this.activeTab()) {
      case 'review-queue':
        return 'No applications are currently waiting for review.';
      case 'completed':
        return 'No applications have been completed yet.';
      default:
        return 'No applications found matching your criteria.';
    }
  }
}
