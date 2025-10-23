import { Component, input, signal, computed, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  label: string;
  value: string | number | boolean;
}

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-1">
      @if (label()) {
        <label class="block text-sm font-medium text-neutral-700">
          {{ label() }}
          @if (required()) {
            <span class="text-red-500">*</span>
          }
        </label>
      }
      <select
        [disabled]="disabled()"
        [class]="selectClasses()"
        [value]="value()"
        (change)="onChange($event)"
        (blur)="onTouched()"
      >
        <option value="" disabled>{{ placeholder() || 'Select an option' }}</option>
        @for (option of options(); track option.value) {
          <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
      @if (error()) {
        <p class="text-sm text-red-600">{{ error() }}</p>
      } @else if (hint()) {
        <p class="text-sm text-neutral-500">{{ hint() }}</p>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
      multi: true
    }
  ]
})
export class UiSelectComponent implements ControlValueAccessor {
  label = input<string>();
  placeholder = input<string>();
  required = input(false);
  disabled = input(false);
  error = input<string>();
  hint = input<string>();
  options = input<SelectOption[]>([]);

  value = signal('');

  private changeCallback = (value: string | number | boolean) => {};
  private touchedCallback = () => {};

  selectClasses = computed(() => {
    const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors appearance-none bg-white cursor-pointer';
    const stateClasses = this.error()
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500';
    const disabledClasses = this.disabled() ? 'bg-neutral-50 cursor-not-allowed opacity-60' : '';

    return [baseClasses, stateClasses, disabledClasses].join(' ');
  });

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value.set(target.value);
    this.changeCallback(target.value);
  }

  onTouched(): void {
    this.touchedCallback();
  }

  writeValue(value: string | number | boolean): void {
    this.value.set(value?.toString() || '');
  }

  registerOnChange(fn: (value: string | number | boolean) => void): void {
    this.changeCallback = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.touchedCallback = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled by input binding
  }
}
