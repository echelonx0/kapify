import {
  Component,
  input,
  signal,
  forwardRef,
  output,
  effect,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-textarea',
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

      <div class="relative">
        <textarea
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [class]="textareaClasses()"
          [rows]="rows()"
          [value]="internalValue()"
          [attr.maxlength]="maxLength() || null"
          (input)="onInput($event)"
          (blur)="onBlur()"
        ></textarea>

        @if (showCharCount()) {
        <div
          [class]="
            'absolute bottom-3 right-4 text-xs font-medium pointer-events-none transition-colors duration-200 ' +
            (charCountExceeded() ? 'text-red-600' : 'text-slate-400')
          "
        >
          {{ internalValue().length
          }}{{ maxLength() ? ' / ' + maxLength() : '' }}
        </div>
        }
      </div>

      @if (error()) {
      <div class="flex items-center gap-1.5 text-xs font-medium text-red-700">
        <div class="w-1 h-1 rounded-full bg-red-600 flex-shrink-0"></div>
        <span>{{ error() }}</span>
      </div>
      } @else if (hint()) {
      <p class="text-xs text-slate-500">{{ hint() }}</p>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiTextareaComponent),
      multi: true,
    },
  ],
})
export class UiTextareaComponent implements ControlValueAccessor {
  label = input<string>();
  placeholder = input<string>();
  required = input(false);
  disabled = input(false);
  error = input<string | null>();
  hint = input<string>();
  rows = input(5);
  maxLength = input<number>();
  showCharCount = input(false);
  value = input('');
  internalValue = signal('');

  valueChange = output<Event>();

  private onChange = (value: string) => {};
  private onTouched = () => {};

  constructor() {
    effect(() => {
      const inputValue = this.value();
      if (inputValue !== this.internalValue()) {
        this.internalValue.set(inputValue);
      }
    });
  }

  charCountExceeded = () => {
    const max = this.maxLength();
    return max ? this.internalValue().length > max : false;
  };

  textareaClasses = () => {
    const base =
      'block w-full px-4 py-2.5 text-sm font-normal leading-relaxed placeholder-slate-400 resize-none transition-all duration-200 focus:outline-none';

    const border = this.error()
      ? 'border border-red-300 bg-red-50/50'
      : 'border border-slate-200 bg-white hover:border-slate-300';

    const focus = this.error()
      ? 'focus:border-red-500 focus:ring-2 focus:ring-red-500/10'
      : 'focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10';

    const disabled = this.disabled()
      ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60'
      : '';

    const rounded = 'rounded-xl';

    return `${base} ${border} ${focus} ${disabled} ${rounded}`;
  };

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.internalValue.set(target.value);
    this.onChange(target.value);
    this.valueChange.emit(event);
  }

  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: string): void {
    this.internalValue.set(value || '');
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
