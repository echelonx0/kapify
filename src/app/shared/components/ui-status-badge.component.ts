
// src/app/shared/components/ui-status-badge.component.ts
import { Component, input, computed } from '@angular/core';
import type { StatusColor } from '../types/design-tokens';

@Component({
  selector: 'ui-status-badge',
  standalone: true,
  template: `
    <span [class]="badgeClasses()">
      @if (showDot()) {
        <span [class]="dotClasses()"></span>
      }
      {{ text() }}
    </span>
  `,
})
export class UiStatusBadgeComponent {
  text = input.required<string>();
  color = input<StatusColor>('primary');
  showDot = input(true);

  badgeClasses = computed(() => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    const colorClasses = {
      primary: 'bg-primary-100 text-primary-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800'
    };
    return `${baseClasses} ${colorClasses[this.color()]}`;
  });

  dotClasses = computed(() => {
    const baseClasses = 'w-1.5 h-1.5 rounded-full mr-1.5';
    const colorClasses = {
      primary: 'bg-primary-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500'
    };
    return `${baseClasses} ${colorClasses[this.color()]}`;
  });
}