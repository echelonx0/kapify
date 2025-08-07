// src/app/dashboard/pages/dashboard-home.component.ts
import { Component, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { 
  LucideAngularModule, 
  ExternalLink, 
  Eye, 
  ChevronDown, 
  Circle 
} from 'lucide-angular';
import { AuthService } from '../auth/auth.service';
import { ProfileService } from '../profile/profile.service';
import { UiCardComponent, UiButtonComponent, UiProgressComponent, UiStatusBadgeComponent, UiProgressStepComponent } from '../shared/components';
 

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiCardComponent,
    UiButtonComponent,
    UiProgressComponent,
    UiStatusBadgeComponent,
    UiProgressStepComponent
  ],
  template: `
    <div class="space-y-8">
      <!-- Profile Progress Section - Only show for SMEs -->
      @if (userType() === 'sme') {
        <ui-card title="Let's get you going" subtitle="Fill out your profile and make an application" [padding]="false">
          <div class="p-6">
            <!-- Progress Bar -->
            <div class="mb-6">
              <ui-progress [value]="profileProgress()" [label]="progressLabel()" color="primary" />
            </div>

            <!-- Steps -->
            <div class="space-y-3">
              <!-- Email Verification -->
              <ui-progress-step [completed]="emailVerified()" description="This is the first step to getting started">
                Verify your email address
              </ui-progress-step>
              
              <!-- Profile Completion -->
              <div class="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div class="flex items-start space-x-3">
                  <div class="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center mt-0.5">
                    <lucide-icon [img]="CircleIcon" [size]="12" class="text-primary-500" />
                  </div>
                  <div>
                    <div class="text-sm font-medium text-neutral-900">Complete your investment readiness profile</div>
                    <div class="text-xs text-neutral-500 mt-1">{{ profileProgress() }}% complete - {{ getNextStep() }}</div>
                  </div>
                </div>
                <ui-button variant="primary" size="sm" (clicked)="resumeProfile()">
                  {{ profileProgress() === 0 ? 'Start Profile' : 'Resume Profile' }}
                  <lucide-icon [img]="ExternalLinkIcon" [size]="14" class="ml-1" />
                </ui-button>
              </div>
            </div>
          </div>
        </ui-card>
      }

      <!-- Available Funding - SME View -->
      @if (userType() === 'sme') {
        <ui-card title="Available Funding" subtitle="Explore the latest funding opportunities available for your business." [padding]="false">
          <div class="p-6">
            <!-- Funding Option Card -->
            <div class="border border-neutral-200 rounded-lg p-6">
              <div class="flex items-start space-x-4">
                <!-- Logo -->
                <div class="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-xl">K</span>
                </div>
                
                <!-- Content -->
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-neutral-900 mb-3">The Prosperity Impact Fund (PIF)</h3>
                  
                  <!-- Tags -->
                  <div class="flex flex-wrap gap-2 mb-4">
                    <ui-status-badge text="Pure Debt" color="primary" />
                    <ui-status-badge text="Mezzanine type instruments" color="success" />
                    <ui-status-badge text="Working Capital Solutions" color="warning" />
                    <ui-status-badge text="Invoice Financing" color="error" />
                    <ui-status-badge text="Asset Backed Finance" color="primary" />
                    <ui-status-badge text="Invoice Factoring" color="warning" />
                  </div>
                  
                  <!-- Description -->
                  <p class="text-sm text-neutral-600 mb-6 leading-relaxed">
                    The Prosperity Impact Fund (PIF) is a financial support program established to catalyze growth in small and medium enterprises (SMEs) and community-driven projects. The fund aims to create sustainable economic opportunities, promote social development, and drive innovation across key sectors.
                  </p>
                  
                  <!-- Action Buttons -->
                  <div class="flex space-x-3">
                    <ui-button variant="primary" size="md" (clicked)="viewApplication()">
                      View Application
                      <lucide-icon [img]="ExternalLinkIcon" [size]="16" class="ml-2" />
                    </ui-button>
                    <ui-button variant="outline" size="md" (clicked)="viewOpportunity()">
                      <lucide-icon [img]="EyeIcon" [size]="16" class="mr-2" />
                      View Opportunity
                    </ui-button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- See More Link -->
            <div class="mt-6 text-center">
              <button 
                (click)="seeMoreFunding()"
                class="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1 mx-auto"
              >
                <span>See more available funding</span>
                <lucide-icon [img]="ExternalLinkIcon" [size]="14" />
              </button>
            </div>
          </div>
        </ui-card>
      }

      <!-- Funder Dashboard Content -->
      @if (userType() === 'funder') {
        <ui-card title="Deal Pipeline" subtitle="Review and manage your investment opportunities" [padding]="false">
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div class="bg-blue-50 rounded-lg p-4">
                <div class="text-2xl font-bold text-blue-600">12</div>
                <div class="text-sm text-blue-700">New Applications</div>
              </div>
              <div class="bg-green-50 rounded-lg p-4">
                <div class="text-2xl font-bold text-green-600">8</div>
                <div class="text-sm text-green-700">Under Review</div>
              </div>
              <div class="bg-purple-50 rounded-lg p-4">
                <div class="text-2xl font-bold text-purple-600">R2.3M</div>
                <div class="text-sm text-purple-700">Available Capital</div>
              </div>
            </div>
            
            <div class="flex space-x-3">
              <ui-button variant="primary" size="md" (clicked)="viewPipeline()">
                View Full Pipeline
                <lucide-icon [img]="ExternalLinkIcon" [size]="16" class="ml-2" />
              </ui-button>
              <ui-button variant="outline" size="md" (clicked)="managePreferences()">
                Manage Preferences
              </ui-button>
            </div>
          </div>
        </ui-card>
      }

      <!-- General Instructions -->
      <ui-card [padding]="false">
        <button 
          (click)="toggleInstructions()"
          class="w-full p-6 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
        >
          <div>
            <h2 class="text-lg font-semibold text-neutral-900">{{ instructionsTitle() }}</h2>
            <p class="text-sm text-neutral-600 mt-1">{{ instructionsSubtitle() }}</p>
          </div>
          <lucide-icon 
            [img]="ChevronDownIcon" 
            [size]="20"
            [class]="chevronClasses()"
          />
        </button>
        
        @if (showInstructions()) {
          <div class="px-6 pb-6 border-t border-neutral-200">
            <div class="pt-4 text-sm text-neutral-600 space-y-3">
              @if (userType() === 'sme') {
                <p>Please ensure all required documents are prepared before starting your application.</p>
                <p>The application process typically takes 15-30 minutes to complete.</p>
                <p>You can save your progress and return to complete the application later.</p>
              } @else {
                <p>Review applications carefully and ensure all criteria are met before approval.</p>
                <p>Use the filtering system to find applications that match your investment criteria.</p>
                <p>Contact SMEs directly through the platform for additional information.</p>
              }
            </div>
          </div>
        }
      </ui-card>
    </div>
  `
})
export class DashboardHomeComponent {
  showInstructions = signal(false);
  
  ExternalLinkIcon = ExternalLink;
  EyeIcon = Eye;
  ChevronDownIcon = ChevronDown;
  CircleIcon = Circle;

  // Computed properties based on user and profile state
  userType = computed(() => {
    const user = this.authService.user();
    return user?.user?.userType || 'sme';
  });

  emailVerified = computed(() => {
    const user = this.authService.user();
    return user?.user?.emailVerified || false;
  });

  profileProgress = computed(() => {
    return this.profileService.completionPercentage();
  });

  progressLabel = computed(() => {
    const completedSteps = this.profileService.steps.filter(step => step.completed).length;
    const totalSteps = this.profileService.steps.length;
    return `Step ${completedSteps + 1} of ${totalSteps}`;
  });

  instructionsTitle = computed(() => {
    return this.userType() === 'sme' ? 'General Instructions' : 'Investment Guidelines';
  });

  instructionsSubtitle = computed(() => {
    return this.userType() === 'sme' 
      ? 'Read the following instructions carefully before proceeding with your application.'
      : 'Review the following guidelines for evaluating investment opportunities.';
  });

  constructor(
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService
  ) {}

  chevronClasses() {
    return `text-neutral-400 transform transition-transform ${this.showInstructions() ? 'rotate-180' : ''}`;
  }

  getNextStep(): string {
    const currentStep = this.profileService.steps.find(step => !step.completed);
    return currentStep ? `Next: ${currentStep.title}` : 'Profile Complete!';
  }

  // Navigation methods - using dashboard routes
  resumeProfile() {
    const currentStepId = this.profileService.currentStepId();
    this.router.navigate(['/dashboard/profile', currentStepId]);
  }

  viewApplication() {
    this.router.navigate(['/dashboard/applications']);
  }

  viewOpportunity() {
    this.router.navigate(['/dashboard/funding-opportunities']);
  }

  seeMoreFunding() {
    this.router.navigate(['/dashboard/funding-opportunities']);
  }

  // Funder-specific navigation
  viewPipeline() {
    this.router.navigate(['/dashboard/funder-dashboard']);
  }

  managePreferences() {
    this.router.navigate(['/dashboard/settings'], { fragment: 'preferences' });
  }

  toggleInstructions() {
    this.showInstructions.set(!this.showInstructions());
  }
}
