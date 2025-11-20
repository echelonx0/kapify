// src/app/shared/components/form-field/app-form-field.component.ts
import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2">
      <label
        class="text-sm font-medium text-neutral-700 block h-10 flex items-start"
      >
        <span>{{ label() }}</span>
      </label>
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class FormFieldComponent {
  label = input.required<string>();
}
