import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses">
      <!-- Title, Subtitle & Actions Header -->
      <ng-container *ngIf="title || subtitle || hasActions">
        <div [class]="headerClasses">
          <div>
            <h3 *ngIf="title" class="text-lg font-semibold text-gray-900">{{ title }}</h3>
            <p *ngIf="subtitle" class="mt-1 text-sm text-gray-600">{{ subtitle }}</p>
          </div>

          <div *ngIf="hasActions" class="flex space-x-4">
            <ng-content select="[slot=actions]"></ng-content>
          </div>
        </div>
      </ng-container>

      <!-- Content -->
      <div [class]="contentClasses">
        <ng-content select=":not([slot=actions])"></ng-content>
      </div>
    </div>
  `,
})
export class UiCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() padding = true;
  @Input() hover = true; // Default to true for better UX
  @Input() marginBottom = '';
  @Input() hasActions = false;
  @Input() variant: 'default' | 'gradient' | 'elevated' = 'default';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get cardClasses(): string {
    const baseClasses = this.getBaseClasses();
    const variantClasses = this.getVariantClasses();
    const sizeClasses = this.getSizeClasses();
    const hoverClass = this.hover ? 'hover:shadow-md transition-all duration-200' : '';
    const margin = this.marginBottom;
    
    return [baseClasses, variantClasses, sizeClasses, hoverClass, margin]
      .filter(Boolean)
      .join(' ');
  }

  get headerClasses(): string {
    const basePadding = this.size === 'sm' ? 'p-4 pb-3' : this.size === 'lg' ? 'p-8 pb-6' : 'p-6 pb-4';
    const gradientBg = this.variant === 'gradient' ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : '';
    const border = (this.title || this.subtitle) ? 'border-b border-gray-200' : '';
    
    return [basePadding, gradientBg, border, 'flex justify-between items-center']
      .filter(Boolean)
      .join(' ');
  }

  get contentClasses(): string {
    if (!this.padding) return '';
    
    const hasHeader = this.title || this.subtitle || this.hasActions;
    const basePadding = this.getSizePadding();
    
    return hasHeader ? `${basePadding.horizontal} ${basePadding.bottom}` : basePadding.all;
  }

  private getBaseClasses(): string {
    return 'bg-white border border-gray-200 overflow-hidden';
  }

  private getVariantClasses(): string {
    switch (this.variant) {
      case 'gradient':
        return 'rounded-xl shadow-sm';
      case 'elevated':
        return 'rounded-xl shadow-lg';
      default:
        return 'rounded-xl shadow-sm';
    }
  }

  private getSizeClasses(): string {
    // Size handled in padding, return empty for now
    return '';
  }

  private getSizePadding() {
    switch (this.size) {
      case 'sm':
        return {
          all: 'p-4',
          horizontal: 'px-4',
          bottom: 'pb-4'
        };
      case 'lg':
        return {
          all: 'p-8',
          horizontal: 'px-8',
          bottom: 'pb-8'
        };
      default: // 'md'
        return {
          all: 'p-6',
          horizontal: 'px-6',
          bottom: 'pb-6'
        };
    }
  }
}