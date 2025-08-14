//src/app/funder/components/org-onboarding-layout/org-onboarding-layout.component.ts
import { Component, signal, OnInit, inject, HostListener } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  LucideAngularModule, 
  ArrowLeft, 
  Check, 
  Building2, 
  FileText, 
  Shield,
  Home, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Menu, 
  X,
  Save,
  ShieldIcon,
  ArrowRightIcon
} from 'lucide-angular';
import { UiButtonComponent } from '../../../shared/components';
import { FunderOnboardingService, OnboardingStep } from '../../services/funder-onboarding.service';

@Component({
  selector: 'app-organization-onboarding-layout',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule, UiButtonComponent, CommonModule],
  templateUrl: 'org-onboarding-layout.component.html',
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    /* Custom scrollbar for sidebar */
    nav::-webkit-scrollbar {
      width: 4px;
    }
    
    nav::-webkit-scrollbar-track {
      background: transparent;
    }
    
    nav::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
    }
    
    nav::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }

    /* Smooth transitions */
    .transition-all {
      transition-property: all;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      transition-duration: 200ms;
    }

    /* Enhanced hover states */
    button:hover:not(:disabled) {
      transform: translateY(-1px);
    }

    button:active:not(:disabled) {
      transform: translateY(0);
    }

    /* Mobile optimizations */
    @media (max-width: 1023px) {
      .sticky {
        position: -webkit-sticky;
        position: sticky;
      }
    }
  `]
})
export class OrganizationOnboardingLayoutComponent implements OnInit {
  private router = inject(Router);
   public onboardingService = inject(FunderOnboardingService);

  // State
  showMobileNav = signal(false);
  isMobile = signal(false);
  
  // Icons
  CheckIcon = Check;
  ArrowLeftIcon = ArrowLeft;
  HomeIcon = Home;
  ClockIcon = Clock;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
  MenuIcon = Menu;
  XIcon = X;
  SaveIcon = Save;
  ShieldIcon = ShieldIcon;
  ArrowRightIcon = ArrowRightIcon;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkMobile();
  }

  ngOnInit() {
    this.checkMobile();
    this.onboardingService.checkOnboardingStatus().subscribe();
   // this.onboardingService.startAutoSave();
  }

  private checkMobile() {
    this.isMobile.set(window.innerWidth < 1024);
    if (!this.isMobile()) {
      this.showMobileNav.set(false);
    }
  }

  // ===============================
  // MOBILE NAVIGATION
  // ===============================

  toggleMobileNav() {
    this.showMobileNav.update(show => !show);
  }

  closeMobileNav() {
    this.showMobileNav.set(false);
  }

  goToStepAndCloseMobile(stepId: string) {
    this.goToStep(stepId);
    this.closeMobileNav();
  }

  // ===============================
  // NAVIGATION METHODS
  // ===============================

 

  goToFunderDashboard() {
    this.router.navigate(['/funder/']);
  }

  requestHelp() {
    // Navigate to help or support page
    console.log('Help requested');
  }

  // ===============================
  // STEP INFORMATION METHODS
  // ===============================

  getStepInfo(): OnboardingStep[] {
    return this.onboardingService.getOnboardingSteps();
  }

  

  

  getCurrentStepEstimatedTime(): string {
    const currentStep = this.getStepInfo().find(step => step.id === this.onboardingService.currentStep());
    return currentStep?.estimatedTime || '';
  }

 

  getTotalSteps(): number {
    return this.getStepInfo().length;
  }
 

  getRemainingTime(): string {
    const remainingSteps = this.getStepInfo().filter(step => !step.completed);
    const totalMinutes = remainingSteps.reduce((total, step) => {
      const minutes = parseInt(step.estimatedTime.split(' ')[0]);
      return total + minutes;
    }, 0);
    
    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  getLastSavedText(): string {
    const lastSaved = this.onboardingService.lastSavedLocally();
    if (!lastSaved) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes === 0) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return 'over a day ago';
  }

  // ===============================
  // STEP STATE METHODS
  // ===============================

 

  

  // ===============================
  // STYLING METHODS
  // ===============================
 

  getStepIcon(stepId: string) {
    switch (stepId) {
      case 'organization-info':
        return Building2;
      case 'legal-compliance':
        return FileText;
      case 'verification':
        return Shield;
      default:
        return Building2;
    }
  }



  // Updated methods for org-onboarding-layout.component.ts - STEP NAVIGATION

  // ===============================
  // UPDATED NAVIGATION METHODS
  // ===============================

  goToStep(stepId: string) {
    // Check if user can access this step
    if (!this.canAccessStep(stepId)) {
      console.warn(`Cannot access step ${stepId} - prerequisites not met`);
      return;
    }
    
    this.onboardingService.setCurrentStep(stepId);
    this.router.navigate(['/funder/onboarding', stepId]);
  }

  previousStep() {
    const currentStep = this.onboardingService.currentStep();
    
    switch (currentStep) {
      case 'legal-compliance':
        this.goToStep('organization-info');
        break;
      case 'verification':
        this.goToStep('legal-compliance');
        break;
      default:
        // Already at first step or unknown step
        break;
    }
  }
  async saveProgress(): Promise<void> {
    try {
      await this.onboardingService.saveToDatabase().toPromise();
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }
  nextStep() {
    const currentStep = this.onboardingService.currentStep();
    
    switch (currentStep) {
      case 'organization-info':
        if (this.onboardingService.isBasicInfoValid()) {
          this.goToStep('legal-compliance');
        } else {
          console.warn('Complete basic info before proceeding');
        }
        break;
      case 'legal-compliance':
        if (this.onboardingService.isLegalInfoValid()) {
          this.goToStep('verification');
        } else {
          console.warn('Complete legal info before proceeding');
        }
        break;
      case 'verification':
        // Final step - no next step
        break;
      default:
        break;
    }
  }

  saveAndContinue() {
    const currentStep = this.onboardingService.currentStep();
    
    // Always save to local storage first
    console.log('💾 Saving current step progress...');
    
    // Validate current step completion
    let canContinue = false;
    
    switch (currentStep) {
      case 'organization-info':
        canContinue = this.onboardingService.isBasicInfoValid();
        if (!canContinue) {
          console.warn('⚠️ Please complete all required basic information fields');
          return;
        }
        break;
      case 'legal-compliance':
        canContinue = this.onboardingService.isLegalInfoValid();
        if (!canContinue) {
          console.warn('⚠️ Please complete all required legal information fields');
          return;
        }
        break;
      case 'verification':
        canContinue = this.onboardingService.isReadyForVerification();
        if (!canContinue) {
          console.warn('⚠️ Previous steps must be completed before verification');
          return;
        }
        break;
    }
    
    if (canContinue) {
      // Save to database and continue to next step
      this.onboardingService.saveToDatabase().subscribe({
        next: (result) => {
          console.log('✅ Progress saved, moving to next step');
          if (!this.isLastStep()) {
            this.nextStep();
          }
        },
        error: (error) => {
          console.error('❌ Failed to save progress:', error);
          // Still allow continuation if save fails - data is in localStorage
          if (!this.isLastStep()) {
            this.nextStep();
          }
        }
      });
    }
  }

  // ===============================
  // UPDATED STEP STATE METHODS
  // ===============================

  canAccessStep(stepId: string): boolean {
    return this.onboardingService.canAccessStep(stepId);
  }

  isCurrentStep(stepId: string): boolean {
    return this.onboardingService.currentStep() === stepId;
  }

  isFirstStep(): boolean {
    return this.onboardingService.currentStep() === 'organization-info';
  }

  isLastStep(): boolean {
    return this.onboardingService.currentStep() === 'verification';
  }

  canSubmit(): boolean {
    return this.onboardingService.isReadyForVerification();
  }

  // ===============================
  // UPDATED STEP INFORMATION METHODS
  // ===============================

  getCurrentStepTitle(): string {
    const currentStep = this.onboardingService.currentStep();
    const stepInfo = this.getStepInfo().find(step => step.id === currentStep);
    return stepInfo?.title || 'Organization Setup';
  }

  getCurrentStepDescription(): string {
    const currentStep = this.onboardingService.currentStep();
    const stepInfo = this.getStepInfo().find(step => step.id === currentStep);
    return stepInfo?.description || '';
  }

  getCurrentStepNumber(): number {
    const currentStep = this.onboardingService.currentStep();
    const steps = this.getStepInfo();
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    return currentIndex + 1;
  }

  getCompletedSteps(): number {
    return this.getStepInfo().filter(step => step.completed).length;
  }

  getOverallProgress(): number {
    const progress = this.onboardingService.getStepProgress();
    return progress.percentage;
  }

  // ===============================
  // UPDATED STYLING METHODS
  // ===============================

 

  getStepIconClasses(step: OnboardingStep): string {
    const baseClasses = 'w-8 h-8 rounded-lg flex items-center justify-center transition-colors';
    
    if (step.completed) {
      return `${baseClasses} bg-green-500 text-white`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-blue-500 text-white`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} bg-neutral-100 text-neutral-600`;
    } else {
      return `${baseClasses} bg-neutral-100 text-neutral-400`;
    }
  }

  getStepTitleClasses(step: OnboardingStep): string {
    const baseClasses = 'text-sm font-medium';
    
    if (step.completed) {
      return `${baseClasses} text-green-900`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} text-blue-900`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} text-neutral-900`;
    } else {
      return `${baseClasses} text-neutral-500`;
    }
  }

  // ===============================
  // VERIFICATION SUBMISSION
  // ===============================

  submitForVerification() {
    if (!this.canSubmit()) {
      console.warn('Cannot submit - previous steps incomplete');
      return;
    }

    console.log('🛡️ Submitting for verification from layout...');
    
    // Save data first, then request verification
    this.onboardingService.saveToDatabase().subscribe({
      next: (saveResult) => {
        console.log('✅ Data saved, requesting verification...');
        
        this.onboardingService.requestVerification().subscribe({
          next: (result) => {
            console.log('✅ Verification requested:', result.message);
            this.router.navigate(['/funder-dashboard']);
          },
          error: (error) => {
            console.error('❌ Verification request failed:', error);
          }
        });
      },
      error: (error) => {
        console.error('❌ Save failed before verification:', error);
      }
    });
  }

   getStepCardClasses(step: OnboardingStep): string {
    const baseClasses = 'relative hover:shadow-sm transition-all duration-200';
    
    if (step.completed) {
      return `${baseClasses} bg-green-50 border-green-200 hover:border-green-300`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-blue-50 border-blue-200 hover:border-blue-300 ring-2 ring-blue-100`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} bg-white border-neutral-200 hover:border-neutral-300`;
    } else {
      return `${baseClasses} bg-neutral-50 border-neutral-200 opacity-60 cursor-not-allowed`;
    }
  }

  getMobileStepCardClasses(step: OnboardingStep): string {
    const baseClasses = 'relative transition-all duration-200';
    
    if (step.completed) {
      return `${baseClasses} bg-green-50 border-green-200`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-blue-50 border-blue-200 ring-2 ring-blue-100`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} bg-white border-neutral-200`;
    } else {
      return `${baseClasses} bg-neutral-50 border-neutral-200 opacity-60 cursor-not-allowed`;
    }
  }
 
  
}