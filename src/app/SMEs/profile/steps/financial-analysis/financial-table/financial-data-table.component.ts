import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  LucideAngularModule,
  ChevronDown,
  ChevronRight,
  Lock,
  PenLine,
} from 'lucide-angular';

export interface FinancialTableRow {
  label: string;
  values: number[];
  editable: boolean;
  type?: 'currency' | 'percentage' | 'ratio';
  isCalculated?: boolean;
}

export interface FinancialTableSection {
  title: string;
  rows: FinancialTableRow[];
  collapsed?: boolean;
}

@Component({
  selector: 'app-financial-data-table',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <!-- Scrollable Table Container -->
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-sm">
          <!-- Header -->
          <thead
            class="sticky top-0 z-20 bg-slate-100 border-b border-slate-200"
          >
            <tr>
              <th class="sticky left-0 z-30 bg-slate-100 px-6 py-3 text-left">
                <span
                  class="text-xs font-semibold text-slate-900 uppercase tracking-wide"
                >
                  {{ itemLabel }}
                </span>
              </th>
              @for (header of columnHeaders; track header) {
              <th class="px-4 py-3 text-center">
                <span
                  class="text-xs font-semibold text-slate-900 uppercase tracking-wide whitespace-nowrap"
                >
                  {{ header }}
                </span>
              </th>
              }
            </tr>
          </thead>

          <!-- Body -->
          <tbody>
            @for (section of sections; track section.title; let sectionIndex =
            $index) {
            <!-- Section Header -->
            <tr
              (click)="toggleSection(sectionIndex)"
              class="bg-teal-50 border-b border-teal-300/50 cursor-pointer transition-all duration-200 hover:bg-teal-100"
            >
              <td
                class="sticky left-0 z-10 bg-teal-50 px-6 py-3 col-span-full"
                [attr.colspan]="columnHeaders.length + 1"
              >
                <div class="flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      class="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0"
                    >
                      <lucide-icon
                        [name]="
                          section.collapsed ? ChevronRightIcon : ChevronDownIcon
                        "
                        [size]="16"
                        class="text-teal-600"
                      ></lucide-icon>
                    </div>
                    <span
                      class="text-sm font-bold text-teal-900 uppercase tracking-wide"
                    >
                      {{ section.title }}
                    </span>
                  </div>
                  <span
                    class="px-2.5 py-1 rounded-full bg-white border border-teal-200/50 text-xs font-semibold text-teal-700 flex-shrink-0"
                  >
                    {{ section.rows.length }}
                  </span>
                </div>
              </td>
            </tr>

            <!-- Data Rows -->
            @if (!section.collapsed) { @for (row of section.rows; track
            row.label; let rowIndex = $index) {
            <tr
              [class.bg-green-50]="
                editMode && row.editable && !row.isCalculated
              "
              [class.bg-slate-50]="row.isCalculated"
              [class.hover:bg-slate-100]="
                !row.isCalculated && !(editMode && row.editable)
              "
              [class.hover:bg-green-100]="
                editMode && row.editable && !row.isCalculated
              "
              class="border-b border-slate-200 transition-colors duration-200"
            >
              <!-- Label Cell -->
              <td
                class="sticky left-0 z-10 px-6 py-3 text-left bg-white"
                [class.bg-green-50]="
                  editMode && row.editable && !row.isCalculated
                "
                [class.bg-slate-50]="row.isCalculated"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    [class.font-bold]="row.isCalculated"
                    [class.font-semibold]="!row.isCalculated"
                    class="text-slate-900 truncate"
                  >
                    {{ row.label }}
                  </span>
                  @if (row.isCalculated) {
                  <div
                    class="w-5 h-5 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0"
                  >
                    <lucide-icon [name]="LockIcon" [size]="12"></lucide-icon>
                  </div>
                  } @if (editMode && row.editable && !row.isCalculated) {
                  <div
                    class="w-5 h-5 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0"
                  >
                    <lucide-icon [name]="EditIcon" [size]="12"></lucide-icon>
                  </div>
                  }
                </div>
              </td>

              <!-- Value Cells -->
              @for (value of row.values; track colIndex; let colIndex = $index)
              {
              <td
                class="px-4 py-3 text-center"
                [class.bg-green-50]="
                  editMode && row.editable && !row.isCalculated
                "
                [class.bg-slate-50]="row.isCalculated"
              >
                @if (editMode && row.editable && !row.isCalculated) {
                <!-- Editable Input -->
                <div class="flex justify-center">
                  <input
                    type="number"
                    [value]="value"
                    (blur)="
                      onCellBlur($event, sectionIndex, rowIndex, colIndex)
                    "
                    (focus)="onCellFocus($event)"
                    [step]="getInputStep(row.type)"
                    class="w-20 px-3 py-2 text-center text-sm font-semibold border border-green-300 rounded-lg
                           bg-white text-slate-900
                           focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:border-transparent
                           transition-all duration-200
                           hover:border-green-400"
                  />
                </div>
                } @else {
                <!-- Display Value -->
                <span
                  [class.text-red-700]="value < 0"
                  [class.text-green-700]="
                    value > 0 && row.type === 'percentage'
                  "
                  [class.font-bold]="row.isCalculated"
                  [class.font-semibold]="!row.isCalculated"
                  [class.text-slate-600]="
                    value === 0 || value === null || value === undefined
                  "
                  class="text-slate-900 tabular-nums"
                >
                  {{ formatValue(value, row.type) }}
                </span>
                }
              </td>
              }
            </tr>
            } } }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class FinancialDataTableComponent {
  @Input() sections: FinancialTableSection[] = [];
  @Input() columnHeaders: string[] = [];
  @Input() editMode = false;
  @Input() itemLabel = 'Item';

  @Output() cellValueChanged = new EventEmitter<{
    sectionIndex: number;
    rowIndex: number;
    colIndex: number;
    value: number;
  }>();

  ChevronDownIcon = ChevronDown;
  ChevronRightIcon = ChevronRight;
  LockIcon = Lock;
  EditIcon = PenLine;

  toggleSection(sectionIndex: number) {
    this.sections[sectionIndex].collapsed =
      !this.sections[sectionIndex].collapsed;
  }

  onCellFocus(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      input.select();
    }
  }

  onCellBlur(
    event: Event,
    sectionIndex: number,
    rowIndex: number,
    colIndex: number
  ) {
    const input = event.target as HTMLInputElement;
    if (input && input.value !== '') {
      const value = parseFloat(input.value) || 0;
      this.cellValueChanged.emit({
        sectionIndex,
        rowIndex,
        colIndex,
        value,
      });
    }
  }

  formatValue(value: number, type?: string): string {
    if (value === 0 || value === null || value === undefined) return '-';

    if (type === 'percentage') {
      return `${value.toFixed(1)}%`;
    }

    if (type === 'currency') {
      const formatted = new Intl.NumberFormat('en-ZA', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Math.abs(value));
      return value < 0 ? `(${formatted})` : formatted;
    }

    if (type === 'ratio') {
      return value.toFixed(2);
    }

    return value.toFixed(2);
  }

  getInputStep(type?: string): string {
    if (type === 'percentage' || type === 'ratio') {
      return '0.01';
    }
    return '1';
  }
}
