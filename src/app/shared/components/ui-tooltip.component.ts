 // src/app/shared/components/ui-tooltip.component.ts
import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'ui-tooltip',
  standalone: true,
  template: `
    <div class="relative inline-block group">
      <ng-content />
      <div [class]="tooltipClasses()">
        {{ text() }}
      </div>
    </div>
  `,
})
export class UiTooltipComponent {
  text = input.required<string>();
  position = input<'top' | 'bottom' | 'left' | 'right'>('right');

  tooltipClasses = computed(() => {
    const baseClasses = 'absolute bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none';
    
    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-1',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-1',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-1',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-1'
    };

    return `${baseClasses} ${positionClasses[this.position()]}`;
  });
}
