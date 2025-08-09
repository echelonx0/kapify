// src/app/applications/applications-home.component.ts
import { Component, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Search, Filter, Plus, Eye, Calendar, DollarSign } from 'lucide-angular';
import { UiCardComponent, UiButtonComponent, UiStatusBadgeComponent } from '../../shared/components';
import { Application, ApplicationStatus } from '../../shared/models/application.models';
import { ApplicationService } from '../services/application.service';
 

@Component({
  selector: 'app-applications-home',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    LucideAngularModule,
    UiCardComponent,
    UiButtonComponent,
    UiStatusBadgeComponent
  ],
  template: `
    <!-- Page Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900">Applications</h1>
          <p class="text-neutral-600 mt-1">
            Manage and track your funding applications
          </p>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center space-x-3">
          <ui-button
            variant="outline"
            (clicked)="toggleFilters()"
          >
            <lucide-icon [img]="FilterIcon" [size]="16" class="mr-2" />
            Filters
          </ui-button>
          
          <ui-button
            variant="primary"
            (clicked)="createNewApplication()"
          >
            <lucide-icon [img]="PlusIcon" [size]="16" class="mr-2" />
            New Application
          </ui-button>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <ui-card>
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="EyeIcon" [size]="16" class="text-blue-600" />
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Total Applications</p>
            <p class="text-2xl font-bold text-neutral-900">{{ getTotalApplications() }}</p>
          </div>
        </div>
      </ui-card>

      <ui-card>
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="CalendarIcon" [size]="16" class="text-yellow-600" />
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Under Review</p>
            <p class="text-2xl font-bold text-neutral-900">{{ getUnderReviewCount() }}</p>
          </div>
        </div>
      </ui-card>

      <ui-card>
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="DollarSignIcon" [size]="16" class="text-green-600" />
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Approved</p>
            <p class="text-2xl font-bold text-neutral-900">{{ getApprovedCount() }}</p>
          </div>
        </div>
      </ui-card>

      <ui-card>
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="DollarSignIcon" [size]="16" class="text-primary-600" />
            </div>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-neutral-600">Total Requested</p>
            <p class="text-xl font-bold text-neutral-900">R{{ formatCurrency(getTotalRequested()) }}</p>
          </div>
        </div>
      </ui-card>
    </div>

    <!-- Search and Filters -->
    <div class="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
      <div class="flex items-center space-x-4">
        <!-- Search -->
        <div class="flex-1 relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <lucide-icon [img]="SearchIcon" [size]="16" class="text-neutral-400" />
          </div>
          <input
            type="text"
            [value]="searchTerm()"
            (input)="onSearchChange($event)"
            placeholder="Search applications..."
            class="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:placeholder-neutral-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        <!-- Status Filter -->
        @if (showFilters()) {
          <select
            [value]="statusFilter()"
            (change)="onFilterChange($event)"
            class="block px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        }
      </div>
    </div>

    <!-- Applications List -->
    <div class="space-y-4">
      @if (isLoading()) {
        <div class="text-center py-12">
          <div class="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-neutral-600 mt-2">Loading applications...</p>
        </div>
      } @else if (filteredApplications().length === 0) {
        <ui-card>
          <div class="text-center py-12">
            <lucide-icon [img]="EyeIcon" [size]="48" class="text-neutral-300 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-neutral-900 mb-2">No applications found</h3>
            <p class="text-neutral-500 mb-6">
              @if (searchTerm() || statusFilter()) {
                Try adjusting your search or filters
              } @else {
                Get started by creating your first application
              }
            </p>
            @if (!searchTerm() && !statusFilter()) {
              <ui-button variant="primary" (clicked)="createNewApplication()">
                <lucide-icon [img]="PlusIcon" [size]="16" class="mr-2" />
                Create Application
              </ui-button>
            }
          </div>
        </ui-card>
      } @else {
        @for (application of filteredApplications(); track application.id) {
          <ui-card [hover]="true" (click)="viewApplication(application.id)">
            <div class="flex items-center justify-between">
              <!-- Application Info -->
              <div class="flex-1">
                <div class="flex items-center space-x-3 mb-2">
                  <h3 class="text-lg font-semibold text-neutral-900">
                    {{ application.title }}
                  </h3>
                  <ui-status-badge 
                    [text]="getStatusText(application.status)"
                    [color]="getStatusColor(application.status)"
                  />
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600">
                  <div>
                    <span class="font-medium">Application ID:</span>
                    {{ application.applicationNumber }}
                  </div>
                  <div>
                    <span class="font-medium">Amount:</span>
                    {{ application.currency }} {{ formatNumber(application.requestedAmount) }}
                  </div>
                  <div>
                    <span class="font-medium">Submitted:</span>
                    {{ formatDate(application.submittedAt) }}
                  </div>
                </div>
                
                <p class="text-neutral-600 mt-2 line-clamp-2">
                  {{ application.description }}
                </p>
              </div>

              <!-- Actions -->
              <div class="flex items-center space-x-2 ml-6">
                <ui-button
                  variant="outline"
                  size="sm"
                  (clicked)="viewApplication(application.id)"
                >
                  <lucide-icon [img]="EyeIcon" [size]="14" class="mr-1" />
                  View
                </ui-button>
              </div>
            </div>
          </ui-card>
        }
      }
    </div>

    <!-- Pagination -->
    @if (filteredApplications().length > 0 && totalPages() > 1) {
      <div class="flex items-center justify-between mt-8">
        <div class="text-sm text-neutral-700">
          Showing {{ getShowingStart() }} to {{ getShowingEnd() }} of {{ filteredApplications().length }} applications
        </div>
        
        <div class="flex items-center space-x-2">
          <ui-button
            variant="outline"
            size="sm"
            [disabled]="currentPage() === 1"
            (clicked)="goToPage(currentPage() - 1)"
          >
            Previous
          </ui-button>
          
          @for (page of getPageNumbers(); track page) {
            <ui-button
              [variant]="page === currentPage() ? 'primary' : 'ghost'"
              size="sm"
              (clicked)="goToPage(page)"
            >
              {{ page }}
            </ui-button>
          }
          
          <ui-button
            variant="outline"
            size="sm"
            [disabled]="currentPage() === totalPages()"
            (clicked)="goToPage(currentPage() + 1)"
          >
            Next
          </ui-button>
        </div>
      </div>
    }
  `
})
export class ApplicationsHomeComponent implements OnInit {
  // Signals
  applications = signal<Application[]>([]);
  isLoading = signal(true);
  searchTerm = signal('');
  statusFilter = signal('');
  showFilters = signal(false);
  currentPage = signal(1);
  pageSize = signal(10);

  // Icons
  SearchIcon = Search;
  FilterIcon = Filter;
  PlusIcon = Plus;
  EyeIcon = Eye;
  CalendarIcon = Calendar;
  DollarSignIcon = DollarSign;

  // Computed
  filteredApplications = signal<Application[]>([]);
  totalPages = signal(1);

  constructor(
    private applicationService: ApplicationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadApplications();
  }

  // Navigation
  viewApplication(applicationId: string) {
    this.router.navigate(['/applications', applicationId]);
  }

  createNewApplication() {
    this.router.navigate(['/applications', 'new']);
  }

  // Filters and Search
  toggleFilters() {
    this.showFilters.update(show => !show);
  }

  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.applyFilters();
  }

  onFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value);
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = this.applications();

    // Apply search filter
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(app => 
        app.title.toLowerCase().includes(term) ||
        app.applicationNumber.toLowerCase().includes(term) ||
        app.description.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (this.statusFilter()) {
      filtered = filtered.filter(app => app.status === this.statusFilter());
    }

    this.filteredApplications.set(filtered);
    this.updatePagination();
    this.currentPage.set(1);
  }

  // Pagination
  goToPage(page: number) {
    this.currentPage.set(page);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
      pages.push(i);
    }
    
    return pages;
  }

  getShowingStart(): number {
    return ((this.currentPage() - 1) * this.pageSize()) + 1;
  }

  getShowingEnd(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.filteredApplications().length);
  }

  private updatePagination() {
    const total = Math.ceil(this.filteredApplications().length / this.pageSize());
    this.totalPages.set(total);
  }

  // Stats
  getTotalApplications(): number {
    return this.applications().length;
  }

  getUnderReviewCount(): number {
    return this.applications().filter(app => 
      app.status === 'under_review' || app.status === 'due_diligence'
    ).length;
  }

  getApprovedCount(): number {
    return this.applications().filter(app => app.status === 'approved').length;
  }

  getTotalRequested(): number {
    return this.applications().reduce((total, app) => total + app.requestedAmount, 0);
  }

  // Formatting helpers
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(date?: Date): string {
    if (!date) return 'Not specified';
    return new Intl.DateTimeFormat('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  }

  // Status helpers
  getStatusText(status: ApplicationStatus): string {
    const statusMap: Record<ApplicationStatus, string> = {
      'draft': 'Draft',
      'submitted': 'Submitted',
      'under_review': 'Under Review',
      'due_diligence': 'Due Diligence',
      'investment_committee': 'Investment Committee',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'funded': 'Funded',
      'withdrawn': 'Withdrawn'
    };
    return statusMap[status] || status;
  }

  getStatusColor(status: ApplicationStatus): 'primary' | 'success' | 'warning' | 'error' {
    const colorMap: Record<ApplicationStatus, 'primary' | 'success' | 'warning' | 'error'> = {
      'draft': 'warning',
      'submitted': 'primary',
      'under_review': 'primary',
      'due_diligence': 'primary',
      'investment_committee': 'warning',
      'approved': 'success',
      'rejected': 'error',
      'funded': 'success',
      'withdrawn': 'error'
    };
    return colorMap[status] || 'primary';
  }

  private loadApplications() {
    this.applicationService.getApplications().subscribe({
      next: (applications: Application[]) => {
        this.applications.set(applications);
        this.filteredApplications.set(applications);
        this.updatePagination();
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load applications:', error);
        this.isLoading.set(false);
      }
    });
  }
}