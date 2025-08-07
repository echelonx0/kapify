 
// src/app/profile/pages/profile-home.component.ts - PROFILE LANDING PAGE
import { Component, computed } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, ArrowRight, CheckCircle, Clock, AlertTriangle, FileText, Users, Building, DollarSign } from 'lucide-angular';
import { 
  UiCardComponent, 
  UiButtonComponent, 
  UiProgressComponent,
  UiStatusBadgeComponent 
} from '../../shared/components';
import { ProfileService } from '../profile.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-profile-home',
  standalone: true,
  imports: [
    LucideAngularModule,
    UiCardComponent,
    UiButtonComponent,
    UiProgressComponent,
    UiStatusBadgeComponent
  ],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-neutral-900 mb-4">Investment Readiness Profile</h1>
        <p class="text-lg text-neutral-600 max-w-2xl mx-auto">
          Complete your profile to unlock funding opportunities and connect with the right investors for your business.
        </p>
      </div>

      <!-- Progress Overview -->
      <ui-card title="Profile Progress" [padding]="false">
        <div class="p-6">
          <!-- Progress Bar -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-neutral-700">Overall Completion</span>
              <span class="text-sm text-neutral-500">{{ completedSteps() }} of {{ totalSteps() }} completed</span>
            </div>
            <ui-progress [value]="completionPercentage()" color="primary" />
          </div>

          <!-- Quick Stats -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-green-50 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-green-600">{{ completedSteps() }}</div>
              <div class="text-sm text-green-700">Completed</div>
            </div>
            <div class="bg-blue-50 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-blue-600">{{ inProgressSteps() }}</div>
              <div class="text-sm text-blue-700">In Progress</div>
            </div>
            <div class="bg-orange-50 rounded-lg p-4 text-center">
              <div class="text-2xl font-bold text-orange-600">{{ pendingSteps() }}</div>
              <div class="text-sm text-orange-700">Pending</div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4">
            @if (completionPercentage() === 0) {
              <ui-button variant="primary" size="lg" (clicked)="startProfile()">
                Start Your Profile
                <lucide-icon [img]="ArrowRightIcon" [size]="20" class="ml-2" />
              </ui-button>
            } @else if (completionPercentage() < 100) {
              <ui-button variant="primary" size="lg" (clicked)="continueProfile()">
                Continue Profile
                <lucide-icon [img]="ArrowRightIcon" [size]="20" class="ml-2" />
              </ui-button>
            } @else {
              <ui-button variant="primary" size="lg" (clicked)="reviewProfile()">
                Review Complete Profile
                <lucide-icon [img]="CheckCircleIcon" [size]="20" class="ml-2" />
              </ui-button>
            }
            
            @if (completionPercentage() > 0) {
              <ui-button variant="outline" size="lg" (clicked)="viewAllSteps()">
                View All Steps
              </ui-button>
            }
          </div>
        </div>
      </ui-card>

      <!-- Steps Overview -->
      <ui-card title="Profile Sections" subtitle="Complete all sections to maximize your funding opportunities">
        <div class="grid gap-4">
          @for (step of profileService.steps; track step.id; let i = $index) {
            <div 
              class="flex items-center justify-between p-4 border rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
              (click)="goToStep(step.id)"
            >
              <div class="flex items-center space-x-4">
                <!-- Step Icon -->
                <div [class]="getStepIconClasses(step)">
                  @if (step.completed) {
                    <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-white" />
                  } @else {
                    <lucide-icon [img]="getStepIcon(step.id)" [size]="20" />
                  }
                </div>
                
                <!-- Step Info -->
                <div>
                  <h3 class="font-medium text-neutral-900">{{ step.title }}</h3>
                  <p class="text-sm text-neutral-600">{{ getStepDescription(step.id) }}</p>
                </div>
              </div>

              <!-- Status -->
              <div class="flex items-center space-x-3">
                @if (step.completed) {
                  <ui-status-badge text="Complete" color="success" />
                } @else if (isCurrentStep(step.id)) {
                  <ui-status-badge text="Current" color="primary" />
                } @else {
                  <ui-status-badge text="Pending" color="warning" />
                }
                
                <lucide-icon [img]="ArrowRightIcon" [size]="16" class="text-neutral-400" />
              </div>
            </div>
          }
        </div>
      </ui-card>

      <!-- Benefits Card -->
      <ui-card title="Why Complete Your Profile?" [padding]="false">
        <div class="p-6">
          <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div class="flex items-start space-x-3">
                <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-green-500 mt-0.5" />
                <div>
                  <h4 class="font-medium text-neutral-900">Better Funding Matches</h4>
                  <p class="text-sm text-neutral-600">Get matched with funders that align with your business model and growth stage.</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-green-500 mt-0.5" />
                <div>
                  <h4 class="font-medium text-neutral-900">Faster Application Process</h4>
                  <p class="text-sm text-neutral-600">Pre-qualified profiles get priority review and faster funding decisions.</p>
                </div>
              </div>
            </div>
            
            <div class="space-y-4">
              <div class="flex items-start space-x-3">
                <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-green-500 mt-0.5" />
                <div>
                  <h4 class="font-medium text-neutral-900">Higher Success Rate</h4>
                  <p class="text-sm text-neutral-600">Complete profiles have 3x higher approval rates for funding applications.</p>
                </div>
              </div>
              
              <div class="flex items-start space-x-3">
                <lucide-icon [img]="CheckCircleIcon" [size]="20" class="text-green-500 mt-0.5" />
                <div>
                  <h4 class="font-medium text-neutral-900">Investor Confidence</h4>
                  <p class="text-sm text-neutral-600">Detailed profiles build trust and credibility with potential funders.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ui-card>

      <!-- Help Section -->
      <ui-card>
        <div class="text-center">
          <h3 class="text-lg font-semibold text-neutral-900 mb-2">Need Help?</h3>
          <p class="text-neutral-600 mb-4">
            Our team is here to help you complete your profile and maximize your funding potential.
          </p>
          <ui-button variant="outline" (clicked)="requestHelp()">
            Request Assistance
          </ui-button>
        </div>
      </ui-card>
    </div>
  `
})
export class ProfileHomeComponent {
  ArrowRightIcon = ArrowRight;
  CheckCircleIcon = CheckCircle;
  ClockIcon = Clock;
  AlertTriangleIcon = AlertTriangle;
  FileTextIcon = FileText;
  UsersIcon = Users;
  BuildingIcon = Building;
  DollarSignIcon = DollarSign;

  completionPercentage = computed(() => this.profileService.completionPercentage());
  completedSteps = computed(() => this.profileService.steps.filter(step => step.completed).length);
  totalSteps = computed(() => this.profileService.steps.length);
  inProgressSteps = computed(() => 1); // Current step if any in progress
  pendingSteps = computed(() => this.totalSteps() - this.completedSteps() - this.inProgressSteps());

  constructor(
    public profileService: ProfileService,
    private authService: AuthService,
    private router: Router
  ) {}

  isCurrentStep(stepId: string): boolean {
    return this.profileService.currentStepId() === stepId;
  }

  getStepIconClasses(step: any): string {
    const baseClasses = 'w-10 h-10 rounded-lg flex items-center justify-center';
    
    if (step.completed) {
      return `${baseClasses} bg-green-500`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-primary-500 text-white`;
    } else {
      return `${baseClasses} bg-neutral-200 text-neutral-600`;
    }
  }

  getStepIcon(stepId: string): any {
    const icons: { [key: string]: any } = {
      'admin': Building,
      'documents': FileText,
      'business-review': Building,
      'swot': AlertTriangle,
      'management': Users,
      'business-plan': FileText,
      'financial': DollarSign
    };
    return icons[stepId] || FileText;
  }

  getStepDescription(stepId: string): string {
    const descriptions: { [key: string]: string } = {
      'admin': 'Company registration, legal structure, and administrative details',
      'documents': 'Upload required business documents and certifications',
      'business-review': 'Business operations, market position, and competitive analysis',
      'swot': 'Strengths, weaknesses, opportunities, and threats analysis',
      'management': 'Leadership team, governance structure, and key personnel',
      'business-plan': 'Strategic planning, market analysis, and growth projections',
      'financial': 'Financial statements, projections, and performance metrics'
    };
    return descriptions[stepId] || 'Complete this section of your profile';
  }

  // Navigation methods
  startProfile() {
    this.router.navigate(['/dashboard/profile/steps']);
  }

  continueProfile() {
    const currentStepId = this.profileService.currentStepId();
    this.router.navigate(['/dashboard/profile/steps', currentStepId]);
  }

  reviewProfile() {
    this.router.navigate(['/dashboard/profile/steps']);
  }

  viewAllSteps() {
    this.router.navigate(['/dashboard/profile/steps']);
  }

  goToStep(stepId: string) {
    this.router.navigate(['/dashboard/profile/steps', stepId]);
  }

  requestHelp() {
    // Implement help request functionality
    console.log('Help requested');
  }
}
