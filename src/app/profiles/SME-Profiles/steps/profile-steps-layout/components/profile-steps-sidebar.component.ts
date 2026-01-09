import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  Check,
  AlertCircle,
  Lock,
  ArrowLeft,
} from 'lucide-angular';

export interface StepConfig {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: any;
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];
}

export interface SectionData {
  stepId: string;
  completionPercentage: number;
  missingFields: string[];
  isRequired: boolean;
  isComplete: boolean;
}

@Component({
  selector: 'app-profile-steps-sidebar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <style>
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

      @keyframes slideInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes pulseScale {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }

      @keyframes fillBar {
        from {
          width: 0;
        }
        to {
          width: var(--progress);
        }
      }

      .step-card-enter {
        animation: slideInUp 0.3s ease-out forwards;
        opacity: 0;
      }

      .progress-fill {
        animation: fillBar 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      .step-card:hover {
        transform: translateY(-2px);
      }

      .step-card.current {
        animation: pulseScale 2s ease-in-out infinite;
      }

      .back-button:active {
        transform: scale(0.95);
      }

      @media (prefers-reduced-motion: reduce) {
        * {
          animation: none !important;
          transition: none !important;
        }
      }
    </style>

    <div
      class="flex flex-col h-full bg-white overflow-hidden border-r-4 border-slate-900"
    >
      <!-- Navigation Header: Back Button + Title -->
      <header
        class="px-4 py-3 border-b-4 border-slate-900 bg-slate-50 flex-shrink-0 flex items-center gap-3"
      >
        <button
          (click)="goBack()"
          class="back-button p-2 -ml-2 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-none border-3 border-slate-400 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-offset-2"
          title="Go back"
          aria-label="Go back"
        >
          <lucide-icon
            [name]="ArrowLeftIcon"
            [size]="20"
            class="text-slate-900 font-bold"
          />
        </button>
        <h2 class="text-sm font-black text-slate-900 uppercase tracking-wider">
          Go Back
        </h2>
      </header>

      <!-- Steps List - Compact Cards with Neo-Brutal Borders -->
      <nav class="flex-1 overflow-y-auto min-h-0">
        <div class="p-4 space-y-2">
          @for (step of steps(); track step.id; let i = $index) {
          <button
            (click)="stepClicked.emit(step.id)"
            [disabled]="!canAccessStep(step.id)"
            [class]="getStepCardClasses(step)"
            [style.--delay]="i * 0.05 + 's'"
            class="step-card w-full text-left transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-teal-500 focus:ring-offset-2 rounded-none"
          >
            <!-- Neo-Brutal Card: Thick borders, bold typography -->
            <div
              class="px-4 py-3 rounded-none border-3 transition-all duration-200"
              [class.border-green-600]="isStepComplete(step.id)"
              [class.border-teal-600]="
                isCurrentStep(step.id) && !isStepComplete(step.id)
              "
              [class.border-slate-400]="
                !isCurrentStep(step.id) &&
                !isStepComplete(step.id) &&
                canAccessStep(step.id)
              "
              [class.border-slate-300]="!canAccessStep(step.id)"
            >
              <!-- Row 1: Icon + Title + Badge -->
              <div class="flex items-center gap-3 mb-1.5">
                <!-- Step Icon: Bold Border -->
                <div
                  [class]="getStepIconClasses(step)"
                  class="w-6 h-6 rounded-none flex items-center justify-center flex-shrink-0 border-2 font-bold"
                >
                  @if (isStepComplete(step.id)) {
                  <lucide-icon
                    [name]="CheckIcon"
                    [size]="14"
                    class="text-white"
                  />
                  } @else if (!canAccessStep(step.id)) {
                  <lucide-icon [name]="LockIcon" [size]="14" />
                  } @else {
                  <lucide-icon [name]="step.icon" [size]="14" />
                  }
                </div>

                <!-- Title: Bold, Uppercase -->
                <h3
                  [class]="getStepTitleClasses(step)"
                  class="text-xs font-black uppercase tracking-wider truncate flex-1"
                >
                  {{ step.shortTitle }}
                </h3>

                <!-- Required Badge: Bold Red -->
                @if (step.priority === 'high' && !isStepComplete(step.id)) {
                <span
                  class="inline-block flex-shrink-0 px-2 py-0.5 rounded-none text-xs font-black bg-red-100 text-red-700 border-2 border-red-600 uppercase"
                >
                  *
                </span>
                }
              </div>

              <!-- Row 2: Status + Time -->
              <div class="flex items-center justify-between text-xs px-0.5">
                <!-- Status: Bold -->
                @if (isStepComplete(step.id)) {
                <span class="font-black text-green-700 uppercase"
                  >Complete</span
                >
                } @else if (isCurrentStep(step.id)) {
                <span class="font-black text-teal-700 uppercase"
                  >In Progress</span
                >
                } @else if (canAccessStep(step.id)) {
                <span class="font-bold text-slate-700 uppercase">Ready</span>
                } @else {
                <span class="font-bold text-slate-500 uppercase">Locked</span>
                }

                <!-- Time -->
                @if (!isStepComplete(step.id)) {
                <span class="font-bold text-slate-600">{{
                  step.estimatedTime
                }}</span>
                }
              </div>

              <!-- Row 3: Missing Fields Badge -->
              @if (!isStepComplete(step.id) && getMissingFields(step.id).length
              > 0) {
              <div
                class="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-amber-100 border-2 border-amber-600"
              >
                <lucide-icon
                  [name]="AlertCircleIcon"
                  [size]="12"
                  class="text-amber-700 flex-shrink-0 font-bold"
                />
                <span class="text-xs font-black text-amber-700 uppercase">
                  {{ getMissingFields(step.id).length }} missing
                </span>
              </div>
              }
            </div>
          </button>
          }
        </div>
      </nav>

      <!-- Footer Stats - Fixed at bottom, Neo-Brutal -->
      <div
        class="px-4 py-4 border-t-4 border-slate-900 bg-slate-100 flex-shrink-0 space-y-3"
      >
        <!-- Progress Bar: Thick, Bold -->
        <div class="space-y-1.5">
          <div
            class="flex items-center justify-between text-xs font-black uppercase tracking-wider"
          >
            <span class="text-slate-900">Required Progress</span>
            <span class="text-teal-700">{{ overallProgress() }}%</span>
          </div>
          <div
            class="w-full bg-slate-300 rounded-none h-3 overflow-hidden border-2 border-slate-900"
          >
            <div
              class="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-none transition-all duration-700 ease-out"
              [style.width.%]="overallProgress()"
            ></div>
          </div>
        </div>

        <!-- Stats Grid: Bold Numbers -->
        <div class="grid grid-cols-3 gap-2 pt-2 border-t-2 border-slate-300">
          <div
            class="text-center p-2 bg-white border-2 border-green-600 rounded-none"
          >
            <div class="text-base font-black text-green-700">
              {{ completedRequired() }}
            </div>
            <div class="text-xs font-bold text-slate-700 uppercase">Done</div>
          </div>
          <div
            class="text-center p-2 bg-white border-2 border-teal-600 rounded-none"
          >
            <div class="text-base font-black text-teal-700">
              {{ inProgressRequired() }}
            </div>
            <div class="text-xs font-bold text-slate-700 uppercase">
              Progress
            </div>
          </div>
          <div
            class="text-center p-2 bg-white border-2 border-slate-400 rounded-none"
          >
            <div class="text-base font-black text-slate-600">
              {{ lockedRequired() }}
            </div>
            <div class="text-xs font-bold text-slate-700 uppercase">Locked</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProfileStepsSidebarComponent {
  // Inputs
  steps = input.required<StepConfig[]>();
  currentStepId = input.required<string>();
  canAccessStepFn = input.required<(stepId: string) => boolean>();
  sectionDataFn = input.required<(stepId: string) => SectionData | null>();

  // Outputs
  stepClicked = output<string>();

  // Icons
  CheckIcon = Check;
  AlertCircleIcon = AlertCircle;
  LockIcon = Lock;
  ArrowLeftIcon = ArrowLeft;

  // ===============================
  // NAVIGATION
  // ===============================

  /**
   * Go back to previous page using browser history
   */
  goBack(): void {
    window.history.back();
  }

  // ===============================
  // COMPUTED: Required steps only
  // ===============================

  requiredSteps = computed(() => {
    return this.steps().filter((s) => this.isStepRequired(s.id));
  });

  overallProgress = computed(() => {
    const required = this.requiredSteps();
    const completed = required.filter((s) => this.isStepComplete(s.id)).length;
    return required.length > 0
      ? Math.round((completed / required.length) * 100)
      : 0;
  });

  completedRequired = computed(() => {
    return this.requiredSteps().filter((s) => this.isStepComplete(s.id)).length;
  });

  inProgressRequired = computed(() => {
    return this.requiredSteps().filter(
      (s) =>
        !this.isStepComplete(s.id) &&
        this.canAccessStep(s.id) &&
        this.getCompletionPercentage(s.id) > 0
    ).length;
  });

  lockedRequired = computed(() => {
    return this.requiredSteps().filter((s) => !this.canAccessStep(s.id)).length;
  });

  // ===============================
  // HELPER METHODS
  // ===============================

  isStepRequired(stepId: string): boolean {
    const data = this.sectionDataFn()(stepId);
    return data?.isRequired ?? false;
  }

  isStepComplete(stepId: string): boolean {
    const data = this.sectionDataFn()(stepId);
    return data?.isComplete ?? false;
  }

  isCurrentStep(stepId: string): boolean {
    return this.currentStepId() === stepId;
  }

  canAccessStep(stepId: string): boolean {
    return this.canAccessStepFn()(stepId);
  }

  getCompletionPercentage(stepId: string): number {
    const data = this.sectionDataFn()(stepId);
    return data?.completionPercentage ?? 0;
  }

  getMissingFields(stepId: string): string[] {
    const data = this.sectionDataFn()(stepId);
    return data?.missingFields ?? [];
  }

  // ===============================
  // DYNAMIC NEO-BRUTAL STYLING
  // ===============================

  getStepCardClasses(step: StepConfig): string {
    if (this.isStepComplete(step.id)) {
      return 'bg-green-50 hover:shadow-lg active:shadow-md';
    } else if (this.isCurrentStep(step.id)) {
      return 'bg-teal-50 hover:shadow-lg active:shadow-md current';
    } else if (this.canAccessStep(step.id)) {
      return 'bg-white hover:shadow-lg active:shadow-md';
    } else {
      return 'bg-slate-50 opacity-60 cursor-not-allowed';
    }
  }

  getStepIconClasses(step: StepConfig): string {
    const baseClasses = 'rounded-none flex-shrink-0';

    if (this.isStepComplete(step.id)) {
      return `${baseClasses} bg-green-600 text-white border-green-700`;
    } else if (this.isCurrentStep(step.id)) {
      return `${baseClasses} bg-teal-500 text-white border-teal-700`;
    } else if (this.canAccessStep(step.id)) {
      return `${baseClasses} bg-slate-200 text-slate-700 border-slate-400`;
    } else {
      return `${baseClasses} bg-slate-100 text-slate-400 border-slate-300`;
    }
  }

  getStepTitleClasses(step: StepConfig): string {
    if (this.isStepComplete(step.id)) {
      return 'text-green-900';
    } else if (this.isCurrentStep(step.id)) {
      return 'text-teal-900';
    } else if (this.canAccessStep(step.id)) {
      return 'text-slate-900';
    } else {
      return 'text-slate-500';
    }
  }
}
