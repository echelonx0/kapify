
// src/app/shared/components/ui-button.component.ts
import { Component, input, output, computed } from '@angular/core';
import type { ButtonVariant, ButtonSize } from '../types/design-tokens';

@Component({
  selector: 'ui-button',
  standalone: true,
  template: `
    <button 
      [class]="buttonClasses()"
      [disabled]="disabled()"
      (click)="handleClick()">
      <ng-content />
    </button>
  `,
})
export class UiButtonComponent {
  // Angular 19 signals for inputs
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  disabled = input(false);
  fullWidth = input(false);
  
  // Angular 19 output function
  clicked = output<void>();

  // Computed signal for classes
  buttonClasses = computed(() => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
      secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500',
      outline: 'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-500',
      ghost: 'text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500'
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-sm rounded-md',
      lg: 'px-6 py-3 text-base rounded-lg'
    };

    const widthClass = this.fullWidth() ? 'w-full' : '';
    
    return [
      baseClasses,
      variantClasses[this.variant()],
      sizeClasses[this.size()],
      widthClass
    ].filter(Boolean).join(' ');
  });

  handleClick() {
    if (!this.disabled()) {
      this.clicked.emit();
    }
  }
}
