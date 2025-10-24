import { Component, input, signal, computed, forwardRef, output } from '@angular/core';
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
    <div class="space-y-2">
      @if (label()) {
        <label class="block text-sm font-semibold text-slate-900">
          {{ label() }}
          @if (required()) {
            <span class="text-red-600">*</span>
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
        <p class="text-sm text-red-700">{{ error() }}</p>
      } @else if (hint()) {
        <p class="text-xs text-slate-600">{{ hint() }}</p>
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
  value = signal<string | number | boolean>('');
  
  // Emit value changes for non-form-control usage
  valueChange = output<string | number | boolean>();

  private changeCallback = (value: string | number | boolean) => {};
  private touchedCallback = () => {};

  selectClasses = computed(() => {
    const baseClasses = 'block w-full px-4 py-2.5 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-all appearance-none bg-white cursor-pointer';
    const stateClasses = this.error()
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500';
    const disabledClasses = this.disabled() ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'hover:border-slate-300';
    return [baseClasses, stateClasses, disabledClasses].join(' ');
  });

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newValue = target.value;
    this.value.set(newValue);
    this.changeCallback(newValue);
    this.valueChange.emit(newValue);
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