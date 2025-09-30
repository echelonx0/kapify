// src/app/SMEs/data-room/components/access-log/access-log.component.ts
import { Component, Input, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Eye, Download, Share2, Calendar, User, Filter, X, FileDown } from 'lucide-angular';
import { UiButtonComponent, UiCardComponent } from 'src/app/shared/components';
import { DataRoomAccessService } from '../../services/data-room-access.service';
import { DataRoomAccessLog, AccessLogFilters } from '../../models/data-room.models';

@Component({
  selector: 'app-access-log',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    UiButtonComponent,
    UiCardComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Access Log</h2>
          <p class="text-gray-600 mt-1">Track and monitor data room access activity</p>
        </div>
        <ui-button variant="outline" (clicked)="exportLog()">
          <lucide-icon [img]="FileDownIcon" [size]="16" class="mr-2" />
          Export Log
        </ui-button>
      </div>

      <!-- Filters -->
      <ui-card class="p-4">
        <div class="flex items-center gap-2 mb-4">
          <lucide-icon [img]="FilterIcon" [size]="20" class="text-gray-500" />
          <h3 class="font-medium text-gray-900">Filters</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Action Type Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
            <select
              [(ngModel)]="filters.actionType"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="">All Actions</option>
              <option value="view">View</option>
              <option value="download">Download</option>
              <option value="export">Export</option>
              <option value="share">Share</option>
            </select>
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              [(ngModel)]="filters.startDate"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              [(ngModel)]="filters.endDate"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>

          <!-- Section Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              [(ngModel)]="filters.sectionKey"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            >
              <option value="">All Sections</option>
              <option value="executive">Executive Summary</option>
              <option value="financials">Financial Dashboard</option>
              <option value="documents">Documents</option>
              <option value="management">Management Team</option>
              <option value="market">Market Analysis</option>
              <option value="legal">Legal & Compliance</option>
            </select>
          </div>
        </div>

        @if (hasActiveFilters()) {
          <div class="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <span class="text-sm text-gray-600">Active filters applied</span>
            <button
              (click)="clearFilters()"
              class="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear all
            </button>
          </div>
        }
      </ui-card>

      <!-- Access Log Table -->
      @if (isLoading()) {
        <div class="text-center py-12">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-gray-600">Loading access log...</p>
        </div>
      } @else if (logs().length === 0) {
        <ui-card class="p-12">
          <div class="text-center">
            <lucide-icon [img]="EyeIcon" [size]="48" class="text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Access Activity</h3>
            <p class="text-gray-600">
              @if (hasActiveFilters()) {
                No activity found matching your filters
              } @else {
                No one has accessed this data room yet
              }
            </p>
          </div>
        </ui-card>
      } @else {
        <ui-card>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                @for (log of logs(); track log.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium text-sm mr-3">
                          {{ getInitials(log.user?.name || log.user?.email || 'U') }}
                        </div>
                        <div>
                          <div class="text-sm font-medium text-gray-900">
                            {{ log.user?.name || log.user?.email || 'Unknown User' }}
                          </div>
                          @if (log.user?.name && log.user?.email) {
                            <div class="text-xs text-gray-500">{{ log.user.email }}</div>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center gap-2">
                        <lucide-icon [img]="getActionIcon(log.actionType)" [size]="16" [class]="getActionColor(log.actionType)" />
                        <span [class]="'text-sm font-medium ' + getActionColor(log.actionType)">
                          {{ formatActionType(log.actionType) }}
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm text-gray-900">
                        @if (log.document) {
                          {{ log.document.title }}
                        } @else if (log.sectionKey) {
                          {{ formatSectionKey(log.sectionKey) }} Section
                        } @else {
                          Data Room
                        }
                      </div>
                      @if (log.sectionKey && log.document) {
                        <div class="text-xs text-gray-500">{{ formatSectionKey(log.sectionKey) }}</div>
                      }
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ log.ipAddress || 'N/A' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {{ formatTimestamp(log.createdAt) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalCount() > pageSize) {
            <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Showing {{ (currentPage() - 1) * pageSize + 1 }} to {{ Math.min(currentPage() * pageSize, totalCount()) }} of {{ totalCount() }} results
              </div>
              <div class="flex gap-2">
                <ui-button
                  variant="outline"
                  size="sm"
                  (clicked)="previousPage()"
                  [disabled]="currentPage() === 1"
                >
                  Previous
                </ui-button>
                <ui-button
                  variant="outline"
                  size="sm"
                  (clicked)="nextPage()"
                  [disabled]="currentPage() * pageSize >= totalCount()"
                >
                  Next
                </ui-button>
              </div>
            </div>
          }
        </ui-card>
      }
    </div>
  `
})
export class AccessLogComponent implements OnInit {
  @Input({ required: true }) dataRoomId!: string;

  private accessService = inject(DataRoomAccessService);

  // Icons
  EyeIcon = Eye;
  DownloadIcon = Download;
  Share2Icon = Share2;
  CalendarIcon = Calendar;
  UserIcon = User;
  FilterIcon = Filter;
  XIcon = X;
  FileDownIcon = FileDown;

  // State
  logs = signal<DataRoomAccessLog[]>([]);
  isLoading = signal(false);
  currentPage = signal(1);
  totalCount = signal(0);
  pageSize = 20;

  Math = Math;

  // Filters
  filters: any = {
    actionType: '',
    startDate: '',
    endDate: '',
    sectionKey: ''
  };

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.isLoading.set(true);

    const accessFilters: AccessLogFilters = {
      actionType: this.filters.actionType || undefined,
      startDate: this.filters.startDate ? new Date(this.filters.startDate) : undefined,
      endDate: this.filters.endDate ? new Date(this.filters.endDate) : undefined,
      sectionKey: this.filters.sectionKey || undefined,
      limit: this.pageSize,
      offset: (this.currentPage() - 1) * this.pageSize
    };

    this.accessService.getAccessLog(this.dataRoomId, accessFilters).subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.totalCount.set(logs.length); // In real impl, get from server
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load access log:', err);
        this.isLoading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadLogs();
  }

  clearFilters(): void {
    this.filters = {
      actionType: '',
      startDate: '',
      endDate: '',
      sectionKey: ''
    };
    this.onFilterChange();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filters.actionType ||
      this.filters.startDate ||
      this.filters.endDate ||
      this.filters.sectionKey
    );
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadLogs();
    }
  }

  nextPage(): void {
    if (this.currentPage() * this.pageSize < this.totalCount()) {
      this.currentPage.update(p => p + 1);
      this.loadLogs();
    }
  }

  exportLog(): void {
    const csv = this.generateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `access-log-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private generateCSV(): string {
    const headers = ['User', 'Email', 'Action', 'Resource', 'Section', 'IP Address', 'Timestamp'];
    const rows = this.logs().map(log => [
      log.user?.name || 'Unknown',
      log.user?.email || 'N/A',
      this.formatActionType(log.actionType),
      log.document?.title || log.sectionKey || 'Data Room',
      log.sectionKey ? this.formatSectionKey(log.sectionKey) : 'N/A',
      log.ipAddress || 'N/A',
      this.formatTimestamp(log.createdAt)
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getActionIcon(action: string): any {
    const icons: Record<string, any> = {
      'view': this.EyeIcon,
      'download': this.DownloadIcon,
      'share': this.Share2Icon,
      'export': this.FileDownIcon
    };
    return icons[action] || this.EyeIcon;
  }

  getActionColor(action: string): string {
    const colors: Record<string, string> = {
      'view': 'text-blue-600',
      'download': 'text-green-600',
      'share': 'text-purple-600',
      'export': 'text-orange-600'
    };
    return colors[action] || 'text-gray-600';
  }

  formatActionType(action: string): string {
    return action.charAt(0).toUpperCase() + action.slice(1);
  }

  formatSectionKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatTimestamp(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}