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

  private darkModeService = inject(FullscreenDarkModeService);

  // Icons
  ChevronDownIcon = ChevronDown;
  ChevronRightIcon = ChevronRight;
  LockIcon = Lock;
  Math = Math;

  // Dark mode
  isDarkMode = signal(false);
  collapsedSections = signal<Set<number>>(new Set());

  // Year window state - MANUAL MANAGEMENT
  currentWindowStart = 0;
  currentWindowEnd = 0;
  visibleYearHeaders: string[] = [];
  canGoPrevious = false;
  canGoNext = false;
  yearRangeText = '';

  private darkModeEffect = effect(() => {
    this.isDarkMode.set(this.darkModeService.isDarkMode());
  });

  ngOnInit() {
    this.initializeWindow();
  }

  /**
   * Initialize the window with latest years
   */
  private initializeWindow(): void {
    const YEARS_PER_VIEW = 3;
    if (this.columnHeaders.length === 0) return;

    const maxStart = Math.max(0, this.columnHeaders.length - YEARS_PER_VIEW);
    this.setWindowPosition(maxStart);
  }

  /**
   * Set window to a specific start position and update all state
   */
  private setWindowPosition(startIndex: number): void {
    const YEARS_PER_VIEW = 3;
    const headers = this.columnHeaders;

    // Clamp to valid range
    const start = Math.max(0, Math.min(startIndex, headers.length - 1));
    const end = Math.min(start + YEARS_PER_VIEW, headers.length);

    // Update state
    this.currentWindowStart = start;
    this.currentWindowEnd = end;
    this.visibleYearHeaders = headers.slice(start, end);
    this.canGoPrevious = start > 0;
    this.canGoNext = end < headers.length;

    if (this.visibleYearHeaders.length > 0) {
      const first = this.visibleYearHeaders[0];
      const last = this.visibleYearHeaders[this.visibleYearHeaders.length - 1];
      this.yearRangeText = `${first} to ${last}`;
    }

    console.log('🎯 Window position set:', {
      start,
      end,
      visible: this.visibleYearHeaders,
      canPrev: this.canGoPrevious,
      canNext: this.canGoNext,
    });
  }

  /**
   * Navigate arrows - public methods called from template
   */
  goToNextYears(): void {
    const YEARS_PER_VIEW = 3;
    const nextStart = this.currentWindowStart + 1;
    const maxStart = Math.max(0, this.columnHeaders.length - YEARS_PER_VIEW);

    if (nextStart <= maxStart) {
      console.log('➡️ Next:', this.currentWindowStart, '→', nextStart);
      this.setWindowPosition(nextStart);
    }
  }

  goToPreviousYears(): void {
    if (this.currentWindowStart > 0) {
      const prevStart = this.currentWindowStart - 1;
      console.log('⬅️ Previous:', this.currentWindowStart, '→', prevStart);
      this.setWindowPosition(prevStart);
    }
  }

  /**
   * Get visible headers - called in template *@for*
   */
  getVisibleHeaders(): string[] {
    return this.visibleYearHeaders;
  }

  /**
   * Get visible row values - called in template *@for*
   */
  getVisibleRowValues(allValues: number[]): number[] {
    const filtered = allValues.slice(
      this.currentWindowStart,
      this.currentWindowEnd
    );
    return filtered;
  }

  /**
   * Get year tab class
   */
  getYearTabClass(index: number): string {
    const visible = this.visibleYearHeaders;

    if (this.isDarkMode()) {
      if (index === 0 || index === visible.length - 1) {
        return 'bg-[var(--accent-teal-light)] text-[var(--accent-teal)] border-[var(--accent-teal)]/30';
      }
      return 'bg-[var(--button-bg)] text-[var(--text-secondary)] border-[var(--border-color)]';
    }

    if (index === 0 || index === visible.length - 1) {
      return 'bg-teal-50 text-teal-700 border-teal-300/50';
    }
    return 'bg-white text-slate-700 border-slate-200';
  }

  /**
   * Toggle section
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

  isSectionCollapsed(sectionIndex: number): boolean {
    return this.collapsedSections().has(sectionIndex);
  }

  /**
   * Number formatting
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

  parseNumber(value: string): number {
    if (!value) return 0;
    const cleanValue = value.replace(/,/g, '');
    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : Math.round(parsed);
  }

  /**
   * Cell change handler
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

    // Convert visible index to original index
    const originalColIndex = this.currentWindowStart + visibleColIndex;

    this.cellValueChanged.emit({
      sectionIndex,
      rowIndex,
      colIndex: originalColIndex,
      value: numericValue,
    });

    input.value = this.formatNumber(numericValue);
  }

  onInputFocus(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    input.select();
  }

  onEnterKey(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      input.blur();
    }
  }

  /**
   * Row styling
   */
  isRowEditable(row: FinancialTableRow): boolean {
    const editable = row.isEditable ?? row.editable;
    if (editable === false) return false;
    if (row.isCalculated) return false;
    return this.editMode;
  }

  getCellClasses(row: FinancialTableRow, value: number): string {
    const classes: string[] = ['text-right'];

    if (row.isBold || row.isTotal) {
      classes.push('font-semibold');
    }

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
   * Track by functions
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
