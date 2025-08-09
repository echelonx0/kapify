 
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
  templateUrl: 'profile-home.component.html'
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
