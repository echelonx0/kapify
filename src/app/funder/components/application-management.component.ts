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
  Calendar
} from 'lucide-angular';

import { UiButtonComponent, UiCardComponent } from '../../shared/components';
import { SidebarNavComponent } from '../../shared/components/sidebar-nav.component';
import { AIAssistantModalComponent } from './ai-assistant-modal.component'; 
import { AuthService } from '../../auth/production.auth.service';
import { SMEOpportunitiesService } from '../../funding/services/opportunities.service';
import { FundingOpportunity } from '../../shared/models/funder.models';
import { ApplicationManagementService, ApplicationStats, FundingApplication } from '../../applications/services/application-management.service';

type TabId = 'overview' | 'all' | 'review-queue' | 'completed';

interface TabData {
  id: TabId;
  label: string;
  count?: number;
  icon: any;
}

@Component({
  selector: 'app-application-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent,
    SidebarNavComponent,
    AIAssistantModalComponent
  ],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <sidebar-nav />
      <div class="ml-16">
        <main class="p-6 max-w-7xl mx-auto">
          <!-- Header -->
          <div class="mb-6">
            <div class="flex items-center space-x-4 mb-4">
              <ui-button variant="outline" (clicked)="goBack()">
                <lucide-icon [img]="ArrowLeftIcon" [size]="16" class="mr-2" />
                Back
              </ui-button>
              
              @if (opportunity()) {
                <div>
                  <h1 class="text-2xl font-bold text-neutral-900">Manage Applications</h1>
                  <p class="text-neutral-600">{{ opportunity()?.title }}</p>
                </div>
              }
            </div>

            <!-- Stats Cards -->
            @if (stats() && !isLoading()) {
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <ui-card class="p-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <lucide-icon [img]="FileTextIcon" [size]="20" class="text-blue-600" />
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-neutral-900">{{ stats()!.total }}</p>
                      <p class="text-sm text-neutral-600">Total Applications</p>
                    </div>
                  </div>
                </ui-card>

                <ui-card class="p-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <lucide-icon [img]="ClockIcon" [size]="20" class="text-amber-600" />
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-neutral-900">{{ stats()!.byStatus['under_review'] || 0 }}</p>
                      <p class="text-sm text-neutral-600">Under Review</p>
                    </div>
                  </div>
                </ui-card>

                <ui-card class="p-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-green-600" />
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-neutral-900">{{ stats()!.byStatus['approved'] || 0 }}</p>
                      <p class="text-sm text-neutral-600">Approved</p>
                    </div>
                  </div>
                </ui-card>

                <ui-card class="p-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-neutral-600" />
                    </div>
                    <div>
                      <p class="text-2xl font-bold text-neutral-900">{{ stats()!.averageProcessingTime }}</p>
                      <p class="text-sm text-neutral-600">Avg. Processing Days</p>
                    </div>
                  </div>
                </ui-card>
              </div>
            }
          </div>

          <!-- Tab Navigation -->
          <div class="mb-6">
            <div class="border-b border-neutral-200">
              <nav class="flex space-x-8">
                @for (tab of tabs(); track tab.id) {
                  <button
                    (click)="setActiveTab(tab.id)"
                    class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200"
                    [class]="activeTab() === tab.id 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'"
                  >
                    <div class="flex items-center space-x-2">
                      <lucide-icon [img]="tab.icon" [size]="16" />
                      <span>{{ tab.label }}</span>
                      @if (tab.count !== undefined) {
                        <span class="bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full text-xs">
                          {{ tab.count }}
                        </span>
                      }
                    </div>
                  </button>
                }
              </nav>
            </div>
          </div>

          <!-- Filters (shown on non-overview tabs) -->
          @if (activeTab() !== 'overview') {
            <div class="mb-6 bg-white rounded-lg border border-neutral-200 p-4">
              <div class="flex items-center space-x-4">
                <!-- Search -->
                <div class="flex-1 relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <lucide-icon [img]="SearchIcon" [size]="16" class="text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search applications..."
                    [value]="searchQuery()"
                    (input)="onSearchChange($event)"
                    class="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>

                <!-- Status Filter -->
                <select
                  [value]="statusFilter()"
                  (change)="onStatusFilterChange($event)"
                  class="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <!-- Stage Filter -->
                <select
                  [value]="stageFilter()"
                  (change)="onStageFilterChange($event)"
                  class="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All Stages</option>
                  <option value="initial_review">Initial Review</option>
                  <option value="due_diligence">Due Diligence</option>
                  <option value="investment_committee">Investment Committee</option>
                  <option value="documentation">Documentation</option>
                </select>

                @if (hasActiveFilters()) {
                  <ui-button variant="outline" (clicked)="clearFilters()">
                    Clear Filters
                  </ui-button>
                }
              </div>
            </div>
          }

          <!-- Loading State -->
          @if (isLoading()) {
            <div class="bg-white rounded-lg border border-neutral-200 p-12 text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p class="text-neutral-600">Loading applications...</p>
            </div>
          }

          <!-- Tab Content -->
          @if (!isLoading()) {
            <!-- Overview Tab -->
            @if (activeTab() === 'overview') {
              <div class="space-y-6">
                <!-- Recent Activity -->
                <ui-card>
                  <div class="p-6">
                    <h3 class="text-lg font-medium text-neutral-900 mb-4">Recent Activity</h3>
                    @if (recentApplications().length > 0) {
                      <div class="space-y-4">
                        @for (app of recentApplications(); track app.id) {
                          <div class="flex items-center space-x-4 p-3 bg-neutral-50 rounded-lg">
                            <div class="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                              <span class="text-primary-700 font-bold text-sm">{{ getInitials(app.applicant?.firstName, app.applicant?.lastName) }}</span>
                            </div>
                            <div class="flex-1">
                              <p class="font-medium text-neutral-900">{{ app.title }}</p>
                              <div class="flex items-center space-x-2 text-sm text-neutral-600">
                                <span>{{ app.applicant?.firstName }} {{ app.applicant?.lastName }}</span>
                                <span>•</span>
                                <span>{{ formatDate(app.updatedAt) }}</span>
                              </div>
                            </div>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                  [class]="getStatusBadgeClass(app.status)">
                              {{ getStatusText(app.status) }}
                            </span>
                          </div>
                        }
                      </div>
                    } @else {
                      <p class="text-neutral-500 text-center py-8">No recent activity</p>
                    }
                  </div>
                </ui-card>

                <!-- Quick Actions -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ui-card>
                    <div class="p-6">
                      <h3 class="text-lg font-medium text-neutral-900 mb-2">Applications Needing Review</h3>
                     
                      <p class="text-sm text-neutral-600 mb-4">New applications awaiting initial review</p>
                      <ui-button variant="primary" (clicked)="setActiveTab('review-queue')" class="w-full">
                        Review Applications
                      </ui-button>
                    </div>
                  </ui-card>

                  <ui-card>
                    <div class="p-6">
                      <h3 class="text-lg font-medium text-neutral-900 mb-2">AI Assistant</h3>
                      <p class="text-sm text-neutral-600 mb-4">Use AI to analyze applications, perform background checks, and conduct market research</p>
                      <ui-button variant="outline" (clicked)="openAIAssistant()" class="w-full">
                        <lucide-icon [img]="BotIcon" [size]="16" class="mr-2" />
                        Launch AI Assistant
                      </ui-button>
                    </div>
                  </ui-card>
                </div>
              </div>
            }

            <!-- Applications List (All, Review Queue, Completed tabs) -->
            @if (activeTab() !== 'overview') {
              <div class="space-y-4">
                @if (displayedApplications().length > 0) {
                  @for (application of displayedApplications(); track application.id) {
                    <ui-card class="hover:shadow-md transition-shadow">
                      <div class="p-6">
                        <div class="flex items-start justify-between">
                          <div class="flex-1">
                            <div class="flex items-center space-x-3 mb-2">
                              <h3 class="text-lg font-medium text-neutral-900">{{ application.title }}</h3>
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    [class]="getStatusBadgeClass(application.status)">
                                {{ getStatusText(application.status) }}
                              </span>
                              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                                {{ formatStage(application.stage) }}
                              </span>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p class="text-sm font-medium text-neutral-700">Applicant</p>
                                <p class="text-sm text-neutral-900">{{ application.applicant?.firstName }} {{ application.applicant?.lastName }}</p>
                              
                              </div>

                              <div>
                                <p class="text-sm font-medium text-neutral-700">Submitted</p>
                                <p class="text-sm text-neutral-900">{{ formatDate(application.submittedAt || application.createdAt) }}</p>
                              </div>

                              <div>
                                <p class="text-sm font-medium text-neutral-700">Last Updated</p>
                                <p class="text-sm text-neutral-900">{{ formatDate(application.updatedAt) }}</p>
                              </div>
                            </div>

                            @if (application.description) {
                              <p class="text-sm text-neutral-600 mb-4">{{ application.description }}</p>
                            }

                            @if (application.reviewNotes.length > 0) {
                              <div class="bg-neutral-50 rounded-lg p-3 mb-4">
                                <p class="text-xs font-medium text-neutral-700 mb-1">Latest Review Note</p>
                                <p class="text-xs text-neutral-600">{{ application.reviewNotes[application.reviewNotes.length - 1].note }}</p>
                              </div>
                            }
                          </div>

                          <!-- Actions -->
                          <div class="flex flex-col space-y-2 ml-6">
                            <ui-button variant="primary" (clicked)="viewApplication(application.id)">
                              <lucide-icon [img]="EyeIcon" [size]="16" class="mr-1" />
                              View Details
                            </ui-button>

                            <ui-button variant="outline" (clicked)="openAIAssistant(application)">
                              <lucide-icon [img]="BotIcon" [size]="16" class="mr-1" />
                              AI Analysis
                            </ui-button>

                            @if (application.status === 'submitted' || application.status === 'under_review') {
                              <div class="flex space-x-1">
                                <ui-button variant="outline" size="sm" (clicked)="updateApplicationStatus(application.id, 'approved')">
                                  <lucide-icon [img]="CheckCircleIcon" [size]="14" />
                                </ui-button>
                                <ui-button variant="outline" size="sm" (clicked)="updateApplicationStatus(application.id, 'rejected')">
                                  <lucide-icon [img]="XCircleIcon" [size]="14" />
                                </ui-button>
                                <ui-button variant="outline" size="sm" (clicked)="requestMoreInfo(application)">
                                  <lucide-icon [img]="MessageSquareIcon" [size]="14" />
                                </ui-button>
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    </ui-card>
                  }
                } @else {
                  <div class="bg-white rounded-lg border border-neutral-200 p-12 text-center">
                    <div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <lucide-icon [img]="FileTextIcon" [size]="24" class="text-neutral-400" />
                    </div>
                    <h3 class="text-lg font-medium text-neutral-900 mb-2">No applications found</h3>
                    <p class="text-neutral-600">{{ getEmptyStateMessage() }}</p>
                  </div>
                }
              </div>
            }
          }

          <!-- AI Assistant Modal -->
          @if (showAIModal()) {
            <app-ai-assistant-modal
              [application]="selectedApplicationForAI()"
              [isOpen]="showAIModal()"
              (closeRequested)="closeAIModal()"
            />
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .tab-active {
      @apply border-primary-500 text-primary-600;
    }
    .tab-inactive {
      @apply border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300;
    }
  `]
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
      { id: 'all' as TabId, label: 'All Applications', count: apps.length, icon: this.FileTextIcon },
      { 
        id: 'review-queue' as TabId, 
        label: 'Review Queue', 
        count: apps.filter(app => app.status === 'submitted' || app.status === 'under_review').length,
        icon: this.ClockIcon 
      },
      { 
        id: 'completed' as TabId, 
        label: 'Completed', 
        count: apps.filter(app => app.status === 'approved' || app.status === 'rejected').length,
        icon: this.CheckCircleIcon 
      }
    ];
  });

  filteredApplications = computed(() => {
    let filtered = this.applications();

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(app => 
        app.title.toLowerCase().includes(query) ||
        app.applicant?.firstName?.toLowerCase().includes(query) ||
        app.applicant?.lastName?.toLowerCase().includes(query) ||
        app.applicant?.companyName?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.statusFilter()) {
      filtered = filtered.filter(app => app.status === this.statusFilter());
    }

    // Stage filter
    if (this.stageFilter()) {
      filtered = filtered.filter(app => app.stage === this.stageFilter());
    }

    return filtered;
  });

  displayedApplications = computed(() => {
    const filtered = this.filteredApplications();
    
    switch (this.activeTab()) {
      case 'review-queue':
        return filtered.filter(app => 
          app.status === 'submitted' || app.status === 'under_review'
        );
      case 'completed':
        return filtered.filter(app => 
          app.status === 'approved' || app.status === 'rejected'
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

  private async loadData() {
    this.isLoading.set(true);
    
    try {
      // Load opportunity details
      const opportunityData = await this.opportunitiesService.getOpportunityById(this.opportunityId()).toPromise();
      this.opportunity.set(opportunityData || null);

      // Load applications
      const applicationsData = await this.applicationService.getApplicationsByOpportunity(this.opportunityId()).toPromise();
      this.applications.set(applicationsData || []);

      // Load stats
      const statsData = await this.applicationService.getApplicationStats(this.opportunityId()).toPromise();
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
    this.router.navigate(['/applications', applicationId]);
  }

  async updateApplicationStatus(applicationId: string, status: FundingApplication['status']) {
    try {
      await this.applicationService.updateApplicationStatus(applicationId, status).toPromise();
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
        await this.applicationService.requestAdditionalInfo(application.id, message).toPromise();
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
      withdrawn: 'Withdrawn'
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
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  formatStage(stage: string): string {
    return stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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