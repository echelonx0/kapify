// src/app/funder/components/application-management.component.ts
import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ArrowLeft,
  FileText,
  Search,
  Eye,
  Building2,
} from 'lucide-angular';

import { UiButtonComponent } from '../../../shared/components';
import { SidebarNavComponent } from '../../../shared/components/sidenav/sidebar-nav.component';
import { AIAssistantModalComponent } from '../../../features/ai/ai-assistant/ai-assistant-modal.component';
import { AuthService } from '../../../auth/services/production.auth.service';
import { SMEOpportunitiesService } from '../../../funding/services/opportunities.service';
import { ApplicationManagementService } from 'src/app/fund-seeking-orgs/services/application-management.service';

import { FundingApplication } from 'src/app/fund-seeking-orgs/models/application.models';
import { FundingOpportunity } from '../../create-opportunity/shared/funding.interfaces';
import {
  ApplicationListCardComponent,
  BaseApplicationCard,
} from '../../application-details/funder-applications/components/application-list-card/application-list-card.component';

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
    // ApplicationListCardComponent,
  ],
  templateUrl: 'application-management.component.html',
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
  FileTextIcon = FileText;
  SearchIcon = Search;
  EyeIcon = Eye;
  BuildingIcon = Building2;

  // State
  opportunityId = signal<string>('');
  opportunity = signal<FundingOpportunity | null>(null);
  applications = signal<FundingApplication[]>([]);
  isLoading = signal(true);

  // UI State
  showAIModal = signal(false);
  selectedApplicationForAI = signal<FundingApplication | null>(null);

  // Filters
  searchQuery = signal('');
  statusFilter = signal('');
  stageFilter = signal('');

  // Computed
  currentUser = computed(() => this.authService.user());

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

  displayedApplications = computed(() => this.filteredApplications());

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

  private extractAmount(formData: Record<string, any>): number {
    if (formData?.['coverInformation']?.requestedAmount) {
      return formData['coverInformation'].requestedAmount;
    }
    if (formData?.['requestedAmount']) {
      return formData['requestedAmount'];
    }
    if (formData?.['fundingInformation']?.requestedAmount) {
      return formData['fundingInformation'].requestedAmount;
    }
    return 0;
  }

  // Public wrapper for template use
  extractRequestedAmount(formData: Record<string, any> | undefined): number {
    return this.extractAmount(formData || {});
  }

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
      const opportunityData = await this.opportunitiesService
        .getOpportunityById(this.opportunityId())
        .toPromise();
      this.opportunity.set(opportunityData || null);

      const applicationsData = await this.applicationService
        .getApplicationsByOpportunity(this.opportunityId())
        .toPromise();
      this.applications.set(applicationsData || []);
    } catch (error) {
      console.error('Error loading application management data:', error);
    } finally {
      this.isLoading.set(false);
    }
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
      await this.loadData();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  }

  // Utility methods
  getStatusBadgeClass(status: string): string {
    const classMap: Record<string, string> = {
      submitted: 'bg-slate-100 text-slate-700 border border-slate-200',
      under_review: 'bg-amber-50 text-amber-700 border border-amber-200/50',
      approved: 'bg-green-50 text-green-700 border border-green-200/50',
      rejected: 'bg-red-50 text-red-700 border border-red-200/50',
    };
    return (
      classMap[status] || 'bg-slate-100 text-slate-700 border border-slate-200'
    );
  }

  formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      submitted: 'Submitted',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return statusMap[status] || status;
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  getEmptyStateMessage(): string {
    if (this.hasActiveFilters()) {
      return 'No applications match your filters.';
    }
    return 'No applications found.';
  }

  goBack() {
    window.history.back();
  }
}
