// src/app/shared/components/ui-button.component.ts
import { Component, input, output, computed } from '@angular/core';
import type { ButtonVariant, ButtonSize } from '../types/design-tokens';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-button',
  imports: [CommonModule],
  standalone: true,
  template: `
    <button 
      [class]="buttonClasses()"
      [disabled]="disabled() || loading()"
      (click)="handleClick()">
      
      <!-- Spinner -->
      <svg *ngIf="loading()" 
           class="animate-spin h-4 w-4 mr-2 text-current"
           xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" 
                stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" 
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>

      <!-- Content slot -->
      <ng-content />
    </button>
  `,
})
export class UiButtonComponent {
  // Inputs
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  disabled = input(false);
  fullWidth = input(false);
  loading = input(false); // <-- NEW

  // Output
  clicked = output<void>();

  // Computed classes
  buttonClasses = computed(() => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
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
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit();
    }
  }
}
