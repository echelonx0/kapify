

// src/app/shared/components/ui/table.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, MoreHorizontal, Trash2, Edit3 } from 'lucide-angular';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface TableAction {
  label: string;
  icon?: any;
  action: (item?: any) => void; // Make item parameter optional
  variant?: 'default' | 'danger';
  disabled?: (item: any) => boolean;
}

@Component({
  selector: 'ui-table',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="overflow-hidden bg-white border border-neutral-200 rounded-lg">
      <!-- Table Header -->
      @if (showHeader) {
        <div class="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-neutral-900">{{ title }}</h3>
              @if (subtitle) {
                <p class="text-sm text-neutral-600 mt-1">{{ subtitle }}</p>
              }
            </div>
            @if (headerActions.length > 0) {
              <div class="flex items-center space-x-3">
                @for (action of headerActions; track action.label) {
                  <button
                    type="button"
                    (click)="executeHeaderAction(action)"
                    [class]="getHeaderActionClasses(action)"
                  >
                    @if (action.icon) {
                      <lucide-icon [img]="action.icon" [size]="16" class="mr-2" />
                    }
                    {{ action.label }}
                  </button>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-neutral-200">
          <thead class="bg-neutral-50">
            <tr>
              @for (column of columns; track column.key) {
                <th 
                  class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                  [style.width]="column.width"
                >
                  {{ column.label }}
                </th>
              }
              @if (actions.length > 0) {
                <th class="relative px-6 py-3">
                  <span class="sr-only">Actions</span>
                </th>
              }
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-neutral-200">
            @for (item of data; track getItemId(item)) {
              <tr class="hover:bg-neutral-50">
                @for (column of columns; track column.key) {
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                    <ng-container [ngSwitch]="column.key">
                      <span *ngSwitchDefault>{{ getNestedProperty(item, column.key) }}</span>
                    </ng-container>
                  </td>
                }
                @if (actions.length > 0) {
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="relative inline-block text-left">
                      <button
                        type="button"
                        (click)="toggleActionMenu(item)"
                        class="p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
                      >
                        <lucide-icon [img]="MoreHorizontalIcon" [size]="16" />
                      </button>
                    </div>
                  </td>
                }
              </tr>
            } @empty {
              <tr>
                <td [attr.colspan]="columns.length + (actions.length > 0 ? 1 : 0)" class="px-6 py-8 text-center text-sm text-neutral-500">
                  {{ emptyMessage }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class TableComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() showHeader: boolean = true;
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions: TableAction[] = [];
  @Input() headerActions: TableAction[] = [];
  @Input() emptyMessage: string = 'No data available';
  @Output() actionClicked = new EventEmitter<{action: TableAction, item: any}>();

  MoreHorizontalIcon = MoreHorizontal;

  getItemId(item: any): string {
    return item.id || item._id || JSON.stringify(item);
  }

  getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
  }

  toggleActionMenu(item: any) {
    // For now, just emit the first action if available
    if (this.actions.length > 0) {
      this.actionClicked.emit({ action: this.actions[0], item });
    }
  }

  executeHeaderAction(action: TableAction) {
    action.action(); // Header actions don't need an item parameter
  }

  getHeaderActionClasses(action: TableAction): string {
    const baseClasses = 'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors';
    
    if (action.variant === 'danger') {
      return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
    }
    
    return `${baseClasses} bg-primary-600 text-white hover:bg-primary-700`;
  }
}