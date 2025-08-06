
// src/app/profile/profile-layout.component.ts
import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LucideAngularModule, ArrowLeft, ArrowRight, Check } from 'lucide-angular';
import { UiButtonComponent, UiProgressComponent, UiCardComponent } from '../../shared/components';
import { ProfileService } from '../profile.service';


@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule, UiButtonComponent, UiProgressComponent, UiCardComponent],
  template: `
    <div class="min-h-screen bg-neutral-50">
      <!-- Header -->
      <header class="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button 
                class="text-neutral-500 hover:text-neutral-700 transition-colors"
                (click)="goBack()"
              >
                <lucide-icon [img]="ArrowLeftIcon" [size]="20" />
              </button>
              <div>
                <h1 class="text-xl font-semibold text-neutral-900">Complete Your Profile</h1>
                <p class="text-sm text-neutral-600">Step {{ currentStepNumber() }} of {{ totalSteps() }}</p>
              </div>
            </div>
            
            <div class="text-sm text-neutral-500">
              {{ profileService.completionPercentage() }}% Complete
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="mt-4">
            <ui-progress [value]="profileService.completionPercentage()" color="primary" />
          </div>
        </div>
      </header>

      <!-- Step Navigation -->
      <div class="bg-white border-b border-neutral-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav class="flex space-x-8 overflow-x-auto py-4" aria-label="Progress">
            @for (step of profileService.steps; track step.id; let i = $index) {
              <button
                (click)="goToStep(step.id)"
                [class]="getStepClasses(step, i)"
                [disabled]="!canAccessStep(step, i)"
              >
                <div class="flex items-center">
                  <div [class]="getStepIconClasses(step)">
                    @if (step.completed) {
                      <lucide-icon [img]="CheckIcon" [size]="16" />
                    } @else {
                      <span class="text-xs font-medium">{{ i + 1 }}</span>
                    }
                  </div>
                  <div class="ml-3 text-left">
                    <div class="text-sm font-medium">{{ step.title }}</div>
                    <div class="text-xs text-neutral-500">{{ step.description }}</div>
                  </div>
                </div>
              </button>
            }
          </nav>
        </div>
      </div>

      <!-- Main Content -->
      <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <router-outlet />
      </main>

      <!-- Navigation Footer -->
      <footer class="sticky bottom-0 bg-white border-t border-neutral-200 py-4">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between">
            <ui-button 
              variant="outline" 
              (clicked)="previousStep()"
              [disabled]="isFirstStep()"
            >
              <lucide-icon [img]="ArrowLeftIcon" [size]="16" class="mr-2" />
              Previous
            </ui-button>
            
            @if (isLastStep()) {
              <ui-button 
                variant="primary"
                (clicked)="submitProfile()"
                [disabled]="!canSubmit() || isSubmitting()"
              >
                @if (isSubmitting()) {
                  Submitting...
                } @else {
                  Submit Profile
                }
              </ui-button>
            } @else {
              <ui-button 
                variant="primary"
                (clicked)="nextStep()"
                [disabled]="!canProceed()"
              >
                Next
                <lucide-icon [img]="ArrowRightIcon" [size]="16" class="ml-2" />
              </ui-button>
            }
          </div>
        </div>
      </footer>
    </div>
  `
})
export class ProfileLayoutComponent {
  isSubmitting = signal(false);
  
  ArrowLeftIcon = ArrowLeft;
  ArrowRightIcon = ArrowRight;
  CheckIcon = Check;
  
  constructor(
    public profileService: ProfileService,
    private router: Router
  ) {}
  
  currentStepNumber = () => this.profileService.currentStepIndex() + 1;
  totalSteps = () => this.profileService.steps.length;
  
  goBack() {
    this.router.navigate(['/dashboard']);
  }
  
  goToStep(stepId: string) {
    this.profileService.setCurrentStep(stepId);
    this.router.navigate(['/profile', stepId]);
  }
  
  previousStep() {
    this.profileService.previousStep();
    this.router.navigate(['/profile', this.profileService.currentStepId()]);
  }
  
  nextStep() {
    this.profileService.nextStep();
    this.router.navigate(['/profile', this.profileService.currentStepId()]);
  }
  
  async submitProfile() {
    this.isSubmitting.set(true);
    const result = await this.profileService.submitProfile();
    this.isSubmitting.set(false);
    
    if (result.success) {
      this.router.navigate(['/dashboard'], { 
        queryParams: { profileCompleted: 'true' } 
      });
    }
  }
  
  isFirstStep = () => this.profileService.currentStepIndex() === 0;
  isLastStep = () => this.profileService.currentStepIndex() === this.profileService.steps.length - 1;
  
  canAccessStep(step: any, index: number): boolean {
    // Can access current step, completed steps, or next step if current is completed
    const currentIndex = this.profileService.currentStepIndex();
    return index <= currentIndex || step.completed;
  }
  
  canProceed(): boolean {
    const currentStep = this.profileService.steps[this.profileService.currentStepIndex()];
    return currentStep?.completed || false;
  }
  
  canSubmit(): boolean {
    return this.profileService.steps.every(step => step.completed);
  }
  
  getStepClasses(step: any, index: number): string {
    const baseClasses = 'flex items-center p-2 rounded-lg transition-colors';
    const currentIndex = this.profileService.currentStepIndex();
    
    if (index === currentIndex) {
      return `${baseClasses} bg-primary-50 text-primary-700`;
    } else if (step.completed) {
      return `${baseClasses} text-neutral-900 hover:bg-neutral-50`;
    } else if (this.canAccessStep(step, index)) {
      return `${baseClasses} text-neutral-600 hover:bg-neutral-50`;
    } else {
      return `${baseClasses} text-neutral-400 cursor-not-allowed`;
    }
  }
  
  getStepIconClasses(step: any): string {
    const baseClasses = 'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium';
    
    if (step.completed) {
      return `${baseClasses} bg-primary-500 text-white`;
    } else {
      const currentIndex = this.profileService.currentStepIndex();
      const stepIndex = this.profileService.steps.indexOf(step);
      
      if (stepIndex === currentIndex) {
        return `${baseClasses} bg-primary-100 text-primary-600 border-2 border-primary-500`;
      } else {
        return `${baseClasses} bg-neutral-200 text-neutral-600`;
      }
    }
  }
}
