import { Component, input, signal, computed, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-input',
  standalone: true,
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
      <input
        [type]="type()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [class]="inputClasses()"
        [value]="value()"
        [attr.maxlength]="maxLength() || null"
        (input)="onInput($event)"
        (blur)="onBlur()"
      />
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
      useExisting: forwardRef(() => UiInputComponent),
      multi: true,
    },
  ],
})
export class UiInputComponent implements ControlValueAccessor {
  label = input<string>();
  placeholder = input<string>();
  type = input('text');
  required = input(false);
  disabled = input(false);
  error = input<string>();
  hint = input<string>();
  maxLength = input<number>();

  value = signal('');

  private onChange = (value: string) => {};
  private onTouched = () => {};

  inputClasses = computed(() => {
    const base =
      'block w-full px-4 py-2.5 border text-sm font-normal placeholder-slate-400 transition-all duration-200 focus:outline-none';

    const errorClasses = this.error()
      ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10';

    const disabledClasses = this.disabled()
      ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60'
      : '';

    const rounded = 'rounded-xl';

    return `${base} ${errorClasses} ${disabledClasses} ${rounded}`;
  });

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value.set(target.value);
    this.onChange(this.value());
  }

  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: string): void {
    this.value.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handled via input
  }
}
