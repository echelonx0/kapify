// src/app/funder/components/org-onboarding-layout/org-onboarding-layout.component.ts
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
  Menu,
  X,
  Save,
  ChevronRight,
} from 'lucide-angular';

import {
  FunderOnboardingService,
  OnboardingStep,
} from '../../services/funder-onboarding.service';

@Component({
  selector: 'app-organization-onboarding-layout',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule, CommonModule],
  templateUrl: 'org-onboarding-layout.component.html',
  styles: [
    `
      /* Smooth transitions */
      .transition-all {
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 200ms;
      }

      /* Custom scrollbar */
      nav::-webkit-scrollbar {
        width: 4px;
      }
      nav::-webkit-scrollbar-track {
        background: transparent;
      }
      nav::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
      }
      nav::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `,
  ],
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
  MenuIcon = Menu;
  XIcon = X;
  SaveIcon = Save;
  ChevronRightIcon = ChevronRight;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkMobile();
  }

  ngOnInit() {
    this.checkMobile();
    this.onboardingService.checkOnboardingStatus().subscribe();
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
    this.showMobileNav.update((show) => !show);
  }

  closeMobileNav() {
    this.showMobileNav.set(false);
  }

  goToStepAndCloseMobile(stepId: string) {
    this.goToStep(stepId);
    this.closeMobileNav();
  }

  // ===============================
  // NAVIGATION
  // ===============================

  goToFunderDashboard() {
    this.router.navigate(['/funder/']);
  }

  // ===============================
  // STEP INFORMATION
  // ===============================

  getStepInfo(): OnboardingStep[] {
    return this.onboardingService.getOnboardingSteps();
  }

  getTotalSteps(): number {
    return this.getStepInfo().length;
  }

  getRemainingTime(): string {
    const remainingSteps = this.getStepInfo().filter((step) => !step.completed);
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

  goToStep(stepId: string) {
    if (!this.canAccessStep(stepId)) {
      console.warn(`Cannot access step ${stepId}`);
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
        break;
    }
  }

  nextStep() {
    const currentStep = this.onboardingService.currentStep();

    switch (currentStep) {
      case 'organization-info':
        if (this.onboardingService.isBasicInfoValid()) {
          this.goToStep('legal-compliance');
        }
        break;
      case 'legal-compliance':
        if (this.onboardingService.isLegalInfoValid()) {
          this.goToStep('verification');
        }
        break;
      case 'verification':
        break;
      default:
        break;
    }
  }

  saveProgress(): void {
    this.onboardingService.saveToDatabase().subscribe({
      next: () => console.log('✅ Progress saved'),
      error: (error) => console.error('❌ Save failed:', error),
    });
  }

  saveAndContinue() {
    const currentStep = this.onboardingService.currentStep();
    let canContinue = false;

    switch (currentStep) {
      case 'organization-info':
        canContinue = this.onboardingService.isBasicInfoValid();
        break;
      case 'legal-compliance':
        canContinue = this.onboardingService.isLegalInfoValid();
        break;
      case 'verification':
        canContinue = this.onboardingService.isReadyForVerification();
        break;
    }

    if (canContinue) {
      this.onboardingService.saveToDatabase().subscribe({
        next: () => {
          if (!this.isLastStep()) {
            this.nextStep();
          }
        },
        error: (error) => {
          console.error('❌ Save failed:', error);
          if (!this.isLastStep()) {
            this.nextStep();
          }
        },
      });
    }
  }

  // ===============================
  // STEP STATE
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
  // STEP INFORMATION DISPLAY
  // ===============================

  getCurrentStepTitle(): string {
    const currentStep = this.onboardingService.currentStep();
    const stepInfo = this.getStepInfo().find((step) => step.id === currentStep);
    return stepInfo?.title || 'Organization Setup';
  }

  getCurrentStepNumber(): number {
    const currentStep = this.onboardingService.currentStep();
    const steps = this.getStepInfo();
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    return currentIndex + 1;
  }

  getCompletedSteps(): number {
    return this.getStepInfo().filter((step) => step.completed).length;
  }

  getOverallProgress(): number {
    const progress = this.onboardingService.getStepProgress();
    return progress.percentage;
  }

  // ===============================
  // STYLING
  // ===============================

  getStepIconClasses(step: OnboardingStep): string {
    const baseClasses =
      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all';

    if (step.completed) {
      return `${baseClasses} bg-green-100 text-green-600`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-teal-100 text-teal-600`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} bg-slate-100 text-slate-600`;
    } else {
      return `${baseClasses} bg-slate-100 text-slate-400`;
    }
  }

  getStepTitleClasses(step: OnboardingStep): string {
    const baseClasses = 'text-sm font-semibold';

    if (step.completed) {
      return `${baseClasses} text-green-900`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} text-slate-900`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} text-slate-900`;
    } else {
      return `${baseClasses} text-slate-500`;
    }
  }

  getStepCardClasses(step: OnboardingStep): string {
    const baseClasses =
      'w-full text-left p-4 rounded-xl border transition-all duration-200 hover:shadow-sm';

    if (step.completed) {
      return `${baseClasses} bg-green-50 border-green-200/50`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-teal-50 border-teal-300/50 ring-2 ring-teal-100`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} bg-white border-slate-200 hover:border-slate-300`;
    } else {
      return `${baseClasses} bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed`;
    }
  }

  getMobileStepCardClasses(step: OnboardingStep): string {
    const baseClasses =
      'w-full text-left p-3 rounded-xl border transition-all duration-200';

    if (step.completed) {
      return `${baseClasses} bg-green-50 border-green-200/50`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-teal-50 border-teal-300/50 ring-2 ring-teal-100`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} bg-white border-slate-200`;
    } else {
      return `${baseClasses} bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed`;
    }
  }

  submitForVerification() {
    if (!this.canSubmit()) {
      console.warn('Cannot submit - previous steps incomplete');
      return;
    }

    this.onboardingService.saveToDatabase().subscribe({
      next: () => {
        this.onboardingService.requestVerification().subscribe({
          next: (result) => {
            console.log('✅ Verification requested:', result.message);
            this.router.navigate(['/funder/dashboard']);
          },
          error: (error) => {
            console.error('❌ Verification request failed:', error);
          },
        });
      },
      error: (error) => {
        console.error('❌ Save failed before verification:', error);
      },
    });
  }
}
