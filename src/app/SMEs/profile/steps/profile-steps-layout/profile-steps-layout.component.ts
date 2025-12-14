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
  Home,
  Clock,
  AlertCircle,
  CheckCircle,
  Menu,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-angular';

import { CommonModule } from '@angular/common';
import { FundingProfileSetupService } from 'src/app/SMEs/services/funding-profile-setup.service';
import { SMEProfileStepsService } from '../../services/sme-profile-steps.service';
import {
  ProfileStepsSidebarComponent,
  SectionData,
} from './profile-steps-sidebar.component';
import {
  FUNDING_STEPS,
  STEP_UI_CONFIG,
  STEP_FIELD_LABELS,
} from 'src/app/SMEs/services/funding-steps.constants';
import { FundingApplicationUtilityService } from 'src/app/SMEs/services/utility.service';
import { FullscreenDarkModeService } from '../financial-analysis/services/fullscreen-dark-mode.service';

@Component({
  selector: 'app-profile-steps-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    LucideAngularModule,
    CommonModule,
    ProfileStepsSidebarComponent,
  ],
  template: `
    <div class="min-h-screen bg-slate-50 relative">
      <!-- ===================================================== -->
      <!-- FULLSCREEN TOGGLE BUTTON (always visible) -->
      <!-- ===================================================== -->
      <button
        (click)="toggleFullscreen()"
        class="fixed top-4 right-4 z-[9999] p-2 rounded-lg bg-white shadow-lg border hover:bg-slate-100 transition"
      >
        <lucide-icon
          [name]="isFullscreen() ? Minimize2Icon : Maximize2Icon"
          [size]="18"
          class="text-slate-700"
        />
      </button>

      <!-- ===================================================== -->
      <!-- MOBILE HEADER (HIDDEN IN FULLSCREEN) -->
      <!-- ===================================================== -->
      <header
        class="lg:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40"
        *ngIf="!isFullscreen()"
      >
        <div class="flex items-center justify-between gap-3">
          <button
            (click)="toggleMobileNav()"
            class="p-2 -ml-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            type="button"
          >
            <lucide-icon [name]="MenuIcon" [size]="20" class="text-slate-600" />
          </button>

          <div class="text-center flex-1 min-w-0">
            <h1 class="text-base font-bold text-slate-900 truncate">
              {{ getCurrentStepTitle() }}
            </h1>
            <div class="text-xs text-slate-500">
              Step {{ getCurrentStepNumber() }} of {{ getTotalSteps() }}
            </div>
          </div>

          <div class="text-sm font-bold text-teal-600 flex-shrink-0">
            {{ overallProgress() }}%
          </div>
        </div>

        <div
          class="mt-3 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"
        >
          <div
            class="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-700 ease-out"
            [style.width.%]="overallProgress()"
          ></div>
        </div>
      </header>

      <div class="flex h-screen lg:h-auto">
        <!-- ===================================================== -->
        <!-- MAIN CONTENT AREA -->
        <!-- Fullscreen removes padding & expands width -->
        <!-- ===================================================== -->
        <main
          class="flex-1 flex flex-col lg:overflow-visible lg:min-h-0 transition-all duration-300"
          [class.w-full]="isFullscreen()"
          [class.p-0]="isFullscreen()"
        >
          <div class="flex-1 overflow-y-auto">
            <div
              class="mx-auto w-full transition-all duration-300"
              [class.max-w-none]="isFullscreen()"
              [class.p-0]="isFullscreen()"
              [class.max-w-4xl]="!isFullscreen()"
              [class.px-4]="!isFullscreen()"
              [class.lg:px-8]="!isFullscreen()"
              [class.py-6]="!isFullscreen()"
            >
              <router-outlet />
            </div>
          </div>

          <!-- FOOTER ACTIONS (HIDDEN IN FULLSCREEN) -->
          <footer
            class="bg-white border-t border-slate-200 px-4 lg:px-8 py-4 sticky bottom-0 z-30 flex-shrink-0"
            *ngIf="!isFullscreen()"
          >
            <div
              class="max-w-4xl mx-auto flex items-center justify-between gap-3"
            >
              <!-- Back Button -->
              <button
                *ngIf="!isFirstStep()"
                (click)="previousStep()"
                class="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-2"
              >
                <lucide-icon [name]="ArrowLeftIcon" [size]="16" />
                <span class="hidden sm:inline">Back</span>
              </button>

              <div *ngIf="isFirstStep()"></div>

              <!-- Next / Save Button -->
              <div class="flex items-center gap-3">
                <button
                  *ngIf="isLastStep()"
                  (click)="submitProfile()"
                  [disabled]="isSubmitting()"
                  class="px-6 py-2.5 text-sm font-medium text-white bg-teal-500 rounded-xl disabled:opacity-50 flex items-center gap-2"
                >
                  <span *ngIf="!isSubmitting()">Save and Exit</span>
                  <span *ngIf="isSubmitting()">Saving...</span>
                </button>

                <button
                  *ngIf="!isLastStep()"
                  (click)="saveAndContinue()"
                  [disabled]="isSaving()"
                  class="px-6 py-2.5 text-sm font-medium text-white bg-teal-500 rounded-xl disabled:opacity-50 flex items-center gap-2"
                >
                  <span *ngIf="!isSaving()">Continue</span>
                  <span *ngIf="isSaving()">Saving...</span>
                </button>
              </div>
            </div>
          </footer>
        </main>

        <!-- ===================================================== -->
        <!-- DESKTOP SIDEBAR (HIDDEN IN FULLSCREEN) -->
        <!-- ===================================================== -->
        <div
          class="hidden lg:flex lg:w-80 flex-col sticky top-0 h-screen z-40 bg-white border-l border-slate-200 overflow-hidden transition-all duration-300"
          *ngIf="!isFullscreen()"
        >
          <app-profile-steps-sidebar
            [steps]="stepConfigArray()"
            [currentStepId]="profileService.currentStepId()"
            [canAccessStepFn]="canAccessStep.bind(this)"
            [sectionDataFn]="getSectionData.bind(this)"
            (stepClicked)="goToStep($event)"
          />
        </div>
      </div>

      <!-- ===================================================== -->
      <!-- MOBILE DRAWER NAV (HIDDEN IN FULLSCREEN) -->
      <!-- ===================================================== -->
      <ng-container *ngIf="showMobileNav() && !isFullscreen()">
        <div class="fixed inset-0 z-40 lg:hidden">
          <div
            class="fixed inset-0 bg-black/25 backdrop-blur-sm"
            (click)="closeMobileNav()"
          ></div>

          <div
            class="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl flex flex-col z-50"
          >
            <div
              class="px-6 py-4 border-b border-slate-200 flex items-center justify-between"
            >
              <h2 class="text-lg font-bold">Setup Steps</h2>
              <button
                (click)="closeMobileNav()"
                class="p-2 hover:bg-slate-100 rounded-lg"
                type="button"
              >
                <lucide-icon
                  [name]="XIcon"
                  [size]="20"
                  class="text-slate-600"
                />
              </button>
            </div>

            <!-- Drawer Steps -->
            <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-2">
              <button
                *ngFor="let step of stepInfo; index as i"
                (click)="goToStepAndCloseMobile(step.id)"
                class="w-full text-left px-4 py-3 rounded-xl border"
              >
                {{ step.title }}
              </button>
            </nav>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class ProfileStepsLayoutComponent implements OnInit {
  private router = inject(Router);
  public profileService = inject(FundingProfileSetupService);
  private stepCheckerService = inject(SMEProfileStepsService);
  private utilityService = inject(FundingApplicationUtilityService);
  private darkMode = inject(FullscreenDarkModeService);
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
  HomeIcon = Home;
  ClockIcon = Clock;
  AlertCircleIcon = AlertCircle;
  CheckCircleIcon = CheckCircle;
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
    this.profileService.setCurrentStep(stepId);
    this.router.navigate(['/profile/steps', stepId]);
  }

  previousStep() {
    this.profileService.previousStep();
    this.router.navigate([
      '/profile/steps',
      this.profileService.currentStepId(),
    ]);
  }

  async saveAndContinue() {
    this.isSaving.set(true);
    try {
      await new Promise((r) => setTimeout(r, 120));
      await this.profileService.saveCurrentProgress();
      this.lastSaved.set(new Date());
      this.profileService.nextStep();
      this.router.navigate([
        '/profile/steps',
        this.profileService.currentStepId(),
      ]);
    } finally {
      this.isSaving.set(false);
    }
  }

  async submitProfile() {
    if (this.isLastStep()) {
      await this.saveProgress();
      this.router.navigate(['/profile'], {
        queryParams: { completed: 'true' },
      });
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

  async saveProgress() {
    this.isSaving.set(true);
    try {
      await this.profileService.saveCurrentProgress();
      this.lastSaved.set(new Date());
    } finally {
      this.isSaving.set(false);
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
    const saved = this.lastSaved();
    if (!saved) return '';
    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const mins = Math.floor(diffMs / 60000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;

    return saved.toLocaleDateString();
  }
}
