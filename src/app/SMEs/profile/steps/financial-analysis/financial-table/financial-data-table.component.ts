// src/app/SMEs/profile/steps/financial-analysis/financial-table/financial-data-table-v4.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnInit,
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
  suffix?: string;
  // Design system styling for custom row styling (e.g., total rows with teal-50 bg)
  styling?: {
    rowClass?: string; // Custom row classes (e.g., 'bg-teal-50 border-t-2 border-slate-200')
    labelClass?: string; // Custom label classes (e.g., 'font-bold text-slate-900')
  };
}

export interface FinancialTableSection {
  title: string;
  rows: FinancialTableRow[];
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  collapsed?: boolean;
  accentColor?: 'orange' | 'teal';
  // Spacing control: 'sm' | 'md' | 'lg' (or undefined for no spacing)
  spacingBefore?: 'sm' | 'md' | 'lg';
  spacingAfter?: 'sm' | 'md' | 'lg';
  isVisualLabel?: boolean; // Visual label only (no rows)
  isSimpleRow?: boolean; // Section with single bold row (like totals)
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

  private initializeWindow(): void {
    if (this.columnHeaders.length === 0) return;
    const maxStart = Math.max(
      0,
      this.columnHeaders.length - this.YEARS_PER_VIEW
    );
    this.setWindowPosition(maxStart);
  }

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

  goToPreviousYears(): void {
    if (this.currentWindowStart() > 0) {
      this.setWindowPosition(this.currentWindowStart() - 1);
    }
  }

  getVisibleRowValues(allValues: number[]): number[] {
    return allValues.slice(this.currentWindowStart(), this.currentWindowEnd());
  }

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

  isVisualLabel(section: FinancialTableSection): boolean {
    return section.isVisualLabel === true;
  }

  isSimpleRow(section: FinancialTableSection): boolean {
    return section.isSimpleRow === true;
  }

  /**
   * Get spacing classes for section (margin-top)
   */
  getSpacingBeforeClasses(spacing?: 'sm' | 'md' | 'lg'): string {
    if (!spacing) return '';
    const spacingMap = {
      sm: 'mt-2',
      md: 'mt-4',
      lg: 'mt-6',
    };
    return spacingMap[spacing] || '';
  }

  /**
   * Get spacing classes for section (margin-bottom)
   */
  getSpacingAfterClasses(spacing?: 'sm' | 'md' | 'lg'): string {
    if (!spacing) return '';
    const spacingMap = {
      sm: 'mb-2',
      md: 'mb-4',
      lg: 'mb-6',
    };
    return spacingMap[spacing] || '';
  }

  getSectionHeaderClasses(section: FinancialTableSection): string {
    const classes: string[] = [
      'border-b',
      'border-slate-200',
      'transition-all',
      'duration-200',
      'bg-slate-50',
    ];

    return classes.join(' ');
  }

  getSectionIconColor(): string {
    return 'text-slate-600';
  }

  getSectionTextColor(): string {
    return 'text-slate-900';
  }

  getVisualLabelClasses(): string {
    return 'border-b border-slate-200 bg-slate-50 px-4 py-3';
  }

  formatNumber(value: number, row?: FinancialTableRow): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0.0';
    }

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

  isRowEditable(row: FinancialTableRow): boolean {
    const editable = row.editable ?? true;
    if (editable === false) return false;
    if (row.isCalculated) return false;
    return this.editMode;
  }

  /**
   * Get row classes including custom styling from transformer
   */
  getRowClasses(row: FinancialTableRow, isDataRow: boolean = true): string {
    const classes: string[] = [];

    // Apply custom styling from transformer (e.g., for total rows)
    if (row.styling?.rowClass) {
      classes.push(row.styling.rowClass);
      // Return early if custom styling provided (it handles all styling)
      return classes.join(' ');
    }

    // Default styling for data rows
    if (isDataRow) {
      classes.push('border-b', 'transition-colors', 'duration-200');

      if (row.isTotal) {
        classes.push('bg-teal-50', 'border-t-2', 'border-slate-200');
      }

      if (row.isCalculated) {
        classes.push('bg-teal-50/30');
      }
    }

    return classes.join(' ');
  }

  /**
   * Get label classes including custom styling from transformer
   */
  getLabelClasses(row: FinancialTableRow): string {
    // Apply custom styling from transformer
    if (row.styling?.labelClass) {
      return row.styling.labelClass;
    }

    // Default label styling
    const classes: string[] = ['px-4', 'py-3'];
    if (row.isBold || row.isTotal) {
      classes.push('font-semibold');
    }
    return classes.join(' ');
  }

  getCellClasses(row: FinancialTableRow, value: number): string {
    const classes: string[] = ['text-right', 'px-4', 'py-3'];

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
