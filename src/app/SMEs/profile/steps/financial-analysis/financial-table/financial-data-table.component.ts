// // src/app/SMEs/profile/steps/financial-analysis/financial-table/financial-data-table.component.ts
// import { Component, Input, Output, EventEmitter } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import {
//   LucideAngularModule,
//   ChevronDown,
//   ChevronRight,
//   Lock,
//   PenLine,
// } from 'lucide-angular';

// export interface FinancialTableRow {
//   label: string;
//   values: number[];
//   editable: boolean;
//   type?: 'currency' | 'percentage' | 'ratio';
//   isCalculated?: boolean;
// }

// export interface FinancialTableSection {
//   title: string;
//   rows: FinancialTableRow[];
//   collapsed?: boolean;
// }

// @Component({
//   selector: 'app-financial-data-table',
//   standalone: true,
//   imports: [CommonModule, LucideAngularModule],
//   template: `
//     <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
//       <!-- Scrollable Table Container -->
//       <div class="overflow-x-auto">
//         <table class="w-full border-collapse text-sm">
//           <!-- Header -->
//           <thead
//             class="sticky top-0 z-20 bg-slate-50 border-b border-slate-200"
//           >
//             <tr>
//               <th class="sticky left-0 z-30 bg-slate-50 px-6 py-3 text-left">
//                 <span
//                   class="text-xs font-semibold text-slate-900 uppercase tracking-wide"
//                 >
//                   {{ itemLabel }}
//                 </span>
//               </th>
//               @for (header of columnHeaders; track header) {
//               <th class="px-4 py-3 text-center min-w-[100px] whitespace-nowrap">
//                 <span
//                   class="text-xs font-semibold text-slate-900 uppercase tracking-wide whitespace-nowrap"
//                 >
//                   {{ header }}
//                 </span>
//               </th>
//               }
//             </tr>
//           </thead>

//           <!-- Body -->
//           <tbody>
//             @for (section of sections; track section.title; let sectionIndex =
//             $index) {
//             <!-- Section Header -->
//             <tr
//               (click)="toggleSection(sectionIndex)"
//               class="bg-teal-50 border-b border-teal-300/50 cursor-pointer transition-all duration-200 hover:bg-teal-100"
//             >
//               <td
//                 class="sticky left-0 z-10 bg-teal-50 hover:bg-teal-100 px-6 py-3"
//                 [attr.colspan]="columnHeaders.length + 1"
//               >
//                 <div class="flex items-center justify-between gap-3">
//                   <div class="flex items-center gap-3 flex-1 min-w-0">
//                     <div
//                       class="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0"
//                     >
//                       <lucide-icon
//                         [name]="
//                           section.collapsed ? ChevronRightIcon : ChevronDownIcon
//                         "
//                         [size]="16"
//                         class="text-teal-600"
//                       ></lucide-icon>
//                     </div>

//                     <span
//                       class="text-sm font-bold text-teal-900 uppercase tracking-wide"
//                     >
//                       {{ section.title }}
//                     </span>
//                   </div>

//                   <span
//                     class="px-2.5 py-1 rounded-full bg-white border border-teal-200/50 text-xs font-semibold text-teal-700 flex-shrink-0"
//                   >
//                     {{ section.rows.length }}
//                   </span>
//                 </div>
//               </td>
//             </tr>

//             <!-- Data Rows -->
//             @if (!section.collapsed) { @for (row of section.rows; track
//             row.label; let rowIndex = $index) {
//             <tr
//               [class.bg-green-50]="
//                 editMode && row.editable && !row.isCalculated
//               "
//               [class.bg-slate-50]="row.isCalculated"
//               [class.hover:bg-slate-100]="
//                 !row.isCalculated && !(editMode && row.editable)
//               "
//               [class.hover:bg-green-100]="
//                 editMode && row.editable && !row.isCalculated
//               "
//               class="border-b border-slate-200 transition-colors duration-200"
//             >
//               <!-- Label Cell -->
//               <td
//                 class="sticky left-0 z-10 px-6 py-3 text-left bg-white"
//                 [class.bg-green-50]="
//                   editMode && row.editable && !row.isCalculated
//                 "
//                 [class.bg-slate-50]="row.isCalculated"
//               >
//                 <div class="flex items-center gap-2 min-w-0">
//                   <span
//                     [class.font-bold]="row.isCalculated"
//                     [class.font-semibold]="!row.isCalculated"
//                     class="text-slate-900 truncate"
//                   >
//                     {{ row.label }}
//                   </span>

//                   @if (row.isCalculated) {
//                   <div
//                     class="w-5 h-5 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0"
//                     title="Calculated field - not editable"
//                   >
//                     <lucide-icon [name]="LockIcon" [size]="12"></lucide-icon>
//                   </div>
//                   } @if (editMode && row.editable && !row.isCalculated) {
//                   <div
//                     class="w-5 h-5 rounded-lg bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0"
//                     title="Editable"
//                   >
//                     <lucide-icon [name]="EditIcon" [size]="12"></lucide-icon>
//                   </div>
//                   }
//                 </div>
//               </td>

//               <!-- Value Cells -->
//               @for (value of row.values; track colIndex; let colIndex = $index)
//               {
//               <td
//                 class="px-4 py-3 text-center whitespace-nowrap"
//                 [class.bg-green-50]="
//                   editMode && row.editable && !row.isCalculated
//                 "
//                 [class.bg-slate-50]="row.isCalculated"
//               >
//                 @if (editMode && row.editable && !row.isCalculated) {
//                 <div class="flex justify-center">
//                   <input
//                     type="text"
//                     [value]="formatInputWithCommas(value)"
//                     (blur)="
//                       onCellBlur($event, sectionIndex, rowIndex, colIndex)
//                     "
//                     (keydown.enter)="onEnterKey($event)"
//                     (focus)="onCellFocus($event)"
//                     class="px-2 py-1 text-center text-[10px] font-semibold
//          border border-green-300 rounded-xl
//          bg-white text-slate-900
//          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent
//          transition-all duration-200 hover:border-green-400
//          min-w-[90px] w-fit"
//                   />
//                 </div>
//                 } @else {
//                 <!-- Display Value -->
//                 <span
//                   [class.text-red-700]="value < 0"
//                   [class.text-green-700]="
//                     value > 0 && row.type === 'percentage'
//                   "
//                   [class.font-bold]="row.isCalculated"
//                   [class.font-semibold]="!row.isCalculated"
//                   [class.text-slate-500]="value === 0 || value == null"
//                   class="text-slate-900 tabular-nums"
//                 >
//                   {{ formatValue(value, row.type) }}
//                 </span>
//                 }
//               </td>
//               }
//             </tr>
//             } } }
//           </tbody>
//         </table>
//       </div>

//       <!-- Empty State -->
//       @if (sections.length === 0) {
//       <div class="p-12 text-center">
//         <div
//           class="w-12 h-12 mx-auto mb-4 rounded-xl bg-slate-100 flex items-center justify-center"
//         >
//           <lucide-icon name="table" [size]="24" class="text-slate-400" />
//         </div>
//         <p class="text-slate-600">No data available</p>
//       </div>
//       }
//     </div>
//   `,
// })
// export class FinancialDataTableComponent {
//   @Input() sections: FinancialTableSection[] = [];
//   @Input() columnHeaders: string[] = [];
//   @Input() editMode = false;
//   @Input() itemLabel = 'Item';

//   @Output() cellValueChanged = new EventEmitter<{
//     sectionIndex: number;
//     rowIndex: number;
//     colIndex: number;
//     value: number;
//   }>();

//   ChevronDownIcon = ChevronDown;
//   ChevronRightIcon = ChevronRight;
//   LockIcon = Lock;
//   EditIcon = PenLine;

//   toggleSection(sectionIndex: number) {
//     if (this.sections[sectionIndex]) {
//       this.sections[sectionIndex].collapsed =
//         !this.sections[sectionIndex].collapsed;
//     }
//   }

//   onEnterKey(event: Event) {
//     const input = event.target as HTMLInputElement;
//     if (input) {
//       input.blur();
//     }
//   }

//   formatValue(value: number, type?: string): string {
//     if (value === 0 || value === null || value === undefined) return '-';

//     if (type === 'percentage') {
//       return `${value.toFixed(1)}%`;
//     }

//     if (type === 'currency') {
//       const formatted = new Intl.NumberFormat('en-ZA', {
//         style: 'decimal',
//         minimumFractionDigits: 0,
//         maximumFractionDigits: 0,
//       }).format(Math.abs(value));
//       return value < 0 ? `(${formatted})` : formatted;
//     }

//     if (type === 'ratio') {
//       return value.toFixed(2);
//     }

//     // Default: format as number with thousands separator
//     const formatted = new Intl.NumberFormat('en-ZA', {
//       style: 'decimal',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 2,
//     }).format(Math.abs(value));
//     return value < 0 ? `(${formatted})` : formatted;
//   }

//   getInputStep(type?: string): string {
//     if (type === 'percentage' || type === 'ratio') {
//       return '0.01';
//     }
//     return '1';
//   }

//   formatInputWithCommas(value: number): string {
//     if (value === null || value === undefined) return '';
//     return value.toLocaleString('en-ZA');
//   }

//   parseCommaNumber(str: string): number {
//     if (!str) return 0;
//     return parseFloat(str.replace(/,/g, '')) || 0;
//   }

//   onCellFocus(event: Event) {
//     const input = event.target as HTMLInputElement;
//     if (input) {
//       // remove commas for editing
//       input.value = input.value.replace(/,/g, '');
//       input.select();
//     }
//   }

//   onCellBlur(
//     event: Event,
//     sectionIndex: number,
//     rowIndex: number,
//     colIndex: number
//   ) {
//     const input = event.target as HTMLInputElement;
//     if (input && input.value !== '') {
//       const numericValue = this.parseCommaNumber(input.value);

//       // Emit clean numeric value
//       this.cellValueChanged.emit({
//         sectionIndex,
//         rowIndex,
//         colIndex,
//         value: numericValue,
//       });

//       // Re-format with commas after editing
//       input.value = this.formatInputWithCommas(numericValue);
//     }
//   }
// }
// src/app/SMEs/profile/steps/financial-analysis/financial-table/financial-data-table.component.ts
import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  ChevronDown,
  ChevronRight,
  Lock,
} from 'lucide-angular';

export interface FinancialTableRow {
  label: string;
  values: number[];
  isCalculated?: boolean;
  isEditable?: boolean;
  isBold?: boolean;
  isTotal?: boolean;
  type?: 'currency' | 'percentage' | 'ratio';
  // Legacy support - transformer uses 'editable' (required by excel-parser)
  editable: boolean;
}

export interface FinancialTableSection {
  title: string;
  rows: FinancialTableRow[];
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  // Legacy support - transformer uses 'collapsed'
  collapsed?: boolean;
}

@Component({
  selector: 'app-financial-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './financial-data-table.component.html',
})
export class FinancialDataTableComponent {
  @Input() sections: FinancialTableSection[] = [];
  @Input() columnHeaders: string[] = [];
  @Input() editMode: boolean = false;
  @Input() itemLabel: string = 'Item';

  @Output() cellValueChanged = new EventEmitter<{
    sectionIndex: number;
    rowIndex: number;
    colIndex: number;
    value: number;
  }>();

  // Icons
  ChevronDownIcon = ChevronDown;
  ChevronRightIcon = ChevronRight;
  LockIcon = Lock;

  // Math reference for template
  Math = Math;

  // Track collapsed sections
  collapsedSections = signal<Set<number>>(new Set());

  /**
   * Toggle section collapse state
   */
  toggleSection(sectionIndex: number) {
    const collapsed = this.collapsedSections();
    const newCollapsed = new Set(collapsed);

    if (newCollapsed.has(sectionIndex)) {
      newCollapsed.delete(sectionIndex);
    } else {
      newCollapsed.add(sectionIndex);
    }

    this.collapsedSections.set(newCollapsed);
  }

  /**
   * Check if section is collapsed
   * Handles both 'collapsed' and 'isCollapsible' properties
   */
  isSectionCollapsed(sectionIndex: number): boolean {
    return this.collapsedSections().has(sectionIndex);
  }

  /**
   * Format number with commas and round to zero decimals
   */
  formatNumber(value: number): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }

    // Round to zero decimals
    const rounded = Math.round(value);

    // Format with commas
    return rounded.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  /**
   * Parse formatted number string back to number
   * Removes commas and handles negatives
   */
  parseNumber(value: string): number {
    if (!value) return 0;

    // Remove commas and parse
    const cleanValue = value.replace(/,/g, '');
    const parsed = parseFloat(cleanValue);

    return isNaN(parsed) ? 0 : Math.round(parsed);
  }

  /**
   * Handle cell value change
   */
  onCellChange(
    sectionIndex: number,
    rowIndex: number,
    colIndex: number,
    event: Event
  ) {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value;
    const numericValue = this.parseNumber(rawValue);

    // Emit the rounded value
    this.cellValueChanged.emit({
      sectionIndex,
      rowIndex,
      colIndex,
      value: numericValue,
    });

    // Format the input immediately to show comma separators
    input.value = this.formatNumber(numericValue);
  }

  /**
   * Handle input focus - select all text for easy editing
   */
  onInputFocus(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  /**
   * Handle Enter key press to blur input
   */
  onEnterKey(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      input.blur();
    }
  }

  /**
   * Check if a row is editable
   * Handles both 'isEditable' and 'editable' properties for backward compatibility
   */
  isRowEditable(row: FinancialTableRow): boolean {
    // Support both property names - editable is required, isEditable is optional
    const editable = row.isEditable ?? row.editable;

    // If explicitly marked as not editable, return false
    if (editable === false) {
      return false;
    }

    // If calculated field, not editable
    if (row.isCalculated) {
      return false;
    }

    // Otherwise editable in edit mode
    return this.editMode;
  }

  /**
   * Get cell styling classes
   */
  getCellClasses(row: FinancialTableRow, value: number): string {
    const classes: string[] = ['text-right'];

    if (row.isBold || row.isTotal) {
      classes.push('font-semibold');
    }

    if (value < 0) {
      classes.push('text-red-700');
    } else if (row.isTotal) {
      classes.push('text-slate-900');
    } else {
      classes.push('text-slate-700');
    }

    return classes.join(' ');
  }

  /**
   * Get row styling classes
   */
  getRowClasses(row: FinancialTableRow): string {
    const classes: string[] = [];

    if (row.isTotal) {
      classes.push('bg-slate-50', 'border-t-2', 'border-slate-300');
    }

    if (row.isCalculated) {
      classes.push('bg-teal-50/30');
    }

    return classes.join(' ');
  }

  /**
   * Track by function for sections
   */
  trackBySection(index: number, section: FinancialTableSection): string {
    return `section-${index}-${section.title}`;
  }

  /**
   * Track by function for rows
   */
  trackByRow(index: number, row: FinancialTableRow): string {
    return `row-${index}-${row.label}`;
  }

  /**
   * Track by function for columns
   */
  trackByColumn(index: number, header: string): string {
    return `col-${index}-${header}`;
  }
}
