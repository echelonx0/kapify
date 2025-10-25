 

import { Component, input, signal, forwardRef, output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-textarea',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-2.5">
      @if (label()) {
        <label class="block text-sm font-semibold text-slate-900">
          {{ label() }}
          @if (required()) {
            <span class="text-red-500 ml-1">*</span>
          }
        </label>
      }
      
      <div class="relative group">
        <textarea
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [class]="textareaClasses()"
          [rows]="rows()"
          [value]="internalValue()"
          (input)="onInput($event)"
          (blur)="onBlur()"
        ></textarea>
        
        @if (showCharCount()) {
          <div class="absolute bottom-3 right-3 text-xs font-medium text-slate-400 pointer-events-none">
            {{ internalValue().length }}{{ maxLength() ? ' / ' + maxLength() : '' }}
          </div>
        }
      </div>
      
      @if (error()) {
        <div class="flex items-center space-x-1.5 text-sm text-red-600 font-medium">
          <div class="w-1.5 h-1.5 rounded-full bg-red-600"></div>
          <span>{{ error() }}</span>
        </div>
      } @else if (hint()) {
        <p class="text-sm text-slate-500">{{ hint() }}</p>
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
  error = input<string | null>();
  hint = input<string>();
  rows = input(5);
  maxLength = input<number>();
  showCharCount = input(false);
  value = input('');
  internalValue = signal('');
  
  // ✅ Output event for value changes
  valueChange = output<Event>();
  
  private onChange = (value: string) => {};
  private onTouched = () => {};
  
  textareaClasses = () => {
    const baseClasses = 'block w-full px-4 py-3 text-sm leading-relaxed border-2 rounded-lg shadow-sm transition-all duration-200 resize-none font-normal placeholder-slate-400 focus:outline-none';
    
    const stateClasses = this.error() 
      ? 'border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-2 focus:ring-red-100'
      : 'border-slate-200 bg-white hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-100';
    
    const disabledClasses = this.disabled() 
      ? 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-100' 
      : '';
    
    return `${baseClasses} ${stateClasses} ${disabledClasses}`;
  };
  
  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.internalValue.set(target.value);
    this.onChange(target.value);
    // ✅ Emit the event so parent components can handle it
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