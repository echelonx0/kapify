// src/app/shared/components/ui-section-card.component.ts
import { Component, input, output, signal } from '@angular/core';
import { LucideAngularModule, ChevronDown, ChevronUp } from 'lucide-angular';
import { UiButtonComponent } from './ui-button.component';

@Component({
  selector: 'ui-section-card',
  standalone: true,
  imports: [LucideAngularModule, UiButtonComponent],
  template: `
    <div class="bg-white rounded-lg border border-neutral-200 shadow-sm">
      <!-- Section Header -->
      <button
        (click)="toggleExpanded()"
        class="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
      >
        <div class="flex items-center space-x-3">
          @if (icon()) {
            <div [class]="iconClasses()">
              <ng-content select="[slot=icon]" />
            </div>
          }
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-neutral-900 flex items-center">
              {{ title() }}
              @if (required()) {
                <span class="text-red-500 ml-1">*</span>
              }
            </h3>
            @if (description()) {
              <p class="text-sm text-neutral-600 mt-1">{{ description() }}</p>
            }
          </div>
        </div>
        <div class="flex items-center space-x-2">
          @if (completed()) {
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          } @else if (hasData()) {
            <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
          }
          <lucide-icon 
            [img]="expanded() ? ChevronUpIcon : ChevronDownIcon" 
            [size]="20" 
            class="text-neutral-400 transition-transform"
          />
        </div>
      </button>

      <!-- Section Content -->
      @if (expanded()) {
        <div class="border-t border-neutral-200">
          <div class="p-6">
            <ng-content />
          </div>
          
          <!-- Save Actions -->
          <div class="px-6 pb-6 border-t border-neutral-200 bg-neutral-50">
            <div class="flex items-center justify-between">
              @if (autoSave()) {
                <div class="text-sm text-neutral-500">
                  @if (saving()) {
                    <div class="flex items-center">
                      <div class="w-2 h-2 bg-primary-500 rounded-full animate-pulse mr-2"></div>
                      Auto-saving...
                    </div>
                  } @else if (lastSaved()) {
                    <div class="flex items-center text-green-600">
                      ✓ Saved automatically
                    </div>
                  }
                </div>
              }
              
              <div class="flex space-x-3 ml-auto mt-2">
                <ui-button
                  variant="outline"
                  size="sm"
                  (clicked)="saveDraft.emit()"
                  [disabled]="saving()"
                >
                  Save Draft
                </ui-button>
                <ui-button
                  variant="primary"
                  size="sm"
                  (clicked)="saveAndValidate.emit()"
                  [disabled]="saving()"
                >
                  @if (saving()) {
                    Saving...
                  } @else {
                    Save & Continue
                  }
                </ui-button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class UiSectionCardComponent {
  title = input.required<string>();
  description = input<string>();
  required = input(false);
  completed = input(false);
  hasData = input(false);
  expanded = input(false);
  icon = input(false);
  autoSave = input(true);
  saving = input(false);
  lastSaved = input(false);

  // Icons
  ChevronDownIcon = ChevronDown;
  ChevronUpIcon = ChevronUp;

  // Outputs
  saveDraft = output<void>();
  saveAndValidate = output<void>();
  expandedChange = output<boolean>();

  iconClasses = () => {
    const baseClasses = 'w-8 h-8 rounded-lg flex items-center justify-center transition-colors';
    if (this.completed()) {
      return `${baseClasses} bg-green-100 text-green-600`;
    } else if (this.expanded()) {
      return `${baseClasses} bg-primary-100 text-primary-600`;
    } else {
      return `${baseClasses} bg-neutral-100 text-neutral-600`;
    }
  };

  toggleExpanded() {
    const newExpanded = !this.expanded();
    this.expandedChange.emit(newExpanded);
  }
}