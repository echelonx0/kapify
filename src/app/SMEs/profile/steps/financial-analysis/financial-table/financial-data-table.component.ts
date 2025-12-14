// src/app/SMEs/profile/steps/financial-analysis/financial-table/financial-data-table-refactored-v2.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnInit,
  effect,
  inject,
} from '@angular/core';
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
  editable?: boolean;
  isBold?: boolean;
  isTotal?: boolean;
  type?: 'currency' | 'percentage' | 'ratio';
  suffix?: string; // ADD THIS: "%", "x", or ""
}

export interface FinancialTableSection {
  title: string;
  rows: FinancialTableRow[];
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  collapsed?: boolean;
  accentColor?: 'orange' | 'teal'; // For ratio sections (orange) vs regular (teal)
  spacingBefore?: boolean; // Add spacing before this section (for Financial Ratios tab)
}

@Component({
  selector: 'app-financial-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './financial-data-table.component.html',
})
export class FinancialDataTableComponent implements OnInit {
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
  Math = Math;

  // Year window state
  private readonly YEARS_PER_VIEW = 3;
  currentWindowStart = signal(0);
  currentWindowEnd = signal(0);
  visibleYearHeaders = signal<string[]>([]);
  canGoPrevious = signal(false);
  canGoNext = signal(false);
  yearRangeText = signal('');

  collapsedSections = signal<Set<number>>(new Set());

  ngOnInit() {
    this.initializeWindow();
  }

  /**
   * Initialize year window to show last 3 years
   */
  private initializeWindow(): void {
    if (this.columnHeaders.length === 0) return;

    const maxStart = Math.max(
      0,
      this.columnHeaders.length - this.YEARS_PER_VIEW
    );
    this.setWindowPosition(maxStart);
  }

  /**
   * Set window to specific start position
   */
  private setWindowPosition(startIndex: number): void {
    const headers = this.columnHeaders;
    const start = Math.max(0, Math.min(startIndex, headers.length - 1));
    const end = Math.min(start + this.YEARS_PER_VIEW, headers.length);

    this.currentWindowStart.set(start);
    this.currentWindowEnd.set(end);
    this.visibleYearHeaders.set(headers.slice(start, end));
    this.canGoPrevious.set(start > 0);
    this.canGoNext.set(end < headers.length);

    const visible = this.visibleYearHeaders();
    if (visible.length > 0) {
      const first = visible[0];
      const last = visible[visible.length - 1];
      this.yearRangeText.set(`${first} to ${last}`);
    }
  }

  /**
   * Navigate to next years
   */
  goToNextYears(): void {
    const nextStart = this.currentWindowStart() + 1;
    const maxStart = Math.max(
      0,
      this.columnHeaders.length - this.YEARS_PER_VIEW
    );

    if (nextStart <= maxStart) {
      this.setWindowPosition(nextStart);
    }
  }

  /**
   * Navigate to previous years
   */
  goToPreviousYears(): void {
    if (this.currentWindowStart() > 0) {
      this.setWindowPosition(this.currentWindowStart() - 1);
    }
  }

  /**
   * Get filtered row values for visible window
   */
  getVisibleRowValues(allValues: number[]): number[] {
    return allValues.slice(this.currentWindowStart(), this.currentWindowEnd());
  }

  /**
   * Toggle section expansion
   */
  toggleSection(sectionIndex: number): void {
    const collapsed = this.collapsedSections();
    const newCollapsed = new Set(collapsed);

    if (newCollapsed.has(sectionIndex)) {
      newCollapsed.delete(sectionIndex);
    } else {
      newCollapsed.add(sectionIndex);
    }

    this.collapsedSections.set(newCollapsed);
  }

  isSectionCollapsed(sectionIndex: number): boolean {
    return this.collapsedSections().has(sectionIndex);
  }

  /**
   * Get section header classes based on accent color
   */
  getSectionHeaderClasses(section: FinancialTableSection): string {
    const classes: string[] = [
      'border-b',
      'border-slate-200',
      'transition-all',
      'duration-200',
    ];

    if (section.accentColor === 'orange') {
      classes.push('bg-orange-50/50', 'hover:bg-orange-50');
    } else {
      classes.push('bg-teal-50/50', 'hover:bg-teal-50');
    }

    return classes.join(' ');
  }

  /**
   * Get section header icon color
   */
  getSectionIconColor(section: FinancialTableSection): string {
    return section.accentColor === 'orange'
      ? 'text-orange-600'
      : 'text-teal-600';
  }

  /**
   * Get section header text color
   */
  getSectionTextColor(section: FinancialTableSection): string {
    return section.accentColor === 'orange'
      ? 'text-orange-900'
      : 'text-slate-900';
  }

  /**
   * Number formatting and parsing
   */
  formatNumber(value: number, row?: FinancialTableRow): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0';
    }

    // Always 1 decimal place
    const formatted = value.toFixed(1);
    const suffix = row?.suffix || '';

    return `${formatted}${suffix}`;
  }
  parseNumber(value: string): number {
    if (!value) return 0;
    const cleanValue = value.replace(/[,%x\s]/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Handle cell value changes
   */
  onCellChange(
    sectionIndex: number,
    rowIndex: number,
    visibleColIndex: number,
    event: Event
  ): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value;
    const numericValue = this.parseNumber(rawValue);
    const originalColIndex = this.currentWindowStart() + visibleColIndex;

    this.cellValueChanged.emit({
      sectionIndex,
      rowIndex,
      colIndex: originalColIndex,
      value: numericValue,
    });

    input.value = this.formatNumber(numericValue);
  }

  onInputFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  onEnterKey(event: Event): void {
    const input = event.target as HTMLInputElement;
    input?.blur();
  }

  /**
   * Check if row is editable
   */
  isRowEditable(row: FinancialTableRow): boolean {
    const editable = row.editable ?? true;
    if (editable === false) return false;
    if (row.isCalculated) return false;
    return this.editMode;
  }

  /**
   * Get CSS classes for cells
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
   * Get CSS classes for rows
   */
  getRowClasses(row: FinancialTableRow): string {
    const classes: string[] = ['border-b', 'transition-colors', 'duration-200'];

    if (row.isTotal) {
      classes.push('bg-slate-50', 'border-t-2', 'border-slate-300');
    }

    if (row.isCalculated) {
      classes.push('bg-teal-50/30');
    }

    return classes.join(' ');
  }

  /**
   * Track by functions for *@for loops
   */
  trackBySection(index: number, section: FinancialTableSection): string {
    return `section-${index}-${section.title}`;
  }

  trackByRow(index: number, row: FinancialTableRow): string {
    return `row-${index}-${row.label}`;
  }

  trackByHeader(index: number, header: string): string {
    return `col-${index}-${header}`;
  }
}
