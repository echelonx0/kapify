import {
  Component,
  signal,
  OnInit,
  inject,
  HostListener,
  computed,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  Check,
  Clock,
  Menu,
  X,
  Maximize2,
  Minimize2,
  CircleAlert,
  CircleCheckBig,
  House,
} from 'lucide-angular';

import { CommonModule } from '@angular/common';
import { FundingProfileSetupService } from 'src/app/fund-seeking-orgs/services/funding-profile-setup.service';
import { SMEProfileStepsService } from '../../services/sme-profile-steps.service';
import {
  ProfileStepsSidebarComponent,
  SectionData,
} from './components/profile-steps-sidebar.component';
import {
  FUNDING_STEPS,
  STEP_UI_CONFIG,
  STEP_FIELD_LABELS,
} from 'src/app/fund-seeking-orgs/services/funding-steps.constants';
import { FundingApplicationUtilityService } from 'src/app/fund-seeking-orgs/services/utility.service';
import { FullscreenDarkModeService } from '../financial-analysis/services/fullscreen-dark-mode.service';
import { StepSaveService } from '../../services/step-save.service';

@Component({
  selector: 'app-profile-steps-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    LucideAngularModule,
    CommonModule,
    ProfileStepsSidebarComponent,
  ],
  templateUrl: './profile-steps-layout.component.html',
})
export class ProfileStepsLayoutComponent implements OnInit {
  private router = inject(Router);
  public profileService = inject(FundingProfileSetupService);
  private stepCheckerService = inject(SMEProfileStepsService);
  private utilityService = inject(FundingApplicationUtilityService);
  private darkMode = inject(FullscreenDarkModeService);
  private stepSaveService = inject(StepSaveService);

  // Fullscreen state
  isFullscreen = signal(false);

  // State
  isSaving = signal(false);
  isSubmitting = signal(false);
  lastSaved = signal<Date | null>(null);
  showMobileNav = signal(false);
  isMobile = signal(false);

  // Icons
  CheckIcon = Check;
  ArrowLeftIcon = ArrowLeft;
  HomeIcon = House;
  ClockIcon = Clock;
  AlertCircleIcon = CircleAlert;
  CheckCircleIcon = CircleCheckBig;
  MenuIcon = Menu;
  XIcon = X;
  Maximize2Icon = Maximize2;
  Minimize2Icon = Minimize2;

  stepInfo = FUNDING_STEPS;
  stepUIConfig = STEP_UI_CONFIG;

  stepConfigArray = computed(() =>
    this.stepInfo.map((step) => ({
      id: step.id,
      title: step.title,
      description: step.description,
      estimatedTime: step.estimatedTime ?? '',
      ...this.stepUIConfig[step.id as keyof typeof this.stepUIConfig],
    }))
  );

  // Computed: Unsaved changes
  hasUnsavedChanges = computed(() => this.stepSaveService.hasUnsavedChanges());

  // Computed: Is saving
  isSavingLayout = computed(() => this.stepSaveService.isSaving());

  overallProgress = computed(() => {
    const totalSteps = this.profileService.steps.length;
    const completedSteps = this.profileService.completedSteps();
    return this.utilityService.calculateCompletionPercentage(
      completedSteps,
      totalSteps
    );
  });

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  ngOnInit() {
    this.checkMobile();
  }

  private checkMobile() {
    this.isMobile.set(window.innerWidth < 1024);
    if (!this.isMobile()) this.showMobileNav.set(false);
  }

  toggleFullscreen() {
    const isCurrentlyFullscreen = this.isFullscreen();

    if (!isCurrentlyFullscreen) {
      this.darkMode.activateDarkMode('advanced');
    } else if (isCurrentlyFullscreen) {
      this.darkMode.deactivateDarkMode();
    }

    this.isFullscreen.update((v) => !v);
    this.showMobileNav.set(false);
  }

  // Nav Helpers
  toggleMobileNav() {
    this.showMobileNav.update((v) => !v);
  }

  closeMobileNav() {
    this.showMobileNav.set(false);
  }

  goToStepAndCloseMobile(stepId: string) {
    this.goToStep(stepId);
    this.closeMobileNav();
  }

  getProfileStep(stepId: string) {
    return this.profileService.steps.find((step) => step.id === stepId);
  }

  getSectionData(stepId: string): SectionData | null {
    const step = this.getProfileStep(stepId);
    if (!step) return null;

    const missingFields = this.profileService.getMissingFieldsForStep(stepId);
    const completionPercentage = step.completed
      ? 100
      : this.calculateCompletionPercentage(stepId);

    return {
      stepId,
      completionPercentage,
      missingFields,
      isRequired: step.required ?? false,
      isComplete: step.completed ?? false,
    };
  }

  private calculateCompletionPercentage(stepId: string): number {
    const requiredFields = Object.keys(
      STEP_FIELD_LABELS[stepId as keyof typeof STEP_FIELD_LABELS] || {}
    );
    const missingFields = this.profileService.getMissingFieldsForStep(stepId);
    if (requiredFields.length === 0) return 0;
    return Math.round(
      ((requiredFields.length - missingFields.length) / requiredFields.length) *
        100
    );
  }

  getCurrentStepTitle() {
    return (
      this.profileService.steps[this.profileService.currentStepIndex()]
        ?.title || ''
    );
  }

  getCurrentStepNumber() {
    return this.profileService.currentStepIndex() + 1;
  }

  // Progress
  getCompletedSteps() {
    return this.profileService.completedSteps();
  }

  getTotalSteps() {
    return this.profileService.steps.length;
  }

  canAccessStep(stepId: string) {
    return this.stepCheckerService.isStepAccessible(stepId);
  }

  isCurrentStep(stepId: string) {
    return (
      this.profileService.steps[this.profileService.currentStepIndex()]?.id ===
      stepId
    );
  }

  // Navigation
  goToStep(stepId: string) {
    // Check for unsaved changes before navigating
    if (
      this.stepSaveService.hasUnsavedChanges() &&
      !confirm(this.stepSaveService.getUnsavedWarningMessage())
    ) {
      return;
    }

    this.profileService.setCurrentStep(stepId);
    this.router.navigate(['/profile/steps', stepId]);
    this.stepSaveService.resetChangeDetection();
  }

  previousStep() {
    // Check for unsaved changes before navigating
    if (
      this.stepSaveService.hasUnsavedChanges() &&
      !confirm(this.stepSaveService.getUnsavedWarningMessage())
    ) {
      return;
    }

    this.profileService.previousStep();
    this.router.navigate([
      '/profile/steps',
      this.profileService.currentStepId(),
    ]);
    this.stepSaveService.resetChangeDetection();
  }

  // Save current step from layout button
  async saveCurrentStep() {
    const result = await this.stepSaveService.saveCurrentStep();
    // Toast is shown by service, no additional UI needed here
  }

  // Save and continue - only advance on success
  async saveAndContinue() {
    const result = await this.stepSaveService.saveCurrentStep();

    if (result.success) {
      this.profileService.nextStep();
      this.router.navigate([
        '/profile/steps',
        this.profileService.currentStepId(),
      ]);
      this.stepSaveService.resetChangeDetection();
    }
    // If failed, toast already shown by service
  }

  async submitProfile() {
    if (this.isLastStep()) {
      // Save before exit
      const result = await this.stepSaveService.saveCurrentStep();
      if (result.success) {
        this.router.navigate(['/profile'], {
          queryParams: { completed: 'true' },
        });
      }
      return;
    }

    this.isSubmitting.set(true);
    try {
      const result = await this.profileService.submitForReview();
      if (result.success) {
        this.router.navigate(['/profile'], {
          queryParams: { completed: 'true' },
        });
      }
    } finally {
      this.isSubmitting.set(false);
    }
  }

  isFirstStep() {
    return this.profileService.currentStepIndex() === 0;
  }

  isLastStep() {
    return (
      this.profileService.currentStepIndex() ===
      this.profileService.steps.length - 1
    );
  }

  getLastSavedText() {
    return this.stepSaveService.getLastSavedText();
  }
}
