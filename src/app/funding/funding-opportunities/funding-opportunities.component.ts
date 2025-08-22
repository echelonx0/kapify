// src/app/funding/funding-opportunities.component.ts - UPDATED WITH PERMISSIONS
import { Component, signal, OnInit, inject, computed, effect, OnDestroy, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
 
import { LucideAngularModule, Search, Filter, DollarSign, Calendar, MapPin, Building, TrendingUp, Eye, FileText, Users, RefreshCw, AlertCircle } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, Subject, takeUntil } from 'rxjs';
import { FundingPermissionsService, OpportunityPermissions } from '../../shared/services/funding-permissions.service';
import { AuthService } from '../../auth/production.auth.service';
import { SidebarNavComponent, UiButtonComponent } from '../../shared/components';
import { FundingOpportunity } from '../../shared/models/funder.models';
import { SMEOpportunitiesService } from '../services/opportunities.service';


interface OpportunityWithPermissions extends FundingOpportunity {
  permissions?: OpportunityPermissions;
}

@Component({
  selector: 'app-funding-opportunities',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarNavComponent,  
    UiButtonComponent,
    LucideAngularModule
  ],
  templateUrl: 'funding-opportunities.component.html'
})
export class FundingOpportunitiesComponent implements OnInit, OnDestroy {
  // Services
  private router = inject(Router);
  private opportunitiesService = inject(SMEOpportunitiesService);
  private permissionsService = inject(FundingPermissionsService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);
  
  // Alternative destroy subject for manual cleanup
  private destroy$ = new Subject<void>();

  // Icons
  SearchIcon = Search;
  FilterIcon = Filter;
  DollarSignIcon = DollarSign;
  CalendarIcon = Calendar;
  MapPinIcon = MapPin;
  BuildingIcon = Building;
  TrendingUpIcon = TrendingUp;
  EyeIcon = Eye;
  FileTextIcon = FileText;
  UsersIcon = Users;
  RefreshCwIcon = RefreshCw;
  AlertCircleIcon = AlertCircle;

  // State
  opportunities = signal<OpportunityWithPermissions[]>([]);
  filteredOpportunities = signal<OpportunityWithPermissions[]>([]);
  isLoading = signal(true);
  
  // Filter state
  searchQuery = signal('');
  showFilters = signal(false);
  selectedFundingType = signal('');
  selectedIndustry = signal('');
  selectedCurrency = signal('');
  minAmount = signal('');
  maxAmount = signal('');

  // Permission state
  isLoadingPermissions = signal(false);
  
  // Computed user context
  currentUser = computed(() => this.authService.user());
  userPermissions = computed(() => this.permissionsService.permissions);

  constructor() {
    // React to permission service loading state changes using effect
    effect(() => {
      const loading = this.permissionsService.isLoading();
      this.isLoadingPermissions.set(loading);
    });
  }

  ngOnInit() {
    this.loadOpportunities();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOpportunities() {
    this.isLoading.set(true);
    
    this.opportunitiesService.loadActiveOpportunities().pipe(
      switchMap(opportunities => {
        // Load permissions for each opportunity
        return this.loadPermissionsForOpportunities(opportunities);
      }),
      takeUntil(this.destroy$) // Use manual destroy subject instead
    ).subscribe({
      next: (opportunitiesWithPermissions) => {
        this.opportunities.set(opportunitiesWithPermissions);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading opportunities:', error);
        this.isLoading.set(false);
        // Set empty array to show "no opportunities" state instead of infinite loading
        this.opportunities.set([]);
        this.applyFilters();
      }
    });
  }

  private async loadPermissionsForOpportunities(
    opportunities: FundingOpportunity[]
  ): Promise<OpportunityWithPermissions[]> {
    const opportunitiesWithPermissions: OpportunityWithPermissions[] = [];

    for (const opportunity of opportunities) {
      try {
        const permissions = await this.permissionsService
          .getOpportunityPermissions(opportunity)
          .pipe(
            catchError(error => {
              console.error(`Error loading permissions for ${opportunity.id}:`, error);
              return of(this.getDefaultPermissions());
            })
          )
          .toPromise();

        opportunitiesWithPermissions.push({
          ...opportunity,
          permissions
        });
      } catch (error) {
        console.error(`Failed to load permissions for ${opportunity.id}:`, error);
        opportunitiesWithPermissions.push({
          ...opportunity,
          permissions: this.getDefaultPermissions()
        });
      }
    }

    return opportunitiesWithPermissions;
  }

  private getDefaultPermissions(): OpportunityPermissions {
    return {
      canView: true,
      canApply: false,
      canManage: false,
      canEdit: false,
      hasExistingApplication: false,
      actionButtonType: 'none',
      actionButtonText: 'View Details'
    };
  }

  applyFilters() {
    let filtered = this.opportunities();

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(opp => 
        opp.title.toLowerCase().includes(query) ||
        opp.description.toLowerCase().includes(query) ||
        opp.shortDescription.toLowerCase().includes(query)
      );
    }

    // Funding type filter
    if (this.selectedFundingType()) {
      filtered = filtered.filter(opp => opp.fundingType === this.selectedFundingType());
    }

    // Industry filter
    if (this.selectedIndustry()) {
      filtered = filtered.filter(opp => 
        opp.eligibilityCriteria.industries.includes(this.selectedIndustry())
      );
    }

    // Currency filter
    if (this.selectedCurrency()) {
      filtered = filtered.filter(opp => opp.currency === this.selectedCurrency());
    }

    // Amount filters
    if (this.minAmount()) {
      const min = Number(this.minAmount());
      filtered = filtered.filter(opp => opp.maxInvestment >= min);
    }

    if (this.maxAmount()) {
      const max = Number(this.maxAmount());
      filtered = filtered.filter(opp => opp.minInvestment <= max);
    }

    // Only show active opportunities
    filtered = filtered.filter(opp => opp.status === 'active');

    this.filteredOpportunities.set(filtered);
  }

  // Event handlers
  onSearchChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.applyFilters();
  }

  onFundingTypeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedFundingType.set(target.value);
    this.applyFilters();
  }

  onIndustryChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedIndustry.set(target.value);
    this.applyFilters();
  }

  onCurrencyChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.selectedCurrency.set(target.value);
    this.applyFilters();
  }

  onMinAmountChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.minAmount.set(target.value);
    this.applyFilters();
  }

  onMaxAmountChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.maxAmount.set(target.value);
    this.applyFilters();
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedFundingType.set('');
    this.selectedIndustry.set('');
    this.selectedCurrency.set('');
    this.minAmount.set('');
    this.maxAmount.set('');
    this.showFilters.set(false);
    this.applyFilters();
  }

  // ===============================
  // PERMISSION-BASED ACTION METHODS
  // ===============================

  /**
   * Handle primary action button click based on permissions
   */
  handlePrimaryAction(opportunity: OpportunityWithPermissions) {
    const permissions = opportunity.permissions;
    if (!permissions) {
      this.viewOpportunityDetails(opportunity.id);
      return;
    }

    switch (permissions.actionButtonType) {
      case 'apply':
        this.applyToOpportunity(opportunity.id);
        break;
      case 'view-application':
        this.viewApplication(opportunity.id);
        break;
      case 'manage':
        this.manageApplications(opportunity.id);
        break;
      case 'edit':
        this.editOpportunity(opportunity.id);
        break;
      case 'login':
        this.redirectToLogin();
        break;
      default:
        this.viewOpportunityDetails(opportunity.id);
    }
  }

  /**
   * Check if primary action should be disabled
   */
  isPrimaryActionDisabled(opportunity: OpportunityWithPermissions): boolean {
    const permissions = opportunity.permissions;
    return !permissions || 
           permissions.actionButtonType === 'none' ||
           !!permissions.disabledReason;
  }

  /**
   * Get the button variant for the primary action button
   */
  getPrimaryActionVariant(opportunity: OpportunityWithPermissions): 'primary' | 'secondary' | 'outline' | 'ghost' {
    const permissions = opportunity.permissions;
    if (!permissions) return 'outline';

    if (this.isPrimaryActionDisabled(opportunity)) {
      return 'outline';
    }

    switch (permissions.actionButtonType) {
      case 'apply':
        return 'primary';
      case 'manage':
        return 'primary';
      case 'edit':
        return 'secondary';
      case 'view-application':
        return 'outline';
      case 'login':
        return 'outline';
      default:
        return 'outline';
    }
  }

  /**
   * Get the CSS classes for the primary action button (keeping for potential custom styling)
   */
  getPrimaryActionClasses(opportunity: OpportunityWithPermissions): string {
    const permissions = opportunity.permissions;
    if (!permissions) return 'ui-button-outline';

    const baseClasses = 'transition-all duration-200';
    
    if (this.isPrimaryActionDisabled(opportunity)) {
      return `${baseClasses} ui-button-disabled`;
    }

    switch (permissions.actionButtonType) {
      case 'apply':
        return `${baseClasses} ui-button-primary`;
      case 'manage':
        return `${baseClasses} ui-button-primary`;
      case 'edit':
        return `${baseClasses} ui-button-secondary`;
      case 'view-application':
        return `${baseClasses} ui-button-outline`;
      case 'login':
        return `${baseClasses} ui-button-outline`;
      default:
        return `${baseClasses} ui-button-outline`;
    }
  }

  /**
   * Get button text with fallback
   */
  getActionButtonText(opportunity: OpportunityWithPermissions): string {
    return opportunity.permissions?.actionButtonText || 'View Details';
  }

  /**
   * Get disabled reason tooltip
   */
  getDisabledReason(opportunity: OpportunityWithPermissions): string | undefined {
    return opportunity.permissions?.disabledReason;
  }

  /**
   * Check if user can see manage button (for UI layout)
   */
  shouldShowManageButton(opportunity: OpportunityWithPermissions): boolean {
    return opportunity.permissions?.canManage || false;
  }

  /**
   * Check if user can see apply-related buttons
   */
  shouldShowApplyButton(opportunity: OpportunityWithPermissions): boolean {
    const permissions = opportunity.permissions;
    return permissions?.canApply || 
           permissions?.hasExistingApplication ||
           permissions?.actionButtonType === 'login' ||
           false;
  }

  // ===============================
  // NAVIGATION METHODS
  // ===============================

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  viewOpportunityDetails(opportunityId: string) {
    this.router.navigate(['/funding/opportunities', opportunityId]);
  }

  applyToOpportunity(opportunityId: string) {
    // Check permissions one more time before navigation
    this.permissionsService.canApplyToOpportunity(
      this.findOpportunityById(opportunityId)!
    ).subscribe(result => {
      if (result.allowed) {
        this.router.navigate(['/applications/new'], { 
          queryParams: { opportunityId } 
        });
      } else {
        console.warn('Application not allowed:', result.reason);
        // Could show a toast/notification here
      }
    });
  }

  viewApplication(opportunityId: string) {
    // Get application ID from permissions service
    this.permissionsService.getApplicationStatus(opportunityId).subscribe(status => {
      if (status) {
        this.router.navigate(['/applications', status.applicationId]);
      } else {
        this.router.navigate(['/applications'], { 
          queryParams: { opportunityId } 
        });
      }
    });
  }

  manageApplications(opportunityId: string) {
    this.router.navigate(['/funder-dashboard/opportunities', opportunityId, 'applications']);
  }

  editOpportunity(opportunityId: string) {
    this.router.navigate(['/funding/opportunities', opportunityId, 'edit']);
  }

  redirectToLogin() {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  // ===============================
  // HELPER METHODS
  // ===============================

  private findOpportunityById(id: string): FundingOpportunity | null {
    return this.opportunities().find(opp => opp.id === id) || null;
  }

  getInitials(title: string): string {
    return title
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
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
      case 'convertible':
        return `${baseClasses} bg-indigo-100 text-indigo-800`;
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

  formatIndustry(industry: string): string {
    return industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatAmount(amount: number): string {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toString();
  }

  formatLocations(locations: string[]): string {
    const formatted = locations.map(loc => 
      loc.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
    
    if (formatted.length <= 2) {
      return formatted.join(' and ');
    }
    
    return `${formatted.slice(0, 2).join(', ')} and ${formatted.length - 2} more`;
  }

  getProgressPercentage(opportunity: FundingOpportunity): number {
    if (opportunity.totalAvailable === 0) return 0;
    return Math.min((opportunity.amountDeployed / opportunity.totalAvailable) * 100, 100);
  }

  // ===============================
  // PERMISSION STATUS HELPERS
  // ===============================

  /**
   * Get status badge info for applications
   */
  getApplicationStatusBadge(opportunity: OpportunityWithPermissions): { text: string; classes: string } | null {
    const permissions = opportunity.permissions;
    if (!permissions?.hasExistingApplication) return null;

    // Try to get application status from permissions service
    let status = 'Unknown';
    this.permissionsService.getApplicationStatus(opportunity.id).subscribe(appStatus => {
      if (appStatus) {
        status = appStatus.status;
      }
    });

    const statusConfig: Record<string, { text: string; classes: string }> = {
      draft: { text: 'Draft', classes: 'bg-gray-100 text-gray-800' },
      submitted: { text: 'Submitted', classes: 'bg-blue-100 text-blue-800' },
      under_review: { text: 'Under Review', classes: 'bg-yellow-100 text-yellow-800' },
      approved: { text: 'Approved', classes: 'bg-green-100 text-green-800' },
      rejected: { text: 'Rejected', classes: 'bg-red-100 text-red-800' },
      withdrawn: { text: 'Withdrawn', classes: 'bg-gray-100 text-gray-800' }
    };

    return statusConfig[status] || { text: 'Applied', classes: 'bg-blue-100 text-blue-800' };
  }

  /**
   * Show permission-based notification/warning
   */
  getPermissionWarning(opportunity: OpportunityWithPermissions): string | null {
    const permissions = opportunity.permissions;
    if (!permissions) return null;

    if (permissions.disabledReason) {
      return permissions.disabledReason;
    }

    if (!this.currentUser() && permissions.actionButtonType === 'login') {
      return 'Login required to apply for funding opportunities';
    }

    return null;
  }

  /**
   * Check if opportunity has any restrictions for current user
   */
  hasRestrictions(opportunity: OpportunityWithPermissions): boolean {
    const permissions = opportunity.permissions;
    return !!(permissions?.disabledReason || 
             (!this.currentUser() && permissions?.actionButtonType === 'login'));
  }

  /**
   * Get user-friendly restriction message
   */
  getRestrictionMessage(opportunity: OpportunityWithPermissions): string {
    const warning = this.getPermissionWarning(opportunity);
    return warning || 'No restrictions';
  }

  // ===============================
  // LOADING AND ERROR STATES
  // ===============================

  /**
   * Check if any loading is happening
   */
  isAnyLoading(): boolean {
    return this.isLoading() || this.isLoadingPermissions();
  }

  /**
   * Get loading message
   */
  getLoadingMessage(): string {
    if (this.isLoading()) return 'Loading opportunities...';
    if (this.isLoadingPermissions()) return 'Loading permissions...';
    return 'Loading...';
  }

  /**
   * Refresh both opportunities and permissions
   */
  refreshData() {
    this.loadOpportunities();
    this.permissionsService.refreshUserContext().subscribe();
  }

  // ===============================
  // DEBUGGING HELPERS (Remove in production)
  // ===============================

  /**
   * Debug method to log permissions for an opportunity
   */
  debugPermissions(opportunity: OpportunityWithPermissions) {
    console.log('=== OPPORTUNITY PERMISSIONS DEBUG ===');
    console.log('Opportunity:', opportunity.title);
    console.log('Permissions:', opportunity.permissions);
    console.log('User Context:', this.permissionsService.getCurrentUserContext());
    console.log('User Permissions:', this.userPermissions());
    console.log('====================================');
  }
}