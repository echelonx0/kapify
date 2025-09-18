// // src/app/funder/components/funder-dashboard.component.ts
// import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
// import { Router } from '@angular/router';
// import { CommonModule } from '@angular/common';
// import { Subject, takeUntil } from 'rxjs';
// import { 
//   LucideAngularModule, 
//   Plus, 
//   TrendingUp, 
//   Users, 
//   DollarSign,
//   Building2,
//   AlertCircle,
//   CheckCircle,
//   ArrowRight,
//   FileText,
//   ClockIcon,
//   BarChart3,
//   FolderOpen,
//   Settings,
//   Home,
//   Eye
// } from 'lucide-angular';
// import { FundingOpportunityService } from '../../funding/services/funding-opportunity.service';
// import { UiButtonComponent } from '../../shared/components';
// import { FunderOnboardingService, OnboardingState } from '../services/funder-onboarding.service';
// import { OpportunityManagementService } from '../services/opportunity-management.service';
// import { FunderDocumentAnalysisComponent } from 'src/app/ai/document-analysis/funder-document-analysis.component';
// import { ApplicationManagementService, FundingApplication, ApplicationStats } from 'src/app/SMEs/services/application-management.service';
// import { ApplicationListCardComponent, BaseApplicationCard } from 'src/app/shared/components/application-list-card/application-list-card.component';
// import { ActionEvent, OrganizationStatusSidebarComponent } from '../components/status-sidebar/status-sidebar.component';
// import { PublicProfile } from '../models/public-profile.models';
// import { PublicProfileService } from '../services/public-profile.service';
// import { SettingsComponent } from 'src/app/dashboard/pages/settings-page.component';
// import { FunderApplicationsComponent } from '../application-details/funder-applications/funder-applications.component';

// type TabId = 'overview' | 'opportunities' | 'applications' | 'settings';

// interface Tab {
//   id: TabId;
//   label: string;
//   icon: any;
//   description: string;
// }

// @Component({
//   selector: 'app-funder-dashboard',
//   standalone: true,
//   imports: [
//     CommonModule,
//     UiButtonComponent,
//     LucideAngularModule,
//     FunderDocumentAnalysisComponent,
//     ApplicationListCardComponent,
//         OrganizationStatusSidebarComponent,
//          SettingsComponent,
//          FunderApplicationsComponent
//   ],
//   templateUrl: 'dashboard.component.html'
// })
// export class FunderDashboardComponent implements OnInit, OnDestroy {
//   private router = inject(Router);
//   private onboardingService = inject(FunderOnboardingService);
//   private managementService = inject(OpportunityManagementService);
//   private opportunityService = inject(FundingOpportunityService);
//   private applicationService = inject(ApplicationManagementService);
//   private destroy$ = new Subject<void>();

//    // Add public profile service
//   private publicProfileService = inject(PublicProfileService);
  
//   //  Add public profile state
//   publicProfile = signal<PublicProfile | null>(null);
//   hasPublicProfile = computed(() => !!this.publicProfile());
//   publicProfileUrl = computed(() => {
//     const profile = this.publicProfile();
//     return profile?.slug ? `${window.location.origin}/funder/${profile.slug}` : null;
//   });


//   // Tab management
//   activeTab = signal<TabId>('overview');
  
//   tabs: Tab[] = [
//     {
//       id: 'overview',
//       label: 'Overview',
//       icon: Home,
//       description: 'Dashboard overview and key metrics'
//     },
//     {
//       id: 'opportunities',
//       label: 'Opportunities',
//       icon: FolderOpen,
//       description: 'Manage your funding opportunities'
//     },
//     {
//       id: 'applications',
//       label: 'Applications',
//       icon: FileText,
//       description: 'Review and manage applications'
//     },
//     {
//       id: 'settings',
//       label: 'Settings',
//       icon: Settings,
//       description: 'Organization settings and preferences'
//     }
//   ];

//   // Draft state
//   draftSummary = signal<{
//     hasDraft: boolean;
//     completionPercentage: number;
//     lastSaved: string | null;
//     title: string | null;
//   }>({ hasDraft: false, completionPercentage: 0, lastSaved: null, title: null });

//   // Icons
//   PlusIcon = Plus;
//   TrendingUpIcon = TrendingUp;
//   UsersIcon = Users;
//   DollarSignIcon = DollarSign;
//   Building2Icon = Building2;
//   AlertCircleIcon = AlertCircle;
//   CheckCircleIcon = CheckCircle;
//   ArrowRightIcon = ArrowRight;
//   ClockIcon = ClockIcon;
//   FileTextIcon = FileText;
//   BarChart3Icon = BarChart3;
//   EyeIcon = Eye;

//   // State
//   onboardingState = signal<OnboardingState | null>(null);
//   analytics = signal<any>(null);
//   recentOpportunities = signal<any[]>([]);
//   showDocumentAnalysis = signal(false);

//   // Applications state
//   allApplications = signal<FundingApplication[]>([]);
//   applicationStats = signal<ApplicationStats | null>(null);
//   applicationsLoading = signal(false);
//   applicationsError = signal<string | null>(null);
//   selectedOpportunityFilter = signal<string>('');

//   // Computed properties for applications
//   filteredApplications = computed(() => {
//     const apps = this.allApplications();
//     const opportunityFilter = this.selectedOpportunityFilter();
    
//     if (!opportunityFilter) {
//       return apps;
//     }
    
//     return apps.filter(app => app.opportunityId === opportunityFilter);
//   });

//   recentApplicationsComputed = computed(() => {
//     return this.allApplications()
//       .slice()
//       .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
//       .slice(0, 10);
//   });

//   uniqueOpportunities = computed(() => {
//     const apps = this.allApplications();
//     const opportunityMap = new Map();
    
//     apps.forEach(app => {
//       if (app.opportunity && !opportunityMap.has(app.opportunityId)) {
//         opportunityMap.set(app.opportunityId, app.opportunity);
//       }
//     });
    
//     return Array.from(opportunityMap.values());
//   });

//   applicationsInReview = computed(() => {
//     return this.allApplications().filter(app => 
//       app.status === 'submitted' || app.status === 'under_review'
//     );
//   });

//   completedApplications = computed(() => {
//     return this.allApplications().filter(app => 
//       app.status === 'approved' || app.status === 'rejected'
//     );
//   });

//   ngOnInit() {
//     this.loadDashboardData();
//     this.setupSubscriptions();
//     this.loadDraftSummary();
//     this.loadApplicationsData();
//       this.loadPublicProfile();
//   }

//   ngOnDestroy() {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   // Tab navigation
//   switchTab(tabId: TabId) {
//     this.activeTab.set(tabId);
    
//     // Load applications data when switching to applications tab
//     if (tabId === 'applications' && this.allApplications().length === 0) {
//       this.loadApplicationsData();
//     }
//   }

//   isActiveTab(tabId: TabId): boolean {
//     return this.activeTab() === tabId;
//   }

//   private loadDraftSummary() {
//     this.opportunityService.getDraftSummary()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (summary) => {
//           this.draftSummary.set(summary);
//         },
//         error: (error) => {
//           console.error('Failed to load draft summary:', error);
//         }
//       });
//   }

//   private loadApplicationsData() {
//     const organizationId = this.onboardingState()?.organization?.id;
    
//     if (!organizationId) {
//       console.log('No organization ID available for loading applications');
//       return;
//     }

//     this.applicationsLoading.set(true);
//     this.applicationsError.set(null);

//     // Load applications for the organization
//     this.applicationService.getApplicationsByOrganization(organizationId, undefined, false)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (applications) => {
//           this.allApplications.set(applications);
//           this.applicationsLoading.set(false);
//           this.loadApplicationStats(organizationId);
//         },
//         error: (error) => {
//           console.error('Failed to load applications:', error);
//           this.applicationsError.set('Failed to load applications');
//           this.applicationsLoading.set(false);
//         }
//       });
//   }

//   private loadApplicationStats(organizationId: string) {
//     this.applicationService.getApplicationStats(undefined, organizationId)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (stats) => {
//           this.applicationStats.set(stats);
//         },
//         error: (error) => {
//           console.error('Failed to load application stats:', error);
//         }
//       });
//   }

//    private loadPublicProfile() {
//     const organizationId = this.onboardingState()?.organization?.id;
//     if (organizationId) {
//       this.publicProfileService.loadOrganizationProfile(organizationId)
//         .pipe(takeUntil(this.destroy$))
//         .subscribe({
//           next: (profile) => {
//             this.publicProfile.set(profile);
//           },
//           error: (error) => {
//             console.log('No public profile found or error loading:', error);
//             // This is fine - just means no profile exists yet
//           }
//         });
//     }
//   }


//   //   Navigation methods for public profile
//   managePublicProfile() {
//     this.router.navigate(['/funder/create-profile']);
//   }

//   shareProfileLink() {
//     const url = this.publicProfileUrl();
//     if (url) {
//       // Copy to clipboard
//       navigator.clipboard.writeText(url).then(() => {
//         console.log('Profile URL copied to clipboard');
//         // You could show a toast notification here
//       });
//     }
//   }

//   viewPublicProfile() {
//     const url = this.publicProfileUrl();
//     if (url) {
//       window.open(url, '_blank');
//     }
//   }

//   openDocumentAnalysis() {
//     this.showDocumentAnalysis.set(true);
//   }

//   /**
//    * Navigate to continue existing draft
//    */
//   continueDraft() {
//     console.log('Continuing existing draft...');
//     this.router.navigate(['/funding/create-opportunity']);
//   }

//   /**
//    * Delete existing draft
//    */
//   deleteDraft() {
//     if (confirm('Are you sure you want to delete your draft? This action cannot be undone.')) {
//       this.opportunityService.clearAllDrafts()
//         .pipe(takeUntil(this.destroy$))
//         .subscribe({
//           next: () => {
//             console.log('Draft deleted successfully');
//             this.loadDraftSummary(); // Refresh draft summary
//           },
//           error: (error) => {
//             console.error('Failed to delete draft:', error);
//           }
//         });
//     }
//   }

//   /**
//    * Handle creating new opportunity with draft check
//    */
//   handleCreateOpportunity() {
//     console.log('Handle create opportunity triggered');
    
//     if (this.draftSummary().hasDraft) {
//       // Ask user what to do with existing draft
//       const action = confirm(
//         'You have an existing draft. Do you want to continue with it?\n\n' +
//         'Click OK to continue your draft, or Cancel to start fresh.'
//       );
      
//       if (action) {
//         this.continueDraft();
//       } else {
//         // Clear existing draft and create new
//         this.clearDraftAndStartFresh();
//       }
//     } else {
//       // No existing draft, proceed normally
//       this.navigateToCreateOpportunity();
//     }
//   }

//   /**
//    * Clear draft and start fresh
//    */
//   private clearDraftAndStartFresh() {
//     this.opportunityService.clearAllDrafts()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: () => {
//           console.log('Draft cleared, navigating to create opportunity');
//           this.navigateToCreateOpportunity();
//         },
//         error: (error) => {
//           console.error('Failed to clear draft:', error);
//           // Navigate anyway
//           this.navigateToCreateOpportunity();
//         }
//       });
//   }

//   /**
//    * Navigate to create opportunity page
//    */
//   private navigateToCreateOpportunity() {
//     console.log('Navigating to create opportunity page...');
    
//     try {
//       this.router.navigate(['/funding/create-opportunity']);
//     } catch (error) {
//       console.error('Navigation error:', error);
//       // Fallback navigation
//       window.location.href = '/funding/create-opportunity';
//     }
//   }

//   importOpportunity() {
//     console.log('Import opportunity method called');
//     this.router.navigate(['/funder/opportunities/import']);
//   }

//   /**
//    * Main create opportunity method (called from template)
//    */
//   createOpportunity() {
//     console.log('Create opportunity method called');
//     console.log('Onboarding state:', this.onboardingState());
    
//     if (this.onboardingState()?.canCreateOpportunities) {
//       // Check for existing drafts first
//       this.handleCreateOpportunity();
//     } else {
//       // Complete onboarding first
//       this.completeOnboarding();
//     }
//   }

//   /**
//    * Alternative method for creating new opportunity (from button)
//    */
//   createNewOpportunity() {
//     console.log('Create new opportunity method called');
//     this.handleCreateOpportunity();
//   }

//   // Applications management methods
//   onOpportunityFilterChange(event: Event) {
//     const target = event.target as HTMLSelectElement;
//     this.selectedOpportunityFilter.set(target.value);
//   }

//   refreshApplicationsData() {
//     const organizationId = this.onboardingState()?.organization?.id;
//     if (organizationId) {
//       this.loadApplicationsData();
//     }
//   }

//   transformToApplicationCard(app: FundingApplication): BaseApplicationCard {
//     return {
//       id: app.id,
//       title: app.title,
//       applicationNumber: `APP-${app.id.slice(-6).toUpperCase()}`,
//       status: app.status,
//       fundingType: app.opportunity?.fundingType,
//       requestedAmount: this.extractRequestedAmount(app.formData),
//       currency: app.opportunity?.currency || 'ZAR',
//       currentStage: this.formatStage(app.stage),
//       description: app.description,
//       createdAt: app.createdAt,
//       updatedAt: app.updatedAt,
//       submittedAt: app.submittedAt,
//       applicantName: `${app.applicant?.firstName || ''} ${app.applicant?.lastName || ''}`.trim(),
//       applicantCompany: app.applicant?.companyName,
//       opportunityTitle: app.opportunity?.title,
//       opportunityId: app.opportunityId
//     };
//   }

//   private extractRequestedAmount(formData: Record<string, any>): number {
//     if (formData?.['coverInformation']?.requestedAmount) {
//       return formData['coverInformation'].requestedAmount;
//     }
//     if (formData?.['requestedAmount']) {
//       return formData['requestedAmount'];
//     }
//     if (formData?.['fundingInformation']?.requestedAmount) {
//       return formData['fundingInformation'].requestedAmount;
//     }
//     return 0;
//   }

//   private formatStage(stage: string): string {
//     return stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
//   }

//   viewApplication(applicationId: string) {
//     this.router.navigate(['/funder/applications', applicationId]);
//   }

//   async updateApplicationStatus(applicationId: string, status: string) {
//     try {
//       await this.applicationService.updateApplicationStatus(applicationId, status as any).toPromise();
//       this.refreshApplicationsData();
//     } catch (error) {
//       console.error('Error updating application status:', error);
//     }
//   }

//   private loadDashboardData() {
//     // Load onboarding status
//     this.onboardingService.checkOnboardingStatus().subscribe();
    
//     // Load analytics and opportunities if organization exists
//     this.managementService.loadAnalytics().subscribe();
//     this.managementService.loadUserOpportunities().subscribe();
//   }

//   private setupSubscriptions() {
//     // Subscribe to onboarding state
//     this.onboardingService.onboardingState$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(state => {
//         this.onboardingState.set(state);
//         // Load applications when organization is available
//         if (state?.organization?.id && this.activeTab() === 'applications') {
//           this.loadApplicationsData();
//         }
//       });

//     // Subscribe to analytics
//     this.managementService.analytics$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(analytics => {
//         this.analytics.set(analytics);
//       });

//     // Subscribe to opportunities
//     this.managementService.opportunities$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(opportunities => {
//         // Show most recent 5 opportunities
//         this.recentOpportunities.set(opportunities.slice(0, 5));
//       });
//   }

//   // Navigation methods
//   viewAllOpportunities() {
//     this.router.navigate(['/funding/opportunities']);
//   }

//   viewOpportunity(opportunityId: string) {
//     this.router.navigate([
//       '/funder/opportunities',
//       opportunityId,
//       'applications'
//     ]);
//   }

//     editOpportunity(opportunityId: string) {
//     this.router.navigate([
//       '/funder/opportunities',
//       opportunityId,
    
//     ]);
//   }

//   viewAnalytics() {
//     // this.router.navigate(['/funder/analytics']);
//   }

 

//   improveProfile() {
//     this.router.navigate(['/funder/onboarding'], { 
//       fragment: 'verification' 
//     });
//   }

//   // Helper methods for draft card
//   getDraftTitle(): string {
//     const title = this.draftSummary().title;
//     return title || 'Untitled Opportunity';
//   }

//   getDraftLastSavedText(): string {
//     const lastSaved = this.draftSummary().lastSaved;
//     if (!lastSaved) return 'Never saved';
    
//     const date = new Date(lastSaved);
//     const now = new Date();
//     const diffMs = now.getTime() - date.getTime();
//     const diffMins = Math.floor(diffMs / 60000);
    
//     if (diffMins < 1) return 'Saved just now';
//     if (diffMins < 60) return `Saved ${diffMins} minutes ago`;
    
//     const diffHours = Math.floor(diffMins / 60);
//     if (diffHours < 24) return `Saved ${diffHours} hours ago`;
    
//     const diffDays = Math.floor(diffHours / 24);
//     if (diffDays === 1) return 'Saved yesterday';
//     if (diffDays < 7) return `Saved ${diffDays} days ago`;
    
//     return `Saved ${date.toLocaleDateString()}`;
//   }

//   getDraftCardClasses(): string {
//     const completion = this.draftSummary().completionPercentage;
    
//     if (completion >= 80) {
//       return 'border-l-green-500 bg-green-50';
//     } else if (completion >= 50) {
//       return 'border-l-blue-500 bg-blue-50';
//     } else {
//       return 'border-l-orange-500 bg-orange-50';
//     }
//   }

//   getDraftProgressColor(): string {
//     const completion = this.draftSummary().completionPercentage;
    
//     if (completion >= 80) {
//       return 'bg-gradient-to-r from-green-500 to-green-600';
//     } else if (completion >= 50) {
//       return 'bg-gradient-to-r from-blue-500 to-blue-600';
//     } else {
//       return 'bg-gradient-to-r from-orange-500 to-orange-600';
//     }
//   }

//   // Helper methods
//   getOnboardingCardClasses(): string {
//     const state = this.onboardingState();
//     if (!state) return 'border-l-neutral-300';
    
//     if (state.canCreateOpportunities) {
//       return 'border-l-green-500 bg-green-50';
//     } else {
//       return 'border-l-orange-500 bg-orange-50';
//     }
//   }

//   getOnboardingTitle(): string {
//     const state = this.onboardingState();
//     if (!state) return '';
    
//     if (!state.organization) {
//       return 'Complete Your Organization Setup';
//     } else if (!state.canCreateOpportunities) {
//       return 'Complete Organization Details';
//     } else if (!state.isComplete) {
//       return 'Get Your Organization Verified';
//     }
//     return '';
//   }

//   getOnboardingDescription(): string {
//     const state = this.onboardingState();
//     if (!state) return '';
    
//     if (!state.organization) {
//       return 'Set up your organization profile to start creating funding opportunities and connecting with SMEs.';
//     } else if (!state.canCreateOpportunities) {
//       return 'Add more details to your organization profile to enable opportunity creation.';
//     } else if (!state.isComplete) {
//       return 'Get verified to build trust with SMEs and access premium features.';
//     }
//     return '';
//   }

//   getActiveOpportunitiesCount(): number {
//     return this.recentOpportunities().filter(opp => opp.status === 'active').length;
//   }

//   getStatusClasses(status: string): string {
//     const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
//     switch (status) {
//       case 'active':
//         return `${baseClasses} bg-green-100 text-green-800`;
//       case 'draft':
//         return `${baseClasses} bg-neutral-100 text-neutral-800`;
//       case 'paused':
//         return `${baseClasses} bg-orange-100 text-orange-800`;
//       case 'closed':
//         return `${baseClasses} bg-red-100 text-red-800`;
//       default:
//         return `${baseClasses} bg-neutral-100 text-neutral-800`;
//     }
//   }

//   formatStatus(status: string): string {
//     const statuses: Record<string, string> = {
//       draft: 'Draft',
//       active: 'Active',
//       paused: 'Paused',
//       closed: 'Closed'
//     };
//     return statuses[status] || status;
//   }

//   formatOrganizationType(type: string): string {
//     const types: Record<string, string> = {
//       investment_fund: 'Investment Fund',
//       venture_capital: 'Venture Capital',
//       private_equity: 'Private Equity',
//       bank: 'Bank',
//       government: 'Government Agency',
//       ngo: 'NGO/Non-Profit'
//     };
//     return types[type] || type;
//   }

//   formatCurrency(amount: number): string {
//     return new Intl.NumberFormat('en-ZA', {
//       style: 'currency',
//       currency: 'ZAR',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(amount);
//   }

//   formatNumber(num: number): string {
//     return new Intl.NumberFormat('en-ZA').format(num);
//   }

//   getTimeAgo(date: Date): string {
//     const now = new Date().getTime();
//     const past = new Date(date).getTime();
//     const diffMinutes = Math.floor((now - past) / (1000 * 60));
    
//     if (diffMinutes < 1) return 'just now';
//     if (diffMinutes === 1) return '1 minute ago';
//     if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
//     const diffHours = Math.floor(diffMinutes / 60);
//     if (diffHours === 1) return '1 hour ago';
//     if (diffHours < 24) return `${diffHours} hours ago`;
    
//     const diffDays = Math.floor(diffHours / 24);
//     if (diffDays === 1) return '1 day ago';
//     if (diffDays < 7) return `${diffDays} days ago`;
    
//     return new Date(date).toLocaleDateString();
//   }

//  handleOrganizationAction(event: ActionEvent) {
//     console.log('Organization action:', event);
    
//     switch (event.type) {
//       case 'complete_setup':
//         this.completeOnboarding();
//         break;
      
//       case 'get_verified':
//         this.requestVerification();
//         break;
      
//       case 'edit_organization':
//         this.editOrganization();
//         break;
      
//       // NEW: Add public profile action
//       case 'manage_public_profile':
//         this.managePublicProfile();
//         break;
      
//       default:
//         console.warn('Unknown organization action:', event.type);
//     }
//   }

//   // NEW: Add verification request method
//   private requestVerification() {
//     this.onboardingService.requestVerification()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (result) => {
//           console.log('Verification requested:', result.message);
//           // Show success message to user
//         },
//         error: (error) => {
//           console.error('Verification request failed:', error);
//           // Show error message to user
//         }
//       });
//   }

//   // Update existing methods to remove onboarding logic
//   completeOnboarding() {
//     console.log('Navigating to onboarding...');
//     this.router.navigate(['/funder/onboarding']);
//   }

//   editOrganization() {
//     console.log('Navigating to organization edit...');
//     this.router.navigate(['/funder/onboarding']);
//   }

 
// }


// src/app/funder/components/funder-dashboard.component.ts
import { Component, signal, computed, OnInit, OnDestroy, inject } from '@angular/core';
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
  Home
} from 'lucide-angular';
import { UiButtonComponent } from '../../shared/components';
import { FunderOnboardingService, OnboardingState } from '../services/funder-onboarding.service';
import { OpportunityManagementService } from '../services/opportunity-management.service';
import { FunderDocumentAnalysisComponent } from 'src/app/ai/document-analysis/funder-document-analysis.component';
import { ActionEvent, OrganizationStatusSidebarComponent } from '../components/status-sidebar/status-sidebar.component';
import { PublicProfile } from '../models/public-profile.models';
import { PublicProfileService } from '../services/public-profile.service';
import { SettingsComponent } from 'src/app/dashboard/pages/settings-page.component';
import { FunderApplicationsComponent } from '../application-details/funder-applications/funder-applications.component';
import { DraftManagementService } from '../services/draft-management.service';

 
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
    SettingsComponent,
    FunderApplicationsComponent
  ],
  templateUrl: 'dashboard.component.html',
  styles: [`
    .tab-navigation {
      display: flex;
      justify-content: center;
    }

    .tab-container {
      background: white;
      border-radius: 0.75rem;
      padding: 0.25rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .tab-list {
      display: flex;
      gap: 0.25rem;
    }

    .tab-button {
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 0.5rem;
      transition: all 0.2s;
      border: none;
      background: transparent;
      color: #6b7280;
      cursor: pointer;
    }

    .tab-button:hover {
      color: #111827;
      background-color: #f3f4f6;
    }

    .tab-button.active {
      background-color: #111827;
      color: white;
    }

    .section-card {
      background: white;
      border-radius: 0.75rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }

    .section-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .section-description {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .stat-card {
      background: white;
      border-radius: 0.75rem;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
      width: 3rem;
      height: 3rem;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .action-button {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 1rem;
      text-align: left;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      transition: all 0.2s;
      cursor: pointer;
    }

    .action-button:hover {
      border-color: #d1d5db;
      box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.05);
    }

    .action-button .icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.5rem;
      background: #f9fafb;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.75rem;
    }

    .action-button .text {
      font-weight: 500;
      color: #111827;
    }

    .empty-state {
      padding: 3rem;
      text-align: center;
    }

    .empty-icon {
      width: 48px;
      height: 48px;
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f3f4f6;
      border-radius: 50%;
    }

    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.5rem;
    }

    .empty-description {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    .list-item {
      padding: 1.5rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .list-item:hover {
      background-color: #f9fafb;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .status-active {
      background-color: #dcfce7;
      color: #166534;
    }

    .status-draft {
      background-color: #f3f4f6;
      color: #374151;
    }

    .status-paused {
      background-color: #fed7aa;
      color: #c2410c;
    }

    .status-closed {
      background-color: #fecaca;
      color: #dc2626;
    }
  `]
})
export class FunderDashboardComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private onboardingService = inject(FunderOnboardingService);
  private managementService = inject(OpportunityManagementService);
  private destroy$ = new Subject<void>();
  private publicProfileService = inject(PublicProfileService);
  
  // ✅ Inject the draft management service
  protected draftService = inject(DraftManagementService);
  
  // State
  activeTab = signal<TabId>('overview');
  
  tabs: Tab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: Home,
      description: 'Dashboard overview and key metrics'
    },
    {
      id: 'opportunities',
      label: 'Opportunities',
      icon: FolderOpen,
      description: 'Manage your funding opportunities'
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: FileText,
      description: 'Review and manage applications'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Organization settings and preferences'
    }
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
    return profile?.slug ? `${window.location.origin}/funder/${profile.slug}` : null;
  });

  ngOnInit() {
    this.loadDashboardData();
    this.setupSubscriptions();
    this.loadPublicProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Tab navigation
  switchTab(tabId: TabId) {
    this.activeTab.set(tabId);
  }

  isActiveTab(tabId: TabId): boolean {
    return this.activeTab() === tabId;
  }

  // ✅ Updated draft management methods using service
  continueDraft() {
    console.log('Continuing existing draft...');
    this.router.navigate(['/funding/create-opportunity']);
  }

  startFreshOpportunity() {
    console.log('Starting fresh opportunity...');
    
    this.draftService.checkDraftAndProceed()
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
        }
      });
  }

  deleteDraft() {
    if (confirm('Are you sure you want to delete your draft? This action cannot be undone.')) {
      this.draftService.clearAllDrafts()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Draft deleted successfully');
          },
          error: (error) => {
            console.error('Failed to delete draft:', error);
            alert('Failed to delete draft. Please try again.');
          }
        });
    }
  }

  createOpportunity() {
    console.log('Create opportunity method called');
    console.log('Onboarding state:', this.onboardingState());
    
    if (this.onboardingState()?.canCreateOpportunities) {
      this.handleCreateOpportunity();
    } else {
      this.completeOnboarding();
    }
  }

  private handleCreateOpportunity() {
    this.draftService.checkDraftAndProceed()
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
        }
      });
  }

  private clearDraftAndStartFresh() {
    this.draftService.clearAllDrafts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Draft cleared, navigating to create opportunity');
          this.navigateToCreateOpportunity();
        },
        error: (error) => {
          console.error('Failed to clear draft:', error);
          this.navigateToCreateOpportunity();
        }
      });
  }

  private navigateToCreateOpportunity() {
    console.log('Navigating to create opportunity page...');
    
    try {
      this.router.navigate(['/funding/create-opportunity']);
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/funding/create-opportunity';
    }
  }

  // ✅ Removed all draft-specific helper methods (50+ lines eliminated)
  // These are now handled by the DraftManagementService

  private loadPublicProfile() {
    const organizationId = this.onboardingState()?.organization?.id;
    if (organizationId) {
      this.publicProfileService.loadOrganizationProfile(organizationId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (profile) => {
            this.publicProfile.set(profile);
          },
          error: (error) => {
            console.log('No public profile found or error loading:', error);
          }
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
    console.log('Import opportunity method called');
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
      .subscribe(state => {
        this.onboardingState.set(state);
      });

    this.managementService.analytics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(analytics => {
        this.analytics.set(analytics);
      });

    this.managementService.opportunities$
      .pipe(takeUntil(this.destroy$))
      .subscribe(opportunities => {
        this.recentOpportunities.set(opportunities.slice(0, 5));
      });
  }

  // Navigation methods
  viewAllOpportunities() {
    this.router.navigate(['/funding/opportunities']);
  }

  viewOpportunity(opportunityId: string) {
    this.router.navigate([
      '/funder/opportunities',
      opportunityId,
      'applications'
    ]);
  }

  editOpportunity(opportunityId: string) {
    this.router.navigate([
      '/funder/opportunities',
      opportunityId,
    ]);
  }

  viewAnalytics() {
    // this.router.navigate(['/funder/analytics']);
  }

  improveProfile() {
    this.router.navigate(['/funder/onboarding'], { 
      fragment: 'verification' 
    });
  }

  // Helper methods
  getActiveOpportunitiesCount(): number {
    return this.recentOpportunities().filter(opp => opp.status === 'active').length;
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
    this.onboardingService.requestVerification()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          console.log('Verification requested:', result.message);
        },
        error: (error) => {
          console.error('Verification request failed:', error);
        }
      });
  }

  completeOnboarding() {
    console.log('Navigating to onboarding...');
    this.router.navigate(['/funder/onboarding']);
  }

  editOrganization() {
    console.log('Navigating to organization edit...');
    this.router.navigate(['/funder/onboarding']);
  }
}