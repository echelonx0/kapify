// src/app/shared/components/organization-status-sidebar/organization-status-sidebar.component.ts
import { Component, inject, OnInit, OnDestroy, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Building2, CheckCircle, AlertTriangle, Clock, ChevronDown, ChevronUp, ExternalLink, Shield, FileText } from 'lucide-angular';
import { Subject, takeUntil } from 'rxjs';
import { FunderOnboardingService, OnboardingState } from '../../../funder/services/funder-onboarding.service';
 
 
interface StatusPriority {
  item: string;
  field: string;
  revenueImpact: 'high' | 'medium' | 'low';
  userEffort: 'quick' | 'moderate' | 'complex';
  description: string;
  action: string;
}

export interface ActionEvent {
  type: 'complete_setup' | 'get_verified' | 'edit_organization';
  target?: string;
}

@Component({
  selector: 'app-organization-status-sidebar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-0.5 rounded-xl sticky top-6">
      <div class="bg-white rounded-xl p-6">
        <!-- Header -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="Building2Icon" [size]="16" class="text-white"></lucide-icon>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900">Organization Status</h3>
              @if (onboardingState()) {
                <p class="text-xs text-gray-600">{{ getOrganizationName() }}</p>
              }
            </div>
          </div>
          
          @if (canCollapse()) {
            <button 
              (click)="toggleCollapsed()"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <lucide-icon 
                [img]="isCollapsed() ? ChevronDownIcon : ChevronUpIcon" 
                [size]="16"
              ></lucide-icon>
            </button>
          }
        </div>

        <!-- Collapsed Preview -->
        @if (isCollapsed()) {
          <div class="space-y-3">
            <!-- Completion Bar -->
            <div class="flex items-center space-x-2">
              <div class="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-500 ease-out"
                  [class]="getProgressBarColor()"
                  [style.width.%]="getCompletionPercentage()"
                ></div>
              </div>
              <span class="text-xs font-medium text-gray-700">{{ getCompletionPercentage() }}%</span>
            </div>
            
            <!-- Status Badge -->
            <div class="flex items-center justify-between">
              <div [class]="getStatusBadgeClass()" class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium">
                <lucide-icon [img]="getStatusIcon()" [size]="12" class="mr-1.5"></lucide-icon>
                {{ getStatusText() }}
              </div>
              
              @if (hasUrgentItems()) {
                <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              }
            </div>
          </div>
        } @else {
          <!-- Expanded Content -->
          <div class="space-y-4">
            
            <!-- Main Status Card -->
            <div [class]="getMainStatusCardClass()" class="rounded-lg p-4">
              <div class="flex items-start space-x-3">
                <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                     [class]="getStatusIconBg()">
                  <lucide-icon [img]="getStatusIcon()" [size]="12" 
                               [class]="getStatusIconColor()"></lucide-icon>
                </div>
                <div class="flex-1">
                  <h4 class="text-sm font-medium mb-1" [class]="getStatusTitleColor()">
                    {{ getMainStatusTitle() }}
                  </h4>
                  <p class="text-xs leading-relaxed" [class]="getStatusTextColor()">
                    {{ getMainStatusDescription() }}
                  </p>
                  
                  <!-- Progress Bar -->
                  <div class="mt-3">
                    <div class="flex items-center justify-between mb-2">
                      <span class="text-xs font-medium" [class]="getStatusTextColor()">Progress</span>
                      <span class="text-xs font-bold" [class]="getStatusTitleColor()">{{ getCompletionPercentage() }}%</span>
                    </div>
                    <div class="w-full bg-white bg-opacity-50 rounded-full h-2 overflow-hidden">
                      <div 
                        class="h-2 rounded-full transition-all duration-500 ease-out"
                        [class]="getProgressBarColor()"
                        [style.width.%]="getCompletionPercentage()"
                      ></div>
                    </div>
                  </div>

                  <!-- Primary Action -->
                  @if (getPrimaryAction()) {
                    <button 
                      class="text-xs font-medium mt-3 hover:underline"
                      [class]="getActionButtonColor()"
                      (click)="handlePrimaryAction()">
                      {{ getPrimaryAction()!.action }} →
                    </button>
                  }
                </div>
              </div>
            </div>

            <!-- Missing Items (High Priority) -->
            @if (getHighPriorityMissingItems().length > 0) {
              <div class="space-y-2">
                <h4 class="text-sm font-semibold text-gray-900">Quick Wins</h4>
                @for (item of getHighPriorityMissingItems().slice(0, 3); track item.field) {
                  <div class="flex items-center space-x-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                    <div class="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <lucide-icon [img]="ClockIcon" [size]="10" class="text-orange-600"></lucide-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-medium text-orange-900">{{ item.item }}</p>
                      <p class="text-xs text-orange-700">{{ item.description }}</p>
                    </div>
                  </div>
                }
                
                @if (getTotalMissingItems() > 3) {
                  <button 
                    class="text-xs text-gray-600 hover:text-gray-800 font-medium"
                    (click)="showAllMissingItems()"
                  >
                    +{{ getTotalMissingItems() - 3 }} more items
                  </button>
                }
              </div>
            }

            <!-- Verification Status -->
            @if (shouldShowVerification()) {
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <div class="flex items-start space-x-3">
                  <div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <lucide-icon [img]="ShieldIcon" [size]="12" class="text-green-600"></lucide-icon>
                  </div>
                  <div class="flex-1">
                    <h4 class="text-sm font-medium text-green-900 mb-1">Get Verified</h4>
                    <p class="text-xs text-green-700 leading-relaxed">
                      Build trust with SMEs and unlock premium features. Verification takes 24-48 hours.
                    </p>
                    <button 
                      class="text-xs text-green-600 hover:text-green-800 font-medium mt-2"
                      (click)="requestVerification()"
                      [disabled]="!canRequestVerification()"
                    >
                      {{ getVerificationButtonText() }} →
                    </button>
                  </div>
                </div>
              </div>
            }

            <!-- Quick Actions -->
            <div class="space-y-2">
              <h4 class="text-sm font-semibold text-gray-900">Quick Actions</h4>
              
              @if (!isComplete()) {
                <button 
                  class="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  (click)="completeSetup()"
                >
                  <div class="flex items-center space-x-3">
                    <lucide-icon [img]="FileTextIcon" [size]="16" class="text-gray-400 group-hover:text-blue-600"></lucide-icon>
                    <span class="text-sm text-gray-700 group-hover:text-blue-700">Complete Organization Setup</span>
                  </div>
                </button>
              }

              <button 
                class="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group"
                (click)="editOrganization()"
              >
                <div class="flex items-center space-x-3">
                  <lucide-icon [img]="Building2Icon" [size]="16" class="text-gray-400 group-hover:text-blue-600"></lucide-icon>
                  <span class="text-sm text-gray-700 group-hover:text-blue-700">Edit Organization Details</span>
                  <lucide-icon [img]="ExternalLinkIcon" [size]="12" class="text-gray-400 group-hover:text-blue-600 ml-auto"></lucide-icon>
                </div>
              </button>
            </div>

            <!-- Organization Type -->
            @if (onboardingState()?.organization) {
              <div class="border-t border-gray-200 pt-4">
                <div class="text-xs text-gray-500 mb-1">Organization Type</div>
                <div class="text-sm font-medium text-gray-900">
                  {{ formatOrganizationType(onboardingState()!.organization!.organizationType) }}
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class OrganizationStatusSidebarComponent implements OnInit, OnDestroy {
  private onboardingService = inject(FunderOnboardingService);
  private destroy$ = new Subject<void>();

  // Icons
  Building2Icon = Building2;
  CheckCircleIcon = CheckCircle;
  AlertTriangleIcon = AlertTriangle;
  ClockIcon = Clock;
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;
  ExternalLinkIcon = ExternalLink;
  ShieldIcon = Shield;
  FileTextIcon = FileText;

  // State
  onboardingState = signal<OnboardingState | null>(null);
  isCollapsed = signal(false);
  showAllMissing = signal(false);

  // Events
  actionClicked = output<ActionEvent>();

  // Priority matrix for missing items
  private priorityMatrix: StatusPriority[] = [
    {
      item: 'Organization Name',
      field: 'name',
      revenueImpact: 'high',
      userEffort: 'quick',
      description: 'Required for opportunity creation',
      action: 'Add organization name'
    },
    {
      item: 'Contact Email',
      field: 'email',
      revenueImpact: 'high',
      userEffort: 'quick',
      description: 'SMEs need to contact you',
      action: 'Add contact email'
    },
    {
      item: 'Legal Name',
      field: 'legalName',
      revenueImpact: 'high',
      userEffort: 'quick',
      description: 'Required for verification',
      action: 'Add legal name'
    },
    {
      item: 'Registration Number',
      field: 'registrationNumber',
      revenueImpact: 'high',
      userEffort: 'moderate',
      description: 'Builds trust with applicants',
      action: 'Add registration number'
    },
    {
      item: 'Business Address',
      field: 'addressLine1',
      revenueImpact: 'medium',
      userEffort: 'moderate',
      description: 'Required for legal compliance',
      action: 'Add business address'
    },
    {
      item: 'Phone Number',
      field: 'phone',
      revenueImpact: 'medium',
      userEffort: 'quick',
      description: 'Alternative contact method',
      action: 'Add phone number'
    },
    {
      item: 'Organization Description',
      field: 'description',
      revenueImpact: 'medium',
      userEffort: 'moderate',
      description: 'Helps SMEs understand your focus',
      action: 'Add description'
    }
  ];

  // Computed properties
  canCollapse = computed(() => {
    const state = this.onboardingState();
    return state && state.completionPercentage >= 100;
  });

  isComplete = computed(() => {
    return this.onboardingState()?.isComplete ?? false;
  });

  hasUrgentItems = computed(() => {
    return this.getHighPriorityMissingItems().length > 0;
  });

  ngOnInit() {
    this.loadOnboardingState();
    this.setupSubscriptions();
    this.setupAutoCollapse();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===============================
  // DATA LOADING
  // ===============================

  private loadOnboardingState() {
    this.onboardingService.checkOnboardingStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state) => {
          this.onboardingState.set(state);
        },
        error: (error) => {
          console.error('Failed to load onboarding state:', error);
        }
      });
  }

  private setupSubscriptions() {
    this.onboardingService.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.onboardingState.set(state);
      });
  }

  private setupAutoCollapse() {
    // Auto-expand for incomplete profiles unless user manually collapsed
    this.onboardingService.onboardingState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        if (state && state.completionPercentage < 100) {
          const userCollapsed = localStorage.getItem('org-status-collapsed') === 'true';
          if (!userCollapsed) {
            this.isCollapsed.set(false);
          }
        }
      });
  }

  // ===============================
  // STATUS COMPUTATION
  // ===============================

  getCompletionPercentage(): number {
    return this.onboardingState()?.completionPercentage ?? 0;
  }

  getOrganizationName(): string {
    const org = this.onboardingState()?.organization;
    return org?.name || 'Organization Setup';
  }

  getStatusText(): string {
    const state = this.onboardingState();
    if (!state) return 'Loading...';
    
    if (state.organization?.isVerified) return 'Verified';
    if (state.isComplete) return 'Complete';
    if (state.completionPercentage >= 50) return 'In Progress';
    return 'Setup Required';
  }

  getMainStatusTitle(): string {
    const state = this.onboardingState();
    if (!state) return 'Loading Organization Status';
    
    if (state.organization?.isVerified) {
      return 'Organization Verified';
    } else if (state.isComplete) {
      return 'Ready for Verification';
    } else if (state.completionPercentage >= 50) {
      return 'Complete Your Setup';
    } else {
      return 'Organization Setup Required';
    }
  }

  getMainStatusDescription(): string {
    const state = this.onboardingState();
    if (!state) return 'Loading your organization details...';
    
    if (state.organization?.isVerified) {
      return 'Your organization is verified and ready to create funding opportunities.';
    } else if (state.isComplete) {
      return 'Complete setup achieved! Submit for verification to build trust with SMEs.';
    } else {
      const missing = this.getTotalMissingItems();
      return `${missing} item${missing === 1 ? '' : 's'} remaining to enable opportunity creation.`;
    }
  }

  // ===============================
  // MISSING ITEMS ANALYSIS
  // ===============================

  getHighPriorityMissingItems(): StatusPriority[] {
    const org = this.onboardingState()?.organization;
    if (!org) return [];

    return this.priorityMatrix.filter(priority => {
      const fieldValue = this.getFieldValue(org, priority.field);
      const isMissing = !fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim());
      return isMissing && priority.revenueImpact === 'high' && priority.userEffort === 'quick';
    });
  }

  getAllMissingItems(): StatusPriority[] {
    const org = this.onboardingState()?.organization;
    if (!org) return [];

    return this.priorityMatrix.filter(priority => {
      const fieldValue = this.getFieldValue(org, priority.field);
      const isMissing = !fieldValue || (typeof fieldValue === 'string' && !fieldValue.trim());
      return isMissing;
    }).sort((a, b) => {
      // Sort by revenue impact first, then user effort
      const impactWeight = { high: 3, medium: 2, low: 1 };
      const effortWeight = { quick: 3, moderate: 2, complex: 1 };
      
      const aScore = impactWeight[a.revenueImpact] * effortWeight[a.userEffort];
      const bScore = impactWeight[b.revenueImpact] * effortWeight[b.userEffort];
      
      return bScore - aScore;
    });
  }

  getTotalMissingItems(): number {
    return this.getAllMissingItems().length;
  }

  private getFieldValue(org: any, field: string): any {
    return org[field];
  }

  // ===============================
  // UI STATE METHODS
  // ===============================

  toggleCollapsed() {
    const newState = !this.isCollapsed();
    this.isCollapsed.set(newState);
    localStorage.setItem('org-status-collapsed', newState.toString());
  }

  showAllMissingItems() {
    this.showAllMissing.set(true);
  }

shouldShowVerification(): boolean {
  const state = this.onboardingState();
  return !!(state?.isComplete && !state.organization?.isVerified);
}

canRequestVerification(): boolean {
  const state = this.onboardingState();
  return !!(state?.isComplete && state.organization?.status !== 'pending_verification');
}
  getVerificationButtonText(): string {
    const state = this.onboardingState();
    if (state?.organization?.status === 'pending_verification') {
      return 'Verification Pending';
    }
    return 'Request Verification';
  }

  getPrimaryAction(): StatusPriority | null {
    const highPriority = this.getHighPriorityMissingItems();
    return highPriority.length > 0 ? highPriority[0] : null;
  }

  // ===============================
  // ACTION HANDLERS
  // ===============================

  handlePrimaryAction() {
    const action = this.getPrimaryAction();
    if (action) {
      this.actionClicked.emit({ type: 'complete_setup', target: action.field });
    }
  }

  completeSetup() {
    this.actionClicked.emit({ type: 'complete_setup' });
  }

  editOrganization() {
    this.actionClicked.emit({ type: 'edit_organization' });
  }

  requestVerification() {
    if (this.canRequestVerification()) {
      this.actionClicked.emit({ type: 'get_verified' });
    }
  }

  // ===============================
  // STYLING METHODS
  // ===============================

  getStatusIcon(): any {
    const state = this.onboardingState();
    if (!state) return this.ClockIcon;
    
    if (state.organization?.isVerified) return this.CheckCircleIcon;
    if (state.isComplete) return this.ShieldIcon;
    return this.AlertTriangleIcon;
  }

  getStatusBadgeClass(): string {
    const state = this.onboardingState();
    if (!state) return 'bg-gray-100 text-gray-700';
    
    if (state.organization?.isVerified) {
      return 'bg-green-100 text-green-700';
    } else if (state.isComplete) {
      return 'bg-blue-100 text-blue-700';
    } else if (state.completionPercentage >= 50) {
      return 'bg-orange-100 text-orange-700';
    } else {
      return 'bg-red-100 text-red-700';
    }
  }

  getMainStatusCardClass(): string {
    const state = this.onboardingState();
    if (!state) return 'bg-gray-50 border-gray-200';
    
    if (state.organization?.isVerified) {
      return 'bg-green-50 border border-green-200';
    } else if (state.isComplete) {
      return 'bg-blue-50 border border-blue-200';
    } else if (state.completionPercentage >= 50) {
      return 'bg-orange-50 border border-orange-200';
    } else {
      return 'bg-red-50 border border-red-200';
    }
  }

  getStatusIconBg(): string {
    const state = this.onboardingState();
    if (!state) return 'bg-gray-100';
    
    if (state.organization?.isVerified) return 'bg-green-100';
    if (state.isComplete) return 'bg-blue-100';
    if (state.completionPercentage >= 50) return 'bg-orange-100';
    return 'bg-red-100';
  }

  getStatusIconColor(): string {
    const state = this.onboardingState();
    if (!state) return 'text-gray-600';
    
    if (state.organization?.isVerified) return 'text-green-600';
    if (state.isComplete) return 'text-blue-600';
    if (state.completionPercentage >= 50) return 'text-orange-600';
    return 'text-red-600';
  }

  getStatusTitleColor(): string {
    const state = this.onboardingState();
    if (!state) return 'text-gray-900';
    
    if (state.organization?.isVerified) return 'text-green-900';
    if (state.isComplete) return 'text-blue-900';
    if (state.completionPercentage >= 50) return 'text-orange-900';
    return 'text-red-900';
  }

  getStatusTextColor(): string {
    const state = this.onboardingState();
    if (!state) return 'text-gray-700';
    
    if (state.organization?.isVerified) return 'text-green-700';
    if (state.isComplete) return 'text-blue-700';
    if (state.completionPercentage >= 50) return 'text-orange-700';
    return 'text-red-700';
  }

  getActionButtonColor(): string {
    const state = this.onboardingState();
    if (!state) return 'text-gray-600 hover:text-gray-800';
    
    if (state.organization?.isVerified) return 'text-green-600 hover:text-green-800';
    if (state.isComplete) return 'text-blue-600 hover:text-blue-800';
    if (state.completionPercentage >= 50) return 'text-orange-600 hover:text-orange-800';
    return 'text-red-600 hover:text-red-800';
  }

  getProgressBarColor(): string {
    const state = this.onboardingState();
    if (!state) return 'bg-gray-400';
    
    if (state.organization?.isVerified) {
      return 'bg-gradient-to-r from-green-500 to-green-600';
    } else if (state.isComplete) {
      return 'bg-gradient-to-r from-blue-500 to-blue-600';
    } else if (state.completionPercentage >= 50) {
      return 'bg-gradient-to-r from-orange-500 to-orange-600';
    } else {
      return 'bg-gradient-to-r from-red-500 to-red-600';
    }
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
}