// src/app/funder/components/opportunity-management-dashboard.component.ts
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  LucideAngularModule, 
  Plus, 
  Eye, 
  Edit, 
  Pause, 
  Play, 
  Copy, 
  Trash2,
  MoreHorizontal,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Filter,
  Search,
  Calendar
} from 'lucide-angular';
import { UiButtonComponent, UiCardComponent } from '../../shared/components';
import { OpportunityManagementService } from '../services/opportunity-management.service';

interface OpportunityListItem {
  id: string;
  title: string;
  status: string;
  fundingType: string;
  totalAvailable: number;
  amountDeployed: number;
  currentApplications: number;
  maxApplications?: number;
  viewCount: number;
  applicationCount: number;
  conversionRate: number;
  publishedAt?: Date;
  updatedAt: Date;
}

interface OpportunityAnalytics {
  totalViews: number;
  totalApplications: number;
  averageConversionRate: number;
  topPerformingOpportunities: OpportunityListItem[];
  recentActivity: any[];
  monthlyStats: any[];
}

@Component({
  selector: 'app-opportunity-management-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiButtonComponent,
    UiCardComponent,
    LucideAngularModule
  ],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <div class="max-w-7xl mx-auto px-4 py-8">
        <!-- Header -->
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-2xl font-bold text-neutral-900">Funding Opportunities</h1>
            <p class="text-neutral-600 mt-1">Manage your investment opportunities and track performance</p>
          </div>
          
          <ui-button variant="primary" (clicked)="createNewOpportunity()">
            <lucide-icon [img]="PlusIcon" [size]="16" class="mr-2" />
            Create Opportunity
          </ui-button>
        </div>

        <!-- Analytics Cards -->
        @if (analytics()) {
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <ui-card class="p-6">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="EyeIcon" [size]="20" class="text-blue-600" />
                </div>
                <div class="ml-4">
                  <p class="text-2xl font-bold text-neutral-900">{{ formatNumber(analytics()!.totalViews) }}</p>
                  <p class="text-sm text-neutral-600">Total Views</p>
                </div>
              </div>
            </ui-card>

            <ui-card class="p-6">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="UsersIcon" [size]="20" class="text-green-600" />
                </div>
                <div class="ml-4">
                  <p class="text-2xl font-bold text-neutral-900">{{ formatNumber(analytics()!.totalApplications) }}</p>
                  <p class="text-sm text-neutral-600">Applications</p>
                </div>
              </div>
            </ui-card>

            <ui-card class="p-6">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-purple-600" />
                </div>
                <div class="ml-4">
                  <p class="text-2xl font-bold text-neutral-900">{{ analytics()!.averageConversionRate.toFixed(1) }}%</p>
                  <p class="text-sm text-neutral-600">Conversion Rate</p>
                </div>
              </div>
            </ui-card>

            <ui-card class="p-6">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="DollarSignIcon" [size]="20" class="text-orange-600" />
                </div>
                <div class="ml-4">
                  <p class="text-2xl font-bold text-neutral-900">{{ getActiveOpportunitiesCount() }}</p>
                  <p class="text-sm text-neutral-600">Active Opportunities</p>
                </div>
              </div>
            </ui-card>
          </div>
        }

        <!-- Filters and Search -->
        <ui-card class="p-4 mb-6">
          <div class="flex items-center space-x-4">
            <!-- Search -->
            <div class="flex-1 relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <lucide-icon [img]="SearchIcon" [size]="16" class="text-neutral-400" />
              </div>
              <input
                type="text"
                placeholder="Search opportunities..."
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
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>

            <!-- Funding Type Filter -->
            <select
              [value]="typeFilter()"
              (change)="onTypeFilterChange($event)"
              class="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="equity">Equity</option>
              <option value="debt">Debt</option>
              <option value="mezzanine">Mezzanine</option>
              <option value="grant">Grant</option>
            </select>

            <!-- Bulk Actions -->
            @if (selectedOpportunities().length > 0) {
              <div class="flex items-center space-x-2">
                <span class="text-sm text-neutral-600">{{ selectedOpportunities().length }} selected</span>
                
                <ui-button variant="outline" size="sm" (clicked)="bulkActivate()">
                  <lucide-icon [img]="PlayIcon" [size]="14" class="mr-1" />
                  Activate
                </ui-button>
                
                <ui-button variant="outline" size="sm" (clicked)="bulkPause()">
                  <lucide-icon [img]="PauseIcon" [size]="14" class="mr-1" />
                  Pause
                </ui-button>
              </div>
            }
          </div>
        </ui-card>

        <!-- Opportunities Table -->
        <ui-card>
          @if (managementService.isLoading()) {
            <div class="p-12 text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p class="text-neutral-600">Loading opportunities...</p>
            </div>
          } @else if (filteredOpportunities().length === 0) {
            <div class="p-12 text-center">
              <div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <lucide-icon [img]="SearchIcon" [size]="24" class="text-neutral-400" />
              </div>
              <h3 class="text-lg font-medium text-neutral-900 mb-2">No opportunities found</h3>
              <p class="text-neutral-600 mb-4">
                @if (searchQuery() || statusFilter() || typeFilter()) {
                  Try adjusting your search criteria or filters.
                } @else {
                  Create your first funding opportunity to get started.
                }
              </p>
              @if (!searchQuery() && !statusFilter() && !typeFilter()) {
                <ui-button variant="primary" (clicked)="createNewOpportunity()">
                  <lucide-icon [img]="PlusIcon" [size]="16" class="mr-2" />
                  Create Opportunity
                </ui-button>
              }
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-neutral-200">
                <thead class="bg-neutral-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        [checked]="isAllSelected()"
                        [indeterminate]="isPartiallySelected()"
                        (change)="toggleSelectAll($event)"
                        class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                      />
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Opportunity
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Type & Status
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Funding
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th class="relative px-6 py-3">
                      <span class="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-neutral-200">
                  @for (opportunity of filteredOpportunities(); track opportunity.id) {
                    <tr [class]="isSelected(opportunity.id) ? 'bg-primary-50' : 'hover:bg-neutral-50'">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          [checked]="isSelected(opportunity.id)"
                          (change)="toggleSelection(opportunity.id, $event)"
                          class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                        />
                      </td>
                      
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div class="text-sm font-medium text-neutral-900 cursor-pointer hover:text-primary-600"
                               (click)="viewOpportunity(opportunity.id)">
                            {{ opportunity.title }}
                          </div>
                          <div class="text-sm text-neutral-500">
                            {{ formatCurrency(opportunity.totalAvailable) }} available
                          </div>
                        </div>
                      </td>
                      
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex flex-col space-y-1">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                [class]="getFundingTypeClasses(opportunity.fundingType)">
                            {{ formatFundingType(opportunity.fundingType) }}
                          </span>
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                [class]="getStatusClasses(opportunity.status)">
                            {{ formatStatus(opportunity.status) }}
                          </span>
                        </div>
                      </td>
                      
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        <div class="space-y-1">
                          <div class="flex items-center">
                            <lucide-icon [img]="EyeIcon" [size]="12" class="text-neutral-400 mr-1" />
                            {{ formatNumber(opportunity.viewCount) }} views
                          </div>
                          <div class="flex items-center">
                            <lucide-icon [img]="UsersIcon" [size]="12" class="text-neutral-400 mr-1" />
                            {{ opportunity.currentApplications }}/{{ opportunity.maxApplications || '∞' }} apps
                          </div>
                          <div class="text-xs text-neutral-500">
                            {{ opportunity.conversionRate.toFixed(1) }}% conversion
                          </div>
                        </div>
                      </td>
                      
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                        <div class="space-y-1">
                          <div>{{ formatCurrency(opportunity.amountDeployed) }}</div>
                          <div class="text-xs text-neutral-500">deployed</div>
                          <div class="w-full bg-neutral-200 rounded-full h-1">
                            <div 
                              class="bg-primary-500 h-1 rounded-full transition-all duration-300"
                              [style.width.%]="getDeploymentPercentage(opportunity)"
                            ></div>
                          </div>
                        </div>
                      </td>
                      
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                        {{ getTimeAgo(opportunity.updatedAt) }}
                      </td>
                      
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex items-center space-x-2">
                          <!-- Quick Actions -->
                          <button
                            (click)="viewOpportunity(opportunity.id)"
                            class="text-neutral-400 hover:text-neutral-600 transition-colors"
                            title="View Details"
                          >
                            <lucide-icon [img]="EyeIcon" [size]="16" />
                          </button>
                          
                          <button
                            (click)="editOpportunity(opportunity.id)"
                            class="text-neutral-400 hover:text-neutral-600 transition-colors"
                            title="Edit"
                          >
                            <lucide-icon [img]="EditIcon" [size]="16" />
                          </button>
                          
                          @if (opportunity.status === 'active') {
                            <button
                              (click)="pauseOpportunity(opportunity.id)"
                              class="text-orange-400 hover:text-orange-600 transition-colors"
                              title="Pause"
                            >
                              <lucide-icon [img]="PauseIcon" [size]="16" />
                            </button>
                          } @else if (opportunity.status === 'paused' || opportunity.status === 'draft') {
                            <button
                              (click)="activateOpportunity(opportunity.id)"
                              class="text-green-400 hover:text-green-600 transition-colors"
                              title="Activate"
                            >
                              <lucide-icon [img]="PlayIcon" [size]="16" />
                            </button>
                          }
                          
                          <!-- More Actions Dropdown -->
                          <div class="relative">
                            <button
                              (click)="toggleDropdown(opportunity.id)"
                              class="text-neutral-400 hover:text-neutral-600 transition-colors"
                            >
                              <lucide-icon [img]="MoreHorizontalIcon" [size]="16" />
                            </button>
                            
                            @if (activeDropdown() === opportunity.id) {
                              <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-neutral-200">
                                <div class="py-1">
                                  <button
                                    (click)="duplicateOpportunity(opportunity.id)"
                                    class="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                                  >
                                    <lucide-icon [img]="CopyIcon" [size]="14" class="inline mr-2" />
                                    Duplicate
                                  </button>
                                  
                                  @if (opportunity.status !== 'closed') {
                                    <button
                                      (click)="closeOpportunity(opportunity.id)"
                                      class="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                                    >
                                      <lucide-icon [img]="Trash2Icon" [size]="14" class="inline mr-2" />
                                      Close Permanently
                                    </button>
                                  }
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </ui-card>
      </div>
    </div>
  `
})
export class OpportunityManagementDashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  protected managementService = inject(OpportunityManagementService);
  private destroy$ = new Subject<void>();

  // Icons
  PlusIcon = Plus;
  EyeIcon = Eye;
  EditIcon = Edit;
  PauseIcon = Pause;
  PlayIcon = Play;
  CopyIcon = Copy;
  Trash2Icon = Trash2;
  MoreHorizontalIcon = MoreHorizontal;
  TrendingUpIcon = TrendingUp;
  UsersIcon = Users;
  DollarSignIcon = DollarSign;
  BarChart3Icon = BarChart3;
  FilterIcon = Filter;
  SearchIcon = Search;
  CalendarIcon = Calendar;

  // State
  opportunities = signal<OpportunityListItem[]>([]);
  analytics = signal<OpportunityAnalytics | null>(null);
  
  // Filters
  searchQuery = signal('');
  statusFilter = signal('');
  typeFilter = signal('');
  
  // Selection
  selectedOpportunities = signal<string[]>([]);
  activeDropdown = signal<string | null>(null);

  // Computed
  filteredOpportunities = signal<OpportunityListItem[]>([]);

  ngOnInit() {
    this.loadData();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData() {
    this.managementService.loadUserOpportunities().subscribe();
    this.managementService.loadAnalytics().subscribe();
  }

  private setupSubscriptions() {
    // Subscribe to opportunities data
    this.managementService.opportunities$
      .pipe(takeUntil(this.destroy$))
      .subscribe(opportunities => {
        this.opportunities.set(opportunities);
        this.applyFilters();
      });

    // Subscribe to analytics data
    this.managementService.analytics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(analytics => {
        this.analytics.set(analytics);
      });
  }

  // Filter methods
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.applyFilters();
  }

  onStatusFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.statusFilter.set(target.value);
    this.applyFilters();
  }

  onTypeFilterChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.typeFilter.set(target.value);
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = this.opportunities();

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(opp => 
        opp.title.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.statusFilter()) {
      filtered = filtered.filter(opp => opp.status === this.statusFilter());
    }

    // Type filter
    if (this.typeFilter()) {
      filtered = filtered.filter(opp => opp.fundingType === this.typeFilter());
    }

    this.filteredOpportunities.set(filtered);
  }

  // Selection methods
  toggleSelection(opportunityId: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const selected = this.selectedOpportunities();
    
    if (target.checked) {
      this.selectedOpportunities.set([...selected, opportunityId]);
    } else {
      this.selectedOpportunities.set(selected.filter(id => id !== opportunityId));
    }
  }

  toggleSelectAll(event: Event) {
    const target = event.target as HTMLInputElement;
    
    if (target.checked) {
      const allIds = this.filteredOpportunities().map(opp => opp.id);
      this.selectedOpportunities.set(allIds);
    } else {
      this.selectedOpportunities.set([]);
    }
  }

  isSelected(opportunityId: string): boolean {
    return this.selectedOpportunities().includes(opportunityId);
  }

  isAllSelected(): boolean {
    const filtered = this.filteredOpportunities();
    const selected = this.selectedOpportunities();
    return filtered.length > 0 && filtered.every(opp => selected.includes(opp.id));
  }

  isPartiallySelected(): boolean {
    const filtered = this.filteredOpportunities();
    const selected = this.selectedOpportunities();
    const hasSelection = selected.length > 0;
    const hasFiltered = filtered.length > 0;
    const isComplete = filtered.every(opp => selected.includes(opp.id));
    
    return hasSelection && hasFiltered && !isComplete;
  }

  // Action methods
  createNewOpportunity() {
    this.router.navigate(['/funder/opportunities/create']);
  }

  viewOpportunity(opportunityId: string) {
    this.managementService.incrementViewCount(opportunityId).subscribe();
    this.router.navigate(['/funder/opportunities', opportunityId]);
  }

  editOpportunity(opportunityId: string) {
    this.router.navigate(['/funder/opportunities', opportunityId, 'edit']);
  }

  activateOpportunity(opportunityId: string) {
    this.managementService.updateOpportunityStatus({
      opportunityId,
      newStatus: 'active'
    }).subscribe({
      next: () => console.log('Opportunity activated'),
      error: (error) => console.error('Failed to activate:', error)
    });
  }

  pauseOpportunity(opportunityId: string) {
    this.managementService.updateOpportunityStatus({
      opportunityId,
      newStatus: 'paused'
    }).subscribe({
      next: () => console.log('Opportunity paused'),
      error: (error) => console.error('Failed to pause:', error)
    });
  }

  closeOpportunity(opportunityId: string) {
    this.managementService.updateOpportunityStatus({
      opportunityId,
      newStatus: 'closed'
    }).subscribe({
      next: () => console.log('Opportunity closed'),
      error: (error) => console.error('Failed to close:', error)
    });
  }

  duplicateOpportunity(opportunityId: string) {
    this.managementService.duplicateOpportunity(opportunityId).subscribe({
      next: (result) => {
        console.log('Opportunity duplicated');
        this.router.navigate(['/funder/opportunities', result.newOpportunityId, 'edit']);
      },
      error: (error) => console.error('Failed to duplicate:', error)
    });
  }

  // Bulk actions
  bulkActivate() {
    this.managementService.bulkUpdateStatus(this.selectedOpportunities(), 'active').subscribe({
      next: () => {
        this.selectedOpportunities.set([]);
        console.log('Opportunities activated');
      },
      error: (error) => console.error('Bulk activation failed:', error)
    });
  }

  bulkPause() {
    this.managementService.bulkUpdateStatus(this.selectedOpportunities(), 'paused').subscribe({
      next: () => {
        this.selectedOpportunities.set([]);
        console.log('Opportunities paused');
      },
      error: (error) => console.error('Bulk pause failed:', error)
    });
  }

  // Dropdown management
  toggleDropdown(opportunityId: string) {
    this.activeDropdown.set(
      this.activeDropdown() === opportunityId ? null : opportunityId
    );
  }

  // Utility methods
  getActiveOpportunitiesCount(): number {
    return this.opportunities().filter(opp => opp.status === 'active').length;
  }

  getDeploymentPercentage(opportunity: OpportunityListItem): number {
    if (opportunity.totalAvailable === 0) return 0;
    return Math.min((opportunity.amountDeployed / opportunity.totalAvailable) * 100, 100);
  }

  getFundingTypeClasses(type: string): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (type) {
      case 'equity':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'debt':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'mezzanine':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'grant':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-neutral-100 text-neutral-800`;
    }
  }

  getStatusClasses(status: string): string {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'draft':
        return `${baseClasses} bg-neutral-100 text-neutral-800`;
      case 'paused':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'closed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-neutral-100 text-neutral-800`;
    }
  }

  formatFundingType(type: string): string {
    const types: Record<string, string> = {
      equity: 'Equity',
      debt: 'Debt',
      mezzanine: 'Mezzanine',
      grant: 'Grant',
      convertible: 'Convertible'
    };
    return types[type] || type;
  }

  formatStatus(status: string): string {
    const statuses: Record<string, string> = {
      draft: 'Draft',
      active: 'Active',
      paused: 'Paused',
      closed: 'Closed'
    };
    return statuses[status] || status;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('en-ZA').format(num);
  }

  getTimeAgo(date: Date): string {
    const now = new Date().getTime();
    const past = new Date(date).getTime();
    const diffMinutes = Math.floor((now - past) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
    
    return new Date(date).toLocaleDateString();
  }
}