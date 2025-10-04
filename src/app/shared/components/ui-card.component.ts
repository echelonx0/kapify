 import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export interface CardIcon {
  name: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'neutral' | 'indigo';
}

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses">
      <!-- Status Border (left accent) -->
      <div *ngIf="status !== 'none'" [class]="statusBorderClasses"></div>

      <!-- Title, Subtitle & Actions Header -->
      <ng-container *ngIf="title || subtitle || hasActions || icon">
        <div [class]="headerClasses">
          <div class="flex items-start gap-4 flex-1">
            <!-- Icon Slot -->
            <div *ngIf="icon" [class]="iconContainerClasses">
              <ng-content select="[slot=icon]"></ng-content>
            </div>
            
            <!-- Title & Subtitle -->
            <div class="flex-1 min-w-0">
              <h3 *ngIf="title" class="text-lg font-semibold text-gray-900 transition-colors duration-200">
                {{ title }}
              </h3>
              <p *ngIf="subtitle" class="mt-1 text-sm text-gray-600 leading-relaxed">
                {{ subtitle }}
              </p>
            </div>
          </div>

          <!-- Actions Slot -->
          <div *ngIf="hasActions" class="flex items-center space-x-2 ml-4">
            <ng-content select="[slot=actions]"></ng-content>
          </div>
        </div>
      </ng-container>

      <!-- Content -->
      <div [class]="contentClasses">
        <ng-content select=":not([slot=actions]):not([slot=icon])"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    /* Card hover effect with transform */
    .card-hover:hover {
      transform: translateY(-0.25rem);
      box-shadow: var(--shadow-card-elevated);
    }

    /* Gradient border pattern from design system */
    .card-gradient-wrapper {
      background: linear-gradient(to right, #22c55e, #22c55e, #14532d);
      padding: 0.125rem;
      border-radius: 0.75rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }

    .card-gradient-content {
      background-color: white;
      border-radius: 0.625rem;
      height: 100%;
    }

    /* Header with gradient background and accent bar */
    .header-with-accent {
      position: relative;
      background: linear-gradient(135deg, #fafbff 0%, #f8fafc 100%);
    }

    .header-with-accent::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(to bottom, #15803d, #22c55e);
      border-radius: 0 2px 2px 0;
    }

    /* Icon container transitions */
    .icon-container {
      transition: transform 0.2s ease, filter 0.2s ease;
    }

    .card-hover:hover .icon-container {
      transform: scale(1.05);
      filter: brightness(1.1);
    }

    /* Title color transition on hover */
    .card-hover:hover h3 {
      color: var(--color-primary-600);
    }
  `]
})
export class UiCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() padding = true;
  @Input() hover = true;
  @Input() marginBottom = '';
  @Input() hasActions = false;
  @Input() variant: 'default' | 'gradient' | 'elevated' = 'default';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() status: 'none' | 'primary' | 'success' | 'warning' | 'error' = 'none';
  @Input() icon?: CardIcon;
  @Input() accent = false;

  get cardClasses(): string {
    if (this.variant === 'gradient') {
      return ['card-gradient-wrapper', this.marginBottom].filter(Boolean).join(' ');
    }

    const baseClasses = 'bg-white border border-gray-200 rounded-xl overflow-hidden relative';
    const shadowClass = this.variant === 'elevated' ? 'shadow-lg' : 'shadow-sm';
    const hoverClass = this.hover ? 'card-hover transition-all duration-200 ease-out' : '';
    const margin = this.marginBottom;
    
    return [baseClasses, shadowClass, hoverClass, margin]
      .filter(Boolean)
      .join(' ');
  }

  get statusBorderClasses(): string {
    const baseClasses = 'absolute left-0 top-0 bottom-0 w-1 transition-all duration-300';
    
    const colorMap = {
      primary: 'bg-blue-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
      none: ''
    };

    return [baseClasses, colorMap[this.status]].filter(Boolean).join(' ');
  }

  get headerClasses(): string {
    const basePadding = this.getHeaderPadding();
    const borderBottom = (this.title || this.subtitle) ? 'border-b border-gray-200' : '';
    const showAccent = this.accent || this.variant === 'elevated';
    const accentClass = showAccent && (this.title || this.subtitle) ? 'header-with-accent' : '';
    const leftPadding = this.status !== 'none' ? 'pl-6' : '';
    
    return [basePadding, borderBottom, accentClass, leftPadding, 'flex justify-between items-start']
      .filter(Boolean)
      .join(' ');
  }

  get contentClasses(): string {
    if (!this.padding) return '';
    
    const hasHeader = this.title || this.subtitle || this.hasActions || this.icon;
    const basePadding = this.getContentPadding();
    const leftPadding = this.status !== 'none' ? 'pl-6' : '';
    
    const classes = hasHeader ? `${basePadding.horizontal} ${basePadding.bottom}` : basePadding.all;
    return [classes, leftPadding].filter(Boolean).join(' ');
  }

  get iconContainerClasses(): string {
    const baseClasses = 'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 icon-container';
    
    const colorMap = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      neutral: 'bg-gray-100 text-gray-600',
      indigo: 'bg-indigo-100 text-indigo-600'
    };

    const colorClass = this.icon?.color ? colorMap[this.icon.color] : colorMap.blue;
    
    return [baseClasses, colorClass].filter(Boolean).join(' ');
  }

  private getHeaderPadding(): string {
    switch (this.size) {
      case 'sm':
        return 'p-4 pb-3';
      case 'lg':
        return 'p-8 pb-6';
      default:
        return 'p-6 pb-4';
    }
  }

  private getContentPadding() {
    switch (this.size) {
      case 'sm':
        return { all: 'p-4', horizontal: 'px-4', bottom: 'pb-4' };
      case 'lg':
        return { all: 'p-8', horizontal: 'px-8', bottom: 'pb-8' };
      default:
        return { all: 'p-6', horizontal: 'px-6', bottom: 'pb-6' };
    }
  }
}