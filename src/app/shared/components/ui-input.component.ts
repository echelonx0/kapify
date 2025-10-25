
// src/app/shared/components/ui-input.component.ts
import { Component, input, signal, computed, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-input',
  standalone: true,
  template: `
    <div class="space-y-2">
      @if (label()) {
        <label class="block text-sm font-medium text-neutral-700">
          {{ label() }}
          @if (required()) {
            <span class="text-red-500">*</span>
          }
        </label>
      }
      <input
        [type]="type()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [class]="inputClasses()"
        [value]="value()"
        (input)="onInput($event)"
        (blur)="onBlur()"
      />
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
      useExisting: forwardRef(() => UiInputComponent),
      multi: true
    }
  ]
})
export class UiInputComponent implements ControlValueAccessor {
  label = input<string>();
  placeholder = input<string>();
  type = input('text');
  required = input(false);
  disabled = input(false);
  error = input<string>();
  hint = input<string>();

  value = signal('');
  
  private onChange = (value: string) => {};
  private onTouched = () => {};

  inputClasses = computed(() => {
  const baseClasses = 'block w-full px-4 py-2.5 border rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors';
   const stateClasses = this.error() 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500';
    const disabledClasses = this.disabled() ? 'bg-neutral-50 cursor-not-allowed' : 'bg-white';
    
    return [baseClasses, stateClasses, disabledClasses].join(' ');
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
    // In Angular 19, we'd typically use a signal for this
    // For now, keeping compatible with ControlValueAccessor
  }
}
