// src/app/SMEs/profile/steps/financial-analysis/services/year-window.service.ts
import { Injectable, signal, computed } from '@angular/core';

export interface YearWindow {
  startIndex: number;
  endIndex: number;
  visibleYears: string[];
  hasNextWindow: boolean;
  hasPreviousWindow: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class YearWindowService {
  private readonly YEARS_PER_VIEW = 3;
  private readonly MOBILE_YEARS_PER_VIEW = 2;

  // Signals
  private allHeaders = signal<string[]>([]);
  private windowStartIndex = signal(0);
  private isMobile = signal(false);

  // Computed
  currentWindow = computed(() => this.calculateWindow());

  constructor() {
    this.detectMobileBreakpoint();
    window.addEventListener('resize', () => this.detectMobileBreakpoint());
  }

  /**
   * Initialize with all available year headers
   */
  setHeaders(headers: string[]): void {
    this.allHeaders.set(headers);
    // Reset window to show most recent 3 years
    const maxStart = Math.max(0, headers.length - this.yearsPerView());
    this.windowStartIndex.set(maxStart);
  }

  /**
   * Get filtered headers for current window
   */
  getVisibleHeaders(): string[] {
    const window = this.currentWindow();
    return window.visibleYears;
  }

  /**
   * Get filtered values for a row (only visible year columns)
   */
  getVisibleRowValues(allValues: number[]): number[] {
    const window = this.currentWindow();
    return allValues.slice(window.startIndex, window.endIndex + 1);
  }

  /**
   * Navigate to next year window
   */
  nextWindow(): void {
    const headers = this.allHeaders();
    const maxStart = Math.max(0, headers.length - this.yearsPerView());
    const currentStart = this.windowStartIndex();

    if (currentStart < maxStart) {
      this.windowStartIndex.set(Math.min(currentStart + 1, maxStart));
    }
  }

  /**
   * Navigate to previous year window
   */
  previousWindow(): void {
    const currentStart = this.windowStartIndex();
    if (currentStart > 0) {
      this.windowStartIndex.set(currentStart - 1);
    }
  }

  /**
   * Reset to show most recent years
   */
  resetToLatest(): void {
    const headers = this.allHeaders();
    const maxStart = Math.max(0, headers.length - this.yearsPerView());
    this.windowStartIndex.set(maxStart);
  }

  /**
   * Set window to show all data (for edit mode)
   */
  showAllData(): void {
    this.windowStartIndex.set(0);
  }

  /**
   * Get current window state for UI
   */
  getWindow(): YearWindow {
    return this.currentWindow();
  }

  /**
   * Get original column index for a visible column (for data updates)
   */
  getOriginalColumnIndex(visibleColumnIndex: number): number {
    const window = this.currentWindow();
    return window.startIndex + visibleColumnIndex;
  }

  /**
   * Check if in view-only (3-year) mode or edit mode (all years)
   */
  isShowingAllYears(): boolean {
    return (
      this.windowStartIndex() === 0 &&
      this.allHeaders().length === this.yearsPerView()
    );
  }

  /**
   * Private: Calculate current window
   */
  private calculateWindow(): YearWindow {
    const headers = this.allHeaders();
    const yearsPerView = this.yearsPerView();
    const startIdx = this.windowStartIndex();
    const endIdx = Math.min(startIdx + yearsPerView - 1, headers.length - 1);

    const visibleYears = headers.slice(startIdx, endIdx + 1);
    const hasNext = endIdx < headers.length - 1;
    const hasPrev = startIdx > 0;

    return {
      startIndex: startIdx,
      endIndex: endIdx,
      visibleYears,
      hasNextWindow: hasNext,
      hasPreviousWindow: hasPrev,
    };
  }

  /**
   * Detect mobile breakpoint (tablet and below = < 1024px / lg breakpoint)
   */
  private detectMobileBreakpoint(): void {
    this.isMobile.set(window.innerWidth < 1024);
  }

  /**
   * Get years per view based on screen size
   */
  private yearsPerView(): number {
    return this.isMobile() ? this.MOBILE_YEARS_PER_VIEW : this.YEARS_PER_VIEW;
  }
}
