import {
  Component,
  input,
  signal,
  computed,
  forwardRef,
  output,
} from '@angular/core';
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
        <span class="text-red-600 ml-0.5">*</span>
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
        <option value="" disabled>
          {{ placeholder() || 'Select an option' }}
        </option>
        @for (option of options(); track option.value) {
        <option [value]="option.value">{{ option.label }}</option>
        }
      </select>
      @if (error()) {
      <p class="text-xs font-medium text-red-700">{{ error() }}</p>
      } @else if (hint()) {
      <p class="text-xs text-slate-500">{{ hint() }}</p>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiSelectComponent),
      multi: true,
    },
  ],
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

  valueChange = output<string | number | boolean>();

  private changeCallback = (value: string | number | boolean) => {};
  private touchedCallback = () => {};

  selectClasses = computed(() => {
    const base =
      'block w-full px-4 py-2.5 border text-sm font-normal transition-all duration-200 focus:outline-none';

    const errorClasses = this.error()
      ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10';

    const disabledClasses = this.disabled()
      ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60'
      : '';

    const rounded = 'rounded-xl';

    return `${base} ${errorClasses} ${disabledClasses} ${rounded}`;
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
