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
    <div class="min-h-screen bg-slate-50">
      <!-- Mobile Header -->
      <header
        class="lg:hidden bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40"
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

        <!-- Mobile Progress Bar -->
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
        <!-- Main Content Area -->
        <main class="flex-1 flex flex-col lg:overflow-visible lg:min-h-0">
          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto">
            <div class="max-w-4xl mx-auto px-4 lg:px-8 py-6 w-full">
              <router-outlet />
            </div>
          </div>

          <!-- Footer Actions -->
          <footer
            class="bg-white border-t border-slate-200 px-4 lg:px-8 py-4 sticky bottom-0 z-30 flex-shrink-0"
          >
            <div
              class="max-w-4xl mx-auto flex items-center justify-between gap-3"
            >
              <!-- Back Button -->
              @if (!isFirstStep()) {
              <button
                (click)="previousStep()"
                class="px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 flex items-center gap-2"
              >
                <lucide-icon [name]="ArrowLeftIcon" [size]="16" />
                <span class="hidden sm:inline">Back</span>
              </button>
              } @else {
              <div></div>
              }

              <!-- Next/Submit Button & Proceed to Review -->
              <div class="flex items-center gap-3">
                @if (isLastStep()) {
                <button
                  (click)="submitProfile()"
                  [disabled]="isSubmitting()"
                  class="px-6 py-2.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 active:bg-teal-700 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 flex items-center gap-2"
                >
                  @if (isSubmitting()) {
                  <div
                    class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  ></div>
                  <span class="hidden sm:inline">Saving...</span>
                  } @else {
                  <span class="hidden sm:inline">Save and Exit</span>
                  <span class="sm:hidden">Exit</span>
                  }
                </button>
                } @else {
                <button
                  (click)="saveAndContinue()"
                  [disabled]="isSaving()"
                  class="px-6 py-2.5 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 active:bg-teal-700 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 flex items-center gap-2"
                >
                  @if (isSaving()) {
                  <div
                    class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                  ></div>
                  <span class="hidden sm:inline">Saving...</span>
                  } @else {
                  <span class="hidden sm:inline">Continue</span>
                  <span class="sm:hidden">Next</span>
                  }
                </button>
                }

                <!-- Proceed to Review Button -->
                @if (overallProgress() >= 86) {
                <button
                  (click)="goToProfileReview()"
                  class="px-4 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 flex items-center gap-2"
                >
                  <span class="hidden sm:inline">Proceed to Review</span>
                  <span class="sm:hidden">Review</span>
                </button>
                }
              </div>
            </div>
          </footer>
        </main>

        <!-- Desktop Sidebar -->
        <div
          class="hidden lg:flex lg:w-80 flex-col sticky top-0 h-screen z-40 bg-white border-l border-slate-200 overflow-hidden"
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

      <!-- Mobile Navigation Drawer -->
      @if (showMobileNav()) {
      <div class="fixed inset-0 z-40 lg:hidden">
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/25 backdrop-blur-sm transition-opacity duration-200"
          (click)="closeMobileNav()"
        ></div>

        <!-- Drawer -->
        <div
          class="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl flex flex-col z-50"
        >
          <!-- Drawer Header -->
          <div
            class="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0"
          >
            <h2 class="text-lg font-bold text-slate-900">Setup Steps</h2>
            <button
              (click)="closeMobileNav()"
              class="p-2 -mr-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
              type="button"
            >
              <lucide-icon [name]="XIcon" [size]="20" class="text-slate-600" />
            </button>
          </div>

          <!-- Drawer Progress Section -->
          <div class="px-6 py-4 border-b border-slate-200 flex-shrink-0">
            <div class="flex items-baseline gap-2 mb-3">
              <span class="text-2xl font-bold text-slate-900"
                >{{ overallProgress() }}%</span
              >
              <span class="text-sm text-slate-600"
                >{{ getCompletedSteps() }} of
                {{ getTotalSteps() }} complete</span
              >
            </div>

            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-700 ease-out"
                [style.width.%]="overallProgress()"
              ></div>
            </div>
          </div>

          <!-- Drawer Step Navigation -->
          <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-2">
            @for (step of stepInfo; track step.id; let i = $index) {
            <button
              (click)="goToStepAndCloseMobile(step.id)"
              [disabled]="!canAccessStep(step.id)"
              [class]="getMobileStepCardClasses(step)"
              class="w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              type="button"
            >
              <div class="flex items-start gap-3">
                <!-- Step Icon -->
                <div [class]="getStepIconClasses(step)" class="flex-shrink-0">
                  @if (getProfileStep(step.id)?.completed) {
                  <lucide-icon
                    [name]="CheckIcon"
                    [size]="14"
                    class="text-white"
                  />
                  } @else {
                  <span class="text-xs font-bold">{{ i + 1 }}</span>
                  }
                </div>

                <!-- Step Content -->
                <div class="flex-1 min-w-0">
                  <h3
                    [class]="getStepTitleClasses(step)"
                    class="text-sm font-semibold truncate"
                  >
                    {{ step.title }}
                  </h3>

                  <!-- Status Line -->
                  <div class="flex items-center gap-2 mt-1 text-xs">
                    @if (getProfileStep(step.id)?.completed) {
                    <span class="font-semibold text-green-700">Complete</span>
                    } @else if (isCurrentStep(step.id)) {
                    <span class="font-semibold text-teal-700">Current</span>
                    } @else if (canAccessStep(step.id)) {
                    <span class="text-slate-600">Ready</span>
                    } @else {
                    <span class="text-slate-500">Locked</span>
                    }
                  </div>
                </div>
              </div>
            </button>
            }
          </nav>

          <!-- Drawer Footer -->
          <div
            class="px-6 py-4 border-t border-slate-200 flex-shrink-0 space-y-3"
          >
            <button
              (click)="saveProgress()"
              [disabled]="isSaving()"
              class="w-full px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              @if (isSaving()) {
              <div
                class="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"
              ></div>
              <span>Saving...</span>
              } @else {
              <lucide-icon [name]="CheckIcon" [size]="16" />
              <span>Save Progress</span>
              }
            </button>

            @if (lastSaved()) {
            <div class="text-xs text-slate-600 text-center">
              <lucide-icon
                [name]="CheckIcon"
                [size]="12"
                class="inline mr-1 text-green-600"
              />
              Last saved {{ getLastSavedText() }}
            </div>
            }
          </div>
        </div>
      </div>
      }
    </div>
  `,
})
export class ProfileStepsLayoutComponent implements OnInit {
  private router = inject(Router);
  public profileService = inject(FundingProfileSetupService);
  private stepCheckerService = inject(SMEProfileStepsService);
  private utilityService = inject(FundingApplicationUtilityService);

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

  // Use constants directly
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
    const percentage = this.utilityService.calculateCompletionPercentage(
      completedSteps,
      totalSteps
    );
    return percentage;
  });

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkMobile();
  }

  ngOnInit() {
    this.checkMobile();
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

  getMobileStepCardClasses(step: any): string {
    const baseClasses = 'border transition-all duration-200';
    const profileStep = this.getProfileStep(step.id);

    if (profileStep?.completed) {
      return `${baseClasses} border-green-200/50 bg-green-50 hover:border-green-300/50 hover:shadow-sm`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} border-teal-300/50 bg-teal-50 hover:border-teal-400/50 shadow-sm`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm`;
    } else {
      return `${baseClasses} border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed`;
    }
  }

  // ===============================
  // STEP INFORMATION & NAVIGATION
  // ===============================

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
    const filledFields = requiredFields.length - missingFields.length;
    return Math.round((filledFields / requiredFields.length) * 100);
  }

  getCurrentStepTitle(): string {
    const currentStep =
      this.profileService.steps[this.profileService.currentStepIndex()];
    return currentStep?.title || '';
  }

  getCurrentStepNumber(): number {
    return this.profileService.currentStepIndex() + 1;
  }

  // ===============================
  // PROGRESS CALCULATIONS
  // ===============================

  getCompletedSteps(): number {
    return this.profileService.completedSteps();
  }

  getTotalSteps(): number {
    return this.profileService.steps.length;
  }

  // ===============================
  // STEP ACCESS & STYLING
  // ===============================

  canAccessStep(stepId: string): boolean {
    return this.stepCheckerService.isStepAccessible(stepId);
  }

  isCurrentStep(stepId: string): boolean {
    const currentStep =
      this.profileService.steps[this.profileService.currentStepIndex()];
    return currentStep?.id === stepId;
  }

  getStepIconClasses(step: any): string {
    const baseClasses =
      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0';
    const profileStep = this.getProfileStep(step.id);

    if (profileStep?.completed) {
      return `${baseClasses} bg-green-600 text-white`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-teal-500 text-white`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} bg-slate-200 text-slate-600`;
    } else {
      return `${baseClasses} bg-slate-100 text-slate-400`;
    }
  }

  getStepTitleClasses(step: any): string {
    const baseClasses = 'text-sm font-medium';
    const profileStep = this.getProfileStep(step.id);

    if (profileStep?.completed) {
      return `${baseClasses} text-green-900`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} text-teal-900`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} text-slate-900`;
    } else {
      return `${baseClasses} text-slate-500`;
    }
  }

  // ===============================
  // ACTIONS
  // ===============================

  goToProfileHome() {
    this.router.navigate(['/profile']);
  }

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

  goToProfileReview() {
    this.router.navigate(['/profile/steps/review']);
  }

  async saveProgress() {
    this.isSaving.set(true);
    try {
      await this.profileService.saveCurrentProgress();
      this.lastSaved.set(new Date());
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async saveAndContinue() {
    this.isSaving.set(true);
    try {
      // Give time for any pending admin form saves to flush
      await new Promise((resolve) => setTimeout(resolve, 100));

      await this.profileService.saveCurrentProgress();
      this.lastSaved.set(new Date());

      this.profileService.nextStep();
      this.router.navigate([
        '/profile/steps',
        this.profileService.currentStepId(),
      ]);
    } catch (error) {
      console.error('Failed to save and continue:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  canSubmit(): boolean {
    return this.profileService.steps
      .filter((step) => step.required)
      .every((step) => step.completed);
  }

  canExit(): boolean {
    return this.isLastStep();
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
    } catch (error) {
      console.error('Failed to submit profile:', error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // ===============================
  // UTILITIES
  // ===============================

  isFirstStep(): boolean {
    return this.profileService.currentStepIndex() === 0;
  }

  isLastStep(): boolean {
    return (
      this.profileService.currentStepIndex() ===
      this.profileService.steps.length - 1
    );
  }

  getLastSavedText(): string {
    const saved = this.lastSaved();
    if (!saved) return '';

    const now = new Date();
    const diffMs = now.getTime() - saved.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return saved.toLocaleDateString();
  }
}
