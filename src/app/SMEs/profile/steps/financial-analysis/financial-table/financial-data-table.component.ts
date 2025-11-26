// src/app/SMEs/profile/steps/financial-analysis/financial-table/financial-data-table.component.ts
// FIXED: Moved effects to field initializers to resolve NG0203 injection context error

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
import { YearWindowService } from '../services/year-window.service';
import { FullscreenDarkModeService } from '../services/fullscreen-dark-mode.service';

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

  private yearWindow = inject(YearWindowService);
  private darkModeService = inject(FullscreenDarkModeService);

  // Icons
  ChevronDownIcon = ChevronDown;
  ChevronRightIcon = ChevronRight;
  LockIcon = Lock;

  // Math reference for template
  Math = Math;

  // Dark mode signals
  isDarkMode = signal(false);

  // Track collapsed sections
  collapsedSections = signal<Set<number>>(new Set());

  // Visible headers and window state
  visibleHeaders = signal<string[]>([]);
  hasNextYear = signal(false);
  hasPreviousYear = signal(false);
  yearRangeLabel = signal('');

  // Effect: Watch dark mode state
  private darkModeEffect = effect(() => {
    this.isDarkMode.set(this.darkModeService.isDarkMode());
  });

  // Effect: Watch for header changes
  private headerEffect = effect(() => {
    if (this.columnHeaders.length > 0) {
      this.yearWindow.setHeaders(this.columnHeaders);
      this.updateVisibleHeaders();
    }
  });

  // Effect: Watch for edit mode changes
  private editModeEffect = effect(() => {
    if (this.editMode) {
      this.yearWindow.showAllData();
      this.updateVisibleHeaders();
    } else {
      this.yearWindow.resetToLatest();
      this.updateVisibleHeaders();
    }
  });

  ngOnInit() {
    // Initialize year window with headers
    this.yearWindow.setHeaders(this.columnHeaders);
    this.updateVisibleHeaders();
  }

  /**
   * Update visible headers and navigation state
   */
  private updateVisibleHeaders(): void {
    const window = this.yearWindow.getWindow();
    this.visibleHeaders.set(window.visibleYears);
    this.hasNextYear.set(window.hasNextWindow);
    this.hasPreviousYear.set(window.hasPreviousWindow);

    if (window.visibleYears.length > 0) {
      const first = window.visibleYears[0];
      const last = window.visibleYears[window.visibleYears.length - 1];
      this.yearRangeLabel.set(`${first} to ${last}`);
    }
  }

  /**
   * Get year tab styling
   */
  getYearTabClass(index: number): string {
    if (this.isDarkMode()) {
      if (index === 0 || index === this.visibleHeaders().length - 1) {
        return 'bg-[var(--accent-teal-light)] text-[var(--accent-teal)] border-[var(--accent-teal)]/30';
      }
      return 'bg-[var(--button-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--border-color)]';
    }

    if (index === 0 || index === this.visibleHeaders().length - 1) {
      return 'bg-teal-50 text-teal-700 border-teal-300/50';
    }
    return 'bg-white text-slate-700 border-slate-200 hover:border-slate-300';
  }

  /**
   * Get filtered row values (only visible columns)
   */
  getVisibleRowValues(allValues: number[]): number[] {
    if (this.editMode) {
      return allValues; // Show all values in edit mode
    }
    return this.yearWindow.getVisibleRowValues(allValues);
  }

  /**
   * Navigate to next year window
   */
  goToNextYears(): void {
    this.yearWindow.nextWindow();
    this.updateVisibleHeaders();
  }

  /**
   * Navigate to previous year window
   */
  goToPreviousYears(): void {
    this.yearWindow.previousWindow();
    this.updateVisibleHeaders();
  }

  /**
   * Check if showing all years (edit mode indicator)
   */
  isShowingAllYears(): boolean {
    return this.editMode || this.columnHeaders.length <= 3;
  }

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

    const rounded = Math.round(value);
    return rounded.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  /**
   * Parse formatted number string back to number
   */
  parseNumber(value: string): number {
    if (!value) return 0;
    const cleanValue = value.replace(/,/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : Math.round(parsed);
  }

  /**
   * Handle cell value change
   * Convert visible column index to original column index for data updates
   */
  onCellChange(
    sectionIndex: number,
    rowIndex: number,
    visibleColIndex: number,
    event: Event
  ) {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value;
    const numericValue = this.parseNumber(rawValue);

    // Map visible column index to original column index
    const originalColIndex =
      this.yearWindow.getOriginalColumnIndex(visibleColIndex);

    this.cellValueChanged.emit({
      sectionIndex,
      rowIndex,
      colIndex: originalColIndex,
      value: numericValue,
    });

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
   * Handle Enter key press
   */
  onEnterKey(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      input.blur();
    }
  }

  /**
   * Check if a row is editable
   */
  isRowEditable(row: FinancialTableRow): boolean {
    const editable = row.isEditable ?? row.editable;
    if (editable === false) {
      return false;
    }
    if (row.isCalculated) {
      return false;
    }
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

    // In dark mode, use CSS variables; in light mode, use Tailwind
    if (!this.isDarkMode()) {
      if (value < 0) {
        classes.push('text-red-700');
      } else if (row.isTotal) {
        classes.push('text-slate-900');
      } else {
        classes.push('text-slate-700');
      }
    }

    return classes.join(' ');
  }

  /**
   * Get row styling classes
   */
  getRowClasses(row: FinancialTableRow): string {
    const classes: string[] = ['border-b', 'transition-colors', 'duration-200'];

    if (this.isDarkMode()) {
      classes.push('bg-[var(--bg-secondary)]');
      classes.push('border-[var(--border-color)]');

      if (row.isTotal) {
        classes.push('border-t-2');
        classes.push('bg-[var(--bg-tertiary)]');
      }

      if (row.isCalculated) {
        classes.push('opacity-80');
      }
    } else {
      if (row.isTotal) {
        classes.push('bg-slate-50', 'border-t-2', 'border-slate-300');
      }

      if (row.isCalculated) {
        classes.push('bg-teal-50/30');
      }
    }

    return classes.join(' ');
  }

  /**
   * Track by functions for *ngFor optimization
   */
  trackBySection(index: number, section: FinancialTableSection): string {
    return `section-${index}-${section.title}`;
  }

  trackByRow(index: number, row: FinancialTableRow): string {
    return `row-${index}-${row.label}`;
  }

  trackByColumn(index: number, header: string): string {
    return `col-${index}-${header}`;
  }
}
