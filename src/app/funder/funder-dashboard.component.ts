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
import { UiButtonComponent } from '../shared/components';
import { FunderOnboardingService, OnboardingState } from './services/funder-onboarding.service';
import { OpportunityManagementService } from './services/opportunity-management.service';
 
@Component({
  selector: 'app-funder-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    UiButtonComponent,
   
    LucideAngularModule
  ],
  templateUrl: 'funder-dashboard.component.html'
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
    this.router.navigate(['/funding/opportunities']);
  }

  viewOpportunity(opportunityId: string) {
    this.router.navigate(['/funding/opportunities', opportunityId]);
  }

  viewAnalytics() {
    // this.router.navigate(['/funder/analytics']);
  }

  editOrganization() {
    this.router.navigate(['/funder/onboarding']);
  }

  completeOnboarding() {
    console.log('...Completing')
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
