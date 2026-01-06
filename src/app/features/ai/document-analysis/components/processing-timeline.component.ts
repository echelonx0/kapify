import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  CheckCircle,
  Loader2,
  Circle,
} from 'lucide-angular';

export interface ProcessingStageStatus {
  stage: string;
  label: string;
  details?: string;
  completed: boolean;
  active: boolean;
}

@Component({
  selector: 'app-processing-timeline',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-4 max-w-md mx-auto">
      @for (status of stages; track status.stage; let i = $index) {
      <div class="flex items-start space-x-3 group">
        <!-- Status Indicator -->
        <div class="flex-shrink-0 mt-1">
          @if (status.completed) {
          <div
            class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm"
          >
            <lucide-icon
              [img]="CheckCircleIcon"
              [size]="14"
              class="text-white"
            ></lucide-icon>
          </div>
          } @else if (status.active) {
          <div
            class="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center shadow-md animate-pulse"
          >
            <lucide-icon
              [img]="Loader2Icon"
              [size]="14"
              class="text-white animate-spin"
            ></lucide-icon>
          </div>
          } @else {
          <div
            class="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center"
          >
            <lucide-icon
              [img]="CircleIcon"
              [size]="10"
              class="text-slate-400"
            ></lucide-icon>
          </div>
          }
        </div>

        <!-- Connector line (if not last) -->
        @if (i < stages.length - 1) {
        <div
          class="absolute left-2.5 top-8 w-0.5 h-8 transition-all duration-500 ease-out"
          [class.bg-gradient-to-b]="true"
          [class.from-teal-400]="status.active"
          [class.to-teal-200]="status.active"
          [class.from-green-300]="status.completed"
          [class.to-green-200]="status.completed"
          [class.from-slate-200]="!status.active && !status.completed"
          [class.to-slate-100]="!status.active && !status.completed"
        ></div>
        }

        <!-- Content -->
        <div class="flex-1 min-w-0 pt-0.5">
          <div
            class="text-sm font-medium transition-colors duration-200"
            [class.text-slate-900]="status.completed || status.active"
            [class.text-slate-500]="!status.completed && !status.active"
          >
            {{ status.label }}
          </div>

          @if (status.active && status.details) {
          <div class="text-xs text-slate-600 mt-1 animate-pulse">
            {{ status.details }}
          </div>
          } @if (status.completed) {
          <div class="text-xs text-green-600 mt-1 font-medium">✓ Complete</div>
          }
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      :host ::ng-deep .relative {
        position: relative;
      }
    `,
  ],
})
export class ProcessingTimelineComponent {
  CheckCircleIcon = CheckCircle;
  Loader2Icon = Loader2;
  CircleIcon = Circle;

  @Input() stages: ProcessingStageStatus[] = [];
}
