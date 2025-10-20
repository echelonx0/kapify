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
      <!-- Animated gradient border on hover -->
      <div class="card-border-accent"></div>

      <!-- Header Section -->
      <ng-container *ngIf="title || subtitle || hasActions || icon">
        <div [class]="headerClasses">
          <div class="flex items-start gap-3 flex-1">
            <!-- Icon Slot with enhanced styling -->
            <div *ngIf="icon" [class]="iconContainerClasses">
              <ng-content select="[slot=icon]"></ng-content>
            </div>
            
            <!-- Title & Subtitle -->
            <div class="flex-1 min-w-0">
              <h3 *ngIf="title" class="text-base font-semibold text-slate-900 leading-tight">
                {{ title }}
              </h3>
              <p *ngIf="subtitle" class="mt-1.5 text-sm text-slate-600 leading-relaxed">
                {{ subtitle }}
              </p>
            </div>
          </div>

          <!-- Actions Slot -->
          <div *ngIf="hasActions" class="flex items-center space-x-2 ml-3 flex-shrink-0">
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

    /* Main card container with refined styling */
    .ui-card {
      position: relative;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem; /* 16px */
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }

    /* Hover elevation effect */
    .ui-card:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08), 
                  0 2px 4px 0 rgba(0, 0, 0, 0.04);
      transform: translateY(-2px);
    }

    /* Animated gradient border accent on hover */
    .card-border-accent {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        #ff6b35 50%,
        transparent 100%
      );
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    .ui-card:hover .card-border-accent {
      opacity: 1;
    }

    /* Status border (left accent) - sleeker version */
    .status-border {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      transition: width 0.3s ease;
      pointer-events: none;
    }

    .ui-card:hover .status-border {
      width: 4px;
    }

    .status-primary { background: #2563eb; }
    .status-success { background: #10b981; }
    .status-warning { background: #f59e0b; }
    .status-error { background: #ef4444; }

    /* Header with refined styling */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #f1f5f9;
      transition: background-color 0.2s ease;
    }

    .ui-card:hover .card-header {
      background-color: #f8fafc;
    }

    /* Icon container - modern style */
    .icon-container {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem; /* 12px */
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: #f1f5f9;
    }

    .icon-blue { background: #dbeafe; color: #2563eb; }
    .icon-green { background: #dcfce7; color: #16a34a; }
    .icon-purple { background: #e9d5ff; color: #9333ea; }
    .icon-orange { background: #ffedd5; color: #ff6b35; }
    .icon-neutral { background: #f1f5f9; color: #64748b; }
    .icon-indigo { background: #e0e7ff; color: #4f46e5; }

    /* Icon hover effect */
    .ui-card:hover .icon-container {
      transform: scale(1.08);
      filter: brightness(1.15);
    }

    /* Content area */
    .card-content {
      transition: opacity 0.2s ease;
    }

    .ui-card:hover .card-content {
      opacity: 1;
    }

    /* Gradient variant */
    .card-gradient-wrapper {
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1px;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }

    .card-gradient-wrapper:hover {
      border-color: #cbd5e1;
      box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.08);
    }

    .card-gradient-content {
      background-color: white;
      border-radius: 0.9375rem;
      height: 100%;
    }

    /* Elevated variant */
    .card-elevated {
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1),
                  0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }

    .card-elevated:hover {
      box-shadow: 0 20px 35px -8px rgba(0, 0, 0, 0.15),
                  0 10px 10px -5px rgba(0, 0, 0, 0.05);
    }

    /* Small size tweaks */
    .card-sm .card-header {
      padding: 1rem;
      padding-bottom: 0.75rem;
    }

    .card-sm .card-content {
      padding: 1rem;
    }

    /* Medium size (default) */
    .card-md .card-header {
      padding: 1.5rem;
      padding-bottom: 1rem;
    }

    .card-md .card-content {
      padding: 1.5rem;
    }

    /* Large size */
    .card-lg .card-header {
      padding: 2rem;
      padding-bottom: 1.5rem;
    }

    .card-lg .card-content {
      padding: 2rem;
    }

    /* Left padding when status is active */
    .has-status .card-header,
    .has-status .card-content {
      padding-left: calc(var(--padding-left) + 0.75rem);
    }

    /* No padding variant */
    .card-no-padding .card-content {
      padding: 0;
    }

    /* Focus state for accessibility */
    .ui-card:focus-within {
      outline: 2px solid #ff6b35;
      outline-offset: 2px;
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
    const baseClass = 'ui-card';
    const variantClass = this.variant === 'gradient' ? 'card-gradient-wrapper' : '';
    const elevatedClass = this.variant === 'elevated' ? 'card-elevated' : '';
    const sizeClass = `card-${this.size}`;
    const statusClass = this.status !== 'none' ? 'has-status' : '';
    const paddingClass = !this.padding ? 'card-no-padding' : '';
    const margin = this.marginBottom;

    return [baseClass, variantClass, elevatedClass, sizeClass, statusClass, paddingClass, margin]
      .filter(Boolean)
      .join(' ');
  }

  get headerClasses(): string {
    const baseClass = 'card-header';
    const statusBorder = this.status !== 'none' ? `status-border status-${this.status}` : '';
    
    return [baseClass, statusBorder].filter(Boolean).join(' ');
  }

  get contentClasses(): string {
    return 'card-content';
  }

  get iconContainerClasses(): string {
    if (!this.icon) return '';
    
    const baseClass = 'icon-container';
    const colorMap = {
      blue: 'icon-blue',
      green: 'icon-green',
      purple: 'icon-purple',
      orange: 'icon-orange',
      neutral: 'icon-neutral',
      indigo: 'icon-indigo'
    };

    const colorClass = this.icon.color ? colorMap[this.icon.color] : colorMap.blue;
    return [baseClass, colorClass].filter(Boolean).join(' ');
  }
}