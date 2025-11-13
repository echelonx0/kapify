import { Component, Input, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Plus } from 'lucide-angular';
import { OpportunityFormStateService } from '../services/opportunity-form-state.service';

@Component({
  selector: 'app-criteria-chip-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-3">
      <label class="block text-sm font-semibold text-slate-900">{{
        label
      }}</label>

      <!-- Input + Add button -->
      <div class="flex gap-2">
        <input
          type="text"
          [value]="inputValue()"
          (input)="onInputChange($event)"
          (keyup.enter)="addItem()"
          [placeholder]="placeholder"
          maxlength="200"
          class="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
        />
        <button
          type="button"
          (click)="addItem()"
          [disabled]="!inputValue().trim()"
          class="px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          <lucide-angular [img]="PlusIcon" [size]="18"></lucide-angular>
          <span class="hidden sm:inline">Add</span>
        </button>
      </div>

      <!-- Chips list -->
      @if (items().length > 0) {
      <div class="flex flex-wrap gap-2">
        @for (item of items(); track $index) {
        <div
          class="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-900 rounded-full text-sm font-medium"
        >
          <span>{{ item }}</span>
          <button
            type="button"
            (click)="removeItem($index)"
            class="hover:bg-orange-200 rounded-full p-0.5 transition"
          >
            <lucide-angular [img]="XIcon" [size]="14"></lucide-angular>
          </button>
        </div>
        }
      </div>
      }

      <!-- Character count -->
      <p class="text-xs text-slate-500">
        {{ items().length }} item(s) • Max 200 chars per item
      </p>

      <!-- Hint -->
      @if (hint) {
      <p class="text-xs text-slate-600">{{ hint }}</p>
      }
    </div>
  `,
})
export class CriteriaChipListComponent {
  private formState = inject(OpportunityFormStateService);

  @Input() label = '';
  @Input() placeholder = '';
  @Input() hint = '';
  @Input() field: 'investmentCriteria' | 'exclusionCriteria' =
    'investmentCriteria';

  // ← FIX #3: Use signal instead of @Input() snapshot
  items = signal<string[]>([]);
  inputValue = signal('');

  XIcon = X;
  PlusIcon = Plus;

  constructor() {
    // ← Key change: Subscribe to service signal via effect
    effect(() => {
      const fieldValue = this.formState.formData()[this.field];
      if (Array.isArray(fieldValue)) {
        this.items.set(fieldValue);
      }
    });
  }

  onInputChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.inputValue.set(value);
  }

  addItem(): void {
    const value = this.inputValue().trim();
    if (!value) return;

    const success = this.formState.addToList(this.field, value);
    if (success) {
      this.inputValue.set('');
      // ← items() will auto-update via effect
    }
  }

  removeItem(index: number): void {
    this.formState.removeFromList(this.field, index);
    // ← items() will auto-update via effect
  }
}
