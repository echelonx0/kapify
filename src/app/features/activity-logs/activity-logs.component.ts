import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  Activity,
  ActivityRepositoryService,
  ActivityFilters,
  PaginatedResponse,
} from './activity-repository.service';
import { ActivityExportService } from './activity-export.service';

interface ActivityGroup {
  label: string;
  activities: Activity[];
}

@Component({
  selector: 'app-activity-logs',
  templateUrl: './activity-logs.component.html',

  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ActivityLogsComponent implements OnInit, OnDestroy {
  private activityRepository = inject(ActivityRepositoryService);
  private exportService = inject(ActivityExportService);
  private destroy$ = new Subject<void>();

  // Expose Math to template
  readonly Math = Math;

  // State signals
  activities = signal<Activity[]>([]);
  loading = signal(false);
  exporting = signal(false);
  error = signal<string | null>(null);
  currentPage = signal(1);
  hasMore = signal(false);
  totalCount = signal(0);

  // Filter signals
  showFilters = signal(false);
  selectedTypes = signal<Activity['type'][]>([]);
  selectedStatus = signal<Activity['status'][]>([]);
  searchQuery = signal('');
  dateRangeStart = signal<string>('');
  dateRangeEnd = signal<string>('');

  // Computed
  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.selectedTypes().length > 0) count++;
    if (this.selectedStatus().length > 0) count++;
    if (this.searchQuery()) count++;
    if (this.dateRangeStart() || this.dateRangeEnd()) count++;
    return count;
  });

  groupedActivities = computed(() => {
    return this.groupActivitiesByDate(this.activities());
  });

  activityTypes: Activity['type'][] = [
    'application',
    'funding',
    'profile',
    'document',
    'system',
    'partnership',
    'milestone',
  ];

  activityStatuses: Activity['status'][] = ['completed', 'pending', 'failed'];

  ngOnInit(): void {
    this.loadActivities();
    this.subscribeToActivities();
  }

  /**
   * Load activities with current filters
   */
  private loadActivities(): void {
    this.loading.set(true);
    this.error.set(null);

    const filters = this.buildFilters();
    this.activityRepository
      .getActivitiesPaginated(this.currentPage(), filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PaginatedResponse) => {
          this.activities.set(response.data);
          this.hasMore.set(response.hasMore);
          this.totalCount.set(response.total);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Load error:', err);
          this.error.set('Failed to load activities. Please try again.');
          this.loading.set(false);
        },
      });
  }

  /**
   * Subscribe to real-time activity updates
   */
  private subscribeToActivities(): void {
    this.activityRepository.activities$
      .pipe(takeUntil(this.destroy$))
      .subscribe((activities) => {
        // Update if on first page
        if (this.currentPage() === 1 && activities.length > 0) {
          this.activities.set(activities);
        }
      });
  }

  /**
   * Build filters from current state
   */
  private buildFilters(): ActivityFilters | undefined {
    const filters: Partial<ActivityFilters> = {};

    if (this.selectedTypes().length > 0) {
      filters.types = this.selectedTypes();
    }

    if (this.selectedStatus().length > 0) {
      filters.status = this.selectedStatus();
    }

    if (this.searchQuery()) {
      filters.search = this.searchQuery();
    }

    if (this.dateRangeStart() || this.dateRangeEnd()) {
      const start = this.dateRangeStart()
        ? new Date(this.dateRangeStart())
        : new Date(0);
      const end = this.dateRangeEnd()
        ? new Date(this.dateRangeEnd())
        : new Date();

      filters.dateRange = { start, end };
    }

    return Object.keys(filters).length > 0
      ? (filters as ActivityFilters)
      : undefined;
  }

  /**
   * Group activities by date
   */
  private groupActivitiesByDate(activities: Activity[]): ActivityGroup[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);

    const groups: { [key: string]: Activity[] } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    activities.forEach((activity) => {
      const actDate = new Date(activity.created_at);
      const actDateOnly = new Date(
        actDate.getFullYear(),
        actDate.getMonth(),
        actDate.getDate()
      );

      if (actDateOnly.getTime() === today.getTime()) {
        groups['today'].push(activity);
      } else if (actDateOnly.getTime() === yesterday.getTime()) {
        groups['yesterday'].push(activity);
      } else if (actDate >= weekStart) {
        groups['thisWeek'].push(activity);
      } else {
        groups['older'].push(activity);
      }
    });

    const result: ActivityGroup[] = [];
    if (groups['today'].length > 0)
      result.push({ label: 'Today', activities: groups['today'] });
    if (groups['yesterday'].length > 0)
      result.push({ label: 'Yesterday', activities: groups['yesterday'] });
    if (groups['thisWeek'].length > 0)
      result.push({ label: 'This Week', activities: groups['thisWeek'] });
    if (groups['older'].length > 0)
      result.push({ label: 'Older', activities: groups['older'] });

    return result;
  }

  /**
   * Toggle type filter
   */
  toggleType(type: Activity['type']): void {
    const current = this.selectedTypes();
    if (current.includes(type)) {
      this.selectedTypes.set(current.filter((t) => t !== type));
    } else {
      this.selectedTypes.set([...current, type]);
    }
    this.currentPage.set(1);
    this.loadActivities();
  }

  /**
   * Toggle status filter
   */
  toggleStatus(status: Activity['status']): void {
    const current = this.selectedStatus();
    if (current.includes(status)) {
      this.selectedStatus.set(current.filter((s) => s !== status));
    } else {
      this.selectedStatus.set([...current, status]);
    }
    this.currentPage.set(1);
    this.loadActivities();
  }

  /**
   * Handle search input
   */
  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadActivities();
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.onSearch(value);
  }

  onDateRangeStartChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dateRangeStart.set(value);
    this.onDateRangeChange();
  }

  onDateRangeEndChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dateRangeEnd.set(value);
    this.onDateRangeChange();
  }

  /**
   * Handle date range change
   */
  onDateRangeChange(): void {
    this.currentPage.set(1);
    this.loadActivities();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.selectedTypes.set([]);
    this.selectedStatus.set([]);
    this.searchQuery.set('');
    this.dateRangeStart.set('');
    this.dateRangeEnd.set('');
    this.currentPage.set(1);
    this.loadActivities();
  }

  /**
   * Pagination: next page
   */
  nextPage(): void {
    if (this.hasMore()) {
      this.currentPage.update((p) => p + 1);
      this.loadActivities();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Pagination: previous page
   */
  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
      this.loadActivities();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Export to Excel
   */
  async exportExcel(): Promise<void> {
    this.exporting.set(true);
    try {
      const filters = this.buildFilters();
      await this.exportService.exportToExcel(filters);
    } catch (err) {
      this.error.set('Failed to export to Excel');
      console.error(err);
    } finally {
      this.exporting.set(false);
    }
  }

  /**
   * Export to PDF
   */
  async exportPdf(): Promise<void> {
    this.exporting.set(true);
    try {
      const filters = this.buildFilters();
      await this.exportService.exportToPdf(filters);
    } catch (err) {
      this.error.set('Failed to export to PDF');
      console.error(err);
    } finally {
      this.exporting.set(false);
    }
  }

  /**
   * Refresh activities
   */
  refresh(): void {
    this.activityRepository.clearCache();
    this.loadActivities();
  }

  /**
   * Get activity icon based on type
   */
  getActivityIcon(type: Activity['type']): string {
    const icons: { [key in Activity['type']]: string } = {
      application: 'file-text',
      funding: 'dollar-sign',
      profile: 'user',
      document: 'upload',
      system: 'settings',
      partnership: 'handshake',
      milestone: 'flag',
    };
    return icons[type] || 'circle';
  }

  /**
   * Get activity color based on type
   */
  getActivityColor(type: Activity['type']): string {
    const colors: { [key in Activity['type']]: string } = {
      application: 'bg-teal-100 text-teal-600',
      funding: 'bg-green-100 text-green-600',
      profile: 'bg-blue-100 text-blue-600',
      document: 'bg-amber-100 text-amber-600',
      system: 'bg-slate-100 text-slate-600',
      partnership: 'bg-purple-100 text-purple-600',
      milestone: 'bg-rose-100 text-rose-600',
    };
    return colors[type] || 'bg-slate-100 text-slate-600';
  }

  /**
   * Get status badge color
   */
  getStatusBadgeColor(status: Activity['status']): string {
    const colors: { [key in Activity['status']]: string } = {
      completed: 'bg-green-50 text-green-700 border border-green-200/50',
      pending: 'bg-amber-50 text-amber-700 border border-amber-200/50',
      failed: 'bg-red-50 text-red-700 border border-red-200/50',
    };
    return colors[status];
  }

  /**
   * Format date/time
   */
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Capitalize text
   */
  capitalizeText(text: string): string {
    return text
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Cleanup
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
