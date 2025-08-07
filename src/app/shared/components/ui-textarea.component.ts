// src/app/shared/components/ui-textarea.component.ts
import { Component, input, signal, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-textarea',
  standalone: true,
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
      <textarea
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [class]="textareaClasses()"
        [rows]="rows()"
        [value]="value()"
        (input)="onInput($event)"
        (blur)="onBlur()"
      ></textarea>
      @if (error()) {
        <p class="text-sm text-red-600">{{ error() }}</p>
      } @else if (hint()) {
        <p class="text-sm text-neutral-500">{{ hint() }}</p>
      }
      @if (showCharCount()) {
        <div class="flex justify-end">
          <span class="text-xs text-neutral-500">
            {{ value().length }}{{ maxLength() ? '/' + maxLength() : '' }}
          </span>
        </div>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiTextareaComponent),
      multi: true
    }
  ]
})
export class UiTextareaComponent implements ControlValueAccessor {
  label = input<string>();
  placeholder = input<string>();
  required = input(false);
  disabled = input(false);
  error = input<string>();
  hint = input<string>();
  rows = input(4);
  maxLength = input<number>();
  showCharCount = input(false);

  value = signal('');
  
  private onChange = (value: string) => {};
  private onTouched = () => {};

  textareaClasses = () => {
    const baseClasses = 'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors resize-y';
    const stateClasses = this.error() 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500';
    const disabledClasses = this.disabled() ? 'bg-neutral-50 cursor-not-allowed' : 'bg-white';
    
    return `${baseClasses} ${stateClasses} ${disabledClasses}`;
  };

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
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
    // In React-style components, we'd use a signal for this
  }
}

