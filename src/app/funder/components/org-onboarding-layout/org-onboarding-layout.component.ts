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
  Save
} from 'lucide-angular';
import { UiButtonComponent, UiCardComponent } from '../../../shared/components';
import { FunderOnboardingService, OnboardingStep } from '../../services/funder-onboarding.service';

@Component({
  selector: 'app-organization-onboarding-layout',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule, UiButtonComponent, UiCardComponent, CommonModule],
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

  goToStep(stepId: string) {
    this.onboardingService.setCurrentStep(stepId);
    this.router.navigate(['/funder/onboarding', stepId]);
  }

  previousStep() {
    const steps = this.getStepInfo();
    const currentIndex = steps.findIndex(step => step.id === this.onboardingService.currentStep());
    if (currentIndex > 0) {
      this.goToStep(steps[currentIndex - 1].id);
    }
  }

  nextStep() {
    const steps = this.getStepInfo();
    const currentIndex = steps.findIndex(step => step.id === this.onboardingService.currentStep());
    if (currentIndex < steps.length - 1) {
      this.goToStep(steps[currentIndex + 1].id);
    }
  }

  saveAndContinue() {
    this.saveProgress().then(() => {
      if (!this.isLastStep()) {
        this.nextStep();
      }
    });
  }

  async saveProgress(): Promise<void> {
    try {
      await this.onboardingService.saveToDatabase().toPromise();
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  submitForVerification() {
    if (this.canSubmit()) {
      this.onboardingService.requestVerification().subscribe({
        next: (result) => {
          console.log('Verification requested:', result.message);
          this.router.navigate(['/funder-dashboard']);
        },
        error: (error) => console.error('Failed to request verification:', error)
      });
    }
  }

  goToFunderDashboard() {
    this.router.navigate(['/funder-dashboard']);
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

  getCurrentStepTitle(): string {
    const currentStep = this.getStepInfo().find(step => step.id === this.onboardingService.currentStep());
    return currentStep?.title || 'Organization Setup';
  }

  getCurrentStepDescription(): string {
    const currentStep = this.getStepInfo().find(step => step.id === this.onboardingService.currentStep());
    return currentStep?.description || '';
  }

  getCurrentStepEstimatedTime(): string {
    const currentStep = this.getStepInfo().find(step => step.id === this.onboardingService.currentStep());
    return currentStep?.estimatedTime || '';
  }

  getCurrentStepNumber(): number {
    const steps = this.getStepInfo();
    const currentIndex = steps.findIndex(step => step.id === this.onboardingService.currentStep());
    return currentIndex + 1;
  }

  getTotalSteps(): number {
    return this.getStepInfo().length;
  }

  getCompletedSteps(): number {
    return this.getStepInfo().filter(step => step.completed).length;
  }

  getOverallProgress(): number {
    const total = this.getTotalSteps();
    const completed = this.getCompletedSteps();
    return Math.round((completed / total) * 100);
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

  isCurrentStep(stepId: string): boolean {
    return this.onboardingService.currentStep() === stepId;
  }

  isFirstStep(): boolean {
    const steps = this.getStepInfo();
    const currentIndex = steps.findIndex(step => step.id === this.onboardingService.currentStep());
    return currentIndex === 0;
  }

  isLastStep(): boolean {
    const steps = this.getStepInfo();
    const currentIndex = steps.findIndex(step => step.id === this.onboardingService.currentStep());
    return currentIndex === steps.length - 1;
  }

  canAccessStep(step: OnboardingStep, index: number): boolean {
    // Allow access to completed steps
    if (step.completed) return true;
    
    // Allow access to current step
    if (this.isCurrentStep(step.id)) return true;
    
    // Allow access to next step if current step is completed
    const currentIndex = this.getStepInfo().findIndex(s => s.id === this.onboardingService.currentStep());
    if (index === currentIndex + 1) {
      const currentStep = this.getStepInfo()[currentIndex];
      return currentStep?.completed || false;
    }
    
    return false;
  }

  canSubmit(): boolean {
    const requiredSteps = this.getStepInfo().filter(step => step.required);
    return requiredSteps.every(step => step.completed);
  }

  // ===============================
  // STYLING METHODS
  // ===============================

  getStepCardClasses(step: OnboardingStep, index: number): string {
    const baseClasses = 'relative hover:shadow-sm transition-all duration-200';
    
    if (step.completed) {
      return `${baseClasses} bg-green-50 border-green-200 hover:border-green-300`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-blue-50 border-blue-200 hover:border-blue-300 ring-2 ring-blue-100`;
    } else if (this.canAccessStep(step, index)) {
      return `${baseClasses} bg-white border-neutral-200 hover:border-neutral-300`;
    } else {
      return `${baseClasses} bg-neutral-50 border-neutral-200 opacity-60 cursor-not-allowed`;
    }
  }

  getMobileStepCardClasses(step: OnboardingStep, index: number): string {
    const baseClasses = 'relative transition-all duration-200';
    
    if (step.completed) {
      return `${baseClasses} bg-green-50 border-green-200`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-blue-50 border-blue-200 ring-2 ring-blue-100`;
    } else if (this.canAccessStep(step, index)) {
      return `${baseClasses} bg-white border-neutral-200`;
    } else {
      return `${baseClasses} bg-neutral-50 border-neutral-200 opacity-60 cursor-not-allowed`;
    }
  }

  getStepIconClasses(step: OnboardingStep, index: number): string {
    const baseClasses = 'w-8 h-8 rounded-lg flex items-center justify-center transition-colors';
    
    if (step.completed) {
      return `${baseClasses} bg-green-500 text-white`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-blue-500 text-white`;
    } else if (this.canAccessStep(step, index)) {
      return `${baseClasses} bg-neutral-100 text-neutral-600`;
    } else {
      return `${baseClasses} bg-neutral-100 text-neutral-400`;
    }
  }

  getStepTitleClasses(step: OnboardingStep, index: number): string {
    const baseClasses = 'text-sm font-medium';
    
    if (step.completed) {
      return `${baseClasses} text-green-900`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} text-blue-900`;
    } else if (this.canAccessStep(step, index)) {
      return `${baseClasses} text-neutral-900`;
    } else {
      return `${baseClasses} text-neutral-500`;
    }
  }

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
}