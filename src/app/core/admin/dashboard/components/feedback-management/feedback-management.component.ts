// src/app/admin/feedback/admin-feedback.component.ts
import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Bug,
  Lightbulb,
  Filter,
  Search,
  ThumbsUp,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreVertical,
  Eye,
  Trash2,
  UserCheck,
  Flag,
} from 'lucide-angular';
import {
  FeedbackService,
  Feedback,
  FeedbackPriority,
  FeedbackStatus,
} from '../../../services/feedback.service';

@Component({
  selector: 'app-admin-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50">
      <!-- Header -->
      <div class="bg-white border-b border-slate-200 px-8 py-6">
        <div class="max-w-7xl mx-auto">
          <h1 class="text-2xl font-bold text-slate-900 mb-2">
            Feedback Management
          </h1>
          <p class="text-slate-600">
            Manage bug reports and feature requests from users
          </p>
        </div>
      </div>

      <!-- Stats Section -->
      <div class="max-w-7xl mx-auto px-8 py-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div
            class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-600">Total</span>
              <div
                class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"
              >
                <lucide-icon
                  [img]="FilterIcon"
                  [size]="16"
                  class="text-slate-600"
                />
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900">{{ stats().total }}</p>
          </div>

          <div
            class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-600">Bugs</span>
              <div
                class="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center"
              >
                <lucide-icon [img]="BugIcon" [size]="16" class="text-red-600" />
              </div>
            </div>
            <p class="text-2xl font-bold text-red-600">{{ stats().bugs }}</p>
          </div>

          <div
            class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-600">Features</span>
              <div
                class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center"
              >
                <lucide-icon
                  [img]="LightbulbIcon"
                  [size]="16"
                  class="text-blue-600"
                />
              </div>
            </div>
            <p class="text-2xl font-bold text-blue-600">
              {{ stats().features }}
            </p>
          </div>

          <div
            class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-600"
                >In Progress</span
              >
              <div
                class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"
              >
                <lucide-icon
                  [img]="ClockIcon"
                  [size]="16"
                  class="text-amber-600"
                />
              </div>
            </div>
            <p class="text-2xl font-bold text-amber-600">
              {{ stats().inProgress }}
            </p>
          </div>

          <div
            class="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-slate-600">Completed</span>
              <div
                class="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"
              >
                <lucide-icon
                  [img]="CheckCircleIcon"
                  [size]="16"
                  class="text-green-600"
                />
              </div>
            </div>
            <p class="text-2xl font-bold text-green-600">
              {{ stats().completed }}
            </p>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <!-- Search -->
            <div class="md:col-span-2">
              <div class="relative">
                <lucide-icon
                  [img]="SearchIcon"
                  [size]="18"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  [(ngModel)]="searchQuery"
                  (input)="applyFilters()"
                  placeholder="Search feedback..."
                  class="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </div>

            <!-- Type Filter -->
            <div>
              <select
                [(ngModel)]="filterType"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="bug">Bugs Only</option>
                <option value="feature">Features Only</option>
              </select>
            </div>

            <!-- Status Filter -->
            <div>
              <select
                [(ngModel)]="filterStatus"
                (change)="applyFilters()"
                class="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="wont_fix">Won't Fix</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Feedback List -->
        <div
          class="bg-white rounded-xl border border-slate-200 overflow-hidden"
        >
          @if (isLoading()) {
          <div class="p-12 text-center">
            <div
              class="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            ></div>
            <p class="text-slate-600">Loading feedback...</p>
          </div>
          } @else if (filteredFeedback().length === 0) {
          <div class="p-12 text-center">
            <div
              class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <lucide-icon
                [img]="SearchIcon"
                [size]="24"
                class="text-slate-400"
              />
            </div>
            <p class="text-slate-600 font-medium mb-1">No feedback found</p>
            <p class="text-sm text-slate-500">Try adjusting your filters</p>
          </div>
          } @else {
          <div class="divide-y divide-slate-200">
            @for (item of filteredFeedback(); track item.id) {
            <div
              class="p-6 hover:bg-slate-50 transition-colors cursor-pointer"
              (click)="selectFeedback(item)"
            >
              <div class="flex items-start gap-4">
                <!-- Type Icon -->
                <div [class]="getTypeIconClass(item.type)">
                  <lucide-icon
                    [img]="item.type === 'bug' ? BugIcon : LightbulbIcon"
                    [size]="20"
                    class="text-white"
                  />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-4 mb-2">
                    <div class="flex-1">
                      <h3 class="font-semibold text-slate-900 mb-1">
                        {{ item.title }}
                      </h3>
                      <p class="text-sm text-slate-600 line-clamp-2">
                        {{ item.description }}
                      </p>
                    </div>

                    <!-- Priority Badge -->
                    <div [class]="getPriorityBadgeClass(item.priority)">
                      {{ item.priority }}
                    </div>
                  </div>

                  <!-- Meta Info -->
                  <div class="flex items-center gap-4 text-xs text-slate-500">
                    <div class="flex items-center gap-1">
                      <lucide-icon [img]="ThumbsUpIcon" [size]="14" />
                      <span>{{ item.upvotes }}</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <lucide-icon [img]="MessageSquareIcon" [size]="14" />
                      <span>{{ item.commentCount }}</span>
                    </div>
                    <span>{{ formatDate(item.createdAt) }}</span>
                    @if (item.userFirstName) {
                    <span
                      >by {{ item.userFirstName }} {{ item.userLastName }}</span
                    >
                    }
                  </div>

                  <!-- Status Badge -->
                  <div class="mt-3">
                    <span [class]="getStatusBadgeClass(item.status)">
                      {{ formatStatus(item.status) }}
                    </span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2">
                  <button
                    (click)="viewDetails($event, item)"
                    class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <lucide-icon
                      [img]="EyeIcon"
                      [size]="18"
                      class="text-slate-600"
                    />
                  </button>

                  <button
                    (click)="openActionMenu($event, item)"
                    class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    title="More Actions"
                  >
                    <lucide-icon
                      [img]="MoreVerticalIcon"
                      [size]="18"
                      class="text-slate-600"
                    />
                  </button>
                </div>
              </div>
            </div>
            }
          </div>
          }
        </div>
      </div>
    </div>

    <!-- Detail Modal (simplified for now) -->
    @if (selectedFeedback()) {
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      (click)="closeDetails()"
    >
      <div class="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>

      <div
        class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        (click)="$event.stopPropagation()"
      >
        <!-- Header -->
        <div class="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <div
                  [class]="
                    getTypeIconClass(selectedFeedback()!.type) + ' !w-8 !h-8'
                  "
                >
                  <lucide-icon
                    [img]="
                      selectedFeedback()!.type === 'bug'
                        ? BugIcon
                        : LightbulbIcon
                    "
                    [size]="16"
                    class="text-white"
                  />
                </div>
                <h2 class="text-xl font-bold text-slate-900">
                  {{ selectedFeedback()!.title }}
                </h2>
              </div>
              <div class="flex items-center gap-3 text-sm text-slate-600">
                <span>ID: {{ selectedFeedback()!.id.slice(0, 8) }}</span>
                <span>•</span>
                <span>{{ formatDate(selectedFeedback()!.createdAt) }}</span>
                @if (selectedFeedback()!.userFirstName) {
                <span>•</span>
                <span
                  >{{ selectedFeedback()!.userFirstName }}
                  {{ selectedFeedback()!.userLastName }}</span
                >
                }
              </div>
            </div>

            <button
              (click)="closeDetails()"
              class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <lucide-icon
                [img]="XCircleIcon"
                [size]="20"
                class="text-slate-600"
              />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <!-- Description -->
          <div class="mb-6">
            <h3 class="text-sm font-semibold text-slate-900 mb-2">
              Description
            </h3>
            <p class="text-slate-700 whitespace-pre-wrap">
              {{ selectedFeedback()!.description }}
            </p>
          </div>

          <!-- Metadata -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h4 class="text-xs font-semibold text-slate-600 mb-1">Status</h4>
              <select
                [(ngModel)]="selectedFeedback()!.status"
                (change)="updateStatus(selectedFeedback()!)"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="wont_fix">Won't Fix</option>
                <option value="duplicate">Duplicate</option>
              </select>
            </div>

            <div>
              <h4 class="text-xs font-semibold text-slate-600 mb-1">
                Priority
              </h4>
              <select
                [(ngModel)]="selectedFeedback()!.priority"
                (change)="updatePriority(selectedFeedback()!)"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <!-- Browser Info (if available) -->
          @if (selectedFeedback()!.browserInfo) {
          <div class="mb-6">
            <h3 class="text-sm font-semibold text-slate-900 mb-2">
              Browser Information
            </h3>
            <div
              class="bg-slate-50 rounded-lg p-3 text-xs font-mono text-slate-700"
            >
              <div>{{ selectedFeedback()!.browserInfo.userAgent }}</div>
              <div class="mt-1 text-slate-500">
                {{ selectedFeedback()!.browserInfo.platform }} •
                {{ selectedFeedback()!.browserInfo.screenResolution }}
              </div>
            </div>
          </div>
          }

          <!-- Page URL -->
          @if (selectedFeedback()!.pageUrl) {
          <div>
            <h3 class="text-sm font-semibold text-slate-900 mb-2">Page URL</h3>
            <a
              [href]="selectedFeedback()!.pageUrl"
              target="_blank"
              class="text-sm text-teal-600 hover:text-teal-700 underline break-all"
            >
              {{ selectedFeedback()!.pageUrl }}
            </a>
          </div>
          }
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `,
  ],
})
export class AdminFeedbackComponent implements OnInit {
  private feedbackService = inject(FeedbackService);

  // Icons
  BugIcon = Bug;
  LightbulbIcon = Lightbulb;
  FilterIcon = Filter;
  SearchIcon = Search;
  ThumbsUpIcon = ThumbsUp;
  MessageSquareIcon = MessageSquare;
  ClockIcon = Clock;
  CheckCircleIcon = CheckCircle;
  AlertCircleIcon = AlertCircle;
  XCircleIcon = XCircle;
  MoreVerticalIcon = MoreVertical;
  EyeIcon = Eye;
  Trash2Icon = Trash2;
  UserCheckIcon = UserCheck;
  FlagIcon = Flag;

  // State
  allFeedback = signal<Feedback[]>([]);
  filteredFeedback = signal<Feedback[]>([]);
  selectedFeedback = signal<Feedback | null>(null);
  isLoading = signal(true);

  // Filters
  searchQuery = '';
  filterType: 'all' | 'bug' | 'feature' = 'all';
  filterStatus: string = 'all';

  // Stats
  stats = computed(() => {
    const feedback = this.allFeedback();
    return {
      total: feedback.length,
      bugs: feedback.filter((f) => f.type === 'bug').length,
      features: feedback.filter((f) => f.type === 'feature').length,
      submitted: feedback.filter((f) => f.status === 'submitted').length,
      inProgress: feedback.filter((f) => f.status === 'in_progress').length,
      completed: feedback.filter((f) => f.status === 'completed').length,
    };
  });

  ngOnInit() {
    this.loadFeedback();
  }

  loadFeedback() {
    this.isLoading.set(true);
    this.feedbackService.getAllFeedback().subscribe({
      next: (feedback) => {
        this.allFeedback.set(feedback);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load feedback:', error);
        this.isLoading.set(false);
      },
    });
  }

  applyFilters() {
    let filtered = this.allFeedback();

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          f.description.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (this.filterType !== 'all') {
      filtered = filtered.filter((f) => f.type === this.filterType);
    }

    // Status filter
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter((f) => f.status === this.filterStatus);
    }

    this.filteredFeedback.set(filtered);
  }

  selectFeedback(feedback: Feedback) {
    this.selectedFeedback.set(feedback);
  }

  closeDetails() {
    this.selectedFeedback.set(null);
  }

  viewDetails(event: Event, feedback: Feedback) {
    event.stopPropagation();
    this.selectFeedback(feedback);
  }

  openActionMenu(event: Event, feedback: Feedback) {
    event.stopPropagation();
    // TODO: Implement action menu
  }

  updateStatus(feedback: Feedback) {
    this.feedbackService
      .updateFeedbackStatus(feedback.id, feedback.status)
      .subscribe({
        next: () => {
          console.log('Status updated');
          this.loadFeedback();
        },
        error: (error) => {
          console.error('Failed to update status:', error);
        },
      });
  }

  updatePriority(feedback: Feedback) {
    this.feedbackService
      .updateFeedbackPriority(feedback.id, feedback.priority)
      .subscribe({
        next: () => {
          console.log('Priority updated');
          this.loadFeedback();
        },
        error: (error) => {
          console.error('Failed to update priority:', error);
        },
      });
  }

  getTypeIconClass(type: string): string {
    const base =
      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0';
    return type === 'bug' ? `${base} bg-red-500` : `${base} bg-blue-500`;
  }

  getPriorityBadgeClass(priority: FeedbackPriority): string {
    const base = 'px-2 py-1 rounded-full text-xs font-semibold';
    switch (priority) {
      case 'critical':
        return `${base} bg-red-100 text-red-700`;
      case 'high':
        return `${base} bg-orange-100 text-orange-700`;
      case 'medium':
        return `${base} bg-amber-100 text-amber-700`;
      case 'low':
        return `${base} bg-slate-100 text-slate-700`;
      default:
        return `${base} bg-slate-100 text-slate-700`;
    }
  }

  getStatusBadgeClass(status: FeedbackStatus): string {
    const base =
      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold';
    switch (status) {
      case 'submitted':
        return `${base} bg-blue-100 text-blue-700`;
      case 'under_review':
        return `${base} bg-purple-100 text-purple-700`;
      case 'in_progress':
        return `${base} bg-amber-100 text-amber-700`;
      case 'completed':
        return `${base} bg-green-100 text-green-700`;
      case 'wont_fix':
        return `${base} bg-slate-100 text-slate-700`;
      case 'duplicate':
        return `${base} bg-slate-100 text-slate-700`;
      default:
        return `${base} bg-slate-100 text-slate-700`;
    }
  }

  formatStatus(status: FeedbackStatus): string {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}
