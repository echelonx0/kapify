// src/app/funder/components/funder-dashboard.component.ts
import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
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
  ClockIcon
} from 'lucide-angular';
import { FundingOpportunityService } from '../../funding/services/funding-opportunity.service';
import { UiButtonComponent } from '../../shared/components';
import { FunderOnboardingService, OnboardingState } from '../services/funder-onboarding.service';
import { OpportunityManagementService } from '../services/opportunity-management.service';
 
 
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
export class FunderDashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private onboardingService = inject(FunderOnboardingService);
  private managementService = inject(OpportunityManagementService);
  private opportunityService = inject(FundingOpportunityService);
  private destroy$ = new Subject<void>();

  // Add draft state
  draftSummary = signal<{
    hasDraft: boolean;
    completionPercentage: number;
    lastSaved: string | null;
    title: string | null;
  }>({ hasDraft: false, completionPercentage: 0, lastSaved: null, title: null });

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

  // State
  onboardingState = signal<OnboardingState | null>(null);
  analytics = signal<any>(null);
  recentOpportunities = signal<any[]>([]);

  ngOnInit() {
    this.loadDashboardData();
    this.setupSubscriptions();
    this.loadDraftSummary();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDraftSummary() {
    this.opportunityService.getDraftSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.draftSummary.set(summary);
        },
        error: (error) => {
          console.error('Failed to load draft summary:', error);
        }
      });
  }

  // FIXED: Renamed methods to prevent infinite recursion
  
  /**
   * Navigate to continue existing draft
   */
  continueDraft() {
    console.log('Continuing existing draft...');
    this.router.navigate(['/funding/create-opportunity']);
  }

  /**
   * Delete existing draft
   */
  deleteDraft() {
    if (confirm('Are you sure you want to delete your draft? This action cannot be undone.')) {
      this.opportunityService.clearAllDrafts()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Draft deleted successfully');
            this.loadDraftSummary(); // Refresh draft summary
          },
          error: (error) => {
            console.error('Failed to delete draft:', error);
          }
        });
    }
  }

  /**
   * Handle creating new opportunity with draft check
   */
  handleCreateOpportunity() {
    console.log('Handle create opportunity triggered');
    
    if (this.draftSummary().hasDraft) {
      // Ask user what to do with existing draft
      const action = confirm(
        'You have an existing draft. Do you want to continue with it?\n\n' +
        'Click OK to continue your draft, or Cancel to start fresh.'
      );
      
      if (action) {
        this.continueDraft();
      } else {
        // Clear existing draft and create new
        this.clearDraftAndStartFresh();
      }
    } else {
      // No existing draft, proceed normally
      this.navigateToCreateOpportunity();
    }
  }

  /**
   * Clear draft and start fresh
   */
  private clearDraftAndStartFresh() {
    this.opportunityService.clearAllDrafts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Draft cleared, navigating to create opportunity');
          this.navigateToCreateOpportunity();
        },
        error: (error) => {
          console.error('Failed to clear draft:', error);
          // Navigate anyway
          this.navigateToCreateOpportunity();
        }
      });
  }

  /**
   * Navigate to create opportunity page
   */
  private navigateToCreateOpportunity() {
    console.log('Navigating to create opportunity page...');
    
    try {
      this.router.navigate(['/funding/create-opportunity']);
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback navigation
      window.location.href = '/funding/create-opportunity';
    }
  }
  importOpportunity() {
    console.log('Import opportunity method called');
    
       this.router.navigate(['/funder/opportunities/import']);
  }
  /**
   * Main create opportunity method (called from template)
   * FIXED: No longer calls itself recursively
   */
  createOpportunity() {
    console.log('Create opportunity method called');
    console.log('Onboarding state:', this.onboardingState());
    
    if (this.onboardingState()?.canCreateOpportunities) {
      // Check for existing drafts first
      this.handleCreateOpportunity();
    } else {
      // Complete onboarding first
      this.completeOnboarding();
    }
  }

  /**
   * Alternative method for creating new opportunity (from button)
   */
  createNewOpportunity() {
    console.log('Create new opportunity method called');
    this.handleCreateOpportunity();
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
  viewAllOpportunities() {
    this.router.navigate(['/funding/opportunities']);
  }

  viewOpportunity(opportunityId: string) {
   // this.router.navigate(['/funding/opportunities', opportunityId]);
 
 

    this.router.navigate([
      '/funder/opportunities',
      opportunityId,
      'applications'
    ]);
 
  }


  viewAnalytics() {
    // this.router.navigate(['/funder/analytics']);
  }

  editOrganization() {
    this.router.navigate(['/funder/onboarding']);
  }

  completeOnboarding() {
    console.log('Completing onboarding...');
    this.router.navigate(['/funder/onboarding']);
  }

  improveProfile() {
    this.router.navigate(['/funder/onboarding'], { 
      fragment: 'verification' 
    });
  }

  // Helper methods for draft card
  getDraftTitle(): string {
    const title = this.draftSummary().title;
    return title || 'Untitled Opportunity';
  }

  getDraftLastSavedText(): string {
    const lastSaved = this.draftSummary().lastSaved;
    if (!lastSaved) return 'Never saved';
    
    const date = new Date(lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Saved just now';
    if (diffMins < 60) return `Saved ${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Saved ${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Saved yesterday';
    if (diffDays < 7) return `Saved ${diffDays} days ago`;
    
    return `Saved ${date.toLocaleDateString()}`;
  }

  getDraftCardClasses(): string {
    const completion = this.draftSummary().completionPercentage;
    
    if (completion >= 80) {
      return 'border-l-green-500 bg-green-50';
    } else if (completion >= 50) {
      return 'border-l-blue-500 bg-blue-50';
    } else {
      return 'border-l-orange-500 bg-orange-50';
    }
  }

  getDraftProgressColor(): string {
    const completion = this.draftSummary().completionPercentage;
    
    if (completion >= 80) {
      return 'bg-gradient-to-r from-green-500 to-green-600';
    } else if (completion >= 50) {
      return 'bg-gradient-to-r from-blue-500 to-blue-600';
    } else {
      return 'bg-gradient-to-r from-orange-500 to-orange-600';
    }
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