// import { Component, Input } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   LucideAngularModule,
//   CheckCircle,
//   Loader2,
//   Circle,
// } from 'lucide-angular';

// export interface ProcessingStageStatus {
//   stage: string;
//   label: string;
//   details?: string;
//   completed: boolean;
//   active: boolean;
// }

// @Component({
//   selector: 'app-processing-timeline',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule],
//   template: `
//     <div class="space-y-4 max-w-md mx-auto">
//       @for (status of stages; track status.stage; let i = $index) {
//       <div class="flex items-start space-x-3 group">
//         <!-- Status Indicator -->
//         <div class="flex-shrink-0 mt-1">
//           @if (status.completed) {
//           <div
//             class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm"
//           >
//             <lucide-icon
//               [img]="CheckCircleIcon"
//               [size]="14"
//               class="text-white"
//             ></lucide-icon>
//           </div>
//           } @else if (status.active) {
//           <div
//             class="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center shadow-md animate-pulse"
//           >
//             <lucide-icon
//               [img]="Loader2Icon"
//               [size]="14"
//               class="text-white animate-spin"
//             ></lucide-icon>
//           </div>
//           } @else {
//           <div
//             class="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center"
//           >
//             <lucide-icon
//               [img]="CircleIcon"
//               [size]="10"
//               class="text-slate-400"
//             ></lucide-icon>
//           </div>
//           }
//         </div>

//         <!-- Connector line (if not last) -->
//         @if (i < stages.length - 1) {
//         <div
//           class="absolute left-2.5 top-8 w-0.5 h-8 transition-all duration-500 ease-out"
//           [class.bg-gradient-to-b]="true"
//           [class.from-teal-400]="status.active"
//           [class.to-teal-200]="status.active"
//           [class.from-green-300]="status.completed"
//           [class.to-green-200]="status.completed"
//           [class.from-slate-200]="!status.active && !status.completed"
//           [class.to-slate-100]="!status.active && !status.completed"
//         ></div>
//         }

//         <!-- Content -->
//         <div class="flex-1 min-w-0 pt-0.5">
//           <div
//             class="text-sm font-medium transition-colors duration-200"
//             [class.text-slate-900]="status.completed || status.active"
//             [class.text-slate-500]="!status.completed && !status.active"
//           >
//             {{ status.label }}
//           </div>

//           @if (status.active && status.details) {
//           <div class="text-xs text-slate-600 mt-1 animate-pulse">
//             {{ status.details }}
//           </div>
//           } @if (status.completed) {
//           <div class="text-xs text-green-600 mt-1 font-medium">✓ Complete</div>
//           }
//         </div>
//       </div>
//       }
//     </div>
//   `,
//   styles: [
//     `
//       :host ::ng-deep .relative {
//         position: relative;
//       }
//     `,
//   ],
// })
// export class ProcessingTimelineComponent {
//   CheckCircleIcon = CheckCircle;
//   Loader2Icon = Loader2;
//   CircleIcon = Circle;

//   @Input() stages: ProcessingStageStatus[] = [];
// }

import { Component, Input, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  CheckCircle,
  Loader2,
  Circle,
  Zap,
} from 'lucide-angular';
import { signal, computed } from '@angular/core';

export interface ProcessingStageStatus {
  stage: string;
  label: string;
  details?: string;
  estimatedTime?: string;
  completed: boolean;
  active: boolean;
}

@Component({
  selector: 'app-processing-timeline',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="w-full space-y-6">
      <!-- Header with Progress -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-slate-900">
            Kapify Intelligence Processing
          </h3>
          <p class="text-sm text-slate-600 mt-1">
            {{ currentStageLabel() }} — {{ elapsedTime() }}s elapsed
          </p>
        </div>
        <div
          class="text-right px-4 py-2 bg-teal-50 border border-teal-200/50 rounded-xl"
        >
          <div
            class="text-xs font-semibold text-teal-900 uppercase tracking-wide"
          >
            Progress
          </div>
          <div class="text-2xl font-bold text-teal-600 mt-1">
            {{ currentStageIndex() + 1 }}/{{ stages.length }}
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-700 ease-out"
          [style.width.%]="progressPercent()"
        ></div>
      </div>

      <!-- Horizontal Timeline Cards -->
      <div class="grid grid-cols-5 gap-3">
        @for (status of stages; track status.stage; let i = $index) {
        <div class="relative group" [class.col-span-1]="true">
          <!-- Card -->
          <div
            class="p-4 rounded-xl border-2 transition-all duration-300 h-full flex flex-col justify-between"
            [class.border-teal-300]="status.active"
            [class.bg-teal-50]="status.active"
            [class.shadow-md]="status.active"
            [class.border-green-300]="status.completed && !status.active"
            [class.bg-green-50]="status.completed && !status.active"
            [class.border-slate-200]="!status.completed && !status.active"
            [class.bg-white]="!status.completed && !status.active"
          >
            <!-- Status Indicator -->
            <div class="flex items-center justify-center mb-3">
              @if (status.completed) {
              <div
                class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-sm"
              >
                <lucide-icon
                  [img]="CheckCircleIcon"
                  [size]="20"
                  class="text-white"
                ></lucide-icon>
              </div>
              } @else if (status.active) {
              <div
                class="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center shadow-md animate-pulse"
              >
                <lucide-icon
                  [img]="Loader2Icon"
                  [size]="20"
                  class="text-white animate-spin"
                ></lucide-icon>
              </div>
              } @else {
              <div
                class="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center"
              >
                <span class="text-xs font-semibold text-slate-500">
                  {{ i + 1 }}
                </span>
              </div>
              }
            </div>

            <!-- Stage Label -->
            <div class="text-center">
              <div
                class="text-xs font-bold uppercase tracking-wider transition-colors duration-200"
                [class.text-slate-900]="status.completed || status.active"
                [class.text-slate-500]="!status.completed && !status.active"
              >
                {{ status.label }}
              </div>

              @if (status.estimatedTime) {
              <div class="text-xs text-slate-500 mt-2">
                ~{{ status.estimatedTime }}
              </div>
              } @if (status.active && status.details) {
              <div class="text-xs text-teal-600 font-medium mt-2 animate-pulse">
                {{ status.details }}
              </div>
              } @if (status.completed) {
              <div class="text-xs text-green-600 font-medium mt-2">
                ✓ Complete
              </div>
              }
            </div>
          </div>

          <!-- Connector Arrow (if not last) -->
          @if (i < stages.length - 1) {
          <div
            class="absolute -right-3.5 top-1/2 transform -translate-y-1/2 w-7 h-7 flex items-center justify-center z-10"
          >
            <div
              class="w-full h-0.5 transition-all duration-300"
              [class.bg-gradient-to-r]="true"
              [class.from-teal-300]="stages[i].active || stages[i].completed"
              [class.to-teal-200]="stages[i].active || stages[i].completed"
              [class.from-green-300]="stages[i].completed && !stages[i].active"
              [class.to-green-200]="stages[i].completed && !stages[i].active"
              [class.from-slate-200]="!stages[i].completed && !stages[i].active"
              [class.to-slate-100]="!stages[i].completed && !stages[i].active"
            ></div>
            <div
              class="absolute w-1.5 h-1.5 rounded-full right-0 transition-all duration-300"
              [class.bg-teal-400]="stages[i + 1].active"
              [class.bg-green-400]="
                stages[i].completed && !stages[i + 1].active
              "
              [class.bg-slate-300]="!stages[i].completed && !stages[i].active"
            ></div>
          </div>
          }
        </div>
        }
      </div>

      <!-- Current Action Detail -->
      @if (currentStageDetails().length > 0) {
      <div
        class="p-4 bg-blue-50 border border-blue-200/50 rounded-xl flex items-start gap-3"
      >
        <lucide-icon
          [img]="ZapIcon"
          [size]="18"
          class="text-blue-600 flex-shrink-0 mt-0.5"
        ></lucide-icon>
        <div>
          <div class="text-sm font-semibold text-blue-900">
            {{ currentStageLabelFull() }}
          </div>
          <div class="text-sm text-blue-700 mt-1">
            {{ currentStageDetails() }}
          </div>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      :host ::ng-deep {
        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      }
    `,
  ],
})
export class ProcessingTimelineComponent
  implements OnInit, OnChanges, OnDestroy
{
  CheckCircleIcon = CheckCircle;
  Loader2Icon = Loader2;
  CircleIcon = Circle;
  ZapIcon = Zap;

  @Input() stages: ProcessingStageStatus[] = [];

  elapsedTime = signal(0);
  currentStageIndex = signal(0);
  private timerInterval: any;

  progressPercent = computed(() => {
    const total = this.stages.length;
    const current = this.currentStageIndex();
    return ((current + 1) / total) * 100;
  });

  currentStageLabel = computed(() => {
    const stage = this.stages[this.currentStageIndex()];
    return stage?.label || '';
  });

  currentStageLabelFull = computed(() => {
    const stage = this.stages[this.currentStageIndex()];
    return stage?.label || 'Processing';
  });

  currentStageDetails = computed(() => {
    const stage = this.stages[this.currentStageIndex()];
    return stage?.details || '';
  });

  ngOnInit() {
    this.startTimer();
    this.updateCurrentStage();
  }

  ngOnChanges() {
    this.updateCurrentStage();
  }

  private startTimer() {
    this.timerInterval = setInterval(() => {
      this.elapsedTime.update((t) => t + 1);
    }, 1000);
  }

  private updateCurrentStage() {
    const activeIndex = this.stages.findIndex((s) => s.active);
    if (activeIndex >= 0) {
      this.currentStageIndex.set(activeIndex);
    }
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
