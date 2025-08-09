
// src/app/shared/components/ui/badge.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="getBadgeClasses()">
      <ng-content></ng-content>
    </span>
  `
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() size: BadgeSize = 'md';

  getBadgeClasses(): string {
    const baseClasses = 'inline-flex items-center font-medium rounded-full';
    
    const sizeClasses = {
      'sm': 'px-2 py-1 text-xs',
      'md': 'px-2.5 py-1.5 text-sm',
      'lg': 'px-3 py-2 text-base'
    };

    const variantClasses = {
      'default': 'bg-neutral-100 text-neutral-800',
      'success': 'bg-green-100 text-green-800',
      'warning': 'bg-yellow-100 text-yellow-800',
      'error': 'bg-red-100 text-red-800',
      'info': 'bg-blue-100 text-blue-800'
    };

    return `${baseClasses} ${sizeClasses[this.size]} ${variantClasses[this.variant]}`;
  }
}