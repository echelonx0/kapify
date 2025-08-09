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
        <div class="p-6 pb-4 flex justify-between items-center">
          <div>
            <h3 *ngIf="title" class="text-lg font-semibold text-neutral-900">{{ title }}</h3>
            <p *ngIf="subtitle" class="mt-1 text-sm text-neutral-600">{{ subtitle }}</p>
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
  @Input() hover = false;
  @Input() marginBottom = ''; // e.g. 'mb-6'
  @Input() hasActions = false;

  get cardClasses(): string {
    const base = 'bg-white rounded-lg border border-neutral-200 shadow-card';
    const hoverClass = this.hover ? 'hover:shadow-card-hover transition-shadow' : '';
    const margin = this.marginBottom;
    return [base, hoverClass, margin].filter(Boolean).join(' ');
  }

  get contentClasses(): string {
    if (!this.padding) return '';
    return (this.title || this.subtitle) ? 'px-6 pb-6' : 'p-6';
  }
}
