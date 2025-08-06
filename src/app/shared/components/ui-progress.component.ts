
// src/app/shared/components/ui-progress.component.ts
import { Component, input, computed } from '@angular/core';
import type { StatusColor } from '../types/design-tokens';

@Component({
  selector: 'ui-progress',
  standalone: true,
  template: `
    <div class="w-full">
      @if (label()) {
        <div class="flex justify-between text-sm mb-2">
          <span class="text-neutral-700">{{ label() }}</span>
          <span class="text-neutral-500">{{ value() }}%</span>
        </div>
      }
      <div class="w-full bg-neutral-200 rounded-full h-2">
        <div 
          [class]="progressClasses()"
          [style.width.%]="value()">
        </div>
      </div>
    </div>
  `,
})
export class UiProgressComponent {
  value = input(0);
  label = input<string>();
  color = input<StatusColor>('primary');

  progressClasses = computed(() => {
    const baseClasses = 'h-2 rounded-full transition-all duration-300';
    const colorClasses = {
      primary: 'bg-primary-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500'
    };
    return `${baseClasses} ${colorClasses[this.color()]}`;
  });
}
