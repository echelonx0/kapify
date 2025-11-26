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
  editable: boolean;
}

export interface FinancialTableSection {
  title: string;
  rows: FinancialTableRow[];
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
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
