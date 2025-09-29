// src/app/SMEs/data-room/components/access-analytics/access-analytics-dashboard.component.ts
import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Eye, Download, Users, TrendingUp, FileText, Clock } from 'lucide-angular';
import { UiCardComponent } from 'src/app/shared/components';
import { DataRoomAccessService } from '../../services/data-room-access.service';
import { AccessSummary, DataRoomAccessLog } from '../../models/data-room.models';

@Component({
  selector: 'app-access-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    UiCardComponent
  ],
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Access Analytics</h2>
        <p class="text-gray-600 mt-1">Insights into how your data room is being accessed</p>
      </div>

      @if (isLoading()) {
        <div class="text-center py-12">
          <div class="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-gray-600">Loading analytics...</p>
        </div>
      } @else if (summary()) {
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <!-- Total Views -->
          <ui-card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <lucide-icon [img]="EyeIcon" [size]="24" class="text-blue-600" />
              </div>
              <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-blue-500" />
            </div>
            <div class="space-y-1">
              <div class="text-3xl font-bold text-gray-900">{{ summary()!.totalViews }}</div>
              <div class="text-sm text-gray-500">Total Views</div>
              <div class="text-xs text-blue-600 font-medium">All-time</div>
            </div>
          </ui-card>

          <!-- Total Downloads -->
          <ui-card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <lucide-icon [img]="DownloadIcon" [size]="24" class="text-green-600" />
              </div>
              <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-green-500" />
            </div>
            <div class="space-y-1">
              <div class="text-3xl font-bold text-gray-900">{{ summary()!.totalDownloads }}</div>
              <div class="text-sm text-gray-500">Total Downloads</div>
              <div class="text-xs text-green-600 font-medium">All-time</div>
            </div>
          </ui-card>

          <!-- Unique Viewers -->
          <ui-card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <lucide-icon [img]="UsersIcon" [size]="24" class="text-purple-600" />
              </div>
              <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-purple-500" />
            </div>
            <div class="space-y-1">
              <div class="text-3xl font-bold text-gray-900">{{ summary()!.uniqueViewers }}</div>
              <div class="text-sm text-gray-500">Unique Viewers</div>
              <div class="text-xs text-purple-600 font-medium">Total users</div>
            </div>
          </ui-card>

          <!-- Engagement Rate -->
          <ui-card class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <lucide-icon [img]="TrendingUpIcon" [size]="24" class="text-orange-600" />
              </div>
              <lucide-icon [img]="TrendingUpIcon" [size]="20" class="text-orange-500" />
            </div>
            <div class="space-y-1">
              <div class="text-3xl font-bold text-gray-900">{{ getEngagementRate() }}%</div>
              <div class="text-sm text-gray-500">Engagement Rate</div>
              <div class="text-xs text-orange-600 font-medium">Downloads/Views</div>
            </div>
          </ui-card>
        </div>

        <!-- Top Documents -->
        <ui-card class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <lucide-icon [img]="FileTextIcon" [size]="20" />
            Top Documents
          </h3>

          @if (summary()!.topDocuments && summary()!.topDocuments.length > 0) {
            <div class="space-y-4">
              @for (doc of summary()!.topDocuments; track doc.documentId) {
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900">{{ doc.documentTitle }}</h4>
                    <div class="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span class="flex items-center gap-1">
                        <lucide-icon [img]="EyeIcon" [size]="12" />
                        {{ doc.viewCount }} views
                      </span>
                      <span class="flex items-center gap-1">
                        <lucide-icon [img]="DownloadIcon" [size]="12" />
                        {{ doc.downloadCount }} downloads
                      </span>
                      <span class="flex items-center gap-1">
                        <lucide-icon [img]="ClockIcon" [size]="12" />
                        {{ formatDate(doc.lastAccessed) }}
                      </span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-16 text-right">
                      <div class="text-sm font-medium text-gray-900">{{ doc.viewCount + doc.downloadCount }}</div>
                      <div class="text-xs text-gray-500">Total</div>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-gray-500 text-center py-8">No document activity yet</p>
          }
        </ui-card>

        <!-- Recent Activity -->
        <ui-card class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <lucide-icon [img]="ClockIcon" [size]="20" />
            Recent Activity
          </h3>

          @if (summary()!.recentActivity && summary()!.recentActivity.length > 0) {
            <div class="space-y-3">
              @for (activity of summary()!.recentActivity; track activity.id) {
                <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium text-sm flex-shrink-0">
                    {{ getInitials(activity.user?.name || activity.user?.email || 'U') }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-medium text-gray-900 truncate">
                        {{ activity.user?.name || activity.user?.email || 'Unknown User' }}
                      </span>
                      <div [class]="'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ' + getActivityBadgeClass(activity.actionType)">
                        <lucide-icon [img]="getActionIcon(activity.actionType)" [size]="12" />
                        {{ activity.actionType }}
                      </div>
                    </div>
                    <p class="text-sm text-gray-600 truncate">
                      @if (activity.document) {
                        {{ activity.document.title }}
                      } @else if (activity.sectionKey) {
                        {{ formatSectionKey(activity.sectionKey) }} Section
                      } @else {
                        Data Room
                      }
                    </p>
                    <p class="text-xs text-gray-500 mt-1">{{ formatTimestamp(activity.createdAt) }}</p>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-gray-500 text-center py-8">No recent activity</p>
          }
        </ui-card>

        <!-- Activity Timeline Chart (Placeholder) -->
        <ui-card class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Activity Over Time</h3>
          <div class="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p class="text-gray-500">Chart visualization coming soon</p>
          </div>
        </ui-card>
      }
    </div>
  `
})
export class AccessAnalyticsDashboardComponent implements OnInit {
  @Input({ required: true }) dataRoomId!: string;

  private accessService = inject(DataRoomAccessService);

  // Icons
  EyeIcon = Eye;
  DownloadIcon = Download;
  UsersIcon = Users;
  TrendingUpIcon = TrendingUp;
  FileTextIcon = FileText;
  ClockIcon = Clock;

  // State
  summary = signal<AccessSummary | null>(null);
  isLoading = signal(false);

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading.set(true);

    this.accessService.getAccessSummary(this.dataRoomId).subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load analytics:', err);
        this.isLoading.set(false);
      }
    });
  }

  getEngagementRate(): number {
    const s = this.summary();
    if (!s || s.totalViews === 0) return 0;
    return Math.round((s.totalDownloads / s.totalViews) * 100);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getActionIcon(action: string): any {
    const icons: Record<string, any> = {
      'view': this.EyeIcon,
      'download': this.DownloadIcon,
      'share': this.UsersIcon
    };
    return icons[action] || this.EyeIcon;
  }

  getActivityBadgeClass(action: string): string {
    const classes: Record<string, string> = {
      'view': 'bg-blue-100 text-blue-700',
      'download': 'bg-green-100 text-green-700',
      'share': 'bg-purple-100 text-purple-700',
      'export': 'bg-orange-100 text-orange-700'
    };
    return classes[action] || 'bg-gray-100 text-gray-700';
  }

  formatSectionKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }

  formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}