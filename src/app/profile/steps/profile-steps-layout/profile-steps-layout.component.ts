import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Check } from 'lucide-angular';
import { UiButtonComponent} from '../../../shared/components';
import { FundingApplicationProfileService } from '../../../applications/services/funding-profile.service';

@Component({
  selector: 'app-profile-steps-layout',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule, UiButtonComponent],
  templateUrl: 'profile-steps-layout.component.html'
})
export class ProfileStepsLayoutComponent {
  isSaving = signal(false);
  isSubmitting = signal(false);
  
  CheckIcon = Check;
  ArrowLeftIcon = ArrowLeft;
  
  constructor(
    public profileService: FundingApplicationProfileService,
    private router: Router
  ) {}
  
  getCurrentStepTitle(): string {
    const currentStep = this.profileService.steps[this.profileService.currentStepIndex()];
    return currentStep?.title || '';
  }
  
  getCurrentStepDescription(): string {
    const currentStep = this.profileService.steps[this.profileService.currentStepIndex()];
    const descriptions: { [key: string]: string } = {
      'admin': 'Fill in your company\'s key administrative details to help us understand your business structure and operational setup. Ensure all required fields are completed accurately.',
      'documents': 'Please provide the necessary documents to support your investment readiness profile. Accurate and complete documentation helps expedite the review process.',
      'business-review': 'Provide comprehensive information about your business operations, market position, and competitive landscape.',
      'swot': 'Analyze your business strengths, weaknesses, opportunities, and threats to provide investors with strategic insights.',
      'management': 'Provide detailed information about the governance structures and key personnel managing your organization. This section helps us understand the leadership and oversight in place to ensure effective business operations.',
      'business-plan': 'Share your strategic business plan, including market analysis, financial projections, and growth strategies.',
      'financial': 'Provide detailed financial information including historical performance, current financial position, and future projections.'
    };
    return descriptions[currentStep?.id || ''] || currentStep?.description || '';
  }
  
  goToProfileHome() {
    this.router.navigate(['/dashboard/profile']);
  }
  
  goToStep(stepId: string) {
    this.profileService.setCurrentStep(stepId);
    this.router.navigate(['/dashboard/profile/steps', stepId]);
  }
  
  previousStep() {
    this.profileService.previousStep();
    this.router.navigate(['/dashboard/profile/steps', this.profileService.currentStepId()]);
  }
  
  async saveChanges() {
    this.isSaving.set(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.isSaving.set(false);
  }
  
  async saveAndContinue() {
    this.isSaving.set(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.isSaving.set(false);
    
    this.profileService.nextStep();
    this.router.navigate(['/dashboard/profile/steps', this.profileService.currentStepId()]);
  }
  
  async submitProfile() {
    this.isSubmitting.set(true);
    const result = await this.profileService.submitProfile();
    this.isSubmitting.set(false);
    
    if (result.success) {
      this.router.navigate(['/dashboard/profile'], { 
        queryParams: { completed: 'true' } 
      });
    }
  }
  
  isFirstStep = () => this.profileService.currentStepIndex() === 0;
  isLastStep = () => this.profileService.currentStepIndex() === this.profileService.steps.length - 1;
  
  canAccessStep(step: any, index: number): boolean {
    const currentIndex = this.profileService.currentStepIndex();
    return index <= currentIndex || step.completed;
  }
  
  canSubmit(): boolean {
    return this.profileService.steps.every(step => step.completed);
  }
  
  getStepButtonClasses(step: any, index: number): string {
    return 'hover:bg-neutral-50 transition-colors rounded-lg p-2';
  }
  
  getStepIconClasses(step: any, index: number): string {
    const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2';
    const currentIndex = this.profileService.currentStepIndex();
    
    if (step.completed) {
      return `${baseClasses} bg-primary-500 border-primary-500 text-white`;
    } else if (index === currentIndex) {
      return `${baseClasses} bg-white border-primary-500 text-primary-600`;
    } else {
      return `${baseClasses} bg-neutral-200 border-neutral-300 text-neutral-600`;
    }
  }
  
  getStepTextClasses(step: any, index: number): string {
    const currentIndex = this.profileService.currentStepIndex();
    if (index === currentIndex) {
      return 'font-medium text-primary-600 border-b-2 border-primary-500 pb-1';
    }
    return 'text-neutral-600';
  }
}