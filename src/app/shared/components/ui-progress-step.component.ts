
// src/app/shared/components/ui-progress-step.component.ts
import { Component, input } from '@angular/core';
import { LucideAngularModule, CheckCircle, Circle } from 'lucide-angular';

@Component({
  selector: 'ui-progress-step',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div class="flex items-start space-x-3 p-4 bg-white rounded-lg border border-neutral-200">
      <div [class]="stepIconClasses()">
        @if (completed()) {
          <lucide-icon [img]="CheckCircleIcon" [size]="16" />
        } @else {
          <lucide-icon [img]="CircleIcon" [size]="16" />
        }
      </div>
      <div class="flex-1">
        <div class="text-sm font-medium text-neutral-900">
          <ng-content />
        </div>
        @if (description()) {
          <div class="text-xs text-neutral-500 mt-1">{{ description() }}</div>
        }
      </div>
    </div>
  `,
})
export class UiProgressStepComponent {
  completed = input(false);
  active = input(false);
  description = input<string>();

  CheckCircleIcon = CheckCircle;
  CircleIcon = Circle;

  stepIconClasses() {
    if (this.completed()) {
      return 'flex-shrink-0 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center';
    }
    if (this.active()) {
      return 'flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 border-2 border-primary-500 flex items-center justify-center';
    }
    return 'flex-shrink-0 w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center';
  }
}