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
  Menu,
  X,
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
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      .fade-in {
        animation: fadeIn 300ms ease-out;
      }

      @keyframes slideInLeft {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      .slide-in-left {
        animation: slideInLeft 400ms ease-out;
      }

      @keyframes progressFill {
        from {
          width: 0;
        }
      }
      .progress-bar {
        animation: progressFill 800ms ease-out;
      }

      .step-card {
        opacity: 0;
        animation: slideInLeft 400ms ease-out forwards;
        animation-delay: var(--delay, 0s);
      }

      .transition-all {
        transition-property: all;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        transition-duration: 200ms;
      }

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

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        .fade-in,
        .slide-in-left,
        .step-card,
        .progress-bar {
          opacity: 1;
          transform: none;
          animation: none;
        }
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

    if (currentStep === 'legal-compliance') {
      this.goToStep('organization-info');
    }
  }

  nextStep() {
    const currentStep = this.onboardingService.currentStep();

    // ✅ Only 2 steps - from org-info goes to legal-compliance
    if (currentStep === 'organization-info') {
      if (this.onboardingService.isBasicInfoValid()) {
        this.goToStep('legal-compliance');
      }
    }
    // ✅ After legal-compliance, show verification CTA (not a step)
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
    }

    if (canContinue) {
      this.onboardingService.saveToDatabase().subscribe({
        next: () => {
          // ✅ Don't auto-continue after step 2
          if (currentStep === 'organization-info') {
            this.nextStep();
          }
        },
        error: (error) => {
          console.error('❌ Save failed:', error);
        },
      });
    }
  }

  // ===============================
  // STEP STATE
  // ===============================

  getStepInfo(): OnboardingStep[] {
    return this.onboardingService.getOnboardingSteps();
  }

  getTotalSteps(): number {
    return this.getStepInfo().length; // Always 2
  }

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
    // ✅ Last step = legal-compliance (not verification)
    return this.onboardingService.currentStep() === 'legal-compliance';
  }

  /**
   * ✅ Onboarding is complete when both steps are done
   * Verification is a separate action after this
   */
  isOnboardingComplete(): boolean {
    return this.onboardingService.isOnboardingComplete();
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

  getStepIcon(stepId: string) {
    switch (stepId) {
      case 'organization-info':
        return Building2;
      case 'legal-compliance':
        return FileText;
      default:
        return Building2;
    }
  }

  // ===============================
  // STYLING
  // ===============================

  getStepIconClasses(step: OnboardingStep): string {
    const baseClasses =
      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all';

    if (step.completed) {
      return `${baseClasses} bg-green-500 text-white`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-teal-500 text-white`;
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
      return `${baseClasses} text-teal-900`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} text-slate-900`;
    } else {
      return `${baseClasses} text-slate-500`;
    }
  }

  getStepCardClasses(step: OnboardingStep): string {
    const baseClasses =
      'w-full text-left p-4 rounded-xl border transition-all duration-200';

    if (step.completed) {
      return `${baseClasses} bg-green-50 border-green-200/50 hover:shadow-sm`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-teal-50 border-teal-300/50 shadow-sm`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} bg-white border-slate-200 hover:border-teal-200 hover:shadow-sm`;
    } else {
      return `${baseClasses} bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed`;
    }
  }

  getMobileStepCardClasses(step: OnboardingStep): string {
    const baseClasses =
      'w-full text-left p-3 rounded-lg border transition-all duration-200';

    if (step.completed) {
      return `${baseClasses} bg-green-50 border-green-200/50`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-teal-50 border-teal-300/50 shadow-sm`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} bg-white border-slate-200`;
    } else {
      return `${baseClasses} bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed`;
    }
  }

  /**
   * ✅ Submit for verification - separate from step progression
   * Only enabled after onboarding is 100% complete
   */
  submitForVerification() {
    if (!this.isOnboardingComplete()) {
      console.warn('Cannot submit - onboarding incomplete');
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
