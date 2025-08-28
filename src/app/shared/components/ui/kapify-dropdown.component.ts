import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronDown } from 'lucide-angular';

export interface KapifyDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'kapify-dropdown',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="toggleDropdown()"
        [disabled]="disabled"
        class="w-full flex items-center justify-between px-3 py-2 text-sm border border-neutral-300 rounded-md bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        [class.bg-neutral-50]="disabled"
      >
        <span class="truncate" [class.text-neutral-500]="!selectedOption()">
          {{ selectedOption()?.label || placeholder }}
        </span>
        <lucide-icon 
          [img]="ChevronDownIcon" 
          [size]="16" 
          class="text-neutral-400 transition-transform"
          [class.rotate-180]="isOpen()"
        />
      </button>

      <!-- Dropdown options -->
      <div *ngIf="isOpen()" class="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-60 overflow-auto">
        <button
          *ngFor="let option of options"
          type="button"
          (click)="selectOption(option)"
          [disabled]="option.disabled"
          class="w-full px-3 py-2 text-sm text-left hover:bg-neutral-50 focus:outline-none focus:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
          [class.bg-primary-50]="selectedValue === option.value"
          [class.text-primary-600]="selectedValue === option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <!-- Backdrop -->
      <div *ngIf="isOpen()" class="fixed inset-0 z-40" (click)="closeDropdown()"></div>
    </div>
  `
})
export class KapifyDropdownComponent {
  @Input() options: KapifyDropdownOption[] = [];
  @Input() selectedValue: string = '';
  @Output() selectedValueChange = new EventEmitter<string>();
  @Input() placeholder: string = 'Select option';
  @Input() disabled: boolean = false;

  ChevronDownIcon = ChevronDown;
  isOpen = signal(false);
  selectedOption = signal<KapifyDropdownOption | undefined>(undefined);

  ngOnInit() {
    this.updateSelectedOption();
  }

  ngOnChanges() {
    this.updateSelectedOption();
  }

  private updateSelectedOption() {
    const option = this.options.find(opt => opt.value === this.selectedValue);
    this.selectedOption.set(option);
  }

  toggleDropdown() {
    if (!this.disabled) {
      this.isOpen.update(open => !open);
    }
  }

  closeDropdown() {
    this.isOpen.set(false);
  }

  selectOption(option: KapifyDropdownOption) {
    if (!option.disabled) {
      this.selectedOption.set(option);
      this.selectedValue = option.value;
      this.selectedValueChange.emit(option.value); // TWO-WAY binding
      this.closeDropdown();
    }
  }
}
