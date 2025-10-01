// src/app/shared/components/ui-button.component.ts
import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost'
  | 'danger'
  | 'danger-outline';

export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  imports: [CommonModule],
  standalone: true,
  template: `
    <button 
      [class]="buttonClasses()"
      [disabled]="disabled() || loading()"
      (click)="handleClick($event)"
      [type]="type()">
      
      <!-- Loading Spinner -->
      <svg 
        *ngIf="loading()" 
        class="animate-spin h-4 w-4 mr-2 text-current"
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24">
        <circle 
          class="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          stroke-width="4">
        </circle>
        <path 
          class="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z">
        </path>
      </svg>
      
      <!-- Button Content -->
      <ng-content />
    </button>
  `,
  styles: [`
    button {
      position: relative;
      overflow: hidden;
      transform-origin: center;
    }

    /* Subtle scale animation on hover */
    button:not(:disabled):hover {
      transform: scale(1.02);
    }

    /* Active state - press down */
    button:not(:disabled):active {
      transform: scale(0.98);
    }

    /* Loading state - no hover effect */
    button[disabled] {
      cursor: not-allowed;
    }

    /* Smooth transitions matching design system */
    button {
      transition: all 0.2s ease;
    }

    /* Focus visible for accessibility */
    button:focus-visible {
      outline: 2px solid transparent;
      outline-offset: 2px;
    }
  `]
})
export class UiButtonComponent {
  // Inputs
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  disabled = input(false);
  fullWidth = input(false);
  loading = input(false);
  type = input<'button' | 'submit' | 'reset'>('button');

  // Output
  clicked = output<MouseEvent>();

  // Computed classes - aligned with design system
  buttonClasses = computed(() => {
    const baseClasses = [
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:hover:transform-none'
    ].join(' ');

    // Variant styles - matching design system colors
    const variantClasses: Record<ButtonVariant, string> = {
      primary: [
        'bg-primary-600',
        'text-white',
        'hover:bg-primary-700',
        'focus:ring-primary-500',
        'shadow-sm',
        'hover:shadow-md'
      ].join(' '),
      
      secondary: [
        'bg-neutral-100',
        'text-neutral-900',
        'hover:bg-neutral-200',
        'focus:ring-neutral-500',
        'border',
        'border-neutral-200',
        'hover:border-neutral-300'
      ].join(' '),
      
      outline: [
        'border',
        'border-neutral-300',
        'bg-white',
        'text-neutral-700',
        'hover:bg-neutral-50',
        'hover:border-neutral-400',
        'focus:ring-neutral-500',
        'shadow-sm'
      ].join(' '),
      
      ghost: [
        'text-neutral-700',
        'hover:bg-neutral-100',
        'focus:ring-neutral-500',
        'hover:text-neutral-900'
      ].join(' '),
      
      danger: [
        'bg-red-600',
        'text-white',
        'hover:bg-red-700',
        'focus:ring-red-500',
        'shadow-sm',
        'hover:shadow-md'
      ].join(' '),
      
      'danger-outline': [
        'border',
        'border-red-300',
        'bg-white',
        'text-red-700',
        'hover:bg-red-50',
        'hover:border-red-400',
        'focus:ring-red-500',
        'shadow-sm'
      ].join(' ')
    };

    // Size styles - matching design system
    const sizeClasses: Record<ButtonSize, string> = {
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
    ]
      .filter(Boolean)
      .join(' ');
  });

  handleClick(event: MouseEvent) {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }
}