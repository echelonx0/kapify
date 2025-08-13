// // src/app/funder/funder-dashboard.component.ts
// import { Component } from '@angular/core';
// import { SidebarNavComponent } from '../shared/components/sidebar-nav.component';
// import { DashboardHeaderComponent } from '../shared/components/dashboard-header.component';

// @Component({
//   selector: 'app-funder-dashboard',
//   standalone: true,
//   imports: [SidebarNavComponent], 
//   template: `
//     <div class="min-h-screen bg-neutral-50">
//       <sidebar-nav />
//       <div class="ml-16">
 
//         <main class="p-6">
//           <h1 class="text-2xl font-bold text-neutral-900 mb-6">Funder Dashboard</h1>
//           <div class="bg-white rounded-lg border border-neutral-200 p-6 text-center">
//             <p class="text-neutral-600">Funder analytics and investment opportunities will appear here.</p>
//           </div>
//         </main>
//       </div>
//     </div>
//   `
// })
// export class FunderDashboardComponent {}


// src/app/funder/components/funder-dashboard.component.ts
import { Component, signal, OnInit, inject } from '@angular/core';
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
  ArrowRight
} from 'lucide-angular';
import { UiButtonComponent, UiCardComponent } from '../shared/components';
import { FunderOnboardingService, OnboardingState } from './services/funder-onboarding.service';
import { OpportunityManagementService } from './services/opportunity-management.service';
 
@Component({
  selector: 'app-funder-dashboard',
  standalone: true,
  imports: [
    CommonModule,
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
            <h1 class="text-2xl font-bold text-neutral-900">Funder Dashboard</h1>
            <p class="text-neutral-600 mt-1">Manage your funding opportunities and connect with SMEs</p>
          </div>
          
          @if (onboardingState()?.canCreateOpportunities) {
            <ui-button variant="primary" (clicked)="createOpportunity()">
              <lucide-icon [img]="PlusIcon" [size]="16" class="mr-2" />
              Create Opportunity
            </ui-button>
          }
        </div>

        <!-- Onboarding Status Card -->
        @if (onboardingState() && !onboardingState()!.isComplete) {
          <ui-card class="mb-8 border-l-4" [class]="getOnboardingCardClasses()">
            <div class="p-6">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  @if (onboardingState()!.canCreateOpportunities) {
                    <lucide-icon [img]="CheckCircleIcon" [size]="24" class="text-green-500" />
                  } @else {
                    <lucide-icon [img]="AlertCircleIcon" [size]="24" class="text-orange-500" />
                  }
                </div>
                <div class="ml-4 flex-1">
                  <h3 class="text-lg font-medium text-neutral-900 mb-2">
                    {{ getOnboardingTitle() }}
                  </h3>
                  <p class="text-neutral-600 mb-4">
                    {{ getOnboardingDescription() }}
                  </p>
                  
                  <!-- Progress Bar -->
                  <div class="mb-4">
                    <div class="flex items-center justify-between text-sm text-neutral-600 mb-2">
                      <span>Setup Progress</span>
                      <span>{{ onboardingState()!.completionPercentage }}%</span>
                    </div>
                    <div class="w-full bg-neutral-200 rounded-full h-2">
                      <div 
                        class="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        [style.width.%]="onboardingState()!.completionPercentage"
                      ></div>
                    </div>
                  </div>

                  <div class="flex items-center space-x-3">
                    @if (!onboardingState()!.canCreateOpportunities) {
                      <ui-button variant="primary" (clicked)="completeOnboarding()">
                        Complete Setup
                      </ui-button>
                    } @else {
                      <ui-button variant="outline" (clicked)="improveProfile()">
                        <lucide-icon [img]="Building2Icon" [size]="16" class="mr-2" />
                        Get Verified
                      </ui-button>
                    }
                  </div>
                </div>
              </div>
            </div>
          </ui-card>
        }

        <!-- Quick Stats -->
        @if (analytics()) {
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <ui-card class="p-6">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-blue-600" />
                </div>
                <div class="ml-4">
                  <p class="text-2xl font-bold text-neutral-900">{{ getActiveOpportunitiesCount() }}</p>
                  <p class="text-sm text-neutral-600">Active Opportunities</p>
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
                  <p class="text-sm text-neutral-600">Total Applications</p>
                </div>
              </div>
            </ui-card>

            <ui-card class="p-6">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <lucide-icon [img]="DollarSignIcon" [size]="20" class="text-purple-600" />
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
                  <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-orange-600" />
                </div>
                <div class="ml-4">
                  <p class="text-2xl font-bold text-neutral-900">{{ formatNumber(analytics()!.totalViews) }}</p>
                  <p class="text-sm text-neutral-600">Total Views</p>
                </div>
              </div>
            </ui-card>
          </div>
        }

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Recent Opportunities -->
          <div class="lg:col-span-2">
            <ui-card>
              <div class="p-6 border-b border-neutral-200">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-neutral-900">Recent Opportunities</h2>
                  <ui-button variant="outline" size="sm" (clicked)="viewAllOpportunities()">
                    View All
                  </ui-button>
                </div>
              </div>
              
              @if (recentOpportunities().length === 0) {
                <div class="p-12 text-center">
                  <div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <lucide-icon [img]="PlusIcon" [size]="24" class="text-neutral-400" />
                  </div>
                  <h3 class="text-lg font-medium text-neutral-900 mb-2">No opportunities yet</h3>
                  <p class="text-neutral-600 mb-4">Create your first funding opportunity to start connecting with SMEs.</p>
                  @if (onboardingState()?.canCreateOpportunities) {
                    <ui-button variant="primary" (clicked)="createOpportunity()">
                      <lucide-icon [img]="PlusIcon" [size]="16" class="mr-2" />
                      Create Opportunity
                    </ui-button>
                  } @else {
                    <ui-button variant="outline" (clicked)="completeOnboarding()">
                      Complete Setup First
                    </ui-button>
                  }
                </div>
              } @else {
                <div class="divide-y divide-neutral-200">
                  @for (opportunity of recentOpportunities(); track opportunity.id) {
                    <div class="p-6 hover:bg-neutral-50 transition-colors cursor-pointer" 
                         (click)="viewOpportunity(opportunity.id)">
                      <div class="flex items-center justify-between">
                        <div class="flex-1">
                          <h3 class="text-sm font-medium text-neutral-900 mb-1">{{ opportunity.title }}</h3>
                          <div class="flex items-center space-x-4 text-sm text-neutral-500">
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                  [class]="getStatusClasses(opportunity.status)">
                              {{ formatStatus(opportunity.status) }}
                            </span>
                            <span>{{ formatCurrency(opportunity.totalAvailable) }}</span>
                            <span>{{ opportunity.currentApplications }} applications</span>
                          </div>
                        </div>
                        <lucide-icon [img]="ArrowRightIcon" [size]="16" class="text-neutral-400" />
                      </div>
                    </div>
                  }
                </div>
              }
            </ui-card>
          </div>

          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Quick Actions -->
            <ui-card>
              <div class="p-6">
                <h3 class="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
                <div class="space-y-3">
                  @if (onboardingState()?.canCreateOpportunities) {
                    <ui-button variant="outline" class="w-full justify-start" (clicked)="createOpportunity()">
                      <lucide-icon [img]="PlusIcon" [size]="16" class="mr-3" />
                      Create Opportunity
                    </ui-button>
                  }
                  
                  <ui-button variant="outline" class="w-full justify-start" (clicked)="viewAllOpportunities()">
                    <lucide-icon [img]="TrendingUpIcon" [size]="16" class="mr-3" />
                    Manage Opportunities
                  </ui-button>
                  
                  <ui-button variant="outline" class="w-full justify-start" (clicked)="viewAnalytics()">
                    <lucide-icon [img]="TrendingUpIcon" [size]="16" class="mr-3" />
                    View Analytics
                  </ui-button>
                  
                  <ui-button variant="outline" class="w-full justify-start" (clicked)="editOrganization()">
                    <lucide-icon [img]="Building2Icon" [size]="16" class="mr-3" />
                    Organization Settings
                  </ui-button>
                </div>
              </div>
            </ui-card>

            <!-- Organization Info -->
            @if (onboardingState()?.organization) {
              <ui-card>
                <div class="p-6">
                  <h3 class="text-lg font-semibold text-neutral-900 mb-4">Organization</h3>
                  <div class="space-y-3">
                    <div>
                      <p class="font-medium text-neutral-900">{{ onboardingState()!.organization!.name }}</p>
                      <p class="text-sm text-neutral-600">{{ formatOrganizationType(onboardingState()!.organization!.organizationType) }}</p>
                    </div>
                    
                    @if (onboardingState()!.organization!.isVerified) {
                      <div class="flex items-center text-sm text-green-600">
                        <lucide-icon [img]="CheckCircleIcon" [size]="16" class="mr-2" />
                        Verified Organization
                      </div>
                    } @else {
                      <div class="flex items-center text-sm text-orange-600">
                        <lucide-icon [img]="AlertCircleIcon" [size]="16" class="mr-2" />
                        Pending Verification
                      </div>
                    }
                  </div>
                </div>
              </ui-card>
            }

            <!-- Recent Activity -->
            @if (analytics()?.recentActivity && analytics()!.recentActivity.length > 0) {
              <ui-card>
                <div class="p-6">
                  <h3 class="text-lg font-semibold text-neutral-900 mb-4">Recent Activity</h3>
                  <div class="space-y-3">
                    @for (activity of analytics()!.recentActivity.slice(0, 5); track activity.id) {
                      <div class="text-sm">
                        <p class="text-neutral-900">{{ activity.description }}</p>
                        <p class="text-neutral-500">{{ getTimeAgo(activity.timestamp) }}</p>
                      </div>
                    }
                  </div>
                </div>
              </ui-card>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class FunderDashboardComponent implements OnInit {
  private router = inject(Router);
  private onboardingService = inject(FunderOnboardingService);
  private managementService = inject(OpportunityManagementService);
  private destroy$ = new Subject<void>();

  // Icons
  PlusIcon = Plus;
  TrendingUpIcon = TrendingUp;
  UsersIcon = Users;
  DollarSignIcon = DollarSign;
  Building2Icon = Building2;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  ArrowRightIcon = ArrowRight;

  // State
  onboardingState = signal<OnboardingState | null>(null);
  analytics = signal<any>(null);
  recentOpportunities = signal<any[]>([]);

  ngOnInit() {
    this.loadDashboardData();
    this.setupSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData() {
    // Load onboarding status
    this.onboardingService.checkOnboardingStatus().subscribe();
    
    // Load analytics and opportunities if organization exists
    this.managementService.loadAnalytics().subscribe();
    this.managementService.loadUserOpportunities().subscribe();
  }

  private setupSubscriptions() {
    // Subscribe to onboarding state
    this.onboardingService.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.onboardingState.set(state);
      });

    // Subscribe to analytics
    this.managementService.analytics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(analytics => {
        this.analytics.set(analytics);
      });

    // Subscribe to opportunities
    this.managementService.opportunities$
      .pipe(takeUntil(this.destroy$))
      .subscribe(opportunities => {
        // Show most recent 5 opportunities
        this.recentOpportunities.set(opportunities.slice(0, 5));
      });
  }

  // Navigation methods
  createOpportunity() {
    if (this.onboardingState()?.canCreateOpportunities) {
      this.router.navigate(['/funder/opportunities/create']);
    } else {
      this.completeOnboarding();
    }
  }

  viewAllOpportunities() {
    this.router.navigate(['/funder/opportunities']);
  }

  viewOpportunity(opportunityId: string) {
    this.router.navigate(['/funder/opportunities', opportunityId]);
  }

  viewAnalytics() {
    this.router.navigate(['/funder/analytics']);
  }

  editOrganization() {
    this.router.navigate(['/funder/onboarding']);
  }

  completeOnboarding() {
    this.router.navigate(['/funder/onboarding']);
  }

  improveProfile() {
    this.router.navigate(['/funder/onboarding'], { 
      fragment: 'verification' 
    });
  }

  // Helper methods
  getOnboardingCardClasses(): string {
    const state = this.onboardingState();
    if (!state) return 'border-l-neutral-300';
    
    if (state.canCreateOpportunities) {
      return 'border-l-green-500 bg-green-50';
    } else {
      return 'border-l-orange-500 bg-orange-50';
    }
  }

  getOnboardingTitle(): string {
    const state = this.onboardingState();
    if (!state) return '';
    
    if (!state.organization) {
      return 'Complete Your Organization Setup';
    } else if (!state.canCreateOpportunities) {
      return 'Complete Organization Details';
    } else if (!state.isComplete) {
      return 'Get Your Organization Verified';
    }
    return '';
  }

  getOnboardingDescription(): string {
    const state = this.onboardingState();
    if (!state) return '';
    
    if (!state.organization) {
      return 'Set up your organization profile to start creating funding opportunities and connecting with SMEs.';
    } else if (!state.canCreateOpportunities) {
      return 'Add more details to your organization profile to enable opportunity creation.';
    } else if (!state.isComplete) {
      return 'Get verified to build trust with SMEs and access premium features.';
    }
    return '';
  }

  getActiveOpportunitiesCount(): number {
    return this.recentOpportunities().filter(opp => opp.status === 'active').length;
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

  formatStatus(status: string): string {
    const statuses: Record<string, string> = {
      draft: 'Draft',
      active: 'Active',
      paused: 'Paused',
      closed: 'Closed'
    };
    return statuses[status] || status;
  }

  formatOrganizationType(type: string): string {
    const types: Record<string, string> = {
      investment_fund: 'Investment Fund',
      venture_capital: 'Venture Capital',
      private_equity: 'Private Equity',
      bank: 'Bank',
      government: 'Government Agency',
      ngo: 'NGO/Non-Profit'
    };
    return types[type] || type;
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
    
    return new Date(date).toLocaleDateString();
  }
}

// Update the backend service to link opportunities to organization
// src/app/funder/services/funder-opportunity-backend.service.ts - ADD THIS METHOD
